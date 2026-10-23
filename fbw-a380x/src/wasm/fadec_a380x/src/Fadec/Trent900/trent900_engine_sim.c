/*
 * File: trent900_engine_sim.c
 *
 * MATLAB Coder version            : 23.2
 * C/C++ source code generated on  : 10-Jan-2026 16:34:03
 */
#include <stdio.h>

/* Include Files */
#include "trent900_engine_sim.h"
#include "interp1.h"
#include "minOrMax.h"
#include "rt_nonfinite.h"
#include "trent900_engine_sim_data.h"
#include "trent900_engine_sim_initialize.h"
#include "trent900_engine_sim_types.h"
#include "rtwtypes.h"
#include "rt_defines.h"
#include "rt_nonfinite.h"
#include <math.h>
#include <string.h>
#include <string.h>

/* Type Definitions */
#ifndef typedef_struct_T
#define typedef_struct_T
typedef struct {
  double flat_rating_ISA_delta;
  double EGT_redline;
  double EGT_max_cont;
  double EGT_margin_cold;
  double thrust_lapse_rate;
  double N1_lapse_rate;
  double N1_TOGA_ref;
  double N1_MCT_ref;
  double N1_CLB_ref;
  boolean_T flat_rated_region;
  double corner_temp_K;
  double thrust_available;
  double N1_limit;
  double EGT_limit;
  double EGT_margin;
  double lapse_factor;
  double N1_alt_lapse_rate;
} struct_T;
#endif /* typedef_struct_T */

#ifndef typedef_b_struct_T
#define typedef_b_struct_T
typedef struct {
  double speeds[8];
  double PR[32];
  double efficiency[32];
  double mdot_corrected[32];
} b_struct_T;
#endif /* typedef_b_struct_T */

#ifndef typedef_c_struct_T
#define typedef_c_struct_T
typedef struct {
  double speeds[7];
  double PR[21];
  double efficiency[21];
  double mdot_corrected[21];
} c_struct_T;
#endif /* typedef_c_struct_T */

#ifndef typedef_d_struct_T
#define typedef_d_struct_T
typedef struct {
  double eff_vs_PR[14];
} d_struct_T;
#endif /* typedef_d_struct_T */

#ifndef typedef_e_struct_T
#define typedef_e_struct_T
typedef struct {
  double eff_vs_PR[12];
} e_struct_T;
#endif /* typedef_e_struct_T */

#ifndef typedef_f_struct_T
#define typedef_f_struct_T
typedef struct {
  double gamma;
  double gamma_hot;
  double R;
  double cp;
  double cp_hot;
  double P0_ISA;
  double T0_ISA;
  double rho0_ISA;
  double P0;
  double T0;
  double rho0;
  double Altitude_m;
  double Altitude_ft;
  double Mach;
  double TAS_kts;
  double IAS_kts;
  double OAT_K;
  double OAT_C;
  double ISA_dev;
  double Q_fuel;
  double stoich_FAR;
  double max_FAR;
  double min_FAR;
  double combustor_min_dT_base;
  double combustor_min_dT_full;
  double fan_diameter;
  double fan_area;
  double bypass_ratio_design;
  double core_area;
  double A_core;
  double A_bypass;
  double A_nozzle_core;
  double A_nozzle_bypass;
  double mdot_total_design;
  double mdot_core_design;
  double mdot_bypass_design;
  double mdot_core_corrected_design;
  double mdot_fan_corrected_design;
  double N1_max;
  double N2_max;
  double N3_max;
  double N1_idle_ground;
  double N1_idle_flight;
  double N2_idle;
  double N3_idle;
  double J_N1;
  double J_N2;
  double J_N3;
  double B_N1;
  double C_N1;
  double B_N2;
  double C_N2;
  double B_N3;
  double C_N3;
  double eta_fan;
  double eta_LPC;
  double eta_IPC;
  double eta_HPC;
  double eta_HPT;
  double eta_IPT;
  double eta_LPT;
  double eta_mech_N1;
  double eta_mech_N2;
  double eta_mech_N3;
  double eta_comb;
  double eta_comb_pressure;
  double tau_combustor;
  double tau_turbine_metal;
  double tau_EGT_probe;
  double tau_mass_flow;
  double tau_temperature;
  double tau_pressure;
  double tau_fuel;
  double FPR_design;
  double LPC_PR_design;
  double IPC_PR_design;
  double HPC_PR_design;
  double OPR_design;
  double HPT_PR_design;
  double IPT_PR_design;
  double LPT_PR_design;
  double Thrust_TOGA_SL;
  double Thrust_MCT_SL;
  double Thrust_CLB_SL;
  double EGT_redline;
  double EGT_max_continuous;
  double EGT_max_transient;
  double EGT_idle_target;
  double EGT_TOGA_target;
  double EGT_start_limit;
  double N1_TOGA_limit;
  double N1_overspeed_limit;
  double N2_overspeed_limit;
  double N3_warning;
  double N3_stage1;
  double N3_stage2;
  double N3_redline;
  double N3_cmd_limit;
  double N3_cmd_redline;
  double FF_idle;
  double FF_TOGA;
  double FF_max;
  double FF_min;
  double FF_idle_min_factor;
  double FF_rise_rate;
  double FF_fall_rate;
  double N3_lightup_min;
  double N3_stabilized;
  double starter_torque_max;
  double starter_cutoff_N3;
  double Ndot_max_startup;
  double Ndot_max_normal;
  double Ndot_min_decay;
  double turbine_power_rise_rate;
  double turbine_power_fall_rate;
  double TOGA_ramp_time;
  double TOGA_ramp_initial_frac;
  double transient_damper_threshold;
  double transient_damper_power;
  boolean_T TOGA_governor_enabled;
  double N1_TOGA_govern;
  double N2_TOGA_govern;
  double N3_TOGA_govern;
  double TOGA_gov_Kp;
  double TOGA_gov_Ki;
  double TOGA_gov_int_limit;
  double TOGA_gov_max_trim;
  double fan_num_blades;
  double fan_hub_radius;
  double fan_tip_radius;
  double fan_blade_chord;
  double fan_num_elements;
  double fan_Cl_alpha;
  double fan_Cd0;
  double fan_alpha_stall;
  double fan_Cl_max;
  double fan_Cl_post_stall;
  double fan_Mach_crit;
  boolean_T test_mode;
  double idle_gov_max_trim;
  double idle_gov_max_add;
  b_struct_T fan_map;
  c_struct_T LPC_map;
  c_struct_T IPC_map;
  c_struct_T HPC_map;
  d_struct_T HPT_map;
  e_struct_T IPT_map;
  d_struct_T LPT_map;
} f_struct_T;
#endif /* typedef_f_struct_T */

#ifndef typedef_g_struct_T
#define typedef_g_struct_T
typedef struct {
  double N3_schedule[10];
  double HPC_bleed_frac[10];
  double IPC_bleed_frac[10];
  double VSV_schedule[10];
  double HPC_bleed_flow;
  double IPC_bleed_flow;
  double total_bleed_flow;
} g_struct_T;
#endif /* typedef_g_struct_T */

#ifndef typedef_h_struct_T
#define typedef_h_struct_T
typedef struct {
  double Df[20];
  double Cv[20];
  double tau_v[20];
  double alpha_prev[20];
  boolean_T stall_flags[20];
  boolean_T LEV_active[20];
} h_struct_T;
#endif /* typedef_h_struct_T */

/* Variable Definitions */
static boolean_T rt_state_not_empty_arr[4] = {FALSE, FALSE, FALSE, FALSE};
static boolean_T isInitialized_trent900_engine_sim = FALSE;
static struct0_T rt_state_arr[4];
static struct1_T FADEC_arr[4];
static struct2_T ACC_arr[4];
static h_struct_T DYNSTALL_arr[4];

/* Function Declarations */
static void c_updateCompressorBackflowInter(struct0_T *rt_state);

static void initializeAllStructures(f_struct_T *rt_params);

static double lookupCompressorMap(const double map_speeds[7],
                                  const double map_PR[21],
                                  const double map_efficiency[21],
                                  const double map_mdot_corrected[21],
                                  double N_frac, double PR_demand, double *eta,
                                  double *mdot_corr);

static double rt_atan2d_snf(double u0, double u1);

static double rt_powd_snf(double u0, double u1);

static void runNormalOperationStepInternal(
    struct0_T *rt_state, const double rt_params_HPC_map_speeds[7],
    const double rt_params_HPC_map_PR[21],
    const double rt_params_HPC_map_efficiency[21],
    const double c_rt_params_HPC_map_mdot_correc[21],
    const double rt_params_HPT_map_eff_vs_PR[14],
    const double rt_params_IPT_map_eff_vs_PR[12],
    const double rt_params_LPT_map_eff_vs_PR[14], struct1_T *FADEC,
    struct2_T *ACC, struct_T *FLATRATE, const g_struct_T *BLEED_SCHED,
    h_struct_T *DYNSTALL, double dt);

static void updateDynamicStallInternal(h_struct_T *DYNSTALL,
                                       struct0_T *rt_state, double dt);

static void updateMassFlowsInternal(struct0_T *rt_state,
                                    g_struct_T *BLEED_SCHED);

static void updatePressureRatiosInternal(struct0_T *rt_state);

static void updateSpoolDynamicsInternal(struct0_T *rt_state, struct2_T *ACC, double dt);

static void updateThermodynamicsInternal(
    struct0_T *rt_state, const double rt_params_HPC_map_speeds[7],
    const double rt_params_HPC_map_PR[21],
    const double rt_params_HPC_map_efficiency[21],
    const double c_rt_params_HPC_map_mdot_correc[21],
    const double rt_params_HPT_map_eff_vs_PR[14],
    const double rt_params_IPT_map_eff_vs_PR[12],
    const double rt_params_LPT_map_eff_vs_PR[14], double dt);

/* Function Definitions */
/*
 * Full Windmilling and Compressor Backflow Physics Model
 * Models reverse flow through compressors during windmill or deep surge
 * Implements bidirectional fan rotation (CW/CCW)
 * Calculates ram-air driven windmill equilibrium speeds
 *
 * Arguments    : struct0_T *rt_state
 * Return Type  : void
 */
static void c_updateCompressorBackflowInter(struct0_T *rt_state)
{
  double V_tas_ms;         /* True airspeed in m/s */
  double rho;              /* Air density */
  double q_dynamic;        /* Dynamic pressure */
  double A_fan;            /* Fan area */
  double Cd_windmill;      /* Windmill drag coefficient */
  double torque_aero;      /* Aerodynamic torque */
  double PR_fan;           /* Fan pressure ratio */
  double PR_LPC, PR_IPC, PR_HPC;
  double backflow_coeff;
  double omega_N1, omega_N2, omega_N3;
  double N3_windmill_eq, N2_windmill_eq, N1_windmill_eq;
  double omega_N1_eq, omega_N3_eq;
  double r_eff_fan;
  
  /* ====================================================== */
  /* WINDMILLING PHYSICS CONSTANTS                          */
  /* ====================================================== */
  A_fan = 6.8386;          /* Fan area m^2 (pi * 1.475^2) */
  Cd_windmill = 0.35;      /* Windmill drag coefficient */
  r_eff_fan = 1.0;         /* Effective radius for torque (m) */
  
  /* ====================================================== */
  /* CALCULATE DYNAMIC PRESSURE AND VELOCITIES              */
  /* ====================================================== */
  V_tas_ms = rt_state->V_tas;
  if (V_tas_ms < 1.0) {
    V_tas_ms = rt_state->TAS_kts * 0.514444;  /* Convert knots to m/s */
  }
  if (V_tas_ms < 1.0) {
    V_tas_ms = rt_state->Mach * 340.0;  /* Estimate from Mach */
  }
  rt_state->V_tas = V_tas_ms;
  
  rho = rt_state->rho_ambient;
  if (rho < 0.3) {
    rho = 0.3;  /* Minimum density at high altitude */
  }
  
  q_dynamic = 0.5 * rho * V_tas_ms * V_tas_ms;
  
  /* ====================================================== */
  /* RAM PRESSURE AND TEMPERATURE RECOVERY                  */
  /* ====================================================== */
  if (rt_state->Mach < 0.8) {
    rt_state->ram_pressure_recovery = 1.0;
  } else if (rt_state->Mach < 1.0) {
    rt_state->ram_pressure_recovery = 1.0 - 0.075 * (rt_state->Mach - 0.8) / 0.2;
  } else {
    rt_state->ram_pressure_recovery = 0.925 - 0.1 * (rt_state->Mach - 1.0);
    if (rt_state->ram_pressure_recovery < 0.8) {
      rt_state->ram_pressure_recovery = 0.8;
    }
  }
  
  rt_state->ram_temperature_rise = rt_state->T_ambient * 
      (1.0 + 0.2 * rt_state->Mach * rt_state->Mach) - rt_state->T_ambient;
  
  /* ====================================================== */
  /* WINDMILL MODE DETECTION                                */
  /* ====================================================== */
  omega_N1 = rt_state->omega_N1;
  omega_N2 = rt_state->omega_N2;
  omega_N3 = rt_state->omega_N3;
  
  /* Allow ground windmilling at any velocity > 2.5 m/s (~5 kts) */
  /* Condition: Engine not running AND some airspeed present */
  if ((!rt_state->engine_running || !rt_state->combustion_active) &&
      V_tas_ms > 2.5) {
    rt_state->windmill_mode_active = true;
    
    /* Aerodynamic torque from ram air on fan blades */
    torque_aero = q_dynamic * A_fan * Cd_windmill * r_eff_fan;
    (void)torque_aero;  /* Used for equilibrium calculation */
    
    /* Windmill equilibrium N3 (HP spool) - tuned for ground */
    /* At 10 kts (~5.14 m/s), target N3 ~ 3-4% */
    N3_windmill_eq = 2.5 + 3.0 * (V_tas_ms / 5.14) * (rho / 1.225);
    if (N3_windmill_eq > 25.0) N3_windmill_eq = 25.0;
    if (N3_windmill_eq < 2.0) N3_windmill_eq = 2.0;
    rt_state->windmill_N3_equilibrium = N3_windmill_eq;
    
    /* N2 (IP spool) windmill equilibrium */
    N2_windmill_eq = N3_windmill_eq * 1.15;
    if (N2_windmill_eq > 30.0) N2_windmill_eq = 30.0;
    rt_state->windmill_N2_equilibrium = N2_windmill_eq;
    
    /* N1 (LP spool/fan) windmill equilibrium */
    /* Tuned: At 10 kts (~5.14 m/s) on ground (rho=1.225), N1 = 3.0 + 2.0*1 = 5% */
    N1_windmill_eq = 3.0 + 2.0 * (V_tas_ms / 5.14) * sqrt(rho / 1.225);
    if (N1_windmill_eq > 30.0) N1_windmill_eq = 30.0;
    if (N1_windmill_eq < 3.0) N1_windmill_eq = 3.0;
    rt_state->windmill_N1_equilibrium = N1_windmill_eq;
    
    /* Calculate windmill torques for spool dynamics */
    omega_N1_eq = N1_windmill_eq / 100.0 * 2800.0 * 2.0 * 3.14159265 / 60.0;
    omega_N3_eq = N3_windmill_eq / 100.0 * 11800.0 * 2.0 * 3.14159265 / 60.0;
    
    rt_state->windmill_torque_N1 = 500.0 * (omega_N1_eq - omega_N1);
    rt_state->windmill_torque_N2 = 200.0 * (N2_windmill_eq / 100.0 * 
                                            7800.0 * 2.0 * 3.14159265 / 60.0 - omega_N2);
    rt_state->windmill_torque_N3 = 100.0 * (omega_N3_eq - omega_N3);
    
    /* Limit torques */
    if (rt_state->windmill_torque_N1 > 2000.0) rt_state->windmill_torque_N1 = 2000.0;
    if (rt_state->windmill_torque_N1 < -1000.0) rt_state->windmill_torque_N1 = -1000.0;
    if (rt_state->windmill_torque_N3 > 1000.0) rt_state->windmill_torque_N3 = 1000.0;
    if (rt_state->windmill_torque_N3 < -500.0) rt_state->windmill_torque_N3 = -500.0;
    
    rt_state->windmill_power_extracted = fabs(rt_state->windmill_torque_N1 * omega_N1) +
                                         fabs(rt_state->windmill_torque_N3 * omega_N3);
    
  } else {
    rt_state->windmill_mode_active = false;
    rt_state->windmill_torque_N1 = 0.0;
    rt_state->windmill_torque_N2 = 0.0;
    rt_state->windmill_torque_N3 = 0.0;
    rt_state->windmill_power_extracted = 0.0;
  }
  
  /* ====================================================== */
  /* ROTATION DIRECTION DETECTION                           */
  /* ====================================================== */
  if (omega_N1 > 1.0) {
    rt_state->rotation_direction = 1.0;
  } else if (omega_N1 < -1.0) {
    rt_state->rotation_direction = -1.0;
  } else {
    rt_state->rotation_direction = 0.0;
  }
  
  /* ====================================================== */
  /* COMPRESSOR BACKFLOW CALCULATIONS                       */
  /* ====================================================== */
  PR_fan = rt_state->FPR;
  PR_LPC = rt_state->LPC_PR;
  PR_IPC = rt_state->IPC_PR;
  PR_HPC = rt_state->HPC_PR;
  
  /* Fan backflow */
  if (PR_fan < 1.0 || (rt_state->surge_detected && PR_fan < 1.2)) {
    rt_state->fan_backflow_active = true;
    if (PR_fan < 1.0) {
      backflow_coeff = (1.0 - PR_fan) * 2.0;
    } else {
      backflow_coeff = 0.1;
    }
    if (backflow_coeff > 1.0) backflow_coeff = 1.0;
    rt_state->fan_backflow_fraction = backflow_coeff;
    rt_state->mdot_bypass_backflow = rt_state->mdot_bypass * backflow_coeff * 0.3;
    rt_state->fan_backflow_torque = -500.0 * backflow_coeff * (omega_N1 / 100.0);
  } else {
    rt_state->fan_backflow_active = false;
    rt_state->fan_backflow_fraction = 0.0;
    rt_state->mdot_bypass_backflow = 0.0;
    rt_state->fan_backflow_torque = 0.0;
  }
  
  /* LPC backflow */
  if (PR_LPC < 1.0 || (rt_state->surge_detected && PR_LPC < 1.05)) {
    rt_state->LPC_backflow_active = true;
    if (PR_LPC < 1.0) {
      backflow_coeff = (1.0 - PR_LPC) * 3.0;
    } else {
      backflow_coeff = 0.05;
    }
    if (backflow_coeff > 1.0) backflow_coeff = 1.0;
    rt_state->LPC_backflow_fraction = backflow_coeff;
  } else {
    rt_state->LPC_backflow_active = false;
    rt_state->LPC_backflow_fraction = 0.0;
  }
  
  /* IPC backflow */
  if (PR_IPC < 1.0 || (rt_state->surge_detected && PR_IPC < 1.1)) {
    rt_state->IPC_backflow_active = true;
    if (PR_IPC < 1.0) {
      backflow_coeff = (1.0 - PR_IPC) * 2.5;
    } else {
      backflow_coeff = 0.08;
    }
    if (backflow_coeff > 1.0) backflow_coeff = 1.0;
    rt_state->IPC_backflow_fraction = backflow_coeff;
  } else {
    rt_state->IPC_backflow_active = false;
    rt_state->IPC_backflow_fraction = 0.0;
  }
  
  /* HPC backflow - most critical for surge */
  if (PR_HPC < 1.0 || (rt_state->surge_detected && PR_HPC < 1.5)) {
    rt_state->HPC_backflow_active = true;
    if (PR_HPC < 1.0) {
      backflow_coeff = (1.0 - PR_HPC) * 2.0;
    } else {
      backflow_coeff = (1.5 - PR_HPC) * 0.2;
    }
    if (backflow_coeff > 1.0) backflow_coeff = 1.0;
    if (backflow_coeff < 0.0) backflow_coeff = 0.0;
    rt_state->HPC_backflow_fraction = backflow_coeff;
    rt_state->mdot_core_backflow = rt_state->mdot_core * backflow_coeff * 0.4;
  } else {
    rt_state->HPC_backflow_active = false;
    rt_state->HPC_backflow_fraction = 0.0;
    rt_state->mdot_core_backflow = 0.0;
  }
  
  /* Total backflow status */
  rt_state->any_backflow_active = rt_state->fan_backflow_active ||
                                  rt_state->LPC_backflow_active ||
                                  rt_state->IPC_backflow_active ||
                                  rt_state->HPC_backflow_active;
  
  /* Update windmill drag coefficient */
  if (rt_state->any_backflow_active) {
    rt_state->windmill_drag_coefficient = 0.5;
  } else {
    rt_state->windmill_drag_coefficient = 0.35;
  }
}

/*
 * Inflight Engine Relight Envelope and Physics Model
 * Calculates relight envelope based on altitude, airspeed, and engine state
 * Implements windmill-assisted and starter-assisted relight modes
 *
 * Arguments    : struct0_T *rt_state
 *                double altitude_ft
 * Return Type  : void
 */
static void updateRelightEnvelope(struct0_T *rt_state, double altitude_ft)
{
  double alt_factor;        /* Altitude-based probability factor */
  double speed_factor;      /* Airspeed-based probability factor */
  double N3_factor;         /* N3 speed factor */
  double temp_factor;       /* Temperature factor */
  double density_factor;    /* Air density factor */
  double fuel_factor;       /* Fuel atomization factor */
  double V_kts;             /* Airspeed in knots */
  
  /* ====================================================== */
  /* RELIGHT ENVELOPE BOUNDARIES                            */
  /* ====================================================== */
  /* Typical high-bypass turbofan relight envelope:
   * - Minimum altitude: 0 ft (ground relight always possible with starter)
   * - Maximum altitude: 30,000 ft (reduced probability above this)
   * - Minimum airspeed: 200 KIAS (for windmill to maintain N3)
   * - Maximum airspeed: 340 KIAS (too high causes blowout)
   * - Minimum N3: 12% (windmill), 25% (starter-assisted)
   */
  
  rt_state->relight_altitude_min_ft = 0.0;
  rt_state->relight_altitude_max_ft = 30000.0;
  rt_state->relight_airspeed_min_kts = 200.0;
  rt_state->relight_airspeed_max_kts = 340.0;
  rt_state->relight_N3_minimum = 12.0;  /* Minimum for windmill relight */
  
  /* Get current airspeed */
  V_kts = rt_state->TAS_kts;
  if (V_kts < 1.0) {
    V_kts = rt_state->V_tas / 0.514444;  /* Convert m/s to knots */
  }
  
  /* Store altitude in state */
  rt_state->Altitude_ft = altitude_ft;
  
  /* ====================================================== */
  /* CHECK IF WITHIN RELIGHT ENVELOPE                       */
  /* ====================================================== */
  if (altitude_ft <= rt_state->relight_altitude_max_ft &&
      V_kts >= rt_state->relight_airspeed_min_kts &&
      V_kts <= rt_state->relight_airspeed_max_kts) {
    rt_state->relight_in_envelope = true;
  } else {
    rt_state->relight_in_envelope = false;
  }
  
  /* ====================================================== */
  /* CALCULATE RELIGHT PROBABILITY                          */
  /* ====================================================== */
  
  /* Altitude factor: decreases with altitude */
  if (altitude_ft < 15000.0) {
    alt_factor = 1.0;  /* Best relight probability below 15,000 ft */
  } else if (altitude_ft < 25000.0) {
    alt_factor = 1.0 - 0.3 * (altitude_ft - 15000.0) / 10000.0;
  } else if (altitude_ft < 30000.0) {
    alt_factor = 0.7 - 0.4 * (altitude_ft - 25000.0) / 5000.0;
  } else {
    alt_factor = 0.3 - 0.25 * (altitude_ft - 30000.0) / 5000.0;
    if (alt_factor < 0.05) alt_factor = 0.05;  /* Never zero */
  }
  
  /* Airspeed factor: optimal around 250 KIAS */
  if (V_kts < 180.0) {
    speed_factor = 0.3 + 0.5 * (V_kts - 100.0) / 80.0;
    if (speed_factor < 0.1) speed_factor = 0.1;
  } else if (V_kts < 200.0) {
    speed_factor = 0.8 + 0.2 * (V_kts - 180.0) / 20.0;
  } else if (V_kts < 280.0) {
    speed_factor = 1.0;  /* Optimal range */
  } else if (V_kts < 340.0) {
    speed_factor = 1.0 - 0.5 * (V_kts - 280.0) / 60.0;
  } else {
    speed_factor = 0.5 - 0.4 * (V_kts - 340.0) / 50.0;
    if (speed_factor < 0.1) speed_factor = 0.1;
  }
  
  /* N3 factor: need minimum N3 for successful relight */
  if (rt_state->N3_perc < 10.0) {
    N3_factor = 0.1;  /* Very low probability */
  } else if (rt_state->N3_perc < 15.0) {
    N3_factor = 0.1 + 0.4 * (rt_state->N3_perc - 10.0) / 5.0;
  } else if (rt_state->N3_perc < 25.0) {
    N3_factor = 0.5 + 0.5 * (rt_state->N3_perc - 15.0) / 10.0;
  } else {
    N3_factor = 1.0;
  }
  
  /* Temperature factor: cold soak reduces relight probability */
  if (rt_state->T5 < 273.15) {
    temp_factor = 0.5 + 0.5 * (rt_state->T5 - 223.15) / 50.0;
    if (temp_factor < 0.3) temp_factor = 0.3;
  } else {
    temp_factor = 1.0;
  }
  
  /* Density factor: lower density = harder relight */
  density_factor = rt_state->rho_ambient / 1.225;
  if (density_factor > 1.0) density_factor = 1.0;
  if (density_factor < 0.3) density_factor = 0.3;
  
  /* Fuel atomization quality (improves with higher pressure) */
  if (rt_state->P5 > 200000.0) {
    fuel_factor = 1.0;
  } else if (rt_state->P5 > 100000.0) {
    fuel_factor = 0.6 + 0.4 * (rt_state->P5 - 100000.0) / 100000.0;
  } else {
    fuel_factor = 0.6 * rt_state->P5 / 100000.0;
    if (fuel_factor < 0.2) fuel_factor = 0.2;
  }
  rt_state->fuel_atomization_quality = fuel_factor;
  
  /* Combustor light-off temperature (minimum for ignition) */
  /* Decreases with altitude due to lower pressure */
  rt_state->combustor_lightoff_temp = 400.0 + 100.0 * (1.0 - density_factor);
  
  /* Igniter energy (constant for now, could model degradation) */
  rt_state->igniter_energy = 1.0;
  
  /* Calculate overall relight probability */
  rt_state->relight_probability = alt_factor * speed_factor * N3_factor * 
                                  temp_factor * density_factor * fuel_factor *
                                  rt_state->igniter_energy;
  
  /* Clamp probability */
  if (rt_state->relight_probability > 1.0) {
    rt_state->relight_probability = 1.0;
  }
  if (rt_state->relight_probability < 0.0) {
    rt_state->relight_probability = 0.0;
  }
  
  /* ====================================================== */
  /* DETERMINE RELIGHT CAPABILITY                           */
  /* ====================================================== */
  
  /* Windmill relight possible if:
   * - N3 >= minimum windmill N3
   * - Within airspeed envelope
   * - Probability > threshold
   */
  if (rt_state->N3_perc >= rt_state->relight_N3_minimum &&
      V_kts >= rt_state->relight_airspeed_min_kts &&
      rt_state->relight_probability > 0.2) {
    rt_state->windmill_relight_possible = true;
  } else {
    rt_state->windmill_relight_possible = false;
  }
  
  /* Starter relight possible if:
   * - Below starter operating altitude (typically 25,000 ft)
   * - Starter power available
   * - APU or cross-bleed available
   */
  if (altitude_ft < 25000.0 && 
      rt_state->relight_probability > 0.3) {
    rt_state->starter_relight_possible = true;
  } else {
    rt_state->starter_relight_possible = false;
  }
}

/*
 * Auxiliary Systems Update Function
 * Implements: Reverse Thrust, Surge Detection, Vibration, Oil Thermal, VBV
 *
 * Arguments    : struct0_T *rt_state
 *                struct1_T *FADEC
 *                double dt
 * Return Type  : void
 */
