#ifndef A380SecComputer_h_
#define A380SecComputer_h_
#include "rtwtypes.h"
#include "A380SecComputer_types.h"
#include "A380LateralDirectLaw.h"
#include "A380PitchDirectLaw.h"

class A380SecComputer final
{
 public:
  struct rtDW_RateLimiter_A380SecComputer_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct rtDW_RateLimiter_A380SecComputer_o_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct rtDW_MATLABFunction_A380SecComputer_e_T {
    boolean_T previousInput;
    boolean_T previousInput_not_empty;
  };

  struct rtDW_MATLABFunction_A380SecComputer_c_T {
    real_T timeSinceCondition;
    boolean_T output;
  };

  struct BlockIO_A380SecComputer_T {
    sec_outputs BusAssignment_d;
    sec_outputs BusAssignment_o;
  };

  struct D_Work_A380SecComputer_T {
    real_T Delay_DSTATE;
    real_T Delay_DSTATE_c;
    real_T pY;
    real_T pU;
    real_T pY_e;
    boolean_T Delay_DSTATE_cc;
    boolean_T Delay1_DSTATE;
    boolean_T Delay_DSTATE_d;
    boolean_T Memory_PreviousInput;
    boolean_T Memory_PreviousInput_n;
    boolean_T Memory_PreviousInput_b;
    boolean_T icLoad;
    boolean_T icLoad_l;
    boolean_T pLeftStickDisabled;
    boolean_T pRightStickDisabled;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
    boolean_T pY_not_empty_k;
    boolean_T Runtime_MODE;
    rtDW_MATLABFunction_A380SecComputer_e_T sf_MATLABFunction_mf;
    rtDW_MATLABFunction_A380SecComputer_e_T sf_MATLABFunction_ek;
    rtDW_MATLABFunction_A380SecComputer_e_T sf_MATLABFunction_nu;
    rtDW_MATLABFunction_A380SecComputer_e_T sf_MATLABFunction_g4;
    rtDW_MATLABFunction_A380SecComputer_c_T sf_MATLABFunction_j2y;
    rtDW_MATLABFunction_A380SecComputer_c_T sf_MATLABFunction_g2;
    rtDW_MATLABFunction_A380SecComputer_c_T sf_MATLABFunction_bd;
    rtDW_MATLABFunction_A380SecComputer_c_T sf_MATLABFunction_mg;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_bh;
    rtDW_MATLABFunction_A380SecComputer_e_T sf_MATLABFunction_f;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_cd;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_p0;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_c;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_d;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_os;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_gz;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_j;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_p;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_a;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_g;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_bv;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_o;
    rtDW_RateLimiter_A380SecComputer_o_T sf_RateLimiter_e;
    rtDW_RateLimiter_A380SecComputer_T sf_RateLimiter_b;
    rtDW_RateLimiter_A380SecComputer_T sf_RateLimiter;
  };

  struct ExternalInputs_A380SecComputer_T {
    sec_inputs in;
  };

  struct ExternalOutputs_A380SecComputer_T {
    sec_outputs out;
  };

