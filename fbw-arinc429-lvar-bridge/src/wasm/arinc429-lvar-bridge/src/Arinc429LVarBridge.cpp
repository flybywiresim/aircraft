// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <SimConnect.h>

#include "Arinc429LvarConverter.h"

HANDLE g_hSimConnect;

enum eEvents {
  EVENT_FRAME  //
};

Arinc429LvarConverter lvarConverter;

/**
 * @brief This is called whenever SimConnect receives a message. It has been registered in the module_init function.
 */
void CALLBACK ProcessDispatchCallbacks(SIMCONNECT_RECV* pData, DWORD, void*) {
  switch (pData->dwID) {
    case SIMCONNECT_RECV_ID_EVENT_FRAME:
      lvarConverter.update();
  }
}

/**
 * @brief Initializes the module.
 */
extern "C" MSFS_CALLBACK void module_init(void) {
  g_hSimConnect = 0;

  HRESULT hr = SimConnect_Open(&g_hSimConnect, "fbw-arinc429-lvar-bridge", nullptr, 0, 0, 0);
  if (hr != S_OK) {
    fprintf(stderr, "Arinc429LVarBridge: Could not open SimConnect connection.\n");
    return;
  }

  hr = SimConnect_SubscribeToSystemEvent(g_hSimConnect, EVENT_FRAME, "Frame");
  if (hr != S_OK) {
    fprintf(stderr, "Arinc429LVarBridge: Could not subscribe to \"Frame\" system event.\n");
    return;
  }

  hr = SimConnect_CallDispatch(g_hSimConnect, ProcessDispatchCallbacks, nullptr);
  if (hr != S_OK) {
    fprintf(stderr, "Arinc429LVarBridge: Could not set dispatch callback.\n");
    return;
  }

  lvarConverter.init();
}

/**
 * @brief De-initializes the module.
 */
extern "C" MSFS_CALLBACK void module_deinit(void) {
  if (!g_hSimConnect) {
    return;
  }

  unregister_all_named_vars();

  HRESULT hr = SimConnect_Close(g_hSimConnect);
  if (hr != S_OK) {
    fprintf(stderr, "Arinc429LVarBridge: Could not close SimConnect connection.\n");
    return;
  }
}
