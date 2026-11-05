import { CameraDevice, RegisteredFace, RegisteredPlate, AutomationRule, ZoneVirtual, MqttLogMessage, SystemEventAlert } from '../types';

export const INITIAL_CAMERAS: CameraDevice[] = [
  {
    id: 'cam_portao',
    name: 'Câmera 01 - Portão Social & Veicular',
    location: 'Entrada Principal Externa',
    ip: '192.168.1.101',
    onvifPort: 80,
    rtspMainStream: 'rtsp://admin:SafeGate2026@192.168.1.101:554/cam/realmonitor?channel=1&subtype=0',
    rtspSubStream: 'rtsp://admin:SafeGate2026@192.168.1.101:554/cam/realmonitor?channel=1&subtype=1',
    fpsStream: 30,
    fpsAiTarget: 8,
    resolution: '192.168.1.101 (1080p Main / 640x360 Sub)',
    codec: 'H.265',
    brand: 'Intelbras VIP 3230 B',
    status: 'online',
    gpuSlot: 'TensorRT Instance #0 (NVIDIA RTX / Orin)',
    zones: [
      {
        id: 'zone_portao_linha',
        cameraId: 'cam_portao',
        name: 'Linha Virtual Acesso Portão',
        type: 'tripwire',
        points: [{ x: 0.15, y: 0.70 }, { x: 0.85, y: 0.70 }],
        direction: 'both',
        active: true,
        color: '#10b981',
        triggerCount: 42
      },
      {
        id: 'zone_portao_poligono',
        cameraId: 'cam_portao',
        name: 'Cerca Virtual Calçada',
        type: 'polygon',
        points: [
          { x: 0.1, y: 0.6 },
          { x: 0.9, y: 0.6 },
          { x: 0.85, y: 0.95 },
          { x: 0.15, y: 0.95 }
        ],
        active: true,
        color: '#f59e0b',
        triggerCount: 19
      }
    ]
  },
  {
    id: 'cam_garagem',
    name: 'Câmera 02 - Garagem & Vagas',
    location: 'Estacionamento Coberto',
    ip: '192.168.1.102',
    onvifPort: 80,
    rtspMainStream: 'rtsp://admin:Pass@192.168.1.102:554/Streaming/Channels/101',
    rtspSubStream: 'rtsp://admin:Pass@192.168.1.102:554/Streaming/Channels/102',
    fpsStream: 25,
    fpsAiTarget: 6,
    resolution: '192.168.1.102 (1440p Main / 640x360 Sub)',
    codec: 'H.264',
    brand: 'Hikvision DS-2CD2043G2',
    status: 'online',
    gpuSlot: 'TensorRT Instance #0',
    zones: [
      {
        id: 'zone_garagem_vaga_vip',
        cameraId: 'cam_garagem',
        name: 'Cerca Vaga Privativa 01',
        type: 'polygon',
        points: [
          { x: 0.2, y: 0.4 },
          { x: 0.6, y: 0.4 },
          { x: 0.7, y: 0.85 },
          { x: 0.15, y: 0.85 }
        ],
        active: true,
        color: '#3b82f6',
        triggerCount: 12
      }
    ]
  },
  {
    id: 'cam_almoxarifado',
    name: 'Câmera 03 - Almoxarifado / Objeto Monitorado',
    location: 'Área Restrita Interna',
    ip: '192.168.1.103',
    onvifPort: 8899,
    rtspMainStream: 'rtsp://admin:Admin2026@192.168.1.103:554/live/ch0',
    rtspSubStream: 'rtsp://admin:Admin2026@192.168.1.103:554/live/ch1',
    fpsStream: 30,
    fpsAiTarget: 10,
    resolution: '192.168.1.103 (1080p Main / 640x360 Sub)',
    codec: 'H.265',
    brand: 'Dahua IPC-HFW2431',
    status: 'online',
    gpuSlot: 'TensorRT Instance #1',
    zones: [
      {
        id: 'zone_objeto_cofre',
        cameraId: 'cam_almoxarifado',
        name: 'Vigilância Objeto Crítico (Bicicleta Elétrica / Maleta)',
        type: 'missing_object',
        points: [
          { x: 0.35, y: 0.38 },
          { x: 0.65, y: 0.38 },
          { x: 0.65, y: 0.75 },
          { x: 0.35, y: 0.75 }
        ],
        missingObjectTimeSeconds: 5,
        active: true,
        color: '#ef4444',
        triggerCount: 3
      }
    ]
  },
  {
    id: 'cam_quintal',
    name: 'Câmera 04 - Perímetro Fundos & Muro',
    location: 'Área Perimetral Externa',
    ip: '192.168.1.104',
    onvifPort: 80,
    rtspMainStream: 'rtsp://admin:SecOps@192.168.1.104:554/h264Preview_01_main',
    rtspSubStream: 'rtsp://admin:SecOps@192.168.1.104:554/h264Preview_01_sub',
    fpsStream: 25,
    fpsAiTarget: 5,
    resolution: '192.168.1.104 (1080p Main / 640x360 Sub)',
    codec: 'H.264',
    brand: 'Reolink RLC-810A',
    status: 'online',
    gpuSlot: 'TensorRT Instance #1',
    zones: [
      {
        id: 'zone_muro_invasao',
        cameraId: 'cam_quintal',
        name: 'Linha de Transgressão de Muro',
        type: 'tripwire',
        points: [{ x: 0.05, y: 0.45 }, { x: 0.95, y: 0.45 }],
        direction: 'in',
        active: true,
        color: '#ec4899',
        triggerCount: 1
      }
    ]
  }
];

