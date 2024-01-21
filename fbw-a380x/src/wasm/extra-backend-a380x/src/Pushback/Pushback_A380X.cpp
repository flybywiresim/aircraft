// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "Pushback_A380X.h"

FLOAT64 Pushback_A380X::calculateCounterRotAccel(const FLOAT64 inertiaSpeed, AircraftVariablePtr& windVelBodyZ) const {
  // TODO: adapt this to the A380X
  FLOAT64 movementCounterRotAccel = 0.0;
  if (inertiaSpeed > 0) {
    movementCounterRotAccel = (windVelBodyZ->get() / 2000.0) - 0.5;
  } else if (inertiaSpeed < 0) {
    movementCounterRotAccel = (windVelBodyZ->get() / 2000.0) + 1.0;
  }
  return movementCounterRotAccel;
}
