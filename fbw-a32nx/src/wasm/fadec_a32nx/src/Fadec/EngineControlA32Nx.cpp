// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "EngineControlA32Nx.h"

void EngineControl_A32NX::initialize(MsfsHandler* msfsHandler) {
  this->msfsHandlerPtr = msfsHandler;
  this->dataManagerPtr = &msfsHandler->getDataManager();
  this->simData.initialize(dataManagerPtr);
  LOG_INFO("Fadec::EngineControl_A32NX::initialize() - initialized");
}

void EngineControl_A32NX::update() {
  profilerUpdate.start();

  // Get ATC ID from sim to be able to load and store fuel levels
  // If not yet available, request it from sim and return early
  // If available initialize the engine control data
  if (atcId.empty()) {
    simData.atcIdDataPtr->requestUpdateFromSim(msfsHandlerPtr->getTimeStamp(), msfsHandlerPtr->getTickCounter());
    if (simData.atcIdDataPtr->hasChanged()) {
      atcId = simData.atcIdDataPtr->data().atcID;
      LOG_INFO("Fadec::EngineControl_A32NX::update() - received ATC ID: " + atcId);
      initializeEngineControlData();
    }
    return;
  }

  // TODO: Implement update logic

  profilerUpdate.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerUpdate.print();
  }
}

void EngineControl_A32NX::shutdown() {
  LOG_INFO("Fadec::EngineControl_A32NX::shutdown()");
  // TODO: Implement shutdown if required
}

// =============================================================================
// PRIVATE
// =============================================================================

void EngineControl_A32NX::initializeEngineControlData() {

  // TODO Fuel level initialization

}
