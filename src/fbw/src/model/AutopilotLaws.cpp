#include "AutopilotLaws.h"
#include "AutopilotLaws_private.h"
#include "look1_binlxpw.h"
#include "mod_lHmooAo5.h"
#include "rt_modd.h"

const uint8_T AutopilotLaws_IN_any = 1U;
const uint8_T AutopilotLaws_IN_left = 2U;
const uint8_T AutopilotLaws_IN_right = 3U;
const uint8_T AutopilotLaws_IN_any_p = 1U;
const uint8_T AutopilotLaws_IN_left_o = 2U;
const uint8_T AutopilotLaws_IN_right_m = 3U;
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
  if (localDW->is_active_c10_srSgcGQg2zvTgc1tMselx4F_ap_library == 0U) {
    localDW->is_active_c10_srSgcGQg2zvTgc1tMselx4F_ap_library = 1U;
    localDW->is_c10_srSgcGQg2zvTgc1tMselx4F_ap_library = AutopilotLaws_IN_any;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c10_srSgcGQg2zvTgc1tMselx4F_ap_library) {
     case AutopilotLaws_IN_any:
      tmp = std::abs(rtu_right);
      tmp_0 = std::abs(rtu_left);
      tmp_1 = !rtu_use_short_path;
      if (tmp_1 && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
        localDW->is_c10_srSgcGQg2zvTgc1tMselx4F_ap_library = AutopilotLaws_IN_right;
        *rty_out = rtu_right;
      } else if (tmp_1 && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
        localDW->is_c10_srSgcGQg2zvTgc1tMselx4F_ap_library = AutopilotLaws_IN_left;
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
        localDW->is_c10_srSgcGQg2zvTgc1tMselx4F_ap_library = AutopilotLaws_IN_any;
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
        localDW->is_c10_srSgcGQg2zvTgc1tMselx4F_ap_library = AutopilotLaws_IN_any;
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

void AutopilotLawsModelClass::AutopilotLaws_Chart_p_Init(real_T *rty_out)
{
  *rty_out = 0.0;
}

void AutopilotLawsModelClass::AutopilotLaws_Chart_j(real_T rtu_right, real_T rtu_left, real_T rtu_use_short_path, real_T
  *rty_out, rtDW_Chart_AutopilotLaws_c_T *localDW)
{
  real_T tmp;
  real_T tmp_0;
  if (localDW->is_active_c10_s7y0WEx1xKopCu1ds66dilB_ap_library == 0U) {
    localDW->is_active_c10_s7y0WEx1xKopCu1ds66dilB_ap_library = 1U;
    localDW->is_c10_s7y0WEx1xKopCu1ds66dilB_ap_library = AutopilotLaws_IN_any_p;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c10_s7y0WEx1xKopCu1ds66dilB_ap_library) {
     case AutopilotLaws_IN_any_p:
      tmp = std::abs(rtu_right);
      tmp_0 = std::abs(rtu_left);
      if ((rtu_use_short_path == 0.0) && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
        localDW->is_c10_s7y0WEx1xKopCu1ds66dilB_ap_library = AutopilotLaws_IN_right_m;
        *rty_out = rtu_right;
      } else if ((rtu_use_short_path == 0.0) && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
        localDW->is_c10_s7y0WEx1xKopCu1ds66dilB_ap_library = AutopilotLaws_IN_left_o;
        *rty_out = rtu_left;
      } else if (tmp_0 < tmp) {
        *rty_out = rtu_left;
      } else {
        *rty_out = rtu_right;
      }
      break;

     case AutopilotLaws_IN_left_o:
      tmp = std::abs(rtu_left);
      tmp_0 = std::abs(rtu_right);
      if ((rtu_use_short_path != 0.0) || (tmp_0 < 10.0) || (tmp < 10.0)) {
        localDW->is_c10_s7y0WEx1xKopCu1ds66dilB_ap_library = AutopilotLaws_IN_any_p;
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
        localDW->is_c10_s7y0WEx1xKopCu1ds66dilB_ap_library = AutopilotLaws_IN_any_p;
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

void AutopilotLawsModelClass::AutopilotLaws_SpeedProtectionMode1(const ap_laws_output *rtu_in, real_T rtu_VS_FD, real_T
  rtu_VS_AP, real_T rtu_VLS_FD, real_T rtu_VLS_AP, real_T rtu_VMAX_FD, real_T rtu_VMAX_AP, real_T *rty_FD, real_T
  *rty_AP)
{
  real_T rtu_in_0;
  if (rtu_in->input.V_c_kn <= rtu_in->data.VLS_kn) {
    rtu_in_0 = rtu_in->data.VLS_kn - 5.0;
  } else {
    rtu_in_0 = rtu_in->data.VLS_kn;
  }

  if (rtu_in->data.V_ias_kn < rtu_in_0 + 10.0) {
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
  } else if (rtu_in->data.V_ias_kn > rtu_in->data.VMAX_kn - 10.0) {
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

void AutopilotLawsModelClass::AutopilotLaws_V_LSSpeedSelection(const ap_laws_output *rtu_in, real_T *rty_y)
{
  if (rtu_in->input.V_c_kn <= rtu_in->data.VLS_kn) {
    *rty_y = rtu_in->data.VLS_kn - 5.0;
  } else {
    *rty_y = rtu_in->data.VLS_kn;
  }
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
  real_T rtb_FD;
  real_T rtb_FD_m;
  real_T rtb_Gain5;
  real_T rtb_GainTheta;
  real_T rtb_GainTheta1;
  real_T rtb_Gain_bh;
  real_T rtb_Gain_du;
  real_T rtb_Gain_gw;
  real_T rtb_Saturation;
  real_T rtb_Saturation1;
  real_T rtb_Sum2_f;
  real_T rtb_Sum2_lf;
  real_T rtb_Sum2_o;
  real_T rtb_Sum_c4;
  real_T rtb_Sum_j;
  real_T rtb_Y_fm;
  real_T rtb_Y_fw;
  real_T rtb_Y_i;
  real_T rtb_dme;
  real_T rtb_out_f;
  int32_T i;
  int32_T rtb_on_ground;
  boolean_T guard1 = false;
  boolean_T rtb_Compare_l;
  boolean_T rtb_Compare_ng;
  boolean_T rtb_Delay_mo;
  boolean_T rtb_valid;
  boolean_T rtb_valid_o;
  rtb_Compare_ng = ((AutopilotLaws_U.in.input.enabled_AP1 != 0.0) || (AutopilotLaws_U.in.input.enabled_AP2 != 0.0));
  rtb_GainTheta = AutopilotLaws_P.GainTheta_Gain * AutopilotLaws_U.in.data.Theta_deg;
  rtb_GainTheta1 = AutopilotLaws_P.GainTheta1_Gain * AutopilotLaws_U.in.data.Phi_deg;
  rtb_dme = 0.017453292519943295 * rtb_GainTheta;
  b_R = 0.017453292519943295 * rtb_GainTheta1;
  rtb_Saturation1 = std::tan(rtb_dme);
  Phi2 = std::sin(b_R);
  b_R = std::cos(b_R);
  result_tmp[0] = 1.0;
  result_tmp[3] = Phi2 * rtb_Saturation1;
  result_tmp[6] = b_R * rtb_Saturation1;
  result_tmp[1] = 0.0;
  result_tmp[4] = b_R;
  result_tmp[7] = -Phi2;
  result_tmp[2] = 0.0;
  L = std::cos(rtb_dme);
  rtb_out_f = 1.0 / L;
  result_tmp[5] = rtb_out_f * Phi2;
  result_tmp[8] = rtb_out_f * b_R;
  a = AutopilotLaws_P.Gain_Gain_de * AutopilotLaws_U.in.data.p_rad_s * AutopilotLaws_P.Gainpk_Gain;
  rtb_Saturation = AutopilotLaws_P.Gain_Gain_dc * AutopilotLaws_U.in.data.q_rad_s * AutopilotLaws_P.Gainqk_Gain;
  rtb_Saturation1 = AutopilotLaws_P.Gain_Gain_m * AutopilotLaws_U.in.data.r_rad_s;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result[rtb_on_ground] = result_tmp[rtb_on_ground + 6] * rtb_Saturation1 + (result_tmp[rtb_on_ground + 3] *
      rtb_Saturation + result_tmp[rtb_on_ground] * a);
  }

  a = std::sin(rtb_dme);
  result_tmp[0] = L;
  result_tmp[3] = 0.0;
  result_tmp[6] = -a;
  result_tmp[1] = Phi2 * a;
  result_tmp[4] = b_R;
  result_tmp[7] = L * Phi2;
  result_tmp[2] = b_R * a;
  result_tmp[5] = 0.0 - Phi2;
  result_tmp[8] = b_R * L;
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
      rtb_valid_o = true;
      a = std::asin(rtb_out_f / a) * 57.295779513082323 - AutopilotLaws_DWork.nav_gs_deg;
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
  a = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_track_deg - (AutopilotLaws_U.in.data.nav_loc_deg +
    AutopilotLaws_P.Constant3_Value_e)) + AutopilotLaws_P.Constant3_Value_e, AutopilotLaws_P.Constant3_Value_e);
  rtb_Saturation = rt_modd(AutopilotLaws_P.Constant3_Value_e - a, AutopilotLaws_P.Constant3_Value_e);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting == 1) {
    b_R = AutopilotLaws_P.Constant_Value_d;
  } else {
    b_R = AutopilotLaws_U.in.input.lateral_law;
  }

  rtb_valid = (b_R == AutopilotLaws_P.CompareToConstant2_const);
  if (a < rtb_Saturation) {
    a *= AutopilotLaws_P.Gain1_Gain;
  } else {
    a = AutopilotLaws_P.Gain_Gain * rtb_Saturation;
  }

  a = std::abs(a);
  if (!AutopilotLaws_DWork.limit_not_empty) {
    AutopilotLaws_DWork.limit = a;
    AutopilotLaws_DWork.limit_not_empty = true;
  }

  if (!rtb_valid) {
    if (a > 15.0) {
      AutopilotLaws_DWork.limit = a;
    } else {
      AutopilotLaws_DWork.limit = 15.0;
    }

    if (AutopilotLaws_DWork.limit >= 115.0) {
      AutopilotLaws_DWork.limit = 115.0;
    }
  }

  if (rtb_valid && (a < 15.0)) {
    AutopilotLaws_DWork.limit = 15.0;
  }

  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value, AutopilotLaws_P.zeta_Value, &Phi2, &L);
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_c) {
    a = AutopilotLaws_P.Saturation_UpperSat_c;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_d) {
    a = AutopilotLaws_P.Saturation_LowerSat_d;
  } else {
    a = rtb_dme;
  }

  a = std::sin(AutopilotLaws_P.Gain1_Gain_g * AutopilotLaws_U.in.data.nav_loc_error_deg) * a *
    AutopilotLaws_P.Gain_Gain_dx * L / AutopilotLaws_U.in.data.V_gnd_kn;
  rtb_Saturation = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_track_deg - (rt_modd(rt_modd
    (AutopilotLaws_U.in.data.nav_loc_error_deg + AutopilotLaws_U.in.data.nav_loc_deg, AutopilotLaws_P.Constant3_Value_m)
    + AutopilotLaws_P.Constant3_Value_m, AutopilotLaws_P.Constant3_Value_m) + AutopilotLaws_P.Constant3_Value_a)) +
    AutopilotLaws_P.Constant3_Value_a, AutopilotLaws_P.Constant3_Value_a);
  rtb_Saturation1 = rt_modd(AutopilotLaws_P.Constant3_Value_a - rtb_Saturation, AutopilotLaws_P.Constant3_Value_a);
  if (a > AutopilotLaws_DWork.limit) {
    a = AutopilotLaws_DWork.limit;
  } else if (a < -AutopilotLaws_DWork.limit) {
    a = -AutopilotLaws_DWork.limit;
  }

  if (rtb_Saturation < rtb_Saturation1) {
    rtb_Saturation *= AutopilotLaws_P.Gain1_Gain_p;
  } else {
    rtb_Saturation = AutopilotLaws_P.Gain_Gain_p * rtb_Saturation1;
  }

  a = (AutopilotLaws_P.Gain2_Gain_i * rtb_Saturation + a) * Phi2 * AutopilotLaws_U.in.data.V_gnd_kn;
  rtb_Saturation1 = rt_modd((AutopilotLaws_U.in.data.nav_loc_deg - (AutopilotLaws_U.in.data.Psi_magnetic_deg +
    AutopilotLaws_P.Constant3_Value_j)) + AutopilotLaws_P.Constant3_Value_j, AutopilotLaws_P.Constant3_Value_j);
  AutopilotLaws_Chart_j(rtb_Saturation1, AutopilotLaws_P.Gain_Gain_nj * rt_modd(AutopilotLaws_P.Constant3_Value_j -
    rtb_Saturation1, AutopilotLaws_P.Constant3_Value_j), AutopilotLaws_P.Constant2_Value, &rtb_Saturation,
                        &AutopilotLaws_DWork.sf_Chart_j);
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_o) {
    rtb_dme = AutopilotLaws_P.Saturation_UpperSat_o;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_o) {
    rtb_dme = AutopilotLaws_P.Saturation_LowerSat_o;
  }

  b_L = std::sin(AutopilotLaws_P.Gain1_Gain_h5 * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_dme *
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

  AutopilotLaws_DWork.Delay_DSTATE += AutopilotLaws_P.Gain6_Gain * b_L *
    AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_Gain * AutopilotLaws_U.in.time.dt;
  if (AutopilotLaws_DWork.Delay_DSTATE > AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (AutopilotLaws_DWork.Delay_DSTATE < AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  AutopilotLaws_storevalue(rtb_Compare_l, AutopilotLaws_U.in.data.nav_loc_deg, &L, &AutopilotLaws_DWork.sf_storevalue);
  rtb_dme = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_deg - (rt_modd(rt_modd
    (AutopilotLaws_U.in.data.nav_loc_error_deg + L, AutopilotLaws_P.Constant3_Value_m0) +
    AutopilotLaws_P.Constant3_Value_m0, AutopilotLaws_P.Constant3_Value_m0) + AutopilotLaws_P.Constant3_Value_eg)) +
                    AutopilotLaws_P.Constant3_Value_eg, AutopilotLaws_P.Constant3_Value_eg);
  rtb_Saturation1 = rt_modd(AutopilotLaws_P.Constant3_Value_eg - rtb_dme, AutopilotLaws_P.Constant3_Value_eg);
  if (rtb_dme < rtb_Saturation1) {
    rtb_dme *= AutopilotLaws_P.Gain1_Gain_n;
  } else {
    rtb_dme = AutopilotLaws_P.Gain_Gain_k * rtb_Saturation1;
  }

  rtb_dme = rt_modd((rt_modd(rt_modd(((b_L * look1_binlxpw(AutopilotLaws_U.in.data.V_gnd_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain_Table, 2U) +
    AutopilotLaws_DWork.Delay_DSTATE) + AutopilotLaws_P.Gain1_Gain_f * rtb_dme) +
    AutopilotLaws_U.in.data.Psi_magnetic_deg, AutopilotLaws_P.Constant3_Value_c) + AutopilotLaws_P.Constant3_Value_c,
    AutopilotLaws_P.Constant3_Value_c) - (AutopilotLaws_U.in.data.Psi_magnetic_deg + AutopilotLaws_P.Constant3_Value_h))
                    + AutopilotLaws_P.Constant3_Value_h, AutopilotLaws_P.Constant3_Value_h);
  AutopilotLaws_Chart_j(rtb_dme, AutopilotLaws_P.Gain_Gain_py * rt_modd(AutopilotLaws_P.Constant3_Value_h - rtb_dme,
    AutopilotLaws_P.Constant3_Value_h), AutopilotLaws_P.Constant1_Value_e2, &rtb_Saturation1,
                        &AutopilotLaws_DWork.sf_Chart_o);
  rtb_dme = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_deg +
    AutopilotLaws_P.Constant3_Value_d)) + AutopilotLaws_P.Constant3_Value_d, AutopilotLaws_P.Constant3_Value_d);
  rtb_valid = ((b_R == AutopilotLaws_P.CompareToConstant5_const) == AutopilotLaws_P.CompareToConstant_const_h);
  Phi2 = AutopilotLaws_P.Subsystem_Value / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[i] = AutopilotLaws_P.Delay_InitialCondition;
    }
  }

  if (Phi2 < 1.0) {
    rtb_valid_o = rtb_valid;
  } else {
    if (Phi2 > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::floor(Phi2), 4.294967296E+9)));
    }

    rtb_valid_o = AutopilotLaws_DWork.Delay_DSTATE_l[100U - i];
  }

  AutopilotLaws_Chart(rtb_dme, AutopilotLaws_P.Gain_Gain_ac * rt_modd(AutopilotLaws_P.Constant3_Value_d - rtb_dme,
    AutopilotLaws_P.Constant3_Value_d), rtb_valid != rtb_valid_o, &rtb_out_f, &AutopilotLaws_DWork.sf_Chart);
  rtb_dme = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_track_deg +
    AutopilotLaws_P.Constant3_Value_n)) + AutopilotLaws_P.Constant3_Value_n, AutopilotLaws_P.Constant3_Value_n);
  rtb_valid_o = ((b_R == AutopilotLaws_P.CompareToConstant4_const) == AutopilotLaws_P.CompareToConstant_const_e);
  Phi2 = AutopilotLaws_P.Subsystem_Value_n / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid_o) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }
  }

  if (Phi2 < 1.0) {
    rtb_Delay_mo = rtb_valid_o;
  } else {
    if (Phi2 > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::floor(Phi2), 4.294967296E+9)));
    }

    rtb_Delay_mo = AutopilotLaws_DWork.Delay_DSTATE_h5[100U - i];
  }

  AutopilotLaws_Chart(rtb_dme, AutopilotLaws_P.Gain_Gain_e * rt_modd(AutopilotLaws_P.Constant3_Value_n - rtb_dme,
    AutopilotLaws_P.Constant3_Value_n), rtb_valid_o != rtb_Delay_mo, &R, &AutopilotLaws_DWork.sf_Chart_b);
  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value_c, AutopilotLaws_P.zeta_Value_h, &rtb_Y_fm, &b_L);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_loc_error_deg, AutopilotLaws_P.LagFilter2_C1,
    AutopilotLaws_U.in.time.dt, &Phi2, &AutopilotLaws_DWork.sf_LagFilter_e);
  rtb_dme = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain * Phi2;
  AutopilotLaws_LagFilter(Phi2 + AutopilotLaws_P.Gain3_Gain_i * ((rtb_dme - AutopilotLaws_DWork.Delay_DSTATE_i) /
    AutopilotLaws_U.in.time.dt), AutopilotLaws_P.LagFilter_C1, AutopilotLaws_U.in.time.dt, &L,
    &AutopilotLaws_DWork.sf_LagFilter);
  rtb_Delay_mo = (AutopilotLaws_U.in.data.H_radio_ft <= AutopilotLaws_P.CompareToConstant_const_d);
  switch (static_cast<int32_T>(b_R)) {
   case 0:
    b_L = rtb_GainTheta1;
    break;

   case 1:
    b_L = rtb_out_f * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_a, AutopilotLaws_P.ScheduledGain_Table_i, 6U) *
      AutopilotLaws_P.Gain1_Gain_p1 + AutopilotLaws_P.Gain_Gain_d * result[2];
    break;

   case 2:
    b_L = R * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_d,
      AutopilotLaws_P.ScheduledGain_Table_h, 6U) * AutopilotLaws_P.Gain1_Gain_c + AutopilotLaws_P.Gain_Gain_p4 * result
      [2];
    break;

   case 3:
    rtb_out_f = AutopilotLaws_P.Gain_Gain_c * AutopilotLaws_U.in.data.flight_guidance_xtk_nmi * b_L /
      AutopilotLaws_U.in.data.V_gnd_kn;
    if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat) {
      rtb_out_f = AutopilotLaws_P.Saturation_UpperSat;
    } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat) {
      rtb_out_f = AutopilotLaws_P.Saturation_LowerSat;
    }

    b_L = AutopilotLaws_U.in.data.flight_guidance_phi_deg - (AutopilotLaws_P.Gain2_Gain *
      AutopilotLaws_U.in.data.flight_guidance_tae_deg + rtb_out_f) * rtb_Y_fm * AutopilotLaws_U.in.data.V_gnd_kn;
    break;

   case 4:
    b_L = a;
    break;

   case 5:
    if (rtb_Delay_mo) {
      Phi2 = AutopilotLaws_P.k_beta_Phi_Gain * AutopilotLaws_U.in.data.beta_deg;
    } else {
      Phi2 = AutopilotLaws_P.Constant1_Value_f;
    }

    b_L = L * look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_e,
      AutopilotLaws_P.ScheduledGain_Table_p, 4U) * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain2_Table, 6U) + Phi2;
    break;

   default:
    b_L = AutopilotLaws_P.Constant3_Value;
    break;
  }

  Phi2 = look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ROLLLIM1_bp01Data,
                       AutopilotLaws_P.ROLLLIM1_tableData, 4U);
  if (b_L > Phi2) {
    b_L = Phi2;
  } else {
    Phi2 *= AutopilotLaws_P.Gain1_Gain_l;
    if (b_L < Phi2) {
      b_L = Phi2;
    }
  }

  rtb_Y_i = (b_L - rtb_GainTheta1) * AutopilotLaws_P.Gain_Gain_l;
  if (rtb_Delay_mo) {
    Phi2 = AutopilotLaws_P.Gain_Gain_a * rtb_Saturation + AutopilotLaws_P.Gain1_Gain_k *
      AutopilotLaws_U.in.data.beta_deg;
  } else {
    Phi2 = AutopilotLaws_P.Constant1_Value_f;
  }

  AutopilotLaws_LagFilter(Phi2, AutopilotLaws_P.LagFilter1_C1, AutopilotLaws_U.in.time.dt, &L,
    &AutopilotLaws_DWork.sf_LagFilter_j);
  if (!AutopilotLaws_DWork.pY_not_empty) {
    AutopilotLaws_DWork.pY = AutopilotLaws_P.RateLimiterVariableTs_InitialCondition;
    AutopilotLaws_DWork.pY_not_empty = true;
  }

  rtb_out_f = static_cast<real_T>(rtb_Compare_l) - AutopilotLaws_DWork.pY;
  rtb_Sum2_o = std::abs(AutopilotLaws_P.RateLimiterVariableTs_up) * AutopilotLaws_U.in.time.dt;
  if (rtb_out_f < rtb_Sum2_o) {
    rtb_Sum2_o = rtb_out_f;
  }

  rtb_Gain_gw = -std::abs(AutopilotLaws_P.RateLimiterVariableTs_lo) * AutopilotLaws_U.in.time.dt;
  if (rtb_Sum2_o > rtb_Gain_gw) {
    rtb_Gain_gw = rtb_Sum2_o;
  }

  AutopilotLaws_DWork.pY += rtb_Gain_gw;
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
    b_R = AutopilotLaws_P.beta_Value_d;
    break;

   case 5:
    if (L > AutopilotLaws_P.Saturation_UpperSat_e) {
      b_R = AutopilotLaws_P.Saturation_UpperSat_e;
    } else if (L < AutopilotLaws_P.Saturation_LowerSat_f) {
      b_R = AutopilotLaws_P.Saturation_LowerSat_f;
    } else {
      b_R = L;
    }
    break;

   default:
    if (AutopilotLaws_DWork.pY > AutopilotLaws_P.Saturation_UpperSat_g) {
      b_R = AutopilotLaws_P.Saturation_UpperSat_g;
    } else if (AutopilotLaws_DWork.pY < AutopilotLaws_P.Saturation_LowerSat_l) {
      b_R = AutopilotLaws_P.Saturation_LowerSat_l;
    } else {
      b_R = AutopilotLaws_DWork.pY;
    }

    b_R = (AutopilotLaws_P.Gain_Gain_b * result[2] * b_R + (AutopilotLaws_P.Constant_Value - b_R) *
           (AutopilotLaws_P.Gain4_Gain * AutopilotLaws_U.in.data.beta_deg)) + AutopilotLaws_P.Gain5_Gain *
      rtb_Saturation1;
    break;
  }

  AutopilotLaws_DWork.icLoad = ((!rtb_Compare_ng) || AutopilotLaws_DWork.icLoad);
  if (AutopilotLaws_DWork.icLoad) {
    AutopilotLaws_DWork.Delay_DSTATE_h = rtb_GainTheta1;
  }

  rtb_out_f = b_L - AutopilotLaws_DWork.Delay_DSTATE_h;
  rtb_Sum2_o = AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (rtb_out_f < rtb_Sum2_o) {
    rtb_Sum2_o = rtb_out_f;
  }

  rtb_Gain_gw = AutopilotLaws_P.Gain1_Gain_kf * AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (rtb_Sum2_o > rtb_Gain_gw) {
    rtb_Gain_gw = rtb_Sum2_o;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h += rtb_Gain_gw;
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h, AutopilotLaws_P.LagFilter_C1_l, AutopilotLaws_U.in.time.dt,
    &rtb_Y_fm, &AutopilotLaws_DWork.sf_LagFilter_d);
  AutopilotLaws_RateLimiter(static_cast<real_T>(rtb_Compare_ng), AutopilotLaws_P.RateLimiterVariableTs_up_b,
    AutopilotLaws_P.RateLimiterVariableTs_lo_b, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_i, &L, &AutopilotLaws_DWork.sf_RateLimiter_m);
  if (L > AutopilotLaws_P.Saturation_UpperSat_j) {
    R = AutopilotLaws_P.Saturation_UpperSat_j;
  } else if (L < AutopilotLaws_P.Saturation_LowerSat_p) {
    R = AutopilotLaws_P.Saturation_LowerSat_p;
  } else {
    R = L;
  }

  AutopilotLaws_Y.out.output.Phi_loc_c = a;
  AutopilotLaws_Y.out.output.flight_director.Beta_c_deg = b_R;
  AutopilotLaws_Y.out.output.autopilot.Beta_c_deg = b_R;
  AutopilotLaws_Y.out.output.flight_director.Phi_c_deg = rtb_Y_i;
  AutopilotLaws_Y.out.output.autopilot.Phi_c_deg = (AutopilotLaws_P.Constant_Value_n - R) * rtb_GainTheta1 + rtb_Y_fm *
    R;
  AutopilotLaws_WashoutFilter(rtb_GainTheta, AutopilotLaws_P.WashoutFilter_C1, AutopilotLaws_U.in.time.dt, &b_R,
    &AutopilotLaws_DWork.sf_WashoutFilter_j);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting_b == 1) {
    rtb_GainTheta1 = AutopilotLaws_P.Constant_Value_m;
  } else {
    rtb_GainTheta1 = AutopilotLaws_U.in.input.vertical_law;
  }

  if (AutopilotLaws_U.in.input.ALT_soft_mode_active) {
    R = (AutopilotLaws_U.in.input.V_c_kn - AutopilotLaws_U.in.data.V_ias_kn) * AutopilotLaws_P.Gain1_Gain_b;
    if (R > AutopilotLaws_P.Saturation1_UpperSat) {
      R = AutopilotLaws_P.Saturation1_UpperSat;
    } else if (R < AutopilotLaws_P.Saturation1_LowerSat) {
      R = AutopilotLaws_P.Saturation1_LowerSat;
    }
  } else {
    R = AutopilotLaws_P.Constant1_Value;
  }

  if (rtb_GainTheta1 != AutopilotLaws_P.CompareToConstant5_const_e) {
    AutopilotLaws_B.u = (AutopilotLaws_U.in.input.H_c_ft + AutopilotLaws_U.in.data.H_ft) -
      AutopilotLaws_U.in.data.H_ind_ft;
  }

  AutopilotLaws_LagFilter(AutopilotLaws_B.u - AutopilotLaws_U.in.data.H_ft, AutopilotLaws_P.LagFilter_C1_a,
    AutopilotLaws_U.in.time.dt, &L, &AutopilotLaws_DWork.sf_LagFilter_k);
  rtb_out_f = AutopilotLaws_P.Gain_Gain_f * L + R;
  a = AutopilotLaws_P.kntoms_Gain * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_n) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_n;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_d4) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_d4;
  }

  if (a > AutopilotLaws_P.Saturation_UpperSat_n3) {
    a = AutopilotLaws_P.Saturation_UpperSat_n3;
  } else if (a < AutopilotLaws_P.Saturation_LowerSat_m) {
    a = AutopilotLaws_P.Saturation_LowerSat_m;
  }

  rtb_out_f = (rtb_out_f - AutopilotLaws_U.in.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain / a;
  if (rtb_out_f > 1.0) {
    rtb_out_f = 1.0;
  } else if (rtb_out_f < -1.0) {
    rtb_out_f = -1.0;
  }

  a = AutopilotLaws_P.Gain_Gain_kr * std::asin(rtb_out_f);
  rtb_Compare_ng = (rtb_GainTheta1 == AutopilotLaws_P.CompareToConstant1_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty_m) {
    AutopilotLaws_DWork.wasActive_g = rtb_Compare_ng;
    AutopilotLaws_DWork.wasActive_not_empty_m = true;
  }

  rtb_Saturation = AutopilotLaws_U.in.input.H_c_ft - AutopilotLaws_U.in.data.H_ind_ft;
  if (rtb_Saturation < 0.0) {
    rtb_Saturation1 = -1.0;
  } else if (rtb_Saturation > 0.0) {
    rtb_Saturation1 = 1.0;
  } else {
    rtb_Saturation1 = rtb_Saturation;
  }

  rtb_Saturation1 = rtb_Saturation1 * AutopilotLaws_DWork.dH_offset + rtb_Saturation;
  if ((!AutopilotLaws_DWork.wasActive_g) && rtb_Compare_ng) {
    AutopilotLaws_DWork.k = AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation1;
    AutopilotLaws_DWork.dH_offset = std::abs(500.0 / std::abs(AutopilotLaws_DWork.k) - 100.0);
    if (rtb_Saturation1 < 0.0) {
      Phi2 = -1.0;
    } else if (rtb_Saturation1 > 0.0) {
      Phi2 = 1.0;
    } else {
      Phi2 = rtb_Saturation1;
    }

    rtb_Saturation1 += Phi2 * AutopilotLaws_DWork.dH_offset;
    AutopilotLaws_DWork.k = AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation1;
    AutopilotLaws_DWork.maxH_dot = std::abs(AutopilotLaws_U.in.data.H_dot_ft_min);
  }

  rtb_Saturation1 *= AutopilotLaws_DWork.k;
  if (std::abs(rtb_Saturation1) > AutopilotLaws_DWork.maxH_dot) {
    if (rtb_Saturation1 < 0.0) {
      rtb_Saturation1 = -1.0;
    } else if (rtb_Saturation1 > 0.0) {
      rtb_Saturation1 = 1.0;
    }

    rtb_Saturation1 *= AutopilotLaws_DWork.maxH_dot;
  }

  AutopilotLaws_DWork.wasActive_g = rtb_Compare_ng;
  rtb_out_f = AutopilotLaws_P.kntoms_Gain_h * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_ja) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_ja;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_e) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_e;
  }

  rtb_out_f = (rtb_Saturation1 - AutopilotLaws_U.in.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain_e / rtb_out_f;
  if (rtb_out_f > 1.0) {
    rtb_out_f = 1.0;
  } else if (rtb_out_f < -1.0) {
    rtb_out_f = -1.0;
  }

  b_L = AutopilotLaws_P.Gain_Gain_mq * std::asin(rtb_out_f);
  R = AutopilotLaws_P.Gain1_Gain_e * AutopilotLaws_U.in.data.alpha_deg;
  AutopilotLaws_V_LSSpeedSelection(&AutopilotLaws_Y.out, &L);
  rtb_out_f = (AutopilotLaws_U.in.data.V_ias_kn - L) * AutopilotLaws_P.Gain1_Gain_o;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_i) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_i;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_c) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_c;
  }

  rtb_Sum2_o = (result_0[2] * std::sin(R) + std::cos(R) * result_0[0]) * AutopilotLaws_P.Gain_Gain_fi *
    AutopilotLaws_P.Gain_Gain_hp + rtb_out_f;
  R = AutopilotLaws_P.Gain1_Gain_mw * AutopilotLaws_U.in.data.alpha_deg;
  L = AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.data.VMAX_kn;
  rtb_out_f = L * AutopilotLaws_P.Gain1_Gain_lv;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_a) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_a;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_em) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_em;
  }

  rtb_out_f += (result_0[2] * std::sin(R) + std::cos(R) * result_0[0]) * AutopilotLaws_P.Gain_Gain_fu *
    AutopilotLaws_P.Gain_Gain_i;
  AutopilotLaws_SpeedProtectionMode1(&AutopilotLaws_Y.out, b_L, AutopilotLaws_P.VS_Gain * b_L, rtb_Sum2_o,
    AutopilotLaws_P.Gain_Gain_j * rtb_Sum2_o, rtb_out_f, AutopilotLaws_P.Gain_Gain_i2 * rtb_out_f, &Phi2,
    &rtb_Saturation1);
  R = AutopilotLaws_P.Gain1_Gain_kw * AutopilotLaws_U.in.data.alpha_deg;
  rtb_Sum_c4 = result_0[2] * std::sin(R);
  R = std::cos(R) * result_0[0];
  AutopilotLaws_Voter1(AutopilotLaws_U.in.data.VLS_kn, AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VMAX_kn,
                       &rtb_out_f);
  b_L = AutopilotLaws_U.in.data.V_ias_kn - rtb_out_f;
  if (!AutopilotLaws_DWork.eventTime_not_empty) {
    AutopilotLaws_DWork.eventTime = AutopilotLaws_U.in.time.simulation_time;
    AutopilotLaws_DWork.eventTime_not_empty = true;
  }

  rtb_Sum2_o = std::abs(b_L);
  if ((rtb_GainTheta1 != AutopilotLaws_P.CompareToConstant2_const_e) || (rtb_Sum2_o > 5.0) ||
      (AutopilotLaws_DWork.eventTime == 0.0)) {
    AutopilotLaws_DWork.eventTime = AutopilotLaws_U.in.time.simulation_time;
  }

  if (10.0 < rtb_Sum2_o) {
    rtb_Sum2_o = 10.0;
  }

  rtb_Gain_gw = (AutopilotLaws_U.in.time.simulation_time - AutopilotLaws_DWork.eventTime) - 5.0;
  if (0.0 > rtb_Gain_gw) {
    rtb_Gain_gw = 0.0;
  }

  rtb_out_f = AutopilotLaws_P.Gain1_Gain_hn * b_L;
  if (1.0 > rtb_Sum2_o) {
    rtb_Sum2_o = 1.0;
  }

  if (AutopilotLaws_P.GammaTCorrection_time < rtb_Gain_gw) {
    rtb_Gain_gw = AutopilotLaws_P.GammaTCorrection_time;
  }

  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_j4) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_j4;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_b) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_b;
  }

  rtb_Sum2_o = ((1.0 - (rtb_Sum2_o - 1.0) * 0.1111111111111111) * AutopilotLaws_P.GammaTCorrection_gain * (1.0 /
    AutopilotLaws_P.GammaTCorrection_time * rtb_Gain_gw) * b_L + (rtb_Sum_c4 + R) * AutopilotLaws_P.Gain_Gain_bi *
                AutopilotLaws_P.Gain_Gain_ei) + rtb_out_f;
  rtb_out_f = AutopilotLaws_P.kntoms_Gain_i * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_k) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_k;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_ce) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_ce;
  }

  rtb_out_f = (AutopilotLaws_P.Constant_Value_k - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_p / rtb_out_f;
  if (rtb_out_f > 1.0) {
    rtb_out_f = 1.0;
  } else if (rtb_out_f < -1.0) {
    rtb_out_f = -1.0;
  }

  rtb_Gain_gw = AutopilotLaws_P.Gain_Gain_md * std::asin(rtb_out_f);
  rtb_out_f = AutopilotLaws_P.kntoms_Gain_a * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_d) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_d;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_bt) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_bt;
  }

  rtb_out_f = (AutopilotLaws_U.in.input.H_dot_c_fpm - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_h / rtb_out_f;
  if (rtb_out_f > 1.0) {
    rtb_out_f = 1.0;
  } else if (rtb_out_f < -1.0) {
    rtb_out_f = -1.0;
  }

  b_L = AutopilotLaws_P.Gain_Gain_df * std::asin(rtb_out_f);
  AutopilotLaws_VSLimiter(AutopilotLaws_P.VS_Gain_h * b_L, AutopilotLaws_U.in.data.V_tas_kn, &rtb_Y_i);
  R = AutopilotLaws_P.Gain1_Gain_fu * AutopilotLaws_U.in.data.alpha_deg;
  rtb_Sum_c4 = result_0[2] * std::sin(R);
  R = std::cos(R) * result_0[0];
  rtb_Sum_c4 = (rtb_Sum_c4 + R) * AutopilotLaws_P.Gain_Gain_pb;
  AutopilotLaws_V_LSSpeedSelection(&AutopilotLaws_Y.out, &R);
  rtb_out_f = (AutopilotLaws_U.in.data.V_ias_kn - R) * AutopilotLaws_P.Gain1_Gain_j;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_e0) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_e0;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_mk) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_mk;
  }

  rtb_Sum2_lf = AutopilotLaws_P.Gain_Gain_o * rtb_Sum_c4 + rtb_out_f;
  R = AutopilotLaws_P.Gain1_Gain_nv * AutopilotLaws_U.in.data.alpha_deg;
  rtb_out_f = L * AutopilotLaws_P.Gain1_Gain_ji;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_jm) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_jm;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_on) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_on;
  }

  rtb_out_f += (result_0[2] * std::sin(R) + std::cos(R) * result_0[0]) * AutopilotLaws_P.Gain_Gain_e1 *
    AutopilotLaws_P.Gain_Gain_eq;
  AutopilotLaws_SpeedProtectionMode1(&AutopilotLaws_Y.out, b_L, rtb_Y_i, rtb_Sum2_lf, AutopilotLaws_P.Gain_Gain_of *
    rtb_Sum2_lf, rtb_out_f, AutopilotLaws_P.Gain_Gain_mw * rtb_out_f, &rtb_FD, &rtb_Sum_c4);
  rtb_out_f = AutopilotLaws_P.kntoms_Gain_p * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_kp) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_kp;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_lc) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_lc;
  }

  rtb_Sum2_lf = AutopilotLaws_U.in.input.FPA_c_deg - std::atan(AutopilotLaws_P.fpmtoms_Gain *
    AutopilotLaws_U.in.data.H_dot_ft_min / rtb_out_f) * AutopilotLaws_P.Gain_Gain_lt;
  AutopilotLaws_VSLimiter(AutopilotLaws_P.Gain_Gain_c3 * rtb_Sum2_lf, AutopilotLaws_U.in.data.V_tas_kn, &b_L);
  R = AutopilotLaws_P.Gain1_Gain_b2 * AutopilotLaws_U.in.data.alpha_deg;
  AutopilotLaws_V_LSSpeedSelection(&AutopilotLaws_Y.out, &rtb_Y_fm);
  rtb_out_f = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_fm) * AutopilotLaws_P.Gain1_Gain_fq;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_h) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_h;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_a) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_a;
  }

  rtb_Y_fm = (result_0[2] * std::sin(R) + std::cos(R) * result_0[0]) * AutopilotLaws_P.Gain_Gain_p2 *
    AutopilotLaws_P.Gain_Gain_n1 + rtb_out_f;
  R = AutopilotLaws_P.Gain1_Gain_ib * AutopilotLaws_U.in.data.alpha_deg;
  rtb_out_f = L * AutopilotLaws_P.Gain1_Gain_gs;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_l) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_l;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_i) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_i;
  }

  rtb_out_f += (result_0[2] * std::sin(R) + std::cos(R) * result_0[0]) * AutopilotLaws_P.Gain_Gain_he *
    AutopilotLaws_P.Gain_Gain_p4m;
  AutopilotLaws_SpeedProtectionMode1(&AutopilotLaws_Y.out, rtb_Sum2_lf, b_L, rtb_Y_fm, AutopilotLaws_P.Gain_Gain_ib *
    rtb_Y_fm, rtb_out_f, AutopilotLaws_P.Gain_Gain_e5 * rtb_out_f, &rtb_FD_m, &rtb_Y_i);
  AutopilotLaws_WashoutFilter(result_0[2], AutopilotLaws_P.WashoutFilter_C1_k, AutopilotLaws_U.in.time.dt, &L,
    &AutopilotLaws_DWork.sf_WashoutFilter_c);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_gs_error_deg, AutopilotLaws_P.LagFilter1_C1_a,
    AutopilotLaws_U.in.time.dt, &b_L, &AutopilotLaws_DWork.sf_LagFilter_h);
  rtb_Sum2_lf = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain_l * b_L;
  AutopilotLaws_LagFilter(b_L + AutopilotLaws_P.Gain3_Gain_o * ((rtb_Sum2_lf - AutopilotLaws_DWork.Delay_DSTATE_g) /
    AutopilotLaws_U.in.time.dt), AutopilotLaws_P.LagFilter_C1_n, AutopilotLaws_U.in.time.dt, &rtb_Y_fm,
    &AutopilotLaws_DWork.sf_LagFilter_d2);
  AutopilotLaws_storevalue(rtb_GainTheta1 == AutopilotLaws_P.CompareToConstant6_const,
    AutopilotLaws_Y.out.data.nav_gs_deg, &R, &AutopilotLaws_DWork.sf_storevalue_m);
  if (R > AutopilotLaws_P.Saturation_UpperSat_f) {
    R = AutopilotLaws_P.Saturation_UpperSat_f;
  } else if (R < AutopilotLaws_P.Saturation_LowerSat_om) {
    R = AutopilotLaws_P.Saturation_LowerSat_om;
  }

  rtb_out_f = AutopilotLaws_P.kntoms_Gain_if * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_go) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_go;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_cx) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_cx;
  }

  rtb_Gain_du = std::atan(AutopilotLaws_P.fpmtoms_Gain_e * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_out_f) *
    AutopilotLaws_P.Gain_Gain_nu;
  if ((AutopilotLaws_U.in.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK_const) ||
      (AutopilotLaws_U.in.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK2_const)) {
    b_L = (R - rtb_Gain_du) * AutopilotLaws_P.Gain2_Gain_j;
  } else {
    b_L = AutopilotLaws_P.Constant1_Value_e;
  }

  if ((AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.CompareToConstant_const_n) &&
      AutopilotLaws_U.in.data.nav_gs_valid) {
    rtb_out_f = (AutopilotLaws_P.Gain_Gain_h * L + rtb_Y_fm * look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_h, AutopilotLaws_P.ScheduledGain_Table_ir, 5U)) *
      AutopilotLaws_P.Gain3_Gain;
  } else {
    rtb_out_f = AutopilotLaws_P.Constant_Value_g;
  }

  AutopilotLaws_Voter1(rtb_out_f + b_L, AutopilotLaws_P.Gain1_Gain_nq * ((R + AutopilotLaws_P.Bias_Bias) - rtb_Gain_du),
                       AutopilotLaws_P.Gain_Gain_p2b * ((R + AutopilotLaws_P.Bias1_Bias) - rtb_Gain_du), &rtb_Y_fw);
  R = rtb_GainTheta - AutopilotLaws_P.Constant2_Value_f;
  rtb_Gain_du = AutopilotLaws_P.Gain4_Gain_o * R;
  rtb_Gain5 = AutopilotLaws_P.Gain5_Gain_c * AutopilotLaws_U.in.data.bz_m_s2;
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.bx_m_s2, AutopilotLaws_P.WashoutFilter_C1_m,
    AutopilotLaws_U.in.time.dt, &L, &AutopilotLaws_DWork.sf_WashoutFilter_l);
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.H_ind_ft, AutopilotLaws_P.WashoutFilter_C1_h,
    AutopilotLaws_U.in.time.dt, &R, &AutopilotLaws_DWork.sf_WashoutFilter);
  if (AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.Saturation_UpperSat_e0a) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_e0a;
  } else if (AutopilotLaws_U.in.data.H_radio_ft < AutopilotLaws_P.Saturation_LowerSat_mg) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_mg;
  } else {
    rtb_out_f = AutopilotLaws_U.in.data.H_radio_ft;
  }

  AutopilotLaws_LagFilter(rtb_out_f, AutopilotLaws_P.LagFilter_C1_h, AutopilotLaws_U.in.time.dt, &b_L,
    &AutopilotLaws_DWork.sf_LagFilter_g);
  rtb_Y_fm = (R + b_L) * AutopilotLaws_P.DiscreteDerivativeVariableTs2_Gain;
  R = (rtb_Y_fm - AutopilotLaws_DWork.Delay_DSTATE_k) / AutopilotLaws_U.in.time.dt;
  AutopilotLaws_LagFilter(AutopilotLaws_P.Gain2_Gain_c * R, AutopilotLaws_P.LagFilter3_C1, AutopilotLaws_U.in.time.dt,
    &b_L, &AutopilotLaws_DWork.sf_LagFilter_el);
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.H_dot_ft_min, AutopilotLaws_P.WashoutFilter1_C1,
    AutopilotLaws_U.in.time.dt, &R, &AutopilotLaws_DWork.sf_WashoutFilter_h);
  R += b_L;
  rtb_Compare_ng = (rtb_GainTheta1 == AutopilotLaws_P.CompareToConstant7_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty) {
    AutopilotLaws_DWork.wasActive = rtb_Compare_ng;
    AutopilotLaws_DWork.wasActive_not_empty = true;
  }

  if ((!AutopilotLaws_DWork.wasActive) && rtb_Compare_ng) {
    rtb_out_f = std::abs(R) / 60.0;
    AutopilotLaws_DWork.Tau = AutopilotLaws_U.in.data.H_radio_ft / (rtb_out_f - 1.6666666666666667);
    AutopilotLaws_DWork.H_bias = AutopilotLaws_DWork.Tau * rtb_out_f - AutopilotLaws_U.in.data.H_radio_ft;
  }

  if (rtb_Compare_ng) {
    b_L = -1.0 / AutopilotLaws_DWork.Tau * (AutopilotLaws_U.in.data.H_radio_ft + AutopilotLaws_DWork.H_bias) * 60.0;
  } else {
    b_L = R;
  }

  AutopilotLaws_DWork.wasActive = rtb_Compare_ng;
  rtb_out_f = AutopilotLaws_P.kntoms_Gain_av * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_m) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_m;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_d1) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_d1;
  }

  rtb_out_f = (b_L - R) * AutopilotLaws_P.ftmintoms_Gain_i / rtb_out_f;
  if (rtb_out_f > 1.0) {
    rtb_out_f = 1.0;
  } else if (rtb_out_f < -1.0) {
    rtb_out_f = -1.0;
  }

  rtb_Gain_bh = AutopilotLaws_P.Gain_Gain_fz * std::asin(rtb_out_f);
  rtb_Sum_j = AutopilotLaws_P.Constant1_Value_d - rtb_GainTheta;
  R = AutopilotLaws_P.Gain1_Gain_fy * AutopilotLaws_U.in.data.alpha_deg;
  rtb_out_f = (AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.input.V_c_kn) * AutopilotLaws_P.Gain1_Gain_fr;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_e3) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_e3;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_py) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_py;
  }

  rtb_Sum2_f = (result_0[2] * std::sin(R) + std::cos(R) * result_0[0]) * AutopilotLaws_P.Gain_Gain_nub *
    AutopilotLaws_P.Gain_Gain_ao + rtb_out_f;
  rtb_out_f = AutopilotLaws_P.kntoms_Gain_f * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_out_f > AutopilotLaws_P.Saturation_UpperSat_b) {
    rtb_out_f = AutopilotLaws_P.Saturation_UpperSat_b;
  } else if (rtb_out_f < AutopilotLaws_P.Saturation_LowerSat_ow) {
    rtb_out_f = AutopilotLaws_P.Saturation_LowerSat_ow;
  }

  rtb_out_f = (AutopilotLaws_P.Constant_Value_i - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_j / rtb_out_f;
  if (rtb_out_f > 1.0) {
    rtb_out_f = 1.0;
  } else if (rtb_out_f < -1.0) {
    rtb_out_f = -1.0;
  }

  rtb_out_f = AutopilotLaws_P.Gain_Gain_bd * std::asin(rtb_out_f);
  AutopilotLaws_Voter1(rtb_Sum_j, rtb_Sum2_f, rtb_out_f, &R);
  switch (static_cast<int32_T>(rtb_GainTheta1)) {
   case 0:
    R = AutopilotLaws_P.Constant_Value_dh;
    break;

   case 1:
    R = a;
    break;

   case 2:
    R = Phi2;
    break;

   case 3:
    if (rtb_Saturation > AutopilotLaws_P.Switch_Threshold) {
      if (rtb_Sum2_o > rtb_Gain_gw) {
        R = rtb_Sum2_o;
      } else {
        R = rtb_Gain_gw;
      }
    } else if (rtb_Sum2_o < rtb_Gain_gw) {
      R = rtb_Sum2_o;
    } else {
      R = rtb_Gain_gw;
    }
    break;

   case 4:
    R = rtb_FD;
    break;

   case 5:
    R = rtb_FD_m;
    break;

   case 6:
    R = AutopilotLaws_P.Gain1_Gain_h * rtb_Y_fw;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch1_Threshold) {
      R = AutopilotLaws_P.Gain2_Gain_h * rtb_Gain_du;
    } else {
      R = (AutopilotLaws_P.Gain1_Gain_i * L + rtb_Gain5) + rtb_Gain_bh;
    }
    break;
  }

  if (R > AutopilotLaws_P.Constant1_Value_i) {
    R = AutopilotLaws_P.Constant1_Value_i;
  } else {
    Phi2 = AutopilotLaws_P.Gain1_Gain_nu * AutopilotLaws_P.Constant1_Value_i;
    if (R < Phi2) {
      R = Phi2;
    }
  }

  R -= b_R;
  AutopilotLaws_DWork.icLoad_f = ((AutopilotLaws_Y.out.output.ap_on == 0.0) || AutopilotLaws_DWork.icLoad_f);
  if (AutopilotLaws_DWork.icLoad_f) {
    AutopilotLaws_DWork.Delay_DSTATE_h2 = rtb_GainTheta;
  }

  AutopilotLaws_Voter1(rtb_Sum_j, AutopilotLaws_P.Gain_Gain_b2 * rtb_Sum2_f, AutopilotLaws_P.VS_Gain_c * rtb_out_f, &b_L);
  switch (static_cast<int32_T>(rtb_GainTheta1)) {
   case 0:
    b_L = AutopilotLaws_P.Constant_Value_dh;
    break;

   case 1:
    b_L = AutopilotLaws_P.VS_Gain_n * a;
    break;

   case 2:
    b_L = rtb_Saturation1;
    break;

   case 3:
    if (rtb_Saturation > AutopilotLaws_P.Switch_Threshold_n) {
      rtb_out_f = AutopilotLaws_P.Gain_Gain_kg * rtb_Sum2_o;
      b_L = AutopilotLaws_P.VS_Gain_j * rtb_Gain_gw;
      if (rtb_out_f > b_L) {
        b_L = rtb_out_f;
      }
    } else {
      rtb_out_f = AutopilotLaws_P.Gain_Gain_kg * rtb_Sum2_o;
      b_L = AutopilotLaws_P.VS_Gain_j * rtb_Gain_gw;
      if (rtb_out_f < b_L) {
        b_L = rtb_out_f;
      }
    }
    break;

   case 4:
    b_L = rtb_Sum_c4;
    break;

   case 5:
    b_L = rtb_Y_i;
    break;

   case 6:
    b_L = rtb_Y_fw;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch_Threshold_c) {
      b_L = rtb_Gain_du;
    } else {
      b_L = (AutopilotLaws_P.Gain3_Gain_l * L + rtb_Gain5) + AutopilotLaws_P.VS_Gain_e * rtb_Gain_bh;
    }
    break;
  }

  b_L += rtb_GainTheta;
  if (b_L > AutopilotLaws_P.Constant1_Value_i) {
    b_L = AutopilotLaws_P.Constant1_Value_i;
  } else {
    rtb_GainTheta1 = AutopilotLaws_P.Gain1_Gain_m * AutopilotLaws_P.Constant1_Value_i;
    if (b_L < rtb_GainTheta1) {
      b_L = rtb_GainTheta1;
    }
  }

  rtb_out_f = b_L - AutopilotLaws_DWork.Delay_DSTATE_h2;
  b_L = AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (rtb_out_f < b_L) {
    b_L = rtb_out_f;
  }

  rtb_Y_i = AutopilotLaws_P.Gain1_Gain_i0 * AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (b_L > rtb_Y_i) {
    rtb_Y_i = b_L;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h2 += rtb_Y_i;
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h2, AutopilotLaws_P.LagFilter_C1_i,
    AutopilotLaws_U.in.time.dt, &rtb_Y_i, &AutopilotLaws_DWork.sf_LagFilter_n);
  AutopilotLaws_RateLimiter(AutopilotLaws_Y.out.output.ap_on, AutopilotLaws_P.RateLimiterVariableTs_up_i,
    AutopilotLaws_P.RateLimiterVariableTs_lo_o, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_p, &b_L, &AutopilotLaws_DWork.sf_RateLimiter_g);
  if (b_L > AutopilotLaws_P.Saturation_UpperSat_ju) {
    b_L = AutopilotLaws_P.Saturation_UpperSat_ju;
  } else if (b_L < AutopilotLaws_P.Saturation_LowerSat_n) {
    b_L = AutopilotLaws_P.Saturation_LowerSat_n;
  }

  AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = R;
  AutopilotLaws_Y.out.output.autopilot.Theta_c_deg = (AutopilotLaws_P.Constant_Value_f - b_L) * rtb_GainTheta + rtb_Y_i *
    b_L;
  for (rtb_on_ground = 0; rtb_on_ground < 99; rtb_on_ground++) {
    AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground + 1];
    AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground + 1];
  }

  AutopilotLaws_DWork.Delay_DSTATE_l[99] = rtb_valid;
  AutopilotLaws_DWork.Delay_DSTATE_h5[99] = rtb_valid_o;
  AutopilotLaws_DWork.Delay_DSTATE_i = rtb_dme;
  AutopilotLaws_DWork.icLoad = false;
  AutopilotLaws_DWork.Delay_DSTATE_g = rtb_Sum2_lf;
  AutopilotLaws_DWork.Delay_DSTATE_k = rtb_Y_fm;
  AutopilotLaws_DWork.icLoad_f = false;
}

void AutopilotLawsModelClass::initialize()
{
  {
    real_T rtb_out_a;
    int32_T i;
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[i] = AutopilotLaws_P.Delay_InitialCondition;
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }

    AutopilotLaws_DWork.Delay_DSTATE_i = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition;
    AutopilotLaws_DWork.icLoad = true;
    AutopilotLaws_DWork.Delay_DSTATE_g = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition_h;
    AutopilotLaws_DWork.Delay_DSTATE_k = AutopilotLaws_P.DiscreteDerivativeVariableTs2_InitialCondition;
    AutopilotLaws_DWork.icLoad_f = true;
    AutopilotLaws_Chart_p_Init(&rtb_out_a);
    AutopilotLaws_Chart_p_Init(&rtb_out_a);
    AutopilotLaws_Chart_Init(&rtb_out_a);
    AutopilotLaws_Chart_Init(&rtb_out_a);
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
