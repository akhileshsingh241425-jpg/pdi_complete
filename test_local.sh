#!/bin/bash

# PDI Complete - Automated Local Testing Script
# This script will test all components of the application

echo "🚀 PDI Complete - Automated Testing Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "📋 Step 1: Checking Prerequisites"
echo "-----------------------------------"

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    test_result 0 "Python installed: $PYTHON_VERSION"
else
    test_result 1 "Python 3 not found"
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    test_result 0 "Node.js installed: $NODE_VERSION"
else
    test_result 1 "Node.js not found"
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    test_result 0 "npm installed: $NPM_VERSION"
else
    test_result 1 "npm not found"
fi

# Check MySQL
if command_exists mysql; then
    test_result 0 "MySQL client installed"
else
    test_result 1 "MySQL not found"
fi

echo ""
echo "📂 Step 2: Checking Project Structure"
echo "--------------------------------------"

# Check backend folder
if [ -d "backend" ]; then
    test_result 0 "Backend folder exists"
else
    test_result 1 "Backend folder not found"
fi

# Check frontend folder
if [ -d "frontend" ]; then
    test_result 0 "Frontend folder exists"
else
    test_result 1 "Frontend folder not found"
fi

# Check backend files
if [ -f "backend/requirements.txt" ]; then
    test_result 0 "Backend requirements.txt exists"
else
    test_result 1 "Backend requirements.txt not found"
fi

if [ -f "backend/app/__init__.py" ]; then
    test_result 0 "Backend app module exists"
else
    test_result 1 "Backend app module not found"
fi

# Check frontend files
if [ -f "frontend/package.json" ]; then
    test_result 0 "Frontend package.json exists"
else
    test_result 1 "Frontend package.json not found"
fi

if [ -f "frontend/src/App.js" ]; then
    test_result 0 "Frontend App.js exists"
else
    test_result 1 "Frontend App.js not found"
fi

echo ""
echo "🔧 Step 3: Checking Backend Configuration"
echo "------------------------------------------"

# Check if virtual environment exists
if [ -d "backend/venv" ]; then
    test_result 0 "Virtual environment exists"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Virtual environment not found. Creating..."
    cd backend
    python3 -m venv venv
    if [ $? -eq 0 ]; then
        test_result 0 "Virtual environment created"
    else
        test_result 1 "Failed to create virtual environment"
    fi
    cd ..
fi

# Check if .env exists in backend
if [ -f "backend/.env" ]; then
    test_result 0 "Backend .env file exists"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Backend .env not found. Creating template..."
    cat > backend/.env << 'EOF'
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DB=pdi_database
SECRET_KEY=testing-secret-key
FLASK_ENV=development
DEBUG=True
FRONTEND_URL=http://localhost:3000
EOF
    test_result 0 "Backend .env template created"
fi

echo ""
echo "📦 Step 4: Testing Backend Dependencies"
echo "----------------------------------------"

cd backend
source venv/bin/activate

# Install/Check dependencies
echo "Installing backend dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

if [ $? -eq 0 ]; then
    test_result 0 "Backend dependencies installed"
else
    test_result 1 "Failed to install backend dependencies"
fi

# Test Python imports
python3 << 'PYTHON_SCRIPT'
import sys
try:
    import flask
    import flask_cors
    import flask_sqlalchemy
    import pymysql
    import reportlab
    import openpyxl
    import pandas
    print("All imports successful")
    sys.exit(0)
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)
PYTHON_SCRIPT

if [ $? -eq 0 ]; then
    test_result 0 "All Python modules import successfully"
else
    test_result 1 "Python module import failed"
fi

cd ..

echo ""
echo "🗄️ Step 5: Checking Database"
echo "-----------------------------"

# Check if MySQL is running
if pgrep -x "mysqld" > /dev/null; then
    test_result 0 "MySQL server is running"
    
    # Check if database exists
    mysql -u root -proot -e "USE pdi_database;" 2>/dev/null
    if [ $? -eq 0 ]; then
        test_result 0 "Database 'pdi_database' exists"
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: Database not found. Creating..."
        mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS pdi_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
        if [ $? -eq 0 ]; then
            test_result 0 "Database created successfully"
        else
            test_result 1 "Failed to create database (check MySQL credentials)"
        fi
    fi
else
    test_result 1 "MySQL server is not running"
fi

echo ""
echo "🎨 Step 6: Checking Frontend Configuration"
echo "-------------------------------------------"

cd frontend

# Check if node_modules exists
if [ -d "node_modules" ]; then
    test_result 0 "Frontend node_modules exists"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: node_modules not found. Installing..."
    npm install
    if [ $? -eq 0 ]; then
        test_result 0 "Frontend dependencies installed"
    else
        test_result 1 "Failed to install frontend dependencies"
    fi
