#pragma once

#include "SimVars.h"
#include "common.h"

double cas2mach(double cas, double ambientPressure) {
  double k = 2188648.141;
  double delta = ambientPressure / 1013;
  double mach = sqrt((5 * pow(((pow(((pow(cas, 2) / k) + 1), 3.5) * (1 / delta)) - (1 / delta) + 1), 0.285714286)) - 5);

  return mach;
}

static constexpr double limits[72][6] = {
    {-2000, 48.000, 55.000, 81.351, 79.370, 61.535},  {-1000, 46.000, 55.000, 82.605, 80.120, 62.105},
    {0, 44.000, 55.000, 83.832, 80.776, 62.655},      {500, 42.000, 52.000, 84.210, 81.618, 62.655},
    {1000, 42.000, 52.000, 84.579, 81.712, 62.655},   {2000, 40.000, 50.000, 85.594, 82.720, 62.655},
    {3000, 36.000, 48.000, 86.657, 83.167, 61.960},   {4000, 32.000, 46.000, 87.452, 83.332, 61.206},
    {5000, 29.000, 44.000, 88.833, 84.166, 61.206},   {6000, 25.000, 42.000, 90.232, 84.815, 61.206},
    {7000, 21.000, 40.000, 91.711, 85.565, 61.258},   {8000, 17.000, 38.000, 93.247, 86.225, 61.777},
    {9000, 15.000, 36.000, 94.031, 86.889, 60.968},   {10000, 13.000, 34.000, 94.957, 88.044, 60.935},
    {11000, 12.000, 32.000, 95.295, 88.526, 59.955},  {12000, 11.000, 30.000, 95.568, 88.818, 58.677},
    {13000, 10.000, 28.000, 95.355, 88.819, 59.323},  {14000, 10.000, 26.000, 95.372, 89.311, 59.965},
    {15000, 8.000, 24.000, 95.686, 89.907, 58.723},   {16000, 5.000, 22.000, 96.160, 89.816, 57.189},
    {16600, 5.000, 22.000, 96.560, 89.816, 57.189},   {-2000, 47.751, 54.681, 84.117, 81.901, 63.498},
    {-1000, 45.771, 54.681, 85.255, 82.461, 63.920},  {0, 43.791, 54.681, 86.411, 83.021, 64.397},
    {500, 42.801, 52.701, 86.978, 83.740, 64.401},    {1000, 41.811, 52.701, 87.568, 83.928, 64.525},
    {2000, 38.841, 50.721, 88.753, 84.935, 64.489},   {3000, 36.861, 48.741, 89.930, 85.290, 63.364},
    {4000, 32.901, 46.761, 91.004, 85.836, 62.875},   {5000, 28.941, 44.781, 92.198, 86.293, 62.614},
    {6000, 24.981, 42.801, 93.253, 86.563, 62.290},   {7000, 21.022, 40.821, 94.273, 86.835, 61.952},
    {8000, 17.062, 38.841, 94.919, 87.301, 62.714},   {9000, 15.082, 36.861, 95.365, 87.676, 61.692},
    {10000, 13.102, 34.881, 95.914, 88.150, 60.906},  {11000, 12.112, 32.901, 96.392, 88.627, 59.770},
    {12000, 11.122, 30.921, 96.640, 89.206, 58.933},  {13000, 10.132, 28.941, 96.516, 89.789, 60.503},
    {14000, 9.142, 26.961, 96.516, 90.475, 62.072},   {15000, 9.142, 24.981, 96.623, 90.677, 59.333},
    {16000, 7.162, 23.001, 96.845, 90.783, 58.045},   {16600, 5.182, 21.022, 97.366, 91.384, 58.642},
    {-2000, 30.800, 56.870, 80.280, 72.000, 0.000},   {2000, 20.990, 48.157, 82.580, 74.159, 0.000},
    {5000, 16.139, 43.216, 84.642, 75.737, 0.000},    {8000, 7.342, 38.170, 86.835, 77.338, 0.000},
    {10000, 4.051, 34.518, 88.183, 77.999, 0.000},    {10000.1, 4.051, 34.518, 87.453, 77.353, 0.000},
    {12000, 0.760, 30.865, 88.303, 78.660, 0.000},    {15000, -4.859, 25.039, 89.748, 79.816, 0.000},
    {17000, -9.934, 19.813, 90.668, 80.895, 0.000},   {20000, -15.822, 13.676, 92.106, 81.894, 0.000},
    {24000, -22.750, 6.371, 93.651, 82.716, 0.000},   {27000, -29.105, -0.304, 93.838, 83.260, 0.000},
    {29314, -32.049, -3.377, 93.502, 82.962, 0.000},  {31000, -34.980, -6.452, 95.392, 84.110, 0.000},
    {35000, -45.679, -17.150, 96.104, 85.248, 0.000}, {39000, -45.679, -17.150, 96.205, 84.346, 0.000},
    {41500, -45.679, -17.150, 95.676, 83.745, 0.000}, {-1000, 26.995, 54.356, 82.465, 74.086, 0.000},
    {3000, 18.170, 45.437, 86.271, 77.802, 0.000},    {7000, 9.230, 40.266, 89.128, 79.604, 0.000},
    {11000, 4.019, 31.046, 92.194, 82.712, 0.000},    {15000, -5.226, 21.649, 95.954, 85.622, 0.000},
    {17000, -9.913, 20.702, 97.520, 85.816, 0.000},   {20000, -15.129, 15.321, 99.263, 86.770, 0.000},
    {22000, -19.947, 10.382, 98.977, 86.661, 0.000},  {25000, -25.397, 4.731, 98.440, 85.765, 0.000},
    {27000, -30.369, -0.391, 97.279, 85.556, 0.000},  {31000, -36.806, -7.165, 98.674, 86.650, 0.000},
    {35000, -43.628, -14.384, 98.386, 85.747, 0.000}, {39000, -47.286, -18.508, 97.278, 85.545, 0.000}};

