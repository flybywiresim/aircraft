#include "AutopilotLaws.h"
#include "AutopilotLaws_private.h"
#include "look1_binlxpw.h"
#include "mod_mvZvttxs.h"
#include "rt_modd.h"

const uint8_T AutopilotLaws_IN_any{ 1U };

const uint8_T AutopilotLaws_IN_left{ 2U };

const uint8_T AutopilotLaws_IN_right{ 3U };

const uint8_T AutopilotLaws_IN_any_n{ 1U };

const uint8_T AutopilotLaws_IN_left_l{ 2U };

const uint8_T AutopilotLaws_IN_right_j{ 3U };

const uint8_T AutopilotLaws_IN_InAir{ 1U };

const uint8_T AutopilotLaws_IN_OnGround{ 2U };

void AutopilotLawsModelClass::AutopilotLaws_MATLABFunction(real_T rtu_tau, real_T rtu_zeta, real_T *rty_k2, real_T
  *rty_k1)
{
  real_T t;
  t = rtu_tau / 3600.0;
  *rty_k1 = 180.0 / (39.478417604357432 * rtu_zeta * t);
  *rty_k2 = rtu_zeta / (215666.565757755 * t);
}

void AutopilotLawsModelClass::AutopilotLaws_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_AutopilotLaws_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca + localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void AutopilotLawsModelClass::AutopilotLaws_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_AutopilotLaws_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void AutopilotLawsModelClass::AutopilotLaws_MATLABFunction_f_Init(rtDW_MATLABFunction_AutopilotLaws_d_T *localDW)
{
  localDW->limit = 30.0;
}

void AutopilotLawsModelClass::AutopilotLaws_MATLABFunction_m(real_T rtu_Psi_c, real_T rtu_dPsi, real_T rtu_Phi_c, real_T
  *rty_up, real_T *rty_lo, rtDW_MATLABFunction_AutopilotLaws_d_T *localDW)
{
  static const int8_T b[5]{ 0, 5, 10, 20, 30 };

  static const int8_T c[5]{ 5, 5, 10, 30, 30 };

  boolean_T wasPsiCmdChanged;
  if (!localDW->lastPsi_not_empty) {
    localDW->lastPsi = rtu_Psi_c;
    localDW->lastPsi_not_empty = true;
  }

  wasPsiCmdChanged = (rtu_Psi_c != localDW->lastPsi);
  if (wasPsiCmdChanged || (std::abs(rtu_dPsi) > localDW->limitDeltaPsi)) {
    localDW->limitDeltaPsi = std::abs(rtu_dPsi);
    if (localDW->limitDeltaPsi > 30.0) {
      localDW->limit = 30.0;
    } else {
      real_T r;
      int32_T high_i;
      int32_T low_i;
      int32_T low_ip1;
      high_i = 5;
      low_i = 0;
      low_ip1 = 2;
      while (high_i > low_ip1) {
        int32_T mid_i;
        mid_i = ((low_i + high_i) + 1) >> 1;
        if (localDW->limitDeltaPsi >= b[mid_i - 1]) {
          low_i = mid_i - 1;
          low_ip1 = mid_i + 1;
        } else {
          high_i = mid_i;
        }
      }

      r = (localDW->limitDeltaPsi - static_cast<real_T>(b[low_i])) / static_cast<real_T>(b[low_i + 1] - b[low_i]);
      if (r == 0.0) {
        localDW->limit = c[low_i];
      } else if (r == 1.0) {
        localDW->limit = c[low_i + 1];
      } else if (c[low_i + 1] == c[low_i]) {
        localDW->limit = c[low_i];
      } else {
        localDW->limit = (1.0 - r) * static_cast<real_T>(c[low_i]) + static_cast<real_T>(c[low_i + 1]) * r;
      }
    }
  }

  if ((!wasPsiCmdChanged) && (std::abs(rtu_Phi_c) < localDW->limit)) {
    localDW->limit = 30.0;
  }

  *rty_up = localDW->limit;
  *rty_lo = -localDW->limit;
  localDW->lastPsi = rtu_Psi_c;
}

void AutopilotLawsModelClass::AutopilotLaws_Chart_Init(real_T *rty_out)
{
  *rty_out = 0.0;
}

void AutopilotLawsModelClass::AutopilotLaws_Chart(real_T rtu_right, real_T rtu_left, boolean_T rtu_use_short_path,
  real_T *rty_out, rtDW_Chart_AutopilotLaws_T *localDW)
{
  if (localDW->is_active_c10_AutopilotLaws == 0U) {
    localDW->is_active_c10_AutopilotLaws = 1U;
    localDW->is_c10_AutopilotLaws = AutopilotLaws_IN_any;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c10_AutopilotLaws) {
     case AutopilotLaws_IN_any:
      {
        real_T tmp;
        real_T tmp_0;
        boolean_T tmp_1;
        tmp = std::abs(rtu_right);
        tmp_0 = std::abs(rtu_left);
        tmp_1 = !rtu_use_short_path;
        if (tmp_1 && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
          localDW->is_c10_AutopilotLaws = AutopilotLaws_IN_right;
          *rty_out = rtu_right;
        } else if (tmp_1 && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
          localDW->is_c10_AutopilotLaws = AutopilotLaws_IN_left;
          *rty_out = rtu_left;
        } else if (tmp_0 < tmp) {
          *rty_out = rtu_left;
        } else {
          *rty_out = rtu_right;
        }
      }
      break;

     case AutopilotLaws_IN_left:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_left);
        tmp_0 = std::abs(rtu_right);
        if (rtu_use_short_path || (tmp_0 < 10.0) || (tmp < 10.0)) {
          localDW->is_c10_AutopilotLaws = AutopilotLaws_IN_any;
          if (tmp < tmp_0) {
            *rty_out = rtu_left;
          } else {
            *rty_out = rtu_right;
          }
        } else {
          *rty_out = rtu_left;
        }
      }
      break;

     default:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_left);
        tmp_0 = std::abs(rtu_right);
        if (rtu_use_short_path || (tmp_0 < 10.0) || (tmp < 10.0)) {
          localDW->is_c10_AutopilotLaws = AutopilotLaws_IN_any;
          if (tmp < tmp_0) {
            *rty_out = rtu_left;
          } else {
            *rty_out = rtu_right;
          }
        } else {
          *rty_out = rtu_right;
        }
      }
      break;
    }
  }
}

void AutopilotLawsModelClass::AutopilotLaws_Chart_g_Init(real_T *rty_out)
{
  *rty_out = 0.0;
}

void AutopilotLawsModelClass::AutopilotLaws_Chart_h(real_T rtu_right, real_T rtu_left, real_T rtu_use_short_path, real_T
  *rty_out, rtDW_Chart_AutopilotLaws_m_T *localDW)
{
  if (localDW->is_active_c15_AutopilotLaws == 0U) {
    localDW->is_active_c15_AutopilotLaws = 1U;
    localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_any_n;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c15_AutopilotLaws) {
     case AutopilotLaws_IN_any_n:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_right);
        tmp_0 = std::abs(rtu_left);
        if ((rtu_use_short_path == 0.0) && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
          localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_right_j;
          *rty_out = rtu_right;
        } else if ((rtu_use_short_path == 0.0) && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
          localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_left_l;
          *rty_out = rtu_left;
        } else if (tmp_0 < tmp) {
          *rty_out = rtu_left;
        } else {
          *rty_out = rtu_right;
        }
      }
      break;

     case AutopilotLaws_IN_left_l:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_left);
        tmp_0 = std::abs(rtu_right);
        if ((rtu_use_short_path != 0.0) || (tmp_0 < 10.0) || (tmp < 10.0)) {
          localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_any_n;
          if (tmp < tmp_0) {
            *rty_out = rtu_left;
          } else {
            *rty_out = rtu_right;
          }
        } else {
          *rty_out = rtu_left;
        }
      }
      break;

     default:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_left);
        tmp_0 = std::abs(rtu_right);
        if ((rtu_use_short_path != 0.0) || (tmp_0 < 10.0) || (tmp < 10.0)) {
          localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_any_n;
          if (tmp < tmp_0) {
            *rty_out = rtu_left;
          } else {
            *rty_out = rtu_right;
          }
        } else {
          *rty_out = rtu_right;
        }
      }
      break;
    }
  }
}

void AutopilotLawsModelClass::AutopilotLaws_storevalue(boolean_T rtu_active, real_T rtu_u, real_T *rty_y,
  rtDW_storevalue_AutopilotLaws_T *localDW)
{
  if ((!rtu_active) || (!localDW->storage_not_empty)) {
    localDW->storage = rtu_u;
    localDW->storage_not_empty = true;
  }

  *rty_y = localDW->storage;
}

