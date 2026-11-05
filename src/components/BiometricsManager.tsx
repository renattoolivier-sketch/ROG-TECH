import React, { useState } from 'react';
import { RegisteredFace, RegisteredPlate } from '../types';
import { 
  UserCheck, Car, ShieldCheck, ShieldAlert, Plus, 
  Search, CheckCircle2, XCircle, Tag, Eye, Fingerprint, Sparkles
} from 'lucide-react';

interface BiometricsManagerProps {
  faces: RegisteredFace[];
  plates: RegisteredPlate[];
  onAddFace: (face: RegisteredFace) => void;
  onAddPlate: (plate: RegisteredPlate) => void;
  onDeleteFace: (id: string) => void;
  onDeletePlate: (id: string) => void;
}

export const BiometricsManager: React.FC<BiometricsManagerProps> = ({
  faces,
  plates,
  onAddFace,
  onAddPlate,
  onDeleteFace,
  onDeletePlate
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'faces' | 'plates'>('faces');
  const [searchQuery, setSearchQuery] = useState('');

  // New face modal
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceName, setFaceName] = useState('');
  const [faceRole, setFaceRole] = useState<'Morador' | 'Funcionário' | 'Visitante Frequente' | 'Lista Negra'>('Morador');
  const [faceNotes, setFaceNotes] = useState('');

  // New plate modal
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [plateOwner, setPlateOwner] = useState('');
  const [plateVehicle, setPlateVehicle] = useState('');
  const [plateAccess, setPlateAccess] = useState<'allow' | 'deny' | 'notify_only'>('allow');

  const filteredFaces = faces.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlates = plates.filter(p =>
    p.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateFace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faceName) return;

    const newFace: RegisteredFace = {
      id: `face_${Date.now()}`,
      name: faceName,
      role: faceRole,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      embeddingVectorLength: 512,
      registeredAt: new Date().toISOString().split('T')[0],
      status: faceRole === 'Lista Negra' ? 'blocked' : 'active',
      notes: faceNotes || 'Cadastrado no painel administrativo'
    };

    onAddFace(newFace);
    setShowFaceModal(false);
    setFaceName('');
    setFaceNotes('');
  };

  const handleCreatePlate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !plateOwner) return;

    // Detect format: Mercosul (3 letters, 1 number, 1 letter, 2 numbers - e.g. BRA2E19)
    const cleanPlate = plateNumber.toUpperCase().trim();
    const isMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleanPlate);

    const newPlate: RegisteredPlate = {
      id: `plate_${Date.now()}`,
      plate: cleanPlate,
      format: isMercosul ? 'mercosul' : 'antigo',
      ownerName: plateOwner,
      vehicleModel: plateVehicle || 'Veículo Cadastrado',
      accessLevel: plateAccess,
      lastSeen: 'Cadastrado agora'
    };

    onAddPlate(newPlate);
    setShowPlateModal(false);
    setPlateNumber('');
    setPlateOwner('');
    setPlateVehicle('');
  };

  return (
    <div className="space-y-6">
      {/* Top Selector & Search Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('faces')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeSubTab === 'faces'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Reconhecimento Facial ({faces.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('plates')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeSubTab === 'plates'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white bg-slate-800'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Reconhecimento de Placas / ALPR ({plates.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar registros..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {activeSubTab === 'faces' ? (
            <button
              onClick={() => setShowFaceModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Rosto
            </button>
          ) : (
            <button
              onClick={() => setShowPlateModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Placa
            </button>
          )}
        </div>
      </div>

      {/* Subtab 1: Facial Recognition Gallery */}
      {activeSubTab === 'faces' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredFaces.map(face => (
              <div
                key={face.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={face.avatarUrl}
                    alt={face.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                  />
                  <div>
                    <div className="font-semibold text-xs text-white line-clamp-1">{face.name}</div>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-mono font-medium mt-0.5 ${
                      face.role === 'Morador'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : (face.role === 'Lista Negra' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30')
                    }`}>
                      {face.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-slate-400 text-[11px] font-mono">
                  <div className="flex items-center justify-between">
                    <span>Vetor ArcFace:</span>
                    <span className="text-emerald-400">512-D float32</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cadastrado em:</span>
                    <span className="text-slate-300">{face.registeredAt}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  "{face.notes}"
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                    face.status === 'active' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {face.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {face.status === 'active' ? 'ACESSO LIBERADO' : 'BLOQUEADO / ALARME'}
                  </span>

                  <button
                    onClick={() => onDeleteFace(face.id)}
                    className="text-slate-500 hover:text-rose-400 text-xs"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: ALPR / License Plates */}
      {activeSubTab === 'plates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredPlates.map(plate => (
              <div
                key={plate.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                {/* Visual License Plate badge */}
                <div className="flex items-center justify-between">
                  <div className={`px-3 py-1.5 rounded-md font-mono font-black text-sm tracking-widest border-2 shadow-inner ${
                    plate.format === 'mercosul'
                      ? 'bg-slate-100 text-slate-900 border-blue-600'
                      : 'bg-neutral-800 text-neutral-100 border-neutral-600'
                  }`}>
                    {plate.format === 'mercosul' && (
                      <div className="text-[8px] bg-blue-700 text-white -mx-3 -mt-1.5 px-2 py-0.5 mb-1 flex items-center justify-between uppercase">
                        <span>BRASIL</span>
                        <span>MERCOSUL</span>
                      </div>
                    )}
                    {plate.plate}
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                    plate.accessLevel === 'allow'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : (plate.accessLevel === 'deny' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30')
                  }`}>
                    {plate.accessLevel === 'allow' ? 'LIBERA PORTÃO' : (plate.accessLevel === 'deny' ? 'BLOQUEADO' : 'NOTIFICAR')}
                  </span>
                </div>

                <div>
                  <div className="font-semibold text-xs text-white">{plate.ownerName}</div>
                  <div className="text-[11px] text-slate-400">{plate.vehicleModel}</div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                  <span>Último visto:</span>
                  <span className="text-slate-300">{plate.lastSeen || 'Hoje'}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-mono">
                    OCR: FastALPR Mercosul
                  </span>
                  <button
                    onClick={() => onDeletePlate(plate.id)}
                    className="text-slate-500 hover:text-rose-400 text-xs"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Face Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Cadastrar Rosto (ArcFace 512-D)
            </h3>
            <form onSubmit={handleCreateFace} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nome Completo:</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo Silva"
                  value={faceName}
                  onChange={e => setFaceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Categoria de Acesso:</label>
                <select
                  value={faceRole}
                  onChange={e => setFaceRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Morador">Morador (Liberação 24/7)</option>
                  <option value="Funcionário">Funcionário (Horário Comercial)</option>
                  <option value="Visitante Frequente">Visitante Autorizado</option>
                  <option value="Lista Negra">Lista Negra (Disparar Alarme Imediato)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observações de Acesso:</label>
                <textarea
                  rows={2}
                  placeholder="Unidade 402, acesso garagem e pedestres"
                  value={faceNotes}
                  onChange={e => setFaceNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFaceModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
                >
                  Salvar Face & Gerar Vetor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plate Modal */}
      {showPlateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-cyan-400" />
              Cadastrar Placa Veicular (ALPR)
            </h3>
            <form onSubmit={handleCreatePlate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Placa (Mercosul ou Antiga):</label>
                <input
                  type="text"
                  placeholder="Ex: BRA2E19 ou ABC-1234"
                  value={plateNumber}
                  onChange={e => setPlateNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono text-sm tracking-wider uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Proprietário / Morador:</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo Silva"
                  value={plateOwner}
                  onChange={e => setPlateOwner(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Modelo do Veículo:</label>
                <input
                  type="text"
                  placeholder="Ex: Toyota Corolla Cross Cinza"
                  value={plateVehicle}
                  onChange={e => setPlateVehicle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Ação ao Reconhecer:</label>
                <select
                  value={plateAccess}
                  onChange={e => setPlateAccess(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="allow">Liberar Portão Automaticamente (&lt;500ms)</option>
                  <option value="notify_only">Apenas Notificar Portaria / Log</option>
                  <option value="deny">Bloquear & Acionar Alarme (Lista Negra)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
                >
                  Salvar Placa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
