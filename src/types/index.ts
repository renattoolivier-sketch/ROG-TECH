export type CameraFeedId = string;

export interface Point {
  x: number;
  y: number;
}

export interface ZoneVirtual {
  id: string;
  cameraId: CameraFeedId;
  name: string;
  type: 'tripwire' | 'polygon' | 'missing_object';
  points: Point[]; // For tripwire (2 points) or polygon (3+ points)
  direction?: 'in' | 'out' | 'both'; // For tripwires
  missingObjectTimeSeconds?: number; // For object removal (e.g. 5 seconds)
  active: boolean;
  color: string;
  triggerCount: number;
}

export interface DetectedEntity {
  id: string;
  trackId: number;
  class: 'human' | 'vehicle' | 'dog' | 'cat' | 'face' | 'plate' | 'monitored_object';
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, w, h] normalized 0-1
  centroid: Point;
  history: Point[];
  attributes?: {
    plateNumber?: string;
    vehicleModel?: string;
    faceMatchName?: string;
    faceMatchScore?: number;
    isAuthorized?: boolean;
    clothingTop?: string;
    clothingBottom?: string;
  };
  inZone?: string;
  isViolating?: boolean;
}

export interface CameraDevice {
  id: CameraFeedId;
  name: string;
  location: string;
  ip: string;
  onvifPort: number;
  rtspMainStream: string;
  rtspSubStream: string;
  fpsStream: number;
  fpsAiTarget: number;
  resolution: string;
  codec: 'H.264' | 'H.265';
  brand: string;
  status: 'online' | 'degraded' | 'offline';
  gpuSlot: string;
  zones: ZoneVirtual[];
  isRealFeed?: boolean;
  feedType?: 'simulation' | 'webcam' | 'rtsp_stream' | 'mjpeg';
  streamDeviceId?: string;
  liveVideoUrl?: string;
}

export interface RegisteredFace {
  id: string;
  name: string;
  role: 'Morador' | 'Funcionário' | 'Visitante Frequente' | 'Lista Negra';
  avatarUrl: string;
  embeddingVectorLength: number;
  registeredAt: string;
  status: 'active' | 'blocked';
  notes: string;
}

export interface RegisteredPlate {
  id: string;
  plate: string;
  format: 'mercosul' | 'antigo';
  ownerName: string;
  vehicleModel: string;
  accessLevel: 'allow' | 'deny' | 'notify_only';
  lastSeen?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerCameraId: CameraFeedId | 'all';
  triggerEventType: 'line_cross' | 'polygon_intrusion' | 'face_authorized' | 'face_unknown' | 'plate_authorized' | 'plate_blacklisted' | 'missing_object' | 'human_night';
  triggerParam?: string; // plate or face or zone ID
  actionTarget: 'sonoff_relay' | 'tuya_light' | 'mqtt_siren' | 'push_mobile' | 'home_assistant';
  actionPayload: Record<string, any>;
  protocol: 'LAN_EWE_LINK' | 'TUYA_LOCAL' | 'MQTT' | 'WEBSOCKET' | 'FCM';
  estimatedLatencyMs: number;
  executionsCount: number;
  lastTriggered?: string;
}

export interface MqttLogMessage {
  id: string;
  timestamp: string;
  topic: string;
  payload: string;
  qos: 0 | 1 | 2;
  origin: 'VISION_INFERENCE' | 'IOT_ACTUATOR' | 'SYSTEM';
}

export interface SystemEventAlert {
  id: string;
  timestamp: string;
  cameraId: CameraFeedId;
  cameraName: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  thumbnailUrl?: string;
  metadata: Record<string, any>;
  ack: boolean;
}
