#include "AutopilotLaws.h"
#include "AutopilotLaws_private.h"
#include "look1_binlxpw.h"
#include "rt_modd.h"

const uint8_T AutopilotLaws_IN_any = 1U;
const uint8_T AutopilotLaws_IN_left = 2U;
const uint8_T AutopilotLaws_IN_right = 3U;
const uint8_T AutopilotLaws_IN_any_g = 1U;
const uint8_T AutopilotLaws_IN_left_m = 2U;
const uint8_T AutopilotLaws_IN_right_o = 3U;
const uint8_T AutopilotLaws_IN_InAir = 1U;
const uint8_T AutopilotLaws_IN_OnGround = 2U;
void AutopilotLawsModelClass::AutopilotLaws_Chart(real_T rtu_right, real_T rtu_left, boolean_T rtu_use_short_path,
  real_T *rty_out, rtDW_Chart_AutopilotLaws_T *localDW)
{
  real_T tmp;
  real_T tmp_0;
  boolean_T tmp_1;
  if (localDW->is_active_c3_sUPy3BXaP8VT23gJSge3dZD_ap_library == 0U) {
    localDW->is_active_c3_sUPy3BXaP8VT23gJSge3dZD_ap_library = 1U;
    localDW->is_c3_sUPy3BXaP8VT23gJSge3dZD_ap_library = AutopilotLaws_IN_any;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c3_sUPy3BXaP8VT23gJSge3dZD_ap_library) {
     case AutopilotLaws_IN_any:
      tmp = std::abs(rtu_right);
      tmp_0 = std::abs(rtu_left);
      tmp_1 = !rtu_use_short_path;
      if (tmp_1 && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
        localDW->is_c3_sUPy3BXaP8VT23gJSge3dZD_ap_library = AutopilotLaws_IN_right;
        *rty_out = rtu_right;
      } else if (tmp_1 && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
        localDW->is_c3_sUPy3BXaP8VT23gJSge3dZD_ap_library = AutopilotLaws_IN_left;
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
        localDW->is_c3_sUPy3BXaP8VT23gJSge3dZD_ap_library = AutopilotLaws_IN_any;
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
        localDW->is_c3_sUPy3BXaP8VT23gJSge3dZD_ap_library = AutopilotLaws_IN_any;
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

void AutopilotLawsModelClass::AutopilotLaws_Chart_j(real_T rtu_right, real_T rtu_left, real_T rtu_use_short_path, real_T
  *rty_out, rtDW_Chart_AutopilotLaws_c_T *localDW)
{
  real_T tmp;
  real_T tmp_0;
  if (localDW->is_active_c3_sQHqjOt6dG4nwhom4nTqEME_ap_library == 0U) {
    localDW->is_active_c3_sQHqjOt6dG4nwhom4nTqEME_ap_library = 1U;
    localDW->is_c3_sQHqjOt6dG4nwhom4nTqEME_ap_library = AutopilotLaws_IN_any_g;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c3_sQHqjOt6dG4nwhom4nTqEME_ap_library) {
     case AutopilotLaws_IN_any_g:
      tmp = std::abs(rtu_right);
      tmp_0 = std::abs(rtu_left);
      if ((rtu_use_short_path == 0.0) && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
        localDW->is_c3_sQHqjOt6dG4nwhom4nTqEME_ap_library = AutopilotLaws_IN_right_o;
        *rty_out = rtu_right;
      } else if ((rtu_use_short_path == 0.0) && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
        localDW->is_c3_sQHqjOt6dG4nwhom4nTqEME_ap_library = AutopilotLaws_IN_left_m;
        *rty_out = rtu_left;
      } else if (tmp_0 < tmp) {
        *rty_out = rtu_left;
      } else {
        *rty_out = rtu_right;
      }
      break;

     case AutopilotLaws_IN_left_m:
      tmp = std::abs(rtu_left);
      tmp_0 = std::abs(rtu_right);
      if ((rtu_use_short_path != 0.0) || (tmp_0 < 10.0) || (tmp < 10.0)) {
        localDW->is_c3_sQHqjOt6dG4nwhom4nTqEME_ap_library = AutopilotLaws_IN_any_g;
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
        localDW->is_c3_sQHqjOt6dG4nwhom4nTqEME_ap_library = AutopilotLaws_IN_any_g;
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

void AutopilotLawsModelClass::AutopilotLaws_MATLABFunction1(boolean_T rtu_active, real_T rtu_u, real_T *rty_y,
  rtDW_MATLABFunction1_AutopilotLaws_T *localDW)
{
  if ((!rtu_active) || (!localDW->storage_not_empty)) {
    localDW->storage = rtu_u;
    localDW->storage_not_empty = true;
  }

  *rty_y = localDW->storage;
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
  real_T rtb_Gain2;
  real_T rtb_Gain4;
  real_T rtb_Gain5;
  real_T rtb_GainTheta;
  real_T rtb_GainTheta1;
  real_T rtb_Gain_ask;
  real_T rtb_Gain_be;
  real_T rtb_Gain_bq;
  real_T rtb_Gain_et;
  real_T rtb_Gain_g4;
  real_T rtb_Gain_p;
  real_T rtb_ManualSwitch;
  real_T rtb_Mod2;
  real_T rtb_Mod2_k;
  real_T rtb_Product3;
  real_T rtb_Product4_m;
  real_T rtb_Saturation;
  real_T rtb_Saturation1;
  real_T rtb_Sum2_bm;
  real_T rtb_Sum2_f;
  real_T rtb_Sum2_mk;
  real_T rtb_Sum_ib_tmp;
  real_T rtb_Sum_j;
  real_T rtb_Sum_l1;
  real_T rtb_Tsxlo;
  real_T rtb_Y_b;
  real_T rtb_out;
  real_T rtb_out_c;
  real_T rtb_out_el;
  real_T rtb_out_k;
  real_T rtb_y;
  real_T u1;
  int32_T i;
  int32_T rtb_BusAssignment_output_ap_on;
  int32_T rtb_on_ground;
  boolean_T rtb_Compare;
  boolean_T rtb_Delay_hu;
  boolean_T rtb_Delay_n;
  rtb_GainTheta = AutopilotLaws_P.GainTheta_Gain * AutopilotLaws_U.in.data.Theta_deg;
  rtb_GainTheta1 = AutopilotLaws_P.GainTheta1_Gain * AutopilotLaws_U.in.data.Phi_deg;
  rtb_Saturation = 0.017453292519943295 * rtb_GainTheta;
  rtb_Saturation1 = 0.017453292519943295 * rtb_GainTheta1;
  rtb_out_c = std::tan(rtb_Saturation);
  rtb_Mod2 = std::sin(rtb_Saturation1);
  rtb_Mod2_k = std::cos(rtb_Saturation1);
  result_tmp[0] = 1.0;
  result_tmp[3] = rtb_Mod2 * rtb_out_c;
  result_tmp[6] = rtb_Mod2_k * rtb_out_c;
  result_tmp[1] = 0.0;
  result_tmp[4] = rtb_Mod2_k;
  result_tmp[7] = -rtb_Mod2;
  result_tmp[2] = 0.0;
  rtb_Sum2_f = 1.0 / std::cos(rtb_Saturation);
  result_tmp[5] = rtb_Sum2_f * rtb_Mod2;
  result_tmp[8] = rtb_Sum2_f * rtb_Mod2_k;
  rtb_Mod2 = AutopilotLaws_P.Gain_Gain_de * AutopilotLaws_U.in.data.p_rad_s * AutopilotLaws_P.Gainpk_Gain;
  rtb_Mod2_k = AutopilotLaws_P.Gain_Gain_d * AutopilotLaws_U.in.data.q_rad_s * AutopilotLaws_P.Gainqk_Gain;
  rtb_out_c = AutopilotLaws_P.Gain_Gain_m * AutopilotLaws_U.in.data.r_rad_s;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result[rtb_on_ground] = result_tmp[rtb_on_ground + 6] * rtb_out_c + (result_tmp[rtb_on_ground + 3] * rtb_Mod2_k +
      result_tmp[rtb_on_ground] * rtb_Mod2);
  }

  rtb_out_c = std::cos(rtb_Saturation);
  rtb_Mod2 = std::sin(rtb_Saturation);
  rtb_Mod2_k = std::sin(rtb_Saturation1);
  rtb_Saturation = std::cos(rtb_Saturation1);
  result_tmp[0] = rtb_out_c;
  result_tmp[3] = 0.0;
  result_tmp[6] = -rtb_Mod2;
  result_tmp[1] = rtb_Mod2_k * rtb_Mod2;
  result_tmp[4] = rtb_Saturation;
  result_tmp[7] = rtb_out_c * rtb_Mod2_k;
  result_tmp[2] = rtb_Saturation * rtb_Mod2;
  result_tmp[5] = 0.0 - rtb_Mod2_k;
  result_tmp[8] = rtb_Saturation * rtb_out_c;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result_0[rtb_on_ground] = result_tmp[rtb_on_ground + 6] * AutopilotLaws_U.in.data.bz_m_s2 +
      (result_tmp[rtb_on_ground + 3] * AutopilotLaws_U.in.data.by_m_s2 + result_tmp[rtb_on_ground] *
       AutopilotLaws_U.in.data.bx_m_s2);
  }

  rtb_Saturation = AutopilotLaws_P.Gain_Gain_nz * AutopilotLaws_U.in.data.gear_strut_compression_1 -
    AutopilotLaws_P.Constant1_Value_b;
  if (rtb_Saturation > AutopilotLaws_P.Saturation_UpperSat_p) {
    rtb_Saturation = AutopilotLaws_P.Saturation_UpperSat_p;
  } else {
    if (rtb_Saturation < AutopilotLaws_P.Saturation_LowerSat_g) {
      rtb_Saturation = AutopilotLaws_P.Saturation_LowerSat_g;
    }
  }

  rtb_Saturation1 = AutopilotLaws_P.Gain1_Gain_ll * AutopilotLaws_U.in.data.gear_strut_compression_2 -
    AutopilotLaws_P.Constant1_Value_b;
  if (rtb_Saturation1 > AutopilotLaws_P.Saturation1_UpperSat_j) {
    rtb_Saturation1 = AutopilotLaws_P.Saturation1_UpperSat_j;
  } else {
    if (rtb_Saturation1 < AutopilotLaws_P.Saturation1_LowerSat_d) {
      rtb_Saturation1 = AutopilotLaws_P.Saturation1_LowerSat_d;
    }
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
  } else {
    if ((rtb_Saturation == 0.0) && (rtb_Saturation1 == 0.0)) {
      AutopilotLaws_DWork.is_c5_AutopilotLaws = AutopilotLaws_IN_InAir;
      rtb_on_ground = 0;
    } else {
      rtb_on_ground = 1;
    }
  }

  rtb_BusAssignment_output_ap_on = ((AutopilotLaws_U.in.input.enabled_AP1 != 0.0) ||
    (AutopilotLaws_U.in.input.enabled_AP2 != 0.0));
  rtb_Saturation = AutopilotLaws_P.Gain3_Gain_a * AutopilotLaws_U.in.data.nav_gs_deg;
  rtb_Saturation1 = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_deg - (AutopilotLaws_U.in.data.nav_loc_deg +
    AutopilotLaws_P.Constant3_Value_e)) + AutopilotLaws_P.Constant3_Value_e, AutopilotLaws_P.Constant3_Value_e);
  rtb_Mod2 = rt_modd(AutopilotLaws_P.Constant3_Value_e - rtb_Saturation1, AutopilotLaws_P.Constant3_Value_e);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = AutopilotLaws_P.Constant_Value;
  } else {
    rtb_ManualSwitch = AutopilotLaws_U.in.input.lateral_law;
  }

  rtb_Compare = (rtb_ManualSwitch == AutopilotLaws_P.CompareToConstant2_const);
  if (rtb_Saturation1 < rtb_Mod2) {
    rtb_Saturation1 *= AutopilotLaws_P.Gain1_Gain;
  } else {
    rtb_Saturation1 = AutopilotLaws_P.Gain_Gain * rtb_Mod2;
  }

  rtb_Saturation1 = std::abs(rtb_Saturation1);
  if (!AutopilotLaws_DWork.limit_not_empty) {
    AutopilotLaws_DWork.limit = rtb_Saturation1;
    AutopilotLaws_DWork.limit_not_empty = true;
  }

  if (!rtb_Compare) {
    if (rtb_Saturation1 > 15.0) {
      AutopilotLaws_DWork.limit = rtb_Saturation1;
    } else {
      AutopilotLaws_DWork.limit = 15.0;
    }

    if (AutopilotLaws_DWork.limit >= 115.0) {
      AutopilotLaws_DWork.limit = 115.0;
    }
  }

  if (rtb_Compare && (rtb_Saturation1 < 15.0)) {
    AutopilotLaws_DWork.limit = 15.0;
  }

  if (AutopilotLaws_U.in.data.nav_dme_nmi > AutopilotLaws_P.Saturation_UpperSat_c) {
    rtb_Sum2_f = AutopilotLaws_P.Saturation_UpperSat_c;
  } else if (AutopilotLaws_U.in.data.nav_dme_nmi < AutopilotLaws_P.Saturation_LowerSat_d) {
    rtb_Sum2_f = AutopilotLaws_P.Saturation_LowerSat_d;
  } else {
    rtb_Sum2_f = AutopilotLaws_U.in.data.nav_dme_nmi;
  }

  rtb_Sum2_f *= std::sin(AutopilotLaws_P.Gain1_Gain_g * AutopilotLaws_U.in.data.nav_loc_error_deg);
  rtb_Saturation1 = rtb_Sum2_f * look1_binlxpw(AutopilotLaws_U.in.data.nav_dme_nmi,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain_Table, 4U);
  rtb_Sum2_f = look1_binlxpw(rtb_Sum2_f, AutopilotLaws_P.ScheduledGain3_BreakpointsForDimension1,
    AutopilotLaws_P.ScheduledGain3_Table, 3U);
  rtb_Saturation1 *= rtb_Sum2_f;
  rtb_Mod2 = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_track_deg - (rt_modd(rt_modd
    (AutopilotLaws_U.in.data.nav_loc_error_deg + AutopilotLaws_U.in.data.nav_loc_deg, AutopilotLaws_P.Constant3_Value_m)
    + AutopilotLaws_P.Constant3_Value_m, AutopilotLaws_P.Constant3_Value_m) + AutopilotLaws_P.Constant3_Value_a)) +
                     AutopilotLaws_P.Constant3_Value_a, AutopilotLaws_P.Constant3_Value_a);
  rtb_Mod2_k = rt_modd(AutopilotLaws_P.Constant3_Value_a - rtb_Mod2, AutopilotLaws_P.Constant3_Value_a);
  if (rtb_Saturation1 > AutopilotLaws_DWork.limit) {
    rtb_Saturation1 = AutopilotLaws_DWork.limit;
  } else {
    if (rtb_Saturation1 < -AutopilotLaws_DWork.limit) {
      rtb_Saturation1 = -AutopilotLaws_DWork.limit;
    }
  }

  if (rtb_Mod2 < rtb_Mod2_k) {
    rtb_Mod2 *= AutopilotLaws_P.Gain1_Gain_p;
  } else {
    rtb_Mod2 = AutopilotLaws_P.Gain_Gain_p * rtb_Mod2_k;
  }

  rtb_Saturation1 = (rtb_Saturation1 + rtb_Mod2) * look1_binlxpw(AutopilotLaws_U.in.data.V_gnd_kn,
    AutopilotLaws_P.ScheduledGain1_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain1_Table, 3U) * look1_binlxpw
    (AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1,
     AutopilotLaws_P.ScheduledGain2_Table, 5U);
  rtb_Mod2 = rt_modd((AutopilotLaws_U.in.data.nav_loc_deg - (AutopilotLaws_U.in.data.Psi_magnetic_deg +
    AutopilotLaws_P.Constant3_Value_j)) + AutopilotLaws_P.Constant3_Value_j, AutopilotLaws_P.Constant3_Value_j);
  AutopilotLaws_Chart_j(rtb_Mod2, AutopilotLaws_P.Gain_Gain_nj * rt_modd(AutopilotLaws_P.Constant3_Value_j - rtb_Mod2,
    AutopilotLaws_P.Constant3_Value_j), AutopilotLaws_P.Constant2_Value, &rtb_out_c, &AutopilotLaws_DWork.sf_Chart_j);
  if (AutopilotLaws_U.in.data.nav_dme_nmi > AutopilotLaws_P.Saturation_UpperSat_o) {
    rtb_Sum2_f = AutopilotLaws_P.Saturation_UpperSat_o;
  } else if (AutopilotLaws_U.in.data.nav_dme_nmi < AutopilotLaws_P.Saturation_LowerSat_o) {
    rtb_Sum2_f = AutopilotLaws_P.Saturation_LowerSat_o;
  } else {
    rtb_Sum2_f = AutopilotLaws_U.in.data.nav_dme_nmi;
  }

  rtb_Sum2_f = std::sin(AutopilotLaws_P.Gain1_Gain_h5 * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_Sum2_f *
    AutopilotLaws_P.Gain2_Gain_g;
  if (rtb_Sum2_f > AutopilotLaws_P.Saturation1_UpperSat_g) {
    rtb_Sum2_f = AutopilotLaws_P.Saturation1_UpperSat_g;
  } else {
    if (rtb_Sum2_f < AutopilotLaws_P.Saturation1_LowerSat_k) {
      rtb_Sum2_f = AutopilotLaws_P.Saturation1_LowerSat_k;
    }
  }

  rtb_Compare = (rtb_ManualSwitch == AutopilotLaws_P.CompareToConstant_const);
  if (!rtb_Compare) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  AutopilotLaws_DWork.Delay_DSTATE += AutopilotLaws_P.Gain6_Gain * rtb_Sum2_f *
    AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_Gain * AutopilotLaws_U.in.time.dt;
  if (AutopilotLaws_DWork.Delay_DSTATE > AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else {
    if (AutopilotLaws_DWork.Delay_DSTATE < AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
      AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
    }
  }

  AutopilotLaws_MATLABFunction1(rtb_Compare, AutopilotLaws_U.in.data.nav_loc_deg, &rtb_y,
    &AutopilotLaws_DWork.sf_MATLABFunction1);
  rtb_Mod2 = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_deg - (rt_modd(rt_modd
    (AutopilotLaws_U.in.data.nav_loc_error_deg + rtb_y, AutopilotLaws_P.Constant3_Value_m0) +
    AutopilotLaws_P.Constant3_Value_m0, AutopilotLaws_P.Constant3_Value_m0) + AutopilotLaws_P.Constant3_Value_eg)) +
                     AutopilotLaws_P.Constant3_Value_eg, AutopilotLaws_P.Constant3_Value_eg);
  rtb_Mod2_k = rt_modd(AutopilotLaws_P.Constant3_Value_eg - rtb_Mod2, AutopilotLaws_P.Constant3_Value_eg);
  if (rtb_Mod2 < rtb_Mod2_k) {
    rtb_Mod2 *= AutopilotLaws_P.Gain1_Gain_ni;
  } else {
    rtb_Mod2 = AutopilotLaws_P.Gain_Gain_k * rtb_Mod2_k;
  }

  rtb_Mod2 = rt_modd((rt_modd(rt_modd(((rtb_Sum2_f * look1_binlxpw(AutopilotLaws_U.in.data.V_gnd_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_j, AutopilotLaws_P.ScheduledGain_Table_p, 2U) +
    AutopilotLaws_DWork.Delay_DSTATE) + AutopilotLaws_P.Gain1_Gain_f * rtb_Mod2) +
    AutopilotLaws_U.in.data.Psi_magnetic_deg, AutopilotLaws_P.Constant3_Value_c) + AutopilotLaws_P.Constant3_Value_c,
    AutopilotLaws_P.Constant3_Value_c) - (AutopilotLaws_U.in.data.Psi_magnetic_deg + AutopilotLaws_P.Constant3_Value_h))
                     + AutopilotLaws_P.Constant3_Value_h, AutopilotLaws_P.Constant3_Value_h);
  AutopilotLaws_Chart_j(rtb_Mod2, AutopilotLaws_P.Gain_Gain_py * rt_modd(AutopilotLaws_P.Constant3_Value_h - rtb_Mod2,
    AutopilotLaws_P.Constant3_Value_h), AutopilotLaws_P.Constant1_Value_e, &rtb_out_k, &AutopilotLaws_DWork.sf_Chart_o);
  rtb_Mod2 = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_deg +
    AutopilotLaws_P.Constant3_Value_d)) + AutopilotLaws_P.Constant3_Value_d, AutopilotLaws_P.Constant3_Value_d);
  rtb_Compare = ((rtb_ManualSwitch == AutopilotLaws_P.CompareToConstant5_const) ==
                 AutopilotLaws_P.CompareToConstant_const_h);
  rtb_Mod2_k = AutopilotLaws_P.Subsystem_Value / AutopilotLaws_U.in.time.dt;
  if (!rtb_Compare) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_lp[i] = AutopilotLaws_P.Delay_InitialCondition_hm;
    }
  }

  if (rtb_Mod2_k < 1.0) {
    rtb_Delay_hu = rtb_Compare;
  } else {
    if (rtb_Mod2_k > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::floor(rtb_Mod2_k), 4.294967296E+9)));
    }

    rtb_Delay_hu = AutopilotLaws_DWork.Delay_DSTATE_lp[100U - i];
  }

  AutopilotLaws_Chart(rtb_Mod2, AutopilotLaws_P.Gain_Gain_ac * rt_modd(AutopilotLaws_P.Constant3_Value_d - rtb_Mod2,
    AutopilotLaws_P.Constant3_Value_d), rtb_Compare != rtb_Delay_hu, &rtb_out_el, &AutopilotLaws_DWork.sf_Chart);
  rtb_Mod2 = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_track_deg +
    AutopilotLaws_P.Constant3_Value_n)) + AutopilotLaws_P.Constant3_Value_n, AutopilotLaws_P.Constant3_Value_n);
  rtb_Delay_hu = ((rtb_ManualSwitch == AutopilotLaws_P.CompareToConstant4_const) ==
                  AutopilotLaws_P.CompareToConstant_const_e);
  rtb_Mod2_k = AutopilotLaws_P.Subsystem_Value_n / AutopilotLaws_U.in.time.dt;
  if (!rtb_Delay_hu) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }
  }

  if (rtb_Mod2_k < 1.0) {
    rtb_Delay_n = rtb_Delay_hu;
  } else {
    if (rtb_Mod2_k > 100.0) {
      i = 100;
    } else {
      i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::floor(rtb_Mod2_k), 4.294967296E+9)));
    }

    rtb_Delay_n = AutopilotLaws_DWork.Delay_DSTATE_h5[100U - i];
  }

  AutopilotLaws_Chart(rtb_Mod2, AutopilotLaws_P.Gain_Gain_e * rt_modd(AutopilotLaws_P.Constant3_Value_n - rtb_Mod2,
    AutopilotLaws_P.Constant3_Value_n), rtb_Delay_hu != rtb_Delay_n, &rtb_out, &AutopilotLaws_DWork.sf_Chart_b);
  rtb_Mod2 = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain * AutopilotLaws_U.in.data.nav_loc_error_deg;
  rtb_Mod2_k = (rtb_Mod2 - AutopilotLaws_DWork.Delay_DSTATE_i) / AutopilotLaws_U.in.time.dt *
    AutopilotLaws_P.Gain3_Gain_i + AutopilotLaws_U.in.data.nav_loc_error_deg;
  rtb_Sum2_f = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1;
  rtb_Tsxlo = rtb_Sum2_f + AutopilotLaws_P.Constant_Value_p;
  AutopilotLaws_DWork.Delay1_DSTATE = 1.0 / rtb_Tsxlo * (AutopilotLaws_P.Constant_Value_p - rtb_Sum2_f) *
    AutopilotLaws_DWork.Delay1_DSTATE + (rtb_Mod2_k + AutopilotLaws_DWork.Delay_DSTATE_b) * (rtb_Sum2_f / rtb_Tsxlo);
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_Sum2_f = rtb_GainTheta1;
    break;

   case 1:
    rtb_Sum2_f = rtb_out_el * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_a, AutopilotLaws_P.ScheduledGain_Table_i, 5U);
    break;

   case 2:
    rtb_Sum2_f = rtb_out * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_d, AutopilotLaws_P.ScheduledGain_Table_h, 5U);
    break;

   case 3:
    rtb_Tsxlo = AutopilotLaws_P.Gain_Gain_n * AutopilotLaws_U.in.data.flight_guidance_xtk_nmi;
    if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat;
    } else {
      if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat) {
        rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat;
      }
    }

    rtb_Sum2_f = (AutopilotLaws_P.Gain2_Gain * AutopilotLaws_U.in.data.flight_guidance_tae_deg + rtb_Tsxlo) *
      AutopilotLaws_P.Gain1_Gain_n * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1_k, AutopilotLaws_P.ScheduledGain2_Table_g, 5U) +
      AutopilotLaws_U.in.data.flight_guidance_phi_deg;
    break;

   case 4:
    rtb_Sum2_f = rtb_Saturation1;
    break;

   case 5:
    rtb_Sum2_f = AutopilotLaws_DWork.Delay1_DSTATE * look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_e, AutopilotLaws_P.ScheduledGain_Table_pf, 4U) *
      look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1_j,
                    AutopilotLaws_P.ScheduledGain2_Table_h, 5U);
    break;

   default:
    rtb_Sum2_f = AutopilotLaws_P.Constant3_Value;
    break;
  }

  rtb_out_el = look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ROLLLIM1_bp01Data,
    AutopilotLaws_P.ROLLLIM1_tableData, 4U);
  if (rtb_Sum2_f > rtb_out_el) {
    rtb_Sum2_f = rtb_out_el;
  } else {
    rtb_out_el *= AutopilotLaws_P.Gain1_Gain_l;
    if (rtb_Sum2_f < rtb_out_el) {
      rtb_Sum2_f = rtb_out_el;
    }
  }

  if ((AutopilotLaws_U.in.input.enabled_AP1 == 0.0) && (AutopilotLaws_U.in.input.enabled_AP2 == 0.0)) {
    AutopilotLaws_DWork.icLoad = 1U;
  }

  if (AutopilotLaws_DWork.icLoad != 0) {
    AutopilotLaws_DWork.Delay_DSTATE_h = rtb_GainTheta1;
  }

  rtb_Tsxlo = rtb_Sum2_f - AutopilotLaws_DWork.Delay_DSTATE_h;
  u1 = AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (rtb_Tsxlo < u1) {
    u1 = rtb_Tsxlo;
  }

  rtb_Tsxlo = AutopilotLaws_P.Gain1_Gain_k * AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (u1 > rtb_Tsxlo) {
    rtb_Tsxlo = u1;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h += rtb_Tsxlo;
  rtb_Tsxlo = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1_l;
  rtb_Product3 = rtb_Tsxlo + AutopilotLaws_P.Constant_Value_b;
  AutopilotLaws_DWork.Delay1_DSTATE_p = 1.0 / rtb_Product3 * (AutopilotLaws_P.Constant_Value_b - rtb_Tsxlo) *
    AutopilotLaws_DWork.Delay1_DSTATE_p + (AutopilotLaws_DWork.Delay_DSTATE_h + AutopilotLaws_DWork.Delay_DSTATE_br) *
    (rtb_Tsxlo / rtb_Product3);
  rtb_Tsxlo = static_cast<real_T>(rtb_BusAssignment_output_ap_on) - AutopilotLaws_DWork.Delay_DSTATE_bu;
  u1 = AutopilotLaws_P.RateLimiterVariableTs_up * AutopilotLaws_U.in.time.dt;
  if (rtb_Tsxlo < u1) {
    u1 = rtb_Tsxlo;
  }

  rtb_Tsxlo = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.RateLimiterVariableTs_lo;
  if (u1 > rtb_Tsxlo) {
    rtb_Tsxlo = u1;
  }

  AutopilotLaws_DWork.Delay_DSTATE_bu += rtb_Tsxlo;
  if (AutopilotLaws_DWork.Delay_DSTATE_bu > AutopilotLaws_P.Saturation_UpperSat_j) {
    rtb_Product3 = AutopilotLaws_P.Saturation_UpperSat_j;
  } else if (AutopilotLaws_DWork.Delay_DSTATE_bu < AutopilotLaws_P.Saturation_LowerSat_p) {
    rtb_Product3 = AutopilotLaws_P.Saturation_LowerSat_p;
  } else {
    rtb_Product3 = AutopilotLaws_DWork.Delay_DSTATE_bu;
  }

  rtb_out_el = AutopilotLaws_DWork.Delay1_DSTATE_p * rtb_Product3;
  rtb_Product3 = AutopilotLaws_P.Constant_Value_n - rtb_Product3;
  rtb_Product3 *= rtb_GainTheta1;
  AutopilotLaws_Y.out.output.autopilot.Phi_c_deg = rtb_out_el + rtb_Product3;
  if (AutopilotLaws_U.in.data.H_radio_ft <= AutopilotLaws_P.CompareToConstant_const_d) {
    rtb_out_c *= AutopilotLaws_P.Gain_Gain_a;
  } else {
    rtb_out_c = AutopilotLaws_P.Constant1_Value;
  }

  rtb_Tsxlo = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter1_C1;
  rtb_Product3 = rtb_Tsxlo + AutopilotLaws_P.Constant_Value_nh;
  AutopilotLaws_DWork.Delay1_DSTATE_g = 1.0 / rtb_Product3 * (AutopilotLaws_P.Constant_Value_nh - rtb_Tsxlo) *
    AutopilotLaws_DWork.Delay1_DSTATE_g + (rtb_out_c + AutopilotLaws_DWork.Delay_DSTATE_o) * (rtb_Tsxlo / rtb_Product3);
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
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
    rtb_Tsxlo = AutopilotLaws_P.beta_Value_m;
    break;

   case 4:
    rtb_Tsxlo = AutopilotLaws_P.beta_Value_d;
    break;

   case 5:
    rtb_Tsxlo = AutopilotLaws_DWork.Delay1_DSTATE_g;
    break;

   default:
    rtb_Tsxlo = AutopilotLaws_P.Gain5_Gain * rtb_out_k + AutopilotLaws_P.Gain_Gain_b * result[2];
    break;
  }

  AutopilotLaws_Y.out.output.flight_director.Beta_c_deg = rtb_Tsxlo;
  AutopilotLaws_Y.out.output.autopilot.Beta_c_deg = rtb_Tsxlo;
  AutopilotLaws_Y.out.output.flight_director.Phi_c_deg = rtb_Sum2_f;
  if (AutopilotLaws_U.in.input.ALT_soft_mode_active) {
    rtb_Product3 = (AutopilotLaws_U.in.input.V_c_kn - AutopilotLaws_U.in.data.V_ias_kn) * AutopilotLaws_P.Gain1_Gain_b;
    if (rtb_Product3 > AutopilotLaws_P.Saturation1_UpperSat) {
      rtb_Product3 = AutopilotLaws_P.Saturation1_UpperSat;
    } else {
      if (rtb_Product3 < AutopilotLaws_P.Saturation1_LowerSat) {
        rtb_Product3 = AutopilotLaws_P.Saturation1_LowerSat;
      }
    }
  } else {
    rtb_Product3 = AutopilotLaws_P.Constant1_Value_h;
  }

  if (AutopilotLaws_P.ManualSwitch_CurrentSetting_b == 1) {
    rtb_out = AutopilotLaws_P.Constant_Value_m;
  } else {
    rtb_out = AutopilotLaws_U.in.input.vertical_law;
  }

  if (rtb_out != AutopilotLaws_P.CompareToConstant5_const_e) {
    AutopilotLaws_B.u = (AutopilotLaws_U.in.input.H_c_ft + AutopilotLaws_U.in.data.H_ft) -
      AutopilotLaws_U.in.data.H_ind_ft;
  }

  rtb_ManualSwitch = AutopilotLaws_B.u - AutopilotLaws_U.in.data.H_ft;
  rtb_Sum2_f = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1_a;
  rtb_Tsxlo = rtb_Sum2_f + AutopilotLaws_P.Constant_Value_i;
  AutopilotLaws_DWork.Delay1_DSTATE_f = 1.0 / rtb_Tsxlo * (AutopilotLaws_P.Constant_Value_i - rtb_Sum2_f) *
    AutopilotLaws_DWork.Delay1_DSTATE_f + (rtb_ManualSwitch + AutopilotLaws_DWork.Delay_DSTATE_j) * (rtb_Sum2_f /
    rtb_Tsxlo);
  rtb_Product3 += AutopilotLaws_P.Gain_Gain_f * AutopilotLaws_DWork.Delay1_DSTATE_f;
  if (rtb_Product3 > AutopilotLaws_P.Saturation_UpperSat_n) {
    rtb_Product3 = AutopilotLaws_P.Saturation_UpperSat_n;
  } else {
    if (rtb_Product3 < AutopilotLaws_P.Saturation_LowerSat_d4) {
      rtb_Product3 = AutopilotLaws_P.Saturation_LowerSat_d4;
    }
  }

  rtb_Product3 -= AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Tsxlo = AutopilotLaws_P.kntoms_Gain * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat_n3) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_n3;
  } else {
    if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat_m) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_m;
    }
  }

  rtb_Tsxlo = AutopilotLaws_P.ftmintoms_Gain * rtb_Product3 / rtb_Tsxlo;
  if (rtb_Tsxlo > 1.0) {
    rtb_Tsxlo = 1.0;
  } else {
    if (rtb_Tsxlo < -1.0) {
      rtb_Tsxlo = -1.0;
    }
  }

  rtb_Gain_g4 = AutopilotLaws_P.Gain_Gain_kr * std::asin(rtb_Tsxlo);
  rtb_Sum2_f = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.WashoutFilter_C1;
  rtb_Tsxlo = rtb_Sum2_f + AutopilotLaws_P.Constant_Value_k;
  rtb_Product3 = AutopilotLaws_P.Constant_Value_k / rtb_Tsxlo;
  rtb_out_k = AutopilotLaws_DWork.Delay_DSTATE_b0 * rtb_Product3;
  rtb_Product3 *= result_0[2];
  AutopilotLaws_DWork.Delay1_DSTATE_o = 1.0 / rtb_Tsxlo * (AutopilotLaws_P.Constant_Value_k - rtb_Sum2_f) *
    AutopilotLaws_DWork.Delay1_DSTATE_o + (rtb_Product3 - rtb_out_k);
  rtb_Sum2_f = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter1_C1_a;
  rtb_Tsxlo = rtb_Sum2_f + AutopilotLaws_P.Constant_Value_d;
  AutopilotLaws_DWork.Delay1_DSTATE_c = 1.0 / rtb_Tsxlo * (AutopilotLaws_P.Constant_Value_d - rtb_Sum2_f) *
    AutopilotLaws_DWork.Delay1_DSTATE_c + (AutopilotLaws_U.in.data.nav_gs_error_deg + AutopilotLaws_DWork.Delay_DSTATE_m)
    * (rtb_Sum2_f / rtb_Tsxlo);
  rtb_out_k = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain_l * AutopilotLaws_DWork.Delay1_DSTATE_c;
  rtb_out_el = (rtb_out_k - AutopilotLaws_DWork.Delay_DSTATE_g) / AutopilotLaws_U.in.time.dt *
    AutopilotLaws_P.Gain3_Gain_o + AutopilotLaws_DWork.Delay1_DSTATE_c;
  rtb_Product3 = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1_n;
  rtb_Sum2_f = rtb_Product3 + AutopilotLaws_P.Constant_Value_f;
  AutopilotLaws_DWork.Delay1_DSTATE_e = 1.0 / rtb_Sum2_f * (AutopilotLaws_P.Constant_Value_f - rtb_Product3) *
    AutopilotLaws_DWork.Delay1_DSTATE_e + (rtb_out_el + AutopilotLaws_DWork.Delay_DSTATE_iw) * (rtb_Product3 /
    rtb_Sum2_f);
  AutopilotLaws_MATLABFunction1(rtb_out == AutopilotLaws_P.CompareToConstant6_const, rtb_Saturation, &rtb_y,
    &AutopilotLaws_DWork.sf_MATLABFunction1_m);
  if (rtb_y > AutopilotLaws_P.Saturation_UpperSat_f) {
    rtb_y = AutopilotLaws_P.Saturation_UpperSat_f;
  } else {
    if (rtb_y < AutopilotLaws_P.Saturation_LowerSat_om) {
      rtb_y = AutopilotLaws_P.Saturation_LowerSat_om;
    }
  }

  rtb_Tsxlo = AutopilotLaws_P.kntoms_Gain_i * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat_g) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_g;
  } else {
    if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat_c) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_c;
    }
  }

  rtb_Gain_ask = std::atan(AutopilotLaws_P.fpmtoms_Gain * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Tsxlo) *
    AutopilotLaws_P.Gain_Gain_nu;
  if ((AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.CompareToConstant_const_n) &&
      AutopilotLaws_U.in.data.nav_gs_valid) {
    rtb_Sum2_f = AutopilotLaws_P.Gain_Gain_h * AutopilotLaws_DWork.Delay1_DSTATE_o + AutopilotLaws_DWork.Delay1_DSTATE_e
      * look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_h,
                      AutopilotLaws_P.ScheduledGain_Table_ir, 5U);
  } else {
    rtb_Sum2_f = (rtb_y - rtb_Gain_ask) * AutopilotLaws_P.Gain2_Gain_j;
  }

  AutopilotLaws_Voter1(rtb_Sum2_f, AutopilotLaws_P.Gain1_Gain_nq * ((rtb_y + AutopilotLaws_P.Bias_Bias) - rtb_Gain_ask),
                       AutopilotLaws_P.Gain_Gain_p2 * ((rtb_y + AutopilotLaws_P.Bias1_Bias) - rtb_Gain_ask), &rtb_Y_b);
  rtb_Sum_ib_tmp = AutopilotLaws_U.in.input.H_c_ft - AutopilotLaws_U.in.data.H_ind_ft;
  rtb_Tsxlo = AutopilotLaws_P.kntoms_Gain_e * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Sum_ib_tmp < 0.0) {
    rtb_Sum2_f = -1.0;
  } else if (rtb_Sum_ib_tmp > 0.0) {
    rtb_Sum2_f = 1.0;
  } else {
    rtb_Sum2_f = rtb_Sum_ib_tmp;
  }

  if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat_d) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_d;
  } else {
    if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat_b) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_b;
    }
  }

  rtb_Tsxlo = ((AutopilotLaws_P.Constant_Value_b0 * rtb_Sum2_f + rtb_Sum_ib_tmp) * AutopilotLaws_P.Gain_Gain_el -
               AutopilotLaws_U.in.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain_g / rtb_Tsxlo;
  if (rtb_Tsxlo > 1.0) {
    rtb_Tsxlo = 1.0;
  } else {
    if (rtb_Tsxlo < -1.0) {
      rtb_Tsxlo = -1.0;
    }
  }

  rtb_Gain_be = AutopilotLaws_P.Gain_Gain_da * std::asin(rtb_Tsxlo);
  rtb_Product3 = AutopilotLaws_P.Gain1_Gain_kw * AutopilotLaws_U.in.data.alpha_deg;
  rtb_Sum2_f = result_0[2] * std::sin(rtb_Product3);
  rtb_Product3 = std::cos(rtb_Product3);
  rtb_Product3 *= result_0[0];
  u1 = AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.input.V_c_kn;
  rtb_Tsxlo = u1 * AutopilotLaws_P.Gain1_Gain_hn;
  if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat_j4) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_j4;
  } else {
    if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat_bb) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_bb;
    }
  }

  rtb_Sum2_bm = (rtb_Sum2_f + rtb_Product3) * AutopilotLaws_P.Gain_Gain_bi * AutopilotLaws_P.Gain_Gain_ei + rtb_Tsxlo;
  rtb_Tsxlo = AutopilotLaws_P.kntoms_Gain_iw * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat_k) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_k;
  } else {
    if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat_ce) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_ce;
    }
  }

  rtb_Tsxlo = (AutopilotLaws_P.Constant_Value_ke - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_p / rtb_Tsxlo;
  if (rtb_Tsxlo > 1.0) {
    rtb_Tsxlo = 1.0;
  } else {
    if (rtb_Tsxlo < -1.0) {
      rtb_Tsxlo = -1.0;
    }
  }

  rtb_Gain_bq = AutopilotLaws_P.Gain_Gain_md * std::asin(rtb_Tsxlo);
  rtb_Tsxlo = AutopilotLaws_P.kntoms_Gain_a * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat_db) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_db;
  } else {
    if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat_bt) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_bt;
    }
  }

  rtb_Tsxlo = (AutopilotLaws_U.in.input.H_dot_c_fpm - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_h / rtb_Tsxlo;
  if (rtb_Tsxlo > 1.0) {
    rtb_Tsxlo = 1.0;
  } else {
    if (rtb_Tsxlo < -1.0) {
      rtb_Tsxlo = -1.0;
    }
  }

  rtb_Gain_p = AutopilotLaws_P.Gain_Gain_df * std::asin(rtb_Tsxlo);
  rtb_Tsxlo = AutopilotLaws_P.kntoms_Gain_p * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat_kp) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_kp;
  } else {
    if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat_l) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_l;
    }
  }

  rtb_Sum_l1 = AutopilotLaws_U.in.input.FPA_c_deg - std::atan(AutopilotLaws_P.fpmtoms_Gain_d *
    AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Tsxlo) * AutopilotLaws_P.Gain_Gain_l;
  rtb_Gain4 = (rtb_GainTheta - AutopilotLaws_P.Constant2_Value_f) * AutopilotLaws_P.Gain4_Gain;
  rtb_Gain5 = AutopilotLaws_P.Gain5_Gain_c * AutopilotLaws_U.in.data.bz_m_s2;
  rtb_Sum2_f = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.WashoutFilter_C1_m;
  rtb_Tsxlo = rtb_Sum2_f + AutopilotLaws_P.Constant_Value_o;
  rtb_Product3 = AutopilotLaws_P.Constant_Value_o / rtb_Tsxlo;
  rtb_y = AutopilotLaws_DWork.Delay_DSTATE_g2 * rtb_Product3;
  rtb_Product3 *= AutopilotLaws_U.in.data.bx_m_s2;
  AutopilotLaws_DWork.Delay1_DSTATE_a = 1.0 / rtb_Tsxlo * (AutopilotLaws_P.Constant_Value_o - rtb_Sum2_f) *
    AutopilotLaws_DWork.Delay1_DSTATE_a + (rtb_Product3 - rtb_y);
  rtb_Sum2_f = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.WashoutFilter_C1_h;
  rtb_Tsxlo = rtb_Sum2_f + AutopilotLaws_P.Constant_Value_j;
  rtb_Product3 = AutopilotLaws_P.Constant_Value_j / rtb_Tsxlo;
  rtb_y = AutopilotLaws_DWork.Delay_DSTATE_l * rtb_Product3;
  rtb_Product3 *= AutopilotLaws_U.in.data.H_ind_ft;
  AutopilotLaws_DWork.Delay1_DSTATE_n = 1.0 / rtb_Tsxlo * (AutopilotLaws_P.Constant_Value_j - rtb_Sum2_f) *
    AutopilotLaws_DWork.Delay1_DSTATE_n + (rtb_Product3 - rtb_y);
  if (AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.Saturation_UpperSat_e) {
    rtb_y = AutopilotLaws_P.Saturation_UpperSat_e;
  } else if (AutopilotLaws_U.in.data.H_radio_ft < AutopilotLaws_P.Saturation_LowerSat_mg) {
    rtb_y = AutopilotLaws_P.Saturation_LowerSat_mg;
  } else {
    rtb_y = AutopilotLaws_U.in.data.H_radio_ft;
  }

  rtb_Product3 = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1_h;
  rtb_Sum2_f = rtb_Product3 + AutopilotLaws_P.Constant_Value_kw;
  AutopilotLaws_DWork.Delay1_DSTATE_m = 1.0 / rtb_Sum2_f * (AutopilotLaws_P.Constant_Value_kw - rtb_Product3) *
    AutopilotLaws_DWork.Delay1_DSTATE_m + (rtb_y + AutopilotLaws_DWork.Delay_DSTATE_a) * (rtb_Product3 / rtb_Sum2_f);
  rtb_Gain_ask = (AutopilotLaws_DWork.Delay1_DSTATE_n + AutopilotLaws_DWork.Delay1_DSTATE_m) *
    AutopilotLaws_P.DiscreteDerivativeVariableTs2_Gain;
  rtb_Gain2 = (rtb_Gain_ask - AutopilotLaws_DWork.Delay_DSTATE_k) / AutopilotLaws_U.in.time.dt *
    AutopilotLaws_P.Gain2_Gain_c;
  rtb_Product3 = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter3_C1;
  rtb_Sum2_f = rtb_Product3 + AutopilotLaws_P.Constant_Value_h;
  AutopilotLaws_DWork.Delay1_DSTATE_f1 = 1.0 / rtb_Sum2_f * (AutopilotLaws_P.Constant_Value_h - rtb_Product3) *
    AutopilotLaws_DWork.Delay1_DSTATE_f1 + (rtb_Gain2 + AutopilotLaws_DWork.Delay_DSTATE_n) * (rtb_Product3 / rtb_Sum2_f);
  rtb_Sum2_f = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.WashoutFilter1_C1;
  rtb_Tsxlo = rtb_Sum2_f + AutopilotLaws_P.Constant_Value_dn;
  rtb_Product3 = AutopilotLaws_P.Constant_Value_dn / rtb_Tsxlo;
  rtb_Product4_m = AutopilotLaws_DWork.Delay_DSTATE_p * rtb_Product3;
  rtb_Product3 *= AutopilotLaws_U.in.data.H_dot_ft_min;
  AutopilotLaws_DWork.Delay1_DSTATE_o3 = 1.0 / rtb_Tsxlo * (AutopilotLaws_P.Constant_Value_dn - rtb_Sum2_f) *
    AutopilotLaws_DWork.Delay1_DSTATE_o3 + (rtb_Product3 - rtb_Product4_m);
  rtb_Sum2_f = AutopilotLaws_DWork.Delay1_DSTATE_f1 + AutopilotLaws_DWork.Delay1_DSTATE_o3;
  rtb_Delay_n = (rtb_out == AutopilotLaws_P.CompareToConstant7_const);
  if (!AutopilotLaws_DWork.wasActive_not_empty) {
    AutopilotLaws_DWork.wasActive = rtb_Delay_n;
    AutopilotLaws_DWork.wasActive_not_empty = true;
  }

  if ((!AutopilotLaws_DWork.wasActive) && rtb_Delay_n) {
    rtb_Tsxlo = std::abs(rtb_Sum2_f) / 60.0;
    AutopilotLaws_DWork.Tau = AutopilotLaws_U.in.data.H_radio_ft / (rtb_Tsxlo - 1.6666666666666667);
    AutopilotLaws_DWork.H_bias = AutopilotLaws_DWork.Tau * rtb_Tsxlo - AutopilotLaws_U.in.data.H_radio_ft;
  }

  if (rtb_Delay_n) {
    rtb_Product3 = -1.0 / AutopilotLaws_DWork.Tau * (AutopilotLaws_U.in.data.H_radio_ft + AutopilotLaws_DWork.H_bias) *
      60.0;
  } else {
    rtb_Product3 = rtb_Sum2_f;
  }

  AutopilotLaws_DWork.wasActive = rtb_Delay_n;
  rtb_Tsxlo = AutopilotLaws_P.kntoms_Gain_av * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat_m) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_m;
  } else {
    if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat_d1) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_d1;
    }
  }

  rtb_Tsxlo = (rtb_Product3 - rtb_Sum2_f) * AutopilotLaws_P.ftmintoms_Gain_i / rtb_Tsxlo;
  if (rtb_Tsxlo > 1.0) {
    rtb_Tsxlo = 1.0;
  } else {
    if (rtb_Tsxlo < -1.0) {
      rtb_Tsxlo = -1.0;
    }
  }

  rtb_Product4_m = AutopilotLaws_P.Gain_Gain_fz * std::asin(rtb_Tsxlo);
  rtb_Sum_j = AutopilotLaws_P.Constant1_Value_d - rtb_GainTheta;
  rtb_Product3 = AutopilotLaws_P.Gain1_Gain_fy * AutopilotLaws_U.in.data.alpha_deg;
  rtb_Sum2_f = result_0[2] * std::sin(rtb_Product3);
  rtb_Product3 = std::cos(rtb_Product3);
  rtb_Product3 *= result_0[0];
  rtb_Tsxlo = u1 * AutopilotLaws_P.Gain1_Gain_fr;
  if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat_e3) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_e3;
  } else {
    if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat_py) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_py;
    }
  }

  rtb_Sum2_mk = (rtb_Sum2_f + rtb_Product3) * AutopilotLaws_P.Gain_Gain_nub * AutopilotLaws_P.Gain_Gain_ao + rtb_Tsxlo;
  rtb_Tsxlo = AutopilotLaws_P.kntoms_Gain_f * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Tsxlo > AutopilotLaws_P.Saturation_UpperSat_b) {
    rtb_Tsxlo = AutopilotLaws_P.Saturation_UpperSat_b;
  } else {
    if (rtb_Tsxlo < AutopilotLaws_P.Saturation_LowerSat_ow) {
      rtb_Tsxlo = AutopilotLaws_P.Saturation_LowerSat_ow;
    }
  }

  rtb_Tsxlo = (AutopilotLaws_P.Constant_Value_in - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_j / rtb_Tsxlo;
  if (rtb_Tsxlo > 1.0) {
    rtb_Tsxlo = 1.0;
  } else {
    if (rtb_Tsxlo < -1.0) {
      rtb_Tsxlo = -1.0;
    }
  }

  rtb_Gain_et = AutopilotLaws_P.Gain_Gain_bd * std::asin(rtb_Tsxlo);
  AutopilotLaws_Voter1(rtb_Sum_j, AutopilotLaws_P.Gain_Gain_b2 * rtb_Sum2_mk, AutopilotLaws_P.VS_Gain_c * rtb_Gain_et,
                       &rtb_Product3);
  switch (static_cast<int32_T>(rtb_out)) {
   case 0:
    rtb_Product3 = rtb_GainTheta;
    break;

   case 1:
    rtb_Product3 = AutopilotLaws_P.VS_Gain * rtb_Gain_g4;
    break;

   case 2:
    rtb_Product3 = AutopilotLaws_P.VS_Gain_a * rtb_Gain_be;
    break;

   case 3:
    if (rtb_Sum_ib_tmp > AutopilotLaws_P.Switch_Threshold_n) {
      rtb_Tsxlo = AutopilotLaws_P.Gain_Gain_kg * rtb_Sum2_bm;
      rtb_Product3 = AutopilotLaws_P.VS_Gain_j * rtb_Gain_bq;
      if (rtb_Tsxlo > rtb_Product3) {
        rtb_Product3 = rtb_Tsxlo;
      }
    } else {
      rtb_Tsxlo = AutopilotLaws_P.Gain_Gain_kg * rtb_Sum2_bm;
      rtb_Product3 = AutopilotLaws_P.VS_Gain_j * rtb_Gain_bq;
      if (rtb_Tsxlo < rtb_Product3) {
        rtb_Product3 = rtb_Tsxlo;
      }
    }
    break;

   case 4:
    rtb_Product3 = AutopilotLaws_P.VS_Gain_h * rtb_Gain_p;
    break;

   case 5:
    rtb_Product3 = AutopilotLaws_P.Gain_Gain_c * rtb_Sum_l1;
    break;

   case 6:
    rtb_Product3 = rtb_Y_b;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch_Threshold_c) {
      rtb_Product3 = rtb_Gain4;
    } else {
      rtb_Product3 = (AutopilotLaws_P.Gain3_Gain * AutopilotLaws_DWork.Delay1_DSTATE_a + rtb_Gain5) +
        AutopilotLaws_P.VS_Gain_e * rtb_Product4_m;
    }
    break;
  }

  rtb_Product3 += rtb_GainTheta;
  if (rtb_Product3 > AutopilotLaws_P.Constant1_Value_i) {
    rtb_Product3 = AutopilotLaws_P.Constant1_Value_i;
  } else {
    rtb_Sum2_f = AutopilotLaws_P.Gain1_Gain_m * AutopilotLaws_P.Constant1_Value_i;
    if (rtb_Product3 < rtb_Sum2_f) {
      rtb_Product3 = rtb_Sum2_f;
    }
  }

  if (rtb_BusAssignment_output_ap_on == 0) {
    AutopilotLaws_DWork.icLoad_f = 1U;
  }

  if (AutopilotLaws_DWork.icLoad_f != 0) {
    AutopilotLaws_DWork.Delay_DSTATE_h2 = rtb_GainTheta;
  }

  rtb_Product3 -= AutopilotLaws_DWork.Delay_DSTATE_h2;
  u1 = AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (rtb_Product3 >= u1) {
    rtb_Product3 = u1;
  }

  u1 = AutopilotLaws_P.Gain1_Gain_i0 * AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (rtb_Product3 > u1) {
    u1 = rtb_Product3;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h2 += u1;
  rtb_Product3 = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1_i;
  rtb_Sum2_f = rtb_Product3 + AutopilotLaws_P.Constant_Value_fp;
  AutopilotLaws_DWork.Delay1_DSTATE_e1 = 1.0 / rtb_Sum2_f * (AutopilotLaws_P.Constant_Value_fp - rtb_Product3) *
    AutopilotLaws_DWork.Delay1_DSTATE_e1 + (AutopilotLaws_DWork.Delay_DSTATE_h2 + AutopilotLaws_DWork.Delay_DSTATE_iu) *
    (rtb_Product3 / rtb_Sum2_f);
  rtb_Tsxlo = static_cast<real_T>(rtb_BusAssignment_output_ap_on) - AutopilotLaws_DWork.Delay_DSTATE_d;
  u1 = AutopilotLaws_P.RateLimiterVariableTs_up_i * AutopilotLaws_U.in.time.dt;
  if (rtb_Tsxlo < u1) {
    u1 = rtb_Tsxlo;
  }

  rtb_Tsxlo = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.RateLimiterVariableTs_lo_o;
  if (u1 > rtb_Tsxlo) {
    rtb_Tsxlo = u1;
  }

  AutopilotLaws_DWork.Delay_DSTATE_d += rtb_Tsxlo;
  if (AutopilotLaws_DWork.Delay_DSTATE_d > AutopilotLaws_P.Saturation_UpperSat_ju) {
    rtb_Product3 = AutopilotLaws_P.Saturation_UpperSat_ju;
  } else if (AutopilotLaws_DWork.Delay_DSTATE_d < AutopilotLaws_P.Saturation_LowerSat_n) {
    rtb_Product3 = AutopilotLaws_P.Saturation_LowerSat_n;
  } else {
    rtb_Product3 = AutopilotLaws_DWork.Delay_DSTATE_d;
  }

  rtb_Sum2_f = AutopilotLaws_DWork.Delay1_DSTATE_e1 * rtb_Product3;
  rtb_Product3 = AutopilotLaws_P.Constant_Value_fs - rtb_Product3;
  rtb_Product3 *= rtb_GainTheta;
  AutopilotLaws_Y.out.output.autopilot.Theta_c_deg = rtb_Sum2_f + rtb_Product3;
  AutopilotLaws_Voter1(rtb_Sum_j, rtb_Sum2_mk, rtb_Gain_et, &rtb_Sum2_f);
  switch (static_cast<int32_T>(rtb_out)) {
   case 0:
    rtb_Sum2_f = rtb_GainTheta;
    break;

   case 1:
    rtb_Sum2_f = rtb_Gain_g4;
    break;

   case 2:
    rtb_Sum2_f = rtb_Gain_be;
    break;

   case 3:
    if (rtb_Sum_ib_tmp > AutopilotLaws_P.Switch_Threshold) {
      if (rtb_Sum2_bm > rtb_Gain_bq) {
        rtb_Sum2_f = rtb_Sum2_bm;
      } else {
        rtb_Sum2_f = rtb_Gain_bq;
      }
    } else if (rtb_Sum2_bm < rtb_Gain_bq) {
      rtb_Sum2_f = rtb_Sum2_bm;
    } else {
      rtb_Sum2_f = rtb_Gain_bq;
    }
    break;

   case 4:
    rtb_Sum2_f = rtb_Gain_p;
    break;

   case 5:
    rtb_Sum2_f = rtb_Sum_l1;
    break;

   case 6:
    rtb_Sum2_f = AutopilotLaws_P.Gain1_Gain_h * rtb_Y_b;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch1_Threshold) {
      rtb_Sum2_f = AutopilotLaws_P.Gain2_Gain_h * rtb_Gain4;
    } else {
      rtb_Sum2_f = (AutopilotLaws_P.Gain1_Gain_i * AutopilotLaws_DWork.Delay1_DSTATE_a + rtb_Gain5) + rtb_Product4_m;
    }
    break;
  }

  rtb_Sum2_f += rtb_GainTheta;
  if (rtb_Sum2_f > AutopilotLaws_P.Constant1_Value_i) {
    AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = AutopilotLaws_P.Constant1_Value_i;
  } else {
    rtb_out = AutopilotLaws_P.Gain1_Gain_nu * AutopilotLaws_P.Constant1_Value_i;
    if (rtb_Sum2_f < rtb_out) {
      AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = rtb_out;
    } else {
      AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = rtb_Sum2_f;
    }
  }

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
  AutopilotLaws_Y.out.data.nav_gs_deg = rtb_Saturation;
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
  AutopilotLaws_Y.out.output.ap_on = rtb_BusAssignment_output_ap_on;
  AutopilotLaws_Y.out.output.Phi_loc_c = rtb_Saturation1;
  for (rtb_on_ground = 0; rtb_on_ground < 99; rtb_on_ground++) {
    AutopilotLaws_DWork.Delay_DSTATE_lp[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_lp[rtb_on_ground + 1];
    AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground + 1];
  }

  AutopilotLaws_DWork.Delay_DSTATE_lp[99] = rtb_Compare;
  AutopilotLaws_DWork.Delay_DSTATE_h5[99] = rtb_Delay_hu;
  AutopilotLaws_DWork.Delay_DSTATE_i = rtb_Mod2;
  AutopilotLaws_DWork.Delay_DSTATE_b = rtb_Mod2_k;
  AutopilotLaws_DWork.icLoad = 0U;
  AutopilotLaws_DWork.Delay_DSTATE_br = AutopilotLaws_DWork.Delay_DSTATE_h;
  AutopilotLaws_DWork.Delay_DSTATE_o = rtb_out_c;
  AutopilotLaws_DWork.Delay_DSTATE_j = rtb_ManualSwitch;
  AutopilotLaws_DWork.Delay_DSTATE_b0 = result_0[2];
  AutopilotLaws_DWork.Delay_DSTATE_m = AutopilotLaws_U.in.data.nav_gs_error_deg;
  AutopilotLaws_DWork.Delay_DSTATE_g = rtb_out_k;
  AutopilotLaws_DWork.Delay_DSTATE_iw = rtb_out_el;
  AutopilotLaws_DWork.Delay_DSTATE_g2 = AutopilotLaws_U.in.data.bx_m_s2;
  AutopilotLaws_DWork.Delay_DSTATE_l = AutopilotLaws_U.in.data.H_ind_ft;
  AutopilotLaws_DWork.Delay_DSTATE_a = rtb_y;
  AutopilotLaws_DWork.Delay_DSTATE_k = rtb_Gain_ask;
  AutopilotLaws_DWork.Delay_DSTATE_n = rtb_Gain2;
  AutopilotLaws_DWork.Delay_DSTATE_p = AutopilotLaws_U.in.data.H_dot_ft_min;
  AutopilotLaws_DWork.icLoad_f = 0U;
  AutopilotLaws_DWork.Delay_DSTATE_iu = AutopilotLaws_DWork.Delay_DSTATE_h2;
}

