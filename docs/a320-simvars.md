# A320neo Local SimVars

## Contents

1. [Uncategorized](#uncategorized)
1. [EIS Display System](#eis-display-system)
1. [Fly-By-Wire System](#fly-by-wire-system)
1. [ADIRS](#adirs)
1. [Autopilot System](#autopilot-system)
1. [Autothrust System](#autothrust-system)
1. [Throttle Mapping System](#throttle-mapping-system)
1. [Engine and FADEC System](#engine-and-fadec-system)
1. [Air Conditioning / Pressurisation / Ventilation](#air-conditioning--pressurisation--ventilation)
1. [Pneumatic](#pneumatic)

## Uncategorized

- A32NX_NO_SMOKING_MEMO
    - Boolean that determines whether the NO SMOKING memo should be visible on the upper ECAM
    - Also is used for knowing when to play the no smoking chime sound

- A32NX_BRAKE_TEMPERATURE_{1,2,3,4}
    - celsius
    - represents the brake temperature of the rear wheels

- A32NX_REPORTED_BRAKE_TEMPERATURE_{1,2,3,4}
    - celsius
    - represents the reported brake temperature of the rear wheels by the sensor.
    - It can be different from the brake temperature when the brake fan has been used, because the brake fan will cool the sensor more than the brakes
    - (which have much more energy to dissipate) therefore giving potentially erroneous readings that the pilots must take into account

- A32NX_BRAKE_FAN
    - boolean
    - whether or not the brake fan is running (brake fan button pressed AND left main landing gear down and locked)

- A32NX_BRAKE_FAN_BTN_PRESSED
    - boolean
    - whether or not the brake fan button is pressed

- A32NX_BRAKES_HOT
    - boolean
    - whether one of the brakes are hot (>300°C)

- XMLVAR_Auto
    - Used in the `.flt` files to set a default value for the ATC 3 way switch on the TCAS panel
    - Maps to the `I:XMLVAR_Auto` variable which is the actual backing var for the switch

- XMLVAR_ALT_MODE_REQUESTED
    - Used in the `.flt` files to set a default value for the ALT RPTG 2 way switch on the TCAS panel
    - Maps to the `I:XMLVAR_ALT_MODE_REQUESTED` variable which is the actual backing var for the switch

- A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position
    - Position (0-2)
    - 0 is SHUT, 1 is AUTO, 2 is OPEN

- A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position
    - Position (0-2)
    - 0 is LO, 1 is NORM, 2 is HI

- A32NX_AIRCOND_PACK1_FAULT
    - Bool
    - True if fault in pack 1

- A32NX_AIRCOND_PACK1_TOGGLE
    - Bool
    - True if pack 1 is on

- A32NX_AIRCOND_PACK2_FAULT
    - Bool
    - True if fault in pack 2

- A32NX_AIRCOND_PACK2_TOGGLE
    - Bool
    - True if pack 2 is on

- A32NX_AIRCOND_HOTAIR_FAULT
    - Bool
    - True if fault in hot air system

- A32NX_AIRCOND_HOTAIR_TOGGLE
    - Bool
    - True if hot air system is on

- A32NX_AIRCOND_RAMAIR_TOGGLE
    - Bool
    - True if ram air is on

- A32NX_CALLS_EMER_ON
    - Bool
    - True if emergency cabin call is on

- A32NX_OVHD_COCKPITDOORVIDEO_TOGGLE
    - Bool
    - True if cockpit door video system is on

- PUSH_DOORPANEL_VIDEO
    - Bool
    - True if pedestal door video button is being held

- A32NX_OVHD_HYD_{name}_PUMP_PB_HAS_FAULT
    - Bool
    - True if engine {name} hyd pump fault
    - {name}
        - ENG_1
        - ENG_2

- A32NX_OVHD_HYD_{name}_PUMP_PB_IS_AUTO
    - Bool
    - True if {name} hyd pump is on
    - {name}
        - ENG_1
        - ENG_2

- A32NX_OVHD_HYD_{name}_PB_HAS_FAULT
    - Bool
    - True if elec {name} hyd pump fault
    - {name}
        - EPUMPB
        - EPUMPY

- A32NX_OVHD_HYD_{name}_PB_IS_AUTO
    - Bool
    - True if elec {name} hyd pump is on/auto
    - {name}
        - EPUMPB
        - EPUMPY

- A32NX_OVHD_HYD_PTU_PB_HAS_FAULT
    - Bool
    - True if PTU fault

- A32NX_OVHD_HYD_PTU_PB_IS_AUTO
    - Bool
    - True if PTU system on/auto

- A32NX_ENGMANSTART1_TOGGLE
    - Bool
    - True if manual engine 1 start on

- A32NX_ENGMANSTART2_TOGGLE
    - Bool
    - True if manual engine 2 start on

- A32NX_VENTILATION_BLOWER_FAULT
    - Bool
    - True if ventilation blower fault

- A32NX_VENTILATION_BLOWER_TOGGLE
    - Bool
    - True if ventilation blower on

- A32NX_VENTILATION_EXTRACT_FAULT
    - Bool
    - True if ventilation extractor fault

- A32NX_VENTILATION_EXTRACT_TOGGLE
    - Bool
    - True if ventilation extractor on

- A32NX_VENTILATION_CABFANS_TOGGLE
    - Bool
    - True if cabin fans on/auto

- A32NX_PITOT_HEAT_AUTO
    - Bool
    - True if pitot heating auto

- A32NX_EVAC_COMMAND_FAULT
    - Bool
    - True if evac command fault

- A32NX_EVAC_COMMAND_TOGGLE
    - Bool
    - True if evac command button is on

- PUSH_OVHD_EVAC_HORN
    - Bool
    - True if evac horn cutout button is being pressed

- A32NX_EVAC_CAPT_TOGGLE
    - Bool
    - True if evac switch set to CAPT

- A32NX_EIS_DMC_SWITCHING_KNOB
    - EIS DMC
    - Position (0-2)
    - 0 is CAPT, 1 is NORM, 2 is F/O

- A32NX_ECAM_ND_XFR_SWITCHING_KNOB
    - ECAM/ND XFR
    - Position (0-2)
    - 0 is CAPT, 1 is NORM, 2 is F/O

- A32NX_METRIC_ALT_TOGGLE
    - Bool
    - True if PFD metric altitude enabled

- A32NX_OVHD_HYD_EPUMPY_OVRD_PB_IS_ON
    - Bool
    - True if "BLUE PUMP OVRD" switch is off

- A32NX_OVHD_HYD_LEAK_MEASUREMENT_G
    - Bool
    - True if "HYD LEAK MEASUREMENT G" switch is on

- A32NX_OVHD_HYD_LEAK_MEASUREMENT_G_LOCK
    - Bool
    - True if "HYD LEAK MEASUREMENT G" switch lock is down

- A32NX_OVHD_HYD_LEAK_MEASUREMENT_B
    - Bool
    - True if "HYD LEAK MEASUREMENT B" switch is on

- A32NX_OVHD_HYD_LEAK_MEASUREMENT_B_LOCK
    - Bool
    - True if "HYD LEAK MEASUREMENT B" switch lock is down

- A32NX_OVHD_HYD_LEAK_MEASUREMENT_Y
    - Bool
    - True if "HYD LEAK MEASUREMENT Y" switch is on

- A32NX_OVHD_HYD_LEAK_MEASUREMENT_Y_LOCK
    - Bool
    - True if "HYD LEAK MEASUREMENT Y" switch lock is down

- A32NX_DESTINATION_QNH
    - Millibar
    - Destination QNH as entered by the pilot in the MCDU during descent

- A32NX_DEPARTURE_ELEVATION
    - Feet
    - Departure runway elevation as calculated by the FMC

- A32NX_FWC_FLIGHT_PHASE
    - Enum
    - Contains the numeric flight phase as determined by the FWC
    - Input for: systems.wasm

- A32NX_FWC_SKIP_STARTUP
    - Bool
    - Set to true in a non-cold and dark flight phase to skip the initial memorization step

- A32NX_FWC_TOMEMO
    - Bool
    - True when the FWC decides that the takeoff memo should be shown

- A32NX_FWC_LDGMEMO
    - Bool
    - True when the FWC decides that the landing memo should be shown

- A32NX_FWC_INHIBOVRD
    - Bool
    - True when the FWC decides that flight phase inhibits should be overridden (and ignored)

- A32NX_VSPEEDS_VS
    - Number
    - Current config stall speed
    - is mach corrected

- A32NX_VSPEEDS_VLS
    - Number
    - Current config minimum selectable speed
    - is mach corrected

- A32NX_VSPEEDS_F
    - Number
    - F-Speed (approach)

- A32NX_VSPEEDS_S
    - Number
    - S-Speed (approach)

- A32NX_VSPEEDS_GD
    - Number
    - Green Dot speed (clean config or O)
    - is mach corrected

- A32NX_VSPEEDS_LANDING_CONF3
    - Bool
    - True if FLAPS 3 is selected in perf page

- A32NX_VSPEEDS_TO_CONF
    - Number
    - Flaps config for TakeOff, 1, 2 or 3

- A32NX_VSPEEDS_V2
    - Number
    - TakeOff V2 Speed calculated based on A32NX_VSPEEDS_TO_CONF config

- A32NX_VSPEEDS_VLS_APP
    - Number
    - vls calculated for config full whether A32NX_VSPEEDS_LANDING_CONF3 or not
    - is mach corrected

- A32NX_VSPEEDS_VAPP
    - Number
    - vapp calculated for config full  whether A32NX_VSPEEDS_LANDING_CONF3 or not
    - is mach corrected

- A32NX_SPEEDS_ALPHA_PROTECTION
    - Number (knots)
    - speed where alpha protection is reached with 1g

- A32NX_SPEEDS_ALPHA_MAX
    - Number (knots)
    - speed where alpha max is reached with 1g

- A32NX_TRK_FPA_MODE_ACTIVE
    - Bool
    - True if TRK/FPA mode is active

- A32NX_AUTOPILOT_TRACK_SELECTED
    - Degrees
    - The selected track in the FCU

- A32NX_AUTOPILOT_FPA_SELECTED
    - Degrees
    - The selected flight path angle in the FCU

- A32NX_APU_EGT_CAUTION
    - `Arinc429Word<Celsius>`
    - The APU's exhaust gas temperature caution level, to be indicated in amber in the cockpit

- A32NX_APU_EGT_WARNING
    - `Arinc429Word<Celsius>`
    - The APU's exhaust gas temperature warning level, to be indicated in red in the cockpit

- A32NX_APU_EGT
    - `Arinc429Word<Celsius>`
    - The APU's exhaust gas temperature,
      when < -273.15 the ECB isn't supplying information, for example due to being unpowered.

- A32NX_APU_N
    - `Arinc429Word<Percent>`
    - The APU's rotations per minute in percentage of the maximum RPM

- A32NX_APU_N_RAW
    - Percent
    - The APU's rotations per minute in percentage of the maximum RPM
      This raw value should only be used for sounds and effects.

- A32NX_APU_BLEED_AIR_VALVE_OPEN
    - Bool
    - Indicates if the APU bleed air valve is open

- A32NX_APU_LOW_FUEL_PRESSURE_FAULT
    - `Arinc429Word<Bool>`

- A32NX_APU_IS_AUTO_SHUTDOWN
    - Bool
    - Indicates if the APU automatically shut down (for a reason other than fire)

- A32NX_APU_IS_EMERGENCY_SHUTDOWN
    - Bool
    - Indicates if the APU automatically shut down due to fire

- A32NX_ECAM_INOP_SYS_APU
    - Bool
    - Indicates if the APU is inoperable

- A32NX_APU_FLAP_OPEN_PERCENTAGE
    - Percent
    - Indicates the percentage the APU air intake flap is open

- A32NX_APU_FLAP_FULLY_OPEN
    - `Arinc429Word<Bool>`

- A32NX_FIRE_BUTTON_APU
    - Bool
    - Indicates if the APU fire button is RELEASED

- A32NX_RMP_L_TOGGLE_SWITCH
    - Boolean
    - Whether the left radio management panel toggle switch is on or off.

- A32NX_RMP_R_TOGGLE_SWITCH
    - Boolean
    - Whether the right radio management panel toggle switch is on or off.

- A32NX_RMP_L_SELECTED_MODE
    - Number
    - The current mode of the left radio management panel.

- A32NX_RMP_R_SELECTED_MODE
    - Number
    - The current mode of the right radio management panel.

- A32NX_RMP_L_VHF2_STANDBY
    - Hz
    - The VHF 2 standby frequency for the left RMP.

- A32NX_RMP_L_VHF3_STANDBY
    - Hz
    - The VHF 3 standby frequency for the left RMP.

- A32NX_RMP_R_VHF1_STANDBY
    - Hz
    - The VHF 1 standby frequency for the right RMP.

- A32NX_RMP_R_VHF3_STANDBY
    - Hz
    - The VHF 3 standby frequency for the right RMP.

- A32NX_TO_CONFIG_FLAPS_ENTERED
    - Bool
    - True if the pilot has entered a FLAPS value in the PERF TAKE OFF takeoff

- A32NX_TO_CONFIG_FLAPS
    - Enum
    - The pilot-entered FLAPS value in the PERF TAKE OFF page. 0 is a valid entry.

- A32NX_TO_CONFIG_THS_ENTERED
    - Bool
    - True if the pilot has entered a THS value in the PERF TAKEO FF takeoff

- A32NX_TO_CONFIG_THS
    - Degrees
    - The pilot-entered THS value in the PERF TAKE OFF page. 0 is a valid entry.

- A32NX_ENG_OUT_ACC_ALT
    - feet
    - The engine out acceleration altitude, set in the PERF TAKE OFF page.

- A32NX_SLIDES_ARMED
    - Boolean
    - Indicates whether the door slides are armed or not

- A32NX_RAIN_REPELLENT_RIGHT_ON
  - Bool
  - True if rain repellent is activated on the right windshield.

- A32NX_RAIN_REPELLENT_LEFT_ON
  - Bool
  - True if rain repellent is activated on the left windshield.

- A32NX_RCDR_TEST
  - Bool
  - True if RCDR being tested.

- A32NX_RADAR_MULTISCAN_AUTO
  - Bool
  - True if multiscan switch is set to AUTO.

- A32NX_RADAR_GCS_AUTO
  - Bool
  - True if GCS switch is set to AUTO.

- A32NX_OXYGEN_MASKS_DEPLOYED
    - Bool
    - True if cabin oxygen masks have been deployed.

- A32NX_RCDR_GROUND_CONTROL_ON
    - Bool
    - True if ground control is on.

- A32NX_EMERELECPWR_GEN_TEST
    - Bool
    - True if emergency generator is being tested.

- A32NX_OXYGEN_PASSENGER_LIGHT_ON
    - Bool
    - True if cabin oxygen mask doors open.

- A32NX_OXYGEN_TMR_RESET
    - Bool
    - True if oxygen timer is being reset.

- A32NX_OXYGEN_TMR_RESET_FAULT
    - Bool
    - True if fault with oxygen timer.

- A32NX_APU_AUTOEXITING_RESET
    - Bool
    - True if APU autoexiting is being reset.

- A32NX_ELT_TEST_RESET
    - Bool
    - True if ELT is being tested/reset.

- A32NX_ELT_ON
    - Bool
    - True if ELT is on.

- A32NX_DLS_ON
    - Bool
    - True if data loading selector is on.

- A32NX_CREW_HEAD_SET
    - Bool
    - True if CVR crew head set is being pressed.

- A32NX_SVGEINT_OVRD_ON
    - Bool
    - True if SVGE INT OVRD is on.

- A32NX_AVIONICS_COMPLT_ON
    - Bool
    - True if avionics comp lt is on.

- A32NX_CARGOSMOKE_FWD_DISCHARGED
    - Bool
    - True if cargosmoke one bottle is discharged

- A32NX_CARGOSMOKE_AFT_DISCHARGED
    - Bool
    - True if cargosmoke two bottle is discharged

- A32NX_AIDS_PRINT_ON
    - Bool
    - True if AIDS print is on.

- A32NX_DFDR_EVENT_ON
    - Bool
    - True if DFDR event is on.

- A32NX_APU_AUTOEXITING_TEST_ON
    - Bool
    - True if APU AUTOEXITING is being tested.

- A32NX_APU_AUTOEXITING_TEST_OK
    - Bool
    - True if APU AUTOEXITING TEST returns OK.

- A32NX_OVHD_{name}_PB_IS_AVAILABLE
    - Bool
    - True when the push button's AVAIL light should illuminate
    - {name}
        - APU_START

- A32NX_OVHD_{name}_PB_HAS_FAULT
    - Bool
    - Indicates if the push button's FAULT light should illuminate
    - {name}
        - APU_MASTER_SW
        - ELEC_BAT_1
        - ELEC_BAT_2
        - ELEC_IDG_1
        - ELEC_IDG_2
        - ELEC_ENG_GEN_1
        - ELEC_ENG_GEN_2
        - ELEC_AC_ESS_FEED
        - ELEC_GALY_AND_CAB
        - PNEU_APU_BLEED
        - EMER_ELEC_GEN_1_LINE: a FAULT indicates SMOKE should illuminate.

- A32NX_OVHD_EMER_ELEC_RAT_AND_EMER_GEN_HAS_FAULT
    - Bool
    - Indicates if the RAT & EMER GEN FAULT light should illuminate

- A32NX_OVHD_EMER_ELEC_RAT_AND_EMER_GEN_IS_PRESSED
    - Bool
    - True if Ram Air Turbine has been manually deployed.

- A32NX_OVHD_{name}_PB_IS_AUTO
    - Bool
    - True when the push button is AUTO
    - {name}
        - ELEC_BAT_1
        - ELEC_BAT_2
        - ELEC_BUS_TIE_PB
        - ELEC_GALY_AND_CAB

- A32NX_OVHD_{name}_PB_IS_RELEASED
    - Bool
    - True when the push button is RELEASED
    - {name}
        - ELEC_IDG_1
        - ELEC_IDG_2

- A32NX_OVHD_ELEC_AC_ESS_FEED_PB_IS_NORMAL
    - Bool
    - True when the AC ESS FEED push button is NORMAL

- A32NX_OVHD_{name}_PB_IS_ON
    - Bool
    - True when the push button is ON
    - {name}
        - APU_START
        - APU_MASTER_SW
        - ELEC_COMMERCIAL
        - PNEU_APU_BLEED
        - EMER_ELEC_GEN_1_LINE

- A32NX_ELEC_CONTACTOR_{name}_IS_CLOSED
    - Bool
    - True when the contactor is CLOSED
    - {name}
        - 1PC1: DC BAT BUS feed contactor between DC BUS 1 and DC BAT BUS
        - 1PC2: DC BAT BUS feed contactor between DC BUS 2 and DC BAT BUS
        - 2XB1: Contactor between battery 1 and the static inverter
        - 2XB2: Contactor between battery 2 and the DC ESS BUS
        - 3XC1: AC ESS feed contactor between AC BUS 1 and AC ESS BUS
        - 3XC2: AC ESS feed contactor between AC BUS 2 and AC ESS BUS
        - 3PE: Transformer rectifier ESS contactor between TR ESS and DC ESS BUS
        - 2XE: Emergency generator contactor
        - 3XG: External power contactor
        - 3XS: APU generator contactor
        - 4PC: Contactor between DC BAT BUS and DC ESS BUS
        - 5PU1: Transformer rectifier 1 contactor between TR1 and DC BUS 1
        - 5PU2: Transformer rectifier 2 contactor between TR2 and DC BUS 2
        - 6PB1: Battery 1 contactor
        - 6PB2: Battery 2 contactor
        - 8PH: DC ESS SHED contactor
        - 8XH: AC ESS SHED contactor
        - 9XU1: Engine generator line contactor 1
        - 9XU2: Engine generator line contactor 2
        - 11XU1: AC BUS tie 1 contactor
        - 11XU2: AC BUS tie 2 contactor
        - 15XE1: Contactor between AC ESS BUS and TR ESS + EMER GEN
        - 15XE2: Contactor between the static inverter and AC ESS BUS
        - 10KA_AND_5KA: The two contactors leading to the APU start motor
        - 14PU: Contactor from AC BUS 2 to TR2 and AC GND/FLT SVC BUS.
        - 12XN: Contactor from EXT PWR to TR2 and AC GND/FLT SVC BUS.
        - 3PX: Contactor from TR2 to DC GND/FLT SVC BUS.
        - 8PN: Contactor from DC BUS 2 to DC GND/FLT SVC BUS.

- A32NX_ELEC_CONTACTOR_{name}_SHOW_ARROW_WHEN_CLOSED
    - Bool
    - True when the arrow from the battery to the battery bus or vice versa needs to be displayed
      when the contactor is closed.
    - {name}
        - 6PB1: Battery 1 contactor
        - 6PB2: Battery 2 contactor

- A32NX_ELEC_{name}_BUS_IS_POWERED
    - Bool
    - True when the given bus is powered
    - {name}
        - AC_1
        - AC_2
        - AC_ESS
        - AC_ESS_SHED
        - AC_STAT_INV
        - AC_GND_FLT_SVC
        - DC_1
        - DC_2
        - DC_ESS
        - DC_ESS_SHED
        - DC_BAT
        - DC_HOT_1
        - DC_HOT_2
        - DC_GND_FLT_SVC


- A32NX_ELEC_{name}_POTENTIAL
    - Volts
    - The electric potential of the given element
    - {name}
        - APU_GEN_1
        - ENG_GEN_1
        - ENG_GEN_2
        - EXT_PWR
        - STAT_INV
        - EMER_GEN
        - TR_1
        - TR_2
        - TR_3: TR ESS
        - BAT_1
        - BAT_2

- A32NX_ELEC_{name}_POTENTIAL_NORMAL
    - Bool
    - Indicates if the potential is within the normal range
    - {name}
        - APU_GEN_1
        - ENG_GEN_1
        - ENG_GEN_2
        - EXT_PWR
        - STAT_INV
        - EMER_GEN
        - TR_1
        - TR_2
        - TR_3: TR ESS
        - BAT_1
        - BAT_2

- A32NX_ELEC_{name}_FREQUENCY:
    - Hertz
    - The frequency of the alternating current of the given element
    - {name}
        - APU_GEN_1
        - ENG_GEN_1
        - ENG_GEN_2
        - EXT_PWR
        - STAT_INV
        - EMER_GEN

- A32NX_ELEC_{name}_FREQUENCY_NORMAL
    - Hertz
    - Indicates if the frequency is within the normal range
    - {name}
        - APU_GEN_1
        - ENG_GEN_1
        - ENG_GEN_2
        - EXT_PWR
        - STAT_INV
        - EMER_GEN

- A32NX_ELEC_{name}_LOAD
    - Percent
    - The load the generator is providing compared to its maximum
    - {name}
        - APU_GEN_1
        - ENG_GEN_1
        - ENG_GEN_2

- A32NX_ELEC_{name}_LOAD_NORMAL
    - Percent
    - Indicates if the load is within the normal range
    - {name}
        - APU_GEN_1
        - ENG_GEN_1
        - ENG_GEN_2

- A32NX_ELEC_{name}_CURRENT
    - Ampere
    - The electric current flowing through the given element
    - {name}
        - TR_1
        - TR_2
        - TR_3: TR ESS
        - BAT_1: Battery 1 (negative when discharging, positive when charging)
        - BAT_2: Battery 2 (negative when discharging, positive when charging)

- A32NX_ELEC_{name}_CURRENT_NORMAL
    - Ampere
    - Indicates if the current is within the normal range
    - {name}
        - TR_1
        - TR_2
        - TR_3: TR ESS
        - BAT_1: Battery 1
        - BAT_2: Battery 2

- A32NX_ELEC_ENG_GEN_{number}_IDG_OIL_OUTLET_TEMPERATURE
    - Celsius
    - The integrated drive generator's oil outlet temperature
    - {number}
        - 1
        - 2

- A32NX_ELEC_ENG_GEN_{number}_IDG_IS_CONNECTED
    - Bool
    - Indicates if the given integrated drive generator is connected
    - {number}
        - 1
        - 2

- A32NX_HYD_{loop_name}_SYSTEM_1_SECTION_PRESSURE
    - Psi
    - Current pressure in the system section of the {loop_name} hydraulic circuit
    - {loop_name}
        - GREEN
        - BLUE
        - YELLOW

- A32NX_HYD_{loop_name}_PUMP_1_SECTION_PRESSURE
    - Psi
    - Current pressure in the pump section of the {loop_name} hydraulic circuit
    - {loop_name}
        - GREEN
        - BLUE
        - YELLOW

- A32NX_HYD_{loop_name}_RESERVOIR_LEVEL
    - Gallon
    - Current gaugeable fluid level in the {loop_name} hydraulic circuit reservoir
    - {loop_name}
        - GREEN
        - BLUE
        - YELLOW

- A32NX_HYD_{loop_name}_RESERVOIR_LEVEL_IS_LOW
    - Boolean
    - Low level switch of {loop_name} hydraulic circuit reservoir indicates low state
    - {loop_name}
        - GREEN
        - BLUE
        - YELLOW

- A32NX_HYD_{loop_name}_EDPUMP_ACTIVE
    - Bool
    - Engine driven pump of {loop_name} hydraulic circuit is active
    - {loop_name}
        - GREEN
        - YELLOW

- A32NX_HYD_{loop_name}_EDPUMP_LOW_PRESS
    - Bool
    - Engine driven pump of {loop_name} hydraulic circuit is active but pressure is too low
    - {loop_name}
        - GREEN
        - YELLOW

- A32NX_HYD_{loop_name}_EPUMP_ACTIVE
    - Bool
    - Electric pump of {loop_name} hydraulic circuit is active
    - {loop_name}
        - BLUE
        - YELLOW

- A32NX_HYD_{loop_name}_EPUMP_RPM
    - Rpm
    - Current {loop_name} electric pump speed
    - {loop_name}
        - BLUE
        - YELLOW

- A32NX_HYD_{loop_name}_EPUMP_CAVITATION
    - Percent over 100
    - Current {loop_name} electric pump cavitation efficiency. 0 running dry to 1 full efficiency
    - {loop_name}
        - BLUE
        - YELLOW

- A32NX_HYD_PTU_ON_ECAM_MEMO
    - Bool
    - HYD PTU memo indication should show on ecam if true

- A32NX_HYD_NW_STRG_DISC_ECAM_MEMO
    - Bool
    - NW STRG DISC memo indication should show on ecam if true

- A32NX_NOSE_WHEEL_POSITION
    - Percent over 100
    - Position of nose steering wheel animation [0;1] 0 left, 0.5 middle

- A32NX_TILLER_HANDLE_POSITION
    - Percent over 100
    - Position of tiller steering handle animation [-1;1] -1 left, 0 middle, 1 right

- A32NX_AUTOPILOT_NOSEWHEEL_DEMAND
    - Percent over 100
    - Steering demand from autopilot to BSCU [-1;1] -1 left, 0 middle

- A32NX_REALISTIC_TILLER_ENABLED
    - Bool
    - 0 for legacy mode (steering with rudder). 1 for realistic mode with tiller axis
        Tiller axis to be binded on "ENGINE 4 MIXTURE AXIS"

- A32NX_HYD_{loop_name}_EPUMP_LOW_PRESS
    - Bool
    - Electric pump of {loop_name} hydraulic circuit is active but pressure is too low
    - {loop_name}
        - BLUE
        - YELLOW

- A32NX_HYD_{loop_name}_PUMP_1_FIRE_VALVE_OPENED
    - Bool
    - Engine driven pump of {loop_name} hydraulic circuit can receive hydraulic fluid
    - {loop_name}
        - GREEN
        - YELLOW

- A32NX_HYD_PTU_VALVE_OPENED
    - Bool
    - Power Transfer Unit can receive fluid from yellow and green circuits

- A32NX_HYD_PTU_ACTIVE_{motor_side}
    - Bool
    - Power Transfer Unit is trying to transfer hydraulic power from either yellow to green (R2L) or green to yellow (L2R) circuits
    - {motor_side}
        - L2R
        - R2L

- A32NX_HYD_PTU_MOTOR_FLOW
    - Gallon per second
    - Power Transfer Unit instantaneous flow in motor side

- A32NX_HYD_PTU_SHAFT_RPM
    - Revolutions per minute
    - Power Transfer Unit shaft rpm

- A32NX_OVHD_HYD_RAT_MAN_ON_IS_PRESSED
    - Bool
    - Deploys the RAT manually

- A32NX_HYD_RAT_STOW_POSITION
    - Percent over 100
    - RAT position, from fully stowed (0) to fully deployed (1)

- A32NX_HYD_RAT_RPM
    - Rpm
    - RAT propeller current RPM

- A32NX_HYD_BRAKE_NORM_{brake_side}_PRESS
    - Psi
    - Current pressure in brake slave circuit on green brake circuit
    - {brake_side}
        - LEFT
        - RIGHT

- A32NX_HYD_BRAKE_ALTN_{brake_side}_PRESS
    - Psi
    - Current pressure in brake slave circuit on yellow alternate brake circuit
    - {brake_side}
        - LEFT
        - RIGHT

- A32NX_HYD_BRAKE_ALTN_ACC_PRESS
    - Psi
    - Current pressure in brake accumulator on yellow alternate brake circuit

- A32NX_FWD_DOOR_CARGO_POSITION
    - Percent
    - Real position of the forward cargo door

- A32NX_FWD_DOOR_CARGO_LOCKED
    - Bool
    - Forward cargo door is locked in closed position

- A32NX_PARK_BRAKE_LEVER_POS
    - Bool
    - Current position of the parking brake lever

- A32NX_{brake_side}_BRAKE_PEDAL_INPUT
    - Percent
    - Current position of the toe brake pedal animation
    - {brake_side}
        - LEFT
        - RIGHT

- A32NX_AUTOBRAKES_ARMED_MODE
    - Number
    - Current autobrake mode
        - 0: Autobrake not armed
        - 1: Autobrake in LOW
        - 2: Autobrake in MED
        - 3: Autobrake in MAX

- A32NX_AUTOBRAKES_DECEL_LIGHT
    - Bool
    - Autobrakes are braking and reached the deceleration target

- A32NX_OVHD_AUTOBRK_LOW_ON_IS_PRESSED
    - Bool
    - Auto brake panel push button for LOW mode is pressed

- A32NX_OVHD_AUTOBRK_MED_ON_IS_PRESSED
    - Bool
    - Auto brake panel push button for MEDIUM mode is pressed

- A32NX_OVHD_AUTOBRK_MAX_ON_IS_PRESSED
    - Bool
    - Auto brake panel push button for MAX mode is pressed

- A32NX_FM_LS_COURSE
    - Number<Degrees | -1>
    - Landing system course. Values, in priority order:
        - Pilot entered course
        - Database course
        - Course received from LOC when LOC available
        - -1 when invalid

- A32NX_FMGC_FLIGHT_PHASE
    - Enum
    - Holds the FMGCs current flight phase
    - Use FMGC_FLIGHT_PHASES to check for phases (import NXFMGCFlightPhases from A32NX_Utils)
      Value | Meaning
      --- | ---
      PREFLIGHT | 0
      TAKEOFF   | 1
      CLIMB     | 2
      CRUISE    | 3
      DESCENT   | 4
      APPROACH  | 5
      GOAROUND  | 6
      DONE      | 7

- A32NX_FLAPS_HANDLE_INDEX
    - Number
    - Indicates the physical flaps handle position
      Value | Meaning
      --- | ---
      0 | 0
      1 | 1 / 1+F
      2 | 2
      3 | 3
      4 | 4

- A32NX_FLAPS_HANDLE_PERCENT
    - Number
    - Indicates the position of the flaps handler in percent
      Value | Position
      --- | ---
      0 | Retracted
      1 | Full extension

- A32NX_LEFT_FLAPS_POSITION_PERCENT
    - Percent
    - Indicates the angle of the left flaps out of 40 degrees

- A32NX_RIGHT_FLAPS_POSITION_PERCENT
    - Percent
    - Indicates the angle of the right flaps out of 40 degrees

- A32NX_LEFT_SLATS_POSITION_PERCENT
    - Percent
    - Indicates the angle of the left slats out of 27 degrees

- A32NX_RIGHT_SLATS_POSITION_PERCENT
    - Percent
    - Indicates the angle of the right slats out of 27 degrees

- A32NX_LEFT_FLAPS_TARGET_ANGLE
    - Degrees
    - Indicates the target angle of the left flaps
      according to the configuration.

- A32NX_RIGHT_FLAPS_TARGET_ANGLE
    - Degrees
    - Indicates the target angle of the right flaps
      according to the configuration.

- A32NX_LEFT_SLATS_TARGET_ANGLE
    - Degrees
    - Indicates the target angle of the left slats
      according to the configuration.

- A32NX_RIGHT_SLATS_TARGET_ANGLE
    - Degrees
    - Indicates the target angle of the right slats
      according to the configuration.

- A32NX_LEFT_FLAPS_ANGLE
    - Degrees
    - The actual angle of the left flaps

- A32NX_RIGHT_FLAPS_ANGLE
    - Degrees
    - The actual angle of the right flaps

- A32NX_LEFT_SLATS_ANGLE
    - Degrees
    - The actual angle of the left slats

- A32NX_RIGHT_SLATS_ANGLE
    - Degrees
    - The actual angle of the right slats

- A32NX_FLAPS_CONF_INDEX
    - Number
    - Indicates the desired flap configuration index according to the table
    - Value | Meaning
      --- | ---
      0 | Conf0
      1 | Conf1
      2 | Conf1F
      3 | Conf2
      4 | Conf3
      5 | ConfFull

- A32NX_SPOILERS_ARMED
    - Bool
    - Indicates if the ground spoilers are armed
      Value | Meaning
      --- | ---
      0 | disarmed
      1 | armed

- A32NX_SPOILERS_HANDLE_POSITION
    - Number
    - Indicates the physical handler position without arm/disarm
      Value | Position
      --- | ---
      0 | Retracted
      1 | Full extension

- A32NX_SPOILERS_GROUND_SPOILERS_ACTIVE
    - Bool
    - Indicates if the ground spoilers are active (fully deployed)
      Value | Position
      --- | ---
      0 | Inactive
      1 | Active

- A32NX_PERFORMANCE_WARNING_ACTIVE
    - Bool
    - Indicates if performance warning is active
      Value | Meaning
      --- | ---
      0 | inactive
      1 | active

## EIS Display System

- A32NX_EFIS_{side}_NAVAID_{1|2}_MODE
    - Enum
    - Provides the selected NAVAIDs for display on the EFIS
      Value | Meaning
      --- | ---
      0 | Off
      1 | ADF
      2 | VOR
    - {side}
        - L
        - R

- A32NX_EFIS_{side}_ND_MODE
    - Enum
    - Provides the selected navigation display mode for the EFIS
      Value | Meaning
      --- | ---
      0 | ROSE ILS
      1 | ROSE VOR
      2 | ROSE NAV
      3 | ARC
      4 | PLAN
    - {side}
        - L
        - R

- A32NX_EFIS_{side}_ND_RANGE
    - Enum
    - Provides the selected navigation display range for the EFIS
      Value | Meaning
      --- | ---
      0 | 10
      1 | 20
      2 | 40
      3 | 80
      4 | 160
      5 | 320
    - {side}
        - L
        - R

- A32NX_EFIS_{side}_OPTION
    - Enum
    - Provides the selected EFIS option/overlay
      Value | Meaning
      --- | ---
      0 | None
      1 | Constraints
      2 | VOR/DMEs
      3 | Waypoints
      4 | NDBs
      5 | Airports
    - {side}
        - L
        - R

- A32NX_EFIS_{side}_ND_FM_MESSAGE_FLAGS
    - Flag
    - Provides a bitfield of the active FM messages to the NDs
      Bit | Meaning
      --- | ---
      0  | SelectTrueRef
      1  | CheckNorthRef
      2  | NavAccuracyDowngrade
      3  | NavAccuracyUpgradeNoGps
      4  | SpecifiedVorDmeUnavailble
      5  | NavAccuracyUpgradeGps
      6  | GpsPrimary
      7  | MapPartlyDisplayed
      8  | SetOffsideRangeMode
      9  | OffsideFmControl
      10 | OffsideFmWxrControl
      11 | OffsideWxrControl
      12 | GpsPrimaryLost
      13 | RtaMissed
      14 | BackupNav
    - {side}
        - L
        - R

- A32NX_ISIS_LS_ACTIVE
	- Bool
	- Indicates whether LS scales are shown on the ISIS
	- Toggled by `H:A32NX_ISIS_LS_PRESSED`

- A32NX_ISIS_BUGS_ACTIVE
	- Bool
	- Indicates whether bugs page is shown on the ISIS
	- Toggled by `H:A32NX_ISIS_BUGS_PRESSED`

- A32NX_ISIS_BUGS_ALT_VALUE:{number}
	- Number (feet)
	- Altitude of altitude bug set on ISIS bugs page
    - {number}
        - 0
        - 1

- A32NX_ISIS_BUGS_ALT_ACTIVE:{number}
	- Bool
	- Indicates whether altitude bug is shown on the altitude tape of the ISIS
    - {number}
        - 0
        - 1

- A32NX_ISIS_BUGS_SPD_VALUE:{number}
	- Number (knots)
	- Speed of speed bug set on ISIS bugs page
    - {number}
        - 0
        - 1
        - 2
        - 3

- A32NX_ISIS_BUGS_SPD_ACTIVE:{number}
	- Bool
	- Indicates whether speed bug is shown on the speed tape of the ISIS
    - {number}
        - 0
        - 1
        - 2
        - 3

- A32NX_PAX_TOTAL_ROWS_{rows}
    - Number
    - Indicates the current number of pax in the selected rows
    - {rows}
        - 1_6
        - 7_13
        - 14_21
        - 22_29

- A32NX_PAX_TOTAL_ROWS_{rows}_DESIRED
    - Number
    - Indicates the target number of pax in the selected rows
    - {rows}
        - 1_6
        - 7_13
        - 14_21
        - 22_29

- PAYLOAD STATION WEIGHT:{stationIndex}
    - Number (Kilograms)
    - Indicates the weight of the selected payload station
    - {stationIndex}
        - 5 | FWD BAGGAGE/CONTAINER
        - 6 | AFT CONTAINER
        - 7 | AFT BAGGAGE
        - 8 | AFT BULK/LOOSE

- A32NX_MCDU_{side}_ANNUNC_{annunciator}
    - Boolean
    - Indicates whether the annunciator light on the MCDU is lit
    - {side}
        - L
        - R
    - {annunciator}
        - FAIL
        - FMGC
        - MCDU_MENU
        - FM1
        - IND
        - RDY
        - FM2

## Fly-By-Wire System

- A32NX_LOGGING_FLIGHT_CONTROLS_ENABLED
    - Bool
    - Indicates if logging of flight control events is enabled

- A32NX_SIDESTICK_POSITION_X
    - Number
    - Provides the direct sidestick position (lateral)
      Value | Meaning
      --- | ---
      -1 | full left
      0 | neutral
      1 | full right

- A32NX_SIDESTICK_POSITION_Y
    - Number
    - Provides the direct sidestick position (longitudinal)
      Value | Meaning
      --- | ---
      -1 | full forward
      0 | neutral
      1 | full backward

- A32NX_RUDDER_PEDAL_POSITION
    - Number
    - Provides the rudder pedal position
      Value | Meaning
      --- | ---
      -100 | full left
      0 | neutral
      100 | full right

- A32NX_RUDDER_PEDAL_ANIMATION_POSITION
    - Number
    - Provides the rudder pedal position including rudder trim for animation
      Value | Meaning
      --- | ---
      -100 | full left
      0 | neutral
      100 | full right

- A32NX_ALPHA_MAX_PERCENTAGE
    - Number (0.0 -> 1.0)
    - Percentage of current (filtered) alpha to alpha max
    - alpha max can be overshoot so values beyond 1.0 should be expected

- A32NX_BETA_TARGET
    - Degrees
    - Target beta (sideslip) in case of asymmetric thrust

- A32NX_3D_AILERON_LEFT_DEFLECTION
    - Number
    - Provides the left aileron position
      Value | Meaning
      --- | ---
      -1.0 | full up
       0.0 | neutral
      1.0 | full down

- A32NX_3D_AILERON_RIGHT_DEFLECTION
    - Number
    - Provides the right aileron position
      Value | Meaning
      --- | ---
      -1.0 | full down
       0.0 | neutral
      1.0 | full up

## ADIRS

In the variables below, {number} should be replaced with one item in the set: { 1, 2, 3 }, unless declared otherwise.

- A32NX_CONFIG_ADIRS_IR_ALIGN_TIME
    - Enum
    - Input for: systems.wasm
    - The configured Inertial Reference system align time.
      Description | Value
      --- | ---
      Real (affected by latitude) | 0
      Instant (0 s) | 1
      Fast (90 s) | 2

- A32NX_OVHD_ADIRS_IR_{number}_MODE_SELECTOR_KNOB
    - Enum
    - The Inertial Reference mode selected through the selector knobs.
      Description | Value
      --- | ---
      Off | 0
      Navigation | 1
      Attitude | 2

- A32NX_OVHD_ADIRS_ON_BAT_IS_ILLUMINATED
    - Bool
    - Whether the ON BAT indication should illuminate.

- A32NX_OVHD_ADIRS_IR_{number}_PB_HAS_FAULT
    - Bool
    - Whether the FAULT light illuminates for IR {number}.

- A32NX_OVHD_ADIRS_IR_{number}_PB_IS_ON
    - Bool
    - Whether the IR push button is in the ON position.

- A32NX_OVHD_ADIRS_ADR_{number}_PB_HAS_FAULT
    - Bool
    - Whether the FAULT light illuminates for ADR {number}.

- A32NX_OVHD_ADIRS_ADR_{number}_PB_IS_ON
    - Bool
    - Whether the ADR push button is in the ON position.

- A32NX_ATT_HDG_SWITCHING_KNOB
    - ATT HDG
    - Position (0-2)
    - 0 is CAPT, 1 is NORM, 2 is F/O

- A32NX_AIR_DATA_SWITCHING_KNOB
    - AIR DATA
    - Position (0-2)
    - 0 is CAPT, 1 is NORM, 2 is F/O

- A32NX_ADIRS_ADIRU_{number}_STATE
    - Enum
    - The Inertial Reference alignment state.
      Description | Value
      --- | ---
      Off | 0
      Aligning | 1
      Aligned | 2

- A32NX_ADIRS_REMAINING_IR_ALIGNMENT_TIME
    - Seconds
    - The remaining alignment duration. Zero seconds when the system is aligned or the system is not aligning.

- A32NX_ADIRS_ADR_{number}_ALTITUDE
    - Arinc429Word<Feet>
    - The altitude.

- A32NX_ADIRS_ADR_{number}_COMPUTED_AIRSPEED
    - Arinc429Word<Knots>
    - The computed airspeed (CAS).

- A32NX_ADIRS_ADR_{number}_MACH
    - Arinc429Word<Mach>
    - The Mach number (M).

- A32NX_ADIRS_ADR_{number}_BAROMETRIC_VERTICAL_SPEED
    - Arinc429Word<Feet per minute>
    - The vertical speed (V/S) based on barometric altitude data.

- A32NX_ADIRS_ADR_{number}_TRUE_AIRSPEED
    - Arinc429Word<Knots>
    - The true airspeed (TAS).

- A32NX_ADIRS_ADR_{number}_STATIC_AIR_TEMPERATURE
    - Arinc429Word<Celsius>
    - The static air temperature (SAT).
      {number}: 1 or 3

- A32NX_ADIRS_ADR_{number}_TOTAL_AIR_TEMPERATURE
    - Arinc429Word<Celsius>
    - The total air temperature (TAT).
      {number}: 1 or 3

- A32NX_ADIRS_ADR_{number}_INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA
    - Arinc429Word<Celsius>
    - The delta (deviation) from international standard atmosphere temperature.
      {number}: 1 or 3

- A32NX_ADIRS_IR_{number}_PITCH
    - Arinc429Word<Degrees>
    - The pitch angle of the aircraft.

- A32NX_ADIRS_IR_{number}_ROLL
    - Arinc429Word<Degrees>
    - The roll angle of the aircraft.

- A32NX_ADIRS_IR_{number}_HEADING
    - Arinc429Word<Degrees>
    - The inertial heading of the aircraft.

- A32NX_ADIRS_IR_{number}_TRACK
    - Arinc429Word<Degrees>
    - The inertial track of the aircraft.

- A32NX_ADIRS_IR_{number}_VERTICAL_SPEED
    - Arinc429Word<Feet per minute>
    - The vertical speed (V/S) based on inertial reference data.

- A32NX_ADIRS_IR_{number}_GROUND_SPEED
    - Arinc429Word<Knots>
    - The ground speed (GS) of the aircraft.

- A32NX_ADIRS_IR_{number}_WIND_DIRECTION
    - Arinc429Word<Degrees>
    - The direction of the wind.

- A32NX_ADIRS_IR_{number}_WIND_VELOCITY
    - Arinc429Word<Degrees>
    - The velocity of the wind.

- A32NX_ADIRS_IR_{number}_LATITUDE
    - Arinc429Word<Degrees>
    - The latitude of the aircraft.

- A32NX_ADIRS_IR_{number}_LONGITUDE
    - Arinc429Word<Degrees>
    - The longitude of the aircraft.

- A32NX_ADIRS_USES_GPS_AS_PRIMARY
    - Bool
    - Whether or not the GPS is used as the primary means of navigation/position determination.

## Flight Management System

- A32NX_FM_ENABLE_APPROACH_PHASE
  - Bool
  - Indicates whether the FMS should switch to APPROACH phase.
  - **WARNING:** This is temporary and internal. Do not use.

## Autopilot System

- A32NX_FMA_LATERAL_MODE
    - Enum
    - Indicates **engaged** lateral mode of the Flight Director / Autopilot
      Mode | Value
      --- | ---
      NONE | 0
      HDG | 10
      TRACK | 11
      NAV | 20
      LOC_CPT | 30
      LOC_TRACK | 31
      LAND | 32
      FLARE | 33
      ROLL_OUT | 34
      RWY | 40
      RWY_TRACK | 41
      GA_TRACK | 50

- A32NX_FMA_LATERAL_ARMED
    - Bitmask
    - Indicates **armed** lateral mode of the Flight Director / Autopilot
      Mode | Bit
      --- | ---
      NAV | 0
      LOC | 1

- A32NX_FMA_VERTICAL_MODE
    - Enum
    - Indicates **engaged** vertical mode of the Flight Director / Autopilot
      Mode | Value
      --- | ---
      NONE | 0
      ALT | 10
      ALT_CPT | 11
      OP_CLB | 12
      OP_DES | 13
      VS | 14
      FPA | 15
      ALT_CST | 20
      ALT_CST_CPT | 21
      CLB | 22
      DES | 23
      FINAL | 24
      GS_CPT | 30
      GS_TRACK | 31
      LAND | 32
      FLARE | 33
      ROLL_OUT | 34
      SRS | 40
      SRS_GA | 41

- A32NX_FMA_VERTICAL_ARMED
    - Bitmask
    - Indicates **armed** vertical mode of the Flight Director / Autopilot
      Mode | Bit
      --- | ---
      ALT | 0
      ALT_CST | 1
      CLB | 2
      DES | 3
      GS | 4
      FINAL | 5

- A32NX_FMA_EXPEDITE_MODE
    - Boolean
    - Indicates if expedite mode is engaged
      State | Value
      --- | ---
      OFF | 0
      ON | 1

- A32NX_FMA_SPEED_PROTECTION_MODE
    - Boolean
    - Indicates if V/S speed protection mode is engaged
      State | Value
      --- | ---
      OFF | 0
      ON | 1

- A32NX_FMA_CRUISE_ALT_MODE
    - Boolean
    - Indicates if CRUISE ALT mode is engaged (ALT on cruise altitude = ALT CRZ)
      State | Value
      --- | ---
      OFF | 0
      ON | 1

- A32NX_FMA_SOFT_ALT_MODE
    - Boolean
    - Indicates if SOFT ALT mode is engaged (allows deviation of +/- 50 ft to reduce thrust variations in cruise)
      State | Value
      --- | ---
      OFF | 0
      ON | 1

- A32NX_ApproachCapability
    - Enum
    - Indicates the current approach/landing capability
      Mode | Value
      --- | ---
      NONE | 0
      CAT1 | 1
      CAT2 | 2
      CAT3 SINGLE | 3
      CAT3 DUAL | 4

- A32NX_FLIGHT_DIRECTOR_BANK
    - Number (Degrees)
    - Indicates bank angle to be displayed by Flight Director
      Sign | Direction
      --- | ---
      \+ | left
      \- | right

- A32NX_FLIGHT_DIRECTOR_PITCH
    - Number (Degrees)
    - Indicates pitch angle to be displayed by Flight Director
      Sign | Direction
      --- | ---
      \+ | down
      \- | up

- A32NX_FLIGHT_DIRECTOR_YAW
    - Number (Degrees)
    - Indicates yaw to be displayed by Flight Director
      Sign | Direction
      --- | ---
      \+ | left
      \- | right

- A32NX_AUTOPILOT_AUTOLAND_WARNING
    - Boolean
    - Indicates if Autoland warning light is illuminated
    - Possible values:
      State | Value
      --- | ---
      OFF | 0
      ON | 1

- A32NX_AUTOPILOT_ACTIVE
    - Boolean
    - Indicates if any Autopilot is engaged
    - Possible values:
      State | Value
      --- | ---
      DISENGAGED | 0
      ENGAGED | 1

- A32NX_AUTOPILOT_{index}_ACTIVE
    - Boolean
    - Indicates if Autopilot {index} is enaged, first Autopilot has the index 1
    - Possible values:
      State | Value
      --- | ---
      DISENGAGED | 0
      ENGAGED | 1

- A32NX_AUTOPILOT_AUTOTHRUST_MODE
    - Enum
    - Indicates the requested ATHR mode by the Autopilot
    - Possible values:
      Mode | Value
      --- | ---
      NONE | 0
      SPEED | 1
      THRUST_IDLE | 2
      THRUST_CLB | 3

- A32NX_AUTOPILOT_SPEED_SELECTED
    - SPEED mode: 100 to 399 (knots)
    - MACH mode: 0.10 to 0.99 (M)
    - Indicates the selected speed on the FCU, instantly updated
    - In case of managed speed mode, the value is -1

- A32NX_AUTOPILOT_FPA_SELECTED
    - Number (Degrees)
    - Indicates the selected FPA on the FCU, instantly updated

- A32NX_AUTOPILOT_VS_SELECTED
    - Number (Feet per minute)
    - Indicates the selected V/S on the FCU, instantly updated

- A32NX_AUTOPILOT_HEADING_SELECTED
    - Number (Degrees)
    - Indicates the selected heading on the FCU, instantly updated
    - In case of managed heading mode, the value is -1

- A32NX_FCU_SPD_MANAGED_DASHES
  - Boolean
  - Indicates if managed speed/mach mode is active and a numerical value is not displayed
    State | Value
      --- | ---
      SELECTED | 0
      MANAGED | 1

- A32NX_FCU_SPD_MANAGED_DOT
  - Boolean
  - Indicates if managed speed/mach mode is active
    State | Value
      --- | ---
      SELECTED | 0
      MANAGED | 1

- A32NX_FCU_HDG_MANAGED_DASHES
  - Boolean
  - Indicates if managed heading mode is active and a numerical value is not displayed
    State | Value
      --- | ---
      SELECTED | 0
      MANAGED | 1

- A32NX_FCU_HDG_MANAGED_DOT
  - Boolean
  - Indicates if managed heading mode is active or armed
    State | Value
      --- | ---
      SELECTED | 0
      MANAGED/ARMED | 1

- A32NX_FCU_ALT_MANAGED
  - Boolean
  - Indicates if managed altitude mode is active (dot)
    State | Value
      --- | ---
      SELECTED | 0
      MANAGED | 1

- A32NX_FCU_VS_MANAGED
  - Boolean
  - Indicates if managed VS/FPA mode is active
    State | Value
      --- | ---
      SELECTED | 0
      MANAGED | 1

- A32NX_FCU_LOC_MODE_ACTIVE
    - Boolean
    - Indicates if LOC button on the FCU is illuminated
      State | Value
      --- | ---
      OFF | 0
      ON | 1

- A32NX_FCU_APPR_MODE_ACTIVE
    - Boolean
    - Indicates if APPR button on the FCU is illuminated
    - Possible values:
      State | Value
      --- | ---
      OFF | 0
      ON | 1

- A32NX_FCU_HEADING_SYNC
    - Boolean
    - Triggers the FCU to synchronize to current heading or track
      State | Value
      --- | ---
      Inactive | 0
      Revert | 1

- A32NX_FCU_MODE_REVERSION_ACTIVE
    - Boolean
    - Triggers the FCU to synchronize to current V/S
      State | Value
      --- | ---
      Inactive | 0
      Revert | 1

- A32NX_FCU_MODE_REVERSION_TRK_FPA_ACTIVE
    - Boolean
    - Triggers the FCU to revert to HDG/VS mode
      State | Value
      --- | ---
      Inactive | 0
      Revert | 1

- A320_Neo_FCU_SPEED_SET_DATA
    - Number
    - Used as data transport for event `H:A320_Neo_FCU_SPEED_SET`

- A320_Neo_FCU_HDG_SET_DATA
    - Number
    - Used as data transport for event `H:A320_Neo_FCU_HDG_SET`

- A320_Neo_FCU_VS_SET_DATA
    - Number
    - Used as data transport for event `H:A320_Neo_FCU_VS_SET`

- A32NX_FG_CROSS_TRACK_ERROR
    - Number in nm
    - Used for laternal guidance in mode NAV
    - Error from desired path

- A32NX_FG_TRACK_ANGLE_ERROR
    - Number in degrees
    - Used for laternal guidance in mode NAV
    - Error from desired heading or track

- A32NX_FG_PHI_COMMAND
    - Number in degrees
    - Used for laternal guidance in mode NAV
    - Bank angle command

- A32NX_FG_REQUESTED_VERTICAL_MODE
    - Enum
    - Indicates the requested vertical mode in DES
    - Possible values:
      Mode | Value
      --- | ---
      NONE | 0
      SPEED_THRUST | 1
      VPATH_THRUST | 2
      VPATH_SPEED | 3
      FPA_SPEED | 4
      VS_SPEED | 5

- A32NX_FG_ALTITUDE_CONSTRAINT
    - Number in ft
    - Used for managed climb/descend
    - Indicates an altitude constraint to follow

- A32NX_FG_TARGET_ALTITUDE
    - Number in ft
    - Used for vertical guidance in mode DES
    - Indicates the target altitude

- A32NX_FG_TARGET_VERTICAL_SPEED
    - Number in fpm or degrees depending on requested mode
    - Used for vertical guidance in mode DES
    - Indicates the target vertical speed

- A32NX_FG_RNAV_APP_SELECTED
    - Boolean
    - Used for FINAL mode selection
    - Indicates if an RNAV approach is selected. If it is true, pressing the APPR button
      results in the FINAL mode being armed, instead of G/S and LOC

- A32NX_FG_FINAL_CAN_ENGAGE
    - Boolean
    - Indicates if the FINAL vertical mode can engage
    - FINAL mode will engage if :
      - This Simvar is true
      - NAV mode is engaged
      - FINAL mode is armed

## Autothrust System

- A32NX_3D_THROTTLE_LEVER_POSITION_{index}
    - Number
    - Anmiation position of the throttles in 3D model
      Position | Value
      --- | ---
      FULL REVERSE | 0
      IDLE | 25
      CLB | 50
      FLX/MCT | 75
      TOGA | 100

- A32NX_AUTOTHRUST_STATUS
    - Enum
    - Indicates the current status of the ATHR system
      Mode | Value
      --- | ---
      DISENGAGED | 0
      ENGAGED_ARMED | 1
      ENGAGED_ACTIVE | 2

- A32NX_AUTOTHRUST_MODE
    - Enum
    - Indicates the current thrust mode of the ATHR system
      Mode | Value
      --- | ---
      NONE | 0
      MAN_TOGA | 1
      MAN_GA_SOFT | 2
      MAN_FLEX | 3
      MAN_DTO | 4
      MAN_MCT | 5
      MAN_THR | 6
      SPEED | 7
      MACH | 8
      THR_MCT | 9
      THR_CLB | 10
      THR_LVR | 11
      THR_IDLE | 12
      A_FLOOR | 13
      TOGA_LK | 14

- A32NX_AUTOTHRUST_MODE_MESSAGE
    - Enum
    - Indicates ATHR related message to be displayed on the PFD
      Mode | Value
      --- | ---
      NONE | 0
      THR_LK | 1
      LVR_TOGA | 2
      LVR_CLB | 3
      LVR_MCT | 4
      LVR_ASYM | 5

- A32NX_AUTOTHRUST_DISABLED
    - Bool
    - Indicates if ATHR was disabled by pressing ATHR disconnect buttons longer than 15s

- A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE
    - Enum
    - Indicates the type of current thrust limit
      Mode | Value
      --- | ---
      NONE | 0
      CLB | 1
      MCT | 2
      FLEX | 3
      TOGA | 4
      REVERSE | 5

- A32NX_AUTOTHRUST_THRUST_LIMIT
    - Number (% N1)
    - Indicates the thrust limit N1

- A32NX_AUTOTHRUST_THRUST_LIMIT_REV
    - Number (% N1)
    - Indicates the thrust limit N1 for REV

- A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE
    - Number (% N1)
    - Indicates the thrust limit N1 for IDLE

- A32NX_AUTOTHRUST_THRUST_LIMIT_CLB
    - Number (% N1)
    - Indicates the thrust limit N1 for CLB

- A32NX_AUTOTHRUST_THRUST_LIMIT_MCT
    - Number (% N1)
    - Indicates the thrust limit N1 for MCT

- A32NX_AUTOTHRUST_THRUST_LIMIT_FLX
    - Number (% N1)
    - If FLX is not active the value 0 is provided
    - Indicates the thrust limit N1 for FLX

- A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA
    - Number (% N1)
    - Indicates the thrust limit N1 for TOGA

- A32NX_AUTOTHRUST_TLA_N1:{index}
    - Number (% N1)
    - Indicates the N1 corresponding to the TLA for engine {index}, first engine has index 1

- A32NX_AUTOTHRUST_REVERSE:{index}
    - Boolean
    - Indicates if reverse for engine {index} is requested
      State | Value
      --- | ---
      NO REVERSE | 0
      REVERSE | 1

- A32NX_AUTOTHRUST_N1_COMMANDED:{index}
    - Number (% N1)
    - Indicates the commanded N1 (either based on TLA or autothrust law) for engine {index}, first engine has index 1

- A32NX_AUTOTHRUST_DISCONNECT
    - Bool
    - Indicates if the red disconnect button is pressed on the thrust lever
      State | Value
      --- | ---
      NOT PRESSED | 0
      PRESSED | 1

- A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_FLEX
    - Bool
    - Indicates if the thrust lever warning for FLEX take-off is active
      State | Value
      --- | ---
      NOT ACTIVE | 0
      ACTIVE | 1

- A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA
    - Bool
    - Indicates if the thrust lever warning for TOGA take-off is active
      State | Value
      --- | ---
      NOT ACTIVE | 0
      ACTIVE | 1

## Throttle Mapping System

- A32NX_LOGGING_THROTTLES_ENABLED
    - Bool
    - Indicates if logging of throttle events is enabled

- A32NX_THROTTLE_MAPPING_LOADED_CONFIG:{index}
    - Bool
    - Indicates if we are using a configured throttle mapping for throttle axis {index}, first axis has index 1

- A32NX_THROTTLE_MAPPING_INPUT:{index}
    - Number
    - Indicates the raw input values for throttle axis {index}, first axis has index 1
    - Range is from -1 to 1

- A32NX_AUTOTHRUST_TLA:{index}
    - Number (Degrees)
    - Indicates the TLA of the throttle lever {index}, first throttle lever has index 1
      Position | Value
      --- | ---
      REVERSE | -20
      REV_IDLE | -6
      IDLE | 0
      CLB | 25
      FLX/MCT | 35
      TOGA | 45

- A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:{index}
    - Boolean
    - Indicates if reverse area should be mapped on axis

- A32NX_THROTTLE_MAPPING_{REVERSE|REVERSE_IDLE|IDLE|CLIMB|FLEXMCT|TOGA}_{LOW|HIGH}:{index}
    - Number
    - Indicates the low or high value to latch into the given detent
    - Range is from -1 to 1

## Engine and FADEC System

- A32NX_ENGINE_CYCLE_TIME
    - Number (seconds)
    - Sum of Engine 1 & 2 cycle times to detect when engines are alive (pause/ slew management)

- A32NX_ENGINE_STATE:{index}
    - Number
    - Defines actual engine state
      State | Value
      --- | ---
      OFF | 0
      ON | 1
      STARTING | 2
      SHUTTING | 3

- A32NX_ENGINE_TIMER:{index}
    - Number (seconds)
    - Sets a timer to control engine {index} start-up/shutdown events

- A32NX_ENGINE_IMBALANCE
    - Number (2-bit coded decimal)
    - Defines random engine imbalance of parameters
      Bits (from Left) | Parameter
      --- | ---
      0-1 | Engine affected (01 or 02)
      2-3 | EGT (max 20º imbalance)
      4-5 | FF (max 36 Kg/h imbalance)
      6-7 | N2 (max 0.3% imbalance)
      8-9 | Oil Qty (max 2 Qt imbalance)
      10-11 | Oil Pressure (max 3 psi imbalance)
      12-13 | Idle Oil Pressure (+/- 6 psi imbalance)

- A32NX_ENGINE_N1:{index}
    - Number (% N1)
    - Custom engine {index} N1 to model realistic start-up & shutdown, although equal to Sim's N2 for other flight phases.

- A32NX_ENGINE_N2:{index}
    - Number (% N2)
    - Custom engine N2 {index} to model realistic start-up & shutdown, although equal to Sim's N2 for other flight phases.

- A32NX_ENGINE_EGT:{index}
    - Number (degrees Celsius)
    - Custom engine {index} EGT to model realistic behavior throughout all flight phases

- A32NX_ENGINE_FF:{index}
    - Number (Kg/h)
    - Custom engine {index} fuel flow to model realistic behavior throughout all flight phases

- A32NX_ENGINE_PRE_FF:{index}
    - Number (Kg/h)
    - Previous engine {index} deltaTime fuel flow to calculate spot fuel burn

- A32NX_ENGINE_IDLE_N1
    - Number (% N1)
    - Expected idle N1 as a function of temperature and pressure

- A32NX_ENGINE_IDLE_N2
    - Number (% N2)
    - Expected idle N2 as a function of temperature and pressure

- A32NX_ENGINE_IDLE_EGT
    - Number (degrees Celsius)
    - Expected idle EGT as a function of temperature and pressure

- A32NX_ENGINE_IDLE_FF
    - Number (Kg/h)
    - Expected idle fuel flow as a function of temperature and pressure

- A32NX_FUEL_USED:{index}
    - Number (Kg)
    - Fuel burnt by engine {index} on deltaTime

- A32NX_FUEL_LEFT_PRE
    - Number (lbs)
    - Previous deltaTime fuel for the main left tank

- A32NX_FUEL_RIGHT_PRE
    - Number (lbs)
    - Previous deltaTime fuel for the main right tank

- A32NX_FUEL_AUX_LEFT_PRE
    - Number (lbs)
    - Previous deltaTime fuel for the aux left tank

- A32NX_FUEL_AUX_RIGHT_PRE
    - Number (lbs)
    - Previous deltaTime fuel for the aux right tank

- A32NX_FUEL_CENTER_PRE
    - Number (lbs)
    - Previous deltaTime fuel for the center tank

- A32NX_ENGINE_TOTAL_OIL:{index}
    - Number (quarts)
    - Total engine {index} oil quantity in the oil system (tank + circuit)

- A32NX_ENGINE_TANK_OIL:{index}
    - Number (quarts)
    - Total engine {index} oil quantity in the oil tank

## Air Conditioning / Pressurisation / Ventilation

- A32NX_PRESS_CABIN_ALTITUDE
    - Feet
    - The equivalent altitude from sea level of the interior of the cabin based on the internal pressure

- A32NX_PRESS_CABIN_DELTA_PRESSURE
    - PSI
    - The difference in pressure between the cabin interior and the exterior air.
    Positive when cabin pressure is higher than external pressure.

- A32NX_PRESS_CABIN_VS
    - Feet per minute
    - Rate of pressurization or depressurization of the cabin expressed as altitude change

- A32NX_PRESS_ACTIVE_CPC_SYS
    - Number [0, 1, 2]
    - Indicates which cabin pressure controller is active. 0 indicates neither is active.

- A32NX_PRESS_OUTFLOW_VALVE_OPEN_PERCENTAGE
    - Ratio
    - Percent open of the cabin pressure outflow valve

- A32NX_PRESS_SAFETY_VALVE_OPEN_PERCENTAGE
    - Ratio
    - Percent open of the cabin pressure safety valves

- A32NX_PRESS_AUTO_LANDING_ELEVATION
    - Feet
    - Automatic landing elevation as calculated by the MCDU when a destination runway is entered

- A32NX_PRESS_EXCESS_CAB_ALT
    - Bool
    - True when FWC condition for "EXCESS CAB ALT" is met

- A32NX_PRESS_EXCESS_RESIDUAL_PR
    - Bool
    - True when FWC condition for "EXCES RESIDUAL PR" is met

- A32NX_PRESS_LOW_DIFF_PR
    - Bool
    - True when FWC condition for "LO DIFF PR" is met

- A32NX_OVHD_PRESS_LDG_ELEV_KNOB
    - Feet
    - Manual landing elevation as selected on the overhead LDG ELEV knob

- A32NX_OVHD_PRESS_MAN_VS_CTL_SWITCH
    - Number
    - 0 if switch is in up position, 1 if switch is neutral, 2 if switch is down.

- A32NX_OVHD_PRESS_MODE_SEL_PB_IS_AUTO
    - Bool
    - True if MODE SEL overhead pushbutton is depressed (in auto mode)

- A32NX_OVHD_PRESS_MODE_SEL_PB_HAS_FAULT
    - Bool
    - True only when both Cabin Pressure Controller systems are faulty.

- A32NX_OVHD_PRESS_DITCHING_PB_IS_ON
    - Bool
    - True if DITCHING pushbutton is pressed

- A32NX_PACKS_{number}_IS_SUPPLYING
    - Bool
    - True if the corresponding pack is on and supplying air to the cabin
    - {number}
        - 1
        - 2

## Pneumatic

- A32NX_PNEU_ENG_{number}_IP_PRESSURE:
    - Pressure in intermediate pressure compression chamber
    - PSI
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_HP_PRESSURE:
    - Pressure in high pressure compression chamber
    - PSI
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_TRANSFER_PRESSURE:
    - Pressure between IP/HP valves but before the pressure regulating valve
    - PSI
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_PRECOOLER_INLET_PRESSURE:
    - Pressure at the precooler inlet for engine bleed system
    - PSI
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_PRECOOLER_OUTLET_PRESSURE:
    - Pressure at theh precooler outlet for engine bleed system
    - PSI
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_STARTER_CONTAINER_PRESSURE:
    - Pressure behind the starter valve of the engine
    - PSI
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_IP_TEMPERATURE:
    - Temperature in intermediate pressure compression chamber
    - Degree celsius
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_HP_TEMPERATURE:
    - Temperature in high pressure compression chamber
    - Degree celsius
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_TRANSFER_TEMPERATURE:
    - Temperature between IP/HP valves but before the pressure regulating valve
    - Degree celsius
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_PRECOOLER_INLET_TEMPERATURE:
    - Temperature at the precooler inlet for engine bleed system
    - Degree celsius
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_PRECOOLER_OUTLET_TEMPERATURE:
    - Temperature at the precooler outlet for engine bleed system
    - Degree celsius
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_STARTER_CONTAINER_TEMPERATURE:
    - Temperature behind the starter valve of the engine
    - Degree celsius
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_IP_VALVE_OPEN:
    - Indicates whether the intermediate pressure bleed air valve is open
    - Bool
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_HP_VALVE_OPEN:
    - Indicates whether the high pressure bleed air valve is open
    - Bool
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_PR_VALVE_OPEN:
    - Indicates whether the pressure regulating valve is open
    - Bool
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_STARTER_VALVE_OPEN:
    - Indicates whether the starter valve is open.
    - Bool
    - {number}
        - 1
        - 2

- A32NX_PNEU_XBLEED_VALVE_OPEN:
    - Indicates whether the cross bleed air valve is open
    - Bool

- A32NX_PNEU_PACK_{number}_FLOW_VALVE_FLOW_RATE:
    - Indicates the flow rate through the pack flow valve
    - Gallon per second
    - {number}
        - 1
        - 2

- A32NX_OVHD_PNEU_ENG_{number}_BLEED_PB_IS_AUTO:
    - Indicates whether the engine bleed air is on
    - Is aliased from aircraft variable A:BLEED AIR ENGINE
    - Bool
    - {number}
        - 1
        - 2

- A32NX_OVHD_PNEU_ENG_{number}_BLEED_PB_HAS_FAULT:
    - Indicates whether the fault light is on for the engine bleed push button
    - Bool