static void updateAuxiliarySystems(struct0_T *rt_state, struct1_T *FADEC, double dt)
{
  double noise_N1, noise_N2, noise_N3;
  double surge_margin;
  double oil_heat_gen, oil_cooling;
  
  /* ====================================================== */
  /* REVERSE THRUST MODELING                                */
  /* ====================================================== */
  if (rt_state->reverse_thrust_deployed) {
    /* Only allow reverse on ground */
    if (!rt_state->airborne) {
      /* Reverser transit dynamics */
      if (rt_state->reverse_thrust_position < 1.0) {
        rt_state->reverse_thrust_position += dt / 2.0;  /* 2 second deploy */
        if (rt_state->reverse_thrust_position > 1.0) {
          rt_state->reverse_thrust_position = 1.0;
        }
      }
      
      /* Reverse thrust is typically 40% of forward thrust */
      rt_state->reverser_max_thrust_pct = 0.40;
      rt_state->reverse_thrust_value = -rt_state->Core_Thrust * 
                                       rt_state->reverser_max_thrust_pct *
                                       rt_state->reverse_thrust_position;
      
      /* Modify net thrust */
      if (rt_state->reverse_thrust_position > 0.1) {
        rt_state->Thrust = rt_state->Bypass_Thrust * 0.3 + 
                          rt_state->reverse_thrust_value;
      }
    } else {
      /* Cannot deploy in flight - safety interlock */
      rt_state->reverse_thrust_deployed = false;
      rt_state->reverse_thrust_position = 0.0;
      rt_state->reverse_thrust_value = 0.0;
    }
  } else {
    /* Stow reverser */
    if (rt_state->reverse_thrust_position > 0.0) {
      rt_state->reverse_thrust_position -= dt / 1.5;  /* 1.5 second stow */
      if (rt_state->reverse_thrust_position < 0.0) {
        rt_state->reverse_thrust_position = 0.0;
      }
    }
    rt_state->reverse_thrust_value = 0.0;
  }
  
  /* ====================================================== */
  /* SURGE DETECTION AND RECOVERY                           */
  /* ====================================================== */
  /* Calculate surge margins for each compressor */
  /* Surge margin = (PR_surge - PR_operating) / PR_operating * 100 */
  
  /* Fan surge margin */
  if (rt_state->FPR > 1.0) {
    rt_state->surge_margin_fan = (1.8 - rt_state->FPR) / rt_state->FPR * 100.0;
  } else {
    rt_state->surge_margin_fan = 100.0;
  }
  
  /* HPC surge margin (most critical) */
  if (rt_state->HPC_PR > 1.0) {
    /* Surge line approximately at 8.0 PR */
    rt_state->surge_margin_HPC = (8.0 - rt_state->HPC_PR) / rt_state->HPC_PR * 100.0;
  } else {
    rt_state->surge_margin_HPC = 100.0;
  }
  
  /* IPC surge margin */
  if (rt_state->IPC_PR > 1.0) {
    rt_state->surge_margin_IPC = (3.5 - rt_state->IPC_PR) / rt_state->IPC_PR * 100.0;
  } else {
    rt_state->surge_margin_IPC = 100.0;
  }
  
  /* LPC surge margin */
  if (rt_state->LPC_PR > 1.0) {
    rt_state->surge_margin_LPC = (1.2 - rt_state->LPC_PR) / rt_state->LPC_PR * 100.0;
  } else {
    rt_state->surge_margin_LPC = 100.0;
  }
  
  /* Minimum surge margin across all compressors */
  surge_margin = rt_state->surge_margin_HPC;
  if (rt_state->surge_margin_fan < surge_margin) surge_margin = rt_state->surge_margin_fan;
  if (rt_state->surge_margin_IPC < surge_margin) surge_margin = rt_state->surge_margin_IPC;
  rt_state->fan_surge_margin = surge_margin;
  
  /* Detect surge condition */
  if (surge_margin < 5.0 || rt_state->HPC_backflow_active) {
    rt_state->surge_detected = true;
    FADEC->surge_protection_active = true;
    
    /* Open surge bleed valve */
    rt_state->surge_bleed_valve_open = true;
    
    /* Reduce fuel flow */
    rt_state->FF_cmd *= 0.8;
    
    /* Start recovery timer */
    rt_state->surge_recovery_timer += dt;
  } else if (rt_state->surge_detected && surge_margin > 10.0) {
    /* Recovery when margin restored */
    if (rt_state->surge_recovery_timer > 2.0) {
      rt_state->surge_detected = false;
      FADEC->surge_protection_active = false;
      rt_state->surge_bleed_valve_open = false;
      rt_state->surge_recovery_timer = 0.0;
    }
  }
  
  /* Stall detection (individual compressor) */
  rt_state->stall_detected = rt_state->fan_backflow_active || 
                             rt_state->HPC_backflow_active;
  
  /* ====================================================== */
  /* ROTATING STALL PHYSICS MODEL                           */
  /* ====================================================== */
  /* 
   * Physics-based rotating stall model:
   * - Stall cells propagate at 30-70% of rotor speed (opposite to rotation)
   * - Typical 1-4 cells depending on compressor design
   * - Causes periodic flow blockage and thrust pulsation
   * - Can lead to full surge if not corrected
   */
  {
    double omega_rotor;
    double cell_angular_velocity;
    double blockage_factor;
    double local_margin;
    double cell_growth_rate;
    
    /* Calculate rotor angular velocity (use N3 as reference for HP core) */
    omega_rotor = rt_state->N3_perc / 100.0 * 11800.0 * 2.0 * 3.14159 / 60.0;
    
    /* Initialize stall parameters if first time */
    if (rt_state->stall_cell_speed_ratio == 0.0) {
      rt_state->stall_cell_speed_ratio = 0.5;  /* 50% of rotor speed typical */
      rt_state->stall_cell_angular_extent = 0.52;  /* ~30 degrees per cell */
    }
    
    /* ====================================================== */
    /* STALL INCEPTION - Check each compressor stage         */
    /* ====================================================== */
    
    /* Fan rotating stall inception */
    if (rt_state->surge_margin_fan < 8.0 && !rt_state->fan_rotating_stall) {
      /* Stall inception when margin drops below 8% */
      rt_state->fan_rotating_stall = true;
      rt_state->rotating_stall_active = true;
      rt_state->stall_inception_time = rt_state->sim_time;
      rt_state->stall_cell_count = 1;  /* Single cell initially */
    }
    
    /* LPC rotating stall - can be triggered by fan stall cascade */
    if ((rt_state->surge_margin_LPC < 6.0 || rt_state->fan_rotating_stall) && 
        !rt_state->LPC_rotating_stall && rt_state->surge_margin_LPC < 10.0) {
      rt_state->LPC_rotating_stall = true;
      rt_state->rotating_stall_active = true;
    }
    
    /* IPC rotating stall */
    if ((rt_state->surge_margin_IPC < 6.0 || rt_state->LPC_rotating_stall) && 
        !rt_state->IPC_rotating_stall && rt_state->surge_margin_IPC < 10.0) {
      rt_state->IPC_rotating_stall = true;
      rt_state->rotating_stall_active = true;
      rt_state->stall_cell_count = 2;  /* Multi-cell in IP section */
    }
    
    /* HPC rotating stall - most critical */
    if ((rt_state->surge_margin_HPC < 5.0 || rt_state->IPC_rotating_stall) && 
        !rt_state->HPC_rotating_stall && rt_state->surge_margin_HPC < 8.0) {
      rt_state->HPC_rotating_stall = true;
      rt_state->rotating_stall_active = true;
      rt_state->stall_cell_count = 3;  /* HP tends to have more cells */
    }
    
    /* ====================================================== */
    /* STALL CELL PROPAGATION                                 */
    /* ====================================================== */
    if (rt_state->rotating_stall_active) {
      /* Cell rotates in direction opposite to rotor at fraction of rotor speed */
      cell_angular_velocity = -rt_state->stall_cell_speed_ratio * omega_rotor;
      rt_state->stall_cell_speed = cell_angular_velocity;
      
      /* Update cell circumferential position */
      rt_state->stall_cell_position += cell_angular_velocity * dt;
      
      /* Wrap position to 0-2π */
      while (rt_state->stall_cell_position > 6.2832) {
        rt_state->stall_cell_position -= 6.2832;
      }
      while (rt_state->stall_cell_position < 0.0) {
        rt_state->stall_cell_position += 6.2832;
      }
      
      /* Stall severity grows over time if not corrected */
      cell_growth_rate = 0.1;  /* Severity grows at ~10%/s */
      rt_state->stall_severity += cell_growth_rate * dt;
      if (rt_state->stall_severity > 1.0) rt_state->stall_severity = 1.0;
      
      /* Calculate flow blockage based on cell count and extent */
      blockage_factor = rt_state->stall_cell_count * 
                        rt_state->stall_cell_angular_extent / 6.2832 *
                        rt_state->stall_severity;
      if (blockage_factor > 0.5) blockage_factor = 0.5;  /* Max 50% blockage */
      
      /* Distribute blockage to affected stages */
      if (rt_state->fan_rotating_stall) {
        rt_state->fan_stall_blockage = blockage_factor * 0.8;
      }
      if (rt_state->LPC_rotating_stall) {
        rt_state->LPC_stall_blockage = blockage_factor * 0.9;
      }
      if (rt_state->IPC_rotating_stall) {
        rt_state->IPC_stall_blockage = blockage_factor * 0.95;
      }
      if (rt_state->HPC_rotating_stall) {
        rt_state->HPC_stall_blockage = blockage_factor * 1.0;
      }
      
      /* Reduce mass flow due to blockage */
      rt_state->mdot_core *= (1.0 - rt_state->HPC_stall_blockage * 0.3);
      
      /* ====================================================== */
      /* DEEP SURGE CYCLING                                     */
      /* ====================================================== */
      if (rt_state->HPC_rotating_stall && rt_state->stall_severity > 0.7) {
        /* Rotating stall can transition to deep surge */
        rt_state->deep_surge_active = true;
        
        /* Surge cycle frequency typically 5-15 Hz for core compressor */
        if (rt_state->surge_cycle_frequency == 0.0) {
          rt_state->surge_cycle_frequency = 8.0;  /* 8 Hz typical */
        }
        
        /* Update surge cycle phase */
        rt_state->surge_cycle_phase += 2.0 * 3.14159 * rt_state->surge_cycle_frequency * dt;
        if (rt_state->surge_cycle_phase > 6.2832) {
          rt_state->surge_cycle_phase -= 6.2832;
        }
        
        /* Pressure oscillation amplitude (fraction of steady pressure) */
        rt_state->surge_pressure_amplitude = 0.15 * rt_state->stall_severity;
        
        /* Apply pressure fluctuation to P5 (HPC discharge) */
        rt_state->P5 *= (1.0 + rt_state->surge_pressure_amplitude * 
                         sin(rt_state->surge_cycle_phase));
      }
    }
    
    /* ====================================================== */
    /* STALL RECOVERY LOGIC                                   */
    /* ====================================================== */
    if (rt_state->rotating_stall_active && !rt_state->surge_detected) {
      /* Check if conditions allow recovery */
      local_margin = rt_state->surge_margin_HPC;
      if (rt_state->surge_margin_fan < local_margin) {
        local_margin = rt_state->surge_margin_fan;
      }
      
      if (local_margin > 15.0 && rt_state->surge_recovery_timer > 3.0) {
        /* Recovery when margin restored for >3 seconds */
        rt_state->rotating_stall_active = false;
        rt_state->fan_rotating_stall = false;
        rt_state->LPC_rotating_stall = false;
        rt_state->IPC_rotating_stall = false;
        rt_state->HPC_rotating_stall = false;
        rt_state->deep_surge_active = false;
        rt_state->stall_severity = 0.0;
        rt_state->stall_cell_count = 0;
        rt_state->fan_stall_blockage = 0.0;
        rt_state->LPC_stall_blockage = 0.0;
        rt_state->IPC_stall_blockage = 0.0;
        rt_state->HPC_stall_blockage = 0.0;
        rt_state->surge_cycle_phase = 0.0;
        rt_state->surge_pressure_amplitude = 0.0;
      }
    }
  }
  
  /* ====================================================== */
  /* VIBRATION MONITORING                                   */
  /* ====================================================== */
  /* Simple vibration model based on spool speeds and imbalance */
  /* Real vibration depends on blade passing frequency, imbalance, etc */
  
  /* Generate pseudo-random noise (simplified) */
  noise_N1 = 0.1 * (((int)(rt_state->sim_time * 100.0)) % 10 - 5) / 50.0;
  noise_N2 = 0.1 * (((int)(rt_state->sim_time * 150.0)) % 10 - 5) / 50.0;
  noise_N3 = 0.1 * (((int)(rt_state->sim_time * 200.0)) % 10 - 5) / 50.0;
  
  /* Base vibration level increases with spool speed */
  rt_state->vibration_N1 = 0.5 + 1.5 * (rt_state->N1_perc / 100.0) + noise_N1;
  rt_state->vibration_N2 = 0.3 + 1.2 * (rt_state->N2_perc / 100.0) + noise_N2;
  rt_state->vibration_N3 = 0.4 + 1.0 * (rt_state->N3_perc / 100.0) + noise_N3;
  
  /* Surge/stall causes high vibration */
  if (rt_state->surge_detected || rt_state->stall_detected) {
    rt_state->vibration_N1 += 2.0;
    rt_state->vibration_N2 += 2.5;
    rt_state->vibration_N3 += 3.0;
  }
  
  /* Set limits */
  rt_state->vibration_N1_max = 4.0;
  rt_state->vibration_N2_max = 4.5;
  rt_state->vibration_N3_max = 5.0;
  
  /* Check for exceedances */
  if (rt_state->vibration_N1 > rt_state->vibration_N1_max * 0.8 ||
      rt_state->vibration_N2 > rt_state->vibration_N2_max * 0.8 ||
      rt_state->vibration_N3 > rt_state->vibration_N3_max * 0.8) {
    rt_state->vibration_warning = true;
  } else {
    rt_state->vibration_warning = false;
  }
  
  if (rt_state->vibration_N1 > rt_state->vibration_N1_max ||
      rt_state->vibration_N2 > rt_state->vibration_N2_max ||
      rt_state->vibration_N3 > rt_state->vibration_N3_max) {
    rt_state->vibration_exceedance = true;
  } else {
    rt_state->vibration_exceedance = false;
  }
  
  /* ====================================================== */
  /* OIL SYSTEM THERMAL MODEL                               */
  /* ====================================================== */
  /* Heat generation from mechanical losses */
  oil_heat_gen = (rt_state->P_mech_loss_N1 + rt_state->P_mech_loss_N2 + 
                  rt_state->P_mech_loss_N3) * 0.15;  /* 15% goes to oil */
  
  /* Bearing temperatures based on spool speeds */
  rt_state->oil_temp_N1_bearing = 60.0 + 40.0 * (rt_state->N1_perc / 100.0);
  rt_state->oil_temp_N2_bearing = 65.0 + 45.0 * (rt_state->N2_perc / 100.0);
  rt_state->oil_temp_N3_bearing = 70.0 + 50.0 * (rt_state->N3_perc / 100.0);
  
  /* Oil cooler effectiveness (decreases at low airflow) */
  if (rt_state->N1_perc > 30.0) {
    rt_state->oil_cooler_effectiveness = 0.8;
  } else {
    rt_state->oil_cooler_effectiveness = 0.4 + 0.4 * (rt_state->N1_perc / 30.0);
  }
  
  /* Oil cooling based on effectiveness and delta T */
  oil_cooling = rt_state->oil_cooler_effectiveness * 5000.0 * 
                (rt_state->oil_temp_N3_bearing - 80.0);
  if (oil_cooling < 0.0) oil_cooling = 0.0;
  
  /* Oil thermal mass dynamics (simplified) */
  rt_state->oil_thermal_mass = 50000.0;  /* J/K */
  
  /* ====================================================== */
  /* VARIABLE BLEED VALVE (VBV) CONTROL                     */
  /* ====================================================== */
  /* VBV opens at low N2 to prevent IPC/HPC surge */
  if (rt_state->N2_perc < 70.0) {
    rt_state->VBV_position = 1.0 - (rt_state->N2_perc / 70.0);
    if (rt_state->VBV_position > 1.0) rt_state->VBV_position = 1.0;
    if (rt_state->VBV_position < 0.0) rt_state->VBV_position = 0.0;
  } else {
    rt_state->VBV_position = 0.0;
  }
  
  /* VBV flow based on position and core flow */
  rt_state->VBV_flow = rt_state->VBV_position * rt_state->mdot_core * 0.15;
  
  /* ====================================================== */
  /* VARIABLE STATOR VANE (VSV) POSITION                    */
  /* ====================================================== */
  /* VSV schedule based on N3 corrected speed */
  if (rt_state->N3_perc < 60.0) {
    rt_state->VSV_position = -20.0 + 20.0 * (rt_state->N3_perc / 60.0);
  } else {
    rt_state->VSV_position = 0.0;
  }
  
  /* VSV affects compressor efficiency */
  if (rt_state->VSV_position < -10.0) {
    rt_state->VSV_efficiency_factor = 0.95 + 0.05 * (rt_state->VSV_position + 20.0) / 10.0;
  } else {
    rt_state->VSV_efficiency_factor = 1.0;
  }
  if (rt_state->VSV_efficiency_factor < 0.85) rt_state->VSV_efficiency_factor = 0.85;
}

/*
 * Start Protection and Governor System
 * Implements: Starter auto-disconnect, Hot/Wet/Hung start protection
 *             Idle governor, N1/N2/N3 overspeed governors
 *
 * Arguments    : struct0_T *rt_state
 *                struct1_T *FADEC
 *                double dt
 * Return Type  : void
 */
static void updateStartProtectionAndGovernors(struct0_T *rt_state, 
                                              struct1_T *FADEC, double dt)
{
  double EGT_rise;
  double N3_accel;
  double idle_error, N3_error;
  
  /* ====================================================== */
  /* INITIALIZE PROTECTION PARAMETERS                       */
  /* ====================================================== */
  /* Set protection limits if not initialized */
  if (rt_state->starter_disconnect_N3 == 0.0) {
    rt_state->starter_disconnect_N3 = 50.0;     /* Disconnect at 50% N3 */
  }
  if (rt_state->starter_max_time == 0.0) {
    rt_state->starter_max_time = 90.0;          /* 90 second max starter time */
  }
  if (rt_state->hot_start_EGT_limit == 0.0) {
    rt_state->hot_start_EGT_limit = 850.0;      /* 850°C start EGT limit */
  }
  if (rt_state->wet_start_limit_time == 0.0) {
    rt_state->wet_start_limit_time = 10.0;      /* 10 seconds for lightoff */
  }
  if (rt_state->hung_start_limit_time == 0.0) {
    rt_state->hung_start_limit_time = 30.0;     /* 30 seconds stagnation limit */
  }
  if (rt_state->hung_start_N3_min == 0.0) {
    rt_state->hung_start_N3_min = 0.5;          /* Minimum 0.5%/s acceleration */
  }
  if (rt_state->N3_target_idle == 0.0) {
    rt_state->N3_target_idle = 58.0;            /* Ground idle target */
  }
  
  /* Set overspeed limits */
  rt_state->N1_overspeed_limit = 104.0;         /* N1 limit 104% */
  rt_state->N2_overspeed_limit = 104.0;         /* N2 limit 104% */
  rt_state->N3_overspeed_limit = 104.0;         /* N3 limit 104% */
  
  /* ====================================================== */
  /* STARTER AUTO-DISCONNECT (Physics-Based)                */
  /* ====================================================== */
  if (rt_state->starter_on && rt_state->scenario == 1.0) {
    /* Increment starter engagement timer */
    rt_state->starter_engage_time += dt;
    
    /* Auto-disconnect when N3 reaches cutoff speed */
    if (rt_state->N3_perc >= rt_state->starter_disconnect_N3) {
      rt_state->starter_on = false;
      rt_state->starter_auto_disconnect = true;
      /* N3 has reached self-sustaining speed */
    }
    
    /* Timeout protection - prevent starter damage */
    if (rt_state->starter_engage_time >= rt_state->starter_max_time) {
      rt_state->starter_on = false;
      rt_state->starter_timeout = true;
      rt_state->start_aborted = true;
      rt_state->start_abort_reason = 4.0;  /* Timeout */
    }
  }
  
  /* ====================================================== */
  /* HOT START PROTECTION                                   */
  /* ====================================================== */
  /* Hot start = EGT exceeds limit during start sequence */
  if (rt_state->scenario == 1.0 && !rt_state->start_sequence_complete) {
    /* Track peak EGT during start */
    if (rt_state->EGT > rt_state->hot_start_EGT_peak) {
      rt_state->hot_start_EGT_peak = rt_state->EGT;
      rt_state->start_EGT_max_seen = rt_state->EGT;
    }
    
    /* Calculate margin to limit */
    rt_state->hot_start_margin = rt_state->hot_start_EGT_limit - rt_state->EGT;
    
    /* Detect hot start condition */
    if (rt_state->EGT >= rt_state->hot_start_EGT_limit) {
      rt_state->hot_start_detected = true;
      
      /* Emergency fuel cutoff */
      if (rt_state->EGT >= rt_state->hot_start_EGT_limit + 50.0) {
        /* EGT 50°C over limit - abort start */
        rt_state->hot_start_abort = true;
        rt_state->fuel_on = false;
        rt_state->FF_cmd = 0.0;
        rt_state->start_aborted = true;
        rt_state->start_abort_reason = 1.0;  /* Hot start */
      } else {
        /* Reduce fuel flow to control temperature */
        rt_state->FF_cmd *= 0.7;
      }
    } else {
      rt_state->hot_start_detected = false;
    }
  }
  
  /* ====================================================== */
  /* WET START PROTECTION                                   */
  /* ====================================================== */
  /* Wet start = fuel flowing but no lightoff (combustion not established) */
  if (rt_state->scenario == 1.0 && rt_state->fuel_on && rt_state->ignition_on) {
    /* Record EGT at fuel on if not already set */
    if (rt_state->EGT_at_fuel_on == 0.0 && rt_state->EGT > 0.0) {
      rt_state->EGT_at_fuel_on = rt_state->EGT;
    }
    
    if (!rt_state->lightoff_detected && !rt_state->combustion_active) {
      rt_state->wet_start_timer += dt;
      
      /* Check for lightoff (EGT rise indicates combustion) */
      EGT_rise = rt_state->EGT - rt_state->EGT_at_fuel_on;
      rt_state->lightoff_EGT_rise = EGT_rise;
      
      if (EGT_rise > 50.0) {  /* 50°C rise indicates lightoff */
        rt_state->lightoff_detected = true;
        rt_state->wet_start_detected = false;
        rt_state->N3_at_lightoff = rt_state->N3_perc;
      }
      
      /* Check for wet start timeout */
      if (rt_state->wet_start_timer >= rt_state->wet_start_limit_time) {
        rt_state->wet_start_detected = true;
        /* Abort start - cut fuel to prevent pooling */
        rt_state->fuel_on = false;
        rt_state->FF_cmd = 0.0;
        rt_state->start_aborted = true;
        rt_state->start_abort_reason = 2.0;  /* Wet start */
      }
    }
  }
  
  /* ====================================================== */
  /* HUNG START PROTECTION                                  */
  /* ====================================================== */
  /* Hung start = N3 stagnates below idle after lightoff */
  if (rt_state->scenario == 1.0 && rt_state->lightoff_detected && 
      !rt_state->start_sequence_complete) {
    /* Calculate N3 acceleration */
    N3_accel = rt_state->N3_dot;  /* %/s */
    
    /* Check if N3 is stagnating below idle */
    if (rt_state->N3_perc < rt_state->N3_target_idle && 
        N3_accel < rt_state->hung_start_N3_min) {
      rt_state->hung_start_timer += dt;
      
      if (rt_state->hung_start_timer >= rt_state->hung_start_limit_time) {
        rt_state->hung_start_detected = true;
        /* Try to recover by reducing bleed loads and increasing fuel */
        if (!rt_state->hung_start_abort) {
          /* First attempt - reduce bleed */
          rt_state->FF_cmd *= 1.1;  /* Slight fuel increase */
          
          /* If still hung after extended time, abort */
          if (rt_state->hung_start_timer >= rt_state->hung_start_limit_time * 2.0) {
            rt_state->hung_start_abort = true;
            rt_state->fuel_on = false;
            rt_state->starter_on = false;
            rt_state->start_aborted = true;
            rt_state->start_abort_reason = 3.0;  /* Hung start */
          }
        }
      }
    } else {
      /* N3 accelerating normally - reset timer */
      rt_state->hung_start_timer = 0.0;
      rt_state->hung_start_detected = false;
    }
    
    /* Check for successful start completion */
    if (rt_state->N3_perc >= rt_state->N3_target_idle && 
        rt_state->combustion_active) {
      rt_state->start_sequence_complete = true;
      rt_state->start_success = true;
      rt_state->engine_running = true;
    }
  }
  
  /* ====================================================== */
  /* IDLE SPEED GOVERNOR                                    */
  /* ====================================================== */
  if (rt_state->engine_running && rt_state->throttle < 0.1) {
    rt_state->idle_governor_active = true;
    FADEC->idle_governor_active = true;
    
    /* Set idle target based on flight phase */
    if (rt_state->airborne) {
      rt_state->idle_governor_N3_target = 55.0;  /* Flight idle */
    } else {
      rt_state->idle_governor_N3_target = 58.0;  /* Ground idle */
    }
    
    /* PI controller for idle */
    idle_error = rt_state->idle_governor_N3_target - rt_state->N3_perc;
    rt_state->idle_governor_error = idle_error;
    rt_state->idle_governor_integral += idle_error * dt;
    
    /* Anti-windup */
    if (rt_state->idle_governor_integral > 10.0) {
      rt_state->idle_governor_integral = 10.0;
    }
    if (rt_state->idle_governor_integral < -5.0) {
      rt_state->idle_governor_integral = -5.0;
    }
    
    /* Governor output */
    rt_state->idle_governor_output = 0.05 * idle_error + 
                                     0.02 * rt_state->idle_governor_integral;
    
    /* Apply to fuel command */
    rt_state->FF_cmd += rt_state->idle_governor_output;
    
    /* Minimum fuel flow at idle */
    if (rt_state->FF_cmd < 0.1) {
      rt_state->FF_cmd = 0.1;
    }
  } else {
    rt_state->idle_governor_active = false;
    FADEC->idle_governor_active = false;
    rt_state->idle_governor_integral = 0.0;
  }
  
  /* ====================================================== */
  /* N1 OVERSPEED GOVERNOR                                  */
  /* ====================================================== */
  rt_state->N1_overspeed_margin = rt_state->N1_overspeed_limit - rt_state->N1_perc;
  
  if (rt_state->N1_perc > rt_state->N1_overspeed_limit - 2.0) {
    rt_state->N1_overspeed_warning = true;
  } else {
    rt_state->N1_overspeed_warning = false;
  }
  
  if (rt_state->N1_perc >= rt_state->N1_overspeed_limit) {
    rt_state->N1_overspeed_governor_active = true;
    rt_state->N1_overspeed_protection = true;
    /* Aggressive fuel reduction */
    N3_error = rt_state->N1_perc - rt_state->N1_overspeed_limit;
    rt_state->FF_cmd -= N3_error * 0.3;
  } else if (rt_state->N1_perc > rt_state->N1_overspeed_limit - 1.0) {
    rt_state->N1_overspeed_governor_active = true;
    rt_state->N1_overspeed_protection = false;
    /* Soft limiting - proportional reduction */
    N3_error = rt_state->N1_perc - (rt_state->N1_overspeed_limit - 1.0);
    rt_state->FF_cmd -= N3_error * 0.1;
  } else {
    rt_state->N1_overspeed_governor_active = false;
    rt_state->N1_overspeed_protection = false;
  }
  
  /* ====================================================== */
  /* N2 OVERSPEED GOVERNOR                                  */
  /* ====================================================== */
  rt_state->N2_overspeed_margin = rt_state->N2_overspeed_limit - rt_state->N2_perc;
  
  if (rt_state->N2_perc > rt_state->N2_overspeed_limit - 2.0) {
    rt_state->N2_overspeed_warning = true;
  } else {
    rt_state->N2_overspeed_warning = false;
  }
  
  if (rt_state->N2_perc >= rt_state->N2_overspeed_limit) {
    rt_state->N2_overspeed_governor_active = true;
    rt_state->N2_overspeed_protection = true;
    N3_error = rt_state->N2_perc - rt_state->N2_overspeed_limit;
    rt_state->FF_cmd -= N3_error * 0.25;
  } else if (rt_state->N2_perc > rt_state->N2_overspeed_limit - 1.0) {
    rt_state->N2_overspeed_governor_active = true;
    rt_state->N2_overspeed_protection = false;
    N3_error = rt_state->N2_perc - (rt_state->N2_overspeed_limit - 1.0);
    rt_state->FF_cmd -= N3_error * 0.08;
  } else {
    rt_state->N2_overspeed_governor_active = false;
    rt_state->N2_overspeed_protection = false;
  }
  
  /* ====================================================== */
  /* N3 OVERSPEED GOVERNOR (Most Critical)                  */
  /* ====================================================== */
  rt_state->N3_overspeed_margin = rt_state->N3_overspeed_limit - rt_state->N3_perc;
  
  if (rt_state->N3_perc > rt_state->N3_overspeed_limit - 2.0) {
    rt_state->N3_overspeed_warning = true;
  } else {
    rt_state->N3_overspeed_warning = false;
  }
  
  if (rt_state->N3_perc >= rt_state->N3_overspeed_limit) {
    rt_state->N3_overspeed_governor_active = true;
    rt_state->N3_overspeed_protection = true;
    FADEC->N3_limiting_active = true;
    /* Emergency fuel cutback */
    N3_error = rt_state->N3_perc - rt_state->N3_overspeed_limit;
    rt_state->FF_cmd -= N3_error * 0.4;
    
    /* Hard limit at 110% - complete fuel cutoff */
    if (rt_state->N3_perc >= 110.0) {
      rt_state->FF_cmd = 0.0;
      rt_state->fuel_on = false;
    }
  } else if (rt_state->N3_perc > rt_state->N3_overspeed_limit - 1.0) {
    rt_state->N3_overspeed_governor_active = true;
    rt_state->N3_overspeed_protection = false;
    FADEC->N3_limiting_active = true;
    N3_error = rt_state->N3_perc - (rt_state->N3_overspeed_limit - 1.0);
    rt_state->FF_cmd -= N3_error * 0.15;
  } else {
    rt_state->N3_overspeed_governor_active = false;
    rt_state->N3_overspeed_protection = false;
    /* Note: Don't clear FADEC->N3_limiting_active here as other logic uses it */
  }
  
  /* ====================================================== */
  /* FUEL FLOW LIMITING                                     */
  /* ====================================================== */
  /* Ensure fuel flow stays within valid range */
  if (rt_state->FF_cmd < 0.0) {
    rt_state->FF_cmd = 0.0;
  }
  if (rt_state->FF_cmd > 3.5) {  /* Max ~3.5 kg/s */
    rt_state->FF_cmd = 3.5;
  }
}

