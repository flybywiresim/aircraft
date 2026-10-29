/*
 * File: trent900_engine_sim_types.h
 *
 * MATLAB Coder version            : 23.2
 * C/C++ source code generated on  : 10-Jan-2026 16:34:03
 * 
 * ENHANCED VERSION with high-fidelity additions:
 * - Windmilling physics
 * - Inflight relight envelope
 * - Full FADEC with EPR mode
 * - FLEX/Derate system
 * - Full spool dynamics
 * - Enhanced aerothermodynamics
 * - Auxiliary systems (reverse thrust, oil thermal, vibration, surge, VBV)
 */

#ifndef TRENT900_ENGINE_SIM_TYPES_H
#define TRENT900_ENGINE_SIM_TYPES_H

/* Include Files */
#include "rtwtypes.h"

/*==========================================================================*/
/*  ENGINE STATE STRUCTURE (struct0_T)                                       */
/*==========================================================================*/
#ifndef typedef_struct0_T
#define typedef_struct0_T
typedef struct {
  /* ===================== SPOOL DYNAMICS ===================== */
  double omega_N1;                    /* N1 angular velocity (rad/s) */
  double omega_N2;                    /* N2 angular velocity (rad/s) */
  double omega_N3;                    /* N3 angular velocity (rad/s) */
  double alpha_N1;                    /* N1 angular acceleration (rad/s^2) */
  double alpha_N2;                    /* N2 angular acceleration (rad/s^2) */
  double alpha_N3;                    /* N3 angular acceleration (rad/s^2) */
  double N1;                          /* N1 speed (RPM) */
  double N2;                          /* N2 speed (RPM) */
  double N3;                          /* N3 speed (RPM) */
  double N1_perc;                     /* N1 percentage */
  double N2_perc;                     /* N2 percentage */
  double N3_perc;                     /* N3 percentage */
  double N1_dot;                      /* N1 rate of change (%/s) */
  double N2_dot;                      /* N2 rate of change (%/s) */
  double N3_dot;                      /* N3 rate of change (%/s) */
  
  /* ===================== STATION TEMPERATURES (K) ===================== */
  double T2;                          /* Fan discharge temp */
  double T3;                          /* LPC discharge temp */
  double T4;                          /* IPC discharge temp */
  double T5;                          /* HPC discharge temp */
  double T6;                          /* Combustor exit temp */
  double T6_delayed;                  /* EGT probe reading (delayed) */
  double T7;                          /* HPT discharge temp */
  double T8;                          /* IPT discharge temp */
  double T9;                          /* LPT discharge temp */
  
  /* ===================== STATION PRESSURES (Pa) ===================== */
  double P2;                          /* Fan discharge pressure */
  double P3;                          /* LPC discharge pressure */
  double P4;                          /* IPC discharge pressure */
  double P5;                          /* HPC discharge pressure */
  double P6;                          /* Combustor pressure */
  double P7;                          /* HPT discharge pressure */
  double P8;                          /* IPT discharge pressure */
  double P9;                          /* LPT discharge pressure */
  
  /* ===================== PRESSURE RATIOS ===================== */
  double FPR;                         /* Fan pressure ratio */
  double LPC_PR;                      /* LPC pressure ratio */
  double IPC_PR;                      /* IPC pressure ratio */
  double HPC_PR;                      /* HPC pressure ratio */
  double OPR;                         /* Overall pressure ratio */
  double HPT_PR;                      /* HPT pressure ratio */
  double IPT_PR;                      /* IPT pressure ratio */
  double LPT_PR;                      /* LPT pressure ratio */
  
  /* ===================== MASS FLOWS (kg/s) ===================== */
  double mdot_core;                   /* Core mass flow */
  double mdot_core_pre_bleed;         /* Core flow before bleed extraction */
  double mdot_bypass;                 /* Bypass mass flow */
  double mdot_total;                  /* Total inlet mass flow */
  double mdot_turb;                   /* Turbine mass flow */
  double mdot_bleed_total;            /* Total bleed extraction */
  double bypass_ratio_actual;         /* Actual bypass ratio */
  
  /* ===================== POWERS ===================== */
  double P_fan;                       /* Fan power (W) */
  double P_LPC;                       /* LPC power (W) */
  double P_IPC;                       /* IPC power (W) */
  double P_HPC;                       /* HPC power (W) */
  double P_HPT;                       /* HPT power (W) */
  double P_IPT;                       /* IPT power (W) */
  double P_LPT;                       /* LPT power (W) */
  double P_mech_loss_N1;              /* N1 mechanical losses */
  double P_mech_loss_N2;              /* N2 mechanical losses */
  double P_mech_loss_N3;              /* N3 mechanical losses */
  double P_accessory;                 /* Total accessory power */
  double power_residual_N1;           /* N1 power imbalance */
  double power_residual_N2;           /* N2 power imbalance */
  double power_residual_N3;           /* N3 power imbalance */
  double P_HPT_prev;                  /* Previous HPT power */
  double P_IPT_prev;                  /* Previous IPT power */
  double P_LPT_prev;                  /* Previous LPT power */
  double last_power_update_time;      /* Last power update time */
  
  /* ===================== THRUST ===================== */
  double Thrust;                      /* Net thrust (N) */
  double Thrust_rated;                /* Rated thrust (N) */
  double Core_Thrust;                 /* Core nozzle thrust (N) */
  double Bypass_Thrust;               /* Bypass nozzle thrust (N) */
  double SFC;                         /* Specific fuel consumption */
  
  /* ===================== FUEL SYSTEM ===================== */
  double FF_cmd;                      /* Commanded fuel flow (kg/s) */
  double FF_actual;                   /* Actual fuel flow (kg/s) */
  double FF_cmd_filt;                 /* Filtered fuel command */
  double FAR;                         /* Fuel-air ratio */
  
  /* ===================== ENGINE STATE FLAGS ===================== */
  boolean_T engine_running;           /* Engine running flag */
  boolean_T starter_on;               /* Starter engaged */
  boolean_T ignition_on;              /* Ignition active */
  boolean_T fuel_on;                  /* Fuel valve open */
  double fan_efficiency_dynamic_stall;/* Fan efficiency with stall */
  double start_phase;                 /* Current start phase */
  double ignition_success;            /* Ignition success flag */
  boolean_T combustion_active;        /* Combustion established */
  double FAR_error;                   /* FAR control error */
  double FAR_error_int;               /* FAR control integral */
  double FAR_error_prev;              /* FAR control previous error */
  double combustion_efficiency_actual;/* Current combustor efficiency */
  double T6_target;                   /* Target T6 */
  double HPC_eff_current;             /* Current HPC efficiency */
  
  /* ===================== FLIGHT CONDITIONS ===================== */
  double Mach;                        /* Flight Mach number */
  double TAS_kts;                     /* True airspeed (knots) */
  double V_tas;                       /* True airspeed (m/s) */
  double P_ambient;                   /* Ambient pressure (Pa) */
  double T_ambient;                   /* Ambient temperature (K) */
  double rho_ambient;                 /* Ambient density (kg/m3) */
  double P0;                          /* Total pressure (Pa) */
  double T0;                          /* Total temperature (K) */
  boolean_T airborne;                 /* Aircraft airborne flag */
  double throttle;                    /* Throttle position (0-1) */
  double TLA;                         /* Thrust lever angle */
  double scenario;                    /* Operating scenario */
  double Altitude_ft;                 /* Altitude in feet */
  
  /* ===================== BACKFLOW/WINDMILL (EXISTING STUBS) ===================== */
  boolean_T fan_backflow_active;      /* Fan backflow flag */
  double fan_backflow_fraction;       /* Fan backflow fraction */
  double mdot_bypass_backflow;        /* Bypass backflow rate */
  double fan_backflow_torque;         /* Fan backflow torque */
  boolean_T LPC_backflow_active;      /* LPC backflow flag */
  double LPC_backflow_fraction;       /* LPC backflow fraction */
  boolean_T IPC_backflow_active;      /* IPC backflow flag */
  double IPC_backflow_fraction;       /* IPC backflow fraction */
  boolean_T HPC_backflow_active;      /* HPC backflow flag */
  double HPC_backflow_fraction;       /* HPC backflow fraction */
  double mdot_core_backflow;          /* Core backflow rate */
  boolean_T any_backflow_active;      /* Any backflow flag */
  
  /* ===================== FLIGHT PHASE ===================== */
  double flight_phase;                /* Current flight phase */
  
  /* ===================== FAN AERODYNAMICS ===================== */
  double fan_aoa_distribution[20];    /* Fan blade AOA distribution */
  double fan_Cl_distribution[20];     /* Fan blade Cl distribution */
  double fan_Cd_distribution[20];     /* Fan blade Cd distribution */
  double fan_Mach_distribution[20];   /* Fan blade Mach distribution */
  double fan_stall_fraction;          /* Fraction of fan in stall */
  double fan_torque_aero;             /* Aerodynamic torque on fan */
  double fan_efficiency_aero;         /* Aerodynamic fan efficiency */
  double fan_surge_margin;            /* Fan surge margin (%) */
  double fan_incidence_angle;         /* Fan incidence angle */
  
  /* ===================== TIMING ===================== */
  double sim_time;                    /* Simulation time (s) */
  double start_timer;                 /* Start sequence timer */
  boolean_T scenario_running;         /* Scenario in progress */
  double EGT;                         /* Exhaust gas temperature (°C) */
  double starter_factor;              /* Starter torque factor */
  double post_start_timer;            /* Post-start timer */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - WINDMILLING PHYSICS                        */
  /* =====================================================================*/
  double windmill_N1_equilibrium;     /* Equilibrium windmill N1 (%) */
  double windmill_N2_equilibrium;     /* Equilibrium windmill N2 (%) */
  double windmill_N3_equilibrium;     /* Equilibrium windmill N3 (%) */
  double windmill_torque_N1;          /* Windmill aerodynamic torque N1 (Nm) */
  double windmill_torque_N2;          /* Windmill aerodynamic torque N2 (Nm) */
  double windmill_torque_N3;          /* Windmill aerodynamic torque N3 (Nm) */
  double rotation_direction;          /* +1=normal, -1=reverse, 0=stopped */
  boolean_T windmill_mode_active;     /* Windmill mode flag */
  double ram_pressure_recovery;       /* Inlet ram recovery factor */
  double ram_temperature_rise;        /* Inlet ram temp rise (K) */
  double windmill_drag_coefficient;   /* Fan windmill drag coeff */
  double windmill_power_extracted;    /* Power extracted by windmill (W) */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - INFLIGHT RELIGHT                           */
  /* =====================================================================*/
  double relight_altitude_min_ft;     /* Minimum relight altitude (ft) */
  double relight_altitude_max_ft;     /* Maximum relight altitude (ft) */
  double relight_airspeed_min_kts;    /* Minimum relight airspeed (kts) */
  double relight_airspeed_max_kts;    /* Maximum relight airspeed (kts) */
  double relight_probability;         /* Current relight probability (0-1) */
  boolean_T relight_in_envelope;      /* Within relight envelope */
  boolean_T relight_attempt_active;   /* Relight attempt in progress */
  double relight_N3_minimum;          /* Minimum N3 for relight (%) */
  boolean_T windmill_relight_possible;/* Windmill relight available */
  boolean_T starter_relight_possible; /* Starter relight available */
  double combustor_lightoff_temp;     /* Min temp for light-off (K) */
  double fuel_atomization_quality;    /* Fuel spray quality (0-1) */
  double igniter_energy;              /* Igniter energy level (0-1) */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - REVERSE THRUST                             */
  /* =====================================================================*/
  boolean_T reverse_thrust_deployed;  /* Reverser deployed flag */
  double reverse_thrust_position;     /* Reverser position (0-1) */
  double reverse_thrust_value;        /* Reverse thrust magnitude (N) */
  boolean_T reverser_unlocked;        /* Reverser unlock status */
  double reverser_transit_time;       /* Reverser deploy time (s) */
  double reverser_max_thrust_pct;     /* Max reverse thrust (% of forward) */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - VIBRATION MONITORING                       */
  /* =====================================================================*/
  double vibration_N1;                /* N1 vibration level */
  double vibration_N2;                /* N2 vibration level */
  double vibration_N3;                /* N3 vibration level */
  double vibration_N1_max;            /* N1 max vibration limit */
  double vibration_N2_max;            /* N2 max vibration limit */
  double vibration_N3_max;            /* N3 max vibration limit */
  boolean_T vibration_warning;        /* Vibration warning flag */
  boolean_T vibration_exceedance;     /* Vibration limit exceeded */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - SURGE DETECTION/RECOVERY                   */
  /* =====================================================================*/
  boolean_T surge_detected;           /* Surge detected flag */
  boolean_T stall_detected;           /* Compressor stall flag */
  double surge_margin_fan;            /* Fan surge margin (%) */
  double surge_margin_LPC;            /* LPC surge margin (%) */
  double surge_margin_IPC;            /* IPC surge margin (%) */
  double surge_margin_HPC;            /* HPC surge margin (%) */
  double P5_rate;                     /* HPC discharge pressure rate */
  double surge_recovery_timer;        /* Surge recovery timer (s) */
  boolean_T surge_bleed_valve_open;   /* Surge bleed valve status */
  double operating_line_margin;       /* Operating line margin */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - ROTATING STALL PHYSICS                     */
  /* =====================================================================*/
  boolean_T rotating_stall_active;    /* Rotating stall in progress */
  double stall_cell_position;         /* Circumferential position (rad) */
  double stall_cell_speed;            /* Cell rotation speed (rad/s) */
  double stall_cell_speed_ratio;      /* Cell speed / rotor speed (0.3-0.7) */
  int stall_cell_count;               /* Number of stall cells (1-4 typical) */
  double stall_cell_angular_extent;   /* Angular size of each cell (rad) */
  double stall_inception_time;        /* Time when stall initiated (s) */
  double stall_severity;              /* Stall severity factor (0-1) */
  
  /* Per-stage rotating stall tracking */
  boolean_T fan_rotating_stall;       /* Fan in rotating stall */
  boolean_T LPC_rotating_stall;       /* LPC in rotating stall */
  boolean_T IPC_rotating_stall;       /* IPC in rotating stall */
  boolean_T HPC_rotating_stall;       /* HPC in rotating stall */
  
  /* Stall coverage (fraction of annulus blocked) */
  double fan_stall_blockage;          /* Fan flow blockage (0-1) */
  double LPC_stall_blockage;          /* LPC flow blockage (0-1) */
  double IPC_stall_blockage;          /* IPC flow blockage (0-1) */
  double HPC_stall_blockage;          /* HPC flow blockage (0-1) */
  
  /* Deep surge cycling */
  boolean_T deep_surge_active;        /* Deep surge cycling in progress */
  double surge_cycle_phase;           /* Surge cycle phase (0-2π) */
  double surge_cycle_frequency;       /* Surge cycle frequency (Hz) */
  double surge_pressure_amplitude;    /* Pressure oscillation amplitude */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - OIL SYSTEM THERMAL                         */
  /* =====================================================================*/
  double oil_temp_N1_bearing;         /* N1 bearing oil temp (°C) */
  double oil_temp_N2_bearing;         /* N2 bearing oil temp (°C) */
  double oil_temp_N3_bearing;         /* N3 bearing oil temp (°C) */
  double oil_pressure_supply;         /* Oil supply pressure (psi) */
  double oil_pressure_scavenge;       /* Oil scavenge pressure (psi) */
  double oil_flow_rate;               /* Oil flow rate (L/min) */
  double oil_cooler_effectiveness;    /* Oil cooler effectiveness */
  double oil_thermal_mass;            /* Oil system thermal mass */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - COMPRESSOR MAPS                            */
  /* =====================================================================*/
  double fan_operating_point_PR;      /* Fan operating point PR */
  double fan_operating_point_mdot;    /* Fan operating point mdot */
  double LPC_operating_point_PR;      /* LPC operating point PR */
  double IPC_operating_point_PR;      /* IPC operating point PR */
  double HPC_operating_point_PR;      /* HPC operating point PR */
  double fan_efficiency_current;      /* Current fan efficiency */
  double LPC_efficiency_current;      /* Current LPC efficiency */
  double IPC_efficiency_current;      /* Current IPC efficiency */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - VSV/VBV                                    */
  /* =====================================================================*/
  double VSV_position;                /* Variable stator vane position (deg) */
  double VBV_position;                /* Variable bleed valve position (0-1) */
  double VBV_flow;                    /* VBV bleed flow (kg/s) */
  double VSV_efficiency_factor;       /* VSV efficiency multiplier */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - START PROTECTION SYSTEM                    */
  /* =====================================================================*/
  /* Starter Auto-Disconnect */
  boolean_T starter_auto_disconnect;  /* Auto-disconnect triggered */
  double starter_disconnect_N3;       /* N3 at which starter disconnects (%) */
  double starter_max_time;            /* Maximum starter engagement time (s) */
  double starter_engage_time;         /* Current starter engagement time (s) */
  boolean_T starter_timeout;          /* Starter timeout occurred */
  
  /* Hot Start Protection */
  boolean_T hot_start_detected;       /* Hot start detected */
  double hot_start_EGT_limit;         /* EGT limit during start (°C) */
  double hot_start_EGT_peak;          /* Peak EGT during start (°C) */
  double hot_start_margin;            /* Margin to limit (°C) */
  boolean_T hot_start_abort;          /* Start aborted due to hot start */
  
  /* Wet Start Protection */
  boolean_T wet_start_detected;       /* Wet start detected (no lightoff) */
  double wet_start_timer;             /* Time since fuel flow started (s) */
  double wet_start_limit_time;        /* Max time for lightoff (s) */
  boolean_T lightoff_detected;        /* Lightoff confirmed */
  double lightoff_EGT_rise;           /* EGT rise indicating lightoff (°C) */
  double EGT_at_fuel_on;              /* EGT when fuel was enabled */
  
  /* Hung Start Protection */
  boolean_T hung_start_detected;      /* Hung start detected */
  double hung_start_N3_min;           /* Minimum N3 increase rate (%/s) */
  double hung_start_timer;            /* Time at low acceleration (s) */
  double hung_start_limit_time;       /* Max time for hung detect (s) */
  double N3_at_lightoff;              /* N3 when lightoff occurred (%) */
  double N3_target_idle;              /* Target idle N3 (%) */
  boolean_T hung_start_abort;         /* Start aborted due to hung start */
  
  /* Start Sequence Phases */
  double start_EGT_max_seen;          /* Maximum EGT observed during start */
  boolean_T start_sequence_complete;  /* Start sequence finished */
  boolean_T start_success;            /* Start was successful */
  boolean_T start_aborted;            /* Start was aborted */
  double start_abort_reason;          /* 1=hot, 2=wet, 3=hung, 4=timeout */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - SPEED GOVERNORS                            */
  /* =====================================================================*/
  /* Idle Governor */
  boolean_T idle_governor_active;     /* Idle governor engaged */
  double idle_governor_N3_target;     /* Idle governor N3 target (%) */
  double idle_governor_error;         /* Idle governor error */
  double idle_governor_integral;      /* Idle governor integral */
  double idle_governor_output;        /* Idle governor FF trim */
  
  /* N1 Overspeed Governor */
  boolean_T N1_overspeed_governor_active; /* N1 OSG active */
  double N1_overspeed_limit;          /* N1 overspeed limit (%) */
  double N1_overspeed_margin;         /* Margin to limit (%) */
  boolean_T N1_overspeed_warning;     /* N1 approaching limit */
  boolean_T N1_overspeed_protection;  /* N1 limit active fuel cut */
  
  /* N2 Overspeed Governor */
  boolean_T N2_overspeed_governor_active; /* N2 OSG active */
  double N2_overspeed_limit;          /* N2 overspeed limit (%) */
  double N2_overspeed_margin;         /* Margin to limit (%) */
  boolean_T N2_overspeed_warning;     /* N2 approaching limit */
  boolean_T N2_overspeed_protection;  /* N2 limit active fuel cut */
  
  boolean_T N3_overspeed_governor_active; /* N3 OSG active */
  double N3_overspeed_limit;          /* N3 overspeed limit (%) */
  double N3_overspeed_margin;         /* Margin to limit (%) */
  boolean_T N3_overspeed_warning;     /* N3 approaching limit */
  boolean_T N3_overspeed_protection;  /* N3 limit active fuel cut */
  
  /* =====================================================================*/
  /*  ENGINE DEGRADATION MODEL - Flight Hours & Cycles                    */
  /* =====================================================================*/
  double total_flight_hours;          /* Total engine flight hours */
  double total_engine_cycles;         /* Total engine cycles (starts) */
  double hours_since_overhaul;        /* Hours since last overhaul */
  double cycles_since_overhaul;       /* Cycles since last overhaul */
  double hours_since_shop_visit;      /* Hours since last shop visit */
  double cycles_since_shop_visit;     /* Cycles since last shop visit */
  double engine_age_years;            /* Engine calendar age */
  
  /* Time Since New/Overhaul intervals (typical Trent 900) */
  double overhaul_interval_hours;     /* Full overhaul interval (~20000 hrs) */
  double overhaul_interval_cycles;    /* Full overhaul cycles (~6000 cycles) */
  double shop_visit_interval_hours;   /* Shop visit interval (~10000 hrs) */
  double shop_visit_interval_cycles;  /* Shop visit cycles (~3000 cycles) */
  double hot_section_interval_cycles; /* Hot section inspect (~5000 cycles) */
  
  /* =====================================================================*/
  /*  ENGINE DEGRADATION MODEL - Component Health Factors (0.0-1.0)       */
  /* =====================================================================*/
  /* 1.0 = new condition, 0.0 = fully degraded/failed */
  double health_fan;                  /* Fan blade health */
  double health_LPC;                  /* LPC health */
  double health_IPC;                  /* IPC health */
  double health_HPC;                  /* HPC health */
  double health_combustor;            /* Combustor liner health */
  double health_HPT;                  /* HPT health (most critical) */
  double health_IPT;                  /* IPT health */
  double health_LPT;                  /* LPT health */
  double health_overall;              /* Overall engine health */
  
  /* Efficiency degradation factors (multiply design efficiency) */
  double eff_degradation_fan;         /* Fan efficiency factor */
  double eff_degradation_LPC;         /* LPC efficiency factor */
  double eff_degradation_IPC;         /* IPC efficiency factor */
  double eff_degradation_HPC;         /* HPC efficiency factor */
  double eff_degradation_HPT;         /* HPT efficiency factor */
  double eff_degradation_IPT;         /* IPT efficiency factor */
  double eff_degradation_LPT;         /* LPT efficiency factor */
  
  /* =====================================================================*/
  /*  ENGINE DEGRADATION MODEL - Performance Margins                      */
  /* =====================================================================*/
  double EGT_margin_new;              /* EGT margin when new (°C) */
  double EGT_margin_current;          /* Current EGT margin (°C) */
  double EGT_margin_minimum;          /* Minimum acceptable margin (°C) */
  double EGT_margin_loss_rate;        /* Margin loss per 1000 cycles (°C) */
  double thrust_margin_percent;       /* Thrust margin vs rated (%) */
  double SFC_degradation_percent;     /* SFC increase from new (%) */
  double N1_margin_percent;           /* N1 margin available (%) */
  
  /* Tip clearance degradation (affects efficiency) */
  double tip_clearance_fan;           /* Fan tip clearance (mm) */
  double tip_clearance_HPC;           /* HPC tip clearance (mm) */
  double tip_clearance_HPT;           /* HPT tip clearance (mm) */
  double tip_clearance_increase_rate; /* Clearance increase per 1000 hrs */
  
  /* =====================================================================*/
  /*  ENGINE DEGRADATION MODEL - Damage & Wear                            */
  /* =====================================================================*/
  /* Blade erosion (dust, sand, rain) */
  double erosion_fan_leading_edge;    /* Fan LE erosion (0-1) */
  double erosion_LPC_blades;          /* LPC blade erosion */
  double erosion_HPC_blades;          /* HPC blade erosion */
  
  /* Thermal damage (hot section) */
  double thermal_damage_combustor;    /* Combustor thermal damage */
  double thermal_damage_HPT;          /* HPT thermal damage (creep) */
  double thermal_damage_IPT;          /* IPT thermal damage */
  double overtemp_events;             /* Count of EGT exceedances */
  double max_EGT_ever_seen;           /* Peak EGT in engine life */
  
  /* FOD damage tracking */
  boolean_T FOD_damage_present;       /* FOD damage detected */
  double FOD_damage_severity;         /* FOD severity (0-1) */
  double FOD_affected_stage;          /* Which stage damaged */
  
  /* Coating/material degradation */
  double coating_HPT_remaining;       /* HPT TBC remaining (0-1) */
  double coating_combustor_remaining; /* Combustor coating */
  
  /* =====================================================================*/
  /*  ENGINE DEGRADATION MODEL - Maintenance State                        */
  /* =====================================================================*/
  boolean_T needs_borescope;          /* Borescope inspection due */
  boolean_T needs_compressor_wash;    /* Compressor wash recommended */
  boolean_T needs_shop_visit;         /* Shop visit required */
  boolean_T needs_overhaul;           /* Full overhaul required */
  boolean_T on_watch;                 /* Engine under monitoring */
  double days_since_wash;             /* Days since last compressor wash */
  double wash_efficiency_recovery;    /* Efficiency gained from wash (%) */
  boolean_T life_limited_part_due;    /* LLP replacement due */
  
  /* Maintenance action flags */
  boolean_T perform_compressor_wash;  /* Trigger compressor wash */
  boolean_T perform_borescope;        /* Trigger borescope */
  boolean_T perform_shop_visit;       /* Trigger shop visit */
  boolean_T perform_overhaul;         /* Trigger full overhaul */
  boolean_T inject_FOD_damage;        /* Inject FOD event */
  double inject_FOD_severity;         /* Severity of injected FOD */
  
  /* =====================================================================*/
  /*  TEMPERATURE-DEPENDENT IDLE SYSTEM                                   */
  /* =====================================================================*/
  double OAT_celsius;                 /* Outside Air Temperature (°C) */
  double ISA_deviation;               /* ISA temperature deviation (°C) */
  double idle_N1_ground_base;         /* Base ground idle N1 at ISA (%) */
  double idle_N1_flight_base;         /* Base flight idle N1 at ISA (%) */
  double idle_N1_ground_actual;       /* Actual ground idle N1 (%) */
  double idle_N1_flight_actual;       /* Actual flight idle N1 (%) */
  double idle_N1_hot_day_adjustment;  /* Additional N1 for hot day (%) */
  double idle_N1_cold_day_adjustment; /* Reduction for cold day (%) */
  double idle_N3_ground_actual;       /* Actual ground idle N3 (%) */
  double idle_N3_flight_actual;       /* Actual flight idle N3 (%) */
  double idle_EGT_hot_day;            /* EGT at idle on hot day (°C) */
  double idle_EGT_cold_day;           /* EGT at idle on cold day (°C) */
  double idle_FF_hot_day;             /* Fuel flow at idle hot day (kg/s) */
  double idle_FF_cold_day;            /* Fuel flow at idle cold day (kg/s) */
  boolean_T hot_day_operation;        /* Hot day flag (OAT > ISA+15) */
  boolean_T cold_day_operation;       /* Cold day flag (OAT < ISA-15) */
  
  /* =====================================================================*/
  /*  HIGH-FIDELITY THRUST MODEL                                          */
  /* =====================================================================*/
  /* Nozzle parameters */
  double core_nozzle_area;            /* Core nozzle exit area (m^2) */
  double bypass_nozzle_area;          /* Bypass nozzle exit area (m^2) */
  double core_nozzle_velocity;        /* Core exhaust velocity (m/s) */
  double bypass_nozzle_velocity;      /* Bypass exhaust velocity (m/s) */
  double core_nozzle_pressure;        /* Core nozzle exit pressure (Pa) */
  double bypass_nozzle_pressure;      /* Bypass nozzle exit pressure (Pa) */
  boolean_T core_nozzle_choked;       /* Core nozzle choked flow */
  boolean_T bypass_nozzle_choked;     /* Bypass nozzle choked flow */
  
  /* Momentum thrust components */
  double gross_thrust_core;           /* Core gross thrust (N) */
  double gross_thrust_bypass;         /* Bypass gross thrust (N) */
  double gross_thrust_total;          /* Total gross thrust (N) */
  
  /* Ram drag components */
  double ram_drag;                    /* Inlet momentum drag (N) */
  double inlet_mass_flow;             /* Inlet air mass flow (kg/s) */
  double flight_velocity;             /* Aircraft flight velocity (m/s) */
  
  /* Net thrust breakdown */
  double net_thrust_core;             /* Core net thrust (N) */
  double net_thrust_bypass;           /* Bypass net thrust (N) */
  double net_thrust_total;            /* Total net thrust (N) */
  
  /* Pressure thrust components */
  double pressure_thrust_core;        /* Core pressure thrust (N) */
  double pressure_thrust_bypass;      /* Bypass pressure thrust (N) */
  
  /* Thrust coefficients */
  double thrust_coefficient;          /* Cf = Thrust / (q * Aref) */
  double thrust_lapse_rate;           /* Thrust vs altitude factor */
  double thrust_vs_mach;              /* Thrust vs Mach correction */
  
  /* Installation effects */
  double inlet_pressure_recovery;     /* Inlet PR (0.95-1.0 typical) */
  double nozzle_thrust_coefficient;   /* Nozzle Cv (0.98 typical) */
  double installation_loss_factor;    /* Total installation loss */
  double installed_thrust;            /* Installed net thrust (N) */
  
  /* Bleed and power extraction effects on thrust */
  double thrust_loss_from_bleed;      /* Thrust loss from bleed (N) */
  double thrust_loss_from_power;      /* Thrust loss from shaft power (N) */
  
  /* =====================================================================*/
  /*  FAN AERODYNAMICS                                                    */
  /* =====================================================================*/
  double Fan_Tip_Mach;                /* Fan blade tip Mach number */
  double Fan_Blade_Tip_Vel;           /* Fan blade tip velocity (m/s) */
  boolean_T Fan_Supersonic;           /* Flag for supersonic tip condition */
  
  /* =====================================================================*/
  /*  FADEC REDUNDANCY STATE                                              */
  /* =====================================================================*/
  boolean_T Channel_A_Active;         /* FADEC Channel A active */
  boolean_T Channel_B_Active;         /* FADEC Channel B active */
  boolean_T Channel_A_Fault;          /* FADEC Channel A fault */
  boolean_T Channel_B_Fault;          /* FADEC Channel B fault */
  
  /* =====================================================================*/
  /*  EPR PHYSICS                                                         */
  /* =====================================================================*/
  double P20;                         /* Fan inlet total pressure (Pa) */
  double P50;                         /* LPT exit total pressure (Pa) */
  double EPR_Actual;                  /* Actual Engine Pressure Ratio */
  double EPR_Commanded;               /* Commanded EPR target */
  
} struct0_T;
#endif /* typedef_struct0_T */

