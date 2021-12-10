#include "AutopilotLaws.h"
#include "AutopilotLaws_private.h"
#include "look1_binlxpw.h"
#include "mod_lHmooAo5.h"
#include "rt_modd.h"

const uint8_T AutopilotLaws_IN_any = 1U;
const uint8_T AutopilotLaws_IN_left = 2U;
const uint8_T AutopilotLaws_IN_right = 3U;
const uint8_T AutopilotLaws_IN_any_i = 1U;
const uint8_T AutopilotLaws_IN_left_d = 2U;
const uint8_T AutopilotLaws_IN_right_f = 3U;
const uint8_T AutopilotLaws_IN_InAir = 1U;
const uint8_T AutopilotLaws_IN_OnGround = 2U;
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
  real_T u0;
  real_T u1;
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  u0 = rtu_u - localDW->pY;
  u1 = std::abs(rtu_up) * rtu_Ts;
  if (u0 < u1) {
    u1 = u0;
  }

  u0 = -std::abs(rtu_lo) * rtu_Ts;
  if (u1 > u0) {
    u0 = u1;
  }

  localDW->pY += u0;
  *rty_Y = localDW->pY;
}

void AutopilotLawsModelClass::AutopilotLaws_Chart_Init(real_T *rty_out)
{
  *rty_out = 0.0;
}

