// Network Bridge: Connects Android APK / PWA / Remote Browser to the Local PC Server (192.168.x.x:3000)

export const SERVER_URL_STORAGE_KEY = 'rog_tech_server_url';

export function normalizeServerUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return trimmed;
}

export function getConfiguredServerUrl(): string {
  if (typeof window === 'undefined') return '';
  try {
    const saved = localStorage.getItem(SERVER_URL_STORAGE_KEY);
    if (saved) return normalizeServerUrl(saved);
  } catch (_) {}
  return '';
}

export function setConfiguredServerUrl(url: string): string {
  const normalized = normalizeServerUrl(url);
  if (typeof window !== 'undefined') {
    try {
      if (normalized) {
        localStorage.setItem(SERVER_URL_STORAGE_KEY, normalized);
      } else {
        localStorage.removeItem(SERVER_URL_STORAGE_KEY);
      }
      window.dispatchEvent(new CustomEvent('rogtech:server-url-changed', { detail: normalized }));
    } catch (_) {}
  }
  return normalized;
}

export function isRunningInsideCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return Boolean(
    w.Capacitor?.isNativePlatform?.() ||
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && !window.location.port)
  );
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getConfiguredServerUrl();
  if (base) {
    return `${base}${cleanPath}`;
  }
  return cleanPath;
}

// Detect device local Wi-Fi/LAN IP directly inside Android APK / Browser via WebRTC ICE candidates
export async function detectClientLanIpViaWebRTC(timeoutMs = 2500): Promise<{
  lanIp: string | null;
  subnet: string | null;
  candidates: string[];
}> {
  if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') {
    return { lanIp: null, subnet: null, candidates: [] };
  }

  return new Promise((resolve) => {
    const foundIps = new Set<string>();
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      try {
        pc.close();
      } catch (_) {}

      const list = Array.from(foundIps);
      const preferred =
        list.find((ip) => ip.startsWith('192.168.')) ||
        list.find((ip) => ip.startsWith('10.')) ||
        list.find((ip) => /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) ||
        list[0] ||
        null;

      const subnet = preferred
        ? `${preferred.split('.').slice(0, 3).join('.')}.0/24`
        : null;

      resolve({
        lanIp: preferred,
        subnet,
        candidates: list,
      });
    };

    const pc = new RTCPeerConnection({ iceServers: [] });
    try {
      pc.createDataChannel('rogtech-ip-probe');
    } catch (_) {}

    const timer = setTimeout(finish, timeoutMs);

    pc.onicecandidate = (evt) => {
      if (!evt || !evt.candidate || !evt.candidate.candidate) {
        if (!evt.candidate) {
          clearTimeout(timer);
          finish();
        }
        return;
      }

      const cand = evt.candidate.candidate;
      const ipv4Regex = /\b((?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})\b/g;
      let match: RegExpExecArray | null;
      while ((match = ipv4Regex.exec(cand)) !== null) {
        const ip = match[1];
        if (!ip.startsWith('127.') && !ip.startsWith('0.') && !ip.startsWith('169.254.')) {
          foundIps.add(ip);
        }
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(() => {
        clearTimeout(timer);
        finish();
      });
  });
}

export async function probeServerUrl(
  url: string,
  timeoutMs = 3500
): Promise<{
  ok: boolean;
  serverUrl: string;
  localIp?: string;
  port?: number;
  hostname?: string;
  latencyMs?: number;
  error?: string;
}> {
  const normalized = normalizeServerUrl(url);
  if (!normalized) {
    return { ok: false, serverUrl: '', error: 'Endereço inválido' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const t0 = performance.now();

  try {
    const res = await fetch(`${normalized}/api/system/server-status`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, serverUrl: normalized, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return {
      ok: Boolean(data?.success),
      serverUrl: normalized,
      localIp: data.localIp,
      port: data.port,
      hostname: data.hostname,
      latencyMs: Math.round(performance.now() - t0),
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      ok: false,
      serverUrl: normalized,
      error: err?.name === 'AbortError' ? 'Tempo esgotado (verifique Wi-Fi e Firewall)' : err?.message || 'Falha de conexão',
    };
  }
}
