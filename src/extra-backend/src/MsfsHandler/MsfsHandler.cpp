// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <algorithm>

#include "logging.h"
#include "MsfsHandler.h"
#include "Units.h"
#include "Module.h"
#include "SimObjectBase.h"

// =================================================================================================
// PUBLIC METHODS
// =================================================================================================

void MsfsHandler::registerModule(Module* pModule) {
  modules.push_back(pModule);
}

bool MsfsHandler::initialize() {
  // Initialize SimConnect
  bool result;
  result = initializeSimConnect();
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

  globalDataManagerInstancePtr = (void*) &dataManager;

  // Register as key event handler
  register_key_event_handler_EX1(
    reinterpret_cast<GAUGE_KEY_EVENT_HANDLER_EX1>(DataManager::wrapperToCallMemberCallback), nullptr);

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
  a32nxIsDevelopmentState = dataManager.make_named_var("DEVELOPER_STATE", UNITS.Bool, true);
  a32nxIsReady = dataManager.make_named_var("IS_READY", UNITS.Bool, true);
  // base sim data mainly for pause detection
  std::vector<SimObjectBase::DataDefinition> baseDataDef = {{"SIMULATION TIME", 0, UNITS.Number},};
  baseSimData = dataManager.make_datadefinition_var<BaseSimData>("BASE DATA", baseDataDef);

  isInitialized = result;
  return result;
}

bool MsfsHandler::update(sGaugeDrawData* pData) {
  if (!isInitialized) {
    LOG_ERROR(simConnectName + ": MsfsHandler::update() - not initialized");
    return false;
  }

  // detect pause - uses the base sim data definition to retrieve the SIMULATION TIME
  // and run a separate pair of getRequestedData() and requestPeriodicDataFromSim() for it
  if (baseSimData->requestDataFromSim()) dataManager.getRequestedData();
  if ((baseSimData->data().simulationTime) == timeStamp) return true;
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
    reinterpret_cast<GAUGE_KEY_EVENT_HANDLER_EX1>(DataManager::wrapperToCallMemberCallback), nullptr);

  return result;
}

// =================================================================================================
// PRIVATE METHODS
// =================================================================================================

bool MsfsHandler::initializeSimConnect() {
  return SUCCEEDED(SimConnect_Open(&hSimConnect, simConnectName.c_str(), nullptr, 0, 0, 0));
}
