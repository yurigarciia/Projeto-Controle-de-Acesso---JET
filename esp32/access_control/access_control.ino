/*
 * ============================================================
 *  SISTEMA DE CONTROLE DE ACESSO — ESP32
 *  Laboratório de Inovação
 * ============================================================
 *
 *  Hardware necessário:
 *    - ESP32 DevKit
 *    - MFRC522 (RFID, interface SPI)
 *    - HC-SR04 (sensor de distância ultrassônico)
 *    - LED Verde e LED Vermelho (com resistores de 220 Ω)
 *    - Buzzer passivo
 *    - Botão (pull-up interno)
 *
 *  Bibliotecas obrigatórias (instale pelo Library Manager):
 *    - MFRC522  by GithubCommunity
 *    - ArduinoJson  by Benoit Blanchon
 *
 *  Fluxo de estados:
 *    IDLE  →  AGUARDANDO_RFID  →  ENVIANDO  →  RESULTADO  →  IDLE
 *    (a qualquer momento o botão reseta para IDLE)
 *
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>

// ============================================================
//  CONFIGURAÇÕES — edite aqui antes de gravar
// ============================================================

// Wi-Fi
#define WIFI_SSID      "AMF"
#define WIFI_PASSWORD  "amf@2025"

// Backend (IP do PC com o Node.js rodando)
#define SERVER_URL     "http://172.16.2.129:3001/api/access"
#define DEVICE_ID      "ESP32-GARCIA"

// Pinos — HC-SR04
#define TRIG_PIN       5
#define ECHO_PIN       34

// Pinos — RFID MFRC522 (SPI)
#define RFID_SS_PIN    21
#define RFID_RST_PIN   22

// Pinos — Atuadores
#define LED_GREEN      26
#define LED_RED        27
#define LED_YELLOW     14
#define BUZZER_PIN     25
#define BTN_PIN        4

// Parâmetros
#define DISTANCE_THRESHOLD_CM  30
#define RFID_TIMEOUT_MS        8000
#define COOLDOWN_MS            3000
#define DEBOUNCE_MS            50
#define WIFI_RETRY_COUNT       20
#define HTTP_TIMEOUT_MS        5000

// ── Máquina de estados ───────────────────────────────────────
enum Estado {
  IDLE,            // Monitorando sensor de distância
  AGUARDANDO_RFID, // Presença detectada — aguarda aproximação da tag
  ENVIANDO,        // Requisição HTTP em andamento (estado síncrono)
  RESULTADO        // Exibindo LED + buzzer com o resultado
};

Estado estadoAtual    = IDLE;
unsigned long timerEstado = 0;

// ── Objetos globais ──────────────────────────────────────────
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);

bool   btnEstadoAnterior = HIGH;
unsigned long ultimoBotao = 0;

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(400);
  Serial.println(F("\n=== Sistema de Controle de Acesso v1.0 ==="));

  // Configura pinos dos atuadores e sensores
  pinMode(TRIG_PIN,  OUTPUT);
  pinMode(ECHO_PIN,  INPUT);
  pinMode(LED_GREEN,  OUTPUT);
  pinMode(LED_RED,    OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BTN_PIN,   INPUT_PULLUP);

  // Inicializa SPI com pinos explícitos (necessário no ESP32)
  SPI.begin(18, 19, 23, RFID_SS_PIN); // SCK, MISO, MOSI, SS
  rfid.PCD_Init();
  delay(100);
  rfid.PCD_SetAntennaGain(rfid.RxGain_max); // ganho máximo de antena

  // Diagnóstico: verifica se o MFRC522 está respondendo via SPI
  byte versao = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.printf("MFRC522 versão: 0x%02X\n", versao);
  if (versao == 0x00 || versao == 0xFF) {
    Serial.println(F("ERRO: MFRC522 nao responde! Verifique a fiacao SPI."));
  } else {
    Serial.println(F("MFRC522 OK."));
  }

  // Sinal visual de boot
  piscarAmbos(3);

  // Conecta ao WiFi
  conectarWiFi();

  Serial.println(F("Sistema pronto. Monitorando sensor de distância...\n"));
}

// ============================================================
//  LOOP PRINCIPAL
// ============================================================
void loop() {
  verificarBotao();

  switch (estadoAtual) {
    case IDLE:            loopIdle();           break;
    case AGUARDANDO_RFID: loopAguardandoRFID(); break;
    case RESULTADO:       loopResultado();      break;
    default: break; // ENVIANDO é síncrono
  }
}

// ============================================================
//  ESTADOS
// ============================================================

void loopIdle() {
  float dist = medirDistancia();

  if (dist > 0 && dist <= DISTANCE_THRESHOLD_CM) {
    Serial.printf("Presença detectada a %.1f cm — aguardando tag RFID...\n", dist);
    definirLED("amarelo"); // pisca amarelo = aguardando
    beep(1, 80);           // beep de ativação
    estadoAtual = AGUARDANDO_RFID;
    timerEstado = millis();
  }
}

void loopAguardandoRFID() {
  // Timeout: se nenhuma tag for apresentada, volta ao IDLE
  if (millis() - timerEstado > RFID_TIMEOUT_MS) {
    Serial.println(F("Timeout — nenhuma tag lida. Voltando ao IDLE."));
    definirLED("apagado");
    estadoAtual = IDLE;
    return;
  }

  // Pisca LED amarelo para indicar que está aguardando
  digitalWrite(LED_GREEN, (millis() / 350) % 2);
  digitalWrite(LED_RED,   LOW);

  // Verifica se há nova tag no campo do leitor
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial())   return;

  // Tag lida com sucesso!
  String tagID = obterIDRFID();
  Serial.print(F("Tag lida: "));
  Serial.println(tagID);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  definirLED("apagado");

  // Chama o backend de forma síncrona
  estadoAtual = ENVIANDO;
  enviarAcessoAoBackend(tagID);
  // Após retornar, estadoAtual já foi definido para RESULTADO
}

void loopResultado() {
  // Aguarda COOLDOWN_MS e então limpa LEDs e retorna ao IDLE
  if (millis() - timerEstado > COOLDOWN_MS) {
    definirLED("apagado");
    noTone(BUZZER_PIN);
    estadoAtual = IDLE;
    Serial.println(F("Pronto para nova leitura.\n"));
  }
}

// ============================================================
//  BOTÃO — Abertura manual
//  Pressionar libera o acesso diretamente, sem tag RFID,
//  e registra o evento no backend como "MANUAL"
// ============================================================
void verificarBotao() {
  bool btnAtual = digitalRead(BTN_PIN);

  // Borda de descida (HIGH→LOW) com debounce
  if (btnAtual == LOW && btnEstadoAnterior == HIGH) {
    if (millis() - ultimoBotao > DEBOUNCE_MS) {
      ultimoBotao = millis();
      Serial.println(F("[BOTAO] Abertura manual acionada."));
      registrarAberturaManual();
    }
  }

  btnEstadoAnterior = btnAtual;
}

void registrarAberturaManual() {
  // Feedback imediato enquanto envia ao backend
  definirLED("verde");
  beep(1, 400);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(HTTP_TIMEOUT_MS);

    StaticJsonDocument<256> doc;
    doc["rfid"]      = "MANUAL";
    doc["device"]    = DEVICE_ID;
    doc["eventType"] = "manual";

    String corpo;
    serializeJson(doc, corpo);
    http.POST(corpo);
    http.end();
  }

  timerEstado = millis();
  estadoAtual = RESULTADO;
}

// ============================================================
//  COMUNICAÇÃO COM O BACKEND
// ============================================================
void enviarAcessoAoBackend(const String& tagID) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("WiFi desconectado! Tentando reconectar..."));
    conectarWiFi();
    acessoNegado(); // falha segura: nega acesso se sem rede
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(HTTP_TIMEOUT_MS);

  // Monta o corpo JSON da requisição
  StaticJsonDocument<256> doc;
  doc["rfid"]             = tagID;
  doc["device"]           = DEVICE_ID;
  doc["distanceDetected"] = true;

  String corpo;
  serializeJson(doc, corpo);

  Serial.print(F("POST → "));
  Serial.println(corpo);

  int httpCode = http.POST(corpo);

  if (httpCode == 200) {
    String resposta = http.getString();
    Serial.print(F("Resposta: "));
    Serial.println(resposta);

    StaticJsonDocument<256> resp;
    DeserializationError err = deserializeJson(resp, resposta);

    if (!err) {
      bool        autorizado = resp["authorized"] | false;
      const char* mensagem   = resp["message"]    | "";

      Serial.println(mensagem);
      autorizado ? acessoLiberado() : acessoNegado();
    } else {
      Serial.println(F("Erro ao parsear JSON da resposta"));
      acessoNegado();
    }

  } else {
    Serial.printf("Erro HTTP: %d\n", httpCode);
    acessoNegado();
  }

  http.end();
}

// ============================================================
//  RESPOSTAS VISUAIS E SONORAS
// ============================================================

void acessoLiberado() {
  Serial.println(F(">>> ACESSO LIBERADO <<<"));
  definirLED("verde");
  beep(1, 400);            // 1 beep longo = liberado
  timerEstado = millis();
  estadoAtual = RESULTADO;
}

void acessoNegado() {
  Serial.println(F(">>> ACESSO NEGADO <<<"));
  definirLED("vermelho");
  beep(3, 150);            // 3 beeps curtos = negado
  timerEstado = millis();
  estadoAtual = RESULTADO;
}

void definirLED(const String& cor) {
  digitalWrite(LED_GREEN,  LOW);
  digitalWrite(LED_RED,    LOW);
  digitalWrite(LED_YELLOW, LOW);

  if      (cor == "verde")    digitalWrite(LED_GREEN,  HIGH);
  else if (cor == "vermelho") digitalWrite(LED_RED,    HIGH);
  else if (cor == "amarelo")  digitalWrite(LED_YELLOW, HIGH);
}

void beep(int vezes, int duracao) {
  for (int i = 0; i < vezes; i++) {
    tone(BUZZER_PIN, 1000, duracao);
    delay(duracao + 80);
  }
}

void piscarAmbos(int vezes) {
  for (int i = 0; i < vezes; i++) {
    definirLED("amarelo"); delay(150);
    definirLED("apagado"); delay(150);
  }
}

// ============================================================
//  SENSOR DE DISTÂNCIA HC-SR04
// ============================================================
float medirDistancia() {
  // Gera pulso de trigger de 10 µs
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Mede duração do eco (timeout ≈ 400 cm)
  long duracao = pulseIn(ECHO_PIN, HIGH, 23529UL);
  if (duracao == 0) return -1.0f; // sem eco / fora de alcance

  return (float)duracao * 0.0343f / 2.0f; // converte para cm
}

// ============================================================
//  RFID — Converte UID em String hexadecimal maiúscula
// ============================================================
String obterIDRFID() {
  String id = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) id += "0";
    id += String(rfid.uid.uidByte[i], HEX);
  }
  id.toUpperCase();
  return id;
}

// ============================================================
//  WIFI
// ============================================================
void conectarWiFi() {
  Serial.printf("Conectando ao WiFi: %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  for (int i = 0; i < WIFI_RETRY_COUNT && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi conectado! IP: %s\n", WiFi.localIP().toString().c_str());
    piscarAmbos(2);
  } else {
    Serial.println(F("\nFALHA ao conectar WiFi — verifique SSID e senha!"));
    definirLED("vermelho");
    while (true) {          // trava e sinaliza erro indefinidamente
      beep(2, 300);
      delay(2000);
    }
  }
}
