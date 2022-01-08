#include "AutopilotStateMachine.h"
#include "AutopilotStateMachine_private.h"
#include "Double2MultiWord.h"
#include "MultiWordIor.h"
#include "mod_mvZvttxs.h"
#include "rt_remd.h"
#include "uMultiWord2Double.h"

const uint8_T AutopilotStateMachine_IN_FLARE{ 1U };

const uint8_T AutopilotStateMachine_IN_GA_TRK{ 1U };

const uint8_T AutopilotStateMachine_IN_HDG{ 1U };

const uint8_T AutopilotStateMachine_IN_LAND{ 2U };

const uint8_T AutopilotStateMachine_IN_LOC{ 2U };

const uint8_T AutopilotStateMachine_IN_LOC_CPT{ 3U };

const uint8_T AutopilotStateMachine_IN_LOC_TRACK{ 4U };

const uint8_T AutopilotStateMachine_IN_NAV{ 3U };

const uint8_T AutopilotStateMachine_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T AutopilotStateMachine_IN_OFF{ 2U };

const uint8_T AutopilotStateMachine_IN_ON{ 3U };

const uint8_T AutopilotStateMachine_IN_ROLL_OUT{ 5U };

const uint8_T AutopilotStateMachine_IN_RWY{ 4U };

const uint8_T AutopilotStateMachine_IN_RWY_TRK{ 5U };

const uint8_T AutopilotStateMachine_IN_InAir{ 1U };

const uint8_T AutopilotStateMachine_IN_OnGround{ 2U };

const uint8_T AutopilotStateMachine_IN_ALT{ 1U };

const uint8_T AutopilotStateMachine_IN_ALT_CPT{ 2U };

const uint8_T AutopilotStateMachine_IN_ALT_CST{ 3U };

const uint8_T AutopilotStateMachine_IN_ALT_CST_CPT{ 4U };

const uint8_T AutopilotStateMachine_IN_CLB{ 5U };

const uint8_T AutopilotStateMachine_IN_DES{ 6U };

const uint8_T AutopilotStateMachine_IN_FINAL_DES{ 7U };

const uint8_T AutopilotStateMachine_IN_GS{ 8U };

const uint8_T AutopilotStateMachine_IN_GS_CPT{ 2U };

const uint8_T AutopilotStateMachine_IN_GS_TRACK{ 3U };

const uint8_T AutopilotStateMachine_IN_LAND_k{ 4U };

const uint8_T AutopilotStateMachine_IN_OFF_m{ 1U };

const uint8_T AutopilotStateMachine_IN_ON_a{ 2U };

const uint8_T AutopilotStateMachine_IN_OP_CLB{ 9U };

const uint8_T AutopilotStateMachine_IN_OP_DES{ 10U };

const uint8_T AutopilotStateMachine_IN_SRS{ 11U };

const uint8_T AutopilotStateMachine_IN_SRS_GA{ 3U };

const uint8_T AutopilotStateMachine_IN_TCAS{ 4U };

const uint8_T AutopilotStateMachine_IN_VS{ 12U };

void AutopilotStateMachineModelClass::AutopilotStateMachine_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T
  *rty_Y, rtDW_LagFilter_AutopilotStateMachine_T *localDW)
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

