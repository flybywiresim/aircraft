# A380X Input Events

These input events represent the stable cockpit API for the A380X. They should be preferred over localvars or any other data access in all cases.

## Notes on Maintenance

Please keep all IEs under the correct ATA chapter where they relate to aircraft systems, otherwise in the sim chapter, and in alphabetical order within sections.

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

- `B:A380X_{rmp_prefix}_ADK_{adk_lsk_index}_PB`
    - This represents the ADK pushbutton at the left of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_ADK_{adk_lsk_index}_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_ADK_{adk_lsk_index}_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_ADK_{adk_lsk_index}_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_ADK_{adk_lsk_index}_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_ADK_{adk_lsk_index}_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_BLANK_PB`
    - This represents the blank page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_BLANK_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_BLANK_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_BLANK_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_BLANK_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_BLANK_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_BRIGHTNESS`
    - This represents the brightness/off knob rotation state.
    - Value: percent brightness from 0 to 100%, with 0 being RMP off.
    - Bindings:
        - `B:A380X_{rmp_prefix}_BRIGHTNESS_KNOB_Inc`: increments/increases the volume
        - `B:A380X_{rmp_prefix}_BRIGHTNESS_KNOB_Dec`: decrements/decreases the volume
        - `B:A380X_{rmp_prefix}_BRIGHTNESS_KNOB_Set`: sets the volume from the parameter passed

