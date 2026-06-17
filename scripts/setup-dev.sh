#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> ContractFlo development setup"
echo "Root: $ROOT"

# Backend
echo ""
echo "==> Setting up backend..."
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements-dev.txt

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created backend/.env from .env.example"
fi

# Frontend
echo ""
echo "==> Setting up frontend..."
cd "$ROOT/frontend"
npm install

if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "Created frontend/.env.local from .env.example"
fi

echo ""
echo "==> Setup complete"
echo ""
echo "Start backend:  cd backend && source .venv/bin/activate && uvicorn app.main:app --reload"
echo "Start frontend: cd frontend && npm run dev"
