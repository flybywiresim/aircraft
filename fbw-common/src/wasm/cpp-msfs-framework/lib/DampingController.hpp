// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_PUSHBACK_INERTIALDAMPENER_HPP
#define FLYBYWIRE_PUSHBACK_INERTIALDAMPENER_HPP

#include "math_utils.hpp"

/**
 * The DampingController provides a dampened output based on the current input
 * and an internal state value. The output value increases or decreases from the
 * internal state value towards the input value with the given acceleration value.
 */
class DampingController {
 private:
  double lastValue{};
  double accelStepSize{};
  double epsilon{};

 public:
  /**
   * Creates a new instance of the DampingController
   * @param startValue initial value to avoid a too large delta for the first usage
   * @param accelStepSize value which will be added/subtracted to/from the internal
   *                    state towards the input value.
   * @param epsilon the epsilon value used to compare the input value with the internal
   *               state value. If the difference is smaller than epsilon the input value
   *               is returned.
   */
  DampingController(double startValue, double accelStepSize, double epsilon) {
    this->lastValue     = startValue;
    this->accelStepSize = accelStepSize;
    this->epsilon       = epsilon;
  };

  /**
   * Given a target value this returns a value increased or decreased from the last
   * returned value towards the new target value. The value is increased or decreased
   * by the accelStepSize provided when creating the instance.
   * @param newTargetValue
   * @return new value closer to newTarget value by accelStepSize
   */
  double updateTargetValue(double newTargetValue) {
    if (helper::Math::almostEqual(lastValue, newTargetValue, epsilon)) {
      return newTargetValue;
    }
    lastValue += (newTargetValue > lastValue ? accelStepSize : -accelStepSize);
    return lastValue;
  }
};

#endif  // FLYBYWIRE_PUSHBACK_INERTIALDAMPENER_HPP
