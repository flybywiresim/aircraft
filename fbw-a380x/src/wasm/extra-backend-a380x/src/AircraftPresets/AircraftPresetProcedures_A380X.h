// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_AIRCRAFTPRESETPROCEDURES_A32NX_H
#define FLYBYWIRE_AIRCRAFT_AIRCRAFTPRESETPROCEDURES_A32NX_H

#include "AircraftPresets/PresetProceduresDefinition.h"
#include "AircraftPresets/ProcedureStep.h"

/**
 * A380X specific aircraft procedures definition.
 *
 * @see AircraftProceduresDefinition
 *
 * TODO: As A380X development progresses, this file will be updated to reflect the latest procedures.
 */
class AircraftPresetProcedures_A380X {
 public:
  const inline static PresetProceduresDefinition aircraftProcedureDefinition{

  // ProcedureStep definition:
  // ProcedureStep{"Name", Type, Delay, Condition, Action}
  // Type: STEP, EXON, EXOFF, COND, PROC
  // Delay: Delay in milliseconds
  // Condition: Condition to check before executing the action to potentially skip the step if the condition is already
  //            true or if it is a COND step the actual condition to check and wait for it to be true
  // Action: Action to execute to achieve the desired state

  // clang-format off
      // @formatter:off

      .POWERED_CONFIG_ON {
        // SOP: PRELIMINARY COCKPIT PREPARATION
        ProcedureStep{"BAT1 On",                  STEP, 1000, "(L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)",                   "1 (>L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)"},
        ProcedureStep{"BAT ESS On",               STEP, 1000, "(L:A32NX_OVHD_ELEC_BAT_ESS_PB_IS_AUTO)",                 "1 (>L:A32NX_OVHD_ELEC_BAT_ESS_PB_IS_AUTO)"},
        ProcedureStep{"BAT2 On",                  STEP, 1000, "(L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)",                   "1 (>L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)"},
        ProcedureStep{"BAT APU On",               STEP, 3000, "(L:A32NX_OVHD_ELEC_BAT_APU_PB_IS_AUTO)",                 "1 (>L:A32NX_OVHD_ELEC_BAT_APU_PB_IS_AUTO)"},

        ProcedureStep{"EXT PWR 2 On",             STEP, 1000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)",                     "(A:EXTERNAL POWER ON:2, BOOL) ! if{ 2 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 3 On",             STEP, 1000, "(A:EXTERNAL POWER ON:2, BOOL) !",                        "(A:EXTERNAL POWER ON:3, BOOL) ! if{ 3 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 1 On",             STEP, 1000, "(A:EXTERNAL POWER ON:2, BOOL) !",                        "(A:EXTERNAL POWER ON:1, BOOL) ! if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 4 On",             STEP, 3000, "(A:EXTERNAL POWER ON:2, BOOL) !",                        "(A:EXTERNAL POWER ON:4, BOOL) ! if{ 4 (>K:TOGGLE_EXTERNAL_POWER) }"},

        // ENG fire test (the A380X only has on test button and this is currently mapped to the ENG 1 test)
        ProcedureStep{"ENG Fire Test On",         PROC, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)",          "1 (>L:A32NX_OVHD_FIRE_TEST_PB_IS_PRESSED)"},
        ProcedureStep{"ENG Fire Test Off",        PROC, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)",          "0 (>L:A32NX_OVHD_FIRE_TEST_PB_IS_PRESSED) 1 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)"},

        // After fire test we start the APU
        ProcedureStep{"APU Master On",            STEP, 3000, "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                              "(L:A32NX_ENGINE_STATE:2) 1 == && "
                                                              "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 1 == ||",          "1 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
        ProcedureStep{"APU Start On",             STEP, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                              "(L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||",            "1 (>L:A32NX_OVHD_APU_START_PB_IS_ON)"},
        ProcedureStep{"Await AC BUS ON",          COND, 2000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)",                     ""},

        // SOP: COCKPIT PREPARATION
        ProcedureStep{"Crew Oxy On",              STEP, 1000, "(L:PUSH_OVHD_OXYGEN_CREW) 0 ==",                         "0 (>L:PUSH_OVHD_OXYGEN_CREW)"},
        ProcedureStep{"GND CTL On",               STEP, 1000, "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                              "(L:A32NX_ENGINE_STATE:2) 1 == || "
                                                              "(L:A32NX_RCDR_GROUND_CONTROL_ON) 1 == ||",               "1 (>L:A32NX_RCDR_GROUND_CONTROL_ON)"},

        ProcedureStep{"ADIRS 1 Nav",              STEP, 500,  "(L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB) 1 ==",      "1 (>L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 2 Nav",              STEP, 500,  "(L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB) 1 ==",      "1 (>L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 3 Nav",              STEP, 1500, "(L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB) 1 ==",      "1 (>L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB)"},

        ProcedureStep{"Strobe Auto",              STEP, 1000, "(L:LIGHTING_STROBE_0) 1 ==",                             "1 (>L:LIGHTING_STROBE_0)"},
        ProcedureStep{"Nav & Logo Lt On",         STEP, 1000, "(A:LIGHT LOGO, Bool) (A:LIGHT NAV, Bool) &&",            "1 (>K:2:LOGO_LIGHTS_SET) 1 (>K:2:NAV_LIGHTS_SET)"},

        ProcedureStep{"SEAT BELTS On",            STEP, 1000, "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL)",               "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) ! if{ 1 (>K:CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE) }"},
        ProcedureStep{"NO SMOKING Auto",          STEP, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION) 1 ==",   "1 (>L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION)"},
        ProcedureStep{"EMER EXT Lt Arm",          STEP, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION) 1 ==",    "1 (>L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION)"},

        ProcedureStep{"Await APU Avail",          COND, 2000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                              "(L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||",            ""},
        ProcedureStep{"APU Bleed On",             STEP, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                              "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) ||",              "1 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},

        // To allow slats/flaps to retract in expedited mode when engines were running before and slats/flaps were out
        ProcedureStep{"Yellow Elec Pump On",      EXON, 1000, "(L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO) 0 ==",              "0 (>L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO)"},

      },

      .POWERED_CONFIG_OFF = {
        ProcedureStep{"APU Bleed Off",         STEP, 1500, "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) 0 ==",               "0 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
        ProcedureStep{"EMER EXT Lt Off",       STEP, 1500, "(L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION) 2 ==",       "2 (>L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION)"},
        ProcedureStep{"NO SMOKING Off",        STEP, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION) 2 ==",      "2 (>L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION)"},
        ProcedureStep{"SEAT BELTS Off",        STEP, 2000, "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) !",                "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) if{ 1 (>K:CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE) }"},
        ProcedureStep{"Nav & Logo Lt Off",     STEP, 500,  "(A:LIGHT LOGO, Bool) ! (A:LIGHT NAV, Bool) ! &&",           "0 (>K:2:LOGO_LIGHTS_SET) 0 (>K:2:NAV_LIGHTS_SET)"},
        ProcedureStep{"Strobe Off",            STEP, 1000, "(L:LIGHTING_STROBE_0) 2 ==",                                "2 (>L:LIGHTING_STROBE_0)"},
        ProcedureStep{"ADIRS 3 Off",           STEP, 500,  "(L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB) 0 ==",         "0 (>L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 2 Off",           STEP, 500,  "(L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB) 0 ==",         "0 (>L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 1 Off",           STEP, 1000, "(L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB) 0 ==",         "0 (>L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"GND CTL Off",           STEP, 1000, "(L:A32NX_RCDR_GROUND_CONTROL_ON) 0 ==",                     "0 (>L:A32NX_RCDR_GROUND_CONTROL_ON)"},
        ProcedureStep{"Crew Oxy Off",          STEP, 1000, "(L:PUSH_OVHD_OXYGEN_CREW) 1 ==",                            "1 (>L:PUSH_OVHD_OXYGEN_CREW)"},
        ProcedureStep{"APU Master Off",        STEP, 2000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 0 ==",                "0 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
        ProcedureStep{"EXT PWR 4 Off",         STEP, 3000, "(A:EXTERNAL POWER ON:4, BOOL) !",                           "(A:EXTERNAL POWER ON:4, BOOL) if{ 4 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 1 Off",         STEP, 1000, "(A:EXTERNAL POWER ON:1, BOOL) !",                           "(A:EXTERNAL POWER ON:1, BOOL) if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 3 Off",         STEP, 1000, "(A:EXTERNAL POWER ON:3, BOOL) !",                           "(A:EXTERNAL POWER ON:3, BOOL) if{ 3 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 2 Off",         STEP, 3000, "(A:EXTERNAL POWER ON:2, BOOL) !",                           "(A:EXTERNAL POWER ON:2, BOOL) if{ 2 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"BAT APU Off",           STEP, 1000, "(L:A32NX_OVHD_ELEC_BAT_APU_PB_IS_AUTO) 0 ==",               "0 (>L:A32NX_OVHD_ELEC_BAT_APU_PB_IS_AUTO)"},
        ProcedureStep{"BAT2 Off",              STEP, 1000, "(L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO) 0 ==",                 "0 (>L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)"},
        ProcedureStep{"BAT ESS Off",           STEP, 1000, "(L:A32NX_OVHD_ELEC_BAT_ESS_PB_IS_AUTO) 0 ==",               "0 (>L:A32NX_OVHD_ELEC_BAT_ESS_PB_IS_AUTO)"},
        ProcedureStep{"BAT1 Off",              STEP, 1000, "(L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO) 0 ==",                 "0 (>L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)"},
        ProcedureStep{"AC BUS Off Check",      COND, 2000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED) !",                      ""},
        ProcedureStep{"ENG 1 Fire Test Reset", STEP, 0,    "",                                                          "0 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)"},
        ProcedureStep{"FWC Init Reset",        STEP, 0,    "",                                                          "0 (>L:A32NX_AIRCRAFT_PRESET_FWC_INIT_DONE)"}
      },

      .PUSHBACK_CONFIG_ON = {
        // SOP: BEFORE PUSHBACK OR START
        ProcedureStep{"EXT PWR 4 Off",               STEP, 1000, "(A:EXTERNAL POWER ON:4, BOOL) !",                     "(A:EXTERNAL POWER ON:4, BOOL) if{ 4 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 1 Off",               STEP, 1000, "(A:EXTERNAL POWER ON:1, BOOL) !",                     "(A:EXTERNAL POWER ON:1, BOOL) if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 3 Off",               STEP, 1000, "(A:EXTERNAL POWER ON:3, BOOL) !",                     "(A:EXTERNAL POWER ON:3, BOOL) if{ 3 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 2 Off",               STEP, 3000, "(A:EXTERNAL POWER ON:2, BOOL) !",                     "(A:EXTERNAL POWER ON:2, BOOL) if{ 2 (>K:TOGGLE_EXTERNAL_POWER) }"},

        ProcedureStep{"Beacon On",                   STEP, 1000, "(A:LIGHT BEACON, Bool)",                              "0 (>K:BEACON_LIGHTS_ON)"},

        ProcedureStep{"Fuel Pump Feed TK1 Main On",  STEP, 100,  "(A:CIRCUIT CONNECTION ON:2,  Bool)",                   "2 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK1 Stby On",  STEP, 500,  "(A:CIRCUIT CONNECTION ON:3,  Bool)",                   "3 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK2 Main On",  STEP, 100,  "(A:CIRCUIT CONNECTION ON:64, Bool)",                  "64 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK2 Stby On",  STEP, 500,  "(A:CIRCUIT CONNECTION ON:65, Bool)",                  "65 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK3 Main On",  STEP, 100,  "(A:CIRCUIT CONNECTION ON:66, Bool)",                  "66 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK3 Stby On",  STEP, 500,  "(A:CIRCUIT CONNECTION ON:67, Bool)",                  "67 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK4 Main On",  STEP, 100,  "(A:CIRCUIT CONNECTION ON:68, Bool)",                  "68 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK4 Stby On",  STEP, 500,  "(A:CIRCUIT CONNECTION ON:69, Bool)",                  "69 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"Fuel Pump L OUTR TK On",      STEP, 500,  "(A:CIRCUIT CONNECTION ON:70, Bool)",                  "70 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump L MID FWD TK On",   STEP, 100,  "(A:CIRCUIT CONNECTION ON:71, Bool)",                  "71 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump L MID AFT TK On",   STEP, 500,  "(A:CIRCUIT CONNECTION ON:72, Bool)",                  "72 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump L INR FWD TK On",   STEP, 100,  "(A:CIRCUIT CONNECTION ON:73, Bool)",                  "73 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump L INR AFT TK On",   STEP, 500,  "(A:CIRCUIT CONNECTION ON:74, Bool)",                  "74 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump R INR AFT TK On",   STEP, 100,  "(A:CIRCUIT CONNECTION ON:78, Bool)",                  "78 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump R INR FWD TK On",   STEP, 500,  "(A:CIRCUIT CONNECTION ON:79, Bool)",                  "79 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump R MID AFT TK On",   STEP, 100,  "(A:CIRCUIT CONNECTION ON:76, Bool)",                  "76 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump R MID FWD TK On",   STEP, 500,  "(A:CIRCUIT CONNECTION ON:77, Bool)",                  "77 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump R OUTR TK On",      STEP, 500,  "(A:CIRCUIT CONNECTION ON:75, Bool)",                  "75 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"Fuel Trim TK L On",           STEP, 500,  "(A:CIRCUIT CONNECTION ON:80, Bool)",                  "80 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Trim TK R On",           STEP, 500,  "(A:CIRCUIT CONNECTION ON:81, Bool)",                  "81 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"Cockpit Door Locked",         STEP, 2000, "(L:A32NX_COCKPIT_DOOR_LOCKED) 1 ==",                  "1 (>L:A32NX_COCKPIT_DOOR_LOCKED)"},

        ProcedureStep{"Await ADIRS 1 Alignment",     COND,  2000, "(L:A32NX_ADIRS_ADIRU_1_STATE) 2 ==",                 ""},
        ProcedureStep{"Await ADIRS 2 Alignment",     COND,  2000, "(L:A32NX_ADIRS_ADIRU_2_STATE) 2 ==",                 ""},
        ProcedureStep{"Await ADIRS 3 Alignment",     COND,  2000, "(L:A32NX_ADIRS_ADIRU_3_STATE) 2 ==",                 ""},
      },

      .PUSHBACK_CONFIG_OFF = {
        ProcedureStep{"Cockpit Door Open",           STEP, 2000, "(L:A32NX_COCKPIT_DOOR_LOCKED) 0 ==",                  "0 (>L:A32NX_COCKPIT_DOOR_LOCKED)"},

        ProcedureStep{"Fuel Trim TK R Off",          STEP, 500,  "(A:CIRCUIT CONNECTION ON:81, Bool) !",                "81 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Trim TK L Off",          STEP, 500,  "(A:CIRCUIT CONNECTION ON:80, Bool) !",                "80 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"Fuel Pump R OUTR TK Off",     STEP, 500,  "(A:CIRCUIT CONNECTION ON:75, Bool) !",                "75 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump R MID FWD TK Off",  STEP, 500,  "(A:CIRCUIT CONNECTION ON:77, Bool) !",                "77 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump R MID AFT TK Off",  STEP, 100,  "(A:CIRCUIT CONNECTION ON:76, Bool) !",                "76 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump R INR FWD TK Off",  STEP, 500,  "(A:CIRCUIT CONNECTION ON:79, Bool) !",                "79 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump R INR AFT TK Off",  STEP, 100,  "(A:CIRCUIT CONNECTION ON:78, Bool) !",                "78 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump L INR AFT TK Off",  STEP, 500,  "(A:CIRCUIT CONNECTION ON:74, Bool) !",                "74 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump L INR FWD TK Off",  STEP, 100,  "(A:CIRCUIT CONNECTION ON:73, Bool) !",                "73 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump L MID AFT TK Off",  STEP, 500,  "(A:CIRCUIT CONNECTION ON:72, Bool) !",                "72 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump L MID FWD TK Off",  STEP, 100,  "(A:CIRCUIT CONNECTION ON:71, Bool) !",                "71 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump L OUTR TK Off",     STEP, 500,  "(A:CIRCUIT CONNECTION ON:70, Bool) !",                "70 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"Fuel Pump Feed TK4 Stby Off", STEP, 500,  "(A:CIRCUIT CONNECTION ON:69, Bool) !",                "69 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK4 Main Off", STEP, 100,  "(A:CIRCUIT CONNECTION ON:68, Bool) !",                "68 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK3 Stby Off", STEP, 500,  "(A:CIRCUIT CONNECTION ON:67, Bool) !",                "67 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK3 Main Off", STEP, 100,  "(A:CIRCUIT CONNECTION ON:66, Bool) !",                "66 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK2 Stby Off", STEP, 500,  "(A:CIRCUIT CONNECTION ON:65, Bool) !",                "65 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK2 Main Off", STEP, 100,  "(A:CIRCUIT CONNECTION ON:64, Bool) !",                "64 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK1 Stby Off", STEP, 500,  "(A:CIRCUIT CONNECTION ON:3,  Bool) !",                 "3 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"Fuel Pump Feed TK1 Main Off", STEP, 100,  "(A:CIRCUIT CONNECTION ON:2,  Bool) !",                 "2 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"Beacon Off",                  STEP, 1000, "(A:LIGHT BEACON, Bool) !",                            "0 (>K:BEACON_LIGHTS_OFF)"},
      },

      .TAXI_CONFIG_ON = {
        // SOP: ENGINE START
        ProcedureStep{"ENG MODE SEL Start",   STEP, 3000,  "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                           "(L:A32NX_ENGINE_STATE:2) 1 == "
                                                           "(L:A32NX_ENGINE_STATE:3) 1 == "
                                                           "(L:A32NX_ENGINE_STATE:4) 1 == 1 && && && && ",              "2 (>K:TURBINE_IGNITION_SWITCH_SET1) "
                                                                                                                        "2 (>K:TURBINE_IGNITION_SWITCH_SET2) "
                                                                                                                        "2 (>K:TURBINE_IGNITION_SWITCH_SET3) "
                                                                                                                        "2 (>K:TURBINE_IGNITION_SWITCH_SET4)"},

        ProcedureStep{"ENG 1 On",              STEP,  1000, "(A:FUELSYSTEM VALVE OPEN:1, Bool)",                        "1 (>K:FUELSYSTEM_VALVE_OPEN)"},
        ProcedureStep{"ENG 2 On",              STEP, 20000, "(A:FUELSYSTEM VALVE OPEN:2, Bool)",                        "2 (>K:FUELSYSTEM_VALVE_OPEN)"},
        // in normal mode, we wait for the engine 1+2 to be available at this point
        ProcedureStep{"Await ENG 1 Avail",     NCON,  2000, "(L:A32NX_ENGINE_STATE:1) 1 ==",                            ""},
        ProcedureStep{"Await ENG 2 Avail",     NCON,  2000, "(L:A32NX_ENGINE_STATE:2) 1 ==",                            ""},
        ProcedureStep{"ENG 3 On",              STEP,  1000, "(A:FUELSYSTEM VALVE OPEN:3, Bool)",                        "3 (>K:FUELSYSTEM_VALVE_OPEN)"},
        ProcedureStep{"ENG 4 On",              STEP, 20000, "(A:FUELSYSTEM VALVE OPEN:4, Bool)",                        "4 (>K:FUELSYSTEM_VALVE_OPEN)"},
        // in expedited mode, we wait for the engine 1+2 to be available at this point
        ProcedureStep{"Await ENG 1 Avail",     ECON,  2000, "(L:A32NX_ENGINE_STATE:1) 1 ==",                            ""},
        ProcedureStep{"Await ENG 2 Avail",     ECON,  2000, "(L:A32NX_ENGINE_STATE:2) 1 ==",                            ""},
        ProcedureStep{"Await ENG 3 Avail",     COND,  2000, "(L:A32NX_ENGINE_STATE:3) 1 ==",                            ""},
        ProcedureStep{"Await ENG 4 Avail",     COND,  2000, "(L:A32NX_ENGINE_STATE:4) 1 ==",                            ""},

//        // SOP: AFTER START
        ProcedureStep{"ENG MODE SEL Norm",     STEP, 3000,  "(A:TURB ENG IGNITION SWITCH EX1:1, Number) 1 == "
                                                            "(A:TURB ENG IGNITION SWITCH EX1:2, Number) 1 == "
                                                            "(A:TURB ENG IGNITION SWITCH EX1:3, Number) 1 == "
                                                            "(A:TURB ENG IGNITION SWITCH EX1:4, Number) 1 == "
                                                            "0 || || || ||",                                            "1 (>K:TURBINE_IGNITION_SWITCH_SET1) "
                                                                                                                        "1 (>K:TURBINE_IGNITION_SWITCH_SET2) "
                                                                                                                        "1 (>K:TURBINE_IGNITION_SWITCH_SET3) "
                                                                                                                        "1 (>K:TURBINE_IGNITION_SWITCH_SET4)"},

        ProcedureStep{"Yellow Elec Pump Off",  STEP, 1000,  "(L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO) 1 ==",                 "1 (>L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO)"},
        ProcedureStep{"APU Bleed Off",         STEP, 1500,  "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) 0 ==",              "0 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
        ProcedureStep{"APU Master Off",        STEP, 2000,  "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 0 ==",               "0 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},

        ProcedureStep{"Spoiler Arm",           STEP, 2000,  "(L:A32NX_SPOILERS_ARMED) 1 ==",                            "1 (>K:SPOILERS_ARM_SET)"},
        ProcedureStep{"Rudder Trim Reset",     STEP, 2000,  "(A:RUDDER TRIM, Radians) 0 ==",                            "0 (>K:RUDDER_TRIM_SET)"},
        ProcedureStep{"Flaps 1",               STEP, 3000,  "(L:A32NX_FLAPS_HANDLE_INDEX) 1 ==",                        "1 (>L:A32NX_FLAPS_HANDLE_INDEX)"},

        // SOP: TAXI
        ProcedureStep{"NOSE Lt Taxi",          STEP, 1000,  "(A:LIGHT TAXI, Number) 1 ==",                              "1 (>K:TAXI_LIGHTS_ON)"},
        ProcedureStep{"RWY TURN OFF Lt On",    STEP, 1000,  "(A:LIGHT TAXI:2, Number) 1 == "
                                                            "(A:LIGHT TAXI:3, Number) 1 == &&",                         "2 (>K:TAXI_LIGHTS_ON) 3 (>K:TAXI_LIGHTS_ON)"},
        ProcedureStep{"PWS Auto",              STEP, 1000,  "(L:A32NX_SWITCH_RADAR_PWS_POSITION) 1 ==",                 "1 (>L:A32NX_SWITCH_RADAR_PWS_POSITION)"},
        ProcedureStep{"Transponder On",        STEP, 1000,  "(L:A32NX_TRANSPONDER_MODE) 1 ==",                          "1 (>L:A32NX_TRANSPONDER_MODE)"},
        ProcedureStep{"ATC ALT RPTG On",       STEP, 1000,  "(L:A32NX_SWITCH_ATC_ALT) 1 ==",                            "1 (>L:A32NX_SWITCH_ATC_ALT)"},
        ProcedureStep{"TCAS TRAFFIC Abv",      STEP, 2000,  "(L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION) 2 ==",              "2 (>L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION)"},
        ProcedureStep{"Autobrake RTO",         STEP,  200,  "(L:A32NX_AUTOBRAKES_RTO_ARMED) 1 ==",                      "1 (>L:A32NX_OVHD_AUTOBRK_RTO_ARM_IS_PRESSED)"},
        ProcedureStep{"TERR ON ND Capt. On",   STEP, 2000,  "(L:A32NX_EFIS_TERR_L_ACTIVE) 1 ==",                        "1 (>L:A32NX_EFIS_TERR_L_ACTIVE)"},

        ProcedureStep{"T.O. Config",           STEP, 2000,  "",                                                         "1 (>L:A32NX_TO_CONFIG_NORMAL)"},
      },

      .TAXI_CONFIG_OFF = {
        ProcedureStep{"TERR ON ND Capt. Off",  STEP, 2000, "(L:A32NX_EFIS_TERR_L_ACTIVE) 0 ==",                         "0 (>L:A32NX_EFIS_TERR_L_ACTIVE)"},
        ProcedureStep{"Autobrake RTO Off",     STEP,  200, "(L:A32NX_AUTOBRAKES_RTO_ARMED) 0 ==",                       "1 (>L:A32NX_OVHD_AUTOBRK_RTO_ARM_IS_PRESSED)"},
        ProcedureStep{"Autobrake RTO Off",     STEP, 2000, "(L:A32NX_OVHD_AUTOBRK_RTO_ARM_IS_PRESSED) 0 ==",            "0 (>L:A32NX_OVHD_AUTOBRK_RTO_ARM_IS_PRESSED)"},

        ProcedureStep{"TCAS TRAFFIC Abv",      STEP, 1000, "(L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION) 2 ==",               "2 (>L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION)"},
        ProcedureStep{"ATC ALT RPTG Off",      STEP, 1000, "(L:A32NX_SWITCH_ATC_ALT) 1 ==",                             "1 (>L:A32NX_SWITCH_ATC_ALT)"},
        ProcedureStep{"Transponder Off",       STEP, 1000, "(L:A32NX_TRANSPONDER_MODE) 0 ==",                           "0 (>L:A32NX_TRANSPONDER_MODE)"},
        ProcedureStep{"PWS Off",               STEP, 1000, "(L:A32NX_SWITCH_RADAR_PWS_POSITION) 0 ==",                  "0 (>L:A32NX_SWITCH_RADAR_PWS_POSITION)"},

        ProcedureStep{"RWY TURN OFF Lt Off",   STEP, 2000, "(A:LIGHT TAXI:2, Number) 0 == "
                                                           "(A:LIGHT TAXI:3, Number) 0 == &&",                          "2 (>K:TAXI_LIGHTS_OFF) 3 (>K:TAXI_LIGHTS_OFF)"},
        ProcedureStep{"NOSE Lt Taxi",          STEP, 1000, "(A:LIGHT TAXI, Number) 0 == ",                              "1 (>K:TAXI_LIGHTS_OFF)"},

        ProcedureStep{"Flaps 0",               STEP, 2000, "(L:A32NX_FLAPS_HANDLE_INDEX) 0 ==",                         "0 (>L:A32NX_FLAPS_HANDLE_INDEX)"},
        ProcedureStep{"Rudder Trim Reset",     STEP, 2000, "(A:RUDDER TRIM, Radians) 0 ==",                             "0 (>K:RUDDER_TRIM_SET)"},
        ProcedureStep{"Spoiler Disarm",        STEP, 2000, "(L:A32NX_SPOILERS_ARMED) 0 ==",                             "0 (>K:SPOILERS_ARM_SET)"},

        ProcedureStep{"ENG 4 Off",             STEP, 2000, "(A:FUELSYSTEM VALVE OPEN:4, Bool) !",                       "4 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"ENG 3 Off",             STEP, 2000, "(A:FUELSYSTEM VALVE OPEN:3, Bool) !",                       "3 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"ENG 2 Off",             STEP, 2000, "(A:FUELSYSTEM VALVE OPEN:2, Bool) !",                       "2 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"ENG 1 Off",             STEP, 2000, "(A:FUELSYSTEM VALVE OPEN:1, Bool) !",                       "1 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"ENG 4 N1 <3%",          COND,  500, "(L:A32NX_ENGINE_N1:4) 3 <",                                 ""},
        ProcedureStep{"ENG 3 N1 <3%",          COND,  500, "(L:A32NX_ENGINE_N1:3) 3 <",                                 ""},
        ProcedureStep{"ENG 2 N1 <3%",          COND,  500, "(L:A32NX_ENGINE_N1:2) 3 <",                                 ""},
        ProcedureStep{"ENG 1 N1 <3%",          COND,  500, "(L:A32NX_ENGINE_N1:1) 3 <",                                 ""},
      },

      .TAKEOFF_CONFIG_ON = {
      // SOP: TAXI
        //  ProcedureStep{"WX Radar On",          STEP, 1000, "(L:XMLVAR_A320_WEATHERRADAR_SYS) 0 ==",  "0 (>L:XMLVAR_A320_WEATHERRADAR_SYS)"},
        //  ProcedureStep{"WX Radar Mode",        STEP, 1000, "(L:XMLVAR_A320_WEATHERRADAR_MODE) 1 ==", "1 (>L:XMLVAR_A320_WEATHERRADAR_MODE)"},
        // SOP: BEFORE TAKEOFF
        ProcedureStep{"TCAS Switch TA/RA",      STEP, 2000, "(L:A32NX_SWITCH_TCAS_POSITION) 2 ==",                      "2 (>L:A32NX_SWITCH_TCAS_POSITION)"},
        ProcedureStep{"Strobe On",              STEP, 1000, "(L:LIGHTING_STROBE_0) 0 ==",                               "0 (>L:LIGHTING_STROBE_0)"},
        ProcedureStep{"Cabin Read On",          STEP, 1000, "",                                                         "1 (>L:A32NX_CABIN_READY)"},
        ProcedureStep{"Cabin Ready Off",        STEP, 1000, "",                                                         "0 (>L:A32NX_CABIN_READY)"},
        // SOP: TAKE OFF
        ProcedureStep{"NOSE Lt Takeoff",        STEP, 1000, "(A:LIGHT LANDING:1, Number) 1 ==",                         "1 (>K:LANDING_LIGHTS_ON)"},
        ProcedureStep{"Landing Lights On",      STEP, 0,    "(A:LIGHT LANDING:2, Number) 1 ==",                         "2 (>K:LANDING_LIGHTS_ON)"},
      },

      .TAKEOFF_CONFIG_OFF = {
        ProcedureStep{"Landing Lights Off",     STEP, 0,    "(A:LIGHT LANDING:2, Number) 0 ==",                         "2 (>K:LANDING_LIGHTS_OFF)"},
        ProcedureStep{"NOSE Lt Takeoff",        STEP, 2000, "(A:LIGHT LANDING:1, Number) 0 ==",                         "1 (>K:LANDING_LIGHTS_OFF)"},
        ProcedureStep{"Strobe Auto",            STEP, 1000, "(L:LIGHTING_STROBE_0) 1 ==",                               "1 (>L:LIGHTING_STROBE_0)"},

        ProcedureStep{"TCAS Switch TA/RA",      STEP, 1000, "(L:A32NX_SWITCH_TCAS_POSITION) 0 ==",                      "0 (>L:A32NX_SWITCH_TCAS_POSITION)"},
        // ProcedureStep{"WX Radar Mode",        STEP, 1000, "(L:XMLVAR_A320_WEATHERRADAR_MODE) 1 ==",                 "1 (>L:XMLVAR_A320_WEATHERRADAR_MODE)"},
        // ProcedureStep{"WX Radar Off",         STEP, 1000, "(L:XMLVAR_A320_WEATHERRADAR_SYS) 1 ==",                  "1 (>L:XMLVAR_A320_WEATHERRADAR_SYS)"},
      }

      // @formatter:on
  // clang-format on
  };
};

#endif  // FLYBYWIRE_AIRCRAFT_AIRCRAFTPRESETPROCEDURES_A32NX_H
