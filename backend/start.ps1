# AlgoPulse Backend — PowerShell Start Script
# Usage: .\start.ps1

$ErrorActionPreference = "Stop"

$VENV = ".venv"
$PYTHON = "python"

Write-Host "🐍 AlgoPulse Python Backend (Python 3.13)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check Python version
$pyver = & $PYTHON --version 2>&1
Write-Host "✅ $pyver detected" -ForegroundColor Green

# Create venv if it doesn't exist
if (-not (Test-Path $VENV)) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    & $PYTHON -m venv $VENV
}

# Activate venv
$activate = Join-Path $VENV "Scripts\Activate.ps1"
if (Test-Path $activate) {
    . $activate
    Write-Host "✅ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not activate venv, using system Python" -ForegroundColor Yellow
}

# Install deps
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

Write-Host ""
Write-Host "🚀 Starting FastAPI server on http://localhost:8000" -ForegroundColor Cyan
Write-Host "📖 API Docs available at http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
