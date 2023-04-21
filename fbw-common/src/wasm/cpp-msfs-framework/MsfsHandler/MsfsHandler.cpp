// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <algorithm>
#include <functional>

#include "Callback.h"
#include "ClientEvent.h"
#include "Module.h"
#include "MsfsHandler.h"
#include "NamedVariable.h"

// =================================================================================================
// PUBLIC METHODS
// =================================================================================================

void MsfsHandler::registerModule(Module* pModule) {
  modules.push_back(pModule);
}

bool MsfsHandler::initialize() {
  // Initialize SimConnect
  bool result;
  result = SUCCEEDED(SimConnect_Open(&hSimConnect, simConnectName.c_str(), nullptr, 0, 0, 0));
  if (!result) {
    LOG_ERROR(simConnectName + ": Failed to initialize SimConnect");
    return false;
  }
  LOG_INFO(simConnectName + ": Initialized SimConnect");

  // Initialize data manager
  result = dataManager.initialize(hSimConnect);
  if (!result) {
    LOG_ERROR(simConnectName + ": Failed to initialize data manager");
    return false;
  }
  LOG_INFO(simConnectName + ": Initialized data manager");

  // This is a workaround to be able to use a member function as callback as the API callback
  // function must be static.
  // See https://blog.mbedded.ninja/programming/languages/c-plus-plus/callbacks/#static-variables-with-templating
  Callback<void(ID32, UINT32, UINT32, UINT32, UINT32, UINT32, PVOID)>::func =
      [ObjectPtr = &dataManager](auto&& PH1, auto&& PH2, auto&& PH3, auto&& PH4, auto&& PH5, auto&& PH6, [[maybe_unused]] auto&& PH7) {
        ObjectPtr->processKeyEvent(std::forward<decltype(PH1)>(PH1), std::forward<decltype(PH2)>(PH2), std::forward<decltype(PH3)>(PH3),
                                   std::forward<decltype(PH4)>(PH4), std::forward<decltype(PH5)>(PH5), std::forward<decltype(PH6)>(PH6));
      };
  keyEventHandlerEx1 =
      static_cast<GAUGE_KEY_EVENT_HANDLER_EX1>(Callback<void(ID32, UINT32, UINT32, UINT32, UINT32, UINT32, PVOID)>::callback);

  // Register as key event handler
  register_key_event_handler_EX1(keyEventHandlerEx1, nullptr);

  // initialize all data variables needed for the MsfsHandler itself
  aircraftDevelopmentState = dataManager.make_named_var("DEVELOPER_STATE", UNITS.Number);
  aircraftIsReady = dataManager.make_named_var("IS_READY", UNITS.Bool);

  // base sim data mainly for pause detection
  std::vector<DataDefinition> baseDataDef = {
      {"SIMULATION TIME", 0, UNITS.Number},
  };
  baseSimData = dataManager.make_datadefinition_var<BaseSimData>("BASE DATA", baseDataDef);
  if (!SUCCEEDED(baseSimData->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME))) {
    LOG_ERROR(simConnectName + ": Failed to request periodic data for base sim data");
    return false;
  }

  // OBS
  // Pause events are unfortunately broken in the current sim version 1.30.12
  // the code below is a prototype for pause detection via system events which is not yet working
  // because of this sim issue:
  // https://devsupport.flightsimulator.com/questions/12506/pause-ex1-system-event-has-issues-with-active-paus.html
  //
  // Pause detection via System Events
  // #define PAUSE_STATE_FLAG_OFF 0 // No Pause
  // #define PAUSE_STATE_FLAG_PAUSE 1 // "full" Pause (sim + traffic + etc...)
  // #define PAUSE_STATE_FLAG_PAUSE_WITH_SOUND 2 // FSX Legacy Pause (not used anymore)
  // #define PAUSE_STATE_FLAG_ACTIVE_PAUSE 4 // Pause was activated using the "Active Pause" Button
  // #define PAUSE_STATE_FLAG_SIM_PAUSE 8 // Pause the player sim but traffic, multi, etc... will still run
  a32nxPauseDetected = dataManager.make_named_var("PAUSE_DETECTED", UNITS.Number, true, true);
  pauseDetectedEvent = dataManager.make_client_event("A32NX.PAUSE_DETECTED_EVENT", false);
  pauseDetectedEventCallbackId =
      pauseDetectedEvent->addCallback([&](const int, const DWORD param0, const DWORD, const DWORD, const DWORD, const DWORD) {
        LOG_INFO(simConnectName + ": Pause detected: " + std::to_string(param0));
        a32nxPauseDetected->setAndWriteToSim(param0);
      });
  if (!SUCCEEDED(SimConnect_SubscribeToSystemEvent(hSimConnect, pauseDetectedEvent->getClientEventId(), "Pause_EX1"))) {
    LOG_ERROR(simConnectName + ": Failed to subscribe to PAUSE_EX1 event");
    return false;
  }
  LOG_INFO(simConnectName + ": Subscribed to PAUSE_EX1 event");

  // Initialize modules
  result = std::all_of(modules.begin(), modules.end(), [](Module* pModule) { return pModule->initialize(); });
  if (!result) {
    LOG_ERROR(simConnectName + ": Failed to initialize modules");
    return false;
  }
  LOG_INFO(simConnectName + ": Initialized modules");

  LOG_INFO(simConnectName + ": Initialized");
  isInitialized = result;
  return result;
}

