#pragma once

#include <map>
#include <string>
#include <vector>

using namespace std;

struct ProcedureStep {
  std::string description;
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

static vector<ProcedureStep>* TURNAROUND_CONFIG_ON = new vector<ProcedureStep>{
  {"BAT1 On",            false, 100,  "(L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)",              "1 (>L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)"},
  {"BAT2 On",            false, 3000, "(L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)",              "1 (>L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)"},
  {"EXT PWR ON",         false, 3000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) "
                                      "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) && "
                                      "(L:A32NX_ENGINE_STATE:1) 1 == || "
                                      "(L:A32NX_ENGINE_STATE:2) 1 == || "
                                      "(A:EXTERNAL POWER ON:1, BOOL) ||",                  "(A:EXTERNAL POWER ON:1, BOOL) ! if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
  {"APU Master On",      false, 3000, "(L:A32NX_ENGINE_STATE:1) 1 == "
                                      "(L:A32NX_ENGINE_STATE:2) 1 == && "
                                      "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 1 == ||",     "1 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
  {"APU Start On",       false, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                      "(L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||",       "1 (>L:A32NX_OVHD_APU_START_PB_IS_ON)"},
  {"AC BUS Avail Check", true,  2000, "",                                                  "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED)"},
  {"Nav & Logo Lt On",   false, 1000, "(A:LIGHT LOGO, Bool) (A:LIGHT NAV, Bool) &&",       "1 (>K:2:LOGO_LIGHTS_SET) 1 (>K:2:NAV_LIGHTS_SET)"},
  {"ADIRS 1 Nav",        false, 500,  "(L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB) 1 ==", "1 (>L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB)"},
  {"ADIRS 2 Nav",        false, 500,  "(L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB) 1 ==", "1 (>L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB)"},
  {"ADIRS 3 Nav",        false, 500,  "(L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB) 1 ==", "1 (>L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB)"},
  {"GND CTL On",         false, 500,  "(L:A32NX_ENGINE_STATE:1) 1 == "
                                      "(L:A32NX_ENGINE_STATE:2) 1 == || "
                                      "(L:A32NX_RCDR_GROUND_CONTROL_ON) 1 == ||",          "1 (>L:A32NX_RCDR_GROUND_CONTROL_ON)"},
  {"Crew Oxy On",        false, 1000, "(L:PUSH_OVHD_OXYGEN_CREW) 0 ==",                    "0 (>L:PUSH_OVHD_OXYGEN_CREW)"},
  {"APU Avail Check",    true,  2000, "",                                                  "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! (L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE) ||"},
  {"APU Bleed On",       false, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) ! "
                                      "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) ||",         "1 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
};

static vector<ProcedureStep>* TURNAROUND_CONFIG_OFF = new vector<ProcedureStep>{
  {"Crew Oxy Off",      false, 500,  "(L:PUSH_OVHD_OXYGEN_CREW) 1 ==",                    "1 (>L:PUSH_OVHD_OXYGEN_CREW)"},
  {"GND CTL Off",       false, 500,  "(L:A32NX_RCDR_GROUND_CONTROL_ON) 0 ==",             "0 (>L:A32NX_RCDR_GROUND_CONTROL_ON)"},
  {"ADIRS 3 Off",       false, 500,  "(L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB) 0 ==", "0 (>L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB)"},
  {"ADIRS 2 Off",       false, 500,  "(L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB) 0 ==", "0 (>L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB)"},
  {"ADIRS 1 Off",       false, 500,  "(L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB) 0 ==", "0 (>L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB)"},
  {"Nav & Logo Lt Off", false, 500,  "(A:LIGHT LOGO, Bool) ! (A:LIGHT NAV, Bool) ! &&",   "0 (>K:2:LOGO_LIGHTS_SET) 0 (>K:2:NAV_LIGHTS_SET)"},
  {"APU Bleed Off",     false, 1000, "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) 0 ==",       "0 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
  {"APU Master Off",    false, 1000, "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 0 ==",        "0 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
  {"EXT PWR Off",       false, 3000, "(A:EXTERNAL POWER ON:1, BOOL) !",                   "(A:EXTERNAL POWER ON:1, BOOL) if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},
  {"BAT2 Off",          false, 100,  "(L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO) 0 ==",         "0 (>L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO)"},
  {"BAT1 Off",          false, 1000, "(L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO) 0 ==",         "0 (>L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO)"},
  // Wait until AC power is off and aircraft completely cold & dark
  {"AC BUS Off Check",  true,  2000, "",                                                  "(L:A32NX_ELEC_AC_1_BUS_IS_POWERED) !"},
};

static vector<ProcedureStep>* PUSHBACK_CONFIG_ON = new vector<ProcedureStep>{
  {"EXT PWR Off",      false, 3000, "(A:EXTERNAL POWER ON:1, BOOL) !",                      "(A:EXTERNAL POWER ON:1, BOOL) if{ 1 (>K:TOGGLE_EXTERNAL_POWER) }"},

  {"FUEL PUMP 2 On",   false, 100,  "(A:FUELSYSTEM PUMP SWITCH:2, Bool)",                   "2 (>K:FUELSYSTEM_PUMP_ON)"},
  {"FUEL PUMP 5 On",   false, 500,  "(A:FUELSYSTEM PUMP SWITCH:5, Bool)",                   "5 (>K:FUELSYSTEM_PUMP_ON)"},
  {"FUEL PUMP 1 On",   false, 100,  "(A:FUELSYSTEM PUMP SWITCH:1, Bool)",                   "1 (>K:FUELSYSTEM_PUMP_ON)"},
  {"FUEL PUMP 4 On",   false, 500,  "(A:FUELSYSTEM PUMP SWITCH:4, Bool)",                   "4 (>K:FUELSYSTEM_PUMP_ON)"},
  {"FUEL PUMP 3 On",   false, 100,  "(A:FUELSYSTEM PUMP SWITCH:3, Bool)",                   "3 (>K:FUELSYSTEM_PUMP_ON)"},
  {"FUEL PUMP 6 On",   false, 1000, "(A:FUELSYSTEM PUMP SWITCH:6, Bool)",                   "6 (>K:FUELSYSTEM_PUMP_ON)"},
  {"Radar PWS On",     false, 500,  "(L:A32NX_SWITCH_RADAR_PWS_POSITION) 1 ==",             "1 (>L:A32NX_SWITCH_RADAR_PWS_POSITION)"},
  {"Transponder On",   false, 500,  "(L:A32NX_TRANSPONDER_MODE) 1 ==",                      "1 (>L:A32NX_TRANSPONDER_MODE)"},
  {"ATC ALT RPTG On",  false, 500,  "(L:A32NX_SWITCH_ATC_ALT) 1 ==",                        "1 (>L:A32NX_SWITCH_ATC_ALT)"},
  {"TCAS TRAFFIC ABV", false, 500,  "(L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION) 2 ==",          "2 (>L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION)"},
  {"COCKPIT DOOR LCK", false, 500,  "(L:A32NX_COCKPIT_DOOR_LOCKED) 1 ==",                   "1 (>L:A32NX_COCKPIT_DOOR_LOCKED)"},
  {"Strobe Auto",      false, 500,  "(A:LIGHT STROBE, Bool)",                               "1 (>L:STROBE_0_AUTO) 0 (>K:STROBES_ON)"},
  {"Beacon On",        false, 500,  "(A:LIGHT BEACON, Bool)",                               "0 (>K:BEACON_LIGHTS_ON)"},
  {"NO SMOKING On",    false, 500,  "(L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION) 1 ==", "1 (>L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION)"},
  {"EMER EXT Lt On",   false, 500,  "(L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION) 1 ==",  "1 (>L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION)"},
  {"SEAT BELTS On",    false, 500,  "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL)",             "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) ! if{ 1 (>K:CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE) }"},
};

static vector<ProcedureStep>* PUSHBACK_CONFIG_OFF = new vector<ProcedureStep>{
  {"Strobe Off",       false, 500,  "(A:LIGHT STROBE, Bool) !",                             "0 (>L:STROBE_0_AUTO) 0 (>K:STROBES_OFF)"},
  {"Beacon Off",       false, 500,  "(A:LIGHT BEACON, Bool) !",                             "0 (>K:BEACON_LIGHTS_OFF)"},
  {"SEAT BELTS Off",   false, 500,  "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) !",           "(A:CABIN SEATBELTS ALERT SWITCH:1, BOOL) if{ 1 (>K:CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE) }"},
  {"NO SMOKING Off",   false, 500,  "(L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION) 2 ==", "2 (>L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION)"},
  {"EMER EXT Lt Off",  false, 500,  "(L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION) 2 ==",  "2 (>L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION)"},
  {"Radar PWS Off",    false, 500,  "(L:A32NX_SWITCH_RADAR_PWS_POSITION) 0 ==",             "0 (>L:A32NX_SWITCH_RADAR_PWS_POSITION)"},
  {"Transponder Off",  false, 500,  "(L:A32NX_TRANSPONDER_MODE) 0 ==",                      "0 (>L:A32NX_TRANSPONDER_MODE)"},
  {"ATC ALT RPTG Off", false, 500,  "(L:A32NX_SWITCH_ATC_ALT) 1 ==",                        "1 (>L:A32NX_SWITCH_ATC_ALT)"},
  {"TCAS TRAFFIC ABV", false, 500,  "(L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION) 2 ==",          "2 (>L:A32NX_SWITCH_TCAS_TRAFFIC_POSITION)"},
  {"COCKPIT DOOR OP",  false, 1000, "(L:A32NX_COCKPIT_DOOR_LOCKED) 0 ==",                   "0 (>L:A32NX_COCKPIT_DOOR_LOCKED)"},
  {"FUEL PUMP 2 Off",  false, 100,  "(A:FUELSYSTEM PUMP SWITCH:2, Bool) !",                 "2 (>K:FUELSYSTEM_PUMP_OFF)"},
  {"FUEL PUMP 5 Off",  false, 500,  "(A:FUELSYSTEM PUMP SWITCH:5, Bool) !",                 "5 (>K:FUELSYSTEM_PUMP_OFF)"},
  {"FUEL PUMP 1 Off",  false, 100,  "(A:FUELSYSTEM PUMP SWITCH:1, Bool) !",                 "1 (>K:FUELSYSTEM_PUMP_OFF)"},
  {"FUEL PUMP 4 Off",  false, 500,  "(A:FUELSYSTEM PUMP SWITCH:4, Bool) !",                 "4 (>K:FUELSYSTEM_PUMP_OFF)"},
  {"FUEL PUMP 3 Off",  false, 100,  "(A:FUELSYSTEM PUMP SWITCH:3, Bool) !",                 "3 (>K:FUELSYSTEM_PUMP_OFF)"},
  {"FUEL PUMP 6 Off",  false, 1000, "(A:FUELSYSTEM PUMP SWITCH:6, Bool) !",                 "6 (>K:FUELSYSTEM_PUMP_OFF)"},
};

static vector<ProcedureStep>* TAXI_CONFIG_ON = new vector<ProcedureStep>{
  {"ADIRS 1 Alignment",  true,  2000,  "",                                                 "(L:A32NX_ADIRS_ADIRU_1_STATE) 2 =="},
  {"ADIRS 2 Alignment",  true,  2000,  "",                                                 "(L:A32NX_ADIRS_ADIRU_2_STATE) 2 =="},
  {"ADIRS 3 Alignment",  true,  2000,  "",                                                 "(L:A32NX_ADIRS_ADIRU_3_STATE) 2 =="},
  {"ENG MODE SEL START", false, 2000,  "(L:A32NX_ENGINE_STATE:1) 1 == "
                                       "(L:A32NX_ENGINE_STATE:2) 1 == && "
                                       "(K:TURBINE_IGNITION_SWITCH_SET1) 2 == "
                                       "(K:TURBINE_IGNITION_SWITCH_SET2) 2 == && ||",      "2 (>K:TURBINE_IGNITION_SWITCH_SET1) 2 (>K:TURBINE_IGNITION_SWITCH_SET2)"},
  {"ENG 2 ON",           false, 50000, "(A:FUELSYSTEM VALVE OPEN:2, Bool)",                "2 (>K:FUELSYSTEM_VALVE_OPEN)"},
  {"ENG 2 Avail Check",  true,  5000,  "",                                                 "(L:A32NX_ENGINE_STATE:2) 1 =="},
  {"ENG 1 ON",           false, 50000, "(A:FUELSYSTEM VALVE OPEN:1, Bool)",                "1 (>K:FUELSYSTEM_VALVE_OPEN)"},
  {"ENG 1 Avail Check",  true,  5000,  "",                                                 "(L:A32NX_ENGINE_STATE:1) 1 =="},
  {"ENG MODE SEL NORM",  false, 2000,  "(A:TURB ENG IGNITION SWITCH EX1:1, Bool) 1 == "
                                       "(A:TURB ENG IGNITION SWITCH EX1:2, Bool) 1 == &&", "1 (>K:TURBINE_IGNITION_SWITCH_SET1) 1 (>K:TURBINE_IGNITION_SWITCH_SET2)"},
  {"APU Bleed Off",      false, 1000,  "(L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON) 0 ==",      "0 (>L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON)"},
  {"APU Master Off",     false, 1000,  "(L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON) 0 ==",       "0 (>L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON)"},
  {"Autobrake Max",      false, 1000,  "(L:A32NX_AUTOBRAKES_ARMED_MODE) 3 ==",             "3 (>L:A32NX_AUTOBRAKES_ARMED_MODE)"},
  {"Spoiler Arm",        false, 1000,  "(L:A32NX_SPOILERS_ARMED) 1 ==",                    "1 (>K:SPOILERS_ARM_SET)"},
  {"Rudder Trim Reset",  false, 1000,  "(A:RUDDER TRIM, Radians) 0 ==",                    "0 (>K:RUDDER_TRIM_SET)"},
  {"Flaps 1",            false, 1000,  "(L:A32NX_FLAPS_HANDLE_INDEX) 1 ==",                "1 (>L:A32NX_FLAPS_HANDLE_INDEX)"},
  {"NOSE Lt Taxi",       false, 500,   "(A:CIRCUIT SWITCH ON:20, Bool)",                   "0 (>L:LIGHTING_LANDING_1) (A:CIRCUIT SWITCH ON:20, Bool) ! if{ 20 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  {"RWY TURN OFF Lt L",  false, 0,     "(A:CIRCUIT SWITCH ON:21, Bool)",                   "(A:CIRCUIT SWITCH ON:21, Bool) ! if{ 21 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  {"RWY TURN OFF Lt R",  false, 500,   "(A:CIRCUIT SWITCH ON:22, Bool)",                   "(A:CIRCUIT SWITCH ON:22, Bool) ! if{ 22 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
};

static vector<ProcedureStep>* TAXI_CONFIG_OFF = new vector<ProcedureStep>{
  {"NOSE Lt Taxi",      false, 500,  "(A:CIRCUIT SWITCH ON:20, Bool) !",     "2 (>L:LIGHTING_LANDING_1) (A:CIRCUIT SWITCH ON:20, Bool) if{ 20 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  {"RWY TURN OFF Lt L", false, 0,    "(A:CIRCUIT SWITCH ON:21, Bool) !",     "(A:CIRCUIT SWITCH ON:21, Bool) if{ 21 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  {"RWY TURN OFF Lt R", false, 500,  "(A:CIRCUIT SWITCH ON:22, Bool) !",     "(A:CIRCUIT SWITCH ON:22, Bool) if{ 22 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  {"Autobrake Off",     false, 1000, "(L:A32NX_AUTOBRAKES_ARMED_MODE) 0 ==", "0 (>L:A32NX_AUTOBRAKES_ARMED_MODE)"},
  {"Spoiler Disarm",    false, 1000, "(L:A32NX_SPOILERS_ARMED) 0 ==",        "0 (>K:SPOILERS_ARM_SET)"},
  {"Rudder Trim Reset", false, 1000, "(A:RUDDER TRIM, Radians) 0 ==",        "0 (>K:RUDDER_TRIM_SET)"},
  {"Flaps 0",           false, 1000, "(L:A32NX_FLAPS_HANDLE_INDEX) 0 ==",    "0 (>L:A32NX_FLAPS_HANDLE_INDEX)"},
  {"ENG 1 Off",         false, 1000, "(A:FUELSYSTEM VALVE OPEN:1, Bool) !",  "1 (>K:FUELSYSTEM_VALVE_CLOSE)"},
  {"ENG 2 Off",         false, 1000, "(A:FUELSYSTEM VALVE OPEN:2, Bool) !",  "2 (>K:FUELSYSTEM_VALVE_CLOSE)"},
  {"ENG 1 N2 <3",       true,  1000, "",                                     "(L:A32NX_ENGINE_N1:1) 3 <"},
  {"ENG 2 N1 <3",       true,  1000, "",                                     "(L:A32NX_ENGINE_N1:2) 3 <"},
};

static vector<ProcedureStep>* TAKEOFF_CONFIG_ON = new vector<ProcedureStep>{
  {"WX Radar On",       false, 1000, "(L:XMLVAR_A320_WEATHERRADAR_SYS) 0 ==",  "0 (>L:XMLVAR_A320_WEATHERRADAR_SYS)"},
  {"WX Radar Mode",     false, 1000, "(L:XMLVAR_A320_WEATHERRADAR_MODE) 1 ==", "1 (>L:XMLVAR_A320_WEATHERRADAR_MODE)"},
  {"TCAS Switch TA/RA", false, 1000, "(L:A32NX_SWITCH_TCAS_POSITION) 2 ==",    "2 (>L:A32NX_SWITCH_TCAS_POSITION)"},
  {"NOSE Lt Takeoff",   false, 500,  "(A:CIRCUIT SWITCH ON:17, Bool)",         "(A:CIRCUIT SWITCH ON:17, Bool) ! if{ 17 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  {"LL Lt L",           false, 500,  "(A:CIRCUIT SWITCH ON:18, Bool)",         "0 (>L:LIGHTING_LANDING_2) 0 (>L:LANDING_2_RETRACTED) (A:CIRCUIT SWITCH ON:18, Bool) ! if{ 18 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  {"LL Lt R",           false, 500,  "(A:CIRCUIT SWITCH ON:19, Bool)",         "0 (>L:LIGHTING_LANDING_3) 0 (>L:LANDING_3_RETRACTED) (A:CIRCUIT SWITCH ON:19, Bool) ! if{ 19 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
};

static vector<ProcedureStep>* TAKEOFF_CONFIG_OFF = new vector<ProcedureStep>{
  {"LL Lt L",           false, 500,  "(A:CIRCUIT SWITCH ON:18, Bool) ! (L:LANDING_2_RETRACTED) &&", "2 (>L:LIGHTING_LANDING_2) 1 (>L:LANDING_2_RETRACTED) (A:CIRCUIT SWITCH ON:18, Bool) if{ 18 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  {"LL Lt R",           false, 500,  "(A:CIRCUIT SWITCH ON:19, Bool) ! (L:LANDING_3_RETRACTED) &&", "2 (>L:LIGHTING_LANDING_3) 1 (>L:LANDING_3_RETRACTED) (A:CIRCUIT SWITCH ON:19, Bool) if{ 19 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  {"NOSE Lt Takeoff",   false, 1000, "(A:CIRCUIT SWITCH ON:17, Bool) !",                            "(A:CIRCUIT SWITCH ON:17, Bool) if{ 17 (>K:ELECTRICAL_CIRCUIT_TOGGLE)"},
  {"TCAS Switch TA/RA", false, 1000, "(L:A32NX_SWITCH_TCAS_POSITION) 0 ==",                         "0 (>L:A32NX_SWITCH_TCAS_POSITION)"},
  {"WX Radar Off",      false, 500,  "(L:XMLVAR_A320_WEATHERRADAR_SYS) 1 ==",                       "1 (>L:XMLVAR_A320_WEATHERRADAR_SYS)"},
  {"WX Radar Mode",     false, 1000, "(L:XMLVAR_A320_WEATHERRADAR_MODE) 1 ==",                      "1 (>L:XMLVAR_A320_WEATHERRADAR_MODE)"},
};

class AircraftProcedures {
  vector<ProcedureStep>* coldAndDark = new vector<ProcedureStep>;
  vector<ProcedureStep>* turnaround = new vector<ProcedureStep>;
  vector<ProcedureStep>* readyForPushback = new vector<ProcedureStep>;
  vector<ProcedureStep>* readyForTaxi = new vector<ProcedureStep>;
  vector<ProcedureStep>* readyForTakeoff = new vector<ProcedureStep>;

public:
  AircraftProcedures() {
    // Map the procedure groups

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

  vector<ProcedureStep>* getProcedure(int64_t pID) const {
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




