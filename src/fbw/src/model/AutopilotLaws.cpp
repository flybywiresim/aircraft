#include "AutopilotLaws.h"
#include "AutopilotLaws_private.h"
#include "look1_binlxpw.h"
#include "mod_mvZvttxs.h"
#include "rt_modd.h"

const uint8_T AutopilotLaws_IN_any{ 1U };

const uint8_T AutopilotLaws_IN_left{ 2U };

const uint8_T AutopilotLaws_IN_right{ 3U };

const uint8_T AutopilotLaws_IN_any_o{ 1U };

const uint8_T AutopilotLaws_IN_left_f{ 2U };

const uint8_T AutopilotLaws_IN_right_l{ 3U };

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
    localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_any_o;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c15_AutopilotLaws) {
     case AutopilotLaws_IN_any_o:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_right);
        tmp_0 = std::abs(rtu_left);
        if ((rtu_use_short_path == 0.0) && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
          localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_right_l;
          *rty_out = rtu_right;
        } else if ((rtu_use_short_path == 0.0) && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
          localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_left_f;
          *rty_out = rtu_left;
        } else if (tmp_0 < tmp) {
          *rty_out = rtu_left;
        } else {
          *rty_out = rtu_right;
        }
      }
      break;

     case AutopilotLaws_IN_left_f:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_left);
        tmp_0 = std::abs(rtu_right);
        if ((rtu_use_short_path != 0.0) || (tmp_0 < 10.0) || (tmp < 10.0)) {
          localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_any_o;
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
          localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_any_o;
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
  real_T rtb_Add3_d;
  real_T rtb_Add3_fm;
  real_T rtb_Add3_l;
  real_T rtb_Add3_n;
  real_T rtb_Cos1_k;
  real_T rtb_Cos1_pk;
  real_T rtb_Cos_k;
  real_T rtb_Gain4_m;
  real_T rtb_Gain5_n;
  real_T rtb_GainTheta;
  real_T rtb_GainTheta1;
  real_T rtb_Gain_dn;
  real_T rtb_Gain_ij;
  real_T rtb_Saturation;
  real_T rtb_Saturation_c;
  real_T rtb_Sum2_p;
  real_T rtb_Sum_ae;
  real_T rtb_Y_k;
  real_T rtb_dme;
  real_T rtb_error_d;
  int32_T low_i;
  int32_T low_ip1;
  int32_T rtb_on_ground;
  boolean_T guard1{ false };

  boolean_T rtb_Compare_jy;
  boolean_T rtb_Delay_j;
  boolean_T rtb_valid;
  boolean_T rtb_valid_d;
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
  R = std::cos(rtb_dme);
  distance_m = 1.0 / R;
  result_tmp[5] = distance_m * a;
  result_tmp[8] = distance_m * b_R;
  rtb_error_d = AutopilotLaws_P.Gain_Gain_de * AutopilotLaws_U.in.data.p_rad_s * AutopilotLaws_P.Gainpk_Gain;
  rtb_Saturation = AutopilotLaws_P.Gain_Gain_d * AutopilotLaws_U.in.data.q_rad_s * AutopilotLaws_P.Gainqk_Gain;
  Phi2 = AutopilotLaws_P.Gain_Gain_m * AutopilotLaws_U.in.data.r_rad_s;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result[rtb_on_ground] = (result_tmp[rtb_on_ground + 3] * rtb_Saturation + result_tmp[rtb_on_ground] * rtb_error_d) +
      result_tmp[rtb_on_ground + 6] * Phi2;
  }

  rtb_error_d = std::sin(rtb_dme);
  result_tmp[0] = R;
  result_tmp[3] = 0.0;
  result_tmp[6] = -rtb_error_d;
  result_tmp[1] = a * rtb_error_d;
  result_tmp[4] = b_R;
  result_tmp[7] = R * a;
  result_tmp[2] = b_R * rtb_error_d;
  result_tmp[5] = 0.0 - a;
  result_tmp[8] = b_R * R;
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

  rtb_error_d = 0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lat;
  Phi2 = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_loc_position.lat;
  rtb_Saturation = 0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lon;
  a = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lat - AutopilotLaws_U.in.data.aircraft_position.lat) *
               0.017453292519943295 / 2.0);
  distance_m = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lon - AutopilotLaws_U.in.data.aircraft_position.lon) *
                        0.017453292519943295 / 2.0);
  a = std::cos(rtb_error_d) * std::cos(Phi2) * distance_m * distance_m + a * a;
  distance_m = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  a = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_loc_position.alt;
  R = std::cos(Phi2);
  L = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_loc_position.lon - rtb_Saturation;
  b_L = mod_mvZvttxs((mod_mvZvttxs(mod_mvZvttxs(360.0) + 360.0) - (mod_mvZvttxs(mod_mvZvttxs
    (AutopilotLaws_U.in.data.nav_loc_magvar_deg) + 360.0) + 360.0)) + 360.0);
  b_R = mod_mvZvttxs(360.0 - b_L);
  if (std::abs(b_L) < std::abs(b_R)) {
    b_R = -b_L;
  }

  b_L = std::cos(rtb_error_d);
  rtb_error_d = std::sin(rtb_error_d);
  R = mod_mvZvttxs(mod_mvZvttxs(mod_mvZvttxs(std::atan2(std::sin(L) * R, b_L * std::sin(Phi2) - rtb_error_d * R * std::
    cos(L)) * 57.295779513082323 + 360.0)) + 360.0) + 360.0;
  Phi2 = mod_mvZvttxs((mod_mvZvttxs(mod_mvZvttxs(mod_mvZvttxs(mod_mvZvttxs(AutopilotLaws_U.in.data.nav_loc_deg - b_R) +
    360.0)) + 360.0) - R) + 360.0);
  b_R = mod_mvZvttxs(360.0 - Phi2);
  guard1 = false;
  if (std::abs(std::sqrt(distance_m * distance_m + a * a) / 1852.0) < 30.0) {
    L = mod_mvZvttxs((mod_mvZvttxs(mod_mvZvttxs(AutopilotLaws_U.in.data.nav_loc_deg) + 360.0) - R) + 360.0);
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
  R = std::cos(Phi2);
  L = b_L;
  a = b_L * R * distance_m * distance_m + a * a;
  distance_m = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  a = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_gs_position.alt;
  distance_m = std::sqrt(distance_m * distance_m + a * a);
  rtb_Saturation = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_gs_position.lon - rtb_Saturation;
  rtb_Saturation = std::atan2(std::sin(rtb_Saturation) * R, b_L * std::sin(Phi2) - rtb_error_d * R * std::cos
    (rtb_Saturation)) * 57.295779513082323;
  if (rtb_Saturation + 360.0 == 0.0) {
    rtb_error_d = 0.0;
  } else {
    rtb_error_d = std::fmod(rtb_Saturation + 360.0, 360.0);
    if (rtb_error_d == 0.0) {
      rtb_error_d = 0.0;
    } else if (rtb_Saturation + 360.0 < 0.0) {
      rtb_error_d += 360.0;
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

    if (rtb_error_d == 0.0) {
      Phi2 = 0.0;
    } else {
      Phi2 = std::fmod(rtb_error_d, 360.0);
      if (Phi2 == 0.0) {
        Phi2 = 0.0;
      } else if (rtb_error_d < 0.0) {
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
      rtb_valid_d = true;
      rtb_error_d = std::asin(a / distance_m) * 57.295779513082323 - AutopilotLaws_DWork.nav_gs_deg;
    } else {
      guard1 = true;
    }
  } else {
    guard1 = true;
  }

  if (guard1) {
    rtb_valid_d = false;
    rtb_error_d = 0.0;
  }

  rtb_Saturation = AutopilotLaws_P.Gain_Gain_n * AutopilotLaws_U.in.data.gear_strut_compression_1 -
    AutopilotLaws_P.Constant1_Value_b;
  if (rtb_Saturation > AutopilotLaws_P.Saturation_UpperSat_p) {
    rtb_Saturation = AutopilotLaws_P.Saturation_UpperSat_p;
  } else if (rtb_Saturation < AutopilotLaws_P.Saturation_LowerSat_g) {
    rtb_Saturation = AutopilotLaws_P.Saturation_LowerSat_g;
  }

  Phi2 = AutopilotLaws_P.Gain1_Gain_ll * AutopilotLaws_U.in.data.gear_strut_compression_2 -
    AutopilotLaws_P.Constant1_Value_b;
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

  rtb_Compare_jy = (AutopilotLaws_U.in.data.altimeter_setting_left_mbar != AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_DWork.DelayInput1_DSTATE_g;
  AutopilotLaws_Y.out = AutopilotLaws_P.ap_laws_output_MATLABStruct;
  AutopilotLaws_Y.out.output.ap_on = ((AutopilotLaws_U.in.input.enabled_AP1 != 0.0) ||
    (AutopilotLaws_U.in.input.enabled_AP2 != 0.0));
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
  AutopilotLaws_Y.out.data.nav_e_gs_valid = rtb_valid_d;
  AutopilotLaws_Y.out.data.nav_e_gs_error_deg = rtb_error_d;
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
  AutopilotLaws_Y.out.data.altimeter_setting_changed = (rtb_Compare_jy ||
    (AutopilotLaws_U.in.data.altimeter_setting_right_mbar != AutopilotLaws_DWork.DelayInput1_DSTATE));
  AutopilotLaws_Y.out.input = AutopilotLaws_U.in.input;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_e;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.data.Psi_magnetic_deg -
    AutopilotLaws_DWork.DelayInput1_DSTATE) + AutopilotLaws_P.Constant3_Value_e;
  rtb_GainTheta = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_e);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_e - rtb_GainTheta;
  b_R = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_e);
  if (rtb_GainTheta < b_R) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_h * rtb_GainTheta;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_e * b_R;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_b);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_b;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_b);
  rtb_GainTheta = AutopilotLaws_U.in.data.nav_loc_deg - AutopilotLaws_U.in.data.nav_loc_magvar_deg;
  distance_m = rt_modd(rt_modd(rtb_GainTheta, AutopilotLaws_P.Constant3_Value_n) + AutopilotLaws_P.Constant3_Value_n,
                       AutopilotLaws_P.Constant3_Value_n);
  b_R = rt_modd((AutopilotLaws_DWork.DelayInput1_DSTATE - (distance_m + AutopilotLaws_P.Constant3_Value_i)) +
                AutopilotLaws_P.Constant3_Value_i, AutopilotLaws_P.Constant3_Value_i);
  rtb_Saturation = rt_modd(AutopilotLaws_P.Constant3_Value_i - b_R, AutopilotLaws_P.Constant3_Value_i);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting == 1) {
    rtb_error_d = AutopilotLaws_P.Constant_Value;
  } else {
    rtb_error_d = AutopilotLaws_U.in.input.lateral_law;
  }

  rtb_valid = (rtb_error_d == AutopilotLaws_P.CompareToConstant2_const);
  if (b_R < rtb_Saturation) {
    b_R *= AutopilotLaws_P.Gain1_Gain;
  } else {
    b_R = AutopilotLaws_P.Gain_Gain * rtb_Saturation;
  }

  b_R = std::abs(b_R);
  if (!AutopilotLaws_DWork.limit_not_empty) {
    AutopilotLaws_DWork.limit = b_R;
    AutopilotLaws_DWork.limit_not_empty = true;
  }

  if (!rtb_valid) {
    AutopilotLaws_DWork.limit = std::fmin(std::fmax(b_R, 15.0), 115.0);
  }

  if (rtb_valid && (b_R < 15.0)) {
    AutopilotLaws_DWork.limit = 15.0;
  }

  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value, AutopilotLaws_P.zeta_Value, &R, &b_L);
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_b) {
    b_R = AutopilotLaws_P.Saturation_UpperSat_b;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_n) {
    b_R = AutopilotLaws_P.Saturation_LowerSat_n;
  } else {
    b_R = rtb_dme;
  }

  b_R = std::sin(AutopilotLaws_P.Gain1_Gain_f * AutopilotLaws_U.in.data.nav_loc_error_deg) * b_R *
    AutopilotLaws_P.Gain_Gain_h * b_L / AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.DelayInput1_DSTATE - (rt_modd(rt_modd
    (AutopilotLaws_U.in.data.nav_loc_error_deg + distance_m, AutopilotLaws_P.Constant3_Value_c) +
    AutopilotLaws_P.Constant3_Value_c, AutopilotLaws_P.Constant3_Value_c) + AutopilotLaws_P.Constant3_Value_p)) +
    AutopilotLaws_P.Constant3_Value_p;
  rtb_Saturation = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_p);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_p - rtb_Saturation;
  Phi2 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_p);
  if (rtb_Saturation < Phi2) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_p * rtb_Saturation;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_a * Phi2;
  }

  if (b_R > AutopilotLaws_DWork.limit) {
    b_R = AutopilotLaws_DWork.limit;
  } else if (b_R < -AutopilotLaws_DWork.limit) {
    b_R = -AutopilotLaws_DWork.limit;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_P.Gain2_Gain_i * AutopilotLaws_DWork.DelayInput1_DSTATE + b_R)
    * R;
  rtb_Saturation = AutopilotLaws_DWork.DelayInput1_DSTATE * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_nr * AutopilotLaws_U.in.data.nav_loc_error_deg;
  b_R = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_o) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_o;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_o) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_o;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_dme;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = b_R * AutopilotLaws_DWork.DelayInput1_DSTATE * AutopilotLaws_P.Gain2_Gain_g;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation1_UpperSat_g) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation1_UpperSat_g;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation1_LowerSat_k) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation1_LowerSat_k;
  }

  rtb_Compare_jy = (rtb_error_d == AutopilotLaws_P.CompareToConstant_const);
  if (!rtb_Compare_jy) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  AutopilotLaws_DWork.Delay_DSTATE += AutopilotLaws_P.Gain6_Gain_b * AutopilotLaws_DWork.DelayInput1_DSTATE *
    AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_Gain * AutopilotLaws_U.in.time.dt;
  if (AutopilotLaws_DWork.Delay_DSTATE > AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (AutopilotLaws_DWork.Delay_DSTATE < AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  rtb_dme = AutopilotLaws_DWork.DelayInput1_DSTATE * look1_binlxpw(AutopilotLaws_U.in.data.V_gnd_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain_Table, 2U);
  AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_GainTheta;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_d);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_d;
  AutopilotLaws_storevalue(rtb_Compare_jy, rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_d), &b_L, &AutopilotLaws_DWork.sf_storevalue);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.nav_loc_error_deg + b_L;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_o);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_o;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_o);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_n1;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.data.Psi_true_deg -
    AutopilotLaws_DWork.DelayInput1_DSTATE) + AutopilotLaws_P.Constant3_Value_n1;
  b_R = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_n1);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_n1 - b_R;
  Phi2 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_n1);
  if (b_R < Phi2) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_j * b_R;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_i * Phi2;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.Delay_DSTATE + rtb_dme) + AutopilotLaws_P.Gain1_Gain_fq *
    AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_U.in.data.Psi_true_deg;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_h);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_h;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_h);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.DelayInput1_DSTATE -
    (AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_nr)) + AutopilotLaws_P.Constant3_Value_nr;
  rtb_dme = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_nr);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_nr - rtb_dme;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_nr);
  AutopilotLaws_Chart_h(rtb_dme, AutopilotLaws_P.Gain_Gain_oc * AutopilotLaws_DWork.DelayInput1_DSTATE,
                        AutopilotLaws_P.Constant1_Value_e, &Phi2, &AutopilotLaws_DWork.sf_Chart_b);
  AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_GainTheta;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_if);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_if;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_if);
  distance_m = AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_m;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.DelayInput1_DSTATE - distance_m) +
    AutopilotLaws_P.Constant3_Value_m;
  rtb_dme = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_m);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_m - rtb_dme;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_m);
  AutopilotLaws_Chart_h(rtb_dme, AutopilotLaws_P.Gain_Gain_fn * AutopilotLaws_DWork.DelayInput1_DSTATE,
                        AutopilotLaws_P.Constant2_Value_l, &a, &AutopilotLaws_DWork.sf_Chart_h);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.Psi_magnetic_deg + AutopilotLaws_P.Constant3_Value_cd;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.input.Psi_c_deg - AutopilotLaws_DWork.DelayInput1_DSTATE)
    + AutopilotLaws_P.Constant3_Value_cd;
  rtb_dme = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_cd);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_cd - rtb_dme;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_cd);
  rtb_valid = ((rtb_error_d == AutopilotLaws_P.CompareToConstant5_const) == AutopilotLaws_P.CompareToConstant_const_hx);
  rtb_GainTheta = AutopilotLaws_P.Subsystem_Value / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid) {
    for (rtb_on_ground = 0; rtb_on_ground < 100; rtb_on_ground++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground] = AutopilotLaws_P.Delay_InitialCondition;
    }
  }

  if (rtb_GainTheta < 1.0) {
    rtb_valid_d = rtb_valid;
  } else {
    if (rtb_GainTheta > 100.0) {
      rtb_on_ground = 100;
    } else {
      rtb_on_ground = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(rtb_GainTheta), 4.294967296E+9)));
    }

    rtb_valid_d = AutopilotLaws_DWork.Delay_DSTATE_l[100U - rtb_on_ground];
  }

  AutopilotLaws_Chart(rtb_dme, AutopilotLaws_P.Gain_Gain_cy * AutopilotLaws_DWork.DelayInput1_DSTATE, rtb_valid !=
                      rtb_valid_d, &rtb_GainTheta, &AutopilotLaws_DWork.sf_Chart);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.Psi_magnetic_track_deg +
    AutopilotLaws_P.Constant3_Value_k;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.input.Psi_c_deg - AutopilotLaws_DWork.DelayInput1_DSTATE)
    + AutopilotLaws_P.Constant3_Value_k;
  rtb_dme = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_k);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_k - rtb_dme;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_k);
  rtb_valid_d = ((rtb_error_d == AutopilotLaws_P.CompareToConstant4_const) == AutopilotLaws_P.CompareToConstant_const_e);
  b_R = AutopilotLaws_P.Subsystem_Value_n / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid_d) {
    for (rtb_on_ground = 0; rtb_on_ground < 100; rtb_on_ground++) {
      AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground] = AutopilotLaws_P.Delay_InitialCondition_b;
    }
  }

  if (b_R < 1.0) {
    rtb_Delay_j = rtb_valid_d;
  } else {
    if (b_R > 100.0) {
      rtb_on_ground = 100;
    } else {
      rtb_on_ground = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(b_R), 4.294967296E+9)));
    }

    rtb_Delay_j = AutopilotLaws_DWork.Delay_DSTATE_h5[100U - rtb_on_ground];
  }

  AutopilotLaws_Chart(rtb_dme, AutopilotLaws_P.Gain_Gain_p * AutopilotLaws_DWork.DelayInput1_DSTATE, rtb_valid_d !=
                      rtb_Delay_j, &L, &AutopilotLaws_DWork.sf_Chart_ba);
  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value_c, AutopilotLaws_P.zeta_Value_h, &b_R, &distance_m);
  AutopilotLaws_RateLimiter(AutopilotLaws_U.in.data.flight_guidance_phi_deg, AutopilotLaws_P.RateLimiterVariableTs_up,
    AutopilotLaws_P.RateLimiterVariableTs_lo, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition, &R, &AutopilotLaws_DWork.sf_RateLimiter);
  AutopilotLaws_LagFilter(R, AutopilotLaws_P.LagFilter_C1, AutopilotLaws_U.in.time.dt, &rtb_Y_k,
    &AutopilotLaws_DWork.sf_LagFilter);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_loc_error_deg, AutopilotLaws_P.LagFilter2_C1,
    AutopilotLaws_U.in.time.dt, &R, &AutopilotLaws_DWork.sf_LagFilter_h);
  rtb_dme = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain * R;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_dme - AutopilotLaws_DWork.Delay_DSTATE_e;
  AutopilotLaws_DWork.DelayInput1_DSTATE /= AutopilotLaws_U.in.time.dt;
  AutopilotLaws_LagFilter(R + AutopilotLaws_P.Gain3_Gain_i * AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.LagFilter_C1_n, AutopilotLaws_U.in.time.dt, &b_L, &AutopilotLaws_DWork.sf_LagFilter_m);
  rtb_Delay_j = (AutopilotLaws_U.in.data.H_radio_ft <= AutopilotLaws_P.CompareToConstant_const_d);
  switch (static_cast<int32_T>(rtb_error_d)) {
   case 0:
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_GainTheta1;
    break;

   case 1:
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_GainTheta * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_h, AutopilotLaws_P.ScheduledGain_Table_o, 6U) *
      AutopilotLaws_P.Gain1_Gain_o + AutopilotLaws_P.Gain_Gain_o * result[2];
    break;

   case 2:
    AutopilotLaws_DWork.DelayInput1_DSTATE = L * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_o, AutopilotLaws_P.ScheduledGain_Table_e, 6U) *
      AutopilotLaws_P.Gain1_Gain_i + AutopilotLaws_P.Gain_Gain_l * result[2];
    break;

   case 3:
    rtb_Saturation_c = AutopilotLaws_P.Gain_Gain_c * AutopilotLaws_U.in.data.flight_guidance_xtk_nmi * distance_m /
      AutopilotLaws_U.in.data.V_gnd_kn;
    if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat) {
      rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat;
    } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat) {
      rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat;
    }

    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Y_k - (AutopilotLaws_P.Gain2_Gain *
      AutopilotLaws_U.in.data.flight_guidance_tae_deg + rtb_Saturation_c) * b_R * AutopilotLaws_U.in.data.V_gnd_kn;
    break;

   case 4:
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Saturation;
    break;

   case 5:
    if (rtb_Delay_j) {
      rtb_GainTheta = AutopilotLaws_P.k_beta_Phi_Gain * AutopilotLaws_U.in.data.beta_deg;
    } else {
      rtb_GainTheta = AutopilotLaws_P.Constant1_Value_fk;
    }

    AutopilotLaws_DWork.DelayInput1_DSTATE = b_L * look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_e, AutopilotLaws_P.ScheduledGain_Table_p, 4U) *
      look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1,
                    AutopilotLaws_P.ScheduledGain2_Table, 6U) + rtb_GainTheta;
    break;

   default:
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value;
    break;
  }

  R = std::abs(AutopilotLaws_U.in.data.V_tas_kn);
  rtb_on_ground = 5;
  low_i = 1;
  low_ip1 = 2;
  while (rtb_on_ground > low_ip1) {
    int32_T mid_i;
    mid_i = (low_i + rtb_on_ground) >> 1;
    if (R >= (static_cast<real_T>(mid_i) - 1.0) * 150.0) {
      low_i = mid_i;
      low_ip1 = mid_i + 1;
    } else {
      rtb_on_ground = mid_i;
    }
  }

  rtb_GainTheta = R - (static_cast<real_T>(low_i) - 1.0) * 150.0;
  b_R = std::abs(AutopilotLaws_U.in.data.flight_guidance_phi_limit_deg);
  if ((AutopilotLaws_U.in.input.lateral_mode != 20.0) || (b_R <= 0.0)) {
    b_R = ((b[low_i - 1] * rtb_GainTheta + b[low_i + 3]) * rtb_GainTheta + b[low_i + 7]) * rtb_GainTheta + b[low_i + 11];
  }

  if (AutopilotLaws_DWork.DelayInput1_DSTATE > b_R) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = b_R;
  } else {
    rtb_GainTheta = AutopilotLaws_P.Gain1_Gain_l * b_R;
    if (AutopilotLaws_DWork.DelayInput1_DSTATE < rtb_GainTheta) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_GainTheta;
    }
  }

  distance_m = (AutopilotLaws_DWork.DelayInput1_DSTATE - rtb_GainTheta1) * AutopilotLaws_P.Gain_Gain_lu;
  if (!AutopilotLaws_DWork.pY_not_empty) {
    AutopilotLaws_DWork.pY = AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_i;
    AutopilotLaws_DWork.pY_not_empty = true;
  }

  AutopilotLaws_DWork.pY += std::fmax(std::fmin(static_cast<real_T>(rtb_Compare_jy) - AutopilotLaws_DWork.pY, std::abs
    (AutopilotLaws_P.RateLimiterVariableTs_up_n) * AutopilotLaws_U.in.time.dt), -std::abs
    (AutopilotLaws_P.RateLimiterVariableTs_lo_k) * AutopilotLaws_U.in.time.dt);
  if (AutopilotLaws_DWork.pY > AutopilotLaws_P.Saturation_UpperSat_k) {
    rtb_GainTheta = AutopilotLaws_P.Saturation_UpperSat_k;
  } else if (AutopilotLaws_DWork.pY < AutopilotLaws_P.Saturation_LowerSat_f3) {
    rtb_GainTheta = AutopilotLaws_P.Saturation_LowerSat_f3;
  } else {
    rtb_GainTheta = AutopilotLaws_DWork.pY;
  }

  b_R = (AutopilotLaws_P.Gain_Gain_b * result[2] * rtb_GainTheta + (AutopilotLaws_P.Constant_Value_a - rtb_GainTheta) *
         (AutopilotLaws_P.Gain4_Gain * AutopilotLaws_U.in.data.beta_deg)) + AutopilotLaws_P.Gain5_Gain_o * Phi2;
  if (AutopilotLaws_Y.out.output.ap_on > AutopilotLaws_P.Switch_Threshold_n) {
    switch (static_cast<int32_T>(rtb_error_d)) {
     case 0:
      rtb_Saturation_c = AutopilotLaws_P.beta1_Value;
      break;

     case 1:
      rtb_Saturation_c = AutopilotLaws_P.beta1_Value_h;
      break;

     case 2:
      rtb_Saturation_c = AutopilotLaws_P.beta1_Value_l;
      break;

     case 3:
      rtb_Saturation_c = AutopilotLaws_P.beta1_Value_m;
      break;

     case 4:
      rtb_Saturation_c = AutopilotLaws_P.beta1_Value_d;
      break;

     case 5:
      rtb_Saturation_c = AutopilotLaws_P.beta1_Value_hy;
      break;

     default:
      rtb_Saturation_c = AutopilotLaws_P.Gain3_Gain * b_R;
      break;
    }
  } else {
    rtb_Saturation_c = AutopilotLaws_P.Constant1_Value;
  }

  if (rtb_Delay_j) {
    rtb_GainTheta = AutopilotLaws_P.Gain_Gain_ae * a + AutopilotLaws_P.Gain1_Gain_k * AutopilotLaws_U.in.data.beta_deg;
  } else {
    rtb_GainTheta = AutopilotLaws_P.Constant1_Value_fk;
  }

  AutopilotLaws_LagFilter(rtb_GainTheta, AutopilotLaws_P.LagFilter1_C1, AutopilotLaws_U.in.time.dt, &b_L,
    &AutopilotLaws_DWork.sf_LagFilter_c);
  switch (static_cast<int32_T>(rtb_error_d)) {
   case 0:
    rtb_GainTheta = AutopilotLaws_P.beta_Value;
    break;

   case 1:
    rtb_GainTheta = AutopilotLaws_P.beta_Value_e;
    break;

   case 2:
    rtb_GainTheta = AutopilotLaws_P.beta_Value_b;
    break;

   case 3:
    rtb_GainTheta = AutopilotLaws_P.beta_Value_i;
    break;

   case 4:
    rtb_GainTheta = AutopilotLaws_P.beta_Value_c;
    break;

   case 5:
    if (b_L > AutopilotLaws_P.Saturation_UpperSat_e) {
      rtb_GainTheta = AutopilotLaws_P.Saturation_UpperSat_e;
    } else if (b_L < AutopilotLaws_P.Saturation_LowerSat_f) {
      rtb_GainTheta = AutopilotLaws_P.Saturation_LowerSat_f;
    } else {
      rtb_GainTheta = b_L;
    }
    break;

   default:
    rtb_GainTheta = AutopilotLaws_P.Gain7_Gain * b_R;
    break;
  }

  AutopilotLaws_DWork.icLoad = ((AutopilotLaws_Y.out.output.ap_on == 0.0) || AutopilotLaws_DWork.icLoad);
  if (AutopilotLaws_DWork.icLoad) {
    AutopilotLaws_DWork.Delay_DSTATE_h = rtb_GainTheta1;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE -= AutopilotLaws_DWork.Delay_DSTATE_h;
  AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmin(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt);
  AutopilotLaws_DWork.Delay_DSTATE_h += std::fmax(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Gain1_Gain_kf *
    AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt);
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h, AutopilotLaws_P.LagFilter_C1_l, AutopilotLaws_U.in.time.dt,
    &rtb_Y_k, &AutopilotLaws_DWork.sf_LagFilter_o);
  AutopilotLaws_RateLimiter(AutopilotLaws_Y.out.output.ap_on, AutopilotLaws_P.RateLimiterVariableTs_up_b,
    AutopilotLaws_P.RateLimiterVariableTs_lo_b, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_il, &b_L, &AutopilotLaws_DWork.sf_RateLimiter_d);
  if (b_L > AutopilotLaws_P.Saturation_UpperSat_m) {
    b_R = AutopilotLaws_P.Saturation_UpperSat_m;
  } else if (b_L < AutopilotLaws_P.Saturation_LowerSat_fw) {
    b_R = AutopilotLaws_P.Saturation_LowerSat_fw;
  } else {
    b_R = b_L;
  }

  AutopilotLaws_Y.out.output.Phi_loc_c = rtb_Saturation;
  rtb_Saturation_c *= AutopilotLaws_P.Gain_Gain_m3;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_c) {
    AutopilotLaws_Y.out.output.Nosewheel_c = AutopilotLaws_P.Saturation_UpperSat_c;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_d) {
    AutopilotLaws_Y.out.output.Nosewheel_c = AutopilotLaws_P.Saturation_LowerSat_d;
  } else {
    AutopilotLaws_Y.out.output.Nosewheel_c = rtb_Saturation_c;
  }

  AutopilotLaws_Y.out.output.flight_director.Beta_c_deg = rtb_GainTheta;
  AutopilotLaws_Y.out.output.autopilot.Beta_c_deg = rtb_GainTheta;
  AutopilotLaws_Y.out.output.flight_director.Phi_c_deg = distance_m;
  AutopilotLaws_Y.out.output.autopilot.Phi_c_deg = (AutopilotLaws_P.Constant_Value_ii - b_R) * rtb_GainTheta1 + rtb_Y_k *
    b_R;
  AutopilotLaws_WashoutFilter(AutopilotLaws_Y.out.data.Theta_deg, AutopilotLaws_P.WashoutFilter_C1,
    AutopilotLaws_Y.out.time.dt, &rtb_GainTheta, &AutopilotLaws_DWork.sf_WashoutFilter_fo);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting_b == 1) {
    rtb_GainTheta1 = AutopilotLaws_P.Constant_Value_m;
  } else {
    rtb_GainTheta1 = AutopilotLaws_Y.out.input.vertical_law;
  }

  if (AutopilotLaws_Y.out.input.ALT_soft_mode_active) {
    b_R = (AutopilotLaws_Y.out.input.V_c_kn - AutopilotLaws_Y.out.data.V_ias_kn) * AutopilotLaws_P.Gain1_Gain_b;
    if (b_R > AutopilotLaws_P.Saturation1_UpperSat) {
      b_R = AutopilotLaws_P.Saturation1_UpperSat;
    } else if (b_R < AutopilotLaws_P.Saturation1_LowerSat) {
      b_R = AutopilotLaws_P.Saturation1_LowerSat;
    }
  } else {
    b_R = AutopilotLaws_P.Constant1_Value_h;
  }

  if (rtb_GainTheta1 != AutopilotLaws_P.CompareToConstant5_const_e) {
    AutopilotLaws_B.u = (AutopilotLaws_Y.out.input.H_c_ft + AutopilotLaws_Y.out.data.H_ft) -
      AutopilotLaws_Y.out.data.H_ind_ft;
  }

  AutopilotLaws_LagFilter(AutopilotLaws_B.u - AutopilotLaws_Y.out.data.H_ft, AutopilotLaws_P.LagFilter_C1_a,
    AutopilotLaws_Y.out.time.dt, &b_L, &AutopilotLaws_DWork.sf_LagFilter_g);
  rtb_Saturation_c = AutopilotLaws_P.Gain_Gain_ft * b_L + b_R;
  b_R = AutopilotLaws_P.kntoms_Gain * AutopilotLaws_Y.out.data.V_tas_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_n) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_n;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_d4) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_d4;
  }

  if (b_R > AutopilotLaws_P.Saturation_UpperSat_a) {
    b_R = AutopilotLaws_P.Saturation_UpperSat_a;
  } else if (b_R < AutopilotLaws_P.Saturation_LowerSat_n5) {
    b_R = AutopilotLaws_P.Saturation_LowerSat_n5;
  }

  rtb_Saturation_c = (rtb_Saturation_c - AutopilotLaws_Y.out.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain / b_R;
  if (rtb_Saturation_c > 1.0) {
    rtb_Saturation_c = 1.0;
  } else if (rtb_Saturation_c < -1.0) {
    rtb_Saturation_c = -1.0;
  }

  rtb_error_d = AutopilotLaws_P.Gain_Gain_k * std::asin(rtb_Saturation_c);
  rtb_Compare_jy = (rtb_GainTheta1 == AutopilotLaws_P.CompareToConstant1_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty_p) {
    AutopilotLaws_DWork.wasActive_c = rtb_Compare_jy;
    AutopilotLaws_DWork.wasActive_not_empty_p = true;
  }

  rtb_Saturation = AutopilotLaws_Y.out.input.H_c_ft - AutopilotLaws_Y.out.data.H_ind_ft;
  if (rtb_Saturation < 0.0) {
    b_R = -1.0;
  } else if (rtb_Saturation > 0.0) {
    b_R = 1.0;
  } else {
    b_R = rtb_Saturation;
  }

  b_R = b_R * AutopilotLaws_DWork.dH_offset + rtb_Saturation;
  if ((!AutopilotLaws_DWork.wasActive_c) && rtb_Compare_jy) {
    AutopilotLaws_DWork.k = AutopilotLaws_Y.out.data.H_dot_ft_min / b_R;
    AutopilotLaws_DWork.dH_offset = std::abs(500.0 / std::abs(AutopilotLaws_DWork.k) - 100.0);
    if (b_R < 0.0) {
      Phi2 = -1.0;
    } else if (b_R > 0.0) {
      Phi2 = 1.0;
    } else {
      Phi2 = b_R;
    }

    b_R += Phi2 * AutopilotLaws_DWork.dH_offset;
    AutopilotLaws_DWork.k = AutopilotLaws_Y.out.data.H_dot_ft_min / b_R;
    AutopilotLaws_DWork.maxH_dot = std::abs(AutopilotLaws_Y.out.data.H_dot_ft_min);
  }

  b_R *= AutopilotLaws_DWork.k;
  if (std::abs(b_R) > AutopilotLaws_DWork.maxH_dot) {
    if (b_R < 0.0) {
      b_R = -1.0;
    } else if (b_R > 0.0) {
      b_R = 1.0;
    }

    b_R *= AutopilotLaws_DWork.maxH_dot;
  }

  AutopilotLaws_DWork.wasActive_c = rtb_Compare_jy;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_h * AutopilotLaws_Y.out.data.V_tas_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_d) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_d;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_nr) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_nr;
  }

  rtb_Saturation_c = (b_R - AutopilotLaws_Y.out.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain_c / rtb_Saturation_c;
  if (rtb_Saturation_c > 1.0) {
    rtb_Saturation_c = 1.0;
  } else if (rtb_Saturation_c < -1.0) {
    rtb_Saturation_c = -1.0;
  }

  R = AutopilotLaws_P.Gain_Gain_es * std::asin(rtb_Saturation_c);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_m * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_j) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_j;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_i) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_i;
  }

  b_R = std::atan(AutopilotLaws_P.fpmtoms_Gain * AutopilotLaws_Y.out.data.H_dot_ft_min /
                  AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_e3;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_g * AutopilotLaws_Y.out.data.Theta_deg;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_b * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_ei) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_ei;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_dz) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_dz;
  }

  Phi2 = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_g *
    AutopilotLaws_Y.out.data.H_dot_ft_min / rtb_Saturation_c) * AutopilotLaws_P.Gain_Gain_c1 *
    AutopilotLaws_P.Gain1_Gain_lx;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_c * AutopilotLaws_Y.out.data.Phi_deg;
  a = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  distance_m = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_e * AutopilotLaws_Y.out.data.Psi_magnetic_deg;
  L = AutopilotLaws_P.Gain1_Gain_pf * AutopilotLaws_Y.out.data.Psi_magnetic_track_deg -
    AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain * AutopilotLaws_Y.out.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain * (AutopilotLaws_P.GStoGS_CAS_Gain *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_e, AutopilotLaws_Y.out.time.dt, &b_L,
    &AutopilotLaws_DWork.sf_WashoutFilter);
  AutopilotLaws_LeadLagFilter(b_L - AutopilotLaws_P.g_Gain * (AutopilotLaws_P.Gain1_Gain_lp *
    (AutopilotLaws_P.Gain_Gain_am * (Phi2 * (AutopilotLaws_P.Constant_Value_dy - a) + distance_m * std::sin(L)))),
    AutopilotLaws_P.HighPassFilter_C1, AutopilotLaws_P.HighPassFilter_C2, AutopilotLaws_P.HighPassFilter_C3,
    AutopilotLaws_P.HighPassFilter_C4, AutopilotLaws_Y.out.time.dt, &rtb_Y_k, &AutopilotLaws_DWork.sf_LeadLagFilter);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_b * AutopilotLaws_Y.out.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1, AutopilotLaws_P.LowPassFilter_C2, AutopilotLaws_P.LowPassFilter_C3,
    AutopilotLaws_P.LowPassFilter_C4, AutopilotLaws_Y.out.time.dt, &b_L, &AutopilotLaws_DWork.sf_LeadLagFilter_o);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (rtb_Y_k + b_L) * AutopilotLaws_P.ug_Gain;
  distance_m = AutopilotLaws_P.Gain1_Gain_bf * b_R;
  Phi2 = AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m;
  a = AutopilotLaws_P.Constant3_Value_nq - AutopilotLaws_P.Constant4_Value;
  distance_m = (AutopilotLaws_P.Gain1_Gain_ik * AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m) *
    AutopilotLaws_P.Gain_Gain_aj;
  if (a > AutopilotLaws_P.Switch_Threshold_l) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_g;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain5_Gain * distance_m;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_Y.out.input.V_c_kn, AutopilotLaws_Y.out.data.VLS_kn, &b_L);
  L = (AutopilotLaws_Y.out.data.V_ias_kn - b_L) * AutopilotLaws_P.Gain1_Gain_oz;
  if (L <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
    if (a > AutopilotLaws_P.Switch1_Threshold) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_g;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain6_Gain * distance_m;
    }

    if (L >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = L;
    }
  }

  L = (AutopilotLaws_P.Gain_Gain_b0 * Phi2 - b_R) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_p * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_h) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_h;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_e) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_e;
  }

  b_R = std::atan(AutopilotLaws_P.fpmtoms_Gain_a * AutopilotLaws_Y.out.data.H_dot_ft_min /
                  AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_d4;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_kd * AutopilotLaws_Y.out.data.Theta_deg;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_l * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_i) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_i;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_h) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_h;
  }

  Phi2 = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_c *
    AutopilotLaws_Y.out.data.H_dot_ft_min / rtb_Saturation_c) * AutopilotLaws_P.Gain_Gain_bs *
    AutopilotLaws_P.Gain1_Gain_o4;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_j0 * AutopilotLaws_Y.out.data.Phi_deg;
  a = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  distance_m = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_lxx * AutopilotLaws_Y.out.data.Psi_magnetic_deg;
  rtb_Add3_d = AutopilotLaws_P.Gain1_Gain_bk * AutopilotLaws_Y.out.data.Psi_magnetic_track_deg -
    AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain_g * AutopilotLaws_Y.out.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_h * (AutopilotLaws_P.GStoGS_CAS_Gain_m *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_e4, AutopilotLaws_Y.out.time.dt, &b_L,
    &AutopilotLaws_DWork.sf_WashoutFilter_d);
  AutopilotLaws_LeadLagFilter(b_L - AutopilotLaws_P.g_Gain_h * (AutopilotLaws_P.Gain1_Gain_dv *
    (AutopilotLaws_P.Gain_Gain_id * (Phi2 * (AutopilotLaws_P.Constant_Value_cg - a) + distance_m * std::sin(rtb_Add3_d)))),
    AutopilotLaws_P.HighPassFilter_C1_e, AutopilotLaws_P.HighPassFilter_C2_c, AutopilotLaws_P.HighPassFilter_C3_f,
    AutopilotLaws_P.HighPassFilter_C4_c, AutopilotLaws_Y.out.time.dt, &rtb_Y_k, &AutopilotLaws_DWork.sf_LeadLagFilter_h);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_i * AutopilotLaws_Y.out.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_n, AutopilotLaws_P.LowPassFilter_C2_a, AutopilotLaws_P.LowPassFilter_C3_o,
    AutopilotLaws_P.LowPassFilter_C4_o, AutopilotLaws_Y.out.time.dt, &b_L, &AutopilotLaws_DWork.sf_LeadLagFilter_m);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (rtb_Y_k + b_L) * AutopilotLaws_P.ug_Gain_a;
  distance_m = AutopilotLaws_P.Gain1_Gain_hm * b_R;
  Phi2 = AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m;
  a = AutopilotLaws_P.Constant1_Value_b4 - AutopilotLaws_P.Constant2_Value_c;
  distance_m = (AutopilotLaws_P.Gain1_Gain_mz * AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m) *
    AutopilotLaws_P.Gain_Gain_ie;
  if (a > AutopilotLaws_P.Switch_Threshold_b) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_a;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain5_Gain_l * distance_m;
  }

  b_L = AutopilotLaws_Y.out.data.V_ias_kn - AutopilotLaws_Y.out.data.VMAX_kn;
  rtb_Add3_d = b_L * AutopilotLaws_P.Gain1_Gain_f1;
  if (rtb_Add3_d <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
    if (a > AutopilotLaws_P.Switch1_Threshold_f) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_p;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain6_Gain_j * distance_m;
    }

    if (rtb_Add3_d >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Add3_d;
    }
  }

  b_R = (AutopilotLaws_P.Gain_Gain_kj * Phi2 - b_R) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, R, AutopilotLaws_P.VS_Gain * R, L,
    AutopilotLaws_P.Gain_Gain_m0 * L, b_R, AutopilotLaws_P.Gain_Gain_lr * b_R, AutopilotLaws_P.Constant_Value_ig, &a,
    &Phi2);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_hx * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_nd) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_nd;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_a) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_a;
  }

  b_R = std::atan(AutopilotLaws_P.fpmtoms_Gain_i * AutopilotLaws_Y.out.data.H_dot_ft_min /
                  AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_hm;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_fv * AutopilotLaws_Y.out.data.Theta_deg;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_d * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_g) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_g;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_aw) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_aw;
  }

  R = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_e *
    AutopilotLaws_Y.out.data.H_dot_ft_min / rtb_Saturation_c) * AutopilotLaws_P.Gain_Gain_ho *
    AutopilotLaws_P.Gain1_Gain_i0;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_fm * AutopilotLaws_Y.out.data.Phi_deg;
  L = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  rtb_Add3_d = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_j2 * AutopilotLaws_Y.out.data.Psi_magnetic_deg;
  distance_m = AutopilotLaws_P.Gain1_Gain_hy * AutopilotLaws_Y.out.data.Psi_magnetic_track_deg;
  rtb_Add3_l = distance_m - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain_c * AutopilotLaws_Y.out.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_m * (AutopilotLaws_P.GStoGS_CAS_Gain_o *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_l, AutopilotLaws_Y.out.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_WashoutFilter_j);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_DWork.DelayInput1_DSTATE - AutopilotLaws_P.g_Gain_g *
    (AutopilotLaws_P.Gain1_Gain_be * (AutopilotLaws_P.Gain_Gain_db * (R * (AutopilotLaws_P.Constant_Value_j - L) +
    rtb_Add3_d * std::sin(rtb_Add3_l)))), AutopilotLaws_P.HighPassFilter_C1_l, AutopilotLaws_P.HighPassFilter_C2_co,
    AutopilotLaws_P.HighPassFilter_C3_b, AutopilotLaws_P.HighPassFilter_C4_j, AutopilotLaws_Y.out.time.dt, &distance_m,
    &AutopilotLaws_DWork.sf_LeadLagFilter_l);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_n * AutopilotLaws_Y.out.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_f, AutopilotLaws_P.LowPassFilter_C2_p, AutopilotLaws_P.LowPassFilter_C3_a,
    AutopilotLaws_P.LowPassFilter_C4_g, AutopilotLaws_Y.out.time.dt, &AutopilotLaws_DWork.DelayInput1_DSTATE,
    &AutopilotLaws_DWork.sf_LeadLagFilter_as);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (distance_m + AutopilotLaws_DWork.DelayInput1_DSTATE) *
    AutopilotLaws_P.ug_Gain_l;
  distance_m = AutopilotLaws_P.Gain1_Gain_g1 * b_R;
  R = AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m;
  distance_m = (AutopilotLaws_P.Gain1_Gain_ov * AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m) *
    AutopilotLaws_P.Gain_Gain_a2;
  AutopilotLaws_Voter1(AutopilotLaws_Y.out.data.VLS_kn, AutopilotLaws_Y.out.input.V_c_kn,
                       AutopilotLaws_Y.out.data.VMAX_kn, &L);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_Y.out.data.V_ias_kn - L;
  AutopilotLaws_DWork.DelayInput1_DSTATE *= AutopilotLaws_P.Gain1_Gain_lxw;
  if ((rtb_Saturation > AutopilotLaws_P.CompareToConstant_const_a) && (distance_m <
       AutopilotLaws_P.CompareToConstant1_const_n) && (AutopilotLaws_DWork.DelayInput1_DSTATE <
       AutopilotLaws_P.CompareToConstant2_const_b)) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_c;
  } else {
    if (rtb_Saturation > AutopilotLaws_P.Switch2_Threshold) {
      L = AutopilotLaws_P.Constant1_Value_mf;
    } else {
      L = AutopilotLaws_P.Gain5_Gain_f * distance_m;
    }

    if (AutopilotLaws_DWork.DelayInput1_DSTATE > L) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = L;
    } else {
      if (rtb_Saturation > AutopilotLaws_P.Switch1_Threshold_o) {
        distance_m = std::fmax(AutopilotLaws_P.Constant2_Value, AutopilotLaws_P.Gain1_Gain_lt * distance_m);
      } else {
        distance_m *= AutopilotLaws_P.Gain6_Gain_l;
      }

      if (AutopilotLaws_DWork.DelayInput1_DSTATE < distance_m) {
        AutopilotLaws_DWork.DelayInput1_DSTATE = distance_m;
      }
    }
  }

  R = (AutopilotLaws_P.Gain_Gain_ce * R - b_R) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_a * AutopilotLaws_Y.out.data.V_tas_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_l) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_l;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_hm) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_hm;
  }

  L = AutopilotLaws_Y.out.input.H_dot_c_fpm - AutopilotLaws_Y.out.data.H_dot_ft_min;
  rtb_Saturation_c = L * AutopilotLaws_P.ftmintoms_Gain_l / rtb_Saturation_c;
  if (rtb_Saturation_c > 1.0) {
    rtb_Saturation_c = 1.0;
  } else if (rtb_Saturation_c < -1.0) {
    rtb_Saturation_c = -1.0;
  }

  rtb_Gain_dn = AutopilotLaws_P.Gain_Gain_ey * std::asin(rtb_Saturation_c);
  if (AutopilotLaws_Y.out.input.vertical_mode == 50.0) {
    distance_m = 0.3;
  } else {
    distance_m = 0.1;
  }

  rtb_Y_k = 9.81 / (AutopilotLaws_Y.out.data.V_tas_kn * 0.51444444444444448);
  limit = rtb_Y_k * distance_m * 57.295779513082323;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_o * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_f) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_f;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_c) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_c;
  }

  b_R = std::atan(AutopilotLaws_P.fpmtoms_Gain_o * AutopilotLaws_Y.out.data.H_dot_ft_min /
                  AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_lx;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_jn * AutopilotLaws_Y.out.data.Theta_deg;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_db * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_hb) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_hb;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_k) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_k;
  }

  rtb_Add3_d = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_ey *
    AutopilotLaws_Y.out.data.H_dot_ft_min / rtb_Saturation_c) * AutopilotLaws_P.Gain_Gain_in *
    AutopilotLaws_P.Gain1_Gain_ps;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_hi * AutopilotLaws_Y.out.data.Phi_deg;
  rtb_Add3_l = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  rtb_Cos1_pk = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_da * AutopilotLaws_Y.out.data.Psi_magnetic_deg;
  distance_m = AutopilotLaws_P.Gain1_Gain_hg * AutopilotLaws_Y.out.data.Psi_magnetic_track_deg;
  rtb_Add3_n = distance_m - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain_m * AutopilotLaws_Y.out.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_k * (AutopilotLaws_P.GStoGS_CAS_Gain_k *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_o, AutopilotLaws_Y.out.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_WashoutFilter_fs);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_DWork.DelayInput1_DSTATE - AutopilotLaws_P.g_Gain_m *
    (AutopilotLaws_P.Gain1_Gain_kdq * (AutopilotLaws_P.Gain_Gain_b5 * (rtb_Add3_d * (AutopilotLaws_P.Constant_Value_od -
    rtb_Add3_l) + rtb_Cos1_pk * std::sin(rtb_Add3_n)))), AutopilotLaws_P.HighPassFilter_C1_g,
    AutopilotLaws_P.HighPassFilter_C2_l, AutopilotLaws_P.HighPassFilter_C3_j, AutopilotLaws_P.HighPassFilter_C4_i,
    AutopilotLaws_Y.out.time.dt, &distance_m, &AutopilotLaws_DWork.sf_LeadLagFilter_b);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_c2 * AutopilotLaws_Y.out.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_m, AutopilotLaws_P.LowPassFilter_C2_l, AutopilotLaws_P.LowPassFilter_C3_i,
    AutopilotLaws_P.LowPassFilter_C4_k, AutopilotLaws_Y.out.time.dt, &AutopilotLaws_DWork.DelayInput1_DSTATE,
    &AutopilotLaws_DWork.sf_LeadLagFilter_kq);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (distance_m + AutopilotLaws_DWork.DelayInput1_DSTATE) *
    AutopilotLaws_P.ug_Gain_aa;
  distance_m = AutopilotLaws_P.Gain1_Gain_gf * b_R;
  rtb_Add3_d = AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m;
  rtb_Add3_l = AutopilotLaws_P.Constant3_Value_h1 - AutopilotLaws_P.Constant4_Value_f;
  rtb_Cos1_pk = (AutopilotLaws_P.Gain1_Gain_ovr * AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m) *
    AutopilotLaws_P.Gain_Gain_jy;
  if (rtb_Add3_l > AutopilotLaws_P.Switch_Threshold_o) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_m5;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain5_Gain_h * rtb_Cos1_pk;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_Y.out.input.V_c_kn, AutopilotLaws_Y.out.data.VLS_kn, &distance_m);
  distance_m = (AutopilotLaws_Y.out.data.V_ias_kn - distance_m) * AutopilotLaws_P.Gain1_Gain_dvi;
  if (distance_m <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
    if (rtb_Add3_l > AutopilotLaws_P.Switch1_Threshold_c) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_b;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain6_Gain_a * rtb_Cos1_pk;
    }

    if (distance_m >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = distance_m;
    }
  }

  rtb_Cos1_pk = (AutopilotLaws_P.Gain_Gain_j * rtb_Add3_d - b_R) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_bq * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_ba) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_ba;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_p) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_p;
  }

  b_R = std::atan(AutopilotLaws_P.fpmtoms_Gain_p * AutopilotLaws_Y.out.data.H_dot_ft_min /
                  AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_py;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_hk * AutopilotLaws_Y.out.data.Theta_deg;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_l5 * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_b3) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_b3;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_es) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_es;
  }

  rtb_Add3_d = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_j *
    AutopilotLaws_Y.out.data.H_dot_ft_min / rtb_Saturation_c) * AutopilotLaws_P.Gain_Gain_e5 *
    AutopilotLaws_P.Gain1_Gain_ja;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_er * AutopilotLaws_Y.out.data.Phi_deg;
  rtb_Add3_l = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  rtb_Add3_n = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_fl * AutopilotLaws_Y.out.data.Psi_magnetic_deg;
  distance_m = AutopilotLaws_P.Gain1_Gain_ero * AutopilotLaws_Y.out.data.Psi_magnetic_track_deg;
  rtb_Saturation_c = distance_m - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain_a * AutopilotLaws_Y.out.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_i * (AutopilotLaws_P.GStoGS_CAS_Gain_n *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_p, AutopilotLaws_Y.out.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_WashoutFilter_jh);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_DWork.DelayInput1_DSTATE - AutopilotLaws_P.g_Gain_gr *
    (AutopilotLaws_P.Gain1_Gain_hv * (AutopilotLaws_P.Gain_Gain_mx * (rtb_Add3_d * (AutopilotLaws_P.Constant_Value_ia -
    rtb_Add3_l) + rtb_Add3_n * std::sin(rtb_Saturation_c)))), AutopilotLaws_P.HighPassFilter_C1_n,
    AutopilotLaws_P.HighPassFilter_C2_m, AutopilotLaws_P.HighPassFilter_C3_k, AutopilotLaws_P.HighPassFilter_C4_h,
    AutopilotLaws_Y.out.time.dt, &distance_m, &AutopilotLaws_DWork.sf_LeadLagFilter_c);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_o * AutopilotLaws_Y.out.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_l, AutopilotLaws_P.LowPassFilter_C2_c, AutopilotLaws_P.LowPassFilter_C3_g,
    AutopilotLaws_P.LowPassFilter_C4_d, AutopilotLaws_Y.out.time.dt, &AutopilotLaws_DWork.DelayInput1_DSTATE,
    &AutopilotLaws_DWork.sf_LeadLagFilter_p);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (distance_m + AutopilotLaws_DWork.DelayInput1_DSTATE) *
    AutopilotLaws_P.ug_Gain_f;
  distance_m = AutopilotLaws_P.Gain1_Gain_ot * b_R;
  rtb_Add3_d = AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m;
  rtb_Add3_l = AutopilotLaws_P.Constant1_Value_d - AutopilotLaws_P.Constant2_Value_k;
  distance_m = (AutopilotLaws_P.Gain1_Gain_ou * AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m) *
    AutopilotLaws_P.Gain_Gain_jg;
  if (rtb_Add3_l > AutopilotLaws_P.Switch_Threshold_a) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_mi;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain5_Gain_g * distance_m;
  }

  rtb_Add3_n = b_L * AutopilotLaws_P.Gain1_Gain_gy;
  if (rtb_Add3_n <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
    if (rtb_Add3_l > AutopilotLaws_P.Switch1_Threshold_b) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_o;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain6_Gain_c * distance_m;
    }

    if (rtb_Add3_n >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Add3_n;
    }
  }

  b_R = (AutopilotLaws_P.Gain_Gain_dm * rtb_Add3_d - b_R) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, rtb_Gain_dn, std::fmax(-limit, std::fmin(limit,
    AutopilotLaws_P.VS_Gain_h * rtb_Gain_dn)), rtb_Cos1_pk, AutopilotLaws_P.Gain_Gain_h4 * rtb_Cos1_pk, b_R,
    AutopilotLaws_P.Gain_Gain_eq * b_R, AutopilotLaws_P.Constant_Value_ga, &rtb_Add3_l, &rtb_Add3_d);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_c * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_oz) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_oz;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_ou) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_ou;
  }

  rtb_Cos1_pk = AutopilotLaws_Y.out.input.FPA_c_deg - std::atan(AutopilotLaws_P.fpmtoms_Gain_ps *
    AutopilotLaws_Y.out.data.H_dot_ft_min / AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_g;
  limit = rtb_Y_k * 0.1 * 57.295779513082323;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_cv * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_bb) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_bb;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_a4) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_a4;
  }

  b_R = std::atan(AutopilotLaws_P.fpmtoms_Gain_d * AutopilotLaws_Y.out.data.H_dot_ft_min /
                  AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_hv;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_ej * AutopilotLaws_Y.out.data.Theta_deg;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_k * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_pj) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_pj;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_py) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_py;
  }

  distance_m = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_f *
    AutopilotLaws_Y.out.data.H_dot_ft_min / rtb_Saturation_c) * AutopilotLaws_P.Gain_Gain_bf *
    AutopilotLaws_P.Gain1_Gain_jv;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_gfa * AutopilotLaws_Y.out.data.Phi_deg;
  rtb_Gain_dn = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  rtb_Add3_n = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_kw * AutopilotLaws_Y.out.data.Psi_magnetic_deg;
  rtb_Saturation_c = AutopilotLaws_P.Gain1_Gain_j4 * AutopilotLaws_Y.out.data.Psi_magnetic_track_deg -
    AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain_j * AutopilotLaws_Y.out.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_kb * (AutopilotLaws_P.GStoGS_CAS_Gain_o5 *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_j, AutopilotLaws_Y.out.time.dt, &rtb_Y_k,
    &AutopilotLaws_DWork.sf_WashoutFilter_h);
  AutopilotLaws_LeadLagFilter(rtb_Y_k - AutopilotLaws_P.g_Gain_l * (AutopilotLaws_P.Gain1_Gain_n4 *
    (AutopilotLaws_P.Gain_Gain_bc * (distance_m * (AutopilotLaws_P.Constant_Value_l - rtb_Gain_dn) + rtb_Add3_n * std::
    sin(rtb_Saturation_c)))), AutopilotLaws_P.HighPassFilter_C1_i, AutopilotLaws_P.HighPassFilter_C2_h,
    AutopilotLaws_P.HighPassFilter_C3_m, AutopilotLaws_P.HighPassFilter_C4_n, AutopilotLaws_Y.out.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LeadLagFilter_e);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_k * AutopilotLaws_Y.out.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_l4, AutopilotLaws_P.LowPassFilter_C2_po, AutopilotLaws_P.LowPassFilter_C3_f,
    AutopilotLaws_P.LowPassFilter_C4_dt, AutopilotLaws_Y.out.time.dt, &rtb_Y_k, &AutopilotLaws_DWork.sf_LeadLagFilter_k);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.DelayInput1_DSTATE + rtb_Y_k) *
    AutopilotLaws_P.ug_Gain_n;
  distance_m = AutopilotLaws_P.Gain1_Gain_b1 * b_R;
  rtb_Gain_dn = AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m;
  rtb_Add3_n = AutopilotLaws_P.Constant3_Value_nk - AutopilotLaws_P.Constant4_Value_o;
  distance_m = (AutopilotLaws_P.Gain1_Gain_on * AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m) *
    AutopilotLaws_P.Gain_Gain_hy;
  if (rtb_Add3_n > AutopilotLaws_P.Switch_Threshold_d) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_m;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain5_Gain_b * distance_m;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_Y.out.input.V_c_kn, AutopilotLaws_Y.out.data.VLS_kn, &rtb_Y_k);
  rtb_Y_k = (AutopilotLaws_Y.out.data.V_ias_kn - rtb_Y_k) * AutopilotLaws_P.Gain1_Gain_m1;
  if (rtb_Y_k <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
    if (rtb_Add3_n > AutopilotLaws_P.Switch1_Threshold_d) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_p0;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain6_Gain_n * distance_m;
    }

    if (rtb_Y_k >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Y_k;
    }
  }

  rtb_Sum2_p = (AutopilotLaws_P.Gain_Gain_d0 * rtb_Gain_dn - b_R) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_hi * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_cv) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_cv;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_hd) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_hd;
  }

  b_R = std::atan(AutopilotLaws_P.fpmtoms_Gain_o2 * AutopilotLaws_Y.out.data.H_dot_ft_min /
                  AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_pp;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_iw * AutopilotLaws_Y.out.data.Theta_deg;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_i * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_nu) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_nu;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_ae) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_ae;
  }

  distance_m = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_h *
    AutopilotLaws_Y.out.data.H_dot_ft_min / rtb_Saturation_c) * AutopilotLaws_P.Gain_Gain_ej *
    AutopilotLaws_P.Gain1_Gain_lw;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_ky * AutopilotLaws_Y.out.data.Phi_deg;
  rtb_Gain_dn = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  rtb_Add3_n = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_nrn * AutopilotLaws_Y.out.data.Psi_magnetic_deg;
  rtb_Saturation_c = AutopilotLaws_P.Gain1_Gain_ip * AutopilotLaws_Y.out.data.Psi_magnetic_track_deg -
    AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain_l * AutopilotLaws_Y.out.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_ip * (AutopilotLaws_P.GStoGS_CAS_Gain_e *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_c, AutopilotLaws_Y.out.time.dt, &rtb_Y_k,
    &AutopilotLaws_DWork.sf_WashoutFilter_g5);
  AutopilotLaws_LeadLagFilter(rtb_Y_k - AutopilotLaws_P.g_Gain_hq * (AutopilotLaws_P.Gain1_Gain_mx *
    (AutopilotLaws_P.Gain_Gain_d3 * (distance_m * (AutopilotLaws_P.Constant_Value_f - rtb_Gain_dn) + rtb_Add3_n * std::
    sin(rtb_Saturation_c)))), AutopilotLaws_P.HighPassFilter_C1_d, AutopilotLaws_P.HighPassFilter_C2_i,
    AutopilotLaws_P.HighPassFilter_C3_d, AutopilotLaws_P.HighPassFilter_C4_nr, AutopilotLaws_Y.out.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LeadLagFilter_j);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_mh * AutopilotLaws_Y.out.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_e, AutopilotLaws_P.LowPassFilter_C2_i, AutopilotLaws_P.LowPassFilter_C3_o5,
    AutopilotLaws_P.LowPassFilter_C4_f, AutopilotLaws_Y.out.time.dt, &rtb_Y_k, &AutopilotLaws_DWork.sf_LeadLagFilter_a);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.DelayInput1_DSTATE + rtb_Y_k) *
    AutopilotLaws_P.ug_Gain_e;
  distance_m = AutopilotLaws_P.Gain1_Gain_be1 * b_R;
  rtb_Y_k = AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m;
  rtb_Gain_dn = AutopilotLaws_P.Constant1_Value_o - AutopilotLaws_P.Constant2_Value_hd;
  rtb_Add3_n = (AutopilotLaws_P.Gain1_Gain_nj * AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m) *
    AutopilotLaws_P.Gain_Gain_aq;
  if (rtb_Gain_dn > AutopilotLaws_P.Switch_Threshold_g) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_f;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain5_Gain_a * rtb_Add3_n;
  }

  distance_m = AutopilotLaws_P.Gain1_Gain_fle * b_L;
  if (distance_m <= AutopilotLaws_DWork.DelayInput1_DSTATE) {
    if (rtb_Gain_dn > AutopilotLaws_P.Switch1_Threshold_h) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_i;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain6_Gain_g * rtb_Add3_n;
    }

    if (distance_m >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = distance_m;
    }
  }

  b_R = (AutopilotLaws_P.Gain_Gain_gx * rtb_Y_k - b_R) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, rtb_Cos1_pk, std::fmax(-limit, std::fmin(limit,
    AutopilotLaws_P.Gain_Gain_c3 * rtb_Cos1_pk)), rtb_Sum2_p, AutopilotLaws_P.Gain_Gain_fnw * rtb_Sum2_p, b_R,
    AutopilotLaws_P.Gain_Gain_ko * b_R, AutopilotLaws_P.Constant_Value_fo, &rtb_Add3_n, &rtb_Gain_dn);
  limit = AutopilotLaws_P.Gain2_Gain_m * AutopilotLaws_Y.out.data.H_dot_ft_min *
    AutopilotLaws_P.DiscreteDerivativeVariableTs1_Gain;
  b_R = limit - AutopilotLaws_DWork.Delay_DSTATE_hi;
  AutopilotLaws_LagFilter(b_R / AutopilotLaws_Y.out.time.dt, AutopilotLaws_P.LagFilter2_C1_k,
    AutopilotLaws_Y.out.time.dt, &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LagFilter_b);
  AutopilotLaws_WashoutFilter(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.WashoutFilter1_C1,
    AutopilotLaws_Y.out.time.dt, &b_R, &AutopilotLaws_DWork.sf_WashoutFilter_n);
  rtb_Compare_jy = ((AutopilotLaws_Y.out.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK_const) ||
                    (AutopilotLaws_Y.out.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK2_const));
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain4_Gain_g * b_R, rtb_Compare_jy,
    &AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_LagFilter(AutopilotLaws_Y.out.data.nav_gs_error_deg, AutopilotLaws_P.LagFilter1_C1_p,
    AutopilotLaws_Y.out.time.dt, &rtb_Y_k, &AutopilotLaws_DWork.sf_LagFilter_cu);
  rtb_Cos1_pk = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain_o * rtb_Y_k;
  AutopilotLaws_LagFilter(rtb_Y_k + AutopilotLaws_P.Gain3_Gain_n * ((rtb_Cos1_pk - AutopilotLaws_DWork.Delay_DSTATE_n) /
    AutopilotLaws_Y.out.time.dt), AutopilotLaws_P.LagFilter_C1_m, AutopilotLaws_Y.out.time.dt, &distance_m,
    &AutopilotLaws_DWork.sf_LagFilter_j);
  b_R = look1_binlxpw(AutopilotLaws_Y.out.data.H_radio_ft, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_ec,
                      AutopilotLaws_P.ScheduledGain_Table_l, 5U);
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain3_Gain_c * (AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m
    * b_R), (AutopilotLaws_Y.out.data.H_radio_ft > AutopilotLaws_P.CompareToConstant_const_k) &&
    AutopilotLaws_Y.out.data.nav_gs_valid, &rtb_Saturation_c);
  AutopilotLaws_storevalue(rtb_GainTheta1 == AutopilotLaws_P.CompareToConstant6_const,
    AutopilotLaws_Y.out.data.nav_gs_deg, &b_R, &AutopilotLaws_DWork.sf_storevalue_g);
  if (b_R > AutopilotLaws_P.Saturation_UpperSat_e0) {
    b_R = AutopilotLaws_P.Saturation_UpperSat_e0;
  } else if (b_R < AutopilotLaws_P.Saturation_LowerSat_ph) {
    b_R = AutopilotLaws_P.Saturation_LowerSat_ph;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_g4 * AutopilotLaws_Y.out.data.H_dot_ft_min;
  distance_m = AutopilotLaws_P.kntoms_Gain_k4 * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (distance_m > AutopilotLaws_P.Saturation_UpperSat_eb) {
    distance_m = AutopilotLaws_P.Saturation_UpperSat_eb;
  } else if (distance_m < AutopilotLaws_P.Saturation_LowerSat_gk) {
    distance_m = AutopilotLaws_P.Saturation_LowerSat_gk;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / distance_m) *
    AutopilotLaws_P.Gain_Gain_ow;
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain2_Gain_l * (b_R - AutopilotLaws_DWork.DelayInput1_DSTATE),
    rtb_Compare_jy, &distance_m);
  AutopilotLaws_Voter1(rtb_Saturation_c + distance_m, AutopilotLaws_P.Gain1_Gain_d4 * ((b_R + AutopilotLaws_P.Bias_Bias)
    - AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.Gain_Gain_eyl * ((b_R + AutopilotLaws_P.Bias1_Bias) -
    AutopilotLaws_DWork.DelayInput1_DSTATE), &rtb_Sum2_p);
  b_R = AutopilotLaws_Y.out.data.Theta_deg - AutopilotLaws_P.Constant2_Value_f;
  rtb_Gain4_m = AutopilotLaws_P.Gain4_Gain_o * b_R;
  rtb_Gain5_n = AutopilotLaws_P.Gain5_Gain_c * AutopilotLaws_Y.out.data.bz_m_s2;
  AutopilotLaws_WashoutFilter(AutopilotLaws_Y.out.data.bx_m_s2, AutopilotLaws_P.WashoutFilter_C1_m,
    AutopilotLaws_Y.out.time.dt, &b_L, &AutopilotLaws_DWork.sf_WashoutFilter_g);
  AutopilotLaws_WashoutFilter(AutopilotLaws_Y.out.data.H_ind_ft, AutopilotLaws_P.WashoutFilter_C1_ej,
    AutopilotLaws_Y.out.time.dt, &b_R, &AutopilotLaws_DWork.sf_WashoutFilter_b);
  if (AutopilotLaws_Y.out.data.H_radio_ft > AutopilotLaws_P.Saturation_UpperSat_e0a) {
    distance_m = AutopilotLaws_P.Saturation_UpperSat_e0a;
  } else if (AutopilotLaws_Y.out.data.H_radio_ft < AutopilotLaws_P.Saturation_LowerSat_m) {
    distance_m = AutopilotLaws_P.Saturation_LowerSat_m;
  } else {
    distance_m = AutopilotLaws_Y.out.data.H_radio_ft;
  }

  AutopilotLaws_LagFilter(distance_m, AutopilotLaws_P.LagFilter_C1_p, AutopilotLaws_Y.out.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LagFilter_ov);
  rtb_Y_k = (b_R + AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.DiscreteDerivativeVariableTs2_Gain;
  b_R = (rtb_Y_k - AutopilotLaws_DWork.Delay_DSTATE_p) / AutopilotLaws_Y.out.time.dt;
  AutopilotLaws_LagFilter(AutopilotLaws_P.Gain2_Gain_f * b_R, AutopilotLaws_P.LagFilter3_C1, AutopilotLaws_Y.out.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LagFilter_f);
  AutopilotLaws_WashoutFilter(AutopilotLaws_Y.out.data.H_dot_ft_min, AutopilotLaws_P.WashoutFilter1_C1_g,
    AutopilotLaws_Y.out.time.dt, &b_R, &AutopilotLaws_DWork.sf_WashoutFilter_f);
  b_R += AutopilotLaws_DWork.DelayInput1_DSTATE;
  rtb_Compare_jy = (rtb_GainTheta1 == AutopilotLaws_P.CompareToConstant7_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty) {
    AutopilotLaws_DWork.wasActive = rtb_Compare_jy;
    AutopilotLaws_DWork.wasActive_not_empty = true;
  }

  if ((!AutopilotLaws_DWork.wasActive) && rtb_Compare_jy) {
    distance_m = std::abs(b_R) / 60.0;
    AutopilotLaws_DWork.Tau = AutopilotLaws_Y.out.data.H_radio_ft / (distance_m - 1.6666666666666667);
    AutopilotLaws_DWork.H_bias = AutopilotLaws_DWork.Tau * distance_m - AutopilotLaws_Y.out.data.H_radio_ft;
  }

  if (rtb_Compare_jy) {
    distance_m = -1.0 / AutopilotLaws_DWork.Tau * (AutopilotLaws_Y.out.data.H_radio_ft + AutopilotLaws_DWork.H_bias) *
      60.0;
  } else {
    distance_m = b_R;
  }

  AutopilotLaws_DWork.wasActive = rtb_Compare_jy;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_av * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_ew) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_ew;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_an) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_an;
  }

  rtb_Saturation_c = (distance_m - b_R) * AutopilotLaws_P.ftmintoms_Gain_j / rtb_Saturation_c;
  if (rtb_Saturation_c > 1.0) {
    rtb_Saturation_c = 1.0;
  } else if (rtb_Saturation_c < -1.0) {
    rtb_Saturation_c = -1.0;
  }

  rtb_Gain_ij = AutopilotLaws_P.Gain_Gain_by * std::asin(rtb_Saturation_c);
  rtb_Sum_ae = AutopilotLaws_P.Constant1_Value_o0 - AutopilotLaws_Y.out.data.Theta_deg;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_iv * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_je) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_je;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_hf) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_hf;
  }

  b_R = std::atan(AutopilotLaws_P.fpmtoms_Gain_n * AutopilotLaws_Y.out.data.H_dot_ft_min /
                  AutopilotLaws_DWork.DelayInput1_DSTATE) * AutopilotLaws_P.Gain_Gain_nf;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_iv * AutopilotLaws_Y.out.data.Theta_deg;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_ka * AutopilotLaws_Y.out.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_dh) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_dh;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_m2) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_m2;
  }

  rtb_Saturation_c = AutopilotLaws_DWork.DelayInput1_DSTATE - std::atan(AutopilotLaws_P.fpmtoms_Gain_au *
    AutopilotLaws_Y.out.data.H_dot_ft_min / rtb_Saturation_c) * AutopilotLaws_P.Gain_Gain_h3 *
    AutopilotLaws_P.Gain1_Gain_it;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_ij * AutopilotLaws_Y.out.data.Phi_deg;
  rtb_Cos_k = std::cos(AutopilotLaws_DWork.DelayInput1_DSTATE);
  rtb_Cos1_k = std::sin(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_gk * AutopilotLaws_Y.out.data.Psi_magnetic_deg;
  distance_m = AutopilotLaws_P.Gain1_Gain_ef * AutopilotLaws_Y.out.data.Psi_magnetic_track_deg;
  rtb_Add3_fm = distance_m - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.ktstomps_Gain_jr * AutopilotLaws_Y.out.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_ks * (AutopilotLaws_P.GStoGS_CAS_Gain_n2 *
    AutopilotLaws_DWork.DelayInput1_DSTATE), AutopilotLaws_P.WashoutFilter_C1_d, AutopilotLaws_Y.out.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_WashoutFilter_l);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_DWork.DelayInput1_DSTATE - AutopilotLaws_P.g_Gain_l0 *
    (AutopilotLaws_P.Gain1_Gain_et * (AutopilotLaws_P.Gain_Gain_an * (rtb_Saturation_c *
    (AutopilotLaws_P.Constant_Value_f3 - rtb_Cos_k) + rtb_Cos1_k * std::sin(rtb_Add3_fm)))),
    AutopilotLaws_P.HighPassFilter_C1_i0, AutopilotLaws_P.HighPassFilter_C2_j, AutopilotLaws_P.HighPassFilter_C3_i,
    AutopilotLaws_P.HighPassFilter_C4_nm, AutopilotLaws_Y.out.time.dt, &distance_m,
    &AutopilotLaws_DWork.sf_LeadLagFilter_oi);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_il * AutopilotLaws_Y.out.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_g, AutopilotLaws_P.LowPassFilter_C2_o, AutopilotLaws_P.LowPassFilter_C3_l,
    AutopilotLaws_P.LowPassFilter_C4_p, AutopilotLaws_Y.out.time.dt, &AutopilotLaws_DWork.DelayInput1_DSTATE,
    &AutopilotLaws_DWork.sf_LeadLagFilter_j0);
  AutopilotLaws_DWork.DelayInput1_DSTATE = (distance_m + AutopilotLaws_DWork.DelayInput1_DSTATE) *
    AutopilotLaws_P.ug_Gain_c;
  distance_m = AutopilotLaws_P.Gain1_Gain_ejc * b_R;
  rtb_Saturation_c = AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m;
  rtb_Cos_k = AutopilotLaws_P.Constant2_Value_kz - AutopilotLaws_Y.out.data.H_ind_ft;
  distance_m = (AutopilotLaws_P.Gain1_Gain_h3 * AutopilotLaws_DWork.DelayInput1_DSTATE + distance_m) *
    AutopilotLaws_P.Gain_Gain_ox;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_Y.out.data.V_ias_kn - AutopilotLaws_Y.out.input.V_c_kn;
  AutopilotLaws_DWork.DelayInput1_DSTATE *= AutopilotLaws_P.Gain1_Gain_fo;
  if ((rtb_Cos_k > AutopilotLaws_P.CompareToConstant_const_h) && (distance_m <
       AutopilotLaws_P.CompareToConstant1_const_g) && (AutopilotLaws_DWork.DelayInput1_DSTATE <
       AutopilotLaws_P.CompareToConstant2_const_m)) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_gj;
  } else {
    if (rtb_Cos_k > AutopilotLaws_P.Switch2_Threshold_b) {
      rtb_Cos1_k = AutopilotLaws_P.Constant1_Value_mq;
    } else {
      rtb_Cos1_k = AutopilotLaws_P.Gain5_Gain_k * distance_m;
    }

    if (AutopilotLaws_DWork.DelayInput1_DSTATE > rtb_Cos1_k) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Cos1_k;
    } else {
      if (rtb_Cos_k > AutopilotLaws_P.Switch1_Threshold_n) {
        distance_m = std::fmax(AutopilotLaws_P.Constant2_Value_i, AutopilotLaws_P.Gain1_Gain_n * distance_m);
      } else {
        distance_m *= AutopilotLaws_P.Gain6_Gain_o;
      }

      if (AutopilotLaws_DWork.DelayInput1_DSTATE < distance_m) {
        AutopilotLaws_DWork.DelayInput1_DSTATE = distance_m;
      }
    }
  }

  distance_m = (AutopilotLaws_P.Gain_Gain_p2 * rtb_Saturation_c - b_R) + AutopilotLaws_DWork.DelayInput1_DSTATE;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_iw * AutopilotLaws_Y.out.data.V_tas_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_jt) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_jt;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_ih) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_ih;
  }

  rtb_Saturation_c = (AutopilotLaws_P.Constant_Value_iaf - AutopilotLaws_Y.out.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_lv / rtb_Saturation_c;
  if (rtb_Saturation_c > 1.0) {
    rtb_Saturation_c = 1.0;
  } else if (rtb_Saturation_c < -1.0) {
    rtb_Saturation_c = -1.0;
  }

  rtb_Saturation_c = AutopilotLaws_P.Gain_Gain_o1 * std::asin(rtb_Saturation_c);
  AutopilotLaws_Voter1(rtb_Sum_ae, distance_m, rtb_Saturation_c, &b_R);
  AutopilotLaws_DWork.DelayInput1_DSTATE = L;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_P.Gain_Gain_pe * AutopilotLaws_DWork.DelayInput1_DSTATE +
    rtb_Saturation) * AutopilotLaws_P.Gain1_Gain_f2;
  switch (static_cast<int32_T>(rtb_GainTheta1)) {
   case 0:
    a = AutopilotLaws_P.Constant_Value_d;
    break;

   case 1:
    a = rtb_error_d;
    break;

   case 2:
    break;

   case 3:
    a = R;
    break;

   case 4:
    a = rtb_Add3_l;
    break;

   case 5:
    a = rtb_Add3_n;
    break;

   case 6:
    a = AutopilotLaws_P.Gain1_Gain_d * rtb_Sum2_p;
    break;

   case 7:
    if (AutopilotLaws_Y.out.data.on_ground > AutopilotLaws_P.Switch1_Threshold_j) {
      a = AutopilotLaws_P.Gain2_Gain_h * rtb_Gain4_m;
    } else {
      a = (AutopilotLaws_P.Gain1_Gain_ix * b_L + rtb_Gain5_n) + rtb_Gain_ij;
    }
    break;

   case 8:
    a = b_R;
    break;

   default:
    a = AutopilotLaws_DWork.DelayInput1_DSTATE;
    break;
  }

  if (a > AutopilotLaws_P.Constant1_Value_i) {
    b_R = AutopilotLaws_P.Constant1_Value_i;
  } else {
    b_R = AutopilotLaws_P.Gain1_Gain_nu * AutopilotLaws_P.Constant1_Value_i;
    if (a >= b_R) {
      b_R = a;
    }
  }

  b_R -= rtb_GainTheta;
  AutopilotLaws_DWork.icLoad_f = ((AutopilotLaws_Y.out.output.ap_on == 0.0) || AutopilotLaws_DWork.icLoad_f);
  if (AutopilotLaws_DWork.icLoad_f) {
    AutopilotLaws_DWork.Delay_DSTATE_h2 = AutopilotLaws_Y.out.data.Theta_deg;
  }

  AutopilotLaws_Voter1(rtb_Sum_ae, AutopilotLaws_P.Gain_Gain_jx * distance_m, AutopilotLaws_P.VS_Gain_nx *
                       rtb_Saturation_c, &rtb_GainTheta);
  switch (static_cast<int32_T>(rtb_GainTheta1)) {
   case 0:
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_d;
    break;

   case 1:
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.VS_Gain_n * rtb_error_d;
    break;

   case 2:
    AutopilotLaws_DWork.DelayInput1_DSTATE = Phi2;
    break;

   case 3:
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_f * R;
    break;

   case 4:
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Add3_d;
    break;

   case 5:
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Gain_dn;
    break;

   case 6:
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Sum2_p;
    break;

   case 7:
    if (AutopilotLaws_Y.out.data.on_ground > AutopilotLaws_P.Switch_Threshold) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Gain4_m;
    } else {
      AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_P.Gain3_Gain_l * b_L + rtb_Gain5_n) +
        AutopilotLaws_P.VS_Gain_e * rtb_Gain_ij;
    }
    break;

   case 8:
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_GainTheta;
    break;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_Y.out.data.Theta_deg;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Constant1_Value_i) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_i;
  } else {
    rtb_GainTheta = AutopilotLaws_P.Gain1_Gain_m * AutopilotLaws_P.Constant1_Value_i;
    if (AutopilotLaws_DWork.DelayInput1_DSTATE < rtb_GainTheta) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_GainTheta;
    }
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE -= AutopilotLaws_DWork.Delay_DSTATE_h2;
  AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmin(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_Y.out.time.dt);
  distance_m = AutopilotLaws_P.Gain1_Gain_i0l * AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_Y.out.time.dt;
  AutopilotLaws_DWork.Delay_DSTATE_h2 += std::fmax(AutopilotLaws_DWork.DelayInput1_DSTATE, distance_m);
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h2, AutopilotLaws_P.LagFilter_C1_i,
    AutopilotLaws_Y.out.time.dt, &distance_m, &AutopilotLaws_DWork.sf_LagFilter_gn);
  AutopilotLaws_RateLimiter(AutopilotLaws_Y.out.output.ap_on, AutopilotLaws_P.RateLimiterVariableTs_up_i,
    AutopilotLaws_P.RateLimiterVariableTs_lo_o, AutopilotLaws_Y.out.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_p, &AutopilotLaws_DWork.DelayInput1_DSTATE,
    &AutopilotLaws_DWork.sf_RateLimiter_eb);
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_ix) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_ix;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_eq) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_eq;
  }

  rtb_GainTheta = distance_m * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_i4 - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE *= AutopilotLaws_Y.out.data.Theta_deg;
  AutopilotLaws_DWork.DelayInput1_DSTATE += rtb_GainTheta;
  AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = b_R;
  AutopilotLaws_Y.out.output.autopilot.Theta_c_deg = AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.altimeter_setting_left_mbar;
  AutopilotLaws_DWork.DelayInput1_DSTATE_g = AutopilotLaws_U.in.data.altimeter_setting_right_mbar;
  for (rtb_on_ground = 0; rtb_on_ground < 99; rtb_on_ground++) {
    AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground + 1];
    AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground + 1];
  }

  AutopilotLaws_DWork.Delay_DSTATE_l[99] = rtb_valid;
  AutopilotLaws_DWork.Delay_DSTATE_h5[99] = rtb_valid_d;
  AutopilotLaws_DWork.Delay_DSTATE_e = rtb_dme;
  AutopilotLaws_DWork.icLoad = false;
  AutopilotLaws_DWork.Delay_DSTATE_hi = limit;
  AutopilotLaws_DWork.Delay_DSTATE_n = rtb_Cos1_pk;
  AutopilotLaws_DWork.Delay_DSTATE_p = rtb_Y_k;
  AutopilotLaws_DWork.icLoad_f = false;
}

void AutopilotLawsModelClass::initialize()
{
  {
    real_T rtb_out_f;
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.DetectChange_vinit;
    AutopilotLaws_DWork.DelayInput1_DSTATE_g = AutopilotLaws_P.DetectChange1_vinit;
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
    for (int32_T i{0}; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[i] = AutopilotLaws_P.Delay_InitialCondition;
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }

    AutopilotLaws_DWork.Delay_DSTATE_e = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition;
    AutopilotLaws_DWork.icLoad = true;
    AutopilotLaws_DWork.Delay_DSTATE_hi = AutopilotLaws_P.DiscreteDerivativeVariableTs1_InitialCondition;
    AutopilotLaws_DWork.Delay_DSTATE_n = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition_c;
    AutopilotLaws_DWork.Delay_DSTATE_p = AutopilotLaws_P.DiscreteDerivativeVariableTs2_InitialCondition;
    AutopilotLaws_DWork.icLoad_f = true;
    AutopilotLaws_Chart_g_Init(&rtb_out_f);
    AutopilotLaws_Chart_g_Init(&rtb_out_f);
    AutopilotLaws_Chart_Init(&rtb_out_f);
    AutopilotLaws_Chart_Init(&rtb_out_f);
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
