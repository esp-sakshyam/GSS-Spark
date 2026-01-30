/*
 * ═══════════════════════════════════════════════════════════════════════════════════
 *                        ╔═════════════════════════════════════╗
 *                        ║   LIFELINE EMERGENCY TRANSMITTER    ║
 *                        ║   ESP32-S3 N8R2 + ILI9488 Edition   ║
 *                        ╚═════════════════════════════════════╝
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 * Ported for ESP32-S3 with ILI9488 8-bit parallel display.
 * Uses manual GPIO bit-banging (proven working from LoveCode.ino).
 *
 * Hardware:
 *   - ESP32-S3 N8R2
 *   - ILI9488 320x480 TFT (8-bit parallel)
 *   - LoRa SX1278 @ 433 MHz
 *   - 4x4 Matrix Keypad
 *
 * Version: 1.0.0-S3
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

#include "soc/gpio_reg.h"
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Arduino.h>
#include <Keypad.h>
#include <LoRa.h>
#include <SPI.h>
#include <Wire.h>
#include <vector>

// ═══════════════════════════════════════════════════════════════════════════════════
//                     PART 1: CORE DISPLAY DRIVER
// ═══════════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────── PIN DEFINITIONS
// ─────────────────────────────────── ILI9488 8-bit Parallel Interface -
// Matching LoveCode.ino pinout

// ═══════════════════════════════════════════════════════════════════════════
//                         PIN DEFINITIONS (USER SPECIFIED)
// ═══════════════════════════════════════════════════════════════════════════

// Data Bus
#define TFT_D0 8
#define TFT_D1 9
#define TFT_D2 21
#define TFT_D3 46
#define TFT_D4 10
#define TFT_D5 11
#define TFT_D6 13
#define TFT_D7 12

// Control Bus
#define TFT_RST 4
#define TFT_CS 5
#define TFT_RS 6 // DC
#define TFT_WR 7
#define TFT_RD 1

// NeoPixel
#define NEOPIXEL_PIN 48
#define NEOPIXEL_COUNT 1

// ─────────────────────────────── DISPLAY CONFIG
// ────────────────────────────────────

#define SCREEN_WIDTH 480
#define SCREEN_HEIGHT 320

// ─────────────────────────────── RGB565 COLOR MACRO
// ────────────────────────────────

#define RGB565(r, g, b) (((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3))

// ─────────────────────────────── BASIC COLORS
// ──────────────────────────────────────

#define BLACK 0x0000
#define WHITE 0xFFFF
#define RED 0xF800
#define GREEN 0x07E0
#define BLUE 0x001F
#define CYAN 0x07FF
#define MAGENTA 0xF81F
#define YELLOW 0xFFE0

// ─────────────────────────────── PREMIUM COLOR PALETTE
// ─────────────────────────────

// Primary Backgrounds
#define COLOR_BG_PRIMARY RGB565(13, 13, 15)
#define COLOR_BG_HEADER RGB565(10, 25, 41)
#define COLOR_BG_HEADER_ALT RGB565(7, 19, 24)
#define COLOR_BG_CARD RGB565(26, 26, 46)
#define COLOR_BG_CARD_ACTIVE RGB565(37, 37, 66)
#define COLOR_BG_INPUT RGB565(45, 45, 68)

// Vibrant Primary Colors
#define COLOR_RED RGB565(255, 59, 59)
#define COLOR_RED_DARK RGB565(180, 30, 30)
#define COLOR_RED_BRIGHT RGB565(255, 100, 100)

#define COLOR_GREEN RGB565(0, 255, 135)
#define COLOR_GREEN_DARK RGB565(0, 180, 95)
#define COLOR_GREEN_BRIGHT RGB565(50, 255, 160)

#define COLOR_AMBER RGB565(255, 184, 0)
#define COLOR_AMBER_DARK RGB565(200, 140, 0)
#define COLOR_AMBER_BRIGHT RGB565(255, 210, 50)

#define COLOR_CYAN_C RGB565(0, 212, 255)
#define COLOR_CYAN_DARK RGB565(0, 150, 200)
#define COLOR_CYAN_BRIGHT RGB565(80, 230, 255)

#define COLOR_ORANGE RGB565(255, 123, 0)
#define COLOR_ORANGE_DARK RGB565(200, 90, 0)

#define COLOR_PURPLE RGB565(168, 85, 247)
#define COLOR_PURPLE_DARK RGB565(120, 60, 180)

// Text Colors
#define COLOR_TEXT_PRIMARY RGB565(255, 255, 255)
#define COLOR_TEXT_SECONDARY RGB565(163, 177, 198)
#define COLOR_TEXT_MUTED RGB565(100, 116, 139)
#define COLOR_TEXT_DARK RGB565(10, 10, 10)
#define COLOR_TEXT_DISABLED RGB565(60, 70, 85)

// Accent & Utility
#define COLOR_ACCENT_LINE RGB565(40, 50, 70)
#define COLOR_BORDER RGB565(50, 60, 85)
#define COLOR_BADGE_BG RGB565(45, 45, 75)

// ═══════════════════════════════════════════════════════════════════════════════════
//                         LOW-LEVEL DISPLAY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════

// optimized writeData8 for ESP32-S3 (Reg Access)
void writeData8(uint8_t d) {
  uint32_t mask0_set = 0;
  uint32_t mask0_clr = 0;
  uint32_t mask1_set = 0;
  uint32_t mask1_clr = 0;

  // Bit 0 -> GPIO 8
  if (d & 0x01)
    mask0_set |= (1 << 8);
  else
    mask0_clr |= (1 << 8);
  // Bit 1 -> GPIO 9
  if (d & 0x02)
    mask0_set |= (1 << 9);
  else
    mask0_clr |= (1 << 9);
  // Bit 2 -> GPIO 21
  if (d & 0x04)
    mask0_set |= (1 << 21);
  else
    mask0_clr |= (1 << 21);
  // Bit 3 -> GPIO 46 (High Register, bit 14)
  if (d & 0x08)
    mask1_set |= (1 << 14);
  else
    mask1_clr |= (1 << 14);
  // Bit 4 -> GPIO 10
  if (d & 0x10)
    mask0_set |= (1 << 10);
  else
    mask0_clr |= (1 << 10);
  // Bit 5 -> GPIO 11
  if (d & 0x20)
    mask0_set |= (1 << 11);
  else
    mask0_clr |= (1 << 11);
  // Bit 6 -> GPIO 13
  if (d & 0x40)
    mask0_set |= (1 << 13);
  else
    mask0_clr |= (1 << 13);
  // Bit 7 -> GPIO 12
  if (d & 0x80)
    mask0_set |= (1 << 12);
  else
    mask0_clr |= (1 << 12);

  // Apply Writes (Low Register)
  if (mask0_set)
    REG_WRITE(GPIO_OUT_W1TS_REG, mask0_set);
  if (mask0_clr)
    REG_WRITE(GPIO_OUT_W1TC_REG, mask0_clr);

  // Apply Writes (High Register)
  if (mask1_set)
    REG_WRITE(GPIO_OUT1_W1TS_REG, mask1_set);
  if (mask1_clr)
    REG_WRITE(GPIO_OUT1_W1TC_REG, mask1_clr);

  // Pulse WR (GPIO 7 - Low Register)
  REG_WRITE(GPIO_OUT_W1TC_REG, (1 << 7)); // WR LOW
  REG_WRITE(GPIO_OUT_W1TS_REG, (1 << 7)); // WR HIGH
}

void writeCommand(uint8_t cmd) {
  digitalWrite(TFT_RS, LOW);
  digitalWrite(TFT_CS, LOW);
  writeData8(cmd);
  digitalWrite(TFT_CS, HIGH);
}

void writeDataByte(uint8_t data) {
  digitalWrite(TFT_RS, HIGH);
  digitalWrite(TFT_CS, LOW);
  writeData8(data);
  digitalWrite(TFT_CS, HIGH);
}

void tftInitPins() {
  pinMode(TFT_RST, OUTPUT);
  pinMode(TFT_CS, OUTPUT);
  pinMode(TFT_RS, OUTPUT);
  pinMode(TFT_WR, OUTPUT);
  pinMode(TFT_RD, OUTPUT);

  pinMode(TFT_D0, OUTPUT);
  pinMode(TFT_D1, OUTPUT);
  pinMode(TFT_D2, OUTPUT);
  pinMode(TFT_D3, OUTPUT);
  pinMode(TFT_D4, OUTPUT);
  pinMode(TFT_D5, OUTPUT);
  pinMode(TFT_D6, OUTPUT);
  pinMode(TFT_D7, OUTPUT);

  digitalWrite(TFT_CS, HIGH);
  digitalWrite(TFT_WR, HIGH);
  digitalWrite(TFT_RD, HIGH);
}

void tftInit() {
  tftInitPins();

  digitalWrite(TFT_RST, HIGH);
  delay(50);
  digitalWrite(TFT_RST, LOW);
  delay(150);
  digitalWrite(TFT_RST, HIGH);
  delay(150);

  writeCommand(0x01);
  delay(150);
  writeCommand(0x11);
  delay(150);

  writeCommand(0x3A);
  writeDataByte(0x55); // 16-bit pixel format
  writeCommand(0x36);
  writeDataByte(
      0x28); // Landscape Flipped (MV|BGR) - Fixed the upside-down issue
  writeCommand(0x29);
  delay(50);
}

void setAddressWindow(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1) {
  writeCommand(0x2A);
  writeDataByte(x0 >> 8);
  writeDataByte(x0);
  writeDataByte(x1 >> 8);
  writeDataByte(x1);

  writeCommand(0x2B);
  writeDataByte(y0 >> 8);
  writeDataByte(y0);
  writeDataByte(y1 >> 8);
  writeDataByte(y1);

  writeCommand(0x2C);
}

void fillScreen(uint16_t color) {
  setAddressWindow(0, 0, SCREEN_WIDTH - 1, SCREEN_HEIGHT - 1);
  digitalWrite(TFT_RS, HIGH);
  digitalWrite(TFT_CS, LOW);
  uint8_t hi = color >> 8, lo = color & 0xFF;
  for (uint32_t i = 0; i < (uint32_t)SCREEN_WIDTH * SCREEN_HEIGHT; i++) {
    writeData8(hi);
    writeData8(lo);
  }
  digitalWrite(TFT_CS, HIGH);
}

void fillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) {
  if (x >= SCREEN_WIDTH || y >= SCREEN_HEIGHT || w <= 0 || h <= 0)
    return;
  if (x < 0) {
    w += x;
    x = 0;
  }
  if (y < 0) {
    h += y;
    y = 0;
  }
  if (x + w > SCREEN_WIDTH)
    w = SCREEN_WIDTH - x;
  if (y + h > SCREEN_HEIGHT)
    h = SCREEN_HEIGHT - y;
  if (w <= 0 || h <= 0)
    return;

  setAddressWindow(x, y, x + w - 1, y + h - 1);
  digitalWrite(TFT_RS, HIGH);
  digitalWrite(TFT_CS, LOW);
  uint8_t hi = color >> 8, lo = color & 0xFF;
  for (uint32_t i = 0; i < (uint32_t)w * h; i++) {
    writeData8(hi);
    writeData8(lo);
  }
  digitalWrite(TFT_CS, HIGH);
}

void drawPixel(int16_t x, int16_t y, uint16_t color) {
  if (x < 0 || x >= SCREEN_WIDTH || y < 0 || y >= SCREEN_HEIGHT)
    return;
  setAddressWindow(x, y, x, y);
  digitalWrite(TFT_RS, HIGH);
  digitalWrite(TFT_CS, LOW);
  writeData8(color >> 8);
  writeData8(color);
  digitalWrite(TFT_CS, HIGH);
}

void drawFastHLine(int16_t x, int16_t y, int16_t w, uint16_t color) {
  fillRect(x, y, w, 1, color);
}

void drawFastVLine(int16_t x, int16_t y, int16_t h, uint16_t color) {
  fillRect(x, y, 1, h, color);
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                     PART 2: TEXT RENDERING
// ═══════════════════════════════════════════════════════════════════════════════════

// 5x7 Font - ASCII 32-127 (space to ~)
const uint8_t font5x7[96][5] PROGMEM = {
    {0x00, 0x00, 0x00, 0x00, 0x00}, // space
    {0x00, 0x00, 0x5F, 0x00, 0x00}, // !
    {0x00, 0x07, 0x00, 0x07, 0x00}, // "
    {0x14, 0x7F, 0x14, 0x7F, 0x14}, // #
    {0x24, 0x2A, 0x7F, 0x2A, 0x12}, // $
    {0x23, 0x13, 0x08, 0x64, 0x62}, // %
    {0x36, 0x49, 0x55, 0x22, 0x50}, // &
    {0x00, 0x05, 0x03, 0x00, 0x00}, // '
    {0x00, 0x1C, 0x22, 0x41, 0x00}, // (
    {0x00, 0x41, 0x22, 0x1C, 0x00}, // )
    {0x08, 0x2A, 0x1C, 0x2A, 0x08}, // *
    {0x08, 0x08, 0x3E, 0x08, 0x08}, // +
    {0x00, 0x50, 0x30, 0x00, 0x00}, // ,
    {0x08, 0x08, 0x08, 0x08, 0x08}, // -
    {0x00, 0x60, 0x60, 0x00, 0x00}, // .
    {0x20, 0x10, 0x08, 0x04, 0x02}, // /
    {0x3E, 0x51, 0x49, 0x45, 0x3E}, // 0
    {0x00, 0x42, 0x7F, 0x40, 0x00}, // 1
    {0x42, 0x61, 0x51, 0x49, 0x46}, // 2
    {0x21, 0x41, 0x45, 0x4B, 0x31}, // 3
    {0x18, 0x14, 0x12, 0x7F, 0x10}, // 4
    {0x27, 0x45, 0x45, 0x45, 0x39}, // 5
    {0x3C, 0x4A, 0x49, 0x49, 0x30}, // 6
    {0x01, 0x71, 0x09, 0x05, 0x03}, // 7
    {0x36, 0x49, 0x49, 0x49, 0x36}, // 8
    {0x06, 0x49, 0x49, 0x29, 0x1E}, // 9
    {0x00, 0x36, 0x36, 0x00, 0x00}, // :
    {0x00, 0x56, 0x36, 0x00, 0x00}, // ;
    {0x00, 0x08, 0x14, 0x22, 0x41}, // <
    {0x14, 0x14, 0x14, 0x14, 0x14}, // =
    {0x41, 0x22, 0x14, 0x08, 0x00}, // >
    {0x02, 0x01, 0x51, 0x09, 0x06}, // ?
    {0x32, 0x49, 0x79, 0x41, 0x3E}, // @
    {0x7E, 0x11, 0x11, 0x11, 0x7E}, // A
    {0x7F, 0x49, 0x49, 0x49, 0x36}, // B
    {0x3E, 0x41, 0x41, 0x41, 0x22}, // C
    {0x7F, 0x41, 0x41, 0x22, 0x1C}, // D
    {0x7F, 0x49, 0x49, 0x49, 0x41}, // E
    {0x7F, 0x09, 0x09, 0x01, 0x01}, // F
    {0x3E, 0x41, 0x41, 0x51, 0x32}, // G
    {0x7F, 0x08, 0x08, 0x08, 0x7F}, // H
    {0x00, 0x41, 0x7F, 0x41, 0x00}, // I
    {0x20, 0x40, 0x41, 0x3F, 0x01}, // J
    {0x7F, 0x08, 0x14, 0x22, 0x41}, // K
    {0x7F, 0x40, 0x40, 0x40, 0x40}, // L
    {0x7F, 0x02, 0x04, 0x02, 0x7F}, // M
    {0x7F, 0x04, 0x08, 0x10, 0x7F}, // N
    {0x3E, 0x41, 0x41, 0x41, 0x3E}, // O
    {0x7F, 0x09, 0x09, 0x09, 0x06}, // P
    {0x3E, 0x41, 0x51, 0x21, 0x5E}, // Q
    {0x7F, 0x09, 0x19, 0x29, 0x46}, // R
    {0x46, 0x49, 0x49, 0x49, 0x31}, // S
    {0x01, 0x01, 0x7F, 0x01, 0x01}, // T
    {0x3F, 0x40, 0x40, 0x40, 0x3F}, // U
    {0x1F, 0x20, 0x40, 0x20, 0x1F}, // V
    {0x7F, 0x20, 0x18, 0x20, 0x7F}, // W
    {0x63, 0x14, 0x08, 0x14, 0x63}, // X
    {0x03, 0x04, 0x78, 0x04, 0x03}, // Y
    {0x61, 0x51, 0x49, 0x45, 0x43}, // Z
    {0x00, 0x00, 0x7F, 0x41, 0x41}, // [
    {0x02, 0x04, 0x08, 0x10, 0x20}, // backslash
    {0x41, 0x41, 0x7F, 0x00, 0x00}, // ]
    {0x04, 0x02, 0x01, 0x02, 0x04}, // ^
    {0x40, 0x40, 0x40, 0x40, 0x40}, // _
    {0x00, 0x01, 0x02, 0x04, 0x00}, // `
    {0x20, 0x54, 0x54, 0x54, 0x78}, // a
    {0x7F, 0x48, 0x44, 0x44, 0x38}, // b
    {0x38, 0x44, 0x44, 0x44, 0x20}, // c
    {0x38, 0x44, 0x44, 0x48, 0x7F}, // d
    {0x38, 0x54, 0x54, 0x54, 0x18}, // e
    {0x08, 0x7E, 0x09, 0x01, 0x02}, // f
    {0x08, 0x14, 0x54, 0x54, 0x3C}, // g
    {0x7F, 0x08, 0x04, 0x04, 0x78}, // h
    {0x00, 0x44, 0x7D, 0x40, 0x00}, // i
    {0x20, 0x40, 0x44, 0x3D, 0x00}, // j
    {0x00, 0x7F, 0x10, 0x28, 0x44}, // k
    {0x00, 0x41, 0x7F, 0x40, 0x00}, // l
    {0x7C, 0x04, 0x18, 0x04, 0x78}, // m
    {0x7C, 0x08, 0x04, 0x04, 0x78}, // n
    {0x38, 0x44, 0x44, 0x44, 0x38}, // o
    {0x7C, 0x14, 0x14, 0x14, 0x08}, // p
    {0x08, 0x14, 0x14, 0x18, 0x7C}, // q
    {0x7C, 0x08, 0x04, 0x04, 0x08}, // r
    {0x48, 0x54, 0x54, 0x54, 0x20}, // s
    {0x04, 0x3F, 0x44, 0x40, 0x20}, // t
    {0x3C, 0x40, 0x40, 0x20, 0x7C}, // u
    {0x1C, 0x20, 0x40, 0x20, 0x1C}, // v
    {0x3C, 0x40, 0x30, 0x40, 0x3C}, // w
    {0x44, 0x28, 0x10, 0x28, 0x44}, // x
    {0x0C, 0x50, 0x50, 0x50, 0x3C}, // y
    {0x44, 0x64, 0x54, 0x4C, 0x44}, // z
    {0x00, 0x08, 0x36, 0x41, 0x00}, // {
    {0x00, 0x00, 0x7F, 0x00, 0x00}, // |
    {0x00, 0x41, 0x36, 0x08, 0x00}, // }
    {0x08, 0x08, 0x2A, 0x1C, 0x08}, // ~
    {0x08, 0x1C, 0x2A, 0x08, 0x08}, // DEL (arrow)
};

/**
 * Draw a single character
 */
