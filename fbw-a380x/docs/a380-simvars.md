# A380 Local SimVars

## Contents

- [A380 Local SimVars](#a380-local-simvars)
  - [Contents](#contents)
  - [Uncategorized](#uncategorized)
  - [Air Conditioning Pressurisation Ventilation ATA 21](#air-conditioning-pressurisation-ventilation-ata-21)
  - [Auto Flight System ATA 22](#auto-flight-system-ata-22)
  - [Flight Management System ATA 22](#flight-management-system-ata-22)
  - [Communications ATA 23](#communications-ata-23)
    - [Placeholder Types](#placeholder-types)
    - [Local Vars](#local-vars)
  - [Electrical ATA 24](#electrical-ata-24)
  - [Fire and Smoke Protection ATA 26](#fire-and-smoke-protection-ata-26)
  - [Flaps / Slats (ATA 27)](#flight-controls-ata-27)
  - [Fuel (ATA 28)](#fuel-ata-28)
  - [Indicating-Recording ATA 31](#indicating-recording-ata-31)
  - [ECAM Control Panel ATA 31](#ecam-control-panel-ata-31)
  - [EFIS Control Panel ATA 31](#efis-control-panel-ata-31)
  - [Landing Gear ATA 32](#landing-gear-ata-32)
  - [Bleed Air ATA 36](#bleed-air-ata-36)
  - [Integrated Modular Avionics ATA 42](#integrated-modular-avionics-ata-42)
  - [Auxiliary Power Unit ATA 49](#auxiliary-power-unit-ata-49)
  - [Engines ATA 70](#engines-ata-70)
  - [Hydraulics](#hydraulics)
  - [Sound Variables](#sound-variables)
  - [Autobrakes](#autobrakes)
  - [Non-Systems Related](#non-systems-related)

## Uncategorized

- A380X_OVHD_ANN_LT_POSITION
    - Enum
    - Represents the state of the ANN LT switch
    - | State | Value |
      |-------|-------|
      | TEST  | 0     |
      | BRT   | 1     |
      | DIM   | 2     |

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
        - ELEC_BAT_ESS
        - ELEC_BAT_APU
        - ELEC_IDG_1
        - ELEC_IDG_2
        - ELEC_IDG_3
        - ELEC_IDG_4
        - ELEC_ENG_GEN_1
        - ELEC_ENG_GEN_2
        - ELEC_ENG_GEN_3
        - ELEC_ENG_GEN_4
        - ELEC_AC_ESS_FEED
        - ELEC_GALY_AND_CAB

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
        - ELEC_BAT_ESS
        - ELEC_BAT_APU
        - ELEC_BUS_TIE_PB
        - ELEC_GALY_AND_CAB

- A32NX_OVHD_{name}_PB_IS_RELEASED
    - Bool
    - True when the push button is RELEASED
    - {name}
        - ELEC_IDG_1
        - ELEC_IDG_2
        - ELEC_IDG_3
        - ELEC_IDG_4

- A32NX_OVHD_{name}_PB_IS_DISC
    - Bool
    - True when the idg is disconnected
    - {name}
        - ELEC_IDG_1
        - ELEC_IDG_2
        - ELEC_IDG_3
        - ELEC_IDG_4

- A32NX_OVHD_ELEC_AC_ESS_FEED_PB_IS_NORMAL
    - Bool
    - True when the AC ESS FEED push button is NORMAL

- A380X_OVHD_ELEC_BAT_SELECTOR_KNOB
    - Number
    - The position of the battery display knob from left to right
    - ESS=0, APU=1, OFF=2, BAT1=3, BAT2=4
    - Mapped to battery voltage indexes: {bat_index} = ESS=3 | APU=4 | OFF=0 | BAT1=1 | BAT2=2
        - A32NX_ELEC_BAT_{bat_index}_POTENTIAL is used to get the voltage

- A32NX_NOSE_WHEEL_LEFT_ANIM_ANGLE
    - Degrees
    - Angular position of left nose wheel (in wheel axis not steering)

- A32NX_NOSE_WHEEL_RIGHT_ANIM_ANGLE
    - Degrees
    - Angular position of right nose wheel (in wheel axis not steering)

- A32NX_BRAKE_TEMPERATURE_{1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16}
    - celsius
    - represents the brake temperature of the main wheels

- A32NX_REPORTED_BRAKE_TEMPERATURE_{1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16}
    - celsius
    - represents the reported brake temperature of the main wheels by the sensor.
    - Since no CPIOM G is implemented yet these are the values directly reported by the sensor.


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


## Air Conditioning Pressurisation Ventilation ATA 21

- A32NX_COND_CPIOM_B{id}_AGS_DISCRETE_WORD
    - Arinc429<Discrete>
    - Discrete Data word of the AGS Application in the CPIOM B (assumed)
    - {id} 1, 2, 3 or 4
    - | Bit |                      Description                     |
      |:---:|:----------------------------------------------------:|
      | 11  | AGS Application INOP                                 |
      | 12  | Unused                                               |
      | 13  | Pack 1 operating                                     |
      | 14  | Pack 2 operating                                     |

- A32NX_COND_CPIOM_B{id}_TCS_DISCRETE_WORD
    - Arinc429<Discrete>
    - Discrete Data word of the TCS Application in the CPIOM B (assumed)
    - {id} 1, 2, 3 or 4
    - | Bit |                      Description                     |
      |:---:|:----------------------------------------------------:|
      | 11  | TCS Application INOP                                 |
      | 12  | Unused                                               |
      | 13  | Hot Air 1 position disagrees                         |
      | 14  | Hot Air 2 position disagrees                         |
      | 15  | Trim Air Pressure Regulating Valve 1 is open         |
      | 16  | Trim Air Pressure Regulating Valve 2 is open         |

- A32NX_COND_CPIOM_B{id}_VCS_DISCRETE_WORD
    - Arinc429<Discrete>
    - Discrete Data word of the VCS Application in the CPIOM B (assumed)
    - {id} 1, 2, 3 or 4
    - | Bit |                      Description                     |
      |:---:|:----------------------------------------------------:|
      | 11  | VCS Application INOP                                 |
      | 12  | Unused                                               |
      | 13  | FWD Extraction fan is on                             |
      | 14  | FWD isolation valve is open                          |
      | 15  | Bulk Extraction fan is on                            |
      | 16  | Bulk isolation valve is open                         |
      | 17  | Primary fans are enabled                             |
      | 18  | Primary Fan 1 Fault                                  |
      | 19  | Primary Fan 2 Fault                                  |
      | 20  | Primary Fan 3 Fault                                  |
      | 21  | Primary Fan 4 Fault                                  |
      | 22  | Bulk Heater Fault                                    |
      | 23  | FWD isolation valve Fault                            |
      | 24  | Bulk isolation valve Fault                           |

- A32NX_COND_CPIOM_B{id}_CPCS_DISCRETE_WORD
    - Arinc429<Discrete>
    - Discrete Data word of the CPCS Application in the CPIOM B (assumed)
    - {id} 1, 2, 3 or 4
    - | Bit |                      Description                     |
      |:---:|:----------------------------------------------------:|
      | 11  | CPCS Application INOP                                |
      | 12  | Unused                                               |
      | 13  | Excessive cabin altitude - warn                      |
      | 14  | Excessive differential pressure - warn               |
      | 15  | Excessive negative differential pressure - warn      |
      | 16  | High differential pressure - warn                    |
      | 17  | Low differential pressure - warn                     |
      | 18  | Excessive residual pressure - warn                   |

- A32NX_COND_{id}_TEMP
    - Degree Celsius
    - Temperature as measured in each of the cabin zones and cockpit
    - {id}
        - CKPT
        - MAIN_DECK_1
        - MAIN_DECK_2
        - MAIN_DECK_3
        - MAIN_DECK_4
        - MAIN_DECK_5
        - MAIN_DECK_6
        - MAIN_DECK_7
        - MAIN_DECK_8
        - UPPER_DECK_1
        - UPPER_DECK_2
        - UPPER_DECK_3
        - UPPER_DECK_4
        - UPPER_DECK_5
        - UPPER_DECK_6
        - UPPER_DECK_7
        - CARGO_FWD
        - CARGO_BULK

- A32NX_COND_FDAC_{id1}_CHANNEL_{id2}_FAILURE
    - Bool
    - True if the channel is failed
    - {id - both}
        - 1 or 2

- A32NX_COND_{id}_DUCT_TEMP
    - Degree Celsius
    - Temperature of trim air coming out of the ducts in the cabin and cockpit
    - {id}
        - Same as A32NX_COND_{id}_TEMP

- A32NX_COND_PURS_SEL_TEMPERATURE
    - Degree Celsius
    - Temperature selected by the crew using the FAP (Flight Attendant Panel). For us, this is selected in the EFB.

- A32NX_COND_PACK_{id}_OUTLET_TEMPERATURE
    - Degree Celsius
    - Outlet temperature of the packs
    - {id} 1 or 2

- A32NX_COND_{id}_TRIM_AIR_VALVE_POSITION
    - Percentage
    - Percentage opening of each trim air valve (hot air)
    - {id}
        - Same as A32NX_COND_{id}_TEMP

- A32NX_COND_TADD_CHANNEL_{id}_FAILURE
    - Bool
    - True if the channel is failed
    - {id}
        - 1 or 2

- A32NX_VENT_{id1}_VCM_CHANNEL_{id2}_FAILURE
    - Bool
    - True if the channel is failed
    - {id1}
        - FWD
        - AFT
    - {id2}
        - 1 or 2

- A32NX_VENT_OVERPRESSURE_RELIEF_VALVE_IS_OPEN
    - Bool
    - True when the Overpressure Relief Valve Dumps are open. There are two valves but just one variable for now as they (mostly) always open and close at the same time.

- A32NX_PRESS_CABIN_ALTITUDE_{cpiom_id}
    - Arinc429Word<Feet>
    - The equivalent altitude from sea level of the interior of the cabin based on the internal pressure
    - (cpiom_id)
        - B1
        - B2
        - B3
        - B4

- A32NX_PRESS_CABIN_ALTITUDE_TARGET_{cpiom_id}
    - Arinc429Word<Feet>
    - Target cabin altitude as calculated by the pressurization system or manually selected on the overhead panel
    - (cpiom_id)
        - B1
        - B2
        - B3
        - B4

- A32NX_PRESS_CABIN_VS_{cpiom_id}
    - Arinc429Word<FPM>
    - Rate of pressurization or depressurization of the cabin expressed as altitude change
    - (cpiom_id)
        - B1
        - B2
        - B3
        - B4

- A32NX_PRESS_CABIN_VS_TARGET_{cpiom_id}
    - Arinc429Word<FPM>
    - Target cabin vertical speed by the pressurization system
    - (cpiom_id)
        - B1
        - B2
        - B3
        - B4

- A32NX_PRESS_CABIN_DELTA_PRESSURE_{cpiom_id}
    - Arinc429Word<PSI>
    - The difference in pressure between the cabin interior and the exterior air.
      Positive when cabin pressure is higher than external pressure.
    - (cpiom_id)
        - B1
        - B2
        - B3
        - B4

- A32NX_PRESS_MAN_CABIN_DELTA_PRESSURE
    - PSI
    - As above, but analog system transmitted by the manual partition of CPC1

- A32NX_PRESS_OCSM_{id1}_CHANNEL_{id2}_FAILURE
    - Bool
    - True if the channel is failed
    - {id1}
        - 1 to 4
    - {id2}
        - 1 or 2

- A32NX_PRESS_OCSM_{id}_AUTO_PARTITION_FAILURE
    - Bool
    - True if the the automatic outflow valve control is failed
    - {id}
        - 1 to 4

- A32NX_OVHD_COND_{id}_SELECTOR_KNOB
    - Number (0 to 300)
    - Rotation amount of the overhead temperature selectors for the cockpit and the cabin
    - To transform the value into degree celsius use this formula: this * 0.04 + 18
    - {id}
        - CKPT
        - CABIN

- A32NX_OVHD_COND_HOT_AIR_{index}_PB_IS_ON
    - Bool
    - True if the hot air pushbutton {1 or 2} is pressed in the on position (no white light)

- A32NX_OVHD_COND_HOT_AIR_{index}_PB_HAS_FAULT
    - Bool
    - True if the hot air {1 or 2} trim system has a fault

- A32NX_OVHD_COND_RAM_AIR_PB_IS_ON
    - Bool
    - True if the ram air pushbutton is pressed in the on position
  (on light iluminates)

- A32NX_OVHD_CARGO_AIR_{id}_SELECTOR_KNOB
    - Number (0 to 300)
    - Rotation amount of the overhead temperature selectors for the cockpit and the cabin
    - To transform the value into degree celsius use this formula: this * 0.0667 + 5
    - {id}
        - FWD
        - BULK

- A32NX_OVHD_CARGO_AIR_ISOL_VALVES_{id}_PB_IS_ON
    - Bool
    - True if the {BULK or FWD} isolation valves are open (no white light)

- A32NX_OVHD_CARGO_AIR_ISOL_VALVES_{id}_PB_HAS_FAULT
    - Bool
    - True if the {BULK or FWD} isolation valves are failed

- A32NX_OVHD_CARGO_AIR_HEATER_PB_IS_ON
    - Bool
    - True if the bulk cargo heater is operating automatically

- A32NX_OVHD_CARGO_AIR_HEATER_PB_HAS_FAULT
    - Bool
    - True if the bulk cargo heater is failed

- A32NX_OVHD_PRESS_MAN_ALTITUDE_PB_IS_AUTO
    - Bool
    - True if the overhead manual altitude pushbutton is auto (no light)

- A32NX_OVHD_PRESS_MAN_ALTITUDE_KNOB
    - Feet
    - Value in feet of the manually selected cabin target altitude on the overhead panel

- A32NX_OVHD_PRESS_MAN_VS_CTL_PB_IS_AUTO
    - Bool
    - True if the overhead manual vertical speed pushbutton is auto (no light)

- A32NX_OVHD_PRESS_MAN_VS_CTL_KNOB
    - Feet per minute
    - Value in feet per minute of the manually selected cabin vertical speed on the overhead panel

- A32NX_OVHD_VENT_AIR_EXTRACT_PB_IS_ON
    - Bool
    - True if the overhead manual extract vent override pushbutton is on (illuminated)

## Auto Flight System ATA 22

- A380X_MFD_{side}_ACTIVE_PAGE
    - String
    - URI of activate page on respective MFD (e.g. fms/active/init)
    - {side} = L or R

- A32NX_FMS_PAX_NUMBER
    - Number
    - Number of passengers entered on FMS/ACTIVE/FUEL&LOAD page

- A32NX_SPEEDS_MANAGED_SHORT_TERM_PFD
    - Number
    - The short term managed speed displayed on the PFD

## Flight Management System ATA 22

- A32NX_FMS_SWITCHING_KNOB
    - FMS used
    - Position (0-2)
    - 0 is BOTH ON 2, 1 is NORM, 2 is BOTH ON 1

- A380X_FMS_DEST_EFOB_BELOW_MIN
    - Bool
    - Indicates if the FMS predicted fuel at destination is below minimum.

## Communications ATA 23

### Placeholder Types

- `{rmp_index}` 1, 2, or 3
- `{vhf_index}` 1, 2, or 3

### Local Vars

- `L:A380X_RMP_{rmp_index}_STATE`
    - Enum
    - Indicates the state of the RMP.
    -   | State      | Number |
        |------------|--------|
        | OffFailed  | 0      |
        | OffStandby | 1      |
        | On         | 2      |
        | OnFailed   | 3      |

- `L:FBW_RMP_FREQUENCY_ACTIVE_{vhf_index}`
  - Frequency BCD32 (can be read with MHz or any other frequency unit)
  - Read only!
  - Contains the active frequency value synced amongst the RMPs for this VHF radio. 0 when invalid. This will contain the actual frequency even in other modes.

- `L:FBW_RMP_FREQUENCY_STANDBY_{vhf_index}`
  - Frequency BCD32 (can be read with MHz or any other frequency unit)
  - Read only!
  - Contains the standby frequency value synced amongst the RMPs for this VHF radio. 0 when invalid. This will contain the actual frequency even in other modes.

- `L:FBW_RMP_MODE_ACTIVE_{vhf_index}`
    - Enum
    - Read only!
    - Indicates the active frequency mode synced amongst the RMPs for this VHF radio.
    -   | State      | Number |
        |------------|--------|
        | Frequency  | 0      |
        | Data       | 1      |
        | Emergency  | 2      |

- `L:FBW_RMP_MODE_STANDBY_{vhf_index}`
    - Enum
    - Read only!
    - Indicates the standby frequency mode synced amongst the RMPs for this VHF radio.
    -   | State      | Number |
        |------------|--------|
        | Frequency  | 0      |
        | Data       | 1      |
        | Emergency  | 2      |

## Electrical ATA 24

- A32NX_ELEC_CONTACTOR_{name}_IS_CLOSED
    - Bool
    - True when the contactor is CLOSED
    - {name}
        - 3XB.1: Contactor between the static inverter and AC EMER BUS (AC ESS)
        - 3XB.2: Contactor between AC ESS BUS (AC ESS SCHED) and AC EMER BUS (AC ESS)
        - 3XC1: AC ESS feed contactor between AC BUS 1 and AC ESS BUS (AC ESS SCHED)
        - 3XC2: AC ESS feed contactor between AC BUS 4 and AC ESS BUS (AC ESS SCHED)
        - 5PB: Battery APU contactor
        - 5XE: Emergency generator contactor
        - 6PB3: Battery ESS contactor
        - 6PC1: Contactor from battery 1 to DC ESS BUS
        - 6PC2: Inter bus line contactor between DC BUS 1 and DC ESS BUS
        - 6PE: Contactor between TR ESS and DC ESS BUS
        - 7PU: Contactor between TR APU and DC APU BAT BUS
        - 7XB: Contactor to the static inverter
        - 10KA_AND_5KA: The two contactors leading to the APU start motor
        - 14PH: Contactor from DC ESS BUS to DC EHA BUS
        - 900XU: System isolation contactor
        - 911XN: Contactor from AC BUS 3 to AC EHA BUS
        - 911XH: Contactor from AC ESS BUS (AC ESS SCHED) to AC EHA BUS
        - 970PN: Contactor from DC BUS 2 to DC GND/FLT SVC BUS
        - 970PN2: Contactor from DC BUS 2 to DC EHA BUS
        - 980PC: Inter bus line contactor between DC BUS 1 and DC BUS 2
        - 980XU1: AC BUS tie contactor 1
        - 980XU2: AC BUS tie contactor 2
        - 980XU3: AC BUS tie contactor 3
        - 980XU4: AC BUS tie contactor 4
        - 980XU5: AC BUS tie contactor 5
        - 980XU6: AC BUS tie contactor 6
        - 990PB1: Battery 1 contactor
        - 990PB2: Battery 2 contactor
        - 990PU1: Contactor between TR1 and DC BUS 1
        - 990PU2: Contactor between TR1 and DC BUS 2
        - 990PX: Contactor from TR2 to DC GND/FLT SVC BUS
        - 990XG1: External power contactor 1
        - 990XG2: External power contactor 2
        - 990XG3: External power contactor 3
        - 990XG4: External power contactor 4
        - 990XS1: APU generator line contactor 1
        - 990XS2: APU generator line contactor 2
        - 990XU1: Engine generator line contactor 1
        - 990XU2: Engine generator line contactor 2
        - 990XU3: Engine generator line contactor 3
        - 990XU4: Engine generator line contactor 4

- A32NX_ELEC_{name}_BUS_IS_POWERED
    - Bool
    - True when the given bus is powered
    - {name}
      - AC_1
      - AC_2
      - AC_3
      - AC_4
      - AC_ESS
      - AC_ESS_SCHED
      - AC_247XP
      - DC_1
      - DC_2
      - DC_ESS
      - DC_247PP
      - DC_HOT_1
      - DC_HOT_2
      - DC_HOT_3
      - DC_HOT_4
      - DC_GND_FLT_SVC

- A32NX_ELEC_{name}_POTENTIAL
    - Volts
    - The electric potential of the given element
    - {name}
      - APU_GEN_1
      - APU_GEN_2
      - ENG_GEN_1
      - ENG_GEN_2
      - ENG_GEN_3
      - ENG_GEN_4
      - EXT_PWR
      - STAT_INV
      - EMER_GEN
      - TR_1
      - TR_2
      - TR_3: TR ESS
      - TR_4: TR APU
      - BAT_1
      - BAT_2
      - BAT_3: BAT ESS
      - BAT_4: BAT APU

- A32NX_ELEC_{name}_POTENTIAL_NORMAL
    - Bool
    - Indicates if the potential is within the normal range
    - {name}
        - APU_GEN_1
        - APU_GEN_2
        - ENG_GEN_1
        - ENG_GEN_2
        - ENG_GEN_3
        - ENG_GEN_4
        - EXT_PWR
        - STAT_INV
        - EMER_GEN
        - TR_1
        - TR_2
        - TR_3: TR ESS
        - TR_4: TR APU
        - BAT_1
        - BAT_2
        - BAT_3: BAT ESS
        - BAT_4: BAT APU

- A32NX_ELEC_{name}_FREQUENCY:
    - Hertz
    - The frequency of the alternating current of the given element
    - {name}
        - APU_GEN_1
        - APU_GEN_2
        - ENG_GEN_1
        - ENG_GEN_2
        - ENG_GEN_3
        - ENG_GEN_4
        - EXT_PWR
        - STAT_INV
        - EMER_GEN

- A32NX_ELEC_{name}_FREQUENCY_NORMAL
    - Hertz
    - Indicates if the frequency is within the normal range
    - {name}
        - APU_GEN_1
        - APU_GEN_2
        - ENG_GEN_1
        - ENG_GEN_2
        - ENG_GEN_3
        - ENG_GEN_4
        - EXT_PWR
        - STAT_INV
        - EMER_GEN

- A32NX_ELEC_{name}_LOAD
    - Percent
    - The load the generator is providing compared to its maximum
    - {name}
        - APU_GEN_1
        - APU_GEN_2
        - ENG_GEN_1
        - ENG_GEN_2
        - ENG_GEN_3
        - ENG_GEN_4

- A32NX_ELEC_{name}_LOAD_NORMAL
    - Percent
    - Indicates if the load is within the normal range
    - {name}
        - APU_GEN_1
        - APU_GEN_2
        - ENG_GEN_1
        - ENG_GEN_2
        - ENG_GEN_3
        - ENG_GEN_4

- A32NX_ELEC_{name}_CURRENT
    - Ampere
    - The electric current flowing through the given element
    - {name}
        - TR_1
        - TR_2
        - TR_3: TR ESS
        - TR_4: TR APU
        - BAT_1: Battery 1 (negative when discharging, positive when charging)
        - BAT_2: Battery 2 (negative when discharging, positive when charging)
        - BAT_3: Battery ESS (negative when discharging, positive when charging)
        - BAT_4: Battery APU (negative when discharging, positive when charging)

- A32NX_ELEC_{name}_CURRENT_NORMAL
    - Ampere
    - Indicates if the current is within the normal range
    - {name}
        - TR_1
        - TR_2
        - TR_3: TR ESS
        - TR_4: TR APU
        - BAT_1: Battery 1
        - BAT_2: Battery 2
        - BAT_3: Battery ESS
        - BAT_4: Battery APU

- A32NX_ELEC_ENG_GEN_{number}_IDG_OIL_OUTLET_TEMPERATURE
    - Celsius
    - The integrated drive generator's oil outlet temperature
    - {number}
        - 1
        - 2
        - 3
        - 4

- A32NX_ELEC_ENG_GEN_{number}_IDG_IS_CONNECTED
    - Bool
    - Indicates if the given integrated drive generator is connected
    - {number}
        - 1
        - 2
        - 3
        - 4

## Fire and Smoke Protection ATA 26

- A32NX_FIRE_FDU_DISCRETE_WORD
    - Arinc429<Discrete>
    - Discrete Data word of the Fire Detection Unit (assumed)
    - | Bit |                      Description                     |
      |:---:|:----------------------------------------------------:|
      | 11  | Fire detected ENG 1                                  |
      | 12  | Fire detected ENG 2                                  |
      | 13  | Fire detected ENG 3                                  |
      | 14  | Fire detected ENG 4                                  |
      | 15  | Fire detected APU                                    |
      | 16  | Fire detected MLG                                    |
      | 17  | Not used                                             |
      | 18  | ENG 1 LOOP A fault                                   |
      | 19  | ENG 1 LOOP B fault                                   |
      | 20  | ENG 2 LOOP A fault                                   |
      | 21  | ENG 2 LOOP B fault                                   |
      | 22  | ENG 3 LOOP A fault                                   |
      | 23  | ENG 3 LOOP B fault                                   |
      | 24  | ENG 4 LOOP A fault                                   |
      | 25  | ENG 4 LOOP B fault                                   |
      | 26  | APU LOOP A fault                                     |
      | 27  | APU LOOP B fault                                     |
      | 28  | MLG LOOP A fault                                     |
      | 29  | MLG LOOP B fault                                     |

- A32NX_{zone}_ON_FIRE
    - Bool
    - True when a fire is present in the APU or MLG
    - {zone}
        - APU
        - MLG

- A32NX_FIRE_DETECTED_ENG{number}
    - Bool
    - True when fire is detected on engine
    - {number}
        - 1
        - 2
        - 3
        - 4

- A32NX_FIRE_DETECTED_{zone}
    - Bool
    - True when fire is detected in the APU or MLG
    - {zone}
        - APU
        - MLG

- A32NX_OVHD_FIRE_AGENT_{bottle}_{zone}_{number}_IS_PRESSED
    - Bool
    - True when the overhead pushbutton for the corresponding fire extinguishing bottle agent is pressed. Momentary PB. Note APU uses 1_APU_1
    - {bottle}
        - 1
        - 2
    - {zone}
        - APU
        - ENG
    - {number}
        - 1
        - 2
        - 3
        - 4

- A32NX_OVHD_FIRE_SQUIB_{bottle}_{zone}_{number}_IS_ARMED
    - Bool
    - True when the the corresponding fire extinguishing bottle squibs are armed.
    - {bottle}
        - 1
        - 2
    - {zone}
        - APU
        - ENG
    - {number}
        - 1
        - 2
        - 3
        - 4

- A32NX_OVHD_FIRE_SQUIB_{bottle}_{zone}_{number}_IS_DISCHARGED
    - Bool
    - True when the the corresponding fire extinguishing bottle has been discharged into the engine.
    - {bottle}
        - 1
        - 2
    - {zone}
        - APU
        - ENG
    - {number}
        - 1
        - 2
        - 3
        - 4

- A32NX_FIRE_BUTTON_ENG{number}
    - Bool
    - True when the overhead fire pushbutton has been released

- A32NX_FIRE_BUTTON_APU
    - Bool
    - True when the overhead apu pushbutton has been released

- A32NX_OVHD_FIRE_TEST_PB_IS_PRESSED
    - Bool
    - True when the overhead fire test pushbutton is pressed

## Flight Controls (ATA 27)

- A32NX_{side}_FLAPS_{number}_POSITION_PERCENT
    - Percent
    - Indicates the angle of the flaps out of 40 degrees
    - Side
        - LEFT
        - RIGHT
    - Number
        - From 1 (inboard) to 3

- A32NX_{side}_SLATS_{number}_POSITION_PERCENT
    - Percent
    - Indicates the angle of the slats out of 27 degrees
    - Side
        - LEFT
        - RIGHT
    - Number
        - From 1 (inboard) to 8

- A32NX_{side}_FLAPS_{number}_ANGLE
    - Degrees
    - The actual angle of the flaps
    - Side
        - LEFT
        - RIGHT
    - Number
        - From 1 (inboard) to 3

- A32NX_{side}_SLATS_{number}_ANGLE
    - Degrees
    - The actual angle of the slats
    - Side
        - LEFT
        - RIGHT
    - Number
        - From 1 (inboard) to 8

- A32NX_FCDC_{number}_DISCRETE_WORD_1
    - Arinc429<Discrete>
    - | Bit |                Description               |
      |:---:|:----------------------------------------:|
      | 11  | Pitch Normal Law Active                  |
      | 12  | Pitch Alternate Law 1 Active             |
      | 13  | Pitch Alternate Law 2 Active             |
      | 14  | Pitch Alternate Law 1A Active            |
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

- A32NX_FCDC_{number}_FG_DISCRETE_WORD_4
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

- A32NX_FCDC_{number}_FG_DISCRETE_WORD_8
    - Arinc429<Discrete>
    - Bits marked with ? are guessed/unknown
      | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | Capability Downgrade triple click |
      | 12  | Mode reversion triple click       |
      | 13  | BTV triple click                  |
      | 14  | AP 1 INOP                         |
      | 15  | AP 2 INOP                         |
      | 16  | FD 1 INOP                         |
      | 17  | FD 1 INOP                         |
      | 18  | ROLLOUT INOP                      |

- A32NX_SFCC_{number}_SLAT_FLAP_ACTUAL_POSITION_WORD
    - {number} is 1 or 2
    - Slat/Flap actual position discrete word of the SFCC bus output
    - This ARINC word has been adapted from the A320 with A380 angles
    - Arinc429<Discrete>
    - | Bit |      Description A380X, if different        |
      |:---:|:-------------------------------------------:|
      | 11  | Slat Data Valid                             |
      | 12  | Slats Retracted 0° (9.5° > FPPU > -16°)     |
      | 13  | Slats >= 20° (343° >= FPPU >= 276.9°)       |
      | 14  | Slats >= 23 (343° >= FPPU >= 317.8°)        |
      | 15  | Slats Extended 23° (343° >= FPPU >= 317.8°) |
      | 16  | Slat WTB Engaged                            |
      | 17  | Slat Fault                                  |
      | 18  | Flap Data Valid                             |
      | 19  | Flaps Retracted 0° (10° > FPPU > -10°)      |
      | 20  | Flaps >= 8° (350° >= FPPU >= 208.0°)        |
      | 21  | Flaps >= 17° (350° >= FPPU >= 251.6°)       |
      | 22  | Flaps >= 26° (350° >= FPPU >= 289.9°)       |
      | 23  | Flaps Extended 33° (350° >= FPPU >= 331°)   |
      | 24  | Flap WTB engaged                            |
      | 25  | Flap Fault                                  |
      | 26  | Spoiler Lift Demand                         |
      | 27  | Spoiler Limit Demand                        |
      | 28  | Slat System Jam                             |
      | 29  | Flap System Jam                             |

- A32NX_FLAPS_CONF_INDEX
  - Number
  - Indicates the desired flap configuration index according to the table
        DO NOT USE IN SYSTEMS, USE SFCC INSTEAD
  - Value | Meaning
            --- | ---
      0 | Conf0
      1 | Conf1
      2 | Conf1F
      3 | Conf2
      4 | Conf2S
      5 | Conf3
      6 | Conf4

## Fuel ATA 28
- A32NX_TOTAL_FUEL_QUANTITY
  - Number in kilogramm
  - The total physical quantity of fuel in the tanks

- A32NX_TOTAL_FUEL_VOLUME
  - Number in Gallons
  - The total physical volume of fuel in the tanks

- A32NX_FQMS_STATUS_WORD
  - Arinc429<Discrete>
  - Status word indicating different status
  - | Bit |        Meaning        |
    |:---:|:---------------------:|
    | 11   | FMS Data unavailable |
    | 12   | FMS Data disagrees   |
    | 13   | |
    | 14   | |
    | 15   | |
    | 16   | |
    | 17   | |
    | 18   | |
    | 19   | |
    | 20   | |
    | 21  | |
    | 22  | |
    | 23  | |
    | 24  | |
    | 25  | |
    | 26  | |
    | 27  | |
    | 28  | |
    | 29  | |

- A32NX_FQMS_TOTAL_FUEL_ON_BOARD
  - Arinc429<Kilogram>
  - The total quantity of fuel in the tanks

- A32NX_FQMS_GROSS_WEIGHT
  - Arinc429<Kilogram>
  - The total weight of the aircraft

- A32NX_FQMS_CENTER_OF_GRAVITY_MAC
  - Arinc429<Percent>
  - The center of gravity of the aircraft

- A32NX_FQMS_{tank}_TANK_QUANTITY
  - Arinc429<Kilogram>
  - The fuel quantity in a specific tank
  -{tank}
    - FEED_1
    - FEED_2
    - FEED_3
    - FEED_4
    - LEFT_OUTER
    - LEFT_MID
    - LEFT_INNER
    - RIGHT_OUTER
    - RIGHT_MID
    - RIGHT_INNER
    - TRIM

- A32NX_FQMS_{side}_FUEL_PUMP_RUNNING_WORD
  - Arinc429<Discrete>
  - Status word indicating different status
  - {side}
    - LEFT
    - RIGHT
  - | Bit |        Meaning        |
    |:---:|:---------------------:|
    | 11   | Main Feed Pump 1/3 running |
    | 12   | Standby Feed Pump 1/3 running |
    | 13   | Main Feed Pump 2/4 running |
    | 14   | Standby Feed Pump 2/4 running |
    | 15   | {side} Outer Pump running |
    | 16   | {side} Mid Fwd Pump running |
    | 17   | {side} Mid Aft Pump running |
    | 18   | {side} Inner Fwd Pump running |
    | 19   | {side} Inner Aft Pump running |
    | 20   | {side} Trim Pump running |
    | 21-29 | Unused |

- A32NX_FQDC_{id}_{tank}_TANK_QUANTITY
  - Arinc429<Kilogram>
  - The fuel quantity in a specific tank (AGP value)
  - {id}
    - 1
    - 2
  -{tank}
    - FEED_1
    - FEED_2
    - FEED_3
    - FEED_4
    - LEFT_OUTER
    - LEFT_MID
    - LEFT_INNER
    - RIGHT_OUTER
    - RIGHT_MID
    - RIGHT_INNER
    - TRIM

## Indicating-Recording ATA 31

- A32NX_CDS_CAN_BUS_1_1_AVAIL
  - Bool
  - Indicates if the first CAN bus of the CDS on the captain's side is available

- A32NX_CDS_CAN_BUS_1_2_AVAIL
  - Bool
  - Indicates if the first CAN bus of the CDS on the captain's side is available

- A32NX_CDS_CAN_BUS_2_1_AVAIL
  - Bool
  - Indicates if the first CAN bus of the CDS on the first officer's side is available

- A32NX_CDS_CAN_BUS_2_2_AVAIL
  - Bool
  - Indicates if the first CAN bus of the CDS on the first officer's side is available

- A32NX_CDS_CAN_BUS_1_1_FAILURE
  - Bool
  - Indicates if the first CAN bus of the CDS on the captain's side simulates a failure

- A32NX_CDS_CAN_BUS_1_2_FAILURE
  - Bool
  - Indicates if the first CAN bus of the CDS on the captain's side simulates a failure

- A32NX_CDS_CAN_BUS_2_1_FAILURE
  - Bool
  - Indicates if the first CAN bus of the CDS on the first officer's side simulates a failure

- A32NX_CDS_CAN_BUS_2_2_FAILURE
  - Bool
  - Indicates if the first CAN bus of the CDS on the first officer's side simulates a failure

- A32NX_CDS_CAN_BUS_1_1_<FUNCTION_ID>_RECEIVED
  - Bool
  - Indicates if the system per function ID in the CDS bus received the last sent message

- A32NX_CDS_CAN_BUS_1_1
  - ArincWord852<>
  - First CAN bus of the CDS on the captain's side

- A32NX_CDS_CAN_BUS_1_2
  - ArincWord852<>
  - Second CAN bus of the CDS on the captain's side

- A32NX_CDS_CAN_BUS_2_1
  - ArincWord852<>
  - First CAN bus of the CDS on the first officer's side

- A32NX_CDS_CAN_BUS_2_2
  - ArincWord852<>
  - Second CAN bus of the CDS on the first officer's side

## ECAM Control Panel ATA 31

- A32NX_BTN_{button_name}
    - Number
    - Button state of the ECAM CP buttons
        - 0: Not pressed, 1: Pressed
    - {button_name}
        - ALL
        - ABNPROC
        - CHECK_LH
        - CHECK_RH
        - CL
        - CLR
        - CLR2
        - DOWN
        - EMERCANC
        - MORE
        - RCL
        - TOCONFIG
        - UP

- A32NX_ECAM_SD_CURRENT_PAGE_INDEX
    - Enum
- Currently requested page on the ECAM CP
    - | State | Value |
      |-------|-------|
      | ENG   | 0     |
      | APU   | 1     |
      | BLEED | 2     |
      | COND  | 3     |
      | PRESS | 4     |
      | DOOR  | 5     |
      | EL/AC | 6     |
      | EL/DC | 7     |
      | FUEL  | 8     |
      | WHEEL | 9     |
      | HYD   | 10    |
      | F/CTL | 11    |
      | C/B   | 12    |
      | CRZ   | 13    |
      | STS   | 14    |
      | VIDEO | 15    |


## EFIS Control Panel ATA 31

- A380X_EFIS_{side}_LS_BUTTON_IS_ON
    - Boolean
    - Whether the LS button is activated
    - {side} = L or R

- A380X_EFIS_{side}_VV_BUTTON_IS_ON
    - Boolean
    - Whether the VV button is activated
    - {side} = L or R

- A380X_EFIS_{side}_CSTR_BUTTON_IS_ON
    - Boolean
    - Whether the CSTR button is activated
    - {side} = L or R

- A380X_EFIS_{side}_ACTIVE_FILTER
    - Boolean
    - Indicates which waypoint filter is selected
    - {side} = L or R
    - | State | Value |
      |-------|-------|
      | WPT   | 1     |
      | VORD  | 2     |
      | NDB   | 3     |

- A380X_EFIS_{side}_ACTIVE_OVERLAY
    - Boolean
    - Indicates which waypoint filter is selected
    - {side} = L or R
    - | State | Value |
      |-------|-------|
      | WX    | 0     |
      | TERR  | 1     |

- A380X_EFIS_{side}_ARPT_BUTTON_IS_ON
    - Boolean
    - Whether the ARPT button is activated
    - {side} = L or R

- A380X_EFIS_{side}_TRAF_BUTTON_IS_ON
    - Boolean
    - Whether the TRAF button is activated
    - {side} = L or R

- A380X_EFIS_{side}_BARO_PRESELECTED
    - Number (hPa or inHg)
    - Pre-selected QNH when in STD mode, or 0 when not displayed.
    - Not for FBW systems use!
    - {side} = L or R

## Landing Gear ATA 32

- A32NX_BTV_STATE
    - Boolean
    - Indicates the current state of the BTV system
    - | State             | Value |
      |-------------------|-------|
      | DISABLED          | 0     |
      | ARMED             | 1     |
      | ROT OPTIMIZATION  | 2     |
      | DECEL             | 3     |
      | END OF BRAKING    | 4     |

## Bleed Air ATA 36

- A32NX_PNEU_ENG_{number}_INTERMEDIATE_TRANSDUCER_PRESSURE
  - Psi
  - Pressure measured at the intermediate pressure transducer at engine {number}, -1 if no output

## Integrated Modular Avionics ATA 42

-A32NX_AFDX_<SOURCE_ID>_<DESTINATION_ID>_REACHABLE
  - Bool
  - Indicates if the AFDX switch with the source id can reach the switch with the destination id

- A32NX_AFDX_SWITCH_<ID>_FAILURE
  - Bool
  - Indicates if a specific AFDX switch is in a failure mode

- A32NX_AFDX_SWITCH_<ID>_AVAIL
  - Bool
  - Indicates if a specific AFDX switch is available

- A32NX_CPIOM_<NAME>_FAILURE
  - Bool
  - Indicates if a specific CPIOM system is in a failure mode

- A32NX_CPIOM_<NAME>_AVAIL
  - Bool
  - Indicates if a specific CPIOM system is available

- A32NX_IOM_<NAME>_FAILURE
  - Bool
  - Indicates if a specific IOM system is in a failure mode

- A32NX_IOM_<NAME>_AVAIL
  - Bool
  - Indicates if a specific IOM system is available

## Auxiliary Power Unit ATA 49

- A32NX_APU_N2
  - `Arinc429Word<Percent>`
  - The APU's N2 rotations per minute in percentage of the maximum RPM

- A32NX_APU_FUEL_USED
  - `Arinc429Word<Mass>`
  - The APU fuel used, in kilograms

## Engines ATA 70
  - L:A32NX_OVHD_FADEC_{ENG}
  - The powered status of the associated engine's FADEC dependant on the button on the OVHD
  - {ENG} = 1, 2, 3, 4

## Hydraulics

- A32NX_OVHD_HYD_ENG_{ENG}AB_PUMP_DISC_PB_IS_AUTO
    - Boolean
    - Whether the pump disconnect pushbutton on engine {ENG} is in auto mode, i.e not disconnected
    - {ENG} = 1, 2, 3, 4

- A32NX_OVHD_HYD_ENG_{ENG}AB_PUMP_DISC_PB_HAS_FAULT
    - Boolean
    - Whether the pump disconnect pushbutton on engine {ENG} has a fault
    - {ENG} = 1, 2, 3, 4

- A32NX_HYD_ENG_{ENG}AB_PUMP_DISC
    - Boolean
    - Disconnected pump feedback signal
    - {ENG} = 1, 2, 3, 4

## Sound Variables

- A380X_SOUND_COCKPIT_WINDOW_RATIO
    - Number
    - Ratio between 0-1 of the cockpit windows being physically open

## Autobrakes

- A32NX_AUTOBRAKES_SELECTED_MODE
    - Number
    - Indicates position of the autobrake selection knob
    -   | State  | Number |
        |--------|--------|
        | DISARM | 0      |
        | BTV    | 1      |
        | LOW    | 2      |
        | L2     | 3      |
        | L3     | 4      |
        | HIGH   | 5      |

- A32NX_AUTOBRAKES_ARMED_MODE
    - Number
    - Indicates actual armed mode of autobrake system
    -   | State  | Number |
        |--------|--------|
        | DISARM | 0      |
        | BTV    | 1      |
        | LOW    | 2      |
        | L2     | 3      |
        | L3     | 4      |
        | HIGH   | 5      |
        | RTO    | 6      |

- A32NX_AUTOBRAKES_DISARM_KNOB_REQ
    - Boolean
    - True when autobrake knob solenoid resets knob position to DISARM

- A32NX_OVHD_AUTOBRK_RTO_ARM_IS_PRESSED
    - Boolean
    - RTO autobrake button is pressed

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
        - 1 - 4
