# Diagrama do Circuito — Sistema de Controle de Acesso

## Esquema de Conexões (ASCII)

```
                    ╔══════════════════════════════════════════════╗
                    ║           ESP32 DevKit V1                    ║
                    ╠══════════════════════════════════════════════╣
  VCC (3.3V) ◄──── ╢ 3.3V                              5V        ╟──── VCC HC-SR04
       GND   ◄──── ╢ GND                               GND       ╟──── GND (barramento)
                   ╢                                              ║
                   ╢ GPIO 5  ─────────────────────────────────► TRIG (HC-SR04)
                   ╢ GPIO 34 ◄──────── [Divisor de tensão] ◄─── ECHO (HC-SR04)
                   ╢                                              ║
                   ╢ GPIO 21 ─────────────────────────────────► SDA/SS (MFRC522)
                   ╢ GPIO 18 ─────────────────────────────────► SCK    (MFRC522)
                   ╢ GPIO 23 ─────────────────────────────────► MOSI   (MFRC522)
                   ╢ GPIO 19 ◄─────────────────────────────── MISO   (MFRC522)
                   ╢ GPIO 22 ─────────────────────────────────► RST    (MFRC522)
                   ╢                                              ║
                   ╢ GPIO 26 ──── [220 Ω] ──── [LED Verde ▶|] ──── GND
                   ╢ GPIO 27 ──── [220 Ω] ──── [LED Verm. ▶|] ─── GND
                   ╢                                              ║
                   ╢ GPIO 25 ──── [BUZZER (+)] ── [BUZZER (-)] ── GND
                   ╢                                              ║
                   ╢ GPIO 4  ──── [BOTÃO] ───────────────────── GND
                    ╚══════════════════════════════════════════════╝
```

---

## Detalhamento de cada componente

### HC-SR04 — Sensor de Distância Ultrassônico

```
HC-SR04
┌─────────────────────┐
│  VCC  ──── 5V (ESP32 pino 5V)
│  TRIG ──── GPIO 5
│  ECHO ──── [Divisor de tensão] ──── GPIO 34
│  GND  ──── GND
└─────────────────────┘

Divisor de tensão no pino ECHO (necessário pois HC-SR04
opera em 5V mas GPIO do ESP32 suporta apenas 3.3V):

ECHO (5V) ─── [R1: 1 kΩ] ─── ●─── GPIO 34
                               │
                            [R2: 2 kΩ]
                               │
                              GND

Tensão resultante: 5V × 2000/(1000+2000) ≈ 3.33V ✓
```

> **Alternativa:** use o módulo HC-SR04P, que opera em 3.3V
> e pode ser conectado diretamente sem divisor de tensão.

---

### MFRC522 — Leitor RFID (SPI)

```
MFRC522           ESP32
┌──────────┐
│ VCC 3.3V ──── 3.3V     ⚠ NUNCA conecte ao 5V!
│ GND      ──── GND
│ RST      ──── GPIO 22
│ SDA (SS) ──── GPIO 21  (Chip Select)
│ SCK      ──── GPIO 18  (SPI Clock — VSPI)
│ MOSI     ──── GPIO 23  (SPI MOSI  — VSPI)
│ MISO     ──── GPIO 19  (SPI MISO  — VSPI)
│ IRQ      ──── (não conectado)
└──────────┘
```

---

### LEDs com resistores de limitação de corrente

```
GPIO 26 ─── [R: 220 Ω] ─── Ânodo (+) ─── [LED VERDE] ─── Cátodo (-) ─── GND
GPIO 27 ─── [R: 220 Ω] ─── Ânodo (+) ─── [LED VERM.] ─── Cátodo (-) ─── GND

Corrente: I = (3.3V - 2.0V) / 220 Ω ≈ 6 mA  (seguro para o ESP32)
```

---

### Buzzer Passivo

```
GPIO 25 ─── (+) BUZZER (─) ─── GND

O código usa tone(BUZZER_PIN, 1000, duração) que gera
onda quadrada PWM — funciona apenas com buzzer PASSIVO.
Se usar buzzer ATIVO, substitua tone() por digitalWrite().
```

---

### Botão (Reset de Sessão)

