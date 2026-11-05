import React, { useState } from 'react';
import { AutomationRule, MqttLogMessage } from '../types';
import { 
  Zap, Radio, Activity, CheckCircle, AlertOctagon, 
  Send, RefreshCw, Cpu, Layers, ToggleLeft, ToggleRight, 
  Sliders, Plus, Terminal, Clock, ShieldAlert, Lightbulb, Lock, Unlock
} from 'lucide-react';

interface AutomationRulesEngineProps {
  rules: AutomationRule[];
  mqttLogs: MqttLogMessage[];
  onToggleRule: (ruleId: string) => void;
  onExecuteManualAction: (ruleId: string) => void;
  onAddRule: (rule: AutomationRule) => void;
}

export const AutomationRulesEngine: React.FC<AutomationRulesEngineProps> = ({
  rules,
  mqttLogs,
  onToggleRule,
  onExecuteManualAction,
  onAddRule
}) => {
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [isAddingRule, setIsAddingRule] = useState<boolean>(false);

  // Actuator live states
  const [gateRelayPulse, setGateRelayPulse] = useState<boolean>(false);
  const [pedestrianLock, setPedestrianLock] = useState<'locked' | 'unlocked'>('locked');
  const [tuyaLightState, setTuyaLightState] = useState<boolean>(false);
  const [sirenState, setSirenState] = useState<boolean>(false);

  // New rule form state
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState<any>('plate_authorized');
  const [newRuleTarget, setNewRuleTarget] = useState<any>('sonoff_relay');
  const [newRuleProtocol, setNewRuleProtocol] = useState<any>('LAN_EWE_LINK');

  const handleTestPulseGate = () => {
    setGateRelayPulse(true);
    onExecuteManualAction('rule_portao_veiculo_autorizado');
    setTimeout(() => {
      setGateRelayPulse(false);
    }, 1200);
  };

  const handleTogglePedestrian = () => {
    setPedestrianLock('unlocked');
    onExecuteManualAction('rule_portao_facial_morador');
    setTimeout(() => {
      setPedestrianLock('locked');
    }, 3000);
  };

  const handleToggleTuya = () => {
    const next = !tuyaLightState;
    setTuyaLightState(next);
    onExecuteManualAction('rule_garagem_noturno_tuya');
  };

  const handleToggleSiren = () => {
    const next = !sirenState;
    setSirenState(next);
    onExecuteManualAction('rule_objeto_ausente_alerta');
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName) return;

    const created: AutomationRule = {
      id: `rule_custom_${Date.now()}`,
      name: newRuleName,
      enabled: true,
      triggerCameraId: 'all',
      triggerEventType: newRuleTrigger,
      actionTarget: newRuleTarget,
      protocol: newRuleProtocol,
      actionPayload: { command: 'TRIGGER', timestamp: Date.now() },
      estimatedLatencyMs: newRuleProtocol === 'LAN_EWE_LINK' ? 115 : (newRuleProtocol === 'MQTT' ? 65 : 210),
      executionsCount: 0
    };

    onAddRule(created);
    setNewRuleName('');
    setIsAddingRule(false);
  };

  const filteredLogs = selectedTopicFilter === 'all'
    ? mqttLogs
    : mqttLogs.filter(log => log.topic.includes(selectedTopicFilter));

  return (
    <div className="space-y-6">
      {/* Overview & Latency Guarantee Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider whitespace-nowrap">Broker MQTT Local</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Mosquitto v2.0
            </div>
            <div className="text-[11px] text-slate-500 font-mono whitespace-nowrap">Porta 1883 | QoS 1 Garantido</div>
          </div>
          <Radio className="w-8 h-8 text-emerald-500/30 shrink-0" />
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider whitespace-nowrap">Latência Sonoff LAN</div>
            <div className="text-lg font-bold text-cyan-400 mt-0.5 whitespace-nowrap">
              ~95ms - 145ms
            </div>
            <div className="text-[11px] text-emerald-400 font-mono whitespace-nowrap">Meta &lt;500ms ATINGIDA</div>
          </div>
          <Zap className="w-8 h-8 text-cyan-500/30 shrink-0" />
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider whitespace-nowrap">Tuya Local API</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5 whitespace-nowrap">
              ~180ms - 220ms
            </div>
            <div className="text-[11px] text-slate-500 font-mono whitespace-nowrap">Sem dependência de Nuvem</div>
          </div>
          <Lightbulb className="w-8 h-8 text-amber-500/30 shrink-0" />
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider whitespace-nowrap">Regras Ativas</div>
            <div className="text-lg font-bold text-white mt-0.5 whitespace-nowrap">
              {rules.filter(r => r.enabled).length} de {rules.length}
            </div>
            <div className="text-[11px] text-slate-500 font-mono whitespace-nowrap">Avaliadas a cada inferência</div>
          </div>
          <Layers className="w-8 h-8 text-purple-500/30 shrink-0" />
        </div>
      </div>

      {/* Virtual IoT Actuators Testboard */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Bancada de Atuadores Físicos (Simulação de Hardware LAN)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Dispositivos locais integrados via LAN Mode (eWeLink Sonoff), Tuya Local Key e Tópicos MQTT diretos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Actuator 1: Sonoff Gate Relay */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-slate-200">Relé Portão Veicular</div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Sonoff LAN (eWeLink)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">IP: 192.168.1.150 | Ch 1</div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1.5">
                <span className={`w-3 h-3 rounded-full ${gateRelayPulse ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                <span className="text-xs font-mono font-medium text-slate-300">
                  {gateRelayPulse ? 'PULSO ATIVO (800ms)' : 'STANDBY'}
                </span>
              </div>
              <button
                onClick={handleTestPulseGate}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-cyan-500/30 flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Testar Pulso
              </button>
            </div>
          </div>

          {/* Actuator 2: Pedestrian MagLock */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-slate-200">Eletroímã Pedestres</div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Sonoff MINI LAN
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">IP: 192.168.1.151 | Ch 2</div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1.5">
                {pedestrianLock === 'locked' ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                )}
                <span className={`text-xs font-mono font-medium ${pedestrianLock === 'locked' ? 'text-slate-400' : 'text-emerald-400 font-bold'}`}>
                  {pedestrianLock === 'locked' ? 'TRAVADA' : 'LIBERADA (3s)'}
                </span>
              </div>
              <button
                onClick={handleTogglePedestrian}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-emerald-300 border border-emerald-500/30"
              >
                Liberar
              </button>
            </div>
          </div>

          {/* Actuator 3: Tuya Garage Spotlight */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-slate-200">Refletor LED Garagem</div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Tuya Local API
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">IP: 192.168.1.160 | DPS 20</div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1.5">
                <Lightbulb className={`w-3.5 h-3.5 ${tuyaLightState ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className={`text-xs font-mono font-medium ${tuyaLightState ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                  {tuyaLightState ? 'ACESO 100%' : 'APAGADO'}
                </span>
              </div>
              <button
                onClick={handleToggleTuya}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-amber-300 border border-amber-500/30"
              >
                Alternar
              </button>
            </div>
          </div>

          {/* Actuator 4: MQTT Siren */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-slate-200">Sirene Almoxarifado</div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                MQTT Broker Direct
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">Tópico: /siren_warehouse</div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1.5">
                <ShieldAlert className={`w-3.5 h-3.5 ${sirenState ? 'text-rose-500 animate-ping' : 'text-slate-500'}`} />
                <span className={`text-xs font-mono font-medium ${sirenState ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                  {sirenState ? 'DISPARANDO 120dB' : 'DESARMADA'}
                </span>
              </div>
              <button
                onClick={handleToggleSiren}
                className={`px-2.5 py-1 rounded text-xs font-mono border ${
                  sirenState
                    ? 'bg-rose-500 text-white border-rose-400 font-bold'
                    : 'bg-slate-800 text-rose-300 border-rose-500/30 hover:bg-slate-700'
                }`}
              >
                {sirenState ? 'Silenciar' : 'Disparar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Engine Table */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Matriz de Regras de Automação (IF-THIS-THEN-THAT)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Condições disparadas pelo pipeline de IA acionam comandos locais em sub-segundo.
            </p>
          </div>

          <button
            onClick={() => setIsAddingRule(!isAddingRule)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Regra
          </button>
        </div>

        {/* Add Rule Form Accordion */}
        {isAddingRule && (
          <form onSubmit={handleCreateRule} className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3 text-xs">
            <div className="font-bold text-emerald-400 text-sm">Configurar Nova Regra de Automação</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Nome da Regra:</label>
                <input
                  type="text"
                  placeholder="Ex: Abertura Cancelas..."
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">SE (Gatilho da Visão):</label>
                <select
                  value={newRuleTrigger}
                  onChange={e => setNewRuleTrigger(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="plate_authorized">Placa Veicular Autorizada</option>
                  <option value="face_authorized">Face Cadastrada (Morador/VIP)</option>
                  <option value="polygon_intrusion">Invasão de Cerca Virtual</option>
                  <option value="line_cross">Cruzamento de Linha Virtual (Tripwire)</option>
                  <option value="missing_object">Objeto Ausente &gt; X segundos</option>
                  <option value="human_night">Humano Detectado após as 22h</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ENTÃO (Ação IoT):</label>
                <select
                  value={newRuleTarget}
                  onChange={e => {
                    const val = e.target.value;
                    setNewRuleTarget(val);
                    if (val === 'sonoff_relay') setNewRuleProtocol('LAN_EWE_LINK');
                    else if (val === 'tuya_light') setNewRuleProtocol('TUYA_LOCAL');
                    else if (val === 'mqtt_siren') setNewRuleProtocol('MQTT');
                    else setNewRuleProtocol('FCM');
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="sonoff_relay">Pulso Relé Sonoff (Portão/Fechadura)</option>
                  <option value="tuya_light">Lâmpada / Refletor Tuya</option>
                  <option value="mqtt_siren">Sirene / Alarme via Tópico MQTT</option>
                  <option value="push_mobile">Notificação Push FCM + Foto</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingRule(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
              >
                Salvar Regra
              </button>
            </div>
          </form>
        )}

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Regra</th>
                <th className="py-2.5 px-3">Gatilho (IF)</th>
                <th className="py-2.5 px-3">Ação IoT (THEN)</th>
                <th className="py-2.5 px-3">Protocolo</th>
                <th className="py-2.5 px-3 text-right">Latência</th>
                <th className="py-2.5 px-3 text-center">Disparos</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rules.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <button
                      onClick={() => onToggleRule(rule.id)}
                      className="text-slate-400 hover:text-white"
                      title={rule.enabled ? "Desativar regra" : "Ativar regra"}
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {rule.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {rule.triggerEventType}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-cyan-400">
                      {rule.actionTarget}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {rule.protocol}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-400 font-semibold">
                    ~{rule.estimatedLatencyMs}ms
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {rule.executionsCount}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onExecuteManualAction(rule.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700"
                    >
                      Disparar Agora
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live MQTT Bus Packet Stream Terminal */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              Monitor do Barramento MQTT (Mosquitto 192.168.1.5:1883)
            </h3>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-mono">Filtrar Tópico:</span>
            <select
              value={selectedTopicFilter}
              onChange={e => setSelectedTopicFilter(e.target.value)}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs focus:outline-none"
            >
              <option value="all">Todos os Tópicos</option>
              <option value="events">omnisight/events/# (Inferência)</option>
              <option value="sonoff">cmnd/sonoff/# (Relé LAN)</option>
              <option value="system">omnisight/system/# (Health/VRAM)</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs max-h-64 overflow-y-auto space-y-2">
          {filteredLogs.map(log => (
            <div key={log.id} className="flex items-start space-x-2 text-[11px] hover:bg-slate-900/50 p-1 rounded">
              <span className="text-slate-500 whitespace-nowrap">[{log.timestamp}]</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] whitespace-nowrap ${
                log.origin === 'VISION_INFERENCE'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : (log.origin === 'IOT_ACTUATOR' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30')
              }`}>
                {log.origin}
              </span>
              <span className="text-amber-400 whitespace-nowrap">{log.topic}</span>
              <span className="text-slate-300 break-all">{log.payload}</span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="text-slate-500 italic text-center py-4">Nenhuma mensagem no tópico selecionado.</div>
          )}
        </div>
      </div>
    </div>
  );
};