export const INITIAL_REGISTERED_FACES: RegisteredFace[] = [
  {
    id: 'face_01',
    name: 'Carlos Eduardo Oliveira',
    role: 'Morador',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    embeddingVectorLength: 512,
    registeredAt: '2026-01-15',
    status: 'active',
    notes: 'Morador Unidade 402 - Acesso liberado 24/7'
  },
  {
    id: 'face_02',
    name: 'Dra. Camila Vasconcellos',
    role: 'Morador',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    embeddingVectorLength: 512,
    registeredAt: '2026-02-10',
    status: 'active',
    notes: 'Moradora Unidade 402 - Liberação de relé de pedestres'
  },
  {
    id: 'face_03',
    name: 'Marcos Vinicius (Zelador)',
    role: 'Funcionário',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    embeddingVectorLength: 512,
    registeredAt: '2026-01-20',
    status: 'active',
    notes: 'Acesso Portão e Almoxarifado seg-sex 07h-18h'
  },
  {
    id: 'face_04',
    name: 'Alerta Perímetro (Suspeito Reincidente)',
    role: 'Lista Negra',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    embeddingVectorLength: 512,
    registeredAt: '2026-02-28',
    status: 'blocked',
    notes: 'Tentativa de escalada de muro registrada na polícia. Disparar alarme silencioso.'
  }
];

export const INITIAL_REGISTERED_PLATES: RegisteredPlate[] = [
  {
    id: 'plate_01',
    plate: 'BRA2E19',
    format: 'mercosul',
    ownerName: 'Carlos Eduardo Oliveira',
    vehicleModel: 'Toyota Corolla Cross Híbrido (Cinza)',
    accessLevel: 'allow',
    lastSeen: 'Hoje às 07:45'
  },
  {
    id: 'plate_02',
    plate: 'RIO2A18',
    format: 'mercosul',
    ownerName: 'Dra. Camila Vasconcellos',
    vehicleModel: 'Jeep Compass Limited (Branco)',
    accessLevel: 'allow',
    lastSeen: 'Ontem às 19:22'
  },
  {
    id: 'plate_03',
    plate: 'ABC-1234',
    format: 'antigo',
    ownerName: 'Prestador de Serviços - Elevadores Atlas',
    vehicleModel: 'Fiat Fiorino 1.4 EVO',
    accessLevel: 'notify_only',
    lastSeen: '03/03/2026 14:10'
  },
  {
    id: 'plate_04',
    plate: 'KRM-7890',
    format: 'antigo',
    ownerName: 'Veículo com Restrição Judicial / Furto',
    vehicleModel: 'Chevrolet Onix Preto',
    accessLevel: 'deny',
    lastSeen: 'Nunca registrado'
  }
];

