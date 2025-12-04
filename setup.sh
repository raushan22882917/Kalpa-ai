#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     VS Code Web AI Editor - Complete Setup Script         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version)${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Rebuild node-pty
echo "🔧 Building node-pty native module..."
npm rebuild node-pty
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  node-pty rebuild had issues, but continuing...${NC}"
else
    echo -e "${GREEN}✓ node-pty built successfully${NC}"
fi
echo ""

# Setup .env file
echo "⚙️  Setting up configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}   Please configure your API keys in .env${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi
echo ""

# Check ports
echo "🔌 Checking ports..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 3001 is in use${NC}"
else
    echo -e "${GREEN}✓ Port 3001 is available${NC}"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 5173 is in use${NC}"
else
    echo -e "${GREEN}✓ Port 5173 is available${NC}"
fi
echo ""

# Success message
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ Setup Complete!                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 To start the application:"
echo ""
echo "   npm start"
echo ""
echo "   This will start:"
echo "   • Backend server on http://localhost:3001"
echo "   • Frontend app on http://localhost:5173"
echo ""
echo "📖 Documentation:"
echo "   • TERMINAL_SETUP_COMPLETE.md - Quick start guide"
echo "   • TERMINAL_MULTI_TAB_GUIDE.md - Feature documentation"
echo "   • TERMINAL_TROUBLESHOOTING.md - Common issues"
echo ""
echo "Happy coding! 🎉"
echo ""
