// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "Presets.h"

Presets PRESETS;

__attribute__((export_name("Presets_gauge_callback")))
    extern "C"
    bool Presets_gauge_callback(FsContext ctx, int service_id, void* pData) {

  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      return true;
    } break;
    case PANEL_SERVICE_POST_INSTALL: {
      return PRESETS.initializePRESETS();
    } break;
    case PANEL_SERVICE_PRE_DRAW: {
      sGaugeDrawData* drawData = static_cast<sGaugeDrawData*>(pData);
      return PRESETS.onUpdate(drawData->dt);
    } break;
    case PANEL_SERVICE_PRE_KILL: {
      PRESETS.killPRESETS();
      return true;
    } break;
  }
  return false;
}
