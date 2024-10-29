#include "AutopilotStateMachine.h"
#include "rtwtypes.h"
#include "AutopilotStateMachine_types.h"
#include <cmath>
#include "mod_OlzklkXq.h"
#include "multiword_types.h"
#include "rt_remd.h"
#include "AutopilotStateMachine_private.h"
#include "Double2MultiWord.h"
#include "MultiWordIor.h"
#include "uMultiWord2Double.h"

const real_T AutopilotStateMachine_N{ 1.0 };

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

const real_T AutopilotStateMachine_N_c{ 2.0 };

const real_T AutopilotStateMachine_N_a{ 3.0 };

const real_T AutopilotStateMachine_N_j{ 4.0 };

const real_T AutopilotStateMachine_N_k{ 5.0 };

const real_T AutopilotStateMachine_N_kp{ 6.0 };

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

const uint8_T AutopilotStateMachine_IN_LAND_d{ 4U };

const uint8_T AutopilotStateMachine_IN_OFF_o{ 1U };

const uint8_T AutopilotStateMachine_IN_ON_g{ 2U };

const uint8_T AutopilotStateMachine_IN_OP_CLB{ 9U };

const uint8_T AutopilotStateMachine_IN_OP_DES{ 10U };

const uint8_T AutopilotStateMachine_IN_SRS{ 11U };

const uint8_T AutopilotStateMachine_IN_SRS_GA{ 3U };

const uint8_T AutopilotStateMachine_IN_TCAS{ 4U };

const uint8_T AutopilotStateMachine_IN_VS{ 12U };

void AutopilotStateMachine::AutopilotStateMachine_BitShift(real_T rtu_u, real_T *rty_y)
{
  *rty_y = std::ldexp(rtu_u, 0);
}

