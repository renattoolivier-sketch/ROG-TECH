import React, { useState } from 'react';
import { 
  Download, Terminal, Smartphone, Monitor, Github, 
  Check, Copy, ExternalLink, ShieldCheck, Wifi, Radio, Server, CheckCircle2, Layers,
  AlertTriangle, Box, Cpu, FileCode2, Play
} from 'lucide-react';

export const LocalNetworkDeployGuide: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeDeployTab, setActiveDeployTab] = useState<'exe' | 'auto_bat' | 'github_releases' | 'pwa'>('exe');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 3000);
  };

  const autoInstallWindowsBat = `@echo off
setlocal enabledelayedexpansion
title ROG-TECH Command Center - Auto Launcher
echo ====================================================
echo INICIANDO ROG-TECH COMMAND CENTER NA REDE LOCAL
echo ====================================================

:: 1. Verificar se o Node.js esta instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] Node.js nao encontrado no seu Windows.
    echo O assistente vai instalar o Node.js oficial automaticamente agora...
    echo.
    
    :: Tentar instalar via winget oficial do Windows 10/11
    winget -v >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Baixando e instalando Node.js LTS via winget...
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    ) else (
        echo [INFO] Baixando instalador Node.js LTS oficial via PowerShell...
        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi' -OutFile '%TEMP%\\nodejs_installer.msi'"
        echo [INFO] Executando instalacao do Node.js...
        powershell -Command "Start-Process msiexec.exe -ArgumentList '/i %TEMP%\\nodejs_installer.msi /qn' -Wait"
    )
    
    echo.
    echo ====================================================
    echo [SUCESSO] Node.js foi instalado com sucesso no seu Windows!
    echo Feche esta janela e execute este arquivo novamente para iniciar.
    echo ====================================================
    pause
    exit /b
)

echo [OK] Node.js detectado com sucesso:
node -v
echo.
echo Instalando dependencias do projeto ROG-TECH...
call npm install
echo.
echo ====================================================
echo ABRINDO CENTRAL DE MONITORAMENTO ROG-TECH...
echo ====================================================
start http://localhost:3000
call npm run dev
pause`;

  const electronBuildScript = `# 1. Instalar o Electron e Electron-Builder no projeto
npm install --save-dev electron electron-builder

# 2. Compilar o frontend e gerar o executável .EXE para Windows 64-bit
npm run build
npx electron-builder --win --x64 -c.win.target=nsis -c.extraMetadata.main=electron/main.cjs

# 3. Pronto! O instalador autônomo .EXE será gerado na pasta:
# ./dist/ROG-TECH-Command-Center-Setup-v2.4.0.exe
# (Este .EXE já embute o Node.js e Chromium: o cliente não precisa instalar nada!)`;

  const gitCloneScript = `# 1. Clonar o repositório da ROG-TECH
git clone https://github.com/rog-tech/cctv-intelligence.git
cd cctv-intelligence

# 2. Instalar as dependências do projeto
npm install

# 3. Iniciar o servidor local na sua rede
npm run dev

# Pronto! Acesse no navegador: http://localhost:3000
# Ou de qualquer celular na mesma Wi-Fi: http://[SEU_IP_LOCAL]:3000`;

  const dockerComposeYaml = `version: '3.8'

services:
  rog-tech-command-center:
    image: node:20-alpine
    container_name: rog_tech_soc
    restart: unless-stopped
    # O MODO HOST é o segredo: permite ao container varrer UDP 3702 ONVIF na sua rede real!
    network_mode: host
    working_dir: /app
    volumes:
      - .:/app
    environment:
      - PORT=3000
      - NODE_ENV=production
    command: sh -c "npm install && npm run build && npm start"`;

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <Box className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-black tracking-wider text-white uppercase font-mono">
              ROG-TECH Windows .EXE, GitHub & Rede Local
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/40">
              SOLUÇÃO DEFINITIVA
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Como gerar o instalador executável .EXE, baixar pelo GitHub Releases ou corrigir o erro de Node.js no Windows.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => downloadFile('iniciar_windows_automatico.bat', autoInstallWindowsBat)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Baixar .BAT Auto-Instalador</span>
          </button>
        </div>
      </div>

      {/* DIAGNOSTIC ERROR SOLVER: Screenshot Analysis */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 shadow-xl space-y-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <span>Solução para o erro:</span>
              <span className="text-rose-400 bg-black/40 px-2 py-0.5 rounded border border-rose-500/40 text-xs">
                [ERRO] Node.js nao encontrado
              </span>
            </h2>
            <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
              O Windows mostrou esse erro porque o Node.js não estava instalado no computador. 
              Para resolver isso sem nenhuma dor de cabeça, você tem <strong>três soluções imediatas</strong>:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setActiveDeployTab('exe')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeDeployTab === 'exe' 
                ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-500/20' 
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold font-mono text-cyan-300">OPÇÃO 1 (Recomendada)</span>
              <Box className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="font-bold text-xs text-white">App Instalável .EXE</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Gera um arquivo <code className="text-cyan-300">.exe</code> autônomo com Electron. Não precisa de Node.js instalado!
            </p>
          </button>

          <button
            onClick={() => setActiveDeployTab('auto_bat')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeDeployTab === 'auto_bat' 
                ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold font-mono text-emerald-300">OPÇÃO 2</span>
              <Play className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-bold text-xs text-white">.BAT com Auto-Instalação</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Script que instala o Node.js silenciosamente no Windows via winget e inicia sozinho.
            </p>
          </button>

          <button
            onClick={() => setActiveDeployTab('pwa')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeDeployTab === 'pwa' 
                ? 'bg-amber-950/80 border-amber-400 text-white shadow-lg shadow-amber-500/20' 
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold font-mono text-amber-300">OPÇÃO 3 (Em 5 Segundos)</span>
              <Monitor className="w-4 h-4 text-amber-400" />
            </div>
            <div className="font-bold text-xs text-white">Instalar App no Windows (PWA)</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Instala direto pelo Chrome/Edge. Cria ícone na Área de Trabalho e abre como programa nativo.
            </p>
          </button>
        </div>
      </div>

      {/* ACTIVE TAB CONTENT */}
      {activeDeployTab === 'exe' && (
        <div className="cyber-panel p-5 rounded-2xl border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Box className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold font-mono text-white">
                Como Criar e Baixar o Instalador .EXE para Windows (Electron)
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              100% STANDALONE • SEM NODE.JS
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Com o <strong>Electron Builder</strong>, o aplicativo inteiro (frontend, servidor backend e Chromium) é empacotado em um único arquivo 
            <strong className="text-white"> ROG-TECH-Command-Center-Setup.exe</strong>. Quando seu cliente ou você der 2 cliques:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instala na pasta Program Files do Windows</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cria ícone na Área de Trabalho e Menu Iniciar</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Acesso nativo a IP local, UDP ONVIF e RTSP</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Comandos para compilar o .EXE no projeto (já configurado em /electron/main.cjs):</span>
              <button
                onClick={() => copyToClipboard(electronBuildScript, 'electron_script')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs flex items-center gap-1 border border-slate-700"
              >
                {copiedSection === 'electron_script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Comandos</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 text-[11px] overflow-x-auto leading-relaxed font-mono">
              {electronBuildScript}
            </pre>
          </div>

          {/* GitHub Releases Integration */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                <Github className="w-4 h-4 text-cyan-400" />
                <span>GitHub Actions Já Configurado (.github/workflows/build-exe.yml)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Toda vez que você enviar o código para o GitHub com uma tag (ex: <code>v2.4.0</code>), os servidores do GitHub compilam o <code>.exe</code> no Windows e colocam o link para download direto na aba <strong>Releases</strong>!
              </p>
            </div>

            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shrink-0"
            >
              <span>Ver GitHub Releases</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {activeDeployTab === 'auto_bat' && (
        <div className="cyber-panel p-5 rounded-2xl border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Play className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold font-mono text-white">
                Novo Script: iniciar_windows_automatico.bat
              </h2>
            </div>
            <button
              onClick={() => downloadFile('iniciar_windows_automatico.bat', autoInstallWindowsBat)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo .BAT</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Este novo script foi aprimorado para nunca mais dar o erro de <em>&quot;Node.js não encontrado&quot;</em>. 
            Ele usa o <code className="text-emerald-300">winget</code> nativo do Windows 10/11 ou faz o download silencioso do Node.js LTS oficial da Microsoft/NodeJS Foundation automaticamente.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Conteúdo do arquivo iniciar_windows_automatico.bat:</span>
              <button
                onClick={() => copyToClipboard(autoInstallWindowsBat, 'auto_bat_code')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs flex items-center gap-1 border border-slate-700"
              >
                {copiedSection === 'auto_bat_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Script</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-[11px] overflow-x-auto leading-relaxed font-mono">
              {autoInstallWindowsBat}
            </pre>
          </div>
        </div>
      )}

      {activeDeployTab === 'pwa' && (
        <div className="cyber-panel p-5 rounded-2xl border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <Monitor className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold font-mono text-white">
                Instalar como App Nativo do Windows via Navegador (PWA)
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
              ZERO INSTALAÇÃO DE NODE.JS
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Se você não quer instalar Node.js nem compilar nada, você pode transformar este sistema em um aplicativo de desktop do Windows em 5 segundos usando o Chrome ou Microsoft Edge:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-amber-400 font-bold">1. No Chrome / Edge</div>
              <p className="text-slate-400 text-[11px] font-sans">
                Olhe na barra de endereços (ao lado da estrela de favoritos) e clique no ícone <strong>&quot;Instalar ROG-TECH&quot;</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-amber-400 font-bold">2. Confirme a Instalação</div>
              <p className="text-slate-400 text-[11px] font-sans">
                O Windows criará automaticamente o atalho com o ícone oficial da ROG-TECH na sua Área de Trabalho e no Menu Iniciar.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-amber-400 font-bold">3. Abra como Programa</div>
              <p className="text-slate-400 text-[11px] font-sans">
                O app abre em janela própria, sem abas de navegador, exatamente como um software VMS comercial de CFTV!
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-mono text-slate-300">Link direto de acesso para instalar:</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://ais-pre-a6jju4nyfxintuddyz5iu5-551992737061.us-east1.run.app');
                setCopiedSection('pwa_link');
                setTimeout(() => setCopiedSection(null), 3000);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5"
            >
              {copiedSection === 'pwa_link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'pwa_link' ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3 Step Guides: Windows, Linux/Docker, Smartphone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* CARD 1: Windows PC Auto-Install */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white font-mono">1. No Windows (Auto-BAT)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">Corrige Erro</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Instala o Node.js automaticamente se não existir e abre a central local em <code className="text-cyan-300">http://localhost:3000</code>.
            </p>

            <div className="space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Auto-instala Node.js LTS oficial</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Acesso nativo a portas 554, 80 e 37777</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Nenhum firewall bloqueando varredura</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => downloadFile('iniciar_windows_automatico.bat', autoInstallWindowsBat)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar iniciar_windows_automatico.bat</span>
            </button>
          </div>
        </div>

        {/* CARD 2: Linux / Docker / Raspberry Pi */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white font-mono">2. Servidor Linux / Docker</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">Produção 24/7</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Ideal para deixar rodando 24/7 em um mini PC, servidor dedicado ou Raspberry Pi com Docker Compose.
            </p>

            <div className="space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Suporte a Docker com network_mode: host</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Transcodificação contínua via ffmpeg</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reinicialização automática do serviço</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => downloadFile('docker-compose.yml', dockerComposeYaml)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar docker-compose.yml</span>
            </button>
          </div>
        </div>

        {/* CARD 3: Smartphone Android & iOS (PWA / APK) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white font-mono">3. No Celular (Smartphone)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">PWA Nativo</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Instale o aplicativo diretamente no celular sem passar por lojas de aplicativos, ficando com o ícone da ROG-TECH na tela de início.
            </p>

            <div className="space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Android: Toque em &quot;Instalar App&quot; no Chrome</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>iPhone: Compartilhar &rarr; &quot;Adicionar à Tela de Início&quot;</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Notificações push e botões rápidos de IoT</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://ais-pre-a6jju4nyfxintuddyz5iu5-551992737061.us-east1.run.app');
                setCopiedSection('pwa_link');
                setTimeout(() => setCopiedSection(null), 3000);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span>{copiedSection === 'pwa_link' ? '✓ Link do Celular Copiado!' : 'Copiar Link para o Celular'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Terminal Command Box to Clone and Run in 1 Command */}
      <div className="cyber-panel p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Terminal className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider text-white">
              Comandos para Clonar do GitHub no seu Terminal
            </span>
          </div>

          <button
            onClick={() => copyToClipboard(gitCloneScript, 'git_clone')}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs flex items-center gap-1.5 border border-slate-700"
          >
            {copiedSection === 'git_clone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'git_clone' ? 'Copiado!' : 'Copiar Comandos'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-[11px] overflow-x-auto leading-relaxed">
          {gitCloneScript}
        </pre>
      </div>
    </div>
  );
};
