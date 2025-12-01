#!/bin/bash

# PDI Complete - Quick Start Script
# Use this for rapid local development setup

echo "🚀 PDI Complete - Quick Start"
echo "=============================="
echo ""

# Check if we're in the project root
if [ ! -f "backend/requirements.txt" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the pdi_complete project root directory"
    exit 1
fi

echo "📦 Step 1: Backend Setup"
echo "------------------------"

cd backend

# Create venv if doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Create .env if doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DB=pdi_database
SECRET_KEY=dev-secret-key-change-in-production
FLASK_ENV=development
DEBUG=True
FRONTEND_URL=http://localhost:3000
MAX_CONTENT_LENGTH=524288000
UPLOAD_FOLDER=uploads
GENERATED_PDF_FOLDER=generated_pdfs
EOF
    echo "✅ Created backend .env - Please update MySQL credentials!"
fi

# Create folders
mkdir -p uploads generated_pdfs

echo "✅ Backend setup complete"
cd ..

echo ""
echo "🎨 Step 2: Frontend Setup"
echo "-------------------------"

cd frontend

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Create .env if doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating frontend .env file..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    echo "✅ Created frontend .env"
fi

echo "✅ Frontend setup complete"
cd ..

echo ""
echo "🗄️ Step 3: Database Setup"
echo "-------------------------"
echo "Creating database (you may need to enter MySQL password)..."

# Try to create database
mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS pdi_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database created"
    
    # Initialize tables
    echo "Initializing database tables..."
    cd backend
    source venv/bin/activate
    python init_db.py
    echo "✅ Database initialized"
    cd ..
else
    echo "⚠️  Could not create database automatically"
    echo "Please run manually:"
    echo "  mysql -u root -p"
    echo "  CREATE DATABASE pdi_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python run.py"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "Then open: http://localhost:3000"
echo ""
