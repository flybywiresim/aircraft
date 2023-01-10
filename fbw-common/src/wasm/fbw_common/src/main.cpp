#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <MSFS/Render/nanovg.h>
#include <MSFS/Render/stb_image.h>

#include <chrono>
#include <iostream>
#include <map>

#include "config.h"
#include "interface/SimConnectInterface.h"
#include "main.h"
#include "maprenderer.h"

SimConnectInterface simconnect;
MapRenderer renderer;

#if BUILD_SIDE_CAPT
__attribute__((export_name("terronnd_left_gauge_callback")))
#elif BUILD_SIDE_FO
__attribute__((export_name("terronnd_right_gauge_callback")))
#endif
extern "C" bool
terronnd_gauge_callback(FsContext ctx, int service_id, void* pData) {
  // print event type
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      // connect to sim connect
      return simconnect.connect();
    };
    case PANEL_SERVICE_POST_INSTALL: {
      renderer.initialize(ctx);
      break;
    }
    case PANEL_SERVICE_PRE_DRAW: {
      const bool retval = simconnect.update();

      if (simconnect.receivedFrameData()) {
        renderer.newMap(ctx, simconnect.frameData(), simconnect.metadata().frameByteCount);
        simconnect.processedFrame();
      }

      renderer.update(ctx, simconnect.currentNdMode(), simconnect.terrainMapActive());
      renderer.render((sGaugeDrawData*)pData, ctx);

      return retval;
    };

    case PANEL_SERVICE_PRE_KILL: {
      // disconnect sim connect
      simconnect.disconnect();
      renderer.destroy(ctx);
      break;
    }
  }

  // success
  return true;
}
