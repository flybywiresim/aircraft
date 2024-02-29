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
      // clang-format off
      // @formatter:off

      .POWERED_CONFIG_ON {
        // SOP: PRELIMINARY COCKPIT PREPARATION
        ProcedureStep{"BAT1 On",                  1010, false, 1000, "(L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)",                 "1 (>L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)"},
        ProcedureStep{"BAT ESS On",               1012, false, 1000, "(L:A32NX_OVHD_ELEC_BAT_ESS_PB_IS_AUTO)",               "1 (>L:A32NX_OVHD_ELEC_BAT_ESS_PB_IS_AUTO)"},
        ProcedureStep{"BAT2 On",                  1014, false, 1000, "(L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)",                 "1 (>L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)"},
        ProcedureStep{"BAT APU On",               1016, false, 3000, "(L:A32NX_OVHD_ELEC_BAT_APU_PB_IS_AUTO)",               "1 (>L:A32NX_OVHD_ELEC_BAT_APU_PB_IS_AUTO)"},

        ProcedureStep{"EXT PWR 2 On",             1020, false, 1000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)",                   "(A:EXTERNAL POWER ON:2, BOOL) ! if{ 2 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 3 On",             1022, false, 1000, "(A:EXTERNAL POWER ON:2, BOOL) !",                      "(A:EXTERNAL POWER ON:3, BOOL) ! if{ 3 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 1 On",             1024, false, 1000, "(A:EXTERNAL POWER ON:2, BOOL) !",                      "(A:EXTERNAL POWER ON:1, BOOL) ! if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 4 On",             1026, false, 3000, "(A:EXTERNAL POWER ON:2, BOOL) !",                      "(A:EXTERNAL POWER ON:4, BOOL) ! if{ 4 (>K:TOGGLE_EXTERNAL_POWER) }"},

        // ENG fire test (the A380X only has on test button and this is currently mapped to the ENG 1 test)
        ProcedureStep{"ENG Fire Test On",         1030, false, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)",        "1 (>L:A32NX_FIRE_TEST_ENG1)"},
        ProcedureStep{"ENG Fire Test Off",        1032, false, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)",        "0 (>L:A32NX_FIRE_TEST_ENG1) 1 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)"},

        // After fire test we start the APU
        ProcedureStep{"APU Master On",            1040, false, 3000, "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                                     "(L:A32NX_ENGINE_STATE:2) 1 == && "
                                                                     "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 1 == ||",        "1 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
        ProcedureStep{"APU Start On",             1042, false, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                                     "(L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||",          "1 (>L:A32NX_OVHD_APU_START_PB_IS_ON)"},

        ProcedureStep{"Waiting on AC BUS Availability", 1044, true,  2000, "",                                               "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)"},

        // SOP: COCKPIT PREPARATION
        ProcedureStep{"Crew Oxy On",              1050, false, 1000, "(L:PUSH_OVHD_OXYGEN_CREW) 0 ==",                       "0 (>L:PUSH_OVHD_OXYGEN_CREW)"},
        ProcedureStep{"GND CTL On",               1052, false, 1000, "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                                     "(L:A32NX_ENGINE_STATE:2) 1 == || "
                                                                     "(L:A32NX_RCDR_GROUND_CONTROL_ON) 1 == ||",             "1 (>L:A32NX_RCDR_GROUND_CONTROL_ON)"},

        ProcedureStep{"ADIRS 1 Nav",              1060, false, 500,  "(L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB) 1 ==",    "1 (>L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 2 Nav",              1062, false, 500,  "(L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB) 1 ==",    "1 (>L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 3 Nav",              1064, false, 1500, "(L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB) 1 ==",    "1 (>L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB)"},

        ProcedureStep{"Strobe Auto",              1070, false, 1000, "(L:LIGHTING_STROBE_0) 1 ==",                           "1 (>L:LIGHTING_STROBE_0)"},
        ProcedureStep{"Nav & Logo Lt On",         1072, false, 1000, "(A:LIGHT LOGO, Bool) (A:LIGHT NAV, Bool) &&",          "1 (>K:2:LOGO_LIGHTS_SET) 1 (>K:2:NAV_LIGHTS_SET)"},

        ProcedureStep{"SEAT BELTS On",            1080, false, 1000, "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL)",             "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) ! if{ 1 (>K:CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE) }"},
        ProcedureStep{"NO SMOKING Auto",          1082, false, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION) 1 ==", "1 (>L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION)"},
        ProcedureStep{"EMER EXT Lt Arm",          1084, false, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION) 1 ==",  "1 (>L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION)"},

        // TODO: find a way to expedite this
        ProcedureStep{"Waiting on APU Availability", 1090, true,  2000, "",                                                  "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! (L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||"},
        ProcedureStep{"APU Bleed On",                1092, false, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                                        "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) ||",         "1 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"}
      },

      .POWERED_CONFIG_OFF = {
        ProcedureStep{"APU Bleed Off",         1093, false, 1500, "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) 0 ==",          "0 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
        ProcedureStep{"EMER EXT Lt Off",       1085, false, 1500, "(L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION) 2 ==",  "2 (>L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION)"},
        ProcedureStep{"NO SMOKING Off",        1083, false, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION) 2 ==", "2 (>L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION)"},
        ProcedureStep{"SEAT BELTS Off",        1081, false, 2000, "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) !",           "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) if{ 1 (>K:CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE) }"},
        ProcedureStep{"Nav & Logo Lt Off",     1073, false, 500,  "(A:LIGHT LOGO, Bool) ! (A:LIGHT NAV, Bool) ! &&",      "0 (>K:2:LOGO_LIGHTS_SET) 0 (>K:2:NAV_LIGHTS_SET)"},
        ProcedureStep{"Strobe Off",            1071, false, 1000, "(L:LIGHTING_STROBE_0) 2 ==",                           "2 (>L:LIGHTING_STROBE_0)"},
        ProcedureStep{"ADIRS 3 Off",           1065, false, 500,  "(L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB) 0 ==",    "0 (>L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 2 Off",           1063, false, 500,  "(L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB) 0 ==",    "0 (>L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"ADIRS 1 Off",           1061, false, 1000, "(L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB) 0 ==",    "0 (>L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB)"},
        ProcedureStep{"GND CTL Off",           1053, false, 1000, "(L:A32NX_RCDR_GROUND_CONTROL_ON) 0 ==",                "0 (>L:A32NX_RCDR_GROUND_CONTROL_ON)"},
        ProcedureStep{"Crew Oxy Off",          1051, false, 1000, "(L:PUSH_OVHD_OXYGEN_CREW) 1 ==",                       "1 (>L:PUSH_OVHD_OXYGEN_CREW)"},
        ProcedureStep{"APU Master Off",        1041, false, 2000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 0 ==",           "0 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
        ProcedureStep{"EXT PWR 4 Off",         1027, false, 3000, "(A:EXTERNAL POWER ON:4, BOOL) !",                      "(A:EXTERNAL POWER ON:4, BOOL) if{ 4 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 1 Off",         1025, false, 1000, "(A:EXTERNAL POWER ON:1, BOOL) !",                      "(A:EXTERNAL POWER ON:1, BOOL) if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 3 Off",         1023, false, 1000, "(A:EXTERNAL POWER ON:3, BOOL) !",                      "(A:EXTERNAL POWER ON:3, BOOL) if{ 3 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 2 Off",         1021, false, 3000, "(A:EXTERNAL POWER ON:2, BOOL) !",                      "(A:EXTERNAL POWER ON:2, BOOL) if{ 2 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"BAT APU Off",           1017, false, 1000, "(L:A32NX_OVHD_ELEC_BAT_APU_PB_IS_AUTO) 0 ==",          "0 (>L:A32NX_OVHD_ELEC_BAT_APU_PB_IS_AUTO)"},
        ProcedureStep{"BAT2 Off",              1015, false, 1000, "(L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO) 0 ==",            "0 (>L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)"},
        ProcedureStep{"BAT ESS Off",           1013, false, 1000, "(L:A32NX_OVHD_ELEC_BAT_ESS_PB_IS_AUTO) 0 ==",          "0 (>L:A32NX_OVHD_ELEC_BAT_ESS_PB_IS_AUTO)"},
        ProcedureStep{"BAT1 Off",              1011, false, 1000, "(L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO) 0 ==",            "0 (>L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)"},
        ProcedureStep{"AC BUS Off Check",      1009, true,  5000, "",                                                     "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED) !"},
        ProcedureStep{"ENG 1 Fire Test Reset", 1033, false, 0,    "",                                                     "0 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)"},
        // ProcedureStep{"FWC Init Reset",     1066, false, 0,    "",                                                     "0 (>L:A32NX_AIRCRAFT_PRESET_FWC_INIT_DONE)"}
      },

      .PUSHBACK_CONFIG_ON = {
        // SOP: BEFORE PUSHBACK OR START
        ProcedureStep{"EXT PWR 4 Off",               1027, false, 1000, "(A:EXTERNAL POWER ON:4, BOOL) !",              "(A:EXTERNAL POWER ON:4, BOOL) if{ 4 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 1 Off",               1025, false, 1000, "(A:EXTERNAL POWER ON:1, BOOL) !",              "(A:EXTERNAL POWER ON:1, BOOL) if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 3 Off",               1023, false, 1000, "(A:EXTERNAL POWER ON:3, BOOL) !",              "(A:EXTERNAL POWER ON:3, BOOL) if{ 3 (>K:TOGGLE_EXTERNAL_POWER) }"},
        ProcedureStep{"EXT PWR 2 Off",               1021, false, 3000, "(A:EXTERNAL POWER ON:2, BOOL) !",              "(A:EXTERNAL POWER ON:2, BOOL) if{ 2 (>K:TOGGLE_EXTERNAL_POWER) }"},

        ProcedureStep{"Beacon On",                   2010, false, 1000, "(A:LIGHT BEACON, Bool)",                       "0 (>K:BEACON_LIGHTS_ON)"},

        ProcedureStep{"FUEL PUMP FEED TK1 MAIN On",  2020, false, 100,  "(A:CIRCUIT CONNECTION ON:2,  Bool)",            "2 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK1 STBY On",  2022, false, 500,  "(A:CIRCUIT CONNECTION ON:3,  Bool)",            "3 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK2 MAIN On",  2024, false, 100,  "(A:CIRCUIT CONNECTION ON:64, Bool)",           "64 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK2 STBY On",  2026, false, 500,  "(A:CIRCUIT CONNECTION ON:65, Bool)",           "65 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK3 MAIN On",  2028, false, 100,  "(A:CIRCUIT CONNECTION ON:66, Bool)",           "66 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK3 STBY On",  2030, false, 500,  "(A:CIRCUIT CONNECTION ON:67, Bool)",           "67 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK4 MAIN On",  2032, false, 100,  "(A:CIRCUIT CONNECTION ON:68, Bool)",           "68 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK4 STBY On",  2034, false, 500,  "(A:CIRCUIT CONNECTION ON:69, Bool)",           "69 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"FUEL PUMP L OUTR TK On",      2036, false, 500,  "(A:CIRCUIT CONNECTION ON:70, Bool)",           "70 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP L MID FWD TK On",   2038, false, 100,  "(A:CIRCUIT CONNECTION ON:71, Bool)",           "71 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP L MID AFT TK On",   2040, false, 500,  "(A:CIRCUIT CONNECTION ON:72, Bool)",           "72 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP L INR FWD TK On",   2042, false, 100,  "(A:CIRCUIT CONNECTION ON:73, Bool)",           "73 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP L INR AFT TK On",   2044, false, 500,  "(A:CIRCUIT CONNECTION ON:74, Bool)",           "74 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP R INR AFT TK On",   2046, false, 100,  "(A:CIRCUIT CONNECTION ON:78, Bool)",           "78 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP R INR FWD TK On",   2048, false, 500,  "(A:CIRCUIT CONNECTION ON:79, Bool)",           "79 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP R MID AFT TK On",   2050, false, 100,  "(A:CIRCUIT CONNECTION ON:76, Bool)",           "76 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP R MID FWD TK On",   2052, false, 500,  "(A:CIRCUIT CONNECTION ON:77, Bool)",           "77 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP R OUTR TK On",      2054, false, 500,  "(A:CIRCUIT CONNECTION ON:75, Bool)",           "75 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"FUEL TRIM TK L On",           2056, false, 500,  "(A:CIRCUIT CONNECTION ON:80, Bool)",           "80 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL TRIM TK R On",           2058, false, 500,  "(A:CIRCUIT CONNECTION ON:81, Bool)",           "81 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"COCKPIT DOOR LCK",            2060, false, 2000, "(L:A32NX_COCKPIT_DOOR_LOCKED) 1 ==",           "1 (>L:A32NX_COCKPIT_DOOR_LOCKED)"},

        // TODO: find a way to expedite this
        ProcedureStep{"Await ADIRS 1 Alignment",     2062, true,  2000, "",                                             "(L:A32NX_ADIRS_ADIRU_1_STATE) 2 =="},
        ProcedureStep{"Await ADIRS 2 Alignment",     2064, true,  2000, "",                                             "(L:A32NX_ADIRS_ADIRU_2_STATE) 2 =="},
        ProcedureStep{"Await ADIRS 3 Alignment",     2066, true,  2000, "",                                             "(L:A32NX_ADIRS_ADIRU_3_STATE) 2 =="},
      },

      .PUSHBACK_CONFIG_OFF = {
        ProcedureStep{"COCKPIT DOOR OP",             2061, false, 2000, "(L:A32NX_COCKPIT_DOOR_LOCKED) 0 ==",           "0 (>L:A32NX_COCKPIT_DOOR_LOCKED)"},

        ProcedureStep{"FUEL TRIM TK R Off",          2059, false, 500,  "(A:CIRCUIT CONNECTION ON:81, Bool) !",         "81 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL TRIM TK L Off",          2057, false, 500,  "(A:CIRCUIT CONNECTION ON:80, Bool) !",         "80 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"FUEL PUMP R OUTR TK Off",     2055, false, 500,  "(A:CIRCUIT CONNECTION ON:75, Bool) !",         "75 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP R MID FWD TK Off",  2053, false, 500,  "(A:CIRCUIT CONNECTION ON:77, Bool) !",         "77 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP R MID AFT TK Off",  2051, false, 100,  "(A:CIRCUIT CONNECTION ON:76, Bool) !",         "76 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP R INR FWD TK Off",  2049, false, 500,  "(A:CIRCUIT CONNECTION ON:79, Bool) !",         "79 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP R INR AFT TK Off",  2047, false, 100,  "(A:CIRCUIT CONNECTION ON:78, Bool) !",         "78 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP L INR AFT TK Off",  2045, false, 500,  "(A:CIRCUIT CONNECTION ON:74, Bool) !",         "74 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP L INR FWD TK Off",  2043, false, 100,  "(A:CIRCUIT CONNECTION ON:73, Bool) !",         "73 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP L MID AFT TK Off",  2041, false, 500,  "(A:CIRCUIT CONNECTION ON:72, Bool) !",         "72 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP L MID FWD TK Off",  2039, false, 100,  "(A:CIRCUIT CONNECTION ON:71, Bool) !",         "71 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP L OUTR TK Off",     2037, false, 500,  "(A:CIRCUIT CONNECTION ON:70, Bool) !",         "70 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"FUEL PUMP FEED TK4 STBY Off", 2035, false, 500,  "(A:CIRCUIT CONNECTION ON:69, Bool) !",         "69 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK4 MAIN Off", 2033, false, 100,  "(A:CIRCUIT CONNECTION ON:68, Bool) !",         "68 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK3 STBY Off", 2031, false, 500,  "(A:CIRCUIT CONNECTION ON:67, Bool) !",         "67 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK3 MAIN Off", 2029, false, 100,  "(A:CIRCUIT CONNECTION ON:66, Bool) !",         "66 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK2 STBY Off", 2027, false, 500,  "(A:CIRCUIT CONNECTION ON:65, Bool) !",         "65 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK2 MAIN Off", 2025, false, 100,  "(A:CIRCUIT CONNECTION ON:64, Bool) !",         "64 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK1 STBY Off", 2023, false, 500,  "(A:CIRCUIT CONNECTION ON:3,  Bool) !",          "3 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},
        ProcedureStep{"FUEL PUMP FEED TK1 MAIN Off", 2021, false, 100,  "(A:CIRCUIT CONNECTION ON:2,  Bool) !",          "2 1 (>K:2:ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)"},

        ProcedureStep{"Beacon Off",                  2011, false, 1000, "(A:LIGHT BEACON, Bool) !",                     "0 (>K:BEACON_LIGHTS_OFF)"},
      },

      .TAXI_CONFIG_ON = {
        // SOP: ENGINE START
        ProcedureStep{"ENG MODE SEL START",   3010, false, 3000,  "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                                  "(L:A32NX_ENGINE_STATE:2) 1 == "
                                                                  "(L:A32NX_ENGINE_STATE:3) 1 == "
                                                                  "(L:A32NX_ENGINE_STATE:4) 1 == 1 && && && && ",       "2 (>K:TURBINE_IGNITION_SWITCH_SET1) "
                                                                                                                        "2 (>K:TURBINE_IGNITION_SWITCH_SET2) "
                                                                                                                        "2 (>K:TURBINE_IGNITION_SWITCH_SET3) "
                                                                                                                        "2 (>K:TURBINE_IGNITION_SWITCH_SET4)"},

        ProcedureStep{"ENG 1 ON",             3020, false, 1000,  "(A:FUELSYSTEM VALVE OPEN:1, Bool)",                  "1 (>K:FUELSYSTEM_VALVE_OPEN)"},
        ProcedureStep{"ENG 2 ON",             3022, false, 20000, "(A:FUELSYSTEM VALVE OPEN:2, Bool)",                  "2 (>K:FUELSYSTEM_VALVE_OPEN)"},
        ProcedureStep{"Await ENG 1 AVAIL",    3024, true,  5000,  "",                                                   "(L:A32NX_ENGINE_STATE:1) 1 =="},
        ProcedureStep{"Await ENG 2 AVAIL",    3025, true,  5000,  "",                                                   "(L:A32NX_ENGINE_STATE:2) 1 =="},
        ProcedureStep{"ENG 3 ON",             3026, false, 1000,  "(A:FUELSYSTEM VALVE OPEN:3, Bool)",                  "3 (>K:FUELSYSTEM_VALVE_OPEN)"},
        ProcedureStep{"ENG 4 ON",             3028, false, 20000, "(A:FUELSYSTEM VALVE OPEN:4, Bool)",                  "4 (>K:FUELSYSTEM_VALVE_OPEN)"},
        ProcedureStep{"Await ENG 3 AVAIL",    3030, true,  5000,  "",                                                   "(L:A32NX_ENGINE_STATE:3) 1 =="},
        ProcedureStep{"Await ENG 4 AVAIL",    3031, true,  5000,  "",                                                   "(L:A32NX_ENGINE_STATE:4) 1 =="},

//        // SOP: AFTER START
        ProcedureStep{"ENG MODE SEL NORM",    3011, false, 3000,  "(A:TURB ENG IGNITION SWITCH EX1:1) 1 == "
                                                                  "(A:TURB ENG IGNITION SWITCH EX1:2) 1 == "
                                                                  "(A:TURB ENG IGNITION SWITCH EX1:3) 1 == "
                                                                  "(A:TURB ENG IGNITION SWITCH EX1:4) 1 == "
                                                                  "0 || || || ||",                                      "1 (>K:TURBINE_IGNITION_SWITCH_SET1) "
                                                                                                                        "1 (>K:TURBINE_IGNITION_SWITCH_SET2) "
                                                                                                                        "1 (>K:TURBINE_IGNITION_SWITCH_SET3) "
                                                                                                                        "1 (>K:TURBINE_IGNITION_SWITCH_SET4)"},

        ProcedureStep{"APU Bleed Off",        1093, false, 1500,  "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) 0 ==",        "0 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
        ProcedureStep{"APU Master Off",       1041, false, 2000,  "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 0 ==",         "0 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},

        ProcedureStep{"Spoiler Arm",          3040, false, 2000,  "(L:A32NX_SPOILERS_ARMED) 1 ==",                      "1 (>K:SPOILERS_ARM_SET)"},
        ProcedureStep{"Rudder Trim Reset",    3042, false, 2000,  "(A:RUDDER TRIM, Radians) 0 ==",                      "0 (>K:RUDDER_TRIM_SET)"},
        ProcedureStep{"Flaps 1",              3044, false, 3000,  "(L:A32NX_FLAPS_HANDLE_INDEX) 1 ==",                  "1 (>L:A32NX_FLAPS_HANDLE_INDEX)"},

        // SOP: TAXI
        ProcedureStep{"NOSE Lt Taxi",         3050, false, 1000,  "(A:LIGHT TAXI, Number) 1 ==",                        "1 (>K:TAXI_LIGHTS_ON)"},
        ProcedureStep{"RWY TURN OFF Lt On",   3052, false, 1000,  "(A:LIGHT TAXI:2, Number) 1 == "
                                                                  "(A:LIGHT TAXI:3, Number) 1 == &&",                   "2 (>K:TAXI_LIGHTS_ON) 3 (>K:TAXI_LIGHTS_ON)"},
        ProcedureStep{"PWS Auto",             3060, false, 1000,  "(L:A32NX_SWITCH_RADAR_PWS_POSITION) 1 ==",           "1 (>L:A32NX_SWITCH_RADAR_PWS_POSITION)"},
        ProcedureStep{"Transponder On",       3062, false, 1000,  "(L:A32NX_TRANSPONDER_MODE) 1 ==",                    "1 (>L:A32NX_TRANSPONDER_MODE)"},
        ProcedureStep{"ATC ALT RPTG On",      3064, false, 1000,  "(L:A32NX_SWITCH_ATC_ALT) 1 ==",                      "1 (>L:A32NX_SWITCH_ATC_ALT)"},
        ProcedureStep{"TCAS TRAFFIC ABV",     3066, false, 2000,  "(L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION) 2 ==",        "2 (>L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION)"},
        ProcedureStep{"Autobrake Max",        3068, false, 2000,  "(L:A32NX_AUTOBRAKES_ARMED_MODE) 3 ==",               "3 (>L:A32NX_AUTOBRAKES_ARMED_MODE_SET)"},
        ProcedureStep{"TERR ON ND Capt. On",  3070, false, 2000,  "(L:A32NX_EFIS_TERR_L_ACTIVE) 1 ==",                  "1 (>L:A32NX_EFIS_TERR_L_ACTIVE)"},

        ProcedureStep{"T.O. Config",          3080, false, 2000,  "",                                                   "1 (>L:A32NX_TO_CONFIG_NORMAL)"},
      },

      .TAXI_CONFIG_OFF = {
        ProcedureStep{"TERR ON ND Capt. Off",  3071, false, 2000, "(L:A32NX_EFIS_TERR_L_ACTIVE) 0 ==",                  "0 (>L:A32NX_EFIS_TERR_L_ACTIVE)"},
        ProcedureStep{"Autobrake Off",         3069, false, 2000, "(L:A32NX_AUTOBRAKES_ARMED_MODE) 0 ==",               "0 (>L:A32NX_AUTOBRAKES_ARMED_MODE_SET)"},
        ProcedureStep{"TCAS TRAFFIC ABV",      3067, false, 1000, "(L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION) 2 ==",        "2 (>L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION)"},
        ProcedureStep{"ATC ALT RPTG Off",      3065, false, 1000, "(L:A32NX_SWITCH_ATC_ALT) 1 ==",                      "1 (>L:A32NX_SWITCH_ATC_ALT)"},
        ProcedureStep{"Transponder Off",       3063, false, 1000, "(L:A32NX_TRANSPONDER_MODE) 0 ==",                    "0 (>L:A32NX_TRANSPONDER_MODE)"},
        ProcedureStep{"PWS Off",               3061, false, 1000, "(L:A32NX_SWITCH_RADAR_PWS_POSITION) 0 ==",           "0 (>L:A32NX_SWITCH_RADAR_PWS_POSITION)"},

        ProcedureStep{"RWY TURN OFF Lt Off",   3053, false, 2000, "(A:LIGHT TAXI:2, Number) 0 == "
                                                                  "(A:LIGHT TAXI:3, Number) 0 == &&",                   "2 (>K:TAXI_LIGHTS_OFF) 3 (>K:TAXI_LIGHTS_OFF)"},
        ProcedureStep{"NOSE Lt Taxi",          3051, false, 1000, "(A:LIGHT TAXI, Number) 0 == ",                       "1 (>K:TAXI_LIGHTS_OFF)"},

        ProcedureStep{"Flaps 0",               3041, false, 2000, "(L:A32NX_FLAPS_HANDLE_INDEX) 0 ==",                  "0 (>L:A32NX_FLAPS_HANDLE_INDEX)"},
        ProcedureStep{"Rudder Trim Reset",     3043, false, 2000, "(A:RUDDER TRIM, Radians) 0 ==",                      "0 (>K:RUDDER_TRIM_SET)"},
        ProcedureStep{"Spoiler Disarm",        3041, false, 2000, "(L:A32NX_SPOILERS_ARMED) 0 ==",                      "0 (>K:SPOILERS_ARM_SET)"},

        ProcedureStep{"ENG 4 Off",             3029, false, 2000, "(A:FUELSYSTEM VALVE OPEN:4, Bool) !",                "4 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"ENG 3 Off",             3027, false, 2000, "(A:FUELSYSTEM VALVE OPEN:3, Bool) !",                "3 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"ENG 2 Off",             3023, false, 2000, "(A:FUELSYSTEM VALVE OPEN:2, Bool) !",                "2 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"ENG 1 Off",             3021, false, 2000, "(A:FUELSYSTEM VALVE OPEN:1, Bool) !",                "1 (>K:FUELSYSTEM_VALVE_CLOSE)"},
        ProcedureStep{"ENG 4 N1 <3%",          3032, true,   500, "",                                                   "(L:A32NX_ENGINE_N1:4) 3 <"},
        ProcedureStep{"ENG 3 N1 <3%",          3033, true,   500, "",                                                   "(L:A32NX_ENGINE_N1:3) 3 <"},
        ProcedureStep{"ENG 2 N1 <3%",          3034, true,   500, "",                                                   "(L:A32NX_ENGINE_N1:2) 3 <"},
        ProcedureStep{"ENG 1 N1 <3%",          3035, true,   500, "",                                                   "(L:A32NX_ENGINE_N1:1) 3 <"}
      },

      .TAKEOFF_CONFIG_ON = {
      // SOP: TAXI
        //  ProcedureStep{"WX Radar On",          4000, false, 1000, "(L:XMLVAR_A320_WEATHERRADAR_SYS) 0 ==",  "0 (>L:XMLVAR_A320_WEATHERRADAR_SYS)"},
        //  ProcedureStep{"WX Radar Mode",        4010, false, 1000, "(L:XMLVAR_A320_WEATHERRADAR_MODE) 1 ==", "1 (>L:XMLVAR_A320_WEATHERRADAR_MODE)"},
        // SOP: BEFORE TAKEOFF
        ProcedureStep{"TCAS Switch TA/RA",      4010, false, 2000, "(L:A32NX_SWITCH_TCAS_POSITION) 2 ==",               "2 (>L:A32NX_SWITCH_TCAS_POSITION)"},
        ProcedureStep{"Strobe On",              4020, false, 1000, "(L:LIGHTING_STROBE_0) 0 ==",                        "0 (>L:LIGHTING_STROBE_0)"},
        ProcedureStep{"Cabin Read On",          4022, false, 1000, "",                                                  "1 (>L:A32NX_CABIN_READY)"},
        ProcedureStep{"Cabin Ready Off",        4023, false, 1000, "",                                                  "0 (>L:A32NX_CABIN_READY)"},
        // SOP: TAKE OFF
        ProcedureStep{"NOSE Lt Takeoff",        4030, false, 1000, "(A:LIGHT LANDING:1, Number) 1 ==",                  "1 (>K:LANDING_LIGHTS_ON)"},
        ProcedureStep{"Landing Lights On",      4040, false, 0,    "(A:LIGHT LANDING:2, Number) 1 ==",                  "2 (>K:LANDING_LIGHTS_ON)"},
      },

      .TAKEOFF_CONFIG_OFF = {
        ProcedureStep{"Landing Lights Off",     4041, false, 0,    "(A:LIGHT LANDING:2, Number) 0 ==",                  "2 (>K:LANDING_LIGHTS_OFF)"},
        ProcedureStep{"NOSE Lt Takeoff",        4031, false, 2000, "(A:LIGHT LANDING:1, Number) 0 ==",                  "1 (>K:LANDING_LIGHTS_OFF)"},
        ProcedureStep{"Strobe Auto",            1070, false, 1000, "(L:LIGHTING_STROBE_0) 1 ==",                        "1 (>L:LIGHTING_STROBE_0)"},

        ProcedureStep{"TCAS Switch TA/RA",      4011, false, 1000, "(L:A32NX_SWITCH_TCAS_POSITION) 0 ==",               "0 (>L:A32NX_SWITCH_TCAS_POSITION)"},
        // ProcedureStep{"WX Radar Mode",        4110, false, 1000, "(L:XMLVAR_A320_WEATHERRADAR_MODE) 1 ==",                 "1 (>L:XMLVAR_A320_WEATHERRADAR_MODE)"},
        // ProcedureStep{"WX Radar Off",         4100, false, 1000, "(L:XMLVAR_A320_WEATHERRADAR_SYS) 1 ==",                  "1 (>L:XMLVAR_A320_WEATHERRADAR_SYS)"},
      }

      // @formatter:on
      // clang-format on
  };
};

#endif  // FLYBYWIRE_AIRCRAFT_AIRCRAFTPRESETPROCEDURES_A32NX_H
