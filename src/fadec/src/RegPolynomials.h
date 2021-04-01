#pragma once

/// <summary>
/// A collection of ression polynomials for engine parameters
/// </summary>
class Polynomial {
 public:
  double egtNX(double cn1, double mach, double alt, double isa) {
    double egt_coef[36] = {439.19479303830013, 3.73886284e-04,  -6.19083094e+00, -3.68383912e+01, -2.07101387e-03, 3.06556157e+00,
                           1.10553060e-01,     3.22190024e+00,  5.45688444e-05,  -3.80054219e-02, -3.57648266e+02, -6.98940659e-04,
                           -3.29527354e-01,    -1.01903175e-07, 2.45101622e-05,  4.17337023e-03,  -1.38655994e-04, -2.47009187e-02,
                           -4.08249001e-07,    2.34142713e-04,  1.57511073e+00,  1.19845109e-05,  5.68528831e-03,  2.05944783e-10,
                           -1.56299935e-07,    -6.68231253e-05, 1.56793944e+02,  7.70969551e-04,  -4.07722666e-01, -4.71683265e-09,
                           -1.21408283e-05,    -9.09550414e-04, 1.35035872e-12,  2.32377898e-10,  -6.55154381e-08, -2.40873623e-05};

    // CFM56 to LEAP engine adaptation
    double cfm2leap = (-0.00008970 * pow(cn1, 2)) + (0.00932649 * cn1) + 1.22207826;

    double egt_est = egt_coef[0] + egt_coef[1] + (egt_coef[2] * cn1) + (egt_coef[3] * mach) + (egt_coef[4] * alt) + (egt_coef[5] * isa) +
                     (egt_coef[6] * pow(cn1, 2)) + (egt_coef[7] * cn1 * mach) + (egt_coef[8] * cn1 * alt) + (egt_coef[9] * cn1 * isa) +
                     (egt_coef[10] * pow(mach, 2)) + (egt_coef[11] * mach * alt) + (egt_coef[12] * mach * isa) +
                     (egt_coef[13] * pow(alt, 2)) + (egt_coef[14] * alt * isa) + (egt_coef[15] * pow(isa, 2)) +
                     (egt_coef[16] * pow(cn1, 3)) + (egt_coef[17] * pow(cn1, 2) * mach) + (egt_coef[18] * pow(cn1, 2) * alt) +
                     (egt_coef[19] * pow(cn1, 2) * isa) + (egt_coef[20] * cn1 * pow(mach, 2)) + (egt_coef[21] * cn1 * mach * alt) +
                     (egt_coef[22] * cn1 * mach * isa) + (egt_coef[23] * cn1 * pow(alt, 2)) + (egt_coef[24] * cn1 * alt * isa) +
                     (egt_coef[25] * cn1 * pow(isa, 2)) + (egt_coef[26] * pow(mach, 3)) + (egt_coef[27] * pow(mach, 2) * alt) +
                     (egt_coef[28] * pow(mach, 2) * isa) + (egt_coef[29] * mach * pow(alt, 2)) + (egt_coef[30] * mach * alt * isa) +
                     (egt_coef[31] * mach * pow(isa, 2)) + (egt_coef[32] * pow(alt, 3)) + (egt_coef[33] * pow(alt, 2) * isa) +
                     (egt_coef[34] * alt * pow(isa, 2)) + (egt_coef[35] * pow(isa, 3));

    // Account for Taxi/ Takeoff phase non-linearities
    if (cn1 <= 30.499) {
      egt_est = egt_est * ((0.000445 * pow(cn1, 2)) - (0.02779 * cn1) + 1.433663);
    }
    return egt_est * cfm2leap;
  }