bool MsfsHandler::update(sGaugeDrawData* pData) {
  if (!isInitialized) {
    LOG_ERROR(simConnectName + ": MsfsHandler::update() - not initialized");
    return false;
  }

  // initial request of data from sim to retrieve all requests which have
  // periodic updates enabled. This includes the base sim data for pause detection.
  // Other data without periodic updates are requested either in the data manager or
  // in the modules.
  dataManager.getRequestedData();

  // Pause detection
  // In all pause states except active pause return immediately.
  // Active pause can be handled by the modules but usually simulation should run normally in
  // active pause with just the aircraft not moving.
  if (a32nxPauseDetected->readFromSim()) {
    if (a32nxPauseDetected->getAsInt64() > 0) {
      if (a32nxPauseDetected->getAsInt64() != 4) {
        // LOG_DEBUG(simConnectName + ": Pause detected = " + std::to_string(a32nxPauseDetected->getAsInt64()));
        return true;
      }
      // LOG_DEBUG(simConnectName + ": Active Pause detected = " + std::to_string(a32nxPauseDetected->getAsInt64()));
    }
  }

  // read and update base data from sim
  aircraftIsReady->readFromSim();
  aircraftDevelopmentState->readFromSim();
  timeStamp = baseSimData->data().simulationTime;
  tickCounter++;

#ifdef PROFILING
  profiler.start();
#endif

  // Call preUpdate(), update() and postUpdate() for all modules
  // Datamanager is always called first to ensure that all variables are updated before the modules
  // are called.

  // PRE UPDATE
  bool result = true;
  result &= dataManager.preUpdate(pData);
  result &= std::all_of(modules.begin(), modules.end(), [&pData](Module* pModule) { return pModule->preUpdate(pData); });

  // UPDATE
  result &= dataManager.update(pData);
  result &= std::all_of(modules.begin(), modules.end(), [&pData](Module* pModule) { return pModule->update(pData); });

  // POST UPDATE
  result &= dataManager.postUpdate(pData);
  result &= std::all_of(modules.begin(), modules.end(), [&pData](Module* pModule) { return pModule->postUpdate(pData); });

  if (!result) {
    LOG_ERROR(simConnectName + ": MsfsHandler::update() - failed");
  }

#ifdef PROFILING
  profiler.stop();
  if (tickCounter % 120 == 0) {
    profiler.print();
  }
#endif

  return result;
}

bool MsfsHandler::shutdown() {
  bool result = std::all_of(modules.begin(), modules.end(), [](Module* pModule) { return pModule->shutdown(); });
  modules.clear();
  result &= dataManager.shutdown();
  unregister_key_event_handler_EX1(reinterpret_cast<GAUGE_KEY_EVENT_HANDLER_EX1>(keyEventHandlerEx1), nullptr);
  unregister_all_named_vars();
  return result;
}

bool MsfsHandler::getAircraftIsReadyVar() const {
  return aircraftIsReady->getAsBool();
}

FLOAT64 MsfsHandler::getAircraftDevelopmentStateVar() const {
  return aircraftDevelopmentState->get();
}
