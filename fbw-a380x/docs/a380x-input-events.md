# A380X Input Events

These input events represent the stable cockpit API for the A380X. They should be preferred over localvars or any other data access in all cases.

## Contents

- [A380X Input Events](#a380x-input-events)
  - [23 - Communications](#23---communications)

## 23 - Communications

### Placeholder Types

- `{rmp_prefix}`: `PED_RMP_1`, `PED_RMP_2`, or `OVHD_RMP_3`.
- `{vhf_index}` 1, 2, or 3
- `{hf_index}` 1, or 2
- `{tel_index}` 1, or 2
- `{adk_lsk_index}` 1, 2, or 3
- `{digit}` 1, 2, 3, 4, 5, 6, 7, 8, 9, `DOT`, or `CLR`

### RMP Input Events

- `B:A380X_{rmp_prefix}_VHF_PB`
    - This represents the VHF page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_VHF_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_VHF_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_HF_PB`
    - This represents the HF page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_HF_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_HF_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_TEL_PB`
    - This represents the TEL page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_TEL_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_TEL_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_SQWK_PB`
    - This represents the SQWK page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_SQWK_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_SQWK_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_BLANK_PB`
    - This represents the blank page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_BLANK_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_BLANK_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_MENU_PB`
    - This represents the MENU page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_MENU_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_MENU_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_NAV_PB`
    - This represents the NAV page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_NAV_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_NAV_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_ADK_{adk_lsk_index}_PB`
    - This represents the ADK pushbutton at the left of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_ADK_{adk_lsk_index}_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_ADK_{adk_lsk_index}_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_LSK_{adk_lsk_index}_PB`
    - This represents the LSK pushbutton at the right of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_LSK_{adk_lsk_index}_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_LSK_{adk_lsk_index}_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_MSG_CLR_PB`
    - This represents the MSG CLR pushbutton at the left of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_MSG_CLR_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_MSG_CLR_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_RST_PB`
    - This represents the RST pushbutton at the right of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_RST_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_RST_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_UP_PB`
    - This represents the UP arrow pushbutton at the right of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_UP_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_UP_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_DOWN_PB`
    - This represents the DOWN arrow pushbutton at the right of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_DOWN_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_DOWN_PB_Release`: releases the button

- `B:A380X_{rmp_prefix}_DIGIT_{digit}_PB`
    - This represents the keypad digit pushbutton.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_DIGIT_{digit}_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_DIGIT_{digit}_PB_Release`: releases the button

TODO CALL, volume, RX events
