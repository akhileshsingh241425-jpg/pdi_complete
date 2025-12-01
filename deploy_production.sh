#!/bin/bash

# PDI Complete - Production Deployment Script
# Run this script on your production server (Hostinger/VPS)

echo "🚀 PDI Complete - Production Deployment Script"
echo "==============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_NAME="pdi_complete"
BACKEND_PORT=5000
FRONTEND_BUILD_DIR="frontend/build"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if command succeeded
check_success() {
    if [ $? -eq 0 ]; then
        print_success "$1"
    else
        print_error "$1 failed"
        exit 1
    fi
}

echo "Step 1: Collecting Configuration"
echo "---------------------------------"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
print_info "Detected Server IP: $SERVER_IP"

# Get current user
CURRENT_USER=$(whoami)
print_info "Current User: $CURRENT_USER"

# Get home directory
HOME_DIR=$(eval echo ~$CURRENT_USER)
PROJECT_DIR="$HOME_DIR/$PROJECT_NAME"
print_info "Project Directory: $PROJECT_DIR"

echo ""
read -p "Enter MySQL Database Name [pdi_database]: " DB_NAME
DB_NAME=${DB_NAME:-pdi_database}

read -p "Enter MySQL Username [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Enter MySQL Password: " DB_PASSWORD
echo ""

read -p "Enter domain name (or press Enter to use IP: $SERVER_IP): " DOMAIN_NAME
DOMAIN_NAME=${DOMAIN_NAME:-$SERVER_IP}

echo ""
echo "Step 2: Stopping Existing Services"
echo "-----------------------------------"

# Stop any running backend processes
pkill -f "python.*production_server.py" 2>/dev/null && print_info "Stopped existing backend" || print_info "No existing backend running"

# Stop nginx if running
if systemctl is-active --quiet nginx; then
    sudo systemctl stop nginx
    print_info "Stopped Nginx"
fi

echo ""
echo "Step 3: Installing System Dependencies"
echo "---------------------------------------"

print_info "Updating system packages..."
sudo apt-get update -qq

# Install required packages
PACKAGES="python3 python3-pip python3-venv nodejs npm mysql-server nginx"
print_info "Installing: $PACKAGES"
sudo apt-get install -y $PACKAGES >/dev/null 2>&1
check_success "System dependencies installed"

echo ""
echo "Step 4: Setting Up MySQL Database"
echo "----------------------------------"

# Start MySQL if not running
sudo systemctl start mysql
check_success "MySQL started"

# Create database
print_info "Creating database: $DB_NAME"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
check_success "Database created"

# Grant privileges
if [ "$DB_USER" != "root" ]; then
    print_info "Creating MySQL user: $DB_USER"
    sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';" 2>/dev/null
    sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';" 2>/dev/null
    sudo mysql -e "FLUSH PRIVILEGES;" 2>/dev/null
    check_success "MySQL user configured"
fi

echo ""
echo "Step 5: Setting Up Backend"
echo "--------------------------"

cd $PROJECT_DIR/backend

# Create virtual environment
if [ ! -d "venv" ]; then
    print_info "Creating virtual environment..."
    python3 -m venv venv
    check_success "Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
print_info "Upgrading pip..."
pip install --upgrade pip >/dev/null 2>&1
check_success "Pip upgraded"

# Install dependencies
print_info "Installing Python dependencies..."
pip install -r requirements.txt >/dev/null 2>&1
check_success "Python dependencies installed"

# Create .env file
print_info "Creating backend .env file..."
cat > .env << EOF
MYSQL_HOST=localhost
MYSQL_USER=$DB_USER
MYSQL_PASSWORD=$DB_PASSWORD
MYSQL_DB=$DB_NAME
SECRET_KEY=$(openssl rand -hex 32)
FLASK_ENV=production
DEBUG=False
FRONTEND_URL=http://$DOMAIN_NAME
MAX_CONTENT_LENGTH=524288000
UPLOAD_FOLDER=uploads
GENERATED_PDF_FOLDER=generated_pdfs
EOF
check_success "Backend .env file created"

# Create necessary directories
mkdir -p uploads generated_pdfs
check_success "Created upload directories"

# Initialize database
print_info "Initializing database tables..."
python init_db.py
check_success "Database initialized"

# Create master tables (if script exists)
if [ -f "create_master_tables.py" ]; then
    python create_master_tables.py 2>/dev/null
    print_info "Master tables created"
fi

echo ""
echo "Step 6: Setting Up Frontend"
echo "---------------------------"

cd $PROJECT_DIR/frontend

# Install dependencies
print_info "Installing npm dependencies..."
npm install >/dev/null 2>&1
check_success "npm dependencies installed"

# Create frontend .env
print_info "Creating frontend .env file..."
cat > .env << EOF
REACT_APP_API_URL=http://$DOMAIN_NAME:$BACKEND_PORT/api
EOF
check_success "Frontend .env file created"

