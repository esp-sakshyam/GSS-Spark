/*
 * ANSU PROPOSAL - HIGH PERFORMANCE EDITION
 *
 * Optimized for speed and aesthetics.
 * - Unrolled bit-banging
 * - Sine wave particle physics
 * - Smooth geometric hearts
 */

#include "Pinout.h"
#include <Adafruit_NeoPixel.h>
#include <Arduino.h>
#include <vector>

// ═══════════════════════════════════════════════════════════════════════════
//                         CONFIG
// ═══════════════════════════════════════════════════════════════════════════

#define SCREEN_WIDTH 320
#define SCREEN_HEIGHT 480

// Colors
#define BLACK 0x0000
#define WHITE 0xFFFF
#define RED 0xF800
#define PINK 0xFC18
#define DEEP_RED 0xA000
#define PURPLE 0x780F
#define GOLD 0xFFE0

Adafruit_NeoPixel strip(NEOPIXEL_COUNT, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

enum Scene { SCENE_INTRO, SCENE_MESSAGE_1, SCENE_MESSAGE_2, SCENE_PROPOSAL };

Scene currentScene = SCENE_INTRO;
unsigned long sceneStartTime = 0;

// ═══════════════════════════════════════════════════════════════════════════
//                         OPTIMIZED DRIVER
// ═══════════════════════════════════════════════════════════════════════════

// Direct GPIO write macros could be even faster, but simple unrolling is a huge
// step up from loop
void writeData8(uint8_t d) {
  digitalWrite(TFT_D0, (d) & 0x01);
  digitalWrite(TFT_D1, (d >> 1) & 0x01);
  digitalWrite(TFT_D2, (d >> 2) & 0x01);
  digitalWrite(TFT_D3, (d >> 3) & 0x01);
  digitalWrite(TFT_D4, (d >> 4) & 0x01);
  digitalWrite(TFT_D5, (d >> 5) & 0x01);
  digitalWrite(TFT_D6, (d >> 6) & 0x01);
  digitalWrite(TFT_D7, (d >> 7) & 0x01);

  digitalWrite(TFT_WR, LOW);
  digitalWrite(TFT_WR, HIGH);
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

void tftInit() {
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
  writeDataByte(0x48); // Memory access control
  writeCommand(0x29);
  delay(50); // Display ON
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
  if (x + w > SCREEN_WIDTH)
    w = SCREEN_WIDTH - x;
  if (y + h > SCREEN_HEIGHT)
    h = SCREEN_HEIGHT - y;
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

// ═══════════════════════════════════════════════════════════════════════════
//                         GRAPHICS - GEOMETRIC HEART
// ═══════════════════════════════════════════════════════════════════════════

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

// Basic circle filling for smooth hearts
void fillCircle(int16_t x0, int16_t y0, int16_t r, uint16_t color) {
  for (int16_t y = -r; y <= r; y++) {
    int16_t w = (int16_t)sqrt(r * r - y * y);
    fillRect(x0 - w, y0 + y, 2 * w + 1, 1, color);
  }
}

// Standard triangle fill
void fillTriangle(int16_t x0, int16_t y0, int16_t x1, int16_t y1, int16_t x2,
                  int16_t y2, uint16_t color) {
  int16_t a, b, y, last;
  if (y0 > y1) {
    std::swap(y0, y1);
    std::swap(x0, x1);
  }
  if (y1 > y2) {
    std::swap(y1, y2);
    std::swap(x1, x2);
  }
  if (y0 > y1) {
    std::swap(y0, y1);
    std::swap(x0, x1);
  }

  if (y0 == y2) { // Handle single line cases
    a = b = x0;
    if (x1 < a)
      a = x1;
    else if (x1 > b)
      b = x1;
    if (x2 < a)
      a = x2;
    else if (x2 > b)
      b = x2;
    fillRect(a, y0, b - a + 1, 1, color);
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
    if (a > b)
      std::swap(a, b);
    fillRect(a, y, b - a + 1, 1, color);
  }

  sa = dx12 * (y - y1);
  sb = dx02 * (y - y0);
  for (; y <= y2; y++) {
    a = x1 + sa / dy12;
    b = x0 + sb / dy02;
    sa += dx12;
    sb += dx02;
    if (a > b)
      std::swap(a, b);
    fillRect(a, y, b - a + 1, 1, color);
  }
}

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

// ═══════════════════════════════════════════════════════════════════════════
//                         TEXT
// ═══════════════════════════════════════════════════════════════════════════

const uint8_t font5x7[96][5] PROGMEM = {
    {0x00, 0x00, 0x00, 0x00, 0x00}, {0x00, 0x00, 0x5F, 0x00, 0x00},
    {0x00, 0x07, 0x00, 0x07, 0x00}, {0x14, 0x7F, 0x14, 0x7F, 0x14},
    {0x24, 0x2A, 0x7F, 0x2A, 0x12}, {0x23, 0x13, 0x08, 0x64, 0x62},
    {0x36, 0x49, 0x55, 0x22, 0x50}, {0x00, 0x05, 0x03, 0x00, 0x00},
    {0x00, 0x1C, 0x22, 0x41, 0x00}, {0x00, 0x41, 0x22, 0x1C, 0x00},
    {0x08, 0x2A, 0x1C, 0x2A, 0x08}, {0x08, 0x08, 0x3E, 0x08, 0x08},
    {0x00, 0x50, 0x30, 0x00, 0x00}, {0x08, 0x08, 0x08, 0x08, 0x08},
    {0x00, 0x60, 0x60, 0x00, 0x00}, {0x20, 0x10, 0x08, 0x04, 0x02},
    {0x3E, 0x51, 0x49, 0x45, 0x3E}, {0x00, 0x42, 0x7F, 0x40, 0x00},
    {0x42, 0x61, 0x51, 0x49, 0x46}, {0x21, 0x41, 0x45, 0x4B, 0x31},
    {0x18, 0x14, 0x12, 0x7F, 0x10}, {0x27, 0x45, 0x45, 0x45, 0x39},
    {0x3C, 0x4A, 0x49, 0x49, 0x30}, {0x01, 0x71, 0x09, 0x05, 0x03},
    {0x36, 0x49, 0x49, 0x49, 0x36}, {0x06, 0x49, 0x49, 0x29, 0x1E},
    {0x00, 0x36, 0x36, 0x00, 0x00}, {0x00, 0x56, 0x36, 0x00, 0x00},
    {0x00, 0x08, 0x14, 0x22, 0x41}, {0x14, 0x14, 0x14, 0x14, 0x14},
    {0x41, 0x22, 0x14, 0x08, 0x00}, {0x02, 0x01, 0x51, 0x09, 0x06},
    {0x32, 0x49, 0x79, 0x41, 0x3E}, {0x7E, 0x11, 0x11, 0x11, 0x7E},
    {0x7F, 0x49, 0x49, 0x49, 0x36}, {0x3E, 0x41, 0x41, 0x41, 0x22},
    {0x7F, 0x41, 0x41, 0x22, 0x1C}, {0x7F, 0x49, 0x49, 0x49, 0x41},
    {0x7F, 0x09, 0x09, 0x01, 0x01}, {0x3E, 0x41, 0x41, 0x51, 0x32},
    {0x7F, 0x08, 0x08, 0x08, 0x7F}, {0x00, 0x41, 0x7F, 0x41, 0x00},
    {0x20, 0x40, 0x41, 0x3F, 0x01}, {0x7F, 0x08, 0x14, 0x22, 0x41},
    {0x7F, 0x40, 0x40, 0x40, 0x40}, {0x7F, 0x02, 0x04, 0x02, 0x7F},
    {0x7F, 0x04, 0x08, 0x10, 0x7F}, {0x3E, 0x41, 0x41, 0x41, 0x3E},
    {0x7F, 0x09, 0x09, 0x09, 0x06}, {0x3E, 0x41, 0x51, 0x21, 0x5E},
    {0x7F, 0x09, 0x19, 0x29, 0x46}, {0x46, 0x49, 0x49, 0x49, 0x31},
    {0x01, 0x01, 0x7F, 0x01, 0x01}, {0x3F, 0x40, 0x40, 0x40, 0x3F},
    {0x1F, 0x20, 0x40, 0x20, 0x1F}, {0x7F, 0x20, 0x18, 0x20, 0x7F},
    {0x63, 0x14, 0x08, 0x14, 0x63}, {0x03, 0x04, 0x78, 0x04, 0x03},
    {0x61, 0x51, 0x49, 0x45, 0x43}, {0x00, 0x00, 0x7F, 0x41, 0x41},
    {0x02, 0x04, 0x08, 0x10, 0x20}, {0x41, 0x41, 0x7F, 0x00, 0x00},
    {0x04, 0x02, 0x01, 0x02, 0x04}, {0x40, 0x40, 0x40, 0x40, 0x40},
    {0x00, 0x01, 0x02, 0x04, 0x00}, {0x20, 0x54, 0x54, 0x54, 0x78},
    {0x7F, 0x48, 0x44, 0x44, 0x38}, {0x38, 0x44, 0x44, 0x44, 0x20},
    {0x38, 0x44, 0x44, 0x48, 0x7F}, {0x38, 0x54, 0x54, 0x54, 0x18},
    {0x08, 0x7E, 0x09, 0x01, 0x02}, {0x08, 0x14, 0x54, 0x54, 0x3C},
    {0x7F, 0x08, 0x04, 0x04, 0x78}, {0x00, 0x44, 0x7D, 0x40, 0x00},
    {0x20, 0x40, 0x44, 0x3D, 0x00}, {0x00, 0x7F, 0x10, 0x28, 0x44},
    {0x00, 0x41, 0x7F, 0x40, 0x00}, {0x7C, 0x04, 0x18, 0x04, 0x78},
    {0x7C, 0x08, 0x04, 0x04, 0x78}, {0x38, 0x44, 0x44, 0x44, 0x38},
    {0x7C, 0x14, 0x14, 0x14, 0x08}, {0x08, 0x14, 0x14, 0x18, 0x7C},
    {0x7C, 0x08, 0x04, 0x04, 0x08}, {0x48, 0x54, 0x54, 0x54, 0x20},
    {0x04, 0x3F, 0x44, 0x40, 0x20}, {0x3C, 0x40, 0x40, 0x20, 0x7C},
    {0x1C, 0x20, 0x40, 0x20, 0x1C}, {0x3C, 0x40, 0x30, 0x40, 0x3C},
    {0x44, 0x28, 0x10, 0x28, 0x44}, {0x0C, 0x50, 0x50, 0x50, 0x3C},
    {0x44, 0x64, 0x54, 0x4C, 0x44}, {0x00, 0x08, 0x36, 0x41, 0x00},
    {0x00, 0x00, 0x7F, 0x00, 0x00}, {0x00, 0x41, 0x36, 0x08, 0x00},
    {0x08, 0x08, 0x2A, 0x1C, 0x08}, {0x08, 0x1C, 0x2A, 0x08, 0x08},
};

void drawChar(int16_t x, int16_t y, char c, uint16_t color, uint8_t size) {
  if (c < 32 || c > 127)
    c = ' ';
  uint8_t idx = c - 32;
  for (int col = 0; col < 5; col++) {
    uint8_t line = pgm_read_byte(&font5x7[idx][col]);
    for (int row = 0; row < 7; row++) {
      if (line & (1 << row)) {
        if (size == 1)
          drawPixel(x + col, y + row, color);
        else
          fillRect(x + col * size, y + row * size, size, size, color);
      }
    }
  }
}

void drawText(int16_t x, int16_t y, const char *text, uint16_t color,
              uint8_t size) {
  while (*text) {
    drawChar(x, y, *text++, color, size);
    x += 6 * size;
  }
}

void drawTextCentered(int16_t y, const char *text, uint16_t color,
                      uint8_t size) {
  int len = strlen(text);
  int16_t x = (SCREEN_WIDTH - len * 6 * size) / 2;
  drawText(x, y, text, color, size);
}

// ═══════════════════════════════════════════════════════════════════════════
//                         FLOATING HEART PHYSICS
// ═══════════════════════════════════════════════════════════════════════════

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
      color = RED;
    else if (r == 1)
      color = PINK;
    else if (r == 2)
      color = DEEP_RED;
    else
      color = PURPLE;
  }

  void update(unsigned long t) {
    // Erase old
    drawSmoothHeart((int)x, (int)y, size, BLACK);

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

// ═══════════════════════════════════════════════════════════════════════════
//                         MAIN CODE
// ═══════════════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(100);

  strip.begin();
  strip.setBrightness(100);
  strip.setPixelColor(0, strip.Color(255, 0, 0));
  strip.show();

  tftInit();
  fillScreen(BLACK);

  for (int i = 0; i < MAX_HEARTS; i++)
    hearts.push_back(FloatingHeart());
  sceneStartTime = millis();
}

void loop() {
  unsigned long now = millis();
  unsigned long elapsed = now - sceneStartTime;

  // LED Pulse (Smoother sine)
  float pulse = (sin(now / 250.0) + 1.0) / 2.0;
  strip.setPixelColor(0, strip.Color(30 + (int)(225 * pulse), 0, 0));
  strip.show();

  switch (currentScene) {
  case SCENE_INTRO:
    if (elapsed < 2000) {
      // Wait
    } else if (elapsed < 5000) {
      drawTextCentered(220, "Hello Anshu...", WHITE, 3);
    } else if (elapsed < 6000) {
      drawTextCentered(220, "Hello Anshu...", BLACK, 3);
    } else {
      currentScene = SCENE_MESSAGE_1;
      sceneStartTime = now;
    }
    break;

  case SCENE_MESSAGE_1:
    for (auto &h : hearts)
      h.update(now);

    if (elapsed > 500 && elapsed < 4000) {
      drawTextCentered(170, "I have something", WHITE, 2);
      drawTextCentered(200, "to tell you...", WHITE, 2);
    } else if (elapsed > 4000) {
      drawTextCentered(170, "I have something", BLACK, 2);
      drawTextCentered(200, "to tell you...", BLACK, 2);
      currentScene = SCENE_MESSAGE_2;
      sceneStartTime = now;
      fillScreen(BLACK); // Flash clear
    }
    break;

  case SCENE_MESSAGE_2:
    for (auto &h : hearts)
      h.update(now);

    if (elapsed < 4000) {
      drawTextCentered(170, "You make my", PINK, 3);
      drawTextCentered(210, "world brighter", PINK, 3);
    } else {
      drawTextCentered(170, "You make my", BLACK, 3);
      drawTextCentered(210, "world brighter", BLACK, 3);
      currentScene = SCENE_PROPOSAL;
      sceneStartTime = now;
    }
    break;

  case SCENE_PROPOSAL:
    for (auto &h : hearts)
      h.update(now);

    // Heartbeat pulse size
    int heartSize = 65 + (int)(15 * sin(now / 150.0));
    drawSmoothHeart(SCREEN_WIDTH / 2, 220, heartSize, RED);

    drawTextCentered(80, "ANSHU", WHITE, 4);
    drawTextCentered(130, "MY LOVE", GOLD, 2);

    drawTextCentered(330, "Will you be", WHITE, 3);
    drawTextCentered(370, "mine forever?", WHITE, 3);
    break;
  }
}