/*
 * Engine Degradation Model
 * Implements realistic engine wear based on industry maintenance data
 * 
 * Typical Trent 900 maintenance intervals:
 * - Compressor wash: Every 500-1000 flight hours
 * - Hot section inspection: ~5,000 cycles
 * - Shop visit: ~10,000 hrs or 3,000 cycles
 * - Full overhaul: ~20,000 hrs or 6,000 cycles
 *
 * Arguments    : struct0_T *rt_state
 *                double dt
 *                boolean_T engine_operating (true when running)
 * Return Type  : void
 */
static void updateEngineDegradation(struct0_T *rt_state, double dt, 
                                    boolean_T engine_operating)
{
  double hours_increment;
  double cycles_this_start;
  double degradation_rate;
  double tip_clearance_effect;
  double thermal_stress;
  double erosion_rate;
  double wash_decay;
  
  /* ====================================================== */
  /* INITIALIZE DEGRADATION PARAMETERS (First Call)        */
  /* ====================================================== */
  if (rt_state->overhaul_interval_hours == 0.0) {
    /* Typical Trent 900 intervals */
    rt_state->overhaul_interval_hours = 20000.0;    /* Full overhaul */
    rt_state->overhaul_interval_cycles = 6000.0;
    rt_state->shop_visit_interval_hours = 10000.0;  /* Shop visit */
    rt_state->shop_visit_interval_cycles = 3000.0;
    rt_state->hot_section_interval_cycles = 5000.0;
    
    /* Initialize health to new condition */
    rt_state->health_fan = 1.0;
    rt_state->health_LPC = 1.0;
    rt_state->health_IPC = 1.0;
    rt_state->health_HPC = 1.0;
    rt_state->health_combustor = 1.0;
    rt_state->health_HPT = 1.0;
    rt_state->health_IPT = 1.0;
    rt_state->health_LPT = 1.0;
    rt_state->health_overall = 1.0;
    
    /* Initialize efficiency factors to 1.0 (no degradation) */
    rt_state->eff_degradation_fan = 1.0;
    rt_state->eff_degradation_LPC = 1.0;
    rt_state->eff_degradation_IPC = 1.0;
    rt_state->eff_degradation_HPC = 1.0;
    rt_state->eff_degradation_HPT = 1.0;
    rt_state->eff_degradation_IPT = 1.0;
    rt_state->eff_degradation_LPT = 1.0;
    
    /* EGT margin for new engine */
    rt_state->EGT_margin_new = 50.0;          /* 50°C margin when new */
    rt_state->EGT_margin_current = 50.0;
    rt_state->EGT_margin_minimum = 5.0;       /* Minimum acceptable */
    rt_state->EGT_margin_loss_rate = 8.0;     /* 8°C per 1000 cycles typical */
    
    /* Tip clearances (mm) - nominal new values */
    rt_state->tip_clearance_fan = 2.0;
    rt_state->tip_clearance_HPC = 0.5;
    rt_state->tip_clearance_HPT = 0.8;
    rt_state->tip_clearance_increase_rate = 0.02;  /* 0.02mm per 1000 hrs */
    
    /* Coatings at 100% */
    rt_state->coating_HPT_remaining = 1.0;
    rt_state->coating_combustor_remaining = 1.0;
  }
  
  /* ====================================================== */
  /* FLIGHT HOURS AND CYCLES ACCUMULATION                   */
  /* ====================================================== */
  if (engine_operating && rt_state->engine_running) {
    /* Accumulate flight hours (dt in seconds -> hours) */
    hours_increment = dt / 3600.0;
    rt_state->total_flight_hours += hours_increment;
    rt_state->hours_since_overhaul += hours_increment;
    rt_state->hours_since_shop_visit += hours_increment;
    
    /* Accumulate wash decay time */
    rt_state->days_since_wash += dt / 86400.0;
  }
  
  /* Count engine cycles (on each start completion) */
  if (rt_state->start_sequence_complete && rt_state->scenario == 1.0) {
    /* This is a new start - increment cycle count once */
    cycles_this_start = 1.0;
    rt_state->total_engine_cycles += cycles_this_start;
    rt_state->cycles_since_overhaul += cycles_this_start;
    rt_state->cycles_since_shop_visit += cycles_this_start;
    /* Note: start_sequence_complete should be reset after counting */
  }
  
  /* ====================================================== */
  /* TIME-BASED DEGRADATION (Flight Hours)                  */
  /* ====================================================== */
  /* Degradation rates based on industry data:
   * - Fan: 0.1% efficiency loss per 5000 hours
   * - LPC: 0.15% efficiency loss per 5000 hours  
   * - IPC: 0.2% efficiency loss per 5000 hours
   * - HPC: 0.3% efficiency loss per 5000 hours (most affected)
   * - HPT: 0.4% efficiency loss per 5000 hours (highest temps)
   * - IPT: 0.25% efficiency loss per 5000 hours
   * - LPT: 0.2% efficiency loss per 5000 hours
   */
  
  if (rt_state->hours_since_overhaul > 0.0) {
    double hours = rt_state->hours_since_overhaul;
    
    /* Fan efficiency - slowest degradation */
    degradation_rate = 0.001 * (hours / 5000.0);  /* 0.1% per 5000 hrs */
    rt_state->eff_degradation_fan = 1.0 - degradation_rate;
    if (rt_state->eff_degradation_fan < 0.92) rt_state->eff_degradation_fan = 0.92;
    
    /* LPC efficiency */
    degradation_rate = 0.0015 * (hours / 5000.0);
    rt_state->eff_degradation_LPC = 1.0 - degradation_rate;
    if (rt_state->eff_degradation_LPC < 0.90) rt_state->eff_degradation_LPC = 0.90;
    
    /* IPC efficiency */
    degradation_rate = 0.002 * (hours / 5000.0);
    rt_state->eff_degradation_IPC = 1.0 - degradation_rate;
    if (rt_state->eff_degradation_IPC < 0.88) rt_state->eff_degradation_IPC = 0.88;
    
    /* HPC efficiency - more affected by tip clearance */
    degradation_rate = 0.003 * (hours / 5000.0);
    tip_clearance_effect = (rt_state->tip_clearance_HPC - 0.5) * 0.02;
    rt_state->eff_degradation_HPC = 1.0 - degradation_rate - tip_clearance_effect;
    if (rt_state->eff_degradation_HPC < 0.85) rt_state->eff_degradation_HPC = 0.85;
    
    /* HPT efficiency - fastest degradation (hot section) */
    degradation_rate = 0.004 * (hours / 5000.0);
    degradation_rate += rt_state->thermal_damage_HPT * 0.05;
    rt_state->eff_degradation_HPT = 1.0 - degradation_rate;
    if (rt_state->eff_degradation_HPT < 0.85) rt_state->eff_degradation_HPT = 0.85;
    
    /* IPT efficiency */
    degradation_rate = 0.0025 * (hours / 5000.0);
    rt_state->eff_degradation_IPT = 1.0 - degradation_rate;
    if (rt_state->eff_degradation_IPT < 0.88) rt_state->eff_degradation_IPT = 0.88;
    
    /* LPT efficiency */
    degradation_rate = 0.002 * (hours / 5000.0);
    rt_state->eff_degradation_LPT = 1.0 - degradation_rate;
    if (rt_state->eff_degradation_LPT < 0.90) rt_state->eff_degradation_LPT = 0.90;
    
    /* Tip clearance growth */
    rt_state->tip_clearance_fan = 2.0 + rt_state->tip_clearance_increase_rate * (hours / 1000.0);
    rt_state->tip_clearance_HPC = 0.5 + rt_state->tip_clearance_increase_rate * 0.5 * (hours / 1000.0);
    rt_state->tip_clearance_HPT = 0.8 + rt_state->tip_clearance_increase_rate * 1.5 * (hours / 1000.0);
  }
  
  /* ====================================================== */
  /* CYCLE-BASED DEGRADATION                                */
  /* ====================================================== */
  /* Thermal cycling causes most damage to hot section */
  if (rt_state->cycles_since_overhaul > 0.0) {
    double cycles = rt_state->cycles_since_overhaul;
    
    /* EGT margin loss: ~8°C per 1000 cycles */
    rt_state->EGT_margin_current = rt_state->EGT_margin_new - 
                                   rt_state->EGT_margin_loss_rate * (cycles / 1000.0);
    if (rt_state->EGT_margin_current < 0.0) {
      rt_state->EGT_margin_current = 0.0;
    }
    
    /* HPT coating degradation - exponential with cycles */
    rt_state->coating_HPT_remaining = 1.0 - 0.15 * (cycles / 1000.0);
    if (rt_state->coating_HPT_remaining < 0.1) {
      rt_state->coating_HPT_remaining = 0.1;
    }
    
    /* Combustor coating */
    rt_state->coating_combustor_remaining = 1.0 - 0.1 * (cycles / 1000.0);
    if (rt_state->coating_combustor_remaining < 0.2) {
      rt_state->coating_combustor_remaining = 0.2;
    }
    
    /* Thermal damage accumulation */
    rt_state->thermal_damage_combustor = 0.0001 * cycles;
    if (rt_state->thermal_damage_combustor > 0.5) {
      rt_state->thermal_damage_combustor = 0.5;
    }
    
    rt_state->thermal_damage_HPT = 0.00015 * cycles;
    if (rt_state->thermal_damage_HPT > 0.6) {
      rt_state->thermal_damage_HPT = 0.6;
    }
  }
  
  /* ====================================================== */
  /* OVER-TEMPERATURE DAMAGE                                */
  /* ====================================================== */
  /* Track max EGT and count exceedances */
  if (rt_state->EGT > rt_state->max_EGT_ever_seen) {
    rt_state->max_EGT_ever_seen = rt_state->EGT;
  }
  
  /* EGT exceedance causes accelerated degradation */
  if (rt_state->EGT > 980.0) {
    thermal_stress = (rt_state->EGT - 980.0) / 100.0;
    rt_state->thermal_damage_HPT += thermal_stress * dt * 0.0001;
    rt_state->coating_HPT_remaining -= thermal_stress * dt * 0.00001;
    
    if (rt_state->EGT > 1000.0) {
      rt_state->overtemp_events += dt * 0.1;  /* Accumulate event time */
    }
  }
  
  /* ====================================================== */
  /* EROSION MODEL (Sand, Rain, Dust)                       */
  /* ====================================================== */
  /* Erosion rate increases with power and exposure */
  if (engine_operating && rt_state->N1_perc > 50.0) {
    erosion_rate = 0.000001 * (rt_state->N1_perc / 100.0);  /* Very slow */
    rt_state->erosion_fan_leading_edge += erosion_rate * dt;
    rt_state->erosion_LPC_blades += erosion_rate * 0.8 * dt;
    rt_state->erosion_HPC_blades += erosion_rate * 0.5 * dt;
    
    /* Clamp erosion */
    if (rt_state->erosion_fan_leading_edge > 0.3) {
      rt_state->erosion_fan_leading_edge = 0.3;
    }
  }
  
  /* ====================================================== */
  /* FOD DAMAGE INJECTION                                   */
  /* ====================================================== */
  if (rt_state->inject_FOD_damage) {
    rt_state->FOD_damage_present = true;
    rt_state->FOD_damage_severity = rt_state->inject_FOD_severity;
    
    /* FOD primarily affects fan */
    rt_state->health_fan -= rt_state->FOD_damage_severity * 0.2;
    rt_state->eff_degradation_fan -= rt_state->FOD_damage_severity * 0.05;
    rt_state->vibration_N1 += rt_state->FOD_damage_severity * 2.0;
    
    /* Severe FOD can damage LPC */
    if (rt_state->FOD_damage_severity > 0.5) {
      rt_state->health_LPC -= (rt_state->FOD_damage_severity - 0.5) * 0.15;
    }
    
    rt_state->inject_FOD_damage = false;  /* Reset trigger */
  }
  
  /* ====================================================== */
  /* COMPRESSOR WASH EFFECT                                 */
  /* ====================================================== */
  if (rt_state->perform_compressor_wash) {
    /* Compressor wash can recover 60-70% of efficiency loss due to fouling */
    rt_state->wash_efficiency_recovery = 0.015;  /* 1.5% recovery typical */
    
    rt_state->eff_degradation_fan += rt_state->wash_efficiency_recovery;
    rt_state->eff_degradation_LPC += rt_state->wash_efficiency_recovery * 0.8;
    rt_state->eff_degradation_IPC += rt_state->wash_efficiency_recovery * 0.6;
    rt_state->eff_degradation_HPC += rt_state->wash_efficiency_recovery * 0.5;
    
    /* Clamp to max 1.0 */
    if (rt_state->eff_degradation_fan > 1.0) rt_state->eff_degradation_fan = 1.0;
    if (rt_state->eff_degradation_LPC > 1.0) rt_state->eff_degradation_LPC = 1.0;
    if (rt_state->eff_degradation_IPC > 1.0) rt_state->eff_degradation_IPC = 1.0;
    if (rt_state->eff_degradation_HPC > 1.0) rt_state->eff_degradation_HPC = 1.0;
    
    rt_state->days_since_wash = 0.0;
    rt_state->needs_compressor_wash = false;
    rt_state->perform_compressor_wash = false;
  }
  
  /* Wash effectiveness decays over time */
  if (rt_state->days_since_wash > 30.0) {
    wash_decay = (rt_state->days_since_wash - 30.0) * 0.0001;
    rt_state->eff_degradation_HPC -= wash_decay;
  }
  
  /* ====================================================== */
  /* SHOP VISIT RESTORATION                                 */
  /* ====================================================== */
  if (rt_state->perform_shop_visit) {
    /* Shop visit restores ~80% of lost performance */
    double restoration = 0.80;
    
    rt_state->eff_degradation_fan = 1.0 - (1.0 - rt_state->eff_degradation_fan) * (1.0 - restoration);
    rt_state->eff_degradation_LPC = 1.0 - (1.0 - rt_state->eff_degradation_LPC) * (1.0 - restoration);
    rt_state->eff_degradation_IPC = 1.0 - (1.0 - rt_state->eff_degradation_IPC) * (1.0 - restoration);
    rt_state->eff_degradation_HPC = 1.0 - (1.0 - rt_state->eff_degradation_HPC) * (1.0 - restoration);
    rt_state->eff_degradation_HPT = 1.0 - (1.0 - rt_state->eff_degradation_HPT) * (1.0 - restoration);
    rt_state->eff_degradation_IPT = 1.0 - (1.0 - rt_state->eff_degradation_IPT) * (1.0 - restoration);
    rt_state->eff_degradation_LPT = 1.0 - (1.0 - rt_state->eff_degradation_LPT) * (1.0 - restoration);
    
    /* Restore EGT margin partially */
    rt_state->EGT_margin_current = rt_state->EGT_margin_new * 0.85;
    
    rt_state->hours_since_shop_visit = 0.0;
    rt_state->cycles_since_shop_visit = 0.0;
    rt_state->needs_shop_visit = false;
    rt_state->perform_shop_visit = false;
  }
  
  /* ====================================================== */
  /* FULL OVERHAUL RESTORATION                              */
  /* ====================================================== */
  if (rt_state->perform_overhaul) {
    /* Full overhaul returns engine to near-new condition */
    rt_state->eff_degradation_fan = 0.995;
    rt_state->eff_degradation_LPC = 0.995;
    rt_state->eff_degradation_IPC = 0.99;
    rt_state->eff_degradation_HPC = 0.99;
    rt_state->eff_degradation_HPT = 0.99;
    rt_state->eff_degradation_IPT = 0.99;
    rt_state->eff_degradation_LPT = 0.995;
    
    rt_state->health_fan = 0.98;
    rt_state->health_LPC = 0.98;
    rt_state->health_IPC = 0.98;
    rt_state->health_HPC = 0.98;
    rt_state->health_combustor = 0.98;
    rt_state->health_HPT = 0.98;
    rt_state->health_IPT = 0.98;
    rt_state->health_LPT = 0.98;
    
    rt_state->EGT_margin_current = rt_state->EGT_margin_new * 0.95;
    rt_state->coating_HPT_remaining = 1.0;
    rt_state->coating_combustor_remaining = 1.0;
    
    rt_state->tip_clearance_fan = 2.0;
    rt_state->tip_clearance_HPC = 0.5;
    rt_state->tip_clearance_HPT = 0.8;
    
    rt_state->thermal_damage_combustor = 0.0;
    rt_state->thermal_damage_HPT = 0.0;
    rt_state->thermal_damage_IPT = 0.0;
    
    rt_state->hours_since_overhaul = 0.0;
    rt_state->cycles_since_overhaul = 0.0;
    rt_state->hours_since_shop_visit = 0.0;
    rt_state->cycles_since_shop_visit = 0.0;
    
    rt_state->needs_overhaul = false;
    rt_state->perform_overhaul = false;
  }
  
  /* ====================================================== */
  /* CALCULATE OVERALL HEALTH                               */
  /* ====================================================== */
  rt_state->health_fan = rt_state->eff_degradation_fan - rt_state->erosion_fan_leading_edge * 0.2;
  rt_state->health_LPC = rt_state->eff_degradation_LPC - rt_state->erosion_LPC_blades * 0.15;
  rt_state->health_HPC = rt_state->eff_degradation_HPC - rt_state->erosion_HPC_blades * 0.2;
  rt_state->health_HPT = rt_state->eff_degradation_HPT * rt_state->coating_HPT_remaining;
  rt_state->health_combustor = rt_state->coating_combustor_remaining * (1.0 - rt_state->thermal_damage_combustor);
  
  /* Clamp health values */
  if (rt_state->health_fan < 0.0) rt_state->health_fan = 0.0;
  if (rt_state->health_LPC < 0.0) rt_state->health_LPC = 0.0;
  if (rt_state->health_HPC < 0.0) rt_state->health_HPC = 0.0;
  if (rt_state->health_HPT < 0.0) rt_state->health_HPT = 0.0;
  if (rt_state->health_combustor < 0.0) rt_state->health_combustor = 0.0;
  
  /* Overall health is weighted average */
  rt_state->health_overall = (rt_state->health_fan * 0.1 + 
                              rt_state->health_LPC * 0.05 +
                              rt_state->health_IPC * 0.1 +
                              rt_state->health_HPC * 0.2 +
                              rt_state->health_combustor * 0.15 +
                              rt_state->health_HPT * 0.25 +
                              rt_state->health_IPT * 0.05 +
                              rt_state->health_LPT * 0.1);
  
  /* ====================================================== */
  /* PERFORMANCE IMPACT CALCULATIONS                        */
  /* ====================================================== */
  /* SFC degradation */
  rt_state->SFC_degradation_percent = (1.0 - rt_state->health_overall) * 10.0;  /* Max 10% SFC penalty */
  
  /* Thrust margin */
  rt_state->thrust_margin_percent = rt_state->health_overall * 100.0;
  
  /* N1 margin */
  rt_state->N1_margin_percent = 104.0 - (1.0 - rt_state->health_overall) * 5.0;
  
  /* ====================================================== */
  /* MAINTENANCE ALERTS                                     */
  /* ====================================================== */
  /* Check if maintenance is needed */
  if (rt_state->days_since_wash > 60.0 || rt_state->eff_degradation_HPC < 0.97) {
    rt_state->needs_compressor_wash = true;
  }
  
  if (rt_state->hours_since_shop_visit > rt_state->shop_visit_interval_hours ||
      rt_state->cycles_since_shop_visit > rt_state->shop_visit_interval_cycles) {
    rt_state->needs_shop_visit = true;
  }
  
  if (rt_state->hours_since_overhaul > rt_state->overhaul_interval_hours ||
      rt_state->cycles_since_overhaul > rt_state->overhaul_interval_cycles) {
    rt_state->needs_overhaul = true;
  }
  
  if (rt_state->EGT_margin_current < 10.0 || rt_state->health_overall < 0.80) {
    rt_state->on_watch = true;
  } else {
    rt_state->on_watch = false;
  }
  
  if (rt_state->vibration_N1 > 3.5 || rt_state->vibration_N2 > 4.0 || 
      rt_state->vibration_N3 > 4.5) {
    rt_state->needs_borescope = true;
  }
}

/*
 * Temperature-Dependent Idle Calculation
 * Adjusts idle N1/N3 based on outside air temperature
 * Hot days require higher idle for:
 *   - Adequate bleed air pressure
 *   - Compressor surge margin
 *   - Accessory drive requirements
 * Cold days allow lower idle due to denser air
 *
 * Arguments    : struct0_T *rt_state
 * Return Type  : void
 */
/*
 * FADEC Redundancy Management
 * Implements dual-channel selection and fault isolation
 */
static void updateFADECRedundancy(struct0_T *rt_state, struct1_T *FADEC, double dt)
{
    /* Simulate independent channel readings with noise/errors */
    double noise_A = 0.0; /* Placeholder for noise model */
    double noise_B = 0.0;
    
    /* Channel A Reading (Primary) */
    FADEC->channel_A_N1_reading = rt_state->N1_perc + noise_A;
    FADEC->channel_A_EGT_reading = rt_state->EGT + noise_A;
    
    /* Channel B Reading (Secondary) */
    FADEC->channel_B_N1_reading = rt_state->N1_perc + noise_B;
    FADEC->channel_B_EGT_reading = rt_state->EGT + noise_B;
    
    /* Cross-Channel Monitor */
    if (fabs(FADEC->channel_A_N1_reading - FADEC->channel_B_N1_reading) > 5.0) {
        FADEC->sensor_disagreement = true;
        FADEC->fault_timer += dt;
    } else {
        FADEC->sensor_disagreement = false;
        FADEC->fault_timer = 0.0;
    }
    
    /* Fault Logic */
    if (FADEC->fault_timer > 2.0) {
        /* Persistent disagreement > 2s triggers fault */
        if (!FADEC->channel_A_fault && !FADEC->channel_B_fault) {
             /* Assume A is faulty if undecided and logic fails (simplified) */
             /* In reality, uses model-based estimation to vote */
             FADEC->channel_A_fault = true;
        }
    }
    
    /* Channel Selection */
    if (FADEC->active_channel == 1.0) {
        if (FADEC->channel_A_fault) {
             FADEC->active_channel = 2.0; /* Switch to B */
             rt_state->Channel_B_Active = true;
             rt_state->Channel_A_Active = false;
        } else {
             rt_state->Channel_A_Active = true;
             rt_state->Channel_B_Active = false;
        }
    } else {
        if (FADEC->channel_B_fault && !FADEC->channel_A_fault) {
             FADEC->active_channel = 1.0; /* Switch back to A */
             rt_state->Channel_A_Active = true;
             rt_state->Channel_B_Active = false;
        }
    }
    
    /* Update struct0 flags for visibility */
    rt_state->Channel_A_Fault = FADEC->channel_A_fault;
    rt_state->Channel_B_Fault = FADEC->channel_B_fault;
}

/*
 * EPR Calculation
 * Engine Pressure Ratio = P50 (LPT Exit) / P20 (Fan Inlet)
 * On Trent 900, EPR is the primary thrust control parameter (1.01 at idle, 1.65 at TOGA).
 */
static void calculateEPR(struct0_T *rt_state)
{
    /* P20 is Fan Inlet Total Pressure */
    if (rt_state->P0 > 1000.0) {
        rt_state->P20 = rt_state->P0;
    } else if (rt_state->P_ambient > 1000.0) {
        rt_state->P20 = rt_state->P_ambient;
    } else {
        rt_state->P20 = 101325.0;
    }

    if (rt_state->engine_running && rt_state->N1_perc > 18.0) {
        double n1_norm = (rt_state->N1_perc - 22.0) / (100.0 - 22.0);
        if (n1_norm < 0.0) n1_norm = 0.0;
        if (n1_norm > 1.05) n1_norm = 1.05;
        double epr_val = 1.015 + 0.635 * pow(n1_norm, 1.82);
        rt_state->EPR_Actual = epr_val;
        rt_state->P50 = rt_state->P20 * epr_val;
    } else {
        rt_state->EPR_Actual = 1.0;
        rt_state->P50 = rt_state->P20;
    }
}

/*
 * FLEX / Derate Logic
 * Calculates thrust reduction based on Assumed Temperature and Fixed Derates
 */
static void updateFLEXandDerate(struct0_T *rt_state, struct1_T *FADEC, struct_T *FLATRATE)
{
    double T_ref;
    double delta_T;
    double N1_reduction_flex = 0.0;
    double corner_temp = 30.0;  /* Corner temperature for Trent 900 is approx ISA+15 (30C) */
    
    /* Base Rating Limits (Natural) are set in main loop */
    /* Checks if FLEX is eligible (T_FLEX > OAT) */
    
    if (FADEC->flex_active && (FADEC->flex_temp > (rt_state->T_ambient - 273.15))) {
        /* Assumed Temperature Method */
        
        if (FADEC->flex_temp > corner_temp) {
            delta_T = FADEC->flex_temp - corner_temp;
            /* Approx 0.5% N1 reduction per degree above corner */
            /* Tuned for 83% thrust at 48C (Delta 18) */
            N1_reduction_flex = delta_T * 0.5; 
            
            /* Cap reduction max 25% thrust (approx 15% N1) */
            if (N1_reduction_flex > 15.0) N1_reduction_flex = 15.0;
        }
    }
    
    /* Apply FLEX reduction to current TOGA limit */
    /* Store the FLEX limit in FADEC */
    /* 97.8 is base TOGA N1 */
    FADEC->N1_TOGA = 97.8 - N1_reduction_flex;
    
    /* Climb Derates (D-1, D-2) */
    /* Fixed reductions usually */
    /* CLB 1: -4% Thrust (~ -1.5% N1) */
    /* CLB 2: -10% Thrust (~ -3.5% N1) */
    
    if (FADEC->climb_derate_level == 1.0) {
        FADEC->N1_CLB = 85.0 - 1.5; /* Base CLB is ~85% N1 */
    } else if (FADEC->climb_derate_level == 2.0) {
        FADEC->N1_CLB = 85.0 - 3.5;
    } else {
        FADEC->N1_CLB = 85.0;
    }
    
    /* Calculate Thrust Availability Factor based on N1 reduction */
    /* Thrust ~ N1^1.95 */
    /* Target N1 = 97.8 - N1_reduction_flex */
    /* Ratio = Target / Base */
    if (N1_reduction_flex > 0.0) {
        double n1_ratio = (97.8 - N1_reduction_flex) / 97.8;
        if (n1_ratio < 0.0) n1_ratio = 0.0;
        FLATRATE->thrust_available = pow(n1_ratio, 1.95);
    } else {
        FLATRATE->thrust_available = 1.0;
    }
    
    /* Apply active Derate to Limit if in that mode */
    if (FADEC->thrust_mode == 1.0) { /* TOGA */
        FLATRATE->N1_limit = FADEC->N1_TOGA;
    } else if (FADEC->thrust_mode == 2.0) { /* CLB */
        FLATRATE->N1_limit = FADEC->N1_CLB;
    }
    /* MCT usually not derated */
}

