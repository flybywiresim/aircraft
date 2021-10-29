# A320neo Custom Events

## Contents

1. [Autopilot](#autopilot)
    1. [Non internal events](#non-internal-events)
    1. [Internal events - not to be used for mapping](#internal-events---not-to-be-used-for-mapping)
1. [Throttle Mapping System](#throttle-mapping-system)

## Autopilot
### Non internal events

- A32NX.FCU_AP_{index}_PUSH
    - Trigger when button AP {index} is pushed on FCU

- A32NX.FCU_AP_DISCONNECT_PUSH
    - Trigger of red AP disconnection button (sidestick)

- A32NX.FCU_ATHR_PUSH
    - Trigger when button ATHR is pushed on FCU

- A32NX.FCU_ATHR_DISCONNECT_PUSH
    - Trigger when red ATHR disconnection button is pushed (on throttles)

- A32NX.FCU_SPD_INC
    - Triggered when SPD knob is **clockwise dialed** on FCU

- A32NX.FCU_SPD_DEC
    - Triggered when SPD knob is **anti-clockwise dialed** on FCU

- A32NX.FCU_SPD_SET
    - Triggered to set SPD/MACH value on FCU
    - Speed in knots (i.e. 250)
    - Mach * 100 (i.e. 78 for M 0.78)

- A32NX.FCU_SPD_PUSH
    - Triggered when SPD knob is **pushed** on FCU

- A32NX.FCU_SPD_PULL
    - Triggered when SPD knob is **pulled** on FCU

- A32NX.FCU_SPD_MACH_TOGGLE_PUSH
    - Triggered when SPD/MACH knob is **pushed** on FCU

- A32NX.FCU_HDG_INC
    - Triggered when HDG knob is **clockwise dialed** on FCU

- A32NX.FCU_HDG_DEC
    - Triggered when HDG knob is **anti-clockwise dialed** on FCU

- A32NX.FCU_HDG_SET
    - Triggered to set HDG/TRK value on FCU

- A32NX.FCU_HDG_PUSH
    - Triggered when HDG knob is **pushed** on FCU

- A32NX.FCU_HDG_PULL
    - Triggered when HDG knob is **pulled** on FCU

- A32NX.FCU_TRK_FPA_TOGGLE_PUSH
    - Triggered when TRK/FPA knob is **pushed** on FCU

- A32NX.FCU_ALT_INC
    - Triggered when ALT knob is **clockwise dialed** on FCU
    - Parameter value can be used to set the increment:
      Value | Meaning
      --- | ---
      0 | Use FCU setting
      100 | 100
      1000 | 1000

- A32NX.FCU_ALT_DEC
    - Triggered when ALT knob is **anti-clockwise dialed** on FCU
    - Parameter value can be used to set the decrement:
      Value | Meaning
      --- | ---
      0 | Use FCU setting
      100 | 100
      1000 | 1000

- A32NX.FCU_ALT_SET
    - Triggered to set ALT value on FCU
    - Value is rounded to 100 ft

- A32NX.FCU_ALT_INCREMENT_TOGGLE
    - Triggered to toggle ALT increment value on FCU

- A32NX.FCU_ALT_INCREMENT_SET
    - Triggered to set ALT increment value on FCU
    - Value can be either 100 or 1000, others are ignored

- A32NX.FCU_ALT_PUSH
    - Triggered when ALT knob is **pushed** on FCU

- A32NX.FCU_ALT_PULL
    - Triggered when ALT knob is **pulled** on FCU

- A32NX.FCU_VS_INC
    - Triggered when VS knob is **clockwise dialed** on FCU

- A32NX.FCU_VS_DEC
    - Triggered when VS knob is **anti-clockwise dialed** on FCU

- A32NX.FCU_VS_SET
    - Triggered to set VS/FPA value on FCU
    - VS in feet per minute (i.e. 500 for 500 ft/min)
    - FPA * 10 (i.e. 15 for 1.5°)

- A32NX.FCU_VS_PUSH
    - Triggered when V/S knob is **pushed** on FCU

- A32NX.FCU_VS_PULL
    - Triggered when V/S knob is **pulled** on FCU

- A32NX.FCU_LOC_PUSH
    - Triggered when LOC button is **pushed** on FCU

- A32NX.FCU_APPR_PUSH
    - Triggered when APPR button is **pushed** on FCU

- A32NX.FCU_EXPED_PUSH
    - Triggered when EXPEDITE button is **pushed** on FCU

- A32NX.FMGC_DIR_TO_TRIGGER
    - When triggered, the Autopilot is pushed into NAV mode

### Internal events - not to be used for mapping

- A32NX.FCU_TO_AP_HDG_PUSH
    - Triggered after HDG knob is **pushed** on FCU to notify autopilot

- A32NX.FCU_TO_AP_HDG_PULL
    - Triggered after HDG knob is **pulled** on FCU to notify autopilot

- A32NX.FCU_TO_AP_VS_PUSH
    - Triggered after V/S knob is **pushed** on FCU to notify autopilot

- A32NX.FCU_TO_AP_VS_PULL
    - Triggered after V/S knob is **pulled** on FCU to notify autopilot

- A32NX.ATHR_RESET_DISABLE
    - Resets permanently disabled A/THR system (after pressing ATHR disconnect for at least 15 s)

## Throttle Mapping System

- A32NX.THROTTLE_MAPPING_LOAD_FROM_FILE
    - When triggered the throttle mapping configuration is loaded from **file**

- A32NX.THROTTLE_MAPPING_LOAD_FROM_LOCAL_VARIABLES
    - When triggered the throttle mapping configuration is **loaded** from **local variables** (to test them)

- A32NX.THROTTLE_MAPPING_SAVE_TO_FILE
    - When triggered the throttle mapping configuration is **saved** from **file**
