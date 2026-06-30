#ifndef A380FcuComputer_h_
#define A380FcuComputer_h_
#include "rtwtypes.h"
#include "A380FcuComputer_types.h"

extern const fcu_outputs A380FcuComputer_rtZfcu_outputs;
class A380FcuComputer final
{
 public:
  struct rtDW_MATLABFunction_A380FcuComputer_T {
    real_T remainingTriggerTime;
    boolean_T previousInput;
  };

  struct rtDW_MATLABFunction_A380FcuComputer_c_T {
    boolean_T previousInput;
    boolean_T previousInput_not_empty;
  };

  struct rtDW_NavaidLogic_A380FcuComputer_T {
    a380_efis_navaid_selection pNavaidStatus;
  };

  struct rtDW_MATLABFunction_A380FcuComputer_pu_T {
    boolean_T pY;
    boolean_T pY_not_empty;
  };

  struct D_Work_A380FcuComputer_T {
    real32_T pValueHpa;
    real32_T pValueInhg;
    a380_efis_filter_selection pEfisFilter;
    a380_surv_filter_selection pSurvFilter;
    int8_T pRange;
    int8_T pMode;
    boolean_T lsActive;
    boolean_T vvActive;
    boolean_T pArcActive;
    boolean_T pArcActive_not_empty;
    boolean_T std_active;
    boolean_T qnh_active;
    boolean_T qfe_active;
    boolean_T p_metric_alt_active;
    boolean_T p_trk_fpa_active;
    boolean_T Runtime_MODE;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_mt;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_kq;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_kj;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_ce;
    rtDW_MATLABFunction_A380FcuComputer_pu_T sf_MATLABFunction_ij;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_lf;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_gu;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_dg;
    rtDW_MATLABFunction_A380FcuComputer_pu_T sf_MATLABFunction_hr;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_dj;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_k1;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_l0;
    rtDW_MATLABFunction_A380FcuComputer_pu_T sf_MATLABFunction_o3;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_on;
    rtDW_MATLABFunction_A380FcuComputer_pu_T sf_MATLABFunction_bt;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_j;
    rtDW_NavaidLogic_A380FcuComputer_T sf_NavaidLogic_f;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_mq;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_mb;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_bp;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_ic;
    rtDW_NavaidLogic_A380FcuComputer_T sf_NavaidLogic;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_nb;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_ny;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_li;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_ma;
    rtDW_MATLABFunction_A380FcuComputer_c_T sf_MATLABFunction_a4;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_g;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_k0;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_i;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_d;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_kh;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_o;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_a;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_c;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_f;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_kr;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_m;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_l;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_b;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_n;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction_k;
    rtDW_MATLABFunction_A380FcuComputer_T sf_MATLABFunction;
  };

  struct ExternalInputs_A380FcuComputer_T {
    fcu_inputs in;
  };

  struct ExternalOutputs_A380FcuComputer_T {
    fcu_outputs out;
  };

