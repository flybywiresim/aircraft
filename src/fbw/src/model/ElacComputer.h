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
extern base_elac_logic_outputs rtP_elac_logic_output_MATLABStruct;
extern base_elac_laws_outputs rtP_elac_laws_output_MATLABStruct;
extern base_elac_analog_outputs rtP_elac_analog_output_MATLABStruct;
extern base_elac_discrete_outputs rtP_elac_discrete_output_MATLABStruct;
class ElacComputer final
{
 public:
  struct rtDW_RateLimiter_ElacComputer_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct rtDW_MATLABFunction_ElacComputer_f_T {
    real_T timeSinceCondition;
    boolean_T output;
  };

  struct rtDW_MATLABFunction_ElacComputer_o_T {
    boolean_T output;
  };

  struct rtDW_MATLABFunction_ElacComputer_b_T {
    boolean_T output;
    boolean_T output_not_empty;
    boolean_T previousInput;
    boolean_T previousInput_not_empty;
  };

  struct D_Work_ElacComputer_T {
    boolean_T Delay_DSTATE;
    boolean_T Delay1_DSTATE;
    boolean_T Memory_PreviousInput;
    boolean_T Memory_PreviousInput_n;
    boolean_T Memory_PreviousInput_o;
    boolean_T Memory_PreviousInput_a;
    boolean_T Memory_PreviousInput_p;
    boolean_T Memory_PreviousInput_l;
    boolean_T Memory_PreviousInput_h;
    boolean_T Memory_PreviousInput_i;
    boolean_T Memory_PreviousInput_lo;
    boolean_T pLeftStickDisabled;
    boolean_T pRightStickDisabled;
    boolean_T ra1CoherenceRejected;
    boolean_T ra2CoherenceRejected;
    boolean_T abnormalConditionWasActive;
    rtDW_MATLABFunction_ElacComputer_b_T sf_MATLABFunction_nu;
    rtDW_MATLABFunction_ElacComputer_b_T sf_MATLABFunction_g4b;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_j2;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_g24;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_lf;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_jl;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_jz;
    rtDW_MATLABFunction_ElacComputer_o_T sf_MATLABFunction_br;
    rtDW_MATLABFunction_ElacComputer_o_T sf_MATLABFunction_jg;
    rtDW_MATLABFunction_ElacComputer_o_T sf_MATLABFunction_mi;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_gfx;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_g2;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_c;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_o;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_ei;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_h;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_b;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_k;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_pu;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_a;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_e;
    rtDW_MATLABFunction_ElacComputer_f_T sf_MATLABFunction_d;
    rtDW_RateLimiter_ElacComputer_T sf_RateLimiter_b;
    rtDW_RateLimiter_ElacComputer_T sf_RateLimiter_c;
    rtDW_RateLimiter_ElacComputer_T sf_RateLimiter_j;
    rtDW_RateLimiter_ElacComputer_T sf_RateLimiter;
  };

  struct ExternalInputs_ElacComputer_T {
    elac_inputs in;
  };

  struct ExternalOutputs_ElacComputer_T {
    elac_outputs out;
  };

