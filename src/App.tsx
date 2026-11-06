import React, { useState } from 'react';
import { SidebarNavigation } from './components/SidebarNavigation';
import { CommandCenterView } from './components/CommandCenterView';
import { LiveSimulator } from './components/LiveSimulator';
import { AutomationRulesEngine } from './components/AutomationRulesEngine';
import { DeviceManager } from './components/DeviceManager';
import { BiometricsManager } from './components/BiometricsManager';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { AddCameraOrNvrModal } from './components/AddCameraOrNvrModal';
import { InteractiveMapView } from './components/InteractiveMapView';
import { SystemLogsView } from './components/SystemLogsView';
import { ClientMultiTenantManager } from './components/ClientMultiTenantManager';
import { LocalNetworkDeployGuide } from './components/LocalNetworkDeployGuide';
import { NvrPlaybackView } from './components/NvrPlaybackView';
import { 
  INITIAL_CAMERAS, 
  INITIAL_AUTOMATION_RULES, 
  INITIAL_MQTT_LOGS, 
  INITIAL_REGISTERED_FACES, 
  INITIAL_REGISTERED_PLATES 
} from './data/mockData';
import { 
  CameraDevice, 
  CameraFeedId, 
  AutomationRule, 
  MqttLogMessage, 
  RegisteredFace, 
  RegisteredPlate, 
  SystemEventAlert 
} from './types';
import { 
  Bell, X, ShieldAlert, CheckCircle2, Zap, 
  LayoutDashboard, Video, Map, Radio, Sliders, BookOpen, UserCheck, Clock,
  Building, Download, User, ShieldCheck, Lock
} from 'lucide-react';

