// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "EngineControlA32Nx.h"

void EngineControl_A32NX::initialize(MsfsHandler* msfsHandler) {
  this->msfsHandlerPtr = msfsHandler;
  this->dataManagerPtr = &msfsHandler->getDataManager();
  this->simData.initialize(dataManagerPtr);
  LOG_INFO("Fadec::EngineControl_A32NX::initialize() - initialized");
}

void EngineControl_A32NX::update() {}
void EngineControl_A32NX::shutdown() {}
