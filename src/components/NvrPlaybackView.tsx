import React, { useState } from 'react';
import { CameraDevice } from '../types';
import { 
  Play, Pause, FastForward, Rewind, Calendar, Clock, 
  Search, HardDrive, Download, Video, UserCheck, Car, 
  ShieldAlert, Filter, Sparkles, CheckCircle2, ChevronRight,
  Volume2, VolumeX, Maximize2, Tag, Layers, RefreshCw
} from 'lucide-react';

interface NvrPlaybackViewProps {
  cameras: CameraDevice[];
}

export const NvrPlaybackView: React.FC<NvrPlaybackViewProps> = ({ cameras }) => {
  const [selectedChannel, setSelectedChannel] = useState<string>(cameras[0]?.id || 'cam_portao');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'faces' | 'plates' | 'alarms'>('all');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(34200); // 09:30:00 (in seconds from 00:00)
  const [selectedEventId, setSelectedEventId] = useState<string | null>('evt_face_1');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Active camera
  const currentCam = cameras.find(c => c.id === selectedChannel) || cameras[0];

  // Mock Recording Events with IA Recognition
  const mockPlaybackEvents = [
    {
      id: 'evt_face_1',
      timeSec: 34200, // 09:30:00
      timeFormatted: '09:30:00',
      type: 'face',
      title: 'Renato Olivier (Rosto Autorizado)',
      confidence: '96%',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      description: 'Face reconhecida no Canal 01 (Portão Social). Pulso de liberação enviado.',
      videoClip: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&auto=format&fit=crop&q=80'
    },
    {
      id: 'evt_plate_1',
      timeSec: 30600, // 08:30:00
      timeFormatted: '08:30:00',
      type: 'plate',
      title: 'Placa ABC-1234 (Toyota Corolla)',
      confidence: '94%',
      thumbnail: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&auto=format&fit=crop&q=80',
      description: 'Veículo autorizado detectado na entrada da garagem.',
      videoClip: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=900&auto=format&fit=crop&q=80'
    },
    {
      id: 'evt_alarm_1',
      timeSec: 10800, // 03:00:00
      timeFormatted: '03:00:00',
      type: 'alarm',
      title: 'Alarme Perimetral: Intrusão Noturna',
      confidence: '98%',
      thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=120&auto=format&fit=crop&q=80',
      description: 'Cruzamento de Linha Virtual (Tripwire) detectado na cerca externa.',
      videoClip: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80'
    },
    {
      id: 'evt_face_2',
      timeSec: 46800, // 13:00:00
      timeFormatted: '13:00:00',
      type: 'face',
      title: 'Visitante Desconhecido (Não Cadastrado)',
      confidence: '82%',
      thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      description: 'Face não encontrada no banco biométrico. Alerta enviado à portaria.',
      videoClip: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&auto=format&fit=crop&q=80'
    }
  ];

  const formatSecondsToClock = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const filteredEvents = mockPlaybackEvents.filter(evt => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'faces') return evt.type === 'face';
    if (selectedFilter === 'plates') return evt.type === 'plate';
    if (selectedFilter === 'alarms') return evt.type === 'alarm';
    return true;
  });

  const activeEvent = mockPlaybackEvents.find(e => e.id === selectedEventId) || mockPlaybackEvents[0];

  const handleDownloadClip = (eventTitle: string, timeStr: string) => {
    setDownloadSuccessToast(`Exportando clipe gravado: ${eventTitle} (${timeStr}) em MP4 com autenticação digital.`);
    setTimeout(() => setDownloadSuccessToast(null), 5000);
  };

  return (
    <div className="space-y-5 font-sans text-slate-100 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {downloadSuccessToast && (
        <div className="fixed top-16 right-5 z-50 animate-in slide-in-from-top duration-300">
          <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-100 shadow-2xl flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-xs text-white">Download Iniciado!</div>
              <div className="text-xs text-emerald-200/90">{downloadSuccessToast}</div>
            </div>
          </div>
        </div>
      )}

      {/* 1. HEADER: NVR Storage Status & Channel Selector */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold font-mono uppercase tracking-wider text-white">
              Playback & Gravações do NVR
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40">
              ONVIF PROFILE G
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Acesse as gravações 24/7 salvas no HD do seu NVR com busca inteligente por eventos de IA (Rostos, Placas e Alarmes).
          </p>
        </div>

        {/* NVR Hard Drive Status Badge */}
        <div className="flex items-center space-x-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div className="text-xs font-mono">
            <span className="text-slate-400">Armazenamento: </span>
            <span className="text-white font-bold">HD 4TB WD Purple (88% usado • 28 dias gravados)</span>
          </div>
        </div>
      </div>

      {/* 2. CONTROLS BAR: Channel + Date + AI Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg text-xs font-mono">
        {/* Channel Selection */}
        <div>
          <label className="text-slate-400 block mb-1 text-[11px] font-bold uppercase">
            Canal do Gravador (Câmera)
          </label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono outline-none focus:border-cyan-400 cursor-pointer"
          >
            {cameras.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.ip})
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="text-slate-400 block mb-1 text-[11px] font-bold uppercase">
            Data da Gravação
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Event Filter */}
        <div>
          <label className="text-slate-400 block mb-1 text-[11px] font-bold uppercase">
            Filtrar Eventos da Inteligência Artificial
          </label>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`py-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedFilter('faces')}
              className={`py-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                selectedFilter === 'faces'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-950 text-cyan-300 hover:text-white border border-slate-800'
              }`}
            >
              Rostos
            </button>
            <button
              onClick={() => setSelectedFilter('plates')}
              className={`py-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                selectedFilter === 'plates'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-950 text-amber-300 hover:text-white border border-slate-800'
              }`}
            >
              Placas
            </button>
            <button
              onClick={() => setSelectedFilter('alarms')}
              className={`py-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                selectedFilter === 'alarms'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-950 text-rose-300 hover:text-white border border-slate-800'
              }`}
            >
              Alarmes
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN VIDEO PLAYER + EVENT SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl group">
            <img
              src={activeEvent.videoClip}
              alt="Playback Frame"
              className="w-full h-full object-cover"
            />

            {/* AI Bounding Box on Playback */}
            {activeEvent.type === 'face' && (
              <div className="absolute top-[25%] left-[28%] w-[24%] h-[46%] border-2 border-cyan-400 rounded-lg pointer-events-none shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                <span className="absolute -top-6 left-0 bg-cyan-950/90 text-cyan-300 border border-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  {activeEvent.title} • {activeEvent.confidence}
                </span>
              </div>
            )}
            {activeEvent.type === 'plate' && (
              <div className="absolute top-[32%] right-[15%] w-[35%] h-[40%] border-2 border-amber-400 rounded-lg pointer-events-none shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                <span className="absolute -top-6 left-0 bg-amber-950/90 text-amber-300 border border-amber-400 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  {activeEvent.title} • {activeEvent.confidence}
                </span>
              </div>
            )}

            {/* Top OSD Information */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="font-bold text-xs text-white font-mono">
                  GRAVAÇÃO: {currentCam?.name}
                </span>
              </div>

              <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono text-cyan-300">
                {selectedDate} • {formatSecondsToClock(currentTimeSec)}
              </div>
            </div>

            {/* Bottom Playback HUD Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 text-xs font-mono">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer"
                  title={isPlaying ? 'Pausar' : 'Reproduzir'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button
                  onClick={() => setCurrentTimeSec(Math.max(0, currentTimeSec - 60))}
                  className="text-slate-300 hover:text-white p-1 transition-colors"
                  title="Voltar 1 minuto"
                >
                  <Rewind className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentTimeSec(Math.min(86399, currentTimeSec + 60))}
                  className="text-slate-300 hover:text-white p-1 transition-colors"
                  title="Avançar 1 minuto"
                >
                  <FastForward className="w-4 h-4" />
                </button>

                <div className="text-white font-bold">
                  {formatSecondsToClock(currentTimeSec)} / 23:59:59
                </div>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center space-x-1.5">
                {[1, 2, 4, 8].map(spd => (
                  <button
                    key={spd}
                    onClick={() => setPlaySpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      playSpeed === spd
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 24-HOUR INTERACTIVE TIMELINE */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Linha do Tempo 24h (HD do Gravador)</span>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                  <span>Gravação Contínua</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span>
                  <span>Rostos (IA)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400"></span>
                  <span>Placas (ALPR)</span>
                </span>
              </div>
            </div>

            {/* Interactive Timeline Track */}
            <div 
              className="relative h-10 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden cursor-pointer select-none group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                setCurrentTimeSec(Math.round(ratio * 86400));
              }}
            >
              {/* Continuous Green Recording Background */}
              <div className="absolute inset-y-1.5 left-[5%] right-[2%] bg-emerald-500/25 rounded-lg border border-emerald-500/40"></div>

              {/* Event Markers on Timeline */}
              {mockPlaybackEvents.map(evt => {
                const leftPercent = (evt.timeSec / 86400) * 100;
                return (
                  <div
                    key={evt.id}
                    style={{ left: `${leftPercent}%` }}
                    className={`absolute top-0 bottom-0 w-2.5 -ml-1 transition-transform group-hover:scale-125 z-10 ${
                      evt.type === 'face'
                        ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                        : (evt.type === 'plate' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]')
                    }`}
                    title={`${evt.title} (${evt.timeFormatted})`}
                  />
                );
              })}

              {/* Current Time Needle / Cursor */}
              <div
                style={{ left: `${(currentTimeSec / 86400) * 100}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-[0_0_10px_white]"
              >
                <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-white rounded-full border-2 border-slate-950 shadow"></div>
              </div>
            </div>

            {/* Timeline Hours Reference */}
            <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>

        {/* AI Events Playback List (Instant Jump to Clip) */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Eventos Encontrados ({filteredEvents.length})</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Clique para saltar</span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredEvents.map(evt => (
                <div
                  key={evt.id}
                  onClick={() => {
                    setSelectedEventId(evt.id);
                    setCurrentTimeSec(evt.timeSec);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 ${
                    selectedEventId === evt.id
                      ? 'bg-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/40'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={evt.thumbnail}
                    alt={evt.title}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-cyan-400">
                        {evt.timeFormatted}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        evt.type === 'face'
                          ? 'bg-cyan-950 text-cyan-300'
                          : (evt.type === 'plate' ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300')
                      }`}>
                        {evt.confidence}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate font-mono">
                      {evt.title}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {evt.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Evidence Clip Button */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => handleDownloadClip(activeEvent.title, activeEvent.timeFormatted)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Baixar Trecho Selecionado (MP4)</span>
            </button>
            <div className="text-[10px] text-center text-slate-500 font-mono">
              Com carimbo de data/hora (OSD) e hash de integridade contra adulteração.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
