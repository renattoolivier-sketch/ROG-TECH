import React, { useState } from 'react';
import { SystemEventAlert, MqttLogMessage } from '../types';
import { 
  Clock, ShieldAlert, CheckCircle2, AlertTriangle, 
  Search, Filter, Download, Trash2, ArrowUpRight, Radio, RefreshCw 
} from 'lucide-react';

interface SystemLogsViewProps {
  alerts: SystemEventAlert[];
  mqttLogs: MqttLogMessage[];
  onTriggerAction: (ruleId: string) => void;
}

export const SystemLogsView: React.FC<SystemLogsViewProps> = ({
  alerts,
  mqttLogs,
  onTriggerAction
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'mqtt'>('events');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  // Seed default alerts if empty
  const defaultAlerts: SystemEventAlert[] = [
    {
      id: 'alert_default_1',
      timestamp: '22:15:30',
      cameraId: 'cam_portao',
      cameraName: 'Entrada Principal - 4K',
      severity: 'info',
      title: 'Rosto Identificado: Renato',
      description: 'Correspondência facial ArcFace com 91% de confiança. Acesso autorizado.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      metadata: { confidence: 0.91, match: 'Renato', role: 'Morador' },
      ack: false
    },
    {
      id: 'alert_default_2',
      timestamp: '22:12:15',
      cameraId: 'cam_garagem',
      cameraName: 'Garagem Sub-Solo',
      severity: 'info',
      title: 'Placa Reconhecida: ABC-1234',
      description: 'Padrão Mercosul detectado via FastALPR. Toyota Corolla autorizado.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&auto=format&fit=crop&q=80',
      metadata: { plate: 'ABC-1234', format: 'mercosul', model: 'Toyota Corolla' },
      ack: false
    },
    {
      id: 'alert_default_3',
      timestamp: '21:58:40',
      cameraId: 'cam_almoxarifado',
      cameraName: 'Fachada & Vaga',
      severity: 'critical',
      title: 'Objeto Ausente na Vaga Principal',
      description: 'Veículo Toyota Corolla removido da ROI por mais de 5 segundos.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=120&auto=format&fit=crop&q=80',
      metadata: { elapsed: '5.2s', threshold: '5.0s', roi: 'vaga_corolla' },
      ack: false
    },
    {
      id: 'alert_default_4',
      timestamp: '21:40:02',
      cameraId: 'cam_quintal',
      cameraName: 'Jardim dos Fundos',
      severity: 'warning',
      title: 'Animal Detectado no Jardim',
      description: 'Detecção de classe Pet (Gato). Cerca virtual não violada.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=120&auto=format&fit=crop&q=80',
      metadata: { class: 'cat', confidence: 0.88 },
      ack: false
    }
  ];

  const allAlerts = [...alerts, ...defaultAlerts];

  const filteredAlerts = allAlerts.filter(alert => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.cameraName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const exportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Timestamp,Camera,Severidade,Titulo,Descricao\n" +
      filteredAlerts.map(a => `"${a.timestamp}","${a.cameraName}","${a.severity}","${a.title}","${a.description}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rog_tech_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-mono">
              Central de Logs & Auditoria de Eventos
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-500/40">
              TEMPO REAL
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Registro detalhado de inferências de IA, acionamentos de relé e mensagens do broker MQTT
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sub Tab switch */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveSubTab('events')}
              className={`px-3 py-1 rounded-lg transition-colors ${activeSubTab === 'events' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Eventos ({filteredAlerts.length})
            </button>
            <button
              onClick={() => setActiveSubTab('mqtt')}
              className={`px-3 py-1 rounded-lg transition-colors ${activeSubTab === 'mqtt' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Barramento MQTT ({mqttLogs.length})
            </button>
          </div>

          <button
            onClick={exportCsv}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 cyber-panel p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por placa, nome, câmera ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px]">Severidade:</span>
          {(['all', 'critical', 'warning', 'info'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold transition-all ${
                filterSeverity === sev
                  ? (sev === 'critical' ? 'bg-rose-500 text-white' : sev === 'warning' ? 'bg-amber-500 text-slate-950' : sev === 'info' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-white')
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {sev === 'all' ? 'Todos' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeSubTab === 'events' ? (
        <div className="space-y-3">
          {filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                alert.severity === 'critical'
                  ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70'
                  : (alert.severity === 'warning' ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
              }`}
            >
              <div className="flex items-start space-x-3.5">
                {alert.thumbnailUrl ? (
                  <img
                    src={alert.thumbnailUrl}
                    alt={alert.title}
                    className="w-16 h-12 object-cover rounded-xl border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6 text-cyan-400" />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      alert.severity === 'critical'
                        ? 'bg-rose-500 text-white'
                        : (alert.severity === 'warning' ? 'bg-amber-400 text-slate-950' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40')
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">{alert.cameraName}</span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-[11px] font-mono text-slate-400">{alert.timestamp}</span>
                  </div>

                  <div className="font-bold text-sm text-white">{alert.title}</div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{alert.description}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => onTriggerAction('rule_portao_veiculo_autorizado')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono shadow-sm transition-all"
                >
                  Acionar Portão
                </button>
                <button
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-mono"
                >
                  Auditar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* MQTT Message Bus Stream */
        <div className="cyber-panel p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
            <span>Tópicos & Payloads MQTT (Mosquitto 1883 LAN)</span>
            <span className="text-emerald-400">Broker: Online</span>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {mqttLogs.map(log => (
              <div key={log.id} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                    <span className="text-cyan-400 font-bold">{log.topic}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">QoS {log.qos}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 break-all">{log.payload}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 self-start sm:self-center ${
                  log.origin === 'VISION_INFERENCE' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {log.origin}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
