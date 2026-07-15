# ContractFlo local development setup (Windows)
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Write-Host "==> ContractFlo development setup"
Write-Host "Root: $Root"

# Backend
Write-Host ""
Write-Host "==> Setting up backend..."
Set-Location "$Root\backend"

if (-not (Test-Path ".venv")) {
    python -m venv .venv
}

& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt

if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "Created backend\.env from .env.example"
}

# Frontend
Write-Host ""
Write-Host "==> Setting up frontend..."
Set-Location "$Root\frontend"
npm install

if (-not (Test-Path ".env.local")) {
    Copy-Item .env.example .env.local
    Write-Host "Created frontend\.env.local from .env.example"
}

Write-Host ""
Write-Host "==> Setup complete"
Write-Host ""
Write-Host "Start backend:  cd backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload"
Write-Host "Start frontend: cd frontend; npm run dev"

Set-Location $Root
