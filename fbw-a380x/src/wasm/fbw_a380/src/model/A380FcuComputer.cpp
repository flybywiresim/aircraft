#include "A380FcuComputer.h"
#include "rtwtypes.h"
#include "A380FcuComputer_types.h"
#include <cmath>

const fcu_outputs A380FcuComputer_rtZfcu_outputs{ { { 0.0,
      0.0,
      0.0
    },

    { false,
      false,
      false,
      false,
      false
    },

    { 0.0F
    },

    { false,
      false,
      false,
      false,
      false,
      false,
      false,

      { 0,
        0,
        false,

        { false,
          false,
          0
        },
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false
      },

      { false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,

        { false,
          false,
          0
        },

        { false,
          false,
          0
        },

        { false,
          false,
          0
        },
        false,

        { false,
          false,
          0
        }
      }
    },

    { { { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        }
      },

      { { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        },

        { 0U,
          0.0F
        }
      }
    }
  },

  { { false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      0.0F,
      false,
      0.0F,
      false,
      0.0F,
      0.0F,
      false,
      false,
      false,
      false,

      { false,
        false,
        0
      },

      { false,
        false,
        0
      },

      { false,
        false,
        0
      },

      { false,
        false,
        0
      },
      false,
      false,
      false,
      false,
      false
    },

    { false,
      false,
      false,
      false,
      false,
      false,
      a380_efis_filter_selection::NONE,
      false,
      false,
      a380_efis_navaid_selection::NONE,
      a380_efis_navaid_selection::NONE,
      false,
      a380_surv_filter_selection::NONE,
      a380_efis_mode_selection::ROSE_ILS,
      a380_efis_range_selection::RANGE_10,
      false,
      false,
      false,
      0.0F,
      0.0F,
      false
    }
  },

  { { false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      a380_efis_navaid_selection::NONE,
      a380_efis_navaid_selection::NONE,
      a380_efis_panel_range_selection::RANGE_10,
      a380_efis_mode_selection::ROSE_ILS,
      false,
      false,
      0.0F,
      0,
      false,
      false
    },

    { false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      0.0,
      false,
      0.0,
      false,
      0.0,
      0.0,
      false,
      false
    },
    false,
    false
  },

  { { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    }
  }
};

void A380FcuComputer::A380FcuComputer_MATLABFunction_Reset(rtDW_MATLABFunction_A380FcuComputer_T *localDW)
{
  localDW->previousInput = false;
  localDW->remainingTriggerTime = 0.0;
}

void A380FcuComputer::A380FcuComputer_MATLABFunction(boolean_T rtu_u, real_T rtu_Ts, boolean_T *rty_y, real_T
  rtp_isRisingEdge, real_T rtp_retriggerable, real_T rtp_triggerDuration, rtDW_MATLABFunction_A380FcuComputer_T *localDW)
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

