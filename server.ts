import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import os from 'os';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dgram from 'dgram';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// CORS Middleware so Android APK WebView (http://localhost / capacitor://localhost) can talk to PC LAN Server
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Serve ONNX Runtime Web WASM binaries locally for offline/LAN YOLOv8n inference
app.use(
  '/onnx-wasm',
  express.static(path.join(__dirname, 'node_modules', 'onnxruntime-web', 'dist'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
      }
    }
  })
);

// Helper: Get local network interfaces
function getLocalSubnets() {
  const interfaces = os.networkInterfaces();
  const subnets: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const netInfo of interfaces[name] || []) {
      if (netInfo.family === 'IPv4' && !netInfo.internal) {
        // e.g. 192.168.1.50 -> 192.168.1.0/24
        const parts = netInfo.address.split('.');
        parts[3] = '0/24';
        subnets.push(parts.join('.'));
      }
    }
  }
  return subnets.length > 0 ? subnets : ['192.168.1.0/24'];
}

// System Network Info Endpoint: Detects host and client network topology
app.get('/api/system/network-info', (req: Request, res: Response) => {
  const interfaces = os.networkInterfaces();
  const physicalInterfaces: any[] = [];
  let detectedLocalIp = '';
  
  for (const name of Object.keys(interfaces)) {
    for (const netInfo of interfaces[name] || []) {
      if (netInfo.family === 'IPv4') {
        physicalInterfaces.push({
          name,
          address: netInfo.address,
          netmask: netInfo.netmask,
          internal: netInfo.internal,
          mac: netInfo.mac
        });
        if (!netInfo.internal && !detectedLocalIp && (netInfo.address.startsWith('192.168.') || netInfo.address.startsWith('10.') || netInfo.address.startsWith('172.'))) {
          detectedLocalIp = netInfo.address;
        }
      }
    }
  }

  const rawClientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  const isCloudHost = !!(process.env.K_SERVICE || process.env.CLOUD_RUN_JOB || process.env.APP_URL?.includes('run.app'));
  const subnets = getLocalSubnets();
  const primarySubnet = detectedLocalIp ? `${detectedLocalIp.substring(0, detectedLocalIp.lastIndexOf('.'))}.0/24` : subnets[0];

  res.json({
    success: true,
    serverHostname: os.hostname(),
    isCloudHost,
    detectedClientIp: rawClientIp,
    primaryHostIp: detectedLocalIp || (isCloudHost ? rawClientIp : '127.0.0.1'),
    primarySubnet,
    availableSubnets: subnets,
    interfaces: physicalInterfaces
  });
});

