#!/bin/bash

# Complete Server Deployment Script
# This includes database setup, frontend build, and backend restart

echo "=========================================="
echo "PDI Complete - Full Deployment"
echo "=========================================="
echo ""

cd ~/pdi_complete

# Step 1: Pull latest code
echo "📥 Step 1: Pulling latest code from GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Git pull failed!"
    exit 1
fi
echo "✅ Code updated"
echo ""

# Step 2: Setup COC database tables
echo "📊 Step 2: Setting up COC database tables..."
cd backend
source venv/bin/activate
python create_coc_tables.py
if [ $? -eq 0 ]; then
    echo "✅ Database tables created/verified"
else
    echo "⚠️  Database setup had warnings (tables may already exist)"
fi
cd ..
echo ""

# Step 3: Rebuild frontend
echo "🔨 Step 3: Rebuilding frontend..."
cd frontend
cp .env.production .env 2>/dev/null || echo "REACT_APP_API_URL=/api" > .env
rm -rf build/
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
echo "✅ Frontend built"
cd ..
echo ""

# Step 4: Restart backend
echo "🚀 Step 4: Restarting backend..."
pkill -f "python run.py" 2>/dev/null && echo "  Stopped old backend"
sleep 1

cd backend
source venv/bin/activate
nohup python run.py > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "  Backend started (PID: $BACKEND_PID)"
sleep 3

# Test backend
if curl -s http://localhost:5002/api/health > /dev/null 2>&1; then
    echo "✅ Backend is responding"
else
    echo "⚠️  Backend health check failed - check backend.log"
fi
cd ..
echo ""

# Step 5: Test COC endpoints
echo "🧪 Step 5: Testing COC endpoints..."
if curl -s http://localhost:5002/api/coc/companies > /dev/null 2>&1; then
    echo "✅ COC companies endpoint working"
else
    echo "⚠️  COC endpoints not responding"
fi
echo ""

# Step 6: Test frontend
echo "🌐 Step 6: Testing frontend..."
if curl -s -I http://pdi.gspl.cloud:4000 | grep -q "200 OK"; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️  Frontend not accessible"
fi
echo ""

echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🌐 Website: http://pdi.gspl.cloud:4000"
echo "🔌 Backend: http://localhost:5002"
echo "🔑 Password: 241425"
echo ""
echo "📋 Useful Commands:"
echo "  - View backend logs:  tail -f ~/pdi_complete/backend.log"
echo "  - Test COC API:       curl http://localhost:5002/api/coc/companies"
echo "  - Restart backend:    pkill python && cd backend && source venv/bin/activate && python run.py &"
echo ""
echo "📖 Documentation: ~/pdi_complete/COC_DATABASE_SETUP.md"
echo ""
