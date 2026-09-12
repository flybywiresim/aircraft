#ifndef A380PrimComputerFe_h_
#define A380PrimComputerFe_h_
#include "rtwtypes.h"
#include "A380PrimComputerFe_types.h"

class A380PrimComputerFe final
{
 public:
  struct rtDW_LagFilter_A380PrimComputerFe_T {
    real_T pY;
    real_T pU;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
  };

  struct rtDW_RateLimiter_A380PrimComputerFe_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct D_Work_A380PrimComputerFe_T {
    real_T Delay_DSTATE;
    real_T takeoff_config;
    real_T pY;
    real_T pY_b;
    real_T pU;
    real_T takeoff_config_e;
    real_T takeoff_config_n;
    real_T timeSinceCondition;
    real_T sAlphaFloor;
    uint8_T is_active_c15_A380PrimComputerFe;
    uint8_T is_c15_A380PrimComputerFe;
    boolean_T pY_not_empty;
    boolean_T pY_not_empty_d;
    boolean_T pU_not_empty;
    boolean_T output;
    boolean_T Runtime_MODE;
    rtDW_RateLimiter_A380PrimComputerFe_T sf_RateLimiter_k;
    rtDW_RateLimiter_A380PrimComputerFe_T sf_RateLimiter_b;
    rtDW_LagFilter_A380PrimComputerFe_T sf_LagFilter_d;
    rtDW_LagFilter_A380PrimComputerFe_T sf_LagFilter_pa;
    rtDW_LagFilter_A380PrimComputerFe_T sf_LagFilter_p;
    rtDW_LagFilter_A380PrimComputerFe_T sf_LagFilter_e;
    rtDW_RateLimiter_A380PrimComputerFe_T sf_RateLimiter;
    rtDW_LagFilter_A380PrimComputerFe_T sf_LagFilter;
  };

  struct ExternalInputs_A380PrimComputerFe_T {
    prim_outputs in;
  };

  struct ExternalOutputs_A380PrimComputerFe_T {
    prim_outputs out;
  };

