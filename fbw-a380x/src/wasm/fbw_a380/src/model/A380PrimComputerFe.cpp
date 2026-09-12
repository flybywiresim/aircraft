#include "A380PrimComputerFe.h"
#include "rtwtypes.h"
#include "A380PrimComputerFe_types.h"
#include <cmath>
#include "look2_binlxpw.h"
#include "look1_binlxpw.h"
#include "plook_binx.h"
#include "intrp3d_l_pw.h"
#include "look2_iflf_binlxpw.h"

const uint8_T A380PrimComputerFe_IN_Flying{ 1U };

const uint8_T A380PrimComputerFe_IN_Landed{ 2U };

const uint8_T A380PrimComputerFe_IN_Landing100ft{ 3U };

const uint8_T A380PrimComputerFe_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T A380PrimComputerFe_IN_Takeoff100ft{ 4U };

void A380PrimComputerFe::A380PrimComputerFe_LagFilter_Reset(rtDW_LagFilter_A380PrimComputerFe_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PrimComputerFe::A380PrimComputerFe_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_A380PrimComputerFe_T *localDW)
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

void A380PrimComputerFe::A380PrimComputerFe_RateLimiter_Reset(rtDW_RateLimiter_A380PrimComputerFe_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputerFe::A380PrimComputerFe_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputerFe_T *localDW)
{
  if ((!localDW->pY_not_empty) || rtu_reset) {
    localDW->pY = rtu_u;
    localDW->pY_not_empty = true;
  }

  if (rtu_reset) {
    *rty_Y = rtu_u;
  } else {
    *rty_Y = std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts) +
      localDW->pY;
  }

  localDW->pY = *rty_Y;
}

void A380PrimComputerFe::A380PrimComputerFe_VS1GfromVLS(real_T rtu_vls_conf_0, real_T rtu_vls_conf_other, real_T
  rtu_flap_handle_index, real_T *rty_vs1g)
{
  if (rtu_flap_handle_index == 0.0) {
    *rty_vs1g = rtu_vls_conf_0 / 1.23;
  } else {
    *rty_vs1g = rtu_vls_conf_other / 1.23;
  }
}

void A380PrimComputerFe::A380PrimComputerFe_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void A380PrimComputerFe::A380PrimComputerFe_MATLABFunction_k(const base_arinc_429 *rtu_u, real32_T *rty_y)
{
  *rty_y = rtu_u->Data;
}

