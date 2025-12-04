#!/bin/bash

# VS Code Web AI Editor - Development Startup Script
# This script starts both the backend server and frontend dev server

echo "🚀 Starting VS Code Web AI Editor..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✓ Dependencies installed"
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "   Please configure your API keys in .env file"
    echo ""
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend server
echo "🔧 Starting backend server on port 3001..."
npm run server &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend server failed to start"
    exit 1
fi

echo "✓ Backend server started (PID: $BACKEND_PID)"
echo ""

# Start frontend dev server
echo "🎨 Starting frontend dev server..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend server failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✓ Frontend server started (PID: $FRONTEND_PID)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ VS Code Web AI Editor is ready!"
echo ""
echo "📱 Frontend:  http://localhost:5173"
echo "🔌 Backend:   http://localhost:3001"
echo "🔧 Terminal:  ws://localhost:3001/terminal"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
