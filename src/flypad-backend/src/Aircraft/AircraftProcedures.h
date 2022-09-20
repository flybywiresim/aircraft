#pragma once

#include <map>
#include <string>
#include <vector>

using namespace std;

struct ProcedureStep {
  std::string description;
  // unique id for each step (will be assigned automatically in constructor)
  int id;
  // true if the procedure step is a pure condition check to wait for a certain state
  bool isConditional;
  // time to delay next step of execution of action - will be skipped if
  // expected state is already set
  double delayAfter;
  // check if desired state is already set so the action can be skipped
  std::string expectedStateCheckCode;
  // calculator code to achieve the desired state
  // if it is a conditional this calculator code needs to eval to true or false
  std::string actionCode;
};

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// Please remember to also update the EFB Presets page for the step description
// if you make any changes to this list.
// src/instruments/src/EFB/Presets/Widgets/AircraftPresets.tsx
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// @formatter:off
static vector<ProcedureStep*>* TURNAROUND_CONFIG_ON = new vector<ProcedureStep*>{
  new ProcedureStep {"BAT1 On",                  1010, false, 1000, "(L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)",                 "1 (>L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)"},
  new ProcedureStep {"BAT2 On",                  1020, false, 3000, "(L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)",                 "1 (>L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)"},

  new ProcedureStep {"EXT PWR On",               1030, false, 3000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) "
                                                                    "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) && "
                                                                    "(L:A32NX_ENGINE_STATE:1) 1 == || "
                                                                    "(L:A32NX_ENGINE_STATE:2) 1 == || "
                                                                    "(A:EXTERNAL POWER ON:1, BOOL) ||",                     "(A:EXTERNAL POWER ON:1, BOOL) ! if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},

  // if no Ext Pwr is available we start the APU here with a bat only fire test
  new ProcedureStep {"APU Fire Test On",         1035, false, 2000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)",                   "1 (>L:A32NX_FIRE_TEST_APU)"},
  new ProcedureStep {"APU Fire Test Off",        1036, false, 2000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)",                   "0 (>L:A32NX_FIRE_TEST_APU)"},
  new ProcedureStep {"APU Master On",            1040, false, 3000, "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)",                   "1 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
  new ProcedureStep {"APU Start On",             1050, false, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                                    "(L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||",          "1 (>L:A32NX_OVHD_APU_START_PB_IS_ON)"},

  new ProcedureStep {"Waiting on AC BUS Availability", 1060, true,  2000, "",                                               "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)"},

  new ProcedureStep {"Nav & Logo Lt On",         1070, false, 1000, "(A:LIGHT LOGO, Bool) (A:LIGHT NAV, Bool) &&",          "1 (>K:2:LOGO_LIGHTS_SET) 1 (>K:2:NAV_LIGHTS_SET)"},
  new ProcedureStep {"ADIRS 1 Nav",              1080, false, 500,  "(L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB) 1 ==",    "1 (>L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB)"},
  new ProcedureStep {"ADIRS 2 Nav",              1090, false, 500,  "(L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB) 1 ==",    "1 (>L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB)"},
  new ProcedureStep {"ADIRS 3 Nav",              1100, false, 1500, "(L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB) 1 ==",    "1 (>L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB)"},
  new ProcedureStep {"GND CTL On",               1110, false, 1000, "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                                    "(L:A32NX_ENGINE_STATE:2) 1 == || "
                                                                    "(L:A32NX_RCDR_GROUND_CONTROL_ON) 1 == ||",             "1 (>L:A32NX_RCDR_GROUND_CONTROL_ON)"},
  new ProcedureStep{"Crew Oxy On",               1120, false, 1000, "(L:PUSH_OVHD_OXYGEN_CREW) 0 ==",                       "0 (>L:PUSH_OVHD_OXYGEN_CREW)"},
  new ProcedureStep{"NO SMOKING Auto",           1130, false, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION) 1 ==", "1 (>L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION)"},
  new ProcedureStep{"EMER EXT Lt Arm",           1140, false, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION) 1 ==",  "1 (>L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION)"},

  // For the fire tests the FWC needs to be initialized
  // The correct variables to wait for are: A32NX_FWS_FWC_1_NORMAL and A32NX_FWS_FWC_2_NORMAL. But
  // as these are only on Exp this first iteration uses A32NX_FWC_FLIGHT_PHASE which also work on
  // master and is equivalent for this specific purpose. Will be changed when the FWC is on master.
  new ProcedureStep {"Waiting on FWC Initialization", 1065, true,  5000, "",                                                "(L:A32NX_FWC_FLIGHT_PHASE)"},
  new ProcedureStep {"Waiting...",                    9999, false, 5000, "(L:A32NX_AIRCRAFT_PRESET_FWC_INIT_DONE)",         "1 (>L:A32NX_AIRCRAFT_PRESET_FWC_INIT_DONE)"},

  // APU fire test
  new ProcedureStep {"APU Fire Test On",         1035, false, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_APU_DONE)",         "1 (>L:A32NX_FIRE_TEST_APU)"},
  new ProcedureStep {"APU Fire Test Off",        1036, false, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_APU_DONE)",         "0 (>L:A32NX_FIRE_TEST_APU) 1 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_APU_DONE)"},

    // After fire test we start the APU
  new ProcedureStep {"APU Master On",              1041, false, 3000, "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                                    "(L:A32NX_ENGINE_STATE:2) 1 == && "
                                                                    "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 1 == ||",        "1 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
  new ProcedureStep {"APU Start On",               1051, false, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                                    "(L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||",          "1 (>L:A32NX_OVHD_APU_START_PB_IS_ON)"},
  new ProcedureStep{"Waiting on APU Availability", 1150, true,  2000, "",                                                   "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! (L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||"},
  new ProcedureStep{"APU Bleed On",                1160, false, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                                                    "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) ||",            "1 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
};

static vector<ProcedureStep*>* TURNAROUND_CONFIG_OFF = new vector<ProcedureStep*>{
  new ProcedureStep{"NO SMOKING Off",        1170, false, 1000, "(L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION) 2 ==", "2 (>L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION)"},
  new ProcedureStep{"EMER EXT Lt Off",       1180, false, 1500, "(L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION) 2 ==",  "2 (>L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION)"},
  new ProcedureStep{"Crew Oxy Off",          1190, false, 1000, "(L:PUSH_OVHD_OXYGEN_CREW) 1 ==",                       "1 (>L:PUSH_OVHD_OXYGEN_CREW)"},
  new ProcedureStep{"GND CTL Off",           1200, false, 1000, "(L:A32NX_RCDR_GROUND_CONTROL_ON) 0 ==",                "0 (>L:A32NX_RCDR_GROUND_CONTROL_ON)"},
  new ProcedureStep{"ADIRS 3 Off",           1210, false, 500,  "(L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB) 0 ==",    "0 (>L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB)"},
  new ProcedureStep{"ADIRS 2 Off",           1220, false, 500,  "(L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB) 0 ==",    "0 (>L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB)"},
  new ProcedureStep{"ADIRS 1 Off",           1230, false, 1000, "(L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB) 0 ==",    "0 (>L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB)"},
  new ProcedureStep{"Nav & Logo Lt Off",     1240, false, 500,  "(A:LIGHT LOGO, Bool) ! (A:LIGHT NAV, Bool) ! &&",      "0 (>K:2:LOGO_LIGHTS_SET) 0 (>K:2:NAV_LIGHTS_SET)"},
  new ProcedureStep{"APU Bleed Off",         1250, false, 1500, "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) 0 ==",          "0 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
  new ProcedureStep{"APU Master Off",        1260, false, 2000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 0 ==",           "0 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
  new ProcedureStep{"EXT PWR Off",           1270, false, 3000, "(A:EXTERNAL POWER ON:1, BOOL) !",                      "(A:EXTERNAL POWER ON:1, BOOL) if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
  new ProcedureStep{"BAT2 Off",              1280, false, 100,  "(L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO) 0 ==",            "0 (>L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)"},
  new ProcedureStep{"BAT1 Off",              1290, false, 1000, "(L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO) 0 ==",            "0 (>L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)"},
  new ProcedureStep{"AC BUS Off Check",      1300, true,  2000, "",                                                     "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED) !"},
  new ProcedureStep{"APU Fire Test Reset",   1037, false, 0,    "",                                                     "0 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_APU_DONE)"},
  new ProcedureStep{"ENG 1 Fire Test Reset", 2006, false, 0,    "",                                                     "0 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)"},
  new ProcedureStep{"ENG 2 Fire Test Reset", 2007, false, 0,    "",                                                     "0 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG2_DONE)"},
  new ProcedureStep{"FWC Init Reset",        1066, false, 0,    "",                                                     "0 (>L:A32NX_AIRCRAFT_PRESET_FWC_INIT_DONE)"},
};

static vector<ProcedureStep*>* PUSHBACK_CONFIG_ON = new vector<ProcedureStep*>{
  new ProcedureStep {"ENG 1 Fire Test On",     2002, false, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)", "1 (>L:A32NX_FIRE_TEST_ENG1)"},
  new ProcedureStep {"ENG 1 Fire Test Off",    2003, false, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)", "0 (>L:A32NX_FIRE_TEST_ENG1) 1 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG1_DONE)"},
  new ProcedureStep {"ENG 2 Fire Test On",     2004, false, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG2_DONE)", "1 (>L:A32NX_FIRE_TEST_ENG2)"},
  new ProcedureStep {"ENG 2 Fire Test Off",    2005, false, 2000, "(L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG2_DONE)", "0 (>L:A32NX_FIRE_TEST_ENG2) 1 (>L:A32NX_AIRCRAFT_PRESET_FIRE_TEST_ENG2_DONE)"},
  new ProcedureStep{"EXT PWR Off",             2000, false, 3000, "(A:EXTERNAL POWER ON:1, BOOL) !",               "(A:EXTERNAL POWER ON:1, BOOL) if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
  new ProcedureStep{"FUEL PUMP 2 On",          2010, false, 100,  "(A:FUELSYSTEM PUMP SWITCH:2, Bool)",            "2 (>K:FUELSYSTEM_PUMP_ON)"},
  new ProcedureStep{"FUEL PUMP 5 On",          2020, false, 500,  "(A:FUELSYSTEM PUMP SWITCH:5, Bool)",            "5 (>K:FUELSYSTEM_PUMP_ON)"},
  new ProcedureStep{"FUEL PUMP 1 On",          2030, false, 100,  "(A:FUELSYSTEM PUMP SWITCH:1, Bool)",            "1 (>K:FUELSYSTEM_PUMP_ON)"},
  new ProcedureStep{"FUEL PUMP 4 On",          2040, false, 500,  "(A:FUELSYSTEM PUMP SWITCH:4, Bool)",            "4 (>K:FUELSYSTEM_PUMP_ON)"},
  new ProcedureStep{"FUEL PUMP 3 On",          2050, false, 100,  "(A:FUELSYSTEM PUMP SWITCH:3, Bool)",            "3 (>K:FUELSYSTEM_PUMP_ON)"},
  new ProcedureStep{"FUEL PUMP 6 On",          2060, false, 2000, "(A:FUELSYSTEM PUMP SWITCH:6, Bool)",            "6 (>K:FUELSYSTEM_PUMP_ON)"},
  new ProcedureStep{"PWS Auto",                2070, false, 1000, "(L:A32NX_SWITCH_RADAR_PWS_POSITION) 1 ==",      "1 (>L:A32NX_SWITCH_RADAR_PWS_POSITION)"},
  new ProcedureStep{"Transponder On",          2080, false, 1000, "(L:A32NX_TRANSPONDER_MODE) 1 ==",               "1 (>L:A32NX_TRANSPONDER_MODE)"},
  new ProcedureStep{"ATC ALT RPTG On",         2090, false, 1000, "(L:A32NX_SWITCH_ATC_ALT) 1 ==",                 "1 (>L:A32NX_SWITCH_ATC_ALT)"},
  new ProcedureStep{"TCAS TRAFFIC ABV",        2100, false, 2000, "(L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION) 2 ==",   "2 (>L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION)"},
  new ProcedureStep{"COCKPIT DOOR LCK",        2110, false, 2000, "(L:A32NX_COCKPIT_DOOR_LOCKED) 1 ==",            "1 (>L:A32NX_COCKPIT_DOOR_LOCKED)"},
  new ProcedureStep{"Strobe Auto",             2120, false, 1000, "(A:LIGHT STROBE, Bool)",                        "1 (>L:STROBE_0_AUTO) 0 (>K:STROBES_ON)"},
  new ProcedureStep{"Beacon On",               2130, false, 1000, "(A:LIGHT BEACON, Bool)",                        "0 (>K:BEACON_LIGHTS_ON)"},
  new ProcedureStep{"SEAT BELTS On",           2140, false, 1000, "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL)",      "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) ! if{ 1 (>K:CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE) }"},
  new ProcedureStep{"Await ADIRS 1 Alignment", 2150, true,  2000, "",                                              "(L:A32NX_ADIRS_ADIRU_1_STATE) 2 =="},
  new ProcedureStep{"Await ADIRS 2 Alignment", 2160, true,  2000, "",                                              "(L:A32NX_ADIRS_ADIRU_2_STATE) 2 =="},
  new ProcedureStep{"Await ADIRS 3 Alignment", 2170, true,  2000, "",                                              "(L:A32NX_ADIRS_ADIRU_3_STATE) 2 =="},
};

static vector<ProcedureStep*>* PUSHBACK_CONFIG_OFF = new vector<ProcedureStep*>{
  new ProcedureStep{"Strobe Off",      2180, false, 1000, "(A:LIGHT STROBE, Bool) !",                    "0 (>L:STROBE_0_AUTO) 0 (>K:STROBES_OFF)"},
  new ProcedureStep{"Beacon Off",      2190, false, 1000, "(A:LIGHT BEACON, Bool) !",                    "0 (>K:BEACON_LIGHTS_OFF)"},
  new ProcedureStep{"SEAT BELTS Off",  2200, false, 2000, "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) !",  "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) if{ 1 (>K:CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE) }"},
  new ProcedureStep{"PWS Off",         2210, false, 1000, "(L:A32NX_SWITCH_RADAR_PWS_POSITION) 0 ==",    "0 (>L:A32NX_SWITCH_RADAR_PWS_POSITION)"},
  new ProcedureStep{"Transponder Off", 2220, false, 1000, "(L:A32NX_TRANSPONDER_MODE) 0 ==",             "0 (>L:A32NX_TRANSPONDER_MODE)"},
  new ProcedureStep{"ATC ALT RPTG Off",2230, false, 1000, "(L:A32NX_SWITCH_ATC_ALT) 1 ==",               "1 (>L:A32NX_SWITCH_ATC_ALT)"},
  new ProcedureStep{"TCAS TRAFFIC ABV",2240, false, 1000, "(L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION) 2 ==", "2 (>L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION)"},
  new ProcedureStep{"COCKPIT DOOR OP", 2250, false, 2000, "(L:A32NX_COCKPIT_DOOR_LOCKED) 0 ==",          "0 (>L:A32NX_COCKPIT_DOOR_LOCKED)"},
  new ProcedureStep{"FUEL PUMP 2 Off", 2260, false, 100,  "(A:FUELSYSTEM PUMP SWITCH:2, Bool) !",        "2 (>K:FUELSYSTEM_PUMP_OFF)"},
  new ProcedureStep{"FUEL PUMP 5 Off", 2270, false, 500,  "(A:FUELSYSTEM PUMP SWITCH:5, Bool) !",        "5 (>K:FUELSYSTEM_PUMP_OFF)"},
  new ProcedureStep{"FUEL PUMP 1 Off", 2280, false, 100,  "(A:FUELSYSTEM PUMP SWITCH:1, Bool) !",        "1 (>K:FUELSYSTEM_PUMP_OFF)"},
  new ProcedureStep{"FUEL PUMP 4 Off", 2290, false, 500,  "(A:FUELSYSTEM PUMP SWITCH:4, Bool) !",        "4 (>K:FUELSYSTEM_PUMP_OFF)"},
  new ProcedureStep{"FUEL PUMP 3 Off", 2300, false, 100,  "(A:FUELSYSTEM PUMP SWITCH:3, Bool) !",        "3 (>K:FUELSYSTEM_PUMP_OFF)"},
  new ProcedureStep{"FUEL PUMP 6 Off", 2310, false, 1000, "(A:FUELSYSTEM PUMP SWITCH:6, Bool) !",        "6 (>K:FUELSYSTEM_PUMP_OFF)"},
};

static vector<ProcedureStep*>* TAXI_CONFIG_ON = new vector<ProcedureStep*>{
  new ProcedureStep{"ENG MODE SEL START",   3000, false, 3000,  "(L:A32NX_ENGINE_STATE:1) 1 == "
                                                                "(L:A32NX_ENGINE_STATE:2) 1 == && "
                                                                "(K:TURBINE_IGNITION_SWITCH_SET1) 2 == "
                                                                "(K:TURBINE_IGNITION_SWITCH_SET2) 2 == && ||",      "2 (>K:TURBINE_IGNITION_SWITCH_SET1) 2 (>K:TURBINE_IGNITION_SWITCH_SET2)"},
  new ProcedureStep{"ENG 2 ON",             3010, false, 60000, "(A:FUELSYSTEM VALVE OPEN:2, Bool)",                "2 (>K:FUELSYSTEM_VALVE_OPEN)"},
  new ProcedureStep{"Await ENG 2 AVAIL",    3020, true,  5000,  "",                                                 "(L:A32NX_ENGINE_STATE:2) 1 =="},
  new ProcedureStep{"ENG 1 ON",             3030, false, 60000, "(A:FUELSYSTEM VALVE OPEN:1, Bool)",                "1 (>K:FUELSYSTEM_VALVE_OPEN)"},
  new ProcedureStep{"Await ENG 1 AVAIL",    3040, true,  5000,  "",                                                 "(L:A32NX_ENGINE_STATE:1) 1 =="},
  new ProcedureStep{"ENG MODE SEL NORM",    3050, false, 3000,  "(A:TURB ENG IGNITION SWITCH EX1:1, Bool) 1 == "
                                                                "(A:TURB ENG IGNITION SWITCH EX1:2, Bool) 1 == &&", "1 (>K:TURBINE_IGNITION_SWITCH_SET1) 1 (>K:TURBINE_IGNITION_SWITCH_SET2)"},
  new ProcedureStep{"APU Bleed Off",        3060, false, 2000,  "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) 0 ==",      "0 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
  new ProcedureStep{"APU Master Off",       3070, false, 2000,  "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 0 ==",       "0 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
  new ProcedureStep{"Autobrake Max",        3080, false, 2000,  "(L:A32NX_AUTOBRAKES_ARMED_MODE) 3 ==",             "3 (>L:A32NX_AUTOBRAKES_ARMED_MODE_SET)"},
  new ProcedureStep{"Spoiler Arm",          3090, false, 2000,  "(L:A32NX_SPOILERS_ARMED) 1 ==",                    "1 (>K:SPOILERS_ARM_SET)"},
  new ProcedureStep{"Rudder Trim Reset",    3100, false, 2000,  "(A:RUDDER TRIM, Radians) 0 ==",                    "0 (>K:RUDDER_TRIM_SET)"},
  new ProcedureStep{"Flaps 1",              3110, false, 3000,  "(L:A32NX_FLAPS_HANDLE_INDEX) 1 ==",                "1 (>L:A32NX_FLAPS_HANDLE_INDEX)"},
  new ProcedureStep{"NOSE Lt Taxi",         3120, false, 1000,  "(A:CIRCUIT SWITCH ON:20, Bool)",                   "0 (>L:LIGHTING_LANDING_1) (A:CIRCUIT SWITCH ON:20, Bool) ! if{ 20 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  new ProcedureStep{"RWY TURN OFF Lt L On", 3130, false, 0,     "(A:CIRCUIT SWITCH ON:21, Bool)",                   "(A:CIRCUIT SWITCH ON:21, Bool) ! if{ 21 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  new ProcedureStep{"RWY TURN OFF Lt R On", 3140, false, 1000,  "(A:CIRCUIT SWITCH ON:22, Bool)",                   "(A:CIRCUIT SWITCH ON:22, Bool) ! if{ 22 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
};

static vector<ProcedureStep*>* TAXI_CONFIG_OFF = new vector<ProcedureStep*>{
  new ProcedureStep{"NOSE Lt Taxi",          3150, false, 1000, "(A:CIRCUIT SWITCH ON:20, Bool) !",     "2 (>L:LIGHTING_LANDING_1) (A:CIRCUIT SWITCH ON:20, Bool) if{ 20 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  new ProcedureStep{"RWY TURN OFF Lt L Off", 3160, false, 0,    "(A:CIRCUIT SWITCH ON:21, Bool) !",     "(A:CIRCUIT SWITCH ON:21, Bool) if{ 21 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  new ProcedureStep{"RWY TURN OFF Lt R Off", 3170, false, 2000, "(A:CIRCUIT SWITCH ON:22, Bool) !",     "(A:CIRCUIT SWITCH ON:22, Bool) if{ 22 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  new ProcedureStep{"Autobrake Off",         3180, false, 2000, "(L:A32NX_AUTOBRAKES_ARMED_MODE) 0 ==", "0 (>L:A32NX_AUTOBRAKES_ARMED_MODE_SET)"},
  new ProcedureStep{"Spoiler Disarm",        3190, false, 2000, "(L:A32NX_SPOILERS_ARMED) 0 ==",        "0 (>K:SPOILERS_ARM_SET)"},
  new ProcedureStep{"Rudder Trim Reset",     3200, false, 2000, "(A:RUDDER TRIM, Radians) 0 ==",        "0 (>K:RUDDER_TRIM_SET)"},
  new ProcedureStep{"Flaps 0",               3210, false, 2000, "(L:A32NX_FLAPS_HANDLE_INDEX) 0 ==",    "0 (>L:A32NX_FLAPS_HANDLE_INDEX)"},
  new ProcedureStep{"ENG 1 Off",             3220, false, 2000, "(A:FUELSYSTEM VALVE OPEN:1, Bool) !",  "1 (>K:FUELSYSTEM_VALVE_CLOSE)"},
  new ProcedureStep{"ENG 2 Off",             3230, false, 2000, "(A:FUELSYSTEM VALVE OPEN:2, Bool) !",  "2 (>K:FUELSYSTEM_VALVE_CLOSE)"},
  new ProcedureStep{"ENG 1 N1 <3%",          3240, true,  1000, "",                                     "(L:A32NX_ENGINE_N1:1) 3 <"},
  new ProcedureStep{"ENG 2 N1 <3%",          3250, true,  1000, "",                                     "(L:A32NX_ENGINE_N1:2) 3 <"},
};

static vector<ProcedureStep*>* TAKEOFF_CONFIG_ON = new vector<ProcedureStep*>{
  new ProcedureStep{"WX Radar On",       4000, false, 1000, "(L:XMLVAR_A320_WEATHERRADAR_SYS) 0 ==",  "0 (>L:XMLVAR_A320_WEATHERRADAR_SYS)"},
  new ProcedureStep{"WX Radar Mode",     4010, false, 1000, "(L:XMLVAR_A320_WEATHERRADAR_MODE) 1 ==", "1 (>L:XMLVAR_A320_WEATHERRADAR_MODE)"},
  new ProcedureStep{"TCAS Switch TA/RA", 4020, false, 2000, "(L:A32NX_SWITCH_TCAS_POSITION) 2 ==",    "2 (>L:A32NX_SWITCH_TCAS_POSITION)"},
  new ProcedureStep{"NOSE Lt Takeoff",   4030, false, 1000, "(A:CIRCUIT SWITCH ON:17, Bool)",         "(A:CIRCUIT SWITCH ON:17, Bool) ! if{ 17 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  new ProcedureStep{"LL Lt L On",        4040, false, 0,    "(A:CIRCUIT SWITCH ON:18, Bool)",         "0 (>L:LIGHTING_LANDING_2) 0 (>L:LANDING_2_RETRACTED) (A:CIRCUIT SWITCH ON:18, Bool) ! if{ 18 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  new ProcedureStep{"LL Lt R On",        4050, false, 1000, "(A:CIRCUIT SWITCH ON:19, Bool)",         "0 (>L:LIGHTING_LANDING_3) 0 (>L:LANDING_3_RETRACTED) (A:CIRCUIT SWITCH ON:19, Bool) ! if{ 19 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
};

static vector<ProcedureStep*>* TAKEOFF_CONFIG_OFF = new vector<ProcedureStep*>{
  new ProcedureStep{"LL Lt L Off",       4060, false, 0,    "(A:CIRCUIT SWITCH ON:18, Bool) ! (L:LANDING_2_RETRACTED) &&", "2 (>L:LIGHTING_LANDING_2) 1 (>L:LANDING_2_RETRACTED) (A:CIRCUIT SWITCH ON:18, Bool) if{ 18 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  new ProcedureStep{"LL Lt R Off",       4070, false, 1000, "(A:CIRCUIT SWITCH ON:19, Bool) ! (L:LANDING_3_RETRACTED) &&", "2 (>L:LIGHTING_LANDING_3) 1 (>L:LANDING_3_RETRACTED) (A:CIRCUIT SWITCH ON:19, Bool) if{ 19 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  new ProcedureStep{"NOSE Lt Takeoff",   4080, false, 2000, "(A:CIRCUIT SWITCH ON:17, Bool) !",                            "(A:CIRCUIT SWITCH ON:17, Bool) if{ 17 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  new ProcedureStep{"TCAS Switch TA/RA", 4090, false, 1000, "(L:A32NX_SWITCH_TCAS_POSITION) 0 ==",                         "0 (>L:A32NX_SWITCH_TCAS_POSITION)"},
  new ProcedureStep{"WX Radar Off",      4100, false, 1000, "(L:XMLVAR_A320_WEATHERRADAR_SYS) 1 ==",                       "1 (>L:XMLVAR_A320_WEATHERRADAR_SYS)"},
  new ProcedureStep{"WX Radar Mode",     4110, false, 1000, "(L:XMLVAR_A320_WEATHERRADAR_MODE) 1 ==",                      "1 (>L:XMLVAR_A320_WEATHERRADAR_MODE)"},
};
// @formatter:on

class AircraftProcedures {
  vector<ProcedureStep*>* coldAndDark = new vector<ProcedureStep*>;
  vector<ProcedureStep*>* turnaround = new vector<ProcedureStep*>;
  vector<ProcedureStep*>* readyForPushback = new vector<ProcedureStep*>;
  vector<ProcedureStep*>* readyForTaxi = new vector<ProcedureStep*>;
  vector<ProcedureStep*>* readyForTakeoff = new vector<ProcedureStep*>;
  // just to get a list of IDs
  vector<ProcedureStep*>* all = new vector<ProcedureStep*>;

public:
  AircraftProcedures() {
    // Map the procedure groups

#ifdef DEBUG
    // This is used to generate a list of IDs which can be printed to console to
    // add them to the EFB code to display the current step.
    all->insert(all->end(), TURNAROUND_CONFIG_ON->begin(), TURNAROUND_CONFIG_ON->end());
    all->insert(all->end(), PUSHBACK_CONFIG_ON->begin(), PUSHBACK_CONFIG_ON->end());
    all->insert(all->end(), TAXI_CONFIG_ON->begin(), TAXI_CONFIG_ON->end());
    all->insert(all->end(), TAKEOFF_CONFIG_ON->begin(), TAKEOFF_CONFIG_ON->end());
    all->insert(all->end(), TAKEOFF_CONFIG_OFF->begin(), TAKEOFF_CONFIG_OFF->end());
    all->insert(all->end(), TAXI_CONFIG_OFF->begin(), TAXI_CONFIG_OFF->end());
    all->insert(all->end(), PUSHBACK_CONFIG_OFF->begin(), PUSHBACK_CONFIG_OFF->end());
    all->insert(all->end(), TURNAROUND_CONFIG_OFF->begin(), TURNAROUND_CONFIG_OFF->end());

    std::for_each(all->begin(), all->end(), [&](ProcedureStep* item) {
      std::cout << item->id << " = " << item->description << std::endl;
    });
#endif

    coldAndDark->insert(coldAndDark->end(), TAKEOFF_CONFIG_OFF->begin(), TAKEOFF_CONFIG_OFF->end());
    coldAndDark->insert(coldAndDark->end(), TAXI_CONFIG_OFF->begin(), TAXI_CONFIG_OFF->end());
    coldAndDark->insert(coldAndDark->end(), PUSHBACK_CONFIG_OFF->begin(), PUSHBACK_CONFIG_OFF->end());
    coldAndDark->insert(coldAndDark->end(), TURNAROUND_CONFIG_OFF->begin(), TURNAROUND_CONFIG_OFF->end());

    turnaround->insert(turnaround->end(), TAKEOFF_CONFIG_OFF->begin(), TAKEOFF_CONFIG_OFF->end());
    turnaround->insert(turnaround->end(), TAXI_CONFIG_OFF->begin(), TAXI_CONFIG_OFF->end());
    turnaround->insert(turnaround->end(), PUSHBACK_CONFIG_OFF->begin(), PUSHBACK_CONFIG_OFF->end());
    turnaround->insert(turnaround->end(), TURNAROUND_CONFIG_ON->begin(), TURNAROUND_CONFIG_ON->end());

    readyForPushback->insert(readyForPushback->end(), TAKEOFF_CONFIG_OFF->begin(), TAKEOFF_CONFIG_OFF->end());
    readyForPushback->insert(readyForPushback->end(), TAXI_CONFIG_OFF->begin(), TAXI_CONFIG_OFF->end());
    readyForPushback->insert(readyForPushback->end(), TURNAROUND_CONFIG_ON->begin(), TURNAROUND_CONFIG_ON->end());
    readyForPushback->insert(readyForPushback->end(), PUSHBACK_CONFIG_ON->begin(), PUSHBACK_CONFIG_ON->end());

    readyForTaxi->insert(readyForTaxi->end(), TAKEOFF_CONFIG_OFF->begin(), TAKEOFF_CONFIG_OFF->end());
    readyForTaxi->insert(readyForTaxi->end(), TURNAROUND_CONFIG_ON->begin(), TURNAROUND_CONFIG_ON->end());
    readyForTaxi->insert(readyForTaxi->end(), PUSHBACK_CONFIG_ON->begin(), PUSHBACK_CONFIG_ON->end());
    readyForTaxi->insert(readyForTaxi->end(), TAXI_CONFIG_ON->begin(), TAXI_CONFIG_ON->end());

    readyForTakeoff->insert(readyForTakeoff->end(), TURNAROUND_CONFIG_ON->begin(), TURNAROUND_CONFIG_ON->end());
    readyForTakeoff->insert(readyForTakeoff->end(), PUSHBACK_CONFIG_ON->begin(), PUSHBACK_CONFIG_ON->end());
    readyForTakeoff->insert(readyForTakeoff->end(), TAXI_CONFIG_ON->begin(), TAXI_CONFIG_ON->end());
    readyForTakeoff->insert(readyForTakeoff->end(), TAKEOFF_CONFIG_ON->begin(), TAKEOFF_CONFIG_ON->end());
  }

  vector<ProcedureStep*>* getProcedure(int64_t pID) const {
    switch (pID) {
      case 1:
        return coldAndDark;
      case 2:
        return turnaround;
      case 3:
        return readyForPushback;
      case 4:
        return readyForTaxi;
      case 5:
        return readyForTakeoff;
      default:
        return nullptr;
    }
  }

};
