#pragma once

#include "SimVars.h"
#include "common.h"

EngineRatios* ratios;

/// <summary>
/// Table 1502 (CN2 vs correctedN1) representations with FSX nomenclature
/// </summary>
/// <returns>Returns CN2 - correctedN1 pair.</returns>
double table1502(int i, int j) {
  double t[13][4] = {{18.20, 0.00, 0.00, 17.00},      {22.00, 1.90, 1.90, 17.40},    {26.00, 2.50, 2.50, 18.20},
                     {57.00, 12.80, 12.80, 27.00},    {68.20, 19.60, 19.60, 34.83},  {77.00, 26.00, 26.00, 40.84},
                     {83.00, 31.42, 31.42, 44.77},    {89.00, 40.97, 40.97, 50.09},  {92.80, 51.00, 51.00, 55.04},
                     {97.00, 65.00, 65.00, 65.00},    {100.00, 77.00, 77.00, 77.00}, {104.00, 85.00, 85.00, 85.50},
                     {116.50, 101.00, 101.00, 101.00}};

  return t[i][j];
}

/// <summary>
/// Calculate expected CN2 at Idle
/// </summary>
double iCN2(double pressAltitude, double mach) {
  double cn2 = 0;

  cn2 = 68.2 / (sqrt((288.15 - (1.98 * pressAltitude / 1000)) / 288.15) * sqrt(1 + (0.2 * powFBW(mach, 2))));

  return cn2;
}

/// <summary>
/// Calculate expected correctedN1 at Idle
/// </summary>
double iCN1(double pressAltitude, double mach, double ambientTemp) {
  int i;
  double cn1_lo = 0, cn1_hi = 0, cn1 = 0;
  double cn2 = iCN2(pressAltitude, mach);
  double cell = 0;
  double cn2lo = 0, cn2hi = 0;
  double cn1lolo = 0, cn1hilo = 0, cn1lohi = 0, cn1hihi = 0;

  for (i = 0; i < 13; i++) {
    cell = table1502(i, 0);
    if (cell > cn2) {
      break;
    }
  }

  cn2lo = table1502(i - 1, 0);
  cn2hi = table1502(i, 0);

  cn1lolo = table1502(i - 1, 1);
  cn1hilo = table1502(i, 1);

  if (mach <= 0.2) {
    cn1 = interpolate(cn2, cn2lo, cn2hi, cn1lolo, cn1hilo);
  } else {
    cn1lohi = table1502(i - 1, 3);
    cn1hihi = table1502(i, 3);

    cn1_lo = interpolate(cn2, cn2lo, cn2hi, cn1lolo, cn1hilo);
    cn1_hi = interpolate(cn2, cn2lo, cn2hi, cn1lohi, cn1hihi);
    cn1 = interpolate(mach, 0.2, 0.9, cn1_lo, cn1_hi);
  }

  return cn1;
}