#include <MSFS/MSFS.h>
#include <MSFS/MSFS_CommBus.h>

#include "FlyByWireInterface.h"
#include "main.h"

FlyByWireInterface flyByWireInterface;

__attribute__((export_name("fbw_gauge_callback"))) extern "C" bool fbw_gauge_callback(FsContext ctx, int service_id, void* pData) {
  // print event type
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      // connect to sim connect
      return flyByWireInterface.connect();
    };

    case PANEL_SERVICE_PRE_DRAW: {
      // read data & inputs, step model, write output
      return flyByWireInterface.update(static_cast<sGaugeDrawData*>(pData)->dt);
    };

    case PANEL_SERVICE_PRE_KILL: {
      // disconnect sim connect
      flyByWireInterface.disconnect();
      fsCommBusUnregisterAll();
    } break;
  }

  // success
  return true;
}