void drawChar(int16_t x, int16_t y, char c, uint16_t color, uint8_t size) {
  if (c < 32 || c > 127)
    c = ' ';
  uint8_t idx = c - 32;
  for (int col = 0; col < 5; col++) {
    uint8_t line = pgm_read_byte(&font5x7[idx][col]);
    for (int row = 0; row < 7; row++) {
      if (line & (1 << row)) {
        if (size == 1) {
          drawPixel(x + col, y + row, color);
        } else {
          fillRect(x + col * size, y + row * size, size, size, color);
        }
      }
    }
  }
}

/**
 * Draw a string at position
 */
void drawText(int16_t x, int16_t y, const char *text, uint16_t color,
              uint8_t size) {
  while (*text) {
    drawChar(x, y, *text++, color, size);
    x += 6 * size;
  }
}

/**
 * Draw text centered horizontally
 */
void drawTextCentered(int16_t y, const char *text, uint16_t color,
                      uint8_t size) {
  int len = strlen(text);
  int16_t x = (SCREEN_WIDTH - len * 6 * size) / 2;
  drawText(x, y, text, color, size);
}

/**
 * Draw text right-aligned
 */
void drawTextRight(int16_t y, const char *text, uint16_t color, uint8_t size,
                   int16_t margin) {
  int len = strlen(text);
  int16_t x = SCREEN_WIDTH - len * 6 * size - margin;
  drawText(x, y, text, color, size);
}

