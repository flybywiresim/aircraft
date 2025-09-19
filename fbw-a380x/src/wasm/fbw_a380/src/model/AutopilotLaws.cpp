#include "AutopilotLaws.h"
#include "rtwtypes.h"
#include "AutopilotLaws_types.h"
#include <cmath>
#include "rt_modd.h"
#include "look1_binlxpw.h"

const uint8_T AutopilotLaws_IN_any{ 1U };

const uint8_T AutopilotLaws_IN_left{ 2U };

const uint8_T AutopilotLaws_IN_right{ 3U };

const uint8_T AutopilotLaws_IN_any_o{ 1U };

const uint8_T AutopilotLaws_IN_left_b{ 2U };

const uint8_T AutopilotLaws_IN_right_a{ 3U };

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
  boolean_T wasPsiCmdChanged;
  static const int8_T b[5]{ 0, 5, 10, 20, 30 };

  static const int8_T c[5]{ 5, 5, 10, 30, 30 };

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
  if (localDW->is_active_c10_AutopilotLaws == 0) {
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

void AutopilotLawsModelClass::AutopilotLaws_RateLimiter_n(boolean_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_AutopilotLaws_l_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(static_cast<real_T>(rtu_u) - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs
    (rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void AutopilotLawsModelClass::AutopilotLaws_Chart_g_Init(real_T *rty_out)
{
  *rty_out = 0.0;
}

void AutopilotLawsModelClass::AutopilotLaws_Chart_h(real_T rtu_right, real_T rtu_left, real_T rtu_use_short_path, real_T
  *rty_out, rtDW_Chart_AutopilotLaws_m_T *localDW)
{
  if (localDW->is_active_c15_AutopilotLaws == 0) {
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
          localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_right_a;
          *rty_out = rtu_right;
        } else if ((rtu_use_short_path == 0.0) && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
          localDW->is_c15_AutopilotLaws = AutopilotLaws_IN_left_b;
          *rty_out = rtu_left;
        } else if (tmp_0 < tmp) {
          *rty_out = rtu_left;
        } else {
          *rty_out = rtu_right;
        }
      }
      break;

     case AutopilotLaws_IN_left_b:
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
  real_T denom_tmp_0;
  real_T tmp;
  real_T tmp_0;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = 2.0 * rtu_C3;
  denom_tmp_0 = rtu_dt * rtu_C4;
  denom = denom_tmp + denom_tmp_0;
  tmp = rtu_dt * rtu_C2;
  tmp_0 = 2.0 * rtu_C1;
  *rty_Y = ((tmp_0 + tmp) / denom * rtu_U + (tmp - tmp_0) / denom * localDW->pU) + (denom_tmp - denom_tmp_0) / denom *
    localDW->pY;
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
  real_T tmp;
  if (rtu_in->input.V_c_kn <= rtu_in->data.VLS_kn) {
    tmp = rtu_in->data.VLS_kn - 5.0;
  } else {
    tmp = rtu_in->data.VLS_kn;
  }

  if (rtu_in->data.V_ias_kn < tmp + rtu_margin) {
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
  int32_T tmp;
  v[0] = rtu_u1;
  v[1] = rtu_u2;
  v[2] = rtu_u3;
  if (rtu_u1 < rtu_u2) {
    if (rtu_u2 < rtu_u3) {
      tmp = 1;
    } else if (rtu_u1 < rtu_u3) {
      tmp = 2;
    } else {
      tmp = 0;
    }
  } else if (rtu_u1 < rtu_u3) {
    tmp = 0;
  } else if (rtu_u2 < rtu_u3) {
    tmp = 2;
  } else {
    tmp = 1;
  }

  *rty_Y = v[tmp];
}

void AutopilotLawsModelClass::step()
{
  ap_laws_output rtb_BusAssignment;
  real_T result_tmp[9];
  real_T tmp[3];
  real_T L;
  real_T Phi1;
  real_T Phi2;
  real_T a;
  real_T b_L;
  real_T result_idx_0;
  real_T result_idx_0_0;
  real_T result_idx_1;
  real_T result_idx_1_0;
  real_T result_idx_2;
  real_T result_idx_2_0;
  real_T rtb_AP_g;
  real_T rtb_Divide;
  real_T rtb_FD;
  real_T rtb_FD_gn;
  real_T rtb_Gain4;
  real_T rtb_Gain7_j;
  real_T rtb_GainTheta;
  real_T rtb_GainTheta1;
  real_T rtb_Gain_a0;
  real_T rtb_MaxH_dot_RA1;
  real_T rtb_Product_dh;
  real_T rtb_Sum1_g;
  real_T rtb_Sum3_m3;
  real_T rtb_Sum_ia;
  real_T rtb_Sum_if;
  real_T rtb_Vz;
  real_T rtb_Y_co;
  real_T rtb_Y_hn;
  real_T rtb_Y_i;
  real_T rtb_Y_kt;
  real_T rtb_dme;
  real_T rtb_lo;
  real_T rtb_lo_o;
  real_T rtb_uDLookupTable_m;
  real_T u0;
  int32_T i;
  int32_T low_i;
  int32_T low_ip1;
  int32_T mid_i;
  int32_T rtb_on_ground;
  uint32_T tmp_0;
  boolean_T rtb_Compare_jy;
  boolean_T rtb_OR1;
  boolean_T rtb_valid;
  boolean_T rtb_valid_l;
  static const int8_T b[5]{ 15, 30, 30, 19, 19 };

  boolean_T guard1;
  rtb_Y_co = ((AutopilotLaws_U.in.input.enabled_AP1 != 0.0) || (AutopilotLaws_U.in.input.enabled_AP2 != 0.0));
  rtb_GainTheta = AutopilotLaws_P.GainTheta_Gain * AutopilotLaws_U.in.data.Theta_deg;
  rtb_GainTheta1 = AutopilotLaws_P.GainTheta1_Gain * AutopilotLaws_U.in.data.Phi_deg;
  result_idx_0_0 = 0.017453292519943295 * rtb_GainTheta;
  result_idx_0 = 0.017453292519943295 * rtb_GainTheta1;
  result_idx_1_0 = std::tan(result_idx_0_0);
  rtb_dme = std::cos(result_idx_0);
  result_idx_2_0 = std::sin(result_idx_0);
  b_L = std::cos(result_idx_0_0);
  result_tmp[0] = 1.0;
  result_tmp[3] = result_idx_2_0 * result_idx_1_0;
  result_tmp[6] = rtb_dme * result_idx_1_0;
  result_tmp[1] = 0.0;
  result_tmp[4] = rtb_dme;
  result_tmp[7] = -result_idx_2_0;
  result_tmp[2] = 0.0;
  u0 = 1.0 / b_L;
  result_tmp[5] = u0 * result_idx_2_0;
  result_tmp[8] = u0 * rtb_dme;
  tmp[0] = AutopilotLaws_P.Gain_Gain_de * AutopilotLaws_U.in.data.p_rad_s * AutopilotLaws_P.Gainpk_Gain;
  tmp[1] = AutopilotLaws_P.Gain_Gain_d * AutopilotLaws_U.in.data.q_rad_s * AutopilotLaws_P.Gainqk_Gain;
  tmp[2] = AutopilotLaws_P.Gain_Gain_m * AutopilotLaws_U.in.data.r_rad_s;
  result_idx_0 = 0.0;
  result_idx_1 = 0.0;
  result_idx_2 = 0.0;
  for (i = 0; i < 3; i++) {
    u0 = tmp[i];
    result_idx_0 += result_tmp[3 * i] * u0;
    result_idx_1 += result_tmp[3 * i + 1] * u0;
    result_idx_2 += result_tmp[3 * i + 2] * u0;
  }

  rtb_Gain7_j = AutopilotLaws_U.in.data.H_radio_ft + AutopilotLaws_P.Bias_Bias;
  result_idx_1_0 = std::sin(result_idx_0_0);
  result_tmp[0] = b_L;
  result_tmp[3] = 0.0;
  result_tmp[6] = -result_idx_1_0;
  result_tmp[1] = result_idx_2_0 * result_idx_1_0;
  result_tmp[4] = rtb_dme;
  result_tmp[7] = b_L * result_idx_2_0;
  result_tmp[2] = rtb_dme * result_idx_1_0;
  result_tmp[5] = 0.0 - result_idx_2_0;
  result_tmp[8] = rtb_dme * b_L;
  tmp[0] = AutopilotLaws_U.in.data.bx_m_s2;
  tmp[1] = AutopilotLaws_U.in.data.by_m_s2;
  tmp[2] = AutopilotLaws_U.in.data.bz_m_s2;
  result_idx_0_0 = 0.0;
  result_idx_1_0 = 0.0;
  result_idx_2_0 = 0.0;
  for (i = 0; i < 3; i++) {
    u0 = tmp[i];
    result_idx_0_0 += result_tmp[3 * i] * u0;
    result_idx_1_0 += result_tmp[3 * i + 1] * u0;
    result_idx_2_0 += result_tmp[3 * i + 2] * u0;
  }

  if (AutopilotLaws_U.in.data.nav_dme_valid != 0.0) {
    rtb_dme = AutopilotLaws_U.in.data.nav_dme_nmi;
  } else if (AutopilotLaws_U.in.data.nav_loc_valid) {
    a = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lat - AutopilotLaws_U.in.data.aircraft_position.lat) *
                 0.017453292519943295 / 2.0);
    L = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lon - AutopilotLaws_U.in.data.aircraft_position.lon) *
                 0.017453292519943295 / 2.0);
    a = std::cos(0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lat) * std::cos(0.017453292519943295 *
      AutopilotLaws_U.in.data.nav_loc_position.lat) * L * L + a * a;
    rtb_dme = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
    a = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_loc_position.alt;
    rtb_dme = std::sqrt(rtb_dme * rtb_dme + a * a) / 1852.0;
  } else {
    rtb_dme = 0.0;
  }

  Phi1 = 0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lat;
  Phi2 = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_loc_position.lat;
  a = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lat - AutopilotLaws_U.in.data.aircraft_position.lat) *
               0.017453292519943295 / 2.0);
  L = std::sin((AutopilotLaws_U.in.data.nav_loc_position.lon - AutopilotLaws_U.in.data.aircraft_position.lon) *
               0.017453292519943295 / 2.0);
  rtb_lo_o = std::cos(Phi2);
  rtb_Y_i = std::cos(Phi1);
  a = rtb_Y_i * rtb_lo_o * L * L + a * a;
  a = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  L = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_loc_position.alt;
  rtb_Divide = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_loc_position.lon - 0.017453292519943295 *
    AutopilotLaws_U.in.data.aircraft_position.lon;
  Phi2 = std::fmod(std::atan2(std::sin(rtb_Divide) * rtb_lo_o, rtb_Y_i * std::sin(Phi2) - std::sin(Phi1) * rtb_lo_o *
    std::cos(rtb_Divide)) * 57.295779513082323 + 360.0, 360.0);
  if (Phi2 == 0.0) {
    Phi2 = 0.0;
  } else if (Phi2 < 0.0) {
    Phi2 += 360.0;
  }

  Phi1 = std::fmod(AutopilotLaws_U.in.data.nav_loc_magvar_deg, 360.0);
  if (Phi1 == 0.0) {
    Phi1 = 0.0;
  } else if (Phi1 < 0.0) {
    Phi1 += 360.0;
  }

  b_L = std::fmod(-(std::fmod(Phi1 + 360.0, 360.0) + 360.0) + 360.0, 360.0);
  if (b_L == 0.0) {
    b_L = 0.0;
  } else if (b_L < 0.0) {
    b_L += 360.0;
  }

  Phi1 = std::fmod(360.0 - b_L, 360.0);
  if (b_L < Phi1) {
    Phi1 = -b_L;
  }

  b_L = std::fmod(AutopilotLaws_U.in.data.nav_loc_deg - Phi1, 360.0);
  if (b_L == 0.0) {
    b_L = 0.0;
  } else if (b_L < 0.0) {
    b_L += 360.0;
  }

  Phi2 = std::fmod(std::fmod(Phi2, 360.0) + 360.0, 360.0);
  Phi1 = std::fmod((std::fmod(std::fmod(std::fmod(b_L + 360.0, 360.0), 360.0) + 360.0, 360.0) - (Phi2 + 360.0)) + 360.0,
                   360.0);
  if (Phi1 == 0.0) {
    Phi1 = 0.0;
  } else if (Phi1 < 0.0) {
    Phi1 += 360.0;
  }

  b_L = std::fmod(360.0 - Phi1, 360.0);
  guard1 = false;
  if (std::sqrt(a * a + L * L) / 1852.0 < 30.0) {
    a = std::fmod(AutopilotLaws_U.in.data.nav_loc_deg, 360.0);
    if (a == 0.0) {
      a = 0.0;
    } else if (a < 0.0) {
      a += 360.0;
    }

    L = std::fmod((std::fmod(a + 360.0, 360.0) - (Phi2 + 360.0)) + 360.0, 360.0);
    if (L == 0.0) {
      L = 0.0;
    } else if (L < 0.0) {
      L += 360.0;
    }

    Phi2 = std::fmod(360.0 - L, 360.0);
    if (L < Phi2) {
      Phi2 = -L;
    }

    if ((std::abs(Phi2) < 90.0) && ((AutopilotLaws_U.in.data.nav_loc_position.lat != 0.0) ||
         (AutopilotLaws_U.in.data.nav_loc_position.lon != 0.0) || (AutopilotLaws_U.in.data.nav_loc_position.alt != 0.0)))
    {
      rtb_valid = true;
      if (Phi1 < b_L) {
        b_L = -Phi1;
      }
    } else {
      guard1 = true;
    }
  } else {
    guard1 = true;
  }

  if (guard1) {
    rtb_valid = false;
    b_L = 0.0;
  }

  if (AutopilotLaws_U.in.data.nav_gs_valid || (!AutopilotLaws_DWork.nav_gs_deg_not_empty)) {
    AutopilotLaws_DWork.nav_gs_deg = AutopilotLaws_U.in.data.nav_gs_deg;
    AutopilotLaws_DWork.nav_gs_deg_not_empty = true;
  }

  Phi1 = 0.017453292519943295 * AutopilotLaws_U.in.data.aircraft_position.lat;
  Phi2 = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_gs_position.lat;
  a = std::sin((AutopilotLaws_U.in.data.nav_gs_position.lat - AutopilotLaws_U.in.data.aircraft_position.lat) *
               0.017453292519943295 / 2.0);
  L = std::sin((AutopilotLaws_U.in.data.nav_gs_position.lon - AutopilotLaws_U.in.data.aircraft_position.lon) *
               0.017453292519943295 / 2.0);
  rtb_lo_o = std::cos(Phi2);
  rtb_Y_i = std::cos(Phi1);
  a = rtb_Y_i * rtb_lo_o * L * L + a * a;
  a = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  L = AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_gs_position.alt;
  a = std::sqrt(a * a + L * L);
  rtb_Divide = 0.017453292519943295 * AutopilotLaws_U.in.data.nav_gs_position.lon - 0.017453292519943295 *
    AutopilotLaws_U.in.data.aircraft_position.lon;
  Phi2 = std::fmod(std::atan2(std::sin(rtb_Divide) * rtb_lo_o, rtb_Y_i * std::sin(Phi2) - std::sin(Phi1) * rtb_lo_o *
    std::cos(rtb_Divide)) * 57.295779513082323 + 360.0, 360.0);
  if (Phi2 == 0.0) {
    Phi2 = 0.0;
  } else if (Phi2 < 0.0) {
    Phi2 += 360.0;
  }

  guard1 = false;
  if (a / 1852.0 < 30.0) {
    Phi1 = std::fmod(AutopilotLaws_U.in.data.nav_loc_deg, 360.0);
    if (Phi1 == 0.0) {
      Phi1 = 0.0;
    } else if (Phi1 < 0.0) {
      Phi1 += 360.0;
    }

    L = std::fmod((std::fmod(Phi1 + 360.0, 360.0) - (std::fmod(std::fmod(Phi2, 360.0) + 360.0, 360.0) + 360.0)) + 360.0,
                  360.0);
    if (L == 0.0) {
      L = 0.0;
    } else if (L < 0.0) {
      L += 360.0;
    }

    Phi2 = std::fmod(360.0 - L, 360.0);
    if (L < Phi2) {
      Phi2 = -L;
    }

    if ((std::abs(Phi2) < 90.0) && ((AutopilotLaws_U.in.data.nav_gs_position.lat != 0.0) ||
         (AutopilotLaws_U.in.data.nav_gs_position.lon != 0.0) || (AutopilotLaws_U.in.data.nav_gs_position.alt != 0.0)))
    {
      rtb_valid_l = true;
      a = std::asin((AutopilotLaws_U.in.data.aircraft_position.alt - AutopilotLaws_U.in.data.nav_gs_position.alt) / a) *
        57.295779513082323 - AutopilotLaws_DWork.nav_gs_deg;
    } else {
      guard1 = true;
    }
  } else {
    guard1 = true;
  }

  if (guard1) {
    rtb_valid_l = false;
    a = 0.0;
  }

  L = AutopilotLaws_P.Gain_Gain_n * AutopilotLaws_U.in.data.gear_strut_compression_1 - AutopilotLaws_P.Constant1_Value_b;
  if (L > AutopilotLaws_P.Saturation_UpperSat_p) {
    L = AutopilotLaws_P.Saturation_UpperSat_p;
  } else if (L < AutopilotLaws_P.Saturation_LowerSat_g) {
    L = AutopilotLaws_P.Saturation_LowerSat_g;
  }

  Phi1 = AutopilotLaws_P.Gain1_Gain_ll * AutopilotLaws_U.in.data.gear_strut_compression_2 -
    AutopilotLaws_P.Constant1_Value_b;
  if (Phi1 > AutopilotLaws_P.Saturation1_UpperSat_j) {
    Phi1 = AutopilotLaws_P.Saturation1_UpperSat_j;
  } else if (Phi1 < AutopilotLaws_P.Saturation1_LowerSat_d) {
    Phi1 = AutopilotLaws_P.Saturation1_LowerSat_d;
  }

  if (AutopilotLaws_DWork.is_active_c5_AutopilotLaws == 0) {
    AutopilotLaws_DWork.is_active_c5_AutopilotLaws = 1U;
    AutopilotLaws_DWork.is_c5_AutopilotLaws = AutopilotLaws_IN_OnGround;
    rtb_on_ground = 1;
  } else if (AutopilotLaws_DWork.is_c5_AutopilotLaws == AutopilotLaws_IN_InAir) {
    if ((L > 0.05) || (Phi1 > 0.05)) {
      AutopilotLaws_DWork.is_c5_AutopilotLaws = AutopilotLaws_IN_OnGround;
      rtb_on_ground = 1;
    } else {
      rtb_on_ground = 0;
    }
  } else if ((L == 0.0) && (Phi1 == 0.0)) {
    AutopilotLaws_DWork.is_c5_AutopilotLaws = AutopilotLaws_IN_InAir;
    rtb_on_ground = 0;
  } else {
    rtb_on_ground = 1;
  }

  rtb_Compare_jy = (AutopilotLaws_U.in.data.altimeter_setting_left_mbar != AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_DWork.DelayInput1_DSTATE_g;
  rtb_BusAssignment = AutopilotLaws_P.ap_laws_output_MATLABStruct;
  rtb_BusAssignment.output.ap_on = rtb_Y_co;
  rtb_BusAssignment.time = AutopilotLaws_U.in.time;
  rtb_BusAssignment.data.aircraft_position = AutopilotLaws_U.in.data.aircraft_position;
  rtb_BusAssignment.data.Theta_deg = rtb_GainTheta;
  rtb_BusAssignment.data.Phi_deg = rtb_GainTheta1;
  rtb_BusAssignment.data.qk_deg_s = result_idx_1;
  rtb_BusAssignment.data.rk_deg_s = result_idx_2;
  rtb_BusAssignment.data.pk_deg_s = result_idx_0;
  rtb_BusAssignment.data.V_ias_kn = AutopilotLaws_U.in.data.V_ias_kn;
  rtb_BusAssignment.data.V_tas_kn = AutopilotLaws_U.in.data.V_tas_kn;
  rtb_BusAssignment.data.V_mach = AutopilotLaws_U.in.data.V_mach;
  rtb_BusAssignment.data.V_gnd_kn = AutopilotLaws_U.in.data.V_gnd_kn;
  rtb_BusAssignment.data.alpha_deg = AutopilotLaws_U.in.data.alpha_deg;
  rtb_BusAssignment.data.beta_deg = AutopilotLaws_U.in.data.beta_deg;
  rtb_BusAssignment.data.H_ft = AutopilotLaws_U.in.data.H_ft;
  rtb_BusAssignment.data.H_ind_ft = AutopilotLaws_U.in.data.H_ind_ft;
  rtb_BusAssignment.data.H_radio_ft = rtb_Gain7_j;
  rtb_BusAssignment.data.H_dot_ft_min = AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_BusAssignment.data.Psi_magnetic_deg = AutopilotLaws_U.in.data.Psi_magnetic_deg;
  rtb_BusAssignment.data.Psi_magnetic_track_deg = AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_BusAssignment.data.Psi_true_deg = AutopilotLaws_U.in.data.Psi_true_deg;
  rtb_BusAssignment.data.ax_m_s2 = result_idx_0_0;
  rtb_BusAssignment.data.ay_m_s2 = result_idx_1_0;
  rtb_BusAssignment.data.az_m_s2 = result_idx_2_0;
  rtb_BusAssignment.data.bx_m_s2 = AutopilotLaws_U.in.data.bx_m_s2;
  rtb_BusAssignment.data.by_m_s2 = AutopilotLaws_U.in.data.by_m_s2;
  rtb_BusAssignment.data.bz_m_s2 = AutopilotLaws_U.in.data.bz_m_s2;
  rtb_BusAssignment.data.nav_valid = AutopilotLaws_U.in.data.nav_valid;
  rtb_BusAssignment.data.nav_loc_deg = AutopilotLaws_U.in.data.nav_loc_deg;
  rtb_BusAssignment.data.nav_gs_deg = AutopilotLaws_P.Gain3_Gain_a * AutopilotLaws_U.in.data.nav_gs_deg;
  rtb_BusAssignment.data.nav_dme_valid = AutopilotLaws_U.in.data.nav_dme_valid;
  rtb_BusAssignment.data.nav_dme_nmi = rtb_dme;
  rtb_BusAssignment.data.nav_loc_valid = AutopilotLaws_U.in.data.nav_loc_valid;
  rtb_BusAssignment.data.nav_loc_magvar_deg = AutopilotLaws_U.in.data.nav_loc_magvar_deg;
  rtb_BusAssignment.data.nav_loc_error_deg = AutopilotLaws_U.in.data.nav_loc_error_deg;
  rtb_BusAssignment.data.nav_loc_position = AutopilotLaws_U.in.data.nav_loc_position;
  rtb_BusAssignment.data.nav_e_loc_valid = rtb_valid;
  rtb_BusAssignment.data.nav_e_loc_error_deg = b_L;
  rtb_BusAssignment.data.nav_gs_valid = AutopilotLaws_U.in.data.nav_gs_valid;
  rtb_BusAssignment.data.nav_gs_error_deg = AutopilotLaws_U.in.data.nav_gs_error_deg;
  rtb_BusAssignment.data.nav_gs_position = AutopilotLaws_U.in.data.nav_gs_position;
  rtb_BusAssignment.data.nav_e_gs_valid = rtb_valid_l;
  rtb_BusAssignment.data.nav_e_gs_error_deg = a;
  rtb_BusAssignment.data.flight_guidance_xtk_nmi = AutopilotLaws_U.in.data.flight_guidance_xtk_nmi;
  rtb_BusAssignment.data.flight_guidance_tae_deg = AutopilotLaws_U.in.data.flight_guidance_tae_deg;
  rtb_BusAssignment.data.flight_guidance_phi_deg = AutopilotLaws_U.in.data.flight_guidance_phi_deg;
  rtb_BusAssignment.data.flight_guidance_phi_limit_deg = AutopilotLaws_U.in.data.flight_guidance_phi_limit_deg;
  rtb_BusAssignment.data.flight_phase = AutopilotLaws_U.in.data.flight_phase;
  rtb_BusAssignment.data.V2_kn = AutopilotLaws_U.in.data.V2_kn;
  rtb_BusAssignment.data.VAPP_kn = AutopilotLaws_U.in.data.VAPP_kn;
  rtb_BusAssignment.data.VLS_kn = AutopilotLaws_U.in.data.VLS_kn;
  rtb_BusAssignment.data.VMAX_kn = AutopilotLaws_U.in.data.VMAX_kn;
  rtb_BusAssignment.data.is_flight_plan_available = AutopilotLaws_U.in.data.is_flight_plan_available;
  rtb_BusAssignment.data.altitude_constraint_ft = AutopilotLaws_U.in.data.altitude_constraint_ft;
  rtb_BusAssignment.data.thrust_reduction_altitude = AutopilotLaws_U.in.data.thrust_reduction_altitude;
  rtb_BusAssignment.data.thrust_reduction_altitude_go_around =
    AutopilotLaws_U.in.data.thrust_reduction_altitude_go_around;
  rtb_BusAssignment.data.acceleration_altitude = AutopilotLaws_U.in.data.acceleration_altitude;
  rtb_BusAssignment.data.acceleration_altitude_engine_out = AutopilotLaws_U.in.data.acceleration_altitude_engine_out;
  rtb_BusAssignment.data.acceleration_altitude_go_around = AutopilotLaws_U.in.data.acceleration_altitude_go_around;
  rtb_BusAssignment.data.acceleration_altitude_go_around_engine_out =
    AutopilotLaws_U.in.data.acceleration_altitude_go_around_engine_out;
  rtb_BusAssignment.data.cruise_altitude = AutopilotLaws_U.in.data.cruise_altitude;
  rtb_BusAssignment.data.on_ground = rtb_on_ground;
  rtb_BusAssignment.data.zeta_deg = AutopilotLaws_P.Gain2_Gain_b * AutopilotLaws_U.in.data.zeta_pos;
  rtb_BusAssignment.data.throttle_lever_1_pos = AutopilotLaws_U.in.data.throttle_lever_1_pos;
  rtb_BusAssignment.data.throttle_lever_2_pos = AutopilotLaws_U.in.data.throttle_lever_2_pos;
  rtb_BusAssignment.data.throttle_lever_3_pos = AutopilotLaws_U.in.data.throttle_lever_3_pos;
  rtb_BusAssignment.data.throttle_lever_4_pos = AutopilotLaws_U.in.data.throttle_lever_4_pos;
  rtb_BusAssignment.data.flaps_handle_index = AutopilotLaws_U.in.data.flaps_handle_index;
  rtb_BusAssignment.data.is_engine_operative_1 = AutopilotLaws_U.in.data.is_engine_operative_1;
  rtb_BusAssignment.data.is_engine_operative_2 = AutopilotLaws_U.in.data.is_engine_operative_2;
  rtb_BusAssignment.data.is_engine_operative_3 = AutopilotLaws_U.in.data.is_engine_operative_3;
  rtb_BusAssignment.data.is_engine_operative_4 = AutopilotLaws_U.in.data.is_engine_operative_4;
  rtb_BusAssignment.data.altimeter_setting_changed = (rtb_Compare_jy ||
    (AutopilotLaws_U.in.data.altimeter_setting_right_mbar != AutopilotLaws_DWork.DelayInput1_DSTATE));
  rtb_BusAssignment.data.total_weight_kg = AutopilotLaws_U.in.data.total_weight_kg;
  rtb_BusAssignment.data.gear_is_extended = AutopilotLaws_U.in.data.gear_is_extended;
  rtb_BusAssignment.data.land_capability = AutopilotLaws_U.in.data.land_capability;
  rtb_BusAssignment.input = AutopilotLaws_U.in.input;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_e;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.data.Psi_magnetic_deg -
    AutopilotLaws_DWork.DelayInput1_DSTATE) + AutopilotLaws_P.Constant3_Value_e;
  result_idx_0 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_e);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_e - result_idx_0;
  result_idx_0_0 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_e);
  if (result_idx_0 < result_idx_0_0) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_h * result_idx_0;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_e * result_idx_0_0;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_b);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_b;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_b);
  result_idx_1_0 = rt_modd(rt_modd(AutopilotLaws_U.in.data.nav_loc_deg - AutopilotLaws_U.in.data.nav_loc_magvar_deg,
    AutopilotLaws_P.Constant3_Value_n) + AutopilotLaws_P.Constant3_Value_n, AutopilotLaws_P.Constant3_Value_n);
  result_idx_0 = rt_modd((AutopilotLaws_DWork.DelayInput1_DSTATE - (result_idx_1_0 + AutopilotLaws_P.Constant3_Value_i))
    + AutopilotLaws_P.Constant3_Value_i, AutopilotLaws_P.Constant3_Value_i);
  result_idx_0_0 = rt_modd(AutopilotLaws_P.Constant3_Value_i - result_idx_0, AutopilotLaws_P.Constant3_Value_i);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting == 1) {
    result_idx_2_0 = AutopilotLaws_P.Constant_Value_d;
  } else {
    result_idx_2_0 = AutopilotLaws_U.in.input.lateral_law;
  }

  rtb_valid = (result_idx_2_0 == AutopilotLaws_P.CompareToConstant2_const);
  if (result_idx_0 < result_idx_0_0) {
    u0 = AutopilotLaws_P.Gain1_Gain * result_idx_0;
  } else {
    u0 = AutopilotLaws_P.Gain_Gain * result_idx_0_0;
  }

  result_idx_0 = std::abs(u0);
  if (!AutopilotLaws_DWork.limit_not_empty) {
    AutopilotLaws_DWork.limit = result_idx_0;
    AutopilotLaws_DWork.limit_not_empty = true;
  }

  if (!rtb_valid) {
    AutopilotLaws_DWork.limit = std::fmin(std::fmax(result_idx_0, 15.0), 115.0);
  }

  if (rtb_valid && (result_idx_0 < 15.0)) {
    AutopilotLaws_DWork.limit = 15.0;
  }

  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value, AutopilotLaws_P.zeta_Value, &result_idx_0_0, &a);
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_b) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_b;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_nz) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_nz;
  } else {
    u0 = rtb_dme;
  }

  rtb_Divide = std::sin(AutopilotLaws_P.Gain1_Gain_f * AutopilotLaws_U.in.data.nav_loc_error_deg) * u0 *
    AutopilotLaws_P.Gain_Gain_h * a / AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Divide > AutopilotLaws_DWork.limit) {
    rtb_Divide = AutopilotLaws_DWork.limit;
  } else if (rtb_Divide < -AutopilotLaws_DWork.limit) {
    rtb_Divide = -AutopilotLaws_DWork.limit;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_DWork.DelayInput1_DSTATE - (rt_modd(rt_modd
    (AutopilotLaws_U.in.data.nav_loc_error_deg + result_idx_1_0, AutopilotLaws_P.Constant3_Value_c2) +
    AutopilotLaws_P.Constant3_Value_c2, AutopilotLaws_P.Constant3_Value_c2) + AutopilotLaws_P.Constant3_Value_p)) +
    AutopilotLaws_P.Constant3_Value_p;
  result_idx_0 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_p);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_p - result_idx_0;
  result_idx_1_0 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_p);
  if (result_idx_0 < result_idx_1_0) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_p * result_idx_0;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_a * result_idx_1_0;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_P.Gain2_Gain_i * AutopilotLaws_DWork.DelayInput1_DSTATE +
    rtb_Divide) * result_idx_0_0;
  b_L = AutopilotLaws_DWork.DelayInput1_DSTATE * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_RateLimiter_n((result_idx_2_0 == AutopilotLaws_P.CompareToConstant1_const),
    AutopilotLaws_P.RateLimiterVariableTs_up, AutopilotLaws_P.RateLimiterVariableTs_lo, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition, &a, &AutopilotLaws_DWork.sf_RateLimiter_n);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_loc_error_deg, AutopilotLaws_P.LagFilter2_C1,
    AutopilotLaws_U.in.time.dt, &result_idx_0_0, &AutopilotLaws_DWork.sf_LagFilter_h);
  result_idx_0 = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain * result_idx_0_0;
  AutopilotLaws_DWork.DelayInput1_DSTATE = result_idx_0 - AutopilotLaws_DWork.Delay_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE /= AutopilotLaws_U.in.time.dt;
  AutopilotLaws_LagFilter(result_idx_0_0 + AutopilotLaws_P.Gain3_Gain_i * AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.LagFilter_C1, AutopilotLaws_U.in.time.dt, &rtb_Y_i, &AutopilotLaws_DWork.sf_LagFilter_m);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.nav_loc_deg -
    AutopilotLaws_U.in.data.nav_loc_magvar_deg;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_if);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Constant3_Value_if;
  Phi1 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_if);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_m;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (Phi1 - AutopilotLaws_DWork.DelayInput1_DSTATE) +
    AutopilotLaws_P.Constant3_Value_m;
  result_idx_0_0 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_m);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_m - result_idx_0_0;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_m);
  AutopilotLaws_Chart_h(result_idx_0_0, AutopilotLaws_P.Gain_Gain_fn * AutopilotLaws_DWork.DelayInput1_DSTATE,
                        AutopilotLaws_P.Constant2_Value_l, &result_idx_1_0, &AutopilotLaws_DWork.sf_Chart_h);
  if (rtb_Gain7_j <= AutopilotLaws_P.CompareToConstant_const) {
    u0 = (AutopilotLaws_P.Gain_Gain_ae * result_idx_1_0 + AutopilotLaws_P.Gain1_Gain_k *
          AutopilotLaws_U.in.data.beta_deg) * AutopilotLaws_P.Gain5_Gain;
  } else {
    u0 = AutopilotLaws_P.Constant1_Value;
  }

  AutopilotLaws_LagFilter(u0, AutopilotLaws_P.LagFilter1_C1, AutopilotLaws_U.in.time.dt, &L,
    &AutopilotLaws_DWork.sf_LagFilter_c);
  if (L > AutopilotLaws_P.Saturation_UpperSat_e) {
    L = AutopilotLaws_P.Saturation_UpperSat_e;
  } else if (L < AutopilotLaws_P.Saturation_LowerSat_f) {
    L = AutopilotLaws_P.Saturation_LowerSat_f;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.Psi_magnetic_deg + AutopilotLaws_P.Constant3_Value_cd;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.input.Psi_c_deg - AutopilotLaws_DWork.DelayInput1_DSTATE)
    + AutopilotLaws_P.Constant3_Value_cd;
  result_idx_1_0 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_cd);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_cd - result_idx_1_0;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_cd);
  rtb_valid = ((result_idx_2_0 == AutopilotLaws_P.CompareToConstant5_const) ==
               AutopilotLaws_P.CompareToConstant_const_hx);
  result_idx_0_0 = AutopilotLaws_P.Subsystem_Value / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[i] = AutopilotLaws_P.Delay_InitialCondition;
    }
  }

  if (result_idx_0_0 < 1.0) {
    rtb_valid_l = rtb_valid;
  } else {
    if (result_idx_0_0 > 100.0) {
      tmp_0 = 100U;
    } else {
      tmp_0 = static_cast<uint32_T>(std::fmod(std::trunc(result_idx_0_0), 4.294967296E+9));
    }

    rtb_valid_l = AutopilotLaws_DWork.Delay_DSTATE_l[100U - tmp_0];
  }

  AutopilotLaws_Chart(result_idx_1_0, AutopilotLaws_P.Gain_Gain_cy * AutopilotLaws_DWork.DelayInput1_DSTATE, (rtb_valid
    != rtb_valid_l), &result_idx_0_0, &AutopilotLaws_DWork.sf_Chart);
  AutopilotLaws_DWork.DelayInput1_DSTATE = look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_h, AutopilotLaws_P.ScheduledGain_Table_o, 6U);
  result_idx_1_0 = result_idx_0_0 * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_o * result_idx_2;
  Phi2 = AutopilotLaws_P.Gain1_Gain_o * result_idx_1_0 + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_MATLABFunction_m(AutopilotLaws_U.in.input.Psi_c_deg, result_idx_0_0, Phi2, &rtb_Y_kt, &rtb_lo_o,
    &AutopilotLaws_DWork.sf_MATLABFunction_m);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.Psi_magnetic_track_deg +
    AutopilotLaws_P.Constant3_Value_k;
  AutopilotLaws_DWork.DelayInput1_DSTATE = (AutopilotLaws_U.in.input.Psi_c_deg - AutopilotLaws_DWork.DelayInput1_DSTATE)
    + AutopilotLaws_P.Constant3_Value_k;
  result_idx_1_0 = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Constant3_Value_k);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant3_Value_k - result_idx_1_0;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rt_modd(AutopilotLaws_DWork.DelayInput1_DSTATE,
    AutopilotLaws_P.Constant3_Value_k);
  rtb_valid_l = ((result_idx_2_0 == AutopilotLaws_P.CompareToConstant4_const) ==
                 AutopilotLaws_P.CompareToConstant_const_e);
  result_idx_0_0 = AutopilotLaws_P.Subsystem_Value_n / AutopilotLaws_U.in.time.dt;
  if (!rtb_valid_l) {
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }
  }

  if (result_idx_0_0 < 1.0) {
    rtb_Compare_jy = rtb_valid_l;
  } else {
    if (result_idx_0_0 > 100.0) {
      tmp_0 = 100U;
    } else {
      tmp_0 = static_cast<uint32_T>(std::fmod(std::trunc(result_idx_0_0), 4.294967296E+9));
    }

    rtb_Compare_jy = AutopilotLaws_DWork.Delay_DSTATE_h5[100U - tmp_0];
  }

  AutopilotLaws_Chart(result_idx_1_0, AutopilotLaws_P.Gain_Gain_p * AutopilotLaws_DWork.DelayInput1_DSTATE, (rtb_valid_l
    != rtb_Compare_jy), &result_idx_0_0, &AutopilotLaws_DWork.sf_Chart_ba);
  AutopilotLaws_DWork.DelayInput1_DSTATE = look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_o, AutopilotLaws_P.ScheduledGain_Table_e, 6U);
  result_idx_1_0 = result_idx_0_0 * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain_Gain_l * result_idx_2;
  rtb_Sum_if = AutopilotLaws_P.Gain1_Gain_i4 * result_idx_1_0 + AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_MATLABFunction_m(AutopilotLaws_U.in.input.Psi_c_deg, result_idx_0_0, rtb_Sum_if, &rtb_Y_hn, &rtb_lo,
    &AutopilotLaws_DWork.sf_MATLABFunction_e5);
  AutopilotLaws_MATLABFunction(AutopilotLaws_P.tau_Value_c, AutopilotLaws_P.zeta_Value_h, &result_idx_1_0, &rtb_Divide);
  AutopilotLaws_RateLimiter(AutopilotLaws_U.in.data.flight_guidance_phi_deg, AutopilotLaws_P.RateLimiterVariableTs_up_h,
    AutopilotLaws_P.RateLimiterVariableTs_lo_n, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_l, &result_idx_0_0, &AutopilotLaws_DWork.sf_RateLimiter);
  AutopilotLaws_LagFilter(result_idx_0_0, AutopilotLaws_P.LagFilter_C1_g, AutopilotLaws_U.in.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LagFilter);
  switch (static_cast<int32_T>(result_idx_2_0)) {
   case 0:
    Phi2 = rtb_GainTheta1;
    break;

   case 1:
    if (Phi2 > rtb_Y_kt) {
      Phi2 = rtb_Y_kt;
    } else if (Phi2 < rtb_lo_o) {
      Phi2 = rtb_lo_o;
    }
    break;

   case 2:
    if (rtb_Sum_if > rtb_Y_hn) {
      Phi2 = rtb_Y_hn;
    } else if (rtb_Sum_if < rtb_lo) {
      Phi2 = rtb_lo;
    } else {
      Phi2 = rtb_Sum_if;
    }
    break;

   case 3:
    u0 = AutopilotLaws_P.Gain_Gain_c * AutopilotLaws_U.in.data.flight_guidance_xtk_nmi * rtb_Divide /
      AutopilotLaws_U.in.data.V_gnd_kn;
    if (u0 > AutopilotLaws_P.Saturation_UpperSat) {
      u0 = AutopilotLaws_P.Saturation_UpperSat;
    } else if (u0 < AutopilotLaws_P.Saturation_LowerSat) {
      u0 = AutopilotLaws_P.Saturation_LowerSat;
    }

    Phi2 = AutopilotLaws_DWork.DelayInput1_DSTATE - (AutopilotLaws_P.Gain2_Gain *
      AutopilotLaws_U.in.data.flight_guidance_tae_deg + u0) * result_idx_1_0 * AutopilotLaws_U.in.data.V_gnd_kn;
    break;

   case 4:
    Phi2 = b_L;
    break;

   case 5:
    result_idx_0_0 = rt_modd((AutopilotLaws_U.in.data.Psi_magnetic_deg - (AutopilotLaws_U.in.data.Psi_true_deg +
      AutopilotLaws_P.Constant3_Value)) + AutopilotLaws_P.Constant3_Value, AutopilotLaws_P.Constant3_Value);
    result_idx_1_0 = rt_modd(AutopilotLaws_P.Constant3_Value - result_idx_0_0, AutopilotLaws_P.Constant3_Value);
    if (result_idx_0_0 < result_idx_1_0) {
      u0 = AutopilotLaws_P.Gain1_Gain_l * result_idx_0_0;
    } else {
      u0 = AutopilotLaws_P.Gain_Gain_g * result_idx_1_0;
    }

    result_idx_0_0 = rt_modd((rt_modd(rt_modd(AutopilotLaws_U.in.data.Psi_magnetic_track_deg + u0,
      AutopilotLaws_P.Constant3_Value_d) + AutopilotLaws_P.Constant3_Value_d, AutopilotLaws_P.Constant3_Value_d) - (Phi1
      + AutopilotLaws_P.Constant3_Value_c)) + AutopilotLaws_P.Constant3_Value_c, AutopilotLaws_P.Constant3_Value_c);
    result_idx_1_0 = rt_modd(AutopilotLaws_P.Constant3_Value_c - result_idx_0_0, AutopilotLaws_P.Constant3_Value_c);
    if (a > AutopilotLaws_P.Saturation_UpperSat_a) {
      a = AutopilotLaws_P.Saturation_UpperSat_a;
    } else if (a < AutopilotLaws_P.Saturation_LowerSat_a) {
      a = AutopilotLaws_P.Saturation_LowerSat_a;
    }

    if (result_idx_0_0 < result_idx_1_0) {
      u0 = AutopilotLaws_P.Gain1_Gain_g * result_idx_0_0;
    } else {
      u0 = AutopilotLaws_P.Gain_Gain_f * result_idx_1_0;
    }

    u0 = (rtb_Y_i * look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
           AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain2_Table, 6U) *
          AutopilotLaws_P.Gain4_Gain * look1_binlxpw(rtb_Gain7_j, AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1,
           AutopilotLaws_P.ScheduledGain_Table, 5U) + std::sin(AutopilotLaws_P.Gain1_Gain_b * u0) *
          AutopilotLaws_U.in.data.V_gnd_kn * AutopilotLaws_P.Gain2_Gain_g) + (AutopilotLaws_U.in.data.beta_deg *
      look1_binlxpw(rtb_Gain7_j, AutopilotLaws_P.ScheduledGain1_BreakpointsForDimension1,
                    AutopilotLaws_P.ScheduledGain1_Table, 4U) + L * look1_binlxpw(rtb_Gain7_j,
      AutopilotLaws_P.ScheduledGain3_BreakpointsForDimension1, AutopilotLaws_P.ScheduledGain3_Table, 5U));
    if (u0 > AutopilotLaws_P.Saturation1_UpperSat) {
      u0 = AutopilotLaws_P.Saturation1_UpperSat;
    } else if (u0 < AutopilotLaws_P.Saturation1_LowerSat) {
      u0 = AutopilotLaws_P.Saturation1_LowerSat;
    }

    Phi2 = (AutopilotLaws_P.Constant_Value - a) * b_L + u0 * a;
    break;

   default:
    Phi2 = AutopilotLaws_P.Constant3_Value_h;
    break;
  }

  result_idx_0_0 = std::abs(AutopilotLaws_U.in.data.V_tas_kn);
  if (result_idx_0_0 > 600.0) {
    result_idx_0_0 = 19.0;
  } else {
    i = 5;
    low_i = 1;
    low_ip1 = 2;
    while (i > low_ip1) {
      mid_i = (low_i + i) >> 1;
      if (result_idx_0_0 >= (static_cast<real_T>(mid_i) - 1.0) * 150.0) {
        low_i = mid_i;
        low_ip1 = mid_i + 1;
      } else {
        i = mid_i;
      }
    }

    Phi1 = (result_idx_0_0 - (static_cast<real_T>(low_i) - 1.0) * 150.0) / 150.0;
    if (Phi1 == 0.0) {
      result_idx_0_0 = b[low_i - 1];
    } else if (Phi1 == 1.0) {
      result_idx_0_0 = b[low_i];
    } else if (b[low_i - 1] == b[low_i]) {
      result_idx_0_0 = b[low_i - 1];
    } else {
      result_idx_0_0 = (1.0 - Phi1) * static_cast<real_T>(b[low_i - 1]) + Phi1 * static_cast<real_T>(b[low_i]);
    }
  }

  if ((AutopilotLaws_U.in.input.lateral_mode != 30.0) && (AutopilotLaws_U.in.input.lateral_mode != 31.0) &&
      (AutopilotLaws_U.in.input.lateral_mode != 32.0) && (AutopilotLaws_U.in.input.lateral_mode != 33.0) &&
      (AutopilotLaws_U.in.input.lateral_mode != 34.0)) {
    result_idx_0_0 = std::fmin(25.0, result_idx_0_0);
  } else if (rtb_Gain7_j < 700.0) {
    result_idx_0_0 = 10.0;
  }

  rtb_Gain7_j = std::abs(AutopilotLaws_U.in.data.flight_guidance_phi_limit_deg);
  if (!AutopilotLaws_DWork.pY_not_empty_k) {
    AutopilotLaws_DWork.pY_f = 25.0;
    AutopilotLaws_DWork.pY_not_empty_k = true;
  }

  if ((AutopilotLaws_U.in.input.lateral_mode == 20.0) && (rtb_Gain7_j > 0.0)) {
    result_idx_0_0 = rtb_Gain7_j;
  }

  AutopilotLaws_DWork.pY_f += std::fmax(std::fmin(result_idx_0_0 - AutopilotLaws_DWork.pY_f, 5.0 *
    AutopilotLaws_U.in.time.dt), -5.0 * AutopilotLaws_U.in.time.dt);
  if (Phi2 > AutopilotLaws_DWork.pY_f) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_DWork.pY_f;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_lt * AutopilotLaws_DWork.pY_f;
    if (Phi2 >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = Phi2;
    }
  }

  AutopilotLaws_LagFilter(AutopilotLaws_P.Gain_Gain_lu * (AutopilotLaws_DWork.DelayInput1_DSTATE - rtb_GainTheta1),
    AutopilotLaws_P.LagFilter_C1_a, AutopilotLaws_U.in.time.dt, &rtb_Y_i, &AutopilotLaws_DWork.sf_LagFilter_mp);
  if (rtb_dme > AutopilotLaws_P.Saturation_UpperSat_o) {
    rtb_dme = AutopilotLaws_P.Saturation_UpperSat_o;
  } else if (rtb_dme < AutopilotLaws_P.Saturation_LowerSat_o) {
    rtb_dme = AutopilotLaws_P.Saturation_LowerSat_o;
  }

  result_idx_1_0 = std::sin(AutopilotLaws_P.Gain1_Gain_nr * AutopilotLaws_U.in.data.nav_loc_error_deg) * rtb_dme *
    AutopilotLaws_P.Gain2_Gain_gs;
  if (result_idx_1_0 > AutopilotLaws_P.Saturation1_UpperSat_g) {
    result_idx_1_0 = AutopilotLaws_P.Saturation1_UpperSat_g;
  } else if (result_idx_1_0 < AutopilotLaws_P.Saturation1_LowerSat_k) {
    result_idx_1_0 = AutopilotLaws_P.Saturation1_LowerSat_k;
  }

  rtb_Compare_jy = (result_idx_2_0 == AutopilotLaws_P.CompareToConstant_const_k);
  rtb_OR1 = !rtb_Compare_jy;
  if (rtb_OR1) {
    AutopilotLaws_DWork.Delay_DSTATE_h = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  AutopilotLaws_DWork.Delay_DSTATE_h += AutopilotLaws_P.Gain6_Gain_b * result_idx_1_0 *
    AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_Gain * AutopilotLaws_U.in.time.dt;
  if (AutopilotLaws_DWork.Delay_DSTATE_h > AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    AutopilotLaws_DWork.Delay_DSTATE_h = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (AutopilotLaws_DWork.Delay_DSTATE_h < AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    AutopilotLaws_DWork.Delay_DSTATE_h = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  AutopilotLaws_storevalue(rtb_Compare_jy, rt_modd(rt_modd(AutopilotLaws_U.in.data.nav_loc_deg -
    AutopilotLaws_U.in.data.nav_loc_magvar_deg, AutopilotLaws_P.Constant3_Value_dk) + AutopilotLaws_P.Constant3_Value_dk,
    AutopilotLaws_P.Constant3_Value_dk), &rtb_Y_hn, &AutopilotLaws_DWork.sf_storevalue);
  result_idx_0_0 = rt_modd((AutopilotLaws_U.in.data.Psi_true_deg - (rt_modd(rt_modd
    (AutopilotLaws_U.in.data.nav_loc_error_deg + rtb_Y_hn, AutopilotLaws_P.Constant3_Value_o) +
    AutopilotLaws_P.Constant3_Value_o, AutopilotLaws_P.Constant3_Value_o) + AutopilotLaws_P.Constant3_Value_n1)) +
    AutopilotLaws_P.Constant3_Value_n1, AutopilotLaws_P.Constant3_Value_n1);
  rtb_Gain7_j = rt_modd(AutopilotLaws_P.Constant3_Value_n1 - result_idx_0_0, AutopilotLaws_P.Constant3_Value_n1);
  if (result_idx_0_0 < rtb_Gain7_j) {
    u0 = AutopilotLaws_P.Gain1_Gain_j * result_idx_0_0;
  } else {
    u0 = AutopilotLaws_P.Gain_Gain_i * rtb_Gain7_j;
  }

  rtb_Gain7_j = rt_modd((rt_modd(rt_modd(((result_idx_1_0 * look1_binlxpw(AutopilotLaws_U.in.data.V_gnd_kn,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_j, AutopilotLaws_P.ScheduledGain_Table_p, 2U) +
    AutopilotLaws_DWork.Delay_DSTATE_h) + AutopilotLaws_P.Gain1_Gain_fq * u0) + AutopilotLaws_U.in.data.Psi_true_deg,
    AutopilotLaws_P.Constant3_Value_hr) + AutopilotLaws_P.Constant3_Value_hr, AutopilotLaws_P.Constant3_Value_hr) -
    (AutopilotLaws_U.in.data.Psi_true_deg + AutopilotLaws_P.Constant3_Value_nr)) + AutopilotLaws_P.Constant3_Value_nr,
                        AutopilotLaws_P.Constant3_Value_nr);
  AutopilotLaws_Chart_h(rtb_Gain7_j, AutopilotLaws_P.Gain_Gain_oc * rt_modd(AutopilotLaws_P.Constant3_Value_nr -
    rtb_Gain7_j, AutopilotLaws_P.Constant3_Value_nr), AutopilotLaws_P.Constant1_Value_e, &result_idx_0_0,
                        &AutopilotLaws_DWork.sf_Chart_b);
  AutopilotLaws_RateLimiter_n(rtb_Compare_jy, AutopilotLaws_P.RateLimiterVariableTs_up_n,
    AutopilotLaws_P.RateLimiterVariableTs_lo_k, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_i, &a, &AutopilotLaws_DWork.sf_RateLimiter_e);
  if (a > AutopilotLaws_P.Saturation_UpperSat_k) {
    rtb_Divide = AutopilotLaws_P.Saturation_UpperSat_k;
  } else if (a < AutopilotLaws_P.Saturation_LowerSat_f3) {
    rtb_Divide = AutopilotLaws_P.Saturation_LowerSat_f3;
  } else {
    rtb_Divide = a;
  }

  if (rtb_OR1 || (!AutopilotLaws_DWork.storage_not_empty)) {
    AutopilotLaws_DWork.storage = rtb_BusAssignment.data.zeta_deg;
    AutopilotLaws_DWork.storage_not_empty = true;
  }

  result_idx_0_0 = (AutopilotLaws_P.Gain_Gain_b * result_idx_2 * rtb_Divide + (AutopilotLaws_P.Constant_Value_a -
    rtb_Divide) * (AutopilotLaws_P.Gain10_Gain * AutopilotLaws_DWork.storage)) + AutopilotLaws_P.Gain5_Gain_o *
    result_idx_0_0;
  if (result_idx_0_0 > AutopilotLaws_P.Saturation2_UpperSat) {
    result_idx_0_0 = AutopilotLaws_P.Saturation2_UpperSat;
  } else if (result_idx_0_0 < AutopilotLaws_P.Saturation2_LowerSat) {
    result_idx_0_0 = AutopilotLaws_P.Saturation2_LowerSat;
  }

  AutopilotLaws_RateLimiter_n(rtb_Compare_jy, AutopilotLaws_P.RateLimiterVariableTs2_up,
    AutopilotLaws_P.RateLimiterVariableTs2_lo, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs2_InitialCondition, &a, &AutopilotLaws_DWork.sf_RateLimiter_m);
  if (rtb_Y_co > AutopilotLaws_P.Switch_Threshold_n) {
    switch (static_cast<int32_T>(result_idx_2_0)) {
     case 0:
      result_idx_1_0 = AutopilotLaws_P.beta1_Value;
      break;

     case 1:
      result_idx_1_0 = AutopilotLaws_P.beta1_Value_h;
      break;

     case 2:
      result_idx_1_0 = AutopilotLaws_P.beta1_Value_l;
      break;

     case 3:
      result_idx_1_0 = AutopilotLaws_P.beta1_Value_m;
      break;

     case 4:
      result_idx_1_0 = AutopilotLaws_P.beta1_Value_d;
      break;

     case 5:
      result_idx_1_0 = AutopilotLaws_P.beta1_Value_hy;
      break;

     default:
      if (a > AutopilotLaws_P.Saturation_UpperSat_g) {
        result_idx_2 = AutopilotLaws_P.Saturation_UpperSat_g;
      } else if (a < AutopilotLaws_P.Saturation_LowerSat_n) {
        result_idx_2 = AutopilotLaws_P.Saturation_LowerSat_n;
      } else {
        result_idx_2 = a;
      }

      result_idx_1_0 = AutopilotLaws_P.Gain3_Gain * result_idx_0_0 * result_idx_2 + (AutopilotLaws_P.Constant_Value_p -
        result_idx_2) * AutopilotLaws_DWork.storage;
      break;
    }
  } else {
    result_idx_1_0 = AutopilotLaws_P.Constant1_Value_j;
  }

  switch (static_cast<int32_T>(result_idx_2_0)) {
   case 0:
    rtb_dme = AutopilotLaws_P.beta_Value;
    break;

   case 1:
    rtb_dme = AutopilotLaws_P.beta_Value_e;
    break;

   case 2:
    rtb_dme = AutopilotLaws_P.beta_Value_b;
    break;

   case 3:
    rtb_dme = AutopilotLaws_P.beta_Value_i;
    break;

   case 4:
    rtb_dme = AutopilotLaws_P.beta_Value_c;
    break;

   case 5:
    rtb_dme = L;
    break;

   default:
    if (a > AutopilotLaws_P.Saturation_UpperSat_j) {
      a = AutopilotLaws_P.Saturation_UpperSat_j;
    } else if (a < AutopilotLaws_P.Saturation_LowerSat_p) {
      a = AutopilotLaws_P.Saturation_LowerSat_p;
    }

    rtb_dme = AutopilotLaws_P.Gain7_Gain * result_idx_0_0 * a + (AutopilotLaws_P.Constant_Value_o - a) *
      AutopilotLaws_DWork.storage;
    break;
  }

  AutopilotLaws_LagFilter(rtb_dme, AutopilotLaws_P.LagFilter_C1_k, AutopilotLaws_U.in.time.dt, &rtb_Y_kt,
    &AutopilotLaws_DWork.sf_LagFilter_h2);
  AutopilotLaws_DWork.icLoad = ((rtb_Y_co == 0.0) || AutopilotLaws_DWork.icLoad);
  if (AutopilotLaws_DWork.icLoad) {
    AutopilotLaws_DWork.Delay_DSTATE_hc = rtb_GainTheta1;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE -= AutopilotLaws_DWork.Delay_DSTATE_hc;
  if (!AutopilotLaws_DWork.pY_not_empty) {
    AutopilotLaws_DWork.pY = 5.0;
    AutopilotLaws_DWork.pY_not_empty = true;
  }

  if ((AutopilotLaws_U.in.input.lateral_mode == 30.0) || (AutopilotLaws_U.in.input.lateral_mode == 31.0) ||
      (AutopilotLaws_U.in.input.lateral_mode == 32.0) || (AutopilotLaws_U.in.input.lateral_mode == 33.0) ||
      (AutopilotLaws_U.in.input.lateral_mode == 34.0)) {
    u0 = 7.5;
  } else {
    u0 = 5.0;
  }

  AutopilotLaws_DWork.pY += std::fmax(std::fmin(u0 - AutopilotLaws_DWork.pY, 2.5 * AutopilotLaws_U.in.time.dt), -2.5 *
    AutopilotLaws_U.in.time.dt);
  AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmin(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_DWork.pY *
    AutopilotLaws_U.in.time.dt);
  AutopilotLaws_DWork.Delay_DSTATE_hc += std::fmax(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Gain1_Gain_kf
    * AutopilotLaws_DWork.pY * AutopilotLaws_U.in.time.dt);
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_hc, AutopilotLaws_P.LagFilter_C1_l,
    AutopilotLaws_U.in.time.dt, &L, &AutopilotLaws_DWork.sf_LagFilter_o);
  AutopilotLaws_RateLimiter(rtb_Y_co, AutopilotLaws_P.RateLimiterVariableTs_up_b,
    AutopilotLaws_P.RateLimiterVariableTs_lo_b, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_il, &rtb_Y_hn, &AutopilotLaws_DWork.sf_RateLimiter_d);
  if (rtb_Y_hn > AutopilotLaws_P.Saturation_UpperSat_m) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_m;
  } else if (rtb_Y_hn < AutopilotLaws_P.Saturation_LowerSat_fw) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_fw;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Y_hn;
  }

  rtb_Y_co = L * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_ii - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE *= rtb_GainTheta1;
  AutopilotLaws_DWork.DelayInput1_DSTATE += rtb_Y_co;
  rtb_BusAssignment.output.Phi_loc_c = b_L;
  u0 = AutopilotLaws_P.Gain_Gain_m3 * result_idx_1_0;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_c) {
    rtb_BusAssignment.output.Nosewheel_c = AutopilotLaws_P.Saturation_UpperSat_c;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_d) {
    rtb_BusAssignment.output.Nosewheel_c = AutopilotLaws_P.Saturation_LowerSat_d;
  } else {
    rtb_BusAssignment.output.Nosewheel_c = u0;
  }

  rtb_BusAssignment.output.flight_director.Beta_c_deg = rtb_Y_kt;
  rtb_BusAssignment.output.autopilot.Beta_c_deg = rtb_dme;
  rtb_BusAssignment.output.flight_director.Phi_c_deg = rtb_Y_i;
  rtb_BusAssignment.output.autopilot.Phi_c_deg = AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_WashoutFilter(rtb_GainTheta, AutopilotLaws_P.WashoutFilter_C1, AutopilotLaws_U.in.time.dt,
    &result_idx_0_0, &AutopilotLaws_DWork.sf_WashoutFilter_f);
  if (AutopilotLaws_P.ManualSwitch_CurrentSetting_b == 1) {
    result_idx_2 = AutopilotLaws_P.Constant_Value_m;
  } else {
    result_idx_2 = AutopilotLaws_U.in.input.vertical_law;
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

  if (result_idx_2 != AutopilotLaws_P.CompareToConstant5_const_e) {
    AutopilotLaws_B.u = (AutopilotLaws_U.in.input.H_c_ft + AutopilotLaws_U.in.data.H_ft) -
      AutopilotLaws_U.in.data.H_ind_ft;
  }

  AutopilotLaws_LagFilter(AutopilotLaws_B.u - AutopilotLaws_U.in.data.H_ft, AutopilotLaws_P.LagFilter_C1_ai,
    AutopilotLaws_U.in.time.dt, &rtb_Y_hn, &AutopilotLaws_DWork.sf_LagFilter_g);
  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_P.Gain_Gain_ft * rtb_Y_hn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_n) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_n;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_d4) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_d4;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE -= AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Y_co = AutopilotLaws_P.ftmintoms_Gain * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain * AutopilotLaws_U.in.data.V_tas_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_ar) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_ar;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_n5) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_n5;
  }

  u0 = rtb_Y_co / AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (u0 > 1.0) {
    u0 = 1.0;
  } else if (u0 < -1.0) {
    u0 = -1.0;
  }

  result_idx_2_0 = AutopilotLaws_P.Gain_Gain_k * std::asin(u0);
  rtb_Compare_jy = (result_idx_2 == AutopilotLaws_P.CompareToConstant1_const_c);
  if (!AutopilotLaws_DWork.wasActive_not_empty_a) {
    AutopilotLaws_DWork.wasActive_d = rtb_Compare_jy;
    AutopilotLaws_DWork.wasActive_not_empty_a = true;
  }

  rtb_Y_co = AutopilotLaws_U.in.input.H_c_ft - AutopilotLaws_U.in.data.H_ind_ft;
  if (rtb_Y_co < 0.0) {
    low_i = -1;
  } else {
    low_i = (rtb_Y_co > 0.0);
  }

  rtb_Y_co += static_cast<real_T>(low_i) * AutopilotLaws_DWork.dH_offset;
  if ((!AutopilotLaws_DWork.wasActive_d) && rtb_Compare_jy) {
    AutopilotLaws_DWork.k = AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Y_co;
    AutopilotLaws_DWork.dH_offset = std::abs(500.0 / std::abs(AutopilotLaws_DWork.k) - 100.0);
    if (rtb_Y_co < 0.0) {
      i = -1;
    } else {
      i = (rtb_Y_co > 0.0);
    }

    rtb_Y_co += static_cast<real_T>(i) * AutopilotLaws_DWork.dH_offset;
    AutopilotLaws_DWork.k = AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Y_co;
    AutopilotLaws_DWork.maxH_dot = std::abs(AutopilotLaws_U.in.data.H_dot_ft_min);
  }

  rtb_Y_co *= AutopilotLaws_DWork.k;
  if (std::abs(rtb_Y_co) > AutopilotLaws_DWork.maxH_dot) {
    if (rtb_Y_co < 0.0) {
      i = -1;
    } else {
      i = (rtb_Y_co > 0.0);
    }

    rtb_Y_co = static_cast<real_T>(i) * AutopilotLaws_DWork.maxH_dot;
  }

  AutopilotLaws_DWork.wasActive_d = rtb_Compare_jy;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Y_co - AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Y_co = AutopilotLaws_P.ftmintoms_Gain_c * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_h * AutopilotLaws_U.in.data.V_tas_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_d) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_d;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_nr) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_nr;
  }

  u0 = rtb_Y_co / AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (u0 > 1.0) {
    u0 = 1.0;
  } else if (u0 < -1.0) {
    u0 = -1.0;
  }

  rtb_Y_co = AutopilotLaws_P.Gain_Gain_es * std::asin(u0);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain * AutopilotLaws_U.in.data.H_dot_ft_min;
  u0 = AutopilotLaws_P.kntoms_Gain_m * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_jh) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_jh;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_i) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_i;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / u0) *
    AutopilotLaws_P.Gain_Gain_e3;
  result_idx_1_0 = AutopilotLaws_P.Gain1_Gain_c * rtb_GainTheta1;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain * (AutopilotLaws_P.GStoGS_CAS_Gain * (AutopilotLaws_P.ktstomps_Gain *
    AutopilotLaws_U.in.data.V_gnd_kn)), AutopilotLaws_P.WashoutFilter_C1_e, AutopilotLaws_U.in.time.dt, &rtb_Y_hn,
    &AutopilotLaws_DWork.sf_WashoutFilter);
  u0 = AutopilotLaws_P.kntoms_Gain_b * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_ei) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_ei;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_dz) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_dz;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_hn - AutopilotLaws_P.g_Gain * (AutopilotLaws_P.Gain1_Gain_lp *
    (AutopilotLaws_P.Gain_Gain_am * ((AutopilotLaws_P.Gain1_Gain_go * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_lx *
    (AutopilotLaws_P.Gain_Gain_c1 * std::atan(AutopilotLaws_P.fpmtoms_Gain_g * AutopilotLaws_U.in.data.H_dot_ft_min / u0)))
    * (AutopilotLaws_P.Constant_Value_dy - std::cos(result_idx_1_0)) + std::sin(result_idx_1_0) * std::sin
    (AutopilotLaws_P.Gain1_Gain_pf * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_e *
     AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1, AutopilotLaws_P.HighPassFilter_C2,
    AutopilotLaws_P.HighPassFilter_C3, AutopilotLaws_P.HighPassFilter_C4, AutopilotLaws_U.in.time.dt, &L,
    &AutopilotLaws_DWork.sf_LeadLagFilter);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_b * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1, AutopilotLaws_P.LowPassFilter_C2, AutopilotLaws_P.LowPassFilter_C3,
    AutopilotLaws_P.LowPassFilter_C4, AutopilotLaws_U.in.time.dt, &rtb_Y_hn, &AutopilotLaws_DWork.sf_LeadLagFilter_o);
  result_idx_1_0 = (L + rtb_Y_hn) * AutopilotLaws_P.ug_Gain;
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_bf * AutopilotLaws_DWork.DelayInput1_DSTATE;
  rtb_Gain7_j = result_idx_1_0 + rtb_Divide;
  b_L = AutopilotLaws_P.Constant3_Value_nq - AutopilotLaws_P.Constant4_Value;
  a = (AutopilotLaws_P.Gain1_Gain_ik * result_idx_1_0 + rtb_Divide) * AutopilotLaws_P.Gain_Gain_aj;
  if (b_L > AutopilotLaws_P.Switch_Threshold_l) {
    result_idx_1_0 = AutopilotLaws_P.Constant1_Value_g;
  } else {
    result_idx_1_0 = AutopilotLaws_P.Gain5_Gain_g * a;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &rtb_Y_hn);
  L = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_hn) * AutopilotLaws_P.Gain1_Gain_oz;
  if (L <= result_idx_1_0) {
    if (b_L > AutopilotLaws_P.Switch1_Threshold) {
      result_idx_1_0 = AutopilotLaws_P.Constant_Value_g;
    } else {
      result_idx_1_0 = AutopilotLaws_P.Gain6_Gain * a;
    }

    if (L >= result_idx_1_0) {
      result_idx_1_0 = L;
    }
  }

  rtb_Gain7_j = (AutopilotLaws_P.Gain_Gain_b0 * rtb_Gain7_j - AutopilotLaws_DWork.DelayInput1_DSTATE) + result_idx_1_0;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_a * AutopilotLaws_U.in.data.H_dot_ft_min;
  u0 = AutopilotLaws_P.kntoms_Gain_p * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_h) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_h;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_e) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_e;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / u0) *
    AutopilotLaws_P.Gain_Gain_d4;
  result_idx_1_0 = AutopilotLaws_P.Gain1_Gain_j0 * rtb_GainTheta1;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_h * (AutopilotLaws_P.GStoGS_CAS_Gain_m *
    (AutopilotLaws_P.ktstomps_Gain_g * AutopilotLaws_U.in.data.V_gnd_kn)), AutopilotLaws_P.WashoutFilter_C1_e4,
    AutopilotLaws_U.in.time.dt, &rtb_Y_hn, &AutopilotLaws_DWork.sf_WashoutFilter_d);
  u0 = AutopilotLaws_P.kntoms_Gain_l * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_i) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_i;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_h) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_h;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_hn - AutopilotLaws_P.g_Gain_h * (AutopilotLaws_P.Gain1_Gain_dv *
    (AutopilotLaws_P.Gain_Gain_id * ((AutopilotLaws_P.Gain1_Gain_kd * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_o4 *
    (AutopilotLaws_P.Gain_Gain_bs * std::atan(AutopilotLaws_P.fpmtoms_Gain_c * AutopilotLaws_U.in.data.H_dot_ft_min / u0)))
    * (AutopilotLaws_P.Constant_Value_c - std::cos(result_idx_1_0)) + std::sin(result_idx_1_0) * std::sin
    (AutopilotLaws_P.Gain1_Gain_bk * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_lxx *
     AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_e,
    AutopilotLaws_P.HighPassFilter_C2_c, AutopilotLaws_P.HighPassFilter_C3_f, AutopilotLaws_P.HighPassFilter_C4_c,
    AutopilotLaws_U.in.time.dt, &L, &AutopilotLaws_DWork.sf_LeadLagFilter_h);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_i * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_n, AutopilotLaws_P.LowPassFilter_C2_a, AutopilotLaws_P.LowPassFilter_C3_o,
    AutopilotLaws_P.LowPassFilter_C4_o, AutopilotLaws_U.in.time.dt, &rtb_Y_hn, &AutopilotLaws_DWork.sf_LeadLagFilter_m);
  result_idx_1_0 = (L + rtb_Y_hn) * AutopilotLaws_P.ug_Gain_a;
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_hm * AutopilotLaws_DWork.DelayInput1_DSTATE;
  b_L = result_idx_1_0 + rtb_Divide;
  a = AutopilotLaws_P.Constant1_Value_b4 - AutopilotLaws_P.Constant2_Value_c;
  L = (AutopilotLaws_P.Gain1_Gain_mz * result_idx_1_0 + rtb_Divide) * AutopilotLaws_P.Gain_Gain_ie;
  if (a > AutopilotLaws_P.Switch_Threshold_b) {
    result_idx_1_0 = AutopilotLaws_P.Constant1_Value_a;
  } else {
    result_idx_1_0 = AutopilotLaws_P.Gain5_Gain_l * L;
  }

  Phi1 = (AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.data.VMAX_kn) * AutopilotLaws_P.Gain1_Gain_f1;
  if (Phi1 <= result_idx_1_0) {
    if (a > AutopilotLaws_P.Switch1_Threshold_f) {
      result_idx_1_0 = AutopilotLaws_P.Constant_Value_p0;
    } else {
      result_idx_1_0 = AutopilotLaws_P.Gain6_Gain_j * L;
    }

    if (Phi1 >= result_idx_1_0) {
      result_idx_1_0 = Phi1;
    }
  }

  result_idx_1_0 += AutopilotLaws_P.Gain_Gain_kj * b_L - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_SpeedProtectionSignalSelection(&rtb_BusAssignment, rtb_Y_co, AutopilotLaws_P.VS_Gain * rtb_Y_co,
    rtb_Gain7_j, AutopilotLaws_P.Gain_Gain_m0 * rtb_Gain7_j, result_idx_1_0, AutopilotLaws_P.Gain_Gain_lr *
    result_idx_1_0, AutopilotLaws_P.Constant_Value_ig, &a, &b_L);
  Phi1 = AutopilotLaws_U.in.input.H_c_ft - AutopilotLaws_U.in.data.H_ind_ft;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_p * AutopilotLaws_U.in.data.H_dot_ft_min;
  u0 = AutopilotLaws_P.kntoms_Gain_f * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_eik) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_eik;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_ad) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_ad;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / u0) *
    AutopilotLaws_P.Gain_Gain_e33;
  result_idx_1_0 = AutopilotLaws_P.Gain1_Gain_ok * AutopilotLaws_DWork.DelayInput1_DSTATE;
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_jd * rtb_GainTheta1;
  rtb_Y_co = std::cos(rtb_Divide);
  L = std::sin(rtb_Divide);
  rtb_Gain7_j = AutopilotLaws_P.Gain1_Gain_id * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_Divide = AutopilotLaws_P.ktstomps_Gain_f * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_m * (AutopilotLaws_P.GStoGS_CAS_Gain_l * rtb_Divide),
    AutopilotLaws_P.WashoutFilter_C1_k, AutopilotLaws_U.in.time.dt, &rtb_Divide, &AutopilotLaws_DWork.sf_WashoutFilter_n);
  u0 = AutopilotLaws_P.kntoms_Gain_a * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_f) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_f;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_c) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_c;
  }

  AutopilotLaws_LeadLagFilter(rtb_Divide - AutopilotLaws_P.g_Gain_j * (AutopilotLaws_P.Gain1_Gain_ca *
    (AutopilotLaws_P.Gain_Gain_ms * ((AutopilotLaws_P.Gain1_Gain_dh * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_cv *
    (AutopilotLaws_P.Gain_Gain_nq * std::atan(AutopilotLaws_P.fpmtoms_Gain_h * AutopilotLaws_U.in.data.H_dot_ft_min / u0)))
    * (AutopilotLaws_P.Constant_Value_l - rtb_Y_co) + L * std::sin(rtb_Gain7_j - AutopilotLaws_P.Gain1_Gain_ct *
    AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_b,
    AutopilotLaws_P.HighPassFilter_C2_g, AutopilotLaws_P.HighPassFilter_C3_n, AutopilotLaws_P.HighPassFilter_C4_b,
    AutopilotLaws_U.in.time.dt, &rtb_Gain7_j, &AutopilotLaws_DWork.sf_LeadLagFilter_es);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_j * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_d, AutopilotLaws_P.LowPassFilter_C2_p, AutopilotLaws_P.LowPassFilter_C3_a,
    AutopilotLaws_P.LowPassFilter_C4_b, AutopilotLaws_U.in.time.dt, &rtb_Divide,
    &AutopilotLaws_DWork.sf_LeadLagFilter_ja);
  rtb_Divide = (rtb_Gain7_j + rtb_Divide) * AutopilotLaws_P.ug_Gain_o;
  rtb_Y_co = (AutopilotLaws_P.Gain1_Gain_hu * rtb_Divide + result_idx_1_0) * AutopilotLaws_P.Gain_Gain_bn;
  AutopilotLaws_Voter1(AutopilotLaws_U.in.data.VLS_kn, AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VMAX_kn,
                       &rtb_Gain7_j);
  rtb_Gain7_j = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Gain7_j) * AutopilotLaws_P.Gain1_Gain_hz;
  rtb_Compare_jy = ((Phi1 > AutopilotLaws_P.CompareToConstant6_const) && (rtb_Y_co <
    AutopilotLaws_P.CompareToConstant5_const_a) && (rtb_Gain7_j < AutopilotLaws_P.CompareToConstant2_const_d) &&
                    (result_idx_2 == AutopilotLaws_P.CompareToConstant2_const_e));
  L = rtb_Divide + result_idx_1_0;
  if (rtb_Compare_jy) {
    result_idx_1_0 = AutopilotLaws_P.Constant_Value_f;
  } else {
    if (Phi1 > AutopilotLaws_P.CompareToConstant_const_l) {
      result_idx_1_0 = AutopilotLaws_P.Constant1_Value_c;
    } else {
      result_idx_1_0 = AutopilotLaws_P.Gain5_Gain_k * rtb_Y_co;
    }

    if (rtb_Gain7_j <= result_idx_1_0) {
      if (Phi1 > AutopilotLaws_P.CompareToConstant4_const_o) {
        result_idx_1_0 = std::fmax(AutopilotLaws_P.Constant2_Value, AutopilotLaws_P.Gain1_Gain_kg * rtb_Y_co);
      } else {
        result_idx_1_0 = AutopilotLaws_P.Gain6_Gain_a * rtb_Y_co;
      }

      if (rtb_Gain7_j >= result_idx_1_0) {
        result_idx_1_0 = rtb_Gain7_j;
      }
    }
  }

  Phi2 = (AutopilotLaws_P.Gain_Gain_d4y * L - AutopilotLaws_DWork.DelayInput1_DSTATE) + result_idx_1_0;
  AutopilotLaws_DWork.DelayInput1_DSTATE = static_cast<real_T>(low_i) * AutopilotLaws_P.Constant3_Value_ix;
  AutopilotLaws_DWork.DelayInput1_DSTATE -= AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Y_co = AutopilotLaws_P.ftmintoms_Gain_d * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_n * AutopilotLaws_U.in.data.V_tas_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_ju) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_ju;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_gw) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_gw;
  }

  u0 = rtb_Y_co / AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (u0 > 1.0) {
    u0 = 1.0;
  } else if (u0 < -1.0) {
    u0 = -1.0;
  }

  rtb_lo_o = AutopilotLaws_P.Gain_Gain_nz * std::asin(u0);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.input.H_dot_c_fpm - AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Y_co = AutopilotLaws_P.ftmintoms_Gain_l * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_au * AutopilotLaws_U.in.data.V_tas_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_l) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_l;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_hm) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_hm;
  }

  u0 = rtb_Y_co / AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (u0 > 1.0) {
    u0 = 1.0;
  } else if (u0 < -1.0) {
    u0 = -1.0;
  }

  rtb_Y_co = AutopilotLaws_P.Gain_Gain_ey * std::asin(u0);
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
    u0 = 0.3;
  } else if (AutopilotLaws_DWork.islevelOffActive) {
    u0 = 0.1;
  } else {
    u0 = 0.05;
  }

  rtb_lo = 9.81 / (AutopilotLaws_U.in.data.V_tas_kn * 0.51444444444444448) * u0 * 57.295779513082323;
  AutopilotLaws_DWork.prevVerticalLaw = AutopilotLaws_U.in.input.vertical_law;
  AutopilotLaws_DWork.prevTarget = AutopilotLaws_U.in.input.H_dot_c_fpm;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_o * AutopilotLaws_U.in.data.H_dot_ft_min;
  u0 = AutopilotLaws_P.kntoms_Gain_o * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_fr) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_fr;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_cd) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_cd;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / u0) *
    AutopilotLaws_P.Gain_Gain_lx;
  result_idx_1_0 = AutopilotLaws_P.Gain1_Gain_hi * rtb_GainTheta1;
  rtb_Gain7_j = std::cos(result_idx_1_0);
  L = std::sin(result_idx_1_0);
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_hg * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  result_idx_1_0 = AutopilotLaws_P.ktstomps_Gain_m * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_k * (AutopilotLaws_P.GStoGS_CAS_Gain_k * result_idx_1_0),
    AutopilotLaws_P.WashoutFilter_C1_o, AutopilotLaws_U.in.time.dt, &result_idx_1_0,
    &AutopilotLaws_DWork.sf_WashoutFilter_fs);
  u0 = AutopilotLaws_P.kntoms_Gain_d * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_hb) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_hb;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_k) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_k;
  }

  AutopilotLaws_LeadLagFilter(result_idx_1_0 - AutopilotLaws_P.g_Gain_m * (AutopilotLaws_P.Gain1_Gain_kdq *
    (AutopilotLaws_P.Gain_Gain_b5 * ((AutopilotLaws_P.Gain1_Gain_jn * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_ps *
    (AutopilotLaws_P.Gain_Gain_in * std::atan(AutopilotLaws_P.fpmtoms_Gain_e * AutopilotLaws_U.in.data.H_dot_ft_min / u0)))
    * (AutopilotLaws_P.Constant_Value_od - rtb_Gain7_j) + L * std::sin(rtb_Divide - AutopilotLaws_P.Gain1_Gain_da *
    AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_g,
    AutopilotLaws_P.HighPassFilter_C2_l, AutopilotLaws_P.HighPassFilter_C3_j, AutopilotLaws_P.HighPassFilter_C4_i,
    AutopilotLaws_U.in.time.dt, &rtb_Divide, &AutopilotLaws_DWork.sf_LeadLagFilter_b);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_c * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_m, AutopilotLaws_P.LowPassFilter_C2_l, AutopilotLaws_P.LowPassFilter_C3_i,
    AutopilotLaws_P.LowPassFilter_C4_k, AutopilotLaws_U.in.time.dt, &result_idx_1_0,
    &AutopilotLaws_DWork.sf_LeadLagFilter_kq);
  result_idx_1_0 = (rtb_Divide + result_idx_1_0) * AutopilotLaws_P.ug_Gain_aa;
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_gf * AutopilotLaws_DWork.DelayInput1_DSTATE;
  rtb_Gain7_j = result_idx_1_0 + rtb_Divide;
  L = AutopilotLaws_P.Constant3_Value_h1 - AutopilotLaws_P.Constant4_Value_f;
  rtb_Y_i = (AutopilotLaws_P.Gain1_Gain_ov * result_idx_1_0 + rtb_Divide) * AutopilotLaws_P.Gain_Gain_jy;
  if (L > AutopilotLaws_P.Switch_Threshold_o) {
    result_idx_1_0 = AutopilotLaws_P.Constant1_Value_m5;
  } else {
    result_idx_1_0 = AutopilotLaws_P.Gain5_Gain_h * rtb_Y_i;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &rtb_Divide);
  rtb_Divide = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Divide) * AutopilotLaws_P.Gain1_Gain_dvi;
  if (rtb_Divide <= result_idx_1_0) {
    if (L > AutopilotLaws_P.Switch1_Threshold_c) {
      result_idx_1_0 = AutopilotLaws_P.Constant_Value_b;
    } else {
      result_idx_1_0 = AutopilotLaws_P.Gain6_Gain_ai * rtb_Y_i;
    }

    if (rtb_Divide >= result_idx_1_0) {
      result_idx_1_0 = rtb_Divide;
    }
  }

  rtb_Gain7_j = (AutopilotLaws_P.Gain_Gain_j * rtb_Gain7_j - AutopilotLaws_DWork.DelayInput1_DSTATE) + result_idx_1_0;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_p3 * AutopilotLaws_U.in.data.H_dot_ft_min;
  u0 = AutopilotLaws_P.kntoms_Gain_bq * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_ba) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_ba;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_pk) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_pk;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / u0) *
    AutopilotLaws_P.Gain_Gain_py;
  result_idx_1_0 = AutopilotLaws_P.Gain1_Gain_er * rtb_GainTheta1;
  L = std::cos(result_idx_1_0);
  rtb_Y_i = std::sin(result_idx_1_0);
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_ero * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  result_idx_1_0 = AutopilotLaws_P.ktstomps_Gain_a * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_i * (AutopilotLaws_P.GStoGS_CAS_Gain_n * result_idx_1_0),
    AutopilotLaws_P.WashoutFilter_C1_p, AutopilotLaws_U.in.time.dt, &result_idx_1_0,
    &AutopilotLaws_DWork.sf_WashoutFilter_j);
  u0 = AutopilotLaws_P.kntoms_Gain_l5 * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_b3) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_b3;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_es) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_es;
  }

  AutopilotLaws_LeadLagFilter(result_idx_1_0 - AutopilotLaws_P.g_Gain_g * (AutopilotLaws_P.Gain1_Gain_hv *
    (AutopilotLaws_P.Gain_Gain_mx * ((AutopilotLaws_P.Gain1_Gain_hk * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_ja *
    (AutopilotLaws_P.Gain_Gain_e5 * std::atan(AutopilotLaws_P.fpmtoms_Gain_j * AutopilotLaws_U.in.data.H_dot_ft_min / u0)))
    * (AutopilotLaws_P.Constant_Value_ia - L) + rtb_Y_i * std::sin(rtb_Divide - AutopilotLaws_P.Gain1_Gain_fl *
    AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_n,
    AutopilotLaws_P.HighPassFilter_C2_m, AutopilotLaws_P.HighPassFilter_C3_k, AutopilotLaws_P.HighPassFilter_C4_h,
    AutopilotLaws_U.in.time.dt, &rtb_Divide, &AutopilotLaws_DWork.sf_LeadLagFilter_c);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_o * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_l, AutopilotLaws_P.LowPassFilter_C2_c, AutopilotLaws_P.LowPassFilter_C3_g,
    AutopilotLaws_P.LowPassFilter_C4_d, AutopilotLaws_U.in.time.dt, &result_idx_1_0,
    &AutopilotLaws_DWork.sf_LeadLagFilter_p);
  result_idx_1_0 = (rtb_Divide + result_idx_1_0) * AutopilotLaws_P.ug_Gain_f;
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_ot * AutopilotLaws_DWork.DelayInput1_DSTATE;
  L = result_idx_1_0 + rtb_Divide;
  rtb_Y_i = AutopilotLaws_P.Constant1_Value_d - AutopilotLaws_P.Constant2_Value_k;
  rtb_Divide = (AutopilotLaws_P.Gain1_Gain_ou * result_idx_1_0 + rtb_Divide) * AutopilotLaws_P.Gain_Gain_jg;
  if (rtb_Y_i > AutopilotLaws_P.Switch_Threshold_a) {
    result_idx_1_0 = AutopilotLaws_P.Constant1_Value_mi;
  } else {
    result_idx_1_0 = AutopilotLaws_P.Gain5_Gain_gm * rtb_Divide;
  }

  rtb_Sum_if = (AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.data.VMAX_kn) * AutopilotLaws_P.Gain1_Gain_gy;
  if (rtb_Sum_if <= result_idx_1_0) {
    if (rtb_Y_i > AutopilotLaws_P.Switch1_Threshold_b) {
      result_idx_1_0 = AutopilotLaws_P.Constant_Value_ow;
    } else {
      result_idx_1_0 = AutopilotLaws_P.Gain6_Gain_c * rtb_Divide;
    }

    if (rtb_Sum_if >= result_idx_1_0) {
      result_idx_1_0 = rtb_Sum_if;
    }
  }

  result_idx_1_0 += AutopilotLaws_P.Gain_Gain_dm * L - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_SpeedProtectionSignalSelection(&rtb_BusAssignment, rtb_Y_co, std::fmax(-rtb_lo, std::fmin(rtb_lo,
    AutopilotLaws_P.VS_Gain_h * rtb_Y_co)), rtb_Gain7_j, AutopilotLaws_P.Gain_Gain_h4 * rtb_Gain7_j, result_idx_1_0,
    AutopilotLaws_P.Gain_Gain_eq * result_idx_1_0, AutopilotLaws_P.Constant_Value_ga, &rtb_FD, &rtb_Sum_if);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_ps * AutopilotLaws_U.in.data.H_dot_ft_min;
  u0 = AutopilotLaws_P.kntoms_Gain_c * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_oz) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_oz;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_ou) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_ou;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / u0) *
    AutopilotLaws_P.Gain_Gain_gt;
  rtb_Y_co = AutopilotLaws_U.in.input.FPA_c_deg - AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (!AutopilotLaws_DWork.prevVerticalLaw_not_empty_f) {
    AutopilotLaws_DWork.prevVerticalLaw_g = AutopilotLaws_U.in.input.vertical_law;
    AutopilotLaws_DWork.prevVerticalLaw_not_empty_f = true;
  }

  if (!AutopilotLaws_DWork.prevTarget_not_empty_i) {
    AutopilotLaws_DWork.prevTarget_h = AutopilotLaws_U.in.input.FPA_c_deg;
    AutopilotLaws_DWork.prevTarget_not_empty_i = true;
  }

  AutopilotLaws_DWork.islevelOffActive_g = (((AutopilotLaws_U.in.input.vertical_law == 5.0) &&
    (AutopilotLaws_DWork.prevVerticalLaw_g != 5.0) && (AutopilotLaws_U.in.input.FPA_c_deg == 0.0)) ||
    ((AutopilotLaws_U.in.input.FPA_c_deg == 0.0) && (AutopilotLaws_DWork.prevTarget_h > 1.0)) ||
    ((AutopilotLaws_U.in.input.FPA_c_deg == 0.0) && (AutopilotLaws_U.in.input.vertical_law == 5.0) &&
     AutopilotLaws_DWork.islevelOffActive_g));
  if (AutopilotLaws_DWork.islevelOffActive_g) {
    u0 = 0.1;
  } else {
    u0 = 0.05;
  }

  rtb_lo = 9.81 / (AutopilotLaws_U.in.data.V_tas_kn * 0.51444444444444448) * u0 * 57.295779513082323;
  AutopilotLaws_DWork.prevVerticalLaw_g = AutopilotLaws_U.in.input.vertical_law;
  AutopilotLaws_DWork.prevTarget_h = AutopilotLaws_U.in.input.FPA_c_deg;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_d * AutopilotLaws_U.in.data.H_dot_ft_min;
  u0 = AutopilotLaws_P.kntoms_Gain_cv * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_bb) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_bb;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_a4) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_a4;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / u0) *
    AutopilotLaws_P.Gain_Gain_hv;
  result_idx_1_0 = AutopilotLaws_P.Gain1_Gain_gfa * rtb_GainTheta1;
  rtb_Gain7_j = std::cos(result_idx_1_0);
  L = std::sin(result_idx_1_0);
  result_idx_1_0 = AutopilotLaws_P.ktstomps_Gain_j4 * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_kb * (AutopilotLaws_P.GStoGS_CAS_Gain_o * result_idx_1_0),
    AutopilotLaws_P.WashoutFilter_C1_j, AutopilotLaws_U.in.time.dt, &rtb_Y_kt, &AutopilotLaws_DWork.sf_WashoutFilter_h);
  u0 = AutopilotLaws_P.kntoms_Gain_k * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_pj) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_pj;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_py) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_py;
  }

  AutopilotLaws_LeadLagFilter(rtb_Y_kt - AutopilotLaws_P.g_Gain_l * (AutopilotLaws_P.Gain1_Gain_n4 *
    (AutopilotLaws_P.Gain_Gain_bc * ((AutopilotLaws_P.Gain1_Gain_ej * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_jv *
    (AutopilotLaws_P.Gain_Gain_bf * std::atan(AutopilotLaws_P.fpmtoms_Gain_f * AutopilotLaws_U.in.data.H_dot_ft_min / u0)))
    * (AutopilotLaws_P.Constant_Value_lf - rtb_Gain7_j) + L * std::sin(AutopilotLaws_P.Gain1_Gain_j4 *
    AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_kw *
    AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_i,
    AutopilotLaws_P.HighPassFilter_C2_h, AutopilotLaws_P.HighPassFilter_C3_m, AutopilotLaws_P.HighPassFilter_C4_n,
    AutopilotLaws_U.in.time.dt, &result_idx_1_0, &AutopilotLaws_DWork.sf_LeadLagFilter_e);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_k * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_l4, AutopilotLaws_P.LowPassFilter_C2_po, AutopilotLaws_P.LowPassFilter_C3_f,
    AutopilotLaws_P.LowPassFilter_C4_dt, AutopilotLaws_U.in.time.dt, &rtb_Y_kt, &AutopilotLaws_DWork.sf_LeadLagFilter_kp);
  result_idx_1_0 = (result_idx_1_0 + rtb_Y_kt) * AutopilotLaws_P.ug_Gain_n;
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_b1 * AutopilotLaws_DWork.DelayInput1_DSTATE;
  rtb_Gain7_j = result_idx_1_0 + rtb_Divide;
  L = AutopilotLaws_P.Constant3_Value_nk - AutopilotLaws_P.Constant4_Value_o;
  rtb_Y_i = (AutopilotLaws_P.Gain1_Gain_on * result_idx_1_0 + rtb_Divide) * AutopilotLaws_P.Gain_Gain_hy;
  if (L > AutopilotLaws_P.Switch_Threshold_d) {
    result_idx_1_0 = AutopilotLaws_P.Constant1_Value_m;
  } else {
    result_idx_1_0 = AutopilotLaws_P.Gain5_Gain_b * rtb_Y_i;
  }

  AutopilotLaws_V_LSSpeedSelection1(AutopilotLaws_U.in.input.V_c_kn, AutopilotLaws_U.in.data.VLS_kn, &rtb_Y_kt);
  rtb_Divide = (AutopilotLaws_U.in.data.V_ias_kn - rtb_Y_kt) * AutopilotLaws_P.Gain1_Gain_m1;
  if (rtb_Divide <= result_idx_1_0) {
    if (L > AutopilotLaws_P.Switch1_Threshold_d) {
      result_idx_1_0 = AutopilotLaws_P.Constant_Value_p0d;
    } else {
      result_idx_1_0 = AutopilotLaws_P.Gain6_Gain_n * rtb_Y_i;
    }

    if (rtb_Divide >= result_idx_1_0) {
      result_idx_1_0 = rtb_Divide;
    }
  }

  L = (AutopilotLaws_P.Gain_Gain_d0 * rtb_Gain7_j - AutopilotLaws_DWork.DelayInput1_DSTATE) + result_idx_1_0;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_o2 * AutopilotLaws_U.in.data.H_dot_ft_min;
  u0 = AutopilotLaws_P.kntoms_Gain_hi * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_cv) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_cv;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_hd) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_hd;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / u0) *
    AutopilotLaws_P.Gain_Gain_pp;
  rtb_Gain7_j = AutopilotLaws_P.kntoms_Gain_i * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Gain7_j > AutopilotLaws_P.Saturation_UpperSat_nu) {
    rtb_Gain7_j = AutopilotLaws_P.Saturation_UpperSat_nu;
  } else if (rtb_Gain7_j < AutopilotLaws_P.Saturation_LowerSat_ae) {
    rtb_Gain7_j = AutopilotLaws_P.Saturation_LowerSat_ae;
  }

  result_idx_1_0 = AutopilotLaws_P.Gain1_Gain_ky * rtb_GainTheta1;
  rtb_Y_i = std::cos(result_idx_1_0);
  rtb_Divide = std::sin(result_idx_1_0);
  result_idx_1_0 = AutopilotLaws_P.ktstomps_Gain_l * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_ip * (AutopilotLaws_P.GStoGS_CAS_Gain_e * result_idx_1_0),
    AutopilotLaws_P.WashoutFilter_C1_c, AutopilotLaws_U.in.time.dt, &rtb_Y_kt, &AutopilotLaws_DWork.sf_WashoutFilter_g5);
  AutopilotLaws_LeadLagFilter(rtb_Y_kt - AutopilotLaws_P.g_Gain_hq * (AutopilotLaws_P.Gain1_Gain_mx *
    (AutopilotLaws_P.Gain_Gain_d3 * ((AutopilotLaws_P.Gain1_Gain_iw * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_lw *
    (AutopilotLaws_P.Gain_Gain_ej * std::atan(AutopilotLaws_P.fpmtoms_Gain_hz * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Gain7_j))) * (AutopilotLaws_P.Constant_Value_fo - rtb_Y_i) + rtb_Divide * std::sin(AutopilotLaws_P.Gain1_Gain_ip
    * AutopilotLaws_U.in.data.Psi_magnetic_track_deg - AutopilotLaws_P.Gain1_Gain_nrn *
    AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_d,
    AutopilotLaws_P.HighPassFilter_C2_i, AutopilotLaws_P.HighPassFilter_C3_d, AutopilotLaws_P.HighPassFilter_C4_nr,
    AutopilotLaws_U.in.time.dt, &result_idx_1_0, &AutopilotLaws_DWork.sf_LeadLagFilter_j);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_mh * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_e, AutopilotLaws_P.LowPassFilter_C2_i, AutopilotLaws_P.LowPassFilter_C3_o5,
    AutopilotLaws_P.LowPassFilter_C4_f, AutopilotLaws_U.in.time.dt, &rtb_Y_kt, &AutopilotLaws_DWork.sf_LeadLagFilter_a);
  result_idx_1_0 = (result_idx_1_0 + rtb_Y_kt) * AutopilotLaws_P.ug_Gain_e;
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_be * AutopilotLaws_DWork.DelayInput1_DSTATE;
  rtb_Gain7_j = result_idx_1_0 + rtb_Divide;
  rtb_Y_i = AutopilotLaws_P.Constant1_Value_o - AutopilotLaws_P.Constant2_Value_h;
  rtb_Divide = (AutopilotLaws_P.Gain1_Gain_nj * result_idx_1_0 + rtb_Divide) * AutopilotLaws_P.Gain_Gain_aq;
  if (rtb_Y_i > AutopilotLaws_P.Switch_Threshold_g) {
    result_idx_1_0 = AutopilotLaws_P.Constant1_Value_f;
  } else {
    result_idx_1_0 = AutopilotLaws_P.Gain5_Gain_a * rtb_Divide;
  }

  rtb_Y_hn = (AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.data.VMAX_kn) * AutopilotLaws_P.Gain1_Gain_fle;
  if (rtb_Y_hn <= result_idx_1_0) {
    if (rtb_Y_i > AutopilotLaws_P.Switch1_Threshold_h) {
      result_idx_1_0 = AutopilotLaws_P.Constant_Value_i;
    } else {
      result_idx_1_0 = AutopilotLaws_P.Gain6_Gain_g * rtb_Divide;
    }

    if (rtb_Y_hn >= result_idx_1_0) {
      result_idx_1_0 = rtb_Y_hn;
    }
  }

  rtb_Gain7_j = (AutopilotLaws_P.Gain_Gain_gx * rtb_Gain7_j - AutopilotLaws_DWork.DelayInput1_DSTATE) + result_idx_1_0;
  AutopilotLaws_SpeedProtectionSignalSelection(&rtb_BusAssignment, rtb_Y_co, std::fmax(-rtb_lo, std::fmin(rtb_lo,
    AutopilotLaws_P.Gain_Gain_c3 * rtb_Y_co)), L, AutopilotLaws_P.Gain_Gain_fnw * L, rtb_Gain7_j,
    AutopilotLaws_P.Gain_Gain_ko * rtb_Gain7_j, AutopilotLaws_P.Constant_Value_fov, &rtb_FD_gn, &rtb_AP_g);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain2_Gain_n * AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Gain_a0 = AutopilotLaws_P.DiscreteDerivativeVariableTs1_Gain * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Gain_a0 - AutopilotLaws_DWork.Delay_DSTATE_c;
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.DelayInput1_DSTATE / AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.LagFilter2_C1_d, AutopilotLaws_U.in.time.dt, &result_idx_1_0, &AutopilotLaws_DWork.sf_LagFilter_f);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_ox * result_idx_1;
  result_idx_1 = std::tan(AutopilotLaws_DWork.DelayInput1_DSTATE);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kn2ms_Gain * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_LagFilter(AutopilotLaws_P.Gain_Gain_os * (result_idx_1 * AutopilotLaws_DWork.DelayInput1_DSTATE),
    AutopilotLaws_P.LagFilter3_C1, AutopilotLaws_U.in.time.dt, &AutopilotLaws_DWork.DelayInput1_DSTATE,
    &AutopilotLaws_DWork.sf_LagFilter_l);
  AutopilotLaws_LagFilter(result_idx_1_0 - AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.LagFilter4_C1,
    AutopilotLaws_U.in.time.dt, &result_idx_1_0, &AutopilotLaws_DWork.sf_LagFilter_i);
  AutopilotLaws_WashoutFilter(result_idx_1_0, AutopilotLaws_P.WashoutFilter1_C1, AutopilotLaws_U.in.time.dt,
    &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_WashoutFilter_db);
  AutopilotLaws_DWork.DelayInput1_DSTATE *= AutopilotLaws_P.Gain4_Gain_n;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_ko) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_ko;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_ez) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_ez;
  }

  result_idx_1 = AutopilotLaws_P.Gain2_Gain_k * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_gs_error_deg, AutopilotLaws_P.LagFilter1_C1_l,
    AutopilotLaws_U.in.time.dt, &result_idx_1_0, &AutopilotLaws_DWork.sf_LagFilter_gx);
  AutopilotLaws_DWork.DelayInput1_DSTATE = look1_binlxpw(rtb_BusAssignment.data.H_radio_ft,
    AutopilotLaws_P.ScheduledGain_BreakpointsForDimension1_a, AutopilotLaws_P.ScheduledGain_Table_j, 7U);
  rtb_Y_co = result_idx_1_0 * AutopilotLaws_DWork.DelayInput1_DSTATE * AutopilotLaws_P.Gain_Gain_gm;
  rtb_OR1 = ((AutopilotLaws_U.in.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK_const) ||
             (AutopilotLaws_U.in.input.vertical_mode == AutopilotLaws_P.CompareGSTRACK2_const));
  AutopilotLaws_RateLimiter_n(rtb_OR1, AutopilotLaws_P.RateLimiterVariableTs_up_d,
    AutopilotLaws_P.RateLimiterVariableTs_lo_c, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_m, &AutopilotLaws_DWork.DelayInput1_DSTATE,
    &AutopilotLaws_DWork.sf_RateLimiter_l);
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_j1) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_j1;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_nq) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_nq;
  }

  rtb_Y_co = (result_idx_1 + rtb_Y_co) * AutopilotLaws_DWork.DelayInput1_DSTATE;
  L = AutopilotLaws_P.Constant_Value_lu - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.nav_gs_error_deg, AutopilotLaws_P.LagFilter2_C1_e,
    AutopilotLaws_U.in.time.dt, &rtb_Y_kt, &AutopilotLaws_DWork.sf_LagFilter_cf);
  result_idx_1 = AutopilotLaws_P.DiscreteDerivativeVariableTs_Gain_g * rtb_Y_kt;
  AutopilotLaws_DWork.DelayInput1_DSTATE = result_idx_1 - AutopilotLaws_DWork.Delay_DSTATE_b;
  AutopilotLaws_DWork.DelayInput1_DSTATE /= AutopilotLaws_U.in.time.dt;
  result_idx_1_0 = look1_binlxpw(rtb_BusAssignment.data.H_radio_ft,
    AutopilotLaws_P.ScheduledGain3_BreakpointsForDimension1_i, AutopilotLaws_P.ScheduledGain3_Table_a, 4U);
  AutopilotLaws_LagFilter(rtb_Y_kt + AutopilotLaws_DWork.DelayInput1_DSTATE * result_idx_1_0,
    AutopilotLaws_P.LagFilter_C1_d, AutopilotLaws_U.in.time.dt, &result_idx_1_0, &AutopilotLaws_DWork.sf_LagFilter_p);
  AutopilotLaws_DWork.DelayInput1_DSTATE = look1_binlxpw(rtb_BusAssignment.data.H_radio_ft,
    AutopilotLaws_P.ScheduledGain2_BreakpointsForDimension1_h, AutopilotLaws_P.ScheduledGain2_Table_p, 7U);
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain3_Gain_c * (rtb_Y_co + L * (result_idx_1_0 *
    AutopilotLaws_DWork.DelayInput1_DSTATE)), ((rtb_BusAssignment.data.H_radio_ft >
    AutopilotLaws_P.CompareToConstant_const_kt) && AutopilotLaws_U.in.data.nav_gs_valid), &rtb_Gain7_j);
  AutopilotLaws_storevalue((result_idx_2 == AutopilotLaws_P.CompareToConstant6_const_e),
    rtb_BusAssignment.data.nav_gs_deg, &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_storevalue_g);
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_e0) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_e0;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_ph) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_ph;
  }

  rtb_Divide = AutopilotLaws_P.kntoms_Gain_k4 * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Divide > AutopilotLaws_P.Saturation_UpperSat_eb) {
    rtb_Divide = AutopilotLaws_P.Saturation_UpperSat_eb;
  } else if (rtb_Divide < AutopilotLaws_P.Saturation_LowerSat_gk) {
    rtb_Divide = AutopilotLaws_P.Saturation_LowerSat_gk;
  }

  result_idx_1_0 = std::atan(AutopilotLaws_P.fpmtoms_Gain_g4 * AutopilotLaws_U.in.data.H_dot_ft_min / rtb_Divide) *
    AutopilotLaws_P.Gain_Gain_ow;
  AutopilotLaws_SignalEnablerGSTrack(AutopilotLaws_P.Gain2_Gain_l * (AutopilotLaws_DWork.DelayInput1_DSTATE -
    result_idx_1_0), rtb_OR1, &rtb_Divide);
  AutopilotLaws_Voter1(rtb_Gain7_j + rtb_Divide, AutopilotLaws_P.Gain1_Gain_d4 *
                       ((AutopilotLaws_DWork.DelayInput1_DSTATE + AutopilotLaws_P.Bias_Bias_k) - result_idx_1_0),
                       AutopilotLaws_P.Gain_Gain_eyl * ((AutopilotLaws_DWork.DelayInput1_DSTATE +
    AutopilotLaws_P.Bias1_Bias) - result_idx_1_0), &rtb_Y_co);
  AutopilotLaws_DWork.DelayInput1_DSTATE = look1_binlxpw(AutopilotLaws_U.in.data.V_tas_kn,
    AutopilotLaws_P.ScheduledGain1_BreakpointsForDimension1_d, AutopilotLaws_P.ScheduledGain1_Table_n, 6U);
  rtb_Product_dh = rtb_Y_co * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_GainTheta - AutopilotLaws_P.Constant2_Value_f;
  rtb_Gain4 = AutopilotLaws_P.Gain4_Gain_o * AutopilotLaws_DWork.DelayInput1_DSTATE;
  rtb_Y_kt = AutopilotLaws_P.Gain5_Gain_c * AutopilotLaws_U.in.data.bz_m_s2;
  AutopilotLaws_WashoutFilter(AutopilotLaws_U.in.data.bx_m_s2, AutopilotLaws_P.WashoutFilter_C1_m,
    AutopilotLaws_U.in.time.dt, &rtb_Y_i, &AutopilotLaws_DWork.sf_WashoutFilter_g);
  rtb_OR1 = (result_idx_2 == AutopilotLaws_P.CompareToConstant7_const);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntofpm_Gain * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_DWork.DelayInput1_DSTATE *= AutopilotLaws_P.maxslope_Gain;
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.data.H_dot_ft_min, AutopilotLaws_P.LagFilterH_C1,
    AutopilotLaws_U.in.time.dt, &L, &AutopilotLaws_DWork.sf_LagFilter_a);
  result_idx_1_0 = L - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_LeadLagFilter(rtb_BusAssignment.data.H_radio_ft, AutopilotLaws_P.LeadLagFilter_C1,
    AutopilotLaws_P.LeadLagFilter_C2, AutopilotLaws_P.LeadLagFilter_C3, AutopilotLaws_P.LeadLagFilter_C4,
    AutopilotLaws_U.in.time.dt, &rtb_Y_hn, &AutopilotLaws_DWork.sf_LeadLagFilter_k);
  rtb_Divide = AutopilotLaws_P.Gain1_Gain_oa * rtb_Y_hn;
  AutopilotLaws_DWork.DelayInput1_DSTATE += L;
  rtb_MaxH_dot_RA1 = std::fmin(std::fmax(result_idx_1_0, rtb_Divide), AutopilotLaws_DWork.DelayInput1_DSTATE);
  if (!AutopilotLaws_DWork.wasActive_not_empty) {
    AutopilotLaws_DWork.wasActive = rtb_OR1;
    AutopilotLaws_DWork.wasActive_not_empty = true;
  }

  if ((!AutopilotLaws_DWork.wasActive) && rtb_OR1) {
    rtb_Y_co = std::abs(rtb_MaxH_dot_RA1) / 60.0;
    AutopilotLaws_DWork.Tau = rtb_BusAssignment.data.H_radio_ft / (rtb_Y_co - 2.5);
    AutopilotLaws_DWork.H_bias = AutopilotLaws_DWork.Tau * rtb_Y_co - rtb_BusAssignment.data.H_radio_ft;
  }

  if (rtb_OR1) {
    rtb_Vz = -1.0 / AutopilotLaws_DWork.Tau * (rtb_BusAssignment.data.H_radio_ft + AutopilotLaws_DWork.H_bias) * 60.0;
  } else {
    rtb_Vz = rtb_MaxH_dot_RA1;
  }

  AutopilotLaws_DWork.wasActive = rtb_OR1;
  AutopilotLaws_LeadLagFilter(rtb_Vz, AutopilotLaws_P.LeadLagFilter_C1_a, AutopilotLaws_P.LeadLagFilter_C2_p,
    AutopilotLaws_P.LeadLagFilter_C3_m, AutopilotLaws_P.LeadLagFilter_C4_k, AutopilotLaws_U.in.time.dt, &rtb_Divide,
    &AutopilotLaws_DWork.sf_LeadLagFilter_hp);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_av * AutopilotLaws_U.in.data.V_gnd_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_i0) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_i0;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_nd) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_nd;
  } else {
    u0 = AutopilotLaws_DWork.DelayInput1_DSTATE;
  }

  rtb_Y_co = AutopilotLaws_P.ftmintoms_Gain_k * rtb_Divide / u0;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_ew) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_ew;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_an) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_an;
  }

  u0 = (rtb_Vz - rtb_MaxH_dot_RA1) * AutopilotLaws_P.ftmintoms_Gain_j / AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (rtb_Y_co > 1.0) {
    rtb_Y_co = 1.0;
  } else if (rtb_Y_co < -1.0) {
    rtb_Y_co = -1.0;
  }

  if (u0 > 1.0) {
    u0 = 1.0;
  } else if (u0 < -1.0) {
    u0 = -1.0;
  }

  rtb_Sum1_g = AutopilotLaws_P.Gain_Gain_gr * std::asin(rtb_Y_co) * AutopilotLaws_P.Gain1_Gain_ml +
    AutopilotLaws_P.Gain_Gain_by * std::asin(u0) * AutopilotLaws_P.Gain2_Gain_m;
  rtb_uDLookupTable_m = look1_binlxpw(AutopilotLaws_U.in.data.total_weight_kg, AutopilotLaws_P.uDLookupTable_bp01Data,
    AutopilotLaws_P.uDLookupTable_tableData, 3U);
  rtb_Sum_ia = AutopilotLaws_P.Constant1_Value_o0 - rtb_GainTheta;
  rtb_Sum3_m3 = AutopilotLaws_P.Constant2_Value_kz - AutopilotLaws_U.in.data.H_ind_ft;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.fpmtoms_Gain_po * AutopilotLaws_U.in.data.H_dot_ft_min;
  u0 = AutopilotLaws_P.kntoms_Gain_bh * AutopilotLaws_U.in.data.V_gnd_kn;
  if (u0 > AutopilotLaws_P.Saturation_UpperSat_pd) {
    u0 = AutopilotLaws_P.Saturation_UpperSat_pd;
  } else if (u0 < AutopilotLaws_P.Saturation_LowerSat_l) {
    u0 = AutopilotLaws_P.Saturation_LowerSat_l;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = std::atan(AutopilotLaws_DWork.DelayInput1_DSTATE / u0) *
    AutopilotLaws_P.Gain_Gain_cr;
  result_idx_1_0 = AutopilotLaws_P.Gain1_Gain_ga * AutopilotLaws_DWork.DelayInput1_DSTATE;
  rtb_Y_co = AutopilotLaws_P.kntoms_Gain_py * AutopilotLaws_U.in.data.V_gnd_kn;
  if (rtb_Y_co > AutopilotLaws_P.Saturation_UpperSat_ec) {
    rtb_Y_co = AutopilotLaws_P.Saturation_UpperSat_ec;
  } else if (rtb_Y_co < AutopilotLaws_P.Saturation_LowerSat_m) {
    rtb_Y_co = AutopilotLaws_P.Saturation_LowerSat_m;
  }

  rtb_Divide = AutopilotLaws_P.Gain1_Gain_hm2 * rtb_GainTheta1;
  rtb_GainTheta1 = std::cos(rtb_Divide);
  rtb_lo = std::sin(rtb_Divide);
  rtb_Gain7_j = AutopilotLaws_P.Gain1_Gain_it * AutopilotLaws_U.in.data.Psi_magnetic_track_deg;
  rtb_Divide = AutopilotLaws_P.ktstomps_Gain_k5 * AutopilotLaws_U.in.data.V_gnd_kn;
  AutopilotLaws_WashoutFilter(AutopilotLaws_P._Gain_f * (AutopilotLaws_P.GStoGS_CAS_Gain_j * rtb_Divide),
    AutopilotLaws_P.WashoutFilter_C1_cn, AutopilotLaws_U.in.time.dt, &rtb_Divide,
    &AutopilotLaws_DWork.sf_WashoutFilter_i);
  AutopilotLaws_LeadLagFilter(rtb_Divide - AutopilotLaws_P.g_Gain_p * (AutopilotLaws_P.Gain1_Gain_mxw *
    (AutopilotLaws_P.Gain_Gain_er * ((AutopilotLaws_P.Gain1_Gain_ol * rtb_GainTheta - AutopilotLaws_P.Gain1_Gain_ln *
    (AutopilotLaws_P.Gain_Gain_hc * std::atan(AutopilotLaws_P.fpmtoms_Gain_k * AutopilotLaws_U.in.data.H_dot_ft_min /
    rtb_Y_co))) * (AutopilotLaws_P.Constant_Value_h - rtb_GainTheta1) + rtb_lo * std::sin(rtb_Gain7_j -
    AutopilotLaws_P.Gain1_Gain_a * AutopilotLaws_U.in.data.Psi_magnetic_deg)))), AutopilotLaws_P.HighPassFilter_C1_gw,
    AutopilotLaws_P.HighPassFilter_C2_e, AutopilotLaws_P.HighPassFilter_C3_di, AutopilotLaws_P.HighPassFilter_C4_a,
    AutopilotLaws_U.in.time.dt, &rtb_Gain7_j, &AutopilotLaws_DWork.sf_LeadLagFilter_g);
  AutopilotLaws_LeadLagFilter(AutopilotLaws_P.ktstomps_Gain_mf * AutopilotLaws_U.in.data.V_ias_kn,
    AutopilotLaws_P.LowPassFilter_C1_d1, AutopilotLaws_P.LowPassFilter_C2_e, AutopilotLaws_P.LowPassFilter_C3_l,
    AutopilotLaws_P.LowPassFilter_C4_a, AutopilotLaws_U.in.time.dt, &rtb_Divide, &AutopilotLaws_DWork.sf_LeadLagFilter_n);
  rtb_Divide = (rtb_Gain7_j + rtb_Divide) * AutopilotLaws_P.ug_Gain_c;
  rtb_GainTheta1 = (AutopilotLaws_P.Gain1_Gain_nc * rtb_Divide + result_idx_1_0) * AutopilotLaws_P.Gain_Gain_bg;
  rtb_Y_co = (AutopilotLaws_U.in.data.V_ias_kn - AutopilotLaws_U.in.input.V_c_kn) * AutopilotLaws_P.Gain1_Gain_ke;
  rtb_OR1 = ((rtb_Sum3_m3 > AutopilotLaws_P.CompareToConstant6_const_d) && (rtb_GainTheta1 <
              AutopilotLaws_P.CompareToConstant5_const_h) && (rtb_Y_co < AutopilotLaws_P.CompareToConstant2_const_j) &&
             (result_idx_2 == AutopilotLaws_P.CompareToConstant8_const));
  rtb_Gain7_j = rtb_Divide + result_idx_1_0;
  if (rtb_OR1) {
    result_idx_1_0 = AutopilotLaws_P.Constant_Value_o3;
  } else {
    if (rtb_Sum3_m3 > AutopilotLaws_P.CompareToConstant_const_h) {
      result_idx_1_0 = AutopilotLaws_P.Constant1_Value_g5;
    } else {
      result_idx_1_0 = AutopilotLaws_P.Gain5_Gain_n * rtb_GainTheta1;
    }

    if (rtb_Y_co <= result_idx_1_0) {
      if (rtb_Sum3_m3 > AutopilotLaws_P.CompareToConstant4_const_e) {
        result_idx_1_0 = std::fmax(AutopilotLaws_P.Constant2_Value_m, AutopilotLaws_P.Gain1_Gain_m * rtb_GainTheta1);
      } else {
        result_idx_1_0 = AutopilotLaws_P.Gain6_Gain_fa * rtb_GainTheta1;
      }

      if (rtb_Y_co >= result_idx_1_0) {
        result_idx_1_0 = rtb_Y_co;
      }
    }
  }

  rtb_GainTheta1 = (AutopilotLaws_P.Gain_Gain_c2 * rtb_Gain7_j - AutopilotLaws_DWork.DelayInput1_DSTATE) +
    result_idx_1_0;
  if (rtb_Sum3_m3 < 0.0) {
    i = -1;
  } else {
    i = (rtb_Sum3_m3 > 0.0);
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE = static_cast<real_T>(i) * AutopilotLaws_P.Constant3_Value_ew;
  AutopilotLaws_DWork.DelayInput1_DSTATE -= AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Y_co = AutopilotLaws_P.ftmintoms_Gain_m * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_om * AutopilotLaws_U.in.data.V_tas_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_ed) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_ed;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_ee) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_ee;
  }

  u0 = rtb_Y_co / AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (u0 > 1.0) {
    u0 = 1.0;
  } else if (u0 < -1.0) {
    u0 = -1.0;
  }

  rtb_Gain7_j = AutopilotLaws_P.Gain_Gain_kon * std::asin(u0);
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_iaf - AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Y_co = AutopilotLaws_P.ftmintoms_Gain_lv * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_iw * AutopilotLaws_U.in.data.V_tas_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_jt) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_jt;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_ih) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_ih;
  }

  u0 = rtb_Y_co / AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (u0 > 1.0) {
    u0 = 1.0;
  } else if (u0 < -1.0) {
    u0 = -1.0;
  }

  result_idx_1_0 = AutopilotLaws_P.Gain_Gain_o1 * std::asin(u0);
  if (rtb_OR1) {
    u0 = rtb_GainTheta1;
  } else if (rtb_Sum3_m3 > AutopilotLaws_P.Switch_Threshold_k) {
    u0 = std::fmax(rtb_GainTheta1, rtb_Gain7_j);
  } else {
    u0 = std::fmin(rtb_GainTheta1, rtb_Gain7_j);
  }

  AutopilotLaws_Voter1(rtb_Sum_ia, u0, result_idx_1_0, &rtb_Y_co);
  AutopilotLaws_LagFilter(AutopilotLaws_U.in.input.H_c_ft - AutopilotLaws_U.in.data.H_ft, AutopilotLaws_P.LagFilter_C1_b,
    AutopilotLaws_U.in.time.dt, &AutopilotLaws_DWork.DelayInput1_DSTATE, &AutopilotLaws_DWork.sf_LagFilter_d);
  AutopilotLaws_DWork.DelayInput1_DSTATE *= AutopilotLaws_P.Gain2_Gain_hq;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_f3) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_f3;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_b) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_b;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE += AutopilotLaws_U.in.input.H_dot_c_fpm;
  AutopilotLaws_DWork.DelayInput1_DSTATE -= AutopilotLaws_U.in.data.H_dot_ft_min;
  rtb_Divide = AutopilotLaws_P.ftmintoms_Gain_kr * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.kntoms_Gain_j * AutopilotLaws_U.in.data.V_tas_kn;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_nuy) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_nuy;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_dj) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_dj;
  }

  u0 = rtb_Divide / AutopilotLaws_DWork.DelayInput1_DSTATE;
  if (u0 > 1.0) {
    u0 = 1.0;
  } else if (u0 < -1.0) {
    u0 = -1.0;
  }

  rtb_Divide = AutopilotLaws_P.Gain_Gain_fs * std::asin(u0);
  switch (static_cast<int32_T>(result_idx_2)) {
   case 0:
    a = AutopilotLaws_P.Constant_Value_dh;
    break;

   case 1:
    a = result_idx_2_0;
    break;

   case 2:
    break;

   case 3:
    if (rtb_Compare_jy) {
      a = Phi2;
    } else if (Phi1 > AutopilotLaws_P.Switch_Threshold) {
      a = std::fmax(Phi2, rtb_lo_o);
    } else {
      a = std::fmin(Phi2, rtb_lo_o);
    }
    break;

   case 4:
    a = rtb_FD;
    break;

   case 5:
    a = rtb_FD_gn;
    break;

   case 6:
    a = AutopilotLaws_P.Gain1_Gain_d * rtb_Product_dh;
    break;

   case 7:
    if (rtb_on_ground > AutopilotLaws_P.Switch1_Threshold_j) {
      a = AutopilotLaws_P.Gain2_Gain_h * rtb_Gain4;
    } else {
      a = ((AutopilotLaws_P.Gain1_Gain_i * rtb_Y_i + rtb_Y_kt) + rtb_Sum1_g * rtb_uDLookupTable_m) *
        AutopilotLaws_P.Gain6_Gain_f;
    }
    break;

   case 8:
    a = rtb_Y_co;
    break;

   default:
    a = rtb_Divide;
    break;
  }

  if (a > AutopilotLaws_P.Constant1_Value_i) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_i;
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Gain1_Gain_n * AutopilotLaws_P.Constant1_Value_i;
    if (a >= AutopilotLaws_DWork.DelayInput1_DSTATE) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = a;
    }
  }

  AutopilotLaws_RateLimiter(AutopilotLaws_DWork.DelayInput1_DSTATE - result_idx_0_0,
    AutopilotLaws_P.RateLimiterVariableTs1_up, AutopilotLaws_P.RateLimiterVariableTs1_lo, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs1_InitialCondition, &AutopilotLaws_DWork.DelayInput1_DSTATE,
    &AutopilotLaws_DWork.sf_RateLimiter_h);
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.LagFilter_C1_gh,
    AutopilotLaws_U.in.time.dt, &rtb_Y_co, &AutopilotLaws_DWork.sf_LagFilter_pe);
  AutopilotLaws_DWork.icLoad_f = ((rtb_BusAssignment.output.ap_on == 0.0) || AutopilotLaws_DWork.icLoad_f);
  if (AutopilotLaws_DWork.icLoad_f) {
    AutopilotLaws_DWork.Delay_DSTATE_h2 = rtb_GainTheta;
  }

  AutopilotLaws_VSLimiter(AutopilotLaws_P.VS_Gain_n * result_idx_2_0, &rtb_BusAssignment, &a);
  if (rtb_Compare_jy) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = Phi2;
  } else if (Phi1 > AutopilotLaws_P.Switch_Threshold_h) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmax(Phi2, AutopilotLaws_P.VS_Gain_j * rtb_lo_o);
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmin(Phi2, AutopilotLaws_P.VS_Gain_j * rtb_lo_o);
  }

  AutopilotLaws_VSLimiter(AutopilotLaws_P.Gain_Gain_k2 * AutopilotLaws_DWork.DelayInput1_DSTATE, &rtb_BusAssignment,
    &Phi2);
  rtb_lo = 9.81 / (AutopilotLaws_U.in.data.V_tas_kn * 0.51444444444444448) * 0.3 * 57.295779513082323;
  result_idx_2_0 = AutopilotLaws_P.Gain3_Gain_l * rtb_Y_i;
  Phi1 = AutopilotLaws_P.VS_Gain_e * rtb_Sum1_g;
  AutopilotLaws_WashoutFilter(rtb_dme, AutopilotLaws_P.WashoutFilterBeta_c_C1, AutopilotLaws_U.in.time.dt,
    &result_idx_0_0, &AutopilotLaws_DWork.sf_WashoutFilter_k);
  AutopilotLaws_DWork.DelayInput1_DSTATE = std::abs(result_idx_0_0);
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_ig) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_ig;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_ous) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_ous;
  }

  rtb_dme = AutopilotLaws_P.Gain_Gain_j0 * AutopilotLaws_DWork.DelayInput1_DSTATE;
  result_idx_0_0 = 9.81 / (AutopilotLaws_U.in.data.V_tas_kn * 0.51444444444444448) * 0.6 * 57.295779513082323;
  if (rtb_OR1) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_GainTheta1;
  } else if (rtb_Sum3_m3 > AutopilotLaws_P.Switch_Threshold_hz) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmax(rtb_GainTheta1, AutopilotLaws_P.VS_Gain_n5 * rtb_Gain7_j);
  } else {
    AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmin(rtb_GainTheta1, AutopilotLaws_P.VS_Gain_n5 * rtb_Gain7_j);
  }

  AutopilotLaws_Voter1(rtb_Sum_ia, AutopilotLaws_P.Gain_Gain_o2 * AutopilotLaws_DWork.DelayInput1_DSTATE,
                       AutopilotLaws_P.VS_Gain_nx * result_idx_1_0, &rtb_GainTheta1);
  rtb_Gain7_j = 9.81 / (AutopilotLaws_U.in.data.V_tas_kn * 0.51444444444444448) * 0.5 * 57.295779513082323;
  if (AutopilotLaws_U.in.input.vertical_mode == 24.0) {
    u0 = 0.15;
  } else {
    u0 = 0.1;
  }

  result_idx_1_0 = 9.81 / (AutopilotLaws_U.in.data.V_tas_kn * 0.51444444444444448) * u0 * 57.295779513082323;
  switch (static_cast<int32_T>(result_idx_2)) {
   case 0:
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_dh;
    break;

   case 1:
    AutopilotLaws_DWork.DelayInput1_DSTATE = a;
    break;

   case 2:
    AutopilotLaws_DWork.DelayInput1_DSTATE = b_L;
    break;

   case 3:
    AutopilotLaws_DWork.DelayInput1_DSTATE = Phi2;
    break;

   case 4:
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_Sum_if;
    break;

   case 5:
    AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_AP_g;
    break;

   case 6:
    AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmax(-rtb_lo, std::fmin(rtb_lo, rtb_Product_dh));
    break;

   case 7:
    if (rtb_on_ground <= AutopilotLaws_P.Switch_Threshold_c) {
      rtb_Gain4 = ((rtb_Y_kt + result_idx_2_0) + rtb_uDLookupTable_m * Phi1) + rtb_dme;
    }

    AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmax(-result_idx_0_0, std::fmin(result_idx_0_0, rtb_Gain4));
    break;

   case 8:
    AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmax(-rtb_Gain7_j, std::fmin(rtb_Gain7_j, rtb_GainTheta1));
    break;

   default:
    AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmax(-result_idx_1_0, std::fmin(result_idx_1_0,
      AutopilotLaws_P.VS_Gain_ne * rtb_Divide));
    break;
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE += rtb_GainTheta;
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Constant1_Value_i) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant1_Value_i;
  } else {
    rtb_GainTheta1 = AutopilotLaws_P.Gain1_Gain_m4 * AutopilotLaws_P.Constant1_Value_i;
    if (AutopilotLaws_DWork.DelayInput1_DSTATE < rtb_GainTheta1) {
      AutopilotLaws_DWork.DelayInput1_DSTATE = rtb_GainTheta1;
    }
  }

  AutopilotLaws_DWork.DelayInput1_DSTATE -= AutopilotLaws_DWork.Delay_DSTATE_h2;
  rtb_GainTheta1 = 9.81 / (AutopilotLaws_U.in.data.V_tas_kn * 0.51444444444444448) * 0.6 * 57.295779513082323;
  AutopilotLaws_DWork.DelayInput1_DSTATE = std::fmin(AutopilotLaws_DWork.DelayInput1_DSTATE, rtb_GainTheta1 *
    AutopilotLaws_U.in.time.dt);
  AutopilotLaws_DWork.Delay_DSTATE_h2 += std::fmax(AutopilotLaws_DWork.DelayInput1_DSTATE, AutopilotLaws_P.Gain1_Gain_i0
    * rtb_GainTheta1 * AutopilotLaws_U.in.time.dt);
  AutopilotLaws_LagFilter(AutopilotLaws_DWork.Delay_DSTATE_h2, AutopilotLaws_P.LagFilter_C1_i,
    AutopilotLaws_U.in.time.dt, &result_idx_0_0, &AutopilotLaws_DWork.sf_LagFilter_gn);
  AutopilotLaws_RateLimiter(rtb_BusAssignment.output.ap_on, AutopilotLaws_P.RateLimiterVariableTs_up_i,
    AutopilotLaws_P.RateLimiterVariableTs_lo_o, AutopilotLaws_U.in.time.dt,
    AutopilotLaws_P.RateLimiterVariableTs_InitialCondition_p, &AutopilotLaws_DWork.DelayInput1_DSTATE,
    &AutopilotLaws_DWork.sf_RateLimiter_eb);
  if (AutopilotLaws_DWork.DelayInput1_DSTATE > AutopilotLaws_P.Saturation_UpperSat_ix) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_UpperSat_ix;
  } else if (AutopilotLaws_DWork.DelayInput1_DSTATE < AutopilotLaws_P.Saturation_LowerSat_eq) {
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Saturation_LowerSat_eq;
  }

  rtb_GainTheta1 = result_idx_0_0 * AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.Constant_Value_i4 - AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_DWork.DelayInput1_DSTATE *= rtb_GainTheta;
  AutopilotLaws_DWork.DelayInput1_DSTATE += rtb_GainTheta1;
  result_idx_1_0 = AutopilotLaws_P.kntofpm_Gain_h * AutopilotLaws_U.in.data.V_gnd_kn * AutopilotLaws_P.maxslope_Gain_j;
  AutopilotLaws_LagFilter(rtb_Y_hn, AutopilotLaws_P.LagFilter1_C1_d, AutopilotLaws_U.in.time.dt, &result_idx_0_0,
    &AutopilotLaws_DWork.sf_LagFilter_cs);
  AutopilotLaws_Y.out = rtb_BusAssignment;
  AutopilotLaws_Y.out.output.flight_director.Theta_c_deg = rtb_Y_co;
  AutopilotLaws_Y.out.output.autopilot.Theta_c_deg = AutopilotLaws_DWork.DelayInput1_DSTATE;
  AutopilotLaws_Y.out.output.flare_law.condition_Flare = ((rtb_BusAssignment.data.H_radio_ft < 80.0) &&
    ((rtb_BusAssignment.data.H_radio_ft * 12.7 <= std::abs(std::fmin(std::fmax(L - result_idx_1_0,
    AutopilotLaws_P.Gain7_Gain_l * result_idx_0_0), result_idx_1_0 + L))) || (rtb_BusAssignment.data.H_radio_ft <= 45.0)));
  AutopilotLaws_Y.out.output.flare_law.H_dot_radio_fpm = rtb_MaxH_dot_RA1;
  AutopilotLaws_Y.out.output.flare_law.H_dot_c_fpm = rtb_Vz;
  AutopilotLaws_Y.out.output.flare_law.delta_Theta_H_dot_deg = Phi1;
  AutopilotLaws_Y.out.output.flare_law.delta_Theta_bz_deg = rtb_Y_kt;
  AutopilotLaws_Y.out.output.flare_law.delta_Theta_bx_deg = result_idx_2_0;
  AutopilotLaws_Y.out.output.flare_law.delta_Theta_beta_c_deg = rtb_dme;
  AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_U.in.data.altimeter_setting_left_mbar;
  AutopilotLaws_DWork.DelayInput1_DSTATE_g = AutopilotLaws_U.in.data.altimeter_setting_right_mbar;
  AutopilotLaws_DWork.Delay_DSTATE = result_idx_0;
  for (rtb_on_ground = 0; rtb_on_ground < 99; rtb_on_ground++) {
    AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_l[rtb_on_ground + 1];
    AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground] = AutopilotLaws_DWork.Delay_DSTATE_h5[rtb_on_ground + 1];
  }

  AutopilotLaws_DWork.Delay_DSTATE_l[99] = rtb_valid;
  AutopilotLaws_DWork.Delay_DSTATE_h5[99] = rtb_valid_l;
  AutopilotLaws_DWork.icLoad = false;
  AutopilotLaws_DWork.Delay_DSTATE_c = rtb_Gain_a0;
  AutopilotLaws_DWork.Delay_DSTATE_b = result_idx_1;
  AutopilotLaws_DWork.icLoad_f = false;
}

