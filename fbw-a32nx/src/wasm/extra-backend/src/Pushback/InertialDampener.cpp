// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <cmath>

#include "InertialDampener.h"

InertialDampener::InertialDampener(double startValue, double accelStepSize) {
  this->lastValue = startValue;
  this->accelStepSize = accelStepSize;
}

double InertialDampener::updateSpeed(double newTargetValue) {
  if (round(newTargetValue, 1) == round(lastValue, 1)) {
    return newTargetValue;
  }
  if (newTargetValue > this->lastValue) {
    this->lastValue += this->accelStepSize;
  }
  else if (newTargetValue < this->lastValue) {
    this->lastValue -= this->accelStepSize;
  }
  return this->lastValue;
}

double InertialDampener::round(double value, int decimalPrecision) {
  const double p = std::pow(10, decimalPrecision);
  return std::round(value * p) / p;
}
