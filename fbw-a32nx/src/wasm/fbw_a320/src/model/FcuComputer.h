#ifndef RTW_HEADER_FcuComputer_h_
#define RTW_HEADER_FcuComputer_h_
#include "rtwtypes.h"
#include "FcuComputer_types.h"

class FcuComputer final
{
 public:
  struct rtDW_MATLABFunction_FcuComputer_T {
    real_T remainingTriggerTime;
    boolean_T previousInput;
  };

  struct rtDW_MATLABFunction1_FcuComputer_T {
    real_T eventTime;
    boolean_T eventTime_not_empty;
  };

  struct rtDW_MATLABFunction_FcuComputer_e_T {
    boolean_T previousInput;
    boolean_T previousInput_not_empty;
  };

  struct rtDW_EFISFilterLogic_FcuComputer_T {
    efis_filter_selection pEfisFilter;
  };

  struct rtDW_MATLABFunction_FcuComputer_b_T {
    boolean_T std_active;
    boolean_T qnh_active;
    boolean_T qfe_active;
  };

  struct rtDW_MATLABFunction1_FcuComputer_b_T {
    real_T pValueHpa;
    real_T pValueInhg;
  };

  struct rtDW_MATLABFunction_FcuComputer_l_T {
    boolean_T pY;
    boolean_T pY_not_empty;
  };

  struct D_Work_FcuComputer_T {
    real32_T DelayInput1_DSTATE[4];
    real32_T pValue;
    real32_T pValue_e;
    real32_T pValue_j;
    real32_T pValue_n;
    boolean_T Delay_DSTATE;
    boolean_T pValue_not_empty;
    boolean_T prevTrkFpaActive;
    boolean_T prevTrkFpaActive_not_empty;
    boolean_T p_metric_alt_active;
    boolean_T p_trk_fpa_active;
    boolean_T pValue_not_empty_l;
    boolean_T prevMachActive;
    boolean_T pValue_not_empty_lk;
    boolean_T prevTrkFpaActive_a;
    boolean_T prevTrkFpaActive_not_empty_c;
    boolean_T pValue_not_empty_m;
    boolean_T Runtime_MODE;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_je;
    rtDW_MATLABFunction_FcuComputer_l_T sf_MATLABFunction_hk;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_ja0;
    rtDW_MATLABFunction_FcuComputer_l_T sf_MATLABFunction_ja;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_gx;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_ng;
    rtDW_MATLABFunction1_FcuComputer_b_T sf_MATLABFunction1_e3;
    rtDW_MATLABFunction_FcuComputer_b_T sf_MATLABFunction_jp;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_cb;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_df;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_hlu;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_ec;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_fiq;
    rtDW_EFISFilterLogic_FcuComputer_T sf_EFISFilterLogic_h;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_jr;
    rtDW_MATLABFunction_FcuComputer_l_T sf_MATLABFunction_kc;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_ik;
    rtDW_MATLABFunction_FcuComputer_l_T sf_MATLABFunction_mb;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_b3;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_hc;
    rtDW_MATLABFunction1_FcuComputer_b_T sf_MATLABFunction1_h;
    rtDW_MATLABFunction_FcuComputer_b_T sf_MATLABFunction_pr;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_bpf;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_gb;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_id;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_nz;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_he;
    rtDW_EFISFilterLogic_FcuComputer_T sf_EFISFilterLogic;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_ar;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_kw;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_ch;
    rtDW_MATLABFunction1_FcuComputer_T sf_MATLABFunction1_o;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_hh;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_ma;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_a4;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_kl;
    rtDW_MATLABFunction1_FcuComputer_T sf_MATLABFunction1_p;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_oi;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_lh;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_p5r;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_av;
    rtDW_MATLABFunction_FcuComputer_e_T sf_MATLABFunction_dc;
    rtDW_MATLABFunction1_FcuComputer_T sf_MATLABFunction1;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_g;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_k0;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_i;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_d;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_kh;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_o;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_a;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_c;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_f;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_kr;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_m;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_l;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_b;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_n;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_k;
    rtDW_MATLABFunction_FcuComputer_T sf_MATLABFunction_e;
  };

  struct ExternalInputs_FcuComputer_T {
    fcu_inputs in;
  };

  struct ExternalOutputs_FcuComputer_T {
    fcu_outputs out;
  };

