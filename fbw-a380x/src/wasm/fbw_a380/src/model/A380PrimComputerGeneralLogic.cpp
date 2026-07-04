#include "A380PrimComputerGeneralLogic.h"
#include "A380PrimComputerGeneralLogic_types.h"
#include "rtwtypes.h"
#include <cmath>

void A380PrimComputerGeneralLogic::A380PrimComputerGeneralLogic_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T
  *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void A380PrimComputerGeneralLogic::A380PrimComputerGeneralLogic_MATLABFunction_b(const base_arinc_429 *rtu_u, real_T
  rtu_bit, uint32_T *rty_y)
{
  real32_T tmp;
  uint32_T a;
  tmp = std::round(rtu_u->Data);
  if (tmp < 4.2949673E+9F) {
    if (tmp >= 0.0F) {
      a = static_cast<uint32_T>(tmp);
    } else {
      a = 0U;
    }
  } else {
    a = MAX_uint32_T;
  }

  if (-(rtu_bit - 1.0) >= 0.0) {
    if (-(rtu_bit - 1.0) <= 31.0) {
      a <<= static_cast<uint8_T>(-(rtu_bit - 1.0));
    } else {
      a = 0U;
    }
  } else if (-(rtu_bit - 1.0) >= -31.0) {
    a >>= static_cast<uint8_T>(rtu_bit - 1.0);
  } else {
    a = 0U;
  }

  *rty_y = a & 1U;
}

