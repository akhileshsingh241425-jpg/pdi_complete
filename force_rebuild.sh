#!/bin/bash

# Force Clean Rebuild Script
# Use this when browser shows old cached version

echo "🧹 Force Clean Rebuild"
echo "====================="

cd ~/pdi_complete

# 1. Clean everything
echo "🗑️  Cleaning old build..."
cd frontend
rm -rf build/
rm -rf node_modules/.cache/
echo "✅ Old build deleted"

# 2. Set environment
echo "⚙️  Setting production environment..."
cp .env.production .env
echo "✅ Environment set"

# 3. Fresh build
echo "🔨 Building fresh..."
npm run build
echo "✅ Build complete"

# 4. Restart backend
echo "🔄 Restarting backend..."
cd ../backend
pkill -f "python run.py" 2>/dev/null
source venv/bin/activate
nohup python run.py > ../backend.log 2>&1 &
sleep 3

# 5. Verify
echo ""
echo "✅ All done!"
echo ""
echo "Now in browser:"
echo "  1. Open: http://pdi.gspl.cloud:4000"
echo "  2. Press: Ctrl + Shift + R (hard refresh)"
echo "  3. Check Console: Should show /api calls, NOT localhost:5002"
echo ""
echo "Backend check:"
curl -s http://localhost:5002/api/health && echo "  ✅ Backend OK"
