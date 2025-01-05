#ifndef ElacComputer_h_
#define ElacComputer_h_
#include "rtwtypes.h"
#include "ElacComputer_types.h"
#include "LateralNormalLaw.h"
#include "LateralDirectLaw.h"
#include "PitchNormalLaw.h"
#include "PitchAlternateLaw.h"
#include "PitchDirectLaw.h"

extern const real_T ElacComputer_RGND;
extern base_elac_logic_outputs rtP_elac_logic_output_MATLABStruct;
extern base_elac_analog_outputs rtP_elac_analog_output_MATLABStruct;
extern base_elac_discrete_outputs rtP_elac_discrete_output_MATLABStruct;
class ElacComputer final
{
 public:
  struct rtDW_RateLimiter_ElacComputer_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct rtDW_RateLimiter_ElacComputer_g_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct rtDW_LagFilter_ElacComputer_T {
    real_T pY;
    real_T pU;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
  };

  struct rtDW_MATLABFunction_ElacComputer_kz_T {
    real_T timeSinceCondition;
    boolean_T output;
  };

  struct rtDW_MATLABFunction_ElacComputer_o_T {
    boolean_T output;
  };

  struct rtDW_RateLimiter_ElacComputer_b_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct rtDW_MATLABFunction_ElacComputer_b_T {
    boolean_T previousInput;
    boolean_T previousInput_not_empty;
  };

  struct BlockIO_ElacComputer_T {
    real_T in_flight;
  };

  struct D_Work_ElacComputer_T {
    real_T Delay_DSTATE;
    real_T Delay_DSTATE_b;
    real_T Delay_DSTATE_c;
    real_T configFullEventTime;
    real_T eventTime;
    real_T resetEventTime;
    real_T eventTime_p;
    real_T on_ground_time;
    boolean_T Delay_DSTATE_cc;
    boolean_T Delay1_DSTATE;
    uint8_T is_active_c28_ElacComputer;
    uint8_T is_c28_ElacComputer;
    uint8_T is_active_c30_ElacComputer;
    uint8_T is_c30_ElacComputer;
    boolean_T Memory_PreviousInput;
    boolean_T icLoad;
    boolean_T pLeftStickDisabled;
    boolean_T pRightStickDisabled;
    boolean_T configFullEventTime_not_empty;
    boolean_T ra1CoherenceRejected;
    boolean_T ra2CoherenceRejected;
    boolean_T sProtActive;
    boolean_T eventTime_not_empty;
    boolean_T resetEventTime_not_empty;
    boolean_T sProtActive_f;
    boolean_T eventTime_not_empty_i;
    boolean_T abnormalConditionWasActive;
    boolean_T Runtime_MODE;
    rtDW_MATLABFunction_ElacComputer_kz_T sf_MATLABFunction_fb;
    rtDW_MATLABFunction_ElacComputer_b_T sf_MATLABFunction_l0;
    rtDW_MATLABFunction_ElacComputer_b_T sf_MATLABFunction_nu;
    rtDW_MATLABFunction_ElacComputer_b_T sf_MATLABFunction_g4;
    rtDW_MATLABFunction_ElacComputer_kz_T sf_MATLABFunction_j2;
    rtDW_MATLABFunction_ElacComputer_kz_T sf_MATLABFunction_g24;
    rtDW_MATLABFunction_ElacComputer_kz_T sf_MATLABFunction_lf;
    rtDW_MATLABFunction_ElacComputer_kz_T sf_MATLABFunction_jl;
    rtDW_MATLABFunction_ElacComputer_kz_T sf_MATLABFunction_jz;
    rtDW_RateLimiter_ElacComputer_b_T sf_RateLimiter_m;
    rtDW_RateLimiter_ElacComputer_b_T sf_RateLimiter_n;
    rtDW_MATLABFunction_ElacComputer_kz_T sf_MATLABFunction_nb;
    rtDW_MATLABFunction_ElacComputer_o_T sf_MATLABFunction_br;
    rtDW_MATLABFunction_ElacComputer_o_T sf_MATLABFunction_jg;
    rtDW_MATLABFunction_ElacComputer_o_T sf_MATLABFunction_mi;
    rtDW_MATLABFunction_ElacComputer_kz_T sf_MATLABFunction_gfx;
    rtDW_MATLABFunction_ElacComputer_kz_T sf_MATLABFunction_g2;
    rtDW_MATLABFunction_ElacComputer_kz_T sf_MATLABFunction_cj;
    rtDW_LagFilter_ElacComputer_T sf_LagFilter_a;
    rtDW_LagFilter_ElacComputer_T sf_LagFilter;
    rtDW_RateLimiter_ElacComputer_g_T sf_RateLimiter_p;
    rtDW_RateLimiter_ElacComputer_g_T sf_RateLimiter_a;
    rtDW_RateLimiter_ElacComputer_T sf_RateLimiter_b;
    rtDW_RateLimiter_ElacComputer_T sf_RateLimiter;
  };

