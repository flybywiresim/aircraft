#include "FadecComputer.h"
#include "FadecComputer_types.h"
#include "rtwtypes.h"
#include <cmath>

void FadecComputer::FadecComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void FadecComputer::FadecComputer_MATLABFunction_p(const base_arinc_429 *rtu_u, real32_T rtu_default, real32_T *rty_y)
{
  if (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
    *rty_y = rtu_u->Data;
  } else {
    *rty_y = rtu_default;
  }
}

void FadecComputer::FadecComputer_TimeSinceCondition(real_T rtu_time, boolean_T rtu_condition, real_T *rty_y,
  rtDW_TimeSinceCondition_FadecComputer_T *localDW)
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

void FadecComputer::FadecComputer_MATLABFunction_g(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void FadecComputer::FadecComputer_MATLABFunction_l(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void FadecComputer::FadecComputer_MATLABFunction_f(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_FadecComputer_m_T *localDW)
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

void FadecComputer::step()
{
  real_T N1_begin;
  real_T N1_end;
  real_T rtb_N1c;
  real_T rtb_Sum;
  real_T rtb_Switch;
  real_T rtb_Switch2_idx_1;
  int32_T TLA_begin;
  int32_T TLA_end;
  real32_T rtb_y_ps;
  uint32_T rtb_y_c;
  uint32_T rtb_y_jc;
  uint32_T rtb_y_n;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_AND;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_TLA_in_active_range;
  boolean_T rtb_NOT1_f;
  boolean_T rtb_OR2;
  boolean_T rtb_OR2_tmp;
  boolean_T rtb_y_i;
  athr_thrust_limit_type rtb_type;
  FadecComputer_TimeSinceCondition(FadecComputer_U.in.time.simulation_time, FadecComputer_U.in.input.ATHR_disconnect,
    &rtb_Switch, &FadecComputer_DWork.sf_TimeSinceCondition);
  rtb_OR2 = (rtb_Switch >= FadecComputer_P.CompareToConstant_const);
  FadecComputer_DWork.Memory_PreviousInput = FadecComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_OR2) << 1) +
    FadecComputer_U.in.input.ATHR_reset_disable) << 1) + FadecComputer_DWork.Memory_PreviousInput];
  FadecComputer_MATLABFunction_g(&FadecComputer_U.in.fcu_input.ats_discrete_word, FadecComputer_P.BitfromLabel_bit,
    &rtb_y_n);
  FadecComputer_MATLABFunction(&FadecComputer_U.in.fcu_input.n1_cmd_percent, &rtb_NOT1_f);
  rtb_AND = ((rtb_y_n != 0U) && rtb_NOT1_f);
  FadecComputer_MATLABFunction_f(rtb_AND, FadecComputer_P.PulseNode_isRisingEdge, &rtb_NOT1_f,
    &FadecComputer_DWork.sf_MATLABFunction_f);
  FadecComputer_MATLABFunction(&FadecComputer_U.in.fcu_input.fcu_flex_to_temp_deg_c, &rtb_OR2);
  FadecComputer_MATLABFunction_p(&FadecComputer_U.in.fcu_input.fcu_flex_to_temp_deg_c,
    FadecComputer_P.A429ValueOrDefault_defaultValue, &rtb_y_ps);
  rtb_OR2 = (rtb_OR2 && (rtb_y_ps > FadecComputer_U.in.data.TAT_degC) && FadecComputer_U.in.data.on_ground);
  FadecComputer_DWork.latch = ((rtb_OR2 && (FadecComputer_U.in.input.TLA_deg == 35.0)) || FadecComputer_DWork.latch);
  FadecComputer_DWork.latch = (((!FadecComputer_DWork.latch) || ((FadecComputer_U.in.input.TLA_deg != 25.0) &&
    (FadecComputer_U.in.input.TLA_deg != 45.0))) && FadecComputer_DWork.latch);
  rtb_OR2_tmp = !FadecComputer_U.in.data.on_ground;
  rtb_OR2 = (rtb_OR2 || (rtb_OR2_tmp && FadecComputer_DWork.latch));
  FadecComputer_TimeSinceCondition(FadecComputer_U.in.time.simulation_time, FadecComputer_U.in.data.on_ground,
    &rtb_Switch, &FadecComputer_DWork.sf_TimeSinceCondition1);
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_TLA_in_active_range =
    (FadecComputer_U.in.input.TLA_deg <= FadecComputer_P.CompareToConstant1_const);
  FadecComputer_MATLABFunction_g(&FadecComputer_U.in.fcu_input.ats_discrete_word, FadecComputer_P.BitfromLabel1_bit,
    &rtb_y_n);
  TLA_begin = static_cast<int32_T>((((FadecComputer_U.in.input.ATHR_disconnect ||
    FadecComputer_DWork.Memory_PreviousInput || (rtb_y_n == 0U)) + (static_cast<uint32_T>(rtb_NOT1_f) << 1)) << 1) +
    FadecComputer_DWork.Memory_PreviousInput_p);
  FadecComputer_DWork.Memory_PreviousInput_p = FadecComputer_P.Logic_table_n[static_cast<uint32_T>(TLA_begin)];
  FadecComputer_MATLABFunction_f(FadecComputer_P.Logic_table_n[static_cast<uint32_T>(TLA_begin) + 8U],
    FadecComputer_P.PulseNode1_isRisingEdge, &rtb_NOT1_f, &FadecComputer_DWork.sf_MATLABFunction_b);
  rtb_y_i = (((FadecComputer_U.in.input.TLA_deg > 26.0) || (FadecComputer_U.in.input.TLA_deg < 24.0)) &&
             ((FadecComputer_U.in.input.TLA_deg > 36.0) || (FadecComputer_U.in.input.TLA_deg < 34.0)));
  FadecComputer_DWork.Memory_PreviousInput_j = FadecComputer_P.Logic_table_h[(((static_cast<uint32_T>(rtb_NOT1_f &&
    (!rtb_y_i)) << 1) + (rtb_y_i || FadecComputer_DWork.Memory_PreviousInput_p)) << 1) +
    FadecComputer_DWork.Memory_PreviousInput_j];
  rtb_N1c = FadecComputer_U.in.input.TLA_deg;
  if (!FadecComputer_U.in.data.on_ground) {
    rtb_N1c = std::fmax(0.0, FadecComputer_U.in.input.TLA_deg);
  }

  rtb_y_i = (rtb_N1c < 0.0);
  if (rtb_N1c >= 0.0) {
    if (rtb_N1c <= 25.0) {
      TLA_begin = 0;
      N1_begin = FadecComputer_U.in.input.thrust_limit_IDLE_percent;
      TLA_end = 25;
      N1_end = FadecComputer_U.in.input.thrust_limit_CLB_percent;
    } else if (rtb_N1c <= 35.0) {
      TLA_begin = 25;
      N1_begin = FadecComputer_U.in.input.thrust_limit_CLB_percent;
      TLA_end = 35;
      if (rtb_OR2) {
        N1_end = FadecComputer_U.in.input.thrust_limit_FLEX_percent;
      } else {
        N1_end = FadecComputer_U.in.input.thrust_limit_MCT_percent;
      }
    } else {
      TLA_begin = 35;
      if (rtb_OR2) {
        N1_begin = FadecComputer_U.in.input.thrust_limit_FLEX_percent;
      } else {
        N1_begin = FadecComputer_U.in.input.thrust_limit_MCT_percent;
      }

      TLA_end = 45;
      N1_end = FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    }
  } else {
    rtb_N1c = std::fmax(std::abs(rtb_N1c), 6.0);
    TLA_begin = 6;
    N1_begin = std::abs(FadecComputer_U.in.input.thrust_limit_IDLE_percent + 1.0);
    TLA_end = 20;
    N1_end = std::abs(FadecComputer_U.in.input.thrust_limit_REV_percent);
  }

  rtb_N1c = (N1_end - N1_begin) / static_cast<real_T>(TLA_end - TLA_begin) * (rtb_N1c - static_cast<real_T>(TLA_begin))
    + N1_begin;
  FadecComputer_MATLABFunction_g(&FadecComputer_U.in.fcu_input.ats_discrete_word, FadecComputer_P.BitfromLabel_bit_a,
    &rtb_y_jc);
  N1_begin = FadecComputer_U.in.input.TLA_deg;
  if (!FadecComputer_U.in.data.on_ground) {
    N1_begin = std::fmax(0.0, FadecComputer_U.in.input.TLA_deg);
  }

  if (rtb_OR2_tmp || (!FadecComputer_U.in.data.is_engine_operative)) {
    if (rtb_y_jc != 0U) {
      rtb_type = athr_thrust_limit_type::TOGA;
      N1_begin = FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    } else if (N1_begin > 35.0) {
      rtb_type = athr_thrust_limit_type::TOGA;
      N1_begin = FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    } else if (N1_begin > 25.0) {
      if (!rtb_OR2) {
        rtb_type = athr_thrust_limit_type::MCT;
        N1_begin = FadecComputer_U.in.input.thrust_limit_MCT_percent;
      } else {
        rtb_type = athr_thrust_limit_type::FLEX;
        N1_begin = FadecComputer_U.in.input.thrust_limit_FLEX_percent;
      }
    } else if (N1_begin >= 0.0) {
      rtb_type = athr_thrust_limit_type::CLB;
      N1_begin = FadecComputer_U.in.input.thrust_limit_CLB_percent;
    } else if (N1_begin < 0.0) {
      rtb_type = athr_thrust_limit_type::REVERSE;
      N1_begin = FadecComputer_U.in.input.thrust_limit_REV_percent;
    } else {
      rtb_type = athr_thrust_limit_type::NONE;
      N1_begin = 0.0;
    }
  } else if (N1_begin >= 0.0) {
    if ((!rtb_OR2) || (N1_begin > 35.0)) {
      rtb_type = athr_thrust_limit_type::TOGA;
      N1_begin = FadecComputer_U.in.input.thrust_limit_TOGA_percent;
    } else {
      rtb_type = athr_thrust_limit_type::FLEX;
      N1_begin = FadecComputer_U.in.input.thrust_limit_FLEX_percent;
    }
  } else if (N1_begin < 0.0) {
    rtb_type = athr_thrust_limit_type::REVERSE;
    N1_begin = FadecComputer_U.in.input.thrust_limit_REV_percent;
  } else {
    rtb_type = athr_thrust_limit_type::NONE;
    N1_begin = 0.0;
  }

  FadecComputer_MATLABFunction_g(&FadecComputer_U.in.fcu_input.ats_discrete_word, FadecComputer_P.BitfromLabel4_bit,
    &rtb_y_n);
  FadecComputer_MATLABFunction_g(&FadecComputer_U.in.fcu_input.ats_discrete_word, FadecComputer_P.BitfromLabel5_bit,
    &rtb_y_c);
  FadecComputer_MATLABFunction_p(&FadecComputer_U.in.fcu_input.n1_cmd_percent,
    FadecComputer_P.A429ValueOrDefault_defaultValue_a, &rtb_y_ps);
  FadecComputer_MATLABFunction_g(&FadecComputer_U.in.fcu_input.ats_discrete_word, FadecComputer_P.BitfromLabel3_bit,
    &rtb_y_jc);
  rtb_NOT1_f = (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_TLA_in_active_range || (rtb_y_jc
    != 0U));
  FadecComputer_MATLABFunction_g(&FadecComputer_U.in.fcu_input.ats_discrete_word, FadecComputer_P.BitfromLabel2_bit,
    &rtb_y_jc);
  if (!FadecComputer_DWork.pU_not_empty) {
    FadecComputer_DWork.pU = FadecComputer_U.in.data.engine_N1_percent;
    FadecComputer_DWork.pU_not_empty = true;
  }

  if (!FadecComputer_DWork.Memory_PreviousInput_j) {
    FadecComputer_DWork.pU = FadecComputer_U.in.data.engine_N1_percent;
  }

  if (rtb_NOT1_f && (rtb_y_jc != 0U) && rtb_AND && FadecComputer_DWork.Memory_PreviousInput_p) {
    if ((rtb_y_n != 0U) && (rtb_y_c != 0U) && rtb_OR2_tmp) {
      N1_end = FadecComputer_U.in.input.thrust_limit_TOGA_percent;
      rtb_Switch2_idx_1 = rtb_N1c;
    } else {
      N1_end = rtb_N1c;
      rtb_Switch2_idx_1 = FadecComputer_U.in.input.thrust_limit_IDLE_percent;
    }

    if (rtb_y_ps > N1_end) {
      N1_end = static_cast<real32_T>(N1_end);
    } else if (rtb_y_ps < rtb_Switch2_idx_1) {
      N1_end = static_cast<real32_T>(rtb_Switch2_idx_1);
    } else {
      N1_end = rtb_y_ps;
    }
  } else if (FadecComputer_DWork.Memory_PreviousInput_j) {
    N1_end = FadecComputer_DWork.pU;
  } else {
    N1_end = rtb_N1c;
  }

  rtb_Switch2_idx_1 = N1_end;
  rtb_Sum = N1_end - FadecComputer_U.in.data.engine_N1_percent;
  if (std::abs(rtb_Sum) > 0.8) {
    FadecComputer_DWork.Delay_DSTATE = FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
    rtb_Sum = 0.0;
  }

  FadecComputer_DWork.Delay_DSTATE += FadecComputer_P.Gain_Gain * rtb_Sum *
    FadecComputer_P.DiscreteTimeIntegratorVariableTs_Gain * FadecComputer_U.in.time.dt;
  if (FadecComputer_DWork.Delay_DSTATE > FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    FadecComputer_DWork.Delay_DSTATE = FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (FadecComputer_DWork.Delay_DSTATE < FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    FadecComputer_DWork.Delay_DSTATE = FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  N1_end = (N1_end + FadecComputer_DWork.Delay_DSTATE) - FadecComputer_U.in.data.commanded_engine_N1_percent;
  if (rtb_y_i) {
    FadecComputer_DWork.Delay_DSTATE_n = FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition_p;
  }

  FadecComputer_DWork.Delay_DSTATE_n += FadecComputer_P.Gain_Gain_d * N1_end *
    FadecComputer_P.DiscreteTimeIntegratorVariableTs_Gain_l * FadecComputer_U.in.time.dt;
  if (FadecComputer_DWork.Delay_DSTATE_n > FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit_l) {
    FadecComputer_DWork.Delay_DSTATE_n = FadecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit_l;
  } else if (FadecComputer_DWork.Delay_DSTATE_n < FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit_d) {
    FadecComputer_DWork.Delay_DSTATE_n = FadecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit_d;
  }

  rtb_NOT1_f = !rtb_y_i;
  if (rtb_NOT1_f) {
    FadecComputer_DWork.Delay_DSTATE_l = FadecComputer_P.DiscreteTimeIntegratorVariableTs1_InitialCondition;
  }

  FadecComputer_DWork.Delay_DSTATE_l += FadecComputer_P.Gain1_Gain * N1_end *
    FadecComputer_P.DiscreteTimeIntegratorVariableTs1_Gain * FadecComputer_U.in.time.dt;
  if (FadecComputer_DWork.Delay_DSTATE_l > FadecComputer_P.DiscreteTimeIntegratorVariableTs1_UpperLimit) {
    FadecComputer_DWork.Delay_DSTATE_l = FadecComputer_P.DiscreteTimeIntegratorVariableTs1_UpperLimit;
  } else if (FadecComputer_DWork.Delay_DSTATE_l < FadecComputer_P.DiscreteTimeIntegratorVariableTs1_LowerLimit) {
    FadecComputer_DWork.Delay_DSTATE_l = FadecComputer_P.DiscreteTimeIntegratorVariableTs1_LowerLimit;
  }

  FadecComputer_Y.out.fadec_bus_output.n1_ref_percent.SSM = static_cast<uint32_T>
    (FadecComputer_P.EnumeratedConstant1_Value);
  FadecComputer_Y.out.fadec_bus_output.n1_ref_percent.Data = static_cast<real32_T>(rtb_N1c);
  FadecComputer_Y.out.fadec_bus_output.selected_tla_deg.SSM = static_cast<uint32_T>
    (FadecComputer_P.EnumeratedConstant1_Value);
  FadecComputer_Y.out.fadec_bus_output.selected_tla_deg.Data = static_cast<real32_T>(FadecComputer_U.in.input.TLA_deg);
  if (rtb_OR2) {
    FadecComputer_Y.out.fadec_bus_output.selected_flex_temp_deg.SSM = static_cast<uint32_T>
      (FadecComputer_P.EnumeratedConstant1_Value);
  } else {
    FadecComputer_Y.out.fadec_bus_output.selected_flex_temp_deg.SSM = static_cast<uint32_T>
      (FadecComputer_P.EnumeratedConstant_Value);
  }

  FadecComputer_MATLABFunction_p(&FadecComputer_U.in.fcu_input.fcu_flex_to_temp_deg_c,
    FadecComputer_P.A429ValueOrDefault_defaultValue_n, &rtb_y_ps);
  FadecComputer_Y.out.fadec_bus_output.selected_flex_temp_deg.Data = rtb_y_ps;
  FadecComputer_Y.out.fadec_bus_output.ecu_status_word_1.SSM = static_cast<uint32_T>
    (FadecComputer_P.EnumeratedConstant1_Value);
  FadecComputer_Y.out.fadec_bus_output.ecu_status_word_1.Data = FadecComputer_P.Constant2_Value_n;
  FadecComputer_Y.out.fadec_bus_output.ecu_status_word_2.SSM = static_cast<uint32_T>
    (FadecComputer_P.EnumeratedConstant1_Value);
  FadecComputer_Y.out.fadec_bus_output.ecu_status_word_2.Data = FadecComputer_P.Constant1_Value;
  rtb_VectorConcatenate[0] = FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[1] = FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[2] = FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[3] = FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[4] = (rtb_type == FadecComputer_P.EnumeratedConstant2_Value);
  rtb_VectorConcatenate[5] = FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[6] = FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[7] = FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[8] = FadecComputer_DWork.Memory_PreviousInput_p;
  rtb_VectorConcatenate[9] = FadecComputer_P.Constant_Value;
  FadecComputer_MATLABFunction_g(&FadecComputer_U.in.fcu_input.ats_discrete_word, FadecComputer_P.BitfromLabel5_bit_h,
    &rtb_y_jc);
  rtb_VectorConcatenate[10] = (rtb_y_jc != 0U);
  rtb_VectorConcatenate[11] = (rtb_type == athr_thrust_limit_type::TOGA);
  rtb_VectorConcatenate[12] = (rtb_type == athr_thrust_limit_type::FLEX);
  rtb_VectorConcatenate[13] = (rtb_type == athr_thrust_limit_type::MCT);
  rtb_VectorConcatenate[14] = (rtb_type == athr_thrust_limit_type::CLB);
  rtb_VectorConcatenate[15] = FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[16] = FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[17] = FadecComputer_P.Constant_Value;
  rtb_VectorConcatenate[18] = FadecComputer_P.Constant_Value;
  FadecComputer_MATLABFunction_l(rtb_VectorConcatenate, &FadecComputer_Y.out.fadec_bus_output.ecu_status_word_3.Data);
  FadecComputer_Y.out.fadec_bus_output.ecu_status_word_3.SSM = static_cast<uint32_T>
    (FadecComputer_P.EnumeratedConstant1_Value);
  FadecComputer_Y.out.fadec_bus_output.n1_limit_percent.SSM = static_cast<uint32_T>
    (FadecComputer_P.EnumeratedConstant1_Value);
  FadecComputer_Y.out.fadec_bus_output.n1_limit_percent.Data = static_cast<real32_T>(N1_begin);
  FadecComputer_Y.out.fadec_bus_output.n1_maximum_percent.SSM = static_cast<uint32_T>
    (FadecComputer_P.EnumeratedConstant1_Value);
  FadecComputer_Y.out.fadec_bus_output.n1_maximum_percent.Data = static_cast<real32_T>
    (FadecComputer_U.in.input.thrust_limit_TOGA_percent);
  FadecComputer_Y.out.fadec_bus_output.n1_command_percent.SSM = static_cast<uint32_T>
    (FadecComputer_P.EnumeratedConstant1_Value);
  FadecComputer_Y.out.fadec_bus_output.n1_command_percent.Data = static_cast<real32_T>(rtb_Switch2_idx_1);
  FadecComputer_Y.out.fadec_bus_output.selected_n2_actual_percent.SSM = static_cast<uint32_T>
    (FadecComputer_P.EnumeratedConstant1_Value);
  FadecComputer_Y.out.fadec_bus_output.selected_n2_actual_percent.Data = static_cast<real32_T>
    (FadecComputer_U.in.data.engine_N2_percent);
  FadecComputer_Y.out.fadec_bus_output.ecu_maintenance_word_6.Data = static_cast<real32_T>
    (FadecComputer_U.in.data.engine_N1_percent);
  FadecComputer_Y.out.fadec_bus_output.selected_n1_actual_percent.SSM = static_cast<uint32_T>
    (FadecComputer_P.EnumeratedConstant1_Value);
  FadecComputer_Y.out.fadec_bus_output.selected_n1_actual_percent.Data = static_cast<real32_T>
    (FadecComputer_U.in.data.engine_N1_percent);
  rtb_VectorConcatenate[0] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[1] = FadecComputer_DWork.Memory_PreviousInput_j;
  rtb_VectorConcatenate[2] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[3] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[4] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[5] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[6] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[7] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[8] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[9] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[10] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[11] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[12] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[13] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[14] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[15] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[16] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[17] = FadecComputer_P.Constant3_Value;
  rtb_VectorConcatenate[18] = FadecComputer_P.Constant3_Value;
  FadecComputer_MATLABFunction_l(rtb_VectorConcatenate,
    &FadecComputer_Y.out.fadec_bus_output.ecu_maintenance_word_6.Data);
  FadecComputer_Y.out.fadec_bus_output.ecu_maintenance_word_6.SSM = static_cast<uint32_T>
    (FadecComputer_P.EnumeratedConstant1_Value);
  FadecComputer_Y.out.fcu_input = FadecComputer_U.in.fcu_input;
  FadecComputer_Y.out.time = FadecComputer_U.in.time;
  FadecComputer_Y.out.data = FadecComputer_U.in.data;
  FadecComputer_Y.out.data_computed.TLA_in_active_range =
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_TLA_in_active_range;
  FadecComputer_Y.out.data_computed.is_FLX_active = rtb_OR2;
  FadecComputer_Y.out.data_computed.ATHR_disabled = FadecComputer_DWork.Memory_PreviousInput;
  FadecComputer_Y.out.data_computed.time_since_touchdown = rtb_Switch;
  FadecComputer_Y.out.input = FadecComputer_U.in.input;
  if (rtb_NOT1_f) {
    FadecComputer_Y.out.output.sim_throttle_lever_pos = FadecComputer_DWork.Delay_DSTATE_n;
  } else {
    FadecComputer_Y.out.output.sim_throttle_lever_pos = FadecComputer_DWork.Delay_DSTATE_l;
  }

  if (FadecComputer_U.in.input.TLA_deg < 0.0) {
    FadecComputer_Y.out.output.sim_thrust_mode = 1.0;
  } else if (FadecComputer_U.in.input.TLA_deg == 0.0) {
    FadecComputer_Y.out.output.sim_thrust_mode = 2.0;
  } else if ((FadecComputer_U.in.input.TLA_deg > 0.0) && (FadecComputer_U.in.input.TLA_deg < 25.0)) {
    FadecComputer_Y.out.output.sim_thrust_mode = 3.0;
  } else if ((FadecComputer_U.in.input.TLA_deg >= 25.0) && (FadecComputer_U.in.input.TLA_deg < 35.0)) {
    FadecComputer_Y.out.output.sim_thrust_mode = 4.0;
  } else if ((FadecComputer_U.in.input.TLA_deg >= 35.0) && (FadecComputer_U.in.input.TLA_deg < 45.0)) {
    FadecComputer_Y.out.output.sim_thrust_mode = 5.0;
  } else if (FadecComputer_U.in.input.TLA_deg == 45.0) {
    FadecComputer_Y.out.output.sim_thrust_mode = 6.0;
  } else {
    FadecComputer_Y.out.output.sim_thrust_mode = 0.0;
  }

  FadecComputer_Y.out.output.N1_TLA_percent = rtb_N1c;
  FadecComputer_Y.out.output.is_in_reverse = rtb_y_i;
  FadecComputer_Y.out.output.thrust_limit_type = rtb_type;
  FadecComputer_Y.out.output.thrust_limit_percent = N1_begin;
  FadecComputer_Y.out.output.N1_c_percent = rtb_Switch2_idx_1;
  FadecComputer_Y.out.output.athr_control_active = FadecComputer_DWork.Memory_PreviousInput_p;
  FadecComputer_Y.out.output.memo_thrust_active = FadecComputer_DWork.Memory_PreviousInput_j;
}

void FadecComputer::initialize()
{
  FadecComputer_DWork.Memory_PreviousInput = FadecComputer_P.SRFlipFlop_initial_condition;
  FadecComputer_DWork.Memory_PreviousInput_p = FadecComputer_P.SRFlipFlop_initial_condition_k;
  FadecComputer_DWork.Memory_PreviousInput_j = FadecComputer_P.SRFlipFlop1_initial_condition;
  FadecComputer_DWork.Delay_DSTATE = FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  FadecComputer_DWork.Delay_DSTATE_n = FadecComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition_p;
  FadecComputer_DWork.Delay_DSTATE_l = FadecComputer_P.DiscreteTimeIntegratorVariableTs1_InitialCondition;
}

void FadecComputer::terminate()
{
}

FadecComputer::FadecComputer():
  FadecComputer_U(),
  FadecComputer_Y(),
  FadecComputer_DWork()
{
}

FadecComputer::~FadecComputer() = default;
