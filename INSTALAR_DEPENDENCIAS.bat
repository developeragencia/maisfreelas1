@echo off
title MaisFreelas - Instalar dependencias
set "PROJECT_DIR=%~dp0"
if not exist "%PROJECT_DIR%package.json" set "PROJECT_DIR=d:\MAISFREELAS\GITMAISFREELAS\maisfreelas\"
cd /d "%PROJECT_DIR%"
if not exist "package.json" (
  echo ERRO: package.json nao encontrado.
  pause
  exit /b 1
)
echo Instalando dependencias...
call "C:\Program Files\nodejs\npm.cmd" install
if errorlevel 1 ( echo Erro. & pause & exit /b 1 )
echo Pronto. Execute INSTALAR_E_ABRIR.bat para subir o site.
pause
