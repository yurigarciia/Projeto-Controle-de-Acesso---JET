# Sistema de Controle de Acesso Inteligente

## O que é esse projeto?

Imagine a porta de um laboratório que só abre para quem tem autorização. Sem chave, sem senha digitada — basta aproximar um cartão ou chaveiro especial (chamado de **tag RFID**) do leitor, e o sistema decide automaticamente se libera ou nega o acesso.

Esse projeto é exatamente isso: um **sistema de controle de acesso inteligente**, conectado à internet, com painel de monitoramento em tempo real e registro de tudo que acontece.

---

## Como funciona?

O sistema segue um fluxo simples e automático:

```
1. Sensor detecta que alguém se aproximou da porta
        ↓
2. LED amarelo pisca: "pode apresentar o cartão"
        ↓
3. Pessoa aproxima a tag RFID do leitor
        ↓
4. ESP32 envia o ID da tag para o servidor
        ↓
5. Servidor consulta o banco de dados:
   → Tag autorizada?  LED verde + 1 beep  ✓
   → Tag negada?      LED vermelho + 3 beeps  ✗
        ↓
6. Evento registrado no banco e exibido no painel web
```

---

## Componentes utilizados

| Componente | Função no projeto |
|---|---|
| **ESP32** | Cérebro do sistema — conecta tudo e se comunica pela rede |
| **RFID-RC522** | Lê o identificador único de cartões e chaveiros |
| **HC-SR04** | Sensor ultrassônico que detecta quando alguém se aproxima |
| **LED Verde** | Sinaliza acesso liberado |
| **LED Amarelo** | Sinaliza que o sistema está aguardando o cartão |
| **LED Vermelho** | Sinaliza acesso negado |
| **Buzzer** | Sinalização sonora (1 beep = liberado, 3 beeps = negado) |
| **Botão** | Abertura manual de emergência |

---

## Arquitetura do sistema

O projeto é dividido em três camadas que se comunicam:

```
┌─────────────────────────────────────────────────────────┐
│                  CAMADA EMBARCADA                        │
│                                                          │
│   HC-SR04 → ESP32 → RFID-RC522                          │
│              ↕ Wi-Fi                                     │
├─────────────────────────────────────────────────────────┤
│                  CAMADA DE BACKEND                       │
│                                                          │
│   Node.js + Express                                      │
│   • Recebe o ID da tag via HTTP                          │
│   • Consulta as regras de autorização                    │
│   • Salva o evento no banco de dados                     │
│   • Responde ao ESP32: liberado ou negado                │
│              ↕                                           │
├─────────────────────────────────────────────────────────┤
│                  BANCO DE DADOS                          │
│                                                          │
│   MongoDB                                                │
│   • Armazena quem tentou acessar e quando               │
│   • Guarda a lista de tags autorizadas                   │
│              ↕                                           │
├─────────────────────────────────────────────────────────┤
│                  CAMADA DE FRONTEND                      │
│                                                          │
│   React (interface web)                                  │
│   • Exibe histórico de acessos em tempo real             │
│   • Mostra contadores: total, liberados e negados        │
│   • Permite cadastrar e remover tags autorizadas         │
└─────────────────────────────────────────────────────────┘
```

---

## Diagrama de conexões do circuito

```
                 ┌───────────────────────────────────────┐
                 │            ESP32 DevKit               │
                 │                                       │
  HC-SR04 TRIG ──┤ GPIO 5              GPIO 21 ├── RFID SDA
  HC-SR04 ECHO ──┤ GPIO 34 *           GPIO 22 ├── RFID RST
                 │                     GPIO 18 ├── RFID SCK
  LED AMARELO ───┤ GPIO 14             GPIO 23 ├── RFID MOSI
  LED VERDE ─────┤ GPIO 26             GPIO 19 ├── RFID MISO
  LED VERMELHO ──┤ GPIO 27                     │
  BUZZER ────────┤ GPIO 25             3.3V    ├── RFID VCC
  BOTÃO ─────────┤ GPIO 4              5V      ├── HC-SR04 VCC
                 │             GND     GND     ├── GND (geral)
                 └───────────────────────────────────────┘

  * GPIO 34: usar divisor de tensão (resistores 1kΩ + 2kΩ)
    pois o HC-SR04 em 5V envia sinal de 5V no ECHO,
    mas o ESP32 suporta no máximo 3.3V nesse pino.

  Todos os LEDs usam resistor de 220Ω em série.
  O botão conecta direto ao GND (pull-up interno no ESP32).
```

