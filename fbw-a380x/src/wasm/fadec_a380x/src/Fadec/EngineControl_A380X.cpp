// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "EngineControl_A380X.h"
#include "MsfsHandler.h"

void EngineControl_A380X::update(const ContextPtr& context) {
  std::cout << "EngineControl::update() -"
            << " mach: " << context->simDataPtr->data().mach
            << " pressAltitude: " << context->simDataPtr->data().pressureAltitude
            << " ambientTemp: " << context->simDataPtr->data().ambientTemperature
            << " ambientPressure: " << context->simDataPtr->data().ambientPressure
            << " simOnGround: " << context->msfsHandler->getSimOnGround() << std::endl;
}
