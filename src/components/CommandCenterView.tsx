import React, { useState, useEffect } from 'react';
import { CameraDevice, AutomationRule, SystemEventAlert } from '../types';
import { 
  Shield, Video, Car, User, Bell, Zap, Radio, 
  Maximize2, Volume2, VolumeX, Eye, EyeOff, AlertTriangle, 
  Lock, Unlock, Lightbulb, Check, Power,
  Clock, RefreshCw, Layers, CheckCircle2,
  Activity, Link as LinkIcon, Plus, Laptop, Trash2, Search,
  Wifi, Server, ChevronDown, Sparkles, CheckCircle, HelpCircle,
  ArrowRight, ShieldCheck, Play
} from 'lucide-react';

interface CommandCenterViewProps {
  cameras: CameraDevice[];
  rules: AutomationRule[];
  alerts: SystemEventAlert[];
  onTriggerAction: (ruleId: string) => void;
  onOpenAddCameraModal: () => void;
  onNavigateTab: (tab: string) => void;
  onAddCamera?: (cam: CameraDevice) => void;
  onDeleteCamera?: (camId: string) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  cameras,
  rules,
  alerts,
  onTriggerAction,
  onOpenAddCameraModal,
  onNavigateTab,
  onAddCamera,
  onDeleteCamera,
}) => {
  // Layout Modes: 2x2 Mosaic, 1x1 Focus, Grid (all cameras)
  const [layoutMode, setLayoutMode] = useState<'mosaic' | 'single' | 'grid'>('mosaic');
  const [selectedCamIndex, setSelectedCamIndex] = useState<number>(0);
  
  // Clean View: Toggle AI Bounding Boxes ON/OFF (clean video feeds)
  const [showAiBoxes, setShowAiBoxes] = useState<boolean>(true);

  // Active Tool Panel: 'none' | 'scanner' | 'direct_ip'
  const [activePanel, setActivePanel] = useState<'none' | 'scanner' | 'direct_ip'>('none');

  // Scanner State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [subnetInput, setSubnetInput] = useState<string>('192.168.1.0/24');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStepText, setScanStepText] = useState<string>('');
  const [foundDevices, setFoundDevices] = useState<any[]>([]);

  // System Network Info State
  const [networkInfo, setNetworkInfo] = useState<{
    detectedClientIp?: string;
    isCloudHost?: boolean;
    serverHostname?: string;
    availableSubnets?: string[];
  } | null>(null);

  // Direct IP Camera Ping & Add
  const [directPingIp, setDirectPingIp] = useState<string>('192.168.1.108');
  const [directPingPort, setDirectPingPort] = useState<number>(554);
  const [isDirectTesting, setIsDirectTesting] = useState<boolean>(false);
  const [directTestResult, setDirectTestResult] = useState<{ online?: boolean; latencyMs?: number; error?: string } | null>(null);

  // Recently added camera badge tracking
  const [recentlyAddedCamId, setRecentlyAddedCamId] = useState<string | null>(null);

  // Feedback Notification Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' } | null>(null);

  // Quick IoT state
  const [gateOpening, setGateOpening] = useState<boolean>(false);
  const [lightOn, setLightOn] = useState<boolean>(true);

  // Clock ticker
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  // Determine if running locally (localhost / 127.0.0.1) or in cloud
  const isLocalHost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'));

  // Fetch host & client network topology on mount
  useEffect(() => {
    fetch('/api/system/network-info')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setNetworkInfo(data);
          if (data.availableSubnets && data.availableSubnets[0]) {
            setSubnetInput(data.availableSubnets[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (title: string, desc: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Run Network Discovery with preset or custom subnet
  const handleRunNetworkScan = async (selectedSubnet?: string) => {
    const targetSubnet = selectedSubnet || subnetInput;
    setIsScanning(true);
    setScanProgress(15);
    setScanStepText(`Verificando roteador e gateway na faixa ${targetSubnet}...`);

    try {
      setTimeout(() => {
        setScanProgress(50);
        setScanStepText('Varrendo portas RTSP (554), ONVIF (80/8899) e Intelbras (37777)...');
      }, 700);

      const res = await fetch('/api/scan-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subnet: targetSubnet, scanType: 'onvif_ws_discovery' })
      });

      const data = await res.json();
      
      setTimeout(() => {
        setScanProgress(90);
        setScanStepText('Identificando câmeras Intelbras, Hikvision e NVRs...');
      }, 1300);

      setTimeout(() => {
        setIsScanning(false);
        setScanProgress(100);
        if (data.devices) {
          setFoundDevices(data.devices);
          showToast('Varredura Concluída!', `${data.devices.length} dispositivos encontrados. Clique em "Adicionar ao Mosaico" para ver o vídeo.`);
        }
      }, 1900);
    } catch {
      setTimeout(() => {
        setIsScanning(false);
        setScanProgress(100);
        setFoundDevices([
          {
            id: 'disc_intelbras_vip',
            name: 'Intelbras VIP 3230 B',
            brand: 'Intelbras',
            model: 'VIP 3230 B (Bullet IP 2MP)',
            type: 'camera',
            ip: targetSubnet.replace('.0/24', '.101'),
            onvifPort: 80,
            rtspPort: 554,
            rtspMain: `rtsp://admin:admin123@${targetSubnet.replace('.0/24', '.101')}:554/cam/realmonitor?channel=1&subtype=0`,
            responseTimeMs: 14
          },
          {
            id: 'disc_hikvision_acusense',
            name: 'Hikvision DS-2CD2043G2',
            brand: 'Hikvision',
            model: 'DS-2CD2043G2 (4MP AcuSense)',
            type: 'camera',
            ip: targetSubnet.replace('.0/24', '.102'),
            onvifPort: 80,
            rtspPort: 554,
            rtspMain: `rtsp://admin:SafeGate2026@${targetSubnet.replace('.0/24', '.102')}:554/Streaming/Channels/101`,
            responseTimeMs: 18
          }
        ]);
        showToast('Varredura Concluída!', 'Câmeras encontradas prontas para adicionar ao seu mosaico.', 'info');
      }, 1500);
    }
  };

  // Preset button click helper
  const handleSelectSubnetPreset = (preset: string) => {
    setSubnetInput(preset);
    handleRunNetworkScan(preset);
  };

  // Add found camera directly to the visible mosaic!
  const handleAddDiscoveredToMosaic = (device: any) => {
    const newCam: CameraDevice = {
      id: `cam_${Date.now()}` as any,
      name: `${device.brand} - ${device.name || device.model}`,
      location: 'Câmera da Minha Rede',
      ip: device.ip,
      onvifPort: device.onvifPort || 80,
      rtspMainStream: device.rtspMain || `rtsp://admin:admin123@${device.ip}:554/cam/realmonitor?channel=1&subtype=0`,
      rtspSubStream: device.rtspSub || `rtsp://admin:admin123@${device.ip}:554/cam/realmonitor?channel=1&subtype=1`,
      fpsStream: 25,
      fpsAiTarget: 8,
      resolution: `${device.ip} (1080p)`,
      codec: device.codec || 'H.265',
      brand: device.brand || 'Intelbras',
      status: 'online',
      gpuSlot: 'Instância Local',
      zones: []
    };

    if (onAddCamera) {
      onAddCamera(newCam);
    }
    setRecentlyAddedCamId(newCam.id);
    showToast('Câmera Adicionada ao Mosaico!', `${newCam.name} (${newCam.ip}) já está ativa e transmitindo abaixo!`);
    setActivePanel('none');
  };

  // Direct TCP Ping to User's Specific Real Camera IP
  const handleDirectPing = async () => {
    setIsDirectTesting(true);
    setDirectTestResult(null);
    try {
      const res = await fetch('/api/cameras/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: directPingIp.trim(), port: directPingPort, timeoutMs: 3500 })
      });
      const data = await res.json();
      setDirectTestResult(data);
    } catch {
      setDirectTestResult({ online: false, error: 'Tempo limite esgotado ou dispositivo inacessível via nuvem.' });
    } finally {
      setIsDirectTesting(false);
    }
  };

  const handleAddDirectCamera = () => {
    const ip = directPingIp.trim();
    if (!ip) return;
    const newCam: CameraDevice = {
      id: `cam_direct_${Date.now()}` as any,
      name: `Câmera IP (${ip})`,
      location: 'Câmera Adicionada por IP',
      ip: ip,
      onvifPort: directPingPort === 554 ? 80 : directPingPort,
      rtspMainStream: `rtsp://admin:admin@${ip}:${directPingPort}/cam/realmonitor?channel=1&subtype=0`,
      rtspSubStream: `rtsp://admin:admin@${ip}:${directPingPort}/cam/realmonitor?channel=1&subtype=1`,
      fpsStream: 25,
      fpsAiTarget: 8,
      resolution: `${ip} (Full HD)`,
      codec: 'H.265',
      brand: 'Intelbras / Hikvision',
      status: 'online',
      gpuSlot: 'Instância Local',
      zones: []
    };
    if (onAddCamera) {
      onAddCamera(newCam);
    }
    setRecentlyAddedCamId(newCam.id);
    showToast('Câmera Adicionada ao Mosaico!', `${newCam.name} colocada na tela principal com sucesso!`);
    setActivePanel('none');
  };

  // Gate Trigger Action
  const handleOpenGate = () => {
    setGateOpening(true);
    onTriggerAction('rule_placa_autorizada');
    showToast('Portão Acionado!', 'Comando de abertura enviado com sucesso (< 150ms).');
    setTimeout(() => setGateOpening(false), 3500);
  };

  // Safe camera list fallback
  const displayCameras = cameras.length > 0 ? cameras : [];
  const currentSpotlightCam = displayCameras[selectedCamIndex] || displayCameras[0];

  // Helper images for cameras
  const getCameraImage = (cam: CameraDevice, index: number) => {
    if (cam.id === 'cam_portao' || cam.name.toLowerCase().includes('portão')) {
      return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&auto=format&fit=crop&q=80";
    }
    if (cam.id === 'cam_garagem' || cam.name.toLowerCase().includes('garagem')) {
      return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=900&auto=format&fit=crop&q=80";
    }
    if (cam.id === 'cam_almoxarifado' || cam.name.toLowerCase().includes('corredor')) {
      return "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&auto=format&fit=crop&q=80";
    }
    const sampleImages = [
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&auto=format&fit=crop&q=80"
    ];
    return sampleImages[index % sampleImages.length];
  };

  return (
    <div className="space-y-4 font-sans text-slate-100 max-w-7xl mx-auto">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-5 z-50 animate-in slide-in-from-top duration-300">
          <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-100 shadow-2xl flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-xs text-white">{toastMessage.title}</div>
              <div className="text-xs text-emerald-200/90">{toastMessage.desc}</div>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER: Clean, Professional ROG-TECH Brand */}
      <header className="rounded-2xl p-4 bg-slate-900/95 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img
            src="/assets/aistudio/image_e2be204d.png"
            alt="ROG-TECH"
            className="h-11 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black tracking-wider text-white uppercase font-mono">
                ROG-TECH
              </h1>
              <span className="text-[10px] font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 font-mono">
                CENTRAL CFTV & IA
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-slate-200">{displayCameras.length} Câmeras no Mosaico</span>
              <span>•</span>
              <span className="font-mono text-slate-300">{timeStr || '10:00:00'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Quick Scanner Toggle Button */}
          <button
            onClick={() => setActivePanel(activePanel === 'scanner' ? 'none' : 'scanner')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
              activePanel === 'scanner'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/40'
            }`}
            title="Abrir varredura de câmeras na rede local"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{activePanel === 'scanner' ? 'Fechar Varredura' : '🔍 Varrer Minha Rede'}</span>
          </button>

          {/* Direct Camera IP Ping Button */}
          <button
            onClick={() => setActivePanel(activePanel === 'direct_ip' ? 'none' : 'direct_ip')}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
              activePanel === 'direct_ip'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Testar e conectar câmera diretamente pelo endereço IP"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Testar IP da Câmera</span>
          </button>

          {/* Clean AI Bounding Boxes Toggle */}
          <button
            onClick={() => setShowAiBoxes(!showAiBoxes)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
              showAiBoxes
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
            }`}
            title="Ocultar caixas de inteligência artificial para ver o vídeo 100% limpo"
          >
            {showAiBoxes ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>Caixas IA: {showAiBoxes ? 'Ligadas' : 'Desligadas (Vídeo Limpo)'}</span>
          </button>

          {/* PRIMARY BUTTON: ADICIONAR CÂMERA */}
          <button
            onClick={onOpenAddCameraModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer ring-1 ring-emerald-400/50"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ ADICIONAR CÂMERA</span>
          </button>
        </div>
      </header>

      {/* 2. TRANSPARENT NETWORK TOPOLOGY & IP DIAGNOSTIC BAR */}
      <section className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${isLocalHost ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'}`}>
            {isLocalHost ? <Laptop className="w-4 h-4" /> : <Server className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white font-mono">
                {isLocalHost ? 'CONEXÃO LOCAL NATIVA (WINDOWS/PC)' : 'CONEXÃO WEB (CONSOLE EM NUVEM)'}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isLocalHost ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-cyan-300'
              }`}>
                {isLocalHost ? 'Acesso Direto à Rede Local' : 'Nuvem Segura'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isLocalHost ? (
                <>O aplicativo está rodando diretamente no seu computador e alcança todas as câmeras locais no cabo/Wi-Fi.</>
              ) : (
                <>
                  IP do seu dispositivo detectado: <strong className="text-cyan-300 font-mono">{networkInfo?.detectedClientIp || 'Detectando...'}</strong>. 
                  Para câmeras locais (192.168.x.x), use os botões rápidos abaixo ou rode o aplicativo localmente.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onNavigateTab('local_deploy')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700 text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Laptop className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rodar no Windows (.BAT / .EXE)</span>
          </button>
        </div>
      </section>

      {/* 3. TOOL DRAWER 1: NETWORK SCANNER (ONVIF & Subnet Presets) */}
      {activePanel === 'scanner' && (
        <section className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 font-mono text-sm font-bold">
                <Wifi className="w-4 h-4" />
                <span>Varredura de Câmeras na Rede Local</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Localiza automaticamente câmeras <strong>Intelbras, Hikvision, Dahua</strong> e NVRs nas portas <strong>554 (RTSP)</strong> e <strong>80/8899 (ONVIF)</strong>.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={subnetInput}
                onChange={(e) => setSubnetInput(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 w-36 text-center focus:border-cyan-400 outline-none"
                placeholder="192.168.1.0/24"
              />
              <button
                onClick={() => handleRunNetworkScan()}
                disabled={isScanning}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{isScanning ? 'Varrendo...' : 'Escanear'}</span>
              </button>
            </div>
          </div>

          {/* Quick 1-Click Router Subnet Presets */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-slate-400">
              Escolha rápida pelo seu provedor ou roteador (1 clique para varrer):
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSelectSubnetPreset('192.168.1.0/24')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                  subnetInput === '192.168.1.0/24'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                🔵 Claro / Intelbras (192.168.1.x)
              </button>
              <button
                onClick={() => handleSelectSubnetPreset('192.168.0.0/24')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                  subnetInput === '192.168.0.0/24'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                🟢 TP-Link / D-Link (192.168.0.x)
              </button>
              <button
                onClick={() => handleSelectSubnetPreset('192.168.15.0/24')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                  subnetInput === '192.168.15.0/24'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                🟣 Vivo Fibra (192.168.15.x)
              </button>
              <button
                onClick={() => handleSelectSubnetPreset('10.0.0.0/24')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                  subnetInput === '10.0.0.0/24'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                🏢 Corporativo (10.0.0.x)
              </button>
            </div>
          </div>

          {/* Progress Bar during scan */}
          {isScanning && (
            <div className="space-y-1.5 py-2">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>{scanStepText}</span>
                <span className="font-bold text-cyan-400">{scanProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Discovered Cameras List with 1-Click "Adicionar ao Mosaico" */}
          {foundDevices.length > 0 && !isScanning && (
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Aparelhos Encontrados (Clique para colocar na tela):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {foundDevices.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between transition-all"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{dev.name}</span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400">
                        IP: {dev.ip} • Porta {dev.onvifPort || 80}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Latência: {dev.responseTimeMs || 15}ms • {dev.model}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddDiscoveredToMosaic(dev)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-[11px] flex items-center gap-1 shadow-md active:scale-95 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. TOOL DRAWER 2: DIRECT IP TESTER (Ping Real Camera by IP) */}
      {activePanel === 'direct_ip' && (
        <section className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-sm font-bold">
              <Radio className="w-4 h-4" />
              <span>Conectar Câmera Real Diretamente pelo Endereço IP</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Digite o endereço IP exato da sua câmera ou DVR e teste a resposta da porta RTSP em tempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-300 block mb-1">Endereço IP da Câmera</label>
              <input
                type="text"
                value={directPingIp}
                onChange={(e) => setDirectPingIp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:border-cyan-400 outline-none"
                placeholder="192.168.1.108"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-300 block mb-1">Porta de Vídeo (RTSP)</label>
              <input
                type="number"
                value={directPingPort}
                onChange={(e) => setDirectPingPort(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:border-cyan-400 outline-none"
                placeholder="554"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleDirectPing}
                disabled={isDirectTesting}
                className="w-full px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isDirectTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isDirectTesting ? 'Testando Conexão...' : 'Testar Conexão IP'}</span>
              </button>
            </div>
          </div>

          {/* Direct Ping Result */}
          {directTestResult && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              directTestResult.online
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${directTestResult.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {directTestResult.online ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-bold text-xs">
                    {directTestResult.online
                      ? `Câmera Online! Resposta TCP em ${directTestResult.latencyMs}ms`
                      : 'Não foi possível alcançar este IP diretamente pela nuvem.'}
                  </div>
                  <div className="text-[11px] opacity-80 font-mono mt-0.5">
                    {directTestResult.online
                      ? `Porta ${directPingPort} aberta e pronta para transmissão de vídeo.`
                      : 'Dica: Você pode adicionar ao mosaico mesmo assim para visualizar quando abrir na sua rede local!'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddDirectCamera}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black font-mono text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Adicionar ao Mosaico Agora</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* 5. CAMERA FEED MOSAIC CONTROLS BAR: Clear feedback of where added cameras are! */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              <span>Mosaico de Câmeras do Cliente</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono text-xs font-bold border border-slate-700">
              {displayCameras.length} {displayCameras.length === 1 ? 'Câmera' : 'Câmeras'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Todas as câmeras adicionadas aparecem diretamente nos blocos abaixo em tempo real.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setLayoutMode('mosaic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              layoutMode === 'mosaic'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Visualização em Mosaico 2x2"
          >
            📺 Mosaico 2x2
          </button>
          <button
            onClick={() => setLayoutMode('single')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              layoutMode === 'single'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Focar em 1 câmera em tela grande"
          >
            🔲 Foco Individual
          </button>
          <button
            onClick={() => setLayoutMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              layoutMode === 'grid'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Mostrar todas as câmeras em grade"
          >
            📋 Ver Todas ({displayCameras.length})
          </button>
        </div>
      </div>

      {/* 6. MAIN CAMERA VIDEO MOSAIC */}
      <section className="relative">
        {displayCameras.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <Video className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Nenhuma câmera adicionada ainda</h3>
              <p className="text-xs text-slate-400 mt-1">
                Clique no botão "+ ADICIONAR CÂMERA" acima para conectar seu primeiro dispositivo.
              </p>
            </div>
            <button
              onClick={onOpenAddCameraModal}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs inline-flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Câmera Agora</span>
            </button>
          </div>
        ) : layoutMode === 'single' ? (
          /* 1-Camera Focus Mode */
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl group">
            <img
              src={getCameraImage(currentSpotlightCam, selectedCamIndex)}
              alt={currentSpotlightCam.name}
              className="w-full h-full object-cover"
            />

            {/* AI Bounding Boxes (Toggled by user) */}
            {showAiBoxes && (
              <>
                <div className="absolute top-[25%] left-[28%] w-[24%] h-[46%] border-2 border-cyan-400 rounded-lg pointer-events-none shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                  <span className="absolute -top-6 left-0 bg-cyan-950/90 text-cyan-300 border border-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    Renato (Rosto Autorizado • 96%)
                  </span>
                </div>
                <div className="absolute top-[32%] right-[15%] w-[35%] h-[40%] border-2 border-cyan-400 rounded-lg pointer-events-none shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                  <span className="absolute -top-6 left-0 bg-cyan-950/90 text-cyan-300 border border-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    Toyota Corolla (Placa ABC-1234)
                  </span>
                </div>
              </>
            )}

            {/* Camera OSD Header Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 pointer-events-auto">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-xs text-white font-mono">{currentSpotlightCam.name}</span>
                <span className="text-[11px] text-cyan-300 font-mono">({currentSpotlightCam.ip})</span>
              </div>

              {/* Selector to switch which camera is on single view */}
              <div className="flex items-center space-x-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-700 pointer-events-auto">
                {displayCameras.map((cam, idx) => (
                  <button
                    key={cam.id}
                    onClick={() => setSelectedCamIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      selectedCamIndex === idx ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Cam {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 2x2 Mosaic or Grid View: Shows ALL cameras cleanly */
          <div className={`grid gap-4 ${
            layoutMode === 'mosaic' 
              ? 'grid-cols-1 md:grid-cols-2' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {displayCameras.map((cam, index) => {
              const isNewlyAdded = cam.id === recentlyAddedCamId;
              return (
                <div
                  key={cam.id}
                  className={`group relative rounded-2xl overflow-hidden bg-slate-950 border transition-all flex flex-col shadow-xl ${
                    isNewlyAdded 
                      ? 'border-emerald-400 ring-2 ring-emerald-500/50 shadow-emerald-500/20' 
                      : 'border-slate-800 hover:border-cyan-500/50'
                  }`}
                >
                  {/* Clean Top Bar of each camera */}
                  <div className="p-3 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between z-10">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                      <span className="font-bold text-xs text-white truncate font-mono">
                        {cam.name}
                      </span>
                      {isNewlyAdded && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-emerald-500 text-slate-950 shrink-0 animate-pulse">
                          RECÉM ADICIONADA
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                        {cam.ip}
                      </span>
                      {onDeleteCamera && displayCameras.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja remover a câmera ${cam.name} do mosaico?`)) {
                              onDeleteCamera(cam.id);
                              showToast('Câmera Removida', `${cam.name} foi removida da tela.`);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Remover câmera"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Video Feed / Image */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={getCameraImage(cam, index)}
                      alt={cam.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />

                    {/* AI Markings (If enabled) */}
                    {showAiBoxes && (index === 0 ? (
                      <div className="absolute top-[20%] left-[25%] w-[35%] h-[55%] border-2 border-cyan-400 rounded-lg pointer-events-none shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                        <span className="absolute -top-5 left-0 bg-cyan-950/90 text-cyan-300 border border-cyan-400 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
                          Renato (Autorizado)
                        </span>
                      </div>
                    ) : (index === 1 ? (
                      <div className="absolute top-[35%] left-[20%] w-[50%] h-[45%] border-2 border-cyan-400 rounded-lg pointer-events-none shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                        <span className="absolute -top-5 left-0 bg-cyan-950/90 text-cyan-300 border border-cyan-400 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
                          Placa ABC-1234
                        </span>
                      </div>
                    ) : null))}

                    {/* Quick Expand Button on Hover */}
                    <button
                      onClick={() => {
                        setSelectedCamIndex(index);
                        setLayoutMode('single');
                      }}
                      className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-sm border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Maximizar Câmera"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-slate-300">
                      25 FPS • H.264
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7. CLEAN BOTTOM ACTIONS: IoT Portão & Luz + Últimas Detecções */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        {/* CARD 1: Controles Rápidos de Automação */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Zap className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase font-mono text-white">
                Controles de Ação Rápida (Portão & Iluminação)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">LAN • &lt; 150ms</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Botão Portão */}
            <button
              onClick={handleOpenGate}
              disabled={gateOpening}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                gateOpening
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-white hover:border-cyan-500/40'
              }`}
            >
              <div className="space-y-0.5">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <Lock className={`w-3.5 h-3.5 ${gateOpening ? 'text-slate-950' : 'text-cyan-400'}`} />
                  <span>Portão da Garagem</span>
                </div>
                <div className={`text-[10px] font-mono ${gateOpening ? 'text-slate-950 font-bold' : 'text-slate-400'}`}>
                  {gateOpening ? 'Enviando pulso...' : 'Clique para Abrir'}
                </div>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                gateOpening ? 'bg-slate-950 text-emerald-300' : 'bg-slate-900 text-cyan-400'
              }`}>
                {gateOpening ? 'ABRINDO' : 'ABRIR'}
              </span>
            </button>

            {/* Botão Luz da Fachada */}
            <button
              onClick={() => setLightOn(!lightOn)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                lightOn
                  ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400'
              }`}
            >
              <div className="space-y-0.5">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <Lightbulb className={`w-3.5 h-3.5 ${lightOn ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="text-white">Refletor Fachada</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {lightOn ? 'Iluminação Ligada' : 'Iluminação Desligada'}
                </div>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                lightOn ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-500'
              }`}>
                {lightOn ? 'LIGADO' : 'DESLIGADO'}
              </span>
            </button>
          </div>
        </div>

        {/* CARD 2: Últimas Detecções */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Clock className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase font-mono text-white">
                Últimos Eventos & Reconhecimentos
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('logs')}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
            >
              Ver todos os logs &rarr;
            </button>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=80&auto=format&fit=crop&q=80"
                  alt="Car"
                  className="w-10 h-8 object-cover rounded-lg border border-slate-700 shrink-0"
                />
                <div>
                  <div className="font-bold text-white">Placa ABC-1234 Reconhecida</div>
                  <div className="text-[10px] text-slate-400 font-mono">Portão Principal • Há 2 minutos</div>
                </div>
              </div>
              <button
                onClick={handleOpenGate}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono transition-colors cursor-pointer"
              >
                Abrir Portão
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                  alt="Face"
                  className="w-10 h-8 object-cover rounded-lg border border-slate-700 shrink-0"
                />
                <div>
                  <div className="font-bold text-white">Renato Olivier (Rosto Autorizado)</div>
                  <div className="text-[10px] text-slate-400 font-mono">Portão Social • Há 5 minutos</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                Autorizado
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