void AutopilotLawsModelClass::AutopilotLaws_LeadLagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_C2, real_T rtu_C3,
  real_T rtu_C4, real_T rtu_dt, real_T *rty_Y, rtDW_LeadLagFilter_AutopilotLaws_T *localDW)
{
  real_T denom;
  real_T denom_tmp;
  real_T tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = rtu_dt * rtu_C4;
  denom = 2.0 * rtu_C3 + denom_tmp;
  tmp = rtu_dt * rtu_C2;
  *rty_Y = ((2.0 * rtu_C1 + tmp) / denom * rtu_U + (tmp - 2.0 * rtu_C1) / denom * localDW->pU) + (2.0 * rtu_C3 -
    denom_tmp) / denom * localDW->pY;
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void AutopilotLawsModelClass::AutopilotLaws_WashoutFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_WashoutFilter_AutopilotLaws_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = rtu_dt * rtu_C1;
  ca = 2.0 / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca - localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void AutopilotLawsModelClass::AutopilotLaws_V_LSSpeedSelection1(real_T rtu_V_c, real_T rtu_VLS, real_T *rty_y)
{
  if (rtu_V_c <= rtu_VLS) {
    *rty_y = rtu_VLS - 5.0;
  } else {
    *rty_y = rtu_VLS;
  }
}

void AutopilotLawsModelClass::AutopilotLaws_SpeedProtectionSignalSelection(const ap_laws_output *rtu_in, real_T
  rtu_VS_FD, real_T rtu_VS_AP, real_T rtu_VLS_FD, real_T rtu_VLS_AP, real_T rtu_VMAX_FD, real_T rtu_VMAX_AP, real_T
  rtu_margin, real_T *rty_FD, real_T *rty_AP)
{
  real_T rtu_in_0;
  if (rtu_in->input.V_c_kn <= rtu_in->data.VLS_kn) {
    rtu_in_0 = rtu_in->data.VLS_kn - 5.0;
  } else {
    rtu_in_0 = rtu_in->data.VLS_kn;
  }

  if (rtu_in->data.V_ias_kn < rtu_in_0 + rtu_margin) {
    *rty_FD = std::fmin(rtu_VS_FD, rtu_VLS_FD);
    *rty_AP = std::fmin(rtu_VS_AP, rtu_VLS_AP);
  } else if (rtu_in->data.V_ias_kn > rtu_in->data.VMAX_kn - rtu_margin) {
    *rty_FD = std::fmax(rtu_VS_FD, rtu_VMAX_FD);
    *rty_AP = std::fmax(rtu_VS_AP, rtu_VMAX_AP);
  } else {
    *rty_FD = rtu_VS_FD;
    *rty_AP = rtu_VS_AP;
  }
}

void AutopilotLawsModelClass::AutopilotLaws_VSLimiter(real_T rtu_u, const ap_laws_output *rtu_in, real_T *rty_y)
{
  real_T limit;
  limit = 9.81 / (rtu_in->data.V_tas_kn * 0.51444444444444448) * 0.15 * 57.295779513082323;
  *rty_y = std::fmax(-limit, std::fmin(limit, rtu_u));
}

void AutopilotLawsModelClass::AutopilotLaws_SignalEnablerGSTrack(real_T rtu_u, boolean_T rtu_e, real_T *rty_y)
{
  if (rtu_e) {
    *rty_y = rtu_u;
  } else {
    *rty_y = 0.0;
  }
}

void AutopilotLawsModelClass::AutopilotLaws_Voter1(real_T rtu_u1, real_T rtu_u2, real_T rtu_u3, real_T *rty_Y)
{
  real_T v[3];
  int32_T rtu_u1_0;
  v[0] = rtu_u1;
  v[1] = rtu_u2;
  v[2] = rtu_u3;
  if (rtu_u1 < rtu_u2) {
    if (rtu_u2 < rtu_u3) {
      rtu_u1_0 = 1;
    } else if (rtu_u1 < rtu_u3) {
      rtu_u1_0 = 2;
    } else {
      rtu_u1_0 = 0;
    }
  } else if (rtu_u1 < rtu_u3) {
    rtu_u1_0 = 0;
  } else if (rtu_u2 < rtu_u3) {
    rtu_u1_0 = 2;
  } else {
    rtu_u1_0 = 1;
  }

  *rty_Y = v[rtu_u1_0];
}

void AutopilotLawsModelClass::step()
{
  static const real_T b[16]{ -2.469135802469121E-8, -2.469135802469121E-8, 1.3086419753086414E-6, 1.3086419753086427E-6,
    -0.00032222222222222233, -0.00033333333333333332, -0.00034444444444444442, 0.00024444444444444448,
    0.1488888888888889, 0.050555555555555548, -0.0511111111111111, -0.066111111111111134, 15.0, 30.0, 30.0, 19.0 };

  real_T result_tmp[9];
  real_T result[3];
  real_T result_0[3];
  real_T L;
  real_T Phi2;
  real_T R;
  real_T a;
  real_T b_L;
  real_T b_R;
  real_T distance_m;
  real_T limit;
  real_T rtb_Add3_b;
  real_T rtb_Add3_d2;
  real_T rtb_Add3_j3;
  real_T rtb_Add3_kx;
  real_T rtb_Cos1_f;
  real_T rtb_Cos_d5;
  real_T rtb_Divide;
  real_T rtb_FD_i;
  real_T rtb_Gain5_n;
  real_T rtb_GainTheta;
  real_T rtb_GainTheta1;
  real_T rtb_Gain_dn;
  real_T rtb_Gain_ij;
  real_T rtb_Saturation;
  real_T rtb_Sum3_ju;
  real_T rtb_Sum_ia;
  real_T rtb_Sum_if;
  real_T rtb_Y_e;
  real_T rtb_Y_f;
  real_T rtb_Y_j;
  real_T rtb_Y_lo;
  real_T rtb_dme;
  real_T rtb_error_c;
  real_T rtb_lo_a;
  real_T rtb_lo_f;
  int32_T i;
  int32_T low_i;
  int32_T low_ip1;
  int32_T rtb_Saturation_i;
  int32_T rtb_on_ground;
  boolean_T guard1{ false };

  boolean_T rtb_Compare_e;
  boolean_T rtb_Delay_j;
  boolean_T rtb_valid;
  boolean_T rtb_valid_m;
  rtb_Saturation_i = ((AutopilotLaws_U.in.input.enabled_AP1 != 0.0) || (AutopilotLaws_U.in.input.enabled_AP2 != 0.0));
  rtb_GainTheta = AutopilotLaws_P.GainTheta_Gain * AutopilotLaws_U.in.data.Theta_deg;
  rtb_GainTheta1 = AutopilotLaws_P.GainTheta1_Gain * AutopilotLaws_U.in.data.Phi_deg;
  rtb_dme = 0.017453292519943295 * rtb_GainTheta;
  b_R = 0.017453292519943295 * rtb_GainTheta1;
  Phi2 = std::tan(rtb_dme);
  a = std::sin(b_R);
  b_R = std::cos(b_R);
  result_tmp[0] = 1.0;
  result_tmp[3] = a * Phi2;
  result_tmp[6] = b_R * Phi2;
  result_tmp[1] = 0.0;
  result_tmp[4] = b_R;
  result_tmp[7] = -a;
  result_tmp[2] = 0.0;
  distance_m = std::cos(rtb_dme);
  rtb_Divide = 1.0 / distance_m;
  result_tmp[5] = rtb_Divide * a;
  result_tmp[8] = rtb_Divide * b_R;
  rtb_error_c = AutopilotLaws_P.Gain_Gain_de * AutopilotLaws_U.in.data.p_rad_s * AutopilotLaws_P.Gainpk_Gain;
  rtb_Saturation = AutopilotLaws_P.Gain_Gain_d * AutopilotLaws_U.in.data.q_rad_s * AutopilotLaws_P.Gainqk_Gain;
  Phi2 = AutopilotLaws_P.Gain_Gain_m * AutopilotLaws_U.in.data.r_rad_s;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result[rtb_on_ground] = (result_tmp[rtb_on_ground + 3] * rtb_Saturation + result_tmp[rtb_on_ground] * rtb_error_c) +
      result_tmp[rtb_on_ground + 6] * Phi2;
  }

  rtb_error_c = std::sin(rtb_dme);
  result_tmp[0] = distance_m;
  result_tmp[3] = 0.0;
  result_tmp[6] = -rtb_error_c;
  result_tmp[1] = a * rtb_error_c;
  result_tmp[4] = b_R;
  result_tmp[7] = distance_m * a;
  result_tmp[2] = b_R * rtb_error_c;
  result_tmp[5] = 0.0 - a;
  result_tmp[8] = b_R * distance_m;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result_0[rtb_on_ground] = (result_tmp[rtb_on_ground + 3] * AutopilotLaws_U.in.data.by_m_s2 +
      result_tmp[rtb_on_ground] * AutopilotLaws_U.in.data.bx_m_s2) + result_tmp[rtb_on_ground + 6] *
      AutopilotLaws_U.in.data.bz_m_s2;
  }

  if (AutopilotLaws_U.in.data.nav_dme_valid != 0.0) {
    rtb_dme = AutopilotLaws_U.in.data.nav_dme_nmi;
  } else if (AutopilotLaws_U.in.data.nav_loc_valid) {
    a = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lat - AutopilotLaws_U.in.data.aircraft_position.lat) *
                 0.017453292519943295 / 2.0);
    distance_m = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lon - AutopilotLaws_U.in.data.aircraft_position.lon)
                          * 0.017453292519943295 / 2.0);
    a = std::cos(0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lat) * std::cos(0.017453292519943295 *
      AutopilotLaws_U.in.data.nav_loc_position.lat) * distance_m * distance_m + a * a;
    rtb_dme = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
    distance_m = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_loc_position.alt;
    rtb_dme = std::sqrt(rtb_dme * rtb_dme + distance_m * distance_m) / 1852.0;
  } else {
    rtb_dme = 0.0;
  }

  rtb_error_c = 0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lat;
  Phi2 = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_loc_position.lat;
  rtb_Saturation = 0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lon;
  a = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lat - AutopilotLaws_U.in.data.aircraft_position.lat) *
               0.017453292519943295 / 2.0);
  distance_m = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lon - AutopilotLaws_U.in.data.aircraft_position.lon) *
                        0.017453292519943295 / 2.0);
  a = std::cos(rtb_error_c) * std::cos(Phi2) * distance_m * distance_m + a * a;
  distance_m = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  a = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_loc_position.alt;
  L = std::cos(Phi2);
  R = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_loc_position.lon - rtb_Saturation;
  b_L = mod_mvZvttxs((mod_mvZvttxs(mod_mvZvttxs(360.0) + 360.0) - (mod_mvZvttxs(mod_mvZvttxs
    (AutopilotLaws_U.in.data.nav_loc_magvar_deg) + 360.0) + 360.0)) + 360.0);
  b_R = mod_mvZvttxs(360.0 - b_L);
  if (std::abs(b_L) < std::abs(b_R)) {
    b_R = -b_L;
  }

  rtb_Divide = std::cos(rtb_error_c);
  rtb_error_c = std::sin(rtb_error_c);
  L = mod_mvZvttxs(mod_mvZvttxs(mod_mvZvttxs(std::atan2(std::sin(R) * L, rtb_Divide * std::sin(Phi2) - rtb_error_c * L *
    std::cos(R)) * 57.295779513082323 + 360.0)) + 360.0) + 360.0;
  Phi2 = mod_mvZvttxs((mod_mvZvttxs(mod_mvZvttxs(mod_mvZvttxs(mod_mvZvttxs(AutopilotLaws_U.in.data.nav_loc_deg - b_R) +
    360.0)) + 360.0) - L) + 360.0);
  b_R = mod_mvZvttxs(360.0 - Phi2);
  guard1 = false;
  if (std::abs(std::sqrt(distance_m * distance_m + a * a) / 1852.0) < 30.0) {
    L = mod_mvZvttxs((mod_mvZvttxs(mod_mvZvttxs(AutopilotLaws_U.in.data.nav_loc_deg) + 360.0) - L) + 360.0);
    R = mod_mvZvttxs(360.0 - L);
    if (std::abs(L) < std::abs(R)) {
      R = -L;
    }

    if ((std::abs(R) < 90.0) && ((AutopilotLaws_U.in.data.nav_loc_position.lat != 0.0) ||
         (AutopilotLaws_U.in.data.nav_loc_position.lon != 0.0) || (AutopilotLaws_U.in.data.nav_loc_position.alt != 0.0)))
    {
      rtb_valid = true;
      if (std::abs(Phi2) < std::abs(b_R)) {
        b_R = -Phi2;
      }
    } else {
      guard1 = true;
    }
  } else {
    guard1 = true;
  }

  if (guard1) {
    rtb_valid = false;
    b_R = 0.0;
  }

  if (AutopilotLaws_U.in.data.nav_gs_valid || (!AutopilotLaws_DWork.nav_gs_deg_not_empty)) {
    AutopilotLaws_DWork.nav_gs_deg = AutopilotLaws_U.in.data.nav_gs_deg;
    AutopilotLaws_DWork.nav_gs_deg_not_empty = true;
  }

  Phi2 = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_gs_position.lat;
  a = std::sin((AutopilotLaws_U.in.data.nav_gs_position.lat - AutopilotLaws_U.in.data.aircraft_position.lat) *
               0.017453292519943295 / 2.0);
  distance_m = std::sin((AutopilotLaws_U.in.data.nav_gs_position.lon - AutopilotLaws_U.in.data.aircraft_position.lon) *
                        0.017453292519943295 / 2.0);
  L = std::cos(Phi2);
  a = rtb_Divide * L * distance_m * distance_m + a * a;
  distance_m = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  a = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_gs_position.alt;
  distance_m = std::sqrt(distance_m * distance_m + a * a);
  rtb_Saturation = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_gs_position.lon - rtb_Saturation;
  rtb_Saturation = std::atan2(std::sin(rtb_Saturation) * L, rtb_Divide * std::sin(Phi2) - rtb_error_c * L * std::cos
    (rtb_Saturation)) * 57.295779513082323;
  if (rtb_Saturation + 360.0 == 0.0) {
    rtb_error_c = 0.0;
  } else {
    rtb_error_c = std::fmod(rtb_Saturation + 360.0, 360.0);
    if (rtb_error_c == 0.0) {
      rtb_error_c = 0.0;
    } else if (rtb_Saturation + 360.0 < 0.0) {
      rtb_error_c += 360.0;
    }
  }

  guard1 = false;
  if (std::abs(distance_m / 1852.0) < 30.0) {
    if (AutopilotLaws_U.in.data.nav_loc_deg == 0.0) {
      rtb_Saturation = 0.0;
    } else {
      rtb_Saturation = std::fmod(AutopilotLaws_U.in.data.nav_loc_deg, 360.0);
      if (rtb_Saturation == 0.0) {
        rtb_Saturation = 0.0;
      } else if (AutopilotLaws_U.in.data.nav_loc_deg < 0.0) {
        rtb_Saturation += 360.0;
      }
    }

    if (rtb_error_c == 0.0) {
      Phi2 = 0.0;
    } else {
      Phi2 = std::fmod(rtb_error_c, 360.0);
      if (Phi2 == 0.0) {
        Phi2 = 0.0;
      } else if (rtb_error_c < 0.0) {
        Phi2 += 360.0;
      }
    }

    if (rtb_Saturation + 360.0 == 0.0) {
      rtb_Saturation = 0.0;
    } else {
      rtb_Saturation = std::fmod(rtb_Saturation + 360.0, 360.0);
    }

    if (Phi2 + 360.0 == 0.0) {
      Phi2 = 0.0;
    } else {
      Phi2 = std::fmod(Phi2 + 360.0, 360.0);
    }

    R = (rtb_Saturation - (Phi2 + 360.0)) + 360.0;
    if (R == 0.0) {
      L = 0.0;
    } else {
      L = std::fmod(R, 360.0);
      if (L == 0.0) {
        L = 0.0;
      } else if (R < 0.0) {
        L += 360.0;
      }
    }

    if (360.0 - L == 0.0) {
      R = 0.0;
    } else {
      R = std::fmod(360.0 - L, 360.0);
      if (R == 0.0) {
        R = 0.0;
      } else if (360.0 - L < 0.0) {
        R += 360.0;
      }
    }

    if (std::abs(L) < std::abs(R)) {
      R = -L;
    }

    if ((std::abs(R) < 90.0) && ((AutopilotLaws_U.in.data.nav_gs_position.lat != 0.0) ||
         (AutopilotLaws_U.in.data.nav_gs_position.lon != 0.0) || (AutopilotLaws_U.in.data.nav_gs_position.alt != 0.0)))
    {
      rtb_valid_m = true;
      rtb_error_c = std::asin(a / distance_m) * 57.295779513082323 - AutopilotLaws_DWork.nav_gs_deg;
    } else {
      guard1 = true;
    }
  } else {
    guard1 = true;
  }

  if (guard1) {
    rtb_valid_m = false;
    rtb_error_c = 0.0;
  }

  rtb_Saturation = AutopilotLaws_P.Gain_Gain_n * AutopilotLaws_U.in.data.gear_strut_compression_1 -
    AutopilotLaws_P.Constant1_Value_b0;
  if (rtb_Saturation > AutopilotLaws_P.Saturation_UpperSat_p) {
    rtb_Saturation = AutopilotLaws_P.Saturation_UpperSat_p;
  } else if (rtb_Saturation < AutopilotLaws_P.Saturation_LowerSat_g) {
    rtb_Saturation = AutopilotLaws_P.Saturation_LowerSat_g;
  }

  Phi2 = AutopilotLaws_P.Gain1_Gain_ll * AutopilotLaws_U.in.data.gear_strut_compression_2 -
    AutopilotLaws_P.Constant1_Value_b0;
  if (Phi2 > AutopilotLaws_P.Saturation1_UpperSat_j) {
    Phi2 = AutopilotLaws_P.Saturation1_UpperSat_j;
  } else if (Phi2 < AutopilotLaws_P.Saturation1_LowerSat_d) {
    Phi2 = AutopilotLaws_P.Saturation1_LowerSat_d;
  }

  if (AutopilotLaws_DWork.is_active_c5_AutopilotLaws == 0U) {
    AutopilotLaws_DWork.is_active_c5_AutopilotLaws = 1U;
    AutopilotLaws_DWork.is_c5_AutopilotLaws = AutopilotLaws_IN_OnGround;
    rtb_on_ground = 1;
  } else if (AutopilotLaws_DWork.is_c5_AutopilotLaws == 1) {
    if ((rtb_Saturation > 0.05) || (Phi2 > 0.05)) {
      AutopilotLaws_DWork.is_c5_AutopilotLaws = AutopilotLaws_IN_OnGround;
      rtb_on_ground = 1;
    } else {
      rtb_on_ground = 0;
    }
  } else if ((rtb_Saturation == 0.0) && (Phi2 == 0.0)) {
    AutopilotLaws_DWork.is_c5_AutopilotLaws = AutopilotLaws_IN_InAir;
    rtb_on_ground = 0;
  } else {
    rtb_on_ground = 1;
  }

  rtb_Compare_e = (AutopilotLaws_U.in.data.altimeter_setting_left_mbar != AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_DWork.DelayInput1_DSTATE_g;
  AutopilotLaws_Y.out = AutopilotLaws_P.ap_laws_output_MATLABStruct;
  AutopilotLaws_Y.out.output.ap_on = rtb_Saturation_i;
  AutopilotLaws_Y.out.time = AutopilotLaws_U.in.time;
  AutopilotLaws_Y.out.data.aircraft_position = AutopilotLaws_U.in.data.aircraft_position;
  AutopilotLaws_Y.out.data.Theta_deg = rtb_GainTheta;
  AutopilotLaws_Y.out.data.Phi_deg = rtb_GainTheta1;
  AutopilotLaws_Y.out.data.qk_deg_s = result[1];
  AutopilotLaws_Y.out.data.rk_deg_s = result[2];
  AutopilotLaws_Y.out.data.pk_deg_s = result[0];
  AutopilotLaws_Y.out.data.V_ias_kn = AutopilotLaws_U.in.data.V_ias_kn;
  AutopilotLaws_Y.out.data.V_tas_kn = AutopilotLaws_U.in.data.V_tas_kn;
  AutopilotLaws_Y.out.data.V_mach = AutopilotLaws_U.in.data.V_mach;
  AutopilotLaws_Y.out.data.V_gnd_kn = AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_Y.out.data.alpha_deg = AutopilotLaws_U.in.data.alpha_deg;
  AutopilotLaws_Y.out.data.beta_deg = AutopilotLaws_U.in.data.beta_deg;
  AutopilotLaws_Y.out.data.H_ft = AutopilotLaws_U.in.data.H_ft;
  AutopilotLaws_Y.out.data.H_ind_ft = AutopilotLaws_U.in.data.H_ind_ft;
  AutopilotLaws_Y.out.data.H_radio_ft = AutopilotLaws_U.in.data.H_radio_ft;
  AutopilotLaws_Y.out.data.H_dot_ft_min = AutopilotLaws_U.in.data.H_dot_ft_min;
  AutopilotLaws_Y.out.data.Psi_magnetic_deg = AutopilotLaws_U.in.data.Psi_magnetic_deg;
  AutopilotLaws_Y.out.data.Psi_magnetic_track_deg = AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  AutopilotLaws_Y.out.data.Psi_true_deg = AutopilotLaws_U.in.data.Psi_true_deg;
  AutopilotLaws_Y.out.data.ax_m_s2 = result_0[0];
  AutopilotLaws_Y.out.data.ay_m_s2 = result_0[1];
  AutopilotLaws_Y.out.data.az_m_s2 = result_0[2];
  AutopilotLaws_Y.out.data.bx_m_s2 = AutopilotLaws_U.in.data.bx_m_s2;
  AutopilotLaws_Y.out.data.by_m_s2 = AutopilotLaws_U.in.data.by_m_s2;
  AutopilotLaws_Y.out.data.bz_m_s2 = AutopilotLaws_U.in.data.bz_m_s2;
  AutopilotLaws_Y.out.data.nav_valid = AutopilotLaws_U.in.data.nav_valid;
  AutopilotLaws_Y.out.data.nav_loc_deg = AutopilotLaws_U.in.data.nav_loc_deg;
  AutopilotLaws_Y.out.data.nav_gs_deg = AutopilotLaws_P.Gain3_Gain_a * AutopilotLaws_U.in.data.nav_gs_deg;
  AutopilotLaws_Y.out.data.nav_dme_valid = AutopilotLaws_U.in.data.nav_dme_valid;
  AutopilotLaws_Y.out.data.nav_dme_nmi = rtb_dme;
  AutopilotLaws_Y.out.data.nav_loc_valid = AutopilotLaws_U.in.data.nav_loc_valid;
  AutopilotLaws_Y.out.data.nav_loc_magvar_deg = AutopilotLaws_U.in.data.nav_loc_magvar_deg;
  AutopilotLaws_Y.out.data.nav_loc_error_deg = AutopilotLaws_U.in.data.nav_loc_error_deg;
  AutopilotLaws_Y.out.data.nav_loc_position = AutopilotLaws_U.in.data.nav_loc_position;
  AutopilotLaws_Y.out.data.nav_e_loc_valid = rtb_valid;
  AutopilotLaws_Y.out.data.nav_e_loc_error_deg = b_R;
  AutopilotLaws_Y.out.data.nav_gs_valid = AutopilotLaws_U.in.data.nav_gs_valid;
  AutopilotLaws_Y.out.data.nav_gs_error_deg = AutopilotLaws_U.in.data.nav_gs_error_deg;
  AutopilotLaws_Y.out.data.nav_gs_position = AutopilotLaws_U.in.data.nav_gs_position;
  AutopilotLaws_Y.out.data.nav_e_gs_valid = rtb_valid_m;
  AutopilotLaws_Y.out.data.nav_e_gs_error_deg = rtb_error_c;
  AutopilotLaws_Y.out.data.flight_guidance_xtk_nmi = AutopilotLaws_U.in.data.flight_guidance_xtk_nmi;
  AutopilotLaws_Y.out.data.flight_guidance_tae_deg = AutopilotLaws_U.in.data.flight_guidance_tae_deg;
  AutopilotLaws_Y.out.data.flight_guidance_phi_deg = AutopilotLaws_U.in.data.flight_guidance_phi_deg;
  AutopilotLaws_Y.out.data.flight_guidance_phi_limit_deg = AutopilotLaws_U.in.data.flight_guidance_phi_limit_deg;
  AutopilotLaws_Y.out.data.flight_phase = AutopilotLaws_U.in.data.flight_phase;
  AutopilotLaws_Y.out.data.V2_kn = AutopilotLaws_U.in.data.V2_kn;
  AutopilotLaws_Y.out.data.VAPP_kn = AutopilotLaws_U.in.data.VAPP_kn;
  AutopilotLaws_Y.out.data.VLS_kn = AutopilotLaws_U.in.data.VLS_kn;
  AutopilotLaws_Y.out.data.VMAX_kn = AutopilotLaws_U.in.data.VMAX_kn;
  AutopilotLaws_Y.out.data.is_flight_plan_available = AutopilotLaws_U.in.data.is_flight_plan_available;
  AutopilotLaws_Y.out.data.altitude_constraint_ft = AutopilotLaws_U.in.data.altitude_constraint_ft;
  AutopilotLaws_Y.out.data.thrust_reduction_altitude = AutopilotLaws_U.in.data.thrust_reduction_altitude;
  AutopilotLaws_Y.out.data.thrust_reduction_altitude_go_around =
    AutopilotLaws_U.in.data.thrust_reduction_altitude_go_around;
  AutopilotLaws_Y.out.data.acceleration_altitude = AutopilotLaws_U.in.data.acceleration_altitude;
  AutopilotLaws_Y.out.data.acceleration_altitude_engine_out = AutopilotLaws_U.in.data.acceleration_altitude_engine_out;
  AutopilotLaws_Y.out.data.acceleration_altitude_go_around = AutopilotLaws_U.in.data.acceleration_altitude_go_around;
  AutopilotLaws_Y.out.data.acceleration_altitude_go_around_engine_out =
    AutopilotLaws_U.in.data.acceleration_altitude_go_around_engine_out;
  AutopilotLaws_Y.out.data.cruise_altitude = AutopilotLaws_U.in.data.cruise_altitude;
  AutopilotLaws_Y.out.data.on_ground = rtb_on_ground;
  AutopilotLaws_Y.out.data.zeta_deg = AutopilotLaws_P.Gain2_Gain_b * AutopilotLaws_U.in.data.zeta_pos;
  AutopilotLaws_Y.out.data.throttle_lever_1_pos = AutopilotLaws_U.in.data.throttle_lever_1_pos;
  AutopilotLaws_Y.out.data.throttle_lever_2_pos = AutopilotLaws_U.in.data.throttle_lever_2_pos;
  AutopilotLaws_Y.out.data.flaps_handle_index = AutopilotLaws_U.in.data.flaps_handle_index;
  AutopilotLaws_Y.out.data.is_engine_operative_1 = AutopilotLaws_U.in.data.is_engine_operative_1;
  AutopilotLaws_Y.out.data.is_engine_operative_2 = AutopilotLaws_U.in.data.is_engine_operative_2;
  AutopilotLaws_Y.out.data.altimeter_setting_changed = (rtb_Compare_e ||
    (AutopilotLaws_U.in.data.altimeter_setting_right_mbar != AutopilotLaws_DWork.DelayInput1_DSTATE));
  AutopilotLaws_Y.out.input = AutopilotLaws_U.in.input;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_e;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.data.Psi_magnetic_deg -
    AutopilotLaws_DWork.DelayInput1_DSTATE) + AutopilotLaws_P.Constant3_Value_e;
  b_R = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_e);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_e - b_R;
  rtb_error_c = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_e);
  if (b_R < rtb_error_c) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_h * b_R;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_e * rtb_error_c;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_b);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_b;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_b);
  b_R = AutopilotLaws_U.in.data.nav_loc_deg - AutopilotLaws_U.in.data.nav_loc_magvar_deg;
  a = rt_modd(rt_modd(b_R, AutopilotLaws_P.Constant3_Value_n) + AutopilotLaws_P.Constant3_Value_n,
              AutopilotLaws_P.Constant3_Value_n);
  rtb_Saturation = rt_modd((AutopilotLaws_DWork.DelayInput1_DSTATE - (a + AutopilotLaws_P.Constant3_Value_i)) +
    AutopilotLaws_P.Constant3_Value_i, AutopilotLaws_P.Constant3_Value_i);
  Phi2 = rt_modd(AutopilotLaws_P.Constant3_Value_i - rtb_Saturation, AutopilotLaws_P.Constant3_Value_i);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting == 1) {
    rtb_error_c = AutopilotLaws_P.Constant_Value;
  } else {
    rtb_error_c = AutopilotLaws_U.in.input.lateral_law;
  }

  rtb_valid = (rtb_error_c == AutopilotLaws_P.CompareToConstant2_const);
  if (rtb_Saturation < Phi2) {
    rtb_Saturation *= AutopilotLaws_P.Gain1_Gain;
  } else {
    rtb_Saturation = AutopilotLaws_P.Gain_Gain * Phi2;
  }

  rtb_Saturation = std::abs(rtb_Saturation);
  if (!AutopilotLaws_DWork.limit_not_empty) {
    AutopilotLaws_DWork.limit = rtb_Saturation;
    AutopilotLaws_DWork.limit_not_empty = true;
  }

  if (!rtb_valid) {
    AutopilotLaws_DWork.limit = std::fmin(std::fmax(rtb_Saturation, 15.0), 115.0);
  }

  if (rtb_valid && (rtb_Saturation < 15.0)) {
    AutopilotLaws_DWork.limit = 15.0;
  }

  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value, AutopilotLaws_P.zeta_Value, &rtb_Y_f, &rtb_lo_a);
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_b) {
    rtb_Saturation = AutopilotLaws_P.Saturation_UpperSat_b;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_n) {
    rtb_Saturation = AutopilotLaws_P.Saturation_LowerSat_n;
  } else {
    rtb_Saturation = rtb_dme;
  }

  rtb_Divide = std::sin(AutopilotLaws_P.Gain1_Gain_f * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_Saturation *
    AutopilotLaws_P.Gain_Gain_h * rtb_lo_a / AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Divide > AutopilotLaws_DWork.limit) {
    rtb_Divide = AutopilotLaws_DWork.limit;
  } else if (rtb_Divide < -AutopilotLaws_DWork.limit) {
    rtb_Divide = -AutopilotLaws_DWork.limit;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.DelayInput1_DSTATE - (rt_modd(rt_modd
    (AutopilotLaws_U.in.data.nav_loc_error_deg + a, AutopilotLaws_P.Constant3_Value_c2) +
    AutopilotLaws_P.Constant3_Value_c2, AutopilotLaws_P.Constant3_Value_c2) + AutopilotLaws_P.Constant3_Value_p)) +
    AutopilotLaws_P.Constant3_Value_p;
  rtb_Saturation = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_p);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_p - rtb_Saturation;
  Phi2 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_p);
  if (rtb_Saturation < Phi2) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_p * rtb_Saturation;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_a * Phi2;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_P.Gain2_Gain_i * AutopilotLaws_DWork.DelayInput1_DSTATE +
    rtb_Divide) * rtb_Y_f;
  rtb_Saturation = AutopilotLaws_DWork.DelayInput1_DSTATE * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_nr * AutopilotLaws_U.in.data.nav_loc_error_deg;
  Phi2 = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_o) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_o;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_o) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_o;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_dme;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = Phi2 * AutopilotLaws_DWork.DelayInput1_DSTATE * AutopilotLaws_P.Gain2_Gain_gs;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation1_UpperSat_g) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation1_UpperSat_g;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation1_LowerSat_k) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation1_LowerSat_k;
  }

  rtb_Compare_e = (rtb_error_c == AutopilotLaws_P.CompareToConstant_const);
  if (!rtb_Compare_e) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  AutopilotLaws_DWork.Delay_DSTATE += AutopilotLaws_P.Gain6_Gain_bv * AutopilotLaws_DWork.DelayInput1_DSTATE *
    AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_Gain * AutopilotLaws_U.in.time.dt;
  if (AutopilotLaws_DWork.Delay_DSTATE > AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (AutopilotLaws_DWork.Delay_DSTATE < AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  rtb_dme = AutopilotLaws_DWork.DelayInput1_DSTATE * look1_binlxpw(AutopilotLaws_U.in.data.V_gnd_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain_Table, 2U);
  AutopilotLaws_DWork.DelayInput1_DSTATE = b_R;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_dk);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_dk;
  AutopilotLaws_storevalue(rtb_Compare_e, rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_dk), &rtb_lo_a, &AutopilotLaws_DWork.sf_storevalue);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.nav_loc_error_deg + rtb_lo_a;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_o);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_o;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_o);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_n1;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.data.Psi_true_deg -
    AutopilotLaws_DWork.DelayInput1_DSTATE) + AutopilotLaws_P.Constant3_Value_n1;
  Phi2 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_n1);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_n1 - Phi2;
  a = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_n1);
  if (Phi2 < a) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_j * Phi2;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_i * a;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.Delay_DSTATE + rtb_dme) + AutopilotLaws_P.Gain1_Gain_fq *
    AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_U.in.data.Psi_true_deg;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_hr);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_hr;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_hr);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.DelayInput1_DSTATE -
    (AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_nr)) + AutopilotLaws_P.Constant3_Value_nr;
  rtb_dme = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_nr);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_nr - rtb_dme;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_nr);
  AutopilotLaws_Chart_h(rtb_dme, AutopilotLaws_P.Gain_Gain_o * AutopilotLaws_DWork.DelayInput1_DSTATE,
                        AutopilotLaws_P.Constant1_Value_e2, &Phi2, &AutopilotLaws_DWork.sf_Chart_b);
  AutopilotLaws_DWork.DelayInput1_DSTATE = b_R;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_if);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_if;
  R = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_if);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_m;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (R - AutopilotLaws_DWork.DelayInput1_DSTATE) +
    AutopilotLaws_P.Constant3_Value_m;
  rtb_dme = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_m);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_m - rtb_dme;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_m);
  AutopilotLaws_Chart_h(rtb_dme, AutopilotLaws_P.Gain_Gain_fn * AutopilotLaws_DWork.DelayInput1_DSTATE,
                        AutopilotLaws_P.Constant2_Value_l, &L, &AutopilotLaws_DWork.sf_Chart_h);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.Psi_magnetic_deg + AutopilotLaws_P.Constant3_Value_cd;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.input.Psi_c_deg - AutopilotLaws_DWork.DelayInput1_DSTATE)
    + AutopilotLaws_P.Constant3_Value_cd;
  b_R = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_cd);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_cd - b_R;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_cd);
  rtb_valid = ((rtb_error_c == AutopilotLaws_P.CompareToConstant5_const) == AutopilotLaws_P.CompareToConstant_const_h);
  rtb_dme = AutopilotLaws_P.Subsystem_Value / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[i] = AutopilotLaws_P.Delay_InitialCondition;
    }
  }

  if (rtb_dme < 1.0) {
    rtb_valid_m = rtb_valid;
  } else {
    if (rtb_dme > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(rtb_dme), 4.294967296E+9)));
    }

    rtb_valid_m = AutopilotLaws_DWork.Delay_DSTATE_l[100U - i];
  }

  AutopilotLaws_Chart(b_R, AutopilotLaws_P.Gain_Gain_cy * AutopilotLaws_DWork.DelayInput1_DSTATE, rtb_valid !=
                      rtb_valid_m, &rtb_dme, &AutopilotLaws_DWork.sf_Chart);
  AutopilotLaws_DWork.DelayInput1_DSTATE = look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_h, AutopilotLaws_P.ScheduledGain_Table_o, 6U);
  b_R = rtb_dme * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_o5 * result[2];
  b_L = AutopilotLaws_P.Gain1_Gain_o * b_R + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_MATLABFunction_m(AutopilotLaws_U.in.input.Psi_c_deg, rtb_dme, b_L, &b_R, &rtb_lo_f,
    &AutopilotLaws_DWork.sf_MATLABFunction_m);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.Psi_magnetic_track_deg +
    AutopilotLaws_P.Constant3_Value_k;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.input.Psi_c_deg - AutopilotLaws_DWork.DelayInput1_DSTATE)
    + AutopilotLaws_P.Constant3_Value_k;
  a = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_k);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_k - a;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_k);
  rtb_valid_m = ((rtb_error_c == AutopilotLaws_P.CompareToConstant4_const) == AutopilotLaws_P.CompareToConstant_const_e);
  rtb_dme = AutopilotLaws_P.Subsystem_Value_n / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid_m) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }
  }

  if (rtb_dme < 1.0) {
    rtb_Delay_j = rtb_valid_m;
  } else {
    if (rtb_dme > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(rtb_dme), 4.294967296E+9)));
    }

    rtb_Delay_j = AutopilotLaws_DWork.Delay_DSTATE_h5[100U - i];
  }

  AutopilotLaws_Chart(a, AutopilotLaws_P.Gain_Gain_p * AutopilotLaws_DWork.DelayInput1_DSTATE, rtb_valid_m !=
                      rtb_Delay_j, &rtb_dme, &AutopilotLaws_DWork.sf_Chart_ba);
  AutopilotLaws_DWork.DelayInput1_DSTATE = look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_o, AutopilotLaws_P.ScheduledGain_Table_e, 6U);
  a = rtb_dme * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_l * result[2];
  rtb_Sum_if = AutopilotLaws_P.Gain1_Gain_i4 * a + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_MATLABFunction_m(AutopilotLaws_U.in.input.Psi_c_deg, rtb_dme, rtb_Sum_if, &rtb_Y_j, &rtb_lo_a,
    &AutopilotLaws_DWork.sf_MATLABFunction_e);
  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value_c, AutopilotLaws_P.zeta_Value_h, &a, &rtb_Divide);
  AutopilotLaws_RateLimiter(AutopilotLaws_U.in.data.flight_guidance_phi_deg, AutopilotLaws_P.RateLimiterVariableTs_up,
    AutopilotLaws_P.RateLimiterVariableTs_lo, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition, &rtb_Y_f, &AutopilotLaws_DWork.sf_RateLimiter);
  AutopilotLaws_LagFilter(rtb_Y_f, AutopilotLaws_P.LagFilter_C1, AutopilotLaws_U.in.time.dt, &distance_m,
    &AutopilotLaws_DWork.sf_LagFilter);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_loc_error_deg, AutopilotLaws_P.LagFilter2_C1,
    AutopilotLaws_U.in.time.dt, &rtb_Y_f, &AutopilotLaws_DWork.sf_LagFilter_h);
  rtb_dme = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain * rtb_Y_f;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_dme - AutopilotLaws_DWork.Delay_DSTATE_e;
  AutopilotLaws_DWork.DelayInput1_DSTATE /= AutopilotLaws_U.in.time.dt;
  AutopilotLaws_LagFilter(rtb_Y_f + AutopilotLaws_P.Gain3_Gain_i * AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.LagFilter_C1_n, AutopilotLaws_U.in.time.dt, &rtb_Y_lo, &AutopilotLaws_DWork.sf_LagFilter_m);
  rtb_Delay_j = (AutopilotLaws_U.in.data.H_radio_ft <= AutopilotLaws_P.CompareToConstant_const_d);
  switch (static_cast<int32_T>(rtb_error_c)) {
   case 0:
    b_L = rtb_GainTheta1;
    break;

   case 1:
    if (b_L > b_R) {
      b_L = b_R;
    } else if (b_L < rtb_lo_f) {
      b_L = rtb_lo_f;
    }
    break;

   case 2:
    if (rtb_Sum_if > rtb_Y_j) {
      b_L = rtb_Y_j;
    } else if (rtb_Sum_if < rtb_lo_a) {
      b_L = rtb_lo_a;
    } else {
      b_L = rtb_Sum_if;
    }
    break;

   case 3:
    rtb_Add3_d2 = AutopilotLaws_P.Gain_Gain_c * AutopilotLaws_U.in.data.flight_guidance_xtk_nmi * rtb_Divide /
      AutopilotLaws_U.in.data.V_gnd_kn;
    if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat) {
      rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat;
    } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat) {
      rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat;
    }

    b_L = distance_m - (AutopilotLaws_P.Gain2_Gain * AutopilotLaws_U.in.data.flight_guidance_tae_deg + rtb_Add3_d2) * a *
      AutopilotLaws_U.in.data.V_gnd_kn;
    break;

   case 4:
    b_L = rtb_Saturation;
    break;

   case 5:
    b_R = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_deg - (AutopilotLaws_U.in.data.Psi_true_deg +
      AutopilotLaws_P.Constant3_Value)) + AutopilotLaws_P.Constant3_Value, AutopilotLaws_P.Constant3_Value);
    a = rt_modd(AutopilotLaws_P.Constant3_Value - b_R, AutopilotLaws_P.Constant3_Value);
    if (b_R < a) {
      b_R *= AutopilotLaws_P.Gain1_Gain_l;
    } else {
      b_R = AutopilotLaws_P.Gain_Gain_g * a;
    }

    b_R = rt_modd((rt_modd(rt_modd(AutopilotLaws_U.in.data.Psi_magnetic_track_deg + b_R,
      AutopilotLaws_P.Constant3_Value_d) + AutopilotLaws_P.Constant3_Value_d, AutopilotLaws_P.Constant3_Value_d) - (R +
      AutopilotLaws_P.Constant3_Value_c)) + AutopilotLaws_P.Constant3_Value_c, AutopilotLaws_P.Constant3_Value_c);
    a = rt_modd(AutopilotLaws_P.Constant3_Value_c - b_R, AutopilotLaws_P.Constant3_Value_c);
    if (b_R < a) {
      b_R *= AutopilotLaws_P.Gain1_Gain_g;
    } else {
      b_R = AutopilotLaws_P.Gain_Gain_f * a;
    }

    if (rtb_Delay_j) {
      distance_m = AutopilotLaws_P.k_beta_Phi_Gain * AutopilotLaws_U.in.data.beta_deg;
    } else {
      distance_m = AutopilotLaws_P.Constant1_Value_fk;
    }

    b_L = (std::sin(AutopilotLaws_P.Gain1_Gain_b * b_R) * AutopilotLaws_U.in.data.V_gnd_kn *
           AutopilotLaws_P.Gain2_Gain_g + rtb_Y_lo * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
            AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain2_Table, 6U) *
           AutopilotLaws_P.Gain4_Gain * look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft,
            AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_e, AutopilotLaws_P.ScheduledGain_Table_p, 4U)) +
      distance_m;
    if (b_L > AutopilotLaws_P.Saturation1_UpperSat) {
      b_L = AutopilotLaws_P.Saturation1_UpperSat;
    } else if (b_L < AutopilotLaws_P.Saturation1_LowerSat) {
      b_L = AutopilotLaws_P.Saturation1_LowerSat;
    }
    break;

   default:
    b_L = AutopilotLaws_P.Constant3_Value_h;
    break;
  }

  R = std::abs(AutopilotLaws_U.in.data.V_tas_kn);
  i = 5;
  low_i = 1;
  low_ip1 = 2;
  while (i > low_ip1) {
    int32_T mid_i;
    mid_i = (low_i + i) >> 1;
    if (R >= (static_cast<real_T>(mid_i) - 1.0) * 150.0) {
      low_i = mid_i;
      low_ip1 = mid_i + 1;
    } else {
      i = mid_i;
    }
  }

  b_R = R - (static_cast<real_T>(low_i) - 1.0) * 150.0;
  AutopilotLaws_DWork.DelayInput1_DSTATE = std::abs(AutopilotLaws_U.in.data.flight_guidance_phi_limit_deg);
  if ((AutopilotLaws_U.in.input.lateral_mode != 20.0) || (AutopilotLaws_DWork.DelayInput1_DSTATE <= 0.0)) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = ((b[low_i - 1] * b_R + b[low_i + 3]) * b_R + b[low_i + 7]) * b_R + b[low_i
      + 11];
  }

  if (b_L <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
    AutopilotLaws_DWork.DelayInput1_DSTATE *= AutopilotLaws_P.Gain1_Gain_lt;
    if (b_L >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = b_L;
    }
  }

  AutopilotLaws_LagFilter(AutopilotLaws_P.Gain_Gain_lu * (AutopilotLaws_DWork.DelayInput1_DSTATE - rtb_GainTheta1),
    AutopilotLaws_P.LagFilter_C1_a, AutopilotLaws_U.in.time.dt, &b_R, &AutopilotLaws_DWork.sf_LagFilter_a);
  if (!AutopilotLaws_DWork.pY_not_empty) {
    AutopilotLaws_DWork.pY = AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_i;
    AutopilotLaws_DWork.pY_not_empty = true;
  }

  AutopilotLaws_DWork.pY += std::fmax(std::fmin(static_cast<real_T>(rtb_Compare_e) - AutopilotLaws_DWork.pY, std::abs
    (AutopilotLaws_P.RateLimiterVariableTs_up_n) * AutopilotLaws_U.in.time.dt), -std::abs
    (AutopilotLaws_P.RateLimiterVariableTs_lo_k) * AutopilotLaws_U.in.time.dt);
  if (AutopilotLaws_DWork.pY > AutopilotLaws_P.Saturation_UpperSat_k) {
    rtb_Divide = AutopilotLaws_P.Saturation_UpperSat_k;
  } else if (AutopilotLaws_DWork.pY < AutopilotLaws_P.Saturation_LowerSat_f3) {
    rtb_Divide = AutopilotLaws_P.Saturation_LowerSat_f3;
  } else {
    rtb_Divide = AutopilotLaws_DWork.pY;
  }

  Phi2 = (AutopilotLaws_P.Gain_Gain_b * result[2] * rtb_Divide + (AutopilotLaws_P.Constant_Value_a - rtb_Divide) *
          (AutopilotLaws_P.Gain4_Gain_o * AutopilotLaws_U.in.data.beta_deg)) + AutopilotLaws_P.Gain5_Gain_o * Phi2;
  if (rtb_Saturation_i > AutopilotLaws_P.Switch_Threshold_n) {
    switch (static_cast<int32_T>(rtb_error_c)) {
     case 0:
      a = AutopilotLaws_P.beta1_Value;
      break;

     case 1:
      a = AutopilotLaws_P.beta1_Value_h;
      break;

     case 2:
      a = AutopilotLaws_P.beta1_Value_l;
      break;

     case 3:
      a = AutopilotLaws_P.beta1_Value_m;
      break;

     case 4:
      a = AutopilotLaws_P.beta1_Value_d;
      break;

     case 5:
      a = AutopilotLaws_P.beta1_Value_hy;
      break;

     default:
      a = AutopilotLaws_P.Gain3_Gain * Phi2;
      break;
    }
  } else {
    a = AutopilotLaws_P.Constant1_Value;
  }

  if (rtb_Delay_j) {
    distance_m = AutopilotLaws_P.Gain_Gain_ae * L + AutopilotLaws_P.Gain1_Gain_k * AutopilotLaws_U.in.data.beta_deg;
  } else {
    distance_m = AutopilotLaws_P.Constant1_Value_fk;
  }

  AutopilotLaws_LagFilter(distance_m, AutopilotLaws_P.LagFilter1_C1, AutopilotLaws_U.in.time.dt, &rtb_Y_j,
    &AutopilotLaws_DWork.sf_LagFilter_c);
  switch (static_cast<int32_T>(rtb_error_c)) {
   case 0:
    rtb_error_c = AutopilotLaws_P.beta_Value;
    break;

   case 1:
    rtb_error_c = AutopilotLaws_P.beta_Value_e;
    break;

   case 2:
    rtb_error_c = AutopilotLaws_P.beta_Value_b;
    break;

   case 3:
    rtb_error_c = AutopilotLaws_P.beta_Value_i;
    break;

   case 4:
    rtb_error_c = AutopilotLaws_P.beta_Value_c;
    break;

   case 5:
    if (rtb_Y_j > AutopilotLaws_P.Saturation_UpperSat_e) {
      rtb_error_c = AutopilotLaws_P.Saturation_UpperSat_e;
    } else if (rtb_Y_j < AutopilotLaws_P.Saturation_LowerSat_f) {
      rtb_error_c = AutopilotLaws_P.Saturation_LowerSat_f;
    } else {
      rtb_error_c = rtb_Y_j;
    }
    break;

   default:
    rtb_error_c = AutopilotLaws_P.Gain7_Gain * Phi2;
    break;
  }

  AutopilotLaws_LagFilter(rtb_error_c, AutopilotLaws_P.LagFilter_C1_k, AutopilotLaws_U.in.time.dt, &distance_m,
    &AutopilotLaws_DWork.sf_LagFilter_p);
  AutopilotLaws_DWork.icLoad = ((rtb_Saturation_i == 0) || AutopilotLaws_DWork.icLoad);
  if (AutopilotLaws_DWork.icLoad) {
    AutopilotLaws_DWork.Delay_DSTATE_h = rtb_GainTheta1;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE -= AutopilotLaws_DWork.Delay_DSTATE_h;
  AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmin(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt);
  AutopilotLaws_DWork.Delay_DSTATE_h += std::fmax(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Gain1_Gain_kf *
    AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt);
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h, AutopilotLaws_P.LagFilter_C1_l, AutopilotLaws_U.in.time.dt,
    &rtb_Y_lo, &AutopilotLaws_DWork.sf_LagFilter_o);
  AutopilotLaws_RateLimiter(static_cast<real_T>(rtb_Saturation_i), AutopilotLaws_P.RateLimiterVariableTs_up_b,
    AutopilotLaws_P.RateLimiterVariableTs_lo_b, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_il, &rtb_Y_j, &AutopilotLaws_DWork.sf_RateLimiter_d);
  if (rtb_Y_j > AutopilotLaws_P.Saturation_UpperSat_m) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_m;
  } else if (rtb_Y_j < AutopilotLaws_P.Saturation_LowerSat_fw) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_fw;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Y_j;
  }

  Phi2 = rtb_Y_lo * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_ii - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE *= rtb_GainTheta1;
  AutopilotLaws_DWork.DelayInput1_DSTATE += Phi2;
  AutopilotLaws_Y.out.output.Phi_loc_c = rtb_Saturation;
  rtb_Add3_d2 = AutopilotLaws_P.Gain_Gain_m3 * a;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_c) {
    AutopilotLaws_Y.out.output.Nosewheel_c = AutopilotLaws_P.Saturation_UpperSat_c;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_d) {
    AutopilotLaws_Y.out.output.Nosewheel_c = AutopilotLaws_P.Saturation_LowerSat_d;
  } else {
    AutopilotLaws_Y.out.output.Nosewheel_c = rtb_Add3_d2;
  }

  AutopilotLaws_Y.out.output.flight_director.Beta_c_deg = distance_m;
  AutopilotLaws_Y.out.output.autopilot.Beta_c_deg = rtb_error_c;
  AutopilotLaws_Y.out.output.flight_director.Phi_c_deg = b_R;
  AutopilotLaws_Y.out.output.autopilot.Phi_c_deg = AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_WashoutFilter(rtb_GainTheta, AutopilotLaws_P.WashoutFilter_C1, AutopilotLaws_U.in.time.dt, &b_R,
    &AutopilotLaws_DWork.sf_WashoutFilter_fo);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting_b == 1) {
    rtb_error_c = AutopilotLaws_P.Constant_Value_m;
  } else {
    rtb_error_c = AutopilotLaws_U.in.input.vertical_law;
  }

  if (AutopilotLaws_U.in.input.ALT_soft_mode_active) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.input.V_c_kn - AutopilotLaws_U.in.data.V_ias_kn) *
      AutopilotLaws_P.Gain1_Gain_bs;
    if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation1_UpperSat_a) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation1_UpperSat_a;
    } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation1_LowerSat_i) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation1_LowerSat_i;
    }
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_h;
  }

  if (rtb_error_c != AutopilotLaws_P.CompareToConstant5_const_e) {
    AutopilotLaws_B.u = (AutopilotLaws_U.in.input.H_c_ft + AutopilotLaws_U.in.data.H_ft) -
      AutopilotLaws_U.in.data.H_ind_ft;
  }

  AutopilotLaws_LagFilter(AutopilotLaws_B.u - AutopilotLaws_U.in.data.H_ft, AutopilotLaws_P.LagFilter_C1_ai,
    AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_LagFilter_g);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Gain_Gain_ft * rtb_Y_j;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_n) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_n;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_d4) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_d4;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE -= AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Saturation = AutopilotLaws_P.ftmintoms_Gain * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain * AutopilotLaws_U.in.data.V_tas_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_a) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_a;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_n5) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_n5;
  }

  rtb_Add3_d2 = rtb_Saturation / AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (rtb_Add3_d2 > 1.0) {
    rtb_Add3_d2 = 1.0;
  } else if (rtb_Add3_d2 < -1.0) {
    rtb_Add3_d2 = -1.0;
  }

  rtb_Saturation = AutopilotLaws_P.Gain_Gain_k * std::asin(rtb_Add3_d2);
  rtb_Compare_e = (rtb_error_c == AutopilotLaws_P.CompareToConstant1_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty_m) {
    AutopilotLaws_DWork.wasActive_o = rtb_Compare_e;
    AutopilotLaws_DWork.wasActive_not_empty_m = true;
  }

  Phi2 = AutopilotLaws_U.in.input.H_c_ft - AutopilotLaws_U.in.data.H_ind_ft;
  if (Phi2 < 0.0) {
    a = -1.0;
  } else if (Phi2 > 0.0) {
    a = 1.0;
  } else {
    a = Phi2;
  }

  a = a * AutopilotLaws_DWork.dH_offset + Phi2;
  if ((!AutopilotLaws_DWork.wasActive_o) && rtb_Compare_e) {
    AutopilotLaws_DWork.k = AutopilotLaws_U.in.data.H_dot_ft_min / a;
    AutopilotLaws_DWork.dH_offset = std::abs(500.0 / std::abs(AutopilotLaws_DWork.k) - 100.0);
    if (a < 0.0) {
      distance_m = -1.0;
    } else if (a > 0.0) {
      distance_m = 1.0;
    } else {
      distance_m = a;
    }

    a += distance_m * AutopilotLaws_DWork.dH_offset;
    AutopilotLaws_DWork.k = AutopilotLaws_U.in.data.H_dot_ft_min / a;
    AutopilotLaws_DWork.maxH_dot = std::abs(AutopilotLaws_U.in.data.H_dot_ft_min);
  }

  a *= AutopilotLaws_DWork.k;
  if (std::abs(a) > AutopilotLaws_DWork.maxH_dot) {
    if (a < 0.0) {
      a = -1.0;
    } else if (a > 0.0) {
      a = 1.0;
    }

    a *= AutopilotLaws_DWork.maxH_dot;
  }

  AutopilotLaws_DWork.wasActive_o = rtb_Compare_e;
  AutopilotLaws_DWork.DelayInput1_DSTATE = a - AutopilotLaws_U.in.data.H_dot_ft_min;
  a = AutopilotLaws_P.ftmintoms_Gain_c * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_h * AutopilotLaws_U.in.data.V_tas_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_d) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_d;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_nr) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_nr;
  }

  rtb_Add3_d2 = a / AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (rtb_Add3_d2 > 1.0) {
    rtb_Add3_d2 = 1.0;
  } else if (rtb_Add3_d2 < -1.0) {
    rtb_Add3_d2 = -1.0;
  }

  distance_m = AutopilotLaws_P.Gain_Gain_es * std::asin(rtb_Add3_d2);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain * AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_l * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_l) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_l;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_e) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_e;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / rtb_Add3_d2) *
    AutopilotLaws_P.Gain_Gain_lr;
  a = AutopilotLaws_P.Gain1_Gain_p2 * rtb_GainTheta1;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain * (AutopilotLaws_P.GStoGS_CAS_Gain * (AutopilotLaws_P.ktstomps_Gain *
    AutopilotLaws_U.in.data.V_gnd_kn)), AutopilotLaws_P.WashoutFilter_C1_b, AutopilotLaws_U.in.time.dt, &rtb_Y_j,
    &AutopilotLaws_DWork.sf_WashoutFilter);
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_m * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_pi) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_pi;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_p) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_p;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_j - AutopilotLaws_P.g_Gain * (AutopilotLaws_P.Gain1_Gain_o5 *
    (AutopilotLaws_P.Gain_Gain_ge * ((AutopilotLaws_P.Gain1_Gain_bv * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_ki *
    (AutopilotLaws_P.Gain_Gain_dx * std::atan(AutopilotLaws_P.fpmtoms_Gain_m * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Add3_d2))) * (AutopilotLaws_P.Constant_Value_e - std::cos(a)) + std::sin(a) * std::sin
    (AutopilotLaws_P.Gain1_Gain_a * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_go *
     AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1, AutopilotLaws_P.HighPassFilter_C2,
    AutopilotLaws_P.HighPassFilter_C3, AutopilotLaws_P.HighPassFilter_C4, AutopilotLaws_U.in.time.dt, &rtb_Y_lo,
    &AutopilotLaws_DWork.sf_LeadLagFilter);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_b * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1, AutopilotLaws_P.LowPassFilter_C2, AutopilotLaws_P.LowPassFilter_C3,
    AutopilotLaws_P.LowPassFilter_C4, AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_LeadLagFilter_g);
  a = (rtb_Y_lo + rtb_Y_j) * AutopilotLaws_P.ug_Gain;
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_db * AutopilotLaws_DWork.DelayInput1_DSTATE;
  L = a + rtb_Divide;
  R = AutopilotLaws_P.Constant3_Value_a - AutopilotLaws_P.Constant4_Value;
  b_L = (AutopilotLaws_P.Gain1_Gain_id * a + rtb_Divide) * AutopilotLaws_P.Gain_Gain_f5;
  if (R > AutopilotLaws_P.Switch_Threshold_o) {
    a = AutopilotLaws_P.Constant1_Value_i;
  } else {
    a = AutopilotLaws_P.Gain5_Gain * b_L;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &rtb_Y_j);
  rtb_Y_f = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_j) * AutopilotLaws_P.Gain1_Gain_p0;
  if (rtb_Y_f <= a) {
    if (R > AutopilotLaws_P.Switch1_Threshold) {
      a = AutopilotLaws_P.Constant_Value_h;
    } else {
      a = AutopilotLaws_P.Gain6_Gain * b_L;
    }

    if (rtb_Y_f >= a) {
      a = rtb_Y_f;
    }
  }

  b_L = (AutopilotLaws_P.Gain_Gain_k4 * L - AutopilotLaws_DWork.DelayInput1_DSTATE) + a;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_p * AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_mt * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_kx) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_kx;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_i) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_i;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / rtb_Add3_d2) *
    AutopilotLaws_P.Gain_Gain_pg;
  a = AutopilotLaws_P.Gain1_Gain_c * rtb_GainTheta1;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_d * (AutopilotLaws_P.GStoGS_CAS_Gain_f *
    (AutopilotLaws_P.ktstomps_Gain_d * AutopilotLaws_U.in.data.V_gnd_kn)), AutopilotLaws_P.WashoutFilter_C1_e,
    AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_WashoutFilter_n);
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_mg * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_j) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_j;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_fe) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_fe;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_j - AutopilotLaws_P.g_Gain_o * (AutopilotLaws_P.Gain1_Gain_i5 *
    (AutopilotLaws_P.Gain_Gain_oz * ((AutopilotLaws_P.Gain1_Gain_dv * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_pv *
    (AutopilotLaws_P.Gain_Gain_n5 * std::atan(AutopilotLaws_P.fpmtoms_Gain_mv * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Add3_d2))) * (AutopilotLaws_P.Constant_Value_o - std::cos(a)) + std::sin(a) * std::sin
    (AutopilotLaws_P.Gain1_Gain_d2 * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_k3 *
     AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_i,
    AutopilotLaws_P.HighPassFilter_C2_k, AutopilotLaws_P.HighPassFilter_C3_b, AutopilotLaws_P.HighPassFilter_C4_e,
    AutopilotLaws_U.in.time.dt, &rtb_Y_lo, &AutopilotLaws_DWork.sf_LeadLagFilter_m);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_dt * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_c, AutopilotLaws_P.LowPassFilter_C2_i, AutopilotLaws_P.LowPassFilter_C3_o,
    AutopilotLaws_P.LowPassFilter_C4_o, AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_LeadLagFilter_c);
  a = (rtb_Y_lo + rtb_Y_j) * AutopilotLaws_P.ug_Gain_g;
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_lu * AutopilotLaws_DWork.DelayInput1_DSTATE;
  L = a + rtb_Divide;
  R = AutopilotLaws_P.Constant1_Value_ps - AutopilotLaws_P.Constant2_Value_j;
  rtb_Y_f = (AutopilotLaws_P.Gain1_Gain_e * a + rtb_Divide) * AutopilotLaws_P.Gain_Gain_p2;
  if (R > AutopilotLaws_P.Switch_Threshold_h) {
    a = AutopilotLaws_P.Constant1_Value_b;
  } else {
    a = AutopilotLaws_P.Gain5_Gain_n * rtb_Y_f;
  }

  rtb_Y_j = AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.data.VMAX_kn;
  rtb_lo_a = rtb_Y_j * AutopilotLaws_P.Gain1_Gain_dv4;
  if (rtb_lo_a <= a) {
    if (R > AutopilotLaws_P.Switch1_Threshold_p) {
      a = AutopilotLaws_P.Constant_Value_j;
    } else {
      a = AutopilotLaws_P.Gain6_Gain_h * rtb_Y_f;
    }

    if (rtb_lo_a >= a) {
      a = rtb_lo_a;
    }
  }

  a += AutopilotLaws_P.Gain_Gain_d4 * L - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, distance_m, AutopilotLaws_P.VS_Gain * distance_m,
    b_L, AutopilotLaws_P.Gain_Gain_ga * b_L, a, AutopilotLaws_P.Gain_Gain_fl * a, AutopilotLaws_P.Constant_Value_ig, &R,
    &L);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_j * AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_f * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_f) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_f;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_m) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_m;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / rtb_Add3_d2) *
    AutopilotLaws_P.Gain_Gain_fv;
  a = AutopilotLaws_P.Gain1_Gain_j5 * AutopilotLaws_DWork.DelayInput1_DSTATE;
  distance_m = AutopilotLaws_P.Gain1_Gain_mi * rtb_GainTheta1;
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_g * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_i) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_i;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_j) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_j;
  }

  b_L = (AutopilotLaws_P.Gain1_Gain_eh * rtb_GainTheta - std::atan(AutopilotLaws_P.fpmtoms_Gain_n *
          AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add3_d2) * AutopilotLaws_P.Gain_Gain_n5o *
         AutopilotLaws_P.Gain1_Gain_ot) * (AutopilotLaws_P.Constant_Value_j0 - std::cos(distance_m));
  rtb_Y_f = std::sin(distance_m);
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_hr * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_lo_a = rtb_Divide - AutopilotLaws_P.Gain1_Gain_ie * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  distance_m = AutopilotLaws_P.ktstomps_Gain_c * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_b * (AutopilotLaws_P.GStoGS_CAS_Gain_i * distance_m),
    AutopilotLaws_P.WashoutFilter_C1_j, AutopilotLaws_U.in.time.dt, &distance_m, &AutopilotLaws_DWork.sf_WashoutFilter_k);
  AutopilotLaws_LeadLagFilter(distance_m - AutopilotLaws_P.g_Gain_p * (AutopilotLaws_P.Gain1_Gain_bn *
    (AutopilotLaws_P.Gain_Gain_eq * (b_L + rtb_Y_f * std::sin(rtb_lo_a)))), AutopilotLaws_P.HighPassFilter_C1_o,
    AutopilotLaws_P.HighPassFilter_C2_e, AutopilotLaws_P.HighPassFilter_C3_p, AutopilotLaws_P.HighPassFilter_C4_g,
    AutopilotLaws_U.in.time.dt, &rtb_Divide, &AutopilotLaws_DWork.sf_LeadLagFilter_k);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_b1 * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_b, AutopilotLaws_P.LowPassFilter_C2_n, AutopilotLaws_P.LowPassFilter_C3_on,
    AutopilotLaws_P.LowPassFilter_C4_i, AutopilotLaws_U.in.time.dt, &distance_m, &AutopilotLaws_DWork.sf_LeadLagFilter_o);
  distance_m = (rtb_Divide + distance_m) * AutopilotLaws_P.ug_Gain_c;
  b_L = (AutopilotLaws_P.Gain1_Gain_jy * distance_m + a) * AutopilotLaws_P.Gain_Gain_ai;
  AutopilotLaws_Voter1(AutopilotLaws_U.in.data.VLS_kn, AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VMAX_kn,
                       &rtb_Y_f);
  rtb_Y_f = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_f) * AutopilotLaws_P.Gain1_Gain_pm;
  rtb_Compare_e = ((Phi2 > AutopilotLaws_P.CompareToConstant6_const) && (b_L <
    AutopilotLaws_P.CompareToConstant5_const_d) && (rtb_Y_f < AutopilotLaws_P.CompareToConstant2_const_b) &&
                   (rtb_error_c == AutopilotLaws_P.CompareToConstant2_const_e));
  a += distance_m;
  if (rtb_Compare_e) {
    distance_m = AutopilotLaws_P.Constant_Value_f;
  } else {
    if (Phi2 > AutopilotLaws_P.CompareToConstant_const_o) {
      distance_m = AutopilotLaws_P.Constant1_Value_l;
    } else {
      distance_m = AutopilotLaws_P.Gain5_Gain_p * b_L;
    }

    if (rtb_Y_f <= distance_m) {
      if (Phi2 > AutopilotLaws_P.CompareToConstant4_const_b) {
        distance_m = std::fmax(AutopilotLaws_P.Constant2_Value, AutopilotLaws_P.Gain1_Gain_l4 * b_L);
      } else {
        distance_m = AutopilotLaws_P.Gain6_Gain_p * b_L;
      }

      if (rtb_Y_f >= distance_m) {
        distance_m = rtb_Y_f;
      }
    }
  }

  rtb_Y_f = (AutopilotLaws_P.Gain_Gain_a2 * a - AutopilotLaws_DWork.DelayInput1_DSTATE) + distance_m;
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_d * AutopilotLaws_U.in.data.V_tas_kn;
  if (Phi2 < 0.0) {
    a = -1.0;
  } else if (Phi2 > 0.0) {
    a = 1.0;
  } else {
    a = Phi2;
  }

  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_iq) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_iq;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_pn) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_pn;
  }

  rtb_Add3_d2 = (a * AutopilotLaws_P.Constant3_Value_cc - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_n / rtb_Add3_d2;
  if (rtb_Add3_d2 > 1.0) {
    rtb_Add3_d2 = 1.0;
  } else if (rtb_Add3_d2 < -1.0) {
    rtb_Add3_d2 = -1.0;
  }

  rtb_lo_a = AutopilotLaws_P.Gain_Gain_j * std::asin(rtb_Add3_d2);
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_a * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_la) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_la;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_h) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_h;
  }

  rtb_lo_f = AutopilotLaws_U.in.input.H_dot_c_fpm - AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Add3_d2 = rtb_lo_f * AutopilotLaws_P.ftmintoms_Gain_l / rtb_Add3_d2;
  if (rtb_Add3_d2 > 1.0) {
    rtb_Add3_d2 = 1.0;
  } else if (rtb_Add3_d2 < -1.0) {
    rtb_Add3_d2 = -1.0;
  }

  rtb_Gain_dn = AutopilotLaws_P.Gain_Gain_ey * std::asin(rtb_Add3_d2);
  if (!AutopilotLaws_DWork.prevVerticalLaw_not_empty) {
    AutopilotLaws_DWork.prevVerticalLaw = AutopilotLaws_U.in.input.vertical_law;
    AutopilotLaws_DWork.prevVerticalLaw_not_empty = true;
  }

  if (!AutopilotLaws_DWork.prevTarget_not_empty) {
    AutopilotLaws_DWork.prevTarget = AutopilotLaws_U.in.input.H_dot_c_fpm;
    AutopilotLaws_DWork.prevTarget_not_empty = true;
  }

  AutopilotLaws_DWork.islevelOffActive = (((AutopilotLaws_U.in.input.vertical_law == 4.0) &&
    (AutopilotLaws_DWork.prevVerticalLaw != 4.0) && (AutopilotLaws_U.in.input.H_dot_c_fpm == 0.0)) ||
    ((AutopilotLaws_U.in.input.H_dot_c_fpm == 0.0) && (AutopilotLaws_DWork.prevTarget > 500.0)) ||
    ((AutopilotLaws_U.in.input.H_dot_c_fpm == 0.0) && (AutopilotLaws_U.in.input.vertical_law == 4.0) &&
     AutopilotLaws_DWork.islevelOffActive));
  if (AutopilotLaws_U.in.input.vertical_mode == 50.0) {
    rtb_Divide = 0.3;
  } else if (AutopilotLaws_DWork.islevelOffActive) {
    rtb_Divide = 0.1;
  } else {
    rtb_Divide = 0.05;
  }

  b_L = 9.81 / (AutopilotLaws_U.in.data.V_tas_kn * 0.51444444444444448);
  limit = b_L * rtb_Divide * 57.295779513082323;
  AutopilotLaws_DWork.prevVerticalLaw = AutopilotLaws_U.in.input.vertical_law;
  AutopilotLaws_DWork.prevTarget = AutopilotLaws_U.in.input.H_dot_c_fpm;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_e * AutopilotLaws_U.in.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_h) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_h;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_c) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_c;
  }

  distance_m = std::atan(AutopilotLaws_P.fpmtoms_Gain_d * AutopilotLaws_U.in.data.H_dot_ft_min /
    AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_de0;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_ge * rtb_GainTheta;
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_lu * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_ik) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_ik;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_k) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_k;
  }

  rtb_Sum_if = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_e *
    AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add3_d2) * AutopilotLaws_P.Gain_Gain_ps * AutopilotLaws_P.Gain1_Gain_dw;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_cd * rtb_GainTheta1;
  rtb_Cos_d5 = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  rtb_Divide = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_dy * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  a = AutopilotLaws_P.Gain1_Gain_hd * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_Add3_j3 = a - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain_a * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_p * (AutopilotLaws_P.GStoGS_CAS_Gain_e *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_er, AutopilotLaws_U.in.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_WashoutFilter_m);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_DWork.DelayInput1_DSTATE - AutopilotLaws_P.g_Gain_g *
    (AutopilotLaws_P.Gain1_Gain_im * (AutopilotLaws_P.Gain_Gain_et * (rtb_Sum_if * (AutopilotLaws_P.Constant_Value_jt -
    rtb_Cos_d5) + rtb_Divide * std::sin(rtb_Add3_j3)))), AutopilotLaws_P.HighPassFilter_C1_a,
    AutopilotLaws_P.HighPassFilter_C2_n, AutopilotLaws_P.HighPassFilter_C3_o, AutopilotLaws_P.HighPassFilter_C4_b,
    AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LeadLagFilter_h);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_m * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_d, AutopilotLaws_P.LowPassFilter_C2_ne, AutopilotLaws_P.LowPassFilter_C3_h,
    AutopilotLaws_P.LowPassFilter_C4_a, AutopilotLaws_U.in.time.dt, &AutopilotLaws_DWork.DelayInput1_DSTATE,
    &AutopilotLaws_DWork.sf_LeadLagFilter_ae);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (a + AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.ug_Gain_i;
  a = AutopilotLaws_P.Gain1_Gain_px * distance_m;
  rtb_Sum_if = AutopilotLaws_DWork.DelayInput1_DSTATE + a;
  rtb_Cos_d5 = AutopilotLaws_P.Constant3_Value_g - AutopilotLaws_P.Constant4_Value_j;
  rtb_Divide = (AutopilotLaws_P.Gain1_Gain_iu * AutopilotLaws_DWork.DelayInput1_DSTATE + a) *
    AutopilotLaws_P.Gain_Gain_ou;
  if (rtb_Cos_d5 > AutopilotLaws_P.Switch_Threshold_jr) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_p;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain5_Gain_b * rtb_Divide;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &a);
  a = (AutopilotLaws_U.in.data.V_ias_kn - a) * AutopilotLaws_P.Gain1_Gain_pm1;
  if (a <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
    if (rtb_Cos_d5 > AutopilotLaws_P.Switch1_Threshold_o) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_la;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain6_Gain_o * rtb_Divide;
    }

    if (a >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = a;
    }
  }

  rtb_Divide = (AutopilotLaws_P.Gain_Gain_cb * rtb_Sum_if - distance_m) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_lb * AutopilotLaws_U.in.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_ig) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_ig;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_i2) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_i2;
  }

  distance_m = std::atan(AutopilotLaws_P.fpmtoms_Gain_h * AutopilotLaws_U.in.data.H_dot_ft_min /
    AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_er;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_b5 * rtb_GainTheta;
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_ms * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_b1) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_b1;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_ms) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_ms;
  }

  rtb_Sum_if = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_c *
    AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add3_d2) * AutopilotLaws_P.Gain_Gain_mr * AutopilotLaws_P.Gain1_Gain_mg;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_eu * rtb_GainTheta1;
  rtb_Cos_d5 = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  rtb_Add3_j3 = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_jd * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  a = AutopilotLaws_P.Gain1_Gain_kq * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_Add3_b = a - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain_bi * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_c * (AutopilotLaws_P.GStoGS_CAS_Gain_p *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_o, AutopilotLaws_U.in.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_WashoutFilter_fl);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_DWork.DelayInput1_DSTATE - AutopilotLaws_P.g_Gain_a *
    (AutopilotLaws_P.Gain1_Gain_jf * (AutopilotLaws_P.Gain_Gain_gb * (rtb_Sum_if * (AutopilotLaws_P.Constant_Value_n -
    rtb_Cos_d5) + rtb_Add3_j3 * std::sin(rtb_Add3_b)))), AutopilotLaws_P.HighPassFilter_C1_g,
    AutopilotLaws_P.HighPassFilter_C2_ks, AutopilotLaws_P.HighPassFilter_C3_c, AutopilotLaws_P.HighPassFilter_C4_gc,
    AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LeadLagFilter_gq);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_g * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_j, AutopilotLaws_P.LowPassFilter_C2_k, AutopilotLaws_P.LowPassFilter_C3_i,
    AutopilotLaws_P.LowPassFilter_C4_e, AutopilotLaws_U.in.time.dt, &AutopilotLaws_DWork.DelayInput1_DSTATE,
    &AutopilotLaws_DWork.sf_LeadLagFilter_e0);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (a + AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.ug_Gain_ik;
  a = AutopilotLaws_P.Gain1_Gain_nq * distance_m;
  rtb_Sum_if = AutopilotLaws_DWork.DelayInput1_DSTATE + a;
  rtb_Cos_d5 = AutopilotLaws_P.Constant1_Value_i1 - AutopilotLaws_P.Constant2_Value_b;
  a = (AutopilotLaws_P.Gain1_Gain_ni * AutopilotLaws_DWork.DelayInput1_DSTATE + a) * AutopilotLaws_P.Gain_Gain_dm;
  if (rtb_Cos_d5 > AutopilotLaws_P.Switch_Threshold_nm) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_hs;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain5_Gain_ll * a;
  }

  rtb_Add3_j3 = rtb_Y_j * AutopilotLaws_P.Gain1_Gain_cz;
  if (rtb_Add3_j3 <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
    if (rtb_Cos_d5 > AutopilotLaws_P.Switch1_Threshold_k) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_g;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain6_Gain_l * a;
    }

    if (rtb_Add3_j3 >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Add3_j3;
    }
  }

  a = (AutopilotLaws_P.Gain_Gain_o2 * rtb_Sum_if - distance_m) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, rtb_Gain_dn, std::fmax(-limit, std::fmin(limit,
    AutopilotLaws_P.VS_Gain_h * rtb_Gain_dn)), rtb_Divide, AutopilotLaws_P.Gain_Gain_n3 * rtb_Divide, a,
    AutopilotLaws_P.Gain_Gain_ml * a, AutopilotLaws_P.Constant_Value_ga, &rtb_Cos_d5, &rtb_Sum_if);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_c * AutopilotLaws_U.in.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_oz) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_oz;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_ou) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_ou;
  }

  rtb_Gain_dn = AutopilotLaws_U.in.input.FPA_c_deg - std::atan(AutopilotLaws_P.fpmtoms_Gain_ps *
    AutopilotLaws_U.in.data.H_dot_ft_min / AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_gt;
  if (!AutopilotLaws_DWork.prevVerticalLaw_not_empty_o) {
    AutopilotLaws_DWork.prevVerticalLaw_g = AutopilotLaws_U.in.input.vertical_law;
    AutopilotLaws_DWork.prevVerticalLaw_not_empty_o = true;
  }

  if (!AutopilotLaws_DWork.prevTarget_not_empty_e) {
    AutopilotLaws_DWork.prevTarget_f = AutopilotLaws_U.in.input.FPA_c_deg;
    AutopilotLaws_DWork.prevTarget_not_empty_e = true;
  }

  AutopilotLaws_DWork.islevelOffActive_b = (((AutopilotLaws_U.in.input.vertical_law == 5.0) &&
    (AutopilotLaws_DWork.prevVerticalLaw_g != 5.0) && (AutopilotLaws_U.in.input.FPA_c_deg == 0.0)) ||
    ((AutopilotLaws_U.in.input.FPA_c_deg == 0.0) && (AutopilotLaws_DWork.prevTarget_f > 1.0)) ||
    ((AutopilotLaws_U.in.input.FPA_c_deg == 0.0) && (AutopilotLaws_U.in.input.vertical_law == 5.0) &&
     AutopilotLaws_DWork.islevelOffActive_b));
  if (AutopilotLaws_DWork.islevelOffActive_b) {
    rtb_Divide = 0.1;
  } else {
    rtb_Divide = 0.05;
  }

  limit = b_L * rtb_Divide * 57.295779513082323;
  AutopilotLaws_DWork.prevVerticalLaw_g = AutopilotLaws_U.in.input.vertical_law;
  AutopilotLaws_DWork.prevTarget_f = AutopilotLaws_U.in.input.FPA_c_deg;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_mw * AutopilotLaws_U.in.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_nb) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_nb;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_m4) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_m4;
  }

  distance_m = std::atan(AutopilotLaws_P.fpmtoms_Gain_cq * AutopilotLaws_U.in.data.H_dot_ft_min /
    AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_dn;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_aq * rtb_GainTheta;
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_ag * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_ih) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_ih;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_j0) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_j0;
  }

  a = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_i *
    AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add3_d2) * AutopilotLaws_P.Gain_Gain_b3 * AutopilotLaws_P.Gain1_Gain_p5;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_de * rtb_GainTheta1;
  rtb_Divide = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  rtb_Add3_j3 = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_be * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  rtb_Add3_b = AutopilotLaws_P.Gain1_Gain_hri * AutopilotLaws_U.in.data.Psi_magnetic_track_deg -
    AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain_ge * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_b0 * (AutopilotLaws_P.GStoGS_CAS_Gain_d *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_bb, AutopilotLaws_U.in.time.dt, &rtb_Y_lo,
    &AutopilotLaws_DWork.sf_WashoutFilter_bl);
  AutopilotLaws_LeadLagFilter(rtb_Y_lo - AutopilotLaws_P.g_Gain_gc * (AutopilotLaws_P.Gain1_Gain_o4 *
    (AutopilotLaws_P.Gain_Gain_p5 * (a * (AutopilotLaws_P.Constant_Value_d4 - rtb_Divide) + rtb_Add3_j3 * std::sin
    (rtb_Add3_b)))), AutopilotLaws_P.HighPassFilter_C1_f, AutopilotLaws_P.HighPassFilter_C2_j,
    AutopilotLaws_P.HighPassFilter_C3_a, AutopilotLaws_P.HighPassFilter_C4_gn, AutopilotLaws_U.in.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LeadLagFilter_a);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_as * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_d2, AutopilotLaws_P.LowPassFilter_C2_g, AutopilotLaws_P.LowPassFilter_C3_f,
    AutopilotLaws_P.LowPassFilter_C4_ez, AutopilotLaws_U.in.time.dt, &rtb_Y_lo, &AutopilotLaws_DWork.sf_LeadLagFilter_e);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.DelayInput1_DSTATE + rtb_Y_lo) *
    AutopilotLaws_P.ug_Gain_d;
  a = AutopilotLaws_P.Gain1_Gain_ei * distance_m;
  rtb_Divide = AutopilotLaws_DWork.DelayInput1_DSTATE + a;
  rtb_Add3_j3 = AutopilotLaws_P.Constant3_Value_ko - AutopilotLaws_P.Constant4_Value_jr;
  a = (AutopilotLaws_P.Gain1_Gain_f0 * AutopilotLaws_DWork.DelayInput1_DSTATE + a) * AutopilotLaws_P.Gain_Gain_ci;
  if (rtb_Add3_j3 > AutopilotLaws_P.Switch_Threshold_k) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_e;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain5_Gain_l * a;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &rtb_Y_lo);
  rtb_Add3_b = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_lo) * AutopilotLaws_P.Gain1_Gain_nf;
  if (rtb_Add3_b <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
    if (rtb_Add3_j3 > AutopilotLaws_P.Switch1_Threshold_c) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_i;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain6_Gain_b * a;
    }

    if (rtb_Add3_b >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Add3_b;
    }
  }

  rtb_Add3_j3 = (AutopilotLaws_P.Gain_Gain_ni * rtb_Divide - distance_m) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_hk * AutopilotLaws_U.in.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_ep) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_ep;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_ni) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_ni;
  }

  distance_m = std::atan(AutopilotLaws_P.fpmtoms_Gain_i2 * AutopilotLaws_U.in.data.H_dot_ft_min /
    AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_ly;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_ed * rtb_GainTheta;
  rtb_Divide = AutopilotLaws_P.kntoms_Gain_i * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Divide > AutopilotLaws_P.Saturation_UpperSat_kv) {
    rtb_Divide = AutopilotLaws_P.Saturation_UpperSat_kv;
  } else if (rtb_Divide < AutopilotLaws_P.Saturation_LowerSat_dl) {
    rtb_Divide = AutopilotLaws_P.Saturation_LowerSat_dl;
  }

  a = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_en *
    AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Divide) * AutopilotLaws_P.Gain_Gain_c5 * AutopilotLaws_P.Gain1_Gain_fk;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_ew * rtb_GainTheta1;
  rtb_Divide = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  rtb_Add3_b = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_mo * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  rtb_Add3_d2 = AutopilotLaws_P.Gain1_Gain_le * AutopilotLaws_U.in.data.Psi_magnetic_track_deg -
    AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain_ay * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_dy * (AutopilotLaws_P.GStoGS_CAS_Gain_ij *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_o0, AutopilotLaws_U.in.time.dt, &rtb_Y_lo,
    &AutopilotLaws_DWork.sf_WashoutFilter_g0);
  AutopilotLaws_LeadLagFilter(rtb_Y_lo - AutopilotLaws_P.g_Gain_og * (AutopilotLaws_P.Gain1_Gain_hs *
    (AutopilotLaws_P.Gain_Gain_iy * (a * (AutopilotLaws_P.Constant_Value_hv - rtb_Divide) + rtb_Add3_b * std::sin
    (rtb_Add3_d2)))), AutopilotLaws_P.HighPassFilter_C1_c, AutopilotLaws_P.HighPassFilter_C2_h,
    AutopilotLaws_P.HighPassFilter_C3_i, AutopilotLaws_P.HighPassFilter_C4_k, AutopilotLaws_U.in.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LeadLagFilter_n);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_o * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_l, AutopilotLaws_P.LowPassFilter_C2_b, AutopilotLaws_P.LowPassFilter_C3_a,
    AutopilotLaws_P.LowPassFilter_C4_k, AutopilotLaws_U.in.time.dt, &rtb_Y_lo, &AutopilotLaws_DWork.sf_LeadLagFilter_cb);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.DelayInput1_DSTATE + rtb_Y_lo) *
    AutopilotLaws_P.ug_Gain_e;
  a = AutopilotLaws_P.Gain1_Gain_kk * distance_m;
  rtb_Divide = AutopilotLaws_DWork.DelayInput1_DSTATE + a;
  rtb_Add3_b = AutopilotLaws_P.Constant1_Value_j - AutopilotLaws_P.Constant2_Value_k;
  rtb_Y_lo = (AutopilotLaws_P.Gain1_Gain_bb * AutopilotLaws_DWork.DelayInput1_DSTATE + a) * AutopilotLaws_P.Gain_Gain_if;
  if (rtb_Add3_b > AutopilotLaws_P.Switch_Threshold_oz) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_o;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain5_Gain_c * rtb_Y_lo;
  }

  a = AutopilotLaws_P.Gain1_Gain_di * rtb_Y_j;
  if (a <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
    if (rtb_Add3_b > AutopilotLaws_P.Switch1_Threshold_p0) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_l;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain6_Gain_e * rtb_Y_lo;
    }

    if (a >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = a;
    }
  }

  a = (AutopilotLaws_P.Gain_Gain_ia * rtb_Divide - distance_m) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, rtb_Gain_dn, std::fmax(-limit, std::fmin(limit,
    AutopilotLaws_P.Gain_Gain_c3 * rtb_Gain_dn)), rtb_Add3_j3, AutopilotLaws_P.Gain_Gain_ev * rtb_Add3_j3, a,
    AutopilotLaws_P.Gain_Gain_o3 * a, AutopilotLaws_P.Constant_Value_fo, &rtb_FD_i, &rtb_Add3_b);
  rtb_Gain_dn = AutopilotLaws_P.Gain2_Gain_m * AutopilotLaws_U.in.data.H_dot_ft_min *
    AutopilotLaws_P.DiscreteDerivativeVariableTs1_Gain;
  distance_m = rtb_Gain_dn - AutopilotLaws_DWork.Delay_DSTATE_g;
  AutopilotLaws_LagFilter(distance_m / AutopilotLaws_U.in.time.dt, AutopilotLaws_P.LagFilter2_C1_k,
    AutopilotLaws_U.in.time.dt, &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LagFilter_fx);
  AutopilotLaws_WashoutFilter(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.WashoutFilter1_C1,
    AutopilotLaws_U.in.time.dt, &distance_m, &AutopilotLaws_DWork.sf_WashoutFilter_c);
  rtb_Delay_j = ((AutopilotLaws_U.in.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK_const) ||
                 (AutopilotLaws_U.in.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK2_const));
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain4_Gain_g * distance_m, rtb_Delay_j,
    &AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_gs_error_deg, AutopilotLaws_P.LagFilter1_C1_p,
    AutopilotLaws_U.in.time.dt, &rtb_Y_lo, &AutopilotLaws_DWork.sf_LagFilter_d);
  rtb_Add3_j3 = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain_o * rtb_Y_lo;
  AutopilotLaws_LagFilter(rtb_Y_lo + AutopilotLaws_P.Gain3_Gain_n * ((rtb_Add3_j3 - AutopilotLaws_DWork.Delay_DSTATE_p) /
    AutopilotLaws_U.in.time.dt), AutopilotLaws_P.LagFilter_C1_m, AutopilotLaws_U.in.time.dt, &a,
    &AutopilotLaws_DWork.sf_LagFilter_l);
  distance_m = look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_ec, AutopilotLaws_P.ScheduledGain_Table_l, 5U);
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain3_Gain_c * (AutopilotLaws_DWork.DelayInput1_DSTATE + a *
    distance_m), (AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.CompareToConstant_const_k) &&
    AutopilotLaws_U.in.data.nav_gs_valid, &rtb_Divide);
  AutopilotLaws_storevalue(rtb_error_c == AutopilotLaws_P.CompareToConstant6_const_e,
    AutopilotLaws_Y.out.data.nav_gs_deg, &distance_m, &AutopilotLaws_DWork.sf_storevalue_g);
  if (distance_m > AutopilotLaws_P.Saturation_UpperSat_e0) {
    distance_m = AutopilotLaws_P.Saturation_UpperSat_e0;
  } else if (distance_m < AutopilotLaws_P.Saturation_LowerSat_ph) {
    distance_m = AutopilotLaws_P.Saturation_LowerSat_ph;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_f * AutopilotLaws_U.in.data.H_dot_ft_min;
  a = AutopilotLaws_P.kntoms_Gain_ly * AutopilotLaws_U.in.data.V_gnd_kn;
  if (a > AutopilotLaws_P.Saturation_UpperSat_ds) {
    a = AutopilotLaws_P.Saturation_UpperSat_ds;
  } else if (a < AutopilotLaws_P.Saturation_LowerSat_a) {
    a = AutopilotLaws_P.Saturation_LowerSat_a;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / a) *
    AutopilotLaws_P.Gain_Gain_on;
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain2_Gain_l * (distance_m - AutopilotLaws_DWork.DelayInput1_DSTATE),
    rtb_Delay_j, &a);
  AutopilotLaws_Voter1(rtb_Divide + a, AutopilotLaws_P.Gain1_Gain_d4 * ((distance_m + AutopilotLaws_P.Bias_Bias) -
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.Gain_Gain_eyl * ((distance_m + AutopilotLaws_P.Bias1_Bias)
    - AutopilotLaws_DWork.DelayInput1_DSTATE), &rtb_Y_e);
  distance_m = rtb_GainTheta - AutopilotLaws_P.Constant2_Value_fj;
  limit = AutopilotLaws_P.Gain4_Gain_oy * distance_m;
  rtb_Gain5_n = AutopilotLaws_P.Gain5_Gain_cs * AutopilotLaws_U.in.data.bz_m_s2;
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.bx_m_s2, AutopilotLaws_P.WashoutFilter_C1_m,
    AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_WashoutFilter_g);
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.H_ind_ft, AutopilotLaws_P.WashoutFilter_C1_ej,
    AutopilotLaws_U.in.time.dt, &distance_m, &AutopilotLaws_DWork.sf_WashoutFilter_b);
  if (AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.Saturation_UpperSat_e0a) {
    rtb_Divide = AutopilotLaws_P.Saturation_UpperSat_e0a;
  } else if (AutopilotLaws_U.in.data.H_radio_ft < AutopilotLaws_P.Saturation_LowerSat_mg) {
    rtb_Divide = AutopilotLaws_P.Saturation_LowerSat_mg;
  } else {
    rtb_Divide = AutopilotLaws_U.in.data.H_radio_ft;
  }

  AutopilotLaws_LagFilter(rtb_Divide, AutopilotLaws_P.LagFilter_C1_p, AutopilotLaws_U.in.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LagFilter_ov);
  rtb_Y_lo = (distance_m + AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.DiscreteDerivativeVariableTs2_Gain;
  distance_m = (rtb_Y_lo - AutopilotLaws_DWork.Delay_DSTATE_pd) / AutopilotLaws_U.in.time.dt;
  AutopilotLaws_LagFilter(AutopilotLaws_P.Gain2_Gain_f * distance_m, AutopilotLaws_P.LagFilter3_C1,
    AutopilotLaws_U.in.time.dt, &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LagFilter_f);
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.H_dot_ft_min, AutopilotLaws_P.WashoutFilter1_C1_g,
    AutopilotLaws_U.in.time.dt, &distance_m, &AutopilotLaws_DWork.sf_WashoutFilter_f);
  a = AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m;
  rtb_Delay_j = (rtb_error_c == AutopilotLaws_P.CompareToConstant7_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty) {
    AutopilotLaws_DWork.wasActive = rtb_Delay_j;
    AutopilotLaws_DWork.wasActive_not_empty = true;
  }

  if ((!AutopilotLaws_DWork.wasActive) && rtb_Delay_j) {
    distance_m = std::abs(a) / 60.0;
    AutopilotLaws_DWork.Tau = AutopilotLaws_U.in.data.H_radio_ft / (distance_m - 1.6666666666666667);
    AutopilotLaws_DWork.H_bias = AutopilotLaws_DWork.Tau * distance_m - AutopilotLaws_U.in.data.H_radio_ft;
  }

  if (rtb_Delay_j) {
    distance_m = -1.0 / AutopilotLaws_DWork.Tau * (AutopilotLaws_U.in.data.H_radio_ft + AutopilotLaws_DWork.H_bias) *
      60.0;
  } else {
    distance_m = a;
  }

  AutopilotLaws_DWork.wasActive = rtb_Delay_j;
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_av * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_ew) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_ew;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_an) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_an;
  }

  rtb_Add3_d2 = (distance_m - a) * AutopilotLaws_P.ftmintoms_Gain_j / rtb_Add3_d2;
  if (rtb_Add3_d2 > 1.0) {
    rtb_Add3_d2 = 1.0;
  } else if (rtb_Add3_d2 < -1.0) {
    rtb_Add3_d2 = -1.0;
  }

  rtb_Gain_ij = AutopilotLaws_P.Gain_Gain_by * std::asin(rtb_Add3_d2);
  rtb_Sum_ia = AutopilotLaws_P.Constant1_Value_o0 - rtb_GainTheta;
  rtb_Sum3_ju = AutopilotLaws_P.Constant2_Value_kz - AutopilotLaws_U.in.data.H_ind_ft;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_i5 * AutopilotLaws_U.in.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_jl) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_jl;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_i3) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_i3;
  }

  distance_m = std::atan(AutopilotLaws_P.fpmtoms_Gain_m1 * AutopilotLaws_U.in.data.H_dot_ft_min /
    AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_lw;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_cw * distance_m;
  a = AutopilotLaws_P.Gain1_Gain_fj * rtb_GainTheta1;
  rtb_GainTheta1 = std::cos(a);
  rtb_Cos1_f = std::sin(a);
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_fr * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_Add3_kx = rtb_Divide - AutopilotLaws_P.Gain1_Gain_oy * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  a = AutopilotLaws_P.ktstomps_Gain_k * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_l * (AutopilotLaws_P.GStoGS_CAS_Gain_c * a),
    AutopilotLaws_P.WashoutFilter_C1_k, AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_WashoutFilter_ni);
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_fn * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_cr) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_cr;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_p5) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_p5;
  }

  AutopilotLaws_LeadLagFilter(a - AutopilotLaws_P.g_Gain_l * (AutopilotLaws_P.Gain1_Gain_fb *
    (AutopilotLaws_P.Gain_Gain_dno * ((AutopilotLaws_P.Gain1_Gain_ph * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_hb *
    (AutopilotLaws_P.Gain_Gain_hm * std::atan(AutopilotLaws_P.fpmtoms_Gain_dt * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Add3_d2))) * (AutopilotLaws_P.Constant_Value_of - rtb_GainTheta1) + rtb_Cos1_f * std::sin(rtb_Add3_kx)))),
    AutopilotLaws_P.HighPassFilter_C1_b, AutopilotLaws_P.HighPassFilter_C2_h3, AutopilotLaws_P.HighPassFilter_C3_cv,
    AutopilotLaws_P.HighPassFilter_C4_p, AutopilotLaws_U.in.time.dt, &rtb_Divide,
    &AutopilotLaws_DWork.sf_LeadLagFilter_f);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_gy * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_p, AutopilotLaws_P.LowPassFilter_C2_gu, AutopilotLaws_P.LowPassFilter_C3_ag,
    AutopilotLaws_P.LowPassFilter_C4_b, AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LeadLagFilter_i);
  a = (rtb_Divide + a) * AutopilotLaws_P.ug_Gain_o;
  rtb_GainTheta1 = (AutopilotLaws_P.Gain1_Gain_pw * a + AutopilotLaws_DWork.DelayInput1_DSTATE) *
    AutopilotLaws_P.Gain_Gain_cz;
  rtb_Divide = (AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.input.V_c_kn) * AutopilotLaws_P.Gain1_Gain_kh;
  rtb_Delay_j = ((rtb_Sum3_ju > AutopilotLaws_P.CompareToConstant6_const_g) && (rtb_GainTheta1 <
    AutopilotLaws_P.CompareToConstant5_const_m) && (rtb_Divide < AutopilotLaws_P.CompareToConstant2_const_p) &&
                 (rtb_error_c == AutopilotLaws_P.CompareToConstant8_const));
  a += AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (rtb_Delay_j) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_b;
  } else {
    if (rtb_Sum3_ju > AutopilotLaws_P.CompareToConstant_const_o1) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_f;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain5_Gain_g * rtb_GainTheta1;
    }

    if (rtb_Divide <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      if (rtb_Sum3_ju > AutopilotLaws_P.CompareToConstant4_const_j) {
        AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmax(AutopilotLaws_P.Constant2_Value_f,
          AutopilotLaws_P.Gain1_Gain_is * rtb_GainTheta1);
      } else {
        AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain6_Gain_g * rtb_GainTheta1;
      }

      if (rtb_Divide >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
        AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Divide;
      }
    }
  }

  rtb_GainTheta1 = (AutopilotLaws_P.Gain_Gain_i2 * a - distance_m) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_iu * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Sum3_ju < 0.0) {
    a = -1.0;
  } else if (rtb_Sum3_ju > 0.0) {
    a = 1.0;
  } else {
    a = rtb_Sum3_ju;
  }

  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_l5) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_l5;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_kw) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_kw;
  }

  rtb_Add3_d2 = (a * AutopilotLaws_P.Constant3_Value_ep - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_i / rtb_Add3_d2;
  if (rtb_Add3_d2 > 1.0) {
    rtb_Add3_d2 = 1.0;
  } else if (rtb_Add3_d2 < -1.0) {
    rtb_Add3_d2 = -1.0;
  }

  rtb_Cos1_f = AutopilotLaws_P.Gain_Gain_ji * std::asin(rtb_Add3_d2);
  rtb_Add3_d2 = AutopilotLaws_P.kntoms_Gain_iw * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_jt) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_jt;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_ih) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_ih;
  }

  rtb_Add3_d2 = (AutopilotLaws_P.Constant_Value_ia - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_lv / rtb_Add3_d2;
  if (rtb_Add3_d2 > 1.0) {
    rtb_Add3_d2 = 1.0;
  } else if (rtb_Add3_d2 < -1.0) {
    rtb_Add3_d2 = -1.0;
  }

  rtb_Divide = AutopilotLaws_P.Gain_Gain_o1 * std::asin(rtb_Add3_d2);
  if (rtb_Delay_j) {
    distance_m = rtb_GainTheta1;
  } else if (rtb_Sum3_ju > AutopilotLaws_P.Switch_Threshold_j) {
    distance_m = std::fmax(rtb_GainTheta1, rtb_Cos1_f);
  } else {
    distance_m = std::fmin(rtb_GainTheta1, rtb_Cos1_f);
  }

  AutopilotLaws_Voter1(rtb_Sum_ia, distance_m, rtb_Divide, &a);
  distance_m = rtb_lo_f;
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.input.H_c_ft - AutopilotLaws_U.in.data.H_ft, AutopilotLaws_P.LagFilter_C1_b,
    AutopilotLaws_U.in.time.dt, &distance_m, &AutopilotLaws_DWork.sf_LagFilter_ds);
  rtb_Add3_d2 = AutopilotLaws_P.Gain2_Gain_hq * distance_m;
  distance_m = AutopilotLaws_P.kntoms_Gain_j * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Add3_d2 > AutopilotLaws_P.Saturation_UpperSat_f3) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_UpperSat_f3;
  } else if (rtb_Add3_d2 < AutopilotLaws_P.Saturation_LowerSat_b) {
    rtb_Add3_d2 = AutopilotLaws_P.Saturation_LowerSat_b;
  }

  if (distance_m > AutopilotLaws_P.Saturation_UpperSat_nu) {
    distance_m = AutopilotLaws_P.Saturation_UpperSat_nu;
  } else if (distance_m < AutopilotLaws_P.Saturation_LowerSat_dj) {
    distance_m = AutopilotLaws_P.Saturation_LowerSat_dj;
  }

  rtb_Add3_d2 = ((AutopilotLaws_P.Gain_Gain_pe * rtb_lo_f + rtb_Add3_d2) - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_k / distance_m;
  if (rtb_Add3_d2 > 1.0) {
    rtb_Add3_d2 = 1.0;
  } else if (rtb_Add3_d2 < -1.0) {
    rtb_Add3_d2 = -1.0;
  }

  rtb_lo_f = AutopilotLaws_P.Gain_Gain_fs * std::asin(rtb_Add3_d2);
  switch (static_cast<int32_T>(rtb_error_c)) {
   case 0:
    R = AutopilotLaws_P.Constant_Value_d;
    break;

   case 1:
    R = rtb_Saturation;
    break;

   case 2:
    break;

   case 3:
    if (rtb_Compare_e) {
      R = rtb_Y_f;
    } else if (Phi2 > AutopilotLaws_P.Switch_Threshold) {
      R = std::fmax(rtb_Y_f, rtb_lo_a);
    } else {
      R = std::fmin(rtb_Y_f, rtb_lo_a);
    }
    break;

   case 4:
    R = rtb_Cos_d5;
    break;

   case 5:
    R = rtb_FD_i;
    break;

   case 6:
    R = AutopilotLaws_P.Gain1_Gain_d * rtb_Y_e;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch1_Threshold_j) {
      R = AutopilotLaws_P.Gain2_Gain_h * limit;
    } else {
      R = (AutopilotLaws_P.Gain1_Gain_i * rtb_Y_j + rtb_Gain5_n) + rtb_Gain_ij;
    }
    break;

   case 8:
    R = a;
    break;

   default:
    R = rtb_lo_f;
    break;
  }

  if (R > AutopilotLaws_P.Constant1_Value_if) {
    distance_m = AutopilotLaws_P.Constant1_Value_if;
  } else {
    distance_m = AutopilotLaws_P.Gain1_Gain_n * AutopilotLaws_P.Constant1_Value_if;
    if (R >= distance_m) {
      distance_m = R;
    }
  }

  AutopilotLaws_RateLimiter(distance_m - b_R, AutopilotLaws_P.RateLimiterVariableTs1_up,
    AutopilotLaws_P.RateLimiterVariableTs1_lo, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs1_InitialCondition, &distance_m, &AutopilotLaws_DWork.sf_RateLimiter_k);
  AutopilotLaws_LagFilter(distance_m, AutopilotLaws_P.LagFilter_C1_g, AutopilotLaws_U.in.time.dt, &a,
    &AutopilotLaws_DWork.sf_LagFilter_i);
  AutopilotLaws_DWork.icLoad_f = ((rtb_Saturation_i == 0) || AutopilotLaws_DWork.icLoad_f);
  if (AutopilotLaws_DWork.icLoad_f) {
    AutopilotLaws_DWork.Delay_DSTATE_h2 = rtb_GainTheta;
  }

  AutopilotLaws_VSLimiter(AutopilotLaws_P.VS_Gain_n * rtb_Saturation, &AutopilotLaws_Y.out, &distance_m);
  if (!rtb_Compare_e) {
    if (Phi2 > AutopilotLaws_P.Switch_Threshold_f) {
      rtb_Y_f = std::fmax(rtb_Y_f, AutopilotLaws_P.VS_Gain_p * rtb_lo_a);
    } else {
      rtb_Y_f = std::fmin(rtb_Y_f, AutopilotLaws_P.VS_Gain_p * rtb_lo_a);
    }
  }

  AutopilotLaws_VSLimiter(AutopilotLaws_P.Gain_Gain_oa * rtb_Y_f, &AutopilotLaws_Y.out, &b_R);
  AutopilotLaws_VSLimiter(rtb_Y_e, &AutopilotLaws_Y.out, &rtb_Saturation);
  if (rtb_on_ground <= AutopilotLaws_P.Switch_Threshold_c) {
    limit = (AutopilotLaws_P.Gain3_Gain_l * rtb_Y_j + rtb_Gain5_n) + AutopilotLaws_P.VS_Gain_e * rtb_Gain_ij;
  }

  AutopilotLaws_VSLimiter(limit, &AutopilotLaws_Y.out, &Phi2);
  if (!rtb_Delay_j) {
    if (rtb_Sum3_ju > AutopilotLaws_P.Switch_Threshold_g) {
      rtb_GainTheta1 = std::fmax(rtb_GainTheta1, AutopilotLaws_P.VS_Gain_f * rtb_Cos1_f);
    } else {
      rtb_GainTheta1 = std::fmin(rtb_GainTheta1, AutopilotLaws_P.VS_Gain_f * rtb_Cos1_f);
    }
  }

  AutopilotLaws_Voter1(rtb_Sum_ia, AutopilotLaws_P.Gain_Gain_eh * rtb_GainTheta1, AutopilotLaws_P.VS_Gain_nx *
                       rtb_Divide, &R);
  AutopilotLaws_VSLimiter(R, &AutopilotLaws_Y.out, &rtb_GainTheta1);
  if (AutopilotLaws_U.in.input.vertical_mode == 24.0) {
    rtb_Divide = 0.15;
  } else {
    rtb_Divide = 0.1;
  }

  limit = b_L * rtb_Divide * 57.295779513082323;
  switch (static_cast<int32_T>(rtb_error_c)) {
   case 0:
    distance_m = AutopilotLaws_P.Constant_Value_d;
    break;

   case 1:
    break;

   case 2:
    distance_m = L;
    break;

   case 3:
    distance_m = b_R;
    break;

   case 4:
    distance_m = rtb_Sum_if;
    break;

   case 5:
    distance_m = rtb_Add3_b;
    break;

   case 6:
    distance_m = rtb_Saturation;
    break;

   case 7:
    distance_m = Phi2;
    break;

   case 8:
    distance_m = rtb_GainTheta1;
    break;

   default:
    distance_m = std::fmax(-limit, std::fmin(limit, AutopilotLaws_P.VS_Gain_ne * rtb_lo_f));
    break;
  }

  distance_m += rtb_GainTheta;
  if (distance_m > AutopilotLaws_P.Constant1_Value_if) {
    distance_m = AutopilotLaws_P.Constant1_Value_if;
  } else {
    rtb_GainTheta1 = AutopilotLaws_P.Gain1_Gain_m * AutopilotLaws_P.Constant1_Value_if;
    if (distance_m < rtb_GainTheta1) {
      distance_m = rtb_GainTheta1;
    }
  }

  rtb_GainTheta1 = b_L * 0.3 * 57.295779513082323;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_GainTheta1 * AutopilotLaws_U.in.time.dt;
  distance_m = std::fmin(distance_m - AutopilotLaws_DWork.Delay_DSTATE_h2, AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_i0 * rtb_GainTheta1;
  AutopilotLaws_DWork.DelayInput1_DSTATE *= AutopilotLaws_U.in.time.dt;
  AutopilotLaws_DWork.Delay_DSTATE_h2 += std::fmax(distance_m, AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h2, AutopilotLaws_P.LagFilter_C1_i,
    AutopilotLaws_U.in.time.dt, &b_R, &AutopilotLaws_DWork.sf_LagFilter_gn);
  AutopilotLaws_RateLimiter(static_cast<real_T>(rtb_Saturation_i), AutopilotLaws_P.RateLimiterVariableTs_up_i,
    AutopilotLaws_P.RateLimiterVariableTs_lo_o, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_p, &distance_m, &AutopilotLaws_DWork.sf_RateLimiter_eb);
  if (distance_m > AutopilotLaws_P.Saturation_UpperSat_ix) {
    distance_m = AutopilotLaws_P.Saturation_UpperSat_ix;
  } else if (distance_m < AutopilotLaws_P.Saturation_LowerSat_eq) {
    distance_m = AutopilotLaws_P.Saturation_LowerSat_eq;
  }

  AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = a;
  AutopilotLaws_Y.out.output.autopilot.Theta_c_deg = (AutopilotLaws_P.Constant_Value_i4 - distance_m) * rtb_GainTheta +
    b_R * distance_m;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.altimeter_setting_left_mbar;
  AutopilotLaws_DWork.DelayInput1_DSTATE_g = AutopilotLaws_U.in.data.altimeter_setting_right_mbar;
  for (rtb_Saturation_i = 0; rtb_Saturation_i < 99; rtb_Saturation_i++) {
    AutopilotLaws_DWork.Delay_DSTATE_l[rtb_Saturation_i] = AutopilotLaws_DWork.Delay_DSTATE_l[rtb_Saturation_i + 1];
    AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_Saturation_i] = AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_Saturation_i + 1];
  }

  AutopilotLaws_DWork.Delay_DSTATE_l[99] = rtb_valid;
  AutopilotLaws_DWork.Delay_DSTATE_h5[99] = rtb_valid_m;
  AutopilotLaws_DWork.Delay_DSTATE_e = rtb_dme;
  AutopilotLaws_DWork.icLoad = false;
  AutopilotLaws_DWork.Delay_DSTATE_g = rtb_Gain_dn;
  AutopilotLaws_DWork.Delay_DSTATE_p = rtb_Add3_j3;
  AutopilotLaws_DWork.Delay_DSTATE_pd = rtb_Y_lo;
  AutopilotLaws_DWork.icLoad_f = false;
}

