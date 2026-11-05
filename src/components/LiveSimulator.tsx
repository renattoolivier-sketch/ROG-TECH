import React, { useState, useEffect, useRef } from 'react';
import { CameraDevice, DetectedEntity, Point, ZoneVirtual, CameraFeedId, SystemEventAlert, AutomationRule } from '../types';
import { 
  Play, Pause, RefreshCw, AlertTriangle, ShieldCheck, 
  Car, User, ShieldAlert, Crosshair, Sparkles, CheckCircle2, 
  Maximize2, Eye, Tag, Clock, ArrowRightLeft, Radio, Flame, 
  PackageCheck, PackageX, Plus, Server, Video
} from 'lucide-react';

interface LiveSimulatorProps {
  cameras: CameraDevice[];
  selectedCameraId: CameraFeedId;
  onSelectCamera: (id: CameraFeedId) => void;
  onTriggerEvent: (alert: Omit<SystemEventAlert, 'id' | 'timestamp' | 'ack'>) => void;
  rules: AutomationRule[];
  onOpenAddCameraModal: () => void;
}

export const LiveSimulator: React.FC<LiveSimulatorProps> = ({
  cameras,
  selectedCameraId,
  onSelectCamera,
  onTriggerEvent,
  rules,
  onOpenAddCameraModal
}) => {
  const currentCamera = cameras.find(c => c.id === selectedCameraId) || cameras[0];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Drawing state
  const [drawingMode, setDrawingMode] = useState<'none' | 'polygon' | 'tripwire' | 'missing_object'>('none');
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [localZones, setLocalZones] = useState<ZoneVirtual[]>(currentCamera.zones);

  // Entities stored in a ref for butter-smooth 60 FPS animation without causing React re-renders!
  const entitiesRef = useRef<DetectedEntity[]>([]);
  const [, setForceRenderCounter] = useState(0);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Object Abandonment / Missing state for warehouse
  const [monitoredObjectPresent, setMonitoredObjectPresent] = useState<boolean>(true);
  const [missingObjectElapsed, setMissingObjectElapsed] = useState<number>(0);
  const [missingAlarmTriggered, setMissingAlarmTriggered] = useState<boolean>(false);

  // Sync zones when camera changes
  useEffect(() => {
    setLocalZones(currentCamera.zones);
    setDraftPoints([]);
    setDrawingMode('none');
    entitiesRef.current = [];
    setForceRenderCounter(c => c + 1);
  }, [selectedCameraId, currentCamera]);

  // Handle Missing Object Countdown (e.g. 5 seconds)
  useEffect(() => {
    let timer: any;
    if (selectedCameraId === 'cam_almoxarifado') {
      if (!monitoredObjectPresent) {
        timer = setInterval(() => {
          setMissingObjectElapsed(prev => {
            const next = prev + 0.2;
            if (next >= 5 && !missingAlarmTriggered) {
              setMissingAlarmTriggered(true);
              onTriggerEvent({
                cameraId: 'cam_almoxarifado',
                cameraName: currentCamera.name,
                severity: 'critical',
                title: 'OBJETO CRÍTICO AUSENTE DA ROI!',
                description: 'Bicicleta Elétrica / Item monitorado ausente por mais de 5.0 segundos.',
                metadata: {
                  zone_id: 'zone_objeto_cofre',
                  missing_duration_sec: 5.0,
                  protocol: 'MQTT_BROKER_EMERGENCY'
                }
              });
            }
            return next;
          });
        }, 200);
      } else {
        setMissingObjectElapsed(0);
        setMissingAlarmTriggered(false);
      }
    }
    return () => clearInterval(timer);
  }, [monitoredObjectPresent, selectedCameraId, missingAlarmTriggered, currentCamera, onTriggerEvent]);

  // Point in Polygon Algorithm (Ray Casting)
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Distance from point to line segment
  const distToSegment = (p: Point, v: Point, w: Point): number => {
    const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  };

  // Main canvas render loop (Optimized: 0 React re-renders during 60 FPS animation!)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Simulated Camera Background
      drawCameraEnvironment(ctx, selectedCameraId, w, h);

      // 2. Draw Configured Zones
      localZones.forEach(zone => {
        if (!zone.active) return;
        ctx.save();
        if (zone.type === 'tripwire') {
          const p1 = zone.points[0];
          const p2 = zone.points[1];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
            ctx.strokeStyle = zone.color || '#10b981';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.stroke();

            const midX = ((p1.x + p2.x) / 2) * w;
            const midY = ((p1.y + p2.y) / 2) * h;
            ctx.fillStyle = zone.color || '#10b981';
            ctx.beginPath();
            ctx.arc(midX, midY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`⚡ ${zone.name} [${zone.direction?.toUpperCase() || 'BOTH'}]`, midX - 60, midY - 12);
          }
        } else if (zone.type === 'polygon') {
          if (zone.points.length >= 3) {
            ctx.beginPath();
            zone.points.forEach((pt, idx) => {
              if (idx === 0) ctx.moveTo(pt.x * w, pt.y * h);
              else ctx.lineTo(pt.x * w, pt.y * h);
            });
            ctx.closePath();
            ctx.fillStyle = `${zone.color}25`;
            ctx.fill();
            ctx.strokeStyle = zone.color;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            const first = zone.points[0];
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.fillText(`🛡️ ${zone.name}`, first.x * w + 5, first.y * h + 18);
          }
        } else if (zone.type === 'missing_object') {
          ctx.beginPath();
          zone.points.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x * w, pt.y * h);
            else ctx.lineTo(pt.x * w, pt.y * h);
          });
          ctx.closePath();

          if (monitoredObjectPresent) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
            ctx.strokeStyle = '#10b981';
          } else {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.strokeStyle = '#ef4444';
          }
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.setLineDash(monitoredObjectPresent ? [] : [6, 4]);
          ctx.stroke();

          const centerX = ((zone.points[0]?.x || 0.4) + (zone.points[2]?.x || 0.6)) / 2 * w;
          const centerY = ((zone.points[0]?.y || 0.4) + (zone.points[2]?.y || 0.6)) / 2 * h;
          
          if (monitoredObjectPresent) {
            ctx.fillStyle = '#10b981';
            ctx.fillRect(centerX - 80, centerY - 20, 160, 40);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('OBJETO PRESENTE', centerX, centerY - 2);
            ctx.font = '10px monospace';
            ctx.fillText('Monitoramento Ativo', centerX, centerY + 12);
            ctx.textAlign = 'left';
          } else {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(centerX - 95, centerY - 25, 190, 50);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ OBJETO REMOVIDO!', centerX, centerY - 5);
            ctx.font = 'bold 11px monospace';
            const remaining = Math.max(0, 5 - missingObjectElapsed).toFixed(1);
            ctx.fillText(missingAlarmTriggered ? 'DISPARO MQTT ATIVO' : `Alarme em: ${remaining}s`, centerX, centerY + 14);
            ctx.textAlign = 'left';
          }
        }
        ctx.restore();
      });

      // 3. Draw Draft Zone Points being drawn right now
      if (draftPoints.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        draftPoints.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x * w, pt.y * h);
          else ctx.lineTo(pt.x * w, pt.y * h);
        });
        ctx.stroke();

        draftPoints.forEach(pt => {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(pt.x * w, pt.y * h, 5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // 4. Update & Draw Simulated Entities directly in ref
      const currentEntities = entitiesRef.current;
      if (isPlaying && currentEntities.length > 0) {
        for (let i = 0; i < currentEntities.length; i++) {
          const entity = currentEntities[i];
          const [x, y, bw, bh] = entity.bbox;
          let nextY = y + 0.003;
          let nextX = x + 0.001;

          if (nextY > 0.85) nextY = 0.2; // loop motion

          entity.bbox = [nextX, nextY, bw, bh];
          const newCentroid = { x: nextX + bw / 2, y: nextY + bh };
          entity.centroid = newCentroid;
          entity.history.push(newCentroid);
          if (entity.history.length > 15) entity.history.shift();

          // Check against zones
          let isViolating = false;
          let crossedZoneName = '';

          for (const zone of localZones) {
            if (zone.type === 'polygon' && zone.points.length >= 3) {
              if (isPointInPolygon(newCentroid, zone.points)) {
                isViolating = true;
                crossedZoneName = zone.name;
                break;
              }
            } else if (zone.type === 'tripwire' && zone.points.length === 2) {
              const dist = distToSegment(newCentroid, zone.points[0], zone.points[1]);
              if (dist < 0.04) {
                isViolating = true;
                crossedZoneName = zone.name;
                break;
              }
            }
          }

          if (isViolating && !entity.isViolating) {
            entity.isViolating = true;
            onTriggerEvent({
              cameraId: currentCamera.id,
              cameraName: currentCamera.name,
              severity: entity.attributes?.isAuthorized === false ? 'critical' : 'warning',
              title: `Invasão Detectada: ${crossedZoneName || 'Cerca Virtual'}`,
              description: `${entity.label} (${(entity.confidence * 100).toFixed(0)}%) cruzou o perímetro delimitado.`,
              metadata: {
                entity_id: entity.id,
                class: entity.class,
                plate: entity.attributes?.plateNumber,
                face: entity.attributes?.faceMatchName,
                clothing: `${entity.attributes?.clothingTop || ''} / ${entity.attributes?.clothingBottom || ''}`
              }
            });
          } else if (!isViolating) {
            entity.isViolating = false;
          }
        }
      }

      // Render entity boxes
      currentEntities.forEach(entity => {
        const [x, y, bw, bh] = entity.bbox;
        const absX = x * w;
        const absY = y * h;
        const absW = bw * w;
        const absH = bh * h;

        ctx.save();
        const boxColor = entity.isViolating ? '#ef4444' : (entity.attributes?.isAuthorized === false ? '#f43f5e' : '#10b981');

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(absX, absY, absW, absH);

        if (entity.history.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = `${boxColor}80`;
          ctx.lineWidth = 1.5;
          entity.history.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt.x * w, pt.y * h);
            else ctx.lineTo(pt.x * w, pt.y * h);
          });
          ctx.stroke();
        }

        ctx.fillStyle = boxColor;
        ctx.beginPath();
        ctx.arc(entity.centroid.x * w, entity.centroid.y * h, 4, 0, Math.PI * 2);
        ctx.fill();

        const tagText = `${entity.label} ${(entity.confidence * 100).toFixed(0)}% [ID:#${entity.trackId}]`;
        ctx.font = 'bold 11px monospace';
        const tagWidth = ctx.measureText(tagText).width + 12;
        ctx.fillStyle = boxColor;
        ctx.fillRect(absX, absY - 22, tagWidth, 22);
        ctx.fillStyle = '#090d16';
        ctx.fillText(tagText, absX + 6, absY - 6);

        let attrText = '';
        if (entity.attributes?.plateNumber) {
          attrText = `🚗 PLACA: ${entity.attributes.plateNumber} (${entity.attributes.vehicleModel || 'Veículo'})`;
        } else if (entity.attributes?.faceMatchName) {
          attrText = `👤 ROSTO: ${entity.attributes.faceMatchName} (${(entity.attributes.faceMatchScore! * 100).toFixed(0)}%)`;
        } else if (entity.attributes?.clothingTop) {
          attrText = `👕 ${entity.attributes.clothingTop} | 👖 ${entity.attributes.clothingBottom}`;
        }

        if (attrText) {
          ctx.font = '10px monospace';
          const attrWidth = ctx.measureText(attrText).width + 12;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(absX, absY + absH + 4, attrWidth, 18);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(attrText, absX + 6, absY + absH + 16);
        }

        ctx.restore();
      });

      // OSD Header
      drawOSD(ctx, currentCamera, w, h);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedCameraId, currentCamera, localZones, draftPoints, isPlaying, monitoredObjectPresent, missingObjectElapsed, missingAlarmTriggered]);

  // Handle Canvas Click for drawing zones
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newPts = [...draftPoints, { x, y }];
    setDraftPoints(newPts);

    if (drawingMode === 'tripwire' && newPts.length === 2) {
      const newZone: ZoneVirtual = {
        id: `zone_trip_${Date.now()}`,
        cameraId: selectedCameraId,
        name: `Linha Virtual #${localZones.length + 1}`,
        type: 'tripwire',
        points: newPts,
        direction: 'both',
        active: true,
        color: '#10b981',
        triggerCount: 0
      };
      setLocalZones([...localZones, newZone]);
      setDraftPoints([]);
      setDrawingMode('none');
    } else if (drawingMode === 'missing_object' && newPts.length === 4) {
      const newZone: ZoneVirtual = {
        id: `zone_obj_${Date.now()}`,
        cameraId: selectedCameraId,
        name: `Objeto Monitorado ROI #${localZones.length + 1}`,
        type: 'missing_object',
        points: newPts,
        missingObjectTimeSeconds: 5,
        active: true,
        color: '#ef4444',
        triggerCount: 0
      };
      setLocalZones([...localZones, newZone]);
      setDraftPoints([]);
      setDrawingMode('none');
    }
  };

  const finishPolygon = () => {
    if (draftPoints.length < 3) return;
    const newZone: ZoneVirtual = {
      id: `zone_poly_${Date.now()}`,
      cameraId: selectedCameraId,
      name: `Cerca Virtual #${localZones.length + 1}`,
      type: 'polygon',
      points: draftPoints,
      active: true,
      color: '#f59e0b',
      triggerCount: 0
    };
    setLocalZones([...localZones, newZone]);
    setDraftPoints([]);
    setDrawingMode('none');
  };

  // Helper spawners
  const spawnHumanIntruder = () => {
    const newEntity: DetectedEntity = {
      id: `ent_human_${Date.now()}`,
      trackId: Math.floor(Math.random() * 900) + 100,
      class: 'human',
      label: 'Pessoa (Invasor)',
      confidence: 0.94,
      bbox: [0.45, 0.25, 0.12, 0.28],
      centroid: { x: 0.51, y: 0.53 },
      history: [],
      attributes: {
        clothingTop: 'Jaqueta Preta',
        clothingBottom: 'Calça Jeans Azul',
        isAuthorized: false
      }
    };
    entitiesRef.current.push(newEntity);
    setForceRenderCounter(c => c + 1);
  };

  const spawnVehicleWithPlate = () => {
    const newEntity: DetectedEntity = {
      id: `ent_car_${Date.now()}`,
      trackId: Math.floor(Math.random() * 900) + 100,
      class: 'vehicle',
      label: 'Veículo (Corolla)',
      confidence: 0.98,
      bbox: [0.35, 0.20, 0.28, 0.35],
      centroid: { x: 0.49, y: 0.55 },
      history: [],
      attributes: {
        plateNumber: 'BRA2E19',
        vehicleModel: 'Corolla Cross Cinza',
        isAuthorized: true
      }
    };
    entitiesRef.current.push(newEntity);
    setForceRenderCounter(c => c + 1);

    onTriggerEvent({
      cameraId: selectedCameraId,
      cameraName: currentCamera.name,
      severity: 'info',
      title: 'Placa Reconhecida: BRA2E19 (Mercosul)',
      description: 'Veículo de Morador Carlos Eduardo identificado. Acionando relé Sonoff do portão via LAN.',
      metadata: {
        plate: 'BRA2E19',
        action: 'SONOFF_PULSE_LAN_RELAY',
        latency_ms: 120
      }
    });
  };

  const spawnResidentFace = () => {
    const newEntity: DetectedEntity = {
      id: `ent_face_${Date.now()}`,
      trackId: Math.floor(Math.random() * 900) + 100,
      class: 'human',
      label: 'Humano',
      confidence: 0.96,
      bbox: [0.40, 0.30, 0.14, 0.32],
      centroid: { x: 0.47, y: 0.62 },
      history: [],
      attributes: {
        faceMatchName: 'Carlos Eduardo (Morador)',
        faceMatchScore: 0.978,
        clothingTop: 'Camisa Polo Azul',
        clothingBottom: 'Calça Bege',
        isAuthorized: true
      }
    };
    entitiesRef.current.push(newEntity);
    setForceRenderCounter(c => c + 1);

    onTriggerEvent({
      cameraId: selectedCameraId,
      cameraName: currentCamera.name,
      severity: 'info',
      title: 'Biometria Facial: Carlos Eduardo (97.8%)',
      description: 'Morador reconhecido pelo modelo ArcFace 512-D. Fechadura de pedestres liberada.',
      metadata: {
        face_id: 'face_01',
        name: 'Carlos Eduardo',
        match_score: 0.978,
        action: 'MAGNET_RELEASE_LAN'
      }
    });
  };

  const clearEntities = () => {
    entitiesRef.current = [];
    setForceRenderCounter(c => c + 1);
  };

  const resetZonesToDefault = () => {
    setLocalZones(currentCamera.zones);
    setDraftPoints([]);
    setDrawingMode('none');
  };

  return (
    <div className="space-y-6">
      {/* Camera Selection Bar with Prominent ADD CAMERA / NVR Button */}
      <div className="bg-slate-900/80 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Streams Switcher Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Câmeras ({cameras.length}):
            </span>
            {cameras.map(cam => (
              <button
                key={cam.id}
                onClick={() => onSelectCamera(cam.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all shrink-0 ${
                  cam.id === selectedCameraId
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cam.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="font-semibold">{cam.name.split('-')[0]}</span>
                <span className="text-[10px] text-slate-500 hidden md:inline">({cam.brand})</span>
              </button>
            ))}

            {/* PROMINENT BUTTON: ADICIONAR CÂMERA OU NVR */}
            <button
              onClick={onOpenAddCameraModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 shrink-0 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Câmera / NVR</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 shrink-0 whitespace-nowrap">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 shrink-0 whitespace-nowrap">
              {currentCamera.codec} • {currentCamera.fpsStream} FPS
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shrink-0 whitespace-nowrap">
              IA: {currentCamera.fpsAiTarget} FPS
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Video Canvas on Left, Controls & Inspection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Interactive CCTV Canvas */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              onClick={handleCanvasClick}
              className={`w-full aspect-video block bg-slate-950 ${
                drawingMode !== 'none' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />

            {/* Drawing Mode Status Bar Overlay */}
            {drawingMode !== 'none' && (
              <div className="absolute top-4 left-4 bg-slate-950/90 border border-cyan-500/50 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-3 shadow-lg">
                <Crosshair className="w-4 h-4 animate-spin text-cyan-400" />
                <span>
                  {drawingMode === 'polygon' && `Clique no canvas para adicionar pontos (${draftPoints.length} adicionados). Clique em Concluir quando terminar.`}
                  {drawingMode === 'tripwire' && `Clique no ponto inicial e final da Linha Virtual (pontos: ${draftPoints.length}/2).`}
                  {drawingMode === 'missing_object' && `Defina 4 cantos para a caixa do Objeto Monitorado (pontos: ${draftPoints.length}/4).`}
                </span>
                {drawingMode === 'polygon' && draftPoints.length >= 3 && (
                  <button
                    onClick={finishPolygon}
                    className="ml-2 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
                  >
                    Concluir Polígono
                  </button>
                )}
                <button
                  onClick={() => { setDrawingMode('none'); setDraftPoints([]); }}
                  className="text-slate-400 hover:text-white underline ml-2"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Missing Object Floating Action for Warehouse */}
            {selectedCameraId === 'cam_almoxarifado' && (
              <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-700 p-2.5 rounded-xl shadow-xl flex items-center space-x-3 text-xs">
                <span className="text-slate-300 font-medium">Simulação Objeto:</span>
                <button
                  onClick={() => setMonitoredObjectPresent(!monitoredObjectPresent)}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                    monitoredObjectPresent
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                  }`}
                >
                  {monitoredObjectPresent ? (
                    <>
                      <PackageX className="w-4 h-4" />
                      <span>Remover Objeto (Disparar Alarme)</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4" />
                      <span>Recolocar Objeto</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Canvas Toolbars & Drawing Tools */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <span className="text-slate-400 font-medium mr-1">Desenhar Zonas:</span>
              <button
                onClick={() => { setDrawingMode('polygon'); setDraftPoints([]); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  drawingMode === 'polygon'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                + Cerca Virtual (Polígono)
              </button>
              <button
                onClick={() => { setDrawingMode('tripwire'); setDraftPoints([]); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  drawingMode === 'tripwire'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                + Linha Virtual (Tripwire)
              </button>
              <button
                onClick={() => { setDrawingMode('missing_object'); setDraftPoints([]); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  drawingMode === 'missing_object'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                + Objeto Ausente (ROI)
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                title={isPlaying ? "Pausar Simulação" : "Executar Simulação"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={resetZonesToDefault}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                title="Resetar Zonas"
              >
                Resetar Zonas
              </button>
              <button
                onClick={clearEntities}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                title="Limpar Objetos"
              >
                Limpar Objetos
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Ingestion & Test Scenario Injectors */}
        <div className="space-y-4">
          {/* Quick AI Injections Card */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Injetar Cenários de IA
            </h3>
            <p className="text-[11px] text-slate-400">
              Gere detecções instantâneas de modelos para testar a cerca, leitura de placas e regras de automação:
            </p>

            <div className="space-y-2">
              <button
                onClick={spawnHumanIntruder}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Humano Invasor</div>
                    <div className="text-[10px] text-slate-400">Jaqueta Preta / Calça Jeans</div>
                  </div>
                </div>
                <span className="text-[10px] text-amber-400 font-mono group-hover:translate-x-0.5 transition-transform">Injetar &rarr;</span>
              </button>

              <button
                onClick={spawnVehicleWithPlate}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Carro + Placa Mercosul</div>
                    <div className="text-[10px] text-slate-400">Corolla Cross (BRA2E19)</div>
                  </div>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono group-hover:translate-x-0.5 transition-transform">Injetar &rarr;</span>
              </button>

              <button
                onClick={spawnResidentFace}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Rosto Morador (ArcFace)</div>
                    <div className="text-[10px] text-slate-400">Carlos Eduardo (Confiança 97.8%)</div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono group-hover:translate-x-0.5 transition-transform">Injetar &rarr;</span>
              </button>
            </div>
          </div>

          {/* Active Zones on this Camera */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Zonas Configuradas ({localZones.length})</span>
            </h3>
            <div className="space-y-2">
              {localZones.map((z) => (
                <div
                  key={z.id}
                  className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: z.color }}
                    />
                    <div>
                      <div className="font-medium text-slate-200">{z.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Tipo: {z.type.toUpperCase()} {z.direction ? `| Dir: ${z.direction}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {z.triggerCount} disparos
                  </span>
                </div>
              ))}
              {localZones.length === 0 && (
                <div className="text-xs text-slate-500 italic text-center py-2">
                  Nenhuma zona cadastrada. Use as ferramentas acima para desenhar.
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Specs Box */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-2 text-slate-400">
            <div className="flex justify-between">
              <span>Ingestão RTSP:</span>
              <span className="text-slate-200">Go2RTC / PyAV Ring Buffer</span>
            </div>
            <div className="flex justify-between">
              <span>Frame Skipping:</span>
              <span className="text-emerald-400 font-semibold">{currentCamera.fpsAiTarget} de {currentCamera.fpsStream} FPS</span>
            </div>
            <div className="flex justify-between">
              <span>Engine IA:</span>
              <span className="text-cyan-400">YOLOv8 + TensorRT FP16</span>
            </div>
            <div className="flex justify-between">
              <span>Tracking MOT:</span>
              <span className="text-slate-200">ByteTrack (Kalman Filter)</span>
            </div>
            <div className="flex justify-between">
              <span>Reconhecimento Facial:</span>
              <span className="text-slate-200">SCRFD + ArcFace (512-D)</span>
            </div>
            <div className="flex justify-between">
              <span>Leitura de Placas:</span>
              <span className="text-slate-200">FastALPR / PaddleOCR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Canvas drawing helpers for realistic CCTV visual simulation
function drawCameraEnvironment(ctx: CanvasRenderingContext2D, camId: CameraFeedId, w: number, h: number) {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);

  if (camId === 'cam_portao') {
    bgGrad.addColorStop(0, '#111827');
    bgGrad.addColorStop(0.4, '#1f2937');
    bgGrad.addColorStop(0.65, '#374151');
    bgGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(w, h * 0.7);
    ctx.stroke();

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.7);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(w * 0.1, h * 0.2, w * 0.8, h * 0.45);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    for (let x = w * 0.12; x < w * 0.88; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.2);
      ctx.lineTo(x, h * 0.65);
      ctx.stroke();
    }
  } else if (camId === 'cam_garagem') {
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e293b');
    bgGrad.addColorStop(1, '#334155');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.25, h * 0.4);
    ctx.lineTo(w * 0.15, h * 0.95);
    ctx.moveTo(w * 0.5, h * 0.4);
    ctx.lineTo(w * 0.45, h * 0.95);
    ctx.moveTo(w * 0.75, h * 0.4);
    ctx.lineTo(w * 0.80, h * 0.95);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(w * 0.82, h * 0.15, w * 0.12, h * 0.75);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 6;
    ctx.strokeRect(w * 0.82, h * 0.6, w * 0.12, 20);
  } else if (camId === 'cam_almoxarifado') {
    bgGrad.addColorStop(0, '#020617');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.05, h * 0.2, w * 0.25, h * 0.7);
    ctx.strokeRect(w * 0.70, h * 0.2, w * 0.25, h * 0.7);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.8);
    ctx.lineTo(w, h * 0.8);
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(w * 0.42, h * 0.48, w * 0.16, h * 0.22);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('ITEM PROTEGIDO #409', w * 0.43, h * 0.58);
    ctx.restore();
  } else {
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.6, '#0f172a');
    bgGrad.addColorStop(1, '#111827');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#374151';
    ctx.fillRect(0, h * 0.4, w, h * 0.25);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1.5;
    for (let y = h * 0.4; y < h * 0.65; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
}

function drawOSD(ctx: CanvasRenderingContext2D, cam: CameraDevice, w: number, h: number) {
  ctx.save();
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;

  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

  ctx.fillText(`CAM: ${cam.name} [${cam.ip}]`, 20, 30);
  
  const rightText = `${dateStr} | 30.0 FPS`;
  const rightWidth = ctx.measureText(rightText).width;
  ctx.fillText(rightText, w - rightWidth - 20, 30);

  ctx.font = '10px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`CODEC: ${cam.codec} | DECODER: ${cam.gpuSlot} | SUB-STREAM AI: ${cam.fpsAiTarget} FPS`, 20, h - 18);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(w - 30, h - 22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('REC', w - 60, h - 19);

  ctx.restore();
}