  struct Parameters_A380FcuComputer_T {
    real_T BitfromLabel1_bit;
    real_T BitfromLabel2_bit;
    real_T BitfromLabel5_bit;
    real_T BitfromLabel3_bit;
    real_T BitfromLabel6_bit;
    real_T BitfromLabel5_bit_p;
    real_T BitfromLabel4_bit;
    real_T BitfromLabel3_bit_f;
    real_T BitfromLabel1_bit_i;
    real_T BitfromLabel2_bit_g;
    real_T BitfromLabel7_bit;
    real_T BitfromLabel8_bit;
    real_T BitfromLabel2_bit_o;
    real_T BitfromLabel5_bit_n;
    real_T BitfromLabel3_bit_p;
    real_T MTrigNode_isRisingEdge;
    real_T MTrigNode1_isRisingEdge;
    real_T MTrigNode2_isRisingEdge;
    real_T MTrigNode_isRisingEdge_a;
    real_T MTrigNode1_isRisingEdge_j;
    real_T MTrigNode2_isRisingEdge_j;
    real_T MTrigNode_isRisingEdge_k;
    real_T MTrigNode1_isRisingEdge_o;
    real_T MTrigNode2_isRisingEdge_h;
    real_T MTrigNode_isRisingEdge_d;
    real_T MTrigNode1_isRisingEdge_c;
    real_T MTrigNode2_isRisingEdge_hx;
    real_T MTrigNode_isRisingEdge_c;
    real_T MTrigNode1_isRisingEdge_a;
    real_T MTrigNode2_isRisingEdge_p;
    real_T MTrigNode3_isRisingEdge;
    real_T MTrigNode_isRisingEdge_l;
    real_T MTrigNode_retriggerable;
    real_T MTrigNode1_retriggerable;
    real_T MTrigNode2_retriggerable;
    real_T MTrigNode_retriggerable_f;
    real_T MTrigNode1_retriggerable_d;
    real_T MTrigNode2_retriggerable_i;
    real_T MTrigNode_retriggerable_h;
    real_T MTrigNode1_retriggerable_j;
    real_T MTrigNode2_retriggerable_h;
    real_T MTrigNode_retriggerable_g;
    real_T MTrigNode1_retriggerable_l;
    real_T MTrigNode2_retriggerable_g;
    real_T MTrigNode_retriggerable_i;
    real_T MTrigNode1_retriggerable_ls;
    real_T MTrigNode2_retriggerable_c;
    real_T MTrigNode3_retriggerable;
    real_T MTrigNode_retriggerable_b;
    real_T KnobMtrigProcessing_triggerDuration;
    real_T KnobMtrigProcessing1_triggerDuration;
    real_T KnobMtrigProcessing2_triggerDuration;
    real_T KnobMtrigProcessing3_triggerDuration;
    real_T MTrigNode_triggerDuration;
    real_T MTrigNode1_triggerDuration;
    real_T MTrigNode2_triggerDuration;
    real_T MTrigNode3_triggerDuration;
    real_T MTrigNode_triggerDuration_b;
    SignStatusMatrix EnumeratedConstant1_Value;
    a380_efis_filter_selection EnumeratedConstant6_Value;
    a380_efis_filter_selection EnumeratedConstant1_Value_o;
    a380_efis_filter_selection EnumeratedConstant2_Value;
    a380_efis_mode_selection EnumeratedConstant_Value;
    a380_surv_filter_selection EnumeratedConstant3_Value;
    a380_surv_filter_selection EnumeratedConstant4_Value;
    boolean_T TFlipFlop1_init;
    boolean_T TFlipFlop1_init_p;
    boolean_T TFlipFlop2_init;
    boolean_T TFlipFlop2_init_n;
    boolean_T PulseNode_isRisingEdge;
    boolean_T PulseNode1_isRisingEdge;
    boolean_T PulseNode_isRisingEdge_i;
    boolean_T PulseNode1_isRisingEdge_d;
    boolean_T PulseNode2_isRisingEdge;
    boolean_T PulseNode_isRisingEdge_g;
    boolean_T PulseNode1_isRisingEdge_m;
    boolean_T PulseNode_isRisingEdge_o;
    boolean_T PulseNode2_isRisingEdge_l;
    boolean_T PulseNode1_isRisingEdge_g;
    boolean_T PulseNode2_isRisingEdge_ll;
    boolean_T PulseNode1_isRisingEdge_l;
    boolean_T PulseNode3_isRisingEdge;
    boolean_T PulseNode_isRisingEdge_m;
    boolean_T PulseNode_isRisingEdge_b;
    boolean_T PulseNode2_isRisingEdge_f;
    boolean_T PulseNode2_isRisingEdge_lq;
    boolean_T PulseNode_isRisingEdge_j;
    boolean_T PulseNode_isRisingEdge_c;
    boolean_T PulseNode_isRisingEdge_f;
    int8_T CompareToConstant_const;
    int8_T CompareToConstant_const_p;
    int8_T CompareToConstant_const_pg;
    int8_T CompareToConstant_const_e;
    int8_T CompareToConstant_const_l;
    fcu_outputs out_Y0;
    base_fcu_bus Constant2_Value;
    base_fcu_logic_outputs Constant1_Value;
    base_fcu_discrete_outputs Constant3_Value;
    boolean_T Constant1_Value_i;
    boolean_T Constant19_Value;
    boolean_T Constant20_Value;
  };

  A380FcuComputer(A380FcuComputer const&) = delete;
  A380FcuComputer& operator= (A380FcuComputer const&) & = delete;
  A380FcuComputer(A380FcuComputer &&) = delete;
  A380FcuComputer& operator= (A380FcuComputer &&) = delete;
  void setExternalInputs(const ExternalInputs_A380FcuComputer_T *pExternalInputs_A380FcuComputer_T)
  {
    A380FcuComputer_U = *pExternalInputs_A380FcuComputer_T;
  }

  const ExternalOutputs_A380FcuComputer_T &getExternalOutputs() const
  {
    return A380FcuComputer_Y;
  }

  void initialize();
  void step();
  static void terminate();
  A380FcuComputer();
  ~A380FcuComputer();
 private:
  ExternalInputs_A380FcuComputer_T A380FcuComputer_U;
  ExternalOutputs_A380FcuComputer_T A380FcuComputer_Y;
  D_Work_A380FcuComputer_T A380FcuComputer_DWork;
  static Parameters_A380FcuComputer_T A380FcuComputer_P;
  static void A380FcuComputer_MATLABFunction_Reset(rtDW_MATLABFunction_A380FcuComputer_T *localDW);
  static void A380FcuComputer_MATLABFunction(boolean_T rtu_u, real_T rtu_Ts, boolean_T *rty_y, real_T rtp_isRisingEdge,
    real_T rtp_retriggerable, real_T rtp_triggerDuration, rtDW_MATLABFunction_A380FcuComputer_T *localDW);
  static void A380FcuComputer_MATLABFunction_m(const base_arinc_429 *rtu_u, boolean_T *rty_y);
  static void A380FcuComputer_MATLABFunction_a(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y);
  static void A380FcuComputer_MATLABFunction_n_Reset(rtDW_MATLABFunction_A380FcuComputer_c_T *localDW);
  static void A380FcuComputer_MATLABFunction_a4(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
    rtDW_MATLABFunction_A380FcuComputer_c_T *localDW);
  static void A380FcuComputer_NavaidLogic_Reset(rtDW_NavaidLogic_A380FcuComputer_T *localDW);
  static void A380FcuComputer_NavaidLogic(boolean_T rtu_navaid_button, a380_efis_navaid_selection *rty_navaidStatus,
    rtDW_NavaidLogic_A380FcuComputer_T *localDW);
  static void A380FcuComputer_MATLABFunction_mw_Reset(rtDW_MATLABFunction_A380FcuComputer_pu_T *localDW);
  static void A380FcuComputer_MATLABFunction_b(boolean_T rtu_u, boolean_T *rty_y, boolean_T rtp_init,
    rtDW_MATLABFunction_A380FcuComputer_pu_T *localDW);
  static void A380FcuComputer_MATLABFunction_e(const boolean_T rtu_u[19], real32_T *rty_y);
};

#endif

