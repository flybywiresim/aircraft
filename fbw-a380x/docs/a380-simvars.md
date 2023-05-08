# A380 Local SimVars

## Contents

- [A380 Local SimVars](#a380-local-simvars)
  - [Air Conditioning / Pressurisation / Ventilation ATA21](#air-conditioning-pressurisation-ventilation-ata-21)
  - [Indicating/Recording ATA 31](#indicating-recording-ata-31)
  - [Bleed Air ATA 36](#bleed-air-ata-36)
  - [Integrated Modular Avionics ATA 42](#integrated-modular-avionics-ata-42)

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

- A32NX_COND_{id}_DUCT_TEMP
    - Degree Celsius
    - Temperature of trim air coming out of the ducts in the cabin and cockpit
    - {id}
        - Same as A32NX_COND_{id}_TEMP

- A32NX_COND_{id}_TRIM_AIR_VALVE_POSITION
    - Percentage
    - Percentage opening of each trim air valve (hot air)
    - {id}
        - Same as A32NX_COND_{id}_TEMP

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
