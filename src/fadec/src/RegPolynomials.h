#pragma once

/// A collection of multi-variate regression polynomials for engine parameters
class Polynomial {
 public:
  ////////////////////////////////////
  // Start-up procedure polynomials
  ////////////////////////////////////
  double n2NX(double n2, double preN2, double idleN2) {
    double n2_out = 0;
    double norm_n2 = 0;

    norm_n2 = n2 * 68.2 / idleN2;

    double n2_coef[16] = {4.03649879e+00,  -9.41981960e-01, 1.98426614e-01,  -2.11907840e-02, 1.00777507e-03,  -1.57319166e-06,
                          -2.15034888e-06, 1.08288379e-07,  -2.48504632e-09, 2.52307089e-11,  -2.06869243e-14, 8.99045761e-16,
                          -9.94853959e-17, 1.85366499e-18,  -1.44869928e-20, 4.31033031e-23};

    n2_out = n2_coef[0] + (n2_coef[1] * norm_n2) + (n2_coef[2] * pow(norm_n2, 2)) + (n2_coef[3] * pow(norm_n2, 3)) +
             (n2_coef[4] * pow(norm_n2, 4)) + (n2_coef[5] * pow(norm_n2, 5)) + (n2_coef[6] * pow(norm_n2, 6)) +
             (n2_coef[7] * pow(norm_n2, 7)) + (n2_coef[8] * pow(norm_n2, 8)) + (n2_coef[9] * pow(norm_n2, 9)) +
             (n2_coef[10] * pow(norm_n2, 10)) + (n2_coef[11] * pow(norm_n2, 11)) + (n2_coef[12] * pow(norm_n2, 12)) +
             (n2_coef[13] * pow(norm_n2, 13)) + (n2_coef[14] * pow(norm_n2, 14)) + (n2_coef[15] * pow(norm_n2, 15));

    n2_out = n2_out * n2;

    if (n2_out < preN2) {
      n2_out = preN2 + 0.002;
    }
    if (n2_out >= idleN2 + 0.1) {
      n2_out = idleN2 + 0.05;
    }

    return n2_out;
  }

  double n1NX(double n2fbw, double idleN2, double idleN1) {
    double n1_norm = 0;
    double n1_out = 0;
    double norm_n2 = n2fbw / idleN2;

    if (norm_n2 <= 0.29) {
      n1_norm = 0;
    } else {
      double n1_coef[9] = {-2.2812155821763376e-12, -59.830374492124584, 706.2909384361325,  -3458.036096870525, 9142.892323008544,
                           -14097.740017074308,     12704.109614026833,  -6209.993469596153, 1273.3070825616032};

      n1_norm = n1_coef[0] + (n1_coef[1] * norm_n2) + (n1_coef[2] * pow(norm_n2, 2)) + (n1_coef[3] * pow(norm_n2, 3)) +
                (n1_coef[4] * pow(norm_n2, 4)) + (n1_coef[5] * pow(norm_n2, 5)) + (n1_coef[6] * pow(norm_n2, 6)) +
                (n1_coef[7] * pow(norm_n2, 7)) + (n1_coef[8] * pow(norm_n2, 8));
    }

    return n1_norm * idleN1;
  }

  double startFFNX(double n2fbw, double idleN2, double idleFF) {
    double ff_norm = 0;
    double ff_out = 0;
    double norm_n2 = n2fbw / idleN2;

    if (norm_n2 <= 0.37) {
      ff_norm = 0;
    } else {
      double ff_coef[9] = {3.1110281573954915e-12, 108.04331472261403, -1397.2628762726968, 7487.41310408937,  -21511.983301100157,
                           35957.75663785097,      -35093.99370177828, 18573.03302758947,   -4122.006205101296};

      ff_norm = ff_coef[0] + (ff_coef[1] * norm_n2) + (ff_coef[2] * pow(norm_n2, 2)) + (ff_coef[3] * pow(norm_n2, 3)) +
                (ff_coef[4] * pow(norm_n2, 4)) + (ff_coef[5] * pow(norm_n2, 5)) + (ff_coef[6] * pow(norm_n2, 6)) +
                (ff_coef[7] * pow(norm_n2, 7)) + (ff_coef[8] * pow(norm_n2, 8));
    }

    if (ff_norm < 0) {
      ff_norm = 0;
    }

    return ff_norm * idleFF;
  }

