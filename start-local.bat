@echo off
setlocal
chcp 65001 >nul

where php >nul 2>nul
if errorlevel 1 (
  echo PHP не найден в PATH.
  echo Установите PHP 7.1 или новее и запустите этот файл снова.
  pause
  exit /b 1
)

cd /d "%~dp0"
if not exist "storage" mkdir "storage"

if not defined TURNSTILE_SITE_KEY set "TURNSTILE_SITE_KEY=1x00000000000000000000BB"
if not defined TURNSTILE_SECRET_KEY set "TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA"

echo CLIP Search запускается на http://127.0.0.1:8080
echo Чтобы остановить сайт, закройте новое окно сервера.

start "CLIP Search PHP Server" /D "%~dp0" cmd /k php -S 127.0.0.1:8080 -t public
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8080"

endlocal
