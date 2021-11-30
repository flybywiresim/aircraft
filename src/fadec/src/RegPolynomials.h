#pragma once

#include "common.h"

/// <summary>
/// A collection of multi-variate regression polynomials for engine parameters
/// </summary>
/// <returns>True if successful, false otherwise.</returns>
class Polynomial {
 public:
  /// <summary>
  /// Shutdown polynomials - N2 (%)
  /// </summary>
  double shutdownN2(double preN2, double deltaTime) {
    double outN2 = 0;
    double k = -0.08183;

    if (preN2 < 30)
      k = -0.0515;

    outN2 = preN2 * expFBW(k * deltaTime);

    return outN2;
  }

  /// <summary>
  /// Shutdown polynomials - N1 (%)
  /// </summary>
  double shutdownN1(double preN1, double deltaTime) {
    double outN1 = 0;
    double k = -0.164;

    if (preN1 < 4)
      k = -0.08;

    outN1 = preN1 * expFBW(k * deltaTime);

    return outN1;
  }

  /// <summary>
  /// Shutdown polynomials - EGT (degrees C)
  /// </summary>
  double shutdownEGT(double preEGT, double ambientTemp, double deltaTime) {
    double outEGT = 0;
    double threshold = ambientTemp + 140;
    double k = 0;
    double ts = 0;

    if (preEGT > threshold) {
      k = 0.0257743;
      ts = 135 + ambientTemp;
    } else {
      k = 0.00072756;
      ts = 30 + ambientTemp;
    }

    outEGT = ts + (preEGT - ts) * expFBW(-k * deltaTime);

    return outEGT;
  }

  /// <summary>
  /// Start-up polynomials - N2 (%)
  /// </summary>
  double startN2(double n2, double preN2, double idleN2) {
    double outN2 = 0;
    double normalN2 = 0;

    normalN2 = n2 * 68.2 / idleN2;

    double c_N2[16] = {4.03649879e+00,  -9.41981960e-01, 1.98426614e-01,  -2.11907840e-02, 1.00777507e-03,  -1.57319166e-06,
                       -2.15034888e-06, 1.08288379e-07,  -2.48504632e-09, 2.52307089e-11,  -2.06869243e-14, 8.99045761e-16,
                       -9.94853959e-17, 1.85366499e-18,  -1.44869928e-20, 4.31033031e-23};

    outN2 = c_N2[0] + (c_N2[1] * normalN2) + (c_N2[2] * powFBW(normalN2, 2)) + (c_N2[3] * powFBW(normalN2, 3)) +
            (c_N2[4] * powFBW(normalN2, 4)) + (c_N2[5] * powFBW(normalN2, 5)) + (c_N2[6] * powFBW(normalN2, 6)) +
            (c_N2[7] * powFBW(normalN2, 7)) + (c_N2[8] * powFBW(normalN2, 8)) + (c_N2[9] * powFBW(normalN2, 9)) +
            (c_N2[10] * powFBW(normalN2, 10)) + (c_N2[11] * powFBW(normalN2, 11)) + (c_N2[12] * powFBW(normalN2, 12)) +
            (c_N2[13] * powFBW(normalN2, 13)) + (c_N2[14] * powFBW(normalN2, 14)) + (c_N2[15] * powFBW(normalN2, 15));

    outN2 = outN2 * n2;

    if (outN2 < preN2) {
      outN2 = preN2 + 0.002;
    }
    if (outN2 >= idleN2 + 0.1) {
      outN2 = idleN2 + 0.05;
    }

    return outN2;
  }

  /// <summary>
  /// Start-up polynomials - N1 (%)
  /// </summary>
  double startN1(double fbwN2, double idleN2, double idleN1) {
    double normalN1pre = 0;
    double normalN1post = 0;
    double normalN2 = fbwN2 / idleN2;
    double c_N1[9] = {-2.2812156e-12, -5.9830374e+01, 7.0629094e+02,  -3.4580361e+03, 9.1428923e+03,
                      -1.4097740e+04, 1.2704110e+04,  -6.2099935e+03, 1.2733071e+03};

    normalN1pre = (-2.4698087 * powFBW(normalN2, 3)) + (0.9662026 * powFBW(normalN2, 2)) + (0.0701367 * normalN2);

    normalN1post = c_N1[0] + (c_N1[1] * normalN2) + (c_N1[2] * powFBW(normalN2, 2)) + (c_N1[3] * powFBW(normalN2, 3)) +
                   (c_N1[4] * powFBW(normalN2, 4)) + (c_N1[5] * powFBW(normalN2, 5)) + (c_N1[6] * powFBW(normalN2, 6)) +
                   (c_N1[7] * powFBW(normalN2, 7)) + (c_N1[8] * powFBW(normalN2, 8));

    if (normalN1post >= normalN1pre)
      return normalN1post * idleN1;
    else
      return normalN1pre * idleN1;
  }

