#include "AutopilotLaws.h"
#include "AutopilotLaws_private.h"
#include "look1_binlxpw.h"
#include "mod_lHmooAo5.h"
#include "rt_modd.h"

const uint8_T AutopilotLaws_IN_any = 1U;
const uint8_T AutopilotLaws_IN_left = 2U;
const uint8_T AutopilotLaws_IN_right = 3U;
const uint8_T AutopilotLaws_IN_any_o = 1U;
const uint8_T AutopilotLaws_IN_left_f = 2U;
const uint8_T AutopilotLaws_IN_right_l = 3U;
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
    localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_any_o;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c15_AutopilotLaws) {
     case AutopilotLaws_IN_any_o:
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
      break;

     case AutopilotLaws_IN_left_f:
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
      break;

     default:
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
  *rty_FD, real_T *rty_AP)
{
  real_T rtu_in_0;
  if (rtu_in->input.V_c_kn <= rtu_in->data.VLS_kn) {
    rtu_in_0 = rtu_in->data.VLS_kn - 5.0;
  } else {
    rtu_in_0 = rtu_in->data.VLS_kn;
  }

  if (rtu_in->data.V_ias_kn < rtu_in_0 + 15.0) {
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
  } else if (rtu_in->data.V_ias_kn > rtu_in->data.VMAX_kn - 15.0) {
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

void AutopilotLawsModelClass::AutopilotLaws_VSLimiter(real_T rtu_u, real_T rtu_V_tas_kn, real_T *rty_y)
{
  real_T limit;
  real_T y;
  limit = 9.81 / (rtu_V_tas_kn * 0.51444444444444448) * 0.1 * 57.295779513082323;
  if (limit < rtu_u) {
    y = limit;
  } else {
    y = rtu_u;
  }

  if (-limit > y) {
    *rty_y = -limit;
  } else {
    *rty_y = y;
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
  real_T rtb_Add1_om;
  real_T rtb_Add3_h;
  real_T rtb_Add3_jp;
  real_T rtb_Cos1_d;
  real_T rtb_FD_d;
  real_T rtb_Gain4_m;
  real_T rtb_Gain5;
  real_T rtb_GainTheta;
  real_T rtb_GainTheta1;
  real_T rtb_Gain_of;
  real_T rtb_Saturation;
  real_T rtb_Saturation1;
  real_T rtb_Sum2_g;
  real_T rtb_Sum2_p;
  real_T rtb_Sum_ae;
  real_T rtb_Tsxlo;
  real_T rtb_Y_e;
  real_T rtb_Y_j;
  real_T rtb_Y_m;
  real_T rtb_dme;
  real_T rtb_out_f;
  int32_T i;
  int32_T rtb_on_ground;
  boolean_T guard1 = false;
  boolean_T rtb_Compare_g0;
  boolean_T rtb_Compare_o1;
  boolean_T rtb_Delay_j;
  boolean_T rtb_valid;
  boolean_T rtb_valid_d;
  rtb_Compare_o1 = ((AutopilotLaws_U.in.input.enabled_AP1 != 0.0) || (AutopilotLaws_U.in.input.enabled_AP2 != 0.0));
  rtb_GainTheta = AutopilotLaws_P.GainTheta_Gain * AutopilotLaws_U.in.data.Theta_deg;
  rtb_GainTheta1 = AutopilotLaws_P.GainTheta1_Gain * AutopilotLaws_U.in.data.Phi_deg;
  rtb_dme = 0.017453292519943295 * rtb_GainTheta;
  a = 0.017453292519943295 * rtb_GainTheta1;
  b_R = std::tan(rtb_dme);
  rtb_out_f = std::sin(a);
  a = std::cos(a);
  result_tmp[0] = 1.0;
  result_tmp[3] = rtb_out_f * b_R;
  result_tmp[6] = a * b_R;
  result_tmp[1] = 0.0;
  result_tmp[4] = a;
  result_tmp[7] = -rtb_out_f;
  result_tmp[2] = 0.0;
  Phi2 = std::cos(rtb_dme);
  b_R = 1.0 / Phi2;
  result_tmp[5] = b_R * rtb_out_f;
  result_tmp[8] = b_R * a;
  b_R = AutopilotLaws_P.Gain_Gain_de * AutopilotLaws_U.in.data.p_rad_s * AutopilotLaws_P.Gainpk_Gain;
  rtb_Saturation = AutopilotLaws_P.Gain_Gain_d * AutopilotLaws_U.in.data.q_rad_s * AutopilotLaws_P.Gainqk_Gain;
  rtb_Saturation1 = AutopilotLaws_P.Gain_Gain_m * AutopilotLaws_U.in.data.r_rad_s;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result[rtb_on_ground] = result_tmp[rtb_on_ground + 6] * rtb_Saturation1 + (result_tmp[rtb_on_ground + 3] *
      rtb_Saturation + result_tmp[rtb_on_ground] * b_R);
  }

  rtb_Saturation = std::sin(rtb_dme);
  result_tmp[0] = Phi2;
  result_tmp[3] = 0.0;
  result_tmp[6] = -rtb_Saturation;
  result_tmp[1] = rtb_out_f * rtb_Saturation;
  result_tmp[4] = a;
  result_tmp[7] = Phi2 * rtb_out_f;
  result_tmp[2] = a * rtb_Saturation;
  result_tmp[5] = 0.0 - rtb_out_f;
  result_tmp[8] = a * Phi2;
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
    rtb_out_f = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lon - AutopilotLaws_U.in.data.aircraft_position.lon) *
                         0.017453292519943295 / 2.0);
    a = std::cos(0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lat) * std::cos(0.017453292519943295 *
      AutopilotLaws_U.in.data.nav_loc_position.lat) * rtb_out_f * rtb_out_f + a * a;
    rtb_dme = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
    rtb_out_f = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_loc_position.alt;
    rtb_dme = std::sqrt(rtb_dme * rtb_dme + rtb_out_f * rtb_out_f) / 1852.0;
  } else {
    rtb_dme = 0.0;
  }

  rtb_Saturation = 0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lat;
  Phi2 = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_loc_position.lat;
  rtb_Saturation1 = 0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lon;
  a = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lat - AutopilotLaws_U.in.data.aircraft_position.lat) *
               0.017453292519943295 / 2.0);
  rtb_out_f = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lon - AutopilotLaws_U.in.data.aircraft_position.lon) *
                       0.017453292519943295 / 2.0);
  a = std::cos(rtb_Saturation) * std::cos(Phi2) * rtb_out_f * rtb_out_f + a * a;
  a = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  rtb_out_f = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_loc_position.alt;
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
  if (std::abs(std::sqrt(a * a + rtb_out_f * rtb_out_f) / 1852.0) < 30.0) {
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
  rtb_out_f = std::sin((AutopilotLaws_U.in.data.nav_gs_position.lon - AutopilotLaws_U.in.data.aircraft_position.lon) *
                       0.017453292519943295 / 2.0);
  L = std::cos(Phi2);
  R = b_L;
  a = b_L * L * rtb_out_f * rtb_out_f + a * a;
  a = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  rtb_out_f = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_gs_position.alt;
  a = std::sqrt(a * a + rtb_out_f * rtb_out_f);
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
      rtb_valid_d = true;
      a = std::asin(rtb_out_f / a) * 57.295779513082323 - AutopilotLaws_DWork.nav_gs_deg;
    } else {
      guard1 = true;
    }
  } else {
    guard1 = true;
  }

  if (guard1) {
    rtb_valid_d = false;
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
  AutopilotLaws_Y.out.data.nav_e_gs_valid = rtb_valid_d;
  AutopilotLaws_Y.out.data.nav_e_gs_error_deg = a;
  AutopilotLaws_Y.out.data.flight_guidance_xtk_nmi = AutopilotLaws_U.in.data.flight_guidance_xtk_nmi;
  AutopilotLaws_Y.out.data.flight_guidance_tae_deg = AutopilotLaws_U.in.data.flight_guidance_tae_deg;
  AutopilotLaws_Y.out.data.flight_guidance_phi_deg = AutopilotLaws_U.in.data.flight_guidance_phi_deg;
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

  b_R = rt_modd(rt_modd(AutopilotLaws_U.in.data.Psi_magnetic_track_deg + b_R, AutopilotLaws_P.Constant3_Value_b) +
                AutopilotLaws_P.Constant3_Value_b, AutopilotLaws_P.Constant3_Value_b);
  a = AutopilotLaws_U.in.data.nav_loc_deg - AutopilotLaws_U.in.data.nav_loc_magvar_deg;
  rtb_Tsxlo = rt_modd(rt_modd(a, AutopilotLaws_P.Constant3_Value_n) + AutopilotLaws_P.Constant3_Value_n,
                      AutopilotLaws_P.Constant3_Value_n);
  rtb_Saturation1 = rt_modd((b_R - (rtb_Tsxlo + AutopilotLaws_P.Constant3_Value_i)) + AutopilotLaws_P.Constant3_Value_i,
    AutopilotLaws_P.Constant3_Value_i);
  Phi2 = rt_modd(AutopilotLaws_P.Constant3_Value_i - rtb_Saturation1, AutopilotLaws_P.Constant3_Value_i);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting == 1) {
    rtb_Saturation = AutopilotLaws_P.Constant_Value_d;
  } else {
    rtb_Saturation = AutopilotLaws_U.in.input.lateral_law;
  }

  rtb_valid = (rtb_Saturation == AutopilotLaws_P.CompareToConstant2_const);
  if (rtb_Saturation1 < Phi2) {
    rtb_Saturation1 *= AutopilotLaws_P.Gain1_Gain;
  } else {
    rtb_Saturation1 = AutopilotLaws_P.Gain_Gain * Phi2;
  }

  rtb_Saturation1 = std::abs(rtb_Saturation1);
  if (!AutopilotLaws_DWork.limit_not_empty) {
    AutopilotLaws_DWork.limit = rtb_Saturation1;
    AutopilotLaws_DWork.limit_not_empty = true;
  }

  if (!rtb_valid) {
    if (rtb_Saturation1 > 15.0) {
      AutopilotLaws_DWork.limit = rtb_Saturation1;
    } else {
      AutopilotLaws_DWork.limit = 15.0;
    }

    if (AutopilotLaws_DWork.limit >= 115.0) {
      AutopilotLaws_DWork.limit = 115.0;
    }
  }

  if (rtb_valid && (rtb_Saturation1 < 15.0)) {
    AutopilotLaws_DWork.limit = 15.0;
  }

  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value, AutopilotLaws_P.zeta_Value, &L, &rtb_Y_e);
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_b) {
    rtb_Saturation1 = AutopilotLaws_P.Saturation_UpperSat_b;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_n) {
    rtb_Saturation1 = AutopilotLaws_P.Saturation_LowerSat_n;
  } else {
    rtb_Saturation1 = rtb_dme;
  }

  rtb_Saturation1 = std::sin(AutopilotLaws_P.Gain1_Gain_f * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_Saturation1
    * AutopilotLaws_P.Gain_Gain_h * rtb_Y_e / AutopilotLaws_U.in.data.V_gnd_kn;
  b_R = rt_modd((b_R - (rt_modd(rt_modd(AutopilotLaws_U.in.data.nav_loc_error_deg + rtb_Tsxlo,
    AutopilotLaws_P.Constant3_Value_c) + AutopilotLaws_P.Constant3_Value_c, AutopilotLaws_P.Constant3_Value_c) +
                        AutopilotLaws_P.Constant3_Value_p)) + AutopilotLaws_P.Constant3_Value_p,
                AutopilotLaws_P.Constant3_Value_p);
  Phi2 = rt_modd(AutopilotLaws_P.Constant3_Value_p - b_R, AutopilotLaws_P.Constant3_Value_p);
  if (rtb_Saturation1 > AutopilotLaws_DWork.limit) {
    rtb_Saturation1 = AutopilotLaws_DWork.limit;
  } else if (rtb_Saturation1 < -AutopilotLaws_DWork.limit) {
    rtb_Saturation1 = -AutopilotLaws_DWork.limit;
  }

  if (b_R < Phi2) {
    b_R *= AutopilotLaws_P.Gain1_Gain_p;
  } else {
    b_R = AutopilotLaws_P.Gain_Gain_a * Phi2;
  }

  rtb_Saturation1 = (AutopilotLaws_P.Gain2_Gain_i * b_R + rtb_Saturation1) * L * AutopilotLaws_U.in.data.V_gnd_kn;
  b_R = rt_modd((rt_modd(rt_modd(a, AutopilotLaws_P.Constant3_Value_if) + AutopilotLaws_P.Constant3_Value_if,
    AutopilotLaws_P.Constant3_Value_if) - (AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_m)) +
                AutopilotLaws_P.Constant3_Value_m, AutopilotLaws_P.Constant3_Value_m);
  AutopilotLaws_Chart_h(b_R, AutopilotLaws_P.Gain_Gain_f * rt_modd(AutopilotLaws_P.Constant3_Value_m - b_R,
    AutopilotLaws_P.Constant3_Value_m), AutopilotLaws_P.Constant2_Value_l, &Phi2, &AutopilotLaws_DWork.sf_Chart_h);
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_o) {
    rtb_dme = AutopilotLaws_P.Saturation_UpperSat_o;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_o) {
    rtb_dme = AutopilotLaws_P.Saturation_LowerSat_o;
  }

  b_R = std::sin(AutopilotLaws_P.Gain1_Gain_nr * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_dme *
    AutopilotLaws_P.Gain2_Gain_g;
  if (b_R > AutopilotLaws_P.Saturation1_UpperSat_g) {
    b_R = AutopilotLaws_P.Saturation1_UpperSat_g;
  } else if (b_R < AutopilotLaws_P.Saturation1_LowerSat_k) {
    b_R = AutopilotLaws_P.Saturation1_LowerSat_k;
  }

  rtb_Compare_g0 = (rtb_Saturation == AutopilotLaws_P.CompareToConstant_const);
  if (!rtb_Compare_g0) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  AutopilotLaws_DWork.Delay_DSTATE += AutopilotLaws_P.Gain6_Gain_bv * b_R *
    AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_Gain * AutopilotLaws_U.in.time.dt;
  if (AutopilotLaws_DWork.Delay_DSTATE > AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (AutopilotLaws_DWork.Delay_DSTATE < AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  AutopilotLaws_storevalue(rtb_Compare_g0, rt_modd(rt_modd(AutopilotLaws_U.in.data.nav_loc_deg -
    AutopilotLaws_U.in.data.nav_loc_magvar_deg, AutopilotLaws_P.Constant3_Value_d) + AutopilotLaws_P.Constant3_Value_d,
    AutopilotLaws_P.Constant3_Value_d), &rtb_Y_e, &AutopilotLaws_DWork.sf_storevalue);
  rtb_dme = rt_modd((AutopilotLaws_U.in.data.Psi_true_deg - (rt_modd(rt_modd(AutopilotLaws_U.in.data.nav_loc_error_deg +
    rtb_Y_e, AutopilotLaws_P.Constant3_Value_o) + AutopilotLaws_P.Constant3_Value_o, AutopilotLaws_P.Constant3_Value_o)
    + AutopilotLaws_P.Constant3_Value_n1)) + AutopilotLaws_P.Constant3_Value_n1, AutopilotLaws_P.Constant3_Value_n1);
  a = rt_modd(AutopilotLaws_P.Constant3_Value_n1 - rtb_dme, AutopilotLaws_P.Constant3_Value_n1);
  if (rtb_dme < a) {
    rtb_dme *= AutopilotLaws_P.Gain1_Gain_j;
  } else {
    rtb_dme = AutopilotLaws_P.Gain_Gain_i * a;
  }

  rtb_dme = rt_modd((rt_modd(rt_modd(((b_R * look1_binlxpw(AutopilotLaws_U.in.data.V_gnd_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain_Table, 2U) +
    AutopilotLaws_DWork.Delay_DSTATE) + AutopilotLaws_P.Gain1_Gain_fq * rtb_dme) + AutopilotLaws_U.in.data.Psi_true_deg,
    AutopilotLaws_P.Constant3_Value_h) + AutopilotLaws_P.Constant3_Value_h, AutopilotLaws_P.Constant3_Value_h) -
                     (AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_nr)) +
                    AutopilotLaws_P.Constant3_Value_nr, AutopilotLaws_P.Constant3_Value_nr);
  AutopilotLaws_Chart_h(rtb_dme, AutopilotLaws_P.Gain_Gain_oc * rt_modd(AutopilotLaws_P.Constant3_Value_nr - rtb_dme,
    AutopilotLaws_P.Constant3_Value_nr), AutopilotLaws_P.Constant1_Value_e, &rtb_out_f, &AutopilotLaws_DWork.sf_Chart_b);
  rtb_dme = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_deg +
    AutopilotLaws_P.Constant3_Value_cd)) + AutopilotLaws_P.Constant3_Value_cd, AutopilotLaws_P.Constant3_Value_cd);
  rtb_valid = ((rtb_Saturation == AutopilotLaws_P.CompareToConstant5_const) == AutopilotLaws_P.CompareToConstant_const_h);
  b_R = AutopilotLaws_P.Subsystem_Value / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[i] = AutopilotLaws_P.Delay_InitialCondition;
    }
  }

  if (b_R < 1.0) {
    rtb_valid_d = rtb_valid;
  } else {
    if (b_R > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::floor(b_R), 4.294967296E+9)));
    }

    rtb_valid_d = AutopilotLaws_DWork.Delay_DSTATE_l[100U - i];
  }

  AutopilotLaws_Chart(rtb_dme, AutopilotLaws_P.Gain_Gain_cy * rt_modd(AutopilotLaws_P.Constant3_Value_cd - rtb_dme,
    AutopilotLaws_P.Constant3_Value_cd), rtb_valid != rtb_valid_d, &b_R, &AutopilotLaws_DWork.sf_Chart);
  rtb_dme = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_track_deg +
    AutopilotLaws_P.Constant3_Value_k)) + AutopilotLaws_P.Constant3_Value_k, AutopilotLaws_P.Constant3_Value_k);
  rtb_valid_d = ((rtb_Saturation == AutopilotLaws_P.CompareToConstant4_const) ==
                 AutopilotLaws_P.CompareToConstant_const_e);
  a = AutopilotLaws_P.Subsystem_Value_n / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid_d) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }
  }

  if (a < 1.0) {
    rtb_Delay_j = rtb_valid_d;
  } else {
    if (a > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::floor(a), 4.294967296E+9)));
    }

    rtb_Delay_j = AutopilotLaws_DWork.Delay_DSTATE_h5[100U - i];
  }

  AutopilotLaws_Chart(rtb_dme, AutopilotLaws_P.Gain_Gain_p * rt_modd(AutopilotLaws_P.Constant3_Value_k - rtb_dme,
    AutopilotLaws_P.Constant3_Value_k), rtb_valid_d != rtb_Delay_j, &R, &AutopilotLaws_DWork.sf_Chart_ba);
  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value_c, AutopilotLaws_P.zeta_Value_h, &rtb_Y_m, &a);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_loc_error_deg, AutopilotLaws_P.LagFilter2_C1,
    AutopilotLaws_U.in.time.dt, &L, &AutopilotLaws_DWork.sf_LagFilter_h);
  rtb_dme = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain * L;
  AutopilotLaws_LagFilter(L + AutopilotLaws_P.Gain3_Gain_i * ((rtb_dme - AutopilotLaws_DWork.Delay_DSTATE_e) /
    AutopilotLaws_U.in.time.dt), AutopilotLaws_P.LagFilter_C1, AutopilotLaws_U.in.time.dt, &rtb_Y_e,
    &AutopilotLaws_DWork.sf_LagFilter);
  rtb_Delay_j = (AutopilotLaws_U.in.data.H_radio_ft <= AutopilotLaws_P.CompareToConstant_const_d);
  switch (static_cast<int32_T>(rtb_Saturation)) {
   case 0:
    b_R = rtb_GainTheta1;
    break;

   case 1:
    b_R = b_R * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_h,
      AutopilotLaws_P.ScheduledGain_Table_o, 6U) * AutopilotLaws_P.Gain1_Gain_o + AutopilotLaws_P.Gain_Gain_o * result[2];
    break;

   case 2:
    b_R = R * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_o,
      AutopilotLaws_P.ScheduledGain_Table_e, 6U) * AutopilotLaws_P.Gain1_Gain_i + AutopilotLaws_P.Gain_Gain_l * result[2];
    break;

   case 3:
    rtb_Add1_om = AutopilotLaws_P.Gain_Gain_c * AutopilotLaws_U.in.data.flight_guidance_xtk_nmi * a /
      AutopilotLaws_U.in.data.V_gnd_kn;
    if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat) {
      rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat;
    } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat) {
      rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat;
    }

    b_R = AutopilotLaws_U.in.data.flight_guidance_phi_deg - (AutopilotLaws_P.Gain2_Gain *
      AutopilotLaws_U.in.data.flight_guidance_tae_deg + rtb_Add1_om) * rtb_Y_m * AutopilotLaws_U.in.data.V_gnd_kn;
    break;

   case 4:
    b_R = rtb_Saturation1;
    break;

   case 5:
    if (rtb_Delay_j) {
      a = AutopilotLaws_P.k_beta_Phi_Gain * AutopilotLaws_U.in.data.beta_deg;
    } else {
      a = AutopilotLaws_P.Constant1_Value_f;
    }

    b_R = rtb_Y_e * look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_e, AutopilotLaws_P.ScheduledGain_Table_p, 4U) *
      look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1,
                    AutopilotLaws_P.ScheduledGain2_Table, 6U) + a;
    break;

   default:
    b_R = AutopilotLaws_P.Constant3_Value;
    break;
  }

  a = look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ROLLLIM1_bp01Data,
                    AutopilotLaws_P.ROLLLIM1_tableData, 4U);
  if (b_R > a) {
    b_R = a;
  } else {
    a *= AutopilotLaws_P.Gain1_Gain_l;
    if (b_R < a) {
      b_R = a;
    }
  }

  if (rtb_Delay_j) {
    a = AutopilotLaws_P.Gain_Gain_ae * Phi2 + AutopilotLaws_P.Gain1_Gain_k * AutopilotLaws_U.in.data.beta_deg;
  } else {
    a = AutopilotLaws_P.Constant1_Value_f;
  }

  AutopilotLaws_LagFilter(a, AutopilotLaws_P.LagFilter1_C1, AutopilotLaws_U.in.time.dt, &rtb_Y_e,
    &AutopilotLaws_DWork.sf_LagFilter_c);
  if (!AutopilotLaws_DWork.pY_not_empty) {
    AutopilotLaws_DWork.pY = AutopilotLaws_P.RateLimiterVariableTs_InitialCondition;
    AutopilotLaws_DWork.pY_not_empty = true;
  }

  rtb_Add1_om = static_cast<real_T>(rtb_Compare_g0) - AutopilotLaws_DWork.pY;
  a = std::abs(AutopilotLaws_P.RateLimiterVariableTs_up) * AutopilotLaws_U.in.time.dt;
  if (rtb_Add1_om < a) {
    a = rtb_Add1_om;
  }

  L = -std::abs(AutopilotLaws_P.RateLimiterVariableTs_lo) * AutopilotLaws_U.in.time.dt;
  if (a > L) {
    L = a;
  }

  AutopilotLaws_DWork.pY += L;
  switch (static_cast<int32_T>(rtb_Saturation)) {
   case 0:
    rtb_Tsxlo = AutopilotLaws_P.beta_Value;
    break;

   case 1:
    rtb_Tsxlo = AutopilotLaws_P.beta_Value_e;
    break;

   case 2:
    rtb_Tsxlo = AutopilotLaws_P.beta_Value_b;
    break;

   case 3:
    rtb_Tsxlo = AutopilotLaws_P.beta_Value_i;
    break;

   case 4:
    rtb_Tsxlo = AutopilotLaws_P.beta_Value_c;
    break;

   case 5:
    if (rtb_Y_e > AutopilotLaws_P.Saturation_UpperSat_e) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_e;
    } else if (rtb_Y_e < AutopilotLaws_P.Saturation_LowerSat_f) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_f;
    } else {
      rtb_Tsxlo = rtb_Y_e;
    }
    break;

   default:
    if (AutopilotLaws_DWork.pY > AutopilotLaws_P.Saturation_UpperSat_k) {
      a = AutopilotLaws_P.Saturation_UpperSat_k;
    } else if (AutopilotLaws_DWork.pY < AutopilotLaws_P.Saturation_LowerSat_f3) {
      a = AutopilotLaws_P.Saturation_LowerSat_f3;
    } else {
      a = AutopilotLaws_DWork.pY;
    }

    rtb_Tsxlo = (AutopilotLaws_P.Gain_Gain_b * result[2] * a + (AutopilotLaws_P.Constant_Value - a) *
                 (AutopilotLaws_P.Gain4_Gain * AutopilotLaws_U.in.data.beta_deg)) + AutopilotLaws_P.Gain5_Gain *
      rtb_out_f;
    break;
  }

  AutopilotLaws_DWork.icLoad = ((!rtb_Compare_o1) || AutopilotLaws_DWork.icLoad);
  if (AutopilotLaws_DWork.icLoad) {
    AutopilotLaws_DWork.Delay_DSTATE_h = rtb_GainTheta1;
  }

  rtb_Add1_om = b_R - AutopilotLaws_DWork.Delay_DSTATE_h;
  a = AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (rtb_Add1_om < a) {
    a = rtb_Add1_om;
  }

  L = AutopilotLaws_P.Gain1_Gain_kf * AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (a > L) {
    L = a;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h += L;
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h, AutopilotLaws_P.LagFilter_C1_l, AutopilotLaws_U.in.time.dt,
    &rtb_Y_m, &AutopilotLaws_DWork.sf_LagFilter_o);
  AutopilotLaws_RateLimiter(static_cast<real_T>(rtb_Compare_o1), AutopilotLaws_P.RateLimiterVariableTs_up_b,
    AutopilotLaws_P.RateLimiterVariableTs_lo_b, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_i, &rtb_Y_e, &AutopilotLaws_DWork.sf_RateLimiter_d);
  if (rtb_Y_e > AutopilotLaws_P.Saturation_UpperSat_m) {
    Phi2 = AutopilotLaws_P.Saturation_UpperSat_m;
  } else if (rtb_Y_e < AutopilotLaws_P.Saturation_LowerSat_fw) {
    Phi2 = AutopilotLaws_P.Saturation_LowerSat_fw;
  } else {
    Phi2 = rtb_Y_e;
  }

  AutopilotLaws_Y.out.output.Phi_loc_c = rtb_Saturation1;
  AutopilotLaws_Y.out.output.flight_director.Beta_c_deg = rtb_Tsxlo;
  AutopilotLaws_Y.out.output.autopilot.Beta_c_deg = rtb_Tsxlo;
  AutopilotLaws_Y.out.output.flight_director.Phi_c_deg = (b_R - rtb_GainTheta1) * AutopilotLaws_P.Gain_Gain_lu;
  AutopilotLaws_Y.out.output.autopilot.Phi_c_deg = (AutopilotLaws_P.Constant_Value_ii - Phi2) * rtb_GainTheta1 + rtb_Y_m
    * Phi2;
  AutopilotLaws_WashoutFilter(rtb_GainTheta, AutopilotLaws_P.WashoutFilter_C1, AutopilotLaws_U.in.time.dt, &a,
    &AutopilotLaws_DWork.sf_WashoutFilter_fo);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting_b == 1) {
    rtb_Saturation = AutopilotLaws_P.Constant_Value_m;
  } else {
    rtb_Saturation = AutopilotLaws_U.in.input.vertical_law;
  }

  if (AutopilotLaws_U.in.input.ALT_soft_mode_active) {
    Phi2 = (AutopilotLaws_U.in.input.V_c_kn - AutopilotLaws_U.in.data.V_ias_kn) * AutopilotLaws_P.Gain1_Gain_b;
    if (Phi2 > AutopilotLaws_P.Saturation1_UpperSat) {
      Phi2 = AutopilotLaws_P.Saturation1_UpperSat;
    } else if (Phi2 < AutopilotLaws_P.Saturation1_LowerSat) {
      Phi2 = AutopilotLaws_P.Saturation1_LowerSat;
    }
  } else {
    Phi2 = AutopilotLaws_P.Constant1_Value_h;
  }

  if (rtb_Saturation != AutopilotLaws_P.CompareToConstant5_const_e) {
    AutopilotLaws_B.u = (AutopilotLaws_U.in.input.H_c_ft + AutopilotLaws_U.in.data.H_ft) -
      AutopilotLaws_U.in.data.H_ind_ft;
  }

  AutopilotLaws_LagFilter(AutopilotLaws_B.u - AutopilotLaws_U.in.data.H_ft, AutopilotLaws_P.LagFilter_C1_a,
    AutopilotLaws_U.in.time.dt, &rtb_Y_e, &AutopilotLaws_DWork.sf_LagFilter_g);
  rtb_Add1_om = AutopilotLaws_P.Gain_Gain_ft * rtb_Y_e + Phi2;
  b_R = AutopilotLaws_P.kntoms_Gain * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_n) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_n;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_d) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_d;
  }

  if (b_R > AutopilotLaws_P.Saturation_UpperSat_a) {
    b_R = AutopilotLaws_P.Saturation_UpperSat_a;
  } else if (b_R < AutopilotLaws_P.Saturation_LowerSat_n5) {
    b_R = AutopilotLaws_P.Saturation_LowerSat_n5;
  }

  rtb_Add1_om = (rtb_Add1_om - AutopilotLaws_U.in.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain / b_R;
  if (rtb_Add1_om > 1.0) {
    rtb_Add1_om = 1.0;
  } else if (rtb_Add1_om < -1.0) {
    rtb_Add1_om = -1.0;
  }

  rtb_Saturation1 = AutopilotLaws_P.Gain_Gain_k * std::asin(rtb_Add1_om);
  rtb_Compare_o1 = (rtb_Saturation == AutopilotLaws_P.CompareToConstant1_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty_p) {
    AutopilotLaws_DWork.wasActive_c = rtb_Compare_o1;
    AutopilotLaws_DWork.wasActive_not_empty_p = true;
  }

  b_L = AutopilotLaws_U.in.input.H_c_ft - AutopilotLaws_U.in.data.H_ind_ft;
  if (b_L < 0.0) {
    b_R = -1.0;
  } else if (b_L > 0.0) {
    b_R = 1.0;
  } else {
    b_R = b_L;
  }

  b_R = b_R * AutopilotLaws_DWork.dH_offset + b_L;
  if ((!AutopilotLaws_DWork.wasActive_c) && rtb_Compare_o1) {
    AutopilotLaws_DWork.k = AutopilotLaws_U.in.data.H_dot_ft_min / b_R;
    AutopilotLaws_DWork.dH_offset = std::abs(500.0 / std::abs(AutopilotLaws_DWork.k) - 100.0);
    if (b_R < 0.0) {
      Phi2 = -1.0;
    } else if (b_R > 0.0) {
      Phi2 = 1.0;
    } else {
      Phi2 = b_R;
    }

    b_R += Phi2 * AutopilotLaws_DWork.dH_offset;
    AutopilotLaws_DWork.k = AutopilotLaws_U.in.data.H_dot_ft_min / b_R;
    AutopilotLaws_DWork.maxH_dot = std::abs(AutopilotLaws_U.in.data.H_dot_ft_min);
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

  AutopilotLaws_DWork.wasActive_c = rtb_Compare_o1;
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_h * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_d) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_d;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_nr) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_nr;
  }

  rtb_Add1_om = (b_R - AutopilotLaws_U.in.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain_c / rtb_Add1_om;
  if (rtb_Add1_om > 1.0) {
    rtb_Add1_om = 1.0;
  } else if (rtb_Add1_om < -1.0) {
    rtb_Add1_om = -1.0;
  }

  R = AutopilotLaws_P.Gain_Gain_es * std::asin(rtb_Add1_om);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_m * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_oc) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_oc;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_m) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_m;
  }

  Phi2 = std::atan(AutopilotLaws_P.fpmtoms_Gain * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add1_om) *
    AutopilotLaws_P.Gain_Gain_cb;
  b_R = AutopilotLaws_P.Gain1_Gain_jo * rtb_GainTheta1;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain * (AutopilotLaws_P.GStoGS_CAS_Gain * (AutopilotLaws_P.ktstomps_Gain *
    AutopilotLaws_U.in.data.V_gnd_kn)), AutopilotLaws_P.WashoutFilter_C1_c, AutopilotLaws_U.in.time.dt, &rtb_Y_e,
    &AutopilotLaws_DWork.sf_WashoutFilter);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_g * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_no) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_no;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_h) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_h;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_e - AutopilotLaws_P.g_Gain * (AutopilotLaws_P.Gain1_Gain_i4u *
    (AutopilotLaws_P.Gain_Gain_bv * ((AutopilotLaws_P.Gain1_Gain_e * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_ke *
    (AutopilotLaws_P.Gain_Gain_pe * std::atan(AutopilotLaws_P.fpmtoms_Gain_l * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Add1_om))) * (AutopilotLaws_P.Constant_Value_c - std::cos(b_R)) + std::sin(b_R) * std::sin
    (AutopilotLaws_P.Gain1_Gain_et * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_i4 *
     AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1, AutopilotLaws_P.HighPassFilter_C2,
    AutopilotLaws_P.HighPassFilter_C3, AutopilotLaws_P.HighPassFilter_C4, AutopilotLaws_U.in.time.dt, &rtb_Y_m,
    &AutopilotLaws_DWork.sf_LeadLagFilter);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_j * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1, AutopilotLaws_P.LowPassFilter_C2, AutopilotLaws_P.LowPassFilter_C3,
    AutopilotLaws_P.LowPassFilter_C4, AutopilotLaws_U.in.time.dt, &rtb_Y_e, &AutopilotLaws_DWork.sf_LeadLagFilter_e);
  b_R = (rtb_Y_m + rtb_Y_e) * AutopilotLaws_P.ug_Gain;
  rtb_Tsxlo = AutopilotLaws_P.Gain1_Gain_pe * Phi2;
  rtb_out_f = b_R + rtb_Tsxlo;
  L = (AutopilotLaws_P.Gain1_Gain_cq * b_R + rtb_Tsxlo) * AutopilotLaws_P.Gain_Gain_e0;
  if (b_L > AutopilotLaws_P.Switch_Threshold_m) {
    b_R = AutopilotLaws_P.Constant1_Value;
  } else {
    b_R = AutopilotLaws_P.Gain5_Gain_f * L;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &rtb_Y_e);
  rtb_Tsxlo = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_e) * AutopilotLaws_P.Gain1_Gain_mz;
  if (rtb_Tsxlo <= b_R) {
    if (b_L > AutopilotLaws_P.Switch1_Threshold) {
      b_R = AutopilotLaws_P.Constant_Value_i;
    } else {
      b_R = AutopilotLaws_P.Gain6_Gain * L;
    }

    if (rtb_Tsxlo >= b_R) {
      b_R = rtb_Tsxlo;
    }
  }

  rtb_Sum2_p = (AutopilotLaws_P.Gain_Gain_bo * rtb_out_f - Phi2) + b_R;
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_hn * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_i) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_i;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_ma) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_ma;
  }

  Phi2 = std::atan(AutopilotLaws_P.fpmtoms_Gain_j * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add1_om) *
    AutopilotLaws_P.Gain_Gain_g;
  b_R = AutopilotLaws_P.Gain1_Gain_bf * rtb_GainTheta1;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_e * (AutopilotLaws_P.GStoGS_CAS_Gain_c *
    (AutopilotLaws_P.ktstomps_Gain_k * AutopilotLaws_U.in.data.V_gnd_kn)), AutopilotLaws_P.WashoutFilter_C1_j,
    AutopilotLaws_U.in.time.dt, &rtb_Y_e, &AutopilotLaws_DWork.sf_WashoutFilter_h);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_gg * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_kx) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_kx;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_a) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_a;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_e - AutopilotLaws_P.g_Gain_c * (AutopilotLaws_P.Gain1_Gain_jg *
    (AutopilotLaws_P.Gain_Gain_kr * ((AutopilotLaws_P.Gain1_Gain_ep * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_mq *
    (AutopilotLaws_P.Gain_Gain_hr * std::atan(AutopilotLaws_P.fpmtoms_Gain_g * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Add1_om))) * (AutopilotLaws_P.Constant_Value_lw - std::cos(b_R)) + std::sin(b_R) * std::sin
    (AutopilotLaws_P.Gain1_Gain_a * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_hv *
     AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_f,
    AutopilotLaws_P.HighPassFilter_C2_b, AutopilotLaws_P.HighPassFilter_C3_i, AutopilotLaws_P.HighPassFilter_C4_a,
    AutopilotLaws_U.in.time.dt, &rtb_Y_m, &AutopilotLaws_DWork.sf_LeadLagFilter_k);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_h * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_b, AutopilotLaws_P.LowPassFilter_C2_n, AutopilotLaws_P.LowPassFilter_C3_i,
    AutopilotLaws_P.LowPassFilter_C4_i, AutopilotLaws_U.in.time.dt, &rtb_Y_e, &AutopilotLaws_DWork.sf_LeadLagFilter_f);
  b_R = (rtb_Y_m + rtb_Y_e) * AutopilotLaws_P.ug_Gain_i;
  rtb_Tsxlo = AutopilotLaws_P.Gain1_Gain_og * Phi2;
  rtb_out_f = b_R + rtb_Tsxlo;
  L = (AutopilotLaws_P.Gain1_Gain_bw * b_R + rtb_Tsxlo) * AutopilotLaws_P.Gain_Gain_ocq;
  if (b_L > AutopilotLaws_P.Switch_Threshold_b) {
    b_R = AutopilotLaws_P.Constant1_Value_j;
  } else {
    b_R = AutopilotLaws_P.Gain5_Gain_j * L;
  }

  rtb_Y_e = AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.data.VMAX_kn;
  rtb_Tsxlo = rtb_Y_e * AutopilotLaws_P.Gain1_Gain_lg;
  if (rtb_Tsxlo <= b_R) {
    if (b_L > AutopilotLaws_P.Switch1_Threshold_d) {
      b_R = AutopilotLaws_P.Constant_Value_dh;
    } else {
      b_R = AutopilotLaws_P.Gain6_Gain_n * L;
    }

    if (rtb_Tsxlo >= b_R) {
      b_R = rtb_Tsxlo;
    }
  }

  b_R += AutopilotLaws_P.Gain_Gain_gs * rtb_out_f - Phi2;
  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, R, AutopilotLaws_P.VS_Gain * R, rtb_Sum2_p,
    AutopilotLaws_P.Gain_Gain_o0 * rtb_Sum2_p, b_R, AutopilotLaws_P.Gain_Gain_gu * b_R, &L, &rtb_out_f);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_a * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_bj) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_bj;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_j) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_j;
  }

  Phi2 = std::atan(AutopilotLaws_P.fpmtoms_Gain_gg * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add1_om) *
    AutopilotLaws_P.Gain_Gain_du;
  b_R = AutopilotLaws_P.Gain1_Gain_ea * rtb_GainTheta1;
  R = std::cos(b_R);
  rtb_Tsxlo = std::sin(b_R);
  b_R = AutopilotLaws_P.ktstomps_Gain_c * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_b * (AutopilotLaws_P.GStoGS_CAS_Gain_f * b_R),
    AutopilotLaws_P.WashoutFilter_C1_p, AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_WashoutFilter_n);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_j * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_ig) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_ig;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_i) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_i;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_j - AutopilotLaws_P.g_Gain_a * (AutopilotLaws_P.Gain1_Gain_iv *
    (AutopilotLaws_P.Gain_Gain_a3 * ((AutopilotLaws_P.Gain1_Gain_ni * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_ee *
    (AutopilotLaws_P.Gain_Gain_j1 * std::atan(AutopilotLaws_P.fpmtoms_Gain_lo * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Add1_om))) * (AutopilotLaws_P.Constant_Value_ix - R) + rtb_Tsxlo * std::sin(AutopilotLaws_P.Gain1_Gain_mz0 *
    AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_cl *
    AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_p,
    AutopilotLaws_P.HighPassFilter_C2_a, AutopilotLaws_P.HighPassFilter_C3_o, AutopilotLaws_P.HighPassFilter_C4_j,
    AutopilotLaws_U.in.time.dt, &b_R, &AutopilotLaws_DWork.sf_LeadLagFilter_b);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_l * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_l, AutopilotLaws_P.LowPassFilter_C2_g, AutopilotLaws_P.LowPassFilter_C3_im,
    AutopilotLaws_P.LowPassFilter_C4_io, AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_LeadLagFilter_p);
  b_R = (b_R + rtb_Y_j) * AutopilotLaws_P.ug_Gain_k;
  rtb_Tsxlo = AutopilotLaws_P.Gain1_Gain_js * Phi2;
  R = b_R + rtb_Tsxlo;
  rtb_Tsxlo = (AutopilotLaws_P.Gain1_Gain_m5 * b_R + rtb_Tsxlo) * AutopilotLaws_P.Gain_Gain_nw;
  AutopilotLaws_Voter1(AutopilotLaws_U.in.data.VLS_kn, AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VMAX_kn,
                       &b_R);
  b_R = (AutopilotLaws_U.in.data.V_ias_kn - b_R) * AutopilotLaws_P.Gain1_Gain_hy;
  if ((b_L > AutopilotLaws_P.CompareToConstant_const_l) && (rtb_Tsxlo < AutopilotLaws_P.CompareToConstant1_const_g) &&
      (b_R < AutopilotLaws_P.CompareToConstant2_const_i)) {
    b_R = AutopilotLaws_P.Constant_Value_g;
  } else {
    if (b_L > AutopilotLaws_P.Switch2_Threshold) {
      rtb_Sum2_p = AutopilotLaws_P.Constant1_Value_pk;
    } else {
      rtb_Sum2_p = AutopilotLaws_P.Gain5_Gain_p * rtb_Tsxlo;
    }

    if (b_R > rtb_Sum2_p) {
      b_R = rtb_Sum2_p;
    } else {
      if (b_L > AutopilotLaws_P.Switch1_Threshold_jt) {
        rtb_Tsxlo *= AutopilotLaws_P.Gain1_Gain_c;
        if (AutopilotLaws_P.Constant2_Value > rtb_Tsxlo) {
          rtb_Tsxlo = AutopilotLaws_P.Constant2_Value;
        }
      } else {
        rtb_Tsxlo *= AutopilotLaws_P.Gain6_Gain_b;
      }

      if (b_R < rtb_Tsxlo) {
        b_R = rtb_Tsxlo;
      }
    }
  }

  R = (AutopilotLaws_P.Gain_Gain_in * R - Phi2) + b_R;
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_au * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_l) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_l;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_hm) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_hm;
  }

  rtb_Add1_om = (AutopilotLaws_U.in.input.H_dot_c_fpm - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_l / rtb_Add1_om;
  if (rtb_Add1_om > 1.0) {
    rtb_Add1_om = 1.0;
  } else if (rtb_Add1_om < -1.0) {
    rtb_Add1_om = -1.0;
  }

  rtb_Y_m = AutopilotLaws_P.Gain_Gain_ey * std::asin(rtb_Add1_om);
  AutopilotLaws_VSLimiter(AutopilotLaws_P.VS_Gain_h * rtb_Y_m, AutopilotLaws_U.in.data.V_tas_kn, &rtb_Y_j);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_ap * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_c) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_c;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_fg) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_fg;
  }

  Phi2 = std::atan(AutopilotLaws_P.fpmtoms_Gain_n * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add1_om) *
    AutopilotLaws_P.Gain_Gain_ot;
  b_R = AutopilotLaws_P.Gain1_Gain_ead * rtb_GainTheta1;
  rtb_Sum2_p = std::cos(b_R);
  rtb_Cos1_d = std::sin(b_R);
  rtb_Tsxlo = AutopilotLaws_P.Gain1_Gain_iy * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_Add3_jp = rtb_Tsxlo - AutopilotLaws_P.Gain1_Gain_dt * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  b_R = AutopilotLaws_P.ktstomps_Gain_m * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_m * (AutopilotLaws_P.GStoGS_CAS_Gain_k * b_R),
    AutopilotLaws_P.WashoutFilter_C1_d, AutopilotLaws_U.in.time.dt, &b_R, &AutopilotLaws_DWork.sf_WashoutFilter_ba);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_o * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_be) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_be;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_in) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_in;
  }

  AutopilotLaws_LeadLagFilter(b_R - AutopilotLaws_P.g_Gain_a1 * (AutopilotLaws_P.Gain1_Gain_l0 *
    (AutopilotLaws_P.Gain_Gain_ag * ((AutopilotLaws_P.Gain1_Gain_kn * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_nw *
    (AutopilotLaws_P.Gain_Gain_ez * std::atan(AutopilotLaws_P.fpmtoms_Gain_gy * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Add1_om))) * (AutopilotLaws_P.Constant_Value_n - rtb_Sum2_p) + rtb_Cos1_d * std::sin(rtb_Add3_jp)))),
    AutopilotLaws_P.HighPassFilter_C1_pb, AutopilotLaws_P.HighPassFilter_C2_g, AutopilotLaws_P.HighPassFilter_C3_ov,
    AutopilotLaws_P.HighPassFilter_C4_jd, AutopilotLaws_U.in.time.dt, &rtb_Tsxlo,
    &AutopilotLaws_DWork.sf_LeadLagFilter_dh);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_p * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_g, AutopilotLaws_P.LowPassFilter_C2_n3, AutopilotLaws_P.LowPassFilter_C3_g,
    AutopilotLaws_P.LowPassFilter_C4_j, AutopilotLaws_U.in.time.dt, &b_R, &AutopilotLaws_DWork.sf_LeadLagFilter_i);
  b_R = (rtb_Tsxlo + b_R) * AutopilotLaws_P.ug_Gain_g;
  rtb_Tsxlo = AutopilotLaws_P.Gain1_Gain_gn * Phi2;
  rtb_Sum2_p = b_R + rtb_Tsxlo;
  rtb_Cos1_d = (AutopilotLaws_P.Gain1_Gain_px * b_R + rtb_Tsxlo) * AutopilotLaws_P.Gain_Gain_ii;
  if (b_L > AutopilotLaws_P.Switch_Threshold_n) {
    b_R = AutopilotLaws_P.Constant1_Value_k;
  } else {
    b_R = AutopilotLaws_P.Gain5_Gain_l * rtb_Cos1_d;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &rtb_Tsxlo);
  rtb_Tsxlo = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Tsxlo) * AutopilotLaws_P.Gain1_Gain_hd;
  if (rtb_Tsxlo <= b_R) {
    if (b_L > AutopilotLaws_P.Switch1_Threshold_m) {
      b_R = AutopilotLaws_P.Constant_Value_l;
    } else {
      b_R = AutopilotLaws_P.Gain6_Gain_p * rtb_Cos1_d;
    }

    if (rtb_Tsxlo >= b_R) {
      b_R = rtb_Tsxlo;
    }
  }

  rtb_Add3_jp = (AutopilotLaws_P.Gain_Gain_im * rtb_Sum2_p - Phi2) + b_R;
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_n * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_mx) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_mx;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_l) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_l;
  }

  Phi2 = std::atan(AutopilotLaws_P.fpmtoms_Gain_f * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add1_om) *
    AutopilotLaws_P.Gain_Gain_gv;
  b_R = AutopilotLaws_P.Gain1_Gain_kt * rtb_GainTheta1;
  rtb_Sum2_p = std::cos(b_R);
  rtb_Cos1_d = std::sin(b_R);
  rtb_Tsxlo = AutopilotLaws_P.Gain1_Gain_fqd * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_Add3_h = rtb_Tsxlo - AutopilotLaws_P.Gain1_Gain_fw * AutopilotLaws_U.in.data.Psi_magnetic_deg;
  b_R = AutopilotLaws_P.ktstomps_Gain_lq * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_p * (AutopilotLaws_P.GStoGS_CAS_Gain_d * b_R),
    AutopilotLaws_P.WashoutFilter_C1_m, AutopilotLaws_U.in.time.dt, &b_R, &AutopilotLaws_DWork.sf_WashoutFilter_p);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_k * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_cl) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_cl;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_g5) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_g5;
  }

  AutopilotLaws_LeadLagFilter(b_R - AutopilotLaws_P.g_Gain_j * (AutopilotLaws_P.Gain1_Gain_eb *
    (AutopilotLaws_P.Gain_Gain_be * ((AutopilotLaws_P.Gain1_Gain_kb * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_jr *
    (AutopilotLaws_P.Gain_Gain_ln * std::atan(AutopilotLaws_P.fpmtoms_Gain_i * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Add1_om))) * (AutopilotLaws_P.Constant_Value_p - rtb_Sum2_p) + rtb_Cos1_d * std::sin(rtb_Add3_h)))),
    AutopilotLaws_P.HighPassFilter_C1_g, AutopilotLaws_P.HighPassFilter_C2_ad, AutopilotLaws_P.HighPassFilter_C3_il,
    AutopilotLaws_P.HighPassFilter_C4_m, AutopilotLaws_U.in.time.dt, &rtb_Tsxlo,
    &AutopilotLaws_DWork.sf_LeadLagFilter_ka);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_o * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_o, AutopilotLaws_P.LowPassFilter_C2_f, AutopilotLaws_P.LowPassFilter_C3_b,
    AutopilotLaws_P.LowPassFilter_C4_f, AutopilotLaws_U.in.time.dt, &b_R, &AutopilotLaws_DWork.sf_LeadLagFilter_j);
  b_R = (rtb_Tsxlo + b_R) * AutopilotLaws_P.ug_Gain_n;
  rtb_Tsxlo = AutopilotLaws_P.Gain1_Gain_ktr * Phi2;
  rtb_Sum2_p = b_R + rtb_Tsxlo;
  rtb_Tsxlo = (AutopilotLaws_P.Gain1_Gain_hg * b_R + rtb_Tsxlo) * AutopilotLaws_P.Gain_Gain_oe;
  if (b_L > AutopilotLaws_P.Switch_Threshold_l) {
    b_R = AutopilotLaws_P.Constant1_Value_kb;
  } else {
    b_R = AutopilotLaws_P.Gain5_Gain_n * rtb_Tsxlo;
  }

  rtb_Cos1_d = rtb_Y_e * AutopilotLaws_P.Gain1_Gain_af;
  if (rtb_Cos1_d <= b_R) {
    if (b_L > AutopilotLaws_P.Switch1_Threshold_ja) {
      b_R = AutopilotLaws_P.Constant_Value_mj;
    } else {
      b_R = AutopilotLaws_P.Gain6_Gain_nq * rtb_Tsxlo;
    }

    if (rtb_Cos1_d >= b_R) {
      b_R = rtb_Cos1_d;
    }
  }

  b_R += AutopilotLaws_P.Gain_Gain_d3 * rtb_Sum2_p - Phi2;
  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, rtb_Y_m, rtb_Y_j, rtb_Add3_jp,
    AutopilotLaws_P.Gain_Gain_l0 * rtb_Add3_jp, b_R, AutopilotLaws_P.Gain_Gain_jb * b_R, &rtb_Cos1_d, &rtb_Sum2_p);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_c * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_oz) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_oz;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_ou) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_ou;
  }

  rtb_Add3_jp = AutopilotLaws_U.in.input.FPA_c_deg - std::atan(AutopilotLaws_P.fpmtoms_Gain_p *
    AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add1_om) * AutopilotLaws_P.Gain_Gain_gt;
  AutopilotLaws_VSLimiter(AutopilotLaws_P.Gain_Gain_c3 * rtb_Add3_jp, AutopilotLaws_U.in.data.V_tas_kn, &rtb_Y_m);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_aa * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_pp) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_pp;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_ap) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_ap;
  }

  Phi2 = std::atan(AutopilotLaws_P.fpmtoms_Gain_lh * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add1_om) *
    AutopilotLaws_P.Gain_Gain_hy;
  b_R = AutopilotLaws_P.Gain1_Gain_bv * rtb_GainTheta1;
  rtb_Tsxlo = std::cos(b_R);
  rtb_Add3_h = std::sin(b_R);
  b_R = AutopilotLaws_P.ktstomps_Gain_b * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_k * (AutopilotLaws_P.GStoGS_CAS_Gain_i * b_R),
    AutopilotLaws_P.WashoutFilter_C1_ce, AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_WashoutFilter_b1);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_hk * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_id) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_id;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_ij) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_ij;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_j - AutopilotLaws_P.g_Gain_j0 * (AutopilotLaws_P.Gain1_Gain_fr *
    (AutopilotLaws_P.Gain_Gain_gr * ((AutopilotLaws_P.Gain1_Gain_go * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_ek *
    (AutopilotLaws_P.Gain_Gain_g5 * std::atan(AutopilotLaws_P.fpmtoms_Gain_m * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Add1_om))) * (AutopilotLaws_P.Constant_Value_h - rtb_Tsxlo) + rtb_Add3_h * std::sin
    (AutopilotLaws_P.Gain1_Gain_ki * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_ak *
     AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_a,
    AutopilotLaws_P.HighPassFilter_C2_p, AutopilotLaws_P.HighPassFilter_C3_k, AutopilotLaws_P.HighPassFilter_C4_c,
    AutopilotLaws_U.in.time.dt, &b_R, &AutopilotLaws_DWork.sf_LeadLagFilter_g);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_e * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_ll, AutopilotLaws_P.LowPassFilter_C2_b, AutopilotLaws_P.LowPassFilter_C3_d,
    AutopilotLaws_P.LowPassFilter_C4_k, AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_LeadLagFilter_l);
  b_R = (b_R + rtb_Y_j) * AutopilotLaws_P.ug_Gain_l;
  rtb_Tsxlo = AutopilotLaws_P.Gain1_Gain_o5 * Phi2;
  rtb_Add1_om = b_R + rtb_Tsxlo;
  rtb_Tsxlo = (AutopilotLaws_P.Gain1_Gain_pv * b_R + rtb_Tsxlo) * AutopilotLaws_P.Gain_Gain_nn;
  if (b_L > AutopilotLaws_P.Switch_Threshold_o) {
    b_R = AutopilotLaws_P.Constant1_Value_d;
  } else {
    b_R = AutopilotLaws_P.Gain5_Gain_ft * rtb_Tsxlo;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &rtb_Y_j);
  rtb_Y_j = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_j) * AutopilotLaws_P.Gain1_Gain_mt;
  if (rtb_Y_j <= b_R) {
    if (b_L > AutopilotLaws_P.Switch1_Threshold_j) {
      b_R = AutopilotLaws_P.Constant_Value_it;
    } else {
      b_R = AutopilotLaws_P.Gain6_Gain_k * rtb_Tsxlo;
    }

    if (rtb_Y_j >= b_R) {
      b_R = rtb_Y_j;
    }
  }

  rtb_Sum2_g = (AutopilotLaws_P.Gain_Gain_f5 * rtb_Add1_om - Phi2) + b_R;
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_nl * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_an) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_an;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_fk) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_fk;
  }

  Phi2 = std::atan(AutopilotLaws_P.fpmtoms_Gain_mt * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add1_om) *
    AutopilotLaws_P.Gain_Gain_ij;
  rtb_Tsxlo = AutopilotLaws_P.kntoms_Gain_f * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat_anc) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_anc;
  } else if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat_gs) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_gs;
  }

  b_R = AutopilotLaws_P.Gain1_Gain_dv * rtb_GainTheta1;
  rtb_Add1_om = std::cos(b_R);
  rtb_Add3_h = std::sin(b_R);
  b_R = AutopilotLaws_P.ktstomps_Gain_d * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_g * (AutopilotLaws_P.GStoGS_CAS_Gain_e * b_R),
    AutopilotLaws_P.WashoutFilter_C1_p4, AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_WashoutFilter_k);
  AutopilotLaws_LeadLagFilter(rtb_Y_j - AutopilotLaws_P.g_Gain_d * (AutopilotLaws_P.Gain1_Gain_mc *
    (AutopilotLaws_P.Gain_Gain_p1 * ((AutopilotLaws_P.Gain1_Gain_k3 * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_ax *
    (AutopilotLaws_P.Gain_Gain_pc * std::atan(AutopilotLaws_P.fpmtoms_Gain_mg * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Tsxlo))) * (AutopilotLaws_P.Constant_Value_ixi - rtb_Add1_om) + rtb_Add3_h * std::sin
    (AutopilotLaws_P.Gain1_Gain_pvb * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_d2 *
     AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_i,
    AutopilotLaws_P.HighPassFilter_C2_j, AutopilotLaws_P.HighPassFilter_C3_e, AutopilotLaws_P.HighPassFilter_C4_cm,
    AutopilotLaws_U.in.time.dt, &b_R, &AutopilotLaws_DWork.sf_LeadLagFilter_c);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_pl * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_n, AutopilotLaws_P.LowPassFilter_C2_p, AutopilotLaws_P.LowPassFilter_C3_ip,
    AutopilotLaws_P.LowPassFilter_C4_p, AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_LeadLagFilter_d);
  b_R = (b_R + rtb_Y_j) * AutopilotLaws_P.ug_Gain_kk;
  rtb_Tsxlo = AutopilotLaws_P.Gain1_Gain_i5 * Phi2;
  rtb_Add1_om = b_R + rtb_Tsxlo;
  rtb_Tsxlo = (AutopilotLaws_P.Gain1_Gain_cz * b_R + rtb_Tsxlo) * AutopilotLaws_P.Gain_Gain_fl;
  if (b_L > AutopilotLaws_P.Switch_Threshold_p) {
    b_R = AutopilotLaws_P.Constant1_Value_p;
  } else {
    b_R = AutopilotLaws_P.Gain5_Gain_h * rtb_Tsxlo;
  }

  rtb_Y_e *= AutopilotLaws_P.Gain1_Gain_hz;
  if (rtb_Y_e <= b_R) {
    if (b_L > AutopilotLaws_P.Switch1_Threshold_f) {
      b_R = AutopilotLaws_P.Constant_Value_b;
    } else {
      b_R = AutopilotLaws_P.Gain6_Gain_c * rtb_Tsxlo;
    }

    if (rtb_Y_e >= b_R) {
      b_R = rtb_Y_e;
    }
  }

  b_R += AutopilotLaws_P.Gain_Gain_p2 * rtb_Add1_om - Phi2;
  AutopilotLaws_SpeedProtectionSignalSelection(&AutopilotLaws_Y.out, rtb_Add3_jp, rtb_Y_m, rtb_Sum2_g,
    AutopilotLaws_P.Gain_Gain_p0 * rtb_Sum2_g, b_R, AutopilotLaws_P.Gain_Gain_dv * b_R, &rtb_FD_d, &rtb_Add3_h);
  b_L = AutopilotLaws_P.Gain2_Gain_m * AutopilotLaws_U.in.data.H_dot_ft_min *
    AutopilotLaws_P.DiscreteDerivativeVariableTs1_Gain;
  Phi2 = b_L - AutopilotLaws_DWork.Delay_DSTATE_m;
  AutopilotLaws_LagFilter(Phi2 / AutopilotLaws_U.in.time.dt, AutopilotLaws_P.LagFilter2_C1_k, AutopilotLaws_U.in.time.dt,
    &Phi2, &AutopilotLaws_DWork.sf_LagFilter_m);
  AutopilotLaws_WashoutFilter(Phi2, AutopilotLaws_P.WashoutFilter1_C1, AutopilotLaws_U.in.time.dt, &rtb_Y_j,
    &AutopilotLaws_DWork.sf_WashoutFilter_o);
  rtb_Compare_o1 = ((AutopilotLaws_U.in.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK_const) ||
                    (AutopilotLaws_U.in.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK2_const));
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain4_Gain_g * rtb_Y_j, rtb_Compare_o1, &rtb_Y_j);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_gs_error_deg, AutopilotLaws_P.LagFilter1_C1_p,
    AutopilotLaws_U.in.time.dt, &rtb_Y_m, &AutopilotLaws_DWork.sf_LagFilter_j);
  rtb_Add3_jp = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain_o * rtb_Y_m;
  AutopilotLaws_LagFilter(rtb_Y_m + AutopilotLaws_P.Gain3_Gain_n * ((rtb_Add3_jp - AutopilotLaws_DWork.Delay_DSTATE_n) /
    AutopilotLaws_U.in.time.dt), AutopilotLaws_P.LagFilter_C1_m, AutopilotLaws_U.in.time.dt, &b_R,
    &AutopilotLaws_DWork.sf_LagFilter_oq);
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain3_Gain_c * (rtb_Y_j + b_R * look1_binlxpw
    (AutopilotLaws_U.in.data.H_radio_ft, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_ec,
     AutopilotLaws_P.ScheduledGain_Table_l, 5U)), (AutopilotLaws_U.in.data.H_radio_ft >
    AutopilotLaws_P.CompareToConstant_const_k) && AutopilotLaws_U.in.data.nav_gs_valid, &rtb_Tsxlo);
  AutopilotLaws_storevalue(rtb_Saturation == AutopilotLaws_P.CompareToConstant6_const,
    AutopilotLaws_Y.out.data.nav_gs_deg, &rtb_Y_j, &AutopilotLaws_DWork.sf_storevalue_g);
  if (rtb_Y_j > AutopilotLaws_P.Saturation_UpperSat_e0) {
    Phi2 = AutopilotLaws_P.Saturation_UpperSat_e0;
  } else if (rtb_Y_j < AutopilotLaws_P.Saturation_LowerSat_p) {
    Phi2 = AutopilotLaws_P.Saturation_LowerSat_p;
  } else {
    Phi2 = rtb_Y_j;
  }

  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_fb * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_nm) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_nm;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_ai) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_ai;
  }

  b_R = std::atan(AutopilotLaws_P.fpmtoms_Gain_a * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add1_om) *
    AutopilotLaws_P.Gain_Gain_ox;
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain2_Gain_l * (Phi2 - b_R), rtb_Compare_o1, &rtb_Y_j);
  AutopilotLaws_Voter1(rtb_Tsxlo + rtb_Y_j, AutopilotLaws_P.Gain1_Gain_d4 * ((Phi2 + AutopilotLaws_P.Bias_Bias) - b_R),
                       AutopilotLaws_P.Gain_Gain_eyl * ((Phi2 + AutopilotLaws_P.Bias1_Bias) - b_R), &rtb_Sum2_g);
  Phi2 = rtb_GainTheta - AutopilotLaws_P.Constant2_Value_f;
  rtb_Gain4_m = AutopilotLaws_P.Gain4_Gain_o * Phi2;
  rtb_Gain5 = AutopilotLaws_P.Gain5_Gain_c * AutopilotLaws_U.in.data.bz_m_s2;
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.bx_m_s2, AutopilotLaws_P.WashoutFilter_C1_mt,
    AutopilotLaws_U.in.time.dt, &rtb_Y_e, &AutopilotLaws_DWork.sf_WashoutFilter_g);
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.H_ind_ft, AutopilotLaws_P.WashoutFilter_C1_e,
    AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_WashoutFilter_b);
  if (AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.Saturation_UpperSat_e0a) {
    b_R = AutopilotLaws_P.Saturation_UpperSat_e0a;
  } else if (AutopilotLaws_U.in.data.H_radio_ft < AutopilotLaws_P.Saturation_LowerSat_mg) {
    b_R = AutopilotLaws_P.Saturation_LowerSat_mg;
  } else {
    b_R = AutopilotLaws_U.in.data.H_radio_ft;
  }

  AutopilotLaws_LagFilter(b_R, AutopilotLaws_P.LagFilter_C1_p, AutopilotLaws_U.in.time.dt, &Phi2,
    &AutopilotLaws_DWork.sf_LagFilter_ov);
  rtb_Y_m = (rtb_Y_j + Phi2) * AutopilotLaws_P.DiscreteDerivativeVariableTs2_Gain;
  Phi2 = (rtb_Y_m - AutopilotLaws_DWork.Delay_DSTATE_p) / AutopilotLaws_U.in.time.dt;
  AutopilotLaws_LagFilter(AutopilotLaws_P.Gain2_Gain_f * Phi2, AutopilotLaws_P.LagFilter3_C1, AutopilotLaws_U.in.time.dt,
    &Phi2, &AutopilotLaws_DWork.sf_LagFilter_f);
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.H_dot_ft_min, AutopilotLaws_P.WashoutFilter1_C1_g,
    AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_WashoutFilter_f);
  b_R = Phi2 + rtb_Y_j;
  rtb_Compare_o1 = (rtb_Saturation == AutopilotLaws_P.CompareToConstant7_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty) {
    AutopilotLaws_DWork.wasActive = rtb_Compare_o1;
    AutopilotLaws_DWork.wasActive_not_empty = true;
  }

  if ((!AutopilotLaws_DWork.wasActive) && rtb_Compare_o1) {
    Phi2 = std::abs(b_R) / 60.0;
    AutopilotLaws_DWork.Tau = AutopilotLaws_U.in.data.H_radio_ft / (Phi2 - 1.6666666666666667);
    AutopilotLaws_DWork.H_bias = AutopilotLaws_DWork.Tau * Phi2 - AutopilotLaws_U.in.data.H_radio_ft;
  }

  if (rtb_Compare_o1) {
    Phi2 = -1.0 / AutopilotLaws_DWork.Tau * (AutopilotLaws_U.in.data.H_radio_ft + AutopilotLaws_DWork.H_bias) * 60.0;
  } else {
    Phi2 = b_R;
  }

  AutopilotLaws_DWork.wasActive = rtb_Compare_o1;
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_av * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_ew) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_ew;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_an) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_an;
  }

  rtb_Add1_om = (Phi2 - b_R) * AutopilotLaws_P.ftmintoms_Gain_j / rtb_Add1_om;
  if (rtb_Add1_om > 1.0) {
    rtb_Add1_om = 1.0;
  } else if (rtb_Add1_om < -1.0) {
    rtb_Add1_om = -1.0;
  }

  rtb_Gain_of = AutopilotLaws_P.Gain_Gain_by * std::asin(rtb_Add1_om);
  rtb_Sum_ae = AutopilotLaws_P.Constant1_Value_o - rtb_GainTheta;
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_l * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_ol) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_ol;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_c) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_c;
  }

  Phi2 = std::atan(AutopilotLaws_P.fpmtoms_Gain_ib * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Add1_om) *
    AutopilotLaws_P.Gain_Gain_j0;
  b_R = AutopilotLaws_P.Gain1_Gain_nf * rtb_GainTheta1;
  rtb_GainTheta1 = std::cos(b_R);
  rtb_Tsxlo = std::sin(b_R);
  b_R = AutopilotLaws_P.ktstomps_Gain_l0 * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_o * (AutopilotLaws_P.GStoGS_CAS_Gain_g * b_R),
    AutopilotLaws_P.WashoutFilter_C1_g, AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_WashoutFilter_kk);
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_aw * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_ma) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_ma;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_d3) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_d3;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_j - AutopilotLaws_P.g_Gain_g * (AutopilotLaws_P.Gain1_Gain_bfd *
    (AutopilotLaws_P.Gain_Gain_ea * ((AutopilotLaws_P.Gain1_Gain_gs * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_o0 *
    (AutopilotLaws_P.Gain_Gain_gq * std::atan(AutopilotLaws_P.fpmtoms_Gain_fe * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Add1_om))) * (AutopilotLaws_P.Constant_Value_e - rtb_GainTheta1) + rtb_Tsxlo * std::sin
    (AutopilotLaws_P.Gain1_Gain_cx * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_ga *
     AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_n,
    AutopilotLaws_P.HighPassFilter_C2_e, AutopilotLaws_P.HighPassFilter_C3_h, AutopilotLaws_P.HighPassFilter_C4_jk,
    AutopilotLaws_U.in.time.dt, &b_R, &AutopilotLaws_DWork.sf_LeadLagFilter_o);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_c5 * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_h, AutopilotLaws_P.LowPassFilter_C2_ne, AutopilotLaws_P.LowPassFilter_C3_k,
    AutopilotLaws_P.LowPassFilter_C4_g, AutopilotLaws_U.in.time.dt, &rtb_Y_j, &AutopilotLaws_DWork.sf_LeadLagFilter_pt);
  b_R = (b_R + rtb_Y_j) * AutopilotLaws_P.ug_Gain_i2;
  rtb_Tsxlo = AutopilotLaws_P.Gain1_Gain_hvh * Phi2;
  rtb_GainTheta1 = b_R + rtb_Tsxlo;
  rtb_Add1_om = AutopilotLaws_P.Constant2_Value_k - AutopilotLaws_U.in.data.H_ind_ft;
  rtb_Tsxlo = (AutopilotLaws_P.Gain1_Gain_la * b_R + rtb_Tsxlo) * AutopilotLaws_P.Gain_Gain_jz;
  b_R = (AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.input.V_c_kn) * AutopilotLaws_P.Gain1_Gain_pc;
  if ((rtb_Add1_om > AutopilotLaws_P.CompareToConstant_const_ka) && (rtb_Tsxlo <
       AutopilotLaws_P.CompareToConstant1_const_m) && (b_R < AutopilotLaws_P.CompareToConstant2_const_n)) {
    b_R = AutopilotLaws_P.Constant_Value_j;
  } else {
    if (rtb_Add1_om > AutopilotLaws_P.Switch2_Threshold_k) {
      rtb_Y_j = AutopilotLaws_P.Constant1_Value_n;
    } else {
      rtb_Y_j = AutopilotLaws_P.Gain5_Gain_fn * rtb_Tsxlo;
    }

    if (b_R > rtb_Y_j) {
      b_R = rtb_Y_j;
    } else {
      if (rtb_Add1_om > AutopilotLaws_P.Switch1_Threshold_i) {
        rtb_Tsxlo *= AutopilotLaws_P.Gain1_Gain_g;
        if (AutopilotLaws_P.Constant2_Value_j > rtb_Tsxlo) {
          rtb_Tsxlo = AutopilotLaws_P.Constant2_Value_j;
        }
      } else {
        rtb_Tsxlo *= AutopilotLaws_P.Gain6_Gain_kg;
      }

      if (b_R < rtb_Tsxlo) {
        b_R = rtb_Tsxlo;
      }
    }
  }

  rtb_GainTheta1 = (AutopilotLaws_P.Gain_Gain_ed * rtb_GainTheta1 - Phi2) + b_R;
  rtb_Add1_om = AutopilotLaws_P.kntoms_Gain_i * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Add1_om > AutopilotLaws_P.Saturation_UpperSat_j) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_UpperSat_j;
  } else if (rtb_Add1_om < AutopilotLaws_P.Saturation_LowerSat_ih) {
    rtb_Add1_om = AutopilotLaws_P.Saturation_LowerSat_ih;
  }

  rtb_Add1_om = (AutopilotLaws_P.Constant_Value_ia - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_lv / rtb_Add1_om;
  if (rtb_Add1_om > 1.0) {
    rtb_Add1_om = 1.0;
  } else if (rtb_Add1_om < -1.0) {
    rtb_Add1_om = -1.0;
  }

  rtb_Tsxlo = AutopilotLaws_P.Gain_Gain_o1 * std::asin(rtb_Add1_om);
  AutopilotLaws_Voter1(rtb_Sum_ae, rtb_GainTheta1, rtb_Tsxlo, &Phi2);
  switch (static_cast<int32_T>(rtb_Saturation)) {
   case 0:
    Phi2 = AutopilotLaws_P.Constant_Value_dhr;
    break;

   case 1:
    Phi2 = rtb_Saturation1;
    break;

   case 2:
    Phi2 = L;
    break;

   case 3:
    Phi2 = R;
    break;

   case 4:
    Phi2 = rtb_Cos1_d;
    break;

   case 5:
    Phi2 = rtb_FD_d;
    break;

   case 6:
    Phi2 = AutopilotLaws_P.Gain1_Gain_d * rtb_Sum2_g;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch1_Threshold_js) {
      Phi2 = AutopilotLaws_P.Gain2_Gain_h * rtb_Gain4_m;
    } else {
      Phi2 = (AutopilotLaws_P.Gain1_Gain_ix * rtb_Y_e + rtb_Gain5) + rtb_Gain_of;
    }
    break;
  }

  if (Phi2 > AutopilotLaws_P.Constant1_Value_i) {
    Phi2 = AutopilotLaws_P.Constant1_Value_i;
  } else {
    b_R = AutopilotLaws_P.Gain1_Gain_n * AutopilotLaws_P.Constant1_Value_i;
    if (Phi2 < b_R) {
      Phi2 = b_R;
    }
  }

  Phi2 -= a;
  AutopilotLaws_DWork.icLoad_f = ((AutopilotLaws_Y.out.output.ap_on == 0.0) || AutopilotLaws_DWork.icLoad_f);
  if (AutopilotLaws_DWork.icLoad_f) {
    AutopilotLaws_DWork.Delay_DSTATE_h2 = rtb_GainTheta;
  }

  AutopilotLaws_Voter1(rtb_Sum_ae, AutopilotLaws_P.Gain_Gain_fm * rtb_GainTheta1, AutopilotLaws_P.VS_Gain_nx * rtb_Tsxlo,
                       &b_R);
  switch (static_cast<int32_T>(rtb_Saturation)) {
   case 0:
    b_R = AutopilotLaws_P.Constant_Value_dhr;
    break;

   case 1:
    b_R = AutopilotLaws_P.VS_Gain_n * rtb_Saturation1;
    break;

   case 2:
    b_R = rtb_out_f;
    break;

   case 3:
    b_R = AutopilotLaws_P.Gain_Gain_j * R;
    break;

   case 4:
    b_R = rtb_Sum2_p;
    break;

   case 5:
    b_R = rtb_Add3_h;
    break;

   case 6:
    b_R = rtb_Sum2_g;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch_Threshold) {
      b_R = rtb_Gain4_m;
    } else {
      b_R = (AutopilotLaws_P.Gain3_Gain * rtb_Y_e + rtb_Gain5) + AutopilotLaws_P.VS_Gain_e * rtb_Gain_of;
    }
    break;
  }

  b_R += rtb_GainTheta;
  if (b_R > AutopilotLaws_P.Constant1_Value_i) {
    b_R = AutopilotLaws_P.Constant1_Value_i;
  } else {
    rtb_GainTheta1 = AutopilotLaws_P.Gain1_Gain_m * AutopilotLaws_P.Constant1_Value_i;
    if (b_R < rtb_GainTheta1) {
      b_R = rtb_GainTheta1;
    }
  }

  rtb_Add1_om = b_R - AutopilotLaws_DWork.Delay_DSTATE_h2;
  a = AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (rtb_Add1_om < a) {
    a = rtb_Add1_om;
  }

  L = AutopilotLaws_P.Gain1_Gain_i0 * AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (a > L) {
    L = a;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h2 += L;
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h2, AutopilotLaws_P.LagFilter_C1_i,
    AutopilotLaws_U.in.time.dt, &a, &AutopilotLaws_DWork.sf_LagFilter_gn);
  AutopilotLaws_RateLimiter(AutopilotLaws_Y.out.output.ap_on, AutopilotLaws_P.RateLimiterVariableTs_up_i,
    AutopilotLaws_P.RateLimiterVariableTs_lo_o, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_p, &rtb_Y_j, &AutopilotLaws_DWork.sf_RateLimiter_e);
  if (rtb_Y_j > AutopilotLaws_P.Saturation_UpperSat_ix) {
    b_R = AutopilotLaws_P.Saturation_UpperSat_ix;
  } else if (rtb_Y_j < AutopilotLaws_P.Saturation_LowerSat_e) {
    b_R = AutopilotLaws_P.Saturation_LowerSat_e;
  } else {
    b_R = rtb_Y_j;
  }

  AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = Phi2;
  AutopilotLaws_Y.out.output.autopilot.Theta_c_deg = (AutopilotLaws_P.Constant_Value_i4 - b_R) * rtb_GainTheta + a * b_R;
  for (rtb_on_ground = 0; rtb_on_ground < 99; rtb_on_ground++) {
    AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground + 1];
    AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground + 1];
  }

  AutopilotLaws_DWork.Delay_DSTATE_l[99] = rtb_valid;
  AutopilotLaws_DWork.Delay_DSTATE_h5[99] = rtb_valid_d;
  AutopilotLaws_DWork.Delay_DSTATE_e = rtb_dme;
  AutopilotLaws_DWork.icLoad = false;
  AutopilotLaws_DWork.Delay_DSTATE_m = b_L;
  AutopilotLaws_DWork.Delay_DSTATE_n = rtb_Add3_jp;
  AutopilotLaws_DWork.Delay_DSTATE_p = rtb_Y_m;
  AutopilotLaws_DWork.icLoad_f = false;
}

void AutopilotLawsModelClass::initialize()
{
  {
    real_T rtb_out_g;
    int32_T i;
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[i] = AutopilotLaws_P.Delay_InitialCondition;
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }

    AutopilotLaws_DWork.Delay_DSTATE_e = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition;
    AutopilotLaws_DWork.icLoad = true;
    AutopilotLaws_DWork.Delay_DSTATE_m = AutopilotLaws_P.DiscreteDerivativeVariableTs1_InitialCondition;
    AutopilotLaws_DWork.Delay_DSTATE_n = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition_c;
    AutopilotLaws_DWork.Delay_DSTATE_p = AutopilotLaws_P.DiscreteDerivativeVariableTs2_InitialCondition;
    AutopilotLaws_DWork.icLoad_f = true;
    AutopilotLaws_Chart_g_Init(&rtb_out_g);
    AutopilotLaws_Chart_g_Init(&rtb_out_g);
    AutopilotLaws_Chart_Init(&rtb_out_g);
    AutopilotLaws_Chart_Init(&rtb_out_g);
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
