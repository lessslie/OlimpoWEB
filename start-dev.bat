@echo off
echo Iniciando aplicacion Olimpo (Next.js + Backend)...
echo.

start cmd /k "cd olimpo-next && npm run dev"
start cmd /k "cd back && npm run start:dev"

echo.
echo Aplicacion iniciada en:
echo Frontend: http://localhost:3000
echo Backend: http://localhost:3001/api
echo.
echo Presiona cualquier tecla para cerrar esta ventana (los servidores seguiran ejecutandose)
pause > nul