void AutopilotLawsModelClass::initialize()
{
  {
    int32_T i;
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_lp[i] = AutopilotLaws_P.Delay_InitialCondition_hm;
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }

    AutopilotLaws_DWork.Delay_DSTATE_i = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition;
    AutopilotLaws_DWork.Delay_DSTATE_b = AutopilotLaws_P.Delay_InitialCondition;
    AutopilotLaws_DWork.Delay1_DSTATE = AutopilotLaws_P.Delay1_InitialCondition;
    AutopilotLaws_DWork.icLoad = 1U;
    AutopilotLaws_DWork.Delay_DSTATE_br = AutopilotLaws_P.Delay_InitialCondition_h;
    AutopilotLaws_DWork.Delay1_DSTATE_p = AutopilotLaws_P.Delay1_InitialCondition_i;
    AutopilotLaws_DWork.Delay_DSTATE_bu = AutopilotLaws_P.RateLimiterVariableTs_InitialCondition;
    AutopilotLaws_DWork.Delay_DSTATE_o = AutopilotLaws_P.Delay_InitialCondition_i;
    AutopilotLaws_DWork.Delay1_DSTATE_g = AutopilotLaws_P.Delay1_InitialCondition_p;
    AutopilotLaws_DWork.Delay_DSTATE_j = AutopilotLaws_P.Delay_InitialCondition_a;
    AutopilotLaws_DWork.Delay1_DSTATE_f = AutopilotLaws_P.Delay1_InitialCondition_e;
    AutopilotLaws_DWork.Delay_DSTATE_b0 = AutopilotLaws_P.Delay_InitialCondition_k;
    AutopilotLaws_DWork.Delay1_DSTATE_o = AutopilotLaws_P.Delay1_InitialCondition_k;
    AutopilotLaws_DWork.Delay_DSTATE_m = AutopilotLaws_P.Delay_InitialCondition_g;
    AutopilotLaws_DWork.Delay1_DSTATE_c = AutopilotLaws_P.Delay1_InitialCondition_b;
    AutopilotLaws_DWork.Delay_DSTATE_g = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition_h;
    AutopilotLaws_DWork.Delay_DSTATE_iw = AutopilotLaws_P.Delay_InitialCondition_d;
    AutopilotLaws_DWork.Delay1_DSTATE_e = AutopilotLaws_P.Delay1_InitialCondition_o;
    AutopilotLaws_DWork.Delay_DSTATE_g2 = AutopilotLaws_P.Delay_InitialCondition_l;
    AutopilotLaws_DWork.Delay1_DSTATE_a = AutopilotLaws_P.Delay1_InitialCondition_o0;
    AutopilotLaws_DWork.Delay_DSTATE_l = AutopilotLaws_P.Delay_InitialCondition_f;
    AutopilotLaws_DWork.Delay1_DSTATE_n = AutopilotLaws_P.Delay1_InitialCondition_kw;
    AutopilotLaws_DWork.Delay_DSTATE_a = AutopilotLaws_P.Delay_InitialCondition_e;
    AutopilotLaws_DWork.Delay1_DSTATE_m = AutopilotLaws_P.Delay1_InitialCondition_g;
    AutopilotLaws_DWork.Delay_DSTATE_k = AutopilotLaws_P.DiscreteDerivativeVariableTs2_InitialCondition;
    AutopilotLaws_DWork.Delay_DSTATE_n = AutopilotLaws_P.Delay_InitialCondition_el;
    AutopilotLaws_DWork.Delay1_DSTATE_f1 = AutopilotLaws_P.Delay1_InitialCondition_f;
    AutopilotLaws_DWork.Delay_DSTATE_p = AutopilotLaws_P.Delay_InitialCondition_m;
    AutopilotLaws_DWork.Delay1_DSTATE_o3 = AutopilotLaws_P.Delay1_InitialCondition_m;
    AutopilotLaws_DWork.icLoad_f = 1U;
    AutopilotLaws_DWork.Delay_DSTATE_iu = AutopilotLaws_P.Delay_InitialCondition_mo;
    AutopilotLaws_DWork.Delay1_DSTATE_e1 = AutopilotLaws_P.Delay1_InitialCondition_ea;
    AutopilotLaws_DWork.Delay_DSTATE_d = AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_p;
    AutopilotLaws_B.u = AutopilotLaws_P.Y_Y0;
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
