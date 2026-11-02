@echo off
echo ============================================================
echo   Career Guidance System - Local Full-Stack Launcher
echo ============================================================
echo.

set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%backend
set FRONTEND_DIR=%ROOT_DIR%frontend
set AI_SERVICE_DIR=%ROOT_DIR%ai-service

echo [1/3] Starting FastAPI AI Service (Port 8000)...
start "FastAPI AI Service [Port 8000]" cmd /k "cd /d "%AI_SERVICE_DIR%" && py -3.12 -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting Spring Boot Backend (Port 8080)...
start "Spring Boot Backend [Port 8080]" cmd /k "cd /d "%BACKEND_DIR%" && mvn spring-boot:run"

echo [3/3] Starting Vite Frontend (Port 5173)...
start "Vite Frontend [Port 5173]" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo ============================================================
echo All services launched!
echo - AI Service:   http://127.0.0.1:8000  (local model inference)
echo - Backend API:  http://localhost:8080
echo - Frontend UI:  http://localhost:5173
echo ============================================================
echo.
pause