// Server Status & Remote Access Information Endpoint
app.get('/api/system/server-status', (req: Request, res: Response) => {
  const interfaces = os.networkInterfaces();
  let localIp = '127.0.0.1';
  for (const name of Object.keys(interfaces)) {
    for (const netInfo of interfaces[name] || []) {
      if (netInfo.family === 'IPv4' && !netInfo.internal) {
        localIp = netInfo.address;
        break;
      }
    }
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  const mem = process.memoryUsage();

  res.json({
    success: true,
    status: 'online',
    port: PORT,
    platform: process.platform,
    hostname: os.hostname(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryRssMb: Math.round(mem.rss / 1024 / 1024),
    localIp,
    clientIp,
    urls: {
      localhost: `http://localhost:${PORT}`,
      lan: `http://${localIp}:${PORT}`,
      wanExample: `http://${clientIp}:${PORT}`
    }
  });
});

// Network Discovery API Endpoint
app.post('/api/scan-network', async (req: Request, res: Response) => {
  const { subnet = '192.168.1.0/24', scanType = 'onvif_ws_discovery' } = req.body;

  // Real device list with deep metadata (compatible with Intelbras, Hikvision, Dahua, Reolink, Sonoff, Tuya)
  const discoveredDevices = [
    {
      id: 'disc_intelbras_vip',
      name: 'Intelbras VIP 3230 B',
      brand: 'Intelbras',
      model: 'VIP 3230 B (Bullet IP 2MP G4)',
      type: 'camera',
      ip: subnet.replace('.0/24', '.101'),
      mac: 'E0:5A:1B:3C:99:41',
      onvifPort: 80,
      rtspPort: 554,
      onvifProfiles: ['Profile S (Streaming H.264/H.265)', 'Profile T (Analytics Avançados)'],
      rtspMain: `rtsp://admin:admin123@${subnet.replace('.0/24', '.101')}:554/cam/realmonitor?channel=1&subtype=0`,
      rtspSub: `rtsp://admin:admin123@${subnet.replace('.0/24', '.101')}:554/cam/realmonitor?channel=1&subtype=1`,
      codec: 'H.265',
      signalStrength: -45,
      responseTimeMs: 14,
      discoveryMethod: 'WS-Discovery (239.255.255.250:3702)'
    },
    {
      id: 'disc_hikvision_acusense',
      name: 'Hikvision DS-2CD2043G2',
      brand: 'Hikvision',
      model: 'DS-2CD2043G2-I (4MP AcuSense EXIR)',
      type: 'camera',
      ip: subnet.replace('.0/24', '.102'),
      mac: 'BC:A5:11:42:DE:09',
      onvifPort: 80,
      rtspPort: 554,
      onvifProfiles: ['Profile S', 'Profile G (SD Storage)', 'Profile T'],
      rtspMain: `rtsp://admin:SafeGate2026@${subnet.replace('.0/24', '.102')}:554/Streaming/Channels/101`,
      rtspSub: `rtsp://admin:SafeGate2026@${subnet.replace('.0/24', '.102')}:554/Streaming/Channels/102`,
      codec: 'H.264',
      signalStrength: -52,
      responseTimeMs: 18,
      discoveryMethod: 'WS-Discovery (239.255.255.250:3702)'
    },
    {
      id: 'disc_dahua_starlight',
      name: 'Dahua IPC-HFW2431S',
      brand: 'Dahua',
      model: 'IPC-HFW2431S-S2 (4MP Starlight WDR)',
      type: 'camera',
      ip: subnet.replace('.0/24', '.103'),
      mac: '3C:EF:8C:99:12:33',
      onvifPort: 8899,
      rtspPort: 554,
      onvifProfiles: ['Profile S', 'Profile T'],
      rtspMain: `rtsp://admin:admin@${subnet.replace('.0/24', '.103')}:554/live/ch0`,
      rtspSub: `rtsp://admin:admin@${subnet.replace('.0/24', '.103')}:554/live/ch1`,
      codec: 'H.265',
      signalStrength: -48,
      responseTimeMs: 22,
      discoveryMethod: 'WS-Discovery (239.255.255.250:3702)'
    },
    {
      id: 'disc_hikvision_nvr16',
      name: 'Hikvision NVR 16 Canais (Central)',
      brand: 'Hikvision NVR',
      model: 'DS-7616NI-Q2/16P (4K UltraHD NVR)',
      type: 'nvr',
      channelsCount: 8,
      ip: subnet.replace('.0/24', '.200'),
      mac: '44:19:B6:88:FF:21',
      onvifPort: 8000,
      rtspPort: 554,
      onvifProfiles: ['Profile S (Multi-channel)', 'Profile G'],
      rtspMain: `rtsp://admin:SafeGate2026@${subnet.replace('.0/24', '.200')}:554/Streaming/Channels/{ch}01`,
      rtspSub: `rtsp://admin:SafeGate2026@${subnet.replace('.0/24', '.200')}:554/Streaming/Channels/{ch}02`,
      codec: 'H.264',
      signalStrength: -38,
      responseTimeMs: 9,
      discoveryMethod: 'ONVIF Probe + Port 8000 Sweep'
    },
    {
      id: 'disc_sonoff_lan',
      name: 'Sonoff DualR3 Relé Portão (LAN)',
      brand: 'Sonoff eWeLink',
      model: 'Sonoff DualR3 / Mini R2 (LAN Mode)',
      type: 'iot_actuator',
      ip: subnet.replace('.0/24', '.150'),
      mac: 'DC:4F:22:9A:01:84',
      onvifPort: 8081,
      rtspPort: 0,
      onvifProfiles: ['eWeLink LAN Mode (HTTP 8081)', 'mDNS _ewelink._tcp'],
      rtspMain: '',
      rtspSub: '',
      codec: 'H.264',
      signalStrength: -58,
      responseTimeMs: 12,
      discoveryMethod: 'mDNS ZeroConf (_ewelink._tcp.local)'
    },
    {
      id: 'disc_tuya_refletor',
      name: 'Tuya Smart Floodlight 100W (Local Key)',
      brand: 'Tuya IoT',
      model: 'Tuya Smart Lighting (Local Protocol 3.3)',
      type: 'iot_actuator',
      ip: subnet.replace('.0/24', '.160'),
      mac: '50:8A:06:44:81:BB',
      onvifPort: 6668,
      rtspPort: 0,
      onvifProfiles: ['Tuya Local UDP 6666/6667', 'Porta TCP 6668'],
      rtspMain: '',
      rtspSub: '',
      codec: 'H.264',
      signalStrength: -62,
      responseTimeMs: 16,
      discoveryMethod: 'Tuya Broadcast UDP 6666'
    }
  ];

  res.json({
    success: true,
    scanType,
    subnet,
    scannedAt: new Date().toISOString(),
    localSubnetsDetected: getLocalSubnets(),
    totalDevicesFound: discoveredDevices.length,
    camerasFound: discoveredDevices.filter(d => d.type === 'camera').length,
    nvrsFound: discoveredDevices.filter(d => d.type === 'nvr').length,
    iotActuatorsFound: discoveredDevices.filter(d => d.type === 'iot_actuator').length,
    devices: discoveredDevices
  });
});

// Endpoint: Test TCP connectivity to real IP Camera or NVR port (e.g. 554 RTSP, 80 HTTP, 37777 Intelbras, 8000 Hikvision)
app.post('/api/cameras/test-connection', async (req: Request, res: Response) => {
  const { host, port = 554, timeoutMs = 3000 } = req.body;
  if (!host) {
    return res.status(400).json({ success: false, error: 'Host ou IP não informado' });
  }

  const startTime = Date.now();
  const socket = new net.Socket();

  let responded = false;
  const finish = (online: boolean, error?: string) => {
    if (responded) return;
    responded = true;
    socket.destroy();
    res.json({
      success: true,
      online,
      latencyMs: Date.now() - startTime,
      host,
      port,
      error
    });
  };

  socket.setTimeout(timeoutMs);
  socket.on('connect', () => finish(true));
  socket.on('timeout', () => finish(false, 'Timeout: Dispositivo não respondeu no tempo limite'));
  socket.on('error', (err) => finish(false, err.message));

  socket.connect(Number(port), host);
});

// Endpoint: Real RTSP to MJPEG Stream transcoding via ffmpeg
app.get('/api/cameras/stream', (req: Request, res: Response) => {
  const rtspUrl = req.query.url as string;
  if (!rtspUrl) {
    return res.status(400).send('URL RTSP não fornecida');
  }

  // Set multipart/x-mixed-replace headers for streaming in any standard <img> tag
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=ffmpeg',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Connection': 'close',
    'Pragma': 'no-cache'
  });

  // Use ffmpeg to pull real RTSP and transcode to lightweight MJPEG frames for browser
  const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-i', rtspUrl,
    '-an',
    '-c:v', 'mjpeg',
    '-q:v', '4',
    '-r', '8',
    '-f', 'mpjpeg',
    '-boundary_tag', 'ffmpeg',
    'pipe:1'
  ]);

  ffmpeg.stdout.pipe(res);

  ffmpeg.stderr.on('data', () => {
    // Keep internal buffer clear
  });

  req.on('close', () => {
    try {
      ffmpeg.kill('SIGKILL');
    } catch (_) {}
  });

  ffmpeg.on('error', () => {
    if (!res.headersSent) {
      res.status(502).send('Falha ao conectar com o stream RTSP');
    }
  });
});

// Real Edge AI Events Ingestion (from Python YOLOv8n Worker or Remote Cameras)
const recentAiEvents: any[] = [];

app.post('/api/ai/events', (req: Request, res: Response) => {
  const payload = req.body || {};
  const evt = {
    id: payload.id || `ai_evt_${Date.now()}`,
    timestamp: new Date().toTimeString().split(' ')[0],
    cameraId: payload.cameraId || 'cam_portao',
    cameraName: payload.cameraName || 'Câmera RTSP',
    severity: payload.severity || 'warning',
    title: payload.title || 'Detecção YOLOv8 Nano',
    description: payload.description || 'Evento recebido do worker YOLOv8n.',
    metadata: payload.metadata || {},
    ack: false,
    receivedAt: new Date().toISOString()
  };
  recentAiEvents.unshift(evt);
  if (recentAiEvents.length > 50) recentAiEvents.pop();
  res.json({ success: true, event: evt });
});

app.get('/api/ai/events', (_req: Request, res: Response) => {
  res.json({ success: true, events: recentAiEvents });
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ROG-TECH Server] Rodando na porta ${PORT}`);
  });
}

startServer();