  struct Parameters_A380PrimComputerFe_T {
    real_T LagFilter_C1;
    real_T LagFilter_C1_d;
    real_T WashoutFilter_C1;
    real_T LagFilter2_C1;
    real_T LagFilter1_C1;
    real_T LagFilter_C1_f;
    real_T DiscreteDerivativeVariableTs_Gain;
    real_T DiscreteDerivativeVariableTs_InitialCondition;
    real_T RateLimiterGenericVariableTs_InitialCondition;
    real_T CompareToConstant4_const;
    real_T CompareToConstant2_const;
    real_T CompareToConstant3_const;
    real_T CompareToConstant1_const;
    real_T CompareToConstant_const;
    real_T CompareToConstant_const_b;
    real_T CompareToConstant1_const_b;
    real_T RateLimiterGenericVariableTs1_lo;
    real_T RateLimiterGenericVariableTs2_lo;
    real_T RateLimiterGenericVariableTs_lo;
    real_T RateLimiterGenericVariableTs1_lo_d;
    real_T ConfirmNode_timeDelay;
    real_T RateLimiterGenericVariableTs1_up;
    real_T RateLimiterGenericVariableTs2_up;
    real_T RateLimiterGenericVariableTs_up;
    real_T RateLimiterGenericVariableTs1_up_j;
    a380_pitch_efcs_law EnumeratedConstant_Value;
    boolean_T ConfirmNode_isRisingEdge;
    prim_outputs out_Y0;
    real_T Constant_Value;
    real_T Vmcl5_Value;
    real_T Gain4_Gain;
    real_T Vmcl10_Value;
    real_T uDLookupTable_tableData[2];
    real_T uDLookupTable_bp01Data[2];
    real_T Vfe_35_Value;
    real_T Constant2_Value;
    real_T Constant3_Value;
    real_T alphafloor_tableData[24];
    real_T alphafloor_bp01Data[4];
    real_T alphafloor_bp02Data[6];
    real_T Gain_Gain;
    real_T VLSincreasemaxdeflection_tableData[6];
    real_T VLSincreasemaxdeflection_bp01Data[6];
    real_T Vmcl_Value;
    real_T Gain2_Gain;
    real_T uDLookupTable1_tableData[96];
    real_T uDLookupTable1_bp01Data[8];
    real_T uDLookupTable1_bp02Data[12];
    real_T nDLookupTable_tableData[96];
    real_T nDLookupTable_bp01Data[8];
    real_T nDLookupTable_bp02Data[2];
    real_T nDLookupTable_bp03Data[6];
    real_T Gain2_Gain_m;
    real_T uDLookupTable1_tableData_n[96];
    real_T uDLookupTable1_bp01Data_p[8];
    real_T uDLookupTable1_bp02Data_h[12];
    real_T Constant1_Value;
    real_T nDLookupTable_tableData_g[96];
    real_T nDLookupTable_bp01Data_n[8];
    real_T nDLookupTable_bp02Data_j[2];
    real_T nDLookupTable_bp03Data_k[6];
    real_T Gain2_Gain_d;
    real_T uDLookupTable1_tableData_p[96];
    real_T uDLookupTable1_bp01Data_o[8];
    real_T uDLookupTable1_bp02Data_p[12];
    real_T nDLookupTable_tableData_p[96];
    real_T nDLookupTable_bp01Data_c[8];
    real_T nDLookupTable_bp02Data_e[2];
    real_T nDLookupTable_bp03Data_l[6];
    real_T Switch_Threshold;
    real_T Gain2_Gain_n;
    real_T uDLookupTable1_tableData_m[96];
    real_T uDLookupTable1_bp01Data_pl[8];
    real_T uDLookupTable1_bp02Data_b[12];
    real_T Constant_Value_a;
    real_T nDLookupTable_tableData_d[96];
    real_T nDLookupTable_bp01Data_cz[8];
    real_T nDLookupTable_bp02Data_i[2];
    real_T nDLookupTable_bp03Data_h[6];
    real_T Gain2_Gain_j;
    real_T Vmcl20_Value;
    real_T Vfe_25_Value;
    real_T Gain3_Gain;
    real_T uDLookupTable_tableData_p[40];
    real_T uDLookupTable_bp01Data_n[8];
    real_T uDLookupTable_bp02Data[5];
    real_T Constant1_Value_j;
    real_T uDLookupTable_tableData_b[6];
    real_T uDLookupTable_bp01Data_m[6];
    real_T uDLookupTable1_tableData_l[6];
    real_T uDLookupTable1_bp01Data_j[6];
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Gain_Gain_m;
    real_T Bias_Bias;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Bias1_Bias;
    real_T Gain_Gain_e;
    real_T Gain1_Gain;
    real32_T uDLookupTable_tableData_a[15];
    real32_T uDLookupTable_bp01Data_e[5];
    real32_T uDLookupTable_bp02Data_o[3];
    uint32_T alphafloor_maxIndex[2];
    uint32_T uDLookupTable1_maxIndex[2];
    uint32_T nDLookupTable_maxIndex[3];
    uint32_T nDLookupTable_dimSizes[3];
    uint32_T uDLookupTable1_maxIndex_f[2];
    uint32_T nDLookupTable_maxIndex_f[3];
    uint32_T nDLookupTable_dimSizes_k[3];
    uint32_T uDLookupTable1_maxIndex_g[2];
    uint32_T nDLookupTable_maxIndex_b[3];
    uint32_T nDLookupTable_dimSizes_l[3];
    uint32_T uDLookupTable1_maxIndex_h[2];
    uint32_T nDLookupTable_maxIndex_h[3];
    uint32_T nDLookupTable_dimSizes_j[3];
    uint32_T uDLookupTable_maxIndex[2];
    uint32_T uDLookupTable_maxIndex_a[2];
    boolean_T reset_Value;
    boolean_T reset_Value_p;
    boolean_T reset_Value_o;
    boolean_T reset_Value_h;
  };

  A380PrimComputerFe(A380PrimComputerFe const&) = delete;
  A380PrimComputerFe& operator= (A380PrimComputerFe const&) & = delete;
  A380PrimComputerFe(A380PrimComputerFe &&) = delete;
  A380PrimComputerFe& operator= (A380PrimComputerFe &&) = delete;
  ExternalInputs_A380PrimComputerFe_T A380PrimComputerFe_U;
  ExternalOutputs_A380PrimComputerFe_T A380PrimComputerFe_Y;
  void initialize();
  void step();
  static void terminate();
  A380PrimComputerFe();
  ~A380PrimComputerFe();
 private:
  D_Work_A380PrimComputerFe_T A380PrimComputerFe_DWork;
  static Parameters_A380PrimComputerFe_T A380PrimComputerFe_P;
  static void A380PrimComputerFe_LagFilter_Reset(rtDW_LagFilter_A380PrimComputerFe_T *localDW);
  static void A380PrimComputerFe_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
    rtDW_LagFilter_A380PrimComputerFe_T *localDW);
  static void A380PrimComputerFe_RateLimiter_Reset(rtDW_RateLimiter_A380PrimComputerFe_T *localDW);
  static void A380PrimComputerFe_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, boolean_T
    rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputerFe_T *localDW);
  static void A380PrimComputerFe_VS1GfromVLS(real_T rtu_vls_conf_0, real_T rtu_vls_conf_other, real_T
    rtu_flap_handle_index, real_T *rty_vs1g);
  static void A380PrimComputerFe_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y);
  static void A380PrimComputerFe_MATLABFunction_k(const base_arinc_429 *rtu_u, real32_T *rty_y);
};

#endif

