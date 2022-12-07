#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>

#include "interface/SimConnectInterface.h"
#include "main.h"

SimConnectInterface simconnect;

__attribute__((export_name("terronnd_gauge_callback"))) extern "C" bool terronnd_gauge_callback(FsContext ctx,
                                                                                                int service_id,
                                                                                                void* pData) {
  // print event type
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      // connect to sim connect
      return simconnect.connect();
    };

    case PANEL_SERVICE_PRE_DRAW: {
      // read data & inputs, step model, write output
      return simconnect.update();
      // return flyByWireInterface.update(static_cast<sGaugeDrawData*>(pData)->dt);
    };

    case PANEL_SERVICE_PRE_KILL: {
      // disconnect sim connect
      simconnect.disconnect();
    } break;
  }

  // success
  return true;
}
