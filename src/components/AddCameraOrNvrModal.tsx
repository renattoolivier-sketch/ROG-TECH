import React, { useState, useEffect } from 'react';
import { CameraDevice, CameraFeedId } from '../types';
import { NetworkDiscoveryScanner } from './NetworkDiscoveryScanner';
import { 
  Video, Server, Plus, X, Check, Shield, 
  Layers, HardDrive, Wifi, Sparkles, AlertCircle, Radio, Search,
  Terminal, Copy, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, Activity
} from 'lucide-react';

interface AddCameraOrNvrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCameras: (newCameras: CameraDevice[]) => void;
}

export const AddCameraOrNvrModal: React.FC<AddCameraOrNvrModalProps> = ({
  isOpen,
  onClose,
  onAddCameras
}) => {
  const [deviceType, setDeviceType] = useState<'intelbras_ip' | 'nvr' | 'scanner' | 'lan_bridge'>('intelbras_ip');
  const [brand, setBrand] = useState<'Intelbras' | 'Hikvision' | 'Dahua' | 'ONVIF'>('Intelbras');

  // Single IP camera fields
  const [camName, setCamName] = useState('Câmera Intelbras VIP 3230');
  const [camLocation, setCamLocation] = useState('Portão Social');
  const [camIp, setCamIp] = useState('192.168.1.108');
  const [camPort, setCamPort] = useState(554);
  const [camHttpPort, setCamHttpPort] = useState(80);
  const [camUser, setCamUser] = useState('admin');
  const [camPassword, setCamPassword] = useState('admin123');
  const [camChannel, setCamChannel] = useState(1);
  const [camCodec, setCamCodec] = useState<'H.264' | 'H.265'>('H.265');
  const [camAiFps, setCamAiFps] = useState<number>(8);
  const [customRtspMain, setCustomRtspMain] = useState('');
  const [customRtspSub, setCustomRtspSub] = useState('');

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ online?: boolean; latencyMs?: number; error?: string } | null>(null);

  // NVR fields
  const [nvrName, setNvrName] = useState('NVR Intelbras MHDX 16 Canais');
  const [nvrIp, setNvrIp] = useState('192.168.1.200');
  const [nvrPort, setNvrPort] = useState(554);
  const [nvrWebPort, setNvrWebPort] = useState(37777);
  const [nvrUser, setNvrUser] = useState('admin');
  const [nvrPassword, setNvrPassword] = useState('admin123');
  const [nvrChannelCount, setNvrChannelCount] = useState<number>(8);
  const [nvrAiTargetFps, setNvrAiTargetFps] = useState<number>(6);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real RTSP Stream URL Generator for Intelbras, Hikvision, Dahua, ONVIF
  const getRtspUrlTemplates = (brandSelected: string, ip: string, user: string, pass: string, ch: number, port = 554) => {
    const auth = user ? `${user}:${pass}@` : '';
    const portStr = port && port !== 554 ? `:${port}` : ':554';

    if (brandSelected === 'Intelbras' || brandSelected === 'Dahua') {
      return {
        main: `rtsp://${auth}${ip}${portStr}/cam/realmonitor?channel=${ch}&subtype=0`,
        sub: `rtsp://${auth}${ip}${portStr}/cam/realmonitor?channel=${ch}&subtype=1`,
        snapshot: `http://${auth}${ip}/cgi-bin/snapshot.cgi?channel=${ch}`
      };
    } else if (brandSelected === 'Hikvision') {
      return {
        main: `rtsp://${auth}${ip}${portStr}/Streaming/Channels/${ch}01`,
        sub: `rtsp://${auth}${ip}${portStr}/Streaming/Channels/${ch}02`,
        snapshot: `http://${auth}${ip}/ISAPI/Streaming/channels/${ch}01/picture`
      };
    } else {
      // ONVIF Generic
      return {
        main: `rtsp://${auth}${ip}${portStr}/onvif1`,
        sub: `rtsp://${auth}${ip}${portStr}/onvif2`,
        snapshot: `http://${auth}${ip}/onvif/snapshot`
      };
    }
  };

  // Test TCP connectivity to camera port
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/cameras/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: camIp.trim(), port: camPort, timeoutMs: 3000 })
      });

      const data = await response.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ online: false, error: 'Falha ao conectar com o serviço de teste' });
    } finally {
      setIsTesting(false);
    }
  };

  // Submit Single IP Camera
  const handleAddSingleCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!camName.trim() || !camIp.trim()) return;

    const urls = getRtspUrlTemplates(brand, camIp, camUser, camPassword, camChannel, camPort);

    const newCamera: CameraDevice = {
      id: `cam_${Date.now()}` as CameraFeedId,
      name: camName.trim(),
      location: camLocation.trim() || 'Monitoramento CFTV',
      ip: camIp.trim(),
      onvifPort: camHttpPort,
      rtspMainStream: customRtspMain.trim() || urls.main,
      rtspSubStream: customRtspSub.trim() || urls.sub,
      fpsStream: 30,
      fpsAiTarget: camAiFps,
      resolution: `${camIp}:554 (Canal ${camChannel})`,
      codec: camCodec,
      brand: brand === 'Intelbras' ? 'Intelbras VIP' : (brand === 'Hikvision' ? 'Hikvision IP' : (brand === 'Dahua' ? 'Dahua IPC' : 'ONVIF Universal')),
      status: 'online',
      gpuSlot: 'TensorRT Instance #0',
      isRealFeed: true,
      feedType: 'rtsp_stream',
      liveVideoUrl: `/api/cameras/stream?url=${encodeURIComponent(customRtspMain.trim() || urls.main)}`,
      zones: [
        {
          id: `zone_auto_${Date.now()}`,
          cameraId: `cam_${Date.now()}` as CameraFeedId,
          name: 'Cerca Virtual Padrão',
          type: 'polygon',
          points: [
            { x: 0.2, y: 0.5 },
            { x: 0.8, y: 0.5 },
            { x: 0.85, y: 0.9 },
            { x: 0.15, y: 0.9 }
          ],
          active: true,
          color: '#10b981',
          triggerCount: 0
        }
      ]
    };

    onAddCameras([newCamera]);
    onClose();
  };

  // Submit NVR Multi-Channel
  const handleAddNvr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nvrName.trim() || !nvrIp.trim()) return;

    const createdChannels: CameraDevice[] = [];
    const timestamp = Date.now();

    for (let ch = 1; ch <= nvrChannelCount; ch++) {
      const urls = getRtspUrlTemplates(brand, nvrIp, nvrUser, nvrPassword, ch, nvrPort);
      const channelName = `${nvrName} - Canal ${ch.toString().padStart(2, '0')}`;

      createdChannels.push({
        id: `cam_nvr_${timestamp}_${ch}` as CameraFeedId,
        name: channelName,
        location: `${brand} NVR (${nvrIp}) [CH ${ch}]`,
        ip: nvrIp.trim(),
        onvifPort: nvrWebPort,
        rtspMainStream: urls.main,
        rtspSubStream: urls.sub,
        fpsStream: 25,
        fpsAiTarget: nvrAiTargetFps,
        resolution: `${nvrIp}:554 (CH ${ch})`,
        codec: 'H.264',
        brand: `${brand} NVR (${nvrChannelCount} Canais)`,
        status: 'online',
        gpuSlot: `TensorRT Instance #${ch % 2}`,
        isRealFeed: true,
        feedType: 'rtsp_stream',
        liveVideoUrl: `/api/cameras/stream?url=${encodeURIComponent(urls.main)}`,
        zones: []
      });
    }

    onAddCameras(createdChannels);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER - ALWAYS STICKY & VISIBLE */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                Conectar Câmera IP, ONVIF ou NVR
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  CFTV PROFISSIONAL
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Integração nativa com Intelbras VIP/MHDX, Hikvision, Dahua e protocolos ONVIF/RTSP.
              </p>
            </div>
          </div>

          {/* HIGH CONTRAST CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
            title="Fechar Janela (Esc)"
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span>Fechar</span>
          </button>
        </div>

        {/* TABS SELECTOR */}
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setDeviceType('intelbras_ip')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                deviceType === 'intelbras_ip'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Câmera IP Intelbras / ONVIF</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceType('nvr')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                deviceType === 'nvr'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>NVR / DVR Multi-Canal</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceType('scanner')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                deviceType === 'scanner'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Scanner de Rede ONVIF</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceType('lan_bridge')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                deviceType === 'lan_bridge'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Câmeras na Rede Local (192.168)</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

          {/* TAB 1: INTELBRAS / ONVIF IP CAMERA */}
          {deviceType === 'intelbras_ip' && (
            <form onSubmit={handleAddSingleCamera} className="space-y-4">
              {/* Brand Selector */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Selecione o Fabricante / Perfil de Vídeo:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Intelbras', 'Hikvision', 'Dahua', 'ONVIF'] as const).map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrand(b)}
                      className={`py-2 px-3 rounded-xl text-xs font-mono transition-all text-center border ${
                        brand === b
                          ? 'bg-slate-800 text-cyan-400 border-cyan-500/60 font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {b === 'ONVIF' ? 'ONVIF Universal' : b}
                    </button>
                  ))}
                </div>
              </div>

              {/* IP Camera Settings Card */}
              <div className="space-y-3.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                    <Video className="w-4 h-4" />
                    Configuração da Câmera IP {brand}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Porta RTSP padrão: 554 • ONVIF: 80
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Nome da Câmera:</label>
                    <input
                      type="text"
                      value={camName}
                      onChange={e => setCamName(e.target.value)}
                      placeholder="Ex: Intelbras VIP Entrada"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Local / Posição:</label>
                    <input
                      type="text"
                      value={camLocation}
                      onChange={e => setCamLocation(e.target.value)}
                      placeholder="Ex: Fachada Externa"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Endereço IP ou DDNS:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={camIp}
                        onChange={e => setCamIp(e.target.value)}
                        placeholder="192.168.1.108 ou meuip.ddns.com.br"
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono text-xs"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTesting}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-semibold shrink-0 border border-slate-700 flex items-center gap-1"
                      >
                        {isTesting ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        <span>Testar</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Porta RTSP / Stream:</label>
                    <input
                      type="number"
                      value={camPort}
                      onChange={e => setCamPort(parseInt(e.target.value) || 554)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Usuário da Câmera:</label>
                    <input
                      type="text"
                      value={camUser}
                      onChange={e => setCamUser(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Senha da Câmera:</label>
                    <input
                      type="password"
                      value={camPassword}
                      onChange={e => setCamPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Test Connection Result Feedback */}
                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                    testResult.online 
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {testResult.online ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                      <span>
                        {testResult.online 
                          ? `Porta ${camPort} Aberta e Acessível! (Ping: ${testResult.latencyMs}ms)`
                          : `Porta ${camPort} inacessível: ${testResult.error || 'Dispositivo não respondeu'}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Auto-generated RTSP URLs for Intelbras */}
                <div className="space-y-2 pt-1 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 font-mono text-[11px]">
                      <span>URL RTSP Main Stream (Visualização 1080p / 4K):</span>
                      <span className="text-cyan-400 font-mono font-bold">Auto-Gerada Intelbras</span>
                    </div>
                    <input
                      type="text"
                      value={customRtspMain || getRtspUrlTemplates(brand, camIp, camUser, camPassword, camChannel, camPort).main}
                      onChange={e => setCustomRtspMain(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 font-mono text-[11px]">
                      <span>URL RTSP Sub Stream (Leve para Inferência IA):</span>
                      <span className="text-emerald-400 font-mono font-bold">Recomendado para IA</span>
                    </div>
                    <input
                      type="text"
                      value={customRtspSub || getRtspUrlTemplates(brand, camIp, camUser, camPassword, camChannel, camPort).sub}
                      onChange={e => setCustomRtspSub(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-[11px] focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Action Submit */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Cadastrar Câmera {brand}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: NVR / DVR MULTI-CHANNEL (Intelbras MHDX, Hikvision, Dahua) */}
          {deviceType === 'nvr' && (
            <form onSubmit={handleAddNvr} className="space-y-4">
              {/* Brand Selector */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Marca do Gravador NVR / DVR:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Intelbras', 'Hikvision', 'Dahua'] as const).map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrand(b)}
                      className={`py-2 px-3 rounded-xl text-xs font-mono transition-all text-center border ${
                        brand === b
                          ? 'bg-slate-800 text-emerald-400 border-emerald-500/60 font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {b} {b === 'Intelbras' ? '(MHDX / Multi-HD)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                    <Server className="w-4 h-4" />
                    Parâmetros do Gravador NVR / DVR
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Cria automaticamente fluxos RTSP independentes por canal
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Identificação do NVR:</label>
                    <input
                      type="text"
                      value={nvrName}
                      onChange={e => setNvrName(e.target.value)}
                      placeholder="Ex: Intelbras MHDX Portaria"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Endereço IP ou DDNS do NVR:</label>
                    <input
                      type="text"
                      value={nvrIp}
                      onChange={e => setNvrIp(e.target.value)}
                      placeholder="192.168.1.200 ou meunvr.ddns.com.br"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Porta RTSP (Padrão 554):</label>
                    <input
                      type="number"
                      value={nvrPort}
                      onChange={e => setNvrPort(parseInt(e.target.value) || 554)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Porta de Serviço (Intelbras 37777 / Web 80):</label>
                    <input
                      type="number"
                      value={nvrWebPort}
                      onChange={e => setNvrWebPort(parseInt(e.target.value) || 37777)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Usuário do NVR:</label>
                    <input
                      type="text"
                      value={nvrUser}
                      onChange={e => setNvrUser(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Senha do NVR:</label>
                    <input
                      type="password"
                      value={nvrPassword}
                      onChange={e => setNvrPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Channels count selector */}
                <div className="pt-2">
                  <label className="block text-xs text-slate-400 mb-1.5 font-mono">
                    Quantos Canais Deseja Importar para Monitoramento com IA?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[4, 8, 16, 32].map(count => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setNvrChannelCount(count)}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                          nvrChannelCount === count
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {count} Canais
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Importar {nvrChannelCount} Canais do NVR</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: NETWORK SCANNER */}
          {deviceType === 'scanner' && (
            <div className="space-y-4">
              <NetworkDiscoveryScanner
                existingCameras={[]}
                onAddCameras={(cams) => {
                  onAddCameras(cams);
                  onClose();
                }}
              />
            </div>
          )}

          {/* TAB 4: HOW TO CONNECT LOCAL 192.168 CAMERAS VIA CLOUD LINK */}
          {deviceType === 'lan_bridge' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-sm font-mono text-white">
                    Como conectar câmeras da sua rede local (192.168.x.x) a esta aplicação na nuvem:
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Quando você acessa um link HTTPS na nuvem, o navegador não tem permissão para entrar diretamente no IP privado do seu roteador sem que você configure uma das 3 pontes abaixo:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-1">
                  {/* Option 1: DDNS / Port Forward */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-cyan-400 font-bold block text-sm">Opção 1: DDNS / Port Forward</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      No seu roteador, faça o redirecionamento da porta <strong>554 (RTSP)</strong> para o IP da sua Intelbras ou NVR. Use o DDNS da Intelbras gratuito ou seu IP público.
                    </p>
                  </div>

                  {/* Option 2: Conector Local Python */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-emerald-400 font-bold block text-sm">Opção 2: Conector Edge Python</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Rode um script leve no seu PC ou Raspberry Pi conectado à mesma rede Wi-Fi das câmeras. Ele descobre o ONVIF e transmite os quadros direto para esta central.
                    </p>
                  </div>

                  {/* Option 3: VPN / Tailscale / Cloudflare Tunnel */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-amber-400 font-bold block text-sm">Opção 3: VPN ou Túnel Seguro</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Conecte sua rede local a um túnel seguro (Tailscale, WireGuard ou ngrok) para expor o stream RTSP da Intelbras com criptografia ponta a ponta.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-bold">Comando de 1 Linha para Varredura ONVIF na sua Máquina:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('curl -sSL https://raw.githubusercontent.com/rog-tech/edge-agent/main/install.sh | bash');
                        setCopiedCmd(true);
                        setTimeout(() => setCopiedCmd(false), 3000);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 underline text-[11px]"
                    >
                      {copiedCmd ? '✓ Comando Copiado!' : 'Copiar Comando'}
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                    curl -sSL https://raw.githubusercontent.com/rog-tech/edge-agent/main/install.sh | bash
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <span>Pressione [ESC] para fechar</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-400 underline font-semibold"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
