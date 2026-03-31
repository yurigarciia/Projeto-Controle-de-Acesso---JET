#pragma once

// ============================================================
// config.h — Configurações do Sistema de Controle de Acesso
// EDITE AQUI antes de gravar no ESP32
// ============================================================

// ── Rede Wi-Fi ───────────────────────────────────────────────
#define WIFI_SSID       "AMF"
#define WIFI_PASSWORD   "amf@2025"

// ── Backend ──────────────────────────────────────────────────
// Substitua pelo IP da máquina com o Node.js na sua rede local
// (use ipconfig no Windows / ifconfig no Linux para descobrir)
#define SERVER_URL      "http://172.16.2.129:3001/api/access"
#define DEVICE_ID       "ESP32-GARCIA"  // Identificador único do dispositivo (pode ser qualquer string)

// ── Pinos — HC-SR04 (Sensor de Distância) ───────────────────
#define TRIG_PIN        5    // OUTPUT — pulso de trigger
#define ECHO_PIN        34   // INPUT  — leitura do eco (GPIO34 é input-only, 3.3V)

// ── Pinos — RFID MFRC522 (SPI) ──────────────────────────────
// SCK=18, MOSI=23, MISO=19  (pinos SPI padrão do ESP32 — não altere)
#define RFID_SS_PIN     21   // SDA / CS do MFRC522
#define RFID_RST_PIN    22   // RST do MFRC522

// ── Pinos — Atuadores ────────────────────────────────────────
#define LED_GREEN       26   // LED Verde  → acesso liberado
#define LED_RED         27   // LED Vermelho → acesso negado
#define BUZZER_PIN      25   // Buzzer passivo (usa tone())
#define BTN_PIN          4   // Botão (INPUT_PULLUP, ativo em LOW)

// ── Parâmetros de comportamento ──────────────────────────────
#define DISTANCE_THRESHOLD_CM  30     // cm — ativa leitura RFID ao detectar presença
#define RFID_TIMEOUT_MS        8000   // ms — tempo máximo aguardando a tag
#define COOLDOWN_MS            3000   // ms — tempo exibindo resultado após leitura
#define DEBOUNCE_MS            50     // ms — debounce do botão
#define WIFI_RETRY_COUNT       20     // tentativas antes de declarar falha WiFi
#define HTTP_TIMEOUT_MS        5000   // ms — timeout das requisições HTTP
