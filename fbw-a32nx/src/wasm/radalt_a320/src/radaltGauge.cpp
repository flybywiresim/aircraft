#include "radaltGauge.h"

RadaltGauge RADALT_GAUGE;

__attribute__((export_name("RadAlt_gauge_callback"))) extern "C" MSFS_CALLBACK bool RadAlt_gauge_callback(FsContext ctx, int service_id, void* pData) {
	switch (service_id) {
	case PANEL_SERVICE_PRE_INSTALL: {
		return true;
	} 
	break;
	case PANEL_SERVICE_POST_INSTALL:
		return RADALT_GAUGE.initializeRA();
		break;

	case PANEL_SERVICE_PRE_KILL:
		RADALT_GAUGE.killRA();
		return true;
		break;
	}

	return true;
}