# A380X Private Local Vars

These local vars are for internal use only! They should not be considered a stable interface for external users. You may use the associated input events to access the functions instead.

## Notes on Maintenance

Please keep all vars under the correct ATA chapter where they relate to aircraft systems, otherwise in the sim chapter, and in alphabetical order within sections.

## Contents

- [A380X Private Local Vars](#a380x-private-local-vars)
  - [23 - Communications](#23---communications)
  - [Sim Specific](#sim-specific)

## 23 - Communications

### Placeholder Types

- `{rmp_index}` 1, 2, or 3
- `{vhf_index}` 1, 2, or 3
- `{hf_index}` 1, or 2
- `{tel_index}` 1, or 2

### Local Vars

- `L:A380X_RMP_{rmp_index}_CAB_CALL`
    - Boolean
    - Indicates an incoming call.

- `L:A380X_RMP_{rmp_index}_CAB_RX`
    - Boolean
    - Indicates the state of reception from the RMP..

- `L:A380X_RMP_{rmp_index}_CAB_RX_SWITCH`
    - Boolean
    - Indicates the physical state of the switch to toggle reception on/off

- `L:A380X_RMP_{rmp_index}_CAB_TX`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP_{rmp_index}_CAB_VOL`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP_{rmp_index}_GREEN_LED`
    - Boolean
    - Indicates that the GREEN LED next to the brightness knob is on (means the RMP is powered but turned off/in standby).

- `L:A380X_RMP_{rmp_index}_HF_CALL_{hf_index}`
    - Boolean
    - Indicates an incoming call.

- `L:A380X_RMP_{rmp_index}_HF_RX_{hf_index}`
    - Boolean
    - Indicates the state of reception from the RMP..

- `L:A380X_RMP_{rmp_index}_HF_RX_SWITCH_{hf_index}`
    - Boolean
    - Indicates the physical state of the switch to toggle reception on/off

- `L:A380X_RMP_{rmp_index}_HF_TX_{hf_index}`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP_{rmp_index}_HF_VOL_{hf_index}`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP_{rmp_index}_INT_CALL`
    - Boolean
    - Indicates an incoming call.

- `L:A380X_RMP_{rmp_index}_INT_RX`
    - Boolean
    - Indicates the state of reception from the RMP..

- `L:A380X_RMP_{rmp_index}_INT_RX_SWITCH`
    - Boolean
    - Indicates the physical state of the switch to toggle reception on/off

- `L:A380X_RMP_{rmp_index}_INT_RX_SWITCH`
    - Boolean
    - Indicates the physical state of the switch to toggle reception on/off

- `L:A380X_RMP_{rmp_index}_INT_TX`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP_{rmp_index}_INT_VOL`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP_{rmp_index}_MECH_TX`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP_{rmp_index}_PA_RX`
    - Boolean
    - Indicates the state of reception from the RMP..

- `L:A380X_RMP_{rmp_index}_PA_RX_SWITCH`
    - Boolean
    - Indicates the physical state of the switch to toggle reception on/off

- `L:A380X_RMP_{rmp_index}_PA_RX_SWITCH`
    - Boolean
    - Indicates the physical state of the switch to toggle reception on/off

- `L:A380X_RMP_{rmp_index}_PA_TX`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP_{rmp_index}_PA_VOL`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP_{rmp_index}_NAV_RX`
    - Boolean
    - Indicates the state of reception from the RMP..

- `L:A380X_RMP_{rmp_index}_NAV_RX_SWITCH`
    - Boolean
    - Indicates the physical state of the switch to toggle reception on/off

- `L:A380X_RMP_{rmp_index}_NAV_RX_SWITCH`
    - Boolean
    - Indicates the physical state of the switch to toggle reception on/off

- `L:A380X_RMP_{rmp_index}_NAV_SELECT`
    - Enum
    - Indicates which radio navaid is selected for audio reception.
    -   | State  | Number |
        |--------|--------|
        | ADF1   | 0      |
        | ADF2   | 1      |
        | LS     | 2      |
        | VOR1   | 3      |
        | VOR2   | 4      |
        | MKR    | 5      |

- `L:A380X_RMP_{rmp_index}_NAV_FILTER`
    - Boolean
    - Indicates whether the voice filter (to filter out ident morse codes) is on/off.

- `L:A380X_RMP_{rmp_index}_NAV_VOL`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP_{rmp_index}_RED_LED`
    - Boolean
    - Indicates that the RED LED next to the brightness knob is on (means the RMP is failed).

- `L:A380X_RMP_{rmp_index}_RST_LED`
    - Boolean
    - Indicates when the RST button LED is lit (a call can be reset).

- `L:A380X_RMP_{rmp_index}_STBY_NAV`
    - Boolean
    - Indicates whether standby radio nav is on or off.

- `L:A380X_RMP_{rmp_index}_TEL_CALL_{tel_index}`
    - Boolean
    - Indicates an incoming call.

- `L:A380X_RMP_{rmp_index}_TEL_RX_{tel_index}`
    - Boolean
    - Indicates the state of reception from the RMP..

- `L:A380X_RMP_{rmp_index}_TEL_RX_SWITCH_{tel_index}`
    - Boolean
    - Indicates the physical state of the switch to toggle reception on/off

- `L:A380X_RMP_{rmp_index}_TEL_TX_{tel_index}`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP_{rmp_index}_TEL_VOL_{tel_index}`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP_{rmp_index}_VHF_CALL_{vhf_index}`
    - Boolean
    - Indicates an incoming call.

- `L:A380X_RMP_{rmp_index}_VHF_RX_{vhf_index}`
    - Boolean
    - Indicates the state of reception from the RMP..

- `L:A380X_RMP_{rmp_index}_VHF_RX_SWITCH_{vhf_index}`
    - Boolean
    - Indicates the physical state of the switch to toggle reception on/off

- `L:A380X_RMP_{rmp_index}_VHF_TX_{vhf_index}`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP_{rmp_index}_VHF_VOL_{vhf_index}`
    - Percent
    - Indicates the position of the volume knob.

- `L:FBW_RMP{rmp_index}_PRIMARY_VHF{vhf_index}_FREQUENCY`
    - ARINC429 - BCD VHF COM Frequency
    - The primary bus frequency output from the RMP to the VHF radios.

- `L:FBW_RMP{rmp_index}_BACKUP_VHF{vhf_index}_FREQUENCY`
    - ARINC429 - BCD VHF COM Frequency
    - The backup bus frequency output from the RMP to the VHF radios.

- `L:FBW_VHF{vhf_index}_BUS_A`
    - Boolean
    - The hardwired bus select discrete to the VHF radios.

- `L:FBW_VHF{vhf_index}_FREQUENCY`
    - ARINC429 - BCD VHF COM Frequency
    - The tuned frequency from the VHF radios.

## Sim Specific

### Local Vars

- `L:A380X_PILOT_IN_FO_SEAT`
    - Boolean
    - Whether the pilot is sitting on the first officer's half of the cockpit.
