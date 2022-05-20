#ifndef RTW_HEADER_SecComputer_h_
#define RTW_HEADER_SecComputer_h_
#include "rtwtypes.h"
#include "SecComputer_types.h"
#include "LateralDirectLaw.h"
#include "PitchAlternateLaw.h"
#include "PitchDirectLaw.h"

extern const real_T SecComputer_RGND;
extern base_sec_logic_outputs rtP_sec_logic_output_MATLABStruct;
extern base_sec_analog_outputs rtP_sec_analog_output_MATLABStruct;
extern base_sec_laws_outputs rtP_sec_laws_output_MATLABStruct;
extern base_sec_discrete_outputs rtP_sec_discrete_output_MATLABStruct;
class SecComputer final
{
 public:
  struct rtDW_RateLimiter_SecComputer_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct rtDW_MATLABFunction_SecComputer_g_T {
    real_T timeSinceCondition;
    boolean_T output;
  };

  struct rtDW_MATLABFunction_SecComputer_l_T {
    boolean_T output;
    boolean_T output_not_empty;
    boolean_T previousInput;
    boolean_T previousInput_not_empty;
  };

  struct D_Work_SecComputer_T {
    boolean_T Delay_DSTATE;
    boolean_T Delay1_DSTATE;
    boolean_T Delay1_DSTATE_i;
    boolean_T Delay_DSTATE_n;
    uint8_T is_active_c8_SecComputer;
    uint8_T is_c8_SecComputer;
    boolean_T Memory_PreviousInput;
    boolean_T Memory_PreviousInput_n;
    boolean_T pLeftStickDisabled;
    boolean_T pRightStickDisabled;
    boolean_T abnormalConditionWasActive;
    rtDW_MATLABFunction_SecComputer_l_T sf_MATLABFunction_nu;
    rtDW_MATLABFunction_SecComputer_l_T sf_MATLABFunction_g4;
    rtDW_MATLABFunction_SecComputer_g_T sf_MATLABFunction_j2;
    rtDW_MATLABFunction_SecComputer_g_T sf_MATLABFunction_g2;
    rtDW_MATLABFunction_SecComputer_g_T sf_MATLABFunction_h;
    rtDW_MATLABFunction_SecComputer_g_T sf_MATLABFunction_gf;
    rtDW_MATLABFunction_SecComputer_g_T sf_MATLABFunction_ndv;
    rtDW_MATLABFunction_SecComputer_l_T sf_MATLABFunction_nd;
    rtDW_MATLABFunction_SecComputer_l_T sf_MATLABFunction_n;
    rtDW_MATLABFunction_SecComputer_l_T sf_MATLABFunction_a;
    rtDW_MATLABFunction_SecComputer_l_T sf_MATLABFunction_e3;
    rtDW_MATLABFunction_SecComputer_g_T sf_MATLABFunction_eg;
    rtDW_MATLABFunction_SecComputer_g_T sf_MATLABFunction_gs;
    rtDW_MATLABFunction_SecComputer_g_T sf_MATLABFunction_c;
    rtDW_RateLimiter_SecComputer_T sf_RateLimiter_c;
    rtDW_RateLimiter_SecComputer_T sf_RateLimiter_d;
    rtDW_RateLimiter_SecComputer_T sf_RateLimiter_j;
    rtDW_RateLimiter_SecComputer_T sf_RateLimiter_f;
    rtDW_RateLimiter_SecComputer_T sf_RateLimiter_b;
    rtDW_RateLimiter_SecComputer_T sf_RateLimiter;
  };

  struct ExternalInputs_SecComputer_T {
    sec_inputs in;
  };

  struct ExternalOutputs_SecComputer_T {
    sec_outputs out;
  };

