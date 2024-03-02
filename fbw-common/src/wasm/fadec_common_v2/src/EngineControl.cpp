// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "MsfsHandler.h"
#include "EngineControl.h"
#include "SimVars.h"

void EngineControl::update(ContextPtr context, double deltaTime, double simulationTime) {
  mach = context->simDataPtr->data().mach;
  pressAltitude = context->simDataPtr->data().pressureAltitude;
  ambientTemp = context->simDataPtr->data().ambientTemperature;
  ambientPressure = context->simDataPtr->data().ambientPressure;
  simOnGround = context->msfsHandler->getSimOnGround();

  std::cout << "EngineControl::update() - mach: " << mach << " pressAltitude: " << pressAltitude << " ambientTemp: " << ambientTemp << " ambientPressure: " << ambientPressure << " simOnGround: " << simOnGround << std::endl;
}