void A380PrimComputerFe::step()
{
  real_T fractions[3];
  real_T fractions_0[3];
  real_T fractions_1[3];
  real_T fractions_2[3];
  real_T rtb_BusAssignment_ji_flight_envelope_computed_gross_weight_kg;
  real_T rtb_Gain;
  real_T rtb_Switch;
  real_T rtb_Y_p;
  real_T rtb_conf;
  real_T rtb_uDLookupTable;
  real_T rtb_vs1g;
  real_T rtb_vs1g_c;
  int32_T rtb_alpha_floor_inhib;
  int32_T tmp;
  real32_T rtb_uDLookupTable_a;
  uint32_T bpIndices[3];
  uint32_T bpIndices_0[3];
  uint32_T bpIndices_1[3];
  uint32_T bpIndices_2[3];
  boolean_T guard1;
  boolean_T rtb_Equal;
  boolean_T rtb_NOT;
  if (A380PrimComputerFe_U.in.data.sim_data.computer_running) {
    if (!A380PrimComputerFe_DWork.Runtime_MODE) {
      A380PrimComputerFe_DWork.Delay_DSTATE = A380PrimComputerFe_P.DiscreteDerivativeVariableTs_InitialCondition;
      A380PrimComputerFe_RateLimiter_Reset(&A380PrimComputerFe_DWork.sf_RateLimiter);
      A380PrimComputerFe_LagFilter_Reset(&A380PrimComputerFe_DWork.sf_LagFilter);
      A380PrimComputerFe_DWork.is_active_c15_A380PrimComputerFe = 0U;
      A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_NO_ACTIVE_CHILD;
      A380PrimComputerFe_DWork.sAlphaFloor = 0.0;
      A380PrimComputerFe_DWork.output = false;
      A380PrimComputerFe_DWork.timeSinceCondition = 0.0;
      A380PrimComputerFe_RateLimiter_Reset(&A380PrimComputerFe_DWork.sf_RateLimiter_k);
      A380PrimComputerFe_DWork.takeoff_config = 0.0;
      A380PrimComputerFe_DWork.pY_not_empty = false;
      A380PrimComputerFe_RateLimiter_Reset(&A380PrimComputerFe_DWork.sf_RateLimiter_b);
      A380PrimComputerFe_DWork.takeoff_config_e = 0.0;
      A380PrimComputerFe_DWork.takeoff_config_n = 0.0;
      A380PrimComputerFe_LagFilter_Reset(&A380PrimComputerFe_DWork.sf_LagFilter_d);
      A380PrimComputerFe_DWork.pY_not_empty_d = false;
      A380PrimComputerFe_DWork.pU_not_empty = false;
      A380PrimComputerFe_LagFilter_Reset(&A380PrimComputerFe_DWork.sf_LagFilter_pa);
      A380PrimComputerFe_LagFilter_Reset(&A380PrimComputerFe_DWork.sf_LagFilter_p);
      A380PrimComputerFe_LagFilter_Reset(&A380PrimComputerFe_DWork.sf_LagFilter_e);
      A380PrimComputerFe_DWork.Runtime_MODE = true;
    }

    A380PrimComputerFe_RateLimiter(look2_binlxpw(A380PrimComputerFe_U.in.general_logic.adr_computation_data.mach,
      static_cast<real_T>(A380PrimComputerFe_U.in.general_logic.flap_handle_index),
      A380PrimComputerFe_P.alphafloor_bp01Data, A380PrimComputerFe_P.alphafloor_bp02Data,
      A380PrimComputerFe_P.alphafloor_tableData, A380PrimComputerFe_P.alphafloor_maxIndex, 4U),
      A380PrimComputerFe_P.RateLimiterGenericVariableTs1_up, A380PrimComputerFe_P.RateLimiterGenericVariableTs1_lo,
      A380PrimComputerFe_U.in.data.time.dt, A380PrimComputerFe_P.reset_Value, &rtb_vs1g_c,
      &A380PrimComputerFe_DWork.sf_RateLimiter);
    rtb_Gain = A380PrimComputerFe_P.DiscreteDerivativeVariableTs_Gain *
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.V_ias_kn;
    A380PrimComputerFe_LagFilter((rtb_Gain - A380PrimComputerFe_DWork.Delay_DSTATE) /
      A380PrimComputerFe_U.in.data.time.dt, A380PrimComputerFe_P.LagFilter_C1, A380PrimComputerFe_U.in.data.time.dt,
      &rtb_vs1g, &A380PrimComputerFe_DWork.sf_LagFilter);
    if (A380PrimComputerFe_U.in.general_logic.all_ra_failure) {
      rtb_Switch = A380PrimComputerFe_P.Constant_Value;
    } else {
      rtb_Switch = A380PrimComputerFe_U.in.general_logic.ra_computation_data_ft;
    }

    if (A380PrimComputerFe_DWork.is_active_c15_A380PrimComputerFe == 0) {
      A380PrimComputerFe_DWork.is_active_c15_A380PrimComputerFe = 1U;
      A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Landed;
      rtb_alpha_floor_inhib = 1;
    } else {
      switch (A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe) {
       case A380PrimComputerFe_IN_Flying:
        if (rtb_Switch < 100.0) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Landing100ft;
          rtb_alpha_floor_inhib = 1;
        } else if (A380PrimComputerFe_U.in.general_logic.on_ground) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else {
          rtb_alpha_floor_inhib = 0;
        }
        break;

       case A380PrimComputerFe_IN_Landed:
        if (!A380PrimComputerFe_U.in.general_logic.on_ground) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Takeoff100ft;
          rtb_alpha_floor_inhib = 0;
        } else {
          rtb_alpha_floor_inhib = 1;
        }
        break;

       case A380PrimComputerFe_IN_Landing100ft:
        if (rtb_Switch > 100.0) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Flying;
          rtb_alpha_floor_inhib = 0;
        } else if (A380PrimComputerFe_U.in.general_logic.on_ground) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else {
          rtb_alpha_floor_inhib = 1;
        }
        break;

       default:
        if (A380PrimComputerFe_U.in.general_logic.on_ground) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else if (rtb_Switch > 100.0) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Flying;
          rtb_alpha_floor_inhib = 0;
        } else {
          rtb_alpha_floor_inhib = 0;
        }
        break;
      }
    }

    rtb_Equal = (A380PrimComputerFe_U.in.fctl_logic.active_pitch_law == A380PrimComputerFe_P.EnumeratedConstant_Value);
    guard1 = false;
    if ((rtb_alpha_floor_inhib == 0) && (A380PrimComputerFe_U.in.general_logic.adr_computation_data.mach < 0.6)) {
      if (A380PrimComputerFe_U.in.general_logic.flap_handle_index >= 4.0F) {
        tmp = -3;
      } else {
        tmp = 0;
      }

      if ((A380PrimComputerFe_U.in.general_logic.adr_computation_data.alpha_deg > rtb_vs1g_c + std::fmin(std::fmax
            (rtb_vs1g, static_cast<real_T>(tmp)), 0.0)) && rtb_Equal) {
        A380PrimComputerFe_DWork.sAlphaFloor = 1.0;
      } else {
        guard1 = true;
      }
    } else {
      guard1 = true;
    }

    if (guard1) {
      if ((rtb_alpha_floor_inhib != 0) || (!A380PrimComputerFe_U.in.fctl_logic.high_alpha_prot_active) || (!rtb_Equal))
      {
        A380PrimComputerFe_DWork.sAlphaFloor = 0.0;
      }
    }

    A380PrimComputerFe_MATLABFunction_k(&A380PrimComputerFe_U.in.data.adcn_inputs.fqms.gross_weight_kg,
      &rtb_uDLookupTable_a);
    rtb_Switch = rtb_uDLookupTable_a;
    A380PrimComputerFe_MATLABFunction(&A380PrimComputerFe_U.in.data.adcn_inputs.fqms.gross_weight_kg, &rtb_Equal);
    A380PrimComputerFe_Y.out.flight_envelope.gross_weight_lost = !rtb_Equal;
    A380PrimComputerFe_MATLABFunction_k(&A380PrimComputerFe_U.in.data.adcn_inputs.fqms.gross_weight_cg_pct,
      &rtb_uDLookupTable_a);
    A380PrimComputerFe_MATLABFunction(&A380PrimComputerFe_U.in.data.adcn_inputs.fqms.gross_weight_cg_pct, &rtb_Equal);
    rtb_NOT = !A380PrimComputerFe_U.in.general_logic.on_ground;
    if (rtb_NOT == A380PrimComputerFe_P.ConfirmNode_isRisingEdge) {
      A380PrimComputerFe_DWork.timeSinceCondition += A380PrimComputerFe_U.in.data.time.dt;
      if (A380PrimComputerFe_DWork.timeSinceCondition >= A380PrimComputerFe_P.ConfirmNode_timeDelay) {
        A380PrimComputerFe_DWork.output = rtb_NOT;
      }
    } else {
      A380PrimComputerFe_DWork.timeSinceCondition = 0.0;
      A380PrimComputerFe_DWork.output = rtb_NOT;
    }

    rtb_BusAssignment_ji_flight_envelope_computed_gross_weight_kg = rtb_Switch;
    A380PrimComputerFe_RateLimiter(A380PrimComputerFe_P.Gain_Gain *
      A380PrimComputerFe_U.in.fctl_logic.speed_brake_command_deg * look1_binlxpw(static_cast<real_T>
      (A380PrimComputerFe_U.in.general_logic.flap_handle_index), A380PrimComputerFe_P.VLSincreasemaxdeflection_bp01Data,
      A380PrimComputerFe_P.VLSincreasemaxdeflection_tableData, 5U),
      A380PrimComputerFe_P.RateLimiterGenericVariableTs2_up, A380PrimComputerFe_P.RateLimiterGenericVariableTs2_lo,
      A380PrimComputerFe_U.in.data.time.dt, A380PrimComputerFe_P.reset_Value_p, &rtb_vs1g,
      &A380PrimComputerFe_DWork.sf_RateLimiter_k);
    if (A380PrimComputerFe_U.in.general_logic.on_ground) {
      A380PrimComputerFe_DWork.takeoff_config = A380PrimComputerFe_U.in.general_logic.flap_handle_index;
    } else if (A380PrimComputerFe_DWork.takeoff_config != A380PrimComputerFe_U.in.general_logic.flap_handle_index) {
      A380PrimComputerFe_DWork.takeoff_config = -1.0;
    }

    if ((!A380PrimComputerFe_DWork.pY_not_empty) || A380PrimComputerFe_P.reset_Value_o) {
      A380PrimComputerFe_DWork.pY = A380PrimComputerFe_P.RateLimiterGenericVariableTs_InitialCondition;
      A380PrimComputerFe_DWork.pY_not_empty = true;
    }

    if (A380PrimComputerFe_P.reset_Value_o) {
      A380PrimComputerFe_DWork.pY = A380PrimComputerFe_P.RateLimiterGenericVariableTs_InitialCondition;
    } else {
      if (A380PrimComputerFe_U.in.general_logic.flap_handle_index == 0.0F) {
        rtb_vs1g_c = 1.23;
      } else if (A380PrimComputerFe_U.in.general_logic.flap_handle_index == 1.0F) {
        rtb_vs1g_c = 1.18;
      } else if (A380PrimComputerFe_DWork.takeoff_config != -1.0) {
        rtb_vs1g_c = 1.15;
      } else {
        rtb_vs1g_c = 1.23;
      }

      A380PrimComputerFe_DWork.pY += std::fmax(std::fmin(rtb_vs1g_c - A380PrimComputerFe_DWork.pY, std::abs
        (A380PrimComputerFe_P.RateLimiterGenericVariableTs_up) * A380PrimComputerFe_U.in.data.time.dt), -std::abs
        (A380PrimComputerFe_P.RateLimiterGenericVariableTs_lo) * A380PrimComputerFe_U.in.data.time.dt);
    }

    rtb_uDLookupTable = A380PrimComputerFe_P.Gain2_Gain * rtb_Switch;
    bpIndices[0U] = plook_binx(rtb_uDLookupTable, A380PrimComputerFe_P.nDLookupTable_bp01Data, 7U, &rtb_vs1g_c);
    fractions[0U] = rtb_vs1g_c;
    bpIndices[1U] = plook_binx(static_cast<real_T>(rtb_uDLookupTable_a), A380PrimComputerFe_P.nDLookupTable_bp02Data, 1U,
      &rtb_vs1g_c);
    fractions[1U] = rtb_vs1g_c;
    bpIndices[2U] = plook_binx(static_cast<real_T>(A380PrimComputerFe_U.in.general_logic.flap_handle_index),
      A380PrimComputerFe_P.nDLookupTable_bp03Data, 5U, &rtb_vs1g_c);
    fractions[2U] = rtb_vs1g_c;
    A380PrimComputerFe_VS1GfromVLS(look2_binlxpw(rtb_uDLookupTable,
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_standard_ft,
      A380PrimComputerFe_P.uDLookupTable1_bp01Data, A380PrimComputerFe_P.uDLookupTable1_bp02Data,
      A380PrimComputerFe_P.uDLookupTable1_tableData, A380PrimComputerFe_P.uDLookupTable1_maxIndex, 8U), intrp3d_l_pw
      (bpIndices, fractions, A380PrimComputerFe_P.nDLookupTable_tableData, A380PrimComputerFe_P.nDLookupTable_dimSizes),
      static_cast<real_T>(A380PrimComputerFe_U.in.general_logic.flap_handle_index), &rtb_vs1g_c);
    A380PrimComputerFe_RateLimiter(rtb_vs1g_c, A380PrimComputerFe_P.RateLimiterGenericVariableTs1_up_j,
      A380PrimComputerFe_P.RateLimiterGenericVariableTs1_lo_d, A380PrimComputerFe_U.in.data.time.dt,
      A380PrimComputerFe_P.reset_Value_h, &rtb_Y_p, &A380PrimComputerFe_DWork.sf_RateLimiter_b);
    A380PrimComputerFe_Y.out.flight_envelope.v_ls_kn = std::fmax(A380PrimComputerFe_P.Vmcl_Value,
      A380PrimComputerFe_DWork.pY * rtb_Y_p) + rtb_vs1g;
    rtb_uDLookupTable = A380PrimComputerFe_P.Gain2_Gain_m * rtb_Switch;
    bpIndices_0[0U] = plook_binx(rtb_uDLookupTable, A380PrimComputerFe_P.nDLookupTable_bp01Data_n, 7U, &rtb_vs1g_c);
    fractions_0[0U] = rtb_vs1g_c;
    bpIndices_0[1U] = plook_binx(static_cast<real_T>(rtb_uDLookupTable_a), A380PrimComputerFe_P.nDLookupTable_bp02Data_j,
      1U, &rtb_vs1g_c);
    fractions_0[1U] = rtb_vs1g_c;
    bpIndices_0[2U] = plook_binx(A380PrimComputerFe_P.Constant1_Value, A380PrimComputerFe_P.nDLookupTable_bp03Data_k, 5U,
      &rtb_vs1g_c);
    fractions_0[2U] = rtb_vs1g_c;
    A380PrimComputerFe_VS1GfromVLS(look2_binlxpw(rtb_uDLookupTable,
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_standard_ft,
      A380PrimComputerFe_P.uDLookupTable1_bp01Data_p, A380PrimComputerFe_P.uDLookupTable1_bp02Data_h,
      A380PrimComputerFe_P.uDLookupTable1_tableData_n, A380PrimComputerFe_P.uDLookupTable1_maxIndex_f, 8U), intrp3d_l_pw
      (bpIndices_0, fractions_0, A380PrimComputerFe_P.nDLookupTable_tableData_g,
       A380PrimComputerFe_P.nDLookupTable_dimSizes_k), A380PrimComputerFe_P.Constant1_Value, &rtb_vs1g);
    if (A380PrimComputerFe_U.in.general_logic.on_ground) {
      A380PrimComputerFe_DWork.takeoff_config_e = A380PrimComputerFe_U.in.general_logic.flap_handle_index;
      A380PrimComputerFe_DWork.takeoff_config_n = A380PrimComputerFe_U.in.general_logic.flap_handle_index;
    } else {
      if (A380PrimComputerFe_DWork.takeoff_config_e != A380PrimComputerFe_U.in.general_logic.flap_handle_index) {
        A380PrimComputerFe_DWork.takeoff_config_e = -1.0;
      }

      if (A380PrimComputerFe_DWork.takeoff_config_n != A380PrimComputerFe_U.in.general_logic.flap_handle_index) {
        A380PrimComputerFe_DWork.takeoff_config_n = -1.0;
      }
    }

    rtb_uDLookupTable = A380PrimComputerFe_P.Gain2_Gain_d * rtb_Switch;
    if (A380PrimComputerFe_DWork.takeoff_config_n != -1.0) {
      rtb_conf = 2.0;
    } else {
      rtb_conf = A380PrimComputerFe_U.in.general_logic.flap_handle_index;
    }

    bpIndices_1[0U] = plook_binx(rtb_uDLookupTable, A380PrimComputerFe_P.nDLookupTable_bp01Data_c, 7U, &rtb_vs1g_c);
    fractions_1[0U] = rtb_vs1g_c;
    bpIndices_1[1U] = plook_binx(static_cast<real_T>(rtb_uDLookupTable_a), A380PrimComputerFe_P.nDLookupTable_bp02Data_e,
      1U, &rtb_vs1g_c);
    fractions_1[1U] = rtb_vs1g_c;
    bpIndices_1[2U] = plook_binx(rtb_conf, A380PrimComputerFe_P.nDLookupTable_bp03Data_l, 5U, &rtb_vs1g_c);
    fractions_1[2U] = rtb_vs1g_c;
    A380PrimComputerFe_VS1GfromVLS(look2_binlxpw(rtb_uDLookupTable,
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_standard_ft,
      A380PrimComputerFe_P.uDLookupTable1_bp01Data_o, A380PrimComputerFe_P.uDLookupTable1_bp02Data_p,
      A380PrimComputerFe_P.uDLookupTable1_tableData_p, A380PrimComputerFe_P.uDLookupTable1_maxIndex_g, 8U), intrp3d_l_pw
      (bpIndices_1, fractions_1, A380PrimComputerFe_P.nDLookupTable_tableData_p,
       A380PrimComputerFe_P.nDLookupTable_dimSizes_l), rtb_conf, &rtb_vs1g_c);
    if (static_cast<real_T>(A380PrimComputerFe_DWork.takeoff_config_e != -1.0) > A380PrimComputerFe_P.Switch_Threshold)
    {
      A380PrimComputerFe_Y.out.flight_envelope.v_3_kn = std::fmax(A380PrimComputerFe_P.Vmcl5_Value,
        A380PrimComputerFe_P.Gain4_Gain * rtb_vs1g);
    } else {
      A380PrimComputerFe_Y.out.flight_envelope.v_3_kn = std::fmin(A380PrimComputerFe_P.Vfe_35_Value, std::fmax
        (rtb_vs1g_c * look1_binlxpw(static_cast<real_T>(A380PrimComputerFe_U.in.general_logic.flap_handle_index),
        A380PrimComputerFe_P.uDLookupTable_bp01Data, A380PrimComputerFe_P.uDLookupTable_tableData, 1U),
         A380PrimComputerFe_P.Vmcl10_Value));
    }

    rtb_Switch *= A380PrimComputerFe_P.Gain2_Gain_n;
    bpIndices_2[0U] = plook_binx(rtb_Switch, A380PrimComputerFe_P.nDLookupTable_bp01Data_cz, 7U, &rtb_vs1g_c);
    fractions_2[0U] = rtb_vs1g_c;
    bpIndices_2[1U] = plook_binx(static_cast<real_T>(rtb_uDLookupTable_a), A380PrimComputerFe_P.nDLookupTable_bp02Data_i,
      1U, &rtb_vs1g_c);
    fractions_2[1U] = rtb_vs1g_c;
    bpIndices_2[2U] = plook_binx(A380PrimComputerFe_P.Constant_Value_a, A380PrimComputerFe_P.nDLookupTable_bp03Data_h,
      5U, &rtb_vs1g_c);
    fractions_2[2U] = rtb_vs1g_c;
    A380PrimComputerFe_VS1GfromVLS(look2_binlxpw(rtb_Switch,
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_standard_ft,
      A380PrimComputerFe_P.uDLookupTable1_bp01Data_pl, A380PrimComputerFe_P.uDLookupTable1_bp02Data_b,
      A380PrimComputerFe_P.uDLookupTable1_tableData_m, A380PrimComputerFe_P.uDLookupTable1_maxIndex_h, 8U), intrp3d_l_pw
      (bpIndices_2, fractions_2, A380PrimComputerFe_P.nDLookupTable_tableData_d,
       A380PrimComputerFe_P.nDLookupTable_dimSizes_j), A380PrimComputerFe_P.Constant_Value_a, &rtb_vs1g);
    rtb_Switch = std::fmax(A380PrimComputerFe_P.Gain2_Gain_j * rtb_vs1g, A380PrimComputerFe_P.Vmcl20_Value);
    A380PrimComputerFe_Y.out.flight_envelope.v_stall_kn = rtb_Y_p;
    rtb_uDLookupTable = std::fmax(A380PrimComputerFe_P.Constant1_Value_j, 0.0);
    if (A380PrimComputerFe_U.in.general_logic.adr_computation_data.V_ias_kn > A380PrimComputerFe_P.Saturation_UpperSat)
    {
      rtb_vs1g_c = A380PrimComputerFe_P.Saturation_UpperSat;
    } else if (A380PrimComputerFe_U.in.general_logic.adr_computation_data.V_ias_kn <
               A380PrimComputerFe_P.Saturation_LowerSat) {
      rtb_vs1g_c = A380PrimComputerFe_P.Saturation_LowerSat;
    } else {
      rtb_vs1g_c = A380PrimComputerFe_U.in.general_logic.adr_computation_data.V_ias_kn;
    }

    A380PrimComputerFe_LagFilter(rtb_vs1g_c, A380PrimComputerFe_P.LagFilter_C1_d, A380PrimComputerFe_U.in.data.time.dt,
      &rtb_Y_p, &A380PrimComputerFe_DWork.sf_LagFilter_d);
    if ((!A380PrimComputerFe_DWork.pY_not_empty_d) || (!A380PrimComputerFe_DWork.pU_not_empty)) {
      A380PrimComputerFe_DWork.pU = rtb_Y_p;
      A380PrimComputerFe_DWork.pU_not_empty = true;
      A380PrimComputerFe_DWork.pY_b = rtb_Y_p;
      A380PrimComputerFe_DWork.pY_not_empty_d = true;
    }

    rtb_vs1g = A380PrimComputerFe_U.in.data.time.dt * A380PrimComputerFe_P.WashoutFilter_C1 + 2.0;
    rtb_vs1g_c = 2.0 / rtb_vs1g;
    A380PrimComputerFe_DWork.pY_b = (2.0 - A380PrimComputerFe_U.in.data.time.dt * A380PrimComputerFe_P.WashoutFilter_C1)
      / rtb_vs1g * A380PrimComputerFe_DWork.pY_b + (rtb_Y_p * rtb_vs1g_c - A380PrimComputerFe_DWork.pU * rtb_vs1g_c);
    A380PrimComputerFe_DWork.pU = rtb_Y_p;
    A380PrimComputerFe_LagFilter(A380PrimComputerFe_U.in.general_logic.ir_computation_data.n_z_g +
      A380PrimComputerFe_P.Bias_Bias, A380PrimComputerFe_P.LagFilter2_C1, A380PrimComputerFe_U.in.data.time.dt, &rtb_Y_p,
      &A380PrimComputerFe_DWork.sf_LagFilter_pa);
    if (A380PrimComputerFe_U.in.general_logic.on_ground) {
      rtb_vs1g = A380PrimComputerFe_U.in.general_logic.ir_computation_data.theta_deg;
    } else {
      rtb_vs1g = A380PrimComputerFe_U.in.general_logic.adr_computation_data.alpha_deg;
    }

    if (rtb_Y_p > A380PrimComputerFe_P.Saturation1_UpperSat) {
      rtb_vs1g_c = A380PrimComputerFe_P.Saturation1_UpperSat;
    } else if (rtb_Y_p < A380PrimComputerFe_P.Saturation1_LowerSat) {
      rtb_vs1g_c = A380PrimComputerFe_P.Saturation1_LowerSat;
    } else {
      rtb_vs1g_c = rtb_Y_p;
    }

    A380PrimComputerFe_LagFilter(A380PrimComputerFe_P.Gain_Gain_e *
      A380PrimComputerFe_U.in.general_logic.ir_computation_data.n_x_g - rtb_vs1g * (rtb_vs1g_c +
      A380PrimComputerFe_P.Bias1_Bias), A380PrimComputerFe_P.LagFilter1_C1, A380PrimComputerFe_U.in.data.time.dt,
      &rtb_Y_p, &A380PrimComputerFe_DWork.sf_LagFilter_p);
    rtb_vs1g *= std::cos(A380PrimComputerFe_P.Gain1_Gain *
                         A380PrimComputerFe_U.in.general_logic.ir_computation_data.phi_deg);
    A380PrimComputerFe_LagFilter(A380PrimComputerFe_U.in.general_logic.ir_computation_data.theta_deg - rtb_vs1g,
      A380PrimComputerFe_P.LagFilter_C1_f, A380PrimComputerFe_U.in.data.time.dt, &rtb_vs1g,
      &A380PrimComputerFe_DWork.sf_LagFilter_e);
    A380PrimComputerFe_Y.out.data = A380PrimComputerFe_U.in.data;
    A380PrimComputerFe_Y.out.general_logic = A380PrimComputerFe_U.in.general_logic;
    A380PrimComputerFe_Y.out.flight_envelope.beta_target_deg = 0.0;
    A380PrimComputerFe_Y.out.flight_envelope.beta_target_visible = false;
    A380PrimComputerFe_Y.out.flight_envelope.alpha_floor_condition = (A380PrimComputerFe_DWork.sAlphaFloor != 0.0);
    A380PrimComputerFe_Y.out.flight_envelope.computed_gross_weight_kg =
      rtb_BusAssignment_ji_flight_envelope_computed_gross_weight_kg;
    A380PrimComputerFe_Y.out.flight_envelope.computed_gross_weight_cg_percent = rtb_uDLookupTable_a;
    A380PrimComputerFe_Y.out.flight_envelope.gross_weight_cg_lost = !rtb_Equal;
    A380PrimComputerFe_Y.out.flight_envelope.gross_weight_disagree =
      A380PrimComputerFe_U.in.flight_envelope.gross_weight_disagree;
    A380PrimComputerFe_Y.out.flight_envelope.gross_weight_cg_disagree =
      A380PrimComputerFe_U.in.flight_envelope.gross_weight_cg_disagree;
    A380PrimComputerFe_Y.out.flight_envelope.speed_scale_lost = (A380PrimComputerFe_U.in.general_logic.all_sfcc_lost ||
      A380PrimComputerFe_U.in.general_logic.triple_adr_failure);
    A380PrimComputerFe_Y.out.flight_envelope.speed_scale_visible = A380PrimComputerFe_DWork.output;
    A380PrimComputerFe_Y.out.flight_envelope.v_3_visible = ((A380PrimComputerFe_U.in.general_logic.flap_handle_index ==
      A380PrimComputerFe_P.CompareToConstant4_const) || (A380PrimComputerFe_U.in.general_logic.flap_handle_index ==
      A380PrimComputerFe_P.CompareToConstant2_const));
    A380PrimComputerFe_Y.out.flight_envelope.v_4_kn = std::fmin(rtb_Switch, A380PrimComputerFe_P.Vfe_25_Value);
    A380PrimComputerFe_Y.out.flight_envelope.v_4_visible = ((A380PrimComputerFe_U.in.general_logic.flap_handle_index ==
      A380PrimComputerFe_P.CompareToConstant3_const) || (A380PrimComputerFe_U.in.general_logic.flap_handle_index ==
      A380PrimComputerFe_P.CompareToConstant1_const));
    A380PrimComputerFe_Y.out.flight_envelope.v_man_kn = look2_binlxpw(A380PrimComputerFe_P.Gain3_Gain *
      rtb_BusAssignment_ji_flight_envelope_computed_gross_weight_kg,
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_standard_ft,
      A380PrimComputerFe_P.uDLookupTable_bp01Data_n, A380PrimComputerFe_P.uDLookupTable_bp02Data,
      A380PrimComputerFe_P.uDLookupTable_tableData_p, A380PrimComputerFe_P.uDLookupTable_maxIndex, 8U);
    A380PrimComputerFe_Y.out.flight_envelope.v_man_visible = (A380PrimComputerFe_U.in.general_logic.flap_handle_index ==
      A380PrimComputerFe_P.CompareToConstant_const);
    if (A380PrimComputerFe_U.in.general_logic.landing_gear_down) {
      rtb_vs1g_c = A380PrimComputerFe_P.Constant2_Value;
    } else {
      rtb_vs1g_c = A380PrimComputerFe_P.Constant3_Value;
    }

    A380PrimComputerFe_Y.out.flight_envelope.v_max_kn = std::fmin(std::fmin(std::fmin(rtb_vs1g_c, std::sqrt(std::pow
      ((std::pow(rtb_uDLookupTable * rtb_uDLookupTable * 0.2 + 1.0, 3.5) - 1.0) * (std::fmax
      (A380PrimComputerFe_U.in.general_logic.adr_computation_data.p_s_c_hpa, 0.0) / 1013.25) + 1.0, 0.2857142857142857)
      - 1.0) * 1479.1), static_cast<real_T>(look2_iflf_binlxpw
      (A380PrimComputerFe_U.in.general_logic.flap_surface_angle_deg,
       A380PrimComputerFe_U.in.general_logic.slat_surface_angle_deg, A380PrimComputerFe_P.uDLookupTable_bp01Data_e,
       A380PrimComputerFe_P.uDLookupTable_bp02Data_o, A380PrimComputerFe_P.uDLookupTable_tableData_a,
       A380PrimComputerFe_P.uDLookupTable_maxIndex_a, 5U))), look1_binlxpw(static_cast<real_T>
      (A380PrimComputerFe_U.in.general_logic.flap_handle_index), A380PrimComputerFe_P.uDLookupTable_bp01Data_m,
      A380PrimComputerFe_P.uDLookupTable_tableData_b, 5U));
    A380PrimComputerFe_Y.out.flight_envelope.v_fe_next_kn = look1_binlxpw(static_cast<real_T>
      (A380PrimComputerFe_U.in.general_logic.flap_handle_index), A380PrimComputerFe_P.uDLookupTable1_bp01Data_j,
      A380PrimComputerFe_P.uDLookupTable1_tableData_l, 5U);
    A380PrimComputerFe_Y.out.flight_envelope.v_fe_next_visible =
      ((A380PrimComputerFe_U.in.general_logic.flap_handle_index < A380PrimComputerFe_P.CompareToConstant_const_b) &&
       (A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_standard_ft <=
        A380PrimComputerFe_P.CompareToConstant1_const_b));
    A380PrimComputerFe_Y.out.flight_envelope.v_c_trend_kn = A380PrimComputerFe_P.Gain_Gain_m *
      A380PrimComputerFe_DWork.pY_b;
    A380PrimComputerFe_Y.out.flight_envelope.gamma_a_deg = rtb_vs1g;
    A380PrimComputerFe_Y.out.flight_envelope.gamma_t_deg = rtb_Y_p;
    A380PrimComputerFe_Y.out.flight_envelope.pitch_pitch_warning_active = false;
    A380PrimComputerFe_Y.out.laws = A380PrimComputerFe_U.in.laws;
    A380PrimComputerFe_Y.out.fctl_logic = A380PrimComputerFe_U.in.fctl_logic;
    A380PrimComputerFe_Y.out.fg_logic = A380PrimComputerFe_U.in.fg_logic;
    A380PrimComputerFe_Y.out.fg_mode_logic = A380PrimComputerFe_U.in.fg_mode_logic;
    A380PrimComputerFe_Y.out.fg_laws = A380PrimComputerFe_U.in.fg_laws;
    A380PrimComputerFe_Y.out.discrete_outputs = A380PrimComputerFe_U.in.discrete_outputs;
    A380PrimComputerFe_Y.out.analog_outputs = A380PrimComputerFe_U.in.analog_outputs;
    A380PrimComputerFe_Y.out.bus_outputs = A380PrimComputerFe_U.in.bus_outputs;
    A380PrimComputerFe_Y.out.flight_envelope.low_energy_warning_active = false;
    A380PrimComputerFe_DWork.Delay_DSTATE = rtb_Gain;
  } else {
    A380PrimComputerFe_DWork.Runtime_MODE = false;
  }
}

void A380PrimComputerFe::initialize()
{
  A380PrimComputerFe_DWork.Delay_DSTATE = A380PrimComputerFe_P.DiscreteDerivativeVariableTs_InitialCondition;
  A380PrimComputerFe_Y.out = A380PrimComputerFe_P.out_Y0;
}

void A380PrimComputerFe::terminate()
{
}

A380PrimComputerFe::A380PrimComputerFe():
  A380PrimComputerFe_U(),
  A380PrimComputerFe_Y(),
  A380PrimComputerFe_DWork()
{
}

A380PrimComputerFe::~A380PrimComputerFe() = default;