  /// <summary>
  /// Start-up polynomials - Fuel Flow (Kg/hr)
  /// </summary>
  double startFF(double fbwN2, double idleN2, double idleFF) {
    double normalFF = 0;
    double outFF = 0;
    double normalN2 = fbwN2 / idleN2;

    if (normalN2 <= 0.37) {
      normalFF = 0;
    } else {
      double c_FF[9] = {3.1110282e-12, 1.0804331e+02,  -1.3972629e+03, 7.4874131e+03, -2.1511983e+04,
                        3.5957757e+04, -3.5093994e+04, 1.8573033e+04,  -4.1220062e+03};

      normalFF = c_FF[0] + (c_FF[1] * normalN2) + (c_FF[2] * powFBW(normalN2, 2)) + (c_FF[3] * powFBW(normalN2, 3)) +
                 (c_FF[4] * powFBW(normalN2, 4)) + (c_FF[5] * powFBW(normalN2, 5)) + (c_FF[6] * powFBW(normalN2, 6)) +
                 (c_FF[7] * powFBW(normalN2, 7)) + (c_FF[8] * powFBW(normalN2, 8));
    }

    if (normalFF < 0) {
      normalFF = 0;
    }

    return normalFF * idleFF;
  }

  /// <summary>
  /// Start-up polynomials - EGT (Celsius)
  /// </summary>
  double startEGT(double fbwN2, double preEGT, double idleN2, double ambientTemp, double idleEGT) {
    double normalEGT = 0;
    double outEGT = 0;
    double normalN2 = fbwN2 / idleN2;

    if (normalN2 < 0.17) {
      normalEGT = 0;
    } else if (normalN2 <= 0.4) {
      normalEGT = (0.04783 * normalN2) - 0.00813;
    } else {
      double c_EGT[9] = {-6.8725167e+02, 7.7548864e+03,  -3.7507098e+04, 1.0147016e+05, -1.6779273e+05,
                         1.7357157e+05,  -1.0960924e+05, 3.8591956e+04,  -5.7912600e+03};

      normalEGT = c_EGT[0] + (c_EGT[1] * normalN2) + (c_EGT[2] * powFBW(normalN2, 2)) + (c_EGT[3] * powFBW(normalN2, 3)) +
                  (c_EGT[4] * powFBW(normalN2, 4)) + (c_EGT[5] * powFBW(normalN2, 5)) + (c_EGT[6] * powFBW(normalN2, 6)) +
                  (c_EGT[7] * powFBW(normalN2, 7)) + (c_EGT[8] * powFBW(normalN2, 8));
    }

    outEGT = (normalEGT * (idleEGT - (ambientTemp))) + (ambientTemp);

    return outEGT;
  }

  /// <summary>
  /// Start-up polynomials - Oil Temperature (Celsius)
  /// </summary>
  double startOilTemp(double fbwN2, double idleN2, double ambientTemp) {
    double outOilTemp = 0;

    if (fbwN2 < 0.79 * idleN2) {
      outOilTemp = ambientTemp;
    } else if (fbwN2 < 0.98 * idleN2) {
      outOilTemp = ambientTemp + 5;
    } else {
      outOilTemp = ambientTemp + 10;
    }

    return outOilTemp;
  }

  /// <summary>
  /// Real-life modeled polynomials - Corrected EGT (Celsius)
  /// </summary>
  double correctedEGT(double cn1, double cff, double mach, double alt) {
    double outCEGT = 0;

    double c_EGT[16] = {443.3145034,    0.0000000e+00, 3.0141710e+00,  3.9132758e-02, -4.8488279e+02, -1.2890964e-03,
                        -2.2332050e-02, 8.3849683e-05, 6.0478647e+00,  6.9171710e-05, -6.5369271e-07, -8.1438322e-03,
                        -5.1229403e-07, 7.4657497e+01, -4.6016728e-03, 2.8637860e-08};

    outCEGT = c_EGT[0] + c_EGT[1] + (c_EGT[2] * cn1) + (c_EGT[3] * cff) + (c_EGT[4] * mach) + (c_EGT[5] * alt) +
              (c_EGT[6] * powFBW(cn1, 2)) + (c_EGT[7] * cn1 * cff) + (c_EGT[8] * cn1 * mach) + (c_EGT[9] * cn1 * alt) +
              (c_EGT[10] * powFBW(cff, 2)) + (c_EGT[11] * mach * cff) + (c_EGT[12] * cff * alt) + (c_EGT[13] * powFBW(mach, 2)) +
              (c_EGT[14] * mach * alt) + (c_EGT[15] * powFBW(alt, 2));

    return outCEGT;
  }