# Build frontend
print_info "Building React app (this may take a few minutes)..."
npm run build >/dev/null 2>&1
check_success "Frontend built successfully"

echo ""
echo "Step 7: Configuring Nginx"
echo "-------------------------"

# Create Nginx configuration
print_info "Creating Nginx configuration..."
sudo tee $NGINX_AVAILABLE/$PROJECT_NAME > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    # Frontend - Serve React build
    root $PROJECT_DIR/frontend/build;
    index index.html;

    # Serve frontend
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Increase timeouts for large file uploads
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        send_timeout 300;
    }

    # Static files and uploads
    location /uploads {
        alias $PROJECT_DIR/backend/uploads;
    }

    location /generated_pdfs {
        alias $PROJECT_DIR/backend/generated_pdfs;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss;
    gzip_disable "MSIE [1-6]\.";

    # Max upload size
    client_max_body_size 500M;
}
EOF
check_success "Nginx configuration created"

# Enable site
sudo ln -sf $NGINX_AVAILABLE/$PROJECT_NAME $NGINX_ENABLED/$PROJECT_NAME
check_success "Nginx site enabled"

# Remove default site if exists
sudo rm -f $NGINX_ENABLED/default 2>/dev/null

# Test Nginx configuration
print_info "Testing Nginx configuration..."
sudo nginx -t
check_success "Nginx configuration valid"

echo ""
echo "Step 8: Creating Systemd Service for Backend"
echo "---------------------------------------------"

# Create systemd service file
print_info "Creating systemd service..."
sudo tee /etc/systemd/system/$PROJECT_NAME-backend.service > /dev/null << EOF
[Unit]
Description=PDI Complete Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$PROJECT_DIR/backend
Environment="PATH=$PROJECT_DIR/backend/venv/bin"
ExecStart=$PROJECT_DIR/backend/venv/bin/python production_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
check_success "Systemd service created"

# Reload systemd
sudo systemctl daemon-reload
check_success "Systemd reloaded"

echo ""
echo "Step 9: Starting Services"
echo "-------------------------"

# Start backend service
print_info "Starting backend service..."
sudo systemctl start $PROJECT_NAME-backend
check_success "Backend service started"

# Enable backend service to start on boot
sudo systemctl enable $PROJECT_NAME-backend
check_success "Backend service enabled"

# Start Nginx
print_info "Starting Nginx..."
sudo systemctl start nginx
check_success "Nginx started"

# Enable Nginx to start on boot
sudo systemctl enable nginx
check_success "Nginx enabled"

echo ""
echo "Step 10: Verifying Deployment"
echo "------------------------------"

# Wait for services to start
sleep 3

# Check backend status
if sudo systemctl is-active --quiet $PROJECT_NAME-backend; then
    print_success "Backend service is running"
else
    print_error "Backend service is not running"
    echo "Check logs: sudo journalctl -u $PROJECT_NAME-backend -n 50"
fi

# Check Nginx status
if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
fi

# Test backend API
sleep 2
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$BACKEND_PORT/api/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    print_success "Backend API is responding"
else
    print_warning "Backend API health check returned: $HEALTH_CHECK"
fi

# Test Nginx
NGINX_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$NGINX_CHECK" = "200" ]; then
    print_success "Nginx is serving the application"
else
    print_warning "Nginx returned: $NGINX_CHECK"
fi

echo ""
echo "==============================================="
echo "✅ Deployment Complete!"
echo "==============================================="
echo ""
echo "📋 Deployment Summary:"
echo "---------------------"
echo "  🌐 Application URL: http://$DOMAIN_NAME"
echo "  🔌 Backend Port: $BACKEND_PORT"
echo "  📁 Project Directory: $PROJECT_DIR"
echo "  💾 Database: $DB_NAME"
echo ""
echo "🔧 Useful Commands:"
echo "-------------------"
echo "  View backend logs:  sudo journalctl -u $PROJECT_NAME-backend -f"
echo "  Restart backend:    sudo systemctl restart $PROJECT_NAME-backend"
echo "  Restart Nginx:      sudo systemctl restart nginx"
echo "  Check status:       sudo systemctl status $PROJECT_NAME-backend"
echo "  View Nginx logs:    sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🔐 Security Recommendations:"
echo "----------------------------"
echo "  1. Setup SSL certificate (Let's Encrypt): sudo certbot --nginx -d $DOMAIN_NAME"
echo "  2. Configure firewall: sudo ufw allow 'Nginx Full'"
echo "  3. Change default MySQL root password"
echo "  4. Setup regular database backups"
echo "  5. Review and restrict file permissions"
echo ""
echo "📝 Next Steps:"
echo "--------------"
echo "  1. Test all features at: http://$DOMAIN_NAME"
echo "  2. Upload master data (BOM, rejection reasons)"
echo "  3. Create test company and production records"
echo "  4. Generate sample IPQC and reports"
echo ""
print_success "Deployment completed successfully! 🎉"
echo ""
