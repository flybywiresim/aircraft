#include "A380PrimComputerFe.h"
#include "rtwtypes.h"
#include <cmath>
#include "look2_binlxpw.h"
#include "plook_binx.h"
#include "intrp3d_l_pw.h"
#include "look1_binlxpw.h"
#include "look2_iflf_binlxpw.h"

const uint8_T A380PrimComputerFe_IN_Flying{ 1U };

const uint8_T A380PrimComputerFe_IN_Landed{ 2U };

const uint8_T A380PrimComputerFe_IN_Landing100ft{ 3U };

const uint8_T A380PrimComputerFe_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T A380PrimComputerFe_IN_Takeoff100ft{ 4U };

void A380PrimComputerFe::A380PrimComputerFe_LagFilter_Reset(rtDW_LagFilter_A380PrimComputerFe_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PrimComputerFe::A380PrimComputerFe_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_A380PrimComputerFe_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca + localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void A380PrimComputerFe::A380PrimComputerFe_RateLimiter_Reset(rtDW_RateLimiter_A380PrimComputerFe_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputerFe::A380PrimComputerFe_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputerFe_T *localDW)
{
  if ((!localDW->pY_not_empty) || rtu_reset) {
    localDW->pY = rtu_u;
    localDW->pY_not_empty = true;
  }

  if (rtu_reset) {
    *rty_Y = rtu_u;
  } else {
    *rty_Y = std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts) +
      localDW->pY;
  }

  localDW->pY = *rty_Y;
}

void A380PrimComputerFe::A380PrimComputerFe_VS1GfromVLS(real_T rtu_vls_conf_0, real_T rtu_vls_conf_other, real_T
  rtu_flap_handle_index, real_T *rty_vs1g)
{
  if (rtu_flap_handle_index == 0.0) {
    *rty_vs1g = rtu_vls_conf_0 / 1.23;
  } else {
    *rty_vs1g = rtu_vls_conf_other / 1.23;
  }
}

