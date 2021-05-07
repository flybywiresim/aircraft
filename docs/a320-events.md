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

- A32NX.FCU_SPD_PUSH
    - Triggered when SPD knob is **pushed** on FCU

- A32NX.FCU_SPD_PULL
    - Triggered when SPD knob is **pulled** on FCU

- A32NX.FCU_SPD_MACH_TOGGLE_PUSH
    - Triggered when SPD/MACH knob is **pushed** on FCU

- A32NX.FCU_HDG_PUSH
    - Triggered when HDG knob is **pushed** on FCU

- A32NX.FCU_HDG_PULL
    - Triggered when HDG knob is **pulled** on FCU

- A32NX.FCU_TRK_FPA_TOGGLE_PUSH
    - Triggered when TRK/FPA knob is **pushed** on FCU

- A32NX.FCU_ALT_PUSH
    - Triggered when ALT knob is **pushed** on FCU

- A32NX.FCU_ALT_PULL
    - Triggered when ALT knob is **pulled** on FCU

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
## Throttle Mapping System

- A32NX.THROTTLE_MAPPING_LOAD_FROM_FILE
    - When triggered the throttle mapping configuration is loaded from **file**

- A32NX.THROTTLE_MAPPING_LOAD_FROM_LOCAL_VARIABLES
    - When triggered the throttle mapping configuration is **loaded** from **local variables** (to test them)

- A32NX.THROTTLE_MAPPING_SAVE_TO_FILE
    - When triggered the throttle mapping configuration is **saved** from **file**
