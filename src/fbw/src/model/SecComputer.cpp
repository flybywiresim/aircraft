#include "SecComputer.h"
#include "SecComputer_types.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"
#include "LateralDirectLaw.h"
#include "PitchAlternateLaw.h"
#include "PitchDirectLaw.h"

const uint8_T SecComputer_IN_InAir{ 1U };

const uint8_T SecComputer_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T SecComputer_IN_OnGround{ 2U };

const uint8_T SecComputer_IN_Flight{ 1U };

const uint8_T SecComputer_IN_FlightToGroundTransition{ 2U };

const uint8_T SecComputer_IN_Ground{ 3U };

const real_T SecComputer_RGND{ 0.0 };

void SecComputer::SecComputer_MATLABFunction(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
{
  real32_T tmp;
  uint32_T a;
  tmp = std::round(rtu_u->Data);
  if (tmp < 4.2949673E+9F) {
    if (tmp >= 0.0F) {
      a = static_cast<uint32_T>(tmp);
    } else {
      a = 0U;
    }
  } else {
    a = MAX_uint32_T;
  }

  if (-(rtu_bit - 1.0) >= 0.0) {
    if (-(rtu_bit - 1.0) <= 31.0) {
      a <<= static_cast<uint8_T>(-(rtu_bit - 1.0));
    } else {
      a = 0U;
    }
  } else if (-(rtu_bit - 1.0) >= -31.0) {
    a >>= static_cast<uint8_T>(rtu_bit - 1.0);
  } else {
    a = 0U;
  }

  *rty_y = a & 1U;
}

void SecComputer::SecComputer_RateLimiter_Reset(rtDW_RateLimiter_SecComputer_T *localDW)
{
  localDW->pY_not_empty = false;
}

void SecComputer::SecComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
  real_T *rty_Y, rtDW_RateLimiter_SecComputer_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void SecComputer::SecComputer_MATLABFunction_l(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void SecComputer::SecComputer_MATLABFunction_h_Reset(rtDW_MATLABFunction_SecComputer_g_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void SecComputer::SecComputer_MATLABFunction_c(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
  rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_SecComputer_g_T *localDW)
{
  if (rtu_u == rtu_isRisingEdge) {
    localDW->timeSinceCondition += rtu_Ts;
    if (localDW->timeSinceCondition >= rtu_timeDelay) {
      localDW->output = rtu_u;
    }
  } else {
    localDW->timeSinceCondition = 0.0;
    localDW->output = rtu_u;
  }

  *rty_y = localDW->output;
}

void SecComputer::SecComputer_MATLABFunction_g_Reset(rtDW_MATLABFunction_SecComputer_l_T *localDW)
{
  localDW->output_not_empty = false;
  localDW->previousInput_not_empty = false;
}

void SecComputer::SecComputer_MATLABFunction_e(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_SecComputer_l_T *localDW)
{
  boolean_T rtu_isRisingEdge_0;
  if (!localDW->output_not_empty) {
    localDW->output = rtu_u;
    localDW->output_not_empty = true;
  }

  if (!localDW->previousInput_not_empty) {
    localDW->previousInput = rtu_isRisingEdge;
    localDW->previousInput_not_empty = true;
  }

  if (rtu_isRisingEdge) {
    rtu_isRisingEdge_0 = (rtu_u && (!localDW->previousInput));
  } else {
    rtu_isRisingEdge_0 = ((!rtu_u) && localDW->previousInput);
  }

  localDW->output = ((!localDW->output) && rtu_isRisingEdge_0);
  localDW->previousInput = rtu_u;
  *rty_y = localDW->output;
}

void SecComputer::SecComputer_MATLABFunction_cw(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void SecComputer::step()
{
  real_T rtb_eta_deg;
  real_T rtb_eta_trim_dot_deg_s;
  real_T rtb_eta_trim_limit_lo;
  real_T rtb_eta_trim_limit_up;
  real_T pair2RollCommand;
  real_T rtb_Switch6;
  real_T rtb_Switch_o;
  real_T rtb_handleIndex;
  real_T rtb_xi_deg;
  uint32_T rtb_DataTypeConversion1;
  uint32_T rtb_Switch7_c;
  uint32_T rtb_Switch9;
  uint32_T rtb_y;
  uint32_T rtb_y_af;
  uint32_T rtb_y_m;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_a[19];
  boolean_T rtb_AND1_h;
  boolean_T rtb_AND3_b;
  boolean_T rtb_AND4_a;
  boolean_T rtb_OR14;
  boolean_T rtb_OR16;
  boolean_T rtb_y_a;
  boolean_T rtb_y_b;
  boolean_T rtb_y_e;
  boolean_T rtb_y_j;
  boolean_T rtb_y_kc;
  boolean_T rtb_y_nd;
  if (SecComputer_U.in.sim_data.computer_running) {
    real_T pair1RollCommand;
    real32_T rtb_V_ias;
    real32_T rtb_V_tas;
    real32_T rtb_alpha;
    real32_T rtb_mach_or;
    real32_T rtb_n_x;
    real32_T rtb_n_y;
    real32_T rtb_n_z;
    real32_T rtb_phi;
    real32_T rtb_phi_dot;
    real32_T rtb_q;
    real32_T rtb_r;
    real32_T rtb_theta;
    real32_T rtb_theta_dot;
    boolean_T canEngageInPitch;
    boolean_T hasPriorityInPitch;
    boolean_T rtb_AND13;
    boolean_T rtb_AND2_j;
    boolean_T rtb_AND2_p;
    boolean_T rtb_AND_hp;
    boolean_T rtb_OR1_gd;
    boolean_T rtb_OR6;
    boolean_T rtb_doubleAdrFault;
    boolean_T rtb_doubleIrFault;
    boolean_T rtb_isEngagedInPitch;
    boolean_T rtb_logic_crg14k_cas_or_mach_disagree;
    boolean_T rtb_singleIrFault;
    boolean_T rtb_thsAvail;
    boolean_T spoilerPair1SupplyAvail;
    boolean_T spoilerPair2SupplyAvail;
    pitch_efcs_law rtb_activePitchLaw;
    pitch_efcs_law rtb_pitchLawCapability;
    if (!SecComputer_DWork.Runtime_MODE) {
      SecComputer_DWork.Delay_DSTATE_c = SecComputer_P.Delay_InitialCondition_c;
      SecComputer_DWork.Delay1_DSTATE = SecComputer_P.Delay1_InitialCondition;
      SecComputer_DWork.Memory_PreviousInput = SecComputer_P.SRFlipFlop_initial_condition;
      SecComputer_DWork.Memory_PreviousInput_f = SecComputer_P.SRFlipFlop_initial_condition_c;
      SecComputer_DWork.Memory_PreviousInput_n = SecComputer_P.SRFlipFlop_initial_condition_k;
      SecComputer_DWork.Delay1_DSTATE_i = SecComputer_P.Delay1_InitialCondition_l;
      SecComputer_DWork.Delay_DSTATE_n = SecComputer_P.Delay_InitialCondition_j;
      SecComputer_DWork.Delay_DSTATE = SecComputer_P.Delay_InitialCondition;
      SecComputer_DWork.icLoad = true;
      SecComputer_DWork.is_active_c8_SecComputer = 0U;
      SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_NO_ACTIVE_CHILD;
      SecComputer_MATLABFunction_h_Reset(&SecComputer_DWork.sf_MATLABFunction_gs);
      SecComputer_MATLABFunction_h_Reset(&SecComputer_DWork.sf_MATLABFunction_eg);
      SecComputer_MATLABFunction_h_Reset(&SecComputer_DWork.sf_MATLABFunction_c);
      SecComputer_MATLABFunction_h_Reset(&SecComputer_DWork.sf_MATLABFunction_jk);
      SecComputer_MATLABFunction_h_Reset(&SecComputer_DWork.sf_MATLABFunction_dw);
      SecComputer_DWork.is_active_c30_SecComputer = 0U;
      SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_NO_ACTIVE_CHILD;
      SecComputer_DWork.on_ground_time = 0.0;
      SecComputer_B.in_flight = 0.0;
      SecComputer_MATLABFunction_h_Reset(&SecComputer_DWork.sf_MATLABFunction_ndv);
      SecComputer_MATLABFunction_h_Reset(&SecComputer_DWork.sf_MATLABFunction_gf);
      SecComputer_MATLABFunction_h_Reset(&SecComputer_DWork.sf_MATLABFunction_h);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_g4b);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_nu);
      SecComputer_DWork.pLeftStickDisabled = false;
      SecComputer_DWork.pRightStickDisabled = false;
      SecComputer_MATLABFunction_h_Reset(&SecComputer_DWork.sf_MATLABFunction_j2);
      SecComputer_MATLABFunction_h_Reset(&SecComputer_DWork.sf_MATLABFunction_g24);
      SecComputer_DWork.abnormalConditionWasActive = false;
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_b4);
      SecComputer_MATLABFunction_h_Reset(&SecComputer_DWork.sf_MATLABFunction_fh);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_nd);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_n);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_a);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_e3);
      SecComputer_RateLimiter_Reset(&SecComputer_DWork.sf_RateLimiter_c);
      SecComputer_RateLimiter_Reset(&SecComputer_DWork.sf_RateLimiter);
      LawMDLOBJ1.reset();
      SecComputer_RateLimiter_Reset(&SecComputer_DWork.sf_RateLimiter_b);
      SecComputer_RateLimiter_Reset(&SecComputer_DWork.sf_RateLimiter_f);
      SecComputer_RateLimiter_Reset(&SecComputer_DWork.sf_RateLimiter_j);
      SecComputer_RateLimiter_Reset(&SecComputer_DWork.sf_RateLimiter_d);
      LawMDLOBJ2.reset();
      LawMDLOBJ3.reset();
      SecComputer_DWork.Runtime_MODE = true;
    }

    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, SecComputer_P.BitfromLabel4_bit,
      &rtb_Switch7_c);
    rtb_OR1_gd = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, SecComputer_P.BitfromLabel6_bit,
      &rtb_Switch7_c);
    rtb_OR16 = (rtb_OR1_gd || (rtb_Switch7_c != 0U));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, SecComputer_P.BitfromLabel5_bit,
      &rtb_Switch7_c);
    rtb_y_e = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, SecComputer_P.BitfromLabel7_bit,
      &rtb_Switch7_c);
    rtb_OR14 = (rtb_y_e || (rtb_Switch7_c != 0U));
    if (SecComputer_DWork.is_active_c8_SecComputer == 0U) {
      SecComputer_DWork.is_active_c8_SecComputer = 1U;
      SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_OnGround;
      rtb_OR16 = true;
    } else if (SecComputer_DWork.is_c8_SecComputer == SecComputer_IN_InAir) {
      if ((static_cast<real_T>(rtb_OR16) > 0.1) || (static_cast<real_T>(rtb_OR14) > 0.1)) {
        SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_OnGround;
        rtb_OR16 = true;
      } else {
        rtb_OR16 = false;
      }
    } else if ((!rtb_OR16) && (!rtb_OR14)) {
      SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_InAir;
      rtb_OR16 = false;
    } else {
      rtb_OR16 = true;
    }

    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn, &rtb_y_nd);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn, &rtb_y_b);
    SecComputer_MATLABFunction_c(rtb_y_nd && rtb_y_b && (std::abs
      (SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data -
       SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) > SecComputer_P.CompareToConstant_const_n),
      SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode_isRisingEdge, SecComputer_P.ConfirmNode_timeDelay, &rtb_y_nd,
      &SecComputer_DWork.sf_MATLABFunction_gs);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_1_bus.mach, &rtb_y_kc);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_2_bus.mach, &rtb_y_b);
    SecComputer_MATLABFunction_c(rtb_y_kc && rtb_y_b && (std::abs(SecComputer_U.in.bus_inputs.adr_1_bus.mach.Data -
      SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data) > SecComputer_P.CompareToConstant1_const_d),
      SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode1_isRisingEdge, SecComputer_P.ConfirmNode1_timeDelay, &rtb_y_b,
      &SecComputer_DWork.sf_MATLABFunction_eg);
    rtb_y_e = (rtb_y_nd || rtb_y_b);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg, &rtb_y_nd);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg, &rtb_y_b);
    SecComputer_MATLABFunction_c(rtb_y_nd && rtb_y_b && (std::abs
      (SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data -
       SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) > SecComputer_P.CompareToConstant_const_k),
      SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode_isRisingEdge_f, SecComputer_P.ConfirmNode_timeDelay_l,
      &rtb_y_b, &SecComputer_DWork.sf_MATLABFunction_c);
    rtb_y_kc = ((SecComputer_U.in.bus_inputs.adr_1_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
      (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                (SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || rtb_y_e || rtb_y_b);
    rtb_y_nd = ((SecComputer_U.in.bus_inputs.adr_2_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
      (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                (SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || rtb_y_e || rtb_y_b);
    rtb_OR14 = (rtb_y_kc || rtb_y_nd);
    rtb_doubleAdrFault = (rtb_y_kc && rtb_y_nd);
    rtb_OR1_gd = ((SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.SSM == static_cast<uint32_T>
      (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                  (SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.SSM == static_cast<uint32_T>
      (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                  (SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM == static_cast<uint32_T>
                   (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) || SecComputer_P.Constant_Value_l);
    rtb_OR6 = ((SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM ==
                static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
               (SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM ==
                static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
               (SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || SecComputer_P.Constant_Value_l);
    rtb_singleIrFault = (rtb_OR1_gd || rtb_OR6);
    rtb_doubleIrFault = (rtb_OR1_gd && rtb_OR6);
    rtb_logic_crg14k_cas_or_mach_disagree = !rtb_y_kc;
    rtb_thsAvail = !rtb_y_nd;
    if (rtb_logic_crg14k_cas_or_mach_disagree && rtb_thsAvail) {
      rtb_V_ias = (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data +
                   SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data +
                   SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach_or = (SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data + SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data) /
        2.0F;
      rtb_alpha = (SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data +
                   SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if (rtb_logic_crg14k_cas_or_mach_disagree && rtb_y_nd) {
      rtb_V_ias = SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
      rtb_V_tas = SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
      rtb_mach_or = SecComputer_U.in.bus_inputs.adr_1_bus.mach.Data;
      rtb_alpha = SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    } else if (rtb_y_kc && rtb_thsAvail) {
      rtb_V_ias = SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
      rtb_V_tas = SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
      rtb_mach_or = SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data;
      rtb_alpha = SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    } else {
      rtb_V_ias = 0.0F;
      rtb_V_tas = 0.0F;
      rtb_mach_or = 0.0F;
      rtb_alpha = 0.0F;
    }

    rtb_logic_crg14k_cas_or_mach_disagree = !rtb_OR1_gd;
    rtb_thsAvail = !rtb_OR6;
    if (rtb_logic_crg14k_cas_or_mach_disagree && rtb_thsAvail) {
      rtb_theta = (SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data +
                   SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data) / 2.0F;
      rtb_phi = (SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data +
                 SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data) / 2.0F;
      rtb_q = (SecComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data +
               SecComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data) / 2.0F;
      rtb_r = (SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data +
               SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data) / 2.0F;
      rtb_n_x = (SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data +
                 SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data) / 2.0F;
      rtb_n_y = (SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data +
                 SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data) / 2.0F;
      rtb_n_z = (SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data +
                 SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data) / 2.0F;
      rtb_theta_dot = (SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data +
                       SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data) / 2.0F;
      rtb_phi_dot = (SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data +
                     SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data) / 2.0F;
    } else if (rtb_logic_crg14k_cas_or_mach_disagree && rtb_OR6) {
      rtb_theta = SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
      rtb_phi = SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
      rtb_q = SecComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
      rtb_r = SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
      rtb_n_y = SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
      rtb_n_z = SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
      rtb_theta_dot = SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    } else if (rtb_OR1_gd && rtb_thsAvail) {
      rtb_theta = SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
      rtb_phi = SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data;
      rtb_q = SecComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
      rtb_r = SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data;
      rtb_n_y = SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
      rtb_n_z = SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
      rtb_theta_dot = SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
    } else {
      rtb_theta = 0.0F;
      rtb_phi = 0.0F;
      rtb_q = 0.0F;
      rtb_r = 0.0F;
      rtb_n_x = 0.0F;
      rtb_n_y = 0.0F;
      rtb_n_z = 0.0F;
      rtb_theta_dot = 0.0F;
      rtb_phi_dot = 0.0F;
    }

    SecComputer_B.laws.lateral_law_outputs.right_spoiler_1_command_deg = rtb_theta;
    SecComputer_B.laws.lateral_law_outputs.left_spoiler_1_command_deg = rtb_phi;
    SecComputer_B.laws.lateral_law_outputs.left_spoiler_2_command_deg = rtb_n_x;
    SecComputer_B.laws.lateral_law_outputs.right_spoiler_2_command_deg = rtb_n_y;
    rtb_logic_crg14k_cas_or_mach_disagree = rtb_y_e;
    SecComputer_B.logic.alpha_disagree = rtb_y_b;
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, &rtb_y_kc);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      SecComputer_P.BitfromLabel13_bit, &rtb_Switch7_c);
    rtb_y_e = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      SecComputer_P.BitfromLabel12_bit, &rtb_Switch7_c);
    rtb_OR1_gd = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      SecComputer_P.BitfromLabel10_bit, &rtb_Switch7_c);
    rtb_y_e = (rtb_y_e || rtb_OR1_gd || (rtb_Switch7_c != 0U));
    rtb_y_a = (rtb_y_kc && rtb_y_e);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, &rtb_AND3_b);
    rtb_y_nd = (rtb_y_a && (!rtb_AND3_b));
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, &rtb_y_b);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
      SecComputer_P.BitfromLabel5_bit_h, &rtb_Switch7_c);
    rtb_OR1_gd = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
      SecComputer_P.BitfromLabel4_bit_c, &rtb_Switch7_c);
    rtb_y_j = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, SecComputer_P.BitfromLabel2_bit,
      &rtb_Switch7_c);
    rtb_OR1_gd = (rtb_OR1_gd || rtb_y_j || (rtb_Switch7_c != 0U));
    rtb_AND4_a = (rtb_y_b && rtb_OR1_gd);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, &rtb_AND3_b);
    rtb_AND4_a = (rtb_y_nd || (rtb_AND4_a && (!rtb_AND3_b)) || (rtb_y_a && rtb_AND4_a));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
      SecComputer_P.BitfromLabel15_bit, &rtb_Switch7_c);
    rtb_y_j = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, &rtb_y_nd);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
      SecComputer_P.BitfromLabel14_bit, &rtb_Switch7_c);
    rtb_y_a = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
      SecComputer_P.BitfromLabel11_bit, &rtb_Switch7_c);
    rtb_AND1_h = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, SecComputer_P.BitfromLabel8_bit,
      &rtb_Switch7_c);
    rtb_OR6 = ((!rtb_y_a) && (!rtb_AND1_h) && (rtb_Switch7_c == 0U));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      SecComputer_P.BitfromLabel16_bit, &rtb_Switch7_c);
    rtb_AND3_b = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction_c((rtb_Switch7_c != 0U) && rtb_y_kc && rtb_y_e, SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode_isRisingEdge_d, SecComputer_P.ConfirmNode_timeDelay_g, &rtb_y_e,
      &SecComputer_DWork.sf_MATLABFunction_jk);
    rtb_AND_hp = (rtb_y_j && rtb_y_nd && rtb_OR6 && rtb_y_e);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, &rtb_AND1_h);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, &rtb_AND3_b);
    rtb_AND13 = ((!rtb_AND1_h) && (!rtb_AND3_b));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      SecComputer_P.BitfromLabel7_bit_o, &rtb_Switch7_c);
    rtb_AND3_b = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, &rtb_y_nd);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      SecComputer_P.BitfromLabel6_bit_e, &rtb_Switch7_c);
    rtb_AND1_h = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, SecComputer_P.BitfromLabel3_bit,
      &rtb_Switch7_c);
    rtb_y_j = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, SecComputer_P.BitfromLabel1_bit,
      &rtb_Switch7_c);
    rtb_y_e = (rtb_AND3_b && rtb_y_nd && ((!rtb_AND1_h) && (!rtb_y_j) && (rtb_Switch7_c == 0U)));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, SecComputer_P.BitfromLabel9_bit,
      &rtb_Switch7_c);
    rtb_AND3_b = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction_c((rtb_Switch7_c != 0U) && rtb_y_b && rtb_OR1_gd, SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode1_isRisingEdge_f, SecComputer_P.ConfirmNode1_timeDelay_c, &rtb_AND3_b,
      &SecComputer_DWork.sf_MATLABFunction_dw);
    rtb_y_j = (rtb_y_e && rtb_AND3_b);
    if (SecComputer_DWork.is_active_c30_SecComputer == 0U) {
      SecComputer_DWork.is_active_c30_SecComputer = 1U;
      SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_Ground;
      SecComputer_B.in_flight = 0.0;
    } else {
      switch (SecComputer_DWork.is_c30_SecComputer) {
       case SecComputer_IN_Flight:
        if (rtb_OR16 && (rtb_theta < 2.5F)) {
          SecComputer_DWork.on_ground_time = SecComputer_U.in.time.simulation_time;
          SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_FlightToGroundTransition;
        } else {
          SecComputer_B.in_flight = 1.0;
        }
        break;

       case SecComputer_IN_FlightToGroundTransition:
        if (SecComputer_U.in.time.simulation_time - SecComputer_DWork.on_ground_time >= 5.0) {
          SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_Ground;
          SecComputer_B.in_flight = 0.0;
        } else if ((!rtb_OR16) || (rtb_theta >= 2.5F)) {
          SecComputer_DWork.on_ground_time = 0.0;
          SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_Flight;
          SecComputer_B.in_flight = 1.0;
        }
        break;

       default:
        if (((!rtb_OR16) && (rtb_theta > 8.0F)) || (SecComputer_P.Constant_Value_m > 400.0)) {
          SecComputer_DWork.on_ground_time = 0.0;
          SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_Flight;
          SecComputer_B.in_flight = 1.0;
        } else {
          SecComputer_B.in_flight = 0.0;
        }
        break;
      }
    }

    rtb_AND3_b = (SecComputer_B.in_flight != 0.0);
    SecComputer_MATLABFunction_c(!SecComputer_U.in.discrete_inputs.yellow_low_pressure, SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode_isRisingEdge_a, SecComputer_P.ConfirmNode_timeDelay_c, &rtb_y_kc,
      &SecComputer_DWork.sf_MATLABFunction_ndv);
    SecComputer_MATLABFunction_c(!SecComputer_U.in.discrete_inputs.blue_low_pressure, SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode1_isRisingEdge_j, SecComputer_P.ConfirmNode1_timeDelay_k, &rtb_y_nd,
      &SecComputer_DWork.sf_MATLABFunction_gf);
    SecComputer_MATLABFunction_c(!SecComputer_U.in.discrete_inputs.green_low_pressure, SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode2_isRisingEdge, SecComputer_P.ConfirmNode2_timeDelay, &rtb_y_b,
      &SecComputer_DWork.sf_MATLABFunction_h);
    SecComputer_MATLABFunction_e(SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
      SecComputer_P.PulseNode_isRisingEdge, &rtb_AND1_h, &SecComputer_DWork.sf_MATLABFunction_g4b);
    SecComputer_MATLABFunction_e(SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed,
      SecComputer_P.PulseNode1_isRisingEdge, &rtb_AND3_b, &SecComputer_DWork.sf_MATLABFunction_nu);
    if (rtb_AND1_h) {
      SecComputer_DWork.pRightStickDisabled = true;
      SecComputer_DWork.pLeftStickDisabled = false;
    } else if (rtb_AND3_b) {
      SecComputer_DWork.pLeftStickDisabled = true;
      SecComputer_DWork.pRightStickDisabled = false;
    }

    if (SecComputer_DWork.pRightStickDisabled && ((!SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed) &&
         (!SecComputer_DWork.Delay1_DSTATE))) {
      SecComputer_DWork.pRightStickDisabled = false;
    } else if (SecComputer_DWork.pLeftStickDisabled) {
      SecComputer_DWork.pLeftStickDisabled = (SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed ||
        SecComputer_DWork.Delay_DSTATE_c);
    }

    SecComputer_MATLABFunction_c(SecComputer_DWork.pLeftStickDisabled &&
      (SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed || SecComputer_DWork.Delay_DSTATE_c),
      SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode1_isRisingEdge_k, SecComputer_P.ConfirmNode1_timeDelay_a,
      &SecComputer_DWork.Delay_DSTATE_c, &SecComputer_DWork.sf_MATLABFunction_j2);
    SecComputer_MATLABFunction_c(SecComputer_DWork.pRightStickDisabled &&
      (SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed || SecComputer_DWork.Delay1_DSTATE),
      SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode_isRisingEdge_j, SecComputer_P.ConfirmNode_timeDelay_a,
      &SecComputer_DWork.Delay1_DSTATE, &SecComputer_DWork.sf_MATLABFunction_g24);
    if (!SecComputer_DWork.pRightStickDisabled) {
      rtb_Switch_o = SecComputer_U.in.analog_inputs.fo_roll_stick_pos;
    } else {
      rtb_Switch_o = SecComputer_P.Constant1_Value_p;
    }

    if (SecComputer_DWork.pLeftStickDisabled) {
      rtb_Switch6 = SecComputer_P.Constant1_Value_p;
    } else {
      rtb_Switch6 = SecComputer_U.in.analog_inputs.capt_roll_stick_pos;
    }

    rtb_handleIndex = rtb_Switch_o + rtb_Switch6;
    if (rtb_handleIndex > SecComputer_P.Saturation1_UpperSat) {
      rtb_handleIndex = SecComputer_P.Saturation1_UpperSat;
    } else if (rtb_handleIndex < SecComputer_P.Saturation1_LowerSat) {
      rtb_handleIndex = SecComputer_P.Saturation1_LowerSat;
    }

    if (SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_OR1_gd = ((!SecComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_y_nd);
      rtb_OR6 = ((!SecComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_y_nd);
    } else {
      rtb_OR1_gd = ((!SecComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_y_b);
      rtb_OR6 = ((!SecComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_y_kc);
    }

    rtb_y_e = !SecComputer_U.in.discrete_inputs.ths_motor_fault;
    rtb_thsAvail = (rtb_y_e && (rtb_y_kc || rtb_y_b));
    canEngageInPitch = ((rtb_OR1_gd || rtb_OR6) && (!SecComputer_U.in.discrete_inputs.is_unit_3));
    if (SecComputer_U.in.discrete_inputs.is_unit_1) {
      hasPriorityInPitch = (SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1 &&
                            SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2 &&
                            SecComputer_U.in.discrete_inputs.left_elev_not_avail_sec_opp &&
                            SecComputer_U.in.discrete_inputs.right_elev_not_avail_sec_opp);
      spoilerPair1SupplyAvail = rtb_y_nd;
      spoilerPair2SupplyAvail = rtb_y_kc;
    } else {
      hasPriorityInPitch = (SecComputer_U.in.discrete_inputs.is_unit_2 &&
                            (SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1 &&
        SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2));
      if (SecComputer_U.in.discrete_inputs.is_unit_2) {
        spoilerPair1SupplyAvail = rtb_y_b;
        spoilerPair2SupplyAvail = false;
      } else {
        spoilerPair1SupplyAvail = rtb_y_b;
        spoilerPair2SupplyAvail = rtb_y_kc;
      }
    }

    rtb_isEngagedInPitch = (canEngageInPitch && hasPriorityInPitch);
    spoilerPair1SupplyAvail = ((!SecComputer_U.in.discrete_inputs.l_spoiler_1_servo_failed) &&
      (!SecComputer_U.in.discrete_inputs.r_spoiler_1_servo_failed) && spoilerPair1SupplyAvail);
    spoilerPair2SupplyAvail = ((!SecComputer_U.in.discrete_inputs.l_spoiler_2_servo_failed) &&
      (!SecComputer_U.in.discrete_inputs.r_spoiler_2_servo_failed) && spoilerPair2SupplyAvail);
    SecComputer_B.logic.any_landing_gear_not_uplocked = rtb_AND4_a;
    rtb_AND_hp = (rtb_AND_hp || rtb_AND13 || rtb_y_j);
    rtb_AND3_b = rtb_AND4_a;
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel_bit, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1, &rtb_AND4_a);
    rtb_y_j = ((rtb_Switch7_c != 0U) && rtb_AND4_a);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel1_bit_g, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1, &rtb_AND1_h);
    rtb_AND2_j = ((rtb_Switch7_c != 0U) && rtb_AND1_h);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      SecComputer_P.BitfromLabel2_bit_k, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_AND4_a);
    rtb_AND4_a = ((rtb_Switch7_c != 0U) && rtb_AND4_a);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      SecComputer_P.BitfromLabel3_bit_o, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_AND1_h);
    rtb_y_a = !rtb_OR16;
    rtb_AND13 = (rtb_y_a && (((!rtb_doubleAdrFault) && ((rtb_mach_or > 0.91) || (rtb_alpha < -10.0F) || (rtb_alpha >
      40.0F) || (rtb_V_ias > 440.0F) || (rtb_V_ias < 60.0F))) || ((!rtb_doubleIrFault) && ((!rtb_singleIrFault) ||
      (!SecComputer_P.Constant_Value_l)) && ((std::abs(static_cast<real_T>(rtb_phi)) > 125.0) || ((rtb_theta > 50.0F) ||
      (rtb_theta < -30.0F))))));
    SecComputer_DWork.abnormalConditionWasActive = (rtb_AND13 || (rtb_y_a &&
      SecComputer_DWork.abnormalConditionWasActive));
    if (rtb_doubleIrFault || (rtb_AND3_b && (!rtb_AND_hp)) || ((rtb_AND4_a || ((rtb_Switch7_c != 0U) && rtb_AND1_h)) &&
         rtb_AND_hp)) {
      rtb_pitchLawCapability = pitch_efcs_law::DirectLaw;
    } else if ((rtb_OR14 && rtb_logic_crg14k_cas_or_mach_disagree) || rtb_doubleAdrFault ||
               SecComputer_DWork.abnormalConditionWasActive || ((!rtb_y_j) && (!rtb_AND2_j) && ((!rtb_OR1_gd) ||
                 (!rtb_OR6)))) {
      rtb_pitchLawCapability = pitch_efcs_law::AlternateLaw2;
    } else {
      rtb_pitchLawCapability = pitch_efcs_law::AlternateLaw1;
    }

    if (rtb_isEngagedInPitch) {
      rtb_activePitchLaw = rtb_pitchLawCapability;
    } else {
      rtb_activePitchLaw = pitch_efcs_law::None;
    }

    SecComputer_MATLABFunction_e(SecComputer_B.in_flight != 0.0, SecComputer_P.PulseNode_isRisingEdge_h, &rtb_y_a,
      &SecComputer_DWork.sf_MATLABFunction_b4);
    rtb_AND2_j = (SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1 &&
                  SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2);
    rtb_AND3_b = (SecComputer_U.in.discrete_inputs.is_unit_1 && rtb_thsAvail && rtb_AND2_j);
    rtb_AND1_h = SecComputer_DWork.Memory_PreviousInput;
    SecComputer_DWork.Memory_PreviousInput = SecComputer_P.Logic_table[((((!rtb_AND3_b) || (std::abs
      (SecComputer_U.in.analog_inputs.ths_pos_deg) <= SecComputer_P.CompareToConstant_const)) + (static_cast<uint32_T>
      (rtb_y_a) << 1)) << 1) + SecComputer_DWork.Memory_PreviousInput];
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2,
      SecComputer_P.BitfromLabel7_bit_g, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2, &rtb_AND1_h);
    rtb_y_a = ((rtb_Switch7_c != 0U) && rtb_AND1_h);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2,
      SecComputer_P.BitfromLabel6_bit_f, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2, &rtb_AND4_a);
    rtb_AND2_p = ((rtb_Switch7_c != 0U) && rtb_AND4_a);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      SecComputer_P.BitfromLabel_bit_l, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_AND4_a);
    rtb_AND4_a = ((rtb_Switch7_c != 0U) && rtb_AND4_a);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      SecComputer_P.BitfromLabel1_bit_p, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_AND1_h);
    rtb_AND1_h = ((rtb_Switch7_c != 0U) && rtb_AND1_h);
    rtb_AND3_b = (rtb_AND3_b && SecComputer_DWork.Memory_PreviousInput);
    SecComputer_B.logic.ths_active_commanded = ((!SecComputer_U.in.discrete_inputs.ths_override_active) &&
      ((rtb_isEngagedInPitch && (SecComputer_B.in_flight != 0.0) && ((rtb_activePitchLaw !=
      SecComputer_P.EnumeratedConstant_Value_f) && (!rtb_AND13))) || rtb_AND3_b));
    SecComputer_B.logic.ths_ground_setting_active = rtb_AND3_b;
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel5_bit_p, &rtb_Switch7_c);
    rtb_AND3_b = (rtb_Switch7_c == 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel4_bit_e, &rtb_Switch7_c);
    rtb_AND3_b = (rtb_AND3_b || (rtb_Switch7_c == 0U));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel3_bit_oz, &rtb_Switch7_c);
    rtb_y_j = (rtb_Switch7_c == 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel2_bit_p, &rtb_Switch7_c);
    rtb_AND3_b = (rtb_y_a || rtb_AND2_p || (rtb_AND4_a || rtb_AND1_h) || (((!rtb_AND2_j) && rtb_AND3_b && (rtb_y_j ||
      (rtb_Switch7_c == 0U))) || (rtb_AND2_j && ((SecComputer_U.in.discrete_inputs.left_elev_not_avail_sec_opp &&
      (!rtb_OR1_gd)) || (SecComputer_U.in.discrete_inputs.right_elev_not_avail_sec_opp && (!rtb_OR6))))) ||
                  ((SecComputer_U.in.analog_inputs.thr_lever_1_pos >= SecComputer_P.CompareToConstant3_const) ||
                   (SecComputer_U.in.analog_inputs.thr_lever_2_pos >= SecComputer_P.CompareToConstant4_const)));
    SecComputer_MATLABFunction_c(SecComputer_U.in.analog_inputs.spd_brk_lever_pos <
      SecComputer_P.CompareToConstant_const_m, SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode_isRisingEdge_e,
      SecComputer_P.ConfirmNode_timeDelay_e, &rtb_y_j, &SecComputer_DWork.sf_MATLABFunction_fh);
    SecComputer_DWork.Memory_PreviousInput_f = SecComputer_P.Logic_table_i[(((static_cast<uint32_T>(rtb_AND3_b) << 1) +
      rtb_y_j) << 1) + SecComputer_DWork.Memory_PreviousInput_f];
    SecComputer_B.logic.speed_brake_inhibited = (rtb_AND3_b || SecComputer_DWork.Memory_PreviousInput_f);
    SecComputer_B.logic.is_blue_hydraulic_power_avail = rtb_y_nd;
    SecComputer_B.logic.is_green_hydraulic_power_avail = rtb_y_b;
    SecComputer_MATLABFunction_e(rtb_OR16, SecComputer_P.PulseNode3_isRisingEdge, &rtb_y_b,
      &SecComputer_DWork.sf_MATLABFunction_nd);
    rtb_AND3_b = (rtb_y_b || ((SecComputer_U.in.analog_inputs.wheel_speed_left < SecComputer_P.CompareToConstant11_const)
      && (SecComputer_U.in.analog_inputs.wheel_speed_right < SecComputer_P.CompareToConstant12_const)));
    SecComputer_MATLABFunction_e(rtb_OR16, SecComputer_P.PulseNode2_isRisingEdge, &rtb_y_b,
      &SecComputer_DWork.sf_MATLABFunction_n);
    SecComputer_DWork.Memory_PreviousInput_n = SecComputer_P.Logic_table_ii[(((static_cast<uint32_T>(rtb_AND3_b) << 1) +
      rtb_y_b) << 1) + SecComputer_DWork.Memory_PreviousInput_n];
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      SecComputer_P.BitfromLabel4_bit_a, &rtb_Switch7_c);
    rtb_AND1_h = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      SecComputer_P.BitfromLabel6_bit_d, &rtb_Switch7_c);
    rtb_y_b = (rtb_AND1_h && (rtb_Switch7_c != 0U));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      SecComputer_P.BitfromLabel5_bit_i, &rtb_Switch7_c);
    rtb_AND1_h = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      SecComputer_P.BitfromLabel7_bit_m, &rtb_Switch7_c);
    SecComputer_MATLABFunction_e(rtb_y_b || (rtb_AND1_h && (rtb_Switch7_c != 0U)),
      SecComputer_P.PulseNode1_isRisingEdge_k, &rtb_y_nd, &SecComputer_DWork.sf_MATLABFunction_a);
    rtb_AND3_b = (SecComputer_U.in.analog_inputs.spd_brk_lever_pos < SecComputer_P.CompareToConstant_const_m5);
    SecComputer_DWork.Delay1_DSTATE_i = (((((SecComputer_U.in.analog_inputs.spd_brk_lever_pos >
      SecComputer_P.CompareToConstant15_const) || rtb_AND3_b) && ((SecComputer_U.in.analog_inputs.thr_lever_1_pos <=
      SecComputer_P.CompareToConstant1_const) || (SecComputer_U.in.analog_inputs.thr_lever_2_pos <=
      SecComputer_P.CompareToConstant2_const))) || (((SecComputer_U.in.analog_inputs.thr_lever_1_pos <
      SecComputer_P.CompareToConstant3_const_a) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <=
      SecComputer_P.CompareToConstant4_const_j)) || ((SecComputer_U.in.analog_inputs.thr_lever_1_pos <=
      SecComputer_P.CompareToConstant13_const) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <
      SecComputer_P.CompareToConstant14_const)))) && (rtb_y_nd || ((SecComputer_U.in.analog_inputs.wheel_speed_left >=
      SecComputer_P.CompareToConstant5_const) && (SecComputer_U.in.analog_inputs.wheel_speed_right >=
      SecComputer_P.CompareToConstant6_const) && SecComputer_DWork.Memory_PreviousInput_n) ||
      SecComputer_DWork.Delay1_DSTATE_i));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      SecComputer_P.BitfromLabel_bit_g, &rtb_Switch7_c);
    rtb_AND1_h = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      SecComputer_P.BitfromLabel2_bit_l, &rtb_Switch7_c);
    rtb_y_b = (rtb_AND1_h || (rtb_Switch7_c != 0U));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      SecComputer_P.BitfromLabel1_bit_a, &rtb_Switch7_c);
    rtb_AND1_h = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      SecComputer_P.BitfromLabel3_bit_m, &rtb_Switch7_c);
    SecComputer_MATLABFunction_e(rtb_y_b || (rtb_AND1_h || (rtb_Switch7_c != 0U)),
      SecComputer_P.PulseNode_isRisingEdge_hj, &rtb_y_nd, &SecComputer_DWork.sf_MATLABFunction_e3);
    SecComputer_DWork.Delay_DSTATE_n = (((((SecComputer_U.in.analog_inputs.spd_brk_lever_pos >
      SecComputer_P.CompareToConstant10_const) || rtb_AND3_b) && ((SecComputer_U.in.analog_inputs.thr_lever_1_pos <=
      SecComputer_P.CompareToConstant7_const) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <=
      SecComputer_P.CompareToConstant16_const))) || (((SecComputer_U.in.analog_inputs.thr_lever_1_pos <
      SecComputer_P.CompareToConstant17_const) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <=
      SecComputer_P.CompareToConstant18_const)) || ((SecComputer_U.in.analog_inputs.thr_lever_1_pos <=
      SecComputer_P.CompareToConstant8_const) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <
      SecComputer_P.CompareToConstant9_const)))) && (rtb_y_nd || SecComputer_DWork.Delay_DSTATE_n));
    SecComputer_B.logic.on_ground = rtb_OR16;
    SecComputer_B.logic.pitch_law_in_flight = (SecComputer_B.in_flight != 0.0);
    SecComputer_B.logic.tracking_mode_on = (SecComputer_U.in.sim_data.slew_on || SecComputer_U.in.sim_data.pause_on ||
      SecComputer_U.in.sim_data.tracking_mode_on_override);
    SecComputer_B.logic.pitch_law_capability = rtb_pitchLawCapability;
    SecComputer_B.logic.active_pitch_law = rtb_activePitchLaw;
    SecComputer_B.logic.abnormal_condition_law_active = rtb_AND13;
    SecComputer_B.logic.is_engaged_in_pitch = rtb_isEngagedInPitch;
    SecComputer_B.logic.can_engage_in_pitch = canEngageInPitch;
    SecComputer_B.logic.has_priority_in_pitch = hasPriorityInPitch;
    SecComputer_B.logic.left_elevator_avail = rtb_OR1_gd;
    SecComputer_B.logic.right_elevator_avail = rtb_OR6;
    SecComputer_B.logic.ths_avail = rtb_thsAvail;
    SecComputer_B.logic.is_engaged_in_roll = ((spoilerPair1SupplyAvail || spoilerPair2SupplyAvail) &&
      SecComputer_U.in.discrete_inputs.digital_output_failed_elac_1 &&
      SecComputer_U.in.discrete_inputs.digital_output_failed_elac_2);
    SecComputer_B.logic.spoiler_pair_1_avail = spoilerPair1SupplyAvail;
    SecComputer_B.logic.spoiler_pair_2_avail = spoilerPair2SupplyAvail;
    SecComputer_B.logic.is_yellow_hydraulic_power_avail = rtb_y_kc;
    SecComputer_B.logic.left_sidestick_disabled = SecComputer_DWork.pLeftStickDisabled;
    SecComputer_B.logic.right_sidestick_disabled = SecComputer_DWork.pRightStickDisabled;
    SecComputer_B.logic.left_sidestick_priority_locked = SecComputer_DWork.Delay_DSTATE_c;
    SecComputer_B.logic.right_sidestick_priority_locked = SecComputer_DWork.Delay1_DSTATE;
    if (!SecComputer_DWork.pRightStickDisabled) {
      rtb_Switch_o = SecComputer_U.in.analog_inputs.fo_pitch_stick_pos;
    } else {
      rtb_Switch_o = SecComputer_P.Constant_Value_p;
    }

    if (SecComputer_DWork.pLeftStickDisabled) {
      rtb_Switch6 = SecComputer_P.Constant_Value_p;
    } else {
      rtb_Switch6 = SecComputer_U.in.analog_inputs.capt_pitch_stick_pos;
    }

    rtb_Switch_o += rtb_Switch6;
    if (rtb_Switch_o > SecComputer_P.Saturation_UpperSat_d) {
      SecComputer_B.logic.total_sidestick_pitch_command = SecComputer_P.Saturation_UpperSat_d;
    } else if (rtb_Switch_o < SecComputer_P.Saturation_LowerSat_h) {
      SecComputer_B.logic.total_sidestick_pitch_command = SecComputer_P.Saturation_LowerSat_h;
    } else {
      SecComputer_B.logic.total_sidestick_pitch_command = rtb_Switch_o;
    }

    SecComputer_B.logic.total_sidestick_roll_command = rtb_handleIndex;
    SecComputer_B.logic.ground_spoilers_armed = rtb_AND3_b;
    SecComputer_B.logic.ground_spoilers_out = SecComputer_DWork.Delay1_DSTATE_i;
    SecComputer_B.logic.partial_lift_dumping_active = ((!SecComputer_DWork.Delay1_DSTATE_i) &&
      SecComputer_DWork.Delay_DSTATE_n);
    SecComputer_B.logic.single_adr_failure = rtb_OR14;
    SecComputer_B.logic.double_adr_failure = rtb_doubleAdrFault;
    SecComputer_B.logic.cas_or_mach_disagree = rtb_logic_crg14k_cas_or_mach_disagree;
    SecComputer_B.logic.single_ir_failure = rtb_singleIrFault;
    SecComputer_B.logic.double_ir_failure = rtb_doubleIrFault;
    SecComputer_B.logic.ir_disagree = SecComputer_P.Constant_Value_l;
    SecComputer_B.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    SecComputer_B.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    SecComputer_B.logic.adr_computation_data.mach = rtb_mach_or;
    SecComputer_B.logic.adr_computation_data.alpha_deg = rtb_alpha;
    SecComputer_B.logic.ir_computation_data.theta_deg = rtb_theta;
    SecComputer_B.logic.ir_computation_data.phi_deg = rtb_phi;
    SecComputer_B.logic.ir_computation_data.q_deg_s = rtb_q;
    SecComputer_B.logic.ir_computation_data.r_deg_s = rtb_r;
    SecComputer_B.logic.ir_computation_data.n_x_g = rtb_n_x;
    SecComputer_B.logic.ir_computation_data.n_y_g = rtb_n_y;
    SecComputer_B.logic.ir_computation_data.n_z_g = rtb_n_z;
    SecComputer_B.logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    SecComputer_B.logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    SecComputer_B.logic.lgciu_uplock_disagree_or_fault = rtb_AND_hp;
    if (SecComputer_B.logic.ground_spoilers_out) {
      rtb_Switch_o = SecComputer_P.Constant_Value;
    } else if (SecComputer_B.logic.partial_lift_dumping_active) {
      rtb_Switch_o = SecComputer_P.Constant1_Value;
    } else {
      rtb_Switch_o = SecComputer_P.Constant2_Value;
    }

    SecComputer_RateLimiter(rtb_Switch_o, SecComputer_P.RateLimiterVariableTs6_up,
      SecComputer_P.RateLimiterVariableTs6_lo, SecComputer_U.in.time.dt,
      SecComputer_P.RateLimiterVariableTs6_InitialCondition, &rtb_handleIndex, &SecComputer_DWork.sf_RateLimiter_c);
    rtb_AND3_b = (SecComputer_B.logic.ground_spoilers_out || SecComputer_B.logic.partial_lift_dumping_active);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2,
      SecComputer_P.BitfromLabel4_bit_m, &rtb_Switch7_c);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2,
      SecComputer_P.BitfromLabel5_bit_h3, &rtb_y);
    if (SecComputer_B.logic.speed_brake_inhibited) {
      rtb_Switch6 = SecComputer_P.Constant3_Value;
    } else {
      if ((rtb_Switch7_c != 0U) || (rtb_y != 0U)) {
        rtb_Switch_o = SecComputer_P.Constant4_Value_k;
      } else {
        rtb_Switch_o = SecComputer_P.Constant5_Value;
      }

      if (SecComputer_U.in.analog_inputs.spd_brk_lever_pos <= rtb_Switch_o) {
        rtb_Switch_o *= SecComputer_P.Gain_Gain;
        if (SecComputer_U.in.analog_inputs.spd_brk_lever_pos >= rtb_Switch_o) {
          rtb_Switch_o = SecComputer_U.in.analog_inputs.spd_brk_lever_pos;
        }
      }

      rtb_Switch6 = look1_binlxpw(rtb_Switch_o, SecComputer_P.uDLookupTable_bp01Data,
        SecComputer_P.uDLookupTable_tableData, 4U);
    }

    SecComputer_RateLimiter(rtb_Switch6, SecComputer_P.RateLimiterVariableTs1_up,
      SecComputer_P.RateLimiterVariableTs1_lo, SecComputer_U.in.time.dt,
      SecComputer_P.RateLimiterVariableTs1_InitialCondition, &rtb_Switch_o, &SecComputer_DWork.sf_RateLimiter);
    LawMDLOBJ1.step(&SecComputer_U.in.time.dt, &SecComputer_B.logic.total_sidestick_roll_command, &rtb_xi_deg,
                    &rtb_Switch6);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel_bit_a, &rtb_Switch7_c);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel1_bit_c, &rtb_y);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel2_bit_o, &rtb_y_af);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel3_bit_j, &rtb_y_m);
    if (SecComputer_U.in.bus_inputs.elac_1_bus.roll_spoiler_command_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
         NormalOperation)) {
      rtb_xi_deg = SecComputer_U.in.bus_inputs.elac_1_bus.roll_spoiler_command_deg.Data;
      rtb_OR16 = (rtb_Switch7_c != 0U);
      rtb_OR14 = (rtb_y_af != 0U);
    } else if (SecComputer_U.in.bus_inputs.elac_2_bus.roll_spoiler_command_deg.SSM == static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) {
      rtb_xi_deg = SecComputer_U.in.bus_inputs.elac_2_bus.roll_spoiler_command_deg.Data;
      rtb_OR16 = (rtb_y != 0U);
      rtb_OR14 = (rtb_y_m != 0U);
    } else {
      rtb_OR16 = true;
      rtb_OR14 = true;
    }

    if (SecComputer_U.in.discrete_inputs.is_unit_1) {
      if (rtb_OR16) {
        pair1RollCommand = rtb_xi_deg;
      } else {
        pair1RollCommand = 0.0;
      }

      pair2RollCommand = rtb_xi_deg;
      rtb_Switch6 = rtb_Switch_o;
    } else if (SecComputer_U.in.discrete_inputs.is_unit_2) {
      pair1RollCommand = rtb_xi_deg;
      pair2RollCommand = 0.0;
      rtb_Switch6 = 0.0;
      rtb_Switch_o = 0.0;
    } else {
      pair1RollCommand = 0.0;
      if (rtb_OR14) {
        pair2RollCommand = rtb_xi_deg;
      } else {
        pair2RollCommand = 0.0;
      }

      rtb_Switch6 = 0.0;
      rtb_Switch_o /= 2.0;
    }

    if (rtb_xi_deg >= 0.0) {
      rtb_xi_deg = rtb_Switch6 - pair1RollCommand;
      pair1RollCommand = rtb_Switch_o - pair2RollCommand;
    } else {
      rtb_xi_deg = rtb_Switch6;
      rtb_Switch6 += pair1RollCommand;
      pair1RollCommand = rtb_Switch_o;
      rtb_Switch_o += pair2RollCommand;
    }

    if (rtb_AND3_b) {
      pair2RollCommand = rtb_handleIndex;
    } else {
      pair2RollCommand = std::fmax(rtb_xi_deg - (rtb_Switch6 - std::fmax(rtb_Switch6, -50.0)), -50.0);
    }

    if (pair2RollCommand > SecComputer_P.Saturation_UpperSat_n) {
      pair2RollCommand = SecComputer_P.Saturation_UpperSat_n;
    } else if (pair2RollCommand < SecComputer_P.Saturation_LowerSat_n) {
      pair2RollCommand = SecComputer_P.Saturation_LowerSat_n;
    }

    SecComputer_RateLimiter(pair2RollCommand, SecComputer_P.RateLimiterVariableTs2_up,
      SecComputer_P.RateLimiterVariableTs2_lo, SecComputer_U.in.time.dt,
      SecComputer_P.RateLimiterVariableTs2_InitialCondition,
      &SecComputer_B.laws.lateral_law_outputs.left_spoiler_1_command_deg, &SecComputer_DWork.sf_RateLimiter_b);
    if (rtb_AND3_b) {
      pair2RollCommand = rtb_handleIndex;
    } else {
      pair2RollCommand = std::fmax(rtb_Switch6 - (rtb_xi_deg - std::fmax(rtb_xi_deg, -50.0)), -50.0);
    }

    if (pair2RollCommand > SecComputer_P.Saturation1_UpperSat_e) {
      pair2RollCommand = SecComputer_P.Saturation1_UpperSat_e;
    } else if (pair2RollCommand < SecComputer_P.Saturation1_LowerSat_f) {
      pair2RollCommand = SecComputer_P.Saturation1_LowerSat_f;
    }

    SecComputer_RateLimiter(pair2RollCommand, SecComputer_P.RateLimiterVariableTs3_up,
      SecComputer_P.RateLimiterVariableTs3_lo, SecComputer_U.in.time.dt,
      SecComputer_P.RateLimiterVariableTs3_InitialCondition,
      &SecComputer_B.laws.lateral_law_outputs.right_spoiler_1_command_deg, &SecComputer_DWork.sf_RateLimiter_f);
    if (rtb_AND3_b) {
      pair2RollCommand = rtb_handleIndex;
    } else {
      pair2RollCommand = std::fmax(pair1RollCommand - (rtb_Switch_o - std::fmax(rtb_Switch_o, -50.0)), -50.0);
    }

    if (pair2RollCommand > SecComputer_P.Saturation2_UpperSat) {
      pair2RollCommand = SecComputer_P.Saturation2_UpperSat;
    } else if (pair2RollCommand < SecComputer_P.Saturation2_LowerSat) {
      pair2RollCommand = SecComputer_P.Saturation2_LowerSat;
    }

    SecComputer_RateLimiter(pair2RollCommand, SecComputer_P.RateLimiterVariableTs4_up,
      SecComputer_P.RateLimiterVariableTs4_lo, SecComputer_U.in.time.dt,
      SecComputer_P.RateLimiterVariableTs4_InitialCondition,
      &SecComputer_B.laws.lateral_law_outputs.left_spoiler_2_command_deg, &SecComputer_DWork.sf_RateLimiter_j);
    if (!rtb_AND3_b) {
      rtb_handleIndex = std::fmax(rtb_Switch_o - (pair1RollCommand - std::fmax(pair1RollCommand, -50.0)), -50.0);
    }

    if (rtb_handleIndex > SecComputer_P.Saturation3_UpperSat) {
      rtb_handleIndex = SecComputer_P.Saturation3_UpperSat;
    } else if (rtb_handleIndex < SecComputer_P.Saturation3_LowerSat) {
      rtb_handleIndex = SecComputer_P.Saturation3_LowerSat;
    }

    SecComputer_RateLimiter(rtb_handleIndex, SecComputer_P.RateLimiterVariableTs5_up,
      SecComputer_P.RateLimiterVariableTs5_lo, SecComputer_U.in.time.dt,
      SecComputer_P.RateLimiterVariableTs5_InitialCondition,
      &SecComputer_B.laws.lateral_law_outputs.right_spoiler_2_command_deg, &SecComputer_DWork.sf_RateLimiter_d);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel_bit_a1, &rtb_y_m);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel1_bit_gf, &rtb_y_af);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel2_bit_n, &rtb_y);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel3_bit_l, &rtb_Switch9);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel4_bit_n, &rtb_DataTypeConversion1);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel5_bit_m, &rtb_Switch7_c);
    if (rtb_y_m != 0U) {
      rtb_handleIndex = 0.0;
    } else if ((rtb_y_af != 0U) && (rtb_Switch7_c != 0U)) {
      rtb_handleIndex = 1.0;
    } else if ((rtb_y_af != 0U) && (rtb_Switch7_c == 0U)) {
      rtb_handleIndex = 2.0;
    } else if (rtb_y != 0U) {
      rtb_handleIndex = 3.0;
    } else if (rtb_Switch9 != 0U) {
      rtb_handleIndex = 4.0;
    } else if (rtb_DataTypeConversion1 != 0U) {
      rtb_handleIndex = 5.0;
    } else {
      rtb_handleIndex = 0.0;
    }

    rtb_OR16 = (SecComputer_B.logic.tracking_mode_on || ((static_cast<real_T>(SecComputer_B.logic.active_pitch_law) !=
      SecComputer_P.CompareToConstant2_const_f) && (static_cast<real_T>(SecComputer_B.logic.active_pitch_law) !=
      SecComputer_P.CompareToConstant3_const_o)));
    rtb_OR14 = (SecComputer_B.logic.active_pitch_law != SecComputer_P.EnumeratedConstant_Value_i);
    LawMDLOBJ2.step(&SecComputer_U.in.time.dt, &SecComputer_B.logic.ir_computation_data.n_z_g,
                    &SecComputer_B.logic.ir_computation_data.theta_deg, &SecComputer_B.logic.ir_computation_data.phi_deg,
                    &SecComputer_B.logic.ir_computation_data.theta_dot_deg_s, (const_cast<real_T*>(&SecComputer_RGND)),
                    &SecComputer_U.in.analog_inputs.ths_pos_deg, &SecComputer_B.logic.adr_computation_data.V_ias_kn,
                    &SecComputer_B.logic.adr_computation_data.mach, &SecComputer_B.logic.adr_computation_data.V_tas_kn,
                    &rtb_handleIndex, (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)),
                    &SecComputer_B.logic.total_sidestick_pitch_command, (const_cast<real_T*>(&SecComputer_RGND)),
                    &rtb_OR16, &rtb_OR14, &rtb_eta_deg, &rtb_eta_trim_dot_deg_s, &rtb_eta_trim_limit_lo,
                    &rtb_eta_trim_limit_up);
    LawMDLOBJ3.step(&SecComputer_U.in.time.dt, &SecComputer_B.logic.total_sidestick_pitch_command, &rtb_Switch_o,
                    &rtb_Switch6, &pair2RollCommand, &rtb_handleIndex);
    switch (static_cast<int32_T>(SecComputer_B.logic.active_pitch_law)) {
     case 1:
     case 2:
      SecComputer_B.laws.pitch_law_outputs.elevator_command_deg = rtb_eta_deg;
      break;

     case 3:
      SecComputer_B.laws.pitch_law_outputs.elevator_command_deg = rtb_Switch_o;
      break;

     default:
      SecComputer_B.laws.pitch_law_outputs.elevator_command_deg = SecComputer_P.Constant1_Value_px;
      break;
    }

    switch (static_cast<int32_T>(SecComputer_B.logic.active_pitch_law)) {
     case 1:
     case 2:
      rtb_handleIndex = rtb_eta_trim_limit_up;
      break;

     case 3:
      break;

     default:
      rtb_handleIndex = SecComputer_P.Constant2_Value_g;
      break;
    }

    if (SecComputer_B.logic.ths_ground_setting_active) {
      rtb_Switch6 = SecComputer_P.Gain_Gain_m * SecComputer_DWork.Delay_DSTATE;
      if (rtb_Switch6 > SecComputer_P.Saturation_UpperSat) {
        rtb_Switch6 = SecComputer_P.Saturation_UpperSat;
      } else if (rtb_Switch6 < SecComputer_P.Saturation_LowerSat) {
        rtb_Switch6 = SecComputer_P.Saturation_LowerSat;
      }
    } else {
      switch (static_cast<int32_T>(SecComputer_B.logic.active_pitch_law)) {
       case 1:
       case 2:
        rtb_Switch6 = rtb_eta_trim_dot_deg_s;
        break;

       case 3:
        break;

       default:
        rtb_Switch6 = SecComputer_P.Constant1_Value_px;
        break;
      }
    }

    rtb_Switch6 = SecComputer_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_Switch6 * SecComputer_U.in.time.dt;
    SecComputer_DWork.icLoad = ((!SecComputer_B.logic.ths_active_commanded) || SecComputer_DWork.icLoad);
    if (SecComputer_DWork.icLoad) {
      SecComputer_DWork.Delay_DSTATE_l = SecComputer_U.in.analog_inputs.ths_pos_deg - rtb_Switch6;
    }

    SecComputer_DWork.Delay_DSTATE = rtb_Switch6 + SecComputer_DWork.Delay_DSTATE_l;
    if (SecComputer_DWork.Delay_DSTATE > rtb_handleIndex) {
      SecComputer_DWork.Delay_DSTATE = rtb_handleIndex;
    } else {
      switch (static_cast<int32_T>(SecComputer_B.logic.active_pitch_law)) {
       case 1:
       case 2:
        pair2RollCommand = rtb_eta_trim_limit_lo;
        break;

       case 3:
        break;

       default:
        pair2RollCommand = SecComputer_P.Constant3_Value_i;
        break;
      }

      if (SecComputer_DWork.Delay_DSTATE < pair2RollCommand) {
        SecComputer_DWork.Delay_DSTATE = pair2RollCommand;
      }
    }

    SecComputer_B.laws.pitch_law_outputs.ths_command_deg = SecComputer_DWork.Delay_DSTATE;
    if (SecComputer_B.logic.is_engaged_in_pitch && SecComputer_B.logic.left_elevator_avail) {
      SecComputer_Y.out.analog_outputs.left_elev_pos_order_deg =
        SecComputer_B.laws.pitch_law_outputs.elevator_command_deg;
    } else {
      SecComputer_Y.out.analog_outputs.left_elev_pos_order_deg = SecComputer_P.Constant_Value_h;
    }

    if (SecComputer_B.logic.is_engaged_in_pitch && SecComputer_B.logic.right_elevator_avail) {
      SecComputer_Y.out.analog_outputs.right_elev_pos_order_deg =
        SecComputer_B.laws.pitch_law_outputs.elevator_command_deg;
    } else {
      SecComputer_Y.out.analog_outputs.right_elev_pos_order_deg = SecComputer_P.Constant_Value_h;
    }

    if (SecComputer_B.logic.is_engaged_in_pitch && rtb_y_e) {
      SecComputer_Y.out.analog_outputs.ths_pos_order_deg = SecComputer_B.laws.pitch_law_outputs.ths_command_deg;
    } else {
      SecComputer_Y.out.analog_outputs.ths_pos_order_deg = SecComputer_P.Constant_Value_h;
    }

    if (SecComputer_B.logic.spoiler_pair_1_avail) {
      SecComputer_Y.out.analog_outputs.left_spoiler_1_pos_order_deg =
        SecComputer_B.laws.lateral_law_outputs.left_spoiler_1_command_deg;
      SecComputer_Y.out.analog_outputs.right_spoiler_1_pos_order_deg =
        SecComputer_B.laws.lateral_law_outputs.right_spoiler_1_command_deg;
    } else {
      SecComputer_Y.out.analog_outputs.left_spoiler_1_pos_order_deg = SecComputer_P.Constant2_Value_f;
      SecComputer_Y.out.analog_outputs.right_spoiler_1_pos_order_deg = SecComputer_P.Constant2_Value_f;
    }

    if (SecComputer_B.logic.spoiler_pair_2_avail) {
      SecComputer_Y.out.analog_outputs.left_spoiler_2_pos_order_deg =
        SecComputer_B.laws.lateral_law_outputs.left_spoiler_2_command_deg;
      SecComputer_Y.out.analog_outputs.right_spoiler_2_pos_order_deg =
        SecComputer_B.laws.lateral_law_outputs.right_spoiler_2_command_deg;
    } else {
      SecComputer_Y.out.analog_outputs.left_spoiler_2_pos_order_deg = SecComputer_P.Constant2_Value_f;
      SecComputer_Y.out.analog_outputs.right_spoiler_2_pos_order_deg = SecComputer_P.Constant2_Value_f;
    }

    rtb_VectorConcatenate[11] = SecComputer_B.logic.is_engaged_in_roll;
    rtb_VectorConcatenate[12] = SecComputer_B.logic.is_engaged_in_pitch;
    rtb_VectorConcatenate[14] = SecComputer_B.logic.ground_spoilers_out;
    rtb_VectorConcatenate[15] = SecComputer_B.logic.ground_spoilers_armed;
    rtb_VectorConcatenate[4] = SecComputer_B.logic.spoiler_pair_1_avail;
    rtb_VectorConcatenate[5] = SecComputer_B.logic.spoiler_pair_2_avail;
    rtb_VectorConcatenate[6] = SecComputer_B.logic.left_elevator_avail;
    rtb_VectorConcatenate[7] = SecComputer_B.logic.right_elevator_avail;
    rtb_VectorConcatenate[8] = (SecComputer_B.logic.active_pitch_law == pitch_efcs_law::AlternateLaw2);
    rtb_VectorConcatenate[9] = ((SecComputer_B.logic.active_pitch_law == pitch_efcs_law::AlternateLaw1) ||
      (SecComputer_B.logic.active_pitch_law == pitch_efcs_law::AlternateLaw2));
    rtb_VectorConcatenate[10] = (SecComputer_B.logic.active_pitch_law == pitch_efcs_law::DirectLaw);
    rtb_VectorConcatenate_a[2] = SecComputer_B.logic.left_sidestick_disabled;
    rtb_VectorConcatenate_a[3] = SecComputer_B.logic.right_sidestick_disabled;
    rtb_VectorConcatenate_a[4] = SecComputer_B.logic.left_sidestick_priority_locked;
    rtb_VectorConcatenate_a[5] = SecComputer_B.logic.right_sidestick_priority_locked;
    rtb_VectorConcatenate_a[6] = SecComputer_B.logic.lgciu_uplock_disagree_or_fault;
    rtb_VectorConcatenate_a[7] = SecComputer_B.logic.any_landing_gear_not_uplocked;
    SecComputer_Y.out.discrete_outputs.thr_reverse_selected = SecComputer_P.Constant1_Value_g;
    SecComputer_Y.out.discrete_outputs.left_elevator_ok = SecComputer_B.logic.left_elevator_avail;
    SecComputer_Y.out.discrete_outputs.right_elevator_ok = SecComputer_B.logic.right_elevator_avail;
    SecComputer_Y.out.discrete_outputs.ground_spoiler_out = SecComputer_B.logic.ground_spoilers_out;
    SecComputer_Y.out.discrete_outputs.sec_failed = SecComputer_P.Constant2_Value_n;
    rtb_logic_crg14k_cas_or_mach_disagree = (SecComputer_B.logic.is_engaged_in_pitch &&
      SecComputer_B.logic.left_elevator_avail);
    SecComputer_Y.out.discrete_outputs.left_elevator_damping_mode = rtb_logic_crg14k_cas_or_mach_disagree;
    SecComputer_Y.out.discrete_outputs.right_elevator_damping_mode = rtb_logic_crg14k_cas_or_mach_disagree;
    SecComputer_Y.out.discrete_outputs.ths_active = (SecComputer_B.logic.is_engaged_in_pitch && rtb_y_e);
    rtb_VectorConcatenate[13] = SecComputer_P.Constant8_Value;
    rtb_VectorConcatenate[16] = SecComputer_P.Constant8_Value;
    rtb_VectorConcatenate[17] = SecComputer_P.Constant8_Value;
    rtb_VectorConcatenate[18] = SecComputer_P.Constant8_Value;
    rtb_VectorConcatenate_a[0] = SecComputer_P.Constant7_Value;
    rtb_VectorConcatenate_a[1] = SecComputer_P.Constant7_Value;
    rtb_VectorConcatenate_a[9] = SecComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[10] = SecComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[11] = SecComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[12] = SecComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[13] = SecComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[14] = SecComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[15] = SecComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[16] = SecComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[17] = SecComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[18] = SecComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[8] = SecComputer_P.Constant10_Value;
    SecComputer_Y.out.bus_outputs.discrete_status_word_2.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.thr_lever_2_pos);
    rtb_VectorConcatenate[2] = SecComputer_U.in.discrete_inputs.l_elev_servo_failed;
    rtb_VectorConcatenate[3] = SecComputer_U.in.discrete_inputs.r_elev_servo_failed;
    rtb_VectorConcatenate[0] = (SecComputer_U.in.discrete_inputs.l_spoiler_1_servo_failed ||
      SecComputer_U.in.discrete_inputs.r_spoiler_1_servo_failed);
    rtb_VectorConcatenate[1] = (SecComputer_U.in.discrete_inputs.l_spoiler_2_servo_failed ||
      SecComputer_U.in.discrete_inputs.r_spoiler_2_servo_failed);
    SecComputer_MATLABFunction_cw(rtb_VectorConcatenate, &SecComputer_Y.out.bus_outputs.discrete_status_word_1.Data);
    SecComputer_MATLABFunction_cw(rtb_VectorConcatenate_a, &SecComputer_Y.out.bus_outputs.discrete_status_word_2.Data);
    if (SecComputer_U.in.discrete_inputs.l_spoiler_1_servo_failed) {
      SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant_Value);
      SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.Data = static_cast<real32_T>
        (SecComputer_P.Constant_Value_j);
    } else {
      SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant1_Value);
      SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.Data = static_cast<real32_T>
        (SecComputer_U.in.analog_inputs.left_spoiler_1_pos_deg);
    }

    if (SecComputer_U.in.discrete_inputs.r_spoiler_1_servo_failed) {
      SecComputer_Y.out.bus_outputs.right_spoiler_1_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant_Value);
      SecComputer_Y.out.bus_outputs.right_spoiler_1_position_deg.Data = static_cast<real32_T>
        (SecComputer_P.Constant1_Value_d);
    } else {
      SecComputer_Y.out.bus_outputs.right_spoiler_1_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant1_Value);
      SecComputer_Y.out.bus_outputs.right_spoiler_1_position_deg.Data = static_cast<real32_T>
        (SecComputer_U.in.analog_inputs.right_spoiler_1_pos_deg);
    }

    if (SecComputer_U.in.discrete_inputs.l_spoiler_2_servo_failed) {
      SecComputer_Y.out.bus_outputs.left_spoiler_2_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant_Value);
      SecComputer_Y.out.bus_outputs.left_spoiler_2_position_deg.Data = static_cast<real32_T>
        (SecComputer_P.Constant5_Value_m);
    } else {
      SecComputer_Y.out.bus_outputs.left_spoiler_2_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant1_Value);
      SecComputer_Y.out.bus_outputs.left_spoiler_2_position_deg.Data = static_cast<real32_T>
        (SecComputer_U.in.analog_inputs.left_spoiler_2_pos_deg);
    }

    if (SecComputer_U.in.discrete_inputs.r_spoiler_2_servo_failed) {
      SecComputer_Y.out.bus_outputs.right_spoiler_2_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant_Value);
      SecComputer_Y.out.bus_outputs.right_spoiler_2_position_deg.Data = static_cast<real32_T>
        (SecComputer_P.Constant6_Value);
    } else {
      SecComputer_Y.out.bus_outputs.right_spoiler_2_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant1_Value);
      SecComputer_Y.out.bus_outputs.right_spoiler_2_position_deg.Data = static_cast<real32_T>
        (SecComputer_U.in.analog_inputs.right_spoiler_2_pos_deg);
    }

    if (SecComputer_U.in.discrete_inputs.l_elev_servo_failed) {
      SecComputer_Y.out.bus_outputs.left_elevator_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant_Value);
      SecComputer_Y.out.bus_outputs.left_elevator_position_deg.Data = static_cast<real32_T>
        (SecComputer_P.Constant2_Value_b);
    } else {
      SecComputer_Y.out.bus_outputs.left_elevator_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant1_Value);
      SecComputer_Y.out.bus_outputs.left_elevator_position_deg.Data = static_cast<real32_T>
        (SecComputer_U.in.analog_inputs.left_elevator_pos_deg);
    }

    if (SecComputer_U.in.discrete_inputs.r_elev_servo_failed) {
      SecComputer_Y.out.bus_outputs.right_elevator_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant_Value);
      SecComputer_Y.out.bus_outputs.right_elevator_position_deg.Data = static_cast<real32_T>
        (SecComputer_P.Constant3_Value_f);
    } else {
      SecComputer_Y.out.bus_outputs.right_elevator_position_deg.SSM = static_cast<uint32_T>
        (SecComputer_P.EnumeratedConstant1_Value);
      SecComputer_Y.out.bus_outputs.right_elevator_position_deg.Data = static_cast<real32_T>
        (SecComputer_U.in.analog_inputs.right_elevator_pos_deg);
    }

    if (SecComputer_U.in.discrete_inputs.ths_motor_fault) {
      SecComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>(SecComputer_P.EnumeratedConstant_Value);
      SecComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>(SecComputer_P.Constant4_Value_i);
    } else {
      SecComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>(SecComputer_P.EnumeratedConstant1_Value);
      SecComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>
        (SecComputer_U.in.analog_inputs.ths_pos_deg);
    }

    SecComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = SecComputer_P.Gain_Gain_b *
      static_cast<real32_T>(SecComputer_U.in.analog_inputs.capt_pitch_stick_pos);
    SecComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.Data = SecComputer_P.Gain1_Gain *
      static_cast<real32_T>(SecComputer_U.in.analog_inputs.fo_pitch_stick_pos);
    SecComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = SecComputer_P.Gain2_Gain * static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.capt_roll_stick_pos);
    SecComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = SecComputer_P.Gain3_Gain *
      static_cast<real32_T>(SecComputer_U.in.analog_inputs.fo_roll_stick_pos);
    SecComputer_Y.out.bus_outputs.speed_brake_lever_command_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.speed_brake_lever_command_deg.Data = SecComputer_P.Gain4_Gain * static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.spd_brk_lever_pos);
    SecComputer_Y.out.bus_outputs.thrust_lever_angle_1_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.thrust_lever_angle_1_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.thr_lever_1_pos);
    SecComputer_Y.out.bus_outputs.thrust_lever_angle_2_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.thrust_lever_angle_2_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.thr_lever_2_pos);
    SecComputer_Y.out.bus_outputs.discrete_status_word_1.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.discrete_status_word_2.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_B.dt = SecComputer_U.in.time.dt;
    SecComputer_B.sec_in_emergency_powersupply = SecComputer_U.in.discrete_inputs.sec_in_emergency_powersupply;
    SecComputer_B.Data = SecComputer_U.in.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
    SecComputer_B.SSM = SecComputer_U.in.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
    SecComputer_B.Data_f = SecComputer_U.in.bus_inputs.ir_1_bus.drift_angle_deg.Data;
    SecComputer_B.SSM_k = SecComputer_U.in.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
    SecComputer_B.Data_fw = SecComputer_U.in.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
    SecComputer_B.SSM_kx = SecComputer_U.in.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
    SecComputer_B.Data_fwx = SecComputer_U.in.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
    SecComputer_B.SSM_kxx = SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
    SecComputer_B.Data_fwxk = SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
    SecComputer_B.SSM_kxxt = SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
    SecComputer_B.is_unit_1 = SecComputer_U.in.discrete_inputs.is_unit_1;
    SecComputer_B.Data_fwxkf = SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
    SecComputer_B.SSM_kxxta = SecComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
    SecComputer_B.Data_fwxkft = SecComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
    SecComputer_B.SSM_kxxtac = SecComputer_U.in.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
    SecComputer_B.Data_fwxkftc = SecComputer_U.in.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
    SecComputer_B.SSM_kxxtac0 = SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
    SecComputer_B.Data_fwxkftc3 = SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
    SecComputer_B.SSM_kxxtac0z = SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
    SecComputer_B.Data_fwxkftc3e = SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
    SecComputer_B.SSM_kxxtac0zt = SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
    SecComputer_B.is_unit_2 = SecComputer_U.in.discrete_inputs.is_unit_2;
    SecComputer_B.Data_fwxkftc3ep = SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
    SecComputer_B.SSM_kxxtac0ztg = SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
    SecComputer_B.Data_fwxkftc3epg = SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
    SecComputer_B.SSM_kxxtac0ztgf = SecComputer_U.in.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
    SecComputer_B.Data_fwxkftc3epgt = SecComputer_U.in.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
    SecComputer_B.SSM_kxxtac0ztgf2 = SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
    SecComputer_B.Data_fwxkftc3epgtd = SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
    SecComputer_B.SSM_kxxtac0ztgf2u = SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
    SecComputer_B.Data_fwxkftc3epgtdx = SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    SecComputer_B.SSM_kxxtac0ztgf2ux = SecComputer_U.in.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
    SecComputer_B.is_unit_3 = SecComputer_U.in.discrete_inputs.is_unit_3;
    SecComputer_B.Data_fwxkftc3epgtdxc = SecComputer_U.in.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
    SecComputer_B.SSM_kxxtac0ztgf2uxn = SecComputer_U.in.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
    SecComputer_B.Data_h = SecComputer_U.in.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
    SecComputer_B.SSM_ky = SecComputer_U.in.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
    SecComputer_B.Data_e = SecComputer_U.in.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
    SecComputer_B.SSM_d = SecComputer_U.in.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
    SecComputer_B.Data_j = SecComputer_U.in.bus_inputs.ir_1_bus.vertical_accel_g.Data;
    SecComputer_B.SSM_h = SecComputer_U.in.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
    SecComputer_B.Data_d = SecComputer_U.in.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
    SecComputer_B.SSM_kb = SecComputer_U.in.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
    SecComputer_B.pitch_not_avail_elac_1 = SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1;
    SecComputer_B.Data_p = SecComputer_U.in.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
    SecComputer_B.SSM_p = SecComputer_U.in.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
    SecComputer_B.Data_i = SecComputer_U.in.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
    SecComputer_B.SSM_di = SecComputer_U.in.bus_inputs.ir_2_bus.discrete_word_1.SSM;
    SecComputer_B.Data_g = SecComputer_U.in.bus_inputs.ir_2_bus.discrete_word_1.Data;
    SecComputer_B.SSM_j = SecComputer_U.in.bus_inputs.ir_2_bus.latitude_deg.SSM;
    SecComputer_B.Data_a = SecComputer_U.in.bus_inputs.ir_2_bus.latitude_deg.Data;
    SecComputer_B.SSM_i = SecComputer_U.in.bus_inputs.ir_2_bus.longitude_deg.SSM;
    SecComputer_B.Data_eb = SecComputer_U.in.bus_inputs.ir_2_bus.longitude_deg.Data;
    SecComputer_B.SSM_g = SecComputer_U.in.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
    SecComputer_B.pitch_not_avail_elac_2 = SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2;
    SecComputer_B.Data_jo = SecComputer_U.in.bus_inputs.ir_2_bus.ground_speed_kn.Data;
    SecComputer_B.SSM_db = SecComputer_U.in.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
    SecComputer_B.Data_ex = SecComputer_U.in.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
    SecComputer_B.SSM_n = SecComputer_U.in.bus_inputs.ir_2_bus.heading_true_deg.SSM;
    SecComputer_B.Data_fd = SecComputer_U.in.bus_inputs.ir_2_bus.heading_true_deg.Data;
    SecComputer_B.SSM_a = SecComputer_U.in.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
    SecComputer_B.Data_ja = SecComputer_U.in.bus_inputs.ir_2_bus.wind_speed_kn.Data;
    SecComputer_B.SSM_ir = SecComputer_U.in.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
    SecComputer_B.Data_k = SecComputer_U.in.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
    SecComputer_B.SSM_hu = SecComputer_U.in.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
    SecComputer_B.left_elev_not_avail_sec_opp = SecComputer_U.in.discrete_inputs.left_elev_not_avail_sec_opp;
    SecComputer_B.Data_joy = SecComputer_U.in.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
    SecComputer_B.SSM_e = SecComputer_U.in.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
    SecComputer_B.Data_h3 = SecComputer_U.in.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
    SecComputer_B.SSM_gr = SecComputer_U.in.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
    SecComputer_B.Data_a0 = SecComputer_U.in.bus_inputs.ir_2_bus.drift_angle_deg.Data;
    SecComputer_B.SSM_ev = SecComputer_U.in.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
    SecComputer_B.Data_b = SecComputer_U.in.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
    SecComputer_B.SSM_l = SecComputer_U.in.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
    SecComputer_B.Data_eq = SecComputer_U.in.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
    SecComputer_B.SSM_ei = SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
    SecComputer_B.digital_output_failed_elac_1 = SecComputer_U.in.discrete_inputs.digital_output_failed_elac_1;
    SecComputer_B.Data_iz = SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
    SecComputer_B.SSM_an = SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
    SecComputer_B.Data_j2 = SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data;
    SecComputer_B.SSM_c = SecComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
    SecComputer_B.Data_o = SecComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
    SecComputer_B.SSM_cb = SecComputer_U.in.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
    SecComputer_B.Data_m = SecComputer_U.in.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
    SecComputer_B.SSM_lb = SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
    SecComputer_B.Data_oq = SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
    SecComputer_B.SSM_ia = SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
    SecComputer_B.right_elev_not_avail_sec_opp = SecComputer_U.in.discrete_inputs.right_elev_not_avail_sec_opp;
    SecComputer_B.Data_fo = SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data;
    SecComputer_B.SSM_kyz = SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
    SecComputer_B.Data_p1 = SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
    SecComputer_B.SSM_as = SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
    SecComputer_B.Data_p1y = SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
    SecComputer_B.SSM_is = SecComputer_U.in.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
    SecComputer_B.Data_l = SecComputer_U.in.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
    SecComputer_B.SSM_ca = SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
    SecComputer_B.Data_kp = SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
    SecComputer_B.SSM_o = SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
    SecComputer_B.green_low_pressure = SecComputer_U.in.discrete_inputs.green_low_pressure;
    SecComputer_B.Data_k0 = SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
    SecComputer_B.SSM_ak = SecComputer_U.in.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
    SecComputer_B.Data_pi = SecComputer_U.in.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
    SecComputer_B.SSM_cbj = SecComputer_U.in.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
    SecComputer_B.Data_dm = SecComputer_U.in.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
    SecComputer_B.SSM_cu = SecComputer_U.in.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
    SecComputer_B.Data_f5 = SecComputer_U.in.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
    SecComputer_B.SSM_nn = SecComputer_U.in.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
    SecComputer_B.Data_js = SecComputer_U.in.bus_inputs.ir_2_bus.vertical_accel_g.Data;
    SecComputer_B.SSM_b = SecComputer_U.in.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
    SecComputer_B.simulation_time = SecComputer_U.in.time.simulation_time;
    SecComputer_B.blue_low_pressure = SecComputer_U.in.discrete_inputs.blue_low_pressure;
    SecComputer_B.Data_ee = SecComputer_U.in.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
    SecComputer_B.SSM_m = SecComputer_U.in.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
    SecComputer_B.Data_ig = SecComputer_U.in.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
    SecComputer_B.SSM_f = SecComputer_U.in.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
    SecComputer_B.Data_mk = SecComputer_U.in.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
    SecComputer_B.SSM_bp = SecComputer_U.in.bus_inputs.elac_1_bus.left_aileron_position_deg.SSM;
    SecComputer_B.Data_pu = SecComputer_U.in.bus_inputs.elac_1_bus.left_aileron_position_deg.Data;
    SecComputer_B.SSM_hb = SecComputer_U.in.bus_inputs.elac_1_bus.right_aileron_position_deg.SSM;
    SecComputer_B.Data_ly = SecComputer_U.in.bus_inputs.elac_1_bus.right_aileron_position_deg.Data;
    SecComputer_B.SSM_gz = SecComputer_U.in.bus_inputs.elac_1_bus.left_elevator_position_deg.SSM;
    SecComputer_B.yellow_low_pressure = SecComputer_U.in.discrete_inputs.yellow_low_pressure;
    SecComputer_B.Data_jq = SecComputer_U.in.bus_inputs.elac_1_bus.left_elevator_position_deg.Data;
    SecComputer_B.SSM_pv = SecComputer_U.in.bus_inputs.elac_1_bus.right_elevator_position_deg.SSM;
    SecComputer_B.Data_o5 = SecComputer_U.in.bus_inputs.elac_1_bus.right_elevator_position_deg.Data;
    SecComputer_B.SSM_mf = SecComputer_U.in.bus_inputs.elac_1_bus.ths_position_deg.SSM;
    SecComputer_B.Data_lyw = SecComputer_U.in.bus_inputs.elac_1_bus.ths_position_deg.Data;
    SecComputer_B.SSM_m0 = SecComputer_U.in.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.SSM;
    SecComputer_B.Data_gq = SecComputer_U.in.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.Data;
    SecComputer_B.SSM_kd = SecComputer_U.in.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.SSM;
    SecComputer_B.Data_n = SecComputer_U.in.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.Data;
    SecComputer_B.SSM_pu = SecComputer_U.in.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.SSM;
    SecComputer_B.sfcc_1_slats_out = SecComputer_U.in.discrete_inputs.sfcc_1_slats_out;
    SecComputer_B.Data_bq = SecComputer_U.in.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.Data;
    SecComputer_B.SSM_nv = SecComputer_U.in.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.SSM;
    SecComputer_B.Data_dmn = SecComputer_U.in.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.Data;
    SecComputer_B.SSM_d5 = SecComputer_U.in.bus_inputs.elac_1_bus.rudder_pedal_position_deg.SSM;
    SecComputer_B.Data_jn = SecComputer_U.in.bus_inputs.elac_1_bus.rudder_pedal_position_deg.Data;
    SecComputer_B.SSM_eo = SecComputer_U.in.bus_inputs.elac_1_bus.aileron_command_deg.SSM;
    SecComputer_B.Data_c = SecComputer_U.in.bus_inputs.elac_1_bus.aileron_command_deg.Data;
    SecComputer_B.SSM_nd = SecComputer_U.in.bus_inputs.elac_1_bus.roll_spoiler_command_deg.SSM;
    SecComputer_B.Data_lx = SecComputer_U.in.bus_inputs.elac_1_bus.roll_spoiler_command_deg.Data;
    SecComputer_B.SSM_bq = SecComputer_U.in.bus_inputs.elac_1_bus.yaw_damper_command_deg.SSM;
    SecComputer_B.sfcc_2_slats_out = SecComputer_U.in.discrete_inputs.sfcc_2_slats_out;
    SecComputer_B.Data_jb = SecComputer_U.in.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data;
    SecComputer_B.SSM_hi = SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1.SSM;
    SecComputer_B.Data_fn = SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1.Data;
    SecComputer_B.SSM_mm = SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2.SSM;
    SecComputer_B.Data_od = SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2.Data;
    SecComputer_B.SSM_kz = SecComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_1.SSM;
    SecComputer_B.Data_ez = SecComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_1.Data;
    SecComputer_B.SSM_il = SecComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_2.SSM;
    SecComputer_B.Data_pw = SecComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_2.Data;
    SecComputer_B.SSM_i2 = SecComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_3.SSM;
    SecComputer_B.digital_output_failed_elac_2 = SecComputer_U.in.discrete_inputs.digital_output_failed_elac_2;
    SecComputer_B.Data_m2 = SecComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_3.Data;
    SecComputer_B.SSM_ah = SecComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_4.SSM;
    SecComputer_B.Data_ek = SecComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_4.Data;
    SecComputer_B.SSM_en = SecComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_5.SSM;
    SecComputer_B.Data_iy = SecComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_5.Data;
    SecComputer_B.SSM_dq = SecComputer_U.in.bus_inputs.fcdc_1_bus.capt_roll_command_deg.SSM;
    SecComputer_B.Data_lk = SecComputer_U.in.bus_inputs.fcdc_1_bus.capt_roll_command_deg.Data;
    SecComputer_B.SSM_px = SecComputer_U.in.bus_inputs.fcdc_1_bus.fo_roll_command_deg.SSM;
    SecComputer_B.Data_ca = SecComputer_U.in.bus_inputs.fcdc_1_bus.fo_roll_command_deg.Data;
    SecComputer_B.SSM_lbo = SecComputer_U.in.bus_inputs.fcdc_1_bus.rudder_pedal_position_deg.SSM;
    SecComputer_B.ths_motor_fault = SecComputer_U.in.discrete_inputs.ths_motor_fault;
    SecComputer_B.Data_pix = SecComputer_U.in.bus_inputs.fcdc_1_bus.rudder_pedal_position_deg.Data;
    SecComputer_B.SSM_p5 = SecComputer_U.in.bus_inputs.fcdc_1_bus.capt_pitch_command_deg.SSM;
    SecComputer_B.Data_di = SecComputer_U.in.bus_inputs.fcdc_1_bus.capt_pitch_command_deg.Data;
    SecComputer_B.SSM_mk = SecComputer_U.in.bus_inputs.fcdc_1_bus.fo_pitch_command_deg.SSM;
    SecComputer_B.Data_lz = SecComputer_U.in.bus_inputs.fcdc_1_bus.fo_pitch_command_deg.Data;
    SecComputer_B.SSM_mu = SecComputer_U.in.bus_inputs.fcdc_1_bus.aileron_left_pos_deg.SSM;
    SecComputer_B.Data_lu = SecComputer_U.in.bus_inputs.fcdc_1_bus.aileron_left_pos_deg.Data;
    SecComputer_B.SSM_cbl = SecComputer_U.in.bus_inputs.fcdc_1_bus.elevator_left_pos_deg.SSM;
    SecComputer_B.Data_dc = SecComputer_U.in.bus_inputs.fcdc_1_bus.elevator_left_pos_deg.Data;
    SecComputer_B.SSM_gzd = SecComputer_U.in.bus_inputs.fcdc_1_bus.aileron_right_pos_deg.SSM;
    SecComputer_B.l_elev_servo_failed = SecComputer_U.in.discrete_inputs.l_elev_servo_failed;
    SecComputer_B.Data_gc = SecComputer_U.in.bus_inputs.fcdc_1_bus.aileron_right_pos_deg.Data;
    SecComputer_B.SSM_mo = SecComputer_U.in.bus_inputs.fcdc_1_bus.elevator_right_pos_deg.SSM;
    SecComputer_B.Data_am = SecComputer_U.in.bus_inputs.fcdc_1_bus.elevator_right_pos_deg.Data;
    SecComputer_B.SSM_me = SecComputer_U.in.bus_inputs.fcdc_1_bus.horiz_stab_trim_pos_deg.SSM;
    SecComputer_B.Data_mo = SecComputer_U.in.bus_inputs.fcdc_1_bus.horiz_stab_trim_pos_deg.Data;
    SecComputer_B.SSM_mj = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_1_left_pos_deg.SSM;
    SecComputer_B.Data_dg = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_1_left_pos_deg.Data;
    SecComputer_B.SSM_a5 = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_2_left_pos_deg.SSM;
    SecComputer_B.Data_e1 = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_2_left_pos_deg.Data;
    SecComputer_B.SSM_bt = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_3_left_pos_deg.SSM;
    SecComputer_B.r_elev_servo_failed = SecComputer_U.in.discrete_inputs.r_elev_servo_failed;
    SecComputer_B.Data_fp = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_3_left_pos_deg.Data;
    SecComputer_B.SSM_om = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_4_left_pos_deg.SSM;
    SecComputer_B.Data_ns = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_4_left_pos_deg.Data;
    SecComputer_B.SSM_ar = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_5_left_pos_deg.SSM;
    SecComputer_B.Data_m3 = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_5_left_pos_deg.Data;
    SecComputer_B.SSM_ce = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_1_right_pos_deg.SSM;
    SecComputer_B.Data_oj = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_1_right_pos_deg.Data;
    SecComputer_B.SSM_ed = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_2_right_pos_deg.SSM;
    SecComputer_B.Data_jy = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_2_right_pos_deg.Data;
    SecComputer_B.SSM_jh = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_3_right_pos_deg.SSM;
    SecComputer_B.l_spoiler_1_servo_failed = SecComputer_U.in.discrete_inputs.l_spoiler_1_servo_failed;
    SecComputer_B.Data_j1 = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_3_right_pos_deg.Data;
    SecComputer_B.SSM_je = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_4_right_pos_deg.SSM;
    SecComputer_B.Data_fc = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_4_right_pos_deg.Data;
    SecComputer_B.SSM_jt = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_5_right_pos_deg.SSM;
    SecComputer_B.Data_of = SecComputer_U.in.bus_inputs.fcdc_1_bus.spoiler_5_right_pos_deg.Data;
    SecComputer_B.SSM_cui = SecComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_1.SSM;
    SecComputer_B.Data_lg = SecComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_1.Data;
    SecComputer_B.SSM_mq = SecComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_2.SSM;
    SecComputer_B.Data_n4 = SecComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_2.Data;
    SecComputer_B.SSM_ni = SecComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_3.SSM;
    SecComputer_B.r_spoiler_1_servo_failed = SecComputer_U.in.discrete_inputs.r_spoiler_1_servo_failed;
    SecComputer_B.Data_ot = SecComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_3.Data;
    SecComputer_B.SSM_df = SecComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_4.SSM;
    SecComputer_B.Data_gv = SecComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_4.Data;
    SecComputer_B.SSM_oe = SecComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_5.SSM;
    SecComputer_B.Data_ou = SecComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_5.Data;
    SecComputer_B.SSM_ha = SecComputer_U.in.bus_inputs.fcdc_2_bus.capt_roll_command_deg.SSM;
    SecComputer_B.Data_dh = SecComputer_U.in.bus_inputs.fcdc_2_bus.capt_roll_command_deg.Data;
    SecComputer_B.SSM_op = SecComputer_U.in.bus_inputs.fcdc_2_bus.fo_roll_command_deg.SSM;
    SecComputer_B.Data_ph = SecComputer_U.in.bus_inputs.fcdc_2_bus.fo_roll_command_deg.Data;
    SecComputer_B.SSM_a50 = SecComputer_U.in.bus_inputs.fcdc_2_bus.rudder_pedal_position_deg.SSM;
    SecComputer_B.monotonic_time = SecComputer_U.in.time.monotonic_time;
    SecComputer_B.l_spoiler_2_servo_failed = SecComputer_U.in.discrete_inputs.l_spoiler_2_servo_failed;
    SecComputer_B.Data_gs = SecComputer_U.in.bus_inputs.fcdc_2_bus.rudder_pedal_position_deg.Data;
    SecComputer_B.SSM_og = SecComputer_U.in.bus_inputs.fcdc_2_bus.capt_pitch_command_deg.SSM;
    SecComputer_B.Data_fd4 = SecComputer_U.in.bus_inputs.fcdc_2_bus.capt_pitch_command_deg.Data;
    SecComputer_B.SSM_a4 = SecComputer_U.in.bus_inputs.fcdc_2_bus.fo_pitch_command_deg.SSM;
    SecComputer_B.Data_hm = SecComputer_U.in.bus_inputs.fcdc_2_bus.fo_pitch_command_deg.Data;
    SecComputer_B.SSM_bv = SecComputer_U.in.bus_inputs.fcdc_2_bus.aileron_left_pos_deg.SSM;
    SecComputer_B.Data_i2 = SecComputer_U.in.bus_inputs.fcdc_2_bus.aileron_left_pos_deg.Data;
    SecComputer_B.SSM_bo = SecComputer_U.in.bus_inputs.fcdc_2_bus.elevator_left_pos_deg.SSM;
    SecComputer_B.Data_og = SecComputer_U.in.bus_inputs.fcdc_2_bus.elevator_left_pos_deg.Data;
    SecComputer_B.SSM_d1 = SecComputer_U.in.bus_inputs.fcdc_2_bus.aileron_right_pos_deg.SSM;
    SecComputer_B.r_spoiler_2_servo_failed = SecComputer_U.in.discrete_inputs.r_spoiler_2_servo_failed;
    SecComputer_B.Data_fv = SecComputer_U.in.bus_inputs.fcdc_2_bus.aileron_right_pos_deg.Data;
    SecComputer_B.SSM_hy = SecComputer_U.in.bus_inputs.fcdc_2_bus.elevator_right_pos_deg.SSM;
    SecComputer_B.Data_oc = SecComputer_U.in.bus_inputs.fcdc_2_bus.elevator_right_pos_deg.Data;
    SecComputer_B.SSM_gi = SecComputer_U.in.bus_inputs.fcdc_2_bus.horiz_stab_trim_pos_deg.SSM;
    SecComputer_B.Data_kq = SecComputer_U.in.bus_inputs.fcdc_2_bus.horiz_stab_trim_pos_deg.Data;
    SecComputer_B.SSM_pp = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_1_left_pos_deg.SSM;
    SecComputer_B.Data_ne = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_1_left_pos_deg.Data;
    SecComputer_B.SSM_iab = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_2_left_pos_deg.SSM;
    SecComputer_B.Data_it = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_2_left_pos_deg.Data;
    SecComputer_B.SSM_jtv = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_3_left_pos_deg.SSM;
    SecComputer_B.ths_override_active = SecComputer_U.in.discrete_inputs.ths_override_active;
    SecComputer_B.Data_ch = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_3_left_pos_deg.Data;
    SecComputer_B.SSM_fy = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_4_left_pos_deg.SSM;
    SecComputer_B.Data_bb = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_4_left_pos_deg.Data;
    SecComputer_B.SSM_d4 = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_5_left_pos_deg.SSM;
    SecComputer_B.Data_ol = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_5_left_pos_deg.Data;
    SecComputer_B.SSM_ars = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_1_right_pos_deg.SSM;
    SecComputer_B.Data_hw = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_1_right_pos_deg.Data;
    SecComputer_B.SSM_din = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_2_right_pos_deg.SSM;
    SecComputer_B.Data_hs = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_2_right_pos_deg.Data;
    SecComputer_B.SSM_m3 = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_3_right_pos_deg.SSM;
    SecComputer_B.capt_priority_takeover_pressed = SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed;
    SecComputer_B.Data_fj = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_3_right_pos_deg.Data;
    SecComputer_B.SSM_np = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_4_right_pos_deg.SSM;
    SecComputer_B.Data_ky = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_4_right_pos_deg.Data;
    SecComputer_B.SSM_ax = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_5_right_pos_deg.SSM;
    SecComputer_B.Data_h5 = SecComputer_U.in.bus_inputs.fcdc_2_bus.spoiler_5_right_pos_deg.Data;
    SecComputer_B.SSM_cl = SecComputer_U.in.bus_inputs.elac_2_bus.left_aileron_position_deg.SSM;
    SecComputer_B.Data_ku = SecComputer_U.in.bus_inputs.elac_2_bus.left_aileron_position_deg.Data;
    SecComputer_B.SSM_es = SecComputer_U.in.bus_inputs.elac_2_bus.right_aileron_position_deg.SSM;
    SecComputer_B.Data_jp = SecComputer_U.in.bus_inputs.elac_2_bus.right_aileron_position_deg.Data;
    SecComputer_B.SSM_gi1 = SecComputer_U.in.bus_inputs.elac_2_bus.left_elevator_position_deg.SSM;
    SecComputer_B.fo_priority_takeover_pressed = SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed;
    SecComputer_B.Data_nu = SecComputer_U.in.bus_inputs.elac_2_bus.left_elevator_position_deg.Data;
    SecComputer_B.SSM_jz = SecComputer_U.in.bus_inputs.elac_2_bus.right_elevator_position_deg.SSM;
    SecComputer_B.Data_br = SecComputer_U.in.bus_inputs.elac_2_bus.right_elevator_position_deg.Data;
    SecComputer_B.SSM_kt = SecComputer_U.in.bus_inputs.elac_2_bus.ths_position_deg.SSM;
    SecComputer_B.Data_ae = SecComputer_U.in.bus_inputs.elac_2_bus.ths_position_deg.Data;
    SecComputer_B.SSM_ds = SecComputer_U.in.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.SSM;
    SecComputer_B.Data_pe = SecComputer_U.in.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.Data;
    SecComputer_B.SSM_eg = SecComputer_U.in.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.SSM;
    SecComputer_B.Data_fy = SecComputer_U.in.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.Data;
    SecComputer_B.SSM_a0 = SecComputer_U.in.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.SSM;
    SecComputer_B.capt_pitch_stick_pos = SecComputer_U.in.analog_inputs.capt_pitch_stick_pos;
    SecComputer_B.Data_na = SecComputer_U.in.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.Data;
    SecComputer_B.SSM_cv = SecComputer_U.in.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.SSM;
    SecComputer_B.Data_my = SecComputer_U.in.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.Data;
    SecComputer_B.SSM_ea = SecComputer_U.in.bus_inputs.elac_2_bus.rudder_pedal_position_deg.SSM;
    SecComputer_B.Data_i4 = SecComputer_U.in.bus_inputs.elac_2_bus.rudder_pedal_position_deg.Data;
    SecComputer_B.SSM_p4 = SecComputer_U.in.bus_inputs.elac_2_bus.aileron_command_deg.SSM;
    SecComputer_B.Data_cx = SecComputer_U.in.bus_inputs.elac_2_bus.aileron_command_deg.Data;
    SecComputer_B.SSM_m2 = SecComputer_U.in.bus_inputs.elac_2_bus.roll_spoiler_command_deg.SSM;
    SecComputer_B.Data_nz = SecComputer_U.in.bus_inputs.elac_2_bus.roll_spoiler_command_deg.Data;
    SecComputer_B.SSM_bt0 = SecComputer_U.in.bus_inputs.elac_2_bus.yaw_damper_command_deg.SSM;
    SecComputer_B.fo_pitch_stick_pos = SecComputer_U.in.analog_inputs.fo_pitch_stick_pos;
    SecComputer_B.Data_id = SecComputer_U.in.bus_inputs.elac_2_bus.yaw_damper_command_deg.Data;
    SecComputer_B.SSM_nr = SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1.SSM;
    SecComputer_B.Data_o2 = SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1.Data;
    SecComputer_B.SSM_fr = SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2.SSM;
    SecComputer_B.Data_gqq = SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2.Data;
    SecComputer_B.SSM_cc = SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
    SecComputer_B.Data_md = SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
    SecComputer_B.SSM_lm = SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
    SecComputer_B.Data_cz = SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
    SecComputer_B.SSM_mkm = SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
    SecComputer_B.capt_roll_stick_pos = SecComputer_U.in.analog_inputs.capt_roll_stick_pos;
    SecComputer_B.Data_pm = SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
    SecComputer_B.SSM_jhd = SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
    SecComputer_B.Data_bj = SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
    SecComputer_B.SSM_av = SecComputer_U.in.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
    SecComputer_B.Data_ox = SecComputer_U.in.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
    SecComputer_B.SSM_ira = SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
    SecComputer_B.Data_pe5 = SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
    SecComputer_B.SSM_ge = SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
    SecComputer_B.Data_jj = SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
    SecComputer_B.SSM_lv = SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
    SecComputer_B.fo_roll_stick_pos = SecComputer_U.in.analog_inputs.fo_roll_stick_pos;
    SecComputer_B.Data_p5 = SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
    SecComputer_B.SSM_cg = SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
    SecComputer_B.Data_ekl = SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
    SecComputer_B.SSM_be = SecComputer_U.in.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
    SecComputer_B.Data_nd = SecComputer_U.in.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
    SecComputer_B.SSM_axb = SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_1.SSM;
    SecComputer_B.Data_n2 = SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_1.Data;
    SecComputer_B.SSM_nz = SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2.SSM;
    SecComputer_B.Data_dl = SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2.Data;
    SecComputer_B.SSM_cx = SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3.SSM;
    SecComputer_B.spd_brk_lever_pos = SecComputer_U.in.analog_inputs.spd_brk_lever_pos;
    SecComputer_B.Data_gs2 = SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3.Data;
    SecComputer_B.SSM_gh = SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_4.SSM;
    SecComputer_B.Data_h4 = SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_4.Data;
    SecComputer_B.SSM_ks = SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_1.SSM;
    SecComputer_B.Data_e3 = SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_1.Data;
    SecComputer_B.SSM_pw = SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2.SSM;
    SecComputer_B.Data_f5h = SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2.Data;
    SecComputer_B.SSM_fh = SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3.SSM;
    SecComputer_B.Data_an = SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3.Data;
    SecComputer_B.SSM_gzn = SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_4.SSM;
    SecComputer_B.slew_on = SecComputer_U.in.sim_data.slew_on;
    SecComputer_B.thr_lever_1_pos = SecComputer_U.in.analog_inputs.thr_lever_1_pos;
    SecComputer_B.Data_i4o = SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_4.Data;
    SecComputer_B.thr_lever_2_pos = SecComputer_U.in.analog_inputs.thr_lever_2_pos;
    SecComputer_B.left_elevator_pos_deg = SecComputer_U.in.analog_inputs.left_elevator_pos_deg;
    SecComputer_B.right_elevator_pos_deg = SecComputer_U.in.analog_inputs.right_elevator_pos_deg;
    SecComputer_B.ths_pos_deg = SecComputer_U.in.analog_inputs.ths_pos_deg;
    SecComputer_B.left_spoiler_1_pos_deg = SecComputer_U.in.analog_inputs.left_spoiler_1_pos_deg;
    SecComputer_B.right_spoiler_1_pos_deg = SecComputer_U.in.analog_inputs.right_spoiler_1_pos_deg;
    SecComputer_B.left_spoiler_2_pos_deg = SecComputer_U.in.analog_inputs.left_spoiler_2_pos_deg;
    SecComputer_B.right_spoiler_2_pos_deg = SecComputer_U.in.analog_inputs.right_spoiler_2_pos_deg;
    SecComputer_B.load_factor_acc_1_g = SecComputer_U.in.analog_inputs.load_factor_acc_1_g;
    SecComputer_B.pause_on = SecComputer_U.in.sim_data.pause_on;
    SecComputer_B.load_factor_acc_2_g = SecComputer_U.in.analog_inputs.load_factor_acc_2_g;
    SecComputer_B.wheel_speed_left = SecComputer_U.in.analog_inputs.wheel_speed_left;
    SecComputer_B.wheel_speed_right = SecComputer_U.in.analog_inputs.wheel_speed_right;
    SecComputer_B.SSM_oo = SecComputer_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
    SecComputer_B.Data_af = SecComputer_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
    SecComputer_B.SSM_evh = SecComputer_U.in.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM;
    SecComputer_B.Data_bm = SecComputer_U.in.bus_inputs.adr_1_bus.altitude_corrected_ft.Data;
    SecComputer_B.SSM_cn = SecComputer_U.in.bus_inputs.adr_1_bus.mach.SSM;
    SecComputer_B.Data_dk = SecComputer_U.in.bus_inputs.adr_1_bus.mach.Data;
    SecComputer_B.SSM_co = SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
    SecComputer_B.tracking_mode_on_override = SecComputer_U.in.sim_data.tracking_mode_on_override;
    SecComputer_B.Data_nv = SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
    SecComputer_B.SSM_pe = SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
    SecComputer_B.Data_jpf = SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
    SecComputer_B.SSM_cgz = SecComputer_U.in.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
    SecComputer_B.Data_i5 = SecComputer_U.in.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
    SecComputer_B.SSM_fw = SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
    SecComputer_B.Data_k2 = SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    SecComputer_B.SSM_h4 = SecComputer_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
    SecComputer_B.Data_as = SecComputer_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
    SecComputer_B.SSM_cb3 = SecComputer_U.in.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM;
    SecComputer_B.tailstrike_protection_on = SecComputer_U.in.sim_data.tailstrike_protection_on;
    SecComputer_B.Data_gk = SecComputer_U.in.bus_inputs.adr_2_bus.altitude_corrected_ft.Data;
    SecComputer_B.SSM_pj = SecComputer_U.in.bus_inputs.adr_2_bus.mach.SSM;
    SecComputer_B.Data_jl = SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data;
    SecComputer_B.SSM_dv = SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
    SecComputer_B.Data_e32 = SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
    SecComputer_B.SSM_i4 = SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
    SecComputer_B.Data_ih = SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
    SecComputer_B.SSM_fm = SecComputer_U.in.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
    SecComputer_B.Data_du = SecComputer_U.in.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
    SecComputer_B.SSM_e5 = SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
    SecComputer_B.computer_running = SecComputer_U.in.sim_data.computer_running;
    SecComputer_B.Data_nx = SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    SecComputer_B.SSM_bf = SecComputer_U.in.bus_inputs.ir_1_bus.discrete_word_1.SSM;
    SecComputer_B.Data_n0 = SecComputer_U.in.bus_inputs.ir_1_bus.discrete_word_1.Data;
    SecComputer_B.SSM_fd = SecComputer_U.in.bus_inputs.ir_1_bus.latitude_deg.SSM;
    SecComputer_B.Data_eqi = SecComputer_U.in.bus_inputs.ir_1_bus.latitude_deg.Data;
    SecComputer_B.SSM_fv = SecComputer_U.in.bus_inputs.ir_1_bus.longitude_deg.SSM;
    SecComputer_B.Data_om = SecComputer_U.in.bus_inputs.ir_1_bus.longitude_deg.Data;
    SecComputer_B.SSM_dt = SecComputer_U.in.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
    SecComputer_B.Data_nr = SecComputer_U.in.bus_inputs.ir_1_bus.ground_speed_kn.Data;
    SecComputer_B.SSM_j5 = SecComputer_U.in.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
    SecComputer_B.sec_engaged_from_switch = SecComputer_U.in.discrete_inputs.sec_engaged_from_switch;
    SecComputer_B.Data_p3 = SecComputer_U.in.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
    SecComputer_B.SSM_ng = SecComputer_U.in.bus_inputs.ir_1_bus.heading_true_deg.SSM;
    SecComputer_B.Data_nb = SecComputer_U.in.bus_inputs.ir_1_bus.heading_true_deg.Data;
    SecComputer_B.SSM_cs = SecComputer_U.in.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
    SecComputer_B.Data_hd = SecComputer_U.in.bus_inputs.ir_1_bus.wind_speed_kn.Data;
    SecComputer_B.SSM_ls = SecComputer_U.in.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
    SecComputer_B.Data_al = SecComputer_U.in.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
    SecComputer_B.SSM_dg = SecComputer_U.in.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
    SecComputer_B.Data_gu = SecComputer_U.in.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
    SecComputer_B.SSM_d3 = SecComputer_U.in.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
    SecComputer_DWork.icLoad = false;
    SecComputer_DWork.Delay_DSTATE_l = SecComputer_DWork.Delay_DSTATE;
  } else {
    SecComputer_DWork.Runtime_MODE = false;
  }

  SecComputer_Y.out.data.time.dt = SecComputer_B.dt;
  SecComputer_Y.out.data.time.simulation_time = SecComputer_B.simulation_time;
  SecComputer_Y.out.data.time.monotonic_time = SecComputer_B.monotonic_time;
  SecComputer_Y.out.data.sim_data.slew_on = SecComputer_B.slew_on;
  SecComputer_Y.out.data.sim_data.pause_on = SecComputer_B.pause_on;
  SecComputer_Y.out.data.sim_data.tracking_mode_on_override = SecComputer_B.tracking_mode_on_override;
  SecComputer_Y.out.data.sim_data.tailstrike_protection_on = SecComputer_B.tailstrike_protection_on;
  SecComputer_Y.out.data.sim_data.computer_running = SecComputer_B.computer_running;
  SecComputer_Y.out.data.discrete_inputs.sec_engaged_from_switch = SecComputer_B.sec_engaged_from_switch;
  SecComputer_Y.out.data.discrete_inputs.sec_in_emergency_powersupply = SecComputer_B.sec_in_emergency_powersupply;
  SecComputer_Y.out.data.discrete_inputs.is_unit_1 = SecComputer_B.is_unit_1;
  SecComputer_Y.out.data.discrete_inputs.is_unit_2 = SecComputer_B.is_unit_2;
  SecComputer_Y.out.data.discrete_inputs.is_unit_3 = SecComputer_B.is_unit_3;
  SecComputer_Y.out.data.discrete_inputs.pitch_not_avail_elac_1 = SecComputer_B.pitch_not_avail_elac_1;
  SecComputer_Y.out.data.discrete_inputs.pitch_not_avail_elac_2 = SecComputer_B.pitch_not_avail_elac_2;
  SecComputer_Y.out.data.discrete_inputs.left_elev_not_avail_sec_opp = SecComputer_B.left_elev_not_avail_sec_opp;
  SecComputer_Y.out.data.discrete_inputs.digital_output_failed_elac_1 = SecComputer_B.digital_output_failed_elac_1;
  SecComputer_Y.out.data.discrete_inputs.right_elev_not_avail_sec_opp = SecComputer_B.right_elev_not_avail_sec_opp;
  SecComputer_Y.out.data.discrete_inputs.green_low_pressure = SecComputer_B.green_low_pressure;
  SecComputer_Y.out.data.discrete_inputs.blue_low_pressure = SecComputer_B.blue_low_pressure;
  SecComputer_Y.out.data.discrete_inputs.yellow_low_pressure = SecComputer_B.yellow_low_pressure;
  SecComputer_Y.out.data.discrete_inputs.sfcc_1_slats_out = SecComputer_B.sfcc_1_slats_out;
  SecComputer_Y.out.data.discrete_inputs.sfcc_2_slats_out = SecComputer_B.sfcc_2_slats_out;
  SecComputer_Y.out.data.discrete_inputs.digital_output_failed_elac_2 = SecComputer_B.digital_output_failed_elac_2;
  SecComputer_Y.out.data.discrete_inputs.ths_motor_fault = SecComputer_B.ths_motor_fault;
  SecComputer_Y.out.data.discrete_inputs.l_elev_servo_failed = SecComputer_B.l_elev_servo_failed;
  SecComputer_Y.out.data.discrete_inputs.r_elev_servo_failed = SecComputer_B.r_elev_servo_failed;
  SecComputer_Y.out.data.discrete_inputs.l_spoiler_1_servo_failed = SecComputer_B.l_spoiler_1_servo_failed;
  SecComputer_Y.out.data.discrete_inputs.r_spoiler_1_servo_failed = SecComputer_B.r_spoiler_1_servo_failed;
  SecComputer_Y.out.data.discrete_inputs.l_spoiler_2_servo_failed = SecComputer_B.l_spoiler_2_servo_failed;
  SecComputer_Y.out.data.discrete_inputs.r_spoiler_2_servo_failed = SecComputer_B.r_spoiler_2_servo_failed;
  SecComputer_Y.out.data.discrete_inputs.ths_override_active = SecComputer_B.ths_override_active;
  SecComputer_Y.out.data.discrete_inputs.capt_priority_takeover_pressed = SecComputer_B.capt_priority_takeover_pressed;
  SecComputer_Y.out.data.discrete_inputs.fo_priority_takeover_pressed = SecComputer_B.fo_priority_takeover_pressed;
  SecComputer_Y.out.data.analog_inputs.capt_pitch_stick_pos = SecComputer_B.capt_pitch_stick_pos;
  SecComputer_Y.out.data.analog_inputs.fo_pitch_stick_pos = SecComputer_B.fo_pitch_stick_pos;
  SecComputer_Y.out.data.analog_inputs.capt_roll_stick_pos = SecComputer_B.capt_roll_stick_pos;
  SecComputer_Y.out.data.analog_inputs.fo_roll_stick_pos = SecComputer_B.fo_roll_stick_pos;
  SecComputer_Y.out.data.analog_inputs.spd_brk_lever_pos = SecComputer_B.spd_brk_lever_pos;
  SecComputer_Y.out.data.analog_inputs.thr_lever_1_pos = SecComputer_B.thr_lever_1_pos;
  SecComputer_Y.out.data.analog_inputs.thr_lever_2_pos = SecComputer_B.thr_lever_2_pos;
  SecComputer_Y.out.data.analog_inputs.left_elevator_pos_deg = SecComputer_B.left_elevator_pos_deg;
  SecComputer_Y.out.data.analog_inputs.right_elevator_pos_deg = SecComputer_B.right_elevator_pos_deg;
  SecComputer_Y.out.data.analog_inputs.ths_pos_deg = SecComputer_B.ths_pos_deg;
  SecComputer_Y.out.data.analog_inputs.left_spoiler_1_pos_deg = SecComputer_B.left_spoiler_1_pos_deg;
  SecComputer_Y.out.data.analog_inputs.right_spoiler_1_pos_deg = SecComputer_B.right_spoiler_1_pos_deg;
  SecComputer_Y.out.data.analog_inputs.left_spoiler_2_pos_deg = SecComputer_B.left_spoiler_2_pos_deg;
  SecComputer_Y.out.data.analog_inputs.right_spoiler_2_pos_deg = SecComputer_B.right_spoiler_2_pos_deg;
  SecComputer_Y.out.data.analog_inputs.load_factor_acc_1_g = SecComputer_B.load_factor_acc_1_g;
  SecComputer_Y.out.data.analog_inputs.load_factor_acc_2_g = SecComputer_B.load_factor_acc_2_g;
  SecComputer_Y.out.data.analog_inputs.wheel_speed_left = SecComputer_B.wheel_speed_left;
  SecComputer_Y.out.data.analog_inputs.wheel_speed_right = SecComputer_B.wheel_speed_right;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM = SecComputer_B.SSM_oo;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data = SecComputer_B.Data_af;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM = SecComputer_B.SSM_evh;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data = SecComputer_B.Data_bm;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.mach.SSM = SecComputer_B.SSM_cn;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.mach.Data = SecComputer_B.Data_dk;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM = SecComputer_B.SSM_co;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data = SecComputer_B.Data_nv;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM = SecComputer_B.SSM_pe;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data = SecComputer_B.Data_jpf;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM = SecComputer_B.SSM_cgz;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data = SecComputer_B.Data_i5;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM = SecComputer_B.SSM_fw;
  SecComputer_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data = SecComputer_B.Data_k2;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM = SecComputer_B.SSM_h4;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data = SecComputer_B.Data_as;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM = SecComputer_B.SSM_cb3;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data = SecComputer_B.Data_gk;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.mach.SSM = SecComputer_B.SSM_pj;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.mach.Data = SecComputer_B.Data_jl;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM = SecComputer_B.SSM_dv;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data = SecComputer_B.Data_e32;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM = SecComputer_B.SSM_i4;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data = SecComputer_B.Data_ih;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM = SecComputer_B.SSM_fm;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data = SecComputer_B.Data_du;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM = SecComputer_B.SSM_e5;
  SecComputer_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data = SecComputer_B.Data_nx;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.SSM = SecComputer_B.SSM_bf;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.Data = SecComputer_B.Data_n0;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.SSM = SecComputer_B.SSM_fd;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.Data = SecComputer_B.Data_eqi;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.SSM = SecComputer_B.SSM_fv;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.Data = SecComputer_B.Data_om;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM = SecComputer_B.SSM_dt;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.Data = SecComputer_B.Data_nr;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM = SecComputer_B.SSM_j5;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data = SecComputer_B.Data_p3;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.SSM = SecComputer_B.SSM_ng;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.Data = SecComputer_B.Data_nb;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM = SecComputer_B.SSM_cs;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.Data = SecComputer_B.Data_hd;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM = SecComputer_B.SSM_ls;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data = SecComputer_B.Data_al;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM = SecComputer_B.SSM_dg;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data = SecComputer_B.Data_gu;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM = SecComputer_B.SSM_d3;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data = SecComputer_B.Data;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM = SecComputer_B.SSM;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.Data = SecComputer_B.Data_f;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM = SecComputer_B.SSM_k;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data = SecComputer_B.Data_fw;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM = SecComputer_B.SSM_kx;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data = SecComputer_B.Data_fwx;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM = SecComputer_B.SSM_kxx;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data = SecComputer_B.Data_fwxk;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM = SecComputer_B.SSM_kxxt;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.Data = SecComputer_B.Data_fwxkf;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM = SecComputer_B.SSM_kxxta;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data = SecComputer_B.Data_fwxkft;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM = SecComputer_B.SSM_kxxtac;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data = SecComputer_B.Data_fwxkftc;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM = SecComputer_B.SSM_kxxtac0;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data = SecComputer_B.Data_fwxkftc3;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM = SecComputer_B.SSM_kxxtac0z;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.Data = SecComputer_B.Data_fwxkftc3e;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM = SecComputer_B.SSM_kxxtac0zt;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data = SecComputer_B.Data_fwxkftc3ep;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM = SecComputer_B.SSM_kxxtac0ztg;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data = SecComputer_B.Data_fwxkftc3epg;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM = SecComputer_B.SSM_kxxtac0ztgf;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data = SecComputer_B.Data_fwxkftc3epgt;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM = SecComputer_B.SSM_kxxtac0ztgf2;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data = SecComputer_B.Data_fwxkftc3epgtd;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM = SecComputer_B.SSM_kxxtac0ztgf2u;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data = SecComputer_B.Data_fwxkftc3epgtdx;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM = SecComputer_B.SSM_kxxtac0ztgf2ux;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data = SecComputer_B.Data_fwxkftc3epgtdxc;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM = SecComputer_B.SSM_kxxtac0ztgf2uxn;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data = SecComputer_B.Data_h;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM = SecComputer_B.SSM_ky;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data = SecComputer_B.Data_e;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM = SecComputer_B.SSM_d;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.Data = SecComputer_B.Data_j;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM = SecComputer_B.SSM_h;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data = SecComputer_B.Data_d;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM = SecComputer_B.SSM_kb;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data = SecComputer_B.Data_p;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM = SecComputer_B.SSM_p;
  SecComputer_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data = SecComputer_B.Data_i;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.SSM = SecComputer_B.SSM_di;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.Data = SecComputer_B.Data_g;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.SSM = SecComputer_B.SSM_j;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.Data = SecComputer_B.Data_a;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.SSM = SecComputer_B.SSM_i;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.Data = SecComputer_B.Data_eb;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM = SecComputer_B.SSM_g;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.Data = SecComputer_B.Data_jo;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM = SecComputer_B.SSM_db;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data = SecComputer_B.Data_ex;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.SSM = SecComputer_B.SSM_n;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.Data = SecComputer_B.Data_fd;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM = SecComputer_B.SSM_a;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.Data = SecComputer_B.Data_ja;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM = SecComputer_B.SSM_ir;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data = SecComputer_B.Data_k;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM = SecComputer_B.SSM_hu;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data = SecComputer_B.Data_joy;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM = SecComputer_B.SSM_e;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data = SecComputer_B.Data_h3;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM = SecComputer_B.SSM_gr;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.Data = SecComputer_B.Data_a0;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM = SecComputer_B.SSM_ev;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data = SecComputer_B.Data_b;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM = SecComputer_B.SSM_l;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data = SecComputer_B.Data_eq;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM = SecComputer_B.SSM_ei;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data = SecComputer_B.Data_iz;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM = SecComputer_B.SSM_an;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.Data = SecComputer_B.Data_j2;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM = SecComputer_B.SSM_c;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data = SecComputer_B.Data_o;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM = SecComputer_B.SSM_cb;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data = SecComputer_B.Data_m;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM = SecComputer_B.SSM_lb;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data = SecComputer_B.Data_oq;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM = SecComputer_B.SSM_ia;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.Data = SecComputer_B.Data_fo;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM = SecComputer_B.SSM_kyz;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data = SecComputer_B.Data_p1;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM = SecComputer_B.SSM_as;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data = SecComputer_B.Data_p1y;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM = SecComputer_B.SSM_is;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data = SecComputer_B.Data_l;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM = SecComputer_B.SSM_ca;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data = SecComputer_B.Data_kp;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM = SecComputer_B.SSM_o;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data = SecComputer_B.Data_k0;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM = SecComputer_B.SSM_ak;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data = SecComputer_B.Data_pi;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM = SecComputer_B.SSM_cbj;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data = SecComputer_B.Data_dm;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM = SecComputer_B.SSM_cu;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data = SecComputer_B.Data_f5;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM = SecComputer_B.SSM_nn;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.Data = SecComputer_B.Data_js;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM = SecComputer_B.SSM_b;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data = SecComputer_B.Data_ee;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM = SecComputer_B.SSM_m;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data = SecComputer_B.Data_ig;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM = SecComputer_B.SSM_f;
  SecComputer_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data = SecComputer_B.Data_mk;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.left_aileron_position_deg.SSM = SecComputer_B.SSM_bp;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.left_aileron_position_deg.Data = SecComputer_B.Data_pu;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.right_aileron_position_deg.SSM = SecComputer_B.SSM_hb;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.right_aileron_position_deg.Data = SecComputer_B.Data_ly;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.left_elevator_position_deg.SSM = SecComputer_B.SSM_gz;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.left_elevator_position_deg.Data = SecComputer_B.Data_jq;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.right_elevator_position_deg.SSM = SecComputer_B.SSM_pv;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.right_elevator_position_deg.Data = SecComputer_B.Data_o5;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.ths_position_deg.SSM = SecComputer_B.SSM_mf;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.ths_position_deg.Data = SecComputer_B.Data_lyw;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.SSM = SecComputer_B.SSM_m0;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.Data = SecComputer_B.Data_gq;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.SSM = SecComputer_B.SSM_kd;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.Data = SecComputer_B.Data_n;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.SSM = SecComputer_B.SSM_pu;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.Data = SecComputer_B.Data_bq;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.SSM = SecComputer_B.SSM_nv;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.Data = SecComputer_B.Data_dmn;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.rudder_pedal_position_deg.SSM = SecComputer_B.SSM_d5;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.rudder_pedal_position_deg.Data = SecComputer_B.Data_jn;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.aileron_command_deg.SSM = SecComputer_B.SSM_eo;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.aileron_command_deg.Data = SecComputer_B.Data_c;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.roll_spoiler_command_deg.SSM = SecComputer_B.SSM_nd;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.roll_spoiler_command_deg.Data = SecComputer_B.Data_lx;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.yaw_damper_command_deg.SSM = SecComputer_B.SSM_bq;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data = SecComputer_B.Data_jb;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.discrete_status_word_1.SSM = SecComputer_B.SSM_hi;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.discrete_status_word_1.Data = SecComputer_B.Data_fn;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.discrete_status_word_2.SSM = SecComputer_B.SSM_mm;
  SecComputer_Y.out.data.bus_inputs.elac_1_bus.discrete_status_word_2.Data = SecComputer_B.Data_od;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.efcs_status_word_1.SSM = SecComputer_B.SSM_kz;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.efcs_status_word_1.Data = SecComputer_B.Data_ez;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.efcs_status_word_2.SSM = SecComputer_B.SSM_il;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.efcs_status_word_2.Data = SecComputer_B.Data_pw;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.efcs_status_word_3.SSM = SecComputer_B.SSM_i2;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.efcs_status_word_3.Data = SecComputer_B.Data_m2;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.efcs_status_word_4.SSM = SecComputer_B.SSM_ah;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.efcs_status_word_4.Data = SecComputer_B.Data_ek;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.efcs_status_word_5.SSM = SecComputer_B.SSM_en;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.efcs_status_word_5.Data = SecComputer_B.Data_iy;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.capt_roll_command_deg.SSM = SecComputer_B.SSM_dq;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.capt_roll_command_deg.Data = SecComputer_B.Data_lk;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.fo_roll_command_deg.SSM = SecComputer_B.SSM_px;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.fo_roll_command_deg.Data = SecComputer_B.Data_ca;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.rudder_pedal_position_deg.SSM = SecComputer_B.SSM_lbo;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.rudder_pedal_position_deg.Data = SecComputer_B.Data_pix;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.capt_pitch_command_deg.SSM = SecComputer_B.SSM_p5;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.capt_pitch_command_deg.Data = SecComputer_B.Data_di;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.fo_pitch_command_deg.SSM = SecComputer_B.SSM_mk;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.fo_pitch_command_deg.Data = SecComputer_B.Data_lz;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.aileron_left_pos_deg.SSM = SecComputer_B.SSM_mu;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.aileron_left_pos_deg.Data = SecComputer_B.Data_lu;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.elevator_left_pos_deg.SSM = SecComputer_B.SSM_cbl;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.elevator_left_pos_deg.Data = SecComputer_B.Data_dc;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.aileron_right_pos_deg.SSM = SecComputer_B.SSM_gzd;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.aileron_right_pos_deg.Data = SecComputer_B.Data_gc;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.elevator_right_pos_deg.SSM = SecComputer_B.SSM_mo;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.elevator_right_pos_deg.Data = SecComputer_B.Data_am;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.horiz_stab_trim_pos_deg.SSM = SecComputer_B.SSM_me;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.horiz_stab_trim_pos_deg.Data = SecComputer_B.Data_mo;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_1_left_pos_deg.SSM = SecComputer_B.SSM_mj;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_1_left_pos_deg.Data = SecComputer_B.Data_dg;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_2_left_pos_deg.SSM = SecComputer_B.SSM_a5;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_2_left_pos_deg.Data = SecComputer_B.Data_e1;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_3_left_pos_deg.SSM = SecComputer_B.SSM_bt;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_3_left_pos_deg.Data = SecComputer_B.Data_fp;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_4_left_pos_deg.SSM = SecComputer_B.SSM_om;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_4_left_pos_deg.Data = SecComputer_B.Data_ns;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_5_left_pos_deg.SSM = SecComputer_B.SSM_ar;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_5_left_pos_deg.Data = SecComputer_B.Data_m3;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_1_right_pos_deg.SSM = SecComputer_B.SSM_ce;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_1_right_pos_deg.Data = SecComputer_B.Data_oj;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_2_right_pos_deg.SSM = SecComputer_B.SSM_ed;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_2_right_pos_deg.Data = SecComputer_B.Data_jy;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_3_right_pos_deg.SSM = SecComputer_B.SSM_jh;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_3_right_pos_deg.Data = SecComputer_B.Data_j1;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_4_right_pos_deg.SSM = SecComputer_B.SSM_je;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_4_right_pos_deg.Data = SecComputer_B.Data_fc;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_5_right_pos_deg.SSM = SecComputer_B.SSM_jt;
  SecComputer_Y.out.data.bus_inputs.fcdc_1_bus.spoiler_5_right_pos_deg.Data = SecComputer_B.Data_of;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.efcs_status_word_1.SSM = SecComputer_B.SSM_cui;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.efcs_status_word_1.Data = SecComputer_B.Data_lg;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.efcs_status_word_2.SSM = SecComputer_B.SSM_mq;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.efcs_status_word_2.Data = SecComputer_B.Data_n4;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.efcs_status_word_3.SSM = SecComputer_B.SSM_ni;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.efcs_status_word_3.Data = SecComputer_B.Data_ot;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.efcs_status_word_4.SSM = SecComputer_B.SSM_df;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.efcs_status_word_4.Data = SecComputer_B.Data_gv;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.efcs_status_word_5.SSM = SecComputer_B.SSM_oe;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.efcs_status_word_5.Data = SecComputer_B.Data_ou;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.capt_roll_command_deg.SSM = SecComputer_B.SSM_ha;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.capt_roll_command_deg.Data = SecComputer_B.Data_dh;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.fo_roll_command_deg.SSM = SecComputer_B.SSM_op;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.fo_roll_command_deg.Data = SecComputer_B.Data_ph;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.rudder_pedal_position_deg.SSM = SecComputer_B.SSM_a50;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.rudder_pedal_position_deg.Data = SecComputer_B.Data_gs;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.capt_pitch_command_deg.SSM = SecComputer_B.SSM_og;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.capt_pitch_command_deg.Data = SecComputer_B.Data_fd4;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.fo_pitch_command_deg.SSM = SecComputer_B.SSM_a4;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.fo_pitch_command_deg.Data = SecComputer_B.Data_hm;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.aileron_left_pos_deg.SSM = SecComputer_B.SSM_bv;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.aileron_left_pos_deg.Data = SecComputer_B.Data_i2;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.elevator_left_pos_deg.SSM = SecComputer_B.SSM_bo;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.elevator_left_pos_deg.Data = SecComputer_B.Data_og;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.aileron_right_pos_deg.SSM = SecComputer_B.SSM_d1;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.aileron_right_pos_deg.Data = SecComputer_B.Data_fv;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.elevator_right_pos_deg.SSM = SecComputer_B.SSM_hy;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.elevator_right_pos_deg.Data = SecComputer_B.Data_oc;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.horiz_stab_trim_pos_deg.SSM = SecComputer_B.SSM_gi;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.horiz_stab_trim_pos_deg.Data = SecComputer_B.Data_kq;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_1_left_pos_deg.SSM = SecComputer_B.SSM_pp;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_1_left_pos_deg.Data = SecComputer_B.Data_ne;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_2_left_pos_deg.SSM = SecComputer_B.SSM_iab;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_2_left_pos_deg.Data = SecComputer_B.Data_it;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_3_left_pos_deg.SSM = SecComputer_B.SSM_jtv;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_3_left_pos_deg.Data = SecComputer_B.Data_ch;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_4_left_pos_deg.SSM = SecComputer_B.SSM_fy;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_4_left_pos_deg.Data = SecComputer_B.Data_bb;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_5_left_pos_deg.SSM = SecComputer_B.SSM_d4;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_5_left_pos_deg.Data = SecComputer_B.Data_ol;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_1_right_pos_deg.SSM = SecComputer_B.SSM_ars;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_1_right_pos_deg.Data = SecComputer_B.Data_hw;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_2_right_pos_deg.SSM = SecComputer_B.SSM_din;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_2_right_pos_deg.Data = SecComputer_B.Data_hs;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_3_right_pos_deg.SSM = SecComputer_B.SSM_m3;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_3_right_pos_deg.Data = SecComputer_B.Data_fj;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_4_right_pos_deg.SSM = SecComputer_B.SSM_np;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_4_right_pos_deg.Data = SecComputer_B.Data_ky;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_5_right_pos_deg.SSM = SecComputer_B.SSM_ax;
  SecComputer_Y.out.data.bus_inputs.fcdc_2_bus.spoiler_5_right_pos_deg.Data = SecComputer_B.Data_h5;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.left_aileron_position_deg.SSM = SecComputer_B.SSM_cl;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.left_aileron_position_deg.Data = SecComputer_B.Data_ku;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.right_aileron_position_deg.SSM = SecComputer_B.SSM_es;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.right_aileron_position_deg.Data = SecComputer_B.Data_jp;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.left_elevator_position_deg.SSM = SecComputer_B.SSM_gi1;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.left_elevator_position_deg.Data = SecComputer_B.Data_nu;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.right_elevator_position_deg.SSM = SecComputer_B.SSM_jz;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.right_elevator_position_deg.Data = SecComputer_B.Data_br;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.ths_position_deg.SSM = SecComputer_B.SSM_kt;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.ths_position_deg.Data = SecComputer_B.Data_ae;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.SSM = SecComputer_B.SSM_ds;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.Data = SecComputer_B.Data_pe;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.SSM = SecComputer_B.SSM_eg;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.Data = SecComputer_B.Data_fy;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.SSM = SecComputer_B.SSM_a0;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.Data = SecComputer_B.Data_na;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.SSM = SecComputer_B.SSM_cv;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.Data = SecComputer_B.Data_my;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.rudder_pedal_position_deg.SSM = SecComputer_B.SSM_ea;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.rudder_pedal_position_deg.Data = SecComputer_B.Data_i4;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.aileron_command_deg.SSM = SecComputer_B.SSM_p4;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.aileron_command_deg.Data = SecComputer_B.Data_cx;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.roll_spoiler_command_deg.SSM = SecComputer_B.SSM_m2;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.roll_spoiler_command_deg.Data = SecComputer_B.Data_nz;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.yaw_damper_command_deg.SSM = SecComputer_B.SSM_bt0;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.yaw_damper_command_deg.Data = SecComputer_B.Data_id;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.discrete_status_word_1.SSM = SecComputer_B.SSM_nr;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.discrete_status_word_1.Data = SecComputer_B.Data_o2;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.discrete_status_word_2.SSM = SecComputer_B.SSM_fr;
  SecComputer_Y.out.data.bus_inputs.elac_2_bus.discrete_status_word_2.Data = SecComputer_B.Data_gqq;
  SecComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM = SecComputer_B.SSM_cc;
  SecComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data = SecComputer_B.Data_md;
  SecComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM = SecComputer_B.SSM_lm;
  SecComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data = SecComputer_B.Data_cz;
  SecComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM = SecComputer_B.SSM_mkm;
  SecComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data = SecComputer_B.Data_pm;
  SecComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM = SecComputer_B.SSM_jhd;
  SecComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data = SecComputer_B.Data_bj;
  SecComputer_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM = SecComputer_B.SSM_av;
  SecComputer_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data = SecComputer_B.Data_ox;
  SecComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM = SecComputer_B.SSM_ira;
  SecComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data = SecComputer_B.Data_pe5;
  SecComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM = SecComputer_B.SSM_ge;
  SecComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data = SecComputer_B.Data_jj;
  SecComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM = SecComputer_B.SSM_lv;
  SecComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data = SecComputer_B.Data_p5;
  SecComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM = SecComputer_B.SSM_cg;
  SecComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data = SecComputer_B.Data_ekl;
  SecComputer_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM = SecComputer_B.SSM_be;
  SecComputer_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data = SecComputer_B.Data_nd;
  SecComputer_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM = SecComputer_B.SSM_axb;
  SecComputer_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_1.Data = SecComputer_B.Data_n2;
  SecComputer_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_2.SSM = SecComputer_B.SSM_nz;
  SecComputer_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_2.Data = SecComputer_B.Data_dl;
  SecComputer_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_3.SSM = SecComputer_B.SSM_cx;
  SecComputer_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_3.Data = SecComputer_B.Data_gs2;
  SecComputer_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_4.SSM = SecComputer_B.SSM_gh;
  SecComputer_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_4.Data = SecComputer_B.Data_h4;
  SecComputer_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM = SecComputer_B.SSM_ks;
  SecComputer_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_1.Data = SecComputer_B.Data_e3;
  SecComputer_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_2.SSM = SecComputer_B.SSM_pw;
  SecComputer_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_2.Data = SecComputer_B.Data_f5h;
  SecComputer_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_3.SSM = SecComputer_B.SSM_fh;
  SecComputer_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_3.Data = SecComputer_B.Data_an;
  SecComputer_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_4.SSM = SecComputer_B.SSM_gzn;
  SecComputer_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_4.Data = SecComputer_B.Data_i4o;
  SecComputer_Y.out.laws = SecComputer_B.laws;
  SecComputer_Y.out.logic = SecComputer_B.logic;
}