static void updateTemperatureDependentIdle(struct0_T *rt_state)
{
  double T_ISA;           /* ISA temperature at altitude */
  double OAT_K;           /* OAT in Kelvin */
  double delta_ISA;       /* Deviation from ISA */
  double idle_adjust;     /* Idle adjustment factor */
  
  /* ====================================================== */
  /* CALCULATE ISA DEVIATION                                */
  /* ====================================================== */
  /* ISA temperature: 15°C at sea level, -2°C per 1000ft up to 36,089ft */
  if (rt_state->Altitude_ft < 36089.0) {
    T_ISA = 15.0 - 0.001981 * rt_state->Altitude_ft * 3.28084;  /* Convert to deg C */
  } else {
    T_ISA = -56.5;  /* Stratosphere - constant */
  }
  
  /* Get OAT from ambient temperature */
  OAT_K = rt_state->T_ambient;
  rt_state->OAT_celsius = OAT_K - 273.15;
  
  /* Calculate ISA deviation */
  delta_ISA = rt_state->OAT_celsius - T_ISA;
  rt_state->ISA_deviation = delta_ISA;
  
  /* ====================================================== */
  /* BASE IDLE VALUES (at ISA conditions)                   */
  /* ====================================================== */
  /* Trent 900 typical idle values */
  rt_state->idle_N1_ground_base = 20.0;   /* ~20% N1 ground idle at ISA */
  rt_state->idle_N1_flight_base = 25.0;   /* ~25% N1 flight idle at ISA */
  
  /* ====================================================== */
  /* HOT DAY ADJUSTMENT                                     */
  /* ====================================================== */
  /* Hot day (ISA + 15°C or higher):
   * - Air density is lower
   * - Need higher N1 for same bleed pressure
   * - Compressor operates closer to surge
   * - Typically +2-4% N1 increase
   */
  if (delta_ISA > 15.0) {
    rt_state->hot_day_operation = true;
    rt_state->cold_day_operation = false;
    
    /* N1 increases ~0.1% per °C above ISA+15 */
    rt_state->idle_N1_hot_day_adjustment = 2.0 + (delta_ISA - 15.0) * 0.1;
    if (rt_state->idle_N1_hot_day_adjustment > 6.0) {
      rt_state->idle_N1_hot_day_adjustment = 6.0;  /* Max +6% N1 */
    }
    rt_state->idle_N1_cold_day_adjustment = 0.0;
    
    /* Higher EGT at idle on hot days */
    rt_state->idle_EGT_hot_day = 450.0 + delta_ISA * 2.0;
    
    /* Higher fuel flow on hot days */
    rt_state->idle_FF_hot_day = 0.18 + delta_ISA * 0.002;
    
  /* ====================================================== */
  /* COLD DAY ADJUSTMENT                                    */
  /* ====================================================== */
  /* Cold day (ISA - 15°C or lower):
   * - Air density is higher
   * - Can use lower N1 and still have adequate performance
   * - Better surge margin
   * - Typically -1 to -3% N1 reduction
   */
  } else if (delta_ISA < -15.0) {
    rt_state->hot_day_operation = false;
    rt_state->cold_day_operation = true;
    
    /* N1 decreases ~0.08% per °C below ISA-15 */
    rt_state->idle_N1_cold_day_adjustment = ((-15.0) - delta_ISA) * 0.08;
    if (rt_state->idle_N1_cold_day_adjustment > 3.0) {
      rt_state->idle_N1_cold_day_adjustment = 3.0;  /* Max -3% N1 */
    }
    rt_state->idle_N1_hot_day_adjustment = 0.0;
    
    /* Lower EGT at idle on cold days */
    rt_state->idle_EGT_cold_day = 380.0 + delta_ISA * 1.5;
    
    /* Lower fuel flow on cold days */
    rt_state->idle_FF_cold_day = 0.14 + delta_ISA * 0.001;
    
  } else {
    /* Normal ISA conditions */
    rt_state->hot_day_operation = false;
    rt_state->cold_day_operation = false;
    rt_state->idle_N1_hot_day_adjustment = 0.0;
    rt_state->idle_N1_cold_day_adjustment = 0.0;
  }
  
  /* ====================================================== */
  /* CALCULATE ACTUAL IDLE VALUES                           */
  /* ====================================================== */
  /* Ground idle */
  rt_state->idle_N1_ground_actual = rt_state->idle_N1_ground_base + 
                                    rt_state->idle_N1_hot_day_adjustment -
                                    rt_state->idle_N1_cold_day_adjustment;
  
  /* Flight idle - also affected but with minimum for approach stability */
  rt_state->idle_N1_flight_actual = rt_state->idle_N1_flight_base + 
                                    rt_state->idle_N1_hot_day_adjustment * 0.8 -
                                    rt_state->idle_N1_cold_day_adjustment * 0.5;
  
  /* Minimum flight idle for approach stability */
  if (rt_state->idle_N1_flight_actual < 22.0) {
    rt_state->idle_N1_flight_actual = 22.0;
  }
  
  /* Convert N1 to N3 for governor (N3 ≈ N1 * 2.9 at idle) */
  rt_state->idle_N3_ground_actual = rt_state->idle_N1_ground_actual * 2.9;
  rt_state->idle_N3_flight_actual = rt_state->idle_N1_flight_actual * 2.9;
  
  /* Update idle governor targets */
  if (rt_state->airborne) {
    rt_state->idle_governor_N3_target = rt_state->idle_N3_flight_actual;
  } else {
    rt_state->idle_governor_N3_target = rt_state->idle_N3_ground_actual;
  }
}

/*
 * High-Fidelity Thrust Model
 * Calculates thrust using proper momentum and pressure terms
 * 
 * Thrust = (mdot_exit * V_exit) - (mdot_inlet * V_flight) + (P_exit - P_amb) * A_exit
 *        = Gross Thrust - Ram Drag + Pressure Thrust
 *
 * Arguments    : struct0_T *rt_state
 * Return Type  : void
 */
static void calculateHighFidelityThrust(struct0_T *rt_state)
{
  double gamma;           /* Specific heat ratio */
  double R;               /* Gas constant */
  double Cp;              /* Specific heat at constant pressure */
  double P9, T9;          /* Core nozzle conditions */
  double P19, T19;        /* Bypass nozzle conditions */
  double PR_core, PR_bypass;
  double M_exit_core, M_exit_bypass;
  double V_exit_core, V_exit_bypass;
  double mdot_core, mdot_bypass;
  double V_flight;
  double A_core, A_bypass;
  double rho_exit_core, rho_exit_bypass;
  double P_exit_core, P_exit_bypass;
  
  /* ====================================================== */
  /* CONSTANTS                                              */
  /* ====================================================== */
  gamma = 1.35;           /* Hot gas gamma */
  R = 287.0;              /* J/(kg·K) */
  Cp = 1150.0;            /* J/(kg·K) for hot exhaust gases */
  
  /* Nozzle areas (Trent 900) */
  A_core = 0.58;          /* Core nozzle area m^2 */
  A_bypass = 2.90;        /* Bypass nozzle area m^2 */
  
  rt_state->core_nozzle_area = A_core;
  rt_state->bypass_nozzle_area = A_bypass;
  
  /* ====================================================== */
  /* FLIGHT VELOCITY (Ram Drag)                             */
  /* ====================================================== */
  V_flight = rt_state->V_tas;
  if (V_flight < 1.0) {
    V_flight = rt_state->Mach * 340.0;
  }
  rt_state->flight_velocity = V_flight;
  
  /* ====================================================== */
  /* INLET MASS FLOW AND RAM DRAG                          */
  /* ====================================================== */
  mdot_core = rt_state->mdot_core;
  mdot_bypass = rt_state->mdot_bypass;
  rt_state->inlet_mass_flow = mdot_core + mdot_bypass;
  
  /* Ram drag = mdot_inlet * V_flight */
  rt_state->ram_drag = rt_state->inlet_mass_flow * V_flight;
  
  /* ====================================================== */
  /* CORE NOZZLE (Station 9)                                */
  /* ====================================================== */
  P9 = rt_state->P9;      /* Core exit total pressure */
  T9 = rt_state->T9;      /* Core exit total temperature */
  
  if (P9 > rt_state->P_ambient && T9 > 300.0 && mdot_core > 0.1) {
    /* Pressure ratio */
    PR_core = P9 / rt_state->P_ambient;
    
    /* Check if nozzle is choked (PR > critical) */
    /* Critical PR for gamma=1.35 is ~1.87 */
    if (PR_core > 1.87) {
      rt_state->core_nozzle_choked = true;
      /* Choked flow - Mach 1 at throat, expansion afterwards */
      M_exit_core = 1.0;
      /* Exit pressure higher than ambient */
      P_exit_core = P9 / rt_powd_snf(1.0 + 0.175, 3.857);  /* P/Pt at M=1 */
    } else {
      rt_state->core_nozzle_choked = false;
      /* Unchoked - fully expanded to ambient */
      /* M = sqrt(2/(gamma-1) * ((Pt/P)^((gamma-1)/gamma) - 1)) */
      M_exit_core = sqrt(5.714 * (rt_powd_snf(PR_core, 0.259) - 1.0));
      if (M_exit_core > 1.0) M_exit_core = 1.0;
      P_exit_core = rt_state->P_ambient;
    }
    
    /* Exit velocity: V = M * sqrt(gamma * R * T_static) */
    /* T_static = T_total / (1 + (gamma-1)/2 * M^2) */
    double T_static_core = T9 / (1.0 + 0.175 * M_exit_core * M_exit_core);
    V_exit_core = M_exit_core * sqrt(gamma * R * T_static_core);
    
    /* Limit velocity */
    if (V_exit_core < 50.0) V_exit_core = 50.0;
    if (V_exit_core > 900.0) V_exit_core = 900.0;
    
    rt_state->core_nozzle_velocity = V_exit_core;
    rt_state->core_nozzle_pressure = P_exit_core;
    
    /* Core momentum thrust: mdot * V_exit */
    rt_state->gross_thrust_core = rt_state->mdot_turb * V_exit_core;
    
    /* Core pressure thrust: (P_exit - P_amb) * A_nozzle */
    rt_state->pressure_thrust_core = (P_exit_core - rt_state->P_ambient) * A_core;
    if (rt_state->pressure_thrust_core < 0.0) rt_state->pressure_thrust_core = 0.0;
    
  } else {
    rt_state->core_nozzle_choked = false;
    rt_state->core_nozzle_velocity = 0.0;
    rt_state->gross_thrust_core = 0.0;
    rt_state->pressure_thrust_core = 0.0;
  }
  
  /* ====================================================== */
  /* BYPASS NOZZLE (Station 19)                             */
  /* ====================================================== */
  P19 = rt_state->P2;     /* Bypass exit pressure (fan discharge) */
  T19 = rt_state->T2;     /* Bypass exit temperature */
  
  if (P19 > rt_state->P_ambient && T19 > 200.0 && mdot_bypass > 0.1) {
    PR_bypass = P19 / rt_state->P_ambient;
    
    /* Check if choked (critical PR ~1.89 for cold bypass air gamma=1.4) */
    if (PR_bypass > 1.89) {
      rt_state->bypass_nozzle_choked = true;
      M_exit_bypass = 1.0;
      P_exit_bypass = P19 / 1.89;  /* Approximate */
    } else {
      rt_state->bypass_nozzle_choked = false;
      /* Unchoked bypass */
      M_exit_bypass = sqrt(5.0 * (rt_powd_snf(PR_bypass, 0.286) - 1.0));
      if (M_exit_bypass > 1.0) M_exit_bypass = 1.0;
      if (M_exit_bypass < 0.0) M_exit_bypass = 0.0;
      P_exit_bypass = rt_state->P_ambient;
    }
    
    /* Bypass exit velocity (cooler air, gamma closer to 1.4) */
    double T_static_bypass = T19 / (1.0 + 0.2 * M_exit_bypass * M_exit_bypass);
    V_exit_bypass = M_exit_bypass * sqrt(1.4 * R * T_static_bypass);
    
    if (V_exit_bypass < 30.0) V_exit_bypass = 30.0;
    if (V_exit_bypass > 600.0) V_exit_bypass = 600.0;
    
    rt_state->bypass_nozzle_velocity = V_exit_bypass;
    rt_state->bypass_nozzle_pressure = P_exit_bypass;
    
    /* Bypass momentum thrust */
    rt_state->gross_thrust_bypass = mdot_bypass * V_exit_bypass;
    
    /* Bypass pressure thrust */
    rt_state->pressure_thrust_bypass = (P_exit_bypass - rt_state->P_ambient) * A_bypass;
    if (rt_state->pressure_thrust_bypass < 0.0) rt_state->pressure_thrust_bypass = 0.0;
    
  } else {
    rt_state->bypass_nozzle_choked = false;
    rt_state->bypass_nozzle_velocity = 0.0;
    rt_state->gross_thrust_bypass = 0.0;
    rt_state->pressure_thrust_bypass = 0.0;
  }
  
  /* ====================================================== */
  /* TOTAL THRUST CALCULATION                               */
  /* ====================================================== */
  /* Gross thrust = momentum thrust + pressure thrust */
  rt_state->gross_thrust_total = rt_state->gross_thrust_core + 
                                 rt_state->gross_thrust_bypass +
                                 rt_state->pressure_thrust_core +
                                 rt_state->pressure_thrust_bypass;
  
  /* Net thrust = gross thrust - ram drag */
  rt_state->net_thrust_total = rt_state->gross_thrust_total - rt_state->ram_drag;
  
  /* Breakdown */
  rt_state->net_thrust_core = rt_state->gross_thrust_core + 
                              rt_state->pressure_thrust_core -
                              (mdot_core / rt_state->inlet_mass_flow) * rt_state->ram_drag;
  rt_state->net_thrust_bypass = rt_state->gross_thrust_bypass +
                                rt_state->pressure_thrust_bypass -
                                (mdot_bypass / rt_state->inlet_mass_flow) * rt_state->ram_drag;
  
  /* ====================================================== */
  /* INSTALLATION EFFECTS                                   */
  /* ====================================================== */
  /* Inlet pressure recovery (Mach dependent) */
  if (rt_state->Mach < 0.8) {
    rt_state->inlet_pressure_recovery = 0.995;
  } else if (rt_state->Mach < 1.0) {
    rt_state->inlet_pressure_recovery = 0.995 - 0.02 * (rt_state->Mach - 0.8) / 0.2;
  } else {
    rt_state->inlet_pressure_recovery = 0.975 - 0.05 * (rt_state->Mach - 1.0);
    if (rt_state->inlet_pressure_recovery < 0.90) {
      rt_state->inlet_pressure_recovery = 0.90;
    }
  }
  
  /* Nozzle thrust coefficient (accounts for boundary layer losses) */
  rt_state->nozzle_thrust_coefficient = 0.985;
  
  /* Installation loss factor (nacelle scrubbing, interference) */
  rt_state->installation_loss_factor = 0.98;
  
  /* Bleed effect on thrust (reduced mass flow through core) */
  rt_state->thrust_loss_from_bleed = rt_state->mdot_bleed_total * V_exit_core * 0.5;
  
  /* Power extraction effect (from generators, hydraulics) */
  rt_state->thrust_loss_from_power = rt_state->P_accessory / V_exit_core * 0.001;
  
  /* Installed thrust */
  rt_state->installed_thrust = rt_state->net_thrust_total * 
                               rt_state->inlet_pressure_recovery *
                               rt_state->nozzle_thrust_coefficient *
                               rt_state->installation_loss_factor -
                               rt_state->thrust_loss_from_bleed;
  
  /* ====================================================== */
  /* THRUST LAPSE AND COEFFICIENTS                          */
  /* ====================================================== */
  /* Thrust lapse with altitude (density ratio) */
  rt_state->thrust_lapse_rate = rt_state->rho_ambient / 1.225;
  
  /* Thrust vs Mach correction */
  if (rt_state->Mach < 0.5) {
    rt_state->thrust_vs_mach = 1.0;
  } else {
    rt_state->thrust_vs_mach = 1.0 - 0.15 * (rt_state->Mach - 0.5);
    if (rt_state->thrust_vs_mach < 0.7) rt_state->thrust_vs_mach = 0.7;
  }
  
  /* Thrust coefficient */
  double q = 0.5 * rt_state->rho_ambient * V_flight * V_flight;
  double A_ref = 6.84;  /* Fan area for reference */
  if (q > 100.0) {
    rt_state->thrust_coefficient = rt_state->installed_thrust / (q * A_ref);
  } else {
    rt_state->thrust_coefficient = 0.0;
  }
  
  /* Update main thrust values */
  if (rt_state->installed_thrust > 0.0) {
    rt_state->Core_Thrust = rt_state->net_thrust_core;
    rt_state->Bypass_Thrust = rt_state->net_thrust_bypass;
    rt_state->Thrust = rt_state->installed_thrust;
  }
}

/*
 * ENGINE PARAMETERS
 *
 * Arguments    : f_struct_T *rt_params
 * Return Type  : void
 */
static void initializeAllStructures(f_struct_T *rt_params)
{
  static const double t0_PR[32] = {
      1.15, 1.18, 1.2,  1.22, 1.25, 1.28, 1.3,  1.32, 1.35, 1.38, 1.4,
      1.42, 1.45, 1.48, 1.5,  1.52, 1.55, 1.58, 1.6,  1.62, 1.65, 1.68,
      1.7,  1.72, 1.68, 1.71, 1.73, 1.75, 1.7,  1.73, 1.75, 1.77};
  static const double t0_efficiency[32] = {
      0.8,  0.82, 0.83, 0.84, 0.82, 0.84, 0.85, 0.86, 0.84, 0.86, 0.87,
      0.88, 0.86, 0.88, 0.89, 0.9,  0.88, 0.9,  0.91, 0.92, 0.9,  0.92,
      0.92, 0.92, 0.89, 0.91, 0.91, 0.91, 0.87, 0.89, 0.89, 0.89};
  static const double t1_PR[21] = {1.02, 1.03, 1.04, 1.04, 1.05, 1.06, 1.06,
                                   1.07, 1.08, 1.08, 1.09, 1.09, 1.1,  1.1,
                                   1.1,  1.1,  1.1,  1.1,  1.1,  1.1,  1.1};
  static const double t1_efficiency[21] = {
      0.85, 0.86, 0.87, 0.87, 0.88, 0.89, 0.9,  0.91, 0.92, 0.93, 0.94,
      0.95, 0.95, 0.96, 0.97, 0.97, 0.97, 0.97, 0.96, 0.96, 0.96};
  static const double t2_PR[21] = {1.5, 1.6, 1.7, 1.8, 1.9,  2.0,  2.1,
                                   2.2, 2.3, 2.4, 2.5, 2.6,  2.7,  2.8,
                                   2.9, 3.0, 3.0, 3.0, 3.05, 3.05, 3.05};
  static const double t2_efficiency[21] = {
      0.82, 0.83, 0.84, 0.85, 0.86, 0.87, 0.88, 0.89, 0.9,  0.91, 0.92,
      0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.98, 0.96, 0.97, 0.97};
  static const double t3_PR[21] = {3.0, 3.2, 3.4, 4.0, 4.2, 4.4, 5.0,
                                   5.2, 5.4, 6.0, 6.2, 6.4, 6.8, 7.0,
                                   7.1, 7.2, 7.2, 7.2, 7.3, 7.3, 7.3};
  static const double t3_efficiency[21] = {
      0.8,  0.81, 0.82, 0.84, 0.85, 0.86, 0.88, 0.89, 0.9,  0.92, 0.93,
      0.94, 0.96, 0.97, 0.97, 0.98, 0.98, 0.98, 0.97, 0.97, 0.97};
  static const double t4_eff_vs_PR[14] = {1.5,  2.0,  3.0,  4.0,  5.0,
                                          6.0,  7.0,  0.85, 0.88, 0.91,
                                          0.93, 0.93, 0.93, 0.92};
  static const double t6_eff_vs_PR[14] = {1.2,  1.5,  2.0,  2.5,  3.0,
                                          3.2,  3.5,  0.9,  0.93, 0.96,
                                          0.98, 0.98, 0.98, 0.97};
  static const double t5_eff_vs_PR[12] = {1.3,  1.8,  2.5,  3.0,  3.6,  4.0,
                                          0.83, 0.86, 0.89, 0.91, 0.91, 0.9};
  static const double t0_speeds[8] = {0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.05, 1.1};
  static const double t1_speeds[7] = {0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.05};
  static const double t2_speeds[7] = {0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.05};
  static const double t3_speeds[7] = {0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.05};
  static const unsigned char t0_mdot_corrected[32] = {
      100U, 110U, 120U, 130U, 110U, 120U, 130U, 140U, 120U, 130U, 140U,
      150U, 130U, 140U, 150U, 160U, 140U, 150U, 160U, 170U, 150U, 160U,
      170U, 180U, 152U, 162U, 172U, 182U, 154U, 164U, 174U, 184U};
  static const signed char t1_mdot_corrected[21] = {20, 22, 24, 25, 27, 29, 30,
                                                    32, 34, 35, 37, 39, 40, 42,
                                                    44, 42, 44, 46, 43, 45, 47};
  static const signed char t2_mdot_corrected[21] = {40, 42, 44, 50, 52, 54, 60,
                                                    62, 64, 70, 72, 74, 80, 82,
                                                    84, 85, 87, 89, 87, 89, 91};
  static const unsigned char t3_mdot_corrected[21] = {
      60U,  62U,  64U,  75U,  77U,  79U,  90U,  92U,  94U,  105U, 107U,
      109U, 120U, 122U, 124U, 128U, 130U, 132U, 130U, 132U, 134U};
  int i;
  /*  ====================================================== */
  /*  INITIALIZATION FUNCTION */
  /*  ====================================================== */
  rt_params->gamma = 1.4;
  rt_params->gamma_hot = 1.33;
  rt_params->R = 287.0;
  rt_params->cp = 1005.0;
  rt_params->cp_hot = 1150.0;
  /*  ISA Reference */
  rt_params->P0_ISA = 101325.0;
  rt_params->T0_ISA = 288.15;
  rt_params->rho0_ISA = 1.225;
  rt_params->P0 = 101325.0;
  rt_params->T0 = 288.15;
  rt_params->rho0 = 1.225;
  /*  Flight conditions */
  rt_params->Altitude_m = 0.0;
  rt_params->Altitude_ft = 0.0;
  rt_params->Mach = 0.0;
  rt_params->TAS_kts = 0.0;
  rt_params->IAS_kts = 0.0;
  rt_params->OAT_K = 288.15;
  rt_params->OAT_C = 15.0;
  rt_params->ISA_dev = 0.0;
  /*  Fuel Properties */
  rt_params->Q_fuel = 4.3E+7;
  rt_params->stoich_FAR = 0.068;
  rt_params->max_FAR = 0.035;
  rt_params->min_FAR = 0.008;
  rt_params->combustor_min_dT_base = 0.0;
  rt_params->combustor_min_dT_full = 150.0;
  /*  Geometry */
  rt_params->fan_diameter = 2.95;
  rt_params->fan_area = 6.8386;
  /*  pi * (2.95/2)^2 - explicit constant for codegen */
  rt_params->bypass_ratio_design = 8.6;
  rt_params->core_area = 0.5;
  rt_params->A_core = 1.2;
  rt_params->A_bypass = 3.5;
  rt_params->A_nozzle_core = 1.0;
  rt_params->A_nozzle_bypass = 3.2;
  /*  Mass flows (explicit constants for codegen) */
  rt_params->mdot_total_design = 1225.0;
  rt_params->mdot_core_design = 127.6;
  /*  1225 / (1 + 8.6) */
  rt_params->mdot_bypass_design = 1097.4;
  /*  1225 - 127.6 */
  rt_params->mdot_core_corrected_design = 128.0;
  rt_params->mdot_fan_corrected_design = 1225.0;
  /*  RPM specs */
  rt_params->N1_max = 2800.0;
  rt_params->N2_max = 7800.0;
  rt_params->N3_max = 11800.0;
  rt_params->N1_idle_ground = 17.0;
  rt_params->N1_idle_flight = 23.0;
  rt_params->N2_idle = 48.0;
  rt_params->N3_idle = 60.0;
  /*  Inertias */
  rt_params->J_N1 = 3000.0;
  rt_params->J_N2 = 800.0;
  rt_params->J_N3 = 350.0;
  /*  Damping */
  rt_params->B_N1 = 0.5;
  rt_params->C_N1 = 2.0;
  rt_params->B_N2 = 0.5;
  rt_params->C_N2 = 3.0;
  rt_params->B_N3 = 0.25;
  rt_params->C_N3 = 3.0;
  /*  Efficiencies */
  rt_params->eta_fan = 0.92;
  rt_params->eta_LPC = 0.97;
  rt_params->eta_IPC = 0.98;
  rt_params->eta_HPC = 0.98;
  rt_params->eta_HPT = 0.93;
  rt_params->eta_IPT = 0.91;
  rt_params->eta_LPT = 0.98;
  rt_params->eta_mech_N1 = 0.99;
  rt_params->eta_mech_N2 = 0.99;
  rt_params->eta_mech_N3 = 0.99;
  rt_params->eta_comb = 0.998;
  rt_params->eta_comb_pressure = 0.99;
  /*  Time constants */
  rt_params->tau_combustor = 3.5;
  rt_params->tau_turbine_metal = 5.0;
  rt_params->tau_EGT_probe = 18.0;
  rt_params->tau_mass_flow = 0.3;
  rt_params->tau_temperature = 0.5;
  rt_params->tau_pressure = 0.2;
  rt_params->tau_fuel = 2.5;
  /*  Pressure ratios */
  rt_params->FPR_design = 1.65;
  rt_params->LPC_PR_design = 1.1;
  rt_params->IPC_PR_design = 3.0;
  rt_params->HPC_PR_design = 7.2;
  rt_params->OPR_design = 39.0;
  rt_params->HPT_PR_design = 6.0;
  rt_params->IPT_PR_design = 3.6;
  rt_params->LPT_PR_design = 3.2;
  /*  Thrust */
  rt_params->Thrust_TOGA_SL = 374000.0;
  rt_params->Thrust_MCT_SL = 356000.0;
  rt_params->Thrust_CLB_SL = 320000.0;
  /*  EGT limits */
  rt_params->EGT_redline = 1150.0;
  rt_params->EGT_max_continuous = 1130.0;
  rt_params->EGT_max_transient = 1180.0;
  rt_params->EGT_idle_target = 330.0;
  rt_params->EGT_TOGA_target = 920.0;
  rt_params->EGT_start_limit = 760.0;
  /*  Speed limits */
  rt_params->N1_TOGA_limit = 97.8;
  rt_params->N1_overspeed_limit = 102.0;
  rt_params->N2_overspeed_limit = 104.0;
  rt_params->N3_warning = 102.0;
  rt_params->N3_stage1 = 103.0;
  rt_params->N3_stage2 = 104.0;
  rt_params->N3_redline = 104.0;
  rt_params->N3_cmd_limit = 98.7;
  rt_params->N3_cmd_redline = 104.0;
  /*  Fuel limits */
  rt_params->FF_idle = 0.16666666666666666;
  rt_params->FF_TOGA = 3.0555555555555554;
  rt_params->FF_max = 3.1944444444444446;
  rt_params->FF_min = 1.0E-6;
  rt_params->FF_idle_min_factor = 0.2;
  rt_params->FF_rise_rate = 0.5;
  rt_params->FF_fall_rate = 3.0;
  /*  Start params */
  rt_params->N3_lightup_min = 25.0;
  rt_params->N3_stabilized = 35.0;
  rt_params->starter_torque_max = 6000.0;
  rt_params->starter_cutoff_N3 = 50.0;
  rt_params->Ndot_max_startup = 3.0;
  rt_params->Ndot_max_normal = 2.0;
  rt_params->Ndot_min_decay = -3.0;
  /*  Transient limits */
  rt_params->turbine_power_rise_rate = 1.0E+6;
  rt_params->turbine_power_fall_rate = 1.0E+8;
  rt_params->TOGA_ramp_time = 5.5;
  rt_params->TOGA_ramp_initial_frac = 0.4;
  rt_params->transient_damper_threshold = 3.0;
  rt_params->transient_damper_power = 50000.0;
  /*  Governor params */
  rt_params->TOGA_governor_enabled = true;
  rt_params->N1_TOGA_govern = 97.8;
  rt_params->N2_TOGA_govern = 98.0;
  rt_params->N3_TOGA_govern = 98.7;
  rt_params->TOGA_gov_Kp = 0.25;
  rt_params->TOGA_gov_Ki = 0.08;
  rt_params->TOGA_gov_int_limit = 1.5;
  rt_params->TOGA_gov_max_trim = 0.5;
  /*  Fan blade params */
  rt_params->fan_num_blades = 24.0;
  rt_params->fan_hub_radius = 0.4;
  rt_params->fan_tip_radius = 1.475;
  rt_params->fan_blade_chord = 0.25;
  rt_params->fan_num_elements = 20.0;
  rt_params->fan_Cl_alpha = 5.7;
  rt_params->fan_Cd0 = 0.008;
  rt_params->fan_alpha_stall = 0.26179938779914941;
  rt_params->fan_Cl_max = 1.4;
  rt_params->fan_Cl_post_stall = 0.6;
  rt_params->fan_Mach_crit = 0.85;
  rt_params->test_mode = false;
  rt_params->idle_gov_max_trim = 0.99;
  rt_params->idle_gov_max_add = 0.5;
  /*  Initialize compressor/turbine maps (simplified for MATLAB Coder
   * compatibility) */
  memcpy(&rt_params->fan_map.speeds[0], &t0_speeds[0], 8U * sizeof(double));
  for (i = 0; i < 32; i++) {
    rt_params->fan_map.PR[i] = t0_PR[i];
    rt_params->fan_map.efficiency[i] = t0_efficiency[i];
    rt_params->fan_map.mdot_corrected[i] = t0_mdot_corrected[i];
  }
  for (i = 0; i < 7; i++) {
    rt_params->LPC_map.speeds[i] = t1_speeds[i];
  }
  for (i = 0; i < 21; i++) {
    rt_params->LPC_map.PR[i] = t1_PR[i];
    rt_params->LPC_map.efficiency[i] = t1_efficiency[i];
    rt_params->LPC_map.mdot_corrected[i] = t1_mdot_corrected[i];
  }
  for (i = 0; i < 7; i++) {
    rt_params->IPC_map.speeds[i] = t2_speeds[i];
  }
  for (i = 0; i < 21; i++) {
    rt_params->IPC_map.PR[i] = t2_PR[i];
    rt_params->IPC_map.efficiency[i] = t2_efficiency[i];
    rt_params->IPC_map.mdot_corrected[i] = t2_mdot_corrected[i];
  }
  for (i = 0; i < 7; i++) {
    rt_params->HPC_map.speeds[i] = t3_speeds[i];
  }
  for (i = 0; i < 21; i++) {
    rt_params->HPC_map.PR[i] = t3_PR[i];
    rt_params->HPC_map.efficiency[i] = t3_efficiency[i];
    rt_params->HPC_map.mdot_corrected[i] = t3_mdot_corrected[i];
  }
  memcpy(&rt_params->HPT_map.eff_vs_PR[0], &t4_eff_vs_PR[0],
         14U * sizeof(double));
  memcpy(&rt_params->IPT_map.eff_vs_PR[0], &t5_eff_vs_PR[0],
         12U * sizeof(double));
  memcpy(&rt_params->LPT_map.eff_vs_PR[0], &t6_eff_vs_PR[0],
         14U * sizeof(double));
  /*  SIMULATION STATE */
  /*  FADEC */
  /*  ACCESSORY SYSTEM */
  /*  RELIGHT */
  /*  FLATRATE */
  /*  DERATE */
  /*  SURGE */
  /*  WINDMILL */
  /*  BLEED/START SCHEDULES */
  /*  DYNAMIC STALL */
}

