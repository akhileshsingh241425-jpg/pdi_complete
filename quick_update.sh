#!/bin/bash

# Quick Production Update Script
# Run after git pull to update everything

echo "🚀 PDI Production Update"
echo "========================"

cd ~/pdi_complete

# 1. Rebuild frontend
echo "📦 Building frontend..."
cd frontend
cp .env.production .env 2>/dev/null
npm run build
cd ..

# 2. Restart backend
echo "🔄 Restarting backend..."
pkill -f "python run.py" 2>/dev/null
cd backend
source venv/bin/activate
nohup python run.py > ../backend.log 2>&1 &
sleep 2

# 3. Check status
echo ""
echo "✅ Update complete!"
echo "Backend: http://localhost:5002"
echo "Frontend: http://pdi.gspl.cloud:4000"
echo "Logs: tail -f ~/pdi_complete/backend.log"
