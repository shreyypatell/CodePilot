#!/bin/bash
# ═══════════════════════════════════════════════════
#  CodePilot — Automated Setup Script
# ═══════════════════════════════════════════════════

set -e  # Exit on error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        CodePilot Setup Script        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Check dependencies ────────────────────────────
echo -e "${YELLOW}[1/5] Checking dependencies...${NC}"

if ! command -v python3 &>/dev/null; then
  echo -e "${RED}✗ Python 3 not found. Install from https://python.org${NC}"; exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version | cut -d' ' -f2)${NC}"

if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org${NC}"; exit 1
fi
echo -e "${GREEN}✓ Node $(node --version)${NC}"

if ! command -v ollama &>/dev/null; then
  echo -e "${YELLOW}⚠ Ollama not found. Installing...${NC}"
  curl -fsSL https://ollama.com/install.sh | sh
else
  echo -e "${GREEN}✓ Ollama $(ollama --version 2>/dev/null || echo 'installed')${NC}"
fi

# ── Start Ollama ──────────────────────────────────
echo ""
echo -e "${YELLOW}[2/5] Starting Ollama server...${NC}"

if ! pgrep -x "ollama" > /dev/null; then
  ollama serve &>/dev/null &
  echo -e "${GREEN}✓ Ollama server started${NC}"
  sleep 2
else
  echo -e "${GREEN}✓ Ollama already running${NC}"
fi

# ── Pull model ────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/5] Pulling coding model (deepseek-coder)...${NC}"
echo -e "${CYAN}  This may take a few minutes on first run...${NC}"

if ollama list 2>/dev/null | grep -q "deepseek-coder"; then
  echo -e "${GREEN}✓ deepseek-coder already downloaded${NC}"
else
  ollama pull deepseek-coder
  echo -e "${GREEN}✓ Model ready${NC}"
fi

# ── Backend setup ─────────────────────────────────
echo ""
echo -e "${YELLOW}[4/5] Setting up Python backend...${NC}"
cd "$(dirname "$0")/backend"

python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Start backend in background
python app.py &>/tmp/codepilot-backend.log &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
sleep 2

# ── Frontend setup ────────────────────────────────
echo ""
echo -e "${YELLOW}[5/5] Setting up React frontend...${NC}"
cd "../frontend"

npm install --silent
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# ── Done ──────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ✅  Setup Complete!                 ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}  Backend:  http://localhost:5000${NC}"
echo -e "${GREEN}  Frontend: http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}  Starting frontend dev server...${NC}"
echo -e "${CYAN}  Open http://localhost:5173 in your browser${NC}"
echo ""

npm run dev
