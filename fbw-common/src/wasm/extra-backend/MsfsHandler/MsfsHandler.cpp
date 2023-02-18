// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <algorithm>

#include "logging.h"
#include "Units.h"
#include "Callback.h"
#include "MsfsHandler.h"
#include "Module.h"
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

  // Initialize data manager
  result = dataManager.initialize(hSimConnect);
  if (!result) {
    LOG_ERROR(simConnectName + ": Failed to initialize data manager");
    return false;
  }

  // This is a workaround to be able to use a member function as callback as the API callback
  // function must be static.
  // See https://blog.mbedded.ninja/programming/languages/c-plus-plus/callbacks/#static-variables-with-templating
  Callback<void(ID32, UINT32, UINT32, UINT32, UINT32, UINT32, PVOID)>::func
    = [ObjectPtr = &dataManager](auto &&PH1,
                                 auto &&PH2,
                                 auto &&PH3,
                                 auto &&PH4,
                                 auto &&PH5,
                                 auto &&PH6,
                                 auto &&PH7) {
    ObjectPtr->processKeyEvent(std::forward<decltype(PH1)>(PH1),
                               std::forward<decltype(PH2)>(PH2),
                               std::forward<decltype(PH3)>(PH3),
                               std::forward<decltype(PH4)>(PH4),
                               std::forward<decltype(PH5)>(PH5),
                               std::forward<decltype(PH6)>(PH6),
                               std::forward<decltype(PH7)>(PH7));
  };
  keyEventHandlerEx1 = static_cast<GAUGE_KEY_EVENT_HANDLER_EX1>(
    Callback<void(ID32, UINT32, UINT32, UINT32, UINT32, UINT32, PVOID)>::callback);

  // Register as key event handler
  register_key_event_handler_EX1(keyEventHandlerEx1, nullptr);

  // Initialize modules
  result = true;
  result &= std::all_of(modules.begin(), modules.end(), [](Module* pModule) {
    return pModule->initialize();
  });
  if (!result) {
    LOG_ERROR(simConnectName + ": Failed to initialize modules");
    return false;
  }

  // initialize all data variables needed for the MsfsHandler itself
  a32nxIsDevelopmentState = dataManager.make_named_var("DEVELOPER_STATE", UNITS.Number);
  a32nxIsReady = dataManager.make_named_var("IS_READY", UNITS.Bool);

  // base sim data mainly for pause detection
  std::vector<DataDefinition> baseDataDef = {{"SIMULATION TIME", 0, UNITS.Number},};
  baseSimData = dataManager.make_datadefinition_var<BaseSimData>("BASE DATA", baseDataDef);
  if (!SUCCEEDED(baseSimData->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME))) {
    LOG_ERROR(simConnectName + ": Failed to request periodic data for base sim data");
    return false;
  }

  isInitialized = result;
  return result;
}

bool MsfsHandler::update(sGaugeDrawData* pData) {
  if (!isInitialized) {
    LOG_ERROR(simConnectName + ": MsfsHandler::update() - not initialized");
    return false;
  }

  a32nxIsReady->readFromSim();
  a32nxIsDevelopmentState->readFromSim();

  // initial request of data from sim to retrieve all requests which have
  // periodic updates enabled. This includes the base sim data for pause detection.
  // Other data without periodic updates are requested either in the data manager or
  // in the modules.
  dataManager.getRequestedData();

  // detect pause - uses the base sim data definition to retrieve the SIMULATION TIME
  // and run a separate pair of getRequestedData() and requestPeriodicDataFromSim() for it
  if ((baseSimData->data().simulationTime) == timeStamp) return true;

  // get a new timestamp and increase the tick counter
  timeStamp = baseSimData->data().simulationTime;
  tickCounter++;

  // Call preUpdate(), update() and postUpdate() for all modules
  // Datamanager is always called first to ensure that all variables are updated before the modules
  // are called.

  // PRE UPDATE
  bool result = true;
  result &= dataManager.preUpdate(pData);
  result &= std::all_of(modules.begin(), modules.end(),
                        [&pData](Module* pModule) { return pModule->preUpdate(pData); });

  // UPDATE
  result &= dataManager.update(pData);
  result &= std::all_of(modules.begin(), modules.end(),
                        [&pData](Module* pModule) { return pModule->update(pData); });

  // POST UPDATE
  result &= dataManager.postUpdate(pData);
  result &= std::all_of(modules.begin(), modules.end(),
                        [&pData](Module* pModule) { return pModule->postUpdate(pData); });

  if (!result) {
    LOG_ERROR(simConnectName + ": MsfsHandler::update() - failed");
  }

  return result;
}

bool MsfsHandler::shutdown() {
  bool result = true;
  result &= std::all_of(modules.begin(), modules.end(),
                        [](Module* pModule) { return pModule->shutdown(); });
  modules.clear();
  result &= dataManager.shutdown();
  unregister_key_event_handler_EX1(
    reinterpret_cast<GAUGE_KEY_EVENT_HANDLER_EX1>(keyEventHandlerEx1), nullptr);

  return result;
}

bool MsfsHandler::getA32NxIsReady() const {
  return a32nxIsReady->getAsBool();
}

FLOAT64 MsfsHandler::getA32NxIsDevelopmentState() const {
  return a32nxIsDevelopmentState->get();
}

// =================================================================================================
// PRIVATE METHODS
// =================================================================================================