export const INITIAL_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule_portao_veiculo_autorizado',
    name: 'Abertura Automática Portão: Placa Mercosul Autorizada',
    enabled: true,
    triggerCameraId: 'cam_portao',
    triggerEventType: 'plate_authorized',
    triggerParam: 'BRA2E19, RIO2A18',
    actionTarget: 'sonoff_relay',
    protocol: 'LAN_EWE_LINK',
    actionPayload: {
      deviceIp: '192.168.1.150',
      deviceKey: 'a9f8e721-b34c-412e',
      channel: 1,
      pulseMs: 800,
      command: 'SWITCH_PULSE'
    },
    estimatedLatencyMs: 120,
    executionsCount: 148,
    lastTriggered: 'Há 12 minutos'
  },
  {
    id: 'rule_portao_facial_morador',
    name: 'Liberação Fechadura Eletroímã: Rosto Morador Reconhecido',
    enabled: true,
    triggerCameraId: 'cam_portao',
    triggerEventType: 'face_authorized',
    actionTarget: 'sonoff_relay',
    protocol: 'LAN_EWE_LINK',
    actionPayload: {
      deviceIp: '192.168.1.151',
      deviceKey: 'c827361a-810a-4a2b',
      channel: 2,
      pulseMs: 1500,
      command: 'MAGNET_RELEASE'
    },
    estimatedLatencyMs: 145,
    executionsCount: 89,
    lastTriggered: 'Há 45 minutos'
  },
  {
    id: 'rule_objeto_ausente_alerta',
    name: 'Alarme Crítico: Objeto Valioso Removido > 5s',
    enabled: true,
    triggerCameraId: 'cam_almoxarifado',
    triggerEventType: 'missing_object',
    actionTarget: 'mqtt_siren',
    protocol: 'MQTT',
    actionPayload: {
      broker: '192.168.1.5:1883',
      topic: 'omnisight/actuators/siren_warehouse/state',
      payload: { mode: 'STROBE_AND_AUDIO', timeout_sec: 30 }
    },
    estimatedLatencyMs: 65,
    executionsCount: 3,
    lastTriggered: 'Há 2 dias'
  },
  {
    id: 'rule_garagem_noturno_tuya',
    name: 'Refletor LED Tuya: Humano na Garagem após as 22h',
    enabled: true,
    triggerCameraId: 'cam_garagem',
    triggerEventType: 'human_night',
    actionTarget: 'tuya_light',
    protocol: 'TUYA_LOCAL',
    actionPayload: {
      deviceIp: '192.168.1.160',
      localKey: '8d7f2a1b9c3e4f5a',
      devId: 'bf912384a8bc12',
      dps: { '20': true, '21': 'white', '22': 1000 }
    },
    estimatedLatencyMs: 210,
    executionsCount: 34,
    lastTriggered: 'Ontem às 23:14'
  },
  {
    id: 'rule_perimetro_fcm',
    name: 'Notificação Push FCM + Snapshot: Violação de Muro',
    enabled: true,
    triggerCameraId: 'cam_quintal',
    triggerEventType: 'polygon_intrusion',
    actionTarget: 'push_mobile',
    protocol: 'FCM',
    actionPayload: {
      priority: 'high',
      sound: 'alarm_critical.wav',
      channelId: 'perimeter_breach'
    },
    estimatedLatencyMs: 380,
    executionsCount: 7,
    lastTriggered: 'Há 3 dias'
  }
];

