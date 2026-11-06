<div align="center">

  <img src="public/assets/aistudio/image_e2be204d.png" alt="ROG-TECH Logo" width="220" />

  # ROG-TECH COMMAND CENTER
  ### Plataforma Integrada de Inteligência CFTV, Visão Computacional & Orquestração IoT

  [![Versão](https://img.shields.io/badge/versão-2.4.0-00E5FF.svg?style=for-the-badge&logo=shield)](https://github.com)
  [![Windows](https://img.shields.io/badge/Windows-.EXE%20Standalone-0078D6.svg?style=for-the-badge&logo=windows)](https://github.com)
  [![ONVIF](https://img.shields.io/badge/ONVIF-Profile%20S%20%7C%20T-10B981.svg?style=for-the-badge)](https://github.com)
  [![Multi-Tenant](https://img.shields.io/badge/Multi--Tenant-PostgreSQL%20RLS-336791.svg?style=for-the-badge&logo=postgresql)](https://github.com)
  [![Licença](https://img.shields.io/badge/Licen%C3%A7a-Propriet%C3%A1ria%20ROG--TECH-F59E0B.svg?style=for-the-badge)](https://github.com)

  <p align="center">
    <strong>Transforme câmeras IP e NVRs comuns (Intelbras, Hikvision, Dahua) em uma central autônoma de segurança com IA em tempo real e automação IoT residencial/predial.</strong>
  </p>

  <p align="center">
    <a href="https://ais-pre-a6jju4nyfxintuddyz5iu5-551992737061.us-east1.run.app"><strong>🌐 Acessar Sistema Online</strong></a> •
    <a href="#-instalação-no-windows-exe-ou-bat"><strong>💻 Baixar para Windows</strong></a> •
    <a href="#-isolamento-de-clientes-multi-tenant--rls"><strong>🏢 Modelo Multi-Tenant</strong></a> •
    <a href="#-recursos-principais"><strong>⚡ Recursos</strong></a>
  </p>

</div>

---

## 📸 Visão de Comando Unificada

<div align="center">
  <img src="public/assets/aistudio/Gemini_Generated_Image_gjehrngjehrngjeh_79d62378.jfif" alt="ROG-TECH Command Center Screenshot" width="850" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 229, 255, 0.2);" />
</div>

---

## ⚡ Recursos Principais

### 1. 👁️ Visão Computacional em Tempo Real (Edge AI)
* **Reconhecimento Facial:** Comparação biométrica instantânea com galeria de pessoas autorizadas e blacklist.
* **Leitura de Placas (ALPR/ANPR):** Detecção de veículos e placas padrão Mercosul e antigo com acionamento automático de relés.
* **Cercas e Linhas Virtuais:** Zonas poligonais com detecção de intrusão direcional (In / Out / Bidirecional).
* **Monitoramento de Objeto Ausente:** Alerta imediato se um veículo ou objeto estático for removido da cena por mais de $X$ segundos.
* **Decodificação com Frame Skipping:** Análise de 8 a 15 FPS para inteligência artificial sem sobrecarregar a CPU.

### 2. 🖧 Gerenciamento de Câmeras & NVRs
* **Scanner ONVIF WS-Discovery:** Varredura automática na rede local (UDP 3702) detectando câmeras Intelbras, Hikvision e Dahua.
* **Gerador Automático de RTSP:** Compatibilidade nativa com URLs oficiais de Main-stream e Sub-stream.
* **Importador Multi-Canal:** Importação instantânea de gravadores NVRs de 4, 8, 16 ou 32 canais.
* **Teste de Ping TCP:** Medição de latência da rota de rede (porta 554/80/37777) em tempo real.

### 3. 🏢 Arquitetura Multi-Tenant com RLS (Isolamento por Cliente)
* Projetado para **empresas de monitoramento e prestadores de serviços de segurança**.
* Cada cliente (condomínio, galpão, residência) possui um **`tenant_id` isolado**.
* O **Administrador Master (Renato Olivier)** possui visão global de todas as câmeras.
* Os clientes finais **apenas acessam suas próprias câmeras autorizadas**, garantido via políticas **PostgreSQL Row Level Security (RLS)** a nível de kernel do banco de dados.

### 4. ⚡ Orquestração & Automação IoT (LAN & MQTT)
* **Comunicação Ultrarrápida (<500ms):** Disparo de eventos via Broker MQTT local (porta 1883) e Webhooks.
* **Integração com Relés:** Acionamento de portões Sonoff (eWeLink LAN), iluminação Tuya Local e sirenes de alarme.
* **Regras Customizáveis:** Ex: *"SE Câmera Garagem detectar Placa Autorizada -> ENTÃO Abrir Portão Sonoff em menos de 400ms"*.

---

## 💻 Instalação no Windows (.EXE ou .BAT)

### Opção 1: Executável Autônomo (.EXE Standalone)
Não precisa de Node.js instalado! O instalador já embute todo o sistema:
1. Acesse a aba **[Releases / Lançamentos](https://github.com)** na lateral deste repositório.
2. Baixe o instalador **`ROG-TECH-Command-Center-Setup.exe`**.
3. Dê dois cliques para instalar. O atalho com o ícone oficial da ROG-TECH será criado na sua Área de Trabalho e no Menu Iniciar.

### Opção 2: Script Automático (`iniciar_windows_automatico.bat`)
Se você clonou o código e não tem o Node.js:
1. Dê 2 cliques no arquivo **`iniciar_windows_automatico.bat`**.
2. O script detecta automaticamente se falta o Node.js e instala a versão oficial LTS silenciosamente via `winget`.
3. O servidor inicia e abre automaticamente em `http://localhost:3000`.

### Opção 3: Instalação via PWA (Em 5 segundos)
1. Abra o sistema no Chrome ou Edge: `https://ais-pre-a6jju4nyfxintuddyz5iu5-551992737061.us-east1.run.app`
2. Clique no ícone **"Instalar ROG-TECH"** na barra de endereços do navegador.
3. Pronto! O Windows cria o executável nativo na sua Área de Trabalho sem precisar instalar nada.

---

## 🐧 Instalação no Linux / Docker / Raspberry Pi

Para rodar 24/7 em um servidor local com acesso direto à rede de câmeras:

```bash
# 1. Clonar o repositório
git clone https://github.com/renattoolivier/ROG-TECH.git
cd ROG-TECH

# 2. Executar via Docker Compose com network_mode: host (obrigatório para ONVIF UDP 3702)
docker compose up -d
```

Ou execute diretamente via Node.js:
```bash
npm install
npm run dev
```

---

## 📱 Acesso no Celular (Android & iOS)

1. Conecte o smartphone na mesma rede Wi-Fi do computador servidor.
2. Abra o navegador do celular e digite: `http://[IP_DO_SEU_PC]:3000`
3. Toque em **"Adicionar à Tela de Início"** / **"Instalar Aplicativo"**.
4. O app passa a funcionar em tela cheia com ícone ROG-TECH e botões rápidos de controle IoT.

---

## 🔒 Estrutura do Banco de Dados (Multi-Tenant RLS)

```sql
-- Habilita Row Level Security nas tabelas de dispositivos
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

-- Política: Clientes só leem suas câmeras; Super Admin lê tudo
CREATE POLICY tenant_isolation_policy ON cameras
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );
```

---

<div align="center">
  <p>Desenvolvido para <strong>ROG-TECH Central de Inteligência</strong> • Versão 2.4.0</p>
  <p>© 2026 ROG-TECH. Todos os direitos reservados.</p>
</div>
