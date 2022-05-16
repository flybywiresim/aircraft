// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#pragma once

/**
 * The InertialDampener provides a dampened output based on the current input
 * and an internal state value. The output value increases or decreases from the
 * internal state value towards the input value with the given acceleration value.
 */
class InertialDampener {

private:
  double lastValue{};
  double accelStepSize{};

public:

  /**
   * Creates a new instance of the InertialDampener
   * @param startValue initial value to avoid a too large delta for the first usage
   * @param accelStepSize value which will be added/subtracted to/from the internal
   *                    state towards the input value.
   */
  InertialDampener(double startValue, double accelStepSize);

  /**
   * Given a target value this returns a value increased or decreased from the last
   * returned value towards the new target value. The value is increased or decreased
   * by the accelStepSize provided when creating the instance.
   * @param newTargetValue
   * @return new value loser to newTarget value by accelStepSize
   */
  double updateSpeed(double newTargetValue);

private:
  static double round(double value, int decimalPrecision);
};