  struct Parameters_SecComputer_T {
    real_T RateLimiterVariableTs6_InitialCondition;
    real_T RateLimiterVariableTs1_InitialCondition;
    real_T RateLimiterVariableTs2_InitialCondition;
    real_T RateLimiterVariableTs3_InitialCondition;
    real_T RateLimiterVariableTs4_InitialCondition;
    real_T RateLimiterVariableTs5_InitialCondition;
    real_T BitfromLabel4_bit;
    real_T BitfromLabel6_bit;
    real_T BitfromLabel5_bit;
    real_T BitfromLabel7_bit;
    real_T BitfromLabel_bit;
    real_T BitfromLabel1_bit;
    real_T BitfromLabel4_bit_a;
    real_T BitfromLabel6_bit_d;
    real_T BitfromLabel5_bit_i;
    real_T BitfromLabel7_bit_m;
    real_T BitfromLabel_bit_g;
    real_T BitfromLabel2_bit;
    real_T BitfromLabel1_bit_a;
    real_T BitfromLabel3_bit;
    real_T BitfromLabel4_bit_m;
    real_T BitfromLabel5_bit_h;
    real_T BitfromLabel_bit_a;
    real_T BitfromLabel1_bit_c;
    real_T BitfromLabel2_bit_o;
    real_T BitfromLabel3_bit_j;
    real_T CompareToConstant3_const;
    real_T CompareToConstant4_const;
    real_T CompareToConstant_const;
    real_T CompareToConstant11_const;
    real_T CompareToConstant12_const;
    real_T CompareToConstant5_const;
    real_T CompareToConstant6_const;
    real_T CompareToConstant_const_m;
    real_T CompareToConstant15_const;
    real_T CompareToConstant1_const;
    real_T CompareToConstant2_const;
    real_T CompareToConstant3_const_a;
    real_T CompareToConstant4_const_j;
    real_T CompareToConstant13_const;
    real_T CompareToConstant14_const;
    real_T CompareToConstant10_const;
    real_T CompareToConstant7_const;
    real_T CompareToConstant16_const;
    real_T CompareToConstant17_const;
    real_T CompareToConstant18_const;
    real_T CompareToConstant8_const;
    real_T CompareToConstant9_const;
    real_T CompareToConstant2_const_f;
    real_T CompareToConstant3_const_o;
    real_T CompareToConstant1_const_p;
    real_T RateLimiterVariableTs6_lo;
    real_T RateLimiterVariableTs1_lo;
    real_T RateLimiterVariableTs2_lo;
    real_T RateLimiterVariableTs3_lo;
    real_T RateLimiterVariableTs4_lo;
    real_T RateLimiterVariableTs5_lo;
    real_T ConfirmNode_timeDelay;
    real_T ConfirmNode1_timeDelay;
    real_T ConfirmNode_timeDelay_l;
    real_T ConfirmNode_timeDelay_c;
    real_T ConfirmNode1_timeDelay_k;
    real_T ConfirmNode2_timeDelay;
    real_T ConfirmNode1_timeDelay_a;
    real_T ConfirmNode_timeDelay_a;
    real_T RateLimiterVariableTs6_up;
    real_T RateLimiterVariableTs1_up;
    real_T RateLimiterVariableTs2_up;
    real_T RateLimiterVariableTs3_up;
    real_T RateLimiterVariableTs4_up;
    real_T RateLimiterVariableTs5_up;
    SignStatusMatrix EnumeratedConstant_Value;
    SignStatusMatrix EnumeratedConstant1_Value;
    real32_T CompareToConstant_const_n;
    real32_T CompareToConstant1_const_d;
    real32_T CompareToConstant_const_k;
    boolean_T SRFlipFlop_initial_condition;
    boolean_T SRFlipFlop_initial_condition_k;
    boolean_T ConfirmNode_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge;
    boolean_T ConfirmNode_isRisingEdge_f;
    boolean_T ConfirmNode_isRisingEdge_a;
    boolean_T ConfirmNode1_isRisingEdge_j;
    boolean_T ConfirmNode2_isRisingEdge;
    boolean_T PulseNode_isRisingEdge;
    boolean_T PulseNode1_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge_k;
    boolean_T ConfirmNode_isRisingEdge_j;
    boolean_T PulseNode3_isRisingEdge;
    boolean_T PulseNode2_isRisingEdge;
    boolean_T PulseNode1_isRisingEdge_k;
    boolean_T PulseNode_isRisingEdge_h;
    base_sec_out_bus Constant4_Value;
    real_T Constant_Value;
    real_T Constant1_Value;
    real_T Constant2_Value;
    real_T Constant3_Value;
    real_T Gain_Gain;
    real_T Constant4_Value_k;
    real_T Constant5_Value;
    real_T uDLookupTable_tableData[5];
    real_T uDLookupTable_bp01Data[5];
    real_T Constant5_Value_m;
    real_T Constant6_Value;
    real_T Constant1_Value_d;
    real_T Constant2_Value_b;
    real_T Constant3_Value_f;
    real_T Constant4_Value_i;
    real_T Constant_Value_j;
    real_T Constant_Value_p;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Constant1_Value_p;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Saturation_UpperSat_n;
    real_T Saturation_LowerSat_n;
    real_T Saturation1_UpperSat_e;
    real_T Saturation1_LowerSat_f;
    real_T Saturation2_UpperSat;
    real_T Saturation2_LowerSat;
    real_T Saturation3_UpperSat;
    real_T Saturation3_LowerSat;
    real_T Constant_Value_a;
    real_T Constant_Value_h;
    real_T Constant2_Value_f;
    real32_T Gain_Gain_b;
    real32_T Gain1_Gain;
    real32_T Gain2_Gain;
    real32_T Gain3_Gain;
    real32_T Gain4_Gain;
    boolean_T Constant_Value_c;
    boolean_T Constant_Value_f;
    boolean_T Delay_InitialCondition;
    boolean_T Delay1_InitialCondition;
    boolean_T Logic_table[16];
    boolean_T Logic_table_i[16];
    boolean_T Delay1_InitialCondition_l;
    boolean_T Delay_InitialCondition_j;
    boolean_T Constant1_Value_g;
    boolean_T Constant2_Value_n;
    boolean_T Constant8_Value;
    boolean_T Constant7_Value;
    boolean_T Constant10_Value;
  };

