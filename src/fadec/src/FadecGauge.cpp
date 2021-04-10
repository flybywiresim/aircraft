/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#include "FadecGauge.h"

FadecGauge FADEC_GAUGE;

extern "C" {

MSFS_CALLBACK bool FadecGauge_gauge_callback(FsContext ctx, int service_id, void* pData) {
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      return true;
    } break;

    case PANEL_SERVICE_POST_INSTALL: {
      return FADEC_GAUGE.InitializeFADEC();
    } break;

    case PANEL_SERVICE_PRE_DRAW: {
      sGaugeDrawData* drawData = static_cast<sGaugeDrawData*>(pData);
      return FADEC_GAUGE.OnUpdate(drawData->dt);
    } break;

    case PANEL_SERVICE_PRE_KILL: {
      FADEC_GAUGE.KillFADEC();
      return true;
    } break;
  }
  return false;
}
}