---

## Tecnologias e linguagens usadas

| Tecnologia | Onde é usada | Por quê |
|---|---|---|
| **C++ (Arduino)** | ESP32 | Linguagem nativa para programar microcontroladores |
| **Wi-Fi / HTTP** | ESP32 ↔ Backend | Comunicação sem fio pela rede local |
| **Node.js** | Backend (servidor) | Linguagem JavaScript no servidor, rápida e simples |
| **Express** | Backend | Framework para criar as rotas da API |
| **MongoDB** | Banco de dados | Banco não-relacional, flexível para dados IoT |
| **React** | Frontend (interface web) | Biblioteca para construir interfaces interativas |
| **Vite** | Frontend | Ferramenta moderna para rodar e compilar o React |

---

## O que é RFID?

**RFID** significa *Radio-Frequency Identification* — identificação por radiofrequência.

Funciona assim: a tag (cartão ou chaveiro) possui um microchip minúsculo que armazena um número único. Quando você aproxima a tag do leitor, ele emite um campo eletromagnético que "acorda" o chip e lê esse número — tudo sem contato físico e em menos de um segundo.

O mesmo princípio é usado em:
- Cartões de transporte público (ônibus, metrô)
- Catracas de academias e empresas
- Passaportes modernos
- Etiquetas antifurto em lojas

---

## O que o painel web mostra?

A interface React exibe em tempo real:

- **Contador de acessos** — total, liberados e negados
- **Tabela de histórico** — quem acessou, quando, com qual tag e qual foi o resultado
- **Status do sistema** — se o backend está online ou offline
- **Gerenciador de tags** — tela para cadastrar novos cartões e usuários autorizados, ativar ou desativar permissões

A interface se atualiza automaticamente a cada **5 segundos** sem precisar recarregar a página.

---

## Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org) v18 ou superior
- [MongoDB](https://www.mongodb.com) instalado localmente (ou conta no MongoDB Atlas)
- [Arduino IDE](https://www.arduino.cc/en/software) com suporte ao ESP32
- Bibliotecas Arduino: `MFRC522` e `ArduinoJson` (instalar pelo Library Manager)

### 1. Backend

```bash
cd backend
cp .env.example .env      # configure MONGODB_URI se necessário
npm install
npm run seed              # cadastra tags de exemplo no banco
npm run dev               # inicia o servidor na porta 3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev               # abre em http://localhost:5173
```

### 3. ESP32

1. Abra `esp32/access_control/access_control.ino` na Arduino IDE
2. No topo do arquivo, edite:
   - `WIFI_SSID` e `WIFI_PASSWORD` — sua rede Wi-Fi 2.4 GHz
   - `SERVER_URL` — IP do computador onde o backend está rodando
3. Selecione a placa **ESP32 Dev Module** e a porta correta
4. Clique em **Upload**

> **Dica:** use `ipconfig` (Windows) ou `ifconfig` (Linux/Mac) para descobrir o IP do seu computador na rede.

---

## Estrutura de pastas

```
aula-02/
├── backend/                  # Servidor Node.js
│   ├── server.js             # Ponto de entrada
│   ├── models/               # Estrutura dos dados (MongoDB)
│   │   ├── AccessLog.js      # Registro de cada tentativa de acesso
│   │   └── Tag.js            # Tags RFID autorizadas
│   ├── routes/               # Rotas da API
│   │   ├── access.js         # POST /api/access  (ESP32 → servidor)
│   │   ├── logs.js           # GET  /api/logs    (histórico)
│   │   └── tags.js           # CRUD /api/tags    (gerenciar tags)
│   └── seed.js               # Script para popular o banco com dados de teste
│
├── frontend/                 # Interface web React
│   └── src/
│       ├── App.jsx           # Componente principal
│       └── components/
│           ├── AccessTable.jsx   # Tabela de histórico
│           ├── StatsPanel.jsx    # Contadores
│           ├── TagManager.jsx    # Gerenciador de tags
│           └── SystemStatus.jsx  # Indicador de status
│
├── esp32/
│   └── access_control/
│       └── access_control.ino   # Código completo do ESP32
│
└── circuit/
    └── diagrama_circuito.md     # Diagrama de conexões e lista de materiais
```

---

## Equipe

Yuri Garcia Baptista - Estudante de SI

Laboratório de Inovação 1 · 2025