  struct ExternalInputs_ElacComputer_T {
    elac_inputs in;
  };

  struct ExternalOutputs_ElacComputer_T {
    elac_outputs out;
  };

  struct Parameters_ElacComputer_T {
    real_T LagFilter_C1;
    real_T LagFilter_C1_e;
    real_T DiscreteDerivativeVariableTs_Gain;
    real_T DiscreteTimeIntegratorVariableTsLimit_Gain;
    real_T RateLimiterVariableTs2_InitialCondition;
    real_T RateLimiterVariableTs3_InitialCondition;
    real_T DiscreteDerivativeVariableTs_InitialCondition;
    real_T BitfromLabel_bit;
    real_T BitfromLabel1_bit;
    real_T BitfromLabel_bit_c;
    real_T BitfromLabel1_bit_j;
    real_T BitfromLabel2_bit;
    real_T BitfromLabel3_bit;
    real_T BitfromLabel5_bit;
    real_T BitfromLabel4_bit;
    real_T BitfromLabel6_bit;
    real_T BitfromLabel7_bit;
    real_T BitfromLabel8_bit;
    real_T BitfromLabel4_bit_d;
    real_T BitfromLabel5_bit_e;
    real_T BitfromLabel6_bit_k;
    real_T BitfromLabel7_bit_h;
    real_T BitfromLabel_bit_a;
    real_T BitfromLabel1_bit_jr;
    real_T BitfromLabel_bit_h;
    real_T BitfromLabel1_bit_e;
    real_T BitfromLabel2_bit_k;
    real_T BitfromLabel3_bit_m;
    real_T BitfromLabel_bit_h2;
    real_T BitfromLabel1_bit_g;
    real_T BitfromLabel2_bit_n;
    real_T BitfromLabel3_bit_g;
    real_T BitfromLabel4_bit_e;
    real_T BitfromLabel5_bit_a;
    real_T BitfromLabel_bit_e;
    real_T BitfromLabel1_bit_d;
    real_T BitfromLabel_bit_a2;
    real_T BitfromLabel1_bit_p;
    real_T BitfromLabel_bit_p;
    real_T BitfromLabel1_bit_h;
    real_T BitfromLabel2_bit_f;
    real_T BitfromLabel3_bit_c;
    real_T BitfromLabel4_bit_n;
    real_T BitfromLabel5_bit_p;
    real_T BitfromLabel_bit_n;
    real_T BitfromLabel1_bit_h1;
    real_T BitfromLabel2_bit_g;
    real_T BitfromLabel3_bit_b;
    real_T BitfromLabel4_bit_i;
    real_T BitfromLabel5_bit_l;
    real_T BitfromLabel_bit_p3;
    real_T BitfromLabel2_bit_j;
    real_T BitfromLabel1_bit_i;
    real_T BitfromLabel3_bit_mo;
    real_T BitfromLabel_bit_es;
    real_T CompareToConstant_const;
    real_T CompareToConstant_const_m;
    real_T CompareToConstant_const_l;
    real_T CompareToConstant_const_m4;
    real_T CompareToConstant_const_f;
    real_T CompareToConstant2_const;
    real_T CompareToConstant3_const;
    real_T CompareToConstant1_const;
    real_T CompareToConstant1_const_d;
    real_T HysteresisNode2_highTrigger;
    real_T HysteresisNode1_highTrigger;
    real_T HysteresisNode3_highTrigger;
    real_T RateLimiterGenericVariableTs_lo;
    real_T RateLimiterGenericVariableTs1_lo;
    real_T RateLimiterVariableTs2_lo;
    real_T RateLimiterVariableTs3_lo;
    real_T RateLimiterGenericVariableTs1_lo_c;
    real_T RateLimiterGenericVariableTs_lo_k;
    real_T HysteresisNode2_lowTrigger;
    real_T HysteresisNode1_lowTrigger;
    real_T HysteresisNode3_lowTrigger;
    real_T ConfirmNode_timeDelay;
    real_T ConfirmNode2_timeDelay;
    real_T ConfirmNode1_timeDelay;
    real_T ConfirmNode_timeDelay_n;
    real_T ConfirmNode1_timeDelay_h;
    real_T ConfirmNode2_timeDelay_k;
    real_T ConfirmNode1_timeDelay_a;
    real_T ConfirmNode_timeDelay_a;
    real_T ConfirmNode_timeDelay_d;
    real_T ConfirmNode_timeDelay_p;
    real_T RateLimiterGenericVariableTs_up;
    real_T RateLimiterGenericVariableTs1_up;
    real_T RateLimiterVariableTs2_up;
    real_T RateLimiterVariableTs3_up;
    real_T RateLimiterGenericVariableTs1_up_g;
    real_T RateLimiterGenericVariableTs_up_b;
    SignStatusMatrix EnumeratedConstant_Value;
    SignStatusMatrix EnumeratedConstant1_Value;
    lateral_efcs_law EnumeratedConstant2_Value;
    pitch_efcs_law EnumeratedConstant_Value_i;
    pitch_efcs_law EnumeratedConstant_Value_b;
    real32_T CompareToConstant_const_ll;
    boolean_T SRFlipFlop_initial_condition;
    boolean_T ConfirmNode_isRisingEdge;
    boolean_T ConfirmNode2_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge;
    boolean_T ConfirmNode_isRisingEdge_k;
    boolean_T ConfirmNode1_isRisingEdge_i;
    boolean_T ConfirmNode2_isRisingEdge_j;
    boolean_T PulseNode_isRisingEdge;
    boolean_T PulseNode1_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge_k;
    boolean_T ConfirmNode_isRisingEdge_j;
    boolean_T ConfirmNode_isRisingEdge_o;
    boolean_T PulseNode_isRisingEdge_g;
    boolean_T ConfirmNode_isRisingEdge_f;
    elac_outputs out_Y0;
    base_elac_out_bus Constant4_Value;
    base_elac_laws_outputs Constant_Value;
    real_T Bias_Bias;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Gain2_Gain;
    real_T Constant2_Value;
    real_T Constant1_Value;
    real_T Constant4_Value_a;
    real_T Constant3_Value;
    real_T Gain_Gain;
    real_T Constant2_Value_l;
    real_T Constant3_Value_h;
    real_T Gain_Gain_l;
    real_T Saturation_UpperSat_g;
    real_T Saturation_LowerSat_o;
    real_T Constant_Value_n;
    real_T Constant5_Value;
    real_T Constant6_Value;
    real_T Constant7_Value;
    real_T Constant8_Value;
    real_T Constant1_Value_d;
    real_T Constant2_Value_b;
    real_T Constant3_Value_f;
    real_T Constant4_Value_i;
    real_T Constant_Value_j;
    real_T Constant_Value_p;
    real_T Saturation_UpperSat_d;
    real_T Saturation_LowerSat_h;
    real_T Constant1_Value_p;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T alphamax_tableData[24];
    real_T alphamax_bp01Data[4];
    real_T alphamax_bp02Data[6];
    real_T alphaprotection_tableData[24];
    real_T alphaprotection_bp01Data[4];
    real_T alphaprotection_bp02Data[6];
    real_T Constant5_Value_k;
    real_T Constant6_Value_b;
    real_T Constant7_Value_g;
    real_T Constant8_Value_h;
    real_T Gain1_Gain;
    real_T uDLookupTable1_tableData[4];
    real_T uDLookupTable1_bp01Data[4];
    real_T uDLookupTable2_tableData[4];
    real_T uDLookupTable2_bp01Data[4];
    real_T uDLookupTable_tableData[4];
    real_T uDLookupTable_bp01Data[4];
    real_T Constant_Value_c;
    real_T Saturation1_UpperSat_g;
    real_T Saturation1_LowerSat_n;
    real_T Saturation2_UpperSat;
    real_T Saturation2_LowerSat;
    real_T Gain1_Gain_b;
    real_T Constant_Value_a;
    real_T Delay_InitialCondition;
    real_T uDLookupTable_tableData_j[7];
    real_T uDLookupTable_bp01Data_h[7];
    real_T Constant_Value_b;
    real_T Switch13_Threshold;
    real_T Switch12_Threshold;
    real32_T Gain_Gain_b;
    real32_T Gain1_Gain_f;
    real32_T Gain2_Gain_c;
    real32_T Gain3_Gain;
    real32_T Gain4_Gain;
    uint32_T alphamax_maxIndex[2];
    uint32_T alphaprotection_maxIndex[2];
    boolean_T Constant1_Value_b;
    boolean_T Constant_Value_ad;
    boolean_T Delay_InitialCondition_c;
    boolean_T Delay1_InitialCondition;
    boolean_T Logic_table[16];
    boolean_T reset_Value;
    boolean_T reset_Value_j;
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
  BlockIO_ElacComputer_T ElacComputer_B;
  D_Work_ElacComputer_T ElacComputer_DWork;
  static Parameters_ElacComputer_T ElacComputer_P;
  static void ElacComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y);
  static void ElacComputer_MATLABFunction_j(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y);
  static void ElacComputer_RateLimiter_Reset(rtDW_RateLimiter_ElacComputer_T *localDW);
  static void ElacComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
    real_T *rty_Y, rtDW_RateLimiter_ElacComputer_T *localDW);
  static void ElacComputer_RateLimiter_o_Reset(rtDW_RateLimiter_ElacComputer_g_T *localDW);
  static void ElacComputer_RateLimiter_a(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
    boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_ElacComputer_g_T *localDW);
  static void ElacComputer_MATLABFunction_o(boolean_T rtu_bit1, boolean_T rtu_bit2, boolean_T rtu_bit3, boolean_T
    rtu_bit4, boolean_T rtu_bit5, boolean_T rtu_bit6, real_T *rty_handleIndex);
  static void ElacComputer_LagFilter_Reset(rtDW_LagFilter_ElacComputer_T *localDW);
  static void ElacComputer_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
    rtDW_LagFilter_ElacComputer_T *localDW);
  static void ElacComputer_MATLABFunction_g(const base_arinc_429 *rtu_u, boolean_T *rty_y);
  static void ElacComputer_MATLABFunction_g5_Reset(rtDW_MATLABFunction_ElacComputer_kz_T *localDW);
  static void ElacComputer_MATLABFunction_c(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
    rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_ElacComputer_kz_T *localDW);
  static void ElacComputer_MATLABFunction_k_Reset(rtDW_MATLABFunction_ElacComputer_o_T *localDW);
  static void ElacComputer_MATLABFunction_m(real_T rtu_u, real_T rtu_highTrigger, real_T rtu_lowTrigger, boolean_T
    *rty_y, rtDW_MATLABFunction_ElacComputer_o_T *localDW);
  static void ElacComputer_GetIASforMach4(real_T rtu_m, real_T rtu_m_t, real_T rtu_v, real_T *rty_v_t);
  static void ElacComputer_RateLimiter_d_Reset(rtDW_RateLimiter_ElacComputer_b_T *localDW);
  static void ElacComputer_RateLimiter_n(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, boolean_T rtu_reset,
    real_T *rty_Y, rtDW_RateLimiter_ElacComputer_b_T *localDW);
  static void ElacComputer_MATLABFunction_h_Reset(rtDW_MATLABFunction_ElacComputer_b_T *localDW);
  static void ElacComputer_MATLABFunction_g4(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
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