/// <summary>
/// Finds top-row boundary in an array
/// </summary>
int finder(double altitude, int index) {
  if (altitude < limits[index][0]) {
    return index;
  } else {
    return finder(altitude, index + 1);
  }
}

/// <summary>
/// Calculates Bleed Air situation for engine adaptation
/// </summary>
double bleedTotal(int type, double altitude, double oat, double cp, double lp, double flexTemp, double ac, double nacelle, double wing) {
  double n1Packs = 0;
  double n1Nai = 0;
  double n1Wai = 0;
  double bleed = 0;

  if (flexTemp > lp && type <= 1) {
    n1Packs = -0.6;
    n1Nai = -0.7;
    n1Wai = -0.7;
  } else {
    switch (type) {
      case 0:
        if (altitude < 8000) {
          if (oat < cp) {
            n1Packs = -0.4;
          } else {
            n1Packs = -0.5;
            n1Nai = -0.6;
            n1Wai = -0.7;
          }
        } else {
          if (oat < cp) {
            n1Packs = -0.6;
          } else {
            n1Packs = -0.7;
            n1Nai = -0.8;
            n1Wai = -0.8;
          }
        }
        break;
      case 1:
        if (altitude < 8000) {
          if (oat < cp) {
            n1Packs = -0.4;
          } else {
            n1Packs = -0.4;
            n1Nai = -0.6;
            n1Wai = -0.6;
          }
        } else {
          if (oat < cp) {
            n1Packs = -0.6;
          } else {
            n1Packs = -0.6;
            n1Nai = -0.7;
            n1Wai = -0.8;
          }
        }
        break;
      case 2:
        if (oat < cp) {
          n1Packs = -0.2;
        } else {
          n1Packs = -0.3;
          n1Nai = -0.8;
          n1Wai = -0.4;
        }
        break;
      case 3:
        if (oat < cp) {
          n1Packs = -0.6;
        } else {
          n1Packs = -0.6;
          n1Nai = -0.9;
          n1Wai = -1.2;
        }
        break;
    }
  }

  if (ac == 0) {
    n1Packs = 0;
  }
  if (nacelle == 0) {
    n1Nai = 0;
  }
  if (wing == 0) {
    n1Wai = 0;
  }

  bleed = n1Packs + n1Nai + n1Wai;

  return bleed;
}

