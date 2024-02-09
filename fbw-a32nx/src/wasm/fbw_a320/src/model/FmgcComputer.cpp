#include "FmgcComputer.h"
#include "rtwtypes.h"
#include "FmgcComputer_types.h"
#include <cmath>

void FmgcComputer::FmgcComputer_MATLABFunction_Reset(rtDW_MATLABFunction_FmgcComputer_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void FmgcComputer::FmgcComputer_MATLABFunction(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
  rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_FmgcComputer_T *localDW)
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

void FmgcComputer::FmgcComputer_MATLABFunction_m_Reset(rtDW_MATLABFunction_FmgcComputer_e_T *localDW)
{
  localDW->previousInput_not_empty = false;
}

void FmgcComputer::FmgcComputer_MATLABFunction_i(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_FmgcComputer_e_T *localDW)
{
  if (!localDW->previousInput_not_empty) {
    localDW->previousInput = rtu_isRisingEdge;
    localDW->previousInput_not_empty = true;
  }

  if (rtu_isRisingEdge) {
    *rty_y = (rtu_u && (!localDW->previousInput));
  } else {
    *rty_y = ((!rtu_u) && localDW->previousInput);
  }

  localDW->previousInput = rtu_u;
}

void FmgcComputer::FmgcComputer_MATLABFunction_j(const base_arinc_429 *rtu_u, real32_T rtu_default, real32_T *rty_y)
{
  if (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
    *rty_y = rtu_u->Data;
  } else {
    *rty_y = rtu_default;
  }
}

void FmgcComputer::FmgcComputer_MATLABFunction_f(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void FmgcComputer::FmgcComputer_MATLABFunction_k(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void FmgcComputer::FmgcComputer_MATLABFunction_g(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void FmgcComputer::FmgcComputer_MATLABFunction_pz_Reset(rtDW_MATLABFunction_FmgcComputer_ll_T *localDW)
{
  localDW->previousInput = false;
  localDW->remainingTriggerTime = 0.0;
}

void FmgcComputer::FmgcComputer_MATLABFunction_d(boolean_T rtu_u, real_T rtu_Ts, boolean_T *rty_y, real_T
  rtp_isRisingEdge, real_T rtp_retriggerable, real_T rtp_triggerDuration, rtDW_MATLABFunction_FmgcComputer_ll_T *localDW)
{
  if (localDW->remainingTriggerTime > 0.0) {
    localDW->remainingTriggerTime -= rtu_Ts;
  } else if (localDW->remainingTriggerTime < 0.0) {
    localDW->remainingTriggerTime = 0.0;
  }

  if (((rtp_retriggerable != 0.0) || (localDW->remainingTriggerTime == 0.0)) && (((rtp_isRisingEdge != 0.0) && rtu_u &&
        (!localDW->previousInput)) || ((rtp_isRisingEdge == 0.0) && (!rtu_u) && localDW->previousInput))) {
    localDW->remainingTriggerTime = rtp_triggerDuration;
  }

  localDW->previousInput = rtu_u;
  *rty_y = (localDW->remainingTriggerTime > 0.0);
}

void FmgcComputer::FmgcComputer_MATLABFunction_gy(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void FmgcComputer::step()
{
  const base_arinc_429 *rtb_Switch_k_0;
  base_arinc_429 rtb_BusAssignment_b_logic_ils_computation_data_glideslope_deviation_deg;
  base_arinc_429 rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg;
  base_arinc_429 rtb_BusAssignment_f4_logic_ils_computation_data_runway_heading_deg;
  base_arinc_429 rtb_BusAssignment_k_logic_ils_computation_data_localizer_deviation_deg;
  real32_T rtb_y_c;
  real32_T rtb_y_g;
  real32_T rtb_y_j;
  real32_T rtb_y_je;
  real32_T rtb_y_kc;
  real32_T rtb_y_ke;
  real32_T rtb_y_l;
  real32_T rtb_y_p;
  uint32_T rtb_y_en;
  uint32_T rtb_y_gp;
  uint32_T rtb_y_jz;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_j[19];
  boolean_T rtb_Compare_pf;
  boolean_T rtb_NOT1_p;
  boolean_T rtb_NOT4_gb;
  boolean_T rtb_y_dh;
  boolean_T rtb_y_gd;
  boolean_T rtb_y_gx;
  boolean_T rtb_y_k;
  boolean_T rtb_y_mq;
  boolean_T rtb_y_nk;
  if (FmgcComputer_U.in.sim_data.computer_running) {
    real_T rtb_Abs1;
    real_T rtb_BusAssignment_i_logic_ra_computation_data_ft;
    real_T rtb_Sum1;
    real32_T rtb_Switch_glideslope_deviation_deg_Data;
    real32_T rtb_Switch_localizer_deviation_deg_Data;
    real32_T rtb_Switch_runway_heading_deg_Data;
    real32_T rtb_V_ias;
    real32_T rtb_V_tas;
    real32_T rtb_alpha;
    real32_T rtb_alt;
    real32_T rtb_fpa;
    real32_T rtb_hdg;
    real32_T rtb_mach_i;
    real32_T rtb_n_x;
    real32_T rtb_n_y;
    real32_T rtb_n_z;
    real32_T rtb_p_s_c;
    real32_T rtb_phi;
    real32_T rtb_phi_dot;
    real32_T rtb_q;
    real32_T rtb_r;
    real32_T rtb_raComputationData;
    real32_T rtb_theta;
    real32_T rtb_theta_dot;
    real32_T rtb_trk;
    real32_T rtb_vz;
    uint32_T rtb_Switch_glideslope_deviation_deg_SSM;
    uint32_T rtb_Switch_localizer_deviation_deg_SSM;
    boolean_T fdOppOff;
    boolean_T fdOwnOff;
    boolean_T in_land_or_ga_tmp;
    boolean_T raOppInvalid;
    boolean_T raOwnInvalid;
    boolean_T rtb_AND10;
    boolean_T rtb_BusAssignment_g_logic_both_ils_valid;
    boolean_T rtb_BusAssignment_h_logic_fcu_failure;
    boolean_T rtb_BusAssignment_m_ap_fd_logic_fmgc_opp_mode_sync_tmp;
    boolean_T rtb_Compare;
    boolean_T rtb_Logic_d_idx_0_tmp;
    boolean_T rtb_Logic_gj_idx_0_tmp_tmp;
    boolean_T rtb_Logic_gj_idx_0_tmp_tmp_tmp;
    boolean_T rtb_Logic_gj_idx_0_tmp_tmp_tmp_0;
    boolean_T rtb_Logic_idx_0_tmp;
    boolean_T rtb_NOT3;
    boolean_T rtb_OR1_j;
    boolean_T rtb_OR2;
    boolean_T rtb_OR2_tmp;
    boolean_T rtb_OR9;
    boolean_T rtb_OR9_b;
    boolean_T rtb_OR_c_tmp;
    boolean_T rtb_OR_nn;
    boolean_T rtb_OR_nx;
    boolean_T rtb_OR_od_tmp;
    boolean_T rtb_OR_od_tmp_0;
    boolean_T rtb_TmpSignalConversionAtSFunctionInport3_idx_1;
    boolean_T rtb_adr3Invalid;
    boolean_T rtb_adrOppInvalid;
    boolean_T rtb_adrOwnInvalid;
    boolean_T rtb_ap_fd_condition;
    boolean_T rtb_ap_fd_condition_tmp;
    boolean_T rtb_ap_inop_tmp;
    boolean_T rtb_appInop_idx_0;
    boolean_T rtb_bothRaValid;
    boolean_T rtb_doubleAdrFault;
    boolean_T rtb_doubleIrFault;
    boolean_T rtb_dualRaFailure;
    boolean_T rtb_fmgcOppPriority;
    boolean_T rtb_fmgcOppPriority_tmp;
    boolean_T rtb_ir3Invalid;
    boolean_T rtb_irOppInvalid;
    boolean_T rtb_irOwnInvalid;
    boolean_T rtb_y_ae_tmp;
    boolean_T rtb_y_ae_tmp_0;
    boolean_T rtb_y_ae_tmp_1;
    boolean_T rtb_y_ae_tmp_2;
    boolean_T rtb_y_b;
    if (!FmgcComputer_DWork.Runtime_MODE) {
      FmgcComputer_DWork.Delay_DSTATE = FmgcComputer_P.Delay_InitialCondition;
      FmgcComputer_DWork.Delay_DSTATE_p = FmgcComputer_P.Delay_InitialCondition_g;
      FmgcComputer_DWork.Memory_PreviousInput = FmgcComputer_P.SRFlipFlop1_initial_condition;
      FmgcComputer_DWork.Memory_PreviousInput_g = FmgcComputer_P.SRFlipFlop_initial_condition;
      FmgcComputer_DWork.Memory_PreviousInput_g1 = FmgcComputer_P.SRFlipFlop1_initial_condition_n;
      FmgcComputer_DWork.Delay_DSTATE_k = FmgcComputer_P.Delay_InitialCondition_gu;
      FmgcComputer_DWork.Memory_PreviousInput_p = FmgcComputer_P.SRFlipFlop_initial_condition_b;
      FmgcComputer_DWork.Memory_PreviousInput_k = FmgcComputer_P.SRFlipFlop_initial_condition_h;
      FmgcComputer_DWork.Memory_PreviousInput_c = FmgcComputer_P.SRFlipFlop_initial_condition_i;
      FmgcComputer_DWork.Memory_PreviousInput_b = FmgcComputer_P.SRFlipFlop_initial_condition_c;
      FmgcComputer_DWork.Memory_PreviousInput_l = FmgcComputer_P.SRFlipFlop_initial_condition_d;
      FmgcComputer_DWork.Memory_PreviousInput_d = FmgcComputer_P.SRFlipFlop_initial_condition_iz;
      FmgcComputer_DWork.Memory_PreviousInput_dv = FmgcComputer_P.SRFlipFlop_initial_condition_l;
      FmgcComputer_DWork.Memory_PreviousInput_f = FmgcComputer_P.SRFlipFlop_initial_condition_j;
      FmgcComputer_DWork.Memory_PreviousInput_i = FmgcComputer_P.SRFlipFlop_initial_condition_h5;
      FmgcComputer_DWork.Memory_PreviousInput_e = FmgcComputer_P.SRFlipFlop_initial_condition_e;
      FmgcComputer_DWork.Memory_PreviousInput_f2 = FmgcComputer_P.SRFlipFlop_initial_condition_cs;
      FmgcComputer_DWork.Memory_PreviousInput_i1 = FmgcComputer_P.SRFlipFlop_initial_condition_o;
      FmgcComputer_DWork.Memory_PreviousInput_ip = FmgcComputer_P.SRFlipFlop_initial_condition_g;
      FmgcComputer_DWork.Memory_PreviousInput_a = FmgcComputer_P.SRFlipFlop_initial_condition_n;
      FmgcComputer_DWork.Memory_PreviousInput_cv = FmgcComputer_P.SRFlipFlop_initial_condition_of;
      FmgcComputer_DWork.Memory_PreviousInput_lq = FmgcComputer_P.SRFlipFlop_initial_condition_on;
      FmgcComputer_DWork.Memory_PreviousInput_n = FmgcComputer_P.SRFlipFlop1_initial_condition_b;
      FmgcComputer_DWork.Memory_PreviousInput_ne = FmgcComputer_P.SRFlipFlop_initial_condition_ja;
      FmgcComputer_DWork.Memory_PreviousInput_cb = FmgcComputer_P.SRFlipFlop_initial_condition_li;
      FmgcComputer_DWork.Memory_PreviousInput_fg = FmgcComputer_P.SRFlipFlop1_initial_condition_i;
      FmgcComputer_DWork.Memory_PreviousInput_m = FmgcComputer_P.SRFlipFlop_initial_condition_be;
      FmgcComputer_DWork.Memory_PreviousInput_ec = FmgcComputer_P.SRFlipFlop_initial_condition_jv;
      FmgcComputer_DWork.Memory_PreviousInput_nt = FmgcComputer_P.SRFlipFlop_initial_condition_p;
      FmgcComputer_DWork.Memory_PreviousInput_b3 = FmgcComputer_P.SRFlipFlop_initial_condition_lz;
      FmgcComputer_DWork.Memory_PreviousInput_ae = FmgcComputer_P.SRFlipFlop_initial_condition_oz;
      FmgcComputer_DWork.Memory_PreviousInput_ev = FmgcComputer_P.SRFlipFlop_initial_condition_pr;
      FmgcComputer_DWork.Memory_PreviousInput_fm = FmgcComputer_P.SRFlipFlop_initial_condition_ce;
      FmgcComputer_DWork.Memory_PreviousInput_nu = FmgcComputer_P.SRFlipFlop_initial_condition_hs;
      FmgcComputer_DWork.Memory_PreviousInput_as = FmgcComputer_P.SRFlipFlop_initial_condition_dp;
      FmgcComputer_DWork.Memory_PreviousInput_cu = FmgcComputer_P.SRFlipFlop1_initial_condition_o;
      FmgcComputer_DWork.Memory_PreviousInput_h = FmgcComputer_P.SRFlipFlop_initial_condition_n1;
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_i);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_f);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_c);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_h);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_k);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_o);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_kq);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_d);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hz);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_gk);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fx);
      FmgcComputer_MATLABFunction_pz_Reset(&FmgcComputer_DWork.sf_MATLABFunction_db);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fm);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_jl);
      FmgcComputer_MATLABFunction_pz_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mn);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_kz);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hh);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ha);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_kb);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_eb2);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_es);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mq);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_crq);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_op);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fa);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fo);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_d3);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hv);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fn);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_lm);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_pn);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mtz);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_di2);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_h4);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_gb);
      FmgcComputer_MATLABFunction_pz_Reset(&FmgcComputer_DWork.sf_MATLABFunction_aw);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_at);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hdw);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_m1);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hu);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_h0);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_jle);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ge4);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ma);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_k4);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ah);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ol);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_p4);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_is);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_pr);
      FmgcComputer_MATLABFunction_pz_Reset(&FmgcComputer_DWork.sf_MATLABFunction_bq);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hw);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ee);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dt);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_nd);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ds);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_cx);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fe);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_gbq);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_p3);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ax);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ir);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fz);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mo);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_n5);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_f0h);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_go);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ms);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_khd);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_pe);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_iv);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_bs);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mu);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dba);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dtd);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_d5);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_jc);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_aba);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ft);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mrn);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ih);
      FmgcComputer_MATLABFunction_m_Reset(&FmgcComputer_DWork.sf_MATLABFunction_lr);
      FmgcComputer_MATLABFunction_Reset(&FmgcComputer_DWork.sf_MATLABFunction_j3);
      FmgcComputer_DWork.Runtime_MODE = true;
    }

    rtb_adrOwnInvalid = ((FmgcComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)) ||
                         (FmgcComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)));
    rtb_adrOppInvalid = ((FmgcComputer_U.in.bus_inputs.adr_opp_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)) ||
                         (FmgcComputer_U.in.bus_inputs.adr_opp_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)));
    rtb_adr3Invalid = ((FmgcComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                        (SignStatusMatrix::FailureWarning)) ||
                       (FmgcComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                        (SignStatusMatrix::FailureWarning)));
    rtb_doubleAdrFault = ((rtb_adrOwnInvalid && rtb_adrOppInvalid) || (rtb_adrOwnInvalid && rtb_adr3Invalid) ||
                          (rtb_adrOppInvalid && rtb_adr3Invalid));
    rtb_irOwnInvalid = ((FmgcComputer_U.in.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)) ||
                        (FmgcComputer_U.in.bus_inputs.ir_own_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)));
    rtb_irOppInvalid = ((FmgcComputer_U.in.bus_inputs.ir_opp_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)) ||
                        (FmgcComputer_U.in.bus_inputs.ir_opp_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)));
    rtb_ir3Invalid = ((FmgcComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                       (SignStatusMatrix::NormalOperation)) ||
                      (FmgcComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                       (SignStatusMatrix::NormalOperation)));
    rtb_doubleIrFault = ((rtb_irOwnInvalid && rtb_irOppInvalid) || (rtb_irOwnInvalid && rtb_ir3Invalid) ||
                         (rtb_irOppInvalid && rtb_ir3Invalid));
    if (!rtb_adrOwnInvalid) {
      rtb_V_ias = FmgcComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.Data;
      rtb_V_tas = FmgcComputer_U.in.bus_inputs.adr_own_bus.airspeed_true_kn.Data;
      rtb_mach_i = FmgcComputer_U.in.bus_inputs.adr_own_bus.mach.Data;
      rtb_alpha = FmgcComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.Data;
      rtb_p_s_c = FmgcComputer_U.in.bus_inputs.adr_own_bus.corrected_average_static_pressure.Data;
      rtb_alt = FmgcComputer_U.in.bus_inputs.adr_own_bus.altitude_corrected_ft.Data;
    } else if (!rtb_adr3Invalid) {
      rtb_V_ias = FmgcComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
      rtb_V_tas = FmgcComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
      rtb_mach_i = FmgcComputer_U.in.bus_inputs.adr_3_bus.mach.Data;
      rtb_alpha = FmgcComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
      rtb_p_s_c = FmgcComputer_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
      rtb_alt = FmgcComputer_U.in.bus_inputs.adr_own_bus.altitude_corrected_ft.Data;
    } else {
      rtb_V_ias = 0.0F;
      rtb_V_tas = 0.0F;
      rtb_mach_i = 0.0F;
      rtb_alpha = 0.0F;
      rtb_p_s_c = 0.0F;
      rtb_alt = 0.0F;
    }

    if (!rtb_irOwnInvalid) {
      rtb_theta = FmgcComputer_U.in.bus_inputs.ir_own_bus.pitch_angle_deg.Data;
      rtb_phi = FmgcComputer_U.in.bus_inputs.ir_own_bus.roll_angle_deg.Data;
      rtb_q = FmgcComputer_U.in.bus_inputs.ir_own_bus.body_pitch_rate_deg_s.Data;
      rtb_r = FmgcComputer_U.in.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = FmgcComputer_U.in.bus_inputs.ir_own_bus.body_long_accel_g.Data;
      rtb_n_y = FmgcComputer_U.in.bus_inputs.ir_own_bus.body_lat_accel_g.Data;
      rtb_n_z = FmgcComputer_U.in.bus_inputs.ir_own_bus.body_normal_accel_g.Data;
      rtb_theta_dot = FmgcComputer_U.in.bus_inputs.ir_own_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = FmgcComputer_U.in.bus_inputs.ir_own_bus.roll_att_rate_deg_s.Data;
      rtb_hdg = FmgcComputer_U.in.bus_inputs.ir_own_bus.heading_magnetic_deg.Data;
      rtb_trk = FmgcComputer_U.in.bus_inputs.ir_own_bus.track_angle_magnetic_deg.Data;
      rtb_vz = FmgcComputer_U.in.bus_inputs.ir_own_bus.inertial_vertical_speed_ft_s.Data;
      rtb_fpa = FmgcComputer_U.in.bus_inputs.ir_own_bus.flight_path_angle_deg.Data;
    } else if (!rtb_ir3Invalid) {
      rtb_theta = FmgcComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
      rtb_phi = FmgcComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
      rtb_q = FmgcComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
      rtb_r = FmgcComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = FmgcComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
      rtb_n_y = FmgcComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
      rtb_n_z = FmgcComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
      rtb_theta_dot = FmgcComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = FmgcComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
      rtb_hdg = FmgcComputer_U.in.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
      rtb_trk = FmgcComputer_U.in.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
      rtb_vz = FmgcComputer_U.in.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
      rtb_fpa = FmgcComputer_U.in.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
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
      rtb_hdg = 0.0F;
      rtb_trk = 0.0F;
      rtb_vz = 0.0F;
      rtb_fpa = 0.0F;
    }

    raOwnInvalid = (FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.SSM == static_cast<uint32_T>
                    (SignStatusMatrix::FailureWarning));
    raOppInvalid = (FmgcComputer_U.in.bus_inputs.ra_opp_bus.radio_height_ft.SSM == static_cast<uint32_T>
                    (SignStatusMatrix::FailureWarning));
    rtb_Compare = !raOppInvalid;
    rtb_fmgcOppPriority = !raOwnInvalid;
    if (rtb_fmgcOppPriority && rtb_Compare) {
      rtb_raComputationData = FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.Data;
    } else if (raOwnInvalid && rtb_Compare) {
      rtb_raComputationData = FmgcComputer_U.in.bus_inputs.ra_opp_bus.radio_height_ft.Data;
    } else if (rtb_fmgcOppPriority && raOppInvalid) {
      rtb_raComputationData = FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.Data;
    } else {
      rtb_raComputationData = 250.0F;
    }

    rtb_dualRaFailure = (raOwnInvalid && raOppInvalid);
    rtb_bothRaValid = ((FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.SSM == static_cast<uint32_T>
                        (SignStatusMatrix::NormalOperation)) &&
                       (FmgcComputer_U.in.bus_inputs.ra_opp_bus.radio_height_ft.SSM == static_cast<uint32_T>
                        (SignStatusMatrix::NormalOperation)));
    if (FmgcComputer_U.in.discrete_inputs.fac_own_healthy) {
      rtb_Switch_k_0 = &FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_5;
    } else {
      rtb_Switch_k_0 = &FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5;
    }

    FmgcComputer_MATLABFunction_k(rtb_Switch_k_0, FmgcComputer_P.BitfromLabel_bit, &rtb_y_jz);
    rtb_OR9 = (rtb_y_jz != 0U);
    FmgcComputer_MATLABFunction_k(rtb_Switch_k_0, FmgcComputer_P.BitfromLabel1_bit, &rtb_y_jz);
    rtb_AND10 = (rtb_y_jz != 0U);
    FmgcComputer_MATLABFunction_k(rtb_Switch_k_0, FmgcComputer_P.BitfromLabel2_bit, &rtb_y_jz);
    rtb_y_gd = (rtb_y_jz == 0U);
    FmgcComputer_MATLABFunction_f(rtb_Switch_k_0, &rtb_Compare_pf);
    rtb_OR9_b = (rtb_OR9 && rtb_AND10 && rtb_y_gd && rtb_Compare_pf);
    rtb_y_b = ((!rtb_Compare_pf) || (!rtb_y_gd));
    if (FmgcComputer_U.in.discrete_inputs.fac_own_healthy) {
      rtb_Switch_k_0 = &FmgcComputer_U.in.bus_inputs.fac_own_bus.fac_flap_angle;
    } else {
      rtb_Switch_k_0 = &FmgcComputer_U.in.bus_inputs.fac_opp_bus.fac_flap_angle;
    }

    FmgcComputer_MATLABFunction_j(rtb_Switch_k_0, FmgcComputer_P.A429ValueOrDefault_defaultValue, &rtb_y_ke);
    if (FmgcComputer_U.in.discrete_inputs.fac_own_healthy) {
      rtb_Switch_k_0 = &FmgcComputer_U.in.bus_inputs.fac_own_bus.fac_slat_angle_deg;
    } else {
      rtb_Switch_k_0 = &FmgcComputer_U.in.bus_inputs.fac_opp_bus.fac_slat_angle_deg;
    }

    FmgcComputer_MATLABFunction_j(rtb_Switch_k_0, FmgcComputer_P.A429ValueOrDefault1_defaultValue, &rtb_y_j);
    if (FmgcComputer_U.in.discrete_inputs.fac_own_healthy) {
      rtb_Switch_k_0 = &FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_5;
    } else {
      rtb_Switch_k_0 = &FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5;
    }

    FmgcComputer_MATLABFunction_k(rtb_Switch_k_0, FmgcComputer_P.BitfromLabel2_bit_l, &rtb_y_jz);
    FmgcComputer_MATLABFunction_f(rtb_Switch_k_0, &rtb_Compare_pf);
    FmgcComputer_Y.out.logic.fac_flap_slat_data_failure = ((rtb_y_jz != 0U) || (!rtb_Compare_pf));
    rtb_BusAssignment_h_logic_fcu_failure = ((!FmgcComputer_U.in.discrete_inputs.fcu_opp_healthy) &&
      (!FmgcComputer_U.in.discrete_inputs.fcu_own_healthy));
    FmgcComputer_MATLABFunction_f(&FmgcComputer_U.in.bus_inputs.ils_opp_bus.glideslope_deviation_deg, &rtb_y_dh);
    FmgcComputer_MATLABFunction_f(&FmgcComputer_U.in.bus_inputs.ils_opp_bus.localizer_deviation_deg, &rtb_Compare_pf);
    rtb_y_gd = (rtb_y_dh && rtb_Compare_pf);
    FmgcComputer_MATLABFunction_f(&FmgcComputer_U.in.bus_inputs.ils_own_bus.glideslope_deviation_deg, &rtb_y_dh);
    FmgcComputer_MATLABFunction_f(&FmgcComputer_U.in.bus_inputs.ils_own_bus.localizer_deviation_deg, &rtb_Compare_pf);
    rtb_AND10 = (rtb_y_dh && rtb_Compare_pf);
    rtb_OR9 = ((!rtb_y_gd) && (!rtb_AND10));
    rtb_BusAssignment_g_logic_both_ils_valid = (rtb_y_gd && rtb_AND10);
    if (rtb_AND10) {
      rtb_y_jz = FmgcComputer_U.in.bus_inputs.ils_own_bus.runway_heading_deg.SSM;
      rtb_Switch_runway_heading_deg_Data = FmgcComputer_U.in.bus_inputs.ils_own_bus.runway_heading_deg.Data;
      FmgcComputer_Y.out.logic.ils_computation_data.ils_frequency_mhz =
        FmgcComputer_U.in.bus_inputs.ils_own_bus.ils_frequency_mhz;
      rtb_Switch_localizer_deviation_deg_SSM = FmgcComputer_U.in.bus_inputs.ils_own_bus.localizer_deviation_deg.SSM;
      rtb_Switch_localizer_deviation_deg_Data = FmgcComputer_U.in.bus_inputs.ils_own_bus.localizer_deviation_deg.Data;
      rtb_Switch_glideslope_deviation_deg_SSM = FmgcComputer_U.in.bus_inputs.ils_own_bus.glideslope_deviation_deg.SSM;
      rtb_Switch_glideslope_deviation_deg_Data = FmgcComputer_U.in.bus_inputs.ils_own_bus.glideslope_deviation_deg.Data;
    } else {
      rtb_y_jz = FmgcComputer_U.in.bus_inputs.ils_opp_bus.runway_heading_deg.SSM;
      rtb_Switch_runway_heading_deg_Data = FmgcComputer_U.in.bus_inputs.ils_opp_bus.runway_heading_deg.Data;
      FmgcComputer_Y.out.logic.ils_computation_data.ils_frequency_mhz =
        FmgcComputer_U.in.bus_inputs.ils_opp_bus.ils_frequency_mhz;
      rtb_Switch_localizer_deviation_deg_SSM = FmgcComputer_U.in.bus_inputs.ils_opp_bus.localizer_deviation_deg.SSM;
      rtb_Switch_localizer_deviation_deg_Data = FmgcComputer_U.in.bus_inputs.ils_opp_bus.localizer_deviation_deg.Data;
      rtb_Switch_glideslope_deviation_deg_SSM = FmgcComputer_U.in.bus_inputs.ils_opp_bus.glideslope_deviation_deg.SSM;
      rtb_Switch_glideslope_deviation_deg_Data = FmgcComputer_U.in.bus_inputs.ils_opp_bus.glideslope_deviation_deg.Data;
    }

    in_land_or_ga_tmp = (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active ||
                         FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active);
    if (rtb_fmgcOppPriority && rtb_Compare) {
      rtb_y_c = FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.Data;
    } else if (raOwnInvalid && rtb_Compare) {
      rtb_y_c = FmgcComputer_U.in.bus_inputs.ra_opp_bus.radio_height_ft.Data;
    } else if (rtb_fmgcOppPriority && raOppInvalid) {
      rtb_y_c = FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.Data;
    } else {
      rtb_y_c = 250.0F;
    }

    rtb_AND10 = ((!rtb_doubleAdrFault) && (!rtb_doubleIrFault) && ((!rtb_y_b) || in_land_or_ga_tmp) &&
                 (FmgcComputer_U.in.fms_inputs.fm_valid || in_land_or_ga_tmp ||
                  (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active && (rtb_y_c < 700.0F))));
    rtb_NOT4_gb = !FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed;
    rtb_OR_nn = !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active;
    rtb_ap_fd_condition_tmp = !rtb_dualRaFailure;
    rtb_OR1_j = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active;
    rtb_OR_nx = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active;
    rtb_ap_fd_condition = (((!FmgcComputer_P.Constant1_Value.fac_weights_failure) || in_land_or_ga_tmp) &&
      ((!FmgcComputer_P.Constant1_Value.fac_speeds_failure) || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)
      && (rtb_ap_fd_condition_tmp || (rtb_NOT4_gb && rtb_OR1_j && rtb_OR_nx && rtb_OR_nn)) &&
      ((!rtb_BusAssignment_h_logic_fcu_failure) || in_land_or_ga_tmp));
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_n, &rtb_y_en);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_i, &rtb_y_gp);
    if (FmgcComputer_U.in.discrete_inputs.is_unit_1) {
      fdOwnOff = (rtb_y_en != 0U);
      fdOppOff = (rtb_y_gp != 0U);
    } else {
      fdOwnOff = (rtb_y_gp != 0U);
      fdOppOff = (rtb_y_en != 0U);
    }

    fdOwnOff = (rtb_AND10 && rtb_ap_fd_condition && ((!fdOwnOff) || ((!fdOppOff) &&
      (!FmgcComputer_U.in.discrete_inputs.fd_opp_engaged))));
    FmgcComputer_MATLABFunction_i(FmgcComputer_U.in.discrete_inputs.fcu_ap_button, FmgcComputer_P.PulseNode_isRisingEdge,
      &rtb_y_dh, &FmgcComputer_DWork.sf_MATLABFunction_i);
    FmgcComputer_MATLABFunction(!rtb_OR9_b, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode1_isRisingEdge,
      FmgcComputer_P.ConfirmNode1_timeDelay, &rtb_y_gd, &FmgcComputer_DWork.sf_MATLABFunction_f);
    fdOppOff = ((FmgcComputer_U.in.discrete_inputs.eng_opp_stop && FmgcComputer_U.in.discrete_inputs.eng_own_stop &&
                 rtb_OR9_b) || rtb_y_gd);
    FmgcComputer_MATLABFunction_i(FmgcComputer_U.in.discrete_inputs.ap_opp_engaged,
      FmgcComputer_P.PulseNode2_isRisingEdge, &rtb_y_gx, &FmgcComputer_DWork.sf_MATLABFunction_c);
    rtb_appInop_idx_0 = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active;
    rtb_OR2_tmp = (rtb_NOT4_gb && rtb_OR_nn);
    rtb_OR2 = (rtb_OR2_tmp && rtb_appInop_idx_0);
    FmgcComputer_MATLABFunction_i(rtb_OR2, FmgcComputer_P.PulseNode1_isRisingEdge, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_h);
    rtb_TmpSignalConversionAtSFunctionInport3_idx_1 = ((!FmgcComputer_U.in.discrete_inputs.ap_instinctive_disc) &&
      ((!FmgcComputer_U.in.discrete_inputs.elac_own_ap_disc) || (!FmgcComputer_U.in.discrete_inputs.elac_opp_ap_disc)));
    rtb_NOT3 = !rtb_AND10;
    rtb_ap_inop_tmp = (rtb_NOT3 || (!rtb_ap_fd_condition) || (!rtb_TmpSignalConversionAtSFunctionInport3_idx_1));
    rtb_Logic_idx_0_tmp = !FmgcComputer_U.in.discrete_inputs.is_unit_1;
    FmgcComputer_DWork.Memory_PreviousInput = FmgcComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_y_dh &&
      (!FmgcComputer_DWork.Delay_DSTATE_p) && fdOppOff && rtb_ap_fd_condition && rtb_AND10 &&
      rtb_TmpSignalConversionAtSFunctionInport3_idx_1) << 1) + (rtb_ap_inop_tmp || (rtb_y_dh &&
      FmgcComputer_DWork.Delay_DSTATE_p) || FmgcComputer_U.in.discrete_inputs.ap_instinctive_disc || ((rtb_y_gx &&
      rtb_OR2) || (FmgcComputer_U.in.discrete_inputs.ap_opp_engaged && rtb_Compare_pf && rtb_Logic_idx_0_tmp)))) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput];
    FmgcComputer_MATLABFunction(FmgcComputer_DWork.Memory_PreviousInput, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge, FmgcComputer_P.ConfirmNode_timeDelay, &rtb_y_gx,
      &FmgcComputer_DWork.sf_MATLABFunction);
    FmgcComputer_DWork.Delay_DSTATE_p = FmgcComputer_P.Logic_table_h[(((static_cast<uint32_T>(rtb_y_dh &&
      FmgcComputer_DWork.Memory_PreviousInput) << 1) + ((!rtb_y_gx) ||
      FmgcComputer_U.in.discrete_inputs.ap_instinctive_disc)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_g];
    if (rtb_fmgcOppPriority && rtb_Compare) {
      rtb_BusAssignment_i_logic_ra_computation_data_ft = FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.Data;
    } else if (raOwnInvalid && rtb_Compare) {
      rtb_BusAssignment_i_logic_ra_computation_data_ft = FmgcComputer_U.in.bus_inputs.ra_opp_bus.radio_height_ft.Data;
    } else if (rtb_fmgcOppPriority && raOppInvalid) {
      rtb_BusAssignment_i_logic_ra_computation_data_ft = FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.Data;
    } else {
      rtb_BusAssignment_i_logic_ra_computation_data_ft = 250.0;
    }

    FmgcComputer_Y.out.logic.slat_position = rtb_y_j;
    FmgcComputer_MATLABFunction(FmgcComputer_U.in.discrete_inputs.athr_instinctive_disc, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode1_isRisingEdge_n, FmgcComputer_P.ConfirmNode1_timeDelay_l, &rtb_y_gx,
      &FmgcComputer_DWork.sf_MATLABFunction_k);
    FmgcComputer_DWork.Memory_PreviousInput_g1 = FmgcComputer_P.Logic_table_f[(((static_cast<uint32_T>(rtb_y_gx) << 1) +
      FmgcComputer_P.Constant_Value) << 1) + FmgcComputer_DWork.Memory_PreviousInput_g1];
    FmgcComputer_MATLABFunction_i(FmgcComputer_U.in.discrete_inputs.fcu_athr_button,
      FmgcComputer_P.PulseNode_isRisingEdge_k, &rtb_y_gd, &FmgcComputer_DWork.sf_MATLABFunction_o);
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active, FmgcComputer_P.PulseNode1_isRisingEdge_m,
      &rtb_y_dh, &FmgcComputer_DWork.sf_MATLABFunction_kq);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_n, &rtb_y_j);
    rtb_Compare = (rtb_y_j < FmgcComputer_P.CompareToConstant_const);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_p, &rtb_y_j);
    FmgcComputer_MATLABFunction_i(rtb_Compare && (rtb_y_j < FmgcComputer_P.CompareToConstant1_const),
      FmgcComputer_P.PulseNode2_isRisingEdge_n, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_d);
    raOwnInvalid = !FmgcComputer_DWork.Memory_PreviousInput_g1;
    rtb_Compare = (rtb_NOT3 || (!raOwnInvalid));
    FmgcComputer_DWork.Delay_DSTATE_k = FmgcComputer_P.Logic_table_n[(((static_cast<uint32_T>(rtb_AND10 && raOwnInvalid &&
      ((rtb_y_gd && ((rtb_raComputationData > 100.0F) || rtb_dualRaFailure)) || rtb_y_dh)) << 1) + (rtb_Compare ||
      (FmgcComputer_DWork.Delay_DSTATE_k && rtb_y_gd &&
       (!FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.lateral_modes.land_active)) ||
      FmgcComputer_U.in.discrete_inputs.athr_instinctive_disc || rtb_Compare_pf)) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_p];
    raOwnInvalid = (FmgcComputer_U.in.discrete_inputs.ap_opp_engaged || FmgcComputer_U.in.discrete_inputs.fd_opp_engaged);
    rtb_fmgcOppPriority_tmp = !FmgcComputer_DWork.Delay_DSTATE_p;
    raOppInvalid = !fdOwnOff;
    rtb_fmgcOppPriority = (raOwnInvalid || FmgcComputer_U.in.discrete_inputs.athr_opp_engaged);
    rtb_NOT3 = !FmgcComputer_DWork.Delay_DSTATE_k;
    rtb_fmgcOppPriority = ((rtb_Logic_idx_0_tmp || (rtb_fmgcOppPriority_tmp &&
      (FmgcComputer_U.in.discrete_inputs.ap_opp_engaged || raOppInvalid) && (raOwnInvalid || rtb_NOT3) &&
      rtb_fmgcOppPriority)) && (FmgcComputer_U.in.discrete_inputs.is_unit_1 || ((rtb_fmgcOppPriority_tmp ||
      FmgcComputer_U.in.discrete_inputs.ap_opp_engaged) && (raOwnInvalid || raOppInvalid) && (rtb_fmgcOppPriority ||
      rtb_NOT3) && (FmgcComputer_DWork.Delay_DSTATE_p || fdOwnOff || FmgcComputer_DWork.Delay_DSTATE_k ||
                    (!FmgcComputer_U.in.discrete_inputs.fmgc_opp_healthy)))));
    rtb_BusAssignment_m_ap_fd_logic_fmgc_opp_mode_sync_tmp = !FmgcComputer_U.in.discrete_inputs.ap_opp_engaged;
    raOwnInvalid = (rtb_fmgcOppPriority && (rtb_fmgcOppPriority_tmp ||
      rtb_BusAssignment_m_ap_fd_logic_fmgc_opp_mode_sync_tmp));
    raOppInvalid = (FmgcComputer_DWork.Delay_DSTATE_p || FmgcComputer_U.in.discrete_inputs.ap_opp_engaged || fdOwnOff ||
                    FmgcComputer_U.in.discrete_inputs.fd_opp_engaged);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel_bit_c, &rtb_y_gp);
    FmgcComputer_MATLABFunction(rtb_OR9_b, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_h,
      FmgcComputer_P.ConfirmNode_timeDelay_i, &rtb_y_dh, &FmgcComputer_DWork.sf_MATLABFunction_hz);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_l, &rtb_y_j);
    rtb_y_mq = (rtb_y_j < FmgcComputer_P.CompareToConstant3_const);
    rtb_NOT3 = !rtb_y_mq;
    FmgcComputer_MATLABFunction_g(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_flex_temp_deg, &rtb_y_gd);
    rtb_y_gx = (rtb_y_mq && (rtb_y_j > FmgcComputer_P.CompareToConstant4_const) && rtb_y_gd);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_b, &rtb_y_j);
    rtb_y_mq = (rtb_y_j < FmgcComputer_P.CompareToConstant5_const);
    FmgcComputer_MATLABFunction_g(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_flex_temp_deg, &rtb_Compare_pf);
    FmgcComputer_MATLABFunction_i(rtb_NOT3 || rtb_y_gx || (!rtb_y_mq) || (rtb_y_mq && (rtb_y_j >
      FmgcComputer_P.CompareToConstant6_const) && rtb_Compare_pf), FmgcComputer_P.PulseNode_isRisingEdge_p,
      &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_gk);
    rtb_y_gx = !raOwnInvalid;
    rtb_OR_od_tmp = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active;
    rtb_OR_od_tmp_0 = (rtb_y_gx && rtb_OR_od_tmp && rtb_appInop_idx_0);
    rtb_NOT3 = (((FmgcComputer_U.in.fms_inputs.v_2_kts > FmgcComputer_P.CompareToConstant1_const_k) && (rtb_y_gp != 0U) &&
                 raOwnInvalid) || (rtb_OR_od_tmp_0 && rtb_y_dh && (FmgcComputer_U.in.fms_inputs.v_2_kts >
      FmgcComputer_P.CompareToConstant2_const) && (FmgcComputer_P.Constant_Value_o >=
      FmgcComputer_P.CompareToConstant_const_b) && rtb_Compare_pf));
    FmgcComputer_MATLABFunction(rtb_NOT3, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_c,
      FmgcComputer_P.ConfirmNode_timeDelay_h, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_fx);
    rtb_OR2 = !raOppInvalid;
    rtb_Logic_gj_idx_0_tmp_tmp_tmp = (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.fpa_active);
    rtb_Logic_gj_idx_0_tmp_tmp_tmp_0 = (rtb_Logic_gj_idx_0_tmp_tmp_tmp ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active);
    rtb_Logic_gj_idx_0_tmp_tmp = (rtb_Logic_gj_idx_0_tmp_tmp_tmp_0 ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active);
    rtb_NOT1_p = (rtb_Logic_gj_idx_0_tmp_tmp || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active
                  || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active);
    FmgcComputer_DWork.Memory_PreviousInput_k = FmgcComputer_P.Logic_table_b[(((rtb_OR2 || ((rtb_NOT1_p ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_Compare_pf))) + (static_cast<uint32_T>
      (rtb_NOT3) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_k];
    rtb_BusAssignment_f4_logic_ils_computation_data_runway_heading_deg.SSM = rtb_y_jz;
    rtb_BusAssignment_f4_logic_ils_computation_data_runway_heading_deg.Data = rtb_Switch_runway_heading_deg_Data;
    rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg.SSM = rtb_Switch_localizer_deviation_deg_SSM;
    rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg.Data =
      rtb_Switch_localizer_deviation_deg_Data;
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_m, &rtb_y_gp);
    rtb_y_mq = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_g, &rtb_y_gp);
    FmgcComputer_MATLABFunction_d(FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active,
      FmgcComputer_U.in.time.dt, &rtb_Compare_pf, FmgcComputer_P.MTrigNode_isRisingEdge,
      FmgcComputer_P.MTrigNode_retriggerable, FmgcComputer_P.MTrigNode_triggerDuration,
      &FmgcComputer_DWork.sf_MATLABFunction_db);
    FmgcComputer_MATLABFunction_j(&rtb_BusAssignment_f4_logic_ils_computation_data_runway_heading_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_m, &rtb_y_j);
    rtb_Abs1 = std::abs(static_cast<real_T>(rtb_y_j) - rtb_hdg);
    FmgcComputer_MATLABFunction_j(&rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_e, &rtb_y_j);
    FmgcComputer_MATLABFunction_g(&rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg, &rtb_y_gd);
    FmgcComputer_MATLABFunction(rtb_OR9_b, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_p,
      FmgcComputer_P.ConfirmNode_timeDelay_o, &rtb_y_dh, &FmgcComputer_DWork.sf_MATLABFunction_fm);
    if (rtb_y_j < 0.0F) {
      rtb_Sum1 = -rtb_y_j;
    } else {
      rtb_Sum1 = rtb_y_j;
    }

    rtb_NOT3 = ((rtb_y_mq && (rtb_y_gp != 0U) && raOwnInvalid) || (rtb_y_gx &&
      (!FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active) && ((FmgcComputer_P.Constant_Value_o >=
      FmgcComputer_P.CompareToConstant_const_cq) && rtb_Compare_pf && (rtb_Abs1 <=
      FmgcComputer_P.CompareToConstant2_const_b) && (rtb_Sum1 < FmgcComputer_P.CompareToConstant1_const_i) &&
      FmgcComputer_P.Constant_Value_j && rtb_y_gd && rtb_y_dh)));
    FmgcComputer_MATLABFunction(rtb_NOT3, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_l,
      FmgcComputer_P.ConfirmNode_timeDelay_f, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_jl);
    rtb_y_dh = !rtb_Compare_pf;
    FmgcComputer_MATLABFunction_g(&rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg,
      &rtb_Compare_pf);
    FmgcComputer_DWork.Memory_PreviousInput_c = FmgcComputer_P.Logic_table_hz[((((rtb_y_dh &&
      (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_trk_submode_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_OR2 || (!rtb_Compare_pf)) +
      (static_cast<uint32_T>(rtb_NOT3) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_c];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_f, &rtb_y_gp);
    rtb_y_mq = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_n, &rtb_y_gp);
    FmgcComputer_MATLABFunction_d(rtb_raComputationData >= FmgcComputer_P.CompareToConstant_const_l,
      FmgcComputer_U.in.time.dt, &rtb_Compare_pf, FmgcComputer_P.MTrigNode_isRisingEdge_j,
      FmgcComputer_P.MTrigNode_retriggerable_p, FmgcComputer_P.MTrigNode_triggerDuration_n,
      &FmgcComputer_DWork.sf_MATLABFunction_mn);
    rtb_OR_c_tmp = !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active;
    rtb_NOT3 = ((rtb_y_mq && (rtb_y_gp != 0U) && raOwnInvalid) || (rtb_y_gx && (rtb_OR_c_tmp &&
      (!FmgcComputer_DWork.Delay_DSTATE.armed_modes.nav_armed)) && rtb_Compare_pf));
    FmgcComputer_MATLABFunction(rtb_NOT3, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_hu,
      FmgcComputer_P.ConfirmNode_timeDelay_j, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_kz);
    FmgcComputer_DWork.Memory_PreviousInput_b = FmgcComputer_P.Logic_table_d[(((((!rtb_Compare_pf) &&
      (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_OR2) + (static_cast<uint32_T>(rtb_NOT3) << 1))
      << 1) + FmgcComputer_DWork.Memory_PreviousInput_b];
    FmgcComputer_Y.out.logic.flap_position = rtb_y_ke;
    rtb_NOT3 = (FmgcComputer_DWork.Memory_PreviousInput_c || FmgcComputer_DWork.Memory_PreviousInput_b);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_k, &rtb_y_gp);
    rtb_y_nk = ((rtb_y_gp != 0U) && raOwnInvalid);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_b, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode_isRisingEdge_l, &rtb_y_gd,
      &FmgcComputer_DWork.sf_MATLABFunction_hh);
    FmgcComputer_MATLABFunction(FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_f, FmgcComputer_P.ConfirmNode_timeDelay_d, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_ha);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.ils_opp_bus.ils_frequency_mhz,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_ek, &rtb_y_c);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.ils_own_bus.ils_frequency_mhz,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_f, &rtb_y_je);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.ils_opp_bus.runway_heading_deg,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue, &rtb_y_ke);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.ils_own_bus.runway_heading_deg,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue, &rtb_y_j);
    rtb_y_ae_tmp = !FmgcComputer_P.Constant2_Value_p;
    rtb_NOT4_gb = !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_active;
    rtb_y_ae_tmp_0 = !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active;
    rtb_y_ae_tmp_1 = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active;
    rtb_y_ae_tmp_2 = !rtb_OR9;
    rtb_y_mq = (rtb_OR_nn && (rtb_y_nk || (rtb_y_gx && (FmgcComputer_P.Constant_Value_l && rtb_y_ae_tmp_2 &&
      (rtb_BusAssignment_i_logic_ra_computation_data_ft >= FmgcComputer_P.CompareToConstant_const_g) &&
      rtb_ap_fd_condition_tmp && rtb_y_gd && (!rtb_Compare_pf) && (rtb_y_ae_tmp_1 &&
      (!FmgcComputer_DWork.Delay_DSTATE.armed_modes.final_des_armed))) && rtb_OR_od_tmp && rtb_appInop_idx_0 &&
      rtb_NOT4_gb && rtb_y_ae_tmp_0 && rtb_y_ae_tmp && rtb_y_ae_tmp && ((rtb_y_c == rtb_y_je) && (rtb_y_ke == rtb_y_j)))));
    rtb_y_k = (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
               FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active);
    rtb_TmpSignalConversionAtSFunctionInport3_idx_1 = (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active);
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active, FmgcComputer_P.PulseNode2_isRisingEdge_e,
      &rtb_y_dh, &FmgcComputer_DWork.sf_MATLABFunction_kb);
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active, FmgcComputer_P.PulseNode3_isRisingEdge, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_eb2);
    rtb_y_nk = (rtb_TmpSignalConversionAtSFunctionInport3_idx_1 && rtb_Compare_pf);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_l, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode1_isRisingEdge_c, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_es);
    FmgcComputer_DWork.Memory_PreviousInput_l = FmgcComputer_P.Logic_table_k[(((in_land_or_ga_tmp || ((!rtb_y_k) &&
      (!rtb_TmpSignalConversionAtSFunctionInport3_idx_1) && FmgcComputer_DWork.Delay_DSTATE.armed_modes.nav_armed) ||
      ((rtb_y_k && rtb_y_dh) || rtb_y_nk) || (rtb_y_gd && FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed) ||
      rtb_Compare_pf || rtb_OR2) + (static_cast<uint32_T>(rtb_y_mq) << 1)) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_l];
    FmgcComputer_MATLABFunction(!FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_e, FmgcComputer_P.ConfirmNode_timeDelay_l, &rtb_y_dh,
      &FmgcComputer_DWork.sf_MATLABFunction_mq);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4,
      FmgcComputer_P.BitfromLabel_bit_ff, &rtb_y_gp);
    FmgcComputer_MATLABFunction(rtb_raComputationData < FmgcComputer_P.CompareToConstant_const_d,
      FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode1_isRisingEdge_g, FmgcComputer_P.ConfirmNode1_timeDelay_d,
      &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_crq);
    rtb_y_mq = (rtb_y_dh && (((rtb_y_gp != 0U) && raOwnInvalid) || (rtb_y_gx &&
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active &&
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active && rtb_Compare_pf)));
    FmgcComputer_MATLABFunction(rtb_y_mq, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_d,
      FmgcComputer_P.ConfirmNode_timeDelay_a, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_op);
    rtb_y_k = !rtb_Compare_pf;
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_f, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode_isRisingEdge_a, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_fa);
    FmgcComputer_MATLABFunction(rtb_OR9_b, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode2_isRisingEdge,
      FmgcComputer_P.ConfirmNode2_timeDelay, &rtb_y_dh, &FmgcComputer_DWork.sf_MATLABFunction_fo);
    in_land_or_ga_tmp = (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_active ||
                         FmgcComputer_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active);
    rtb_y_gd = (in_land_or_ga_tmp || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
                FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active);
    rtb_Logic_d_idx_0_tmp = (rtb_y_gd || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active);
    FmgcComputer_DWork.Memory_PreviousInput_d = FmgcComputer_P.Logic_table_p[(((((rtb_NOT1_p ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active || (rtb_Logic_d_idx_0_tmp ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active)) && rtb_y_k) ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active || (rtb_fmgcOppPriority_tmp &&
      rtb_BusAssignment_m_ap_fd_logic_fmgc_opp_mode_sync_tmp && rtb_Compare_pf && rtb_y_dh) || rtb_OR2) +
      (static_cast<uint32_T>(rtb_y_mq) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_d];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_l, &rtb_y_gp);
    rtb_y_mq = ((rtb_y_gp != 0U) && raOwnInvalid);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_e, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode_isRisingEdge_h, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_d3);
    rtb_NOT1_p = (rtb_OR_od_tmp && rtb_NOT4_gb && rtb_appInop_idx_0 && rtb_y_ae_tmp_0 && rtb_y_ae_tmp_1 &&
                  rtb_Compare_pf);
    FmgcComputer_DWork.Memory_PreviousInput_dv = FmgcComputer_P.Logic_table_c[(((static_cast<uint32_T>(rtb_OR_nn &&
      rtb_y_mq) << 1) + false) << 1) + FmgcComputer_DWork.Memory_PreviousInput_dv];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel_bit_a, &rtb_y_gp);
    FmgcComputer_DWork.Memory_PreviousInput_f = FmgcComputer_P.Logic_table_pl[(((static_cast<uint32_T>((rtb_y_gp != 0U) &&
      raOwnInvalid) << 1) + false) << 1) + FmgcComputer_DWork.Memory_PreviousInput_f];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel_bit_cs, &rtb_y_gp);
    FmgcComputer_MATLABFunction(rtb_OR9_b, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_m,
      FmgcComputer_P.ConfirmNode_timeDelay_j5, &rtb_NOT4_gb, &FmgcComputer_DWork.sf_MATLABFunction_hv);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_p, &rtb_y_j);
    rtb_y_dh = (rtb_y_j >= FmgcComputer_P.CompareToConstant3_const_i);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_d, &rtb_y_j);
    FmgcComputer_MATLABFunction_i(rtb_y_dh || (rtb_y_j >= FmgcComputer_P.CompareToConstant5_const_k),
      FmgcComputer_P.PulseNode_isRisingEdge_c, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_fn);
    rtb_y_dh = (((rtb_y_gp != 0U) && raOwnInvalid) || (rtb_OR_od_tmp_0 && (!rtb_NOT4_gb) &&
      (FmgcComputer_P.Constant_Value_o >= FmgcComputer_P.CompareToConstant_const_j) && rtb_Compare_pf));
    FmgcComputer_MATLABFunction(rtb_y_dh, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_hj,
      FmgcComputer_P.ConfirmNode_timeDelay_a3, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_lm);
    FmgcComputer_DWork.Memory_PreviousInput_i = FmgcComputer_P.Logic_table_o[(((rtb_OR2 || ((rtb_Logic_gj_idx_0_tmp_tmp ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_Compare_pf))) + (static_cast<uint32_T>
      (rtb_y_dh) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_i];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_e, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active,
      FmgcComputer_P.PulseNode_isRisingEdge_f, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_pn);
    rtb_y_dh = (((rtb_y_gp != 0U) && raOwnInvalid) || (rtb_y_gx && (rtb_y_ae_tmp_0 && rtb_Compare_pf)));
    FmgcComputer_MATLABFunction(rtb_y_dh, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_mf,
      FmgcComputer_P.ConfirmNode_timeDelay_dw, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_mtz);
    FmgcComputer_DWork.Memory_PreviousInput_e = FmgcComputer_P.Logic_table_c2[(((rtb_OR2 ||
      ((FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_Compare_pf))) + (static_cast<uint32_T>
      (rtb_y_dh) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_e];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_p, &rtb_y_gp);
    rtb_y_dh = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_o, &rtb_y_gp);
    rtb_y_dh = (rtb_y_dh || (rtb_y_gp != 0U));
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel2_bit_i, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode_isRisingEdge_i, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_di2);
    rtb_y_k = (fdOppOff && rtb_Compare_pf && rtb_OR_nn && (rtb_y_ae_tmp_0 ||
                (rtb_BusAssignment_i_logic_ra_computation_data_ft >= FmgcComputer_P.CompareToConstant_const_a)));
    rtb_y_ae_tmp = !FmgcComputer_U.in.fms_inputs.lateral_flight_plan_valid;
    rtb_y_mq = (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active && rtb_y_ae_tmp && rtb_y_ae_tmp_1);
    FmgcComputer_MATLABFunction_i(raOppInvalid, FmgcComputer_P.PulseNode1_isRisingEdge_e, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_h4);
    rtb_Logic_gj_idx_0_tmp_tmp = !rtb_OR9_b;
    rtb_y_nk = (rtb_Logic_gj_idx_0_tmp_tmp && rtb_Compare_pf);
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active, FmgcComputer_P.PulseNode3_isRisingEdge_l,
      &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_gb);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel4_bit, &rtb_y_gp);
    FmgcComputer_MATLABFunction_d(rtb_y_gp != 0U, FmgcComputer_U.in.time.dt, &rtb_NOT1_p,
      FmgcComputer_P.MTrigNode_isRisingEdge_g, FmgcComputer_P.MTrigNode_retriggerable_f,
      FmgcComputer_P.MTrigNode_triggerDuration_b, &FmgcComputer_DWork.sf_MATLABFunction_aw);
    rtb_NOT4_gb = (rtb_TmpSignalConversionAtSFunctionInport3_idx_1 && rtb_Compare_pf && (!rtb_NOT1_p));
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode2_isRisingEdge_b, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_at);
    rtb_NOT1_p = (rtb_TmpSignalConversionAtSFunctionInport3_idx_1 && rtb_OR2_tmp && rtb_Compare_pf);
    rtb_y_dh = ((rtb_y_dh && raOwnInvalid) || (rtb_y_gx && (rtb_y_k || rtb_y_mq || rtb_y_nk || rtb_NOT4_gb || rtb_NOT1_p)));
    FmgcComputer_MATLABFunction(rtb_y_dh, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_a,
      FmgcComputer_P.ConfirmNode_timeDelay_a2, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_hdw);
    FmgcComputer_DWork.Memory_PreviousInput_f2 = FmgcComputer_P.Logic_table_i[(((((!rtb_Compare_pf) && (rtb_y_gd ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_OR2) + (static_cast<uint32_T>(rtb_y_dh) << 1)) <<
      1) + FmgcComputer_DWork.Memory_PreviousInput_f2];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit, &rtb_y_gp);
    rtb_OR2_tmp = ((rtb_y_gp != 0U) && FmgcComputer_DWork.Memory_PreviousInput_f2);
    rtb_NOT4_gb = (FmgcComputer_DWork.Memory_PreviousInput_f2 && (rtb_y_gp == 0U));
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_fu, &rtb_y_gp);
    rtb_y_dh = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel2_bit_m, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode_isRisingEdge_j, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_m1);
    rtb_BusAssignment_m_ap_fd_logic_fmgc_opp_mode_sync_tmp =
      !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active;
    rtb_OR_od_tmp_0 = !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active;
    rtb_y_k = (rtb_BusAssignment_m_ap_fd_logic_fmgc_opp_mode_sync_tmp && rtb_OR_od_tmp_0 && rtb_OR_nn && rtb_Compare_pf);
    FmgcComputer_MATLABFunction_g(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_hdg_deg, &rtb_y_nk);
    FmgcComputer_MATLABFunction_g(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_trk_deg, &rtb_y_mq);
    rtb_y_gd = ((!rtb_y_nk) && (!rtb_y_mq));
    FmgcComputer_MATLABFunction_i(FmgcComputer_U.in.fms_inputs.lateral_flight_plan_valid,
      FmgcComputer_P.PulseNode3_isRisingEdge_e, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_hu);
    rtb_fmgcOppPriority_tmp = ((!FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.any_lateral_mode_engaged) ||
      FmgcComputer_DWork.Memory_PreviousInput_c);
    rtb_y_nk = rtb_fmgcOppPriority_tmp;
    rtb_y_gd = (rtb_y_gx && FmgcComputer_U.in.fms_inputs.lateral_flight_plan_valid && (rtb_y_k || (rtb_OR9_b &&
      (rtb_y_gd || rtb_Compare_pf) && rtb_fmgcOppPriority_tmp)));
    rtb_y_dh = ((rtb_y_dh && raOwnInvalid) || rtb_y_gd);
    FmgcComputer_MATLABFunction_g(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_hdg_deg, &rtb_y_gd);
    FmgcComputer_MATLABFunction_g(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_trk_deg, &rtb_Compare_pf);
    FmgcComputer_MATLABFunction_i(rtb_y_gd || rtb_Compare_pf, FmgcComputer_P.PulseNode2_isRisingEdge_i, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_h0);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_p, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode1_isRisingEdge_k, &rtb_y_nk,
      &FmgcComputer_DWork.sf_MATLABFunction_jle);
    FmgcComputer_DWork.Memory_PreviousInput_i1 = FmgcComputer_P.Logic_table_g[(((rtb_Compare_pf || rtb_y_nk ||
      (rtb_TmpSignalConversionAtSFunctionInport3_idx_1 || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) ||
      rtb_y_ae_tmp || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active || rtb_OR2) + (static_cast<uint32_T>
      (rtb_y_dh) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_i1];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_nk, &rtb_y_gp);
    rtb_y_dh = (((rtb_y_gp != 0U) && raOwnInvalid) || (rtb_y_gx && FmgcComputer_U.in.fms_inputs.nav_capture_condition &&
      (FmgcComputer_DWork.Delay_DSTATE.armed_modes.nav_armed || FmgcComputer_U.in.fms_inputs.direct_to_nav_engage) &&
      ((rtb_BusAssignment_i_logic_ra_computation_data_ft >= FmgcComputer_P.CompareToConstant_const_o) ||
       rtb_dualRaFailure)));
    FmgcComputer_MATLABFunction(rtb_y_dh, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_co,
      FmgcComputer_P.ConfirmNode_timeDelay_d1, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_ge4);
    FmgcComputer_DWork.Memory_PreviousInput_ip = FmgcComputer_P.Logic_table_a[(((rtb_y_ae_tmp || rtb_OR2 ||
      ((rtb_Logic_d_idx_0_tmp || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_Compare_pf))) + (
      static_cast<uint32_T>(rtb_y_dh) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_ip];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_o, &rtb_y_gp);
    rtb_y_dh = (rtb_y_gp != 0U);
    rtb_y_gd = rtb_y_gx;
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active, FmgcComputer_P.PulseNode1_isRisingEdge_cs, &rtb_NOT1_p,
      &FmgcComputer_DWork.sf_MATLABFunction_ma);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_ls, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode2_isRisingEdge_o, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_k4);
    rtb_y_mq = (rtb_Compare_pf && rtb_y_ae_tmp_2 && (rtb_raComputationData >= FmgcComputer_P.CompareToConstant_const_m) &&
                ((FmgcComputer_P.EnumeratedConstant_Value_a != FmgcComputer_U.in.fms_inputs.fms_flight_phase) &&
                 (FmgcComputer_U.in.fms_inputs.fms_flight_phase != FmgcComputer_P.EnumeratedConstant1_Value_dg)));
    FmgcComputer_MATLABFunction(rtb_y_mq, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_n,
      FmgcComputer_P.ConfirmNode_timeDelay_g, &rtb_y_gd, &FmgcComputer_DWork.sf_MATLABFunction_ah);
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed,
      FmgcComputer_P.PulseNode_isRisingEdge_g, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_ol);
    FmgcComputer_DWork.Memory_PreviousInput_a = FmgcComputer_P.Logic_table_ku[(((((!rtb_y_gd) && rtb_Compare_pf) ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active) + (static_cast<uint32_T>((rtb_y_dh &&
      raOwnInvalid) || (rtb_y_gx && (rtb_NOT1_p || rtb_y_mq))) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_a];
    rtb_BusAssignment_k_logic_ils_computation_data_localizer_deviation_deg.SSM = rtb_Switch_localizer_deviation_deg_SSM;
    rtb_BusAssignment_k_logic_ils_computation_data_localizer_deviation_deg.Data =
      rtb_Switch_localizer_deviation_deg_Data;
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_j, &rtb_y_gp);
    FmgcComputer_MATLABFunction_j(&rtb_BusAssignment_k_logic_ils_computation_data_localizer_deviation_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_o, &rtb_y_j);
    if (rtb_y_j < 0.0F) {
      rtb_Abs1 = -rtb_y_j;
    } else {
      rtb_Abs1 = rtb_y_j;
    }

    FmgcComputer_MATLABFunction_g(&rtb_BusAssignment_k_logic_ils_computation_data_localizer_deviation_deg,
      &rtb_Compare_pf);
    rtb_y_dh = (((rtb_y_gp != 0U) && raOwnInvalid) || (rtb_y_gx && FmgcComputer_DWork.Delay_DSTATE.armed_modes.loc_armed
      && FmgcComputer_P.Constant_Value_d && (rtb_Abs1 < FmgcComputer_P.CompareToConstant1_const_b) &&
      (FmgcComputer_P.Constant_Value_d && (rtb_Abs1 < FmgcComputer_P.CompareToConstant2_const_n)) && rtb_Compare_pf));
    FmgcComputer_MATLABFunction(rtb_y_dh, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_at,
      FmgcComputer_P.ConfirmNode_timeDelay_h4, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_p4);
    rtb_y_gd = (in_land_or_ga_tmp || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active);
    FmgcComputer_DWork.Memory_PreviousInput_cv = FmgcComputer_P.Logic_table_g4[(((((!rtb_Compare_pf) && (rtb_y_gd ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_OR2) + (static_cast<uint32_T>(rtb_y_dh) << 1)) <<
      1) + FmgcComputer_DWork.Memory_PreviousInput_cv];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_es, &rtb_y_gp);
    FmgcComputer_MATLABFunction_j(&rtb_BusAssignment_k_logic_ils_computation_data_localizer_deviation_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_b, &rtb_y_j);
    if (rtb_y_j < 0.0F) {
      rtb_Sum1 = -rtb_y_j;
    } else {
      rtb_Sum1 = rtb_y_j;
    }

    FmgcComputer_MATLABFunction(rtb_Sum1 < FmgcComputer_P.CompareToConstant1_const_n, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_nd, FmgcComputer_P.ConfirmNode_timeDelay_e, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_is);
    rtb_y_dh = (((rtb_y_gp != 0U) && raOwnInvalid) || (rtb_y_gx &&
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active && rtb_Compare_pf));
    FmgcComputer_MATLABFunction(rtb_y_dh, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ea,
      FmgcComputer_P.ConfirmNode_timeDelay_es, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_pr);
    FmgcComputer_DWork.Memory_PreviousInput_lq = FmgcComputer_P.Logic_table_j[(((((!rtb_Compare_pf) && (rtb_y_gd ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_OR2) + (static_cast<uint32_T>(rtb_y_dh) << 1)) <<
      1) + FmgcComputer_DWork.Memory_PreviousInput_lq];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_m, &rtb_y_gp);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_pm, &rtb_y_je);
    rtb_Sum1 = static_cast<real_T>(rtb_alt) - rtb_y_je;
    rtb_Abs1 = std::abs(rtb_Sum1);
    FmgcComputer_DWork.Memory_PreviousInput_n = FmgcComputer_P.Logic_table_pk[(((static_cast<uint32_T>((rtb_y_gp != 0U) ||
      (rtb_Abs1 > FmgcComputer_P.CompareToConstant1_const_h)) << 1) +
      (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active && (rtb_Abs1 <=
      FmgcComputer_P.CompareToConstant_const_mh))) << 1) + FmgcComputer_DWork.Memory_PreviousInput_n];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_et, &rtb_y_gp);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_vz_ft_min,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_j, &rtb_y_ke);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_fpa_deg,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_j, &rtb_y_j);
    if (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.vs_active) {
      rtb_y_j = rtb_y_ke;
    } else if (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.fpa_active) {
      rtb_y_j = 0.0F;
    }

    if (rtb_Sum1 < 0.0) {
      rtb_Compare_pf = (rtb_y_j <= 0.0F);
    } else {
      rtb_Compare_pf = ((rtb_Sum1 > 0.0) && (rtb_y_j >= 0.0F));
    }

    in_land_or_ga_tmp = (((rtb_y_gp != 0U) && raOwnInvalid) || (rtb_y_gx &&
      (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active) &&
      (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active) && rtb_OR1_j && rtb_OR_nx && rtb_y_ae_tmp_1 &&
      rtb_OR_nn && ((!rtb_Compare_pf) || ((!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.vs_active) &&
      (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.fpa_active))) && ((rtb_appInop_idx_0 && rtb_OR_od_tmp) ||
      (rtb_Sum1 <= FmgcComputer_P.CompareToConstant2_const_j)) && raOppInvalid &&
      FmgcComputer_DWork.Memory_PreviousInput_n));
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_ng, &rtb_y_gp);
    rtb_y_dh = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_n, &rtb_y_gp);
    rtb_y_dh = (rtb_y_dh && (rtb_y_gp != 0U));
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_f, &rtb_y_gp);
    FmgcComputer_MATLABFunction_d(rtb_y_gp != 0U, FmgcComputer_U.in.time.dt, &rtb_Compare_pf,
      FmgcComputer_P.MTrigNode_isRisingEdge_k, FmgcComputer_P.MTrigNode_retriggerable_pd,
      FmgcComputer_P.MTrigNode_triggerDuration_bh, &FmgcComputer_DWork.sf_MATLABFunction_bq);
    rtb_y_dh = (rtb_y_dh && raOwnInvalid);
    FmgcComputer_MATLABFunction(rtb_y_dh, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_hux,
      FmgcComputer_P.ConfirmNode_timeDelay_lk, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_hw);
    rtb_Logic_d_idx_0_tmp = (rtb_Logic_gj_idx_0_tmp_tmp_tmp ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active);
    FmgcComputer_DWork.Memory_PreviousInput_ne = FmgcComputer_P.Logic_table_nz[(((rtb_OR2 || ((rtb_Logic_d_idx_0_tmp ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_Compare_pf))) + (static_cast<uint32_T>
      (rtb_y_dh) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_ne];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_p2, &rtb_y_gp);
    rtb_y_dh = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_fr, &rtb_y_gp);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_a, &rtb_y_j);
    FmgcComputer_MATLABFunction(std::abs(static_cast<real_T>(rtb_y_j) - rtb_alt) <
      FmgcComputer_P.CompareToConstant_const_f, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_nf,
      FmgcComputer_P.ConfirmNode_timeDelay_at, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_ee);
    rtb_y_dh = ((rtb_y_dh && (rtb_y_gp != 0U) && raOwnInvalid) || (rtb_y_gx &&
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active && rtb_Compare_pf));
    FmgcComputer_MATLABFunction(rtb_y_dh, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_lj,
      FmgcComputer_P.ConfirmNode_timeDelay_b, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_dt);
    FmgcComputer_DWork.Memory_PreviousInput_cb = FmgcComputer_P.Logic_table_ob[(((rtb_OR2 ||
      ((rtb_Logic_gj_idx_0_tmp_tmp_tmp_0 || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_Compare_pf))) + (static_cast<uint32_T>
      (rtb_y_dh) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_cb];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_a, &rtb_y_gp);
    rtb_y_dh = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_k, &rtb_y_gp);
    rtb_y_dh = (rtb_y_dh || (rtb_y_gp != 0U));
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel4_bit_g, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode_isRisingEdge_d, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_nd);
    rtb_y_k = (fdOppOff && rtb_Compare_pf && rtb_OR_nn);
    FmgcComputer_MATLABFunction_i(raOppInvalid, FmgcComputer_P.PulseNode1_isRisingEdge_ky, &rtb_Compare_pf,
      &FmgcComputer_DWork.sf_MATLABFunction_ds);
    rtb_y_mq = (rtb_Logic_gj_idx_0_tmp_tmp && rtb_Compare_pf);
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Delay_DSTATE_p || FmgcComputer_U.in.discrete_inputs.ap_opp_engaged,
      FmgcComputer_P.PulseNode2_isRisingEdge_bh, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_cx);
    rtb_y_nk = (rtb_Logic_gj_idx_0_tmp_tmp && rtb_Compare_pf &&
                (!FmgcComputer_DWork.Delay_DSTATE.any_longitudinal_mode_engaged));
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active, FmgcComputer_P.PulseNode3_isRisingEdge_n,
      &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_fe);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_m, &rtb_y_j);
    rtb_Abs1 = static_cast<real_T>(rtb_y_j) - rtb_alt;
    rtb_y_gd = ((FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
                 FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
                 FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active) && (rtb_Abs1 >
      FmgcComputer_P.CompareToConstant1_const_o));
    rtb_y_ae_tmp_2 = !FmgcComputer_U.in.fms_inputs.vertical_flight_plan_valid;
    rtb_y_k = (rtb_y_k || rtb_y_mq || rtb_y_nk || ((FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active) && rtb_Compare_pf) ||
               (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active &&
                ((FmgcComputer_P.EnumeratedConstant_Value_p == FmgcComputer_U.in.fms_inputs.fms_flight_phase) ||
                 (FmgcComputer_U.in.fms_inputs.fms_flight_phase == FmgcComputer_P.EnumeratedConstant1_Value_m) ||
                 (FmgcComputer_U.in.fms_inputs.fms_flight_phase == FmgcComputer_P.EnumeratedConstant2_Value) ||
                 (rtb_OR_c_tmp && rtb_BusAssignment_m_ap_fd_logic_fmgc_opp_mode_sync_tmp && rtb_OR_od_tmp_0) ||
                 rtb_y_ae_tmp_2)) || rtb_y_gd || ((FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active) && (rtb_Abs1 <
      FmgcComputer_P.CompareToConstant2_const_g)));
    rtb_Compare_pf = ((rtb_y_dh && raOwnInvalid) || (rtb_y_gx && rtb_y_k));
    FmgcComputer_MATLABFunction(rtb_Compare_pf, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_lu,
      FmgcComputer_P.ConfirmNode_timeDelay_ll, &rtb_y_gd, &FmgcComputer_DWork.sf_MATLABFunction_gbq);
    FmgcComputer_DWork.Memory_PreviousInput_fg = FmgcComputer_P.Logic_table_ny[(((rtb_OR2 ||
      ((FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_gd))) + (static_cast<uint32_T>
      (rtb_Compare_pf) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_fg];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_e, &rtb_y_gp);
    rtb_Logic_gj_idx_0_tmp_tmp_tmp_0 = ((rtb_y_gp != 0U) && FmgcComputer_DWork.Memory_PreviousInput_fg);
    rtb_Logic_gj_idx_0_tmp_tmp_tmp = (FmgcComputer_DWork.Memory_PreviousInput_fg && (rtb_y_gp == 0U));
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_jh, &rtb_y_gp);
    rtb_Compare_pf = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel2_bit_p, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode_isRisingEdge_b, &rtb_y_k,
      &FmgcComputer_DWork.sf_MATLABFunction_p3);
    FmgcComputer_MATLABFunction_i(FmgcComputer_U.in.fms_inputs.lateral_flight_plan_valid,
      FmgcComputer_P.PulseNode3_isRisingEdge_d, &rtb_y_mq, &FmgcComputer_DWork.sf_MATLABFunction_ax);
    rtb_y_nk = (rtb_OR9_b || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active);
    FmgcComputer_DWork.Memory_PreviousInput_m = FmgcComputer_P.Logic_table_ns[(((static_cast<uint32_T>((rtb_Compare_pf &&
      raOwnInvalid) || (rtb_y_gx && (rtb_y_nk && rtb_y_mq && rtb_fmgcOppPriority_tmp))) << 1) + rtb_OR2) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_m];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_g3, &rtb_y_gp);
    rtb_Compare_pf = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_is, &rtb_y_gp);
    rtb_y_gd = (rtb_OR_nn && rtb_OR_nx);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_h, &rtb_y_j);
    rtb_y_k = (rtb_y_j > rtb_alt);
    rtb_y_mq = ((FmgcComputer_P.EnumeratedConstant_Value_pq != FmgcComputer_U.in.fms_inputs.fms_flight_phase) &&
                (FmgcComputer_U.in.fms_inputs.fms_flight_phase != FmgcComputer_P.EnumeratedConstant1_Value_i));
    rtb_Compare_pf = (rtb_Compare_pf && (rtb_y_gp == 0U) && raOwnInvalid);
    FmgcComputer_MATLABFunction(rtb_Compare_pf, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_fc,
      FmgcComputer_P.ConfirmNode_timeDelay_n, &rtb_y_gd, &FmgcComputer_DWork.sf_MATLABFunction_ir);
    rtb_Logic_d_idx_0_tmp = (rtb_Logic_d_idx_0_tmp || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active);
    rtb_y_dh = (rtb_Logic_d_idx_0_tmp || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active);
    FmgcComputer_DWork.Memory_PreviousInput_ec = FmgcComputer_P.Logic_table_kw[(((rtb_OR2 || ((rtb_y_dh ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_gd))) + (static_cast<uint32_T>
      (rtb_Compare_pf) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_ec];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_cq, &rtb_y_gp);
    rtb_Compare_pf = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel2_bit_p5, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode_isRisingEdge_o, &rtb_y_k,
      &FmgcComputer_DWork.sf_MATLABFunction_fz);
    FmgcComputer_MATLABFunction_i(FmgcComputer_U.in.fms_inputs.lateral_flight_plan_valid,
      FmgcComputer_P.PulseNode3_isRisingEdge_j, &rtb_y_mq, &FmgcComputer_DWork.sf_MATLABFunction_mo);
    FmgcComputer_DWork.Memory_PreviousInput_nt = FmgcComputer_P.Logic_table_he[(((static_cast<uint32_T>((rtb_Compare_pf &&
      raOwnInvalid) || (rtb_y_gx && (rtb_y_nk && rtb_y_mq && rtb_fmgcOppPriority_tmp))) << 1) + !raOppInvalid) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_nt];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_mi, &rtb_y_gp);
    rtb_Compare_pf = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_j, &rtb_y_gp);
    rtb_y_gd = (rtb_OR_nx && rtb_OR_nn && (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active) &&
                rtb_y_ae_tmp_1 && rtb_appInop_idx_0 && rtb_OR_od_tmp);
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_mo, &rtb_y_j);
    rtb_Compare_pf = (rtb_Compare_pf && (rtb_y_gp == 0U) && raOwnInvalid);
    FmgcComputer_MATLABFunction(rtb_Compare_pf, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_j,
      FmgcComputer_P.ConfirmNode_timeDelay_dy, &rtb_y_gd, &FmgcComputer_DWork.sf_MATLABFunction_n5);
    rtb_appInop_idx_0 = (rtb_Logic_d_idx_0_tmp || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
                         FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
                         FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
                         FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active);
    rtb_OR_od_tmp = (rtb_appInop_idx_0 || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
                     FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
                     FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active);
    FmgcComputer_DWork.Memory_PreviousInput_b3 = FmgcComputer_P.Logic_table_cv[(((rtb_OR2 || ((rtb_OR_od_tmp ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_gd))) + (static_cast<uint32_T>
      (rtb_Compare_pf) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_b3];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_nv, &rtb_y_gp);
    rtb_Compare_pf = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_i1, &rtb_y_gp);
    rtb_Compare_pf = (rtb_Compare_pf && (rtb_y_gp != 0U));
    rtb_y_gd = rtb_OR_nn;
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_ht, &rtb_y_j);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel4_bit_d, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode_isRisingEdge_n, &rtb_y_gd,
      &FmgcComputer_DWork.sf_MATLABFunction_f0h);
    rtb_y_nk = (FmgcComputer_U.in.fms_inputs.fms_flight_phase == FmgcComputer_P.EnumeratedConstant1_Value_c);
    rtb_y_mq = (rtb_y_gd || (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active &&
      ((FmgcComputer_P.EnumeratedConstant_Value_c == FmgcComputer_U.in.fms_inputs.fms_flight_phase) || rtb_y_nk ||
       rtb_OR_c_tmp || rtb_y_ae_tmp_2)));
    rtb_fmgcOppPriority_tmp = (rtb_y_gx && FmgcComputer_DWork.Delay_DSTATE.armed_modes.alt_acq_arm_possible && fdOppOff &&
      rtb_OR_nn);
    rtb_Compare_pf = ((rtb_Compare_pf && raOwnInvalid) || (rtb_fmgcOppPriority_tmp && (rtb_y_j > rtb_alt) && rtb_y_mq));
    FmgcComputer_MATLABFunction(rtb_Compare_pf, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ca,
      FmgcComputer_P.ConfirmNode_timeDelay_ib, &rtb_y_gd, &FmgcComputer_DWork.sf_MATLABFunction_go);
    FmgcComputer_DWork.Memory_PreviousInput_ae = FmgcComputer_P.Logic_table_jq[(((rtb_OR2 || ((rtb_y_dh ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_gd))) + (static_cast<uint32_T>
      (rtb_Compare_pf) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_ae];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_b, &rtb_y_gp);
    rtb_Compare_pf = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_kr, &rtb_y_gp);
    rtb_Compare_pf = (rtb_Compare_pf && (rtb_y_gp != 0U));
    rtb_y_gd = rtb_OR_nn;
    FmgcComputer_MATLABFunction_j(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_i, &rtb_y_j);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel4_bit_i, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode_isRisingEdge_fw, &rtb_y_mq,
      &FmgcComputer_DWork.sf_MATLABFunction_ms);
    rtb_OR_nn = ((rtb_Compare_pf && raOwnInvalid) || (rtb_fmgcOppPriority_tmp && (rtb_y_j < rtb_alt) && rtb_y_mq));
    FmgcComputer_MATLABFunction(rtb_OR_nn, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ep,
      FmgcComputer_P.ConfirmNode_timeDelay_ob, &rtb_y_gd, &FmgcComputer_DWork.sf_MATLABFunction_khd);
    FmgcComputer_DWork.Memory_PreviousInput_ev = FmgcComputer_P.Logic_table_l[(((rtb_OR2 || ((rtb_OR_od_tmp ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_gd))) + (static_cast<uint32_T>(rtb_OR_nn) <<
      1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_ev];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_b, &rtb_y_gp);
    rtb_y_dh = rtb_y_gx;
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active, FmgcComputer_P.PulseNode1_isRisingEdge_b, &rtb_y_mq,
      &FmgcComputer_DWork.sf_MATLABFunction_pe);
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed,
      FmgcComputer_P.PulseNode_isRisingEdge_lz, &rtb_y_dh, &FmgcComputer_DWork.sf_MATLABFunction_iv);
    FmgcComputer_DWork.Memory_PreviousInput_fm = FmgcComputer_P.Logic_table_dr[(((static_cast<uint32_T>(((rtb_y_gp != 0U)
      && raOwnInvalid) || (rtb_y_gx && (rtb_y_mq && rtb_OR1_j && rtb_OR_nx))) << 1) + (rtb_y_dh ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active)) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_fm];
    rtb_BusAssignment_b_logic_ils_computation_data_glideslope_deviation_deg.SSM =
      rtb_Switch_glideslope_deviation_deg_SSM;
    rtb_BusAssignment_b_logic_ils_computation_data_glideslope_deviation_deg.Data =
      rtb_Switch_glideslope_deviation_deg_Data;
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_n0, &rtb_y_gp);
    rtb_Compare_pf = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_d, &rtb_y_gp);
    rtb_y_gd = rtb_TmpSignalConversionAtSFunctionInport3_idx_1;
    FmgcComputer_MATLABFunction_j(&rtb_BusAssignment_b_logic_ils_computation_data_glideslope_deviation_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_g, &rtb_y_j);
    if (rtb_y_j < 0.0F) {
      rtb_Sum1 = -rtb_y_j;
    } else {
      rtb_Sum1 = rtb_y_j;
    }

    rtb_y_k = (rtb_Sum1 < FmgcComputer_P.CompareToConstant2_const_i);
    FmgcComputer_MATLABFunction_g(&rtb_BusAssignment_b_logic_ils_computation_data_glideslope_deviation_deg, &rtb_y_mq);
    rtb_y_dh = (rtb_y_gx && FmgcComputer_DWork.Delay_DSTATE.armed_modes.glide_armed &&
                rtb_TmpSignalConversionAtSFunctionInport3_idx_1 && rtb_y_k && rtb_y_mq);
    rtb_OR_nx = ((rtb_Compare_pf && (rtb_y_gp != 0U) && raOwnInvalid) || rtb_y_dh);
    FmgcComputer_MATLABFunction(rtb_OR_nx, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_g,
      FmgcComputer_P.ConfirmNode_timeDelay_a3g, &rtb_y_dh, &FmgcComputer_DWork.sf_MATLABFunction_bs);
    rtb_OR1_j = (rtb_appInop_idx_0 || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active);
    FmgcComputer_DWork.Memory_PreviousInput_nu = FmgcComputer_P.Logic_table_d3[(((((!rtb_y_dh) && (rtb_OR1_j ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_OR2) + (static_cast<uint32_T>(rtb_OR_nx) << 1))
      << 1) + FmgcComputer_DWork.Memory_PreviousInput_nu];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_nl, &rtb_y_gp);
    rtb_Compare_pf = (rtb_y_gp != 0U);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_g, &rtb_y_gp);
    rtb_y_dh = rtb_y_gx;
    FmgcComputer_MATLABFunction(FmgcComputer_DWork.Memory_PreviousInput_nu, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_gr, FmgcComputer_P.ConfirmNode_timeDelay_m, &rtb_y_gd,
      &FmgcComputer_DWork.sf_MATLABFunction_mu);
    FmgcComputer_MATLABFunction_j(&rtb_BusAssignment_b_logic_ils_computation_data_glideslope_deviation_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_k, &rtb_y_j);
    if (rtb_y_j < 0.0F) {
      rtb_Sum1 = -rtb_y_j;
    } else {
      rtb_Sum1 = rtb_y_j;
    }

    rtb_OR_nx = ((rtb_Compare_pf && (rtb_y_gp != 0U) && raOwnInvalid) || (rtb_y_gx && rtb_y_gd && (rtb_Sum1 <
      FmgcComputer_P.CompareToConstant2_const_h)));
    FmgcComputer_MATLABFunction(rtb_OR_nx, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_o,
      FmgcComputer_P.ConfirmNode_timeDelay_mu, &rtb_y_dh, &FmgcComputer_DWork.sf_MATLABFunction_dba);
    FmgcComputer_DWork.Memory_PreviousInput_as = FmgcComputer_P.Logic_table_fi[(((((!rtb_y_dh) && (rtb_OR1_j ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_OR2) + (static_cast<uint32_T>(rtb_OR_nx) << 1))
      << 1) + FmgcComputer_DWork.Memory_PreviousInput_as];
    rtb_ap_fd_condition_tmp = (rtb_OR9_b || ((rtb_BusAssignment_i_logic_ra_computation_data_ft <
      FmgcComputer_P.CompareToConstant_const_c) && rtb_ap_fd_condition_tmp) ||
      (FmgcComputer_DWork.Memory_PreviousInput_cv || FmgcComputer_DWork.Memory_PreviousInput_lq ||
       FmgcComputer_DWork.Memory_PreviousInput_d || FmgcComputer_DWork.Memory_PreviousInput_f ||
       FmgcComputer_DWork.Memory_PreviousInput_e));
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_5,
      FmgcComputer_P.BitfromLabel1_bit_aw, &rtb_y_gp);
    rtb_Compare_pf = ((rtb_y_gp != 0U) && raOwnInvalid);
    FmgcComputer_MATLABFunction_i(raOppInvalid, FmgcComputer_P.PulseNode1_isRisingEdge_kl, &rtb_y_k,
      &FmgcComputer_DWork.sf_MATLABFunction_dtd);
    rtb_y_gd = (rtb_y_k && (FmgcComputer_U.in.fms_inputs.fms_flight_phase != FmgcComputer_P.EnumeratedConstant_Value_ad));
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_gv, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode2_isRisingEdge_f, &rtb_y_k,
      &FmgcComputer_DWork.sf_MATLABFunction_d5);
    rtb_y_k = (rtb_y_k && fdOppOff);
    rtb_OR1_j = (rtb_Compare_pf || (rtb_y_gx && (rtb_y_gd || rtb_y_k)));
    FmgcComputer_MATLABFunction(rtb_OR1_j, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ch,
      FmgcComputer_P.ConfirmNode_timeDelay_ht, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_jc);
    FmgcComputer_DWork.Memory_PreviousInput_cu = FmgcComputer_P.Logic_table_kg
      [((((FmgcComputer_DWork.Delay_DSTATE.auto_spd_control_active && (!rtb_Compare_pf)) || (rtb_OR9_b && raOppInvalid))
         + (static_cast<uint32_T>(rtb_OR1_j) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_cu];
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_5,
      FmgcComputer_P.BitfromLabel_bit_kq, &rtb_y_gp);
    rtb_Compare_pf = ((rtb_y_gp != 0U) && raOwnInvalid);
    FmgcComputer_MATLABFunction_i(raOppInvalid, FmgcComputer_P.PulseNode1_isRisingEdge_n, &rtb_y_mq,
      &FmgcComputer_DWork.sf_MATLABFunction_aba);
    rtb_OR1_j = (FmgcComputer_U.in.fms_inputs.v_2_kts != FmgcComputer_P.CompareToConstant_const_e);
    FmgcComputer_MATLABFunction_i(rtb_OR1_j, FmgcComputer_P.PulseNode2_isRisingEdge_iu, &rtb_y_k,
      &FmgcComputer_DWork.sf_MATLABFunction_ft);
    rtb_y_k = (raOppInvalid && rtb_y_k);
    rtb_y_gd = ((rtb_y_mq && rtb_OR1_j) || rtb_y_k);
    FmgcComputer_MATLABFunction_i(FmgcComputer_DWork.Memory_PreviousInput_i || FmgcComputer_DWork.Memory_PreviousInput_k,
      FmgcComputer_P.PulseNode3_isRisingEdge_i, &rtb_y_mq, &FmgcComputer_DWork.sf_MATLABFunction_mrn);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_ie, &rtb_y_gp);
    FmgcComputer_MATLABFunction_i(rtb_y_gp != 0U, FmgcComputer_P.PulseNode_isRisingEdge_jp, &rtb_y_nk,
      &FmgcComputer_DWork.sf_MATLABFunction_ih);
    FmgcComputer_MATLABFunction_i(FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_clb_active ||
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_des_active,
      FmgcComputer_P.PulseNode4_isRisingEdge, &rtb_y_k, &FmgcComputer_DWork.sf_MATLABFunction_lr);
    rtb_OR1_j = (rtb_Compare_pf || (rtb_y_gx && ((rtb_OR9_b && rtb_y_gd) || (rtb_y_mq || rtb_y_nk || rtb_y_k))));
    FmgcComputer_MATLABFunction(rtb_OR1_j, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_h2,
      FmgcComputer_P.ConfirmNode_timeDelay_gz, &rtb_Compare_pf, &FmgcComputer_DWork.sf_MATLABFunction_j3);
    rtb_y_gd = (FmgcComputer_U.in.fms_inputs.v_2_kts == FmgcComputer_P.CompareToConstant1_const_m);
    FmgcComputer_DWork.Memory_PreviousInput_h = FmgcComputer_P.Logic_table_ds
      [((((FmgcComputer_DWork.Delay_DSTATE.manual_spd_control_active && (!rtb_Compare_pf)) || (rtb_OR9_b &&
           ((!FmgcComputer_DWork.Memory_PreviousInput_i) && (!FmgcComputer_DWork.Memory_PreviousInput_k)) && rtb_y_gd))
         + (static_cast<uint32_T>(rtb_OR1_j) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_h];
    rtb_y_dh = (rtb_Logic_gj_idx_0_tmp_tmp_tmp_0 || rtb_Logic_gj_idx_0_tmp_tmp_tmp ||
                FmgcComputer_DWork.Memory_PreviousInput_cb || FmgcComputer_DWork.Memory_PreviousInput_ne ||
                FmgcComputer_DWork.Memory_PreviousInput_ec || FmgcComputer_DWork.Memory_PreviousInput_b3 ||
                FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_clb_active ||
                FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_des_active ||
                FmgcComputer_DWork.Memory_PreviousInput_f || FmgcComputer_DWork.Memory_PreviousInput_nu ||
                FmgcComputer_DWork.Memory_PreviousInput_as || FmgcComputer_DWork.Memory_PreviousInput_ae ||
                FmgcComputer_DWork.Memory_PreviousInput_ev || FmgcComputer_DWork.Memory_PreviousInput_i ||
                FmgcComputer_DWork.Memory_PreviousInput_k ||
                FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.tcas_active ||
                FmgcComputer_DWork.Memory_PreviousInput_d);
    rtb_OR1_j = (rtb_NOT3 || FmgcComputer_DWork.Memory_PreviousInput_e || FmgcComputer_DWork.Memory_PreviousInput_cv ||
                 FmgcComputer_DWork.Memory_PreviousInput_lq || rtb_OR2_tmp || rtb_NOT4_gb ||
                 FmgcComputer_DWork.Memory_PreviousInput_ip || FmgcComputer_DWork.Memory_PreviousInput_d);
    rtb_OR_nx = rtb_y_dh;
    FmgcComputer_MATLABFunction_g(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3, &rtb_y_gd);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_i, &rtb_y_gp);
    FmgcComputer_MATLABFunction_g(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4, &rtb_y_dh);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4,
      FmgcComputer_P.BitfromLabel1_bit_i5, &rtb_y_gp);
    rtb_Compare_pf = (FmgcComputer_DWork.Delay_DSTATE_p && (FmgcComputer_DWork.Memory_PreviousInput_l ||
      FmgcComputer_DWork.Memory_PreviousInput_d));
    rtb_appInop_idx_0 = ((!rtb_ap_inop_tmp) && (FmgcComputer_U.in.discrete_inputs.fwc_own_valid ||
      FmgcComputer_U.in.discrete_inputs.fwc_opp_valid) && FmgcComputer_U.in.discrete_inputs.pfd_own_valid &&
                         FmgcComputer_U.in.discrete_inputs.pfd_opp_valid && rtb_BusAssignment_g_logic_both_ils_valid);
    rtb_y_gx = (rtb_appInop_idx_0 && (!rtb_Compare) && rtb_bothRaValid);
    rtb_OR_nn = (rtb_y_gx && rtb_Compare_pf && FmgcComputer_DWork.Delay_DSTATE_k);
    rtb_Compare_pf = (rtb_appInop_idx_0 && rtb_Compare_pf && (!rtb_OR_nn));
    rtb_appInop_idx_0 = !rtb_appInop_idx_0;
    rtb_y_gx = !rtb_y_gx;
    FmgcComputer_MATLABFunction_g(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4, &rtb_y_dh);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4,
      FmgcComputer_P.BitfromLabel2_bit_o, &rtb_y_gp);
    rtb_OR2 = ((rtb_y_gp != 0U) && rtb_y_dh);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4,
      FmgcComputer_P.BitfromLabel3_bit_l, &rtb_y_gp);
    rtb_TmpSignalConversionAtSFunctionInport3_idx_1 = ((rtb_y_gp != 0U) && rtb_y_dh);
    FmgcComputer_MATLABFunction_k(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4,
      FmgcComputer_P.BitfromLabel4_bit_f, &rtb_y_gp);
    rtb_y_dh = ((rtb_y_gp != 0U) && rtb_y_dh);
    if (FmgcComputer_DWork.Delay_DSTATE_p && FmgcComputer_U.in.discrete_inputs.ap_opp_engaged) {
      if (FmgcComputer_U.in.discrete_inputs.is_unit_1) {
        rtb_OR2 = rtb_Compare_pf;
        rtb_TmpSignalConversionAtSFunctionInport3_idx_1 = rtb_OR_nn;
      }

      rtb_y_dh = (rtb_Logic_idx_0_tmp && rtb_y_dh);
    } else {
      if (!rtb_fmgcOppPriority) {
        rtb_OR2 = rtb_Compare_pf;
        rtb_TmpSignalConversionAtSFunctionInport3_idx_1 = rtb_OR_nn;
      }

      if (!rtb_fmgcOppPriority) {
        rtb_y_dh = false;
      }
    }

    rtb_y_en = static_cast<uint32_T>(FmgcComputer_P.EnumeratedConstant_Value);
    rtb_VectorConcatenate[0] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[1] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[2] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[3] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[4] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[5] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[6] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[7] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[8] = FmgcComputer_DWork.Memory_PreviousInput_h;
    rtb_VectorConcatenate[9] = FmgcComputer_DWork.Memory_PreviousInput_cu;
    rtb_VectorConcatenate[10] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[11] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[12] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[13] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[14] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[15] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[16] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[17] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[18] = FmgcComputer_P.Constant10_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate, &rtb_y_j);
    rtb_VectorConcatenate[0] = FmgcComputer_U.in.discrete_inputs.ap_instinctive_disc;
    rtb_VectorConcatenate[1] = FmgcComputer_DWork.Delay_DSTATE_p;
    rtb_VectorConcatenate[2] = fdOwnOff;
    rtb_VectorConcatenate[3] = FmgcComputer_DWork.Memory_PreviousInput_d;
    rtb_VectorConcatenate[4] = FmgcComputer_P.Constant3_Value;
    rtb_VectorConcatenate[5] = rtb_Compare_pf;
    rtb_VectorConcatenate[6] = rtb_OR_nn;
    rtb_VectorConcatenate[7] = false;
    rtb_VectorConcatenate[8] = rtb_ap_inop_tmp;
    rtb_VectorConcatenate[9] = rtb_appInop_idx_0;
    rtb_VectorConcatenate[10] = rtb_y_gx;
    rtb_VectorConcatenate[11] = true;
    rtb_VectorConcatenate[12] = rtb_OR2;
    rtb_VectorConcatenate[13] = rtb_TmpSignalConversionAtSFunctionInport3_idx_1;
    rtb_VectorConcatenate[14] = rtb_y_dh;
    rtb_VectorConcatenate[15] = FmgcComputer_P.Constant3_Value;
    rtb_VectorConcatenate[16] = FmgcComputer_P.Constant3_Value;
    rtb_VectorConcatenate[17] = FmgcComputer_P.Constant3_Value;
    rtb_VectorConcatenate[18] = FmgcComputer_P.Constant3_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate, &rtb_y_ke);
    if (FmgcComputer_U.in.fms_inputs.flex_temp_deg_c != FmgcComputer_P.CompareToConstant_const_ce) {
      rtb_y_en = static_cast<uint32_T>(FmgcComputer_P.EnumeratedConstant1_Value);
    }

    rtb_VectorConcatenate[0] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[1] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[2] = FmgcComputer_DWork.Delay_DSTATE_k;
    rtb_VectorConcatenate[3] = false;
    rtb_VectorConcatenate[4] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[5] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[6] = FmgcComputer_U.in.discrete_inputs.athr_instinctive_disc;
    rtb_VectorConcatenate[7] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[8] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[9] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[10] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[11] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[12] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[13] = rtb_Compare;
    rtb_VectorConcatenate[14] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[15] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[16] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[17] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[18] = FmgcComputer_P.Constant4_Value_g;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate, &rtb_y_je);
    rtb_VectorConcatenate[0] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[1] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[2] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[3] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[4] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[5] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[6] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[7] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[8] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[9] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[10] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[11] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[12] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[13] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[14] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[15] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[16] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[17] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate[18] = FmgcComputer_P.Constant5_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate, &rtb_y_c);
    rtb_VectorConcatenate[0] = rtb_ap_fd_condition_tmp;
    rtb_VectorConcatenate[1] = in_land_or_ga_tmp;
    rtb_VectorConcatenate[2] = FmgcComputer_DWork.Memory_PreviousInput_n;
    rtb_VectorConcatenate[3] = FmgcComputer_DWork.Memory_PreviousInput_i1;
    rtb_VectorConcatenate[4] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate[5] = FmgcComputer_DWork.Memory_PreviousInput_a;
    rtb_VectorConcatenate[6] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate[7] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate[8] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate[9] = FmgcComputer_DWork.Memory_PreviousInput_l;
    rtb_VectorConcatenate[10] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate[11] = FmgcComputer_DWork.Memory_PreviousInput_fm;
    rtb_VectorConcatenate[12] = FmgcComputer_DWork.Memory_PreviousInput_dv;
    rtb_VectorConcatenate[13] = FmgcComputer_DWork.Memory_PreviousInput_m;
    rtb_VectorConcatenate[14] = FmgcComputer_DWork.Memory_PreviousInput_nt;
    rtb_VectorConcatenate[15] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate[16] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate[17] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate[18] = FmgcComputer_P.Constant6_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate, &rtb_y_kc);
    rtb_VectorConcatenate_j[0] = (FmgcComputer_DWork.Memory_PreviousInput_ec ||
      FmgcComputer_DWork.Memory_PreviousInput_ae ||
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_clb_active);
    rtb_VectorConcatenate_j[1] = (FmgcComputer_DWork.Memory_PreviousInput_b3 ||
      FmgcComputer_DWork.Memory_PreviousInput_ev ||
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_des_active);
    rtb_VectorConcatenate_j[2] = FmgcComputer_P.Constant7_Value;
    rtb_VectorConcatenate_j[3] = (FmgcComputer_DWork.Memory_PreviousInput_ae ||
      FmgcComputer_DWork.Memory_PreviousInput_ev);
    rtb_VectorConcatenate_j[4] = FmgcComputer_DWork.Memory_PreviousInput_k;
    rtb_VectorConcatenate_j[5] = FmgcComputer_DWork.Memory_PreviousInput_i;
    rtb_VectorConcatenate_j[6] = rtb_Logic_gj_idx_0_tmp_tmp_tmp_0;
    rtb_VectorConcatenate_j[7] = rtb_Logic_gj_idx_0_tmp_tmp_tmp;
    rtb_VectorConcatenate_j[8] = (FmgcComputer_DWork.Memory_PreviousInput_ne ||
      FmgcComputer_DWork.Memory_PreviousInput_cb);
    rtb_VectorConcatenate_j[9] = (FmgcComputer_DWork.Memory_PreviousInput_cb ||
      FmgcComputer_DWork.Memory_PreviousInput_as);
    rtb_VectorConcatenate_j[10] = (FmgcComputer_DWork.Memory_PreviousInput_ne ||
      FmgcComputer_DWork.Memory_PreviousInput_nu);
    rtb_VectorConcatenate_j[11] = (FmgcComputer_DWork.Memory_PreviousInput_nu ||
      FmgcComputer_DWork.Memory_PreviousInput_as);
    rtb_VectorConcatenate_j[12] = FmgcComputer_DWork.Memory_PreviousInput_f;
    rtb_VectorConcatenate_j[13] = (FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_des_active
      || FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_clb_active);
    rtb_VectorConcatenate_j[14] = FmgcComputer_P.Constant7_Value;
    rtb_VectorConcatenate_j[15] = FmgcComputer_P.Constant7_Value;
    rtb_VectorConcatenate_j[16] = FmgcComputer_P.Constant7_Value;
    rtb_VectorConcatenate_j[17] = FmgcComputer_P.Constant7_Value;
    rtb_VectorConcatenate_j[18] = FmgcComputer_P.Constant7_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate_j, &rtb_y_p);
    rtb_VectorConcatenate_j[0] = rtb_NOT3;
    rtb_VectorConcatenate_j[1] = FmgcComputer_DWork.Memory_PreviousInput_ip;
    rtb_VectorConcatenate_j[2] = FmgcComputer_DWork.Memory_PreviousInput_cv;
    rtb_VectorConcatenate_j[3] = FmgcComputer_DWork.Memory_PreviousInput_lq;
    rtb_VectorConcatenate_j[4] = FmgcComputer_DWork.Memory_PreviousInput_e;
    rtb_VectorConcatenate_j[5] = rtb_OR2_tmp;
    rtb_VectorConcatenate_j[6] = rtb_NOT4_gb;
    rtb_VectorConcatenate_j[7] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_j[8] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_j[9] = FmgcComputer_DWork.Memory_PreviousInput_c;
    rtb_VectorConcatenate_j[10] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_j[11] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_j[12] = FmgcComputer_DWork.Memory_PreviousInput_b;
    rtb_VectorConcatenate_j[13] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_j[14] = FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.lateral_modes.align_submode_active;
    rtb_VectorConcatenate_j[15] =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.lateral_modes.rollout_submode_active;
    rtb_VectorConcatenate_j[16] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_j[17] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_j[18] = FmgcComputer_P.Constant8_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate_j, &rtb_y_l);
    rtb_VectorConcatenate_j[0] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[1] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[2] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[3] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[4] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[5] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[6] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[7] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[8] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[9] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[10] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[11] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[12] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[13] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[14] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[15] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[16] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[17] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_j[18] = FmgcComputer_P.Constant9_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate_j, &rtb_y_g);
    rtb_y_gp = static_cast<uint32_T>(FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.data = FmgcComputer_U.in;
    FmgcComputer_Y.out.logic.on_ground = rtb_OR9_b;
    FmgcComputer_Y.out.logic.gnd_eng_stop_flt_5s = fdOppOff;
    FmgcComputer_Y.out.logic.ap_fd_athr_common_condition = rtb_AND10;
    FmgcComputer_Y.out.logic.ap_fd_common_condition = rtb_ap_fd_condition;
    FmgcComputer_Y.out.logic.fd_own_engaged = fdOwnOff;
    FmgcComputer_Y.out.logic.ap_own_engaged = FmgcComputer_DWork.Delay_DSTATE_p;
    FmgcComputer_Y.out.logic.athr_own_engaged = FmgcComputer_DWork.Delay_DSTATE_k;
    FmgcComputer_Y.out.logic.athr_active = false;
    FmgcComputer_Y.out.logic.ap_inop = rtb_ap_inop_tmp;
    FmgcComputer_Y.out.logic.athr_inop = rtb_Compare;
    FmgcComputer_Y.out.logic.fmgc_opp_priority = rtb_fmgcOppPriority;
    FmgcComputer_Y.out.logic.double_adr_failure = rtb_doubleAdrFault;
    FmgcComputer_Y.out.logic.double_ir_failure = rtb_doubleIrFault;
    FmgcComputer_Y.out.logic.all_adr_valid = ((!rtb_adrOwnInvalid) && (!rtb_adrOppInvalid) && (!rtb_adr3Invalid));
    FmgcComputer_Y.out.logic.all_ir_valid = ((!rtb_irOwnInvalid) && (!rtb_irOppInvalid) && (!rtb_ir3Invalid));
    FmgcComputer_Y.out.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    FmgcComputer_Y.out.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    FmgcComputer_Y.out.logic.adr_computation_data.mach = rtb_mach_i;
    FmgcComputer_Y.out.logic.adr_computation_data.alpha_deg = rtb_alpha;
    FmgcComputer_Y.out.logic.adr_computation_data.p_s_c_hpa = rtb_p_s_c;
    FmgcComputer_Y.out.logic.adr_computation_data.altitude_corrected_ft = rtb_alt;
    FmgcComputer_Y.out.logic.ir_computation_data.theta_deg = rtb_theta;
    FmgcComputer_Y.out.logic.ir_computation_data.phi_deg = rtb_phi;
    FmgcComputer_Y.out.logic.ir_computation_data.q_deg_s = rtb_q;
    FmgcComputer_Y.out.logic.ir_computation_data.r_deg_s = rtb_r;
    FmgcComputer_Y.out.logic.ir_computation_data.n_x_g = rtb_n_x;
    FmgcComputer_Y.out.logic.ir_computation_data.n_y_g = rtb_n_y;
    FmgcComputer_Y.out.logic.ir_computation_data.n_z_g = rtb_n_z;
    FmgcComputer_Y.out.logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    FmgcComputer_Y.out.logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    FmgcComputer_Y.out.logic.ir_computation_data.hdg_deg = rtb_hdg;
    FmgcComputer_Y.out.logic.ir_computation_data.trk_deg = rtb_trk;
    FmgcComputer_Y.out.logic.ir_computation_data.vz_bi_ft_min = rtb_vz;
    FmgcComputer_Y.out.logic.ir_computation_data.fpa_deg = rtb_fpa;
    FmgcComputer_Y.out.logic.ra_computation_data_ft = rtb_raComputationData;
    FmgcComputer_Y.out.logic.dual_ra_failure = rtb_dualRaFailure;
    FmgcComputer_Y.out.logic.both_ra_valid = rtb_bothRaValid;
    FmgcComputer_Y.out.logic.fac_lg_data_failure = rtb_y_b;
    FmgcComputer_Y.out.logic.flap_slat_lever_position = FmgcComputer_P.Constant_Value_o;
    FmgcComputer_Y.out.logic.fac_speeds_failure = FmgcComputer_P.Constant1_Value.fac_speeds_failure;
    FmgcComputer_Y.out.logic.fac_weights_failure = FmgcComputer_P.Constant1_Value.fac_weights_failure;
    FmgcComputer_Y.out.logic.fcu_failure = rtb_BusAssignment_h_logic_fcu_failure;
    FmgcComputer_Y.out.logic.ils_failure = rtb_OR9;
    FmgcComputer_Y.out.logic.both_ils_valid = rtb_BusAssignment_g_logic_both_ils_valid;
    FmgcComputer_Y.out.logic.ils_computation_data.runway_heading_deg.SSM = rtb_y_jz;
    FmgcComputer_Y.out.logic.ils_computation_data.runway_heading_deg.Data = rtb_Switch_runway_heading_deg_Data;
    FmgcComputer_Y.out.logic.ils_computation_data.localizer_deviation_deg.SSM = rtb_Switch_localizer_deviation_deg_SSM;
    FmgcComputer_Y.out.logic.ils_computation_data.localizer_deviation_deg.Data = rtb_Switch_localizer_deviation_deg_Data;
    FmgcComputer_Y.out.logic.ils_computation_data.glideslope_deviation_deg.SSM = rtb_Switch_glideslope_deviation_deg_SSM;
    FmgcComputer_Y.out.logic.ils_computation_data.glideslope_deviation_deg.Data =
      rtb_Switch_glideslope_deviation_deg_Data;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.rwy_active = rtb_NOT3;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.nav_active = FmgcComputer_DWork.Memory_PreviousInput_ip;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.loc_cpt_active = FmgcComputer_DWork.Memory_PreviousInput_cv;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.loc_trk_active = FmgcComputer_DWork.Memory_PreviousInput_lq;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.roll_goaround_active = FmgcComputer_DWork.Memory_PreviousInput_e;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.hdg_active = rtb_OR2_tmp;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.trk_active = rtb_NOT4_gb;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.rwy_loc_submode_active = FmgcComputer_DWork.Memory_PreviousInput_c;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.rwy_trk_submode_active = FmgcComputer_DWork.Memory_PreviousInput_b;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.land_active = FmgcComputer_DWork.Memory_PreviousInput_d;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.align_submode_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.lateral_modes.align_submode_active;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.rollout_submode_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.lateral_modes.rollout_submode_active;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.clb_active = FmgcComputer_DWork.Memory_PreviousInput_ec;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.des_active = FmgcComputer_DWork.Memory_PreviousInput_b3;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.op_clb_active = FmgcComputer_DWork.Memory_PreviousInput_ae;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.op_des_active = FmgcComputer_DWork.Memory_PreviousInput_ev;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.exp_clb_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_clb_active;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.exp_des_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_des_active;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.pitch_takeoff_active = FmgcComputer_DWork.Memory_PreviousInput_k;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.pitch_goaround_active = FmgcComputer_DWork.Memory_PreviousInput_i;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.vs_active = rtb_Logic_gj_idx_0_tmp_tmp_tmp_0;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.fpa_active = rtb_Logic_gj_idx_0_tmp_tmp_tmp;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.alt_acq_active = FmgcComputer_DWork.Memory_PreviousInput_ne;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.alt_hold_active = FmgcComputer_DWork.Memory_PreviousInput_cb;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.gs_capt_active = FmgcComputer_DWork.Memory_PreviousInput_nu;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.gs_trk_active = FmgcComputer_DWork.Memory_PreviousInput_as;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.final_des_active = FmgcComputer_DWork.Memory_PreviousInput_f;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.flare_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.flare_active;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.cruise_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.cruise_active;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.tcas_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.tcas_active;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.alt_acq_armed = in_land_or_ga_tmp;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.alt_acq_arm_possible = FmgcComputer_DWork.Memory_PreviousInput_n;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.nav_armed = FmgcComputer_DWork.Memory_PreviousInput_i1;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.loc_armed = FmgcComputer_DWork.Memory_PreviousInput_a;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.land_armed = FmgcComputer_DWork.Memory_PreviousInput_l;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.glide_armed = FmgcComputer_DWork.Memory_PreviousInput_fm;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.final_des_armed = FmgcComputer_DWork.Memory_PreviousInput_dv;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.clb_armed = FmgcComputer_DWork.Memory_PreviousInput_m;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.des_armed = FmgcComputer_DWork.Memory_PreviousInput_nt;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.tcas_armed =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.armed_modes.tcas_armed;
    FmgcComputer_Y.out.ap_fd_logic.auto_spd_control_active = FmgcComputer_DWork.Memory_PreviousInput_h;
    FmgcComputer_Y.out.ap_fd_logic.manual_spd_control_active = FmgcComputer_DWork.Memory_PreviousInput_cu;
    FmgcComputer_Y.out.ap_fd_logic.fmgc_opp_mode_sync = raOwnInvalid;
    FmgcComputer_Y.out.ap_fd_logic.any_ap_fd_engaged = raOppInvalid;
    FmgcComputer_Y.out.ap_fd_logic.any_lateral_mode_engaged = rtb_OR1_j;
    FmgcComputer_Y.out.ap_fd_logic.any_longitudinal_mode_engaged = rtb_OR_nx;
    FmgcComputer_Y.out.ap_fd_logic.hdg_trk_preset_available = rtb_ap_fd_condition_tmp;
    FmgcComputer_Y.out.ap_fd_logic.ap_fd_mode_reversion =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.ap_fd_mode_reversion;
    FmgcComputer_Y.out.ap_fd_logic.pitch_fd_bars_flashing =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.pitch_fd_bars_flashing;
    FmgcComputer_Y.out.ap_fd_logic.roll_fd_bars_flashing =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.roll_fd_bars_flashing;
    FmgcComputer_Y.out.ap_fd_logic.loc_bc_selection =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.loc_bc_selection;
    FmgcComputer_Y.out.ap_fd_logic.vs_target_not_held =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.vs_target_not_held;
    FmgcComputer_Y.out.ap_fd_logic.tcas_ra_inhibited =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.tcas_ra_inhibited;
    FmgcComputer_Y.out.ap_fd_logic.trk_fpa_deselected =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.trk_fpa_deselected;
    FmgcComputer_Y.out.ap_fd_logic.longi_large_box_tcas =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longi_large_box_tcas;
    FmgcComputer_Y.out.ap_fd_logic.land_2_capability = rtb_Compare_pf;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_passive_capability = rtb_OR_nn;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_op_capability = false;
    FmgcComputer_Y.out.ap_fd_logic.land_2_inop = rtb_appInop_idx_0;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_passive_inop = rtb_y_gx;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_op_inop = true;
    FmgcComputer_Y.out.ap_fd_logic.land_2_capacity = rtb_OR2;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_passive_capacity = rtb_TmpSignalConversionAtSFunctionInport3_idx_1;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_op_capacity = rtb_y_dh;
    FmgcComputer_Y.out.discrete_outputs.athr_own_engaged = FmgcComputer_DWork.Delay_DSTATE_k;
    FmgcComputer_Y.out.discrete_outputs.fd_own_engaged = fdOwnOff;
    FmgcComputer_Y.out.discrete_outputs.ap_own_engaged = FmgcComputer_DWork.Delay_DSTATE_p;
    FmgcComputer_Y.out.discrete_outputs.fcu_own_fail = FmgcComputer_P.Constant_Value_m;
    FmgcComputer_Y.out.discrete_outputs.fmgc_healthy = FmgcComputer_P.Constant1_Value_i;
    FmgcComputer_Y.out.discrete_outputs.ils_test_inhibit = FmgcComputer_P.Constant_Value_m;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.pfd_sel_spd_kts.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.pfd_sel_spd_kts.Data = FmgcComputer_P.Constant17_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.runway_hdg_memorized_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.runway_hdg_memorized_deg.Data = FmgcComputer_P.Constant18_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.preset_mach_from_mcdu.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.preset_mach_from_mcdu.Data = FmgcComputer_P.Constant19_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.preset_speed_from_mcdu_kts.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.preset_speed_from_mcdu_kts.Data = FmgcComputer_P.Constant20_Value;
    rtb_Compare = !FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.lateral_modes.rollout_submode_active;
    if (rtb_OR1_j && (!FmgcComputer_DWork.Memory_PreviousInput_c) && rtb_Compare) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.roll_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.roll_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.roll_fd_command.Data = FmgcComputer_P.Constant16_Value;
    if (rtb_OR_nx && rtb_Compare) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.pitch_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.pitch_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.pitch_fd_command.Data = FmgcComputer_P.Constant1_Value_g;
    if (FmgcComputer_DWork.Memory_PreviousInput_c ||
        FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.lateral_modes.align_submode_active ||
        FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.lateral_modes.rollout_submode_active) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.yaw_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.yaw_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.yaw_fd_command.Data = FmgcComputer_P.Constant2_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_5.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_5.Data = rtb_y_j;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_4.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_4.Data = rtb_y_ke;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.fm_alt_constraint_ft.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.fm_alt_constraint_ft.Data = FmgcComputer_P.Constant22_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.altitude_ft.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.altitude_ft.Data = rtb_alt;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.mach.SSM = static_cast<uint32_T>(FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.mach.Data = rtb_mach_i;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.cas_kts.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.cas_kts.Data = rtb_V_ias;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.flx_to_temp_deg_c.SSM = rtb_y_en;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.flx_to_temp_deg_c.Data = static_cast<real32_T>
      (FmgcComputer_U.in.fms_inputs.flex_temp_deg_c);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.ats_discrete_word.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.ats_discrete_word.Data = rtb_y_je;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.ats_fma_discrete_word.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.ats_fma_discrete_word.Data = rtb_y_c;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_3.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_3.Data = rtb_y_kc;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_1.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_1.Data = rtb_y_p;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_2.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_2.Data = rtb_y_l;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_6.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_6.Data = rtb_y_g;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.synchro_spd_mach_value.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.synchro_spd_mach_value.Data = FmgcComputer_P.Constant26_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.low_target_speed_margin_kts.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.low_target_speed_margin_kts.Data = FmgcComputer_P.Constant27_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.high_target_speed_margin_kts.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.high_target_speed_margin_kts.Data = FmgcComputer_P.Constant28_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_p_ail_voted_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_p_ail_voted_cmd_deg.Data = FmgcComputer_P.Constant11_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_p_splr_voted_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_p_splr_voted_cmd_deg.Data = FmgcComputer_P.Constant12_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_r_voted_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_r_voted_cmd_deg.Data = FmgcComputer_P.Constant13_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_nosewheel_voted_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_nosewheel_voted_cmd_deg.Data = FmgcComputer_P.Constant14_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_q_voted_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_q_voted_cmd_deg.Data = FmgcComputer_P.Constant15_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.track_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.track_deg.Data = rtb_trk;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.heading_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.heading_deg.Data = rtb_hdg;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.fpa_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.fpa_deg.Data = rtb_fpa;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.n1_command_percent.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.n1_command_percent.Data = FmgcComputer_P.Constant32_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.vertical_speed_ft_min.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.vertical_speed_ft_min.Data = rtb_vz;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fac_weight_lbs.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fac_weight_lbs.Data = FmgcComputer_P.Constant1_Value_k;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fm_weight_lbs.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fm_weight_lbs.Data = FmgcComputer_P.Constant1_Value_k;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fac_cg_percent.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fac_cg_percent.Data = FmgcComputer_P.Constant1_Value_k;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fm_cg_percent.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fm_cg_percent.Data = FmgcComputer_P.Constant1_Value_k;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fg_radio_height_ft.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fg_radio_height_ft.Data = FmgcComputer_P.Constant1_Value_k;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_4.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_4.Data = rtb_y_ke;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.ats_discrete_word.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.ats_discrete_word.Data = rtb_y_je;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_3.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_3.Data = rtb_y_kc;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_1.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_1.Data = rtb_y_p;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_2.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_2.Data = rtb_y_l;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.approach_spd_target_kn.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.approach_spd_target_kn.Data = FmgcComputer_P.Constant11_Value_m;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_p_ail_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_p_ail_cmd_deg.Data = FmgcComputer_P.Constant11_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_p_splr_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_p_splr_cmd_deg.Data = FmgcComputer_P.Constant12_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_r_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_r_cmd_deg.Data = FmgcComputer_P.Constant13_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_nose_wheel_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_nose_wheel_cmd_deg.Data = FmgcComputer_P.Constant14_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_q_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_q_cmd_deg.Data = FmgcComputer_P.Constant15_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.n1_left_percent.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.n1_left_percent.Data = FmgcComputer_P.Constant2_Value_n;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.n1_right_percent.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.n1_right_percent.Data = FmgcComputer_P.Constant2_Value_n;
    FmgcComputer_MATLABFunction_k(rtb_Switch_k_0, FmgcComputer_P.BitfromLabel1_bit_d, &rtb_y_jz);
    FmgcComputer_MATLABFunction_k(rtb_Switch_k_0, FmgcComputer_P.BitfromLabel3_bit_j, &rtb_y_jz);
    FmgcComputer_MATLABFunction_k(rtb_Switch_k_0, FmgcComputer_P.BitfromLabel4_bit_o, &rtb_y_en);
    FmgcComputer_MATLABFunction_k(rtb_Switch_k_0, FmgcComputer_P.BitfromLabel5_bit, &rtb_y_en);
    FmgcComputer_MATLABFunction_k(rtb_Switch_k_0, FmgcComputer_P.BitfromLabel6_bit, &rtb_y_gp);
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_active = rtb_NOT3;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active = FmgcComputer_DWork.Memory_PreviousInput_ip;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active = FmgcComputer_DWork.Memory_PreviousInput_cv;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active = FmgcComputer_DWork.Memory_PreviousInput_lq;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active = FmgcComputer_DWork.Memory_PreviousInput_e;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active = rtb_OR2_tmp;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active = rtb_NOT4_gb;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active = FmgcComputer_DWork.Memory_PreviousInput_c;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_trk_submode_active = FmgcComputer_DWork.Memory_PreviousInput_b;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active = FmgcComputer_DWork.Memory_PreviousInput_d;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.align_submode_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.lateral_modes.align_submode_active;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rollout_submode_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.lateral_modes.rollout_submode_active;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active = FmgcComputer_DWork.Memory_PreviousInput_ec;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active = FmgcComputer_DWork.Memory_PreviousInput_b3;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active = FmgcComputer_DWork.Memory_PreviousInput_ae;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active = FmgcComputer_DWork.Memory_PreviousInput_ev;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_clb_active;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.exp_des_active;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active = FmgcComputer_DWork.Memory_PreviousInput_k;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active = FmgcComputer_DWork.Memory_PreviousInput_i;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.vs_active = rtb_Logic_gj_idx_0_tmp_tmp_tmp_0;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.fpa_active = rtb_Logic_gj_idx_0_tmp_tmp_tmp;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active = FmgcComputer_DWork.Memory_PreviousInput_ne;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active = FmgcComputer_DWork.Memory_PreviousInput_cb;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active = FmgcComputer_DWork.Memory_PreviousInput_nu;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active = FmgcComputer_DWork.Memory_PreviousInput_as;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active = FmgcComputer_DWork.Memory_PreviousInput_f;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.flare_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.flare_active;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.cruise_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.cruise_active;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.tcas_active;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.alt_acq_armed = in_land_or_ga_tmp;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.alt_acq_arm_possible = FmgcComputer_DWork.Memory_PreviousInput_n;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.nav_armed = FmgcComputer_DWork.Memory_PreviousInput_i1;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.loc_armed = FmgcComputer_DWork.Memory_PreviousInput_a;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed = FmgcComputer_DWork.Memory_PreviousInput_l;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.glide_armed = FmgcComputer_DWork.Memory_PreviousInput_fm;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.final_des_armed = FmgcComputer_DWork.Memory_PreviousInput_dv;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.clb_armed = FmgcComputer_DWork.Memory_PreviousInput_m;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.des_armed = FmgcComputer_DWork.Memory_PreviousInput_nt;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.tcas_armed =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.armed_modes.tcas_armed;
    FmgcComputer_DWork.Delay_DSTATE.auto_spd_control_active = FmgcComputer_DWork.Memory_PreviousInput_h;
    FmgcComputer_DWork.Delay_DSTATE.manual_spd_control_active = FmgcComputer_DWork.Memory_PreviousInput_cu;
    FmgcComputer_DWork.Delay_DSTATE.fmgc_opp_mode_sync = raOwnInvalid;
    FmgcComputer_DWork.Delay_DSTATE.any_ap_fd_engaged = raOppInvalid;
    FmgcComputer_DWork.Delay_DSTATE.any_lateral_mode_engaged = rtb_OR1_j;
    FmgcComputer_DWork.Delay_DSTATE.any_longitudinal_mode_engaged = rtb_OR_nx;
    FmgcComputer_DWork.Delay_DSTATE.hdg_trk_preset_available = rtb_ap_fd_condition_tmp;
    FmgcComputer_DWork.Delay_DSTATE.ap_fd_mode_reversion =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.ap_fd_mode_reversion;
    FmgcComputer_DWork.Delay_DSTATE.pitch_fd_bars_flashing =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.pitch_fd_bars_flashing;
    FmgcComputer_DWork.Delay_DSTATE.roll_fd_bars_flashing =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.roll_fd_bars_flashing;
    FmgcComputer_DWork.Delay_DSTATE.loc_bc_selection =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.loc_bc_selection;
    FmgcComputer_DWork.Delay_DSTATE.vs_target_not_held =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.vs_target_not_held;
    FmgcComputer_DWork.Delay_DSTATE.tcas_ra_inhibited =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.tcas_ra_inhibited;
    FmgcComputer_DWork.Delay_DSTATE.trk_fpa_deselected =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.trk_fpa_deselected;
    FmgcComputer_DWork.Delay_DSTATE.longi_large_box_tcas =
      FmgcComputer_P.fmgc_ap_fd_logic_output_MATLABStruct.longi_large_box_tcas;
    FmgcComputer_DWork.Delay_DSTATE.land_2_capability = rtb_Compare_pf;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_passive_capability = rtb_OR_nn;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_op_capability = false;
    FmgcComputer_DWork.Delay_DSTATE.land_2_inop = rtb_appInop_idx_0;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_passive_inop = rtb_y_gx;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_op_inop = true;
    FmgcComputer_DWork.Delay_DSTATE.land_2_capacity = rtb_OR2;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_passive_capacity = rtb_TmpSignalConversionAtSFunctionInport3_idx_1;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_op_capacity = rtb_y_dh;
    FmgcComputer_DWork.Memory_PreviousInput_g = FmgcComputer_DWork.Delay_DSTATE_p;
    FmgcComputer_DWork.Memory_PreviousInput_p = FmgcComputer_DWork.Delay_DSTATE_k;
  } else {
    FmgcComputer_DWork.Runtime_MODE = false;
  }
}

