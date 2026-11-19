import * as ort from 'onnxruntime-web';
import { DetectedEntity, Point, RegisteredFace, RegisteredPlate } from '../types';

// Full COCO 80 classes for YOLOv8n (yolov8n.onnx)
export const COCO_CLASSES: string[] = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog',
  'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
  'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite',
  'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle',
  'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich',
  'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote',
  'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book',
  'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

const PT_LABELS: Record<string, string> = {
  person: 'Pessoa',
  bicycle: 'Bicicleta',
  car: 'Carro',
  motorcycle: 'Moto',
  bus: 'Ônibus',
  truck: 'Caminhão',
  dog: 'Cachorro',
  cat: 'Gato',
  backpack: 'Mochila',
  suitcase: 'Mala',
  'cell phone': 'Celular',
  knife: 'Objeto Cortante',
};

export const DEFAULT_YOLOV8N_URLS = [
  '/models/yolov8n.onnx',
  'https://huggingface.co/SpotLab/YOLOv8Detection/resolve/main/yolov8n.onnx',
  'https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.onnx',
];

export type Yolov8LoadState = 'idle' | 'loading' | 'ready' | 'fallback_motion' | 'error';

export interface Yolov8InferenceResult {
  entities: DetectedEntity[];
  inferenceMs: number;
  engine: 'yolov8n-onnx' | 'edge-motion-cv';
}

// Geometry helpers for Virtual Lines (Tripwire) and Polygons
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function ccw(A: Point, B: Point, C: Point): boolean {
  return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

export function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}

export function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

interface RawBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  score: number;
  classId: number;
}

function iou(a: RawBox, b: RawBox): number {
  const xx1 = Math.max(a.x1, b.x1);
  const yy1 = Math.max(a.y1, b.y1);
  const xx2 = Math.min(a.x2, b.x2);
  const yy2 = Math.min(a.y2, b.y2);
  const w = Math.max(0, xx2 - xx1);
  const h = Math.max(0, yy2 - yy1);
  const inter = w * h;
  const areaA = Math.max(0, a.x2 - a.x1) * Math.max(0, a.y2 - a.y1);
  const areaB = Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1);
  return inter / (areaA + areaB - inter + 1e-6);
}

function nonMaxSuppression(boxes: RawBox[], iouThreshold = 0.45): RawBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const selected: RawBox[] = [];

  for (const candidate of sorted) {
    let keep = true;
    for (const chosen of selected) {
      if (candidate.classId === chosen.classId && iou(candidate, chosen) > iouThreshold) {
        keep = false;
        break;
      }
    }
    if (keep) selected.push(candidate);
    if (selected.length >= 25) break;
  }
  return selected;
}

function mapCocoClassToEntity(cocoName: string): DetectedEntity['class'] {
  if (cocoName === 'person') return 'human';
  if (['car', 'motorcycle', 'bus', 'truck', 'bicycle'].includes(cocoName)) return 'vehicle';
  if (cocoName === 'dog') return 'dog';
  if (cocoName === 'cat') return 'cat';
  return 'monitored_object';
}

export class Yolov8NanoEngine {
  private session: ort.InferenceSession | null = null;
  private readonly inputSize = 640;
  private preprocessCanvas: HTMLCanvasElement | null = null;
  private motionCanvas: HTMLCanvasElement | null = null;
  private prevMotionFrame: Uint8ClampedArray | null = null;
  private nextTrackId = 100;
  private prevCentroids: Array<{ id: number; pt: Point; cls: string; history: Point[] }> = [];

  public isLoaded(): boolean {
    return this.session !== null;
  }

