#ifndef A380PrimComputerGeneralLogic_h_
#define A380PrimComputerGeneralLogic_h_
#include "rtwtypes.h"
#include "A380PrimComputerGeneralLogic_types.h"

class A380PrimComputerGeneralLogic final
{
 public:
  struct rtDW_MATLABFunction_A380PrimComputerGeneralLogic_o_T {
    real_T timeSinceCondition;
    boolean_T output;
  };

  struct D_Work_A380PrimComputerGeneralLogic_T {
    real_T pY;
    real_T pU;
    boolean_T ra1CoherenceRejected;
    boolean_T ra2CoherenceRejected;
    boolean_T ra3CoherenceRejected;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
    boolean_T Runtime_MODE;
    rtDW_MATLABFunction_A380PrimComputerGeneralLogic_o_T sf_MATLABFunction_m;
    rtDW_MATLABFunction_A380PrimComputerGeneralLogic_o_T sf_MATLABFunction_lf;
    rtDW_MATLABFunction_A380PrimComputerGeneralLogic_o_T sf_MATLABFunction_j;
  };

  struct ExternalInputs_A380PrimComputerGeneralLogic_T {
    prim_inputs in;
  };

  struct ExternalOutputs_A380PrimComputerGeneralLogic_T {
    prim_outputs out;
  };

  struct Parameters_A380PrimComputerGeneralLogic_T {
    struct_yDWHCPeCVEhBdtz6xS9CGF prim_fctl_logic_output_MATLABStruct;
    base_prim_laws_outputs prim_laws_output_MATLABStruct;
    base_prim_analog_outputs prim_analog_output_MATLABStruct;
    base_prim_discrete_outputs prim_discrete_output_MATLABStruct;
    base_prim_fg_logic_output prim_fg_logic_output_MATLABStruct;
    real_T LagFilter_C1;
    real_T BitfromLabel2_bit;
    real_T BitfromLabel3_bit;
    real_T BitfromLabel4_bit;
    real_T BitfromLabel5_bit;
    real_T BitfromLabel6_bit;
    real_T BitfromLabel7_bit;
    real_T BitfromLabel1_bit;
    real_T BitfromLabel8_bit;
    real_T BitfromLabel_bit;
    real_T BitfromLabel1_bit_j;
    real_T BitfromLabel6_bit_o;
    real_T BitfromLabel1_bit_jr;
    real_T BitfromLabel3_bit_g;
    real_T BitfromLabel2_bit_m;
    real_T BitfromLabel10_bit;
    real_T BitfromLabel8_bit_i;
    real_T BitfromLabel9_bit;
    real_T BitfromLabel4_bit_h;
    real_T BitfromLabel5_bit_l;
    real_T BitfromLabel7_bit_l;
    real_T ConfirmNode2_timeDelay;
    real_T ConfirmNode1_timeDelay;
    real_T ConfirmNode3_timeDelay;
    boolean_T ConfirmNode2_isRisingEdge;
    boolean_T ConfirmNode1_isRisingEdge;
    boolean_T ConfirmNode3_isRisingEdge;
    prim_outputs out_Y0;
    base_prim_out_bus Constant4_Value;
    base_prim_general_logic_outputs Constant6_Value;
    base_prim_flight_envelope_outputs Constant7_Value;
    real32_T Constant2_Value;
    real32_T Constant3_Value;
    real32_T Constant6_Value_a;
    real32_T Constant4_Value_i;
    real32_T Constant1_Value;
    real32_T FlapFPPUtoSurfaceAngle_tableData[7];
    real32_T FlapFPPUtoSurfaceAngle_bp01Data[7];
    real32_T SlatFPPUtoSurfaceAngle_tableData[3];
    real32_T SlatFPPUtoSurfaceAngle_bp01Data[3];
    boolean_T Constant5_Value;
    boolean_T Constant1_Value_b;
    boolean_T Constant_Value;
  };

  A380PrimComputerGeneralLogic(A380PrimComputerGeneralLogic const&) = delete;
  A380PrimComputerGeneralLogic& operator= (A380PrimComputerGeneralLogic const&) & = delete;
  A380PrimComputerGeneralLogic(A380PrimComputerGeneralLogic &&) = delete;
  A380PrimComputerGeneralLogic& operator= (A380PrimComputerGeneralLogic &&) = delete;
  ExternalInputs_A380PrimComputerGeneralLogic_T A380PrimComputerGeneralLogic_U;
  ExternalOutputs_A380PrimComputerGeneralLogic_T A380PrimComputerGeneralLogic_Y;
  void initialize();
  void step();
  static void terminate();
  A380PrimComputerGeneralLogic();
  ~A380PrimComputerGeneralLogic();
 private:
  D_Work_A380PrimComputerGeneralLogic_T A380PrimComputerGeneralLogic_DWork;
  static Parameters_A380PrimComputerGeneralLogic_T A380PrimComputerGeneralLogic_P;
  static void A380PrimComputerGeneralLogic_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y);
  static void A380PrimComputerGeneralLogic_MATLABFunction_b(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y);
  static void A380PrimComputerGeneralLogic_MATLABFunction_c_Reset(rtDW_MATLABFunction_A380PrimComputerGeneralLogic_o_T
    *localDW);
  static void A380PrimComputerGeneralLogic_MATLABFunction_j(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge,
    real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputerGeneralLogic_o_T *localDW);
};

#endif

