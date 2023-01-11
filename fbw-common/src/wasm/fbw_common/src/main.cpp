#include <MSFS/MSFS.h>
#include <algorithm>
#include <memory>
#include <string>

#include "main.h"
#include "navigationdisplay/collection.h"
#include "simconnect/connection.hpp"

std::shared_ptr<navigationdisplay::Collection> displays;
simconnect::Connection connection;

extern "C" {
MSFS_CALLBACK bool terronnd_gauge_callback(FsContext ctx, int service_id, void* pData) {
  std::cout << "TERR ON ND: TESTING TESTING" << std::endl;
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      bool connected = connection.connect("FBW_TERRONND_CONNECTION");
      if (connected) {
        sGaugeInstallData* installData = (sGaugeInstallData*)pData;

        if (displays == nullptr) {
          displays = std::shared_ptr<navigationdisplay::Collection>(
              new navigationdisplay::Collection(connection, installData->iSizeX, installData->iSizeY));
        }

        std::string parameter = std::string(installData->strParameters);
        std::transform(parameter.begin(), parameter.end(), parameter.begin(), ::toupper);

        if (parameter.length() != 0) {
          displays->registerDisplay(static_cast<navigationdisplay::DisplaySide>(parameter[0]), ctx, connection);
        }
      }
      return connected;
    }
    case PANEL_SERVICE_POST_INSTALL:
      break;
    case PANEL_SERVICE_PRE_DRAW:
      if (!connection.readData()) {
        return false;
      }

      displays->updateDisplay(ctx);
      displays->renderDisplay((sGaugeDrawData*)pData, ctx);
      break;
    case PANEL_SERVICE_PRE_KILL: {
      connection.disconnect();
      break;
    }
  }

  return true;
}
}
