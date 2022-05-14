// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <cmath>

#include "InertialDampener.h"

InertialDampener::InertialDampener(double startValue, double accelFactor) {
  this->lastValue = startValue;
  this->accelFactor = accelFactor;
}

double InertialDampener::updateSpeed(double newSpeed) {
  if (round(newSpeed, 1) == round(lastValue, 1)) {
    return newSpeed;
  }
  if (newSpeed > this->lastValue) {
    this->lastValue += this->accelFactor;
  }
  else if (newSpeed < this->lastValue) {
    this->lastValue -= this->accelFactor;
  }
  return this->lastValue;
}

double InertialDampener::round(double value, int decimalPrecision) {
  const double p = std::pow(10, decimalPrecision);
  return std::round(value * p) / p;
}
