@echo off
echo ===================================================
echo   Starting SmartCart AI Full-Stack Product Suite
echo ===================================================

echo [1/3] Starting Express Backend API (Port 3001)...
start "SmartCart Backend (Express)" cmd /k "cd /d "%~dp0backend" && npm start"

echo [2/3] Starting Python FastAPI AI Microservice (Port 8000)...
start "SmartCart AI Microservice (FastAPI)" cmd /k "cd /d "%~dp0ai-service" && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [3/3] Starting React Vite Frontend (Port 5173)...
start "SmartCart Frontend (React Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo ===================================================
echo   All 3 services launched in separate windows!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo   AI Micro: http://localhost:8000/docs
echo ===================================================

