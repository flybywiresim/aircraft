# A32NX Input Events

These input events represent the stable cockpit API for the A32NX. They should be preferred over localvars or any other data access in all cases.

## Notes on Maintenance

Please keep all IEs under the correct ATA chapter where they relate to aircraft systems, otherwise in the sim chapter, and in alphabetical order within sections.

## Contents

- [A32NX Input Events](#a32nx-input-events)
  - [Notes on Maintenance](#notes-on-maintenance)
  - [Contents](#contents)
  - [31 - Indication and Recording Systems](#31---indication-and-recording-systems)
    - [ECP Warning Input Events](#ecp-warning-input-events)
    - [ECP System Input Events](#ecp-system-input-events)

## 31 - Indication and Recording Systems

### ECP Warning Input Events

- `B:A32NX_PED_ECP_CLR_1_PB`, `B:A32NX_PED_ECP_CLR_2_PB`
  - This represents the CLR (clear) pushbuttons on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_CLR_{1|2}_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_CLR_{1|2}_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_CLR_{1|2}_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_CLR_{1|2}_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_CLR_{1|2}_PB_Set`: meaningless

- `B:A32NX_PED_ECP_STS_PB`
  - This represents the STS (status) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_STS_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_STS_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_STS_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_STS_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_STS_PB_Set`: meaningless

- `B:A32NX_PED_ECP_RCL_PB`
  - This represents the RCL (recall) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_RCL_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_RCL_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_RCL_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_RCL_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_RCL_PB_Set`: meaningless

- `B:A32NX_PED_ECP_EMER_CANCEL_PB`
  - This represents the EMER CANC (emeregency cancel) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_EMER_CANCEL_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_EMER_CANCEL_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_EMER_CANCEL_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_EMER_CANCEL_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_EMER_CANCEL_PB_Set`: meaningless

- `B:A32NX_PED_ECP_EMER_CANCEL_COVER`
  - This represents the transparent cover over the standby radio navigation pushbutton.
  - Value: boolean indicating whether the cover is open.
  - Bindings:
    - `B:A32NX_PED_ECP_EMER_CANCEL_COVER_Inc`: meaningless
    - `B:A32NX_PED_ECP_EMER_CANCEL_COVER_Close`: closes the cover
    - `B:A32NX_PED_ECP_EMER_CANCEL_COVER_Dec`: meaningless
    - `B:A32NX_PED_ECP_EMER_CANCEL_COVER_Open`: opens the cover
    - `B:A32NX_PED_ECP_EMER_CANCEL_COVER_Push`: meaningless
    - `B:A32NX_PED_ECP_EMER_CANCEL_COVER_Release`: meaningless
    - `B:A32NX_PED_ECP_EMER_CANCEL_COVER_Toggle`: toggles the cover open or closed
    - `B:A32NX_PED_ECP_EMER_CANCEL_COVER_Set`: meaningless

- `B:A32NX_PED_ECP_TO_CONF_TEST_PB`
  - This represents the T.O CONFIG (takeoff config test) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_TO_CONF_TEST_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_TO_CONF_TEST_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_TO_CONF_TEST_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_TO_CONF_TEST_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_TO_CONF_TEST_PB_Set`: meaningless

### ECP System Input Events

- `B:A32NX_PED_ECP_ENG_PB`
  - This represents the ENG (engine page) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_ENG_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_ENG_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_ENG_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_ENG_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_ENG_PB_Set`: meaningless

- `B:A32NX_PED_ECP_BLEED_PB`
  - This represents the BLEED (bleed air page) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_BLEED_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_BLEED_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_BLEED_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_BLEED_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_BLEED_PB_Set`: meaningless

- `B:A32NX_PED_ECP_APU_PB`
  - This represents the APU (auxiliary power unit page) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_APU_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_APU_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_APU_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_APU_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_APU_PB_Set`: meaningless

- `B:A32NX_PED_ECP_HYD_PB`
  - This represents the HYD (hydraulics page) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_HYD_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_HYD_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_HYD_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_HYD_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_HYD_PB_Set`: meaningless

- `B:A32NX_PED_ECP_ELEC_PB`
  - This represents the ELEC (electrical page) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_ELEC_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_ELEC_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_ELEC_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_ELEC_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_ELEC_PB_Set`: meaningless

- `B:A32NX_PED_ECP_COND_PB`
  - This represents the COND (air conditioning page) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_COND_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_COND_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_COND_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_COND_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_COND_PB_Set`: meaningless

- `B:A32NX_PED_ECP_PRESS_PB`
  - This represents the PRESS (pressurisation page) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_PRESS_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_PRESS_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_PRESS_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_PRESS_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_PRESS_PB_Set`: meaningless

- `B:A32NX_PED_ECP_FUEL_PB`
  - This represents the FUEL (fuel page) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_FUEL_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_FUEL_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_FUEL_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_FUEL_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_FUEL_PB_Set`: meaningless

- `B:A32NX_PED_ECP_FLT_CTL_PB`
  - This represents the F CTL (flight control page) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_FLT_CTL_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_FLT_CTL_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_FLT_CTL_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_FLT_CTL_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_FLT_CTL_PB_Set`: meaningless

- `B:A32NX_PED_ECP_DOOR_PB`
  - This represents the DOOR (door page) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_DOOR_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_DOOR_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_DOOR_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_DOOR_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_DOOR_PB_Set`: meaningless

- `B:A32NX_PED_ECP_BRAKES_PB`
  - This represents the BRAKES (wheel/brake page) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_BRAKES_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_BRAKES_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_BRAKES_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_BRAKES_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_BRAKES_PB_Set`: meaningless

- `B:A32NX_PED_ECP_ALL_PB`
  - This represents the ALL (cycle all system pages) pushbutton on the ECP.
  - Value: boolean indicating whether the button is pressed.
  - Bindings:
    - `B:A32NX_PED_ECP_ALL_PB_Inc`: meaningless
    - `B:A32NX_PED_ECP_ALL_PB_Dec`: meaningless
    - `B:A32NX_PED_ECP_ALL_PB_Push`: pushes the button
    - `B:A32NX_PED_ECP_ALL_PB_Release`: releases the button
    - `B:A32NX_PED_ECP_ALL_PB_Set`: meaningless
