// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_AIRCRAFTPRESETPROCEDURES_A32NX_H
#define FLYBYWIRE_AIRCRAFT_AIRCRAFTPRESETPROCEDURES_A32NX_H

#include "AircraftPresets/PresetProceduresDefinition.h"
#include "AircraftPresets/ProcedureStep.h"

/**
 * A32NX specific aircraft procedures definition.
 *
 * @see AircraftProceduresDefinition
 */
class AircraftPresetProcedures_A32NX {
 public:
  const inline static PresetProceduresDefinition aircraftProcedureDefinition{
  // clang-format off
      // @formatter:off

      .POWERED_CONFIG_ON {

        // SOP: PRELIMINARY COCKPIT PREPARATION
        ProcedureStep{"BAT1 On",                  STEP, 1000, "(L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)",                   "1 (>L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)"},
        ProcedureStep{"BAT2 On",                  STEP, 3000, "(L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)",                   "1 (>L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)"},

        ProcedureStep{"EXT PWR On",               STEP, 3000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) "
                                                              "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) && "
                                                              "(L:A32NX_ENGINE_STATE:1) 1 == || "
                                                              "(L:A32NX_ENGINE_STATE:2) 1 == || "
                                                              "(A:EXTERNAL POWER ON:1, BOOL) ||",                       "(A:EXTERNAL POWER ON:1, BOOL) ! if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},

        // if no Ext Pwr is available we start the APU here with a bat only fire test
        ProcedureStep{"APU Fire Test On",         PROC, 2000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)",                     "1 (>L:A32NX_FIRE_TEST_APU)"},
        ProcedureStep{"APU Fire Test Off",        PROC, 2000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)",                     "0 (>L:A32NX_FIRE_TEST_APU)"},
        ProcedureStep{"APU Master On",            NOEX, 2000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)",                     "1 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
        ProcedureStep{"APU Start On",             STEP, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                              "(L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||",            "1 (>L:A32NX_OVHD_APU_START_PB_IS_ON)"},

        ProcedureStep{"Await AC BUS ON",          COND,  2000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)",                    ""},

        // SOP: COCKPIT PREPARATION
        ProcedureStep{"Crew Oxy On",              STEP, 1000, "(L:PUSH_OVHD_OXYGEN_CREW) 0 ==",                         "0 (>L:PUSH_OVHD_OXYGEN_CREW)"},
        ProcedureStep{"GND CTL On",               STEP, 1000, "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                              "(L:A32NX_ENGINE_STATE:2) 1 == || "
                                                              "(L:A32NX_RCDR_GROUND_CONTROL_ON) 1 == ||",               "1 (>L:A32NX_RCDR_GROUND_CONTROL_ON)"},
        ProcedureStep{"CVR Test On",              PROC, 5000, "(L:A32NX_AIRCRAFT_PRESET_CVR_TEST_DONE)",                "1 (>L:A32NX_RCDR_TEST)"},
        ProcedureStep{"CVR Test Off",             PROC, 2000, "(L:A32NX_AIRCRAFT_PRESET_CVR_TEST_DONE)",                "0 (>L:A32NX_RCDR_TEST) 1 (>L:A32NX_AIRCRAFT_PRESET_CVR_TEST_DONE)"},

        ProcedureStep{"ADIRS 1 Nav",              STEP, 500,  "(L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB) 1 ==",      "1 (>L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 2 Nav",              STEP, 500,  "(L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB) 1 ==",      "1 (>L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 3 Nav",              STEP, 1500, "(L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB) 1 ==",      "1 (>L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB)"},

        ProcedureStep{"Strobe Auto",              STEP, 50,   "(L:LIGHTING_STROBE_0) 1 ==",                             "0 (>L:STROBE_0_AUTO) 0 (>K:STROBES_OFF)"},
        ProcedureStep{"Strobe Auto",              STEP, 1000, "(L:LIGHTING_STROBE_0) 1 ==",                             "1 (>L:STROBE_0_AUTO) 0 (>K:STROBES_ON)"},
        ProcedureStep{"Nav & Logo Lt On",         STEP, 1000, "(A:LIGHT LOGO, Bool) (A:LIGHT NAV, Bool) &&",            "1 (>K:2:LOGO_LIGHTS_SET) 1 (>K:2:NAV_LIGHTS_SET)"},

        ProcedureStep{"SEAT BELTS On",            STEP, 1000, "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL)",               "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) ! if{ 1 (>K:CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE) }"},
        ProcedureStep{"NO SMOKING Auto",          STEP, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION) 1 ==",   "1 (>L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION)"},
        ProcedureStep{"EMER EXT Lt Arm",          STEP, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION) 1 ==",    "1 (>L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION)"},

        // For the fire tests, the FWC needs to be initialized
        // The correct variables to wait for are: A32NX_FWS_FWC_1_NORMAL and A32NX_FWS_FWC_2_NORMAL.
        // Alternatively, A32NX_FWC_FLIGHT_PHASE can be used  for this specific purpose.
        ProcedureStep{"Await FWC Init",           COND, 5000, "(L:A32NX_FWC_FLIGHT_PHASE)",                             ""},
        // do not skip delay in expedited mode as the initialization would fail (cause unknown)
        ProcedureStep{"Waiting...",               NOEX, 1000, "(L:A32NX_AIRCRAFT_PRESET_FWC_INIT_DONE)",                "1 (>L:A32NX_AIRCRAFT_PRESET_FWC_INIT_DONE)"},

        // APU fire test
        ProcedureStep{"APU Fire Test On",         PROC, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_APU_DONE)",           "1 (>L:A32NX_FIRE_TEST_APU)"},
        ProcedureStep{"APU Fire Test Off",        PROC, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_APU_DONE)",           "0 (>L:A32NX_FIRE_TEST_APU) 1 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_APU_DONE)"},

        // After fire test we start the APU
        ProcedureStep{"APU Master On",            STEP, 3000, "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                              "(L:A32NX_ENGINE_STATE:2) 1 == && "
                                                              "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 1 == ||",          "1 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
        ProcedureStep{"APU Start On",             STEP, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                              "(L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||",            "1 (>L:A32NX_OVHD_APU_START_PB_IS_ON)"},

        // ENG fire test
        ProcedureStep{"ENG 1 Fire Test On",       PROC, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)",          "1 (>L:A32NX_FIRE_TEST_ENG1)"},
        ProcedureStep{"ENG 1 Fire Test Off",      PROC, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)",          "0 (>L:A32NX_FIRE_TEST_ENG1) 1 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)"},
        ProcedureStep{"ENG 2 Fire Test On",       PROC, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG2_DONE)",          "1 (>L:A32NX_FIRE_TEST_ENG2)"},
        ProcedureStep{"ENG 2 Fire Test Off",      PROC, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG2_DONE)",          "0 (>L:A32NX_FIRE_TEST_ENG2) 1 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG2_DONE)"},