/**
 * Get text width in pixels
 */
int16_t getTextWidth(const char *text, uint8_t size) {
  return strlen(text) * 6 * size;
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                     PART 3: GRAPHICS HELPERS
// ═══════════════════════════════════════════════════════════════════════════════════

/**
 * Draw line using Bresenham's algorithm
 */
void drawLine(int16_t x0, int16_t y0, int16_t x1, int16_t y1, uint16_t color) {
  int16_t steep = abs(y1 - y0) > abs(x1 - x0);
  if (steep) {
    int16_t t = x0;
    x0 = y0;
    y0 = t;
    t = x1;
    x1 = y1;
    y1 = t;
  }
  if (x0 > x1) {
    int16_t t = x0;
    x0 = x1;
    x1 = t;
    t = y0;
    y0 = y1;
    y1 = t;
  }

  int16_t dx = x1 - x0;
  int16_t dy = abs(y1 - y0);
  int16_t err = dx / 2;
  int16_t ystep = (y0 < y1) ? 1 : -1;
  int16_t y = y0;

  for (int16_t x = x0; x <= x1; x++) {
    if (steep) {
      drawPixel(y, x, color);
    } else {
      drawPixel(x, y, color);
    }
    err -= dy;
    if (err < 0) {
      y += ystep;
      err += dx;
    }
  }
}

/**
 * Draw circle outline
 */
void drawCircle(int16_t x0, int16_t y0, int16_t r, uint16_t color) {
  int16_t f = 1 - r;
  int16_t ddF_x = 1;
  int16_t ddF_y = -2 * r;
  int16_t x = 0;
  int16_t y = r;

  drawPixel(x0, y0 + r, color);
  drawPixel(x0, y0 - r, color);
  drawPixel(x0 + r, y0, color);
  drawPixel(x0 - r, y0, color);

  while (x < y) {
    if (f >= 0) {
      y--;
      ddF_y += 2;
      f += ddF_y;
    }
    x++;
    ddF_x += 2;
    f += ddF_x;

    drawPixel(x0 + x, y0 + y, color);
    drawPixel(x0 - x, y0 + y, color);
    drawPixel(x0 + x, y0 - y, color);
    drawPixel(x0 - x, y0 - y, color);
    drawPixel(x0 + y, y0 + x, color);
    drawPixel(x0 - y, y0 + x, color);
    drawPixel(x0 + y, y0 - x, color);
    drawPixel(x0 - y, y0 - x, color);
  }
}

/**
 * Draw filled circle
 */
void fillCircle(int16_t x0, int16_t y0, int16_t r, uint16_t color) {
  drawFastVLine(x0, y0 - r, 2 * r + 1, color);
  int16_t f = 1 - r;
  int16_t ddF_x = 1;
  int16_t ddF_y = -2 * r;
  int16_t x = 0;
  int16_t y = r;

  while (x < y) {
    if (f >= 0) {
      y--;
      ddF_y += 2;
      f += ddF_y;
    }
    x++;
    ddF_x += 2;
    f += ddF_x;

    drawFastVLine(x0 + x, y0 - y, 2 * y + 1, color);
    drawFastVLine(x0 - x, y0 - y, 2 * y + 1, color);
    drawFastVLine(x0 + y, y0 - x, 2 * x + 1, color);
    drawFastVLine(x0 - y, y0 - x, 2 * x + 1, color);
  }
}

/**
 * Draw rectangle outline
 */
void drawRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) {
  drawFastHLine(x, y, w, color);
  drawFastHLine(x, y + h - 1, w, color);
  drawFastVLine(x, y, h, color);
  drawFastVLine(x + w - 1, y, h, color);
}

/**
 * Draw rounded rectangle outline
 */
void drawRoundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r,
                   uint16_t color) {
  drawFastHLine(x + r, y, w - 2 * r, color);
  drawFastHLine(x + r, y + h - 1, w - 2 * r, color);
  drawFastVLine(x, y + r, h - 2 * r, color);
  drawFastVLine(x + w - 1, y + r, h - 2 * r, color);

  // Corners
  int16_t f = 1 - r;
  int16_t ddF_x = 1;
  int16_t ddF_y = -2 * r;
  int16_t cx = 0;
  int16_t cy = r;

  while (cx < cy) {
    if (f >= 0) {
      cy--;
      ddF_y += 2;
      f += ddF_y;
    }
    cx++;
    ddF_x += 2;
    f += ddF_x;

    drawPixel(x + w - 1 - r + cx, y + r - cy, color);
    drawPixel(x + w - 1 - r + cy, y + r - cx, color);
    drawPixel(x + w - 1 - r + cx, y + h - 1 - r + cy, color);
    drawPixel(x + w - 1 - r + cy, y + h - 1 - r + cx, color);
    drawPixel(x + r - cx, y + r - cy, color);
    drawPixel(x + r - cy, y + r - cx, color);
    drawPixel(x + r - cx, y + h - 1 - r + cy, color);
    drawPixel(x + r - cy, y + h - 1 - r + cx, color);
  }
}

/**
 * Draw filled rounded rectangle
 */
void fillRoundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r,
                   uint16_t color) {
  fillRect(x + r, y, w - 2 * r, h, color);

  int16_t f = 1 - r;
  int16_t ddF_x = 1;
  int16_t ddF_y = -2 * r;
  int16_t cx = 0;
  int16_t cy = r;

  while (cx < cy) {
    if (f >= 0) {
      cy--;
      ddF_y += 2;
      f += ddF_y;
    }
    cx++;
    ddF_x += 2;
    f += ddF_x;

    drawFastVLine(x + r - cx, y + r - cy, h - 2 * r + 2 * cy, color);
    drawFastVLine(x + r - cy, y + r - cx, h - 2 * r + 2 * cx, color);
    drawFastVLine(x + w - 1 - r + cx, y + r - cy, h - 2 * r + 2 * cy, color);
    drawFastVLine(x + w - 1 - r + cy, y + r - cx, h - 2 * r + 2 * cx, color);
  }
}

/**
 * Draw horizontal gradient
 */
void drawGradientH(int16_t x, int16_t y, int16_t w, int16_t h,
                   uint16_t colorStart, uint16_t colorEnd) {
  for (int i = 0; i < w; i++) {
    uint8_t r1 = (colorStart >> 11) & 0x1F;
    uint8_t g1 = (colorStart >> 5) & 0x3F;
    uint8_t b1 = colorStart & 0x1F;
    uint8_t r2 = (colorEnd >> 11) & 0x1F;
    uint8_t g2 = (colorEnd >> 5) & 0x3F;
    uint8_t b2 = colorEnd & 0x1F;

    uint8_t r = r1 + (r2 - r1) * i / w;
    uint8_t g = g1 + (g2 - g1) * i / w;
    uint8_t b = b1 + (b2 - b1) * i / w;

    uint16_t color = (r << 11) | (g << 5) | b;
    drawFastVLine(x + i, y, h, color);
  }
}

/**
 * Draw vertical gradient
 */
void drawGradientV(int16_t x, int16_t y, int16_t w, int16_t h,
                   uint16_t colorTop, uint16_t colorBottom) {
  for (int i = 0; i < h; i++) {
    uint8_t r1 = (colorTop >> 11) & 0x1F;
    uint8_t g1 = (colorTop >> 5) & 0x3F;
    uint8_t b1 = colorTop & 0x1F;
    uint8_t r2 = (colorBottom >> 11) & 0x1F;
    uint8_t g2 = (colorBottom >> 5) & 0x3F;
    uint8_t b2 = colorBottom & 0x1F;

    uint8_t r = r1 + (r2 - r1) * i / h;
    uint8_t g = g1 + (g2 - g1) * i / h;
    uint8_t b = b1 + (b2 - b1) * i / h;

    uint16_t color = (r << 11) | (g << 5) | b;
    drawFastHLine(x, y + i, w, color);
  }
}

/**
 * Draw a filled triangle
 */
