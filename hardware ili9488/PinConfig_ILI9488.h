/*
 * ═══════════════════════════════════════════════════════════════════════════
 *          LIFELINE RX - ILI9488 PARALLEL 8-BIT PIN CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ESP32 DevKit V1 → ILI9488 3.5" TFT (8-bit Parallel) + LoRa SX1278
 *
 * Your LCD uses 8080 parallel interface (RST, CS, RS, WR, RD + D0-D7)
 * ═══════════════════════════════════════════════════════════════════════════
 */

#ifndef PIN_CONFIG_ILI9488_H
#define PIN_CONFIG_ILI9488_H

// ═══════════════════════════════════════════════════════════════════════════
//                   ILI9488 TFT DISPLAY (8-BIT PARALLEL MODE)
// ═══════════════════════════════════════════════════════════════════════════
//
//   ESP32 Pin    │ LCD Pin     │ Description
//  ──────────────┼─────────────┼──────────────────────────────
//   GPIO 33      │ RST         │ Reset (active LOW)
//   GPIO 15      │ CS          │ Chip Select (active LOW)
//   GPIO 2       │ RS (DC)     │ Register Select (0=Cmd, 1=Data)
//   GPIO 4       │ WR          │ Write strobe (active LOW)
//   GPIO 32      │ RD          │ Read strobe (active LOW, or tie to 3.3V)
//   3.3V         │ VCC         │ Power supply
//   3.3V         │ LED/BL      │ Backlight
//   GND          │ GND         │ Ground
//
#define TFT_RST 33
#define TFT_CS 15
#define TFT_RS 2 // Also called DC (Data/Command)
#define TFT_WR 4
#define TFT_RD 32 // Can tie to 3.3V if not reading from LCD

// ═══════════════════════════════════════════════════════════════════════════
//                        8-BIT DATA BUS (D0-D7)
// ═══════════════════════════════════════════════════════════════════════════
//
//   ESP32 Pin    │ LCD Pin     │ Description
//  ──────────────┼─────────────┼──────────────────────────────
//   GPIO       │ D0          │ Data bit 0 (LSB)
//   GPIO
/      │ D1          │ Data bit 1
//   GPIO 26      │ D2          │ Data bit 2
//   GPIO 25      │ D3          │ Data bit 3
//   GPIO 17      │ D4          │ Data bit 4
//   GPIO 16      │ D5          │ Data bit 5
//   GPIO 27      │ D6          │ Data bit 6
//   GPIO 14      │ D7          │ Data bit 7 (MSB)
//
#define TFT_D0 12
#define TFT_D1 13
#define TFT_D2 26
#define TFT_D3 25
#define TFT_D4 17
#define TFT_D5 16
#define TFT_D6 27
#define TFT_D7 14

// ═══════════════════════════════════════════════════════════════════════════
//                    LORA SX1278 MODULE (SPI - 433 MHz)
// ═══════════════════════════════════════════════════════════════════════════
//
//   ESP32 Pin    │ SX1278 Pin  │ Description
//  ──────────────┼─────────────┼──────────────────────────────
//   GPIO 5       │ SCK         │ SPI Clock
//   GPIO 23      │ MOSI        │ SPI Data Out
//   GPIO 19      │ MISO        │ SPI Data In
//   GPIO 18      │ NSS(CS)     │ Chip Select
//   GPIO 21      │ RST         │ Reset
//   GPIO 22      │ DIO0        │ Interrupt
//   3.3V         │ VCC         │ Power (3.3V ONLY!)
//   GND          │ GND         │ Ground
//
#define LORA_SCK 5
#define LORA_MOSI 23
#define LORA_MISO 19
#define LORA_CS 18
#define LORA_RST 21
#define LORA_DIO0 22

// ═══════════════════════════════════════════════════════════════════════════
//                         LED INDICATORS & BUZZER
// ═══════════════════════════════════════════════════════════════════════════
//
#define LED_GREEN 34 // Note: GPIO34+ are input-only on ESP32
#define LED_RED 35   // Use external driver or different pins
#define BUZZER_PIN 0 // BOOT button pin (shared)

// Alternative LED pins if needed:
// #define LED_GREEN   2   // Built-in LED on some boards
// #define LED_RED     GPIO_NUM  // Choose available pin

// ═══════════════════════════════════════════════════════════════════════════
//                         WIFI PORTAL BUTTON
// ═══════════════════════════════════════════════════════════════════════════
#define WIFI_PORTAL_PIN 0 // BOOT button

// ═══════════════════════════════════════════════════════════════════════════
//                    TFT_eSPI USER_SETUP.H CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
//
// Copy to TFT_eSPI library's User_Setup.h:
//
// #define ILI9488_DRIVER
// #define TFT_PARALLEL_8_BIT
//
// #define TFT_RST  33
// #define TFT_CS   15
// #define TFT_DC   2     // RS pin
// #define TFT_WR   4
// #define TFT_RD   32
//
// #define TFT_D0   12
// #define TFT_D1   13
// #define TFT_D2   26
// #define TFT_D3   25
// #define TFT_D4   17
// #define TFT_D5   16
// #define TFT_D6   27
// #define TFT_D7   14
//
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
//                         WIRING DIAGRAM (ASCII)
// ═══════════════════════════════════════════════════════════════════════════
/*
                    ┌─────────────────────┐
                    │     ESP32 DevKit    │
                    │                     │
    LCD VCC/LED ────┤ 3.3V           GND  ├──── GND
                    │                     │
    LCD RST     ────┤ GPIO 33     GPIO 5  ├──── LoRa SCK
    LCD CS      ────┤ GPIO 15     GPIO 23 ├──── LoRa MOSI
    LCD RS(DC)  ────┤ GPIO 2      GPIO 19 ├──── LoRa MISO
    LCD WR      ────┤ GPIO 4      GPIO 18 ├──── LoRa CS
    LCD RD      ────┤ GPIO 32     GPIO 21 ├──── LoRa RST
                    │             GPIO 22 ├──── LoRa DIO0
    LCD D0      ────┤ GPIO 12             │
    LCD D1      ────┤ GPIO 13             │
    LCD D2      ────┤ GPIO 26             │
    LCD D3      ────┤ GPIO 25             │
    LCD D4      ────┤ GPIO 17             │
    LCD D5      ────┤ GPIO 16             │
    LCD D6      ────┤ GPIO 27             │
    LCD D7      ────┤ GPIO 14             │
                    └─────────────────────┘
*/
// ═══════════════════════════════════════════════════════════════════════════

#endif // PIN_CONFIG_ILI9488_H