void AutopilotStateMachineModelClass::AutopilotStateMachine_WashoutFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt,
  real_T *rty_Y, rtDW_WashoutFilter_AutopilotStateMachine_T *localDW)
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
  ca = 2.0 / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca - localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_BitShift(real_T rtu_u, real_T *rty_y)
{
  *rty_y = std::ldexp(rtu_u, 0);
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_BitShift1(real_T rtu_u, real_T *rty_y)
{
  *rty_y = std::ldexp(rtu_u, 1);
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_X_TO_OFF(const ap_sm_output *BusAssignment)
{
  return ((!BusAssignment->input.FD_active) && (BusAssignment->output.enabled_AP1 == 0.0) &&
          (BusAssignment->output.enabled_AP2 == 0.0)) || ((BusAssignment->data.flight_phase == 7.0) &&
    (BusAssignment->output.enabled_AP1 == 0.0) && (BusAssignment->output.enabled_AP2 == 0.0)) ||
    ((BusAssignment->data.flight_phase == 0.0) && (BusAssignment->data.throttle_lever_1_pos < 35.0) &&
     (BusAssignment->data.throttle_lever_2_pos < 35.0));
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_X_TO_GA_TRK(const ap_sm_output *BusAssignment)
{
  return BusAssignment->lateral.condition.GA_TRACK;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_ON_TO_HDG(const ap_sm_output *BusAssignment)
{
  return BusAssignment->input.HDG_pull;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_ON_TO_NAV(const ap_sm_output *BusAssignment)
{
  return BusAssignment->lateral.condition.NAV && (BusAssignment->lateral.armed.NAV || BusAssignment->input.HDG_push ||
    BusAssignment->input.DIR_TO_trigger);
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_NAV_entry(void)
{
  AutopilotStateMachine_B.out_n.mode = lateral_mode_NAV;
  AutopilotStateMachine_B.out_n.law = lateral_law_HPATH;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_HDG_entry(const ap_sm_output *BusAssignment)
{
  if (BusAssignment->input.TRK_FPA_mode) {
    AutopilotStateMachine_B.out_n.mode = lateral_mode_TRACK;
    AutopilotStateMachine_B.out_n.law = lateral_law_TRACK;
  } else {
    AutopilotStateMachine_B.out_n.mode = lateral_mode_HDG;
    AutopilotStateMachine_B.out_n.law = lateral_law_HDG;
  }
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_ON_TO_LOC(const ap_sm_output *BusAssignment)
{
  return BusAssignment->lateral.armed.LOC && BusAssignment->lateral.condition.LOC_CPT;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_HDG_during(const ap_sm_output *BusAssignment)
{
  AutopilotStateMachine_B.out_n.mode_reversion = false;
  AutopilotStateMachine_B.out_n.Psi_c_deg = BusAssignment->input.Psi_fcu_deg;
  if (BusAssignment->input.TRK_FPA_mode) {
    AutopilotStateMachine_B.out_n.mode = lateral_mode_TRACK;
    AutopilotStateMachine_B.out_n.law = lateral_law_TRACK;
  } else {
    AutopilotStateMachine_B.out_n.mode = lateral_mode_HDG;
    AutopilotStateMachine_B.out_n.law = lateral_law_HDG;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_LOC_CPT_entry(void)
{
  AutopilotStateMachine_B.out_n.mode = lateral_mode_LOC_CPT;
  AutopilotStateMachine_B.out_n.law = lateral_law_LOC_CPT;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_OFF_entry(void)
{
  AutopilotStateMachine_B.out_n.mode = lateral_mode_NONE;
  AutopilotStateMachine_B.out_n.law = lateral_law_NONE;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ROLL_OUT_entry(void)
{
  AutopilotStateMachine_B.out_n.mode = lateral_mode_ROLL_OUT;
  AutopilotStateMachine_B.out_n.law = lateral_law_ROLL_OUT;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_FLARE_entry(void)
{
  AutopilotStateMachine_B.out_n.mode = lateral_mode_FLARE;
  AutopilotStateMachine_B.out_n.law = lateral_law_LOC_TRACK;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_LOC_TO_X(const ap_sm_output *BusAssignment)
{
  boolean_T isGsArmedOrActive;
  isGsArmedOrActive = (BusAssignment->vertical_previous.armed.GS || (BusAssignment->vertical_previous.output.mode ==
    vertical_mode_GS_CPT) || (BusAssignment->vertical_previous.output.mode == vertical_mode_GS_TRACK));
  return (BusAssignment->input.LOC_push && (!isGsArmedOrActive)) || (BusAssignment->input.APPR_push && isGsArmedOrActive);
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_LOC_TRACK_entry(void)
{
  AutopilotStateMachine_B.out_n.mode = lateral_mode_LOC_TRACK;
  AutopilotStateMachine_B.out_n.law = lateral_law_LOC_TRACK;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_LAND_entry(void)
{
  AutopilotStateMachine_B.out_n.mode = lateral_mode_LAND;
  AutopilotStateMachine_B.out_n.law = lateral_law_LOC_TRACK;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_NAV_TO_HDG(const ap_sm_output *BusAssignment)
{
  boolean_T y;
  y = (BusAssignment->input.HDG_pull || (!BusAssignment->lateral.condition.NAV) ||
       (AutopilotStateMachine_DWork.prev_FDES_active && (BusAssignment->vertical_previous.output.mode !=
         vertical_mode_FINAL_DES) && (BusAssignment->vertical_previous.output.mode != vertical_mode_TCAS)) ||
       (AutopilotStateMachine_DWork.prev_FDES_armed && (!BusAssignment->vertical_previous.armed.FINAL_DES) &&
        (BusAssignment->vertical_previous.output.mode != vertical_mode_FINAL_DES)));
  AutopilotStateMachine_DWork.prev_FDES_active = (BusAssignment->vertical_previous.output.mode ==
    vertical_mode_FINAL_DES);
  AutopilotStateMachine_DWork.prev_FDES_armed = BusAssignment->vertical_previous.armed.FINAL_DES;
  AutopilotStateMachine_DWork.prev_FDES_armed = ((!BusAssignment->input.HDG_pull) &&
    AutopilotStateMachine_DWork.prev_FDES_armed);
  return y;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_RWY_TO_RWY_TRK(const ap_sm_output *BusAssignment)
{
  real_T R;
  real_T r;
  real_T x;
  x = (BusAssignment->data.Psi_magnetic_deg - (BusAssignment->data.nav_loc_deg + 360.0)) + 360.0;
  if (x == 0.0) {
    r = 0.0;
  } else {
    r = std::fmod(x, 360.0);
    if (r == 0.0) {
      r = 0.0;
    } else if (x < 0.0) {
      r += 360.0;
    }
  }

  x = std::abs(-r);
  if (360.0 - x == 0.0) {
    R = 0.0;
  } else {
    R = std::fmod(360.0 - x, 360.0);
    if (R == 0.0) {
      R = 0.0;
    } else if (360.0 - x < 0.0) {
      R += 360.0;
    }
  }

  if (x < std::abs(R)) {
    R = -r;
  }

  return ((BusAssignment->data.H_radio_ft >= 30.0) && (!BusAssignment->lateral.armed.NAV)) ||
    (!BusAssignment->data.nav_valid) || (std::abs(R) > 20.0);
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_RWY_TO_OFF(const ap_sm_output *BusAssignment)
{
  real_T R;
  real_T r;
  real_T x;
  x = (BusAssignment->data.Psi_magnetic_deg - (BusAssignment->data.nav_loc_deg + 360.0)) + 360.0;
  if (x == 0.0) {
    r = 0.0;
  } else {
    r = std::fmod(x, 360.0);
    if (r == 0.0) {
      r = 0.0;
    } else if (x < 0.0) {
      r += 360.0;
    }
  }

  x = std::abs(-r);
  if (360.0 - x == 0.0) {
    R = 0.0;
  } else {
    R = std::fmod(360.0 - x, 360.0);
    if (R == 0.0) {
      R = 0.0;
    } else if (360.0 - x < 0.0) {
      R += 360.0;
    }
  }

  if (x < std::abs(R)) {
    R = -r;
  }

  return (!BusAssignment->data.nav_valid) && (std::abs(R) > 20.0);
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_RWY_TRK_entry(const ap_sm_output *BusAssignment)
{
  AutopilotStateMachine_B.out_n.mode = lateral_mode_RWY_TRACK;
  AutopilotStateMachine_B.out_n.law = lateral_law_TRACK;
  AutopilotStateMachine_B.out_n.Psi_c_deg = BusAssignment->data.Psi_magnetic_track_deg;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_GA_TRK_entry(const ap_sm_output *BusAssignment)
{
  AutopilotStateMachine_B.out_n.mode = lateral_mode_GA_TRACK;
  AutopilotStateMachine_B.out_n.law = lateral_law_TRACK;
  AutopilotStateMachine_B.out_n.Psi_c_deg = BusAssignment->data.Psi_magnetic_track_deg;
  AutopilotStateMachine_B.out_n.mode_reversion_TRK_FPA = true;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ON(const ap_sm_output *BusAssignment)
{
  if (AutopilotStateMachine_X_TO_OFF(BusAssignment)) {
    AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_OFF;
    AutopilotStateMachine_OFF_entry();
  } else if (AutopilotStateMachine_X_TO_GA_TRK(BusAssignment)) {
    AutopilotStateMachine_B.out_n.mode_reversion_TRK_FPA = true;
    AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_GA_TRK;
    AutopilotStateMachine_GA_TRK_entry(BusAssignment);
  } else {
    boolean_T guard1{ false };

    boolean_T guard2{ false };

    guard1 = false;
    guard2 = false;
    switch (AutopilotStateMachine_DWork.is_ON_l) {
     case AutopilotStateMachine_IN_HDG:
      if (AutopilotStateMachine_ON_TO_NAV(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NAV;
        AutopilotStateMachine_NAV_entry();
      } else if (AutopilotStateMachine_ON_TO_LOC(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_LOC;
        AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_LOC_CPT;
        AutopilotStateMachine_LOC_CPT_entry();
      } else {
        AutopilotStateMachine_HDG_during(BusAssignment);
      }
      break;

     case AutopilotStateMachine_IN_LOC:
      if (BusAssignment->data.H_radio_ft > 400.0) {
        if (AutopilotStateMachine_ON_TO_HDG(BusAssignment)) {
          AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
          AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_HDG;
          AutopilotStateMachine_HDG_entry(BusAssignment);
        } else if (AutopilotStateMachine_ON_TO_NAV(BusAssignment)) {
          AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
          AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NAV;
          AutopilotStateMachine_NAV_entry();
        } else {
          guard2 = true;
        }
      } else {
        guard2 = true;
      }
      break;

     case AutopilotStateMachine_IN_NAV:
      if (AutopilotStateMachine_NAV_TO_HDG(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_HDG;
        AutopilotStateMachine_HDG_entry(BusAssignment);
      } else if (AutopilotStateMachine_ON_TO_LOC(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_LOC;
        AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_LOC_CPT;
        AutopilotStateMachine_LOC_CPT_entry();
      }
      break;

     case AutopilotStateMachine_IN_RWY:
      if (AutopilotStateMachine_RWY_TO_RWY_TRK(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_RWY_TRK;
        AutopilotStateMachine_RWY_TRK_entry(BusAssignment);
      } else if (AutopilotStateMachine_ON_TO_HDG(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_HDG;
        AutopilotStateMachine_HDG_entry(BusAssignment);
      } else if (AutopilotStateMachine_ON_TO_NAV(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NAV;
        AutopilotStateMachine_NAV_entry();
      } else if (AutopilotStateMachine_RWY_TO_OFF(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_OFF;
        AutopilotStateMachine_OFF_entry();
      }
      break;

     default:
      if (AutopilotStateMachine_ON_TO_HDG(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_HDG;
        AutopilotStateMachine_HDG_entry(BusAssignment);
      } else if (AutopilotStateMachine_ON_TO_NAV(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NAV;
        AutopilotStateMachine_NAV_entry();
      }
      break;
    }

    if (guard2) {
      switch (AutopilotStateMachine_DWork.is_LOC) {
       case AutopilotStateMachine_IN_FLARE:
        if (BusAssignment->lateral.condition.ROLL_OUT) {
          AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_ROLL_OUT;
          AutopilotStateMachine_ROLL_OUT_entry();
        }
        break;

       case AutopilotStateMachine_IN_LAND:
        if (BusAssignment->lateral.condition.FLARE) {
          AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_FLARE;
          AutopilotStateMachine_FLARE_entry();
        }
        break;

       case AutopilotStateMachine_IN_LOC_CPT:
        if (AutopilotStateMachine_LOC_TO_X(BusAssignment)) {
          if (BusAssignment->data.on_ground == 0.0) {
            AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_HDG;
            AutopilotStateMachine_HDG_entry(BusAssignment);
          } else if (BusAssignment->data.on_ground != 0.0) {
            AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_OFF;
            AutopilotStateMachine_OFF_entry();
          } else {
            guard1 = true;
          }
        } else {
          guard1 = true;
        }
        break;

       case AutopilotStateMachine_IN_LOC_TRACK:
        if (BusAssignment->lateral.condition.LAND) {
          AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_LAND;
          AutopilotStateMachine_LAND_entry();
        } else if (AutopilotStateMachine_LOC_TO_X(BusAssignment)) {
          if (BusAssignment->data.on_ground == 0.0) {
            AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_HDG;
            AutopilotStateMachine_HDG_entry(BusAssignment);
          } else if (BusAssignment->data.on_ground != 0.0) {
            AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_OFF;
            AutopilotStateMachine_OFF_entry();
          }
        }
        break;

       default:
        if (!BusAssignment->lateral.condition.ROLL_OUT) {
          if (BusAssignment->data.on_ground == 0.0) {
            AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_HDG;
            AutopilotStateMachine_HDG_entry(BusAssignment);
          } else if (BusAssignment->data.on_ground != 0.0) {
            AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_OFF;
            AutopilotStateMachine_OFF_entry();
          }
        }
        break;
      }
    }

    if (guard1) {
      if (BusAssignment->lateral.condition.LOC_TRACK) {
        AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_LOC_TRACK;
        AutopilotStateMachine_LOC_TRACK_entry();
      }
    }
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_GA_TRK_during(void)
{
  AutopilotStateMachine_B.out_n.mode_reversion_TRK_FPA = false;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_OFF_TO_HDG(const ap_sm_output *BusAssignment)
{
  return (BusAssignment->data_computed.time_since_lift_off >= 5.0) && (BusAssignment->input.FD_active ||
    (BusAssignment->output.enabled_AP1 != 0.0) || (BusAssignment->output.enabled_AP2 != 0.0)) &&
    (BusAssignment->input.HDG_pull || (!BusAssignment->lateral.armed.NAV));
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_OFF_TO_NAV(const ap_sm_output *BusAssignment)
{
  return (BusAssignment->input.FD_active || (BusAssignment->output.enabled_AP1 != 0.0) ||
          (BusAssignment->output.enabled_AP2 != 0.0)) && BusAssignment->lateral.armed.NAV &&
    BusAssignment->lateral.condition.NAV;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_OFF_TO_RWY(const ap_sm_output *BusAssignment)
{
  real_T R;
  real_T r;
  real_T x;
  boolean_T y;
  x = (BusAssignment->data.Psi_magnetic_deg - (BusAssignment->data.nav_loc_deg + 360.0)) + 360.0;
  if (x == 0.0) {
    r = 0.0;
  } else {
    r = std::fmod(x, 360.0);
    if (r == 0.0) {
      r = 0.0;
    } else if (x < 0.0) {
      r += 360.0;
    }
  }

  x = std::abs(-r);
  if (360.0 - x == 0.0) {
    R = 0.0;
  } else {
    R = std::fmod(360.0 - x, 360.0);
    if (R == 0.0) {
      R = 0.0;
    } else if (360.0 - x < 0.0) {
      R += 360.0;
    }
  }

  if ((BusAssignment->input.FD_active || (BusAssignment->output.enabled_AP1 != 0.0) ||
       (BusAssignment->output.enabled_AP2 != 0.0)) && (BusAssignment->data.V2_kn >= 90.0) &&
      (BusAssignment->data.flaps_handle_index >= 1.0) && (BusAssignment->data_computed.time_since_touchdown >= 30.0) &&
      ((BusAssignment->data.throttle_lever_1_pos >= 35.0) || (BusAssignment->data.throttle_lever_2_pos >= 35.0)) &&
      BusAssignment->data.nav_valid) {
    if (std::abs(BusAssignment->data.nav_loc_error_deg) <= 0.4) {
      if (x < std::abs(R)) {
        R = -r;
      }

      if (std::abs(R) <= 20.0) {
        if (!AutopilotStateMachine_DWork.eventTime_not_empty) {
          AutopilotStateMachine_DWork.eventTime = BusAssignment->time.simulation_time;
          AutopilotStateMachine_DWork.eventTime_not_empty = true;
        }

        if ((!(BusAssignment->vertical_previous.output.mode == vertical_mode_SRS)) ||
            (AutopilotStateMachine_DWork.eventTime == 0.0)) {
          AutopilotStateMachine_DWork.eventTime = BusAssignment->time.simulation_time;
        }

        y = (BusAssignment->time.simulation_time - AutopilotStateMachine_DWork.eventTime >= 0.9);
      } else {
        y = false;
      }
    } else {
      y = false;
    }
  } else {
    y = false;
  }

  return y;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_OFF_TO_RWY_TRK(const ap_sm_output *BusAssignment)
{
  return (BusAssignment->input.FD_active || (BusAssignment->output.enabled_AP1 != 0.0) ||
          (BusAssignment->output.enabled_AP2 != 0.0)) && ((!BusAssignment->lateral.armed.NAV) ||
    (BusAssignment->lateral.armed.NAV && (!BusAssignment->lateral.condition.NAV))) && (BusAssignment->data.H_radio_ft >=
    30.0) && (BusAssignment->data.H_radio_ft < 100.0);
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_RWY_entry(void)
{
  AutopilotStateMachine_B.out_n.mode = lateral_mode_RWY;
  AutopilotStateMachine_B.out_n.law = lateral_law_ROLL_OUT;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_TCAS_TO_ALT(void) const
{
  return ((!AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_available) ||
          AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_fail ||
          (AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_state < 2.0)) &&
    ((AutopilotStateMachine_B.out.TCAS_sub_mode == ALT) ||
     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT);
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_TCAS_TO_ALT_CPT(void) const
{
  return ((!AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_available) ||
          AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_fail ||
          (AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_state < 2.0)) &&
    ((AutopilotStateMachine_B.out.TCAS_sub_mode == ALT_CPT) ||
     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT);
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_TCAS_TO_VS(void) const
{
  return ((!AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_available) ||
          AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_fail ||
          (AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_state < 2.0)) &&
    (AutopilotStateMachine_B.out.TCAS_sub_mode == NONE) &&
    (!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT) &&
    (!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT);
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_updateTcasTargetVerticalSpeed(boolean_T isEntry)
{
  real_T target_max;
  real_T target_min;
  boolean_T isCorrective;
  isCorrective = (AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_state == 3.0);
  target_min = std::fmin(AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_min_fpm,
    AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_max_fpm);
  target_max = std::fmax(AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_min_fpm,
    AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_max_fpm);
  if (isCorrective) {
    real_T correction_sign;
    correction_sign = target_max + target_min;
    if (correction_sign < 0.0) {
      correction_sign = -1.0;
    } else if (correction_sign > 0.0) {
      correction_sign = 1.0;
    }

    if (correction_sign == 0.0) {
      AutopilotStateMachine_DWork.local_TCAS_target_fpm = 0.0;
    } else {
      real_T target_min_0;
      if (target_min < 0.0) {
        target_min_0 = -1.0;
      } else if (target_min > 0.0) {
        target_min_0 = 1.0;
      } else {
        target_min_0 = target_min;
      }

      AutopilotStateMachine_DWork.local_TCAS_target_fpm = target_min_0 * std::fmin(std::abs(target_min), std::abs
        (target_max)) + correction_sign * 200.0;
    }
  } else if (isEntry || AutopilotStateMachine_DWork.local_TCAS_is_corrective) {
    AutopilotStateMachine_DWork.local_TCAS_target_fpm = std::round
      (AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min / 100.0) * 100.0;
  }

  AutopilotStateMachine_DWork.local_TCAS_target_fpm = std::fmax(std::fmin
    (AutopilotStateMachine_DWork.local_TCAS_target_fpm, target_max), target_min);
  AutopilotStateMachine_DWork.local_TCAS_is_corrective = isCorrective;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_getTcasSubModeCompatibility(void) const
{
  real_T target_max;
  real_T target_min;
  target_min = std::fmin(AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_min_fpm,
    AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_max_fpm);
  target_max = std::fmax(AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_min_fpm,
    AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_max_fpm);
  return (AutopilotStateMachine_DWork.local_TCAS_target_fpm <= target_max) &&
    (AutopilotStateMachine_DWork.local_TCAS_target_fpm >= target_min) && (0.0 >= target_min) && (0.0 <= target_max);
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_TCAS_during(void)
{
  if (AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_available &&
      (!AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_fail) &&
      (AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_state >= 2.0)) {
    AutopilotStateMachine_updateTcasTargetVerticalSpeed(false);
  }

  if (AutopilotStateMachine_B.BusAssignment_g.input.FD_active) {
    AutopilotStateMachine_B.out.FD_connect = false;
  }

  AutopilotStateMachine_B.out.mode_reversion_TRK_FPA = false;
  AutopilotStateMachine_B.out.TCAS_sub_mode_compatible = AutopilotStateMachine_getTcasSubModeCompatibility();
  if ((AutopilotStateMachine_B.out.TCAS_sub_mode == NONE) && AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT &&
      AutopilotStateMachine_B.out.TCAS_sub_mode_compatible) {
    AutopilotStateMachine_B.out.TCAS_sub_mode = ALT_CPT;
    AutopilotStateMachine_DWork.local_TCAS_target_fpm = 0.0;
  } else if ((AutopilotStateMachine_B.out.TCAS_sub_mode == ALT_CPT) &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT &&
             AutopilotStateMachine_B.out.TCAS_sub_mode_compatible) {
    AutopilotStateMachine_B.out.TCAS_sub_mode = ALT;
  } else if (!AutopilotStateMachine_B.out.TCAS_sub_mode_compatible) {
    AutopilotStateMachine_B.out.TCAS_sub_mode = NONE;
  } else if ((AutopilotStateMachine_B.out.TCAS_sub_mode == ALT_CPT) && (std::abs
              (AutopilotStateMachine_DWork.local_H_fcu_ft - AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft) >
              250.0)) {
    AutopilotStateMachine_B.out.TCAS_sub_mode = NONE;
  }

  AutopilotStateMachine_B.out.mode = vertical_mode_TCAS;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  switch (AutopilotStateMachine_B.out.TCAS_sub_mode) {
   case ALT_CPT:
    AutopilotStateMachine_DWork.local_H_fcu_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    AutopilotStateMachine_B.out.law = vertical_law_ALT_ACQ;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    break;

   case ALT:
    AutopilotStateMachine_B.out.law = vertical_law_ALT_HOLD;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    break;

   default:
    AutopilotStateMachine_B.out.law = vertical_law_VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_DWork.local_TCAS_target_fpm;
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
    break;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_TCAS_exit(void)
{
  AutopilotStateMachine_B.out.TCAS_message_disarm = false;
  AutopilotStateMachine_B.out.TCAS_sub_mode_compatible = true;
  if (AutopilotStateMachine_DWork.local_TCAS_TRK_FPA_Reverted) {
    AutopilotStateMachine_B.out.TCAS_message_TRK_FPA_deselection = true;
  }

  if ((!AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_available) ||
      AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_fail) {
    AutopilotStateMachine_B.out.TCAS_message_RA_inhibit = true;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_OFF_entry_p(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_NONE;
  AutopilotStateMachine_B.out.law = vertical_law_NONE;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_DES_entry(void)
{
  real_T targetAltitude;
  AutopilotStateMachine_B.out.mode = vertical_mode_DES;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
    targetAltitude = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
  } else {
    targetAltitude = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  }

  switch (AutopilotStateMachine_B.BusAssignment_g.input.FM_requested_vertical_mode) {
   case fm_requested_vertical_mode_NONE:
    AutopilotStateMachine_B.out.H_c_ft = targetAltitude;
    if (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft - targetAltitude) <= 1200.0) {
      AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
      AutopilotStateMachine_B.out.law = vertical_law_VS;
      AutopilotStateMachine_B.out.H_dot_c_fpm = -1000.0;
    } else {
      AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_IDLE;
      AutopilotStateMachine_B.out.law = vertical_law_SPD_MACH;
    }
    break;

   case fm_requested_vertical_mode_SPEED_THRUST:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law_SPD_MACH;
    break;

   case fm_requested_vertical_mode_VPATH_SPEED:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
    AutopilotStateMachine_B.out.law = vertical_law_VPATH;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   case fm_requested_vertical_mode_FPA_SPEED:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
    AutopilotStateMachine_B.out.law = vertical_law_FPA;
    AutopilotStateMachine_B.out.FPA_c_deg = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   case fm_requested_vertical_mode_VS_SPEED:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
    AutopilotStateMachine_B.out.law = vertical_law_VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   default:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law_VPATH;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_CLB_entry(void)
{
  real_T tmp;
  AutopilotStateMachine_B.out.mode = vertical_mode_CLB;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
    tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
  } else {
    tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  }

  if (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft - tmp) <= 1200.0) {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
    AutopilotStateMachine_B.out.law = vertical_law_VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 1000.0;
  } else {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_CLB;
    AutopilotStateMachine_B.out.law = vertical_law_SPD_MACH;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_OP_CLB_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_OP_CLB;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft -
               AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft) <= 1200.0) {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
    AutopilotStateMachine_B.out.law = vertical_law_VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 1000.0;
  } else {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_CLB;
    AutopilotStateMachine_B.out.law = vertical_law_SPD_MACH;
  }

  AutopilotStateMachine_B.out.EXPED_mode_active = AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_OP_DES_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_OP_DES;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft -
               AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft) <= 1200.0) {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
    AutopilotStateMachine_B.out.law = vertical_law_VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = -1000.0;
  } else {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law_SPD_MACH;
  }

  AutopilotStateMachine_B.out.EXPED_mode_active = AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_FINAL_DES_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_FINAL_DES;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  AutopilotStateMachine_B.out.law = vertical_law_VPATH;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
  AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_GS_CPT_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_GS_CPT;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  AutopilotStateMachine_B.out.law = vertical_law_GS;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_TCAS_TO_VS_Action(void)
{
  AutopilotStateMachine_B.out.mode_reversion = true;
  if (AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_available &&
      (!AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_fail)) {
    if (AutopilotStateMachine_DWork.local_TCAS_is_corrective) {
      real_T u;
      u = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft - AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
      if (u < 0.0) {
        u = -1.0;
      } else if (u > 0.0) {
        u = 1.0;
      }

      AutopilotStateMachine_B.out.mode_reversion_target_fpm = 1000.0 * u;
      if (AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft >= 30000.0) {
        AutopilotStateMachine_B.out.mode_reversion_target_fpm = std::fmin(500.0,
          AutopilotStateMachine_B.out.mode_reversion_target_fpm);
      }
    } else {
      AutopilotStateMachine_B.out.mode_reversion_target_fpm = AutopilotStateMachine_DWork.local_TCAS_target_fpm;
    }
  } else if (AutopilotStateMachine_DWork.local_TCAS_target_fpm < 0.0) {
    AutopilotStateMachine_B.out.mode_reversion_target_fpm = 0.0;
  } else {
    AutopilotStateMachine_B.out.mode_reversion_target_fpm = AutopilotStateMachine_DWork.local_TCAS_target_fpm;
  }

  AutopilotStateMachine_B.out.TCAS_message_RA_inhibit = false;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_VS_entry(void)
{
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  if (AutopilotStateMachine_B.BusAssignment_g.input.TRK_FPA_mode) {
    AutopilotStateMachine_B.out.mode = vertical_mode_FPA;
    AutopilotStateMachine_B.out.law = vertical_law_FPA;
  } else {
    AutopilotStateMachine_B.out.mode = vertical_mode_VS;
    AutopilotStateMachine_B.out.law = vertical_law_VS;
  }

  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.H_dot_fcu_fpm;
  AutopilotStateMachine_B.out.FPA_c_deg = AutopilotStateMachine_B.BusAssignment_g.input.FPA_fcu_deg;
  if (AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
    AutopilotStateMachine_B.out.H_dot_c_fpm = std::round(AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min /
      100.0) * 100.0;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ALT_CPT_entry(void)
{
  AutopilotStateMachine_DWork.local_H_fcu_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  AutopilotStateMachine_B.out.mode = vertical_mode_ALT_CPT;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  AutopilotStateMachine_B.out.law = vertical_law_ALT_ACQ;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ALT_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_ALT;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  AutopilotStateMachine_B.out.law = vertical_law_ALT_HOLD;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  AutopilotStateMachine_B.out.ALT_cruise_mode_active = (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft -
    AutopilotStateMachine_B.BusAssignment_g.data.cruise_altitude) < 60.0);
  AutopilotStateMachine_B.out.ALT_soft_mode_active = AutopilotStateMachine_B.BusAssignment_g.data_computed.ALT_soft_mode;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_TCAS(void)
{
  if (AutopilotStateMachine_TCAS_TO_ALT() && AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT) {
    AutopilotStateMachine_TCAS_exit();
    AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT;
    AutopilotStateMachine_ALT_entry();
  } else if (AutopilotStateMachine_TCAS_TO_ALT_CPT()) {
    AutopilotStateMachine_TCAS_exit();
    AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
    AutopilotStateMachine_ALT_CPT_entry();
  } else {
    boolean_T guard1{ false };

    guard1 = false;
    if (AutopilotStateMachine_TCAS_TO_VS()) {
      AutopilotStateMachine_TCAS_TO_VS_Action();
      guard1 = true;
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
      AutopilotStateMachine_TCAS_exit();
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
      AutopilotStateMachine_GS_CPT_entry();
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
      AutopilotStateMachine_TCAS_exit();
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
      AutopilotStateMachine_FINAL_DES_entry();
    } else {
      real_T tmp;
      boolean_T tmp_0;
      tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
        AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
      tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
      if (tmp_0 && (tmp < -20.0)) {
        AutopilotStateMachine_TCAS_exit();
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
        AutopilotStateMachine_OP_DES_entry();
      } else if (tmp_0 && (tmp > 20.0)) {
        AutopilotStateMachine_TCAS_exit();
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
        AutopilotStateMachine_OP_CLB_entry();
      } else {
        tmp = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                       AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
        if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
            AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
            AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
            ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
          AutopilotStateMachine_TCAS_exit();
          AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
          AutopilotStateMachine_CLB_entry();
        } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
                   ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
          AutopilotStateMachine_TCAS_exit();
          AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
          AutopilotStateMachine_DES_entry();
        } else if ((!AutopilotStateMachine_B.out.FD_connect) &&
                   (((!AutopilotStateMachine_B.BusAssignment_g.input.FD_active) &&
                     (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 == 0.0) &&
                     (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0)) ||
                    ((AutopilotStateMachine_B.BusAssignment_g.data.flight_phase == 7.0) &&
                     (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 == 0.0) &&
                     (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0)) ||
                    ((AutopilotStateMachine_B.BusAssignment_g.data.flight_phase == 0.0) &&
                     (AutopilotStateMachine_B.BusAssignment_g.data.throttle_lever_1_pos == 0.0) &&
                     (AutopilotStateMachine_B.BusAssignment_g.data.throttle_lever_2_pos == 0.0)))) {
          AutopilotStateMachine_TCAS_exit();
          AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_m;
          AutopilotStateMachine_OFF_entry_p();
        } else if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
                   AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
          guard1 = true;
        } else {
          AutopilotStateMachine_TCAS_during();
        }
      }
    }

    if (guard1) {
      AutopilotStateMachine_TCAS_exit();
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
      AutopilotStateMachine_VS_entry();
    }
  }
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_X_TO_TCAS(void) const
{
  return AutopilotStateMachine_B.BusAssignment_g.vertical.condition.TCAS;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_X_TO_SRS_GA(void) const
{
  return AutopilotStateMachine_B.BusAssignment_g.vertical.condition.SRS_GA;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_OFF_during(void)
{
  if (AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.FD_disconnect &&
      (!AutopilotStateMachine_B.BusAssignment_g.input.FD_active)) {
    AutopilotStateMachine_B.out.FD_disconnect = false;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_SRS_GA_entry(void)
{
  AutopilotStateMachine_DWork.local_H_GA_init_ft = AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
  AutopilotStateMachine_B.out.mode = vertical_mode_SRS_GA;
  AutopilotStateMachine_B.out.law = vertical_law_SRS;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_CLB;
  if (AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_1 &&
      AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_2) {
    AutopilotStateMachine_B.out.V_c_kn = std::fmin(AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn + 25.0, std::fmax
      (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn, AutopilotStateMachine_B.BusAssignment_g.data.VAPP_kn));
  } else {
    AutopilotStateMachine_B.out.V_c_kn = std::fmin(AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn + 15.0, std::fmax
      (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn, AutopilotStateMachine_B.BusAssignment_g.data.VAPP_kn));
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_X_TO_TCAS_Action(void)
{
  AutopilotStateMachine_B.out.FD_connect = true;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_TCAS_entry(void)
{
  if (AutopilotStateMachine_B.BusAssignment_g.input.TRK_FPA_mode) {
    AutopilotStateMachine_B.out.mode_reversion_TRK_FPA = true;
    AutopilotStateMachine_DWork.local_TCAS_TRK_FPA_Reverted = true;
  } else {
    AutopilotStateMachine_DWork.local_TCAS_TRK_FPA_Reverted = false;
  }

  AutopilotStateMachine_updateTcasTargetVerticalSpeed(true);
  AutopilotStateMachine_B.out.TCAS_sub_mode = NONE;
  AutopilotStateMachine_B.out.TCAS_sub_mode_compatible = true;
  AutopilotStateMachine_B.out.TCAS_message_RA_inhibit = false;
  if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB ||
      AutopilotStateMachine_B.BusAssignment_g.vertical.armed.DES ||
      AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS ||
      AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES) {
    AutopilotStateMachine_B.out.TCAS_message_disarm = true;
  }

  AutopilotStateMachine_B.out.mode = vertical_mode_TCAS;
  AutopilotStateMachine_B.out.law = vertical_law_VS;
  AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_DWork.local_TCAS_target_fpm;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  AutopilotStateMachine_B.out.TCAS_message_TRK_FPA_deselection = false;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_SRS_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_SRS;
  AutopilotStateMachine_B.out.law = vertical_law_SRS;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_CLB;
  if (AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_1 &&
      AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_2) {
    AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.data.V2_kn + 10.0;
  } else {
    AutopilotStateMachine_B.out.V_c_kn = std::fmin(AutopilotStateMachine_B.BusAssignment_g.data.V2_kn + 15.0, std::fmax
      (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn, AutopilotStateMachine_B.BusAssignment_g.data.V2_kn));
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_VS_during(void)
{
  real_T b_x;
  real_T targetVS;
  boolean_T isAutopilotEngaged;
  if (AutopilotStateMachine_B.BusAssignment_g.input.TRK_FPA_mode) {
    int8_T n;
    AutopilotStateMachine_B.out.mode = vertical_mode_FPA;
    AutopilotStateMachine_B.out.law = vertical_law_FPA;
    b_x = rt_remd(AutopilotStateMachine_B.BusAssignment_g.input.FPA_fcu_deg, 360.0);
    targetVS = std::abs(b_x);
    if (targetVS > 180.0) {
      if (b_x > 0.0) {
        b_x -= 360.0;
      } else {
        b_x += 360.0;
      }

      targetVS = std::abs(b_x);
    }

    if (targetVS <= 45.0) {
      b_x *= 0.017453292519943295;
      n = 0;
    } else if (targetVS <= 135.0) {
      if (b_x > 0.0) {
        b_x = (b_x - 90.0) * 0.017453292519943295;
        n = 1;
      } else {
        b_x = (b_x + 90.0) * 0.017453292519943295;
        n = -1;
      }
    } else if (b_x > 0.0) {
      b_x = (b_x - 180.0) * 0.017453292519943295;
      n = 2;
    } else {
      b_x = (b_x + 180.0) * 0.017453292519943295;
      n = -2;
    }

    b_x = std::tan(b_x);
    if ((n == 1) || (n == -1)) {
      b_x = -(1.0 / b_x);
    }

    targetVS = b_x * AutopilotStateMachine_B.BusAssignment_g.data.V_gnd_kn * 0.51444444444444448 * 196.85039370078741;
  } else {
    AutopilotStateMachine_B.out.mode = vertical_mode_VS;
    AutopilotStateMachine_B.out.law = vertical_law_VS;
    targetVS = AutopilotStateMachine_B.BusAssignment_g.input.H_dot_fcu_fpm;
  }

  isAutopilotEngaged = ((AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 != 0.0) ||
                        (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 != 0.0));
  if (AutopilotStateMachine_B.out.V_c_kn == AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn) {
    b_x = AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn - 5.0;
  } else {
    b_x = AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn;
  }

  targetVS = AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min - targetVS;
  AutopilotStateMachine_B.out.speed_protection_mode = ((isAutopilotEngaged &&
    (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn < b_x + 3.0) && (targetVS < -50.0)) || (isAutopilotEngaged &&
    (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn > AutopilotStateMachine_B.BusAssignment_g.data.VMAX_kn - 3.0)
    && (targetVS > 50.0)));
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.H_dot_fcu_fpm;
  AutopilotStateMachine_B.out.FPA_c_deg = AutopilotStateMachine_B.BusAssignment_g.input.FPA_fcu_deg;
  AutopilotStateMachine_B.out.mode_reversion = false;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_VS(void)
{
  if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
    AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
    AutopilotStateMachine_GS_CPT_entry();
  } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
    AutopilotStateMachine_FINAL_DES_entry();
  } else {
    real_T tmp;
    boolean_T tmp_0;
    tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft - AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
    tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
              AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
    if (tmp_0 && (tmp < -20.0)) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
      AutopilotStateMachine_OP_DES_entry();
    } else if (tmp_0 && (tmp > 20.0)) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
      AutopilotStateMachine_OP_CLB_entry();
    } else {
      tmp = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                     AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
      if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
          ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
        AutopilotStateMachine_CLB_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
                 ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
        AutopilotStateMachine_DES_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
        AutopilotStateMachine_ALT_CPT_entry();
      } else if ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                  AutopilotStateMachine_B.BusAssignment_g.input.ALT_push) &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT;
        AutopilotStateMachine_ALT_entry();
      } else {
        AutopilotStateMachine_VS_during();
      }
    }
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ALT_during(void)
{
  int32_T numberofAutopilotsEngaged;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  numberofAutopilotsEngaged = 0;
  if (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 != 0.0) {
    numberofAutopilotsEngaged = 1;
  }

  if (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 != 0.0) {
    numberofAutopilotsEngaged++;
  }

  if (!AutopilotStateMachine_DWork.prevNumberofAutopilotsEngaged_not_empty) {
    AutopilotStateMachine_DWork.prevNumberofAutopilotsEngaged = numberofAutopilotsEngaged;
    AutopilotStateMachine_DWork.prevNumberofAutopilotsEngaged_not_empty = true;
  }

  if (AutopilotStateMachine_DWork.verticalSpeedCancelMode && (std::abs
       (AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min) <= 50.0)) {
    AutopilotStateMachine_DWork.verticalSpeedCancelMode = false;
    AutopilotStateMachine_B.out.law = vertical_law_ALT_HOLD;
  }

  if ((AutopilotStateMachine_DWork.prevNumberofAutopilotsEngaged == 0.0) && (numberofAutopilotsEngaged == 1) && (std::
       abs(AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
           AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 250.0)) {
    AutopilotStateMachine_DWork.verticalSpeedCancelMode = true;
  } else {
    AutopilotStateMachine_DWork.verticalSpeedCancelMode = (AutopilotStateMachine_B.BusAssignment_g.input.Slew_trigger ||
      AutopilotStateMachine_DWork.verticalSpeedCancelMode);
  }

  if (AutopilotStateMachine_DWork.verticalSpeedCancelMode) {
    AutopilotStateMachine_B.out.law = vertical_law_VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
  }

  AutopilotStateMachine_B.out.ALT_cruise_mode_active = (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft -
    AutopilotStateMachine_B.BusAssignment_g.data.cruise_altitude) < 60.0);
  AutopilotStateMachine_B.out.ALT_soft_mode_active = AutopilotStateMachine_B.BusAssignment_g.data_computed.ALT_soft_mode;
  AutopilotStateMachine_DWork.prevNumberofAutopilotsEngaged = numberofAutopilotsEngaged;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ALT_exit(void)
{
  AutopilotStateMachine_B.out.ALT_cruise_mode_active = false;
  AutopilotStateMachine_B.out.ALT_soft_mode_active = false;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ALT_CST_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_ALT_CST;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  AutopilotStateMachine_B.out.law = vertical_law_ALT_HOLD;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ALT(void)
{
  if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
    AutopilotStateMachine_ALT_exit();
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
    AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
    AutopilotStateMachine_GS_CPT_entry();
  } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
    AutopilotStateMachine_ALT_exit();
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
    AutopilotStateMachine_FINAL_DES_entry();
  } else {
    real_T tmp;
    boolean_T tmp_0;
    tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft - AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
    tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
              AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
    if (tmp_0 && (tmp < -20.0)) {
      AutopilotStateMachine_ALT_exit();
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
      AutopilotStateMachine_OP_DES_entry();
    } else if (tmp_0 && (tmp > 20.0)) {
      AutopilotStateMachine_ALT_exit();
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
      AutopilotStateMachine_OP_CLB_entry();
    } else {
      tmp = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                     AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
      if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
          ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
        AutopilotStateMachine_ALT_exit();
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
        AutopilotStateMachine_CLB_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
                 ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
        AutopilotStateMachine_ALT_exit();
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
        AutopilotStateMachine_DES_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT) {
        AutopilotStateMachine_ALT_exit();
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
        AutopilotStateMachine_ALT_CPT_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
                 AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
        AutopilotStateMachine_ALT_exit();
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
        AutopilotStateMachine_VS_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                 (AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft != 0.0) && (tmp < 50.0)) {
        AutopilotStateMachine_DWork.local_H_constraint_ft =
          AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
        AutopilotStateMachine_ALT_exit();
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CST;
        AutopilotStateMachine_ALT_CST_entry();
      } else {
        AutopilotStateMachine_ALT_during();
      }
    }
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ALT_CPT_during(void)
{
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ALT_CST(void)
{
  if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
    AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
    AutopilotStateMachine_GS_CPT_entry();
  } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
    AutopilotStateMachine_FINAL_DES_entry();
  } else {
    real_T tmp;
    boolean_T guard1{ false };

    boolean_T guard2{ false };

    boolean_T guard3{ false };

    boolean_T guard4{ false };

    guard1 = false;
    guard2 = false;
    guard3 = false;
    guard4 = false;
    if ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) ||
        (AutopilotStateMachine_DWork.local_H_constraint_ft !=
         AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft)) {
      if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
        AutopilotStateMachine_CLB_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
        AutopilotStateMachine_DES_entry();
      } else {
        guard4 = true;
      }
    } else {
      guard4 = true;
    }

    if (guard4) {
      if ((!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB) &&
          (!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES)) {
        tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
          AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
        if (tmp > 20.0) {
          guard1 = true;
        } else if (tmp < -20.0) {
          guard2 = true;
        } else {
          guard3 = true;
        }
      } else {
        guard3 = true;
      }
    }

    if (guard3) {
      if (((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) ||
           (AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft ==
            AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft)) &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT;
        AutopilotStateMachine_ALT_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
                 AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
        AutopilotStateMachine_VS_entry();
      } else {
        boolean_T tmp_0;
        tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
          AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
        tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                  AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
        if (tmp_0 && (tmp < -20.0)) {
          guard2 = true;
        } else if (tmp_0 && (tmp > 20.0)) {
          guard1 = true;
        }
      }
    }

    if (guard2) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
      AutopilotStateMachine_OP_DES_entry();
    }

    if (guard1) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
      AutopilotStateMachine_OP_CLB_entry();
    }
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ALT_CST_CPT(void)
{
  if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CST;
    AutopilotStateMachine_ALT_CST_entry();
  } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
    AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
    AutopilotStateMachine_GS_CPT_entry();
  } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
    AutopilotStateMachine_FINAL_DES_entry();
  } else {
    real_T tmp_0;
    boolean_T guard1{ false };

    boolean_T guard2{ false };

    boolean_T guard3{ false };

    boolean_T guard4{ false };

    boolean_T guard5{ false };

    boolean_T guard6{ false };

    boolean_T tmp_1;
    tmp_0 = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
      AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
    tmp_1 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
              AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
    guard1 = false;
    guard2 = false;
    guard3 = false;
    guard4 = false;
    guard5 = false;
    guard6 = false;
    if (tmp_1 && (tmp_0 < -20.0)) {
      guard1 = true;
    } else if (tmp_1 && (tmp_0 > 20.0)) {
      guard2 = true;
    } else {
      real_T tmp;
      tmp = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                     AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
      if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
          ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
        guard3 = true;
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
                 ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
        guard4 = true;
      } else if ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) ||
                 (AutopilotStateMachine_DWork.local_H_constraint_ft !=
                  AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft)) {
        if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB &&
            AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB) {
          guard3 = true;
        } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.DES &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES) {
          guard4 = true;
        } else {
          guard6 = true;
        }
      } else {
        guard6 = true;
      }
    }

    if (guard6) {
      if ((!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB) &&
          (!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES)) {
        if (tmp_0 > 20.0) {
          guard2 = true;
        } else if (tmp_0 < -20.0) {
          guard1 = true;
        } else {
          guard5 = true;
        }
      } else {
        guard5 = true;
      }
    }

    if (guard5) {
      if ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) ||
          ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft ==
            AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft) &&
           (AutopilotStateMachine_DWork.local_H_constraint_ft ==
            AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft))) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
        AutopilotStateMachine_ALT_CPT_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
                 AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
        AutopilotStateMachine_VS_entry();
      }
    }

    if (guard4) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
      AutopilotStateMachine_DES_entry();
    }

    if (guard3) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
      AutopilotStateMachine_CLB_entry();
    }

    if (guard2) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
      AutopilotStateMachine_OP_CLB_entry();
    }

    if (guard1) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
      AutopilotStateMachine_OP_DES_entry();
    }
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_CLB_during(void)
{
  real_T targetAltitude;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
    targetAltitude = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
  } else {
    targetAltitude = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  }

  if (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft - targetAltitude) > 1200.0) {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_CLB;
    AutopilotStateMachine_B.out.law = vertical_law_SPD_MACH;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ALT_CST_CPT_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_ALT_CST_CPT;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  AutopilotStateMachine_B.out.law = vertical_law_ALT_ACQ;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_DES_during(void)
{
  real_T targetAltitude;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
    targetAltitude = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
  } else {
    targetAltitude = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  }

  switch (AutopilotStateMachine_B.BusAssignment_g.input.FM_requested_vertical_mode) {
   case fm_requested_vertical_mode_NONE:
    AutopilotStateMachine_B.out.H_c_ft = targetAltitude;
    if (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft - targetAltitude) > 1200.0) {
      AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_IDLE;
      AutopilotStateMachine_B.out.law = vertical_law_SPD_MACH;
      AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
    }
    break;

   case fm_requested_vertical_mode_SPEED_THRUST:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law_SPD_MACH;
    break;

   case fm_requested_vertical_mode_VPATH_SPEED:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
    AutopilotStateMachine_B.out.law = vertical_law_VPATH;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   case fm_requested_vertical_mode_FPA_SPEED:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
    AutopilotStateMachine_B.out.law = vertical_law_FPA;
    AutopilotStateMachine_B.out.FPA_c_deg = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   case fm_requested_vertical_mode_VS_SPEED:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
    AutopilotStateMachine_B.out.law = vertical_law_VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   default:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law_VPATH;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_DES(void)
{
  if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST_CPT) {
    AutopilotStateMachine_DWork.local_H_constraint_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CST_CPT;
    AutopilotStateMachine_ALT_CST_CPT_entry();
  } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
    AutopilotStateMachine_ALT_CPT_entry();
  } else {
    boolean_T guard1{ false };

    guard1 = false;
    if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push || AutopilotStateMachine_B.BusAssignment_g.input.VS_pull)
    {
      guard1 = true;
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
      AutopilotStateMachine_GS_CPT_entry();
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
      AutopilotStateMachine_FINAL_DES_entry();
    } else {
      real_T tmp;
      tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
        AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
      if ((!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES) ||
          ((AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft >
            AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) && (std::abs(tmp) > 20.0))) {
        AutopilotStateMachine_B.out.mode_reversion = true;
        AutopilotStateMachine_B.out.mode_reversion_target_fpm =
          AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
        guard1 = true;
      } else {
        boolean_T tmp_0;
        tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                  AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
        if (tmp_0 && (tmp < -20.0)) {
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
          AutopilotStateMachine_OP_DES_entry();
        } else if (tmp_0 && (tmp > 20.0)) {
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
          AutopilotStateMachine_OP_CLB_entry();
        } else {
          AutopilotStateMachine_DES_during();
        }
      }
    }

    if (guard1) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
      AutopilotStateMachine_VS_entry();
    }
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_FINAL_DES_during(void)
{
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  AutopilotStateMachine_B.out.law = vertical_law_VPATH;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
  AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_FLARE_during(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_FLARE;
  AutopilotStateMachine_B.out.law = vertical_law_FLARE;
  if ((AutopilotStateMachine_B.BusAssignment_g.data.H_radio_ft <= 40.0) &&
      ((AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 != 0.0) ||
       (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 != 0.0))) {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_RETARD;
  } else {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ROLL_OUT_entry_m(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_ROLL_OUT;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_IDLE;
  AutopilotStateMachine_B.out.law = vertical_law_FLARE;
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_GS_TO_X(void) const
{
  return AutopilotStateMachine_B.BusAssignment_g.input.LOC_push ||
    AutopilotStateMachine_B.BusAssignment_g.input.APPR_push || AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
    AutopilotStateMachine_B.BusAssignment_g.input.VS_pull ||
    ((AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode_LOC_CPT) &&
     (AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode_LOC_TRACK) &&
     (AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode_LAND));
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_GS_TO_X_MR(void) const
{
  return AutopilotStateMachine_B.BusAssignment_g.input.LOC_push ||
    AutopilotStateMachine_B.BusAssignment_g.input.APPR_push ||
    ((AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode_LOC_CPT) &&
     (AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode_LOC_TRACK) &&
     (AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode_LAND));
}

boolean_T AutopilotStateMachineModelClass::AutopilotStateMachine_GS_TO_ALT(void) const
{
  return AutopilotStateMachine_B.BusAssignment_g.input.ALT_push ||
    AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_GS_TRACK_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_GS_TRACK;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  AutopilotStateMachine_B.out.law = vertical_law_GS;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_LAND_entry_p(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_LAND;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
  AutopilotStateMachine_B.out.law = vertical_law_GS;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_FLARE_entry_e(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode_FLARE;
  AutopilotStateMachine_B.out.law = vertical_law_FLARE;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_SPEED;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_GS(void)
{
  real_T tmp;
  boolean_T guard1{ false };

  boolean_T guard2{ false };

  boolean_T tmp_0;
  guard1 = false;
  guard2 = false;
  switch (AutopilotStateMachine_DWork.is_GS) {
   case AutopilotStateMachine_IN_FLARE:
    if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ROLL_OUT) {
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_ROLL_OUT;
      AutopilotStateMachine_ROLL_OUT_entry_m();
    } else {
      AutopilotStateMachine_FLARE_during();
    }
    break;

   case AutopilotStateMachine_IN_GS_CPT:
    if (AutopilotStateMachine_GS_TO_X()) {
      AutopilotStateMachine_B.out.mode_reversion = AutopilotStateMachine_GS_TO_X_MR();
      AutopilotStateMachine_B.out.mode_reversion_target_fpm = AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
      if (AutopilotStateMachine_B.BusAssignment_g.data.on_ground == 0.0) {
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
        AutopilotStateMachine_VS_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.data.on_ground != 0.0) {
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_m;
        AutopilotStateMachine_OFF_entry_p();
      } else {
        guard1 = true;
      }
    } else {
      guard1 = true;
    }
    break;

   case AutopilotStateMachine_IN_GS_TRACK:
    if (AutopilotStateMachine_GS_TO_ALT()) {
      if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
        AutopilotStateMachine_GS_CPT_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
        AutopilotStateMachine_FINAL_DES_entry();
      } else {
        tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
          AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
        tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                  AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
        if (tmp_0 && (tmp < -20.0)) {
          AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
          AutopilotStateMachine_OP_DES_entry();
        } else if (tmp_0 && (tmp > 20.0)) {
          AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
          AutopilotStateMachine_OP_CLB_entry();
        } else {
          tmp = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                         AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
          if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
              AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
              AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
              ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
            AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
            AutopilotStateMachine_CLB_entry();
          } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
                     ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
            AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
            AutopilotStateMachine_DES_entry();
          } else {
            guard2 = true;
          }
        }
      }
    } else {
      guard2 = true;
    }
    break;

   case AutopilotStateMachine_IN_LAND_k:
    if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FLARE) {
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_FLARE;
      AutopilotStateMachine_FLARE_entry_e();
    }
    break;

   default:
    if (!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ROLL_OUT) {
      if (AutopilotStateMachine_B.BusAssignment_g.data.on_ground == 0.0) {
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
        AutopilotStateMachine_VS_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.data.on_ground != 0.0) {
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_m;
        AutopilotStateMachine_OFF_entry_p();
      }
    }
    break;
  }

  if (guard2) {
    if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.LAND) {
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_LAND_k;
      AutopilotStateMachine_LAND_entry_p();
    } else if (AutopilotStateMachine_GS_TO_X()) {
      AutopilotStateMachine_B.out.mode_reversion = AutopilotStateMachine_GS_TO_X_MR();
      AutopilotStateMachine_B.out.mode_reversion_target_fpm = AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
      if (AutopilotStateMachine_B.BusAssignment_g.data.on_ground == 0.0) {
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
        AutopilotStateMachine_VS_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.data.on_ground != 0.0) {
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_m;
        AutopilotStateMachine_OFF_entry_p();
      }
    }
  }

  if (guard1) {
    if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_TRACK) {
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_TRACK;
      AutopilotStateMachine_GS_TRACK_entry();
    } else if (AutopilotStateMachine_GS_TO_ALT()) {
      if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
        AutopilotStateMachine_GS_CPT_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
        AutopilotStateMachine_FINAL_DES_entry();
      } else {
        tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
          AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
        tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                  AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
        if (tmp_0 && (tmp < -20.0)) {
          AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
          AutopilotStateMachine_OP_DES_entry();
        } else if (tmp_0 && (tmp > 20.0)) {
          AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
          AutopilotStateMachine_OP_CLB_entry();
        } else {
          tmp = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                         AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
          if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
              AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
              AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
              ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
            AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
            AutopilotStateMachine_CLB_entry();
          } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
                     ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
            AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
            AutopilotStateMachine_DES_entry();
          }
        }
      }
    }
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_OP_CLB_during(void)
{
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft -
               AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft) > 1200.0) {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_CLB;
    AutopilotStateMachine_B.out.law = vertical_law_SPD_MACH;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
  }

  if (AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) {
    AutopilotStateMachine_B.out.EXPED_mode_active =
      !AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.EXPED_mode_active;
  } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull) {
    AutopilotStateMachine_B.out.EXPED_mode_active = false;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_OP_CLB_exit(void)
{
  AutopilotStateMachine_B.out.EXPED_mode_active = false;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_OP_CLB(void)
{
  boolean_T guard1{ false };

  guard1 = false;
  if ((AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft < AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) &&
      (std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
                AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 20.0)) {
    AutopilotStateMachine_B.out.mode_reversion = true;
    AutopilotStateMachine_B.out.mode_reversion_target_fpm = AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
    guard1 = true;
  } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT) {
    AutopilotStateMachine_OP_CLB_exit();
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
    AutopilotStateMachine_ALT_CPT_entry();
  } else if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
             AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
    guard1 = true;
  } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
    AutopilotStateMachine_OP_CLB_exit();
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
    AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
    AutopilotStateMachine_GS_CPT_entry();
  } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
    AutopilotStateMachine_OP_CLB_exit();
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
    AutopilotStateMachine_FINAL_DES_entry();
  } else {
    real_T tmp;
    tmp = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                   AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
    if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
        AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
        AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
        ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
      AutopilotStateMachine_OP_CLB_exit();
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
      AutopilotStateMachine_CLB_entry();
    } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
               ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
      AutopilotStateMachine_OP_CLB_exit();
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
      AutopilotStateMachine_DES_entry();
    } else {
      AutopilotStateMachine_OP_CLB_during();
    }
  }

  if (guard1) {
    AutopilotStateMachine_OP_CLB_exit();
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
    AutopilotStateMachine_VS_entry();
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_OP_DES_during(void)
{
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft -
               AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft) > 1200.0) {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law_SPD_MACH;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
  }

  if (AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) {
    AutopilotStateMachine_B.out.EXPED_mode_active =
      !AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.EXPED_mode_active;
  } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull) {
    AutopilotStateMachine_B.out.EXPED_mode_active = false;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_OP_DES(void)
{
  if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT) {
    AutopilotStateMachine_OP_CLB_exit();
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
    AutopilotStateMachine_ALT_CPT_entry();
  } else {
    boolean_T guard1{ false };

    guard1 = false;
    if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push || AutopilotStateMachine_B.BusAssignment_g.input.VS_pull)
    {
      guard1 = true;
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
      AutopilotStateMachine_OP_CLB_exit();
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
      AutopilotStateMachine_GS_CPT_entry();
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
      AutopilotStateMachine_OP_CLB_exit();
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
      AutopilotStateMachine_FINAL_DES_entry();
    } else if ((AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft >
                AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) && (std::abs
                (AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
                 AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 20.0)) {
      AutopilotStateMachine_B.out.mode_reversion = true;
      AutopilotStateMachine_B.out.mode_reversion_target_fpm = AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
      guard1 = true;
    } else {
      real_T tmp;
      tmp = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                     AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
      if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
          ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
        AutopilotStateMachine_OP_CLB_exit();
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
        AutopilotStateMachine_CLB_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
                 ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
        AutopilotStateMachine_OP_CLB_exit();
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
        AutopilotStateMachine_DES_entry();
      } else {
        AutopilotStateMachine_OP_DES_during();
      }
    }

    if (guard1) {
      AutopilotStateMachine_OP_CLB_exit();
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
      AutopilotStateMachine_VS_entry();
    }
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_SRS_during(void)
{
  boolean_T allEnginesOperative;
  allEnginesOperative = (AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_1 &&
    AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_2);
  if (!AutopilotStateMachine_DWork.wereAllEnginesOperative_not_empty) {
    AutopilotStateMachine_DWork.wereAllEnginesOperative = allEnginesOperative;
    AutopilotStateMachine_DWork.wereAllEnginesOperative_not_empty = true;
  }

  if (AutopilotStateMachine_DWork.wereAllEnginesOperative && (!allEnginesOperative)) {
    AutopilotStateMachine_B.out.V_c_kn = std::fmin(AutopilotStateMachine_B.BusAssignment_g.data.V2_kn + 15.0, std::fmax
      (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn, AutopilotStateMachine_B.BusAssignment_g.data.V2_kn));
  }

  AutopilotStateMachine_DWork.wereAllEnginesOperative = allEnginesOperative;
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_SRS(void)
{
  boolean_T guard1{ false };

  boolean_T guard2{ false };

  boolean_T guard3{ false };

  boolean_T guard4{ false };

  guard1 = false;
  guard2 = false;
  guard3 = false;
  guard4 = false;
  if (AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_1 &&
      AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_2) {
    if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB &&
        AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB) {
      guard1 = true;
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.DES &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES) {
      guard2 = true;
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
      AutopilotStateMachine_ALT_CPT_entry();
    } else {
      guard4 = true;
    }
  } else {
    guard4 = true;
  }

  if (guard4) {
    if ((AutopilotStateMachine_B.BusAssignment_g.data.on_ground != 0.0) &&
        (!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.SRS)) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_m;
      AutopilotStateMachine_OFF_entry_p();
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
      AutopilotStateMachine_GS_CPT_entry();
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
      AutopilotStateMachine_FINAL_DES_entry();
    } else {
      real_T tmp;
      boolean_T tmp_0;
      tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
        AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
      tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
      if (tmp_0 && (tmp < -20.0)) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
        AutopilotStateMachine_OP_DES_entry();
      } else if (tmp_0 && (tmp > 20.0)) {
        guard3 = true;
      } else {
        tmp = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                       AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
        if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
            AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
            AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
            ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
          guard1 = true;
        } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
                   ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp > 20.0))) {
          guard2 = true;
        } else if ((AutopilotStateMachine_B.BusAssignment_g.data_computed.V_fcu_in_selection &&
                    (AutopilotStateMachine_B.BusAssignment_g.data.on_ground == 0.0)) ||
                   ((!AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB) &&
                    (AutopilotStateMachine_B.BusAssignment_g.data.flight_phase == 2.0) &&
                    AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_1 &&
                    AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_2)) {
          guard3 = true;
        } else if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
                   AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
          AutopilotStateMachine_VS_entry();
        } else {
          AutopilotStateMachine_SRS_during();
        }
      }
    }
  }

  if (guard3) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
    AutopilotStateMachine_OP_CLB_entry();
  }

  if (guard2) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
    AutopilotStateMachine_DES_entry();
  }

  if (guard1) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
    AutopilotStateMachine_CLB_entry();
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_exit_internal_ON(void)
{
  switch (AutopilotStateMachine_DWork.is_ON) {
   case AutopilotStateMachine_IN_ALT:
    AutopilotStateMachine_ALT_exit();
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    break;

   case AutopilotStateMachine_IN_OP_CLB:
    AutopilotStateMachine_OP_CLB_exit();
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    break;

   case AutopilotStateMachine_IN_OP_DES:
    AutopilotStateMachine_OP_CLB_exit();
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    break;

   default:
    AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    break;
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_ON_l(void)
{
  if (AutopilotStateMachine_X_TO_SRS_GA()) {
    AutopilotStateMachine_exit_internal_ON();
    AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_SRS_GA;
    AutopilotStateMachine_SRS_GA_entry();
  } else {
    real_T tmp;
    boolean_T guard1{ false };

    boolean_T guard2{ false };

    boolean_T guard3{ false };

    boolean_T guard4{ false };

    boolean_T guard5{ false };

    boolean_T guard6{ false };

    boolean_T tmp_0;
    guard1 = false;
    guard2 = false;
    guard3 = false;
    guard4 = false;
    guard5 = false;
    guard6 = false;
    if ((AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 == 0.0) &&
        (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0) &&
        (((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode_OP_CLB) &&
          (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn >= AutopilotStateMachine_B.BusAssignment_g.data.VMAX_kn
           + 4.0)) || ((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode_OP_DES) &&
                       (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn <=
                        AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn - 2.0)))) {
      AutopilotStateMachine_B.out.FD_disconnect = true;
      guard6 = true;
    } else if (AutopilotStateMachine_X_TO_TCAS()) {
      AutopilotStateMachine_X_TO_TCAS_Action();
      AutopilotStateMachine_exit_internal_ON();
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_TCAS;
      AutopilotStateMachine_TCAS_entry();
    } else if (((!AutopilotStateMachine_B.BusAssignment_g.input.FD_active) &&
                (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 == 0.0) &&
                (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0)) ||
               ((AutopilotStateMachine_B.BusAssignment_g.data.flight_phase == 7.0) &&
                (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 == 0.0) &&
                (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0)) ||
               ((AutopilotStateMachine_B.BusAssignment_g.data.flight_phase == 0.0) &&
                (AutopilotStateMachine_B.BusAssignment_g.data.throttle_lever_1_pos == 0.0) &&
                (AutopilotStateMachine_B.BusAssignment_g.data.throttle_lever_2_pos == 0.0))) {
      guard6 = true;
    } else {
      switch (AutopilotStateMachine_DWork.is_ON) {
       case AutopilotStateMachine_IN_ALT:
        AutopilotStateMachine_ALT();
        break;

       case AutopilotStateMachine_IN_ALT_CPT:
        if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT) {
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT;
          AutopilotStateMachine_ALT_entry();
        } else if ((std::abs(AutopilotStateMachine_DWork.local_H_fcu_ft -
                             AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft) > 250.0) ||
                   AutopilotStateMachine_B.BusAssignment_g.input.Slew_trigger) {
          AutopilotStateMachine_B.out.mode_reversion = true;
          AutopilotStateMachine_B.out.mode_reversion_target_fpm =
            AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
          guard1 = true;
        } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
          AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
          AutopilotStateMachine_GS_CPT_entry();
        } else if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
                   AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
          guard1 = true;
        } else {
          AutopilotStateMachine_ALT_CPT_during();
        }
        break;

       case AutopilotStateMachine_IN_ALT_CST:
        AutopilotStateMachine_ALT_CST();
        break;

       case AutopilotStateMachine_IN_ALT_CST_CPT:
        AutopilotStateMachine_ALT_CST_CPT();
        break;

       case AutopilotStateMachine_IN_CLB:
        if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST_CPT) {
          AutopilotStateMachine_DWork.local_H_constraint_ft =
            AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CST_CPT;
          AutopilotStateMachine_ALT_CST_CPT_entry();
        } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT) {
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
          AutopilotStateMachine_ALT_CPT_entry();
        } else if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
                   AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
          guard2 = true;
        } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
          AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
          AutopilotStateMachine_GS_CPT_entry();
        } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
          AutopilotStateMachine_FINAL_DES_entry();
        } else {
          tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
            AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
          tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                    AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
          if (tmp_0 && (tmp < -20.0)) {
            guard3 = true;
          } else if (tmp_0 && (tmp > 20.0)) {
            guard4 = true;
          } else if ((AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft <
                      AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) && (std::abs(tmp) > 20.0)) {
            AutopilotStateMachine_B.out.mode_reversion = true;
            AutopilotStateMachine_B.out.mode_reversion_target_fpm =
              AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
            guard2 = true;
          } else if ((!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB) && (tmp > 20.0)) {
            AutopilotStateMachine_B.out.mode_reversion = true;
            AutopilotStateMachine_B.out.mode_reversion_target_fpm =
              AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
            if (tmp > 20.0) {
              guard4 = true;
            } else if (tmp < -20.0) {
              guard3 = true;
            } else {
              AutopilotStateMachine_CLB_during();
            }
          } else {
            AutopilotStateMachine_CLB_during();
          }
        }
        break;

       case AutopilotStateMachine_IN_DES:
        AutopilotStateMachine_DES();
        break;

       case AutopilotStateMachine_IN_FINAL_DES:
        if ((!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) ||
            AutopilotStateMachine_B.BusAssignment_g.input.APPR_push ||
            AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
            AutopilotStateMachine_B.BusAssignment_g.input.VS_pull ||
            AutopilotStateMachine_B.BusAssignment_g.input.HDG_pull ||
            AutopilotStateMachine_B.BusAssignment_g.input.LOC_push) {
          if (AutopilotStateMachine_B.BusAssignment_g.data.on_ground == 0.0) {
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
            AutopilotStateMachine_VS_entry();
          } else if (AutopilotStateMachine_B.BusAssignment_g.data.on_ground != 0.0) {
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_m;
            AutopilotStateMachine_OFF_entry_p();
          } else {
            guard5 = true;
          }
        } else {
          guard5 = true;
        }
        break;

       case AutopilotStateMachine_IN_GS:
        AutopilotStateMachine_GS();
        break;

       case AutopilotStateMachine_IN_OP_CLB:
        AutopilotStateMachine_OP_CLB();
        break;

       case AutopilotStateMachine_IN_OP_DES:
        AutopilotStateMachine_OP_DES();
        break;

       case AutopilotStateMachine_IN_SRS:
        AutopilotStateMachine_SRS();
        break;

       default:
        AutopilotStateMachine_VS();
        break;
      }
    }

    if (guard6) {
      AutopilotStateMachine_exit_internal_ON();
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_m;
      AutopilotStateMachine_OFF_entry_p();
    }

    if (guard5) {
      tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
        AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
      tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
      if (tmp_0 && (tmp < -20.0)) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
        AutopilotStateMachine_OP_DES_entry();
      } else if (tmp_0 && (tmp > 20.0)) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
        AutopilotStateMachine_OP_CLB_entry();
      } else {
        AutopilotStateMachine_FINAL_DES_during();
      }
    }

    if (guard4) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
      AutopilotStateMachine_OP_CLB_entry();
    }

    if (guard3) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
      AutopilotStateMachine_OP_DES_entry();
    }

    if (guard2) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
      AutopilotStateMachine_VS_entry();
    }

    if (guard1) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
      AutopilotStateMachine_VS_entry();
    }
  }
}

void AutopilotStateMachineModelClass::AutopilotStateMachine_SRS_GA_during(void)
{
  boolean_T allEnginesOperative;
  AutopilotStateMachine_B.out.FD_connect = false;
  allEnginesOperative = (AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_1 &&
    AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_2);
  if (!AutopilotStateMachine_DWork.wereAllEnginesOperative_not_empty_g) {
    AutopilotStateMachine_DWork.wereAllEnginesOperative_h = allEnginesOperative;
    AutopilotStateMachine_DWork.wereAllEnginesOperative_not_empty_g = true;
  }

  if (AutopilotStateMachine_DWork.wereAllEnginesOperative_h && (!allEnginesOperative)) {
    AutopilotStateMachine_B.out.V_c_kn = std::fmin(AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn + 15.0, std::fmax
      (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn, AutopilotStateMachine_B.BusAssignment_g.data.VAPP_kn));
  }

  AutopilotStateMachine_DWork.wereAllEnginesOperative_h = allEnginesOperative;
}

void AutopilotStateMachineModelClass::step()
{
  static const real_T c[24]{ -3.7631613045100394E-12, -3.7631613045100418E-12, 6.2076488130688133E-12,
    2.3375903616618146E-12, -2.9675180723323623E-12, -2.9675180723323619E-12, 2.2735910872868498E-8,
    1.1446426959338374E-8, -1.4891939010927404E-8, -2.4704337359767112E-9, 1.1555108433994175E-8, -6.25E-9,
    -1.897274956835846E-5, 1.520958826384842E-5, 7.1712086474912069E-6, -4.4094939746938354E-6, 1.3759855421341094E-5,
    2.4370072289329445E-5, 0.05, 0.05, 0.1, 0.1, 0.1, 0.15 };

  static const int16_T b[7]{ 0, 1000, 3333, 4000, 6000, 8000, 10000 };

  uint64m_T tmp;
  uint64m_T tmp_0;
  uint64m_T tmp_1;
  uint64m_T tmp_2;
  uint64m_T tmp_3;
  uint64m_T tmp_4;
  uint64m_T tmp_5;
  uint64m_T tmp_6;
  uint64m_T tmp_7;
  uint64m_T tmp_8;
  real_T result_tmp[9];
  real_T result[3];
  real_T result_0[3];
  real_T L;
  real_T Phi2;
  real_T R;
  real_T a;
  real_T a_tmp;
  real_T a_tmp_0;
  real_T b_L;
  real_T b_R;
  real_T rtb_Divide_o;
  real_T rtb_GainTheta;
  real_T rtb_GainTheta1;
  real_T rtb_Saturation1;
  real_T rtb_dme;
  real_T xloc;
  real_T xloc_0;
  int32_T high_i;
  int32_T low_i;
  int32_T low_i_0;
  int32_T low_ip1;
  int32_T mid_i;
  int32_T rtb_on_ground;
  boolean_T conditionSoftAlt;
  boolean_T engageCondition;
  boolean_T guard1{ false };

  boolean_T isGoAroundModeActive;
  boolean_T rtb_AND;
  boolean_T rtb_AND_j;
  boolean_T rtb_BusAssignment1_data_altimeter_setting_changed;
  boolean_T rtb_BusAssignment1_input_LOC_push;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_APPR_push;
  boolean_T rtb_FixPtRelationalOperator;
  boolean_T rtb_Y_j;
  boolean_T rtb_cFLARE;
  boolean_T rtb_cGA;
  boolean_T rtb_cLAND;
  boolean_T sCLB_tmp;
  boolean_T sCLB_tmp_0;
  boolean_T speedTargetChanged;
  boolean_T state_e_tmp;
  boolean_T state_e_tmp_0;
  boolean_T state_i_tmp;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_a = (static_cast<int32_T>
    (AutopilotStateMachine_U.in.input.AP_ENGAGE_push) > static_cast<int32_T>
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_a));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_p = (static_cast<int32_T>(AutopilotStateMachine_U.in.input.AP_1_push) >
    static_cast<int32_T>(AutopilotStateMachine_DWork.DelayInput1_DSTATE_p));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_bo = (static_cast<int32_T>(AutopilotStateMachine_U.in.input.AP_2_push) >
    static_cast<int32_T>(AutopilotStateMachine_DWork.DelayInput1_DSTATE_bo));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_d = (static_cast<int32_T>
    (AutopilotStateMachine_U.in.input.AP_DISCONNECT_push) > static_cast<int32_T>
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_d));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_e = (static_cast<int32_T>(AutopilotStateMachine_U.in.input.HDG_push) >
    static_cast<int32_T>(AutopilotStateMachine_DWork.DelayInput1_DSTATE_e));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_g = (static_cast<int32_T>(AutopilotStateMachine_U.in.input.HDG_pull) >
    static_cast<int32_T>(AutopilotStateMachine_DWork.DelayInput1_DSTATE_g));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_f = (static_cast<int32_T>(AutopilotStateMachine_U.in.input.ALT_push) >
    static_cast<int32_T>(AutopilotStateMachine_DWork.DelayInput1_DSTATE_f));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ib = (static_cast<int32_T>(AutopilotStateMachine_U.in.input.ALT_pull) >
    static_cast<int32_T>(AutopilotStateMachine_DWork.DelayInput1_DSTATE_ib));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd = (static_cast<int32_T>(AutopilotStateMachine_U.in.input.VS_push) >
    static_cast<int32_T>(AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah = (static_cast<int32_T>(AutopilotStateMachine_U.in.input.VS_pull) >
    static_cast<int32_T>(AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn = (static_cast<int32_T>(AutopilotStateMachine_U.in.input.LOC_push) >
    static_cast<int32_T>(AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_h = (static_cast<int32_T>(AutopilotStateMachine_U.in.input.APPR_push) >
    static_cast<int32_T>(AutopilotStateMachine_DWork.DelayInput1_DSTATE_h));
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (static_cast<int32_T>(AutopilotStateMachine_U.in.input.EXPED_push) >
    static_cast<int32_T>(AutopilotStateMachine_DWork.DelayInput1_DSTATE_o));
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_APPR_push =
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_h;
  AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_o;
  rtb_GainTheta = AutopilotStateMachine_P.GainTheta_Gain * AutopilotStateMachine_U.in.data.Theta_deg;
  rtb_GainTheta1 = AutopilotStateMachine_P.GainTheta1_Gain * AutopilotStateMachine_U.in.data.Phi_deg;
  rtb_dme = 0.017453292519943295 * rtb_GainTheta;
  rtb_Saturation1 = 0.017453292519943295 * rtb_GainTheta1;
  rtb_Divide_o = std::tan(rtb_dme);
  L = std::sin(rtb_Saturation1);
  a_tmp = std::cos(rtb_Saturation1);
  result_tmp[0] = 1.0;
  result_tmp[3] = L * rtb_Divide_o;
  result_tmp[6] = a_tmp * rtb_Divide_o;
  result_tmp[1] = 0.0;
  result_tmp[4] = a_tmp;
  result_tmp[7] = -L;
  result_tmp[2] = 0.0;
  rtb_Saturation1 = std::cos(rtb_dme);
  rtb_Divide_o = 1.0 / rtb_Saturation1;
  result_tmp[5] = rtb_Divide_o * L;
  result_tmp[8] = rtb_Divide_o * a_tmp;
  Phi2 = AutopilotStateMachine_P.Gain_Gain_k * AutopilotStateMachine_U.in.data.p_rad_s *
    AutopilotStateMachine_P.Gainpk_Gain;
  a = AutopilotStateMachine_P.Gain_Gain * AutopilotStateMachine_U.in.data.q_rad_s * AutopilotStateMachine_P.Gainqk_Gain;
  rtb_Divide_o = AutopilotStateMachine_P.Gain_Gain_a * AutopilotStateMachine_U.in.data.r_rad_s;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result[rtb_on_ground] = (result_tmp[rtb_on_ground + 3] * a + result_tmp[rtb_on_ground] * Phi2) +
      result_tmp[rtb_on_ground + 6] * rtb_Divide_o;
  }

  Phi2 = std::sin(rtb_dme);
  result_tmp[0] = rtb_Saturation1;
  result_tmp[3] = 0.0;
  result_tmp[6] = -Phi2;
  result_tmp[1] = L * Phi2;
  result_tmp[4] = a_tmp;
  result_tmp[7] = rtb_Saturation1 * L;
  result_tmp[2] = a_tmp * Phi2;
  result_tmp[5] = 0.0 - L;
  result_tmp[8] = a_tmp * rtb_Saturation1;
  for (rtb_on_ground = 0; rtb_on_ground < 3; rtb_on_ground++) {
    result_0[rtb_on_ground] = (result_tmp[rtb_on_ground + 3] * AutopilotStateMachine_U.in.data.by_m_s2 +
      result_tmp[rtb_on_ground] * AutopilotStateMachine_U.in.data.bx_m_s2) + result_tmp[rtb_on_ground + 6] *
      AutopilotStateMachine_U.in.data.bz_m_s2;
  }

  if (AutopilotStateMachine_U.in.data.nav_dme_valid != 0.0) {
    AutopilotStateMachine_B.BusAssignment_g.data.nav_dme_nmi = AutopilotStateMachine_U.in.data.nav_dme_nmi;
  } else if (AutopilotStateMachine_U.in.data.nav_loc_valid) {
    L = std::sin((AutopilotStateMachine_U.in.data.nav_loc_position.lat -
                  AutopilotStateMachine_U.in.data.aircraft_position.lat) * 0.017453292519943295 / 2.0);
    a = std::sin((AutopilotStateMachine_U.in.data.nav_loc_position.lon -
                  AutopilotStateMachine_U.in.data.aircraft_position.lon) * 0.017453292519943295 / 2.0);
    a = std::cos(0.017453292519943295 * AutopilotStateMachine_U.in.data.aircraft_position.lat) * std::cos
      (0.017453292519943295 * AutopilotStateMachine_U.in.data.nav_loc_position.lat) * a * a + L * L;
    rtb_dme = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
    a = AutopilotStateMachine_U.in.data.aircraft_position.alt - AutopilotStateMachine_U.in.data.nav_loc_position.alt;
    AutopilotStateMachine_B.BusAssignment_g.data.nav_dme_nmi = std::sqrt(rtb_dme * rtb_dme + a * a) / 1852.0;
  } else {
    AutopilotStateMachine_B.BusAssignment_g.data.nav_dme_nmi = 0.0;
  }

  rtb_dme = 0.017453292519943295 * AutopilotStateMachine_U.in.data.aircraft_position.lat;
  Phi2 = 0.017453292519943295 * AutopilotStateMachine_U.in.data.nav_loc_position.lat;
  rtb_Saturation1 = 0.017453292519943295 * AutopilotStateMachine_U.in.data.aircraft_position.lon;
  L = std::sin((AutopilotStateMachine_U.in.data.nav_loc_position.lat -
                AutopilotStateMachine_U.in.data.aircraft_position.lat) * 0.017453292519943295 / 2.0);
  a = std::sin((AutopilotStateMachine_U.in.data.nav_loc_position.lon -
                AutopilotStateMachine_U.in.data.aircraft_position.lon) * 0.017453292519943295 / 2.0);
  a_tmp = std::cos(Phi2);
  a_tmp_0 = std::cos(rtb_dme);
  a = a_tmp_0 * a_tmp * a * a + L * L;
  a = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  rtb_Divide_o = AutopilotStateMachine_U.in.data.aircraft_position.alt -
    AutopilotStateMachine_U.in.data.nav_loc_position.alt;
  R = 0.017453292519943295 * AutopilotStateMachine_U.in.data.nav_loc_position.lon - rtb_Saturation1;
  b_L = mod_mvZvttxs((mod_mvZvttxs(mod_mvZvttxs(360.0) + 360.0) - (mod_mvZvttxs(mod_mvZvttxs
    (AutopilotStateMachine_U.in.data.nav_loc_magvar_deg) + 360.0) + 360.0)) + 360.0);
  b_R = mod_mvZvttxs(360.0 - b_L);
  if (std::abs(b_L) < std::abs(b_R)) {
    b_R = -b_L;
  }

  rtb_dme = std::sin(rtb_dme);
  L = mod_mvZvttxs(mod_mvZvttxs(mod_mvZvttxs(std::atan2(std::sin(R) * a_tmp, a_tmp_0 * std::sin(Phi2) - rtb_dme * a_tmp *
    std::cos(R)) * 57.295779513082323 + 360.0)) + 360.0) + 360.0;
  Phi2 = mod_mvZvttxs((mod_mvZvttxs(mod_mvZvttxs(mod_mvZvttxs(mod_mvZvttxs(AutopilotStateMachine_U.in.data.nav_loc_deg -
    b_R) + 360.0)) + 360.0) - L) + 360.0);
  b_R = mod_mvZvttxs(360.0 - Phi2);
  guard1 = false;
  if (std::abs(std::sqrt(a * a + rtb_Divide_o * rtb_Divide_o) / 1852.0) < 30.0) {
    L = mod_mvZvttxs((mod_mvZvttxs(mod_mvZvttxs(AutopilotStateMachine_U.in.data.nav_loc_deg) + 360.0) - L) + 360.0);
    R = mod_mvZvttxs(360.0 - L);
    if (std::abs(L) < std::abs(R)) {
      R = -L;
    }

    if ((std::abs(R) < 90.0) && ((AutopilotStateMachine_U.in.data.nav_loc_position.lat != 0.0) ||
         (AutopilotStateMachine_U.in.data.nav_loc_position.lon != 0.0) ||
         (AutopilotStateMachine_U.in.data.nav_loc_position.alt != 0.0))) {
      AutopilotStateMachine_B.BusAssignment_g.data.nav_e_loc_valid = true;
      if (std::abs(Phi2) < std::abs(b_R)) {
        AutopilotStateMachine_B.BusAssignment_g.data.nav_e_loc_error_deg = -Phi2;
      } else {
        AutopilotStateMachine_B.BusAssignment_g.data.nav_e_loc_error_deg = b_R;
      }
    } else {
      guard1 = true;
    }
  } else {
    guard1 = true;
  }

  if (guard1) {
    AutopilotStateMachine_B.BusAssignment_g.data.nav_e_loc_valid = false;
    AutopilotStateMachine_B.BusAssignment_g.data.nav_e_loc_error_deg = 0.0;
  }

  if (AutopilotStateMachine_U.in.data.nav_gs_valid || (!AutopilotStateMachine_DWork.nav_gs_deg_not_empty)) {
    AutopilotStateMachine_DWork.nav_gs_deg = AutopilotStateMachine_U.in.data.nav_gs_deg;
    AutopilotStateMachine_DWork.nav_gs_deg_not_empty = true;
  }

  Phi2 = 0.017453292519943295 * AutopilotStateMachine_U.in.data.nav_gs_position.lat;
  L = std::sin((AutopilotStateMachine_U.in.data.nav_gs_position.lat -
                AutopilotStateMachine_U.in.data.aircraft_position.lat) * 0.017453292519943295 / 2.0);
  a = std::sin((AutopilotStateMachine_U.in.data.nav_gs_position.lon -
                AutopilotStateMachine_U.in.data.aircraft_position.lon) * 0.017453292519943295 / 2.0);
  b_R = std::cos(Phi2);
  a = a_tmp_0 * b_R * a * a + L * L;
  a = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  rtb_Divide_o = AutopilotStateMachine_U.in.data.aircraft_position.alt -
    AutopilotStateMachine_U.in.data.nav_gs_position.alt;
  a = std::sqrt(a * a + rtb_Divide_o * rtb_Divide_o);
  rtb_Saturation1 = 0.017453292519943295 * AutopilotStateMachine_U.in.data.nav_gs_position.lon - rtb_Saturation1;
  rtb_Saturation1 = std::atan2(std::sin(rtb_Saturation1) * b_R, a_tmp_0 * std::sin(Phi2) - rtb_dme * b_R * std::cos
    (rtb_Saturation1)) * 57.295779513082323;
  if (rtb_Saturation1 + 360.0 == 0.0) {
    rtb_dme = 0.0;
  } else {
    rtb_dme = std::fmod(rtb_Saturation1 + 360.0, 360.0);
    if (rtb_dme == 0.0) {
      rtb_dme = 0.0;
    } else if (rtb_Saturation1 + 360.0 < 0.0) {
      rtb_dme += 360.0;
    }
  }

  guard1 = false;
  if (std::abs(a / 1852.0) < 30.0) {
    if (AutopilotStateMachine_U.in.data.nav_loc_deg == 0.0) {
      L = 0.0;
    } else {
      L = std::fmod(AutopilotStateMachine_U.in.data.nav_loc_deg, 360.0);
      if (L == 0.0) {
        L = 0.0;
      } else if (AutopilotStateMachine_U.in.data.nav_loc_deg < 0.0) {
        L += 360.0;
      }
    }

    if (rtb_dme == 0.0) {
      rtb_Saturation1 = 0.0;
    } else {
      rtb_Saturation1 = std::fmod(rtb_dme, 360.0);
      if (rtb_Saturation1 == 0.0) {
        rtb_Saturation1 = 0.0;
      } else if (rtb_dme < 0.0) {
        rtb_Saturation1 += 360.0;
      }
    }

    if (L + 360.0 == 0.0) {
      L = 0.0;
    } else {
      L = std::fmod(L + 360.0, 360.0);
    }

    if (rtb_Saturation1 + 360.0 == 0.0) {
      rtb_Saturation1 = 0.0;
    } else {
      rtb_Saturation1 = std::fmod(rtb_Saturation1 + 360.0, 360.0);
    }

    R = (L - (rtb_Saturation1 + 360.0)) + 360.0;
    if (R == 0.0) {
      L = 0.0;
    } else {
      L = std::fmod(R, 360.0);
      if (L == 0.0) {
        L = 0.0;
      } else if (R < 0.0) {
        L += 360.0;
      }
    }

    if (360.0 - L == 0.0) {
      R = 0.0;
    } else {
      R = std::fmod(360.0 - L, 360.0);
      if (R == 0.0) {
        R = 0.0;
      } else if (360.0 - L < 0.0) {
        R += 360.0;
      }
    }

    if (std::abs(L) < std::abs(R)) {
      R = -L;
    }

    if ((std::abs(R) < 90.0) && ((AutopilotStateMachine_U.in.data.nav_gs_position.lat != 0.0) ||
         (AutopilotStateMachine_U.in.data.nav_gs_position.lon != 0.0) ||
         (AutopilotStateMachine_U.in.data.nav_gs_position.alt != 0.0))) {
      AutopilotStateMachine_B.BusAssignment_g.data.nav_e_gs_valid = true;
      AutopilotStateMachine_B.BusAssignment_g.data.nav_e_gs_error_deg = std::asin(rtb_Divide_o / a) * 57.295779513082323
        - AutopilotStateMachine_DWork.nav_gs_deg;
    } else {
      guard1 = true;
    }
  } else {
    guard1 = true;
  }

  if (guard1) {
    AutopilotStateMachine_B.BusAssignment_g.data.nav_e_gs_valid = false;
    AutopilotStateMachine_B.BusAssignment_g.data.nav_e_gs_error_deg = 0.0;
  }

  rtb_dme = AutopilotStateMachine_P.Gain_Gain_af * AutopilotStateMachine_U.in.data.gear_strut_compression_1 -
    AutopilotStateMachine_P.Constant1_Value;
  if (rtb_dme > AutopilotStateMachine_P.Saturation_UpperSat) {
    rtb_dme = AutopilotStateMachine_P.Saturation_UpperSat;
  } else if (rtb_dme < AutopilotStateMachine_P.Saturation_LowerSat) {
    rtb_dme = AutopilotStateMachine_P.Saturation_LowerSat;
  }

  rtb_Saturation1 = AutopilotStateMachine_P.Gain1_Gain * AutopilotStateMachine_U.in.data.gear_strut_compression_2 -
    AutopilotStateMachine_P.Constant1_Value;
  if (rtb_Saturation1 > AutopilotStateMachine_P.Saturation1_UpperSat) {
    rtb_Saturation1 = AutopilotStateMachine_P.Saturation1_UpperSat;
  } else if (rtb_Saturation1 < AutopilotStateMachine_P.Saturation1_LowerSat) {
    rtb_Saturation1 = AutopilotStateMachine_P.Saturation1_LowerSat;
  }

  if (AutopilotStateMachine_DWork.is_active_c5_AutopilotStateMachine == 0U) {
    AutopilotStateMachine_DWork.is_active_c5_AutopilotStateMachine = 1U;
    AutopilotStateMachine_DWork.is_c5_AutopilotStateMachine = AutopilotStateMachine_IN_OnGround;
    rtb_on_ground = 1;
  } else if (AutopilotStateMachine_DWork.is_c5_AutopilotStateMachine == 1) {
    if ((rtb_dme > 0.05) || (rtb_Saturation1 > 0.05)) {
      AutopilotStateMachine_DWork.is_c5_AutopilotStateMachine = AutopilotStateMachine_IN_OnGround;
      rtb_on_ground = 1;
    } else {
      rtb_on_ground = 0;
    }
  } else if ((rtb_dme == 0.0) && (rtb_Saturation1 == 0.0)) {
    AutopilotStateMachine_DWork.is_c5_AutopilotStateMachine = AutopilotStateMachine_IN_InAir;
    rtb_on_ground = 0;
  } else {
    rtb_on_ground = 1;
  }

  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (AutopilotStateMachine_U.in.data.altimeter_setting_left_mbar !=
    AutopilotStateMachine_DWork.DelayInput1_DSTATE);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_DWork.DelayInput1_DSTATE_i;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_h = (AutopilotStateMachine_U.in.data.altimeter_setting_right_mbar !=
    AutopilotStateMachine_DWork.DelayInput1_DSTATE);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (AutopilotStateMachine_DWork.DelayInput1_DSTATE_o ||
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_h);
  rtb_BusAssignment1_data_altimeter_setting_changed = AutopilotStateMachine_DWork.DelayInput1_DSTATE_o;
  rtb_BusAssignment1_input_LOC_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn;
  if (!AutopilotStateMachine_DWork.eventTime_not_empty_l) {
    AutopilotStateMachine_DWork.eventTime_mz = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_l = true;
  }

  if ((rtb_on_ground == 0) || (AutopilotStateMachine_DWork.eventTime_mz == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_mz = AutopilotStateMachine_U.in.time.simulation_time;
  }

  Phi2 = AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_mz;
  if (!AutopilotStateMachine_DWork.eventTime_not_empty_a) {
    AutopilotStateMachine_DWork.eventTime_m = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_a = true;
  }

  if ((rtb_on_ground != 0) || (AutopilotStateMachine_DWork.eventTime_m == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_m = AutopilotStateMachine_U.in.time.simulation_time;
  }

  a = AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_m;
  if (!AutopilotStateMachine_DWork.eventTime_not_empty_p) {
    AutopilotStateMachine_DWork.eventTime_n = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_p = true;
  }

  if (((!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS)) &&
       (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS_GA))) ||
      (AutopilotStateMachine_DWork.eventTime_n == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_n = AutopilotStateMachine_U.in.time.simulation_time;
  }

  rtb_dme = AutopilotStateMachine_P.Constant_Value_j / AutopilotStateMachine_U.in.time.dt;
  if (rtb_dme < 1.0) {
    AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_U.in.input.H_fcu_ft;
  } else {
    if (rtb_dme > 100.0) {
      high_i = 100;
    } else {
      high_i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(rtb_dme), 4.294967296E+9)));
    }

    AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_DWork.Delay_DSTATE_d[100U - high_i];
  }

  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (AutopilotStateMachine_DWork.DelayInput1_DSTATE !=
    AutopilotStateMachine_U.in.input.H_fcu_ft);
  rtb_Y_j = ((AutopilotStateMachine_U.in.input.H_constraint_ft != 0.0) && (((AutopilotStateMachine_U.in.input.H_fcu_ft >
    AutopilotStateMachine_U.in.data.H_ind_ft) && (AutopilotStateMachine_U.in.input.H_constraint_ft >
    AutopilotStateMachine_U.in.data.H_ind_ft) && (AutopilotStateMachine_U.in.input.H_constraint_ft <
    AutopilotStateMachine_U.in.input.H_fcu_ft)) || ((AutopilotStateMachine_U.in.input.H_fcu_ft <
    AutopilotStateMachine_U.in.data.H_ind_ft) && (AutopilotStateMachine_U.in.input.H_constraint_ft <
    AutopilotStateMachine_U.in.data.H_ind_ft) && (AutopilotStateMachine_U.in.input.H_constraint_ft >
    AutopilotStateMachine_U.in.input.H_fcu_ft))));
  rtb_dme = AutopilotStateMachine_P.Constant_Value_jq / AutopilotStateMachine_U.in.time.dt;
  if (rtb_dme < 1.0) {
    AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_U.in.input.Psi_fcu_deg;
  } else {
    if (rtb_dme > 100.0) {
      high_i = 100;
    } else {
      high_i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(rtb_dme), 4.294967296E+9)));
    }

    AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_DWork.Delay_DSTATE_c[100U - high_i];
  }

  AutopilotStateMachine_DWork.DelayInput1_DSTATE_h = (AutopilotStateMachine_DWork.DelayInput1_DSTATE !=
    AutopilotStateMachine_U.in.input.Psi_fcu_deg);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn = (AutopilotStateMachine_U.in.input.Psi_fcu_deg !=
    AutopilotStateMachine_P.CompareToConstant_const);
  rtb_AND = (AutopilotStateMachine_DWork.DelayInput1_DSTATE_h && AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn);
  AutopilotStateMachine_LagFilter(AutopilotStateMachine_U.in.data.nav_gs_error_deg, AutopilotStateMachine_P.LagFilter_C1,
    AutopilotStateMachine_U.in.time.dt, &rtb_dme, &AutopilotStateMachine_DWork.sf_LagFilter_h);
  rtb_FixPtRelationalOperator = (rtb_dme < AutopilotStateMachine_DWork.DelayInput1_DSTATE_b);
  AutopilotStateMachine_WashoutFilter(AutopilotStateMachine_U.in.data.H_ft, AutopilotStateMachine_P.WashoutFilter_C1,
    AutopilotStateMachine_U.in.time.dt, &L, &AutopilotStateMachine_DWork.sf_WashoutFilter);
  if (AutopilotStateMachine_U.in.data.H_radio_ft > AutopilotStateMachine_P.Saturation_UpperSat_k) {
    rtb_Divide_o = AutopilotStateMachine_P.Saturation_UpperSat_k;
  } else if (AutopilotStateMachine_U.in.data.H_radio_ft < AutopilotStateMachine_P.Saturation_LowerSat_b) {
    rtb_Divide_o = AutopilotStateMachine_P.Saturation_LowerSat_b;
  } else {
    rtb_Divide_o = AutopilotStateMachine_U.in.data.H_radio_ft;
  }

  AutopilotStateMachine_LagFilter(rtb_Divide_o, AutopilotStateMachine_P.LagFilter_C1_n,
    AutopilotStateMachine_U.in.time.dt, &b_R, &AutopilotStateMachine_DWork.sf_LagFilter);
  rtb_Saturation1 = (L + b_R) * AutopilotStateMachine_P.DiscreteDerivativeVariableTs2_Gain;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE = rtb_Saturation1 - AutopilotStateMachine_DWork.Delay_DSTATE_l;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE /= AutopilotStateMachine_U.in.time.dt;
  AutopilotStateMachine_LagFilter(AutopilotStateMachine_P.Gain2_Gain_d * AutopilotStateMachine_DWork.DelayInput1_DSTATE,
    AutopilotStateMachine_P.LagFilter3_C1, AutopilotStateMachine_U.in.time.dt, &b_R,
    &AutopilotStateMachine_DWork.sf_LagFilter_d);
  AutopilotStateMachine_WashoutFilter(AutopilotStateMachine_U.in.data.H_dot_ft_min,
    AutopilotStateMachine_P.WashoutFilter1_C1, AutopilotStateMachine_U.in.time.dt, &L,
    &AutopilotStateMachine_DWork.sf_WashoutFilter_k);
  b_R += L;
  rtb_Divide_o = AutopilotStateMachine_P.Constant_Value_m / AutopilotStateMachine_U.in.time.dt;
  if (rtb_Divide_o < 1.0) {
    AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_U.in.input.V_fcu_kn;
  } else {
    if (rtb_Divide_o > 100.0) {
      high_i = 100;
    } else {
      high_i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(rtb_Divide_o), 4.294967296E+9)));
    }

    AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_DWork.Delay_DSTATE_d2[100U - high_i];
  }

  AutopilotStateMachine_DWork.DelayInput1_DSTATE_h = (AutopilotStateMachine_DWork.DelayInput1_DSTATE !=
    AutopilotStateMachine_U.in.input.V_fcu_kn);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn = (AutopilotStateMachine_U.in.input.V_fcu_kn !=
    AutopilotStateMachine_P.CompareToConstant_const_l);
  rtb_AND_j = (AutopilotStateMachine_DWork.DelayInput1_DSTATE_h && AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_h = !AutopilotStateMachine_U.in.input.is_SPEED_managed;
  if (!AutopilotStateMachine_DWork.lastTargetSpeed_not_empty) {
    AutopilotStateMachine_DWork.lastTargetSpeed = AutopilotStateMachine_U.in.input.V_fcu_kn;
    AutopilotStateMachine_DWork.lastTargetSpeed_not_empty = true;
  }

  speedTargetChanged = (std::abs(AutopilotStateMachine_U.in.input.V_fcu_kn - AutopilotStateMachine_DWork.lastTargetSpeed)
                        > 2.0);
  AutopilotStateMachine_DWork.lastTargetSpeed = AutopilotStateMachine_U.in.input.V_fcu_kn;
  rtb_Divide_o = std::abs(AutopilotStateMachine_U.in.input.V_fcu_kn - AutopilotStateMachine_U.in.data.V_ias_kn);
  if ((rtb_Divide_o <= 4.0) || (!AutopilotStateMachine_DWork.timeDeltaSpeed4_not_empty)) {
    AutopilotStateMachine_DWork.timeDeltaSpeed4 = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.timeDeltaSpeed4_not_empty = true;
  }

  if ((rtb_Divide_o <= 10.0) || (!AutopilotStateMachine_DWork.timeDeltaSpeed10_not_empty)) {
    AutopilotStateMachine_DWork.timeDeltaSpeed10 = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.timeDeltaSpeed10_not_empty = true;
  }

  conditionSoftAlt = ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT) &&
                      (AutopilotStateMachine_U.in.data.flight_phase == 3.0) &&
                      AutopilotStateMachine_U.in.input.MACH_mode && AutopilotStateMachine_U.in.input.ATHR_engaged &&
                      (rtb_Divide_o < 4.0));
  if ((!conditionSoftAlt) || speedTargetChanged || (!AutopilotStateMachine_DWork.timeConditionSoftAlt_not_empty)) {
    AutopilotStateMachine_DWork.timeConditionSoftAlt = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.timeConditionSoftAlt_not_empty = true;
  }

  AutopilotStateMachine_DWork.stateSoftAlt = ((conditionSoftAlt && (AutopilotStateMachine_U.in.time.simulation_time -
    AutopilotStateMachine_DWork.timeConditionSoftAlt >= 120.0)) || AutopilotStateMachine_DWork.stateSoftAlt);
  if (speedTargetChanged || (!AutopilotStateMachine_U.in.input.MACH_mode) ||
      (!AutopilotStateMachine_U.in.input.ATHR_engaged) || (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode !=
       vertical_mode_ALT) || (AutopilotStateMachine_U.in.time.simulation_time -
       AutopilotStateMachine_DWork.timeDeltaSpeed4 > 10.0) || (AutopilotStateMachine_U.in.time.simulation_time -
       AutopilotStateMachine_DWork.timeDeltaSpeed10 > 4.0) || (AutopilotStateMachine_U.in.data.V_ias_kn >
       AutopilotStateMachine_U.in.data.VMAX_kn - 5.0)) {
    AutopilotStateMachine_DWork.stateSoftAlt = false;
    AutopilotStateMachine_DWork.timeConditionSoftAlt = AutopilotStateMachine_U.in.time.simulation_time;
  }

  speedTargetChanged = AutopilotStateMachine_DWork.DelayInput1_DSTATE_o;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE = rtb_BusAssignment1_data_altimeter_setting_changed;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE -= AutopilotStateMachine_DWork.Delay_DSTATE_g;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE = std::fmin(AutopilotStateMachine_DWork.DelayInput1_DSTATE,
    AutopilotStateMachine_P.Raising_Value * AutopilotStateMachine_U.in.time.dt);
  AutopilotStateMachine_DWork.Delay_DSTATE_g += std::fmax(AutopilotStateMachine_DWork.DelayInput1_DSTATE,
    AutopilotStateMachine_P.Falling_Value / AutopilotStateMachine_P.Debounce_Value * AutopilotStateMachine_U.in.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (AutopilotStateMachine_DWork.Delay_DSTATE_g !=
    AutopilotStateMachine_P.CompareToConstant_const_c);
  engageCondition = ((AutopilotStateMachine_U.in.data.H_radio_ft > 100.0) && (a > 5.0));
  rtb_BusAssignment1_data_altimeter_setting_changed = ((AutopilotStateMachine_DWork.Delay_DSTATE.armed.LOC ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_CPT) ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_TRACK) ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LAND) ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_FLARE) ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_ROLL_OUT)) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.armed.GS || (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode ==
    vertical_mode_GS_CPT) || (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_GS_TRACK) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_LAND) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_FLARE) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ROLL_OUT)));
  conditionSoftAlt = ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_ROLL_OUT) ||
                      (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ROLL_OUT));
  isGoAroundModeActive = ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_GA_TRACK) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS_GA));
  if (AutopilotStateMachine_DWork.DelayInput1_DSTATE_a && engageCondition) {
    state_e_tmp = !AutopilotStateMachine_DWork.sAP2;
    if ((!AutopilotStateMachine_DWork.sAP1) && state_e_tmp) {
      AutopilotStateMachine_DWork.sAP1 = true;
    } else if (rtb_BusAssignment1_data_altimeter_setting_changed) {
      if (AutopilotStateMachine_DWork.sAP1 && state_e_tmp) {
        AutopilotStateMachine_DWork.sAP2 = true;
      } else {
        AutopilotStateMachine_DWork.sAP1 = ((AutopilotStateMachine_DWork.sAP2 && (!AutopilotStateMachine_DWork.sAP1)) ||
          AutopilotStateMachine_DWork.sAP1);
      }
    }
  } else if (AutopilotStateMachine_DWork.DelayInput1_DSTATE_p) {
    if (!AutopilotStateMachine_DWork.sAP1) {
      if (engageCondition) {
        AutopilotStateMachine_DWork.sAP1 = true;
        AutopilotStateMachine_DWork.sAP2 = (rtb_BusAssignment1_data_altimeter_setting_changed &&
          AutopilotStateMachine_DWork.sAP2);
      }
    } else {
      AutopilotStateMachine_DWork.sAP1 = false;
      AutopilotStateMachine_DWork.sAP2 = false;
    }
  } else if (AutopilotStateMachine_DWork.DelayInput1_DSTATE_bo) {
    if (!AutopilotStateMachine_DWork.sAP2) {
      if (engageCondition) {
        AutopilotStateMachine_DWork.sAP2 = true;
        AutopilotStateMachine_DWork.sAP1 = (rtb_BusAssignment1_data_altimeter_setting_changed &&
          AutopilotStateMachine_DWork.sAP1);
      }
    } else {
      AutopilotStateMachine_DWork.sAP1 = false;
      AutopilotStateMachine_DWork.sAP2 = false;
    }
  } else if (AutopilotStateMachine_DWork.DelayInput1_DSTATE_d || ((!conditionSoftAlt) &&
              AutopilotStateMachine_DWork.sRollOutActive) || ((rtb_on_ground != 0) && isGoAroundModeActive &&
              (!AutopilotStateMachine_DWork.sGoAroundModeActive)) || (rtb_GainTheta > 25.0) || (rtb_GainTheta < -13.0) ||
             (std::abs(rtb_GainTheta1) > 45.0)) {
    AutopilotStateMachine_DWork.sAP1 = false;
    AutopilotStateMachine_DWork.sAP2 = false;
  } else {
    state_e_tmp = !isGoAroundModeActive;
    if ((!rtb_BusAssignment1_data_altimeter_setting_changed) && AutopilotStateMachine_DWork.sLandModeArmedOrActive &&
        state_e_tmp && AutopilotStateMachine_DWork.sAP1 && AutopilotStateMachine_DWork.sAP2) {
      AutopilotStateMachine_DWork.sAP1 = true;
      AutopilotStateMachine_DWork.sAP2 = false;
    } else if (state_e_tmp && AutopilotStateMachine_DWork.sGoAroundModeActive && AutopilotStateMachine_DWork.sAP1 &&
               AutopilotStateMachine_DWork.sAP2) {
      AutopilotStateMachine_DWork.sAP1 = true;
      AutopilotStateMachine_DWork.sAP2 = false;
    }
  }

  AutopilotStateMachine_DWork.sLandModeArmedOrActive = rtb_BusAssignment1_data_altimeter_setting_changed;
  AutopilotStateMachine_DWork.sRollOutActive = conditionSoftAlt;
  AutopilotStateMachine_DWork.sGoAroundModeActive = isGoAroundModeActive;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_DWork.sAP1;
  if (!AutopilotStateMachine_DWork.wasFlightPlanAvailable_not_empty) {
    AutopilotStateMachine_DWork.wasFlightPlanAvailable = AutopilotStateMachine_U.in.data.is_flight_plan_available;
    AutopilotStateMachine_DWork.wasFlightPlanAvailable_not_empty = true;
  }

  state_e_tmp = !AutopilotStateMachine_DWork.Delay_DSTATE.armed.NAV;
  AutopilotStateMachine_DWork.state_e = ((AutopilotStateMachine_U.in.data.is_flight_plan_available &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode_NAV) &&
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_e || ((rtb_on_ground != 0) &&
    (!AutopilotStateMachine_DWork.wasFlightPlanAvailable) && AutopilotStateMachine_U.in.data.is_flight_plan_available) ||
     (state_e_tmp && AutopilotStateMachine_U.in.input.FM_rnav_appr_selected &&
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_APPR_push)) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode_NAV) &&
    ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode_LOC_CPT) ||
     AutopilotStateMachine_U.in.input.FM_rnav_appr_selected) && ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode
    != lateral_mode_LOC_TRACK) || AutopilotStateMachine_U.in.input.FM_rnav_appr_selected) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode_LAND) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode_FLARE)) || AutopilotStateMachine_DWork.state_e);
  rtb_BusAssignment1_data_altimeter_setting_changed = !AutopilotStateMachine_U.in.input.FM_rnav_appr_selected;
  rtb_cLAND = !AutopilotStateMachine_DWork.Delay_DSTATE.armed.LOC;
  conditionSoftAlt = !rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_APPR_push;
  engageCondition = !AutopilotStateMachine_DWork.Delay1_DSTATE.armed.FINAL_DES;
  state_e_tmp_0 = !AutopilotStateMachine_DWork.DelayInput1_DSTATE_g;
  AutopilotStateMachine_DWork.state_e = (state_e_tmp_0 && ((AutopilotStateMachine_U.in.data.H_radio_ft >= 30.0) ||
    (!rtb_AND)) && (rtb_cLAND || AutopilotStateMachine_U.in.input.FM_rnav_appr_selected) &&
    (!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_NAV)) &&
    (!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LAND)) &&
    (!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_FLARE)) && (engageCondition || state_e_tmp ||
    rtb_BusAssignment1_data_altimeter_setting_changed || conditionSoftAlt) && AutopilotStateMachine_DWork.state_e);
  AutopilotStateMachine_DWork.wasFlightPlanAvailable = AutopilotStateMachine_U.in.data.is_flight_plan_available;
  rtb_cFLARE = (AutopilotStateMachine_DWork.Delay1_DSTATE.armed.GS ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_GS_CPT) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_GS_TRACK) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_LAND) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_FLARE));
  rtb_cGA = !rtb_cFLARE;
  state_i_tmp = ((!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_CPT)) &&
                 (!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_TRACK)) &&
                 (!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LAND)) &&
                 (!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_FLARE)));
  AutopilotStateMachine_DWork.state_i = (((AutopilotStateMachine_U.in.data.H_radio_ft > 400.0) &&
    AutopilotStateMachine_U.in.data.nav_valid && (AutopilotStateMachine_U.in.data.throttle_lever_1_pos < 45.0) &&
    (AutopilotStateMachine_U.in.data.throttle_lever_2_pos < 45.0) && (rtb_BusAssignment1_input_LOC_push ||
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_APPR_push &&
     rtb_BusAssignment1_data_altimeter_setting_changed)) && state_i_tmp && rtb_cGA &&
    (AutopilotStateMachine_U.in.input.FD_active || (AutopilotStateMachine_DWork.DelayInput1_DSTATE != 0.0) ||
     AutopilotStateMachine_DWork.sAP2)) || AutopilotStateMachine_DWork.state_i);
  isGoAroundModeActive = !rtb_BusAssignment1_input_LOC_push;
  AutopilotStateMachine_DWork.state_i = ((isGoAroundModeActive || rtb_cLAND || rtb_cFLARE) && (conditionSoftAlt ||
    rtb_cGA) && (conditionSoftAlt || rtb_BusAssignment1_data_altimeter_setting_changed) && state_e_tmp && state_i_tmp &&
    (AutopilotStateMachine_U.in.data.throttle_lever_1_pos != 45.0) &&
    (AutopilotStateMachine_U.in.data.throttle_lever_2_pos != 45.0) && (AutopilotStateMachine_U.in.input.FD_active ||
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE != 0.0) || AutopilotStateMachine_DWork.sAP2) &&
    AutopilotStateMachine_DWork.state_i);
  R = (AutopilotStateMachine_U.in.data.Psi_magnetic_track_deg - (AutopilotStateMachine_U.in.data.nav_loc_deg + 360.0)) +
    360.0;
  if (R == 0.0) {
    rtb_Divide_o = 0.0;
  } else {
    rtb_Divide_o = std::fmod(R, 360.0);
    if (rtb_Divide_o == 0.0) {
      rtb_Divide_o = 0.0;
    } else if (R < 0.0) {
      rtb_Divide_o += 360.0;
    }
  }

  if (360.0 - rtb_Divide_o == 0.0) {
    L = 0.0;
  } else {
    L = std::fmod(360.0 - rtb_Divide_o, 360.0);
    if (L == 0.0) {
      L = 0.0;
    } else if (360.0 - rtb_Divide_o < 0.0) {
      L += 360.0;
    }
  }

  if (rtb_Divide_o < L) {
    L = -rtb_Divide_o;
  }

  if (AutopilotStateMachine_U.in.input.Phi_loc_c < 0.0) {
    rtb_Divide_o = -1.0;
  } else if (AutopilotStateMachine_U.in.input.Phi_loc_c > 0.0) {
    rtb_Divide_o = 1.0;
  } else {
    rtb_Divide_o = AutopilotStateMachine_U.in.input.Phi_loc_c;
  }

  if (L < 0.0) {
    R = -1.0;
  } else if (L > 0.0) {
    R = 1.0;
  } else {
    R = L;
  }

  if (R == rtb_Divide_o) {
    b_L = std::abs(AutopilotStateMachine_U.in.input.Phi_loc_c);
    guard1 = false;
    if (b_L > 5.0) {
      if (std::abs(rtb_GainTheta1) <= 5.0) {
        state_e_tmp = true;
      } else {
        if (rtb_GainTheta1 < 0.0) {
          a_tmp = -1.0;
        } else if (rtb_GainTheta1 > 0.0) {
          a_tmp = 1.0;
        } else {
          a_tmp = rtb_GainTheta1;
        }

        if (rtb_Divide_o != a_tmp) {
          state_e_tmp = true;
        } else {
          guard1 = true;
        }
      }
    } else {
      guard1 = true;
    }

    if (guard1) {
      if (rtb_GainTheta1 < 0.0) {
        a_tmp = -1.0;
      } else if (rtb_GainTheta1 > 0.0) {
        a_tmp = 1.0;
      } else {
        a_tmp = rtb_GainTheta1;
      }

      state_e_tmp = ((b_L >= std::abs(rtb_GainTheta1)) && (rtb_Divide_o == a_tmp));
    }
  } else {
    state_e_tmp = false;
  }

  if (AutopilotStateMachine_U.in.data.nav_valid && AutopilotStateMachine_U.in.data.nav_loc_valid) {
    rtb_Divide_o = std::abs(L);
    if (rtb_Divide_o < 115.0) {
      b_L = std::abs(AutopilotStateMachine_U.in.data.nav_loc_error_deg);
      if (AutopilotStateMachine_U.in.data.nav_loc_error_deg < 0.0) {
        L = -1.0;
      } else if (AutopilotStateMachine_U.in.data.nav_loc_error_deg > 0.0) {
        L = 1.0;
      } else {
        L = AutopilotStateMachine_U.in.data.nav_loc_error_deg;
      }

      if (((rtb_Divide_o > 25.0) && ((b_L < 10.0) && ((R != L) && state_e_tmp))) || (b_L < 1.92)) {
        AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LOC_CPT = (state_e_tmp || ((rtb_Divide_o < 15.0) &&
          (b_L < 1.1)));
      } else {
        AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LOC_CPT = false;
      }
    } else {
      AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LOC_CPT = false;
    }
  } else {
    AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LOC_CPT = false;
  }

  if (!AutopilotStateMachine_DWork.eventTime_not_empty_f) {
    AutopilotStateMachine_DWork.eventTime_n4 = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_f = true;
  }

  state_e_tmp = !AutopilotStateMachine_U.in.data.nav_valid;
  if (state_e_tmp || (!AutopilotStateMachine_U.in.data.nav_loc_valid) || ((std::abs
        (AutopilotStateMachine_U.in.data.nav_loc_error_deg) >= 0.16) ||
       ((!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_CPT)) &&
        (!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_TRACK)))) ||
      (AutopilotStateMachine_DWork.eventTime_n4 == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_n4 = AutopilotStateMachine_U.in.time.simulation_time;
  }

  if (!AutopilotStateMachine_DWork.eventTime_not_empty_j) {
    AutopilotStateMachine_DWork.eventTime_i = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_j = true;
  }

  if ((AutopilotStateMachine_U.in.data.H_radio_ft >= 400.0) || (AutopilotStateMachine_DWork.eventTime_i == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_i = AutopilotStateMachine_U.in.time.simulation_time;
  }

  rtb_cLAND = ((AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_i >= 1.2) &&
               ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_TRACK) ||
                (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LAND)) &&
               ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_GS_TRACK) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_LAND)));
  rtb_cFLARE = ((AutopilotStateMachine_U.in.data.H_radio_ft * 15.0 <= std::abs(b_R)) &&
                (((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LAND) ||
                  (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_FLARE)) &&
                 ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_LAND) ||
                  (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_FLARE))));
  if (AutopilotStateMachine_U.in.data.nav_loc_valid) {
    AutopilotStateMachine_DWork.runwayHeadingStored = AutopilotStateMachine_U.in.data.nav_loc_deg;
  }

  if (AutopilotStateMachine_U.in.data.V_gnd_kn >= 40.0) {
    rtb_Divide_o = AutopilotStateMachine_U.in.data.Psi_magnetic_track_deg;
  } else {
    rtb_Divide_o = AutopilotStateMachine_U.in.data.Psi_magnetic_deg;
  }

  R = (AutopilotStateMachine_DWork.runwayHeadingStored - rtb_Divide_o) + 180.0;
  if (R == 0.0) {
    L = 0.0;
  } else {
    L = std::fmod(R, 360.0);
    if (L == 0.0) {
      L = 0.0;
    } else if (R < 0.0) {
      L += 360.0;
    }
  }

  AutopilotStateMachine_DWork.state = (((rtb_on_ground != 0) && ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode ==
    lateral_mode_FLARE) || (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_ROLL_OUT)) &&
    ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_FLARE) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ROLL_OUT))) ||
    AutopilotStateMachine_DWork.state);
  AutopilotStateMachine_DWork.state = ((std::abs(L - 180.0) <= 7.0) && (((AutopilotStateMachine_DWork.DelayInput1_DSTATE
    != 0.0) || AutopilotStateMachine_DWork.sAP2 || (AutopilotStateMachine_U.in.data.flight_phase != 7.0)) &&
    ((AutopilotStateMachine_DWork.DelayInput1_DSTATE != 0.0) || AutopilotStateMachine_DWork.sAP2 || (Phi2 <= 10.0) ||
     conditionSoftAlt) && ((!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode_FLARE)) ||
    (!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode_ROLL_OUT))) &&
    ((!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_FLARE)) ||
     (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_ROLL_OUT))) &&
    AutopilotStateMachine_DWork.state));
  state_i_tmp = ((AutopilotStateMachine_U.in.data.throttle_lever_1_pos == 45.0) ||
                 (AutopilotStateMachine_U.in.data.throttle_lever_2_pos == 45.0));
  rtb_cGA = ((!AutopilotStateMachine_DWork.sThrottleCondition) && state_i_tmp &&
             (AutopilotStateMachine_U.in.data.flaps_handle_index >= 1.0) && ((rtb_on_ground == 0) || (Phi2 < 30.0)) &&
             (AutopilotStateMachine_U.in.data.flight_phase >= 2.0) && (AutopilotStateMachine_U.in.data.flight_phase <=
              6.0) && (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode_GA_TRACK) &&
             (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_SRS) &&
             (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_SRS_GA));
  AutopilotStateMachine_DWork.sThrottleCondition = state_i_tmp;
  R = AutopilotStateMachine_U.in.input.H_fcu_ft - AutopilotStateMachine_U.in.data.H_ind_ft;
  b_L = std::abs(R);
  AutopilotStateMachine_DWork.was_TCAS_active = ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode ==
    vertical_mode_TCAS) || ((b_L <= 250.0) && AutopilotStateMachine_DWork.was_TCAS_active));
  AutopilotStateMachine_DWork.was_ALT_CPT_VS_pull = ((AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah &&
    ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT_CPT) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT_CST_CPT))) ||
    (((!AutopilotStateMachine_DWork.was_ALT_CPT_VS_pull) || (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode !=
    vertical_mode_VS)) || (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_FPA))) &&
     AutopilotStateMachine_DWork.was_ALT_CPT_VS_pull));
  if ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_CLB) ||
      (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_OP_CLB) ||
      (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_DES) ||
      (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_OP_DES)) {
    state_i_tmp = true;
  } else {
    boolean_T guard2{ false };

    guard1 = false;
    guard2 = false;
    if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_VS) {
      if (R < 0.0) {
        a_tmp = -1.0;
      } else if (R > 0.0) {
        a_tmp = 1.0;
      } else {
        a_tmp = R;
      }

      if (AutopilotStateMachine_U.in.input.H_dot_fcu_fpm < 0.0) {
        rtb_Divide_o = -1.0;
      } else if (AutopilotStateMachine_U.in.input.H_dot_fcu_fpm > 0.0) {
        rtb_Divide_o = 1.0;
      } else {
        rtb_Divide_o = AutopilotStateMachine_U.in.input.H_dot_fcu_fpm;
      }

      if (a_tmp == rtb_Divide_o) {
        state_i_tmp = true;
      } else {
        guard2 = true;
      }
    } else {
      guard2 = true;
    }

    if (guard2) {
      if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_FPA) {
        if (R < 0.0) {
          a_tmp = -1.0;
        } else if (R > 0.0) {
          a_tmp = 1.0;
        } else {
          a_tmp = R;
        }

        if (AutopilotStateMachine_U.in.input.FPA_fcu_deg < 0.0) {
          rtb_Divide_o = -1.0;
        } else if (AutopilotStateMachine_U.in.input.FPA_fcu_deg > 0.0) {
          rtb_Divide_o = 1.0;
        } else {
          rtb_Divide_o = AutopilotStateMachine_U.in.input.FPA_fcu_deg;
        }

        if (a_tmp == rtb_Divide_o) {
          state_i_tmp = true;
        } else {
          guard1 = true;
        }
      } else {
        guard1 = true;
      }
    }

    if (guard1) {
      if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_TCAS) {
        if (R < 0.0) {
          a_tmp = -1.0;
        } else if (R > 0.0) {
          a_tmp = 1.0;
        } else {
          a_tmp = R;
        }

        if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.H_dot_c_fpm < 0.0) {
          rtb_Divide_o = -1.0;
        } else if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.H_dot_c_fpm > 0.0) {
          rtb_Divide_o = 1.0;
        } else {
          rtb_Divide_o = AutopilotStateMachine_DWork.Delay1_DSTATE.output.H_dot_c_fpm;
        }

        if ((a_tmp == rtb_Divide_o) && AutopilotStateMachine_DWork.Delay1_DSTATE.output.TCAS_sub_mode_compatible) {
          state_i_tmp = true;
        } else {
          state_i_tmp = (((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS) ||
                          (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS_GA)) && (R > 250.0));
        }
      } else {
        state_i_tmp = (((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS) ||
                        (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS_GA)) && (R > 250.0));
      }
    }
  }

  if (speedTargetChanged && (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_VS) &&
      (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_FPA)) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected_f = 1.0;
  } else if ((std::abs(AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft) > 250.0) &&
             state_i_tmp) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected_f = 1.0;
  } else if ((AutopilotStateMachine_DWork.was_TCAS_active && (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode ==
               vertical_mode_VS) && state_i_tmp) || ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode ==
               vertical_mode_TCAS) && state_i_tmp) || (AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah &&
              ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT_CPT) ||
               (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT_CST_CPT))) ||
             (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_OP_CLB) ||
             (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_OP_DES) ||
             (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_CLB) ||
             (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_DES)) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected_f = 1.0;
  }

  sCLB_tmp = !AutopilotStateMachine_DWork.was_ALT_CPT_VS_pull;
  if (((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_VS) ||
       (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_FPA) ||
       (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_TCAS)) && (!state_i_tmp) && sCLB_tmp) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected_f = 0.0;
  }

  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT = ((AutopilotStateMachine_U.in.data.flight_phase < 7.0) &&
    (AutopilotStateMachine_DWork.newFcuAltitudeSelected_f != 0.0) && (((!rtb_Y_j) &&
    ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_CLB) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_DES))) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_OP_CLB) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_OP_DES) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_VS) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_FPA) ||
    ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_TCAS) &&
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.TCAS_sub_mode == NONE)) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS_GA)));
  if (((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT_CPT) && sCLB_tmp) ||
      ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT) && (std::abs
        (AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft) < 50.0))) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected_f = 0.0;
    AutopilotStateMachine_DWork.was_TCAS_active = false;
  }

  if (speedTargetChanged) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected = 1.0;
  } else if (std::abs(AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft) > 250.0) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected = 1.0;
  }

  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT_CST = ((AutopilotStateMachine_U.in.data.flight_phase < 7.0)
    && (AutopilotStateMachine_DWork.newFcuAltitudeSelected != 0.0) && rtb_Y_j &&
    ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_CLB) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_DES)));
  if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT_CPT) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected = 0.0;
  }

  if ((AutopilotStateMachine_U.in.data.flight_phase == 2.0) || (AutopilotStateMachine_U.in.data.flight_phase == 3.0) ||
      (AutopilotStateMachine_U.in.data.flight_phase == 6.0)) {
    if (AutopilotStateMachine_U.in.input.H_fcu_ft < AutopilotStateMachine_U.in.data.H_ind_ft) {
      state_i_tmp = true;
    } else if (b_L < 50.0) {
      state_i_tmp = true;
    } else if ((AutopilotStateMachine_U.in.input.H_fcu_ft == AutopilotStateMachine_U.in.input.H_constraint_ft) && (std::
                abs(AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft) < 50.0)) {
      state_i_tmp = true;
    } else if ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_ALT_CST) &&
               (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_ALT_CST_CPT) &&
               (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_SRS) &&
               (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_SRS_GA)) {
      state_i_tmp = true;
    } else {
      state_i_tmp = ((AutopilotStateMachine_U.in.data.flight_phase == 4.0) ||
                     (AutopilotStateMachine_U.in.data.flight_phase == 5.0));
    }
  } else {
    state_i_tmp = ((AutopilotStateMachine_U.in.data.flight_phase == 4.0) ||
                   (AutopilotStateMachine_U.in.data.flight_phase == 5.0));
  }

  sCLB_tmp = ((((AutopilotStateMachine_U.in.data.flight_phase == 0.0) || (AutopilotStateMachine_U.in.data.flight_phase ==
    1.0) || (AutopilotStateMachine_U.in.data.flight_phase == 7.0)) &&
               ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_NONE) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS_GA)) &&
               (AutopilotStateMachine_U.in.data.acceleration_altitude > 0.0) &&
               (AutopilotStateMachine_U.in.data.acceleration_altitude < AutopilotStateMachine_U.in.input.H_fcu_ft)) ||
              (((AutopilotStateMachine_U.in.data.flight_phase == 2.0) || (AutopilotStateMachine_U.in.data.flight_phase ==
    3.0) || (AutopilotStateMachine_U.in.data.flight_phase == 6.0)) &&
               (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_NAV) && (R > 50.0) &&
               ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT_CST_CPT) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT_CST) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS_GA))));
  AutopilotStateMachine_DWork.sCLB = (sCLB_tmp || AutopilotStateMachine_DWork.sCLB);
  sCLB_tmp_0 = ((!AutopilotStateMachine_DWork.DelayInput1_DSTATE_ib) &&
                (!AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd) &&
                (!AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah));
  AutopilotStateMachine_DWork.sCLB = (sCLB_tmp_0 && (!state_i_tmp) && (sCLB_tmp && AutopilotStateMachine_DWork.sCLB));
  AutopilotStateMachine_DWork.sDES = (((rtb_on_ground == 0) && (R < -50.0) &&
    ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT_CST) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_ALT_CST_CPT)) &&
    ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_NAV) ||
     (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_CPT) ||
     (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_TRACK))) ||
    AutopilotStateMachine_DWork.sDES);
  AutopilotStateMachine_DWork.sDES = (sCLB_tmp_0 && ((rtb_on_ground != 0) || ((AutopilotStateMachine_U.in.input.H_fcu_ft
    <= AutopilotStateMachine_U.in.data.H_ind_ft) && ((b_L >= 50.0) && ((AutopilotStateMachine_U.in.input.H_fcu_ft !=
    AutopilotStateMachine_U.in.input.H_constraint_ft) && ((!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode !=
    vertical_mode_ALT_CST)) || (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_ALT_CST_CPT))) &&
    ((!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode_NAV)) ||
     (!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode_LOC_CPT)) ||
     (!(AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode_LOC_TRACK))))))) &&
    AutopilotStateMachine_DWork.sDES);
  AutopilotStateMachine_DWork.sFINAL_DES = (((AutopilotStateMachine_U.in.data.H_radio_ft >= 400.0) && engageCondition &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_FINAL_DES) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_SRS) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_SRS_GA) &&
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_APPR_push &&
    AutopilotStateMachine_U.in.input.FM_rnav_appr_selected) || AutopilotStateMachine_DWork.sFINAL_DES);
  state_i_tmp = !AutopilotStateMachine_DWork.Delay1_DSTATE.condition.TCAS;
  AutopilotStateMachine_DWork.sFINAL_DES = ((engageCondition || conditionSoftAlt) && (isGoAroundModeActive ||
    state_e_tmp) && state_e_tmp_0 && (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_SRS_GA)) &&
    (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_FINAL_DES)) && state_i_tmp &&
    AutopilotStateMachine_DWork.sFINAL_DES);
  engageCondition = ((!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_GS_CPT)) &&
                     (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_GS_TRACK)) &&
                     (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_LAND)) &&
                     (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_FLARE)));
  AutopilotStateMachine_DWork.state_n = (((AutopilotStateMachine_U.in.data.H_radio_ft > 400.0) &&
    AutopilotStateMachine_U.in.data.nav_valid && (AutopilotStateMachine_U.in.data.throttle_lever_1_pos < 45.0) &&
    (AutopilotStateMachine_U.in.data.throttle_lever_2_pos < 45.0) &&
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_APPR_push &&
    rtb_BusAssignment1_data_altimeter_setting_changed && engageCondition && (AutopilotStateMachine_U.in.input.FD_active ||
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE != 0.0) || AutopilotStateMachine_DWork.sAP2)) ||
    AutopilotStateMachine_DWork.state_n);
  AutopilotStateMachine_DWork.state_n = ((conditionSoftAlt || (!AutopilotStateMachine_DWork.Delay1_DSTATE.armed.GS)) &&
    isGoAroundModeActive && (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_APPR_push ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.armed.LOC || (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode ==
    lateral_mode_LOC_CPT) || (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_TRACK) ||
     (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LAND) ||
     (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_FLARE))) && engageCondition &&
    (AutopilotStateMachine_U.in.data.throttle_lever_1_pos != 45.0) &&
    (AutopilotStateMachine_U.in.data.throttle_lever_2_pos != 45.0) && state_i_tmp &&
    (AutopilotStateMachine_U.in.input.FD_active || (AutopilotStateMachine_DWork.DelayInput1_DSTATE != 0.0) ||
     AutopilotStateMachine_DWork.sAP2) && AutopilotStateMachine_DWork.state_n);
  rtb_BusAssignment1_data_altimeter_setting_changed = (AutopilotStateMachine_U.in.input.TCAS_mode_available &&
    (!AutopilotStateMachine_U.in.input.TCAS_mode_fail));
  AutopilotStateMachine_DWork.sTCAS_g = ((rtb_BusAssignment1_data_altimeter_setting_changed &&
    (!AutopilotStateMachine_DWork.Delay1_DSTATE.armed.TCAS) && (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode !=
    vertical_mode_TCAS) && (AutopilotStateMachine_U.in.input.TCAS_advisory_state == 1.0) &&
    (AutopilotStateMachine_U.in.data.H_radio_ft >= 900.0)) || AutopilotStateMachine_DWork.sTCAS_g);
  AutopilotStateMachine_DWork.sTCAS_g = (rtb_BusAssignment1_data_altimeter_setting_changed &&
    (AutopilotStateMachine_U.in.input.TCAS_advisory_state != 0.0) && (AutopilotStateMachine_U.in.data.H_radio_ft >=
    900.0) && (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_TCAS)) &&
    AutopilotStateMachine_DWork.sTCAS_g);
  if (!AutopilotStateMachine_DWork.eventTime_not_empty_kh) {
    AutopilotStateMachine_DWork.eventTime_b = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_kh = true;
  }

  if (b_L >= 20.0) {
    AutopilotStateMachine_DWork.eventTime_b = AutopilotStateMachine_U.in.time.simulation_time;
  } else if (AutopilotStateMachine_DWork.eventTime_b == 0.0) {
    AutopilotStateMachine_DWork.eventTime_b = AutopilotStateMachine_U.in.time.simulation_time;
  }

  a_tmp_0 = std::abs(AutopilotStateMachine_U.in.data.H_dot_ft_min);
  high_i = 7;
  low_i = 0;
  low_ip1 = 2;
  while (high_i > low_ip1) {
    mid_i = ((low_i + high_i) + 1) >> 1;
    if (a_tmp_0 >= b[mid_i - 1]) {
      low_i = mid_i - 1;
      low_ip1 = mid_i + 1;
    } else {
      high_i = mid_i;
    }
  }

  xloc = a_tmp_0 - static_cast<real_T>(b[low_i]);
  L = AutopilotStateMachine_U.in.data.H_dot_ft_min * 0.00508;
  if ((AutopilotStateMachine_U.in.input.H_constraint_ft != 0.0) && (AutopilotStateMachine_U.in.input.H_constraint_ft !=
       AutopilotStateMachine_U.in.input.H_fcu_ft)) {
    if (!AutopilotStateMachine_DWork.eventTime_not_empty_i) {
      AutopilotStateMachine_DWork.eventTime_k = AutopilotStateMachine_U.in.time.simulation_time;
      AutopilotStateMachine_DWork.eventTime_not_empty_i = true;
    }

    if (std::abs(AutopilotStateMachine_U.in.input.H_constraint_ft - AutopilotStateMachine_U.in.data.H_ind_ft) >= 20.0) {
      AutopilotStateMachine_DWork.eventTime_k = AutopilotStateMachine_U.in.time.simulation_time;
    } else if (AutopilotStateMachine_DWork.eventTime_k == 0.0) {
      AutopilotStateMachine_DWork.eventTime_k = AutopilotStateMachine_U.in.time.simulation_time;
    }

    AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST =
      ((AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_k > 1.0) &&
       (!speedTargetChanged));
  } else {
    AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST = false;
  }

  high_i = 7;
  low_i_0 = 0;
  low_ip1 = 2;
  while (high_i > low_ip1) {
    mid_i = ((low_i_0 + high_i) + 1) >> 1;
    if (a_tmp_0 >= b[mid_i - 1]) {
      low_i_0 = mid_i - 1;
      low_ip1 = mid_i + 1;
    } else {
      high_i = mid_i;
    }
  }

  xloc_0 = a_tmp_0 - static_cast<real_T>(b[low_i_0]);
  if ((AutopilotStateMachine_U.in.input.H_constraint_ft != 0.0) && (AutopilotStateMachine_U.in.input.H_constraint_ft !=
       AutopilotStateMachine_U.in.input.H_fcu_ft)) {
    a_tmp = AutopilotStateMachine_U.in.input.H_constraint_ft - AutopilotStateMachine_U.in.data.H_ind_ft;
    if (a_tmp < 0.0) {
      a_tmp = -1.0;
    } else if (a_tmp > 0.0) {
      a_tmp = 1.0;
    }

    if (AutopilotStateMachine_U.in.data.H_dot_ft_min < 0.0) {
      rtb_Divide_o = -1.0;
    } else if (AutopilotStateMachine_U.in.data.H_dot_ft_min > 0.0) {
      rtb_Divide_o = 1.0;
    } else {
      rtb_Divide_o = AutopilotStateMachine_U.in.data.H_dot_ft_min;
    }

    AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST_CPT = ((std::abs
      (AutopilotStateMachine_U.in.input.H_constraint_ft - AutopilotStateMachine_U.in.data.H_ind_ft) <= std::fmin(3000.0,
      std::fmax(80.0, L * L / ((((xloc_0 * c[low_i_0] + c[low_i_0 + 6]) * xloc_0 + c[low_i_0 + 12]) * xloc_0 + c[low_i_0
      + 18]) * 9.81) * 3.2808398950131235))) && ((a_tmp == rtb_Divide_o) && ((a_tmp_0 >= 100.0) && ((!speedTargetChanged)
      && (AutopilotStateMachine_U.in.data.H_radio_ft > 400.0)))));
  } else {
    AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST_CPT = false;
  }

  if (AutopilotStateMachine_U.in.data.nav_valid && AutopilotStateMachine_U.in.data.nav_gs_valid &&
      ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_CPT) ||
       (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_TRACK)) &&
      (AutopilotStateMachine_U.in.data.nav_gs_error_deg >= -0.1)) {
    rtb_Divide_o = std::abs(AutopilotStateMachine_U.in.data.nav_gs_error_deg);
    if ((rtb_Divide_o < 0.8) && rtb_FixPtRelationalOperator) {
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT = true;
    } else {
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT = (rtb_Divide_o < 0.4);
    }
  } else {
    AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT = false;
  }

  if (!AutopilotStateMachine_DWork.eventTime_not_empty_m) {
    AutopilotStateMachine_DWork.eventTime_p = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_m = true;
  }

  if (state_e_tmp || (!AutopilotStateMachine_U.in.data.nav_gs_valid) || ((std::abs
        (AutopilotStateMachine_U.in.data.nav_gs_error_deg) >= 0.4) ||
       ((!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_GS_CPT)) &&
        (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_GS_TRACK)))) ||
      (AutopilotStateMachine_DWork.eventTime_p == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_p = AutopilotStateMachine_U.in.time.simulation_time;
  }

  if ((Phi2 >= 30.0) && (AutopilotStateMachine_U.in.data.V2_kn >= 90.0) &&
      (AutopilotStateMachine_U.in.data.flaps_handle_index > 0.0)) {
    if (!AutopilotStateMachine_DWork.eventTime_not_empty_k) {
      AutopilotStateMachine_DWork.eventTime_o = AutopilotStateMachine_U.in.time.simulation_time;
      AutopilotStateMachine_DWork.eventTime_not_empty_k = true;
    }

    if ((AutopilotStateMachine_U.in.data.throttle_lever_1_pos < 35.0) ||
        (AutopilotStateMachine_U.in.data.throttle_lever_2_pos < 35.0) || (AutopilotStateMachine_DWork.eventTime_o == 0.0))
    {
      AutopilotStateMachine_DWork.eventTime_o = AutopilotStateMachine_U.in.time.simulation_time;
    }

    conditionSoftAlt = (AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_o >= 0.5);
  } else {
    conditionSoftAlt = false;
  }

  AutopilotStateMachine_DWork.sSRS = (conditionSoftAlt || (((!AutopilotStateMachine_DWork.sSRS) ||
    (((AutopilotStateMachine_U.in.data.throttle_lever_1_pos != 0.0) ||
      (AutopilotStateMachine_U.in.data.throttle_lever_2_pos != 0.0)) &&
     (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_SRS)))) &&
    AutopilotStateMachine_DWork.sSRS));
  if (speedTargetChanged || AutopilotStateMachine_DWork.DelayInput1_DSTATE_o) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected_c = true;
  } else {
    rtb_Divide_o = std::abs(AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft);
    if (rtb_Divide_o > 250.0) {
      AutopilotStateMachine_DWork.newFcuAltitudeSelected_c = true;
    } else {
      switch (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode) {
       case vertical_mode_ALT_CPT:
        AutopilotStateMachine_DWork.newFcuAltitudeSelected_c = false;
        break;

       case vertical_mode_ALT:
        AutopilotStateMachine_DWork.newFcuAltitudeSelected_c = ((rtb_Divide_o >= 20.0) &&
          AutopilotStateMachine_DWork.newFcuAltitudeSelected_c);
        break;
      }
    }
  }

  if (rtb_BusAssignment1_data_altimeter_setting_changed && (AutopilotStateMachine_U.in.input.TCAS_advisory_state >= 2.0)
      && (AutopilotStateMachine_U.in.data.H_radio_ft >= 900.0) && (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode
       != vertical_mode_TCAS) && (!AutopilotStateMachine_DWork.latch)) {
    AutopilotStateMachine_DWork.sTCAS = true;
    AutopilotStateMachine_DWork.latch = true;
  }

  AutopilotStateMachine_DWork.sTCAS = (rtb_BusAssignment1_data_altimeter_setting_changed &&
    (AutopilotStateMachine_U.in.input.TCAS_advisory_state >= 2.0) && (AutopilotStateMachine_U.in.data.H_radio_ft >=
    900.0) && (!(AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode_TCAS)) &&
    AutopilotStateMachine_DWork.sTCAS);
  AutopilotStateMachine_DWork.latch = (rtb_BusAssignment1_data_altimeter_setting_changed &&
    (AutopilotStateMachine_U.in.data.H_radio_ft >= 900.0) && (AutopilotStateMachine_U.in.input.TCAS_advisory_state >=
    2.0) && AutopilotStateMachine_DWork.latch);
  AutopilotStateMachine_B.BusAssignment_g.time = AutopilotStateMachine_U.in.time;
  AutopilotStateMachine_B.BusAssignment_g.data.aircraft_position = AutopilotStateMachine_U.in.data.aircraft_position;
  AutopilotStateMachine_B.BusAssignment_g.data.Theta_deg = rtb_GainTheta;
  AutopilotStateMachine_B.BusAssignment_g.data.Phi_deg = rtb_GainTheta1;
  AutopilotStateMachine_B.BusAssignment_g.data.qk_deg_s = result[1];
  AutopilotStateMachine_B.BusAssignment_g.data.rk_deg_s = result[2];
  AutopilotStateMachine_B.BusAssignment_g.data.pk_deg_s = result[0];
  AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn = AutopilotStateMachine_U.in.data.V_ias_kn;
  AutopilotStateMachine_B.BusAssignment_g.data.V_tas_kn = AutopilotStateMachine_U.in.data.V_tas_kn;
  AutopilotStateMachine_B.BusAssignment_g.data.V_mach = AutopilotStateMachine_U.in.data.V_mach;
  AutopilotStateMachine_B.BusAssignment_g.data.V_gnd_kn = AutopilotStateMachine_U.in.data.V_gnd_kn;
  AutopilotStateMachine_B.BusAssignment_g.data.alpha_deg = AutopilotStateMachine_U.in.data.alpha_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.beta_deg = AutopilotStateMachine_U.in.data.beta_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.H_ft = AutopilotStateMachine_U.in.data.H_ft;
  AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft = AutopilotStateMachine_U.in.data.H_ind_ft;
  AutopilotStateMachine_B.BusAssignment_g.data.H_radio_ft = AutopilotStateMachine_U.in.data.H_radio_ft;
  AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min = AutopilotStateMachine_U.in.data.H_dot_ft_min;
  AutopilotStateMachine_B.BusAssignment_g.data.Psi_magnetic_deg = AutopilotStateMachine_U.in.data.Psi_magnetic_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.Psi_magnetic_track_deg =
    AutopilotStateMachine_U.in.data.Psi_magnetic_track_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.Psi_true_deg = AutopilotStateMachine_U.in.data.Psi_true_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.ax_m_s2 = result_0[0];
  AutopilotStateMachine_B.BusAssignment_g.data.ay_m_s2 = result_0[1];
  AutopilotStateMachine_B.BusAssignment_g.data.az_m_s2 = result_0[2];
  AutopilotStateMachine_B.BusAssignment_g.data.bx_m_s2 = AutopilotStateMachine_U.in.data.bx_m_s2;
  AutopilotStateMachine_B.BusAssignment_g.data.by_m_s2 = AutopilotStateMachine_U.in.data.by_m_s2;
  AutopilotStateMachine_B.BusAssignment_g.data.bz_m_s2 = AutopilotStateMachine_U.in.data.bz_m_s2;
  AutopilotStateMachine_B.BusAssignment_g.data.nav_valid = AutopilotStateMachine_U.in.data.nav_valid;
  AutopilotStateMachine_B.BusAssignment_g.data.nav_loc_deg = AutopilotStateMachine_U.in.data.nav_loc_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.nav_gs_deg = AutopilotStateMachine_U.in.data.nav_gs_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.nav_dme_valid = AutopilotStateMachine_U.in.data.nav_dme_valid;
  AutopilotStateMachine_B.BusAssignment_g.data.nav_loc_valid = AutopilotStateMachine_U.in.data.nav_loc_valid;
  AutopilotStateMachine_B.BusAssignment_g.data.nav_loc_magvar_deg = AutopilotStateMachine_U.in.data.nav_loc_magvar_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.nav_loc_error_deg = AutopilotStateMachine_U.in.data.nav_loc_error_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.nav_loc_position = AutopilotStateMachine_U.in.data.nav_loc_position;
  AutopilotStateMachine_B.BusAssignment_g.data.nav_gs_valid = AutopilotStateMachine_U.in.data.nav_gs_valid;
  AutopilotStateMachine_B.BusAssignment_g.data.nav_gs_error_deg = AutopilotStateMachine_U.in.data.nav_gs_error_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.nav_gs_position = AutopilotStateMachine_U.in.data.nav_gs_position;
  AutopilotStateMachine_B.BusAssignment_g.data.flight_guidance_xtk_nmi =
    AutopilotStateMachine_U.in.data.flight_guidance_xtk_nmi;
  AutopilotStateMachine_B.BusAssignment_g.data.flight_guidance_tae_deg =
    AutopilotStateMachine_U.in.data.flight_guidance_tae_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.flight_guidance_phi_deg =
    AutopilotStateMachine_U.in.data.flight_guidance_phi_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.flight_guidance_phi_limit_deg =
    AutopilotStateMachine_U.in.data.flight_guidance_phi_limit_deg;
  AutopilotStateMachine_B.BusAssignment_g.data.flight_phase = AutopilotStateMachine_U.in.data.flight_phase;
  AutopilotStateMachine_B.BusAssignment_g.data.V2_kn = AutopilotStateMachine_U.in.data.V2_kn;
  AutopilotStateMachine_B.BusAssignment_g.data.VAPP_kn = AutopilotStateMachine_U.in.data.VAPP_kn;
  AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn = AutopilotStateMachine_U.in.data.VLS_kn;
  AutopilotStateMachine_B.BusAssignment_g.data.VMAX_kn = AutopilotStateMachine_U.in.data.VMAX_kn;
  AutopilotStateMachine_B.BusAssignment_g.data.is_flight_plan_available =
    AutopilotStateMachine_U.in.data.is_flight_plan_available;
  AutopilotStateMachine_B.BusAssignment_g.data.altitude_constraint_ft =
    AutopilotStateMachine_U.in.data.altitude_constraint_ft;
  AutopilotStateMachine_B.BusAssignment_g.data.thrust_reduction_altitude =
    AutopilotStateMachine_U.in.data.thrust_reduction_altitude;
  AutopilotStateMachine_B.BusAssignment_g.data.thrust_reduction_altitude_go_around =
    AutopilotStateMachine_U.in.data.thrust_reduction_altitude_go_around;
  AutopilotStateMachine_B.BusAssignment_g.data.acceleration_altitude =
    AutopilotStateMachine_U.in.data.acceleration_altitude;
  AutopilotStateMachine_B.BusAssignment_g.data.acceleration_altitude_engine_out =
    AutopilotStateMachine_U.in.data.acceleration_altitude_engine_out;
  AutopilotStateMachine_B.BusAssignment_g.data.acceleration_altitude_go_around =
    AutopilotStateMachine_U.in.data.acceleration_altitude_go_around;
  AutopilotStateMachine_B.BusAssignment_g.data.acceleration_altitude_go_around_engine_out =
    AutopilotStateMachine_U.in.data.acceleration_altitude_go_around_engine_out;
  AutopilotStateMachine_B.BusAssignment_g.data.cruise_altitude = AutopilotStateMachine_U.in.data.cruise_altitude;
  AutopilotStateMachine_B.BusAssignment_g.data.on_ground = rtb_on_ground;
  AutopilotStateMachine_B.BusAssignment_g.data.zeta_deg = AutopilotStateMachine_P.Gain2_Gain *
    AutopilotStateMachine_U.in.data.zeta_pos;
  AutopilotStateMachine_B.BusAssignment_g.data.throttle_lever_1_pos =
    AutopilotStateMachine_U.in.data.throttle_lever_1_pos;
  AutopilotStateMachine_B.BusAssignment_g.data.throttle_lever_2_pos =
    AutopilotStateMachine_U.in.data.throttle_lever_2_pos;
  AutopilotStateMachine_B.BusAssignment_g.data.flaps_handle_index = AutopilotStateMachine_U.in.data.flaps_handle_index;
  AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_1 =
    AutopilotStateMachine_U.in.data.is_engine_operative_1;
  AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_2 =
    AutopilotStateMachine_U.in.data.is_engine_operative_2;
  AutopilotStateMachine_B.BusAssignment_g.data.altimeter_setting_changed =
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_o;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.time_since_touchdown = Phi2;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.time_since_lift_off = a;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.time_since_SRS = AutopilotStateMachine_U.in.time.simulation_time
    - AutopilotStateMachine_DWork.eventTime_n;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.H_fcu_in_selection = speedTargetChanged;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid = rtb_Y_j;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.Psi_fcu_in_selection = rtb_AND;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.gs_convergent_towards_beam = rtb_FixPtRelationalOperator;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.H_dot_radio_fpm = b_R;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.V_fcu_in_selection = (rtb_AND_j &&
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_h);
  AutopilotStateMachine_B.BusAssignment_g.data_computed.ALT_soft_mode = AutopilotStateMachine_DWork.stateSoftAlt;
  AutopilotStateMachine_B.BusAssignment_g.input.FD_active = AutopilotStateMachine_U.in.input.FD_active;
  AutopilotStateMachine_B.BusAssignment_g.input.AP_ENGAGE_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_a;
  AutopilotStateMachine_B.BusAssignment_g.input.AP_1_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_p;
  AutopilotStateMachine_B.BusAssignment_g.input.AP_2_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_bo;
  AutopilotStateMachine_B.BusAssignment_g.input.AP_DISCONNECT_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_d;
  AutopilotStateMachine_B.BusAssignment_g.input.HDG_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_e;
  AutopilotStateMachine_B.BusAssignment_g.input.HDG_pull = AutopilotStateMachine_DWork.DelayInput1_DSTATE_g;
  AutopilotStateMachine_B.BusAssignment_g.input.ALT_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_f;
  AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull = AutopilotStateMachine_DWork.DelayInput1_DSTATE_ib;
  AutopilotStateMachine_B.BusAssignment_g.input.VS_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd;
  AutopilotStateMachine_B.BusAssignment_g.input.VS_pull = AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah;
  AutopilotStateMachine_B.BusAssignment_g.input.LOC_push = rtb_BusAssignment1_input_LOC_push;
  AutopilotStateMachine_B.BusAssignment_g.input.APPR_push =
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_APPR_push;
  AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn = AutopilotStateMachine_U.in.input.V_fcu_kn;
  AutopilotStateMachine_B.BusAssignment_g.input.Psi_fcu_deg = AutopilotStateMachine_U.in.input.Psi_fcu_deg;
  AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft = AutopilotStateMachine_U.in.input.H_fcu_ft;
  AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft = AutopilotStateMachine_U.in.input.H_constraint_ft;
  AutopilotStateMachine_B.BusAssignment_g.input.H_dot_fcu_fpm = AutopilotStateMachine_U.in.input.H_dot_fcu_fpm;
  AutopilotStateMachine_B.BusAssignment_g.input.FPA_fcu_deg = AutopilotStateMachine_U.in.input.FPA_fcu_deg;
  AutopilotStateMachine_B.BusAssignment_g.input.TRK_FPA_mode = AutopilotStateMachine_U.in.input.TRK_FPA_mode;
  AutopilotStateMachine_B.BusAssignment_g.input.DIR_TO_trigger = AutopilotStateMachine_U.in.input.DIR_TO_trigger;
  AutopilotStateMachine_B.BusAssignment_g.input.is_FLX_active = AutopilotStateMachine_U.in.input.is_FLX_active;
  AutopilotStateMachine_B.BusAssignment_g.input.Slew_trigger = AutopilotStateMachine_U.in.input.Slew_trigger;
  AutopilotStateMachine_B.BusAssignment_g.input.MACH_mode = AutopilotStateMachine_U.in.input.MACH_mode;
  AutopilotStateMachine_B.BusAssignment_g.input.ATHR_engaged = AutopilotStateMachine_U.in.input.ATHR_engaged;
  AutopilotStateMachine_B.BusAssignment_g.input.is_SPEED_managed = AutopilotStateMachine_U.in.input.is_SPEED_managed;
  AutopilotStateMachine_B.BusAssignment_g.input.FDR_event = AutopilotStateMachine_U.in.input.FDR_event;
  AutopilotStateMachine_B.BusAssignment_g.input.Phi_loc_c = AutopilotStateMachine_U.in.input.Phi_loc_c;
  AutopilotStateMachine_B.BusAssignment_g.input.FM_requested_vertical_mode =
    AutopilotStateMachine_U.in.input.FM_requested_vertical_mode;
  AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft = AutopilotStateMachine_U.in.input.FM_H_c_ft;
  AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm = AutopilotStateMachine_U.in.input.FM_H_dot_c_fpm;
  AutopilotStateMachine_B.BusAssignment_g.input.FM_rnav_appr_selected =
    AutopilotStateMachine_U.in.input.FM_rnav_appr_selected;
  AutopilotStateMachine_B.BusAssignment_g.input.FM_final_des_can_engage =
    AutopilotStateMachine_U.in.input.FM_final_des_can_engage;
  AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_fail = AutopilotStateMachine_U.in.input.TCAS_mode_fail;
  AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_available =
    AutopilotStateMachine_U.in.input.TCAS_mode_available;
  AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_state =
    AutopilotStateMachine_U.in.input.TCAS_advisory_state;
  AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_min_fpm =
    AutopilotStateMachine_U.in.input.TCAS_advisory_target_min_fpm;
  AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_max_fpm =
    AutopilotStateMachine_U.in.input.TCAS_advisory_target_max_fpm;
  AutopilotStateMachine_B.BusAssignment_g.lateral.output =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.lateral.output;
  AutopilotStateMachine_B.BusAssignment_g.lateral_previous = AutopilotStateMachine_DWork.Delay_DSTATE;
  AutopilotStateMachine_B.BusAssignment_g.vertical.output =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.vertical.output;
  AutopilotStateMachine_B.BusAssignment_g.vertical_previous = AutopilotStateMachine_DWork.Delay1_DSTATE;
  AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 = AutopilotStateMachine_DWork.DelayInput1_DSTATE;
  AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 = AutopilotStateMachine_DWork.sAP2;
  AutopilotStateMachine_B.BusAssignment_g.output.lateral_law =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.lateral_law;
  AutopilotStateMachine_B.BusAssignment_g.output.lateral_mode =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.lateral_mode;
  AutopilotStateMachine_B.BusAssignment_g.output.lateral_mode_armed =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.lateral_mode_armed;
  AutopilotStateMachine_B.BusAssignment_g.output.vertical_law =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.vertical_law;
  AutopilotStateMachine_B.BusAssignment_g.output.vertical_mode =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.vertical_mode;
  AutopilotStateMachine_B.BusAssignment_g.output.vertical_mode_armed =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.vertical_mode_armed;
  AutopilotStateMachine_B.BusAssignment_g.output.mode_reversion_lateral =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.mode_reversion_lateral;
  AutopilotStateMachine_B.BusAssignment_g.output.mode_reversion_vertical =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.mode_reversion_vertical;
  AutopilotStateMachine_B.BusAssignment_g.output.mode_reversion_vertical_target_fpm =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.mode_reversion_vertical_target_fpm;
  AutopilotStateMachine_B.BusAssignment_g.output.mode_reversion_TRK_FPA =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.mode_reversion_TRK_FPA;
  AutopilotStateMachine_B.BusAssignment_g.output.mode_reversion_triple_click =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.mode_reversion_triple_click;
  AutopilotStateMachine_B.BusAssignment_g.output.mode_reversion_fma =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.mode_reversion_fma;
  AutopilotStateMachine_B.BusAssignment_g.output.speed_protection_mode =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.speed_protection_mode;
  AutopilotStateMachine_B.BusAssignment_g.output.autothrust_mode =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.autothrust_mode;
  AutopilotStateMachine_B.BusAssignment_g.output.Psi_c_deg =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.Psi_c_deg;
  AutopilotStateMachine_B.BusAssignment_g.output.H_c_ft =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.H_c_ft;
  AutopilotStateMachine_B.BusAssignment_g.output.H_dot_c_fpm =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.H_dot_c_fpm;
  AutopilotStateMachine_B.BusAssignment_g.output.FPA_c_deg =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.FPA_c_deg;
  AutopilotStateMachine_B.BusAssignment_g.output.V_c_kn =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.V_c_kn;
  AutopilotStateMachine_B.BusAssignment_g.output.ALT_soft_mode_active =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.ALT_soft_mode_active;
  AutopilotStateMachine_B.BusAssignment_g.output.ALT_cruise_mode_active =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.ALT_cruise_mode_active;
  AutopilotStateMachine_B.BusAssignment_g.output.EXPED_mode_active =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.EXPED_mode_active;
  AutopilotStateMachine_B.BusAssignment_g.output.FD_disconnect =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.FD_disconnect;
  AutopilotStateMachine_B.BusAssignment_g.output.FD_connect =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.FD_connect;
  AutopilotStateMachine_B.BusAssignment_g.output.TCAS_message_disarm =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.TCAS_message_disarm;
  AutopilotStateMachine_B.BusAssignment_g.output.TCAS_message_RA_inhibit =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.TCAS_message_RA_inhibit;
  AutopilotStateMachine_B.BusAssignment_g.output.TCAS_message_TRK_FPA_deselection =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.output.TCAS_message_TRK_FPA_deselection;
  AutopilotStateMachine_B.BusAssignment_g.lateral.armed.NAV = AutopilotStateMachine_DWork.state_e;
  AutopilotStateMachine_B.BusAssignment_g.lateral.armed.LOC = AutopilotStateMachine_DWork.state_i;
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.NAV = ((AutopilotStateMachine_U.in.data.H_radio_ft >= 30.0) &&
    AutopilotStateMachine_U.in.data.is_flight_plan_available && (AutopilotStateMachine_U.in.data.flight_guidance_xtk_nmi
    < 10.0));
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LOC_TRACK = (AutopilotStateMachine_U.in.time.simulation_time
    - AutopilotStateMachine_DWork.eventTime_n4 >= 10.0);
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LAND = rtb_cLAND;
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.FLARE = rtb_cFLARE;
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.ROLL_OUT = AutopilotStateMachine_DWork.state;
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.GA_TRACK = rtb_cGA;
  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB = AutopilotStateMachine_DWork.sCLB;
  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.DES = AutopilotStateMachine_DWork.sDES;
  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES = AutopilotStateMachine_DWork.sFINAL_DES;
  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS = AutopilotStateMachine_DWork.state_n;
  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.TCAS = AutopilotStateMachine_DWork.sTCAS_g;
  state_e_tmp = !speedTargetChanged;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT = ((AutopilotStateMachine_U.in.time.simulation_time -
    AutopilotStateMachine_DWork.eventTime_b > 1.0) && state_e_tmp);
  if (R < 0.0) {
    a_tmp = -1.0;
  } else if (R > 0.0) {
    a_tmp = 1.0;
  } else {
    a_tmp = R;
  }

  if (AutopilotStateMachine_U.in.data.H_dot_ft_min < 0.0) {
    rtb_Divide_o = -1.0;
  } else if (AutopilotStateMachine_U.in.data.H_dot_ft_min > 0.0) {
    rtb_Divide_o = 1.0;
  } else {
    rtb_Divide_o = AutopilotStateMachine_U.in.data.H_dot_ft_min;
  }

  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT = ((b_L <= std::fmin(3000.0, std::fmax(80.0, L * L /
    ((((xloc * c[low_i] + c[low_i + 6]) * xloc + c[low_i + 12]) * xloc + c[low_i + 18]) * 9.81) * 3.2808398950131235))) &&
    ((a_tmp == rtb_Divide_o) && ((a_tmp_0 >= 100.0) && (state_e_tmp && (AutopilotStateMachine_U.in.data.H_radio_ft >
    400.0)))));
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB = ((a > 5.0) && (R > 50.0) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_NAV) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_GS_CPT) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_GS_TRACK) &&
    (AutopilotStateMachine_U.in.data.flight_phase >= 2.0) && (AutopilotStateMachine_U.in.data.flight_phase != 4.0) &&
    (AutopilotStateMachine_U.in.data.flight_phase != 5.0) && (AutopilotStateMachine_U.in.data.flight_phase != 6.0));
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES = ((a > 5.0) && (R < -50.0) &&
    ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_NAV) ||
     (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_CPT) ||
     (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode_LOC_TRACK)) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_SRS) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_SRS_GA) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_GS_CPT) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_GS_TRACK) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_LAND) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_FINAL_DES) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_FLARE) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode_ROLL_OUT) &&
    (AutopilotStateMachine_U.in.data.flight_phase != 1.0) && (AutopilotStateMachine_U.in.data.flight_phase != 2.0) &&
    (AutopilotStateMachine_U.in.data.flight_phase != 6.0));
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES =
    (AutopilotStateMachine_U.in.input.FM_final_des_can_engage && (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode ==
      lateral_mode_NAV));
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_TRACK = (AutopilotStateMachine_U.in.time.simulation_time
    - AutopilotStateMachine_DWork.eventTime_p >= 15.0);
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.LAND = rtb_cLAND;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FLARE = rtb_cFLARE;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ROLL_OUT = AutopilotStateMachine_DWork.state;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.SRS = AutopilotStateMachine_DWork.sSRS;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.SRS_GA = rtb_cGA;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.THR_RED = (AutopilotStateMachine_U.in.data.H_ind_ft >=
    AutopilotStateMachine_U.in.data.thrust_reduction_altitude);
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active =
    AutopilotStateMachine_DWork.newFcuAltitudeSelected_c;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.TCAS = AutopilotStateMachine_DWork.sTCAS;
  if (AutopilotStateMachine_DWork.is_active_c1_AutopilotStateMachine == 0U) {
    AutopilotStateMachine_DWork.is_active_c1_AutopilotStateMachine = 1U;
    AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_OFF;
    AutopilotStateMachine_OFF_entry();
  } else {
    guard1 = false;
    switch (AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine) {
     case AutopilotStateMachine_IN_GA_TRK:
      if (AutopilotStateMachine_U.in.data.H_radio_ft > 100.0) {
        if (AutopilotStateMachine_ON_TO_HDG(&AutopilotStateMachine_B.BusAssignment_g)) {
          AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_ON;
          AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_HDG;
          AutopilotStateMachine_HDG_entry(&AutopilotStateMachine_B.BusAssignment_g);
        } else if (AutopilotStateMachine_ON_TO_NAV(&AutopilotStateMachine_B.BusAssignment_g)) {
          AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_ON;
          AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NAV;
          AutopilotStateMachine_NAV_entry();
        } else {
          guard1 = true;
        }
      } else {
        guard1 = true;
      }
      break;

     case AutopilotStateMachine_IN_OFF:
      if (AutopilotStateMachine_OFF_TO_HDG(&AutopilotStateMachine_B.BusAssignment_g)) {
        AutopilotStateMachine_B.out_n.mode_reversion = true;
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_ON;
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_HDG;
        AutopilotStateMachine_HDG_entry(&AutopilotStateMachine_B.BusAssignment_g);
      } else if (AutopilotStateMachine_OFF_TO_NAV(&AutopilotStateMachine_B.BusAssignment_g)) {
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_ON;
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_NAV;
        AutopilotStateMachine_NAV_entry();
      } else if (AutopilotStateMachine_OFF_TO_RWY(&AutopilotStateMachine_B.BusAssignment_g)) {
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_ON;
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_RWY;
        AutopilotStateMachine_RWY_entry();
      } else if (AutopilotStateMachine_OFF_TO_RWY_TRK(&AutopilotStateMachine_B.BusAssignment_g)) {
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_ON;
        AutopilotStateMachine_DWork.is_ON_l = AutopilotStateMachine_IN_RWY_TRK;
        AutopilotStateMachine_RWY_TRK_entry(&AutopilotStateMachine_B.BusAssignment_g);
      } else if (AutopilotStateMachine_X_TO_GA_TRK(&AutopilotStateMachine_B.BusAssignment_g)) {
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_GA_TRK;
        AutopilotStateMachine_GA_TRK_entry(&AutopilotStateMachine_B.BusAssignment_g);
      }
      break;

     default:
      AutopilotStateMachine_ON(&AutopilotStateMachine_B.BusAssignment_g);
      break;
    }

    if (guard1) {
      if ((!AutopilotStateMachine_B.BusAssignment_g.input.FD_active) &&
          (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 == 0.0) &&
          (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0) &&
          (!AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.FD_connect)) {
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_OFF;
        AutopilotStateMachine_OFF_entry();
      } else {
        AutopilotStateMachine_GA_TRK_during();
      }
    }
  }

  AutopilotStateMachine_B.BusAssignment_g.lateral.output = AutopilotStateMachine_B.out_n;
  if (AutopilotStateMachine_DWork.is_active_c6_AutopilotStateMachine == 0U) {
    AutopilotStateMachine_DWork.is_active_c6_AutopilotStateMachine = 1U;
    AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_m;
    AutopilotStateMachine_OFF_entry_p();
  } else {
    guard1 = false;
    switch (AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine) {
     case AutopilotStateMachine_IN_OFF_m:
      if (AutopilotStateMachine_B.BusAssignment_g.input.FD_active &&
          (AutopilotStateMachine_B.BusAssignment_g.data.on_ground != 0.0) &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.SRS) {
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_SRS;
        AutopilotStateMachine_SRS_entry();
      } else if (((AutopilotStateMachine_B.BusAssignment_g.input.FD_active &&
                   (!AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.FD_disconnect)) ||
                  (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 != 0.0) ||
                  (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 != 0.0)) &&
                 ((AutopilotStateMachine_B.BusAssignment_g.data_computed.time_since_lift_off > 5.0) ||
                  ((AutopilotStateMachine_B.BusAssignment_g.data.flight_phase >= 2.0) &&
                   (AutopilotStateMachine_B.BusAssignment_g.data.flight_phase < 7.0) &&
                   (AutopilotStateMachine_B.BusAssignment_g.data.on_ground == 0.0) &&
                   AutopilotStateMachine_B.BusAssignment_g.input.FD_active &&
                   (!AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB)))) {
        AutopilotStateMachine_B.out.mode_reversion = true;
        AutopilotStateMachine_B.out.mode_reversion_target_fpm =
          AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
        AutopilotStateMachine_VS_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB) {
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
        AutopilotStateMachine_CLB_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES) {
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
        AutopilotStateMachine_DES_entry();
      } else if (AutopilotStateMachine_X_TO_TCAS()) {
        AutopilotStateMachine_X_TO_TCAS_Action();
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_TCAS;
        AutopilotStateMachine_TCAS_entry();
      } else if (AutopilotStateMachine_X_TO_SRS_GA()) {
        AutopilotStateMachine_B.out.FD_connect = true;
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_SRS_GA;
        AutopilotStateMachine_SRS_GA_entry();
      } else {
        AutopilotStateMachine_OFF_during();
      }
      break;

     case AutopilotStateMachine_IN_ON_a:
      AutopilotStateMachine_ON_l();
      break;

     case AutopilotStateMachine_IN_SRS_GA:
      if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
        AutopilotStateMachine_GS_CPT_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
        AutopilotStateMachine_FINAL_DES_entry();
      } else {
        rtb_Divide_o = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
          AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
        state_e_tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                        AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
                       AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
        if (state_e_tmp && (rtb_Divide_o < -20.0)) {
          AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
          AutopilotStateMachine_OP_DES_entry();
        } else if (state_e_tmp && (rtb_Divide_o > 20.0)) {
          guard1 = true;
        } else {
          rtb_Divide_o = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
            AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
          if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
              AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
              AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
              ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (rtb_Divide_o > 20.0))) {
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
            AutopilotStateMachine_CLB_entry();
          } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
                     ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (rtb_Divide_o > 20.0)))
          {
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
            AutopilotStateMachine_DES_entry();
          } else if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
                     AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
            AutopilotStateMachine_VS_entry();
          } else if ((AutopilotStateMachine_B.BusAssignment_g.data.H_radio_ft > 400.0) &&
                     (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
                      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT)) {
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
            AutopilotStateMachine_ALT_CPT_entry();
          } else if ((AutopilotStateMachine_B.BusAssignment_g.data_computed.V_fcu_in_selection &&
                      (AutopilotStateMachine_B.BusAssignment_g.data_computed.time_since_SRS > 5.0)) ||
                     ((AutopilotStateMachine_DWork.local_H_GA_init_ft <
                       AutopilotStateMachine_B.BusAssignment_g.data.acceleration_altitude_go_around) &&
                      (AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft >=
                       AutopilotStateMachine_B.BusAssignment_g.data.acceleration_altitude_go_around) &&
                      AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_1 &&
                      AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_2)) {
            guard1 = true;
          } else if ((!AutopilotStateMachine_B.BusAssignment_g.input.FD_active) &&
                     (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 == 0.0) &&
                     (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0) &&
                     (!AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.FD_connect)) {
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_m;
            AutopilotStateMachine_OFF_entry_p();
          } else {
            AutopilotStateMachine_SRS_GA_during();
          }
        }
      }
      break;

     default:
      AutopilotStateMachine_TCAS();
      break;
    }

    if (guard1) {
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_a;
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
      AutopilotStateMachine_OP_CLB_entry();
    }
  }

  AutopilotStateMachine_DWork.Delay1_DSTATE = AutopilotStateMachine_B.BusAssignment_g.vertical;
  AutopilotStateMachine_DWork.Delay1_DSTATE.output = AutopilotStateMachine_B.out;
  AutopilotStateMachine_BitShift(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.lateral.armed.NAV), &L);
  AutopilotStateMachine_BitShift1(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.lateral.armed.LOC), &b_R);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (AutopilotStateMachine_B.BusAssignment_g.input.FD_active ||
    (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 != 0.0) ||
    (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 != 0.0));
  if (AutopilotStateMachine_DWork.DelayInput1_DSTATE_o) {
    Double2MultiWord(std::floor(L), &tmp_0.chunks[0U], 2);
    Double2MultiWord(std::floor(b_R), &tmp_1.chunks[0U], 2);
    MultiWordIor(&tmp_0.chunks[0U], &tmp_1.chunks[0U], &tmp.chunks[0U], 2);
    AutopilotStateMachine_DWork.DelayInput1_DSTATE = uMultiWord2Double(&tmp.chunks[0U], 2, 0);
  } else {
    AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_P.Constant_Value;
  }

  AutopilotStateMachine_BitShift(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT),
    &rtb_GainTheta);
  AutopilotStateMachine_BitShift1(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT_CST),
    &rtb_GainTheta1);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (AutopilotStateMachine_B.BusAssignment_g.input.FD_active ||
    (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 != 0.0) ||
    (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 != 0.0));
  if (AutopilotStateMachine_DWork.DelayInput1_DSTATE_o) {
    Double2MultiWord(std::floor(rtb_GainTheta), &tmp_7.chunks[0U], 2);
    Double2MultiWord(std::floor(rtb_GainTheta1), &tmp_8.chunks[0U], 2);
    MultiWordIor(&tmp_7.chunks[0U], &tmp_8.chunks[0U], &tmp_6.chunks[0U], 2);
    Double2MultiWord(static_cast<real_T>(static_cast<int32_T>(std::ldexp(static_cast<real_T>
      (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB), 2))), &tmp_7.chunks[0U], 2);
    MultiWordIor(&tmp_6.chunks[0U], &tmp_7.chunks[0U], &tmp_5.chunks[0U], 2);
    Double2MultiWord(static_cast<real_T>(static_cast<int32_T>(std::ldexp(static_cast<real_T>
      (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.DES), 3))), &tmp_6.chunks[0U], 2);
    MultiWordIor(&tmp_5.chunks[0U], &tmp_6.chunks[0U], &tmp_4.chunks[0U], 2);
    Double2MultiWord(static_cast<real_T>(static_cast<int32_T>(std::ldexp(static_cast<real_T>
      (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS), 4))), &tmp_5.chunks[0U], 2);
    MultiWordIor(&tmp_4.chunks[0U], &tmp_5.chunks[0U], &tmp_3.chunks[0U], 2);
    Double2MultiWord(static_cast<real_T>(static_cast<int32_T>(std::ldexp(static_cast<real_T>
      (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES), 5))), &tmp_4.chunks[0U], 2);
    MultiWordIor(&tmp_3.chunks[0U], &tmp_4.chunks[0U], &tmp_2.chunks[0U], 2);
    Double2MultiWord(static_cast<real_T>(static_cast<int32_T>(std::ldexp(static_cast<real_T>
      (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.TCAS), 6))), &tmp_3.chunks[0U], 2);
    MultiWordIor(&tmp_2.chunks[0U], &tmp_3.chunks[0U], &tmp_1.chunks[0U], 2);
    AutopilotStateMachine_Y.out.output.vertical_mode_armed = uMultiWord2Double(&tmp_1.chunks[0U], 2, 0);
  } else {
    Double2MultiWord(static_cast<real_T>(static_cast<int32_T>(std::ldexp(static_cast<real_T>
      (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.TCAS), 6))), &tmp_0.chunks[0U], 2);
    AutopilotStateMachine_Y.out.output.vertical_mode_armed = uMultiWord2Double(&tmp_0.chunks[0U], 2, 0);
  }

  AutopilotStateMachine_DWork.Delay_DSTATE_e += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_B.BusAssignment_g.lateral.output.mode_reversion) - AutopilotStateMachine_DWork.Delay_DSTATE_e,
    AutopilotStateMachine_P.Raising_Value_b * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_a / AutopilotStateMachine_P.Debounce_Value_f *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (AutopilotStateMachine_DWork.Delay_DSTATE_e !=
    AutopilotStateMachine_P.CompareToConstant_const_d);
  AutopilotStateMachine_Y.out.output.mode_reversion_lateral = AutopilotStateMachine_DWork.DelayInput1_DSTATE_o;
  AutopilotStateMachine_DWork.Delay_DSTATE_f += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_B.out.mode_reversion) - AutopilotStateMachine_DWork.Delay_DSTATE_f,
    AutopilotStateMachine_P.Raising_Value_f * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_b / AutopilotStateMachine_P.Debounce_Value_a *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (AutopilotStateMachine_DWork.Delay_DSTATE_f !=
    AutopilotStateMachine_P.CompareToConstant_const_j);
  AutopilotStateMachine_Y.out.output.mode_reversion_vertical = AutopilotStateMachine_DWork.DelayInput1_DSTATE_o;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o =
    (AutopilotStateMachine_B.BusAssignment_g.lateral.output.mode_reversion_TRK_FPA ||
     AutopilotStateMachine_B.out.mode_reversion_TRK_FPA);
  AutopilotStateMachine_DWork.Delay_DSTATE_k += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_o) - AutopilotStateMachine_DWork.Delay_DSTATE_k,
    AutopilotStateMachine_P.Raising_Value_c * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_ay / AutopilotStateMachine_P.Debounce_Value_j *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (AutopilotStateMachine_DWork.Delay_DSTATE_k !=
    AutopilotStateMachine_P.CompareToConstant_const_da);
  if (!AutopilotStateMachine_DWork.eventTimeTC_not_empty) {
    AutopilotStateMachine_DWork.eventTimeTC = AutopilotStateMachine_B.BusAssignment_g.time.simulation_time;
    AutopilotStateMachine_DWork.eventTimeTC_not_empty = true;
  }

  if (!AutopilotStateMachine_DWork.eventTimeMR_not_empty) {
    AutopilotStateMachine_DWork.eventTimeMR = AutopilotStateMachine_B.BusAssignment_g.time.simulation_time;
    AutopilotStateMachine_DWork.eventTimeMR_not_empty = true;
  }

  state_e_tmp = !AutopilotStateMachine_B.BusAssignment_g.input.VS_pull;
  if (AutopilotStateMachine_B.out.mode_reversion &&
      (((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode_CLB) &&
        (AutopilotStateMachine_B.out.mode == vertical_mode_OP_CLB)) ||
       ((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode_DES) &&
        (AutopilotStateMachine_B.out.mode == vertical_mode_VS))) &&
      (!AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull) && state_e_tmp) {
    AutopilotStateMachine_DWork.warningArmedNAV = true;
    AutopilotStateMachine_DWork.warningArmedVS = false;
    AutopilotStateMachine_DWork.eventTimeTC = AutopilotStateMachine_B.BusAssignment_g.time.simulation_time;
    AutopilotStateMachine_DWork.modeReversionFMA = false;
    AutopilotStateMachine_DWork.eventTimeMR = AutopilotStateMachine_B.BusAssignment_g.time.simulation_time;
  } else if (AutopilotStateMachine_DWork.warningArmedNAV && (AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
              AutopilotStateMachine_B.BusAssignment_g.input.VS_pull ||
              AutopilotStateMachine_B.BusAssignment_g.data_computed.H_fcu_in_selection)) {
    AutopilotStateMachine_DWork.warningArmedNAV = false;
    AutopilotStateMachine_DWork.modeReversionFMA = false;
  }

  if (AutopilotStateMachine_B.BusAssignment_g.input.TRK_FPA_mode) {
    rtb_GainTheta = AutopilotStateMachine_B.BusAssignment_g.input.FPA_fcu_deg;
  } else {
    rtb_GainTheta = AutopilotStateMachine_B.BusAssignment_g.input.H_dot_fcu_fpm;
  }

  if (!AutopilotStateMachine_DWork.lastVsTarget_not_empty) {
    AutopilotStateMachine_DWork.lastVsTarget = rtb_GainTheta;
    AutopilotStateMachine_DWork.lastVsTarget_not_empty = true;
  }

  if (AutopilotStateMachine_B.out.mode_reversion && (AutopilotStateMachine_B.out.mode == vertical_mode_VS) &&
      ((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode_OP_CLB) ||
       (AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode_OP_DES) ||
       (AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode_ALT_CPT)) &&
      (!AutopilotStateMachine_B.BusAssignment_g.input.VS_push) && state_e_tmp) {
    AutopilotStateMachine_DWork.warningArmedVS = true;
    AutopilotStateMachine_DWork.warningArmedNAV = false;
    AutopilotStateMachine_DWork.eventTimeTC = AutopilotStateMachine_B.BusAssignment_g.time.simulation_time;
    AutopilotStateMachine_DWork.modeReversionFMA = false;
    AutopilotStateMachine_DWork.eventTimeMR = AutopilotStateMachine_B.BusAssignment_g.time.simulation_time;
  } else if (AutopilotStateMachine_DWork.warningArmedVS && (AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
              AutopilotStateMachine_B.BusAssignment_g.input.VS_push || ((AutopilotStateMachine_DWork.lastVsTarget != 0.0)
    && (rtb_GainTheta != AutopilotStateMachine_DWork.lastVsTarget)))) {
    AutopilotStateMachine_DWork.modeReversionFMA = false;
    AutopilotStateMachine_DWork.warningArmedVS = false;
  }

  AutopilotStateMachine_DWork.lastVsTarget = rtb_GainTheta;
  if ((AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 == 0.0) &&
      (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0) && AutopilotStateMachine_B.out.FD_disconnect &&
      ((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode_OP_CLB) ||
       (AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode_OP_DES))) {
    AutopilotStateMachine_DWork.modeReversionFMA = false;
    rtb_on_ground = 1;
    AutopilotStateMachine_Y.out.output.mode_reversion_fma = AutopilotStateMachine_DWork.modeReversionFMA;
  } else if (AutopilotStateMachine_B.out.speed_protection_mode &&
             (!AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.speed_protection_mode)) {
    AutopilotStateMachine_DWork.modeReversionFMA = false;
    rtb_on_ground = 1;
    AutopilotStateMachine_Y.out.output.mode_reversion_fma = AutopilotStateMachine_DWork.modeReversionFMA;
  } else if ((AutopilotStateMachine_B.out.mode == vertical_mode_VS) &&
             (AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode_TCAS)) {
    AutopilotStateMachine_DWork.modeReversionFMA = false;
    rtb_on_ground = 1;
    AutopilotStateMachine_Y.out.output.mode_reversion_fma = AutopilotStateMachine_DWork.modeReversionFMA;
  } else {
    if ((!AutopilotStateMachine_B.out.mode_reversion) &&
        (AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode != AutopilotStateMachine_B.out.mode)) {
      AutopilotStateMachine_DWork.warningArmedNAV = false;
      AutopilotStateMachine_DWork.warningArmedVS = false;
      AutopilotStateMachine_DWork.modeReversionFMA = false;
    }

    if (((!AutopilotStateMachine_DWork.warningArmedNAV) && (!AutopilotStateMachine_DWork.warningArmedVS)) ||
        (AutopilotStateMachine_DWork.eventTimeTC == 0.0)) {
      AutopilotStateMachine_DWork.eventTimeTC = AutopilotStateMachine_B.BusAssignment_g.time.simulation_time;
    }

    if ((!AutopilotStateMachine_DWork.modeReversionFMA) || (AutopilotStateMachine_DWork.eventTimeMR == 0.0)) {
      AutopilotStateMachine_DWork.eventTimeMR = AutopilotStateMachine_B.BusAssignment_g.time.simulation_time;
    }

    if (AutopilotStateMachine_B.BusAssignment_g.time.simulation_time - AutopilotStateMachine_DWork.eventTimeTC >= 5.0) {
      rtb_on_ground = 1;
      AutopilotStateMachine_DWork.modeReversionFMA = true;
      AutopilotStateMachine_DWork.warningArmedNAV = false;
      AutopilotStateMachine_DWork.warningArmedVS = false;
    } else {
      rtb_on_ground = 0;
    }

    AutopilotStateMachine_DWork.modeReversionFMA = ((AutopilotStateMachine_B.BusAssignment_g.time.simulation_time -
      AutopilotStateMachine_DWork.eventTimeMR < 10.0) && AutopilotStateMachine_DWork.modeReversionFMA);
    AutopilotStateMachine_Y.out.output.mode_reversion_fma = AutopilotStateMachine_DWork.modeReversionFMA;
  }

  AutopilotStateMachine_DWork.Delay_DSTATE_m += std::fmax(std::fmin(static_cast<real_T>(rtb_on_ground) -
    AutopilotStateMachine_DWork.Delay_DSTATE_m, AutopilotStateMachine_P.Raising_Value_a *
    AutopilotStateMachine_B.BusAssignment_g.time.dt), AutopilotStateMachine_P.Falling_Value_k /
    AutopilotStateMachine_P.Debounce1_Value * AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_h = (AutopilotStateMachine_DWork.Delay_DSTATE_m !=
    AutopilotStateMachine_P.CompareToConstant_const_n);
  AutopilotStateMachine_DWork.Delay_DSTATE_h += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_B.out.TCAS_message_disarm) - AutopilotStateMachine_DWork.Delay_DSTATE_h,
    AutopilotStateMachine_P.Raising_Value_i * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_o / AutopilotStateMachine_P.Debounce_Value_d *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn = (AutopilotStateMachine_DWork.Delay_DSTATE_h !=
    AutopilotStateMachine_P.CompareToConstant_const_i);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah = AutopilotStateMachine_DWork.DelayInput1_DSTATE_c;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah = (static_cast<int32_T>
    (AutopilotStateMachine_B.out.TCAS_message_RA_inhibit) > static_cast<int32_T>
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah));
  AutopilotStateMachine_DWork.Delay_DSTATE_cm += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah) - AutopilotStateMachine_DWork.Delay_DSTATE_cm,
    AutopilotStateMachine_P.Raising_Value_cl * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_c / AutopilotStateMachine_P.Debounce_Value_k *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah = (AutopilotStateMachine_DWork.Delay_DSTATE_cm !=
    AutopilotStateMachine_P.CompareToConstant_const_h);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd = AutopilotStateMachine_DWork.DelayInput1_DSTATE_og;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd = (static_cast<int32_T>
    (AutopilotStateMachine_B.out.TCAS_message_TRK_FPA_deselection) > static_cast<int32_T>
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd));
  AutopilotStateMachine_DWork.Delay_DSTATE_b += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd) - AutopilotStateMachine_DWork.Delay_DSTATE_b,
    AutopilotStateMachine_P.Raising_Value_d * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_as / AutopilotStateMachine_P.Debounce_Value_h *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd = (AutopilotStateMachine_DWork.Delay_DSTATE_b !=
    AutopilotStateMachine_P.CompareToConstant_const_cc);
  AutopilotStateMachine_Y.out.time = AutopilotStateMachine_B.BusAssignment_g.time;
  AutopilotStateMachine_Y.out.data = AutopilotStateMachine_B.BusAssignment_g.data;
  AutopilotStateMachine_Y.out.data_computed = AutopilotStateMachine_B.BusAssignment_g.data_computed;
  AutopilotStateMachine_Y.out.input = AutopilotStateMachine_B.BusAssignment_g.input;
  AutopilotStateMachine_Y.out.lateral = AutopilotStateMachine_B.BusAssignment_g.lateral;
  AutopilotStateMachine_Y.out.lateral_previous = AutopilotStateMachine_B.BusAssignment_g.lateral_previous;
  AutopilotStateMachine_Y.out.vertical = AutopilotStateMachine_DWork.Delay1_DSTATE;
  AutopilotStateMachine_Y.out.vertical_previous = AutopilotStateMachine_B.BusAssignment_g.vertical_previous;
  AutopilotStateMachine_Y.out.output.enabled_AP1 = AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1;
  AutopilotStateMachine_Y.out.output.enabled_AP2 = AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2;
  AutopilotStateMachine_Y.out.output.lateral_law = static_cast<int32_T>
    (AutopilotStateMachine_B.BusAssignment_g.lateral.output.law);
  AutopilotStateMachine_Y.out.output.lateral_mode = static_cast<int32_T>
    (AutopilotStateMachine_B.BusAssignment_g.lateral.output.mode);
  AutopilotStateMachine_Y.out.output.lateral_mode_armed = AutopilotStateMachine_DWork.DelayInput1_DSTATE;
  AutopilotStateMachine_Y.out.output.vertical_law = static_cast<int32_T>(AutopilotStateMachine_B.out.law);
  AutopilotStateMachine_Y.out.output.vertical_mode = static_cast<int32_T>(AutopilotStateMachine_B.out.mode);
  AutopilotStateMachine_Y.out.output.mode_reversion_vertical_target_fpm =
    AutopilotStateMachine_B.out.mode_reversion_target_fpm;
  AutopilotStateMachine_Y.out.output.mode_reversion_TRK_FPA = AutopilotStateMachine_DWork.DelayInput1_DSTATE_o;
  AutopilotStateMachine_Y.out.output.mode_reversion_triple_click = AutopilotStateMachine_DWork.DelayInput1_DSTATE_h;
  AutopilotStateMachine_Y.out.output.speed_protection_mode = AutopilotStateMachine_B.out.speed_protection_mode;
  AutopilotStateMachine_Y.out.output.autothrust_mode = static_cast<int32_T>(AutopilotStateMachine_B.out.mode_autothrust);
  AutopilotStateMachine_Y.out.output.Psi_c_deg = AutopilotStateMachine_B.BusAssignment_g.lateral.output.Psi_c_deg;
  AutopilotStateMachine_Y.out.output.H_c_ft = AutopilotStateMachine_B.out.H_c_ft;
  AutopilotStateMachine_Y.out.output.H_dot_c_fpm = AutopilotStateMachine_B.out.H_dot_c_fpm;
  AutopilotStateMachine_Y.out.output.FPA_c_deg = AutopilotStateMachine_B.out.FPA_c_deg;
  AutopilotStateMachine_Y.out.output.V_c_kn = AutopilotStateMachine_B.out.V_c_kn;
  AutopilotStateMachine_Y.out.output.ALT_soft_mode_active = AutopilotStateMachine_B.out.ALT_soft_mode_active;
  AutopilotStateMachine_Y.out.output.ALT_cruise_mode_active = AutopilotStateMachine_B.out.ALT_cruise_mode_active;
  AutopilotStateMachine_Y.out.output.EXPED_mode_active = AutopilotStateMachine_B.out.EXPED_mode_active;
  AutopilotStateMachine_Y.out.output.FD_disconnect = AutopilotStateMachine_B.out.FD_disconnect;
  AutopilotStateMachine_Y.out.output.FD_connect = AutopilotStateMachine_B.out.FD_connect;
  AutopilotStateMachine_Y.out.output.TCAS_message_disarm = AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn;
  AutopilotStateMachine_Y.out.output.TCAS_message_RA_inhibit = AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah;
  AutopilotStateMachine_Y.out.output.TCAS_message_TRK_FPA_deselection =
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_a = AutopilotStateMachine_U.in.input.AP_ENGAGE_push;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_p = AutopilotStateMachine_U.in.input.AP_1_push;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_bo = AutopilotStateMachine_U.in.input.AP_2_push;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_d = AutopilotStateMachine_U.in.input.AP_DISCONNECT_push;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_e = AutopilotStateMachine_U.in.input.HDG_push;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_g = AutopilotStateMachine_U.in.input.HDG_pull;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_f = AutopilotStateMachine_U.in.input.ALT_push;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ib = AutopilotStateMachine_U.in.input.ALT_pull;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd = AutopilotStateMachine_U.in.input.VS_push;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah = AutopilotStateMachine_U.in.input.VS_pull;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn = AutopilotStateMachine_U.in.input.LOC_push;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_h = AutopilotStateMachine_U.in.input.APPR_push;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = AutopilotStateMachine_U.in.input.EXPED_push;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_U.in.data.altimeter_setting_left_mbar;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_i = AutopilotStateMachine_U.in.data.altimeter_setting_right_mbar;
  AutopilotStateMachine_DWork.Delay_DSTATE = AutopilotStateMachine_B.BusAssignment_g.lateral;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_b = rtb_dme;
  AutopilotStateMachine_DWork.Delay_DSTATE_l = rtb_Saturation1;
  for (rtb_on_ground = 0; rtb_on_ground < 99; rtb_on_ground++) {
    AutopilotStateMachine_DWork.Delay_DSTATE_d[rtb_on_ground] = AutopilotStateMachine_DWork.Delay_DSTATE_d[rtb_on_ground
      + 1];
    AutopilotStateMachine_DWork.Delay_DSTATE_c[rtb_on_ground] = AutopilotStateMachine_DWork.Delay_DSTATE_c[rtb_on_ground
      + 1];
    AutopilotStateMachine_DWork.Delay_DSTATE_d2[rtb_on_ground] =
      AutopilotStateMachine_DWork.Delay_DSTATE_d2[rtb_on_ground + 1];
  }

  AutopilotStateMachine_DWork.Delay_DSTATE_d[99] = AutopilotStateMachine_U.in.input.H_fcu_ft;
  AutopilotStateMachine_DWork.Delay_DSTATE_c[99] = AutopilotStateMachine_U.in.input.Psi_fcu_deg;
  AutopilotStateMachine_DWork.Delay_DSTATE_d2[99] = AutopilotStateMachine_U.in.input.V_fcu_kn;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_c = AutopilotStateMachine_B.out.TCAS_message_RA_inhibit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_og = AutopilotStateMachine_B.out.TCAS_message_TRK_FPA_deselection;
}

