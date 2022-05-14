// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

//
// Created by frank on 13.05.2022.
//

#pragma once

class InertialDampener {
 private:
  double lastValue{};
  double accelFactor{};

 public:
  InertialDampener(double startValue, double accelFactor);

  double updateSpeed(double cmdSpeed);

  static double round(double value, int decimalPrecision);
};
