@echo off
setlocal enabledelayedexpansion
title ROG-TECH Servidor CFTV & Acesso Remoto
color 0b

:: 1. Auto-Elevacao para Administrador (UAC)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando permissoes de Administrador para configurar Firewall e Servidor...
    powershell -Command "Start-Process cmd -ArgumentList '/c call \"%~f0\"' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
cls
echo ================================================================
echo           ROG-TECH - INSTALADOR & SERVIDOR DEDICADO
echo         Central de Monitoramento, CFTV, IA e Acesso Remoto
echo ================================================================
echo.

:: 2. Escolha de Porta
set PORT=3000
set /p USER_PORT="Escolha a porta do Servidor [Padrao 3000]: "
if not "!USER_PORT!"=="" set PORT=!USER_PORT!

echo [OK] Porta selecionada: !PORT!
echo.

:: 3. Liberar Porta no Firewall do Windows
echo [1/4] Configurando regra no Firewall do Windows para a porta !PORT!...
netsh advfirewall firewall delete rule name="ROG-TECH Servidor CFTV" >nul 2>&1
netsh advfirewall firewall add rule name="ROG-TECH Servidor CFTV" dir=in action=allow protocol=TCP localport=!PORT! >nul 2>&1
echo [OK] Porta !PORT! liberada no Firewall para aceitar conexoes de outros aparelhos!
echo.

:: 4. Verificar Node.js
echo [2/4] Verificando instalacao do Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Node.js nao encontrado. Baixando e instalando Node.js LTS automaticamente...
    winget -v >nul 2>&1
    if %errorlevel% equ 0 (
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    ) else (
        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi' -OutFile '%TEMP%\nodejs_installer.msi'"
        powershell -Command "Start-Process msiexec.exe -ArgumentList '/i %TEMP%\nodejs_installer.msi /qn' -Wait"
    )
    echo [OK] Node.js instalado!
) else (
    echo [OK] Node.js detectado:
    node -v
)
echo.

:: 5. Instalar dependencias se necessario
if not exist "node_modules\" (
    echo [3/4] Instalando dependencias do sistema...
    call npm install
)

:: 6. Detectar IP Local da Maquina
set LOCAL_IP=127.0.0.1
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /v "0.0.0.0.0"') do (
    if not "%%a"=="" set LOCAL_IP=%%a
)

:: 7. Criar Inicializador Silencioso de Inicializacao Automatica (Windows Startup)
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
echo.
echo Deseja que o Servidor ROG-TECH inicie sozinho SEMPRE que o Windows ligar? (S/N)
set /p AUTOSTART="[S para Sim, N para Nao]: "
if /i "!AUTOSTART!"=="S" (
    echo Set WshShell = CreateObject("WScript.Shell") > "%STARTUP_DIR%\iniciar_rogtech_oculto.vbs"
    echo WshShell.Run "cmd /c cd /d ""%~dp0"" && set PORT=!PORT! && npm run dev", 0, False >> "%STARTUP_DIR%\iniciar_rogtech_oculto.vbs"
    echo [OK] Inicializacao automatica configurada! O servidor subira em segundo plano sem incomodar.
)
echo.

:: 8. Iniciar o Servidor
cls
echo ================================================================
echo           SERVIDOR ROG-TECH ONLINE E TRANSMITINDO!
echo ================================================================
echo.
echo   [COMPUTADOR LOCAL]:       http://localhost:!PORT!
echo   [REDE LOCAL / WI-FI]:     http://!LOCAL_IP!:!PORT!
echo.
echo   [ACESSO DE QUALQUER CANTO DA RUA / 4G / INTERNET]:
echo   - Abra o painel na aba 'Servidor & Acesso Remoto' para ver
echo     as opcoes de Tunel Seguro Cloudflare ou DDNS de forma gratuita.
echo.
echo ================================================================
echo Pressione Ctrl+C para encerrar o servidor.
echo.

set PORT=!PORT!
start http://localhost:!PORT!
call npm run dev
pause