fi

# Check if .env exists in frontend
if [ -f ".env" ]; then
    test_result 0 "Frontend .env file exists"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Frontend .env not found. Creating..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    test_result 0 "Frontend .env created"
fi

cd ..

echo ""
echo "🧪 Step 7: Testing Backend API"
echo "-------------------------------"

# Start backend in background
cd backend
source venv/bin/activate
python production_server.py > /tmp/pdi_backend_test.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "Waiting for backend to start..."
sleep 5

# Test health endpoint
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    test_result 0 "Backend health check (GET /api/health)"
else
    test_result 1 "Backend health check failed (got HTTP $HEALTH_RESPONSE)"
fi

# Test companies endpoint
COMPANIES_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/companies)
if [ "$COMPANIES_RESPONSE" = "200" ]; then
    test_result 0 "Companies endpoint (GET /api/companies)"
else
    test_result 1 "Companies endpoint failed (got HTTP $COMPANIES_RESPONSE)"
fi

# Test master data endpoint
MASTER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/master/bom-data)
if [ "$MASTER_RESPONSE" = "200" ]; then
    test_result 0 "Master data endpoint (GET /api/master/bom-data)"
else
    test_result 1 "Master data endpoint failed (got HTTP $MASTER_RESPONSE)"
fi

# Stop backend
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

echo ""
echo "🎯 Step 8: Testing Frontend Build"
echo "----------------------------------"

cd frontend
echo "Building frontend (this may take a moment)..."
npm run build > /tmp/pdi_frontend_build.log 2>&1

if [ $? -eq 0 ]; then
    test_result 0 "Frontend builds successfully"
    
    # Check if build folder exists
    if [ -d "build" ]; then
        test_result 0 "Build folder created"
        
        # Check if index.html exists
        if [ -f "build/index.html" ]; then
            test_result 0 "Build index.html exists"
        else
            test_result 1 "Build index.html not found"
        fi
    else
        test_result 1 "Build folder not created"
    fi
else
    test_result 1 "Frontend build failed"
fi

cd ..

echo ""
echo "📊 Step 9: Testing File Structure"
echo "----------------------------------"

# Check backend routes
ROUTE_FILES=("ipqc_routes.py" "production_routes.py" "company_routes.py" "peel_test_routes.py" "master_routes.py")
for route in "${ROUTE_FILES[@]}"; do
    if [ -f "backend/app/routes/$route" ]; then
        test_result 0 "Route file: $route"
    else
        test_result 1 "Route file missing: $route"
    fi
done

# Check backend services
SERVICE_FILES=("form_generator.py" "pdf_generator.py" "excel_generator.py" "peel_test_pdf_generator.py" "production_pdf_generator.py")
for service in "${SERVICE_FILES[@]}"; do
    if [ -f "backend/app/services/$service" ]; then
        test_result 0 "Service file: $service"
    else
        test_result 1 "Service file missing: $service"
    fi
done

# Check frontend components
COMPONENT_FILES=("IPQCForm.js" "DailyReport.js" "PeelTestReport.js" "RejectionAnalysis.js" "MasterDataUpload.js" "Login.js")
for component in "${COMPONENT_FILES[@]}"; do
    if [ -f "frontend/src/components/$component" ]; then
        test_result 0 "Component file: $component"
    else
        test_result 1 "Component file missing: $component"
    fi
done

echo ""
echo "🔍 Step 10: Code Quality Checks"
echo "--------------------------------"

# Check for TODO/FIXME comments
TODO_COUNT=$(grep -r "TODO\|FIXME" backend/ frontend/src/ 2>/dev/null | wc -l)
if [ $TODO_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠ INFO${NC}: Found $TODO_COUNT TODO/FIXME comments in code"
fi

# Check for console.log in frontend
CONSOLE_LOG_COUNT=$(grep -r "console.log" frontend/src/ 2>/dev/null | wc -l)
if [ $CONSOLE_LOG_COUNT -gt 10 ]; then
    echo -e "${YELLOW}⚠ INFO${NC}: Found $CONSOLE_LOG_COUNT console.log statements (consider removing for production)"
fi

# Check for hardcoded credentials
HARDCODED=$(grep -r "password.*=.*['\"].*['\"]" backend/ 2>/dev/null | grep -v ".env" | wc -l)
if [ $HARDCODED -gt 0 ]; then
    echo -e "${YELLOW}⚠ WARNING${NC}: Possible hardcoded credentials found"
fi

echo ""
echo "=========================================="
echo "📈 Test Summary"
echo "=========================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
TOTAL=$((TESTS_PASSED + TESTS_FAILED))
echo "Total Tests: $TOTAL"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Application is ready for deployment.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please fix the issues before deployment.${NC}"
    exit 1
fi