void AutopilotStateMachine::AutopilotStateMachine_BitShift1(real_T rtu_u, real_T *rty_y)
{
  *rty_y = std::ldexp(rtu_u, static_cast<int32_T>(AutopilotStateMachine_N));
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_X_TO_OFF(const ap_sm_output *BusAssignment)
{
  return ((!BusAssignment->input.FD_active) && (BusAssignment->output.enabled_AP1 == 0.0) &&
          (BusAssignment->output.enabled_AP2 == 0.0)) || ((BusAssignment->data.flight_phase == 7.0) &&
    (BusAssignment->output.enabled_AP1 == 0.0) && (BusAssignment->output.enabled_AP2 == 0.0));
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_X_TO_GA_TRK(const ap_sm_output *BusAssignment)
{
  return BusAssignment->lateral.condition.GA_TRACK;
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_ON_TO_HDG(const ap_sm_output *BusAssignment)
{
  return BusAssignment->input.HDG_pull;
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_ON_TO_NAV(const ap_sm_output *BusAssignment)
{
  return BusAssignment->lateral.condition.NAV && (BusAssignment->lateral.armed.NAV || BusAssignment->input.HDG_push ||
    BusAssignment->input.DIR_TO_trigger);
}

void AutopilotStateMachine::AutopilotStateMachine_NAV_entry(void)
{
  AutopilotStateMachine_B.out_g.mode = lateral_mode::NAV;
  AutopilotStateMachine_B.out_g.law = lateral_law::HPATH;
}

void AutopilotStateMachine::AutopilotStateMachine_HDG_entry(const ap_sm_output *BusAssignment)
{
  if (BusAssignment->input.TRK_FPA_mode) {
    AutopilotStateMachine_B.out_g.mode = lateral_mode::TRACK;
    AutopilotStateMachine_B.out_g.law = lateral_law::TRACK;
  } else {
    AutopilotStateMachine_B.out_g.mode = lateral_mode::HDG;
    AutopilotStateMachine_B.out_g.law = lateral_law::HDG;
  }
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_ON_TO_LOC(const ap_sm_output *BusAssignment)
{
  return BusAssignment->lateral.armed.LOC && BusAssignment->lateral.condition.LOC_CPT;
}

void AutopilotStateMachine::AutopilotStateMachine_HDG_during(const ap_sm_output *BusAssignment)
{
  AutopilotStateMachine_B.out_g.mode_reversion = false;
  AutopilotStateMachine_B.out_g.Psi_c_deg = BusAssignment->input.Psi_fcu_deg;
  if (BusAssignment->input.TRK_FPA_mode) {
    AutopilotStateMachine_B.out_g.mode = lateral_mode::TRACK;
    AutopilotStateMachine_B.out_g.law = lateral_law::TRACK;
  } else {
    AutopilotStateMachine_B.out_g.mode = lateral_mode::HDG;
    AutopilotStateMachine_B.out_g.law = lateral_law::HDG;
  }
}

void AutopilotStateMachine::AutopilotStateMachine_LOC_CPT_entry(void)
{
  AutopilotStateMachine_B.out_g.mode = lateral_mode::LOC_CPT;
  AutopilotStateMachine_B.out_g.law = lateral_law::LOC_CPT;
}

void AutopilotStateMachine::AutopilotStateMachine_OFF_entry(void)
{
  AutopilotStateMachine_B.out_g.mode = lateral_mode::NONE;
  AutopilotStateMachine_B.out_g.law = lateral_law::NONE;
}

void AutopilotStateMachine::AutopilotStateMachine_ROLL_OUT_entry(void)
{
  AutopilotStateMachine_B.out_g.mode = lateral_mode::ROLL_OUT;
  AutopilotStateMachine_B.out_g.law = lateral_law::ROLL_OUT;
}

void AutopilotStateMachine::AutopilotStateMachine_FLARE_entry(void)
{
  AutopilotStateMachine_B.out_g.mode = lateral_mode::FLARE;
  AutopilotStateMachine_B.out_g.law = lateral_law::LOC_TRACK;
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_LOC_TO_X(const ap_sm_output *BusAssignment)
{
  boolean_T isGsArmedOrActive;
  isGsArmedOrActive = (BusAssignment->vertical_previous.armed.GS || (BusAssignment->vertical_previous.output.mode ==
    vertical_mode::GS_CPT) || (BusAssignment->vertical_previous.output.mode == vertical_mode::GS_TRACK));
  return (BusAssignment->input.LOC_push && (!isGsArmedOrActive)) || (BusAssignment->input.APPR_push && isGsArmedOrActive);
}

void AutopilotStateMachine::AutopilotStateMachine_LOC_TRACK_entry(void)
{
  AutopilotStateMachine_B.out_g.mode = lateral_mode::LOC_TRACK;
  AutopilotStateMachine_B.out_g.law = lateral_law::LOC_TRACK;
}

void AutopilotStateMachine::AutopilotStateMachine_LAND_entry(void)
{
  AutopilotStateMachine_B.out_g.mode = lateral_mode::LAND;
  AutopilotStateMachine_B.out_g.law = lateral_law::LOC_TRACK;
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_NAV_TO_HDG(const ap_sm_output *BusAssignment)
{
  boolean_T y;
  y = (BusAssignment->input.HDG_pull || (!BusAssignment->lateral.condition.NAV) ||
       (AutopilotStateMachine_DWork.prev_FDES_active && (BusAssignment->vertical_previous.output.mode != vertical_mode::
         FINAL_DES) && (BusAssignment->vertical_previous.output.mode != vertical_mode::TCAS)) ||
       (AutopilotStateMachine_DWork.prev_FDES_armed && (!BusAssignment->vertical_previous.armed.FINAL_DES) &&
        (BusAssignment->vertical_previous.output.mode != vertical_mode::FINAL_DES)));
  AutopilotStateMachine_DWork.prev_FDES_active = (BusAssignment->vertical_previous.output.mode == vertical_mode::
    FINAL_DES);
  AutopilotStateMachine_DWork.prev_FDES_armed = BusAssignment->vertical_previous.armed.FINAL_DES;
  AutopilotStateMachine_DWork.prev_FDES_armed = ((!BusAssignment->input.HDG_pull) &&
    AutopilotStateMachine_DWork.prev_FDES_armed);
  return y;
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_RWY_TO_RWY_TRK(const ap_sm_output *BusAssignment)
{
  real_T R;
  real_T b_y_tmp;
  real_T x;
  x = (BusAssignment->data.Psi_magnetic_deg - (BusAssignment->data.nav_loc_deg + 360.0)) + 360.0;
  if (x == 0.0) {
    x = 0.0;
  } else {
    x = std::fmod(x, 360.0);
    if (x == 0.0) {
      x = 0.0;
    } else if (x < 0.0) {
      x += 360.0;
    }
  }

  b_y_tmp = std::abs(-x);
  if (360.0 - b_y_tmp == 0.0) {
    R = 0.0;
  } else {
    R = std::fmod(360.0 - b_y_tmp, 360.0);
  }

  if (b_y_tmp < R) {
    R = -x;
  }

  return ((BusAssignment->data.H_radio_ft >= 30.0) && (!BusAssignment->lateral.armed.NAV)) ||
    (!BusAssignment->data.nav_loc_valid) || (std::abs(R) > 20.0);
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_RWY_TO_OFF(const ap_sm_output *BusAssignment)
{
  real_T R;
  real_T b_y_tmp;
  real_T x;
  x = (BusAssignment->data.Psi_magnetic_deg - (BusAssignment->data.nav_loc_deg + 360.0)) + 360.0;
  if (x == 0.0) {
    x = 0.0;
  } else {
    x = std::fmod(x, 360.0);
    if (x == 0.0) {
      x = 0.0;
    } else if (x < 0.0) {
      x += 360.0;
    }
  }

  b_y_tmp = std::abs(-x);
  if (360.0 - b_y_tmp == 0.0) {
    R = 0.0;
  } else {
    R = std::fmod(360.0 - b_y_tmp, 360.0);
  }

  if (b_y_tmp < R) {
    R = -x;
  }

  return (!BusAssignment->data.nav_valid) && (std::abs(R) > 20.0);
}

void AutopilotStateMachine::AutopilotStateMachine_RWY_TRK_entry(const ap_sm_output *BusAssignment)
{
  AutopilotStateMachine_B.out_g.mode = lateral_mode::RWY_TRACK;
  AutopilotStateMachine_B.out_g.law = lateral_law::TRACK;
  AutopilotStateMachine_B.out_g.Psi_c_deg = BusAssignment->data.Psi_magnetic_track_deg;
}

void AutopilotStateMachine::AutopilotStateMachine_GA_TRK_entry(const ap_sm_output *BusAssignment)
{
  AutopilotStateMachine_B.out_g.mode = lateral_mode::GA_TRACK;
  AutopilotStateMachine_B.out_g.law = lateral_law::TRACK;
  AutopilotStateMachine_B.out_g.Psi_c_deg = BusAssignment->data.Psi_magnetic_track_deg;
}

void AutopilotStateMachine::AutopilotStateMachine_ON(const ap_sm_output *BusAssignment)
{
  boolean_T guard1;
  boolean_T guard2;
  if (AutopilotStateMachine_X_TO_OFF(BusAssignment)) {
    AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_OFF;
    AutopilotStateMachine_OFF_entry();
  } else if (AutopilotStateMachine_X_TO_GA_TRK(BusAssignment)) {
    AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
    AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_GA_TRK;
    AutopilotStateMachine_GA_TRK_entry(BusAssignment);
  } else {
    guard1 = false;
    guard2 = false;
    switch (AutopilotStateMachine_DWork.is_ON_j) {
     case AutopilotStateMachine_IN_HDG:
      if (AutopilotStateMachine_ON_TO_NAV(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NAV;
        AutopilotStateMachine_NAV_entry();
      } else if (AutopilotStateMachine_ON_TO_LOC(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_LOC;
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
          AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_HDG;
          AutopilotStateMachine_HDG_entry(BusAssignment);
        } else if (AutopilotStateMachine_ON_TO_NAV(BusAssignment)) {
          AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
          AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NAV;
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
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_HDG;
        AutopilotStateMachine_HDG_entry(BusAssignment);
      } else if (AutopilotStateMachine_ON_TO_LOC(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_LOC;
        AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_LOC_CPT;
        AutopilotStateMachine_LOC_CPT_entry();
      }
      break;

     case AutopilotStateMachine_IN_RWY:
      if (AutopilotStateMachine_RWY_TO_RWY_TRK(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_RWY_TRK;
        AutopilotStateMachine_RWY_TRK_entry(BusAssignment);
      } else if (AutopilotStateMachine_ON_TO_HDG(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_HDG;
        AutopilotStateMachine_HDG_entry(BusAssignment);
      } else if (AutopilotStateMachine_ON_TO_NAV(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NAV;
        AutopilotStateMachine_NAV_entry();
      } else if (AutopilotStateMachine_RWY_TO_OFF(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_OFF;
        AutopilotStateMachine_OFF_entry();
      }
      break;

     default:
      if (AutopilotStateMachine_ON_TO_HDG(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_HDG;
        AutopilotStateMachine_HDG_entry(BusAssignment);
      } else if (AutopilotStateMachine_ON_TO_NAV(BusAssignment)) {
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NAV;
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
            AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_HDG;
            AutopilotStateMachine_HDG_entry(BusAssignment);
          } else if (BusAssignment->data.on_ground != 0.0) {
            AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
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
            AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_HDG;
            AutopilotStateMachine_HDG_entry(BusAssignment);
          } else if (BusAssignment->data.on_ground != 0.0) {
            AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_OFF;
            AutopilotStateMachine_OFF_entry();
          }
        }
        break;

       default:
        if (!BusAssignment->lateral.condition.ROLL_OUT) {
          if (BusAssignment->data.on_ground == 0.0) {
            AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_HDG;
            AutopilotStateMachine_HDG_entry(BusAssignment);
          } else if (BusAssignment->data.on_ground != 0.0) {
            AutopilotStateMachine_DWork.is_LOC = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
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

boolean_T AutopilotStateMachine::AutopilotStateMachine_OFF_TO_HDG(const ap_sm_output *BusAssignment)
{
  return (BusAssignment->data_computed.time_since_lift_off >= 5.0) && (BusAssignment->input.FD_active ||
    (BusAssignment->output.enabled_AP1 != 0.0) || (BusAssignment->output.enabled_AP2 != 0.0)) &&
    (BusAssignment->input.HDG_pull || (!BusAssignment->lateral.armed.NAV));
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_OFF_TO_NAV(const ap_sm_output *BusAssignment)
{
  return (BusAssignment->input.FD_active || (BusAssignment->output.enabled_AP1 != 0.0) ||
          (BusAssignment->output.enabled_AP2 != 0.0)) && BusAssignment->lateral.armed.NAV &&
    BusAssignment->lateral.condition.NAV;
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_OFF_TO_RWY(const ap_sm_output *BusAssignment)
{
  real_T R;
  real_T b_y_tmp;
  real_T x;
  boolean_T y;
  x = (BusAssignment->data.Psi_magnetic_deg - (BusAssignment->data.nav_loc_deg + 360.0)) + 360.0;
  if (x == 0.0) {
    x = 0.0;
  } else {
    x = std::fmod(x, 360.0);
    if (x == 0.0) {
      x = 0.0;
    } else if (x < 0.0) {
      x += 360.0;
    }
  }

  b_y_tmp = std::abs(-x);
  if (360.0 - b_y_tmp == 0.0) {
    R = 0.0;
  } else {
    R = std::fmod(360.0 - b_y_tmp, 360.0);
  }

  if ((BusAssignment->input.FD_active || (BusAssignment->output.enabled_AP1 != 0.0) ||
       (BusAssignment->output.enabled_AP2 != 0.0)) && (BusAssignment->data.V2_kn >= 90.0) &&
      (BusAssignment->data.flaps_handle_index >= 1.0) && (BusAssignment->data_computed.time_since_touchdown >= 30.0) &&
      ((BusAssignment->data.throttle_lever_1_pos >= 35.0) || (BusAssignment->data.throttle_lever_2_pos >= 35.0)) &&
      BusAssignment->data.nav_loc_valid) {
    if (std::abs(BusAssignment->data.nav_loc_error_deg) <= 0.4) {
      if (b_y_tmp < R) {
        R = -x;
      }

      if (std::abs(R) <= 20.0) {
        if (!AutopilotStateMachine_DWork.eventTime_not_empty) {
          AutopilotStateMachine_DWork.eventTime = BusAssignment->time.simulation_time;
          AutopilotStateMachine_DWork.eventTime_not_empty = true;
        }

        if ((BusAssignment->vertical_previous.output.mode != vertical_mode::SRS) ||
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

boolean_T AutopilotStateMachine::AutopilotStateMachine_OFF_TO_RWY_TRK(const ap_sm_output *BusAssignment)
{
  return (BusAssignment->input.FD_active || (BusAssignment->output.enabled_AP1 != 0.0) ||
          (BusAssignment->output.enabled_AP2 != 0.0)) && ((!BusAssignment->lateral.armed.NAV) ||
    (BusAssignment->lateral.armed.NAV && (!BusAssignment->lateral.condition.NAV))) && (BusAssignment->data.H_radio_ft >=
    30.0) && (BusAssignment->data.H_radio_ft < 100.0);
}

void AutopilotStateMachine::AutopilotStateMachine_RWY_entry(void)
{
  AutopilotStateMachine_B.out_g.mode = lateral_mode::RWY;
  AutopilotStateMachine_B.out_g.law = lateral_law::ROLL_OUT;
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_TCAS_TO_ALT(void) const
{
  return ((!AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_available) ||
          AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_fail ||
          (AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_state < 2.0)) &&
    ((AutopilotStateMachine_B.out.TCAS_sub_mode == tcas_sub_mode::ALT) ||
     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT);
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_TCAS_TO_ALT_CPT(void) const
{
  return ((!AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_available) ||
          AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_fail ||
          (AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_state < 2.0)) &&
    ((AutopilotStateMachine_B.out.TCAS_sub_mode == tcas_sub_mode::ALT_CPT) ||
     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT);
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_TCAS_TO_VS(void) const
{
  return ((!AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_available) ||
          AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_fail ||
          (AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_state < 2.0)) &&
    (AutopilotStateMachine_B.out.TCAS_sub_mode == tcas_sub_mode::NONE) &&
    (!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT) &&
    (!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT);
}

void AutopilotStateMachine::AutopilotStateMachine_updateTcasTargetVerticalSpeed(boolean_T isEntry)
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
    real_T u;
    int32_T correction_sign;
    u = target_max + target_min;
    if (u < 0.0) {
      correction_sign = -1;
    } else {
      correction_sign = (u > 0.0);
    }

    if (correction_sign == 0) {
      AutopilotStateMachine_DWork.local_TCAS_target_fpm = 0.0;
    } else {
      int32_T tmp;
      if (target_min < 0.0) {
        tmp = -1;
      } else {
        tmp = (target_min > 0.0);
      }

      AutopilotStateMachine_DWork.local_TCAS_target_fpm = static_cast<real_T>(tmp) * std::fmin(std::abs(target_min), std::
        abs(target_max)) + static_cast<real_T>(correction_sign) * 200.0;
    }
  } else if (isEntry || AutopilotStateMachine_DWork.local_TCAS_is_corrective) {
    AutopilotStateMachine_DWork.local_TCAS_target_fpm = std::round
      (AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min / 100.0) * 100.0;
  }

  AutopilotStateMachine_DWork.local_TCAS_target_fpm = std::fmax(std::fmin
    (AutopilotStateMachine_DWork.local_TCAS_target_fpm, target_max), target_min);
  AutopilotStateMachine_DWork.local_TCAS_is_corrective = isCorrective;
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_getTcasSubModeCompatibility(void) const
{
  real_T target_max;
  real_T target_min;
  target_min = std::fmin(AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_min_fpm,
    AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_max_fpm);
  target_max = std::fmax(AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_min_fpm,
    AutopilotStateMachine_B.BusAssignment_g.input.TCAS_advisory_target_max_fpm);
  return (AutopilotStateMachine_DWork.local_TCAS_target_fpm <= target_max) &&
    (AutopilotStateMachine_DWork.local_TCAS_target_fpm >= target_min) && (target_min <= 0.0) && (target_max >= 0.0);
}

void AutopilotStateMachine::AutopilotStateMachine_TCAS_during(void)
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
  if ((AutopilotStateMachine_B.out.TCAS_sub_mode == tcas_sub_mode::NONE) &&
      AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT &&
      AutopilotStateMachine_B.out.TCAS_sub_mode_compatible) {
    AutopilotStateMachine_B.out.TCAS_sub_mode = tcas_sub_mode::ALT_CPT;
    AutopilotStateMachine_DWork.local_TCAS_target_fpm = 0.0;
  } else if ((AutopilotStateMachine_B.out.TCAS_sub_mode == tcas_sub_mode::ALT_CPT) &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT &&
             AutopilotStateMachine_B.out.TCAS_sub_mode_compatible) {
    AutopilotStateMachine_B.out.TCAS_sub_mode = tcas_sub_mode::ALT;
  } else if (!AutopilotStateMachine_B.out.TCAS_sub_mode_compatible) {
    AutopilotStateMachine_B.out.TCAS_sub_mode = tcas_sub_mode::NONE;
  } else if ((AutopilotStateMachine_B.out.TCAS_sub_mode == tcas_sub_mode::ALT_CPT) && (std::abs
              (AutopilotStateMachine_DWork.local_H_fcu_ft - AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft) >
              250.0)) {
    AutopilotStateMachine_B.out.TCAS_sub_mode = tcas_sub_mode::NONE;
  }

  AutopilotStateMachine_B.out.mode = vertical_mode::TCAS;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  switch (AutopilotStateMachine_B.out.TCAS_sub_mode) {
   case tcas_sub_mode::ALT_CPT:
    AutopilotStateMachine_DWork.local_H_fcu_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    AutopilotStateMachine_B.out.law = vertical_law::ALT_ACQ;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    break;

   case tcas_sub_mode::ALT:
    AutopilotStateMachine_B.out.law = vertical_law::ALT_HOLD;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    break;

   default:
    AutopilotStateMachine_B.out.law = vertical_law::VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_DWork.local_TCAS_target_fpm;
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
    break;
  }
}

void AutopilotStateMachine::AutopilotStateMachine_TCAS_exit(void)
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

void AutopilotStateMachine::AutopilotStateMachine_OFF_entry_i(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::NONE;
  AutopilotStateMachine_B.out.law = vertical_law::NONE;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
}

void AutopilotStateMachine::AutopilotStateMachine_DES_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::DES;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  switch (AutopilotStateMachine_B.BusAssignment_g.input.FM_requested_vertical_mode) {
   case fm_requested_vertical_mode::NONE:
    if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
    } else {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    }

    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law::SPD_MACH;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
    break;

   case fm_requested_vertical_mode::SPEED_THRUST:
    if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
    } else {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    }

    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law::SPD_MACH;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
    break;

   case fm_requested_vertical_mode::VPATH_SPEED:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
    AutopilotStateMachine_B.out.law = vertical_law::VPATH;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   case fm_requested_vertical_mode::FPA_SPEED:
    if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
    } else {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    }

    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
    AutopilotStateMachine_B.out.law = vertical_law::FPA;
    AutopilotStateMachine_B.out.FPA_c_deg = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   case fm_requested_vertical_mode::VS_SPEED:
    if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
    } else {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    }

    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
    AutopilotStateMachine_B.out.law = vertical_law::VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   default:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law::VPATH;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;
  }
}

void AutopilotStateMachine::AutopilotStateMachine_CLB_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::CLB;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_CLB;
  AutopilotStateMachine_B.out.law = vertical_law::SPD_MACH;
  AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
}

void AutopilotStateMachine::AutopilotStateMachine_OP_CLB_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::OP_CLB;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft -
               AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft) <= 1200.0) {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
    AutopilotStateMachine_B.out.law = vertical_law::VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 1000.0;
  } else {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_CLB;
    AutopilotStateMachine_B.out.law = vertical_law::SPD_MACH;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
  }

  AutopilotStateMachine_B.out.EXPED_mode_active = AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push;
}

void AutopilotStateMachine::AutopilotStateMachine_OP_DES_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::OP_DES;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_IDLE;
  AutopilotStateMachine_B.out.law = vertical_law::SPD_MACH;
  AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
  AutopilotStateMachine_B.out.EXPED_mode_active = AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push;
}

void AutopilotStateMachine::AutopilotStateMachine_FINAL_DES_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::FINAL_DES;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  AutopilotStateMachine_B.out.law = vertical_law::VPATH;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
  AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
}

void AutopilotStateMachine::AutopilotStateMachine_GS_CPT_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::GS_CPT;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  AutopilotStateMachine_B.out.law = vertical_law::GS;
}

void AutopilotStateMachine::AutopilotStateMachine_TCAS_TO_VS_Action(void)
{
  AutopilotStateMachine_B.out.mode_reversion = true;
  if (AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_available &&
      (!AutopilotStateMachine_B.BusAssignment_g.input.TCAS_mode_fail)) {
    if (AutopilotStateMachine_DWork.local_TCAS_is_corrective) {
      real_T u;
      int32_T tmp;
      u = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft - AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
      if (u < 0.0) {
        tmp = -1;
      } else {
        tmp = (u > 0.0);
      }

      AutopilotStateMachine_B.out.mode_reversion_target_fpm = 1000.0 * static_cast<real_T>(tmp);
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

void AutopilotStateMachine::AutopilotStateMachine_VS_entry(void)
{
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  if (AutopilotStateMachine_B.BusAssignment_g.input.TRK_FPA_mode) {
    AutopilotStateMachine_B.out.mode = vertical_mode::FPA;
    AutopilotStateMachine_B.out.law = vertical_law::FPA;
  } else {
    AutopilotStateMachine_B.out.mode = vertical_mode::VS;
    AutopilotStateMachine_B.out.law = vertical_law::VS;
  }

  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.H_dot_fcu_fpm;
  AutopilotStateMachine_B.out.FPA_c_deg = AutopilotStateMachine_B.BusAssignment_g.input.FPA_fcu_deg;
  if (AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
    AutopilotStateMachine_B.out.H_dot_c_fpm = std::round(AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min /
      100.0) * 100.0;
  }
}

void AutopilotStateMachine::AutopilotStateMachine_ALT_CPT_entry(void)
{
  AutopilotStateMachine_DWork.local_H_fcu_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  AutopilotStateMachine_B.out.mode = vertical_mode::ALT_CPT;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  AutopilotStateMachine_B.out.law = vertical_law::ALT_ACQ;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
}

void AutopilotStateMachine::AutopilotStateMachine_ALT_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::ALT;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  AutopilotStateMachine_B.out.law = vertical_law::ALT_HOLD;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  AutopilotStateMachine_B.out.ALT_cruise_mode_active = (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft -
    AutopilotStateMachine_B.BusAssignment_g.data.cruise_altitude) < 60.0);
  AutopilotStateMachine_B.out.ALT_soft_mode_active = AutopilotStateMachine_B.BusAssignment_g.data_computed.ALT_soft_mode;
}

void AutopilotStateMachine::AutopilotStateMachine_TCAS(void)
{
  real_T tmp_0;
  boolean_T guard1;
  boolean_T tmp;
  if (AutopilotStateMachine_TCAS_TO_ALT() && AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT) {
    AutopilotStateMachine_TCAS_exit();
    AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT;
    AutopilotStateMachine_ALT_entry();
  } else if (AutopilotStateMachine_TCAS_TO_ALT_CPT()) {
    AutopilotStateMachine_TCAS_exit();
    AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
    AutopilotStateMachine_ALT_CPT_entry();
  } else {
    guard1 = false;
    if (AutopilotStateMachine_TCAS_TO_VS()) {
      AutopilotStateMachine_TCAS_TO_VS_Action();
      guard1 = true;
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
      AutopilotStateMachine_TCAS_exit();
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
      AutopilotStateMachine_GS_CPT_entry();
    } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
      AutopilotStateMachine_TCAS_exit();
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
      AutopilotStateMachine_FINAL_DES_entry();
    } else {
      tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
              AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
      tmp_0 = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
        AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
      if (tmp && (tmp_0 < -40.0)) {
        AutopilotStateMachine_TCAS_exit();
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
        AutopilotStateMachine_OP_DES_entry();
      } else if (tmp && (tmp_0 > 40.0)) {
        AutopilotStateMachine_TCAS_exit();
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
        AutopilotStateMachine_OP_CLB_entry();
      } else {
        tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (std::abs
                (AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                 AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 40.0));
        if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
            AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
            AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
          AutopilotStateMachine_TCAS_exit();
          AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
          AutopilotStateMachine_CLB_entry();
        } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
          AutopilotStateMachine_TCAS_exit();
          AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
          AutopilotStateMachine_DES_entry();
        } else if ((!AutopilotStateMachine_B.out.FD_connect) &&
                   (((!AutopilotStateMachine_B.BusAssignment_g.input.FD_active) &&
                     (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 == 0.0) &&
                     (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0)) ||
                    ((AutopilotStateMachine_B.BusAssignment_g.data.flight_phase == 7.0) &&
                     (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 == 0.0) &&
                     (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0)))) {
          AutopilotStateMachine_TCAS_exit();
          AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_o;
          AutopilotStateMachine_OFF_entry_i();
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
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
      AutopilotStateMachine_VS_entry();
    }
  }
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_X_TO_TCAS(void) const
{
  return AutopilotStateMachine_B.BusAssignment_g.vertical.condition.TCAS;
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_X_TO_SRS_GA(void) const
{
  return AutopilotStateMachine_B.BusAssignment_g.vertical.condition.SRS_GA;
}

void AutopilotStateMachine::AutopilotStateMachine_OFF_during(void)
{
  if (AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.FD_disconnect &&
      (!AutopilotStateMachine_B.BusAssignment_g.input.FD_active)) {
    AutopilotStateMachine_B.out.FD_disconnect = false;
  }
}

void AutopilotStateMachine::AutopilotStateMachine_SRS_GA_entry(void)
{
  AutopilotStateMachine_DWork.local_H_GA_init_ft = AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
  AutopilotStateMachine_B.out.mode = vertical_mode::SRS_GA;
  AutopilotStateMachine_B.out.law = vertical_law::SRS;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_CLB;
  AutopilotStateMachine_B.out.mode_reversion_TRK_FPA = true;
  if (AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_1 &&
      AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_2) {
    AutopilotStateMachine_B.out.V_c_kn = std::fmin(AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn + 25.0, std::fmax
      (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn, AutopilotStateMachine_B.BusAssignment_g.data.VAPP_kn));
  } else {
    AutopilotStateMachine_B.out.V_c_kn = std::fmin(AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn + 15.0, std::fmax
      (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn, AutopilotStateMachine_B.BusAssignment_g.data.VAPP_kn));
  }
}

void AutopilotStateMachine::AutopilotStateMachine_X_TO_TCAS_Action(void)
{
  AutopilotStateMachine_B.out.FD_connect = true;
}

void AutopilotStateMachine::AutopilotStateMachine_TCAS_entry(void)
{
  if (AutopilotStateMachine_B.BusAssignment_g.input.TRK_FPA_mode) {
    AutopilotStateMachine_B.out.mode_reversion_TRK_FPA = true;
    AutopilotStateMachine_DWork.local_TCAS_TRK_FPA_Reverted = true;
  } else {
    AutopilotStateMachine_DWork.local_TCAS_TRK_FPA_Reverted = false;
  }

  AutopilotStateMachine_updateTcasTargetVerticalSpeed(true);
  AutopilotStateMachine_B.out.TCAS_sub_mode = tcas_sub_mode::NONE;
  AutopilotStateMachine_B.out.TCAS_sub_mode_compatible = true;
  AutopilotStateMachine_B.out.TCAS_message_RA_inhibit = false;
  if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB ||
      AutopilotStateMachine_B.BusAssignment_g.vertical.armed.DES ||
      AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS ||
      AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES) {
    AutopilotStateMachine_B.out.TCAS_message_disarm = true;
  }

  AutopilotStateMachine_B.out.mode = vertical_mode::TCAS;
  AutopilotStateMachine_B.out.law = vertical_law::VS;
  AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_DWork.local_TCAS_target_fpm;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  AutopilotStateMachine_B.out.TCAS_message_TRK_FPA_deselection = false;
}

void AutopilotStateMachine::AutopilotStateMachine_SRS_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::SRS;
  AutopilotStateMachine_B.out.law = vertical_law::SRS;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_CLB;
  if (AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_1 &&
      AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_2) {
    AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.data.V2_kn + 10.0;
  } else {
    AutopilotStateMachine_B.out.V_c_kn = std::fmin(AutopilotStateMachine_B.BusAssignment_g.data.V2_kn + 15.0, std::fmax
      (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn, AutopilotStateMachine_B.BusAssignment_g.data.V2_kn));
  }
}

void AutopilotStateMachine::AutopilotStateMachine_VS_during(void)
{
  real_T b_x;
  real_T targetVS;
  int8_T n;
  boolean_T isAutopilotEngaged;
  if (AutopilotStateMachine_B.BusAssignment_g.input.TRK_FPA_mode) {
    AutopilotStateMachine_B.out.mode = vertical_mode::FPA;
    AutopilotStateMachine_B.out.law = vertical_law::FPA;
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
    AutopilotStateMachine_B.out.mode = vertical_mode::VS;
    AutopilotStateMachine_B.out.law = vertical_law::VS;
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

void AutopilotStateMachine::AutopilotStateMachine_VS(void)
{
  real_T tmp_0;
  boolean_T tmp;
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
    tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
            AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
           AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
    tmp_0 = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
      AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
    if (tmp && (tmp_0 < -40.0)) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
      AutopilotStateMachine_OP_DES_entry();
    } else if (tmp && (tmp_0 > 40.0)) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
      AutopilotStateMachine_OP_CLB_entry();
    } else {
      tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (std::abs
              (AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
               AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 40.0));
      if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
        AutopilotStateMachine_CLB_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
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

void AutopilotStateMachine::AutopilotStateMachine_ALT_during(void)
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
    AutopilotStateMachine_B.out.law = vertical_law::ALT_HOLD;
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
    AutopilotStateMachine_B.out.law = vertical_law::VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
  }

  AutopilotStateMachine_B.out.ALT_cruise_mode_active = (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft -
    AutopilotStateMachine_B.BusAssignment_g.data.cruise_altitude) < 60.0);
  AutopilotStateMachine_B.out.ALT_soft_mode_active = AutopilotStateMachine_B.BusAssignment_g.data_computed.ALT_soft_mode;
  AutopilotStateMachine_DWork.prevNumberofAutopilotsEngaged = numberofAutopilotsEngaged;
}

void AutopilotStateMachine::AutopilotStateMachine_ALT_exit(void)
{
  AutopilotStateMachine_B.out.ALT_cruise_mode_active = false;
  AutopilotStateMachine_B.out.ALT_soft_mode_active = false;
}

void AutopilotStateMachine::AutopilotStateMachine_ALT_CST_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::ALT_CST;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  AutopilotStateMachine_B.out.law = vertical_law::ALT_HOLD;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
}

void AutopilotStateMachine::AutopilotStateMachine_ALT(void)
{
  real_T tmp_0;
  boolean_T tmp;
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
    tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
            AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
           AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
    tmp_0 = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
      AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
    if (tmp && (tmp_0 < -40.0)) {
      AutopilotStateMachine_ALT_exit();
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
      AutopilotStateMachine_OP_DES_entry();
    } else if (tmp && (tmp_0 > 40.0)) {
      AutopilotStateMachine_ALT_exit();
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
      AutopilotStateMachine_OP_CLB_entry();
    } else {
      tmp_0 = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                       AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
      tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (tmp_0 > 40.0));
      if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
        AutopilotStateMachine_ALT_exit();
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
        AutopilotStateMachine_CLB_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
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
                 (AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft != 0.0) && (tmp_0 < 50.0)) {
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

void AutopilotStateMachine::AutopilotStateMachine_ALT_CPT_during(void)
{
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
}

void AutopilotStateMachine::AutopilotStateMachine_ALT_CST(void)
{
  real_T tmp;
  boolean_T guard1;
  boolean_T guard2;
  boolean_T guard3;
  boolean_T guard4;
  boolean_T tmp_0;
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
        if (tmp > 40.0) {
          guard1 = true;
        } else if (tmp < -40.0) {
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
        tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                  AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
        tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
          AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
        if (tmp_0 && (tmp < -40.0)) {
          guard2 = true;
        } else if (tmp_0 && (tmp > 40.0)) {
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

void AutopilotStateMachine::AutopilotStateMachine_ALT_CST_CPT(void)
{
  real_T tmp_0;
  boolean_T guard1;
  boolean_T guard2;
  boolean_T guard3;
  boolean_T guard4;
  boolean_T guard5;
  boolean_T guard6;
  boolean_T tmp;
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
    tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
            AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
           AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
    tmp_0 = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
      AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
    guard1 = false;
    guard2 = false;
    guard3 = false;
    guard4 = false;
    guard5 = false;
    guard6 = false;
    if (tmp && (tmp_0 < -40.0)) {
      guard1 = true;
    } else if (tmp && (tmp_0 > 40.0)) {
      guard2 = true;
    } else {
      tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (std::abs
              (AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
               AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 40.0));
      if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
        guard3 = true;
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
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
        if (tmp_0 > 40.0) {
          guard2 = true;
        } else if (tmp_0 < -40.0) {
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

void AutopilotStateMachine::AutopilotStateMachine_CLB_during(void)
{
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
  } else {
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  }
}

void AutopilotStateMachine::AutopilotStateMachine_ALT_CST_CPT_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::ALT_CST_CPT;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  AutopilotStateMachine_B.out.law = vertical_law::ALT_ACQ;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
}

void AutopilotStateMachine::AutopilotStateMachine_CLB(void)
{
  real_T tmp_0;
  boolean_T guard1;
  boolean_T guard2;
  boolean_T guard3;
  boolean_T tmp;
  if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST_CPT) {
    AutopilotStateMachine_DWork.local_H_constraint_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CST_CPT;
    AutopilotStateMachine_ALT_CST_CPT_entry();
  } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT) {
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
    AutopilotStateMachine_ALT_CPT_entry();
  } else {
    guard1 = false;
    guard2 = false;
    guard3 = false;
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
      tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
              AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
      tmp_0 = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
        AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
      if (tmp && (tmp_0 < -40.0)) {
        guard2 = true;
      } else if (tmp && (tmp_0 > 40.0)) {
        guard3 = true;
      } else if ((AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft <
                  AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) && (std::abs(tmp_0) > 40.0)) {
        AutopilotStateMachine_B.out.mode_reversion = true;
        AutopilotStateMachine_B.out.mode_reversion_target_fpm =
          AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
        guard1 = true;
      } else if ((!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB) && (tmp_0 > 40.0)) {
        AutopilotStateMachine_B.out.mode_reversion = true;
        AutopilotStateMachine_B.out.mode_reversion_target_fpm =
          AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
        if (tmp_0 > 40.0) {
          guard3 = true;
        } else if (tmp_0 < -40.0) {
          guard2 = true;
        } else {
          AutopilotStateMachine_CLB_during();
        }
      } else {
        AutopilotStateMachine_CLB_during();
      }
    }

    if (guard3) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
      AutopilotStateMachine_OP_CLB_entry();
    }

    if (guard2) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
      AutopilotStateMachine_OP_DES_entry();
    }

    if (guard1) {
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
      AutopilotStateMachine_VS_entry();
    }
  }
}

void AutopilotStateMachine::AutopilotStateMachine_DES_during(void)
{
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  switch (AutopilotStateMachine_B.BusAssignment_g.input.FM_requested_vertical_mode) {
   case fm_requested_vertical_mode::NONE:
    if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
    } else {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    }

    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law::SPD_MACH;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
    break;

   case fm_requested_vertical_mode::SPEED_THRUST:
    if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
    } else {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    }

    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law::SPD_MACH;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
    break;

   case fm_requested_vertical_mode::VPATH_SPEED:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
    AutopilotStateMachine_B.out.law = vertical_law::VPATH;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   case fm_requested_vertical_mode::FPA_SPEED:
    if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
    } else {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    }

    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
    AutopilotStateMachine_B.out.law = vertical_law::FPA;
    AutopilotStateMachine_B.out.FPA_c_deg = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   case fm_requested_vertical_mode::VS_SPEED:
    if (AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid) {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft;
    } else {
      AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
    }

    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
    AutopilotStateMachine_B.out.law = vertical_law::VS;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;

   default:
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_IDLE;
    AutopilotStateMachine_B.out.law = vertical_law::VPATH;
    AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
    AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
    break;
  }
}

void AutopilotStateMachine::AutopilotStateMachine_FINAL_DES_during(void)
{
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  AutopilotStateMachine_B.out.law = vertical_law::VPATH;
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_c_ft;
  AutopilotStateMachine_B.out.H_dot_c_fpm = AutopilotStateMachine_B.BusAssignment_g.input.FM_H_dot_c_fpm;
}

void AutopilotStateMachine::AutopilotStateMachine_FLARE_during(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::FLARE;
  AutopilotStateMachine_B.out.law = vertical_law::FLARE;
  if ((AutopilotStateMachine_B.BusAssignment_g.data.H_radio_ft <= 40.0) &&
      ((AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 != 0.0) ||
       (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 != 0.0))) {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::RETARD;
  } else {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  }
}

void AutopilotStateMachine::AutopilotStateMachine_ROLL_OUT_entry_e(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::ROLL_OUT;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_IDLE;
  AutopilotStateMachine_B.out.law = vertical_law::FLARE;
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_GS_TO_X(void) const
{
  return AutopilotStateMachine_B.BusAssignment_g.input.LOC_push ||
    AutopilotStateMachine_B.BusAssignment_g.input.APPR_push || AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
    AutopilotStateMachine_B.BusAssignment_g.input.VS_pull ||
    ((AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode::LOC_CPT) &&
     (AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode::LOC_TRACK) &&
     (AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode::LAND));
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_GS_TO_X_MR(void) const
{
  return AutopilotStateMachine_B.BusAssignment_g.input.LOC_push ||
    AutopilotStateMachine_B.BusAssignment_g.input.APPR_push ||
    ((AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode::LOC_CPT) &&
     (AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode::LOC_TRACK) &&
     (AutopilotStateMachine_B.BusAssignment_g.lateral_previous.output.mode != lateral_mode::LAND));
}

boolean_T AutopilotStateMachine::AutopilotStateMachine_GS_TO_ALT(void) const
{
  return AutopilotStateMachine_B.BusAssignment_g.input.ALT_push ||
    AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull;
}

void AutopilotStateMachine::AutopilotStateMachine_GS_TRACK_entry(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::GS_TRACK;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  AutopilotStateMachine_B.out.law = vertical_law::GS;
}

void AutopilotStateMachine::AutopilotStateMachine_LAND_entry_p(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::LAND;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
  AutopilotStateMachine_B.out.law = vertical_law::GS;
}

void AutopilotStateMachine::AutopilotStateMachine_GS_TRACK(void)
{
  real_T tmp_0;
  boolean_T guard1;
  boolean_T tmp;
  guard1 = false;
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
      tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
              AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
      tmp_0 = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
        AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
      if (tmp && (tmp_0 < -40.0)) {
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
        AutopilotStateMachine_OP_DES_entry();
      } else if (tmp && (tmp_0 > 40.0)) {
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
        AutopilotStateMachine_OP_CLB_entry();
      } else {
        tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (std::abs
                (AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                 AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 40.0));
        if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
            AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
            AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
          AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
          AutopilotStateMachine_CLB_entry();
        } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
          AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
          AutopilotStateMachine_DES_entry();
        } else {
          guard1 = true;
        }
      }
    }
  } else {
    guard1 = true;
  }

  if (guard1) {
    if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.LAND) {
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_LAND_d;
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
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_o;
        AutopilotStateMachine_OFF_entry_i();
      }
    }
  }
}

void AutopilotStateMachine::AutopilotStateMachine_FLARE_entry_n(void)
{
  AutopilotStateMachine_B.out.mode = vertical_mode::FLARE;
  AutopilotStateMachine_B.out.law = vertical_law::FLARE;
  AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::SPEED;
}

void AutopilotStateMachine::AutopilotStateMachine_GS(void)
{
  real_T tmp_0;
  boolean_T guard1;
  boolean_T tmp;
  guard1 = false;
  switch (AutopilotStateMachine_DWork.is_GS) {
   case AutopilotStateMachine_IN_FLARE:
    if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ROLL_OUT) {
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_ROLL_OUT;
      AutopilotStateMachine_ROLL_OUT_entry_e();
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
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_o;
        AutopilotStateMachine_OFF_entry_i();
      } else {
        guard1 = true;
      }
    } else {
      guard1 = true;
    }
    break;

   case AutopilotStateMachine_IN_GS_TRACK:
    AutopilotStateMachine_GS_TRACK();
    break;

   case AutopilotStateMachine_IN_LAND_d:
    if (AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FLARE) {
      AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_FLARE;
      AutopilotStateMachine_FLARE_entry_n();
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
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_o;
        AutopilotStateMachine_OFF_entry_i();
      }
    }
    break;
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
        tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
        tmp_0 = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
          AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
        if (tmp && (tmp_0 < -40.0)) {
          AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
          AutopilotStateMachine_OP_DES_entry();
        } else if (tmp && (tmp_0 > 40.0)) {
          AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
          AutopilotStateMachine_OP_CLB_entry();
        } else {
          tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (std::abs
                  (AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                   AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 40.0));
          if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
              AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
              AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
            AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
            AutopilotStateMachine_CLB_entry();
          } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
            AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_NO_ACTIVE_CHILD;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
            AutopilotStateMachine_DES_entry();
          }
        }
      }
    }
  }
}

void AutopilotStateMachine::AutopilotStateMachine_OP_CLB_during(void)
{
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (std::abs(AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft -
               AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft) > 1200.0) {
    AutopilotStateMachine_B.out.mode_autothrust = athr_requested_mode::THRUST_CLB;
    AutopilotStateMachine_B.out.law = vertical_law::SPD_MACH;
    AutopilotStateMachine_B.out.H_dot_c_fpm = 0.0;
  }

  if (AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) {
    AutopilotStateMachine_B.out.EXPED_mode_active =
      !AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.EXPED_mode_active;
  } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull) {
    AutopilotStateMachine_B.out.EXPED_mode_active = false;
  }
}