void AutopilotStateMachineModelClass::initialize()
{
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_a = AutopilotStateMachine_P.DetectIncrease12_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_p = AutopilotStateMachine_P.DetectIncrease_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_bo = AutopilotStateMachine_P.DetectIncrease1_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_d = AutopilotStateMachine_P.DetectIncrease2_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_e = AutopilotStateMachine_P.DetectIncrease3_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_g = AutopilotStateMachine_P.DetectIncrease4_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_f = AutopilotStateMachine_P.DetectIncrease5_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ib = AutopilotStateMachine_P.DetectIncrease6_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd = AutopilotStateMachine_P.DetectIncrease7_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah = AutopilotStateMachine_P.DetectIncrease8_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn = AutopilotStateMachine_P.DetectIncrease9_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_h = AutopilotStateMachine_P.DetectIncrease10_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = AutopilotStateMachine_P.DetectIncrease11_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_P.DetectChange_vinit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_i = AutopilotStateMachine_P.DetectChange1_vinit;
  AutopilotStateMachine_DWork.Delay_DSTATE = AutopilotStateMachine_P.Delay_InitialCondition;
  AutopilotStateMachine_DWork.Delay1_DSTATE = AutopilotStateMachine_P.Delay1_InitialCondition;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_b = AutopilotStateMachine_P.DetectDecrease_vinit;
  AutopilotStateMachine_DWork.Delay_DSTATE_l = AutopilotStateMachine_P.DiscreteDerivativeVariableTs2_InitialCondition;
  for (int32_T i{0}; i < 100; i++) {
    AutopilotStateMachine_DWork.Delay_DSTATE_d[i] = AutopilotStateMachine_P.Delay_InitialCondition_i;
    AutopilotStateMachine_DWork.Delay_DSTATE_c[i] = AutopilotStateMachine_P.Delay_InitialCondition_m;
    AutopilotStateMachine_DWork.Delay_DSTATE_d2[i] = AutopilotStateMachine_P.Delay_InitialCondition_i4;
  }

  AutopilotStateMachine_DWork.Delay_DSTATE_g = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition;
  AutopilotStateMachine_DWork.Delay_DSTATE_e = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_d;
  AutopilotStateMachine_DWork.Delay_DSTATE_f = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_db;
  AutopilotStateMachine_DWork.Delay_DSTATE_k = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_g;
  AutopilotStateMachine_DWork.Delay_DSTATE_m = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_h;
  AutopilotStateMachine_DWork.Delay_DSTATE_h = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_m;
  AutopilotStateMachine_DWork.Delay_DSTATE_cm = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_ge;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_c = AutopilotStateMachine_P.DetectIncrease1_vinit_f;
  AutopilotStateMachine_DWork.Delay_DSTATE_b = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_do;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_og = AutopilotStateMachine_P.DetectIncrease10_vinit_h;
  AutopilotStateMachine_B.out_n.mode = lateral_mode_NONE;
  AutopilotStateMachine_B.out_n.mode_reversion = false;
  AutopilotStateMachine_B.out_n.mode_reversion_TRK_FPA = false;
  AutopilotStateMachine_B.out_n.law = lateral_law_NONE;
  AutopilotStateMachine_B.out_n.Psi_c_deg = 0.0;
  AutopilotStateMachine_B.out.mode = vertical_mode_NONE;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode_NONE;
  AutopilotStateMachine_B.out.mode_reversion = false;
  AutopilotStateMachine_B.out.mode_reversion_target_fpm = 0.0;
  AutopilotStateMachine_B.out.mode_reversion_TRK_FPA = false;
  AutopilotStateMachine_B.out.law = vertical_law_NONE;
  AutopilotStateMachine_B.out.H_c_ft = 0.0;
  AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
  AutopilotStateMachine_B.out.FPA_c_deg = 0.0;
  AutopilotStateMachine_B.out.V_c_kn = 0.0;
  AutopilotStateMachine_B.out.ALT_soft_mode_active = false;
  AutopilotStateMachine_B.out.ALT_cruise_mode_active = false;
  AutopilotStateMachine_B.out.EXPED_mode_active = false;
  AutopilotStateMachine_B.out.speed_protection_mode = false;
  AutopilotStateMachine_B.out.FD_disconnect = false;
  AutopilotStateMachine_B.out.FD_connect = false;
  AutopilotStateMachine_B.out.TCAS_sub_mode = NONE;
  AutopilotStateMachine_B.out.TCAS_sub_mode_compatible = false;
  AutopilotStateMachine_B.out.TCAS_message_disarm = false;
  AutopilotStateMachine_B.out.TCAS_message_RA_inhibit = false;
  AutopilotStateMachine_B.out.TCAS_message_TRK_FPA_deselection = false;
}

void AutopilotStateMachineModelClass::terminate()
{
}

AutopilotStateMachineModelClass::AutopilotStateMachineModelClass():
  AutopilotStateMachine_U(),
  AutopilotStateMachine_Y(),
  AutopilotStateMachine_B(),
  AutopilotStateMachine_DWork()
{
}

AutopilotStateMachineModelClass::~AutopilotStateMachineModelClass()
{
}
