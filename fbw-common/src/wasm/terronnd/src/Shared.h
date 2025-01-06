#pragma once

#define DEMO_BUTTON_PY 10.f
#define DEMO_BUTTON_1_PX 10.f
#define DEMO_BUTTON_2_PX 170.f
#define DEMO_BUTTON_3_PX 330.f
#define DEMO_BUTTON_4_PX 490.f
#define DEMO_BUTTON_5_PX 650.f
#define DEMO_BUTTON_6_PX 810.f
#define DEMO_BUTTON_SX 150.f
#define DEMO_BUTTON_SY 75.f

#define MAP_VIEW_RES_X 768
#define MAP_VIEW_RES_Y 500

void  drawButton(struct NVGcontext* vg, int preicon, const char* text, float x, float y, float w, float h, NVGcolor col, float fontSize);
char* cpToUTF8(int cp, char* str);