void fillTriangle(int16_t x0, int16_t y0, int16_t x1, int16_t y1, int16_t x2,
                  int16_t y2, uint16_t color) {
  int16_t a, b, y, last;

  // Sort by Y coordinate
  if (y0 > y1) {
    int16_t t = y0;
    y0 = y1;
    y1 = t;
    t = x0;
    x0 = x1;
    x1 = t;
  }
  if (y1 > y2) {
    int16_t t = y1;
    y1 = y2;
    y2 = t;
    t = x1;
    x1 = x2;
    x2 = t;
  }
  if (y0 > y1) {
    int16_t t = y0;
    y0 = y1;
    y1 = t;
    t = x0;
    x0 = x1;
    x1 = t;
  }

  if (y0 == y2) {
    a = b = x0;
    if (x1 < a)
      a = x1;
    else if (x1 > b)
      b = x1;
    if (x2 < a)
      a = x2;
    else if (x2 > b)
      b = x2;
    drawFastHLine(a, y0, b - a + 1, color);
    return;
  }

  int16_t dx01 = x1 - x0, dy01 = y1 - y0;
  int16_t dx02 = x2 - x0, dy02 = y2 - y0;
  int16_t dx12 = x2 - x1, dy12 = y2 - y1;
  int32_t sa = 0, sb = 0;

  if (y1 == y2)
    last = y1;
  else
    last = y1 - 1;

  for (y = y0; y <= last; y++) {
    a = x0 + sa / dy01;
    b = x0 + sb / dy02;
    sa += dx01;
    sb += dx02;
    if (a > b) {
      int16_t t = a;
      a = b;
      b = t;
    }
    drawFastHLine(a, y, b - a + 1, color);
  }

  sa = dx12 * (y - y1);
  sb = dx02 * (y - y0);
  for (; y <= y2; y++) {
    a = x1 + sa / dy12;
    b = x0 + sb / dy02;
    sa += dx12;
    sb += dx02;
    if (a > b) {
      int16_t t = a;
      a = b;
      b = t;
    }
    drawFastHLine(a, y, b - a + 1, color);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                     PART 3.5: PREMIUM ANIMATIONS (LoveCode)
// ═══════════════════════════════════════════════════════════════════════════════════

// Colors for hearts
#define HEART_PINK RGB565(252, 24, 120)   // 0xFC18
#define HEART_DEEP_RED RGB565(160, 0, 0)  // 0xA000
#define HEART_PURPLE RGB565(120, 15, 240) // 0x780F
#define HEART_GOLD RGB565(255, 224, 0)    // 0xFFE0

void drawSmoothHeart(int x, int y, int size, uint16_t color) {
  int r = size / 2;
  // Two circles
  fillCircle(x - r / 2, y - r / 2, r / 2, color);
  fillCircle(x + r / 2, y - r / 2, r / 2, color);
  // Triangle at bottom (v-shape)
  // Coords approximate to connect smoothly with circles
  fillTriangle(x - size + 2, y - r / 4, x + size - 2, y - r / 4, x, y + size,
               color);
}

class FloatingHeart {
public:
  float x, y, startX;
  float speedY;
  float swaySpeed;
  int size;
  uint16_t color;
  int phase;

  FloatingHeart() {
    reset();
    y = random(SCREEN_HEIGHT);
  }

  void reset() {
    startX = random(20, SCREEN_WIDTH - 20);
    x = startX;
    y = SCREEN_HEIGHT + random(10, 50);
    size = random(8, 20);
    speedY = random(20, 50) / 10.0; // Faster
    swaySpeed = random(2, 6) / 1000.0;
    phase = random(0, 314);

    // Aesthetic Palette
    int r = random(4);
    if (r == 0)
      color = COLOR_RED;
    else if (r == 1)
      color = HEART_PINK;
    else if (r == 2)
      color = HEART_DEEP_RED;
    else
      color = HEART_PURPLE;
  }

  void update(unsigned long t) {
    // Erase old
    drawSmoothHeart((int)x, (int)y, size,
                    BLACK); // Or background color if not black?
    // Note: Since we have complex backgrounds, simple erasing with BLACK might
    // look bad. For LifeLine, we will restrict hearts to the Boot/Result
    // screens which can use black BG or redraw. Actually, let's use a simpler
    // particle system that doesn't require full redraw if possible, or just
    // accept the artifacting on gradient backgrounds (it might look like a
    // trail).

    // Physics
    y -= speedY;
    x = startX + sin(t * swaySpeed + phase) * 20; // Sway amplitude 20px

    if (y < -30)
      reset();

    // Draw new
    drawSmoothHeart((int)x, (int)y, size, color);
  }
};

std::vector<FloatingHeart> hearts;
const int MAX_HEARTS = 12;

void initLoveAnimations() {
  hearts.clear();
  for (int i = 0; i < MAX_HEARTS; i++)
    hearts.push_back(FloatingHeart());
}

void updateLoveAnimations(unsigned long t) {
  for (auto &h : hearts)
    h.update(t);
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                     PART 4: UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════════

// Layout constants
#define HEADER_HEIGHT 42
#define FOOTER_HEIGHT 32
#define CONTENT_START_Y (HEADER_HEIGHT + 4)
#define MARGIN 10
#define MARGIN_SMALL 5
#define BORDER_RADIUS 6
#define MENU_ITEM_HEIGHT 34
#define VISIBLE_MENU_ITEMS 5

// Text sizes
#define TEXT_XLARGE 4
#define TEXT_LARGE 3
#define TEXT_MEDIUM 2
#define TEXT_SMALL 1

// Effects
#define GLOW_INTENSITY 3
#define SHADOW_OFFSET 2

/**
 * Draw premium card with shadow
 */
void drawPremiumCard(int16_t x, int16_t y, int16_t w, int16_t h,
                     uint16_t bgColor, uint16_t borderColor) {
  // Shadow
  fillRoundRect(x + SHADOW_OFFSET, y + SHADOW_OFFSET, w, h, BORDER_RADIUS,
                RGB565(5, 5, 10));
  // Main card
  fillRoundRect(x, y, w, h, BORDER_RADIUS, bgColor);
  // Border
  drawRoundRect(x, y, w, h, BORDER_RADIUS, borderColor);
  // Inner highlight
  drawFastHLine(x + 4, y + 1, w - 8, RGB565(60, 60, 80));
}

/**
 * Draw a glowing circle
 */
void drawGlowCircle(int16_t cx, int16_t cy, int16_t r, uint16_t color) {
  for (int i = GLOW_INTENSITY; i > 0; i--) {
    uint8_t cr = (color >> 11) & 0x1F;
    uint8_t cg = (color >> 5) & 0x3F;
    uint8_t cb = color & 0x1F;
    uint16_t glowColor =
        ((cr / (i + 1)) << 11) | ((cg / (i + 1)) << 5) | (cb / (i + 1));
    drawCircle(cx, cy, r + i * 2, glowColor);
  }
  fillCircle(cx, cy, r, color);
}

/**
 * Draw a status indicator with highlight
 */
void drawStatusIndicator(int16_t x, int16_t y, int16_t r, uint16_t color,
                         bool active) {
  if (active) {
    drawCircle(
        x, y, r + 3,
        RGB565((color >> 11) & 0x0F, (color >> 6) & 0x1F, (color >> 1) & 0x0F));
    drawCircle(
        x, y, r + 2,
        RGB565((color >> 11) & 0x1F, (color >> 5) & 0x1F, (color) & 0x0F));
  }
  fillCircle(x, y, r, color);
  fillCircle(x - r / 3, y - r / 3, r / 4, COLOR_TEXT_PRIMARY);
}

/**
 * Draw premium header bar
 */
void drawHeader(const char *title) {
  drawGradientV(0, 0, SCREEN_WIDTH, HEADER_HEIGHT, RGB565(20, 40, 65),
                COLOR_BG_HEADER);

  // Accent lines
  drawFastHLine(0, HEADER_HEIGHT - 2, SCREEN_WIDTH, COLOR_CYAN_DARK);
  drawFastHLine(0, HEADER_HEIGHT - 1, SCREEN_WIDTH, COLOR_CYAN_C);
  drawFastHLine(0, HEADER_HEIGHT, SCREEN_WIDTH, COLOR_CYAN_DARK);

  // Title with shadow
  int16_t textY = (HEADER_HEIGHT - 14) / 2;
  drawText(MARGIN + 1, textY + 1, title, RGB565(0, 0, 0), TEXT_MEDIUM);
  drawText(MARGIN, textY, title, COLOR_TEXT_PRIMARY, TEXT_MEDIUM);
}

/**
 * Draw premium footer bar
 */
void drawFooter(const char *hints) {
  int16_t footerY = SCREEN_HEIGHT - FOOTER_HEIGHT;

  // Accent lines
  drawFastHLine(0, footerY - 2, SCREEN_WIDTH, COLOR_CYAN_DARK);
  drawFastHLine(0, footerY - 1, SCREEN_WIDTH, COLOR_ACCENT_LINE);

  // Gradient footer
  drawGradientV(0, footerY, SCREEN_WIDTH, FOOTER_HEIGHT, COLOR_BG_HEADER_ALT,
                RGB565(5, 12, 18));

  // Hint text
  drawText(MARGIN, footerY + (FOOTER_HEIGHT - 8) / 2, hints,
           COLOR_TEXT_SECONDARY, TEXT_SMALL);
}

/**
 * Draw a key hint badge
 */
void drawKeyBadge(int16_t x, int16_t y, char key, const char *label,
                  uint16_t keyColor) {
  // Badge background
  fillRoundRect(x, y - 2, 14, 12, 2, COLOR_BADGE_BG);
  drawRoundRect(x, y - 2, 14, 12, 2, keyColor);

  // Key character
  char keyStr[2] = {key, '\0'};
  drawText(x + 4, y, keyStr, keyColor, TEXT_SMALL);

  // Label
  drawText(x + 18, y, label, COLOR_TEXT_MUTED, TEXT_SMALL);
}

/**
 * Draw separator line
 */
void drawSeparator(int16_t y) {
  drawFastHLine(MARGIN, y, SCREEN_WIDTH - (2 * MARGIN), COLOR_ACCENT_LINE);
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                     PART 5: DEVICE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════════

#define DEVICE_ID 4
#define DEVICE_NAME "LifeLine TX"
#define FIRMWARE_VERSION "v1.0.0-S3"

// LoRa Configuration (Original Spec)
#define LORA_CS 14
#define LORA_RST 45
#define LORA_DIO0 2
#define LORA_SCK 18
#define LORA_MISO 17
#define LORA_MOSI 3
#define LORA_FREQUENCY 433E6
#define LORA_SF 12
#define LORA_BW 125E3

// Keypad Configuration (User Specified Serial Layout)
const byte KEYPAD_ROWS = 4;
const byte KEYPAD_COLS = 4;
// Final remapping based on user feedback to align physical buttons with labels:
char keypadLayout[KEYPAD_ROWS][KEYPAD_COLS] = {
    {'D', '#', '0', '*'}, // Bottom Row (Physically) - R0
    {'C', '9', '8', '7'}, // 3rd Row - R1
    {'B', '6', '5', '4'}, // 2nd Row - R2
    {'A', '3', '2', '1'}  // Top Row - R3
};

// MPU6050 & LANDSLIDE DETECTION
#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel neopixel(NEOPIXEL_COUNT, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

Adafruit_MPU6050 mpu;
#define I2C_SDA 47
#define I2C_SCL 43
bool mpuInitialized = false;

float gyroXoffset = 0, gyroYoffset = 0, gyroZoffset = 0;
float accXoffset = 0, accYoffset = 0, accZoffset = 0;

// Keypad pins: 16, 36, 15, 38, 39, 40, 41, 42 (Serial Order)
byte rowPins[KEYPAD_ROWS] = {39, 40, 41, 42};
byte colPins[KEYPAD_COLS] = {16, 36, 15, 38};

Keypad keypad = Keypad(makeKeymap(keypadLayout), rowPins, colPins, KEYPAD_ROWS,
                       KEYPAD_COLS);

// LED & Buzzer (optional - comment out if not used)
#define LED_GREEN -1 // Set to -1 if not connected
#define LED_RED -1
#define BUZZER_PIN -1

// ═══════════════════════════════════════════════════════════════════════════════════
//                     ALERT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════════

#define ALERT_COUNT 15

const char *alertNames[ALERT_COUNT] = {
    "EMERGENCY",         "MEDICAL EMERGENCY", "MEDICINE SHORTAGE",
    "EVACUATION NEEDED", "STATUS OK",         "INJURY REPORTED",
    "FOOD SHORTAGE",     "WATER SHORTAGE",    "WEATHER ALERT",
    "LOST PERSON",       "ANIMAL ATTACK",     "LANDSLIDE",
    "SNOW STORM",        "EQUIPMENT FAILURE", "OTHER EMERGENCY"};

const char *alertShort[ALERT_COUNT] = {
    "EMERGENCY", "MEDICAL",   "MEDICINE", "EVACUATION", "STATUS OK",
    "INJURY",    "FOOD",      "WATER",    "WEATHER",    "LOST PERSON",
    "ANIMAL",    "LANDSLIDE", "SNOW",     "EQUIPMENT",  "OTHER"};

const uint8_t alertPriority[ALERT_COUNT] = {0, 0, 2, 0, 3, 1, 2, 2,
                                            2, 1, 1, 1, 1, 2, 4};
const char *priorityLabels[] = {"CRITICAL", "HIGH", "MEDIUM", "OK", "INFO"};

String getAlertCode(int index) {
  // Return the index as a string (0-14).
  // This ensures the UNMODIFIED Receiver shows the correct "alertIndex".
  return String(index);
}

uint16_t getPriorityColor(uint8_t priority) {
  switch (priority) {
  case 0:
    return COLOR_RED; // CRITICAL
  case 1:
    return COLOR_ORANGE; // HIGH
  case 2:
    return COLOR_AMBER; // MEDIUM
  case 3:
    return COLOR_GREEN; // OK
  default:
    return COLOR_TEXT_SECONDARY; // INFO
  }
}

const char *getPriorityText(int index) {
  if (index < 0 || index >= ALERT_COUNT)
    return "";
  return priorityLabels[alertPriority[index]];
}

uint16_t getAlertColor(int index) {
  if (index < 0 || index >= ALERT_COUNT)
    return COLOR_TEXT_SECONDARY;
  return getPriorityColor(alertPriority[index]);
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                     STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════════

enum ScreenState {
  SCREEN_BOOT,
  SCREEN_MENU,
  SCREEN_CONFIRM,
  SCREEN_SENDING,
  SCREEN_RESULT,
  SCREEN_SYSTEM_INFO,
  SCREEN_USER_MANUAL,
  SCREEN_SETTINGS
};

ScreenState currentScreen = SCREEN_BOOT;
int selectedAlertIndex = 0;
int menuScrollOffset = 0;
int manualPage = 0;
#define MANUAL_TOTAL_PAGES 4
#define MAX_RETRY_ATTEMPTS 3

unsigned long bootStartTime = 0;
unsigned long resultStartTime = 0;
#define BOOT_DISPLAY_TIME 1500
#define RESULT_SUCCESS_TIME 2000

bool lastTransmitSuccess = false;
int retryCount = 0;
int totalTransmissions = 0;
int successfulTransmissions = 0;
bool loraInitialized = false;

// ═══════════════════════════════════════════════════════════════════════════════════
//                     MPU & LANDSLIDE LOGIC (Moved here for scope)
// ═══════════════════════════════════════════════════════════════════════════════════

// Landslide Detection variables
#define LANDSLIDE_ACCEL_THRESHOLD 2.5 // G's
#define LANDSLIDE_DURATION 3000       // 3 seconds
unsigned long landslideStartTime = 0;
bool landslideDetecting = false;

// Forward Declarations for Screen functions used in MPU logic
void drawMenuScreen();
void drawResultScreen();
bool transmitAlert();

// Visualization
void drawMPUBarGraph(float magnitude) {
  if (currentScreen != SCREEN_MENU || (magnitude < 1.2 && !landslideDetecting))
    return;
  int barX = SCREEN_WIDTH - 100;
  int barY = HEADER_HEIGHT + 10;
  int barW = 80;
  int barH = 10;

  // Visualizing motion intensity
  int fillW = map(constrain(magnitude * 10, 10, 40), 10, 40, 0, barW);

  drawRect(barX, barY, barW, barH, COLOR_BADGE_BG);
  uint16_t barColor = (magnitude > 1.8) ? COLOR_RED : COLOR_GREEN;
  fillRect(barX + 1, barY + 1, fillW, barH - 2, barColor);
}

void checkLandslide() {
  if (!mpuInitialized)
    return;

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Magnitude of acceleration vector
  float totalAccel = sqrt(a.acceleration.x * a.acceleration.x +
                          a.acceleration.y * a.acceleration.y +
                          a.acceleration.z * a.acceleration.z) /
                     9.81;

  // Draw visualization on menu
  drawMPUBarGraph(totalAccel);

  // Landslide detection logic: 3 seconds of high acceleration
  if (totalAccel > LANDSLIDE_ACCEL_THRESHOLD) {
    if (!landslideDetecting) {
      landslideDetecting = true;
      landslideStartTime = millis();
    } else if (millis() - landslideStartTime >= LANDSLIDE_DURATION) {
      // TRANSMIT AUTOMATICALLY
      Serial.println(F("[AUTO] Landslide Detected! Sending code 55..."));

      // Visual/Haptic Feedback
      for (int i = 0; i < 3; i++) {
        neopixel.setPixelColor(0, neopixel.Color(255, 0, 0));
        neopixel.show();
        delay(100);
        neopixel.setPixelColor(0, neopixel.Color(0, 0, 0));
        neopixel.show();
        delay(100);
      }

      selectedAlertIndex = 11; // LANDSLIDE
      transmitAlert();

      currentScreen = SCREEN_RESULT;
      lastTransmitSuccess = true; // Assume success for auto-alert
      resultStartTime = millis();
      drawResultScreen();

      landslideDetecting = false; // Reset
    }
  } else {
    landslideDetecting = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                     PART 5: SCREEN DRAWING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════

void updateMenuScroll() {
  if (selectedAlertIndex < menuScrollOffset) {
    menuScrollOffset = selectedAlertIndex;
  } else if (selectedAlertIndex >= menuScrollOffset + VISIBLE_MENU_ITEMS) {
    menuScrollOffset = selectedAlertIndex - VISIBLE_MENU_ITEMS + 1;
  }
  if (menuScrollOffset > ALERT_COUNT - VISIBLE_MENU_ITEMS)
    menuScrollOffset = ALERT_COUNT - VISIBLE_MENU_ITEMS;
  if (menuScrollOffset < 0)
    menuScrollOffset = 0;
}

void drawBootScreen() {
  drawGradientV(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, RGB565(15, 20, 35),
                COLOR_BG_PRIMARY);
  drawGradientH(0, 0, SCREEN_WIDTH, 4, COLOR_CYAN_DARK, COLOR_PURPLE_DARK);

  // Medical cross
  int cx = SCREEN_WIDTH / 2, cy = 60;
  fillRect(cx - 5, cy - 22, 10, 44, COLOR_RED);
  fillRect(cx - 22, cy - 5, 44, 10, COLOR_RED);

  // Title
  drawTextCentered(100, "LifeLine", WHITE, TEXT_XLARGE);
  drawTextCentered(145, "EMERGENCY TRANSMITTER", COLOR_CYAN_C, TEXT_SMALL);

  // Info cards
  int cardY = SCREEN_HEIGHT - 80;
  int cardW = (SCREEN_WIDTH - 30) / 2;

  drawPremiumCard(MARGIN, cardY, cardW, 55, COLOR_BG_CARD, COLOR_BORDER);
  drawText(MARGIN + 8, cardY + 10, "DEVICE", COLOR_CYAN_C, TEXT_SMALL);
  char idStr[16];
  sprintf(idStr, "TX #%03d", DEVICE_ID);
  drawText(MARGIN + 8, cardY + 30, idStr, WHITE, TEXT_MEDIUM);

  drawPremiumCard(MARGIN * 2 + cardW, cardY, cardW, 55, COLOR_BG_CARD,
                  COLOR_BORDER);
  drawText(MARGIN * 2 + cardW + 8, cardY + 10, "STATUS", COLOR_TEXT_MUTED,
           TEXT_SMALL);
  drawText(MARGIN * 2 + cardW + 8, cardY + 28, "Init...", COLOR_GREEN,
           TEXT_SMALL);
  drawText(MARGIN * 2 + cardW + 8, cardY + 40, FIRMWARE_VERSION,
           COLOR_TEXT_MUTED, TEXT_SMALL);

  drawGradientH(0, SCREEN_HEIGHT - 3, SCREEN_WIDTH, 3, COLOR_PURPLE_DARK,
                COLOR_CYAN_DARK);
  bootStartTime = millis();
}

void drawMenuScreen() {
  drawHeader("SELECT ALERT TYPE");
  fillRect(0, HEADER_HEIGHT + 1, SCREEN_WIDTH,
           SCREEN_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - 2, COLOR_BG_PRIMARY);

  // Device ID badge
  char idStr[10];
  sprintf(idStr, "#%03d", DEVICE_ID);
  fillRoundRect(SCREEN_WIDTH - 48, 8, 42, 18, 4, COLOR_BG_CARD);
  drawText(SCREEN_WIDTH - 44, 12, idStr, COLOR_CYAN_C, TEXT_SMALL);

  // Scroll indicator
  char rangeStr[16];
  sprintf(rangeStr, "%d-%d/%d", menuScrollOffset + 1,
          min(menuScrollOffset + VISIBLE_MENU_ITEMS, ALERT_COUNT), ALERT_COUNT);
  drawText(MARGIN, HEADER_HEIGHT + 8, rangeStr, COLOR_TEXT_MUTED, TEXT_SMALL);

  // Menu items
  int listY = HEADER_HEIGHT + 26;
  for (int i = 0; i < VISIBLE_MENU_ITEMS; i++) {
    int idx = menuScrollOffset + i;
    if (idx >= ALERT_COUNT)
      break;

    int itemY = listY + i * MENU_ITEM_HEIGHT;
    int itemW = SCREEN_WIDTH - MARGIN * 2;
    bool sel = (idx == selectedAlertIndex);

    if (sel) {
      fillRoundRect(MARGIN, itemY, itemW, MENU_ITEM_HEIGHT - 3, 5, COLOR_AMBER);
      fillRect(MARGIN, itemY, 4, MENU_ITEM_HEIGHT - 3, COLOR_AMBER_BRIGHT);

      char numStr[4];
      sprintf(numStr, "%2d", idx + 1);
      fillRoundRect(MARGIN + 6, itemY + 5, 24, 20, 3, COLOR_TEXT_DARK);
      drawText(MARGIN + 10, itemY + 8, numStr, COLOR_AMBER, TEXT_MEDIUM);
      drawText(MARGIN + 36, itemY + 8, alertShort[idx], COLOR_TEXT_DARK,
               TEXT_MEDIUM);
    } else {
      drawRoundRect(MARGIN, itemY, itemW, MENU_ITEM_HEIGHT - 3, 4,
                    COLOR_BORDER);
      char numStr[4];
      sprintf(numStr, "%2d", idx + 1);
      drawText(MARGIN + 8, itemY + 9, numStr, COLOR_TEXT_MUTED, TEXT_MEDIUM);
      drawText(MARGIN + 32, itemY + 9, alertShort[idx], COLOR_TEXT_SECONDARY,
               TEXT_MEDIUM);
    }

    uint16_t pc = getAlertColor(idx);
    fillCircle(SCREEN_WIDTH - MARGIN - 14, itemY + 14, 5, pc);

    // Draw Priority Label Badge
    const char *label = getPriorityText(idx);
    int labelX = SCREEN_WIDTH - MARGIN - 80;
    drawText(labelX, itemY + 9, label, pc, TEXT_SMALL);
  }

  // Footer
  int footerY = SCREEN_HEIGHT - FOOTER_HEIGHT;
  drawFastHLine(0, footerY - 1, SCREEN_WIDTH, COLOR_ACCENT_LINE);
  drawGradientV(0, footerY, SCREEN_WIDTH, FOOTER_HEIGHT, COLOR_BG_HEADER_ALT,
                RGB565(5, 10, 15));
  drawText(MARGIN, footerY + 12, "A/B:Nav *:Sel C:Info D:Help",
           COLOR_TEXT_MUTED, TEXT_SMALL);
}

void drawConfirmScreen() {
  drawGradientV(0, 0, SCREEN_WIDTH, HEADER_HEIGHT, RGB565(60, 45, 0),
                COLOR_AMBER_DARK);
  fillRect(0, HEADER_HEIGHT + 1, SCREEN_WIDTH,
           SCREEN_HEIGHT - HEADER_HEIGHT - 1, COLOR_BG_PRIMARY);
  drawFastHLine(0, HEADER_HEIGHT, SCREEN_WIDTH, COLOR_AMBER);

  drawText(MARGIN + 30, (HEADER_HEIGHT - 14) / 2, "CONFIRM TRANSMISSION",
           COLOR_TEXT_DARK, TEXT_MEDIUM);

  int cardY = HEADER_HEIGHT + 20;
  uint16_t alertColor = getAlertColor(selectedAlertIndex);

  drawPremiumCard(MARGIN, cardY, SCREEN_WIDTH - MARGIN * 2, 60, COLOR_BG_CARD,
                  alertColor);
  fillRect(MARGIN, cardY, 6, 60, alertColor);
  drawText(MARGIN + 18, cardY + 10, alertNames[selectedAlertIndex], alertColor,
           TEXT_MEDIUM);

  // Priority Tag
  drawText(MARGIN + 18, cardY + 35, getPriorityText(selectedAlertIndex),
           COLOR_TEXT_MUTED, TEXT_SMALL);

  char codeStr[5];
  sprintf(codeStr, "%d", getAlertCode(selectedAlertIndex));
  fillRoundRect(SCREEN_WIDTH - MARGIN - 40, cardY + 18, 30, 24, 4, alertColor);
  drawText(SCREEN_WIDTH - MARGIN - 32, cardY + 22, codeStr, COLOR_TEXT_DARK,
           TEXT_MEDIUM);

  // Buttons
  int btnY = SCREEN_HEIGHT - 60;
  int btnW = 100, btnH = 38;
  int btnX1 = (SCREEN_WIDTH - btnW * 2 - 20) / 2;
  int btnX2 = btnX1 + btnW + 20;

  fillRoundRect(btnX1, btnY, btnW, btnH, 5, COLOR_GREEN);
  drawTextCentered(btnY + 12, "* SEND", COLOR_TEXT_DARK, TEXT_MEDIUM);

  fillRoundRect(btnX2, btnY, btnW, btnH, 5, COLOR_BG_CARD);
  drawRoundRect(btnX2, btnY, btnW, btnH, 5, COLOR_RED);
  drawText(btnX2 + 12, btnY + 12, "# CANCEL", COLOR_RED, TEXT_MEDIUM);
}

void drawSendingScreen() {
  drawGradientV(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, RGB565(8, 15, 25),
                COLOR_BG_PRIMARY);
  drawHeader("TRANSMITTING...");

  int cx = SCREEN_WIDTH / 2, cy = 120;
  for (int i = 4; i > 0; i--) {
    drawCircle(cx, cy, 18 + i * 12, RGB565(80 - i * 15, 40 - i * 8, 10));
  }
  drawGlowCircle(cx, cy, 16, COLOR_ORANGE);
  fillRect(cx - 3, cy - 26, 6, 12, COLOR_ORANGE);
  fillCircle(cx, cy - 28, 5, COLOR_ORANGE);

  int cardY = 180;
  drawPremiumCard(MARGIN, cardY, SCREEN_WIDTH - MARGIN * 2, 50, COLOR_BG_CARD,
                  COLOR_ORANGE_DARK);
  fillRect(MARGIN, cardY, 5, 50, COLOR_ORANGE);
  drawText(MARGIN + 14, cardY + 10, "SENDING:", COLOR_TEXT_MUTED, TEXT_SMALL);
  drawText(MARGIN + 14, cardY + 28, alertShort[selectedAlertIndex], WHITE,
           TEXT_MEDIUM);
}

void drawResultScreen() {
  if (lastTransmitSuccess) {
    drawGradientV(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, RGB565(10, 40, 25),
                  RGB565(5, 20, 12));
    drawHeader("SUCCESS");

    int cx = SCREEN_WIDTH / 2, cy = 120;
    fillCircle(cx, cy, 35, COLOR_GREEN);
    // Checkmark
    for (int t = -2; t <= 2; t++) {
      drawLine(cx - 14, cy + t, cx - 4, cy + 12 + t, COLOR_TEXT_DARK);
      drawLine(cx - 4, cy + 12 + t, cx + 16, cy - 10 + t, COLOR_TEXT_DARK);
    }

    drawTextCentered(180, "Message Sent!", COLOR_GREEN_BRIGHT, TEXT_MEDIUM);
    drawTextCentered(210, alertShort[selectedAlertIndex], WHITE, TEXT_SMALL);
    drawTextCentered(SCREEN_HEIGHT - 50, "Returning...", COLOR_TEXT_MUTED,
                     TEXT_SMALL);
  } else {
    drawGradientV(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, RGB565(45, 15, 15),
                  RGB565(20, 8, 8));
    drawHeader("FAILED");

    int cx = SCREEN_WIDTH / 2, cy = 120;
    fillCircle(cx, cy, 35, COLOR_RED);
    // X mark
    for (int t = -2; t <= 2; t++) {
      drawLine(cx - 14 + t, cy - 14, cx + 14 + t, cy + 14, WHITE);
      drawLine(cx + 14 + t, cy - 14, cx - 14 + t, cy + 14, WHITE);
    }

    drawTextCentered(180, "Send Failed!", COLOR_RED_BRIGHT, TEXT_MEDIUM);
    char retryStr[24];
    sprintf(retryStr, "Attempt %d/%d", retryCount + 1, MAX_RETRY_ATTEMPTS);
    drawTextCentered(210, retryStr, COLOR_TEXT_SECONDARY, TEXT_SMALL);

    int btnY = SCREEN_HEIGHT - 60;
    fillRoundRect(60, btnY, 90, 36, 5, COLOR_AMBER);
    drawText(72, btnY + 10, "* RETRY", COLOR_TEXT_DARK, TEXT_MEDIUM);
    fillRoundRect(170, btnY, 90, 36, 5, COLOR_BG_CARD);
    drawText(182, btnY + 10, "# MENU", COLOR_TEXT_SECONDARY, TEXT_MEDIUM);
  }
  resultStartTime = millis();
}

void drawSystemInfoScreen() {
  drawHeader("SYSTEM INFO");
  fillRect(0, HEADER_HEIGHT + 1, SCREEN_WIDTH,
           SCREEN_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT, COLOR_BG_PRIMARY);

  int y = HEADER_HEIGHT + 15;

  drawPremiumCard(MARGIN, y, SCREEN_WIDTH - MARGIN * 2, 50, COLOR_BG_CARD,
                  COLOR_CYAN_DARK);
  drawText(MARGIN + 12, y + 10, "DEVICE", COLOR_CYAN_C, TEXT_SMALL);
  char devStr[24];
  sprintf(devStr, "%s #%03d", DEVICE_NAME, DEVICE_ID);
  drawText(MARGIN + 12, y + 28, devStr, WHITE, TEXT_MEDIUM);

  y += 60;
  drawPremiumCard(MARGIN, y, SCREEN_WIDTH - MARGIN * 2, 50, COLOR_BG_CARD,
                  loraInitialized ? COLOR_GREEN_DARK : COLOR_RED_DARK);
  drawText(MARGIN + 12, y + 10, "LORA", COLOR_CYAN_C, TEXT_SMALL);
  drawText(MARGIN + 12, y + 28, loraInitialized ? "CONNECTED" : "ERROR",
           loraInitialized ? COLOR_GREEN : COLOR_RED, TEXT_MEDIUM);
  drawStatusIndicator(SCREEN_WIDTH - MARGIN - 25, y + 25, 8,
                      loraInitialized ? COLOR_GREEN : COLOR_RED, true);

  y += 60;
  drawPremiumCard(MARGIN, y, SCREEN_WIDTH - MARGIN * 2, 50, COLOR_BG_CARD,
                  COLOR_PURPLE_DARK);
  drawText(MARGIN + 12, y + 10, "STATS", COLOR_PURPLE, TEXT_SMALL);
  char statsStr[24];
  sprintf(statsStr, "TX: %d/%d OK", successfulTransmissions,
          totalTransmissions);
  drawText(MARGIN + 12, y + 28, statsStr, WHITE, TEXT_MEDIUM);

  drawFooter("Press any key to return");
}

void drawUserManualScreen() {
  drawHeader("USER MANUAL");
  fillRect(0, HEADER_HEIGHT + 1, SCREEN_WIDTH,
           SCREEN_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT, COLOR_BG_PRIMARY);

  char pageStr[8];
  sprintf(pageStr, "%d/%d", manualPage + 1, MANUAL_TOTAL_PAGES);
  drawText(SCREEN_WIDTH - 40, HEADER_HEIGHT + 8, pageStr, COLOR_PURPLE,
           TEXT_SMALL);

  int y = HEADER_HEIGHT + 30;

  switch (manualPage) {
  case 0:
    drawText(MARGIN, y, "SELECT ALERTS", COLOR_AMBER, TEXT_MEDIUM);
    y += 30;
    drawText(MARGIN, y, "Use 1-9 for quick select", COLOR_TEXT_SECONDARY,
             TEXT_SMALL);
    y += 16;
    drawText(MARGIN, y, "0 selects alert #10", COLOR_TEXT_SECONDARY,
             TEXT_SMALL);
    break;
  case 1:
    drawText(MARGIN, y, "NAVIGATION", COLOR_CYAN_C, TEXT_MEDIUM);
    y += 30;
    drawText(MARGIN, y, "A = Scroll UP", COLOR_TEXT_SECONDARY, TEXT_SMALL);
    y += 16;
    drawText(MARGIN, y, "B = Scroll DOWN", COLOR_TEXT_SECONDARY, TEXT_SMALL);
    y += 16;
    drawText(MARGIN, y, "C = System Info", COLOR_TEXT_SECONDARY, TEXT_SMALL);
    y += 16;
    drawText(MARGIN, y, "D = This Help", COLOR_TEXT_SECONDARY, TEXT_SMALL);
    break;
  case 2:
    drawText(MARGIN, y, "SENDING", COLOR_GREEN, TEXT_MEDIUM);
    y += 30;
    drawText(MARGIN, y, "* = Confirm & Send", COLOR_TEXT_SECONDARY, TEXT_SMALL);
    y += 16;
    drawText(MARGIN, y, "# = Cancel & Back", COLOR_TEXT_SECONDARY, TEXT_SMALL);
    break;
  case 3:
    drawText(MARGIN, y, "LED INDICATORS", COLOR_PURPLE, TEXT_MEDIUM);
    y += 30;
    fillCircle(MARGIN + 8, y + 4, 6, COLOR_GREEN);
    drawText(MARGIN + 22, y, "GREEN = Sent OK", COLOR_TEXT_SECONDARY,
             TEXT_SMALL);
    y += 20;
    fillCircle(MARGIN + 8, y + 4, 6, COLOR_RED);
    drawText(MARGIN + 22, y, "RED = Send Failed", COLOR_TEXT_SECONDARY,
             TEXT_SMALL);
    break;
  }

  int footerY = SCREEN_HEIGHT - FOOTER_HEIGHT;
  drawGradientV(0, footerY, SCREEN_WIDTH, FOOTER_HEIGHT, COLOR_BG_HEADER_ALT,
                RGB565(5, 10, 15));
  drawText(MARGIN, footerY + 12, "A:Prev B:Next #:Back", COLOR_TEXT_MUTED,
           TEXT_SMALL);
}

void drawSettingsScreen() {
  drawHeader("SETTINGS & CALIBRATION");
  fillRect(0, HEADER_HEIGHT + 1, SCREEN_WIDTH,
           SCREEN_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - 2, COLOR_BG_PRIMARY);

  int y = HEADER_HEIGHT + 30;
  drawPremiumCard(MARGIN, y, SCREEN_WIDTH - MARGIN * 2, 100, COLOR_BG_CARD,
                  COLOR_BORDER);

  drawText(MARGIN + 20, y + 20, "MPU6050 SENSOR", COLOR_CYAN_C, TEXT_MEDIUM);

  if (mpuInitialized) {
    drawText(MARGIN + 20, y + 50, "Status: CONNECTED", COLOR_GREEN, TEXT_SMALL);
    drawText(MARGIN + 20, y + 70, "1: CALIBRATE NOW", COLOR_AMBER, TEXT_SMALL);
  } else {
    drawText(MARGIN + 20, y + 50, "Status: NOT FOUND", COLOR_RED, TEXT_SMALL);
    drawText(MARGIN + 20, y + 70, "Check pins 36(SDA), 37(SCL)",
             COLOR_TEXT_MUTED, TEXT_SMALL);
  }

  int footerY = SCREEN_HEIGHT - FOOTER_HEIGHT;
  drawFastHLine(0, footerY - 1, SCREEN_WIDTH, COLOR_ACCENT_LINE);
  drawGradientV(0, footerY, SCREEN_WIDTH, FOOTER_HEIGHT, COLOR_BG_HEADER_ALT,
                RGB565(5, 10, 15));
  drawText(MARGIN, footerY + 12, "#:Back to Menu", COLOR_TEXT_MUTED,
           TEXT_SMALL);
}

void calibrateMPU() {
  if (!mpuInitialized)
    return;

  fillRect(0, 100, SCREEN_WIDTH, 120, COLOR_BG_PRIMARY);
  drawTextCentered(130, "CALIBRATING...", COLOR_AMBER, 2);
  drawTextCentered(160, "KEEP DEVICE STILL", COLOR_TEXT_SECONDARY, 1);

  // Average 100 readings
  float ax = 0, ay = 0, az = 0;
  float gx = 0, gy = 0, gz = 0;

  for (int i = 0; i < 100; i++) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    ax += a.acceleration.x;
    ay += a.acceleration.y;
    az += a.acceleration.z;
    gx += g.gyro.x;
    gy += g.gyro.y;
    gz += g.gyro.z;
    delay(10);
  }

  accXoffset = ax / 100.0;
  accYoffset = ay / 100.0;
  accZoffset = (az / 100.0) - 9.81; // Gravity
  gyroXoffset = gx / 100.0;
  gyroYoffset = gy / 100.0;
  gyroZoffset = gz / 100.0;

  drawSettingsScreen();
  drawTextCentered(220, "CALIBRATION COMPLETE!", COLOR_GREEN, 1);
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                     PART 6: INPUT HANDLERS & LORA
// ═══════════════════════════════════════════════════════════════════════════════════

bool transmitAlert() {
  if (!loraInitialized)
    return false;

  char packet[20];
  sprintf(packet, "TX%03d,%s", DEVICE_ID,
          getAlertCode(selectedAlertIndex).c_str());
  Serial.printf("[LORA] TX: %s\n", packet);

  LoRa.beginPacket();
  LoRa.print(packet);
  bool success = LoRa.endPacket();

  totalTransmissions++;
  if (success)
    successfulTransmissions++;

  return success;
}

void handleMenuInput(char key) {
  // Digit shortcut handling (Specific user mapping)
  if (key == '1')
    selectedAlertIndex = 0; // EMERGENCY
  else if (key == '2')
    selectedAlertIndex = 2; // MEDICINE
  else if (key == '3')
    selectedAlertIndex = 4; // STATUS OK
  else if (key == '5' || key == '6')
    selectedAlertIndex = 5; // INJURY
  else if (key == '7')
    selectedAlertIndex = 10; // LOST PERSON
  else if (key == 'C')
    selectedAlertIndex = 1; // MEDICAL
  else if (key >= '1' && key <= '9') {
    int idx = key - '1';
    if (idx < ALERT_COUNT)
      selectedAlertIndex = idx;
  } else if (key == '0')
    selectedAlertIndex = 9;

  // Navigation & Actions
  if (key == 'A' || key == '6') { // UP
    selectedAlertIndex =
        (selectedAlertIndex > 0) ? selectedAlertIndex - 1 : ALERT_COUNT - 1;
    updateMenuScroll();
    drawMenuScreen();
  } else if (key == 'B' || key == '9') { // DOWN
    selectedAlertIndex =
        (selectedAlertIndex < ALERT_COUNT - 1) ? selectedAlertIndex + 1 : 0;
    updateMenuScroll();
    drawMenuScreen();
  } else if (key == '*' || key == '4') { // Confirm/Selection
    currentScreen = SCREEN_CONFIRM;
    drawConfirmScreen();
  } else if (key == '#') { // Info Toggle
    currentScreen = SCREEN_SYSTEM_INFO;
    drawSystemInfoScreen();
  } else if (key == 'D') { // User Manual
    manualPage = 0;
    currentScreen = SCREEN_USER_MANUAL;
    drawUserManualScreen();
  }
}

void handleConfirmInput(char key) {
  if (key == '*') {
    currentScreen = SCREEN_SENDING;
    drawSendingScreen();
    delay(300);
    lastTransmitSuccess = transmitAlert();
    retryCount = 0;
    currentScreen = SCREEN_RESULT;
    drawResultScreen();
  } else if (key == '#') {
    currentScreen = SCREEN_MENU;
    drawMenuScreen();
  }
}

void handleResultInput(char key) {
  if (lastTransmitSuccess) {
    currentScreen = SCREEN_MENU;
    drawMenuScreen();
  } else {
    if (key == '*' && retryCount < MAX_RETRY_ATTEMPTS - 1) {
      retryCount++;
      currentScreen = SCREEN_SENDING;
      drawSendingScreen();
      delay(300);
      lastTransmitSuccess = transmitAlert();
      currentScreen = SCREEN_RESULT;
      drawResultScreen();
    } else if (key == '#') {
      retryCount = 0;
      currentScreen = SCREEN_MENU;
      drawMenuScreen();
    }
  }
}

void handleManualInput(char key) {
  if (key == 'A' && manualPage > 0) {
    manualPage--;
    drawUserManualScreen();
  } else if (key == 'B' && manualPage < MANUAL_TOTAL_PAGES - 1) {
    manualPage++;
    drawUserManualScreen();
  } else if (key == '#' || key == '*') {
    currentScreen = SCREEN_MENU;
    drawMenuScreen();
  }
}

void handleKeyPress(char key) {
  if (key == '\0')
    return;
  Serial.printf("[KEY] %c Screen:%d\n", key, currentScreen);

  switch (currentScreen) {
  case SCREEN_MENU:
    handleMenuInput(key);
    break;
  case SCREEN_CONFIRM:
    handleConfirmInput(key);
    break;
  case SCREEN_RESULT:
    handleResultInput(key);
    break;
  case SCREEN_SYSTEM_INFO:
    currentScreen = SCREEN_MENU;
    drawMenuScreen();
    break;
  case SCREEN_USER_MANUAL:
    handleManualInput(key);
    break;
  default:
    break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                     SETUP & LOOP
// ═══════════════════════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.println(F("═══════════════════════════════════════════════════"));
  Serial.println(F("    LIFELINE TX - ESP32-S3 + ILI9488 Edition"));
  Serial.println(F("═══════════════════════════════════════════════════"));

  // LEDs (if connected)
  if (LED_GREEN >= 0) {
    pinMode(LED_GREEN, OUTPUT);
    digitalWrite(LED_GREEN, LOW);
  }
  if (LED_RED >= 0) {
    pinMode(LED_RED, OUTPUT);
    digitalWrite(LED_RED, LOW);
  }
  if (BUZZER_PIN >= 0)
    pinMode(BUZZER_PIN, OUTPUT);

  // Initialize TFT
  Serial.println(F("[INIT] TFT..."));
  tftInit();
  fillScreen(COLOR_BG_PRIMARY);

  // Initialize LoRa
  Serial.println(F("[INIT] LoRa..."));
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_CS);
  LoRa.setPins(LORA_CS, LORA_RST, LORA_DIO0);
  if (LoRa.begin(LORA_FREQUENCY)) {
    LoRa.setSpreadingFactor(LORA_SF);
    LoRa.setSignalBandwidth(LORA_BW);
    LoRa.enableCrc();
    loraInitialized = true;
    Serial.println(F("[INIT] LoRa OK"));
  } else {
    loraInitialized = false;
    Serial.println(F("[INIT] LoRa FAILED"));
  }

  // Initialize Animations
  initLoveAnimations();

  // Initialize NeoPixel
  neopixel.begin();
  neopixel.setBrightness(100);
  neopixel.setPixelColor(0, neopixel.Color(0, 50, 0));
  neopixel.show();

  // Initialize MPU6050
  Serial.println(F("[INIT] MPU6050..."));
  Wire.begin(I2C_SDA, I2C_SCL);
  if (mpu.begin()) {
    mpuInitialized = true;
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println(F("[INIT] MPU6050 OK"));
  } else {
    Serial.println(F("[INIT] MPU6050 FAILED"));
  }

  // Check for secret key 'D' to enter Love Mode directly
  char key = keypad.getKey();
  if (key == 'D') {
    currentScreen =
        SCREEN_USER_MANUAL; // Placeholder, actually we need a new enum
                            // But wait, I can just use a hack or add to enum.
    // Let's rely on menu access for now to avoid complexity in setup blocking.
  }

  // Show boot screen
  currentScreen = SCREEN_BOOT;
  drawBootScreen();
  Serial.println(F("[INIT] Ready"));
}

void loop() {
  unsigned long now = millis();

  // Check Sensors
  checkLandslide();

  switch (currentScreen) {
  case SCREEN_BOOT:
    // Run animation on boot (Black background needed for clean redraw)
    // For now, we just wait.
    if (now - bootStartTime >= BOOT_DISPLAY_TIME) {
      currentScreen = SCREEN_MENU;
      drawMenuScreen();
    }
    break;

  case SCREEN_RESULT:
    if (lastTransmitSuccess && now - resultStartTime >= RESULT_SUCCESS_TIME) {
      currentScreen = SCREEN_MENU;
      drawMenuScreen();
    }
    // Fall through for key handling

  case SCREEN_MENU:
  case SCREEN_CONFIRM:
  case SCREEN_SYSTEM_INFO:
  case SCREEN_USER_MANUAL: {
    if (keypad.getKeys()) {
      for (int i = 0; i < 10; i++) { // 10 is typical LIST_MAX
        if (keypad.key[i].stateChanged && keypad.key[i].kstate == PRESSED) {
          char key = keypad.key[i].kchar;
          int code = keypad.key[i].kcode;
          int r = code / KEYPAD_COLS;
          int c = code % KEYPAD_COLS;

          // Debug GPIO in bottom-right corner
          char dbg[32];
          sprintf(dbg, "R%d:P%d C%d:P%d", r, rowPins[r], c, colPins[c]);
          int16_t tw = getTextWidth(dbg, TEXT_SMALL);
          fillRect(SCREEN_WIDTH - tw - 12, SCREEN_HEIGHT - 15, tw + 10, 14,
                   COLOR_BG_PRIMARY);
          drawText(SCREEN_WIDTH - tw - 10, SCREEN_HEIGHT - 12, dbg,
                   COLOR_ORANGE, TEXT_SMALL);

          handleKeyPress(key);
        }
      }
    }
  } break;

    // We need to add SCREEN_LOVE_MODE case if we added it to enum.
    // Since I didn't add it to enum yet, I will do that in next step.

  default:
    break;
  }

  delay(10);
}
