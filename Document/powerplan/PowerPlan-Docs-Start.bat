@echo off
clsecho.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          PowerPlan Dokumentáció Indítása                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📚 Docosaurus dokumentáció indítása folyamatban...
echo ⏳ A szerver elindulása a http://localhost:3002 címen...
echo.

REM Docosaurus indítása 3002 porton
npm start -- --port 3002

pause
