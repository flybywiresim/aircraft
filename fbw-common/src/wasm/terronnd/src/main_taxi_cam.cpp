// Copyright (c) Asobo Studio, All rights reserved. www.asobostudio.com

#include <MSFS/MSFS_MapView.h>
#include <MSFS\Legacy\gauges.h>
#include <MSFS\MSFS.h>
#include <MSFS\MSFS_Render.h>
#include <MSFS\Render\nanovg.h>
#include "Shared.h"

#include <time.h>
#include <random>

#include <math.h>
#include <stdio.h>
#include <string.h>
#include <map>

#ifdef _MSC_VER
#define snprintf _snprintf_s
#elif !defined(__MINGW32__)
#include <iconv.h>
#endif

std::map<FsContext, NVGcontext*> g_MapView3DNVGcontext;

static FsTextureId mapViewTextureId = -1;

static struct {
  FsMapViewMode              eViewMode = FS_MAP_VIEW_MODE_ALTITUDE;
  FsMapViewAltitudeReference eAltRef   = FS_MAP_VIEW_ALTITUDE_REFERENCE_GEOID;
  FsMapView3DOrientation     ePosition = FS_MAP_VIEW_3D_ORIENTATION_FRONTVIEW;

  float fCustomPitch;
  float fCustomBank;
  float fCustomHead;

  bool bEnable3D = true;

  bool bNeedUpdate = false;

  unsigned count = 0;
} mapView3DParam;