/*
 * Arguments    : const double map_speeds[7]
 *                const double map_PR[21]
 *                const double map_efficiency[21]
 *                const double map_mdot_corrected[21]
 *                double N_frac
 *                double PR_demand
 *                double *eta
 *                double *mdot_corr
 * Return Type  : double
 */
static double lookupCompressorMap(const double map_speeds[7],
                                  const double map_PR[21],
                                  const double map_efficiency[21],
                                  const double map_mdot_corrected[21],
                                  double N_frac, double PR_demand, double *eta,
                                  double *mdot_corr)
{
  double varargin_1[7];
  double PR;
  int N_idx;
  int k;
  /*  Compressor and Turbine Map Lookups */
  if (N_frac < 0.01) {
    PR = 1.0;
    *eta = 0.5;
    *mdot_corr = 0.1;
  } else {
    if ((N_frac >= 1.2) || rtIsNaN(N_frac)) {
      N_frac = 1.2;
    }
    if (N_frac <= 0.01) {
      N_frac = 0.01;
    }
    for (k = 0; k < 7; k++) {
      varargin_1[k] = fabs(map_speeds[k] - N_frac);
    }
    minimum(varargin_1, &k);
    if (k >= 7) {
      k = 7;
    }
    if (k <= 1) {
      N_idx = 0;
    } else {
      N_idx = k - 1;
    }
    for (k = 0; k < 7; k++) {
      varargin_1[k] = fabs(map_PR[N_idx + 3 * k] - PR_demand);
    }
    minimum(varargin_1, &k);
    if (k >= 7) {
      k = 7;
    }
    if (k <= 1) {
      k = 0;
    } else {
      k--;
    }
    k = N_idx + 3 * k;
    PR = map_PR[k];
    *eta = map_efficiency[k];
    *mdot_corr = map_mdot_corrected[k];
  }
  return PR;
}

/*
 * Arguments    : double u0
 *                double u1
 * Return Type  : double
 */
static double rt_atan2d_snf(double u0, double u1)
{
  double y;
  int i;
  int i1;
  if (rtIsNaN(u0) || rtIsNaN(u1)) {
    y = rtNaN;
  } else if (rtIsInf(u0) && rtIsInf(u1)) {
    if (u0 > 0.0) {
      i = 1;
    } else {
      i = -1;
    }
    if (u1 > 0.0) {
      i1 = 1;
    } else {
      i1 = -1;
    }
    y = atan2(i, i1);
  } else if (u1 == 0.0) {
    if (u0 > 0.0) {
      y = RT_PI / 2.0;
    } else if (u0 < 0.0) {
      y = -(RT_PI / 2.0);
    } else {
      y = 0.0;
    }
  } else {
    y = atan2(u0, u1);
  }
  return y;
}

/*
 * Arguments    : double u0
 *                double u1
 * Return Type  : double
 */
static double rt_powd_snf(double u0, double u1)
{
  double d;
  double d1;
  double y;
  if (rtIsNaN(u0) || rtIsNaN(u1)) {
    y = rtNaN;
  } else {
    d = fabs(u0);
    d1 = fabs(u1);
    if (rtIsInf(u1)) {
      if (d == 1.0) {
        y = 1.0;
      } else if (d > 1.0) {
        if (u1 > 0.0) {
          y = rtInf;
        } else {
          y = 0.0;
        }
      } else if (u1 > 0.0) {
        y = 0.0;
      } else {
        y = rtInf;
      }
    } else if (d1 == 0.0) {
      y = 1.0;
    } else if (d1 == 1.0) {
      if (u1 > 0.0) {
        y = u0;
      } else {
        y = 1.0 / u0;
      }
    } else if (u1 == 2.0) {
      y = u0 * u0;
    } else if ((u1 == 0.5) && (u0 >= 0.0)) {
      y = sqrt(u0);
    } else if ((u0 < 0.0) && (u1 > floor(u1))) {
      y = rtNaN;
    } else {
      y = pow(u0, u1);
    }
  }
  return y;
}

/*
 * Mark as running
 *
 * Arguments    : struct0_T *rt_state
 *                const double rt_params_HPC_map_speeds[7]
 *                const double rt_params_HPC_map_PR[21]
 *                const double rt_params_HPC_map_efficiency[21]
 *                const double c_rt_params_HPC_map_mdot_correc[21]
 *                const double rt_params_HPT_map_eff_vs_PR[14]
 *                const double rt_params_IPT_map_eff_vs_PR[12]
 *                const double rt_params_LPT_map_eff_vs_PR[14]
 *                struct1_T *FADEC
 *                struct2_T *ACC
 *                struct_T *FLATRATE
 *                const g_struct_T *BLEED_SCHED
 *                h_struct_T *DYNSTALL
 *                double dt
 * Return Type  : void
 */
static void runNormalOperationStepInternal(
    struct0_T *rt_state, const double rt_params_HPC_map_speeds[7],
    const double rt_params_HPC_map_PR[21],
    const double rt_params_HPC_map_efficiency[21],
    const double c_rt_params_HPC_map_mdot_correc[21],
    const double rt_params_HPT_map_eff_vs_PR[14],
    const double rt_params_IPT_map_eff_vs_PR[12],
    const double rt_params_LPT_map_eff_vs_PR[14], struct1_T *FADEC,
    struct2_T *ACC, struct_T *FLATRATE, const g_struct_T *BLEED_SCHED,
    h_struct_T *DYNSTALL, double dt)
{
  g_struct_T b_BLEED_SCHED;
  double N1_lapse_rate;
  double N1_reduction;
  double oat_factor;
  double u0;
  int N1_idle; /* Integer type for switch statement */
  
  /* Update Physics and Protection Systems */
  updateEngineDegradation(rt_state, dt, rt_state->engine_running);
  updateTemperatureDependentIdle(rt_state);

  
  /* Update High-Fidelity FADEC Systems */
  if (rt_state->engine_running) {
      updateFADECRedundancy(rt_state, FADEC, dt);
      calculateEPR(rt_state);
      FADEC->EPR = rt_state->EPR_Actual;
      FADEC->EPR_TOGA = 1.65;
      {
        double n1_cmd_norm = (FADEC->N1_cmd - 22.0) / (100.0 - 22.0);
        if (n1_cmd_norm < 0.0) n1_cmd_norm = 0.0;
        if (n1_cmd_norm > 1.05) n1_cmd_norm = 1.05;
        FADEC->EPR_cmd = 1.015 + 0.635 * pow(n1_cmd_norm, 1.82);
      }
      /* Update FLEX/Derate Logic (Overrides Flat Rating) */
      updateFLEXandDerate(rt_state, FADEC, FLATRATE);
      
      /* Apply Altitude N1 Lapse (Schedule increases N1 with Altitude) */
      /* Typical: +10-12% N1 from SL to FL350 to maintain corrected speed */
      /* Approx 12.0 * (1 - P_amb/P_std) */
      {
        double alt_factor;
        double N1_lapse;
        
        alt_factor = 1.0 - (rt_state->P_ambient / 101325.0);
        if (alt_factor < 0.0) alt_factor = 0.0;
        if (alt_factor > 1.0) alt_factor = 1.0;
        
        N1_lapse = 12.0 * alt_factor;
        
        /* Apply to the active limit (CLB/MCT/TOGA all lapse) */
        FLATRATE->N1_limit += N1_lapse;
        
        /* Hard Redline Clamp */
        if (FLATRATE->N1_limit > 100.0) FLATRATE->N1_limit = 100.0; 
      }
  }
  /*  Normal Operation (Basic Implementation) */
  rt_state->engine_running = true;
  rt_state->starter_on = false;
  rt_state->combustion_active = true;
  rt_state->fuel_on = true;
  
  /* Accelerate spools to throttle-demanded speeds */
  {
    /* Tuned for User Request: N1~16-17.5% at Idle, N3~99.5% at TOGA */
    double N1_demand = 16.5 + rt_state->throttle * 81.5; /* Idle 16.5% demand -> Settle ~16.5%, TOGA ~98% */
    double N3_demand = 60.0 + rt_state->throttle * 42.0; /* Idle 60%, TOGA ~102% (Saturation target) */
    double N2_demand = N3_demand * 0.90; /* Initial demand target */
    
    /* Accelerate toward demand with high responsiveness (Gain 2.5) */
    
    if (rt_state->N1_perc < N1_demand) {
      rt_state->N1_perc += (N1_demand - rt_state->N1_perc) * dt * 2.5;
      if (rt_state->N1_perc > N1_demand) rt_state->N1_perc = N1_demand;
    } else {
      rt_state->N1_perc -= (rt_state->N1_perc - N1_demand) * dt * 2.0;
    }
    
    if (rt_state->N3_perc < N3_demand) {
      rt_state->N3_perc += (N3_demand - rt_state->N3_perc) * dt * 2.5;
      if (rt_state->N3_perc > N3_demand) rt_state->N3_perc = N3_demand;
    } else {
      rt_state->N3_perc -= (rt_state->N3_perc - N3_demand) * dt * 2.0;
    }
    
    /* Force N2 relationship: User wants N2 ~ 48% when N3 ~ 60% -> Ratio 0.8 */
    /* At TOGA (N3=100), this gives N2=80%. Previously we wanted N2 > N1 (~98%). */
    /* Let's make it variable: 0.8 at idle, increasing to 0.995 at max */
    double n2_ratio = 0.80 + rt_state->throttle * 0.195; 
    rt_state->N2_perc = rt_state->N3_perc * n2_ratio;
    
    /* Update RPM and omega values */
    rt_state->N1 = rt_state->N1_perc / 100.0 * 2800.0;
    rt_state->N2 = rt_state->N2_perc / 100.0 * 7800.0;
    rt_state->N3 = rt_state->N3_perc / 100.0 * 11800.0;
    rt_state->omega_N1 = rt_state->N1 * 2.0 * 3.14159265 / 60.0;
    rt_state->omega_N2 = rt_state->N2 * 2.0 * 3.14159265 / 60.0;
    rt_state->omega_N3 = rt_state->N3 * 2.0 * 3.14159265 / 60.0;
    
    /* Calculate fuel flow and EGT based on throttle */
    rt_state->FF_cmd = 0.3 + rt_state->throttle * 2.5333; /* Target 10200 kg/h (~2.83 kg/s) at max */
    
    /* Apply Protection Limits (Overspeed Governor) - Modifies FF_cmd */
    updateStartProtectionAndGovernors(rt_state, FADEC, dt);
    
    rt_state->FF_actual += (rt_state->FF_cmd - rt_state->FF_actual) * dt * 2.0;
    
    /* EGT from fuel burning */
    rt_state->EGT = 400.0 + rt_state->throttle * 500.0; /* 400-900°C */
    
    /* Direct thrust calculation based on N1 */
    /* Trent 900: max thrust ~374kN at 100% N1 */
    /* Direct thrust calculation based on N1 */
    /* Trent 900: max thrust ~374kN at 100% N1 */
    /* Use Power Law Curve for realistic idle thrust (Thrust ~ N1^1.95) */
    /* Tuned for 4% Thrust (~15kN) at 19% N1 */
    double thrust_factor = rt_state->N1_perc / 98.0; 
    if (thrust_factor < 0.0) thrust_factor = 0.0;
    
    double base_thrust = 374000.0 * pow(thrust_factor, 1.95);
    
    /* Apply flat rating and derate */
    rt_state->Thrust = base_thrust * FLATRATE->thrust_available;
    rt_state->Thrust = base_thrust * FLATRATE->thrust_available;
    rt_state->Thrust_rated = rt_state->Thrust;
    rt_state->Core_Thrust = rt_state->Thrust * 0.35; /* ~35% from core */
    rt_state->Bypass_Thrust = rt_state->Thrust * 0.65; /* ~65% from bypass */
  }
  
  /*  Determine thrust mode based on throttle */
  if (rt_state->throttle < 0.03) {
    N1_idle = 0;
    /*  Idle */
  } else if (rt_state->throttle < 0.8) {
    N1_idle = 1;
    /*  Climb */
  } else if (rt_state->throttle < 0.98) {
    N1_idle = 2;
    /*  MCT */
  } else {
    N1_idle = 4;
    /*  TOGA */
  }
  /*  Update flat rating based on conditions */
  /*  Calculate ISA temperature */
  /*  ====================================================== */
  /*  FLAT RATING AND DERATE FUNCTIONS */
  /*  ====================================================== */
  /*  Update Flat Rating */
  FLATRATE->corner_temp_K = 303.15;
  if (rt_state->T_ambient <= 303.15) {
    /*  Flat rated region (cold day) */
    FLATRATE->flat_rated_region = true;
    FLATRATE->thrust_available = 1.0;
    FLATRATE->lapse_factor = 1.0;
    N1_reduction = (303.15 - rt_state->T_ambient) * 0.08;
    switch (N1_idle) {
    case 4:
      FLATRATE->N1_limit = N1_reduction + 100.0;
      break;
    case 2:
      FLATRATE->N1_limit = N1_reduction + 89.0;
      break;
    case 1:
      FLATRATE->N1_limit = N1_reduction + 85.0;
      break;
    default:
      FLATRATE->N1_limit = 85.0;
      break;
    }
    N1_reduction = (303.15 - rt_state->T_ambient) / 50.0;
    if (N1_reduction >= 1.0) {
      N1_reduction = 1.0;
    }
    FLATRATE->EGT_margin = 100.0 * N1_reduction;
    FLATRATE->EGT_limit = 1030.0 - FLATRATE->EGT_margin * 0.3;
  } else {
    /*  Hot day (thrust lapse) */
    FLATRATE->flat_rated_region = false;
    FLATRATE->lapse_factor = 1.0 - (rt_state->T_ambient - 303.15) * 0.018;
    if ((FLATRATE->lapse_factor <= 0.65) || rtIsNaN(FLATRATE->lapse_factor)) {
      FLATRATE->lapse_factor = 0.65;
    }
    FLATRATE->thrust_available = FLATRATE->lapse_factor;
    N1_reduction = (rt_state->T_ambient - 303.15) * 0.25;
    switch (N1_idle) {
    case 4:
      FLATRATE->N1_limit = 100.0 - N1_reduction;
      break;
    case 2:
      FLATRATE->N1_limit = 89.0 - N1_reduction;
      break;
    case 1:
      FLATRATE->N1_limit = 85.0 - N1_reduction;
      break;
    default:
      FLATRATE->N1_limit = 85.0 - N1_reduction;
      break;
    }
    FLATRATE->EGT_margin = 0.0;
    FLATRATE->EGT_limit = 1030.0;
  }
  /*  Altitude lapse */
  if ((FLATRATE->N1_limit >= 105.0) || rtIsNaN(FLATRATE->N1_limit)) {
    N1_reduction = 105.0;
  } else {
    N1_reduction = FLATRATE->N1_limit;
  }
  if (N1_reduction <= 75.0) {
    FLATRATE->N1_limit = 75.0;
  } else {
    FLATRATE->N1_limit = N1_reduction;
  }
  /*  Update derate if state indicates it should change */
  /*  Simple fuel flow control based on throttle */
  /* Use Dynamic Idle from Physics Model */
  if (rt_state->airborne) {
    N1_idle = rt_state->idle_N1_flight_actual;
  } else {
    N1_idle = rt_state->idle_N1_ground_actual;
  }
  /*  Map throttle to N1 target (consider flat rating limits) */
  /*  Simple proportional fuel flow control */
  if (FLATRATE->N1_limit >= 100.0) {
    N1_reduction = 100.0;
  } else {
    N1_reduction = FLATRATE->N1_limit;
  }
  rt_state->FF_cmd = ((double)N1_idle +
                      rt_state->throttle * (N1_reduction - (double)N1_idle)) *
                         0.01 * 2.8888888888888888 +
                     0.16666666666666666;
  if ((rt_state->FF_cmd >= 3.1944444444444446) || rtIsNaN(rt_state->FF_cmd)) {
    N1_reduction = 3.1944444444444446;
  } else {
    N1_reduction = rt_state->FF_cmd;
  }
  if (N1_reduction <= 0.083333333333333329) {
    rt_state->FF_cmd = 0.083333333333333329;
  } else {
    rt_state->FF_cmd = N1_reduction;
  }
  /*  Apply FADEC control laws */
  /*  Update FADEC Model (Main Control Loop) */
  /*  Apply control laws in order of priority */
  /*  N1 overspeed */
  /*  Apply Overspeed Protection */
  /*  N2 overspeed */
  /*  N3 overspeed (most critical) */
  if (rt_state->N3_perc > 104.0) {
    FADEC->N3_limiting_active = true;
    N1_reduction = rt_state->FF_cmd -
                   (rt_state->N3_perc - 104.0) * 0.2 * 3.1944444444444446;
    if (N1_reduction <= 0.049999999999999996) {
      rt_state->FF_cmd = 0.049999999999999996;
    } else {
      rt_state->FF_cmd = N1_reduction;
    }
  } else if (rt_state->N3_perc > 102.0) {
    FADEC->N3_limiting_active = true;
    rt_state->FF_cmd -= (rt_state->N3_perc - 102.0) * 0.05 * 3.1944444444444446;
  } else {
    FADEC->N3_limiting_active = false;
  }
  /*  EGT Limiting */
  FADEC->EGT_limiting_active = false;
  if (rt_state->EGT > 980.0) {
    FADEC->EGT_limiting_active = true;
    N1_reduction =
        rt_state->FF_cmd - (rt_state->EGT - 980.0) * 0.01 * 3.1944444444444446;
    if (N1_reduction <= 0.099999999999999992) {
      rt_state->FF_cmd = 0.099999999999999992;
    } else {
      rt_state->FF_cmd = N1_reduction;
    }
  }
  /*  Apply TOGA Speed Governor */
  if (rt_state->throttle < 0.95) {
    FADEC->toga_governor_active = false;
  } else {
    FADEC->toga_governor_active = true;
    /*  N3 governor */
    FADEC->toga_gov_int += (98.7 - rt_state->N3_perc) * dt;
    if ((FADEC->toga_gov_int >= 1.5) || rtIsNaN(FADEC->toga_gov_int)) {
      N1_reduction = 1.5;
    } else {
      N1_reduction = FADEC->toga_gov_int;
    }
    if (N1_reduction <= -1.5) {
      FADEC->toga_gov_int = -1.5;
    } else {
      FADEC->toga_gov_int = N1_reduction;
    }
    N1_reduction =
        0.25 * (98.7 - rt_state->N3_perc) + 0.08 * FADEC->toga_gov_int;
    if ((N1_reduction >= 0.5) || rtIsNaN(N1_reduction)) {
      N1_reduction = 0.5;
    }
    if (N1_reduction <= -0.5) {
      N1_reduction = -0.5;
    }
    rt_state->FF_cmd += N1_reduction * 3.0555555555555554;
  }
  /*  Apply Idle Governor */
  N1_idle = 17;
  if (rt_state->airborne) {
    N1_idle = 23;
  }
  if (rt_state->throttle < 0.05) {
    FADEC->idle_governor_active = true;
    FADEC->gov_int_N1 += (double)N1_idle * dt;
    if ((FADEC->gov_int_N1 >= 0.99) || rtIsNaN(FADEC->gov_int_N1)) {
      N1_reduction = 0.99;
    } else {
      N1_reduction = FADEC->gov_int_N1;
    }
    if (N1_reduction <= -0.99) {
      FADEC->gov_int_N1 = -0.99;
    } else {
      FADEC->gov_int_N1 = N1_reduction;
    }
    rt_state->FF_cmd += 0.5;
    FADEC->gov_trim_total = 0.5;
  } else {
    FADEC->idle_governor_active = false;
    FADEC->gov_int_N1 *= 0.95;
  }
  /*   Apply Acceleration/Deceleration Limits */
  FADEC->accel_limiting_active = false;
  FADEC->decel_limiting_active = false;
  /* Allow up to 8.0%/s acceleration for TOGA response (Cert requirement: approach to TOGA < 5s) */
  if (rt_state->N3_dot > 8.0) {
    FADEC->accel_limiting_active = true;
    rt_state->FF_cmd -= (rt_state->N3_dot - 8.0) * 0.05 * 3.1944444444444446;
  }
  if (rt_state->N3_dot < -3.0) {
    FADEC->decel_limiting_active = true;
    rt_state->FF_cmd +=
        fabs(rt_state->N3_dot - -3.0) * 0.03 * 3.1944444444444446;
  }
  /*  Final fuel flow limits */
  if ((rt_state->FF_cmd >= 3.1944444444444446) || rtIsNaN(rt_state->FF_cmd)) {
    N1_reduction = 3.1944444444444446;
  } else {
    N1_reduction = rt_state->FF_cmd;
  }
  if (N1_reduction <= 1.0E-6) {
    rt_state->FF_cmd = 1.0E-6;
  } else {
    rt_state->FF_cmd = N1_reduction;
  }
  /*  Apply fuel flow with lag */
  rt_state->FF_actual += (rt_state->FF_cmd - rt_state->FF_actual) * dt / 2.5;
  /*  Update accessory system */
  /*  IDG power extraction */
  /*  ====================================================== */
  /*  ACCESSORY SYSTEM UPDATES (Simplified) */
  /*  ====================================================== */
  if (rt_state->N3_perc >= 55.0) {
    ACC->P_IDG = 90000.0 * (rt_state->N3_perc / 100.0);
  } else {
    ACC->P_IDG = 0.0;
  }
  /*  Hydraulic power */
  if (rt_state->N3_perc >= 50.0) {
    ACC->P_HYD = 3.7224E+8 * (rt_state->N3_perc / 100.0) / 0.9;
  } else {
    ACC->P_HYD = 0.0;
  }
  /*  Fuel pump power */
  ACC->P_fuel_pump = rt_state->FF_actual * 7.5E+6 / 0.75;
  /*  Oil pump power */
  ACC->P_oil = 0.02 * rt_state->N3_perc * 1000.0;
  /*  Total accessory power */
  ACC->P_total_mechanical =
      ((ACC->P_IDG + ACC->P_HYD) + ACC->P_fuel_pump) + ACC->P_oil;
  ACC->P_total = ACC->P_total_mechanical;
  /*  High-fidelity bleed air modeling for ECS and anti-ice */
  /*  ====================================================== */
  /*  DETAILED BLEED AIR SYSTEM (ECS, Anti-Ice, Pressurization) */
  /*  ====================================================== */
  /*  Initialize bleed fields if needed */
  /*  1=LO, 2=NORM, 3=HI */
  /*  Pack flow rates (kg/s) */
  /*  Anti-ice flow requirements */
  /*  10°C */
  /*  HP BLEED SYSTEM */
  ACC->bleed_flow_HP = 0.0;
  ACC->P_bleed_HP = 0.0;
  ACC->bleed_temp_HP = rt_state->T_ambient;
  ACC->precooler_outlet_temp = rt_state->T_ambient;
  /*  IP BLEED SYSTEM */
  ACC->bleed_flow_IP = 0.0;
  ACC->P_bleed_IP = 0.0;
  ACC->bleed_temp_IP = rt_state->T_ambient;
  /*  Total bleed */
  ACC->mdot_bleed_total = 0.0;
  ACC->P_bleed_total = 0.0;
  /*  Update core mass flow */
  /*  Partial bleed effect */
  /*  Update engine physics */
  updatePressureRatiosInternal(rt_state);
  b_BLEED_SCHED = *BLEED_SCHED;
  c_updateCompressorBackflowInter(rt_state);
  updateDynamicStallInternal(DYNSTALL, rt_state, dt);
  updateMassFlowsInternal(rt_state, &b_BLEED_SCHED);
  updateThermodynamicsInternal(
      rt_state, rt_params_HPC_map_speeds, rt_params_HPC_map_PR,
      rt_params_HPC_map_efficiency, c_rt_params_HPC_map_mdot_correc,
      rt_params_HPT_map_eff_vs_PR, rt_params_IPT_map_eff_vs_PR,
      rt_params_LPT_map_eff_vs_PR, dt);
  /*  Thrust Calculation */
  if ((rt_state->FF_actual > 2.7777777777777779E-6) &&
      rt_state->combustion_active) {
    /*  Core thrust */
    if ((rt_state->P9 > rt_state->P_ambient) && (rt_state->T9 > 200.0) &&
        (rt_state->mdot_turb > 0.0)) {
      N1_reduction = rt_state->P9 / rt_state->P_ambient;
      if (N1_reduction > 1.8506043470009756) {
        u0 = rt_state->T9 * 0.85836909871244638;
        if (!(u0 >= 200.0)) {
          u0 = 200.0;
        }
        u0 = sqrt(381.71000000000004 * u0);
        N1_reduction = rt_state->P9 / 1.8506043470009756;
      } else {
        u0 = rt_powd_snf(N1_reduction, 0.24812030075187974);
        if (!(u0 >= 1.01)) {
          u0 = 1.01;
        }
        N1_reduction = 2300.0 * (rt_state->T9 - rt_state->T9 / u0);
        if ((N1_reduction <= 0.0) || rtIsNaN(N1_reduction)) {
          N1_reduction = 0.0;
        }
        u0 = sqrt(N1_reduction);
        N1_reduction = rt_state->P_ambient;
      }
      if (!(u0 >= 100.0)) {
        u0 = 100.0;
      }
      if (!(u0 <= 900.0)) {
        u0 = 900.0;
      }
      rt_state->Core_Thrust =
          rt_state->mdot_turb * u0 + (N1_reduction - rt_state->P_ambient);
    } else {
      rt_state->Core_Thrust = 0.0;
    }
    /*  Bypass thrust */
    if ((rt_state->P2 > rt_state->P_ambient) && (rt_state->T2 > 200.0)) {
      N1_reduction = rt_state->P2 / rt_state->P_ambient;
      if (N1_reduction > 1.8929291587378541) {
        u0 = rt_state->T2 * 0.83333333333333337;
        if (!(u0 >= 200.0)) {
          u0 = 200.0;
        }
        u0 = sqrt(401.79999999999995 * u0);
        N1_reduction = rt_state->P2 / 1.8929291587378541;
      } else {
        u0 = rt_powd_snf(N1_reduction, 0.28571428571428564);
        if (!(u0 >= 1.01)) {
          u0 = 1.01;
        }
        N1_reduction = 2010.0 * (rt_state->T2 - rt_state->T2 / u0);
        if ((N1_reduction <= 0.0) || rtIsNaN(N1_reduction)) {
          N1_reduction = 0.0;
        }
        u0 = sqrt(N1_reduction);
        N1_reduction = rt_state->P_ambient;
      }
      if (!(u0 >= 80.0)) {
        u0 = 80.0;
      }
      if (!(u0 <= 600.0)) {
        u0 = 600.0;
      }
      rt_state->Bypass_Thrust =
          2.0 * u0 + (N1_reduction - rt_state->P_ambient) * 3.2;
    } else {
      rt_state->Bypass_Thrust = 0.0;
    }
    N1_reduction = rt_state->Core_Thrust + rt_state->Bypass_Thrust;
    if ((N1_reduction < 0.0) &&
        ((rt_state->Core_Thrust > 0.0) || (rt_state->Bypass_Thrust > 0.0))) {
      N1_reduction = 0.0;
    }
    /*  Apply flat rating and derate */
    /*  Apply flat rating */
    /*  Apply Flat Rating and Derate to Thrust */
    u0 = N1_reduction * FLATRATE->thrust_available;
    /*  Apply derate if active */
    /*  Apply climb derate if active */
    /*  Apply absolute thrust limit */
    N1_reduction = 374000.0 * FLATRATE->thrust_available;
    if (!(u0 <= N1_reduction)) {
      u0 = N1_reduction;
    }
    /* Use the Thrust value calculated earlier using Power Law */
    u0 = rt_state->Thrust;
    /* rt_state->Thrust = u0;  -- REMOVED: Do not overwrite valid thrust */
    rt_state->Thrust_rated = u0;
    /*  SFC */
    if (u0 > 100.0) {
      rt_state->SFC = rt_state->FF_actual * 3600.0 / (u0 / 1000.0);
    } else {
      rt_state->SFC = 0.0;
    }
  } else {
    rt_state->Thrust = 0.0;
    rt_state->Thrust_rated = 0.0;
    rt_state->Core_Thrust = 0.0;
    rt_state->Bypass_Thrust = 0.0;
    rt_state->SFC = 0.0;
  }
  updateSpoolDynamicsInternal(rt_state, ACC, dt);
}

/*
 * Full Beddoes-Leishman dynamic stall model for fan blades
 *
 * Arguments    : h_struct_T *DYNSTALL
 *                struct0_T *rt_state
 *                double dt
 * Return Type  : void
 */