- `B:A380X_{rmp_prefix}_CAB_CALL_{vhf_index}_PB`
    - This represents the CAB call button.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_CAB_CALL_{vhf_index}_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_CAB_CALL_{vhf_index}_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_CAB_CALL_{vhf_index}_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_CAB_CALL_{vhf_index}_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_CAB_CALL_{vhf_index}_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_CAB_VOL_KNOB`
    - This represents the volume knob rotation state.
    - Value: percent volume from 0 to 100%.
    - Bindings:
        - `B:A380X_{rmp_prefix}_CAB_VOL_KNOB_Inc`: increments/increases the volume
        - `B:A380X_{rmp_prefix}_CAB_VOL_KNOB_Dec`: decrements/decreases the volume
        - `B:A380X_{rmp_prefix}_CAB_VOL_KNOB_Set`: sets the volume from the parameter passed

- `B:A380X_{rmp_prefix}_CAB_VOL_PUSH`
    - This represents the knob being latched down to disable reception, or released up to enable reception.
    - Value: boolean indicating whether the knob is released/reception is requested on.
    - Bindings:
        - `B:A380X_{rmp_prefix}_CAB_VOL_PUSH_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_CAB_VOL_PUSH_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_CAB_VOL_PUSH_Push`: meaningless
        - `B:A380X_{rmp_prefix}_CAB_VOL_PUSH_Off`: turns reception off
        - `B:A380X_{rmp_prefix}_CAB_VOL_PUSH_On`: turns reception on
        - `B:A380X_{rmp_prefix}_CAB_VOL_PUSH_Toggle`: toggles reception on/off
        - `B:A380X_{rmp_prefix}_CAB_VOL_PUSH_Set`: meaningless

- `B:A380X_{rmp_prefix}_DIGIT_{digit}_PB`
    - This represents the keypad digit pushbutton.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_DIGIT_{digit}_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_DIGIT_{digit}_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_DIGIT_{digit}_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_DIGIT_{digit}_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_DIGIT_{digit}_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_DOWN_PB`
    - This represents the DOWN arrow pushbutton at the right of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_DOWN_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_DOWN_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_DOWN_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_DOWN_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_DOWN_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_HF_PB`
    - This represents the HF call button.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_HF_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_HF_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_HF_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_HF_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_HF_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_HF_CALL_{hf_index}_PB`
    - This represents the HF call button.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_HF_CALL_{hf_index}_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_HF_CALL_{hf_index}_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_HF_CALL_{hf_index}_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_HF_CALL_{hf_index}_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_HF_CALL_{hf_index}_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_PUSH`
    - This represents the knob being latched down to disable reception, or released up to enable reception.
    - Value: boolean indicating whether the knob is released/reception is requested on.
    - Bindings:
        - `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_PUSH_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_PUSH_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_PUSH_Push`: meaningless
        - `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_PUSH_Off`: turns reception off
        - `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_PUSH_On`: turns reception on
        - `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_PUSH_Toggle`: toggles reception on/off
        - `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_PUSH_Set`: meaningless

- `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_KNOB`
    - This represents the volume knob rotation state.
    - Value: percent volume from 0 to 100%.
    - Bindings:
        - `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_KNOB_Inc`: increments/increases the volume
        - `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_KNOB_Dec`: decrements/decreases the volume
        - `B:A380X_{rmp_prefix}_HF_VOL_{hf_index}_KNOB_Set`: sets the volume from the parameter passed

- `B:A380X_{rmp_prefix}_INT_RAD_SELECTOR`
    - This represents the int/rad selector switch.
    - Value: enum of the possible navaids:
        - INT
        - OFF
        - RAD
    - Bindings:
        - `B:A380X_{rmp_prefix}_INT_RAD_SELECTOR_Inc`: increments the selection
        - `B:A380X_{rmp_prefix}_INT_RAD_SELECTOR_Dec`: decrements the selection
        - `B:A380X_{rmp_prefix}_INT_RAD_SELECTOR_Set`: sets the selection from the parameter passed
        - `B:A380X_{rmp_prefix}_INT_RAD_SELECTOR_INT`: sets INT as the active mode
        - `B:A380X_{rmp_prefix}_INT_RAD_SELECTOR_OFF`: sets off as the active mode
        - `B:A380X_{rmp_prefix}_INT_RAD_SELECTOR_RAD`: sets RAD as the active mode

- `B:A380X_{rmp_prefix}_INT_VOL_KNOB`
    - This represents the volume knob rotation state.
    - Value: percent volume from 0 to 100%.
    - Bindings:
        - `B:A380X_{rmp_prefix}_INT_VOL_KNOB_Inc`: increments/increases the volume
        - `B:A380X_{rmp_prefix}_INT_VOL_KNOB_Dec`: decrements/decreases the volume
        - `B:A380X_{rmp_prefix}_INT_VOL_KNOB_Set`: sets the volume from the parameter passed

- `B:A380X_{rmp_prefix}_INT_VOL_PUSH`
    - This represents the knob being latched down to disable reception, or released up to enable reception.
    - Value: boolean indicating whether the knob is released/reception is requested on.
    - Bindings:
        - `B:A380X_{rmp_prefix}_INT_VOL_PUSH_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_INT_VOL_PUSH_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_INT_VOL_PUSH_Push`: meaningless
        - `B:A380X_{rmp_prefix}_INT_VOL_PUSH_Off`: turns reception off
        - `B:A380X_{rmp_prefix}_INT_VOL_PUSH_On`: turns reception on
        - `B:A380X_{rmp_prefix}_INT_VOL_PUSH_Toggle`: toggles reception on/off
        - `B:A380X_{rmp_prefix}_INT_VOL_PUSH_Set`: meaningless

- `B:A380X_{rmp_prefix}_LSK_{adk_lsk_index}_PB`
    - This represents the LSK pushbutton at the right of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_LSK_{adk_lsk_index}_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_LSK_{adk_lsk_index}_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_LSK_{adk_lsk_index}_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_LSK_{adk_lsk_index}_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_LSK_{adk_lsk_index}_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_MECH_CALL_PB`
    - This represents the MECH call button.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_MECH_CALL_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_MECH_CALL_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_MECH_CALL_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_MECH_CALL_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_MECH_CALL_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_MENU_PB`
    - This represents the MENU page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_MENU_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_MENU_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_MENU_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_MENU_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_MENU_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_MSG_CLR_PB`
    - This represents the MSG CLR pushbutton at the left of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_MSG_CLR_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_MSG_CLR_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_MSG_CLR_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_MSG_CLR_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_MSG_CLR_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_NAV_PB`
    - This represents the NAV page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_NAV_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_NAV_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_NAV_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_NAV_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_NAV_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_NAV_SEL_KNOB`
    - This represents the selected navaid knob, selecting which navaid is currently listened to.
    - Value: enum of the possible navaids:
        - ADF 1
        - ADF 2
        - LS
        - VOR 1
        - VOR 2
        - MKR
    - Bindings:
        - `B:A380X_{rmp_prefix}_NAV_SEL_KNOB_Inc`: increments the selection
        - `B:A380X_{rmp_prefix}_NAV_SEL_KNOB_Dec`: decrements the selection
        - `B:A380X_{rmp_prefix}_NAV_SEL_KNOB_Set`: sets the selection from the parameter passed
        - `B:A380X_{rmp_prefix}_NAV_SEL_KNOB_ADF_1`: sets ADF 1 as the selected navaid
        - `B:A380X_{rmp_prefix}_NAV_SEL_KNOB_ADF_2`: sets ADF 2 as the selected navaid
        - `B:A380X_{rmp_prefix}_NAV_SEL_KNOB_LS`: sets the landing system as the selected navaid
        - `B:A380X_{rmp_prefix}_NAV_SEL_KNOB_VOR_1`: sets VOR 1 as the selected navaid
        - `B:A380X_{rmp_prefix}_NAV_SEL_KNOB_VOR_2`: sets VOR 2 as the selected navaid
        - `B:A380X_{rmp_prefix}_NAV_SEL_KNOB_MKR`: sets the marker beacon as the selected navaid

