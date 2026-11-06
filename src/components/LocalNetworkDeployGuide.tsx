import React, { useState } from 'react';
import { 
  Download, Terminal, Smartphone, Monitor, Github, 
  Check, Copy, ExternalLink, ShieldCheck, Wifi, Radio, Server, CheckCircle2, Layers
} from 'lucide-react';

export const LocalNetworkDeployGuide: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 3000);
  };

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

  const windowsBat = `@echo off
echo ====================================================
echo INICIANDO ROG-TECH COMMAND CENTER NA REDE LOCAL
echo ====================================================
cd /d %~dp0
echo Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Baixe em https://nodejs.org
    pause
    exit /b
)
echo Instalando dependencias...
call npm install
echo Iniciando Central de Monitoramento...
start http://localhost:3000
npm run dev
pause`;

  const linuxScript = `#!/usr/bin/env bash
set -e
echo "===================================================="
echo "INICIANDO ROG-TECH COMMAND CENTER NO LINUX / RASPBERRY"
echo "===================================================="
if ! command -v node &> /dev/null; then
    echo "Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs ffmpeg
fi

npm install
echo "Iniciando servidor local com acesso direto a ONVIF..."
npm run dev`;

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
            <Monitor className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-black tracking-wider text-white uppercase font-mono">
              Instalação Local no PC, Smartphone & GitHub
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/40">
              VARREDURA ONVIF DIRETA
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Como rodar o app no seu computador ou celular para capturar o IP local e descobrir câmeras Intelbras e NVRs instantaneamente.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>Repositório GitHub</span>
          </a>
        </div>
      </div>

      {/* Explanatory Banner: Why local network access makes discovery 100% native */}
      <div className="cyber-panel p-5 rounded-2xl border border-cyan-500/30 space-y-3">
        <div className="flex items-center space-x-2 text-cyan-300">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
          <h2 className="text-sm font-bold font-mono text-white">
            Por que rodar no seu PC local é a melhor solução para achar seus dispositivos:
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Quando o aplicativo roda no seu próprio computador ou servidor na mesma rede Wi-Fi/cabeada das suas câmeras, ele tem **acesso direto à interface de rede local (`eth0`/`wlan0`)**. Isso permite que o protocolo **ONVIF WS-Discovery (UDP 239.255.255.250:3702)** encontre todas as câmeras Intelbras, Dahua, Hikvision e NVRs automaticamente em menos de 1 segundo, sem precisar de configurações de roteador!
        </p>
      </div>

      {/* 3 Step Guides: Windows, Linux/Docker, Smartphone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* CARD 1: Windows PC */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white font-mono">1. No Windows (PC Local)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">1-Clique</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Execute no seu computador Windows. Ao abrir, o navegador iniciará automaticamente em <code className="text-cyan-300">http://localhost:3000</code>.
            </p>

            <div className="space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Identifica o IP local (ex: 192.168.1.15)</span>
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
              onClick={() => downloadFile('iniciar_windows.bat', windowsBat)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar iniciar_windows.bat</span>
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
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">Produção</span>
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
              Comandos Rápidos para Baixar e Rodar no Terminal (Linux / Mac / WSL)
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