        ProcedureStep{"Await APU Avail",          COND,  2000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                               "(L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||",           ""},
        ProcedureStep{"APU Bleed On",             STEP, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                              "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) ||",              "1 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},

        // To allow slats/flaps to retract in expedited mode when engines were running before and slats/flaps were out
        // TODO: Check if the flaps are actually out
        ProcedureStep{"Yellow Elec Pump On",      EXON, 1000, "(L:A32NX_LEFT_FLAPS_POSITION_PERCENT) 0 == "
                                                              "(L:A32NX_RIGHT_FLAPS_POSITION_PERCENT) 0 == && "
                                                              "(L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO) 0 == ||",           "0 (>L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO)"},

        //WORKAROUND for intermittent HOT AIR PB Fault when using expedited mode
        ProcedureStep{"HOT AIR PB Reset",        STEP, 0,    "(L:A32NX_OVHD_COND_HOT_AIR_PB_HAS_FAULT) 0 ==",           "0 (>L:A32NX_OVHD_COND_HOT_AIR_PB_IS_ON) "},
        ProcedureStep{"HOT AIR PB Reset",        STEP, 0,    "(L:A32NX_OVHD_COND_HOT_AIR_PB_IS_ON) 1 ==",               "1 (>L:A32NX_OVHD_COND_HOT_AIR_PB_IS_ON) "},
      },

