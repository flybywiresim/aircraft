# A380X Private Local Vars

These local vars are for internal use only! They should not be considered a stable interface for external users. You may use the associated input events to access the functions instead.

## Contents

- [A380X Private Local Vars](#a380x-private-local-vars)
  - [23 - Communications](#23---communications)

## 23 - Communications

### Placeholder Types

- `{rmp_index}` 1, 2, or 3
- `{vhf_index}` 1, 2, or 3
- `{hf_index}` 1, or 2
- `{tel_index}` 1, or 2

### Local Vars

- `L:A380X_RMP{rmp_index}_ATT_TX`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP{rmp_index}_CAB_RX`
    - Boolean
    - Indicates the state of the knob to toggle reception on/off.

- `L:A380X_RMP{rmp_index}_CAB_VOL`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP{rmp_index}_HF_RX_{vhf_index}`
    - Boolean
    - Indicates the state of the knob to toggle reception on/off.

- `L:A380X_RMP{rmp_index}_HF_TX_{hf_index}`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP{rmp_index}_HF_VOL_{vhf_index}`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP{rmp_index}_INT_RX`
    - Boolean
    - Indicates the state of the knob to toggle reception on/off.

- `L:A380X_RMP{rmp_index}_INT_VOL`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP{rmp_index}_MECH_TX`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP{rmp_index}_PA_RX`
    - Boolean
    - Indicates the state of the knob to toggle reception on/off.

- `L:A380X_RMP{rmp_index}_PA_TX`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP{rmp_index}_PA_VOL`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP{rmp_index}_RAD_NAV_RX`
    - Boolean
    - Indicates the state of the knob to toggle reception on/off.

- `L:A380X_RMP{rmp_index}_RAD_NAV_SELECT`
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

- `L:A380X_RMP{rmp_index}_RAD_NAV_FILTER`
    - Boolean
    - Indicates whether the voice filter (to filter out ident morse codes) is on/off.

- `L:A380X_RMP{rmp_index}_RAD_NAV_VOL`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP{rmp_index}_TEL_RX_{tel_index}`
    - Boolean
    - Indicates the state of the knob to toggle reception on/off.

- `L:A380X_RMP{rmp_index}_TEL_TX_{hf_index}`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP{rmp_index}_TEL_VOL_{tel_index}`
    - Percent
    - Indicates the position of the volume knob.

- `L:A380X_RMP{rmp_index}_VHF_RX_{hf_index}`
    - Boolean
    - Indicates the state of the knob to toggle reception on/off.

- `L:A380X_RMP{rmp_index}_VHF_TX_{hf_index}`
    - Boolean
    - Indicates whether transmission is on/off.

- `L:A380X_RMP{rmp_index}_VHF_VOL_{hf_index}`
    - Percent
    - Indicates the position of the volume knob.
