import React, { useState, useEffect, useRef } from 'react';
import { CameraDevice, AutomationRule, MqttLogMessage, SystemEventAlert } from '../types';
import { 
  Shield, Video, Car, User, Bell, Zap, Radio, 
  Maximize2, Volume2, VolumeX, Eye, AlertTriangle, 
  Lock, Unlock, Lightbulb, Thermometer, Check, Power,
  Clock, Sparkles, Sliders, RefreshCw, Layers, Crosshair, ChevronRight, CheckCircle2,
  Activity, Link as LinkIcon, Copy, Share2, Plus
} from 'lucide-react';

interface CommandCenterViewProps {
  cameras: CameraDevice[];
  rules: AutomationRule[];
  alerts: SystemEventAlert[];
  onTriggerAction: (ruleId: string) => void;
  onOpenAddCameraModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  cameras,
  rules,
  alerts,
  onTriggerAction,
  onOpenAddCameraModal,
  onNavigateTab,
}) => {
  // Current time state
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  // Selected spotlight camera
  const [activeCamIndex, setActiveCamIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'mosaic' | 'grid' | 'focus'>('mosaic');

  // Selected Camera for Main Spotlight View
  const [selectedCamId, setSelectedCamId] = useState<string>(cameras[0]?.id || 'cam_portao');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isPingTesting, setIsPingTesting] = useState<boolean>(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  const selectedCam = cameras.find(c => c.id === selectedCamId) || cameras[0];

  // IoT Actuator Live States
  const [gateSonoff, setGateSonoff] = useState(false);
  const [lightTuya, setLightTuya] = useState(true);
  const [centralAlarm, setCentralAlarm] = useState(false);
  const [airConditioner, setAirConditioner] = useState(true);
  const [gatePulseActive, setGatePulseActive] = useState(false);

  // Missing Object State
  const [objectPresent, setObjectPresent] = useState(true);
  const [missingTimer, setMissingTimer] = useState(0);
  const [missingAlarmTriggered, setMissingAlarmTriggered] = useState(false);

  // Clock ticker
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

  // Missing object countdown simulation
  useEffect(() => {
    let t: any;
    if (!objectPresent) {
      t = setInterval(() => {
        setMissingTimer(prev => {
          const next = prev + 0.5;
          if (next >= 5 && !missingAlarmTriggered) {
            setMissingAlarmTriggered(true);
            setCentralAlarm(true);
          }
          return next;
        });
      }, 500);
    } else {
      setMissingTimer(0);
      setMissingAlarmTriggered(false);
    }
    return () => clearInterval(t);
  }, [objectPresent, missingAlarmTriggered]);

  const handlePulseGate = () => {
    setGatePulseActive(true);
    setGateSonoff(true);
    onTriggerAction('rule_portao_veiculo_autorizado');
    setTimeout(() => {
      setGatePulseActive(false);
      setGateSonoff(false);
    }, 1500);
  };

  const handleQuickAction = (actionType: 'open_gate' | 'alarm' | 'light') => {
    if (actionType === 'open_gate') {
      handlePulseGate();
    } else if (actionType === 'alarm') {
      setCentralAlarm(!centralAlarm);
      onTriggerAction('rule_objeto_ausente_alerta');
    } else if (actionType === 'light') {
      setLightTuya(!lightTuya);
      onTriggerAction('rule_garagem_noturno_tuya');
    }
  };

  // Real IP Camera / NVR Ping Test
  const handleTestCameraPing = async () => {
    setIsPingTesting(true);
    setPingStatus(null);
    try {
      const res = await fetch('/api/cameras/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: selectedCam.ip, port: selectedCam.onvifPort || 554 })
      });
      const data = await res.json();
      if (data.online) {
        setPingStatus(`Online (${data.latencyMs}ms)`);
      } else {
        setPingStatus('Offline');
      }
    } catch {
      setPingStatus('Falha de rota');
    } finally {
      setIsPingTesting(false);
      setTimeout(() => setPingStatus(null), 4000);
    }
  };

  const handleCopyLink = () => {
    const appUrl = 'https://ais-pre-a6jju4nyfxintuddyz5iu5-551992737061.us-east1.run.app';
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // 4 Feeds for the Mosaic column
  const mosaicFeeds = [
    {
      id: 'feed_garagem',
      title: 'Garagem',
      badge: 'ABC-1234 (Placa Mercosul)',
      badgeColor: 'text-cyan-300 border-cyan-400 bg-cyan-950/80',
      imgSrc: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&auto=format&fit=crop&q=80',
      hasPerson: true,
      hasCar: true,
      carBbox: 'top-[35%] left-[10%] w-[60%] h-[50%]',
      personBbox: 'top-[30%] right-[10%] w-[20%] h-[60%]'
    },
    {
      id: 'feed_corredor',
      title: 'Corredor',
      badge: 'Corredor [Acesso]',
      badgeColor: 'text-cyan-300 border-cyan-400 bg-cyan-950/80',
      imgSrc: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80',
      hasPerson: true,
      personBbox: 'top-[28%] left-[40%] w-[20%] h-[55%]'
    },
    {
      id: 'feed_fachada',
      title: 'Fachada',
      badge: 'Toyota Corolla (Modelo)',
      badgeColor: 'text-cyan-300 border-cyan-400 bg-cyan-950/80',
      imgSrc: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=500&auto=format&fit=crop&q=80',
      hasCar: true,
      carBbox: 'top-[40%] left-[20%] w-[50%] h-[45%]'
    },
    {
      id: 'feed_jardim',
      title: 'Jardim',
      badge: 'Gato [Animal]',
      badgeColor: 'text-emerald-300 border-emerald-400 bg-emerald-950/80',
      imgSrc: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80',
      hasAnimal: true,
      animalBbox: 'top-[45%] left-[30%] w-[40%] h-[45%]'
    }
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Top Banner: Metallic Textured Command Center Bar with ROG-TECH Logo */}
      <div className="metallic-header rounded-2xl p-3 sm:px-6 sm:py-3.5 shadow-2xl flex items-center justify-between flex-wrap gap-4 border border-cyan-500/30">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src="/assets/aistudio/image_e2be204d.png"
              alt="ROG-TECH"
              className="h-12 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-black tracking-wider text-white uppercase font-mono flex items-center gap-2">
                <span>ROG-TECH</span>
                <span className="text-cyan-400 font-bold text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40">
                  COMMAND CENTER
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Central Integrada de Monitoramento CFTV • Visão de Comando Unificada
            </p>
          </div>
        </div>

        {/* Status Telemetry & Digital Clock */}
        <div className="flex items-center space-x-2.5 text-xs font-mono flex-wrap gap-y-2">
          {/* PRIMARY CALL-TO-ACTION: ADICIONAR DISPOSITIVOS */}
          <button
            onClick={onOpenAddCameraModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer ring-1 ring-emerald-400/50"
            title="Adicionar novas câmeras IP Intelbras, NVRs ou relés IoT"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ ADICIONAR DISPOSITIVOS</span>
          </button>

          {/* Direct Link Access Button */}
          <button
            onClick={handleCopyLink}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              copiedLink
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900/80'
            }`}
            title="Copiar link de acesso para abrir no celular ou rede local"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" /> : <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>

          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">IA:</span>
            <span className="text-cyan-300 font-bold">8.0 FPS</span>
          </div>

          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">MQTT:</span>
            <span className="text-emerald-400 font-bold">1883 LAN</span>
          </div>

          {/* Clock Widget matching reference photo */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-right">
            <div className="text-[10px] text-cyan-400/80 uppercase font-bold tracking-wider">{dateStr || 'QUI, 05 NOV'}</div>
            <div className="text-sm font-black text-white tracking-widest">{timeStr || '22:18:20'}</div>
          </div>
        </div>
      </div>

      {/* MAIN UNIFIED WORKSPACE (Grid matching user mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Vertical Mosaic of 4 Camera Feeds (col-span-3) */}
        <div className="lg:col-span-3 space-y-2.5 flex flex-col justify-between">
          <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between px-1">
            <span>Mosaico de Câmeras (4 Feeds)</span>
            <span className="text-[10px] text-slate-500">Sub-stream IA</span>
          </div>

          <div className="space-y-2.5 flex-1 flex flex-col justify-between">
            {mosaicFeeds.map((feed, idx) => (
              <div
                key={feed.id}
                onClick={() => setActiveCamIndex(idx)}
                className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all group ${
                  activeCamIndex === idx
                    ? 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50'
                    : 'border-slate-800 hover:border-cyan-500/50 opacity-90 hover:opacity-100'
                }`}
              >
                {/* Image Feed */}
                <div className="aspect-[16/9] w-full bg-slate-950 relative overflow-hidden">
                  <img
                    src={feed.imgSrc}
                    alt={feed.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                  {/* Header Camera Label */}
                  <div className="absolute top-1.5 left-2 bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white border border-slate-700">
                    {feed.title}
                  </div>

                  {/* Cyberpunk AI Cyan Bounding Box & Label */}
                  {feed.badge && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${feed.badgeColor} shadow-md`}>
                        {feed.badge}
                      </span>
                    </div>
                  )}

                  {/* Visual simulated AI Box Overlay */}
                  {feed.carBbox && (
                    <div className={`absolute border-2 border-cyan-400 ${feed.carBbox} pointer-events-none rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.6)]`}>
                      <span className="absolute -top-3.5 left-0 text-[8px] font-mono bg-cyan-400 text-slate-950 font-bold px-1 rounded-t">
                        CAR
                      </span>
                    </div>
                  )}
                  {feed.personBbox && (
                    <div className={`absolute border-2 border-cyan-400 ${feed.personBbox} pointer-events-none rounded-sm`}>
                      <span className="absolute -top-3.5 left-0 text-[8px] font-mono bg-cyan-400 text-slate-950 font-bold px-1 rounded-t">
                        HUMAN
                      </span>
                    </div>
                  )}
                  {feed.animalBbox && (
                    <div className={`absolute border-2 border-emerald-400 ${feed.animalBbox} pointer-events-none rounded-sm`}>
                      <span className="absolute -top-3.5 left-0 text-[8px] font-mono bg-emerald-400 text-slate-950 font-bold px-1 rounded-t">
                        PET
                      </span>
                    </div>
                  )}

                  {/* REC Dot */}
                  <div className="absolute top-1.5 right-2 flex items-center space-x-1 bg-slate-950/70 px-1.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-[8px] font-mono text-slate-400">REC</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: Main Featured 4K Video + Zonas e Regras + Objeto Ausente (col-span-9) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Main 4K Camera Showcase with Cyber Bounding Boxes (matching user photo) */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/40 bg-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.15)] group">
            <div className="aspect-[16/9] w-full relative">
              {/* Dynamic Video: High-Res Stream with Live Cyber AI Annotations */}
              <img
                src={selectedCam.id === 'cam_portao' ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1280&auto=format&fit=crop&q=80" : (selectedCam.id === 'cam_garagem' ? "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1280&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1280&auto=format&fit=crop&q=80")}
                alt={selectedCam.name}
                className="w-full h-full object-cover object-center"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 pointer-events-none" />

              {/* OSD Header Top Left: Camera Switcher & Live Brand Identification */}
              <div className="absolute top-3 left-4 flex items-center space-x-2 flex-wrap gap-y-2">
                {/* Camera Selector Dropdown */}
                <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/40 text-xs font-mono font-bold text-white flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <select
                    value={selectedCamId}
                    onChange={e => setSelectedCamId(e.target.value)}
                    className="bg-transparent text-white focus:outline-none cursor-pointer pr-1"
                  >
                    {cameras.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.name} ({c.brand})
                      </option>
                    ))}
                  </select>
                  <span className="text-cyan-400 text-[10px] hidden sm:inline">
                    {selectedCam.codec} • {selectedCam.fpsAiTarget || 8} FPS IA
                  </span>
                </div>

                {/* Instant Real Camera Ping Test */}
                <button
                  onClick={handleTestCameraPing}
                  disabled={isPingTesting}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  title="Testar ping TCP na porta RTSP/ONVIF da câmera"
                >
                  <Activity className={`w-3.5 h-3.5 ${isPingTesting ? 'animate-spin' : ''}`} />
                  <span>{pingStatus ? pingStatus : (isPingTesting ? 'Testando...' : 'Testar Conexão')}</span>
                </button>
              </div>

              {/* OSD Top Right Controls */}
              <div className="absolute top-3 right-4 flex items-center space-x-2">
                <button
                  onClick={onOpenAddCameraModal}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <span>+ Conectar Câmera / NVR</span>
                </button>
                <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-slate-300 hidden sm:block">
                  ONVIF / RTSP
                </div>
              </div>

              {/* CYBERNETIC AI BOUNDING BOX 1: Renato (Rosto) Reconhecido or Live Face */}
              <div className="absolute top-[20%] left-[30%] w-[38%] h-[68%] pointer-events-none">
                {/* 3D Cyan Bracket Corners */}
                <div className="w-full h-full border-2 border-cyan-400 rounded-lg relative shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                  {/* Top Badge: Renato (Rosto) | 91% Confiança | Autorizado */}
                  <div className="absolute -top-7 left-0 bg-cyan-950/90 backdrop-blur-md border border-cyan-400 px-3 py-1 rounded-md text-[11px] font-mono text-cyan-300 font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Renato (Rosto)</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-emerald-400">94% Confiança</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-cyan-400">Autorizado</span>
                  </div>

                  {/* Target Crosshair Corners */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white"></div>
                </div>
              </div>

              {/* CYBERNETIC AI BOUNDING BOX 2: Toyota Corolla (Modelo) or Object Tracker */}
              <div className="absolute top-[22%] right-[8%] w-[24%] h-[24%] pointer-events-none">
                <div className="w-full h-full border-2 border-cyan-400 rounded relative shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                  <div className="absolute -top-6 left-0 bg-cyan-950/90 backdrop-blur-md border border-cyan-400 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 font-bold shadow whitespace-nowrap flex items-center gap-1">
                    <Car className="w-3 h-3 text-cyan-400" />
                    <span>Toyota Corolla (Modelo)</span>
                  </div>
                </div>
              </div>

              {/* Bottom Stream OSD Bar */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="text-emerald-400 font-bold">● VÍDEO SEGURO</span>
                  <span>IP: {selectedCam.ip}</span>
                  <span className="hidden md:inline">
                    CODEC: {selectedCam.codec} / {selectedCam.brand}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400 font-semibold">DETECÇÕES ATIVAS: 2</span>
                </div>
              </div>
            </div>
          </div>

          {/* TWO SATELLITE PANELS: Zonas e Regras + Objeto Ausente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Panel 1: Zonas e Regras (Floor Plan / Perimeter Cerca Virtual) */}
            <div className="cyber-panel p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Zonas e Regras
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-semibold">
                    Cerca Virtual Ativa
                  </span>
                </div>
              </div>

              {/* Architectural Floor Plan Vector Drawing Area */}
              <div className="relative aspect-[16/9] w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-2">
                {/* SVG Blueprint Floorplan with drawn polygon fence */}
                <svg className="w-full h-full text-slate-700" viewBox="0 0 300 170" fill="none">
                  {/* Blueprint grid lines */}
                  <defs>
                    <pattern id="grid" width="15" height="15" patternUnits="userSpaceOnUse">
                      <path d="M 15 0 L 0 0 0 15" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="300" height="170" fill="url(#grid)" />

                  {/* House / Facility walls */}
                  <rect x="30" y="25" width="240" height="120" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />
                  <path d="M 100 25 L 100 80 L 170 80 L 170 25" stroke="#334155" strokeWidth="1.5" />
                  <path d="M 100 110 L 100 145" stroke="#334155" strokeWidth="1.5" />
                  <path d="M 170 110 L 170 145" stroke="#334155" strokeWidth="1.5" />
                  <circle cx="65" cy="55" r="15" stroke="#1e293b" strokeWidth="1" />

                  {/* Glowing Cyan Virtual Polygon Perimeter Fence */}
                  <polygon
                    points="95,35 240,40 245,130 140,125 135,90 90,85"
                    fill="rgba(6, 182, 212, 0.25)"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                  />
                  {/* Vertices */}
                  <circle cx="95" cy="35" r="4" fill="#38bdf8" />
                  <circle cx="240" cy="40" r="4" fill="#38bdf8" />
                  <circle cx="245" cy="130" r="4" fill="#38bdf8" />
                  <circle cx="140" cy="125" r="4" fill="#38bdf8" />
                  <circle cx="135" cy="90" r="4" fill="#38bdf8" />
                  <circle cx="90" cy="85" r="4" fill="#38bdf8" />

                  {/* Label */}
                  <text x="110" y="70" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    PERÍMETRO SEGURANÇA [INVASÃO]
                  </text>
                </svg>

                {/* Floating Map Tools */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1 bg-slate-900/90 border border-slate-700 p-1 rounded-lg">
                  <button className="p-1 rounded hover:bg-slate-800 text-cyan-400" title="Mover">
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 rounded hover:bg-slate-800 text-slate-300" title="Desenhar Polígono">
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Panel 2: Objeto Ausente (Object Removal Surveillance) */}
            <div className="cyber-panel p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Objeto Ausente (Vigilância ROI)
                  </h3>
                </div>
                <button
                  onClick={() => setObjectPresent(!objectPresent)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    objectPresent
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  }`}
                >
                  {objectPresent ? 'Simular Remoção' : 'Recolocar Objeto'}
                </button>
              </div>

              {/* Object Video ROI View */}
              <div className="relative aspect-[16/9] w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                {objectPresent ? (
                  <img
                    src="https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600&auto=format&fit=crop&q=80"
                    alt="Toyota Corolla"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 text-center space-y-2">
                    <AlertTriangle className="w-8 h-8 text-rose-500 animate-bounce" />
                    <div className="text-xs font-bold text-rose-400 font-mono">
                      ALERTA CRÍTICO: OBJETO AUSENTE DA ROI!
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {missingAlarmTriggered ? 'SIRENE E NOTIFICAÇÃO DISPARADAS VIA MQTT' : `Disparo em ${(5 - missingTimer).toFixed(1)}s`}
                    </div>
                  </div>
                )}

                {/* Cyber Bounding Box on Car */}
                {objectPresent && (
                  <div className="absolute inset-4 border-2 border-cyan-400 rounded shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-start p-1.5 pointer-events-none">
                    <span className="bg-cyan-950 text-cyan-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-cyan-400">
                      Toyota Corolla (Modelo)
                    </span>
                  </div>
                )}

                {/* Footer Status */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-mono">
                  <span className={objectPresent ? "text-emerald-400" : "text-rose-400 font-bold"}>
                    {objectPresent ? "● OBJETO PRESENTE NA VAGA" : "⚠️ AUSÊNCIA REGISTRADA"}
                  </span>
                  <span className="text-slate-400">Timer Regressivo: 5s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Controle IoT Global + Logs e Eventos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Controle IoT Global (col-span-5) */}
        <div className="lg:col-span-5 cyber-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Controle IoT Global (Ação Imediata)
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
              LAN &lt; 150ms
            </span>
          </div>

          {/* Quick Actuator Cards Grid matching user mockup */}
          <div className="grid grid-cols-2 gap-3">
            {/* Actuator 1: Portão Garagem - Sonoff */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 transition-colors">
              <div className="space-y-1">
                <div className="font-bold text-xs text-white">Portao Garagem</div>
                <div className="text-[10px] text-cyan-400 font-mono">- Sonoff (LAN)</div>
              </div>
              <button
                onClick={handlePulseGate}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  gateSonoff || gatePulseActive ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    gateSonoff || gatePulseActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Actuator 2: Alarme Central */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 transition-colors">
              <div className="space-y-1">
                <div className="font-bold text-xs text-white">Alarme Central</div>
                <div className="text-[10px] text-rose-400 font-mono">{centralAlarm ? 'SIRENE 120dB' : 'Desarmado'}</div>
              </div>
              <button
                onClick={() => setCentralAlarm(!centralAlarm)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  centralAlarm ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    centralAlarm ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Actuator 3: Luz Fachada - Tuya */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 transition-colors">
              <div className="space-y-1">
                <div className="font-bold text-xs text-white">Luz Fachada</div>
                <div className="text-[10px] text-amber-400 font-mono">- Tuya (Local)</div>
              </div>
              <button
                onClick={() => setLightTuya(!lightTuya)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  lightTuya ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    lightTuya ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Actuator 4: Ar Condicionado */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 transition-colors">
              <div className="space-y-1">
                <div className="font-bold text-xs text-white">Ar Condicionado</div>
                <div className="text-[10px] text-emerald-400 font-mono">- Ativo (22°C)</div>
              </div>
              <button
                onClick={() => setAirConditioner(!airConditioner)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  airConditioner ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    airConditioner ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>Protocolos: eWeLink LAN • Tuya Key • MQTT</span>
            <button
              onClick={() => onNavigateTab('rules')}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Ver todas as regras &rarr;
            </button>
          </div>
        </div>

        {/* Logs e Eventos Recentes com Miniaturas e Ações Rápidas (col-span-7) */}
        <div className="lg:col-span-7 cyber-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Logs e Eventos Recentes (Tempo Real)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Fluxo Contínuo de IA
            </span>
          </div>

          {/* Real-Time Event Cards with Thumbnails & Quick Actions */}
          <div className="space-y-3">
            {/* Event 1: Placa ABC-1234 Reconhecida */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=100&auto=format&fit=crop&q=80"
                  alt="Car"
                  className="w-14 h-11 object-cover rounded-lg border border-slate-700 shrink-0"
                />
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold">9:30 AM • Garagem</div>
                  <div className="font-bold text-xs text-white">Placa ABC-1234 Reconhecida</div>
                  <div className="text-[10px] text-slate-400 font-mono">Veículo de Morador • Toyota Corolla</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleQuickAction('open_gate')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono shadow-sm transition-all"
                >
                  Abrir Portão
                </button>
                <button
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-mono"
                >
                  Ignorar
                </button>
              </div>
            </div>

            {/* Event 2: Rosto Renato Reconhecido */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Face"
                  className="w-14 h-11 object-cover rounded-lg border border-slate-700 shrink-0"
                />
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold">9:28 AM • Entrada Principal</div>
                  <div className="font-bold text-xs text-white">Renato (Rosto 91% Confiança)</div>
                  <div className="text-[10px] text-slate-400 font-mono">Morador Autorizado • Acesso Liberado</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleQuickAction('open_gate')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-sm transition-all"
                >
                  Liberar Entrada
                </button>
                <button
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-mono"
                >
                  Auditoria
                </button>
              </div>
            </div>

            {/* Event 3: Detecção de Animal / Movimento */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <img
                  src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&auto=format&fit=crop&q=80"
                  alt="Cat"
                  className="w-14 h-11 object-cover rounded-lg border border-slate-700 shrink-0"
                />
                <div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold">9:25 AM • Jardim</div>
                  <div className="font-bold text-xs text-white">Gato Detectado no Jardim</div>
                  <div className="text-[10px] text-slate-400 font-mono">Classe Animal • Cerca Virtual Não Transgredida</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[10px] px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-mono">
                  Registrado
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