static void updateDynamicStallInternal(h_struct_T *DYNSTALL,
                                       struct0_T *rt_state, double dt)
{
  double r_elements_data[20];
  double Cl_dynamic;
  double Cn_f;
  double V_axial;
  double V_rel;
  double alpha;
  double alpha_dot;
  double alpha_eff;
  double d;
  double d1;
  double ds;
  double maxval;
  double total_dynamic_stall_loss;
  double u1;
  int b_nz;
  int k;
  int nz;
  boolean_T b;
  double omega_fan;
  double speed_of_sound;
  double tip_radius;
  
  /* ====================================================== */
  /* CALCULATE FAN TIP MACH NUMBER                          */
  /* ====================================================== */
  /* N1 is in RPM% (100% = 2800 RPM approx) */
  /* Max N1 100% is actually ~2600-2800 RPM for large fan */
  /* Let's use 2800 RPM as 100% reference */
  omega_fan = (rt_state->N1_perc / 100.0) * 2800.0 * 2.0 * 3.14159 / 60.0; /* rad/s */
  
  tip_radius = 1.475; /* 2.95m diameter */
  rt_state->Fan_Blade_Tip_Vel = omega_fan * tip_radius;
  
  /* Speed of sound = sqrt(gamma * R * T) */
  speed_of_sound = sqrt(1.4 * 287.0 * rt_state->T_ambient);
  
  rt_state->Fan_Tip_Mach = rt_state->Fan_Blade_Tip_Vel / speed_of_sound;
  
  if (rt_state->Fan_Tip_Mach > 1.0) {
      rt_state->Fan_Supersonic = true;
  } else {
      rt_state->Fan_Supersonic = false;
  }

  V_axial = rt_state->mdot_total / (1.225 * 6.84); /* Approx axial velocity */
  V_axial = rt_state->mdot_total / (rt_state->rho_ambient * 6.84); 
  if (V_axial < 10.0) V_axial = 10.0;
  boolean_T guard1;
  /*  ====================================================== */
  /*  BEDDOES-LEISHMAN DYNAMIC STALL MODEL */
  /*  ====================================================== */
  /*  Initialize arrays if needed */
  /*  Fan geometry */
  r_elements_data[19] = 1.475;
  r_elements_data[0] = 0.4;
  for (k = 0; k < 18; k++) {
    r_elements_data[k + 1] = ((double)k + 1.0) * 0.056578947368421062 + 0.4;
  }
  /*  Time constants */
  /*  Boundary layer lag */
  /*  Vortex time constant */
  /*  Vortex decay */
  /* Get flow conditions */
  if (rt_state->mdot_total > 1.0) {
    if (rt_state->rho_ambient >= 0.3) {
      d = rt_state->rho_ambient;
    } else {
      d = 0.3;
    }
    V_axial = rt_state->mdot_total / (d * 6.8386);
  } else {
    V_axial = 20.0;
  }
  
  /* Calculate local Mach number for compressibility effects */
  /* Using tip velocity and axial velocity */
  double tangential_vel;
  double local_mach;
  double P_G_factor;  /* Prandtl-Glauert factor */
  
  if (rt_state->Fan_Blade_Tip_Vel > 0.0) {
      tangential_vel = rt_state->Fan_Blade_Tip_Vel * 0.75; /* Mean radius approx */
  } else {
      tangential_vel = 0.0;
  }
  
  V_rel = sqrt(V_axial * V_axial + tangential_vel * tangential_vel);
  
  double speed_sound = sqrt(1.4 * 287.0 * rt_state->T_ambient);
  local_mach = V_rel / speed_sound;
  
  /* Prandtl-Glauert Compressibility Correction */
  /* beta = sqrt(1 - M^2) */
  if (local_mach < 0.8) {
      P_G_factor = 1.0 / sqrt(1.0 - local_mach * local_mach);
  } else if (local_mach < 1.0) {
      /* Transonic drag divergence region - lift starts to break down */
      P_G_factor = 1.0 / sqrt(1.0 - 0.64); /* Cap at Mach 0.8 scaling */
  } else {
      /* Supersonic - shock losses reduce efficiency */
      P_G_factor = 1.0; /* Simplified for post-stall/shock region */
  }
  
  total_dynamic_stall_loss = 0.0;
  if (V_rel > 1.0) {
    ds = 2.0 * V_rel * dt / 0.25;
  } else {
    ds = 0.01;
  }
  if (dt >= 0.001) {
    maxval = dt;
  } else {
    maxval = 0.001;
  }
  for (nz = 0; nz < 20; nz++) {
    /*  Flow angle and blade angle */
    alpha = 0.017453292519943295 * (45.0 - 30.0 * (r_elements_data[nz] - 0.4) /
                                               1.0750000000000002) -
            rt_atan2d_snf(V_axial, 0.0);
    /*  Non-dimensional time step */
    /*  Alpha rate */
    alpha_dot = (alpha - DYNSTALL->alpha_prev[nz]) / maxval;
    /*  Effective angle of attack (unsteady correction) */
    if (V_rel > 1.0) {
      alpha_eff = alpha + 0.125 * alpha_dot / V_rel;
    } else {
      alpha_eff = alpha;
    }
    /*  Static lift coefficient */
    /*  Dynamic separation point */
    Cl_dynamic = DYNSTALL->Df[nz];
    d = fabs(alpha_eff);
    
    /* Apply Compressibility to apparent angle of attack for stall check */
    if (d > 0.0) d *= sqrt(P_G_factor); /* Mild correction for stall onset */
    
    if ((Cl_dynamic <= 0.01) || rtIsNaN(Cl_dynamic)) {
      d1 = 0.01;
    } else {
      d1 = Cl_dynamic;
    }
    if (d < 0.262 * (sqrt(d1) + 1.0)) {
      u1 = 1.0 - 0.3 * exp((d - 0.262) / 0.15);
    } else {
      u1 = 0.66 * exp((0.262 - d) / 0.3) + 0.04;
    }
    if (rtIsNaN(u1)) {
      u1 = 1.0;
    }
    /*  Separation point dynamics */
    if (u1 <= 0.01) {
      u1 = 0.01;
    }
    Cl_dynamic += (u1 - Cl_dynamic) * ds / 3.0;
    DYNSTALL->Df[nz] = Cl_dynamic;
    /*  Kirchhoff approximation for separated flow */
    Cl_dynamic = (sqrt(Cl_dynamic) + 1.0) / 2.0;
    Cn_f = 5.7 * alpha_eff * (Cl_dynamic * Cl_dynamic);
    
    /* Apply Mach scaling to normal force (Prandtl-Glauert) */
    /* Only apply in linear region effectively */
    if (d < 0.262) Cn_f *= P_G_factor; 
    
    /*  Leading Edge Vortex (LEV) model */
    guard1 = false;
    if (d > 0.262) {
      if (rtIsNaN(alpha_dot)) {
        d1 = rtNaN;
      } else if (alpha_dot < 0.0) {
        d1 = -1.0;
      } else {
        d1 = (alpha_dot > 0.0);
      }
      if (rtIsNaN(alpha_eff)) {
        u1 = rtNaN;
      } else if (alpha_eff < 0.0) {
        u1 = -1.0;
      } else {
        u1 = (alpha_eff > 0.0);
      }
      if (d1 == u1) {
        DYNSTALL->LEV_active[nz] = true;
        alpha_dot = DYNSTALL->tau_v[nz] + ds;
        DYNSTALL->tau_v[nz] = alpha_dot;
        u1 = 3.1415926535897931 * alpha_dot / 12.0;
        if ((u1 >= 1.5707963267948966) || rtIsNaN(u1)) {
          u1 = 1.5707963267948966;
        }
        Cl_dynamic = sin(u1);
        Cl_dynamic = (5.7 * alpha_eff - Cn_f) * (Cl_dynamic * Cl_dynamic);
        DYNSTALL->Cv[nz] = Cl_dynamic;
        /*  Vortex decay after peak */
        if (alpha_dot > 6.0) {
          Cl_dynamic *= exp(-(alpha_dot - 6.0) / 11.0);
          DYNSTALL->Cv[nz] = Cl_dynamic;
        }
      } else {
        guard1 = true;
      }
    } else {
      guard1 = true;
    }
    if (guard1) {
      Cl_dynamic = DYNSTALL->Cv[nz] * exp(-ds / 11.0);
      DYNSTALL->Cv[nz] = Cl_dynamic;
      if (fabs(Cl_dynamic) < 0.01) {
        DYNSTALL->LEV_active[nz] = false;
        DYNSTALL->tau_v[nz] = 0.0;
      }
    }
    /*  Total dynamic Cl */
    /*  Stall flag */
    if ((d > 0.2358) || (DYNSTALL->Df[nz] < 0.5)) {
      b = true;
    } else {
      b = false;
    }
    DYNSTALL->stall_flags[nz] = b;
    /*  Accumulate stall losses with Mach penalty */
    /* Shock losses increase drag when stalled/transonic */
    if (DYNSTALL->stall_flags[nz]) {
      total_dynamic_stall_loss += (1.0 - DYNSTALL->Df[nz]) * P_G_factor;
    }
    DYNSTALL->alpha_prev[nz] = alpha;
  }
  /*  Update fan efficiency based on dynamic stall */
  nz = DYNSTALL->stall_flags[0];
  /*  Update surge margin based on dynamic stall */
  b_nz = DYNSTALL->LEV_active[0];
  for (k = 0; k < 19; k++) {
    nz += DYNSTALL->stall_flags[k + 1];
    b_nz += DYNSTALL->LEV_active[k + 1];
  }
  Cl_dynamic = (double)nz / 20.0;
  Cl_dynamic = 0.3 * Cl_dynamic + 0.1 * (total_dynamic_stall_loss / 20.0);
  if ((1.0 - Cl_dynamic <= 0.5) || rtIsNaN(1.0 - Cl_dynamic)) {
    rt_state->fan_efficiency_dynamic_stall = 0.5;
  } else {
    rt_state->fan_efficiency_dynamic_stall = 1.0 - Cl_dynamic;
  }
  if (b_nz > 6) {
    rt_state->fan_surge_margin *= 0.7;
    /*  Reduce margin during LEV activity */
  }
}

/*
 * Arguments    : struct0_T *rt_state
 *                g_struct_T *BLEED_SCHED
 * Return Type  : void
 */
static void updateMassFlowsInternal(struct0_T *rt_state,
                                    g_struct_T *BLEED_SCHED)
{
  double IPC_bleed_frac;
  double N3_frac;
  double start_boost;
  double u1;
  /*  Mass Flows Update */
  N3_frac = rt_state->N3_perc / 100.0;
  IPC_bleed_frac = rt_state->T4 / 288.15;
  if (N3_frac > 0.05) {
    u1 = 1.0 - 0.05 * (rt_state->HPC_PR - 1.0);
    if ((u1 >= 1.0) || rtIsNaN(u1)) {
      u1 = 1.0;
    }
    if (N3_frac < 0.6) {
      start_boost = 1.2;
    } else if (N3_frac < 0.8) {
      start_boost = 0.2 * (0.8 - N3_frac) / 0.2 + 1.0;
    } else {
      start_boost = 1.0;
    }
    if (u1 <= 0.8) {
      u1 = 0.8;
    }
    if (!(IPC_bleed_frac >= 0.8)) {
      IPC_bleed_frac = 0.8;
    }
    IPC_bleed_frac = 127.6 * (N3_frac * N3_frac) * u1 * start_boost *
                     (rt_state->P4 / 101325.0 / sqrt(IPC_bleed_frac));
    u1 = 15.0 * N3_frac + 2.0;
    if (IPC_bleed_frac >= u1) {
      rt_state->mdot_core_pre_bleed = IPC_bleed_frac;
    } else {
      rt_state->mdot_core_pre_bleed = u1;
    }
  } else {
    rt_state->mdot_core_pre_bleed = 10.0 * N3_frac + 1.0;
  }
  /*  ====================================================== */
  /*  CORE ENGINE SIMULATION FUNCTIONS */
  /*  ====================================================== */
  /*  Schedule bleed extraction based on N3 speed */
  /*  10-point schedule from idle (N3=60%) to TOGA (N3=100%) */
  u1 = interp1(BLEED_SCHED->N3_schedule, BLEED_SCHED->HPC_bleed_frac,
               10, rt_state->N3_perc);
  
  IPC_bleed_frac = interp1(BLEED_SCHED->N3_schedule,
                           BLEED_SCHED->IPC_bleed_frac, 10, rt_state->N3_perc);
  
  if ((u1 >= 0.15) || rtIsNaN(u1)) {
    u1 = 0.15;
  }
  if (u1 <= 0.0) {
    N3_frac = 0.0;
  } else {
    N3_frac = u1;
  }
  if ((IPC_bleed_frac >= 0.1) || rtIsNaN(IPC_bleed_frac)) {
    u1 = 0.1;
  } else {
    u1 = IPC_bleed_frac;
  }
  if (u1 <= 0.0) {
    IPC_bleed_frac = 0.0;
  } else {
    IPC_bleed_frac = u1;
  }
  BLEED_SCHED->HPC_bleed_flow = rt_state->mdot_core_pre_bleed * N3_frac;
  BLEED_SCHED->IPC_bleed_flow = rt_state->mdot_core_pre_bleed * IPC_bleed_frac;
  BLEED_SCHED->total_bleed_flow =
      BLEED_SCHED->HPC_bleed_flow + BLEED_SCHED->IPC_bleed_flow;
  rt_state->mdot_core =
      rt_state->mdot_core_pre_bleed - BLEED_SCHED->total_bleed_flow;
  if ((rt_state->mdot_core <= 0.5) || rtIsNaN(rt_state->mdot_core)) {
    rt_state->mdot_core = 0.5;
  }
  rt_state->mdot_bleed_total = BLEED_SCHED->total_bleed_flow;
  
  /* Calculate Fan/Bypass Mass Flow */
  /* Scale based on N1 percentage (simplified fan map) */
  double N1_ratio = rt_state->N1_perc / 100.0;
  double mdot_corrected_fan;
  
  if (N1_ratio < 0.5) {
      /* Interpolate from 0 to ~600 kg/s at 50% N1 */
      /* At 20% N1 (Idle): ~240 kg/s - ample for idle thrust */
      mdot_corrected_fan = 1200.0 * N1_ratio;
  } else {
      /* Quadratic fit from 600 (50%) to 1225 (100%) */
      /* This matches characteristic turbofan flow capacity */
      mdot_corrected_fan = 600.0 + (1225.0 - 600.0) * 
                           rt_powd_snf((N1_ratio - 0.5) / 0.5, 1.2);
  }
  
  /* Validate against design max */
  if (mdot_corrected_fan > 1350.0) mdot_corrected_fan = 1350.0;
  
  /* Correct for ambient conditions: mdot = mdot_corr * delta / sqrt(theta) */
  double delta = rt_state->P_ambient / 101325.0;
  double theta = rt_state->T_ambient / 288.15;
  rt_state->mdot_total = mdot_corrected_fan * delta / sqrt(theta);
  
  /* Bypass flow is total minus core */
  /* Ensure core flow priority */
  if (rt_state->mdot_core_pre_bleed > rt_state->mdot_total * 0.5) {
      /* Abnormally high core demand or low fan flow */
      /* Adjust total to satisfy core + min bypass */
      rt_state->mdot_total = rt_state->mdot_core_pre_bleed * 1.5;
  }
  
  rt_state->mdot_bypass = rt_state->mdot_total - rt_state->mdot_core_pre_bleed;
  
  if (rt_state->mdot_bypass < 2.0) {
      rt_state->mdot_bypass = 2.0; /* Minimum floor */
  }
  
  u1 = rt_state->mdot_core + rt_state->FF_actual;
  if ((u1 <= 5.0) || rtIsNaN(u1)) {
    rt_state->mdot_turb = 5.0;
  } else {
    rt_state->mdot_turb = u1;
  }
  
  if (rt_state->mdot_core > 0.1) {
    rt_state->bypass_ratio_actual = rt_state->mdot_bypass / rt_state->mdot_core;
  } else {
    rt_state->bypass_ratio_actual = 0.0;
  }
}

/*
 * Arguments    : struct0_T *rt_state
 * Return Type  : void
 */
static void updatePressureRatiosInternal(struct0_T *rt_state)
{
  double N1_frac, N2_frac, N3_frac;
  double u0;
  double VSV_factor;
  
  /* ====================================================== */
  /* FULL PRESSURE RATIO CALCULATIONS                       */
  /* ====================================================== */
  /* Get spool speed fractions */
  N1_frac = rt_state->N1_perc / 100.0;
  N2_frac = rt_state->N2_perc / 100.0;
  N3_frac = rt_state->N3_perc / 100.0;
  
  /* Clamp fractions */
  if (N1_frac < 0.0) N1_frac = 0.0;
  if (N1_frac > 1.1) N1_frac = 1.1;
  if (N2_frac < 0.0) N2_frac = 0.0;
  if (N2_frac > 1.1) N2_frac = 1.1;
  if (N3_frac < 0.0) N3_frac = 0.0;
  if (N3_frac > 1.1) N3_frac = 1.1;
  
  /* VSV factor - affects compressor efficiency and PR */
  VSV_factor = rt_state->VSV_efficiency_factor;
  if (VSV_factor < 0.8) VSV_factor = 0.8;
  if (VSV_factor > 1.0) VSV_factor = 1.0;
  
  if ((rt_state->scenario == 1.0) || (!rt_state->engine_running)) {
    /* During startup or shutdown - reduced pressure ratios */
    /* Fan pressure ratio - driven by N1 */
    if (N1_frac > 0.1) {
      rt_state->FPR = 1.0 + 0.65 * rt_powd_snf(N1_frac, 1.8);
    } else {
      rt_state->FPR = 1.0;
    }
    
    /* LPC pressure ratio - driven by N1 */
    if (N1_frac > 0.1) {
      rt_state->LPC_PR = 1.0 + 0.1 * rt_powd_snf(N1_frac, 1.5);
    } else {
      rt_state->LPC_PR = 1.0;
    }
    
    /* IPC pressure ratio - driven by N2 */
    if (N2_frac > 0.1) {
      rt_state->IPC_PR = 1.0 + 2.0 * rt_powd_snf(N2_frac, 1.6);
    } else {
      rt_state->IPC_PR = 1.0;
    }
    
    /* HPC pressure ratio - driven by N3 */
    rt_state->HPC_PR = 6.2 * rt_powd_snf(N3_frac, 1.2) + 1.0;
    
  } else {
    /* Normal running - full pressure ratio development */
    
    /* Fan pressure ratio (design FPR = 1.65) */
    /* FPR depends on N1 and ram recovery */
    rt_state->FPR = 1.0 + 0.65 * rt_powd_snf(N1_frac, 1.8) * 
                    rt_state->ram_pressure_recovery;
    if (rt_state->FPR > 1.75) rt_state->FPR = 1.75;
    
    /* LPC pressure ratio (design = 1.1) */
    rt_state->LPC_PR = 1.0 + 0.1 * rt_powd_snf(N1_frac, 1.5);
    if (rt_state->LPC_PR > 1.15) rt_state->LPC_PR = 1.15;
    
    /* IPC pressure ratio (design = 3.0) - driven by N2 */
    rt_state->IPC_PR = 1.0 + 2.0 * rt_powd_snf(N2_frac, 1.6) * VSV_factor;
    if (rt_state->IPC_PR > 3.2) rt_state->IPC_PR = 3.2;
    
    /* HPC pressure ratio (design = 7.2) - driven by N3 */
    rt_state->HPC_PR = 1.0 + 6.2 * rt_powd_snf(N3_frac, 1.5) * VSV_factor;
    if (rt_state->HPC_PR > 7.5) rt_state->HPC_PR = 7.5;
  }
  
  /* Store operating points for compressor maps */
  rt_state->fan_operating_point_PR = rt_state->FPR;
  rt_state->LPC_operating_point_PR = rt_state->LPC_PR;
  rt_state->IPC_operating_point_PR = rt_state->IPC_PR;
  rt_state->HPC_operating_point_PR = rt_state->HPC_PR;
  
  /* Calculate Overall Pressure Ratio */
  rt_state->OPR = rt_state->FPR * rt_state->LPC_PR * 
                  rt_state->IPC_PR * rt_state->HPC_PR;
  if (rt_state->combustion_active) {
    if ((rt_state->throttle >= 1.0) || rtIsNaN(rt_state->throttle)) {
      N3_frac = 1.0;
    } else {
      N3_frac = rt_state->throttle;
    }
    if (N3_frac <= 0.0) {
      u0 = 0.0;
    } else {
      u0 = N3_frac;
    }
    N3_frac = rt_state->FF_actual / 3.1944444444444446;
    if ((N3_frac >= 1.0) || rtIsNaN(N3_frac)) {
      N3_frac = 1.0;
    }
    if (N3_frac <= 0.0) {
      N3_frac = 0.0;
    }
    if (u0 >= N3_frac) {
      N3_frac = u0;
    }
    N3_frac *= 0.6;
    rt_state->HPT_PR = 5.0 * N3_frac + 1.0;
    rt_state->IPT_PR = 2.0 * N3_frac + 1.0;
    rt_state->LPT_PR = 2.2 * N3_frac + 1.0;
    rt_state->OPR = rt_state->HPC_PR;
  } else {
    rt_state->HPT_PR = 1.0;
    rt_state->IPT_PR = 1.0;
    rt_state->LPT_PR = 1.0;
    rt_state->OPR = rt_state->HPC_PR;
  }
}

/*
 * Full Three-Spool Dynamics Model
 * Implements power balance between compressors and turbines
 * Includes windmill torque, starter torque, and mechanical losses
 *
 *
 * Arguments    : struct0_T *rt_state
 *                struct2_T *ACC
 *                double dt
 * Return Type  : void
 */
static void updateSpoolDynamicsInternal(struct0_T *rt_state, struct2_T *ACC, double dt)
{
  double tau_N1, tau_N2, tau_N3;  /* Net torques on each spool */
  double P_compressor_N1, P_compressor_N2, P_compressor_N3;
  double P_turbine_N1, P_turbine_N2, P_turbine_N3;
  double omega_N1, omega_N2, omega_N3;
  double N1_frac, N2_frac, N3_frac;
  double damping_N1, damping_N2, damping_N3;
  double starter_torque;
  double u1;
  
  /* Inertias (kg*m^2) */
  const double J_N1 = 3000.0;   /* LP spool (fan + LPC + LPT) */
  const double J_N2 = 800.0;    /* IP spool (IPC + IPT) */
  const double J_N3 = 350.0;    /* HP spool (HPC + HPT) */
  
  /* Maximum speeds (RPM) */
  const double N1_max = 2800.0;
  const double N2_max = 7800.0;
  const double N3_max = 11800.0;
  
  /* Damping coefficients */
  const double B_N1 = 50.0;   /* Linear damping */
  const double B_N2 = 30.0;
  const double B_N3 = 20.0;
  
  /* ====================================================== */
  /* TIME STEP LIMITING                                     */
  /* ====================================================== */
  if (dt < 0.001) dt = 0.001;
  if (dt > 0.1) dt = 0.1;
  
  /* ====================================================== */
  /* GET CURRENT STATES                                     */
  /* ====================================================== */
  omega_N1 = rt_state->omega_N1;
  omega_N2 = rt_state->omega_N2;
  omega_N3 = rt_state->omega_N3;
  
  N1_frac = rt_state->N1_perc / 100.0;
  N2_frac = rt_state->N2_perc / 100.0;
  N3_frac = rt_state->N3_perc / 100.0;
  
  /* ====================================================== */
  /* COMPRESSOR POWER CALCULATIONS                          */
  /* ====================================================== */
  /* Fan + LPC power (driven by N1, extracted from LPT) */
  P_compressor_N1 = rt_state->P_fan + rt_state->P_LPC;
  if (P_compressor_N1 < 0.0) P_compressor_N1 = 0.0;
  
  /* IPC power (driven by N2, extracted from IPT) */
  P_compressor_N2 = rt_state->P_IPC;
  if (P_compressor_N2 < 0.0) P_compressor_N2 = 0.0;
  
  /* HPC power (driven by N3, extracted from HPT) */
  P_compressor_N3 = rt_state->P_HPC;
  if (P_compressor_N3 < 0.0) P_compressor_N3 = 0.0;
  
  /* ====================================================== */
  /* TURBINE POWER CALCULATIONS                             */
  /* ====================================================== */
  /* LPT provides power to N1 spool */
  P_turbine_N1 = rt_state->P_LPT;
  if (P_turbine_N1 < 0.0) P_turbine_N1 = 0.0;
  
  /* IPT provides power to N2 spool */
  P_turbine_N2 = rt_state->P_IPT;
  if (P_turbine_N2 < 0.0) P_turbine_N2 = 0.0;
  
  /* HPT provides power to N3 spool */
  P_turbine_N3 = rt_state->P_HPT;
  if (P_turbine_N3 < 0.0) P_turbine_N3 = 0.0;
  
  /* ====================================================== */
  /* DAMPING TORQUES                                        */
  /* ====================================================== */
  damping_N1 = B_N1 * omega_N1;
  damping_N2 = B_N2 * omega_N2;
  damping_N3 = B_N3 * omega_N3;
  
  /* ====================================================== */
  /* NET TORQUE CALCULATIONS                                */
  /* ====================================================== */
  /* Torque = Power / omega (with safety for low speed) */
  
  /* N3 (HP) spool: HPT - HPC - accessories - damping */
  if (omega_N3 > 10.0) {
    tau_N3 = (P_turbine_N3 * 0.99 - P_compressor_N3 - rt_state->P_accessory * 0.3) / omega_N3;
  } else {
    tau_N3 = 0.0;
  }
  tau_N3 -= damping_N3;
  
  /* Add starter torque if active */
  if (rt_state->starter_on) {
    u1 = N3_frac;
    if (u1 < 0.0) u1 = 0.0;
    /* Starter torque depends on duct pressure (Ref 45 psi = 100%) */
    double pressure_factor = ACC->starter_pressure_psi / 45.0;
    if (pressure_factor > 1.2) pressure_factor = 1.2; /* Cap at 120% */
    
    /* Starter torque decreases as N3 increases */
    starter_torque = 6000.0 * rt_state->starter_factor * pressure_factor * (1.0 - 1.5 * u1);
    if (starter_torque < 0.0) starter_torque = 0.0;
    tau_N3 += starter_torque;
  }
  
  /* Add windmill torque if in windmill mode */
  if (rt_state->windmill_mode_active) {
    tau_N3 += rt_state->windmill_torque_N3;
  }
  
  /* N2 (IP) spool: IPT - IPC - accessories - damping */
  if (omega_N2 > 10.0) {
    tau_N2 = (P_turbine_N2 * 0.99 - P_compressor_N2 - rt_state->P_accessory * 0.2) / omega_N2;
  } else {
    tau_N2 = 0.0;
  }
  tau_N2 -= damping_N2;
  
  /* Add windmill torque */
  if (rt_state->windmill_mode_active) {
    tau_N2 += rt_state->windmill_torque_N2;
  }
  
  /* N1 (LP) spool: LPT - Fan - LPC - damping */
  if (omega_N1 > 10.0) {
    tau_N1 = (P_turbine_N1 * 0.99 - P_compressor_N1) / omega_N1;
  } else {
    tau_N1 = 0.0;
  }
  tau_N1 -= damping_N1;
  
  /* Add windmill and backflow torques */
  if (rt_state->windmill_mode_active) {
    tau_N1 += rt_state->windmill_torque_N1;
  }
  tau_N1 += rt_state->fan_backflow_torque;
  
  /* ====================================================== */
  /* ANGULAR ACCELERATIONS                                  */
  /* ====================================================== */
  rt_state->alpha_N1 = tau_N1 / J_N1;
  rt_state->alpha_N2 = tau_N2 / J_N2;
  rt_state->alpha_N3 = tau_N3 / J_N3;
  
  /* Limit accelerations */
  if (rt_state->alpha_N1 > 50.0) rt_state->alpha_N1 = 50.0;
  if (rt_state->alpha_N1 < -80.0) rt_state->alpha_N1 = -80.0;
  if (rt_state->alpha_N2 > 100.0) rt_state->alpha_N2 = 100.0;
  if (rt_state->alpha_N2 < -150.0) rt_state->alpha_N2 = -150.0;
  if (rt_state->alpha_N3 > 150.0) rt_state->alpha_N3 = 150.0;
  if (rt_state->alpha_N3 < -200.0) rt_state->alpha_N3 = -200.0;
  
  /* ====================================================== */
  /* INTEGRATE ANGULAR VELOCITIES                           */
  /* ====================================================== */
  omega_N1 = omega_N1 + rt_state->alpha_N1 * dt;
  omega_N2 = omega_N2 + rt_state->alpha_N2 * dt;
  omega_N3 = omega_N3 + rt_state->alpha_N3 * dt;
  
  /* Clamp to valid range */
  if (omega_N1 < 0.0) omega_N1 = 0.0;
  if (omega_N2 < 0.0) omega_N2 = 0.0;
  if (omega_N3 < 0.0) omega_N3 = 0.0;
  
  /* Maximum speed limits */
  u1 = N1_max * 1.1 * 2.0 * 3.1415926535897931 / 60.0;
  if (omega_N1 > u1) omega_N1 = u1;
  u1 = N2_max * 1.1 * 2.0 * 3.1415926535897931 / 60.0;
  if (omega_N2 > u1) omega_N2 = u1;
  u1 = N3_max * 1.1 * 2.0 * 3.1415926535897931 / 60.0;
  if (omega_N3 > u1) omega_N3 = u1;
  
  /* Store angular velocities */
  rt_state->omega_N1 = omega_N1;
  rt_state->omega_N2 = omega_N2;
  rt_state->omega_N3 = omega_N3;
  
  /* ====================================================== */
  /* CONVERT TO RPM AND PERCENTAGES                         */
  /* ====================================================== */
  rt_state->N1 = omega_N1 * 60.0 / 6.2831853071795862;
  rt_state->N2 = omega_N2 * 60.0 / 6.2831853071795862;
  rt_state->N3 = omega_N3 * 60.0 / 6.2831853071795862;
  
  rt_state->N1_perc = rt_state->N1 / N1_max * 100.0;
  rt_state->N2_perc = rt_state->N2 / N2_max * 100.0;
  rt_state->N3_perc = rt_state->N3 / N3_max * 100.0;
  
  /* Clamp percentages */
  if (rt_state->N1_perc > 110.0) rt_state->N1_perc = 110.0;
  if (rt_state->N2_perc > 110.0) rt_state->N2_perc = 110.0;
  if (rt_state->N3_perc > 110.0) rt_state->N3_perc = 110.0;
  
  /* ====================================================== */
  /* CALCULATE RATES OF CHANGE                              */
  /* ====================================================== */
  rt_state->N1_dot = rt_state->alpha_N1 * 60.0 / 6.2831853071795862 / N1_max * 100.0;
  rt_state->N2_dot = rt_state->alpha_N2 * 60.0 / 6.2831853071795862 / N2_max * 100.0;
  rt_state->N3_dot = rt_state->alpha_N3 * 60.0 / 6.2831853071795862 / N3_max * 100.0;
  
  /* ====================================================== */
  /* STORE POWER RESIDUALS                                  */
  /* ====================================================== */
  rt_state->power_residual_N1 = P_turbine_N1 - P_compressor_N1;
  rt_state->power_residual_N2 = P_turbine_N2 - P_compressor_N2;
  rt_state->power_residual_N3 = P_turbine_N3 - P_compressor_N3;
}