  double startEGTNX(double n2fbw, double pre_EGT, double idleN2, double ambientTemp, double idleEGT) {
    double egt_norm = 0;
    double egt_out = 0;
    double norm_n2 = n2fbw / idleN2;

    if (norm_n2 < 0.17) {
      egt_norm = 0;
    } else if (norm_n2 <= 0.4) {
      egt_norm = (0.04783 * norm_n2) - 0.00813;
    } else {
      double egt_coef[9] = {-687.2516656387066, 7754.886445826888,   -37507.09758216612, 101470.16132481281, -167792.72627748575,
                            173571.57498305102, -109609.24313962896, 38591.95594405077,  -5791.260032821959};

      egt_norm = egt_coef[0] + (egt_coef[1] * norm_n2) + (egt_coef[2] * pow(norm_n2, 2)) + (egt_coef[3] * pow(norm_n2, 3)) +
                 (egt_coef[4] * pow(norm_n2, 4)) + (egt_coef[5] * pow(norm_n2, 5)) + (egt_coef[6] * pow(norm_n2, 6)) +
                 (egt_coef[7] * pow(norm_n2, 7)) + (egt_coef[8] * pow(norm_n2, 8));
    }

    egt_out = (egt_norm * (idleEGT - (ambientTemp))) + (ambientTemp);

    return egt_out;
  }

  ////////////////////////////////////
  // Real-life Modeled Parameters
  ////////////////////////////////////
  double cegtNX(double cn1, double cff, double mach, double alt) {
    double cegt_out = 0;

    double cegt_coef[16] = {443.3145034,    0.0000000e+00, 3.0141710e+00,  3.9132758e-02, -4.8488279e+02, -1.2890964e-03,
                            -2.2332050e-02, 8.3849683e-05, 6.0478647e+00,  6.9171710e-05, -6.5369271e-07, -8.1438322e-03,
                            -5.1229403e-07, 7.4657497e+01, -4.6016728e-03, 2.8637860e-08};

    cegt_out = cegt_coef[0] + cegt_coef[1] + (cegt_coef[2] * cn1) + (cegt_coef[3] * cff) + (cegt_coef[4] * mach) + (cegt_coef[5] * alt) +
               (cegt_coef[6] * pow(cn1, 2)) + (cegt_coef[7] * cn1 * cff) + (cegt_coef[8] * cn1 * mach) + (cegt_coef[9] * cn1 * alt) +
               (cegt_coef[10] * pow(cff, 2)) + (cegt_coef[11] * mach * cff) + (cegt_coef[12] * cff * alt) + (cegt_coef[13] * pow(mach, 2)) +
               (cegt_coef[14] * mach * alt) + (cegt_coef[15] * pow(alt, 2));

    return cegt_out;
  }

  double cflowNX(double cn1, double mach, double alt) {
    double cflow_out = 0;

    double cflow_coef[21] = {-639.6602981, 0.00000e+00,  1.03705e+02,  -2.23264e+03, 5.70316e-03, -2.29404e+00, 1.08230e+02,
                             2.77667e-04,  -6.17180e+02, -7.20713e-02, 2.19013e-07,  2.49418e-02, -7.31662e-01, -1.00003e-05,
                             -3.79466e+01, 1.34552e-03,  5.72612e-09,  -2.71950e+02, 8.58469e-02, -2.72912e-06, 2.02928e-11};

    // CRZ fuel cflow
    cflow_out = cflow_coef[0] + cflow_coef[1] + (cflow_coef[2] * cn1) + (cflow_coef[3] * mach) + (cflow_coef[4] * alt) +
                (cflow_coef[5] * pow(cn1, 2)) + (cflow_coef[6] * cn1 * mach) + (cflow_coef[7] * cn1 * alt) +
                (cflow_coef[8] * pow(mach, 2)) + (cflow_coef[9] * mach * alt) + (cflow_coef[10] * pow(alt, 2)) +
                (cflow_coef[11] * pow(cn1, 3)) + (cflow_coef[12] * pow(cn1, 2) * mach) + (cflow_coef[13] * pow(cn1, 2) * alt) +
                (cflow_coef[14] * cn1 * pow(mach, 2)) + (cflow_coef[15] * cn1 * mach * alt) + (cflow_coef[16] * cn1 * pow(alt, 2)) +
                (cflow_coef[17] * pow(mach, 3)) + (cflow_coef[18] * pow(mach, 2) * alt) + (cflow_coef[19] * mach * pow(alt, 2)) +
                (cflow_coef[20] * pow(alt, 3));

    return cflow_out;
  }

  double oilGulpPct(double thrust) {
    double oilGulpPct_out = 0;

    double oilGulpPct_coef[3] = {20.1968848, -1.2270302e-4, 1.78442e-8};

    oilGulpPct_out = oilGulpPct_coef[0] + (oilGulpPct_coef[1] * thrust) + (oilGulpPct_coef[2] * pow(thrust, 2));

    return oilGulpPct_out / 100;
  }

  double oilPressure(double simN2) {
    double oilPressure_out = 0;

    //double oilPressure_coef[2] = {-59.82000, 1.52844};
    double oilPressure_coef[3] = {-0.88921, 0.23711, 0.00682};

    oilPressure_out = oilPressure_coef[0] + (oilPressure_coef[1] * simN2) + (oilPressure_coef[2] * pow(simN2,2));

    return oilPressure_out;
  }
};
