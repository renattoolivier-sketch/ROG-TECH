import React, { useState, useEffect } from 'react';
import { CameraDevice, AutomationRule } from '../types';
import { 
  Users, Shield, Key, Lock, Eye, Plus, Trash2, 
  CheckCircle2, AlertTriangle, Building, UserCheck, 
  Server, Database, Copy, Check, ExternalLink, RefreshCw, X
} from 'lucide-react';

export interface ClientTenant {
  id: string;
  name: string;
  document: string; // CNPJ ou CPF
  plan: 'Básico' | 'Profissional' | 'Enterprise';
  status: 'active' | 'suspended';
  assignedCameraIds: string[];
  assignedActuatorIds: string[];
  maxCameras: number;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'operator' | 'viewer';
  active: boolean;
  lastLogin: string;
}

interface ClientMultiTenantManagerProps {
  cameras: CameraDevice[];
  currentRole: 'super_admin' | 'tenant_admin' | 'viewer';
  onSwitchSimulatedUser: (userId: string, role: 'super_admin' | 'tenant_admin' | 'viewer', tenantId?: string) => void;
  activeTenantId: string | null;
}

export const ClientMultiTenantManager: React.FC<ClientMultiTenantManagerProps> = ({
  cameras,
  currentRole,
  onSwitchSimulatedUser,
  activeTenantId
}) => {
  // Mock Tenants (Saved in localStorage for real persistence)
  const [tenants, setTenants] = useState<ClientTenant[]>(() => {
    const saved = localStorage.getItem('rog_tech_tenants');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      {
        id: 'tenant_condominio',
        name: 'Condomínio Residencial Parque Solar',
        document: '34.892.110/0001-45',
        plan: 'Profissional',
        status: 'active',
        assignedCameraIds: ['cam_portao', 'cam_garagem'],
        assignedActuatorIds: ['sonoff_relay', 'tuya_light'],
        maxCameras: 8,
        contactEmail: 'sindico@parquesolar.com.br',
        contactPhone: '(11) 98765-4321',
        createdAt: '15/01/2026'
      },
      {
        id: 'tenant_padaria',
        name: 'Padaria & Empório Central',
        document: '18.234.567/0001-90',
        plan: 'Básico',
        status: 'active',
        assignedCameraIds: ['cam_almoxarifado', 'cam_quintal'],
        assignedActuatorIds: ['mqtt_siren'],
        maxCameras: 4,
        contactEmail: 'gerencia@padariacentral.com.br',
        contactPhone: '(11) 99123-8877',
        createdAt: '02/02/2026'
      }
    ];
  });

  const [users, setUsers] = useState<TenantUser[]>(() => {
    const saved = localStorage.getItem('rog_tech_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      {
        id: 'user_master_renato',
        tenantId: 'master',
        name: 'Renato Olivier (Administrador Master)',
        email: 'renattoolivier@gmail.com',
        role: 'super_admin',
        active: true,
        lastLogin: 'Agora'
      },
      {
        id: 'user_sindico_carlos',
        tenantId: 'tenant_condominio',
        name: 'Carlos Mendes (Síndico Condomínio)',
        email: 'carlos@parquesolar.com.br',
        role: 'tenant_admin',
        active: true,
        lastLogin: 'Há 1 hora'
      },
      {
        id: 'user_morador_ana',
        tenantId: 'tenant_condominio',
        name: 'Ana Souza (Moradora Apto 42)',
        email: 'ana.souza@gmail.com',
        role: 'viewer',
        active: true,
        lastLogin: 'Ontem'
      },
      {
        id: 'user_gerente_marcos',
        tenantId: 'tenant_padaria',
        name: 'Marcos Roberto (Gerente Padaria)',
        email: 'marcos@padariacentral.com.br',
        role: 'tenant_admin',
        active: true,
        lastLogin: 'Há 3 horas'
      }
    ];
  });

  // New Client Modal Form
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPlan, setNewClientPlan] = useState<'Básico' | 'Profissional' | 'Enterprise'>('Profissional');
  const [selectedCamIds, setSelectedCamIds] = useState<string[]>([]);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('rog_tech_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('rog_tech_users', JSON.stringify(users));
  }, [users]);

  // Handle Create New Client Tenant
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newTenantId = `tenant_${Date.now()}`;
    const newTenant: ClientTenant = {
      id: newTenantId,
      name: newClientName.trim(),
      document: newClientDoc.trim() || 'Não informado',
      plan: newClientPlan,
      status: 'active',
      assignedCameraIds: selectedCamIds,
      assignedActuatorIds: ['sonoff_relay'],
      maxCameras: newClientPlan === 'Enterprise' ? 32 : (newClientPlan === 'Profissional' ? 16 : 4),
      contactEmail: newClientEmail.trim() || 'cliente@email.com',
      contactPhone: '(11) 99999-9999',
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    const newTenantAdmin: TenantUser = {
      id: `user_${Date.now()}`,
      tenantId: newTenantId,
      name: `Administrador - ${newClientName.trim()}`,
      email: newClientEmail.trim() || `admin@${newTenantId}.com`,
      role: 'tenant_admin',
      active: true,
      lastLogin: 'Nunca'
    };

    setTenants(prev => [newTenant, ...prev]);
    setUsers(prev => [...prev, newTenantAdmin]);
    setIsAddTenantModalOpen(false);
    setNewClientName('');
    setNewClientDoc('');
    setNewClientEmail('');
    setSelectedCamIds([]);
  };

  const handleToggleCameraForTenant = (tenantId: string, camId: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const has = t.assignedCameraIds.includes(camId);
        return {
          ...t,
          assignedCameraIds: has ? t.assignedCameraIds.filter(id => id !== camId) : [...t.assignedCameraIds, camId]
        };
      }
      return t;
    }));
  };

  const sqlSchemaCode = `-- =========================================================================
-- ROG-TECH COMMAND CENTER - SCHEMA MULTI-TENANT RBAC (POSTGRESQL / SUPABASE)
-- Garante o isolamento estrito de dados entre clientes e acesso total ao Admin
-- =========================================================================

-- 1. Tabela de Clientes / Empresas / Condomínios (Tenants)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20) UNIQUE, -- CNPJ ou CPF
    plan VARCHAR(50) DEFAULT 'Profissional',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
    max_cameras INT DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Usuários com RBAC (Papéis de Acesso)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'operator', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Câmeras IP e NVRs (Vinculadas ao Cliente)
CREATE TABLE cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    ip_address INET NOT NULL,
    rtsp_main_stream TEXT NOT NULL,
    rtsp_sub_stream TEXT NOT NULL,
    brand VARCHAR(100) DEFAULT 'Intelbras',
    codec VARCHAR(20) DEFAULT 'H.265',
    fps_ai_target INT DEFAULT 8,
    is_online BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitação de RLS (Row Level Security) - ISOLAMENTO REAL NO BANCO
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

-- Política de Acesso: O Administrador Master (Você) vê TUDO
CREATE POLICY admin_all_cameras ON cameras
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

-- Política de Acesso: O Cliente só enxerga e controla as câmeras do seu próprio Tenant!
CREATE POLICY tenant_isolated_cameras ON cameras
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));`;

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-black tracking-wider text-white uppercase font-mono">
              Gestão de Clientes & Multi-Usuário (Multi-Tenant RBAC)
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-500/40">
              ISOLAMENTO SEGURO
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Cada cliente possui acesso estritamente isolado às suas câmeras. Somente você (Administrador Master) tem visão global.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddTenantModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Cadastrar Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Live Profile Switcher Simulation Bar */}
      <div className="cyber-panel p-4 rounded-2xl border border-cyan-500/30 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Simulador de Perfis de Acesso (Teste a visão do seu cliente agora)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Perfil Ativo no Momento: <strong className="text-cyan-400 uppercase">{currentRole}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
          {/* Master Admin Button */}
          <button
            onClick={() => onSwitchSimulatedUser('user_master_renato', 'super_admin')}
            className={`p-3 rounded-xl border text-left transition-all ${
              currentRole === 'super_admin'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between">
              <span>👑 Administrador Master (Você)</span>
              {currentRole === 'super_admin' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
            <div className="text-[10px] text-cyan-300 mt-1">Acesso Global: Vê todas as câmeras de todos os clientes</div>
          </button>

          {/* Client 1 Button */}
          <button
            onClick={() => onSwitchSimulatedUser('user_sindico_carlos', 'tenant_admin', 'tenant_condominio')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTenantId === 'tenant_condominio'
                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-400 shadow-md ring-1 ring-emerald-400/50'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between">
              <span>🏢 Cliente: Condomínio Solar</span>
              {activeTenantId === 'tenant_condominio' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className="text-[10px] text-emerald-300 mt-1">Apenas Câmeras 1 e 2 (Portão e Garagem). Zero acesso a outros!</div>
          </button>

          {/* Client 2 Button */}
          <button
            onClick={() => onSwitchSimulatedUser('user_gerente_marcos', 'tenant_admin', 'tenant_padaria')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTenantId === 'tenant_padaria'
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between">
              <span>🥖 Cliente: Padaria Central</span>
              {activeTenantId === 'tenant_padaria' && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <div className="text-[10px] text-amber-300 mt-1">Apenas Câmeras 3 e 4 (Almoxarifado e Fachada). Isolado!</div>
          </button>
        </div>
      </div>

      {/* Clients / Tenants List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-400" />
            Clientes Cadastrados ({tenants.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Gerencie quais câmeras cada cliente tem permissão de visualizar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenants.map(tenant => (
            <div
              key={tenant.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-slate-700 transition-all shadow-lg"
            >
              {/* Tenant Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">{tenant.name}</h3>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Doc: {tenant.document} • Plano: <span className="text-cyan-400">{tenant.plan}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {tenant.status === 'active' ? 'Ativo' : 'Suspenso'}
                </span>
              </div>

              {/* Cameras Permitted for this client */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <span>Câmeras Liberadas para este Cliente:</span>
                  <span className="text-cyan-400 font-bold">{tenant.assignedCameraIds.length} / {tenant.maxCameras} Câmeras</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {cameras.map(cam => {
                    const isAllowed = tenant.assignedCameraIds.includes(cam.id);
                    return (
                      <button
                        key={cam.id}
                        onClick={() => handleToggleCameraForTenant(tenant.id, cam.id)}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          isAllowed
                            ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{cam.name}</span>
                        {isAllowed ? <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> : <Lock className="w-3 h-3 text-slate-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tenant Contact & Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>E-mail: {tenant.contactEmail}</span>
                <button
                  onClick={() => onSwitchSimulatedUser(`user_${tenant.id}`, 'tenant_admin', tenant.id)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 transition-colors font-bold text-[11px]"
                >
                  Entrar como Cliente &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Architecture Blueprint (SQL & Cloud) */}
      <div className="cyber-panel p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Estrutura de Banco de Dados para Produção (PostgreSQL / RLS)
            </h3>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sqlSchemaCode);
              setCopiedSchema(true);
              setTimeout(() => setCopiedSchema(false), 3000);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs flex items-center gap-1.5 border border-slate-700"
          >
            {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSchema ? 'SQL Copiado!' : 'Copiar DDL SQL'}</span>
          </button>
        </div>

        <p className="text-slate-300 font-sans text-xs leading-relaxed">
          Para hospedar este sistema na sua própria infraestrutura e atender centenas de clientes com segurança bancária, utilize o padrão <strong>Row Level Security (RLS)</strong> do PostgreSQL. O script abaixo garante que cada cliente receba uma chave de API ou token JWT que só pode consultar as suas próprias câmeras:
        </p>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px] overflow-x-auto max-h-72 leading-relaxed">
          {sqlSchemaCode}
        </pre>
      </div>

      {/* Modal: Cadastrar Novo Cliente Tenant */}
      {isAddTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base font-mono">Cadastrar Novo Cliente Tenant</h3>
              <button onClick={() => setIsAddTenantModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Nome da Empresa / Condomínio / Cliente:</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="Ex: Condomínio Jardim Europa ou Loja Central"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">CNPJ ou CPF:</label>
                  <input
                    type="text"
                    value={newClientDoc}
                    onChange={e => setNewClientDoc(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Plano de Monitoramento:</label>
                  <select
                    value={newClientPlan}
                    onChange={e => setNewClientPlan(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    <option value="Básico">Básico (Até 4 Câmeras)</option>
                    <option value="Profissional">Profissional (Até 16 Câmeras)</option>
                    <option value="Enterprise">Enterprise (Até 32 Câmeras)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">E-mail do Administrador do Cliente:</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={e => setNewClientEmail(e.target.value)}
                  placeholder="admin@cliente.com.br"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-mono">Selecione as Câmeras Iniciais Liberadas:</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-950 rounded-lg border border-slate-800">
                  {cameras.map(c => (
                    <label key={c.id} className="flex items-center space-x-2 text-slate-300 p-1.5 rounded hover:bg-slate-900 cursor-pointer text-[11px] font-mono">
                      <input
                        type="checkbox"
                        checked={selectedCamIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCamIds(prev => [...prev, c.id]);
                          else setSelectedCamIds(prev => prev.filter(id => id !== c.id));
                        }}
                        className="accent-cyan-400"
                      />
                      <span className="truncate">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTenantModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold font-mono text-xs"
                >
                  Criar Conta do Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
