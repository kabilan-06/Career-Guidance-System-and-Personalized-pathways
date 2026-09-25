@echo off
echo Stopping Career Guidance System services on ports 5173, 7860, 8000, 8080...

for %%P in (5173 7860 8000 8080) do (
  for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%P" ^| findstr "LISTENING"') do (
    echo Killing process on port %%P (PID %%a)...
    taskkill /F /PID %%a 2>nul
  )
)

echo Done.
pause
