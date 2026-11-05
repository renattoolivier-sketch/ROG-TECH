import React from 'react';
import { Shield, Radio, Zap, Bell, Video, Sliders, BookOpen, UserCheck, Plus } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAlarmsCount: number;
  fpsAi: number;
  onOpenAddCameraModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeAlarmsCount,
  fpsAi,
  onOpenAddCameraModal,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between py-3 gap-4 flex-wrap lg:flex-nowrap min-h-[4rem]">
          {/* Logo & Brand Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg tracking-tight text-white whitespace-nowrap flex items-center gap-2">
                  <span>OmniSight</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                    AI EDGE
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block whitespace-nowrap">
                Visão Computacional & IoT para CFTV Legado
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1.5 overflow-x-auto py-1 max-w-full">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'simulator'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Simulador IA</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'rules'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Regras IoT & MQTT</span>
            </button>

            <button
              onClick={() => setActiveTab('devices')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'devices'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>ONVIF & Streams</span>
            </button>

            <button
              onClick={() => setActiveTab('biometrics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'biometrics'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Faces & Placas</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'architecture'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 hover:bg-cyan-900/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Arquitetura & PoC</span>
            </button>
          </nav>

          {/* Action Button: Add Device */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onOpenAddCameraModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all shrink-0 active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Câmera / NVR</span>
            </button>
          </div>
        </div>

        {/* Status & Telemetry Strip (Separate Row to prevent squishing and box overflow) */}
        <div className="py-2 border-t border-slate-900/80 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center space-x-3 overflow-x-auto max-w-full">
            {/* Badge 1: AI Pipeline */}
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-slate-400">Pipeline IA:</span>
              <span className="text-emerald-400 font-semibold">{fpsAi.toFixed(1)} FPS (Sub-stream)</span>
            </div>

            {/* Badge 2: MQTT Broker */}
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 shrink-0 whitespace-nowrap">
              <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-400">MQTT:</span>
              <span className="text-cyan-400 font-semibold">192.168.1.5:1883</span>
            </div>

            {/* Badge 3: LAN Latency */}
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 shrink-0 whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-400">Latência LAN:</span>
              <span className="text-amber-400 font-semibold">&lt; 150ms</span>
            </div>

            {/* Badge 4: Alarms (if any) */}
            {activeAlarmsCount > 0 && (
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-bounce shrink-0 whitespace-nowrap">
                <Bell className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold">{activeAlarmsCount} Alerta{activeAlarmsCount > 1 ? 's' : ''} Ativo{activeAlarmsCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 hidden md:block whitespace-nowrap">
            ONVIF Profile S/T • TensorRT FP16 • Zero Cloud Dependency
          </div>
        </div>
      </div>
    </header>
  );
};