      .POWERED_CONFIG_OFF = {
        ProcedureStep{"NO SMOKING Off",        STEP, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION) 2 ==",      "2 (>L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION)"},
        ProcedureStep{"EMER EXT Lt Off",       STEP, 1500, "(L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION) 2 ==",       "2 (>L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION)"},
        ProcedureStep{"GND CTL Off",           STEP, 1000, "(L:A32NX_RCDR_GROUND_CONTROL_ON) 0 ==",                     "0 (>L:A32NX_RCDR_GROUND_CONTROL_ON)"},
        ProcedureStep{"SEAT BELTS Off",        STEP, 2000, "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) !",                "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) if{ 1 (>K:CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE) }"},
        ProcedureStep{"Strobe Off",            STEP, 1000, "(L:LIGHTING_STROBE_0) 2 ==",                                "0 (>L:STROBE_0_AUTO) 0 (>K:STROBES_OFF)"},
        ProcedureStep{"Nav & Logo Lt Off",     STEP, 500,  "(A:LIGHT LOGO, Bool) ! (A:LIGHT NAV, Bool) ! &&",           "0 (>K:2:LOGO_LIGHTS_SET) 0 (>K:2:NAV_LIGHTS_SET)"},
        ProcedureStep{"Crew Oxy Off",          STEP, 1000, "(L:PUSH_OVHD_OXYGEN_CREW) 1 ==",                            "1 (>L:PUSH_OVHD_OXYGEN_CREW)"},
        ProcedureStep{"ADIRS 3 Off",           STEP, 500,  "(L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB) 0 ==",         "0 (>L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 2 Off",           STEP, 500,  "(L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB) 0 ==",         "0 (>L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 1 Off",           STEP, 1000, "(L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB) 0 ==",         "0 (>L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"APU Bleed Off",         STEP, 1500, "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) 0 ==",               "0 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
        ProcedureStep{"APU Master Off",        STEP, 2000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 0 ==",                "0 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
        ProcedureStep{"EXT PWR Off",           STEP, 3000, "(A:EXTERNAL POWER ON:1, BOOL) !",                           "(A:EXTERNAL POWER ON:1, BOOL) if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"BAT2 Off",              STEP, 100,  "(L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO) 0 ==",                 "0 (>L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)"},
        ProcedureStep{"BAT1 Off",              STEP, 1000, "(L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO) 0 ==",                 "0 (>L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)"},
        ProcedureStep{"AC BUS Off Check",      COND, 2000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED) !",                      ""},

        ProcedureStep{"CVR Test Reset",        STEP, 0,    "",                                                          "0 (>L:A32NX_AIRCRAFT_PRESET_CVR_TEST_DONE)"},
        ProcedureStep{"APU Fire Test Reset",   STEP, 0,    "",                                                          "0 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_APU_DONE)"},
        ProcedureStep{"ENG 1 Fire Test Reset", STEP, 0,    "",                                                          "0 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)"},
        ProcedureStep{"ENG 2 Fire Test Reset", STEP, 0,    "",                                                          "0 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG2_DONE)"},
        ProcedureStep{"FWC Init Reset",        STEP, 0,    "",                                                          "0 (>L:A32NX_AIRCRAFT_PRESET_FWC_INIT_DONE)"}
      },

      .PUSHBACK_CONFIG_ON = {
        // SOP: BEFORE PUSHBACK OR START
        ProcedureStep{"EXT PWR Off",             STEP, 3000, "(A:EXTERNAL POWER ON:1, BOOL) !",                         "(A:EXTERNAL POWER ON:1, BOOL) if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"Beacon On",               STEP, 2000, "(A:LIGHT BEACON, Bool)",                                  "0 (>K:BEACON_LIGHTS_ON)"},
        ProcedureStep{"FUEL PUMP 2 On",          STEP, 100,  "(A:FUELSYSTEM PUMP SWITCH:2, Bool)",                      "2 (>K:FUELSYSTEM_PUMP_ON)"},
        ProcedureStep{"FUEL PUMP 5 On",          STEP, 500,  "(A:FUELSYSTEM PUMP SWITCH:5, Bool)",                      "5 (>K:FUELSYSTEM_PUMP_ON)"},
        ProcedureStep{"FUEL VALVE 9 On",         STEP, 100,  "(A:FUELSYSTEM VALVE SWITCH:9, Bool)",                     "9 (>K:FUELSYSTEM_VALVE_OPEN)"},
        ProcedureStep{"FUEL VALVE 10 On",        STEP, 500,  "(A:FUELSYSTEM VALVE SWITCH:10, Bool)",                    "10 (>K:FUELSYSTEM_VALVE_OPEN)"},
        ProcedureStep{"FUEL PUMP 3 On",          STEP, 100,  "(A:FUELSYSTEM PUMP SWITCH:3, Bool)",                      "3 (>K:FUELSYSTEM_PUMP_ON)"},
        ProcedureStep{"FUEL PUMP 6 On",          STEP, 2000, "(A:FUELSYSTEM PUMP SWITCH:6, Bool)",                      "6 (>K:FUELSYSTEM_PUMP_ON)"},
        // Step will keep a delay as the A32NX otherwise often did not start up the ENG2 - reason unknown but likely some nondeterministic delay
        ProcedureStep{"Cockpit Door Locked",     NOEX, 2000, "(L:A32NX_COCKPIT_DOOR_LOCKED) 1 ==",                      "1 (>L:A32NX_COCKPIT_DOOR_LOCKED)"},

        ProcedureStep{"Await ADIRS 1 Alignment", COND, 2000, "(L:A32NX_ADIRS_ADIRU_1_STATE) 2 ==",                      ""},
        ProcedureStep{"Await ADIRS 2 Alignment", COND, 2000, "(L:A32NX_ADIRS_ADIRU_2_STATE) 2 ==",                      ""},
        ProcedureStep{"Await ADIRS 3 Alignment", COND, 2000, "(L:A32NX_ADIRS_ADIRU_3_STATE) 2 ==",                      ""},
      },

      .PUSHBACK_CONFIG_OFF = {
        ProcedureStep{"Cockpit Door open",    STEP, 2000, "(L:A32NX_COCKPIT_DOOR_LOCKED) 0 ==",                         "0 (>L:A32NX_COCKPIT_DOOR_LOCKED)"},
        ProcedureStep{"Fuel Pump 2 Off",      STEP,  100, "(A:FUELSYSTEM PUMP SWITCH:2, Bool) !",                       "2 (>K:FUELSYSTEM_PUMP_OFF)"},
        ProcedureStep{"Fuel Pump 5 Off",      STEP,  500, "(A:FUELSYSTEM PUMP SWITCH:5, Bool) !",                       "5 (>K:FUELSYSTEM_PUMP_OFF)"},
        ProcedureStep{"Fuel Valve 9 Off",     STEP,  100, "(A:FUELSYSTEM VALVE SWITCH:9, Bool) !",                      "9 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"Fuel Valve 10 Off",    STEP,  500, "(A:FUELSYSTEM VALVE SWITCH:10, Bool) !",                     "10 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"Fuel Pump 3 Off",      STEP,  100, "(A:FUELSYSTEM PUMP SWITCH:3, Bool) !",                       "3 (>K:FUELSYSTEM_PUMP_OFF)"},
        ProcedureStep{"Fuel Pump 6 Off",      STEP, 1000, "(A:FUELSYSTEM PUMP SWITCH:6, Bool) !",                       "6 (>K:FUELSYSTEM_PUMP_OFF)"},
        ProcedureStep{"Beacon Off",           STEP, 1000, "(A:LIGHT BEACON, Bool) !",                                   "0 (>K:BEACON_LIGHTS_OFF)"},
      },

      .TAXI_CONFIG_ON = {
        // SOP: ENGINE START
        ProcedureStep{"ENG MODE SEL START",   STEP, 3000,  "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                           "(L:A32NX_ENGINE_STATE:2) 1 == && ",                         "2 (>K:TURBINE_IGNITION_SWITCH_SET2) "
                                                                                                                        "2 (>K:TURBINE_IGNITION_SWITCH_SET1)"},

        ProcedureStep{"ENG 2 On",             STEP, 60000, "(A:FUELSYSTEM VALVE OPEN:2, Bool)",                         "2 (>K:FUELSYSTEM_VALVE_OPEN)"},
        // in normal mode, we wait for the engine 2 to be available at this point
        ProcedureStep{"Await ENG 2 Avail",    NCON,  2000,  "(L:A32NX_ENGINE_STATE:2) 1 ==",                            ""},
        ProcedureStep{"ENG 1 On",             STEP,  2000,  "(A:FUELSYSTEM VALVE OPEN:1, Bool)",                        "1 (>K:FUELSYSTEM_VALVE_OPEN)"},
        // in expedited mode, we wait for the engine 2 to be available at this point
        ProcedureStep{"Await ENG 2 Avail",    ECON,  2000,  "(L:A32NX_ENGINE_STATE:2) 1 ==",                            ""},
        ProcedureStep{"Await ENG 1 Avail",    COND,  5000,  "(L:A32NX_ENGINE_STATE:1) 1 ==",                            ""},
        // SOP: AFTER START
        ProcedureStep{"ENG MODE SEL Norm",    STEP, 3000,  "",                                                          "1 (>K:TURBINE_IGNITION_SWITCH_SET1) "
                                                                                                                        "1 (>K:TURBINE_IGNITION_SWITCH_SET2) "},

        ProcedureStep{"Yellow Elec Pump Off", STEP, 1000,  "(L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO) 1 ==",                 "1 (>L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO)"},
        ProcedureStep{"APU Bleed Off",        STEP, 2000,  "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) 0 ==",               "0 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
        ProcedureStep{"APU Master Off",       STEP, 2000,  "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 0 ==",                "0 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
        ProcedureStep{"Spoiler Arm",          STEP, 2000,  "(L:A32NX_SPOILERS_ARMED) 1 ==",                             "1 (>K:SPOILERS_ARM_SET)"},
        ProcedureStep{"Rudder Trim Reset",    STEP, 2000,  "(A:RUDDER TRIM, Radians) 0 ==",                             "0 (>K:RUDDER_TRIM_SET)"},
        ProcedureStep{"Flaps 1",              STEP, 3000,  "(L:A32NX_FLAPS_HANDLE_INDEX) 1 ==",                         "1 (>L:A32NX_FLAPS_HANDLE_INDEX)"},
        // SOP: TAXI
        ProcedureStep{"NOSE Lt Taxi",         STEP, 1000,  "(A:CIRCUIT SWITCH ON:20, Bool)",                            "0 (>L:LIGHTING_LANDING_1) (A:CIRCUIT SWITCH ON:20, Bool) ! if{ 20 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
        ProcedureStep{"RWY TURN OFF Lt L On", STEP, 0,     "(A:CIRCUIT SWITCH ON:21, Bool)",                            "(A:CIRCUIT SWITCH ON:21, Bool) ! if{ 21 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
        ProcedureStep{"RWY TURN OFF Lt R On", STEP, 2000,  "(A:CIRCUIT SWITCH ON:22, Bool)",                            "(A:CIRCUIT SWITCH ON:22, Bool) ! if{ 22 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
        ProcedureStep{"PWS Auto",             STEP, 1000,  "(L:A32NX_SWITCH_RADAR_PWS_POSITION) 1 ==",                  "1 (>L:A32NX_SWITCH_RADAR_PWS_POSITION)"},
        ProcedureStep{"Transponder On",       STEP, 1000,  "(L:A32NX_TRANSPONDER_MODE) 1 ==",                           "1 (>L:A32NX_TRANSPONDER_MODE)"},
        ProcedureStep{"ATC ALT RPTG On",      STEP, 1000,  "(L:A32NX_SWITCH_ATC_ALT) 1 ==",                             "1 (>L:A32NX_SWITCH_ATC_ALT)"},
        ProcedureStep{"TCAS TRAFFIC Abv",     STEP, 2000,  "(L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION) 2 ==",               "2 (>L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION)"},
        ProcedureStep{"Autobrake Max",        STEP, 2000,  "(L:A32NX_AUTOBRAKES_ARMED_MODE) 3 ==",                      "3 (>L:A32NX_AUTOBRAKES_ARMED_MODE_SET)"},
        ProcedureStep{"TERR ON ND Capt. On",  STEP, 2000,  "(L:A32NX_EFIS_TERR_L_ACTIVE) 1 ==",                         "1 (>L:A32NX_EFIS_TERR_L_ACTIVE)"},

        ProcedureStep{"Await Flaps 1+F",      3110, true,  1000,  "",                                                 "(L:A32NX_LEFT_FLAPS_POSITION_PERCENT) 24 >= "
                                                                                                                      "(L:A32NX_RIGHT_FLAPS_POSITION_PERCENT) 24 >= && "},
        ProcedureStep{"Await Slats 1+F",      3110, true,  1000,  "",                                                 "(L:A32NX_LEFT_SLATS_POSITION_PERCENT) 66 >= "
                                                                                                                      "(L:A32NX_RIGHT_SLATS_POSITION_PERCENT) 66 >= && "},

        ProcedureStep{"T.O Config",           STEP, 200,   "",                                                          "1 (>L:A32NX_BTN_TOCONFIG)"},
        ProcedureStep{"T.O Config",           STEP, 2000,  "",                                                          "0 (>L:A32NX_BTN_TOCONFIG)"},
      },

      .TAXI_CONFIG_OFF = {
        ProcedureStep{"TERR ON ND Capt. Off",  STEP, 2000, "(L:A32NX_EFIS_TERR_L_ACTIVE) 0 ==",                         "0 (>L:A32NX_EFIS_TERR_L_ACTIVE)"},
        ProcedureStep{"Autobrake Off",         STEP, 2000, "(L:A32NX_AUTOBRAKES_ARMED_MODE) 0 ==",                      "0 (>L:A32NX_AUTOBRAKES_ARMED_MODE_SET)"},
        ProcedureStep{"TCAS TRAFFIC Abv",      STEP, 1000, "(L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION) 2 ==",               "2 (>L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION)"},
        ProcedureStep{"ATC ALT RPTG Off",      STEP, 1000, "(L:A32NX_SWITCH_ATC_ALT) 1 ==",                             "1 (>L:A32NX_SWITCH_ATC_ALT)"},
        ProcedureStep{"Transponder Off",       STEP, 1000, "(L:A32NX_TRANSPONDER_MODE) 0 ==",                           "0 (>L:A32NX_TRANSPONDER_MODE)"},
        ProcedureStep{"PWS Off",               STEP, 1000, "(L:A32NX_SWITCH_RADAR_PWS_POSITION) 0 ==",                  "0 (>L:A32NX_SWITCH_RADAR_PWS_POSITION)"},
        ProcedureStep{"RWY TURN OFF Lt L Off", STEP, 0,    "(A:CIRCUIT SWITCH ON:21, Bool) !",                          "(A:CIRCUIT SWITCH ON:21, Bool) if{ 21 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
        ProcedureStep{"RWY TURN OFF Lt R Off", STEP, 2000, "(A:CIRCUIT SWITCH ON:22, Bool) !",                          "(A:CIRCUIT SWITCH ON:22, Bool) if{ 22 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
        ProcedureStep{"NOSE Lt Taxi",          STEP, 1000, "(A:CIRCUIT SWITCH ON:20, Bool) !",                          "2 (>L:LIGHTING_LANDING_1) (A:CIRCUIT SWITCH ON:20, Bool) if{ 20 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
        ProcedureStep{"Flaps 0",               STEP, 2000, "(L:A32NX_FLAPS_HANDLE_INDEX) 0 ==",                         "0 (>L:A32NX_FLAPS_HANDLE_INDEX)"},
        ProcedureStep{"Rudder Trim Reset",     STEP, 2000, "(A:RUDDER TRIM, Radians) 0 ==",                             "0 (>K:RUDDER_TRIM_SET)"},
        ProcedureStep{"Spoiler Disarm",        STEP, 2000, "(L:A32NX_SPOILERS_ARMED) 0 ==",                             "0 (>K:SPOILERS_ARM_SET)"},
        ProcedureStep{"Await Flaps 0",         NCON, 1000, "(L:A32NX_LEFT_FLAPS_POSITION_PERCENT) 0 =="
                                                           "(L:A32NX_RIGHT_FLAPS_POSITION_PERCENT) 0 == &&",            ""},
        ProcedureStep{"Await Slats 0",         NCON, 1000, "(L:A32NX_LEFT_SLATS_POSITION_PERCENT) 0 == "
                                                           "(L:A32NX_RIGHT_SLATS_POSITION_PERCENT) 0 == &&",            ""},

        ProcedureStep{"ENG 1 Off",             STEP, 2000, "(A:FUELSYSTEM VALVE OPEN:1, Bool) !",                       "1 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"ENG 2 Off",             STEP, 2000, "(A:FUELSYSTEM VALVE OPEN:2, Bool) !",                       "2 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"ENG 1 N1 <3%",          COND,  1000, "(L:A32NX_ENGINE_N1:1) 3 <",                                ""},
        ProcedureStep{"ENG 2 N1 <3%",          COND,  1000, "(L:A32NX_ENGINE_N1:2) 3 <",                                ""},
      },

      .TAKEOFF_CONFIG_ON = {
        // SOP: TAXI
        ProcedureStep{"WX Radar On",       STEP, 1000, "(L:XMLVAR_A320_WEATHERRADAR_SYS) 0 ==",                         "0 (>L:XMLVAR_A320_WEATHERRADAR_SYS)"},
        ProcedureStep{"WX Radar Mode",     STEP, 1000, "(L:XMLVAR_A320_WEATHERRADAR_MODE) 1 ==",                        "1 (>L:XMLVAR_A320_WEATHERRADAR_MODE)"},
        // SOP: BEFORE TAKEOFF
        ProcedureStep{"TCAS Switch TA/RA", STEP, 2000, "(L:A32NX_SWITCH_TCAS_POSITION) 2 ==",                           "2 (>L:A32NX_SWITCH_TCAS_POSITION)"},
        // unfortunately, strobe 3-way switch control is weird, so we have to use a workaround and turn it off first
        ProcedureStep{"Strobe On"  ,       STEP, 50,   "(L:LIGHTING_STROBE_0) 0 ==",                                    "0 (>L:STROBE_0_AUTO) 0 (>K:STROBES_OFF)"},
        ProcedureStep{"Strobe On",         STEP, 1000, "(L:LIGHTING_STROBE_0) 0 ==",                                    "0 (>L:STROBE_0_AUTO) 0 (>K:STROBES_ON)"},
        ProcedureStep{"Cabin Ready",       STEP, 1000, "",                                                              "1 (>L:A32NX_CABIN_READY)"},
        // SOP: TAKE OFF
        ProcedureStep{"NOSE Lt Takeoff",   STEP, 1000, "(A:CIRCUIT SWITCH ON:17, Bool)",                                "(A:CIRCUIT SWITCH ON:17, Bool) ! if{ 17 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
        ProcedureStep{"LL Lt L On",        STEP, 0,    "(A:CIRCUIT SWITCH ON:18, Bool)",                                "0 (>L:LIGHTING_LANDING_2) 0 (>L:LANDING_2_RETRACTED) (A:CIRCUIT SWITCH ON:18, Bool) ! if{ 18 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
        ProcedureStep{"LL Lt R On",        STEP, 1000, "(A:CIRCUIT SWITCH ON:19, Bool)",                                "0 (>L:LIGHTING_LANDING_3) 0 (>L:LANDING_3_RETRACTED) (A:CIRCUIT SWITCH ON:19, Bool) ! if{ 19 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
      },

      .TAKEOFF_CONFIG_OFF = {
        ProcedureStep{"LL Lt L Off",       STEP, 0,    "(A:CIRCUIT SWITCH ON:18, Bool) ! (L:LANDING_2_RETRACTED) &&",   "2 (>L:LIGHTING_LANDING_2) 1 (>L:LANDING_2_RETRACTED) (A:CIRCUIT SWITCH ON:18, Bool) if{ 18 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
        ProcedureStep{"LL Lt R Off",       STEP, 1000, "(A:CIRCUIT SWITCH ON:19, Bool) ! (L:LANDING_3_RETRACTED) &&",   "2 (>L:LIGHTING_LANDING_3) 1 (>L:LANDING_3_RETRACTED) (A:CIRCUIT SWITCH ON:19, Bool) if{ 19 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
        ProcedureStep{"NOSE Lt Takeoff",   STEP, 2000, "(A:CIRCUIT SWITCH ON:17, Bool) !",                              "(A:CIRCUIT SWITCH ON:17, Bool) if{ 17 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
        // unfortunately, strobe 3-way switch control is weird, so we have to use a workaround and turn it off first
        ProcedureStep{"Strobe Auto",       STEP, 50,   "(L:LIGHTING_STROBE_0) 0 == (L:LIGHTING_STROBE_0) 1 == ||",      "0 (>L:STROBE_0_AUTO) 0 (>K:STROBES_OFF)"},
        ProcedureStep{"Strobe Auto",       STEP, 1000, "(L:A32NX_ENGINE_STATE:1) 0 == (L:A32NX_ENGINE_STATE:2) 0 == && "
                                                       "(L:LIGHTING_STROBE_0) 1 == || ",                                "1 (>L:STROBE_0_AUTO) 0 (>K:STROBES_ON)"},
        ProcedureStep{"TCAS Switch TA/RA", STEP, 1000, "(L:A32NX_SWITCH_TCAS_POSITION) 0 ==",                           "0 (>L:A32NX_SWITCH_TCAS_POSITION)"},
        ProcedureStep{"WX Radar Mode",     STEP, 1000, "(L:XMLVAR_A320_WEATHERRADAR_MODE) 1 ==",                        "1 (>L:XMLVAR_A320_WEATHERRADAR_MODE)"},
        ProcedureStep{"WX Radar Off",      STEP, 1000, "(L:XMLVAR_A320_WEATHERRADAR_SYS) 1 ==",                         "1 (>L:XMLVAR_A320_WEATHERRADAR_SYS)"},
      }

      // @formatter:on
  // clang-format on
  };
};

#endif  // FLYBYWIRE_AIRCRAFT_AIRCRAFTPRESETPROCEDURES_A32NX_H
