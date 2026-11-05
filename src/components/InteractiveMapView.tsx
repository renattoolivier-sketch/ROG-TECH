import React, { useState } from 'react';
import { CameraDevice, ZoneVirtual } from '../types';
import { 
  Map, Shield, Layers, Plus, Trash2, Eye, 
  Crosshair, Zap, Bell, CheckCircle2, AlertTriangle, ArrowRight, Radio
} from 'lucide-react';

interface InteractiveMapViewProps {
  cameras: CameraDevice[];
  onTriggerAction: (ruleId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  cameras,
  onTriggerAction,
  onNavigateTab
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('zone_perimeter');
  const [perimeterArmed, setPerimeterArmed] = useState<boolean>(true);
  const [activeLayer, setActiveLayer] = useState<'all' | 'cameras' | 'zones' | 'iot'>('all');
  const [simulatedIntruder, setSimulatedIntruder] = useState<boolean>(false);
  const [gateOpen, setGateOpen] = useState<boolean>(false);
  const [lightsOn, setLightsOn] = useState<boolean>(true);

  const handlePulseGate = () => {
    setGateOpen(true);
    onTriggerAction('rule_portao_veiculo_autorizado');
    setTimeout(() => setGateOpen(false), 2000);
  };

  const handleToggleLight = () => {
    setLightsOn(!lightsOn);
    onTriggerAction('rule_garagem_noturno_tuya');
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Map className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-mono">
              Planta Baixa & Cercas Virtuais
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-500/40">
              GEORREFERENCIADO
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Mapeamento espacial das 4 câmeras, zonas de intrusão e atuadores IoT na planta
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Layer toggles */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveLayer('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${activeLayer === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveLayer('cameras')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${activeLayer === 'cameras' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Câmeras
            </button>
            <button
              onClick={() => setActiveLayer('zones')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${activeLayer === 'zones' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Zonas
            </button>
            <button
              onClick={() => setActiveLayer('iot')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${activeLayer === 'iot' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              IoT
            </button>
          </div>

          <button
            onClick={() => setPerimeterArmed(!perimeterArmed)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              perimeterArmed
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{perimeterArmed ? 'Perímetro Armado' : 'Perímetro Desarmado'}</span>
          </button>
        </div>
      </div>

      {/* Main Floor Plan Canvas Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SVG Interactive Blueprint (col-span-8) */}
        <div className="lg:col-span-8 cyber-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Crosshair className="w-4 h-4" /> Planta Baixa Arquitetônica (Residencial & Perímetro)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSimulatedIntruder(!simulatedIntruder)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  simulatedIntruder
                    ? 'bg-rose-500 text-slate-950 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {simulatedIntruder ? '⚠️ Intruso Detectado na Cerca!' : 'Simular Invasão de Perímetro'}
              </button>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative aspect-[16/10] w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden p-2 select-none">
            <svg className="w-full h-full" viewBox="0 0 600 380" fill="none">
              {/* Technical Blueprint Grid Pattern */}
              <defs>
                <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" />
                </pattern>
                {/* Gradient for FOV Cones */}
                <radialGradient id="fovGradient" cx="0%" cy="0%" r="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </radialGradient>
              </defs>

              <rect width="600" height="380" fill="url(#mapGrid)" />

              {/* Perimeter Boundary Walls */}
              <rect x="40" y="30" width="520" height="320" stroke="#334155" strokeWidth="2.5" strokeDasharray="4 2" fill="none" />
              <text x="50" y="50" fill="#64748b" fontSize="10" fontFamily="monospace">MURO PERIMETRAL EXTERNO</text>

              {/* Main Building Layout */}
              <rect x="180" y="80" width="280" height="210" stroke="#475569" strokeWidth="2" fill="rgba(15, 23, 42, 0.6)" />
              
              {/* Internal Rooms */}
              <line x1="320" y1="80" x2="320" y2="200" stroke="#334155" strokeWidth="1.5" />
              <line x1="180" y1="200" x2="320" y2="200" stroke="#334155" strokeWidth="1.5" />
              <line x1="320" y1="160" x2="460" y2="160" stroke="#334155" strokeWidth="1.5" />

              <text x="220" y="140" fill="#94a3b8" fontSize="11" fontFamily="monospace">SALA DE ESTAR</text>
              <text x="210" y="250" fill="#94a3b8" fontSize="11" fontFamily="monospace">GARAGEM COBERTA</text>
              <text x="360" y="125" fill="#94a3b8" fontSize="11" fontFamily="monospace">SUÍTE PRINCIPAL</text>
              <text x="360" y="230" fill="#94a3b8" fontSize="11" fontFamily="monospace">ESCRITÓRIO / SOC</text>

              {/* Front Yard / Garden */}
              <rect x="50" y="80" width="120" height="210" stroke="#1e293b" strokeWidth="1" fill="rgba(6, 78, 59, 0.1)" />
              <text x="80" y="180" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">JARDIM</text>

              {/* Back Gate & Driveway */}
              <rect x="470" y="140" width="80" height="150" stroke="#1e293b" strokeWidth="1" fill="rgba(30, 41, 59, 0.3)" />
              <text x="480" y="220" fill="#64748b" fontSize="10" fontFamily="monospace">ACESSO VEÍCULOS</text>

              {/* ZONES LAYER */}
              {(activeLayer === 'all' || activeLayer === 'zones') && (
                <>
                  {/* Virtual Fence Polygon 1: Entrada & Garagem */}
                  <polygon
                    points="60,60 480,60 480,130 170,130 170,300 60,300"
                    fill={simulatedIntruder ? "rgba(244, 63, 94, 0.3)" : "rgba(6, 182, 212, 0.15)"}
                    stroke={simulatedIntruder ? "#f43f5e" : "#06b6d4"}
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                  />
                  {/* Vertices */}
                  <circle cx="60" cy="60" r="4" fill="#38bdf8" />
                  <circle cx="480" cy="60" r="4" fill="#38bdf8" />
                  <circle cx="480" cy="130" r="4" fill="#38bdf8" />
                  <circle cx="170" cy="130" r="4" fill="#38bdf8" />
                  <circle cx="170" cy="300" r="4" fill="#38bdf8" />
                  <circle cx="60" cy="300" r="4" fill="#38bdf8" />

                  <text x="75" y="80" fill={simulatedIntruder ? "#f43f5e" : "#38bdf8"} fontSize="10" fontFamily="monospace" fontWeight="bold">
                    {simulatedIntruder ? '⚠️ ALERTA: VIOLAÇÃO DE PERÍMETRO' : 'ZONA 1: CERCA VIRTUAL PERIMETRAL'}
                  </text>

                  {/* Tripwire Line with crossing arrows */}
                  <line x1="470" y1="200" x2="550" y2="200" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 2" />
                  <polygon points="510,190 515,200 505,200" fill="#f59e0b" />
                  <text x="475" y="190" fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    LINHA VIRTUAL (IN/OUT)
                  </text>
                </>
              )}

              {/* CAMERAS LAYER (FOV Cones & Icons) */}
              {(activeLayer === 'all' || activeLayer === 'cameras') && (
                <>
                  {/* Camera 1: Entrada Principal */}
                  <path d="M 60 70 L 160 30 L 160 110 Z" fill="url(#fovGradient)" />
                  <circle cx="60" cy="70" r="7" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                  <text x="45" y="95" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">CAM-01 [4K]</text>

                  {/* Camera 2: Garagem */}
                  <path d="M 190 270 L 290 230 L 290 310 Z" fill="url(#fovGradient)" />
                  <circle cx="190" cy="270" r="7" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                  <text x="175" y="330" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">CAM-02 [GARAGEM]</text>

                  {/* Camera 3: Jardim */}
                  <path d="M 160 170 L 70 120 L 70 220 Z" fill="url(#fovGradient)" />
                  <circle cx="160" cy="170" r="7" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                  <text x="145" y="195" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">CAM-03 [JARDIM]</text>

                  {/* Camera 4: Portão Fachada */}
                  <path d="M 470 200 L 560 160 L 560 240 Z" fill="url(#fovGradient)" />
                  <circle cx="470" cy="200" r="7" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                  <text x="440" y="255" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">CAM-04 [FACHADA]</text>
                </>
              )}

              {/* IOT ACTUATORS LAYER */}
              {(activeLayer === 'all' || activeLayer === 'iot') && (
                <>
                  {/* Sonoff Gate Relay */}
                  <g onClick={handlePulseGate} className="cursor-pointer">
                    <rect x="520" y="270" width="30" height="24" rx="4" fill={gateOpen ? "#10b981" : "#1e293b"} stroke="#06b6d4" strokeWidth="1.5" />
                    <text x="524" y="286" fill="#fff" fontSize="9" fontFamily="monospace" fontWeight="bold">RELÉ</text>
                    <text x="500" y="306" fill="#06b6d4" fontSize="8" fontFamily="monospace">Sonoff Portão</text>
                  </g>

                  {/* Tuya Light Bulb */}
                  <g onClick={handleToggleLight} className="cursor-pointer">
                    <circle cx="250" cy="220" r="12" fill={lightsOn ? "#f59e0b" : "#334155"} stroke="#fde047" strokeWidth="1.5" />
                    <text x="245" y="224" fill="#000" fontSize="10" fontWeight="bold">💡</text>
                    <text x="225" y="244" fill="#fbbf24" fontSize="8" fontFamily="monospace">Tuya Luz</text>
                  </g>

                  {/* Central SOC Alarm Siren */}
                  <g className="cursor-pointer">
                    <circle cx="400" cy="220" r="10" fill="#e11d48" stroke="#f43f5e" strokeWidth="1.5" />
                    <text x="395" y="224" fill="#fff" fontSize="10">🚨</text>
                    <text x="380" y="242" fill="#f43f5e" fontSize="8" fontFamily="monospace">Sirene SOC</text>
                  </g>
                </>
              )}

              {/* Simulated Intruder representation if triggered */}
              {simulatedIntruder && (
                <g>
                  <circle cx="120" cy="110" r="8" fill="#f43f5e" className="animate-ping" />
                  <circle cx="120" cy="110" r="6" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
                  <text x="132" y="114" fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    HUMANO NÃO AUTORIZADO
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Sidebar Controls & Zone Configuration (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Zones List */}
          <div className="cyber-panel p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" /> Zonas de Interesse (ROI)
              </span>
              <button
                onClick={() => onNavigateTab('simulator')}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono underline"
              >
                Desenhar na Câmera &rarr;
              </button>
            </div>

            <div className="space-y-2">
              <div
                onClick={() => setSelectedZone('zone_perimeter')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedZone === 'zone_perimeter'
                    ? 'border-cyan-400 bg-cyan-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs">Cerca Virtual Perimetral</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Polígono (6 Vértices)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Câmera: Entrada Principal (4K) • Disparo: Invasão &gt; 1s
                </div>
              </div>

              <div
                onClick={() => setSelectedZone('zone_tripwire')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedZone === 'zone_tripwire'
                    ? 'border-cyan-400 bg-cyan-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs">Linha Virtual Portão</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Tripwire (Sentido IN)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Câmera: Garagem • Disparo: Cruzamento Veicular
                </div>
              </div>

              <div
                onClick={() => setSelectedZone('zone_missing')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedZone === 'zone_missing'
                    ? 'border-cyan-400 bg-cyan-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs">Vaga Veículo (Objeto Ausente)</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    ROI Ausência (5s)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Câmera: Fachada • Disparo: Remoção de Veículo
                </div>
              </div>
            </div>
          </div>

          {/* IoT Actuators Linked to Map */}
          <div className="cyber-panel p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" /> Atuadores IoT no Mapa
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Online LAN</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Relé Sonoff (Portão)</div>
                  <div className="text-[10px] text-slate-400 font-mono">192.168.1.105:8081</div>
                </div>
                <button
                  onClick={handlePulseGate}
                  className={`px-3 py-1 rounded-lg font-mono font-bold text-xs transition-colors ${
                    gateOpen ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
                  }`}
                >
                  {gateOpen ? 'Acionado' : 'Pulsar'}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Refletor Tuya (Fachada)</div>
                  <div className="text-[10px] text-slate-400 font-mono">Tuya Local API</div>
                </div>
                <button
                  onClick={handleToggleLight}
                  className={`px-3 py-1 rounded-lg font-mono font-bold text-xs transition-colors ${
                    lightsOn ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {lightsOn ? 'Aceso' : 'Apagado'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
