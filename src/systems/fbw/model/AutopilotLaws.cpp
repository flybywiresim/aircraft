#include "AutopilotLaws.h"
#include "AutopilotLaws_private.h"
#include "look1_binlxpw.h"
#include "rt_modd.h"

const uint8_T AutopilotLaws_IN_NO_ACTIVE_CHILD = 0U;
const uint8_T AutopilotLaws_IN_any = 1U;
const uint8_T AutopilotLaws_IN_left = 2U;
const uint8_T AutopilotLaws_IN_right = 3U;
const uint8_T AutopilotLaws_IN_NO_ACTIVE_CHILD_l = 0U;
const uint8_T AutopilotLaws_IN_any_e = 1U;
const uint8_T AutopilotLaws_IN_left_j = 2U;
const uint8_T AutopilotLaws_IN_right_g = 3U;
const uint8_T AutopilotLaws_IN_InAir = 1U;
const uint8_T AutopilotLaws_IN_NO_ACTIVE_CHILD_n = 0U;
const uint8_T AutopilotLaws_IN_OnGround = 2U;
const ap_laws_output AutopilotLaws_rtZap_laws_output = {
  {
    0.0,
    0.0
  },

  {
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    false,
    0.0,
    0.0,
    0.0,
    false,
    0.0,
    false,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    false,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0
  },

  {
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    false,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    false
  },

  {
    0.0,

    {
      0.0,
      0.0,
      0.0
    },

    {
      0.0,
      0.0,
      0.0
    }
  }
} ;

const ap_laws_input AutopilotLaws_rtZap_laws_input = { { 0.0, 0.0 }, { 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, false, 0.0, 0.0, 0.0, false, 0.0, false, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, false, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 }, { 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, false, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, false } };

void AutopilotLawsModelClass::AutopilotLaws_Chart_Init(rtDW_Chart_AutopilotLaws_T *localDW)
{
  localDW->is_active_c3_AutopilotLaws = 0U;
  localDW->is_c3_AutopilotLaws = AutopilotLaws_IN_NO_ACTIVE_CHILD;
}