  struct Parameters_ElacComputer_T {
    real_T RateLimiterVariableTs2_InitialCondition;
    real_T RateLimiterVariableTs3_InitialCondition;
    real_T RateLimiterVariableTs_InitialCondition;
    real_T RateLimiterVariableTs1_InitialCondition;
    real_T BitfromLabel_bit;
    real_T BitfromLabel1_bit;
    real_T BitfromLabel2_bit;
    real_T BitfromLabel3_bit;
    real_T BitfromLabel5_bit;
    real_T BitfromLabel4_bit;
    real_T BitfromLabel6_bit;
    real_T BitfromLabel7_bit;
    real_T BitfromLabel8_bit;
    real_T BitfromLabel_bit_h;
    real_T BitfromLabel1_bit_e;
    real_T BitfromLabel2_bit_k;
    real_T BitfromLabel3_bit_m;
    real_T BitfromLabel_bit_e;
    real_T SourceMonitoringbyVote_confirmTime;
    real_T SourceMonitoringbyVote1_confirmTime;
    real_T AlphaMonitoring_confirmTime;
    real_T CompareToConstant_const;
    real_T CompareToConstant_const_m;
    real_T CompareToConstant_const_f;
    real_T CompareToConstant2_const;
    real_T CompareToConstant3_const;
    real_T CompareToConstant1_const;
    real_T CompareToConstant1_const_d;
    real_T HysteresisNode2_highTrigger;
    real_T HysteresisNode1_highTrigger;
    real_T HysteresisNode3_highTrigger;
    real_T RateLimiterVariableTs2_lo;
    real_T RateLimiterVariableTs3_lo;
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs1_lo;
    real_T HysteresisNode2_lowTrigger;
    real_T HysteresisNode1_lowTrigger;
    real_T HysteresisNode3_lowTrigger;
    real_T SourceMonitoringbyVote_threshold;
    real_T SourceMonitoringbyVote1_threshold;
    real_T AlphaMonitoring_threshold;
    real_T ConfirmNode_timeDelay;
    real_T ConfirmNode2_timeDelay;
    real_T ConfirmNode1_timeDelay;
    real_T ConfirmNode_timeDelay_n;
    real_T ConfirmNode1_timeDelay_h;
    real_T ConfirmNode2_timeDelay_k;
    real_T ConfirmNode1_timeDelay_a;
    real_T ConfirmNode_timeDelay_a;
    real_T RateLimiterVariableTs2_up;
    real_T RateLimiterVariableTs3_up;
    real_T RateLimiterVariableTs_up;
    real_T RateLimiterVariableTs1_up;
    SignStatusMatrix EnumeratedConstant_Value;
    SignStatusMatrix EnumeratedConstant1_Value;
    lateral_efcs_law EnumeratedConstant2_Value;
    real32_T CompareToConstant_const_l;
    boolean_T SRFlipFlop2_initial_condition;
    boolean_T SRFlipFlop1_initial_condition;
    boolean_T SRFlipFlop_initial_condition;
    boolean_T SRFlipFlop2_initial_condition_a;
    boolean_T SRFlipFlop1_initial_condition_j;
    boolean_T SRFlipFlop_initial_condition_j;
    boolean_T SRFlipFlop2_initial_condition_o;
    boolean_T SRFlipFlop1_initial_condition_p;
    boolean_T SRFlipFlop_initial_condition_k;
    boolean_T ConfirmNode_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge;
    boolean_T ConfirmNode2_isRisingEdge;
    boolean_T ConfirmNode_isRisingEdge_j;
    boolean_T ConfirmNode1_isRisingEdge_h;
    boolean_T ConfirmNode2_isRisingEdge_f;
    boolean_T ConfirmNode_isRisingEdge_n;
    boolean_T ConfirmNode1_isRisingEdge_g;
    boolean_T ConfirmNode2_isRisingEdge_j;
    boolean_T ConfirmNode_isRisingEdge_jm;
    boolean_T ConfirmNode2_isRisingEdge_g;
    boolean_T ConfirmNode1_isRisingEdge_a;
    boolean_T ConfirmNode_isRisingEdge_k;
    boolean_T ConfirmNode1_isRisingEdge_i;
    boolean_T ConfirmNode2_isRisingEdge_j3;
    boolean_T PulseNode_isRisingEdge;
    boolean_T PulseNode1_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge_k;
    boolean_T ConfirmNode_isRisingEdge_jw;
    base_elac_out_bus Constant4_Value;
    real_T Bias_Bias;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Gain2_Gain;
    real_T Constant2_Value;
    real_T Constant1_Value;
    real_T Constant4_Value_a;
    real_T Constant3_Value;
    real_T Gain_Gain;
    real_T Constant5_Value;
    real_T Constant6_Value;
    real_T Constant7_Value;
    real_T Constant1_Value_d;
    real_T Constant2_Value_b;
    real_T Constant3_Value_f;
    real_T Constant4_Value_i;
    real_T Constant_Value;
    real_T Constant_Value_p;
    real_T Saturation_UpperSat_d;
    real_T Saturation_LowerSat_h;
    real_T Constant1_Value_p;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Constant_Value_c;
    real_T Saturation1_UpperSat_g;
    real_T Saturation1_LowerSat_n;
    real_T Saturation2_UpperSat;
    real_T Saturation2_LowerSat;
    real_T Gain1_Gain;
    real_T Constant_Value_a;
    real_T Constant_Value_b;
    real_T Switch13_Threshold;
    real_T Switch12_Threshold;
    real32_T Gain_Gain_b;
    real32_T Gain1_Gain_f;
    real32_T Gain2_Gain_c;
    real32_T Gain3_Gain;
    real32_T Gain4_Gain;
    boolean_T Constant5_Value_d;
    boolean_T Logic_table[16];
    boolean_T Logic_table_a[16];
    boolean_T Logic_table_n[16];
    boolean_T Constant5_Value_p;
    boolean_T Logic_table_d[16];
    boolean_T Logic_table_e[16];
    boolean_T Logic_table_g[16];
    boolean_T Constant5_Value_c;
    boolean_T Logic_table_g0[16];
    boolean_T Logic_table_e1[16];
    boolean_T Logic_table_n4[16];
    boolean_T Constant_Value_j;
    boolean_T Delay_InitialCondition;
    boolean_T Delay1_InitialCondition;
    boolean_T Constant_Value_i;
    boolean_T Constant1_Value_e;
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
  static void ElacComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
    real_T *rty_Y, rtDW_RateLimiter_ElacComputer_T *localDW);
  static void ElacComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y);
  static void ElacComputer_MATLABFunction_d(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
    rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_ElacComputer_f_T *localDW);
  static void ElacComputer_Voter(real32_T rtu_u, real32_T rtu_u_k, real32_T rtu_u_d, real32_T *rty_y);
  static void ElacComputer_MATLABFunction_o(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y);
  static void ElacComputer_MATLABFunction_m(real_T rtu_u, real_T rtu_highTrigger, real_T rtu_lowTrigger, boolean_T
    *rty_y, rtDW_MATLABFunction_ElacComputer_o_T *localDW);
  static void ElacComputer_MATLABFunction_g(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
    rtDW_MATLABFunction_ElacComputer_b_T *localDW);
  static void ElacComputer_MATLABFunction_c(const boolean_T rtu_u[19], real32_T *rty_y);
  static void ElacComputer_LateralLawCaptoBits(lateral_efcs_law rtu_law, boolean_T *rty_bit1, boolean_T *rty_bit2);
  LateralDirectLaw LawMDLOBJ1;
  LateralNormalLaw LawMDLOBJ2;
  PitchAlternateLaw LawMDLOBJ3;
  PitchDirectLaw LawMDLOBJ4;
  PitchNormalLaw LawMDLOBJ5;
};

#endif

