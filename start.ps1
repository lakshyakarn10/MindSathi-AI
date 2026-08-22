# MindSaathi — One-Click Launcher
# Starts both Backend (FastAPI) and Frontend (Vite) servers

Write-Host "`n🧠 Starting MindSaathi..." -ForegroundColor Cyan

# Check if port 8000 is already in use and kill old process
$existing = netstat -ano | Select-String ":8000" | Select-Object -First 1
if ($existing) {
    $pid = ($existing -split '\s+')[-1]
    try { taskkill /PID $pid /F | Out-Null } catch {}
    Write-Host "  ✓ Cleared existing process on port 8000" -ForegroundColor Green
}

# Start FastAPI backend in new window
Write-Host "  → Starting FastAPI backend on http://localhost:8000" -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\backend'; Write-Host 'Backend starting...' -ForegroundColor Cyan; uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
) -WindowStyle Normal

# Wait for backend to boot
Start-Sleep -Seconds 3

# Verify backend health
try {
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/v1/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✓ Backend healthy: $($health.Content)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠  Backend not yet responding (may still be starting)" -ForegroundColor Yellow
}

# Start Vite frontend
Write-Host "  → Starting frontend on http://localhost:3000" -ForegroundColor Yellow
Write-Host "`n✅ Both servers started!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API Docs: http://localhost:8000/docs`n" -ForegroundColor Cyan

# Start frontend in current window
npm run dev
