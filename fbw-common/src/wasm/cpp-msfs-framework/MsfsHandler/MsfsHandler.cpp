// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <algorithm>
#include <functional>

#include "Callback.h"
#include "ClientEvent.h"
#include "Module.h"
#include "MsfsHandler.h"
#include "NamedVariable.h"
#include "UpdateMode.h"

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

  // base sim data commonly used by many modules
  std::vector<DataDefinition> baseDataDef = {
      {"SIMULATION TIME",                                             0, UNITS.Number},
      {"SIMULATION RATE",                                             0, UNITS.Number},
      {"SIM ON GROUND",                                               0, UNITS.Bool  },
      {"L:" + NamedVariable::getAircraftPrefix() + "IS_READY",        0, UNITS.Number},
      {"L:" + NamedVariable::getAircraftPrefix() + "DEVELOPER_STATE", 0, UNITS.Number}
  };
  baseSimData = dataManager.make_datadefinition_var<BaseSimData>("BASE DATA", baseDataDef);
  if (!SUCCEEDED(baseSimData->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME))) {
    LOG_ERROR(simConnectName + ": Failed to request periodic data for base sim data");
    return false;
  }

  // Pause detection via System Events
  // PAUSE_STATE_FLAG_OFF 0               // No Pause
  // PAUSE_STATE_FLAG_PAUSE 1             // "full" Pause (sim + traffic + etc...)
  // PAUSE_STATE_FLAG_PAUSE_WITH_SOUND 2  // FSX Legacy Pause (not used anymore)
  // PAUSE_STATE_FLAG_ACTIVE_PAUSE 4      // Pause was activated using the "Active Pause" Button
  // PAUSE_STATE_FLAG_SIM_PAUSE 8         // Pause the player sim but traffic, multi, etc... will still run
  a32nxPauseDetected = dataManager.make_named_var("PAUSE_DETECTED", UNITS.Number, UpdateMode::AUTO_READ_WRITE);
  a32nxPauseDetected->set(0);
  pauseDetectedEvent = dataManager.make_client_event("A32NX.PAUSE_DETECTED_EVENT", false);
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

#ifdef PROFILING
  profiler.start();
#endif

  // Initial request of data from sim to retrieve all requests which have
  // periodic updates enabled. This includes the base sim data for pause detection.
  // Other data without periodic updates are requested either in the data manager or
  // in the modules.
  dataManager.getRequestedData();

  // Pause detection
  // In all pause states except active pause return immediately.
  // Active pause can be handled by the modules, but usually simulation should run normally in
  // active pause with just the aircraft not moving.
  // See the comments above for the different pause states.
  if (a32nxPauseDetected->getAsInt64() > 0 && a32nxPauseDetected->getAsInt64() != 4) {
    simulationDeltaTime = 0.;
    return true;
  }

  // read and update base data from sim
  FLOAT64 previousTimeStamp = timeStamp;
  timeStamp                 = baseSimData->data().simulationTime;
  simulationDeltaTime       = std::max(0., timeStamp - previousTimeStamp);
  tickCounter++;

  // Call preUpdate(), update() and postUpdate() for all modules
  // Datamanager is always called first to ensure that all variables are updated before the modules
  // are called.

  bool result = true;

  // PRE UPDATE
#ifdef PROFILING
  preUpdate.start();
#endif
  result &= dataManager.preUpdate(pData);
  result &= std::all_of(modules.begin(), modules.end(), [&pData](Module* pModule) { return pModule->preUpdate(pData); });
#ifdef PROFILING
  preUpdate.stop();
#endif

  // UPDATE
#ifdef PROFILING
  mainUpdate.start();
#endif
  result &= dataManager.update(pData);
  result &= std::all_of(modules.begin(), modules.end(), [&pData](Module* pModule) { return pModule->update(pData); });
#ifdef PROFILING
  mainUpdate.stop();
#endif

  // POST UPDATE
#ifdef PROFILING
  postUpdate.start();
#endif
  result &= dataManager.postUpdate(pData);
  result &= std::all_of(modules.begin(), modules.end(), [&pData](Module* pModule) { return pModule->postUpdate(pData); });
#ifdef PROFILING
  postUpdate.stop();
#endif

  if (!result) {
    LOG_ERROR(simConnectName + ": MsfsHandler::update() - failed");
  }

#ifdef PROFILING
  profiler.stop();
  if (tickCounter % 100 == 0) {
    LOG_INFO("Profiler Info for " + this->simConnectName);
    preUpdate.print();
    mainUpdate.print();
    postUpdate.print();
    profiler.print();
    std::cout << std::endl;
  }
#endif

  return result;
}

bool MsfsHandler::shutdown() {
  bool result = std::all_of(modules.begin(), modules.end(), [](Module* pModule) { return pModule->shutdown(); });
  result &= dataManager.shutdown();
  modules.clear();
  unregister_key_event_handler_EX1(reinterpret_cast<GAUGE_KEY_EVENT_HANDLER_EX1>(keyEventHandlerEx1), nullptr);
  unregister_all_named_vars();
  return result;
}