  struct Parameters_A380SecComputer_T {
    real_T LagFilter_C1;
    real_T DiscreteTimeIntegratorVariableTs_Gain;
    real_T DiscreteTimeIntegratorVariableTsLimit_Gain;
    real_T RateLimiterVariableTs2_InitialCondition;
    real_T RateLimiterVariableTs4_InitialCondition;
    real_T RateLimiterGenericVariableTs25_InitialCondition;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit;
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit;
    real_T BitfromLabel6_bit;
    real_T BitfromLabel1_bit;
    real_T BitfromLabel3_bit;
    real_T BitfromLabel2_bit;
    real_T BitfromLabel6_bit_k;
    real_T BitfromLabel7_bit;
    real_T BitfromLabel1_bit_p;
    real_T BitfromLabel1_bit_g;
    real_T BitfromLabel2_bit_b;
    real_T BitfromLabel3_bit_l;
    real_T BitfromLabel4_bit;
    real_T BitfromLabel5_bit;
    real_T BitfromLabel6_bit_d;
    real_T BitfromLabel7_bit_j;
    real_T BitfromLabel8_bit;
    real_T BitfromLabel9_bit;
    real_T BitfromLabel10_bit;
    real_T BitfromLabel1_bit_j;
    real_T BitfromLabel2_bit_i;
    real_T BitfromLabel3_bit_i;
    real_T BitfromLabel4_bit_e;
    real_T BitfromLabel6_bit_l;
    real_T BitfromLabel7_bit_b;
    real_T BitfromLabel8_bit_d;
    real_T BitfromLabel9_bit_g;
    real_T BitfromLabel5_bit_e;
    real_T BitfromLabel10_bit_g;
    real_T BitfromLabel11_bit;
    real_T BitfromLabel12_bit;
    real_T BitfromLabel13_bit;
    real_T BitfromLabel1_bit_f;
    real_T BitfromLabel2_bit_a;
    real_T BitfromLabel3_bit_j;
    real_T BitfromLabel1_bit_o;
    real_T BitfromLabel2_bit_p;
    real_T BitfromLabel10_bit_i;
    real_T BitfromLabel8_bit_m;
    real_T BitfromLabel11_bit_l;
    real_T BitfromLabel12_bit_b;
    real_T BitfromLabel9_bit_o;
    real_T BitfromLabel15_bit;
    real_T BitfromLabel13_bit_o;
    real_T BitfromLabel14_bit;
    real_T BitfromLabel3_bit_o;
    real_T BitfromLabel4_bit_a;
    real_T BitfromLabel5_bit_c;
    real_T BitfromLabel6_bit_h;
    real_T BitfromLabel7_bit_i;
    real_T BitfromLabel9_bit_m;
    real_T BitfromLabel_bit;
    real_T BitfromLabel1_bit_d;
    real_T BitfromLabel3_bit_id;
    real_T BitfromLabel4_bit_m;
    real_T BitfromLabel_bit_k;
    real_T BitfromLabel6_bit_a;
    real_T BitfromLabel5_bit_j;
    real_T BitfromLabel1_bit_b;
    real_T BitfromLabel3_bit_k;
    real_T CompareToConstant_const;
    real_T CompareToConstant1_const;
    real_T CompareToConstant1_const_p;
    real_T CompareToConstant1_const_d;
    real_T RateLimiterGenericVariableTs_lo;
    real_T RateLimiterVariableTs2_lo;
    real_T RateLimiterGenericVariableTs_lo_o;
    real_T RateLimiterGenericVariableTs1_lo;
    real_T RateLimiterGenericVariableTs2_lo;
    real_T RateLimiterGenericVariableTs3_lo;
    real_T RateLimiterVariableTs4_lo;
    real_T RateLimiterGenericVariableTs25_lo;
    real_T RateLimiterGenericVariableTs8_lo;
    real_T RateLimiterGenericVariableTs9_lo;
    real_T RateLimiterGenericVariableTs10_lo;
    real_T RateLimiterGenericVariableTs11_lo;
    real_T RateLimiterGenericVariableTs6_lo;
    real_T RateLimiterGenericVariableTs7_lo;
    real_T RateLimiterGenericVariableTs_lo_f;
    real_T RateLimiterGenericVariableTs1_lo_c;
    real_T RateLimiterGenericVariableTs2_lo_k;
    real_T ConfirmNode_timeDelay;
    real_T ConfirmNode2_timeDelay;
    real_T ConfirmNode1_timeDelay;
    real_T ConfirmNode_timeDelay_a;
    real_T RateLimiterGenericVariableTs_up;
    real_T RateLimiterVariableTs2_up;
    real_T RateLimiterGenericVariableTs_up_l;
    real_T RateLimiterGenericVariableTs1_up;
    real_T RateLimiterGenericVariableTs2_up;
    real_T RateLimiterGenericVariableTs3_up;
    real_T RateLimiterVariableTs4_up;
    real_T RateLimiterGenericVariableTs25_up;
    real_T RateLimiterGenericVariableTs8_up;
    real_T RateLimiterGenericVariableTs9_up;
    real_T RateLimiterGenericVariableTs10_up;
    real_T RateLimiterGenericVariableTs11_up;
    real_T RateLimiterGenericVariableTs6_up;
    real_T RateLimiterGenericVariableTs7_up;
    real_T RateLimiterGenericVariableTs_up_a;
    real_T RateLimiterGenericVariableTs1_up_a;
    real_T RateLimiterGenericVariableTs2_up_l;
    SignStatusMatrix EnumeratedConstant1_Value;
    boolean_T SRFlipFlop1_initial_condition;
    boolean_T SRFlipFlop_initial_condition;
    boolean_T SRFlipFlop_initial_condition_i;
    boolean_T ConfirmNode_isRisingEdge;
    boolean_T ConfirmNode2_isRisingEdge;
    boolean_T PulseNode_isRisingEdge;
    boolean_T PulseNode1_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge;
    boolean_T ConfirmNode_isRisingEdge_j;
    boolean_T PulseNode1_isRisingEdge_m;
    boolean_T PulseNode2_isRisingEdge;
    boolean_T PulseNode_isRisingEdge_m;
    int8_T CompareToConstant2_const;
    int8_T CompareToConstant5_const;
    int8_T CompareToConstant3_const;
    int8_T CompareToConstant4_const;
    int8_T CompareToConstant_const_l;
    int8_T CompareToConstant_const_f;
    int8_T CompareToConstant1_const_p2;
    int8_T CompareToConstant_const_fl;
    int8_T CompareToConstant2_const_f;
    int8_T CompareToConstant_const_fs;
    int8_T CompareToConstant1_const_c;
    sec_outputs out_Y0;
    base_sec_out_bus Constant4_Value;
    base_sec_logic_outputs Constant1_Value;
    base_sec_analog_outputs Constant3_Value;
    base_sec_laws_outputs Constant_Value;
    base_sec_discrete_outputs Constant2_Value;
    real_T Constant5_Value;
    real_T Constant6_Value;
    real_T Constant9_Value;
    real_T Constant8_Value;
    real_T Constant2_Value_n;
    real_T Constant1_Value_f;
    real_T Constant2_Value_l;
    real_T Constant3_Value_h;
    real_T Constant2_Value_m;
    real_T Constant_Value_l;
    real_T Gain_Gain;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Constant10_Value;
    real_T Constant11_Value;
    real_T Constant12_Value;
    real_T Constant13_Value;
    real_T Constant15_Value;
    real_T Constant1_Value_n;
    real_T Constant2_Value_k;
    real_T Constant3_Value_g;
    real_T Constant4_Value_i;
    real_T Constant5_Value_n;
    real_T Constant6_Value_f;
    real_T Constant7_Value;
    real_T Constant8_Value_p;
    real_T Constant9_Value_n;
    real_T Constant_Value_b;
    real_T Constant_Value_p;
    real_T Saturation_UpperSat_d;
    real_T Saturation_LowerSat_h;
    real_T Constant1_Value_p;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Constant_Value_c;
    real_T Gain_Gain_e;
    real_T Saturation2_UpperSat;
    real_T Saturation2_LowerSat;
    real_T Saturation1_UpperSat_o;
    real_T Saturation1_LowerSat_n;
    real_T Gain3_Gain;
    real_T Saturation3_UpperSat;
    real_T Saturation3_LowerSat;
    real_T Saturation4_UpperSat;
    real_T Saturation4_LowerSat;
    real_T Gain1_Gain;
    real_T Constant_Value_a;
    real32_T Gain_Gain_e0;
    real32_T Gain1_Gain_a;
    real32_T Gain2_Gain;
    real32_T Gain3_Gain_o;
    real32_T Gain4_Gain;
    boolean_T Constant1_Value_b;
    boolean_T Constant_Value_ad;
    boolean_T Constant_Value_bg;
    boolean_T Delay_InitialCondition;
    boolean_T Delay1_InitialCondition;
    boolean_T Delay_InitialCondition_d;
    boolean_T Logic_table[16];
    boolean_T Logic_table_i[16];
    boolean_T Logic_table_f[16];
    boolean_T Constant7_Value_h;
    boolean_T reset_Value;
    boolean_T Constant1_Value_f3;
    boolean_T Constant16_Value;
    boolean_T Constant17_Value;
    boolean_T Constant18_Value;
    boolean_T Constant19_Value;
    boolean_T Constant21_Value;
    boolean_T Constant22_Value;
  };

