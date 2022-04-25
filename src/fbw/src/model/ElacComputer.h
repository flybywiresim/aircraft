#ifndef RTW_HEADER_ElacComputer_h_
#define RTW_HEADER_ElacComputer_h_
#include "rtwtypes.h"
#include "ElacComputer_types.h"
#include "LateralNormalLaw.h"
#include "LateralDirectLaw.h"
#include "PitchNormalLaw.h"
#include "PitchAlternateLaw.h"
#include "PitchDirectLaw.h"

extern const real_T ElacComputer_RGND;
extern const boolean_T ElacComputer_BGND;
extern base_elac_laws_outputs rtP_elac_laws_output_MATLABStruct;
extern base_elac_analog_outputs rtP_elac_analog_output_MATLABStruct;
extern base_elac_discrete_outputs rtP_elac_discrete_output_MATLABStruct;
class ElacComputer final
{
 public:
  struct rtDW_MATLABFunction_ElacComputer_k_T {
    real_T timeSinceCondition;
    boolean_T output;
  };

  struct rtDW_MATLABFunction_ElacComputer_o_T {
    boolean_T output;
  };

  struct rtDW_MATLABFunction_ElacComputer_b_T {
    boolean_T output;
    boolean_T previousInput;
    boolean_T previousInput_not_empty;
  };

  struct D_Work_ElacComputer_T {
    boolean_T Delay_DSTATE;
    boolean_T Delay1_DSTATE;
    uint8_T is_active_c8_ElacComputer;
    uint8_T is_c8_ElacComputer;
    boolean_T pLeftStickDisabled;
    boolean_T pRightStickDisabled;
    rtDW_MATLABFunction_ElacComputer_b_T sf_MATLABFunction_nu;
    rtDW_MATLABFunction_ElacComputer_b_T sf_MATLABFunction_g4;
    rtDW_MATLABFunction_ElacComputer_k_T sf_MATLABFunction_j2;
    rtDW_MATLABFunction_ElacComputer_k_T sf_MATLABFunction_g2;
    rtDW_MATLABFunction_ElacComputer_o_T sf_MATLABFunction_br;
    rtDW_MATLABFunction_ElacComputer_o_T sf_MATLABFunction_jg;
    rtDW_MATLABFunction_ElacComputer_o_T sf_MATLABFunction_m;
    rtDW_MATLABFunction_ElacComputer_k_T sf_MATLABFunction_gf;
    rtDW_MATLABFunction_ElacComputer_k_T sf_MATLABFunction_g;
    rtDW_MATLABFunction_ElacComputer_k_T sf_MATLABFunction_c;
  };

  struct ExternalInputs_ElacComputer_T {
    elac_inputs in;
  };

  struct ExternalOutputs_ElacComputer_T {
    elac_outputs out;
  };

