import React, { useState } from 'react';
import { CameraDevice } from '../types';
import { ONVIF_DISCOVERED_SAMPLES } from '../data/mockData';
import { NetworkDiscoveryScanner } from './NetworkDiscoveryScanner';
import { 
  Sliders, Search, Plus, Radio, Server, Check, 
  RefreshCw, Cpu, HardDrive, Shield, Video, Layers, AlertCircle
} from 'lucide-react';

interface DeviceManagerProps {
  cameras: CameraDevice[];
  onAddCamera: (cam: CameraDevice) => void;
  onAddBatchCameras?: (cams: CameraDevice[]) => void;
  onUpdateAiFps: (camId: string, fps: number) => void;
  onOpenAddModal?: () => void;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  cameras,
  onAddCamera,
  onAddBatchCameras,
  onUpdateAiFps,
  onOpenAddModal
}) => {
  const [isScanningOnvif, setIsScanningOnvif] = useState<boolean>(false);
  const [discoveredDevices, setDiscoveredDevices] = useState(ONVIF_DISCOVERED_SAMPLES);
  const [showAddManualModal, setShowAddManualModal] = useState<boolean>(false);

  // Manual camera form
  const [manualName, setManualName] = useState('');
  const [manualIp, setManualIp] = useState('');
  const [manualRtspMain, setManualRtspMain] = useState('');
  const [manualRtspSub, setManualRtspSub] = useState('');
  const [manualCodec, setManualCodec] = useState<'H.264' | 'H.265'>('H.264');
  const [manualAiFps, setManualAiFps] = useState<number>(8);

  const handleStartOnvifScan = () => {
    setIsScanningOnvif(true);
    setTimeout(() => {
      setIsScanningOnvif(false);
    }, 1800);
  };

  const handlePairDiscovered = (device: typeof ONVIF_DISCOVERED_SAMPLES[0]) => {
    const newCam: CameraDevice = {
      id: `cam_auto_${Date.now()}` as any,
      name: `${device.brand} - ${device.model.split(' ')[0]}`,
      location: 'Nova Câmera Pareada ONVIF',
      ip: device.ip,
      onvifPort: device.port,
      rtspMainStream: device.rtspUrls[0],
      rtspSubStream: device.rtspUrls[1] || device.rtspUrls[0],
      fpsStream: 25,
      fpsAiTarget: 8,
      resolution: `${device.ip} (1080p)`,
      codec: 'H.264',
      brand: device.brand,
      status: 'online',
      gpuSlot: 'TensorRT Instance #0',
      zones: []
    };

    onAddCamera(newCam);
    setDiscoveredDevices(prev =>
      prev.map(d => d.ip === device.ip ? { ...d, status: 'configured' } : d)
    );
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualIp) return;

    const newCam: CameraDevice = {
      id: `cam_man_${Date.now()}` as any,
      name: manualName,
      location: 'Cadastrada Manualmente',
      ip: manualIp,
      onvifPort: 80,
      rtspMainStream: manualRtspMain || `rtsp://admin:admin@${manualIp}:554/live/ch0`,
      rtspSubStream: manualRtspSub || `rtsp://admin:admin@${manualIp}:554/live/ch1`,
      fpsStream: 30,
      fpsAiTarget: manualAiFps,
      resolution: `${manualIp} (Manual RTSP)`,
      codec: manualCodec,
      brand: 'Câmera IP / DVR Genérico',
      status: 'online',
      gpuSlot: 'TensorRT Instance #0',
      zones: []
    };

    onAddCamera(newCam);
    setShowAddManualModal(false);
    setManualName('');
    setManualIp('');
  };

  return (
    <div className="space-y-6">
      {/* Strategy Summary & Ingestion Architecture */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Arquitetura de Ingestão RTSP & Decodificação com Frame Skipping
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Como processar 4 a 8 câmeras legadas sem saturar CPU/GPU usando estratégia de Two-Stream e buffers circulares.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleStartOnvifScan}
              disabled={isScanningOnvif}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Search className={`w-3.5 h-3.5 ${isScanningOnvif ? 'animate-spin' : ''}`} />
              {isScanningOnvif ? 'Varrendo Sub-rede (Multicast)...' : 'Descobrir ONVIF (WS-Discovery)'}
            </button>

            <button
              onClick={() => onOpenAddModal ? onOpenAddModal() : setShowAddManualModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Adicionar Câmera ou NVR
            </button>
          </div>
        </div>

        {/* Two-Stream Pipeline Explanation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 flex items-center justify-between">
              <span>Main-stream (1080p/4K)</span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded">H.264 / H.265</span>
            </div>
            <div className="text-slate-200 font-bold text-sm">25 ~ 30 FPS Nativos</div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Direcionado direto para WebRTC/HLS de alta definição e gravação em disco NVMe/NVR sem passar por inferência de IA, poupando 85% de decodificação pesada.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 flex items-center justify-between">
              <span>Sub-stream (640x360)</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">Frame Skipping</span>
            </div>
            <div className="text-emerald-400 font-bold text-sm">5 ~ 10 FPS de Inferência</div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Resolução perfeita para detecção YOLOv8 (640x640 letterbox) sem distorção e sem gargalo de barramento PCIe.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 flex items-center justify-between">
              <span>Zero-Copy Ring Buffer</span>
              <span className="text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded">Shared Memory</span>
            </div>
            <div className="text-amber-400 font-bold text-sm">0ms Overhead de Pickle</div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Processos em Python acessam quadros decodificados via SharedMemory POSIX (<code className="text-amber-300">/dev/shm</code>), eliminando cópia de memória RAM.
            </p>
          </div>
        </div>
      </div>

      {/* Live Real-Time Network & ONVIF Device Scanner */}
      <NetworkDiscoveryScanner
        existingCameras={cameras}
        onAddCameras={onAddBatchCameras || (cams => cams.forEach(onAddCamera))}
      />

      {/* Configured Cameras & Ingestion Control Table */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Video className="w-4 h-4 text-emerald-400" />
          Câmeras Cadastradas & Otimização de Frame Skipping
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                <th className="py-2.5 px-3">Câmera</th>
                <th className="py-2.5 px-3">IP / Marca</th>
                <th className="py-2.5 px-3">Main Stream (Visualização)</th>
                <th className="py-2.5 px-3">Sub Stream (IA)</th>
                <th className="py-2.5 px-3">Taxa IA (Skip)</th>
                <th className="py-2.5 px-3">Hardware Decoder</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cameras.map(cam => (
                <tr key={cam.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {cam.name}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    <div>{cam.ip}</div>
                    <div className="text-[10px] text-slate-500">{cam.brand}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                    {cam.rtspMainStream}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-emerald-400 max-w-xs truncate">
                    {cam.rtspSubStream}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min={2}
                        max={15}
                        value={cam.fpsAiTarget}
                        onChange={e => onUpdateAiFps(cam.id, parseInt(e.target.value))}
                        className="w-16 accent-emerald-500"
                      />
                      <span className="text-emerald-400 font-bold">{cam.fpsAiTarget} FPS</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-400">
                    {cam.gpuSlot}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                      {cam.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Manual Modal */}
      {showAddManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Cadastrar Stream RTSP / Câmera Manual</h3>
            <form onSubmit={handleSaveManual} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nome Identificador:</label>
                <input
                  type="text"
                  placeholder="Ex: Câmera Corredor dos Fundos"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">IP do Dispositivo:</label>
                  <input
                    type="text"
                    placeholder="192.168.1.120"
                    value={manualIp}
                    onChange={e => setManualIp(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Codec:</label>
                  <select
                    value={manualCodec}
                    onChange={e => setManualCodec(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="H.264">H.264 (AVC)</option>
                    <option value="H.265">H.265 (HEVC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">URL RTSP Main Stream (Full HD/4K):</label>
                <input
                  type="text"
                  placeholder="rtsp://admin:pass@192.168.1.120:554/live/ch0"
                  value={manualRtspMain}
                  onChange={e => setManualRtspMain(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">URL RTSP Sub Stream (640x360 para IA):</label>
                <input
                  type="text"
                  placeholder="rtsp://admin:pass@192.168.1.120:554/live/ch1"
                  value={manualRtspSub}
                  onChange={e => setManualRtspSub(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Taxa de Inferência Alvo (Frame Skipping):</label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={manualAiFps}
                  onChange={e => setManualAiFps(parseInt(e.target.value) || 8)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
                >
                  Salvar Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