  SecComputer(SecComputer const&) = delete;
  SecComputer& operator= (SecComputer const&) & = delete;
  SecComputer(SecComputer &&) = delete;
  SecComputer& operator= (SecComputer &&) = delete;
  void setExternalInputs(const ExternalInputs_SecComputer_T *pExternalInputs_SecComputer_T)
  {
    SecComputer_U = *pExternalInputs_SecComputer_T;
  }

  const ExternalOutputs_SecComputer_T &getExternalOutputs() const
  {
    return SecComputer_Y;
  }

  void initialize();
  void step();
  static void terminate();
  SecComputer();
  ~SecComputer();
 private:
  ExternalInputs_SecComputer_T SecComputer_U;
  ExternalOutputs_SecComputer_T SecComputer_Y;
  D_Work_SecComputer_T SecComputer_DWork;
  static Parameters_SecComputer_T SecComputer_P;
  static void SecComputer_MATLABFunction(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y);
  static void SecComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init, real_T
    *rty_Y, rtDW_RateLimiter_SecComputer_T *localDW);
  static void SecComputer_MATLABFunction_l(const base_arinc_429 *rtu_u, boolean_T *rty_y);
  static void SecComputer_MATLABFunction_c(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
    rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_SecComputer_g_T *localDW);
  static void SecComputer_MATLABFunction_e(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
    rtDW_MATLABFunction_SecComputer_l_T *localDW);
  static void SecComputer_MATLABFunction_cw(const boolean_T rtu_u[19], real32_T *rty_y);
  LateralDirectLaw LawMDLOBJ1;
  PitchAlternateLaw LawMDLOBJ2;
  PitchDirectLaw LawMDLOBJ3;
};

#endif