```
GPIO 4 ─── [BOTÃO] ─── GND

O GPIO 4 é configurado como INPUT_PULLUP internamente.
Lê HIGH em repouso e LOW quando pressionado (ativo baixo).
```

---

## Mapa visual de pinos (ESP32 DevKit)

```
                      ┌──────────────────────────────┐
              EN ─────┤ EN              GND ├───── GND
           GPIO36 ────┤ VP              VIN ├───── 5V IN
           GPIO39 ────┤ VN           GPIO23 ├───── RFID MOSI
           GPIO34 ────┤ GPIO34       GPIO22 ├───── RFID RST
           GPIO35 ────┤ GPIO35        TX0   ├─────
           GPIO32 ────┤ GPIO32        RX0   ├─────
           GPIO33 ────┤ GPIO33       GPIO21 ├───── RFID SDA/SS
           GPIO25 ────┤ GPIO25 (BUZ) GPIO19 ├───── RFID MISO
           GPIO26 ────┤ GPIO26 (GRN) GPIO18 ├───── RFID SCK
           GPIO27 ────┤ GPIO27 (RED)  GND   ├─────
           GPIO14 ────┤ GPIO14        GND   ├─────
           GPIO12 ────┤ GPIO12        GND   ├─────
              GND ────┤ GND          GPIO15 ├─────
           GPIO13 ────┤ GPIO13        GPIO2 ├─────
           GPIO9  ────┤ GPIO9         GPIO0 ├─────
           GPIO10 ────┤ GPIO10        GPIO4 ├───── BOTÃO
           GPIO11 ────┤ GPIO11        GPIO16├─────
            GPIO6 ────┤ GPIO6         GPIO17├─────
            GPIO7 ────┤ GPIO7         GPIO5 ├───── HC-SR04 TRIG
            GPIO8 ────┤ GPIO8          3.3V ├───── RFID VCC
             3.3V ────┤ 3.3V           GND ├─────
                      └──────────────────────────────┘

Legenda: BUZ = Buzzer | GRN = LED Verde | RED = LED Vermelho
```

---

## Lista de Materiais (BOM)

| Componente             | Qtd | Especificação                        |
|------------------------|-----|--------------------------------------|
| ESP32 DevKit V1        |  1  | 38 pinos (ou 30 pinos)               |
| MFRC522 RFID           |  1  | Módulo + 1 cartão + 1 chaveiro       |
| HC-SR04 (ou HC-SR04P)  |  1  | Alcance: 2 cm ~ 400 cm               |
| LED Verde 5mm          |  1  | 2.0–2.5 V, 20 mA max                 |
| LED Vermelho 5mm       |  1  | 1.8–2.2 V, 20 mA max                 |
| Resistor 220 Ω         |  2  | ¼ W — limitação de corrente dos LEDs |
| Resistor 1 kΩ          |  1  | ¼ W — divisor de tensão (ECHO)       |
| Resistor 2 kΩ          |  1  | ¼ W — divisor de tensão (ECHO)       |
| Buzzer Passivo         |  1  | 3–5 V, compatível com PWM/tone()     |
| Botão push-button      |  1  | 4 terminais (padrão para protoboard) |
| Protoboard 830 pontos  |  1  | —                                    |
| Jumpers M-M e M-F      | ~30 | Para conexão dos módulos             |
| Cabo USB para ESP32    |  1  | USB-A para Micro-USB (ou USB-C)      |

---

## Observações importantes

1. **Alimentação do MFRC522:** o módulo é **estritamente 3.3 V**. Aplicar 5 V pode danificá-lo permanentemente.

2. **Divisor de tensão no ECHO:** essencial se o HC-SR04 operar em 5 V. O GPIO 34 do ESP32 suporta no máximo 3.6 V.

3. **GPIO 34 é input-only:** não possui resistor de pull-up interno — use apenas como entrada.

4. **SPI compartilhado:** o MFRC522 usa o barramento VSPI (pinos 18/19/23). Não conecte outros dispositivos SPI nesses pinos sem implementar seleção de chip.

5. **Buzzer passivo vs. ativo:** o código usa `tone()` que gera sinal PWM — funciona com buzzer **passivo**. Buzzers ativos emitem som apenas com `digitalWrite(HIGH)`.
