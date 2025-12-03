#!/bin/bash

# 🚀 Hostinger Deployment Quick Setup Script
# This script helps you prepare files for Hostinger deployment

echo "=================================================="
echo "🚀 PDI System - Hostinger Deployment Setup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/passenger_wsgi.py" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking Backend Files...${NC}"
if [ -f "backend/.htaccess" ]; then
    echo -e "${GREEN}✅ .htaccess found${NC}"
else
    echo -e "${RED}❌ .htaccess missing${NC}"
    exit 1
fi

if [ -f "backend/passenger_wsgi.py" ]; then
    echo -e "${GREEN}✅ passenger_wsgi.py found${NC}"
else
    echo -e "${RED}❌ passenger_wsgi.py missing${NC}"
    exit 1
fi

if [ -f "backend/requirements.txt" ]; then
    echo -e "${GREEN}✅ requirements.txt found${NC}"
else
    echo -e "${RED}❌ requirements.txt missing${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Creating .env.example file...${NC}"
cat > backend/.env.example << 'EOF'
# Hostinger Production Environment Variables

# DATABASE CONFIGURATION
MYSQL_HOST=localhost
MYSQL_USER=your_hostinger_db_username
MYSQL_PASSWORD=your_hostinger_db_password
MYSQL_DB=pdi_database

# FLASK CONFIGURATION
SECRET_KEY=your-secret-key-here-change-in-production
FLASK_ENV=production
DEBUG=False

# FILE UPLOAD
MAX_CONTENT_LENGTH=524288000
UPLOAD_FOLDER=uploads
GENERATED_PDF_FOLDER=generated_pdfs

# CORS
FRONTEND_URL=https://your-domain.com
EOF
echo -e "${GREEN}✅ .env.example created${NC}"

echo ""
echo -e "${YELLOW}Step 3: Creating deployment package...${NC}"
cd backend

# Create a deployment folder
DEPLOY_DIR="pdi_backend_deploy_$(date +%Y%m%d_%H%M%S)"
mkdir -p "../$DEPLOY_DIR"

# Copy necessary files
echo "  📦 Copying backend files..."
cp -r app "../$DEPLOY_DIR/"
cp -r uploads "../$DEPLOY_DIR/" 2>/dev/null || mkdir "../$DEPLOY_DIR/uploads"
cp -r generated_pdfs "../$DEPLOY_DIR/" 2>/dev/null || mkdir "../$DEPLOY_DIR/generated_pdfs"

# Copy configuration files
cp .htaccess "../$DEPLOY_DIR/"
cp passenger_wsgi.py "../$DEPLOY_DIR/"
cp config.py "../$DEPLOY_DIR/"
cp requirements.txt "../$DEPLOY_DIR/"
cp .env.example "../$DEPLOY_DIR/"

# Copy database scripts
cp init_db.py "../$DEPLOY_DIR/" 2>/dev/null
cp create_master_tables.py "../$DEPLOY_DIR/" 2>/dev/null
cp create_coc_tables.py "../$DEPLOY_DIR/" 2>/dev/null

# Create subdirectories
mkdir -p "../$DEPLOY_DIR/uploads/bom_materials"
mkdir -p "../$DEPLOY_DIR/uploads/ipqc_pdfs"
mkdir -p "../$DEPLOY_DIR/uploads/ftr_documents"
mkdir -p "../$DEPLOY_DIR/generated_pdfs"

cd ..

echo -e "${GREEN}✅ Deployment package created: $DEPLOY_DIR${NC}"

echo ""
echo -e "${YELLOW}Step 4: Creating README for deployment...${NC}"
cat > "$DEPLOY_DIR/DEPLOY_README.txt" << 'EOF'
🚀 PDI Backend - Hostinger Deployment Package

UPLOAD INSTRUCTIONS:
====================

1. Connect to Hostinger via FTP/FileZilla:
   - Host: ftp.yourdomain.com (or use hPanel File Manager)
   - Username: Your Hostinger FTP username
   - Password: Your Hostinger FTP password
   - Port: 21

2. Upload ALL files from this folder to:
   /public_html/

3. Create .env file in public_html/:
   - Copy .env.example to .env
   - Update with YOUR actual database credentials
   - Generate strong SECRET_KEY

4. Connect via SSH:
   ssh your_username@yourdomain.com -p 65002

5. Setup Virtual Environment:
   python3 -m venv ~/virtualenv/pdi_backend/3.9
   source ~/virtualenv/pdi_backend/3.9/bin/activate

6. Install Dependencies:
   cd ~/public_html
   pip install -r requirements.txt

7. Update .htaccess:
   - Replace YOUR_USERNAME with your actual Hostinger username
   - Run: whoami (to find your username)

8. Set Directory Permissions:
   chmod -R 755 uploads
   chmod -R 755 generated_pdfs

9. Initialize Database:
   python init_db.py
   python create_master_tables.py
   python create_coc_tables.py

10. Restart Application:
    touch tmp/restart.txt

11. Test:
    curl https://yourdomain.com/api/health

IMPORTANT FILES:
================
- .htaccess           → Apache/Passenger configuration
- passenger_wsgi.py   → Application entry point
- config.py           → Application configuration
- requirements.txt    → Python dependencies
- .env.example        → Environment variables template
- app/                → Application code
- uploads/            → File upload directory
- generated_pdfs/     → PDF storage directory

DATABASE CREDENTIALS:
=====================
Get these from Hostinger Control Panel → Databases → MySQL Databases

Update in .env file:
MYSQL_HOST=localhost
MYSQL_USER=[your_db_username]
MYSQL_PASSWORD=[your_db_password]
MYSQL_DB=pdi_database

TROUBLESHOOTING:
================
- Check logs: ~/public_html/logs/
- Restart app: touch ~/public_html/tmp/restart.txt
- Test connection: python -c "import pymysql; print('OK')"

For detailed instructions, see:
HOSTINGER_DEPLOYMENT_COMPLETE.md
EOF

echo -e "${GREEN}✅ Deployment README created${NC}"

echo ""
echo -e "${YELLOW}Step 5: Creating ZIP archive...${NC}"
if command -v zip &> /dev/null; then
    zip -r "$DEPLOY_DIR.zip" "$DEPLOY_DIR" > /dev/null
    echo -e "${GREEN}✅ ZIP archive created: $DEPLOY_DIR.zip${NC}"
else
    echo -e "${YELLOW}⚠️  'zip' command not found. Creating tar.gz instead...${NC}"
    tar -czf "$DEPLOY_DIR.tar.gz" "$DEPLOY_DIR"
    echo -e "${GREEN}✅ Archive created: $DEPLOY_DIR.tar.gz${NC}"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ DEPLOYMENT PACKAGE READY!${NC}"
echo "=================================================="
echo ""
echo "📦 Package Location: $DEPLOY_DIR/"
echo ""
echo "📋 Next Steps:"
echo "   1. Upload contents of '$DEPLOY_DIR/' to Hostinger public_html/"
echo "   2. Follow instructions in DEPLOY_README.txt"
echo "   3. Or use detailed guide: HOSTINGER_DEPLOYMENT_COMPLETE.md"
echo ""
echo "🚀 Quick Upload Command (if you have SSH access):"
echo "   scp -P 65002 -r $DEPLOY_DIR/* username@yourdomain.com:~/public_html/"
echo ""
echo "=================================================="
