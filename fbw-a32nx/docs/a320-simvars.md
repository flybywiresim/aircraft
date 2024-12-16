# A320neo Local SimVars

## Contents

- [A320neo Local SimVars](#a320neo-local-simvars)
  - [Contents](#contents)
  - [Uncategorized](#uncategorized)
  - [Model/XML Interface](#modelxml-interface)
  - [EIS Display System](#eis-display-system)
  - [ADIRS](#adirs)
  - [Radio Receivers](#radio-receivers)
  - [Flight Management System](#flight-management-system)
  - [Autothrust System](#autothrust-system)
  - [Throttle Mapping System](#throttle-mapping-system)
  - [Engine and FADEC System](#engine-and-fadec-system)
  - [Air Conditioning / Pressurisation / Ventilation](#air-conditioning--pressurisation--ventilation)
  - [Pneumatic](#pneumatic)
  - [Autoflight (ATA 22)](#autoflight-ata-22)
    - [Flight Management and Guidance Computer (FMGC, Flight Guidance Section)](#flight-management-and-guidance-computer-fmgc-flight-guidance-section)
    - [Flight Control Unit (FCU)](#flight-control-unit-fcu)
      - [FCU EFIS CP](#fcu-efis-cp)
      - [FCU AFS CP](#fcu-afs-cp)
      - [FCU Output Bus](#fcu-output-bus)
    - [Flight Augmentation Computer (FAC)](#flight-augmentation-computer-fac)
  - [Flaps / Slats (ATA 27)](#flaps--slats-ata-27)
  - [Flight Controls (ATA 27)](#flight-controls-ata-27)
  - [Landing Gear (ATA 32)](#landing-gear-ata-32)
  - [ATC (ATA 34)](#atc-ata-34)
  - [Radio Altimeter (ATA 34)](#radio-altimeter-ata-34)
  - [GPWS / TAWS (ATA 34)](#gpws--taws-ata-34)
  - [ROW / ROP / OANS (ATA 34)](#row--rop--oans-ata-34)
  - [Electronic Flight Bag (ATA 46)](#electronic-flight-bag-ata-46)
  - [Non-Systems Related](#non-systems-related)
- [Deprecated](#deprecated)

## Uncategorized

- A32NX_IS_READY
    - Bool
    - Indicates that the JavaScript part is ready

- A32NX_IS_STATIONARY
    - Bool
    - Aircraft is stationary in relation to the speed of the first surface directly underneath it. (stationary on a
      carrier that is moving would be considered stationary)

- A32NX_GND_EQP_IS_VISIBLE
    - Bool
    - Indicates if any GND equipment is visible or not

- A32NX_START_STATE
    - Enum
    - Indicates the state in which MSFS started
    - State | Value
            --- | ---
      Hangar | 1
      Apron | 2
      Taxi | 3
      Runway | 4
      Climb | 5
      Cruise | 6
      Approach | 7
      Final | 8

- A32NX_NO_SMOKING_MEMO
    - Boolean that determines whether the NO SMOKING memo should be visible on the upper ECAM
    - Also is used for knowing when to play the no smoking chime sound

- A32NX_BRAKE_TEMPERATURE_{1,2,3,4}
    - celsius
    - represents the brake temperature of the rear wheels

- A32NX_REPORTED_BRAKE_TEMPERATURE_{1,2,3,4}
    - `Arinc429Word<Celsius>`
    - represents the reported brake temperature of the main wheels reported by the BSCU.
    - It can be different from the brake temperature when the brake fan has been used, because the brake fan will cool
      the sensor more than the brakes
    - (which have much more energy to dissipate) therefore giving potentially erroneous readings that the pilots must
      take into account

- A32NX_BRAKE_FAN_RUNNING
    - boolean
    - whether or not the brake fan is running
      (brake fan button pressed AND left main landing gear down and locked, reported by BSCU)

- A32NX_BRAKE_FAN_{side}_RUNNING
    - boolean
    - wether or not a brake fan on the corresponding side is running
    - {side}
        - LEFT
        - RIGHT

- A32NX_BRAKE_FAN_BTN_PRESSED
    - boolean
    - whether or not the brake fan button is pressed

- A32NX_BRAKES_HOT
    - boolean
    - whether one of the brakes are hot (>300°C)

- A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position
    - Position (0-2)
    - 0 is SHUT, 1 is AUTO, 2 is OPEN

- A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position
    - Position (0-2)
    - 0 is LO, 1 is NORM, 2 is HI

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

- L:A32NX_DMC_DISPLAYTEST:{1,2,3}
    - Enum
    - Provides the display test status (can be set in the CFDS) for the respective DMC {1,2,3}
      Value | Meaning
      --- | ---
      0 | Inactive
      1 | Maintenance Mode active
      2 | Engineering display test in progress

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

- A32NX_OVHD_HYD_LEAK_MEASUREMENT_G_PB_IS_AUTO
    - Bool
    - True if "HYD LEAK MEASUREMENT G" switch is on

- A32NX_OVHD_HYD_LEAK_MEASUREMENT_G_LOCK
    - Bool
    - True if "HYD LEAK MEASUREMENT G" switch lock is down

- A32NX_OVHD_HYD_LEAK_MEASUREMENT_B_PB_IS_AUTO
    - Bool
    - True if "HYD LEAK MEASUREMENT B" switch is on

- A32NX_OVHD_HYD_LEAK_MEASUREMENT_B_LOCK
    - Bool
    - True if "HYD LEAK MEASUREMENT B" switch lock is down

- A32NX_OVHD_HYD_LEAK_MEASUREMENT_Y_PB_IS_AUTO
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
  - | Value  | Flight Phase     |
        |--------|------------------|
    | 0      |                  |
    | 1      | ELEC PWR         |
    | 2      | 1ST ENG STARTED  |
    | 3      | 1ST ENG TO PWR   |
    | 4      | 80 kt            |
    | 5      | LIFTOFF          |
    | 6      | 1500ft (in clb)  |
    | 7      | 800 ft (in desc) |
    | 8      | TOUCHDOWN        |
    | 9      | 80 kt            |
    | 10     | 2nd ENG SHUTDOWN |
    | &gt; 1 | 5 MIN AFTER      |

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

- A32NX_SPEEDS_VS
    - Number
    - Current config stall speed
    - is mach corrected

- A32NX_SPEEDS_VLS
    - Number
    - Current config minimum selectable speed
    - is mach corrected

- A32NX_SPEEDS_F
    - Number
    - F-Speed (approach)

- A32NX_SPEEDS_S
    - Number
    - S-Speed (approach)

- A32NX_SPEEDS_GD
    - Number
    - Green Dot speed (clean config or O)
    - is mach corrected

- A32NX_SPEEDS_LANDING_CONF3
    - Bool
    - True if FLAPS 3 is selected in perf page

- A32NX_SPEEDS_TO_CONF
    - Number
    - Flaps config for TakeOff, 1, 2 or 3

- A32NX_SPEEDS_VLS_APP
    - Number
    - vls calculated for config full whether A32NX_VSPEEDS_LANDING_CONF3 or not
    - is mach corrected

- A32NX_SPEEDS_VAPP
    - Number
    - vapp calculated for config full whether A32NX_VSPEEDS_LANDING_CONF3 or not
    - is mach corrected

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

- A32NX_RMP_{L,R}_NAV_BUTTON_SELECTED
    - Bool
    - Whether the NAV push button on the corresponding RMP is pushed or not.

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

- A32NX_RMP_{L,R}_SAVED_ACTIVE_FREQUENCY_VOR
    - Hz
    - The VOR active frequency that is saved for display for the left/right RMP.

- A32NX_RMP_{L,R}_SAVED_ACTIVE_FREQUENCY_ILS
    - Hz
    - The ILS active frequency that is saved for display for the left/right RMP.

- A32NX_RMP_{L,R}_SAVED_ACTIVE_FREQUENCY_ADF
    - Hz
    - The ADF active frequency that is saved for display for the left/right RMP.

- A32NX_RMP_{L,R}_SAVED_STANDBY_FREQUENCY_VOR
    - Hz
    - The VOR standby frequency that is saved for display for the left/right RMP.

- A32NX_RMP_{L,R}_SAVED_STANDBY_FREQUENCY_ILS
    - Hz
    - The ILS standby frequency that is saved for display for the left/right RMP.

- A32NX_RMP_{L,R}_SAVED_STANDBY_FREQUENCY_ADF
    - Hz
    - The ADF standby frequency that is saved for display for the left/right RMP.

- A32NX_RMP_{L,R}_SAVED_COURSE_VOR
    - Number
    - The VOR course tuned via the left/right RMP

- A32NX_RMP_{L,R}_SAVED_COURSE_ILS
    - Number
    - The ILS course tuned via the left/right RMP

- A32NX_TO_CONFIG_FLAPS
    - Enum
    - The pilot-entered FLAPS value in the PERF TAKE OFF page. 0 is a valid entry, -1 if not entered

- A32NX_TO_CONFIG_THS_ENTERED
    - ** Deprecated, see `A32NX_FM{number}_TO_PITCH_TRIM`
    - Bool
    - True if the pilot has entered a THS value in the PERF TAKEO FF takeoff

- A32NX_TO_CONFIG_THS
    - ** Deprecated, see `A32NX_FM{number}_TO_PITCH_TRIM`
    - Degrees
    - The pilot-entered THS value in the PERF TAKE OFF page. 0 is a valid entry.

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

- A32NX_OVHD_{name}_PB_IS_DISC
    - Bool
    - True when the idg is disconnected
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

- A32NX_HYD_{loop_name}_SYSTEM_1_SECTION_PRESSURE_SWITCH
    - Boolean
    - Current pressure switch state in {loop_name} hydraulic circuit downstream of leak valve
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

- A32NX_HYD_{loop_name}_PUMP_1_SECTION_PRESSURE_SWITCH
    - Boolean
    - Current pressure switch state in {loop_name} pump section
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

- A32NX_HYD_{loop_name}_RESERVOIR_AIR_PRESSURE_IS_LOW
    - Boolean
    - Low air pressure switch of {loop_name} hydraulic circuit reservoir indicates low state
    - {loop_name}
        - GREEN
        - BLUE
        - YELLOW

- A32NX_HYD_{loop_name}_RESERVOIR_OVHT
    - Boolean
    - Reservoir of {loop_name} hydraulic circuit is overheating
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

- A32NX_REALISTIC_TILLER_ENABLED
    - Bool
    - 0 for legacy mode (steering with rudder). 1 for realistic mode with tiller axis
      Tiller axis to be binded on "ENGINE 4 MIXTURE AXIS"

- A32NX_FO_SYNC_EFIS_ENABLED
    - Bool
    - 1 to sync the status of FD and LS buttons, and audio panel controls, between CPT and FO sides

- A32NX_HYD_{loop_name}_EPUMP_LOW_PRESS
    - Bool
    - Electric pump of {loop_name} hydraulic circuit is active but pressure is too low
    - {loop_name}
        - BLUE
        - YELLOW

- A32NX_HYD_{loop_name}_EPUMP_OVHT
    - Bool
    - Electric pump of {loop_name} hydraulic circuit is overheating
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

- A32NX_HYD_PTU_SHAFT_RPM
    - Revolutions per minute
    - Power Transfer Unit shaft rpm

- A32NX_HYD_PTU_BARK_STRENGTH
    - Number
    - 0 no PTU. 1 to 5 indicates barking sound power level.

- A32NX_HYD_PTU_CONTINUOUS_MODE
    - Bool
    - Power Transfer Unit is rotating continuously

- A32NX_HYD_PTU_DEV_DEACTIVATION_DELTA
    - Psi
    - Write to this simvar to force a deactivation delta pressure for Power Transfer Unit

- A32NX_HYD_PTU_DEV_EFFICIENCY
    - Number
    - Write to this simvar to force an efficiency value for Power Transfer Unit

- A32NX_OVHD_HYD_RAT_MAN_ON_IS_PRESSED
    - Bool
    - Deploys the RAT manually

- A32NX_RAT_STOW_POSITION
    - Percent over 100
    - RAT position, from fully stowed (0) to fully deployed (1)

- A32NX_RAT_RPM
    - Rpm
    - RAT propeller current RPM

- A32NX_RAT_ANGULAR_POSITION
    - Degrees
    - RAT propeller angular position

- A32NX_RAT_PROPELLER_ANGLE
    - Percent over 100
    - RAT propeller pitch angle (0 to 1 normalized)

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

- A32NX_HYD_EMERGENCY_GEN_RPM
    - Rpm
    - Hydraulic emergency generator current rpm

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

- A32NX_AUTOBRAKES_ARMED_MODE_SET
    - Number
    - Requests an autobrake mode
        - -1: (technical state not requesting anything)
        - 0: Disarm Autobrake
        - 1: Set Autobrake to LOW
        - 2: Set Autobrake to MED
        - 3: Set Autobrake to MAX (if allowed)

- A32NX_AUTOBRAKES_ACTIVE
    - Bool
    - Autobrakes are braking

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
    - ** DEPRECATED ** Do not use.
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
      TAKEOFF | 1
      CLIMB | 2
      CRUISE | 3
      DESCENT | 4
      APPROACH | 5
      GOAROUND | 6
      DONE | 7

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

- A32NX_IS_FLAPS_MOVING
    - Boolean
    - The flap surface is moving

- A32NX_IS_SLAPS_MOVING
    - Boolean
    - The slat surface is moving

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
    - Indicates if the ground spoiler handle is physically in the armed position.
        DO NOT USE IN SYSTEMS, USE FCDC INSTEAD
      Value | Meaning
      --- | ---
      0 | disarmed
      1 | armed

- A32NX_SPOILERS_HANDLE_POSITION
    - Number
    - Indicates the physical handler position without arm/disarm.
        DO NOT USE IN SYSTEMS, USE FCDC INSTEAD
      Value | Position
      --- | ---
      0 | Retracted
      1 | Full extension

- A32NX_PERFORMANCE_WARNING_ACTIVE
    - Bool
    - Indicates if performance warning is active
      Value | Meaning
      --- | ---
      0 | inactive
      1 | active

- A32NX_CHRONO_ELAPSED_TIME
    - Number
    - Clock instrument CHR display time elapsed
      Value | Meaning
      --- | ---
      0 or greater | Seconds elapsed
      -1 | Empty value

- A32NX_CHRONO_ET_ELAPSED_TIME
    - Number
    - Clock instrument ET display time elapsed
      Value | Meaning
      --- | ---
      0 or greater | Seconds elapsed
      -1 | Empty value

- A32NX_LIGHTING_PRESET_LOAD
    - Number
    - ID for preset
    - When set to >0 the corresponding preset will be loaded if defined
    - Will be reset to 0 after loading is done

- A32NX_LIGHTING_PRESET_SAVE
    - Number
    - ID for preset
    - When set to >0 the corresponding preset will be overwritten and saved to an ini file
    - Will be reset to 0 after saving is done

- A32NX_AIRCRAFT_PRESET_LOAD
    - Number
    - ID for preset (1..5)
    - When set to >0 the corresponding preset will be loaded if defined
    - Will be reset to 0 after loading is done
    - When set to 0 during loading will stop and cancel the loading process
    - | Value | Meaning            |
      |-------|--------------------|
      | 1     | Cold & Dark        |
      | 2     | Powered            |
      | 3     | Ready for Pushback |
      | 4     | Ready for Taxi     |
      | 5     | Ready for Takeoff  |

- A32NX_AIRCRAFT_PRESET_LOAD_PROGRESS
    - Number (0.0..1.0)
    - While loading a preset this will contain the percentage of the total progress of loading

- A32NX_AIRCRAFT_PRESET_LOAD_EXPEDITE
  - Bool
  - When set to true the loading process will be expedited and the loading will be done as fast as possible

- A32NX_PUSHBACK_SYSTEM_ENABLED
    - Bool
    - Read/Write
    - 0 when pushback system is completely disabled, 1 when system is enabled
    - When disabled pushback UI in the flyPadOS 3 is disabled and movement updates are suspended.
    - This prevents conflicts with other pushback add-ons

- A32NX_PUSHBACK_SPD_FACTOR
  - Number -1.0..1.0
  - Read/Write
  - Speed factor for pushback
  - 0.0 is stopped, 1.0 is full speed forward, -1.0 is full speed backward

- A32NX_PUSHBACK_HDG_FACTOR
  - Number -1.0..1.0
  - Read/Write
  - Turn factor for pushback
  - -1.0 is full left, 0.0 is straight, 1.0 is full right

- A32NX_DEVELOPER_STATE
    - Bool
    - Persistent
    - Enables developer-specific options like direct payload adjustments

- A32NX_FWC_RADIO_AUTO_CALL_OUT_PINS
    - Flags
    - Radio altitude automatic call out pin programs
    - | Bit   | Meaning                   |
      |-------|---------------------------|
      | 0     | Two Thousand Five Hundred |
      | 1     | Twenty Five Hundred       |
      | 2     | Two Thousand              |
      | 3     | One Thousand              |
      | 4     | Five Hundred              |
      | 5     | Four Hundred              |
      | 6     | Three Hundred             |
      | 7     | Two Hundred               |
      | 8     | One Hundred               |
      | 9     | Fifty                     |
      | 10    | Forty                     |
      | 11    | Thirty                    |
      | 12    | Twenty                    |
      | 13    | Ten                       |
      | 14    | Five                      |

- A32NX_LANDING_{ID}_POSITION
    - Percent
    - Current position of the landing light animation
    - {ID}
        - 2 | LEFT
        - 3 | RIGHT

- A32NX_AIRLINER_CRUISE_ALTITUDE
  - Number (feet)
  - Current cruise altitude of the aircraft
  - note: this LVar was named incorrectly before missing the prefix:`AIRLINER_CRUISE_ALTITUDE`

- A32NX_AIRLINER_TO_FLEX_TEMP
  - Number (degrees Celsius)
  - Current takeoff flex temperature of the aircraft
  - note: this LVar was named incorrectly before missing the prefix:`AIRLINER_TO_FLEX_TEMP`

## Model/XML Interface

These variables are the interface between the 3D model and the systems/code.

- A32NX_OVHD_INTLT_ANN
    - Enum
    - ANN LT TEST Switch On the Overhead Panel (25VU)
    Value | Meaning
    --- | ---
    0 | TEST
    1 | BRT
    2 | DIM

- A32NX_MCDU_{side}_BRIGHTNESS
    - Boolean
    - MCDU display emissive brightness. Non-linear to account for MSFS emissive behaviour, and max brightness can change from time to time with sim updates.
    - {side}
        - L
        - R

## EIS Display System

- A32NX_FCU_EFIS_{side}_NAVAID_{1|2}_MODE
    - Enum
    - Provides the selected NAVAID knob posiiton. For use systems, use the FCU discrete words instead.
      Value | Meaning
      --- | ---
      0 | Off
      1 | ADF
      2 | VOR
    - {side}
        - L
        - R

- A32NX_FCU_EFIS_{side}_EFIS_MODE
    - Enum
    - Provides the navigation display mode knob position. For use systems, use the FCU discrete words instead.
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

- A32NX_FCU_EFIS_{side}_EFIS_RANGE
    - Enum
    - Provides the selected navigation display range knob position. For use systems, use the FCU discrete words instead.
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

- A32NX_FCU_EFIS_{side}_{FILTER}_LIGHT_ON
    - Bool
    - If the related EFIS filter is selected, this Lvar is true. For use systems, use the FCU discrete words instead.
    - {FILTER}
      - None
      - Constraints
      - VOR/DMEs
      - Waypoints
      - NDBs
      - Airports
    - {side}
        - L
        - R

- A32NX_EFIS_{side}_ND_FM_MESSAGE_FLAGS
    - Flag
    - Provides a bitfield of the active FM messages to the NDs
      Bit | Meaning
      --- | ---
      0 | SelectTrueRef
      1 | CheckNorthRef
      2 | NavAccuracyDowngrade
      3 | NavAccuracyUpgradeNoGps
      4 | SpecifiedVorDmeUnavailble
      5 | NavAccuracyUpgradeGps
      6 | GpsPrimary
      7 | MapPartlyDisplayed
      8 | SetOffsideRangeMode
      9 | OffsideFmControl
      10 | OffsideFmWxrControl
      11 | OffsideWxrControl
      12 | GpsPrimaryLost
      13 | RtaMissed
      14 | BackupNav
    - {side}
        - L
        - R

- A32NX_EFIS_{side}_TO_WPT_BEARING
    - Degrees
    - Provides the bearing to the active leg termination
    - {side}
        - L
        - R

- A32NX_EFIS_{side}_TO_WPT_DISTANCE
    - Nautical miles & > 0
    - Provides the straight distance to the active leg termination
    - {side}
        - L
        - R

- A32NX_EFIS_{side}_TO_WPT_ETA
    - Seconds
    - Provides the number of seconds to the active leg termination (to be converted to UTC by DMC)
    - {side}
        - L
        - R

- A32NX_EFIS_{side}_MRP_LAT
    - Arinc429<Degrees>
    - Provides the latitude of the map reference point in the FMS to show on the ND
    - {side}
        - L
        - R

- A32NX_EFIS_{side}_MRP_LONG
    - Arinc429<Degrees>
    - Provides the longitude of the map reference point in the FMS to show on the ND
    - {side}
        - L
        - R

- A32NX_PFD_MSG_SET_HOLD_SPEED
    - Bool
    - Indicates if the SET HOLD SPEED message is shown on the PFD

- A32NX_PFD_MSG_TD_REACHED
    - Bool
    - Indicates if the T/D REACHED message is shown on the PFD

- A32NX_PFD_MSG_CHECK_SPEED_MODE
    - Bool
    - Indicates if the CHECK SPEED MODE message is shown on the PFD

- A32NX_PFD_LINEAR_DEVIATION_ACTIVE
    - Bool
    - Indicates if the linear deviation is shown on the PFD

- A32NX_PFD_TARGET_ALTITUDE
    - Feet
    - Indicates the current target altitude in the DES mode. This is an indicated altitude and not a pressure altitude
    - This is used to compute a linear deviation

- A32NX_PFD_VERTICAL_PROFILE_LATCHED
    - Boolean
    - Indicates whether to show the latch symbol on the PFD with the deviation indicator

- A32NX_PFD_SHOW_SPEED_MARGINS
    - Boolean
    - Indicates whether speed margins are shown on the PFD in DES mode. Only for FMS -> FG communication

- A32NX_PFD_UPPER_SPEED_MARGIN
    - Knots
    - Indicates the speed for the upper speed margin limit in DES mode. Only for FMS -> FG communication

- A32NX_PFD_LOWER_SPEED_MARGIN
    - Knots
    - Indicates the speed for the lower speed margin limit in DES mode. Only for FMS -> FG communication

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

- A32NX_BOARDING_STARTED_BY_USR
    - Bool
    - Indicates current pax/cargo loading state

- A32NX_AIRFRAME_ZFW_DESIRED
    - Kg
    - Indicates the desired ZFW when boarding

- A32NX_AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED
    - % MAC
    - Indicates the desired ZFW CoG when boarding

- A32NX_PAX_{station}
    - Bitwise Field
    - Indicates the current pax in the selected rows (max 53 bits)
    - {station}
        - A
        - B
        - C
        - D

- A32NX_PAX_{station}_DESIRED
    - Bitwise Field
    - Indicates the target layout of passengers in the station (max 53)
    - {station}
        - A
        - B
        - C
        - D

- A32NX_PAX
    - Bitwise Field
    - Indicates the current layout of passengers in the station (max 53)
    - {station}
        - A
        - B
        - C
        - D

- A32NX_CARGO_{station}_DESIRED
    - Number (Kilograms)
    - Indicates the targeted weight of the station in kilograms
    - {station}
        - FWD_BAGGAGE
        - AFT_CONTAINER
        - AFT_BAGGAGE
        - AFT_BULK_LOOSE

- A32NX_CARGO
    - Number (Kilograms)
    - Indicates the current weight of the station in kilograms
    - {station}
        - FWD_BAGGAGE
        - AFT_CONTAINER
        - AFT_BAGGAGE
        - AFT_BULK_LOOSE

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
    - Deprecated: use A32NX_ADIRS_IR_{number}_MAINT_WORD instead.
    - Enum
    - The Inertial Reference alignment state.
      Description | Value
      --- | ---
      Off | 0
      Aligning | 1
      Aligned | 2

- A32NX_ADIRS_REMAINING_IR_ALIGNMENT_TIME
    - Deprecated: use A32NX_ADIRS_IR_{number}_MAINT_WORD instead.
    - Seconds
    - The remaining alignment duration. Zero seconds when the system is aligned or the system is not aligning.

- A32NX_ADIRS_ADR_{number}_CORRECTED_AVERAGE_STATIC_PRESSURE
    - Arinc429Word<hPa>
    - The corrected average static pressure.

- A32NX_ADIRS_ADR_{number}_BARO_CORRECTION_1_HPA
    - Arinc429Word<hPa>
    - The local barometric setting entered on the captain side.

- A32NX_ADIRS_ADR_{number}_BARO_CORRECTION_1_INHG
    - Arinc429Word<inHg>
    - The local barometric setting entered on the captain side.

- A32NX_ADIRS_ADR_{number}_BARO_CORRECTION_2_HPA
    - Arinc429Word<hPa>
    - The local barometric setting entered on the first officer side.

- A32NX_ADIRS_ADR_{number}_BARO_CORRECTION_2_INHG
    - Arinc429Word<inHg>
    - The local barometric setting entered on the first officer side.

- A32NX_ADIRS_ADR_{number}_ALTITUDE
    - Arinc429Word<Feet>
    - The pressure altitude in feet.

- A32NX_ADIRS_ADR_{number}_BARO_CORRECTED_ALTITUDE_{side}
    - Arinc429Word<Feet>
    - The baro corrected altitude in feet.
    - {side}
        - 1: Captain
        - 2: First Officer

- A32NX_ADIRS_ADR_{number}_COMPUTED_AIRSPEED
    - Arinc429Word<Knots>
    - The computed airspeed (CAS).

- A32NX_ADIRS_ADR_{number}_MAX_AIRSPEED
    - Arinc429Word<Knots>
    - The max allowable airspeed (CAS), considering VMO and MMO.

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

- A32NX_ADIRS_ADR_{number}_TOTAL_AIR_TEMPERATURE
    - Arinc429Word<Celsius>
    - The total air temperature (TAT).

- A32NX_ADIRS_ADR_{number}_ANGLE_OF_ATTACK
    - Arinc429Word<Degrees>
    - The angle of attack (α) of the aircraft

- A32NX_ADIRS_ADR_{number}_DISCRETE_WORD_1
    - Arinc429Word<flags>
    - Indicates state of the ADR
      Bit | Meaning
      --- | ---
        0 | ICING_DETECTOR_HEAT (not yet implemented)
        1 | PITOT_HEAT (not yet implemented)
        2 | ADR_FAULT
        3 | RIGHT_STATIC_HEAT (not yet implemented)
        4 | LEFT_STATIC_HEAT (not yet implemented)
        5 | TAT_HEAT (not yet implemented)
        6 | AOA_SENSOR_1_FAULT (not yet implemented)
        7 | AOA_SENSOR_2_FAULT (not yet implemented)
        8 | OVERSPEED_WARNING
       10 | AOA_UNIQUE (not yet implemented)
       11 | VMO_MMO_1 (not yet implemented)
       12 | VMO_MMO_2 (not yet implemented)
       13 | VMO_MMO_3 (not yet implemented)
       14 | VMO_MMO_4 (not yet implemented)
       15 | ALTERNATE_SSEC_A (not yet implemented)
       16 | ALTERNATE_SSEC_B (not yet implemented)
       17 | BARO_PORT_A (not yet implemented)
       18 | ZERO_MACH_IGNORE_SSEC (not yet implemented)

- A32NX_ADIRS_IR_{number}_PITCH
    - Arinc429Word<Degrees>
    - The pitch angle of the aircraft.

- A32NX_ADIRS_IR_{number}_ROLL
    - Arinc429Word<Degrees>
    - The roll angle of the aircraft.

- A32NX_ADIRS_IR_{number}_HEADING
    - Arinc429Word<Degrees>
    - The magnetic heading of the aircraft (true in polar region).

- A32NX_ADIRS_IR_{number}_TRUE_HEADING
    - Arinc429Word<Degrees>
    - The true inertial heading of the aircraft.

- A32NX_ADIRS_IR_{number}_TRACK
    - Arinc429Word<Degrees>
    - The magnetic track of the aircraft (true in polar region).

- A32NX_ADIRS_IR_{number}_TRUE_TRACK
    - Arinc429Word<Degrees>
    - The true inertial track of the aircraft.

- A32NX_ADIRS_IR_{number}_VERTICAL_SPEED
    - Arinc429Word<Feet per minute>
    - The vertical speed (V/S) based on inertial reference data.

- A32NX_ADIRS_IR_{number}_GROUND_SPEED
    - Arinc429Word<Knots>
    - The ground speed (GS) of the aircraft.

- A32NX_ADIRS_IR_{number}_WIND_DIRECTION
    - Arinc429Word<Degrees>
    - [0, 359.9]
    - The direction of the wind relative to true north.

- A32NX_ADIRS_IR_{number}_WIND_DIRECTION_BNR
    - Arinc429Word<Degrees>
    - [-180, 180]
    - The direction of the wind relative to true north.

- A32NX_ADIRS_IR_{number}_WIND_SPEED
    - Arinc429Word<Knots>
    - [0, 255]
    - The speed of the wind.

- A32NX_ADIRS_IR_{number}_WIND_SPEED_BNR
    - Arinc429Word<Knots>
    - [0, 255]
    - The speed of the wind.

- A32NX_ADIRS_IR_{number}_LATITUDE
    - Arinc429Word<Degrees>
    - The latitude of the aircraft.

- A32NX_ADIRS_IR_{number}_LONGITUDE
    - Arinc429Word<Degrees>
    - The longitude of the aircraft.

- A32NX_ADIRS_IR_{number}_DRIFT_ANGLE
    - Arinc429Word<Degrees>
    - The drift angle of the aircraft (drift angle = heading - track)

- A32NX_ADIRS_IR_{number}_FLIGHT_PATH_ANGLE
    - Arinc429Word<Degrees>
    - The kinematic flight path angle (γ) (arctan(VS / GS))

- A32NX_ADIRS_IR_{number}_BODY_PITCH_RATE
    - Arinc429Word<Degrees per second>
    - The body pitch rate (q) of the aircraft

- A32NX_ADIRS_IR_{number}_BODY_ROLL_RATE
    - Arinc429Word<Degrees per second>
    - The body roll rate (p) of the aircraft

- A32NX_ADIRS_IR_{number}_BODY_YAW_RATE
    - Arinc429Word<Degrees per second>
    - The body yaw rate (r) of the aircraft

- A32NX_ADIRS_IR_{number}_BODY_LONGITUDINAL_ACC
    - Arinc429Word<g-Number>
    - The longitudinal (forward/backward) acceleration of the aircraft

- A32NX_ADIRS_IR_{number}_BODY_LATERAL_ACC
    - Arinc429Word<g-Number>
    - The lateral (left/right) acceleration of the aircraft

- A32NX_ADIRS_IR_{number}_BODY_NORMAL_ACC
    - Arinc429Word<g-Number>
    - The normal acceleration (load factor) of the aircraft

- A32NX_ADIRS_IR_{number}_HEADING_RATE
    - Arinc429Word<Degrees per second>
    - The heading rate (ψ^dot) of the aircraft

- A32NX_ADIRS_IR_{number}_PITCH_ATT_RATE
    - Arinc429Word<Degrees per second>
    - The pitch rate (θ^dot) of the aircraft

- A32NX_ADIRS_IR_{number}_ROLL_ATT_RATE
    - Arinc429Word<Degrees per second>
    - The roll rate (φ^dot) of the aircraft

- A32NX_ADIRS_IR_{number}_MAINT_WORD
    - Arinc429Word<flags>
    - Indicates state of the IR
      Bit | Meaning
      --- | ---
        0 | ALIGNMENT_NOT_READY
        1 | REV_ATT_MODE
        2 | NAV_MODE
        3 | VALID_SET_HEADING
        4 | ATTITUDE_INVALID
        5 | DC_FAIL
        6 | ON_DC
        7 | ADR_FAULT
        8 | IR_FAULT
        9 | DC_FAIL_ON_DC
       10 | ALIGN_FAULT
       11 | NO_IRS_INITIAL
       12 | EXCESS_MOTION_ERROR
       13 | ADR_IR_FAULT
       14 | EXTREME_LATITUDE
       15,16,17 | ALIGN_7_10_MINUTES
       16,17 | ALIGN_6_MINUTES
       15,17 | ALIGN_5_MINUTES
       17 | ALIGN_4_MINUTES
       15,16 | ALIGN_3_MINUTES
       16 | ALIGN_2_MINUTES
       15 | ALIGN_1_MINUTES
       18 | COMPUTED_LATITUDE_MISCOMPARE

- A32NX_ADIRS_USES_GPS_AS_PRIMARY
    - Deprecated, this is an FM function, not ADIRU
    - Bool
    - Whether or not the GPS is used as the primary means of navigation/position determination.

- A32NX_PUSH_TRUE_REF
    - Bool
    - True reference pushbutton status

## Radio Receivers

- A32NX_RADIO_RECEIVER_USAGE_ENABLED
    - Bool
    - Whether or not the calculated ILS signals shall be used

- A32NX_RADIO_RECEIVER_LOC_IS_VALID
    - Bool
    - Indicates if the localizer signal is valid

- A32NX_RADIO_RECEIVER_LOC_DISTANCE
    - Number in nautical miles
    - Indicates the distance from the localizer

- A32NX_RADIO_RECEIVER_LOC_DEVIATION
    - Number in degrees
    - If A32NX_RADIO_RECEIVER_USAGE_ENABLED == 0 it contains the deviation from the sim
    - If A32NX_RADIO_RECEIVER_USAGE_ENABLED == 1 it contains calculated LOC deviation

- A32NX_RADIO_RECEIVER_GS_IS_VALID
    - Bool
    - Indicates if the glide slope signal is valid

- A32NX_RADIO_RECEIVER_GS_DEVIATION
    - Number in degrees
    - Deviation from glide slope
    - If A32NX_RADIO_RECEIVER_USAGE_ENABLED == 0 it contains the deviation from the sim
    - If A32NX_RADIO_RECEIVER_USAGE_ENABLED == 1 it contains calculated LOC deviation

## Flight Management System

- A32NX_FM_ENABLE_APPROACH_PHASE
    - Bool
    - Indicates whether the FMS should switch to APPROACH phase.
    - **WARNING:** This is temporary and internal. Do not use.

- A32NX_FMGC_{side}_LDEV_REQUEST
    - Bool
    - Indicates whether the FMGC is requesting L/DEV to be displayed on the PFD
    - {side}
        - L
        - R

- A32NX_FMGC_L_RNP
    - Number (nautical miles)
    - The active Required Navigation Performance
    - {side}
        - L
        - R

- L:A32NX_FM{number}_ACC_ALT
    - ARINC429<number> (feet MSL)
    - The acceleration altitude
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- A32NX_FM{number}_DEST_LAT
    - Destination latitude
    - Arinc429<Angle>
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- A32NX_FM{number}_DEST_LONG
    - Destination longitude
    - Arinc429<Angle>
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- A32NX_FM{number}_DISCRETE_WORD_2
    - Arinc429<Discrete>
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 13  | Takeoff flap conf 0               |
      | 14  | Takeoff flap conf 1               |
      | 15  | Takeoff flap conf 2               |
      | 16  | Takeoff flap conf 3               |

- A32NX_FM{number}_DISCRETE_WORD_3
    - Arinc429<Discrete>
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 16  | V1/Vr/V2 disagree                 |
      | 17  | Takeoff speeds too low            |
      | 18  | Takeoff speeds not inserted       |

- L:A32NX_FM{number}_NAV_DISCRETE
    - Arinc429<Discrete>
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC (currently not written)
    - | Bit |     Description     |
      |:---:|:-------------------:|
      | 11  | VOR 1 manually tuned |
      | 12  | VOR 2 manually tuned |
      | 13  | ADF 1 manually tuned |
      | 14  | ADF 2 manually tuned |
      | 15  | MMR 1 manually tuned |
      | 16  | MMR 2 manually tuned |

- L:A32NX_FM{number}_EO_ACC_ALT
    - ARINC429<number> (feet MSL)
    - The engine out acceleration altitude
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- L:A32NX_FM{number}_LANDING_ELEVATION
    - ARINC429<number> (feet MSL)
    - The landing elevation at the active destination
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- L:A32NX_FM{number}_MISSED_ACC_ALT
    - ARINC429<number> (feet MSL)
    - The missed approach acceleration altitude
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- L:A32NX_FM{number}_MISSED_EO_ACC_ALT
    - ARINC429<number> (feet MSL)
    - The missed approach engine out acceleration altitude
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- L:A32NX_FM{number}_MISSED_THR_RED_ALT
    - ARINC429<number> (feet MSL)
    - The missed approach thrust reduction altitude
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- L:A32NX_FM{number}_THR_RED_ALT
    - ARINC429<number> (feet MSL)
    - The thrust reduction altitude
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- A32NX_FM{number}_TO_PITCH_TRIM
    - Takeoff pitch trim set by the pilot on the PERF TO MCDU page
    - Arinc429<Angle>
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- A32NX_FM{number}_DECISION_HEIGHT
    - ARINC429<number>
    - The decision height for an approach in feet, as entered on the PERF page.
    - Value | Meaning
       --- | ---
       0 or greater | The decision height in feet
       -1 | The pilot has not entered a decision height
       -2 | The special value "NO" has been explicitly entered as the decision deight
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- A32NX_FM{number}_MINIMUM_DESCENT_ALTITUDE
    - ARINC429<number>
    - The minimum descent altitude for a non-precision approach in feet, as entered on the PERF page.
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- A32NX_FM{number}_TRANS_ALT
    - Arinc429<number>
    - The transition altitude at the origin in feet
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- A32NX_FM{number}_TRANS_LVL
    - Arinc429<number>
    - The transition level the destination as a flight level
    - {number}
        - 1 - captain's side FMGC
        - 2 - f/o's side FMGC

- A32NX_FM_VNAV_TRIGGER_STEP_DELETED
    - Bool
    - Indicates whether to trigger a step deleted message on the MCDU

- `A32NX_FM{number}_BACKBEAM_SELECTED`
    - Bool
    - Indicates to the FG that a localiser back beam is tuned.

- A32NX_FG_PHI_LIMIT
    - Number in Degrees
    - Indicates the current bank limit requested by the FM
    - Always positive

- A32NX_FG_CROSS_TRACK_ERROR
    - Number in nm
    - Used for laternal guidance in mode NAV
    - Error from desired path, -ve to the right of track

- A32NX_FG_TRACK_ANGLE_ERROR
    - Number in degrees
    - Used for laternal guidance in mode NAV
    - Error from desired heading or track, -ve when clockwise of desired track

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
    - Internal to FM/FG communication, other avionics should use the FG bus var

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

- A32NX_THROTTLE_MAPPING_INCREMENT_NORMAL
    - Number
    - Indicates the increment being used for normal key events

- A32NX_THROTTLE_MAPPING_INCREMENT_SMALL
    - Number
    - Indicates the increment being used for small key events

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
  - Number (encoded)
  - Encoded engine imbalance values. Use the algorithm in the code `LVarEncoder::extract8Int8FromDouble` to decode
  - `fbw-common/src/wasm/cpp-msfs-framework/lib/lvar_encoder.hpp`
  - Parameters for encoding are:
    - 1 = Engine Number of the engine which is imbalanced
    - 2 = Engine EGT imbalance
    - 3 = Engine FF imbalance
    - 4 = Engine N2 imbalance
    - 5 = Engine Oil Quantity imbalance
    - 6 = Engine Oil Pressure imbalance
    - 7 = Engine Oil Idle Pressure imbalance
    - 8 = Engine Oil Temperature imbalance


- A32NX_ENGINE_N1:{index}
    - Number (% N1)
    - Custom engine {index} N1 to model realistic start-up & shutdown, although equal to Sim's N2 for other flight
      phases.

- A32NX_ENGINE_N2:{index}
    - Number (% N2)
    - Custom engine N2 {index} to model realistic start-up & shutdown, although equal to Sim's N2 for other flight
      phases.

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

- A32NX_FADEC_IGNITER_A_ACTIVE_ENG{index}
    - Boolean
    - State of igniter A on engine {index}

- A32NX_FADEC_IGNITER_B_ACTIVE_ENG{index}
    - Boolean
    - State of igniter B on engine {index}

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

- A32NX_ENGINE_OIL_TOTAL:{index}
    - Number (quarts)
    - Total engine {index} oil quantity in the oil system (tank + circuit)

- A32NX_ENGINE_OIL_QTY:{index}
    - Number (quarts)
    - Total engine {index} oil quantity in the oil tank

## Air Conditioning / Pressurisation / Ventilation

- A32NX_COND_ACSC_{number}_DISCRETE_WORD_1
    - Number 1 or 2
    - Discrete Data word 1 of the ACSC bus output (label 060)
    - Arinc429<Discrete>
    - | Bit |                      Description                     |
      |:---:|:----------------------------------------------------:|
      | 11  | Duct overheat F/D warning                            |
      | 12  | Duct overheat FWD warning                            |
      | 13  | Duct overheat AFT warning                            |
      | 14  | Not used                                             |
      | 15  | Not used                                             |
      | 16  | Not used                                             |
      | 17  | Spare                                                |
      | 18  | Trim air pressure high                               |
      | 19  | ACSC Lane 1 Active                                   |
      | 20  | TAPRV status - close                                 |
      | 21  | ACSC Lane 1 INOP                                     |
      | 22  | ACSC Lane 2 INOP                                     |
      | 23  | Hot air switch position on                           |
      | 24  | G + T fan off/fault                                  |
      | 25  | Recirc fan LH fault/OVHT                             |
      | 26  | Recirc fan RH fault/OVHT                             |
      | 27  | TAPRV disagree                                       |
      | 28  | Trim air system fault                                |
      | 29  | ACSC Installed                                       |

- A32NX_COND_ACSC_{number}_DISCRETE_WORD_2
    - Number 1 or 2
    - Discrete Data word 2 of the ACSC bus output (label 061)
    - Bits with * not yet implemented
    - Arinc429<Discrete>
    - | Bit |                      Description                     |
      |:---:|:----------------------------------------------------:|
      | 11  | Spare                                                |
      | 12  | *K1 half wing anti-ice on                            |
      | 13  | *K2 full wing anti-ice on                            |
      | 14  | *K3 nacelle anti-ice on                              |
      | 15  | *K4 air cond with two packs on                       |
      | 16  | *K5 air cond with one pack on                        |
      | 17  | *K6 air cond with two packs and one engine on        |
      | 18  | Trim valve F/D inop                                  |
      | 19  | Trim valve FWD inop                                  |
      | 20  | Trim valve AFT inop                                  |
      | 21  | Not used                                             |
      | 22  | Not used                                             |
      | 23  | *FCV status (Both pakcs off)                         |
      | 24  | *One pack operation                                  |
      | 25  | *FCV status (Both pakcs on)                          |
      | 26  | Spare                                                |
      | 27  | *Nacelle anti-ice eng 2 open                         |
      | 28  | *Nacelle anti-ice eng 1 open                         |
      | 29  | Spare                                                |

- A32NX_COND_{id}_TEMP
    - Degree Celsius
    - Temperature as measured in each of the cabin zones and cockpit
    - {id}
        - CKPT
        - FWD
        - AFT

- A32NX_COND_{id}_DUCT_TEMP
    - Degree Celsius
    - Temperature of trim air coming out of the ducts in the cabin and cockpit
    - {id}
        - CKPT
        - FWD
        - AFT

- A32NX_COND_PACK_FLOW_VALVE_{index}_IS_OPEN
    - Bool
    - True if the respective {1 or 2} pack flow valve is open

- A32NX_COND_PACK_FLOW_{index}
    - Percent
    - Percentage flow coming out of each pack {1 or 2} into the cabin (LO: 80%, NORM: 100%, HI: 120%)

- A32NX_COND_{id}_TRIM_AIR_VALVE_POSITION
    - Percentage
    - Percentage opening of each trim air valve (hot air)
    - {id}
        - CKPT
        - FWD
        - AFT

- A32NX_OVHD_COND_{id}_SELECTOR_KNOB
    - Percentage
    - Percent rotation of the overhead temperature selectors for each of the cabin zones
    - To transform the value into degree celsius use this formula: this * 0.04 + 18
    - {id}
        - CKPT
        - FWD
        - AFT

- A32NX_OVHD_COND_PACK_{index}_PB_IS_ON
    - Bool
    - True if pack {1 or 2} pushbutton is pressed in the on position (no white light)

- A32NX_OVHD_COND_PACK_{index}_PB_HAS_FAULT
    - Bool
    - True if pack {1 or 2} has a fault

- A32NX_OVHD_COND_HOT_AIR_PB_IS_ON
    - Bool
    - True if the hot air pushbutton is pressed in the on position (no white light)

- A32NX_OVHD_COND_HOT_AIR_PB_HAS_FAULT
    - Bool
    - True if the hot air trim system has a fault

- A32NX_PRESS_CPC_{number}_DISCRETE_WORD
    - Arinc429<Discrete>
    - Number 1 or 2
    - Discrete Data word of the Cabin Pressure Controller bus output (label 057)
    - Bits with * not yet implemented
    - | Bit |                      Description                     |
      |:---:|:----------------------------------------------------:|
      | 11  | System in control                                    |
      | 12  | System status - fail                                 |
      | 13  | Not used                                             |
      | 14  | Excessive cabin altitude - warn                      |
      | 15  | Low differential pressure - warn                     |
      | 16  | Preplanned desc inf - too quick *                    |
      | 17  | Landing field elevation manual                       |
      | 18  | Used ADIRS channel bit 1 *                           |
      | 19  | Used ADIRS channel bit 2 *                           |
      | 20  | FMS Enabled *                                        |
      | 21  | Flight mode bit 1 *                                  |
      | 22  | Flight mode bit 2 *                                  |
      | 23  | Flight mode bit 3 *                                  |
      | 24  | FMS select bit 1 *                                   |
      | 25  | FMS select bit 2 *                                   |
      | 26  | Not used                                             |
      | 27  | Not used                                             |
      | 28  | Spare                                                |
      | 29  | Spare                                                |

- A32NX_PRESS_MAN_EXCESSIVE_CABIN_ALTITUDE
    - Bool
    - Analog signal sent by the manual partition of CPC1. True when FWC condition for "EXCESS CAB ALT" is met.

- A32NX_PRESS_CPC_{number}_CABIN_ALTITUDE
    - Arinc429Word<Feet>
    - Number 1 or 2
    - The equivalent altitude from sea level of the interior of the cabin based on the internal pressure

- A32NX_PRESS_MAN_CABIN_ALTITUDE
    - Feet
    - As above, but analog system transmitted by the manual partition of CPC1

- A32NX_PRESS_CPC_{number}_CABIN_DELTA_PRESSURE
    - Arinc429Word<PSI>
    - Number 1 or 2
    - The difference in pressure between the cabin interior and the exterior air.
      Positive when cabin pressure is higher than external pressure.

- A32NX_PRESS_MAN_CABIN_DELTA_PRESSURE
    - PSI
    - As above, but analog system transmitted by the manual partition of CPC1

- A32NX_PRESS_CPC_{number}_CABIN_VS
    - Arinc429Word<FPM>
    - Number 1 or 2
    - Rate of pressurization or depressurization of the cabin expressed as altitude change

- A32NX_PRESS_MAN_CABIN_VS
    - FPM
    - As above, but analog system transmitted by the manual partition of CPC1

- A32NX_PRESS_CPC_{number}_OUTFLOW_VALVE_OPEN_PERCENTAGE
    - Arinc429Word<Percent>
    - Number 1 or 2
    - Percent open of the cabin pressure outflow valve

- A32NX_PRESS_MAN_OUTFLOW_VALVE_OPEN_PERCENTAGE
    - Percent
    - As above, but analog system transmitted by the manual partition of CPC1

- A32NX_PRESS_SAFETY_VALVE_OPEN_PERCENTAGE
    - Percent
    - Percent open of the cabin pressure safety valves

- A32NX_PRESS_CPC_{number}_LANDING_ELEVATION
    - Arinc429Word<Feet>
    - Number 1 or 2
    - Target landing elevation used by the pressurization system

- A32NX_PRESS_EXCESS_CAB_ALT
    - Bool
    - **Deprecated in A32NX**
    - True when FWC condition for "EXCESS CAB ALT" is met

- A32NX_PRESS_EXCESS_RESIDUAL_PR
    - Bool
    - True when FWC condition for "EXCES RESIDUAL PR" is met

- A32NX_PRESS_LOW_DIFF_PR
    - Bool
    - **Deprecated in A32NX**
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

- A32NX_OVHD_VENT_CAB_FANS_PB_IS_ON
    - Bool
    - True if CAB FANS pushbutton is in the on position (no white light)

## Pneumatic

- A32NX_ASU_TURNED_ON:
    - Turns the Air Starter Unit on or off
    - Bool

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

- A32NX_PNEU_ENG_{number}_STARTER_CONTAINER_PRESSURE:
    - Pressure behind the starter valve of the engine
    - PSI
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_STARTER_PRESSURIZED:
    - Indicates whether enough bleed air is supplied to the starter to start the engine
    - Bool
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_TRANSFER_TRANSDUCER_PRESSURE
    - Pressure measured at the transfer pressure transducer, -1 if no output
    - psi

- A32NX_PNEU_ENG_{number}_REGULATED_TRANSDUCER_PRESSURE
    - Pressure measured at the regulated pressure transducer, -1 if no output
    - psi

- A32NX_PNEU_ENG_{number}_DIFFERENTIAL_TRANSDUCER_PRESSURE
    - Pressure measured at the differential pressure transducer, -1 if no output
    - psi

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

- A32NX_PNEU_ENG_{number}_BLEED_TEMPERATURE_SENSOR_TEMPERATURE:
    - Temperature measured by the bleed temperature sensor at the precooler outlet, -100 if no output
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

- A32NX_PNEU_APU_BLEED_CONTAINER_PRESSURE:
    - Indicates the APU internal bleed pressure.
    - PSI absolute

- A32NX_PNEU_XBLEED_VALVE_FULLY_OPEN:
    - Indicates whether the cross bleed air valve is fully open
    - Bool

- A32NX_PNEU_XBLEED_VALVE_FULLY_CLOSED:
    - Indicates whether the cross bleed air valve is fully closed
    - Bool

- A32NX_PNEU_PACK_{number}_FLOW_VALVE_FLOW_RATE:
    - Indicates the flow rate through the pack flow valve
    - Kilogram per second
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

- A32NX_PNEU_ENG_{number}_LOW_TEMPERATURE:
    - Indicates whether the engine bleed air temperature is low
    - Bool
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_OVERHEAT:
    - Indicates whether an an engine bleed air overheat is detected
    - Bool
    - {number}
        - 1
        - 2

- A32NX_PNEU_ENG_{number}_OVERPRESSURE:
    - Indicates whether an engine bleed overpressure is detected
    - Bool
    - {number}
        - 1
        - 2

- A32NX_OVHD_PNEU_ENG_{number}_BLEED_PB_HAS_FAULT:
    - Indicates whether the fault light is on for the engine bleed push button
    - Bool

- A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON:
    - Indicates wheter the wing anti ice system is on
    - Bool

- A32NX_PNEU_WING_ANTI_ICE_HAS_FAULT:
    - Indicates wheter the wing anti ice system has a fault
    - Bool

- A32NX_PNEU_WING_ANTI_ICE_SYSTEM_SELECTED:
    - Indicates wheter the wing anti ice p/b is ON
    - Bool

- A32NX_PNEU_WING_ANTI_ICE_GROUND_TIMER:
    - Reports the duration in seconds of the wing anti ice ground relay (4DL)
    - Duration

- A32NX_PNEU_WING_ANTI_ICE_1_CONSUMER_PRESSURE:
    - Pressure in the left wing anti ice pipe
    - PSI

- A32NX_PNEU_WING_ANTI_ICE_2_CONSUMER_PRESSURE:
    - Pressure in the right wing anti ice pipe
    - PSI

- A32NX_PNEU_WING_ANTI_ICE_1_CONSUMER_TEMPERATURE:
    - Temperature in the left wing anti ice pipe
    - Degree celsius

- A32NX_PNEU_WING_ANTI_ICE_2_CONSUMER_TEMPERATURE:
    - Temperature in the right wing anti ice pipe
    - Degree celsius

- A32NX_PNEU_WING_ANTI_ICE_1_VALVE_CLOSED:
    - Indicates whether the left wing anti ice valve is closed
    - Bool

- A32NX_PNEU_WING_ANTI_ICE_2_VALVE_CLOSED:
    - Indicates whether the right wing anti ice valve is closed
    - Bool

- A32NX_PNEU_WING_ANTI_ICE_1_LOW_PRESSURE:
    - Low Pressure warning in the left wing anti ice valve
    - Bool

- A32NX_PNEU_WING_ANTI_ICE_2_LOW_PRESSURE:
    - Low Pressure warning in the right wing anti ice valve
    - Bool

- A32NX_PNEU_WING_ANTI_ICE_1_HIGH_PRESSURE:
    - High Pressure warning in the left wing anti ice valve
    - Bool

- A32NX_PNEU_WING_ANTI_ICE_2_HIGH_PRESSURE:
    - High Pressure warning in the right wing anti ice valve
    - Bool

- A32NX_BUTTON_OVHD_ANTI_ICE_ENG_1_POSITION:
    - Indicates whether the overhead ENG ANTI ICE button is illuminated for engine 1
    - Bool

- A32NX_BUTTON_OVHD_ANTI_ICE_ENG_2_POSITION:
    - Indicates whether the overhead ENG ANTI ICE button is illuminated for engine 2
    - Bool
## Autoflight (ATA 22)

### Flight Management and Guidance Computer (FMGC, Flight Guidance Section)

- A32NX_FMGC_{number}_HEALTHY
    - Indicates if this FMGC is healthy
    - Boolean

- A32NX_FMGC_{number}_ATHR_ENGAGED
    - Indicates if the A/THR of this FMGC is engaged
    - Boolean

- A32NX_FMGC_{number}_FD_ENGAGED
    - Indicates if the FD of this FMGC is engaged
    - Boolean

- A32NX_FMGC_{number}_AP_ENGAGED
    - Indicates if the AP of this FMGC is engaged
    - Boolean

- A32NX_FMGC_{number}_ILS_TUNE_INHIBIT
    - Indicates if the ILS TUNE INHIBT discrete output of the FMGC is GND.
    - This is the case in LAND mode arm/active, below 700ft RA.
    - Boolean

- A32NX_FMGC_{number}_PFD_SELECTED_SPEED
    - The PFD target speed (managed or selected)
    - Arinc429<Knots>

- A32NX_FMGC_{number}_PRESEL_MACH
    - The preselected Mach number for display on the FMA
    - Arinc429<Number>

- A32NX_FMGC_{number}_PRESEL_SPEED
    - The preselected speed for display on the FMA
    - Arinc429<Knots>

- A32NX_FMGC_{number}_RWY_HDG_MEMO
    - The FG memorized runway heading
    - Runway heading is memorized below 700ft during precision approach
    - Arinc429<Degrees>

- A32NX_FMGC_{number}_ROLL_FD_COMMAND
    - The Roll FD command
    - Arinc429<Degrees>

- A32NX_FMGC_{number}_PITCH_FD_COMMAND
    - The Pitch FD command
    - Arinc429<Degrees>

- A32NX_FMGC_{number}_YAW_FD_COMMAND
    - The Yaw FD command
    - Arinc429<Degrees>

- A32NX_FMGC_{number}_DISCRETE_WORD_5
    - Arinc429<Discrete>
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | Mach Selected                     |
      | 12  | VPATH/SPEED submode active        |
      | 13  | VPATH/THRUST submode active       |
      | 14  | V/S selected submode active       |
      | 15  | FPA selected submode active       |
      | 16  | Alt selected submode active       |
      | 19  | AUTO SPD control active           |
      | 20  | MANUAL SPD control active         |
      | 24  | Pitch FD bars flashing            |
      | 27  | SPD Window Display                |
      | 28  | Top of SPD Synchro                |
      | 29  | FMS Mach Selection                |

- A32NX_FMGC_{number}_DISCRETE_WORD_4
    - Arinc429<Discrete>
    - Bits marked with ? are guessed/unknown
      | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | AP Instinctive Disc               |
      | 12  | AP Engaged                        |
      | 13  | FD Engaged                        |
      | 14  | LAND TRK mode active              |
      | 16  | LAND 2 Capability                 |
      | 17  | LAND 3 FAIL PASSIVE Capability    |
      | 18  | LAND 3 FAIL OP Capability         |
      | 19  | AP Inop                           |
      | 20  | LAND 2 Inop                       |
      | 21  | LAND 3 FAIL PASSIVE Inop          |
      | 22  | LAND 3 FAIL OP Inop               |
      | 23  | LAND 2 Capacity                   |
      | 24  | LAND 3 FAIL PASSIVE Capacity      |
      | 25  | LAND 3 FAIL OP Capacity           |
      | 26  | RWY Heading memorized             |
      | 27  | ? FD Auto Disengage Command       |
      | 28  | AP/FD Mode reversion              |
      | 29  | V/S Target not held               |

- A32NX_FMGC_{number}_FM_ALTITUDE_CONSTRAINT
    - Arinc429<Feet>
    - Next applicable altitude constraint
    - NCD if no constraint is applicable

- A32NX_FMGC_{number}_ATS_DISCRETE_WORD
    - Arinc429<Discrete>
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 13  | A/THR Engaged                     |
      | 14  | A/THR Active                      |
      | 17  | A/THR Instinctive Disconnect      |
      | 18  | A/THR SPD MACH mode               |
      | 19  | FCU Mach Selection                |
      | 20  | RETARD Mode Active                |
      | 21  | THRUST N1 Mode Active             |
      | 22  | THRUST EPR Mode Active            |
      | 23  | A/THR ALPHA FLOOR                 |
      | 24  | A/THR Inop                        |
      | 25  | A/THR Limited                     |

- A32NX_FMGC_{number}_ATS_FMA_DISCRETE_WORD
    - Arinc429<Discrete>
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | TO/GA Display                     |
      | 12  | MCT Display                       |
      | 13  | FLX Display                       |
      | 14  | CLB Display                       |
      | 15  | THR Display                       |
      | 16  | IDLE Display                      |
      | 17  | A.FLOOR Display                   |
      | 18  | TO/GA LK Display                  |
      | 19  | SPEED Display                     |
      | 20  | MACH Display                      |
      | 21  | ASYM Display                      |
      | 22  | CLB Demand Display                |
      | 23  | MCT Demand Display                |

- A32NX_FMGC_{number}_DISCRETE_WORD_3
    - Arinc429<Discrete>
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | HDG Preset                        |
      | 12  | ALT ACQ Arm                       |
      | 13  | ALT ACQ Arm Possible              |
      | 14  | NAV Arm                           |
      | 16  | LOC Arm                           |
      | 17  | FG Approach Phase                 |
      | 18  | FMA LONGI Mode                    |
      | 19  | LOC Backbeam Selection            |
      | 20  | LAND Arm                          |
      | 21  | GS Capt Before LOC Capt           |
      | 22  | GLIDE Arm                         |
      | 23  | FINAL DES Arm                     |
      | 24  | CLB Arm                           |
      | 25  | DES Arm                           |
      | 26  | LONG MODE Reset                   |
      | 27  | LAT MODE Reset                    |
      | 28  | QFU Equal COM                     |
      | 29  | FMA Longi Box                     |

- A32NX_FMGC_{number}_DISCRETE_WORD_1
    - Arinc429<Discrete>
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | Climb Mode                        |
      | 12  | Descent Mode                      |
      | 13  | Immediate Mode                    |
      | 14  | Open Mode                         |
      | 15  | Pitch T/O Mode                    |
      | 16  | Pitch G/A Mode                    |
      | 17  | V/S Mode                          |
      | 18  | FPA Mode                          |
      | 19  | ALT Mode                          |
      | 20  | Track Mode                        |
      | 21  | Capture Mode                      |
      | 22  | G/S Mode                          |
      | 23  | FINAL DES Mode                    |
      | 24  | EXPED Mode                        |
      | 25  | FLARE Mode                        |
      | 26  | FMA Dash Display                  |
      | 27  | FMA SPEED/MACH Preset Display     |

- A32NX_FMGC_{number}_DISCRETE_WORD_2
    - Arinc429<Discrete>
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | Runway Mode                       |
      | 12  | NAV Mode                          |
      | 13  | LOC Capture Mode                  |
      | 14  | LOC Track Mode                    |
      | 15  | Roll G/A Mode                     |
      | 16  | HDG Mode                          |
      | 17  | TRK Mode                          |
      | 20  | Runway LOC Submode                |
      | 21  | H/PATH Submode                    |
      | 22  | HDG Submode                       |
      | 23  | Runway TRK Submode                |
      | 24  | VOR Submode                       |
      | 25  | ALIGN Submode                     |
      | 26  | ROLLOUT Submode                   |
      | 28  | Roll FD Bars Flashing             |

- A32NX_FMGC_{number}_DISCRETE_WORD_7
    - Arinc429<Discrete>
    - Bits marked with ? are guessed/unknown
      | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | AP/FD TCAS mode installed         |
      | 12  | TCAS mode armed                   |
      | 13  | TCAS mode active                  |
      | 14  | TCAS mode fault                   |
      | 15  | ?                                 |
      | 16  | ?                                 |
      | 17  | ?                                 |
      | 18  | TCAS Large box on FMA             |
      | 19  | ?                                 |
      | 20  | SOFT GA Inop                      |
      | 21  | ?                                 |
      | 22  | ?                                 |
      | 23  | ?                                 |
      | 24  | TCAS RA Inhibited message         |
      | 25  | TRK FPA Deselected message        |
      | 26  | ?                                 |
      | 27  | ? TCAS RA Corrective              |
      | 28  | TCAS RA Nose Up                   |
      | 29  | ? TCAS RA Nose Down               |

- A32NX_FMGC_{number}_SPEED_MARGIN_HIGH
    - Arinc429<Knots>
    - The higher speed margin in DES with managed speed, for display on the PFD

- A32NX_FMGC_{number}_SPEED_MARGIN_LOW
    - Arinc429<Knots>
    - The lower speed margin in DES with managed speed, for display on the PFD

- A32NX_STICK_LOCK_ACTIVE
    - Indicates if the stick lock is active (when AP engaged).
        Currently used only for sounds.
    - Boolean

- A32NX_AP_INSTINCTIVE_DISCONNECT
    - Indicates if the AP instinctive disconnect signal to the FMGC or FWC is high or low
    - Boolean

- A32NX_ATHR_INSTINCTIVE_DISCONNECT
    - Indicates if the A/THR instinctive disconnect signal to the FMGC or FWC is high or low
    - Boolean

### Flight Control Unit (FCU)

- A32NX_FCU_HEALTHY
    - If the FCU is healthy in one or more channels.
    - Boolean

#### FCU EFIS CP

- A32NX_FCU_EFIS_{side}_EFIS_MODE
    - EFIS Mode knob position on related side
    - {side} = L or R
    - Enum
      Mode      | Value
      ---       | ---
      ROSE ILS  | 0
      ROSE VOR  | 1
      ROSE NAV  | 2
      ARC       | 3
      PLAN      | 4

- A32NX_FCU_EFIS_{side}_EFIS_RANGE
    - EFIS Range knob position on related side
    - {side} = L or R
    - Enum
      Range | Value
      ---   | ---
      10    | 0
      20    | 1
      40    | 2
      80    | 3
      160   | 4
      320   | 5

- A32NX_FCU_EFIS_{side}_NAVAID_{number}_MODE
    - Navaid {number} switch position on related side
    - {side} = L or R
    - Enum
      Mode | Value
      ---   | ---
      NONE  | 0
      VOR   | 1
      ADF   | 2

- A32NX_FCU_EFIS_{side}_BARO_IS_INHG
    - Baro unit selector position on related side
    - {side} = L or R
    - Bool

- A32NX_FCU_EFIS_{side}_DISPLAY_BARO_VALUE_MODE
    - Baro value mode for display on related side
    - {side} = L or R
    - Number
      Mode | Value
      ---   | ---
      STD   | 0
      HPA   | 1
      INHG  | 2

- A32NX_FCU_EFIS_{side}_DISPLAY_BARO_VALUE
    - Baro setting for display on related side
    - {side} = L or R
    - Number

- A32NX_FCU_EFIS_{side}_DISPLAY_BARO_MODE
    - Baro mode for display on related side
    - {side} = L or R
    - Number
      Mode | Value
      ---   | ---
      STD   | 0
      QNH   | 1
      QFE   | 2

- A32NX_FCU_EFIS_{side}_{button}_LIGHT_ON
    - {button} Button light status on related side
    - {side} = L or R
    - {button} = FD, LS, CSTR, WPT, VORD, NDB, ARPT
    - Bool


#### FCU AFS CP

- A32NX_FCU_ALT_INCREMENT_1000
    - Position of the ALT Increment switch
    - Bool

- A32NX_FCU_{button}_LIGHT_ON
    - {button} Button light status
    - {button} = AP_1, AP_2, ATHR, LOC, EXPED, APPR, ARPT
    - Bool

- A32NX_FCU_AFS_DISPLAY_TRK_FPA_MODE
    - TRK/FPA mode active for AFS display
    - Bool

- A32NX_FCU_AFS_DISPLAY_MACH_MODE
    - Mach mode active for AFS display
    - Bool

- A32NX_FCU_AFS_DISPLAY_{name}_VALUE
    - Value of the {name} for display
    - {name} = SPD_MACH, HDG_TRK, ALT, VS_FPA
    - Number

- A32NX_FCU_AFS_DISPLAY_{name}_DASHES
    - Is {name} dashes for display
    - {name} = SPD_MACH, HDG_TRK, VS_FPA
    - Bool

- A32NX_FCU_AFS_DISPLAY_{name}_MANAGED
    - Is {name} managed dot active for display
    - {name} = SPD_MACH, HDG_TRK, LVL_CH
    - Bool

#### FCU Output Bus

- A32NX_FCU_SELECTED_HEADING
    - The FCU selected heading. NCD if dashes or TRK/FPA mode.
    - Arinc429<Degrees>

- A32NX_FCU_SELECTED_ALTITUDE
    - The FCU selected altitude.
    - Arinc429<Feet>

- A32NX_FCU_SELECTED_AIRSPEED
    - The FCU selected CAS. NCD if dashes.
    - Arinc429<Knots>

- A32NX_FCU_SELECTED_VERTICAL_SPEED
    - The FCU selected V/S. NCD if dashes or TRK/FPA mode.
    - Arinc429<fpm>

- A32NX_FCU_SELECTED_TRACK
    - The FCU selected track. NCD if dashes or HDG/VS mode.
    - Arinc429<Degrees>

- A32NX_FCU_SELECTED_FPA
    - The FCU selected FPA. NCD if dashes or HDG/VS mode.
    - Arinc429<Degrees>

- A32NX_FCU_ATS_DISCRETE_WORD
    - FCU Autothrust System discrete word. Retransmitted from FMGC that has priority.
    - Arinc429<Discrete>
    - See equivalent FMGC word for bits

- A32NX_FCU_ATS_FMA_DISCRETE_WORD
    - FCU Autothrust System FMA discrete word. Retransmitted from FMGC that has priority.
    - Arinc429<Discrete>
    - See equivalent FMGC word for bits

- A32NX_FCU_{side}_EIS_DISCRETE_WORD_1
    - FCU {side} EIS Discrete word 1.
    - {side} = LEFT, RIGHT
    - Arinc429<Discrete>
    -   | Bit |            Description            |
        |:---:|:---------------------------------:|
        | 11  | Baro is inHG                      |
        |12-24| Spare                             |
        | 25  | EFIS Range 10                     |
        | 26  | EFIS Range 20                     |
        | 27  | EFIS Range 40                     |
        | 28  | EFIS Range 80                     |
        | 29  | EFIS Range 160                    |
        |     | EFIS Range 320 if 25-29 false     |

- A32NX_FCU_{side}_EIS_DISCRETE_WORD_2
    - FCU {side} EIS Discrete word 2.
    - {side} = LEFT, RIGHT
    - Arinc429<Discrete>
    -   | Bit |            Description            |
        |:---:|:---------------------------------:|
        | 11  | EFIS mode PLAN                    |
        | 12  | EFIS mode ARC                     |
        | 13  | EFIS mode ROSE NAV                |
        | 14  | EFIS mode ROSE VOR                |
        | 15  | EFIS mode ROSE ILS                |
        | 16  | Spare                             |
        | 17  | EFIS Filter CSTR                  |
        | 18  | EFIS Filter WPT                   |
        | 19  | EFIS Filter VORD                  |
        | 20  | EFIS Filter NDB                   |
        | 21  | EFIS Filter ARPT                  |
        | 22  | LS Button On                      |
        | 23  | FD Button Off                     |
        | 24  | NAVAID 1 ADF                      |
        | 25  | NAVAID 2 ADF                      |
        | 26  | NAVAID 1 VOR                      |
        | 27  | NAVAID 2 VOR                      |
        | 28  | Baro on STD                       |
        | 29  | Baro on QNH                       |

- A32NX_FCU_{side}_EIS_BARO
    - FCU {side} EIS Baro correction in inHg. Remains at previous value if in STD, and
        is at the inHG value corresponding to the selected hPa value if in hPa
    - {side} = LEFT, RIGHT
    - Arinc429<inHg>

- A32NX_FCU_{side}_EIS_BARO_HPA
    - FCU {side} EIS Baro correction in hPa. Remains at previous value if in STD, and
        is at the hPa value corresponding to the selected inHG value if in inHG
    - {side} = LEFT, RIGHT
    - Arinc429<hPa>

- A32NX_FCU_DISCRETE_WORD_1
    - FCU Discrete word 1. All pull/push bits are MTRIG processed for 0.1s to enabled
        async processing in other devices (FGMC, FWC etc.).
        Value changed bits are MTRIG processed for 0.5s.
    - Arinc429<Discrete>
    -   | Bit |            Description            |
        |:---:|:---------------------------------:|
        | 11  | SPD/MACH Pushed                   |
        | 12  | SPD/MACH Pulled                   |
        | 13  | ALT Value changed                 |
        | 14  | VS/FPA Value changed              |
        | 15  | SPD/MACH Value changed            |
        | 16  | VS/FPA Pushed                     |
        | 17  | ALT Pushed                        |
        | 18  | ALT Pulled                        |
        | 19  | VS/FPA pulled                     |
        | 20  | Metric alt active                 |
        | 21  | SPD/MACH Switching button pushed  |
        | 22  | EXPED Pushed                      |
        | 23  | APPR Pushed                       |
        | 24  | HDG/VS Active                     |
        | 25  | TRK/FPA Active                    |
        |26-29| Spare                             |

- A32NX_FCU_DISCRETE_WORD_2
    - FCU Discrete word 2. All pull/push bits are MTRIG processed for 0.1s to enabled
        async processing in other devices (FGMC, FWC etc.).
        Value changed bits are MTRIG processed for 0.5s.
    - Arinc429<Discrete>
    -   | Bit |            Description            |
        |:---:|:---------------------------------:|
        | 11  | HDG/TRK Pushed                    |
        | 12  | HDG/TRK Pulled                    |
        | 13  | LOC Pushed                        |
        | 14  | HDG/TRK Value changed             |
        |15-19| Spare                             |
        | 20  | FMGC 1 selected (has priority)    |
        | 21  | FMGC 2 selected (has priority)    |
        |22-23| Spare                             |
        | 24  | FCU 1 Healthy                     |
        | 25  | FCU 2 Healthy                     |
        | 26  | FD 1 Button off                   |
        | 27  | FD 2 Button off                   |
        |28-29| Spare                             |

### Flight Augmentation Computer (FAC)

- A32NX_FAC_{number}_PUSHBUTTON_PRESSED
    - Boolean

- A32NX_FAC_{number}_HEALTHY
    - If the FAC {number} is healthy.
    - Boolean

- A32NX_FAC_{number}_SIDESLIP_TARGET
    - The sideslip target in case of engine out.
    - Arinc429<Degrees>

- A32NX_FAC_{number}_DISCRETE_WORD_2
    - Arinc429<Discrete>
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | Yaw Damper Own Engaged            |
      | 12  | Yaw Damper Opp Engaged            |
      | 13  | Rudder Trim Own Engaged           |
      | 14  | Rudder Trim Opp Engaged           |
      | 15  | Rudder Travel Lim Own Engaged     |
      | 16  | Rudder Travel Lim Opp Engaged     |

- A32NX_FAC_{number}_ESTIMATED_SIDESLIP
    - The current Sideslip, estimated by the FAC.
    - Arinc429<Degree>

- A32NX_FAC_{number}_V_ALPHA_LIM
    - The V_ls.
    - Arinc429<Knots>

- A32NX_FAC_{number}_V_LS
    - The 1g stall speed Vs1g.
    - Arinc429<Knots>

- A32NX_FAC_{number}_V_STALL_1G
    - The 1g stall speed Vs1g.
    - Arinc429<Knots>

- A32NX_FAC_{number}_V_ALPHA_PROT
    - The V_alpha_prot.
    - Arinc429<Knots>

- A32NX_FAC_{number}_V_STALL_WARN
    - The V_sw.
    - Arinc429<Knots>

- A32NX_FAC_{number}_SPEED_TREND
    - The V_c trend.
    - Arinc429<Knots>

- A32NX_FAC_{number}_V_3
    - The V_3 / F-Speed.
    - Arinc429<Knots>

- A32NX_FAC_{number}_V_4
    - The V_4 / S-Speed.
    - Arinc429<Knots>

- A32NX_FAC_{number}_V_MAN
    - The V_man / GD-Speed.
    - Arinc429<Knots>

- A32NX_FAC_{number}_V_MAX
    - The V_max.
    - Arinc429<Knots>

- A32NX_FAC_{number}_V_FE_NEXT
    - The V_fe_next.
    - Arinc429<Knots>

- A32NX_FAC_{number}_DISCRETE_WORD_5
    - Arinc429<Discrete>
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 16  | LGCIU Own Valid                   |
      | 17  | All LGCIU Lost                    |
      | 18  | Left Main Gear Pressed            |
      | 19  | Right Main Gear Pressed           |
      | 20  | Main Gear Out                     |
      | 29  | Alpha Floor Condition             |

## Flaps / Slats (ATA 27)

- A32NX_SFCC_SLAT_FLAP_SYSTEM_STATUS_WORD
    - Slat/Flap system status discrete word of the SFCC bus output
    - Arinc429<Discrete>
    - Note that multiple SFCC are not yet implemented, thus no {number} in the name.
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | Slat Fault                        |
      | 12  | Flap Fault                        |
      | 13  | Slat Jam                          |
      | 14  | Flap Jam                          |
      | 15  | Slat WTB engaged                  |
      | 16  | Flap WTB engaged                  |
      | 17  | Lever in Config 0                 |
      | 18  | Lever in Config 1                 |
      | 19  | Lever in Config 2                 |
      | 20  | Lever in Config 3                 |
      | 21  | Lever in Config FULL              |
      | 22  | Slat Relief Engaged               |
      | 23  | Flap Attachement Failure          |
      | 24  | Slat Alpha lock Engaged           |
      | 25  | Slat Baulk Engaged                |
      | 26  | Flap Auto-retract Engaged         |
      | 27  | CSU out of detent longer than 10s |
      | 28  | Slat Data Valid                   |
      | 29  | Flap Data Valid                   |

- A32NX_SFCC_SLAT_FLAP_ACTUAL_POSITION_WORD
    - Slat/Flap actual position discrete word of the SFCC bus output
    - Arinc429<Discrete>
    - Note that multiple SFCC are not yet implemented, thus no {number} in the name.
    - | Bit |                Description               |
      |:---:|:----------------------------------------:|
      | 11  | Slat Data Valid                          |
      | 12  | Slats Retracted 0° (6.2° > FPPU > -5°)   |
      | 13  | Slats >= 17° (337° > FPPU > 210.4°)      |
      | 14  | Slats >= 26° (337° > FPPU > 321.8)       |
      | 15  | Slats Extended 27° (337° > FPPU > 327.4) |
      | 16  | Slat WTB Engaged                         |
      | 17  | Slat Fault                               |
      | 18  | Flap Data Valid                          |
      | 19  | Flaps Retracted 0° (2.5° > FPPU > -5°)   |
      | 20  | Flaps >= 14° (254° > FPPU > 140.7)       |
      | 21  | Flaps >= 19° (254° > FPPU > 163.7°)      |
      | 22  | Flaps >= 39° (254° > FPPU > 247.8°)      |
      | 23  | Flaps Extended 40° (254° > FPPU > 250°)  |
      | 24  | Flap WTB engaged                         |
      | 25  | Flap Fault                               |
      | 26  | Spoiler Lift Demand                      |
      | 27  | Spoiler Limit Demand                     |
      | 28  | Slat System Jam                          |
      | 29  | Flap System Jam                          |

- A32NX_SFCC_SLAT_ACTUAL_POSITION_WORD
    - Slat actual position word of the SFCC bus output
    - Arinc429<Degrees>
    - Note that multiple SFCC are not yet implemented, thus no {number} in the name.
    - The Slat FPPU angle ranges from 0° to 360°

- A32NX_SFCC_FLAP_ACTUAL_POSITION_WORD
    - Flap actual position word of the SFCC bus output
    - Arinc429<Degrees>
    - Note that multiple SFCC are not yet implemented, thus no {number} in the name.
    - The Flap FPPU angle ranges from 0° to 360°

## Flight Controls (ATA 27)

- A32NX_FLIGHT_CONTROLS_TRACKING_MODE
    - Bool
    - Indicates if tracking mode is active: flight controls are coming from external source (ie: YourControls)

- A32NX_LOGGING_FLIGHT_CONTROLS_ENABLED
    - Bool
    - Indicates if logging of flight control events is enabled

- A32NX_FCDC_{number}_DISCRETE_WORD_1
    - Arinc429<Discrete>
    - | Bit |                Description               |
      |:---:|:----------------------------------------:|
      | 11  | Pitch Normal Law Active                  |
      | 12  | Pitch Alternate Law 1 Active             |
      | 13  | Pitch Alternate Law 2 Active             |
      | 14  |                                          |
      | 15  | Pitch Direct Law Active                  |
      | 16  | Roll Normal Law Active                   |
      | 17  | Roll Direct Law Active                   |
      | 18  |                                          |
      | 19  | ELAC 1 Pitch Fault                       |
      | 20  | ELAC 1 Roll Fault                        |
      | 21  | ELAC 2 Pitch Fault                       |
      | 22  | ELAC 2 Roll Fault                        |
      | 23  | ELAC 1 Fault                             |
      | 24  | ELAC 2 Fault                             |
      | 25  | SEC 1 Fault                              |
      | 26  | SEC 2 Fault                              |
      | 27  |                                          |
      | 28  | FCDC Opposite Fault                      |
      | 29  | SEC 3 Fault                              |

- A32NX_FCDC_{number}_DISCRETE_WORD_2
    - Arinc429<Discrete>
    - | Bit |                Description               |
      |:---:|:----------------------------------------:|
      | 11  | Left Aileron Blue Fault                  |
      | 12  | Left Aileron Green Fault                 |
      | 13  | Right Aileron Blue Fault                 |
      | 14  | Right Aileron Green Fault                |
      | 15  | Left Elevator Blue Fault                 |
      | 16  | Left Elevator Green Fault                |
      | 17  | Right Elevator Blue Fault                |
      | 18  | Right Elevator Yellow Fault              |
      | 19  | F/O Priority Locked                      |
      | 20  | Capt Priority Locked                     |
      | 21  |                                          |
      | 22  |                                          |
      | 23  |                                          |
      | 24  |                                          |
      | 25  |                                          |
      | 26  |                                          |
      | 27  |                                          |
      | 28  | F/O Sidestick Disabled (Priority)        |
      | 29  | Capt Sidestick Disabled (Priority)       |

- A32NX_FCDC_{number}_DISCRETE_WORD_3
    - Arinc429<Discrete>
    - | Bit |                Description               |
      |:---:|:----------------------------------------:|
      | 11  | Left Aileron Blue Avail                  |
      | 12  | Left Aileron Green Avail                 |
      | 13  | Right Aileron Blue Avail                 |
      | 14  | Right Aileron Green Avail                |
      | 15  | Left Elevator Blue Avail                 |
      | 16  | Left Elevator Green Avail                |
      | 17  | Right Elevator Blue Avail                |
      | 18  | Right Elevator Yellow Avail              |
      | 19  | ELAC 1 Pushbutton Off                    |
      | 20  | ELAC 2 Pushbutton Off                    |
      | 21  | Spoiler 1 Avail                          |
      | 22  | Spoiler 2 Avail                          |
      | 23  | Spoiler 3 Avail                          |
      | 24  | Spoiler 4 Avail                          |
      | 25  | Spoiler 5 Avail                          |
      | 26  |                                          |
      | 27  | SEC 1 Pushbutton Off                     |
      | 28  | SEC 2 Pushbutton Off                     |
      | 29  | SEC 3 Pushbutton Off                     |

- A32NX_FCDC_{number}_DISCRETE_WORD_4
    - Arinc429<Discrete>
    - | Bit |                Description               |
      |:---:|:----------------------------------------:|
      | 11  | Left Spoiler 1 Out                       |
      | 12  | Right Spoiler 1 Out                      |
      | 13  | Left Spoiler 2 Out                       |
      | 14  | Right Spoiler 2 Out                      |
      | 15  | Left Spoiler 3 Out                       |
      | 16  | Right Spoiler 3 Out                      |
      | 17  | Left Spoiler 4 Out                       |
      | 18  | Right Spoiler 4 Out                      |
      | 19  | Left Spoiler 5 Out                       |
      | 20  | Right Spoiler 5 Out                      |
      | 21  | Spoiler 1 Pos Valid                      |
      | 22  | Spoiler 2 Pos Valid                      |
      | 23  | Spoiler 3 Pos Valid                      |
      | 24  | Spoiler 4 Pos Valid                      |
      | 25  | Spoiler 5 Pos Valid                      |
      | 26  | Ground Spoiler Out                       |
      | 27  | Ground Spoiler Armed                     |
      | 28  | Speed Brake Command                      |
      | 29  | Aileron Droop Active                     |

- A32NX_FCDC_{number}_DISCRETE_WORD_5
    - Arinc429<Discrete>
    - | Bit |                Description               |
      |:---:|:----------------------------------------:|
      | 11  | SEC 1 Spd Brk Lever Fault                |
      | 12  | SEC 2 Spd Brk Lever Fault                |
      | 13  | SEC 3 Spd Brk Lever Fault                |
      | 14  | SEC 1 Gnd Splr Fault                     |
      | 15  | SEC 2 Gnd Splr Fault                     |
      | 16  | SEC 3 Gnd Splr Fault                     |
      | 17  |                                          |
      | 18  |                                          |
      | 19  |                                          |
      | 20  |                                          |
      | 21  | Spoiler 1 Fault                          |
      | 22  | Spoiler 2 Fault                          |
      | 23  | Spoiler 3 Fault                          |
      | 24  | Spoiler 4 Fault                          |
      | 25  | Spoiler 5 Fault                          |
      | 26  | Spd Brk Lever Disagree                   |
      | 27  | Spd Brk Do Not Use                       |
      | 28  |                                          |
      | 29  |                                          |

- A32NX_FCDC_{number}_CAPT_ROLL_COMMAND
    - Arinc429<Degree>

- A32NX_FCDC_{number}_FO_ROLL_COMMAND
    - Arinc429<Degree>

- A32NX_FCDC_{number}_CAPT_PITCH_COMMAND
    - Arinc429<Degree>

- A32NX_FCDC_{number}_FO_PITCH_COMMAND
    - Arinc429<Degree>

- A32NX_FCDC_{number}_RUDDER_PEDAL_POS
    - Arinc429<Degree>

- A32NX_FCDC_{number}_AILERON_LEFT_POS
    - Arinc429<Degree>

- A32NX_FCDC_{number}_ELEVATOR_LEFT_POS
    - Arinc429<Degree>

- A32NX_FCDC_{number}_AILERON_RIGHT_POS
    - Arinc429<Degree>

- A32NX_FCDC_{number}_ELEVATOR_RIGHT_POS
    - Arinc429<Degree>

- A32NX_FCDC_{number}_ELEVATOR_TRIM_POS
    - Arinc429<Degree>

- A32NX_FCDC_{number}_SPOILER_LEFT_{spoiler}_POS
    - Arinc429<Degree>
    - {spoiler}
      - Number of the spoiler, 1 to 5

- A32NX_FCDC_{number}_SPOILER_RIGHT_{spoiler}_POS
    - Arinc429<Degree>
    - {spoiler}
      - Number of the spoiler, 1 to 5

- A32NX_FCDC_{number}_PRIORITY_LIGHT_{side}_{color}_ON
    - Boolean
    - Indicates if the spcified priority light should be illuminated
    - {side}
      - CAPT
      - FO
    - {color}
      - GREEN
      - RED

- A32NX_ELAC_{number}_PUSHBUTTON_PRESSED
    - Boolean

- A32NX_ELAC_{number}_DIGITAL_OP_VALIDATED
    - If the ELAC {number} is healthy.
    - Boolean

- A32NX_SEC_{number}_PUSHBUTTON_PRESSED
    - Boolean

- A32NX_SEC_{number}_FAULT_LIGHT_ON
    - If the SEC {number} fault light should be illuminated.
    - Boolean

- A32NX_SEC_{number}_GROUND_SPOILER_OUT
    - If the SEC {number} indicates that it's ground spoilers are deployed.
    - Boolean

- A32NX_{side}_{surface}_{system}_SERVO_SOLENOID_ENERGIZED
    - Boolean
    - If the servo mode solenoid of the specified servo should be energized.
    - {side}
        - LEFT
        - RIGHT
    - {surface}
        - ELEV
        - AIL
    - {system}
        - GREEN
        - BLUE
        - YELLOW

- A32NX_{side}_SPOILER_{number}_COMMANDED_POSITION
    - Number
    - The commanded position of the specified servo, in degrees.
    - {side}
        - LEFT
        - RIGHT
    - {number}
        - 1 to 5

- A32NX_{side}_{surface}_{system}_COMMANDED_POSITION
    - Number
    - The commanded position of the specified servo, in degrees.
    - {side}
        - LEFT
        - RIGHT
    - {surface}
        - ELEV
        - AIL
    - {system}
        - GREEN
        - BLUE
        - YELLOW

- A32NX_YAW_DAMPER_{system}_SERVO_SOLENOID_ENERGIZED
    - Boolean
    - If the servo mode solenoid of the specified servo should be energized.
    - {system}
        - GREEN
        - YELLOW

- A32NX_YAW_DAMPER_{system}_COMMANDED_POSITION
    - Number
    - The commanded position of the specified servo, in degrees.
    - {system}
        - GREEN
        - YELLOW

- A32NX_RUDDER_TRIM_{number}_ACTIVE_MODE_COMMANDED
    - Boolean
    - Trim electric motor {number} is commanded active
    - {number}
        - 1
        - 2

- A32NX_RUDDER_TRIM_{number}_COMMANDED_POSITION
    - Degree
    - Trim electric motor {number} position demand in trim surface deflection angle
    - {number}
        - 1
        - 2

- A32NX_HYD_RUDDER_TRIM_FEEDBACK_ANGLE
    - Degree
    - Rudder trim unit position feedback

- A32NX_RUDDER_TRAVEL_LIM_{number}_ACTIVE_MODE_COMMANDED
    - Boolean
    - RTL electric motor {number} is commanded active
    - {number}
        - 1
        - 2

- A32NX_RUDDER_TRAVEL_LIM_{number}_COMMANDED_POSITION
    - Degree
    - RTL electric motor {number} position demand in trim surface deflection angle
    - {number}
        - 1
        - 2

- A32NX_HYD_RUDDER_LIMITER_FEEDBACK_ANGLE
    - Degree
    - Rudder travel limiter unit position feedback

- A32NX_THS_{number}_ACTIVE_MODE_COMMANDED
    - Boolean
    - Trim electric motor {number} is commanded active
    - {number}
        - 1
        - 2
        - 3

- A32NX_THS_{number}_COMMANDED_POSITION
    - Degree
    - Trim electric motor {number} position demand in trim surface deflection angle

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

- A32NX_HYD_AILERON_LEFT_DEFLECTION
    - Number
    - Provides the final left aileron physical position
      Value | Meaning
      --- | ---
      -1.0 | full up
      0.0 | neutral
      1.0 | full down

- A32NX_HYD_AILERON_RIGHT_DEFLECTION
    - Number
    - Provides the final right aileron physical position
      Value | Meaning
      --- | ---
      -1.0 | full down
      0.0 | neutral
      1.0 | full up

- A32NX_HYD_THS_TRIM_MANUAL_OVERRIDE
    - Boolean
    - Feedback signal from the trim actuator system. True if pilot is moving or holding trim wheel

- A32NX_HYD_TRIM_WHEEL_PERCENT
    - Percent
    - Trim wheel position in percent

## Landing Gear (ATA 32)

- A32NX_LGCIU_{number}_DISCRETE_WORD_1
    - Discrete Data word 1 of the LGCIU bus output
    - Arinc429<Discrete>
    - {number}
        - 1
        - 2
    - | Bit |                                  Description                                 |
      |:---:|:----------------------------------------------------------------------------:|
      | 11  | LH gear not locked up and not selected down                                  |
      | 12  | RH gear not locked up and not selected down                                  |
      | 13  | Nose gear not locked up and not selected down                                |
      | 14  | LH gear not locked down and selected down                                    |
      | 15  | RH gear not locked down and selected down                                    |
      | 16  | Nose gear not locked down and selected down                                  |
      | 17  | LH gear door not uplocked                                                    |
      | 18  | RH gear door not uplocked                                                    |
      | 19  | Nose gear door not uplocked                                                  |
      | 20  | LH gear uplock locked and gear locked down                                   |
      | 21  | RH gear uplock locked and gear locked down                                   |
      | 22  | Nose gear uplock locked and gear locked down                                 |
      | 23  | LH gear downlocked                                                           |
      | 24  | RH gear downlocked                                                           |
      | 25  | Nose gear downlocked                                                         |
      | 26  | LH gear shock absorber not extended (Treat GND PWR connected as on ground)   |
      | 27  | RH gear shock absorber not extended (Treat GND PWR connected as on ground)   |
      | 28  | Nose gear shock absorber not extended (Treat GND PWR connected as on ground) |
      | 29  | Gear selected down (Lever Position)                                          |

- A32NX_LGCIU_{number}_DISCRETE_WORD_2
    - Discrete Data word 2 of the LGCIU bus output
    - Arinc429<Discrete>
    - {number}
        - 1
        - 2
    - | Bit |                                     Description                                     |
      |:---:|:-----------------------------------------------------------------------------------:|
      | 11  | LH & RH gear shock absorber compressed (Don't treat GND PWR connected as on ground) |
      | 12  | Nose gear shock absorber compressed (Don't treat GND PWR connected as on ground)    |
      | 13  | LH gear shock absorber compressed (Don't treat GND PWR connected as on ground)      |
      | 14  | RH gear shock absorber compressed (Don't treat GND PWR connected as on ground)      |
      | 15  | LH & RH gear downlocked                                                             |


- A32NX_LGCIU_{number}_DISCRETE_WORD_3
    - Discrete Data word 3 of the LGCIU bus output
    - Arinc429<Discrete>
    - {number}
        - 1
        - 2
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | LH gear not locked up             |
      | 12  | RH gear not locked up             |
      | 13  | Nose gear not locked up           |
      | 14  | Gear selected up (Lever Position) |
      | 25  | LH gear door fully open           |
      | 26  | RH gear door fully open           |
      | 27  | LH Nose gear door fully open      |
      | 28  | RH Nose gear door fully open      |

- A32NX_LGCIU_{number}_{gear}_GEAR_COMPRESSED
    - Indicates if the shock absorber is compressed (not fully extended)
    - Bool
    - {number}
        - 1
        - 2
    - {gear}
        - NOSE
        - LEFT
        - RIGHT

- A32NX_LGCIU_{number}_{gear}_GEAR_DOWNLOCKED
    - True if the gear is locked down.
    - Boolean
    - {number}
        - 1
        - 2
    - {gear}
        - NOSE
        - LEFT
        - RIGHT

- A32NX_LGCIU_{number}_{gear}_GEAR_UNLOCKED
    - True is the gear is not in the same state as the gear lever
    - Boolean
    - {number}
        - 1
        - 2
    - {gear}
        - NOSE
        - LEFT
        - RIGHT

- A32NX_GEAR_DOOR_{gear}_POSITION
    - Indicates the gear door position. 1 is fully opened. 0 fully closed and locked.
    - Percent over 100
    - {gear}
        - CENTER
        - CENTER_SMALL
        - LEFT
        - RIGHT

- A32NX_GEAR_{gear}_POSITION
    - Indicates the gear position. 1 is fully opened. 0 fully closed and locked.
    - Percent over 100
    - {gear}
        - CENTER
        - LEFT
        - RIGHT

- A32NX_GRAVITYGEAR_ROTATE_PCT
    - Indicates the position of the gear emergency extension crank handle from 0 to 300 (3 turns)
    - Percent

- A32NX_GEAR_LEVER_POSITION_REQUEST
    - Indicates that the pilot tries to move the gear lever (1=down)
    - Boolean

- A32NX_GEAR_HANDLE_POSITION
    - Indicates the actual position of the gear handle
    - Percent over 100

- A32NX_GEAR_HANDLE_HITS_LOCK_SOUND
    - Indicates that gear lever just hit the baulk lock mechanism
    - Boolean

## ATC (ATA 34)

- A32NX_TRANSPONDER_MODE
    - The transponder mode selector switch position
    - Enum
      Mode | Value
      --- | ---
      STBY | 0
      AUTO | 1
      ON | 2

- A32NX_TRANSPONDER_SYSTEM
    - The transponder system selector switch position
    - Enum
      System | Value
      --- | ---
      Transponder 1 | 0
      Transponder 2 | 1

- A32NX_SWITCH_ATC_ALT
    - The transponder altitude reporting switch position
    - Bool

- A32NX_SWITCH_TCAS_Position
    - Enum
    - Read-Only
    - Selected TCAS Mode
      Description | Value
      --- | ---
      STBY | 0
      TA | 1
      TA/RA | 2

- A32NX_SWITCH_TCAS_Traffic_Position
    - Enum
    - Read-Only
    - Selected TCAS Display Mode
      Description | Value
      --- | ---
      THREAT | 0
      ALL | 1
      ABV | 2
      BELOW | 3

- A32NX_TCAS_MODE
    - Enum
    - Read-Only
    - Whether TCAS has been set to standby, TA Only or TA/RA Mode (see ATC panel)
      Description | Value
      --- | ---
      STBY | 0
      TA | 1
      TA/RA | 2

- A32NX_TCAS_SENSITIVITY
    - Number
    - Read-Only
    - Current sensitivity level

- A32NX_TCAS_STATE
    - Enum
    - Read-Only
    - Currently active traffic/resolution advisory state
      Description | Value
      --- | ---
      NONE | 0
      TA | 1
      RA | 2

- A32NX_TCAS_RA_CORRECTIVE
    - boolean
    - Read-Only
    - Active RA is corrective?

- A32NX_TCAS_VSPEED_RED:{number}
    - Feet per minute
    - Read-Only
    - Lower and upper red vertical speed range of current active RA
    - {number}
        - 0
        - 1

- A32NX_TCAS_VSPEED_GREEN:{number}
    - Feet per minute
    - Read-Only
    - Lower and upper green vertical speed range of current active RA
    - {number}
        - 0
        - 1

- A32NX_TCAS_RA_TYPE
    - Enum
    - Read-only
    - The type of currently active RA
      Description | Value
        --- | ---
        None of the following | 0
        Crossing | 1
        Reversal | 2
        Increase | 3
        Maintain | 4

- A32NX_TCAS_RA_RATE_TO_MAINTAIN
    - Feet per minute
    - Read-only
    - The rate to maintain (green sector) of the currently active RA. 0 if up/down advisory status is neither Climb nor Descend or no RA is present

- A32NX_TCAS_RA_UP_ADVISORY_STATUS
    - Enum
    - Read-only
    - The up advisory status of the currently active RA
      Description | Value
        --- | ---
        No Up Advisory       | 0
        Climb                | 1
        Don't Descend        | 2
        Don't Descend > 500  | 3
        Don't Descend > 1000 | 4
        Don't Descend > 2000 | 5

- A32NX_TCAS_RA_DOWN_ADVISORY_STATUS
    - Enum
    - Read-only
    - The down advisory status of the currently active RA
      Description | Value
        --- | ---
        No Down Advisory   | 0
        Descend            | 1
        Don't Climb        | 2
        Don't Climb > 500  | 3
        Don't Climb > 1000 | 4
        Don't Climb > 2000 | 5


## Radio Altimeter (ATA 34)

- A32NX_RA_{number}_RADIO_ALTITUDE
    - `Arinc429Word<Feet>`
    - The height over ground as measured by the corresponding radio altimeter towards the aft of the aircraft
    - {number}
        - 1
        - 2

## GPWS / TAWS (ATA 34)

- A32NX_EGPWS_ALERT_{1 | 2}_DISCRETE_WORD_1
    - Data word for GPWS alerts. Used for displaying alerts on the PFD (on the A380) and triggering aural warnings
    - Arinc429<Discrete>
    - | Bit |       Description      |
      |:---:|:----------------------:|
      | 11  | SINKRATE               |
      | 12  | PULL UP                |
      | 13  | TERRAIN                |
      | 14  | DON'T SINK             |
      | 15  | TOO LOW GEAR           |
      | 16  | TOO LOW FLAPS          |
      | 17  | TOO LOW TERRAIN        |
      | 18  | GLIDESLOPE             |
      | 20  | TERRAIN PULL UP        |
      | 22  | TERRAIN AHEAD PULL UP  |
      | 27  | TERRAIN AHEAD          |

- A32NX_EGPWS_ALERT_{1 | 2}_DISCRETE_WORD_2
    - Data word for GPWS alerts. Used for displaying alerts on the PFD (on the A380) or on the GPWS visual indicators on the A320
    - Arinc429<Discrete>
    - | Bit |          Description         |
      |:---:|:----------------------------:|
      | 11  | G/S CANCEL                   |
      | 12  | GPWS ALERT                   |
      | 13  | GPWS WARNING                 |
      | 14  | GPWS INOP                    |
      | 15  | W/S WARNING                  |
      | 16  | AUDIO ON                     |
      | 22  | TERRAIN AWARENESS WARNING    |
      | 23  | TERRAIN AWARENESS CAUTION    |
      | 24  | TERRAIN AWARENESS INOP       |
      | 25  | EXTERNAL FAULT               |
      | 26  | TERRAIN AWARENESS NOT AVAIL. |

- A32NX_GPWS_TERR_OFF
    - Boolean
    - Indicates whether the GPWS TERR pushbutton is OFF

- A32NX_GPWS_SYS_OFF
    - Boolean
    - Indicates whether the GPWS SYS pushbutton is OFF

- A32NX_GPWS_GS_OFF
    - Boolean
    - Indicates whether the GPWS G/S MODE pushbutton is OFF

- A32NX_GPWS_FLAP_OFF
    - Boolean
    - Indicates whether the GPWS FLAP MODE pushbutton is OFF

- A32NX_GPWS_FLAPS3
    - Boolean
    - Indicates whether the GPWS LDG FLAP 3 pushbutton is ON

- A32NX_GPWS_GROUND_STATE
    - Boolean
    - Indicates whether the GPWS is in ground vs airborne mode

- A32NX_GPWS_APPROACH_STATE
    - Boolean
    - Indicates whether the GPWS is in Approach vs Takeoff mode

## ROW / ROP / OANS (ATA 34)

- A32NX_ROW_ROP_WORD_1
    - Data word for ROW and ROP functions. Used for displaying alerts on the PFD.
    - Arinc429<Discrete>
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | ROW/ROP operative                 |
      | 12  | ROP: Active with autobrake        |
      | 13  | ROP: Active with manual braking   |
      | 14  | ROW Wet: Runway too short         |
      | 15  | ROW Dry: Runway too short         |

- A32NX_OANS_WORD_1
    - Data word for OANS functions. Used for displaying alerts on the PFD.
    - Arinc429<Discrete>
    - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | OANS: Runway ahead                |


## Electronic Flight Bag (ATA 46)

- A32NX_PUSHBACK_SYSTEM_ENABLED
    - Boolean
    - Read/Write
    - Whether the pushback system is enabled
    - Further conditions are "Pushback Tug Attached" and "Aircraft On Ground" otherwise the system
      has no impact on the aircraft

- A32NX_PUSHBACK_SPD_FACTOR
    - Number
    - Read/Write
    - Determines the speed of the pushback tug from -100% to 100%
    - {number}
        - -1.0
        - 1.0

- A32NX_PUSHBACK_HDG_FACTOR
    - Number
    - Read/Write
    - Determines the heading of the pushback tug from max left (-1.0) to right (1.0)
    - {number}
        - -1.0
        - 1.0

## Non-Systems Related

- `L:FBW_PILOT_SEAT`
  - Enum
  - Which seat the user/pilot occupies in the flight deck.
  - | Value | Description |
    |-------|-------------|
    | 0     | Left Seat   |
    | 1     | Right Seat  |

- `L:A32NX_EXT_PWR_AVAIL:{number}`
  - Bool
  - If ground power is avail or not
  - {number}
        - 1

# Deprecated

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
    - Flags
    - Provides a bitmask of the selected EFIS option/overlays
      Value | Meaning
      --- | ---
      0 | None
      1 | Constraints
      2 | VOR/DMEs
      4 | Waypoints
      8 | NDBs
      16 | Airports
    - {side}
        - L
        - R

- A32NX_TRK_FPA_MODE_ACTIVE
    - Bool
    - True if TRK/FPA mode is active

- A32NX_AUTOPILOT_HEADING_SELECTED
    - Number (Degrees)
    - Indicates the selected heading on the FCU, instantly updated
    - In case of managed heading mode, the value is -1

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

- A32NX_AUTOPILOT_NOSEWHEEL_DEMAND
    - Percent over 100
    - Steering demand from autopilot to BSCU [-1;1] -1 left, 0 middle

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
      TCAS | 50

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
      TCAS | 6

- A32NX_FMA_EXPEDITE_MODE
    - Boolean
    - Indicates if expedite mode is engaged
      State | Value
      --- | ---
      OFF | 0
      ON | 1

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

- A32NX_AUTOPILOT_H_DOT_RADIO
    - Number (Feet per minute)
    - Indicates the current estimated vertical speed relative to the runway
    - Important: the signal is only usable above the runway and is not to be used elsewhere

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
      A_FLOOR | 13

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

- A32NX_AUTOTHRUST_MODE_MESSAGE
    - Enum
    - Indicates ATHR related message to be displayed on the PFD
      Mode | Value
      --- | ---
      NONE | 0
      LVR_CLB | 3