  struct Parameters_ElacComputer_T {
    real_T BitfromLabel_bit;
    real_T BitfromLabel1_bit;
    real_T BitfromLabel2_bit;
    real_T BitfromLabel3_bit;
    real_T CompareToConstant_const;
    real_T CompareToConstant_const_f;
    real_T CompareToConstant2_const;
    real_T CompareToConstant3_const;
    real_T CompareToConstant1_const;
    real_T CompareToConstant1_const_d;
    real_T HysteresisNode2_highTrigger;
    real_T HysteresisNode1_highTrigger;
    real_T HysteresisNode3_highTrigger;
    real_T HysteresisNode2_lowTrigger;
    real_T HysteresisNode1_lowTrigger;
    real_T HysteresisNode3_lowTrigger;
    real_T ConfirmNode_timeDelay;
    real_T ConfirmNode1_timeDelay;
    real_T ConfirmNode2_timeDelay;
    real_T ConfirmNode1_timeDelay_a;
    real_T ConfirmNode_timeDelay_a;
    SignStatusMatrix EnumeratedConstant_Value;
    SignStatusMatrix EnumeratedConstant1_Value;
    lateral_efcs_law EnumeratedConstant2_Value;
    boolean_T ConfirmNode_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge;
    boolean_T ConfirmNode2_isRisingEdge;
    boolean_T PulseNode_isRisingEdge;
    boolean_T PulseNode1_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge_k;
    boolean_T ConfirmNode_isRisingEdge_j;
    base_elac_logic_outputs Constant1_Value;
    base_elac_out_bus Constant4_Value;
    real_T Bias_Bias;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Gain2_Gain;
    real_T Gain_Gain;
    real_T Constant5_Value;
    real_T Constant6_Value;
    real_T Constant7_Value;
    real_T Constant1_Value_d;
    real_T Constant2_Value;
    real_T Constant3_Value;
    real_T Constant4_Value_i;
    real_T Constant_Value;
    real_T Constant_Value_p;
    real_T Saturation_UpperSat_d;
    real_T Saturation_LowerSat_h;
    real_T Constant1_Value_p;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Gain_Gain_m;
    real_T Gain2_Gain_g;
    real_T Gain1_Gain;
    real_T Constant_Value_c;
    real_T Gain1_Gain_b;
    real_T Gain4_Gain;
    real_T Bias_Bias_i;
    real_T Gain_Gain_a;
    real_T Gain1_Gain_p;
    real_T Gain2_Gain_c;
    real_T Gain3_Gain;
    real_T Gain4_Gain_o;
    real_T Bias_Bias_m;
    real_T Gain_Gain_ab;
    real_T Gain1_Gain_n;
    real_T Gain3_Gain_n;
    real_T Constant_Value_a;
    real_T Switch13_Threshold;
    real_T Switch12_Threshold;
    real_T Gain2_Gain_d;
    real32_T Gain_Gain_b;
    real32_T Gain1_Gain_f;
    real32_T Gain2_Gain_cb;
    real32_T Gain3_Gain_g;
    real32_T Gain4_Gain_l;
    boolean_T Delay_InitialCondition;
    boolean_T Delay1_InitialCondition;
    boolean_T Constant_Value_i;
    boolean_T Constant1_Value_e;
    boolean_T Constant_Value_h;
    boolean_T Constant8_Value;
    boolean_T Constant9_Value;
    boolean_T Constant10_Value;
  };

  ElacComputer(ElacComputer const&) = delete;
  ElacComputer& operator= (ElacComputer const&) & = delete;
  ElacComputer(ElacComputer &&) = delete;
  ElacComputer& operator= (ElacComputer &&) = delete;
  void setExternalInputs(const ExternalInputs_ElacComputer_T *pExternalInputs_ElacComputer_T)
  {
    ElacComputer_U = *pExternalInputs_ElacComputer_T;
  }

  const ExternalOutputs_ElacComputer_T &getExternalOutputs() const
  {
    return ElacComputer_Y;
  }

  void initialize();
  void step();
  static void terminate();
  ElacComputer();
  ~ElacComputer();
 private:
  ExternalInputs_ElacComputer_T ElacComputer_U;
  ExternalOutputs_ElacComputer_T ElacComputer_Y;
  D_Work_ElacComputer_T ElacComputer_DWork;
  static Parameters_ElacComputer_T ElacComputer_P;
  static void ElacComputer_MATLABFunction(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y);
  static void ElacComputer_MATLABFunction_c(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
    rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_ElacComputer_k_T *localDW);
  static void ElacComputer_MATLABFunction_m(real_T rtu_u, real_T rtu_highTrigger, real_T rtu_lowTrigger, boolean_T
    *rty_y, rtDW_MATLABFunction_ElacComputer_o_T *localDW);
  static void ElacComputer_MATLABFunction_g(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
    rtDW_MATLABFunction_ElacComputer_b_T *localDW);
  static void ElacComputer_MATLABFunction_cw(const boolean_T rtu_u[19], real32_T *rty_y);
  static void ElacComputer_LateralLawCaptoBits(lateral_efcs_law rtu_law, boolean_T *rty_bit1, boolean_T *rty_bit2);
  LateralDirectLaw LawMDLOBJ1;
  LateralNormalLaw LawMDLOBJ2;
  PitchAlternateLaw LawMDLOBJ3;
  PitchDirectLaw LawMDLOBJ4;
  PitchNormalLaw LawMDLOBJ5;
};

#endif