// ------------------------
// Callbacks
extern "C" {
MSFS_CALLBACK bool MapView3D_gauge_callback(FsContext ctx, int service_id, void* pData) {
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL:
      return true;
      break;
    case PANEL_SERVICE_POST_INSTALL: {
      srand(time(0));

      NVGparams params;
      params.userPtr             = ctx;
      params.edgeAntiAlias       = true;
      g_MapView3DNVGcontext[ctx] = nvgCreateInternal(&params);

      nvgCreateFont(g_MapView3DNVGcontext[ctx], "icons", "./data/entypo.ttf");
      nvgCreateFont(g_MapView3DNVGcontext[ctx], "sans-bold", "./data/Roboto-Bold.ttf");

      mapViewTextureId = fsMapViewCreate(ctx, 768, 500, 0);
      if (mapViewTextureId == -1) {
        return false;
      }

      fsMapViewSetVisibility(ctx, mapViewTextureId, true);
      fsMapViewSetViewMode(ctx, mapViewTextureId, FS_MAP_VIEW_MODE_AERIAL);
      fsMapViewSet3D(ctx, mapViewTextureId, true);
      fsMapViewSet2DViewFollowMode(ctx, mapViewTextureId, true);
      fsMapViewSet2DViewRadiusInMeters(ctx, mapViewTextureId, 10000.f);
      fsMapViewSetWeatherRadarVisibility(ctx, mapViewTextureId, false);
      fsMapViewSetAltitudeRangeInFeet(ctx, mapViewTextureId, -100, 15000);

      mapView3DParam.bNeedUpdate = true;

      const int size         = 8;
      FsColor   colors[size] = {
          {0.f, 0.f, 0.f, 1.f},
          {0.f, 0.f, 1.f, 1.f},
          {0.f, 1.f, 0.f, 1.f},
          {0.f, 1.f, 1.f, 1.f},
          {1.f, 0.f, 0.f, 1.f},
          {1.f, 0.f, 1.f, 1.f},
          {1.f, 1.f, 0.f, 1.f},
          {1.f, 1.f, 1.f, 1.f},
      };
      fsMapViewSetAltitudeColorList(ctx, mapViewTextureId, colors, size);
      return true;
    } break;

    case PANEL_SERVICE_PRE_UPDATE: {
      // we might not nned custom orientation
      /*       if (mapView3DParam.bEnable3D && mapView3DParam.ePosition == FS_MAP_VIEW_3D_ORIENTATION_CUSTOM) {
              if (++mapView3DParam.count > 200) {
                mapView3DParam.fCustomPitch = nvgDegToRad(rand() % 360 - 180);
                mapView3DParam.fCustomBank  = nvgDegToRad(rand() % 360 - 180);
                mapView3DParam.fCustomHead  = nvgDegToRad(rand() % 360 - 180);
                mapView3DParam.count        = 0;

                fsMapViewSet3DCustomViewOrientationInRadians(ctx, mapViewTextureId, mapView3DParam.fCustomPitch, mapView3DParam.fCustomBank,
                                                             mapView3DParam.fCustomHead);
              }
            } */

      if (mapView3DParam.bNeedUpdate) {
        fsMapViewSetViewMode(ctx, mapViewTextureId, mapView3DParam.eViewMode);
        fsMapViewSetAltitudeReference(ctx, mapViewTextureId, mapView3DParam.eAltRef);
        fsMapViewSet3DViewOrientation(ctx, mapViewTextureId, mapView3DParam.ePosition);
        fsMapViewSet3D(ctx, mapViewTextureId, mapView3DParam.bEnable3D);

        mapView3DParam.bNeedUpdate = false;
      }
      return true;
    } break;

    case PANEL_SERVICE_PRE_DRAW: {
      NVGcontext*     vg          = g_MapView3DNVGcontext[ctx];
      sGaugeDrawData* p_draw_data = (sGaugeDrawData*)pData;

      float pxRatio = (float)p_draw_data->fbWidth / (float)p_draw_data->winWidth;
      nvgBeginFrame(vg, p_draw_data->winWidth, p_draw_data->winHeight, pxRatio);
      nvgResetTransform(vg);

      // NetBingView
      if (mapViewTextureId >= 0) {
        NVGpaint netBingViewPaint = nvgImagePattern(vg, 0, 0, MAP_VIEW_RES_X, MAP_VIEW_RES_Y, 0.0f, mapViewTextureId, 1.f);
        nvgBeginPath(vg);
        nvgRect(vg, 0, 0, MAP_VIEW_RES_X, MAP_VIEW_RES_Y);
        nvgFillPaint(vg, netBingViewPaint);
        nvgFill(vg);
      }

      const char* text;
      text = mapView3DParam.eViewMode == FS_MAP_VIEW_MODE_AERIAL ? "AERIAL" : "ALTITUDE";
      drawButton(vg, 0, text, DEMO_BUTTON_1_PX, DEMO_BUTTON_PY, DEMO_BUTTON_SX, DEMO_BUTTON_SY, nvgRGBA(50, 50, 50, 255), 25.f);

      text = mapView3DParam.eAltRef == FS_MAP_VIEW_ALTITUDE_REFERENCE_GEOID ? "GEOID" : "PLANE";
      drawButton(vg, 0, text, DEMO_BUTTON_2_PX, DEMO_BUTTON_PY, DEMO_BUTTON_SX, DEMO_BUTTON_SY, nvgRGBA(50, 50, 50, 255), 25.f);

      text = mapView3DParam.bEnable3D ? "3D" : "2D";
      drawButton(vg, 0, text, DEMO_BUTTON_3_PX, DEMO_BUTTON_PY, DEMO_BUTTON_SX, DEMO_BUTTON_SY, nvgRGBA(50, 50, 50, 255), 25.f);

      drawButton(vg, 0, "3D FRONT VIEW", DEMO_BUTTON_4_PX, DEMO_BUTTON_PY, DEMO_BUTTON_SX, DEMO_BUTTON_SY, nvgRGBA(50, 50, 50, 255), 25.f);
      drawButton(vg, 0, "3D TOP VIEW", DEMO_BUTTON_5_PX, DEMO_BUTTON_PY, DEMO_BUTTON_SX, DEMO_BUTTON_SY, nvgRGBA(50, 50, 50, 255), 25.f);
      drawButton(vg, 0, "3D CUSTOM", DEMO_BUTTON_6_PX, DEMO_BUTTON_PY, DEMO_BUTTON_SX, DEMO_BUTTON_SY, nvgRGBA(50, 50, 50, 255), 25.f);

      nvgEndFrame(vg);

      return true;
    } break;
    case PANEL_SERVICE_PRE_KILL: {
      NVGcontext* vg = g_MapView3DNVGcontext[ctx];

      fsMapViewDelete(ctx, mapViewTextureId);
      mapViewTextureId = -1;
      nvgDeleteInternal(vg);
      g_MapView3DNVGcontext.erase(ctx);
      return true;
    } break;
  }
  return false;
}