void A380FcuComputer::A380FcuComputer_MATLABFunction_m(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_a(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void A380FcuComputer::A380FcuComputer_MATLABFunction_n_Reset(rtDW_MATLABFunction_A380FcuComputer_c_T *localDW)
{
  localDW->previousInput_not_empty = false;
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_a4(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_A380FcuComputer_c_T *localDW)
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

void A380FcuComputer::A380FcuComputer_NavaidLogic_Reset(rtDW_NavaidLogic_A380FcuComputer_T *localDW)
{
  localDW->pNavaidStatus = a380_efis_navaid_selection::NONE;
}

void A380FcuComputer::A380FcuComputer_NavaidLogic(boolean_T rtu_navaid_button, a380_efis_navaid_selection
  *rty_navaidStatus, rtDW_NavaidLogic_A380FcuComputer_T *localDW)
{
  if ((localDW->pNavaidStatus == a380_efis_navaid_selection::NONE) && rtu_navaid_button) {
    localDW->pNavaidStatus = a380_efis_navaid_selection::VOR;
  } else if ((localDW->pNavaidStatus == a380_efis_navaid_selection::VOR) && rtu_navaid_button) {
    localDW->pNavaidStatus = a380_efis_navaid_selection::ADF;
  } else if ((localDW->pNavaidStatus == a380_efis_navaid_selection::ADF) && rtu_navaid_button) {
    localDW->pNavaidStatus = a380_efis_navaid_selection::NONE;
  }

  *rty_navaidStatus = localDW->pNavaidStatus;
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_mw_Reset(rtDW_MATLABFunction_A380FcuComputer_pu_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_b(boolean_T rtu_u, boolean_T *rty_y, boolean_T rtp_init,
  rtDW_MATLABFunction_A380FcuComputer_pu_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtp_init;
    localDW->pY_not_empty = true;
  }

  if (rtu_u) {
    localDW->pY = !localDW->pY;
  }

  *rty_y = localDW->pY;
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_e(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void A380FcuComputer::step()
{
  int32_T tmp;
  uint32_T rtb_DataTypeConversion1_j;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_BusAssignment_a_logic_afs_alt_active;
  boolean_T rtb_BusAssignment_a_logic_afs_alt_pushed;
  boolean_T rtb_BusAssignment_a_logic_afs_mach_active;
  boolean_T rtb_BusAssignment_a_logic_afs_spd_mach_switching_pushed;
  boolean_T rtb_BusAssignment_j_logic_afs_appr_pushed;
  boolean_T rtb_BusAssignment_j_logic_afs_loc_pushed;
  boolean_T rtb_BusAssignment_n_logic_efis_ls_auto_activate;
  boolean_T rtb_BusAssignment_n_logic_efis_vv_auto_deactivate;
  boolean_T rtb_BusAssignment_p_baro_preset_active;
  boolean_T rtb_BusAssignment_p_traf_on;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pulled;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pushed;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pulled;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pushed;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pulled;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pushed;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pulled;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pushed;
  boolean_T rtb_Equal1;
  boolean_T rtb_Equal2;
  boolean_T rtb_Equal6;
  boolean_T rtb_Equal7;
  boolean_T rtb_Equal8;
  boolean_T rtb_OR2;
  boolean_T rtb_qnh;
  boolean_T rtb_y_f;
  a380_efis_mode_selection rtb_BusAssignment_p_efis_mode;
  a380_efis_navaid_selection rtb_navaidStatus;
  a380_efis_navaid_selection rtb_navaidStatus_f;
  a380_efis_range_selection rtb_BusAssignment_p_efis_range;
  if (A380FcuComputer_U.in.sim_data.computer_running) {
    if (!A380FcuComputer_DWork.Runtime_MODE) {
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_k);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_n);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_b);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_l);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_m);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_kr);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_f);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_c);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_a);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_o);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_kh);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_d);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_i);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_k0);
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_g);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_a4);
      A380FcuComputer_DWork.p_trk_fpa_active = false;
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_ma);
      A380FcuComputer_DWork.p_metric_alt_active = false;
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_kj);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_kq);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_mt);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_ny);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_nb);
      A380FcuComputer_DWork.std_active = false;
      A380FcuComputer_DWork.qnh_active = true;
      A380FcuComputer_DWork.qfe_active = false;
      A380FcuComputer_DWork.pValueHpa = 1013.0F;
      A380FcuComputer_DWork.pValueInhg = 29.92F;
      A380FcuComputer_MATLABFunction_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_li);
      A380FcuComputer_DWork.pMode = 2;
      A380FcuComputer_DWork.pArcActive_not_empty = false;
      A380FcuComputer_DWork.pRange = 4;
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_ce);
      A380FcuComputer_MATLABFunction_mw_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_ij);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_lf);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_gu);
      A380FcuComputer_DWork.pSurvFilter = a380_surv_filter_selection::NONE;
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_mb);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_bp);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_mq);
      A380FcuComputer_DWork.pEfisFilter = a380_efis_filter_selection::NONE;
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_on);
      A380FcuComputer_MATLABFunction_mw_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_bt);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_l0);
      A380FcuComputer_MATLABFunction_mw_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_o3);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_ic);
      A380FcuComputer_NavaidLogic_Reset(&A380FcuComputer_DWork.sf_NavaidLogic);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_j);
      A380FcuComputer_NavaidLogic_Reset(&A380FcuComputer_DWork.sf_NavaidLogic_f);
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_k1);
      A380FcuComputer_DWork.vvActive = false;
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_dj);
      A380FcuComputer_DWork.lsActive = false;
      A380FcuComputer_MATLABFunction_n_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_dg);
      A380FcuComputer_MATLABFunction_mw_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_hr);
      A380FcuComputer_DWork.Runtime_MODE = true;
    }

    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.hdg_trk_knob.pushed,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pushed,
      A380FcuComputer_P.MTrigNode_isRisingEdge, A380FcuComputer_P.MTrigNode_retriggerable,
      A380FcuComputer_P.KnobMtrigProcessing_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction);
    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.hdg_trk_knob.pulled,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pulled,
      A380FcuComputer_P.MTrigNode1_isRisingEdge, A380FcuComputer_P.MTrigNode1_retriggerable,
      A380FcuComputer_P.KnobMtrigProcessing_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_k);
    A380FcuComputer_MATLABFunction((A380FcuComputer_U.in.discrete_inputs.afs_inputs.hdg_trk_knob.turns !=
      A380FcuComputer_P.CompareToConstant_const), A380FcuComputer_U.in.time.dt, &rtb_y_f,
      A380FcuComputer_P.MTrigNode2_isRisingEdge, A380FcuComputer_P.MTrigNode2_retriggerable,
      A380FcuComputer_P.KnobMtrigProcessing_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_n);
    A380FcuComputer_Y.out.logic.afs.hdg_trk_buttons.turns = static_cast<int8_T>(rtb_y_f);
    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.spd_knob.pushed,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pushed,
      A380FcuComputer_P.MTrigNode_isRisingEdge_a, A380FcuComputer_P.MTrigNode_retriggerable_f,
      A380FcuComputer_P.KnobMtrigProcessing1_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_b);
    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.spd_knob.pulled,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pulled,
      A380FcuComputer_P.MTrigNode1_isRisingEdge_j, A380FcuComputer_P.MTrigNode1_retriggerable_d,
      A380FcuComputer_P.KnobMtrigProcessing1_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_l);
    A380FcuComputer_MATLABFunction((A380FcuComputer_U.in.discrete_inputs.afs_inputs.spd_knob.turns !=
      A380FcuComputer_P.CompareToConstant_const_p), A380FcuComputer_U.in.time.dt, &rtb_y_f,
      A380FcuComputer_P.MTrigNode2_isRisingEdge_j, A380FcuComputer_P.MTrigNode2_retriggerable_i,
      A380FcuComputer_P.KnobMtrigProcessing1_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_m);
    A380FcuComputer_Y.out.logic.afs.spd_mach_buttons.turns = static_cast<int8_T>(rtb_y_f);
    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.alt_knob.pushed,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pushed,
      A380FcuComputer_P.MTrigNode_isRisingEdge_k, A380FcuComputer_P.MTrigNode_retriggerable_h,
      A380FcuComputer_P.KnobMtrigProcessing2_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_kr);
    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.alt_knob.pulled,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pulled,
      A380FcuComputer_P.MTrigNode1_isRisingEdge_o, A380FcuComputer_P.MTrigNode1_retriggerable_j,
      A380FcuComputer_P.KnobMtrigProcessing2_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_f);
    A380FcuComputer_MATLABFunction((A380FcuComputer_U.in.discrete_inputs.afs_inputs.alt_knob.turns !=
      A380FcuComputer_P.CompareToConstant_const_pg), A380FcuComputer_U.in.time.dt, &rtb_y_f,
      A380FcuComputer_P.MTrigNode2_isRisingEdge_h, A380FcuComputer_P.MTrigNode2_retriggerable_h,
      A380FcuComputer_P.KnobMtrigProcessing2_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_c);
    A380FcuComputer_Y.out.logic.afs.alt_buttons.turns = static_cast<int8_T>(rtb_y_f);
    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.pushed,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pushed,
      A380FcuComputer_P.MTrigNode_isRisingEdge_d, A380FcuComputer_P.MTrigNode_retriggerable_g,
      A380FcuComputer_P.KnobMtrigProcessing3_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_a);
    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.pulled,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pulled,
      A380FcuComputer_P.MTrigNode1_isRisingEdge_c, A380FcuComputer_P.MTrigNode1_retriggerable_l,
      A380FcuComputer_P.KnobMtrigProcessing3_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_o);
    A380FcuComputer_MATLABFunction((A380FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.turns !=
      A380FcuComputer_P.CompareToConstant_const_e), A380FcuComputer_U.in.time.dt, &rtb_y_f,
      A380FcuComputer_P.MTrigNode2_isRisingEdge_hx, A380FcuComputer_P.MTrigNode2_retriggerable_g,
      A380FcuComputer_P.KnobMtrigProcessing3_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_kh);
    A380FcuComputer_Y.out.logic.afs.vs_fpa_buttons.turns = static_cast<int8_T>(rtb_y_f);
    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.loc_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_BusAssignment_j_logic_afs_loc_pushed,
      A380FcuComputer_P.MTrigNode_isRisingEdge_c, A380FcuComputer_P.MTrigNode_retriggerable_i,
      A380FcuComputer_P.MTrigNode_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_d);
    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.alt_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_BusAssignment_a_logic_afs_alt_pushed,
      A380FcuComputer_P.MTrigNode1_isRisingEdge_a, A380FcuComputer_P.MTrigNode1_retriggerable_ls,
      A380FcuComputer_P.MTrigNode1_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_i);
    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.appr_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_BusAssignment_j_logic_afs_appr_pushed,
      A380FcuComputer_P.MTrigNode2_isRisingEdge_p, A380FcuComputer_P.MTrigNode2_retriggerable_c,
      A380FcuComputer_P.MTrigNode2_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_k0);
    A380FcuComputer_MATLABFunction(A380FcuComputer_U.in.discrete_inputs.afs_inputs.spd_mach_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_y_f, A380FcuComputer_P.MTrigNode3_isRisingEdge,
      A380FcuComputer_P.MTrigNode3_retriggerable, A380FcuComputer_P.MTrigNode3_triggerDuration,
      &A380FcuComputer_DWork.sf_MATLABFunction_g);
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.afs_inputs.trk_fpa_button_pressed,
      A380FcuComputer_P.PulseNode_isRisingEdge, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_a4);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_1,
      A380FcuComputer_P.BitfromLabel1_bit, &rtb_DataTypeConversion1_j);
    rtb_Equal2 = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_1,
      A380FcuComputer_P.BitfromLabel2_bit, &rtb_DataTypeConversion1_j);
    rtb_Equal1 = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_7,
      A380FcuComputer_P.BitfromLabel5_bit, &rtb_DataTypeConversion1_j);
    if (rtb_Equal2 || rtb_Equal1 || (rtb_DataTypeConversion1_j != 0U)) {
      A380FcuComputer_DWork.p_trk_fpa_active = false;
    } else if (rtb_Equal6) {
      A380FcuComputer_DWork.p_trk_fpa_active = !A380FcuComputer_DWork.p_trk_fpa_active;
    }

    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.afs_inputs.metric_alt_button_pressed,
      A380FcuComputer_P.PulseNode1_isRisingEdge, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_ma);
    if (rtb_Equal6) {
      A380FcuComputer_DWork.p_metric_alt_active = !A380FcuComputer_DWork.p_metric_alt_active;
    }

    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_1_bus.ats_discrete_word,
      A380FcuComputer_P.BitfromLabel3_bit, &rtb_DataTypeConversion1_j);
    rtb_BusAssignment_a_logic_afs_spd_mach_switching_pushed = rtb_y_f;
    rtb_BusAssignment_a_logic_afs_mach_active = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_1,
      A380FcuComputer_P.BitfromLabel6_bit, &rtb_DataTypeConversion1_j);
    A380FcuComputer_MATLABFunction_m(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_1, &rtb_y_f);
    rtb_BusAssignment_a_logic_afs_alt_active = ((rtb_DataTypeConversion1_j != 0U) && rtb_y_f);
    A380FcuComputer_MATLABFunction_m(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_2, &rtb_Equal6);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_2,
      A380FcuComputer_P.BitfromLabel5_bit_p, &rtb_DataTypeConversion1_j);
    rtb_Equal1 = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_2,
      A380FcuComputer_P.BitfromLabel4_bit, &rtb_DataTypeConversion1_j);
    rtb_Equal2 = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_3,
      A380FcuComputer_P.BitfromLabel3_bit_f, &rtb_DataTypeConversion1_j);
    rtb_OR2 = (rtb_Equal1 || rtb_Equal2 || (rtb_DataTypeConversion1_j != 0U));
    A380FcuComputer_MATLABFunction_m(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_3, &rtb_y_f);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_4,
      A380FcuComputer_P.BitfromLabel1_bit_i, &rtb_DataTypeConversion1_j);
    rtb_Equal7 = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_3,
      A380FcuComputer_P.BitfromLabel2_bit_g, &rtb_DataTypeConversion1_j);
    rtb_Equal1 = (rtb_Equal7 || (rtb_DataTypeConversion1_j != 0U));
    A380FcuComputer_MATLABFunction_m(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_4, &rtb_Equal7);
    rtb_Equal7 = (rtb_Equal1 && rtb_Equal7 && rtb_y_f);
    rtb_OR2 = (rtb_Equal6 && rtb_OR2 && rtb_y_f && (!rtb_Equal7));
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_3,
      A380FcuComputer_P.BitfromLabel7_bit, &rtb_DataTypeConversion1_j);
    rtb_Equal2 = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_1,
      A380FcuComputer_P.BitfromLabel8_bit, &rtb_DataTypeConversion1_j);
    A380FcuComputer_MATLABFunction_m(&A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_1, &rtb_Equal6);
    rtb_y_f = (rtb_Equal7 || (rtb_y_f && (rtb_Equal2 || (rtb_DataTypeConversion1_j != 0U)) && rtb_Equal6));
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_1,
      A380FcuComputer_P.BitfromLabel2_bit_o, &rtb_DataTypeConversion1_j);
    rtb_Equal6 = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_7,
      A380FcuComputer_P.BitfromLabel5_bit_n, &rtb_DataTypeConversion1_j);
    A380FcuComputer_MATLABFunction_a4((rtb_Equal6 || (rtb_DataTypeConversion1_j != 0U)),
      A380FcuComputer_P.PulseNode_isRisingEdge_i, &rtb_Equal2, &A380FcuComputer_DWork.sf_MATLABFunction_kj);
    A380FcuComputer_MATLABFunction_a(&A380FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_4,
      A380FcuComputer_P.BitfromLabel3_bit_p, &rtb_DataTypeConversion1_j);
    A380FcuComputer_MATLABFunction_a4((rtb_DataTypeConversion1_j != 0U), A380FcuComputer_P.PulseNode1_isRisingEdge_d,
      &rtb_BusAssignment_n_logic_efis_vv_auto_deactivate, &A380FcuComputer_DWork.sf_MATLABFunction_kq);
    A380FcuComputer_MATLABFunction_a4(false, A380FcuComputer_P.PulseNode2_isRisingEdge, &rtb_Equal6,
      &A380FcuComputer_DWork.sf_MATLABFunction_mt);
    rtb_BusAssignment_n_logic_efis_ls_auto_activate = rtb_Equal6;
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_knob.pushed,
      A380FcuComputer_P.PulseNode_isRisingEdge_g, &rtb_Equal7, &A380FcuComputer_DWork.sf_MATLABFunction_ny);
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_knob.pulled,
      A380FcuComputer_P.PulseNode1_isRisingEdge_m, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_nb);
    if (rtb_Equal7 && A380FcuComputer_DWork.std_active) {
      A380FcuComputer_DWork.std_active = false;
    } else if (rtb_Equal7 && (!A380FcuComputer_DWork.std_active)) {
      A380FcuComputer_DWork.qnh_active = !A380FcuComputer_DWork.qnh_active;
      A380FcuComputer_DWork.qfe_active = !A380FcuComputer_DWork.qfe_active;
    } else {
      A380FcuComputer_DWork.std_active = ((rtb_Equal6 && (!A380FcuComputer_DWork.std_active)) ||
        A380FcuComputer_DWork.std_active);
    }

    if (!A380FcuComputer_U.in.discrete_inputs.pin_prog_qfe_avail) {
      A380FcuComputer_DWork.qnh_active = true;
      A380FcuComputer_DWork.qfe_active = false;
    }

    rtb_qnh = (A380FcuComputer_DWork.qnh_active && (!A380FcuComputer_DWork.std_active));
    if (A380FcuComputer_U.in.sim_input.baro_setting_hpa != -1.0F) {
      A380FcuComputer_DWork.pValueHpa = A380FcuComputer_U.in.sim_input.baro_setting_hpa;
      A380FcuComputer_DWork.pValueInhg = A380FcuComputer_U.in.sim_input.baro_setting_hpa * 0.02953F;
    }

    if (!A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_is_inhg) {
      A380FcuComputer_DWork.pValueHpa = std::fmax(std::fmin(A380FcuComputer_DWork.pValueHpa + static_cast<real32_T>
        (A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_knob.turns), 1100.0F), 745.0F);
      A380FcuComputer_DWork.pValueInhg = std::round(A380FcuComputer_DWork.pValueHpa * 0.02953F * 100.0F) / 100.0F;
    } else {
      A380FcuComputer_DWork.pValueInhg = std::fmax(std::fmin(static_cast<real32_T>
        (A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_knob.turns) * 0.01F + A380FcuComputer_DWork.pValueInhg,
        32.48F), 22.0F);
      A380FcuComputer_DWork.pValueHpa = A380FcuComputer_DWork.pValueInhg * 33.8638687F;
      A380FcuComputer_DWork.pValueHpa = std::round(A380FcuComputer_DWork.pValueHpa);
    }

    A380FcuComputer_MATLABFunction((A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_knob.turns !=
      A380FcuComputer_P.CompareToConstant_const_l), A380FcuComputer_U.in.time.dt, &rtb_Equal6,
      A380FcuComputer_P.MTrigNode_isRisingEdge_l, A380FcuComputer_P.MTrigNode_retriggerable_b,
      A380FcuComputer_P.MTrigNode_triggerDuration_b, &A380FcuComputer_DWork.sf_MATLABFunction_li);
    rtb_BusAssignment_p_baro_preset_active = rtb_Equal6;
    tmp = A380FcuComputer_DWork.pMode + A380FcuComputer_U.in.discrete_inputs.efis_inputs.efis_mode_knob_turns;
    if (tmp < 128) {
      if (tmp >= -128) {
        A380FcuComputer_DWork.pMode = static_cast<int8_T>(tmp);
      } else {
        A380FcuComputer_DWork.pMode = MIN_int8_T;
      }
    } else {
      A380FcuComputer_DWork.pMode = MAX_int8_T;
    }

    if (A380FcuComputer_DWork.pMode > 4) {
      A380FcuComputer_DWork.pMode = 4;
    }

    if (A380FcuComputer_DWork.pMode < 0) {
      A380FcuComputer_DWork.pMode = 0;
    }

    rtb_BusAssignment_p_efis_mode = static_cast<a380_efis_mode_selection>(A380FcuComputer_DWork.pMode);
    rtb_Equal6 = (rtb_BusAssignment_p_efis_mode == A380FcuComputer_P.EnumeratedConstant_Value);
    if (!A380FcuComputer_DWork.pArcActive_not_empty) {
      A380FcuComputer_DWork.pArcActive = rtb_Equal6;
      A380FcuComputer_DWork.pArcActive_not_empty = true;
    }

    if (rtb_Equal6 && (!A380FcuComputer_DWork.pArcActive) && (A380FcuComputer_DWork.pRange > 4)) {
      A380FcuComputer_DWork.pRange = static_cast<int8_T>(A380FcuComputer_DWork.pRange - 1);
    } else if ((!rtb_Equal6) && A380FcuComputer_DWork.pArcActive && (A380FcuComputer_DWork.pRange < 10)) {
      A380FcuComputer_DWork.pRange = static_cast<int8_T>(A380FcuComputer_DWork.pRange + 1);
    }

    tmp = A380FcuComputer_DWork.pRange + A380FcuComputer_U.in.discrete_inputs.efis_inputs.efis_range_knob_turns;
    if (tmp < 128) {
      if (tmp >= -128) {
        A380FcuComputer_DWork.pRange = static_cast<int8_T>(tmp);
      } else {
        A380FcuComputer_DWork.pRange = MIN_int8_T;
      }
    } else {
      A380FcuComputer_DWork.pRange = MAX_int8_T;
    }

    if (A380FcuComputer_DWork.pRange > 10) {
      A380FcuComputer_DWork.pRange = 10;
    }

    if (A380FcuComputer_DWork.pRange < 0) {
      A380FcuComputer_DWork.pRange = 0;
    }

    A380FcuComputer_DWork.pArcActive = rtb_Equal6;
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.traf_button_pushed,
      A380FcuComputer_P.PulseNode_isRisingEdge_o, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_ce);
    A380FcuComputer_MATLABFunction_b(rtb_Equal6, &rtb_Equal7, A380FcuComputer_P.TFlipFlop1_init,
      &A380FcuComputer_DWork.sf_MATLABFunction_ij);
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.wx_button_pushed,
      A380FcuComputer_P.PulseNode2_isRisingEdge_l, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_lf);
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.terr_button_pushed,
      A380FcuComputer_P.PulseNode1_isRisingEdge_g, &rtb_Equal8, &A380FcuComputer_DWork.sf_MATLABFunction_gu);
    if (((A380FcuComputer_DWork.pSurvFilter == a380_surv_filter_selection::WX) && rtb_Equal6) ||
        ((A380FcuComputer_DWork.pSurvFilter == a380_surv_filter_selection::TERR) && rtb_Equal8)) {
      A380FcuComputer_DWork.pSurvFilter = a380_surv_filter_selection::NONE;
    } else if (rtb_Equal6) {
      A380FcuComputer_DWork.pSurvFilter = a380_surv_filter_selection::WX;
    } else if (rtb_Equal8) {
      A380FcuComputer_DWork.pSurvFilter = a380_surv_filter_selection::TERR;
    }

    rtb_BusAssignment_p_traf_on = rtb_Equal7;
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.wpt_button_pushed,
      A380FcuComputer_P.PulseNode2_isRisingEdge_ll, &rtb_Equal7, &A380FcuComputer_DWork.sf_MATLABFunction_mb);
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.vord_button_pushed,
      A380FcuComputer_P.PulseNode1_isRisingEdge_l, &rtb_Equal8, &A380FcuComputer_DWork.sf_MATLABFunction_bp);
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.ndb_button_pushed,
      A380FcuComputer_P.PulseNode3_isRisingEdge, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_mq);
    if (((A380FcuComputer_DWork.pEfisFilter == a380_efis_filter_selection::WPT) && rtb_Equal7) ||
        ((A380FcuComputer_DWork.pEfisFilter == a380_efis_filter_selection::VORD) && rtb_Equal8) ||
        ((A380FcuComputer_DWork.pEfisFilter == a380_efis_filter_selection::NDB) && rtb_Equal6)) {
      A380FcuComputer_DWork.pEfisFilter = a380_efis_filter_selection::NONE;
    } else if (rtb_Equal7) {
      A380FcuComputer_DWork.pEfisFilter = a380_efis_filter_selection::WPT;
    } else if (rtb_Equal8) {
      A380FcuComputer_DWork.pEfisFilter = a380_efis_filter_selection::VORD;
    } else if (rtb_Equal6) {
      A380FcuComputer_DWork.pEfisFilter = a380_efis_filter_selection::NDB;
    }

    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.cstr_button_pushed,
      A380FcuComputer_P.PulseNode_isRisingEdge_m, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_on);
    A380FcuComputer_MATLABFunction_b(rtb_Equal6, &rtb_Equal1, A380FcuComputer_P.TFlipFlop1_init_p,
      &A380FcuComputer_DWork.sf_MATLABFunction_bt);
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.arpt_button_pushed,
      A380FcuComputer_P.PulseNode_isRisingEdge_b, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_l0);
    A380FcuComputer_MATLABFunction_b(rtb_Equal6, &rtb_Equal8, A380FcuComputer_P.TFlipFlop2_init,
      &A380FcuComputer_DWork.sf_MATLABFunction_o3);
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.navaid_1_button_pushed,
      A380FcuComputer_P.PulseNode2_isRisingEdge_f, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_ic);
    A380FcuComputer_NavaidLogic(rtb_Equal6, &rtb_navaidStatus_f, &A380FcuComputer_DWork.sf_NavaidLogic);
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.navaid_2_button_pushed,
      A380FcuComputer_P.PulseNode2_isRisingEdge_lq, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_j);
    A380FcuComputer_NavaidLogic(rtb_Equal6, &rtb_navaidStatus, &A380FcuComputer_DWork.sf_NavaidLogic_f);
    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.vv_button_pushed,
      A380FcuComputer_P.PulseNode_isRisingEdge_j, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_k1);
    if (rtb_Equal2) {
      A380FcuComputer_DWork.vvActive = true;
    } else if (rtb_BusAssignment_n_logic_efis_vv_auto_deactivate) {
      A380FcuComputer_DWork.vvActive = false;
    } else if (rtb_Equal6) {
      A380FcuComputer_DWork.vvActive = !A380FcuComputer_DWork.vvActive;
    }

    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.ls_button_pushed,
      A380FcuComputer_P.PulseNode_isRisingEdge_c, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_dj);
    if (rtb_BusAssignment_n_logic_efis_ls_auto_activate) {
      A380FcuComputer_DWork.lsActive = true;
    } else if (rtb_Equal6) {
      A380FcuComputer_DWork.lsActive = !A380FcuComputer_DWork.lsActive;
    }

    A380FcuComputer_MATLABFunction_a4(A380FcuComputer_U.in.discrete_inputs.efis_inputs.taxi_button_pushed,
      A380FcuComputer_P.PulseNode_isRisingEdge_f, &rtb_Equal6, &A380FcuComputer_DWork.sf_MATLABFunction_dg);
    A380FcuComputer_MATLABFunction_b(rtb_Equal6, &rtb_Equal7, A380FcuComputer_P.TFlipFlop2_init_n,
      &A380FcuComputer_DWork.sf_MATLABFunction_hr);
    rtb_BusAssignment_p_efis_range = static_cast<a380_efis_range_selection>(A380FcuComputer_DWork.pRange);
    rtb_VectorConcatenate[0] = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pushed;
    rtb_VectorConcatenate[1] = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pulled;
    rtb_VectorConcatenate[2] = rtb_BusAssignment_j_logic_afs_loc_pushed;
    rtb_VectorConcatenate[3] = false;
    rtb_VectorConcatenate[4] = A380FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[5] = A380FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[6] = A380FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[7] = A380FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[8] = A380FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[9] = false;
    rtb_VectorConcatenate[10] = true;
    rtb_VectorConcatenate[11] = A380FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[12] = A380FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[13] = A380FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[14] = A380FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[15] = true;
    rtb_VectorConcatenate[16] = true;
    rtb_VectorConcatenate[17] = A380FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[18] = A380FcuComputer_P.Constant19_Value;
    A380FcuComputer_MATLABFunction_e(rtb_VectorConcatenate, &A380FcuComputer_Y.out.bus_outputs.fcu_discrete_word_2.Data);
    rtb_VectorConcatenate[0] = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pushed;
    rtb_VectorConcatenate[1] = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pulled;
    rtb_VectorConcatenate[2] = false;
    rtb_VectorConcatenate[3] = false;
    rtb_VectorConcatenate[4] = false;
    rtb_VectorConcatenate[5] = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pushed;
    rtb_VectorConcatenate[6] = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pushed;
    rtb_VectorConcatenate[7] = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pulled;
    rtb_VectorConcatenate[8] = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pulled;
    rtb_VectorConcatenate[9] = A380FcuComputer_DWork.p_metric_alt_active;
    rtb_VectorConcatenate[10] = rtb_BusAssignment_a_logic_afs_spd_mach_switching_pushed;
    rtb_VectorConcatenate[11] = rtb_BusAssignment_a_logic_afs_alt_pushed;
    rtb_VectorConcatenate[12] = rtb_BusAssignment_j_logic_afs_appr_pushed;
    rtb_VectorConcatenate[13] = !A380FcuComputer_DWork.p_trk_fpa_active;
    rtb_VectorConcatenate[14] = A380FcuComputer_DWork.p_trk_fpa_active;
    rtb_VectorConcatenate[15] = A380FcuComputer_P.Constant20_Value;
    rtb_VectorConcatenate[16] = A380FcuComputer_P.Constant20_Value;
    rtb_VectorConcatenate[17] = A380FcuComputer_P.Constant20_Value;
    rtb_VectorConcatenate[18] = A380FcuComputer_P.Constant20_Value;
    A380FcuComputer_MATLABFunction_e(rtb_VectorConcatenate, &A380FcuComputer_Y.out.bus_outputs.fcu_discrete_word_1.Data);
    A380FcuComputer_Y.out.data = A380FcuComputer_U.in;
    A380FcuComputer_Y.out.logic.afs.fmgc_1_has_priority = false;
    A380FcuComputer_Y.out.logic.afs.ap_1_engaged = A380FcuComputer_P.Constant1_Value.afs.ap_1_engaged;
    A380FcuComputer_Y.out.logic.afs.ap_2_engaged = A380FcuComputer_P.Constant1_Value.afs.ap_2_engaged;
    A380FcuComputer_Y.out.logic.afs.athr_engaged = A380FcuComputer_P.Constant1_Value.afs.athr_engaged;
    A380FcuComputer_Y.out.logic.afs.fd_engaged = A380FcuComputer_P.Constant1_Value.afs.fd_engaged;
    A380FcuComputer_Y.out.logic.afs.mach_active = rtb_BusAssignment_a_logic_afs_mach_active;
    A380FcuComputer_Y.out.logic.afs.trk_fpa_active = A380FcuComputer_DWork.p_trk_fpa_active;
    A380FcuComputer_Y.out.logic.afs.true_active = A380FcuComputer_P.Constant1_Value.afs.true_active;
    A380FcuComputer_Y.out.logic.afs.metric_alt_active = A380FcuComputer_DWork.p_metric_alt_active;
    A380FcuComputer_Y.out.logic.afs.spd_mach_display_value = 0.0F;
    A380FcuComputer_Y.out.logic.afs.spd_mach_dashes = false;
    A380FcuComputer_Y.out.logic.afs.hdg_trk_display_value = 0.0F;
    A380FcuComputer_Y.out.logic.afs.hdg_trk_dashes = false;
    A380FcuComputer_Y.out.logic.afs.alt_display_value = 0.0F;
    A380FcuComputer_Y.out.logic.afs.vs_fpa_display_value = 0.0F;
    A380FcuComputer_Y.out.logic.afs.vs_fpa_dashes = false;
    A380FcuComputer_Y.out.logic.afs.alt_active = rtb_BusAssignment_a_logic_afs_alt_active;
    A380FcuComputer_Y.out.logic.afs.loc_only_active = rtb_OR2;
    A380FcuComputer_Y.out.logic.afs.appr_active = rtb_y_f;
    A380FcuComputer_Y.out.logic.afs.hdg_trk_buttons.pushed =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pushed;
    A380FcuComputer_Y.out.logic.afs.hdg_trk_buttons.pulled =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pulled;
    A380FcuComputer_Y.out.logic.afs.spd_mach_buttons.pushed =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pushed;
    A380FcuComputer_Y.out.logic.afs.spd_mach_buttons.pulled =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pulled;
    A380FcuComputer_Y.out.logic.afs.alt_buttons.pushed =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pushed;
    A380FcuComputer_Y.out.logic.afs.alt_buttons.pulled =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pulled;
    A380FcuComputer_Y.out.logic.afs.vs_fpa_buttons.pushed =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pushed;
    A380FcuComputer_Y.out.logic.afs.vs_fpa_buttons.pulled =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pulled;
    A380FcuComputer_Y.out.logic.afs.fd_pushed = A380FcuComputer_P.Constant1_Value.afs.fd_pushed;
    A380FcuComputer_Y.out.logic.afs.loc_pushed = rtb_BusAssignment_j_logic_afs_loc_pushed;
    A380FcuComputer_Y.out.logic.afs.alt_pushed = rtb_BusAssignment_a_logic_afs_alt_pushed;
    A380FcuComputer_Y.out.logic.afs.appr_pushed = rtb_BusAssignment_j_logic_afs_appr_pushed;
    A380FcuComputer_Y.out.logic.afs.spd_mach_switching_pushed = rtb_BusAssignment_a_logic_afs_spd_mach_switching_pushed;
    A380FcuComputer_Y.out.logic.efis.vv_auto_activate = rtb_Equal2;
    A380FcuComputer_Y.out.logic.efis.vv_auto_deactivate = rtb_BusAssignment_n_logic_efis_vv_auto_deactivate;
    A380FcuComputer_Y.out.logic.efis.ls_auto_activate = rtb_BusAssignment_n_logic_efis_ls_auto_activate;
    A380FcuComputer_Y.out.logic.efis.vv_on = A380FcuComputer_DWork.vvActive;
    A380FcuComputer_Y.out.logic.efis.ls_on = A380FcuComputer_DWork.lsActive;
    A380FcuComputer_Y.out.logic.efis.taxi_on = rtb_Equal7;
    A380FcuComputer_Y.out.logic.efis.efis_filter = A380FcuComputer_DWork.pEfisFilter;
    A380FcuComputer_Y.out.logic.efis.cstr_on = rtb_Equal1;
    A380FcuComputer_Y.out.logic.efis.arpt_on = rtb_Equal8;
    A380FcuComputer_Y.out.logic.efis.navaid_1 = rtb_navaidStatus_f;
    A380FcuComputer_Y.out.logic.efis.navaid_2 = rtb_navaidStatus;
    A380FcuComputer_Y.out.logic.efis.traf_on = rtb_BusAssignment_p_traf_on;
    A380FcuComputer_Y.out.logic.efis.surv_filter = A380FcuComputer_DWork.pSurvFilter;
    A380FcuComputer_Y.out.logic.efis.efis_mode = rtb_BusAssignment_p_efis_mode;
    A380FcuComputer_Y.out.logic.efis.efis_range = rtb_BusAssignment_p_efis_range;
    A380FcuComputer_Y.out.logic.efis.baro_std = A380FcuComputer_DWork.std_active;
    A380FcuComputer_Y.out.logic.efis.baro_qnh = rtb_qnh;
    A380FcuComputer_Y.out.logic.efis.baro_qfe = (A380FcuComputer_DWork.qfe_active && (!A380FcuComputer_DWork.std_active));
    A380FcuComputer_Y.out.logic.efis.baro_value_hpa = A380FcuComputer_DWork.pValueHpa;
    A380FcuComputer_Y.out.logic.efis.baro_value_inhg = A380FcuComputer_DWork.pValueInhg;
    A380FcuComputer_Y.out.logic.efis.baro_preset_active = rtb_BusAssignment_p_baro_preset_active;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.vv_light_on = A380FcuComputer_DWork.vvActive;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.ls_light_on = A380FcuComputer_DWork.lsActive;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.taxi_light_on = rtb_Equal7;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.cstr_light_on = rtb_Equal1;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.wpt_light_on = (A380FcuComputer_DWork.pEfisFilter ==
      A380FcuComputer_P.EnumeratedConstant6_Value);
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.vord_light_on = (A380FcuComputer_DWork.pEfisFilter ==
      A380FcuComputer_P.EnumeratedConstant1_Value_o);
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.ndb_light_on = (A380FcuComputer_DWork.pEfisFilter ==
      A380FcuComputer_P.EnumeratedConstant2_Value);
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.arpt_light_on = rtb_Equal8;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.traf_light_on = rtb_BusAssignment_p_traf_on;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.wxr_light_on = (A380FcuComputer_DWork.pSurvFilter ==
      A380FcuComputer_P.EnumeratedConstant3_Value);
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.terr_light_on = (A380FcuComputer_DWork.pSurvFilter ==
      A380FcuComputer_P.EnumeratedConstant4_Value);
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.navaid_1_mode = rtb_navaidStatus_f;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.navaid_2_mode = rtb_navaidStatus;
    rtb_DataTypeConversion1_j = static_cast<uint32_T>(rtb_BusAssignment_p_efis_range) - 3U;
    if (static_cast<uint32_T>(rtb_BusAssignment_p_efis_range) - 3U > static_cast<uint32_T>
        (rtb_BusAssignment_p_efis_range)) {
      rtb_DataTypeConversion1_j = 0U;
    }

    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.efis_range = static_cast<a380_efis_panel_range_selection>(
      static_cast<uint8_T>(rtb_DataTypeConversion1_j));
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.efis_mode = rtb_BusAssignment_p_efis_mode;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_is_inhg =
      A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_is_inhg;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_is_std = A380FcuComputer_DWork.std_active;
    if (!A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_is_inhg) {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_value = A380FcuComputer_DWork.pValueHpa;
    } else {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_value = A380FcuComputer_DWork.pValueInhg;
    }

    if (A380FcuComputer_DWork.std_active) {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_mode = 0;
    } else if (rtb_qnh) {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_mode = 1;
    } else {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_mode = 2;
    }

    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_preset_visible = rtb_BusAssignment_p_baro_preset_active;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.efis_cp_active = false;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.loc_light_on = rtb_OR2;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.alt_light_on = rtb_BusAssignment_a_logic_afs_alt_active;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.appr_light_on = rtb_y_f;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.ap_1_light_on =
      A380FcuComputer_P.Constant1_Value.afs.ap_1_engaged;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.ap_2_light_on =
      A380FcuComputer_P.Constant1_Value.afs.ap_2_engaged;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.athr_light_on =
      A380FcuComputer_P.Constant1_Value.afs.athr_engaged;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.fd_light_on = A380FcuComputer_P.Constant1_Value.afs.fd_engaged;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.trk_fpa_mode = A380FcuComputer_DWork.p_trk_fpa_active;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.true_mode = A380FcuComputer_P.Constant1_Value.afs.true_active;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.mach_mode = rtb_BusAssignment_a_logic_afs_mach_active;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.spd_mach_value = 0.0;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.spd_mach_dashes = false;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.hdg_trk_value = 0.0;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.hdg_trk_dashes = false;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.alt_value = 0.0;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.vs_fpa_value = 0.0;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.vs_fpa_dashes = false;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.afs_cp_active = false;
    A380FcuComputer_Y.out.discrete_outputs.true_selected = A380FcuComputer_P.Constant1_Value.afs.true_active;
    A380FcuComputer_Y.out.discrete_outputs.fcu_healthy = A380FcuComputer_P.Constant1_Value_i;
    A380FcuComputer_Y.out.bus_outputs.selected_hdg_deg.SSM = 0U;
    A380FcuComputer_Y.out.bus_outputs.selected_hdg_deg.Data = 0.0F;
    A380FcuComputer_Y.out.bus_outputs.selected_alt_ft.SSM = 0U;
    A380FcuComputer_Y.out.bus_outputs.selected_alt_ft.Data = 0.0F;
    A380FcuComputer_Y.out.bus_outputs.selected_spd_kts.SSM = 0U;
    A380FcuComputer_Y.out.bus_outputs.selected_spd_kts.Data = 0.0F;
    A380FcuComputer_Y.out.bus_outputs.selected_vz_ft_min.SSM = 0U;
    A380FcuComputer_Y.out.bus_outputs.selected_vz_ft_min.Data = 0.0F;
    A380FcuComputer_Y.out.bus_outputs.selected_mach.SSM = 0U;
    A380FcuComputer_Y.out.bus_outputs.selected_mach.Data = 0.0F;
    A380FcuComputer_Y.out.bus_outputs.selected_trk_deg.SSM = 0U;
    A380FcuComputer_Y.out.bus_outputs.selected_trk_deg.Data = 0.0F;
    A380FcuComputer_Y.out.bus_outputs.selected_fpa_deg.SSM = 0U;
    A380FcuComputer_Y.out.bus_outputs.selected_fpa_deg.Data = 0.0F;
    A380FcuComputer_Y.out.bus_outputs.ats_fma_discrete_word =
      A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.ats_fma_discrete_word;
    A380FcuComputer_Y.out.bus_outputs.fcu_flex_to_temp_deg_c =
      A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.flx_to_temp_deg_c;
    A380FcuComputer_Y.out.bus_outputs.ats_discrete_word = A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.ats_discrete_word;
    A380FcuComputer_Y.out.bus_outputs.eis_discrete_word_1_left.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.eis_discrete_word_1_left.Data = 0.0F;
    A380FcuComputer_Y.out.bus_outputs.eis_discrete_word_1_right.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.eis_discrete_word_1_right.Data = 0.0F;
    A380FcuComputer_Y.out.bus_outputs.eis_discrete_word_2_left.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.eis_discrete_word_2_left.Data = 0.0F;
    A380FcuComputer_Y.out.bus_outputs.eis_discrete_word_2_right.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.eis_discrete_word_2_right.Data = 0.0F;
    A380FcuComputer_Y.out.bus_outputs.baro_setting_left_hpa.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.baro_setting_left_hpa.Data = A380FcuComputer_DWork.pValueHpa;
    A380FcuComputer_Y.out.bus_outputs.baro_setting_right_hpa.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.baro_setting_right_hpa.Data = A380FcuComputer_DWork.pValueHpa;
    A380FcuComputer_Y.out.bus_outputs.baro_setting_left_inhg.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.baro_setting_left_inhg.Data = A380FcuComputer_DWork.pValueInhg;
    A380FcuComputer_Y.out.bus_outputs.baro_setting_right_inhg.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.baro_setting_right_inhg.Data = A380FcuComputer_DWork.pValueInhg;
    A380FcuComputer_Y.out.bus_outputs.fcu_discrete_word_2.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.fcu_discrete_word_1.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.n1_cmd_percent = A380FcuComputer_U.in.bus_inputs.fmgc_2_bus.n1_command_percent;
  } else {
    A380FcuComputer_DWork.Runtime_MODE = false;
  }
}

void A380FcuComputer::initialize()
{
  A380FcuComputer_Y.out = A380FcuComputer_rtZfcu_outputs;
  A380FcuComputer_DWork.qnh_active = true;
  A380FcuComputer_DWork.pValueHpa = 1013.0F;
  A380FcuComputer_DWork.pValueInhg = 29.92F;
  A380FcuComputer_DWork.pMode = 2;
  A380FcuComputer_DWork.pRange = 4;
  A380FcuComputer_Y.out = A380FcuComputer_P.out_Y0;
}

void A380FcuComputer::terminate()
{
}

A380FcuComputer::A380FcuComputer():
  A380FcuComputer_U(),
  A380FcuComputer_Y(),
  A380FcuComputer_DWork()
{
}

A380FcuComputer::~A380FcuComputer() = default;
