#pragma once
 
#include "SimVars.h"
#include "common.h"

EngineRatios* ratios;

/// <summary>
/// Interpolation function being used by MSFS for the engine tables
/// </summary>
/// <returns>Interpolated 'y' for a given 'x'.</returns>
double interpolate(double x, double x0, double x1, double y0, double y1) {
  double y = 0;

  y = ((y0 * (x1 - x)) + (y1 * (x - x0))) / (x1 - x0);

  return y;
}

/// <summary>
/// Table 1502 (CN2 vs correctedN1) representations with FSX nomenclature
/// </summary>
/// <returns>Returns CN2 - correctedN1 pair.</returns>
double table1502(int i, int j) {
  double t[13][2] = {{18.2, 0},       {22, 1.9},  {26, 2.5}, {57, 12.8}, {68.2, 19.6}, {77, 26},    {83, 31.42024},
                     {89, 40.972041}, {92.8, 51}, {97, 65},  {100, 77},  {104, 85},    {116.5, 101}};

  return t[i][j];
}

/// <summary>
/// Calculate expected CN2 at Idle
/// </summary>
double iCN2(double pressAltitude) {
  double cn2 = 0;

  cn2 = 68.2 / sqrt((288.15 - (1.98 * pressAltitude / 1000)) / 288.15);

  return cn2;
}

/// <summary>
/// Calculate expected correctedN1 at Idle
/// </summary>
double iCN1(double pressAltitude, double ambientTemp) {
  int i;
  double cn1 = 0;
  double cn2 = iCN2(pressAltitude);
  double cell = 0;
  double cn2lo = 0, cn2hi = 0, cn1lo = 0, cn1hi = 0;

  for (i = 0; i < 13; i++) {
    cell = table1502(i, 0);
    if (cell > cn2) {
      break;
    }
  }
  cn2lo = table1502(i - 1, 0);
  cn2hi = table1502(i, 0);
  cn1lo = table1502(i - 1, 1);
  cn1hi = table1502(i, 1);

  cn1 = interpolate(cn2, cn2lo, cn2hi, cn1lo, cn1hi);

  return cn1;
}
