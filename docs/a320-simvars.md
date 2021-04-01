# A320neo Local SimVars

- A32NX_NO_SMOKING_MEMO
    - Boolean that determines whether the NO SMOKING memo should be visible on the upper ECAM
    - Also is used for knowing when to play the no smoking chime sound

- A32NX_ADIRS_PFD_ALIGNED
    - Bool
    - 0 when ADIRS is not aligned
    - 1 when ADIRS is aligned or 3 minutes after it has started aligning

- A32NX_Neo_ADIRS_START_TIME
    - Seconds
    - Holds the start time in seconds that the ADIRS TIMER will count down from
    - Used to have certain things turn on based on a percentage of the total alignment time

- A32NX_ADIRS_1_FAULT
    - Bool
    - Whether the "FAULT" indication is shown on the OVHD ADIRS panel for ADIRS 1

- A32NX_ADIRS_2_FAULT
    - Bool
    - Whether the "FAULT" indication is shown on the OVHD ADIRS panel for ADIRS 2

- A32NX_ADIRS_3_FAULT
    - Bool
    - Whether the "FAULT" indication is shown on the OVHD ADIRS panel for ADIRS 3

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

- A32NX_HYD_ENG1PUMP_FAULT
    - Bool
    - True if engine 1 hyd pump fault

- A32NX_HYD_ENG1PUMP_TOGGLE
    - Bool
    - True if engine 1 hyd pump is on

- A32NX_HYD_ENG2PUMP_FAULT
    - Bool
    - True if engine 2 hyd pump fault

- A32NX_HYD_ENG2PUMP_TOGGLE
    - Bool
    - True if engine 2 hyd pump is on

- A32NX_HYD_ELECPUMP_FAULT
    - Bool
    - True if elec hyd pump fault

- A32NX_HYD_ELECPUMP_TOGGLE
    - Bool
    - True if elec hyd pump is on/auto

- A32NX_HYD_PTU_FAULT
    - Bool
    - True if PTU fault

- A32NX_HYD_PTU_TOGGLE
    - Bool
    - True if PTU system on/auto

- A32NX_HYD_ELECPUMPY_FAULT
    - Bool
    - True if yellow elec hyd pump fault

- A32NX_HYD_ELECPUMPY_TOGGLE
    - Bool
    - True if yellow elec hyd pump is on/auto

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

- A32NX_EMERELECPWR_GEN1_FAULT
    - Bool
    - True if generator 1 line fault

- A32NX_EMERELECPWR_GEN1_TOGGLE
    - Bool
    - True if generator 1 line is off

- A32NX_EMERELECPWR_RAT_FAULT
    - Bool
    - True if RAT elec power fault

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

- A32NX_KNOB_SWITCHING_1_Position
    - ATT HDG
    - Position (0-2)
    - 0 is CAPT, 1 is NORM, 2 is F/O

- A32NX_KNOB_SWITCHING_2_Position
    - AIR DATA
    - Position (0-2)
    - 0 is CAPT, 1 is NORM, 2 is F/O

- A32NX_KNOB_SWITCHING_3_Position
    - EIS DMC
    - Position (0-2)
    - 0 is CAPT, 1 is NORM, 2 is F/O

- A32NX_KNOB_SWITCHING_4_Position
    - ECAM/ND XFR
    - Position (0-2)
    - 0 is CAPT, 1 is NORM, 2 is F/O

- A32NX_METRIC_ALT_TOGGLE
    - Bool
    - True if PFD metric altitude enabled

- A32NX_OVHD_HYD_BLUEPUMP_OVRD
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

- A32NX_LANDING_ELEVATION
    - Number in feet
    - Minimum -2000, maximum 15000

- A32NX_MAN_VS_CONTROL
    - Number, either 0,1 or 2
    - 0 if switch is in up position, 1 if switch is neutral, 2 if switch is down.

- A32NX_CAB_PRESS_MODE_MAN
    - Bool
    - True if CABIN PRESS MODE SEL is in manual mode

- A32NX_CAB_PRESS_SYS_FAULT
    - Bool
    - Determines if the FAULT light on the CABIN PRESS MODE SEL pushbutton
      should be on

- A32NX_DITCHING
    - Bool
    - True if DITCHING mode is enabled

- A32NX_FWC_FLIGHT_PHASE
    - Enum
    - Contains the numeric flight phase as determined by the FWC

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
    - Celsius
    - The APU's exhaust gas temperature caution level, to be indicated in amber in the cockpit

- A32NX_APU_EGT_WARNING
    - Celsius
    - The APU's exhaust gas temperature warning level, to be indicated in red in the cockpit

