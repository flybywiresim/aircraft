// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "MsfsHandler.h"

#include "EngineControl_A380X.h"

void EngineControl_A380X::update(const ContextPtr& contextPtr) {
  std::cout << "EngineControl::update() -"
            << " mach: " << contextPtr->simDataPtr->data().mach
            << " pressAltitude: " << contextPtr->simDataPtr->data().pressureAltitude
            << " ambientTemp: " << contextPtr->simDataPtr->data().ambientTemperature
            << " ambientPressure: " << contextPtr->simDataPtr->data().ambientPressure
            << " simOnGround: " << contextPtr->msfsHandler->getSimOnGround() << std::endl;
}