export const INITIAL_MQTT_LOGS: MqttLogMessage[] = [
  {
    id: 'mqtt_01',
    timestamp: '08:31:02.140',
    topic: 'omnisight/events/cam_portao/inference',
    payload: JSON.stringify({
      cam_id: 'cam_portao',
      type: 'plate_detected',
      plate: 'BRA2E19',
      score: 0.962,
      vehicle: 'Toyota Corolla Cross',
      zone_crossed: 'zone_portao_linha'
    }),
    qos: 1,
    origin: 'VISION_INFERENCE'
  },
  {
    id: 'mqtt_02',
    timestamp: '08:31:02.260',
    topic: 'cmnd/sonoff_gate/POWER1',
    payload: 'ON',
    qos: 1,
    origin: 'IOT_ACTUATOR'
  },
  {
    id: 'mqtt_03',
    timestamp: '08:31:03.060',
    topic: 'cmnd/sonoff_gate/POWER1',
    payload: 'OFF',
    qos: 1,
    origin: 'IOT_ACTUATOR'
  },
  {
    id: 'mqtt_04',
    timestamp: '08:31:45.812',
    topic: 'omnisight/system/health',
    payload: JSON.stringify({
      active_streams: 4,
      total_gpu_vram_mb: 2840,
      avg_inference_latency_ms: 18.4,
      pipeline_status: 'HEALTHY'
    }),
    qos: 0,
    origin: 'SYSTEM'
  }
];

export const ONVIF_DISCOVERED_SAMPLES = [
  {
    ip: '192.168.1.101',
    port: 80,
    brand: 'Intelbras',
    model: 'VIP 3230 B (Bullet IP 2MP)',
    mac: 'E0:5A:1B:3C:99:41',
    profiles: ['Profile S (Audio/Video Streaming)', 'Profile T (H.265/HTTPS Analytics)'],
    rtspUrls: [
      'rtsp://192.168.1.101:554/cam/realmonitor?channel=1&subtype=0',
      'rtsp://192.168.1.101:554/cam/realmonitor?channel=1&subtype=1'
    ],
    status: 'configured'
  },
  {
    ip: '192.168.1.102',
    port: 80,
    brand: 'Hikvision',
    model: 'DS-2CD2043G2-I (4MP AcuSense)',
    mac: 'BC:A5:11:42:DE:09',
    profiles: ['Profile S', 'Profile G', 'Profile T'],
    rtspUrls: [
      'rtsp://192.168.1.102:554/Streaming/Channels/101',
      'rtsp://192.168.1.102:554/Streaming/Channels/102'
    ],
    status: 'configured'
  },
  {
    ip: '192.168.1.103',
    port: 8899,
    brand: 'Dahua Technology',
    model: 'IPC-HFW2431S-S2 (4MP Starlight)',
    mac: '3C:EF:8C:99:12:33',
    profiles: ['Profile S', 'Profile T'],
    rtspUrls: [
      'rtsp://192.168.1.103:554/live/ch0',
      'rtsp://192.168.1.103:554/live/ch1'
    ],
    status: 'configured'
  },
  {
    ip: '192.168.1.115',
    port: 8000,
    brand: 'Hikvision NVR',
    model: 'DS-7616NI-Q2/16P (NVR 16 Canais Legado)',
    mac: '44:19:B6:88:FF:21',
    profiles: ['Profile S'],
    rtspUrls: [
      'rtsp://192.168.1.115:554/Streaming/Channels/101 (Canal 1)',
      'rtsp://192.168.1.115:554/Streaming/Channels/201 (Canal 2)'
    ],
    status: 'unpaired'
  }
];

