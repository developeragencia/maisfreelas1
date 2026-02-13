@echo off
title MaisFreelas - Instalar e abrir
set "PROJECT_DIR=%~dp0"
if not exist "%PROJECT_DIR%package.json" set "PROJECT_DIR=d:\MAISFREELAS\GITMAISFREELAS\maisfreelas\"
cd /d "%PROJECT_DIR%"
if not exist "package.json" (
  echo ERRO: package.json nao encontrado. Execute na pasta do projeto.
  pause
  exit /b 1
)
if not exist .env copy .env.example .env >nul
echo Instalando dependencias...
call "C:\Program Files\nodejs\npm.cmd" install
if errorlevel 1 ( echo Erro ao instalar. & pause & exit /b 1 )
echo.
echo Acesse: http://localhost:3000
echo Feche a janela para parar o servidor.
echo.
call "C:\Program Files\nodejs\node.exe" "%PROJECT_DIR%server.js"
pause