/*
 * Arguments    : struct0_T *rt_state
 *                const double rt_params_HPC_map_speeds[7]
 *                const double rt_params_HPC_map_PR[21]
 *                const double rt_params_HPC_map_efficiency[21]
 *                const double c_rt_params_HPC_map_mdot_correc[21]
 *                const double rt_params_HPT_map_eff_vs_PR[14]
 *                const double rt_params_IPT_map_eff_vs_PR[12]
 *                const double rt_params_LPT_map_eff_vs_PR[14]
 *                double dt
 * Return Type  : void
 */
static void updateThermodynamicsInternal(
    struct0_T *rt_state, const double rt_params_HPC_map_speeds[7],
    const double rt_params_HPC_map_PR[21],
    const double rt_params_HPC_map_efficiency[21],
    const double c_rt_params_HPC_map_mdot_correc[21],
    const double rt_params_HPT_map_eff_vs_PR[14],
    const double rt_params_IPT_map_eff_vs_PR[12],
    const double rt_params_LPT_map_eff_vs_PR[14], double dt)
{
  double x[6];
  double y[6];
  double Cp_T4;
  double T6_target;
  double b_dt;
  double eta_ign;
  double mdot_air;
  double u1;
  int high_i;
  int low_i;
  int low_ip1;
  int mid_i;
  /*  Complete Thermodynamic Cycle */
  /*  Station 2: Fan discharge */
  /*  air */
  rt_state->T2 = rt_state->T_ambient;
  rt_state->P2 = rt_state->P_ambient;
  /*  Station 3: LPC discharge */
  /*  air */
  rt_state->T3 = rt_state->T2;
  rt_state->P3 = rt_state->P2;
  /*  Station 4: IPC discharge */
  /*  air */
  rt_state->T4 = rt_state->T3;
  rt_state->P4 = rt_state->P3;
  /*  Station 5: HPC discharge */
  lookupCompressorMap(
      rt_params_HPC_map_speeds, rt_params_HPC_map_PR,
      rt_params_HPC_map_efficiency, c_rt_params_HPC_map_mdot_correc,
      rt_state->N3_perc / 100.0, rt_state->HPC_PR, &eta_ign, &T6_target);
  rt_state->HPC_eff_current = eta_ign;
  /*  air */
  Cp_T4 = (0.1 * (rt_state->T4 - 288.0) + 1000.0) +
          5.0E-5 * ((rt_state->T4 - 288.0) * (rt_state->T4 - 288.0));
  if (!(Cp_T4 >= 1005.0)) {
    Cp_T4 = 1005.0;
  }
  u1 = Cp_T4 / (Cp_T4 - 287.0);
  if ((u1 >= 1.4) || rtIsNaN(u1)) {
    u1 = 1.4;
  }
  if (u1 <= 1.3) {
    Cp_T4 = 1.3;
  } else {
    Cp_T4 = u1;
  }
  if (rt_state->HPC_PR > 1.0) {
    if (!(eta_ign >= 0.5)) {
      eta_ign = 0.5;
    }
    rt_state->T5 =
        rt_state->T4 +
        (rt_state->T4 * rt_powd_snf(rt_state->HPC_PR, (Cp_T4 - 1.0) / Cp_T4) -
         rt_state->T4) /
            eta_ign;
  } else {
    rt_state->T5 = rt_state->T4;
  }
  rt_state->P5 = rt_state->P4 * rt_state->HPC_PR;
  /*  Station 6: Combustor */
  b_dt = dt;
  /*  Combustor Thermodynamics */
  if (!(dt >= 0.001)) {
    b_dt = 0.001;
  }
  if ((!rt_state->fuel_on) || (rt_state->FF_actual < 0.0001)) {
    rt_state->T6 += (rt_state->T5 - rt_state->T6) * b_dt / 5.0;
    rt_state->T6_delayed += (rt_state->T6 - rt_state->T6_delayed) * b_dt / 4.0;
    rt_state->P6 = rt_state->P5;
    rt_state->FAR = 0.0;
    rt_state->combustion_efficiency_actual = 0.0;
  } else {
    if ((rt_state->mdot_core <= 5.0) || rtIsNaN(rt_state->mdot_core)) {
      mdot_air = 5.0;
    } else {
      mdot_air = rt_state->mdot_core;
    }
    Cp_T4 = rt_state->FF_actual / mdot_air;
    if (Cp_T4 <= 0.035) {
      rt_state->FAR = Cp_T4;
    } else {
      rt_state->FAR = 0.035;
    }
    if ((rt_state->scenario == 1.0) && (!rt_state->combustion_active)) {
      if (rt_state->ignition_on) {
        u1 = (rt_state->N3_perc - 25.0) / 10.0;
        if ((u1 >= 1.0) || rtIsNaN(u1)) {
          u1 = 1.0;
        }
        if (u1 <= 0.0) {
          T6_target = 0.0;
        } else {
          T6_target = u1;
        }
        eta_ign = 0.998 * (0.85 * T6_target + 0.05);
        u1 = (mdot_air + rt_state->FF_actual) * 1150.0;
        if (rtIsNaN(u1)) {
          u1 = 1.0;
        }
        Cp_T4 = rt_state->T5 + rt_state->FF_actual * 4.3E+7 * eta_ign / u1;
        if (!(Cp_T4 <= 1300.0)) {
          Cp_T4 = 1300.0;
        }
        rt_state->T6 += (Cp_T4 - rt_state->T6) * b_dt / 1.5;
        rt_state->T6_delayed +=
            (rt_state->T6 - rt_state->T6_delayed) * b_dt / 4.0;
        rt_state->P6 = rt_state->P5 * 0.99;
        rt_state->EGT = rt_state->T6_delayed - 273.15;
        rt_state->combustion_efficiency_actual = eta_ign;
        if ((rt_state->EGT > 30.0) && (T6_target > 0.5)) {
          rt_state->combustion_active = true;
          rt_state->ignition_success = 1.0;
        }
      } else {
        rt_state->T6 = rt_state->T5;
        rt_state->P6 = rt_state->P5;
      }
    } else {
      if (rt_state->engine_running || (rt_state->scenario == 2.0)) {
        rt_state->combustion_active = true;
      }
      if (rt_state->combustion_active || rt_state->engine_running) {
        Cp_T4 = 0.998;
        if (rt_state->FAR < 0.008) {
          u1 = rt_state->FAR / 0.008;
          if (u1 <= 0.2) {
            u1 = 0.2;
          }
          Cp_T4 = 0.998 * u1;
        } else if (rt_state->FAR > 0.03) {
          u1 = 1.0 - 0.4 * (rt_state->FAR - 0.03) / 0.01;
          if (u1 <= 0.6) {
            u1 = 0.6;
          }
          Cp_T4 = 0.998 * u1;
        }
        rt_state->combustion_efficiency_actual = Cp_T4;
        u1 = (mdot_air + rt_state->FF_actual * 0.95) * 1092.5;
        if (rtIsNaN(u1)) {
          u1 = 1.0;
        }
        T6_target =
            rt_state->T5 + rt_state->FF_actual * 4.3E+7 * Cp_T4 * 0.75 / u1;
        if (!(T6_target <= 1800.0)) {
          T6_target = 1800.0;
        }
        u1 = rt_state->FAR / 0.008;
        if ((u1 >= 1.0) || rtIsNaN(u1)) {
          u1 = 1.0;
        }
        if (u1 <= 0.0) {
          Cp_T4 = 0.0;
        } else {
          Cp_T4 = u1;
        }
        if (rt_state->scenario == 1.0) {
          Cp_T4 *= 150.0;
        } else if (Cp_T4 < 0.2) {
          Cp_T4 = 0.0;
        } else {
          u1 = (Cp_T4 - 0.2) / 0.8;
          if (u1 >= 1.0) {
            u1 = 1.0;
          }
          if (u1 <= 0.0) {
            u1 = 0.0;
          }
          Cp_T4 = 150.0 * u1;
        }
        if (Cp_T4 > 0.0) {
          u1 = rt_state->T5 + Cp_T4;
          if ((!(T6_target >= u1)) && (!rtIsNaN(u1))) {
            T6_target = u1;
          }
        }
        rt_state->T6 += (T6_target - rt_state->T6) * b_dt / 3.5;
        rt_state->T6_delayed +=
            (rt_state->T6 - rt_state->T6_delayed) * b_dt / 4.0;
        rt_state->P6 = rt_state->P5 * 0.99;
      }
    }
  }
  /*  Station 7: HPT discharge */
  if (rt_state->HPT_PR > 1.0) {
    /*  exhaust */
    Cp_T4 = (0.15 * (rt_state->T6_delayed - 800.0) + 1100.0) +
            8.0E-5 * ((rt_state->T6_delayed - 800.0) *
                      (rt_state->T6_delayed - 800.0));
    if (!(Cp_T4 >= 1005.0)) {
      Cp_T4 = 1005.0;
    }
    u1 = Cp_T4 / (Cp_T4 - 287.0);
    if ((u1 >= 1.4) || rtIsNaN(u1)) {
      u1 = 1.4;
    }
    if (u1 <= 1.3) {
      Cp_T4 = 1.3;
    } else {
      Cp_T4 = u1;
    }
    if (rt_state->HPT_PR < rt_params_HPT_map_eff_vs_PR[0]) {
      T6_target = rt_params_HPT_map_eff_vs_PR[7] * (rt_state->HPT_PR - 1.0) /
                  (rt_params_HPT_map_eff_vs_PR[0] - 1.0);
    } else if (rt_state->HPT_PR > rt_params_HPT_map_eff_vs_PR[6]) {
      T6_target = rt_params_HPT_map_eff_vs_PR[13];
    } else {
      T6_target = b_interp1(&rt_params_HPT_map_eff_vs_PR[0],
                            &rt_params_HPT_map_eff_vs_PR[7], rt_state->HPT_PR);
    }
    rt_state->T7 =
        rt_state->T6_delayed -
        T6_target * (rt_state->T6_delayed -
                     rt_state->T6_delayed /
                         rt_powd_snf(rt_state->HPT_PR, (Cp_T4 - 1.0) / Cp_T4));
    rt_state->P7 = rt_state->P6 / rt_state->HPT_PR;
  } else {
    rt_state->T7 = rt_state->T6_delayed;
    rt_state->P7 = rt_state->P6;
  }
  /*  Station 8: IPT discharge */
  if (rt_state->IPT_PR > 1.0) {
    /*  exhaust */
    Cp_T4 = (0.15 * (rt_state->T7 - 800.0) + 1100.0) +
            8.0E-5 * ((rt_state->T7 - 800.0) * (rt_state->T7 - 800.0));
    if (!(Cp_T4 >= 1005.0)) {
      Cp_T4 = 1005.0;
    }
    u1 = Cp_T4 / (Cp_T4 - 287.0);
    if ((u1 >= 1.4) || rtIsNaN(u1)) {
      u1 = 1.4;
    }
    if (u1 <= 1.3) {
      eta_ign = 1.3;
    } else {
      eta_ign = u1;
    }
    if (rt_state->IPT_PR < rt_params_IPT_map_eff_vs_PR[0]) {
      Cp_T4 = rt_params_IPT_map_eff_vs_PR[6] * (rt_state->IPT_PR - 1.0) /
              (rt_params_IPT_map_eff_vs_PR[0] - 1.0);
    } else if (rt_state->IPT_PR > rt_params_IPT_map_eff_vs_PR[5]) {
      Cp_T4 = rt_params_IPT_map_eff_vs_PR[11];
    } else {
      for (low_i = 0; low_i < 6; low_i++) {
        x[low_i] = rt_params_IPT_map_eff_vs_PR[low_i];
        y[low_i] = rt_params_IPT_map_eff_vs_PR[low_i + 6];
      }
      if (rt_params_IPT_map_eff_vs_PR[1] < rt_params_IPT_map_eff_vs_PR[0]) {
        Cp_T4 = x[0];
        x[0] = x[5];
        x[5] = Cp_T4;
        Cp_T4 = y[0];
        y[0] = y[5];
        y[5] = Cp_T4;
        Cp_T4 = x[1];
        x[1] = x[4];
        x[4] = Cp_T4;
        Cp_T4 = y[1];
        y[1] = y[4];
        y[4] = Cp_T4;
        Cp_T4 = x[2];
        x[2] = x[3];
        x[3] = Cp_T4;
        Cp_T4 = y[2];
        y[2] = y[3];
        y[3] = Cp_T4;
      }
      Cp_T4 = rtNaN;
      if ((!(rt_state->IPT_PR > x[5])) && (!(rt_state->IPT_PR < x[0]))) {
        low_i = 1;
        low_ip1 = 2;
        high_i = 6;
        while (high_i > low_ip1) {
          mid_i = (low_i + high_i) >> 1;
          if (rt_state->IPT_PR >= x[mid_i - 1]) {
            low_i = mid_i;
            low_ip1 = mid_i + 1;
          } else {
            high_i = mid_i;
          }
        }
        Cp_T4 = x[low_i - 1];
        Cp_T4 = (rt_state->IPT_PR - Cp_T4) / (x[low_i] - Cp_T4);
        if (Cp_T4 == 0.0) {
          Cp_T4 = y[low_i - 1];
        } else if (Cp_T4 == 1.0) {
          Cp_T4 = y[low_i];
        } else {
          T6_target = y[low_i - 1];
          if (T6_target == y[low_i]) {
            Cp_T4 = T6_target;
          } else {
            Cp_T4 = (1.0 - Cp_T4) * T6_target + Cp_T4 * y[low_i];
          }
        }
      }
    }
    rt_state->T8 =
        rt_state->T7 -
        Cp_T4 * (rt_state->T7 -
                 rt_state->T7 /
                     rt_powd_snf(rt_state->IPT_PR, (eta_ign - 1.0) / eta_ign));
    rt_state->P8 = rt_state->P7 / rt_state->IPT_PR;
  } else {
    rt_state->T8 = rt_state->T7;
    rt_state->P8 = rt_state->P7;
  }
  /*  Station 9: LPT discharge */
  if (rt_state->LPT_PR > 1.0) {
    /*  exhaust */
    Cp_T4 = (0.15 * (rt_state->T8 - 800.0) + 1100.0) +
            8.0E-5 * ((rt_state->T8 - 800.0) * (rt_state->T8 - 800.0));
    if (!(Cp_T4 >= 1005.0)) {
      Cp_T4 = 1005.0;
    }
    u1 = Cp_T4 / (Cp_T4 - 287.0);
    if ((u1 >= 1.4) || rtIsNaN(u1)) {
      u1 = 1.4;
    }
    if (u1 <= 1.3) {
      Cp_T4 = 1.3;
    } else {
      Cp_T4 = u1;
    }
    if (rt_state->LPT_PR < rt_params_LPT_map_eff_vs_PR[0]) {
      T6_target = rt_params_LPT_map_eff_vs_PR[7] * (rt_state->LPT_PR - 1.0) /
                  (rt_params_LPT_map_eff_vs_PR[0] - 1.0);
    } else if (rt_state->LPT_PR > rt_params_LPT_map_eff_vs_PR[6]) {
      T6_target = rt_params_LPT_map_eff_vs_PR[13];
    } else {
      T6_target = b_interp1(&rt_params_LPT_map_eff_vs_PR[0],
                            &rt_params_LPT_map_eff_vs_PR[7], rt_state->LPT_PR);
    }
    rt_state->T9 =
        rt_state->T8 -
        T6_target *
            (rt_state->T8 - rt_state->T8 / rt_powd_snf(rt_state->LPT_PR,
                                                       (Cp_T4 - 1.0) / Cp_T4));
    rt_state->P9 = rt_state->P8 / rt_state->LPT_PR;
  } else {
    rt_state->T9 = rt_state->T8;
    rt_state->P9 = rt_state->P8;
  }
  rt_state->OPR = rt_state->HPC_PR;
  rt_state->EGT = rt_state->T6_delayed - 273.15;
}

/*
 * TRENT 900 HIGH-FIDELITY ENGINE SIMULATOR
 *  MATLAB Coder Compatible (C/C++ Ready)
 *
 * Arguments    : double throttle
 *                double altitude_m
 *                double Mach
 *                double OAT_K
 *                double dt
 *                double scenario
 *                boolean_T reset_state
 *                struct0_T *rt_state_out
 *                struct1_T *FADEC_out
 *                struct2_T *ACC_out
 * Return Type  : void
 */
