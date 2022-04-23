#ifndef RTW_HEADER_SecComputer_h_
#define RTW_HEADER_SecComputer_h_
#include "rtwtypes.h"
#include "SecComputer_types.h"
#include "LateralDirectLaw.h"
#include "PitchAlternateLaw.h"
#include "PitchDirectLaw.h"

extern const real_T SecComputer_RGND;
extern const boolean_T SecComputer_BGND;
extern base_sec_analog_outputs rtP_sec_analog_output_MATLABStruct;
extern base_sec_laws_outputs rtP_sec_laws_output_MATLABStruct;
extern base_sec_discrete_outputs rtP_sec_discrete_output_MATLABStruct;
class SecComputer final
{
 public:
  struct rtDW_MATLABFunction_SecComputer_T {
    real_T timeSinceCondition;
    boolean_T output;
  };

  struct rtDW_MATLABFunction_SecComputer_b_T {
    boolean_T output;
    boolean_T previousInput;
    boolean_T previousInput_not_empty;
  };

  struct D_Work_SecComputer_T {
    boolean_T Delay_DSTATE;
    boolean_T Delay1_DSTATE;
    uint8_T is_active_c8_SecComputer;
    uint8_T is_c8_SecComputer;
    boolean_T pLeftStickDisabled;
    boolean_T pRightStickDisabled;
    rtDW_MATLABFunction_SecComputer_b_T sf_MATLABFunction_n;
    rtDW_MATLABFunction_SecComputer_b_T sf_MATLABFunction_g4;
    rtDW_MATLABFunction_SecComputer_T sf_MATLABFunction_j;
    rtDW_MATLABFunction_SecComputer_T sf_MATLABFunction_g2;
    rtDW_MATLABFunction_SecComputer_T sf_MATLABFunction_h;
    rtDW_MATLABFunction_SecComputer_T sf_MATLABFunction_g;
    rtDW_MATLABFunction_SecComputer_T sf_MATLABFunction;
  };

  struct ExternalInputs_SecComputer_T {
    sec_inputs in;
  };

  struct ExternalOutputs_SecComputer_T {
    sec_outputs out;
  };

  struct Parameters_SecComputer_T {
    real_T CompareToConstant2_const;
    real_T CompareToConstant3_const;
    real_T CompareToConstant1_const;
    real_T ConfirmNode_timeDelay;
    real_T ConfirmNode1_timeDelay;
    real_T ConfirmNode2_timeDelay;
    real_T ConfirmNode1_timeDelay_a;
    real_T ConfirmNode_timeDelay_a;
    SignStatusMatrix EnumeratedConstant_Value;
    SignStatusMatrix EnumeratedConstant1_Value;
    boolean_T ConfirmNode_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge;
    boolean_T ConfirmNode2_isRisingEdge;
    boolean_T PulseNode_isRisingEdge;
    boolean_T PulseNode1_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge_k;
    boolean_T ConfirmNode_isRisingEdge_j;
    base_sec_logic_outputs Constant1_Value;
    base_sec_out_bus Constant4_Value;
    real_T Constant5_Value;
    real_T Constant6_Value;
    real_T Constant1_Value_d;
    real_T Constant2_Value;
    real_T Constant3_Value;
    real_T Constant4_Value_i;
    real_T Constant_Value;
    real_T Constant_Value_p;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Constant1_Value_p;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Constant1_Value_a;
    real_T Constant_Value_c;
    real_T Gain_Gain;
    real_T Gain4_Gain;
    real_T Bias_Bias;
    real_T Gain_Gain_p;
    real_T Gain1_Gain;
    real_T Gain3_Gain;
    real_T Constant_Value_a;
    real_T Constant_Value_o;
    real_T Gain2_Gain;
    real32_T Gain_Gain_b;
    real32_T Gain1_Gain_f;
    real32_T Gain2_Gain_c;
    real32_T Gain3_Gain_g;
    real32_T Gain4_Gain_l;
    boolean_T Constant_Value_l;
    boolean_T Delay_InitialCondition;
    boolean_T Delay1_InitialCondition;
    boolean_T Constant1_Value_g;
    boolean_T Constant_Value_i;
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
  static void SecComputer_MATLABFunction(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
    rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_SecComputer_T *localDW);
  static void SecComputer_MATLABFunction_g(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
    rtDW_MATLABFunction_SecComputer_b_T *localDW);
  static void SecComputer_MATLABFunction_c(const boolean_T rtu_u[19], real32_T *rty_y);
  LateralDirectLaw LawMDLOBJ1;
  PitchAlternateLaw LawMDLOBJ2;
  PitchDirectLaw LawMDLOBJ3;
};

#endif