void FmgcComputer::initialize()
{
  FmgcComputer_DWork.Delay_DSTATE = FmgcComputer_P.Delay_InitialCondition;
  FmgcComputer_DWork.Delay_DSTATE_p = FmgcComputer_P.Delay_InitialCondition_g;
  FmgcComputer_DWork.Memory_PreviousInput = FmgcComputer_P.SRFlipFlop1_initial_condition;
  FmgcComputer_DWork.Memory_PreviousInput_g = FmgcComputer_P.SRFlipFlop_initial_condition;
  FmgcComputer_DWork.Memory_PreviousInput_g1 = FmgcComputer_P.SRFlipFlop1_initial_condition_n;
  FmgcComputer_DWork.Delay_DSTATE_k = FmgcComputer_P.Delay_InitialCondition_gu;
  FmgcComputer_DWork.Memory_PreviousInput_p = FmgcComputer_P.SRFlipFlop_initial_condition_b;
  FmgcComputer_DWork.Memory_PreviousInput_k = FmgcComputer_P.SRFlipFlop_initial_condition_h;
  FmgcComputer_DWork.Memory_PreviousInput_c = FmgcComputer_P.SRFlipFlop_initial_condition_i;
  FmgcComputer_DWork.Memory_PreviousInput_b = FmgcComputer_P.SRFlipFlop_initial_condition_c;
  FmgcComputer_DWork.Memory_PreviousInput_l = FmgcComputer_P.SRFlipFlop_initial_condition_d;
  FmgcComputer_DWork.Memory_PreviousInput_d = FmgcComputer_P.SRFlipFlop_initial_condition_iz;
  FmgcComputer_DWork.Memory_PreviousInput_dv = FmgcComputer_P.SRFlipFlop_initial_condition_l;
  FmgcComputer_DWork.Memory_PreviousInput_f = FmgcComputer_P.SRFlipFlop_initial_condition_j;
  FmgcComputer_DWork.Memory_PreviousInput_i = FmgcComputer_P.SRFlipFlop_initial_condition_h5;
  FmgcComputer_DWork.Memory_PreviousInput_e = FmgcComputer_P.SRFlipFlop_initial_condition_e;
  FmgcComputer_DWork.Memory_PreviousInput_f2 = FmgcComputer_P.SRFlipFlop_initial_condition_cs;
  FmgcComputer_DWork.Memory_PreviousInput_i1 = FmgcComputer_P.SRFlipFlop_initial_condition_o;
  FmgcComputer_DWork.Memory_PreviousInput_ip = FmgcComputer_P.SRFlipFlop_initial_condition_g;
  FmgcComputer_DWork.Memory_PreviousInput_a = FmgcComputer_P.SRFlipFlop_initial_condition_n;
  FmgcComputer_DWork.Memory_PreviousInput_cv = FmgcComputer_P.SRFlipFlop_initial_condition_of;
  FmgcComputer_DWork.Memory_PreviousInput_lq = FmgcComputer_P.SRFlipFlop_initial_condition_on;
  FmgcComputer_DWork.Memory_PreviousInput_n = FmgcComputer_P.SRFlipFlop1_initial_condition_b;
  FmgcComputer_DWork.Memory_PreviousInput_ne = FmgcComputer_P.SRFlipFlop_initial_condition_ja;
  FmgcComputer_DWork.Memory_PreviousInput_cb = FmgcComputer_P.SRFlipFlop_initial_condition_li;
  FmgcComputer_DWork.Memory_PreviousInput_fg = FmgcComputer_P.SRFlipFlop1_initial_condition_i;
  FmgcComputer_DWork.Memory_PreviousInput_m = FmgcComputer_P.SRFlipFlop_initial_condition_be;
  FmgcComputer_DWork.Memory_PreviousInput_ec = FmgcComputer_P.SRFlipFlop_initial_condition_jv;
  FmgcComputer_DWork.Memory_PreviousInput_nt = FmgcComputer_P.SRFlipFlop_initial_condition_p;
  FmgcComputer_DWork.Memory_PreviousInput_b3 = FmgcComputer_P.SRFlipFlop_initial_condition_lz;
  FmgcComputer_DWork.Memory_PreviousInput_ae = FmgcComputer_P.SRFlipFlop_initial_condition_oz;
  FmgcComputer_DWork.Memory_PreviousInput_ev = FmgcComputer_P.SRFlipFlop_initial_condition_pr;
  FmgcComputer_DWork.Memory_PreviousInput_fm = FmgcComputer_P.SRFlipFlop_initial_condition_ce;
  FmgcComputer_DWork.Memory_PreviousInput_nu = FmgcComputer_P.SRFlipFlop_initial_condition_hs;
  FmgcComputer_DWork.Memory_PreviousInput_as = FmgcComputer_P.SRFlipFlop_initial_condition_dp;
  FmgcComputer_DWork.Memory_PreviousInput_cu = FmgcComputer_P.SRFlipFlop1_initial_condition_o;
  FmgcComputer_DWork.Memory_PreviousInput_h = FmgcComputer_P.SRFlipFlop_initial_condition_n1;
  FmgcComputer_Y.out = FmgcComputer_P.out_Y0;
}

void FmgcComputer::terminate()
{
}

FmgcComputer::FmgcComputer():
  FmgcComputer_U(),
  FmgcComputer_Y(),
  FmgcComputer_DWork()
{
}

FmgcComputer::~FmgcComputer()
{
}
