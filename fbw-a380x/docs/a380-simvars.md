# A380 Local SimVars

## Contents

- [A380 Local SimVars](#a380-local-simvars)
  - [Uncategorized](#uncategorized)
  - [Air Conditioning / Pressurisation / Ventilation ATA21](#air-conditioning-pressurisation-ventilation-ata-21)
  - [Electrical ATA 24](#electrical-ata-24)
  - [Indicating/Recording ATA 31](#indicating-recording-ata-31)
  - [Bleed Air ATA 36](#bleed-air-ata-36)
  - [Integrated Modular Avionics ATA 42](#integrated-modular-avionics-ata-42)

## Uncategorized

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

- A32NX_OVHD_ELEC_AC_ESS_FEED_PB_IS_NORMAL
    - Bool
    - True when the AC ESS FEED push button is NORMAL

## Air Conditioning Pressurisation Ventilation ATA 21

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

- A32NX_COND_{id}_DUCT_TEMP
    - Degree Celsius
    - Temperature of trim air coming out of the ducts in the cabin and cockpit
    - {id}
        - Same as A32NX_COND_{id}_TEMP

- A32NX_COND_PACK_{id}_IS_OPERATING
    - Bool
    - True when the pack operates normally (at least one FCV is open)
    - {id} 1 or 2

- A32NX_COND_PACK_{id}_OUTLET_TEMPERATURE
    - Degree Celsius
    - Outlet temperature of the packs
    - {id} 1 or 2

- A32NX_COND_{id}_TRIM_AIR_VALVE_POSITION
    - Percentage
    - Percentage opening of each trim air valve (hot air)
    - {id}
        - Same as A32NX_COND_{id}_TEMP

- A32NX_COND_HOT_AIR_VALVE_{id}_IS_ENABLED
    - Bool
    - True if the hot air valve {1 or 2} is enabled

- A32NX_COND_HOT_AIR_VALVE_{id}_IS_OPEN
    - Bool
    - True if the hot air valve {1 or 2} is open

- A32NX_COND_TADD_CHANNEL_FAILURE
    - Number
        - 0 if no failure
        - 1 or 2 if single channel failure (for failed channel id)
        - 3 if dual channel failure

- A32NX_VENT_PRIMARY_FANS_ENABLED
    - Bool
    - True if the primary (high pressure) fans are enabled and operating normally

- A32NX_VENT_{id}_EXTRACTION_FAN_ON
    - Bool
    - True when the the extraction fans of the fwd/bulk cargo compartment operate normally
    - {id}
        - FWD
        - BULK

- A32NX_VENT_{id}_ISOLATION_VALVE_OPEN
    - Bool
    - True when the isolation valves of the fwd/bulk cargo compartment are open
    - {id}
        - FWD
        - BULK

- A32NX_VENT_{id}_VCM_CHANNEL_FAILURE
    - Number
        - 0 if no failure
        - 1 or 2 if single channel failure (for failed channel id)
        - 3 if dual channel failure
    - {id}
        - FWD
        - AFT

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

## Indicating/Recording ATA 31

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