void AutopilotLawsModelClass::initialize()
{
  {
    real_T rtb_out_g;
    int32_T i;
    AutopilotLaws_DWork.DelayInput1_DSTATE = AutopilotLaws_P.DetectChange_vinit;
    AutopilotLaws_DWork.DelayInput1_DSTATE_g = AutopilotLaws_P.DetectChange1_vinit;
    AutopilotLaws_DWork.Delay_DSTATE = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition;
    for (i = 0; i < 100; i++) {
      AutopilotLaws_DWork.Delay_DSTATE_l[i] = AutopilotLaws_P.Delay_InitialCondition;
      AutopilotLaws_DWork.Delay_DSTATE_h5[i] = AutopilotLaws_P.Delay_InitialCondition_b;
    }

    AutopilotLaws_DWork.Delay_DSTATE_h = AutopilotLaws_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
    AutopilotLaws_DWork.icLoad = true;
    AutopilotLaws_DWork.Delay_DSTATE_c = AutopilotLaws_P.DiscreteDerivativeVariableTs1_InitialCondition;
    AutopilotLaws_DWork.Delay_DSTATE_b = AutopilotLaws_P.DiscreteDerivativeVariableTs_InitialCondition_f;
    AutopilotLaws_DWork.icLoad_f = true;
    AutopilotLaws_Chart_g_Init(&rtb_out_g);
    AutopilotLaws_Chart_Init(&rtb_out_g);
    AutopilotLaws_MATLABFunction_f_Init(&AutopilotLaws_DWork.sf_MATLABFunction_m);
    AutopilotLaws_Chart_Init(&rtb_out_g);
    AutopilotLaws_MATLABFunction_f_Init(&AutopilotLaws_DWork.sf_MATLABFunction_e5);
    AutopilotLaws_Chart_g_Init(&rtb_out_g);
    AutopilotLaws_B.u = AutopilotLaws_P.Y_Y0;
    AutopilotLaws_DWork.k = 5.0;
    AutopilotLaws_DWork.maxH_dot = 1500.0;
    AutopilotLaws_DWork.Tau = 1.0;
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

AutopilotLawsModelClass::~AutopilotLawsModelClass() = default;
