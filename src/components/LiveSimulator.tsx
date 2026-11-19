import React, { useState, useEffect, useRef } from 'react';
import {
  CameraDevice,
  DetectedEntity,
  Point,
  ZoneVirtual,
  CameraFeedId,
  SystemEventAlert,
  AutomationRule,
  RegisteredFace,
  RegisteredPlate,
} from '../types';
import {
  Yolov8NanoEngine,
  Yolov8LoadState,
  isPointInPolygon,
  segmentsIntersect,
  distToSegment,
} from '../utils/yolov8Engine';
import { apiUrl } from '../utils/networkBridge';
import {
  Play,
  Pause,
  ShieldCheck,
  Car,
  User,
  Crosshair,
  Sparkles,
  PackageCheck,
  PackageX,
  Plus,
  Video,
  Camera,
  Cpu,
  Upload,
  Save,
  Trash2,
  ScanFace,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';

interface LiveSimulatorProps {
  cameras: CameraDevice[];
  selectedCameraId: CameraFeedId;
  onSelectCamera: (id: CameraFeedId) => void;
  onTriggerEvent: (alert: Omit<SystemEventAlert, 'id' | 'timestamp' | 'ack'>) => void;
  rules: AutomationRule[];
  onOpenAddCameraModal: () => void;
  registeredFaces?: RegisteredFace[];
  registeredPlates?: RegisteredPlate[];
  onSaveCameraZones?: (cameraId: CameraFeedId, zones: ZoneVirtual[]) => void;
}

type FeedSourceMode = 'simulation' | 'webcam' | 'rtsp_dumb' | 'upload_media';

export const LiveSimulator: React.FC<LiveSimulatorProps> = ({
  cameras,
  selectedCameraId,
  onSelectCamera,
  onTriggerEvent,
  onOpenAddCameraModal,
  registeredFaces = [],
  registeredPlates = [],
  onSaveCameraZones,
}) => {
  const currentCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rtspImgRef = useRef<HTMLImageElement | null>(null);
  const uploadedImgRef = useRef<HTMLImageElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const yoloEngineRef = useRef<Yolov8NanoEngine>(new Yolov8NanoEngine());
  const onnxFileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);

  // Video source mode
  const [sourceMode, setSourceMode] = useState<FeedSourceMode>('simulation');
  const [webcamStatus, setWebcamStatus] = useState<string>('');
  const [rtspInputUrl, setRtspInputUrl] = useState<string>(currentCamera?.rtspSubStream || currentCamera?.rtspMainStream || '');
  const [rtspActiveUrl, setRtspActiveUrl] = useState<string>('');
  const [uploadedMediaType, setUploadedMediaType] = useState<'video' | 'image' | null>(null);

  // YOLOv8 Nano Engine State
  const [yoloState, setYoloState] = useState<Yolov8LoadState>('fallback_motion');
  const [yoloStatusMsg, setYoloStatusMsg] = useState<string>('Modo Borda (Detecção de Movimento Ativa • Baixe ou carregue yolov8n.onnx para Rede Neural 80 classes)');
  const [inferenceMs, setInferenceMs] = useState<number>(0);
  const [activeEngineLabel, setActiveEngineLabel] = useState<string>('Edge Motion + Tripwire');
  const [enableAlpr, setEnableAlpr] = useState<boolean>(true);
  const [enableFaceMatch, setEnableFaceMatch] = useState<boolean>(true);
  const [confThreshold, setConfThreshold] = useState<number>(0.42);

  // Drawing state
  const [drawingMode, setDrawingMode] = useState<'none' | 'polygon' | 'tripwire' | 'missing_object'>('none');
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [localZones, setLocalZones] = useState<ZoneVirtual[]>(currentCamera?.zones || []);
  const [zonesSavedNotice, setZonesSavedNotice] = useState<boolean>(false);

  // Entities stored in a ref for butter-smooth 60 FPS animation without React re-renders
  const entitiesRef = useRef<DetectedEntity[]>([]);
  const lastEntityCentroidsRef = useRef<Map<number, Point>>(new Map());
  const lastAlertTimestampRef = useRef<Map<string, number>>(new Map());
  const [, setForceRenderCounter] = useState(0);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Object Abandonment / Missing state for warehouse
  const [monitoredObjectPresent, setMonitoredObjectPresent] = useState<boolean>(true);
  const [missingObjectElapsed, setMissingObjectElapsed] = useState<number>(0);
  const [missingAlarmTriggered, setMissingAlarmTriggered] = useState<boolean>(false);

  // Sync zones and RTSP URL when camera changes
  useEffect(() => {
    setLocalZones(currentCamera?.zones || []);
    setRtspInputUrl(currentCamera?.rtspSubStream || currentCamera?.rtspMainStream || '');
    setDraftPoints([]);
    setDrawingMode('none');
    entitiesRef.current = [];
    lastEntityCentroidsRef.current.clear();
    setForceRenderCounter((c) => c + 1);
  }, [selectedCameraId, currentCamera?.id]);

  // Stop active webcam stream helper
  const stopWebcamStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopWebcamStream();
    };
  }, []);

  // Activate device Webcam or Mobile Camera
  const handleActivateWebcam = async (facingMode: 'environment' | 'user' = 'environment') => {
    stopWebcamStream();
    setSourceMode('webcam');
    setWebcamStatus('Solicitando acesso à câmera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setWebcamStatus('Câmera ao vivo ativa! Desenhe linhas virtuais ou carregue YOLOv8n.');
    } catch (err: any) {
      setWebcamStatus(`Erro ao abrir câmera: ${err?.message || 'Permissão negada'}`);
    }
  };

  // Connect Dumb IP Camera / NVR RTSP Stream
  const handleConnectRtspDumbCamera = () => {
    stopWebcamStream();
    setSourceMode('rtsp_dumb');
    const url = rtspInputUrl.trim() || currentCamera?.rtspSubStream || currentCamera?.rtspMainStream || '';
    if (!url) return;
    setRtspActiveUrl(apiUrl(`/api/cameras/stream?url=${encodeURIComponent(url)}`));
  };

  // Upload test video or image file
  const handleUploadTestMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopWebcamStream();
    const objUrl = URL.createObjectURL(file);

    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        uploadedImgRef.current = img;
        setUploadedMediaType('image');
        setSourceMode('upload_media');
      };
      img.src = objUrl;
    } else {
      if (videoRef.current) {
        videoRef.current.src = objUrl;
        videoRef.current.loop = true;
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }
      setUploadedMediaType('video');
      setSourceMode('upload_media');
    }
  };

  // Load YOLOv8 Nano ONNX Model from Web or Local File
  const handleLoadYolov8Online = async () => {
    setYoloState('loading');
    setYoloStatusMsg('Carregando rede neural YOLOv8 Nano (yolov8n.onnx ~12MB)...');
    try {
      const loadedFrom = await yoloEngineRef.current.loadDefaultModel();
      setYoloState('ready');
      setActiveEngineLabel('YOLOv8n ONNX (80 classes)');
      setYoloStatusMsg(`YOLOv8 Nano ativo! Modelo carregado de: ${loadedFrom.slice(0, 48)}...`);
    } catch (err: any) {
      setYoloState('fallback_motion');
      setYoloStatusMsg(
        `Não foi possível baixar da internet (${err?.message || 'offline'}). Carregue o arquivo yolov8n.onnx local ou use o Detector de Movimento ativo.`
      );
    }
  };

  const handleLoadYolov8File = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setYoloState('loading');
    setYoloStatusMsg(`Compilando ${file.name} no runtime ONNX Web...`);
    try {
      await yoloEngineRef.current.loadModelFromFile(file);
      setYoloState('ready');
      setActiveEngineLabel(`YOLOv8n (${file.name})`);
      setYoloStatusMsg(`YOLOv8 Nano pronto com pesos locais (${file.name})!`);
    } catch (err: any) {
      setYoloState('error');
      setYoloStatusMsg(`Erro ao ler ONNX: ${err?.message || 'Arquivo inválido'}`);
    }
  };

  // Handle Missing Object Countdown (e.g. 5 seconds)
  useEffect(() => {
    let timer: any;
    if (selectedCameraId === 'cam_almoxarifado') {
      if (!monitoredObjectPresent) {
        timer = setInterval(() => {
          setMissingObjectElapsed((prev) => {
            const next = prev + 0.2;
            if (next >= 5 && !missingAlarmTriggered) {
              setMissingAlarmTriggered(true);
              onTriggerEvent({
                cameraId: 'cam_almoxarifado',
                cameraName: currentCamera.name,
                severity: 'critical',
                title: 'OBJETO CRÍTICO AUSENTE DA ROI!',
                description: 'Item monitorado ausente por mais de 5.0 segundos.',
                metadata: {
                  zone_id: 'zone_objeto_cofre',
                  missing_duration_sec: 5.0,
                  protocol: 'MQTT_BROKER_EMERGENCY',
                },
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

  // Real-time YOLOv8 Nano Inference Loop for Real Video Sources (Webcam, RTSP, Uploaded Video/Image)
  useEffect(() => {
    if (sourceMode === 'simulation' || !isPlaying) return;

    let cancelled = false;
    let running = false;

    const runStep = async () => {
      if (cancelled || running) return;
      let sourceEl: HTMLVideoElement | HTMLImageElement | null = null;

      if (sourceMode === 'webcam' || (sourceMode === 'upload_media' && uploadedMediaType === 'video')) {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          sourceEl = videoRef.current;
        }
      } else if (sourceMode === 'rtsp_dumb') {
        if (rtspImgRef.current && rtspImgRef.current.complete && rtspImgRef.current.naturalWidth > 0) {
          sourceEl = rtspImgRef.current;
        }
      } else if (sourceMode === 'upload_media' && uploadedMediaType === 'image') {
        if (uploadedImgRef.current && uploadedImgRef.current.complete) {
          sourceEl = uploadedImgRef.current;
        }
      }

      if (!sourceEl) return;

      running = true;
      try {
        const result = await yoloEngineRef.current.detect(sourceEl, {
          confidenceThreshold: confThreshold,
          enableAlpr,
          enableFaceMatch,
          registeredPlates,
          registeredFaces,
        });
        if (!cancelled) {
          setInferenceMs(result.inferenceMs);
          setActiveEngineLabel(result.engine === 'yolov8n-onnx' ? 'YOLOv8n ONNX' : 'Edge Motion CV');
          entitiesRef.current = result.entities;

          // Evaluate Virtual Lines (Tripwire) and Polygon Zones on real detections!
          const updatedZones = [...localZones];
          let zoneTriggered = false;

          for (const ent of result.entities) {
            const prevPt = lastEntityCentroidsRef.current.get(ent.trackId);
            const currPt = ent.centroid;
            lastEntityCentroidsRef.current.set(ent.trackId, currPt);

            for (let zIdx = 0; zIdx < updatedZones.length; zIdx++) {
              const zone = updatedZones[zIdx];
              if (!zone.active) continue;

              let hit = false;
              if (zone.type === 'polygon' && zone.points.length >= 3) {
                hit = isPointInPolygon(currPt, zone.points);
              } else if (zone.type === 'tripwire' && zone.points.length === 2) {
                if (prevPt && segmentsIntersect(prevPt, currPt, zone.points[0], zone.points[1])) {
                  hit = true;
                } else if (distToSegment(currPt, zone.points[0], zone.points[1]) < 0.03) {
                  hit = true;
                }
              }

              if (hit) {
                ent.isViolating = true;
                const alertKey = `${zone.id}_${ent.trackId}`;
                const now = Date.now();
                const lastSent = lastAlertTimestampRef.current.get(alertKey) || 0;

                if (now - lastSent > 4500) {
                  lastAlertTimestampRef.current.set(alertKey, now);
                  updatedZones[zIdx] = { ...zone, triggerCount: (zone.triggerCount || 0) + 1 };
                  zoneTriggered = true;

                  const bioInfo = ent.attributes?.plateNumber
                    ? `Placa ${ent.attributes.plateNumber}`
                    : ent.attributes?.faceMatchName
                    ? `Rosto ${ent.attributes.faceMatchName}`
                    : ent.label;

                  onTriggerEvent({
                    cameraId: currentCamera.id,
                    cameraName: currentCamera.name,
                    severity: ent.attributes?.isAuthorized === false ? 'critical' : 'warning',
                    title: `${result.engine === 'yolov8n-onnx' ? 'YOLOv8n' : 'Linha Virtual'}: ${zone.name}`,
                    description: `${bioInfo} (${(ent.confidence * 100).toFixed(0)}%) cruzou ${zone.name} na câmera ${currentCamera.name}.`,
                    metadata: {
                      engine: result.engine,
                      track_id: ent.trackId,
                      class: ent.class,
                      plate: ent.attributes?.plateNumber,
                      face: ent.attributes?.faceMatchName,
                    },
                  });
                }
              }
            }
          }

          if (zoneTriggered) {
            setLocalZones(updatedZones);
          }
        }
      } catch {
        // Skip single frame errors gracefully (e.g. tainted canvas from external image)
      } finally {
        running = false;
      }
    };

    const intervalMs = yoloState === 'ready' ? 160 : 120;
    const timer = setInterval(runStep, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    sourceMode,
    uploadedMediaType,
    isPlaying,
    confThreshold,
    enableAlpr,
    enableFaceMatch,
    registeredPlates,
    registeredFaces,
    localZones,
    yoloState,
    currentCamera,
    onTriggerEvent,
  ]);

  // Main canvas render loop (60 FPS smooth overlays + video frame drawing)
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

      // 1. Draw Video Feed Background (Real Webcam / RTSP / Upload / Simulation)
      if (sourceMode === 'webcam' || (sourceMode === 'upload_media' && uploadedMediaType === 'video')) {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          ctx.drawImage(videoRef.current, 0, 0, w, h);
        } else {
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(webcamStatus || 'Aguardando vídeo da câmera...', w / 2, h / 2);
          ctx.textAlign = 'left';
        }
      } else if (sourceMode === 'rtsp_dumb') {
        if (rtspImgRef.current && rtspImgRef.current.complete && rtspImgRef.current.naturalWidth > 0) {
          ctx.drawImage(rtspImgRef.current, 0, 0, w, h);
        } else {
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`Conectando stream RTSP da câmera "burra": ${rtspInputUrl || currentCamera.ip}`, w / 2, h / 2 - 10);
          ctx.font = '11px monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('Nota: Requer ffmpeg no servidor PC local (porta 3000) ou use Câmera/Upload para testar IA agora.', w / 2, h / 2 + 16);
          ctx.textAlign = 'left';
        }
      } else if (sourceMode === 'upload_media' && uploadedMediaType === 'image' && uploadedImgRef.current) {
        ctx.drawImage(uploadedImgRef.current, 0, 0, w, h);
      } else {
        drawCameraEnvironment(ctx, selectedCameraId, w, h);
      }

      // 2. Draw Configured Zones (Virtual Lines & Fences)
      localZones.forEach((zone) => {
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
            ctx.lineWidth = 3.5;
            ctx.setLineDash([8, 6]);
            ctx.stroke();

            const midX = ((p1.x + p2.x) / 2) * w;
            const midY = ((p1.y + p2.y) / 2) * h;
            ctx.fillStyle = zone.color || '#10b981';
            ctx.beginPath();
            ctx.arc(midX, midY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#090d16';
            const lbl = `⚡ ${zone.name} [${zone.triggerCount}x]`;
            const lblW = ctx.measureText(lbl).width + 10;
            ctx.fillRect(midX - lblW / 2, midY - 26, lblW, 18);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(lbl, midX - lblW / 2 + 5, midY - 13);
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

          const centerX = (((zone.points[0]?.x || 0.4) + (zone.points[2]?.x || 0.6)) / 2) * w;
          const centerY = (((zone.points[0]?.y || 0.4) + (zone.points[2]?.y || 0.6)) / 2) * h;

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
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        draftPoints.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x * w, pt.y * h);
          else ctx.lineTo(pt.x * w, pt.y * h);
        });
        ctx.stroke();

        draftPoints.forEach((pt) => {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(pt.x * w, pt.y * h, 5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // 4. In simulation mode, animate injected entities directly
      const currentEntities = entitiesRef.current;
      if (sourceMode === 'simulation' && isPlaying && currentEntities.length > 0) {
        for (let i = 0; i < currentEntities.length; i++) {
          const entity = currentEntities[i];
          const [x, y, bw, bh] = entity.bbox;
          const prevCentroid = { ...entity.centroid };
          let nextY = y + 0.003;
          const nextX = x + 0.001;

          if (nextY > 0.85) nextY = 0.2;

          entity.bbox = [nextX, nextY, bw, bh];
          const newCentroid = { x: nextX + bw / 2, y: nextY + bh };
          entity.centroid = newCentroid;
          entity.history.push(newCentroid);
          if (entity.history.length > 15) entity.history.shift();

          let isViolating = false;
          let crossedZoneName = '';

          for (const zone of localZones) {
            if (!zone.active) continue;
            if (zone.type === 'polygon' && zone.points.length >= 3) {
              if (isPointInPolygon(newCentroid, zone.points)) {
                isViolating = true;
                crossedZoneName = zone.name;
                break;
              }
            } else if (zone.type === 'tripwire' && zone.points.length === 2) {
              if (
                segmentsIntersect(prevCentroid, newCentroid, zone.points[0], zone.points[1]) ||
                distToSegment(newCentroid, zone.points[0], zone.points[1]) < 0.035
              ) {
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
              },
            });
          } else if (!isViolating) {
            entity.isViolating = false;
          }
        }
      }

      // 5. Render detected bounding boxes (both YOLOv8n and simulation)
      currentEntities.forEach((entity) => {
        const [x, y, bw, bh] = entity.bbox;
        const absX = x * w;
        const absY = y * h;
        const absW = bw * w;
        const absH = bh * h;

        ctx.save();
        const boxColor = entity.isViolating
          ? '#ef4444'
          : entity.attributes?.isAuthorized === false
          ? '#f43f5e'
          : '#10b981';

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
        ctx.fillRect(absX, Math.max(0, absY - 22), tagWidth, 22);
        ctx.fillStyle = '#090d16';
        ctx.fillText(tagText, absX + 6, Math.max(15, absY - 6));

        let attrText = '';
        if (entity.attributes?.plateNumber) {
          attrText = `🚗 ALPR: ${entity.attributes.plateNumber} (${entity.attributes.vehicleModel || 'Veículo'})`;
        } else if (entity.attributes?.faceMatchName) {
          attrText = `👤 FACIAL: ${entity.attributes.faceMatchName} (${((entity.attributes.faceMatchScore || 0.94) * 100).toFixed(0)}%)`;
        } else if (entity.attributes?.clothingTop) {
          attrText = `👕 ${entity.attributes.clothingTop} | 👖 ${entity.attributes.clothingBottom}`;
        }

        if (attrText) {
          ctx.font = '10px monospace';
          const attrWidth = ctx.measureText(attrText).width + 12;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.fillRect(absX, absY + absH + 4, attrWidth, 18);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(attrText, absX + 6, absY + absH + 16);
        }

        ctx.restore();
      });

      // 6. OSD Header
      drawOSD(ctx, currentCamera, w, h, activeEngineLabel, inferenceMs);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    selectedCameraId,
    currentCamera,
    localZones,
    draftPoints,
    isPlaying,
    monitoredObjectPresent,
    missingObjectElapsed,
    missingAlarmTriggered,
    sourceMode,
    uploadedMediaType,
    webcamStatus,
    rtspInputUrl,
    activeEngineLabel,
    inferenceMs,
    onTriggerEvent,
  ]);

  // Persist zones helper
  const persistZones = (nextZones: ZoneVirtual[]) => {
    setLocalZones(nextZones);
    if (onSaveCameraZones && currentCamera) {
      onSaveCameraZones(currentCamera.id, nextZones);
      setZonesSavedNotice(true);
      setTimeout(() => setZonesSavedNotice(false), 3000);
    }
  };

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
        triggerCount: 0,
      };
      persistZones([...localZones, newZone]);
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
        triggerCount: 0,
      };
      persistZones([...localZones, newZone]);
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
      triggerCount: 0,
    };
    persistZones([...localZones, newZone]);
    setDraftPoints([]);
    setDrawingMode('none');
  };

  const handleDeleteZone = (zoneId: string) => {
    persistZones(localZones.filter((z) => z.id !== zoneId));
  };

  // Helper spawners for quick simulation testing
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
        isAuthorized: false,
      },
    };
    entitiesRef.current.push(newEntity);
    setForceRenderCounter((c) => c + 1);
  };

  const spawnVehicleWithPlate = () => {
    const samplePlate = registeredPlates[0];
    const plateCode = samplePlate?.plate || 'BRA2E19';
    const owner = samplePlate?.ownerName || 'Carlos Eduardo';
    const model = samplePlate?.vehicleModel || 'Corolla Cross Cinza';

    const newEntity: DetectedEntity = {
      id: `ent_car_${Date.now()}`,
      trackId: Math.floor(Math.random() * 900) + 100,
      class: 'vehicle',
      label: `Veículo (${model.split(' ')[0]})`,
      confidence: 0.98,
      bbox: [0.35, 0.2, 0.28, 0.35],
      centroid: { x: 0.49, y: 0.55 },
      history: [],
      attributes: {
        plateNumber: plateCode,
        vehicleModel: model,
        isAuthorized: samplePlate ? samplePlate.accessLevel === 'allow' : true,
      },
    };
    entitiesRef.current.push(newEntity);
    setForceRenderCounter((c) => c + 1);

    onTriggerEvent({
      cameraId: selectedCameraId,
      cameraName: currentCamera.name,
      severity: 'info',
      title: `Placa Reconhecida: ${plateCode}`,
      description: `Veículo de ${owner} identificado via ALPR. Acionando relé Sonoff do portão via LAN.`,
      metadata: {
        plate: plateCode,
        action: 'SONOFF_PULSE_LAN_RELAY',
        latency_ms: 120,
      },
    });
  };

  const spawnResidentFace = () => {
    const sampleFace = registeredFaces[0];
    const name = sampleFace?.name || 'Carlos Eduardo (Morador)';

    const newEntity: DetectedEntity = {
      id: `ent_face_${Date.now()}`,
      trackId: Math.floor(Math.random() * 900) + 100,
      class: 'human',
      label: 'Pessoa',
      confidence: 0.96,
      bbox: [0.4, 0.3, 0.14, 0.32],
      centroid: { x: 0.47, y: 0.62 },
      history: [],
      attributes: {
        faceMatchName: name,
        faceMatchScore: 0.978,
        clothingTop: 'Camisa Polo Azul',
        clothingBottom: 'Calça Bege',
        isAuthorized: sampleFace ? sampleFace.status === 'active' : true,
      },
    };
    entitiesRef.current.push(newEntity);
    setForceRenderCounter((c) => c + 1);

    onTriggerEvent({
      cameraId: selectedCameraId,
      cameraName: currentCamera.name,
      severity: 'info',
      title: `Biometria Facial: ${name} (97.8%)`,
      description: 'Rosto reconhecido na lista autorizada. Fechadura de pedestres liberada.',
      metadata: {
        face_id: sampleFace?.id || 'face_01',
        name,
        match_score: 0.978,
        action: 'MAGNET_RELEASE_LAN',
      },
    });
  };

  const clearEntities = () => {
    entitiesRef.current = [];
    setForceRenderCounter((c) => c + 1);
  };

  const resetZonesToDefault = () => {
    setLocalZones(currentCamera.zones || []);
    setDraftPoints([]);
    setDrawingMode('none');
  };

  return (
    <div className="space-y-5">
      {/* Hidden media elements for live canvas capture */}
      <video ref={videoRef} playsInline muted className="hidden" />
      {rtspActiveUrl && (
        <img
          ref={rtspImgRef}
          src={rtspActiveUrl}
          crossOrigin="anonymous"
          alt="RTSP Stream"
          className="hidden"
        />
      )}
      <input
        ref={onnxFileInputRef}
        type="file"
        accept=".onnx"
        onChange={handleLoadYolov8File}
        className="hidden"
      />
      <input
        ref={mediaFileInputRef}
        type="file"
        accept="video/*,image/*"
        onChange={handleUploadTestMedia}
        className="hidden"
      />

      {/* Camera Selection Bar */}
      <div className="bg-slate-900/80 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Câmeras ({cameras.length}):
            </span>
            {cameras.map((cam) => (
              <button
                key={cam.id}
                onClick={() => onSelectCamera(cam.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all shrink-0 cursor-pointer ${
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

            <button
              onClick={onOpenAddCameraModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 shrink-0 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Câmera / NVR</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 shrink-0 whitespace-nowrap">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              {currentCamera.codec} • {currentCamera.fpsStream} FPS
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
              {activeEngineLabel} {inferenceMs > 0 ? `(${inferenceMs}ms)` : ''}
            </span>
          </div>
        </div>

        {/* Feed Source Switcher + YOLOv8 Nano Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 mr-1">Fonte de Vídeo:</span>
            <button
              onClick={() => {
                stopWebcamStream();
                setSourceMode('simulation');
              }}
              className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                sourceMode === 'simulation'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              Simulação CFTV
            </button>

            <button
              onClick={() => handleActivateWebcam('environment')}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'webcam'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                  : 'bg-slate-950 text-emerald-300 border-emerald-500/40 hover:bg-emerald-950/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Câmera Celular / Webcam</span>
            </button>

            <button
              onClick={handleConnectRtspDumbCamera}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'rtsp_dumb'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                  : 'bg-slate-950 text-amber-300 border-amber-500/40 hover:bg-amber-950/50'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Câmera IP &quot;Burra&quot; (RTSP)</span>
            </button>

            <button
              onClick={() => mediaFileInputRef.current?.click()}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'upload_media'
                  ? 'bg-purple-500 text-slate-950 border-purple-400 font-bold'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Testar Vídeo / Foto Real</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadYolov8Online}
              disabled={yoloState === 'loading'}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                yoloState === 'ready'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 border-cyan-400 hover:opacity-95'
              }`}
            >
              <Cpu className={`w-3.5 h-3.5 ${yoloState === 'loading' ? 'animate-spin' : ''}`} />
              <span>
                {yoloState === 'loading'
                  ? 'Carregando YOLOv8n...'
                  : yoloState === 'ready'
                  ? 'YOLOv8 Nano Ativo ✓'
                  : 'Ativar YOLOv8 Nano (ONNX)'}
              </span>
            </button>

            <button
              onClick={() => onnxFileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] cursor-pointer"
              title="Selecionar arquivo yolov8n.onnx salvo no seu computador ou celular"
            >
              Carregar .onnx local
            </button>
          </div>
        </div>

        {/* RTSP URL input when in Dumb Camera Mode */}
        {sourceMode === 'rtsp_dumb' && (
          <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-2 text-xs font-mono">
            <span className="text-amber-300 font-bold shrink-0">URL RTSP da Câmera Burra:</span>
            <input
              type="text"
              value={rtspInputUrl}
              onChange={(e) => setRtspInputUrl(e.target.value)}
              placeholder="rtsp://admin:senha@192.168.1.101:554/cam/realmonitor?channel=1&subtype=1"
              className="flex-1 w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 outline-none focus:border-amber-400"
            />
            <button
              onClick={handleConnectRtspDumbCamera}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shrink-0 cursor-pointer"
            >
              Conectar Stream + IA
            </button>
          </div>
        )}

        {/* YOLOv8 Status Banner */}
        <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            {yoloState === 'ready' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{yoloStatusMsg}</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-cyan-300">
              <input
                type="checkbox"
                checked={enableAlpr}
                onChange={(e) => setEnableAlpr(e.target.checked)}
                className="accent-cyan-400"
              />
              <span>ALPR Placas ({registeredPlates.length})</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-emerald-300">
              <input
                type="checkbox"
                checked={enableFaceMatch}
                onChange={(e) => setEnableFaceMatch(e.target.checked)}
                className="accent-emerald-400"
              />
              <span>Reconh. Facial ({registeredFaces.length})</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Interactive CCTV Canvas */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              onClick={handleCanvasClick}
              className={`w-full aspect-video block bg-slate-950 ${
                drawingMode !== 'none' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />

            {drawingMode !== 'none' && (
              <div className="absolute top-4 left-4 bg-slate-950/95 border border-cyan-500/50 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-3 shadow-lg">
                <Crosshair className="w-4 h-4 animate-spin text-cyan-400" />
                <span>
                  {drawingMode === 'polygon' && `Clique para marcar os cantos (${draftPoints.length} pontos).`}
                  {drawingMode === 'tripwire' && `Clique no ponto INICIAL e FINAL da Linha Virtual (${draftPoints.length}/2).`}
                  {drawingMode === 'missing_object' && `Marque 4 cantos do Objeto Monitorado (${draftPoints.length}/4).`}
                </span>
                {drawingMode === 'polygon' && draftPoints.length >= 3 && (
                  <button
                    onClick={finishPolygon}
                    className="ml-2 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 cursor-pointer"
                  >
                    Concluir Cerca
                  </button>
                )}
                <button
                  onClick={() => {
                    setDrawingMode('none');
                    setDraftPoints([]);
                  }}
                  className="text-slate-400 hover:text-white underline ml-2 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}

            {zonesSavedNotice && (
              <div className="absolute top-4 right-4 bg-emerald-950/95 border border-emerald-500 text-emerald-200 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-lg">
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Linhas Virtuais salvas no Firebase!</span>
              </div>
            )}

            {selectedCameraId === 'cam_almoxarifado' && sourceMode === 'simulation' && (
              <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-700 p-2.5 rounded-xl shadow-xl flex items-center space-x-3 text-xs">
                <span className="text-slate-300 font-medium">Simulação Objeto:</span>
                <button
                  onClick={() => setMonitoredObjectPresent(!monitoredObjectPresent)}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    monitoredObjectPresent
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                  }`}
                >
                  {monitoredObjectPresent ? (
                    <>
                      <PackageX className="w-4 h-4" />
                      <span>Remover Objeto</span>
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

          {/* Drawing Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <span className="text-slate-400 font-medium mr-1">Desenhar na Câmera &quot;Burra&quot;:</span>
              <button
                onClick={() => {
                  setDrawingMode('tripwire');
                  setDraftPoints([]);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  drawingMode === 'tripwire'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                + Linha Virtual (Tripwire)
              </button>
              <button
                onClick={() => {
                  setDrawingMode('polygon');
                  setDraftPoints([]);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  drawingMode === 'polygon'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                + Cerca Virtual (Área)
              </button>
              <button
                onClick={() => {
                  setDrawingMode('missing_object');
                  setDraftPoints([]);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  drawingMode === 'missing_object'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                + Objeto Protegido (ROI)
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                title={isPlaying ? 'Pausar Análise' : 'Continuar Análise'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={resetZonesToDefault}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                Resetar Zonas
              </button>
              <button
                onClick={clearEntities}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                Limpar Caixas
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: YOLOv8n Controls, Zones & Scenario Injectors */}
        <div className="space-y-4">
          {/* YOLOv8 Nano Engine Tuning Card */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-cyan-500/30 space-y-3">
            <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Motor YOLOv8 Nano (Borda)
            </h3>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Confiança Mínima:</span>
                <span className="text-cyan-400 font-bold">{Math.round(confThreshold * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.85}
                step={0.05}
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                <ScanFace className="w-3.5 h-3.5" />
                <span>Câmeras &quot;Burras&quot; com IA:</span>
              </div>
              <p className="leading-relaxed">
                Mesmo câmeras antigas sem analíticos embarcados passam a detectar pessoas, carros, ler placas e disparar linhas virtuais pelo servidor ROG-TECH!
              </p>
            </div>
          </div>

          {/* Quick AI Injections Card */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Testar Regras & Biometria
            </h3>

            <div className="space-y-2">
              <button
                onClick={spawnHumanIntruder}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Invasor (Cruzar Linha)</div>
                    <div className="text-[10px] text-slate-400">Testa Tripwire & Alarme</div>
                  </div>
                </div>
                <span className="text-[10px] text-amber-400 font-mono">Testar &rarr;</span>
              </button>

              <button
                onClick={spawnVehicleWithPlate}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Veículo + Leitura ALPR</div>
                    <div className="text-[10px] text-slate-400">{registeredPlates[0]?.plate || 'BRA2E19'}</div>
                  </div>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">Testar &rarr;</span>
              </button>

              <button
                onClick={spawnResidentFace}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Biometria Facial</div>
                    <div className="text-[10px] text-slate-400">{registeredFaces[0]?.name || 'Morador Autorizado'}</div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Testar &rarr;</span>
              </button>
            </div>
          </div>

          {/* Active Zones on this Camera */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Linhas e Zonas ({localZones.length})</span>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {localZones.map((z) => (
                <div
                  key={z.id}
                  className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-200 truncate">{z.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {z.type.toUpperCase()} • {z.triggerCount} disparos
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteZone(z.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer shrink-0"
                    title="Remover zona"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {localZones.length === 0 && (
                <div className="text-xs text-slate-500 italic text-center py-2">
                  Nenhuma linha virtual ainda. Clique em &quot;+ Linha Virtual&quot; abaixo do vídeo.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Canvas drawing helpers for CCTV visual simulation
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
    ctx.lineTo(w * 0.8, h * 0.95);
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
    ctx.strokeRect(w * 0.7, h * 0.2, w * 0.25, h * 0.7);

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

function drawOSD(
  ctx: CanvasRenderingContext2D,
  cam: CameraDevice,
  w: number,
  h: number,
  engineLabel: string,
  inferenceMs: number
) {
  ctx.save();
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;

  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

  ctx.fillText(`CAM: ${cam.name} [${cam.ip}]`, 20, 30);

  const rightText = `${dateStr} | ${engineLabel}`;
  const rightWidth = ctx.measureText(rightText).width;
  ctx.fillText(rightText, w - rightWidth - 20, 30);

  ctx.font = '10px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(
    `CODEC: ${cam.codec} | MOTOR: ${engineLabel} | LATÊNCIA: ${inferenceMs || 14}ms`,
    20,
    h - 18
  );

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(w - 30, h - 22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('REC', w - 60, h - 19);

  ctx.restore();
}
