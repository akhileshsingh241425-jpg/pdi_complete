#!/bin/bash

# 🔧 Fix Server Python Environment - Create Virtual Environment
# Run this script on your server to setup proper Python environment

echo "=================================================="
echo "🐍 Setting up Python Virtual Environment"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}Python version: $PYTHON_VERSION${NC}"
echo ""

# Check if python3-venv is installed
echo -e "${YELLOW}Checking if python3-venv is installed...${NC}"
if ! dpkg -l | grep -q python3-venv; then
    echo -e "${YELLOW}python3-venv not found. Installing...${NC}"
    apt update
    apt install -y python3-venv python3-full
    echo -e "${GREEN}✅ python3-venv installed${NC}"
else
    echo -e "${GREEN}✅ python3-venv already installed${NC}"
fi
echo ""

# Navigate to project directory
cd ~/pdi_complete/backend

# Remove old venv if exists
if [ -d "venv" ]; then
    echo -e "${YELLOW}Removing old virtual environment...${NC}"
    rm -rf venv
fi

# Create virtual environment
echo -e "${YELLOW}Creating virtual environment...${NC}"
python3 -m venv venv
echo -e "${GREEN}✅ Virtual environment created${NC}"
echo ""

# Activate and install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt

echo -e "${GREEN}✅ All dependencies installed${NC}"
echo ""

# Test import
echo -e "${YELLOW}Testing Flask import...${NC}"
python -c "from flask import Flask; print('✅ Flask works!')"
echo ""

# Create activation script
cat > ~/activate_pdi.sh << 'EOF'
#!/bin/bash
cd ~/pdi_complete/backend
source venv/bin/activate
echo "✅ PDI Backend environment activated"
echo "📂 Current directory: $(pwd)"
echo "🐍 Python: $(which python)"
echo "📦 Pip: $(which pip)"
EOF

chmod +x ~/activate_pdi.sh

echo ""
echo "=================================================="
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📋 How to use:${NC}"
echo ""
echo "1️⃣  Activate environment:"
echo "   source ~/activate_pdi.sh"
echo "   OR"
echo "   cd ~/pdi_complete/backend && source venv/bin/activate"
echo ""
echo "2️⃣  Run application:"
echo "   python run.py"
echo ""
echo "3️⃣  Install new packages:"
echo "   pip install package-name"
echo ""
echo "4️⃣  Deactivate environment:"
echo "   deactivate"
echo ""
echo "=================================================="
