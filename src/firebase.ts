import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check with server
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Conexão com Firestore confirmada com sucesso.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Verifique a configuração do Firebase ou conexão de internet.');
    }
    return false;
  }
}

// -------------------------------------------------------------
// FIRESTORE CRUD HELPERS FOR REAL PERSISTENCE
// -------------------------------------------------------------

// 1. CAMERAS
export async function syncCameraToFirestore(cam: any) {
  const path = `cameras/${cam.id}`;
  try {
    await setDoc(doc(db, 'cameras', cam.id), {
      id: cam.id,
      name: String(cam.name || 'Câmera IP').slice(0, 100),
      location: cam.location || 'Rede Local',
      ip: String(cam.ip || '192.168.1.100').slice(0, 45),
      onvifPort: Number(cam.onvifPort) || 80,
      rtspMainStream: cam.rtspMainStream || '',
      rtspSubStream: cam.rtspSubStream || '',
      codec: cam.codec || 'H.265',
      brand: cam.brand || 'Intelbras',
      status: cam.status || 'online',
      fpsAiTarget: Number(cam.fpsAiTarget) || 8,
      isRealFeed: Boolean(cam.isRealFeed),
      feedType: cam.feedType || 'simulation',
      liveVideoUrl: cam.liveVideoUrl || '',
      zones: Array.isArray(cam.zones) ? cam.zones : [],
      tenantId: cam.tenantId || 'global',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCameraFromFirestore(camId: string) {
  const path = `cameras/${camId}`;
  try {
    await deleteDoc(doc(db, 'cameras', camId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeToCameras(onUpdate: (cams: any[]) => void) {
  const path = 'cameras';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      onUpdate(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

// 2. CLIENT TENANTS (Multi-Tenant Persistence)
export async function syncClientToFirestore(client: any) {
  const path = `clients/${client.id}`;
  try {
    await setDoc(doc(db, 'clients', client.id), {
      id: client.id,
      name: String(client.name || 'Cliente').slice(0, 120),
      email: String(client.email || 'contato@cliente.com').slice(0, 120),
      phone: client.phone || '',
      plan: client.plan || 'pro',
      status: client.status || 'active',
      camerasCount: Number(client.camerasCount) || 1,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToClients(onUpdate: (clients: any[]) => void) {
  const path = 'clients';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      onUpdate(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

// 3. FACES
export async function syncFaceToFirestore(face: any) {
  const path = `faces/${face.id}`;
  try {
    await setDoc(doc(db, 'faces', face.id), {
      id: face.id,
      name: String(face.name || 'Pessoa').slice(0, 100),
      role: face.role || 'Morador',
      department: face.department || 'Residencial',
      faceImageUrl: face.faceImageUrl || face.avatarUrl || '',
      avatarUrl: face.avatarUrl || face.faceImageUrl || '',
      embeddingVectorLength: Number(face.embeddingVectorLength) || 512,
      registeredAt: face.registeredAt || new Date().toISOString().split('T')[0],
      status: face.status || 'active',
      notes: face.notes || '',
      confidenceThreshold: Number(face.confidenceThreshold) || 85,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteFaceFromFirestore(faceId: string) {
  const path = `faces/${faceId}`;
  try {
    await deleteDoc(doc(db, 'faces', faceId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeToFaces(onUpdate: (faces: any[]) => void) {
  const path = 'faces';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      onUpdate(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

// 4. PLATES
export async function syncPlateToFirestore(plate: any) {
  const path = `plates/${plate.id}`;
  try {
    const ownerLabel = String(plate.owner || plate.ownerName || 'Proprietário').slice(0, 100);
    await setDoc(doc(db, 'plates', plate.id), {
      id: plate.id,
      plate: String(plate.plate || '').toUpperCase().slice(0, 10),
      format: plate.format || 'mercosul',
      owner: ownerLabel,
      ownerName: ownerLabel,
      vehicleModel: plate.vehicleModel || 'Veículo',
      color: plate.color || 'Prata',
      accessLevel: plate.accessLevel || (plate.authorized === false ? 'deny' : 'allow'),
      authorized: plate.accessLevel ? plate.accessLevel === 'allow' : Boolean(plate.authorized ?? true),
      lastSeen: plate.lastSeen || 'Agora',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePlateFromFirestore(plateId: string) {
  const path = `plates/${plateId}`;
  try {
    await deleteDoc(doc(db, 'plates', plateId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeToPlates(onUpdate: (plates: any[]) => void) {
  const path = 'plates';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      onUpdate(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

// 5. SECURITY EVENTS / ALERTS
export async function logEventToFirestore(alert: any) {
  const eventId = alert.id || `evt_${Date.now()}`;
  const path = `events/${eventId}`;
  try {
    await setDoc(doc(db, 'events', eventId), {
      id: eventId,
      cameraId: alert.cameraId || 'cam_portao',
      cameraName: alert.cameraName || 'Câmera',
      severity: alert.severity || 'info',
      title: String(alert.title || 'Evento de Segurança').slice(0, 120),
      description: alert.description || '',
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    // Non-blocking logger
    console.warn('[Firebase] Erro ao registrar evento:', err);
  }
}

// 6. SYSTEM SERVER BRIDGE CONFIG (APK / Mobile <-> Local PC Server)
export interface ServerBridgeConfig {
  serverUrl: string;
  localIp: string;
  port: number;
  tunnelUrl?: string;
  hostname?: string;
  updatedAt?: string;
}

export async function syncServerBridgeToFirestore(config: ServerBridgeConfig) {
  const path = 'system_config/server_bridge';
  try {
    await setDoc(doc(db, 'system_config', 'server_bridge'), {
      serverUrl: String(config.serverUrl || '').slice(0, 300),
      localIp: String(config.localIp || '').slice(0, 45),
      port: Number(config.port) || 3000,
      tunnelUrl: String(config.tunnelUrl || '').slice(0, 300),
      hostname: String(config.hostname || '').slice(0, 100),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToServerBridge(onUpdate: (config: ServerBridgeConfig | null) => void) {
  const path = 'system_config/server_bridge';
  return onSnapshot(
    doc(db, 'system_config', 'server_bridge'),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as ServerBridgeConfig);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