  double flowNX(int idx, double cn1, double mach, double alt, double isa, double preFlightPhase, double actualFlightPhase) {
    double flow_out = 0;
    double cfm2leap = 0;
    double flow_base = 0;
    double flow_crz = 0;
    double flow_to = 0;
    double flow_clb = 0;
    double flow_dsc = 0;
    double actPhaseFF = 0;

    double flow_coef[36] = {-737.1844191320206, -3.80575101e-03, 7.08383000e+01,  1.42324185e+02,  -2.02956471e-02, -8.78129239e+00,
                            -1.34199619e+00,    1.06144644e+01,  4.12185469e-04,  4.26232094e-01,  -1.93471814e+03, -1.75585235e-02,
                            6.16437246e-01,     7.08825149e-07,  9.82113776e-05,  -2.19309423e-03, 1.27385754e-02,  -1.20066023e-01,
                            -1.41696561e-06,    -5.24660662e-03, -2.77203489e+00, 2.31986945e-04,  6.16611336e-04,  -5.59973454e-09,
                            -2.91651216e-06,    4.37402125e-04,  1.29567507e+03,  3.13286787e-03,  1.36270072e-01,  5.89039214e-08,
                            -1.16421205e-04,    -7.44491647e-03, -8.05264069e-12, 2.19677475e-09,  -1.90705995e-07, -1.45941170e-04};

    // CFM56 to LEAP engine adaptation
    cfm2leap = (-0.00017641 * pow(cn1, 2)) + (0.01910298 * cn1) + 1.69322334;

    // CRZ fuel flow
    flow_base = flow_coef[0] + flow_coef[1] + (flow_coef[2] * cn1) + (flow_coef[3] * mach) + (flow_coef[4] * alt) + (flow_coef[5] * isa) +
                (flow_coef[6] * pow(cn1, 2)) + (flow_coef[7] * cn1 * mach) + (flow_coef[8] * cn1 * alt) + (flow_coef[9] * cn1 * isa) +
                (flow_coef[10] * pow(mach, 2)) + (flow_coef[11] * mach * alt) + (flow_coef[12] * mach * isa) +
                (flow_coef[13] * pow(alt, 2)) + (flow_coef[14] * alt * isa) + (flow_coef[15] * pow(isa, 2)) +
                (flow_coef[16] * pow(cn1, 3)) + (flow_coef[17] * pow(cn1, 2) * mach) + (flow_coef[18] * pow(cn1, 2) * alt) +
                (flow_coef[19] * pow(cn1, 2) * isa) + (flow_coef[20] * cn1 * pow(mach, 2)) + (flow_coef[21] * cn1 * mach * alt) +
                (flow_coef[22] * cn1 * mach * isa) + (flow_coef[23] * cn1 * pow(alt, 2)) + (flow_coef[24] * cn1 * alt * isa) +
                (flow_coef[25] * cn1 * pow(isa, 2)) + (flow_coef[26] * pow(mach, 3)) + (flow_coef[27] * pow(mach, 2) * alt) +
                (flow_coef[28] * pow(mach, 2) * isa) + (flow_coef[29] * mach * pow(alt, 2)) + (flow_coef[30] * mach * alt * isa) +
                (flow_coef[31] * mach * pow(isa, 2)) + (flow_coef[32] * pow(alt, 3)) + (flow_coef[33] * pow(alt, 2) * isa) +
                (flow_coef[34] * alt * pow(isa, 2)) + (flow_coef[35] * pow(isa, 3));

    // TO fuel flow
    flow_to = flow_base * cfm2leap * ((0.00000929 * pow(cn1, 3)) - (0.00169479 * pow(cn1, 2)) + (0.08443855 * cn1) + 0.42353721);

    // CLB fuel flow
    flow_clb = flow_base * cfm2leap * 1.033873582;

    // CRZ fuel flow
    flow_crz = flow_base * cfm2leap * 0.9989733865;

    // DSC fuel flow
    flow_dsc = flow_base * cfm2leap * ((0.00003731 * pow(cn1, 2)) - (0.01212914 * cn1) + 1.65688177);

    // Fuel Flow Logic and Smoothing functions
    double flow_array[4] = {flow_to, flow_clb, flow_crz, flow_dsc};
    actPhaseFF = flow_array[int(actualFlightPhase)];

    return actPhaseFF;
  }
};
