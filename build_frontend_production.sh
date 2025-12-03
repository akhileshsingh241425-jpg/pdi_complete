#!/bin/bash

# Frontend Build Script for Production
# This script builds the React frontend with production API URL

echo "=================================================="
echo "🎨 Frontend Production Build Script"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: frontend directory not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

cd frontend

# Prompt for backend URL
echo -e "${YELLOW}Enter your Hostinger backend URL:${NC}"
echo -e "${BLUE}Example: https://api.yourdomain.com or https://yourdomain.com${NC}"
read -p "Backend URL: " BACKEND_URL

# Remove trailing slash if present
BACKEND_URL=${BACKEND_URL%/}

# Validate URL
if [[ ! $BACKEND_URL =~ ^https?:// ]]; then
    echo -e "${RED}❌ Error: Invalid URL. Must start with http:// or https://${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Creating .env.production file...${NC}"

# Create .env.production
cat > .env.production << EOF
# Production Environment Variables
# Generated on: $(date)

# Backend API URL (Hostinger)
REACT_APP_API_BASE_URL=$BACKEND_URL

# Other production settings
GENERATE_SOURCEMAP=false
NODE_ENV=production
EOF

echo -e "${GREEN}✅ .env.production created${NC}"
echo ""

# Display the configuration
echo -e "${BLUE}Configuration:${NC}"
echo "  Backend URL: $BACKEND_URL"
echo ""

# Ask for confirmation
read -p "Proceed with build? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Build cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo ""
echo -e "${YELLOW}Step 2: Building production bundle...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build completed successfully${NC}"

echo ""
echo -e "${YELLOW}Step 3: Build statistics...${NC}"
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    FILE_COUNT=$(find build -type f | wc -l)
    echo "  📦 Build folder size: $BUILD_SIZE"
    echo "  📄 Total files: $FILE_COUNT"
    echo -e "${GREEN}✅ Build folder ready: frontend/build/${NC}"
else
    echo -e "${RED}❌ Build folder not found${NC}"
    exit 1
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ FRONTEND BUILD COMPLETE!${NC}"
echo "=================================================="
echo ""
echo "📦 Build Location: frontend/build/"
echo ""
echo "📋 Deployment Options:"
echo ""
echo "Option 1: Deploy to Netlify (Recommended)"
echo "   1. Go to https://netlify.com"
echo "   2. Drag & drop the 'build' folder"
echo "   3. Done! Get instant URL"
echo ""
echo "Option 2: Deploy to Vercel"
echo "   1. Install: npm i -g vercel"
echo "   2. Run: vercel --prod"
echo "   3. Follow prompts"
echo ""
echo "Option 3: Deploy to Hostinger"
echo "   Upload 'build' folder contents to:"
echo "   /public_html/frontend/ (or any subdirectory)"
echo ""
echo "   Quick upload command:"
echo "   scp -P 65002 -r build/* username@domain.com:~/public_html/frontend/"
echo ""
echo "Option 4: Create ZIP for manual upload"
echo ""

# Ask if user wants to create ZIP
read -p "Create ZIP archive of build folder? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    BUILD_DATE=$(date +%Y%m%d_%H%M%S)
    ZIP_NAME="pdi_frontend_build_$BUILD_DATE.zip"
    
    echo -e "${YELLOW}Creating ZIP archive...${NC}"
    
    if command -v zip &> /dev/null; then
        cd build
        zip -r "../../$ZIP_NAME" . > /dev/null
        cd ..
        echo -e "${GREEN}✅ ZIP created: $ZIP_NAME${NC}"
    else
        tar -czf "../$ZIP_NAME.tar.gz" build
        echo -e "${GREEN}✅ Archive created: $ZIP_NAME.tar.gz${NC}"
    fi
fi

echo ""
echo "=================================================="
echo -e "${BLUE}📝 IMPORTANT NOTES:${NC}"
echo "=================================================="
echo ""
echo "1. Backend URL configured: $BACKEND_URL"
echo "2. Make sure your backend is deployed first"
echo "3. Update CORS in backend to allow frontend domain"
echo "4. Test the deployed frontend thoroughly"
echo ""
echo "🔧 Backend CORS Update:"
echo "   Edit backend/.htaccess:"
echo "   Header set Access-Control-Allow-Origin \"https://your-frontend-domain.com\""
echo ""
echo "=================================================="