- A32NX_APU_EGT
    - Celsius
    - The APU's exhaust gas temperature

- A32NX_APU_N
    - Percent
    - The APU's rotations per minute in percentage of the maximum RPM

- A32NX_APU_BLEED_AIR_VALVE_OPEN
    - Bool
    - Indicates if the APU bleed air valve is open

- A32NX_APU_LOW_FUEL_PRESSURE_FAULT
    - Bool
    - Indicates if the APU has an active LOW FUEL PRESSURE fault

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
    -Bool
    -True if rain repellent is activated on the right windshield.

- A32NX_RAIN_REPELLENT_LEFT_ON
    -Bool
    -True if rain repellent is activated on the left windshield.

- A32NX_RCDR_TEST
    -Bool
    -True if RCDR being tested.

- A32NX_RADAR_MULTISCAN_AUTO
    -Bool
    -True if multiscan switch is set to AUTO.

- A32NX_RADAR_GCS_AUTO
    -Bool
    -True if GCS switch is set to AUTO.

-A32NX_OXYGEN_MASKS_DEPLOYED
    -Bool
    -True if cabin oxygen masks have been deployed.

-A32NX_RCDR_GROUND_CONTROL_ON
    -Bool
    -True if ground control is on.

-A32NX_EMERELECPWR_MAN_ON
    -Bool
    -True if Ram Air Turbine has been manually deployed.

-A32NX_EMERELECPWR_GEN_TEST
    -Bool
    -True if emergency generator is being tested.

-A32NX_OXYGEN_PASSENGER_LIGHT_ON
    -Bool
    -True if cabin oxygen mask doors open.

-A32NX_OXYGEN_TMR_RESET
    -Bool
    -True if oxygen timer is being reset.

-A32NX_OXYGEN_TMR_RESET_FAULT
    -Bool
    -True if fault with oxygen timer.

-A32NX_APU_AUTOEXITING_RESET
    -Bool
    -True if APU autoexiting is being reset.

-A32NX_ELT_TEST_RESET
    -Bool
    -True if ELT is being tested/reset.

-A32NX_ELT_ON
    -Bool
    -True if ELT is on.

-A32NX_DLS_ON
    -Bool
    -True if data loading selector is on.

-A32NX_CREW_HEAD_SET
    -Bool
    -True if CVR crew head set is being pressed.

-A32NX_SVGEINT_OVRD_ON
    -Bool
    -True if SVGE INT OVRD is on.

-A32NX_AVIONICS_COMPLT_ON
    -Bool
    -True if avionics comp lt is on.

-A32NX_CARGOSMOKE_FWD_DISCHARGED
    -Bool
    -True if cargosmoke one bottle is discharged

-A32NX_CARGOSMOKE_AFT_DISCHARGED
    -Bool
    -True if cargosmoke two bottle is discharged

-A32NX_AIDS_PRINT_ON
    -Bool
    -True if AIDS print is on.

-A32NX_DFDR_EVENT_ON
    -Bool
    -True if DFDR event is on.

-A32NX_APU_AUTOEXITING_TEST_ON
    -Bool
    -True if APU AUTOEXITING is being tested.

-A32NX_APU_AUTOEXITING_TEST_OK
    -Bool
    -True if APU AUTOEXITING TEST returns OK.

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
        - ELEC_BAT_10
        - ELEC_BAT_11
        - ELEC_IDG_1
        - ELEC_IDG_2
        - ELEC_ENG_GEN_1
        - ELEC_ENG_GEN_2
        - ELEC_AC_ESS_FEED
        - ELEC_GALY_AND_CAB
        - PNEU_APU_BLEED

- A32NX_OVHD_{name}_PB_IS_AUTO
    - Bool
    - True when the push button is AUTO
    - {name}
        - ELEC_BAT_10
        - ELEC_BAT_11
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
        - DC_1
        - DC_2
        - DC_ESS
        - DC_ESS_SHED
        - DC_BAT
        - DC_HOT_1
        - DC_HOT_2


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
        - BAT_10: Battery 1
        - BAT_11: Battery 2

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
        - BAT_10: Battery 1
        - BAT_11: Battery 2

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
        - BAT_10: Battery 1 (negative when discharging, positive when charging)
        - BAT_11: Battery 2 (negative when discharging, positive when charging)

- A32NX_ELEC_{name}_CURRENT_NORMAL
    - Ampere
    - Indicates if the current is within the normal range
    - {name}
        - TR_1
        - TR_2
        - TR_3: TR ESS
        - BAT_10: Battery 1
        - BAT_11: Battery 2

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

## Fly-By-Wire System

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

## Throttle Mapping System

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