/*==========================================================================*/
/*  FADEC STATE STRUCTURE (struct1_T)                                        */
/*==========================================================================*/
#ifndef typedef_struct1_T
#define typedef_struct1_T
typedef struct {
  /* ===================== CHANNEL/MODE ===================== */
  double active_channel;              /* Active FADEC channel (1=A, 2=B) */
  boolean_T channel_A_healthy;        /* Channel A health status */
  boolean_T channel_B_healthy;        /* Channel B health status */
  double control_mode;                /* Control mode (1=N1, 2=EPR) */
  double thrust_mode;                 /* Thrust mode (TOGA/MCT/CLB/CRZ/IDLE) */
  
  /* ===================== N1 CONTROL ===================== */
  double N1_cmd;                      /* N1 command (%) */
  double N1_limit;                    /* N1 limit (%) */
  double N1_TOGA;                     /* N1 TOGA setting */
  double N1_MCT;                      /* N1 MCT setting */
  double N1_CLB;                      /* N1 Climb setting */
  double N1_CRZ;                      /* N1 Cruise setting */
  double N1_idle_ground;              /* N1 ground idle */
  double N1_idle_flight;              /* N1 flight idle */
  
  /* ===================== EPR CONTROL ===================== */
  double EPR;                         /* Current EPR */
  double EPR_cmd;                     /* EPR command */
  double EPR_TOGA;                    /* EPR TOGA setting */
  
  /* ===================== FLEX/DERATE ===================== */
  double flex_temp;                   /* FLEX temperature (°C) */
  boolean_T flex_active;              /* FLEX mode active */
  double derate_level;                /* Derate level (0/1/2) */
  
  /* ===================== LIMITS ===================== */
  double EGT_limit;                   /* EGT limit (°C) */
  double EGT_redline;                 /* EGT redline (°C) */
  double EGT_margin;                  /* EGT margin (°C) */
  double accel_limit;                 /* Acceleration limit (%/s) */
  double decel_limit;                 /* Deceleration limit (%/s) */
  
  /* ===================== PID CONTROL ===================== */
  double Kp_N1;                       /* N1 proportional gain */
  double Ki_N1;                       /* N1 integral gain */
  double Kd_N1;                       /* N1 derivative gain */
  double N1_error;                    /* N1 control error */
  double N1_error_int;                /* N1 integral error */
  double N1_error_prev;               /* N1 previous error */
  double N1_cmd_prev;                 /* Previous N1 command */
  double FF_cmd;                      /* Fuel flow command */
  double FF_cmd_raw;                  /* Raw fuel flow command */
  double FF_min;                      /* Minimum fuel flow */
  double FF_max;                      /* Maximum fuel flow */
  
  /* ===================== LIMITING FLAGS ===================== */
  boolean_T EGT_limiting_active;      /* EGT limiting active */
  boolean_T N3_limiting_active;       /* N3 limiting active */
  boolean_T surge_protection_active;  /* Surge protection active */
  boolean_T accel_limiting_active;    /* Accel limit active */
  boolean_T decel_limiting_active;    /* Decel limit active */
  
  /* ===================== THRUST LEVER ===================== */
  double TLA;                         /* Thrust lever angle */
  double TLA_prev;                    /* Previous TLA */
  double TLA_rate;                    /* TLA rate of change */
  
  /* ===================== GOVERNORS ===================== */
  double gov_int_N1;                  /* N1 governor integral */
  double gov_int_N2;                  /* N2 governor integral */
  double gov_int_N3;                  /* N3 governor integral */
  boolean_T idle_governor_active;     /* Idle governor active */
  double gov_trim_total;              /* Total governor trim */
  double Kp_gov_N3;                   /* N3 governor proportional */
  double Ki_gov_N3;                   /* N3 governor integral */
  double Kp_gov_N2;                   /* N2 governor proportional */
  double Ki_gov_N2;                   /* N2 governor integral */
  double Kp_gov_N1;                   /* N1 governor proportional */
  double Ki_gov_N1;                   /* N1 governor integral */
  double gov_antiwindup_limit;        /* Anti-windup limit */
  
  /* ===================== SURGE CONTROL ===================== */
  double surge_margin_target_HPC;     /* Target HPC surge margin */
  double surge_margin_target_fan;     /* Target fan surge margin */
  double Kp_surge;                    /* Surge proportional gain */
  double Ki_surge;                    /* Surge integral gain */
  double surge_error_int;             /* Surge error integral */
  double surge_trim;                  /* Surge protection trim */
  
  /* ===================== TOGA GOVERNOR ===================== */
  double toga_gov_int;                /* TOGA governor integral */
  boolean_T toga_governor_active;     /* TOGA governor active */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - EPR CONTROL MODE                           */
  /* =====================================================================*/
  double EPR_error;                   /* EPR control error */
  double EPR_error_int;               /* EPR integral error */
  double EPR_error_prev;              /* EPR previous error */
  double Kp_EPR;                      /* EPR proportional gain */
  double Ki_EPR;                      /* EPR integral gain */
  double Kd_EPR;                      /* EPR derivative gain */
  double EPR_MCT;                     /* EPR MCT setting */
  double EPR_CLB;                     /* EPR Climb setting */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - DUAL CHANNEL REDUNDANCY                    */
  /* =====================================================================*/
  boolean_T channel_A_fault;          /* Channel A fault detected */
  boolean_T channel_B_fault;          /* Channel B fault detected */
  double channel_A_N1_reading;        /* Channel A N1 sensor */
  double channel_B_N1_reading;        /* Channel B N1 sensor */
  double channel_A_EGT_reading;       /* Channel A EGT sensor */
  double channel_B_EGT_reading;       /* Channel B EGT sensor */
  boolean_T sensor_disagreement;      /* Sensor values disagree */
  double fault_timer;                 /* Fault confirmation timer */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - AUTOTHROTTLE                               */
  /* =====================================================================*/
  boolean_T autothrottle_engaged;     /* A/THR engaged */
  double N1_target_autothrottle;      /* A/THR N1 target */
  double autothrottle_rate_limit;     /* A/THR rate limit (%/s) */
  boolean_T alpha_floor_active;       /* Alpha floor protection */
  boolean_T TOGA_LK_active;           /* TOGA lock active */
  
  /* =====================================================================*/
  /*  NEW ENHANCED VARIABLES - CLIMB DERATE                               */
  /* =====================================================================*/
  double climb_derate_level;          /* Climb derate (0-2) */
  double climb_thrust_reduction;      /* Climb thrust reduction factor */
  double assumed_temp_climb;          /* Assumed temp for climb */
  
} struct1_T;
#endif /* typedef_struct1_T */

