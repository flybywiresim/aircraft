#include "AutopilotLaws.h"
#include "AutopilotLaws_private.h"
#include "look1_binlxpw.h"
#include "rt_modd.h"

const uint8_T AutopilotLaws_IN_any = 1U;
const uint8_T AutopilotLaws_IN_left = 2U;
const uint8_T AutopilotLaws_IN_right = 3U;
const uint8_T AutopilotLaws_IN_any_h = 1U;
const uint8_T AutopilotLaws_IN_left_f = 2U;
const uint8_T AutopilotLaws_IN_right_g = 3U;
const uint8_T AutopilotLaws_IN_InAir = 1U;
const uint8_T AutopilotLaws_IN_OnGround = 2U;
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
  if (localDW->is_active_c8_srSgcGQg2zvTgc1tMselx4F_ap_library == 0U) {
    localDW->is_active_c8_srSgcGQg2zvTgc1tMselx4F_ap_library = 1U;
    localDW->is_c8_srSgcGQg2zvTgc1tMselx4F_ap_library = AutopilotLaws_IN_any;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c8_srSgcGQg2zvTgc1tMselx4F_ap_library) {
     case AutopilotLaws_IN_any:
      tmp = std::abs(rtu_right);
      tmp_0 = std::abs(rtu_left);
      tmp_1 = !rtu_use_short_path;
      if (tmp_1 && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
        localDW->is_c8_srSgcGQg2zvTgc1tMselx4F_ap_library = AutopilotLaws_IN_right;
        *rty_out = rtu_right;
      } else if (tmp_1 && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
        localDW->is_c8_srSgcGQg2zvTgc1tMselx4F_ap_library = AutopilotLaws_IN_left;
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
        localDW->is_c8_srSgcGQg2zvTgc1tMselx4F_ap_library = AutopilotLaws_IN_any;
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
        localDW->is_c8_srSgcGQg2zvTgc1tMselx4F_ap_library = AutopilotLaws_IN_any;
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
  if (localDW->is_active_c8_s7y0WEx1xKopCu1ds66dilB_ap_library == 0U) {
    localDW->is_active_c8_s7y0WEx1xKopCu1ds66dilB_ap_library = 1U;
    localDW->is_c8_s7y0WEx1xKopCu1ds66dilB_ap_library = AutopilotLaws_IN_any_h;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c8_s7y0WEx1xKopCu1ds66dilB_ap_library) {
     case AutopilotLaws_IN_any_h:
      tmp = std::abs(rtu_right);
      tmp_0 = std::abs(rtu_left);
      if ((rtu_use_short_path == 0.0) && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
        localDW->is_c8_s7y0WEx1xKopCu1ds66dilB_ap_library = AutopilotLaws_IN_right_g;
        *rty_out = rtu_right;
      } else if ((rtu_use_short_path == 0.0) && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
        localDW->is_c8_s7y0WEx1xKopCu1ds66dilB_ap_library = AutopilotLaws_IN_left_f;
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
        localDW->is_c8_s7y0WEx1xKopCu1ds66dilB_ap_library = AutopilotLaws_IN_any_h;
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
        localDW->is_c8_s7y0WEx1xKopCu1ds66dilB_ap_library = AutopilotLaws_IN_any_h;
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
  u1 = rtu_up * rtu_Ts;
  if (u0 < u1) {
    u1 = u0;
  }

  u0 = rtu_lo * rtu_Ts;
  if (u1 > u0) {
    u0 = u1;
  }

  localDW->pY += u0;
  *rty_Y = localDW->pY;
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

void AutopilotLawsModelClass::AutopilotLaws_SpeedProtectionMode(const ap_laws_output *rtu_in, real_T rtu_VS_FD, real_T
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

void AutopilotLawsModelClass::AutopilotLaws_V_LSSpeedSelection(const ap_laws_output *rtu_in, real_T *rty_y)
{
  if (rtu_in->input.V_c_kn <= rtu_in->data.VLS_kn) {
    *rty_y = rtu_in->data.VLS_kn - 5.0;
  } else {
    *rty_y = rtu_in->data.VLS_kn;
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
  real_T rtb_Divide_h;
  real_T rtb_Gain4;
  real_T rtb_Gain5;
  real_T rtb_GainTheta;
  real_T rtb_GainTheta1;
  real_T rtb_Gain_bh;
  real_T rtb_Gain_lvv;
  real_T rtb_Gain_ny;
  real_T rtb_Gain_pm;
  real_T rtb_ManualSwitch;
  real_T rtb_Mod2_f;
  real_T rtb_Mod2_k;
  real_T rtb_Saturation;
  real_T rtb_Saturation1;
  real_T rtb_Sum2_nr;
  real_T rtb_Sum_gh;
  real_T rtb_Sum_j;
  real_T rtb_Switch2;
  real_T rtb_Vz;
  real_T rtb_Y_c;
  real_T rtb_Y_dj;
  real_T rtb_Y_l;
  real_T rtb_Y_ng;
  real_T rtb_out_k;
  real_T t;
  int32_T i;
  int32_T rtb_on_ground;
  boolean_T rtb_Compare;
  boolean_T rtb_Delay_hu;
  boolean_T rtb_Delay_n;
  boolean_T rtb_OR;
  rtb_OR = ((AutopilotLaws_U.in.input.enabled_AP1 != 0.0) || (AutopilotLaws_U.in.input.enabled_AP2 != 0.0));
  rtb_GainTheta = AutopilotLaws_P.GainTheta_Gain * AutopilotLaws_U.in.data.Theta_deg;
  rtb_GainTheta1 = AutopilotLaws_P.GainTheta1_Gain * AutopilotLaws_U.in.data.Phi_deg;
  rtb_Saturation = 0.017453292519943295 * rtb_GainTheta;
  rtb_Saturation1 = 0.017453292519943295 * rtb_GainTheta1;
  rtb_out_k = std::tan(rtb_Saturation);
  rtb_Y_ng = std::sin(rtb_Saturation1);
  rtb_Saturation1 = std::cos(rtb_Saturation1);
  result_tmp[0] = 1.0;
  result_tmp[3] = rtb_Y_ng * rtb_out_k;
  result_tmp[6] = rtb_Saturation1 * rtb_out_k;
  result_tmp[1] = 0.0;
  result_tmp[4] = rtb_Saturation1;
  result_tmp[7] = -rtb_Y_ng;
  result_tmp[2] = 0.0;
  rtb_Mod2_f = std::cos(rtb_Saturation);
  rtb_Y_l = 1.0 / rtb_Mod2_f;
  result_tmp[5] = rtb_Y_l * rtb_Y_ng;
  result_tmp[8] = rtb_Y_l * rtb_Saturation1;
  rtb_ManualSwitch = AutopilotLaws_P.Gain_Gain_de * AutopilotLaws_U.in.data.p_rad_s * AutopilotLaws_P.Gainpk_Gain;
  rtb_Mod2_k = AutopilotLaws_P.Gain_Gain_d * AutopilotLaws_U.in.data.q_rad_s * AutopilotLaws_P.Gainqk_Gain;
  rtb_out_k = AutopilotLaws_P.Gain_Gain_m * AutopilotLaws_U.in.data.r_rad_s;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result[rtb_on_ground] = result_tmp[rtb_on_ground + 6] * rtb_out_k + (result_tmp[rtb_on_ground + 3] * rtb_Mod2_k +
      result_tmp[rtb_on_ground] * rtb_ManualSwitch);
  }

  rtb_out_k = rtb_Mod2_f;
  rtb_ManualSwitch = std::sin(rtb_Saturation);
  result_tmp[0] = rtb_Mod2_f;
  result_tmp[3] = 0.0;
  result_tmp[6] = -rtb_ManualSwitch;
  result_tmp[1] = rtb_Y_ng * rtb_ManualSwitch;
  result_tmp[4] = rtb_Saturation1;
  result_tmp[7] = rtb_Mod2_f * rtb_Y_ng;
  result_tmp[2] = rtb_Saturation1 * rtb_ManualSwitch;
  result_tmp[5] = 0.0 - rtb_Y_ng;
  result_tmp[8] = rtb_Saturation1 * rtb_Mod2_f;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result_0[rtb_on_ground] = result_tmp[rtb_on_ground + 6] * AutopilotLaws_U.in.data.bz_m_s2 +
      (result_tmp[rtb_on_ground + 3] * AutopilotLaws_U.in.data.by_m_s2 + result_tmp[rtb_on_ground] *
       AutopilotLaws_U.in.data.bx_m_s2);
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
  AutopilotLaws_Y.out.data.nav_dme_nmi = AutopilotLaws_U.in.data.nav_dme_nmi;
  AutopilotLaws_Y.out.data.nav_loc_valid = AutopilotLaws_U.in.data.nav_loc_valid;
  AutopilotLaws_Y.out.data.nav_loc_error_deg = AutopilotLaws_U.in.data.nav_loc_error_deg;
  AutopilotLaws_Y.out.data.nav_gs_valid = AutopilotLaws_U.in.data.nav_gs_valid;
  AutopilotLaws_Y.out.data.nav_gs_error_deg = AutopilotLaws_U.in.data.nav_gs_error_deg;
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
  rtb_Saturation = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_deg - (AutopilotLaws_U.in.data.nav_loc_deg +
    AutopilotLaws_P.Constant3_Value_e)) + AutopilotLaws_P.Constant3_Value_e, AutopilotLaws_P.Constant3_Value_e);
  rtb_Saturation1 = rt_modd(AutopilotLaws_P.Constant3_Value_e - rtb_Saturation, AutopilotLaws_P.Constant3_Value_e);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = AutopilotLaws_P.Constant_Value;
  } else {
    rtb_ManualSwitch = AutopilotLaws_U.in.input.lateral_law;
  }

  rtb_Compare = (rtb_ManualSwitch == AutopilotLaws_P.CompareToConstant2_const);
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

  if (!rtb_Compare) {
    if (rtb_Saturation > 15.0) {
      AutopilotLaws_DWork.limit = rtb_Saturation;
    } else {
      AutopilotLaws_DWork.limit = 15.0;
    }

    if (AutopilotLaws_DWork.limit >= 115.0) {
      AutopilotLaws_DWork.limit = 115.0;
    }
  }

  if (rtb_Compare && (rtb_Saturation < 15.0)) {
    AutopilotLaws_DWork.limit = 15.0;
  }

  if (AutopilotLaws_U.in.data.nav_dme_nmi > AutopilotLaws_P.Saturation_UpperSat_c) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_c;
  } else if (AutopilotLaws_U.in.data.nav_dme_nmi < AutopilotLaws_P.Saturation_LowerSat_d) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_d;
  } else {
    rtb_Y_l = AutopilotLaws_U.in.data.nav_dme_nmi;
  }

  rtb_Saturation1 = std::sin(AutopilotLaws_P.Gain1_Gain_g * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_Y_l;
  rtb_Saturation = rtb_Saturation1 * look1_binlxpw(AutopilotLaws_U.in.data.nav_dme_nmi,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain_Table, 4U) * look1_binlxpw
    (rtb_Saturation1, AutopilotLaws_P.ScheduledGain3_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain3_Table, 3U);
  rtb_Saturation1 = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_track_deg - (rt_modd(rt_modd
    (AutopilotLaws_U.in.data.nav_loc_error_deg + AutopilotLaws_U.in.data.nav_loc_deg, AutopilotLaws_P.Constant3_Value_m)
    + AutopilotLaws_P.Constant3_Value_m, AutopilotLaws_P.Constant3_Value_m) + AutopilotLaws_P.Constant3_Value_a)) +
    AutopilotLaws_P.Constant3_Value_a, AutopilotLaws_P.Constant3_Value_a);
  rtb_Mod2_k = rt_modd(AutopilotLaws_P.Constant3_Value_a - rtb_Saturation1, AutopilotLaws_P.Constant3_Value_a);
  if (rtb_Saturation > AutopilotLaws_DWork.limit) {
    rtb_Saturation = AutopilotLaws_DWork.limit;
  } else if (rtb_Saturation < -AutopilotLaws_DWork.limit) {
    rtb_Saturation = -AutopilotLaws_DWork.limit;
  }

  if (rtb_Saturation1 < rtb_Mod2_k) {
    rtb_Saturation1 *= AutopilotLaws_P.Gain1_Gain_p;
  } else {
    rtb_Saturation1 = AutopilotLaws_P.Gain_Gain_p * rtb_Mod2_k;
  }

  rtb_Mod2_k = (rtb_Saturation + rtb_Saturation1) * look1_binlxpw(AutopilotLaws_U.in.data.V_gnd_kn,
    AutopilotLaws_P.ScheduledGain1_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain1_Table, 3U) * look1_binlxpw
    (AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1,
     AutopilotLaws_P.ScheduledGain2_Table, 6U);
  rtb_Saturation = rt_modd((AutopilotLaws_U.in.data.nav_loc_deg - (AutopilotLaws_U.in.data.Psi_magnetic_deg +
    AutopilotLaws_P.Constant3_Value_j)) + AutopilotLaws_P.Constant3_Value_j, AutopilotLaws_P.Constant3_Value_j);
  AutopilotLaws_Chart_j(rtb_Saturation, AutopilotLaws_P.Gain_Gain_nj * rt_modd(AutopilotLaws_P.Constant3_Value_j -
    rtb_Saturation, AutopilotLaws_P.Constant3_Value_j), AutopilotLaws_P.Constant2_Value, &rtb_out_k,
                        &AutopilotLaws_DWork.sf_Chart_j);
  if (AutopilotLaws_U.in.data.nav_dme_nmi > AutopilotLaws_P.Saturation_UpperSat_o) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_o;
  } else if (AutopilotLaws_U.in.data.nav_dme_nmi < AutopilotLaws_P.Saturation_LowerSat_o) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_o;
  } else {
    rtb_Y_l = AutopilotLaws_U.in.data.nav_dme_nmi;
  }

  rtb_Saturation1 = std::sin(AutopilotLaws_P.Gain1_Gain_h5 * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_Y_l *
    AutopilotLaws_P.Gain2_Gain_g;
  if (rtb_Saturation1 > AutopilotLaws_P.Saturation1_UpperSat_g) {
    rtb_Saturation1 = AutopilotLaws_P.Saturation1_UpperSat_g;
  } else if (rtb_Saturation1 < AutopilotLaws_P.Saturation1_LowerSat_k) {
    rtb_Saturation1 = AutopilotLaws_P.Saturation1_LowerSat_k;
  }

  rtb_Compare = (rtb_ManualSwitch == AutopilotLaws_P.CompareToConstant_const);
  if (!rtb_Compare) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  AutopilotLaws_DWork.Delay_DSTATE += AutopilotLaws_P.Gain6_Gain * rtb_Saturation1 *
    AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_Gain * AutopilotLaws_U.in.time.dt;
  if (AutopilotLaws_DWork.Delay_DSTATE > AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (AutopilotLaws_DWork.Delay_DSTATE < AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  AutopilotLaws_storevalue(rtb_Compare, AutopilotLaws_U.in.data.nav_loc_deg, &rtb_Y_ng,
    &AutopilotLaws_DWork.sf_storevalue);
  rtb_Saturation = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_deg - (rt_modd(rt_modd
    (AutopilotLaws_U.in.data.nav_loc_error_deg + rtb_Y_ng, AutopilotLaws_P.Constant3_Value_m0) +
    AutopilotLaws_P.Constant3_Value_m0, AutopilotLaws_P.Constant3_Value_m0) + AutopilotLaws_P.Constant3_Value_eg)) +
    AutopilotLaws_P.Constant3_Value_eg, AutopilotLaws_P.Constant3_Value_eg);
  rtb_Mod2_f = rt_modd(AutopilotLaws_P.Constant3_Value_eg - rtb_Saturation, AutopilotLaws_P.Constant3_Value_eg);
  if (rtb_Saturation < rtb_Mod2_f) {
    rtb_Saturation *= AutopilotLaws_P.Gain1_Gain_n;
  } else {
    rtb_Saturation = AutopilotLaws_P.Gain_Gain_k * rtb_Mod2_f;
  }

  rtb_Saturation = rt_modd((rt_modd(rt_modd(((rtb_Saturation1 * look1_binlxpw(AutopilotLaws_U.in.data.V_gnd_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_j, AutopilotLaws_P.ScheduledGain_Table_p, 2U) +
    AutopilotLaws_DWork.Delay_DSTATE) + AutopilotLaws_P.Gain1_Gain_f * rtb_Saturation) +
    AutopilotLaws_U.in.data.Psi_magnetic_deg, AutopilotLaws_P.Constant3_Value_c) + AutopilotLaws_P.Constant3_Value_c,
    AutopilotLaws_P.Constant3_Value_c) - (AutopilotLaws_U.in.data.Psi_magnetic_deg + AutopilotLaws_P.Constant3_Value_h))
    + AutopilotLaws_P.Constant3_Value_h, AutopilotLaws_P.Constant3_Value_h);
  AutopilotLaws_Chart_j(rtb_Saturation, AutopilotLaws_P.Gain_Gain_py * rt_modd(AutopilotLaws_P.Constant3_Value_h -
    rtb_Saturation, AutopilotLaws_P.Constant3_Value_h), AutopilotLaws_P.Constant1_Value_e, &rtb_Mod2_f,
                        &AutopilotLaws_DWork.sf_Chart_o);
  rtb_Saturation = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_deg +
    AutopilotLaws_P.Constant3_Value_d)) + AutopilotLaws_P.Constant3_Value_d, AutopilotLaws_P.Constant3_Value_d);
  rtb_Compare = ((rtb_ManualSwitch == AutopilotLaws_P.CompareToConstant5_const) ==
                 AutopilotLaws_P.CompareToConstant_const_h);
  rtb_Saturation1 = AutopilotLaws_P.Subsystem_Value / AutopilotLaws_U.in.time.dt;
  if (!rtb_Compare) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[i] = AutopilotLaws_P.Delay_InitialCondition;
    }
  }

  if (rtb_Saturation1 < 1.0) {
    rtb_Delay_hu = rtb_Compare;
  } else {
    if (rtb_Saturation1 > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::floor(rtb_Saturation1), 4.294967296E+9)));
    }

    rtb_Delay_hu = AutopilotLaws_DWork.Delay_DSTATE_l[100U - i];
  }

  AutopilotLaws_Chart(rtb_Saturation, AutopilotLaws_P.Gain_Gain_ac * rt_modd(AutopilotLaws_P.Constant3_Value_d -
    rtb_Saturation, AutopilotLaws_P.Constant3_Value_d), rtb_Compare != rtb_Delay_hu, &rtb_Saturation1,
                      &AutopilotLaws_DWork.sf_Chart);
  rtb_Saturation = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_track_deg +
    AutopilotLaws_P.Constant3_Value_n)) + AutopilotLaws_P.Constant3_Value_n, AutopilotLaws_P.Constant3_Value_n);
  rtb_Delay_hu = ((rtb_ManualSwitch == AutopilotLaws_P.CompareToConstant4_const) ==
                  AutopilotLaws_P.CompareToConstant_const_e);
  rtb_Divide_h = AutopilotLaws_P.Subsystem_Value_n / AutopilotLaws_U.in.time.dt;
  if (!rtb_Delay_hu) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }
  }

  if (rtb_Divide_h < 1.0) {
    rtb_Delay_n = rtb_Delay_hu;
  } else {
    if (rtb_Divide_h > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::floor(rtb_Divide_h), 4.294967296E+9)));
    }

    rtb_Delay_n = AutopilotLaws_DWork.Delay_DSTATE_h5[100U - i];
  }

  AutopilotLaws_Chart(rtb_Saturation, AutopilotLaws_P.Gain_Gain_e * rt_modd(AutopilotLaws_P.Constant3_Value_n -
    rtb_Saturation, AutopilotLaws_P.Constant3_Value_n), rtb_Delay_hu != rtb_Delay_n, &rtb_Divide_h,
                      &AutopilotLaws_DWork.sf_Chart_b);
  t = AutopilotLaws_P.tau_Value / 3600.0;
  rtb_Saturation = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain * AutopilotLaws_U.in.data.nav_loc_error_deg;
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_loc_error_deg + AutopilotLaws_P.Gain3_Gain_i * ((rtb_Saturation -
    AutopilotLaws_DWork.Delay_DSTATE_i) / AutopilotLaws_U.in.time.dt), AutopilotLaws_P.LagFilter_C1,
    AutopilotLaws_U.in.time.dt, &rtb_Y_l, &AutopilotLaws_DWork.sf_LagFilter);
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_Saturation1 = rtb_GainTheta1;
    break;

   case 1:
    rtb_Saturation1 *= look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_a, AutopilotLaws_P.ScheduledGain_Table_i, 6U);
    break;

   case 2:
    rtb_Saturation1 = rtb_Divide_h * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_d, AutopilotLaws_P.ScheduledGain_Table_h, 6U);
    break;

   case 3:
    rtb_Y_l = 180.0 / (39.478417604357432 * AutopilotLaws_P.zeta_Value * t) * (AutopilotLaws_P.Gain_Gain_c *
      AutopilotLaws_U.in.data.flight_guidance_xtk_nmi) / AutopilotLaws_U.in.data.V_gnd_kn;
    if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat) {
      rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat;
    } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat) {
      rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat;
    }

    rtb_Saturation1 = AutopilotLaws_U.in.data.flight_guidance_phi_deg - AutopilotLaws_P.zeta_Value / (215666.565757755 *
      t) * (AutopilotLaws_P.Gain2_Gain * AutopilotLaws_U.in.data.flight_guidance_tae_deg + rtb_Y_l) *
      AutopilotLaws_U.in.data.V_gnd_kn;
    break;

   case 4:
    rtb_Saturation1 = rtb_Mod2_k;
    break;

   case 5:
    rtb_Saturation1 = rtb_Y_l * look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_e, AutopilotLaws_P.ScheduledGain_Table_pf, 4U) *
      look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1_j,
                    AutopilotLaws_P.ScheduledGain2_Table_h, 6U);
    break;

   default:
    rtb_Saturation1 = AutopilotLaws_P.Constant3_Value;
    break;
  }

  rtb_Divide_h = look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ROLLLIM1_bp01Data,
    AutopilotLaws_P.ROLLLIM1_tableData, 4U);
  if (rtb_Saturation1 > rtb_Divide_h) {
    rtb_Saturation1 = rtb_Divide_h;
  } else {
    rtb_Divide_h *= AutopilotLaws_P.Gain1_Gain_l;
    if (rtb_Saturation1 < rtb_Divide_h) {
      rtb_Saturation1 = rtb_Divide_h;
    }
  }

  AutopilotLaws_DWork.icLoad = ((!rtb_OR) || AutopilotLaws_DWork.icLoad);
  if (AutopilotLaws_DWork.icLoad) {
    AutopilotLaws_DWork.Delay_DSTATE_h = rtb_GainTheta1;
  }

  rtb_Y_l = rtb_Saturation1 - AutopilotLaws_DWork.Delay_DSTATE_h;
  rtb_Vz = AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (rtb_Y_l < rtb_Vz) {
    rtb_Vz = rtb_Y_l;
  }

  rtb_Y_ng = AutopilotLaws_P.Gain1_Gain_k * AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (rtb_Vz > rtb_Y_ng) {
    rtb_Y_ng = rtb_Vz;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h += rtb_Y_ng;
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h, AutopilotLaws_P.LagFilter_C1_l, AutopilotLaws_U.in.time.dt,
    &rtb_Divide_h, &AutopilotLaws_DWork.sf_LagFilter_d);
  AutopilotLaws_RateLimiter(static_cast<real_T>(rtb_OR), AutopilotLaws_P.RateLimiterVariableTs_up,
    AutopilotLaws_P.RateLimiterVariableTs_lo, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition, &rtb_Y_ng, &AutopilotLaws_DWork.sf_RateLimiter);
  if (rtb_Y_ng > AutopilotLaws_P.Saturation_UpperSat_j) {
    rtb_Y_ng = AutopilotLaws_P.Saturation_UpperSat_j;
  } else if (rtb_Y_ng < AutopilotLaws_P.Saturation_LowerSat_p) {
    rtb_Y_ng = AutopilotLaws_P.Saturation_LowerSat_p;
  }

  if (AutopilotLaws_U.in.data.H_radio_ft <= AutopilotLaws_P.CompareToConstant_const_d) {
    rtb_Y_l = AutopilotLaws_P.Gain_Gain_a * rtb_out_k;
  } else {
    rtb_Y_l = AutopilotLaws_P.Constant1_Value;
  }

  AutopilotLaws_LagFilter(rtb_Y_l, AutopilotLaws_P.LagFilter1_C1, AutopilotLaws_U.in.time.dt, &rtb_Y_c,
    &AutopilotLaws_DWork.sf_LagFilter_j);
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_Y_c = AutopilotLaws_P.beta_Value;
    break;

   case 1:
    rtb_Y_c = AutopilotLaws_P.beta_Value_e;
    break;

   case 2:
    rtb_Y_c = AutopilotLaws_P.beta_Value_b;
    break;

   case 3:
    rtb_Y_c = AutopilotLaws_P.beta_Value_i;
    break;

   case 4:
    rtb_Y_c = AutopilotLaws_P.beta_Value_d;
    break;

   case 5:
    break;

   default:
    rtb_Y_c = AutopilotLaws_P.Gain5_Gain * rtb_Mod2_f + AutopilotLaws_P.Gain_Gain_b * result[2];
    break;
  }

  AutopilotLaws_Y.out.output.Phi_loc_c = rtb_Mod2_k;
  AutopilotLaws_Y.out.output.flight_director.Beta_c_deg = rtb_Y_c;
  AutopilotLaws_Y.out.output.autopilot.Beta_c_deg = rtb_Y_c;
  AutopilotLaws_Y.out.output.flight_director.Phi_c_deg = rtb_Saturation1;
  AutopilotLaws_Y.out.output.autopilot.Phi_c_deg = (AutopilotLaws_P.Constant_Value_n - rtb_Y_ng) * rtb_GainTheta1 +
    rtb_Divide_h * rtb_Y_ng;
  if (AutopilotLaws_U.in.input.ALT_soft_mode_active) {
    rtb_Saturation1 = (AutopilotLaws_U.in.input.V_c_kn - AutopilotLaws_U.in.data.V_ias_kn) *
      AutopilotLaws_P.Gain1_Gain_b;
    if (rtb_Saturation1 > AutopilotLaws_P.Saturation1_UpperSat) {
      rtb_Saturation1 = AutopilotLaws_P.Saturation1_UpperSat;
    } else if (rtb_Saturation1 < AutopilotLaws_P.Saturation1_LowerSat) {
      rtb_Saturation1 = AutopilotLaws_P.Saturation1_LowerSat;
    }
  } else {
    rtb_Saturation1 = AutopilotLaws_P.Constant1_Value_h;
  }

  if (AutopilotLaws_P.ManualSwitch_CurrentSetting_b == 1) {
    rtb_GainTheta1 = AutopilotLaws_P.Constant_Value_m;
  } else {
    rtb_GainTheta1 = AutopilotLaws_U.in.input.vertical_law;
  }

  if (rtb_GainTheta1 != AutopilotLaws_P.CompareToConstant5_const_e) {
    AutopilotLaws_B.u = (AutopilotLaws_U.in.input.H_c_ft + AutopilotLaws_U.in.data.H_ft) -
      AutopilotLaws_U.in.data.H_ind_ft;
  }

  AutopilotLaws_LagFilter(AutopilotLaws_B.u - AutopilotLaws_U.in.data.H_ft, AutopilotLaws_P.LagFilter_C1_a,
    AutopilotLaws_U.in.time.dt, &rtb_ManualSwitch, &AutopilotLaws_DWork.sf_LagFilter_k);
  rtb_Y_l = AutopilotLaws_P.Gain_Gain_f * rtb_ManualSwitch + rtb_Saturation1;
  rtb_Saturation1 = AutopilotLaws_P.kntoms_Gain * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_n) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_n;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_d4) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_d4;
  }

  if (rtb_Saturation1 > AutopilotLaws_P.Saturation_UpperSat_n3) {
    rtb_Saturation1 = AutopilotLaws_P.Saturation_UpperSat_n3;
  } else if (rtb_Saturation1 < AutopilotLaws_P.Saturation_LowerSat_m) {
    rtb_Saturation1 = AutopilotLaws_P.Saturation_LowerSat_m;
  }

  rtb_Y_l = (rtb_Y_l - AutopilotLaws_U.in.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain / rtb_Saturation1;
  if (rtb_Y_l > 1.0) {
    rtb_Y_l = 1.0;
  } else if (rtb_Y_l < -1.0) {
    rtb_Y_l = -1.0;
  }

  rtb_ManualSwitch = AutopilotLaws_P.Gain_Gain_kr * std::asin(rtb_Y_l);
  rtb_Y_l = AutopilotLaws_P.kntoms_Gain_a * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_d) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_d;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_b) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_b;
  }

  rtb_Y_l = (AutopilotLaws_U.in.input.H_dot_c_fpm - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_h / rtb_Y_l;
  if (rtb_Y_l > 1.0) {
    rtb_Y_l = 1.0;
  } else if (rtb_Y_l < -1.0) {
    rtb_Y_l = -1.0;
  }

  rtb_Divide_h = AutopilotLaws_P.Gain_Gain_df * std::asin(rtb_Y_l);
  AutopilotLaws_VSLimiter(AutopilotLaws_P.VS_Gain_h * rtb_Divide_h, AutopilotLaws_U.in.data.V_tas_kn, &rtb_Y_c);
  rtb_Saturation1 = AutopilotLaws_P.Gain1_Gain_fu * AutopilotLaws_U.in.data.alpha_deg;
  rtb_Switch2 = result_0[2] * std::sin(rtb_Saturation1);
  rtb_Saturation1 = std::cos(rtb_Saturation1) * result_0[0];
  rtb_Mod2_k = (rtb_Switch2 + rtb_Saturation1) * AutopilotLaws_P.Gain_Gain_pb;
  AutopilotLaws_V_LSSpeedSelection(&AutopilotLaws_Y.out, &rtb_Saturation1);
  rtb_Y_l = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Saturation1) * AutopilotLaws_P.Gain1_Gain_j;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_e) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_e;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_mk) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_mk;
  }

  t = AutopilotLaws_P.Gain_Gain_o * rtb_Mod2_k + rtb_Y_l;
  rtb_Saturation1 = AutopilotLaws_P.Gain1_Gain_nv * AutopilotLaws_U.in.data.alpha_deg;
  rtb_Mod2_f = AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.data.VMAX_kn;
  rtb_Y_l = rtb_Mod2_f * AutopilotLaws_P.Gain1_Gain_ji;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_jm) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_jm;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_on) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_on;
  }

  rtb_Saturation1 = (result_0[2] * std::sin(rtb_Saturation1) + std::cos(rtb_Saturation1) * result_0[0]) *
    AutopilotLaws_P.Gain_Gain_e1 * AutopilotLaws_P.Gain_Gain_eq + rtb_Y_l;
  AutopilotLaws_SpeedProtectionMode(&AutopilotLaws_Y.out, rtb_Divide_h, rtb_Y_c, t, AutopilotLaws_P.Gain_Gain_of * t,
    rtb_Saturation1, AutopilotLaws_P.Gain_Gain_mw * rtb_Saturation1, &rtb_Mod2_k, &rtb_out_k);
  rtb_Y_l = AutopilotLaws_P.kntoms_Gain_p * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_k) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_k;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_l) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_l;
  }

  rtb_Divide_h = AutopilotLaws_U.in.input.FPA_c_deg - std::atan(AutopilotLaws_P.fpmtoms_Gain *
    AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Y_l) * AutopilotLaws_P.Gain_Gain_l;
  AutopilotLaws_VSLimiter(AutopilotLaws_P.Gain_Gain_c3 * rtb_Divide_h, AutopilotLaws_U.in.data.V_tas_kn, &rtb_Y_c);
  rtb_Saturation1 = AutopilotLaws_P.Gain1_Gain_b2 * AutopilotLaws_U.in.data.alpha_deg;
  AutopilotLaws_V_LSSpeedSelection(&AutopilotLaws_Y.out, &rtb_Y_ng);
  rtb_Y_l = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_ng) * AutopilotLaws_P.Gain1_Gain_fq;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_h) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_h;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_a) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_a;
  }

  rtb_Y_ng = (result_0[2] * std::sin(rtb_Saturation1) + std::cos(rtb_Saturation1) * result_0[0]) *
    AutopilotLaws_P.Gain_Gain_p2 * AutopilotLaws_P.Gain_Gain_n1 + rtb_Y_l;
  rtb_Saturation1 = AutopilotLaws_P.Gain1_Gain_ib * AutopilotLaws_U.in.data.alpha_deg;
  rtb_Y_l = rtb_Mod2_f * AutopilotLaws_P.Gain1_Gain_gs;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_l) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_l;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_i) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_i;
  }

  rtb_Saturation1 = (result_0[2] * std::sin(rtb_Saturation1) + std::cos(rtb_Saturation1) * result_0[0]) *
    AutopilotLaws_P.Gain_Gain_he * AutopilotLaws_P.Gain_Gain_p4 + rtb_Y_l;
  AutopilotLaws_SpeedProtectionMode(&AutopilotLaws_Y.out, rtb_Divide_h, rtb_Y_c, rtb_Y_ng, AutopilotLaws_P.Gain_Gain_i *
    rtb_Y_ng, rtb_Saturation1, AutopilotLaws_P.Gain_Gain_e5 * rtb_Saturation1, &rtb_Mod2_f, &t);
  AutopilotLaws_WashoutFilter(result_0[2], AutopilotLaws_P.WashoutFilter_C1, AutopilotLaws_U.in.time.dt, &rtb_Y_ng,
    &AutopilotLaws_DWork.sf_WashoutFilter_c);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_gs_error_deg, AutopilotLaws_P.LagFilter1_C1_a,
    AutopilotLaws_U.in.time.dt, &rtb_Y_l, &AutopilotLaws_DWork.sf_LagFilter_h);
  rtb_Divide_h = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain_l * rtb_Y_l;
  AutopilotLaws_LagFilter(rtb_Y_l + AutopilotLaws_P.Gain3_Gain_o * ((rtb_Divide_h - AutopilotLaws_DWork.Delay_DSTATE_g) /
    AutopilotLaws_U.in.time.dt), AutopilotLaws_P.LagFilter_C1_n, AutopilotLaws_U.in.time.dt, &rtb_Saturation1,
    &AutopilotLaws_DWork.sf_LagFilter_d2);
  AutopilotLaws_storevalue(rtb_GainTheta1 == AutopilotLaws_P.CompareToConstant6_const,
    AutopilotLaws_Y.out.data.nav_gs_deg, &rtb_Y_c, &AutopilotLaws_DWork.sf_storevalue_m);
  if (rtb_Y_c > AutopilotLaws_P.Saturation_UpperSat_f) {
    rtb_Y_c = AutopilotLaws_P.Saturation_UpperSat_f;
  } else if (rtb_Y_c < AutopilotLaws_P.Saturation_LowerSat_om) {
    rtb_Y_c = AutopilotLaws_P.Saturation_LowerSat_om;
  }

  rtb_Y_l = AutopilotLaws_P.kntoms_Gain_i * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_g) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_g;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_c) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_c;
  }

  rtb_Gain_ny = std::atan(AutopilotLaws_P.fpmtoms_Gain_e * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Y_l) *
    AutopilotLaws_P.Gain_Gain_nu;
  if ((AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.CompareToConstant_const_n) &&
      AutopilotLaws_U.in.data.nav_gs_valid) {
    rtb_Y_l = AutopilotLaws_P.Gain_Gain_h * rtb_Y_ng + rtb_Saturation1 * look1_binlxpw
      (AutopilotLaws_U.in.data.H_radio_ft, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_h,
       AutopilotLaws_P.ScheduledGain_Table_ir, 5U);
  } else {
    rtb_Y_l = (rtb_Y_c - rtb_Gain_ny) * AutopilotLaws_P.Gain2_Gain_j;
  }

  AutopilotLaws_Voter1(rtb_Y_l, AutopilotLaws_P.Gain1_Gain_nq * ((rtb_Y_c + AutopilotLaws_P.Bias_Bias) - rtb_Gain_ny),
                       AutopilotLaws_P.Gain_Gain_p2b * ((rtb_Y_c + AutopilotLaws_P.Bias1_Bias) - rtb_Gain_ny), &rtb_Y_dj);
  rtb_OR = (rtb_GainTheta1 == AutopilotLaws_P.CompareToConstant1_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty_m) {
    AutopilotLaws_DWork.wasActive_i = rtb_OR;
    AutopilotLaws_DWork.wasActive_not_empty_m = true;
  }

  rtb_Y_c = AutopilotLaws_U.in.input.H_c_ft - AutopilotLaws_U.in.data.H_ind_ft;
  if (rtb_Y_c < 0.0) {
    rtb_Saturation1 = -1.0;
  } else if (rtb_Y_c > 0.0) {
    rtb_Saturation1 = 1.0;
  } else {
    rtb_Saturation1 = rtb_Y_c;
  }

  rtb_Saturation1 = rtb_Saturation1 * AutopilotLaws_DWork.dH_offset + rtb_Y_c;
  if ((!AutopilotLaws_DWork.wasActive_i) && rtb_OR) {
    AutopilotLaws_DWork.k = AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation1;
    AutopilotLaws_DWork.dH_offset = std::abs(500.0 / std::abs(AutopilotLaws_DWork.k) - 100.0);
    if (rtb_Saturation1 < 0.0) {
      rtb_Y_l = -1.0;
    } else if (rtb_Saturation1 > 0.0) {
      rtb_Y_l = 1.0;
    } else {
      rtb_Y_l = rtb_Saturation1;
    }

    rtb_Saturation1 += rtb_Y_l * AutopilotLaws_DWork.dH_offset;
    AutopilotLaws_DWork.k = AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Saturation1;
  }

  AutopilotLaws_DWork.wasActive_i = rtb_OR;
  rtb_Y_l = AutopilotLaws_P.kntoms_Gain_e * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_dn) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_dn;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_bx) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_bx;
  }

  rtb_Y_l = (AutopilotLaws_DWork.k * rtb_Saturation1 - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_g / rtb_Y_l;
  if (rtb_Y_l > 1.0) {
    rtb_Y_l = 1.0;
  } else if (rtb_Y_l < -1.0) {
    rtb_Y_l = -1.0;
  }

  rtb_Gain_ny = AutopilotLaws_P.Gain_Gain_da * std::asin(rtb_Y_l);
  rtb_Saturation1 = AutopilotLaws_P.Gain1_Gain_kw * AutopilotLaws_U.in.data.alpha_deg;
  rtb_Switch2 = result_0[2] * std::sin(rtb_Saturation1);
  rtb_Saturation1 = std::cos(rtb_Saturation1) * result_0[0];
  AutopilotLaws_Voter1(AutopilotLaws_U.in.data.VLS_kn, AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VMAX_kn,
                       &rtb_Y_l);
  rtb_Sum_gh = AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_l;
  if (!AutopilotLaws_DWork.eventTime_not_empty) {
    AutopilotLaws_DWork.eventTime = AutopilotLaws_U.in.time.simulation_time;
    AutopilotLaws_DWork.eventTime_not_empty = true;
  }

  rtb_Vz = std::abs(rtb_Sum_gh);
  if ((rtb_GainTheta1 != AutopilotLaws_P.CompareToConstant2_const_e) || (rtb_Vz > 5.0) || (AutopilotLaws_DWork.eventTime
       == 0.0)) {
    AutopilotLaws_DWork.eventTime = AutopilotLaws_U.in.time.simulation_time;
  }

  if (10.0 < rtb_Vz) {
    rtb_Vz = 10.0;
  }

  rtb_Y_ng = (AutopilotLaws_U.in.time.simulation_time - AutopilotLaws_DWork.eventTime) - 5.0;
  if (0.0 > rtb_Y_ng) {
    rtb_Y_ng = 0.0;
  }

  rtb_Y_l = AutopilotLaws_P.Gain1_Gain_hn * rtb_Sum_gh;
  if (1.0 > rtb_Vz) {
    rtb_Vz = 1.0;
  }

  if (AutopilotLaws_P.GammaTCorrection_time < rtb_Y_ng) {
    rtb_Y_ng = AutopilotLaws_P.GammaTCorrection_time;
  }

  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_j4) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_j4;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_bb) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_bb;
  }

  rtb_Sum_gh = ((1.0 - (rtb_Vz - 1.0) * 0.1111111111111111) * AutopilotLaws_P.GammaTCorrection_gain * (1.0 /
    AutopilotLaws_P.GammaTCorrection_time * rtb_Y_ng) * rtb_Sum_gh + (rtb_Switch2 + rtb_Saturation1) *
                AutopilotLaws_P.Gain_Gain_bi * AutopilotLaws_P.Gain_Gain_ei) + rtb_Y_l;
  rtb_Y_l = AutopilotLaws_P.kntoms_Gain_iw * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_kg) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_kg;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_ce) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_ce;
  }

  rtb_Y_l = (AutopilotLaws_P.Constant_Value_k - AutopilotLaws_U.in.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain_p
    / rtb_Y_l;
  if (rtb_Y_l > 1.0) {
    rtb_Y_l = 1.0;
  } else if (rtb_Y_l < -1.0) {
    rtb_Y_l = -1.0;
  }

  rtb_Gain_pm = AutopilotLaws_P.Gain_Gain_md * std::asin(rtb_Y_l);
  rtb_Saturation1 = rtb_GainTheta - AutopilotLaws_P.Constant2_Value_f;
  rtb_Gain4 = AutopilotLaws_P.Gain4_Gain * rtb_Saturation1;
  rtb_Gain5 = AutopilotLaws_P.Gain5_Gain_c * AutopilotLaws_U.in.data.bz_m_s2;
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.bx_m_s2, AutopilotLaws_P.WashoutFilter_C1_m,
    AutopilotLaws_U.in.time.dt, &rtb_Y_ng, &AutopilotLaws_DWork.sf_WashoutFilter_l);
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.H_ind_ft, AutopilotLaws_P.WashoutFilter_C1_h,
    AutopilotLaws_U.in.time.dt, &rtb_Saturation1, &AutopilotLaws_DWork.sf_WashoutFilter);
  if (AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.Saturation_UpperSat_e0) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_e0;
  } else if (AutopilotLaws_U.in.data.H_radio_ft < AutopilotLaws_P.Saturation_LowerSat_mg) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_mg;
  } else {
    rtb_Y_l = AutopilotLaws_U.in.data.H_radio_ft;
  }

  AutopilotLaws_LagFilter(rtb_Y_l, AutopilotLaws_P.LagFilter_C1_h, AutopilotLaws_U.in.time.dt, &rtb_Switch2,
    &AutopilotLaws_DWork.sf_LagFilter_g);
  rtb_Switch2 = (rtb_Saturation1 + rtb_Switch2) * AutopilotLaws_P.DiscreteDerivativeVariableTs2_Gain;
  rtb_Saturation1 = (rtb_Switch2 - AutopilotLaws_DWork.Delay_DSTATE_k) / AutopilotLaws_U.in.time.dt;
  AutopilotLaws_LagFilter(AutopilotLaws_P.Gain2_Gain_c * rtb_Saturation1, AutopilotLaws_P.LagFilter3_C1,
    AutopilotLaws_U.in.time.dt, &rtb_Y_l, &AutopilotLaws_DWork.sf_LagFilter_e);
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.H_dot_ft_min, AutopilotLaws_P.WashoutFilter1_C1,
    AutopilotLaws_U.in.time.dt, &rtb_Saturation1, &AutopilotLaws_DWork.sf_WashoutFilter_h);
  rtb_Saturation1 += rtb_Y_l;
  rtb_OR = (rtb_GainTheta1 == AutopilotLaws_P.CompareToConstant7_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty) {
    AutopilotLaws_DWork.wasActive = rtb_OR;
    AutopilotLaws_DWork.wasActive_not_empty = true;
  }

  if ((!AutopilotLaws_DWork.wasActive) && rtb_OR) {
    rtb_Y_l = std::abs(rtb_Saturation1) / 60.0;
    AutopilotLaws_DWork.Tau = AutopilotLaws_U.in.data.H_radio_ft / (rtb_Y_l - 1.6666666666666667);
    AutopilotLaws_DWork.H_bias = AutopilotLaws_DWork.Tau * rtb_Y_l - AutopilotLaws_U.in.data.H_radio_ft;
  }

  if (rtb_OR) {
    rtb_Vz = -1.0 / AutopilotLaws_DWork.Tau * (AutopilotLaws_U.in.data.H_radio_ft + AutopilotLaws_DWork.H_bias) * 60.0;
  } else {
    rtb_Vz = rtb_Saturation1;
  }

  AutopilotLaws_DWork.wasActive = rtb_OR;
  rtb_Y_l = AutopilotLaws_P.kntoms_Gain_av * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_m) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_m;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_d1) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_d1;
  }

  rtb_Y_l = (rtb_Vz - rtb_Saturation1) * AutopilotLaws_P.ftmintoms_Gain_i / rtb_Y_l;
  if (rtb_Y_l > 1.0) {
    rtb_Y_l = 1.0;
  } else if (rtb_Y_l < -1.0) {
    rtb_Y_l = -1.0;
  }

  rtb_Gain_bh = AutopilotLaws_P.Gain_Gain_fz * std::asin(rtb_Y_l);
  rtb_Sum_j = AutopilotLaws_P.Constant1_Value_d - rtb_GainTheta;
  rtb_Saturation1 = AutopilotLaws_P.Gain1_Gain_fy * AutopilotLaws_U.in.data.alpha_deg;
  rtb_Y_l = (AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.input.V_c_kn) * AutopilotLaws_P.Gain1_Gain_fr;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_e3) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_e3;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_py) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_py;
  }

  rtb_Sum2_nr = (result_0[2] * std::sin(rtb_Saturation1) + std::cos(rtb_Saturation1) * result_0[0]) *
    AutopilotLaws_P.Gain_Gain_nub * AutopilotLaws_P.Gain_Gain_ao + rtb_Y_l;
  rtb_Y_l = AutopilotLaws_P.kntoms_Gain_f * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Y_l > AutopilotLaws_P.Saturation_UpperSat_b) {
    rtb_Y_l = AutopilotLaws_P.Saturation_UpperSat_b;
  } else if (rtb_Y_l < AutopilotLaws_P.Saturation_LowerSat_ow) {
    rtb_Y_l = AutopilotLaws_P.Saturation_LowerSat_ow;
  }

  rtb_Y_l = (AutopilotLaws_P.Constant_Value_i - AutopilotLaws_U.in.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain_j
    / rtb_Y_l;
  if (rtb_Y_l > 1.0) {
    rtb_Y_l = 1.0;
  } else if (rtb_Y_l < -1.0) {
    rtb_Y_l = -1.0;
  }

  rtb_Gain_lvv = AutopilotLaws_P.Gain_Gain_bd * std::asin(rtb_Y_l);
  AutopilotLaws_Voter1(rtb_Sum_j, AutopilotLaws_P.Gain_Gain_b2 * rtb_Sum2_nr, AutopilotLaws_P.VS_Gain_c * rtb_Gain_lvv,
                       &rtb_Saturation1);
  switch (static_cast<int32_T>(rtb_GainTheta1)) {
   case 0:
    rtb_Saturation1 = rtb_GainTheta;
    break;

   case 1:
    rtb_Saturation1 = AutopilotLaws_P.VS_Gain * rtb_ManualSwitch;
    break;

   case 2:
    rtb_Saturation1 = AutopilotLaws_P.VS_Gain_a * rtb_Gain_ny;
    break;

   case 3:
    if (rtb_Y_c > AutopilotLaws_P.Switch_Threshold_n) {
      rtb_Y_l = AutopilotLaws_P.Gain_Gain_kg * rtb_Sum_gh;
      rtb_Saturation1 = AutopilotLaws_P.VS_Gain_j * rtb_Gain_pm;
      if (rtb_Y_l > rtb_Saturation1) {
        rtb_Saturation1 = rtb_Y_l;
      }
    } else {
      rtb_Y_l = AutopilotLaws_P.Gain_Gain_kg * rtb_Sum_gh;
      rtb_Saturation1 = AutopilotLaws_P.VS_Gain_j * rtb_Gain_pm;
      if (rtb_Y_l < rtb_Saturation1) {
        rtb_Saturation1 = rtb_Y_l;
      }
    }
    break;

   case 4:
    rtb_Saturation1 = rtb_out_k;
    break;

   case 5:
    rtb_Saturation1 = t;
    break;

   case 6:
    rtb_Saturation1 = rtb_Y_dj;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch_Threshold_c) {
      rtb_Saturation1 = rtb_Gain4;
    } else {
      rtb_Saturation1 = (AutopilotLaws_P.Gain3_Gain * rtb_Y_ng + rtb_Gain5) + AutopilotLaws_P.VS_Gain_e * rtb_Gain_bh;
    }
    break;
  }

  rtb_Saturation1 += rtb_GainTheta;
  if (rtb_Saturation1 > AutopilotLaws_P.Constant1_Value_i) {
    rtb_Saturation1 = AutopilotLaws_P.Constant1_Value_i;
  } else {
    rtb_out_k = AutopilotLaws_P.Gain1_Gain_m * AutopilotLaws_P.Constant1_Value_i;
    if (rtb_Saturation1 < rtb_out_k) {
      rtb_Saturation1 = rtb_out_k;
    }
  }

  AutopilotLaws_DWork.icLoad_f = ((AutopilotLaws_Y.out.output.ap_on == 0.0) || AutopilotLaws_DWork.icLoad_f);
  if (AutopilotLaws_DWork.icLoad_f) {
    AutopilotLaws_DWork.Delay_DSTATE_h2 = rtb_GainTheta;
  }

  rtb_Y_l = rtb_Saturation1 - AutopilotLaws_DWork.Delay_DSTATE_h2;
  rtb_Saturation1 = AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (rtb_Y_l < rtb_Saturation1) {
    rtb_Saturation1 = rtb_Y_l;
  }

  rtb_Vz = AutopilotLaws_P.Gain1_Gain_i0 * AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (rtb_Saturation1 > rtb_Vz) {
    rtb_Vz = rtb_Saturation1;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h2 += rtb_Vz;
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h2, AutopilotLaws_P.LagFilter_C1_i,
    AutopilotLaws_U.in.time.dt, &rtb_out_k, &AutopilotLaws_DWork.sf_LagFilter_n);
  AutopilotLaws_RateLimiter(AutopilotLaws_Y.out.output.ap_on, AutopilotLaws_P.RateLimiterVariableTs_up_i,
    AutopilotLaws_P.RateLimiterVariableTs_lo_o, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_p, &rtb_Saturation1, &AutopilotLaws_DWork.sf_RateLimiter_g);
  if (rtb_Saturation1 > AutopilotLaws_P.Saturation_UpperSat_ju) {
    rtb_Saturation1 = AutopilotLaws_P.Saturation_UpperSat_ju;
  } else if (rtb_Saturation1 < AutopilotLaws_P.Saturation_LowerSat_n) {
    rtb_Saturation1 = AutopilotLaws_P.Saturation_LowerSat_n;
  }

  AutopilotLaws_Voter1(rtb_Sum_j, rtb_Sum2_nr, rtb_Gain_lvv, &rtb_Y_l);
  switch (static_cast<int32_T>(rtb_GainTheta1)) {
   case 0:
    rtb_Y_ng = rtb_GainTheta;
    break;

   case 1:
    rtb_Y_ng = rtb_ManualSwitch;
    break;

   case 2:
    rtb_Y_ng = rtb_Gain_ny;
    break;

   case 3:
    if (rtb_Y_c > AutopilotLaws_P.Switch_Threshold) {
      if (rtb_Sum_gh > rtb_Gain_pm) {
        rtb_Y_ng = rtb_Sum_gh;
      } else {
        rtb_Y_ng = rtb_Gain_pm;
      }
    } else if (rtb_Sum_gh < rtb_Gain_pm) {
      rtb_Y_ng = rtb_Sum_gh;
    } else {
      rtb_Y_ng = rtb_Gain_pm;
    }
    break;

   case 4:
    rtb_Y_ng = rtb_Mod2_k;
    break;

   case 5:
    rtb_Y_ng = rtb_Mod2_f;
    break;

   case 6:
    rtb_Y_ng = AutopilotLaws_P.Gain1_Gain_h * rtb_Y_dj;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch1_Threshold) {
      rtb_Y_ng = AutopilotLaws_P.Gain2_Gain_h * rtb_Gain4;
    } else {
      rtb_Y_ng = (AutopilotLaws_P.Gain1_Gain_i * rtb_Y_ng + rtb_Gain5) + rtb_Gain_bh;
    }
    break;

   default:
    rtb_Y_ng = rtb_Y_l;
    break;
  }

  rtb_GainTheta1 = rtb_Y_ng + rtb_GainTheta;
  if (rtb_GainTheta1 > AutopilotLaws_P.Constant1_Value_i) {
    AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = AutopilotLaws_P.Constant1_Value_i;
  } else {
    rtb_ManualSwitch = AutopilotLaws_P.Gain1_Gain_nu * AutopilotLaws_P.Constant1_Value_i;
    if (rtb_GainTheta1 < rtb_ManualSwitch) {
      AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = rtb_ManualSwitch;
    } else {
      AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = rtb_GainTheta1;
    }
  }

  AutopilotLaws_Y.out.output.autopilot.Theta_c_deg = (AutopilotLaws_P.Constant_Value_f - rtb_Saturation1) *
    rtb_GainTheta + rtb_out_k * rtb_Saturation1;
  for (rtb_on_ground = 0; rtb_on_ground < 99; rtb_on_ground++) {
    AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground + 1];
    AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground + 1];
  }

  AutopilotLaws_DWork.Delay_DSTATE_l[99] = rtb_Compare;
  AutopilotLaws_DWork.Delay_DSTATE_h5[99] = rtb_Delay_hu;
  AutopilotLaws_DWork.Delay_DSTATE_i = rtb_Saturation;
  AutopilotLaws_DWork.icLoad = false;
  AutopilotLaws_DWork.Delay_DSTATE_g = rtb_Divide_h;
  AutopilotLaws_DWork.Delay_DSTATE_k = rtb_Switch2;
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

    AutopilotLaws_DWork.Delay_DSTATE_i = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition;
    AutopilotLaws_DWork.icLoad = true;
    AutopilotLaws_DWork.Delay_DSTATE_g = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition_h;
    AutopilotLaws_DWork.Delay_DSTATE_k = AutopilotLaws_P.DiscreteDerivativeVariableTs2_InitialCondition;
    AutopilotLaws_DWork.icLoad_f = true;
    AutopilotLaws_Chart_p_Init(&rtb_out_f);
    AutopilotLaws_Chart_p_Init(&rtb_out_f);
    AutopilotLaws_Chart_Init(&rtb_out_f);
    AutopilotLaws_Chart_Init(&rtb_out_f);
    AutopilotLaws_B.u = AutopilotLaws_P.Y_Y0;
    AutopilotLaws_DWork.k = 5.0;
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
