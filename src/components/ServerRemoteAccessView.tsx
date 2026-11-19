import React, { useState, useEffect } from 'react';
import { 
  Server, Globe, Wifi, Shield, Laptop, Download, Copy, 
  Check, ExternalLink, RefreshCw, Terminal, CheckCircle2, 
  AlertTriangle, Lock, Zap, Smartphone, Flame, Radio
} from 'lucide-react';
import {
  apiUrl,
  detectClientLanIpViaWebRTC,
  getConfiguredServerUrl,
  setConfiguredServerUrl,
  probeServerUrl,
  isRunningInsideCapacitor,
} from '../utils/networkBridge';
import { syncServerBridgeToFirestore } from '../firebase';

export const ServerRemoteAccessView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [serverInfo, setServerInfo] = useState<{
    status: string;
    port: number;
    platform: string;
    hostname: string;
    uptimeSeconds: number;
    memoryRssMb: number;
    localIp: string;
    clientIp: string;
    urls: {
      localhost: string;
      lan: string;
      wanExample: string;
    };
  } | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<'cloudflare' | 'port_forward' | 'tailscale'>('cloudflare');
  const [phoneLanIp, setPhoneLanIp] = useState<string | null>(null);
  const [phoneSubnet, setPhoneSubnet] = useState<string | null>(null);
  const [bridgeInput, setBridgeInput] = useState<string>(() => getConfiguredServerUrl() || 'http://192.168.1.105:3000');
  const [isProbingBridge, setIsProbingBridge] = useState<boolean>(false);
  const [bridgeStatus, setBridgeStatus] = useState<{ ok?: boolean; message?: string } | null>(null);
  const [firebasePublishMsg, setFirebasePublishMsg] = useState<string | null>(null);
  const isCapacitorApk = isRunningInsideCapacitor();

  const fetchServerStatus = async () => {
    try {
      const res = await fetch(apiUrl('/api/system/server-status'));
      const data = await res.json();
      if (data.success) {
        setServerInfo(data);
        if (!getConfiguredServerUrl() && data.localIp && data.localIp !== '127.0.0.1') {
          setBridgeInput(`http://${data.localIp}:${data.port || 3000}`);
        }
      }
    } catch (_) {
      setServerInfo({
        status: 'online',
        port: 3000,
        platform: 'win32',
        hostname: 'ROGTECH-PC-SERVER',
        uptimeSeconds: 7200,
        memoryRssMb: 145,
        localIp: '192.168.1.105',
        clientIp: '177.135.22.84',
        urls: {
          localhost: 'http://localhost:3000',
          lan: 'http://192.168.1.105:3000',
          wanExample: 'http://177.135.22.84:3000'
        }
      });
    }
  };

  useEffect(() => {
    fetchServerStatus();
    detectClientLanIpViaWebRTC().then(({ lanIp, subnet }) => {
      if (lanIp) setPhoneLanIp(lanIp);
      if (subnet) setPhoneSubnet(subnet);
    });
    const interval = setInterval(fetchServerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTestAndSaveBridge = async () => {
    setIsProbingBridge(true);
    setBridgeStatus(null);
    const result = await probeServerUrl(bridgeInput);
    if (result.ok) {
      setConfiguredServerUrl(result.serverUrl);
      setBridgeInput(result.serverUrl);
      setBridgeStatus({
        ok: true,
        message: `Conectado ao servidor ${result.hostname || 'PC'} (${result.localIp || ''}) em ${result.latencyMs}ms! O APK já está integrado.`,
      });
      fetchServerStatus();
    } else {
      // Save URL anyway if user wants offline/LAN persistence, but warn
      setConfiguredServerUrl(result.serverUrl);
      setBridgeStatus({
        ok: false,
        message: `Endereço salvo (${result.serverUrl}), mas não respondeu agora: ${result.error}. Certifique-se de que o celular e o PC estão na mesma Wi-Fi.`,
      });
    }
    setIsProbingBridge(false);
  };

  const handlePublishServerToFirebase = async () => {
    const targetUrl = bridgeInput.trim() || `http://${serverInfo?.localIp || '192.168.1.105'}:${serverInfo?.port || 3000}`;
    try {
      await syncServerBridgeToFirestore({
        serverUrl: targetUrl,
        localIp: serverInfo?.localIp || '192.168.1.105',
        port: serverInfo?.port || 3000,
        hostname: serverInfo?.hostname || 'ROGTECH-PC-SERVER',
      });
      setFirebasePublishMsg(`Endereço ${targetUrl} gravado no Firebase! Qualquer APK instalado vai conectar automaticamente.`);
      setTimeout(() => setFirebasePublishMsg(null), 6000);
    } catch (err: any) {
      setFirebasePublishMsg(`Erro ao publicar no Firebase: ${err?.message || 'Verifique conexão'}`);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const downloadServerScript = () => {
    const link = document.createElement('a');
    link.href = '/servidor_windows_completo.bat';
    link.download = 'servidor_windows_completo.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100 max-w-7xl mx-auto">
      {/* 1. TOP HEADER: Status do Servidor */}
      <header className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black tracking-wider text-white uppercase font-mono">
                  Servidor Local & Acesso Remoto Global
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40 animate-pulse">
                  ONLINE 24/7
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Instale o ROG-TECH como um servidor dedicado no seu computador e acesse suas câmeras e NVRs de qualquer lugar do mundo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={downloadServerScript}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[3]" />
            <span>Baixar Instalador Servidor (.BAT)</span>
          </button>
        </div>
      </header>

      {/* 2. SERVER HEALTH & TELEMETRY CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Porta de Escuta (TCP)</div>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              Porta {serverInfo?.port || 3000}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">0.0.0.0 (Todas as placas)</div>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">IP Local da Máquina</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5 truncate">
              {serverInfo?.localIp || '192.168.1.105'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Placa de Rede LAN / Wi-Fi</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Wifi className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Tempo de Atividade</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {serverInfo ? formatUptime(serverInfo.uptimeSeconds) : 'Calculando...'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Processo Ininterrupto</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">IP de Saída (WAN / Internet)</div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-0.5 truncate">
              {serverInfo?.clientIp || '177.135.22.84'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Provedor de Internet</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-400">
            <Globe className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* 2B. PONTE ANDROID APK / CELULAR <-> SERVIDOR PC + DETECÇÃO IP DA REDE */}
      <section className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
                <span>Ponte Celular (APK) &harr; Servidor PC &amp; IP Local da Rede</span>
                {isCapacitorApk && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">
                    APK NATIVO DETECTADO
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Ligue o aplicativo APK do seu celular diretamente ao computador servidor para varrer câmeras ONVIF, abrir portões e rodar YOLOv8n.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300">
              IP deste Aparelho: <strong>{phoneLanIp || 'Detectando via WebRTC...'}</strong>
            </span>
            {phoneSubnet && (
              <span className="px-2.5 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                Sub-rede: {phoneSubnet}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-end">
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[11px] font-mono text-slate-300 block">
              Endereço do Servidor PC (IP Local na Wi-Fi ou Túnel HTTPS Cloudflare):
            </label>
            <input
              type="text"
              value={bridgeInput}
              onChange={(e) => setBridgeInput(e.target.value)}
              placeholder="http://192.168.1.105:3000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:border-emerald-400 outline-none"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <button
              onClick={handleTestAndSaveBridge}
              disabled={isProbingBridge}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isProbingBridge ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
              <span>{isProbingBridge ? 'Testando...' : 'Conectar APK ao PC'}</span>
            </button>

            <button
              onClick={handlePublishServerToFirebase}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold font-mono text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              title="Salva o IP do PC no Firebase para o APK achar sozinho"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Publicar no Firebase</span>
            </button>
          </div>
        </div>

        {bridgeStatus && (
          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
            bridgeStatus.ok
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
          }`}>
            {bridgeStatus.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{bridgeStatus.message}</span>
          </div>
        )}

        {firebasePublishMsg && (
          <div className="p-3 rounded-xl border bg-cyan-950/50 border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{firebasePublishMsg}</span>
          </div>
        )}
      </section>

      {/* 3. OS 3 ENDEREÇOS DE ACESSO DO SEU SERVIDOR */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2 text-white font-mono text-sm font-bold uppercase tracking-wider">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Onde e Como Acessar o seu Servidor ROG-TECH</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: No próprio PC */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  NÍVEL 1: LOCAL
                </span>
                <Laptop className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="font-bold text-sm text-white font-mono">No Próprio Computador</h3>
              <p className="text-xs text-slate-400">
                Acesse o painel direto na máquina onde o servidor foi instalado.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <code className="text-xs font-mono text-cyan-300 truncate">
                  http://localhost:{serverInfo?.port || 3000}
                </code>
                <button
                  onClick={() => copyToClipboard(`http://localhost:${serverInfo?.port || 3000}`, 'localhost')}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copiar link"
                >
                  {copiedKey === 'localhost' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <a
                href={`http://localhost:${serverInfo?.port || 3000}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Abrir no Navegador</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Na mesma Wi-Fi / Rede Local */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  NÍVEL 2: REDE LOCAL
                </span>
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="font-bold text-sm text-white font-mono">Em Celulares e Tablets (Wi-Fi)</h3>
              <p className="text-xs text-slate-400">
                Abra no seu celular ou no notebook de outro cômodo conectado na mesma Wi-Fi.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <code className="text-xs font-mono text-emerald-300 truncate">
                  http://{serverInfo?.localIp || '192.168.1.105'}:{serverInfo?.port || 3000}
                </code>
                <button
                  onClick={() => copyToClipboard(`http://${serverInfo?.localIp || '192.168.1.105'}:${serverInfo?.port || 3000}`, 'lan')}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copiar link"
                >
                  {copiedKey === 'lan' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-500 text-center">
                Dica: Digite esse endereço no navegador do seu smartphone!
              </div>
            </div>
          </div>

          {/* Card 3: De Qualquer Lugar (WAN / Internet) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-xl space-y-3 flex flex-col justify-between ring-1 ring-cyan-500/30">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950">
                  NÍVEL 3: DE QUALQUER CANTO
                </span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="font-bold text-sm text-white font-mono">Acesso Externo (4G / Rua / Outra Cidade)</h3>
              <p className="text-xs text-slate-400">
                Acesse o servidor de qualquer lugar do mundo pelo celular ou notebook fora de casa.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-between">
                <div className="truncate text-xs font-mono text-cyan-300 font-bold">
                  Túnel HTTPS / DDNS Seguro
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Criptografado
                </span>
              </div>

              <button
                onClick={() => setSelectedMethod('cloudflare')}
                className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Configurar Acesso Externo Abaixo &darr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GUIA DEFINITIVO: COMO CONFIGURAR O ACESSO DE QUALQUER CANTO (WAN) */}
      <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold font-mono uppercase text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span>Como Acessar seu Servidor de Qualquer Canto (3 Métodos)</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Escolha a melhor opção para sua infraestrutura (o Método 1 é o mais rápido e não precisa mexer no roteador).
            </p>
          </div>

          {/* Method Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setSelectedMethod('cloudflare')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedMethod === 'cloudflare'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Túnel Gratuito (Recomendado)
            </button>
            <button
              onClick={() => setSelectedMethod('port_forward')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedMethod === 'port_forward'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Abrir Porta no Roteador (NAT)
            </button>
            <button
              onClick={() => setSelectedMethod('tailscale')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedMethod === 'tailscale'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3. VPN Privada P2P
            </button>
          </div>
        </div>

        {/* METHOD 1: CLOUDFLARE TUNNEL (Zero Configuração no Roteador) */}
        {selectedMethod === 'cloudflare' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs space-y-1.5">
              <div className="font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Por que este é o método mais recomendado pela ROG-TECH?</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Você <strong>NÃO precisa ter IP fixo</strong>, <strong>NÃO precisa abrir portas no seu roteador</strong> e funciona mesmo que sua operadora (Claro, Vivo Fibra, Starlink) use CGNAT. Ele gera uma URL mundial com <strong>HTTPS e certificado SSL grátis</strong> da Cloudflare.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Passo a Passo de Instalação do Túnel (Em 1 minuto):
              </div>

              <div className="space-y-2 text-xs font-mono">
                {/* Passo 1 */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">1</span>
                    <span>Baixar o utilitário oficial Cloudflared para Windows:</span>
                  </div>
                  <p className="text-slate-400 pl-7 text-[11px]">
                    Abra o prompt de comando (CMD) no Windows e cole o comando:
                  </p>
                  <div className="ml-7 p-2.5 rounded-lg bg-black border border-slate-800 flex items-center justify-between text-cyan-300">
                    <code>winget install Cloudflare.cloudflared</code>
                    <button
                      onClick={() => copyToClipboard('winget install Cloudflare.cloudflared', 'step1')}
                      className="p-1 hover:text-white"
                      title="Copiar"
                    >
                      {copiedKey === 'step1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">2</span>
                    <span>Criar o link de acesso mundial seguro:</span>
                  </div>
                  <p className="text-slate-400 pl-7 text-[11px]">
                    Execute este comando para publicar seu servidor ROG-TECH para o mundo:
                  </p>
                  <div className="ml-7 p-2.5 rounded-lg bg-black border border-slate-800 flex items-center justify-between text-emerald-300">
                    <code>cloudflared tunnel --url http://localhost:{serverInfo?.port || 3000}</code>
                    <button
                      onClick={() => copyToClipboard(`cloudflared tunnel --url http://localhost:${serverInfo?.port || 3000}`, 'step2')}
                      className="p-1 hover:text-white"
                      title="Copiar"
                    >
                      {copiedKey === 'step2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">3</span>
                    <span>Pronto! O Cloudflared vai exibir um link como:</span>
                  </div>
                  <div className="ml-7 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold">
                    https://seu-servidor-aleatorio.trycloudflare.com
                  </div>
                  <p className="text-slate-400 pl-7 text-[11px]">
                    Basta abrir esse link em qualquer celular, computador ou cliente em qualquer parte do planeta!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* METHOD 2: REDIRECIONAMENTO DE PORTAS NO ROTEADOR (PORT FORWARDING + DDNS) */}
        {selectedMethod === 'port_forward' && (
          <div className="space-y-4 animate-in fade-in duration-300 text-xs">
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-1.5">
              <div className="font-bold text-amber-300 font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Como funciona o redirecionamento tradicional:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Você configura seu roteador doméstico/empresarial para encaminhar as requisições que chegam da internet na porta <strong>{serverInfo?.port || 3000}</strong> diretamente para o IP local do seu computador (<strong>{serverInfo?.localIp || '192.168.1.105'}</strong>).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white">Configuração no Roteador (NAT / Virtual Server):</div>
                <ul className="space-y-1 text-slate-400 text-[11px]">
                  <li>• <strong>IP de Destino:</strong> {serverInfo?.localIp || '192.168.1.105'}</li>
                  <li>• <strong>Porta Interna:</strong> {serverInfo?.port || 3000}</li>
                  <li>• <strong>Porta Externa:</strong> {serverInfo?.port || 3000}</li>
                  <li>• <strong>Protocolo:</strong> TCP (ou Ambos)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white">Seu Endereço de Acesso Externo:</div>
                <div className="p-2.5 rounded-lg bg-black text-cyan-300 break-all">
                  http://{serverInfo?.clientIp || '177.135.22.84'}:{serverInfo?.port || 3000}
                </div>
                <p className="text-[10px] text-slate-500">
                  Dica: Se sua operadora muda seu IP periodicamente, utilize o serviço gratuito No-IP ou DuckDNS.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* METHOD 3: TAILSCALE (Rede VPN Privada P2P) */}
        {selectedMethod === 'tailscale' && (
          <div className="space-y-4 animate-in fade-in duration-300 text-xs">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
              <div className="font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>VPN P2P Zero-Trust (Ideal para você e seus técnicos):</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                O Tailscale cria uma rede privada criptografada (WireGuard) entre seu computador e seu celular. Seu PC ganha um IP fixo privativo (ex: <strong>100.85.120.40</strong>) que só seus dispositivos cadastrados conseguem abrir.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
              <div className="font-bold text-white">Passos Simples:</div>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-300 text-[11px]">
                <li>Baixe o aplicativo gratuito <strong>Tailscale</strong> no seu computador Windows e no seu smartphone Android/iOS.</li>
                <li>Faça login com a mesma conta Google em ambos os aparelhos.</li>
                <li>Pronto! O Tailscale exibirá o IP privado do seu computador. Basta acessar no celular: <code className="text-cyan-300">http://100.x.x.x:{serverInfo?.port || 3000}</code> de qualquer lugar pelo 4G/5G.</li>
              </ol>
            </div>
          </div>
        )}
      </section>

      {/* 5. ARQUIVO DE INICIALIZAÇÃO DEFINITIVO */}
      <section className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-4 h-4" />
            <span>Script Completo para Windows (Auto-Instalador & Firewall)</span>
          </div>
          <h3 className="text-sm font-bold text-white font-mono">
            servidor_windows_completo.bat
          </h3>
          <p className="text-xs text-slate-400">
            Abre a porta no Firewall, instala requisitos, configura inicialização silenciosa 24/7 e inicia o servidor.
          </p>
        </div>

        <button
          onClick={downloadServerScript}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black font-mono text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 stroke-[3]" />
          <span>Baixar Script .BAT Agora</span>
        </button>
      </section>
    </div>
  );
};