/*==========================================================================*/
/*  ACCESSORY SYSTEM STRUCTURE (struct2_T)                                   */
/*==========================================================================*/
#ifndef typedef_struct2_T
#define typedef_struct2_T
typedef struct {
  /* ===================== ACCESSORY GEARBOX ===================== */
  double AGB_ratio;                   /* Gearbox ratio */
  double AGB_efficiency;              /* Gearbox efficiency */
  double AGB_speed;                   /* Gearbox speed (RPM) */
  double AGB_torque_capacity;         /* Max torque capacity (Nm) */
  
  /* ===================== IDG (GENERATOR) ===================== */
  boolean_T IDG_connected;            /* IDG connected */
  double IDG_rated_power;             /* IDG rated power (W) */
  double IDG_efficiency;              /* IDG efficiency */
  double IDG_load_factor;             /* IDG load factor */
  double IDG_frequency;               /* IDG frequency (Hz) */
  double IDG_min_N3;                  /* Min N3 for IDG (%) */
  double P_IDG;                       /* IDG power extraction (W) */
  double IDG_oil_temp;                /* IDG oil temp (°C) */
  double IDG_disconnect_temp;         /* IDG disconnect temp (°C) */
  
  /* ===================== ELECTRICAL LOADS ===================== */
  double elec_galley;                 /* Galley load (kW) */
  double elec_lighting;               /* Lighting load (kW) */
  double elec_avionics;               /* Avionics load (kW) */
  double elec_fuel_pumps;             /* Fuel pump load (kW) */
  double elec_hydraulic;              /* Hydraulic load (kW) */
  double elec_cabin;                  /* Cabin load (kW) */
  double elec_misc;                   /* Misc electrical (kW) */
  
  /* ===================== HYDRAULICS ===================== */
  double HYD_system_count;            /* Number of systems */
  double HYD_pump_displacement;       /* Pump displacement (cc/rev) */
  double HYD_system_pressure;         /* System pressure (Pa) */
  double HYD_pump_efficiency;         /* Pump efficiency */
  double HYD_demand_factor;           /* Demand factor */
  double HYD_min_N3;                  /* Min N3 for hydraulics (%) */
  double P_HYD;                       /* Hydraulic power (W) */
  double HYD_flow_rate;               /* Flow rate (L/min) */
  double HYD_fluid_temp;              /* Fluid temp (°C) */
  double HYD_pressure_green;          /* Green system pressure (Pa) */
  double HYD_pressure_yellow;         /* Yellow system pressure (Pa) */
  boolean_T PTU_active;               /* PTU active */
  double HYD_demand_ground;           /* Ground demand factor */
  double HYD_demand_takeoff;          /* Takeoff demand factor */
  double HYD_demand_cruise;           /* Cruise demand factor */
  double HYD_demand_landing;          /* Landing demand factor */
  
  /* ===================== FUEL SYSTEM ===================== */
  double fuel_pump_stages;            /* Fuel pump stages */
  double fuel_pump_efficiency;        /* Pump efficiency */
  double fuel_LP_pressure;            /* LP fuel pressure (Pa) */
  double fuel_HP_pressure;            /* HP fuel pressure (Pa) */
  double P_fuel_pump;                 /* Fuel pump power (W) */
  double fuel_flow_rate;              /* Fuel flow rate (kg/s) */
  double fuel_temp;                   /* Fuel temperature (°C) */
  boolean_T fuel_heating;             /* Fuel heating active */
  
  /* ===================== OIL SYSTEM ===================== */
  double oil_pump_type;               /* Oil pump type */
  double oil_pump_power_factor;       /* Power factor */
  double oil_pressure;                /* Oil pressure (Pa) */
  double oil_pressure_min;            /* Min oil pressure (Pa) */
  double oil_temp;                    /* Oil temperature (°C) */
  double oil_temp_max;                /* Max oil temp (°C) */
  double P_oil;                       /* Oil pump power (W) */
  double oil_quantity;                /* Oil quantity (L) */
  double oil_consumption;             /* Oil consumption (L/hr) */
  
  /* ===================== BLEED AIR ===================== */
  double P_bleed_total;               /* Total bleed power (W) */
  double P_bleed_HP;                  /* HP bleed power (W) */
  double P_bleed_IP;                  /* IP bleed power (W) */
  double bleed_flow_HP;               /* HP bleed flow (kg/s) */
  double bleed_flow_IP;               /* IP bleed flow (kg/s) */
  double bleed_temp_HP;               /* HP bleed temp (K) */
  double bleed_temp_IP;               /* IP bleed temp (K) */
  double mdot_bleed_total;            /* Total bleed flow (kg/s) */
  double precooler_outlet_temp;       /* Precooler outlet (K) */
  
  /* ===================== BLEED VALVES ===================== */
  boolean_T bleed_valve_HP_open;      /* HP bleed valve open */
  double bleed_valve_HP_position;     /* HP valve position (0-1) */
  double bleed_flow_HP_max;           /* Max HP bleed flow */
  double bleed_pressure_HP;           /* HP bleed pressure (Pa) */
  double HP_bleed_to_packs;           /* HP to packs flow */
  double HP_bleed_to_antiice;         /* HP to anti-ice flow */
  double HP_bleed_to_pressurization;  /* HP to pressurization */
  double HP_bleed_to_hydraulics;      /* HP to hydraulics */
  boolean_T bleed_valve_IP_open;      /* IP bleed valve open */
  double bleed_valve_IP_position;     /* IP valve position (0-1) */
  double bleed_flow_IP_max;           /* Max IP bleed flow */
  double bleed_pressure_IP;           /* IP bleed pressure (Pa) */
  boolean_T precooler_active;         /* Precooler active */
  double precooler_effectiveness;     /* Precooler effectiveness */
  double precooler_fan_air_flow;      /* Fan air to precooler */
  
  /* ===================== ANTI-ICE ===================== */
  boolean_T nacelle_antiice;          /* Nacelle anti-ice on */
  double nacelle_antiice_flow;        /* Nacelle anti-ice flow */
  double nacelle_antiice_flow_req;    /* Required nacelle flow */
  double P_antiice_nacelle;           /* Nacelle anti-ice power */
  boolean_T wing_antiice;             /* Wing anti-ice on */
  double wing_antiice_flow;           /* Wing anti-ice flow */
  double wing_antiice_flow_req;       /* Required wing flow */
  double P_antiice_wing;              /* Wing anti-ice power */
  double TAT_threshold_antiice;       /* TAT threshold for A/I (°C) */
  boolean_T icing_conditions;         /* Icing conditions present */
  
  /* ===================== STARTER ===================== */
  boolean_T starter_active;           /* Starter active */
  double starter_type;                /* Starter type */
  double starter_power;               /* Starter power (W) */
  double starter_air_flow;            /* Starter air flow (kg/s) */
  double starter_source;              /* Starter source */
  double starter_pressure_psi;        /* Starter duct pressure (psi) */
  
  /* ===================== PACKS/ECS ===================== */
  boolean_T pack_1_on;                /* Pack 1 on */
  boolean_T pack_2_on;                /* Pack 2 on */
  double pack_flow_setting;           /* Pack flow setting */
  double pack_flow_lo;                /* Low flow rate */
  double pack_flow_norm;              /* Normal flow rate */
  double pack_flow_hi;                /* High flow rate */
  double pack_outlet_temp;            /* Pack outlet temp (°C) */
  double cabin_altitude;              /* Cabin altitude (ft) */
  double cabin_altitude_target;       /* Target cabin alt (ft) */
  double cabin_diff_pressure;         /* Cabin diff pressure (psi) */
  double cabin_diff_pressure_max;     /* Max cabin diff (psi) */
  
  /* ===================== TOTALS ===================== */
  double P_total_mechanical;          /* Total mechanical power (W) */
  double P_total_bleed;               /* Total bleed power (W) */
  double P_total;                     /* Total accessory power (W) */
  double thrust_loss_bleed;           /* Thrust loss from bleed (N) */
  double thrust_loss_power;           /* Thrust loss from power (N) */
  double sfc_penalty_bleed;           /* SFC penalty from bleed */
  double sfc_penalty_power;           /* SFC penalty from power */
  double total_thrust_penalty;        /* Total thrust penalty (N) */
  
} struct2_T;
#endif /* typedef_struct2_T */

#endif /* TRENT900_ENGINE_SIM_TYPES_H */
/*
 * File trailer for trent900_engine_sim_types.h
 *
 * [EOF]
 */