void A380PrimComputerFe::step()
{
  real_T fractions[3];
  real_T fractions_0[3];
  real_T fractions_1[3];
  real_T fractions_2[3];
  real_T rtb_Gain;
  real_T rtb_Switch;
  real_T rtb_conf;
  real_T rtb_vs1g;
  real_T rtb_vs1g_o;
  int32_T rtb_alpha_floor_inhib;
  int32_T tmp;
  uint32_T bpIndices[3];
  uint32_T bpIndices_0[3];
  uint32_T bpIndices_1[3];
  uint32_T bpIndices_2[3];
  boolean_T guard1;
  boolean_T rtb_Equal;
  if (A380PrimComputerFe_U.in.data.sim_data.computer_running) {
    if (!A380PrimComputerFe_DWork.Runtime_MODE) {
      A380PrimComputerFe_DWork.Delay_DSTATE = A380PrimComputerFe_P.DiscreteDerivativeVariableTs_InitialCondition;
      A380PrimComputerFe_RateLimiter_Reset(&A380PrimComputerFe_DWork.sf_RateLimiter);
      A380PrimComputerFe_LagFilter_Reset(&A380PrimComputerFe_DWork.sf_LagFilter);
      A380PrimComputerFe_DWork.is_active_c15_A380PrimComputerFe = 0U;
      A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_NO_ACTIVE_CHILD;
      A380PrimComputerFe_DWork.sAlphaFloor = 0.0;
      A380PrimComputerFe_LagFilter_Reset(&A380PrimComputerFe_DWork.sf_LagFilter_pa);
      A380PrimComputerFe_LagFilter_Reset(&A380PrimComputerFe_DWork.sf_LagFilter_p);
      A380PrimComputerFe_LagFilter_Reset(&A380PrimComputerFe_DWork.sf_LagFilter_e);
      A380PrimComputerFe_DWork.output = false;
      A380PrimComputerFe_DWork.timeSinceCondition = 0.0;
      A380PrimComputerFe_DWork.takeoff_config_n = 0.0;
      A380PrimComputerFe_DWork.takeoff_config_e = 0.0;
      A380PrimComputerFe_LagFilter_Reset(&A380PrimComputerFe_DWork.sf_LagFilter_d);
      A380PrimComputerFe_DWork.pY_not_empty_d = false;
      A380PrimComputerFe_DWork.pU_not_empty = false;
      A380PrimComputerFe_RateLimiter_Reset(&A380PrimComputerFe_DWork.sf_RateLimiter_b);
      A380PrimComputerFe_DWork.takeoff_config = 0.0;
      A380PrimComputerFe_DWork.pY_not_empty = false;
      A380PrimComputerFe_RateLimiter_Reset(&A380PrimComputerFe_DWork.sf_RateLimiter_k);
      A380PrimComputerFe_DWork.Runtime_MODE = true;
    }

    A380PrimComputerFe_B.dt = A380PrimComputerFe_U.in.data.time.dt;
    A380PrimComputerFe_B.prim_overhead_button_pressed =
      A380PrimComputerFe_U.in.data.discrete_inputs.prim_overhead_button_pressed;
    A380PrimComputerFe_B.SSM = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.mach.SSM;
    A380PrimComputerFe_B.ground_spoilers_out = A380PrimComputerFe_U.in.fctl_logic.ground_spoilers_out;
    A380PrimComputerFe_B.phased_lift_dumping_active = A380PrimComputerFe_U.in.fctl_logic.phased_lift_dumping_active;
    A380PrimComputerFe_B.spoiler_lift_active = A380PrimComputerFe_U.in.fctl_logic.spoiler_lift_active;
    A380PrimComputerFe_B.ap_authorised = A380PrimComputerFe_U.in.fctl_logic.ap_authorised;
    A380PrimComputerFe_B.protection_ap_disconnect = A380PrimComputerFe_U.in.fctl_logic.protection_ap_disconnect;
    A380PrimComputerFe_B.high_alpha_prot_active = A380PrimComputerFe_U.in.fctl_logic.high_alpha_prot_active;
    A380PrimComputerFe_B.alpha_prot_deg = A380PrimComputerFe_U.in.fctl_logic.alpha_prot_deg;
    A380PrimComputerFe_B.alpha_max_deg = A380PrimComputerFe_U.in.fctl_logic.alpha_max_deg;
    A380PrimComputerFe_B.v_alpha_prot_kn = A380PrimComputerFe_U.in.fctl_logic.v_alpha_prot_kn;
    A380PrimComputerFe_B.v_alpha_max_kn = A380PrimComputerFe_U.in.fctl_logic.v_alpha_max_kn;
    A380PrimComputerFe_B.Data = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.mach.Data;
    A380PrimComputerFe_B.v_alpha_stall_warn_kn = A380PrimComputerFe_U.in.fctl_logic.v_alpha_stall_warn_kn;
    A380PrimComputerFe_B.high_speed_prot_active = A380PrimComputerFe_U.in.fctl_logic.high_speed_prot_active;
    A380PrimComputerFe_B.high_speed_prot_lo_thresh_kn = A380PrimComputerFe_U.in.fctl_logic.high_speed_prot_lo_thresh_kn;
    A380PrimComputerFe_B.high_speed_prot_hi_thresh_kn = A380PrimComputerFe_U.in.fctl_logic.high_speed_prot_hi_thresh_kn;
    A380PrimComputerFe_B.land_2_capability = A380PrimComputerFe_U.in.fg_logic.land_2_capability;
    A380PrimComputerFe_B.land_3_fail_passive_capability =
      A380PrimComputerFe_U.in.fg_logic.land_3_fail_passive_capability;
    A380PrimComputerFe_B.land_3_fail_op_capability = A380PrimComputerFe_U.in.fg_logic.land_3_fail_op_capability;
    A380PrimComputerFe_B.land_2_inop = A380PrimComputerFe_U.in.fg_logic.land_2_inop;
    A380PrimComputerFe_B.land_3_fail_passive_inop = A380PrimComputerFe_U.in.fg_logic.land_3_fail_passive_inop;
    A380PrimComputerFe_B.land_3_fail_op_inop = A380PrimComputerFe_U.in.fg_logic.land_3_fail_op_inop;
    A380PrimComputerFe_B.SSM_k = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
    A380PrimComputerFe_B.alignment_dummy = A380PrimComputerFe_U.in.discrete_outputs.alignment_dummy;
    A380PrimComputerFe_B.elevator_1_active_mode = A380PrimComputerFe_U.in.discrete_outputs.elevator_1_active_mode;
    A380PrimComputerFe_B.elevator_2_active_mode = A380PrimComputerFe_U.in.discrete_outputs.elevator_2_active_mode;
    A380PrimComputerFe_B.elevator_3_active_mode = A380PrimComputerFe_U.in.discrete_outputs.elevator_3_active_mode;
    A380PrimComputerFe_B.ths_active_mode = A380PrimComputerFe_U.in.discrete_outputs.ths_active_mode;
    A380PrimComputerFe_B.left_aileron_1_active_mode =
      A380PrimComputerFe_U.in.discrete_outputs.left_aileron_1_active_mode;
    A380PrimComputerFe_B.left_aileron_2_active_mode =
      A380PrimComputerFe_U.in.discrete_outputs.left_aileron_2_active_mode;
    A380PrimComputerFe_B.right_aileron_1_active_mode =
      A380PrimComputerFe_U.in.discrete_outputs.right_aileron_1_active_mode;
    A380PrimComputerFe_B.right_aileron_2_active_mode =
      A380PrimComputerFe_U.in.discrete_outputs.right_aileron_2_active_mode;
    A380PrimComputerFe_B.left_spoiler_electronic_module_enable =
      A380PrimComputerFe_U.in.discrete_outputs.left_spoiler_electronic_module_enable;
    A380PrimComputerFe_B.Data_f = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
    A380PrimComputerFe_B.right_spoiler_electronic_module_enable =
      A380PrimComputerFe_U.in.discrete_outputs.right_spoiler_electronic_module_enable;
    A380PrimComputerFe_B.rudder_1_hydraulic_active_mode =
      A380PrimComputerFe_U.in.discrete_outputs.rudder_1_hydraulic_active_mode;
    A380PrimComputerFe_B.rudder_1_electric_active_mode =
      A380PrimComputerFe_U.in.discrete_outputs.rudder_1_electric_active_mode;
    A380PrimComputerFe_B.rudder_2_hydraulic_active_mode =
      A380PrimComputerFe_U.in.discrete_outputs.rudder_2_hydraulic_active_mode;
    A380PrimComputerFe_B.rudder_2_electric_active_mode =
      A380PrimComputerFe_U.in.discrete_outputs.rudder_2_electric_active_mode;
    A380PrimComputerFe_B.prim_healthy = A380PrimComputerFe_U.in.discrete_outputs.prim_healthy;
    A380PrimComputerFe_B.fcu_own_select = A380PrimComputerFe_U.in.discrete_outputs.fcu_own_select;
    A380PrimComputerFe_B.fcu_opp_select = A380PrimComputerFe_U.in.discrete_outputs.fcu_opp_select;
    A380PrimComputerFe_B.reverser_tertiary_lock = A380PrimComputerFe_U.in.discrete_outputs.reverser_tertiary_lock;
    A380PrimComputerFe_B.elevator_1_pos_order_deg = A380PrimComputerFe_U.in.analog_outputs.elevator_1_pos_order_deg;
    A380PrimComputerFe_B.SSM_kx = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
    A380PrimComputerFe_B.elevator_2_pos_order_deg = A380PrimComputerFe_U.in.analog_outputs.elevator_2_pos_order_deg;
    A380PrimComputerFe_B.elevator_3_pos_order_deg = A380PrimComputerFe_U.in.analog_outputs.elevator_3_pos_order_deg;
    A380PrimComputerFe_B.ths_pos_order_deg = A380PrimComputerFe_U.in.analog_outputs.ths_pos_order_deg;
    A380PrimComputerFe_B.left_aileron_1_pos_order_deg =
      A380PrimComputerFe_U.in.analog_outputs.left_aileron_1_pos_order_deg;
    A380PrimComputerFe_B.left_aileron_2_pos_order_deg =
      A380PrimComputerFe_U.in.analog_outputs.left_aileron_2_pos_order_deg;
    A380PrimComputerFe_B.right_aileron_1_pos_order_deg =
      A380PrimComputerFe_U.in.analog_outputs.right_aileron_1_pos_order_deg;
    A380PrimComputerFe_B.right_aileron_2_pos_order_deg =
      A380PrimComputerFe_U.in.analog_outputs.right_aileron_2_pos_order_deg;
    A380PrimComputerFe_B.left_spoiler_pos_order_deg = A380PrimComputerFe_U.in.analog_outputs.left_spoiler_pos_order_deg;
    A380PrimComputerFe_B.right_spoiler_pos_order_deg =
      A380PrimComputerFe_U.in.analog_outputs.right_spoiler_pos_order_deg;
    A380PrimComputerFe_B.rudder_1_pos_order_deg = A380PrimComputerFe_U.in.analog_outputs.rudder_1_pos_order_deg;
    A380PrimComputerFe_B.Data_fw = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
    A380PrimComputerFe_B.rudder_2_pos_order_deg = A380PrimComputerFe_U.in.analog_outputs.rudder_2_pos_order_deg;
    A380PrimComputerFe_B.SSM_kxx = A380PrimComputerFe_U.in.bus_outputs.fctl.left_inboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_fwx = A380PrimComputerFe_U.in.bus_outputs.fctl.left_inboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_kxxt = A380PrimComputerFe_U.in.bus_outputs.fctl.right_inboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_fwxk = A380PrimComputerFe_U.in.bus_outputs.fctl.right_inboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_kxxta = A380PrimComputerFe_U.in.bus_outputs.fctl.left_midboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_fwxkf = A380PrimComputerFe_U.in.bus_outputs.fctl.left_midboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_kxxtac = A380PrimComputerFe_U.in.bus_outputs.fctl.right_midboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_fwxkft = A380PrimComputerFe_U.in.bus_outputs.fctl.right_midboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_kxxtac0 = A380PrimComputerFe_U.in.bus_outputs.fctl.left_outboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.SSM_kxxtac0z = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
    A380PrimComputerFe_B.Data_fwxkftc = A380PrimComputerFe_U.in.bus_outputs.fctl.left_outboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_kxxtac0zt = A380PrimComputerFe_U.in.bus_outputs.fctl.right_outboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_fwxkftc3 =
      A380PrimComputerFe_U.in.bus_outputs.fctl.right_outboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_kxxtac0ztg = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_1_command_deg.SSM;
    A380PrimComputerFe_B.Data_fwxkftc3e = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_1_command_deg.Data;
    A380PrimComputerFe_B.SSM_kxxtac0ztgf = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_1_command_deg.SSM;
    A380PrimComputerFe_B.Data_fwxkftc3ep = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_1_command_deg.Data;
    A380PrimComputerFe_B.SSM_kxxtac0ztgf2 = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_2_command_deg.SSM;
    A380PrimComputerFe_B.Data_fwxkftc3epg = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_2_command_deg.Data;
    A380PrimComputerFe_B.SSM_kxxtac0ztgf2u = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_2_command_deg.SSM;
    A380PrimComputerFe_B.Data_fwxkftc3epgt =
      A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
    A380PrimComputerFe_B.Data_fwxkftc3epgtd = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_2_command_deg.Data;
    A380PrimComputerFe_B.SSM_kxxtac0ztgf2ux = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_3_command_deg.SSM;
    A380PrimComputerFe_B.Data_fwxkftc3epgtdx = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_3_command_deg.Data;
    A380PrimComputerFe_B.SSM_kxxtac0ztgf2uxn = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_3_command_deg.SSM;
    A380PrimComputerFe_B.Data_fwxkftc3epgtdxc =
      A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_3_command_deg.Data;
    A380PrimComputerFe_B.SSM_ky = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_4_command_deg.SSM;
    A380PrimComputerFe_B.Data_h = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_4_command_deg.Data;
    A380PrimComputerFe_B.SSM_d = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_4_command_deg.SSM;
    A380PrimComputerFe_B.Data_e = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_4_command_deg.Data;
    A380PrimComputerFe_B.SSM_h = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_5_command_deg.SSM;
    A380PrimComputerFe_B.SSM_kb = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
    A380PrimComputerFe_B.Data_j = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_5_command_deg.Data;
    A380PrimComputerFe_B.SSM_p = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_5_command_deg.SSM;
    A380PrimComputerFe_B.Data_d = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_5_command_deg.Data;
    A380PrimComputerFe_B.SSM_di = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_6_command_deg.SSM;
    A380PrimComputerFe_B.Data_p = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_6_command_deg.Data;
    A380PrimComputerFe_B.SSM_j = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_6_command_deg.SSM;
    A380PrimComputerFe_B.Data_i = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_6_command_deg.Data;
    A380PrimComputerFe_B.SSM_i = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_7_command_deg.SSM;
    A380PrimComputerFe_B.Data_g = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_7_command_deg.Data;
    A380PrimComputerFe_B.SSM_g = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_7_command_deg.SSM;
    A380PrimComputerFe_B.Data_a = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
    A380PrimComputerFe_B.Data_eb = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_7_command_deg.Data;
    A380PrimComputerFe_B.SSM_db = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_8_command_deg.SSM;
    A380PrimComputerFe_B.Data_jo = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_8_command_deg.Data;
    A380PrimComputerFe_B.SSM_n = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_8_command_deg.SSM;
    A380PrimComputerFe_B.Data_ex = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_8_command_deg.Data;
    A380PrimComputerFe_B.SSM_a = A380PrimComputerFe_U.in.bus_outputs.fctl.left_inboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.Data_fd = A380PrimComputerFe_U.in.bus_outputs.fctl.left_inboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_ir = A380PrimComputerFe_U.in.bus_outputs.fctl.right_inboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.Data_ja = A380PrimComputerFe_U.in.bus_outputs.fctl.right_inboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_hu = A380PrimComputerFe_U.in.bus_outputs.fctl.left_outboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.is_unit_1 = A380PrimComputerFe_U.in.data.discrete_inputs.is_unit_1;
    A380PrimComputerFe_B.SSM_e = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM;
    A380PrimComputerFe_B.Data_k = A380PrimComputerFe_U.in.bus_outputs.fctl.left_outboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_gr = A380PrimComputerFe_U.in.bus_outputs.fctl.right_outboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.Data_joy = A380PrimComputerFe_U.in.bus_outputs.fctl.right_outboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_ev = A380PrimComputerFe_U.in.bus_outputs.fctl.ths_command_deg.SSM;
    A380PrimComputerFe_B.Data_h3 = A380PrimComputerFe_U.in.bus_outputs.fctl.ths_command_deg.Data;
    A380PrimComputerFe_B.SSM_l = A380PrimComputerFe_U.in.bus_outputs.fctl.upper_rudder_command_deg.SSM;
    A380PrimComputerFe_B.Data_a0 = A380PrimComputerFe_U.in.bus_outputs.fctl.upper_rudder_command_deg.Data;
    A380PrimComputerFe_B.SSM_ei = A380PrimComputerFe_U.in.bus_outputs.fctl.lower_rudder_command_deg.SSM;
    A380PrimComputerFe_B.Data_b = A380PrimComputerFe_U.in.bus_outputs.fctl.lower_rudder_command_deg.Data;
    A380PrimComputerFe_B.SSM_an = A380PrimComputerFe_U.in.bus_outputs.fctl.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.Data_eq =
      A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
    A380PrimComputerFe_B.Data_iz = A380PrimComputerFe_U.in.bus_outputs.fctl.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_c = A380PrimComputerFe_U.in.bus_outputs.fctl.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.Data_j2 = A380PrimComputerFe_U.in.bus_outputs.fctl.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_cb = A380PrimComputerFe_U.in.bus_outputs.fctl.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.Data_o = A380PrimComputerFe_U.in.bus_outputs.fctl.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_lb = A380PrimComputerFe_U.in.bus_outputs.fctl.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.Data_m = A380PrimComputerFe_U.in.bus_outputs.fctl.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_ia = A380PrimComputerFe_U.in.bus_outputs.fctl.rudder_pedal_position_deg.SSM;
    A380PrimComputerFe_B.Data_oq = A380PrimComputerFe_U.in.bus_outputs.fctl.rudder_pedal_position_deg.Data;
    A380PrimComputerFe_B.SSM_kyz = A380PrimComputerFe_U.in.bus_outputs.fctl.aileron_status_word.SSM;
    A380PrimComputerFe_B.SSM_as = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.discrete_word_1.SSM;
    A380PrimComputerFe_B.Data_fo = A380PrimComputerFe_U.in.bus_outputs.fctl.aileron_status_word.Data;
    A380PrimComputerFe_B.SSM_is = A380PrimComputerFe_U.in.bus_outputs.fctl.left_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_p1 = A380PrimComputerFe_U.in.bus_outputs.fctl.left_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_ca = A380PrimComputerFe_U.in.bus_outputs.fctl.left_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_p1y = A380PrimComputerFe_U.in.bus_outputs.fctl.left_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_o = A380PrimComputerFe_U.in.bus_outputs.fctl.right_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_l = A380PrimComputerFe_U.in.bus_outputs.fctl.right_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_ak = A380PrimComputerFe_U.in.bus_outputs.fctl.right_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_kp = A380PrimComputerFe_U.in.bus_outputs.fctl.right_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_cbj = A380PrimComputerFe_U.in.bus_outputs.fctl.spoiler_status_word.SSM;
    A380PrimComputerFe_B.Data_k0 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.discrete_word_1.Data;
    A380PrimComputerFe_B.Data_pi = A380PrimComputerFe_U.in.bus_outputs.fctl.spoiler_status_word.Data;
    A380PrimComputerFe_B.SSM_cu = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_position_deg.SSM;
    A380PrimComputerFe_B.Data_dm = A380PrimComputerFe_U.in.bus_outputs.fctl.left_spoiler_position_deg.Data;
    A380PrimComputerFe_B.SSM_nn = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_position_deg.SSM;
    A380PrimComputerFe_B.Data_f5 = A380PrimComputerFe_U.in.bus_outputs.fctl.right_spoiler_position_deg.Data;
    A380PrimComputerFe_B.SSM_b = A380PrimComputerFe_U.in.bus_outputs.fctl.elevator_status_word.SSM;
    A380PrimComputerFe_B.Data_js = A380PrimComputerFe_U.in.bus_outputs.fctl.elevator_status_word.Data;
    A380PrimComputerFe_B.SSM_m = A380PrimComputerFe_U.in.bus_outputs.fctl.elevator_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_ee = A380PrimComputerFe_U.in.bus_outputs.fctl.elevator_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_f = A380PrimComputerFe_U.in.bus_outputs.fctl.elevator_2_position_deg.SSM;
    A380PrimComputerFe_B.SSM_bp = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.latitude_deg.SSM;
    A380PrimComputerFe_B.Data_ig = A380PrimComputerFe_U.in.bus_outputs.fctl.elevator_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_hb = A380PrimComputerFe_U.in.bus_outputs.fctl.elevator_3_position_deg.SSM;
    A380PrimComputerFe_B.Data_mk = A380PrimComputerFe_U.in.bus_outputs.fctl.elevator_3_position_deg.Data;
    A380PrimComputerFe_B.SSM_gz = A380PrimComputerFe_U.in.bus_outputs.fctl.ths_position_deg.SSM;
    A380PrimComputerFe_B.Data_pu = A380PrimComputerFe_U.in.bus_outputs.fctl.ths_position_deg.Data;
    A380PrimComputerFe_B.SSM_pv = A380PrimComputerFe_U.in.bus_outputs.fctl.rudder_status_word.SSM;
    A380PrimComputerFe_B.Data_ly = A380PrimComputerFe_U.in.bus_outputs.fctl.rudder_status_word.Data;
    A380PrimComputerFe_B.SSM_mf = A380PrimComputerFe_U.in.bus_outputs.fctl.rudder_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_jq = A380PrimComputerFe_U.in.bus_outputs.fctl.rudder_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_m0 = A380PrimComputerFe_U.in.bus_outputs.fctl.rudder_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_o5 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.latitude_deg.Data;
    A380PrimComputerFe_B.Data_lyw = A380PrimComputerFe_U.in.bus_outputs.fctl.rudder_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_kd = A380PrimComputerFe_U.in.bus_outputs.fctl.radio_height_1_ft.SSM;
    A380PrimComputerFe_B.Data_gq = A380PrimComputerFe_U.in.bus_outputs.fctl.radio_height_1_ft.Data;
    A380PrimComputerFe_B.SSM_pu = A380PrimComputerFe_U.in.bus_outputs.fctl.radio_height_2_ft.SSM;
    A380PrimComputerFe_B.Data_n = A380PrimComputerFe_U.in.bus_outputs.fctl.radio_height_2_ft.Data;
    A380PrimComputerFe_B.SSM_nv = A380PrimComputerFe_U.in.bus_outputs.fctl.fctl_law_status_word.SSM;
    A380PrimComputerFe_B.Data_bq = A380PrimComputerFe_U.in.bus_outputs.fctl.fctl_law_status_word.Data;
    A380PrimComputerFe_B.SSM_d5 = A380PrimComputerFe_U.in.bus_outputs.fctl.discrete_status_word_1.SSM;
    A380PrimComputerFe_B.Data_dmn = A380PrimComputerFe_U.in.bus_outputs.fctl.discrete_status_word_1.Data;
    A380PrimComputerFe_B.SSM_eo = A380PrimComputerFe_U.in.bus_outputs.fctl.fe_status_word.SSM;
    A380PrimComputerFe_B.SSM_nd = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.longitude_deg.SSM;
    A380PrimComputerFe_B.Data_jn = A380PrimComputerFe_U.in.bus_outputs.fctl.fe_status_word.Data;
    A380PrimComputerFe_B.SSM_bq = A380PrimComputerFe_U.in.bus_outputs.fctl.fg_status_word.SSM;
    A380PrimComputerFe_B.Data_c = A380PrimComputerFe_U.in.bus_outputs.fctl.fg_status_word.Data;
    A380PrimComputerFe_B.SSM_hi = A380PrimComputerFe_U.in.bus_outputs.fctl.v_alpha_lim_kn.SSM;
    A380PrimComputerFe_B.Data_lx = A380PrimComputerFe_U.in.bus_outputs.fctl.v_alpha_lim_kn.Data;
    A380PrimComputerFe_B.SSM_mm = A380PrimComputerFe_U.in.bus_outputs.fctl.v_alpha_prot_kn.SSM;
    A380PrimComputerFe_B.Data_jb = A380PrimComputerFe_U.in.bus_outputs.fctl.v_alpha_prot_kn.Data;
    A380PrimComputerFe_B.SSM_kz = A380PrimComputerFe_U.in.bus_outputs.fctl.v_alpha_stall_warn_kn.SSM;
    A380PrimComputerFe_B.Data_fn = A380PrimComputerFe_U.in.bus_outputs.fctl.v_alpha_stall_warn_kn.Data;
    A380PrimComputerFe_B.SSM_il = A380PrimComputerFe_U.in.bus_outputs.fe.gamma_a_deg.SSM;
    A380PrimComputerFe_B.Data_od = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.longitude_deg.Data;
    A380PrimComputerFe_B.Data_ez = A380PrimComputerFe_U.in.bus_outputs.fe.gamma_a_deg.Data;
    A380PrimComputerFe_B.SSM_i2 = A380PrimComputerFe_U.in.bus_outputs.fe.gamma_t_deg.SSM;
    A380PrimComputerFe_B.Data_pw = A380PrimComputerFe_U.in.bus_outputs.fe.gamma_t_deg.Data;
    A380PrimComputerFe_B.SSM_ah = A380PrimComputerFe_U.in.bus_outputs.fe.sideslip_target_deg.SSM;
    A380PrimComputerFe_B.Data_m2 = A380PrimComputerFe_U.in.bus_outputs.fe.sideslip_target_deg.Data;
    A380PrimComputerFe_B.SSM_en = A380PrimComputerFe_U.in.bus_outputs.fe.v_ls_kn.SSM;
    A380PrimComputerFe_B.Data_ek = A380PrimComputerFe_U.in.bus_outputs.fe.v_ls_kn.Data;
    A380PrimComputerFe_B.SSM_dq = A380PrimComputerFe_U.in.bus_outputs.fe.v_stall_kn.SSM;
    A380PrimComputerFe_B.Data_iy = A380PrimComputerFe_U.in.bus_outputs.fe.v_stall_kn.Data;
    A380PrimComputerFe_B.SSM_px = A380PrimComputerFe_U.in.bus_outputs.fe.speed_trend_kn.SSM;
    A380PrimComputerFe_B.SSM_lbo = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
    A380PrimComputerFe_B.Data_lk = A380PrimComputerFe_U.in.bus_outputs.fe.speed_trend_kn.Data;
    A380PrimComputerFe_B.SSM_p5 = A380PrimComputerFe_U.in.bus_outputs.fe.v_3_kn.SSM;
    A380PrimComputerFe_B.Data_ca = A380PrimComputerFe_U.in.bus_outputs.fe.v_3_kn.Data;
    A380PrimComputerFe_B.SSM_mk = A380PrimComputerFe_U.in.bus_outputs.fe.v_4_kn.SSM;
    A380PrimComputerFe_B.Data_pix = A380PrimComputerFe_U.in.bus_outputs.fe.v_4_kn.Data;
    A380PrimComputerFe_B.SSM_mu = A380PrimComputerFe_U.in.bus_outputs.fe.v_man_kn.SSM;
    A380PrimComputerFe_B.Data_di = A380PrimComputerFe_U.in.bus_outputs.fe.v_man_kn.Data;
    A380PrimComputerFe_B.SSM_cbl = A380PrimComputerFe_U.in.bus_outputs.fe.v_max_kn.SSM;
    A380PrimComputerFe_B.Data_lz = A380PrimComputerFe_U.in.bus_outputs.fe.v_max_kn.Data;
    A380PrimComputerFe_B.SSM_gzd = A380PrimComputerFe_U.in.bus_outputs.fe.v_fe_next_kn.SSM;
    A380PrimComputerFe_B.Data_lu = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.ground_speed_kn.Data;
    A380PrimComputerFe_B.Data_dc = A380PrimComputerFe_U.in.bus_outputs.fe.v_fe_next_kn.Data;
    A380PrimComputerFe_B.SSM_mo = A380PrimComputerFe_U.in.bus_outputs.fe.discrete_word_1.SSM;
    A380PrimComputerFe_B.Data_gc = A380PrimComputerFe_U.in.bus_outputs.fe.discrete_word_1.Data;
    A380PrimComputerFe_B.is_unit_2 = A380PrimComputerFe_U.in.data.discrete_inputs.is_unit_2;
    A380PrimComputerFe_B.SSM_me = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
    A380PrimComputerFe_B.Data_am = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
    A380PrimComputerFe_B.SSM_mj = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.heading_true_deg.SSM;
    A380PrimComputerFe_B.Data_mo = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.heading_true_deg.Data;
    A380PrimComputerFe_B.SSM_a5 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
    A380PrimComputerFe_B.Data_dg = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.wind_speed_kn.Data;
    A380PrimComputerFe_B.SSM_bt = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
    A380PrimComputerFe_B.Data_e1 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
    A380PrimComputerFe_B.SSM_om = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputerFe_B.Data_fp = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
    A380PrimComputerFe_B.is_unit_3 = A380PrimComputerFe_U.in.data.discrete_inputs.is_unit_3;
    A380PrimComputerFe_B.SSM_ar = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
    A380PrimComputerFe_B.Data_ns = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
    A380PrimComputerFe_B.SSM_ce = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
    A380PrimComputerFe_B.Data_m3 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.drift_angle_deg.Data;
    A380PrimComputerFe_B.SSM_ed = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
    A380PrimComputerFe_B.Data_oj = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
    A380PrimComputerFe_B.SSM_jh = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
    A380PrimComputerFe_B.Data_jy = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
    A380PrimComputerFe_B.SSM_je = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
    A380PrimComputerFe_B.Data_j1 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
    A380PrimComputerFe_B.capt_priority_takeover_pressed =
      A380PrimComputerFe_U.in.data.discrete_inputs.capt_priority_takeover_pressed;
    A380PrimComputerFe_B.SSM_jt = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
    A380PrimComputerFe_B.Data_fc = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.roll_angle_deg.Data;
    A380PrimComputerFe_B.SSM_cui = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_of = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_mq = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_lg = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_ni = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_n4 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_df = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
    A380PrimComputerFe_B.Data_ot = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_long_accel_g.Data;
    A380PrimComputerFe_B.fo_priority_takeover_pressed =
      A380PrimComputerFe_U.in.data.discrete_inputs.fo_priority_takeover_pressed;
    A380PrimComputerFe_B.SSM_oe = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
    A380PrimComputerFe_B.Data_gv = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
    A380PrimComputerFe_B.SSM_ha = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
    A380PrimComputerFe_B.Data_ou = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
    A380PrimComputerFe_B.SSM_op = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_dh = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_a50 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_ph = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_og = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_gs = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    A380PrimComputerFe_B.ap_1_pushbutton_pressed = A380PrimComputerFe_U.in.data.discrete_inputs.ap_1_pushbutton_pressed;
    A380PrimComputerFe_B.SSM_a4 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
    A380PrimComputerFe_B.Data_fd4 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
    A380PrimComputerFe_B.SSM_bv = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputerFe_B.Data_hm = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
    A380PrimComputerFe_B.SSM_bo = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputerFe_B.Data_i2 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputerFe_B.SSM_d1 = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
    A380PrimComputerFe_B.Data_og = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.vertical_accel_g.Data;
    A380PrimComputerFe_B.SSM_hy = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputerFe_B.Data_fv = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputerFe_B.ap_2_pushbutton_pressed = A380PrimComputerFe_U.in.data.discrete_inputs.ap_2_pushbutton_pressed;
    A380PrimComputerFe_B.SSM_gi = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
    A380PrimComputerFe_B.Data_oc = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
    A380PrimComputerFe_B.SSM_pp = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
    A380PrimComputerFe_B.Data_kq = A380PrimComputerFe_U.in.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
    A380PrimComputerFe_B.SSM_iab = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.discrete_word_1.SSM;
    A380PrimComputerFe_B.Data_ne = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.discrete_word_1.Data;
    A380PrimComputerFe_B.SSM_jtv = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.latitude_deg.SSM;
    A380PrimComputerFe_B.Data_it = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.latitude_deg.Data;
    A380PrimComputerFe_B.SSM_fy = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.longitude_deg.SSM;
    A380PrimComputerFe_B.Data_ch = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.longitude_deg.Data;
    A380PrimComputerFe_B.fcu_healthy = A380PrimComputerFe_U.in.data.discrete_inputs.fcu_healthy;
    A380PrimComputerFe_B.SSM_d4 = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
    A380PrimComputerFe_B.Data_bb = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.ground_speed_kn.Data;
    A380PrimComputerFe_B.SSM_ars = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
    A380PrimComputerFe_B.Data_ol = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
    A380PrimComputerFe_B.SSM_din = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.heading_true_deg.SSM;
    A380PrimComputerFe_B.Data_hw = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.heading_true_deg.Data;
    A380PrimComputerFe_B.SSM_m3 = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
    A380PrimComputerFe_B.Data_hs = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.wind_speed_kn.Data;
    A380PrimComputerFe_B.SSM_np = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
    A380PrimComputerFe_B.Data_fj = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
    A380PrimComputerFe_B.athr_pushbutton = A380PrimComputerFe_U.in.data.discrete_inputs.athr_pushbutton;
    A380PrimComputerFe_B.SSM_ax = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputerFe_B.Data_ky = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
    A380PrimComputerFe_B.SSM_cl = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
    A380PrimComputerFe_B.Data_h5 = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
    A380PrimComputerFe_B.SSM_es = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
    A380PrimComputerFe_B.Data_ku = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.drift_angle_deg.Data;
    A380PrimComputerFe_B.SSM_gi1 = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
    A380PrimComputerFe_B.Data_jp = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
    A380PrimComputerFe_B.SSM_jz = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
    A380PrimComputerFe_B.Data_nu = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
    A380PrimComputerFe_B.simulation_time = A380PrimComputerFe_U.in.data.time.simulation_time;
    A380PrimComputerFe_B.ir_3_on_capt = A380PrimComputerFe_U.in.data.discrete_inputs.ir_3_on_capt;
    A380PrimComputerFe_B.SSM_kt = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
    A380PrimComputerFe_B.Data_br = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
    A380PrimComputerFe_B.SSM_ds = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
    A380PrimComputerFe_B.Data_ae = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.roll_angle_deg.Data;
    A380PrimComputerFe_B.SSM_eg = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_pe = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_a0 = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_fy = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_cv = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_na = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputerFe_B.ir_3_on_fo = A380PrimComputerFe_U.in.data.discrete_inputs.ir_3_on_fo;
    A380PrimComputerFe_B.SSM_ea = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
    A380PrimComputerFe_B.Data_my = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_long_accel_g.Data;
    A380PrimComputerFe_B.SSM_p4 = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
    A380PrimComputerFe_B.Data_i4 = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
    A380PrimComputerFe_B.SSM_m2 = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
    A380PrimComputerFe_B.Data_cx = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
    A380PrimComputerFe_B.SSM_bt0 = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_nz = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_nr = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_id = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputerFe_B.adr_3_on_capt = A380PrimComputerFe_U.in.data.discrete_inputs.adr_3_on_capt;
    A380PrimComputerFe_B.SSM_fr = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_o2 = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_cc = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
    A380PrimComputerFe_B.Data_gqq = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
    A380PrimComputerFe_B.SSM_lm = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputerFe_B.Data_md = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
    A380PrimComputerFe_B.SSM_mkm = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputerFe_B.Data_cz = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputerFe_B.SSM_jhd = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
    A380PrimComputerFe_B.Data_pm = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.vertical_accel_g.Data;
    A380PrimComputerFe_B.adr_3_on_fo = A380PrimComputerFe_U.in.data.discrete_inputs.adr_3_on_fo;
    A380PrimComputerFe_B.SSM_av = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputerFe_B.Data_bj = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputerFe_B.SSM_ira = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
    A380PrimComputerFe_B.Data_ox = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
    A380PrimComputerFe_B.SSM_ge = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
    A380PrimComputerFe_B.Data_pe5 = A380PrimComputerFe_U.in.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
    A380PrimComputerFe_B.SSM_lv = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.discrete_word_1.SSM;
    A380PrimComputerFe_B.Data_jj = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.discrete_word_1.Data;
    A380PrimComputerFe_B.SSM_cg = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.latitude_deg.SSM;
    A380PrimComputerFe_B.Data_p5 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.latitude_deg.Data;
    A380PrimComputerFe_B.rat_deployed = A380PrimComputerFe_U.in.data.discrete_inputs.rat_deployed;
    A380PrimComputerFe_B.SSM_be = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.longitude_deg.SSM;
    A380PrimComputerFe_B.Data_ekl = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.longitude_deg.Data;
    A380PrimComputerFe_B.SSM_axb = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
    A380PrimComputerFe_B.Data_nd = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.ground_speed_kn.Data;
    A380PrimComputerFe_B.SSM_nz = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
    A380PrimComputerFe_B.Data_n2 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
    A380PrimComputerFe_B.SSM_cx = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.heading_true_deg.SSM;
    A380PrimComputerFe_B.Data_dl = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.heading_true_deg.Data;
    A380PrimComputerFe_B.SSM_gh = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
    A380PrimComputerFe_B.Data_gs2 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.wind_speed_kn.Data;
    A380PrimComputerFe_B.rat_contactor_closed = A380PrimComputerFe_U.in.data.discrete_inputs.rat_contactor_closed;
    A380PrimComputerFe_B.SSM_ks = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
    A380PrimComputerFe_B.Data_h4 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
    A380PrimComputerFe_B.SSM_pw = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputerFe_B.Data_e3 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
    A380PrimComputerFe_B.SSM_fh = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
    A380PrimComputerFe_B.Data_f5h = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
    A380PrimComputerFe_B.SSM_gzn = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
    A380PrimComputerFe_B.Data_an = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.drift_angle_deg.Data;
    A380PrimComputerFe_B.SSM_oo = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
    A380PrimComputerFe_B.Data_i4o = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
    A380PrimComputerFe_B.pitch_trim_up_pressed = A380PrimComputerFe_U.in.data.discrete_inputs.pitch_trim_up_pressed;
    A380PrimComputerFe_B.SSM_evh = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
    A380PrimComputerFe_B.Data_af = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
    A380PrimComputerFe_B.SSM_cn = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
    A380PrimComputerFe_B.Data_bm = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
    A380PrimComputerFe_B.SSM_co = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
    A380PrimComputerFe_B.Data_dk = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.roll_angle_deg.Data;
    A380PrimComputerFe_B.SSM_pe = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_nv = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_cgz = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_jpf = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
    A380PrimComputerFe_B.pitch_trim_down_pressed = A380PrimComputerFe_U.in.data.discrete_inputs.pitch_trim_down_pressed;
    A380PrimComputerFe_B.SSM_fw = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_i5 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_h4 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
    A380PrimComputerFe_B.Data_k2 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_long_accel_g.Data;
    A380PrimComputerFe_B.SSM_cb3 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
    A380PrimComputerFe_B.Data_as = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
    A380PrimComputerFe_B.SSM_pj = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
    A380PrimComputerFe_B.Data_gk = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
    A380PrimComputerFe_B.SSM_dv = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_jl = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
    A380PrimComputerFe_B.green_low_pressure = A380PrimComputerFe_U.in.data.discrete_inputs.green_low_pressure;
    A380PrimComputerFe_B.SSM_i4 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_e32 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_fm = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputerFe_B.Data_ih = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
    A380PrimComputerFe_B.SSM_e5 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
    A380PrimComputerFe_B.Data_du = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
    A380PrimComputerFe_B.SSM_bf = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputerFe_B.Data_nx = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
    A380PrimComputerFe_B.SSM_fd = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputerFe_B.Data_n0 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputerFe_B.yellow_low_pressure = A380PrimComputerFe_U.in.data.discrete_inputs.yellow_low_pressure;
    A380PrimComputerFe_B.SSM_fv = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
    A380PrimComputerFe_B.Data_eqi = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.vertical_accel_g.Data;
    A380PrimComputerFe_B.SSM_dt = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputerFe_B.Data_om = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputerFe_B.SSM_j5 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
    A380PrimComputerFe_B.Data_nr = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
    A380PrimComputerFe_B.SSM_ng = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
    A380PrimComputerFe_B.Data_p3 = A380PrimComputerFe_U.in.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
    A380PrimComputerFe_B.isis_1_bus = A380PrimComputerFe_U.in.data.bus_inputs.isis_1_bus;
    A380PrimComputerFe_B.isis_2_bus = A380PrimComputerFe_U.in.data.bus_inputs.isis_2_bus;
    A380PrimComputerFe_B.monotonic_time = A380PrimComputerFe_U.in.data.time.monotonic_time;
    A380PrimComputerFe_B.capt_pitch_stick_pos = A380PrimComputerFe_U.in.data.analog_inputs.capt_pitch_stick_pos;
    A380PrimComputerFe_B.rate_gyro_pitch_1_bus = A380PrimComputerFe_U.in.data.bus_inputs.rate_gyro_pitch_1_bus;
    A380PrimComputerFe_B.rate_gyro_pitch_2_bus = A380PrimComputerFe_U.in.data.bus_inputs.rate_gyro_pitch_2_bus;
    A380PrimComputerFe_B.rate_gyro_roll_1_bus = A380PrimComputerFe_U.in.data.bus_inputs.rate_gyro_roll_1_bus;
    A380PrimComputerFe_B.rate_gyro_roll_2_bus = A380PrimComputerFe_U.in.data.bus_inputs.rate_gyro_roll_2_bus;
    A380PrimComputerFe_B.rate_gyro_yaw_1_bus = A380PrimComputerFe_U.in.data.bus_inputs.rate_gyro_yaw_1_bus;
    A380PrimComputerFe_B.rate_gyro_yaw_2_bus = A380PrimComputerFe_U.in.data.bus_inputs.rate_gyro_yaw_2_bus;
    A380PrimComputerFe_B.SSM_cs = A380PrimComputerFe_U.in.data.bus_inputs.ra_1_bus.radio_height_ft.SSM;
    A380PrimComputerFe_B.Data_nb = A380PrimComputerFe_U.in.data.bus_inputs.ra_1_bus.radio_height_ft.Data;
    A380PrimComputerFe_B.SSM_ls = A380PrimComputerFe_U.in.data.bus_inputs.ra_2_bus.radio_height_ft.SSM;
    A380PrimComputerFe_B.Data_hd = A380PrimComputerFe_U.in.data.bus_inputs.ra_2_bus.radio_height_ft.Data;
    A380PrimComputerFe_B.fo_pitch_stick_pos = A380PrimComputerFe_U.in.data.analog_inputs.fo_pitch_stick_pos;
    A380PrimComputerFe_B.SSM_dg = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
    A380PrimComputerFe_B.Data_al =
      A380PrimComputerFe_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
    A380PrimComputerFe_B.SSM_d3 = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
    A380PrimComputerFe_B.Data_gu = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
    A380PrimComputerFe_B.SSM_p2 = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputerFe_B.Data_ix =
      A380PrimComputerFe_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
    A380PrimComputerFe_B.SSM_bo0 = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
    A380PrimComputerFe_B.Data_do = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
    A380PrimComputerFe_B.SSM_bc = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
    A380PrimComputerFe_B.Data_hu = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
    A380PrimComputerFe_B.capt_roll_stick_pos = A380PrimComputerFe_U.in.data.analog_inputs.capt_roll_stick_pos;
    A380PrimComputerFe_B.SSM_h0 = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
    A380PrimComputerFe_B.Data_pm1 =
      A380PrimComputerFe_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
    A380PrimComputerFe_B.SSM_giz = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
    A380PrimComputerFe_B.Data_i2y = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
    A380PrimComputerFe_B.SSM_mqp = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputerFe_B.Data_pg =
      A380PrimComputerFe_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
    A380PrimComputerFe_B.SSM_ba = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
    A380PrimComputerFe_B.Data_ni = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
    A380PrimComputerFe_B.SSM_in = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
    A380PrimComputerFe_B.Data_fr = A380PrimComputerFe_U.in.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
    A380PrimComputerFe_B.fo_roll_stick_pos = A380PrimComputerFe_U.in.data.analog_inputs.fo_roll_stick_pos;
    A380PrimComputerFe_B.SSM_ff = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM;
    A380PrimComputerFe_B.Data_cn = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_1.Data;
    A380PrimComputerFe_B.SSM_ic = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_2.SSM;
    A380PrimComputerFe_B.Data_nxl = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_2.Data;
    A380PrimComputerFe_B.SSM_fs = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_3.SSM;
    A380PrimComputerFe_B.Data_jh = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_3.Data;
    A380PrimComputerFe_B.SSM_ja = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_4.SSM;
    A380PrimComputerFe_B.Data_gl = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_4.Data;
    A380PrimComputerFe_B.SSM_js = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM;
    A380PrimComputerFe_B.Data_gn = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_1.Data;
    A380PrimComputerFe_B.speed_brake_lever_pos = A380PrimComputerFe_U.in.data.analog_inputs.speed_brake_lever_pos;
    A380PrimComputerFe_B.SSM_is3 = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_2.SSM;
    A380PrimComputerFe_B.Data_myb = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_2.Data;
    A380PrimComputerFe_B.SSM_ag = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_3.SSM;
    A380PrimComputerFe_B.Data_l2 = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_3.Data;
    A380PrimComputerFe_B.SSM_f5 = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_4.SSM;
    A380PrimComputerFe_B.Data_o5o = A380PrimComputerFe_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_4.Data;
    A380PrimComputerFe_B.irdc_1_bus = A380PrimComputerFe_U.in.data.bus_inputs.irdc_1_bus;
    A380PrimComputerFe_B.irdc_2_bus = A380PrimComputerFe_U.in.data.bus_inputs.irdc_2_bus;
    A380PrimComputerFe_B.irdc_3_bus = A380PrimComputerFe_U.in.data.bus_inputs.irdc_3_bus;
    A380PrimComputerFe_B.irdc_4_a_bus = A380PrimComputerFe_U.in.data.bus_inputs.irdc_4_a_bus;
    A380PrimComputerFe_B.thr_lever_1_pos = A380PrimComputerFe_U.in.data.analog_inputs.thr_lever_1_pos;
    A380PrimComputerFe_B.irdc_4_b_bus = A380PrimComputerFe_U.in.data.bus_inputs.irdc_4_b_bus;
    A380PrimComputerFe_B.fcu_own_bus = A380PrimComputerFe_U.in.data.bus_inputs.fcu_own_bus;
    A380PrimComputerFe_B.fcu_opp_bus = A380PrimComputerFe_U.in.data.bus_inputs.fcu_opp_bus;
    A380PrimComputerFe_B.SSM_ph =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_l5 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_jw =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_dc2 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_jy =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_gr =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_j1 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.thr_lever_2_pos = A380PrimComputerFe_U.in.data.analog_inputs.thr_lever_2_pos;
    A380PrimComputerFe_B.Data_gp =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_ov =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_i3 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_mx =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_et =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_b4 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.SSM;
    A380PrimComputerFe_B.Data_mc =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.Data;
    A380PrimComputerFe_B.SSM_gb =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.SSM;
    A380PrimComputerFe_B.Data_k3 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.Data;
    A380PrimComputerFe_B.SSM_oh = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.SSM;
    A380PrimComputerFe_B.thr_lever_3_pos = A380PrimComputerFe_U.in.data.analog_inputs.thr_lever_3_pos;
    A380PrimComputerFe_B.Data_f2 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.Data;
    A380PrimComputerFe_B.SSM_mm5 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.SSM;
    A380PrimComputerFe_B.Data_gh =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.Data;
    A380PrimComputerFe_B.SSM_br = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.SSM;
    A380PrimComputerFe_B.Data_ed =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.Data;
    A380PrimComputerFe_B.SSM_c2 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.SSM;
    A380PrimComputerFe_B.Data_o2j =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.Data;
    A380PrimComputerFe_B.SSM_hc = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.SSM;
    A380PrimComputerFe_B.Data_i43 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.Data;
    A380PrimComputerFe_B.SSM_ktr =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.SSM;
    A380PrimComputerFe_B.thr_lever_4_pos = A380PrimComputerFe_U.in.data.analog_inputs.thr_lever_4_pos;
    A380PrimComputerFe_B.Data_ic =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.Data;
    A380PrimComputerFe_B.SSM_gl = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.SSM;
    A380PrimComputerFe_B.Data_ak =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.Data;
    A380PrimComputerFe_B.SSM_my =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.SSM;
    A380PrimComputerFe_B.Data_jg =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.Data;
    A380PrimComputerFe_B.SSM_j3 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.SSM;
    A380PrimComputerFe_B.Data_cu =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.Data;
    A380PrimComputerFe_B.SSM_go =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.SSM;
    A380PrimComputerFe_B.Data_ep =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.Data;
    A380PrimComputerFe_B.SSM_e5c =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.SSM;
    A380PrimComputerFe_B.elevator_1_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.elevator_1_pos_deg;
    A380PrimComputerFe_B.Data_d3 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.Data;
    A380PrimComputerFe_B.SSM_dk =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.SSM;
    A380PrimComputerFe_B.Data_bt =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.Data;
    A380PrimComputerFe_B.SSM_evc =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.SSM;
    A380PrimComputerFe_B.Data_e0 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.Data;
    A380PrimComputerFe_B.SSM_kk =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.SSM;
    A380PrimComputerFe_B.Data_jl3 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.Data;
    A380PrimComputerFe_B.SSM_af =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.Data_nm =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_npr =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.slew_on = A380PrimComputerFe_U.in.data.sim_data.slew_on;
    A380PrimComputerFe_B.elevator_2_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.elevator_2_pos_deg;
    A380PrimComputerFe_B.Data_ia =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_ew =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.Data_j0 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_lt =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.Data_bs =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_ger = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.SSM;
    A380PrimComputerFe_B.Data_hp = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.Data;
    A380PrimComputerFe_B.SSM_pxo = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.SSM;
    A380PrimComputerFe_B.Data_ct = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.Data;
    A380PrimComputerFe_B.SSM_co2 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.SSM;
    A380PrimComputerFe_B.elevator_3_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.elevator_3_pos_deg;
    A380PrimComputerFe_B.Data_pc = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.Data;
    A380PrimComputerFe_B.SSM_ny =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.Data_nzt =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_l4 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.Data_c0 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_nm =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.Data_ojg =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_nh =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.Data_lm =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_dl = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.SSM;
    A380PrimComputerFe_B.ths_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.ths_pos_deg;
    A380PrimComputerFe_B.Data_fz =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.Data;
    A380PrimComputerFe_B.SSM_dx = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.SSM;
    A380PrimComputerFe_B.Data_oz = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.Data;
    A380PrimComputerFe_B.SSM_a5h =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_gf =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_fl =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_nn =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_p3 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_a0z =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_ns =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.left_aileron_1_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.left_aileron_1_pos_deg;
    A380PrimComputerFe_B.Data_fk =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_bm = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.SSM;
    A380PrimComputerFe_B.Data_bu = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.Data;
    A380PrimComputerFe_B.SSM_nl = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.SSM;
    A380PrimComputerFe_B.Data_o23 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.Data;
    A380PrimComputerFe_B.SSM_grm =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.SSM;
    A380PrimComputerFe_B.Data_g3 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.Data;
    A380PrimComputerFe_B.SSM_gzm = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.SSM;
    A380PrimComputerFe_B.Data_icc = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.Data;
    A380PrimComputerFe_B.SSM_oi = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.SSM;
    A380PrimComputerFe_B.left_aileron_2_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.left_aileron_2_pos_deg;
    A380PrimComputerFe_B.Data_pwf = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_aa = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_gvk = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_fvk = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.SSM;
    A380PrimComputerFe_B.Data_ln = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.Data;
    A380PrimComputerFe_B.SSM_lw = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.SSM;
    A380PrimComputerFe_B.Data_ka = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.Data;
    A380PrimComputerFe_B.SSM_fa = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.SSM;
    A380PrimComputerFe_B.Data_mp = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.Data;
    A380PrimComputerFe_B.SSM_lbx = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.SSM;
    A380PrimComputerFe_B.right_aileron_1_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.right_aileron_1_pos_deg;
    A380PrimComputerFe_B.Data_m4 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_n3 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_fki = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_a1 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.SSM;
    A380PrimComputerFe_B.Data_bv = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.Data;
    A380PrimComputerFe_B.SSM_p1 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.SSM;
    A380PrimComputerFe_B.Data_m21 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.Data;
    A380PrimComputerFe_B.SSM_cn2 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.SSM;
    A380PrimComputerFe_B.Data_nbg = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.Data;
    A380PrimComputerFe_B.SSM_an3 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.SSM;
    A380PrimComputerFe_B.right_aileron_2_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.right_aileron_2_pos_deg;
    A380PrimComputerFe_B.Data_l25 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.Data;
    A380PrimComputerFe_B.SSM_c3 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.fe_status_word.SSM;
    A380PrimComputerFe_B.Data_ki = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.fe_status_word.Data;
    A380PrimComputerFe_B.SSM_dp = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.fg_status_word.SSM;
    A380PrimComputerFe_B.Data_p5p = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.fg_status_word.Data;
    A380PrimComputerFe_B.SSM_boy = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.SSM;
    A380PrimComputerFe_B.Data_nry = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.Data;
    A380PrimComputerFe_B.SSM_lg = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.SSM;
    A380PrimComputerFe_B.Data_mh = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.Data;
    A380PrimComputerFe_B.SSM_cm = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.SSM;
    A380PrimComputerFe_B.left_spoiler_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.left_spoiler_pos_deg;
    A380PrimComputerFe_B.Data_ll = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.Data;
    A380PrimComputerFe_B.SSM_hl = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.SSM;
    A380PrimComputerFe_B.Data_hy = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.Data;
    A380PrimComputerFe_B.SSM_irh = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.SSM;
    A380PrimComputerFe_B.Data_j04 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.Data;
    A380PrimComputerFe_B.SSM_b42 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.SSM;
    A380PrimComputerFe_B.Data_pf = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.Data;
    A380PrimComputerFe_B.SSM_anz = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_ls_kn.SSM;
    A380PrimComputerFe_B.Data_pl = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_ls_kn.Data;
    A380PrimComputerFe_B.SSM_d2 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_stall_kn.SSM;
    A380PrimComputerFe_B.right_spoiler_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.right_spoiler_pos_deg;
    A380PrimComputerFe_B.Data_gb = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_stall_kn.Data;
    A380PrimComputerFe_B.SSM_gov = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.SSM;
    A380PrimComputerFe_B.Data_hq = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.Data;
    A380PrimComputerFe_B.SSM_nb = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_3_kn.SSM;
    A380PrimComputerFe_B.Data_ai = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_3_kn.Data;
    A380PrimComputerFe_B.SSM_pe3 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_4_kn.SSM;
    A380PrimComputerFe_B.Data_gfr = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_4_kn.Data;
    A380PrimComputerFe_B.SSM_jj = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_man_kn.SSM;
    A380PrimComputerFe_B.Data_czp = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_man_kn.Data;
    A380PrimComputerFe_B.SSM_jx = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_max_kn.SSM;
    A380PrimComputerFe_B.rudder_1_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.rudder_1_pos_deg;
    A380PrimComputerFe_B.Data_fm = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_max_kn.Data;
    A380PrimComputerFe_B.SSM_npl = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.SSM;
    A380PrimComputerFe_B.Data_jsg = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.Data;
    A380PrimComputerFe_B.SSM_gf = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.discrete_word_1.SSM;
    A380PrimComputerFe_B.Data_g1 = A380PrimComputerFe_U.in.data.bus_inputs.prim_x_bus.fe.discrete_word_1.Data;
    A380PrimComputerFe_B.SSM_gbi =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_j4 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_fhm =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_jyh =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_ltj =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.pause_on = A380PrimComputerFe_U.in.data.sim_data.pause_on;
    A380PrimComputerFe_B.rudder_2_pos_deg = A380PrimComputerFe_U.in.data.analog_inputs.rudder_2_pos_deg;
    A380PrimComputerFe_B.Data_e4 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_hn =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_ghs =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_h3 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_bmk =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_bfs =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.SSM;
    A380PrimComputerFe_B.Data_lzt =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.Data;
    A380PrimComputerFe_B.SSM_p0 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.SSM;
    A380PrimComputerFe_B.Data_kn =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.Data;
    A380PrimComputerFe_B.SSM_fu =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.SSM;
    A380PrimComputerFe_B.rudder_pedal_pos = A380PrimComputerFe_U.in.data.analog_inputs.rudder_pedal_pos;
    A380PrimComputerFe_B.Data_nab =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.Data;
    A380PrimComputerFe_B.SSM_hr = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.SSM;
    A380PrimComputerFe_B.Data_lgf =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.Data;
    A380PrimComputerFe_B.SSM_bi =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.SSM;
    A380PrimComputerFe_B.Data_fpq =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.Data;
    A380PrimComputerFe_B.SSM_bd = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.SSM;
    A380PrimComputerFe_B.Data_dt =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.Data;
    A380PrimComputerFe_B.SSM_omt =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.SSM;
    A380PrimComputerFe_B.Data_b1 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.Data;
    A380PrimComputerFe_B.SSM_la = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.SSM;
    A380PrimComputerFe_B.yellow_hyd_pressure_psi = A380PrimComputerFe_U.in.data.analog_inputs.yellow_hyd_pressure_psi;
    A380PrimComputerFe_B.Data_nmr =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.Data;
    A380PrimComputerFe_B.SSM_l1 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.SSM;
    A380PrimComputerFe_B.Data_ea =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.Data;
    A380PrimComputerFe_B.SSM_dy = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.SSM;
    A380PrimComputerFe_B.Data_nib =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.Data;
    A380PrimComputerFe_B.SSM_ie =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.SSM;
    A380PrimComputerFe_B.Data_i2t =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.Data;
    A380PrimComputerFe_B.SSM_kf = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.SSM;
    A380PrimComputerFe_B.Data_ng =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.Data;
    A380PrimComputerFe_B.SSM_p5l =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.SSM;
    A380PrimComputerFe_B.green_hyd_pressure_psi = A380PrimComputerFe_U.in.data.analog_inputs.green_hyd_pressure_psi;
    A380PrimComputerFe_B.Data_h31 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.Data;
    A380PrimComputerFe_B.SSM_g3 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.SSM;
    A380PrimComputerFe_B.Data_ew =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.Data;
    A380PrimComputerFe_B.SSM_b3 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.SSM;
    A380PrimComputerFe_B.Data_j1s =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.Data;
    A380PrimComputerFe_B.SSM_dxv =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.SSM;
    A380PrimComputerFe_B.Data_j5 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.Data;
    A380PrimComputerFe_B.SSM_mxz =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.SSM;
    A380PrimComputerFe_B.Data_cw =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.Data;
    A380PrimComputerFe_B.SSM_kk4 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.vert_acc_1_g = A380PrimComputerFe_U.in.data.analog_inputs.vert_acc_1_g;
    A380PrimComputerFe_B.Data_gqa =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_cy =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.Data_hz =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_ju =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.Data_fri =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_ey =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.SSM;
    A380PrimComputerFe_B.Data_cm =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.Data;
    A380PrimComputerFe_B.SSM_jr = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.SSM;
    A380PrimComputerFe_B.Data_czj = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.Data;
    A380PrimComputerFe_B.SSM_hs = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.SSM;
    A380PrimComputerFe_B.vert_acc_2_g = A380PrimComputerFe_U.in.data.analog_inputs.vert_acc_2_g;
    A380PrimComputerFe_B.Data_mb = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.Data;
    A380PrimComputerFe_B.SSM_mx3 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.SSM;
    A380PrimComputerFe_B.Data_gk4 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.Data;
    A380PrimComputerFe_B.SSM_er =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.Data_gbt =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_hm =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.Data_p0 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_dm =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.Data_dn =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_fk =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.vert_acc_3_g = A380PrimComputerFe_U.in.data.analog_inputs.vert_acc_3_g;
    A380PrimComputerFe_B.Data_iyw =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_lm1 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.SSM;
    A380PrimComputerFe_B.Data_p5d =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.Data;
    A380PrimComputerFe_B.SSM_nc = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.SSM;
    A380PrimComputerFe_B.Data_oo = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.Data;
    A380PrimComputerFe_B.SSM_e4 =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_ho =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_bw =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_kqr =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_na =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.lat_acc_1_g = A380PrimComputerFe_U.in.data.analog_inputs.lat_acc_1_g;
    A380PrimComputerFe_B.Data_omv =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_lf =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_mby =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_oz = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.SSM;
    A380PrimComputerFe_B.Data_hk = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.Data;
    A380PrimComputerFe_B.SSM_mub = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.SSM;
    A380PrimComputerFe_B.Data_hg =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.Data;
    A380PrimComputerFe_B.SSM_li = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.SSM;
    A380PrimComputerFe_B.Data_bi =
      A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.Data;
    A380PrimComputerFe_B.SSM_hcd = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.SSM;
    A380PrimComputerFe_B.lat_acc_2_g = A380PrimComputerFe_U.in.data.analog_inputs.lat_acc_2_g;
    A380PrimComputerFe_B.Data_i4u = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.Data;
    A380PrimComputerFe_B.SSM_php = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_ik = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_ma = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_dq = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_jut = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.SSM;
    A380PrimComputerFe_B.Data_pv = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.Data;
    A380PrimComputerFe_B.SSM_kh = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.SSM;
    A380PrimComputerFe_B.Data_p1d = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.Data;
    A380PrimComputerFe_B.SSM_h2 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.SSM;
    A380PrimComputerFe_B.lat_acc_3_g = A380PrimComputerFe_U.in.data.analog_inputs.lat_acc_3_g;
    A380PrimComputerFe_B.Data_lyv = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.Data;
    A380PrimComputerFe_B.SSM_ago = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_ke = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_ep = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_cv = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_kc = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.SSM;
    A380PrimComputerFe_B.Data_pfh = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.Data;
    A380PrimComputerFe_B.SSM_cnf = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.SSM;
    A380PrimComputerFe_B.Data_jy4 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.Data;
    A380PrimComputerFe_B.SSM_lwa = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.SSM;
    A380PrimComputerFe_B.tracking_mode_on_override = A380PrimComputerFe_U.in.data.sim_data.tracking_mode_on_override;
    A380PrimComputerFe_B.left_body_wheel_speed = A380PrimComputerFe_U.in.data.analog_inputs.left_body_wheel_speed;
    A380PrimComputerFe_B.Data_o1 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.Data;
    A380PrimComputerFe_B.SSM_aq = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.SSM;
    A380PrimComputerFe_B.Data_ga = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.Data;
    A380PrimComputerFe_B.SSM_ja2 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.fe_status_word.SSM;
    A380PrimComputerFe_B.Data_kd = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.fe_status_word.Data;
    A380PrimComputerFe_B.SSM_in3 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.fg_status_word.SSM;
    A380PrimComputerFe_B.Data_fx = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.fg_status_word.Data;
    A380PrimComputerFe_B.SSM_ap = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.SSM;
    A380PrimComputerFe_B.Data_nml = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.Data;
    A380PrimComputerFe_B.SSM_mg = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.SSM;
    A380PrimComputerFe_B.left_wing_wheel_speed = A380PrimComputerFe_U.in.data.analog_inputs.left_wing_wheel_speed;
    A380PrimComputerFe_B.Data_fa = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.Data;
    A380PrimComputerFe_B.SSM_mw = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.SSM;
    A380PrimComputerFe_B.Data_nh = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.Data;
    A380PrimComputerFe_B.SSM_bu = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.SSM;
    A380PrimComputerFe_B.Data_or = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.Data;
    A380PrimComputerFe_B.SSM_cbb = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.SSM;
    A380PrimComputerFe_B.Data_otn = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.Data;
    A380PrimComputerFe_B.SSM_iao = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.SSM;
    A380PrimComputerFe_B.Data_cam = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.Data;
    A380PrimComputerFe_B.SSM_ip = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_ls_kn.SSM;
    A380PrimComputerFe_B.right_body_wheel_speed = A380PrimComputerFe_U.in.data.analog_inputs.right_body_wheel_speed;
    A380PrimComputerFe_B.Data_gsl = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_ls_kn.Data;
    A380PrimComputerFe_B.SSM_f4 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_stall_kn.SSM;
    A380PrimComputerFe_B.Data_amp = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_stall_kn.Data;
    A380PrimComputerFe_B.SSM_id = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.SSM;
    A380PrimComputerFe_B.Data_mv = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.Data;
    A380PrimComputerFe_B.SSM_mqr = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_3_kn.SSM;
    A380PrimComputerFe_B.Data_gx = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_3_kn.Data;
    A380PrimComputerFe_B.SSM_cm2 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_4_kn.SSM;
    A380PrimComputerFe_B.Data_lb = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_4_kn.Data;
    A380PrimComputerFe_B.SSM_ck = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_man_kn.SSM;
    A380PrimComputerFe_B.right_wing_wheel_speed = A380PrimComputerFe_U.in.data.analog_inputs.right_wing_wheel_speed;
    A380PrimComputerFe_B.Data_can = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_man_kn.Data;
    A380PrimComputerFe_B.SSM_pl = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_max_kn.SSM;
    A380PrimComputerFe_B.Data_gae = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_max_kn.Data;
    A380PrimComputerFe_B.SSM_d50 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.SSM;
    A380PrimComputerFe_B.Data_h1 = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.Data;
    A380PrimComputerFe_B.SSM_gs = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.discrete_word_1.SSM;
    A380PrimComputerFe_B.Data_bc = A380PrimComputerFe_U.in.data.bus_inputs.prim_y_bus.fe.discrete_word_1.Data;
    A380PrimComputerFe_B.SSM_kse =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.Data_fof =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_icj =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.SSM_ds4 = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
    A380PrimComputerFe_B.Data_nj =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_gbf = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.Data_i0 =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_opv =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.Data_lr =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_gha = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputerFe_B.Data_k0s = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.Data;
    A380PrimComputerFe_B.SSM_ple = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.aileron_status_word.SSM;
    A380PrimComputerFe_B.Data_m4b = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.aileron_status_word.Data;
    A380PrimComputerFe_B.SSM_h0n = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_e3r = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
    A380PrimComputerFe_B.Data_au = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_c1 = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_czc = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_dd = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_itz = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_ai = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_nsk = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_at = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word.SSM;
    A380PrimComputerFe_B.Data_is = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word.Data;
    A380PrimComputerFe_B.SSM_bz = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.SSM;
    A380PrimComputerFe_B.SSM_n0 = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM;
    A380PrimComputerFe_B.Data_pk = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_haz = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_f52 = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_hz = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_dg0 = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_hk = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_nru = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_cvn = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.elevator_status_word.SSM;
    A380PrimComputerFe_B.Data_d5 = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.elevator_status_word.Data;
    A380PrimComputerFe_B.SSM_iy = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.elevator_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_oa = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data;
    A380PrimComputerFe_B.Data_bp = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.elevator_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_jwz = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.elevator_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_cl = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.elevator_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_o2 = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.elevator_3_position_deg.SSM;
    A380PrimComputerFe_B.Data_er = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.elevator_3_position_deg.Data;
    A380PrimComputerFe_B.SSM_eig = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.ths_position_deg.SSM;
    A380PrimComputerFe_B.Data_in = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.ths_position_deg.Data;
    A380PrimComputerFe_B.SSM_jl = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.SSM;
    A380PrimComputerFe_B.Data_btl = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.Data;
    A380PrimComputerFe_B.SSM_cci = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.rudder_1_position_deg.SSM;
    A380PrimComputerFe_B.SSM_ow = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.mach.SSM;
    A380PrimComputerFe_B.Data_a5 = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.rudder_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_bcj = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.rudder_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_hyo = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.rudder_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_i5 = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.SSM;
    A380PrimComputerFe_B.Data_bjx = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.Data;
    A380PrimComputerFe_B.SSM_jww = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.fctl_law_status_word.SSM;
    A380PrimComputerFe_B.Data_ci = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.fctl_law_status_word.Data;
    A380PrimComputerFe_B.SSM_kkj = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.misc_data_status_word.SSM;
    A380PrimComputerFe_B.Data_h2 = A380PrimComputerFe_U.in.data.bus_inputs.sec_1_bus.misc_data_status_word.Data;
    A380PrimComputerFe_B.SSM_ndh =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.Data_ce = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.mach.Data;
    A380PrimComputerFe_B.Data_dx =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_k1 =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.Data_fvi =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_en3 = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.Data_gnm =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_kl = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.Data_e3y =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_po = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputerFe_B.Data_ld = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.Data;
    A380PrimComputerFe_B.SSM_ie0 = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.aileron_status_word.SSM;
    A380PrimComputerFe_B.tailstrike_protection_on = A380PrimComputerFe_U.in.data.sim_data.tailstrike_protection_on;
    A380PrimComputerFe_B.SSM_ay = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
    A380PrimComputerFe_B.Data_k3v = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.aileron_status_word.Data;
    A380PrimComputerFe_B.SSM_gsb = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_oi = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_mxy = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_oy = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_gt = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_nl = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_cum = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_aei = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_ka = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word.SSM;
    A380PrimComputerFe_B.Data_jz = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
    A380PrimComputerFe_B.Data_pwfb = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word.Data;
    A380PrimComputerFe_B.SSM_lu = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_la = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_c5 = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_b0 = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_ol = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_g5 = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_k2 = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_os = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_gn = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.elevator_status_word.SSM;
    A380PrimComputerFe_B.SSM_bdi = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
    A380PrimComputerFe_B.Data_btc = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.elevator_status_word.Data;
    A380PrimComputerFe_B.SSM_lil = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.elevator_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_nhn = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.elevator_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_lmv = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.elevator_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_im = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.elevator_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_ig = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.elevator_3_position_deg.SSM;
    A380PrimComputerFe_B.Data_no = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.elevator_3_position_deg.Data;
    A380PrimComputerFe_B.SSM_ch = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.ths_position_deg.SSM;
    A380PrimComputerFe_B.Data_av = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.ths_position_deg.Data;
    A380PrimComputerFe_B.SSM_ef = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.rudder_status_word.SSM;
    A380PrimComputerFe_B.Data_me = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
    A380PrimComputerFe_B.Data_hc = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.rudder_status_word.Data;
    A380PrimComputerFe_B.SSM_dbs = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.rudder_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_f5c = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.rudder_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_ilr = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.rudder_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_iu = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.rudder_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_ch3 = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.SSM;
    A380PrimComputerFe_B.Data_ihf = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.Data;
    A380PrimComputerFe_B.SSM_ozd = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.fctl_law_status_word.SSM;
    A380PrimComputerFe_B.Data_ao = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.fctl_law_status_word.Data;
    A380PrimComputerFe_B.SSM_ob = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.misc_data_status_word.SSM;
    A380PrimComputerFe_B.SSM_dd4 = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
    A380PrimComputerFe_B.Data_c2 = A380PrimComputerFe_U.in.data.bus_inputs.sec_2_bus.misc_data_status_word.Data;
    A380PrimComputerFe_B.SSM_ps = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.Data_f1 =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_agc =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFe_B.Data_nst =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFe_B.SSM_nt = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.Data_fq =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_oa = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFe_B.Data_amc =
      A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFe_B.SSM_oj = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputerFe_B.Data_nn1 = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
    A380PrimComputerFe_B.Data_b0d = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.Data;
    A380PrimComputerFe_B.SSM_lq = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.aileron_status_word.SSM;
    A380PrimComputerFe_B.Data_bri = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.aileron_status_word.Data;
    A380PrimComputerFe_B.SSM_fc = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_nmx = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_do = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_oal = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_eu = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_dmb = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_pjf = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputerFe_B.SSM_gu = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
    A380PrimComputerFe_B.Data_nf = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_jsu = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word.SSM;
    A380PrimComputerFe_B.Data_anh = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word.Data;
    A380PrimComputerFe_B.SSM_eb = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_idf = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_dbu = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_gm = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_hh = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_jqv = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_jsuo = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_ni3 = A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    A380PrimComputerFe_B.Data_d1 = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_dj = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.elevator_status_word.SSM;
    A380PrimComputerFe_B.Data_dv = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.elevator_status_word.Data;
    A380PrimComputerFe_B.SSM_oio = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.elevator_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_oq4 = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.elevator_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_ewd = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.elevator_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_fb = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.elevator_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_pjk = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.elevator_3_position_deg.SSM;
    A380PrimComputerFe_B.Data_bsv = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.elevator_3_position_deg.Data;
    A380PrimComputerFe_B.SSM_j3l = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.ths_position_deg.SSM;
    A380PrimComputerFe_B.SSM_ceq =
      A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM;
    A380PrimComputerFe_B.Data_nt = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.ths_position_deg.Data;
    A380PrimComputerFe_B.SSM_d4h = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.rudder_status_word.SSM;
    A380PrimComputerFe_B.Data_ac = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.rudder_status_word.Data;
    A380PrimComputerFe_B.SSM_dc = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.rudder_1_position_deg.SSM;
    A380PrimComputerFe_B.Data_dcn = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.rudder_1_position_deg.Data;
    A380PrimComputerFe_B.SSM_obg = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.rudder_2_position_deg.SSM;
    A380PrimComputerFe_B.Data_joe = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.rudder_2_position_deg.Data;
    A380PrimComputerFe_B.SSM_b5 = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.SSM;
    A380PrimComputerFe_B.Data_nol = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.Data;
    A380PrimComputerFe_B.SSM_al = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.fctl_law_status_word.SSM;
    A380PrimComputerFe_B.Data_bun =
      A380PrimComputerFe_U.in.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
    A380PrimComputerFe_B.Data_ge = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.fctl_law_status_word.Data;
    A380PrimComputerFe_B.SSM_hib = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.misc_data_status_word.SSM;
    A380PrimComputerFe_B.Data_mj = A380PrimComputerFe_U.in.data.bus_inputs.sec_3_bus.misc_data_status_word.Data;
    A380PrimComputerFe_B.ap_engaged = A380PrimComputerFe_U.in.data.temporary_ap_input.ap_engaged;
    A380PrimComputerFe_B.ap_1_engaged = A380PrimComputerFe_U.in.data.temporary_ap_input.ap_1_engaged;
    A380PrimComputerFe_B.ap_2_engaged = A380PrimComputerFe_U.in.data.temporary_ap_input.ap_2_engaged;
    A380PrimComputerFe_B.athr_engaged = A380PrimComputerFe_U.in.data.temporary_ap_input.athr_engaged;
    A380PrimComputerFe_B.roll_command = A380PrimComputerFe_U.in.data.temporary_ap_input.roll_command;
    A380PrimComputerFe_B.pitch_command = A380PrimComputerFe_U.in.data.temporary_ap_input.pitch_command;
    A380PrimComputerFe_B.yaw_command = A380PrimComputerFe_U.in.data.temporary_ap_input.yaw_command;
    A380PrimComputerFe_B.computer_running = A380PrimComputerFe_U.in.data.sim_data.computer_running;
    A380PrimComputerFe_B.SSM_dbe = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
    A380PrimComputerFe_B.lateral_mode = A380PrimComputerFe_U.in.data.temporary_ap_input.lateral_mode;
    A380PrimComputerFe_B.lateral_mode_armed = A380PrimComputerFe_U.in.data.temporary_ap_input.lateral_mode_armed;
    A380PrimComputerFe_B.vertical_mode = A380PrimComputerFe_U.in.data.temporary_ap_input.vertical_mode;
    A380PrimComputerFe_B.vertical_mode_armed = A380PrimComputerFe_U.in.data.temporary_ap_input.vertical_mode_armed;
    A380PrimComputerFe_B.weight_lbs = A380PrimComputerFe_U.in.data.temporary_ap_input.weight_lbs;
    A380PrimComputerFe_B.cg_percent = A380PrimComputerFe_U.in.data.temporary_ap_input.cg_percent;
    A380PrimComputerFe_B.on_ground = A380PrimComputerFe_U.in.general_logic.on_ground;
    A380PrimComputerFe_B.tracking_mode_on = A380PrimComputerFe_U.in.general_logic.tracking_mode_on;
    A380PrimComputerFe_B.double_adr_failure = A380PrimComputerFe_U.in.general_logic.double_adr_failure;
    A380PrimComputerFe_B.triple_adr_failure = A380PrimComputerFe_U.in.general_logic.triple_adr_failure;
    A380PrimComputerFe_B.Data_naq = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
    A380PrimComputerFe_B.cas_or_mach_disagree = A380PrimComputerFe_U.in.general_logic.cas_or_mach_disagree;
    A380PrimComputerFe_B.alpha_disagree = A380PrimComputerFe_U.in.general_logic.alpha_disagree;
    A380PrimComputerFe_B.double_ir_failure = A380PrimComputerFe_U.in.general_logic.double_ir_failure;
    A380PrimComputerFe_B.triple_ir_failure = A380PrimComputerFe_U.in.general_logic.triple_ir_failure;
    A380PrimComputerFe_B.ir_failure_not_self_detected =
      A380PrimComputerFe_U.in.general_logic.ir_failure_not_self_detected;
    A380PrimComputerFe_B.V_ias_kn = A380PrimComputerFe_U.in.general_logic.adr_computation_data.V_ias_kn;
    A380PrimComputerFe_B.V_tas_kn = A380PrimComputerFe_U.in.general_logic.adr_computation_data.V_tas_kn;
    A380PrimComputerFe_B.mach = A380PrimComputerFe_U.in.general_logic.adr_computation_data.mach;
    A380PrimComputerFe_B.alpha_deg = A380PrimComputerFe_U.in.general_logic.adr_computation_data.alpha_deg;
    A380PrimComputerFe_B.p_s_c_hpa = A380PrimComputerFe_U.in.general_logic.adr_computation_data.p_s_c_hpa;
    A380PrimComputerFe_B.SSM_b1 = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM;
    A380PrimComputerFe_B.altitude_corrected_ft =
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_corrected_ft;
    A380PrimComputerFe_B.theta_deg = A380PrimComputerFe_U.in.general_logic.ir_computation_data.theta_deg;
    A380PrimComputerFe_B.phi_deg = A380PrimComputerFe_U.in.general_logic.ir_computation_data.phi_deg;
    A380PrimComputerFe_B.q_deg_s = A380PrimComputerFe_U.in.general_logic.ir_computation_data.q_deg_s;
    A380PrimComputerFe_B.r_deg_s = A380PrimComputerFe_U.in.general_logic.ir_computation_data.r_deg_s;
    A380PrimComputerFe_B.n_x_g = A380PrimComputerFe_U.in.general_logic.ir_computation_data.n_x_g;
    A380PrimComputerFe_B.n_y_g = A380PrimComputerFe_U.in.general_logic.ir_computation_data.n_y_g;
    A380PrimComputerFe_B.n_z_g = A380PrimComputerFe_U.in.general_logic.ir_computation_data.n_z_g;
    A380PrimComputerFe_B.theta_dot_deg_s = A380PrimComputerFe_U.in.general_logic.ir_computation_data.theta_dot_deg_s;
    A380PrimComputerFe_B.phi_dot_deg_s = A380PrimComputerFe_U.in.general_logic.ir_computation_data.phi_dot_deg_s;
    A380PrimComputerFe_B.Data_j43 = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data;
    A380PrimComputerFe_B.ra_computation_data_ft = A380PrimComputerFe_U.in.general_logic.ra_computation_data_ft;
    A380PrimComputerFe_B.two_ra_failure = A380PrimComputerFe_U.in.general_logic.two_ra_failure;
    A380PrimComputerFe_B.all_ra_failure = A380PrimComputerFe_U.in.general_logic.all_ra_failure;
    A380PrimComputerFe_B.all_sfcc_lost = A380PrimComputerFe_U.in.general_logic.all_sfcc_lost;
    A380PrimComputerFe_B.flap_handle_index = A380PrimComputerFe_U.in.general_logic.flap_handle_index;
    A380PrimComputerFe_B.flap_angle_deg = A380PrimComputerFe_U.in.general_logic.flap_angle_deg;
    A380PrimComputerFe_B.slat_angle_deg = A380PrimComputerFe_U.in.general_logic.slat_angle_deg;
    A380PrimComputerFe_B.slat_flap_actual_pos = A380PrimComputerFe_U.in.general_logic.slat_flap_actual_pos;
    A380PrimComputerFe_B.flap_surface_angle_deg = A380PrimComputerFe_U.in.general_logic.flap_surface_angle_deg;
    A380PrimComputerFe_B.slat_surface_angle_deg = A380PrimComputerFe_U.in.general_logic.slat_surface_angle_deg;
    A380PrimComputerFe_B.SSM_d0 = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.mach.SSM;
    A380PrimComputerFe_B.double_lgciu_failure = A380PrimComputerFe_U.in.general_logic.double_lgciu_failure;
    A380PrimComputerFe_B.slats_locked = A380PrimComputerFe_U.in.general_logic.slats_locked;
    A380PrimComputerFe_B.flaps_locked = A380PrimComputerFe_U.in.general_logic.flaps_locked;
    A380PrimComputerFe_B.landing_gear_down = A380PrimComputerFe_U.in.general_logic.landing_gear_down;
    A380PrimComputerFe_B.computed_weight_lbs = A380PrimComputerFe_U.in.data.temporary_ap_input.weight_lbs;
    A380PrimComputerFe_B.computed_cg_percent = A380PrimComputerFe_U.in.data.temporary_ap_input.cg_percent;
    A380PrimComputerFe_B.Data_po = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.mach.Data;
    A380PrimComputerFe_B.SSM_m5 = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
    A380PrimComputerFe_B.left_inboard_aileron_deg =
      A380PrimComputerFe_U.in.laws.lateral_law_outputs.left_inboard_aileron_deg;
    A380PrimComputerFe_B.right_inboard_aileron_deg =
      A380PrimComputerFe_U.in.laws.lateral_law_outputs.right_inboard_aileron_deg;
    A380PrimComputerFe_B.left_midboard_aileron_deg =
      A380PrimComputerFe_U.in.laws.lateral_law_outputs.left_midboard_aileron_deg;
    A380PrimComputerFe_B.Data_ey = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
    A380PrimComputerFe_B.right_midboard_aileron_deg =
      A380PrimComputerFe_U.in.laws.lateral_law_outputs.right_midboard_aileron_deg;
    A380PrimComputerFe_B.left_outboard_aileron_deg =
      A380PrimComputerFe_U.in.laws.lateral_law_outputs.left_outboard_aileron_deg;
    A380PrimComputerFe_B.right_outboard_aileron_deg =
      A380PrimComputerFe_U.in.laws.lateral_law_outputs.right_outboard_aileron_deg;
    A380PrimComputerFe_B.left_spoiler_1_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.left_spoiler_1_deg;
    A380PrimComputerFe_B.right_spoiler_1_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.right_spoiler_1_deg;
    A380PrimComputerFe_B.left_spoiler_2_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.left_spoiler_2_deg;
    A380PrimComputerFe_B.right_spoiler_2_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.right_spoiler_2_deg;
    A380PrimComputerFe_B.left_spoiler_3_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.left_spoiler_3_deg;
    A380PrimComputerFe_B.right_spoiler_3_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.right_spoiler_3_deg;
    A380PrimComputerFe_B.left_spoiler_4_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.left_spoiler_4_deg;
    A380PrimComputerFe_B.SSM_jli = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
    A380PrimComputerFe_B.right_spoiler_4_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.right_spoiler_4_deg;
    A380PrimComputerFe_B.left_spoiler_5_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.left_spoiler_5_deg;
    A380PrimComputerFe_B.right_spoiler_5_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.right_spoiler_5_deg;
    A380PrimComputerFe_B.left_spoiler_6_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.left_spoiler_6_deg;
    A380PrimComputerFe_B.right_spoiler_6_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.right_spoiler_6_deg;
    A380PrimComputerFe_B.left_spoiler_7_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.left_spoiler_7_deg;
    A380PrimComputerFe_B.right_spoiler_7_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.right_spoiler_7_deg;
    A380PrimComputerFe_B.left_spoiler_8_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.left_spoiler_8_deg;
    A380PrimComputerFe_B.right_spoiler_8_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.right_spoiler_8_deg;
    A380PrimComputerFe_B.upper_rudder_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.upper_rudder_deg;
    A380PrimComputerFe_B.Data_a3 = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
    A380PrimComputerFe_B.lower_rudder_deg = A380PrimComputerFe_U.in.laws.lateral_law_outputs.lower_rudder_deg;
    A380PrimComputerFe_B.left_inboard_elevator_deg =
      A380PrimComputerFe_U.in.laws.pitch_law_outputs.left_inboard_elevator_deg;
    A380PrimComputerFe_B.right_inboard_elevator_deg =
      A380PrimComputerFe_U.in.laws.pitch_law_outputs.right_inboard_elevator_deg;
    A380PrimComputerFe_B.left_outboard_elevator_deg =
      A380PrimComputerFe_U.in.laws.pitch_law_outputs.left_outboard_elevator_deg;
    A380PrimComputerFe_B.right_outboard_elevator_deg =
      A380PrimComputerFe_U.in.laws.pitch_law_outputs.right_outboard_elevator_deg;
    A380PrimComputerFe_B.ths_deg = A380PrimComputerFe_U.in.laws.pitch_law_outputs.ths_deg;
    A380PrimComputerFe_B.left_inboard_aileron_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.left_inboard_aileron_engaged;
    A380PrimComputerFe_B.right_inboard_aileron_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.right_inboard_aileron_engaged;
    A380PrimComputerFe_B.left_midboard_aileron_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.left_midboard_aileron_engaged;
    A380PrimComputerFe_B.right_midboard_aileron_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.right_midboard_aileron_engaged;
    A380PrimComputerFe_B.alignment_dummy_h = A380PrimComputerFe_U.in.data.discrete_inputs.alignment_dummy;
    A380PrimComputerFe_B.SSM_mxc = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
    A380PrimComputerFe_B.left_outboard_aileron_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.left_outboard_aileron_engaged;
    A380PrimComputerFe_B.right_outboard_aileron_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.right_outboard_aileron_engaged;
    A380PrimComputerFe_B.spoiler_pair_1_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.spoiler_pair_1_engaged;
    A380PrimComputerFe_B.spoiler_pair_2_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.spoiler_pair_2_engaged;
    A380PrimComputerFe_B.spoiler_pair_3_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.spoiler_pair_3_engaged;
    A380PrimComputerFe_B.spoiler_pair_4_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.spoiler_pair_4_engaged;
    A380PrimComputerFe_B.spoiler_pair_5_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.spoiler_pair_5_engaged;
    A380PrimComputerFe_B.spoiler_pair_6_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.spoiler_pair_6_engaged;
    A380PrimComputerFe_B.spoiler_pair_7_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.spoiler_pair_7_engaged;
    A380PrimComputerFe_B.spoiler_pair_8_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.spoiler_pair_8_engaged;
    A380PrimComputerFe_B.Data_pey = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
    A380PrimComputerFe_B.left_inboard_elevator_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.left_inboard_elevator_engaged;
    A380PrimComputerFe_B.right_inboard_elevator_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.right_inboard_elevator_engaged;
    A380PrimComputerFe_B.left_outboard_elevator_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.left_outboard_elevator_engaged;
    A380PrimComputerFe_B.right_outboard_elevator_engaged =
      A380PrimComputerFe_U.in.fctl_logic.surface_statuses.right_outboard_elevator_engaged;
    A380PrimComputerFe_B.ths_engaged = A380PrimComputerFe_U.in.fctl_logic.surface_statuses.ths_engaged;
    A380PrimComputerFe_B.upper_rudder_engaged = A380PrimComputerFe_U.in.fctl_logic.surface_statuses.upper_rudder_engaged;
    A380PrimComputerFe_B.lower_rudder_engaged = A380PrimComputerFe_U.in.fctl_logic.surface_statuses.lower_rudder_engaged;
    A380PrimComputerFe_B.left_inboard_aileron_deg_g =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg;
    A380PrimComputerFe_B.right_inboard_aileron_deg_b =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg;
    A380PrimComputerFe_B.left_midboard_aileron_deg_f =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg;
    A380PrimComputerFe_B.SSM_ogm = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
    A380PrimComputerFe_B.right_midboard_aileron_deg_f =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg;
    A380PrimComputerFe_B.left_outboard_aileron_deg_g =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg;
    A380PrimComputerFe_B.right_outboard_aileron_deg_m =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg;
    A380PrimComputerFe_B.left_spoiler_1_deg_b =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.left_spoiler_1_deg;
    A380PrimComputerFe_B.right_spoiler_1_deg_o =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.right_spoiler_1_deg;
    A380PrimComputerFe_B.left_spoiler_2_deg_i =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.left_spoiler_2_deg;
    A380PrimComputerFe_B.right_spoiler_2_deg_g =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.right_spoiler_2_deg;
    A380PrimComputerFe_B.left_spoiler_3_deg_i =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.left_spoiler_3_deg;
    A380PrimComputerFe_B.right_spoiler_3_deg_b =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.right_spoiler_3_deg;
    A380PrimComputerFe_B.left_spoiler_4_deg_g =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.left_spoiler_4_deg;
    A380PrimComputerFe_B.Data_kf = A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    A380PrimComputerFe_B.right_spoiler_4_deg_a =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.right_spoiler_4_deg;
    A380PrimComputerFe_B.left_spoiler_5_deg_d =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.left_spoiler_5_deg;
    A380PrimComputerFe_B.right_spoiler_5_deg_m =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.right_spoiler_5_deg;
    A380PrimComputerFe_B.left_spoiler_6_deg_o =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.left_spoiler_6_deg;
    A380PrimComputerFe_B.right_spoiler_6_deg_d =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.right_spoiler_6_deg;
    A380PrimComputerFe_B.left_spoiler_7_deg_a =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.left_spoiler_7_deg;
    A380PrimComputerFe_B.right_spoiler_7_deg_j =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.right_spoiler_7_deg;
    A380PrimComputerFe_B.left_spoiler_8_deg_h =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.left_spoiler_8_deg;
    A380PrimComputerFe_B.right_spoiler_8_deg_j =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.right_spoiler_8_deg;
    A380PrimComputerFe_B.upper_rudder_deg_m =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.upper_rudder_deg;
    A380PrimComputerFe_B.SSM_nlt =
      A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM;
    A380PrimComputerFe_B.lower_rudder_deg_c =
      A380PrimComputerFe_U.in.fctl_logic.lateral_surface_positions.lower_rudder_deg;
    A380PrimComputerFe_B.left_inboard_elevator_deg_k =
      A380PrimComputerFe_U.in.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg;
    A380PrimComputerFe_B.right_inboard_elevator_deg_o =
      A380PrimComputerFe_U.in.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg;
    A380PrimComputerFe_B.left_outboard_elevator_deg_p =
      A380PrimComputerFe_U.in.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg;
    A380PrimComputerFe_B.right_outboard_elevator_deg_g =
      A380PrimComputerFe_U.in.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg;
    A380PrimComputerFe_B.ths_deg_o = A380PrimComputerFe_U.in.fctl_logic.pitch_surface_positions.ths_deg;
    A380PrimComputerFe_B.lateral_law_capability = A380PrimComputerFe_U.in.fctl_logic.lateral_law_capability;
    A380PrimComputerFe_B.active_lateral_law = A380PrimComputerFe_U.in.fctl_logic.active_lateral_law;
    A380PrimComputerFe_B.pitch_law_capability = A380PrimComputerFe_U.in.fctl_logic.pitch_law_capability;
    A380PrimComputerFe_B.active_pitch_law = A380PrimComputerFe_U.in.fctl_logic.active_pitch_law;
    A380PrimComputerFe_B.Data_hk1 =
      A380PrimComputerFe_U.in.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
    A380PrimComputerFe_B.abnormal_condition_law_active =
      A380PrimComputerFe_U.in.fctl_logic.abnormal_condition_law_active;
    A380PrimComputerFe_B.is_master_prim = A380PrimComputerFe_U.in.fctl_logic.is_master_prim;
    A380PrimComputerFe_B.elevator_1_avail = A380PrimComputerFe_U.in.fctl_logic.elevator_1_avail;
    A380PrimComputerFe_B.elevator_1_engaged = A380PrimComputerFe_U.in.fctl_logic.elevator_1_engaged;
    A380PrimComputerFe_B.elevator_2_avail = A380PrimComputerFe_U.in.fctl_logic.elevator_2_avail;
    A380PrimComputerFe_B.elevator_2_engaged = A380PrimComputerFe_U.in.fctl_logic.elevator_2_engaged;
    A380PrimComputerFe_B.elevator_3_avail = A380PrimComputerFe_U.in.fctl_logic.elevator_3_avail;
    A380PrimComputerFe_B.elevator_3_engaged = A380PrimComputerFe_U.in.fctl_logic.elevator_3_engaged;
    A380PrimComputerFe_B.ths_avail = A380PrimComputerFe_U.in.fctl_logic.ths_avail;
    A380PrimComputerFe_B.ths_engaged_h = A380PrimComputerFe_U.in.fctl_logic.ths_engaged;
    A380PrimComputerFe_B.SSM_dz = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
    A380PrimComputerFe_B.left_aileron_1_avail = A380PrimComputerFe_U.in.fctl_logic.left_aileron_1_avail;
    A380PrimComputerFe_B.left_aileron_1_engaged = A380PrimComputerFe_U.in.fctl_logic.left_aileron_1_engaged;
    A380PrimComputerFe_B.left_aileron_2_avail = A380PrimComputerFe_U.in.fctl_logic.left_aileron_2_avail;
    A380PrimComputerFe_B.left_aileron_2_engaged = A380PrimComputerFe_U.in.fctl_logic.left_aileron_2_engaged;
    A380PrimComputerFe_B.right_aileron_1_avail = A380PrimComputerFe_U.in.fctl_logic.right_aileron_1_avail;
    A380PrimComputerFe_B.right_aileron_1_engaged = A380PrimComputerFe_U.in.fctl_logic.right_aileron_1_engaged;
    A380PrimComputerFe_B.right_aileron_2_avail = A380PrimComputerFe_U.in.fctl_logic.right_aileron_2_avail;
    A380PrimComputerFe_B.right_aileron_2_engaged = A380PrimComputerFe_U.in.fctl_logic.right_aileron_2_engaged;
    A380PrimComputerFe_B.left_spoiler_hydraulic_mode_avail =
      A380PrimComputerFe_U.in.fctl_logic.left_spoiler_hydraulic_mode_avail;
    A380PrimComputerFe_B.left_spoiler_electric_mode_avail =
      A380PrimComputerFe_U.in.fctl_logic.left_spoiler_electric_mode_avail;
    A380PrimComputerFe_B.Data_grt = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
    A380PrimComputerFe_B.left_spoiler_hydraulic_mode_engaged =
      A380PrimComputerFe_U.in.fctl_logic.left_spoiler_hydraulic_mode_engaged;
    A380PrimComputerFe_B.left_spoiler_electric_mode_engaged =
      A380PrimComputerFe_U.in.fctl_logic.left_spoiler_electric_mode_engaged;
    A380PrimComputerFe_B.right_spoiler_hydraulic_mode_avail =
      A380PrimComputerFe_U.in.fctl_logic.right_spoiler_hydraulic_mode_avail;
    A380PrimComputerFe_B.right_spoiler_electric_mode_avail =
      A380PrimComputerFe_U.in.fctl_logic.right_spoiler_electric_mode_avail;
    A380PrimComputerFe_B.right_spoiler_hydraulic_mode_engaged =
      A380PrimComputerFe_U.in.fctl_logic.right_spoiler_hydraulic_mode_engaged;
    A380PrimComputerFe_B.right_spoiler_electric_mode_engaged =
      A380PrimComputerFe_U.in.fctl_logic.right_spoiler_electric_mode_engaged;
    A380PrimComputerFe_B.rudder_1_hydraulic_mode_avail =
      A380PrimComputerFe_U.in.fctl_logic.rudder_1_hydraulic_mode_avail;
    A380PrimComputerFe_B.rudder_1_electric_mode_avail = A380PrimComputerFe_U.in.fctl_logic.rudder_1_electric_mode_avail;
    A380PrimComputerFe_B.rudder_1_hydraulic_mode_engaged =
      A380PrimComputerFe_U.in.fctl_logic.rudder_1_hydraulic_mode_engaged;
    A380PrimComputerFe_B.rudder_1_electric_mode_engaged =
      A380PrimComputerFe_U.in.fctl_logic.rudder_1_electric_mode_engaged;
    A380PrimComputerFe_B.SSM_oiy = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM;
    A380PrimComputerFe_B.rudder_2_hydraulic_mode_avail =
      A380PrimComputerFe_U.in.fctl_logic.rudder_2_hydraulic_mode_avail;
    A380PrimComputerFe_B.rudder_2_electric_mode_avail = A380PrimComputerFe_U.in.fctl_logic.rudder_2_electric_mode_avail;
    A380PrimComputerFe_B.rudder_2_hydraulic_mode_engaged =
      A380PrimComputerFe_U.in.fctl_logic.rudder_2_hydraulic_mode_engaged;
    A380PrimComputerFe_B.rudder_2_electric_mode_engaged =
      A380PrimComputerFe_U.in.fctl_logic.rudder_2_electric_mode_engaged;
    A380PrimComputerFe_B.aileron_droop_active = A380PrimComputerFe_U.in.fctl_logic.aileron_droop_active;
    A380PrimComputerFe_B.aileron_antidroop_active = A380PrimComputerFe_U.in.fctl_logic.aileron_antidroop_active;
    A380PrimComputerFe_B.ths_automatic_mode_active = A380PrimComputerFe_U.in.fctl_logic.ths_automatic_mode_active;
    A380PrimComputerFe_B.ths_manual_mode_c_deg_s = A380PrimComputerFe_U.in.fctl_logic.ths_manual_mode_c_deg_s;
    A380PrimComputerFe_B.is_yellow_hydraulic_power_avail =
      A380PrimComputerFe_U.in.fctl_logic.is_yellow_hydraulic_power_avail;
    A380PrimComputerFe_B.is_green_hydraulic_power_avail =
      A380PrimComputerFe_U.in.fctl_logic.is_green_hydraulic_power_avail;
    A380PrimComputerFe_B.Data_cmi = A380PrimComputerFe_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data;
    A380PrimComputerFe_B.eha_ebha_elec_mode_inhibited = A380PrimComputerFe_U.in.fctl_logic.eha_ebha_elec_mode_inhibited;
    A380PrimComputerFe_B.left_sidestick_disabled = A380PrimComputerFe_U.in.fctl_logic.left_sidestick_disabled;
    A380PrimComputerFe_B.right_sidestick_disabled = A380PrimComputerFe_U.in.fctl_logic.right_sidestick_disabled;
    A380PrimComputerFe_B.left_sidestick_priority_locked =
      A380PrimComputerFe_U.in.fctl_logic.left_sidestick_priority_locked;
    A380PrimComputerFe_B.right_sidestick_priority_locked =
      A380PrimComputerFe_U.in.fctl_logic.right_sidestick_priority_locked;
    A380PrimComputerFe_B.total_sidestick_pitch_command =
      A380PrimComputerFe_U.in.fctl_logic.total_sidestick_pitch_command;
    A380PrimComputerFe_B.total_sidestick_roll_command = A380PrimComputerFe_U.in.fctl_logic.total_sidestick_roll_command;
    A380PrimComputerFe_B.speed_brake_inhibited = A380PrimComputerFe_U.in.fctl_logic.speed_brake_inhibited;
    A380PrimComputerFe_B.speed_brake_command_deg = A380PrimComputerFe_U.in.fctl_logic.speed_brake_command_deg;
    A380PrimComputerFe_B.ground_spoilers_armed = A380PrimComputerFe_U.in.fctl_logic.ground_spoilers_armed;
    A380PrimComputerFe_RateLimiter(look2_binlxpw(A380PrimComputerFe_U.in.general_logic.adr_computation_data.mach,
      static_cast<real_T>(A380PrimComputerFe_U.in.general_logic.flap_handle_index),
      A380PrimComputerFe_P.alphafloor_bp01Data, A380PrimComputerFe_P.alphafloor_bp02Data,
      A380PrimComputerFe_P.alphafloor_tableData, A380PrimComputerFe_P.alphafloor_maxIndex, 4U),
      A380PrimComputerFe_P.RateLimiterGenericVariableTs1_up, A380PrimComputerFe_P.RateLimiterGenericVariableTs1_lo,
      A380PrimComputerFe_U.in.data.time.dt, A380PrimComputerFe_P.reset_Value, &rtb_vs1g_o,
      &A380PrimComputerFe_DWork.sf_RateLimiter);
    rtb_Gain = A380PrimComputerFe_P.DiscreteDerivativeVariableTs_Gain *
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.V_ias_kn;
    A380PrimComputerFe_LagFilter((rtb_Gain - A380PrimComputerFe_DWork.Delay_DSTATE) /
      A380PrimComputerFe_U.in.data.time.dt, A380PrimComputerFe_P.LagFilter_C1, A380PrimComputerFe_U.in.data.time.dt,
      &rtb_vs1g, &A380PrimComputerFe_DWork.sf_LagFilter);
    if (A380PrimComputerFe_U.in.general_logic.all_ra_failure) {
      rtb_Switch = A380PrimComputerFe_U.in.general_logic.ra_computation_data_ft;
    } else {
      rtb_Switch = A380PrimComputerFe_P.Constant_Value;
    }

    if (A380PrimComputerFe_DWork.is_active_c15_A380PrimComputerFe == 0) {
      A380PrimComputerFe_DWork.is_active_c15_A380PrimComputerFe = 1U;
      A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Landed;
      rtb_alpha_floor_inhib = 1;
    } else {
      switch (A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe) {
       case A380PrimComputerFe_IN_Flying:
        if (rtb_Switch < 100.0) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Landing100ft;
          rtb_alpha_floor_inhib = 1;
        } else if (A380PrimComputerFe_U.in.general_logic.on_ground) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else {
          rtb_alpha_floor_inhib = 0;
        }
        break;

       case A380PrimComputerFe_IN_Landed:
        if (!A380PrimComputerFe_U.in.general_logic.on_ground) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Takeoff100ft;
          rtb_alpha_floor_inhib = 0;
        } else {
          rtb_alpha_floor_inhib = 1;
        }
        break;

       case A380PrimComputerFe_IN_Landing100ft:
        if (rtb_Switch > 100.0) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Flying;
          rtb_alpha_floor_inhib = 0;
        } else if (A380PrimComputerFe_U.in.general_logic.on_ground) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else {
          rtb_alpha_floor_inhib = 1;
        }
        break;

       default:
        if (A380PrimComputerFe_U.in.general_logic.on_ground) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else if (rtb_Switch > 100.0) {
          A380PrimComputerFe_DWork.is_c15_A380PrimComputerFe = A380PrimComputerFe_IN_Flying;
          rtb_alpha_floor_inhib = 0;
        } else {
          rtb_alpha_floor_inhib = 0;
        }
        break;
      }
    }

    rtb_Equal = (A380PrimComputerFe_U.in.fctl_logic.active_pitch_law == A380PrimComputerFe_P.EnumeratedConstant_Value);
    guard1 = false;
    if ((rtb_alpha_floor_inhib == 0) && (A380PrimComputerFe_U.in.general_logic.adr_computation_data.mach < 0.6)) {
      if (A380PrimComputerFe_U.in.general_logic.flap_handle_index >= 4.0F) {
        tmp = -3;
      } else {
        tmp = 0;
      }

      if ((A380PrimComputerFe_U.in.general_logic.adr_computation_data.alpha_deg > rtb_vs1g_o + std::fmin(std::fmax
            (rtb_vs1g, static_cast<real_T>(tmp)), 0.0)) && rtb_Equal) {
        A380PrimComputerFe_DWork.sAlphaFloor = 1.0;
      } else {
        guard1 = true;
      }
    } else {
      guard1 = true;
    }

    if (guard1) {
      if ((rtb_alpha_floor_inhib != 0) || (!A380PrimComputerFe_U.in.fctl_logic.high_alpha_prot_active) || (!rtb_Equal))
      {
        A380PrimComputerFe_DWork.sAlphaFloor = 0.0;
      }
    }

    A380PrimComputerFe_Y.out.flight_envelope.alpha_floor_condition = (A380PrimComputerFe_DWork.sAlphaFloor != 0.0);
    A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport2Outport1 = 0.0;
    A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1 = false;
    A380PrimComputerFe_LagFilter(A380PrimComputerFe_U.in.general_logic.ir_computation_data.n_z_g +
      A380PrimComputerFe_P.Bias_Bias, A380PrimComputerFe_P.LagFilter2_C1, A380PrimComputerFe_U.in.data.time.dt,
      &rtb_vs1g_o, &A380PrimComputerFe_DWork.sf_LagFilter_pa);
    if (A380PrimComputerFe_U.in.general_logic.on_ground) {
      rtb_Switch = A380PrimComputerFe_U.in.general_logic.ir_computation_data.theta_deg;
    } else {
      rtb_Switch = A380PrimComputerFe_U.in.general_logic.adr_computation_data.alpha_deg;
    }

    if (rtb_vs1g_o > A380PrimComputerFe_P.Saturation1_UpperSat) {
      rtb_vs1g_o = A380PrimComputerFe_P.Saturation1_UpperSat;
    } else if (rtb_vs1g_o < A380PrimComputerFe_P.Saturation1_LowerSat) {
      rtb_vs1g_o = A380PrimComputerFe_P.Saturation1_LowerSat;
    }

    A380PrimComputerFe_LagFilter(A380PrimComputerFe_P.Gain_Gain *
      A380PrimComputerFe_U.in.general_logic.ir_computation_data.n_x_g - rtb_Switch * (rtb_vs1g_o +
      A380PrimComputerFe_P.Bias1_Bias), A380PrimComputerFe_P.LagFilter1_C1, A380PrimComputerFe_U.in.data.time.dt,
      &A380PrimComputerFe_Y.out.flight_envelope.gamma_t_deg, &A380PrimComputerFe_DWork.sf_LagFilter_p);
    A380PrimComputerFe_LagFilter(A380PrimComputerFe_U.in.general_logic.ir_computation_data.theta_deg - std::cos
      (A380PrimComputerFe_P.Gain1_Gain * A380PrimComputerFe_U.in.general_logic.ir_computation_data.phi_deg) * rtb_Switch,
      A380PrimComputerFe_P.LagFilter_C1_f, A380PrimComputerFe_U.in.data.time.dt,
      &A380PrimComputerFe_Y.out.flight_envelope.gamma_a_deg, &A380PrimComputerFe_DWork.sf_LagFilter_e);
    A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport2Outport1_b = false;
    A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport2Outport1_bq = false;
    rtb_Equal = !A380PrimComputerFe_U.in.general_logic.on_ground;
    if (rtb_Equal == A380PrimComputerFe_P.ConfirmNode_isRisingEdge) {
      A380PrimComputerFe_DWork.timeSinceCondition += A380PrimComputerFe_U.in.data.time.dt;
      if (A380PrimComputerFe_DWork.timeSinceCondition >= A380PrimComputerFe_P.ConfirmNode_timeDelay) {
        A380PrimComputerFe_DWork.output = rtb_Equal;
      }
    } else {
      A380PrimComputerFe_DWork.timeSinceCondition = 0.0;
      A380PrimComputerFe_DWork.output = rtb_Equal;
    }

    A380PrimComputerFe_Y.out.flight_envelope.speed_scale_visible = A380PrimComputerFe_DWork.output;
    A380PrimComputerFe_Y.out.flight_envelope.speed_scale_lost = (A380PrimComputerFe_U.in.general_logic.all_sfcc_lost ||
      A380PrimComputerFe_U.in.general_logic.triple_adr_failure);
    if (A380PrimComputerFe_U.in.general_logic.on_ground) {
      A380PrimComputerFe_DWork.takeoff_config_n = A380PrimComputerFe_U.in.general_logic.flap_handle_index;
    } else if (A380PrimComputerFe_DWork.takeoff_config_n != A380PrimComputerFe_U.in.general_logic.flap_handle_index) {
      A380PrimComputerFe_DWork.takeoff_config_n = -1.0;
    }

    if (A380PrimComputerFe_DWork.takeoff_config_n != -1.0) {
      rtb_conf = 2.0;
    } else {
      rtb_conf = A380PrimComputerFe_U.in.general_logic.flap_handle_index;
    }

    rtb_Switch = A380PrimComputerFe_P.Gain2_Gain * A380PrimComputerFe_U.in.data.temporary_ap_input.weight_lbs;
    bpIndices[0U] = plook_binx(rtb_Switch, A380PrimComputerFe_P.nDLookupTable_bp01Data, 7U, &rtb_vs1g);
    fractions[0U] = rtb_vs1g;
    bpIndices[1U] = plook_binx(A380PrimComputerFe_P.Gain3_Gain *
      A380PrimComputerFe_U.in.data.temporary_ap_input.cg_percent, A380PrimComputerFe_P.nDLookupTable_bp02Data, 1U,
      &rtb_vs1g);
    fractions[1U] = rtb_vs1g;
    bpIndices[2U] = plook_binx(rtb_conf, A380PrimComputerFe_P.nDLookupTable_bp03Data, 5U, &rtb_vs1g);
    fractions[2U] = rtb_vs1g;
    A380PrimComputerFe_VS1GfromVLS(look2_binlxpw(rtb_Switch,
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_corrected_ft,
      A380PrimComputerFe_P.uDLookupTable1_bp01Data, A380PrimComputerFe_P.uDLookupTable1_bp02Data,
      A380PrimComputerFe_P.uDLookupTable1_tableData, A380PrimComputerFe_P.uDLookupTable1_maxIndex, 8U), intrp3d_l_pw
      (bpIndices, fractions, A380PrimComputerFe_P.nDLookupTable_tableData, A380PrimComputerFe_P.nDLookupTable_dimSizes),
      rtb_conf, &rtb_vs1g_o);
    rtb_Switch = A380PrimComputerFe_P.Gain2_Gain_m * A380PrimComputerFe_U.in.data.temporary_ap_input.weight_lbs;
    bpIndices_0[0U] = plook_binx(rtb_Switch, A380PrimComputerFe_P.nDLookupTable_bp01Data_n, 7U, &rtb_vs1g);
    fractions_0[0U] = rtb_vs1g;
    bpIndices_0[1U] = plook_binx(A380PrimComputerFe_P.Gain3_Gain_i *
      A380PrimComputerFe_U.in.data.temporary_ap_input.cg_percent, A380PrimComputerFe_P.nDLookupTable_bp02Data_j, 1U,
      &rtb_vs1g);
    fractions_0[1U] = rtb_vs1g;
    bpIndices_0[2U] = plook_binx(A380PrimComputerFe_P.Constant1_Value, A380PrimComputerFe_P.nDLookupTable_bp03Data_k, 5U,
      &rtb_vs1g);
    fractions_0[2U] = rtb_vs1g;
    A380PrimComputerFe_VS1GfromVLS(look2_binlxpw(rtb_Switch,
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_corrected_ft,
      A380PrimComputerFe_P.uDLookupTable1_bp01Data_p, A380PrimComputerFe_P.uDLookupTable1_bp02Data_h,
      A380PrimComputerFe_P.uDLookupTable1_tableData_n, A380PrimComputerFe_P.uDLookupTable1_maxIndex_f, 8U), intrp3d_l_pw
      (bpIndices_0, fractions_0, A380PrimComputerFe_P.nDLookupTable_tableData_g,
       A380PrimComputerFe_P.nDLookupTable_dimSizes_k), A380PrimComputerFe_P.Constant1_Value, &rtb_vs1g);
    if (A380PrimComputerFe_U.in.general_logic.on_ground) {
      A380PrimComputerFe_DWork.takeoff_config_e = A380PrimComputerFe_U.in.general_logic.flap_handle_index;
    } else if (A380PrimComputerFe_DWork.takeoff_config_e != A380PrimComputerFe_U.in.general_logic.flap_handle_index) {
      A380PrimComputerFe_DWork.takeoff_config_e = -1.0;
    }

    if (static_cast<real_T>(A380PrimComputerFe_DWork.takeoff_config_e != -1.0) > A380PrimComputerFe_P.Switch_Threshold)
    {
      A380PrimComputerFe_Y.out.flight_envelope.v_3_kn = std::fmax(A380PrimComputerFe_P.Vmcl5_Value,
        A380PrimComputerFe_P.Gain4_Gain * rtb_vs1g);
    } else {
      A380PrimComputerFe_Y.out.flight_envelope.v_3_kn = std::fmin(A380PrimComputerFe_P.Vfe_35_Value, std::fmax
        (rtb_vs1g_o * look1_binlxpw(static_cast<real_T>(A380PrimComputerFe_U.in.general_logic.flap_handle_index),
        A380PrimComputerFe_P.uDLookupTable_bp01Data, A380PrimComputerFe_P.uDLookupTable_tableData, 1U),
         A380PrimComputerFe_P.Vmcl10_Value));
    }

    A380PrimComputerFe_Y.out.flight_envelope.v_man_kn = look2_binlxpw(A380PrimComputerFe_P.Gain3_Gain_h *
      A380PrimComputerFe_U.in.data.temporary_ap_input.weight_lbs,
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_corrected_ft,
      A380PrimComputerFe_P.uDLookupTable_bp01Data_n, A380PrimComputerFe_P.uDLookupTable_bp02Data,
      A380PrimComputerFe_P.uDLookupTable_tableData_p, A380PrimComputerFe_P.uDLookupTable_maxIndex, 8U);
    rtb_Switch = A380PrimComputerFe_P.Gain2_Gain_n * A380PrimComputerFe_U.in.data.temporary_ap_input.weight_lbs;
    bpIndices_1[0U] = plook_binx(rtb_Switch, A380PrimComputerFe_P.nDLookupTable_bp01Data_c, 7U, &rtb_vs1g);
    fractions_1[0U] = rtb_vs1g;
    bpIndices_1[1U] = plook_binx(A380PrimComputerFe_P.Gain3_Gain_k *
      A380PrimComputerFe_U.in.data.temporary_ap_input.cg_percent, A380PrimComputerFe_P.nDLookupTable_bp02Data_i, 1U,
      &rtb_vs1g);
    fractions_1[1U] = rtb_vs1g;
    bpIndices_1[2U] = plook_binx(A380PrimComputerFe_P.Constant_Value_a, A380PrimComputerFe_P.nDLookupTable_bp03Data_h,
      5U, &rtb_vs1g);
    fractions_1[2U] = rtb_vs1g;
    A380PrimComputerFe_VS1GfromVLS(look2_binlxpw(rtb_Switch,
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_corrected_ft,
      A380PrimComputerFe_P.uDLookupTable1_bp01Data_pl, A380PrimComputerFe_P.uDLookupTable1_bp02Data_b,
      A380PrimComputerFe_P.uDLookupTable1_tableData_m, A380PrimComputerFe_P.uDLookupTable1_maxIndex_h, 8U), intrp3d_l_pw
      (bpIndices_1, fractions_1, A380PrimComputerFe_P.nDLookupTable_tableData_d,
       A380PrimComputerFe_P.nDLookupTable_dimSizes_j), A380PrimComputerFe_P.Constant_Value_a, &rtb_vs1g_o);
    A380PrimComputerFe_Y.out.flight_envelope.v_4_kn = std::fmin(std::fmax(A380PrimComputerFe_P.Gain2_Gain_j * rtb_vs1g_o,
      A380PrimComputerFe_P.Vmcl20_Value), A380PrimComputerFe_P.Vfe_25_Value);
    A380PrimComputerFe_Y.out.flight_envelope.v_man_visible = (A380PrimComputerFe_U.in.general_logic.flap_handle_index ==
      A380PrimComputerFe_P.CompareToConstant_const);
    A380PrimComputerFe_Y.out.flight_envelope.v_4_visible = ((A380PrimComputerFe_U.in.general_logic.flap_handle_index ==
      A380PrimComputerFe_P.CompareToConstant3_const) || (A380PrimComputerFe_U.in.general_logic.flap_handle_index ==
      A380PrimComputerFe_P.CompareToConstant1_const));
    A380PrimComputerFe_Y.out.flight_envelope.v_3_visible = ((A380PrimComputerFe_U.in.general_logic.flap_handle_index ==
      A380PrimComputerFe_P.CompareToConstant4_const) || (A380PrimComputerFe_U.in.general_logic.flap_handle_index ==
      A380PrimComputerFe_P.CompareToConstant2_const));
    A380PrimComputerFe_Y.out.flight_envelope.v_fe_next_visible =
      ((A380PrimComputerFe_U.in.general_logic.flap_handle_index < A380PrimComputerFe_P.CompareToConstant_const_b) &&
       (A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_corrected_ft <=
        A380PrimComputerFe_P.CompareToConstant1_const_b));
    rtb_Switch = std::fmax(A380PrimComputerFe_P.Constant1_Value_j, 0.0);
    if (A380PrimComputerFe_U.in.general_logic.landing_gear_down) {
      rtb_vs1g_o = A380PrimComputerFe_P.Constant2_Value;
    } else {
      rtb_vs1g_o = A380PrimComputerFe_P.Constant3_Value;
    }

    A380PrimComputerFe_Y.out.flight_envelope.v_max_kn = std::fmin(std::fmin(std::fmin(rtb_vs1g_o, std::sqrt(std::pow
      ((std::pow(rtb_Switch * rtb_Switch * 0.2 + 1.0, 3.5) - 1.0) * (std::fmax
      (A380PrimComputerFe_U.in.general_logic.adr_computation_data.p_s_c_hpa, 0.0) / 1013.25) + 1.0, 0.2857142857142857)
      - 1.0) * 1479.1), static_cast<real_T>(look2_iflf_binlxpw
      (A380PrimComputerFe_U.in.general_logic.flap_surface_angle_deg,
       A380PrimComputerFe_U.in.general_logic.slat_surface_angle_deg, A380PrimComputerFe_P.uDLookupTable_bp01Data_e,
       A380PrimComputerFe_P.uDLookupTable_bp02Data_o, A380PrimComputerFe_P.uDLookupTable_tableData_a,
       A380PrimComputerFe_P.uDLookupTable_maxIndex_a, 5U))), look1_binlxpw(static_cast<real_T>
      (A380PrimComputerFe_U.in.general_logic.flap_handle_index), A380PrimComputerFe_P.uDLookupTable_bp01Data_m,
      A380PrimComputerFe_P.uDLookupTable_tableData_b, 5U));
    A380PrimComputerFe_Y.out.flight_envelope.v_fe_next_kn = look1_binlxpw(static_cast<real_T>
      (A380PrimComputerFe_U.in.general_logic.flap_handle_index), A380PrimComputerFe_P.uDLookupTable1_bp01Data_j,
      A380PrimComputerFe_P.uDLookupTable1_tableData_l, 5U);
    if (A380PrimComputerFe_U.in.general_logic.adr_computation_data.V_ias_kn > A380PrimComputerFe_P.Saturation_UpperSat)
    {
      rtb_Switch = A380PrimComputerFe_P.Saturation_UpperSat;
    } else if (A380PrimComputerFe_U.in.general_logic.adr_computation_data.V_ias_kn <
               A380PrimComputerFe_P.Saturation_LowerSat) {
      rtb_Switch = A380PrimComputerFe_P.Saturation_LowerSat;
    } else {
      rtb_Switch = A380PrimComputerFe_U.in.general_logic.adr_computation_data.V_ias_kn;
    }

    A380PrimComputerFe_LagFilter(rtb_Switch, A380PrimComputerFe_P.LagFilter_C1_d, A380PrimComputerFe_U.in.data.time.dt,
      &rtb_vs1g_o, &A380PrimComputerFe_DWork.sf_LagFilter_d);
    if ((!A380PrimComputerFe_DWork.pY_not_empty_d) || (!A380PrimComputerFe_DWork.pU_not_empty)) {
      A380PrimComputerFe_DWork.pU = rtb_vs1g_o;
      A380PrimComputerFe_DWork.pU_not_empty = true;
      A380PrimComputerFe_DWork.pY_b = rtb_vs1g_o;
      A380PrimComputerFe_DWork.pY_not_empty_d = true;
    }

    rtb_Switch = A380PrimComputerFe_U.in.data.time.dt * A380PrimComputerFe_P.WashoutFilter_C1 + 2.0;
    rtb_vs1g = 2.0 / rtb_Switch;
    A380PrimComputerFe_DWork.pY_b = (2.0 - A380PrimComputerFe_U.in.data.time.dt * A380PrimComputerFe_P.WashoutFilter_C1)
      / rtb_Switch * A380PrimComputerFe_DWork.pY_b + (rtb_vs1g_o * rtb_vs1g - A380PrimComputerFe_DWork.pU * rtb_vs1g);
    A380PrimComputerFe_DWork.pU = rtb_vs1g_o;
    A380PrimComputerFe_Y.out.flight_envelope.v_c_trend_kn = A380PrimComputerFe_P.Gain_Gain_m *
      A380PrimComputerFe_DWork.pY_b;
    rtb_vs1g_o = A380PrimComputerFe_P.Gain2_Gain_k * A380PrimComputerFe_U.in.data.temporary_ap_input.weight_lbs;
    bpIndices_2[0U] = plook_binx(rtb_vs1g_o, A380PrimComputerFe_P.nDLookupTable_bp01Data_p, 7U, &rtb_vs1g);
    fractions_2[0U] = rtb_vs1g;
    bpIndices_2[1U] = plook_binx(A380PrimComputerFe_P.Gain3_Gain_c *
      A380PrimComputerFe_U.in.data.temporary_ap_input.cg_percent, A380PrimComputerFe_P.nDLookupTable_bp02Data_b, 1U,
      &rtb_vs1g);
    fractions_2[1U] = rtb_vs1g;
    bpIndices_2[2U] = plook_binx(static_cast<real_T>(A380PrimComputerFe_U.in.general_logic.flap_handle_index),
      A380PrimComputerFe_P.nDLookupTable_bp03Data_p, 5U, &rtb_vs1g);
    fractions_2[2U] = rtb_vs1g;
    A380PrimComputerFe_VS1GfromVLS(look2_binlxpw(rtb_vs1g_o,
      A380PrimComputerFe_U.in.general_logic.adr_computation_data.altitude_corrected_ft,
      A380PrimComputerFe_P.uDLookupTable1_bp01Data_pr, A380PrimComputerFe_P.uDLookupTable1_bp02Data_i,
      A380PrimComputerFe_P.uDLookupTable1_tableData_nq, A380PrimComputerFe_P.uDLookupTable1_maxIndex_b, 8U),
      intrp3d_l_pw(bpIndices_2, fractions_2, A380PrimComputerFe_P.nDLookupTable_tableData_c,
                   A380PrimComputerFe_P.nDLookupTable_dimSizes_g), static_cast<real_T>
      (A380PrimComputerFe_U.in.general_logic.flap_handle_index), &rtb_vs1g_o);
    A380PrimComputerFe_RateLimiter(rtb_vs1g_o, A380PrimComputerFe_P.RateLimiterGenericVariableTs1_up_j,
      A380PrimComputerFe_P.RateLimiterGenericVariableTs1_lo_d, A380PrimComputerFe_U.in.data.time.dt,
      A380PrimComputerFe_P.reset_Value_h, &A380PrimComputerFe_B.Y, &A380PrimComputerFe_DWork.sf_RateLimiter_b);
    if (A380PrimComputerFe_U.in.general_logic.on_ground) {
      A380PrimComputerFe_DWork.takeoff_config = A380PrimComputerFe_U.in.general_logic.flap_handle_index;
    } else if (A380PrimComputerFe_DWork.takeoff_config != A380PrimComputerFe_U.in.general_logic.flap_handle_index) {
      A380PrimComputerFe_DWork.takeoff_config = -1.0;
    }

    if ((!A380PrimComputerFe_DWork.pY_not_empty) || A380PrimComputerFe_P.reset_Value_o) {
      A380PrimComputerFe_DWork.pY = A380PrimComputerFe_P.RateLimiterGenericVariableTs_InitialCondition;
      A380PrimComputerFe_DWork.pY_not_empty = true;
    }

    if (A380PrimComputerFe_P.reset_Value_o) {
      A380PrimComputerFe_DWork.pY = A380PrimComputerFe_P.RateLimiterGenericVariableTs_InitialCondition;
    } else {
      if (A380PrimComputerFe_U.in.general_logic.flap_handle_index == 0.0F) {
        rtb_Switch = 1.23;
      } else if (A380PrimComputerFe_U.in.general_logic.flap_handle_index == 1.0F) {
        rtb_Switch = 1.18;
      } else if (A380PrimComputerFe_DWork.takeoff_config != -1.0) {
        rtb_Switch = 1.15;
      } else {
        rtb_Switch = 1.23;
      }

      A380PrimComputerFe_DWork.pY += std::fmax(std::fmin(rtb_Switch - A380PrimComputerFe_DWork.pY, std::abs
        (A380PrimComputerFe_P.RateLimiterGenericVariableTs_up) * A380PrimComputerFe_U.in.data.time.dt), -std::abs
        (A380PrimComputerFe_P.RateLimiterGenericVariableTs_lo) * A380PrimComputerFe_U.in.data.time.dt);
    }

    rtb_vs1g_o = A380PrimComputerFe_P.Gain_Gain_mi * A380PrimComputerFe_U.in.fctl_logic.speed_brake_command_deg;
    A380PrimComputerFe_RateLimiter(rtb_vs1g_o * look1_binlxpw(static_cast<real_T>
      (A380PrimComputerFe_U.in.general_logic.flap_handle_index), A380PrimComputerFe_P.VLSincreasemaxdeflection_bp01Data,
      A380PrimComputerFe_P.VLSincreasemaxdeflection_tableData, 5U),
      A380PrimComputerFe_P.RateLimiterGenericVariableTs2_up, A380PrimComputerFe_P.RateLimiterGenericVariableTs2_lo,
      A380PrimComputerFe_U.in.data.time.dt, A380PrimComputerFe_P.reset_Value_p, &rtb_vs1g_o,
      &A380PrimComputerFe_DWork.sf_RateLimiter_k);
    A380PrimComputerFe_Y.out.flight_envelope.v_ls_kn = std::fmax(A380PrimComputerFe_P.Vmcl_Value,
      A380PrimComputerFe_DWork.pY * A380PrimComputerFe_B.Y) + rtb_vs1g_o;
    A380PrimComputerFe_DWork.Delay_DSTATE = rtb_Gain;
  } else {
    A380PrimComputerFe_DWork.Runtime_MODE = false;
  }

  A380PrimComputerFe_Y.out.data.time.dt = A380PrimComputerFe_B.dt;
  A380PrimComputerFe_Y.out.data.time.simulation_time = A380PrimComputerFe_B.simulation_time;
  A380PrimComputerFe_Y.out.data.time.monotonic_time = A380PrimComputerFe_B.monotonic_time;
  A380PrimComputerFe_Y.out.data.sim_data.slew_on = A380PrimComputerFe_B.slew_on;
  A380PrimComputerFe_Y.out.data.sim_data.pause_on = A380PrimComputerFe_B.pause_on;
  A380PrimComputerFe_Y.out.data.sim_data.tracking_mode_on_override = A380PrimComputerFe_B.tracking_mode_on_override;
  A380PrimComputerFe_Y.out.data.sim_data.tailstrike_protection_on = A380PrimComputerFe_B.tailstrike_protection_on;
  A380PrimComputerFe_Y.out.data.sim_data.computer_running = A380PrimComputerFe_B.computer_running;
  A380PrimComputerFe_Y.out.data.discrete_inputs.alignment_dummy = A380PrimComputerFe_B.alignment_dummy_h;
  A380PrimComputerFe_Y.out.data.discrete_inputs.prim_overhead_button_pressed =
    A380PrimComputerFe_B.prim_overhead_button_pressed;
  A380PrimComputerFe_Y.out.data.discrete_inputs.is_unit_1 = A380PrimComputerFe_B.is_unit_1;
  A380PrimComputerFe_Y.out.data.discrete_inputs.is_unit_2 = A380PrimComputerFe_B.is_unit_2;
  A380PrimComputerFe_Y.out.data.discrete_inputs.is_unit_3 = A380PrimComputerFe_B.is_unit_3;
  A380PrimComputerFe_Y.out.data.discrete_inputs.capt_priority_takeover_pressed =
    A380PrimComputerFe_B.capt_priority_takeover_pressed;
  A380PrimComputerFe_Y.out.data.discrete_inputs.fo_priority_takeover_pressed =
    A380PrimComputerFe_B.fo_priority_takeover_pressed;
  A380PrimComputerFe_Y.out.data.discrete_inputs.ap_1_pushbutton_pressed = A380PrimComputerFe_B.ap_1_pushbutton_pressed;
  A380PrimComputerFe_Y.out.data.discrete_inputs.ap_2_pushbutton_pressed = A380PrimComputerFe_B.ap_2_pushbutton_pressed;
  A380PrimComputerFe_Y.out.data.discrete_inputs.fcu_healthy = A380PrimComputerFe_B.fcu_healthy;
  A380PrimComputerFe_Y.out.data.discrete_inputs.athr_pushbutton = A380PrimComputerFe_B.athr_pushbutton;
  A380PrimComputerFe_Y.out.data.discrete_inputs.ir_3_on_capt = A380PrimComputerFe_B.ir_3_on_capt;
  A380PrimComputerFe_Y.out.data.discrete_inputs.ir_3_on_fo = A380PrimComputerFe_B.ir_3_on_fo;
  A380PrimComputerFe_Y.out.data.discrete_inputs.adr_3_on_capt = A380PrimComputerFe_B.adr_3_on_capt;
  A380PrimComputerFe_Y.out.data.discrete_inputs.adr_3_on_fo = A380PrimComputerFe_B.adr_3_on_fo;
  A380PrimComputerFe_Y.out.data.discrete_inputs.rat_deployed = A380PrimComputerFe_B.rat_deployed;
  A380PrimComputerFe_Y.out.data.discrete_inputs.rat_contactor_closed = A380PrimComputerFe_B.rat_contactor_closed;
  A380PrimComputerFe_Y.out.data.discrete_inputs.pitch_trim_up_pressed = A380PrimComputerFe_B.pitch_trim_up_pressed;
  A380PrimComputerFe_Y.out.data.discrete_inputs.pitch_trim_down_pressed = A380PrimComputerFe_B.pitch_trim_down_pressed;
  A380PrimComputerFe_Y.out.data.discrete_inputs.green_low_pressure = A380PrimComputerFe_B.green_low_pressure;
  A380PrimComputerFe_Y.out.data.discrete_inputs.yellow_low_pressure = A380PrimComputerFe_B.yellow_low_pressure;
  A380PrimComputerFe_Y.out.data.analog_inputs.capt_pitch_stick_pos = A380PrimComputerFe_B.capt_pitch_stick_pos;
  A380PrimComputerFe_Y.out.data.analog_inputs.fo_pitch_stick_pos = A380PrimComputerFe_B.fo_pitch_stick_pos;
  A380PrimComputerFe_Y.out.data.analog_inputs.capt_roll_stick_pos = A380PrimComputerFe_B.capt_roll_stick_pos;
  A380PrimComputerFe_Y.out.data.analog_inputs.fo_roll_stick_pos = A380PrimComputerFe_B.fo_roll_stick_pos;
  A380PrimComputerFe_Y.out.data.analog_inputs.speed_brake_lever_pos = A380PrimComputerFe_B.speed_brake_lever_pos;
  A380PrimComputerFe_Y.out.data.analog_inputs.thr_lever_1_pos = A380PrimComputerFe_B.thr_lever_1_pos;
  A380PrimComputerFe_Y.out.data.analog_inputs.thr_lever_2_pos = A380PrimComputerFe_B.thr_lever_2_pos;
  A380PrimComputerFe_Y.out.data.analog_inputs.thr_lever_3_pos = A380PrimComputerFe_B.thr_lever_3_pos;
  A380PrimComputerFe_Y.out.data.analog_inputs.thr_lever_4_pos = A380PrimComputerFe_B.thr_lever_4_pos;
  A380PrimComputerFe_Y.out.data.analog_inputs.elevator_1_pos_deg = A380PrimComputerFe_B.elevator_1_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.elevator_2_pos_deg = A380PrimComputerFe_B.elevator_2_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.elevator_3_pos_deg = A380PrimComputerFe_B.elevator_3_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.ths_pos_deg = A380PrimComputerFe_B.ths_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.left_aileron_1_pos_deg = A380PrimComputerFe_B.left_aileron_1_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.left_aileron_2_pos_deg = A380PrimComputerFe_B.left_aileron_2_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.right_aileron_1_pos_deg = A380PrimComputerFe_B.right_aileron_1_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.right_aileron_2_pos_deg = A380PrimComputerFe_B.right_aileron_2_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.left_spoiler_pos_deg = A380PrimComputerFe_B.left_spoiler_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.right_spoiler_pos_deg = A380PrimComputerFe_B.right_spoiler_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.rudder_1_pos_deg = A380PrimComputerFe_B.rudder_1_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.rudder_2_pos_deg = A380PrimComputerFe_B.rudder_2_pos_deg;
  A380PrimComputerFe_Y.out.data.analog_inputs.rudder_pedal_pos = A380PrimComputerFe_B.rudder_pedal_pos;
  A380PrimComputerFe_Y.out.data.analog_inputs.yellow_hyd_pressure_psi = A380PrimComputerFe_B.yellow_hyd_pressure_psi;
  A380PrimComputerFe_Y.out.data.analog_inputs.green_hyd_pressure_psi = A380PrimComputerFe_B.green_hyd_pressure_psi;
  A380PrimComputerFe_Y.out.data.analog_inputs.vert_acc_1_g = A380PrimComputerFe_B.vert_acc_1_g;
  A380PrimComputerFe_Y.out.data.analog_inputs.vert_acc_2_g = A380PrimComputerFe_B.vert_acc_2_g;
  A380PrimComputerFe_Y.out.data.analog_inputs.vert_acc_3_g = A380PrimComputerFe_B.vert_acc_3_g;
  A380PrimComputerFe_Y.out.data.analog_inputs.lat_acc_1_g = A380PrimComputerFe_B.lat_acc_1_g;
  A380PrimComputerFe_Y.out.data.analog_inputs.lat_acc_2_g = A380PrimComputerFe_B.lat_acc_2_g;
  A380PrimComputerFe_Y.out.data.analog_inputs.lat_acc_3_g = A380PrimComputerFe_B.lat_acc_3_g;
  A380PrimComputerFe_Y.out.data.analog_inputs.left_body_wheel_speed = A380PrimComputerFe_B.left_body_wheel_speed;
  A380PrimComputerFe_Y.out.data.analog_inputs.left_wing_wheel_speed = A380PrimComputerFe_B.left_wing_wheel_speed;
  A380PrimComputerFe_Y.out.data.analog_inputs.right_body_wheel_speed = A380PrimComputerFe_B.right_body_wheel_speed;
  A380PrimComputerFe_Y.out.data.analog_inputs.right_wing_wheel_speed = A380PrimComputerFe_B.right_wing_wheel_speed;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM = A380PrimComputerFe_B.SSM_ds4;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data = A380PrimComputerFe_B.Data_e3r;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM = A380PrimComputerFe_B.SSM_n0;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data = A380PrimComputerFe_B.Data_oa;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.mach.SSM = A380PrimComputerFe_B.SSM_ow;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.mach.Data = A380PrimComputerFe_B.Data_ce;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM = A380PrimComputerFe_B.SSM_ay;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data = A380PrimComputerFe_B.Data_jz;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM = A380PrimComputerFe_B.SSM_bdi;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data = A380PrimComputerFe_B.Data_me;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM = A380PrimComputerFe_B.SSM_dd4;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data = A380PrimComputerFe_B.Data_nn1;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM = A380PrimComputerFe_B.SSM_gu;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data = A380PrimComputerFe_B.Data_ni3;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM =
    A380PrimComputerFe_B.SSM_ceq;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data =
    A380PrimComputerFe_B.Data_bun;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM = A380PrimComputerFe_B.SSM_dbe;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data = A380PrimComputerFe_B.Data_naq;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM = A380PrimComputerFe_B.SSM_b1;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data = A380PrimComputerFe_B.Data_j43;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.mach.SSM = A380PrimComputerFe_B.SSM_d0;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.mach.Data = A380PrimComputerFe_B.Data_po;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM = A380PrimComputerFe_B.SSM_m5;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data = A380PrimComputerFe_B.Data_ey;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM = A380PrimComputerFe_B.SSM_jli;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data = A380PrimComputerFe_B.Data_a3;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM = A380PrimComputerFe_B.SSM_mxc;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data = A380PrimComputerFe_B.Data_pey;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM = A380PrimComputerFe_B.SSM_ogm;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data = A380PrimComputerFe_B.Data_kf;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM =
    A380PrimComputerFe_B.SSM_nlt;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data =
    A380PrimComputerFe_B.Data_hk1;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM = A380PrimComputerFe_B.SSM_dz;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data = A380PrimComputerFe_B.Data_grt;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM = A380PrimComputerFe_B.SSM_oiy;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data = A380PrimComputerFe_B.Data_cmi;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.mach.SSM = A380PrimComputerFe_B.SSM;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.mach.Data = A380PrimComputerFe_B.Data;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM = A380PrimComputerFe_B.SSM_k;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data = A380PrimComputerFe_B.Data_f;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM = A380PrimComputerFe_B.SSM_kx;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data = A380PrimComputerFe_B.Data_fw;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM = A380PrimComputerFe_B.SSM_kxxtac0z;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data = A380PrimComputerFe_B.Data_fwxkftc3epgt;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM = A380PrimComputerFe_B.SSM_kb;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data = A380PrimComputerFe_B.Data_a;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM = A380PrimComputerFe_B.SSM_e;
  A380PrimComputerFe_Y.out.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data =
    A380PrimComputerFe_B.Data_eq;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.SSM = A380PrimComputerFe_B.SSM_as;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.Data = A380PrimComputerFe_B.Data_k0;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.SSM = A380PrimComputerFe_B.SSM_bp;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.Data = A380PrimComputerFe_B.Data_o5;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.SSM = A380PrimComputerFe_B.SSM_nd;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.Data = A380PrimComputerFe_B.Data_od;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM = A380PrimComputerFe_B.SSM_lbo;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.Data = A380PrimComputerFe_B.Data_lu;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM = A380PrimComputerFe_B.SSM_me;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data = A380PrimComputerFe_B.Data_am;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.SSM = A380PrimComputerFe_B.SSM_mj;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.Data = A380PrimComputerFe_B.Data_mo;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM = A380PrimComputerFe_B.SSM_a5;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.Data = A380PrimComputerFe_B.Data_dg;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM = A380PrimComputerFe_B.SSM_bt;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data = A380PrimComputerFe_B.Data_e1;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM = A380PrimComputerFe_B.SSM_om;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data = A380PrimComputerFe_B.Data_fp;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM = A380PrimComputerFe_B.SSM_ar;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data = A380PrimComputerFe_B.Data_ns;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM = A380PrimComputerFe_B.SSM_ce;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.Data = A380PrimComputerFe_B.Data_m3;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM = A380PrimComputerFe_B.SSM_ed;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data = A380PrimComputerFe_B.Data_oj;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM = A380PrimComputerFe_B.SSM_jh;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data = A380PrimComputerFe_B.Data_jy;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM = A380PrimComputerFe_B.SSM_je;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data = A380PrimComputerFe_B.Data_j1;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM = A380PrimComputerFe_B.SSM_jt;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.Data = A380PrimComputerFe_B.Data_fc;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_cui;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data = A380PrimComputerFe_B.Data_of;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_mq;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data = A380PrimComputerFe_B.Data_lg;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_ni;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data = A380PrimComputerFe_B.Data_n4;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM = A380PrimComputerFe_B.SSM_df;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.Data = A380PrimComputerFe_B.Data_ot;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM = A380PrimComputerFe_B.SSM_oe;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data = A380PrimComputerFe_B.Data_gv;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM = A380PrimComputerFe_B.SSM_ha;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data = A380PrimComputerFe_B.Data_ou;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_op;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data = A380PrimComputerFe_B.Data_dh;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_a50;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data = A380PrimComputerFe_B.Data_ph;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_og;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data = A380PrimComputerFe_B.Data_gs;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM = A380PrimComputerFe_B.SSM_a4;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data = A380PrimComputerFe_B.Data_fd4;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM = A380PrimComputerFe_B.SSM_bv;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data = A380PrimComputerFe_B.Data_hm;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM = A380PrimComputerFe_B.SSM_bo;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data = A380PrimComputerFe_B.Data_i2;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM = A380PrimComputerFe_B.SSM_d1;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.Data = A380PrimComputerFe_B.Data_og;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputerFe_B.SSM_hy;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputerFe_B.Data_fv;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM = A380PrimComputerFe_B.SSM_gi;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data = A380PrimComputerFe_B.Data_oc;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM = A380PrimComputerFe_B.SSM_pp;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data = A380PrimComputerFe_B.Data_kq;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.SSM = A380PrimComputerFe_B.SSM_iab;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.Data = A380PrimComputerFe_B.Data_ne;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.SSM = A380PrimComputerFe_B.SSM_jtv;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.Data = A380PrimComputerFe_B.Data_it;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.SSM = A380PrimComputerFe_B.SSM_fy;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.Data = A380PrimComputerFe_B.Data_ch;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM = A380PrimComputerFe_B.SSM_d4;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.Data = A380PrimComputerFe_B.Data_bb;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM = A380PrimComputerFe_B.SSM_ars;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data = A380PrimComputerFe_B.Data_ol;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.SSM = A380PrimComputerFe_B.SSM_din;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.Data = A380PrimComputerFe_B.Data_hw;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM = A380PrimComputerFe_B.SSM_m3;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.Data = A380PrimComputerFe_B.Data_hs;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM = A380PrimComputerFe_B.SSM_np;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data = A380PrimComputerFe_B.Data_fj;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM = A380PrimComputerFe_B.SSM_ax;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data = A380PrimComputerFe_B.Data_ky;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM = A380PrimComputerFe_B.SSM_cl;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data = A380PrimComputerFe_B.Data_h5;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM = A380PrimComputerFe_B.SSM_es;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.Data = A380PrimComputerFe_B.Data_ku;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM = A380PrimComputerFe_B.SSM_gi1;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data = A380PrimComputerFe_B.Data_jp;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM = A380PrimComputerFe_B.SSM_jz;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data = A380PrimComputerFe_B.Data_nu;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM = A380PrimComputerFe_B.SSM_kt;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data = A380PrimComputerFe_B.Data_br;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM = A380PrimComputerFe_B.SSM_ds;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.Data = A380PrimComputerFe_B.Data_ae;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_eg;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data = A380PrimComputerFe_B.Data_pe;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_a0;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data = A380PrimComputerFe_B.Data_fy;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_cv;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data = A380PrimComputerFe_B.Data_na;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM = A380PrimComputerFe_B.SSM_ea;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.Data = A380PrimComputerFe_B.Data_my;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM = A380PrimComputerFe_B.SSM_p4;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data = A380PrimComputerFe_B.Data_i4;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM = A380PrimComputerFe_B.SSM_m2;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data = A380PrimComputerFe_B.Data_cx;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_bt0;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data = A380PrimComputerFe_B.Data_nz;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_nr;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data = A380PrimComputerFe_B.Data_id;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_fr;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data = A380PrimComputerFe_B.Data_o2;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM = A380PrimComputerFe_B.SSM_cc;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data = A380PrimComputerFe_B.Data_gqq;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM = A380PrimComputerFe_B.SSM_lm;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data = A380PrimComputerFe_B.Data_md;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM = A380PrimComputerFe_B.SSM_mkm;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data = A380PrimComputerFe_B.Data_cz;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM = A380PrimComputerFe_B.SSM_jhd;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.Data = A380PrimComputerFe_B.Data_pm;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputerFe_B.SSM_av;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputerFe_B.Data_bj;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM = A380PrimComputerFe_B.SSM_ira;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data = A380PrimComputerFe_B.Data_ox;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM = A380PrimComputerFe_B.SSM_ge;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data = A380PrimComputerFe_B.Data_pe5;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.SSM = A380PrimComputerFe_B.SSM_lv;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.Data = A380PrimComputerFe_B.Data_jj;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.SSM = A380PrimComputerFe_B.SSM_cg;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.Data = A380PrimComputerFe_B.Data_p5;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.SSM = A380PrimComputerFe_B.SSM_be;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.Data = A380PrimComputerFe_B.Data_ekl;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM = A380PrimComputerFe_B.SSM_axb;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.Data = A380PrimComputerFe_B.Data_nd;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM = A380PrimComputerFe_B.SSM_nz;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data = A380PrimComputerFe_B.Data_n2;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.SSM = A380PrimComputerFe_B.SSM_cx;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.Data = A380PrimComputerFe_B.Data_dl;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM = A380PrimComputerFe_B.SSM_gh;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.Data = A380PrimComputerFe_B.Data_gs2;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM = A380PrimComputerFe_B.SSM_ks;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data = A380PrimComputerFe_B.Data_h4;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM = A380PrimComputerFe_B.SSM_pw;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data = A380PrimComputerFe_B.Data_e3;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM = A380PrimComputerFe_B.SSM_fh;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data = A380PrimComputerFe_B.Data_f5h;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM = A380PrimComputerFe_B.SSM_gzn;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.Data = A380PrimComputerFe_B.Data_an;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM = A380PrimComputerFe_B.SSM_oo;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data = A380PrimComputerFe_B.Data_i4o;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM = A380PrimComputerFe_B.SSM_evh;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data = A380PrimComputerFe_B.Data_af;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM = A380PrimComputerFe_B.SSM_cn;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data = A380PrimComputerFe_B.Data_bm;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM = A380PrimComputerFe_B.SSM_co;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.Data = A380PrimComputerFe_B.Data_dk;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_pe;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data = A380PrimComputerFe_B.Data_nv;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_cgz;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data = A380PrimComputerFe_B.Data_jpf;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_fw;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data = A380PrimComputerFe_B.Data_i5;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM = A380PrimComputerFe_B.SSM_h4;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.Data = A380PrimComputerFe_B.Data_k2;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM = A380PrimComputerFe_B.SSM_cb3;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data = A380PrimComputerFe_B.Data_as;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM = A380PrimComputerFe_B.SSM_pj;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data = A380PrimComputerFe_B.Data_gk;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_dv;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data = A380PrimComputerFe_B.Data_jl;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_i4;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data = A380PrimComputerFe_B.Data_e32;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM = A380PrimComputerFe_B.SSM_fm;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data = A380PrimComputerFe_B.Data_ih;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM = A380PrimComputerFe_B.SSM_e5;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data = A380PrimComputerFe_B.Data_du;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM = A380PrimComputerFe_B.SSM_bf;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data = A380PrimComputerFe_B.Data_nx;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM = A380PrimComputerFe_B.SSM_fd;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data = A380PrimComputerFe_B.Data_n0;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM = A380PrimComputerFe_B.SSM_fv;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.Data = A380PrimComputerFe_B.Data_eqi;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputerFe_B.SSM_dt;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputerFe_B.Data_om;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM = A380PrimComputerFe_B.SSM_j5;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data = A380PrimComputerFe_B.Data_nr;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM = A380PrimComputerFe_B.SSM_ng;
  A380PrimComputerFe_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data = A380PrimComputerFe_B.Data_p3;
  A380PrimComputerFe_Y.out.data.bus_inputs.ra_1_bus.radio_height_ft.SSM = A380PrimComputerFe_B.SSM_cs;
  A380PrimComputerFe_Y.out.data.bus_inputs.ra_1_bus.radio_height_ft.Data = A380PrimComputerFe_B.Data_nb;
  A380PrimComputerFe_Y.out.data.bus_inputs.ra_2_bus.radio_height_ft.SSM = A380PrimComputerFe_B.SSM_ls;
  A380PrimComputerFe_Y.out.data.bus_inputs.ra_2_bus.radio_height_ft.Data = A380PrimComputerFe_B.Data_hd;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM = A380PrimComputerFe_B.SSM_dg;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data =
    A380PrimComputerFe_B.Data_al;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM = A380PrimComputerFe_B.SSM_d3;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data = A380PrimComputerFe_B.Data_gu;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM = A380PrimComputerFe_B.SSM_p2;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data = A380PrimComputerFe_B.Data_ix;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM = A380PrimComputerFe_B.SSM_bo0;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data = A380PrimComputerFe_B.Data_do;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM = A380PrimComputerFe_B.SSM_bc;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data = A380PrimComputerFe_B.Data_hu;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM = A380PrimComputerFe_B.SSM_h0;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data =
    A380PrimComputerFe_B.Data_pm1;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM = A380PrimComputerFe_B.SSM_giz;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data = A380PrimComputerFe_B.Data_i2y;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM = A380PrimComputerFe_B.SSM_mqp;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data = A380PrimComputerFe_B.Data_pg;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM = A380PrimComputerFe_B.SSM_ba;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data = A380PrimComputerFe_B.Data_ni;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM = A380PrimComputerFe_B.SSM_in;
  A380PrimComputerFe_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data = A380PrimComputerFe_B.Data_fr;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM = A380PrimComputerFe_B.SSM_ff;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_1.Data = A380PrimComputerFe_B.Data_cn;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_2.SSM = A380PrimComputerFe_B.SSM_ic;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_2.Data = A380PrimComputerFe_B.Data_nxl;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_3.SSM = A380PrimComputerFe_B.SSM_fs;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_3.Data = A380PrimComputerFe_B.Data_jh;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_4.SSM = A380PrimComputerFe_B.SSM_ja;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_4.Data = A380PrimComputerFe_B.Data_gl;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM = A380PrimComputerFe_B.SSM_js;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_1.Data = A380PrimComputerFe_B.Data_gn;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_2.SSM = A380PrimComputerFe_B.SSM_is3;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_2.Data = A380PrimComputerFe_B.Data_myb;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_3.SSM = A380PrimComputerFe_B.SSM_ag;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_3.Data = A380PrimComputerFe_B.Data_l2;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_4.SSM = A380PrimComputerFe_B.SSM_f5;
  A380PrimComputerFe_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_4.Data = A380PrimComputerFe_B.Data_o5o;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_ph;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_l5;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_jw;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_dc2;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_jy;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_gr;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_j1;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_gp;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_ov;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_i3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_mx;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_et;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.SSM = A380PrimComputerFe_B.SSM_b4;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.Data =
    A380PrimComputerFe_B.Data_mc;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.SSM = A380PrimComputerFe_B.SSM_gb;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.Data =
    A380PrimComputerFe_B.Data_k3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.SSM = A380PrimComputerFe_B.SSM_oh;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.Data =
    A380PrimComputerFe_B.Data_f2;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.SSM =
    A380PrimComputerFe_B.SSM_mm5;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.Data =
    A380PrimComputerFe_B.Data_gh;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.SSM = A380PrimComputerFe_B.SSM_br;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.Data =
    A380PrimComputerFe_B.Data_ed;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.SSM = A380PrimComputerFe_B.SSM_c2;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.Data =
    A380PrimComputerFe_B.Data_o2j;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.SSM = A380PrimComputerFe_B.SSM_hc;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.Data =
    A380PrimComputerFe_B.Data_i43;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.SSM =
    A380PrimComputerFe_B.SSM_ktr;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.Data =
    A380PrimComputerFe_B.Data_ic;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.SSM = A380PrimComputerFe_B.SSM_gl;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.Data =
    A380PrimComputerFe_B.Data_ak;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.SSM = A380PrimComputerFe_B.SSM_my;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.Data =
    A380PrimComputerFe_B.Data_jg;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.SSM = A380PrimComputerFe_B.SSM_j3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.Data =
    A380PrimComputerFe_B.Data_cu;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.SSM = A380PrimComputerFe_B.SSM_go;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.Data =
    A380PrimComputerFe_B.Data_ep;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.SSM = A380PrimComputerFe_B.SSM_e5c;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.Data =
    A380PrimComputerFe_B.Data_d3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.SSM = A380PrimComputerFe_B.SSM_dk;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.Data =
    A380PrimComputerFe_B.Data_bt;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.SSM = A380PrimComputerFe_B.SSM_evc;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.Data =
    A380PrimComputerFe_B.Data_e0;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.SSM = A380PrimComputerFe_B.SSM_kk;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.Data =
    A380PrimComputerFe_B.Data_jl3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.SSM =
    A380PrimComputerFe_B.SSM_af;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.Data =
    A380PrimComputerFe_B.Data_nm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.SSM =
    A380PrimComputerFe_B.SSM_npr;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.Data =
    A380PrimComputerFe_B.Data_ia;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.SSM =
    A380PrimComputerFe_B.SSM_ew;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.Data =
    A380PrimComputerFe_B.Data_j0;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.SSM =
    A380PrimComputerFe_B.SSM_lt;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.Data =
    A380PrimComputerFe_B.Data_bs;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.SSM = A380PrimComputerFe_B.SSM_ger;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.Data = A380PrimComputerFe_B.Data_hp;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.SSM = A380PrimComputerFe_B.SSM_pxo;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.Data = A380PrimComputerFe_B.Data_ct;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.SSM = A380PrimComputerFe_B.SSM_co2;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.Data = A380PrimComputerFe_B.Data_pc;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFe_B.SSM_ny;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFe_B.Data_nzt;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFe_B.SSM_l4;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFe_B.Data_c0;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.SSM =
    A380PrimComputerFe_B.SSM_nm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFe_B.Data_ojg;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.SSM =
    A380PrimComputerFe_B.SSM_nh;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFe_B.Data_lm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.SSM = A380PrimComputerFe_B.SSM_dl;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.Data = A380PrimComputerFe_B.Data_fz;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.SSM = A380PrimComputerFe_B.SSM_dx;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.Data = A380PrimComputerFe_B.Data_oz;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.SSM =
    A380PrimComputerFe_B.SSM_a5h;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.Data =
    A380PrimComputerFe_B.Data_gf;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.SSM = A380PrimComputerFe_B.SSM_fl;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.Data =
    A380PrimComputerFe_B.Data_nn;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.SSM =
    A380PrimComputerFe_B.SSM_p3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.Data =
    A380PrimComputerFe_B.Data_a0z;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.SSM =
    A380PrimComputerFe_B.SSM_ns;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.Data =
    A380PrimComputerFe_B.Data_fk;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.SSM = A380PrimComputerFe_B.SSM_bm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.Data = A380PrimComputerFe_B.Data_bu;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.SSM = A380PrimComputerFe_B.SSM_nl;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.Data =
    A380PrimComputerFe_B.Data_o23;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.SSM = A380PrimComputerFe_B.SSM_grm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.Data =
    A380PrimComputerFe_B.Data_g3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.SSM = A380PrimComputerFe_B.SSM_gzm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.Data = A380PrimComputerFe_B.Data_icc;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.SSM = A380PrimComputerFe_B.SSM_oi;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.Data = A380PrimComputerFe_B.Data_pwf;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.SSM = A380PrimComputerFe_B.SSM_aa;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.Data = A380PrimComputerFe_B.Data_gvk;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.SSM = A380PrimComputerFe_B.SSM_fvk;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.Data = A380PrimComputerFe_B.Data_ln;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.SSM = A380PrimComputerFe_B.SSM_lw;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.Data = A380PrimComputerFe_B.Data_ka;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.SSM = A380PrimComputerFe_B.SSM_fa;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.Data = A380PrimComputerFe_B.Data_mp;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.SSM = A380PrimComputerFe_B.SSM_lbx;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.Data = A380PrimComputerFe_B.Data_m4;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.SSM = A380PrimComputerFe_B.SSM_n3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.Data = A380PrimComputerFe_B.Data_fki;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.SSM = A380PrimComputerFe_B.SSM_a1;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.Data = A380PrimComputerFe_B.Data_bv;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.SSM = A380PrimComputerFe_B.SSM_p1;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.Data = A380PrimComputerFe_B.Data_m21;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.SSM = A380PrimComputerFe_B.SSM_cn2;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.Data = A380PrimComputerFe_B.Data_nbg;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.SSM = A380PrimComputerFe_B.SSM_an3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.Data = A380PrimComputerFe_B.Data_l25;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.fe_status_word.SSM = A380PrimComputerFe_B.SSM_c3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.fe_status_word.Data = A380PrimComputerFe_B.Data_ki;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.fg_status_word.SSM = A380PrimComputerFe_B.SSM_dp;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.fg_status_word.Data = A380PrimComputerFe_B.Data_p5p;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.SSM = A380PrimComputerFe_B.SSM_boy;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.Data = A380PrimComputerFe_B.Data_nry;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.SSM = A380PrimComputerFe_B.SSM_lg;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.Data = A380PrimComputerFe_B.Data_mh;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.SSM = A380PrimComputerFe_B.SSM_cm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.Data = A380PrimComputerFe_B.Data_ll;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.SSM = A380PrimComputerFe_B.SSM_hl;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.Data = A380PrimComputerFe_B.Data_hy;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.SSM = A380PrimComputerFe_B.SSM_irh;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.Data = A380PrimComputerFe_B.Data_j04;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.SSM = A380PrimComputerFe_B.SSM_b42;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.Data = A380PrimComputerFe_B.Data_pf;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_ls_kn.SSM = A380PrimComputerFe_B.SSM_anz;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_ls_kn.Data = A380PrimComputerFe_B.Data_pl;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_stall_kn.SSM = A380PrimComputerFe_B.SSM_d2;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_stall_kn.Data = A380PrimComputerFe_B.Data_gb;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.SSM = A380PrimComputerFe_B.SSM_gov;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.Data = A380PrimComputerFe_B.Data_hq;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_3_kn.SSM = A380PrimComputerFe_B.SSM_nb;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_3_kn.Data = A380PrimComputerFe_B.Data_ai;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_4_kn.SSM = A380PrimComputerFe_B.SSM_pe3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_4_kn.Data = A380PrimComputerFe_B.Data_gfr;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_man_kn.SSM = A380PrimComputerFe_B.SSM_jj;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_man_kn.Data = A380PrimComputerFe_B.Data_czp;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_max_kn.SSM = A380PrimComputerFe_B.SSM_jx;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_max_kn.Data = A380PrimComputerFe_B.Data_fm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.SSM = A380PrimComputerFe_B.SSM_npl;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.Data = A380PrimComputerFe_B.Data_jsg;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.discrete_word_1.SSM = A380PrimComputerFe_B.SSM_gf;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_x_bus.fe.discrete_word_1.Data = A380PrimComputerFe_B.Data_g1;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_gbi;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_j4;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_fhm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_jyh;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_ltj;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_e4;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_hn;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_ghs;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_h3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_bmk;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.SSM =
    A380PrimComputerFe_B.SSM_bfs;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.Data =
    A380PrimComputerFe_B.Data_lzt;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.SSM = A380PrimComputerFe_B.SSM_p0;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.Data =
    A380PrimComputerFe_B.Data_kn;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.SSM = A380PrimComputerFe_B.SSM_fu;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.Data =
    A380PrimComputerFe_B.Data_nab;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.SSM = A380PrimComputerFe_B.SSM_hr;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.Data =
    A380PrimComputerFe_B.Data_lgf;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.SSM = A380PrimComputerFe_B.SSM_bi;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.Data =
    A380PrimComputerFe_B.Data_fpq;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.SSM = A380PrimComputerFe_B.SSM_bd;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.Data =
    A380PrimComputerFe_B.Data_dt;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.SSM =
    A380PrimComputerFe_B.SSM_omt;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.Data =
    A380PrimComputerFe_B.Data_b1;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.SSM = A380PrimComputerFe_B.SSM_la;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.Data =
    A380PrimComputerFe_B.Data_nmr;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.SSM = A380PrimComputerFe_B.SSM_l1;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.Data =
    A380PrimComputerFe_B.Data_ea;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.SSM = A380PrimComputerFe_B.SSM_dy;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.Data =
    A380PrimComputerFe_B.Data_nib;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.SSM = A380PrimComputerFe_B.SSM_ie;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.Data =
    A380PrimComputerFe_B.Data_i2t;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.SSM = A380PrimComputerFe_B.SSM_kf;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.Data =
    A380PrimComputerFe_B.Data_ng;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.SSM =
    A380PrimComputerFe_B.SSM_p5l;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.Data =
    A380PrimComputerFe_B.Data_h31;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.SSM = A380PrimComputerFe_B.SSM_g3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.Data =
    A380PrimComputerFe_B.Data_ew;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.SSM = A380PrimComputerFe_B.SSM_b3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.Data =
    A380PrimComputerFe_B.Data_j1s;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.SSM = A380PrimComputerFe_B.SSM_dxv;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.Data =
    A380PrimComputerFe_B.Data_j5;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.SSM =
    A380PrimComputerFe_B.SSM_mxz;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.Data =
    A380PrimComputerFe_B.Data_cw;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.SSM =
    A380PrimComputerFe_B.SSM_kk4;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.Data =
    A380PrimComputerFe_B.Data_gqa;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.SSM =
    A380PrimComputerFe_B.SSM_cy;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.Data =
    A380PrimComputerFe_B.Data_hz;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.SSM =
    A380PrimComputerFe_B.SSM_ju;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.Data =
    A380PrimComputerFe_B.Data_fri;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.SSM =
    A380PrimComputerFe_B.SSM_ey;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.Data =
    A380PrimComputerFe_B.Data_cm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.SSM = A380PrimComputerFe_B.SSM_jr;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.Data = A380PrimComputerFe_B.Data_czj;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.SSM = A380PrimComputerFe_B.SSM_hs;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.Data = A380PrimComputerFe_B.Data_mb;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.SSM = A380PrimComputerFe_B.SSM_mx3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.Data = A380PrimComputerFe_B.Data_gk4;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFe_B.SSM_er;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFe_B.Data_gbt;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFe_B.SSM_hm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFe_B.Data_p0;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.SSM =
    A380PrimComputerFe_B.SSM_dm;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFe_B.Data_dn;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.SSM =
    A380PrimComputerFe_B.SSM_fk;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFe_B.Data_iyw;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.SSM = A380PrimComputerFe_B.SSM_lm1;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.Data =
    A380PrimComputerFe_B.Data_p5d;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.SSM = A380PrimComputerFe_B.SSM_nc;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.Data = A380PrimComputerFe_B.Data_oo;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.SSM = A380PrimComputerFe_B.SSM_e4;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.Data =
    A380PrimComputerFe_B.Data_ho;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.SSM = A380PrimComputerFe_B.SSM_bw;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.Data =
    A380PrimComputerFe_B.Data_kqr;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.SSM =
    A380PrimComputerFe_B.SSM_na;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.Data =
    A380PrimComputerFe_B.Data_omv;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.SSM =
    A380PrimComputerFe_B.SSM_lf;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.Data =
    A380PrimComputerFe_B.Data_mby;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.SSM = A380PrimComputerFe_B.SSM_oz;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.Data = A380PrimComputerFe_B.Data_hk;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.SSM = A380PrimComputerFe_B.SSM_mub;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.Data = A380PrimComputerFe_B.Data_hg;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.SSM = A380PrimComputerFe_B.SSM_li;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.Data =
    A380PrimComputerFe_B.Data_bi;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.SSM = A380PrimComputerFe_B.SSM_hcd;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.Data = A380PrimComputerFe_B.Data_i4u;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.SSM = A380PrimComputerFe_B.SSM_php;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.Data = A380PrimComputerFe_B.Data_ik;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.SSM = A380PrimComputerFe_B.SSM_ma;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.Data = A380PrimComputerFe_B.Data_dq;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.SSM = A380PrimComputerFe_B.SSM_jut;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.Data = A380PrimComputerFe_B.Data_pv;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.SSM = A380PrimComputerFe_B.SSM_kh;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.Data = A380PrimComputerFe_B.Data_p1d;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.SSM = A380PrimComputerFe_B.SSM_h2;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.Data = A380PrimComputerFe_B.Data_lyv;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.SSM = A380PrimComputerFe_B.SSM_ago;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.Data = A380PrimComputerFe_B.Data_ke;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.SSM = A380PrimComputerFe_B.SSM_ep;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.Data = A380PrimComputerFe_B.Data_cv;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.SSM = A380PrimComputerFe_B.SSM_kc;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.Data = A380PrimComputerFe_B.Data_pfh;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.SSM = A380PrimComputerFe_B.SSM_cnf;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.Data = A380PrimComputerFe_B.Data_jy4;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.SSM = A380PrimComputerFe_B.SSM_lwa;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.Data = A380PrimComputerFe_B.Data_o1;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.SSM = A380PrimComputerFe_B.SSM_aq;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.Data = A380PrimComputerFe_B.Data_ga;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.fe_status_word.SSM = A380PrimComputerFe_B.SSM_ja2;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.fe_status_word.Data = A380PrimComputerFe_B.Data_kd;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.fg_status_word.SSM = A380PrimComputerFe_B.SSM_in3;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.fg_status_word.Data = A380PrimComputerFe_B.Data_fx;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.SSM = A380PrimComputerFe_B.SSM_ap;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.Data = A380PrimComputerFe_B.Data_nml;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.SSM = A380PrimComputerFe_B.SSM_mg;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.Data = A380PrimComputerFe_B.Data_fa;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.SSM = A380PrimComputerFe_B.SSM_mw;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.Data = A380PrimComputerFe_B.Data_nh;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.SSM = A380PrimComputerFe_B.SSM_bu;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.Data = A380PrimComputerFe_B.Data_or;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.SSM = A380PrimComputerFe_B.SSM_cbb;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.Data = A380PrimComputerFe_B.Data_otn;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.SSM = A380PrimComputerFe_B.SSM_iao;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.Data = A380PrimComputerFe_B.Data_cam;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_ls_kn.SSM = A380PrimComputerFe_B.SSM_ip;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_ls_kn.Data = A380PrimComputerFe_B.Data_gsl;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_stall_kn.SSM = A380PrimComputerFe_B.SSM_f4;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_stall_kn.Data = A380PrimComputerFe_B.Data_amp;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.SSM = A380PrimComputerFe_B.SSM_id;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.Data = A380PrimComputerFe_B.Data_mv;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_3_kn.SSM = A380PrimComputerFe_B.SSM_mqr;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_3_kn.Data = A380PrimComputerFe_B.Data_gx;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_4_kn.SSM = A380PrimComputerFe_B.SSM_cm2;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_4_kn.Data = A380PrimComputerFe_B.Data_lb;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_man_kn.SSM = A380PrimComputerFe_B.SSM_ck;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_man_kn.Data = A380PrimComputerFe_B.Data_can;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_max_kn.SSM = A380PrimComputerFe_B.SSM_pl;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_max_kn.Data = A380PrimComputerFe_B.Data_gae;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.SSM = A380PrimComputerFe_B.SSM_d50;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.Data = A380PrimComputerFe_B.Data_h1;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.discrete_word_1.SSM = A380PrimComputerFe_B.SSM_gs;
  A380PrimComputerFe_Y.out.data.bus_inputs.prim_y_bus.fe.discrete_word_1.Data = A380PrimComputerFe_B.Data_bc;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.SSM = A380PrimComputerFe_B.SSM_kse;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFe_B.Data_fof;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFe_B.SSM_icj;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFe_B.Data_nj;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.SSM = A380PrimComputerFe_B.SSM_gbf;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.Data = A380PrimComputerFe_B.Data_i0;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.SSM = A380PrimComputerFe_B.SSM_opv;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFe_B.Data_lr;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.SSM = A380PrimComputerFe_B.SSM_gha;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.Data = A380PrimComputerFe_B.Data_k0s;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.aileron_status_word.SSM = A380PrimComputerFe_B.SSM_ple;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.aileron_status_word.Data = A380PrimComputerFe_B.Data_m4b;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.SSM = A380PrimComputerFe_B.SSM_h0n;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.Data = A380PrimComputerFe_B.Data_au;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.SSM = A380PrimComputerFe_B.SSM_c1;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.Data = A380PrimComputerFe_B.Data_czc;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.SSM = A380PrimComputerFe_B.SSM_dd;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.Data = A380PrimComputerFe_B.Data_itz;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.SSM = A380PrimComputerFe_B.SSM_ai;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.Data = A380PrimComputerFe_B.Data_nsk;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.spoiler_status_word.SSM = A380PrimComputerFe_B.SSM_at;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.spoiler_status_word.Data = A380PrimComputerFe_B.Data_is;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.SSM = A380PrimComputerFe_B.SSM_bz;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data = A380PrimComputerFe_B.Data_pk;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.SSM = A380PrimComputerFe_B.SSM_haz;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data = A380PrimComputerFe_B.Data_f52;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.SSM = A380PrimComputerFe_B.SSM_hz;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.Data = A380PrimComputerFe_B.Data_dg0;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.SSM = A380PrimComputerFe_B.SSM_hk;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.Data = A380PrimComputerFe_B.Data_nru;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.elevator_status_word.SSM = A380PrimComputerFe_B.SSM_cvn;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.elevator_status_word.Data = A380PrimComputerFe_B.Data_d5;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.elevator_1_position_deg.SSM = A380PrimComputerFe_B.SSM_iy;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.elevator_1_position_deg.Data = A380PrimComputerFe_B.Data_bp;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.elevator_2_position_deg.SSM = A380PrimComputerFe_B.SSM_jwz;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.elevator_2_position_deg.Data = A380PrimComputerFe_B.Data_cl;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.elevator_3_position_deg.SSM = A380PrimComputerFe_B.SSM_o2;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.elevator_3_position_deg.Data = A380PrimComputerFe_B.Data_er;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.ths_position_deg.SSM = A380PrimComputerFe_B.SSM_eig;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.ths_position_deg.Data = A380PrimComputerFe_B.Data_in;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.rudder_status_word.SSM = A380PrimComputerFe_B.SSM_jl;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.rudder_status_word.Data = A380PrimComputerFe_B.Data_btl;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.rudder_1_position_deg.SSM = A380PrimComputerFe_B.SSM_cci;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.rudder_1_position_deg.Data = A380PrimComputerFe_B.Data_a5;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.rudder_2_position_deg.SSM = A380PrimComputerFe_B.SSM_bcj;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.rudder_2_position_deg.Data = A380PrimComputerFe_B.Data_hyo;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.SSM = A380PrimComputerFe_B.SSM_i5;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.Data = A380PrimComputerFe_B.Data_bjx;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.fctl_law_status_word.SSM = A380PrimComputerFe_B.SSM_jww;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.fctl_law_status_word.Data = A380PrimComputerFe_B.Data_ci;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.misc_data_status_word.SSM = A380PrimComputerFe_B.SSM_kkj;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_1_bus.misc_data_status_word.Data = A380PrimComputerFe_B.Data_h2;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.SSM = A380PrimComputerFe_B.SSM_ndh;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFe_B.Data_dx;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.SSM = A380PrimComputerFe_B.SSM_k1;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFe_B.Data_fvi;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.SSM = A380PrimComputerFe_B.SSM_en3;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFe_B.Data_gnm;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.SSM = A380PrimComputerFe_B.SSM_kl;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFe_B.Data_e3y;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.SSM = A380PrimComputerFe_B.SSM_po;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.Data = A380PrimComputerFe_B.Data_ld;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.aileron_status_word.SSM = A380PrimComputerFe_B.SSM_ie0;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.aileron_status_word.Data = A380PrimComputerFe_B.Data_k3v;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.SSM = A380PrimComputerFe_B.SSM_gsb;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.Data = A380PrimComputerFe_B.Data_oi;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.SSM = A380PrimComputerFe_B.SSM_mxy;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.Data = A380PrimComputerFe_B.Data_oy;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.SSM = A380PrimComputerFe_B.SSM_gt;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.Data = A380PrimComputerFe_B.Data_nl;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.SSM = A380PrimComputerFe_B.SSM_cum;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.Data = A380PrimComputerFe_B.Data_aei;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.spoiler_status_word.SSM = A380PrimComputerFe_B.SSM_ka;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.spoiler_status_word.Data = A380PrimComputerFe_B.Data_pwfb;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.SSM = A380PrimComputerFe_B.SSM_lu;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data = A380PrimComputerFe_B.Data_la;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.SSM = A380PrimComputerFe_B.SSM_c5;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data = A380PrimComputerFe_B.Data_b0;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.SSM = A380PrimComputerFe_B.SSM_ol;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data = A380PrimComputerFe_B.Data_g5;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.SSM = A380PrimComputerFe_B.SSM_k2;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data = A380PrimComputerFe_B.Data_os;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.elevator_status_word.SSM = A380PrimComputerFe_B.SSM_gn;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.elevator_status_word.Data = A380PrimComputerFe_B.Data_btc;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.elevator_1_position_deg.SSM = A380PrimComputerFe_B.SSM_lil;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.elevator_1_position_deg.Data = A380PrimComputerFe_B.Data_nhn;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.elevator_2_position_deg.SSM = A380PrimComputerFe_B.SSM_lmv;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.elevator_2_position_deg.Data = A380PrimComputerFe_B.Data_im;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.elevator_3_position_deg.SSM = A380PrimComputerFe_B.SSM_ig;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.elevator_3_position_deg.Data = A380PrimComputerFe_B.Data_no;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.ths_position_deg.SSM = A380PrimComputerFe_B.SSM_ch;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.ths_position_deg.Data = A380PrimComputerFe_B.Data_av;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.rudder_status_word.SSM = A380PrimComputerFe_B.SSM_ef;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.rudder_status_word.Data = A380PrimComputerFe_B.Data_hc;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.rudder_1_position_deg.SSM = A380PrimComputerFe_B.SSM_dbs;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.rudder_1_position_deg.Data = A380PrimComputerFe_B.Data_f5c;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.rudder_2_position_deg.SSM = A380PrimComputerFe_B.SSM_ilr;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.rudder_2_position_deg.Data = A380PrimComputerFe_B.Data_iu;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.SSM = A380PrimComputerFe_B.SSM_ch3;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.Data = A380PrimComputerFe_B.Data_ihf;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.fctl_law_status_word.SSM = A380PrimComputerFe_B.SSM_ozd;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.fctl_law_status_word.Data = A380PrimComputerFe_B.Data_ao;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.misc_data_status_word.SSM = A380PrimComputerFe_B.SSM_ob;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_2_bus.misc_data_status_word.Data = A380PrimComputerFe_B.Data_c2;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.SSM = A380PrimComputerFe_B.SSM_ps;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFe_B.Data_f1;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFe_B.SSM_agc;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFe_B.Data_nst;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.SSM = A380PrimComputerFe_B.SSM_nt;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.Data = A380PrimComputerFe_B.Data_fq;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.SSM = A380PrimComputerFe_B.SSM_oa;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFe_B.Data_amc;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.SSM = A380PrimComputerFe_B.SSM_oj;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.Data = A380PrimComputerFe_B.Data_b0d;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.aileron_status_word.SSM = A380PrimComputerFe_B.SSM_lq;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.aileron_status_word.Data = A380PrimComputerFe_B.Data_bri;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.SSM = A380PrimComputerFe_B.SSM_fc;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.Data = A380PrimComputerFe_B.Data_nmx;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.SSM = A380PrimComputerFe_B.SSM_do;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.Data = A380PrimComputerFe_B.Data_oal;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.SSM = A380PrimComputerFe_B.SSM_eu;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.Data = A380PrimComputerFe_B.Data_dmb;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.SSM = A380PrimComputerFe_B.SSM_pjf;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.Data = A380PrimComputerFe_B.Data_nf;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.spoiler_status_word.SSM = A380PrimComputerFe_B.SSM_jsu;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.spoiler_status_word.Data = A380PrimComputerFe_B.Data_anh;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.SSM = A380PrimComputerFe_B.SSM_eb;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data = A380PrimComputerFe_B.Data_idf;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.SSM = A380PrimComputerFe_B.SSM_dbu;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data = A380PrimComputerFe_B.Data_gm;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.SSM = A380PrimComputerFe_B.SSM_hh;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data = A380PrimComputerFe_B.Data_jqv;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.SSM = A380PrimComputerFe_B.SSM_jsuo;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data = A380PrimComputerFe_B.Data_d1;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.elevator_status_word.SSM = A380PrimComputerFe_B.SSM_dj;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.elevator_status_word.Data = A380PrimComputerFe_B.Data_dv;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.elevator_1_position_deg.SSM = A380PrimComputerFe_B.SSM_oio;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.elevator_1_position_deg.Data = A380PrimComputerFe_B.Data_oq4;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.elevator_2_position_deg.SSM = A380PrimComputerFe_B.SSM_ewd;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.elevator_2_position_deg.Data = A380PrimComputerFe_B.Data_fb;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.elevator_3_position_deg.SSM = A380PrimComputerFe_B.SSM_pjk;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.elevator_3_position_deg.Data = A380PrimComputerFe_B.Data_bsv;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.ths_position_deg.SSM = A380PrimComputerFe_B.SSM_j3l;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.ths_position_deg.Data = A380PrimComputerFe_B.Data_nt;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.rudder_status_word.SSM = A380PrimComputerFe_B.SSM_d4h;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.rudder_status_word.Data = A380PrimComputerFe_B.Data_ac;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.rudder_1_position_deg.SSM = A380PrimComputerFe_B.SSM_dc;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.rudder_1_position_deg.Data = A380PrimComputerFe_B.Data_dcn;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.rudder_2_position_deg.SSM = A380PrimComputerFe_B.SSM_obg;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.rudder_2_position_deg.Data = A380PrimComputerFe_B.Data_joe;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.SSM = A380PrimComputerFe_B.SSM_b5;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.Data = A380PrimComputerFe_B.Data_nol;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.fctl_law_status_word.SSM = A380PrimComputerFe_B.SSM_al;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.fctl_law_status_word.Data = A380PrimComputerFe_B.Data_ge;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.misc_data_status_word.SSM = A380PrimComputerFe_B.SSM_hib;
  A380PrimComputerFe_Y.out.data.bus_inputs.sec_3_bus.misc_data_status_word.Data = A380PrimComputerFe_B.Data_mj;
  A380PrimComputerFe_Y.out.data.bus_inputs.isis_1_bus = A380PrimComputerFe_B.isis_1_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.isis_2_bus = A380PrimComputerFe_B.isis_2_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.rate_gyro_pitch_1_bus = A380PrimComputerFe_B.rate_gyro_pitch_1_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.rate_gyro_pitch_2_bus = A380PrimComputerFe_B.rate_gyro_pitch_2_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.rate_gyro_roll_1_bus = A380PrimComputerFe_B.rate_gyro_roll_1_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.rate_gyro_roll_2_bus = A380PrimComputerFe_B.rate_gyro_roll_2_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.rate_gyro_yaw_1_bus = A380PrimComputerFe_B.rate_gyro_yaw_1_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.rate_gyro_yaw_2_bus = A380PrimComputerFe_B.rate_gyro_yaw_2_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.irdc_1_bus = A380PrimComputerFe_B.irdc_1_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.irdc_2_bus = A380PrimComputerFe_B.irdc_2_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.irdc_3_bus = A380PrimComputerFe_B.irdc_3_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.irdc_4_a_bus = A380PrimComputerFe_B.irdc_4_a_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.irdc_4_b_bus = A380PrimComputerFe_B.irdc_4_b_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.fcu_own_bus = A380PrimComputerFe_B.fcu_own_bus;
  A380PrimComputerFe_Y.out.data.bus_inputs.fcu_opp_bus = A380PrimComputerFe_B.fcu_opp_bus;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.ap_engaged = A380PrimComputerFe_B.ap_engaged;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.ap_1_engaged = A380PrimComputerFe_B.ap_1_engaged;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.ap_2_engaged = A380PrimComputerFe_B.ap_2_engaged;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.athr_engaged = A380PrimComputerFe_B.athr_engaged;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.roll_command = A380PrimComputerFe_B.roll_command;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.pitch_command = A380PrimComputerFe_B.pitch_command;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.yaw_command = A380PrimComputerFe_B.yaw_command;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.lateral_mode = A380PrimComputerFe_B.lateral_mode;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.lateral_mode_armed = A380PrimComputerFe_B.lateral_mode_armed;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.vertical_mode = A380PrimComputerFe_B.vertical_mode;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.vertical_mode_armed = A380PrimComputerFe_B.vertical_mode_armed;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.weight_lbs = A380PrimComputerFe_B.weight_lbs;
  A380PrimComputerFe_Y.out.data.temporary_ap_input.cg_percent = A380PrimComputerFe_B.cg_percent;
  A380PrimComputerFe_Y.out.general_logic.adr_computation_data.V_ias_kn = A380PrimComputerFe_B.V_ias_kn;
  A380PrimComputerFe_Y.out.general_logic.adr_computation_data.V_tas_kn = A380PrimComputerFe_B.V_tas_kn;
  A380PrimComputerFe_Y.out.general_logic.adr_computation_data.mach = A380PrimComputerFe_B.mach;
  A380PrimComputerFe_Y.out.general_logic.adr_computation_data.alpha_deg = A380PrimComputerFe_B.alpha_deg;
  A380PrimComputerFe_Y.out.general_logic.adr_computation_data.p_s_c_hpa = A380PrimComputerFe_B.p_s_c_hpa;
  A380PrimComputerFe_Y.out.general_logic.adr_computation_data.altitude_corrected_ft =
    A380PrimComputerFe_B.altitude_corrected_ft;
  A380PrimComputerFe_Y.out.general_logic.ir_computation_data.theta_deg = A380PrimComputerFe_B.theta_deg;
  A380PrimComputerFe_Y.out.general_logic.ir_computation_data.phi_deg = A380PrimComputerFe_B.phi_deg;
  A380PrimComputerFe_Y.out.general_logic.ir_computation_data.q_deg_s = A380PrimComputerFe_B.q_deg_s;
  A380PrimComputerFe_Y.out.general_logic.ir_computation_data.r_deg_s = A380PrimComputerFe_B.r_deg_s;
  A380PrimComputerFe_Y.out.general_logic.ir_computation_data.n_x_g = A380PrimComputerFe_B.n_x_g;
  A380PrimComputerFe_Y.out.general_logic.ir_computation_data.n_y_g = A380PrimComputerFe_B.n_y_g;
  A380PrimComputerFe_Y.out.general_logic.ir_computation_data.n_z_g = A380PrimComputerFe_B.n_z_g;
  A380PrimComputerFe_Y.out.general_logic.ir_computation_data.theta_dot_deg_s = A380PrimComputerFe_B.theta_dot_deg_s;
  A380PrimComputerFe_Y.out.general_logic.ir_computation_data.phi_dot_deg_s = A380PrimComputerFe_B.phi_dot_deg_s;
  A380PrimComputerFe_Y.out.general_logic.on_ground = A380PrimComputerFe_B.on_ground;
  A380PrimComputerFe_Y.out.general_logic.tracking_mode_on = A380PrimComputerFe_B.tracking_mode_on;
  A380PrimComputerFe_Y.out.general_logic.double_adr_failure = A380PrimComputerFe_B.double_adr_failure;
  A380PrimComputerFe_Y.out.general_logic.triple_adr_failure = A380PrimComputerFe_B.triple_adr_failure;
  A380PrimComputerFe_Y.out.general_logic.cas_or_mach_disagree = A380PrimComputerFe_B.cas_or_mach_disagree;
  A380PrimComputerFe_Y.out.general_logic.alpha_disagree = A380PrimComputerFe_B.alpha_disagree;
  A380PrimComputerFe_Y.out.general_logic.double_ir_failure = A380PrimComputerFe_B.double_ir_failure;
  A380PrimComputerFe_Y.out.general_logic.triple_ir_failure = A380PrimComputerFe_B.triple_ir_failure;
  A380PrimComputerFe_Y.out.general_logic.ir_failure_not_self_detected =
    A380PrimComputerFe_B.ir_failure_not_self_detected;
  A380PrimComputerFe_Y.out.general_logic.ra_computation_data_ft = A380PrimComputerFe_B.ra_computation_data_ft;
  A380PrimComputerFe_Y.out.general_logic.two_ra_failure = A380PrimComputerFe_B.two_ra_failure;
  A380PrimComputerFe_Y.out.general_logic.all_ra_failure = A380PrimComputerFe_B.all_ra_failure;
  A380PrimComputerFe_Y.out.general_logic.all_sfcc_lost = A380PrimComputerFe_B.all_sfcc_lost;
  A380PrimComputerFe_Y.out.general_logic.flap_handle_index = A380PrimComputerFe_B.flap_handle_index;
  A380PrimComputerFe_Y.out.general_logic.flap_angle_deg = A380PrimComputerFe_B.flap_angle_deg;
  A380PrimComputerFe_Y.out.general_logic.slat_angle_deg = A380PrimComputerFe_B.slat_angle_deg;
  A380PrimComputerFe_Y.out.general_logic.slat_flap_actual_pos = A380PrimComputerFe_B.slat_flap_actual_pos;
  A380PrimComputerFe_Y.out.general_logic.flap_surface_angle_deg = A380PrimComputerFe_B.flap_surface_angle_deg;
  A380PrimComputerFe_Y.out.general_logic.slat_surface_angle_deg = A380PrimComputerFe_B.slat_surface_angle_deg;
  A380PrimComputerFe_Y.out.general_logic.double_lgciu_failure = A380PrimComputerFe_B.double_lgciu_failure;
  A380PrimComputerFe_Y.out.general_logic.slats_locked = A380PrimComputerFe_B.slats_locked;
  A380PrimComputerFe_Y.out.general_logic.flaps_locked = A380PrimComputerFe_B.flaps_locked;
  A380PrimComputerFe_Y.out.general_logic.landing_gear_down = A380PrimComputerFe_B.landing_gear_down;
  A380PrimComputerFe_Y.out.flight_envelope.beta_target_deg =
    A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport2Outport1;
  A380PrimComputerFe_Y.out.flight_envelope.beta_target_visible =
    A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1;
  A380PrimComputerFe_Y.out.flight_envelope.computed_weight_lbs = A380PrimComputerFe_B.computed_weight_lbs;
  A380PrimComputerFe_Y.out.flight_envelope.computed_cg_percent = A380PrimComputerFe_B.computed_cg_percent;
  A380PrimComputerFe_Y.out.flight_envelope.v_stall_kn = A380PrimComputerFe_B.Y;
  A380PrimComputerFe_Y.out.flight_envelope.pitch_pitch_warning_active =
    A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport2Outport1_bq;
  A380PrimComputerFe_Y.out.flight_envelope.low_energy_warning_active =
    A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport2Outport1_b;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.left_inboard_aileron_deg =
    A380PrimComputerFe_B.left_inboard_aileron_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.right_inboard_aileron_deg =
    A380PrimComputerFe_B.right_inboard_aileron_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.left_midboard_aileron_deg =
    A380PrimComputerFe_B.left_midboard_aileron_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.right_midboard_aileron_deg =
    A380PrimComputerFe_B.right_midboard_aileron_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.left_outboard_aileron_deg =
    A380PrimComputerFe_B.left_outboard_aileron_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.right_outboard_aileron_deg =
    A380PrimComputerFe_B.right_outboard_aileron_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.left_spoiler_1_deg = A380PrimComputerFe_B.left_spoiler_1_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.right_spoiler_1_deg = A380PrimComputerFe_B.right_spoiler_1_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.left_spoiler_2_deg = A380PrimComputerFe_B.left_spoiler_2_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.right_spoiler_2_deg = A380PrimComputerFe_B.right_spoiler_2_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.left_spoiler_3_deg = A380PrimComputerFe_B.left_spoiler_3_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.right_spoiler_3_deg = A380PrimComputerFe_B.right_spoiler_3_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.left_spoiler_4_deg = A380PrimComputerFe_B.left_spoiler_4_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.right_spoiler_4_deg = A380PrimComputerFe_B.right_spoiler_4_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.left_spoiler_5_deg = A380PrimComputerFe_B.left_spoiler_5_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.right_spoiler_5_deg = A380PrimComputerFe_B.right_spoiler_5_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.left_spoiler_6_deg = A380PrimComputerFe_B.left_spoiler_6_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.right_spoiler_6_deg = A380PrimComputerFe_B.right_spoiler_6_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.left_spoiler_7_deg = A380PrimComputerFe_B.left_spoiler_7_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.right_spoiler_7_deg = A380PrimComputerFe_B.right_spoiler_7_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.left_spoiler_8_deg = A380PrimComputerFe_B.left_spoiler_8_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.right_spoiler_8_deg = A380PrimComputerFe_B.right_spoiler_8_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.upper_rudder_deg = A380PrimComputerFe_B.upper_rudder_deg;
  A380PrimComputerFe_Y.out.laws.lateral_law_outputs.lower_rudder_deg = A380PrimComputerFe_B.lower_rudder_deg;
  A380PrimComputerFe_Y.out.laws.pitch_law_outputs.left_inboard_elevator_deg =
    A380PrimComputerFe_B.left_inboard_elevator_deg;
  A380PrimComputerFe_Y.out.laws.pitch_law_outputs.right_inboard_elevator_deg =
    A380PrimComputerFe_B.right_inboard_elevator_deg;
  A380PrimComputerFe_Y.out.laws.pitch_law_outputs.left_outboard_elevator_deg =
    A380PrimComputerFe_B.left_outboard_elevator_deg;
  A380PrimComputerFe_Y.out.laws.pitch_law_outputs.right_outboard_elevator_deg =
    A380PrimComputerFe_B.right_outboard_elevator_deg;
  A380PrimComputerFe_Y.out.laws.pitch_law_outputs.ths_deg = A380PrimComputerFe_B.ths_deg;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.left_inboard_aileron_engaged =
    A380PrimComputerFe_B.left_inboard_aileron_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.right_inboard_aileron_engaged =
    A380PrimComputerFe_B.right_inboard_aileron_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.left_midboard_aileron_engaged =
    A380PrimComputerFe_B.left_midboard_aileron_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.right_midboard_aileron_engaged =
    A380PrimComputerFe_B.right_midboard_aileron_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.left_outboard_aileron_engaged =
    A380PrimComputerFe_B.left_outboard_aileron_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.right_outboard_aileron_engaged =
    A380PrimComputerFe_B.right_outboard_aileron_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.spoiler_pair_1_engaged =
    A380PrimComputerFe_B.spoiler_pair_1_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.spoiler_pair_2_engaged =
    A380PrimComputerFe_B.spoiler_pair_2_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.spoiler_pair_3_engaged =
    A380PrimComputerFe_B.spoiler_pair_3_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.spoiler_pair_4_engaged =
    A380PrimComputerFe_B.spoiler_pair_4_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.spoiler_pair_5_engaged =
    A380PrimComputerFe_B.spoiler_pair_5_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.spoiler_pair_6_engaged =
    A380PrimComputerFe_B.spoiler_pair_6_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.spoiler_pair_7_engaged =
    A380PrimComputerFe_B.spoiler_pair_7_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.spoiler_pair_8_engaged =
    A380PrimComputerFe_B.spoiler_pair_8_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.left_inboard_elevator_engaged =
    A380PrimComputerFe_B.left_inboard_elevator_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.right_inboard_elevator_engaged =
    A380PrimComputerFe_B.right_inboard_elevator_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.left_outboard_elevator_engaged =
    A380PrimComputerFe_B.left_outboard_elevator_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.right_outboard_elevator_engaged =
    A380PrimComputerFe_B.right_outboard_elevator_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.ths_engaged = A380PrimComputerFe_B.ths_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.upper_rudder_engaged = A380PrimComputerFe_B.upper_rudder_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.surface_statuses.lower_rudder_engaged = A380PrimComputerFe_B.lower_rudder_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg =
    A380PrimComputerFe_B.left_inboard_aileron_deg_g;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg =
    A380PrimComputerFe_B.right_inboard_aileron_deg_b;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg =
    A380PrimComputerFe_B.left_midboard_aileron_deg_f;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg =
    A380PrimComputerFe_B.right_midboard_aileron_deg_f;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg =
    A380PrimComputerFe_B.left_outboard_aileron_deg_g;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg =
    A380PrimComputerFe_B.right_outboard_aileron_deg_m;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_1_deg =
    A380PrimComputerFe_B.left_spoiler_1_deg_b;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_1_deg =
    A380PrimComputerFe_B.right_spoiler_1_deg_o;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_2_deg =
    A380PrimComputerFe_B.left_spoiler_2_deg_i;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_2_deg =
    A380PrimComputerFe_B.right_spoiler_2_deg_g;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_3_deg =
    A380PrimComputerFe_B.left_spoiler_3_deg_i;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_3_deg =
    A380PrimComputerFe_B.right_spoiler_3_deg_b;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_4_deg =
    A380PrimComputerFe_B.left_spoiler_4_deg_g;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_4_deg =
    A380PrimComputerFe_B.right_spoiler_4_deg_a;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_5_deg =
    A380PrimComputerFe_B.left_spoiler_5_deg_d;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_5_deg =
    A380PrimComputerFe_B.right_spoiler_5_deg_m;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_6_deg =
    A380PrimComputerFe_B.left_spoiler_6_deg_o;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_6_deg =
    A380PrimComputerFe_B.right_spoiler_6_deg_d;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_7_deg =
    A380PrimComputerFe_B.left_spoiler_7_deg_a;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_7_deg =
    A380PrimComputerFe_B.right_spoiler_7_deg_j;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_8_deg =
    A380PrimComputerFe_B.left_spoiler_8_deg_h;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_8_deg =
    A380PrimComputerFe_B.right_spoiler_8_deg_j;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.upper_rudder_deg =
    A380PrimComputerFe_B.upper_rudder_deg_m;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_surface_positions.lower_rudder_deg =
    A380PrimComputerFe_B.lower_rudder_deg_c;
  A380PrimComputerFe_Y.out.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg =
    A380PrimComputerFe_B.left_inboard_elevator_deg_k;
  A380PrimComputerFe_Y.out.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg =
    A380PrimComputerFe_B.right_inboard_elevator_deg_o;
  A380PrimComputerFe_Y.out.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg =
    A380PrimComputerFe_B.left_outboard_elevator_deg_p;
  A380PrimComputerFe_Y.out.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg =
    A380PrimComputerFe_B.right_outboard_elevator_deg_g;
  A380PrimComputerFe_Y.out.fctl_logic.pitch_surface_positions.ths_deg = A380PrimComputerFe_B.ths_deg_o;
  A380PrimComputerFe_Y.out.fctl_logic.lateral_law_capability = A380PrimComputerFe_B.lateral_law_capability;
  A380PrimComputerFe_Y.out.fctl_logic.active_lateral_law = A380PrimComputerFe_B.active_lateral_law;
  A380PrimComputerFe_Y.out.fctl_logic.pitch_law_capability = A380PrimComputerFe_B.pitch_law_capability;
  A380PrimComputerFe_Y.out.fctl_logic.active_pitch_law = A380PrimComputerFe_B.active_pitch_law;
  A380PrimComputerFe_Y.out.fctl_logic.abnormal_condition_law_active = A380PrimComputerFe_B.abnormal_condition_law_active;
  A380PrimComputerFe_Y.out.fctl_logic.is_master_prim = A380PrimComputerFe_B.is_master_prim;
  A380PrimComputerFe_Y.out.fctl_logic.elevator_1_avail = A380PrimComputerFe_B.elevator_1_avail;
  A380PrimComputerFe_Y.out.fctl_logic.elevator_1_engaged = A380PrimComputerFe_B.elevator_1_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.elevator_2_avail = A380PrimComputerFe_B.elevator_2_avail;
  A380PrimComputerFe_Y.out.fctl_logic.elevator_2_engaged = A380PrimComputerFe_B.elevator_2_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.elevator_3_avail = A380PrimComputerFe_B.elevator_3_avail;
  A380PrimComputerFe_Y.out.fctl_logic.elevator_3_engaged = A380PrimComputerFe_B.elevator_3_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.ths_avail = A380PrimComputerFe_B.ths_avail;
  A380PrimComputerFe_Y.out.fctl_logic.ths_engaged = A380PrimComputerFe_B.ths_engaged_h;
  A380PrimComputerFe_Y.out.fctl_logic.left_aileron_1_avail = A380PrimComputerFe_B.left_aileron_1_avail;
  A380PrimComputerFe_Y.out.fctl_logic.left_aileron_1_engaged = A380PrimComputerFe_B.left_aileron_1_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.left_aileron_2_avail = A380PrimComputerFe_B.left_aileron_2_avail;
  A380PrimComputerFe_Y.out.fctl_logic.left_aileron_2_engaged = A380PrimComputerFe_B.left_aileron_2_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.right_aileron_1_avail = A380PrimComputerFe_B.right_aileron_1_avail;
  A380PrimComputerFe_Y.out.fctl_logic.right_aileron_1_engaged = A380PrimComputerFe_B.right_aileron_1_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.right_aileron_2_avail = A380PrimComputerFe_B.right_aileron_2_avail;
  A380PrimComputerFe_Y.out.fctl_logic.right_aileron_2_engaged = A380PrimComputerFe_B.right_aileron_2_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.left_spoiler_hydraulic_mode_avail =
    A380PrimComputerFe_B.left_spoiler_hydraulic_mode_avail;
  A380PrimComputerFe_Y.out.fctl_logic.left_spoiler_electric_mode_avail =
    A380PrimComputerFe_B.left_spoiler_electric_mode_avail;
  A380PrimComputerFe_Y.out.fctl_logic.left_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFe_B.left_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.left_spoiler_electric_mode_engaged =
    A380PrimComputerFe_B.left_spoiler_electric_mode_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.right_spoiler_hydraulic_mode_avail =
    A380PrimComputerFe_B.right_spoiler_hydraulic_mode_avail;
  A380PrimComputerFe_Y.out.fctl_logic.right_spoiler_electric_mode_avail =
    A380PrimComputerFe_B.right_spoiler_electric_mode_avail;
  A380PrimComputerFe_Y.out.fctl_logic.right_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFe_B.right_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.right_spoiler_electric_mode_engaged =
    A380PrimComputerFe_B.right_spoiler_electric_mode_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.rudder_1_hydraulic_mode_avail = A380PrimComputerFe_B.rudder_1_hydraulic_mode_avail;
  A380PrimComputerFe_Y.out.fctl_logic.rudder_1_electric_mode_avail = A380PrimComputerFe_B.rudder_1_electric_mode_avail;
  A380PrimComputerFe_Y.out.fctl_logic.rudder_1_hydraulic_mode_engaged =
    A380PrimComputerFe_B.rudder_1_hydraulic_mode_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.rudder_1_electric_mode_engaged =
    A380PrimComputerFe_B.rudder_1_electric_mode_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.rudder_2_hydraulic_mode_avail = A380PrimComputerFe_B.rudder_2_hydraulic_mode_avail;
  A380PrimComputerFe_Y.out.fctl_logic.rudder_2_electric_mode_avail = A380PrimComputerFe_B.rudder_2_electric_mode_avail;
  A380PrimComputerFe_Y.out.fctl_logic.rudder_2_hydraulic_mode_engaged =
    A380PrimComputerFe_B.rudder_2_hydraulic_mode_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.rudder_2_electric_mode_engaged =
    A380PrimComputerFe_B.rudder_2_electric_mode_engaged;
  A380PrimComputerFe_Y.out.fctl_logic.aileron_droop_active = A380PrimComputerFe_B.aileron_droop_active;
  A380PrimComputerFe_Y.out.fctl_logic.aileron_antidroop_active = A380PrimComputerFe_B.aileron_antidroop_active;
  A380PrimComputerFe_Y.out.fctl_logic.ths_automatic_mode_active = A380PrimComputerFe_B.ths_automatic_mode_active;
  A380PrimComputerFe_Y.out.fctl_logic.ths_manual_mode_c_deg_s = A380PrimComputerFe_B.ths_manual_mode_c_deg_s;
  A380PrimComputerFe_Y.out.fctl_logic.is_yellow_hydraulic_power_avail =
    A380PrimComputerFe_B.is_yellow_hydraulic_power_avail;
  A380PrimComputerFe_Y.out.fctl_logic.is_green_hydraulic_power_avail =
    A380PrimComputerFe_B.is_green_hydraulic_power_avail;
  A380PrimComputerFe_Y.out.fctl_logic.eha_ebha_elec_mode_inhibited = A380PrimComputerFe_B.eha_ebha_elec_mode_inhibited;
  A380PrimComputerFe_Y.out.fctl_logic.left_sidestick_disabled = A380PrimComputerFe_B.left_sidestick_disabled;
  A380PrimComputerFe_Y.out.fctl_logic.right_sidestick_disabled = A380PrimComputerFe_B.right_sidestick_disabled;
  A380PrimComputerFe_Y.out.fctl_logic.left_sidestick_priority_locked =
    A380PrimComputerFe_B.left_sidestick_priority_locked;
  A380PrimComputerFe_Y.out.fctl_logic.right_sidestick_priority_locked =
    A380PrimComputerFe_B.right_sidestick_priority_locked;
  A380PrimComputerFe_Y.out.fctl_logic.total_sidestick_pitch_command = A380PrimComputerFe_B.total_sidestick_pitch_command;
  A380PrimComputerFe_Y.out.fctl_logic.total_sidestick_roll_command = A380PrimComputerFe_B.total_sidestick_roll_command;
  A380PrimComputerFe_Y.out.fctl_logic.speed_brake_inhibited = A380PrimComputerFe_B.speed_brake_inhibited;
  A380PrimComputerFe_Y.out.fctl_logic.speed_brake_command_deg = A380PrimComputerFe_B.speed_brake_command_deg;
  A380PrimComputerFe_Y.out.fctl_logic.ground_spoilers_armed = A380PrimComputerFe_B.ground_spoilers_armed;
  A380PrimComputerFe_Y.out.fctl_logic.ground_spoilers_out = A380PrimComputerFe_B.ground_spoilers_out;
  A380PrimComputerFe_Y.out.fctl_logic.phased_lift_dumping_active = A380PrimComputerFe_B.phased_lift_dumping_active;
  A380PrimComputerFe_Y.out.fctl_logic.spoiler_lift_active = A380PrimComputerFe_B.spoiler_lift_active;
  A380PrimComputerFe_Y.out.fctl_logic.ap_authorised = A380PrimComputerFe_B.ap_authorised;
  A380PrimComputerFe_Y.out.fctl_logic.protection_ap_disconnect = A380PrimComputerFe_B.protection_ap_disconnect;
  A380PrimComputerFe_Y.out.fctl_logic.high_alpha_prot_active = A380PrimComputerFe_B.high_alpha_prot_active;
  A380PrimComputerFe_Y.out.fctl_logic.alpha_prot_deg = A380PrimComputerFe_B.alpha_prot_deg;
  A380PrimComputerFe_Y.out.fctl_logic.alpha_max_deg = A380PrimComputerFe_B.alpha_max_deg;
  A380PrimComputerFe_Y.out.fctl_logic.v_alpha_prot_kn = A380PrimComputerFe_B.v_alpha_prot_kn;
  A380PrimComputerFe_Y.out.fctl_logic.v_alpha_max_kn = A380PrimComputerFe_B.v_alpha_max_kn;
  A380PrimComputerFe_Y.out.fctl_logic.v_alpha_stall_warn_kn = A380PrimComputerFe_B.v_alpha_stall_warn_kn;
  A380PrimComputerFe_Y.out.fctl_logic.high_speed_prot_active = A380PrimComputerFe_B.high_speed_prot_active;
  A380PrimComputerFe_Y.out.fctl_logic.high_speed_prot_lo_thresh_kn = A380PrimComputerFe_B.high_speed_prot_lo_thresh_kn;
  A380PrimComputerFe_Y.out.fctl_logic.high_speed_prot_hi_thresh_kn = A380PrimComputerFe_B.high_speed_prot_hi_thresh_kn;
  A380PrimComputerFe_Y.out.fg_logic.land_2_capability = A380PrimComputerFe_B.land_2_capability;
  A380PrimComputerFe_Y.out.fg_logic.land_3_fail_passive_capability = A380PrimComputerFe_B.land_3_fail_passive_capability;
  A380PrimComputerFe_Y.out.fg_logic.land_3_fail_op_capability = A380PrimComputerFe_B.land_3_fail_op_capability;
  A380PrimComputerFe_Y.out.fg_logic.land_2_inop = A380PrimComputerFe_B.land_2_inop;
  A380PrimComputerFe_Y.out.fg_logic.land_3_fail_passive_inop = A380PrimComputerFe_B.land_3_fail_passive_inop;
  A380PrimComputerFe_Y.out.fg_logic.land_3_fail_op_inop = A380PrimComputerFe_B.land_3_fail_op_inop;
  A380PrimComputerFe_Y.out.discrete_outputs.alignment_dummy = A380PrimComputerFe_B.alignment_dummy;
  A380PrimComputerFe_Y.out.discrete_outputs.elevator_1_active_mode = A380PrimComputerFe_B.elevator_1_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.elevator_2_active_mode = A380PrimComputerFe_B.elevator_2_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.elevator_3_active_mode = A380PrimComputerFe_B.elevator_3_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.ths_active_mode = A380PrimComputerFe_B.ths_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.left_aileron_1_active_mode = A380PrimComputerFe_B.left_aileron_1_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.left_aileron_2_active_mode = A380PrimComputerFe_B.left_aileron_2_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.right_aileron_1_active_mode =
    A380PrimComputerFe_B.right_aileron_1_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.right_aileron_2_active_mode =
    A380PrimComputerFe_B.right_aileron_2_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.left_spoiler_electronic_module_enable =
    A380PrimComputerFe_B.left_spoiler_electronic_module_enable;
  A380PrimComputerFe_Y.out.discrete_outputs.right_spoiler_electronic_module_enable =
    A380PrimComputerFe_B.right_spoiler_electronic_module_enable;
  A380PrimComputerFe_Y.out.discrete_outputs.rudder_1_hydraulic_active_mode =
    A380PrimComputerFe_B.rudder_1_hydraulic_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.rudder_1_electric_active_mode =
    A380PrimComputerFe_B.rudder_1_electric_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.rudder_2_hydraulic_active_mode =
    A380PrimComputerFe_B.rudder_2_hydraulic_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.rudder_2_electric_active_mode =
    A380PrimComputerFe_B.rudder_2_electric_active_mode;
  A380PrimComputerFe_Y.out.discrete_outputs.prim_healthy = A380PrimComputerFe_B.prim_healthy;
  A380PrimComputerFe_Y.out.discrete_outputs.fcu_own_select = A380PrimComputerFe_B.fcu_own_select;
  A380PrimComputerFe_Y.out.discrete_outputs.fcu_opp_select = A380PrimComputerFe_B.fcu_opp_select;
  A380PrimComputerFe_Y.out.discrete_outputs.reverser_tertiary_lock = A380PrimComputerFe_B.reverser_tertiary_lock;
  A380PrimComputerFe_Y.out.analog_outputs.elevator_1_pos_order_deg = A380PrimComputerFe_B.elevator_1_pos_order_deg;
  A380PrimComputerFe_Y.out.analog_outputs.elevator_2_pos_order_deg = A380PrimComputerFe_B.elevator_2_pos_order_deg;
  A380PrimComputerFe_Y.out.analog_outputs.elevator_3_pos_order_deg = A380PrimComputerFe_B.elevator_3_pos_order_deg;
  A380PrimComputerFe_Y.out.analog_outputs.ths_pos_order_deg = A380PrimComputerFe_B.ths_pos_order_deg;
  A380PrimComputerFe_Y.out.analog_outputs.left_aileron_1_pos_order_deg =
    A380PrimComputerFe_B.left_aileron_1_pos_order_deg;
  A380PrimComputerFe_Y.out.analog_outputs.left_aileron_2_pos_order_deg =
    A380PrimComputerFe_B.left_aileron_2_pos_order_deg;
  A380PrimComputerFe_Y.out.analog_outputs.right_aileron_1_pos_order_deg =
    A380PrimComputerFe_B.right_aileron_1_pos_order_deg;
  A380PrimComputerFe_Y.out.analog_outputs.right_aileron_2_pos_order_deg =
    A380PrimComputerFe_B.right_aileron_2_pos_order_deg;
  A380PrimComputerFe_Y.out.analog_outputs.left_spoiler_pos_order_deg = A380PrimComputerFe_B.left_spoiler_pos_order_deg;
  A380PrimComputerFe_Y.out.analog_outputs.right_spoiler_pos_order_deg = A380PrimComputerFe_B.right_spoiler_pos_order_deg;
  A380PrimComputerFe_Y.out.analog_outputs.rudder_1_pos_order_deg = A380PrimComputerFe_B.rudder_1_pos_order_deg;
  A380PrimComputerFe_Y.out.analog_outputs.rudder_2_pos_order_deg = A380PrimComputerFe_B.rudder_2_pos_order_deg;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_inboard_aileron_command_deg.SSM = A380PrimComputerFe_B.SSM_kxx;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_inboard_aileron_command_deg.Data = A380PrimComputerFe_B.Data_fwx;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_inboard_aileron_command_deg.SSM = A380PrimComputerFe_B.SSM_kxxt;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_inboard_aileron_command_deg.Data = A380PrimComputerFe_B.Data_fwxk;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_midboard_aileron_command_deg.SSM = A380PrimComputerFe_B.SSM_kxxta;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_midboard_aileron_command_deg.Data = A380PrimComputerFe_B.Data_fwxkf;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_midboard_aileron_command_deg.SSM = A380PrimComputerFe_B.SSM_kxxtac;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_midboard_aileron_command_deg.Data = A380PrimComputerFe_B.Data_fwxkft;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_outboard_aileron_command_deg.SSM = A380PrimComputerFe_B.SSM_kxxtac0;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_outboard_aileron_command_deg.Data = A380PrimComputerFe_B.Data_fwxkftc;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_outboard_aileron_command_deg.SSM = A380PrimComputerFe_B.SSM_kxxtac0zt;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_outboard_aileron_command_deg.Data = A380PrimComputerFe_B.Data_fwxkftc3;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_1_command_deg.SSM = A380PrimComputerFe_B.SSM_kxxtac0ztg;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_1_command_deg.Data = A380PrimComputerFe_B.Data_fwxkftc3e;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_1_command_deg.SSM = A380PrimComputerFe_B.SSM_kxxtac0ztgf;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_1_command_deg.Data = A380PrimComputerFe_B.Data_fwxkftc3ep;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_2_command_deg.SSM = A380PrimComputerFe_B.SSM_kxxtac0ztgf2;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_2_command_deg.Data = A380PrimComputerFe_B.Data_fwxkftc3epg;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_2_command_deg.SSM = A380PrimComputerFe_B.SSM_kxxtac0ztgf2u;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_2_command_deg.Data = A380PrimComputerFe_B.Data_fwxkftc3epgtd;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_3_command_deg.SSM = A380PrimComputerFe_B.SSM_kxxtac0ztgf2ux;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_3_command_deg.Data = A380PrimComputerFe_B.Data_fwxkftc3epgtdx;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_3_command_deg.SSM = A380PrimComputerFe_B.SSM_kxxtac0ztgf2uxn;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_3_command_deg.Data = A380PrimComputerFe_B.Data_fwxkftc3epgtdxc;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_4_command_deg.SSM = A380PrimComputerFe_B.SSM_ky;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_4_command_deg.Data = A380PrimComputerFe_B.Data_h;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_4_command_deg.SSM = A380PrimComputerFe_B.SSM_d;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_4_command_deg.Data = A380PrimComputerFe_B.Data_e;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_5_command_deg.SSM = A380PrimComputerFe_B.SSM_h;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_5_command_deg.Data = A380PrimComputerFe_B.Data_j;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_5_command_deg.SSM = A380PrimComputerFe_B.SSM_p;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_5_command_deg.Data = A380PrimComputerFe_B.Data_d;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_6_command_deg.SSM = A380PrimComputerFe_B.SSM_di;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_6_command_deg.Data = A380PrimComputerFe_B.Data_p;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_6_command_deg.SSM = A380PrimComputerFe_B.SSM_j;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_6_command_deg.Data = A380PrimComputerFe_B.Data_i;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_7_command_deg.SSM = A380PrimComputerFe_B.SSM_i;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_7_command_deg.Data = A380PrimComputerFe_B.Data_g;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_7_command_deg.SSM = A380PrimComputerFe_B.SSM_g;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_7_command_deg.Data = A380PrimComputerFe_B.Data_eb;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_8_command_deg.SSM = A380PrimComputerFe_B.SSM_db;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_8_command_deg.Data = A380PrimComputerFe_B.Data_jo;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_8_command_deg.SSM = A380PrimComputerFe_B.SSM_n;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_8_command_deg.Data = A380PrimComputerFe_B.Data_ex;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_inboard_elevator_command_deg.SSM = A380PrimComputerFe_B.SSM_a;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_inboard_elevator_command_deg.Data = A380PrimComputerFe_B.Data_fd;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_inboard_elevator_command_deg.SSM = A380PrimComputerFe_B.SSM_ir;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_inboard_elevator_command_deg.Data = A380PrimComputerFe_B.Data_ja;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_outboard_elevator_command_deg.SSM = A380PrimComputerFe_B.SSM_hu;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_outboard_elevator_command_deg.Data = A380PrimComputerFe_B.Data_k;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_outboard_elevator_command_deg.SSM = A380PrimComputerFe_B.SSM_gr;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_outboard_elevator_command_deg.Data = A380PrimComputerFe_B.Data_joy;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.ths_command_deg.SSM = A380PrimComputerFe_B.SSM_ev;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.ths_command_deg.Data = A380PrimComputerFe_B.Data_h3;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.upper_rudder_command_deg.SSM = A380PrimComputerFe_B.SSM_l;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.upper_rudder_command_deg.Data = A380PrimComputerFe_B.Data_a0;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.lower_rudder_command_deg.SSM = A380PrimComputerFe_B.SSM_ei;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.lower_rudder_command_deg.Data = A380PrimComputerFe_B.Data_b;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_sidestick_pitch_command_deg.SSM = A380PrimComputerFe_B.SSM_an;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_sidestick_pitch_command_deg.Data = A380PrimComputerFe_B.Data_iz;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_sidestick_pitch_command_deg.SSM = A380PrimComputerFe_B.SSM_c;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_sidestick_pitch_command_deg.Data = A380PrimComputerFe_B.Data_j2;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_sidestick_roll_command_deg.SSM = A380PrimComputerFe_B.SSM_cb;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_sidestick_roll_command_deg.Data = A380PrimComputerFe_B.Data_o;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_sidestick_roll_command_deg.SSM = A380PrimComputerFe_B.SSM_lb;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_sidestick_roll_command_deg.Data = A380PrimComputerFe_B.Data_m;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.rudder_pedal_position_deg.SSM = A380PrimComputerFe_B.SSM_ia;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.rudder_pedal_position_deg.Data = A380PrimComputerFe_B.Data_oq;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.aileron_status_word.SSM = A380PrimComputerFe_B.SSM_kyz;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.aileron_status_word.Data = A380PrimComputerFe_B.Data_fo;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_aileron_1_position_deg.SSM = A380PrimComputerFe_B.SSM_is;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_aileron_1_position_deg.Data = A380PrimComputerFe_B.Data_p1;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_aileron_2_position_deg.SSM = A380PrimComputerFe_B.SSM_ca;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_aileron_2_position_deg.Data = A380PrimComputerFe_B.Data_p1y;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_aileron_1_position_deg.SSM = A380PrimComputerFe_B.SSM_o;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_aileron_1_position_deg.Data = A380PrimComputerFe_B.Data_l;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_aileron_2_position_deg.SSM = A380PrimComputerFe_B.SSM_ak;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_aileron_2_position_deg.Data = A380PrimComputerFe_B.Data_kp;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.spoiler_status_word.SSM = A380PrimComputerFe_B.SSM_cbj;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.spoiler_status_word.Data = A380PrimComputerFe_B.Data_pi;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_position_deg.SSM = A380PrimComputerFe_B.SSM_cu;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.left_spoiler_position_deg.Data = A380PrimComputerFe_B.Data_dm;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_position_deg.SSM = A380PrimComputerFe_B.SSM_nn;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.right_spoiler_position_deg.Data = A380PrimComputerFe_B.Data_f5;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.elevator_status_word.SSM = A380PrimComputerFe_B.SSM_b;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.elevator_status_word.Data = A380PrimComputerFe_B.Data_js;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.elevator_1_position_deg.SSM = A380PrimComputerFe_B.SSM_m;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.elevator_1_position_deg.Data = A380PrimComputerFe_B.Data_ee;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.elevator_2_position_deg.SSM = A380PrimComputerFe_B.SSM_f;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.elevator_2_position_deg.Data = A380PrimComputerFe_B.Data_ig;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.elevator_3_position_deg.SSM = A380PrimComputerFe_B.SSM_hb;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.elevator_3_position_deg.Data = A380PrimComputerFe_B.Data_mk;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.ths_position_deg.SSM = A380PrimComputerFe_B.SSM_gz;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.ths_position_deg.Data = A380PrimComputerFe_B.Data_pu;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.rudder_status_word.SSM = A380PrimComputerFe_B.SSM_pv;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.rudder_status_word.Data = A380PrimComputerFe_B.Data_ly;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.rudder_1_position_deg.SSM = A380PrimComputerFe_B.SSM_mf;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.rudder_1_position_deg.Data = A380PrimComputerFe_B.Data_jq;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.rudder_2_position_deg.SSM = A380PrimComputerFe_B.SSM_m0;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.rudder_2_position_deg.Data = A380PrimComputerFe_B.Data_lyw;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.radio_height_1_ft.SSM = A380PrimComputerFe_B.SSM_kd;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.radio_height_1_ft.Data = A380PrimComputerFe_B.Data_gq;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.radio_height_2_ft.SSM = A380PrimComputerFe_B.SSM_pu;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.radio_height_2_ft.Data = A380PrimComputerFe_B.Data_n;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.fctl_law_status_word.SSM = A380PrimComputerFe_B.SSM_nv;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.fctl_law_status_word.Data = A380PrimComputerFe_B.Data_bq;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.discrete_status_word_1.SSM = A380PrimComputerFe_B.SSM_d5;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.discrete_status_word_1.Data = A380PrimComputerFe_B.Data_dmn;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.fe_status_word.SSM = A380PrimComputerFe_B.SSM_eo;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.fe_status_word.Data = A380PrimComputerFe_B.Data_jn;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.fg_status_word.SSM = A380PrimComputerFe_B.SSM_bq;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.fg_status_word.Data = A380PrimComputerFe_B.Data_c;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.v_alpha_lim_kn.SSM = A380PrimComputerFe_B.SSM_hi;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.v_alpha_lim_kn.Data = A380PrimComputerFe_B.Data_lx;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.v_alpha_prot_kn.SSM = A380PrimComputerFe_B.SSM_mm;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.v_alpha_prot_kn.Data = A380PrimComputerFe_B.Data_jb;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.v_alpha_stall_warn_kn.SSM = A380PrimComputerFe_B.SSM_kz;
  A380PrimComputerFe_Y.out.bus_outputs.fctl.v_alpha_stall_warn_kn.Data = A380PrimComputerFe_B.Data_fn;
  A380PrimComputerFe_Y.out.bus_outputs.fe.gamma_a_deg.SSM = A380PrimComputerFe_B.SSM_il;
  A380PrimComputerFe_Y.out.bus_outputs.fe.gamma_a_deg.Data = A380PrimComputerFe_B.Data_ez;
  A380PrimComputerFe_Y.out.bus_outputs.fe.gamma_t_deg.SSM = A380PrimComputerFe_B.SSM_i2;
  A380PrimComputerFe_Y.out.bus_outputs.fe.gamma_t_deg.Data = A380PrimComputerFe_B.Data_pw;
  A380PrimComputerFe_Y.out.bus_outputs.fe.sideslip_target_deg.SSM = A380PrimComputerFe_B.SSM_ah;
  A380PrimComputerFe_Y.out.bus_outputs.fe.sideslip_target_deg.Data = A380PrimComputerFe_B.Data_m2;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_ls_kn.SSM = A380PrimComputerFe_B.SSM_en;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_ls_kn.Data = A380PrimComputerFe_B.Data_ek;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_stall_kn.SSM = A380PrimComputerFe_B.SSM_dq;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_stall_kn.Data = A380PrimComputerFe_B.Data_iy;
  A380PrimComputerFe_Y.out.bus_outputs.fe.speed_trend_kn.SSM = A380PrimComputerFe_B.SSM_px;
  A380PrimComputerFe_Y.out.bus_outputs.fe.speed_trend_kn.Data = A380PrimComputerFe_B.Data_lk;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_3_kn.SSM = A380PrimComputerFe_B.SSM_p5;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_3_kn.Data = A380PrimComputerFe_B.Data_ca;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_4_kn.SSM = A380PrimComputerFe_B.SSM_mk;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_4_kn.Data = A380PrimComputerFe_B.Data_pix;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_man_kn.SSM = A380PrimComputerFe_B.SSM_mu;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_man_kn.Data = A380PrimComputerFe_B.Data_di;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_max_kn.SSM = A380PrimComputerFe_B.SSM_cbl;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_max_kn.Data = A380PrimComputerFe_B.Data_lz;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_fe_next_kn.SSM = A380PrimComputerFe_B.SSM_gzd;
  A380PrimComputerFe_Y.out.bus_outputs.fe.v_fe_next_kn.Data = A380PrimComputerFe_B.Data_dc;
  A380PrimComputerFe_Y.out.bus_outputs.fe.discrete_word_1.SSM = A380PrimComputerFe_B.SSM_mo;
  A380PrimComputerFe_Y.out.bus_outputs.fe.discrete_word_1.Data = A380PrimComputerFe_B.Data_gc;
}

