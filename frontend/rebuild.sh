#!/bin/bash

# Quick Frontend Rebuild Script
# Rebuilds frontend with correct API configuration

set -e

echo "=========================================="
echo "PDI Complete - Frontend Rebuild"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# Show current API URL
echo "📋 Current API Configuration:"
echo "-----------------------------"
cat .env | grep REACT_APP_API_URL
echo ""

# Clean old build
echo "🧹 Cleaning old build..."
rm -rf build/
echo "✅ Old build removed"
echo ""

# Build new version
echo "🔨 Building production frontend..."
npm run build
echo ""

# Show build info
echo "📦 Build Complete!"
echo ""
ls -lh build/ | head -10
echo ""

echo "=========================================="
echo "✅ REBUILD COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps on server:"
echo "  1. git pull origin main"
echo "  2. cd ~/pdi_complete/frontend"
echo "  3. npm run build"
echo "  4. Nginx will automatically serve new build"
echo ""
echo "Site: http://pdi.gspl.cloud:4000"
echo ""
