#pragma once

#include "SimVars.h"
#include "common.h"

double cas2mach(double cas, double ambientPressure) {
  double k = 2188648.141;
  double delta = ambientPressure / 1013;
  double mach = sqrt((5 * pow(((pow(((pow(cas, 2) / k) + 1), 3.5) * (1 / delta)) - (1 / delta) + 1), 0.285714286)) - 5);

  return mach;
}

static constexpr double limits[72][5] = {{-2000, 48, 55, 81.351, 79.370},
                                         {-1000, 46, 55, 82.605, 80.120},
                                         {0, 44, 55, 83.832, 80.776},
                                         {500, 42, 52, 84.210, 81.618},
                                         {1000, 42, 52, 84.579, 81.712},
                                         {2000, 40, 50, 85.594, 82.720},
                                         {3000, 36, 48, 86.657, 83.167},
                                         {4000, 32, 46, 87.452, 83.332},
                                         {5000, 29, 44, 88.833, 84.166},
                                         {6000, 25, 42, 90.232, 84.815},
                                         {7000, 21, 40, 91.711, 85.565},
                                         {8000, 17, 38, 93.247, 86.225},
                                         {9000, 15, 36, 94.031, 86.889},
                                         {10000, 13, 34, 94.957, 88.044},
                                         {11000, 12, 32, 95.295, 88.526},
                                         {12000, 11, 30, 95.568, 88.818},
                                         {13000, 10, 28, 95.355, 88.819},
                                         {14000, 10, 26, 95.372, 89.311},
                                         {15000, 8, 24, 95.686, 89.907},
                                         {16000, 5, 22, 96.160, 89.816},
                                         {16600, 5, 22, 96.560, 89.816},
                                         {-2000, 47.751, 54.681, 84.117, 81.901},
                                         {-1000, 45.771, 54.681, 85.255, 82.461},
                                         {0, 43.791, 54.681, 86.411, 83.021},
                                         {500, 42.801, 52.701, 86.978, 83.740},
                                         {1000, 41.811, 52.701, 87.568, 83.928},
                                         {2000, 38.841, 50.721, 88.753, 84.935},
                                         {3000, 36.861, 48.741, 89.930, 85.290},
                                         {4000, 32.901, 46.761, 91.004, 85.836},
                                         {5000, 28.941, 44.781, 92.198, 86.293},
                                         {6000, 24.981, 42.801, 93.253, 86.563},
                                         {7000, 21.022, 40.821, 94.273, 86.835},
                                         {8000, 17.062, 38.841, 94.919, 87.301},
                                         {9000, 15.082, 36.861, 95.365, 87.676},
                                         {10000, 13.102, 34.881, 95.914, 88.150},
                                         {11000, 12.112, 32.901, 96.392, 88.627},
                                         {12000, 11.122, 30.921, 96.640, 89.206},
                                         {13000, 10.132, 28.941, 96.516, 89.789},
                                         {14000, 9.142, 26.961, 96.516, 90.475},
                                         {15000, 9.142, 24.981, 96.623, 90.677},
                                         {16000, 7.162, 23.001, 96.845, 90.783},
                                         {16600, 5.182, 21.022, 97.366, 91.384},
                                         {-2000.0, 30.800, 56.870, 80.280, 72.000},
                                         {2000.0, 20.990, 48.157, 82.580, 74.159},
                                         {5000.0, 16.139, 43.216, 84.642, 75.737},
                                         {8000.0, 7.342, 38.170, 86.835, 77.338},
                                         {10000.0, 4.051, 34.518, 88.183, 77.999},
                                         {10000.1, 4.051, 34.518, 87.453, 77.353},
                                         {12000.0, 0.760, 30.865, 88.303, 78.660},
                                         {15000.0, -4.859, 25.039, 89.748, 79.816},
                                         {17000.0, -9.934, 19.813, 90.668, 80.895},
                                         {20000.0, -15.822, 13.676, 92.106, 81.894},
                                         {24000.0, -22.750, 6.371, 93.651, 82.716},
                                         {27000.0, -29.105, -0.304, 93.838, 83.260},
                                         {29314.0, -32.049, -3.377, 93.502, 82.962},
                                         {31000.0, -34.980, -6.452, 95.392, 84.110},
                                         {35000.0, -45.679, -17.150, 96.104, 85.248},
                                         {39000.0, -45.679, -17.150, 96.205, 84.346},
                                         {41500.0, -45.679, -17.150, 95.676, 83.745},
                                         {-1000, 26.995, 54.356, 82.465, 74.086},
                                         {3000, 18.170, 45.437, 86.271, 77.802},
                                         {7000, 9.230, 40.266, 89.128, 79.604},
                                         {11000, 4.019, 31.046, 92.194, 82.712},
                                         {15000, -5.226, 21.649, 95.954, 85.622},
                                         {17000, -9.913, 20.702, 97.520, 85.816},
                                         {20000, -15.129, 15.321, 99.263, 86.770},
                                         {22000, -19.947, 10.382, 98.977, 86.661},
                                         {25000, -25.397, 4.731, 98.440, 85.765},
                                         {27000, -30.369, -0.391, 97.279, 85.556},
                                         {31000, -36.806, -7.165, 98.674, 86.650},
                                         {35000, -43.628, -14.384, 98.386, 85.747},
                                         {39000, -47.286, -18.508, 97.278, 85.545}};

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
double bleedTotal(int type, double altitude, double oat, double cp, int ac, int nacelle, int wing) {
double n1Packs = 0;
double n1Nai = 0;
double n1Wai = 0;
double bleed = 0;

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
double limitN1(int type, double altitude, double ambientTemp, double ambientPressure, bool ac, bool nacelle, bool wing) {
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

  // Calculating  CN1
  if (ambientTemp <= cp) {
    cn1 = cn1Flat;
  } else {
    m = (cn1Last - cn1Flat) / (lp - cp);
    b = cn1Last - m * lp;
    cn1 = (m * ambientTemp) + b;
  }

  // Define bleed rating/ derating
  bleed = bleedTotal(type, altitude, ambientTemp, cp, ac, nacelle, wing);

  // Setting N1
  n1 = (cn1 * sqrt(ratios->theta2(mach, ambientTemp))) + bleed;

  return n1;
}