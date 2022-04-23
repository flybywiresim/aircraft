#include "PitchDirectLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"

const uint8_T PitchDirectLaw_IN_Flare_Reduce_Theta_c{ 1U };

const uint8_T PitchDirectLaw_IN_Flare_Set_Rate{ 2U };

const uint8_T PitchDirectLaw_IN_Flare_Store_Theta_c_deg{ 3U };

const uint8_T PitchDirectLaw_IN_Flight_High{ 4U };

const uint8_T PitchDirectLaw_IN_Flight_Low{ 5U };

const uint8_T PitchDirectLaw_IN_Ground{ 6U };

const uint8_T PitchDirectLaw_IN_frozen{ 1U };

const uint8_T PitchDirectLaw_IN_running{ 2U };

const uint8_T PitchDirectLaw_IN_Flight{ 1U };

const uint8_T PitchDirectLaw_IN_FlightToGroundTransition{ 2U };

const uint8_T PitchDirectLaw_IN_Ground_c{ 3U };

const uint8_T PitchDirectLaw_IN_automatic{ 1U };

const uint8_T PitchDirectLaw_IN_manual{ 2U };

const uint8_T PitchDirectLaw_IN_reset{ 3U };

const uint8_T PitchDirectLaw_IN_tracking{ 4U };

const uint8_T PitchDirectLaw_IN_flight_clean{ 1U };

const uint8_T PitchDirectLaw_IN_flight_flaps{ 2U };

const uint8_T PitchDirectLaw_IN_ground{ 3U };

const uint8_T PitchDirectLaw_IN_OFF{ 1U };

const uint8_T PitchDirectLaw_IN_ON{ 2U };

PitchDirectLaw::Parameters_PitchDirectLaw_T PitchDirectLaw::PitchDirectLaw_rtP{

  { 0.0, 0.06, 0.1, 0.2, 1.0 },

  0.05,

  0.0,

  0.0,

  2.0,

  0.0,

  0.0,


  { 1.0, 1.0, 0.5, 0.3, 0.3 },

  -0.2,

  -0.5,

  -0.5,

  -0.5,

  -45.0,

  0.2,

  0.5,

  0.5,

  0.5,

  45.0,

  1.0,

  0.0,

  1.0,

  0.0,

  1.0,

  0.0,

  0.0,

  30.0,

  1U,

  1U
};

void PitchDirectLaw::PitchDirectLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts, real_T
  rtu_init, real_T *rty_Y, rtDW_RateLimiter_PitchDirectLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void PitchDirectLaw::PitchDirectLaw_eta_trim_limit_lofreeze(const real_T *rtu_eta_trim, const boolean_T *rtu_trigger,
  real_T *rty_y, rtDW_eta_trim_limit_lofreeze_PitchDirectLaw_T *localDW)
{
  if ((!*rtu_trigger) || (!localDW->frozen_eta_trim_not_empty)) {
    localDW->frozen_eta_trim = *rtu_eta_trim;
    localDW->frozen_eta_trim_not_empty = true;
  }

  *rty_y = localDW->frozen_eta_trim;
}

void PitchDirectLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_time_simulation_time, const real_T
  *rtu_In_nz_g, const real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg, const real_T *rtu_In_eta_trim_deg, const
  real_T *rtu_In_V_tas_kn, const real_T *rtu_In_H_radio_ft, const real_T *rtu_In_flaps_handle_index, const real_T
  *rtu_In_thrust_lever_1_pos, const real_T *rtu_In_thrust_lever_2_pos, const real_T *rtu_In_delta_eta_pos, const
  boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T *rtu_In_high_aoa_prot_active,
  const boolean_T *rtu_In_high_speed_prot_active, real_T *rty_Out_eta_deg, real_T *rty_Out_eta_trim_deg)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  real_T ca;
  real_T rtb_ManualSwitch;
  real_T rtb_Y_g;
  int32_T rtb_in_flare;
  if (PitchDirectLaw_rtP.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = PitchDirectLaw_rtP.Constant1_Value;
  } else {
    rtb_ManualSwitch = PitchDirectLaw_rtP.Constant_Value;
  }

  if ((!PitchDirectLaw_DWork.pY_not_empty) || (!PitchDirectLaw_DWork.pU_not_empty)) {
    PitchDirectLaw_DWork.pU = *rtu_In_Theta_deg;
    PitchDirectLaw_DWork.pU_not_empty = true;
    PitchDirectLaw_DWork.pY = *rtu_In_Theta_deg;
    PitchDirectLaw_DWork.pY_not_empty = true;
  }

  rtb_Y_g = *rtu_In_time_dt * PitchDirectLaw_rtP.LagFilter_C1;
  ca = rtb_Y_g / (rtb_Y_g + 2.0);
  PitchDirectLaw_DWork.pY = (2.0 - rtb_Y_g) / (rtb_Y_g + 2.0) * PitchDirectLaw_DWork.pY + (*rtu_In_Theta_deg * ca +
    PitchDirectLaw_DWork.pU * ca);
  PitchDirectLaw_DWork.pU = *rtu_In_Theta_deg;
  if (PitchDirectLaw_DWork.is_active_c3_PitchDirectLaw == 0U) {
    PitchDirectLaw_DWork.is_active_c3_PitchDirectLaw = 1U;
    PitchDirectLaw_DWork.is_c3_PitchDirectLaw = PitchDirectLaw_IN_Ground_c;
    PitchDirectLaw_B.in_flight = 0.0;
  } else {
    switch (PitchDirectLaw_DWork.is_c3_PitchDirectLaw) {
     case PitchDirectLaw_IN_Flight:
      if ((*rtu_In_on_ground) && (*rtu_In_Theta_deg < 2.5)) {
        PitchDirectLaw_DWork.on_ground_time = *rtu_In_time_simulation_time;
        PitchDirectLaw_DWork.is_c3_PitchDirectLaw = PitchDirectLaw_IN_FlightToGroundTransition;
      } else {
        PitchDirectLaw_B.in_flight = 1.0;
      }
      break;

     case PitchDirectLaw_IN_FlightToGroundTransition:
      if (*rtu_In_time_simulation_time - PitchDirectLaw_DWork.on_ground_time >= 5.0) {
        PitchDirectLaw_DWork.is_c3_PitchDirectLaw = PitchDirectLaw_IN_Ground_c;
        PitchDirectLaw_B.in_flight = 0.0;
      } else if ((!*rtu_In_on_ground) || (*rtu_In_Theta_deg >= 2.5)) {
        PitchDirectLaw_DWork.on_ground_time = 0.0;
        PitchDirectLaw_DWork.is_c3_PitchDirectLaw = PitchDirectLaw_IN_Flight;
        PitchDirectLaw_B.in_flight = 1.0;
      }
      break;

     default:
      if (((!*rtu_In_on_ground) && (*rtu_In_Theta_deg > 8.0)) || (*rtu_In_H_radio_ft > 400.0)) {
        PitchDirectLaw_DWork.on_ground_time = 0.0;
        PitchDirectLaw_DWork.is_c3_PitchDirectLaw = PitchDirectLaw_IN_Flight;
        PitchDirectLaw_B.in_flight = 1.0;
      } else {
        PitchDirectLaw_B.in_flight = 0.0;
      }
      break;
    }
  }

  if (PitchDirectLaw_DWork.is_active_c2_PitchDirectLaw == 0U) {
    PitchDirectLaw_DWork.is_active_c2_PitchDirectLaw = 1U;
    PitchDirectLaw_DWork.is_c2_PitchDirectLaw = PitchDirectLaw_IN_Ground;
    rtb_in_flare = 0;
  } else {
    switch (PitchDirectLaw_DWork.is_c2_PitchDirectLaw) {
     case PitchDirectLaw_IN_Flare_Reduce_Theta_c:
      if (PitchDirectLaw_B.in_flight == 0.0) {
        PitchDirectLaw_DWork.is_c2_PitchDirectLaw = PitchDirectLaw_IN_Ground;
        rtb_in_flare = 0;
      } else if ((*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchDirectLaw_DWork.is_c2_PitchDirectLaw = PitchDirectLaw_IN_Flight_Low;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 1;
      }
      break;

     case PitchDirectLaw_IN_Flare_Set_Rate:
      if (PitchDirectLaw_rtP.ManualSwitch1_CurrentSetting == 1) {
        rtb_Y_g = PitchDirectLaw_rtP.Constant1_Value;
      } else {
        rtb_Y_g = PitchDirectLaw_rtP.Constant_Value;
      }

      if ((*rtu_In_H_radio_ft <= 30.0) || (rtb_Y_g == 1.0)) {
        PitchDirectLaw_DWork.is_c2_PitchDirectLaw = PitchDirectLaw_IN_Flare_Reduce_Theta_c;
        rtb_in_flare = 1;
      } else if ((*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchDirectLaw_DWork.is_c2_PitchDirectLaw = PitchDirectLaw_IN_Flight_Low;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 1;
      }
      break;

     case PitchDirectLaw_IN_Flare_Store_Theta_c_deg:
      if ((*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchDirectLaw_DWork.is_c2_PitchDirectLaw = PitchDirectLaw_IN_Flight_Low;
        rtb_in_flare = 0;
      } else {
        PitchDirectLaw_DWork.is_c2_PitchDirectLaw = PitchDirectLaw_IN_Flare_Set_Rate;
        rtb_in_flare = 1;
      }
      break;

     case PitchDirectLaw_IN_Flight_High:
      if ((*rtu_In_H_radio_ft <= 50.0) || (rtb_ManualSwitch == 1.0)) {
        PitchDirectLaw_DWork.is_c2_PitchDirectLaw = PitchDirectLaw_IN_Flare_Store_Theta_c_deg;
        rtb_in_flare = 1;
      } else {
        rtb_in_flare = 0;
      }
      break;

     case PitchDirectLaw_IN_Flight_Low:
      if (*rtu_In_H_radio_ft > 50.0) {
        PitchDirectLaw_DWork.is_c2_PitchDirectLaw = PitchDirectLaw_IN_Flight_High;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 0;
      }
      break;

     default:
      if (PitchDirectLaw_B.in_flight == 1.0) {
        PitchDirectLaw_DWork.is_c2_PitchDirectLaw = PitchDirectLaw_IN_Flight_Low;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 0;
      }
      break;
    }
  }

  if (PitchDirectLaw_DWork.is_active_c9_PitchDirectLaw == 0U) {
    PitchDirectLaw_DWork.is_active_c9_PitchDirectLaw = 1U;
    PitchDirectLaw_DWork.is_c9_PitchDirectLaw = PitchDirectLaw_IN_running;
  } else if (PitchDirectLaw_DWork.is_c9_PitchDirectLaw == PitchDirectLaw_IN_frozen) {
    if ((rtb_in_flare == 0) && (*rtu_In_nz_g < 1.25) && (*rtu_In_nz_g > 0.5) && (std::abs(*rtu_In_Phi_deg) <= 30.0)) {
      PitchDirectLaw_DWork.is_c9_PitchDirectLaw = PitchDirectLaw_IN_running;
    }
  } else if ((rtb_in_flare != 0) || (*rtu_In_nz_g >= 1.25) || (*rtu_In_nz_g <= 0.5) || (std::abs(*rtu_In_Phi_deg) > 30.0))
  {
    PitchDirectLaw_DWork.is_c9_PitchDirectLaw = PitchDirectLaw_IN_frozen;
  }

  if (PitchDirectLaw_DWork.is_active_c8_PitchDirectLaw == 0U) {
    PitchDirectLaw_DWork.is_active_c8_PitchDirectLaw = 1U;
    PitchDirectLaw_DWork.is_c8_PitchDirectLaw = PitchDirectLaw_IN_manual;
  } else {
    switch (PitchDirectLaw_DWork.is_c8_PitchDirectLaw) {
     case PitchDirectLaw_IN_automatic:
      if (PitchDirectLaw_B.in_flight == 0.0) {
        PitchDirectLaw_DWork.is_c8_PitchDirectLaw = PitchDirectLaw_IN_reset;
      } else if (*rtu_In_tracking_mode_on) {
        PitchDirectLaw_DWork.is_c8_PitchDirectLaw = PitchDirectLaw_IN_tracking;
      }
      break;

     case PitchDirectLaw_IN_manual:
      if (PitchDirectLaw_B.in_flight != 0.0) {
        PitchDirectLaw_DWork.is_c8_PitchDirectLaw = PitchDirectLaw_IN_automatic;
      }
      break;

     case PitchDirectLaw_IN_reset:
      if ((PitchDirectLaw_B.in_flight == 0.0) && (*rtu_In_eta_trim_deg == 0.0)) {
        PitchDirectLaw_DWork.is_c8_PitchDirectLaw = PitchDirectLaw_IN_manual;
      }
      break;

     default:
      if (!*rtu_In_tracking_mode_on) {
        PitchDirectLaw_DWork.is_c8_PitchDirectLaw = PitchDirectLaw_IN_automatic;
      }
      break;
    }
  }

  if (PitchDirectLaw_DWork.is_active_c7_PitchDirectLaw == 0U) {
    PitchDirectLaw_DWork.is_active_c7_PitchDirectLaw = 1U;
    PitchDirectLaw_DWork.is_c7_PitchDirectLaw = PitchDirectLaw_IN_ground;
    rtb_nz_limit_up_g = 2.0;
    rtb_nz_limit_lo_g = 0.0;
  } else {
    switch (PitchDirectLaw_DWork.is_c7_PitchDirectLaw) {
     case PitchDirectLaw_IN_flight_clean:
      if (*rtu_In_flaps_handle_index != 0.0) {
        PitchDirectLaw_DWork.is_c7_PitchDirectLaw = PitchDirectLaw_IN_flight_flaps;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else if (PitchDirectLaw_B.in_flight == 0.0) {
        PitchDirectLaw_DWork.is_c7_PitchDirectLaw = PitchDirectLaw_IN_ground;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      }
      break;

     case PitchDirectLaw_IN_flight_flaps:
      if (*rtu_In_flaps_handle_index == 0.0) {
        PitchDirectLaw_DWork.is_c7_PitchDirectLaw = PitchDirectLaw_IN_flight_clean;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if (PitchDirectLaw_B.in_flight == 0.0) {
        PitchDirectLaw_DWork.is_c7_PitchDirectLaw = PitchDirectLaw_IN_ground;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;

     default:
      if ((PitchDirectLaw_B.in_flight != 0.0) && (*rtu_In_flaps_handle_index == 0.0)) {
        PitchDirectLaw_DWork.is_c7_PitchDirectLaw = PitchDirectLaw_IN_flight_clean;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if ((PitchDirectLaw_B.in_flight != 0.0) && (*rtu_In_flaps_handle_index != 0.0)) {
        PitchDirectLaw_DWork.is_c7_PitchDirectLaw = PitchDirectLaw_IN_flight_flaps;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;
    }
  }

  if (PitchDirectLaw_B.in_flight > PitchDirectLaw_rtP.Saturation_UpperSat) {
    rtb_Y_g = PitchDirectLaw_rtP.Saturation_UpperSat;
  } else if (PitchDirectLaw_B.in_flight < PitchDirectLaw_rtP.Saturation_LowerSat) {
    rtb_Y_g = PitchDirectLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_Y_g = PitchDirectLaw_B.in_flight;
  }

  PitchDirectLaw_RateLimiter(rtb_Y_g, PitchDirectLaw_rtP.RateLimiterVariableTs_up,
    PitchDirectLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    PitchDirectLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_ManualSwitch, &PitchDirectLaw_DWork.sf_RateLimiter);
  if (PitchDirectLaw_DWork.is_active_c6_PitchDirectLaw == 0U) {
    PitchDirectLaw_DWork.is_active_c6_PitchDirectLaw = 1U;
    PitchDirectLaw_DWork.is_c6_PitchDirectLaw = PitchDirectLaw_IN_OFF;
    rtb_in_flare = 0;
  } else if (PitchDirectLaw_DWork.is_c6_PitchDirectLaw == PitchDirectLaw_IN_OFF) {
    if ((rtb_ManualSwitch < 1.0) && (*rtu_In_V_tas_kn > 70.0) && ((*rtu_In_thrust_lever_1_pos >= 35.0) ||
         (*rtu_In_thrust_lever_2_pos >= 35.0))) {
      PitchDirectLaw_DWork.is_c6_PitchDirectLaw = PitchDirectLaw_IN_ON;
      rtb_in_flare = 1;
    } else {
      rtb_in_flare = 0;
    }
  } else if ((rtb_ManualSwitch == 1.0) || (*rtu_In_H_radio_ft > 400.0) || ((*rtu_In_V_tas_kn < 70.0) &&
              ((*rtu_In_thrust_lever_1_pos < 35.0) || (*rtu_In_thrust_lever_2_pos < 35.0)))) {
    PitchDirectLaw_DWork.is_c6_PitchDirectLaw = PitchDirectLaw_IN_OFF;
    rtb_in_flare = 0;
  } else {
    rtb_in_flare = 1;
  }

  if (rtb_in_flare > PitchDirectLaw_rtP.Saturation1_UpperSat) {
    rtb_Y_g = PitchDirectLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_in_flare < PitchDirectLaw_rtP.Saturation1_LowerSat) {
    rtb_Y_g = PitchDirectLaw_rtP.Saturation1_LowerSat;
  } else {
    rtb_Y_g = rtb_in_flare;
  }

  PitchDirectLaw_RateLimiter(rtb_Y_g, PitchDirectLaw_rtP.RateLimiterVariableTs1_up,
    PitchDirectLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    PitchDirectLaw_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_ManualSwitch,
    &PitchDirectLaw_DWork.sf_RateLimiter_p);
  PitchDirectLaw_RateLimiter(rtb_nz_limit_up_g, PitchDirectLaw_rtP.RateLimiterVariableTs2_up,
    PitchDirectLaw_rtP.RateLimiterVariableTs2_lo, rtu_In_time_dt,
    PitchDirectLaw_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Y_g, &PitchDirectLaw_DWork.sf_RateLimiter_c);
  PitchDirectLaw_RateLimiter(rtb_nz_limit_lo_g, PitchDirectLaw_rtP.RateLimiterVariableTs3_up,
    PitchDirectLaw_rtP.RateLimiterVariableTs3_lo, rtu_In_time_dt,
    PitchDirectLaw_rtP.RateLimiterVariableTs3_InitialCondition, &rtb_Y_g, &PitchDirectLaw_DWork.sf_RateLimiter_n);
  PitchDirectLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_aoa_prot_active, &rtb_Y_g,
    &PitchDirectLaw_DWork.sf_eta_trim_limit_lofreeze);
  PitchDirectLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_speed_prot_active, &rtb_Y_g,
    &PitchDirectLaw_DWork.sf_eta_trim_limit_upfreeze);
  *rty_Out_eta_trim_deg = PitchDirectLaw_rtP.Constant_Value_d;
  rtb_Y_g = PitchDirectLaw_rtP.Gain_Gain * *rtu_In_delta_eta_pos;
  rtb_ManualSwitch = look1_binlxpw(*rtu_In_time_dt, PitchDirectLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    PitchDirectLaw_rtP.ScheduledGain_Table, 4U);
  PitchDirectLaw_RateLimiter(rtb_Y_g * rtb_ManualSwitch, PitchDirectLaw_rtP.RateLimitereta_up,
    PitchDirectLaw_rtP.RateLimitereta_lo, rtu_In_time_dt, PitchDirectLaw_rtP.RateLimitereta_InitialCondition,
    rty_Out_eta_deg, &PitchDirectLaw_DWork.sf_RateLimiter_b);
}

PitchDirectLaw::PitchDirectLaw():
  PitchDirectLaw_B(),
  PitchDirectLaw_DWork()
{
}

PitchDirectLaw::~PitchDirectLaw()
{
}