export default function App() {
  // Default to the Unified Command Center as requested
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [cameras, setCameras] = useState<CameraDevice[]>(INITIAL_CAMERAS);
  const [selectedCameraId, setSelectedCameraId] = useState<CameraFeedId>('cam_portao');
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_AUTOMATION_RULES);
  const [mqttLogs, setMqttLogs] = useState<MqttLogMessage[]>(INITIAL_MQTT_LOGS);
  const [faces, setFaces] = useState<RegisteredFace[]>(INITIAL_REGISTERED_FACES);
  const [plates, setPlates] = useState<RegisteredPlate[]>(INITIAL_REGISTERED_PLATES);
  const [alerts, setAlerts] = useState<SystemEventAlert[]>([]);
  const [latestPopup, setLatestPopup] = useState<SystemEventAlert | null>(null);
  const [isAddCameraModalOpen, setIsAddCameraModalOpen] = useState<boolean>(false);

  // Simulated Multi-Tenant Access Context (Super Admin vs Client Tenant)
  const [simulatedUser, setSimulatedUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'tenant_admin' | 'viewer';
    tenantId: string | null;
  }>({
    id: 'admin_master',
    name: 'Renato Olivier (Master ROG-TECH)',
    email: 'renattoolivier@gmail.com',
    role: 'super_admin',
    tenantId: null
  });

  // Handle Event Triggered from Computer Vision Simulation
  const handleTriggerEvent = (alertData: Omit<SystemEventAlert, 'id' | 'timestamp' | 'ack'>) => {
    const timestampStr = new Date().toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 900 + 100);
    const newAlert: SystemEventAlert = {
      id: `alert_${Date.now()}`,
      timestamp: timestampStr,
      ack: false,
      ...alertData
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 49)]);
    setLatestPopup(newAlert);

    setTimeout(() => {
      setLatestPopup(curr => curr?.id === newAlert.id ? null : curr);
    }, 6000);

    const newMqttLog: MqttLogMessage = {
      id: `mqtt_${Date.now()}`,
      timestamp: timestampStr,
      topic: `omnisight/events/${alertData.cameraId}/inference`,
      payload: JSON.stringify({
        event: alertData.title,
        severity: alertData.severity,
        metadata: alertData.metadata
      }),
      qos: 1,
      origin: 'VISION_INFERENCE'
    };

    setMqttLogs(prev => [newMqttLog, ...prev.slice(0, 99)]);

    rules.forEach(rule => {
      if (rule.enabled) {
        setRules(currentRules =>
          currentRules.map(r => r.id === rule.id ? { ...r, executionsCount: r.executionsCount + 1, lastTriggered: 'Agora' } : r)
        );

        setTimeout(() => {
          const actuatorLog: MqttLogMessage = {
            id: `act_${Date.now()}`,
            timestamp: new Date().toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 900 + 100),
            topic: rule.actionTarget === 'sonoff_relay'
              ? 'cmnd/sonoff_gate/POWER1'
              : (rule.actionTarget === 'tuya_light' ? 'tuya/garage/light/set' : 'omnisight/siren/alarm'),
            payload: JSON.stringify({ action: 'TRIGGER_PULSE', target: rule.actionTarget, rule_id: rule.id }),
            qos: 1,
            origin: 'IOT_ACTUATOR'
          };
          setMqttLogs(curr => [actuatorLog, ...curr.slice(0, 99)]);
        }, rule.estimatedLatencyMs);
      }
    });
  };

  // Rule Handlers
  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  };

  const handleExecuteManualAction = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const timestampStr = new Date().toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 900 + 100);

    const manualLog: MqttLogMessage = {
      id: `manual_${Date.now()}`,
      timestamp: timestampStr,
      topic: `cmnd/${rule.actionTarget}/MANUAL_OVERRIDE`,
      payload: JSON.stringify({ triggered_by: 'OPERATOR_WEB_UI', rule: rule.name }),
      qos: 1,
      origin: 'IOT_ACTUATOR'
    };

    setMqttLogs(prev => [manualLog, ...prev.slice(0, 99)]);
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, executionsCount: r.executionsCount + 1, lastTriggered: 'Manual agora' } : r));
  };

  const handleAddRule = (newRule: AutomationRule) => {
    setRules(prev => [newRule, ...prev]);
  };

  // Device & Biometric Handlers
  const handleAddBatchCameras = (newCams: CameraDevice[]) => {
    if (newCams.length === 0) return;
    // Prepend newly added cameras to the top so the user immediately sees them in the mosaic!
    setCameras(prev => [...newCams, ...prev]);
    setSelectedCameraId(newCams[0].id);

    const timestampStr = new Date().toTimeString().split(' ')[0];
    const isNvr = newCams.length > 1;
    const confirmAlert: SystemEventAlert = {
      id: `alert_add_${Date.now()}`,
      timestamp: timestampStr,
      cameraId: newCams[0].id,
      cameraName: newCams[0].name,
      severity: 'info',
      title: isNvr ? `NVR Adicionado (${newCams.length} Canais)` : `Câmera Adicionada: ${newCams[0].name}`,
      description: isNvr 
        ? `${newCams.length} fluxos RTSP gerados e integrados com sucesso ao pipeline de inferência.`
        : `Fluxo RTSP ${newCams[0].ip} pronto para processamento analítico.`,
      metadata: { count: newCams.length },
      ack: false
    };
    setAlerts(prev => [confirmAlert, ...prev]);
    setLatestPopup(confirmAlert);
    setTimeout(() => {
      setLatestPopup(curr => curr?.id === confirmAlert.id ? null : curr);
    }, 4500);
  };

  const handleAddCamera = (cam: CameraDevice) => {
    handleAddBatchCameras([cam]);
  };

  const handleDeleteCamera = (camId: string) => {
    setCameras(prev => prev.filter(c => c.id !== camId));
  };

  const handleUpdateAiFps = (camId: string, fps: number) => {
    setCameras(prev => prev.map(c => c.id === camId ? { ...c, fpsAiTarget: fps } : c));
  };

  const handleAddFace = (face: RegisteredFace) => {
    setFaces(prev => [face, ...prev]);
  };

  const handleDeleteFace = (id: string) => {
    setFaces(prev => prev.filter(f => f.id !== id));
  };

  const handleAddPlate = (plate: RegisteredPlate) => {
    setPlates(prev => [plate, ...prev]);
  };

  const handleDeletePlate = (id: string) => {
    setPlates(prev => prev.filter(p => p.id !== id));
  };

  const visibleCameras = cameras.filter(cam => {
    if (simulatedUser.role === 'super_admin') return true;
    if (simulatedUser.tenantId === 'tenant_condominio') {
      return ['cam_portao', 'cam_garagem'].includes(cam.id);
    }
    if (simulatedUser.tenantId === 'tenant_galpao') {
      return ['cam_fachada'].includes(cam.id);
    }
    return true;
  });

  const currentCam = visibleCameras.find(c => c.id === selectedCameraId) || visibleCameras[0] || cameras[0];
  const activeAlarms = alerts.filter(a => !a.ack && a.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex antialiased selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* DESKTOP LEFT SIDEBAR: Large Shortcuts + ROG-TECH Logo */}
      <div className="hidden md:block">
        <SidebarNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddCameraModal={() => setIsAddCameraModalOpen(true)}
          fpsAi={currentCam.fpsAiTarget}
          activeAlarmsCount={activeAlarms}
        />
      </div>

      {/* MAIN VIEWPORT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* MULTI-TENANT SIMULATION STATUS BANNER */}
        <div className={`px-4 py-1.5 text-xs font-mono flex items-center justify-between border-b ${
          simulatedUser.role === 'super_admin'
            ? 'bg-slate-950/90 border-cyan-500/30 text-cyan-300'
            : 'bg-amber-950/80 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">
              {simulatedUser.role === 'super_admin'
                ? 'ACESSO MASTER: Renato Olivier (Super Admin Global) • Vendo todas as câmeras de todos os clientes'
                : `VISÃO ISOLADA DE CLIENTE: ${simulatedUser.name} • Apenas câmeras autorizadas deste cliente`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {simulatedUser.role === 'super_admin' ? (
              <button
                onClick={() => {
                  setSimulatedUser({
                    id: 'usr_condo',
                    name: 'Condomínio Residencial Parque Solar',
                    email: 'sindico@parquesolar.com.br',
                    role: 'tenant_admin',
                    tenantId: 'tenant_condominio'
                  });
                }}
                className="px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer"
              >
                Simular Visão do Cliente 1
              </button>
            ) : (
              <button
                onClick={() => {
                  setSimulatedUser({
                    id: 'admin_master',
                    name: 'Renato Olivier (Master ROG-TECH)',
                    email: 'renattoolivier@gmail.com',
                    role: 'super_admin',
                    tenantId: null
                  });
                }}
                className="px-2.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all cursor-pointer"
              >
                Voltar para Master Admin
              </button>
            )}

            <button
              onClick={() => setActiveTab('clients')}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Gerenciar RLS
            </button>
          </div>
        </div>

        {/* Floating High-Priority Event Toast Banner */}
        {latestPopup && (
          <div className="fixed top-12 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
            <div className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start space-x-3 ${
              latestPopup.severity === 'critical'
                ? 'bg-rose-950/90 border-rose-500 text-rose-100 shadow-rose-950/50'
                : (latestPopup.severity === 'warning' ? 'bg-amber-950/90 border-amber-500 text-amber-100 shadow-amber-950/50' : 'bg-emerald-950/90 border-emerald-500 text-emerald-100 shadow-emerald-950/50')
            }`}>
              <div className="p-2 rounded-lg bg-black/40 mt-0.5 shrink-0">
                <ShieldAlert className="w-5 h-5 text-current" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40">
                    {latestPopup.severity.toUpperCase()} • {latestPopup.cameraName.split('-')[0]}
                  </span>
                  <span className="text-[10px] font-mono opacity-70">{latestPopup.timestamp}</span>
                </div>
                <div className="font-bold text-sm text-white">{latestPopup.title}</div>
                <p className="text-xs opacity-90 leading-relaxed">{latestPopup.description}</p>
              </div>
              <button
                onClick={() => setLatestPopup(null)}
                className="text-white/60 hover:text-white p-1 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header Bar (shown only on small screens without sidebar) */}
        <div className="md:hidden border-b border-slate-800 bg-slate-950/90 p-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-2.5">
            <img
              src="/assets/aistudio/image_e2be204d.png"
              alt="ROG-TECH"
              className="h-9 w-auto object-contain"
            />
            <span className="font-mono font-bold text-sm text-white">ROG-TECH</span>
          </div>

          <button
            onClick={() => setIsAddCameraModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1"
          >
            + ADICIONAR DISPOSITIVOS
          </button>
        </div>

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-20 md:pb-6">
          {activeTab === 'dashboard' && (
            <CommandCenterView
              cameras={visibleCameras}
              rules={rules}
              alerts={alerts}
              onTriggerAction={handleExecuteManualAction}
              onOpenAddCameraModal={() => setIsAddCameraModalOpen(true)}
              onNavigateTab={setActiveTab}
              onAddCamera={handleAddCamera}
              onDeleteCamera={handleDeleteCamera}
            />
          )}

          {activeTab === 'simulator' && (
            <LiveSimulator
              cameras={visibleCameras}
              selectedCameraId={selectedCameraId}
              onSelectCamera={setSelectedCameraId}
              onTriggerEvent={handleTriggerEvent}
              rules={rules}
              onOpenAddCameraModal={() => setIsAddCameraModalOpen(true)}
            />
          )}

          {activeTab === 'playback' && (
            <NvrPlaybackView
              cameras={visibleCameras}
            />
          )}

          {activeTab === 'maps' && (
            <InteractiveMapView
              cameras={visibleCameras}
              onTriggerAction={handleExecuteManualAction}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'rules' && (
            <AutomationRulesEngine
              rules={rules}
              mqttLogs={mqttLogs}
              onToggleRule={handleToggleRule}
              onExecuteManualAction={handleExecuteManualAction}
              onAddRule={handleAddRule}
            />
          )}

          {activeTab === 'logs' && (
            <SystemLogsView
              alerts={alerts}
              mqttLogs={mqttLogs}
              onTriggerAction={handleExecuteManualAction}
            />
          )}

          {activeTab === 'devices' && (
            <DeviceManager
              cameras={visibleCameras}
              onAddCamera={handleAddCamera}
              onAddBatchCameras={handleAddBatchCameras}
              onUpdateAiFps={handleUpdateAiFps}
              onOpenAddModal={() => setIsAddCameraModalOpen(true)}
            />
          )}

          {activeTab === 'biometrics' && (
            <BiometricsManager
              faces={faces}
              plates={plates}
              onAddFace={handleAddFace}
              onAddPlate={handleAddPlate}
              onDeleteFace={handleDeleteFace}
              onDeletePlate={handleDeletePlate}
            />
          )}

          {activeTab === 'clients' && (
            <ClientMultiTenantManager
              cameras={cameras}
              currentRole={simulatedUser.role}
              activeTenantId={simulatedUser.tenantId}
              onSwitchSimulatedUser={(userId, role, tenantId) => {
                setSimulatedUser({
                  id: userId,
                  name: role === 'super_admin' ? 'Renato Olivier (Master ROG-TECH)' : `Cliente (${tenantId})`,
                  email: role === 'super_admin' ? 'renattoolivier@gmail.com' : 'cliente@empresa.com.br',
                  role,
                  tenantId: tenantId || null
                });
              }}
            />
          )}

          {activeTab === 'local_deploy' && (
            <LocalNetworkDeployGuide />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureDocs />
          )}
        </main>

        {/* BOTTOM QUICK SWITCHER DOCK (Matching the dock bar in reference image) */}
        <nav className="fixed bottom-0 left-0 right-0 md:left-64 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-2 z-30 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'dashboard'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Dashboard</span>
            {activeTab === 'dashboard' && <span className="w-5 h-0.5 bg-cyan-400 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'simulator'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Câmeras</span>
            {activeTab === 'simulator' && <span className="w-5 h-0.5 bg-cyan-400 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('maps')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'maps'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Mapas</span>
            {activeTab === 'maps' && <span className="w-5 h-0.5 bg-cyan-400 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'rules'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Automações</span>
            {activeTab === 'rules' && <span className="w-5 h-0.5 bg-cyan-400 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'logs'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Logs</span>
            {activeTab === 'logs' && <span className="w-5 h-0.5 bg-cyan-400 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'devices'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Scanner</span>
            {activeTab === 'devices' && <span className="w-5 h-0.5 bg-cyan-400 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('biometrics')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'biometrics'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Faces & Placas</span>
            {activeTab === 'biometrics' && <span className="w-5 h-0.5 bg-cyan-400 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'clients'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Clientes & RLS</span>
            {activeTab === 'clients' && <span className="w-5 h-0.5 bg-cyan-400 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('local_deploy')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'local_deploy'
                ? 'text-emerald-400 font-bold'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] tracking-tight font-bold">Baixar App</span>
            {activeTab === 'local_deploy' && <span className="w-5 h-0.5 bg-emerald-400 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'architecture'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">PoC & Docs</span>
            {activeTab === 'architecture' && <span className="w-5 h-0.5 bg-cyan-400 rounded-full"></span>}
          </button>
        </nav>
      </div>

      {/* Modal: Adicionar Câmera ou NVR Multi-Canal */}
      <AddCameraOrNvrModal
        isOpen={isAddCameraModalOpen}
        onClose={() => setIsAddCameraModalOpen(false)}
        onAddCameras={handleAddBatchCameras}
      />
    </div>
  );
}