void AutopilotLawsModelClass::AutopilotLaws_Chart(real_T rtu_right, real_T rtu_left, boolean_T rtu_use_short_path,
  real_T *rty_out, rtDW_Chart_AutopilotLaws_T *localDW)
{
  real_T tmp;
  real_T tmp_0;
  boolean_T tmp_1;
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
      break;

     case AutopilotLaws_IN_left:
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
      break;

     default:
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
  real_T tmp;
  real_T tmp_0;
  if (localDW->is_active_c15_AutopilotLaws == 0U) {
    localDW->is_active_c15_AutopilotLaws = 1U;
    localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_any_i;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c15_AutopilotLaws) {
     case AutopilotLaws_IN_any_i:
      tmp = std::abs(rtu_right);
      tmp_0 = std::abs(rtu_left);
      if ((rtu_use_short_path == 0.0) && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
        localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_right_f;
        *rty_out = rtu_right;
      } else if ((rtu_use_short_path == 0.0) && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
        localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_left_d;
        *rty_out = rtu_left;
      } else if (tmp_0 < tmp) {
        *rty_out = rtu_left;
      } else {
        *rty_out = rtu_right;
      }
      break;

     case AutopilotLaws_IN_left_d:
      tmp = std::abs(rtu_left);
      tmp_0 = std::abs(rtu_right);
      if ((rtu_use_short_path != 0.0) || (tmp_0 < 10.0) || (tmp < 10.0)) {
        localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_any_i;
        if (tmp < tmp_0) {
          *rty_out = rtu_left;
        } else {
          *rty_out = rtu_right;
        }
      } else {
        *rty_out = rtu_left;
      }
      break;

     default:
      tmp = std::abs(rtu_left);
      tmp_0 = std::abs(rtu_right);
      if ((rtu_use_short_path != 0.0) || (tmp_0 < 10.0) || (tmp < 10.0)) {
        localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_any_i;
        if (tmp < tmp_0) {
          *rty_out = rtu_left;
        } else {
          *rty_out = rtu_right;
        }
      } else {
        *rty_out = rtu_right;
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
    if (rtu_VS_FD < rtu_VLS_FD) {
      *rty_FD = rtu_VS_FD;
    } else {
      *rty_FD = rtu_VLS_FD;
    }

    if (rtu_VS_AP < rtu_VLS_AP) {
      *rty_AP = rtu_VS_AP;
    } else {
      *rty_AP = rtu_VLS_AP;
    }
  } else if (rtu_in->data.V_ias_kn > rtu_in->data.VMAX_kn - rtu_margin) {
    if (rtu_VS_FD > rtu_VMAX_FD) {
      *rty_FD = rtu_VS_FD;
    } else {
      *rty_FD = rtu_VMAX_FD;
    }

    if (rtu_VS_AP > rtu_VMAX_AP) {
      *rty_AP = rtu_VS_AP;
    } else {
      *rty_AP = rtu_VMAX_AP;
    }
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
  real_T x[3];
  int32_T rtu_u1_0;
  x[0] = rtu_u1;
  x[1] = rtu_u2;
  x[2] = rtu_u3;
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

  *rty_Y = x[rtu_u1_0];
}

void AutopilotLawsModelClass::step()
{
  real_T result_tmp[9];
  real_T result[3];
  real_T result_0[3];
  real_T L;
  real_T Phi2;
  real_T R;
  real_T a;
  real_T b_L;
  real_T b_R;
  real_T external_limit;
  real_T limit;
  real_T rtb_Add3_dx;
  real_T rtb_Add3_gy;
  real_T rtb_Cos1_j;
  real_T rtb_Cos1_kb;
  real_T rtb_Cos1_pk;
  real_T rtb_Gain1_fy;
  real_T rtb_Gain1_na;
  real_T rtb_Gain4_m;
  real_T rtb_Gain5_n;
  real_T rtb_GainTheta;
  real_T rtb_GainTheta1;
  real_T rtb_Gain_aa;
  real_T rtb_Gain_gh;
  real_T rtb_Gain_iq;
  real_T rtb_Saturation;
  real_T rtb_Saturation1;
  real_T rtb_Saturation_c;
  real_T rtb_Sum_ae;
  real_T rtb_Y_j5;
  real_T rtb_Y_nj;
  real_T rtb_Y_o;
  real_T rtb_dme;
  int32_T high_i;
  int32_T i;
  int32_T low_ip1;
  int32_T mid_i;
  int32_T rtb_on_ground;
  boolean_T rtb_Compare_l;
  boolean_T rtb_Compare_o1;
  boolean_T rtb_Delay_j;
  boolean_T rtb_valid;
  boolean_T rtb_valid_o;
  static const real_T b[16] = { -2.469135802469121E-8, -2.469135802469121E-8, 1.3086419753086414E-6,
    1.3086419753086427E-6, -0.00032222222222222233, -0.00033333333333333332, -0.00034444444444444442,
    0.00024444444444444448, 0.1488888888888889, 0.050555555555555548, -0.0511111111111111, -0.066111111111111134, 15.0,
    30.0, 30.0, 19.0 };

  boolean_T guard1 = false;
  rtb_Compare_o1 = ((AutopilotLaws_U.in.input.enabled_AP1 != 0.0) || (AutopilotLaws_U.in.input.enabled_AP2 != 0.0));
  rtb_GainTheta = AutopilotLaws_P.GainTheta_Gain * AutopilotLaws_U.in.data.Theta_deg;
  rtb_GainTheta1 = AutopilotLaws_P.GainTheta1_Gain * AutopilotLaws_U.in.data.Phi_deg;
  rtb_dme = 0.017453292519943295 * rtb_GainTheta;
  b_R = 0.017453292519943295 * rtb_GainTheta1;
  rtb_Saturation1 = std::tan(rtb_dme);
  external_limit = std::sin(b_R);
  b_R = std::cos(b_R);
  result_tmp[0] = 1.0;
  result_tmp[3] = external_limit * rtb_Saturation1;
  result_tmp[6] = b_R * rtb_Saturation1;
  result_tmp[1] = 0.0;
  result_tmp[4] = b_R;
  result_tmp[7] = -external_limit;
  result_tmp[2] = 0.0;
  Phi2 = std::cos(rtb_dme);
  b_L = 1.0 / Phi2;
  result_tmp[5] = b_L * external_limit;
  result_tmp[8] = b_L * b_R;
  a = AutopilotLaws_P.Gain_Gain_de * AutopilotLaws_U.in.data.p_rad_s * AutopilotLaws_P.Gainpk_Gain;
  rtb_Saturation = AutopilotLaws_P.Gain_Gain_d * AutopilotLaws_U.in.data.q_rad_s * AutopilotLaws_P.Gainqk_Gain;
  rtb_Saturation1 = AutopilotLaws_P.Gain_Gain_m * AutopilotLaws_U.in.data.r_rad_s;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result[rtb_on_ground] = result_tmp[rtb_on_ground + 6] * rtb_Saturation1 + (result_tmp[rtb_on_ground + 3] *
      rtb_Saturation + result_tmp[rtb_on_ground] * a);
  }

  a = std::sin(rtb_dme);
  result_tmp[0] = Phi2;
  result_tmp[3] = 0.0;
  result_tmp[6] = -a;
  result_tmp[1] = external_limit * a;
  result_tmp[4] = b_R;
  result_tmp[7] = Phi2 * external_limit;
  result_tmp[2] = b_R * a;
  result_tmp[5] = 0.0 - external_limit;
  result_tmp[8] = b_R * Phi2;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result_0[rtb_on_ground] = result_tmp[rtb_on_ground + 6] * AutopilotLaws_U.in.data.bz_m_s2 +
      (result_tmp[rtb_on_ground + 3] * AutopilotLaws_U.in.data.by_m_s2 + result_tmp[rtb_on_ground] *
       AutopilotLaws_U.in.data.bx_m_s2);
  }

  if (AutopilotLaws_U.in.data.nav_dme_valid != 0.0) {
    rtb_dme = AutopilotLaws_U.in.data.nav_dme_nmi;
  } else if (AutopilotLaws_U.in.data.nav_loc_valid) {
    a = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lat - AutopilotLaws_U.in.data.aircraft_position.lat) *
                 0.017453292519943295 / 2.0);
    external_limit = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lon -
      AutopilotLaws_U.in.data.aircraft_position.lon) * 0.017453292519943295 / 2.0);
    a = std::cos(0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lat) * std::cos(0.017453292519943295 *
      AutopilotLaws_U.in.data.nav_loc_position.lat) * external_limit * external_limit + a * a;
    rtb_dme = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
    external_limit = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_loc_position.alt;
    rtb_dme = std::sqrt(rtb_dme * rtb_dme + external_limit * external_limit) / 1852.0;
  } else {
    rtb_dme = 0.0;
  }

  rtb_Saturation = 0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lat;
  Phi2 = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_loc_position.lat;
  rtb_Saturation1 = 0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lon;
  a = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lat - AutopilotLaws_U.in.data.aircraft_position.lat) *
               0.017453292519943295 / 2.0);
  external_limit = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lon -
    AutopilotLaws_U.in.data.aircraft_position.lon) * 0.017453292519943295 / 2.0);
  a = std::cos(rtb_Saturation) * std::cos(Phi2) * external_limit * external_limit + a * a;
  a = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  external_limit = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_loc_position.alt;
  L = std::cos(Phi2);
  R = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_loc_position.lon - rtb_Saturation1;
  b_L = mod_lHmooAo5((mod_lHmooAo5(mod_lHmooAo5(360.0) + 360.0) - (mod_lHmooAo5(mod_lHmooAo5
    (AutopilotLaws_U.in.data.nav_loc_magvar_deg) + 360.0) + 360.0)) + 360.0);
  b_R = mod_lHmooAo5(360.0 - b_L);
  if (std::abs(b_L) < std::abs(b_R)) {
    b_R = -b_L;
  }

  b_L = std::cos(rtb_Saturation);
  rtb_Saturation = std::sin(rtb_Saturation);
  L = mod_lHmooAo5(mod_lHmooAo5(mod_lHmooAo5(std::atan2(std::sin(R) * L, b_L * std::sin(Phi2) - rtb_Saturation * L * std::
    cos(R)) * 57.295779513082323 + 360.0)) + 360.0) + 360.0;
  Phi2 = mod_lHmooAo5((mod_lHmooAo5(mod_lHmooAo5(mod_lHmooAo5(mod_lHmooAo5(AutopilotLaws_U.in.data.nav_loc_deg - b_R) +
    360.0)) + 360.0) - L) + 360.0);
  b_R = mod_lHmooAo5(360.0 - Phi2);
  guard1 = false;
  if (std::abs(std::sqrt(a * a + external_limit * external_limit) / 1852.0) < 30.0) {
    L = mod_lHmooAo5((mod_lHmooAo5(mod_lHmooAo5(AutopilotLaws_U.in.data.nav_loc_deg) + 360.0) - L) + 360.0);
    R = mod_lHmooAo5(360.0 - L);
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
  external_limit = std::sin((AutopilotLaws_U.in.data.nav_gs_position.lon - AutopilotLaws_U.in.data.aircraft_position.lon)
    * 0.017453292519943295 / 2.0);
  L = std::cos(Phi2);
  R = b_L;
  a = b_L * L * external_limit * external_limit + a * a;
  a = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  external_limit = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_gs_position.alt;
  a = std::sqrt(a * a + external_limit * external_limit);
  rtb_Saturation1 = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_gs_position.lon - rtb_Saturation1;
  rtb_Saturation1 = std::atan2(std::sin(rtb_Saturation1) * L, b_L * std::sin(Phi2) - rtb_Saturation * L * std::cos
    (rtb_Saturation1)) * 57.295779513082323;
  if (rtb_Saturation1 + 360.0 == 0.0) {
    rtb_Saturation = 0.0;
  } else {
    rtb_Saturation = std::fmod(rtb_Saturation1 + 360.0, 360.0);
    if (rtb_Saturation == 0.0) {
      rtb_Saturation = 0.0;
    } else if (rtb_Saturation1 + 360.0 < 0.0) {
      rtb_Saturation += 360.0;
    }
  }

  guard1 = false;
  if (std::abs(a / 1852.0) < 30.0) {
    if (AutopilotLaws_U.in.data.nav_loc_deg == 0.0) {
      rtb_Saturation1 = 0.0;
    } else {
      rtb_Saturation1 = std::fmod(AutopilotLaws_U.in.data.nav_loc_deg, 360.0);
      if (rtb_Saturation1 == 0.0) {
        rtb_Saturation1 = 0.0;
      } else if (AutopilotLaws_U.in.data.nav_loc_deg < 0.0) {
        rtb_Saturation1 += 360.0;
      }
    }

    if (rtb_Saturation == 0.0) {
      Phi2 = 0.0;
    } else {
      Phi2 = std::fmod(rtb_Saturation, 360.0);
      if (Phi2 == 0.0) {
        Phi2 = 0.0;
      } else if (rtb_Saturation < 0.0) {
        Phi2 += 360.0;
      }
    }

    if (rtb_Saturation1 + 360.0 == 0.0) {
      rtb_Saturation1 = 0.0;
    } else {
      rtb_Saturation1 = std::fmod(rtb_Saturation1 + 360.0, 360.0);
    }

    if (Phi2 + 360.0 == 0.0) {
      Phi2 = 0.0;
    } else {
      Phi2 = std::fmod(Phi2 + 360.0, 360.0);
    }

    rtb_Saturation = (rtb_Saturation1 - (Phi2 + 360.0)) + 360.0;
    if (rtb_Saturation == 0.0) {
      L = 0.0;
    } else {
      L = std::fmod(rtb_Saturation, 360.0);
      if (L == 0.0) {
        L = 0.0;
      } else if (rtb_Saturation < 0.0) {
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
      rtb_valid_o = true;
      a = std::asin(external_limit / a) * 57.295779513082323 - AutopilotLaws_DWork.nav_gs_deg;
    } else {
      guard1 = true;
    }
  } else {
    guard1 = true;
  }

  if (guard1) {
    rtb_valid_o = false;
    a = 0.0;
  }

  rtb_Saturation = AutopilotLaws_P.Gain_Gain_n * AutopilotLaws_U.in.data.gear_strut_compression_1 -
    AutopilotLaws_P.Constant1_Value_b;
  if (rtb_Saturation > AutopilotLaws_P.Saturation_UpperSat_p) {
    rtb_Saturation = AutopilotLaws_P.Saturation_UpperSat_p;
  } else if (rtb_Saturation < AutopilotLaws_P.Saturation_LowerSat_g) {
    rtb_Saturation = AutopilotLaws_P.Saturation_LowerSat_g;
  }

  rtb_Saturation1 = AutopilotLaws_P.Gain1_Gain_ll * AutopilotLaws_U.in.data.gear_strut_compression_2 -
    AutopilotLaws_P.Constant1_Value_b;
  if (rtb_Saturation1 > AutopilotLaws_P.Saturation1_UpperSat_j) {
    rtb_Saturation1 = AutopilotLaws_P.Saturation1_UpperSat_j;
  } else if (rtb_Saturation1 < AutopilotLaws_P.Saturation1_LowerSat_d) {
    rtb_Saturation1 = AutopilotLaws_P.Saturation1_LowerSat_d;
  }

  if (AutopilotLaws_DWork.is_active_c5_AutopilotLaws == 0U) {
    AutopilotLaws_DWork.is_active_c5_AutopilotLaws = 1U;
    AutopilotLaws_DWork.is_c5_AutopilotLaws = AutopilotLaws_IN_OnGround;
    rtb_on_ground = 1;
  } else if (AutopilotLaws_DWork.is_c5_AutopilotLaws == 1) {
    if ((rtb_Saturation > 0.05) || (rtb_Saturation1 > 0.05)) {
      AutopilotLaws_DWork.is_c5_AutopilotLaws = AutopilotLaws_IN_OnGround;
      rtb_on_ground = 1;
    } else {
      rtb_on_ground = 0;
    }
  } else if ((rtb_Saturation == 0.0) && (rtb_Saturation1 == 0.0)) {
    AutopilotLaws_DWork.is_c5_AutopilotLaws = AutopilotLaws_IN_InAir;
    rtb_on_ground = 0;
  } else {
    rtb_on_ground = 1;
  }

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
  AutopilotLaws_Y.out.data.nav_e_gs_valid = rtb_valid_o;
  AutopilotLaws_Y.out.data.nav_e_gs_error_deg = a;
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
  AutopilotLaws_Y.out.input = AutopilotLaws_U.in.input;
  b_R = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_deg - (AutopilotLaws_U.in.data.Psi_true_deg +
    AutopilotLaws_P.Constant3_Value_e)) + AutopilotLaws_P.Constant3_Value_e, AutopilotLaws_P.Constant3_Value_e);
  a = rt_modd(AutopilotLaws_P.Constant3_Value_e - b_R, AutopilotLaws_P.Constant3_Value_e);
  if (b_R < a) {
    b_R *= AutopilotLaws_P.Gain1_Gain_h;
  } else {
    b_R = AutopilotLaws_P.Gain_Gain_e * a;
  }

  b_L = rt_modd(rt_modd(AutopilotLaws_U.in.data.Psi_magnetic_track_deg + b_R, AutopilotLaws_P.Constant3_Value_b) +
                AutopilotLaws_P.Constant3_Value_b, AutopilotLaws_P.Constant3_Value_b);
  a = AutopilotLaws_U.in.data.nav_loc_deg - AutopilotLaws_U.in.data.nav_loc_magvar_deg;
  rtb_Saturation_c = rt_modd(rt_modd(a, AutopilotLaws_P.Constant3_Value_n) + AutopilotLaws_P.Constant3_Value_n,
    AutopilotLaws_P.Constant3_Value_n);
  rtb_Saturation = rt_modd((b_L - (rtb_Saturation_c + AutopilotLaws_P.Constant3_Value_i)) +
    AutopilotLaws_P.Constant3_Value_i, AutopilotLaws_P.Constant3_Value_i);
  rtb_Saturation1 = rt_modd(AutopilotLaws_P.Constant3_Value_i - rtb_Saturation, AutopilotLaws_P.Constant3_Value_i);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting == 1) {
    b_R = AutopilotLaws_P.Constant_Value;
  } else {
    b_R = AutopilotLaws_U.in.input.lateral_law;
  }

  rtb_valid = (b_R == AutopilotLaws_P.CompareToConstant2_const);
  if (rtb_Saturation < rtb_Saturation1) {
    rtb_Saturation *= AutopilotLaws_P.Gain1_Gain;
  } else {
    rtb_Saturation = AutopilotLaws_P.Gain_Gain * rtb_Saturation1;
  }

  rtb_Saturation = std::abs(rtb_Saturation);
  if (!AutopilotLaws_DWork.limit_not_empty) {
    AutopilotLaws_DWork.limit = rtb_Saturation;
    AutopilotLaws_DWork.limit_not_empty = true;
  }

  if (!rtb_valid) {
    if (rtb_Saturation > 15.0) {
      AutopilotLaws_DWork.limit = rtb_Saturation;
    } else {
      AutopilotLaws_DWork.limit = 15.0;
    }

    if (AutopilotLaws_DWork.limit >= 115.0) {
      AutopilotLaws_DWork.limit = 115.0;
    }
  }

  if (rtb_valid && (rtb_Saturation < 15.0)) {
    AutopilotLaws_DWork.limit = 15.0;
  }

  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value, AutopilotLaws_P.zeta_Value, &L, &rtb_Y_j5);
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_b) {
    rtb_Saturation = AutopilotLaws_P.Saturation_UpperSat_b;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_n) {
    rtb_Saturation = AutopilotLaws_P.Saturation_LowerSat_n;
  } else {
    rtb_Saturation = rtb_dme;
  }

  rtb_Saturation = std::sin(AutopilotLaws_P.Gain1_Gain_f * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_Saturation *
    AutopilotLaws_P.Gain_Gain_h * rtb_Y_j5 / AutopilotLaws_U.in.data.V_gnd_kn;
  rtb_Saturation1 = rt_modd((b_L - (rt_modd(rt_modd(AutopilotLaws_U.in.data.nav_loc_error_deg + rtb_Saturation_c,
    AutopilotLaws_P.Constant3_Value_c) + AutopilotLaws_P.Constant3_Value_c, AutopilotLaws_P.Constant3_Value_c) +
    AutopilotLaws_P.Constant3_Value_p)) + AutopilotLaws_P.Constant3_Value_p, AutopilotLaws_P.Constant3_Value_p);
  Phi2 = rt_modd(AutopilotLaws_P.Constant3_Value_p - rtb_Saturation1, AutopilotLaws_P.Constant3_Value_p);
  if (rtb_Saturation > AutopilotLaws_DWork.limit) {
    rtb_Saturation = AutopilotLaws_DWork.limit;
  } else if (rtb_Saturation < -AutopilotLaws_DWork.limit) {
    rtb_Saturation = -AutopilotLaws_DWork.limit;
  }

  if (rtb_Saturation1 < Phi2) {
    rtb_Saturation1 *= AutopilotLaws_P.Gain1_Gain_p;
  } else {
    rtb_Saturation1 = AutopilotLaws_P.Gain_Gain_a * Phi2;
  }

  rtb_Saturation = (AutopilotLaws_P.Gain2_Gain_i * rtb_Saturation1 + rtb_Saturation) * L *
    AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_o) {
    rtb_dme = AutopilotLaws_P.Saturation_UpperSat_o;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_o) {
    rtb_dme = AutopilotLaws_P.Saturation_LowerSat_o;
  }

  b_L = std::sin(AutopilotLaws_P.Gain1_Gain_nr * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_dme *
    AutopilotLaws_P.Gain2_Gain_g;
  if (b_L > AutopilotLaws_P.Saturation1_UpperSat_g) {
    b_L = AutopilotLaws_P.Saturation1_UpperSat_g;
  } else if (b_L < AutopilotLaws_P.Saturation1_LowerSat_k) {
    b_L = AutopilotLaws_P.Saturation1_LowerSat_k;
  }

  rtb_Compare_l = (b_R == AutopilotLaws_P.CompareToConstant_const);
  if (!rtb_Compare_l) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  AutopilotLaws_DWork.Delay_DSTATE += AutopilotLaws_P.Gain6_Gain_b * b_L *
    AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_Gain * AutopilotLaws_U.in.time.dt;
  if (AutopilotLaws_DWork.Delay_DSTATE > AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (AutopilotLaws_DWork.Delay_DSTATE < AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  AutopilotLaws_storevalue(rtb_Compare_l, rt_modd(rt_modd(AutopilotLaws_U.in.data.nav_loc_deg -
    AutopilotLaws_U.in.data.nav_loc_magvar_deg, AutopilotLaws_P.Constant3_Value_d) + AutopilotLaws_P.Constant3_Value_d,
    AutopilotLaws_P.Constant3_Value_d), &rtb_Y_j5, &AutopilotLaws_DWork.sf_storevalue);
  rtb_dme = rt_modd((AutopilotLaws_U.in.data.Psi_true_deg - (rt_modd(rt_modd(AutopilotLaws_U.in.data.nav_loc_error_deg +
    rtb_Y_j5, AutopilotLaws_P.Constant3_Value_o) + AutopilotLaws_P.Constant3_Value_o, AutopilotLaws_P.Constant3_Value_o)
    + AutopilotLaws_P.Constant3_Value_n1)) + AutopilotLaws_P.Constant3_Value_n1, AutopilotLaws_P.Constant3_Value_n1);
  rtb_Saturation1 = rt_modd(AutopilotLaws_P.Constant3_Value_n1 - rtb_dme, AutopilotLaws_P.Constant3_Value_n1);
  if (rtb_dme < rtb_Saturation1) {
    rtb_dme *= AutopilotLaws_P.Gain1_Gain_j;
  } else {
    rtb_dme = AutopilotLaws_P.Gain_Gain_i * rtb_Saturation1;
  }

  rtb_dme = rt_modd((rt_modd(rt_modd(((b_L * look1_binlxpw(AutopilotLaws_U.in.data.V_gnd_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain_Table, 2U) +
    AutopilotLaws_DWork.Delay_DSTATE) + AutopilotLaws_P.Gain1_Gain_fq * rtb_dme) + AutopilotLaws_U.in.data.Psi_true_deg,
    AutopilotLaws_P.Constant3_Value_h) + AutopilotLaws_P.Constant3_Value_h, AutopilotLaws_P.Constant3_Value_h) -
                     (AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_nr)) +
                    AutopilotLaws_P.Constant3_Value_nr, AutopilotLaws_P.Constant3_Value_nr);
  AutopilotLaws_Chart_h(rtb_dme, AutopilotLaws_P.Gain_Gain_oc * rt_modd(AutopilotLaws_P.Constant3_Value_nr - rtb_dme,
    AutopilotLaws_P.Constant3_Value_nr), AutopilotLaws_P.Constant1_Value_e, &rtb_Saturation1,
                        &AutopilotLaws_DWork.sf_Chart_b);
  rtb_dme = rt_modd((rt_modd(rt_modd(a, AutopilotLaws_P.Constant3_Value_if) + AutopilotLaws_P.Constant3_Value_if,
    AutopilotLaws_P.Constant3_Value_if) - (AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_m)) +
                    AutopilotLaws_P.Constant3_Value_m, AutopilotLaws_P.Constant3_Value_m);
  AutopilotLaws_Chart_h(rtb_dme, AutopilotLaws_P.Gain_Gain_fn * rt_modd(AutopilotLaws_P.Constant3_Value_m - rtb_dme,
    AutopilotLaws_P.Constant3_Value_m), AutopilotLaws_P.Constant2_Value_l, &Phi2, &AutopilotLaws_DWork.sf_Chart_h);
  rtb_dme = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_deg +
    AutopilotLaws_P.Constant3_Value_cd)) + AutopilotLaws_P.Constant3_Value_cd, AutopilotLaws_P.Constant3_Value_cd);
  rtb_valid = ((b_R == AutopilotLaws_P.CompareToConstant5_const) == AutopilotLaws_P.CompareToConstant_const_hx);
  a = AutopilotLaws_P.Subsystem_Value / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[i] = AutopilotLaws_P.Delay_InitialCondition;
    }
  }

  if (a < 1.0) {
    rtb_valid_o = rtb_valid;
  } else {
    if (a > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::floor(a), 4.294967296E+9)));
    }

    rtb_valid_o = AutopilotLaws_DWork.Delay_DSTATE_l[100U - i];
  }

  AutopilotLaws_Chart(rtb_dme, AutopilotLaws_P.Gain_Gain_cy * rt_modd(AutopilotLaws_P.Constant3_Value_cd - rtb_dme,
    AutopilotLaws_P.Constant3_Value_cd), rtb_valid != rtb_valid_o, &R, &AutopilotLaws_DWork.sf_Chart);
  rtb_dme = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_track_deg +
    AutopilotLaws_P.Constant3_Value_k)) + AutopilotLaws_P.Constant3_Value_k, AutopilotLaws_P.Constant3_Value_k);
  rtb_valid_o = ((b_R == AutopilotLaws_P.CompareToConstant4_const) == AutopilotLaws_P.CompareToConstant_const_e);
  a = AutopilotLaws_P.Subsystem_Value_n / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid_o) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }
  }

  if (a < 1.0) {
    rtb_Delay_j = rtb_valid_o;
  } else {
    if (a > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::floor(a), 4.294967296E+9)));
    }

    rtb_Delay_j = AutopilotLaws_DWork.Delay_DSTATE_h5[100U - i];
  }

  AutopilotLaws_Chart(rtb_dme, AutopilotLaws_P.Gain_Gain_p * rt_modd(AutopilotLaws_P.Constant3_Value_k - rtb_dme,
    AutopilotLaws_P.Constant3_Value_k), rtb_valid_o != rtb_Delay_j, &b_L, &AutopilotLaws_DWork.sf_Chart_ba);
  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value_c, AutopilotLaws_P.zeta_Value_h, &external_limit, &a);
  AutopilotLaws_RateLimiter(AutopilotLaws_U.in.data.flight_guidance_phi_deg, AutopilotLaws_P.RateLimiterVariableTs_up,
    AutopilotLaws_P.RateLimiterVariableTs_lo, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition, &L, &AutopilotLaws_DWork.sf_RateLimiter);
  AutopilotLaws_LagFilter(L, AutopilotLaws_P.LagFilter_C1, AutopilotLaws_U.in.time.dt, &rtb_Y_o,
    &AutopilotLaws_DWork.sf_LagFilter);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_loc_error_deg, AutopilotLaws_P.LagFilter2_C1,
    AutopilotLaws_U.in.time.dt, &L, &AutopilotLaws_DWork.sf_LagFilter_h);
  rtb_dme = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain * L;
  AutopilotLaws_LagFilter(L + AutopilotLaws_P.Gain3_Gain_i * ((rtb_dme - AutopilotLaws_DWork.Delay_DSTATE_e) /
    AutopilotLaws_U.in.time.dt), AutopilotLaws_P.LagFilter_C1_n, AutopilotLaws_U.in.time.dt, &rtb_Y_j5,
    &AutopilotLaws_DWork.sf_LagFilter_m);
  rtb_Delay_j = (AutopilotLaws_U.in.data.H_radio_ft <= AutopilotLaws_P.CompareToConstant_const_d);
  switch (static_cast<int32_T>(b_R)) {
   case 0:
    b_L = rtb_GainTheta1;
    break;

   case 1:
    b_L = R * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_h,
      AutopilotLaws_P.ScheduledGain_Table_o, 6U) * AutopilotLaws_P.Gain1_Gain_o + AutopilotLaws_P.Gain_Gain_o * result[2];
    break;

   case 2:
    b_L = b_L * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_o,
      AutopilotLaws_P.ScheduledGain_Table_e, 6U) * AutopilotLaws_P.Gain1_Gain_i + AutopilotLaws_P.Gain_Gain_l * result[2];
    break;

   case 3:
    rtb_Saturation_c = AutopilotLaws_P.Gain_Gain_c * AutopilotLaws_U.in.data.flight_guidance_xtk_nmi * a /
      AutopilotLaws_U.in.data.V_gnd_kn;
    if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat) {
      rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat;
    } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat) {
      rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat;
    }

    b_L = rtb_Y_o - (AutopilotLaws_P.Gain2_Gain * AutopilotLaws_U.in.data.flight_guidance_tae_deg + rtb_Saturation_c) *
      external_limit * AutopilotLaws_U.in.data.V_gnd_kn;
    break;

   case 4:
    b_L = rtb_Saturation;
    break;

   case 5:
    if (rtb_Delay_j) {
      external_limit = AutopilotLaws_P.k_beta_Phi_Gain * AutopilotLaws_U.in.data.beta_deg;
    } else {
      external_limit = AutopilotLaws_P.Constant1_Value_fk;
    }

    b_L = rtb_Y_j5 * look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_e, AutopilotLaws_P.ScheduledGain_Table_p, 4U) *
      look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1,
                    AutopilotLaws_P.ScheduledGain2_Table, 6U) + external_limit;
    break;

   default:
    b_L = AutopilotLaws_P.Constant3_Value;
    break;
  }

  a = std::abs(AutopilotLaws_U.in.data.V_tas_kn);
  i = 1;
  low_ip1 = 2;
  high_i = 5;
  while (high_i > low_ip1) {
    mid_i = (i + high_i) >> 1;
    if (a >= (static_cast<real_T>(mid_i) - 1.0) * 150.0) {
      i = mid_i;
      low_ip1 = mid_i + 1;
    } else {
      high_i = mid_i;
    }
  }

  a -= (static_cast<real_T>(i) - 1.0) * 150.0;
  external_limit = std::abs(AutopilotLaws_U.in.data.flight_guidance_phi_limit_deg);
  if ((AutopilotLaws_U.in.input.lateral_mode != 20.0) || (external_limit <= 0.0)) {
    external_limit = ((b[i - 1] * a + b[i + 3]) * a + b[i + 7]) * a + b[i + 11];
  }

  if (b_L > external_limit) {
    b_L = external_limit;
  } else {
    a = AutopilotLaws_P.Gain1_Gain_l * external_limit;
    if (b_L < a) {
      b_L = a;
    }
  }

  if (!AutopilotLaws_DWork.pY_not_empty) {
    AutopilotLaws_DWork.pY = AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_i;
    AutopilotLaws_DWork.pY_not_empty = true;
  }

  rtb_Saturation_c = static_cast<real_T>(rtb_Compare_l) - AutopilotLaws_DWork.pY;
  external_limit = std::abs(AutopilotLaws_P.RateLimiterVariableTs_up_n) * AutopilotLaws_U.in.time.dt;
  if (rtb_Saturation_c < external_limit) {
    external_limit = rtb_Saturation_c;
  }

  L = -std::abs(AutopilotLaws_P.RateLimiterVariableTs_lo_k) * AutopilotLaws_U.in.time.dt;
  if (external_limit > L) {
    L = external_limit;
  }

  AutopilotLaws_DWork.pY += L;
  if (AutopilotLaws_DWork.pY > AutopilotLaws_P.Saturation_UpperSat_k) {
    a = AutopilotLaws_P.Saturation_UpperSat_k;
  } else if (AutopilotLaws_DWork.pY < AutopilotLaws_P.Saturation_LowerSat_f3) {
    a = AutopilotLaws_P.Saturation_LowerSat_f3;
  } else {
    a = AutopilotLaws_DWork.pY;
  }

  rtb_Saturation1 = (AutopilotLaws_P.Gain_Gain_b * result[2] * a + (AutopilotLaws_P.Constant_Value_a - a) *
                     (AutopilotLaws_P.Gain4_Gain * AutopilotLaws_U.in.data.beta_deg)) + AutopilotLaws_P.Gain5_Gain_o *
    rtb_Saturation1;
  if (static_cast<real_T>(rtb_Compare_o1) > AutopilotLaws_P.Switch_Threshold_n) {
    switch (static_cast<int32_T>(b_R)) {
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
      a = AutopilotLaws_P.Gain3_Gain * rtb_Saturation1;
      break;
    }
  } else {
    a = AutopilotLaws_P.Constant1_Value;
  }

  if (rtb_Delay_j) {
    external_limit = AutopilotLaws_P.Gain_Gain_ae * Phi2 + AutopilotLaws_P.Gain1_Gain_k *
      AutopilotLaws_U.in.data.beta_deg;
  } else {
    external_limit = AutopilotLaws_P.Constant1_Value_fk;
  }

  AutopilotLaws_LagFilter(external_limit, AutopilotLaws_P.LagFilter1_C1, AutopilotLaws_U.in.time.dt, &rtb_Y_j5,
    &AutopilotLaws_DWork.sf_LagFilter_c);
  switch (static_cast<int32_T>(b_R)) {
   case 0:
    b_R = AutopilotLaws_P.beta_Value;
    break;

   case 1:
    b_R = AutopilotLaws_P.beta_Value_e;
    break;

   case 2:
    b_R = AutopilotLaws_P.beta_Value_b;
    break;

   case 3:
    b_R = AutopilotLaws_P.beta_Value_i;
    break;

   case 4:
    b_R = AutopilotLaws_P.beta_Value_c;
    break;

   case 5:
    if (rtb_Y_j5 > AutopilotLaws_P.Saturation_UpperSat_e) {
      b_R = AutopilotLaws_P.Saturation_UpperSat_e;
    } else if (rtb_Y_j5 < AutopilotLaws_P.Saturation_LowerSat_f) {
      b_R = AutopilotLaws_P.Saturation_LowerSat_f;
    } else {
      b_R = rtb_Y_j5;
    }
    break;

   default:
    b_R = AutopilotLaws_P.Gain7_Gain * rtb_Saturation1;
    break;
  }

  AutopilotLaws_DWork.icLoad = ((!rtb_Compare_o1) || AutopilotLaws_DWork.icLoad);
  if (AutopilotLaws_DWork.icLoad) {
    AutopilotLaws_DWork.Delay_DSTATE_h = rtb_GainTheta1;
  }

  rtb_Saturation_c = b_L - AutopilotLaws_DWork.Delay_DSTATE_h;
  external_limit = AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (rtb_Saturation_c < external_limit) {
    external_limit = rtb_Saturation_c;
  }

  L = AutopilotLaws_P.Gain1_Gain_kf * AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (external_limit > L) {
    L = external_limit;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h += L;
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h, AutopilotLaws_P.LagFilter_C1_l, AutopilotLaws_U.in.time.dt,
    &rtb_Y_o, &AutopilotLaws_DWork.sf_LagFilter_o);
  AutopilotLaws_RateLimiter(static_cast<real_T>(rtb_Compare_o1), AutopilotLaws_P.RateLimiterVariableTs_up_b,
    AutopilotLaws_P.RateLimiterVariableTs_lo_b, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_il, &rtb_Y_j5, &AutopilotLaws_DWork.sf_RateLimiter_d);
  if (rtb_Y_j5 > AutopilotLaws_P.Saturation_UpperSat_m) {
    external_limit = AutopilotLaws_P.Saturation_UpperSat_m;
  } else if (rtb_Y_j5 < AutopilotLaws_P.Saturation_LowerSat_fw) {
    external_limit = AutopilotLaws_P.Saturation_LowerSat_fw;
  } else {
    external_limit = rtb_Y_j5;
  }

  AutopilotLaws_Y.out.output.Phi_loc_c = rtb_Saturation;
  rtb_Saturation_c = AutopilotLaws_P.Gain_Gain_m3 * a;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_c) {
    AutopilotLaws_Y.out.output.Nosewheel_c = AutopilotLaws_P.Saturation_UpperSat_c;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_d) {
    AutopilotLaws_Y.out.output.Nosewheel_c = AutopilotLaws_P.Saturation_LowerSat_d;
  } else {
    AutopilotLaws_Y.out.output.Nosewheel_c = rtb_Saturation_c;
  }

  AutopilotLaws_Y.out.output.flight_director.Beta_c_deg = b_R;
  AutopilotLaws_Y.out.output.autopilot.Beta_c_deg = b_R;
  AutopilotLaws_Y.out.output.flight_director.Phi_c_deg = (b_L - rtb_GainTheta1) * AutopilotLaws_P.Gain_Gain_lu;
  AutopilotLaws_Y.out.output.autopilot.Phi_c_deg = (AutopilotLaws_P.Constant_Value_ii - external_limit) * rtb_GainTheta1
    + rtb_Y_o * external_limit;
  AutopilotLaws_WashoutFilter(rtb_GainTheta, AutopilotLaws_P.WashoutFilter_C1, AutopilotLaws_U.in.time.dt, &b_R,
    &AutopilotLaws_DWork.sf_WashoutFilter_fo);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting_b == 1) {
    rtb_Saturation = AutopilotLaws_P.Constant_Value_m;
  } else {
    rtb_Saturation = AutopilotLaws_U.in.input.vertical_law;
  }

  if (AutopilotLaws_U.in.input.ALT_soft_mode_active) {
    external_limit = (AutopilotLaws_U.in.input.V_c_kn - AutopilotLaws_U.in.data.V_ias_kn) * AutopilotLaws_P.Gain1_Gain_b;
    if (external_limit > AutopilotLaws_P.Saturation1_UpperSat) {
      external_limit = AutopilotLaws_P.Saturation1_UpperSat;
    } else if (external_limit < AutopilotLaws_P.Saturation1_LowerSat) {
      external_limit = AutopilotLaws_P.Saturation1_LowerSat;
    }
  } else {
    external_limit = AutopilotLaws_P.Constant1_Value_h;
  }

  if (rtb_Saturation != AutopilotLaws_P.CompareToConstant5_const_e) {
    AutopilotLaws_B.u = (AutopilotLaws_U.in.input.H_c_ft + AutopilotLaws_U.in.data.H_ft) -
      AutopilotLaws_U.in.data.H_ind_ft;
  }

  AutopilotLaws_LagFilter(AutopilotLaws_B.u - AutopilotLaws_U.in.data.H_ft, AutopilotLaws_P.LagFilter_C1_a,
    AutopilotLaws_U.in.time.dt, &rtb_Y_j5, &AutopilotLaws_DWork.sf_LagFilter_g);
  rtb_Saturation_c = AutopilotLaws_P.Gain_Gain_ft * rtb_Y_j5 + external_limit;
  a = AutopilotLaws_P.kntoms_Gain * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_n) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_n;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_d4) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_d4;
  }

  if (a > AutopilotLaws_P.Saturation_UpperSat_a) {
    a = AutopilotLaws_P.Saturation_UpperSat_a;
  } else if (a < AutopilotLaws_P.Saturation_LowerSat_n5) {
    a = AutopilotLaws_P.Saturation_LowerSat_n5;
  }

  rtb_Saturation_c = (rtb_Saturation_c - AutopilotLaws_U.in.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain / a;
  if (rtb_Saturation_c > 1.0) {
    rtb_Saturation_c = 1.0;
  } else if (rtb_Saturation_c < -1.0) {
    rtb_Saturation_c = -1.0;
  }

  rtb_Saturation1 = AutopilotLaws_P.Gain_Gain_k * std::asin(rtb_Saturation_c);
  rtb_Compare_o1 = (rtb_Saturation == AutopilotLaws_P.CompareToConstant1_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty_a) {
    AutopilotLaws_DWork.wasActive_l = rtb_Compare_o1;
    AutopilotLaws_DWork.wasActive_not_empty_a = true;
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
  if ((!AutopilotLaws_DWork.wasActive_l) && rtb_Compare_o1) {
    AutopilotLaws_DWork.k = AutopilotLaws_U.in.data.H_dot_ft_min / a;
    AutopilotLaws_DWork.dH_offset = std::abs(500.0 / std::abs(AutopilotLaws_DWork.k) - 100.0);
    if (a < 0.0) {
      external_limit = -1.0;
    } else if (a > 0.0) {
      external_limit = 1.0;
    } else {
      external_limit = a;
    }

    a += external_limit * AutopilotLaws_DWork.dH_offset;
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

  AutopilotLaws_DWork.wasActive_l = rtb_Compare_o1;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_h * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_d) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_d;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_nr) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_nr;
  }

  rtb_Saturation_c = (a - AutopilotLaws_U.in.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain_c / rtb_Saturation_c;
  if (rtb_Saturation_c > 1.0) {
    rtb_Saturation_c = 1.0;
  } else if (rtb_Saturation_c < -1.0) {
    rtb_Saturation_c = -1.0;
  }

  rtb_Gain_aa = AutopilotLaws_P.Gain_Gain_es * std::asin(rtb_Saturation_c);
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_m * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_j) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_j;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_i) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_i;
  }

  external_limit = std::atan(AutopilotLaws_P.fpmtoms_Gain * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation_c) *
    AutopilotLaws_P.Gain_Gain_e3;
  a = AutopilotLaws_P.Gain1_Gain_c * rtb_GainTheta1;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain * (AutopilotLaws_P.GStoGS_CAS_Gain * (AutopilotLaws_P.ktstomps_Gain *
    AutopilotLaws_U.in.data.V_gnd_kn)), AutopilotLaws_P.WashoutFilter_C1_e, AutopilotLaws_U.in.time.dt, &rtb_Y_j5,
    &AutopilotLaws_DWork.sf_WashoutFilter);
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_b * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_ei) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_ei;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_dz) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_dz;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_j5 - AutopilotLaws_P.g_Gain * (AutopilotLaws_P.Gain1_Gain_lp *
    (AutopilotLaws_P.Gain_Gain_am * ((AutopilotLaws_P.Gain1_Gain_g * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_lx *
    (AutopilotLaws_P.Gain_Gain_c1 * std::atan(AutopilotLaws_P.fpmtoms_Gain_g * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Saturation_c))) * (AutopilotLaws_P.Constant_Value_dy - std::cos(a)) + std::sin(a) * std::sin
    (AutopilotLaws_P.Gain1_Gain_pf * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_e *
     AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1, AutopilotLaws_P.HighPassFilter_C2,
    AutopilotLaws_P.HighPassFilter_C3, AutopilotLaws_P.HighPassFilter_C4, AutopilotLaws_U.in.time.dt, &rtb_Y_o,
    &AutopilotLaws_DWork.sf_LeadLagFilter);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_b * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1, AutopilotLaws_P.LowPassFilter_C2, AutopilotLaws_P.LowPassFilter_C3,
    AutopilotLaws_P.LowPassFilter_C4, AutopilotLaws_U.in.time.dt, &rtb_Y_j5, &AutopilotLaws_DWork.sf_LeadLagFilter_o);
  a = (rtb_Y_o + rtb_Y_j5) * AutopilotLaws_P.ug_Gain;
  b_L = AutopilotLaws_P.Gain1_Gain_bf * external_limit;
  L = a + b_L;
  R = AutopilotLaws_P.Constant3_Value_nq - AutopilotLaws_P.Constant4_Value;
  b_L = (AutopilotLaws_P.Gain1_Gain_ik * a + b_L) * AutopilotLaws_P.Gain_Gain_aj;
  if (R > AutopilotLaws_P.Switch_Threshold_l) {
    a = AutopilotLaws_P.Constant1_Value_g;
  } else {
    a = AutopilotLaws_P.Gain5_Gain * b_L;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &rtb_Y_j5);
  rtb_Gain1_na = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_j5) * AutopilotLaws_P.Gain1_Gain_oz;
  if (rtb_Gain1_na <= a) {
    if (R > AutopilotLaws_P.Switch1_Threshold) {
      a = AutopilotLaws_P.Constant_Value_g;
    } else {
      a = AutopilotLaws_P.Gain6_Gain * b_L;
    }

    if (rtb_Gain1_na >= a) {
      a = rtb_Gain1_na;
    }
  }

  rtb_Gain1_na = (AutopilotLaws_P.Gain_Gain_b0 * L - external_limit) + a;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_p * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_h) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_h;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_e) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_e;
  }

  external_limit = std::atan(AutopilotLaws_P.fpmtoms_Gain_a * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation_c) *
    AutopilotLaws_P.Gain_Gain_d4;
  a = AutopilotLaws_P.Gain1_Gain_j0 * rtb_GainTheta1;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_h * (AutopilotLaws_P.GStoGS_CAS_Gain_m *
    (AutopilotLaws_P.ktstomps_Gain_g * AutopilotLaws_U.in.data.V_gnd_kn)), AutopilotLaws_P.WashoutFilter_C1_e4,
    AutopilotLaws_U.in.time.dt, &rtb_Y_j5, &AutopilotLaws_DWork.sf_WashoutFilter_d);
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_l * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_i) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_i;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_h) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_h;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_j5 - AutopilotLaws_P.g_Gain_h * (AutopilotLaws_P.Gain1_Gain_dv *
    (AutopilotLaws_P.Gain_Gain_id * ((AutopilotLaws_P.Gain1_Gain_kd * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_o4 *
    (AutopilotLaws_P.Gain_Gain_bs * std::atan(AutopilotLaws_P.fpmtoms_Gain_c * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Saturation_c))) * (AutopilotLaws_P.Constant_Value_cg - std::cos(a)) + std::sin(a) * std::sin
    (AutopilotLaws_P.Gain1_Gain_bk * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_lxx *
     AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_e,
    AutopilotLaws_P.HighPassFilter_C2_c, AutopilotLaws_P.HighPassFilter_C3_f, AutopilotLaws_P.HighPassFilter_C4_c,
    AutopilotLaws_U.in.time.dt, &rtb_Y_o, &AutopilotLaws_DWork.sf_LeadLagFilter_h);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_i * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_n, AutopilotLaws_P.LowPassFilter_C2_a, AutopilotLaws_P.LowPassFilter_C3_o,
    AutopilotLaws_P.LowPassFilter_C4_o, AutopilotLaws_U.in.time.dt, &rtb_Y_j5, &AutopilotLaws_DWork.sf_LeadLagFilter_m);
  a = (rtb_Y_o + rtb_Y_j5) * AutopilotLaws_P.ug_Gain_a;
  b_L = AutopilotLaws_P.Gain1_Gain_hm * external_limit;
  L = a + b_L;
  R = AutopilotLaws_P.Constant1_Value_b4 - AutopilotLaws_P.Constant2_Value_c;
  b_L = (AutopilotLaws_P.Gain1_Gain_mz * a + b_L) * AutopilotLaws_P.Gain_Gain_ie;
  if (R > AutopilotLaws_P.Switch_Threshold_b) {
    a = AutopilotLaws_P.Constant1_Value_a;
  } else {
    a = AutopilotLaws_P.Gain5_Gain_l * b_L;
  }

  rtb_Y_j5 = AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.data.VMAX_kn;
  rtb_Gain1_fy = rtb_Y_j5 * AutopilotLaws_P.Gain1_Gain_f1;
  if (rtb_Gain1_fy <= a) {
    if (R > AutopilotLaws_P.Switch1_Threshold_f) {
      a = AutopilotLaws_P.Constant_Value_p;
    } else {
      a = AutopilotLaws_P.Gain6_Gain_j * b_L;
    }

    if (rtb_Gain1_fy >= a) {
      a = rtb_Gain1_fy;
    }
  }

  a += AutopilotLaws_P.Gain_Gain_kj * L - external_limit;
  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, rtb_Gain_aa, AutopilotLaws_P.VS_Gain * rtb_Gain_aa,
    rtb_Gain1_na, AutopilotLaws_P.Gain_Gain_m0 * rtb_Gain1_na, a, AutopilotLaws_P.Gain_Gain_lr * a,
    AutopilotLaws_P.Constant_Value_ig, &R, &L);
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_hx * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_nd) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_nd;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_a) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_a;
  }

  external_limit = std::atan(AutopilotLaws_P.fpmtoms_Gain_i * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation_c) *
    AutopilotLaws_P.Gain_Gain_hm;
  a = AutopilotLaws_P.Gain1_Gain_fm * rtb_GainTheta1;
  rtb_Gain_aa = std::cos(a);
  rtb_Gain1_na = std::sin(a);
  b_L = AutopilotLaws_P.Gain1_Gain_hy * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_Gain1_fy = b_L - AutopilotLaws_P.Gain1_Gain_j2 * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  a = AutopilotLaws_P.ktstomps_Gain_c * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_m * (AutopilotLaws_P.GStoGS_CAS_Gain_o * a),
    AutopilotLaws_P.WashoutFilter_C1_l, AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_WashoutFilter_j);
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_d * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_g) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_g;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_aw) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_aw;
  }

  AutopilotLaws_LeadLagFilter(a - AutopilotLaws_P.g_Gain_g * (AutopilotLaws_P.Gain1_Gain_be *
    (AutopilotLaws_P.Gain_Gain_db * ((AutopilotLaws_P.Gain1_Gain_fv * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_i0 *
    (AutopilotLaws_P.Gain_Gain_ho * std::atan(AutopilotLaws_P.fpmtoms_Gain_e * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Saturation_c))) * (AutopilotLaws_P.Constant_Value_j - rtb_Gain_aa) + rtb_Gain1_na * std::sin(rtb_Gain1_fy)))),
    AutopilotLaws_P.HighPassFilter_C1_l, AutopilotLaws_P.HighPassFilter_C2_co, AutopilotLaws_P.HighPassFilter_C3_b,
    AutopilotLaws_P.HighPassFilter_C4_j, AutopilotLaws_U.in.time.dt, &b_L, &AutopilotLaws_DWork.sf_LeadLagFilter_l);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_n * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_f, AutopilotLaws_P.LowPassFilter_C2_p, AutopilotLaws_P.LowPassFilter_C3_a,
    AutopilotLaws_P.LowPassFilter_C4_g, AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LeadLagFilter_as);
  a = (b_L + a) * AutopilotLaws_P.ug_Gain_l;
  b_L = AutopilotLaws_P.Gain1_Gain_g1 * external_limit;
  rtb_Gain_aa = a + b_L;
  b_L = (AutopilotLaws_P.Gain1_Gain_ov * a + b_L) * AutopilotLaws_P.Gain_Gain_a2;
  AutopilotLaws_Voter1(AutopilotLaws_U.in.data.VLS_kn, AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VMAX_kn,
                       &a);
  a = (AutopilotLaws_U.in.data.V_ias_kn - a) * AutopilotLaws_P.Gain1_Gain_lxw;
  if ((Phi2 > AutopilotLaws_P.CompareToConstant_const_a) && (b_L < AutopilotLaws_P.CompareToConstant1_const_n) && (a <
       AutopilotLaws_P.CompareToConstant2_const_b)) {
    a = AutopilotLaws_P.Constant_Value_c;
  } else {
    if (Phi2 > AutopilotLaws_P.Switch2_Threshold) {
      rtb_Gain1_na = AutopilotLaws_P.Constant1_Value_mf;
    } else {
      rtb_Gain1_na = AutopilotLaws_P.Gain5_Gain_f * b_L;
    }

    if (a > rtb_Gain1_na) {
      a = rtb_Gain1_na;
    } else {
      if (Phi2 > AutopilotLaws_P.Switch1_Threshold_o) {
        b_L *= AutopilotLaws_P.Gain1_Gain_lt;
        if (AutopilotLaws_P.Constant2_Value > b_L) {
          b_L = AutopilotLaws_P.Constant2_Value;
        }
      } else {
        b_L *= AutopilotLaws_P.Gain6_Gain_l;
      }

      if (a < b_L) {
        a = b_L;
      }
    }
  }

  rtb_Gain_aa = (AutopilotLaws_P.Gain_Gain_ce * rtb_Gain_aa - external_limit) + a;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_a * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_l) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_l;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_hm) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_hm;
  }

  rtb_Gain1_na = AutopilotLaws_U.in.input.H_dot_c_fpm - AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Saturation_c = rtb_Gain1_na * AutopilotLaws_P.ftmintoms_Gain_l / rtb_Saturation_c;
  if (rtb_Saturation_c > 1.0) {
    rtb_Saturation_c = 1.0;
  } else if (rtb_Saturation_c < -1.0) {
    rtb_Saturation_c = -1.0;
  }

  rtb_Gain_gh = AutopilotLaws_P.Gain_Gain_ey * std::asin(rtb_Saturation_c);
  if (AutopilotLaws_U.in.input.vertical_mode == 50.0) {
    b_L = 0.3;
  } else {
    b_L = 0.1;
  }

  rtb_Cos1_j = 9.81 / (AutopilotLaws_U.in.data.V_tas_kn * 0.51444444444444448);
  limit = rtb_Cos1_j * b_L * 57.295779513082323;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_o * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_f) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_f;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_c) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_c;
  }

  external_limit = std::atan(AutopilotLaws_P.fpmtoms_Gain_o * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation_c) *
    AutopilotLaws_P.Gain_Gain_lx;
  a = AutopilotLaws_P.Gain1_Gain_hi * rtb_GainTheta1;
  rtb_Gain1_fy = std::cos(a);
  rtb_Cos1_pk = std::sin(a);
  b_L = AutopilotLaws_P.Gain1_Gain_hg * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_Add3_gy = b_L - AutopilotLaws_P.Gain1_Gain_da * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  a = AutopilotLaws_P.ktstomps_Gain_m * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_k * (AutopilotLaws_P.GStoGS_CAS_Gain_k * a),
    AutopilotLaws_P.WashoutFilter_C1_o, AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_WashoutFilter_fs);
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_db * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_hb) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_hb;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_k) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_k;
  }

  AutopilotLaws_LeadLagFilter(a - AutopilotLaws_P.g_Gain_m * (AutopilotLaws_P.Gain1_Gain_kdq *
    (AutopilotLaws_P.Gain_Gain_b5 * ((AutopilotLaws_P.Gain1_Gain_jn * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_ps *
    (AutopilotLaws_P.Gain_Gain_in * std::atan(AutopilotLaws_P.fpmtoms_Gain_ey * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Saturation_c))) * (AutopilotLaws_P.Constant_Value_od - rtb_Gain1_fy) + rtb_Cos1_pk * std::sin(rtb_Add3_gy)))),
    AutopilotLaws_P.HighPassFilter_C1_g, AutopilotLaws_P.HighPassFilter_C2_l, AutopilotLaws_P.HighPassFilter_C3_j,
    AutopilotLaws_P.HighPassFilter_C4_i, AutopilotLaws_U.in.time.dt, &b_L, &AutopilotLaws_DWork.sf_LeadLagFilter_b);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_c2 * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_m, AutopilotLaws_P.LowPassFilter_C2_l, AutopilotLaws_P.LowPassFilter_C3_i,
    AutopilotLaws_P.LowPassFilter_C4_k, AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LeadLagFilter_kq);
  a = (b_L + a) * AutopilotLaws_P.ug_Gain_aa;
  b_L = AutopilotLaws_P.Gain1_Gain_gf * external_limit;
  rtb_Gain1_fy = a + b_L;
  rtb_Cos1_pk = AutopilotLaws_P.Constant3_Value_h1 - AutopilotLaws_P.Constant4_Value_f;
  rtb_Saturation_c = (AutopilotLaws_P.Gain1_Gain_ovr * a + b_L) * AutopilotLaws_P.Gain_Gain_jy;
  if (rtb_Cos1_pk > AutopilotLaws_P.Switch_Threshold_o) {
    a = AutopilotLaws_P.Constant1_Value_m5;
  } else {
    a = AutopilotLaws_P.Gain5_Gain_h * rtb_Saturation_c;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &b_L);
  b_L = (AutopilotLaws_U.in.data.V_ias_kn - b_L) * AutopilotLaws_P.Gain1_Gain_dvi;
  if (b_L <= a) {
    if (rtb_Cos1_pk > AutopilotLaws_P.Switch1_Threshold_c) {
      a = AutopilotLaws_P.Constant_Value_b;
    } else {
      a = AutopilotLaws_P.Gain6_Gain_a * rtb_Saturation_c;
    }

    if (b_L >= a) {
      a = b_L;
    }
  }

  rtb_Add3_gy = (AutopilotLaws_P.Gain_Gain_j * rtb_Gain1_fy - external_limit) + a;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_bq * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_ba) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_ba;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_p) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_p;
  }

  external_limit = std::atan(AutopilotLaws_P.fpmtoms_Gain_p * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation_c) *
    AutopilotLaws_P.Gain_Gain_py;
  a = AutopilotLaws_P.Gain1_Gain_er * rtb_GainTheta1;
  rtb_Gain1_fy = std::cos(a);
  rtb_Cos1_pk = std::sin(a);
  b_L = AutopilotLaws_P.Gain1_Gain_ero * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_Y_o = b_L - AutopilotLaws_P.Gain1_Gain_fl * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  a = AutopilotLaws_P.ktstomps_Gain_a * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_i * (AutopilotLaws_P.GStoGS_CAS_Gain_n * a),
    AutopilotLaws_P.WashoutFilter_C1_p, AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_WashoutFilter_jh);
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_l5 * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_b3) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_b3;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_es) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_es;
  }

  AutopilotLaws_LeadLagFilter(a - AutopilotLaws_P.g_Gain_gr * (AutopilotLaws_P.Gain1_Gain_hv *
    (AutopilotLaws_P.Gain_Gain_mx * ((AutopilotLaws_P.Gain1_Gain_hk * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_ja *
    (AutopilotLaws_P.Gain_Gain_e5 * std::atan(AutopilotLaws_P.fpmtoms_Gain_j * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Saturation_c))) * (AutopilotLaws_P.Constant_Value_ia - rtb_Gain1_fy) + rtb_Cos1_pk * std::sin(rtb_Y_o)))),
    AutopilotLaws_P.HighPassFilter_C1_n, AutopilotLaws_P.HighPassFilter_C2_m, AutopilotLaws_P.HighPassFilter_C3_k,
    AutopilotLaws_P.HighPassFilter_C4_h, AutopilotLaws_U.in.time.dt, &b_L, &AutopilotLaws_DWork.sf_LeadLagFilter_c);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_o * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_l, AutopilotLaws_P.LowPassFilter_C2_c, AutopilotLaws_P.LowPassFilter_C3_g,
    AutopilotLaws_P.LowPassFilter_C4_d, AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LeadLagFilter_p);
  a = (b_L + a) * AutopilotLaws_P.ug_Gain_f;
  b_L = AutopilotLaws_P.Gain1_Gain_ot * external_limit;
  rtb_Gain1_fy = a + b_L;
  rtb_Cos1_pk = AutopilotLaws_P.Constant1_Value_d - AutopilotLaws_P.Constant2_Value_k;
  b_L = (AutopilotLaws_P.Gain1_Gain_ou * a + b_L) * AutopilotLaws_P.Gain_Gain_jg;
  if (rtb_Cos1_pk > AutopilotLaws_P.Switch_Threshold_a) {
    a = AutopilotLaws_P.Constant1_Value_mi;
  } else {
    a = AutopilotLaws_P.Gain5_Gain_g * b_L;
  }

  rtb_Saturation_c = rtb_Y_j5 * AutopilotLaws_P.Gain1_Gain_gy;
  if (rtb_Saturation_c <= a) {
    if (rtb_Cos1_pk > AutopilotLaws_P.Switch1_Threshold_b) {
      a = AutopilotLaws_P.Constant_Value_o;
    } else {
      a = AutopilotLaws_P.Gain6_Gain_c * b_L;
    }

    if (rtb_Saturation_c >= a) {
      a = rtb_Saturation_c;
    }
  }

  a += AutopilotLaws_P.Gain_Gain_dm * rtb_Gain1_fy - external_limit;
  external_limit = AutopilotLaws_P.VS_Gain_h * rtb_Gain_gh;
  if (limit < external_limit) {
    external_limit = limit;
  }

  if (-limit > external_limit) {
    external_limit = -limit;
  }

  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, rtb_Gain_gh, external_limit, rtb_Add3_gy,
    AutopilotLaws_P.Gain_Gain_h4 * rtb_Add3_gy, a, AutopilotLaws_P.Gain_Gain_eq * a, AutopilotLaws_P.Constant_Value_ga,
    &rtb_Cos1_pk, &rtb_Gain1_fy);
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_c * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_oz) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_oz;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_ou) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_ou;
  }

  rtb_Gain_gh = AutopilotLaws_U.in.input.FPA_c_deg - std::atan(AutopilotLaws_P.fpmtoms_Gain_ps *
    AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation_c) * AutopilotLaws_P.Gain_Gain_g;
  limit = rtb_Cos1_j * 0.1 * 57.295779513082323;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_cv * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_bb) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_bb;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_a4) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_a4;
  }

  external_limit = std::atan(AutopilotLaws_P.fpmtoms_Gain_d * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation_c) *
    AutopilotLaws_P.Gain_Gain_hv;
  a = AutopilotLaws_P.Gain1_Gain_gfa * rtb_GainTheta1;
  b_L = std::cos(a);
  rtb_Cos1_j = std::sin(a);
  a = AutopilotLaws_P.ktstomps_Gain_j * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_kb * (AutopilotLaws_P.GStoGS_CAS_Gain_o5 * a),
    AutopilotLaws_P.WashoutFilter_C1_j, AutopilotLaws_U.in.time.dt, &rtb_Y_o, &AutopilotLaws_DWork.sf_WashoutFilter_h);
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_k * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_pj) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_pj;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_py) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_py;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_o - AutopilotLaws_P.g_Gain_l * (AutopilotLaws_P.Gain1_Gain_n4 *
    (AutopilotLaws_P.Gain_Gain_bc * ((AutopilotLaws_P.Gain1_Gain_ej * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_jv *
    (AutopilotLaws_P.Gain_Gain_bf * std::atan(AutopilotLaws_P.fpmtoms_Gain_f * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Saturation_c))) * (AutopilotLaws_P.Constant_Value_l - b_L) + rtb_Cos1_j * std::sin(AutopilotLaws_P.Gain1_Gain_j4
    * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_kw *
    AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_i,
    AutopilotLaws_P.HighPassFilter_C2_h, AutopilotLaws_P.HighPassFilter_C3_m, AutopilotLaws_P.HighPassFilter_C4_n,
    AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LeadLagFilter_e);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_k * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_l4, AutopilotLaws_P.LowPassFilter_C2_po, AutopilotLaws_P.LowPassFilter_C3_f,
    AutopilotLaws_P.LowPassFilter_C4_dt, AutopilotLaws_U.in.time.dt, &rtb_Y_o, &AutopilotLaws_DWork.sf_LeadLagFilter_k);
  a = (a + rtb_Y_o) * AutopilotLaws_P.ug_Gain_n;
  b_L = AutopilotLaws_P.Gain1_Gain_b1 * external_limit;
  rtb_Saturation_c = a + b_L;
  rtb_Cos1_j = AutopilotLaws_P.Constant3_Value_nk - AutopilotLaws_P.Constant4_Value_o;
  b_L = (AutopilotLaws_P.Gain1_Gain_on * a + b_L) * AutopilotLaws_P.Gain_Gain_hy;
  if (rtb_Cos1_j > AutopilotLaws_P.Switch_Threshold_d) {
    a = AutopilotLaws_P.Constant1_Value_m;
  } else {
    a = AutopilotLaws_P.Gain5_Gain_b * b_L;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &rtb_Y_o);
  rtb_Add3_gy = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_o) * AutopilotLaws_P.Gain1_Gain_m1;
  if (rtb_Add3_gy <= a) {
    if (rtb_Cos1_j > AutopilotLaws_P.Switch1_Threshold_d) {
      a = AutopilotLaws_P.Constant_Value_p0;
    } else {
      a = AutopilotLaws_P.Gain6_Gain_n * b_L;
    }

    if (rtb_Add3_gy >= a) {
      a = rtb_Add3_gy;
    }
  }

  rtb_Add3_gy = (AutopilotLaws_P.Gain_Gain_d0 * rtb_Saturation_c - external_limit) + a;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_hi * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_cv) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_cv;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_hd) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_hd;
  }

  external_limit = std::atan(AutopilotLaws_P.fpmtoms_Gain_o2 * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation_c) *
    AutopilotLaws_P.Gain_Gain_pp;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_i * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_nu) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_nu;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_ae) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_ae;
  }

  a = AutopilotLaws_P.Gain1_Gain_ky * rtb_GainTheta1;
  b_L = std::cos(a);
  rtb_Cos1_j = std::sin(a);
  a = AutopilotLaws_P.ktstomps_Gain_l * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_ip * (AutopilotLaws_P.GStoGS_CAS_Gain_e * a),
    AutopilotLaws_P.WashoutFilter_C1_c, AutopilotLaws_U.in.time.dt, &rtb_Y_o, &AutopilotLaws_DWork.sf_WashoutFilter_g5);
  AutopilotLaws_LeadLagFilter(rtb_Y_o - AutopilotLaws_P.g_Gain_hq * (AutopilotLaws_P.Gain1_Gain_mx *
    (AutopilotLaws_P.Gain_Gain_d3 * ((AutopilotLaws_P.Gain1_Gain_iw * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_lw *
    (AutopilotLaws_P.Gain_Gain_ej * std::atan(AutopilotLaws_P.fpmtoms_Gain_h * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Saturation_c))) * (AutopilotLaws_P.Constant_Value_f - b_L) + rtb_Cos1_j * std::sin(AutopilotLaws_P.Gain1_Gain_ip
    * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_nrn *
    AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_d,
    AutopilotLaws_P.HighPassFilter_C2_i, AutopilotLaws_P.HighPassFilter_C3_d, AutopilotLaws_P.HighPassFilter_C4_nr,
    AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LeadLagFilter_j);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_mh * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_e, AutopilotLaws_P.LowPassFilter_C2_i, AutopilotLaws_P.LowPassFilter_C3_o5,
    AutopilotLaws_P.LowPassFilter_C4_f, AutopilotLaws_U.in.time.dt, &rtb_Y_o, &AutopilotLaws_DWork.sf_LeadLagFilter_a);
  a = (a + rtb_Y_o) * AutopilotLaws_P.ug_Gain_e;
  b_L = AutopilotLaws_P.Gain1_Gain_be1 * external_limit;
  rtb_Saturation_c = a + b_L;
  rtb_Cos1_j = AutopilotLaws_P.Constant1_Value_o - AutopilotLaws_P.Constant2_Value_hd;
  rtb_Y_o = (AutopilotLaws_P.Gain1_Gain_nj * a + b_L) * AutopilotLaws_P.Gain_Gain_aq;
  if (rtb_Cos1_j > AutopilotLaws_P.Switch_Threshold_g) {
    a = AutopilotLaws_P.Constant1_Value_f;
  } else {
    a = AutopilotLaws_P.Gain5_Gain_a * rtb_Y_o;
  }

  b_L = AutopilotLaws_P.Gain1_Gain_fle * rtb_Y_j5;
  if (b_L <= a) {
    if (rtb_Cos1_j > AutopilotLaws_P.Switch1_Threshold_h) {
      a = AutopilotLaws_P.Constant_Value_i;
    } else {
      a = AutopilotLaws_P.Gain6_Gain_g * rtb_Y_o;
    }

    if (b_L >= a) {
      a = b_L;
    }
  }

  a += AutopilotLaws_P.Gain_Gain_gx * rtb_Saturation_c - external_limit;
  external_limit = AutopilotLaws_P.Gain_Gain_c3 * rtb_Gain_gh;
  if (limit < external_limit) {
    external_limit = limit;
  }

  if (-limit > external_limit) {
    external_limit = -limit;
  }

  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, rtb_Gain_gh, external_limit, rtb_Add3_gy,
    AutopilotLaws_P.Gain_Gain_fnw * rtb_Add3_gy, a, AutopilotLaws_P.Gain_Gain_ko * a, AutopilotLaws_P.Constant_Value_fo,
    &rtb_Cos1_j, &limit);
  rtb_Gain_gh = AutopilotLaws_P.Gain2_Gain_m * AutopilotLaws_U.in.data.H_dot_ft_min *
    AutopilotLaws_P.DiscreteDerivativeVariableTs1_Gain;
  external_limit = rtb_Gain_gh - AutopilotLaws_DWork.Delay_DSTATE_hi;
  AutopilotLaws_LagFilter(external_limit / AutopilotLaws_U.in.time.dt, AutopilotLaws_P.LagFilter2_C1_k,
    AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LagFilter_b);
  AutopilotLaws_WashoutFilter(a, AutopilotLaws_P.WashoutFilter1_C1, AutopilotLaws_U.in.time.dt, &external_limit,
    &AutopilotLaws_DWork.sf_WashoutFilter_n);
  rtb_Compare_o1 = ((AutopilotLaws_U.in.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK_const) ||
                    (AutopilotLaws_U.in.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK2_const));
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain4_Gain_g * external_limit, rtb_Compare_o1, &a);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_gs_error_deg, AutopilotLaws_P.LagFilter1_C1_p,
    AutopilotLaws_U.in.time.dt, &rtb_Y_o, &AutopilotLaws_DWork.sf_LagFilter_cu);
  rtb_Add3_gy = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain_o * rtb_Y_o;
  AutopilotLaws_LagFilter(rtb_Y_o + AutopilotLaws_P.Gain3_Gain_n * ((rtb_Add3_gy - AutopilotLaws_DWork.Delay_DSTATE_n) /
    AutopilotLaws_U.in.time.dt), AutopilotLaws_P.LagFilter_C1_m, AutopilotLaws_U.in.time.dt, &b_L,
    &AutopilotLaws_DWork.sf_LagFilter_j);
  external_limit = look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_ec, AutopilotLaws_P.ScheduledGain_Table_l, 5U);
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain3_Gain_c * (a + b_L * external_limit),
    (AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.CompareToConstant_const_k) &&
    AutopilotLaws_U.in.data.nav_gs_valid, &rtb_Saturation_c);
  AutopilotLaws_storevalue(rtb_Saturation == AutopilotLaws_P.CompareToConstant6_const,
    AutopilotLaws_Y.out.data.nav_gs_deg, &external_limit, &AutopilotLaws_DWork.sf_storevalue_g);
  if (external_limit > AutopilotLaws_P.Saturation_UpperSat_e0) {
    external_limit = AutopilotLaws_P.Saturation_UpperSat_e0;
  } else if (external_limit < AutopilotLaws_P.Saturation_LowerSat_ph) {
    external_limit = AutopilotLaws_P.Saturation_LowerSat_ph;
  }

  b_L = AutopilotLaws_P.kntoms_Gain_k4 * AutopilotLaws_U.in.data.V_gnd_kn;
  if (b_L > AutopilotLaws_P.Saturation_UpperSat_eb) {
    b_L = AutopilotLaws_P.Saturation_UpperSat_eb;
  } else if (b_L < AutopilotLaws_P.Saturation_LowerSat_gk) {
    b_L = AutopilotLaws_P.Saturation_LowerSat_gk;
  }

  a = std::atan(AutopilotLaws_P.fpmtoms_Gain_g4 * AutopilotLaws_U.in.data.H_dot_ft_min / b_L) *
    AutopilotLaws_P.Gain_Gain_ow;
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain2_Gain_l * (external_limit - a), rtb_Compare_o1, &b_L);
  AutopilotLaws_Voter1(rtb_Saturation_c + b_L, AutopilotLaws_P.Gain1_Gain_d4 * ((external_limit +
    AutopilotLaws_P.Bias_Bias) - a), AutopilotLaws_P.Gain_Gain_eyl * ((external_limit + AutopilotLaws_P.Bias1_Bias) - a),
                       &rtb_Y_nj);
  external_limit = rtb_GainTheta - AutopilotLaws_P.Constant2_Value_f;
  rtb_Gain4_m = AutopilotLaws_P.Gain4_Gain_o * external_limit;
  rtb_Gain5_n = AutopilotLaws_P.Gain5_Gain_c * AutopilotLaws_U.in.data.bz_m_s2;
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.bx_m_s2, AutopilotLaws_P.WashoutFilter_C1_m,
    AutopilotLaws_U.in.time.dt, &rtb_Y_j5, &AutopilotLaws_DWork.sf_WashoutFilter_g);
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.H_ind_ft, AutopilotLaws_P.WashoutFilter_C1_ej,
    AutopilotLaws_U.in.time.dt, &external_limit, &AutopilotLaws_DWork.sf_WashoutFilter_b);
  if (AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.Saturation_UpperSat_e0a) {
    b_L = AutopilotLaws_P.Saturation_UpperSat_e0a;
  } else if (AutopilotLaws_U.in.data.H_radio_ft < AutopilotLaws_P.Saturation_LowerSat_m) {
    b_L = AutopilotLaws_P.Saturation_LowerSat_m;
  } else {
    b_L = AutopilotLaws_U.in.data.H_radio_ft;
  }

  AutopilotLaws_LagFilter(b_L, AutopilotLaws_P.LagFilter_C1_p, AutopilotLaws_U.in.time.dt, &a,
    &AutopilotLaws_DWork.sf_LagFilter_ov);
  rtb_Y_o = (external_limit + a) * AutopilotLaws_P.DiscreteDerivativeVariableTs2_Gain;
  external_limit = (rtb_Y_o - AutopilotLaws_DWork.Delay_DSTATE_p) / AutopilotLaws_U.in.time.dt;
  AutopilotLaws_LagFilter(AutopilotLaws_P.Gain2_Gain_f * external_limit, AutopilotLaws_P.LagFilter3_C1,
    AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LagFilter_f);
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.H_dot_ft_min, AutopilotLaws_P.WashoutFilter1_C1_g,
    AutopilotLaws_U.in.time.dt, &external_limit, &AutopilotLaws_DWork.sf_WashoutFilter_f);
  a += external_limit;
  rtb_Compare_o1 = (rtb_Saturation == AutopilotLaws_P.CompareToConstant7_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty) {
    AutopilotLaws_DWork.wasActive = rtb_Compare_o1;
    AutopilotLaws_DWork.wasActive_not_empty = true;
  }

  if ((!AutopilotLaws_DWork.wasActive) && rtb_Compare_o1) {
    external_limit = std::abs(a) / 60.0;
    AutopilotLaws_DWork.Tau = AutopilotLaws_U.in.data.H_radio_ft / (external_limit - 1.6666666666666667);
    AutopilotLaws_DWork.H_bias = AutopilotLaws_DWork.Tau * external_limit - AutopilotLaws_U.in.data.H_radio_ft;
  }

  if (rtb_Compare_o1) {
    external_limit = -1.0 / AutopilotLaws_DWork.Tau * (AutopilotLaws_U.in.data.H_radio_ft + AutopilotLaws_DWork.H_bias) *
      60.0;
  } else {
    external_limit = a;
  }

  AutopilotLaws_DWork.wasActive = rtb_Compare_o1;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_av * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_ew) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_ew;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_an) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_an;
  }

  rtb_Saturation_c = (external_limit - a) * AutopilotLaws_P.ftmintoms_Gain_j / rtb_Saturation_c;
  if (rtb_Saturation_c > 1.0) {
    rtb_Saturation_c = 1.0;
  } else if (rtb_Saturation_c < -1.0) {
    rtb_Saturation_c = -1.0;
  }

  rtb_Gain_iq = AutopilotLaws_P.Gain_Gain_by * std::asin(rtb_Saturation_c);
  rtb_Sum_ae = AutopilotLaws_P.Constant1_Value_o0 - rtb_GainTheta;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_iv * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_je) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_je;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_hf) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_hf;
  }

  external_limit = std::atan(AutopilotLaws_P.fpmtoms_Gain_n * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation_c) *
    AutopilotLaws_P.Gain_Gain_nf;
  a = AutopilotLaws_P.Gain1_Gain_ij * rtb_GainTheta1;
  rtb_GainTheta1 = std::cos(a);
  rtb_Cos1_kb = std::sin(a);
  b_L = AutopilotLaws_P.Gain1_Gain_ef * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_Add3_dx = b_L - AutopilotLaws_P.Gain1_Gain_gk * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  a = AutopilotLaws_P.ktstomps_Gain_jr * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_ks * (AutopilotLaws_P.GStoGS_CAS_Gain_n2 * a),
    AutopilotLaws_P.WashoutFilter_C1_d, AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_WashoutFilter_l);
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_ka * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_dh) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_dh;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_m2) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_m2;
  }

  AutopilotLaws_LeadLagFilter(a - AutopilotLaws_P.g_Gain_l0 * (AutopilotLaws_P.Gain1_Gain_et *
    (AutopilotLaws_P.Gain_Gain_an * ((AutopilotLaws_P.Gain1_Gain_iv * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_it *
    (AutopilotLaws_P.Gain_Gain_h3 * std::atan(AutopilotLaws_P.fpmtoms_Gain_au * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Saturation_c))) * (AutopilotLaws_P.Constant_Value_f3 - rtb_GainTheta1) + rtb_Cos1_kb * std::sin(rtb_Add3_dx)))),
    AutopilotLaws_P.HighPassFilter_C1_i0, AutopilotLaws_P.HighPassFilter_C2_j, AutopilotLaws_P.HighPassFilter_C3_i,
    AutopilotLaws_P.HighPassFilter_C4_nm, AutopilotLaws_U.in.time.dt, &b_L, &AutopilotLaws_DWork.sf_LeadLagFilter_oi);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_il * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_g, AutopilotLaws_P.LowPassFilter_C2_o, AutopilotLaws_P.LowPassFilter_C3_l,
    AutopilotLaws_P.LowPassFilter_C4_p, AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LeadLagFilter_j0);
  a = (b_L + a) * AutopilotLaws_P.ug_Gain_c;
  b_L = AutopilotLaws_P.Gain1_Gain_ejc * external_limit;
  rtb_GainTheta1 = a + b_L;
  rtb_Saturation_c = AutopilotLaws_P.Constant2_Value_kz - AutopilotLaws_U.in.data.H_ind_ft;
  b_L = (AutopilotLaws_P.Gain1_Gain_h3 * a + b_L) * AutopilotLaws_P.Gain_Gain_ox;
  a = (AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.input.V_c_kn) * AutopilotLaws_P.Gain1_Gain_fo;
  if ((rtb_Saturation_c > AutopilotLaws_P.CompareToConstant_const_h) && (b_L <
       AutopilotLaws_P.CompareToConstant1_const_g) && (a < AutopilotLaws_P.CompareToConstant2_const_m)) {
    a = AutopilotLaws_P.Constant_Value_gj;
  } else {
    if (rtb_Saturation_c > AutopilotLaws_P.Switch2_Threshold_b) {
      rtb_Cos1_kb = AutopilotLaws_P.Constant1_Value_mq;
    } else {
      rtb_Cos1_kb = AutopilotLaws_P.Gain5_Gain_k * b_L;
    }

    if (a > rtb_Cos1_kb) {
      a = rtb_Cos1_kb;
    } else {
      if (rtb_Saturation_c > AutopilotLaws_P.Switch1_Threshold_n) {
        b_L *= AutopilotLaws_P.Gain1_Gain_n;
        if (AutopilotLaws_P.Constant2_Value_i > b_L) {
          b_L = AutopilotLaws_P.Constant2_Value_i;
        }
      } else {
        b_L *= AutopilotLaws_P.Gain6_Gain_o;
      }

      if (a < b_L) {
        a = b_L;
      }
    }
  }

  rtb_GainTheta1 = (AutopilotLaws_P.Gain_Gain_p2 * rtb_GainTheta1 - external_limit) + a;
  rtb_Saturation_c = AutopilotLaws_P.kntoms_Gain_iw * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Saturation_c > AutopilotLaws_P.Saturation_UpperSat_jt) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_UpperSat_jt;
  } else if (rtb_Saturation_c < AutopilotLaws_P.Saturation_LowerSat_ih) {
    rtb_Saturation_c = AutopilotLaws_P.Saturation_LowerSat_ih;
  }

  rtb_Saturation_c = (AutopilotLaws_P.Constant_Value_iaf - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_lv / rtb_Saturation_c;
  if (rtb_Saturation_c > 1.0) {
    rtb_Saturation_c = 1.0;
  } else if (rtb_Saturation_c < -1.0) {
    rtb_Saturation_c = -1.0;
  }

  b_L = AutopilotLaws_P.Gain_Gain_o1 * std::asin(rtb_Saturation_c);
  AutopilotLaws_Voter1(rtb_Sum_ae, rtb_GainTheta1, b_L, &external_limit);
  a = (rtb_Gain1_na * AutopilotLaws_P.Gain_Gain_pe + Phi2) * AutopilotLaws_P.Gain1_Gain_f2;
  switch (static_cast<int32_T>(rtb_Saturation)) {
   case 0:
    R = AutopilotLaws_P.Constant_Value_d;
    break;

   case 1:
    R = rtb_Saturation1;
    break;

   case 2:
    break;

   case 3:
    R = rtb_Gain_aa;
    break;

   case 4:
    R = rtb_Cos1_pk;
    break;

   case 5:
    R = rtb_Cos1_j;
    break;

   case 6:
    R = AutopilotLaws_P.Gain1_Gain_d * rtb_Y_nj;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch1_Threshold_j) {
      R = AutopilotLaws_P.Gain2_Gain_h * rtb_Gain4_m;
    } else {
      R = (AutopilotLaws_P.Gain1_Gain_ix * rtb_Y_j5 + rtb_Gain5_n) + rtb_Gain_iq;
    }
    break;

   case 8:
    R = external_limit;
    break;

   default:
    R = a;
    break;
  }

  if (R > AutopilotLaws_P.Constant1_Value_i) {
    external_limit = AutopilotLaws_P.Constant1_Value_i;
  } else {
    external_limit = AutopilotLaws_P.Gain1_Gain_nu * AutopilotLaws_P.Constant1_Value_i;
    if (R >= external_limit) {
      external_limit = R;
    }
  }

  external_limit -= b_R;
  AutopilotLaws_DWork.icLoad_f = ((AutopilotLaws_Y.out.output.ap_on == 0.0) || AutopilotLaws_DWork.icLoad_f);
  if (AutopilotLaws_DWork.icLoad_f) {
    AutopilotLaws_DWork.Delay_DSTATE_h2 = rtb_GainTheta;
  }

  AutopilotLaws_Voter1(rtb_Sum_ae, AutopilotLaws_P.Gain_Gain_jx * rtb_GainTheta1, AutopilotLaws_P.VS_Gain_nx * b_L, &b_R);
  switch (static_cast<int32_T>(rtb_Saturation)) {
   case 0:
    a = AutopilotLaws_P.Constant_Value_d;
    break;

   case 1:
    a = AutopilotLaws_P.VS_Gain_n * rtb_Saturation1;
    break;

   case 2:
    a = L;
    break;

   case 3:
    a = AutopilotLaws_P.Gain_Gain_f * rtb_Gain_aa;
    break;

   case 4:
    a = rtb_Gain1_fy;
    break;

   case 5:
    a = limit;
    break;

   case 6:
    a = rtb_Y_nj;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch_Threshold) {
      a = rtb_Gain4_m;
    } else {
      a = (AutopilotLaws_P.Gain3_Gain_l * rtb_Y_j5 + rtb_Gain5_n) + AutopilotLaws_P.VS_Gain_e * rtb_Gain_iq;
    }
    break;

   case 8:
    a = b_R;
    break;
  }

  a += rtb_GainTheta;
  if (a > AutopilotLaws_P.Constant1_Value_i) {
    a = AutopilotLaws_P.Constant1_Value_i;
  } else {
    rtb_GainTheta1 = AutopilotLaws_P.Gain1_Gain_m * AutopilotLaws_P.Constant1_Value_i;
    if (a < rtb_GainTheta1) {
      a = rtb_GainTheta1;
    }
  }

  rtb_Saturation_c = a - AutopilotLaws_DWork.Delay_DSTATE_h2;
  a = AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (rtb_Saturation_c < a) {
    a = rtb_Saturation_c;
  }

  b_L = AutopilotLaws_P.Gain1_Gain_i0l * AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (a > b_L) {
    b_L = a;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h2 += b_L;
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h2, AutopilotLaws_P.LagFilter_C1_i,
    AutopilotLaws_U.in.time.dt, &b_L, &AutopilotLaws_DWork.sf_LagFilter_gn);
  AutopilotLaws_RateLimiter(AutopilotLaws_Y.out.output.ap_on, AutopilotLaws_P.RateLimiterVariableTs_up_i,
    AutopilotLaws_P.RateLimiterVariableTs_lo_o, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_p, &a, &AutopilotLaws_DWork.sf_RateLimiter_eb);
  if (a > AutopilotLaws_P.Saturation_UpperSat_ix) {
    a = AutopilotLaws_P.Saturation_UpperSat_ix;
  } else if (a < AutopilotLaws_P.Saturation_LowerSat_eq) {
    a = AutopilotLaws_P.Saturation_LowerSat_eq;
  }

  AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = external_limit;
  AutopilotLaws_Y.out.output.autopilot.Theta_c_deg = (AutopilotLaws_P.Constant_Value_i4 - a) * rtb_GainTheta + b_L * a;
  for (rtb_on_ground = 0; rtb_on_ground < 99; rtb_on_ground++) {
    AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground + 1];
    AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground + 1];
  }

  AutopilotLaws_DWork.Delay_DSTATE_l[99] = rtb_valid;
  AutopilotLaws_DWork.Delay_DSTATE_h5[99] = rtb_valid_o;
  AutopilotLaws_DWork.Delay_DSTATE_e = rtb_dme;
  AutopilotLaws_DWork.icLoad = false;
  AutopilotLaws_DWork.Delay_DSTATE_hi = rtb_Gain_gh;
  AutopilotLaws_DWork.Delay_DSTATE_n = rtb_Add3_gy;
  AutopilotLaws_DWork.Delay_DSTATE_p = rtb_Y_o;
  AutopilotLaws_DWork.icLoad_f = false;
}

void AutopilotLawsModelClass::initialize()
{
  {
    real_T rtb_out_f;
    int32_T i;
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
    for (i = 0; i < 100; i++) {
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

AutopilotLawsModelClass::AutopilotLawsModelClass() :
  AutopilotLaws_B(),
  AutopilotLaws_DWork(),
  AutopilotLaws_U(),
  AutopilotLaws_Y()
{
}

AutopilotLawsModelClass::~AutopilotLawsModelClass()
{
}
