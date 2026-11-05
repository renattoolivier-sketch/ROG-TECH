import React, { useState } from 'react';
import { 
  BookOpen, Code2, Database, Cpu, Server, Network, 
  Check, Copy, Terminal, ExternalLink, Zap, Shield, FileText, ChevronRight
} from 'lucide-react';
import { SQL_SCHEMA_DDL, PYTHON_POC_CODE } from '../data/mockData';

export const ArchitectureDocs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'architecture' | 'stack' | 'database' | 'poc' | 'optimization'>('architecture');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Menu */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSection('architecture')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSection === 'architecture'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          1. Arquitetura de Microsserviços
        </button>

        <button
          onClick={() => setActiveSection('stack')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSection === 'stack'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          2. Stack Tecnológica & Justificativas
        </button>

        <button
          onClick={() => setActiveSection('database')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSection === 'database'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          3. Modelagem de Banco (DDL SQL)
        </button>

        <button
          onClick={() => setActiveSection('poc')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSection === 'poc'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          4. Código PoC Python (RTSP + YOLO + MQTT)
        </button>

        <button
          onClick={() => setActiveSection('optimization')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSection === 'optimization'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          5. Otimização de Performance (4 a 8 Streams)
        </button>
      </div>

      {/* SECTION 1: SYSTEM ARCHITECTURE */}
      {activeSection === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-400" />
              1. Desenho da Arquitetura do Sistema Distribuído
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O sistema adota uma <strong>arquitetura desacoplada orientada a eventos (Event-Driven & Pipe-and-Filter)</strong>, dividida em 5 camadas independentes para garantir alta disponibilidade, latência fim-a-fim inferior a 500ms e isolamento de falhas:
            </p>

            {/* Interactive Architecture Flow Diagram */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Fluxo de Dados & Microsserviços:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                {/* Layer 1: Ingestion */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>1. Ingestão RTSP</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 font-semibold">
                    Go2RTC / PyAV C-Bindings
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    • WS-Discovery ONVIF<br />
                    • Separação Main/Sub-stream<br />
                    • Decodificação NVDEC/VA-API<br />
                    • Frame Skipping (8 FPS)
                  </p>
                </div>

                {/* Layer 2: Ring Buffer / Shared Memory */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>2. Shared Memory Ring</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 font-semibold">
                    POSIX /dev/shm (Zero-Copy)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    • Raw RGB24 frames no RAM disk<br />
                    • Zero serialização Pickle<br />
                    • Lockless Circular Buffer<br />
                    • 1 buffer por stream
                  </p>
                </div>

                {/* Layer 3: AI Inference Workers */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    <span>3. Pipeline de IA</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 font-semibold">
                    TensorRT + Multi-Model
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    • YOLOv8/11 (Objetos/Veículos)<br />
                    • ByteTrack (Rastreio MOT)<br />
                    • SCRFD + ArcFace (Faces)<br />
                    • FastALPR (Mercosul/Antigo)<br />
                    • Polígonos & Objeto Ausente
                  </p>
                </div>

                {/* Layer 4: IoT Rules & MQTT Broker */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-purple-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>4. Motor IoT & MQTT</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 font-semibold">
                    Mosquitto + Async Engine
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    • Avaliação em memória (&lt;10ms)<br />
                    • Sonoff LAN Mode (eWeLink)<br />
                    • Tuya Local API (TinyTuya)<br />
                    • Home Assistant WS / REST<br />
                    • Latência &lt;150ms real
                  </p>
                </div>

                {/* Layer 5: Backend & Clients */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-blue-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>5. Backend & WebRTC</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 font-semibold">
                    FastAPI + WebSockets + PWA
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    • REST API & Auth JWT<br />
                    • WebRTC ultra-low latency (&lt;200ms)<br />
                    • Push FCM com Snapshot<br />
                    • Canvas Vetorial para ROI
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Description of Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Módulo 1: Ingestão de Vídeo & Descoberta ONVIF
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Utiliza <strong>Go2RTC</strong> (Go) como gateway de ingestão ou <strong>PyAV</strong> (FFmpeg C-bindings). O serviço escuta o multicast <code>239.255.255.250:3702</code> (WS-Discovery) para localizar câmeras Intelbras, Hikvision, Dahua e NVRs legados na rede. 
                  O decodificador consome apenas o <strong>Sub-stream</strong> da câmera (640x360 @ 5-10 FPS) com aceleração de hardware (NVDEC via CUDA ou VA-API no Intel QuickSync), descarregando 100% o processamento do Main-stream que vai direto para gravação sem descompactar.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Módulo 2: Pipeline de Visão Computacional (Worker Pool)
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Os workers de IA leem quadros diretamente de uma <strong>memória compartilhada (SharedMemory POSIX)</strong>. O YOLO realiza a detecção primária. As caixas de humanos são encaminhadas para o <strong>InsightFace (ArcFace 512-D)</strong> e atributos de vestimenta. Caixas de veículos são recortadas e encaminhadas para o detector e OCR de placas (Mercosul e antigo). 
                  O <strong>ByteTrack</strong> mantém a consistência temporal das trajetórias para cálculo preciso de invasão em polígonos e linhas direcionais (In/Out).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Módulo 3: Motor de Automações IoT & Latência Sub-500ms
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Para cumprir o requisito estrito de <strong>acionamento de relé em menos de 500ms</strong>, a arquitetura <strong>elimina requisições em nuvem</strong>. Os atuadores Sonoff são acionados via <strong>eWeLink LAN Mode</strong> (requisições HTTP REST diretas na porta 8081 local com chave AES-128 local) ou via <strong>firmware Tasmota/ESPHome com MQTT nativo</strong> (latência &lt; 80ms). O mesmo vale para dispositivos Tuya via <strong>TinyTuya (Local Key)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-rose-400" />
                  Módulo 4: Monitor de Objeto Ausente (State Tracker)
                </div>
                <p className="text-slate-400 leading-relaxed">
                  O usuário define um ROI fixo (Bounding Box) sobre um bem monitorado. O worker mantém um <strong>State Tracker contínuo</strong>. Quando a classe correspondente deixa de ser detectada na região ou a taxa de sobreposição (IoU) cai para 0, um temporizador regressivo de $X$ segundos é iniciado. Se a ausência persistir sem retorno antes do timeout, é publicado um evento crítico no broker MQTT e disparada a sirene e notificação push imediata.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: TECH STACK */}
      {activeSection === 'stack' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              2. Stack Tecnológica Recomendada & Justificativas de Performance
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cada componente foi selecionado visando a máxima eficiência de throughput por watt e taxa de inferência em hardware edge (como mini PCs Intel N100, estações Nvidia RTX ou Jetson Orin):
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                    <th className="py-2.5 px-3">Camada / Função</th>
                    <th className="py-2.5 px-3">Tecnologia Indicada</th>
                    <th className="py-2.5 px-3">Alternativas Avaliadas</th>
                    <th className="py-2.5 px-3">Justificativa de Performance & Decisão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">Ingestão RTSP / Streaming</td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">Go2RTC + PyAV</td>
                    <td className="py-3 px-3 font-mono text-slate-400">OpenCV VideoCapture puro, MediaMTX</td>
                    <td className="py-3 px-3 text-slate-300">
                      O OpenCV puro bloqueia threads em quedas de rede RTSP e acumula latência de buffer. O Go2RTC gerencia reconexões de câmeras em microsegundos, suporta WebRTC/MSE e repassa streams para o pipeline com zero buffer drift.
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">Detecção Geral (Objetos/Pessoas)</td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">Ultralytics YOLOv8n / YOLOv11n (TensorRT FP16)</td>
                    <td className="py-3 px-3 font-mono text-slate-400">YOLOv5, SSD-MobileNet, Faster-RCNN</td>
                    <td className="py-3 px-3 text-slate-300">
                      YOLOv8/11 em FP16 compilado com TensorRT executa em <strong>~6ms por frame em GPUs RTX / Jetson</strong>. O modelo nano é suficiente para 640x360 e possui precisão mAP50 superior a 50% em classes urbanas.
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">Rastreamento de Objetos (MOT)</td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">ByteTrack</td>
                    <td className="py-3 px-3 font-mono text-slate-400">DeepSORT, BoT-SORT, Norfair</td>
                    <td className="py-3 px-3 text-slate-300">
                      ByteTrack não necessita de extração de características profundas (Re-ID neural) para cada frame, usando apenas filtro de Kalman e associação por matriz de IoU. Custo de CPU desprezível (&lt;1ms por frame).
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">Reconhecimento Facial</td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">InsightFace (SCRFD + ArcFace 512-D)</td>
                    <td className="py-3 px-3 font-mono text-slate-400">face_recognition (dlib), OpenFace</td>
                    <td className="py-3 px-3 text-slate-300">
                      SCRFD é ultrarrápido para detecção de rostos em ângulos oblíquos de câmeras de segurança. ArcFace produz vetores normalizados de 512 dimensões com discriminação extrema e comparação por produto escalar (dot product).
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">Leitura de Placas (ALPR/ANPR)</td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">YOLOv8 Plate Crop + PaddleOCR / FastALPR</td>
                    <td className="py-3 px-3 font-mono text-slate-400">Tesseract OCR, EasyOCR</td>
                    <td className="py-3 px-3 text-slate-300">
                      PaddleOCR é otimizado com modelos text-detection e text-recognition leves, com suporte nativo a caracteres alfanuméricos com padrão Mercosul (ex: <code>BRA2E19</code>) e antigo (<code>ABC-1234</code>) com acurácia &gt; 97%.
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">Mensageria & Broker IoT</td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">Eclipse Mosquitto (MQTT v5.0)</td>
                    <td className="py-3 px-3 font-mono text-slate-400">RabbitMQ, Kafka, Redis PubSub</td>
                    <td className="py-3 px-3 text-slate-300">
                      Mosquitto em C consome menos de 8MB de memória RAM, entrega latências de <strong>sub-10ms em rede local</strong>, e possui suporte nativo em Sonoff Tasmota, ESPHome e Home Assistant.
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">Backend API & Engine de Regras</td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">FastAPI (Python 3.11+ assíncrono)</td>
                    <td className="py-3 px-3 font-mono text-slate-400">Django, Flask, Node.js Express</td>
                    <td className="py-3 px-3 text-slate-300">
                      FastAPI roda sobre uvloop e Starlette com altíssimo desempenho assíncrono. Permite manter o pipeline de IA e o servidor Web no mesmo ecossistema Python sem gargalos de GIL através de multiprocessamento.
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">Frontend Web & Desktop/Mobile</td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">React + Tailwind + WebRTC + PWA / Electron</td>
                    <td className="py-3 px-3 font-mono text-slate-400">Flutter Web, Qt C++</td>
                    <td className="py-3 px-3 text-slate-300">
                      Excelente suporte a WebRTC sem plugins, renderização acelerada por GPU no Canvas HTML5 para desenho de ROI sobre o vídeo, e facilidade de empacotamento em PWA para mobile e Electron para monitores de portaria.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: DATABASE SCHEMA DDL */}
      {activeSection === 'database' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  3. Modelagem de Banco de Dados Relacional (PostgreSQL / SQLite)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tabelas conceituais com chaves primárias, estrangeiras, índices de alta performance e tipos de dados estruturados para o ecossistema.
                </p>
              </div>

              <button
                onClick={() => handleCopy(SQL_SCHEMA_DDL, 'sql')}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm font-mono"
              >
                {copiedCode === 'sql' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode === 'sql' ? 'Copiado para o Clipboard!' : 'Copiar DDL SQL Completo'}
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-[500px]">
              <pre className="text-slate-300 leading-relaxed">{SQL_SCHEMA_DDL}</pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: PYTHON POC */}
      {activeSection === 'poc' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-emerald-400" />
                  4. Código de Prova de Conceito (PoC) Funcional em Python
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pipeline completo: Ingestão RTSP com buffer mínimo + Frame Skipping (8 FPS) + YOLOv8 + Cálculo Geométrico de Invasão em Polígono + Publicação de Evento MQTT em formato JSON estruturado.
                </p>
              </div>

              <button
                onClick={() => handleCopy(PYTHON_POC_CODE, 'poc')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm font-mono"
              >
                {copiedCode === 'poc' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode === 'poc' ? 'Código Copiado!' : 'Copiar Script Python (.py)'}
              </button>
            </div>

            {/* Quick execution guide */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center justify-between flex-wrap gap-2">
              <span className="text-emerald-400 font-bold">Comando para Instalação de Dependências:</span>
              <code className="bg-slate-900 px-3 py-1 rounded border border-slate-800 text-cyan-300">
                pip install ultralytics opencv-python paho-mqtt shapely numpy
              </code>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-[540px]">
              <pre className="text-slate-300 leading-relaxed">{PYTHON_POC_CODE}</pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: PERFORMANCE OPTIMIZATION */}
      {activeSection === 'optimization' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              5. Estratégia de Otimização de Performance para 4 a 8 Streams RTSP Simultâneos
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Decodificar e processar 8 streams de vídeo convencionais em 1080p @ 30 FPS resulta em 240 frames por segundo, o que satura até placas de vídeo profissionais. A estratégia de engenharia abaixo reduz a carga computacional em <strong>mais de 88%</strong> sem perder precisão analítica:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Strategy 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  1. Estratégia Dual-Stream (Ingestão Assimétrica)
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Quase todas as câmeras IP possuem 2 canais RTSP. Configuramos o sistema para:
                  <br />• <strong>Sub-stream (640x360 @ 8 FPS):</strong> decodificado e encaminhado para o pool de inferência de IA. A resolução 640x360 se adapta perfeitamente ao tamanho de entrada da rede neural (640x640 com letterbox).
                  <br />• <strong>Main-stream (1080p ou 4K @ 30 FPS):</strong> passa direto em modo <i>passthrough</i> para gravação H.264/H.265 em disco (sem transcodificação) e é entregue via WebRTC sob demanda quando o usuário abre a câmera em tela cheia.
                </p>
              </div>

              {/* Strategy 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  2. Decodificação Acelerada por Hardware (NVDEC / VA-API)
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Decodificar vídeo H.264/H.265 em CPU consome até 15% de um núcleo por câmera.
                  Utilizamos decodificadores dedicados em silício:
                  <br />• <strong>Nvidia GPUs:</strong> NVDEC com PyAV ou FFmpeg HWAccel (<code>-hwaccel cuda -c:v h264_cuvid</code>).
                  <br />• <strong>Intel CPUs (ex: N100 / i5 / Xeon):</strong> Intel QuickSync via VA-API (<code>-hwaccel vaapi -hwaccel_output_format vaapi</code>).
                  Isso mantém o uso de CPU abaixo de 10% mesmo com 8 streams rodando simultaneamente.
                </p>
              </div>

              {/* Strategy 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  3. Dynamic Batching de Inferência no TensorRT
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Em vez de executar inferências individuais (1 frame de cada vez), os frames das 8 câmeras que chegam na mesma janela de tempo são agrupados em <strong>Batch Dinâmico (Batch Size = 4 ou 8)</strong> no TensorRT. 
                  O custo de overhead de chamada de GPU (Kernel Launch) é amortizado, elevando o throughput de 45 FPS para mais de 160 FPS na mesma placa de vídeo.
                </p>
              </div>

              {/* Strategy 4 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-purple-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  4. Motion Gating Prévio (Gatilho de Movimento Leve)
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Câmeras em cenas estáticas (ex: quintal de madrugada, almoxarifado fechado) não precisam rodar modelos pesados de rede neural em todos os quadros. 
                  Um filtro ultraleve de subtração de fundo (OpenCV MOG2 ou diferença de frames em resolução reduzida 160x90) verifica se há pixels alterados significativos. Se a cena estiver estática, a inferência YOLO é suspensa naquele frame, economizando até 70% de energia e temperatura na GPU.
                </p>
              </div>
            </div>

            {/* Hardware Sizing Table */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="font-bold text-white font-mono">
                Tabela de Dimensionamento de Hardware Recomendado:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-emerald-400 font-bold">Cenário 1: 4 Câmeras</div>
                  <div className="text-slate-300 mt-1">
                    • Mini PC Intel Core i3 / N100 (16GB RAM)<br />
                    • GPU Integrada Intel UHD (OpenVINO)<br />
                    • VRAM/RAM IA: ~2.5 GB<br />
                    • Latência média: ~35ms por câmera
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-cyan-400 font-bold">Cenário 2: 8 Câmeras</div>
                  <div className="text-slate-300 mt-1">
                    • Workstation Intel i5 / Ryzen 5 (32GB RAM)<br />
                    • Nvidia RTX 3060 12GB ou RTX 4060 (TensorRT)<br />
                    • VRAM alocada: ~4.2 GB<br />
                    • Latência média: ~15ms por câmera
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-purple-400 font-bold">Cenário 3: 16 Câmeras (Industrial)</div>
                  <div className="text-slate-300 mt-1">
                    • Servidor 1U / Nvidia Jetson AGX Orin 64GB<br />
                    • Nvidia RTX 4080 / RTX A4000 (Batch = 8)<br />
                    • VRAM alocada: ~7.8 GB<br />
                    • Latência média: ~12ms com ALPR + Face
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