void AutopilotStateMachine::AutopilotStateMachine_OP_CLB_exit(void)
{
  AutopilotStateMachine_B.out.EXPED_mode_active = false;
}

void AutopilotStateMachine::AutopilotStateMachine_OP_CLB(void)
{
  boolean_T guard1;
  boolean_T tmp;
  guard1 = false;
  if ((AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft < AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) &&
      (std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
                AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 40.0)) {
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
    tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (std::abs
            (AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
             AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 40.0));
    if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
        AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
        AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
      AutopilotStateMachine_OP_CLB_exit();
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
      AutopilotStateMachine_CLB_entry();
    } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
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

void AutopilotStateMachine::AutopilotStateMachine_OP_DES_during(void)
{
  AutopilotStateMachine_B.out.H_c_ft = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft;
  AutopilotStateMachine_B.out.V_c_kn = AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn;
  if (AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) {
    AutopilotStateMachine_B.out.EXPED_mode_active =
      !AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.EXPED_mode_active;
  } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull) {
    AutopilotStateMachine_B.out.EXPED_mode_active = false;
  }
}

void AutopilotStateMachine::AutopilotStateMachine_OP_DES(void)
{
  boolean_T guard1;
  boolean_T tmp;
  if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT) {
    AutopilotStateMachine_OP_CLB_exit();
    AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_ALT_CPT;
    AutopilotStateMachine_ALT_CPT_entry();
  } else {
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
                 AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 40.0)) {
      AutopilotStateMachine_B.out.mode_reversion = true;
      AutopilotStateMachine_B.out.mode_reversion_target_fpm = AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
      guard1 = true;
    } else {
      tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (std::abs
              (AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
               AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 40.0));
      if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
        AutopilotStateMachine_OP_CLB_exit();
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
        AutopilotStateMachine_CLB_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
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

void AutopilotStateMachine::AutopilotStateMachine_SRS_during(void)
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

void AutopilotStateMachine::AutopilotStateMachine_SRS(void)
{
  real_T tmp_0;
  boolean_T guard1;
  boolean_T guard2;
  boolean_T guard3;
  boolean_T guard4;
  boolean_T tmp;
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
      tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
              AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
             AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
      tmp_0 = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
        AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
      if (tmp && (tmp_0 < -40.0)) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
        AutopilotStateMachine_OP_DES_entry();
      } else if (tmp && (tmp_0 > 40.0)) {
        guard3 = true;
      } else {
        tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (std::abs
                (AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                 AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) > 40.0));
        if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
            AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
            AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
          guard1 = true;
        } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                   AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active && tmp) {
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

void AutopilotStateMachine::AutopilotStateMachine_exit_internal_ON(void)
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

void AutopilotStateMachine::AutopilotStateMachine_ON_i(void)
{
  real_T tmp;
  boolean_T guard1;
  boolean_T guard2;
  boolean_T guard3;
  boolean_T guard4;
  boolean_T tmp_0;
  if (AutopilotStateMachine_X_TO_SRS_GA()) {
    AutopilotStateMachine_exit_internal_ON();
    AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_SRS_GA;
    AutopilotStateMachine_SRS_GA_entry();
  } else {
    guard1 = false;
    guard2 = false;
    guard3 = false;
    guard4 = false;
    if ((AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 == 0.0) &&
        (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0) &&
        (((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode::OP_CLB) &&
          (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn >= AutopilotStateMachine_B.BusAssignment_g.data.VMAX_kn
           + 4.0)) || ((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode::OP_DES) &&
                       (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn <=
                        AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn - 2.0)))) {
      AutopilotStateMachine_B.out.FD_disconnect = true;
      guard4 = true;
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
                (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 == 0.0))) {
      guard4 = true;
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
        AutopilotStateMachine_CLB();
        break;

       case AutopilotStateMachine_IN_DES:
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
          if ((!AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES) ||
              ((AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft >
                AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft) && (std::abs(tmp) > 40.0))) {
            AutopilotStateMachine_B.out.mode_reversion = true;
            AutopilotStateMachine_B.out.mode_reversion_target_fpm =
              AutopilotStateMachine_B.BusAssignment_g.data.H_dot_ft_min;
            guard2 = true;
          } else {
            tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                      AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
                     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
            if (tmp_0 && (tmp < -40.0)) {
              AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
              AutopilotStateMachine_OP_DES_entry();
            } else if (tmp_0 && (tmp > 40.0)) {
              AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
              AutopilotStateMachine_OP_CLB_entry();
            } else {
              AutopilotStateMachine_DES_during();
            }
          }
        }
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
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_o;
            AutopilotStateMachine_OFF_entry_i();
          } else {
            guard3 = true;
          }
        } else {
          guard3 = true;
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

    if (guard4) {
      AutopilotStateMachine_exit_internal_ON();
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_o;
      AutopilotStateMachine_OFF_entry_i();
    }

    if (guard3) {
      tmp_0 = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
               AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
      tmp = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
        AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
      if (tmp_0 && (tmp < -40.0)) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
        AutopilotStateMachine_OP_DES_entry();
      } else if (tmp_0 && (tmp > 40.0)) {
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
        AutopilotStateMachine_OP_CLB_entry();
      } else {
        AutopilotStateMachine_FINAL_DES_during();
      }
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

void AutopilotStateMachine::AutopilotStateMachine_SRS_GA_during(void)
{
  boolean_T allEnginesOperative;
  AutopilotStateMachine_B.out.FD_connect = false;
  AutopilotStateMachine_B.out.mode_reversion_TRK_FPA = false;
  allEnginesOperative = (AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_1 &&
    AutopilotStateMachine_B.BusAssignment_g.data.is_engine_operative_2);
  if (!AutopilotStateMachine_DWork.wereAllEnginesOperative_not_empty_j) {
    AutopilotStateMachine_DWork.wereAllEnginesOperative_o = allEnginesOperative;
    AutopilotStateMachine_DWork.wereAllEnginesOperative_not_empty_j = true;
  }

  if (AutopilotStateMachine_DWork.wereAllEnginesOperative_o && (!allEnginesOperative)) {
    AutopilotStateMachine_B.out.V_c_kn = std::fmin(AutopilotStateMachine_B.BusAssignment_g.data.VLS_kn + 15.0, std::fmax
      (AutopilotStateMachine_B.BusAssignment_g.data.V_ias_kn, AutopilotStateMachine_B.BusAssignment_g.data.VAPP_kn));
  }

  AutopilotStateMachine_DWork.wereAllEnginesOperative_o = allEnginesOperative;
}

void AutopilotStateMachine::step()
{
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
  real_T Phi2;
  real_T R;
  real_T a;
  real_T b_L;
  real_T b_R;
  real_T c_R;
  real_T rtb_GainTheta;
  real_T rtb_GainTheta1;
  real_T rtb_dme;
  real_T xloc;
  int32_T high_i;
  int32_T low_i;
  int32_T low_ip1;
  int32_T mid_i;
  int32_T rtb_on_ground;
  boolean_T isGoAroundModeActive;
  boolean_T rtb_AND;
  boolean_T rtb_AND_j;
  boolean_T rtb_BusAssignment1_input_APPR_push;
  boolean_T rtb_Compare_c;
  boolean_T rtb_Compare_dl;
  boolean_T rtb_FixPtRelationalOperator;
  boolean_T rtb_Y_n;
  boolean_T rtb_cFLARE;
  boolean_T sCLB_tmp;
  boolean_T speedTargetChanged;
  static const int16_T b[7]{ 0, 1000, 3333, 4000, 6000, 8000, 10000 };

  static const real_T c[24]{ -3.7631613045100394E-12, -3.7631613045100418E-12, 6.2076488130688133E-12,
    2.3375903616618146E-12, -2.9675180723323623E-12, -2.9675180723323619E-12, 2.2735910872868498E-8,
    1.1446426959338374E-8, -1.4891939010927404E-8, -2.4704337359767112E-9, 1.1555108433994175E-8, -6.25E-9,
    -1.897274956835846E-5, 1.520958826384842E-5, 7.1712086474912069E-6, -4.4094939746938354E-6, 1.3759855421341094E-5,
    2.4370072289329445E-5, 0.05, 0.05, 0.1, 0.1, 0.1, 0.15 };

  real_T c_L_tmp_tmp_tmp;
  real_T rtb_dme_tmp;
  boolean_T guard1;
  boolean_T guard2;
  boolean_T sCLB_tmp_0;
  boolean_T state_a_tmp;
  boolean_T state_a_tmp_0;
  boolean_T state_a_tmp_1;
  boolean_T state_a_tmp_2;
  boolean_T state_a_tmp_3;
  boolean_T state_e_tmp;
  boolean_T state_e_tmp_0;
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
  AutopilotStateMachine_DWork.Delay_DSTATE_d += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_U.in.input.DIR_TO_trigger) - AutopilotStateMachine_DWork.Delay_DSTATE_d,
    AutopilotStateMachine_P.Raising_Value * AutopilotStateMachine_U.in.time.dt), AutopilotStateMachine_P.Falling_Value /
    AutopilotStateMachine_P.Debounce1_Value * AutopilotStateMachine_U.in.time.dt);
  AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_o;
  rtb_GainTheta = AutopilotStateMachine_P.GainTheta_Gain * AutopilotStateMachine_U.in.data.Theta_deg;
  rtb_GainTheta1 = AutopilotStateMachine_P.GainTheta1_Gain * AutopilotStateMachine_U.in.data.Phi_deg;
  c_R = 0.017453292519943295 * rtb_GainTheta;
  Phi2 = 0.017453292519943295 * rtb_GainTheta1;
  R = std::tan(c_R);
  rtb_dme = std::cos(Phi2);
  Phi2 = std::sin(Phi2);
  c_R = std::cos(c_R);
  result_tmp[0] = 1.0;
  result_tmp[3] = Phi2 * R;
  result_tmp[6] = rtb_dme * R;
  result_tmp[1] = 0.0;
  result_tmp[4] = rtb_dme;
  result_tmp[7] = -Phi2;
  result_tmp[2] = 0.0;
  result_tmp[5] = 1.0 / c_R * Phi2;
  result_tmp[8] = 1.0 / c_R * rtb_dme;
  R = AutopilotStateMachine_P.Gain_Gain_k * AutopilotStateMachine_U.in.data.p_rad_s *
    AutopilotStateMachine_P.Gainpk_Gain;
  a = AutopilotStateMachine_P.Gain_Gain * AutopilotStateMachine_U.in.data.q_rad_s * AutopilotStateMachine_P.Gainqk_Gain;
  xloc = AutopilotStateMachine_P.Gain_Gain_a * AutopilotStateMachine_U.in.data.r_rad_s;
  for (high_i = 0; high_i < 3; high_i++) {
    result[high_i] = (result_tmp[high_i + 3] * a + result_tmp[high_i] * R) + result_tmp[high_i + 6] * xloc;
  }

  R = std::sin(0.017453292519943295 * rtb_GainTheta);
  result_tmp[0] = c_R;
  result_tmp[3] = 0.0;
  result_tmp[6] = -R;
  result_tmp[1] = Phi2 * R;
  result_tmp[4] = rtb_dme;
  result_tmp[7] = c_R * Phi2;
  result_tmp[2] = rtb_dme * R;
  result_tmp[5] = 0.0 - Phi2;
  result_tmp[8] = rtb_dme * c_R;
  for (high_i = 0; high_i < 3; high_i++) {
    result_0[high_i] = (result_tmp[high_i + 3] * AutopilotStateMachine_U.in.data.by_m_s2 + result_tmp[high_i] *
                        AutopilotStateMachine_U.in.data.bx_m_s2) + result_tmp[high_i + 6] *
      AutopilotStateMachine_U.in.data.bz_m_s2;
  }

  if (AutopilotStateMachine_U.in.data.nav_dme_valid != 0.0) {
    AutopilotStateMachine_B.BusAssignment_g.data.nav_dme_nmi = AutopilotStateMachine_U.in.data.nav_dme_nmi;
  } else if (AutopilotStateMachine_U.in.data.nav_loc_valid) {
    a = std::sin((AutopilotStateMachine_U.in.data.nav_loc_position.lat -
                  AutopilotStateMachine_U.in.data.aircraft_position.lat) * 0.017453292519943295 / 2.0);
    xloc = std::sin((AutopilotStateMachine_U.in.data.nav_loc_position.lon -
                     AutopilotStateMachine_U.in.data.aircraft_position.lon) * 0.017453292519943295 / 2.0);
    a = std::cos(0.017453292519943295 * AutopilotStateMachine_U.in.data.aircraft_position.lat) * std::cos
      (0.017453292519943295 * AutopilotStateMachine_U.in.data.nav_loc_position.lat) * xloc * xloc + a * a;
    rtb_dme = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
    a = AutopilotStateMachine_U.in.data.aircraft_position.alt - AutopilotStateMachine_U.in.data.nav_loc_position.alt;
    AutopilotStateMachine_B.BusAssignment_g.data.nav_dme_nmi = std::sqrt(rtb_dme * rtb_dme + a * a) / 1852.0;
  } else {
    AutopilotStateMachine_B.BusAssignment_g.data.nav_dme_nmi = 0.0;
  }

  rtb_dme_tmp = 0.017453292519943295 * AutopilotStateMachine_U.in.data.aircraft_position.lat;
  Phi2 = 0.017453292519943295 * AutopilotStateMachine_U.in.data.nav_loc_position.lat;
  a = std::sin((AutopilotStateMachine_U.in.data.nav_loc_position.lat -
                AutopilotStateMachine_U.in.data.aircraft_position.lat) * 0.017453292519943295 / 2.0);
  xloc = std::sin((AutopilotStateMachine_U.in.data.nav_loc_position.lon -
                   AutopilotStateMachine_U.in.data.aircraft_position.lon) * 0.017453292519943295 / 2.0);
  c_R = std::cos(Phi2);
  R = std::cos(rtb_dme_tmp);
  a = R * c_R * xloc * xloc + a * a;
  a = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  xloc = AutopilotStateMachine_U.in.data.aircraft_position.alt - AutopilotStateMachine_U.in.data.nav_loc_position.alt;
  b_L = mod_OlzklkXq((mod_OlzklkXq(mod_OlzklkXq(360.0) + 360.0) - (mod_OlzklkXq(mod_OlzklkXq
    (AutopilotStateMachine_U.in.data.nav_loc_magvar_deg) + 360.0) + 360.0)) + 360.0);
  b_R = mod_OlzklkXq(360.0 - b_L);
  c_L_tmp_tmp_tmp = 0.017453292519943295 * AutopilotStateMachine_U.in.data.aircraft_position.lon;
  rtb_dme = 0.017453292519943295 * AutopilotStateMachine_U.in.data.nav_loc_position.lon - c_L_tmp_tmp_tmp;
  rtb_dme = mod_OlzklkXq(mod_OlzklkXq(mod_OlzklkXq(std::atan2(std::sin(rtb_dme) * c_R, R * std::sin(Phi2) - std::sin
    (rtb_dme_tmp) * c_R * std::cos(rtb_dme)) * 57.295779513082323 + 360.0)) + 360.0);
  if (std::abs(b_L) < std::abs(b_R)) {
    b_R = -b_L;
  }

  Phi2 = mod_OlzklkXq((mod_OlzklkXq(mod_OlzklkXq(mod_OlzklkXq(mod_OlzklkXq(AutopilotStateMachine_U.in.data.nav_loc_deg -
    b_R) + 360.0)) + 360.0) - (rtb_dme + 360.0)) + 360.0);
  c_R = mod_OlzklkXq(360.0 - Phi2);
  guard1 = false;
  if (std::sqrt(a * a + xloc * xloc) / 1852.0 < 30.0) {
    rtb_dme = mod_OlzklkXq((mod_OlzklkXq(mod_OlzklkXq(AutopilotStateMachine_U.in.data.nav_loc_deg) + 360.0) - (rtb_dme +
      360.0)) + 360.0);
    R = mod_OlzklkXq(360.0 - rtb_dme);
    if (std::abs(rtb_dme) < std::abs(R)) {
      R = -rtb_dme;
    }

    if ((std::abs(R) < 90.0) && ((AutopilotStateMachine_U.in.data.nav_loc_position.lat != 0.0) ||
         (AutopilotStateMachine_U.in.data.nav_loc_position.lon != 0.0) ||
         (AutopilotStateMachine_U.in.data.nav_loc_position.alt != 0.0))) {
      AutopilotStateMachine_B.BusAssignment_g.data.nav_e_loc_valid = true;
      if (std::abs(Phi2) < std::abs(c_R)) {
        AutopilotStateMachine_B.BusAssignment_g.data.nav_e_loc_error_deg = -Phi2;
      } else {
        AutopilotStateMachine_B.BusAssignment_g.data.nav_e_loc_error_deg = c_R;
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
  a = std::sin((AutopilotStateMachine_U.in.data.nav_gs_position.lat -
                AutopilotStateMachine_U.in.data.aircraft_position.lat) * 0.017453292519943295 / 2.0);
  xloc = std::sin((AutopilotStateMachine_U.in.data.nav_gs_position.lon -
                   AutopilotStateMachine_U.in.data.aircraft_position.lon) * 0.017453292519943295 / 2.0);
  c_R = std::cos(Phi2);
  R = std::cos(rtb_dme_tmp);
  a = R * c_R * xloc * xloc + a * a;
  a = std::atan2(std::sqrt(a), std::sqrt(1.0 - a)) * 2.0 * 6.371E+6;
  b_L = AutopilotStateMachine_U.in.data.aircraft_position.alt - AutopilotStateMachine_U.in.data.nav_gs_position.alt;
  a = std::sqrt(a * a + b_L * b_L);
  xloc = 0.017453292519943295 * AutopilotStateMachine_U.in.data.nav_gs_position.lon - c_L_tmp_tmp_tmp;
  rtb_dme = std::atan2(std::sin(xloc) * c_R, R * std::sin(Phi2) - std::sin(rtb_dme_tmp) * c_R * std::cos(xloc)) *
    57.295779513082323;
  if (rtb_dme + 360.0 == 0.0) {
    rtb_dme = 0.0;
  } else {
    rtb_dme = std::fmod(rtb_dme + 360.0, 360.0);
    if (rtb_dme == 0.0) {
      rtb_dme = 0.0;
    } else if (rtb_dme < 0.0) {
      rtb_dme += 360.0;
    }
  }

  guard1 = false;
  if (a / 1852.0 < 30.0) {
    if (AutopilotStateMachine_U.in.data.nav_loc_deg == 0.0) {
      R = 0.0;
    } else {
      R = std::fmod(AutopilotStateMachine_U.in.data.nav_loc_deg, 360.0);
      if (R == 0.0) {
        R = 0.0;
      } else if (R < 0.0) {
        R += 360.0;
      }
    }

    if (rtb_dme == 0.0) {
      c_R = 0.0;
    } else {
      c_R = std::fmod(rtb_dme, 360.0);
    }

    c_R = (std::fmod(R + 360.0, 360.0) - (std::fmod(c_R + 360.0, 360.0) + 360.0)) + 360.0;
    if (c_R == 0.0) {
      rtb_dme = 0.0;
    } else {
      rtb_dme = std::fmod(c_R, 360.0);
      if (rtb_dme == 0.0) {
        rtb_dme = 0.0;
      } else if (rtb_dme < 0.0) {
        rtb_dme += 360.0;
      }
    }

    if (360.0 - rtb_dme == 0.0) {
      R = 0.0;
    } else {
      R = std::fmod(360.0 - rtb_dme, 360.0);
    }

    if (rtb_dme < R) {
      R = -rtb_dme;
    }

    if ((std::abs(R) < 90.0) && ((AutopilotStateMachine_U.in.data.nav_gs_position.lat != 0.0) ||
         (AutopilotStateMachine_U.in.data.nav_gs_position.lon != 0.0) ||
         (AutopilotStateMachine_U.in.data.nav_gs_position.alt != 0.0))) {
      AutopilotStateMachine_B.BusAssignment_g.data.nav_e_gs_valid = true;
      AutopilotStateMachine_B.BusAssignment_g.data.nav_e_gs_error_deg = std::asin(b_L / a) * 57.295779513082323 -
        AutopilotStateMachine_DWork.nav_gs_deg;
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

  Phi2 = AutopilotStateMachine_P.Gain1_Gain * AutopilotStateMachine_U.in.data.gear_strut_compression_2 -
    AutopilotStateMachine_P.Constant1_Value;
  if (Phi2 > AutopilotStateMachine_P.Saturation1_UpperSat) {
    Phi2 = AutopilotStateMachine_P.Saturation1_UpperSat;
  } else if (Phi2 < AutopilotStateMachine_P.Saturation1_LowerSat) {
    Phi2 = AutopilotStateMachine_P.Saturation1_LowerSat;
  }

  if (AutopilotStateMachine_DWork.is_active_c5_AutopilotStateMachine == 0) {
    AutopilotStateMachine_DWork.is_active_c5_AutopilotStateMachine = 1U;
    AutopilotStateMachine_DWork.is_c5_AutopilotStateMachine = AutopilotStateMachine_IN_OnGround;
    rtb_on_ground = 1;
  } else if (AutopilotStateMachine_DWork.is_c5_AutopilotStateMachine == AutopilotStateMachine_IN_InAir) {
    if ((rtb_dme > 0.05) || (Phi2 > 0.05)) {
      AutopilotStateMachine_DWork.is_c5_AutopilotStateMachine = AutopilotStateMachine_IN_OnGround;
      rtb_on_ground = 1;
    } else {
      rtb_on_ground = 0;
    }
  } else if ((rtb_dme == 0.0) && (Phi2 == 0.0)) {
    AutopilotStateMachine_DWork.is_c5_AutopilotStateMachine = AutopilotStateMachine_IN_InAir;
    rtb_on_ground = 0;
  } else {
    rtb_on_ground = 1;
  }

  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (AutopilotStateMachine_U.in.data.altimeter_setting_right_mbar !=
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_i);
  rtb_Compare_c = ((AutopilotStateMachine_U.in.data.altimeter_setting_left_mbar !=
                    AutopilotStateMachine_DWork.DelayInput1_DSTATE) || AutopilotStateMachine_DWork.DelayInput1_DSTATE_o);
  rtb_BusAssignment1_input_APPR_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_h;
  if (!AutopilotStateMachine_DWork.eventTime_not_empty_j) {
    AutopilotStateMachine_DWork.eventTime_b = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_j = true;
  }

  if ((rtb_on_ground == 0) || (AutopilotStateMachine_DWork.eventTime_b == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_b = AutopilotStateMachine_U.in.time.simulation_time;
  }

  rtb_dme = AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_b;
  if (!AutopilotStateMachine_DWork.eventTime_not_empty_k) {
    AutopilotStateMachine_DWork.eventTime_a = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_k = true;
  }

  if ((rtb_on_ground != 0) || (AutopilotStateMachine_DWork.eventTime_a == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_a = AutopilotStateMachine_U.in.time.simulation_time;
  }

  Phi2 = AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_a;
  if (!AutopilotStateMachine_DWork.eventTime_not_empty_c) {
    AutopilotStateMachine_DWork.eventTime_n = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_c = true;
  }

  if (((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::SRS) &&
       (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::SRS_GA)) ||
      (AutopilotStateMachine_DWork.eventTime_n == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_n = AutopilotStateMachine_U.in.time.simulation_time;
  }

  c_R = AutopilotStateMachine_P.Constant_Value_j / AutopilotStateMachine_U.in.time.dt;
  if (c_R < 1.0) {
    c_R = AutopilotStateMachine_U.in.input.H_fcu_ft;
  } else {
    if (c_R > 100.0) {
      high_i = 100;
    } else {
      high_i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(c_R), 4.294967296E+9)));
    }

    c_R = AutopilotStateMachine_DWork.Delay_DSTATE_d5[100U - static_cast<uint32_T>(high_i)];
  }

  rtb_Compare_dl = (c_R != AutopilotStateMachine_U.in.input.H_fcu_ft);
  rtb_Y_n = ((AutopilotStateMachine_U.in.input.H_constraint_ft != 0.0) && (((AutopilotStateMachine_U.in.input.H_fcu_ft >
    AutopilotStateMachine_U.in.data.H_ind_ft) && (AutopilotStateMachine_U.in.input.H_constraint_ft >
    AutopilotStateMachine_U.in.data.H_ind_ft) && (AutopilotStateMachine_U.in.input.H_constraint_ft <
    AutopilotStateMachine_U.in.input.H_fcu_ft)) || ((AutopilotStateMachine_U.in.input.H_fcu_ft <
    AutopilotStateMachine_U.in.data.H_ind_ft) && (AutopilotStateMachine_U.in.input.H_constraint_ft <
    AutopilotStateMachine_U.in.data.H_ind_ft) && (AutopilotStateMachine_U.in.input.H_constraint_ft >
    AutopilotStateMachine_U.in.input.H_fcu_ft))));
  c_R = AutopilotStateMachine_P.Constant_Value_jq / AutopilotStateMachine_U.in.time.dt;
  if (c_R < 1.0) {
    c_R = AutopilotStateMachine_U.in.input.Psi_fcu_deg;
  } else {
    if (c_R > 100.0) {
      high_i = 100;
    } else {
      high_i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(c_R), 4.294967296E+9)));
    }

    c_R = AutopilotStateMachine_DWork.Delay_DSTATE_c[100U - static_cast<uint32_T>(high_i)];
  }

  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (c_R != AutopilotStateMachine_U.in.input.Psi_fcu_deg);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_h = (AutopilotStateMachine_U.in.input.Psi_fcu_deg !=
    AutopilotStateMachine_P.CompareToConstant_const_h);
  rtb_AND = (AutopilotStateMachine_DWork.DelayInput1_DSTATE_o && AutopilotStateMachine_DWork.DelayInput1_DSTATE_h);
  if ((!AutopilotStateMachine_DWork.pY_not_empty) || (!AutopilotStateMachine_DWork.pU_not_empty)) {
    AutopilotStateMachine_DWork.pU = AutopilotStateMachine_U.in.data.nav_gs_error_deg;
    AutopilotStateMachine_DWork.pU_not_empty = true;
    AutopilotStateMachine_DWork.pY = AutopilotStateMachine_U.in.data.nav_gs_error_deg;
    AutopilotStateMachine_DWork.pY_not_empty = true;
  }

  c_R = AutopilotStateMachine_U.in.time.dt * AutopilotStateMachine_P.LagFilter_C1;
  R = c_R / (c_R + 2.0);
  AutopilotStateMachine_DWork.pY = (2.0 - c_R) / (c_R + 2.0) * AutopilotStateMachine_DWork.pY +
    (AutopilotStateMachine_U.in.data.nav_gs_error_deg * R + AutopilotStateMachine_DWork.pU * R);
  AutopilotStateMachine_DWork.pU = AutopilotStateMachine_U.in.data.nav_gs_error_deg;
  rtb_FixPtRelationalOperator = (AutopilotStateMachine_DWork.pY < AutopilotStateMachine_DWork.DelayInput1_DSTATE_b);
  c_R = AutopilotStateMachine_P.Constant_Value_m / AutopilotStateMachine_U.in.time.dt;
  if (c_R < 1.0) {
    c_R = AutopilotStateMachine_U.in.input.V_fcu_kn;
  } else {
    if (c_R > 100.0) {
      high_i = 100;
    } else {
      high_i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(c_R), 4.294967296E+9)));
    }

    c_R = AutopilotStateMachine_DWork.Delay_DSTATE_d2[100U - static_cast<uint32_T>(high_i)];
  }

  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (c_R != AutopilotStateMachine_U.in.input.V_fcu_kn);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_h = (AutopilotStateMachine_U.in.input.V_fcu_kn !=
    AutopilotStateMachine_P.CompareToConstant_const_l);
  rtb_AND_j = (AutopilotStateMachine_DWork.DelayInput1_DSTATE_o && AutopilotStateMachine_DWork.DelayInput1_DSTATE_h);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = !AutopilotStateMachine_U.in.input.is_SPEED_managed;
  if (!AutopilotStateMachine_DWork.lastTargetSpeed_not_empty) {
    AutopilotStateMachine_DWork.lastTargetSpeed = AutopilotStateMachine_U.in.input.V_fcu_kn;
    AutopilotStateMachine_DWork.lastTargetSpeed_not_empty = true;
  }

  speedTargetChanged = (std::abs(AutopilotStateMachine_U.in.input.V_fcu_kn - AutopilotStateMachine_DWork.lastTargetSpeed)
                        > 2.0);
  AutopilotStateMachine_DWork.lastTargetSpeed = AutopilotStateMachine_U.in.input.V_fcu_kn;
  c_R = std::abs(AutopilotStateMachine_U.in.input.V_fcu_kn - AutopilotStateMachine_U.in.data.V_ias_kn);
  if ((c_R <= 4.0) || (!AutopilotStateMachine_DWork.timeDeltaSpeed4_not_empty)) {
    AutopilotStateMachine_DWork.timeDeltaSpeed4 = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.timeDeltaSpeed4_not_empty = true;
  }

  if ((c_R <= 10.0) || (!AutopilotStateMachine_DWork.timeDeltaSpeed10_not_empty)) {
    AutopilotStateMachine_DWork.timeDeltaSpeed10 = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.timeDeltaSpeed10_not_empty = true;
  }

  rtb_cFLARE = ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ALT) &&
                (AutopilotStateMachine_U.in.data.flight_phase == 3.0) && AutopilotStateMachine_U.in.input.MACH_mode &&
                AutopilotStateMachine_U.in.input.ATHR_engaged && (c_R < 4.0));
  if ((!rtb_cFLARE) || speedTargetChanged || (!AutopilotStateMachine_DWork.timeConditionSoftAlt_not_empty)) {
    AutopilotStateMachine_DWork.timeConditionSoftAlt = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.timeConditionSoftAlt_not_empty = true;
  }

  AutopilotStateMachine_DWork.stateSoftAlt = ((rtb_cFLARE && (AutopilotStateMachine_U.in.time.simulation_time -
    AutopilotStateMachine_DWork.timeConditionSoftAlt >= 120.0)) || AutopilotStateMachine_DWork.stateSoftAlt);
  if (speedTargetChanged || (!AutopilotStateMachine_U.in.input.MACH_mode) ||
      (!AutopilotStateMachine_U.in.input.ATHR_engaged) || (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode !=
       vertical_mode::ALT) || (AutopilotStateMachine_U.in.time.simulation_time -
       AutopilotStateMachine_DWork.timeDeltaSpeed4 > 10.0) || (AutopilotStateMachine_U.in.time.simulation_time -
       AutopilotStateMachine_DWork.timeDeltaSpeed10 > 4.0) || (AutopilotStateMachine_U.in.data.V_ias_kn >
       AutopilotStateMachine_U.in.data.VMAX_kn - 5.0)) {
    AutopilotStateMachine_DWork.stateSoftAlt = false;
    AutopilotStateMachine_DWork.timeConditionSoftAlt = AutopilotStateMachine_U.in.time.simulation_time;
  }

  AutopilotStateMachine_DWork.Delay_DSTATE_g += std::fmax(std::fmin(static_cast<real_T>(rtb_Compare_c) -
    AutopilotStateMachine_DWork.Delay_DSTATE_g, AutopilotStateMachine_P.Raising_Value_a *
    AutopilotStateMachine_U.in.time.dt), AutopilotStateMachine_P.Falling_Value_f /
    AutopilotStateMachine_P.Debounce_Value * AutopilotStateMachine_U.in.time.dt);
  rtb_Compare_c = ((AutopilotStateMachine_U.in.data.H_radio_ft > 100.0) && (Phi2 > 5.0));
  speedTargetChanged = ((AutopilotStateMachine_DWork.Delay_DSTATE.armed.LOC ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LOC_CPT) ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LOC_TRACK) ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LAND) ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::FLARE) ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::ROLL_OUT)) &&
                        (AutopilotStateMachine_DWork.Delay1_DSTATE.armed.GS ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::GS_CPT) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::GS_TRACK) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::LAND) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::FLARE) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ROLL_OUT)));
  rtb_cFLARE = ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::ROLL_OUT) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ROLL_OUT));
  isGoAroundModeActive = ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::GA_TRACK) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS_GA));
  if (AutopilotStateMachine_DWork.DelayInput1_DSTATE_a && rtb_Compare_c) {
    state_a_tmp = !AutopilotStateMachine_DWork.sAP2;
    if ((!AutopilotStateMachine_DWork.sAP1) && state_a_tmp) {
      AutopilotStateMachine_DWork.sAP1 = true;
    } else if (speedTargetChanged) {
      if (AutopilotStateMachine_DWork.sAP1 && state_a_tmp) {
        AutopilotStateMachine_DWork.sAP2 = true;
      } else {
        AutopilotStateMachine_DWork.sAP1 = ((AutopilotStateMachine_DWork.sAP2 && (!AutopilotStateMachine_DWork.sAP1)) ||
          AutopilotStateMachine_DWork.sAP1);
      }
    }
  } else if (AutopilotStateMachine_DWork.DelayInput1_DSTATE_p) {
    if (!AutopilotStateMachine_DWork.sAP1) {
      if (rtb_Compare_c) {
        AutopilotStateMachine_DWork.sAP1 = true;
        AutopilotStateMachine_DWork.sAP2 = (speedTargetChanged && AutopilotStateMachine_DWork.sAP2);
      }
    } else {
      AutopilotStateMachine_DWork.sAP1 = false;
      AutopilotStateMachine_DWork.sAP2 = false;
    }
  } else if (AutopilotStateMachine_DWork.DelayInput1_DSTATE_bo) {
    if (!AutopilotStateMachine_DWork.sAP2) {
      if (rtb_Compare_c) {
        AutopilotStateMachine_DWork.sAP2 = true;
        AutopilotStateMachine_DWork.sAP1 = (speedTargetChanged && AutopilotStateMachine_DWork.sAP1);
      }
    } else {
      AutopilotStateMachine_DWork.sAP1 = false;
      AutopilotStateMachine_DWork.sAP2 = false;
    }
  } else {
    state_a_tmp = !AutopilotStateMachine_DWork.sGoAroundModeActive;
    if (AutopilotStateMachine_DWork.DelayInput1_DSTATE_d || ((!rtb_cFLARE) && AutopilotStateMachine_DWork.sRollOutActive)
        || ((rtb_on_ground != 0) && isGoAroundModeActive && state_a_tmp) || (rtb_GainTheta > 25.0) || (rtb_GainTheta <
         -13.0) || (std::abs(rtb_GainTheta1) > 45.0)) {
      AutopilotStateMachine_DWork.sAP1 = false;
      AutopilotStateMachine_DWork.sAP2 = false;
    } else if ((!speedTargetChanged) && AutopilotStateMachine_DWork.sLandModeArmedOrActive && (!isGoAroundModeActive) &&
               AutopilotStateMachine_DWork.sAP1 && AutopilotStateMachine_DWork.sAP2) {
      AutopilotStateMachine_DWork.sAP2 = false;
    } else {
      AutopilotStateMachine_DWork.sAP2 = ((isGoAroundModeActive || state_a_tmp || (!AutopilotStateMachine_DWork.sAP1) ||
        (!AutopilotStateMachine_DWork.sAP2)) && AutopilotStateMachine_DWork.sAP2);
    }
  }

  AutopilotStateMachine_DWork.sLandModeArmedOrActive = speedTargetChanged;
  AutopilotStateMachine_DWork.sRollOutActive = rtb_cFLARE;
  AutopilotStateMachine_DWork.sGoAroundModeActive = isGoAroundModeActive;
  if (!AutopilotStateMachine_DWork.wasFlightPlanAvailable_not_empty) {
    AutopilotStateMachine_DWork.wasFlightPlanAvailable = AutopilotStateMachine_U.in.data.is_flight_plan_available;
    AutopilotStateMachine_DWork.wasFlightPlanAvailable_not_empty = true;
  }

  state_a_tmp = !AutopilotStateMachine_DWork.Delay_DSTATE.armed.NAV;
  AutopilotStateMachine_DWork.state_a = ((AutopilotStateMachine_U.in.data.is_flight_plan_available &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::NAV) &&
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_e || ((rtb_on_ground != 0) &&
    (!AutopilotStateMachine_DWork.wasFlightPlanAvailable) && AutopilotStateMachine_U.in.data.is_flight_plan_available) ||
     (state_a_tmp && AutopilotStateMachine_U.in.input.FM_rnav_appr_selected && rtb_BusAssignment1_input_APPR_push) ||
     (state_a_tmp && (!AutopilotStateMachine_DWork.wasInSrsGa) && (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode
    == vertical_mode::SRS_GA))) && ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::NAV) &&
    ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::LOC_CPT) ||
     AutopilotStateMachine_U.in.input.FM_rnav_appr_selected)) && ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode
    != lateral_mode::LOC_TRACK) || AutopilotStateMachine_U.in.input.FM_rnav_appr_selected) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::LAND) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::FLARE)) ||
    AutopilotStateMachine_DWork.state_a);
  rtb_Compare_c = !rtb_BusAssignment1_input_APPR_push;
  state_a_tmp_0 = !AutopilotStateMachine_U.in.input.FM_rnav_appr_selected;
  state_a_tmp_1 = !AutopilotStateMachine_DWork.Delay_DSTATE.armed.LOC;
  state_a_tmp_2 = !AutopilotStateMachine_DWork.Delay1_DSTATE.armed.FINAL_DES;
  state_a_tmp_3 = !AutopilotStateMachine_DWork.DelayInput1_DSTATE_g;
  AutopilotStateMachine_DWork.state_a = (state_a_tmp_3 && AutopilotStateMachine_U.in.data.is_flight_plan_available &&
    ((AutopilotStateMachine_U.in.data.H_radio_ft >= 30.0) || (!rtb_AND)) && (state_a_tmp_1 ||
    AutopilotStateMachine_U.in.input.FM_rnav_appr_selected) && (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode !=
    lateral_mode::NAV) && (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::LAND) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::FLARE) && (state_a_tmp_2 || state_a_tmp ||
    state_a_tmp_0 || rtb_Compare_c) && AutopilotStateMachine_DWork.state_a);
  AutopilotStateMachine_DWork.wasFlightPlanAvailable = AutopilotStateMachine_U.in.data.is_flight_plan_available;
  AutopilotStateMachine_DWork.wasInSrsGa = (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::
    SRS_GA);
  speedTargetChanged = (AutopilotStateMachine_DWork.Delay1_DSTATE.armed.GS ||
                        (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::GS_CPT) ||
                        (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::GS_TRACK) ||
                        (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::LAND) ||
                        (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::FLARE));
  rtb_cFLARE = !speedTargetChanged;
  isGoAroundModeActive = ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::LOC_CPT) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::LOC_TRACK) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::LAND) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::FLARE));
  state_e_tmp = (AutopilotStateMachine_U.in.input.FD_active || AutopilotStateMachine_DWork.sAP1 ||
                 AutopilotStateMachine_DWork.sAP2);
  AutopilotStateMachine_DWork.state_e = (((AutopilotStateMachine_U.in.data.H_radio_ft > 400.0) &&
    AutopilotStateMachine_U.in.data.nav_valid && (AutopilotStateMachine_U.in.data.throttle_lever_1_pos < 45.0) &&
    (AutopilotStateMachine_U.in.data.throttle_lever_2_pos < 45.0) && (AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn ||
    (rtb_BusAssignment1_input_APPR_push && state_a_tmp_0)) && isGoAroundModeActive && rtb_cFLARE && state_e_tmp) ||
    AutopilotStateMachine_DWork.state_e);
  state_e_tmp_0 = !AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn;
  AutopilotStateMachine_DWork.state_e = ((state_e_tmp_0 || state_a_tmp_1 || speedTargetChanged) && (rtb_Compare_c ||
    rtb_cFLARE) && (rtb_Compare_c || state_a_tmp_0) && state_a_tmp && isGoAroundModeActive &&
    (AutopilotStateMachine_U.in.data.throttle_lever_1_pos != 45.0) &&
    (AutopilotStateMachine_U.in.data.throttle_lever_2_pos != 45.0) && state_e_tmp && AutopilotStateMachine_DWork.state_e);
  c_R = (AutopilotStateMachine_U.in.data.Psi_magnetic_track_deg - (AutopilotStateMachine_U.in.data.nav_loc_deg + 360.0))
    + 360.0;
  if (c_R == 0.0) {
    c_R = 0.0;
  } else {
    c_R = std::fmod(c_R, 360.0);
    if (c_R == 0.0) {
      c_R = 0.0;
    } else if (c_R < 0.0) {
      c_R += 360.0;
    }
  }

  if (360.0 - c_R == 0.0) {
    R = 0.0;
  } else {
    R = std::fmod(360.0 - c_R, 360.0);
  }

  if (c_R < R) {
    R = -c_R;
  }

  if (R < 0.0) {
    high_i = -1;
  } else {
    high_i = (R > 0.0);
  }

  if (AutopilotStateMachine_U.in.input.Phi_loc_c < 0.0) {
    low_i = -1;
  } else {
    low_i = (AutopilotStateMachine_U.in.input.Phi_loc_c > 0.0);
  }

  if (high_i == low_i) {
    c_R = std::abs(AutopilotStateMachine_U.in.input.Phi_loc_c);
    guard1 = false;
    if (c_R > 5.0) {
      if (std::abs(rtb_GainTheta1) <= 5.0) {
        speedTargetChanged = true;
      } else {
        if (rtb_GainTheta1 < 0.0) {
          low_ip1 = -1;
        } else {
          low_ip1 = (rtb_GainTheta1 > 0.0);
        }

        if (low_i != low_ip1) {
          speedTargetChanged = true;
        } else {
          guard1 = true;
        }
      }
    } else {
      guard1 = true;
    }

    if (guard1) {
      if (rtb_GainTheta1 < 0.0) {
        low_ip1 = -1;
      } else {
        low_ip1 = (rtb_GainTheta1 > 0.0);
      }

      speedTargetChanged = ((c_R >= std::abs(rtb_GainTheta1)) && (low_i == low_ip1));
    }
  } else {
    speedTargetChanged = false;
  }

  if (AutopilotStateMachine_U.in.data.nav_valid && AutopilotStateMachine_U.in.data.nav_loc_valid) {
    c_R = std::abs(R);
    if (c_R < 115.0) {
      R = std::abs(AutopilotStateMachine_U.in.data.nav_loc_error_deg);
      if (AutopilotStateMachine_U.in.data.nav_loc_error_deg < 0.0) {
        low_i = -1;
      } else {
        low_i = (AutopilotStateMachine_U.in.data.nav_loc_error_deg > 0.0);
      }

      if (((c_R > 25.0) && ((R < 10.0) && ((high_i != low_i) && speedTargetChanged))) || (R < 1.92)) {
        AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LOC_CPT = (speedTargetChanged || ((c_R < 15.0) && (R <
          1.1)));
      } else {
        AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LOC_CPT = false;
      }
    } else {
      AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LOC_CPT = false;
    }
  } else {
    AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LOC_CPT = false;
  }

  if (!AutopilotStateMachine_DWork.eventTime_not_empty_o) {
    AutopilotStateMachine_DWork.eventTime_dp = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_o = true;
  }

  state_a_tmp = !AutopilotStateMachine_U.in.data.nav_valid;
  if (state_a_tmp || (!AutopilotStateMachine_U.in.data.nav_loc_valid) || ((std::abs
        (AutopilotStateMachine_U.in.data.nav_loc_error_deg) >= 0.16) ||
       ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::LOC_CPT) &&
        (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::LOC_TRACK))) ||
      (AutopilotStateMachine_DWork.eventTime_dp == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_dp = AutopilotStateMachine_U.in.time.simulation_time;
  }

  if (!AutopilotStateMachine_DWork.eventTime_not_empty_k5) {
    AutopilotStateMachine_DWork.eventTime_g = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_k5 = true;
  }

  if ((AutopilotStateMachine_U.in.data.H_radio_ft >= 400.0) || (AutopilotStateMachine_DWork.eventTime_g == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_g = AutopilotStateMachine_U.in.time.simulation_time;
  }

  speedTargetChanged = ((AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_g >=
    1.2) && ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LOC_TRACK) ||
             (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LAND)) &&
                        ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::GS_TRACK) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::LAND)));
  rtb_cFLARE = (AutopilotStateMachine_U.in.input.condition_Flare &&
                ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LAND) ||
                 (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::FLARE)) &&
                ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::LAND) ||
                 (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::FLARE)));
  if (AutopilotStateMachine_U.in.data.nav_loc_valid) {
    AutopilotStateMachine_DWork.runwayHeadingStored = AutopilotStateMachine_U.in.data.nav_loc_deg;
  }

  if (AutopilotStateMachine_U.in.data.V_gnd_kn >= 40.0) {
    c_R = AutopilotStateMachine_U.in.data.Psi_magnetic_track_deg;
  } else {
    c_R = AutopilotStateMachine_U.in.data.Psi_magnetic_deg;
  }

  c_R = (AutopilotStateMachine_DWork.runwayHeadingStored - c_R) + 180.0;
  if (c_R == 0.0) {
    R = 0.0;
  } else {
    R = std::fmod(c_R, 360.0);
    if (R == 0.0) {
      R = 0.0;
    } else if (R < 0.0) {
      R += 360.0;
    }
  }

  AutopilotStateMachine_DWork.state = (((rtb_on_ground != 0) && ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode ==
    lateral_mode::FLARE) || (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::ROLL_OUT)) &&
    ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::FLARE) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ROLL_OUT))) ||
    AutopilotStateMachine_DWork.state);
  isGoAroundModeActive = (AutopilotStateMachine_DWork.sAP1 || AutopilotStateMachine_DWork.sAP2);
  AutopilotStateMachine_DWork.state = ((std::abs(R - 180.0) <= 7.0) && ((isGoAroundModeActive ||
    (AutopilotStateMachine_U.in.data.flight_phase != 7.0)) && (isGoAroundModeActive || (rtb_dme <= 10.0) ||
    rtb_Compare_c) && ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::FLARE) ||
                       (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::ROLL_OUT)) &&
    ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::FLARE) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ROLL_OUT)) &&
    AutopilotStateMachine_DWork.state));
  state_a_tmp_1 = ((AutopilotStateMachine_U.in.data.throttle_lever_1_pos == 45.0) ||
                   (AutopilotStateMachine_U.in.data.throttle_lever_2_pos == 45.0));
  isGoAroundModeActive = ((!AutopilotStateMachine_DWork.sThrottleCondition) && state_a_tmp_1 &&
    (AutopilotStateMachine_U.in.data.flaps_handle_index >= 1.0) && ((rtb_on_ground == 0) || (rtb_dme < 30.0)) &&
    (AutopilotStateMachine_U.in.data.flight_phase >= 2.0) && (AutopilotStateMachine_U.in.data.flight_phase <= 6.0) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::GA_TRACK) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::SRS) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::SRS_GA));
  AutopilotStateMachine_DWork.sThrottleCondition = state_a_tmp_1;
  if (rtb_Compare_dl) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected_a = true;
  } else if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ALT) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected_a = ((std::abs(AutopilotStateMachine_U.in.data.H_ind_ft -
      AutopilotStateMachine_U.in.input.H_fcu_ft) >= 40.0) && AutopilotStateMachine_DWork.newFcuAltitudeSelected_a);
  }

  rtb_dme_tmp = AutopilotStateMachine_U.in.input.H_fcu_ft - AutopilotStateMachine_U.in.data.H_ind_ft;
  R = std::abs(rtb_dme_tmp);
  AutopilotStateMachine_DWork.was_TCAS_active = ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::
    TCAS) || ((R <= 250.0) && AutopilotStateMachine_DWork.was_TCAS_active));
  if ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::CLB) ||
      (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::OP_CLB) ||
      (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::DES) ||
      (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::OP_DES)) {
    state_a_tmp_1 = true;
  } else {
    guard1 = false;
    guard2 = false;
    if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::VS) {
      if (rtb_dme_tmp < 0.0) {
        high_i = -1;
      } else {
        high_i = (rtb_dme_tmp > 0.0);
      }

      if (AutopilotStateMachine_U.in.input.H_dot_fcu_fpm < 0.0) {
        low_i = -1;
      } else {
        low_i = (AutopilotStateMachine_U.in.input.H_dot_fcu_fpm > 0.0);
      }

      if (high_i == low_i) {
        state_a_tmp_1 = true;
      } else {
        guard2 = true;
      }
    } else {
      guard2 = true;
    }

    if (guard2) {
      if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::FPA) {
        if (rtb_dme_tmp < 0.0) {
          high_i = -1;
        } else {
          high_i = (rtb_dme_tmp > 0.0);
        }

        if (AutopilotStateMachine_U.in.input.FPA_fcu_deg < 0.0) {
          low_i = -1;
        } else {
          low_i = (AutopilotStateMachine_U.in.input.FPA_fcu_deg > 0.0);
        }

        if (high_i == low_i) {
          state_a_tmp_1 = true;
        } else {
          guard1 = true;
        }
      } else {
        guard1 = true;
      }
    }

    if (guard1) {
      if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::TCAS) {
        if (rtb_dme_tmp < 0.0) {
          high_i = -1;
        } else {
          high_i = (rtb_dme_tmp > 0.0);
        }

        if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.H_dot_c_fpm < 0.0) {
          low_i = -1;
        } else {
          low_i = (AutopilotStateMachine_DWork.Delay1_DSTATE.output.H_dot_c_fpm > 0.0);
        }

        if ((high_i == low_i) && AutopilotStateMachine_DWork.Delay1_DSTATE.output.TCAS_sub_mode_compatible) {
          state_a_tmp_1 = true;
        } else {
          state_a_tmp_1 = ((((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS) ||
                             (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS_GA)) &&
                            (rtb_dme_tmp > 250.0)) || (((AutopilotStateMachine_U.in.data.flight_phase == 0.0) ||
            (AutopilotStateMachine_U.in.data.flight_phase == 1.0) || (AutopilotStateMachine_U.in.data.flight_phase ==
            7.0)) && (!AutopilotStateMachine_DWork.Delay1_DSTATE.armed.CLB)));
        }
      } else {
        state_a_tmp_1 = ((((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS) ||
                           (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS_GA)) &&
                          (rtb_dme_tmp > 250.0)) || (((AutopilotStateMachine_U.in.data.flight_phase == 0.0) ||
          (AutopilotStateMachine_U.in.data.flight_phase == 1.0) || (AutopilotStateMachine_U.in.data.flight_phase == 7.0))
          && (!AutopilotStateMachine_DWork.Delay1_DSTATE.armed.CLB)));
      }
    }
  }

  if (AutopilotStateMachine_DWork.newFcuAltitudeSelected_a && state_a_tmp_1) {
    AutopilotStateMachine_DWork.canArm_f = 1.0;
  } else if ((std::abs(AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft) > 250.0) &&
             state_a_tmp_1) {
    AutopilotStateMachine_DWork.canArm_f = 1.0;
  } else if ((AutopilotStateMachine_DWork.was_TCAS_active && (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode ==
               vertical_mode::VS) && state_a_tmp_1) || ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode ==
               vertical_mode::TCAS) && state_a_tmp_1)) {
    AutopilotStateMachine_DWork.canArm_f = 1.0;
  }

  if (((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::VS) ||
       (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::FPA) ||
       (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::TCAS)) && (!state_a_tmp_1) &&
      (!AutopilotStateMachine_DWork.newFcuAltitudeSelected_a)) {
    AutopilotStateMachine_DWork.canArm_f = 0.0;
  }

  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT = ((AutopilotStateMachine_U.in.data.flight_phase <= 7.0) &&
    (AutopilotStateMachine_DWork.canArm_f != 0.0) && (((!rtb_Y_n) &&
    ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::CLB) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::DES))) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::OP_CLB) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::OP_DES) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::VS) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::FPA) ||
    ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::TCAS) &&
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.TCAS_sub_mode == tcas_sub_mode::NONE)) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS) ||
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS_GA) ||
    (((AutopilotStateMachine_U.in.data.flight_phase == 0.0) || (AutopilotStateMachine_U.in.data.flight_phase == 1.0) ||
      (AutopilotStateMachine_U.in.data.flight_phase == 7.0)) && (!AutopilotStateMachine_DWork.Delay1_DSTATE.armed.CLB) &&
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::NONE))));
  if ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ALT_CPT) ||
      ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ALT) && (std::abs
        (AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft) < 40.0))) {
    AutopilotStateMachine_DWork.canArm_f = 0.0;
    AutopilotStateMachine_DWork.was_TCAS_active = false;
  }

  if (rtb_Compare_dl) {
    AutopilotStateMachine_DWork.canArm = 1.0;
  } else if (std::abs(AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft) > 250.0) {
    AutopilotStateMachine_DWork.canArm = 1.0;
  }

  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT_CST = ((AutopilotStateMachine_U.in.data.flight_phase < 7.0)
    && (AutopilotStateMachine_DWork.canArm != 0.0) && rtb_Y_n && ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode
    == vertical_mode::CLB) || (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::DES)));
  switch (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode) {
   case vertical_mode::ALT_CPT:
    AutopilotStateMachine_DWork.canArm = 0.0;
    break;

   case vertical_mode::ALT:
    if (std::abs(AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft) < 40.0) {
      AutopilotStateMachine_DWork.canArm = 0.0;
    }
    break;
  }

  if ((AutopilotStateMachine_U.in.data.flight_phase == 2.0) || (AutopilotStateMachine_U.in.data.flight_phase == 3.0) ||
      (AutopilotStateMachine_U.in.data.flight_phase == 6.0)) {
    if (AutopilotStateMachine_U.in.input.H_fcu_ft < AutopilotStateMachine_U.in.data.H_ind_ft) {
      state_a_tmp_1 = true;
    } else if (R < 50.0) {
      state_a_tmp_1 = true;
    } else if ((AutopilotStateMachine_U.in.input.H_fcu_ft == AutopilotStateMachine_U.in.input.H_constraint_ft) && (std::
                abs(AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft) < 50.0)) {
      state_a_tmp_1 = true;
    } else if ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::ALT_CST) &&
               (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::ALT_CST_CPT) &&
               (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::SRS) &&
               (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::SRS_GA)) {
      state_a_tmp_1 = true;
    } else {
      state_a_tmp_1 = ((AutopilotStateMachine_U.in.data.flight_phase == 4.0) ||
                       (AutopilotStateMachine_U.in.data.flight_phase == 5.0));
    }
  } else {
    state_a_tmp_1 = ((AutopilotStateMachine_U.in.data.flight_phase == 4.0) ||
                     (AutopilotStateMachine_U.in.data.flight_phase == 5.0));
  }

  sCLB_tmp = ((((AutopilotStateMachine_U.in.data.flight_phase == 0.0) || (AutopilotStateMachine_U.in.data.flight_phase ==
    1.0) || (AutopilotStateMachine_U.in.data.flight_phase == 7.0)) &&
               ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::NONE) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS_GA)) &&
               (AutopilotStateMachine_U.in.data.acceleration_altitude > 0.0) &&
               (AutopilotStateMachine_U.in.data.acceleration_altitude < AutopilotStateMachine_U.in.input.H_fcu_ft)) ||
              (((AutopilotStateMachine_U.in.data.flight_phase == 2.0) || (AutopilotStateMachine_U.in.data.flight_phase ==
    3.0) || (AutopilotStateMachine_U.in.data.flight_phase == 6.0)) &&
               (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::NAV) && (rtb_dme_tmp > 50.0) &&
               ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ALT_CST_CPT) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ALT_CST) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS) ||
                (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS_GA))));
  AutopilotStateMachine_DWork.sCLB = (sCLB_tmp || AutopilotStateMachine_DWork.sCLB);
  sCLB_tmp_0 = ((!AutopilotStateMachine_DWork.DelayInput1_DSTATE_ib) &&
                (!AutopilotStateMachine_DWork.DelayInput1_DSTATE_bd) &&
                (!AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah));
  AutopilotStateMachine_DWork.sCLB = (sCLB_tmp_0 && (!state_a_tmp_1) && (sCLB_tmp && AutopilotStateMachine_DWork.sCLB));
  if (rtb_on_ground == 0) {
    if (AutopilotStateMachine_U.in.input.H_fcu_ft > AutopilotStateMachine_U.in.data.H_ind_ft) {
      state_a_tmp_1 = true;
    } else if (R < 50.0) {
      state_a_tmp_1 = true;
    } else if ((AutopilotStateMachine_U.in.input.H_fcu_ft == AutopilotStateMachine_U.in.input.H_constraint_ft) && (std::
                abs(AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft) < 50.0)) {
      state_a_tmp_1 = true;
    } else {
      state_a_tmp_1 = (((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::ALT_CST) &&
                        (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::ALT_CST_CPT)) ||
                       ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::NAV) &&
                        (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::LOC_CPT) &&
                        (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::LOC_TRACK)));
    }
  } else {
    state_a_tmp_1 = false;
  }

  AutopilotStateMachine_DWork.sDES = (((rtb_on_ground == 0) && (rtb_dme_tmp < -50.0) &&
    ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ALT_CST) ||
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ALT_CST_CPT)) &&
    ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::NAV) ||
     (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LOC_CPT) ||
     (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LOC_TRACK))) ||
    AutopilotStateMachine_DWork.sDES);
  AutopilotStateMachine_DWork.sDES = (sCLB_tmp_0 && (!state_a_tmp_1) && AutopilotStateMachine_DWork.sDES);
  AutopilotStateMachine_DWork.sFINAL_DES = (((AutopilotStateMachine_U.in.data.H_radio_ft >= 400.0) && state_a_tmp_2 &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::FINAL_DES) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::SRS) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::SRS_GA) &&
    rtb_BusAssignment1_input_APPR_push && AutopilotStateMachine_U.in.input.FM_rnav_appr_selected) ||
    AutopilotStateMachine_DWork.sFINAL_DES);
  sCLB_tmp = !AutopilotStateMachine_DWork.Delay1_DSTATE.condition.TCAS;
  AutopilotStateMachine_DWork.sFINAL_DES = ((state_a_tmp_2 || rtb_Compare_c) && (state_e_tmp_0 || state_a_tmp) &&
    state_a_tmp_3 && (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::SRS_GA) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::FINAL_DES) && sCLB_tmp &&
    AutopilotStateMachine_DWork.sFINAL_DES);
  state_a_tmp_1 = ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::GS_CPT) &&
                   (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::GS_TRACK) &&
                   (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::LAND) &&
                   (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::FLARE));
  AutopilotStateMachine_DWork.state_l = (((AutopilotStateMachine_U.in.data.H_radio_ft > 400.0) &&
    AutopilotStateMachine_U.in.data.nav_valid && (AutopilotStateMachine_U.in.data.throttle_lever_1_pos < 45.0) &&
    (AutopilotStateMachine_U.in.data.throttle_lever_2_pos < 45.0) && rtb_BusAssignment1_input_APPR_push && state_a_tmp_0
    && state_a_tmp_1 && state_e_tmp) || AutopilotStateMachine_DWork.state_l);
  AutopilotStateMachine_DWork.state_l = ((rtb_Compare_c || (!AutopilotStateMachine_DWork.Delay1_DSTATE.armed.GS)) &&
    state_e_tmp_0 && (rtb_BusAssignment1_input_APPR_push || (AutopilotStateMachine_DWork.Delay_DSTATE.armed.LOC ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LOC_CPT) ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LOC_TRACK) ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LAND) ||
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::FLARE))) && state_a_tmp_1 &&
    (AutopilotStateMachine_U.in.data.throttle_lever_1_pos != 45.0) &&
    (AutopilotStateMachine_U.in.data.throttle_lever_2_pos != 45.0) && sCLB_tmp && state_e_tmp &&
    AutopilotStateMachine_DWork.state_l);
  state_a_tmp_0 = (AutopilotStateMachine_U.in.input.TCAS_mode_available &&
                   (!AutopilotStateMachine_U.in.input.TCAS_mode_fail));
  AutopilotStateMachine_DWork.sTCAS_b = ((state_a_tmp_0 && (!AutopilotStateMachine_DWork.Delay1_DSTATE.armed.TCAS) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::TCAS) &&
    (AutopilotStateMachine_U.in.input.TCAS_advisory_state == 1.0) && (AutopilotStateMachine_U.in.data.H_radio_ft >=
    900.0)) || AutopilotStateMachine_DWork.sTCAS_b);
  AutopilotStateMachine_DWork.sTCAS_b = (state_a_tmp_0 && (AutopilotStateMachine_U.in.input.TCAS_advisory_state != 0.0) &&
    (AutopilotStateMachine_U.in.data.H_radio_ft >= 900.0) && (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode !=
    vertical_mode::TCAS) && AutopilotStateMachine_DWork.sTCAS_b);
  if (!AutopilotStateMachine_DWork.eventTime_not_empty_kq) {
    AutopilotStateMachine_DWork.eventTime_o = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_kq = true;
  }

  if (R >= 40.0) {
    AutopilotStateMachine_DWork.eventTime_o = AutopilotStateMachine_U.in.time.simulation_time;
  } else if (AutopilotStateMachine_DWork.eventTime_o == 0.0) {
    AutopilotStateMachine_DWork.eventTime_o = AutopilotStateMachine_U.in.time.simulation_time;
  }

  c_R = std::abs(AutopilotStateMachine_U.in.data.H_dot_ft_min);
  high_i = 7;
  low_i = 0;
  low_ip1 = 2;
  while (high_i > low_ip1) {
    mid_i = ((low_i + high_i) + 1) >> 1;
    if (c_R >= b[mid_i - 1]) {
      low_i = mid_i - 1;
      low_ip1 = mid_i + 1;
    } else {
      high_i = mid_i;
    }
  }

  xloc = c_R - static_cast<real_T>(b[low_i]);
  a = AutopilotStateMachine_U.in.data.H_dot_ft_min * 0.00508;
  if (R <= std::fmin(3000.0, std::fmax(80.0, a * a / ((((xloc * c[low_i] + c[low_i + 6]) * xloc + c[low_i + 12]) * xloc
          + c[low_i + 18]) * 9.81) * 3.2808398950131235))) {
    if (rtb_dme_tmp < 0.0) {
      high_i = -1;
    } else {
      high_i = (rtb_dme_tmp > 0.0);
    }

    if (AutopilotStateMachine_U.in.data.H_dot_ft_min < 0.0) {
      low_i = -1;
    } else {
      low_i = (AutopilotStateMachine_U.in.data.H_dot_ft_min > 0.0);
    }

    if (high_i == low_i) {
      if (c_R >= 100.0) {
        if (!AutopilotStateMachine_DWork.eventTime_not_empty_or) {
          AutopilotStateMachine_DWork.eventTime_c = AutopilotStateMachine_U.in.time.simulation_time;
          AutopilotStateMachine_DWork.eventTime_not_empty_or = true;
        }

        if (rtb_Compare_dl || (AutopilotStateMachine_DWork.eventTime_c == 0.0)) {
          AutopilotStateMachine_DWork.eventTime_c = AutopilotStateMachine_U.in.time.simulation_time;
        }

        R = AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_c;
        if (R > 0.0) {
          R += 0.5;
        }

        AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT = ((R >= 3.0) &&
          (AutopilotStateMachine_U.in.data.H_radio_ft > 400.0));
      } else {
        AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT = false;
      }
    } else {
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT = false;
    }
  } else {
    AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT = false;
  }

  if ((AutopilotStateMachine_U.in.input.H_constraint_ft != 0.0) && (AutopilotStateMachine_U.in.input.H_constraint_ft !=
       AutopilotStateMachine_U.in.input.H_fcu_ft)) {
    if (!AutopilotStateMachine_DWork.eventTime_not_empty_a) {
      AutopilotStateMachine_DWork.eventTime_nz = AutopilotStateMachine_U.in.time.simulation_time;
      AutopilotStateMachine_DWork.eventTime_not_empty_a = true;
    }

    if (std::abs(AutopilotStateMachine_U.in.input.H_constraint_ft - AutopilotStateMachine_U.in.data.H_ind_ft) >= 40.0) {
      AutopilotStateMachine_DWork.eventTime_nz = AutopilotStateMachine_U.in.time.simulation_time;
    } else if (AutopilotStateMachine_DWork.eventTime_nz == 0.0) {
      AutopilotStateMachine_DWork.eventTime_nz = AutopilotStateMachine_U.in.time.simulation_time;
    }

    AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST =
      ((AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_nz > 0.8) &&
       (!rtb_Compare_dl));
  } else {
    AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST = false;
  }

  high_i = 7;
  low_i = 0;
  low_ip1 = 2;
  while (high_i > low_ip1) {
    mid_i = ((low_i + high_i) + 1) >> 1;
    if (c_R >= b[mid_i - 1]) {
      low_i = mid_i - 1;
      low_ip1 = mid_i + 1;
    } else {
      high_i = mid_i;
    }
  }

  xloc = c_R - static_cast<real_T>(b[low_i]);
  if ((AutopilotStateMachine_U.in.input.H_constraint_ft != 0.0) && (AutopilotStateMachine_U.in.input.H_constraint_ft !=
       AutopilotStateMachine_U.in.input.H_fcu_ft)) {
    if (std::abs(AutopilotStateMachine_U.in.input.H_constraint_ft - AutopilotStateMachine_U.in.data.H_ind_ft) <= std::
        fmin(3000.0, std::fmax(80.0, a * a / ((((xloc * c[low_i] + c[low_i + 6]) * xloc + c[low_i + 12]) * xloc +
            c[low_i + 18]) * 9.81) * 3.2808398950131235))) {
      a = AutopilotStateMachine_U.in.input.H_constraint_ft - AutopilotStateMachine_U.in.data.H_ind_ft;
      if (a < 0.0) {
        high_i = -1;
      } else {
        high_i = (a > 0.0);
      }

      if (AutopilotStateMachine_U.in.data.H_dot_ft_min < 0.0) {
        low_i = -1;
      } else {
        low_i = (AutopilotStateMachine_U.in.data.H_dot_ft_min > 0.0);
      }

      if (high_i == low_i) {
        if (c_R >= 100.0) {
          if (!AutopilotStateMachine_DWork.eventTime_not_empty_p) {
            AutopilotStateMachine_DWork.eventTime_j = AutopilotStateMachine_U.in.time.simulation_time;
            AutopilotStateMachine_DWork.eventTime_not_empty_p = true;
          }

          if (rtb_Compare_dl || (AutopilotStateMachine_DWork.eventTime_j == 0.0)) {
            AutopilotStateMachine_DWork.eventTime_j = AutopilotStateMachine_U.in.time.simulation_time;
          }

          R = AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_j;
          if (R > 0.0) {
            R += 0.5;
          }

          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST_CPT = ((R >= 3.0) &&
            (AutopilotStateMachine_U.in.data.H_radio_ft > 400.0));
        } else {
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST_CPT = false;
        }
      } else {
        AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST_CPT = false;
      }
    } else {
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST_CPT = false;
    }
  } else {
    AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CST_CPT = false;
  }

  if (AutopilotStateMachine_U.in.data.nav_valid && AutopilotStateMachine_U.in.data.nav_gs_valid &&
      ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LOC_CPT) ||
       (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LOC_TRACK)) &&
      (AutopilotStateMachine_U.in.data.nav_gs_error_deg >= -0.1)) {
    c_R = std::abs(AutopilotStateMachine_U.in.data.nav_gs_error_deg);
    if ((c_R < 0.8) && rtb_FixPtRelationalOperator) {
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT = true;
    } else {
      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT = (c_R < 0.1333);
    }
  } else {
    AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT = false;
  }

  if (!AutopilotStateMachine_DWork.eventTime_not_empty_jt) {
    AutopilotStateMachine_DWork.eventTime_ax = AutopilotStateMachine_U.in.time.simulation_time;
    AutopilotStateMachine_DWork.eventTime_not_empty_jt = true;
  }

  if (state_a_tmp || (!AutopilotStateMachine_U.in.data.nav_gs_valid) || ((std::abs
        (AutopilotStateMachine_U.in.data.nav_gs_error_deg) >= 0.1333) ||
       ((AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::GS_CPT) &&
        (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::GS_TRACK))) ||
      (AutopilotStateMachine_DWork.eventTime_ax == 0.0)) {
    AutopilotStateMachine_DWork.eventTime_ax = AutopilotStateMachine_U.in.time.simulation_time;
  }

  if ((rtb_dme >= 30.0) && (AutopilotStateMachine_U.in.data.V2_kn >= 90.0) &&
      (AutopilotStateMachine_U.in.data.flaps_handle_index > 0.0)) {
    if (!AutopilotStateMachine_DWork.eventTime_not_empty_jq) {
      AutopilotStateMachine_DWork.eventTime_d = AutopilotStateMachine_U.in.time.simulation_time;
      AutopilotStateMachine_DWork.eventTime_not_empty_jq = true;
    }

    if ((((AutopilotStateMachine_U.in.data.throttle_lever_1_pos <= 35.0) ||
          (AutopilotStateMachine_U.in.data.throttle_lever_2_pos <= 35.0)) &&
         ((!AutopilotStateMachine_U.in.input.is_FLX_active) || (AutopilotStateMachine_U.in.data.throttle_lever_1_pos <
           35.0) || (AutopilotStateMachine_U.in.data.throttle_lever_2_pos < 35.0))) ||
        (AutopilotStateMachine_DWork.eventTime_d == 0.0)) {
      AutopilotStateMachine_DWork.eventTime_d = AutopilotStateMachine_U.in.time.simulation_time;
    }

    rtb_Compare_c = (AutopilotStateMachine_U.in.time.simulation_time - AutopilotStateMachine_DWork.eventTime_d >= 0.5);
  } else {
    rtb_Compare_c = false;
  }

  AutopilotStateMachine_DWork.sSRS = (rtb_Compare_c || (((!AutopilotStateMachine_DWork.sSRS) ||
    (((AutopilotStateMachine_U.in.data.throttle_lever_1_pos != 0.0) ||
      (AutopilotStateMachine_U.in.data.throttle_lever_2_pos != 0.0)) &&
     (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::SRS))) && AutopilotStateMachine_DWork.sSRS));
  if (rtb_Compare_dl) {
    AutopilotStateMachine_DWork.newFcuAltitudeSelected = true;
  } else {
    c_R = std::abs(AutopilotStateMachine_U.in.data.H_ind_ft - AutopilotStateMachine_U.in.input.H_fcu_ft);
    if (c_R > 250.0) {
      AutopilotStateMachine_DWork.newFcuAltitudeSelected = true;
    } else if (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode == vertical_mode::ALT) {
      AutopilotStateMachine_DWork.newFcuAltitudeSelected = ((c_R >= 40.0) &&
        AutopilotStateMachine_DWork.newFcuAltitudeSelected);
    }
  }

  if (state_a_tmp_0 && (AutopilotStateMachine_U.in.input.TCAS_advisory_state >= 2.0) &&
      (AutopilotStateMachine_U.in.data.H_radio_ft >= 900.0) && (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode !=
       vertical_mode::TCAS) && (!AutopilotStateMachine_DWork.latch)) {
    AutopilotStateMachine_DWork.sTCAS = true;
    AutopilotStateMachine_DWork.latch = true;
  }

  AutopilotStateMachine_DWork.sTCAS = (state_a_tmp_0 && (AutopilotStateMachine_U.in.input.TCAS_advisory_state >= 2.0) &&
    (AutopilotStateMachine_U.in.data.H_radio_ft >= 900.0) && (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode !=
    vertical_mode::TCAS) && AutopilotStateMachine_DWork.sTCAS);
  AutopilotStateMachine_DWork.latch = (state_a_tmp_0 && (AutopilotStateMachine_U.in.data.H_radio_ft >= 900.0) &&
    (AutopilotStateMachine_U.in.input.TCAS_advisory_state >= 2.0) && AutopilotStateMachine_DWork.latch);
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
  AutopilotStateMachine_B.BusAssignment_g.data.altimeter_setting_changed = (AutopilotStateMachine_DWork.Delay_DSTATE_g
    != AutopilotStateMachine_P.CompareToConstant_const_c);
  AutopilotStateMachine_B.BusAssignment_g.data.total_weight_kg = AutopilotStateMachine_U.in.data.total_weight_kg;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.time_since_touchdown = rtb_dme;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.time_since_lift_off = Phi2;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.time_since_SRS = AutopilotStateMachine_U.in.time.simulation_time
    - AutopilotStateMachine_DWork.eventTime_n;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.H_fcu_in_selection = rtb_Compare_dl;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.H_constraint_valid = rtb_Y_n;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.Psi_fcu_in_selection = rtb_AND;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.gs_convergent_towards_beam = rtb_FixPtRelationalOperator;
  AutopilotStateMachine_B.BusAssignment_g.data_computed.V_fcu_in_selection = (rtb_AND_j &&
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_o);
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
  AutopilotStateMachine_B.BusAssignment_g.input.LOC_push = AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn;
  AutopilotStateMachine_B.BusAssignment_g.input.APPR_push = rtb_BusAssignment1_input_APPR_push;
  AutopilotStateMachine_B.BusAssignment_g.input.V_fcu_kn = AutopilotStateMachine_U.in.input.V_fcu_kn;
  AutopilotStateMachine_B.BusAssignment_g.input.Psi_fcu_deg = AutopilotStateMachine_U.in.input.Psi_fcu_deg;
  AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft = AutopilotStateMachine_U.in.input.H_fcu_ft;
  AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft = AutopilotStateMachine_U.in.input.H_constraint_ft;
  AutopilotStateMachine_B.BusAssignment_g.input.H_dot_fcu_fpm = AutopilotStateMachine_U.in.input.H_dot_fcu_fpm;
  AutopilotStateMachine_B.BusAssignment_g.input.FPA_fcu_deg = AutopilotStateMachine_U.in.input.FPA_fcu_deg;
  AutopilotStateMachine_B.BusAssignment_g.input.TRK_FPA_mode = AutopilotStateMachine_U.in.input.TRK_FPA_mode;
  AutopilotStateMachine_B.BusAssignment_g.input.DIR_TO_trigger = (AutopilotStateMachine_DWork.Delay_DSTATE_d !=
    AutopilotStateMachine_P.CompareToConstant_const);
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
  AutopilotStateMachine_B.BusAssignment_g.input.condition_Flare = AutopilotStateMachine_U.in.input.condition_Flare;
  AutopilotStateMachine_B.BusAssignment_g.lateral.output =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.lateral.output;
  AutopilotStateMachine_B.BusAssignment_g.lateral_previous = AutopilotStateMachine_DWork.Delay_DSTATE;
  AutopilotStateMachine_B.BusAssignment_g.vertical.output =
    AutopilotStateMachine_P.ap_sm_output_MATLABStruct.vertical.output;
  AutopilotStateMachine_B.BusAssignment_g.vertical_previous = AutopilotStateMachine_DWork.Delay1_DSTATE;
  AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 = AutopilotStateMachine_DWork.sAP1;
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
  AutopilotStateMachine_B.BusAssignment_g.lateral.armed.NAV = AutopilotStateMachine_DWork.state_a;
  AutopilotStateMachine_B.BusAssignment_g.lateral.armed.LOC = AutopilotStateMachine_DWork.state_e;
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.NAV = ((AutopilotStateMachine_U.in.data.H_radio_ft >= 30.0) &&
    AutopilotStateMachine_U.in.data.is_flight_plan_available && (AutopilotStateMachine_U.in.data.flight_guidance_xtk_nmi
    < 10.0));
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LOC_TRACK = (AutopilotStateMachine_U.in.time.simulation_time
    - AutopilotStateMachine_DWork.eventTime_dp >= 10.0);
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.LAND = speedTargetChanged;
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.FLARE = rtb_cFLARE;
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.ROLL_OUT = AutopilotStateMachine_DWork.state;
  AutopilotStateMachine_B.BusAssignment_g.lateral.condition.GA_TRACK = (isGoAroundModeActive &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::NAV) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::HDG) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode != lateral_mode::TRACK));
  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB = AutopilotStateMachine_DWork.sCLB;
  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.DES = AutopilotStateMachine_DWork.sDES;
  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES = AutopilotStateMachine_DWork.sFINAL_DES;
  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS = AutopilotStateMachine_DWork.state_l;
  AutopilotStateMachine_B.BusAssignment_g.vertical.armed.TCAS = AutopilotStateMachine_DWork.sTCAS_b;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT = ((AutopilotStateMachine_U.in.time.simulation_time -
    AutopilotStateMachine_DWork.eventTime_o > 0.8) && (!rtb_Compare_dl));
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB = ((Phi2 > 5.0) && (rtb_dme_tmp > 50.0) &&
    (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::NAV) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::GS_CPT) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::GS_TRACK) &&
    (AutopilotStateMachine_U.in.data.flight_phase >= 2.0) && (AutopilotStateMachine_U.in.data.flight_phase != 4.0) &&
    (AutopilotStateMachine_U.in.data.flight_phase != 5.0) && (AutopilotStateMachine_U.in.data.flight_phase != 6.0));
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES = ((Phi2 > 5.0) && (rtb_dme_tmp < -50.0) &&
    ((AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::NAV) ||
     (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LOC_CPT) ||
     (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode == lateral_mode::LOC_TRACK)) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::SRS) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::SRS_GA) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::GS_CPT) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::GS_TRACK) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::LAND) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::FINAL_DES) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::FLARE) &&
    (AutopilotStateMachine_DWork.Delay1_DSTATE.output.mode != vertical_mode::ROLL_OUT) &&
    (AutopilotStateMachine_U.in.data.flight_phase != 1.0) && (AutopilotStateMachine_U.in.data.flight_phase != 2.0) &&
    (AutopilotStateMachine_U.in.data.flight_phase != 6.0));
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES =
    (AutopilotStateMachine_U.in.input.FM_final_des_can_engage && (AutopilotStateMachine_DWork.Delay_DSTATE.output.mode ==
      lateral_mode::NAV));
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_TRACK = (AutopilotStateMachine_U.in.time.simulation_time
    - AutopilotStateMachine_DWork.eventTime_ax >= 15.0);
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.LAND = speedTargetChanged;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FLARE = rtb_cFLARE;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ROLL_OUT = AutopilotStateMachine_DWork.state;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.SRS = AutopilotStateMachine_DWork.sSRS;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.SRS_GA = isGoAroundModeActive;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.THR_RED = (AutopilotStateMachine_U.in.data.H_ind_ft >=
    AutopilotStateMachine_U.in.data.thrust_reduction_altitude);
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active =
    AutopilotStateMachine_DWork.newFcuAltitudeSelected;
  AutopilotStateMachine_B.BusAssignment_g.vertical.condition.TCAS = AutopilotStateMachine_DWork.sTCAS;
  if (AutopilotStateMachine_DWork.is_active_c1_AutopilotStateMachine == 0) {
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
          AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_HDG;
          AutopilotStateMachine_HDG_entry(&AutopilotStateMachine_B.BusAssignment_g);
        } else if (AutopilotStateMachine_ON_TO_NAV(&AutopilotStateMachine_B.BusAssignment_g)) {
          AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_ON;
          AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NAV;
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
        AutopilotStateMachine_B.out_g.mode_reversion = true;
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_ON;
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_HDG;
        AutopilotStateMachine_HDG_entry(&AutopilotStateMachine_B.BusAssignment_g);
      } else if (AutopilotStateMachine_OFF_TO_NAV(&AutopilotStateMachine_B.BusAssignment_g)) {
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_ON;
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_NAV;
        AutopilotStateMachine_NAV_entry();
      } else if (AutopilotStateMachine_OFF_TO_RWY(&AutopilotStateMachine_B.BusAssignment_g)) {
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_ON;
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_RWY;
        AutopilotStateMachine_RWY_entry();
      } else if (AutopilotStateMachine_OFF_TO_RWY_TRK(&AutopilotStateMachine_B.BusAssignment_g)) {
        AutopilotStateMachine_DWork.is_c1_AutopilotStateMachine = AutopilotStateMachine_IN_ON;
        AutopilotStateMachine_DWork.is_ON_j = AutopilotStateMachine_IN_RWY_TRK;
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
      }
    }
  }

  AutopilotStateMachine_B.BusAssignment_g.lateral.output = AutopilotStateMachine_B.out_g;
  if (AutopilotStateMachine_DWork.is_active_c6_AutopilotStateMachine == 0) {
    AutopilotStateMachine_DWork.is_active_c6_AutopilotStateMachine = 1U;
    AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_o;
    AutopilotStateMachine_OFF_entry_i();
  } else {
    guard1 = false;
    switch (AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine) {
     case AutopilotStateMachine_IN_OFF_o:
      if (AutopilotStateMachine_B.BusAssignment_g.input.FD_active &&
          (AutopilotStateMachine_B.BusAssignment_g.data.on_ground != 0.0) &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.SRS) {
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
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
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
        AutopilotStateMachine_VS_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB) {
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
        AutopilotStateMachine_CLB_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES) {
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
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

     case AutopilotStateMachine_IN_ON_g:
      AutopilotStateMachine_ON_i();
      break;

     case AutopilotStateMachine_IN_SRS_GA:
      if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS &&
          AutopilotStateMachine_B.BusAssignment_g.vertical.condition.GS_CPT) {
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_GS;
        AutopilotStateMachine_DWork.is_GS = AutopilotStateMachine_IN_GS_CPT;
        AutopilotStateMachine_GS_CPT_entry();
      } else if (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES &&
                 AutopilotStateMachine_B.BusAssignment_g.vertical.condition.FINAL_DES) {
        AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
        AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_FINAL_DES;
        AutopilotStateMachine_FINAL_DES_entry();
      } else {
        rtb_GainTheta = AutopilotStateMachine_B.BusAssignment_g.input.H_fcu_ft -
          AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft;
        state_a_tmp = ((AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull ||
                        AutopilotStateMachine_B.BusAssignment_g.input.EXPED_push) &&
                       AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active);
        if (state_a_tmp && (rtb_GainTheta < -40.0)) {
          AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
          AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_DES;
          AutopilotStateMachine_OP_DES_entry();
        } else if (state_a_tmp && (rtb_GainTheta > 40.0)) {
          guard1 = true;
        } else {
          c_R = std::abs(AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft -
                         AutopilotStateMachine_B.BusAssignment_g.data.H_ind_ft);
          if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
              AutopilotStateMachine_B.BusAssignment_g.vertical.condition.CLB &&
              AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
              ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (c_R > 40.0))) {
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_CLB;
            AutopilotStateMachine_CLB_entry();
          } else if (AutopilotStateMachine_B.BusAssignment_g.input.ALT_push &&
                     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.DES &&
                     AutopilotStateMachine_B.BusAssignment_g.vertical.condition.H_fcu_active &&
                     ((AutopilotStateMachine_B.BusAssignment_g.input.H_constraint_ft == 0.0) || (c_R > 40.0))) {
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_DES;
            AutopilotStateMachine_DES_entry();
          } else if (AutopilotStateMachine_B.BusAssignment_g.input.VS_push ||
                     AutopilotStateMachine_B.BusAssignment_g.input.VS_pull) {
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
            AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_VS;
            AutopilotStateMachine_VS_entry();
          } else if ((AutopilotStateMachine_B.BusAssignment_g.data.H_radio_ft > 400.0) &&
                     (AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT &&
                      AutopilotStateMachine_B.BusAssignment_g.vertical.condition.ALT_CPT)) {
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
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
            AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_OFF_o;
            AutopilotStateMachine_OFF_entry_i();
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
      AutopilotStateMachine_DWork.is_c6_AutopilotStateMachine = AutopilotStateMachine_IN_ON_g;
      AutopilotStateMachine_DWork.is_ON = AutopilotStateMachine_IN_OP_CLB;
      AutopilotStateMachine_OP_CLB_entry();
    }
  }

  AutopilotStateMachine_DWork.Delay1_DSTATE = AutopilotStateMachine_B.BusAssignment_g.vertical;
  AutopilotStateMachine_DWork.Delay1_DSTATE.output = AutopilotStateMachine_B.out;
  AutopilotStateMachine_BitShift(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.lateral.armed.NAV),
    &rtb_GainTheta);
  AutopilotStateMachine_BitShift1(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.lateral.armed.LOC),
    &rtb_GainTheta1);
  if (AutopilotStateMachine_B.BusAssignment_g.input.FD_active ||
      (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 != 0.0) ||
      (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 != 0.0)) {
    Double2MultiWord(std::floor(rtb_GainTheta), &tmp_0.chunks[0U], 2);
    Double2MultiWord(std::floor(rtb_GainTheta1), &tmp_1.chunks[0U], 2);
    MultiWordIor(&tmp_0.chunks[0U], &tmp_1.chunks[0U], &tmp.chunks[0U], 2);
    AutopilotStateMachine_Y.out.output.lateral_mode_armed = uMultiWord2Double(&tmp.chunks[0U], 2, 0);
  } else {
    AutopilotStateMachine_Y.out.output.lateral_mode_armed = AutopilotStateMachine_P.Constant_Value;
  }

  AutopilotStateMachine_BitShift(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT),
    &rtb_GainTheta);
  AutopilotStateMachine_BitShift1(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.vertical.armed.ALT_CST),
    &rtb_GainTheta1);
  if (AutopilotStateMachine_B.BusAssignment_g.input.FD_active ||
      (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP1 != 0.0) ||
      (AutopilotStateMachine_B.BusAssignment_g.output.enabled_AP2 != 0.0)) {
    Double2MultiWord(std::floor(rtb_GainTheta), &tmp_7.chunks[0U], 2);
    Double2MultiWord(std::floor(rtb_GainTheta1), &tmp_8.chunks[0U], 2);
    MultiWordIor(&tmp_7.chunks[0U], &tmp_8.chunks[0U], &tmp_6.chunks[0U], 2);
    Double2MultiWord(std::ldexp(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.vertical.armed.CLB),
      static_cast<int32_T>(AutopilotStateMachine_N_c)), &tmp_7.chunks[0U], 2);
    MultiWordIor(&tmp_6.chunks[0U], &tmp_7.chunks[0U], &tmp_5.chunks[0U], 2);
    Double2MultiWord(std::ldexp(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.vertical.armed.DES),
      static_cast<int32_T>(AutopilotStateMachine_N_a)), &tmp_6.chunks[0U], 2);
    MultiWordIor(&tmp_5.chunks[0U], &tmp_6.chunks[0U], &tmp_4.chunks[0U], 2);
    Double2MultiWord(std::ldexp(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.vertical.armed.GS),
      static_cast<int32_T>(AutopilotStateMachine_N_j)), &tmp_5.chunks[0U], 2);
    MultiWordIor(&tmp_4.chunks[0U], &tmp_5.chunks[0U], &tmp_3.chunks[0U], 2);
    Double2MultiWord(std::ldexp(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.vertical.armed.FINAL_DES),
      static_cast<int32_T>(AutopilotStateMachine_N_k)), &tmp_4.chunks[0U], 2);
    MultiWordIor(&tmp_3.chunks[0U], &tmp_4.chunks[0U], &tmp_2.chunks[0U], 2);
    Double2MultiWord(std::ldexp(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.vertical.armed.TCAS),
      static_cast<int32_T>(AutopilotStateMachine_N_kp)), &tmp_3.chunks[0U], 2);
    MultiWordIor(&tmp_2.chunks[0U], &tmp_3.chunks[0U], &tmp_1.chunks[0U], 2);
    AutopilotStateMachine_Y.out.output.vertical_mode_armed = uMultiWord2Double(&tmp_1.chunks[0U], 2, 0);
  } else {
    Double2MultiWord(std::ldexp(static_cast<real_T>(AutopilotStateMachine_B.BusAssignment_g.vertical.armed.TCAS),
      static_cast<int32_T>(AutopilotStateMachine_N_kp)), &tmp_0.chunks[0U], 2);
    AutopilotStateMachine_Y.out.output.vertical_mode_armed = uMultiWord2Double(&tmp_0.chunks[0U], 2, 0);
  }

  AutopilotStateMachine_DWork.Delay_DSTATE_e += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_B.BusAssignment_g.lateral.output.mode_reversion) - AutopilotStateMachine_DWork.Delay_DSTATE_e,
    AutopilotStateMachine_P.Raising_Value_b * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_a / AutopilotStateMachine_P.Debounce_Value_f *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.Delay_DSTATE_f += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_B.out.mode_reversion) - AutopilotStateMachine_DWork.Delay_DSTATE_f,
    AutopilotStateMachine_P.Raising_Value_f * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_b / AutopilotStateMachine_P.Debounce_Value_a *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.Delay_DSTATE_k += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_B.BusAssignment_g.lateral.output.mode_reversion_TRK_FPA ||
     AutopilotStateMachine_B.out.mode_reversion_TRK_FPA) - AutopilotStateMachine_DWork.Delay_DSTATE_k,
    AutopilotStateMachine_P.Raising_Value_c * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_ay / AutopilotStateMachine_P.Debounce_Value_j *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  if (!AutopilotStateMachine_DWork.eventTimeTC_not_empty) {
    AutopilotStateMachine_DWork.eventTimeTC = AutopilotStateMachine_B.BusAssignment_g.time.simulation_time;
    AutopilotStateMachine_DWork.eventTimeTC_not_empty = true;
  }

  if (!AutopilotStateMachine_DWork.eventTimeMR_not_empty) {
    AutopilotStateMachine_DWork.eventTimeMR = AutopilotStateMachine_B.BusAssignment_g.time.simulation_time;
    AutopilotStateMachine_DWork.eventTimeMR_not_empty = true;
  }

  state_a_tmp = !AutopilotStateMachine_B.BusAssignment_g.input.VS_pull;
  if (AutopilotStateMachine_B.out.mode_reversion &&
      (((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode::CLB) &&
        (AutopilotStateMachine_B.out.mode == vertical_mode::OP_CLB)) ||
       ((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode::DES) &&
        (AutopilotStateMachine_B.out.mode == vertical_mode::VS))) &&
      (!AutopilotStateMachine_B.BusAssignment_g.input.ALT_pull) && state_a_tmp) {
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

  if (AutopilotStateMachine_B.out.mode_reversion && (AutopilotStateMachine_B.out.mode == vertical_mode::VS) &&
      ((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode::OP_CLB) ||
       (AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode::OP_DES) ||
       (AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode::ALT_CPT)) &&
      (!AutopilotStateMachine_B.BusAssignment_g.input.VS_push) && state_a_tmp) {
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
      ((AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode::OP_CLB) ||
       (AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode::OP_DES))) {
    AutopilotStateMachine_DWork.modeReversionFMA = false;
    rtb_on_ground = 1;
    AutopilotStateMachine_Y.out.output.mode_reversion_fma = false;
  } else if (AutopilotStateMachine_B.out.speed_protection_mode &&
             (!AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.speed_protection_mode)) {
    AutopilotStateMachine_DWork.modeReversionFMA = false;
    rtb_on_ground = 1;
    AutopilotStateMachine_Y.out.output.mode_reversion_fma = false;
  } else if ((AutopilotStateMachine_B.out.mode == vertical_mode::VS) &&
             (AutopilotStateMachine_B.BusAssignment_g.vertical_previous.output.mode == vertical_mode::TCAS)) {
    AutopilotStateMachine_DWork.modeReversionFMA = false;
    rtb_on_ground = 1;
    AutopilotStateMachine_Y.out.output.mode_reversion_fma = false;
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
    AutopilotStateMachine_DWork.Delay_DSTATE_m, AutopilotStateMachine_P.Raising_Value_ag *
    AutopilotStateMachine_B.BusAssignment_g.time.dt), AutopilotStateMachine_P.Falling_Value_k /
    AutopilotStateMachine_P.Debounce1_Value_p * AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_o = (AutopilotStateMachine_DWork.Delay_DSTATE_m !=
    AutopilotStateMachine_P.CompareToConstant_const_n);
  AutopilotStateMachine_DWork.Delay_DSTATE_h += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_B.out.TCAS_message_disarm) - AutopilotStateMachine_DWork.Delay_DSTATE_h,
    AutopilotStateMachine_P.Raising_Value_i * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_o / AutopilotStateMachine_P.Debounce_Value_d *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_h = (AutopilotStateMachine_DWork.Delay_DSTATE_h !=
    AutopilotStateMachine_P.CompareToConstant_const_i);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn = AutopilotStateMachine_DWork.DelayInput1_DSTATE_c;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn = (static_cast<int32_T>
    (AutopilotStateMachine_B.out.TCAS_message_RA_inhibit) > static_cast<int32_T>
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn));
  AutopilotStateMachine_DWork.Delay_DSTATE_cm += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn) - AutopilotStateMachine_DWork.Delay_DSTATE_cm,
    AutopilotStateMachine_P.Raising_Value_cl * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_c / AutopilotStateMachine_P.Debounce_Value_k *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn = (AutopilotStateMachine_DWork.Delay_DSTATE_cm !=
    AutopilotStateMachine_P.CompareToConstant_const_hz);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah = AutopilotStateMachine_DWork.DelayInput1_DSTATE_og;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah = (static_cast<int32_T>
    (AutopilotStateMachine_B.out.TCAS_message_TRK_FPA_deselection) > static_cast<int32_T>
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah));
  AutopilotStateMachine_DWork.Delay_DSTATE_b += std::fmax(std::fmin(static_cast<real_T>
    (AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah) - AutopilotStateMachine_DWork.Delay_DSTATE_b,
    AutopilotStateMachine_P.Raising_Value_d * AutopilotStateMachine_B.BusAssignment_g.time.dt),
    AutopilotStateMachine_P.Falling_Value_as / AutopilotStateMachine_P.Debounce_Value_h *
    AutopilotStateMachine_B.BusAssignment_g.time.dt);
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah = (AutopilotStateMachine_DWork.Delay_DSTATE_b !=
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
  AutopilotStateMachine_Y.out.output.lateral_law = static_cast<real_T>
    (AutopilotStateMachine_B.BusAssignment_g.lateral.output.law);
  AutopilotStateMachine_Y.out.output.lateral_mode = static_cast<real_T>
    (AutopilotStateMachine_B.BusAssignment_g.lateral.output.mode);
  AutopilotStateMachine_Y.out.output.vertical_law = static_cast<real_T>(AutopilotStateMachine_B.out.law);
  AutopilotStateMachine_Y.out.output.vertical_mode = static_cast<real_T>(AutopilotStateMachine_B.out.mode);
  AutopilotStateMachine_Y.out.output.mode_reversion_lateral = (AutopilotStateMachine_DWork.Delay_DSTATE_e !=
    AutopilotStateMachine_P.CompareToConstant_const_d);
  AutopilotStateMachine_Y.out.output.mode_reversion_vertical = (AutopilotStateMachine_DWork.Delay_DSTATE_f !=
    AutopilotStateMachine_P.CompareToConstant_const_j);
  AutopilotStateMachine_Y.out.output.mode_reversion_vertical_target_fpm =
    AutopilotStateMachine_B.out.mode_reversion_target_fpm;
  AutopilotStateMachine_Y.out.output.mode_reversion_TRK_FPA = (AutopilotStateMachine_DWork.Delay_DSTATE_k !=
    AutopilotStateMachine_P.CompareToConstant_const_da);
  AutopilotStateMachine_Y.out.output.mode_reversion_triple_click = AutopilotStateMachine_DWork.DelayInput1_DSTATE_o;
  AutopilotStateMachine_Y.out.output.speed_protection_mode = AutopilotStateMachine_B.out.speed_protection_mode;
  AutopilotStateMachine_Y.out.output.autothrust_mode = static_cast<real_T>(AutopilotStateMachine_B.out.mode_autothrust);
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
  AutopilotStateMachine_Y.out.output.TCAS_message_disarm = AutopilotStateMachine_DWork.DelayInput1_DSTATE_h;
  AutopilotStateMachine_Y.out.output.TCAS_message_RA_inhibit = AutopilotStateMachine_DWork.DelayInput1_DSTATE_fn;
  AutopilotStateMachine_Y.out.output.TCAS_message_TRK_FPA_deselection =
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_ah;
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
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_b = AutopilotStateMachine_DWork.pY;
  for (rtb_on_ground = 0; rtb_on_ground < 99; rtb_on_ground++) {
    AutopilotStateMachine_DWork.Delay_DSTATE_d5[rtb_on_ground] =
      AutopilotStateMachine_DWork.Delay_DSTATE_d5[rtb_on_ground + 1];
    AutopilotStateMachine_DWork.Delay_DSTATE_c[rtb_on_ground] = AutopilotStateMachine_DWork.Delay_DSTATE_c[rtb_on_ground
      + 1];
    AutopilotStateMachine_DWork.Delay_DSTATE_d2[rtb_on_ground] =
      AutopilotStateMachine_DWork.Delay_DSTATE_d2[rtb_on_ground + 1];
  }

  AutopilotStateMachine_DWork.Delay_DSTATE_d5[99] = AutopilotStateMachine_U.in.input.H_fcu_ft;
  AutopilotStateMachine_DWork.Delay_DSTATE_c[99] = AutopilotStateMachine_U.in.input.Psi_fcu_deg;
  AutopilotStateMachine_DWork.Delay_DSTATE_d2[99] = AutopilotStateMachine_U.in.input.V_fcu_kn;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_c = AutopilotStateMachine_B.out.TCAS_message_RA_inhibit;
  AutopilotStateMachine_DWork.DelayInput1_DSTATE_og = AutopilotStateMachine_B.out.TCAS_message_TRK_FPA_deselection;
}

