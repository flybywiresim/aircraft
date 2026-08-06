#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-function"
#include <MSFS/MSFS.h>
#pragma clang diagnostic pop
#include <MSFS/MSFS_GaugeContext.h>
#include <MSFS/MSFS_WindowsTypes.h>

#include <algorithm>
#include <memory>
#include <string>

#include "main.h"
#include "navigationdisplay/collection.h"
#include "simconnect/connection.hpp"

std::shared_ptr<navigationdisplay::Collection> displays;
simconnect::Connection                         connection;

extern "C" {
MSFS_CALLBACK bool terronnd_gauge_init(FsContext ctx, sGaugeInstallData* pInstallData) {
  bool connected = connection.connect("FBW_TERRONND_CONNECTION");
  if (connected) {
    if (displays == nullptr) {
      displays = std::shared_ptr<navigationdisplay::Collection>(new navigationdisplay::Collection(connection));
    }

    std::string parameter = std::string(pInstallData->strParameters);
    std::transform(parameter.begin(), parameter.end(), parameter.begin(), ::toupper);

    if (parameter.length() != 0) {
      displays->registerDisplay(static_cast<navigationdisplay::DisplaySide>(parameter[0]), ctx, connection);
    }
  }
  if (!connection.requestSimConnectUpdates()) {
    return false;
  }
  return connected;
}

MSFS_CALLBACK bool terronnd_gauge_update(FsContext ctx, float dTime) {
  connection.updateLVarObjects();

  displays->updateDisplay(ctx);

  return true;
}

MSFS_CALLBACK bool terronnd_gauge_draw(FsContext ctx, sGaugeDrawData* pDrawData) {
  displays->renderDisplay(pDrawData, ctx);

  return true;
}

MSFS_CALLBACK bool terronnd_gauge_kill(FsContext ctx) {
  connection.disconnect();

  return true;
}
}
