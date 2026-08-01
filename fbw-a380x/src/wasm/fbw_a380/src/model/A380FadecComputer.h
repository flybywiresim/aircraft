#ifndef A380FadecComputer_h_
#define A380FadecComputer_h_
#include "rtwtypes.h"
#include "A380FadecComputer_types.h"

extern const base_arinc_429 A380FadecComputer_rtZbase_arinc_429;
class A380FadecComputer final
{
 public:
  struct rtDW_TimeSinceCondition_A380FadecComputer_T {
    real_T eventTime;
    boolean_T eventTime_not_empty;
  };

  struct rtDW_MATLABFunction_A380FadecComputer_m_T {
    boolean_T previousInput;
    boolean_T previousInput_not_empty;
  };

  struct D_Work_A380FadecComputer_T {
    real_T Delay_DSTATE;
    real_T Delay_DSTATE_n;
    real_T Delay_DSTATE_l;
    real_T pU;
    boolean_T Memory_PreviousInput;
    boolean_T Memory_PreviousInput_p;
    boolean_T Memory_PreviousInput_j;
    boolean_T pU_not_empty;
    boolean_T latch;
    rtDW_MATLABFunction_A380FadecComputer_m_T sf_MATLABFunction_b;
    rtDW_MATLABFunction_A380FadecComputer_m_T sf_MATLABFunction_f;
    rtDW_TimeSinceCondition_A380FadecComputer_T sf_TimeSinceCondition1;
    rtDW_TimeSinceCondition_A380FadecComputer_T sf_TimeSinceCondition;
  };

  struct ExternalInputs_A380FadecComputer_T {
    athr_in in;
  };

  struct ExternalOutputs_A380FadecComputer_T {
    athr_out out;
  };

  struct Parameters_A380FadecComputer_T {
    real_T DiscreteTimeIntegratorVariableTs_Gain;
    real_T DiscreteTimeIntegratorVariableTs_Gain_l;
    real_T DiscreteTimeIntegratorVariableTs1_Gain;
    real_T DiscreteTimeIntegratorVariableTs_InitialCondition;
    real_T DiscreteTimeIntegratorVariableTs_InitialCondition_p;
    real_T DiscreteTimeIntegratorVariableTs1_InitialCondition;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit_d;
    real_T DiscreteTimeIntegratorVariableTs1_LowerLimit;
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit;
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit_l;
    real_T DiscreteTimeIntegratorVariableTs1_UpperLimit;
    real_T BitfromLabel6_bit;
    real_T BitfromLabel7_bit;
    real_T BitfromLabel_bit;
    real_T BitfromLabel4_bit;
    real_T BitfromLabel5_bit;
    real_T BitfromLabel_bit_g;
    real_T BitfromLabel1_bit;
    real_T BitfromLabel3_bit;
    real_T BitfromLabel2_bit;
    real_T BitfromLabel5_bit_h;
    real_T CompareToConstant_const;
    real_T CompareToConstant1_const;
    SignStatusMatrix EnumeratedConstant1_Value;
    SignStatusMatrix EnumeratedConstant_Value;
    athr_thrust_limit_type EnumeratedConstant2_Value;
    real32_T A429ValueOrDefault_defaultValue;
    real32_T A429ValueOrDefault_defaultValue_a;
    real32_T A429ValueOrDefault_defaultValue_n;
    boolean_T SRFlipFlop_initial_condition;
    boolean_T SRFlipFlop_initial_condition_k;
    boolean_T SRFlipFlop1_initial_condition;
    boolean_T PulseNode_isRisingEdge;
    boolean_T PulseNode1_isRisingEdge;
    base_eec Constant2_Value;
    athr_output Constant1_Value;
    athr_data_computed Constant_Value;
    real_T Gain_Gain;
    real_T Gain_Gain_d;
    real_T Gain1_Gain;
    real32_T Constant2_Value_n;
    real32_T Constant1_Value_h;
    boolean_T Logic_table[16];
    boolean_T Logic_table_n[16];
    boolean_T Logic_table_h[16];
    boolean_T Constant_Value_b;
    boolean_T Constant4_Value;
    boolean_T Constant3_Value;
  };

  A380FadecComputer(A380FadecComputer const&) = delete;
  A380FadecComputer& operator= (A380FadecComputer const&) & = delete;
  A380FadecComputer(A380FadecComputer &&) = delete;
  A380FadecComputer& operator= (A380FadecComputer &&) = delete;
  void setExternalInputs(const ExternalInputs_A380FadecComputer_T *pExternalInputs_A380FadecComputer_T)
  {
    A380FadecComputer_U = *pExternalInputs_A380FadecComputer_T;
  }

  const ExternalOutputs_A380FadecComputer_T &getExternalOutputs() const
  {
    return A380FadecComputer_Y;
  }

  void initialize();
  void step();
  static void terminate();
  A380FadecComputer();
  ~A380FadecComputer();
 private:
  ExternalInputs_A380FadecComputer_T A380FadecComputer_U;
  ExternalOutputs_A380FadecComputer_T A380FadecComputer_Y;
  D_Work_A380FadecComputer_T A380FadecComputer_DWork;
  static Parameters_A380FadecComputer_T A380FadecComputer_P;
  static void A380FadecComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y);
  static void A380FadecComputer_MATLABFunction_p(const base_arinc_429 *rtu_u, real32_T rtu_default, real32_T *rty_y);
  static void A380FadecComputer_TimeSinceCondition(real_T rtu_time, boolean_T rtu_condition, real_T *rty_y,
    rtDW_TimeSinceCondition_A380FadecComputer_T *localDW);
  static void A380FadecComputer_MATLABFunction_g(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y);
  static void A380FadecComputer_MATLABFunction_l(const boolean_T rtu_u[19], real32_T *rty_y);
  static void A380FadecComputer_MATLABFunction_f(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
    rtDW_MATLABFunction_A380FadecComputer_m_T *localDW);
  static void A380FadecComputer_MATLABFunction_o(const base_arinc_429 *rtu_u, boolean_T *rty_y);
};

#endif