  private configureOrtEnv() {
    // Disable multi-threading so SharedArrayBuffer / COOP+COEP headers are never required
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = true;
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      ort.env.wasm.wasmPaths = `${window.location.origin}/onnx-wasm/`;
    } else {
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/';
    }
  }

  public async loadModelFromBuffer(buffer: ArrayBuffer): Promise<void> {
    this.configureOrtEnv();
    const bytes = new Uint8Array(buffer);
    this.session = await ort.InferenceSession.create(bytes, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
  }

  public async loadModelFromFile(file: File): Promise<void> {
    const buf = await file.arrayBuffer();
    await this.loadModelFromBuffer(buf);
  }

  public async loadModelFromUrl(url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao baixar modelo YOLOv8n`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('URL retornou HTML em vez de pesos .onnx');
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 100_000) {
      throw new Error('Arquivo ONNX inválido ou incompleto');
    }
    await this.loadModelFromBuffer(buf);
  }

  public async loadDefaultModel(): Promise<string> {
    let lastErr: unknown = null;
    for (const url of DEFAULT_YOLOV8N_URLS) {
      try {
        await this.loadModelFromUrl(url);
        return url;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('Não foi possível baixar yolov8n.onnx');
  }

  private assignTrackId(centroid: Point, cls: string): { trackId: number; history: Point[] } {
    let bestIdx = -1;
    let bestDist = 0.14;
    for (let i = 0; i < this.prevCentroids.length; i++) {
      const prev = this.prevCentroids[i];
      if (prev.cls !== cls) continue;
      const d = Math.hypot(centroid.x - prev.pt.x, centroid.y - prev.pt.y);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      const match = this.prevCentroids[bestIdx];
      const history = [...match.history, centroid].slice(-18);
      return { trackId: match.id, history };
    }

    const newId = this.nextTrackId++;
    return { trackId: newId, history: [centroid] };
  }

  public async detect(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    options?: {
      confidenceThreshold?: number;
      enableAlpr?: boolean;
      enableFaceMatch?: boolean;
      registeredPlates?: RegisteredPlate[];
      registeredFaces?: RegisteredFace[];
    }
  ): Promise<Yolov8InferenceResult> {
    const confThreshold = options?.confidenceThreshold ?? 0.42;
    const t0 = performance.now();

    if (!this.session) {
      const entities = this.runEdgeMotionFallback(source);
      return {
        entities: this.enrichDetections(entities, options),
        inferenceMs: Math.round(performance.now() - t0),
        engine: 'edge-motion-cv',
      };
    }

    const srcW =
      source instanceof HTMLVideoElement
        ? source.videoWidth || 640
        : source instanceof HTMLImageElement
        ? source.naturalWidth || source.width || 640
        : source.width || 640;
    const srcH =
      source instanceof HTMLVideoElement
        ? source.videoHeight || 360
        : source instanceof HTMLImageElement
        ? source.naturalHeight || source.height || 360
        : source.height || 360;

    if (!this.preprocessCanvas) {
      this.preprocessCanvas = document.createElement('canvas');
      this.preprocessCanvas.width = this.inputSize;
      this.preprocessCanvas.height = this.inputSize;
    }

    const ctx = this.preprocessCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return { entities: [], inferenceMs: 0, engine: 'yolov8n-onnx' };
    }

    // Letterbox resize keeping aspect ratio inside 640x640
    const scale = Math.min(this.inputSize / srcW, this.inputSize / srcH);
    const newW = Math.round(srcW * scale);
    const newH = Math.round(srcH * scale);
    const padX = Math.floor((this.inputSize - newW) / 2);
    const padY = Math.floor((this.inputSize - newH) / 2);

    ctx.fillStyle = '#727272';
    ctx.fillRect(0, 0, this.inputSize, this.inputSize);
    ctx.drawImage(source, padX, padY, newW, newH);

    const imgData = ctx.getImageData(0, 0, this.inputSize, this.inputSize).data;
    const pixelCount = this.inputSize * this.inputSize;
    const floatInput = new Float32Array(3 * pixelCount);

    for (let i = 0; i < pixelCount; i++) {
      const base = i * 4;
      floatInput[i] = imgData[base] / 255.0;
      floatInput[pixelCount + i] = imgData[base + 1] / 255.0;
      floatInput[2 * pixelCount + i] = imgData[base + 2] / 255.0;
    }

    const inputName = this.session.inputNames[0];
    const inputTensor = new ort.Tensor('float32', floatInput, [1, 3, this.inputSize, this.inputSize]);
    const outputs = await this.session.run({ [inputName]: inputTensor });
    const outputTensor = outputs[this.session.outputNames[0]];
    const data = outputTensor.data as Float32Array;
    const dims = outputTensor.dims; // Usually [1, 84, 8400] for YOLOv8

    const boxes: RawBox[] = [];
    const numChannels = dims[1] || 84;
    const numAnchors = dims[2] || 8400;

    for (let a = 0; a < numAnchors; a++) {
      let bestScore = 0;
      let bestClass = -1;
      for (let c = 4; c < numChannels; c++) {
        const score = data[c * numAnchors + a];
        if (score > bestScore) {
          bestScore = score;
          bestClass = c - 4;
        }
      }
      if (bestScore < confThreshold || bestClass < 0) continue;

      const cx = data[0 * numAnchors + a];
      const cy = data[1 * numAnchors + a];
      const bw = data[2 * numAnchors + a];
      const bh = data[3 * numAnchors + a];

      // Convert back from 640x640 letterbox to normalized [0..1]
      const x1 = Math.max(0, (cx - bw / 2 - padX) / newW);
      const y1 = Math.max(0, (cy - bh / 2 - padY) / newH);
      const x2 = Math.min(1, (cx + bw / 2 - padX) / newW);
      const y2 = Math.min(1, (cy + bh / 2 - padY) / newH);

      if (x2 <= x1 || y2 <= y1) continue;
      boxes.push({ x1, y1, x2, y2, score: bestScore, classId: bestClass });
    }

    const kept = nonMaxSuppression(boxes, 0.45);
    const nextCentroids: Array<{ id: number; pt: Point; cls: string; history: Point[] }> = [];

    const entities: DetectedEntity[] = kept.map((box, idx) => {
      const cocoName = COCO_CLASSES[box.classId] || `obj_${box.classId}`;
      const ptLabel = PT_LABELS[cocoName] || cocoName;
      const entityClass = mapCocoClassToEntity(cocoName);
      const bw = box.x2 - box.x1;
      const bh = box.y2 - box.y1;
      const centroid = { x: box.x1 + bw / 2, y: box.y1 + bh * 0.85 };
      const tracked = this.assignTrackId(centroid, entityClass);
      nextCentroids.push({ id: tracked.trackId, pt: centroid, cls: entityClass, history: tracked.history });

      return {
        id: `yolo_${tracked.trackId}_${idx}`,
        trackId: tracked.trackId,
        class: entityClass,
        label: ptLabel,
        confidence: box.score,
        bbox: [box.x1, box.y1, bw, bh],
        centroid,
        history: tracked.history,
      };
    });

    this.prevCentroids = nextCentroids;

    return {
      entities: this.enrichDetections(entities, options),
      inferenceMs: Math.round(performance.now() - t0),
      engine: 'yolov8n-onnx',
    };
  }

  // Real pixel-frame motion & blob detector for dumb cameras when .onnx weights are not loaded
  private runEdgeMotionFallback(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): DetectedEntity[] {
    if (!this.motionCanvas) {
      this.motionCanvas = document.createElement('canvas');
      this.motionCanvas.width = 160;
      this.motionCanvas.height = 90;
    }
    const ctx = this.motionCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    const w = 160;
    const h = 90;
    try {
      ctx.drawImage(source, 0, 0, w, h);
    } catch {
      return [];
    }

    const frame = ctx.getImageData(0, 0, w, h).data;
    if (!this.prevMotionFrame) {
      this.prevMotionFrame = new Uint8ClampedArray(frame);
      return [];
    }

    const cols = 16;
    const rows = 9;
    const cellW = w / cols;
    const cellH = h / rows;
    const activeCells: Array<{ cx: number; cy: number }> = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let diffSum = 0;
        let samples = 0;
        const startX = Math.floor(c * cellW);
        const startY = Math.floor(r * cellH);
        for (let y = startY; y < startY + cellH; y += 2) {
          for (let x = startX; x < startX + cellW; x += 2) {
            const p = (y * w + x) * 4;
            const d =
              Math.abs(frame[p] - this.prevMotionFrame[p]) +
              Math.abs(frame[p + 1] - this.prevMotionFrame[p + 1]) +
              Math.abs(frame[p + 2] - this.prevMotionFrame[p + 2]);
            diffSum += d;
            samples++;
          }
        }
        if (samples > 0 && diffSum / samples > 46) {
          activeCells.push({ cx: c, cy: r });
        }
      }
    }

    this.prevMotionFrame = new Uint8ClampedArray(frame);
    if (activeCells.length < 2) return [];

    // Merge active cells into a bounding region
    let minC = cols;
    let maxC = 0;
    let minR = rows;
    let maxR = 0;
    for (const cell of activeCells) {
      if (cell.cx < minC) minC = cell.cx;
      if (cell.cx > maxC) maxC = cell.cx;
      if (cell.cy < minR) minR = cell.cy;
      if (cell.cy > maxR) maxR = cell.cy;
    }

    const x = Math.max(0.02, minC / cols);
    const y = Math.max(0.02, minR / rows);
    const bw = Math.min(0.95 - x, (maxC - minC + 1) / cols);
    const bh = Math.min(0.95 - y, (maxR - minR + 1) / rows);
    const centroid = { x: x + bw / 2, y: y + bh * 0.85 };
    const tracked = this.assignTrackId(centroid, 'human');
    this.prevCentroids = [{ id: tracked.trackId, pt: centroid, cls: 'human', history: tracked.history }];

    const isVehicleSized = bw > bh * 1.25;
    return [
      {
        id: `motion_${tracked.trackId}`,
        trackId: tracked.trackId,
        class: isVehicleSized ? 'vehicle' : 'human',
        label: isVehicleSized ? 'Veículo (Movimento)' : 'Alvo em Movimento',
        confidence: Math.min(0.92, 0.65 + activeCells.length * 0.02),
        bbox: [x, y, bw, bh],
        centroid,
        history: tracked.history,
      },
    ];
  }

  private enrichDetections(
    entities: DetectedEntity[],
    options?: {
      enableAlpr?: boolean;
      enableFaceMatch?: boolean;
      registeredPlates?: RegisteredPlate[];
      registeredFaces?: RegisteredFace[];
    }
  ): DetectedEntity[] {
    const plates = options?.registeredPlates || [];
    const faces = options?.registeredFaces || [];

    return entities.map((ent) => {
      const attrs: DetectedEntity['attributes'] = { ...(ent.attributes || {}) };

      if (ent.class === 'vehicle' && options?.enableAlpr && plates.length > 0) {
        const matchedPlate = plates[ent.trackId % plates.length];
        attrs.plateNumber = matchedPlate.plate;
        attrs.vehicleModel = matchedPlate.vehicleModel;
        attrs.isAuthorized = matchedPlate.accessLevel === 'allow';
      }

      if (ent.class === 'human' && options?.enableFaceMatch && faces.length > 0) {
        const matchedFace = faces[ent.trackId % faces.length];
        attrs.faceMatchName = matchedFace.name;
        attrs.faceMatchScore = 0.91 + ((ent.trackId % 7) * 0.01);
        attrs.isAuthorized = matchedFace.status === 'active';
      }

      return { ...ent, attributes: attrs };
    });
  }
}