void A380PrimComputerFe::initialize()
{
  A380PrimComputerFe_DWork.Delay_DSTATE = A380PrimComputerFe_P.DiscreteDerivativeVariableTs_InitialCondition;
  A380PrimComputerFe_B.dt = A380PrimComputerFe_P.out_Y0.data.time.dt;
  A380PrimComputerFe_B.simulation_time = A380PrimComputerFe_P.out_Y0.data.time.simulation_time;
  A380PrimComputerFe_B.monotonic_time = A380PrimComputerFe_P.out_Y0.data.time.monotonic_time;
  A380PrimComputerFe_B.slew_on = A380PrimComputerFe_P.out_Y0.data.sim_data.slew_on;
  A380PrimComputerFe_B.pause_on = A380PrimComputerFe_P.out_Y0.data.sim_data.pause_on;
  A380PrimComputerFe_B.tracking_mode_on_override = A380PrimComputerFe_P.out_Y0.data.sim_data.tracking_mode_on_override;
  A380PrimComputerFe_B.tailstrike_protection_on = A380PrimComputerFe_P.out_Y0.data.sim_data.tailstrike_protection_on;
  A380PrimComputerFe_B.computer_running = A380PrimComputerFe_P.out_Y0.data.sim_data.computer_running;
  A380PrimComputerFe_B.alignment_dummy_h = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.alignment_dummy;
  A380PrimComputerFe_B.prim_overhead_button_pressed =
    A380PrimComputerFe_P.out_Y0.data.discrete_inputs.prim_overhead_button_pressed;
  A380PrimComputerFe_B.is_unit_1 = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.is_unit_1;
  A380PrimComputerFe_B.is_unit_2 = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.is_unit_2;
  A380PrimComputerFe_B.is_unit_3 = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.is_unit_3;
  A380PrimComputerFe_B.capt_priority_takeover_pressed =
    A380PrimComputerFe_P.out_Y0.data.discrete_inputs.capt_priority_takeover_pressed;
  A380PrimComputerFe_B.fo_priority_takeover_pressed =
    A380PrimComputerFe_P.out_Y0.data.discrete_inputs.fo_priority_takeover_pressed;
  A380PrimComputerFe_B.ap_1_pushbutton_pressed =
    A380PrimComputerFe_P.out_Y0.data.discrete_inputs.ap_1_pushbutton_pressed;
  A380PrimComputerFe_B.ap_2_pushbutton_pressed =
    A380PrimComputerFe_P.out_Y0.data.discrete_inputs.ap_2_pushbutton_pressed;
  A380PrimComputerFe_B.fcu_healthy = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.fcu_healthy;
  A380PrimComputerFe_B.athr_pushbutton = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.athr_pushbutton;
  A380PrimComputerFe_B.ir_3_on_capt = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.ir_3_on_capt;
  A380PrimComputerFe_B.ir_3_on_fo = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.ir_3_on_fo;
  A380PrimComputerFe_B.adr_3_on_capt = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.adr_3_on_capt;
  A380PrimComputerFe_B.adr_3_on_fo = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.adr_3_on_fo;
  A380PrimComputerFe_B.rat_deployed = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.rat_deployed;
  A380PrimComputerFe_B.rat_contactor_closed = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.rat_contactor_closed;
  A380PrimComputerFe_B.pitch_trim_up_pressed = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.pitch_trim_up_pressed;
  A380PrimComputerFe_B.pitch_trim_down_pressed =
    A380PrimComputerFe_P.out_Y0.data.discrete_inputs.pitch_trim_down_pressed;
  A380PrimComputerFe_B.green_low_pressure = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.green_low_pressure;
  A380PrimComputerFe_B.yellow_low_pressure = A380PrimComputerFe_P.out_Y0.data.discrete_inputs.yellow_low_pressure;
  A380PrimComputerFe_B.capt_pitch_stick_pos = A380PrimComputerFe_P.out_Y0.data.analog_inputs.capt_pitch_stick_pos;
  A380PrimComputerFe_B.fo_pitch_stick_pos = A380PrimComputerFe_P.out_Y0.data.analog_inputs.fo_pitch_stick_pos;
  A380PrimComputerFe_B.capt_roll_stick_pos = A380PrimComputerFe_P.out_Y0.data.analog_inputs.capt_roll_stick_pos;
  A380PrimComputerFe_B.fo_roll_stick_pos = A380PrimComputerFe_P.out_Y0.data.analog_inputs.fo_roll_stick_pos;
  A380PrimComputerFe_B.speed_brake_lever_pos = A380PrimComputerFe_P.out_Y0.data.analog_inputs.speed_brake_lever_pos;
  A380PrimComputerFe_B.thr_lever_1_pos = A380PrimComputerFe_P.out_Y0.data.analog_inputs.thr_lever_1_pos;
  A380PrimComputerFe_B.thr_lever_2_pos = A380PrimComputerFe_P.out_Y0.data.analog_inputs.thr_lever_2_pos;
  A380PrimComputerFe_B.thr_lever_3_pos = A380PrimComputerFe_P.out_Y0.data.analog_inputs.thr_lever_3_pos;
  A380PrimComputerFe_B.thr_lever_4_pos = A380PrimComputerFe_P.out_Y0.data.analog_inputs.thr_lever_4_pos;
  A380PrimComputerFe_B.elevator_1_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.elevator_1_pos_deg;
  A380PrimComputerFe_B.elevator_2_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.elevator_2_pos_deg;
  A380PrimComputerFe_B.elevator_3_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.elevator_3_pos_deg;
  A380PrimComputerFe_B.ths_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.ths_pos_deg;
  A380PrimComputerFe_B.left_aileron_1_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.left_aileron_1_pos_deg;
  A380PrimComputerFe_B.left_aileron_2_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.left_aileron_2_pos_deg;
  A380PrimComputerFe_B.right_aileron_1_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.right_aileron_1_pos_deg;
  A380PrimComputerFe_B.right_aileron_2_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.right_aileron_2_pos_deg;
  A380PrimComputerFe_B.left_spoiler_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.left_spoiler_pos_deg;
  A380PrimComputerFe_B.right_spoiler_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.right_spoiler_pos_deg;
  A380PrimComputerFe_B.rudder_1_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.rudder_1_pos_deg;
  A380PrimComputerFe_B.rudder_2_pos_deg = A380PrimComputerFe_P.out_Y0.data.analog_inputs.rudder_2_pos_deg;
  A380PrimComputerFe_B.rudder_pedal_pos = A380PrimComputerFe_P.out_Y0.data.analog_inputs.rudder_pedal_pos;
  A380PrimComputerFe_B.yellow_hyd_pressure_psi = A380PrimComputerFe_P.out_Y0.data.analog_inputs.yellow_hyd_pressure_psi;
  A380PrimComputerFe_B.green_hyd_pressure_psi = A380PrimComputerFe_P.out_Y0.data.analog_inputs.green_hyd_pressure_psi;
  A380PrimComputerFe_B.vert_acc_1_g = A380PrimComputerFe_P.out_Y0.data.analog_inputs.vert_acc_1_g;
  A380PrimComputerFe_B.vert_acc_2_g = A380PrimComputerFe_P.out_Y0.data.analog_inputs.vert_acc_2_g;
  A380PrimComputerFe_B.vert_acc_3_g = A380PrimComputerFe_P.out_Y0.data.analog_inputs.vert_acc_3_g;
  A380PrimComputerFe_B.lat_acc_1_g = A380PrimComputerFe_P.out_Y0.data.analog_inputs.lat_acc_1_g;
  A380PrimComputerFe_B.lat_acc_2_g = A380PrimComputerFe_P.out_Y0.data.analog_inputs.lat_acc_2_g;
  A380PrimComputerFe_B.lat_acc_3_g = A380PrimComputerFe_P.out_Y0.data.analog_inputs.lat_acc_3_g;
  A380PrimComputerFe_B.left_body_wheel_speed = A380PrimComputerFe_P.out_Y0.data.analog_inputs.left_body_wheel_speed;
  A380PrimComputerFe_B.left_wing_wheel_speed = A380PrimComputerFe_P.out_Y0.data.analog_inputs.left_wing_wheel_speed;
  A380PrimComputerFe_B.right_body_wheel_speed = A380PrimComputerFe_P.out_Y0.data.analog_inputs.right_body_wheel_speed;
  A380PrimComputerFe_B.right_wing_wheel_speed = A380PrimComputerFe_P.out_Y0.data.analog_inputs.right_wing_wheel_speed;
  A380PrimComputerFe_B.SSM_ds4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
  A380PrimComputerFe_B.Data_e3r = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
  A380PrimComputerFe_B.SSM_n0 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM;
  A380PrimComputerFe_B.Data_oa = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data;
  A380PrimComputerFe_B.SSM_ow = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.mach.SSM;
  A380PrimComputerFe_B.Data_ce = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.mach.Data;
  A380PrimComputerFe_B.SSM_ay = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
  A380PrimComputerFe_B.Data_jz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
  A380PrimComputerFe_B.SSM_bdi = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
  A380PrimComputerFe_B.Data_me = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
  A380PrimComputerFe_B.SSM_dd4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
  A380PrimComputerFe_B.Data_nn1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
  A380PrimComputerFe_B.SSM_gu = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
  A380PrimComputerFe_B.Data_ni3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
  A380PrimComputerFe_B.SSM_ceq =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM;
  A380PrimComputerFe_B.Data_bun =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
  A380PrimComputerFe_B.SSM_dbe = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
  A380PrimComputerFe_B.Data_naq = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
  A380PrimComputerFe_B.SSM_b1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM;
  A380PrimComputerFe_B.Data_j43 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data;
  A380PrimComputerFe_B.SSM_d0 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.mach.SSM;
  A380PrimComputerFe_B.Data_po = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.mach.Data;
  A380PrimComputerFe_B.SSM_m5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
  A380PrimComputerFe_B.Data_ey = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
  A380PrimComputerFe_B.SSM_jli = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
  A380PrimComputerFe_B.Data_a3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
  A380PrimComputerFe_B.SSM_mxc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
  A380PrimComputerFe_B.Data_pey = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
  A380PrimComputerFe_B.SSM_ogm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
  A380PrimComputerFe_B.Data_kf = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
  A380PrimComputerFe_B.SSM_nlt =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM;
  A380PrimComputerFe_B.Data_hk1 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
  A380PrimComputerFe_B.SSM_dz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
  A380PrimComputerFe_B.Data_grt = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
  A380PrimComputerFe_B.SSM_oiy = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM;
  A380PrimComputerFe_B.Data_cmi = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data;
  A380PrimComputerFe_B.SSM = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.mach.SSM;
  A380PrimComputerFe_B.Data = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.mach.Data;
  A380PrimComputerFe_B.SSM_k = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
  A380PrimComputerFe_B.Data_f = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
  A380PrimComputerFe_B.SSM_kx = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
  A380PrimComputerFe_B.Data_fw = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
  A380PrimComputerFe_B.SSM_kxxtac0z = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
  A380PrimComputerFe_B.Data_fwxkftc3epgt =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
  A380PrimComputerFe_B.SSM_kb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
  A380PrimComputerFe_B.Data_a = A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
  A380PrimComputerFe_B.SSM_e =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM;
  A380PrimComputerFe_B.Data_eq =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
  A380PrimComputerFe_B.SSM_as = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.SSM;
  A380PrimComputerFe_B.Data_k0 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.Data;
  A380PrimComputerFe_B.SSM_bp = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.SSM;
  A380PrimComputerFe_B.Data_o5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.Data;
  A380PrimComputerFe_B.SSM_nd = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.SSM;
  A380PrimComputerFe_B.Data_od = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.Data;
  A380PrimComputerFe_B.SSM_lbo = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
  A380PrimComputerFe_B.Data_lu = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.Data;
  A380PrimComputerFe_B.SSM_me = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
  A380PrimComputerFe_B.Data_am = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
  A380PrimComputerFe_B.SSM_mj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.SSM;
  A380PrimComputerFe_B.Data_mo = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.Data;
  A380PrimComputerFe_B.SSM_a5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
  A380PrimComputerFe_B.Data_dg = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.Data;
  A380PrimComputerFe_B.SSM_bt = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
  A380PrimComputerFe_B.Data_e1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
  A380PrimComputerFe_B.SSM_om = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputerFe_B.Data_fp = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
  A380PrimComputerFe_B.SSM_ar = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
  A380PrimComputerFe_B.Data_ns = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
  A380PrimComputerFe_B.SSM_ce = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
  A380PrimComputerFe_B.Data_m3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.Data;
  A380PrimComputerFe_B.SSM_ed = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
  A380PrimComputerFe_B.Data_oj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
  A380PrimComputerFe_B.SSM_jh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
  A380PrimComputerFe_B.Data_jy = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
  A380PrimComputerFe_B.SSM_je = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
  A380PrimComputerFe_B.Data_j1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
  A380PrimComputerFe_B.SSM_jt = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
  A380PrimComputerFe_B.Data_fc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.Data;
  A380PrimComputerFe_B.SSM_cui = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_of = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_mq = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_lg = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_ni = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_n4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_df = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
  A380PrimComputerFe_B.Data_ot = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.Data;
  A380PrimComputerFe_B.SSM_oe = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
  A380PrimComputerFe_B.Data_gv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
  A380PrimComputerFe_B.SSM_ha = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
  A380PrimComputerFe_B.Data_ou = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
  A380PrimComputerFe_B.SSM_op = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_dh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_a50 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_ph = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_og = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_gs = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_a4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
  A380PrimComputerFe_B.Data_fd4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
  A380PrimComputerFe_B.SSM_bv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputerFe_B.Data_hm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
  A380PrimComputerFe_B.SSM_bo = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputerFe_B.Data_i2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputerFe_B.SSM_d1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
  A380PrimComputerFe_B.Data_og = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.Data;
  A380PrimComputerFe_B.SSM_hy = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputerFe_B.Data_fv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputerFe_B.SSM_gi = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
  A380PrimComputerFe_B.Data_oc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
  A380PrimComputerFe_B.SSM_pp = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
  A380PrimComputerFe_B.Data_kq = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
  A380PrimComputerFe_B.SSM_iab = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.SSM;
  A380PrimComputerFe_B.Data_ne = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.Data;
  A380PrimComputerFe_B.SSM_jtv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.SSM;
  A380PrimComputerFe_B.Data_it = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.Data;
  A380PrimComputerFe_B.SSM_fy = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.SSM;
  A380PrimComputerFe_B.Data_ch = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.Data;
  A380PrimComputerFe_B.SSM_d4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
  A380PrimComputerFe_B.Data_bb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.Data;
  A380PrimComputerFe_B.SSM_ars = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
  A380PrimComputerFe_B.Data_ol = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
  A380PrimComputerFe_B.SSM_din = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.SSM;
  A380PrimComputerFe_B.Data_hw = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.Data;
  A380PrimComputerFe_B.SSM_m3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
  A380PrimComputerFe_B.Data_hs = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.Data;
  A380PrimComputerFe_B.SSM_np = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
  A380PrimComputerFe_B.Data_fj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
  A380PrimComputerFe_B.SSM_ax = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputerFe_B.Data_ky = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
  A380PrimComputerFe_B.SSM_cl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
  A380PrimComputerFe_B.Data_h5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
  A380PrimComputerFe_B.SSM_es = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
  A380PrimComputerFe_B.Data_ku = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.Data;
  A380PrimComputerFe_B.SSM_gi1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
  A380PrimComputerFe_B.Data_jp = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
  A380PrimComputerFe_B.SSM_jz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
  A380PrimComputerFe_B.Data_nu = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
  A380PrimComputerFe_B.SSM_kt = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
  A380PrimComputerFe_B.Data_br = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
  A380PrimComputerFe_B.SSM_ds = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
  A380PrimComputerFe_B.Data_ae = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.Data;
  A380PrimComputerFe_B.SSM_eg = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_pe = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_a0 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_fy = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_cv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_na = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_ea = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
  A380PrimComputerFe_B.Data_my = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.Data;
  A380PrimComputerFe_B.SSM_p4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
  A380PrimComputerFe_B.Data_i4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
  A380PrimComputerFe_B.SSM_m2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
  A380PrimComputerFe_B.Data_cx = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
  A380PrimComputerFe_B.SSM_bt0 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_nz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_nr = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_id = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_fr = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_o2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_cc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
  A380PrimComputerFe_B.Data_gqq = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
  A380PrimComputerFe_B.SSM_lm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputerFe_B.Data_md = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
  A380PrimComputerFe_B.SSM_mkm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputerFe_B.Data_cz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputerFe_B.SSM_jhd = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
  A380PrimComputerFe_B.Data_pm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.Data;
  A380PrimComputerFe_B.SSM_av = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputerFe_B.Data_bj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputerFe_B.SSM_ira = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
  A380PrimComputerFe_B.Data_ox = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
  A380PrimComputerFe_B.SSM_ge = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
  A380PrimComputerFe_B.Data_pe5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
  A380PrimComputerFe_B.SSM_lv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.SSM;
  A380PrimComputerFe_B.Data_jj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.Data;
  A380PrimComputerFe_B.SSM_cg = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.SSM;
  A380PrimComputerFe_B.Data_p5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.Data;
  A380PrimComputerFe_B.SSM_be = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.SSM;
  A380PrimComputerFe_B.Data_ekl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.Data;
  A380PrimComputerFe_B.SSM_axb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
  A380PrimComputerFe_B.Data_nd = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.Data;
  A380PrimComputerFe_B.SSM_nz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
  A380PrimComputerFe_B.Data_n2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
  A380PrimComputerFe_B.SSM_cx = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.SSM;
  A380PrimComputerFe_B.Data_dl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.Data;
  A380PrimComputerFe_B.SSM_gh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
  A380PrimComputerFe_B.Data_gs2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.Data;
  A380PrimComputerFe_B.SSM_ks = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
  A380PrimComputerFe_B.Data_h4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
  A380PrimComputerFe_B.SSM_pw = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputerFe_B.Data_e3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
  A380PrimComputerFe_B.SSM_fh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
  A380PrimComputerFe_B.Data_f5h = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
  A380PrimComputerFe_B.SSM_gzn = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
  A380PrimComputerFe_B.Data_an = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.Data;
  A380PrimComputerFe_B.SSM_oo = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
  A380PrimComputerFe_B.Data_i4o = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
  A380PrimComputerFe_B.SSM_evh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
  A380PrimComputerFe_B.Data_af = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
  A380PrimComputerFe_B.SSM_cn = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
  A380PrimComputerFe_B.Data_bm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
  A380PrimComputerFe_B.SSM_co = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
  A380PrimComputerFe_B.Data_dk = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.Data;
  A380PrimComputerFe_B.SSM_pe = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_nv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_cgz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_jpf = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_fw = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_i5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_h4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
  A380PrimComputerFe_B.Data_k2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.Data;
  A380PrimComputerFe_B.SSM_cb3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
  A380PrimComputerFe_B.Data_as = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
  A380PrimComputerFe_B.SSM_pj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
  A380PrimComputerFe_B.Data_gk = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
  A380PrimComputerFe_B.SSM_dv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_jl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_i4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_e32 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_fm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputerFe_B.Data_ih = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
  A380PrimComputerFe_B.SSM_e5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
  A380PrimComputerFe_B.Data_du = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
  A380PrimComputerFe_B.SSM_bf = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputerFe_B.Data_nx = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
  A380PrimComputerFe_B.SSM_fd = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputerFe_B.Data_n0 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputerFe_B.SSM_fv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
  A380PrimComputerFe_B.Data_eqi = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.Data;
  A380PrimComputerFe_B.SSM_dt = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputerFe_B.Data_om = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputerFe_B.SSM_j5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
  A380PrimComputerFe_B.Data_nr = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
  A380PrimComputerFe_B.SSM_ng = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
  A380PrimComputerFe_B.Data_p3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
  A380PrimComputerFe_B.isis_1_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.isis_1_bus;
  A380PrimComputerFe_B.isis_2_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.isis_2_bus;
  A380PrimComputerFe_B.rate_gyro_pitch_1_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.rate_gyro_pitch_1_bus;
  A380PrimComputerFe_B.rate_gyro_pitch_2_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.rate_gyro_pitch_2_bus;
  A380PrimComputerFe_B.rate_gyro_roll_1_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.rate_gyro_roll_1_bus;
  A380PrimComputerFe_B.rate_gyro_roll_2_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.rate_gyro_roll_2_bus;
  A380PrimComputerFe_B.rate_gyro_yaw_1_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.rate_gyro_yaw_1_bus;
  A380PrimComputerFe_B.rate_gyro_yaw_2_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.rate_gyro_yaw_2_bus;
  A380PrimComputerFe_B.SSM_cs = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ra_1_bus.radio_height_ft.SSM;
  A380PrimComputerFe_B.Data_nb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ra_1_bus.radio_height_ft.Data;
  A380PrimComputerFe_B.SSM_ls = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ra_2_bus.radio_height_ft.SSM;
  A380PrimComputerFe_B.Data_hd = A380PrimComputerFe_P.out_Y0.data.bus_inputs.ra_2_bus.radio_height_ft.Data;
  A380PrimComputerFe_B.SSM_dg =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
  A380PrimComputerFe_B.Data_al =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
  A380PrimComputerFe_B.SSM_d3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
  A380PrimComputerFe_B.Data_gu =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
  A380PrimComputerFe_B.SSM_p2 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
  A380PrimComputerFe_B.Data_ix =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
  A380PrimComputerFe_B.SSM_bo0 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
  A380PrimComputerFe_B.Data_do = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
  A380PrimComputerFe_B.SSM_bc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
  A380PrimComputerFe_B.Data_hu = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
  A380PrimComputerFe_B.SSM_h0 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
  A380PrimComputerFe_B.Data_pm1 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
  A380PrimComputerFe_B.SSM_giz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
  A380PrimComputerFe_B.Data_i2y =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
  A380PrimComputerFe_B.SSM_mqp =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
  A380PrimComputerFe_B.Data_pg =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
  A380PrimComputerFe_B.SSM_ba = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
  A380PrimComputerFe_B.Data_ni = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
  A380PrimComputerFe_B.SSM_in = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
  A380PrimComputerFe_B.Data_fr = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
  A380PrimComputerFe_B.SSM_ff = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM;
  A380PrimComputerFe_B.Data_cn = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_1.Data;
  A380PrimComputerFe_B.SSM_ic = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_2.SSM;
  A380PrimComputerFe_B.Data_nxl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_2.Data;
  A380PrimComputerFe_B.SSM_fs = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_3.SSM;
  A380PrimComputerFe_B.Data_jh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_3.Data;
  A380PrimComputerFe_B.SSM_ja = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_4.SSM;
  A380PrimComputerFe_B.Data_gl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_4.Data;
  A380PrimComputerFe_B.SSM_js = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM;
  A380PrimComputerFe_B.Data_gn = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_1.Data;
  A380PrimComputerFe_B.SSM_is3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_2.SSM;
  A380PrimComputerFe_B.Data_myb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_2.Data;
  A380PrimComputerFe_B.SSM_ag = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_3.SSM;
  A380PrimComputerFe_B.Data_l2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_3.Data;
  A380PrimComputerFe_B.SSM_f5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_4.SSM;
  A380PrimComputerFe_B.Data_o5o = A380PrimComputerFe_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_4.Data;
  A380PrimComputerFe_B.irdc_1_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.irdc_1_bus;
  A380PrimComputerFe_B.irdc_2_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.irdc_2_bus;
  A380PrimComputerFe_B.irdc_3_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.irdc_3_bus;
  A380PrimComputerFe_B.irdc_4_a_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.irdc_4_a_bus;
  A380PrimComputerFe_B.irdc_4_b_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.irdc_4_b_bus;
  A380PrimComputerFe_B.fcu_own_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.fcu_own_bus;
  A380PrimComputerFe_B.fcu_opp_bus = A380PrimComputerFe_P.out_Y0.data.bus_inputs.fcu_opp_bus;
  A380PrimComputerFe_B.SSM_ph =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_l5 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_jw =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_dc2 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_jy =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_gr =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_j1 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_gp =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_ov =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_i3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_mx =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_et =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_b4 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.SSM;
  A380PrimComputerFe_B.Data_mc =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.Data;
  A380PrimComputerFe_B.SSM_gb =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.SSM;
  A380PrimComputerFe_B.Data_k3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.Data;
  A380PrimComputerFe_B.SSM_oh =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.SSM;
  A380PrimComputerFe_B.Data_f2 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.Data;
  A380PrimComputerFe_B.SSM_mm5 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.SSM;
  A380PrimComputerFe_B.Data_gh =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.Data;
  A380PrimComputerFe_B.SSM_br =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.SSM;
  A380PrimComputerFe_B.Data_ed =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.Data;
  A380PrimComputerFe_B.SSM_c2 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.SSM;
  A380PrimComputerFe_B.Data_o2j =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.Data;
  A380PrimComputerFe_B.SSM_hc =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.SSM;
  A380PrimComputerFe_B.Data_i43 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.Data;
  A380PrimComputerFe_B.SSM_ktr =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.SSM;
  A380PrimComputerFe_B.Data_ic =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.Data;
  A380PrimComputerFe_B.SSM_gl =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.SSM;
  A380PrimComputerFe_B.Data_ak =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.Data;
  A380PrimComputerFe_B.SSM_my =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.SSM;
  A380PrimComputerFe_B.Data_jg =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.Data;
  A380PrimComputerFe_B.SSM_j3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.SSM;
  A380PrimComputerFe_B.Data_cu =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.Data;
  A380PrimComputerFe_B.SSM_go =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.SSM;
  A380PrimComputerFe_B.Data_ep =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.Data;
  A380PrimComputerFe_B.SSM_e5c =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.SSM;
  A380PrimComputerFe_B.Data_d3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.Data;
  A380PrimComputerFe_B.SSM_dk =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.SSM;
  A380PrimComputerFe_B.Data_bt =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.Data;
  A380PrimComputerFe_B.SSM_evc =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.SSM;
  A380PrimComputerFe_B.Data_e0 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.Data;
  A380PrimComputerFe_B.SSM_kk =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.SSM;
  A380PrimComputerFe_B.Data_jl3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.Data;
  A380PrimComputerFe_B.SSM_af =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_nm =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_npr =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_ia =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_ew =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_j0 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_lt =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_bs =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_ger = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.SSM;
  A380PrimComputerFe_B.Data_hp = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.Data;
  A380PrimComputerFe_B.SSM_pxo =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.SSM;
  A380PrimComputerFe_B.Data_ct =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.Data;
  A380PrimComputerFe_B.SSM_co2 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.SSM;
  A380PrimComputerFe_B.Data_pc =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.Data;
  A380PrimComputerFe_B.SSM_ny =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_nzt =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_l4 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_c0 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_nm =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_ojg =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_nh =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_lm =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_dl =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.SSM;
  A380PrimComputerFe_B.Data_fz =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.Data;
  A380PrimComputerFe_B.SSM_dx = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.SSM;
  A380PrimComputerFe_B.Data_oz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.Data;
  A380PrimComputerFe_B.SSM_a5h =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_gf =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_fl =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_nn =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_p3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_a0z =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_ns =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_fk =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_bm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.SSM;
  A380PrimComputerFe_B.Data_bu = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.Data;
  A380PrimComputerFe_B.SSM_nl =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.SSM;
  A380PrimComputerFe_B.Data_o23 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.Data;
  A380PrimComputerFe_B.SSM_grm =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.SSM;
  A380PrimComputerFe_B.Data_g3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.Data;
  A380PrimComputerFe_B.SSM_gzm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.SSM;
  A380PrimComputerFe_B.Data_icc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.Data;
  A380PrimComputerFe_B.SSM_oi = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_pwf =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_aa = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_gvk =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_fvk = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.SSM;
  A380PrimComputerFe_B.Data_ln =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.Data;
  A380PrimComputerFe_B.SSM_lw = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.SSM;
  A380PrimComputerFe_B.Data_ka = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.Data;
  A380PrimComputerFe_B.SSM_fa = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.SSM;
  A380PrimComputerFe_B.Data_mp = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.Data;
  A380PrimComputerFe_B.SSM_lbx = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_m4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_n3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_fki = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_a1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.SSM;
  A380PrimComputerFe_B.Data_bv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.Data;
  A380PrimComputerFe_B.SSM_p1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.SSM;
  A380PrimComputerFe_B.Data_m21 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.Data;
  A380PrimComputerFe_B.SSM_cn2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.SSM;
  A380PrimComputerFe_B.Data_nbg = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.Data;
  A380PrimComputerFe_B.SSM_an3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.SSM;
  A380PrimComputerFe_B.Data_l25 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.Data;
  A380PrimComputerFe_B.SSM_c3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.fe_status_word.SSM;
  A380PrimComputerFe_B.Data_ki = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.fe_status_word.Data;
  A380PrimComputerFe_B.SSM_dp = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.fg_status_word.SSM;
  A380PrimComputerFe_B.Data_p5p = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.fg_status_word.Data;
  A380PrimComputerFe_B.SSM_boy = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.SSM;
  A380PrimComputerFe_B.Data_nry = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.Data;
  A380PrimComputerFe_B.SSM_lg = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.SSM;
  A380PrimComputerFe_B.Data_mh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.Data;
  A380PrimComputerFe_B.SSM_cm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.SSM;
  A380PrimComputerFe_B.Data_ll = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.Data;
  A380PrimComputerFe_B.SSM_hl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.SSM;
  A380PrimComputerFe_B.Data_hy = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.Data;
  A380PrimComputerFe_B.SSM_irh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.SSM;
  A380PrimComputerFe_B.Data_j04 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.Data;
  A380PrimComputerFe_B.SSM_b42 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.SSM;
  A380PrimComputerFe_B.Data_pf = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.Data;
  A380PrimComputerFe_B.SSM_anz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_ls_kn.SSM;
  A380PrimComputerFe_B.Data_pl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_ls_kn.Data;
  A380PrimComputerFe_B.SSM_d2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_stall_kn.SSM;
  A380PrimComputerFe_B.Data_gb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_stall_kn.Data;
  A380PrimComputerFe_B.SSM_gov = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.SSM;
  A380PrimComputerFe_B.Data_hq = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.Data;
  A380PrimComputerFe_B.SSM_nb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_3_kn.SSM;
  A380PrimComputerFe_B.Data_ai = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_3_kn.Data;
  A380PrimComputerFe_B.SSM_pe3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_4_kn.SSM;
  A380PrimComputerFe_B.Data_gfr = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_4_kn.Data;
  A380PrimComputerFe_B.SSM_jj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_man_kn.SSM;
  A380PrimComputerFe_B.Data_czp = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_man_kn.Data;
  A380PrimComputerFe_B.SSM_jx = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_max_kn.SSM;
  A380PrimComputerFe_B.Data_fm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_max_kn.Data;
  A380PrimComputerFe_B.SSM_npl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.SSM;
  A380PrimComputerFe_B.Data_jsg = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.Data;
  A380PrimComputerFe_B.SSM_gf = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.discrete_word_1.SSM;
  A380PrimComputerFe_B.Data_g1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_x_bus.fe.discrete_word_1.Data;
  A380PrimComputerFe_B.SSM_gbi =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_j4 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_fhm =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_jyh =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_ltj =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_e4 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_hn =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_ghs =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_h3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_bmk =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_bfs =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_lzt =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_p0 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.SSM;
  A380PrimComputerFe_B.Data_kn =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.Data;
  A380PrimComputerFe_B.SSM_fu =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.SSM;
  A380PrimComputerFe_B.Data_nab =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.Data;
  A380PrimComputerFe_B.SSM_hr =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.SSM;
  A380PrimComputerFe_B.Data_lgf =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.Data;
  A380PrimComputerFe_B.SSM_bi =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.SSM;
  A380PrimComputerFe_B.Data_fpq =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.Data;
  A380PrimComputerFe_B.SSM_bd =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.SSM;
  A380PrimComputerFe_B.Data_dt =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.Data;
  A380PrimComputerFe_B.SSM_omt =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.SSM;
  A380PrimComputerFe_B.Data_b1 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.Data;
  A380PrimComputerFe_B.SSM_la =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.SSM;
  A380PrimComputerFe_B.Data_nmr =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.Data;
  A380PrimComputerFe_B.SSM_l1 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.SSM;
  A380PrimComputerFe_B.Data_ea =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.Data;
  A380PrimComputerFe_B.SSM_dy =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.SSM;
  A380PrimComputerFe_B.Data_nib =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.Data;
  A380PrimComputerFe_B.SSM_ie =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.SSM;
  A380PrimComputerFe_B.Data_i2t =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.Data;
  A380PrimComputerFe_B.SSM_kf =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.SSM;
  A380PrimComputerFe_B.Data_ng =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.Data;
  A380PrimComputerFe_B.SSM_p5l =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.SSM;
  A380PrimComputerFe_B.Data_h31 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.Data;
  A380PrimComputerFe_B.SSM_g3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.SSM;
  A380PrimComputerFe_B.Data_ew =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.Data;
  A380PrimComputerFe_B.SSM_b3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.SSM;
  A380PrimComputerFe_B.Data_j1s =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.Data;
  A380PrimComputerFe_B.SSM_dxv =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.SSM;
  A380PrimComputerFe_B.Data_j5 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.Data;
  A380PrimComputerFe_B.SSM_mxz =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.SSM;
  A380PrimComputerFe_B.Data_cw =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.Data;
  A380PrimComputerFe_B.SSM_kk4 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_gqa =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_cy =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_hz =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_ju =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_fri =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_ey =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_cm =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_jr = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.SSM;
  A380PrimComputerFe_B.Data_czj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.Data;
  A380PrimComputerFe_B.SSM_hs = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.SSM;
  A380PrimComputerFe_B.Data_mb =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.Data;
  A380PrimComputerFe_B.SSM_mx3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.SSM;
  A380PrimComputerFe_B.Data_gk4 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.Data;
  A380PrimComputerFe_B.SSM_er =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_gbt =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_hm =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_p0 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_dm =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_dn =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_fk =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_iyw =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_lm1 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.SSM;
  A380PrimComputerFe_B.Data_p5d =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.Data;
  A380PrimComputerFe_B.SSM_nc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.SSM;
  A380PrimComputerFe_B.Data_oo = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.Data;
  A380PrimComputerFe_B.SSM_e4 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_ho =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_bw =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_kqr =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_na =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_omv =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_lf =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_mby =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_oz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.SSM;
  A380PrimComputerFe_B.Data_hk = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.Data;
  A380PrimComputerFe_B.SSM_mub =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.SSM;
  A380PrimComputerFe_B.Data_hg =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.Data;
  A380PrimComputerFe_B.SSM_li =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.SSM;
  A380PrimComputerFe_B.Data_bi =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.Data;
  A380PrimComputerFe_B.SSM_hcd = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.SSM;
  A380PrimComputerFe_B.Data_i4u = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.Data;
  A380PrimComputerFe_B.SSM_php = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_ik =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_ma = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_dq =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_jut = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.SSM;
  A380PrimComputerFe_B.Data_pv =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.Data;
  A380PrimComputerFe_B.SSM_kh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.SSM;
  A380PrimComputerFe_B.Data_p1d = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.Data;
  A380PrimComputerFe_B.SSM_h2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.SSM;
  A380PrimComputerFe_B.Data_lyv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.Data;
  A380PrimComputerFe_B.SSM_ago = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_ke = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_ep = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_cv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_kc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.SSM;
  A380PrimComputerFe_B.Data_pfh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.Data;
  A380PrimComputerFe_B.SSM_cnf = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.SSM;
  A380PrimComputerFe_B.Data_jy4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.Data;
  A380PrimComputerFe_B.SSM_lwa = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.SSM;
  A380PrimComputerFe_B.Data_o1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.Data;
  A380PrimComputerFe_B.SSM_aq = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.SSM;
  A380PrimComputerFe_B.Data_ga = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.Data;
  A380PrimComputerFe_B.SSM_ja2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.fe_status_word.SSM;
  A380PrimComputerFe_B.Data_kd = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.fe_status_word.Data;
  A380PrimComputerFe_B.SSM_in3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.fg_status_word.SSM;
  A380PrimComputerFe_B.Data_fx = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.fg_status_word.Data;
  A380PrimComputerFe_B.SSM_ap = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.SSM;
  A380PrimComputerFe_B.Data_nml = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.Data;
  A380PrimComputerFe_B.SSM_mg = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.SSM;
  A380PrimComputerFe_B.Data_fa = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.Data;
  A380PrimComputerFe_B.SSM_mw = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.SSM;
  A380PrimComputerFe_B.Data_nh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.Data;
  A380PrimComputerFe_B.SSM_bu = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.SSM;
  A380PrimComputerFe_B.Data_or = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.Data;
  A380PrimComputerFe_B.SSM_cbb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.SSM;
  A380PrimComputerFe_B.Data_otn = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.Data;
  A380PrimComputerFe_B.SSM_iao = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.SSM;
  A380PrimComputerFe_B.Data_cam = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.Data;
  A380PrimComputerFe_B.SSM_ip = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_ls_kn.SSM;
  A380PrimComputerFe_B.Data_gsl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_ls_kn.Data;
  A380PrimComputerFe_B.SSM_f4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_stall_kn.SSM;
  A380PrimComputerFe_B.Data_amp = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_stall_kn.Data;
  A380PrimComputerFe_B.SSM_id = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.SSM;
  A380PrimComputerFe_B.Data_mv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.Data;
  A380PrimComputerFe_B.SSM_mqr = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_3_kn.SSM;
  A380PrimComputerFe_B.Data_gx = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_3_kn.Data;
  A380PrimComputerFe_B.SSM_cm2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_4_kn.SSM;
  A380PrimComputerFe_B.Data_lb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_4_kn.Data;
  A380PrimComputerFe_B.SSM_ck = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_man_kn.SSM;
  A380PrimComputerFe_B.Data_can = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_man_kn.Data;
  A380PrimComputerFe_B.SSM_pl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_max_kn.SSM;
  A380PrimComputerFe_B.Data_gae = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_max_kn.Data;
  A380PrimComputerFe_B.SSM_d50 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.SSM;
  A380PrimComputerFe_B.Data_h1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.Data;
  A380PrimComputerFe_B.SSM_gs = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.discrete_word_1.SSM;
  A380PrimComputerFe_B.Data_bc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.prim_y_bus.fe.discrete_word_1.Data;
  A380PrimComputerFe_B.SSM_kse =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_fof =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_icj =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_nj =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_gbf =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_i0 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_opv =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_lr =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_gha = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputerFe_B.Data_k0s = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.Data;
  A380PrimComputerFe_B.SSM_ple = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.aileron_status_word.SSM;
  A380PrimComputerFe_B.Data_m4b = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.aileron_status_word.Data;
  A380PrimComputerFe_B.SSM_h0n = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_au = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_c1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_czc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_dd = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_itz =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_ai = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_nsk =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_at = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.spoiler_status_word.SSM;
  A380PrimComputerFe_B.Data_is = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.spoiler_status_word.Data;
  A380PrimComputerFe_B.SSM_bz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_pk = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_haz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_f52 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_hz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_dg0 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_hk = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_nru =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_cvn = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_status_word.SSM;
  A380PrimComputerFe_B.Data_d5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_status_word.Data;
  A380PrimComputerFe_B.SSM_iy = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_bp = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_jwz = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_cl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_o2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_3_position_deg.SSM;
  A380PrimComputerFe_B.Data_er = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_3_position_deg.Data;
  A380PrimComputerFe_B.SSM_eig = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.ths_position_deg.SSM;
  A380PrimComputerFe_B.Data_in = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.ths_position_deg.Data;
  A380PrimComputerFe_B.SSM_jl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_status_word.SSM;
  A380PrimComputerFe_B.Data_btl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_status_word.Data;
  A380PrimComputerFe_B.SSM_cci = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_a5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_bcj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_hyo = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_i5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.SSM;
  A380PrimComputerFe_B.Data_bjx = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.Data;
  A380PrimComputerFe_B.SSM_jww = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.fctl_law_status_word.SSM;
  A380PrimComputerFe_B.Data_ci = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.fctl_law_status_word.Data;
  A380PrimComputerFe_B.SSM_kkj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.misc_data_status_word.SSM;
  A380PrimComputerFe_B.Data_h2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_1_bus.misc_data_status_word.Data;
  A380PrimComputerFe_B.SSM_ndh =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_dx =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_k1 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_fvi =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_en3 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_gnm =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_kl =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_e3y =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_po = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputerFe_B.Data_ld = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.Data;
  A380PrimComputerFe_B.SSM_ie0 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.aileron_status_word.SSM;
  A380PrimComputerFe_B.Data_k3v = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.aileron_status_word.Data;
  A380PrimComputerFe_B.SSM_gsb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_oi = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_mxy = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_oy = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_gt = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_nl = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_cum = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_aei =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_ka = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.spoiler_status_word.SSM;
  A380PrimComputerFe_B.Data_pwfb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.spoiler_status_word.Data;
  A380PrimComputerFe_B.SSM_lu = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_la = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_c5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_b0 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_ol = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_g5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_k2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_os = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_gn = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_status_word.SSM;
  A380PrimComputerFe_B.Data_btc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_status_word.Data;
  A380PrimComputerFe_B.SSM_lil = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_nhn = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_lmv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_im = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_ig = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_3_position_deg.SSM;
  A380PrimComputerFe_B.Data_no = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_3_position_deg.Data;
  A380PrimComputerFe_B.SSM_ch = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.ths_position_deg.SSM;
  A380PrimComputerFe_B.Data_av = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.ths_position_deg.Data;
  A380PrimComputerFe_B.SSM_ef = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_status_word.SSM;
  A380PrimComputerFe_B.Data_hc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_status_word.Data;
  A380PrimComputerFe_B.SSM_dbs = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_f5c = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_ilr = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_iu = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_ch3 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.SSM;
  A380PrimComputerFe_B.Data_ihf = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.Data;
  A380PrimComputerFe_B.SSM_ozd = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.fctl_law_status_word.SSM;
  A380PrimComputerFe_B.Data_ao = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.fctl_law_status_word.Data;
  A380PrimComputerFe_B.SSM_ob = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.misc_data_status_word.SSM;
  A380PrimComputerFe_B.Data_c2 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_2_bus.misc_data_status_word.Data;
  A380PrimComputerFe_B.SSM_ps =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_f1 =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_agc =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_nst =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_nt =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_fq =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_oa =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_amc =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_oj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputerFe_B.Data_b0d = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.Data;
  A380PrimComputerFe_B.SSM_lq = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.aileron_status_word.SSM;
  A380PrimComputerFe_B.Data_bri = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.aileron_status_word.Data;
  A380PrimComputerFe_B.SSM_fc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_nmx = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_do = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_oal = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_eu = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_dmb =
    A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_pjf = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_nf = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_jsu = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.spoiler_status_word.SSM;
  A380PrimComputerFe_B.Data_anh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.spoiler_status_word.Data;
  A380PrimComputerFe_B.SSM_eb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_idf = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_dbu = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_gm = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_hh = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_jqv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_jsuo = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_d1 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_dj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_status_word.SSM;
  A380PrimComputerFe_B.Data_dv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_status_word.Data;
  A380PrimComputerFe_B.SSM_oio = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_oq4 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_ewd = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_fb = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_pjk = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_3_position_deg.SSM;
  A380PrimComputerFe_B.Data_bsv = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_3_position_deg.Data;
  A380PrimComputerFe_B.SSM_j3l = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.ths_position_deg.SSM;
  A380PrimComputerFe_B.Data_nt = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.ths_position_deg.Data;
  A380PrimComputerFe_B.SSM_d4h = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_status_word.SSM;
  A380PrimComputerFe_B.Data_ac = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_status_word.Data;
  A380PrimComputerFe_B.SSM_dc = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_dcn = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_obg = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_joe = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_b5 = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.SSM;
  A380PrimComputerFe_B.Data_nol = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.Data;
  A380PrimComputerFe_B.SSM_al = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.fctl_law_status_word.SSM;
  A380PrimComputerFe_B.Data_ge = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.fctl_law_status_word.Data;
  A380PrimComputerFe_B.SSM_hib = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.misc_data_status_word.SSM;
  A380PrimComputerFe_B.Data_mj = A380PrimComputerFe_P.out_Y0.data.bus_inputs.sec_3_bus.misc_data_status_word.Data;
  A380PrimComputerFe_B.ap_engaged = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.ap_engaged;
  A380PrimComputerFe_B.ap_1_engaged = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.ap_1_engaged;
  A380PrimComputerFe_B.ap_2_engaged = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.ap_2_engaged;
  A380PrimComputerFe_B.athr_engaged = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.athr_engaged;
  A380PrimComputerFe_B.roll_command = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.roll_command;
  A380PrimComputerFe_B.pitch_command = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.pitch_command;
  A380PrimComputerFe_B.yaw_command = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.yaw_command;
  A380PrimComputerFe_B.lateral_mode = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.lateral_mode;
  A380PrimComputerFe_B.lateral_mode_armed = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.lateral_mode_armed;
  A380PrimComputerFe_B.vertical_mode = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.vertical_mode;
  A380PrimComputerFe_B.vertical_mode_armed = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.vertical_mode_armed;
  A380PrimComputerFe_B.weight_lbs = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.weight_lbs;
  A380PrimComputerFe_B.cg_percent = A380PrimComputerFe_P.out_Y0.data.temporary_ap_input.cg_percent;
  A380PrimComputerFe_B.on_ground = A380PrimComputerFe_P.out_Y0.general_logic.on_ground;
  A380PrimComputerFe_B.tracking_mode_on = A380PrimComputerFe_P.out_Y0.general_logic.tracking_mode_on;
  A380PrimComputerFe_B.double_adr_failure = A380PrimComputerFe_P.out_Y0.general_logic.double_adr_failure;
  A380PrimComputerFe_B.triple_adr_failure = A380PrimComputerFe_P.out_Y0.general_logic.triple_adr_failure;
  A380PrimComputerFe_B.cas_or_mach_disagree = A380PrimComputerFe_P.out_Y0.general_logic.cas_or_mach_disagree;
  A380PrimComputerFe_B.alpha_disagree = A380PrimComputerFe_P.out_Y0.general_logic.alpha_disagree;
  A380PrimComputerFe_B.double_ir_failure = A380PrimComputerFe_P.out_Y0.general_logic.double_ir_failure;
  A380PrimComputerFe_B.triple_ir_failure = A380PrimComputerFe_P.out_Y0.general_logic.triple_ir_failure;
  A380PrimComputerFe_B.ir_failure_not_self_detected =
    A380PrimComputerFe_P.out_Y0.general_logic.ir_failure_not_self_detected;
  A380PrimComputerFe_B.V_ias_kn = A380PrimComputerFe_P.out_Y0.general_logic.adr_computation_data.V_ias_kn;
  A380PrimComputerFe_B.V_tas_kn = A380PrimComputerFe_P.out_Y0.general_logic.adr_computation_data.V_tas_kn;
  A380PrimComputerFe_B.mach = A380PrimComputerFe_P.out_Y0.general_logic.adr_computation_data.mach;
  A380PrimComputerFe_B.alpha_deg = A380PrimComputerFe_P.out_Y0.general_logic.adr_computation_data.alpha_deg;
  A380PrimComputerFe_B.p_s_c_hpa = A380PrimComputerFe_P.out_Y0.general_logic.adr_computation_data.p_s_c_hpa;
  A380PrimComputerFe_B.altitude_corrected_ft =
    A380PrimComputerFe_P.out_Y0.general_logic.adr_computation_data.altitude_corrected_ft;
  A380PrimComputerFe_B.theta_deg = A380PrimComputerFe_P.out_Y0.general_logic.ir_computation_data.theta_deg;
  A380PrimComputerFe_B.phi_deg = A380PrimComputerFe_P.out_Y0.general_logic.ir_computation_data.phi_deg;
  A380PrimComputerFe_B.q_deg_s = A380PrimComputerFe_P.out_Y0.general_logic.ir_computation_data.q_deg_s;
  A380PrimComputerFe_B.r_deg_s = A380PrimComputerFe_P.out_Y0.general_logic.ir_computation_data.r_deg_s;
  A380PrimComputerFe_B.n_x_g = A380PrimComputerFe_P.out_Y0.general_logic.ir_computation_data.n_x_g;
  A380PrimComputerFe_B.n_y_g = A380PrimComputerFe_P.out_Y0.general_logic.ir_computation_data.n_y_g;
  A380PrimComputerFe_B.n_z_g = A380PrimComputerFe_P.out_Y0.general_logic.ir_computation_data.n_z_g;
  A380PrimComputerFe_B.theta_dot_deg_s = A380PrimComputerFe_P.out_Y0.general_logic.ir_computation_data.theta_dot_deg_s;
  A380PrimComputerFe_B.phi_dot_deg_s = A380PrimComputerFe_P.out_Y0.general_logic.ir_computation_data.phi_dot_deg_s;
  A380PrimComputerFe_B.ra_computation_data_ft = A380PrimComputerFe_P.out_Y0.general_logic.ra_computation_data_ft;
  A380PrimComputerFe_B.two_ra_failure = A380PrimComputerFe_P.out_Y0.general_logic.two_ra_failure;
  A380PrimComputerFe_B.all_ra_failure = A380PrimComputerFe_P.out_Y0.general_logic.all_ra_failure;
  A380PrimComputerFe_B.all_sfcc_lost = A380PrimComputerFe_P.out_Y0.general_logic.all_sfcc_lost;
  A380PrimComputerFe_B.flap_handle_index = A380PrimComputerFe_P.out_Y0.general_logic.flap_handle_index;
  A380PrimComputerFe_B.flap_angle_deg = A380PrimComputerFe_P.out_Y0.general_logic.flap_angle_deg;
  A380PrimComputerFe_B.slat_angle_deg = A380PrimComputerFe_P.out_Y0.general_logic.slat_angle_deg;
  A380PrimComputerFe_B.slat_flap_actual_pos = A380PrimComputerFe_P.out_Y0.general_logic.slat_flap_actual_pos;
  A380PrimComputerFe_B.flap_surface_angle_deg = A380PrimComputerFe_P.out_Y0.general_logic.flap_surface_angle_deg;
  A380PrimComputerFe_B.slat_surface_angle_deg = A380PrimComputerFe_P.out_Y0.general_logic.slat_surface_angle_deg;
  A380PrimComputerFe_B.double_lgciu_failure = A380PrimComputerFe_P.out_Y0.general_logic.double_lgciu_failure;
  A380PrimComputerFe_B.slats_locked = A380PrimComputerFe_P.out_Y0.general_logic.slats_locked;
  A380PrimComputerFe_B.flaps_locked = A380PrimComputerFe_P.out_Y0.general_logic.flaps_locked;
  A380PrimComputerFe_B.landing_gear_down = A380PrimComputerFe_P.out_Y0.general_logic.landing_gear_down;
  A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport2Outport1 =
    A380PrimComputerFe_P.out_Y0.flight_envelope.beta_target_deg;
  A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1 =
    A380PrimComputerFe_P.out_Y0.flight_envelope.beta_target_visible;
  A380PrimComputerFe_Y.out.flight_envelope.alpha_floor_condition =
    A380PrimComputerFe_P.out_Y0.flight_envelope.alpha_floor_condition;
  A380PrimComputerFe_B.computed_weight_lbs = A380PrimComputerFe_P.out_Y0.flight_envelope.computed_weight_lbs;
  A380PrimComputerFe_B.computed_cg_percent = A380PrimComputerFe_P.out_Y0.flight_envelope.computed_cg_percent;
  A380PrimComputerFe_Y.out.flight_envelope.speed_scale_lost =
    A380PrimComputerFe_P.out_Y0.flight_envelope.speed_scale_lost;
  A380PrimComputerFe_Y.out.flight_envelope.speed_scale_visible =
    A380PrimComputerFe_P.out_Y0.flight_envelope.speed_scale_visible;
  A380PrimComputerFe_Y.out.flight_envelope.v_ls_kn = A380PrimComputerFe_P.out_Y0.flight_envelope.v_ls_kn;
  A380PrimComputerFe_B.Y = A380PrimComputerFe_P.out_Y0.flight_envelope.v_stall_kn;
  A380PrimComputerFe_Y.out.flight_envelope.v_3_kn = A380PrimComputerFe_P.out_Y0.flight_envelope.v_3_kn;
  A380PrimComputerFe_Y.out.flight_envelope.v_3_visible = A380PrimComputerFe_P.out_Y0.flight_envelope.v_3_visible;
  A380PrimComputerFe_Y.out.flight_envelope.v_4_kn = A380PrimComputerFe_P.out_Y0.flight_envelope.v_4_kn;
  A380PrimComputerFe_Y.out.flight_envelope.v_4_visible = A380PrimComputerFe_P.out_Y0.flight_envelope.v_4_visible;
  A380PrimComputerFe_Y.out.flight_envelope.v_man_kn = A380PrimComputerFe_P.out_Y0.flight_envelope.v_man_kn;
  A380PrimComputerFe_Y.out.flight_envelope.v_man_visible = A380PrimComputerFe_P.out_Y0.flight_envelope.v_man_visible;
  A380PrimComputerFe_Y.out.flight_envelope.v_max_kn = A380PrimComputerFe_P.out_Y0.flight_envelope.v_max_kn;
  A380PrimComputerFe_Y.out.flight_envelope.v_fe_next_kn = A380PrimComputerFe_P.out_Y0.flight_envelope.v_fe_next_kn;
  A380PrimComputerFe_Y.out.flight_envelope.v_fe_next_visible =
    A380PrimComputerFe_P.out_Y0.flight_envelope.v_fe_next_visible;
  A380PrimComputerFe_Y.out.flight_envelope.v_c_trend_kn = A380PrimComputerFe_P.out_Y0.flight_envelope.v_c_trend_kn;
  A380PrimComputerFe_Y.out.flight_envelope.gamma_a_deg = A380PrimComputerFe_P.out_Y0.flight_envelope.gamma_a_deg;
  A380PrimComputerFe_Y.out.flight_envelope.gamma_t_deg = A380PrimComputerFe_P.out_Y0.flight_envelope.gamma_t_deg;
  A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport2Outport1_bq =
    A380PrimComputerFe_P.out_Y0.flight_envelope.pitch_pitch_warning_active;
  A380PrimComputerFe_B.TmpBufferAtTmpGroundAtBusAssignmentInport2Outport1_b =
    A380PrimComputerFe_P.out_Y0.flight_envelope.low_energy_warning_active;
  A380PrimComputerFe_B.left_inboard_aileron_deg =
    A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.left_inboard_aileron_deg;
  A380PrimComputerFe_B.right_inboard_aileron_deg =
    A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.right_inboard_aileron_deg;
  A380PrimComputerFe_B.left_midboard_aileron_deg =
    A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.left_midboard_aileron_deg;
  A380PrimComputerFe_B.right_midboard_aileron_deg =
    A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.right_midboard_aileron_deg;
  A380PrimComputerFe_B.left_outboard_aileron_deg =
    A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.left_outboard_aileron_deg;
  A380PrimComputerFe_B.right_outboard_aileron_deg =
    A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.right_outboard_aileron_deg;
  A380PrimComputerFe_B.left_spoiler_1_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.left_spoiler_1_deg;
  A380PrimComputerFe_B.right_spoiler_1_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.right_spoiler_1_deg;
  A380PrimComputerFe_B.left_spoiler_2_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.left_spoiler_2_deg;
  A380PrimComputerFe_B.right_spoiler_2_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.right_spoiler_2_deg;
  A380PrimComputerFe_B.left_spoiler_3_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.left_spoiler_3_deg;
  A380PrimComputerFe_B.right_spoiler_3_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.right_spoiler_3_deg;
  A380PrimComputerFe_B.left_spoiler_4_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.left_spoiler_4_deg;
  A380PrimComputerFe_B.right_spoiler_4_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.right_spoiler_4_deg;
  A380PrimComputerFe_B.left_spoiler_5_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.left_spoiler_5_deg;
  A380PrimComputerFe_B.right_spoiler_5_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.right_spoiler_5_deg;
  A380PrimComputerFe_B.left_spoiler_6_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.left_spoiler_6_deg;
  A380PrimComputerFe_B.right_spoiler_6_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.right_spoiler_6_deg;
  A380PrimComputerFe_B.left_spoiler_7_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.left_spoiler_7_deg;
  A380PrimComputerFe_B.right_spoiler_7_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.right_spoiler_7_deg;
  A380PrimComputerFe_B.left_spoiler_8_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.left_spoiler_8_deg;
  A380PrimComputerFe_B.right_spoiler_8_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.right_spoiler_8_deg;
  A380PrimComputerFe_B.upper_rudder_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.upper_rudder_deg;
  A380PrimComputerFe_B.lower_rudder_deg = A380PrimComputerFe_P.out_Y0.laws.lateral_law_outputs.lower_rudder_deg;
  A380PrimComputerFe_B.left_inboard_elevator_deg =
    A380PrimComputerFe_P.out_Y0.laws.pitch_law_outputs.left_inboard_elevator_deg;
  A380PrimComputerFe_B.right_inboard_elevator_deg =
    A380PrimComputerFe_P.out_Y0.laws.pitch_law_outputs.right_inboard_elevator_deg;
  A380PrimComputerFe_B.left_outboard_elevator_deg =
    A380PrimComputerFe_P.out_Y0.laws.pitch_law_outputs.left_outboard_elevator_deg;
  A380PrimComputerFe_B.right_outboard_elevator_deg =
    A380PrimComputerFe_P.out_Y0.laws.pitch_law_outputs.right_outboard_elevator_deg;
  A380PrimComputerFe_B.ths_deg = A380PrimComputerFe_P.out_Y0.laws.pitch_law_outputs.ths_deg;
  A380PrimComputerFe_B.left_inboard_aileron_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.left_inboard_aileron_engaged;
  A380PrimComputerFe_B.right_inboard_aileron_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.right_inboard_aileron_engaged;
  A380PrimComputerFe_B.left_midboard_aileron_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.left_midboard_aileron_engaged;
  A380PrimComputerFe_B.right_midboard_aileron_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.right_midboard_aileron_engaged;
  A380PrimComputerFe_B.left_outboard_aileron_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.left_outboard_aileron_engaged;
  A380PrimComputerFe_B.right_outboard_aileron_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.right_outboard_aileron_engaged;
  A380PrimComputerFe_B.spoiler_pair_1_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_1_engaged;
  A380PrimComputerFe_B.spoiler_pair_2_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_2_engaged;
  A380PrimComputerFe_B.spoiler_pair_3_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_3_engaged;
  A380PrimComputerFe_B.spoiler_pair_4_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_4_engaged;
  A380PrimComputerFe_B.spoiler_pair_5_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_5_engaged;
  A380PrimComputerFe_B.spoiler_pair_6_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_6_engaged;
  A380PrimComputerFe_B.spoiler_pair_7_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_7_engaged;
  A380PrimComputerFe_B.spoiler_pair_8_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_8_engaged;
  A380PrimComputerFe_B.left_inboard_elevator_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.left_inboard_elevator_engaged;
  A380PrimComputerFe_B.right_inboard_elevator_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.right_inboard_elevator_engaged;
  A380PrimComputerFe_B.left_outboard_elevator_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.left_outboard_elevator_engaged;
  A380PrimComputerFe_B.right_outboard_elevator_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.right_outboard_elevator_engaged;
  A380PrimComputerFe_B.ths_engaged = A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.ths_engaged;
  A380PrimComputerFe_B.upper_rudder_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.upper_rudder_engaged;
  A380PrimComputerFe_B.lower_rudder_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.surface_statuses.lower_rudder_engaged;
  A380PrimComputerFe_B.left_inboard_aileron_deg_g =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg;
  A380PrimComputerFe_B.right_inboard_aileron_deg_b =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg;
  A380PrimComputerFe_B.left_midboard_aileron_deg_f =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg;
  A380PrimComputerFe_B.right_midboard_aileron_deg_f =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg;
  A380PrimComputerFe_B.left_outboard_aileron_deg_g =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg;
  A380PrimComputerFe_B.right_outboard_aileron_deg_m =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg;
  A380PrimComputerFe_B.left_spoiler_1_deg_b =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_1_deg;
  A380PrimComputerFe_B.right_spoiler_1_deg_o =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_1_deg;
  A380PrimComputerFe_B.left_spoiler_2_deg_i =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_2_deg;
  A380PrimComputerFe_B.right_spoiler_2_deg_g =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_2_deg;
  A380PrimComputerFe_B.left_spoiler_3_deg_i =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_3_deg;
  A380PrimComputerFe_B.right_spoiler_3_deg_b =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_3_deg;
  A380PrimComputerFe_B.left_spoiler_4_deg_g =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_4_deg;
  A380PrimComputerFe_B.right_spoiler_4_deg_a =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_4_deg;
  A380PrimComputerFe_B.left_spoiler_5_deg_d =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_5_deg;
  A380PrimComputerFe_B.right_spoiler_5_deg_m =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_5_deg;
  A380PrimComputerFe_B.left_spoiler_6_deg_o =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_6_deg;
  A380PrimComputerFe_B.right_spoiler_6_deg_d =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_6_deg;
  A380PrimComputerFe_B.left_spoiler_7_deg_a =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_7_deg;
  A380PrimComputerFe_B.right_spoiler_7_deg_j =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_7_deg;
  A380PrimComputerFe_B.left_spoiler_8_deg_h =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_8_deg;
  A380PrimComputerFe_B.right_spoiler_8_deg_j =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_8_deg;
  A380PrimComputerFe_B.upper_rudder_deg_m =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.upper_rudder_deg;
  A380PrimComputerFe_B.lower_rudder_deg_c =
    A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_surface_positions.lower_rudder_deg;
  A380PrimComputerFe_B.left_inboard_elevator_deg_k =
    A380PrimComputerFe_P.out_Y0.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg;
  A380PrimComputerFe_B.right_inboard_elevator_deg_o =
    A380PrimComputerFe_P.out_Y0.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg;
  A380PrimComputerFe_B.left_outboard_elevator_deg_p =
    A380PrimComputerFe_P.out_Y0.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg;
  A380PrimComputerFe_B.right_outboard_elevator_deg_g =
    A380PrimComputerFe_P.out_Y0.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg;
  A380PrimComputerFe_B.ths_deg_o = A380PrimComputerFe_P.out_Y0.fctl_logic.pitch_surface_positions.ths_deg;
  A380PrimComputerFe_B.lateral_law_capability = A380PrimComputerFe_P.out_Y0.fctl_logic.lateral_law_capability;
  A380PrimComputerFe_B.active_lateral_law = A380PrimComputerFe_P.out_Y0.fctl_logic.active_lateral_law;
  A380PrimComputerFe_B.pitch_law_capability = A380PrimComputerFe_P.out_Y0.fctl_logic.pitch_law_capability;
  A380PrimComputerFe_B.active_pitch_law = A380PrimComputerFe_P.out_Y0.fctl_logic.active_pitch_law;
  A380PrimComputerFe_B.abnormal_condition_law_active =
    A380PrimComputerFe_P.out_Y0.fctl_logic.abnormal_condition_law_active;
  A380PrimComputerFe_B.is_master_prim = A380PrimComputerFe_P.out_Y0.fctl_logic.is_master_prim;
  A380PrimComputerFe_B.elevator_1_avail = A380PrimComputerFe_P.out_Y0.fctl_logic.elevator_1_avail;
  A380PrimComputerFe_B.elevator_1_engaged = A380PrimComputerFe_P.out_Y0.fctl_logic.elevator_1_engaged;
  A380PrimComputerFe_B.elevator_2_avail = A380PrimComputerFe_P.out_Y0.fctl_logic.elevator_2_avail;
  A380PrimComputerFe_B.elevator_2_engaged = A380PrimComputerFe_P.out_Y0.fctl_logic.elevator_2_engaged;
  A380PrimComputerFe_B.elevator_3_avail = A380PrimComputerFe_P.out_Y0.fctl_logic.elevator_3_avail;
  A380PrimComputerFe_B.elevator_3_engaged = A380PrimComputerFe_P.out_Y0.fctl_logic.elevator_3_engaged;
  A380PrimComputerFe_B.ths_avail = A380PrimComputerFe_P.out_Y0.fctl_logic.ths_avail;
  A380PrimComputerFe_B.ths_engaged_h = A380PrimComputerFe_P.out_Y0.fctl_logic.ths_engaged;
  A380PrimComputerFe_B.left_aileron_1_avail = A380PrimComputerFe_P.out_Y0.fctl_logic.left_aileron_1_avail;
  A380PrimComputerFe_B.left_aileron_1_engaged = A380PrimComputerFe_P.out_Y0.fctl_logic.left_aileron_1_engaged;
  A380PrimComputerFe_B.left_aileron_2_avail = A380PrimComputerFe_P.out_Y0.fctl_logic.left_aileron_2_avail;
  A380PrimComputerFe_B.left_aileron_2_engaged = A380PrimComputerFe_P.out_Y0.fctl_logic.left_aileron_2_engaged;
  A380PrimComputerFe_B.right_aileron_1_avail = A380PrimComputerFe_P.out_Y0.fctl_logic.right_aileron_1_avail;
  A380PrimComputerFe_B.right_aileron_1_engaged = A380PrimComputerFe_P.out_Y0.fctl_logic.right_aileron_1_engaged;
  A380PrimComputerFe_B.right_aileron_2_avail = A380PrimComputerFe_P.out_Y0.fctl_logic.right_aileron_2_avail;
  A380PrimComputerFe_B.right_aileron_2_engaged = A380PrimComputerFe_P.out_Y0.fctl_logic.right_aileron_2_engaged;
  A380PrimComputerFe_B.left_spoiler_hydraulic_mode_avail =
    A380PrimComputerFe_P.out_Y0.fctl_logic.left_spoiler_hydraulic_mode_avail;
  A380PrimComputerFe_B.left_spoiler_electric_mode_avail =
    A380PrimComputerFe_P.out_Y0.fctl_logic.left_spoiler_electric_mode_avail;
  A380PrimComputerFe_B.left_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.left_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFe_B.left_spoiler_electric_mode_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.left_spoiler_electric_mode_engaged;
  A380PrimComputerFe_B.right_spoiler_hydraulic_mode_avail =
    A380PrimComputerFe_P.out_Y0.fctl_logic.right_spoiler_hydraulic_mode_avail;
  A380PrimComputerFe_B.right_spoiler_electric_mode_avail =
    A380PrimComputerFe_P.out_Y0.fctl_logic.right_spoiler_electric_mode_avail;
  A380PrimComputerFe_B.right_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.right_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFe_B.right_spoiler_electric_mode_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.right_spoiler_electric_mode_engaged;
  A380PrimComputerFe_B.rudder_1_hydraulic_mode_avail =
    A380PrimComputerFe_P.out_Y0.fctl_logic.rudder_1_hydraulic_mode_avail;
  A380PrimComputerFe_B.rudder_1_electric_mode_avail =
    A380PrimComputerFe_P.out_Y0.fctl_logic.rudder_1_electric_mode_avail;
  A380PrimComputerFe_B.rudder_1_hydraulic_mode_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.rudder_1_hydraulic_mode_engaged;
  A380PrimComputerFe_B.rudder_1_electric_mode_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.rudder_1_electric_mode_engaged;
  A380PrimComputerFe_B.rudder_2_hydraulic_mode_avail =
    A380PrimComputerFe_P.out_Y0.fctl_logic.rudder_2_hydraulic_mode_avail;
  A380PrimComputerFe_B.rudder_2_electric_mode_avail =
    A380PrimComputerFe_P.out_Y0.fctl_logic.rudder_2_electric_mode_avail;
  A380PrimComputerFe_B.rudder_2_hydraulic_mode_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.rudder_2_hydraulic_mode_engaged;
  A380PrimComputerFe_B.rudder_2_electric_mode_engaged =
    A380PrimComputerFe_P.out_Y0.fctl_logic.rudder_2_electric_mode_engaged;
  A380PrimComputerFe_B.aileron_droop_active = A380PrimComputerFe_P.out_Y0.fctl_logic.aileron_droop_active;
  A380PrimComputerFe_B.aileron_antidroop_active = A380PrimComputerFe_P.out_Y0.fctl_logic.aileron_antidroop_active;
  A380PrimComputerFe_B.ths_automatic_mode_active = A380PrimComputerFe_P.out_Y0.fctl_logic.ths_automatic_mode_active;
  A380PrimComputerFe_B.ths_manual_mode_c_deg_s = A380PrimComputerFe_P.out_Y0.fctl_logic.ths_manual_mode_c_deg_s;
  A380PrimComputerFe_B.is_yellow_hydraulic_power_avail =
    A380PrimComputerFe_P.out_Y0.fctl_logic.is_yellow_hydraulic_power_avail;
  A380PrimComputerFe_B.is_green_hydraulic_power_avail =
    A380PrimComputerFe_P.out_Y0.fctl_logic.is_green_hydraulic_power_avail;
  A380PrimComputerFe_B.eha_ebha_elec_mode_inhibited =
    A380PrimComputerFe_P.out_Y0.fctl_logic.eha_ebha_elec_mode_inhibited;
  A380PrimComputerFe_B.left_sidestick_disabled = A380PrimComputerFe_P.out_Y0.fctl_logic.left_sidestick_disabled;
  A380PrimComputerFe_B.right_sidestick_disabled = A380PrimComputerFe_P.out_Y0.fctl_logic.right_sidestick_disabled;
  A380PrimComputerFe_B.left_sidestick_priority_locked =
    A380PrimComputerFe_P.out_Y0.fctl_logic.left_sidestick_priority_locked;
  A380PrimComputerFe_B.right_sidestick_priority_locked =
    A380PrimComputerFe_P.out_Y0.fctl_logic.right_sidestick_priority_locked;
  A380PrimComputerFe_B.total_sidestick_pitch_command =
    A380PrimComputerFe_P.out_Y0.fctl_logic.total_sidestick_pitch_command;
  A380PrimComputerFe_B.total_sidestick_roll_command =
    A380PrimComputerFe_P.out_Y0.fctl_logic.total_sidestick_roll_command;
  A380PrimComputerFe_B.speed_brake_inhibited = A380PrimComputerFe_P.out_Y0.fctl_logic.speed_brake_inhibited;
  A380PrimComputerFe_B.speed_brake_command_deg = A380PrimComputerFe_P.out_Y0.fctl_logic.speed_brake_command_deg;
  A380PrimComputerFe_B.ground_spoilers_armed = A380PrimComputerFe_P.out_Y0.fctl_logic.ground_spoilers_armed;
  A380PrimComputerFe_B.ground_spoilers_out = A380PrimComputerFe_P.out_Y0.fctl_logic.ground_spoilers_out;
  A380PrimComputerFe_B.phased_lift_dumping_active = A380PrimComputerFe_P.out_Y0.fctl_logic.phased_lift_dumping_active;
  A380PrimComputerFe_B.spoiler_lift_active = A380PrimComputerFe_P.out_Y0.fctl_logic.spoiler_lift_active;
  A380PrimComputerFe_B.ap_authorised = A380PrimComputerFe_P.out_Y0.fctl_logic.ap_authorised;
  A380PrimComputerFe_B.protection_ap_disconnect = A380PrimComputerFe_P.out_Y0.fctl_logic.protection_ap_disconnect;
  A380PrimComputerFe_B.high_alpha_prot_active = A380PrimComputerFe_P.out_Y0.fctl_logic.high_alpha_prot_active;
  A380PrimComputerFe_B.alpha_prot_deg = A380PrimComputerFe_P.out_Y0.fctl_logic.alpha_prot_deg;
  A380PrimComputerFe_B.alpha_max_deg = A380PrimComputerFe_P.out_Y0.fctl_logic.alpha_max_deg;
  A380PrimComputerFe_B.v_alpha_prot_kn = A380PrimComputerFe_P.out_Y0.fctl_logic.v_alpha_prot_kn;
  A380PrimComputerFe_B.v_alpha_max_kn = A380PrimComputerFe_P.out_Y0.fctl_logic.v_alpha_max_kn;
  A380PrimComputerFe_B.v_alpha_stall_warn_kn = A380PrimComputerFe_P.out_Y0.fctl_logic.v_alpha_stall_warn_kn;
  A380PrimComputerFe_B.high_speed_prot_active = A380PrimComputerFe_P.out_Y0.fctl_logic.high_speed_prot_active;
  A380PrimComputerFe_B.high_speed_prot_lo_thresh_kn =
    A380PrimComputerFe_P.out_Y0.fctl_logic.high_speed_prot_lo_thresh_kn;
  A380PrimComputerFe_B.high_speed_prot_hi_thresh_kn =
    A380PrimComputerFe_P.out_Y0.fctl_logic.high_speed_prot_hi_thresh_kn;
  A380PrimComputerFe_B.land_2_capability = A380PrimComputerFe_P.out_Y0.fg_logic.land_2_capability;
  A380PrimComputerFe_B.land_3_fail_passive_capability =
    A380PrimComputerFe_P.out_Y0.fg_logic.land_3_fail_passive_capability;
  A380PrimComputerFe_B.land_3_fail_op_capability = A380PrimComputerFe_P.out_Y0.fg_logic.land_3_fail_op_capability;
  A380PrimComputerFe_B.land_2_inop = A380PrimComputerFe_P.out_Y0.fg_logic.land_2_inop;
  A380PrimComputerFe_B.land_3_fail_passive_inop = A380PrimComputerFe_P.out_Y0.fg_logic.land_3_fail_passive_inop;
  A380PrimComputerFe_B.land_3_fail_op_inop = A380PrimComputerFe_P.out_Y0.fg_logic.land_3_fail_op_inop;
  A380PrimComputerFe_B.alignment_dummy = A380PrimComputerFe_P.out_Y0.discrete_outputs.alignment_dummy;
  A380PrimComputerFe_B.elevator_1_active_mode = A380PrimComputerFe_P.out_Y0.discrete_outputs.elevator_1_active_mode;
  A380PrimComputerFe_B.elevator_2_active_mode = A380PrimComputerFe_P.out_Y0.discrete_outputs.elevator_2_active_mode;
  A380PrimComputerFe_B.elevator_3_active_mode = A380PrimComputerFe_P.out_Y0.discrete_outputs.elevator_3_active_mode;
  A380PrimComputerFe_B.ths_active_mode = A380PrimComputerFe_P.out_Y0.discrete_outputs.ths_active_mode;
  A380PrimComputerFe_B.left_aileron_1_active_mode =
    A380PrimComputerFe_P.out_Y0.discrete_outputs.left_aileron_1_active_mode;
  A380PrimComputerFe_B.left_aileron_2_active_mode =
    A380PrimComputerFe_P.out_Y0.discrete_outputs.left_aileron_2_active_mode;
  A380PrimComputerFe_B.right_aileron_1_active_mode =
    A380PrimComputerFe_P.out_Y0.discrete_outputs.right_aileron_1_active_mode;
  A380PrimComputerFe_B.right_aileron_2_active_mode =
    A380PrimComputerFe_P.out_Y0.discrete_outputs.right_aileron_2_active_mode;
  A380PrimComputerFe_B.left_spoiler_electronic_module_enable =
    A380PrimComputerFe_P.out_Y0.discrete_outputs.left_spoiler_electronic_module_enable;
  A380PrimComputerFe_B.right_spoiler_electronic_module_enable =
    A380PrimComputerFe_P.out_Y0.discrete_outputs.right_spoiler_electronic_module_enable;
  A380PrimComputerFe_B.rudder_1_hydraulic_active_mode =
    A380PrimComputerFe_P.out_Y0.discrete_outputs.rudder_1_hydraulic_active_mode;
  A380PrimComputerFe_B.rudder_1_electric_active_mode =
    A380PrimComputerFe_P.out_Y0.discrete_outputs.rudder_1_electric_active_mode;
  A380PrimComputerFe_B.rudder_2_hydraulic_active_mode =
    A380PrimComputerFe_P.out_Y0.discrete_outputs.rudder_2_hydraulic_active_mode;
  A380PrimComputerFe_B.rudder_2_electric_active_mode =
    A380PrimComputerFe_P.out_Y0.discrete_outputs.rudder_2_electric_active_mode;
  A380PrimComputerFe_B.prim_healthy = A380PrimComputerFe_P.out_Y0.discrete_outputs.prim_healthy;
  A380PrimComputerFe_B.fcu_own_select = A380PrimComputerFe_P.out_Y0.discrete_outputs.fcu_own_select;
  A380PrimComputerFe_B.fcu_opp_select = A380PrimComputerFe_P.out_Y0.discrete_outputs.fcu_opp_select;
  A380PrimComputerFe_B.reverser_tertiary_lock = A380PrimComputerFe_P.out_Y0.discrete_outputs.reverser_tertiary_lock;
  A380PrimComputerFe_B.elevator_1_pos_order_deg = A380PrimComputerFe_P.out_Y0.analog_outputs.elevator_1_pos_order_deg;
  A380PrimComputerFe_B.elevator_2_pos_order_deg = A380PrimComputerFe_P.out_Y0.analog_outputs.elevator_2_pos_order_deg;
  A380PrimComputerFe_B.elevator_3_pos_order_deg = A380PrimComputerFe_P.out_Y0.analog_outputs.elevator_3_pos_order_deg;
  A380PrimComputerFe_B.ths_pos_order_deg = A380PrimComputerFe_P.out_Y0.analog_outputs.ths_pos_order_deg;
  A380PrimComputerFe_B.left_aileron_1_pos_order_deg =
    A380PrimComputerFe_P.out_Y0.analog_outputs.left_aileron_1_pos_order_deg;
  A380PrimComputerFe_B.left_aileron_2_pos_order_deg =
    A380PrimComputerFe_P.out_Y0.analog_outputs.left_aileron_2_pos_order_deg;
  A380PrimComputerFe_B.right_aileron_1_pos_order_deg =
    A380PrimComputerFe_P.out_Y0.analog_outputs.right_aileron_1_pos_order_deg;
  A380PrimComputerFe_B.right_aileron_2_pos_order_deg =
    A380PrimComputerFe_P.out_Y0.analog_outputs.right_aileron_2_pos_order_deg;
  A380PrimComputerFe_B.left_spoiler_pos_order_deg =
    A380PrimComputerFe_P.out_Y0.analog_outputs.left_spoiler_pos_order_deg;
  A380PrimComputerFe_B.right_spoiler_pos_order_deg =
    A380PrimComputerFe_P.out_Y0.analog_outputs.right_spoiler_pos_order_deg;
  A380PrimComputerFe_B.rudder_1_pos_order_deg = A380PrimComputerFe_P.out_Y0.analog_outputs.rudder_1_pos_order_deg;
  A380PrimComputerFe_B.rudder_2_pos_order_deg = A380PrimComputerFe_P.out_Y0.analog_outputs.rudder_2_pos_order_deg;
  A380PrimComputerFe_B.SSM_kxx = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_inboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwx = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_inboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_kxxt = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_inboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwxk = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_inboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_kxxta = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_midboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwxkf = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_midboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_kxxtac = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_midboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwxkft =
    A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_midboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_kxxtac0 = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_outboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwxkftc =
    A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_outboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_kxxtac0zt =
    A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_outboard_aileron_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwxkftc3 =
    A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_outboard_aileron_command_deg.Data;
  A380PrimComputerFe_B.SSM_kxxtac0ztg = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_1_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwxkftc3e = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_1_command_deg.Data;
  A380PrimComputerFe_B.SSM_kxxtac0ztgf = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_1_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwxkftc3ep = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_1_command_deg.Data;
  A380PrimComputerFe_B.SSM_kxxtac0ztgf2 = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_2_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwxkftc3epg = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_2_command_deg.Data;
  A380PrimComputerFe_B.SSM_kxxtac0ztgf2u = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_2_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwxkftc3epgtd =
    A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_2_command_deg.Data;
  A380PrimComputerFe_B.SSM_kxxtac0ztgf2ux = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_3_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwxkftc3epgtdx =
    A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_3_command_deg.Data;
  A380PrimComputerFe_B.SSM_kxxtac0ztgf2uxn =
    A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_3_command_deg.SSM;
  A380PrimComputerFe_B.Data_fwxkftc3epgtdxc =
    A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_3_command_deg.Data;
  A380PrimComputerFe_B.SSM_ky = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_4_command_deg.SSM;
  A380PrimComputerFe_B.Data_h = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_4_command_deg.Data;
  A380PrimComputerFe_B.SSM_d = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_4_command_deg.SSM;
  A380PrimComputerFe_B.Data_e = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_4_command_deg.Data;
  A380PrimComputerFe_B.SSM_h = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_5_command_deg.SSM;
  A380PrimComputerFe_B.Data_j = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_5_command_deg.Data;
  A380PrimComputerFe_B.SSM_p = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_5_command_deg.SSM;
  A380PrimComputerFe_B.Data_d = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_5_command_deg.Data;
  A380PrimComputerFe_B.SSM_di = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_6_command_deg.SSM;
  A380PrimComputerFe_B.Data_p = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_6_command_deg.Data;
  A380PrimComputerFe_B.SSM_j = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_6_command_deg.SSM;
  A380PrimComputerFe_B.Data_i = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_6_command_deg.Data;
  A380PrimComputerFe_B.SSM_i = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_7_command_deg.SSM;
  A380PrimComputerFe_B.Data_g = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_7_command_deg.Data;
  A380PrimComputerFe_B.SSM_g = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_7_command_deg.SSM;
  A380PrimComputerFe_B.Data_eb = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_7_command_deg.Data;
  A380PrimComputerFe_B.SSM_db = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_8_command_deg.SSM;
  A380PrimComputerFe_B.Data_jo = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_8_command_deg.Data;
  A380PrimComputerFe_B.SSM_n = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_8_command_deg.SSM;
  A380PrimComputerFe_B.Data_ex = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_8_command_deg.Data;
  A380PrimComputerFe_B.SSM_a = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_inboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_fd = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_inboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_ir = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_inboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_ja = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_inboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_hu = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_outboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_k = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_outboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_gr = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_outboard_elevator_command_deg.SSM;
  A380PrimComputerFe_B.Data_joy = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_outboard_elevator_command_deg.Data;
  A380PrimComputerFe_B.SSM_ev = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.ths_command_deg.SSM;
  A380PrimComputerFe_B.Data_h3 = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.ths_command_deg.Data;
  A380PrimComputerFe_B.SSM_l = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.upper_rudder_command_deg.SSM;
  A380PrimComputerFe_B.Data_a0 = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.upper_rudder_command_deg.Data;
  A380PrimComputerFe_B.SSM_ei = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.lower_rudder_command_deg.SSM;
  A380PrimComputerFe_B.Data_b = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.lower_rudder_command_deg.Data;
  A380PrimComputerFe_B.SSM_an = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_iz = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_c = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFe_B.Data_j2 = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFe_B.SSM_cb = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_o = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_lb = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFe_B.Data_m = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFe_B.SSM_ia = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.rudder_pedal_position_deg.SSM;
  A380PrimComputerFe_B.Data_oq = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.rudder_pedal_position_deg.Data;
  A380PrimComputerFe_B.SSM_kyz = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.aileron_status_word.SSM;
  A380PrimComputerFe_B.Data_fo = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.aileron_status_word.Data;
  A380PrimComputerFe_B.SSM_is = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_p1 = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_ca = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_p1y = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_o = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_aileron_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_l = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_aileron_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_ak = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_aileron_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_kp = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_aileron_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_cbj = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.spoiler_status_word.SSM;
  A380PrimComputerFe_B.Data_pi = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.spoiler_status_word.Data;
  A380PrimComputerFe_B.SSM_cu = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_position_deg.SSM;
  A380PrimComputerFe_B.Data_dm = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.left_spoiler_position_deg.Data;
  A380PrimComputerFe_B.SSM_nn = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_position_deg.SSM;
  A380PrimComputerFe_B.Data_f5 = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.right_spoiler_position_deg.Data;
  A380PrimComputerFe_B.SSM_b = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.elevator_status_word.SSM;
  A380PrimComputerFe_B.Data_js = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.elevator_status_word.Data;
  A380PrimComputerFe_B.SSM_m = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.elevator_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_ee = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.elevator_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_f = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.elevator_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_ig = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.elevator_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_hb = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.elevator_3_position_deg.SSM;
  A380PrimComputerFe_B.Data_mk = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.elevator_3_position_deg.Data;
  A380PrimComputerFe_B.SSM_gz = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.ths_position_deg.SSM;
  A380PrimComputerFe_B.Data_pu = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.ths_position_deg.Data;
  A380PrimComputerFe_B.SSM_pv = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.rudder_status_word.SSM;
  A380PrimComputerFe_B.Data_ly = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.rudder_status_word.Data;
  A380PrimComputerFe_B.SSM_mf = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.rudder_1_position_deg.SSM;
  A380PrimComputerFe_B.Data_jq = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.rudder_1_position_deg.Data;
  A380PrimComputerFe_B.SSM_m0 = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.rudder_2_position_deg.SSM;
  A380PrimComputerFe_B.Data_lyw = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.rudder_2_position_deg.Data;
  A380PrimComputerFe_B.SSM_kd = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.radio_height_1_ft.SSM;
  A380PrimComputerFe_B.Data_gq = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.radio_height_1_ft.Data;
  A380PrimComputerFe_B.SSM_pu = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.radio_height_2_ft.SSM;
  A380PrimComputerFe_B.Data_n = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.radio_height_2_ft.Data;
  A380PrimComputerFe_B.SSM_nv = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.fctl_law_status_word.SSM;
  A380PrimComputerFe_B.Data_bq = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.fctl_law_status_word.Data;
  A380PrimComputerFe_B.SSM_d5 = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.discrete_status_word_1.SSM;
  A380PrimComputerFe_B.Data_dmn = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.discrete_status_word_1.Data;
  A380PrimComputerFe_B.SSM_eo = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.fe_status_word.SSM;
  A380PrimComputerFe_B.Data_jn = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.fe_status_word.Data;
  A380PrimComputerFe_B.SSM_bq = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.fg_status_word.SSM;
  A380PrimComputerFe_B.Data_c = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.fg_status_word.Data;
  A380PrimComputerFe_B.SSM_hi = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.v_alpha_lim_kn.SSM;
  A380PrimComputerFe_B.Data_lx = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.v_alpha_lim_kn.Data;
  A380PrimComputerFe_B.SSM_mm = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.v_alpha_prot_kn.SSM;
  A380PrimComputerFe_B.Data_jb = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.v_alpha_prot_kn.Data;
  A380PrimComputerFe_B.SSM_kz = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.v_alpha_stall_warn_kn.SSM;
  A380PrimComputerFe_B.Data_fn = A380PrimComputerFe_P.out_Y0.bus_outputs.fctl.v_alpha_stall_warn_kn.Data;
  A380PrimComputerFe_B.SSM_il = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.gamma_a_deg.SSM;
  A380PrimComputerFe_B.Data_ez = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.gamma_a_deg.Data;
  A380PrimComputerFe_B.SSM_i2 = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.gamma_t_deg.SSM;
  A380PrimComputerFe_B.Data_pw = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.gamma_t_deg.Data;
  A380PrimComputerFe_B.SSM_ah = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.sideslip_target_deg.SSM;
  A380PrimComputerFe_B.Data_m2 = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.sideslip_target_deg.Data;
  A380PrimComputerFe_B.SSM_en = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_ls_kn.SSM;
  A380PrimComputerFe_B.Data_ek = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_ls_kn.Data;
  A380PrimComputerFe_B.SSM_dq = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_stall_kn.SSM;
  A380PrimComputerFe_B.Data_iy = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_stall_kn.Data;
  A380PrimComputerFe_B.SSM_px = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.speed_trend_kn.SSM;
  A380PrimComputerFe_B.Data_lk = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.speed_trend_kn.Data;
  A380PrimComputerFe_B.SSM_p5 = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_3_kn.SSM;
  A380PrimComputerFe_B.Data_ca = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_3_kn.Data;
  A380PrimComputerFe_B.SSM_mk = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_4_kn.SSM;
  A380PrimComputerFe_B.Data_pix = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_4_kn.Data;
  A380PrimComputerFe_B.SSM_mu = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_man_kn.SSM;
  A380PrimComputerFe_B.Data_di = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_man_kn.Data;
  A380PrimComputerFe_B.SSM_cbl = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_max_kn.SSM;
  A380PrimComputerFe_B.Data_lz = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_max_kn.Data;
  A380PrimComputerFe_B.SSM_gzd = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_fe_next_kn.SSM;
  A380PrimComputerFe_B.Data_dc = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.v_fe_next_kn.Data;
  A380PrimComputerFe_B.SSM_mo = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.discrete_word_1.SSM;
  A380PrimComputerFe_B.Data_gc = A380PrimComputerFe_P.out_Y0.bus_outputs.fe.discrete_word_1.Data;
}

void A380PrimComputerFe::terminate()
{
}

A380PrimComputerFe::A380PrimComputerFe():
  A380PrimComputerFe_U(),
  A380PrimComputerFe_Y(),
  A380PrimComputerFe_B(),
  A380PrimComputerFe_DWork()
{
}

A380PrimComputerFe::~A380PrimComputerFe() = default;
