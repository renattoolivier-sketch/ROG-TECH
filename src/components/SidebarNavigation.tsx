import React, { useState } from 'react';
import { 
  LayoutDashboard, Video, Map, Sliders, Zap, 
  FileText, Plus, Radio, Server, Shield, Sparkles, BookOpen, UserCheck, Clock,
  Building, Download, HardDrive
} from 'lucide-react';

interface SidebarNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddCameraModal: () => void;
  fpsAi: number;
  activeAlarmsCount: number;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddCameraModal,
  fpsAi,
  activeAlarmsCount
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Visão de Comando',
      sub: 'Mosaico & Controle Global',
      icon: LayoutDashboard,
      badge: 'ROG-TECH'
    },
    {
      id: 'simulator',
      label: 'Câmeras',
      sub: '4K Feeds & IA ao Vivo',
      icon: Video
    },
    {
      id: 'playback',
      label: 'Gravações & NVR',
      sub: 'Linha do Tempo & Busca IA',
      icon: HardDrive,
      badge: 'NOVO'
    },
    {
      id: 'maps',
      label: 'Mapas & Perímetro',
      sub: 'Cercas & Zonas Virtuais',
      icon: Map
    },
    {
      id: 'rules',
      label: 'Automações',
      sub: 'Sonoff, Tuya & MQTT',
      icon: Zap
    },
    {
      id: 'logs',
      label: 'Logs & Eventos',
      sub: 'Fluxo em Tempo Real',
      icon: Clock
    },
    {
      id: 'devices',
      label: 'Scanner de Rede',
      sub: 'ONVIF WS-Discovery',
      icon: Radio
    },
    {
      id: 'biometrics',
      label: 'Faces & Placas',
      sub: 'Cadastro ALPR & Rostos',
      icon: UserCheck
    },
    {
      id: 'clients',
      label: 'Clientes & Usuários',
      sub: 'Multi-Tenant & RLS',
      icon: Building,
      badge: 'NOVO'
    },
    {
      id: 'local_deploy',
      label: 'Baixar App & GitHub',
      sub: 'PC Local & Celular',
      icon: Download
    },
    {
      id: 'architecture',
      label: 'Arquitetura & PoC',
      sub: 'Código Python & DDL',
      icon: BookOpen
    }
  ];

  return (
    <aside className="w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 select-none shadow-2xl">
      {/* Top Branding with Official ROG-TECH Logo */}
      <div className="p-4 border-b border-slate-800/80 metallic-header">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <img
              src="/assets/aistudio/image_e2be204d.png"
              alt="ROG-TECH"
              className="h-16 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(56,189,248,0.5)] group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="text-base font-black tracking-wider text-white font-mono flex items-center justify-center gap-1.5">
              <span>ROG-TECH</span>
              <span className="text-[10px] font-bold text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30">
                EDGE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">
              COMMAND CENTER v2.4
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation Shortcut Buttons */}
      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
          Navegação Principal
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-400/60 text-white shadow-lg shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 group-hover:text-cyan-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className={`font-bold text-xs ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {item.sub}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* CTA: Add Camera or NVR Button */}
        <div className="pt-3">
          <button
            onClick={onOpenAddCameraModal}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer ring-1 ring-emerald-400/50"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ ADICIONAR DISPOSITIVOS</span>
          </button>
        </div>
      </div>

      {/* Footer System Telemetry Box */}
      <div className="p-3 border-t border-slate-900 bg-slate-950 space-y-2 text-[11px] font-mono">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span>Inferência IA:</span>
            <span className="text-emerald-400 font-bold">{fpsAi.toFixed(1)} FPS</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Broker MQTT:</span>
            <span className="text-cyan-400 font-semibold">1883 LAN</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Latência Sonoff:</span>
            <span className="text-amber-400 font-semibold">&lt; 150ms</span>
          </div>
        </div>

        {/* Link de Acesso Externo */}
        <button
          onClick={() => {
            const url = typeof window !== 'undefined' && window.location.origin.includes('run.app')
              ? window.location.origin
              : 'https://ais-dev-a6jju4nyfxintuddyz5iu5-551992737061.us-east1.run.app';
            navigator.clipboard.writeText(url);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 3000);
          }}
          className={`w-full py-2 px-2.5 rounded-xl border text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
            copiedLink
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
              : 'bg-slate-900 hover:bg-slate-800 border-cyan-500/30 text-cyan-300 hover:text-white'
          }`}
          title="Copiar link para abrir no celular ou compartilhar"
        >
          <span>{copiedLink ? '✓' : '🔗'}</span>
          <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link de Acesso'}</span>
        </button>

        {activeAlarmsCount > 0 && (
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center font-bold animate-pulse">
            {activeAlarmsCount} Alerta{activeAlarmsCount > 1 ? 's' : ''} Ativo{activeAlarmsCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </aside>
  );
};
