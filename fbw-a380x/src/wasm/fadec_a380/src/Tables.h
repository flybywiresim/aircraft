#pragma once

#include "SimVars.h"
#include "common.h"

EngineRatios* ratios;

/// <summary>
/// Table 1502 (CN3 vs correctedN1) representations with FSX nomenclature
/// </summary>
/// <returns>Returns CN3 - correctedN1 pair.</returns>
double table1502(int i, int j) {
  double t[13][4] = {{16.012, 0.000, 0.000, 17.000},      {19.355, 1.845, 1.845, 17.345},   {22.874, 2.427, 2.427, 18.127},
                     {50.147, 12.427, 12.427, 26.627},    {60.000, 18.500, 18.500, 33.728}, {67.742, 25.243, 25.243, 40.082},
                     {73.021, 30.505, 30.505, 43.854},    {78.299, 39.779, 39.779, 48.899}, {81.642, 49.515, 49.515, 53.557},
                     {85.337, 63.107, 63.107, 63.107},    {87.977, 74.757, 74.757, 74.757}, {97.800, 97.200, 97.200, 97.200},
                     {118.000, 115.347, 115.347, 115.347}};

  return t[i][j];
}

/// <summary>
/// Calculate expected CN3 at Idle
/// </summary>
double iCN3(double pressAltitude, double mach) {
  double cn3 = 0;

  cn3 = 60.0 / (sqrt((288.15 - (1.98 * pressAltitude / 1000)) / 288.15) * sqrt(1 + (0.2 * powFBW(mach, 2))));

  return cn3;
}

/// <summary>
/// Calculate expected correctedN1 at Idle
/// </summary>
double iCN1(double pressAltitude, double mach, double ambientTemp) {
  int i;
  double cn1_lo = 0, cn1_hi = 0, cn1 = 0;
  double cn3 = iCN3(pressAltitude, mach);
  double cell = 0;
  double cn3lo = 0, cn3hi = 0;
  double cn1lolo = 0, cn1hilo = 0, cn1lohi = 0, cn1hihi = 0;

  for (i = 0; i < 13; i++) {
    cell = table1502(i, 0);
    if (cell > cn3) {
      break;
    }
  }

  cn3lo = table1502(i - 1, 0);
  cn3hi = table1502(i, 0);

  cn1lolo = table1502(i - 1, 1);
  cn1hilo = table1502(i, 1);

  if (mach <= 0.2) {
    cn1 = interpolate(cn3, cn3lo, cn3hi, cn1lolo, cn1hilo);
  } else {
    cn1lohi = table1502(i - 1, 3);
    cn1hihi = table1502(i, 3);

    cn1_lo = interpolate(cn3, cn3lo, cn3hi, cn1lolo, cn1hilo);
    cn1_hi = interpolate(cn3, cn3lo, cn3hi, cn1lohi, cn1hihi);
    cn1 = interpolate(mach, 0.2, 0.9, cn1_lo, cn1_hi);
  }

  return cn1;
}