- `B:A380X_{rmp_prefix}_NAV_VOL_KNOB`
    - This represents the volume knob rotation state.
    - Value: percent volume from 0 to 100%.
    - Bindings:
        - `B:A380X_{rmp_prefix}_NAV_VOL_KNOB_Inc`: increments/increases the volume
        - `B:A380X_{rmp_prefix}_NAV_VOL_KNOB_Dec`: decrements/decreases the volume
        - `B:A380X_{rmp_prefix}_NAV_VOL_KNOB_Set`: sets the volume from the parameter passed

- `B:A380X_{rmp_prefix}_NAV_VOL_PUSH`
    - This represents the knob being latched down to disable reception, or released up to enable reception.
    - Value: boolean indicating whether the knob is released/reception is requested on.
    - Bindings:
        - `B:A380X_{rmp_prefix}_NAV_VOL_PUSH_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_NAV_VOL_PUSH_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_NAV_VOL_PUSH_Push`: meaningless
        - `B:A380X_{rmp_prefix}_NAV_VOL_PUSH_Off`: turns reception off
        - `B:A380X_{rmp_prefix}_NAV_VOL_PUSH_On`: turns reception on
        - `B:A380X_{rmp_prefix}_NAV_VOL_PUSH_Toggle`: toggles reception on/off
        - `B:A380X_{rmp_prefix}_NAV_VOL_PUSH_Set`: meaningless

- `B:A380X_{rmp_prefix}_PA_CALL_{vhf_index}_PB`
    - This represents the PA call button.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_PA_CALL_{vhf_index}_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_PA_CALL_{vhf_index}_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_PA_CALL_{vhf_index}_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_PA_CALL_{vhf_index}_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_PA_CALL_{vhf_index}_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_PA_VOL_KNOB`
    - This represents the volume knob rotation state.
    - Value: percent volume from 0 to 100%.
    - Bindings:
        - `B:A380X_{rmp_prefix}_PA_VOL_KNOB_Inc`: increments/increases the volume
        - `B:A380X_{rmp_prefix}_PA_VOL_KNOB_Dec`: decrements/decreases the volume
        - `B:A380X_{rmp_prefix}_PA_VOL_KNOB_Set`: sets the volume from the parameter passed

- `B:A380X_{rmp_prefix}_PA_VOL_PUSH`
    - This represents the knob being latched down to disable reception, or released up to enable reception.
    - Value: boolean indicating whether the knob is released/reception is requested on.
    - Bindings:
        - `B:A380X_{rmp_prefix}_PA_VOL_PUSH_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_PA_VOL_PUSH_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_PA_VOL_PUSH_Push`: meaningless
        - `B:A380X_{rmp_prefix}_PA_VOL_PUSH_Off`: turns reception off
        - `B:A380X_{rmp_prefix}_PA_VOL_PUSH_On`: turns reception on
        - `B:A380X_{rmp_prefix}_PA_VOL_PUSH_Toggle`: toggles reception on/off
        - `B:A380X_{rmp_prefix}_PA_VOL_PUSH_Set`: meaningless

- `B:A380X_{rmp_prefix}_RST_PB`
    - This represents the RST pushbutton at the right of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_RST_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_RST_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_RST_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_RST_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_RST_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_STBY_NAV_COVER`
    - This represents the transparent cover over the standby radio navigation pushbutton.
    - Value: boolean indicating whether the cover is open.
    - Bindings:
        - `B:A380X_{rmp_prefix}_STBY_NAV_COVER_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_STBY_NAV_COVER_Close`: closes the cover
        - `B:A380X_{rmp_prefix}_STBY_NAV_COVER_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_STBY_NAV_COVER_Open`: opens the cover
        - `B:A380X_{rmp_prefix}_STBY_NAV_COVER_Push`: meaningless
        - `B:A380X_{rmp_prefix}_STBY_NAV_COVER_Release`: meaningless
        - `B:A380X_{rmp_prefix}_STBY_NAV_COVER_Toggle`: toggles the cover open or closed
        - `B:A380X_{rmp_prefix}_STBY_NAV_COVER_Set`: meaningless