void AutopilotLawsModelClass::initialize()
{
  {
    real_T rtb_out_m;
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.DetectChange_vinit;
    AutopilotLaws_DWork.DelayInput1_DSTATE_g = AutopilotLaws_P.DetectChange1_vinit;
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
    for (int32_T i{0}; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[i] = AutopilotLaws_P.Delay_InitialCondition;
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }

    AutopilotLaws_DWork.Delay_DSTATE_e = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition;
    AutopilotLaws_DWork.icLoad = true;
    AutopilotLaws_DWork.Delay_DSTATE_g = AutopilotLaws_P.DiscreteDerivativeVariableTs1_InitialCondition;
    AutopilotLaws_DWork.Delay_DSTATE_p = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition_c;
    AutopilotLaws_DWork.Delay_DSTATE_pd = AutopilotLaws_P.DiscreteDerivativeVariableTs2_InitialCondition;
    AutopilotLaws_DWork.icLoad_f = true;
    AutopilotLaws_Chart_g_Init(&rtb_out_m);
    AutopilotLaws_Chart_g_Init(&rtb_out_m);
    AutopilotLaws_Chart_Init(&rtb_out_m);
    AutopilotLaws_MATLABFunction_f_Init(&AutopilotLaws_DWork.sf_MATLABFunction_m);
    AutopilotLaws_Chart_Init(&rtb_out_m);
    AutopilotLaws_MATLABFunction_f_Init(&AutopilotLaws_DWork.sf_MATLABFunction_e);
    AutopilotLaws_B.u = AutopilotLaws_P.Y_Y0;
    AutopilotLaws_DWork.k = 5.0;
    AutopilotLaws_DWork.maxH_dot = 1500.0;
  }
}

void AutopilotLawsModelClass::terminate()
{
}

AutopilotLawsModelClass::AutopilotLawsModelClass():
  AutopilotLaws_U(),
  AutopilotLaws_Y(),
  AutopilotLaws_B(),
  AutopilotLaws_DWork()
{
}

AutopilotLawsModelClass::~AutopilotLawsModelClass()
{
}
