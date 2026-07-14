#include "A380FadecComputer.h"
#include "A380FadecComputer_types.h"
#include "rtwtypes.h"
#include <cmath>

const base_arinc_429 A380FadecComputer_rtZbase_arinc_429{
  0U,
  0.0F
};

void A380FadecComputer::A380FadecComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void A380FadecComputer::A380FadecComputer_MATLABFunction_p(const base_arinc_429 *rtu_u, real32_T rtu_default, real32_T
  *rty_y)
{
  if (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
    *rty_y = rtu_u->Data;
  } else {
    *rty_y = rtu_default;
  }
}

void A380FadecComputer::A380FadecComputer_TimeSinceCondition(real_T rtu_time, boolean_T rtu_condition, real_T *rty_y,
  rtDW_TimeSinceCondition_A380FadecComputer_T *localDW)
{
  if (!localDW->eventTime_not_empty) {
    localDW->eventTime = rtu_time;
    localDW->eventTime_not_empty = true;
  }

  if ((!rtu_condition) || (localDW->eventTime == 0.0)) {
    localDW->eventTime = rtu_time;
  }

  *rty_y = rtu_time - localDW->eventTime;
}

void A380FadecComputer::A380FadecComputer_MATLABFunction_g(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void A380FadecComputer::A380FadecComputer_MATLABFunction_l(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void A380FadecComputer::A380FadecComputer_MATLABFunction_f(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_A380FadecComputer_m_T *localDW)
{
  if (!localDW->previousInput_not_empty) {
    localDW->previousInput = rtu_isRisingEdge;
    localDW->previousInput_not_empty = true;
  }

  if (rtu_isRisingEdge) {
    *rty_y = (rtu_u && (!localDW->previousInput));
  } else {
    *rty_y = ((!rtu_u) && localDW->previousInput);
  }

  localDW->previousInput = rtu_u;
}

void A380FadecComputer::step()
{
  base_arinc_429 rtb_BusAssignment_e_prim_input_fg_n1_command_percent;
  base_arinc_429 rtb_BusAssignment_o_prim_input_fg_ats_discrete_word;
  real_T N1_begin;
  real_T N1_end;
  real_T rtb_N1c;
  real_T rtb_Sum;
  real_T rtb_Switch;
  real_T rtb_Switch2_idx_1;
  int32_T TLA_begin;
  int32_T TLA_end;
  real32_T rtb_n1_command_percent_Data;
  real32_T rtb_y_k;
  uint32_T rtb_n1_command_percent_SSM;
  uint32_T rtb_y_a;
  uint32_T rtb_y_h;
  uint32_T rtb_y_p;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_AND;
  boolean_T rtb_BusAssignment_e_data_computed_TLA_in_active_range;
  boolean_T rtb_NOT1_f;
  boolean_T rtb_inReverse;
  boolean_T rtb_y_mb;
  boolean_T rtb_y_o;
  athr_thrust_limit_type rtb_type;
  if (A380FadecComputer_P.Switch_181_Threshold < 0.0) {
    rtb_BusAssignment_o_prim_input_fg_ats_discrete_word.SSM = A380FadecComputer_U.in.prim_1.fg.ats_discrete_word.SSM;
  } else if (A380FadecComputer_P.Switch1_181_Threshold < 0.0) {
    rtb_BusAssignment_o_prim_input_fg_ats_discrete_word.SSM = A380FadecComputer_U.in.prim_2.fg.ats_discrete_word.SSM;
  } else {
    rtb_BusAssignment_o_prim_input_fg_ats_discrete_word.SSM = A380FadecComputer_U.in.prim_3.fg.ats_discrete_word.SSM;
  }

  if (A380FadecComputer_P.Switch_182_Threshold < 0.0) {
    rtb_BusAssignment_o_prim_input_fg_ats_discrete_word.Data = A380FadecComputer_U.in.prim_1.fg.ats_discrete_word.Data;
  } else if (A380FadecComputer_P.Switch1_182_Threshold < 0.0) {
    rtb_BusAssignment_o_prim_input_fg_ats_discrete_word.Data = A380FadecComputer_U.in.prim_2.fg.ats_discrete_word.Data;
  } else {
    rtb_BusAssignment_o_prim_input_fg_ats_discrete_word.Data = A380FadecComputer_U.in.prim_3.fg.ats_discrete_word.Data;
  }

  if (A380FadecComputer_P.Switch_199_Threshold < 0.0) {
    rtb_n1_command_percent_SSM = A380FadecComputer_U.in.prim_1.fg.n1_command_percent.SSM;
  } else if (A380FadecComputer_P.Switch1_199_Threshold < 0.0) {
    rtb_n1_command_percent_SSM = A380FadecComputer_U.in.prim_2.fg.n1_command_percent.SSM;
  } else {
    rtb_n1_command_percent_SSM = A380FadecComputer_U.in.prim_3.fg.n1_command_percent.SSM;
  }

  if (A380FadecComputer_P.Switch_200_Threshold < 0.0) {
    rtb_n1_command_percent_Data = A380FadecComputer_U.in.prim_1.fg.n1_command_percent.Data;
  } else if (A380FadecComputer_P.Switch1_200_Threshold < 0.0) {
    rtb_n1_command_percent_Data = A380FadecComputer_U.in.prim_2.fg.n1_command_percent.Data;
  } else {
    rtb_n1_command_percent_Data = A380FadecComputer_U.in.prim_3.fg.n1_command_percent.Data;
  }

  A380FadecComputer_TimeSinceCondition(A380FadecComputer_U.in.time.simulation_time,
    A380FadecComputer_U.in.input.ATHR_disconnect, &rtb_Switch, &A380FadecComputer_DWork.sf_TimeSinceCondition);
  A380FadecComputer_DWork.Memory_PreviousInput = A380FadecComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_Switch >=
    A380FadecComputer_P.CompareToConstant_const) << 1) + A380FadecComputer_U.in.input.ATHR_reset_disable) << 1) +
    A380FadecComputer_DWork.Memory_PreviousInput];
  A380FadecComputer_MATLABFunction(&A380FadecComputer_rtZbase_arinc_429, &rtb_NOT1_f);
  A380FadecComputer_MATLABFunction_p(&A380FadecComputer_rtZbase_arinc_429,
    A380FadecComputer_P.A429ValueOrDefault_defaultValue, &rtb_y_k);
  rtb_y_mb = (rtb_NOT1_f && (rtb_y_k > A380FadecComputer_U.in.data.TAT_degC));
  A380FadecComputer_DWork.latch = ((rtb_y_mb && A380FadecComputer_U.in.data.on_ground &&
    (A380FadecComputer_U.in.input.TLA_deg == 35.0)) || A380FadecComputer_DWork.latch);
  A380FadecComputer_DWork.latch = (((!A380FadecComputer_DWork.latch) || ((A380FadecComputer_U.in.input.TLA_deg != 25.0) &&
    (A380FadecComputer_U.in.input.TLA_deg != 45.0))) && A380FadecComputer_DWork.latch);
  rtb_y_mb = ((rtb_y_mb && A380FadecComputer_U.in.data.on_ground) || ((!A380FadecComputer_U.in.data.on_ground) &&
    A380FadecComputer_DWork.latch));
  A380FadecComputer_TimeSinceCondition(A380FadecComputer_U.in.time.simulation_time,
    A380FadecComputer_U.in.data.on_ground, &rtb_Switch, &A380FadecComputer_DWork.sf_TimeSinceCondition1);
  rtb_N1c = A380FadecComputer_U.in.input.TLA_deg;
  if (!A380FadecComputer_U.in.data.on_ground) {
    rtb_N1c = std::fmax(0.0, A380FadecComputer_U.in.input.TLA_deg);
  }

  rtb_inReverse = (rtb_N1c < 0.0);
  if (rtb_N1c >= 0.0) {
    if (rtb_N1c <= 25.0) {
      TLA_begin = 0;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_IDLE_percent;
      TLA_end = 25;
      N1_end = A380FadecComputer_U.in.input.thrust_limit_CLB_percent;
    } else if (rtb_N1c <= 35.0) {
      TLA_begin = 25;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_CLB_percent;
      TLA_end = 35;
      if (rtb_y_mb) {
        N1_end = A380FadecComputer_U.in.input.thrust_limit_FLEX_percent;
      } else {
        N1_end = A380FadecComputer_U.in.input.thrust_limit_MCT_percent;
      }
    } else {
      TLA_begin = 35;
      if (rtb_y_mb) {
        N1_begin = A380FadecComputer_U.in.input.thrust_limit_FLEX_percent;
      } else {
        N1_begin = A380FadecComputer_U.in.input.thrust_limit_MCT_percent;
      }

      TLA_end = 45;
      N1_end = A380FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    }
  } else {
    rtb_N1c = std::fmax(std::abs(rtb_N1c), 6.0);
    TLA_begin = 6;
    N1_begin = std::abs(A380FadecComputer_U.in.input.thrust_limit_IDLE_percent + 1.0);
    TLA_end = 20;
    N1_end = std::abs(A380FadecComputer_U.in.input.thrust_limit_REV_percent);
  }

  rtb_N1c = (N1_end - N1_begin) / static_cast<real_T>(TLA_end - TLA_begin) * (rtb_N1c - static_cast<real_T>(TLA_begin))
    + N1_begin;
  A380FadecComputer_MATLABFunction_g(&rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel_bit, &rtb_y_p);
  N1_begin = A380FadecComputer_U.in.input.TLA_deg;
  if (!A380FadecComputer_U.in.data.on_ground) {
    N1_begin = std::fmax(0.0, A380FadecComputer_U.in.input.TLA_deg);
  }

  if ((!A380FadecComputer_U.in.data.on_ground) || (!A380FadecComputer_U.in.data.is_engine_operative)) {
    if (rtb_y_p != 0U) {
      rtb_type = athr_thrust_limit_type::TOGA;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    } else if (N1_begin > 35.0) {
      rtb_type = athr_thrust_limit_type::TOGA;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    } else if (N1_begin > 25.0) {
      if (!rtb_y_mb) {
        rtb_type = athr_thrust_limit_type::MCT;
        N1_begin = A380FadecComputer_U.in.input.thrust_limit_MCT_percent;
      } else {
        rtb_type = athr_thrust_limit_type::FLEX;
        N1_begin = A380FadecComputer_U.in.input.thrust_limit_FLEX_percent;
      }
    } else if (N1_begin >= 0.0) {
      rtb_type = athr_thrust_limit_type::CLB;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_CLB_percent;
    } else if (N1_begin < 0.0) {
      rtb_type = athr_thrust_limit_type::REVERSE;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_REV_percent;
    } else {
      rtb_type = athr_thrust_limit_type::NONE;
      N1_begin = 0.0;
    }
  } else if (N1_begin >= 0.0) {
    if ((!rtb_y_mb) || (N1_begin > 35.0)) {
      rtb_type = athr_thrust_limit_type::TOGA;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    } else {
      rtb_type = athr_thrust_limit_type::FLEX;
      N1_begin = A380FadecComputer_U.in.input.thrust_limit_FLEX_percent;
    }
  } else if (N1_begin < 0.0) {
    rtb_type = athr_thrust_limit_type::REVERSE;
    N1_begin = A380FadecComputer_U.in.input.thrust_limit_REV_percent;
  } else {
    rtb_type = athr_thrust_limit_type::NONE;
    N1_begin = 0.0;
  }

  rtb_BusAssignment_e_data_computed_TLA_in_active_range = (A380FadecComputer_U.in.input.TLA_deg <=
    A380FadecComputer_P.CompareToConstant1_const);
  rtb_BusAssignment_e_prim_input_fg_n1_command_percent.SSM = rtb_n1_command_percent_SSM;
  rtb_BusAssignment_e_prim_input_fg_n1_command_percent.Data = rtb_n1_command_percent_Data;
  A380FadecComputer_MATLABFunction_g(&rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel4_bit, &rtb_y_a);
  A380FadecComputer_MATLABFunction_g(&rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel5_bit, &rtb_y_h);
  A380FadecComputer_MATLABFunction_g(&rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel_bit_g, &rtb_y_p);
  A380FadecComputer_MATLABFunction(&rtb_BusAssignment_e_prim_input_fg_n1_command_percent, &rtb_NOT1_f);
  rtb_AND = ((rtb_y_p != 0U) && rtb_NOT1_f);
  A380FadecComputer_MATLABFunction_f(rtb_AND, A380FadecComputer_P.PulseNode_isRisingEdge, &rtb_NOT1_f,
    &A380FadecComputer_DWork.sf_MATLABFunction_f);
  A380FadecComputer_MATLABFunction_g(&rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel1_bit, &rtb_y_p);
  rtb_y_p = (((A380FadecComputer_U.in.input.ATHR_disconnect || A380FadecComputer_DWork.Memory_PreviousInput || (rtb_y_p ==
    0U)) + (static_cast<uint32_T>(rtb_NOT1_f) << 1)) << 1) + A380FadecComputer_DWork.Memory_PreviousInput_p;
  A380FadecComputer_DWork.Memory_PreviousInput_p = A380FadecComputer_P.Logic_table_n[rtb_y_p];
  A380FadecComputer_MATLABFunction_f(A380FadecComputer_P.Logic_table_n[rtb_y_p + 8U],
    A380FadecComputer_P.PulseNode1_isRisingEdge, &rtb_NOT1_f, &A380FadecComputer_DWork.sf_MATLABFunction_b);
  rtb_y_o = (((A380FadecComputer_U.in.input.TLA_deg > 26.0) || (A380FadecComputer_U.in.input.TLA_deg < 24.0)) &&
             ((A380FadecComputer_U.in.input.TLA_deg > 36.0) || (A380FadecComputer_U.in.input.TLA_deg < 34.0)));
  A380FadecComputer_DWork.Memory_PreviousInput_j = A380FadecComputer_P.Logic_table_h[(((static_cast<uint32_T>(rtb_NOT1_f
    && (!rtb_y_o)) << 1) + (rtb_y_o || A380FadecComputer_DWork.Memory_PreviousInput_p)) << 1) +
    A380FadecComputer_DWork.Memory_PreviousInput_j];
  if (!A380FadecComputer_DWork.pU_not_empty) {
    A380FadecComputer_DWork.pU = A380FadecComputer_U.in.data.engine_N1_percent;
    A380FadecComputer_DWork.pU_not_empty = true;
  }

  if (!A380FadecComputer_DWork.Memory_PreviousInput_j) {
    A380FadecComputer_DWork.pU = A380FadecComputer_U.in.data.engine_N1_percent;
  }

  A380FadecComputer_MATLABFunction_p(&rtb_BusAssignment_e_prim_input_fg_n1_command_percent,
    A380FadecComputer_P.A429ValueOrDefault_defaultValue_a, &rtb_y_k);
  A380FadecComputer_MATLABFunction_g(&rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel3_bit, &rtb_y_p);
  rtb_NOT1_f = (rtb_BusAssignment_e_data_computed_TLA_in_active_range || (rtb_y_p != 0U));
  A380FadecComputer_MATLABFunction_g(&rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel2_bit, &rtb_y_p);
  if (rtb_NOT1_f && (rtb_y_p != 0U) && rtb_AND && A380FadecComputer_DWork.Memory_PreviousInput_p) {
    if ((rtb_y_a != 0U) && (rtb_y_h != 0U) && (!A380FadecComputer_U.in.data.on_ground)) {
      N1_end = A380FadecComputer_U.in.input.thrust_limit_TOGA_percent;
      rtb_Switch2_idx_1 = rtb_N1c;
    } else {
      N1_end = rtb_N1c;
      rtb_Switch2_idx_1 = A380FadecComputer_U.in.input.thrust_limit_IDLE_percent;
    }

    if (rtb_y_k > N1_end) {
      N1_end = static_cast<real32_T>(N1_end);
    } else if (rtb_y_k < rtb_Switch2_idx_1) {
      N1_end = static_cast<real32_T>(rtb_Switch2_idx_1);
    } else {
      N1_end = rtb_y_k;
    }
  } else if (A380FadecComputer_DWork.Memory_PreviousInput_j) {
    N1_end = A380FadecComputer_DWork.pU;
  } else {
    N1_end = rtb_N1c;
  }

  rtb_Switch2_idx_1 = N1_end;
  rtb_Sum = N1_end - A380FadecComputer_U.in.data.engine_N1_percent;
  if (std::abs(rtb_Sum) > 0.8) {
    A380FadecComputer_DWork.Delay_DSTATE = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
    rtb_Sum = 0.0;
  }

  A380FadecComputer_DWork.Delay_DSTATE += A380FadecComputer_P.Gain_Gain * rtb_Sum *
    A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_Gain * A380FadecComputer_U.in.time.dt;
  if (A380FadecComputer_DWork.Delay_DSTATE > A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    A380FadecComputer_DWork.Delay_DSTATE = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380FadecComputer_DWork.Delay_DSTATE < A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380FadecComputer_DWork.Delay_DSTATE = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  N1_end = (N1_end + A380FadecComputer_DWork.Delay_DSTATE) - A380FadecComputer_U.in.data.commanded_engine_N1_percent;
  if (rtb_inReverse) {
    A380FadecComputer_DWork.Delay_DSTATE_n = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition_p;
  }

  A380FadecComputer_DWork.Delay_DSTATE_n += A380FadecComputer_P.Gain_Gain_d * N1_end *
    A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_Gain_l * A380FadecComputer_U.in.time.dt;
  if (A380FadecComputer_DWork.Delay_DSTATE_n > A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit_l) {
    A380FadecComputer_DWork.Delay_DSTATE_n = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit_l;
  } else if (A380FadecComputer_DWork.Delay_DSTATE_n < A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit_d)
  {
    A380FadecComputer_DWork.Delay_DSTATE_n = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit_d;
  }

  rtb_NOT1_f = !rtb_inReverse;
  if (rtb_NOT1_f) {
    A380FadecComputer_DWork.Delay_DSTATE_l = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_InitialCondition;
  }

  A380FadecComputer_DWork.Delay_DSTATE_l += A380FadecComputer_P.Gain1_Gain * N1_end *
    A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_Gain * A380FadecComputer_U.in.time.dt;
  if (A380FadecComputer_DWork.Delay_DSTATE_l > A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_UpperLimit) {
    A380FadecComputer_DWork.Delay_DSTATE_l = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_UpperLimit;
  } else if (A380FadecComputer_DWork.Delay_DSTATE_l < A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_LowerLimit)
  {
    A380FadecComputer_DWork.Delay_DSTATE_l = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_LowerLimit;
  }

  A380FadecComputer_MATLABFunction_p(&A380FadecComputer_rtZbase_arinc_429,
    A380FadecComputer_P.A429ValueOrDefault_defaultValue_n, &rtb_y_k);
  rtb_VectorConcatenate[0] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[1] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[2] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[3] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[4] = (rtb_type == A380FadecComputer_P.EnumeratedConstant2_Value);
  rtb_VectorConcatenate[5] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[6] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[7] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[8] = A380FadecComputer_DWork.Memory_PreviousInput_p;
  rtb_VectorConcatenate[9] = A380FadecComputer_P.Constant_Value;
  A380FadecComputer_MATLABFunction_g(&rtb_BusAssignment_o_prim_input_fg_ats_discrete_word,
    A380FadecComputer_P.BitfromLabel5_bit_h, &rtb_y_p);
  rtb_VectorConcatenate[10] = (rtb_y_p != 0U);
  rtb_VectorConcatenate[11] = (rtb_type == athr_thrust_limit_type::TOGA);
  rtb_VectorConcatenate[12] = (rtb_type == athr_thrust_limit_type::FLEX);
  rtb_VectorConcatenate[13] = (rtb_type == athr_thrust_limit_type::MCT);
  rtb_VectorConcatenate[14] = (rtb_type == athr_thrust_limit_type::CLB);
  rtb_VectorConcatenate[15] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[16] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[17] = A380FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[18] = A380FadecComputer_P.Constant_Value;
  A380FadecComputer_MATLABFunction_l(rtb_VectorConcatenate,
    &A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_3.Data);
  A380FadecComputer_Y.out.fadec_bus_output.ecu_maintenance_word_6.Data = static_cast<real32_T>
    (A380FadecComputer_U.in.data.engine_N1_percent);
  rtb_VectorConcatenate[0] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[1] = A380FadecComputer_DWork.Memory_PreviousInput_j;
  rtb_VectorConcatenate[2] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[3] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[4] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[5] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[6] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[7] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[8] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[9] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[10] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[11] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[12] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[13] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[14] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[15] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[16] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[17] = A380FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[18] = A380FadecComputer_P.Constant3_Value;
  A380FadecComputer_MATLABFunction_l(rtb_VectorConcatenate,
    &A380FadecComputer_Y.out.fadec_bus_output.ecu_maintenance_word_6.Data);
  A380FadecComputer_Y.out.time = A380FadecComputer_U.in.time;
  A380FadecComputer_Y.out.data = A380FadecComputer_U.in.data;
  A380FadecComputer_Y.out.data_computed.TLA_in_active_range = rtb_BusAssignment_e_data_computed_TLA_in_active_range;
  A380FadecComputer_Y.out.data_computed.is_FLX_active = rtb_y_mb;
  A380FadecComputer_Y.out.data_computed.ATHR_disabled = A380FadecComputer_DWork.Memory_PreviousInput;
  A380FadecComputer_Y.out.data_computed.time_since_touchdown = rtb_Switch;
  A380FadecComputer_Y.out.input = A380FadecComputer_U.in.input;
  if (A380FadecComputer_P.Switch_1_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_inboard_aileron_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_1_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_inboard_aileron_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_inboard_aileron_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_2_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_inboard_aileron_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_2_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_inboard_aileron_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_inboard_aileron_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_3_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_inboard_aileron_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_3_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_inboard_aileron_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_inboard_aileron_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_4_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_inboard_aileron_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_4_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_inboard_aileron_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_inboard_aileron_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_5_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_midboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_midboard_aileron_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_5_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_midboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_midboard_aileron_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_midboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_midboard_aileron_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_6_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_midboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_midboard_aileron_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_6_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_midboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_midboard_aileron_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_midboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_midboard_aileron_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_7_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_midboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_midboard_aileron_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_7_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_midboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_midboard_aileron_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_midboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_midboard_aileron_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_8_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_midboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_midboard_aileron_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_8_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_midboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_midboard_aileron_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_midboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_midboard_aileron_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_9_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_outboard_aileron_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_9_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_outboard_aileron_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_outboard_aileron_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_10_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_outboard_aileron_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_10_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_outboard_aileron_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_outboard_aileron_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_11_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_outboard_aileron_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_11_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_outboard_aileron_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_aileron_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_outboard_aileron_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_12_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_outboard_aileron_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_12_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_outboard_aileron_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_aileron_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_outboard_aileron_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_13_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_1_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_1_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_13_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_1_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_1_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_1_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_1_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_14_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_1_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_1_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_14_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_1_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_1_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_1_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_1_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_15_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_1_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_1_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_15_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_1_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_1_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_1_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_1_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_16_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_1_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_1_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_16_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_1_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_1_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_1_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_1_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_17_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_2_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_2_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_17_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_2_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_2_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_2_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_2_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_18_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_2_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_2_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_18_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_2_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_2_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_2_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_2_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_19_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_2_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_2_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_19_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_2_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_2_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_2_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_2_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_20_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_2_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_2_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_20_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_2_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_2_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_2_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_2_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_21_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_3_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_3_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_21_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_3_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_3_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_3_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_3_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_22_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_3_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_3_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_22_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_3_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_3_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_3_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_3_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_23_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_3_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_3_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_23_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_3_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_3_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_3_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_3_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_24_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_3_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_3_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_24_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_3_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_3_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_3_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_3_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_25_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_4_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_4_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_25_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_4_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_4_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_4_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_4_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_26_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_4_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_4_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_26_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_4_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_4_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_4_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_4_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_27_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_4_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_4_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_27_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_4_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_4_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_4_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_4_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_28_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_4_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_4_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_28_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_4_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_4_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_4_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_4_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_29_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_5_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_5_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_29_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_5_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_5_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_5_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_5_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_30_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_5_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_5_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_30_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_5_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_5_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_5_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_5_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_31_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_5_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_5_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_31_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_5_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_5_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_5_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_5_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_32_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_5_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_5_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_32_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_5_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_5_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_5_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_5_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_33_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_6_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_6_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_33_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_6_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_6_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_6_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_6_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_34_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_6_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_6_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_34_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_6_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_6_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_6_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_6_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_35_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_6_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_6_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_35_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_6_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_6_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_6_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_6_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_36_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_6_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_6_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_36_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_6_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_6_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_6_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_6_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_37_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_7_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_7_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_37_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_7_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_7_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_7_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_7_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_38_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_7_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_7_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_38_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_7_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_7_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_7_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_7_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_39_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_7_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_7_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_39_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_7_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_7_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_7_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_7_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_40_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_7_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_7_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_40_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_7_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_7_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_7_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_7_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_41_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_8_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_8_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_41_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_8_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_8_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_8_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_8_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_42_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_8_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_8_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_42_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_8_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_8_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_8_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_8_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_43_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_8_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_8_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_43_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_8_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_8_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_8_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_8_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_44_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_8_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_8_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_44_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_8_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_8_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_8_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_8_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_45_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_inboard_elevator_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_45_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_inboard_elevator_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_inboard_elevator_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_46_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_inboard_elevator_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_46_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_inboard_elevator_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_inboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_inboard_elevator_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_47_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_inboard_elevator_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_47_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_inboard_elevator_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_inboard_elevator_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_48_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_inboard_elevator_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_48_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_inboard_elevator_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_inboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_inboard_elevator_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_49_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_outboard_elevator_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_49_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_outboard_elevator_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_outboard_elevator_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_50_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_outboard_elevator_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_50_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_outboard_elevator_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_outboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_outboard_elevator_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_51_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_outboard_elevator_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_51_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_outboard_elevator_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_elevator_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_outboard_elevator_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_52_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_outboard_elevator_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_52_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_outboard_elevator_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_outboard_elevator_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_outboard_elevator_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_53_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.ths_command_deg.SSM = A380FadecComputer_U.in.prim_1.fctl.ths_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_53_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.ths_command_deg.SSM = A380FadecComputer_U.in.prim_2.fctl.ths_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.ths_command_deg.SSM = A380FadecComputer_U.in.prim_3.fctl.ths_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_54_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.ths_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.ths_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_54_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.ths_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.ths_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.ths_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.ths_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_55_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.upper_rudder_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.upper_rudder_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_55_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.upper_rudder_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.upper_rudder_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.upper_rudder_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.upper_rudder_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_56_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.upper_rudder_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.upper_rudder_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_56_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.upper_rudder_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.upper_rudder_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.upper_rudder_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.upper_rudder_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_57_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.lower_rudder_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.lower_rudder_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_57_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.lower_rudder_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.lower_rudder_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.lower_rudder_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.lower_rudder_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_58_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.lower_rudder_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.lower_rudder_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_58_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.lower_rudder_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.lower_rudder_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.lower_rudder_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.lower_rudder_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_59_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_pitch_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_sidestick_pitch_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_59_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_pitch_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_sidestick_pitch_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_pitch_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_sidestick_pitch_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_60_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_pitch_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_sidestick_pitch_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_60_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_pitch_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_sidestick_pitch_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_pitch_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_sidestick_pitch_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_61_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_pitch_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_sidestick_pitch_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_61_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_pitch_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_sidestick_pitch_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_pitch_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_sidestick_pitch_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_62_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_pitch_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_sidestick_pitch_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_62_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_pitch_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_sidestick_pitch_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_pitch_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_sidestick_pitch_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_63_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_roll_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_sidestick_roll_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_63_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_roll_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_sidestick_roll_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_roll_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_sidestick_roll_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_64_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_roll_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_sidestick_roll_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_64_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_roll_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_sidestick_roll_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_sidestick_roll_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_sidestick_roll_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_65_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_roll_command_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_sidestick_roll_command_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_65_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_roll_command_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_sidestick_roll_command_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_roll_command_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_sidestick_roll_command_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_66_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_roll_command_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_sidestick_roll_command_deg.Data;
  } else if (A380FadecComputer_P.Switch1_66_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_roll_command_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_sidestick_roll_command_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_sidestick_roll_command_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_sidestick_roll_command_deg.Data;
  }

  if (A380FadecComputer_P.Switch_67_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_pedal_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.rudder_pedal_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_67_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_pedal_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.rudder_pedal_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_pedal_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.rudder_pedal_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_68_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_pedal_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.rudder_pedal_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_68_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_pedal_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.rudder_pedal_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_pedal_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.rudder_pedal_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_69_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.aileron_status_word.SSM =
      A380FadecComputer_U.in.prim_1.fctl.aileron_status_word.SSM;
  } else if (A380FadecComputer_P.Switch1_69_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.aileron_status_word.SSM =
      A380FadecComputer_U.in.prim_2.fctl.aileron_status_word.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.aileron_status_word.SSM =
      A380FadecComputer_U.in.prim_3.fctl.aileron_status_word.SSM;
  }

  if (A380FadecComputer_P.Switch_70_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.aileron_status_word.Data =
      A380FadecComputer_U.in.prim_1.fctl.aileron_status_word.Data;
  } else if (A380FadecComputer_P.Switch1_70_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.aileron_status_word.Data =
      A380FadecComputer_U.in.prim_2.fctl.aileron_status_word.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.aileron_status_word.Data =
      A380FadecComputer_U.in.prim_3.fctl.aileron_status_word.Data;
  }

  if (A380FadecComputer_P.Switch_71_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_aileron_1_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_71_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_aileron_1_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_aileron_1_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_72_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_1_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_aileron_1_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_72_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_1_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_aileron_1_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_1_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_aileron_1_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_73_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_aileron_2_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_73_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_aileron_2_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_aileron_2_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_74_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_2_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_aileron_2_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_74_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_2_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_aileron_2_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_aileron_2_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_aileron_2_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_75_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_aileron_1_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_75_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_aileron_1_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_aileron_1_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_76_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_1_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_aileron_1_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_76_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_1_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_aileron_1_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_1_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_aileron_1_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_77_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_aileron_2_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_77_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_aileron_2_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_aileron_2_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_78_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_2_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_aileron_2_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_78_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_2_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_aileron_2_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_aileron_2_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_aileron_2_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_79_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.spoiler_status_word.SSM =
      A380FadecComputer_U.in.prim_1.fctl.spoiler_status_word.SSM;
  } else if (A380FadecComputer_P.Switch1_79_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.spoiler_status_word.SSM =
      A380FadecComputer_U.in.prim_2.fctl.spoiler_status_word.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.spoiler_status_word.SSM =
      A380FadecComputer_U.in.prim_3.fctl.spoiler_status_word.SSM;
  }

  if (A380FadecComputer_P.Switch_80_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.spoiler_status_word.Data =
      A380FadecComputer_U.in.prim_1.fctl.spoiler_status_word.Data;
  } else if (A380FadecComputer_P.Switch1_80_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.spoiler_status_word.Data =
      A380FadecComputer_U.in.prim_2.fctl.spoiler_status_word.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.spoiler_status_word.Data =
      A380FadecComputer_U.in.prim_3.fctl.spoiler_status_word.Data;
  }

  if (A380FadecComputer_P.Switch_81_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_81_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_82_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.left_spoiler_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_82_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.left_spoiler_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.left_spoiler_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.left_spoiler_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_83_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_83_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_84_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.right_spoiler_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_84_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.right_spoiler_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.right_spoiler_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.right_spoiler_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_85_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_status_word.SSM =
      A380FadecComputer_U.in.prim_1.fctl.elevator_status_word.SSM;
  } else if (A380FadecComputer_P.Switch1_85_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_status_word.SSM =
      A380FadecComputer_U.in.prim_2.fctl.elevator_status_word.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_status_word.SSM =
      A380FadecComputer_U.in.prim_3.fctl.elevator_status_word.SSM;
  }

  if (A380FadecComputer_P.Switch_86_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_status_word.Data =
      A380FadecComputer_U.in.prim_1.fctl.elevator_status_word.Data;
  } else if (A380FadecComputer_P.Switch1_86_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_status_word.Data =
      A380FadecComputer_U.in.prim_2.fctl.elevator_status_word.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_status_word.Data =
      A380FadecComputer_U.in.prim_3.fctl.elevator_status_word.Data;
  }

  if (A380FadecComputer_P.Switch_87_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.elevator_1_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_87_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.elevator_1_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.elevator_1_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_88_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_1_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.elevator_1_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_88_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_1_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.elevator_1_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_1_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.elevator_1_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_89_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.elevator_2_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_89_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.elevator_2_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.elevator_2_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_90_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_2_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.elevator_2_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_90_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_2_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.elevator_2_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_2_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.elevator_2_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_91_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_3_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.elevator_3_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_91_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_3_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.elevator_3_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_3_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.elevator_3_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_92_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_3_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.elevator_3_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_92_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_3_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.elevator_3_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.elevator_3_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.elevator_3_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_93_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.ths_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.ths_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_93_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.ths_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.ths_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.ths_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.ths_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_94_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.ths_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.ths_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_94_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.ths_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.ths_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.ths_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.ths_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_95_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_status_word.SSM =
      A380FadecComputer_U.in.prim_1.fctl.rudder_status_word.SSM;
  } else if (A380FadecComputer_P.Switch1_95_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_status_word.SSM =
      A380FadecComputer_U.in.prim_2.fctl.rudder_status_word.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_status_word.SSM =
      A380FadecComputer_U.in.prim_3.fctl.rudder_status_word.SSM;
  }

  if (A380FadecComputer_P.Switch_96_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_status_word.Data =
      A380FadecComputer_U.in.prim_1.fctl.rudder_status_word.Data;
  } else if (A380FadecComputer_P.Switch1_96_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_status_word.Data =
      A380FadecComputer_U.in.prim_2.fctl.rudder_status_word.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_status_word.Data =
      A380FadecComputer_U.in.prim_3.fctl.rudder_status_word.Data;
  }

  if (A380FadecComputer_P.Switch_97_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.rudder_1_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_97_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.rudder_1_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_1_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.rudder_1_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_98_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_1_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.rudder_1_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_98_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_1_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.rudder_1_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_1_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.rudder_1_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_99_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_1.fctl.rudder_2_position_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_99_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_2.fctl.rudder_2_position_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_2_position_deg.SSM =
      A380FadecComputer_U.in.prim_3.fctl.rudder_2_position_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_100_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_2_position_deg.Data =
      A380FadecComputer_U.in.prim_1.fctl.rudder_2_position_deg.Data;
  } else if (A380FadecComputer_P.Switch1_100_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_2_position_deg.Data =
      A380FadecComputer_U.in.prim_2.fctl.rudder_2_position_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.rudder_2_position_deg.Data =
      A380FadecComputer_U.in.prim_3.fctl.rudder_2_position_deg.Data;
  }

  if (A380FadecComputer_P.Switch_101_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_1_ft.SSM =
      A380FadecComputer_U.in.prim_1.fctl.radio_height_1_ft.SSM;
  } else if (A380FadecComputer_P.Switch1_101_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_1_ft.SSM =
      A380FadecComputer_U.in.prim_2.fctl.radio_height_1_ft.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_1_ft.SSM =
      A380FadecComputer_U.in.prim_3.fctl.radio_height_1_ft.SSM;
  }

  if (A380FadecComputer_P.Switch_102_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_1_ft.Data =
      A380FadecComputer_U.in.prim_1.fctl.radio_height_1_ft.Data;
  } else if (A380FadecComputer_P.Switch1_102_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_1_ft.Data =
      A380FadecComputer_U.in.prim_2.fctl.radio_height_1_ft.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_1_ft.Data =
      A380FadecComputer_U.in.prim_3.fctl.radio_height_1_ft.Data;
  }

  if (A380FadecComputer_P.Switch_103_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_2_ft.SSM =
      A380FadecComputer_U.in.prim_1.fctl.radio_height_2_ft.SSM;
  } else if (A380FadecComputer_P.Switch1_103_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_2_ft.SSM =
      A380FadecComputer_U.in.prim_2.fctl.radio_height_2_ft.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_2_ft.SSM =
      A380FadecComputer_U.in.prim_3.fctl.radio_height_2_ft.SSM;
  }

  if (A380FadecComputer_P.Switch_104_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_2_ft.Data =
      A380FadecComputer_U.in.prim_1.fctl.radio_height_2_ft.Data;
  } else if (A380FadecComputer_P.Switch1_104_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_2_ft.Data =
      A380FadecComputer_U.in.prim_2.fctl.radio_height_2_ft.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.radio_height_2_ft.Data =
      A380FadecComputer_U.in.prim_3.fctl.radio_height_2_ft.Data;
  }

  if (A380FadecComputer_P.Switch_105_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.fctl_law_status_word.SSM =
      A380FadecComputer_U.in.prim_1.fctl.fctl_law_status_word.SSM;
  } else if (A380FadecComputer_P.Switch1_105_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.fctl_law_status_word.SSM =
      A380FadecComputer_U.in.prim_2.fctl.fctl_law_status_word.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.fctl_law_status_word.SSM =
      A380FadecComputer_U.in.prim_3.fctl.fctl_law_status_word.SSM;
  }

  if (A380FadecComputer_P.Switch_106_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.fctl_law_status_word.Data =
      A380FadecComputer_U.in.prim_1.fctl.fctl_law_status_word.Data;
  } else if (A380FadecComputer_P.Switch1_106_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.fctl_law_status_word.Data =
      A380FadecComputer_U.in.prim_2.fctl.fctl_law_status_word.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.fctl_law_status_word.Data =
      A380FadecComputer_U.in.prim_3.fctl.fctl_law_status_word.Data;
  }

  if (A380FadecComputer_P.Switch_107_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.discrete_status_word_1.SSM =
      A380FadecComputer_U.in.prim_1.fctl.discrete_status_word_1.SSM;
  } else if (A380FadecComputer_P.Switch1_107_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.discrete_status_word_1.SSM =
      A380FadecComputer_U.in.prim_2.fctl.discrete_status_word_1.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.discrete_status_word_1.SSM =
      A380FadecComputer_U.in.prim_3.fctl.discrete_status_word_1.SSM;
  }

  if (A380FadecComputer_P.Switch_108_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.discrete_status_word_1.Data =
      A380FadecComputer_U.in.prim_1.fctl.discrete_status_word_1.Data;
  } else if (A380FadecComputer_P.Switch1_108_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.discrete_status_word_1.Data =
      A380FadecComputer_U.in.prim_2.fctl.discrete_status_word_1.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.discrete_status_word_1.Data =
      A380FadecComputer_U.in.prim_3.fctl.discrete_status_word_1.Data;
  }

  if (A380FadecComputer_P.Switch_109_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_lim_kn.SSM = A380FadecComputer_U.in.prim_1.fctl.v_alpha_lim_kn.SSM;
  } else if (A380FadecComputer_P.Switch1_109_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_lim_kn.SSM = A380FadecComputer_U.in.prim_2.fctl.v_alpha_lim_kn.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_lim_kn.SSM = A380FadecComputer_U.in.prim_3.fctl.v_alpha_lim_kn.SSM;
  }

  if (A380FadecComputer_P.Switch_110_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_lim_kn.Data = A380FadecComputer_U.in.prim_1.fctl.v_alpha_lim_kn.Data;
  } else if (A380FadecComputer_P.Switch1_110_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_lim_kn.Data = A380FadecComputer_U.in.prim_2.fctl.v_alpha_lim_kn.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_lim_kn.Data = A380FadecComputer_U.in.prim_3.fctl.v_alpha_lim_kn.Data;
  }

  if (A380FadecComputer_P.Switch_111_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_prot_kn.SSM = A380FadecComputer_U.in.prim_1.fctl.v_alpha_prot_kn.SSM;
  } else if (A380FadecComputer_P.Switch1_111_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_prot_kn.SSM = A380FadecComputer_U.in.prim_2.fctl.v_alpha_prot_kn.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_prot_kn.SSM = A380FadecComputer_U.in.prim_3.fctl.v_alpha_prot_kn.SSM;
  }

  if (A380FadecComputer_P.Switch_112_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_prot_kn.Data =
      A380FadecComputer_U.in.prim_1.fctl.v_alpha_prot_kn.Data;
  } else if (A380FadecComputer_P.Switch1_112_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_prot_kn.Data =
      A380FadecComputer_U.in.prim_2.fctl.v_alpha_prot_kn.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_prot_kn.Data =
      A380FadecComputer_U.in.prim_3.fctl.v_alpha_prot_kn.Data;
  }

  if (A380FadecComputer_P.Switch_113_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_stall_warn_kn.SSM =
      A380FadecComputer_U.in.prim_1.fctl.v_alpha_stall_warn_kn.SSM;
  } else if (A380FadecComputer_P.Switch1_113_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_stall_warn_kn.SSM =
      A380FadecComputer_U.in.prim_2.fctl.v_alpha_stall_warn_kn.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_stall_warn_kn.SSM =
      A380FadecComputer_U.in.prim_3.fctl.v_alpha_stall_warn_kn.SSM;
  }

  if (A380FadecComputer_P.Switch_114_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_stall_warn_kn.Data =
      A380FadecComputer_U.in.prim_1.fctl.v_alpha_stall_warn_kn.Data;
  } else if (A380FadecComputer_P.Switch1_114_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_stall_warn_kn.Data =
      A380FadecComputer_U.in.prim_2.fctl.v_alpha_stall_warn_kn.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fctl.v_alpha_stall_warn_kn.Data =
      A380FadecComputer_U.in.prim_3.fctl.v_alpha_stall_warn_kn.Data;
  }

  if (A380FadecComputer_P.Switch_115_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.gamma_a_deg.SSM = A380FadecComputer_U.in.prim_1.fe.gamma_a_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_115_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.gamma_a_deg.SSM = A380FadecComputer_U.in.prim_2.fe.gamma_a_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.gamma_a_deg.SSM = A380FadecComputer_U.in.prim_3.fe.gamma_a_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_116_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.gamma_a_deg.Data = A380FadecComputer_U.in.prim_1.fe.gamma_a_deg.Data;
  } else if (A380FadecComputer_P.Switch1_116_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.gamma_a_deg.Data = A380FadecComputer_U.in.prim_2.fe.gamma_a_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.gamma_a_deg.Data = A380FadecComputer_U.in.prim_3.fe.gamma_a_deg.Data;
  }

  if (A380FadecComputer_P.Switch_117_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.gamma_t_deg.SSM = A380FadecComputer_U.in.prim_1.fe.gamma_t_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_117_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.gamma_t_deg.SSM = A380FadecComputer_U.in.prim_2.fe.gamma_t_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.gamma_t_deg.SSM = A380FadecComputer_U.in.prim_3.fe.gamma_t_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_118_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.gamma_t_deg.Data = A380FadecComputer_U.in.prim_1.fe.gamma_t_deg.Data;
  } else if (A380FadecComputer_P.Switch1_118_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.gamma_t_deg.Data = A380FadecComputer_U.in.prim_2.fe.gamma_t_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.gamma_t_deg.Data = A380FadecComputer_U.in.prim_3.fe.gamma_t_deg.Data;
  }

  if (A380FadecComputer_P.Switch_119_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.sideslip_target_deg.SSM =
      A380FadecComputer_U.in.prim_1.fe.sideslip_target_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_119_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.sideslip_target_deg.SSM =
      A380FadecComputer_U.in.prim_2.fe.sideslip_target_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.sideslip_target_deg.SSM =
      A380FadecComputer_U.in.prim_3.fe.sideslip_target_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_120_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.sideslip_target_deg.Data =
      A380FadecComputer_U.in.prim_1.fe.sideslip_target_deg.Data;
  } else if (A380FadecComputer_P.Switch1_120_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.sideslip_target_deg.Data =
      A380FadecComputer_U.in.prim_2.fe.sideslip_target_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.sideslip_target_deg.Data =
      A380FadecComputer_U.in.prim_3.fe.sideslip_target_deg.Data;
  }

  if (A380FadecComputer_P.Switch_121_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_ls_kn.SSM = A380FadecComputer_U.in.prim_1.fe.v_ls_kn.SSM;
  } else if (A380FadecComputer_P.Switch1_121_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_ls_kn.SSM = A380FadecComputer_U.in.prim_2.fe.v_ls_kn.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_ls_kn.SSM = A380FadecComputer_U.in.prim_3.fe.v_ls_kn.SSM;
  }

  if (A380FadecComputer_P.Switch_122_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_ls_kn.Data = A380FadecComputer_U.in.prim_1.fe.v_ls_kn.Data;
  } else if (A380FadecComputer_P.Switch1_122_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_ls_kn.Data = A380FadecComputer_U.in.prim_2.fe.v_ls_kn.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_ls_kn.Data = A380FadecComputer_U.in.prim_3.fe.v_ls_kn.Data;
  }

  if (A380FadecComputer_P.Switch_123_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_stall_kn.SSM = A380FadecComputer_U.in.prim_1.fe.v_stall_kn.SSM;
  } else if (A380FadecComputer_P.Switch1_123_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_stall_kn.SSM = A380FadecComputer_U.in.prim_2.fe.v_stall_kn.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_stall_kn.SSM = A380FadecComputer_U.in.prim_3.fe.v_stall_kn.SSM;
  }

  if (A380FadecComputer_P.Switch_124_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_stall_kn.Data = A380FadecComputer_U.in.prim_1.fe.v_stall_kn.Data;
  } else if (A380FadecComputer_P.Switch1_124_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_stall_kn.Data = A380FadecComputer_U.in.prim_2.fe.v_stall_kn.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_stall_kn.Data = A380FadecComputer_U.in.prim_3.fe.v_stall_kn.Data;
  }

  if (A380FadecComputer_P.Switch_125_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.speed_trend_kn.SSM = A380FadecComputer_U.in.prim_1.fe.speed_trend_kn.SSM;
  } else if (A380FadecComputer_P.Switch1_125_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.speed_trend_kn.SSM = A380FadecComputer_U.in.prim_2.fe.speed_trend_kn.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.speed_trend_kn.SSM = A380FadecComputer_U.in.prim_3.fe.speed_trend_kn.SSM;
  }

  if (A380FadecComputer_P.Switch_126_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.speed_trend_kn.Data = A380FadecComputer_U.in.prim_1.fe.speed_trend_kn.Data;
  } else if (A380FadecComputer_P.Switch1_126_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.speed_trend_kn.Data = A380FadecComputer_U.in.prim_2.fe.speed_trend_kn.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.speed_trend_kn.Data = A380FadecComputer_U.in.prim_3.fe.speed_trend_kn.Data;
  }

  if (A380FadecComputer_P.Switch_127_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_3_kn.SSM = A380FadecComputer_U.in.prim_1.fe.v_3_kn.SSM;
  } else if (A380FadecComputer_P.Switch1_127_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_3_kn.SSM = A380FadecComputer_U.in.prim_2.fe.v_3_kn.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_3_kn.SSM = A380FadecComputer_U.in.prim_3.fe.v_3_kn.SSM;
  }

  if (A380FadecComputer_P.Switch_128_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_3_kn.Data = A380FadecComputer_U.in.prim_1.fe.v_3_kn.Data;
  } else if (A380FadecComputer_P.Switch1_128_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_3_kn.Data = A380FadecComputer_U.in.prim_2.fe.v_3_kn.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_3_kn.Data = A380FadecComputer_U.in.prim_3.fe.v_3_kn.Data;
  }

  if (A380FadecComputer_P.Switch_129_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_4_kn.SSM = A380FadecComputer_U.in.prim_1.fe.v_4_kn.SSM;
  } else if (A380FadecComputer_P.Switch1_129_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_4_kn.SSM = A380FadecComputer_U.in.prim_2.fe.v_4_kn.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_4_kn.SSM = A380FadecComputer_U.in.prim_3.fe.v_4_kn.SSM;
  }

  if (A380FadecComputer_P.Switch_130_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_4_kn.Data = A380FadecComputer_U.in.prim_1.fe.v_4_kn.Data;
  } else if (A380FadecComputer_P.Switch1_130_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_4_kn.Data = A380FadecComputer_U.in.prim_2.fe.v_4_kn.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_4_kn.Data = A380FadecComputer_U.in.prim_3.fe.v_4_kn.Data;
  }

  if (A380FadecComputer_P.Switch_131_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_man_kn.SSM = A380FadecComputer_U.in.prim_1.fe.v_man_kn.SSM;
  } else if (A380FadecComputer_P.Switch1_131_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_man_kn.SSM = A380FadecComputer_U.in.prim_2.fe.v_man_kn.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_man_kn.SSM = A380FadecComputer_U.in.prim_3.fe.v_man_kn.SSM;
  }

  if (A380FadecComputer_P.Switch_132_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_man_kn.Data = A380FadecComputer_U.in.prim_1.fe.v_man_kn.Data;
  } else if (A380FadecComputer_P.Switch1_132_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_man_kn.Data = A380FadecComputer_U.in.prim_2.fe.v_man_kn.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_man_kn.Data = A380FadecComputer_U.in.prim_3.fe.v_man_kn.Data;
  }

  if (A380FadecComputer_P.Switch_133_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_max_kn.SSM = A380FadecComputer_U.in.prim_1.fe.v_max_kn.SSM;
  } else if (A380FadecComputer_P.Switch1_133_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_max_kn.SSM = A380FadecComputer_U.in.prim_2.fe.v_max_kn.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_max_kn.SSM = A380FadecComputer_U.in.prim_3.fe.v_max_kn.SSM;
  }

  if (A380FadecComputer_P.Switch_134_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_max_kn.Data = A380FadecComputer_U.in.prim_1.fe.v_max_kn.Data;
  } else if (A380FadecComputer_P.Switch1_134_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_max_kn.Data = A380FadecComputer_U.in.prim_2.fe.v_max_kn.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_max_kn.Data = A380FadecComputer_U.in.prim_3.fe.v_max_kn.Data;
  }

  if (A380FadecComputer_P.Switch_135_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_fe_next_kn.SSM = A380FadecComputer_U.in.prim_1.fe.v_fe_next_kn.SSM;
  } else if (A380FadecComputer_P.Switch1_135_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_fe_next_kn.SSM = A380FadecComputer_U.in.prim_2.fe.v_fe_next_kn.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_fe_next_kn.SSM = A380FadecComputer_U.in.prim_3.fe.v_fe_next_kn.SSM;
  }

  if (A380FadecComputer_P.Switch_136_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_fe_next_kn.Data = A380FadecComputer_U.in.prim_1.fe.v_fe_next_kn.Data;
  } else if (A380FadecComputer_P.Switch1_136_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.v_fe_next_kn.Data = A380FadecComputer_U.in.prim_2.fe.v_fe_next_kn.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.v_fe_next_kn.Data = A380FadecComputer_U.in.prim_3.fe.v_fe_next_kn.Data;
  }

  if (A380FadecComputer_P.Switch_137_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.discrete_word_1.SSM = A380FadecComputer_U.in.prim_1.fe.discrete_word_1.SSM;
  } else if (A380FadecComputer_P.Switch1_137_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.discrete_word_1.SSM = A380FadecComputer_U.in.prim_2.fe.discrete_word_1.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.discrete_word_1.SSM = A380FadecComputer_U.in.prim_3.fe.discrete_word_1.SSM;
  }

  if (A380FadecComputer_P.Switch_138_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.discrete_word_1.Data = A380FadecComputer_U.in.prim_1.fe.discrete_word_1.Data;
  } else if (A380FadecComputer_P.Switch1_138_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fe.discrete_word_1.Data = A380FadecComputer_U.in.prim_2.fe.discrete_word_1.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fe.discrete_word_1.Data = A380FadecComputer_U.in.prim_3.fe.discrete_word_1.Data;
  }

  if (A380FadecComputer_P.Switch_139_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pfd_spd_tgt_kts.SSM = A380FadecComputer_U.in.prim_1.fg.pfd_spd_tgt_kts.SSM;
  } else if (A380FadecComputer_P.Switch1_139_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pfd_spd_tgt_kts.SSM = A380FadecComputer_U.in.prim_2.fg.pfd_spd_tgt_kts.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.pfd_spd_tgt_kts.SSM = A380FadecComputer_U.in.prim_3.fg.pfd_spd_tgt_kts.SSM;
  }

  if (A380FadecComputer_P.Switch_140_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pfd_spd_tgt_kts.Data = A380FadecComputer_U.in.prim_1.fg.pfd_spd_tgt_kts.Data;
  } else if (A380FadecComputer_P.Switch1_140_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pfd_spd_tgt_kts.Data = A380FadecComputer_U.in.prim_2.fg.pfd_spd_tgt_kts.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.pfd_spd_tgt_kts.Data = A380FadecComputer_U.in.prim_3.fg.pfd_spd_tgt_kts.Data;
  }

  if (A380FadecComputer_P.Switch_141_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pfd_short_term_mngd_spd_kts.SSM =
      A380FadecComputer_U.in.prim_1.fg.pfd_short_term_mngd_spd_kts.SSM;
  } else if (A380FadecComputer_P.Switch1_141_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pfd_short_term_mngd_spd_kts.SSM =
      A380FadecComputer_U.in.prim_2.fg.pfd_short_term_mngd_spd_kts.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.pfd_short_term_mngd_spd_kts.SSM =
      A380FadecComputer_U.in.prim_3.fg.pfd_short_term_mngd_spd_kts.SSM;
  }

  if (A380FadecComputer_P.Switch_142_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pfd_short_term_mngd_spd_kts.Data =
      A380FadecComputer_U.in.prim_1.fg.pfd_short_term_mngd_spd_kts.Data;
  } else if (A380FadecComputer_P.Switch1_142_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pfd_short_term_mngd_spd_kts.Data =
      A380FadecComputer_U.in.prim_2.fg.pfd_short_term_mngd_spd_kts.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.pfd_short_term_mngd_spd_kts.Data =
      A380FadecComputer_U.in.prim_3.fg.pfd_short_term_mngd_spd_kts.Data;
  }

  if (A380FadecComputer_P.Switch_143_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_spd_kts.SSM = A380FadecComputer_U.in.prim_1.fg.selected_spd_kts.SSM;
  } else if (A380FadecComputer_P.Switch1_143_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_spd_kts.SSM = A380FadecComputer_U.in.prim_2.fg.selected_spd_kts.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_spd_kts.SSM = A380FadecComputer_U.in.prim_3.fg.selected_spd_kts.SSM;
  }

  if (A380FadecComputer_P.Switch_144_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_spd_kts.Data = A380FadecComputer_U.in.prim_1.fg.selected_spd_kts.Data;
  } else if (A380FadecComputer_P.Switch1_144_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_spd_kts.Data = A380FadecComputer_U.in.prim_2.fg.selected_spd_kts.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_spd_kts.Data = A380FadecComputer_U.in.prim_3.fg.selected_spd_kts.Data;
  }

  if (A380FadecComputer_P.Switch_145_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_mach_kts.SSM = A380FadecComputer_U.in.prim_1.fg.selected_mach_kts.SSM;
  } else if (A380FadecComputer_P.Switch1_145_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_mach_kts.SSM = A380FadecComputer_U.in.prim_2.fg.selected_mach_kts.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_mach_kts.SSM = A380FadecComputer_U.in.prim_3.fg.selected_mach_kts.SSM;
  }

  if (A380FadecComputer_P.Switch_146_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_mach_kts.Data =
      A380FadecComputer_U.in.prim_1.fg.selected_mach_kts.Data;
  } else if (A380FadecComputer_P.Switch1_146_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_mach_kts.Data =
      A380FadecComputer_U.in.prim_2.fg.selected_mach_kts.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_mach_kts.Data =
      A380FadecComputer_U.in.prim_3.fg.selected_mach_kts.Data;
  }

  if (A380FadecComputer_P.Switch_147_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_hdg_deg.SSM = A380FadecComputer_U.in.prim_1.fg.selected_hdg_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_147_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_hdg_deg.SSM = A380FadecComputer_U.in.prim_2.fg.selected_hdg_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_hdg_deg.SSM = A380FadecComputer_U.in.prim_3.fg.selected_hdg_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_148_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_hdg_deg.Data = A380FadecComputer_U.in.prim_1.fg.selected_hdg_deg.Data;
  } else if (A380FadecComputer_P.Switch1_148_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_hdg_deg.Data = A380FadecComputer_U.in.prim_2.fg.selected_hdg_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_hdg_deg.Data = A380FadecComputer_U.in.prim_3.fg.selected_hdg_deg.Data;
  }

  if (A380FadecComputer_P.Switch_149_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_trk_deg.SSM = A380FadecComputer_U.in.prim_1.fg.selected_trk_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_149_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_trk_deg.SSM = A380FadecComputer_U.in.prim_2.fg.selected_trk_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_trk_deg.SSM = A380FadecComputer_U.in.prim_3.fg.selected_trk_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_150_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_trk_deg.Data = A380FadecComputer_U.in.prim_1.fg.selected_trk_deg.Data;
  } else if (A380FadecComputer_P.Switch1_150_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_trk_deg.Data = A380FadecComputer_U.in.prim_2.fg.selected_trk_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_trk_deg.Data = A380FadecComputer_U.in.prim_3.fg.selected_trk_deg.Data;
  }

  if (A380FadecComputer_P.Switch_151_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_alt_ft.SSM = A380FadecComputer_U.in.prim_1.fg.selected_alt_ft.SSM;
  } else if (A380FadecComputer_P.Switch1_151_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_alt_ft.SSM = A380FadecComputer_U.in.prim_2.fg.selected_alt_ft.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_alt_ft.SSM = A380FadecComputer_U.in.prim_3.fg.selected_alt_ft.SSM;
  }

  if (A380FadecComputer_P.Switch_152_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_alt_ft.Data = A380FadecComputer_U.in.prim_1.fg.selected_alt_ft.Data;
  } else if (A380FadecComputer_P.Switch1_152_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_alt_ft.Data = A380FadecComputer_U.in.prim_2.fg.selected_alt_ft.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_alt_ft.Data = A380FadecComputer_U.in.prim_3.fg.selected_alt_ft.Data;
  }

  if (A380FadecComputer_P.Switch_153_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_vs_ft_min.SSM =
      A380FadecComputer_U.in.prim_1.fg.selected_vs_ft_min.SSM;
  } else if (A380FadecComputer_P.Switch1_153_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_vs_ft_min.SSM =
      A380FadecComputer_U.in.prim_2.fg.selected_vs_ft_min.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_vs_ft_min.SSM =
      A380FadecComputer_U.in.prim_3.fg.selected_vs_ft_min.SSM;
  }

  if (A380FadecComputer_P.Switch_154_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_vs_ft_min.Data =
      A380FadecComputer_U.in.prim_1.fg.selected_vs_ft_min.Data;
  } else if (A380FadecComputer_P.Switch1_154_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_vs_ft_min.Data =
      A380FadecComputer_U.in.prim_2.fg.selected_vs_ft_min.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_vs_ft_min.Data =
      A380FadecComputer_U.in.prim_3.fg.selected_vs_ft_min.Data;
  }

  if (A380FadecComputer_P.Switch_155_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_fpa_deg.SSM = A380FadecComputer_U.in.prim_1.fg.selected_fpa_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_155_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_fpa_deg.SSM = A380FadecComputer_U.in.prim_2.fg.selected_fpa_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_fpa_deg.SSM = A380FadecComputer_U.in.prim_3.fg.selected_fpa_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_156_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_fpa_deg.Data = A380FadecComputer_U.in.prim_1.fg.selected_fpa_deg.Data;
  } else if (A380FadecComputer_P.Switch1_156_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.selected_fpa_deg.Data = A380FadecComputer_U.in.prim_2.fg.selected_fpa_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.selected_fpa_deg.Data = A380FadecComputer_U.in.prim_3.fg.selected_fpa_deg.Data;
  }

  if (A380FadecComputer_P.Switch_157_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.runway_hdg_memorized_deg.SSM =
      A380FadecComputer_U.in.prim_1.fg.runway_hdg_memorized_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_157_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.runway_hdg_memorized_deg.SSM =
      A380FadecComputer_U.in.prim_2.fg.runway_hdg_memorized_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.runway_hdg_memorized_deg.SSM =
      A380FadecComputer_U.in.prim_3.fg.runway_hdg_memorized_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_158_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.runway_hdg_memorized_deg.Data =
      A380FadecComputer_U.in.prim_1.fg.runway_hdg_memorized_deg.Data;
  } else if (A380FadecComputer_P.Switch1_158_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.runway_hdg_memorized_deg.Data =
      A380FadecComputer_U.in.prim_2.fg.runway_hdg_memorized_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.runway_hdg_memorized_deg.Data =
      A380FadecComputer_U.in.prim_3.fg.runway_hdg_memorized_deg.Data;
  }

  if (A380FadecComputer_P.Switch_159_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.preset_mach_from_fms.SSM =
      A380FadecComputer_U.in.prim_1.fg.preset_mach_from_fms.SSM;
  } else if (A380FadecComputer_P.Switch1_159_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.preset_mach_from_fms.SSM =
      A380FadecComputer_U.in.prim_2.fg.preset_mach_from_fms.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.preset_mach_from_fms.SSM =
      A380FadecComputer_U.in.prim_3.fg.preset_mach_from_fms.SSM;
  }

  if (A380FadecComputer_P.Switch_160_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.preset_mach_from_fms.Data =
      A380FadecComputer_U.in.prim_1.fg.preset_mach_from_fms.Data;
  } else if (A380FadecComputer_P.Switch1_160_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.preset_mach_from_fms.Data =
      A380FadecComputer_U.in.prim_2.fg.preset_mach_from_fms.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.preset_mach_from_fms.Data =
      A380FadecComputer_U.in.prim_3.fg.preset_mach_from_fms.Data;
  }

  if (A380FadecComputer_P.Switch_161_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.preset_speed_from_fms_kts.SSM =
      A380FadecComputer_U.in.prim_1.fg.preset_speed_from_fms_kts.SSM;
  } else if (A380FadecComputer_P.Switch1_161_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.preset_speed_from_fms_kts.SSM =
      A380FadecComputer_U.in.prim_2.fg.preset_speed_from_fms_kts.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.preset_speed_from_fms_kts.SSM =
      A380FadecComputer_U.in.prim_3.fg.preset_speed_from_fms_kts.SSM;
  }

  if (A380FadecComputer_P.Switch_162_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.preset_speed_from_fms_kts.Data =
      A380FadecComputer_U.in.prim_1.fg.preset_speed_from_fms_kts.Data;
  } else if (A380FadecComputer_P.Switch1_162_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.preset_speed_from_fms_kts.Data =
      A380FadecComputer_U.in.prim_2.fg.preset_speed_from_fms_kts.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.preset_speed_from_fms_kts.Data =
      A380FadecComputer_U.in.prim_3.fg.preset_speed_from_fms_kts.Data;
  }

  if (A380FadecComputer_P.Switch_163_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_1.SSM = A380FadecComputer_U.in.prim_1.fg.roll_fd_command_1.SSM;
  } else if (A380FadecComputer_P.Switch1_163_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_1.SSM = A380FadecComputer_U.in.prim_2.fg.roll_fd_command_1.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_1.SSM = A380FadecComputer_U.in.prim_3.fg.roll_fd_command_1.SSM;
  }

  if (A380FadecComputer_P.Switch_164_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_1.Data =
      A380FadecComputer_U.in.prim_1.fg.roll_fd_command_1.Data;
  } else if (A380FadecComputer_P.Switch1_164_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_1.Data =
      A380FadecComputer_U.in.prim_2.fg.roll_fd_command_1.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_1.Data =
      A380FadecComputer_U.in.prim_3.fg.roll_fd_command_1.Data;
  }

  if (A380FadecComputer_P.Switch_165_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_1.SSM =
      A380FadecComputer_U.in.prim_1.fg.pitch_fd_command_1.SSM;
  } else if (A380FadecComputer_P.Switch1_165_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_1.SSM =
      A380FadecComputer_U.in.prim_2.fg.pitch_fd_command_1.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_1.SSM =
      A380FadecComputer_U.in.prim_3.fg.pitch_fd_command_1.SSM;
  }

  if (A380FadecComputer_P.Switch_166_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_1.Data =
      A380FadecComputer_U.in.prim_1.fg.pitch_fd_command_1.Data;
  } else if (A380FadecComputer_P.Switch1_166_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_1.Data =
      A380FadecComputer_U.in.prim_2.fg.pitch_fd_command_1.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_1.Data =
      A380FadecComputer_U.in.prim_3.fg.pitch_fd_command_1.Data;
  }

  if (A380FadecComputer_P.Switch_167_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_1.SSM = A380FadecComputer_U.in.prim_1.fg.yaw_fd_command_1.SSM;
  } else if (A380FadecComputer_P.Switch1_167_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_1.SSM = A380FadecComputer_U.in.prim_2.fg.yaw_fd_command_1.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_1.SSM = A380FadecComputer_U.in.prim_3.fg.yaw_fd_command_1.SSM;
  }

  if (A380FadecComputer_P.Switch_168_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_1.Data = A380FadecComputer_U.in.prim_1.fg.yaw_fd_command_1.Data;
  } else if (A380FadecComputer_P.Switch1_168_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_1.Data = A380FadecComputer_U.in.prim_2.fg.yaw_fd_command_1.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_1.Data = A380FadecComputer_U.in.prim_3.fg.yaw_fd_command_1.Data;
  }

  if (A380FadecComputer_P.Switch_169_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_2.SSM = A380FadecComputer_U.in.prim_1.fg.roll_fd_command_2.SSM;
  } else if (A380FadecComputer_P.Switch1_169_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_2.SSM = A380FadecComputer_U.in.prim_2.fg.roll_fd_command_2.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_2.SSM = A380FadecComputer_U.in.prim_3.fg.roll_fd_command_2.SSM;
  }

  if (A380FadecComputer_P.Switch_170_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_2.Data =
      A380FadecComputer_U.in.prim_1.fg.roll_fd_command_2.Data;
  } else if (A380FadecComputer_P.Switch1_170_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_2.Data =
      A380FadecComputer_U.in.prim_2.fg.roll_fd_command_2.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.roll_fd_command_2.Data =
      A380FadecComputer_U.in.prim_3.fg.roll_fd_command_2.Data;
  }

  if (A380FadecComputer_P.Switch_171_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_2.SSM =
      A380FadecComputer_U.in.prim_1.fg.pitch_fd_command_2.SSM;
  } else if (A380FadecComputer_P.Switch1_171_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_2.SSM =
      A380FadecComputer_U.in.prim_2.fg.pitch_fd_command_2.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_2.SSM =
      A380FadecComputer_U.in.prim_3.fg.pitch_fd_command_2.SSM;
  }

  if (A380FadecComputer_P.Switch_172_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_2.Data =
      A380FadecComputer_U.in.prim_1.fg.pitch_fd_command_2.Data;
  } else if (A380FadecComputer_P.Switch1_172_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_2.Data =
      A380FadecComputer_U.in.prim_2.fg.pitch_fd_command_2.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.pitch_fd_command_2.Data =
      A380FadecComputer_U.in.prim_3.fg.pitch_fd_command_2.Data;
  }

  if (A380FadecComputer_P.Switch_173_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_2.SSM = A380FadecComputer_U.in.prim_1.fg.yaw_fd_command_2.SSM;
  } else if (A380FadecComputer_P.Switch1_173_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_2.SSM = A380FadecComputer_U.in.prim_2.fg.yaw_fd_command_2.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_2.SSM = A380FadecComputer_U.in.prim_3.fg.yaw_fd_command_2.SSM;
  }

  if (A380FadecComputer_P.Switch_174_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_2.Data = A380FadecComputer_U.in.prim_1.fg.yaw_fd_command_2.Data;
  } else if (A380FadecComputer_P.Switch1_174_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_2.Data = A380FadecComputer_U.in.prim_2.fg.yaw_fd_command_2.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.yaw_fd_command_2.Data = A380FadecComputer_U.in.prim_3.fg.yaw_fd_command_2.Data;
  }

  if (A380FadecComputer_P.Switch_175_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_5.SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_5.SSM;
  } else if (A380FadecComputer_P.Switch1_175_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_5.SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_5.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_5.SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_5.SSM;
  }

  if (A380FadecComputer_P.Switch_176_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_5.Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_5.Data;
  } else if (A380FadecComputer_P.Switch1_176_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_5.Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_5.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_5.Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_5.Data;
  }

  if (A380FadecComputer_P.Switch_177_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_4.SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_4.SSM;
  } else if (A380FadecComputer_P.Switch1_177_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_4.SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_4.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_4.SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_4.SSM;
  }

  if (A380FadecComputer_P.Switch_178_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_4.Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_4.Data;
  } else if (A380FadecComputer_P.Switch1_178_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_4.Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_4.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_4.Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_4.Data;
  }

  if (A380FadecComputer_P.Switch_179_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.fm_alt_constraint_ft.SSM =
      A380FadecComputer_U.in.prim_1.fg.fm_alt_constraint_ft.SSM;
  } else if (A380FadecComputer_P.Switch1_179_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.fm_alt_constraint_ft.SSM =
      A380FadecComputer_U.in.prim_2.fg.fm_alt_constraint_ft.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.fm_alt_constraint_ft.SSM =
      A380FadecComputer_U.in.prim_3.fg.fm_alt_constraint_ft.SSM;
  }

  if (A380FadecComputer_P.Switch_180_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.fm_alt_constraint_ft.Data =
      A380FadecComputer_U.in.prim_1.fg.fm_alt_constraint_ft.Data;
  } else if (A380FadecComputer_P.Switch1_180_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.fm_alt_constraint_ft.Data =
      A380FadecComputer_U.in.prim_2.fg.fm_alt_constraint_ft.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.fm_alt_constraint_ft.Data =
      A380FadecComputer_U.in.prim_3.fg.fm_alt_constraint_ft.Data;
  }

  A380FadecComputer_Y.out.prim_input.fg.ats_discrete_word = rtb_BusAssignment_o_prim_input_fg_ats_discrete_word;
  if (A380FadecComputer_P.Switch_183_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.ats_fma_discrete_word.SSM =
      A380FadecComputer_U.in.prim_1.fg.ats_fma_discrete_word.SSM;
  } else if (A380FadecComputer_P.Switch1_183_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.ats_fma_discrete_word.SSM =
      A380FadecComputer_U.in.prim_2.fg.ats_fma_discrete_word.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.ats_fma_discrete_word.SSM =
      A380FadecComputer_U.in.prim_3.fg.ats_fma_discrete_word.SSM;
  }

  if (A380FadecComputer_P.Switch_184_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.ats_fma_discrete_word.Data =
      A380FadecComputer_U.in.prim_1.fg.ats_fma_discrete_word.Data;
  } else if (A380FadecComputer_P.Switch1_184_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.ats_fma_discrete_word.Data =
      A380FadecComputer_U.in.prim_2.fg.ats_fma_discrete_word.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.ats_fma_discrete_word.Data =
      A380FadecComputer_U.in.prim_3.fg.ats_fma_discrete_word.Data;
  }

  if (A380FadecComputer_P.Switch_185_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_3.SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_3.SSM;
  } else if (A380FadecComputer_P.Switch1_185_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_3.SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_3.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_3.SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_3.SSM;
  }

  if (A380FadecComputer_P.Switch_186_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_3.Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_3.Data;
  } else if (A380FadecComputer_P.Switch1_186_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_3.Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_3.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_3.Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_3.Data;
  }

  if (A380FadecComputer_P.Switch_187_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_1.SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_1.SSM;
  } else if (A380FadecComputer_P.Switch1_187_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_1.SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_1.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_1.SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_1.SSM;
  }

  if (A380FadecComputer_P.Switch_188_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_1.Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_1.Data;
  } else if (A380FadecComputer_P.Switch1_188_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_1.Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_1.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_1.Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_1.Data;
  }

  if (A380FadecComputer_P.Switch_189_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_2.SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_2.SSM;
  } else if (A380FadecComputer_P.Switch1_189_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_2.SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_2.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_2.SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_2.SSM;
  }

  if (A380FadecComputer_P.Switch_190_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_2.Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_2.Data;
  } else if (A380FadecComputer_P.Switch1_190_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_2.Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_2.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_2.Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_2.Data;
  }

  if (A380FadecComputer_P.Switch_191_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_6.SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_6.SSM;
  } else if (A380FadecComputer_P.Switch1_191_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_6.SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_6.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_6.SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_6.SSM;
  }

  if (A380FadecComputer_P.Switch_192_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_6.Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_6.Data;
  } else if (A380FadecComputer_P.Switch1_192_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_6.Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_6.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_6.Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_6.Data;
  }

  if (A380FadecComputer_P.Switch_193_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.low_target_speed_margin_kts.SSM =
      A380FadecComputer_U.in.prim_1.fg.low_target_speed_margin_kts.SSM;
  } else if (A380FadecComputer_P.Switch1_193_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.low_target_speed_margin_kts.SSM =
      A380FadecComputer_U.in.prim_2.fg.low_target_speed_margin_kts.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.low_target_speed_margin_kts.SSM =
      A380FadecComputer_U.in.prim_3.fg.low_target_speed_margin_kts.SSM;
  }

  if (A380FadecComputer_P.Switch_194_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.low_target_speed_margin_kts.Data =
      A380FadecComputer_U.in.prim_1.fg.low_target_speed_margin_kts.Data;
  } else if (A380FadecComputer_P.Switch1_194_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.low_target_speed_margin_kts.Data =
      A380FadecComputer_U.in.prim_2.fg.low_target_speed_margin_kts.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.low_target_speed_margin_kts.Data =
      A380FadecComputer_U.in.prim_3.fg.low_target_speed_margin_kts.Data;
  }

  if (A380FadecComputer_P.Switch_195_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.high_target_speed_margin_kts.SSM =
      A380FadecComputer_U.in.prim_1.fg.high_target_speed_margin_kts.SSM;
  } else if (A380FadecComputer_P.Switch1_195_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.high_target_speed_margin_kts.SSM =
      A380FadecComputer_U.in.prim_2.fg.high_target_speed_margin_kts.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.high_target_speed_margin_kts.SSM =
      A380FadecComputer_U.in.prim_3.fg.high_target_speed_margin_kts.SSM;
  }

  if (A380FadecComputer_P.Switch_196_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.high_target_speed_margin_kts.Data =
      A380FadecComputer_U.in.prim_1.fg.high_target_speed_margin_kts.Data;
  } else if (A380FadecComputer_P.Switch1_196_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.high_target_speed_margin_kts.Data =
      A380FadecComputer_U.in.prim_2.fg.high_target_speed_margin_kts.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.high_target_speed_margin_kts.Data =
      A380FadecComputer_U.in.prim_3.fg.high_target_speed_margin_kts.Data;
  }

  if (A380FadecComputer_P.Switch_197_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.nosewheel_cmd_deg.SSM = A380FadecComputer_U.in.prim_1.fg.nosewheel_cmd_deg.SSM;
  } else if (A380FadecComputer_P.Switch1_197_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.nosewheel_cmd_deg.SSM = A380FadecComputer_U.in.prim_2.fg.nosewheel_cmd_deg.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.nosewheel_cmd_deg.SSM = A380FadecComputer_U.in.prim_3.fg.nosewheel_cmd_deg.SSM;
  }

  if (A380FadecComputer_P.Switch_198_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.nosewheel_cmd_deg.Data =
      A380FadecComputer_U.in.prim_1.fg.nosewheel_cmd_deg.Data;
  } else if (A380FadecComputer_P.Switch1_198_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.nosewheel_cmd_deg.Data =
      A380FadecComputer_U.in.prim_2.fg.nosewheel_cmd_deg.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.nosewheel_cmd_deg.Data =
      A380FadecComputer_U.in.prim_3.fg.nosewheel_cmd_deg.Data;
  }

  A380FadecComputer_Y.out.prim_input.fg.n1_command_percent.SSM = rtb_n1_command_percent_SSM;
  A380FadecComputer_Y.out.prim_input.fg.n1_command_percent.Data = rtb_n1_command_percent_Data;
  if (A380FadecComputer_P.Switch_201_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.flx_to_temp_deg_c.SSM = A380FadecComputer_U.in.prim_1.fg.flx_to_temp_deg_c.SSM;
  } else if (A380FadecComputer_P.Switch1_201_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.flx_to_temp_deg_c.SSM = A380FadecComputer_U.in.prim_2.fg.flx_to_temp_deg_c.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.flx_to_temp_deg_c.SSM = A380FadecComputer_U.in.prim_3.fg.flx_to_temp_deg_c.SSM;
  }

  if (A380FadecComputer_P.Switch_202_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.flx_to_temp_deg_c.Data =
      A380FadecComputer_U.in.prim_1.fg.flx_to_temp_deg_c.Data;
  } else if (A380FadecComputer_P.Switch1_202_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.flx_to_temp_deg_c.Data =
      A380FadecComputer_U.in.prim_2.fg.flx_to_temp_deg_c.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.flx_to_temp_deg_c.Data =
      A380FadecComputer_U.in.prim_3.fg.flx_to_temp_deg_c.Data;
  }

  if (A380FadecComputer_P.Switch_203_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_7.SSM = A380FadecComputer_U.in.prim_1.fg.discrete_word_7.SSM;
  } else if (A380FadecComputer_P.Switch1_203_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_7.SSM = A380FadecComputer_U.in.prim_2.fg.discrete_word_7.SSM;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_7.SSM = A380FadecComputer_U.in.prim_3.fg.discrete_word_7.SSM;
  }

  if (A380FadecComputer_P.Switch_204_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_7.Data = A380FadecComputer_U.in.prim_1.fg.discrete_word_7.Data;
  } else if (A380FadecComputer_P.Switch1_204_Threshold < 0.0) {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_7.Data = A380FadecComputer_U.in.prim_2.fg.discrete_word_7.Data;
  } else {
    A380FadecComputer_Y.out.prim_input.fg.discrete_word_7.Data = A380FadecComputer_U.in.prim_3.fg.discrete_word_7.Data;
  }

  if (rtb_NOT1_f) {
    A380FadecComputer_Y.out.output.sim_throttle_lever_pos = A380FadecComputer_DWork.Delay_DSTATE_n;
  } else {
    A380FadecComputer_Y.out.output.sim_throttle_lever_pos = A380FadecComputer_DWork.Delay_DSTATE_l;
  }

  if (A380FadecComputer_U.in.input.TLA_deg < 0.0) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 1.0;
  } else if (A380FadecComputer_U.in.input.TLA_deg == 0.0) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 2.0;
  } else if ((A380FadecComputer_U.in.input.TLA_deg > 0.0) && (A380FadecComputer_U.in.input.TLA_deg < 25.0)) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 3.0;
  } else if ((A380FadecComputer_U.in.input.TLA_deg >= 25.0) && (A380FadecComputer_U.in.input.TLA_deg < 35.0)) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 4.0;
  } else if ((A380FadecComputer_U.in.input.TLA_deg >= 35.0) && (A380FadecComputer_U.in.input.TLA_deg < 45.0)) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 5.0;
  } else if (A380FadecComputer_U.in.input.TLA_deg == 45.0) {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 6.0;
  } else {
    A380FadecComputer_Y.out.output.sim_thrust_mode = 0.0;
  }

  A380FadecComputer_Y.out.output.N1_TLA_percent = rtb_N1c;
  A380FadecComputer_Y.out.output.is_in_reverse = rtb_inReverse;
  A380FadecComputer_Y.out.output.thrust_limit_type = rtb_type;
  A380FadecComputer_Y.out.output.thrust_limit_percent = N1_begin;
  A380FadecComputer_Y.out.output.N1_c_percent = rtb_Switch2_idx_1;
  A380FadecComputer_Y.out.output.athr_control_active = A380FadecComputer_DWork.Memory_PreviousInput_p;
  A380FadecComputer_Y.out.output.memo_thrust_active = A380FadecComputer_DWork.Memory_PreviousInput_j;
  A380FadecComputer_Y.out.fadec_bus_output.selected_tla_deg.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.selected_tla_deg.Data = static_cast<real32_T>
    (A380FadecComputer_U.in.input.TLA_deg);
  A380FadecComputer_Y.out.fadec_bus_output.n1_ref_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.n1_ref_percent.Data = static_cast<real32_T>(rtb_N1c);
  if (rtb_y_mb) {
    A380FadecComputer_Y.out.fadec_bus_output.selected_flex_temp_deg.SSM = static_cast<uint32_T>
      (A380FadecComputer_P.EnumeratedConstant1_Value);
  } else {
    A380FadecComputer_Y.out.fadec_bus_output.selected_flex_temp_deg.SSM = static_cast<uint32_T>
      (A380FadecComputer_P.EnumeratedConstant_Value);
  }

  A380FadecComputer_Y.out.fadec_bus_output.selected_flex_temp_deg.Data = rtb_y_k;
  A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_1.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_1.Data = A380FadecComputer_P.Constant2_Value_n;
  A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_2.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_2.Data = A380FadecComputer_P.Constant1_Value;
  A380FadecComputer_Y.out.fadec_bus_output.ecu_status_word_3.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.n1_limit_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.n1_limit_percent.Data = static_cast<real32_T>(N1_begin);
  A380FadecComputer_Y.out.fadec_bus_output.n1_maximum_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.n1_maximum_percent.Data = static_cast<real32_T>
    (A380FadecComputer_U.in.input.thrust_limit_TOGA_percent);
  A380FadecComputer_Y.out.fadec_bus_output.n1_command_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.n1_command_percent.Data = static_cast<real32_T>(rtb_Switch2_idx_1);
  A380FadecComputer_Y.out.fadec_bus_output.selected_n2_actual_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.selected_n2_actual_percent.Data = static_cast<real32_T>
    (A380FadecComputer_U.in.data.engine_N2_percent);
  A380FadecComputer_Y.out.fadec_bus_output.selected_n1_actual_percent.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
  A380FadecComputer_Y.out.fadec_bus_output.selected_n1_actual_percent.Data = static_cast<real32_T>
    (A380FadecComputer_U.in.data.engine_N1_percent);
  A380FadecComputer_Y.out.fadec_bus_output.ecu_maintenance_word_6.SSM = static_cast<uint32_T>
    (A380FadecComputer_P.EnumeratedConstant1_Value);
}

void A380FadecComputer::initialize()
{
  A380FadecComputer_DWork.Memory_PreviousInput = A380FadecComputer_P.SRFlipFlop_initial_condition;
  A380FadecComputer_DWork.Memory_PreviousInput_p = A380FadecComputer_P.SRFlipFlop_initial_condition_k;
  A380FadecComputer_DWork.Memory_PreviousInput_j = A380FadecComputer_P.SRFlipFlop1_initial_condition;
  A380FadecComputer_DWork.Delay_DSTATE = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  A380FadecComputer_DWork.Delay_DSTATE_n = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition_p;
  A380FadecComputer_DWork.Delay_DSTATE_l = A380FadecComputer_P.DiscreteTimeIntegratorVariableTs1_InitialCondition;
}

void A380FadecComputer::terminate()
{
}

A380FadecComputer::A380FadecComputer():
  A380FadecComputer_U(),
  A380FadecComputer_Y(),
  A380FadecComputer_DWork()
{
}

A380FadecComputer::~A380FadecComputer() = default;