void AutopilotStateMachine::initialize()
{
  {
    int32_T i;
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
    AutopilotStateMachine_DWork.Delay_DSTATE_d = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition;
    AutopilotStateMachine_DWork.DelayInput1_DSTATE = AutopilotStateMachine_P.DetectChange_vinit;
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_i = AutopilotStateMachine_P.DetectChange1_vinit;
    AutopilotStateMachine_DWork.Delay_DSTATE = AutopilotStateMachine_P.Delay_InitialCondition;
    AutopilotStateMachine_DWork.Delay1_DSTATE = AutopilotStateMachine_P.Delay1_InitialCondition;
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_b = AutopilotStateMachine_P.DetectDecrease_vinit;
    for (i = 0; i < 100; i++) {
      AutopilotStateMachine_DWork.Delay_DSTATE_d5[i] = AutopilotStateMachine_P.Delay_InitialCondition_i;
      AutopilotStateMachine_DWork.Delay_DSTATE_c[i] = AutopilotStateMachine_P.Delay_InitialCondition_m;
      AutopilotStateMachine_DWork.Delay_DSTATE_d2[i] = AutopilotStateMachine_P.Delay_InitialCondition_i4;
    }

    AutopilotStateMachine_DWork.Delay_DSTATE_g = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_a;
    AutopilotStateMachine_DWork.Delay_DSTATE_e = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_d;
    AutopilotStateMachine_DWork.Delay_DSTATE_f =
      AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_db;
    AutopilotStateMachine_DWork.Delay_DSTATE_k = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_g;
    AutopilotStateMachine_DWork.Delay_DSTATE_m = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_h;
    AutopilotStateMachine_DWork.Delay_DSTATE_h = AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_m;
    AutopilotStateMachine_DWork.Delay_DSTATE_cm =
      AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_ge;
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_c = AutopilotStateMachine_P.DetectIncrease1_vinit_f;
    AutopilotStateMachine_DWork.Delay_DSTATE_b =
      AutopilotStateMachine_P.RateLimiterDynamicVariableTs_InitialCondition_do;
    AutopilotStateMachine_DWork.DelayInput1_DSTATE_og = AutopilotStateMachine_P.DetectIncrease10_vinit_h;
  }
}

void AutopilotStateMachine::terminate()
{
}

AutopilotStateMachine::AutopilotStateMachine():
  AutopilotStateMachine_U(),
  AutopilotStateMachine_Y(),
  AutopilotStateMachine_B(),
  AutopilotStateMachine_DWork()
{
}

AutopilotStateMachine::~AutopilotStateMachine() = default;
