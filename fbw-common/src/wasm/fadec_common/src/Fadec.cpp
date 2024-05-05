// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "Fadec.h"

double Fadec::interpolate(double x, double x0, double x1, double y0, double y1) {
  if (x0 == x1)
    return y0;
  if (x < x0)
    return y0;
  if (x > x1)
    return y1;
  return ((y0 * (x1 - x)) + (y1 * (x - x0))) / (x1 - x0);
}

double Fadec::cas2mach(double cas, double ambientPressure) {
  double k     = 2188648.141;
  double delta = ambientPressure / 1013;
  return sqrt((5 * (std::pow)((((std::pow)((((std::pow)(cas, 2) / k) + 1), 3.5) * (1 / delta)) - (1 / delta) + 1), 0.285714286)) - 5);
}
