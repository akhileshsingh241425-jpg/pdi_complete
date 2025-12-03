#!/bin/bash

# Frontend Server Startup Script
# This script starts the React frontend using serve

cd "$(dirname "$0")"

echo "=========================================="
echo "Starting PDI Frontend Server"
echo "=========================================="

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "❌ Error: build directory not found!"
    echo "Please run: npm run build"
    exit 1
fi

echo "✅ Build directory found"
echo ""

# Check if serve is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found!"
    echo "Please ensure Node.js is installed"
    exit 1
fi

echo "✅ npx found"
echo ""

# Check and kill existing serve processes on port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3000 is already in use. Killing existing process..."
    kill -9 $(lsof -t -i:3000) 2>/dev/null
    sleep 2
    echo "✅ Port 3000 freed"
fi

echo ""
echo "=========================================="
echo "🚀 Starting Frontend Server on Port 3000"
echo "=========================================="
echo ""
echo "Access URLs:"
echo "  Local:    http://localhost:3000"
echo "  Network:  http://93.127.194.235:3000"
echo ""
echo "Backend API: http://93.127.194.235:5002"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start serve with proper flags
# -s build: Serve from build directory as single page app
# -l 3000: Listen on port 3000
# --no-clipboard: Don't copy URL to clipboard
npx serve -s build -l 3000 --no-clipboard

echo ""
echo "Frontend server stopped."
