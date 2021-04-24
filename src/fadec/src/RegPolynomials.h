#pragma once

/// A collection of multi-variate regression polynomials for engine parameters
class Polynomial {
 public:
  double egtNX(double cn1, double cff, double mach, double alt) {
    double egt_out = 0;

    double egt_coef[16] = {
        443.3145034,    0.0000000e+00,  3.0141710e+00,  3.9132758e-02,
        -4.8488279e+02, -1.2890964e-03, -2.2332050e-02, 8.3849683e-05,
        6.0478647e+00,  6.9171710e-05,  -6.5369271e-07, -8.1438322e-03,
        -5.1229403e-07, 7.4657497e+01,  -4.6016728e-03, 2.8637860e-08};

    egt_out = egt_coef[0] + egt_coef[1] + (egt_coef[2] * cn1) +
                     (egt_coef[3] * cff) + (egt_coef[4] * mach) +
                     (egt_coef[5] * alt) + (egt_coef[6] * pow(cn1, 2)) +
                     (egt_coef[7] * cn1 * cff) + (egt_coef[8] * cn1 * mach) +
                     (egt_coef[9] * cn1 * alt) + (egt_coef[10] * pow(cff, 2)) +
                     (egt_coef[11] * mach * cff) + (egt_coef[12] * cff * alt) +
                     (egt_coef[13] * pow(mach, 2)) +
                     (egt_coef[14] * mach * alt) + (egt_coef[15] * pow(alt, 2));

    return egt_out;
  }

  double flowNX(int idx, double cn1, double mach, double alt) {
    double flow_out = 0;

    double flow_coef[21] = {
        -639.6602981, 0.00000e+00, 1.03705e+02,  -2.23264e+03, 5.70316e-03,
        -2.29404e+00, 1.08230e+02, 2.77667e-04,  -6.17180e+02, -7.20713e-02,
        2.19013e-07,  2.49418e-02, -7.31662e-01, -1.00003e-05, -3.79466e+01,
        1.34552e-03,  5.72612e-09, -2.71950e+02, 8.58469e-02,  -2.72912e-06,
        2.02928e-11};

    // CRZ fuel flow
    flow_out =
        flow_coef[0] + flow_coef[1] + (flow_coef[2] * cn1) +
        (flow_coef[3] * mach) + (flow_coef[4] * alt) +
        (flow_coef[5] * pow(cn1, 2)) + (flow_coef[6] * cn1 * mach) +
        (flow_coef[7] * cn1 * alt) + (flow_coef[8] * pow(mach, 2)) +
        (flow_coef[9] * mach * alt) + (flow_coef[10] * pow(alt, 2)) +
        (flow_coef[11] * pow(cn1, 3)) + (flow_coef[12] * pow(cn1, 2) * mach) +
        (flow_coef[13] * pow(cn1, 2) * alt) +
        (flow_coef[14] * cn1 * pow(mach, 2)) +
        (flow_coef[15] * cn1 * mach * alt) +
        (flow_coef[16] * cn1 * pow(alt, 2)) + (flow_coef[17] * pow(mach, 3)) +
        (flow_coef[18] * pow(mach, 2) * alt) +
        (flow_coef[19] * mach * pow(alt, 2)) + (flow_coef[20] * pow(alt, 3));

    return flow_out;
  }
};