void A380PrimComputerGeneralLogic::A380PrimComputerGeneralLogic_MATLABFunction_c_Reset
  (rtDW_MATLABFunction_A380PrimComputerGeneralLogic_o_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380PrimComputerGeneralLogic::A380PrimComputerGeneralLogic_MATLABFunction_j(boolean_T rtu_u, real_T rtu_Ts,
  boolean_T rtu_isRisingEdge, real_T rtu_timeDelay, boolean_T *rty_y,
  rtDW_MATLABFunction_A380PrimComputerGeneralLogic_o_T *localDW)
{
  if (rtu_u == rtu_isRisingEdge) {
    localDW->timeSinceCondition += rtu_Ts;
    if (localDW->timeSinceCondition >= rtu_timeDelay) {
      localDW->output = rtu_u;
    }
  } else {
    localDW->timeSinceCondition = 0.0;
    localDW->output = rtu_u;
  }

  *rty_y = localDW->output;
}

void A380PrimComputerGeneralLogic::step()
{
  real_T ca;
  real_T denom;
  int32_T tmp;
  real32_T v[3];
  real32_T rtb_Switch_idx_0;
  real32_T rtb_Switch_idx_1;
  real32_T rtb_Switch_idx_2;
  real32_T rtb_Switch_idx_3;
  real32_T rtb_V_ias;
  real32_T rtb_V_tas;
  real32_T rtb_alpha;
  real32_T rtb_mach;
  real32_T rtb_n_x;
  real32_T rtb_n_y;
  real32_T rtb_n_z;
  real32_T rtb_phi;
  real32_T rtb_phi_dot;
  real32_T rtb_q;
  real32_T rtb_r;
  real32_T rtb_ra3Word_Data;
  real32_T rtb_raComputationValue;
  real32_T rtb_theta_dot;
  uint32_T rtb_y;
  uint32_T rtb_y_d;
  uint32_T rtb_y_h;
  uint32_T rtb_y_j;
  uint32_T rtb_y_l;
  uint32_T rtb_y_pc;
  boolean_T rtb_AND;
  boolean_T rtb_AND1_f;
  boolean_T rtb_DataTypeConversion_by;
  boolean_T rtb_DataTypeConversion_l;
  boolean_T rtb_OR;
  boolean_T rtb_OR1_k;
  boolean_T rtb_OR3;
  boolean_T rtb_OR3_m;
  boolean_T rtb_OR4;
  boolean_T rtb_OR4_p;
  boolean_T rtb_OR6;
  boolean_T rtb_OR7;
  boolean_T rtb_doubleAdrFault;
  boolean_T rtb_ra3Invalid;
  boolean_T rtb_tripleAdrFault;
  boolean_T rtb_y_k;
  if (A380PrimComputerGeneralLogic_U.in.sim_data.computer_running) {
    if (!A380PrimComputerGeneralLogic_DWork.Runtime_MODE) {
      A380PrimComputerGeneralLogic_DWork.pY_not_empty = false;
      A380PrimComputerGeneralLogic_DWork.pU_not_empty = false;
      A380PrimComputerGeneralLogic_MATLABFunction_c_Reset(&A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_lf);
      A380PrimComputerGeneralLogic_MATLABFunction_c_Reset(&A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_j);
      A380PrimComputerGeneralLogic_MATLABFunction_c_Reset(&A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_m);
      A380PrimComputerGeneralLogic_DWork.ra1CoherenceRejected = false;
      A380PrimComputerGeneralLogic_DWork.ra2CoherenceRejected = false;
      A380PrimComputerGeneralLogic_DWork.ra3CoherenceRejected = false;
      A380PrimComputerGeneralLogic_DWork.Runtime_MODE = true;
    }

    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel2_bit, &rtb_y_h);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel3_bit, &rtb_y_l);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel4_bit, &rtb_y_pc);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel5_bit, &rtb_y_j);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel6_bit, &rtb_y);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel7_bit, &rtb_y_d);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word, &rtb_DataTypeConversion_by);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_2_bus.slat_flap_system_status_word, &rtb_OR4_p);
    rtb_OR1_k = ((!rtb_DataTypeConversion_by) && (!rtb_OR4_p));
    if (!rtb_OR1_k) {
      if (rtb_y_h != 0U) {
        rtb_Switch_idx_0 = 0.0F;
      } else if ((rtb_y_l != 0U) && (rtb_y_d != 0U)) {
        rtb_Switch_idx_0 = 1.0F;
      } else if ((rtb_y_l != 0U) && (rtb_y_d == 0U)) {
        rtb_Switch_idx_0 = 2.0F;
      } else if (rtb_y_pc != 0U) {
        rtb_Switch_idx_0 = 3.0F;
      } else if (rtb_y_j != 0U) {
        rtb_Switch_idx_0 = 4.0F;
      } else if (rtb_y != 0U) {
        rtb_Switch_idx_0 = 5.0F;
      } else {
        rtb_Switch_idx_0 = 0.0F;
      }

      rtb_Switch_idx_1 = A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
      rtb_Switch_idx_2 = A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
      rtb_Switch_idx_3 = A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
    } else if (A380PrimComputerGeneralLogic_P.Constant5_Value) {
      rtb_Switch_idx_0 = A380PrimComputerGeneralLogic_P.Constant2_Value;
      rtb_Switch_idx_1 = A380PrimComputerGeneralLogic_P.Constant3_Value;
      rtb_Switch_idx_2 = A380PrimComputerGeneralLogic_P.Constant6_Value;
      rtb_Switch_idx_3 = A380PrimComputerGeneralLogic_P.Constant4_Value_i;
    } else {
      rtb_Switch_idx_0 = A380PrimComputerGeneralLogic_P.Constant1_Value;
      rtb_Switch_idx_1 = A380PrimComputerGeneralLogic_P.Constant1_Value;
      rtb_Switch_idx_2 = A380PrimComputerGeneralLogic_P.Constant1_Value;
      rtb_Switch_idx_3 = A380PrimComputerGeneralLogic_P.Constant1_Value;
    }

    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel1_bit, &rtb_y_h);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel8_bit, &rtb_y_d);
    A380PrimComputerGeneralLogic_Y.out.general_logic.slats_locked = (rtb_y_h != 0U);
    rtb_DataTypeConversion_by = ((A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
      (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
       (SignStatusMatrix::FailureWarning)) ||
      (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.SSM == static_cast<uint32_T>
       (SignStatusMatrix::FailureWarning)) ||
      (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
       (SignStatusMatrix::FailureWarning)) || A380PrimComputerGeneralLogic_P.Constant1_Value_b ||
      A380PrimComputerGeneralLogic_P.Constant1_Value_b);
    rtb_OR3 = ((A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.mach.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || A380PrimComputerGeneralLogic_P.Constant1_Value_b ||
               A380PrimComputerGeneralLogic_P.Constant1_Value_b);
    rtb_OR4 = ((A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || A380PrimComputerGeneralLogic_P.Constant1_Value_b ||
               A380PrimComputerGeneralLogic_P.Constant1_Value_b);
    rtb_ra3Invalid = (rtb_DataTypeConversion_by && rtb_OR3);
    rtb_doubleAdrFault = (rtb_ra3Invalid || (rtb_DataTypeConversion_by && rtb_OR4) || (rtb_OR3 && rtb_OR4));
    rtb_tripleAdrFault = (rtb_ra3Invalid && rtb_OR4);
    rtb_OR = ((A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) ||
              (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_angle_deg.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) ||
              (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) ||
              (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_long_accel_g.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) ||
              (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) ||
              (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) ||
              (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) ||
              (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) || A380PrimComputerGeneralLogic_P.Constant_Value);
    rtb_OR6 = ((A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || A380PrimComputerGeneralLogic_P.Constant_Value);
    rtb_OR7 = ((A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_angle_deg.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_long_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || A380PrimComputerGeneralLogic_P.Constant_Value);
    rtb_DataTypeConversion_l = !rtb_OR4;
    rtb_AND = !rtb_OR3;
    rtb_OR4_p = (rtb_DataTypeConversion_by && rtb_AND);
    if (rtb_OR4_p && rtb_DataTypeConversion_l) {
      rtb_V_ias = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.mach.Data +
                  A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if ((!rtb_DataTypeConversion_by) && rtb_OR3 && rtb_DataTypeConversion_l) {
      rtb_V_ias = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.Data +
                  A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if (((!rtb_DataTypeConversion_by) && rtb_AND && rtb_DataTypeConversion_l) || ((!rtb_DataTypeConversion_by) &&
                (!rtb_OR3) && rtb_OR4)) {
      rtb_V_ias = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.Data +
                  A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if ((!rtb_DataTypeConversion_by) && rtb_OR3 && rtb_OR4) {
      rtb_V_ias = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
      rtb_mach = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.Data;
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    } else if (rtb_OR4_p && rtb_OR4) {
      rtb_V_ias = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
      rtb_mach = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.mach.Data;
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    } else if (rtb_ra3Invalid && rtb_DataTypeConversion_l) {
      rtb_V_ias = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
      rtb_mach = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.Data;
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
    } else {
      rtb_V_ias = 0.0F;
      rtb_V_tas = 0.0F;
      rtb_mach = 0.0F;
      rtb_alpha = 0.0F;
    }

    if ((!A380PrimComputerGeneralLogic_DWork.pY_not_empty) || (!A380PrimComputerGeneralLogic_DWork.pU_not_empty)) {
      A380PrimComputerGeneralLogic_DWork.pU = rtb_alpha;
      A380PrimComputerGeneralLogic_DWork.pU_not_empty = true;
      A380PrimComputerGeneralLogic_DWork.pY = rtb_alpha;
      A380PrimComputerGeneralLogic_DWork.pY_not_empty = true;
    }

    denom = A380PrimComputerGeneralLogic_U.in.time.dt * A380PrimComputerGeneralLogic_P.LagFilter_C1 + 2.0;
    ca = A380PrimComputerGeneralLogic_U.in.time.dt * A380PrimComputerGeneralLogic_P.LagFilter_C1 / denom;
    A380PrimComputerGeneralLogic_DWork.pY = (2.0 - A380PrimComputerGeneralLogic_U.in.time.dt *
      A380PrimComputerGeneralLogic_P.LagFilter_C1) / denom * A380PrimComputerGeneralLogic_DWork.pY + (rtb_alpha * ca +
      A380PrimComputerGeneralLogic_DWork.pU * ca);
    A380PrimComputerGeneralLogic_DWork.pU = rtb_alpha;
    rtb_DataTypeConversion_l = !rtb_OR6;
    rtb_AND = !rtb_OR7;
    rtb_OR4_p = (rtb_OR && rtb_AND);
    if (rtb_OR4_p && rtb_DataTypeConversion_l) {
      rtb_alpha = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data) / 2.0F;
      rtb_phi = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data) / 2.0F;
      rtb_q = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data +
               A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data) / 2.0F;
      rtb_r = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data +
               A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data) / 2.0F;
      rtb_n_x = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data) / 2.0F;
      rtb_n_y = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data) / 2.0F;
      rtb_n_z = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data) / 2.0F;
      rtb_theta_dot = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data +
                       A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data) / 2.0F;
      rtb_phi_dot = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data +
                     A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data) / 2.0F;
    } else if ((!rtb_OR) && rtb_OR7 && rtb_DataTypeConversion_l) {
      rtb_alpha = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data) / 2.0F;
      rtb_phi = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data) / 2.0F;
      rtb_q = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data +
               A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data) / 2.0F;
      rtb_r = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data +
               A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data) / 2.0F;
      rtb_n_x = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data) / 2.0F;
      rtb_n_y = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data) / 2.0F;
      rtb_n_z = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data) / 2.0F;
      rtb_theta_dot = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data +
                       A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data) / 2.0F;
      rtb_phi_dot = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data +
                     A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data) / 2.0F;
    } else if (((!rtb_OR) && rtb_AND && rtb_DataTypeConversion_l) || ((!rtb_OR) && (!rtb_OR7) && rtb_OR6)) {
      rtb_alpha = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data) / 2.0F;
      rtb_phi = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data) / 2.0F;
      rtb_q = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data +
               A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data) / 2.0F;
      rtb_r = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data +
               A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data) / 2.0F;
      rtb_n_x = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data) / 2.0F;
      rtb_n_y = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data) / 2.0F;
      rtb_n_z = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data +
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data) / 2.0F;
      rtb_theta_dot = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data +
                       A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data) / 2.0F;
      rtb_phi_dot = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data +
                     A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data) / 2.0F;
    } else if ((!rtb_OR) && rtb_OR7 && rtb_OR6) {
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
      rtb_phi = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
      rtb_q = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
      rtb_n_y = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
      rtb_n_z = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    } else if (rtb_OR4_p && rtb_OR6) {
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
      rtb_phi = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
      rtb_q = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
      rtb_n_y = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
      rtb_n_z = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
    } else if (rtb_OR && rtb_OR7 && rtb_DataTypeConversion_l) {
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
      rtb_phi = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data;
      rtb_q = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data;
      rtb_n_y = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
      rtb_n_z = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
    } else {
      rtb_alpha = 0.0F;
      rtb_phi = 0.0F;
      rtb_q = 0.0F;
      rtb_r = 0.0F;
      rtb_n_x = 0.0F;
      rtb_n_y = 0.0F;
      rtb_n_z = 0.0F;
      rtb_theta_dot = 0.0F;
      rtb_phi_dot = 0.0F;
    }

    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel_bit, &rtb_y_h);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       &rtb_DataTypeConversion_by);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel1_bit_j, &rtb_y_h);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_OR4_p);
    if (A380PrimComputerGeneralLogic_U.in.discrete_inputs.is_unit_1) {
      rtb_y_h = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.radio_height_1_ft.SSM;
      rtb_raComputationValue = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.radio_height_1_ft.Data;
      rtb_y_l = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.radio_height_2_ft.SSM;
      rtb_ra3Word_Data = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.radio_height_2_ft.Data;
    } else if (A380PrimComputerGeneralLogic_U.in.discrete_inputs.is_unit_2) {
      rtb_y_h = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.radio_height_1_ft.SSM;
      rtb_raComputationValue = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.radio_height_1_ft.Data;
      rtb_y_l = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.radio_height_1_ft.SSM;
      rtb_ra3Word_Data = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.radio_height_1_ft.Data;
    } else {
      rtb_y_h = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.radio_height_2_ft.SSM;
      rtb_raComputationValue = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.radio_height_2_ft.Data;
      rtb_y_l = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.radio_height_2_ft.SSM;
      rtb_ra3Word_Data = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.radio_height_2_ft.Data;
    }

    if (rtb_y_h != static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) {
      rtb_y_l = rtb_y_h;
      rtb_ra3Word_Data = rtb_raComputationValue;
    }

    rtb_OR3 = (rtb_tripleAdrFault || (rtb_doubleAdrFault && A380PrimComputerGeneralLogic_P.Constant1_Value_b));
    A380PrimComputerGeneralLogic_MATLABFunction_j
      (((A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data > 50.0F) &&
        (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>
         (SignStatusMatrix::NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_OR3),
       A380PrimComputerGeneralLogic_U.in.time.dt, A380PrimComputerGeneralLogic_P.ConfirmNode2_isRisingEdge,
       A380PrimComputerGeneralLogic_P.ConfirmNode2_timeDelay, &rtb_DataTypeConversion_by,
       &A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_lf);
    A380PrimComputerGeneralLogic_MATLABFunction_j
      (((A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data > 50.0F) &&
        (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>
         (SignStatusMatrix::NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_OR3),
       A380PrimComputerGeneralLogic_U.in.time.dt, A380PrimComputerGeneralLogic_P.ConfirmNode1_isRisingEdge,
       A380PrimComputerGeneralLogic_P.ConfirmNode1_timeDelay, &rtb_DataTypeConversion_l,
       &A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_j);
    A380PrimComputerGeneralLogic_MATLABFunction_j(((rtb_ra3Word_Data > 50.0F) && (rtb_y_l == static_cast<uint32_T>
      (SignStatusMatrix::NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_OR3),
      A380PrimComputerGeneralLogic_U.in.time.dt, A380PrimComputerGeneralLogic_P.ConfirmNode3_isRisingEdge,
      A380PrimComputerGeneralLogic_P.ConfirmNode3_timeDelay, &rtb_OR4_p,
      &A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_m);
    A380PrimComputerGeneralLogic_DWork.ra1CoherenceRejected = (rtb_DataTypeConversion_by ||
      A380PrimComputerGeneralLogic_DWork.ra1CoherenceRejected);
    A380PrimComputerGeneralLogic_DWork.ra2CoherenceRejected = (rtb_DataTypeConversion_l ||
      A380PrimComputerGeneralLogic_DWork.ra2CoherenceRejected);
    A380PrimComputerGeneralLogic_DWork.ra3CoherenceRejected = (rtb_OR4_p ||
      A380PrimComputerGeneralLogic_DWork.ra3CoherenceRejected);
    rtb_OR3 = ((A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || A380PrimComputerGeneralLogic_DWork.ra1CoherenceRejected);
    rtb_OR4 = ((A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || A380PrimComputerGeneralLogic_DWork.ra2CoherenceRejected);
    rtb_ra3Invalid = ((rtb_y_l == static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                      A380PrimComputerGeneralLogic_DWork.ra3CoherenceRejected);
    rtb_raComputationValue = 250.0F;
    A380PrimComputerGeneralLogic_Y.out.general_logic.two_ra_failure = false;
    switch ((!rtb_OR3 + !rtb_OR4) + !rtb_ra3Invalid) {
     case 3:
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
      v[2] = rtb_ra3Word_Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data < rtb_ra3Word_Data) {
          tmp = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data < rtb_ra3Word_Data) {
          tmp = 2;
        } else {
          tmp = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data < rtb_ra3Word_Data) {
        tmp = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data < rtb_ra3Word_Data) {
        tmp = 2;
      } else {
        tmp = 1;
      }

      rtb_raComputationValue = v[tmp];
      break;

     case 2:
      if (rtb_OR3) {
        rtb_raComputationValue = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data +
          rtb_ra3Word_Data) / 2.0F;
      } else if (rtb_OR4) {
        rtb_raComputationValue = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data +
          rtb_ra3Word_Data) / 2.0F;
      } else if (rtb_ra3Invalid) {
        rtb_raComputationValue = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data +
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) / 2.0F;
      }
      break;

     case 1:
      A380PrimComputerGeneralLogic_Y.out.general_logic.two_ra_failure = true;
      if ((rtb_V_ias <= 180.0F) || ((!rtb_tripleAdrFault) && ((!rtb_doubleAdrFault) ||
            (!A380PrimComputerGeneralLogic_P.Constant1_Value_b)))) {
        if (!rtb_OR3) {
          rtb_raComputationValue = A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
        } else if (!rtb_OR4) {
          rtb_raComputationValue = A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
        } else if (!rtb_ra3Invalid) {
          rtb_raComputationValue = rtb_ra3Word_Data;
        }
      }
      break;

     default:
      A380PrimComputerGeneralLogic_Y.out.general_logic.two_ra_failure = true;
      break;
    }

    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, &rtb_OR4_p);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, &rtb_y_k);
    A380PrimComputerGeneralLogic_Y.out.general_logic.double_lgciu_failure = ((!rtb_OR4_p) && (!rtb_y_k));
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
       A380PrimComputerGeneralLogic_P.BitfromLabel6_bit_o, &rtb_y_h);
    rtb_DataTypeConversion_l = (rtb_y_h != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
       A380PrimComputerGeneralLogic_P.BitfromLabel1_bit_jr, &rtb_y_h);
    rtb_AND = ((rtb_DataTypeConversion_l || (rtb_y_h != 0U)) && rtb_OR4_p);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
       A380PrimComputerGeneralLogic_P.BitfromLabel3_bit_g, &rtb_y_h);
    rtb_DataTypeConversion_l = (rtb_y_h != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
       A380PrimComputerGeneralLogic_P.BitfromLabel2_bit_m, &rtb_y_h);
    rtb_AND1_f = ((rtb_DataTypeConversion_l || (rtb_y_h != 0U)) && rtb_y_k);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, &rtb_OR4_p);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel10_bit, &rtb_y_h);
    rtb_DataTypeConversion_l = (rtb_y_h != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel8_bit_i, &rtb_y_h);
    rtb_DataTypeConversion_by = (rtb_y_h != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel9_bit, &rtb_y_h);
    rtb_OR3_m = ((rtb_DataTypeConversion_by || (rtb_y_h != 0U) || rtb_DataTypeConversion_l) && rtb_OR4_p);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, &rtb_y_k);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel4_bit_h, &rtb_y_h);
    rtb_OR4_p = (rtb_y_h != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel5_bit_l, &rtb_y_h);
    rtb_DataTypeConversion_by = (rtb_y_h != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction_b
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel7_bit_l, &rtb_y_h);
    A380PrimComputerGeneralLogic_Y.out.data = A380PrimComputerGeneralLogic_U.in;
    A380PrimComputerGeneralLogic_Y.out.general_logic.double_adr_failure = rtb_doubleAdrFault;
    A380PrimComputerGeneralLogic_Y.out.general_logic.triple_adr_failure = rtb_tripleAdrFault;
    A380PrimComputerGeneralLogic_Y.out.general_logic.cas_or_mach_disagree =
      A380PrimComputerGeneralLogic_P.Constant1_Value_b;
    A380PrimComputerGeneralLogic_Y.out.general_logic.alpha_disagree = A380PrimComputerGeneralLogic_P.Constant1_Value_b;
    rtb_DataTypeConversion_l = (rtb_OR && rtb_OR6);
    A380PrimComputerGeneralLogic_Y.out.general_logic.double_ir_failure = (rtb_DataTypeConversion_l || (rtb_OR && rtb_OR7)
      || (rtb_OR6 && rtb_OR7));
    A380PrimComputerGeneralLogic_Y.out.general_logic.triple_ir_failure = (rtb_DataTypeConversion_l && rtb_OR7);
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_failure_not_self_detected =
      A380PrimComputerGeneralLogic_P.Constant_Value;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_computation_data.mach = rtb_mach;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_computation_data.alpha_deg =
      A380PrimComputerGeneralLogic_DWork.pY;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.theta_deg = rtb_alpha;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.phi_deg = rtb_phi;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.q_deg_s = rtb_q;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.r_deg_s = rtb_r;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.n_x_g = rtb_n_x;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.n_y_g = rtb_n_y;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.n_z_g = rtb_n_z;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ra_computation_data_ft = rtb_raComputationValue;
    A380PrimComputerGeneralLogic_Y.out.general_logic.all_ra_failure = (rtb_OR3 && rtb_OR4 && rtb_ra3Invalid);
    A380PrimComputerGeneralLogic_Y.out.general_logic.all_sfcc_lost = rtb_OR1_k;
    A380PrimComputerGeneralLogic_Y.out.general_logic.flap_handle_index = rtb_Switch_idx_0;
    A380PrimComputerGeneralLogic_Y.out.general_logic.flap_angle_deg = rtb_Switch_idx_1;
    A380PrimComputerGeneralLogic_Y.out.general_logic.slat_angle_deg = rtb_Switch_idx_2;
    A380PrimComputerGeneralLogic_Y.out.general_logic.slat_flap_actual_pos = rtb_Switch_idx_3;
    A380PrimComputerGeneralLogic_Y.out.general_logic.flaps_locked = (rtb_y_d != 0U);
    A380PrimComputerGeneralLogic_Y.out.laws = A380PrimComputerGeneralLogic_P.prim_laws_output_MATLABStruct;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic = A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct;
    A380PrimComputerGeneralLogic_Y.out.fg_logic = A380PrimComputerGeneralLogic_P.prim_fg_logic_output_MATLABStruct;
    A380PrimComputerGeneralLogic_Y.out.discrete_outputs =
      A380PrimComputerGeneralLogic_P.prim_discrete_output_MATLABStruct;
    A380PrimComputerGeneralLogic_Y.out.analog_outputs = A380PrimComputerGeneralLogic_P.prim_analog_output_MATLABStruct;
    A380PrimComputerGeneralLogic_Y.out.bus_outputs = A380PrimComputerGeneralLogic_P.Constant4_Value;
    A380PrimComputerGeneralLogic_Y.out.general_logic.on_ground = (rtb_AND || rtb_AND1_f);
    A380PrimComputerGeneralLogic_Y.out.general_logic.tracking_mode_on =
      (A380PrimComputerGeneralLogic_U.in.sim_data.slew_on || A380PrimComputerGeneralLogic_U.in.sim_data.pause_on ||
       A380PrimComputerGeneralLogic_U.in.sim_data.tracking_mode_on_override);
    A380PrimComputerGeneralLogic_Y.out.general_logic.landing_gear_down = (rtb_OR3_m && ((rtb_OR4_p ||
      rtb_DataTypeConversion_by || (rtb_y_h != 0U)) && rtb_y_k));
  } else {
    A380PrimComputerGeneralLogic_DWork.Runtime_MODE = false;
  }
}

void A380PrimComputerGeneralLogic::initialize()
{
  A380PrimComputerGeneralLogic_Y.out = A380PrimComputerGeneralLogic_P.out_Y0;
}

void A380PrimComputerGeneralLogic::terminate()
{
}

A380PrimComputerGeneralLogic::A380PrimComputerGeneralLogic():
  A380PrimComputerGeneralLogic_U(),
  A380PrimComputerGeneralLogic_Y(),
  A380PrimComputerGeneralLogic_DWork()
{
}

A380PrimComputerGeneralLogic::~A380PrimComputerGeneralLogic() = default;
