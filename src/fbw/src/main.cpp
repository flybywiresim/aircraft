// airbus_fly_by_wire_wasm.cpp

#include <MSFS/MSFS.h>

#include "main.h"
#include "FlyByWireInterface.h"

FlyByWireInterface flyByWireInterface;

__attribute__((export_name("FlyByWire_gauge_callback")))
extern "C" bool FlyByWire_gauge_callback(
  FsContext ctx,
  int service_id,
  void* pData
) {
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
    } break;
  }

  // success
  return true;
}