MSFS_CALLBACK void MapView3D_mouse_callback(float fX, float fY, int iFlags) {
  switch (iFlags) {
      // Mouse click event
    case MOUSE_LEFTSINGLE:

      // Switch to the next demo
      if (fX >= DEMO_BUTTON_1_PX && fX < DEMO_BUTTON_1_PX + DEMO_BUTTON_SX && fY >= DEMO_BUTTON_PY &&
          fY < DEMO_BUTTON_PY + DEMO_BUTTON_SY) {
        if (mapView3DParam.eViewMode == FS_MAP_VIEW_MODE_AERIAL)
          mapView3DParam.eViewMode = FS_MAP_VIEW_MODE_ALTITUDE;
        else
          mapView3DParam.eViewMode = FS_MAP_VIEW_MODE_AERIAL;

        mapView3DParam.bNeedUpdate = true;
      } else if (fX >= DEMO_BUTTON_2_PX && fX < DEMO_BUTTON_2_PX + DEMO_BUTTON_SX && fY >= DEMO_BUTTON_PY &&
                 fY < DEMO_BUTTON_PY + DEMO_BUTTON_SY) {
        if (mapView3DParam.eAltRef == FS_MAP_VIEW_ALTITUDE_REFERENCE_GEOID)
          mapView3DParam.eAltRef = FS_MAP_VIEW_ALTITUDE_REFERENCE_PLANE;
        else
          mapView3DParam.eAltRef = FS_MAP_VIEW_ALTITUDE_REFERENCE_GEOID;

        mapView3DParam.bNeedUpdate = true;
      } else if (fX >= DEMO_BUTTON_3_PX && fX < DEMO_BUTTON_3_PX + DEMO_BUTTON_SX && fY >= DEMO_BUTTON_PY &&
                 fY < DEMO_BUTTON_PY + DEMO_BUTTON_SY) {
        mapView3DParam.bEnable3D   = !mapView3DParam.bEnable3D;
        mapView3DParam.bNeedUpdate = true;
      } else if (fX >= DEMO_BUTTON_4_PX && fX < DEMO_BUTTON_4_PX + DEMO_BUTTON_SX && fY >= DEMO_BUTTON_PY &&
                 fY < DEMO_BUTTON_PY + DEMO_BUTTON_SY) {
        mapView3DParam.ePosition   = FS_MAP_VIEW_3D_ORIENTATION_FRONTVIEW;
        mapView3DParam.bNeedUpdate = true;
      } else if (fX >= DEMO_BUTTON_5_PX && fX < DEMO_BUTTON_5_PX + DEMO_BUTTON_SX && fY >= DEMO_BUTTON_PY &&
                 fY < DEMO_BUTTON_PY + DEMO_BUTTON_SY) {
        mapView3DParam.ePosition   = FS_MAP_VIEW_3D_ORIENTATION_TOPVIEW;
        mapView3DParam.bNeedUpdate = true;
      } else if (fX >= DEMO_BUTTON_6_PX && fX < DEMO_BUTTON_6_PX + DEMO_BUTTON_SX && fY >= DEMO_BUTTON_PY &&
                 fY < DEMO_BUTTON_PY + DEMO_BUTTON_SY) {
        mapView3DParam.ePosition   = FS_MAP_VIEW_3D_ORIENTATION_CUSTOM;
        mapView3DParam.bNeedUpdate = true;
      }
      break;
    default:
      break;
  }
}
}