void SecComputer::initialize()
{
  SecComputer_DWork.Delay_DSTATE_c = SecComputer_P.Delay_InitialCondition_c;
  SecComputer_DWork.Delay1_DSTATE = SecComputer_P.Delay1_InitialCondition;
  SecComputer_DWork.Memory_PreviousInput = SecComputer_P.SRFlipFlop_initial_condition;
  SecComputer_DWork.Memory_PreviousInput_f = SecComputer_P.SRFlipFlop_initial_condition_c;
  SecComputer_DWork.Memory_PreviousInput_n = SecComputer_P.SRFlipFlop_initial_condition_k;
  SecComputer_DWork.Delay1_DSTATE_i = SecComputer_P.Delay1_InitialCondition_l;
  SecComputer_DWork.Delay_DSTATE_n = SecComputer_P.Delay_InitialCondition_j;
  SecComputer_DWork.Delay_DSTATE = SecComputer_P.Delay_InitialCondition;
  SecComputer_DWork.icLoad = true;
  LawMDLOBJ2.init();
  SecComputer_B.dt = SecComputer_P.out_Y0.data.time.dt;
  SecComputer_B.simulation_time = SecComputer_P.out_Y0.data.time.simulation_time;
  SecComputer_B.monotonic_time = SecComputer_P.out_Y0.data.time.monotonic_time;
  SecComputer_B.slew_on = SecComputer_P.out_Y0.data.sim_data.slew_on;
  SecComputer_B.pause_on = SecComputer_P.out_Y0.data.sim_data.pause_on;
  SecComputer_B.tracking_mode_on_override = SecComputer_P.out_Y0.data.sim_data.tracking_mode_on_override;
  SecComputer_B.tailstrike_protection_on = SecComputer_P.out_Y0.data.sim_data.tailstrike_protection_on;
  SecComputer_B.computer_running = SecComputer_P.out_Y0.data.sim_data.computer_running;
  SecComputer_B.sec_engaged_from_switch = SecComputer_P.out_Y0.data.discrete_inputs.sec_engaged_from_switch;
  SecComputer_B.sec_in_emergency_powersupply = SecComputer_P.out_Y0.data.discrete_inputs.sec_in_emergency_powersupply;
  SecComputer_B.is_unit_1 = SecComputer_P.out_Y0.data.discrete_inputs.is_unit_1;
  SecComputer_B.is_unit_2 = SecComputer_P.out_Y0.data.discrete_inputs.is_unit_2;
  SecComputer_B.is_unit_3 = SecComputer_P.out_Y0.data.discrete_inputs.is_unit_3;
  SecComputer_B.pitch_not_avail_elac_1 = SecComputer_P.out_Y0.data.discrete_inputs.pitch_not_avail_elac_1;
  SecComputer_B.pitch_not_avail_elac_2 = SecComputer_P.out_Y0.data.discrete_inputs.pitch_not_avail_elac_2;
  SecComputer_B.left_elev_not_avail_sec_opp = SecComputer_P.out_Y0.data.discrete_inputs.left_elev_not_avail_sec_opp;
  SecComputer_B.digital_output_failed_elac_1 = SecComputer_P.out_Y0.data.discrete_inputs.digital_output_failed_elac_1;
  SecComputer_B.right_elev_not_avail_sec_opp = SecComputer_P.out_Y0.data.discrete_inputs.right_elev_not_avail_sec_opp;
  SecComputer_B.green_low_pressure = SecComputer_P.out_Y0.data.discrete_inputs.green_low_pressure;
  SecComputer_B.blue_low_pressure = SecComputer_P.out_Y0.data.discrete_inputs.blue_low_pressure;
  SecComputer_B.yellow_low_pressure = SecComputer_P.out_Y0.data.discrete_inputs.yellow_low_pressure;
  SecComputer_B.sfcc_1_slats_out = SecComputer_P.out_Y0.data.discrete_inputs.sfcc_1_slats_out;
  SecComputer_B.sfcc_2_slats_out = SecComputer_P.out_Y0.data.discrete_inputs.sfcc_2_slats_out;
  SecComputer_B.digital_output_failed_elac_2 = SecComputer_P.out_Y0.data.discrete_inputs.digital_output_failed_elac_2;
  SecComputer_B.ths_motor_fault = SecComputer_P.out_Y0.data.discrete_inputs.ths_motor_fault;
  SecComputer_B.l_elev_servo_failed = SecComputer_P.out_Y0.data.discrete_inputs.l_elev_servo_failed;
  SecComputer_B.r_elev_servo_failed = SecComputer_P.out_Y0.data.discrete_inputs.r_elev_servo_failed;
  SecComputer_B.l_spoiler_1_servo_failed = SecComputer_P.out_Y0.data.discrete_inputs.l_spoiler_1_servo_failed;
  SecComputer_B.r_spoiler_1_servo_failed = SecComputer_P.out_Y0.data.discrete_inputs.r_spoiler_1_servo_failed;
  SecComputer_B.l_spoiler_2_servo_failed = SecComputer_P.out_Y0.data.discrete_inputs.l_spoiler_2_servo_failed;
  SecComputer_B.r_spoiler_2_servo_failed = SecComputer_P.out_Y0.data.discrete_inputs.r_spoiler_2_servo_failed;
  SecComputer_B.ths_override_active = SecComputer_P.out_Y0.data.discrete_inputs.ths_override_active;
  SecComputer_B.capt_priority_takeover_pressed =
    SecComputer_P.out_Y0.data.discrete_inputs.capt_priority_takeover_pressed;
  SecComputer_B.fo_priority_takeover_pressed = SecComputer_P.out_Y0.data.discrete_inputs.fo_priority_takeover_pressed;
  SecComputer_B.capt_pitch_stick_pos = SecComputer_P.out_Y0.data.analog_inputs.capt_pitch_stick_pos;
  SecComputer_B.fo_pitch_stick_pos = SecComputer_P.out_Y0.data.analog_inputs.fo_pitch_stick_pos;
  SecComputer_B.capt_roll_stick_pos = SecComputer_P.out_Y0.data.analog_inputs.capt_roll_stick_pos;
  SecComputer_B.fo_roll_stick_pos = SecComputer_P.out_Y0.data.analog_inputs.fo_roll_stick_pos;
  SecComputer_B.spd_brk_lever_pos = SecComputer_P.out_Y0.data.analog_inputs.spd_brk_lever_pos;
  SecComputer_B.thr_lever_1_pos = SecComputer_P.out_Y0.data.analog_inputs.thr_lever_1_pos;
  SecComputer_B.thr_lever_2_pos = SecComputer_P.out_Y0.data.analog_inputs.thr_lever_2_pos;
  SecComputer_B.left_elevator_pos_deg = SecComputer_P.out_Y0.data.analog_inputs.left_elevator_pos_deg;
  SecComputer_B.right_elevator_pos_deg = SecComputer_P.out_Y0.data.analog_inputs.right_elevator_pos_deg;
  SecComputer_B.ths_pos_deg = SecComputer_P.out_Y0.data.analog_inputs.ths_pos_deg;
  SecComputer_B.left_spoiler_1_pos_deg = SecComputer_P.out_Y0.data.analog_inputs.left_spoiler_1_pos_deg;
  SecComputer_B.right_spoiler_1_pos_deg = SecComputer_P.out_Y0.data.analog_inputs.right_spoiler_1_pos_deg;
  SecComputer_B.left_spoiler_2_pos_deg = SecComputer_P.out_Y0.data.analog_inputs.left_spoiler_2_pos_deg;
  SecComputer_B.right_spoiler_2_pos_deg = SecComputer_P.out_Y0.data.analog_inputs.right_spoiler_2_pos_deg;
  SecComputer_B.load_factor_acc_1_g = SecComputer_P.out_Y0.data.analog_inputs.load_factor_acc_1_g;
  SecComputer_B.load_factor_acc_2_g = SecComputer_P.out_Y0.data.analog_inputs.load_factor_acc_2_g;
  SecComputer_B.wheel_speed_left = SecComputer_P.out_Y0.data.analog_inputs.wheel_speed_left;
  SecComputer_B.wheel_speed_right = SecComputer_P.out_Y0.data.analog_inputs.wheel_speed_right;
  SecComputer_B.SSM_oo = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
  SecComputer_B.Data_af = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
  SecComputer_B.SSM_evh = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM;
  SecComputer_B.Data_bm = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data;
  SecComputer_B.SSM_cn = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.mach.SSM;
  SecComputer_B.Data_dk = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.mach.Data;
  SecComputer_B.SSM_co = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
  SecComputer_B.Data_nv = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
  SecComputer_B.SSM_pe = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
  SecComputer_B.Data_jpf = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
  SecComputer_B.SSM_cgz = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
  SecComputer_B.Data_i5 = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
  SecComputer_B.SSM_fw = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
  SecComputer_B.Data_k2 = SecComputer_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
  SecComputer_B.SSM_h4 = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
  SecComputer_B.Data_as = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
  SecComputer_B.SSM_cb3 = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM;
  SecComputer_B.Data_gk = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data;
  SecComputer_B.SSM_pj = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.mach.SSM;
  SecComputer_B.Data_jl = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.mach.Data;
  SecComputer_B.SSM_dv = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
  SecComputer_B.Data_e32 = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
  SecComputer_B.SSM_i4 = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
  SecComputer_B.Data_ih = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
  SecComputer_B.SSM_fm = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
  SecComputer_B.Data_du = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
  SecComputer_B.SSM_e5 = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
  SecComputer_B.Data_nx = SecComputer_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
  SecComputer_B.SSM_bf = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.SSM;
  SecComputer_B.Data_n0 = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.Data;
  SecComputer_B.SSM_fd = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.SSM;
  SecComputer_B.Data_eqi = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.Data;
  SecComputer_B.SSM_fv = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.SSM;
  SecComputer_B.Data_om = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.Data;
  SecComputer_B.SSM_dt = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
  SecComputer_B.Data_nr = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.Data;
  SecComputer_B.SSM_j5 = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
  SecComputer_B.Data_p3 = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
  SecComputer_B.SSM_ng = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.SSM;
  SecComputer_B.Data_nb = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.Data;
  SecComputer_B.SSM_cs = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
  SecComputer_B.Data_hd = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.Data;
  SecComputer_B.SSM_ls = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
  SecComputer_B.Data_al = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
  SecComputer_B.SSM_dg = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
  SecComputer_B.Data_gu = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
  SecComputer_B.SSM_d3 = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
  SecComputer_B.Data = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
  SecComputer_B.SSM = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
  SecComputer_B.Data_f = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.Data;
  SecComputer_B.SSM_k = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
  SecComputer_B.Data_fw = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
  SecComputer_B.SSM_kx = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
  SecComputer_B.Data_fwx = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
  SecComputer_B.SSM_kxx = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
  SecComputer_B.Data_fwxk = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
  SecComputer_B.SSM_kxxt = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
  SecComputer_B.Data_fwxkf = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.Data;
  SecComputer_B.SSM_kxxta = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
  SecComputer_B.Data_fwxkft = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
  SecComputer_B.SSM_kxxtac = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
  SecComputer_B.Data_fwxkftc = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
  SecComputer_B.SSM_kxxtac0 = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
  SecComputer_B.Data_fwxkftc3 = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
  SecComputer_B.SSM_kxxtac0z = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
  SecComputer_B.Data_fwxkftc3e = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.Data;
  SecComputer_B.SSM_kxxtac0zt = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
  SecComputer_B.Data_fwxkftc3ep = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
  SecComputer_B.SSM_kxxtac0ztg = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
  SecComputer_B.Data_fwxkftc3epg = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
  SecComputer_B.SSM_kxxtac0ztgf = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
  SecComputer_B.Data_fwxkftc3epgt = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
  SecComputer_B.SSM_kxxtac0ztgf2 = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
  SecComputer_B.Data_fwxkftc3epgtd = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
  SecComputer_B.SSM_kxxtac0ztgf2u = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
  SecComputer_B.Data_fwxkftc3epgtdx = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
  SecComputer_B.SSM_kxxtac0ztgf2ux = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
  SecComputer_B.Data_fwxkftc3epgtdxc = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
  SecComputer_B.SSM_kxxtac0ztgf2uxn = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
  SecComputer_B.Data_h = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
  SecComputer_B.SSM_ky = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
  SecComputer_B.Data_e = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
  SecComputer_B.SSM_d = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
  SecComputer_B.Data_j = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.Data;
  SecComputer_B.SSM_h = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
  SecComputer_B.Data_d = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
  SecComputer_B.SSM_kb = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
  SecComputer_B.Data_p = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
  SecComputer_B.SSM_p = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
  SecComputer_B.Data_i = SecComputer_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
  SecComputer_B.SSM_di = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.SSM;
  SecComputer_B.Data_g = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.Data;
  SecComputer_B.SSM_j = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.SSM;
  SecComputer_B.Data_a = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.Data;
  SecComputer_B.SSM_i = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.SSM;
  SecComputer_B.Data_eb = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.Data;
  SecComputer_B.SSM_g = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
  SecComputer_B.Data_jo = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.Data;
  SecComputer_B.SSM_db = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
  SecComputer_B.Data_ex = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
  SecComputer_B.SSM_n = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.SSM;
  SecComputer_B.Data_fd = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.Data;
  SecComputer_B.SSM_a = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
  SecComputer_B.Data_ja = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.Data;
  SecComputer_B.SSM_ir = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
  SecComputer_B.Data_k = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
  SecComputer_B.SSM_hu = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
  SecComputer_B.Data_joy = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
  SecComputer_B.SSM_e = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
  SecComputer_B.Data_h3 = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
  SecComputer_B.SSM_gr = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
  SecComputer_B.Data_a0 = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.Data;
  SecComputer_B.SSM_ev = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
  SecComputer_B.Data_b = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
  SecComputer_B.SSM_l = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
  SecComputer_B.Data_eq = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
  SecComputer_B.SSM_ei = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
  SecComputer_B.Data_iz = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
  SecComputer_B.SSM_an = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
  SecComputer_B.Data_j2 = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.Data;
  SecComputer_B.SSM_c = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
  SecComputer_B.Data_o = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
  SecComputer_B.SSM_cb = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
  SecComputer_B.Data_m = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
  SecComputer_B.SSM_lb = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
  SecComputer_B.Data_oq = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
  SecComputer_B.SSM_ia = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
  SecComputer_B.Data_fo = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.Data;
  SecComputer_B.SSM_kyz = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
  SecComputer_B.Data_p1 = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
  SecComputer_B.SSM_as = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
  SecComputer_B.Data_p1y = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
  SecComputer_B.SSM_is = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
  SecComputer_B.Data_l = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
  SecComputer_B.SSM_ca = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
  SecComputer_B.Data_kp = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
  SecComputer_B.SSM_o = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
  SecComputer_B.Data_k0 = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
  SecComputer_B.SSM_ak = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
  SecComputer_B.Data_pi = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
  SecComputer_B.SSM_cbj = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
  SecComputer_B.Data_dm = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
  SecComputer_B.SSM_cu = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
  SecComputer_B.Data_f5 = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
  SecComputer_B.SSM_nn = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
  SecComputer_B.Data_js = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.Data;
  SecComputer_B.SSM_b = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
  SecComputer_B.Data_ee = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
  SecComputer_B.SSM_m = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
  SecComputer_B.Data_ig = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
  SecComputer_B.SSM_f = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
  SecComputer_B.Data_mk = SecComputer_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
  SecComputer_B.SSM_bp = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_aileron_position_deg.SSM;
  SecComputer_B.Data_pu = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_aileron_position_deg.Data;
  SecComputer_B.SSM_hb = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_aileron_position_deg.SSM;
  SecComputer_B.Data_ly = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_aileron_position_deg.Data;
  SecComputer_B.SSM_gz = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_elevator_position_deg.SSM;
  SecComputer_B.Data_jq = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_elevator_position_deg.Data;
  SecComputer_B.SSM_pv = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_elevator_position_deg.SSM;
  SecComputer_B.Data_o5 = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_elevator_position_deg.Data;
  SecComputer_B.SSM_mf = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.ths_position_deg.SSM;
  SecComputer_B.Data_lyw = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.ths_position_deg.Data;
  SecComputer_B.SSM_m0 = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.SSM;
  SecComputer_B.Data_gq = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.Data;
  SecComputer_B.SSM_kd = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.SSM;
  SecComputer_B.Data_n = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.Data;
  SecComputer_B.SSM_pu = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.SSM;
  SecComputer_B.Data_bq = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.Data;
  SecComputer_B.SSM_nv = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.SSM;
  SecComputer_B.Data_dmn = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.Data;
  SecComputer_B.SSM_d5 = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.rudder_pedal_position_deg.SSM;
  SecComputer_B.Data_jn = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.rudder_pedal_position_deg.Data;
  SecComputer_B.SSM_eo = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.aileron_command_deg.SSM;
  SecComputer_B.Data_c = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.aileron_command_deg.Data;
  SecComputer_B.SSM_nd = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.roll_spoiler_command_deg.SSM;
  SecComputer_B.Data_lx = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.roll_spoiler_command_deg.Data;
  SecComputer_B.SSM_bq = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.yaw_damper_command_deg.SSM;
  SecComputer_B.Data_jb = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data;
  SecComputer_B.SSM_hi = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.discrete_status_word_1.SSM;
  SecComputer_B.Data_fn = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.discrete_status_word_1.Data;
  SecComputer_B.SSM_mm = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.discrete_status_word_2.SSM;
  SecComputer_B.Data_od = SecComputer_P.out_Y0.data.bus_inputs.elac_1_bus.discrete_status_word_2.Data;
  SecComputer_B.SSM_kz = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.efcs_status_word_1.SSM;
  SecComputer_B.Data_ez = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.efcs_status_word_1.Data;
  SecComputer_B.SSM_il = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.efcs_status_word_2.SSM;
  SecComputer_B.Data_pw = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.efcs_status_word_2.Data;
  SecComputer_B.SSM_i2 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.efcs_status_word_3.SSM;
  SecComputer_B.Data_m2 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.efcs_status_word_3.Data;
  SecComputer_B.SSM_ah = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.efcs_status_word_4.SSM;
  SecComputer_B.Data_ek = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.efcs_status_word_4.Data;
  SecComputer_B.SSM_en = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.efcs_status_word_5.SSM;
  SecComputer_B.Data_iy = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.efcs_status_word_5.Data;
  SecComputer_B.SSM_dq = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.capt_roll_command_deg.SSM;
  SecComputer_B.Data_lk = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.capt_roll_command_deg.Data;
  SecComputer_B.SSM_px = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.fo_roll_command_deg.SSM;
  SecComputer_B.Data_ca = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.fo_roll_command_deg.Data;
  SecComputer_B.SSM_lbo = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.rudder_pedal_position_deg.SSM;
  SecComputer_B.Data_pix = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.rudder_pedal_position_deg.Data;
  SecComputer_B.SSM_p5 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.capt_pitch_command_deg.SSM;
  SecComputer_B.Data_di = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.capt_pitch_command_deg.Data;
  SecComputer_B.SSM_mk = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.fo_pitch_command_deg.SSM;
  SecComputer_B.Data_lz = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.fo_pitch_command_deg.Data;
  SecComputer_B.SSM_mu = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.aileron_left_pos_deg.SSM;
  SecComputer_B.Data_lu = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.aileron_left_pos_deg.Data;
  SecComputer_B.SSM_cbl = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.elevator_left_pos_deg.SSM;
  SecComputer_B.Data_dc = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.elevator_left_pos_deg.Data;
  SecComputer_B.SSM_gzd = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.aileron_right_pos_deg.SSM;
  SecComputer_B.Data_gc = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.aileron_right_pos_deg.Data;
  SecComputer_B.SSM_mo = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.elevator_right_pos_deg.SSM;
  SecComputer_B.Data_am = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.elevator_right_pos_deg.Data;
  SecComputer_B.SSM_me = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.horiz_stab_trim_pos_deg.SSM;
  SecComputer_B.Data_mo = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.horiz_stab_trim_pos_deg.Data;
  SecComputer_B.SSM_mj = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_1_left_pos_deg.SSM;
  SecComputer_B.Data_dg = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_1_left_pos_deg.Data;
  SecComputer_B.SSM_a5 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_2_left_pos_deg.SSM;
  SecComputer_B.Data_e1 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_2_left_pos_deg.Data;
  SecComputer_B.SSM_bt = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_3_left_pos_deg.SSM;
  SecComputer_B.Data_fp = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_3_left_pos_deg.Data;
  SecComputer_B.SSM_om = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_4_left_pos_deg.SSM;
  SecComputer_B.Data_ns = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_4_left_pos_deg.Data;
  SecComputer_B.SSM_ar = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_5_left_pos_deg.SSM;
  SecComputer_B.Data_m3 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_5_left_pos_deg.Data;
  SecComputer_B.SSM_ce = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_1_right_pos_deg.SSM;
  SecComputer_B.Data_oj = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_1_right_pos_deg.Data;
  SecComputer_B.SSM_ed = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_2_right_pos_deg.SSM;
  SecComputer_B.Data_jy = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_2_right_pos_deg.Data;
  SecComputer_B.SSM_jh = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_3_right_pos_deg.SSM;
  SecComputer_B.Data_j1 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_3_right_pos_deg.Data;
  SecComputer_B.SSM_je = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_4_right_pos_deg.SSM;
  SecComputer_B.Data_fc = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_4_right_pos_deg.Data;
  SecComputer_B.SSM_jt = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_5_right_pos_deg.SSM;
  SecComputer_B.Data_of = SecComputer_P.out_Y0.data.bus_inputs.fcdc_1_bus.spoiler_5_right_pos_deg.Data;
  SecComputer_B.SSM_cui = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.efcs_status_word_1.SSM;
  SecComputer_B.Data_lg = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.efcs_status_word_1.Data;
  SecComputer_B.SSM_mq = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.efcs_status_word_2.SSM;
  SecComputer_B.Data_n4 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.efcs_status_word_2.Data;
  SecComputer_B.SSM_ni = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.efcs_status_word_3.SSM;
  SecComputer_B.Data_ot = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.efcs_status_word_3.Data;
  SecComputer_B.SSM_df = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.efcs_status_word_4.SSM;
  SecComputer_B.Data_gv = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.efcs_status_word_4.Data;
  SecComputer_B.SSM_oe = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.efcs_status_word_5.SSM;
  SecComputer_B.Data_ou = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.efcs_status_word_5.Data;
  SecComputer_B.SSM_ha = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.capt_roll_command_deg.SSM;
  SecComputer_B.Data_dh = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.capt_roll_command_deg.Data;
  SecComputer_B.SSM_op = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.fo_roll_command_deg.SSM;
  SecComputer_B.Data_ph = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.fo_roll_command_deg.Data;
  SecComputer_B.SSM_a50 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.rudder_pedal_position_deg.SSM;
  SecComputer_B.Data_gs = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.rudder_pedal_position_deg.Data;
  SecComputer_B.SSM_og = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.capt_pitch_command_deg.SSM;
  SecComputer_B.Data_fd4 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.capt_pitch_command_deg.Data;
  SecComputer_B.SSM_a4 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.fo_pitch_command_deg.SSM;
  SecComputer_B.Data_hm = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.fo_pitch_command_deg.Data;
  SecComputer_B.SSM_bv = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.aileron_left_pos_deg.SSM;
  SecComputer_B.Data_i2 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.aileron_left_pos_deg.Data;
  SecComputer_B.SSM_bo = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.elevator_left_pos_deg.SSM;
  SecComputer_B.Data_og = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.elevator_left_pos_deg.Data;
  SecComputer_B.SSM_d1 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.aileron_right_pos_deg.SSM;
  SecComputer_B.Data_fv = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.aileron_right_pos_deg.Data;
  SecComputer_B.SSM_hy = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.elevator_right_pos_deg.SSM;
  SecComputer_B.Data_oc = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.elevator_right_pos_deg.Data;
  SecComputer_B.SSM_gi = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.horiz_stab_trim_pos_deg.SSM;
  SecComputer_B.Data_kq = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.horiz_stab_trim_pos_deg.Data;
  SecComputer_B.SSM_pp = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_1_left_pos_deg.SSM;
  SecComputer_B.Data_ne = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_1_left_pos_deg.Data;
  SecComputer_B.SSM_iab = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_2_left_pos_deg.SSM;
  SecComputer_B.Data_it = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_2_left_pos_deg.Data;
  SecComputer_B.SSM_jtv = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_3_left_pos_deg.SSM;
  SecComputer_B.Data_ch = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_3_left_pos_deg.Data;
  SecComputer_B.SSM_fy = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_4_left_pos_deg.SSM;
  SecComputer_B.Data_bb = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_4_left_pos_deg.Data;
  SecComputer_B.SSM_d4 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_5_left_pos_deg.SSM;
  SecComputer_B.Data_ol = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_5_left_pos_deg.Data;
  SecComputer_B.SSM_ars = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_1_right_pos_deg.SSM;
  SecComputer_B.Data_hw = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_1_right_pos_deg.Data;
  SecComputer_B.SSM_din = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_2_right_pos_deg.SSM;
  SecComputer_B.Data_hs = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_2_right_pos_deg.Data;
  SecComputer_B.SSM_m3 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_3_right_pos_deg.SSM;
  SecComputer_B.Data_fj = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_3_right_pos_deg.Data;
  SecComputer_B.SSM_np = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_4_right_pos_deg.SSM;
  SecComputer_B.Data_ky = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_4_right_pos_deg.Data;
  SecComputer_B.SSM_ax = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_5_right_pos_deg.SSM;
  SecComputer_B.Data_h5 = SecComputer_P.out_Y0.data.bus_inputs.fcdc_2_bus.spoiler_5_right_pos_deg.Data;
  SecComputer_B.SSM_cl = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_aileron_position_deg.SSM;
  SecComputer_B.Data_ku = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_aileron_position_deg.Data;
  SecComputer_B.SSM_es = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_aileron_position_deg.SSM;
  SecComputer_B.Data_jp = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_aileron_position_deg.Data;
  SecComputer_B.SSM_gi1 = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_elevator_position_deg.SSM;
  SecComputer_B.Data_nu = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_elevator_position_deg.Data;
  SecComputer_B.SSM_jz = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_elevator_position_deg.SSM;
  SecComputer_B.Data_br = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_elevator_position_deg.Data;
  SecComputer_B.SSM_kt = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.ths_position_deg.SSM;
  SecComputer_B.Data_ae = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.ths_position_deg.Data;
  SecComputer_B.SSM_ds = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.SSM;
  SecComputer_B.Data_pe = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.Data;
  SecComputer_B.SSM_eg = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.SSM;
  SecComputer_B.Data_fy = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.Data;
  SecComputer_B.SSM_a0 = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.SSM;
  SecComputer_B.Data_na = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.Data;
  SecComputer_B.SSM_cv = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.SSM;
  SecComputer_B.Data_my = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.Data;
  SecComputer_B.SSM_ea = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.rudder_pedal_position_deg.SSM;
  SecComputer_B.Data_i4 = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.rudder_pedal_position_deg.Data;
  SecComputer_B.SSM_p4 = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.aileron_command_deg.SSM;
  SecComputer_B.Data_cx = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.aileron_command_deg.Data;
  SecComputer_B.SSM_m2 = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.roll_spoiler_command_deg.SSM;
  SecComputer_B.Data_nz = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.roll_spoiler_command_deg.Data;
  SecComputer_B.SSM_bt0 = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.yaw_damper_command_deg.SSM;
  SecComputer_B.Data_id = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.yaw_damper_command_deg.Data;
  SecComputer_B.SSM_nr = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.discrete_status_word_1.SSM;
  SecComputer_B.Data_o2 = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.discrete_status_word_1.Data;
  SecComputer_B.SSM_fr = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.discrete_status_word_2.SSM;
  SecComputer_B.Data_gqq = SecComputer_P.out_Y0.data.bus_inputs.elac_2_bus.discrete_status_word_2.Data;
  SecComputer_B.SSM_cc = SecComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
  SecComputer_B.Data_md = SecComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
  SecComputer_B.SSM_lm = SecComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
  SecComputer_B.Data_cz = SecComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
  SecComputer_B.SSM_mkm = SecComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
  SecComputer_B.Data_pm = SecComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
  SecComputer_B.SSM_jhd = SecComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
  SecComputer_B.Data_bj = SecComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
  SecComputer_B.SSM_av = SecComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
  SecComputer_B.Data_ox = SecComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
  SecComputer_B.SSM_ira = SecComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
  SecComputer_B.Data_pe5 = SecComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
  SecComputer_B.SSM_ge = SecComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
  SecComputer_B.Data_jj = SecComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
  SecComputer_B.SSM_lv = SecComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
  SecComputer_B.Data_p5 = SecComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
  SecComputer_B.SSM_cg = SecComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
  SecComputer_B.Data_ekl = SecComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
  SecComputer_B.SSM_be = SecComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
  SecComputer_B.Data_nd = SecComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
  SecComputer_B.SSM_axb = SecComputer_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM;
  SecComputer_B.Data_n2 = SecComputer_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_1.Data;
  SecComputer_B.SSM_nz = SecComputer_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_2.SSM;
  SecComputer_B.Data_dl = SecComputer_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_2.Data;
  SecComputer_B.SSM_cx = SecComputer_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_3.SSM;
  SecComputer_B.Data_gs2 = SecComputer_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_3.Data;
  SecComputer_B.SSM_gh = SecComputer_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_4.SSM;
  SecComputer_B.Data_h4 = SecComputer_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_4.Data;
  SecComputer_B.SSM_ks = SecComputer_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM;
  SecComputer_B.Data_e3 = SecComputer_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_1.Data;
  SecComputer_B.SSM_pw = SecComputer_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_2.SSM;
  SecComputer_B.Data_f5h = SecComputer_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_2.Data;
  SecComputer_B.SSM_fh = SecComputer_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_3.SSM;
  SecComputer_B.Data_an = SecComputer_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_3.Data;
  SecComputer_B.SSM_gzn = SecComputer_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_4.SSM;
  SecComputer_B.Data_i4o = SecComputer_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_4.Data;
  SecComputer_B.laws = SecComputer_P.out_Y0.laws;
  SecComputer_B.logic = SecComputer_P.out_Y0.logic;
  SecComputer_Y.out.discrete_outputs = SecComputer_P.out_Y0.discrete_outputs;
  SecComputer_Y.out.analog_outputs = SecComputer_P.out_Y0.analog_outputs;
  SecComputer_Y.out.bus_outputs = SecComputer_P.out_Y0.bus_outputs;
}

void SecComputer::terminate()
{
}

SecComputer::SecComputer():
  SecComputer_U(),
  SecComputer_Y(),
  SecComputer_B(),
  SecComputer_DWork()
{
}

SecComputer::~SecComputer()
{
}
