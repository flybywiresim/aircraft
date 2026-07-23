#include "A380PrimComputerGeneralLogic.h"
#include "A380PrimComputerGeneralLogic_types.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_iflf_binlxpw.h"

void A380PrimComputerGeneralLogic::A380PrimComputerGeneralLogic_MATLABFunction(const base_arinc_429 *rtu_u, real_T
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

void A380PrimComputerGeneralLogic::A380PrimComputerGeneralLogic_MATLABFunction_g_Reset
  (rtDW_MATLABFunction_A380PrimComputerGeneralLogic_h_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380PrimComputerGeneralLogic::A380PrimComputerGeneralLogic_MATLABFunction_d(boolean_T rtu_u, real_T rtu_Ts,
  boolean_T rtu_isRisingEdge, real_T rtu_timeDelay, boolean_T *rty_y,
  rtDW_MATLABFunction_A380PrimComputerGeneralLogic_h_T *localDW)
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

void A380PrimComputerGeneralLogic::A380PrimComputerGeneralLogic_MATLABFunction_f_Reset
  (rtDW_MATLABFunction_A380PrimComputerGeneralLogic_l_T *localDW)
{
  localDW->output = false;
}

void A380PrimComputerGeneralLogic::A380PrimComputerGeneralLogic_MATLABFunction_h(real_T rtu_u, real_T rtu_highTrigger,
  real_T rtu_lowTrigger, boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputerGeneralLogic_l_T *localDW)
{
  boolean_T output_tmp;
  output_tmp = !localDW->output;
  localDW->output = ((output_tmp && (rtu_u >= rtu_highTrigger)) || ((output_tmp || (rtu_u > rtu_lowTrigger)) &&
    localDW->output));
  *rty_y = localDW->output;
}

void A380PrimComputerGeneralLogic::A380PrimComputerGeneralLogic_MATLABFunction_a(const base_arinc_429 *rtu_u, boolean_T *
  rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void A380PrimComputerGeneralLogic::step()
{
  const base_arinc_429 *rtb_Switch3_0;
  real_T ca;
  real_T denom;
  int32_T rtb_handleIndex;
  real32_T v[3];
  real32_T rtb_FlapFPPUtoSurfaceAngle;
  real32_T rtb_SlatFPPUtoSurfaceAngle;
  real32_T rtb_Switch_idx_1;
  real32_T rtb_Switch_idx_2;
  real32_T rtb_V_ias;
  real32_T rtb_V_tas;
  real32_T rtb_alpha;
  real32_T rtb_altStd;
  real32_T rtb_mach;
  real32_T rtb_n_x;
  real32_T rtb_n_y;
  real32_T rtb_n_z;
  real32_T rtb_p_s_c;
  real32_T rtb_phi;
  real32_T rtb_phi_dot;
  real32_T rtb_q;
  real32_T rtb_r;
  real32_T rtb_raComputationValue;
  real32_T rtb_theta;
  real32_T rtb_theta_dot;
  uint32_T rtb_y;
  uint32_T rtb_y_d;
  uint32_T rtb_y_dw;
  uint32_T rtb_y_f;
  uint32_T rtb_y_gqj;
  uint32_T rtb_y_l;
  boolean_T rtb_DataTypeConversion_k;
  boolean_T rtb_NOT2;
  boolean_T rtb_OR;
  boolean_T rtb_OR1;
  boolean_T rtb_OR2;
  boolean_T rtb_OR3;
  boolean_T rtb_OR3_m;
  boolean_T rtb_OR4;
  boolean_T rtb_OR6;
  boolean_T rtb_OR7;
  boolean_T rtb_doubleAdrFault;
  boolean_T rtb_ra1Invalid;
  boolean_T rtb_ra2Invalid;
  boolean_T rtb_ra3Invalid;
  boolean_T rtb_tripleAdrFault;
  boolean_T rtb_y_a;
  boolean_T rtb_y_c;
  boolean_T rtb_y_oj;
  if (A380PrimComputerGeneralLogic_U.in.sim_data.computer_running) {
    if (!A380PrimComputerGeneralLogic_DWork.Runtime_MODE) {
      A380PrimComputerGeneralLogic_DWork.pY_not_empty = false;
      A380PrimComputerGeneralLogic_DWork.pU_not_empty = false;
      A380PrimComputerGeneralLogic_MATLABFunction_g_Reset(&A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_lf);
      A380PrimComputerGeneralLogic_MATLABFunction_g_Reset(&A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_j);
      A380PrimComputerGeneralLogic_MATLABFunction_g_Reset(&A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_mm);
      A380PrimComputerGeneralLogic_DWork.ra1CoherenceRejected = false;
      A380PrimComputerGeneralLogic_DWork.ra2CoherenceRejected = false;
      A380PrimComputerGeneralLogic_DWork.ra3CoherenceRejected = false;
      A380PrimComputerGeneralLogic_MATLABFunction_f_Reset(&A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_h);
      A380PrimComputerGeneralLogic_MATLABFunction_g_Reset(&A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_d);
      A380PrimComputerGeneralLogic_MATLABFunction_f_Reset(&A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_id);
      A380PrimComputerGeneralLogic_MATLABFunction_g_Reset(&A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_i4);
      A380PrimComputerGeneralLogic_DWork.Runtime_MODE = true;
    }

    A380PrimComputerGeneralLogic_MATLABFunction_a
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word, &rtb_y_oj);
    rtb_DataTypeConversion_k = !rtb_y_oj;
    if (rtb_DataTypeConversion_k) {
      rtb_Switch3_0 = &A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word;
    } else {
      rtb_Switch3_0 = &A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_2_bus.slat_flap_system_status_word;
    }

    A380PrimComputerGeneralLogic_MATLABFunction(rtb_Switch3_0, A380PrimComputerGeneralLogic_P.BitfromLabel2_bit,
      &rtb_y_dw);
    A380PrimComputerGeneralLogic_MATLABFunction(rtb_Switch3_0, A380PrimComputerGeneralLogic_P.BitfromLabel3_bit,
      &rtb_y_gqj);
    A380PrimComputerGeneralLogic_MATLABFunction(rtb_Switch3_0, A380PrimComputerGeneralLogic_P.BitfromLabel4_bit,
      &rtb_y_f);
    A380PrimComputerGeneralLogic_MATLABFunction(rtb_Switch3_0, A380PrimComputerGeneralLogic_P.BitfromLabel5_bit,
      &rtb_y_l);
    A380PrimComputerGeneralLogic_MATLABFunction(rtb_Switch3_0, A380PrimComputerGeneralLogic_P.BitfromLabel6_bit, &rtb_y);
    A380PrimComputerGeneralLogic_MATLABFunction(rtb_Switch3_0, A380PrimComputerGeneralLogic_P.BitfromLabel7_bit,
      &rtb_y_d);
    if (rtb_y_dw != 0U) {
      rtb_handleIndex = 0;
    } else if ((rtb_y_gqj != 0U) && (rtb_y_d != 0U)) {
      rtb_handleIndex = 1;
    } else if ((rtb_y_gqj != 0U) && (rtb_y_d == 0U)) {
      rtb_handleIndex = 2;
    } else if (rtb_y_f != 0U) {
      rtb_handleIndex = 3;
    } else if (rtb_y_l != 0U) {
      rtb_handleIndex = 4;
    } else if (rtb_y != 0U) {
      rtb_handleIndex = 5;
    } else {
      rtb_handleIndex = 0;
    }

    A380PrimComputerGeneralLogic_MATLABFunction_a
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_2_bus.slat_flap_system_status_word, &rtb_y_oj);
    rtb_y_oj = (rtb_DataTypeConversion_k && (!rtb_y_oj));
    if (rtb_DataTypeConversion_k) {
      A380PrimComputerGeneralLogic_Y.out.general_logic.flap_handle_index = static_cast<real32_T>(rtb_handleIndex);
      rtb_Switch_idx_1 = A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
      rtb_Switch_idx_2 = A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
      A380PrimComputerGeneralLogic_Y.out.general_logic.slat_flap_actual_pos =
        A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
    } else if (!rtb_y_oj) {
      A380PrimComputerGeneralLogic_Y.out.general_logic.flap_handle_index = static_cast<real32_T>(rtb_handleIndex);
      rtb_Switch_idx_1 = A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
      rtb_Switch_idx_2 = A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
      A380PrimComputerGeneralLogic_Y.out.general_logic.slat_flap_actual_pos =
        A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
    } else if (A380PrimComputerGeneralLogic_P.Constant5_Value_i) {
      A380PrimComputerGeneralLogic_Y.out.general_logic.flap_handle_index =
        A380PrimComputerGeneralLogic_P.Constant2_Value;
      rtb_Switch_idx_1 = A380PrimComputerGeneralLogic_P.Constant3_Value;
      rtb_Switch_idx_2 = A380PrimComputerGeneralLogic_P.Constant6_Value_a;
      A380PrimComputerGeneralLogic_Y.out.general_logic.slat_flap_actual_pos =
        A380PrimComputerGeneralLogic_P.Constant4_Value_i;
    } else {
      A380PrimComputerGeneralLogic_Y.out.general_logic.flap_handle_index =
        A380PrimComputerGeneralLogic_P.Constant1_Value;
      rtb_Switch_idx_1 = A380PrimComputerGeneralLogic_P.Constant1_Value;
      rtb_Switch_idx_2 = A380PrimComputerGeneralLogic_P.Constant1_Value;
      A380PrimComputerGeneralLogic_Y.out.general_logic.slat_flap_actual_pos =
        A380PrimComputerGeneralLogic_P.Constant1_Value;
    }

    rtb_FlapFPPUtoSurfaceAngle = look1_iflf_binlxpw(rtb_Switch_idx_1,
      A380PrimComputerGeneralLogic_P.FlapFPPUtoSurfaceAngle_bp01Data,
      A380PrimComputerGeneralLogic_P.FlapFPPUtoSurfaceAngle_tableData, 6U);
    rtb_SlatFPPUtoSurfaceAngle = look1_iflf_binlxpw(rtb_Switch_idx_2,
      A380PrimComputerGeneralLogic_P.SlatFPPUtoSurfaceAngle_bp01Data,
      A380PrimComputerGeneralLogic_P.SlatFPPUtoSurfaceAngle_tableData, 2U);
    A380PrimComputerGeneralLogic_MATLABFunction(rtb_Switch3_0, A380PrimComputerGeneralLogic_P.BitfromLabel1_bit,
      &rtb_y_dw);
    A380PrimComputerGeneralLogic_MATLABFunction(rtb_Switch3_0, A380PrimComputerGeneralLogic_P.BitfromLabel8_bit,
      &rtb_y_d);
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
    rtb_DataTypeConversion_k = !rtb_OR6;
    rtb_NOT2 = !rtb_OR7;
    rtb_ra1Invalid = !rtb_OR;
    rtb_ra2Invalid = (rtb_ra1Invalid && rtb_DataTypeConversion_k);
    if (rtb_ra2Invalid && rtb_NOT2) {
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_theta = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_phi = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_q = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_r = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_n_x = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_n_y = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_n_z = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_theta_dot = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_phi_dot = v[rtb_handleIndex];
    } else if (rtb_OR && rtb_DataTypeConversion_k && rtb_NOT2) {
      rtb_theta = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data +
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
    } else if (rtb_ra1Invalid && rtb_OR6 && rtb_NOT2) {
      rtb_theta = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data +
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
    } else if (rtb_ra2Invalid && rtb_OR7) {
      rtb_theta = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data +
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
    } else if ((!rtb_OR) && rtb_OR6 && rtb_OR7) {
      rtb_theta = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
      rtb_phi = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
      rtb_q = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
      rtb_n_y = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
      rtb_n_z = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    } else if (rtb_OR && (!rtb_OR6) && rtb_OR7) {
      rtb_theta = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
      rtb_phi = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data;
      rtb_q = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data;
      rtb_n_y = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
      rtb_n_z = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
    } else if (rtb_OR && rtb_OR6 && rtb_NOT2) {
      rtb_theta = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
      rtb_phi = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
      rtb_q = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
      rtb_n_y = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
      rtb_n_z = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380PrimComputerGeneralLogic_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
    } else {
      rtb_theta = 0.0F;
      rtb_phi = 0.0F;
      rtb_q = 0.0F;
      rtb_r = 0.0F;
      rtb_n_x = 0.0F;
      rtb_n_y = 0.0F;
      rtb_n_z = 0.0F;
      rtb_theta_dot = 0.0F;
      rtb_phi_dot = 0.0F;
    }

    A380PrimComputerGeneralLogic_Y.out.general_logic.slats_locked = (rtb_y_dw != 0U);
    rtb_OR1 = ((A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) ||
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
    rtb_ra3Invalid = (rtb_OR1 && rtb_OR3);
    rtb_doubleAdrFault = (rtb_ra3Invalid || (rtb_OR1 && rtb_OR4) || (rtb_OR3 && rtb_OR4));
    rtb_tripleAdrFault = (rtb_ra3Invalid && rtb_OR4);
    rtb_DataTypeConversion_k = !rtb_OR3;
    rtb_NOT2 = !rtb_OR4;
    rtb_ra1Invalid = !rtb_OR1;
    rtb_ra2Invalid = (rtb_ra1Invalid && rtb_DataTypeConversion_k);
    if (rtb_ra2Invalid && rtb_NOT2) {
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_V_ias = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_V_tas = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.mach.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.mach.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.mach.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.mach.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_mach = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_alpha = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_p_s_c = v[rtb_handleIndex];
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
      v[2] = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.Data <
            A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.Data <
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.Data <
                 A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_altStd = v[rtb_handleIndex];
    } else if (rtb_OR1 && rtb_DataTypeConversion_k && rtb_NOT2) {
      rtb_V_ias = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.mach.Data +
                  A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
      rtb_p_s_c = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data) / 2.0F;
      rtb_altStd = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.Data +
                    A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data) / 2.0F;
    } else if (rtb_ra1Invalid && rtb_OR3 && rtb_NOT2) {
      rtb_V_ias = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.Data +
                  A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
      rtb_p_s_c = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data) / 2.0F;
      rtb_altStd = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.Data +
                    A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data) / 2.0F;
    } else if (rtb_ra2Invalid && rtb_OR4) {
      rtb_V_ias = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.Data +
                  A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) / 2.0F;
      rtb_p_s_c = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data +
                   A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data) / 2.0F;
      rtb_altStd = (A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.Data +
                    A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.Data) / 2.0F;
    } else if ((!rtb_OR1) && rtb_OR3 && rtb_OR4) {
      rtb_V_ias = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
      rtb_mach = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.mach.Data;
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
      rtb_p_s_c = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
      rtb_altStd = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
    } else if (rtb_OR1 && (!rtb_OR3) && rtb_OR4) {
      rtb_V_ias = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
      rtb_mach = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.mach.Data;
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
      rtb_p_s_c = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
      rtb_altStd = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
    } else if (rtb_ra3Invalid && rtb_NOT2) {
      rtb_V_ias = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
      rtb_mach = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.mach.Data;
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
      rtb_p_s_c = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
      rtb_altStd = A380PrimComputerGeneralLogic_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
    } else {
      rtb_V_ias = 0.0F;
      rtb_V_tas = 0.0F;
      rtb_mach = 0.0F;
      rtb_alpha = 0.0F;
      rtb_p_s_c = 0.0F;
      rtb_altStd = 0.0F;
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
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel_bit, &rtb_y_dw);
    A380PrimComputerGeneralLogic_MATLABFunction_a
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_y_c);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
       A380PrimComputerGeneralLogic_P.BitfromLabel1_bit_j, &rtb_y_dw);
    A380PrimComputerGeneralLogic_MATLABFunction_a
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_NOT2);
    if (A380PrimComputerGeneralLogic_U.in.discrete_inputs.is_unit_1) {
      rtb_y_dw = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.SSM;
      rtb_raComputationValue = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.Data;
      rtb_y_gqj = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.SSM;
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.Data;
    } else if (A380PrimComputerGeneralLogic_U.in.discrete_inputs.is_unit_2) {
      rtb_y_dw = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.SSM;
      rtb_raComputationValue = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.Data;
      rtb_y_gqj = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.SSM;
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.Data;
    } else {
      rtb_y_dw = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.SSM;
      rtb_raComputationValue = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.Data;
      rtb_y_gqj = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.SSM;
      rtb_alpha = A380PrimComputerGeneralLogic_U.in.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.Data;
    }

    if (rtb_y_dw != static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) {
      rtb_y_gqj = rtb_y_dw;
      rtb_alpha = rtb_raComputationValue;
    }

    rtb_ra1Invalid = (rtb_tripleAdrFault || (rtb_doubleAdrFault && A380PrimComputerGeneralLogic_P.Constant1_Value_b));
    A380PrimComputerGeneralLogic_MATLABFunction_d
      (((A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data > 50.0F) &&
        (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>
         (SignStatusMatrix::NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_ra1Invalid),
       A380PrimComputerGeneralLogic_U.in.time.dt, A380PrimComputerGeneralLogic_P.ConfirmNode2_isRisingEdge,
       A380PrimComputerGeneralLogic_P.ConfirmNode2_timeDelay, &rtb_y_c,
       &A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_lf);
    A380PrimComputerGeneralLogic_MATLABFunction_d
      (((A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data > 50.0F) &&
        (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>
         (SignStatusMatrix::NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_ra1Invalid),
       A380PrimComputerGeneralLogic_U.in.time.dt, A380PrimComputerGeneralLogic_P.ConfirmNode1_isRisingEdge,
       A380PrimComputerGeneralLogic_P.ConfirmNode1_timeDelay, &rtb_DataTypeConversion_k,
       &A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_j);
    A380PrimComputerGeneralLogic_MATLABFunction_d(((rtb_alpha > 50.0F) && (rtb_y_gqj == static_cast<uint32_T>
      (SignStatusMatrix::NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_ra1Invalid),
      A380PrimComputerGeneralLogic_U.in.time.dt, A380PrimComputerGeneralLogic_P.ConfirmNode3_isRisingEdge,
      A380PrimComputerGeneralLogic_P.ConfirmNode3_timeDelay, &rtb_NOT2,
      &A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_mm);
    A380PrimComputerGeneralLogic_DWork.ra1CoherenceRejected = (rtb_y_c ||
      A380PrimComputerGeneralLogic_DWork.ra1CoherenceRejected);
    A380PrimComputerGeneralLogic_DWork.ra2CoherenceRejected = (rtb_DataTypeConversion_k ||
      A380PrimComputerGeneralLogic_DWork.ra2CoherenceRejected);
    A380PrimComputerGeneralLogic_DWork.ra3CoherenceRejected = (rtb_NOT2 ||
      A380PrimComputerGeneralLogic_DWork.ra3CoherenceRejected);
    rtb_ra1Invalid = ((A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>
                       (SignStatusMatrix::FailureWarning)) || A380PrimComputerGeneralLogic_DWork.ra1CoherenceRejected);
    rtb_ra2Invalid = ((A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>
                       (SignStatusMatrix::FailureWarning)) || A380PrimComputerGeneralLogic_DWork.ra2CoherenceRejected);
    rtb_ra3Invalid = ((rtb_y_gqj == static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                      A380PrimComputerGeneralLogic_DWork.ra3CoherenceRejected);
    rtb_raComputationValue = 250.0F;
    A380PrimComputerGeneralLogic_Y.out.general_logic.two_ra_failure = false;
    switch ((!rtb_ra1Invalid + !rtb_ra2Invalid) + !rtb_ra3Invalid) {
     case 3:
      v[0] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
      v[1] = A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
      v[2] = rtb_alpha;
      if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data <
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) {
        if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data < rtb_alpha) {
          rtb_handleIndex = 1;
        } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data < rtb_alpha) {
          rtb_handleIndex = 2;
        } else {
          rtb_handleIndex = 0;
        }
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data < rtb_alpha) {
        rtb_handleIndex = 0;
      } else if (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data < rtb_alpha) {
        rtb_handleIndex = 2;
      } else {
        rtb_handleIndex = 1;
      }

      rtb_raComputationValue = v[rtb_handleIndex];
      break;

     case 2:
      if (rtb_ra1Invalid) {
        rtb_raComputationValue = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data + rtb_alpha)
          / 2.0F;
      } else if (rtb_ra2Invalid) {
        rtb_raComputationValue = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data + rtb_alpha)
          / 2.0F;
      } else if (rtb_ra3Invalid) {
        rtb_raComputationValue = (A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data +
          A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) / 2.0F;
      }
      break;

     case 1:
      A380PrimComputerGeneralLogic_Y.out.general_logic.two_ra_failure = true;
      if ((rtb_V_ias <= 180.0F) || ((!rtb_tripleAdrFault) && ((!rtb_doubleAdrFault) ||
            (!A380PrimComputerGeneralLogic_P.Constant1_Value_b)))) {
        if (!rtb_ra1Invalid) {
          rtb_raComputationValue = A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
        } else if (!rtb_ra2Invalid) {
          rtb_raComputationValue = A380PrimComputerGeneralLogic_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
        } else if (!rtb_ra3Invalid) {
          rtb_raComputationValue = rtb_alpha;
        }
      }
      break;

     default:
      A380PrimComputerGeneralLogic_Y.out.general_logic.two_ra_failure = true;
      break;
    }

    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
       A380PrimComputerGeneralLogic_P.BitfromLabel6_bit_o, &rtb_y_dw);
    rtb_DataTypeConversion_k = (rtb_y_dw != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
       A380PrimComputerGeneralLogic_P.BitfromLabel1_bit_jr, &rtb_y_dw);
    rtb_y_c = (rtb_DataTypeConversion_k || (rtb_y_dw != 0U));
    A380PrimComputerGeneralLogic_MATLABFunction_a
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, &rtb_NOT2);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
       A380PrimComputerGeneralLogic_P.BitfromLabel3_bit_g, &rtb_y_dw);
    rtb_DataTypeConversion_k = (rtb_y_dw != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
       A380PrimComputerGeneralLogic_P.BitfromLabel2_bit_m, &rtb_y_dw);
    A380PrimComputerGeneralLogic_MATLABFunction_a
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, &rtb_y_a);
    A380PrimComputerGeneralLogic_Y.out.general_logic.on_ground = ((rtb_y_c && rtb_NOT2) || ((rtb_DataTypeConversion_k ||
      (rtb_y_dw != 0U)) && rtb_y_a));
    A380PrimComputerGeneralLogic_Y.out.general_logic.double_lgciu_failure = ((!rtb_NOT2) && (!rtb_y_a));
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel8_bit_i, &rtb_y_dw);
    rtb_DataTypeConversion_k = (rtb_y_dw != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel9_bit, &rtb_y_dw);
    rtb_y_c = (rtb_y_dw != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel10_bit, &rtb_y_dw);
    A380PrimComputerGeneralLogic_MATLABFunction_a
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, &rtb_y_a);
    rtb_OR3_m = ((rtb_DataTypeConversion_k || rtb_y_c || (rtb_y_dw != 0U)) && rtb_y_a);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel4_bit_h, &rtb_y_dw);
    rtb_NOT2 = (rtb_y_dw != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel5_bit_l, &rtb_y_dw);
    rtb_y_c = (rtb_y_dw != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
       A380PrimComputerGeneralLogic_P.BitfromLabel7_bit_l, &rtb_y_dw);
    rtb_DataTypeConversion_k = (rtb_NOT2 || rtb_y_c || (rtb_y_dw != 0U));
    A380PrimComputerGeneralLogic_MATLABFunction_a
      (&A380PrimComputerGeneralLogic_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, &rtb_NOT2);
    rtb_OR2 = (rtb_DataTypeConversion_k && rtb_NOT2);
    A380PrimComputerGeneralLogic_MATLABFunction(&A380PrimComputerGeneralLogic_U.in.adcn_inputs.eec_1.ecu_status_word_4,
      A380PrimComputerGeneralLogic_P.BitfromLabel3_bit_n, &rtb_y_dw);
    rtb_NOT2 = (rtb_y_dw != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction(&A380PrimComputerGeneralLogic_U.in.adcn_inputs.eec_2.ecu_status_word_4,
      A380PrimComputerGeneralLogic_P.BitfromLabel2_bit_p, &rtb_y_dw);
    rtb_y_c = (rtb_y_dw != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction(&A380PrimComputerGeneralLogic_U.in.adcn_inputs.eec_3.ecu_status_word_4,
      A380PrimComputerGeneralLogic_P.BitfromLabel4_bit_f, &rtb_y_dw);
    rtb_DataTypeConversion_k = (rtb_y_dw != 0U);
    A380PrimComputerGeneralLogic_MATLABFunction(&A380PrimComputerGeneralLogic_U.in.adcn_inputs.eec_4.ecu_status_word_4,
      A380PrimComputerGeneralLogic_P.BitfromLabel1_bit_h, &rtb_y_dw);
    rtb_y_a = ((!rtb_NOT2) || (!rtb_y_c) || (!rtb_DataTypeConversion_k) || (rtb_y_dw == 0U));
    rtb_NOT2 = (rtb_NOT2 || rtb_y_c || rtb_DataTypeConversion_k || (rtb_y_dw != 0U));
    A380PrimComputerGeneralLogic_Y.out.general_logic.engine_out = (rtb_y_a && rtb_NOT2);
    A380PrimComputerGeneralLogic_MATLABFunction_h
      (A380PrimComputerGeneralLogic_U.in.analog_inputs.yellow_hyd_pressure_psi,
       A380PrimComputerGeneralLogic_P.HysteresisNode2_highTrigger,
       A380PrimComputerGeneralLogic_P.HysteresisNode2_lowTrigger, &rtb_y_a,
       &A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_h);
    A380PrimComputerGeneralLogic_MATLABFunction_d
      (((!A380PrimComputerGeneralLogic_U.in.discrete_inputs.yellow_low_pressure) && rtb_y_a),
       A380PrimComputerGeneralLogic_U.in.time.dt, A380PrimComputerGeneralLogic_P.ConfirmNode_isRisingEdge,
       A380PrimComputerGeneralLogic_P.ConfirmNode_timeDelay, &rtb_y_c,
       &A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_d);
    A380PrimComputerGeneralLogic_MATLABFunction_h(A380PrimComputerGeneralLogic_U.in.analog_inputs.green_hyd_pressure_psi,
      A380PrimComputerGeneralLogic_P.HysteresisNode3_highTrigger,
      A380PrimComputerGeneralLogic_P.HysteresisNode3_lowTrigger, &rtb_y_a,
      &A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_id);
    A380PrimComputerGeneralLogic_MATLABFunction_d
      (((!A380PrimComputerGeneralLogic_U.in.discrete_inputs.green_low_pressure) && rtb_y_a),
       A380PrimComputerGeneralLogic_U.in.time.dt, A380PrimComputerGeneralLogic_P.ConfirmNode2_isRisingEdge_k,
       A380PrimComputerGeneralLogic_P.ConfirmNode2_timeDelay_g, &rtb_y_a,
       &A380PrimComputerGeneralLogic_DWork.sf_MATLABFunction_i4);
    A380PrimComputerGeneralLogic_Y.out.data = A380PrimComputerGeneralLogic_U.in;
    A380PrimComputerGeneralLogic_Y.out.general_logic.tracking_mode_on =
      (A380PrimComputerGeneralLogic_U.in.sim_data.slew_on || A380PrimComputerGeneralLogic_U.in.sim_data.pause_on ||
       A380PrimComputerGeneralLogic_U.in.sim_data.tracking_mode_on_override);
    A380PrimComputerGeneralLogic_Y.out.general_logic.double_adr_failure = rtb_doubleAdrFault;
    A380PrimComputerGeneralLogic_Y.out.general_logic.triple_adr_failure = rtb_tripleAdrFault;
    A380PrimComputerGeneralLogic_Y.out.general_logic.cas_or_mach_disagree =
      A380PrimComputerGeneralLogic_P.Constant1_Value_b;
    A380PrimComputerGeneralLogic_Y.out.general_logic.alpha_disagree = A380PrimComputerGeneralLogic_P.Constant1_Value_b;
    rtb_DataTypeConversion_k = (rtb_OR && rtb_OR6);
    A380PrimComputerGeneralLogic_Y.out.general_logic.double_ir_failure = (rtb_DataTypeConversion_k || (rtb_OR && rtb_OR7)
      || (rtb_OR6 && rtb_OR7));
    A380PrimComputerGeneralLogic_Y.out.general_logic.triple_ir_failure = (rtb_DataTypeConversion_k && rtb_OR7);
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_failure_not_self_detected =
      A380PrimComputerGeneralLogic_P.Constant_Value;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_1_rejected = rtb_OR1;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_2_rejected = rtb_OR3;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_3_rejected = rtb_OR4;
    A380PrimComputerGeneralLogic_Y.out.general_logic.isis_rejected = A380PrimComputerGeneralLogic_P.Constant_Value_f;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_1_rejected = rtb_OR;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_2_rejected = rtb_OR6;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_3_rejected = rtb_OR7;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_computation_data.mach = rtb_mach;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_computation_data.alpha_deg =
      A380PrimComputerGeneralLogic_DWork.pY;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_computation_data.p_s_c_hpa = rtb_p_s_c;
    A380PrimComputerGeneralLogic_Y.out.general_logic.adr_computation_data.altitude_standard_ft = rtb_altStd;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.theta_deg = rtb_theta;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.phi_deg = rtb_phi;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.q_deg_s = rtb_q;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.r_deg_s = rtb_r;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.n_x_g = rtb_n_x;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.n_y_g = rtb_n_y;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.n_z_g = rtb_n_z;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    A380PrimComputerGeneralLogic_Y.out.general_logic.ra_computation_data_ft = rtb_raComputationValue;
    A380PrimComputerGeneralLogic_Y.out.general_logic.all_ra_failure = (rtb_ra1Invalid && rtb_ra2Invalid &&
      rtb_ra3Invalid);
    A380PrimComputerGeneralLogic_Y.out.general_logic.all_sfcc_lost = rtb_y_oj;
    A380PrimComputerGeneralLogic_Y.out.general_logic.flap_angle_deg = rtb_Switch_idx_1;
    A380PrimComputerGeneralLogic_Y.out.general_logic.slat_angle_deg = rtb_Switch_idx_2;
    if (rtb_FlapFPPUtoSurfaceAngle < 0.5F) {
      A380PrimComputerGeneralLogic_Y.out.general_logic.flap_surface_angle_deg = 0.0F;
    } else if ((rtb_FlapFPPUtoSurfaceAngle > 7.5F) && (rtb_FlapFPPUtoSurfaceAngle < 8.5F)) {
      A380PrimComputerGeneralLogic_Y.out.general_logic.flap_surface_angle_deg = 8.0F;
    } else if ((rtb_FlapFPPUtoSurfaceAngle > 16.5F) && (rtb_FlapFPPUtoSurfaceAngle < 17.5F)) {
      A380PrimComputerGeneralLogic_Y.out.general_logic.flap_surface_angle_deg = 17.0F;
    } else if ((rtb_FlapFPPUtoSurfaceAngle > 25.5F) && (rtb_FlapFPPUtoSurfaceAngle < 26.5F)) {
      A380PrimComputerGeneralLogic_Y.out.general_logic.flap_surface_angle_deg = 26.0F;
    } else if (rtb_FlapFPPUtoSurfaceAngle > 32.5F) {
      A380PrimComputerGeneralLogic_Y.out.general_logic.flap_surface_angle_deg = 33.0F;
    } else {
      A380PrimComputerGeneralLogic_Y.out.general_logic.flap_surface_angle_deg = rtb_FlapFPPUtoSurfaceAngle;
    }

    if (rtb_SlatFPPUtoSurfaceAngle < 0.5F) {
      A380PrimComputerGeneralLogic_Y.out.general_logic.slat_surface_angle_deg = 0.0F;
    } else if ((rtb_SlatFPPUtoSurfaceAngle > 19.5F) && (rtb_SlatFPPUtoSurfaceAngle < 20.5F)) {
      A380PrimComputerGeneralLogic_Y.out.general_logic.slat_surface_angle_deg = 20.0F;
    } else if (rtb_SlatFPPUtoSurfaceAngle > 22.5F) {
      A380PrimComputerGeneralLogic_Y.out.general_logic.slat_surface_angle_deg = 23.0F;
    } else {
      A380PrimComputerGeneralLogic_Y.out.general_logic.slat_surface_angle_deg = rtb_SlatFPPUtoSurfaceAngle;
    }

    A380PrimComputerGeneralLogic_Y.out.general_logic.flaps_locked = (rtb_y_d != 0U);
    A380PrimComputerGeneralLogic_Y.out.general_logic.landing_gear_down = (rtb_OR3_m && rtb_OR2);
    A380PrimComputerGeneralLogic_Y.out.general_logic.engine_running = rtb_NOT2;
    A380PrimComputerGeneralLogic_Y.out.flight_envelope = A380PrimComputerGeneralLogic_P.Constant7_Value;
    A380PrimComputerGeneralLogic_Y.out.laws = A380PrimComputerGeneralLogic_P.prim_laws_output_MATLABStruct;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.surface_statuses =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.surface_statuses;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.lateral_surface_positions =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.lateral_surface_positions;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.pitch_surface_positions =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.pitch_surface_positions;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.lateral_law_capability =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.lateral_law_capability;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.active_lateral_law =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.active_lateral_law;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.pitch_law_capability =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.pitch_law_capability;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.active_pitch_law =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.active_pitch_law;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.abnormal_condition_law_active =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.abnormal_condition_law_active;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.is_master_prim =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.is_master_prim;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.elevator_1_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.elevator_1_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.elevator_1_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.elevator_1_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.elevator_2_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.elevator_2_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.elevator_2_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.elevator_2_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.elevator_3_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.elevator_3_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.elevator_3_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.elevator_3_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.ths_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.ths_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.ths_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.ths_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.left_aileron_1_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.left_aileron_1_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.left_aileron_1_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.left_aileron_1_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.left_aileron_2_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.left_aileron_2_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.left_aileron_2_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.left_aileron_2_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.right_aileron_1_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.right_aileron_1_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.right_aileron_1_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.right_aileron_1_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.right_aileron_2_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.right_aileron_2_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.right_aileron_2_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.right_aileron_2_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.left_spoiler_hydraulic_mode_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.left_spoiler_hydraulic_mode_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.left_spoiler_electric_mode_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.left_spoiler_electric_mode_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.left_spoiler_hydraulic_mode_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.left_spoiler_hydraulic_mode_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.left_spoiler_electric_mode_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.left_spoiler_electric_mode_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.right_spoiler_hydraulic_mode_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.right_spoiler_hydraulic_mode_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.right_spoiler_electric_mode_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.right_spoiler_electric_mode_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.right_spoiler_hydraulic_mode_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.right_spoiler_hydraulic_mode_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.right_spoiler_electric_mode_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.right_spoiler_electric_mode_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.rudder_1_hydraulic_mode_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.rudder_1_hydraulic_mode_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.rudder_1_electric_mode_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.rudder_1_electric_mode_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.rudder_1_hydraulic_mode_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.rudder_1_hydraulic_mode_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.rudder_1_electric_mode_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.rudder_1_electric_mode_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.rudder_2_hydraulic_mode_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.rudder_2_hydraulic_mode_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.rudder_2_electric_mode_avail =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.rudder_2_electric_mode_avail;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.rudder_2_hydraulic_mode_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.rudder_2_hydraulic_mode_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.rudder_2_electric_mode_engaged =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.rudder_2_electric_mode_engaged;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.aileron_droop_active =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.aileron_droop_active;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.aileron_antidroop_active =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.aileron_antidroop_active;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.ths_automatic_mode_active =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.ths_automatic_mode_active;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.ths_manual_mode_c_deg_s =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.ths_manual_mode_c_deg_s;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.eha_ebha_elec_mode_inhibited =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.eha_ebha_elec_mode_inhibited;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.left_sidestick_disabled =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.left_sidestick_disabled;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.right_sidestick_disabled =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.right_sidestick_disabled;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.left_sidestick_priority_locked =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.left_sidestick_priority_locked;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.right_sidestick_priority_locked =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.right_sidestick_priority_locked;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.total_sidestick_pitch_command =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.total_sidestick_pitch_command;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.total_sidestick_roll_command =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.total_sidestick_roll_command;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.speed_brake_inhibited =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.speed_brake_inhibited;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.speed_brake_command_deg =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.speed_brake_command_deg;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.ground_spoilers_armed =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.ground_spoilers_armed;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.ground_spoilers_out =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.ground_spoilers_out;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.phased_lift_dumping_active =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.phased_lift_dumping_active;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.spoiler_lift_active =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.spoiler_lift_active;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.ap_authorised =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.ap_authorised;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.protection_ap_disconnect =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.protection_ap_disconnect;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.high_alpha_prot_active =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.high_alpha_prot_active;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.alpha_prot_deg =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.alpha_prot_deg;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.alpha_max_deg =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.alpha_max_deg;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.v_alpha_prot_kn =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.v_alpha_prot_kn;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.v_alpha_max_kn =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.v_alpha_max_kn;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.v_alpha_stall_warn_kn =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.v_alpha_stall_warn_kn;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.high_speed_prot_active =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.high_speed_prot_active;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.high_speed_prot_lo_thresh_kn =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.high_speed_prot_lo_thresh_kn;
    A380PrimComputerGeneralLogic_Y.out.fctl_logic.high_speed_prot_hi_thresh_kn =
      A380PrimComputerGeneralLogic_P.prim_fctl_logic_output_MATLABStruct.high_speed_prot_hi_thresh_kn;
    A380PrimComputerGeneralLogic_Y.out.fg_logic = A380PrimComputerGeneralLogic_P.Constant5_Value;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.lateral_modes =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.longitudinal_modes =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.armed_modes =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.active_lateral_law =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.active_lateral_law;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.active_longitudinal_law =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.active_longitudinal_law;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.auto_spd_control_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.auto_spd_control_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.manual_spd_control_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.manual_spd_control_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.mach_control_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.mach_control_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.athr_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.athr_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.athr_limited =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.athr_limited;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.alpha_floor_mode_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.alpha_floor_mode_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.thrust_mode_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.thrust_mode_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.thrust_target_idle =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.thrust_target_idle;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.speed_mach_mode_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.speed_mach_mode_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.retard_mode_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.retard_mode_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.athr_fma_mode =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.athr_fma_mode;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.athr_fma_message =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.athr_fma_message;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.spd_target_kts =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.spd_target_kts;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.pfd_spd_target_kts =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.pfd_spd_target_kts;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.short_term_managed_spd_kts =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.short_term_managed_spd_kts;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.short_term_managed_spd_visible =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.short_term_managed_spd_visible;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.alt_cstr_applicable =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.alt_cstr_applicable;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.alt_sel_or_cstr =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.alt_sel_or_cstr;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.mode_sync_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.mode_sync_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.any_ap_fd_engaged =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.any_ap_fd_engaged;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.any_lateral_mode_engaged =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.any_lateral_mode_engaged;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.any_longitudinal_mode_engaged =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.any_longitudinal_mode_engaged;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.lateral_mode_reset =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.lateral_mode_reset;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.longitudinal_mode_reset =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_mode_reset;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.hdg_trk_preset_available =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.hdg_trk_preset_available;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.alt_soft_mode_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.alt_soft_mode_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.fd_auto_disengage =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.fd_auto_disengage;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.ap_fd_mode_reversion =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.ap_fd_mode_reversion;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.lateral_mode_reversion =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.lateral_mode_reversion;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.longitudinal_mode_reversion_vs =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_mode_reversion_vs;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.longitudinal_mode_reversion_op_clb =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_mode_reversion_op_clb;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.pitch_fd_bars_flashing =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.pitch_fd_bars_flashing;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.roll_fd_bars_flashing =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.roll_fd_bars_flashing;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.loc_bc_selection =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.loc_bc_selection;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.vs_target_not_held =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.vs_target_not_held;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.tcas_vs_target =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.tcas_vs_target;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.tcas_ra_corrective =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.tcas_ra_corrective;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.active_tcas_submode =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.active_tcas_submode;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.tcas_alt_acq_cond =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.tcas_alt_acq_cond;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.tcas_alt_hold_cond =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.tcas_alt_hold_cond;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.tcas_ra_inhibited =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.tcas_ra_inhibited;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.trk_fpa_deselected =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.trk_fpa_deselected;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.longi_large_box_tcas =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.longi_large_box_tcas;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.land_2_capability =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.land_2_capability;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.land_3_fail_passive_capability =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.land_3_fail_passive_capability;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.land_3_fail_op_capability =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.land_3_fail_op_capability;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.land_2_inop =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.land_2_inop;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.land_3_fail_passive_inop =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.land_3_fail_passive_inop;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.land_3_fail_op_inop =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.land_3_fail_op_inop;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.tla_to_ga_set =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.tla_to_ga_set;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.true_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.true_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.trk_fpa_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.trk_fpa_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.metric_alt_active =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.metric_alt_active;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.selected_spd_mach =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.selected_spd_mach;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.spd_mach_dashes =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.spd_mach_dashes;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.selected_hdg_trk =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.selected_hdg_trk;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.hdg_trk_dashes =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.hdg_trk_dashes;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.selected_alt =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.selected_alt;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.selected_vs_fpa =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.selected_vs_fpa;
    A380PrimComputerGeneralLogic_Y.out.fg_mode_logic.vs_fpa_dashes =
      A380PrimComputerGeneralLogic_P.prim_fg_mode_logic_output_MATLABStruct.vs_fpa_dashes;
    A380PrimComputerGeneralLogic_Y.out.fg_laws = A380PrimComputerGeneralLogic_P.Constant8_Value;
    A380PrimComputerGeneralLogic_Y.out.discrete_outputs =
      A380PrimComputerGeneralLogic_P.prim_discrete_output_MATLABStruct;
    A380PrimComputerGeneralLogic_Y.out.analog_outputs = A380PrimComputerGeneralLogic_P.prim_analog_output_MATLABStruct;
    A380PrimComputerGeneralLogic_Y.out.bus_outputs = A380PrimComputerGeneralLogic_P.Constant4_Value;
    A380PrimComputerGeneralLogic_Y.out.general_logic.is_yellow_hydraulic_power_avail = rtb_y_c;
    A380PrimComputerGeneralLogic_Y.out.general_logic.is_green_hydraulic_power_avail = rtb_y_a;
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