void AutopilotLawsModelClass::AutopilotLaws_Chart(real_T rtu_right, real_T rtu_left, real_T rtu_use_short_path, real_T
  *rty_out, rtDW_Chart_AutopilotLaws_T *localDW)
{
  real_T tmp;
  real_T tmp_0;
  if (localDW->is_active_c3_AutopilotLaws == 0U) {
    localDW->is_active_c3_AutopilotLaws = 1U;
    localDW->is_c3_AutopilotLaws = AutopilotLaws_IN_any;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c3_AutopilotLaws) {
     case AutopilotLaws_IN_any:
      tmp = std::abs(rtu_right);
      tmp_0 = std::abs(rtu_left);
      if ((rtu_use_short_path == 0.0) && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
        localDW->is_c3_AutopilotLaws = AutopilotLaws_IN_right;
        *rty_out = rtu_right;
      } else if ((rtu_use_short_path == 0.0) && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
        localDW->is_c3_AutopilotLaws = AutopilotLaws_IN_left;
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
      if ((rtu_use_short_path != 0.0) || (tmp_0 < 10.0) || (tmp < 10.0)) {
        localDW->is_c3_AutopilotLaws = AutopilotLaws_IN_any;
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
        localDW->is_c3_AutopilotLaws = AutopilotLaws_IN_any;
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

void AutopilotLawsModelClass::AutopilotLaws_Chart_j_Init(rtDW_Chart_AutopilotLaws_i_T *localDW)
{
  localDW->is_active_c1_AutopilotLaws = 0U;
  localDW->is_c1_AutopilotLaws = AutopilotLaws_IN_NO_ACTIVE_CHILD_l;
}

void AutopilotLawsModelClass::AutopilotLaws_Chart_h(real_T rtu_right, real_T rtu_left, boolean_T rtu_use_short_path,
  real_T *rty_out, rtDW_Chart_AutopilotLaws_i_T *localDW)
{
  real_T tmp;
  real_T tmp_0;
  boolean_T tmp_1;
  if (localDW->is_active_c1_AutopilotLaws == 0U) {
    localDW->is_active_c1_AutopilotLaws = 1U;
    localDW->is_c1_AutopilotLaws = AutopilotLaws_IN_any_e;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c1_AutopilotLaws) {
     case AutopilotLaws_IN_any_e:
      tmp = std::abs(rtu_right);
      tmp_0 = std::abs(rtu_left);
      tmp_1 = !rtu_use_short_path;
      if (tmp_1 && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
        localDW->is_c1_AutopilotLaws = AutopilotLaws_IN_right_g;
        *rty_out = rtu_right;
      } else if (tmp_1 && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
        localDW->is_c1_AutopilotLaws = AutopilotLaws_IN_left_j;
        *rty_out = rtu_left;
      } else if (tmp_0 < tmp) {
        *rty_out = rtu_left;
      } else {
        *rty_out = rtu_right;
      }
      break;

     case AutopilotLaws_IN_left_j:
      tmp = std::abs(rtu_left);
      tmp_0 = std::abs(rtu_right);
      if (rtu_use_short_path || (tmp_0 < 10.0) || (tmp < 10.0)) {
        localDW->is_c1_AutopilotLaws = AutopilotLaws_IN_any_e;
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
        localDW->is_c1_AutopilotLaws = AutopilotLaws_IN_any_e;
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
  real_T result[3];
  real_T rtb_Minup;
  real_T rtb_Divide_oz;
  real_T rtb_Divide_epe;
  real_T rtb_GainTheta;
  real_T rtb_GainTheta1;
  real_T rtb_Saturation;
  real_T rtb_Saturation1;
  int32_T rtb_on_ground;
  int32_T rtb_BusAssignment_output_ap_on;
  real_T rtb_ManualSwitch;
  real_T rtb_Mod1_p;
  real_T rtb_Mod2;
  boolean_T rtb_Compare_b;
  boolean_T rtb_Compare_h;
  real_T rtb_Mod1_m;
  real_T rtb_Gain_f5;
  real_T rtb_Gain_mn;
  real_T rtb_Sum2_d;
  real_T rtb_Gain_hxe;
  real_T rtb_Gain_fz;
  real_T rtb_Gain4;
  real_T rtb_Sum2_ho;
  real_T rtb_Gain_mk;
  real_T rtb_Y_j;
  real_T rtb_Sum2_l;
  real_T rtb_Y;
  real_T rtb_Sum_l1;
  real_T rtb_out;
  real_T rtb_out_g;
  real_T rtb_out_kk;
  real_T rtb_out_o;
  int32_T i;
  real_T tmp[9];
  uint32_T rtb_Divide_o;
  boolean_T rtb_Divide_g;
  real_T rtb_Sum_ba_tmp;
  rtb_GainTheta = AutopilotLaws_P.GainTheta_Gain * AutopilotLaws_U.in.data.Theta_deg;
  rtb_GainTheta1 = AutopilotLaws_P.GainTheta1_Gain * AutopilotLaws_U.in.data.Phi_deg;
  rtb_Saturation1 = 0.017453292519943295 * rtb_GainTheta;
  rtb_Mod1_m = 0.017453292519943295 * rtb_GainTheta1;
  rtb_out_o = std::tan(rtb_Saturation1);
  rtb_Saturation = std::sin(rtb_Mod1_m);
  rtb_Mod1_m = std::cos(rtb_Mod1_m);
  tmp[0] = 1.0;
  tmp[3] = rtb_Saturation * rtb_out_o;
  tmp[6] = rtb_Mod1_m * rtb_out_o;
  tmp[1] = 0.0;
  tmp[4] = rtb_Mod1_m;
  tmp[7] = -rtb_Saturation;
  tmp[2] = 0.0;
  rtb_out_kk = 1.0 / std::cos(rtb_Saturation1);
  tmp[5] = rtb_out_kk * rtb_Saturation;
  tmp[8] = rtb_out_kk * rtb_Mod1_m;
  rtb_Saturation = AutopilotLaws_P.Gain_Gain_de * AutopilotLaws_U.in.data.p_rad_s * AutopilotLaws_P.Gainpk_Gain;
  rtb_Saturation1 = AutopilotLaws_P.Gain_Gain_d * AutopilotLaws_U.in.data.q_rad_s * AutopilotLaws_P.Gainqk_Gain;
  rtb_out_o = AutopilotLaws_P.Gain_Gain_m * AutopilotLaws_U.in.data.r_rad_s;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result[rtb_on_ground] = tmp[rtb_on_ground + 6] * rtb_out_o + (tmp[rtb_on_ground + 3] * rtb_Saturation1 +
      tmp[rtb_on_ground] * rtb_Saturation);
  }

  rtb_Saturation = AutopilotLaws_P.Gain_Gain_n * AutopilotLaws_U.in.data.gear_strut_compression_1 -
    AutopilotLaws_P.Constant1_Value_b;
  if (rtb_Saturation > AutopilotLaws_P.Saturation_UpperSat) {
    rtb_Saturation = AutopilotLaws_P.Saturation_UpperSat;
  } else {
    if (rtb_Saturation < AutopilotLaws_P.Saturation_LowerSat) {
      rtb_Saturation = AutopilotLaws_P.Saturation_LowerSat;
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
  } else if (AutopilotLaws_DWork.is_c5_AutopilotLaws == AutopilotLaws_IN_InAir) {
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
  rtb_Saturation = AutopilotLaws_P.Gain2_Gain_b * AutopilotLaws_U.in.data.zeta_pos;
  rtb_Saturation1 = rt_modd((AutopilotLaws_U.in.data.nav_loc_deg - (AutopilotLaws_U.in.data.Psi_magnetic_deg +
    AutopilotLaws_P.Constant3_Value_k)) + AutopilotLaws_P.Constant3_Value_k, AutopilotLaws_P.Constant3_Value_k);
  AutopilotLaws_Chart(rtb_Saturation1, AutopilotLaws_P.Gain_Gain_f * rt_modd(AutopilotLaws_P.Constant3_Value_k -
    rtb_Saturation1, AutopilotLaws_P.Constant3_Value_k), AutopilotLaws_P.Constant2_Value, &rtb_out_o,
                      &AutopilotLaws_DWork.sf_Chart_d);
  if (AutopilotLaws_U.in.data.H_radio_ft <= AutopilotLaws_P.CompareToConstant_const) {
    rtb_Saturation1 = AutopilotLaws_P.Gain_Gain_a * rtb_out_o;
  } else {
    rtb_Saturation1 = AutopilotLaws_P.Constant1_Value;
  }

  rtb_out_o = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter1_C1;
  rtb_Minup = rtb_out_o + AutopilotLaws_P.Constant_Value_mu;
  AutopilotLaws_DWork.Delay1_DSTATE = 1.0 / rtb_Minup * (AutopilotLaws_P.Constant_Value_mu - rtb_out_o) *
    AutopilotLaws_DWork.Delay1_DSTATE + (rtb_Saturation1 + AutopilotLaws_DWork.Delay_DSTATE) * (rtb_out_o / rtb_Minup);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = AutopilotLaws_P.Constant_Value;
  } else {
    rtb_ManualSwitch = AutopilotLaws_U.in.input.lateral_law;
  }

  if (AutopilotLaws_U.in.data.nav_dme_nmi > AutopilotLaws_P.Saturation_UpperSat_o) {
    rtb_out_kk = AutopilotLaws_P.Saturation_UpperSat_o;
  } else if (AutopilotLaws_U.in.data.nav_dme_nmi < AutopilotLaws_P.Saturation_LowerSat_o) {
    rtb_out_kk = AutopilotLaws_P.Saturation_LowerSat_o;
  } else {
    rtb_out_kk = AutopilotLaws_U.in.data.nav_dme_nmi;
  }

  rtb_out_o = std::sin(AutopilotLaws_P.Gain1_Gain_i * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_out_kk *
    AutopilotLaws_P.Gain2_Gain_g;
  if (rtb_out_o > AutopilotLaws_P.Saturation1_UpperSat_g) {
    rtb_out_o = AutopilotLaws_P.Saturation1_UpperSat_g;
  } else {
    if (rtb_out_o < AutopilotLaws_P.Saturation1_LowerSat_k) {
      rtb_out_o = AutopilotLaws_P.Saturation1_LowerSat_k;
    }
  }

  if (rtb_ManualSwitch != AutopilotLaws_P.CompareToConstant_const_k) {
    AutopilotLaws_DWork.Delay_DSTATE_h = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h += AutopilotLaws_P.Gain6_Gain * rtb_out_o *
    AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_Gain * AutopilotLaws_U.in.time.dt;
  if (AutopilotLaws_DWork.Delay_DSTATE_h > AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    AutopilotLaws_DWork.Delay_DSTATE_h = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else {
    if (AutopilotLaws_DWork.Delay_DSTATE_h < AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
      AutopilotLaws_DWork.Delay_DSTATE_h = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
    }
  }

  rtb_Mod1_m = AutopilotLaws_U.in.data.nav_loc_error_deg + AutopilotLaws_U.in.data.nav_loc_deg;
  rtb_Mod1_p = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_deg - (rt_modd(rt_modd(rtb_Mod1_m,
    AutopilotLaws_P.Constant3_Value_n) + AutopilotLaws_P.Constant3_Value_n, AutopilotLaws_P.Constant3_Value_n) +
    AutopilotLaws_P.Constant3_Value_f)) + AutopilotLaws_P.Constant3_Value_f, AutopilotLaws_P.Constant3_Value_f);
  rtb_Mod2 = rt_modd(AutopilotLaws_P.Constant3_Value_f - rtb_Mod1_p, AutopilotLaws_P.Constant3_Value_f);
  if (rtb_Mod1_p < rtb_Mod2) {
    rtb_Mod1_p *= AutopilotLaws_P.Gain1_Gain_e;
  } else {
    rtb_Mod1_p = AutopilotLaws_P.Gain_Gain_e * rtb_Mod2;
  }

  rtb_out_o = rt_modd((rt_modd(rt_modd(((rtb_out_o * look1_binlxpw(AutopilotLaws_U.in.data.V_gnd_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain_Table, 2U) +
    AutopilotLaws_DWork.Delay_DSTATE_h) + AutopilotLaws_P.Gain1_Gain_f * rtb_Mod1_p) +
    AutopilotLaws_U.in.data.Psi_magnetic_deg, AutopilotLaws_P.Constant3_Value_l) + AutopilotLaws_P.Constant3_Value_l,
    AutopilotLaws_P.Constant3_Value_l) - (AutopilotLaws_U.in.data.Psi_magnetic_deg + AutopilotLaws_P.Constant3_Value_i))
                      + AutopilotLaws_P.Constant3_Value_i, AutopilotLaws_P.Constant3_Value_i);
  AutopilotLaws_Chart(rtb_out_o, AutopilotLaws_P.Gain_Gain_i * rt_modd(AutopilotLaws_P.Constant3_Value_i - rtb_out_o,
    AutopilotLaws_P.Constant3_Value_i), AutopilotLaws_P.Constant1_Value_e, &rtb_Mod1_p, &AutopilotLaws_DWork.sf_Chart_ch);
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_out_o = AutopilotLaws_P.beta_Value_ed;
    break;

   case 1:
    rtb_out_o = AutopilotLaws_P.beta_Value_e;
    break;

   case 2:
    rtb_out_o = AutopilotLaws_P.beta_Value_b;
    break;

   case 3:
    rtb_out_o = AutopilotLaws_P.beta_Value_m;
    break;

   case 4:
    rtb_out_o = AutopilotLaws_P.beta_Value;
    break;

   case 5:
    rtb_out_o = AutopilotLaws_DWork.Delay1_DSTATE;
    break;

   default:
    rtb_out_o = (AutopilotLaws_P.Gain5_Gain * rtb_Mod1_p + AutopilotLaws_P.Gain_Gain_b * result[2]) + rtb_Saturation;
    break;
  }

  rtb_Mod2 = look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn, AutopilotLaws_P.ROLLLIM1_bp01Data,
    AutopilotLaws_P.ROLLLIM1_tableData, 4U);
  rtb_Mod1_p = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_deg +
    AutopilotLaws_P.Constant3_Value_e)) + AutopilotLaws_P.Constant3_Value_e, AutopilotLaws_P.Constant3_Value_e);
  rtb_Compare_b = ((rtb_ManualSwitch == AutopilotLaws_P.CompareToConstant5_const) == static_cast<int32_T>
                   (AutopilotLaws_P.CompareToConstant_const_h));
  rtb_Divide_oz = AutopilotLaws_P.Subsystem_Value / AutopilotLaws_U.in.time.dt;
  if (!rtb_Compare_b) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_lp[i] = AutopilotLaws_P.Delay_InitialCondition_h;
    }
  }

  if (rtb_Divide_oz > 100.0) {
    rtb_Divide_o = 100U;
  } else {
    if (rtb_Divide_oz < 0.0) {
      rtb_out_kk = std::ceil(rtb_Divide_oz);
    } else {
      rtb_out_kk = std::floor(rtb_Divide_oz);
    }

    rtb_out_kk = std::fmod(rtb_out_kk, 4.294967296E+9);
    rtb_Divide_o = rtb_out_kk < 0.0 ? static_cast<uint32_T>(-static_cast<int32_T>(static_cast<uint32_T>(-rtb_out_kk))) :
      static_cast<uint32_T>(rtb_out_kk);
  }

  if (rtb_Divide_oz < 1.0) {
    rtb_Compare_h = rtb_Compare_b;
  } else {
    rtb_Compare_h = AutopilotLaws_DWork.Delay_DSTATE_lp[100U - rtb_Divide_o];
  }

  AutopilotLaws_Chart_h(rtb_Mod1_p, AutopilotLaws_P.Gain_Gain_be * rt_modd(AutopilotLaws_P.Constant3_Value_e -
    rtb_Mod1_p, AutopilotLaws_P.Constant3_Value_e), rtb_Compare_b != rtb_Compare_h, &rtb_Divide_oz,
                        &AutopilotLaws_DWork.sf_Chart_h);
  rtb_Mod1_p = rt_modd((AutopilotLaws_U.in.input.Psi_c_deg - (AutopilotLaws_U.in.data.Psi_magnetic_track_deg +
    AutopilotLaws_P.Constant3_Value_ip)) + AutopilotLaws_P.Constant3_Value_ip, AutopilotLaws_P.Constant3_Value_ip);
  rtb_Compare_h = ((rtb_ManualSwitch == AutopilotLaws_P.CompareToConstant4_const) == static_cast<int32_T>
                   (AutopilotLaws_P.CompareToConstant_const_e));
  rtb_Divide_epe = AutopilotLaws_P.Subsystem_Value_n / AutopilotLaws_U.in.time.dt;
  if (!rtb_Compare_h) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }
  }

  if (rtb_Divide_epe > 100.0) {
    rtb_Divide_o = 100U;
  } else {
    if (rtb_Divide_epe < 0.0) {
      rtb_out_kk = std::ceil(rtb_Divide_epe);
    } else {
      rtb_out_kk = std::floor(rtb_Divide_epe);
    }

    rtb_out_kk = std::fmod(rtb_out_kk, 4.294967296E+9);
    rtb_Divide_o = rtb_out_kk < 0.0 ? static_cast<uint32_T>(-static_cast<int32_T>(static_cast<uint32_T>(-rtb_out_kk))) :
      static_cast<uint32_T>(rtb_out_kk);
  }

  if (rtb_Divide_epe < 1.0) {
    rtb_Divide_g = rtb_Compare_h;
  } else {
    rtb_Divide_g = AutopilotLaws_DWork.Delay_DSTATE_h5[100U - rtb_Divide_o];
  }

  AutopilotLaws_Chart_h(rtb_Mod1_p, AutopilotLaws_P.Gain_Gain_k * rt_modd(AutopilotLaws_P.Constant3_Value_ip -
    rtb_Mod1_p, AutopilotLaws_P.Constant3_Value_ip), rtb_Compare_h != rtb_Divide_g, &rtb_out,
                        &AutopilotLaws_DWork.sf_Chart_i);
  rtb_out_kk = AutopilotLaws_P.Gain_Gain_nu * AutopilotLaws_U.in.data.flight_guidance_xtk_nmi;
  if (rtb_out_kk > AutopilotLaws_P.Saturation_UpperSat_k) {
    rtb_out_kk = AutopilotLaws_P.Saturation_UpperSat_k;
  } else {
    if (rtb_out_kk < AutopilotLaws_P.Saturation_LowerSat_p) {
      rtb_out_kk = AutopilotLaws_P.Saturation_LowerSat_p;
    }
  }

  rtb_Mod1_p = rt_modd((rt_modd(rt_modd((AutopilotLaws_P.Gain2_Gain_f * AutopilotLaws_U.in.data.flight_guidance_tae_deg
    + rtb_out_kk) * AutopilotLaws_P.Gain1_Gain_nh + AutopilotLaws_U.in.data.Psi_magnetic_track_deg,
    AutopilotLaws_P.Constant3_Value_d1) + AutopilotLaws_P.Constant3_Value_d1, AutopilotLaws_P.Constant3_Value_d1) -
                        (AutopilotLaws_U.in.data.Psi_magnetic_track_deg + AutopilotLaws_P.Constant3_Value_kw)) +
                       AutopilotLaws_P.Constant3_Value_kw, AutopilotLaws_P.Constant3_Value_kw);
  AutopilotLaws_Chart(rtb_Mod1_p, AutopilotLaws_P.Gain_Gain_h * rt_modd(AutopilotLaws_P.Constant3_Value_kw - rtb_Mod1_p,
    AutopilotLaws_P.Constant3_Value_kw), AutopilotLaws_P.Constant_Value_c, &rtb_out_g, &AutopilotLaws_DWork.sf_Chart);
  rtb_Mod1_m = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_track_deg - (rt_modd(rt_modd(rtb_Mod1_m,
    AutopilotLaws_P.Constant3_Value_fb) + AutopilotLaws_P.Constant3_Value_fb, AutopilotLaws_P.Constant3_Value_fb) +
    AutopilotLaws_P.Constant3_Value_c)) + AutopilotLaws_P.Constant3_Value_c, AutopilotLaws_P.Constant3_Value_c);
  rtb_Mod1_p = rt_modd(AutopilotLaws_P.Constant3_Value_c - rtb_Mod1_m, AutopilotLaws_P.Constant3_Value_c);
  if (AutopilotLaws_U.in.data.nav_dme_nmi > AutopilotLaws_P.Saturation_UpperSat_m) {
    rtb_out_kk = AutopilotLaws_P.Saturation_UpperSat_m;
  } else if (AutopilotLaws_U.in.data.nav_dme_nmi < AutopilotLaws_P.Saturation_LowerSat_k) {
    rtb_out_kk = AutopilotLaws_P.Saturation_LowerSat_k;
  } else {
    rtb_out_kk = AutopilotLaws_U.in.data.nav_dme_nmi;
  }

  rtb_out_kk = std::sin(AutopilotLaws_P.Gain1_Gain_j * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_out_kk *
    look1_binlxpw(AutopilotLaws_U.in.data.nav_dme_nmi, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_ah,
                  AutopilotLaws_P.ScheduledGain_Table_p, 4U);
  if (rtb_out_kk > AutopilotLaws_P.Saturation1_UpperSat_i) {
    rtb_out_kk = AutopilotLaws_P.Saturation1_UpperSat_i;
  } else {
    if (rtb_out_kk < AutopilotLaws_P.Saturation1_LowerSat_g) {
      rtb_out_kk = AutopilotLaws_P.Saturation1_LowerSat_g;
    }
  }

  if (rtb_Mod1_m < rtb_Mod1_p) {
    rtb_Mod1_m *= AutopilotLaws_P.Gain1_Gain;
  } else {
    rtb_Mod1_m = AutopilotLaws_P.Gain_Gain * rtb_Mod1_p;
  }

  rtb_Mod1_m = rt_modd((rt_modd(rt_modd((rtb_out_kk + rtb_Mod1_m) * AutopilotLaws_P.Gain3_Gain +
    AutopilotLaws_U.in.data.Psi_magnetic_track_deg, AutopilotLaws_P.Constant3_Value_o) +
    AutopilotLaws_P.Constant3_Value_o, AutopilotLaws_P.Constant3_Value_o) -
                        (AutopilotLaws_U.in.data.Psi_magnetic_track_deg + AutopilotLaws_P.Constant3_Value_p)) +
                       AutopilotLaws_P.Constant3_Value_p, AutopilotLaws_P.Constant3_Value_p);
  AutopilotLaws_Chart(rtb_Mod1_m, AutopilotLaws_P.Gain_Gain_ij * rt_modd(AutopilotLaws_P.Constant3_Value_p - rtb_Mod1_m,
    AutopilotLaws_P.Constant3_Value_p), AutopilotLaws_P.Constant_Value_e, &rtb_out_kk, &AutopilotLaws_DWork.sf_Chart_p);
  rtb_Mod1_m = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain * AutopilotLaws_U.in.data.nav_loc_error_deg;
  rtb_Mod1_p = (rtb_Mod1_m - AutopilotLaws_DWork.Delay_DSTATE_e) / AutopilotLaws_U.in.time.dt *
    AutopilotLaws_P.Gain3_Gain_i + AutopilotLaws_U.in.data.nav_loc_error_deg;
  rtb_Divide_epe = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1;
  rtb_Minup = rtb_Divide_epe + AutopilotLaws_P.Constant_Value_d;
  AutopilotLaws_DWork.Delay1_DSTATE_c = 1.0 / rtb_Minup * (AutopilotLaws_P.Constant_Value_d - rtb_Divide_epe) *
    AutopilotLaws_DWork.Delay1_DSTATE_c + (rtb_Mod1_p + AutopilotLaws_DWork.Delay_DSTATE_o) * (rtb_Divide_epe /
    rtb_Minup);
  rtb_Divide_epe = rt_modd((rt_modd(rt_modd(AutopilotLaws_DWork.Delay1_DSTATE_c * look1_binlxpw
    (AutopilotLaws_U.in.data.H_radio_ft, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_e,
     AutopilotLaws_P.ScheduledGain_Table_pf, 4U) + AutopilotLaws_U.in.data.Psi_magnetic_track_deg,
    AutopilotLaws_P.Constant3_Value_pi) + AutopilotLaws_P.Constant3_Value_pi, AutopilotLaws_P.Constant3_Value_pi) -
    (AutopilotLaws_U.in.data.Psi_magnetic_track_deg + AutopilotLaws_P.Constant3_Value_m)) +
    AutopilotLaws_P.Constant3_Value_m, AutopilotLaws_P.Constant3_Value_m);
  AutopilotLaws_Chart(rtb_Divide_epe, AutopilotLaws_P.Gain_Gain_ma * rt_modd(AutopilotLaws_P.Constant3_Value_m -
    rtb_Divide_epe, AutopilotLaws_P.Constant3_Value_m), AutopilotLaws_P.Constant_Value_p, &rtb_Minup,
                      &AutopilotLaws_DWork.sf_Chart_c);
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_Divide_epe = rtb_GainTheta1;
    break;

   case 1:
    rtb_Divide_epe = rtb_Divide_oz * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_h, AutopilotLaws_P.ScheduledGain_Table_c, 5U);
    break;

   case 2:
    rtb_Divide_epe = rtb_out * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_a, AutopilotLaws_P.ScheduledGain_Table_o, 5U);
    break;

   case 3:
    rtb_Divide_epe = rtb_out_g * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_f, AutopilotLaws_P.ScheduledGain_Table_m, 5U);
    break;

   case 4:
    rtb_Divide_epe = rtb_out_kk * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_g, AutopilotLaws_P.ScheduledGain_Table_e, 5U);
    break;

   case 5:
    rtb_Divide_epe = rtb_Minup * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_ft, AutopilotLaws_P.ScheduledGain_Table_ec, 5U);
    break;

   default:
    rtb_Divide_epe = AutopilotLaws_P.Constant3_Value;
    break;
  }

  if (rtb_Divide_epe > rtb_Mod2) {
    rtb_Divide_epe = rtb_Mod2;
  } else {
    rtb_ManualSwitch = AutopilotLaws_P.Gain1_Gain_l * rtb_Mod2;
    if (rtb_Divide_epe < rtb_ManualSwitch) {
      rtb_Divide_epe = rtb_ManualSwitch;
    }
  }

  if ((AutopilotLaws_U.in.input.enabled_AP1 == 0.0) && (AutopilotLaws_U.in.input.enabled_AP2 == 0.0)) {
    AutopilotLaws_DWork.icLoad = 1U;
  }

  if (AutopilotLaws_DWork.icLoad != 0) {
    AutopilotLaws_DWork.Delay_DSTATE_hc = rtb_GainTheta1;
  }

  rtb_out_kk = rtb_Divide_epe - AutopilotLaws_DWork.Delay_DSTATE_hc;
  rtb_Y = AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (rtb_out_kk < rtb_Y) {
    rtb_Y = rtb_out_kk;
  }

  rtb_out_kk = AutopilotLaws_P.Gain1_Gain_k * AutopilotLaws_P.Constant2_Value_h * AutopilotLaws_U.in.time.dt;
  if (rtb_Y > rtb_out_kk) {
    rtb_out_kk = rtb_Y;
  }

  AutopilotLaws_DWork.Delay_DSTATE_hc += rtb_out_kk;
  rtb_Y = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1_l;
  rtb_Minup = rtb_Y + AutopilotLaws_P.Constant_Value_g;
  AutopilotLaws_DWork.Delay1_DSTATE_h = 1.0 / rtb_Minup * (AutopilotLaws_P.Constant_Value_g - rtb_Y) *
    AutopilotLaws_DWork.Delay1_DSTATE_h + (AutopilotLaws_DWork.Delay_DSTATE_hc + AutopilotLaws_DWork.Delay_DSTATE_j) *
    (rtb_Y / rtb_Minup);
  rtb_out_kk = static_cast<real_T>(rtb_BusAssignment_output_ap_on) - AutopilotLaws_DWork.Delay_DSTATE_p;
  rtb_Y = AutopilotLaws_P.RateLimiterVariableTs_up * AutopilotLaws_U.in.time.dt;
  if (rtb_out_kk < rtb_Y) {
    rtb_Y = rtb_out_kk;
  }

  rtb_out_kk = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.RateLimiterVariableTs_lo;
  if (rtb_Y > rtb_out_kk) {
    rtb_out_kk = rtb_Y;
  }

  AutopilotLaws_DWork.Delay_DSTATE_p += rtb_out_kk;
  if (AutopilotLaws_DWork.Delay_DSTATE_p > AutopilotLaws_P.Saturation_UpperSat_n) {
    rtb_Sum2_l = AutopilotLaws_P.Saturation_UpperSat_n;
  } else if (AutopilotLaws_DWork.Delay_DSTATE_p < AutopilotLaws_P.Saturation_LowerSat_i) {
    rtb_Sum2_l = AutopilotLaws_P.Saturation_LowerSat_i;
  } else {
    rtb_Sum2_l = AutopilotLaws_DWork.Delay_DSTATE_p;
  }

  rtb_ManualSwitch = AutopilotLaws_DWork.Delay1_DSTATE_h * rtb_Sum2_l;
  rtb_Sum2_l = AutopilotLaws_P.Constant_Value_f - rtb_Sum2_l;
  rtb_Sum2_l *= rtb_GainTheta1;
  AutopilotLaws_Y.out.output.autopilot.Phi_c_deg = rtb_ManualSwitch + rtb_Sum2_l;
  AutopilotLaws_Y.out.output.flight_director.Beta_c_deg = rtb_out_o;
  AutopilotLaws_Y.out.output.autopilot.Beta_c_deg = rtb_out_o;
  AutopilotLaws_Y.out.output.flight_director.Phi_c_deg = rtb_Divide_epe;
  if (AutopilotLaws_P.Constant1_Value_h > AutopilotLaws_P.Switch_Threshold_l) {
    rtb_Sum2_l = (AutopilotLaws_U.in.input.V_c_kn - AutopilotLaws_U.in.data.V_ias_kn) * AutopilotLaws_P.Gain1_Gain_b;
    if (rtb_Sum2_l > AutopilotLaws_P.Saturation1_UpperSat) {
      rtb_Sum2_l = AutopilotLaws_P.Saturation1_UpperSat;
    } else {
      if (rtb_Sum2_l < AutopilotLaws_P.Saturation1_LowerSat) {
        rtb_Sum2_l = AutopilotLaws_P.Saturation1_LowerSat;
      }
    }
  } else {
    rtb_Sum2_l = AutopilotLaws_P.Constant1_Value_h;
  }

  if (AutopilotLaws_P.ManualSwitch_CurrentSetting_b == 1) {
    rtb_Minup = AutopilotLaws_P.Constant_Value_m;
  } else {
    rtb_Minup = AutopilotLaws_U.in.input.vertical_law;
  }

  if (rtb_Minup != AutopilotLaws_P.CompareToConstant5_const_e) {
    AutopilotLaws_B.u = (AutopilotLaws_U.in.input.H_c_ft + AutopilotLaws_U.in.data.H_ft) -
      AutopilotLaws_U.in.data.H_ind_ft;
  }

  rtb_ManualSwitch = AutopilotLaws_B.u - AutopilotLaws_U.in.data.H_ft;
  rtb_Y = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1_a;
  rtb_Divide_epe = rtb_Y + AutopilotLaws_P.Constant_Value_ge;
  AutopilotLaws_DWork.Delay1_DSTATE_d = 1.0 / rtb_Divide_epe * (AutopilotLaws_P.Constant_Value_ge - rtb_Y) *
    AutopilotLaws_DWork.Delay1_DSTATE_d + (rtb_ManualSwitch + AutopilotLaws_DWork.Delay_DSTATE_ps) * (rtb_Y /
    rtb_Divide_epe);
  rtb_Sum2_l += AutopilotLaws_P.Gain_Gain_ft * AutopilotLaws_DWork.Delay1_DSTATE_d;
  if (rtb_Sum2_l > AutopilotLaws_P.Saturation_UpperSat_nu) {
    rtb_Sum2_l = AutopilotLaws_P.Saturation_UpperSat_nu;
  } else {
    if (rtb_Sum2_l < AutopilotLaws_P.Saturation_LowerSat_d) {
      rtb_Sum2_l = AutopilotLaws_P.Saturation_LowerSat_d;
    }
  }

  rtb_Sum2_l -= AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_out_kk = AutopilotLaws_P.kntoms_Gain * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_out_kk > AutopilotLaws_P.Saturation_UpperSat_e) {
    rtb_out_kk = AutopilotLaws_P.Saturation_UpperSat_e;
  } else {
    if (rtb_out_kk < AutopilotLaws_P.Saturation_LowerSat_oc) {
      rtb_out_kk = AutopilotLaws_P.Saturation_LowerSat_oc;
    }
  }

  rtb_out_kk = AutopilotLaws_P.ftmintoms_Gain * rtb_Sum2_l / rtb_out_kk;
  if (rtb_out_kk > 1.0) {
    rtb_out_kk = 1.0;
  } else {
    if (rtb_out_kk < -1.0) {
      rtb_out_kk = -1.0;
    }
  }

  rtb_Gain_f5 = AutopilotLaws_P.Gain_Gain_di * std::asin(rtb_out_kk);
  rtb_Y = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter1_C1_a;
  rtb_Divide_epe = rtb_Y + AutopilotLaws_P.Constant_Value_j;
  AutopilotLaws_DWork.Delay1_DSTATE_m = 1.0 / rtb_Divide_epe * (AutopilotLaws_P.Constant_Value_j - rtb_Y) *
    AutopilotLaws_DWork.Delay1_DSTATE_m + (AutopilotLaws_U.in.data.nav_gs_error_deg + AutopilotLaws_DWork.Delay_DSTATE_i)
    * (rtb_Y / rtb_Divide_epe);
  rtb_Mod2 = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain_l * AutopilotLaws_DWork.Delay1_DSTATE_m;
  rtb_Divide_oz = (rtb_Mod2 - AutopilotLaws_DWork.Delay_DSTATE_g) / AutopilotLaws_U.in.time.dt *
    AutopilotLaws_P.Gain3_Gain_o + AutopilotLaws_DWork.Delay1_DSTATE_m;
  rtb_Sum2_l = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1_n;
  rtb_Y = rtb_Sum2_l + AutopilotLaws_P.Constant_Value_fh;
  AutopilotLaws_DWork.Delay1_DSTATE_l = 1.0 / rtb_Y * (AutopilotLaws_P.Constant_Value_fh - rtb_Sum2_l) *
    AutopilotLaws_DWork.Delay1_DSTATE_l + (rtb_Divide_oz + AutopilotLaws_DWork.Delay_DSTATE_l) * (rtb_Sum2_l / rtb_Y);
  rtb_out_o = rtb_GainTheta - std::cos(AutopilotLaws_P.Gain1_Gain_bx * rtb_GainTheta1) *
    AutopilotLaws_U.in.data.alpha_deg;
  if ((AutopilotLaws_U.in.data.H_radio_ft > AutopilotLaws_P.CompareToConstant_const_n) &&
      AutopilotLaws_U.in.data.nav_gs_valid) {
    rtb_out_kk = AutopilotLaws_DWork.Delay1_DSTATE_l * look1_binlxpw(AutopilotLaws_U.in.data.H_radio_ft,
      AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_hy, AutopilotLaws_P.ScheduledGain_Table_i, 4U);
  } else {
    rtb_out_kk = (AutopilotLaws_P.Constant3_Value_d - rtb_out_o) * AutopilotLaws_P.Gain2_Gain;
  }

  AutopilotLaws_Voter1(rtb_out_kk, AutopilotLaws_P.Gain1_Gain_nq * (AutopilotLaws_P.Constant1_Value_n - rtb_out_o),
                       AutopilotLaws_P.Gain_Gain_p * (AutopilotLaws_P.Constant2_Value_n - rtb_out_o), &rtb_Y_j);
  rtb_Sum_ba_tmp = AutopilotLaws_U.in.input.H_c_ft - AutopilotLaws_U.in.data.H_ind_ft;
  rtb_out_kk = AutopilotLaws_P.kntoms_Gain_e * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_Sum_ba_tmp < 0.0) {
    rtb_out_o = -1.0;
  } else if (rtb_Sum_ba_tmp > 0.0) {
    rtb_out_o = 1.0;
  } else {
    rtb_out_o = rtb_Sum_ba_tmp;
  }

  if (rtb_out_kk > AutopilotLaws_P.Saturation_UpperSat_l) {
    rtb_out_kk = AutopilotLaws_P.Saturation_UpperSat_l;
  } else {
    if (rtb_out_kk < AutopilotLaws_P.Saturation_LowerSat_b) {
      rtb_out_kk = AutopilotLaws_P.Saturation_LowerSat_b;
    }
  }

  rtb_out_kk = ((AutopilotLaws_P.Constant_Value_b * rtb_out_o + rtb_Sum_ba_tmp) * AutopilotLaws_P.Gain_Gain_el -
                AutopilotLaws_U.in.data.H_dot_ft_min) * AutopilotLaws_P.ftmintoms_Gain_c / rtb_out_kk;
  if (rtb_out_kk > 1.0) {
    rtb_out_kk = 1.0;
  } else {
    if (rtb_out_kk < -1.0) {
      rtb_out_kk = -1.0;
    }
  }

  rtb_Gain_mn = AutopilotLaws_P.Gain_Gain_g * std::asin(rtb_out_kk);
  rtb_Sum2_l = AutopilotLaws_P.Gain1_Gain_d * AutopilotLaws_U.in.data.alpha_deg;
  rtb_Y = AutopilotLaws_U.in.data.bz_m_s2 * std::sin(rtb_Sum2_l);
  rtb_Sum2_l = std::cos(rtb_Sum2_l);
  rtb_Sum2_l *= AutopilotLaws_U.in.data.bx_m_s2;
  rtb_Sum2_ho = AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.input.V_c_kn;
  rtb_out_kk = rtb_Sum2_ho * AutopilotLaws_P.Gain1_Gain_h;
  if (rtb_out_kk > AutopilotLaws_P.Saturation_UpperSat_j) {
    rtb_out_kk = AutopilotLaws_P.Saturation_UpperSat_j;
  } else {
    if (rtb_out_kk < AutopilotLaws_P.Saturation_LowerSat_bb) {
      rtb_out_kk = AutopilotLaws_P.Saturation_LowerSat_bb;
    }
  }

  rtb_Sum2_d = (rtb_Y + rtb_Sum2_l) * AutopilotLaws_P.Gain_Gain_pg * AutopilotLaws_P.Gain_Gain_g5 + rtb_out_kk;
  rtb_out_kk = AutopilotLaws_P.kntoms_Gain_i * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_out_kk > AutopilotLaws_P.Saturation_UpperSat_kz) {
    rtb_out_kk = AutopilotLaws_P.Saturation_UpperSat_kz;
  } else {
    if (rtb_out_kk < AutopilotLaws_P.Saturation_LowerSat_iz) {
      rtb_out_kk = AutopilotLaws_P.Saturation_LowerSat_iz;
    }
  }

  rtb_out_kk = (AutopilotLaws_P.Constant_Value_k - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_i / rtb_out_kk;
  if (rtb_out_kk > 1.0) {
    rtb_out_kk = 1.0;
  } else {
    if (rtb_out_kk < -1.0) {
      rtb_out_kk = -1.0;
    }
  }

  rtb_Gain_hxe = AutopilotLaws_P.Gain_Gain_bej * std::asin(rtb_out_kk);
  rtb_out_kk = AutopilotLaws_P.kntoms_Gain_a * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_out_kk > AutopilotLaws_P.Saturation_UpperSat_oi) {
    rtb_out_kk = AutopilotLaws_P.Saturation_UpperSat_oi;
  } else {
    if (rtb_out_kk < AutopilotLaws_P.Saturation_LowerSat_e) {
      rtb_out_kk = AutopilotLaws_P.Saturation_LowerSat_e;
    }
  }

  rtb_out_kk = (AutopilotLaws_U.in.input.H_dot_c_fpm - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_f / rtb_out_kk;
  if (rtb_out_kk > 1.0) {
    rtb_out_kk = 1.0;
  } else {
    if (rtb_out_kk < -1.0) {
      rtb_out_kk = -1.0;
    }
  }

  rtb_Gain_fz = AutopilotLaws_P.Gain_Gain_ed * std::asin(rtb_out_kk);
  rtb_Sum_l1 = AutopilotLaws_U.in.input.FPA_c_deg - (rtb_GainTheta - std::cos(AutopilotLaws_P.Gain1_Gain_c *
    rtb_GainTheta1) * AutopilotLaws_U.in.data.alpha_deg);
  rtb_Gain4 = (rtb_GainTheta - AutopilotLaws_P.Constant2_Value_f) * AutopilotLaws_P.Gain4_Gain;
  rtb_Y = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.WashoutFilter_C1;
  rtb_Divide_epe = rtb_Y + AutopilotLaws_P.Constant_Value_gb;
  rtb_out_o = AutopilotLaws_P.Constant_Value_gb / rtb_Divide_epe;
  rtb_out_kk = AutopilotLaws_DWork.Delay_DSTATE_lh * rtb_out_o;
  rtb_out_o *= AutopilotLaws_U.in.data.H_ind_ft;
  AutopilotLaws_DWork.Delay1_DSTATE_k = 1.0 / rtb_Divide_epe * (AutopilotLaws_P.Constant_Value_gb - rtb_Y) *
    AutopilotLaws_DWork.Delay1_DSTATE_k + (rtb_out_o - rtb_out_kk);
  rtb_Y = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1_g;
  rtb_Divide_epe = rtb_Y + AutopilotLaws_P.Constant_Value_a;
  AutopilotLaws_DWork.Delay1_DSTATE_g = 1.0 / rtb_Divide_epe * (AutopilotLaws_P.Constant_Value_a - rtb_Y) *
    AutopilotLaws_DWork.Delay1_DSTATE_g + (AutopilotLaws_U.in.data.H_radio_ft + AutopilotLaws_DWork.Delay_DSTATE_hi) *
    (rtb_Y / rtb_Divide_epe);
  rtb_out = (AutopilotLaws_DWork.Delay1_DSTATE_k + AutopilotLaws_DWork.Delay1_DSTATE_g) *
    AutopilotLaws_P.DiscreteDerivativeVariableTs2_Gain;
  rtb_out_g = (rtb_out - AutopilotLaws_DWork.Delay_DSTATE_a) / AutopilotLaws_U.in.time.dt * AutopilotLaws_P.Gain2_Gain_a;
  rtb_Sum2_l = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter3_C1;
  rtb_Y = rtb_Sum2_l + AutopilotLaws_P.Constant_Value_f2;
  AutopilotLaws_DWork.Delay1_DSTATE_b = 1.0 / rtb_Y * (AutopilotLaws_P.Constant_Value_f2 - rtb_Sum2_l) *
    AutopilotLaws_DWork.Delay1_DSTATE_b + (rtb_out_g + AutopilotLaws_DWork.Delay_DSTATE_m) * (rtb_Sum2_l / rtb_Y);
  rtb_Y = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.WashoutFilter1_C1;
  rtb_Divide_epe = rtb_Y + AutopilotLaws_P.Constant_Value_ff;
  rtb_out_o = AutopilotLaws_P.Constant_Value_ff / rtb_Divide_epe;
  rtb_out_kk = AutopilotLaws_DWork.Delay_DSTATE_mu * rtb_out_o;
  rtb_out_o *= AutopilotLaws_U.in.data.H_dot_ft_min;
  AutopilotLaws_DWork.Delay1_DSTATE_ds = 1.0 / rtb_Divide_epe * (AutopilotLaws_P.Constant_Value_ff - rtb_Y) *
    AutopilotLaws_DWork.Delay1_DSTATE_ds + (rtb_out_o - rtb_out_kk);
  rtb_Y = AutopilotLaws_P.Gain_Gain_k0 * AutopilotLaws_U.in.data.H_radio_ft;
  rtb_out_kk = AutopilotLaws_P.kntoms_Gain_av * AutopilotLaws_U.in.data.V_tas_kn;
  if (AutopilotLaws_P.Constant1_Value_d < rtb_Y) {
    rtb_Y = AutopilotLaws_P.Constant1_Value_d;
  }

  if (rtb_out_kk > AutopilotLaws_P.Saturation_UpperSat_jd) {
    rtb_out_kk = AutopilotLaws_P.Saturation_UpperSat_jd;
  } else {
    if (rtb_out_kk < AutopilotLaws_P.Saturation_LowerSat_g) {
      rtb_out_kk = AutopilotLaws_P.Saturation_LowerSat_g;
    }
  }

  rtb_out_kk = (rtb_Y - (AutopilotLaws_DWork.Delay1_DSTATE_b + AutopilotLaws_DWork.Delay1_DSTATE_ds)) *
    AutopilotLaws_P.ftmintoms_Gain_fd / rtb_out_kk;
  if (rtb_out_kk > 1.0) {
    rtb_out_kk = 1.0;
  } else {
    if (rtb_out_kk < -1.0) {
      rtb_out_kk = -1.0;
    }
  }

  rtb_out_o = AutopilotLaws_P.Gain_Gain_p3 * std::asin(rtb_out_kk);
  rtb_Divide_epe = AutopilotLaws_P.Constant1_Value_dg - rtb_GainTheta;
  rtb_Sum2_l = AutopilotLaws_P.Gain1_Gain_ib * AutopilotLaws_U.in.data.alpha_deg;
  rtb_Y = AutopilotLaws_U.in.data.bz_m_s2 * std::sin(rtb_Sum2_l);
  rtb_Sum2_l = std::cos(rtb_Sum2_l);
  rtb_Sum2_l *= AutopilotLaws_U.in.data.bx_m_s2;
  rtb_out_kk = rtb_Sum2_ho * AutopilotLaws_P.Gain1_Gain_fr;
  if (rtb_out_kk > AutopilotLaws_P.Saturation_UpperSat_e3) {
    rtb_out_kk = AutopilotLaws_P.Saturation_UpperSat_e3;
  } else {
    if (rtb_out_kk < AutopilotLaws_P.Saturation_LowerSat_py) {
      rtb_out_kk = AutopilotLaws_P.Saturation_LowerSat_py;
    }
  }

  rtb_Sum2_ho = (rtb_Y + rtb_Sum2_l) * AutopilotLaws_P.Gain_Gain_ga * AutopilotLaws_P.Gain_Gain_i2 + rtb_out_kk;
  rtb_out_kk = AutopilotLaws_P.kntoms_Gain_f * AutopilotLaws_U.in.data.V_tas_kn;
  if (rtb_out_kk > AutopilotLaws_P.Saturation_UpperSat_a) {
    rtb_out_kk = AutopilotLaws_P.Saturation_UpperSat_a;
  } else {
    if (rtb_out_kk < AutopilotLaws_P.Saturation_LowerSat_a) {
      rtb_out_kk = AutopilotLaws_P.Saturation_LowerSat_a;
    }
  }

  rtb_out_kk = (AutopilotLaws_P.Constant_Value_i - AutopilotLaws_U.in.data.H_dot_ft_min) *
    AutopilotLaws_P.ftmintoms_Gain_m / rtb_out_kk;
  if (rtb_out_kk > 1.0) {
    rtb_out_kk = 1.0;
  } else {
    if (rtb_out_kk < -1.0) {
      rtb_out_kk = -1.0;
    }
  }

  rtb_Gain_mk = AutopilotLaws_P.Gain_Gain_hn * std::asin(rtb_out_kk);
  AutopilotLaws_Voter1(rtb_Divide_epe, AutopilotLaws_P.Gain_Gain_b2 * rtb_Sum2_ho, AutopilotLaws_P.VS_Gain_c *
                       rtb_Gain_mk, &rtb_Sum2_l);
  switch (static_cast<int32_T>(rtb_Minup)) {
   case 0:
    rtb_Sum2_l = rtb_GainTheta;
    break;

   case 1:
    rtb_Sum2_l = AutopilotLaws_P.VS_Gain * rtb_Gain_f5;
    break;

   case 2:
    rtb_Sum2_l = AutopilotLaws_P.VS_Gain_a * rtb_Gain_mn;
    break;

   case 3:
    if (rtb_Sum_ba_tmp > AutopilotLaws_P.Switch_Threshold_n) {
      rtb_out_kk = AutopilotLaws_P.Gain_Gain_kg * rtb_Sum2_d;
      rtb_Sum2_l = AutopilotLaws_P.VS_Gain_j * rtb_Gain_hxe;
      if (rtb_out_kk > rtb_Sum2_l) {
        rtb_Sum2_l = rtb_out_kk;
      }
    } else {
      rtb_out_kk = AutopilotLaws_P.Gain_Gain_kg * rtb_Sum2_d;
      rtb_Sum2_l = AutopilotLaws_P.VS_Gain_j * rtb_Gain_hxe;
      if (rtb_out_kk < rtb_Sum2_l) {
        rtb_Sum2_l = rtb_out_kk;
      }
    }
    break;

   case 4:
    rtb_Sum2_l = AutopilotLaws_P.VS_Gain_h * rtb_Gain_fz;
    break;

   case 5:
    rtb_Sum2_l = AutopilotLaws_P.Gain_Gain_c * rtb_Sum_l1;
    break;

   case 6:
    rtb_Sum2_l = rtb_Y_j;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch_Threshold) {
      rtb_Sum2_l = rtb_Gain4;
    } else {
      rtb_Sum2_l = AutopilotLaws_P.VS_Gain_e * rtb_out_o;
    }
    break;
  }

  rtb_Sum2_l += rtb_GainTheta;
  if (rtb_Sum2_l > AutopilotLaws_P.Constant1_Value_i) {
    rtb_Sum2_l = AutopilotLaws_P.Constant1_Value_i;
  } else {
    rtb_out_kk = AutopilotLaws_P.Gain1_Gain_m * AutopilotLaws_P.Constant1_Value_i;
    if (rtb_Sum2_l < rtb_out_kk) {
      rtb_Sum2_l = rtb_out_kk;
    }
  }

  if (rtb_BusAssignment_output_ap_on == 0) {
    AutopilotLaws_DWork.icLoad_f = 1U;
  }

  if (AutopilotLaws_DWork.icLoad_f != 0) {
    AutopilotLaws_DWork.Delay_DSTATE_h2 = rtb_GainTheta;
  }

  rtb_Sum2_l -= AutopilotLaws_DWork.Delay_DSTATE_h2;
  rtb_Y = AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (rtb_Sum2_l >= rtb_Y) {
    rtb_Sum2_l = rtb_Y;
  }

  rtb_Y = AutopilotLaws_P.Gain1_Gain_i0 * AutopilotLaws_P.Constant2_Value_h1 * AutopilotLaws_U.in.time.dt;
  if (rtb_Sum2_l > rtb_Y) {
    rtb_Y = rtb_Sum2_l;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h2 += rtb_Y;
  rtb_Sum2_l = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.LagFilter_C1_i;
  rtb_Y = rtb_Sum2_l + AutopilotLaws_P.Constant_Value_dd;
  AutopilotLaws_DWork.Delay1_DSTATE_p = 1.0 / rtb_Y * (AutopilotLaws_P.Constant_Value_dd - rtb_Sum2_l) *
    AutopilotLaws_DWork.Delay1_DSTATE_p + (AutopilotLaws_DWork.Delay_DSTATE_h2 + AutopilotLaws_DWork.Delay_DSTATE_d) *
    (rtb_Sum2_l / rtb_Y);
  rtb_out_kk = static_cast<real_T>(rtb_BusAssignment_output_ap_on) - AutopilotLaws_DWork.Delay_DSTATE_on;
  rtb_Y = AutopilotLaws_P.RateLimiterVariableTs_up_i * AutopilotLaws_U.in.time.dt;
  if (rtb_out_kk < rtb_Y) {
    rtb_Y = rtb_out_kk;
  }

  rtb_out_kk = AutopilotLaws_U.in.time.dt * AutopilotLaws_P.RateLimiterVariableTs_lo_o;
  if (rtb_Y > rtb_out_kk) {
    rtb_out_kk = rtb_Y;
  }

  AutopilotLaws_DWork.Delay_DSTATE_on += rtb_out_kk;
  if (AutopilotLaws_DWork.Delay_DSTATE_on > AutopilotLaws_P.Saturation_UpperSat_d) {
    rtb_Sum2_l = AutopilotLaws_P.Saturation_UpperSat_d;
  } else if (AutopilotLaws_DWork.Delay_DSTATE_on < AutopilotLaws_P.Saturation_LowerSat_f) {
    rtb_Sum2_l = AutopilotLaws_P.Saturation_LowerSat_f;
  } else {
    rtb_Sum2_l = AutopilotLaws_DWork.Delay_DSTATE_on;
  }

  rtb_out_kk = AutopilotLaws_DWork.Delay1_DSTATE_p * rtb_Sum2_l;
  rtb_Sum2_l = AutopilotLaws_P.Constant_Value_h - rtb_Sum2_l;
  rtb_Sum2_l *= rtb_GainTheta;
  AutopilotLaws_Y.out.output.autopilot.Theta_c_deg = rtb_out_kk + rtb_Sum2_l;
  AutopilotLaws_Voter1(rtb_Divide_epe, rtb_Sum2_ho, rtb_Gain_mk, &rtb_Y);
  switch (static_cast<int32_T>(rtb_Minup)) {
   case 0:
    rtb_Y = rtb_GainTheta;
    break;

   case 1:
    rtb_Y = rtb_Gain_f5;
    break;

   case 2:
    rtb_Y = rtb_Gain_mn;
    break;

   case 3:
    if (rtb_Sum_ba_tmp > AutopilotLaws_P.Switch_Threshold_k) {
      if (rtb_Sum2_d > rtb_Gain_hxe) {
        rtb_Y = rtb_Sum2_d;
      } else {
        rtb_Y = rtb_Gain_hxe;
      }
    } else if (rtb_Sum2_d < rtb_Gain_hxe) {
      rtb_Y = rtb_Sum2_d;
    } else {
      rtb_Y = rtb_Gain_hxe;
    }
    break;

   case 4:
    rtb_Y = rtb_Gain_fz;
    break;

   case 5:
    rtb_Y = rtb_Sum_l1;
    break;

   case 6:
    rtb_Y = rtb_Y_j;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch1_Threshold) {
      rtb_Y = AutopilotLaws_P.Gain2_Gain_h * rtb_Gain4;
    } else {
      rtb_Y = rtb_out_o;
    }
    break;
  }

  rtb_out_o = rtb_Y + rtb_GainTheta;
  if (rtb_out_o > AutopilotLaws_P.Constant1_Value_i) {
    AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = AutopilotLaws_P.Constant1_Value_i;
  } else {
    rtb_out_kk = AutopilotLaws_P.Gain1_Gain_n * AutopilotLaws_P.Constant1_Value_i;
    if (rtb_out_o < rtb_out_kk) {
      AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = rtb_out_kk;
    } else {
      AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = rtb_out_o;
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
  AutopilotLaws_Y.out.data.bx_m_s2 = AutopilotLaws_U.in.data.bx_m_s2;
  AutopilotLaws_Y.out.data.by_m_s2 = AutopilotLaws_U.in.data.by_m_s2;
  AutopilotLaws_Y.out.data.bz_m_s2 = AutopilotLaws_U.in.data.bz_m_s2;
  AutopilotLaws_Y.out.data.nav_valid = AutopilotLaws_U.in.data.nav_valid;
  AutopilotLaws_Y.out.data.nav_loc_deg = AutopilotLaws_U.in.data.nav_loc_deg;
  AutopilotLaws_Y.out.data.nav_dme_valid = AutopilotLaws_U.in.data.nav_dme_valid;
  AutopilotLaws_Y.out.data.nav_dme_nmi = AutopilotLaws_U.in.data.nav_dme_nmi;
  AutopilotLaws_Y.out.data.nav_loc_valid = AutopilotLaws_U.in.data.nav_loc_valid;
  AutopilotLaws_Y.out.data.nav_loc_error_deg = AutopilotLaws_U.in.data.nav_loc_error_deg;
  AutopilotLaws_Y.out.data.nav_gs_valid = AutopilotLaws_U.in.data.nav_gs_valid;
  AutopilotLaws_Y.out.data.nav_gs_error_deg = AutopilotLaws_U.in.data.nav_gs_error_deg;
  AutopilotLaws_Y.out.data.flight_guidance_xtk_nmi = AutopilotLaws_U.in.data.flight_guidance_xtk_nmi;
  AutopilotLaws_Y.out.data.flight_guidance_tae_deg = AutopilotLaws_U.in.data.flight_guidance_tae_deg;
  AutopilotLaws_Y.out.data.flight_phase = AutopilotLaws_U.in.data.flight_phase;
  AutopilotLaws_Y.out.data.V2_kn = AutopilotLaws_U.in.data.V2_kn;
  AutopilotLaws_Y.out.data.VAPP_kn = AutopilotLaws_U.in.data.VAPP_kn;
  AutopilotLaws_Y.out.data.VLS_kn = AutopilotLaws_U.in.data.VLS_kn;
  AutopilotLaws_Y.out.data.is_flight_plan_available = AutopilotLaws_U.in.data.is_flight_plan_available;
  AutopilotLaws_Y.out.data.altitude_constraint_ft = AutopilotLaws_U.in.data.altitude_constraint_ft;
  AutopilotLaws_Y.out.data.thrust_reduction_altitude = AutopilotLaws_U.in.data.thrust_reduction_altitude;
  AutopilotLaws_Y.out.data.thrust_reduction_altitude_go_around =
    AutopilotLaws_U.in.data.thrust_reduction_altitude_go_around;
  AutopilotLaws_Y.out.data.acceleration_altitude = AutopilotLaws_U.in.data.acceleration_altitude;
  AutopilotLaws_Y.out.data.acceleration_altitude_engine_out = AutopilotLaws_U.in.data.acceleration_altitude_engine_out;
  AutopilotLaws_Y.out.data.acceleration_altitude_go_around = AutopilotLaws_U.in.data.acceleration_altitude_go_around;
  AutopilotLaws_Y.out.data.cruise_altitude = AutopilotLaws_U.in.data.cruise_altitude;
  AutopilotLaws_Y.out.data.on_ground = rtb_on_ground;
  AutopilotLaws_Y.out.data.zeta_deg = rtb_Saturation;
  AutopilotLaws_Y.out.data.throttle_lever_1_pos = AutopilotLaws_U.in.data.throttle_lever_1_pos;
  AutopilotLaws_Y.out.data.throttle_lever_2_pos = AutopilotLaws_U.in.data.throttle_lever_2_pos;
  AutopilotLaws_Y.out.data.flaps_handle_index = AutopilotLaws_U.in.data.flaps_handle_index;
  AutopilotLaws_Y.out.input = AutopilotLaws_U.in.input;
  AutopilotLaws_Y.out.output.ap_on = rtb_BusAssignment_output_ap_on;
  AutopilotLaws_DWork.Delay_DSTATE = rtb_Saturation1;
  for (rtb_on_ground = 0; rtb_on_ground < 99; rtb_on_ground++) {
    AutopilotLaws_DWork.Delay_DSTATE_lp[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_lp[rtb_on_ground + 1];
    AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground + 1];
  }

  AutopilotLaws_DWork.Delay_DSTATE_lp[99] = rtb_Compare_b;
  AutopilotLaws_DWork.Delay_DSTATE_h5[99] = rtb_Compare_h;
  AutopilotLaws_DWork.Delay_DSTATE_e = rtb_Mod1_m;
  AutopilotLaws_DWork.Delay_DSTATE_o = rtb_Mod1_p;
  AutopilotLaws_DWork.icLoad = 0U;
  AutopilotLaws_DWork.Delay_DSTATE_j = AutopilotLaws_DWork.Delay_DSTATE_hc;
  AutopilotLaws_DWork.Delay_DSTATE_ps = rtb_ManualSwitch;
  AutopilotLaws_DWork.Delay_DSTATE_i = AutopilotLaws_U.in.data.nav_gs_error_deg;
  AutopilotLaws_DWork.Delay_DSTATE_g = rtb_Mod2;
  AutopilotLaws_DWork.Delay_DSTATE_l = rtb_Divide_oz;
  AutopilotLaws_DWork.Delay_DSTATE_lh = AutopilotLaws_U.in.data.H_ind_ft;
  AutopilotLaws_DWork.Delay_DSTATE_hi = AutopilotLaws_U.in.data.H_radio_ft;
  AutopilotLaws_DWork.Delay_DSTATE_a = rtb_out;
  AutopilotLaws_DWork.Delay_DSTATE_m = rtb_out_g;
  AutopilotLaws_DWork.Delay_DSTATE_mu = AutopilotLaws_U.in.data.H_dot_ft_min;
  AutopilotLaws_DWork.icLoad_f = 0U;
  AutopilotLaws_DWork.Delay_DSTATE_d = AutopilotLaws_DWork.Delay_DSTATE_h2;
}

void AutopilotLawsModelClass::initialize()
{
  (void) std::memset((static_cast<void *>(&AutopilotLaws_B)), 0,
                     sizeof(BlockIO_AutopilotLaws_T));
  (void) std::memset(static_cast<void *>(&AutopilotLaws_DWork), 0,
                     sizeof(D_Work_AutopilotLaws_T));
  AutopilotLaws_U.in = AutopilotLaws_rtZap_laws_input;
  AutopilotLaws_Y.out = AutopilotLaws_rtZap_laws_output;

  {
    int32_T i;
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.Delay_InitialCondition;
    AutopilotLaws_DWork.Delay1_DSTATE = AutopilotLaws_P.Delay1_InitialCondition;
    AutopilotLaws_DWork.Delay_DSTATE_h = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_lp[i] = AutopilotLaws_P.Delay_InitialCondition_h;
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }

    AutopilotLaws_DWork.Delay_DSTATE_e = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition;
    AutopilotLaws_DWork.Delay_DSTATE_o = AutopilotLaws_P.Delay_InitialCondition_l;
    AutopilotLaws_DWork.Delay1_DSTATE_c = AutopilotLaws_P.Delay1_InitialCondition_f;
    AutopilotLaws_DWork.icLoad = 1U;
    AutopilotLaws_DWork.Delay_DSTATE_j = AutopilotLaws_P.Delay_InitialCondition_f;
    AutopilotLaws_DWork.Delay1_DSTATE_h = AutopilotLaws_P.Delay1_InitialCondition_o;
    AutopilotLaws_DWork.Delay_DSTATE_p = AutopilotLaws_P.RateLimiterVariableTs_InitialCondition;
    AutopilotLaws_DWork.Delay_DSTATE_ps = AutopilotLaws_P.Delay_InitialCondition_fd;
    AutopilotLaws_DWork.Delay1_DSTATE_d = AutopilotLaws_P.Delay1_InitialCondition_l;
    AutopilotLaws_DWork.Delay_DSTATE_i = AutopilotLaws_P.Delay_InitialCondition_o;
    AutopilotLaws_DWork.Delay1_DSTATE_m = AutopilotLaws_P.Delay1_InitialCondition_a;
    AutopilotLaws_DWork.Delay_DSTATE_g = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition_h;
    AutopilotLaws_DWork.Delay_DSTATE_l = AutopilotLaws_P.Delay_InitialCondition_fdr;
    AutopilotLaws_DWork.Delay1_DSTATE_l = AutopilotLaws_P.Delay1_InitialCondition_fx;
    AutopilotLaws_DWork.Delay_DSTATE_lh = AutopilotLaws_P.Delay_InitialCondition_c;
    AutopilotLaws_DWork.Delay1_DSTATE_k = AutopilotLaws_P.Delay1_InitialCondition_i;
    AutopilotLaws_DWork.Delay_DSTATE_hi = AutopilotLaws_P.Delay_InitialCondition_i;
    AutopilotLaws_DWork.Delay1_DSTATE_g = AutopilotLaws_P.Delay1_InitialCondition_e;
    AutopilotLaws_DWork.Delay_DSTATE_a = AutopilotLaws_P.DiscreteDerivativeVariableTs2_InitialCondition;
    AutopilotLaws_DWork.Delay_DSTATE_m = AutopilotLaws_P.Delay_InitialCondition_j;
    AutopilotLaws_DWork.Delay1_DSTATE_b = AutopilotLaws_P.Delay1_InitialCondition_p;
    AutopilotLaws_DWork.Delay_DSTATE_mu = AutopilotLaws_P.Delay_InitialCondition_id;
    AutopilotLaws_DWork.Delay1_DSTATE_ds = AutopilotLaws_P.Delay1_InitialCondition_il;
    AutopilotLaws_DWork.icLoad_f = 1U;
    AutopilotLaws_DWork.Delay_DSTATE_d = AutopilotLaws_P.Delay_InitialCondition_d;
    AutopilotLaws_DWork.Delay1_DSTATE_p = AutopilotLaws_P.Delay1_InitialCondition_m;
    AutopilotLaws_DWork.Delay_DSTATE_on = AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_p;
    AutopilotLaws_DWork.is_active_c5_AutopilotLaws = 0U;
    AutopilotLaws_DWork.is_c5_AutopilotLaws = AutopilotLaws_IN_NO_ACTIVE_CHILD_n;
    AutopilotLaws_Chart_Init(&AutopilotLaws_DWork.sf_Chart_d);
    AutopilotLaws_Chart_Init(&AutopilotLaws_DWork.sf_Chart_ch);
    AutopilotLaws_Chart_j_Init(&AutopilotLaws_DWork.sf_Chart_h);
    AutopilotLaws_Chart_j_Init(&AutopilotLaws_DWork.sf_Chart_i);
    AutopilotLaws_Chart_Init(&AutopilotLaws_DWork.sf_Chart);
    AutopilotLaws_Chart_Init(&AutopilotLaws_DWork.sf_Chart_p);
    AutopilotLaws_Chart_Init(&AutopilotLaws_DWork.sf_Chart_c);
    AutopilotLaws_B.u = AutopilotLaws_P.Y_Y0;
  }
}

void AutopilotLawsModelClass::terminate()
{
}

AutopilotLawsModelClass::AutopilotLawsModelClass()
{
}

AutopilotLawsModelClass::~AutopilotLawsModelClass()
{
}