  /// <summary>
  /// Real-life modeled polynomials - Corrected Fuel Flow (lbs/ hr)
  /// </summary>
  double correctedFuelFlow(double cn1, double mach, double alt) {
    double outCFF = 0;

    double c_Flow[21] = {-639.6602981, 0.00000e+00,  1.03705e+02,  -2.23264e+03, 5.70316e-03, -2.29404e+00, 1.08230e+02,
                         2.77667e-04,  -6.17180e+02, -7.20713e-02, 2.19013e-07,  2.49418e-02, -7.31662e-01, -1.00003e-05,
                         -3.79466e+01, 1.34552e-03,  5.72612e-09,  -2.71950e+02, 8.58469e-02, -2.72912e-06, 2.02928e-11};

    outCFF = c_Flow[0] + c_Flow[1] + (c_Flow[2] * cn1) + (c_Flow[3] * mach) + (c_Flow[4] * alt) + (c_Flow[5] * powFBW(cn1, 2)) +
             (c_Flow[6] * cn1 * mach) + (c_Flow[7] * cn1 * alt) + (c_Flow[8] * powFBW(mach, 2)) + (c_Flow[9] * mach * alt) +
             (c_Flow[10] * powFBW(alt, 2)) + (c_Flow[11] * powFBW(cn1, 3)) + (c_Flow[12] * powFBW(cn1, 2) * mach) +
             (c_Flow[13] * powFBW(cn1, 2) * alt) + (c_Flow[14] * cn1 * powFBW(mach, 2)) + (c_Flow[15] * cn1 * mach * alt) +
             (c_Flow[16] * cn1 * powFBW(alt, 2)) + (c_Flow[17] * powFBW(mach, 3)) + (c_Flow[18] * powFBW(mach, 2) * alt) +
             (c_Flow[19] * mach * powFBW(alt, 2)) + (c_Flow[20] * powFBW(alt, 3));

    return outCFF;
  }

  double oilTemperature(double energy, double preOilTemp, double maxOilTemp, double deltaTime) {
    double t_steady = 0;
    double k = 0.001;
    double dt = 0;
    double oilTemp_out;

    dt = energy * deltaTime * 0.002;

    t_steady = ((maxOilTemp * k * deltaTime) + preOilTemp) / (1 + (k * deltaTime));

    if (t_steady - dt >= maxOilTemp) {
      oilTemp_out = maxOilTemp;
    } else if (t_steady - dt >= maxOilTemp - 10) {
      oilTemp_out = (t_steady - dt) * 0.999997;
    } else {
      oilTemp_out = (t_steady - dt);
    }

    // std::cout << "FADEC: Max= " << maxOilTemp << " Energy = " << energy << " dt = " << dt << " preT= " << preOilTemp
    //          << " Tss = " << t_steady << " To = " << oilTemp_out << std::flush;

    return oilTemp_out;
  }

  /// <summary>
  /// Real-life modeled polynomials - Oil Gulping (%)
  /// </summary>
  double oilGulpPct(double thrust) {
    double outOilGulpPct = 0;

    double c_OilGulp[3] = {20.1968848, -1.2270302e-4, 1.78442e-8};

    outOilGulpPct = c_OilGulp[0] + (c_OilGulp[1] * thrust) + (c_OilGulp[2] * powFBW(thrust, 2));

    return outOilGulpPct / 100;
  }

  /// <summary>
  /// Real-life modeled polynomials - Oil Pressure (PSI)
  /// </summary>
  double oilPressure(double simN2) {
    double outOilPressure = 0;

    double c_OilPress[3] = {-0.88921, 0.23711, 0.00682};

    outOilPressure = c_OilPress[0] + (c_OilPress[1] * simN2) + (c_OilPress[2] * powFBW(simN2, 2));

    return outOilPressure;
  }
};