export const PYTHON_POC_CODE = `# ==============================================================================
# OmniSight AI - Prova de Conceito (PoC) de Visão Computacional + IoT MQTT
# Pipeline: RTSP Stream Ingestion -> Frame Skipping -> YOLOv8 Detection ->
#           Cálculo de Invasão em Cerca Virtual (Polígono) -> MQTT Event Dispatch
# Requisitos: pip install ultralytics opencv-python paho-mqtt shapely numpy
# ==============================================================================

import time
import json
import cv2
import numpy as np
import paho.mqtt.client as mqtt
from shapely.geometry import Point, Polygon
from ultralytics import YOLO

# ----------------- CONFIGURAÇÕES GERAIS -----------------
RTSP_URL = "rtsp://admin:SafeGate2026@192.168.1.101:554/cam/realmonitor?channel=1&subtype=1"
MQTT_BROKER = "192.168.1.5"
MQTT_PORT = 1883
MQTT_TOPIC_EVENTS = "omnisight/events/cam_portao/intrusion"
MQTT_TOPIC_ACTUATOR = "cmnd/sonoff_gate/POWER1"  # Exemplo Sonoff Tasmota/MQTT
CAMERA_ID = "cam_portao_01"
TARGET_AI_FPS = 8  # Decodificação suave, inferência com frame skipping (8 FPS)
CONF_THRESHOLD = 0.55

# Classes COCO de interesse (0 = Person, 2 = Car, 3 = Motorcycle, 7 = Truck, 16 = Dog, 17 = Cat)
ALLOWED_CLASSES = [0, 2, 3, 7, 16, 17]

# Polígono da Cerca Virtual (coordenadas relativas x, y normalizadas entre 0.0 e 1.0)
VIRTUAL_POLYGON_NORM = [
    (0.15, 0.45),
    (0.85, 0.45),
    (0.90, 0.90),
    (0.10, 0.90)
]

# ----------------- INICIALIZAÇÃO MQTT -----------------
mqtt_client = mqtt.Client(client_id=f"omnisight_ai_{CAMERA_ID}", clean_session=True)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[MQTT] Conectado com sucesso ao Broker {MQTT_BROKER}:{MQTT_PORT}")
    else:
        print(f"[MQTT] Falha na conexão. Código de retorno: {rc}")

mqtt_client.on_connect = on_connect
try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    mqtt_client.loop_start()
except Exception as e:
    print(f"[MQTT AVISO] Não foi possível conectar ao broker local ({e}). O script continuará em modo de log.")

# ----------------- INICIALIZAÇÃO MODELO YOLO -----------------
print("[AI] Carregando modelo YOLOv8n (Nano / TensorRT)...")
model = YOLO("yolov8n.pt")  # Em produção: exportar para TensorRT: model.export(format='engine', half=True)

# ----------------- CAPTURA DE VÍDEO RTSP -----------------
# Configuração de buffer mínimo no OpenCV para evitar lag acumulado no RTSP
cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

if not cap.isOpened():
    print(f"[ERRO] Falha ao abrir stream RTSP: {RTSP_URL}")
    print("[FALLBACK] Utilizando webcam padrão (0) ou vídeo de teste...")
    cap = cv2.VideoCapture(0)

# Resolução base e polígono absoluto
ret, sample_frame = cap.read()
if not ret or sample_frame is None:
    frame_h, frame_w = 720, 1280
else:
    frame_h, frame_w = sample_frame.shape[:2]

poly_points_abs = [(int(x * frame_w), int(y * frame_h)) for x, y in VIRTUAL_POLYGON_NORM]
shapely_polygon = Polygon(poly_points_abs)
cv2_pts = np.array(poly_points_abs, np.int32).reshape((-1, 1, 2))

# Controle de frame skipping e throttle de disparos
prev_ai_time = 0.0
ai_interval = 1.0 / TARGET_AI_FPS
last_alert_time = 0.0
ALERT_COOLDOWN_SEC = 2.0  # Evita tempestade de comandos MQTT duplicados

print("[STATUS] Pipeline iniciado. Pressione 'q' na janela para sair.")

try:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("[AVISO] Perda de sinal RTSP. Tentando reconectar...")
            time.sleep(1.0)
            cap = cv2.VideoCapture(RTSP_URL)
            continue

        current_time = time.time()
        
        # Desenha polígono de cerca virtual na imagem (Visualização transparente)
        overlay = frame.copy()
        cv2.fillPoly(overlay, [cv2_pts], (0, 165, 255))
        cv2.addWeighted(overlay, 0.25, frame, 0.75, 0, frame)
        cv2.polylines(frame, [cv2_pts], isClosed=True, color=(0, 200, 255), thickness=2)

        # Frame Skipping: Executa inferência apenas no intervalo de 8 FPS
        if (current_time - prev_ai_time) >= ai_interval:
            prev_ai_time = current_time

            # Inferência Ultralytics YOLO
            results = model.predict(frame, conf=CONF_THRESHOLD, classes=ALLOWED_CLASSES, verbose=False)

            intrusion_detected = False
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    cls_name = model.names[cls_id]
                    confidence = float(box.conf[0].item())
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

                    # Ponto representativo para verificação da cerca: Ponto dos Pés (x_center, y2)
                    centroid_x = int((x1 + x2) / 2)
                    centroid_y = int(y2)  # Base do objeto/pés do indivíduo
                    target_point = Point(centroid_x, centroid_y)

                    # Verificação geométrica de invasão
                    is_inside = shapely_polygon.contains(target_point)

                    box_color = (0, 0, 255) if is_inside else (0, 255, 0)
                    cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), box_color, 2)
                    cv2.circle(frame, (centroid_x, centroid_y), 4, box_color, -1)
                    cv2.putText(frame, f"{cls_name} {confidence:.2f}", (int(x1), int(y1) - 6),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 2)

                    if is_inside:
                        intrusion_detected = True
                        if (current_time - last_alert_time) > ALERT_COOLDOWN_SEC:
                            last_alert_time = current_time
                            event_payload = {
                                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                                "camera_id": CAMERA_ID,
                                "event_type": "POLYGON_INTRUSION",
                                "zone_name": "Cerca Virtual Calçada",
                                "detected_class": cls_name,
                                "confidence": round(confidence, 3),
                                "bbox": [int(x1), int(y1), int(x2), int(y2)],
                                "centroid": [centroid_x, centroid_y],
                                "action_taken": "MQTT_DISPATCH_ACTUATOR"
                            }
                            # 1. Publica evento de inteligência para gravação/auditoria
                            mqtt_client.publish(MQTT_TOPIC_EVENTS, json.dumps(event_payload), qos=1)
                            # 2. Publica comando imediato para atuador Sonoff / Relé IoT (Latência < 100ms)
                            mqtt_client.publish(MQTT_TOPIC_ACTUATOR, "ON", qos=1)
                            print(f"[ALERTA INVASÃO] {cls_name} detectado dentro da cerca! Publicado no MQTT.")

        # Overlay de status de inferência e FPS
        cv2.putText(frame, f"OmniSight AI Engine | Camera: {CAMERA_ID} | AI Target: {TARGET_AI_FPS} FPS",
                    (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2)

        cv2.imshow("OmniSight AI - Monitoramento em Tempo Real", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

finally:
    cap.release()
    cv2.destroyAllWindows()
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
    print("[FINALIZADO] Recursos liberados.")
`;