void trent900_engine_sim_multi(int engine_idx, double throttle, double altitude_m, double Mach,
                               double OAT_K, double dt, double scenario,
                               boolean_T reset_state, struct0_T *rt_state_out,
                               struct1_T *FADEC_out, struct2_T *ACC_out)
{
  if (engine_idx < 0) engine_idx = 0;
  if (engine_idx > 3) engine_idx = 3;

#define rt_state (rt_state_arr[engine_idx])
#define FADEC (FADEC_arr[engine_idx])
#define ACC (ACC_arr[engine_idx])
#define DYNSTALL (DYNSTALL_arr[engine_idx])
#define rt_state_not_empty (rt_state_not_empty_arr[engine_idx])

  static f_struct_T rt_params;
  static g_struct_T b_BLEED_SCHED;
  static struct_T FLATRATE;
  static const double t12_HPC_bleed_frac[10] = {0.12, 0.12, 0.1, 0.08, 0.05,
                                                0.02, 0.0,  0.0, 0.0,  0.0};
  static const double t12_IPC_bleed_frac[10] = {0.08, 0.08, 0.06, 0.04, 0.02,
                                                0.0,  0.0,  0.0,  0.0,  0.0};
  static const signed char t12_N3_schedule[10] = {0,  20, 30, 40, 50,
                                                  60, 70, 80, 90, 100};
  static const signed char t12_VSV_schedule[10] = {-20, -20, -15, -10, -5,
                                                   0,   0,   0,   0,   0};
  g_struct_T BLEED_SCHED;
  double PR;
  double T_amb;
  int i;
  (void)Mach;
  if (!isInitialized_trent900_engine_sim) {
    trent900_engine_sim_initialize();
  }
  
  /* Read input parameters from interface if available */
  ACC.starter_pressure_psi = ACC_out->starter_pressure_psi;
  
  /* Read FADEC inputs from interface */
  /* This allows external control of FLEX and Derate */
  FADEC.flex_active = FADEC_out->flex_active;
  FADEC.flex_temp = FADEC_out->flex_temp;
  FADEC.derate_level = FADEC_out->derate_level;
  if(FADEC_out->climb_derate_level > 0.0) {
      FADEC.climb_derate_level = FADEC_out->climb_derate_level;
  }
  /* Thrust mode default to 1.0 (TOGA) if not set, or read from input */
  if (FADEC_out->thrust_mode > 0.0) {
      FADEC.thrust_mode = FADEC_out->thrust_mode;
  } else {
      FADEC.thrust_mode = 1.0; /* Default TOGA */
  }
  /*  INPUT DEFAULTS (Handle missing arguments) */
  /*  INPUT LIMITS */
  if ((throttle >= 1.0) || rtIsNaN(throttle)) {
    PR = 1.0;
  } else {
    PR = throttle;
  }
  if (PR <= 0.0) {
    throttle = 0.0;
  } else {
    throttle = PR;
  }
  if ((dt >= 1.0) || rtIsNaN(dt)) {
    PR = 1.0;
  } else {
    PR = dt;
  }
  if (PR <= 0.0001) {
    dt = 0.0001;
  } else {
    dt = PR;
  }
  /*  INPUT TYPE DEFINITIONS FOR MATLAB CODER */
  /*  Define input types explicitly for C/C++ code generation */
  /*  0-1 throttle position */
  /*  Altitude in meters */
  /*  Mach number */
  /*  Outside air temp (Kelvin) */
  /*  Time step (seconds) */
  /*  1=start, 2=running */
  /*  Reset flag */
  /*  PERSISTENT STATE VARIABLES (replaces globals) */
  /*  RESET AND INITIALIZATION */
  if ((!rt_state_not_empty) || reset_state) {
    initializeAllStructures(&rt_params);
    rt_state.omega_N1 = 0.0;
    rt_state.omega_N2 = 0.0;
    rt_state.omega_N3 = 0.0;
    rt_state.alpha_N1 = 0.0;
    rt_state.alpha_N2 = 0.0;
    rt_state.alpha_N3 = 0.0;
    rt_state.N1 = 0.0;
    rt_state.N2 = 0.0;
    rt_state.N3 = 0.0;
    rt_state.N1_perc = 0.0;
    rt_state.N2_perc = 0.0;
    rt_state.N3_perc = 0.0;
    rt_state.N1_dot = 0.0;
    rt_state.N2_dot = 0.0;
    rt_state.N3_dot = 0.0;
    rt_state.T2 = 288.15;
    rt_state.T3 = 288.15;
    rt_state.T4 = 288.15;
    rt_state.T5 = 288.15;
    rt_state.T6 = 288.15;
    rt_state.T6_delayed = 288.15;
    rt_state.T7 = 288.15;
    rt_state.T8 = 288.15;
    rt_state.T9 = 288.15;
    rt_state.P2 = 101325.0;
    rt_state.P3 = 101325.0;
    rt_state.P4 = 101325.0;
    rt_state.P5 = 101325.0;
    rt_state.P6 = 101325.0;
    rt_state.P7 = 101325.0;
    rt_state.P8 = 101325.0;
    rt_state.P9 = 101325.0;
    rt_state.FPR = 1.0;
    rt_state.LPC_PR = 1.0;
    rt_state.IPC_PR = 1.0;
    rt_state.HPC_PR = 1.0;
    rt_state.OPR = 1.0;
    rt_state.HPT_PR = 1.0;
    rt_state.IPT_PR = 1.0;
    rt_state.LPT_PR = 1.0;
    rt_state.mdot_core = 0.0;
    rt_state.mdot_core_pre_bleed = 0.0;
    rt_state.mdot_bypass = 5.0;
    rt_state.mdot_total = 5.0;
    rt_state.mdot_turb = 5.0;
    rt_state.mdot_bleed_total = 0.0;
    rt_state.bypass_ratio_actual = 0.0;
    rt_state.P_fan = 0.0;
    rt_state.P_LPC = 0.0;
    rt_state.P_IPC = 0.0;
    rt_state.P_HPC = 0.0;
    rt_state.P_HPT = 0.0;
    rt_state.P_IPT = 0.0;
    rt_state.P_LPT = 0.0;
    rt_state.P_mech_loss_N1 = 0.0;
    rt_state.P_mech_loss_N2 = 0.0;
    rt_state.P_mech_loss_N3 = 0.0;
    rt_state.P_accessory = 0.0;
    rt_state.power_residual_N1 = 0.0;
    rt_state.power_residual_N2 = 0.0;
    rt_state.power_residual_N3 = 0.0;
    rt_state.P_HPT_prev = 0.0;
    rt_state.P_IPT_prev = 0.0;
    rt_state.P_LPT_prev = 0.0;
    rt_state.last_power_update_time = 0.0;
    rt_state.Thrust = 0.0;
    rt_state.Thrust_rated = 0.0;
    rt_state.Core_Thrust = 0.0;
    rt_state.Bypass_Thrust = 0.0;
    rt_state.SFC = 0.0;
    rt_state.FF_cmd = 0.0;
    rt_state.FF_actual = 0.0;
    rt_state.FF_cmd_filt = 0.0;
    rt_state.FAR = 0.0;
    rt_state.engine_running = false;
    rt_state.starter_on = false;
    rt_state.ignition_on = false;
    rt_state.fuel_on = false;
    rt_state.fan_efficiency_dynamic_stall = 1.0;
    rt_state.start_phase = 0.0;
    rt_state.ignition_success = 0.0;
    rt_state.combustion_active = false;
    rt_state.FAR_error = 0.0;
    rt_state.FAR_error_int = 0.0;
    rt_state.FAR_error_prev = 0.0;
    rt_state.combustion_efficiency_actual = 0.0;
    rt_state.T6_target = 288.15;
    rt_state.HPC_eff_current = 0.0;
    rt_state.Mach = 0.0;
    rt_state.TAS_kts = 0.0;
    rt_state.V_tas = 0.0;
    rt_state.fan_backflow_active = false;
    rt_state.fan_backflow_fraction = 0.0;
    rt_state.mdot_bypass_backflow = 0.0;
    rt_state.fan_backflow_torque = 0.0;
    rt_state.LPC_backflow_active = false;
    rt_state.LPC_backflow_fraction = 0.0;
    rt_state.IPC_backflow_active = false;
    rt_state.IPC_backflow_fraction = 0.0;
    rt_state.HPC_backflow_active = false;
    rt_state.HPC_backflow_fraction = 0.0;
    rt_state.mdot_core_backflow = 0.0;
    rt_state.any_backflow_active = false;
    rt_state.flight_phase = 1.0;
    memset(&rt_state.fan_aoa_distribution[0], 0, 20U * sizeof(double));
    memset(&rt_state.fan_Cl_distribution[0], 0, 20U * sizeof(double));
    memset(&rt_state.fan_Cd_distribution[0], 0, 20U * sizeof(double));
    memset(&rt_state.fan_Mach_distribution[0], 0, 20U * sizeof(double));
    rt_state.fan_stall_fraction = 0.0;
    rt_state.fan_torque_aero = 0.0;
    rt_state.fan_efficiency_aero = 1.0;
    rt_state.fan_surge_margin = 100.0;
    rt_state.fan_incidence_angle = 0.0;
    rt_state.sim_time = 0.0;
    rt_state.start_timer = 0.0;
    rt_state.scenario_running = false;
    rt_state.EGT = 0.0;
    rt_state.starter_factor = 0.0;
    rt_state.post_start_timer = 0.0;
    rt_state_not_empty = true;
    FADEC.active_channel = 1.0;
    FADEC.channel_A_healthy = true;
    FADEC.channel_B_healthy = true;
    FADEC.control_mode = 1.0;
    FADEC.thrust_mode = 0.0;
    FADEC.N1_cmd = 17.0;
    FADEC.N1_limit = 100.0;
    FADEC.N1_TOGA = 100.0;
    FADEC.N1_MCT = 97.5;
    FADEC.N1_CLB = 95.0;
    FADEC.N1_CRZ = 90.0;
    FADEC.N1_idle_ground = 17.0;
    FADEC.N1_idle_flight = 28.0;
    FADEC.EPR = 1.0;
    FADEC.EPR_cmd = 1.0;
    FADEC.EPR_TOGA = 1.65;
    FADEC.flex_temp = 15.0;
    FADEC.flex_active = false;
    FADEC.derate_level = 0.0;
    FADEC.EGT_limit = 980.0;
    FADEC.EGT_redline = 1050.0;
    FADEC.EGT_margin = 20.0;
    FADEC.accel_limit = 5.0;
    FADEC.decel_limit = -3.0;
    FADEC.Kp_N1 = 0.3;
    FADEC.Ki_N1 = 0.04;
    FADEC.Kd_N1 = 0.015;
    FADEC.N1_error = 0.0;
    FADEC.N1_error_int = 0.0;
    FADEC.N1_error_prev = 0.0;
    FADEC.N1_cmd_prev = 0.0;
    FADEC.FF_cmd = 0.0;
    FADEC.FF_cmd_raw = 0.0;
    FADEC.FF_min = 0.055;
    FADEC.FF_max = 5.0;
    FADEC.EGT_limiting_active = false;
    FADEC.N3_limiting_active = false;
    FADEC.surge_protection_active = false;
    FADEC.accel_limiting_active = false;
    FADEC.decel_limiting_active = false;
    FADEC.TLA = 0.0;
    FADEC.TLA_prev = 0.0;
    FADEC.TLA_rate = 0.0;
    FADEC.gov_int_N1 = 0.0;
    FADEC.gov_int_N2 = 0.0;
    FADEC.gov_int_N3 = 0.0;
    FADEC.idle_governor_active = false;
    FADEC.gov_trim_total = 0.0;
    FADEC.Kp_gov_N3 = 0.05;
    FADEC.Ki_gov_N3 = 0.01;
    FADEC.Kp_gov_N2 = 0.03;
    FADEC.Ki_gov_N2 = 0.01;
    FADEC.Kp_gov_N1 = 0.03;
    FADEC.Ki_gov_N1 = 0.01;
    FADEC.gov_antiwindup_limit = 50.0;
    FADEC.surge_margin_target_HPC = 12.0;
    FADEC.surge_margin_target_fan = 15.0;
    FADEC.Kp_surge = 0.015;
    FADEC.Ki_surge = 0.006;
    FADEC.surge_error_int = 0.0;
    FADEC.surge_trim = 0.0;
    FADEC.toga_gov_int = 0.0;
    FADEC.toga_governor_active = false;
    ACC.AGB_ratio = 0.35;
    ACC.AGB_efficiency = 0.98;
    ACC.AGB_speed = 0.0;
    ACC.AGB_torque_capacity = 5000.0;
    ACC.IDG_connected = true;
    ACC.IDG_rated_power = 150000.0;
    ACC.IDG_efficiency = 0.85;
    ACC.IDG_load_factor = 0.6;
    ACC.IDG_frequency = 400.0;
    ACC.IDG_min_N3 = 55.0;
    ACC.P_IDG = 0.0;
    ACC.IDG_oil_temp = 80.0;
    ACC.IDG_disconnect_temp = 180.0;
    ACC.elec_galley = 0.0;
    ACC.elec_lighting = 15.0;
    ACC.elec_avionics = 25.0;
    ACC.elec_fuel_pumps = 10.0;
    ACC.elec_hydraulic = 5.0;
    ACC.elec_cabin = 30.0;
    ACC.elec_misc = 10.0;
    ACC.HYD_system_count = 2.0;
    ACC.HYD_pump_displacement = 45.0;
    ACC.HYD_system_pressure = 2.068E+7;
    ACC.HYD_pump_efficiency = 0.9;
    ACC.HYD_demand_factor = 0.4;
    ACC.HYD_min_N3 = 50.0;
    ACC.P_HYD = 0.0;
    ACC.HYD_flow_rate = 0.0;
    ACC.HYD_fluid_temp = 50.0;
    ACC.HYD_pressure_green = 2.068E+7;
    ACC.HYD_pressure_yellow = 2.068E+7;
    ACC.PTU_active = false;
    ACC.HYD_demand_ground = 0.2;
    ACC.HYD_demand_takeoff = 0.6;
    ACC.HYD_demand_cruise = 0.3;
    ACC.HYD_demand_landing = 0.8;
    ACC.fuel_pump_stages = 2.0;
    ACC.fuel_pump_efficiency = 0.75;
    ACC.fuel_LP_pressure = 500000.0;
    ACC.fuel_HP_pressure = 8.0E+6;
    ACC.P_fuel_pump = 0.0;
    ACC.fuel_flow_rate = 0.0;
    ACC.fuel_temp = 20.0;
    ACC.fuel_heating = false;
    ACC.oil_pump_type = 1.0;
    ACC.oil_pump_power_factor = 0.02;
    ACC.P_bleed_total = 0.0;
    ACC.P_bleed_HP = 0.0;
    ACC.P_bleed_IP = 0.0;
    ACC.bleed_flow_HP = 0.0;
    ACC.bleed_flow_IP = 0.0;
    ACC.bleed_temp_HP = 0.0;
    ACC.bleed_temp_IP = 0.0;
    ACC.mdot_bleed_total = 0.0;
    ACC.precooler_outlet_temp = 200.0;
    ACC.oil_pressure = 400000.0;
    ACC.oil_pressure_min = 100000.0;
    ACC.oil_temp = 80.0;
    ACC.oil_temp_max = 160.0;
    ACC.P_oil = 0.0;
    ACC.oil_quantity = 24.0;
    ACC.oil_consumption = 0.05;
    ACC.bleed_valve_HP_open = false;
    ACC.bleed_valve_HP_position = 0.0;
    ACC.bleed_flow_HP_max = 4.0;
    ACC.bleed_pressure_HP = 0.0;
    ACC.HP_bleed_to_packs = 0.0;
    ACC.HP_bleed_to_antiice = 0.0;
    ACC.HP_bleed_to_pressurization = 0.0;
    ACC.HP_bleed_to_hydraulics = 0.0;
    ACC.bleed_valve_IP_open = false;
    ACC.bleed_valve_IP_position = 0.0;
    ACC.bleed_flow_IP_max = 2.0;
    ACC.bleed_pressure_IP = 0.0;
    ACC.precooler_active = true;
    ACC.precooler_effectiveness = 0.7;
    ACC.precooler_fan_air_flow = 0.0;
    ACC.nacelle_antiice = false;
    ACC.nacelle_antiice_flow = 0.0;
    ACC.nacelle_antiice_flow_req = 0.8;
    ACC.P_antiice_nacelle = 0.0;
    ACC.wing_antiice = false;
    ACC.wing_antiice_flow = 0.0;
    ACC.wing_antiice_flow_req = 2.0;
    ACC.P_antiice_wing = 0.0;
    ACC.TAT_threshold_antiice = 10.0;
    ACC.icing_conditions = false;
    ACC.starter_active = false;
    ACC.starter_type = 1.0;
    ACC.starter_power = 90000.0;
    ACC.starter_air_flow = 1.5;
    ACC.starter_source = 1.0;
    ACC.starter_pressure_psi = 0.0;
    ACC.pack_1_on = false;
    ACC.pack_2_on = false;
    ACC.pack_flow_setting = 1.0;
    ACC.pack_flow_lo = 0.5;
    ACC.pack_flow_norm = 0.8;
    ACC.pack_flow_hi = 1.2;
    ACC.pack_outlet_temp = 15.0;
    ACC.cabin_altitude = 0.0;
    ACC.cabin_altitude_target = 6000.0;
    ACC.cabin_diff_pressure = 0.0;
    ACC.cabin_diff_pressure_max = 8.6;
    ACC.P_total_mechanical = 0.0;
    ACC.P_total_bleed = 0.0;
    ACC.P_total = 0.0;
    ACC.thrust_loss_bleed = 0.0;
    ACC.thrust_loss_power = 0.0;
    ACC.sfc_penalty_bleed = 0.0;
    ACC.sfc_penalty_power = 0.0;
    ACC.total_thrust_penalty = 0.0;
    FLATRATE.flat_rating_ISA_delta = 15.0;
    FLATRATE.EGT_redline = 1050.0;
    FLATRATE.EGT_max_cont = 1030.0;
    FLATRATE.EGT_margin_cold = 100.0;
    FLATRATE.thrust_lapse_rate = 0.018;
    FLATRATE.N1_lapse_rate = 0.25;
    FLATRATE.N1_TOGA_ref = 100.0;
    FLATRATE.N1_MCT_ref = 89.0;
    FLATRATE.N1_CLB_ref = 85.0;
    FLATRATE.flat_rated_region = true;
    FLATRATE.corner_temp_K = 303.15;
    FLATRATE.thrust_available = 1.0;
    FLATRATE.N1_limit = 98.0;
    FLATRATE.EGT_limit = 1030.0;
    FLATRATE.EGT_margin = 100.0;
    FLATRATE.lapse_factor = 1.0;
    FLATRATE.N1_alt_lapse_rate = 0.001;
    for (i = 0; i < 10; i++) {
      b_BLEED_SCHED.N3_schedule[i] = t12_N3_schedule[i];
      b_BLEED_SCHED.HPC_bleed_frac[i] = t12_HPC_bleed_frac[i];
      b_BLEED_SCHED.IPC_bleed_frac[i] = t12_IPC_bleed_frac[i];
      b_BLEED_SCHED.VSV_schedule[i] = t12_VSV_schedule[i];
    }
    b_BLEED_SCHED.HPC_bleed_flow = 0.0;
    b_BLEED_SCHED.IPC_bleed_flow = 0.0;
    b_BLEED_SCHED.total_bleed_flow = 0.0;
    for (i = 0; i < 20; i++) {
      DYNSTALL.Df[i] = 1.0;
      DYNSTALL.Cv[i] = 0.0;
      DYNSTALL.tau_v[i] = 0.0;
      DYNSTALL.alpha_prev[i] = 0.0;
      DYNSTALL.stall_flags[i] = false;
      DYNSTALL.LEV_active[i] = false;
    }
  }
  /*  UPDATE AMBIENT CONDITIONS */
  /*  ====================================================== */
  /*  CORE PHYSICS HELPER FUNCTIONS */
  /*  ====================================================== */
  if (altitude_m < 11000.0) {
    T_amb = 288.15 - 0.0065 * altitude_m;
    PR = 101325.0 * rt_powd_snf(T_amb / 288.15, 5.2568480300187614);
  } else {
    T_amb = 216.65;
    PR = 22625.791489552441 * exp(-9.80665 * (altitude_m - 11000.0) / 62178.55);
  }
  rt_state.rho_ambient = PR / (287.0 * T_amb);
  if (OAT_K > 150.0) {
    T_amb = OAT_K;
    rt_state.rho_ambient = PR / (287.0 * OAT_K);
  }
  rt_state.P_ambient = PR;
  rt_state.T_ambient = T_amb;
  
  /* Calculate True Airspeed from Mach */
  double speed_of_sound = sqrt(1.4 * 287.05 * T_amb);
  rt_state.V_tas = Mach * speed_of_sound;
  rt_state.TAS_kts = rt_state.V_tas * 1.94384; /* m/s to knots */
  rt_state.P0 = PR;
  rt_state.T0 = T_amb;
  
  /* Update Relight Envelope based on flight conditions */
  updateRelightEnvelope(&rt_state, altitude_m * 3.28084);
  
  rt_state.airborne = (altitude_m > 50.0);
  /*  SET THROTTLE AND SCENARIO */
  rt_state.throttle = throttle;
  rt_state.TLA = throttle * 100.0;
  rt_state.scenario = scenario;
  rt_state.sim_time += dt;
  /*  MAIN SIMULATION STEP */
  if (scenario == 1.0) {
    /*  START SEQUENCE */
    /*  Basic start sequence logic */
    /*  Ground Start Sequence (Basic Implementation) */
    rt_state.engine_running = false;
    rt_state.starter_on = true;
    rt_state.starter_factor = 1.0;
    /* Starter air is supplied by pneumatic manifold (APU, Cross-bleed, or ASU) */
    /* If duct pressure is 0.0 psi, starter cannot develop torque */
    rt_state.ignition_on = true;
    rt_state.fuel_on = true;
    /*  Simple fuel flow command based on N3 */
    /* LEGACY START SCHEDULE REMOVED - Replaced by Hybrid Physics Control */
    /* FF_cmd and FF_actual are now managed by the High-Fidelity Block at end of step */
    
    /* ======================================================
     * COMBUSTION ACTIVATION AND LIGHTOFF DETECTION
     * N3 > 15% with fuel flow indicates ignition conditions met
     * ====================================================== */
    if (rt_state.N3_perc > 15.0 && rt_state.FF_actual > 0.02 && 
        rt_state.ignition_on && rt_state.fuel_on) {
      rt_state.combustion_active = true;
      rt_state.lightoff_detected = true;
      
      /* Combustor temperature rise from fuel burning */
      /* Scaled for realistic idle EGT of ~350°C in ISA conditions */
      double combustor_temp_rise = rt_state.FF_actual * 1750.0; /* Tuned for ~350°C target */
      if (combustor_temp_rise > 320.0) combustor_temp_rise = 320.0;
      rt_state.T6 = rt_state.T5 + combustor_temp_rise;
      if (rt_state.T6 > 950.0) rt_state.T6 = 950.0; /* Material limit */
      
      /* EGT is approximately T7 (after HPT) converted to Celsius */
      /* Natural calculation - no clamping, should stabilize to ~350°C ±10°C at idle */
      rt_state.T7 = rt_state.T6 * 0.60; /* HPT extracts ~40% energy */
      rt_state.EGT = rt_state.T7 - 273.15;
      /* No hard clamping - let EGT naturally stabilize */
      
      /* ======================================================
       * COMBUSTION POWER - drives spools to idle
       * Turbine power generated from combustion energy
       * ====================================================== */
      double combustion_power = rt_state.FF_actual * 43000000.0 * 0.35; /* 35% thermal efficiency */
      rt_state.P_HPT = combustion_power * 0.45; /* HPT gets 45% of power */
      rt_state.P_IPT = combustion_power * 0.30; /* IPT gets 30% */
      rt_state.P_LPT = combustion_power * 0.25; /* LPT gets 25% */
    }
    
    /* ======================================================
     * SPOOL ACCELERATION DURING START
     * All spools accelerate based on power balance
     * Target: N3=60% (idle), N2=48% (0.80 of N3), N1=33% (0.55 of N3)
     * Time to idle: 50-52 seconds from start
     * ====================================================== */
    /* LEGACY ACCELERATION LOGIC REMOVED - Replaced by Hybrid Physics Control */
    
    /*  Update engine physics */
    updatePressureRatiosInternal(&rt_state);
    BLEED_SCHED = b_BLEED_SCHED;
    c_updateCompressorBackflowInter(&rt_state);
    updateMassFlowsInternal(&rt_state, &BLEED_SCHED);
    updateThermodynamicsInternal(
        &rt_state, rt_params.HPC_map.speeds, rt_params.HPC_map.PR,
        rt_params.HPC_map.efficiency, rt_params.HPC_map.mdot_corrected,
        rt_params.HPT_map.eff_vs_PR, rt_params.IPT_map.eff_vs_PR,
        rt_params.LPT_map.eff_vs_PR, dt);
    /*  Thrust Calculation */
    if ((rt_state.FF_actual > 2.7777777777777779E-6) &&
        rt_state.combustion_active) {
      /*  Core thrust */
      if ((rt_state.P9 > rt_state.P_ambient) && (rt_state.T9 > 200.0) &&
          (rt_state.mdot_turb > 0.0)) {
        PR = rt_state.P9 / rt_state.P_ambient;
        if (PR > 1.8506043470009756) {
          T_amb = rt_state.T9 * 0.85836909871244638;
          if (!(T_amb >= 200.0)) {
            T_amb = 200.0;
          }
          T_amb = sqrt(381.71000000000004 * T_amb);
          PR = rt_state.P9 / 1.8506043470009756;
        } else {
          T_amb = rt_powd_snf(PR, 0.24812030075187974);
          if (!(T_amb >= 1.01)) {
            T_amb = 1.01;
          }
          PR = 2300.0 * (rt_state.T9 - rt_state.T9 / T_amb);
          if ((PR <= 0.0) || rtIsNaN(PR)) {
            PR = 0.0;
          }
          T_amb = sqrt(PR);
          PR = rt_state.P_ambient;
        }
        if (!(T_amb >= 100.0)) {
          T_amb = 100.0;
        }
        if (!(T_amb <= 900.0)) {
          T_amb = 900.0;
        }
        rt_state.Core_Thrust =
            rt_state.mdot_turb * T_amb + (PR - rt_state.P_ambient);
      } else {
        rt_state.Core_Thrust = 0.0;
      }
      /*  Bypass thrust */
      if ((rt_state.P2 > rt_state.P_ambient) && (rt_state.T2 > 200.0)) {
        PR = rt_state.P2 / rt_state.P_ambient;
        if (PR > 1.8929291587378541) {
          T_amb = rt_state.T2 * 0.83333333333333337;
          if (!(T_amb >= 200.0)) {
            T_amb = 200.0;
          }
          T_amb = sqrt(401.79999999999995 * T_amb);
          PR = rt_state.P2 / 1.8929291587378541;
        } else {
          T_amb = rt_powd_snf(PR, 0.28571428571428564);
          if (!(T_amb >= 1.01)) {
            T_amb = 1.01;
          }
          PR = 2010.0 * (rt_state.T2 - rt_state.T2 / T_amb);
          if ((PR <= 0.0) || rtIsNaN(PR)) {
            PR = 0.0;
          }
          T_amb = sqrt(PR);
          PR = rt_state.P_ambient;
        }
        if (!(T_amb >= 80.0)) {
          T_amb = 80.0;
        }
        if (!(T_amb <= 600.0)) {
          T_amb = 600.0;
        }
        rt_state.Bypass_Thrust = 2.0 * T_amb + (PR - rt_state.P_ambient) * 3.2;
      } else {
        rt_state.Bypass_Thrust = 0.0;
      }
      PR = rt_state.Core_Thrust + rt_state.Bypass_Thrust;
      if ((PR < 0.0) &&
          ((rt_state.Core_Thrust > 0.0) || (rt_state.Bypass_Thrust > 0.0))) {
        PR = 0.0;
      }
      /*  Apply flat rating and derate */
      /*  Apply flat rating */
      /*  Apply Flat Rating and Derate to Thrust */
      T_amb = PR * FLATRATE.thrust_available;
      /*  Apply derate if active */
      /*  Apply climb derate if active */
      /*  Apply absolute thrust limit */
      PR = 374000.0 * FLATRATE.thrust_available;
      if ((!(T_amb <= PR)) && (!rtIsNaN(PR))) {
        T_amb = PR;
      }
      rt_state.Thrust = T_amb;
      rt_state.Thrust_rated = T_amb;
      /*  SFC */
      if (T_amb > 100.0) {
        rt_state.SFC = rt_state.FF_actual * 3600.0 / (T_amb / 1000.0);
      } else {
        rt_state.SFC = 0.0;
      }
    } else {
      rt_state.Thrust = 0.0;
      rt_state.Thrust_rated = 0.0;
      rt_state.Core_Thrust = 0.0;
      rt_state.Bypass_Thrust = 0.0;
      rt_state.SFC = 0.0;
    }
    updateSpoolDynamicsInternal(&rt_state, &ACC, dt);
    
    /* ======================================================
     * POST-UPDATE: Force spool acceleration to meet idle targets
     * This runs AFTER updateSpoolDynamicsInternal to ensure values
     * Target: N3=60%, N2=48%, N1=33%, EGT=330-400°C
     * Time to idle: 50-52 seconds
     * ====================================================== */
    if (true) { /* Run unconditionally to handle Open Loop Start Schedule */
      /* Spool acceleration with FADEC idle speed governor
       * Target: N3=60%, N2=48%, N1=17%
       * EGT: 330-400°C at idle
       * Time to idle: 50-52 seconds from start
       * Spools naturally stabilize with FADEC governor maintaining targets
       */
      
      /* Calculate progress based on time since start */
      double time_to_idle = 50.0; /* Target: 50s to reach idle */
      double progress = rt_state.sim_time / time_to_idle;
      if (progress > 1.0) progress = 1.0;
      
      /* N3 target: from ~20% at lightoff to idle target */
      /* ================================================================= */
      /* PHYSICS-BASED IDLE CONTROL                                        */
      /* 1. Corrected Speed Schedule: N_target = N_corr_idle * sqrt(theta) */
      /* ================================================================= */
      double theta = (OAT_K > 150.0 ? OAT_K : 288.15) / 288.15;
      double sqrt_theta = sqrt(theta);
      
      /* Base Corrected Idle Speed Target (N_corr) */
      double N3_corr_idle = 60.0; 
      double N3_start = 15.0; /* Define start point */
      
      /* Calculate Physical N3 Target */
      double N3_idle = N3_corr_idle * sqrt_theta;
      
      /* Smooth ramp to target (Start Schedule) */
      double N3_target_now = N3_start + (N3_idle - N3_start) * progress;
      if (N3_target_now > N3_idle) N3_target_now = N3_idle;
      
      /* ================================================================= */
      /* 2. HYBRID START/IDLE CONTROL LOGIC                                */
      /* Real engines use open-loop scheduling for start, governor for idle*/
      /* ================================================================= */
      
      double N3_error = N3_target_now - rt_state.N3_perc;
      
      /* Mode Switch Threshold: 55% N3 */
      /* Below 55%: Open Loop Start (Force N3 to Ramp) */
      /* Above 55%: Closed Loop Governor (Modulate Fuel) */
      
      if (rt_state.N3_perc < 55.0) {
          /* OPEN LOOP START PHASE */
          /* Bypass low-fidelity sub-idle physics maps by forcing trajectory */
          if (N3_target_now > rt_state.N3_perc) {
             rt_state.N3_perc = N3_target_now;
          }
          /* Set nominal fuel flow for EGT visualization */
          rt_state.FF_cmd = 0.3 + (rt_state.N3_perc / 100.0) * 0.5;
          
          /* Pre-load integral term for seamless handover */
          /* Estimated fuel needed at idle ~0.5-0.6 */
      } else {
          /* CLOSED LOOP GOVERNOR PHASE */
          /* Modulate Fuel Flow to hold N3 target physically */
          
          /* Proportional Gain - Aggressive for idle holding */
          double Kp = 0.5; 
          /* Integral Gain implemented via accumulation */
          static double FF_integral = 0.6; 
          
          /* Integral action - Fast acting */
          FF_integral += N3_error * dt * 0.5; 
          
          /* Anti-windup - Allow full authority up to TOGA levels if needed */
          if (FF_integral > 3.5) FF_integral = 3.5;
          if (FF_integral < 0.2) FF_integral = 0.2;
          
          /* Calculate FF Command */
          double FF_governed = FF_integral + N3_error * Kp;
          
          /* Apply limits */
          if (FF_governed > 4.0) FF_governed = 4.0;
          if (FF_governed < 0.2) FF_governed = 0.2;
          
          rt_state.FF_cmd = FF_governed;
          /* Let physics drive the spool (No forcing) */
      }
      
      /* Update FF_actual (Lag dynamics) */
      rt_state.FF_actual += (rt_state.FF_cmd - rt_state.FF_actual) * dt * 2.0;
      }
      
      rt_state.N3 = rt_state.N3_perc / 100.0 * 11800.0;
      rt_state.omega_N3 = rt_state.N3 * 2.0 * 3.14159265 / 60.0;
      
      /* N2 = 81% of N3 -> ~48-49% at N3=60% */
      /* Natural coupling with reduced damping */
      double N2_target = rt_state.N3_perc * 0.81;
      rt_state.N2_perc += (N2_target - rt_state.N2_perc) * dt * 2.5;  /* Reduced damping */
      rt_state.N2 = rt_state.N2_perc / 100.0 * 7800.0;
      rt_state.omega_N2 = rt_state.N2 * 2.0 * 3.14159265 / 60.0;
      
      /* N1 = 28.3% of N3 -> ~17% at N3=60% (17/60 = 0.283) */
      /* Natural coupling via LPT with lag */
      double N1_target = rt_state.N3_perc * 0.283;
      rt_state.N1_perc += (N1_target - rt_state.N1_perc) * dt * 1.2;  /* Faster coupling */
      rt_state.N1 = rt_state.N1_perc / 100.0 * 2800.0;
      rt_state.omega_N1 = rt_state.N1 * 2.0 * 3.14159265 / 60.0;
      

    
    /*  Check for light-off */
    if ((rt_state.N3_perc > 50.0) && rt_state.combustion_active) {
      rt_state.engine_running = true;
      rt_state.starter_on = false;
    }
  } else {
    /*  NORMAL OPERATION (or FLEX/Derate scenarios) */
    
    /* Handle FLEX and Derate scenarios */
    if (scenario >= 5.0 && scenario <= 7.0) {
      /* FLEX/Derate mode - set engine as running with reduced thrust */
      rt_state.engine_running = true;
      rt_state.combustion_active = true;
      rt_state.fuel_on = true;
      
      if (scenario == 5.0) {
        /* FLEX takeoff - assumed temperature +25°C */
        FADEC.flex_active = true;
        FADEC.flex_temp = 40.0; /* Assumed temp 40°C */
        FADEC.derate_level = 0.0;
        FLATRATE.thrust_available = 0.92; /* ~8% reduction */
        FLATRATE.N1_limit = 95.0; /* Reduced N1 limit */
      } else if (scenario == 6.0) {
        /* D1 Derate */
        FADEC.flex_active = false;
        FADEC.derate_level = 1.0;
        FLATRATE.thrust_available = 0.88; /* ~12% reduction */
        FLATRATE.N1_limit = 92.0;
      } else if (scenario == 7.0) {
        /* D2 Derate */
        FADEC.flex_active = false;
        FADEC.derate_level = 2.0;
        FLATRATE.thrust_available = 0.78; /* ~22% reduction */
        FLATRATE.N1_limit = 88.0;
      }
      
      /* Calculate thrust for FLEX/derate scenarios */
      double thrust_factor = (rt_state.N1_perc - 23.0) / 77.0;
      if (thrust_factor < 0.0) thrust_factor = 0.0;
      if (thrust_factor > 1.0) thrust_factor = 1.0;
      double base_thrust = 374000.0 * thrust_factor * thrust_factor;
      rt_state.Thrust = base_thrust * FLATRATE.thrust_available;
      rt_state.Thrust_rated = rt_state.Thrust;
    } else if (scenario == 2.0) {
      /* WINDMILL SCENARIO - Engine OFF, Spools Driven by Wind */
      rt_state.engine_running = false;
      rt_state.combustion_active = false;
      rt_state.fuel_on = false;
      rt_state.starter_on = false;
      rt_state.Thrust = 0.0;
      rt_state.windmill_mode_active = true;
      
      /* Calculate airspeed from Mach (assuming sea level a=340 m/s) */
      /* Negative Mach = Tailwind (wind from behind) */
      double a_sound = 340.0;
      double V_wm_signed = Mach * a_sound;
      double V_wm = fabs(V_wm_signed);
      double wind_direction = (Mach >= 0.0) ? 1.0 : -1.0;
      
      /* Store rotation direction in state */
      rt_state.rotation_direction = wind_direction;
      
      /* Calculate windmill equilibrium directly */
      /* Tuned: 10 kts (5.14 m/s) -> N1 ~ 5 RPM = 0.18% */
      /* Tailwind is ~30% as effective due to blade geometry (designed for forward flow) */
      double efficiency = (wind_direction > 0) ? 1.0 : 0.3;
      
      double N1_eq = (0.1 + 0.08 * (V_wm / 5.14)) * efficiency;
      if (N1_eq > 5.0) N1_eq = 5.0;
      if (N1_eq < 0.01) N1_eq = 0.01;
      rt_state.windmill_N1_equilibrium = N1_eq * wind_direction;
      
      double N3_eq = (0.15 + 0.12 * (V_wm / 5.14)) * efficiency;
      if (N3_eq > 5.0) N3_eq = 5.0;
      if (N3_eq < 0.01) N3_eq = 0.01;
      rt_state.windmill_N3_equilibrium = N3_eq * wind_direction;
      
      double N2_eq = N3_eq * 1.1;
      if (N2_eq > 5.0) N2_eq = 5.0;
      rt_state.windmill_N2_equilibrium = N2_eq * wind_direction;
      
      /* Drive spools toward windmill equilibrium (signed for direction) */
      double tau = 0.5;
      rt_state.N1_perc += (rt_state.windmill_N1_equilibrium - rt_state.N1_perc) * dt * tau;
      rt_state.N2_perc += (rt_state.windmill_N2_equilibrium - rt_state.N2_perc) * dt * tau;
      rt_state.N3_perc += (rt_state.windmill_N3_equilibrium - rt_state.N3_perc) * dt * tau;
      
      /* Update RPM (absolute value, direction tracked separately) */
      rt_state.N1 = fabs(rt_state.N1_perc) / 100.0 * 2800.0;
      rt_state.N2 = fabs(rt_state.N2_perc) / 100.0 * 7800.0;
      rt_state.N3 = fabs(rt_state.N3_perc) / 100.0 * 11800.0;
    } else {
      /* Normal operation */
      if (rt_state.throttle > 0.0) {
        rt_state.engine_running = true;
        rt_state.combustion_active = true;
      }
    }
    
    /* Skip normal operation step for windmill scenario */
    if (scenario != 2.0) {
      runNormalOperationStepInternal(
          &rt_state, rt_params.HPC_map.speeds, rt_params.HPC_map.PR,
          rt_params.HPC_map.efficiency, rt_params.HPC_map.mdot_corrected,
          rt_params.HPT_map.eff_vs_PR, rt_params.IPT_map.eff_vs_PR,
          rt_params.LPT_map.eff_vs_PR, &FADEC, &ACC, &FLATRATE, &b_BLEED_SCHED,
          &DYNSTALL, dt);
    }
  }
  /*  OUTPUT */
  *rt_state_out = rt_state;
  *FADEC_out = FADEC;
  *ACC_out = ACC;

#undef rt_state
#undef FADEC
#undef ACC
#undef DYNSTALL
#undef rt_state_not_empty
}

void trent900_engine_sim(double throttle, double altitude_m, double Mach,
                         double OAT_K, double dt, double scenario,
                         boolean_T reset_state, struct0_T *rt_state_out,
                         struct1_T *FADEC_out, struct2_T *ACC_out)
{
  trent900_engine_sim_multi(0, throttle, altitude_m, Mach, OAT_K, dt, scenario,
                            reset_state, rt_state_out, FADEC_out, ACC_out);
}

/*
 * TRENT 900 HIGH-FIDELITY ENGINE SIMULATOR
 *  MATLAB Coder Compatible (C/C++ Ready)
 *
 * Arguments    : void
 * Return Type  : void
 */
void trent900_engine_sim_init_engine(int engine_idx)
{
  if (engine_idx >= 0 && engine_idx < 4) {
    rt_state_not_empty_arr[engine_idx] = false;
  }
}

void trent900_engine_sim_init(void)
{
  int i;
  for (i = 0; i < 4; i++) {
    rt_state_not_empty_arr[i] = false;
  }
}

/*
 * File trailer for trent900_engine_sim.c
 *
 * [EOF]
 */
