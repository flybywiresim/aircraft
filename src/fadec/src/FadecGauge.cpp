#include "FadecGauge.h"

FadecGauge FADEC_GAUGE;

__attribute__((export_name("FadecGauge_gauge_callback"))) extern "C" bool FadecGauge_gauge_callback(FsContext ctx,
                                                                                                    int service_id,
                                                                                                    void* pData) {
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      return true;
    } break;
    case PANEL_SERVICE_POST_INSTALL: {
      return FADEC_GAUGE.initializeFADEC();
    } break;
    case PANEL_SERVICE_PRE_DRAW: {
      /* Start updating the engines only if all needed data was fetched */
      /* Due to the data fetching feature from the sim being available at this stage only (from what I have observed) */
      /* Event SIMCONNECT_RECV_ID_OPEN received after the first PANEL_SERVICE_POST_INSTALL */
      if(FADEC_GAUGE.isReady()) {
        sGaugeDrawData* drawData = static_cast<sGaugeDrawData*>(pData);
        return FADEC_GAUGE.onUpdate(drawData->dt);
      } else {
        return FADEC_GAUGE.fetchNeededData();
      }
    } break;
    case PANEL_SERVICE_PRE_KILL: {
      FADEC_GAUGE.killFADEC();
      return true;
    } break;
  }
  return false;
}