export const SQL_SCHEMA_DDL = `-- ==============================================================================
-- OmniSight AI - Esquema Conceitual de Banco de Dados Relacional (PostgreSQL / SQLite)
-- Módulos: Dispositivos, Câmeras, Biometria Facial, ALPR, Zonas e Regras IoT
-- ==============================================================================

-- 1. TABELA DE DISPOSITIVOS FÍSICOS (NVRs, DVRs, Gateways IoT, Sonoff, Tuya)
CREATE TABLE IF NOT EXISTS dispositivos (
    id VARCHAR(64) PRIMARY KEY,
    nome VARCHAR(128) NOT NULL,
    tipo VARCHAR(32) NOT NULL CHECK (tipo IN ('NVR', 'DVR', 'CAMERA_STANDALONE', 'SONOFF_RELAY', 'TUYA_SWITCH', 'MQTT_GATEWAY')),
    ip_rede VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17) UNIQUE,
    porta_servico INT NOT NULL DEFAULT 80,
    credencial_usuario VARCHAR(64),
    credencial_senha_hash VARCHAR(256),
    protocolo_comunicacao VARCHAR(32) NOT NULL DEFAULT 'ONVIF',
    versao_firmware VARCHAR(64),
    status VARCHAR(16) NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'DEGRADED', 'UNPAIRED')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE CÂMERAS E STREAMS RTSP (Ingestão & Decodificação)
CREATE TABLE IF NOT EXISTS cameras (
    id VARCHAR(64) PRIMARY KEY,
    dispositivo_pai_id VARCHAR(64) REFERENCES dispositivos(id) ON DELETE SET NULL,
    nome VARCHAR(128) NOT NULL,
    localizacao VARCHAR(128) NOT NULL,
    rtsp_main_stream VARCHAR(512) NOT NULL, -- Resolução alta (1080p/4K) para gravação/visualização
    rtsp_sub_stream VARCHAR(512) NOT NULL,  -- Resolução baixa (640x360 @ 5-10 FPS) para inferência de IA
    onvif_profile_token VARCHAR(64),
    codec VARCHAR(16) NOT NULL DEFAULT 'H.264' CHECK (codec IN ('H.264', 'H.265')),
    fps_stream_original INT NOT NULL DEFAULT 30,
    fps_alvo_ia INT NOT NULL DEFAULT 8,     -- Taxa de inferência do pipeline (Frame Skipping)
    decodificacao_hardware VARCHAR(32) DEFAULT 'NVDEC', -- 'NVDEC', 'VAAPI', 'QSV', 'CPU'
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE FACES CADASTRADAS (Reconhecimento Facial com Vetor ArcFace 512-D)
CREATE TABLE IF NOT EXISTS faces_cadastradas (
    id VARCHAR(64) PRIMARY KEY,
    nome_completo VARCHAR(128) NOT NULL,
    categoria VARCHAR(32) NOT NULL CHECK (categoria IN ('MORADOR', 'FUNCIONARIO', 'VISITANTE', 'LISTA_NEGRA', 'VIP')),
    documento_identificacao VARCHAR(32),
    avatar_url TEXT,
    embedding_vetor_512 JSONB NOT NULL,    -- Array de 512 floats gerado por modelo InsightFace ArcFace
    limiar_confianca_customizado FLOAT DEFAULT 0.65,
    status VARCHAR(16) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'BLOQUEADO', 'EXPIRADO')),
    observacoes TEXT,
    expira_em TIMESTAMP WITH TIME ZONE,    -- Opcional para visitantes temporários
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE PLACAS VEICULARES CADASTRADAS (ALPR / ANPR)
CREATE TABLE IF NOT EXISTS placas_cadastradas (
    id VARCHAR(64) PRIMARY KEY,
    placa VARCHAR(10) UNIQUE NOT NULL,     -- Suporta Mercosul (BRA2E19) e Antigo (ABC-1234)
    formato_padrao VARCHAR(16) NOT NULL CHECK (formato_padrao IN ('MERCOSUL', 'ANTIGO_BRASIL')),
    nome_proprietario VARCHAR(128) NOT NULL,
    modelo_veiculo VARCHAR(128),
    cor_veiculo VARCHAR(32),
    tipo_acesso VARCHAR(16) NOT NULL DEFAULT 'LIBERADO' CHECK (tipo_acesso IN ('LIBERADO', 'BLOQUEADO', 'ALERTA_APENAS')),
    unidade_residencia VARCHAR(32),
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE ZONAS VIRTUAIS & OBJETOS AUSENTES (Perímetros, Linhas e ROI)
CREATE TABLE IF NOT EXISTS zonas_virtuais (
    id VARCHAR(64) PRIMARY KEY,
    camera_id VARCHAR(64) NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    nome VARCHAR(128) NOT NULL,
    tipo VARCHAR(32) NOT NULL CHECK (tipo IN ('TRIPWIRE', 'POLYGON', 'MISSING_OBJECT', 'LOITERING')),
    coordenadas_pontos JSONB NOT NULL,      -- Lista de pontos normalizados [{x: 0.1, y: 0.2}, ...]
    direcao_cruzamento VARCHAR(16) DEFAULT 'BOTH' CHECK (direcao_cruzamento IN ('IN', 'OUT', 'BOTH')),
    tempo_limite_segundos INT DEFAULT 0,    -- Para 'MISSING_OBJECT' (ex: 5s sem o objeto) ou 'LOITERING'
    sensibilidade_limiar FLOAT DEFAULT 0.6,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    cor_renderizacao VARCHAR(9) DEFAULT '#10b981',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABELA DE REGRAS DE AUTOMAÇÃO & DISPARO IOT (Motor de Ações em tempo real)
CREATE TABLE IF NOT EXISTS regras_automacao (
    id VARCHAR(64) PRIMARY KEY,
    nome VARCHAR(128) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    camera_id VARCHAR(64) REFERENCES cameras(id) ON DELETE CASCADE, -- NULL se aplicar a todas
    tipo_evento_gatilho VARCHAR(32) NOT NULL CHECK (tipo_evento_gatilho IN (
        'LINE_CROSS', 'POLYGON_INTRUSION', 'FACE_AUTHORIZED', 'FACE_UNKNOWN',
        'FACE_BLACKLIST', 'PLATE_AUTHORIZED', 'PLATE_DENIED', 'MISSING_OBJECT'
    )),
    zona_virtual_id VARCHAR(64) REFERENCES zonas_virtuais(id) ON DELETE SET NULL,
    filtro_horario_inicio TIME,            -- Ex: 22:00:00
    filtro_horario_fim TIME,               -- Ex: 06:00:00
    alvo_atuador_tipo VARCHAR(32) NOT NULL CHECK (alvo_atuador_tipo IN (
        'SONOFF_LAN_RELAY', 'TUYA_LOCAL_API', 'MQTT_BROKER', 'HOME_ASSISTANT_WS', 'PUSH_FCM'
    )),
    protocolo VARCHAR(16) NOT NULL CHECK (protocolo IN ('LAN_EWE_LINK', 'TUYA_LOCAL', 'MQTT', 'HTTP_WEBHOOK', 'FCM')),
    endereco_atuador VARCHAR(128) NOT NULL, -- IP local do Sonoff/Tuya ou tópico MQTT
    parametros_execucao JSONB NOT NULL,     -- {'channel': 1, 'pulse_ms': 800} ou {'dps': {'20': true}}
    tempo_cooldown_segundos INT DEFAULT 5,  -- Evita reacionamento excessivo
    contagem_disparos BIGINT DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABELA DE LOGS DE EVENTOS E AUDITORIA (Event Sourcing & Notificações)
CREATE TABLE IF NOT EXISTS logs_eventos (
    id BIGSERIAL PRIMARY KEY,
    uuid_evento UUID DEFAULT gen_random_uuid(),
    timestamp_evento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    camera_id VARCHAR(64) REFERENCES cameras(id) ON DELETE CASCADE,
    zona_id VARCHAR(64) REFERENCES zonas_virtuais(id) ON DELETE SET NULL,
    tipo_evento VARCHAR(32) NOT NULL,
    nivel_severidade VARCHAR(16) NOT NULL CHECK (nivel_severidade IN ('INFO', 'AVISO', 'CRITICO')),
    classe_detectada VARCHAR(32),          -- 'HUMAN', 'VEHICLE', 'DOG', 'CAT'
    placa_detectada VARCHAR(16),
    face_reconhecida_id VARCHAR(64) REFERENCES faces_cadastradas(id) ON DELETE SET NULL,
    score_confianca FLOAT,
    snapshot_url TEXT,                     -- URL local ou S3/MinIO da foto do evento
    bounding_box_coordenadas JSONB,        -- [x1, y1, x2, y2]
    regras_acionadas JSONB,                -- IDs das regras IoT executadas com sucesso
    tempo_processamento_ms INT,            -- Latência fim-a-fim da inferência ao acionamento IoT
    notificacao_enviada BOOLEAN DEFAULT FALSE
);

-- ÍNDICES DE PERFORMANCE E PESQUISA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_cameras_dispositivo ON cameras(dispositivo_pai_id);
CREATE INDEX IF NOT EXISTS idx_zonas_camera ON zonas_virtuais(camera_id);
CREATE INDEX IF NOT EXISTS idx_regras_camera_evento ON regras_automacao(camera_id, tipo_evento_gatilho);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs_eventos(timestamp_evento DESC);
CREATE INDEX IF NOT EXISTS idx_logs_camera ON logs_eventos(camera_id);
CREATE INDEX IF NOT EXISTS idx_placas_texto ON placas_cadastradas(placa);
`;