/// <summary>
/// Main N1 Limit Function
/// </summary>
/// <param name="type">0-TO, 1-GA, 2-CLB, 3-MCT</param>
/// <returns></returns>
double
limitN1(int type, double altitude, double ambientTemp, double ambientPressure, double flexTemp, double ac, double nacelle, double wing) {
  int rowMin = 0;
  int rowMax = 0;
  int loAltRow = 0;
  int hiAltRow = 0;
  double mach = 0;
  double cp = 0;
  double lp = 0;
  double cn1 = 0;
  double n1 = 0;
  double cn1Flat = 0;
  double cn1Last = 0;
  double cn1Flex = 0;
  double m = 0;
  double b = 0;
  double bleed = 0;

  // Set main variables per Limit Type
  switch (type) {
    case 0:
      rowMin = 0;
      rowMax = 20;
      mach = 0;
      break;
    case 1:
      rowMin = 21;
      rowMax = 41;
      mach = 0.225;
      break;
    case 2:
      rowMin = 42;
      rowMax = 58;
      if (altitude <= 10000) {
        mach = cas2mach(250, ambientPressure);
      } else {
        mach = cas2mach(300, ambientPressure);
        if (mach > 0.78)
          mach = 0.78;
      }
      break;
    case 3:
      rowMin = 59;
      rowMax = 71;
      mach = cas2mach(230, ambientPressure);
      break;
  }

  // Check for over/ underflows. Else, find top row value
  if (altitude <= limits[rowMin][0]) {
    hiAltRow = rowMin;
    loAltRow = rowMin;
  } else if (altitude >= limits[rowMax][0]) {
    hiAltRow = rowMax;
    loAltRow = rowMax;
  } else {
    hiAltRow = finder(altitude, rowMin);
    loAltRow = hiAltRow - 1;
  }

  // Define key table variables and interpolation
  cp = interpolate(altitude, limits[loAltRow][0], limits[hiAltRow][0], limits[loAltRow][1], limits[hiAltRow][1]);
  lp = interpolate(altitude, limits[loAltRow][0], limits[hiAltRow][0], limits[loAltRow][2], limits[hiAltRow][2]);
  cn1Flat = interpolate(altitude, limits[loAltRow][0], limits[hiAltRow][0], limits[loAltRow][3], limits[hiAltRow][3]);
  cn1Last = interpolate(altitude, limits[loAltRow][0], limits[hiAltRow][0], limits[loAltRow][4], limits[hiAltRow][4]);
  cn1Flex = interpolate(altitude, limits[loAltRow][0], limits[hiAltRow][0], limits[loAltRow][5], limits[hiAltRow][5]);

  // Calculating  CN1 for all cases
  if (flexTemp > lp && type <= 1) {  // Flexible TO Case
    m = (cn1Flex - cn1Last) / (100 - lp);
    b = cn1Flex - m * 100;
    cn1 = (m * flexTemp) + b;
  } else {
    if (ambientTemp <= cp) {
      cn1 = cn1Flat;
    } else {
      m = (cn1Last - cn1Flat) / (lp - cp);
      b = cn1Last - m * lp;
      cn1 = (m * ambientTemp) + b;
    }
  }

  // Define bleed rating/ derating
  bleed = bleedTotal(type, altitude, ambientTemp, cp, lp, flexTemp, ac, nacelle, wing);

  // Setting N1
  n1 = (cn1 * sqrt(ratios->theta2(mach, ambientTemp))) + bleed;
  /*if (type == 3) {
    std::cout << "FADEC: bleed= " << bleed << " cn1= " << cn1 << " theta2= " << sqrt(ratios->theta2(mach, ambientTemp))
              << " n1= " << n1 << std::endl;
  }*/
  return n1;
}