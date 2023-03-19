#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-function"
#include <MSFS/MSFS.h>
#pragma clang diagnostic pop
#include <algorithm>
#include <memory>
#include <string>

#include "main.h"
#include "simconnect/connection.hpp"
#include "userinputs/Keyboard.h"

simconnect::Connection connection;
std::shared_ptr<userinputs::Keyboard> keyboard;

extern "C" {
MSFS_CALLBACK bool KeyboardMapper_gauge_callback(FsContext /* ctx */, int service_id, void* /* pData */) {
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      bool connected = connection.connect("FBW_KEYBOARD_MAPPER_CONNECTION");
      if (connected) {
        if (!keyboard) {
          keyboard = std::shared_ptr<userinputs::Keyboard>(new userinputs::Keyboard(connection));
        }
      }
      return connected;
    }
    case PANEL_SERVICE_POST_INSTALL:
      std::cout << "WASM: Installed keyboard mapper" << std::endl;
      break;
    case PANEL_SERVICE_PRE_DRAW:
      if (!connection.readData()) {
        return false;
      }
      break;
    case PANEL_SERVICE_PRE_KILL: {
      connection.disconnect();
      break;
    }
  }

  return true;
}
}