  struct Parameters_FcuComputer_T {
    real_T BitfromLabel_bit;
    real_T BitfromLabel1_bit;
    real_T BitfromLabel4_bit;
    real_T BitfromLabel3_bit;
    real_T BitfromLabel6_bit;
    real_T BitfromLabel5_bit;
    real_T BitfromLabel8_bit;
    real_T BitfromLabel7_bit;
    real_T BitfromLabel9_bit;
    real_T BitfromLabel10_bit;
    real_T BitfromLabel2_bit;
    real_T BitfromLabel1_bit_l;
    real_T BitfromLabel2_bit_l;
    real_T BitfromLabel12_bit;
    real_T BitfromLabel11_bit;
    real_T BitfromLabel4_bit_n;
    real_T BitfromLabel3_bit_p;
    real_T BitfromLabel17_bit;
    real_T BitfromLabel16_bit;
    real_T BitfromLabel15_bit;
    real_T BitfromLabel14_bit;
    real_T BitfromLabel13_bit;
    real_T BitfromLabel9_bit_i;
    real_T BitfromLabel6_bit_n;
    real_T BitfromLabel5_bit_f;
    real_T BitfromLabel8_bit_h;
    real_T BitfromLabel7_bit_j;
    real_T BitfromLabel10_bit_c;
    real_T BitfromLabel2_bit_a;
    real_T BitfromLabel1_bit_m;
    real_T BitfromLabel6_bit_b;
    real_T BitfromLabel1_bit_i;
    real_T BitfromLabel2_bit_g;
    real_T BitfromLabel5_bit_p;
    real_T BitfromLabel4_bit_o;
    real_T BitfromLabel3_bit_f;
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
    real_T MTrigNode_isRisingEdge_kt;
    real_T MTrigNode_isRisingEdge_i;
    real_T MTrigNode1_isRisingEdge_m;
    real_T MTrigNode2_isRisingEdge_hp;
    real_T MTrigNode3_isRisingEdge_j;
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
    real_T MTrigNode_retriggerable_m;
    real_T MTrigNode_retriggerable_k;
    real_T MTrigNode1_retriggerable_p;
    real_T MTrigNode2_retriggerable_k;
    real_T MTrigNode3_retriggerable_a;
    real_T KnobMtrigProcessing_triggerDuration;
    real_T KnobMtrigProcessing1_triggerDuration;
    real_T KnobMtrigProcessing2_triggerDuration;
    real_T KnobMtrigProcessing3_triggerDuration;
    real_T MTrigNode_triggerDuration;
    real_T MTrigNode1_triggerDuration;
    real_T MTrigNode2_triggerDuration;
    real_T MTrigNode3_triggerDuration;
    real_T MTrigNode_triggerDuration_k;
    real_T MTrigNode_triggerDuration_m;
    real_T MTrigNode1_triggerDuration_h;
    real_T MTrigNode2_triggerDuration_a;
    real_T MTrigNode3_triggerDuration_h;
    SignStatusMatrix EnumeratedConstant_Value;
    SignStatusMatrix EnumeratedConstant1_Value;
    efis_filter_selection EnumeratedConstant7_Value;
    efis_filter_selection EnumeratedConstant6_Value;
    efis_filter_selection EnumeratedConstant8_Value;
    efis_filter_selection EnumeratedConstant9_Value;
    efis_filter_selection EnumeratedConstant10_Value;
    efis_filter_selection EnumeratedConstant7_Value_b;
    efis_filter_selection EnumeratedConstant6_Value_m;
    efis_filter_selection EnumeratedConstant8_Value_g;
    efis_filter_selection EnumeratedConstant9_Value_c;
    efis_filter_selection EnumeratedConstant10_Value_m;
    efis_filter_selection EnumeratedConstant7_Value_k;
    efis_filter_selection EnumeratedConstant6_Value_l;
    efis_filter_selection EnumeratedConstant8_Value_a;
    efis_filter_selection EnumeratedConstant9_Value_g;
    efis_filter_selection EnumeratedConstant10_Value_b;
    efis_filter_selection EnumeratedConstant7_Value_a;
    efis_filter_selection EnumeratedConstant6_Value_l4;
    efis_filter_selection EnumeratedConstant8_Value_p;
    efis_filter_selection EnumeratedConstant9_Value_o;
    efis_filter_selection EnumeratedConstant10_Value_e;
    efis_mode_selection EnumeratedConstant2_Value;
    efis_mode_selection EnumeratedConstant1_Value_b;
    efis_mode_selection EnumeratedConstant3_Value;
    efis_mode_selection EnumeratedConstant4_Value;
    efis_mode_selection EnumeratedConstant5_Value;
    efis_mode_selection EnumeratedConstant2_Value_a;
    efis_mode_selection EnumeratedConstant1_Value_m;
    efis_mode_selection EnumeratedConstant3_Value_l;
    efis_mode_selection EnumeratedConstant4_Value_b;
    efis_mode_selection EnumeratedConstant5_Value_e;
    efis_navaid_selection EnumeratedConstant12_Value;
    efis_navaid_selection EnumeratedConstant11_Value;
    efis_navaid_selection EnumeratedConstant12_Value_a;
    efis_navaid_selection EnumeratedConstant11_Value_o;
    efis_range_selection EnumeratedConstant2_Value_g;
    efis_range_selection EnumeratedConstant1_Value_h;
    efis_range_selection EnumeratedConstant3_Value_i;
    efis_range_selection EnumeratedConstant4_Value_n;
    efis_range_selection EnumeratedConstant5_Value_a;
    efis_range_selection EnumeratedConstant2_Value_l;
    efis_range_selection EnumeratedConstant1_Value_n;
    efis_range_selection EnumeratedConstant3_Value_e;
    efis_range_selection EnumeratedConstant4_Value_i;
    efis_range_selection EnumeratedConstant5_Value_k;
    real32_T A429ValueOrDefault_defaultValue;
    real32_T A429ValueOrDefault1_defaultValue;
    real32_T A429ValueOrDefault2_defaultValue;
    real32_T A429ValueOrDefault3_defaultValue;
    real32_T A429ValueOrDefault4_defaultValue;
    real32_T A429ValueOrDefault5_defaultValue;
    real32_T A429ValueOrDefault6_defaultValue;
    real32_T DetectChange_vinit;
    boolean_T TFlipFlop_init;
    boolean_T TFlipFlop1_init;
    boolean_T TFlipFlop_init_f;
    boolean_T TFlipFlop1_init_a;
    boolean_T PulseNode_isRisingEdge;
    boolean_T PulseNode1_isRisingEdge;
    boolean_T PulseNode2_isRisingEdge;
    boolean_T PulseNode3_isRisingEdge;
    boolean_T PulseNode4_isRisingEdge;
    boolean_T PulseNode_isRisingEdge_n;
    boolean_T PulseNode_isRisingEdge_nj;
    boolean_T PulseNode_isRisingEdge_a;
    boolean_T PulseNode1_isRisingEdge_h;
    boolean_T PulseNode_isRisingEdge_m;
    boolean_T PulseNode1_isRisingEdge_k;
    boolean_T PulseNode2_isRisingEdge_a;
    boolean_T PulseNode3_isRisingEdge_g;
    boolean_T PulseNode4_isRisingEdge_a;
    boolean_T PulseNode_isRisingEdge_i;
    boolean_T PulseNode_isRisingEdge_h;
    boolean_T PulseNode_isRisingEdge_o;
    boolean_T PulseNode1_isRisingEdge_f;
    boolean_T PulseNode_isRisingEdge_oa;
    boolean_T PulseNode1_isRisingEdge_ke;
    boolean_T PulseNode_isRisingEdge_l;
    boolean_T PulseNode_isRisingEdge_hz;
    boolean_T PulseNode1_isRisingEdge_e;
    boolean_T PulseNode2_isRisingEdge_k;
    boolean_T PulseNode_isRisingEdge_d;
    int8_T CompareToConstant_const;
    int8_T CompareToConstant_const_p;
    int8_T CompareToConstant_const_pg;
    int8_T CompareToConstant_const_e;
    int8_T CompareToConstant_const_p0;
    int8_T CompareToConstant_const_es;
    int8_T CompareToConstant_const_o;
    fcu_outputs out_Y0;
    base_fcu_bus Constant2_Value;
    base_fcu_logic_outputs Constant1_Value;
    base_fcu_discrete_outputs Constant3_Value;
    boolean_T Delay_InitialCondition;
    boolean_T Constant15_Value;
    boolean_T Constant1_Value_i;
    boolean_T Constant1_Value_d;
    boolean_T Constant_Value;
    boolean_T Constant10_Value;
    boolean_T Constant10_Value_a;
    boolean_T Constant10_Value_p;
    boolean_T Constant10_Value_e;
    boolean_T Constant19_Value;
    boolean_T Constant20_Value;
  };