  A380SecComputer(A380SecComputer const&) = delete;
  A380SecComputer& operator= (A380SecComputer const&) & = delete;
  A380SecComputer(A380SecComputer &&) = delete;
  A380SecComputer& operator= (A380SecComputer &&) = delete;
  void setExternalInputs(const ExternalInputs_A380SecComputer_T *pExternalInputs_A380SecComputer_T)
  {
    A380SecComputer_U = *pExternalInputs_A380SecComputer_T;
  }

  const ExternalOutputs_A380SecComputer_T &getExternalOutputs() const
  {
    return A380SecComputer_Y;
  }

  void initialize();
  void step();
  static void terminate();
  A380SecComputer();
  ~A380SecComputer();
 private:
  ExternalInputs_A380SecComputer_T A380SecComputer_U;
  ExternalOutputs_A380SecComputer_T A380SecComputer_Y;
  BlockIO_A380SecComputer_T A380SecComputer_B;
  D_Work_A380SecComputer_T A380SecComputer_DWork;
  static Parameters_A380SecComputer_T A380SecComputer_P;
  static void A380SecComputer_RateLimiter_Reset(rtDW_RateLimiter_A380SecComputer_T *localDW);
  static void A380SecComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
    real_T *rty_Y, rtDW_RateLimiter_A380SecComputer_T *localDW);
  static void A380SecComputer_RateLimiter_j_Reset(rtDW_RateLimiter_A380SecComputer_o_T *localDW);
  static void A380SecComputer_RateLimiter_e(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
    boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380SecComputer_o_T *localDW);
  static void A380SecComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y);
  static void A380SecComputer_MATLABFunction_p(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y);
  static void A380SecComputer_MATLABFunction_p_Reset(rtDW_MATLABFunction_A380SecComputer_e_T *localDW);
  static void A380SecComputer_MATLABFunction_f(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
    rtDW_MATLABFunction_A380SecComputer_e_T *localDW);
  static void A380SecComputer_MATLABFunction_h(const base_arinc_429 *rtu_u, boolean_T *rty_y);
  static void A380SecComputer_MATLABFunction_k_Reset(rtDW_MATLABFunction_A380SecComputer_c_T *localDW);
  static void A380SecComputer_MATLABFunction_m(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
    rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380SecComputer_c_T *localDW);
  static void A380SecComputer_MATLABFunction_e(const boolean_T rtu_u[19], real32_T *rty_y);
  A380LateralDirectLaw LawMDLOBJ1;
  A380PitchDirectLaw LawMDLOBJ2;
};

#endif

