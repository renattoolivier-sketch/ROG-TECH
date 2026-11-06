@echo off
setlocal enabledelayedexpansion
title ROG-TECH Command Center - Auto Launcher
color 0b
echo ================================================================
echo           ROG-TECH COMMAND CENTER - INICIALIZADOR LOCAL
echo ================================================================
echo.
echo Detectando ambiente de rede e requisitos...
echo.

:: 1. Verificar se o Node.js esta instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Node.js nao foi detectado no seu computador.
    echo O assistente vai baixar e instalar o Node.js LTS oficial agora...
    echo.
    winget -v >nul 2>&1
    if %errorlevel% equ 0 (
        echo [1/2] Instalando Node.js oficial via winget...
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    ) else (
        echo [1/2] Baixando instalador Node.js LTS oficial...
        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi' -OutFile '%TEMP%\nodejs_installer.msi'"
        echo [2/2] Instalando Node.js...
        powershell -Command "Start-Process msiexec.exe -ArgumentList '/i %TEMP%\nodejs_installer.msi /qn' -Wait"
    )
    echo.
    echo [SUCESSO] Node.js instalado! Feche e reabra este arquivo para iniciar o ROG-TECH.
    pause
    exit /b
)

echo [OK] Node.js detectado:
node -v
echo.

:: 2. Instalar dependencias se nao existirem
if not exist "node_modules\" (
    echo [INFO] Instalando modulos necessarios...
    call npm install
)

:: 3. Iniciar o servidor local na rede fisica e abrir o navegador
echo ================================================================
echo CONECTANDO A PLACA DE REDE LOCAL (0.0.0.0:3000)...
echo ================================================================
echo O aplicativo agora tem acesso direto a varrer suas cameras Intelbras/Hikvision na sua rede local!
echo.
start http://localhost:3000
call npm run dev
pause