  FcuComputer(FcuComputer const&) = delete;
  FcuComputer& operator= (FcuComputer const&) & = delete;
  FcuComputer(FcuComputer &&) = delete;
  FcuComputer& operator= (FcuComputer &&) = delete;
  void setExternalInputs(const ExternalInputs_FcuComputer_T *pExternalInputs_FcuComputer_T)
  {
    FcuComputer_U = *pExternalInputs_FcuComputer_T;
  }

  const ExternalOutputs_FcuComputer_T &getExternalOutputs() const
  {
    return FcuComputer_Y;
  }

  void initialize();
  void step();
  static void terminate();
  FcuComputer();
  ~FcuComputer();
 private:
  ExternalInputs_FcuComputer_T FcuComputer_U;
  ExternalOutputs_FcuComputer_T FcuComputer_Y;
  D_Work_FcuComputer_T FcuComputer_DWork;
  static Parameters_FcuComputer_T FcuComputer_P;
  static void FcuComputer_MATLABFunction_Reset(rtDW_MATLABFunction_FcuComputer_T *localDW);
  static void FcuComputer_MATLABFunction(boolean_T rtu_u, real_T rtu_Ts, boolean_T *rty_y, real_T rtp_isRisingEdge,
    real_T rtp_retriggerable, real_T rtp_triggerDuration, rtDW_MATLABFunction_FcuComputer_T *localDW);
  static void FcuComputer_MATLABFunction_i(const base_arinc_429 *rtu_u, real32_T rtu_default, real32_T *rty_y);
  static void FcuComputer_MATLABFunction1_Reset(rtDW_MATLABFunction1_FcuComputer_T *localDW);
  static void FcuComputer_MATLABFunction1(const fcu_outputs *rtu_in, boolean_T rtu_set_dashes, boolean_T
    rtu_set_selection, boolean_T *rty_dashes, rtDW_MATLABFunction1_FcuComputer_T *localDW);
  static void FcuComputer_MATLABFunction_o_Reset(rtDW_MATLABFunction_FcuComputer_e_T *localDW);
  static void FcuComputer_MATLABFunction_d(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
    rtDW_MATLABFunction_FcuComputer_e_T *localDW);
  static void FcuComputer_MATLABFunction_m(const base_arinc_429 *rtu_u, boolean_T *rty_y);
  static void FcuComputer_MATLABFunction_a(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y);
  static void FcuComputer_EFISFilterLogic_Reset(rtDW_EFISFilterLogic_FcuComputer_T *localDW);
  static void FcuComputer_EFISFilterLogic(boolean_T rtu_cstr, boolean_T rtu_wpt, boolean_T rtu_vord, boolean_T rtu_ndb,
    boolean_T rtu_arpt, efis_filter_selection *rty_efisFilter, rtDW_EFISFilterLogic_FcuComputer_T *localDW);
  static void FcuComputer_MATLABFunction_j_Init(rtDW_MATLABFunction_FcuComputer_b_T *localDW);
  static void FcuComputer_MATLABFunction_a_Reset(rtDW_MATLABFunction_FcuComputer_b_T *localDW);
  static void FcuComputer_MATLABFunction_p(boolean_T rtu_knob_push, boolean_T rtu_knob_pull, boolean_T *rty_std,
    boolean_T *rty_qnh, boolean_T *rty_qfe, rtDW_MATLABFunction_FcuComputer_b_T *localDW);
  static void FcuComputer_MATLABFunction1_i_Init(rtDW_MATLABFunction1_FcuComputer_b_T *localDW);
  static void FcuComputer_MATLABFunction1_c_Reset(rtDW_MATLABFunction1_FcuComputer_b_T *localDW);
  static void FcuComputer_MATLABFunction1_h(boolean_T rtu_std_active, boolean_T rtu_inhg_active, real_T rtu_click_count,
    real_T *rty_value_hpa, real_T *rty_value_inhg, rtDW_MATLABFunction1_FcuComputer_b_T *localDW);
  static void FcuComputer_MATLABFunction_i_Reset(rtDW_MATLABFunction_FcuComputer_l_T *localDW);
  static void FcuComputer_MATLABFunction_mb(boolean_T rtu_u, boolean_T *rty_y, boolean_T rtp_init,
    rtDW_MATLABFunction_FcuComputer_l_T *localDW);
  static void FcuComputer_MATLABFunction_e(const boolean_T rtu_u[19], real32_T *rty_y);
  static void FcuComputer_MATLABFunction_n(const base_fcu_efis_logic_outputs *rtu_logic, const
    base_fcu_efis_panel_inputs *rtu_data, int8_T *rty_baroValueMode, real32_T *rty_baroValue, int8_T *rty_baroMode);
};

#endif