- `B:A380X_{rmp_prefix}_STBY_NAV_PB`
    - This represents the standby radio navigation pushbutton, under the cover.
    - Value: boolean indicating whether standby radio navigation is active.
    - Bindings:
        - `B:A380X_{rmp_prefix}_STBY_NAV_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_STBY_NAV_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_STBY_NAV_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_STBY_NAV_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_STBY_NAV_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_SQWK_PB`
    - This represents the SQWK page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_SQWK_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_SQWK_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_SQWK_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_SQWK_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_SQWK_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_TEL_PB`
    - This represents the TEL call button.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_TEL_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_TEL_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_TEL_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_TEL_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_TEL_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_TEL_CALL_{tel_index}_PB`
    - This represents the TEL call button.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_TEL_CALL_{tel_index}_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_TEL_CALL_{tel_index}_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_TEL_CALL_{tel_index}_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_TEL_CALL_{tel_index}_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_TEL_CALL_{tel_index}_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_PUSH`
    - This represents the knob being latched down to disable reception, or released up to enable reception.
    - Value: boolean indicating whether the knob is released/reception is requested on.
    - Bindings:
        - `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_PUSH_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_PUSH_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_PUSH_Push`: meaningless
        - `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_PUSH_Off`: turns reception off
        - `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_PUSH_On`: turns reception on
        - `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_PUSH_Toggle`: toggles reception on/off
        - `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_PUSH_Set`: meaningless

- `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_KNOB`
    - This represents the volume knob rotation state.
    - Value: percent volume from 0 to 100%.
    - Bindings:
        - `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_KNOB_Inc`: increments/increases the volume
        - `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_KNOB_Dec`: decrements/decreases the volume
        - `B:A380X_{rmp_prefix}_TEL_VOL_{tel_index}_KNOB_Set`: sets the volume from the parameter passed

- `B:A380X_{rmp_prefix}_UP_PB`
    - This represents the UP arrow pushbutton at the right of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_UP_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_UP_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_UP_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_UP_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_UP_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_VHF_PB`
    - This represents the VHF page pushbutton at the top of the RMP.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_VHF_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_VHF_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_VHF_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_VHF_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_VHF_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_VHF_CALL_{vhf_index}_PB`
    - This represents the VHF call button.
    - Value: boolean indicating whether the button is pressed.
    - Bindings:
        - `B:A380X_{rmp_prefix}_VHF_CALL_{vhf_index}_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_VHF_CALL_{vhf_index}_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_VHF_CALL_{vhf_index}_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_VHF_CALL_{vhf_index}_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_VHF_CALL_{vhf_index}_PB_Set`: meaningless

- `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_PUSH`
    - This represents the knob being latched down to disable reception, or released up to enable reception.
    - Value: boolean indicating whether the knob is released/reception is requested on.
    - Bindings:
        - `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_PUSH_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_PUSH_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_PUSH_Push`: meaningless
        - `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_PUSH_Off`: turns reception off
        - `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_PUSH_On`: turns reception on
        - `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_PUSH_Toggle`: toggles reception on/off
        - `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_PUSH_Set`: meaningless

- `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_KNOB`
    - This represents the volume knob rotation state.
    - Value: percent volume from 0 to 100%.
    - Bindings:
        - `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_KNOB_Inc`: increments/increases the volume
        - `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_KNOB_Dec`: decrements/decreases the volume
        - `B:A380X_{rmp_prefix}_VHF_VOL_{vhf_index}_KNOB_Set`: sets the volume from the parameter passed

- `B:A380X_{rmp_prefix}_VOICE_PB`
    - This represents the navaid voice filter pushbutton.
    - Value: boolean indicating whether the voice filter is on.
    - Bindings:
        - `B:A380X_{rmp_prefix}_VOICE_PB_Inc`: meaningless
        - `B:A380X_{rmp_prefix}_VOICE_PB_Dec`: meaningless
        - `B:A380X_{rmp_prefix}_VOICE_PB_Push`: pushes the button
        - `B:A380X_{rmp_prefix}_VOICE_PB_Release`: releases the button
        - `B:A380X_{rmp_prefix}_VOICE_PB_Set`: meaningless
