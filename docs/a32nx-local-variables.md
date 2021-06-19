# FlyByWire A32NX Local Variables

This list shall give an overview of the additional local variables
(LVARs) the A32NX has defined. If anything is missing there is a chance
that the A32NX uses the standard SIMCONNECT or MSFS vars and events.

Sometimes there are even both available, e.g. parking brake can be set
via SIMCONNECT:PARKING_BRAKE toggle-event. But the park brake lever
position in the A32NX has its own LVAR:A32NX_PARK_BRAKE_LEVER_POS.

This list grows continuously as the FlyByWire A32NX is evolving further.
Changes are to be expected when new functionality is added or variables
are renamed to be more logical and consistent.

## Aircraft systems

ATA Reference:
[http://www.s-techent.com/ATA100.htm](http://www.s-techent.com/ATA100.htm)

| ATA Number | ATA Chapter name                                                                                                                |
|:-----------|:--------------------------------------------------------------------------------------------------------------------------------|
| ATA 21     | [AIR CONDITIONING](#ata21-air-conditioning)                                                                                     |
| ATA 22     | [AUTO FLIGHT](#ata22-auto-flight)                                                                                               |
| ATA 22-10  | [AUTO FLIGHT: Autpilot](#ata22-10-auto-flight-autpilot)                                                                         |
| ATA 22-30  | [AUTO FLIGHT: Autothrust](#ata22-30-auto-flight-autothrust)                                                                     |
| ATA 23     | [COMMUNICATION](#ata23-communication)                                                                                           |
| ATA 24     | [ELECTRICAL POWER](#ata24-electrical-power)                                                                                     |
| ATA 25-60  | [EQUIPMENT/FURNISHINGS: EMERGENCY](#ata25-60-equipmentfurnishings-emergency)                                                    |
| ATA 26     | [FIRE PROTECTION](#ata26-fire-protection)                                                                                       |
| ATA 27     | [FLIGHT CONTROLS](#ata27-flight-controls)                                                                                       |
| ATA 28     | [FUEL](#ata28-fuel)                                                                                                             |
| ATA 29     | [HYDRAULIC POWER](#ata29-hydraulic-power)                                                                                       |
| ATA 30     | [ICE AND RAIN PROTECTION](#ata30-ice-and-rain-protection)                                                                       |
| ATA 32     | [LANDING GEAR](#ata32-landing-gear)                                                                                             |
| ATA 32-40  | [LANDING GEAR: Brakes](#ata32-40-landing-gear-brakes)                                                                           |
| ATA 33     | [LIGHTS](#ata33-lights)                                                                                                         |
| ATA 34     | [ATA34 NAVIGATION](#ata34-navigation)                                                                                           |
| ATA 34-10  | [NAVIGATION: FLIGHT ENVIRONMENT DATA](#ata34-10-navigation-flight-environment-data)                                             |
| ATA 34-40  | [NAVIGATION: INDEPENDENT POSITION DETERMINING](#ata34-40-navigation-independent-position-determining)                           |
| ATA 34-50  | [NAVIGATION: DEPENDENT POSITION DETERMINING](#ata34-50-navigation-dependent-position-determining)                               |
| ATA 34-60  | [NAVIGATION: FLIGHT MANAGEMENT COMPUTING](#ata34-60-navigation-flight-management-computing)                                     |
| ATA 35     | [OXYGEN](#ata35-oxygen)                                                                                                         |
| ATA 39     | [ELECTRICAL - ELECTRONIC PANELS AND MULTIPURPOSE COMPONENTS](#ata39-electrical---electronic-panels-and-multipurpose-components) |
| ATA 45     | [ONBOARD MAINTENANCE SYSTEMS (OMS)](#ata45-onboard-maintenance-systems-oms)                                                     |
| ATA 49     | [(AIRBORNE) AUXILIARY POWER UNIT](#ata49-auxiliary-power-unit)                                                                  |

## Power Plant

| ATA Number | ATA Chapter name                                              |
|:-----------|:--------------------------------------------------------------|
| ATA 72     | [ENGINE](#ata72-engine)                                       |
| ATA 73     | [ENGINE - FUEL AND CONTROL](#ata73-engine---fuel-and-control) |
| ATA 75     | [BLEED AIR](#ata75-bleed-air)                                 |
| ATA 77     | [ENGINE INDICATING](#ata77-engine-indicating)                 |
| ATA 79     | [OIL](#ata79-oil)                                             |
| ATA 80     | [STARTING](#ata80-starting)                                   |

## MISCELLANEOUS

| ATA Number | ATA Chapter name                                             |
|:-----------|:-------------------------------------------------------------|
| ATA 115    | [FLIGHT SIMULATOR SYSTEMS](#ata115-flight-simulator-systems) |

--------------------------------------------------------------------------------

## ATA21 AIR CONDITIONING

| Name                                      | Type           | Description                                                                                                   |
|:------------------------------------------|:---------------|:--------------------------------------------------------------------------------------------------------------|
| A32NX_AIRCOND_HOTAIR_FAULT                | Boolean        | True if fault in hot air system                                                                               |
| A32NX_AIRCOND_HOTAIR_TOGGLE               | Boolean        | True if hot air system is on                                                                                  |
| A32NX_AIRCOND_PACK1_FAULT                 | Boolean        | True if fault in pack 1                                                                                       |
| A32NX_AIRCOND_PACK1_TOGGLE                | Boolean        | True if pack 1 is on                                                                                          |
| A32NX_AIRCOND_PACK2_FAULT                 | Boolean        | True if fault in pack 2                                                                                       |
| A32NX_AIRCOND_PACK2_TOGGLE                | Boolean        | True if pack 2 is on                                                                                          |
| A32NX_AIRCOND_RAMAIR_TOGGLE               | Boolean        | True if ram air is on                                                                                         |
|                                           |                |                                                                                                               |
| A32NX_CAB_PRESS_MODE_MAN                  | Boolean        | True if CABIN PRESS MODE SEL is in manual mode                                                                |
| A32NX_CAB_PRESS_SYS_FAULT                 | Boolean        | Determines if the FAULT light on the CABIN PRESS MODE SEL pushbutton should be on                             |
|                                           |                |                                                                                                               |
| A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position | Position (0-2) | 0 is LO, 1 is NORM, 2 is HI                                                                                   |
| A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position   | Position (0-2) | 0 is SHUT, 1 is AUTO, 2 is OPEN                                                                               |
|                                           |                |                                                                                                               |
| A32NX_MAN_VS_CONTROL                      | Position (0-2) | Cabin Pressure manual control<br/>0 if switch is in UP position, 1 if switch is neutral, 2 if switch is DOWN. |
|                                           |                |                                                                                                               |
| A32NX_VENTILATION_BLOWER_FAULT            | Boolean        | True if ventilation blower fault                                                                              |
| A32NX_VENTILATION_BLOWER_TOGGLE           | Boolean        | True if ventilation blower on                                                                                 |
| A32NX_VENTILATION_CABFANS_TOGGLE          | Boolean        | True if cabin fans on/auto                                                                                    |
| A32NX_VENTILATION_EXTRACT_FAULT           | Boolean        | True if ventilation extractor fault                                                                           |
| A32NX_VENTILATION_EXTRACT_TOGGLE          | Boolean        | True if ventilation extractor on                                                                              |

## ATA22 AUTO FLIGHT

### ATA22-10 AUTO FLIGHT: Autpilot

| Name                                    | Type                     | Description                                                                                                                                                                                                                                                                                                                                                                                |
|:----------------------------------------|:-------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A320_Neo_FCU_HDG_SET_DATA               | Number                   | Used as data transport for event `H:A320_Neo_FCU_HDG_SET`                                                                                                                                                                                                                                                                                                                                  |
| A320_Neo_FCU_SPEED_SET_DATA             | Number                   | Used as data transport for event `H:A320_Neo_FCU_SPEED_SET`                                                                                                                                                                                                                                                                                                                                |
| A320_Neo_FCU_VS_SET_DATA                | Number                   | Used as data transport for event `H:A320_Neo_FCU_VS_SET`                                                                                                                                                                                                                                                                                                                                   |
|                                         |                          |                                                                                                                                                                                                                                                                                                                                                                                            |
| A32NX_AUTOPILOT_1_ACTIVE                | Boolean                  | Indicates if Autopilot 1 is enaged. DISENGAGED = 0, ENGAGED = 1                                                                                                                                                                                                                                                                                                                            |
| A32NX_AUTOPILOT_2_ACTIVE                | Boolean                  | Indicates if Autopilot 2 is enaged. DISENGAGED = 0, ENGAGED = 1                                                                                                                                                                                                                                                                                                                            |
| A32NX_AUTOPILOT_ACTIVE                  | Boolean                  | Indicates if any Autopilot is engaged: DISENGAGED = 0, ENGAGED = 1                                                                                                                                                                                                                                                                                                                         |
| A32NX_AUTOPILOT_AUTOLAND_WARNING        | Boolean                  | Indicates if Autoland warning light is illuminated: OFF = 0, ON = 1                                                                                                                                                                                                                                                                                                                        |
| A32NX_AUTOPILOT_AUTOTHRUST_MODE         | Enum                     | Indicates the requested ATHR mode by the Autopilot<br/>Mode = Value<br/>NONE = 0<br/> SPEED = 1 <br/>THRUST_IDLE = 2<br/> THRUST_CLB = 3                                                                                                                                                                                                                                                   |
| A32NX_AUTOPILOT_FPA_SELECTED            | Number (Degrees)         | Indicates the selected FPA on the FCU, instantly updated                                                                                                                                                                                                                                                                                                                                   |
| A32NX_AUTOPILOT_HEADING_SELECTED        | Number (Degrees)         | Indicates the selected heading on the FCU, instantly updated<br/>In case of managed heading mode, the value is -1                                                                                                                                                                                                                                                                          |
| A32NX_AUTOPILOT_TRACK_SELECTED          | Degrees                  | The selected track in the FCU                                                                                                                                                                                                                                                                                                                                                              |
| A32NX_AUTOPILOT_VS_SELECTED             | Number (Feet per minute) | Indicates the selected V/S on the FCU, instantly updated                                                                                                                                                                                                                                                                                                                                   |
|                                         |                          |                                                                                                                                                                                                                                                                                                                                                                                            |
| A32NX_ApproachCapability                | Enum                     | Indicates the current approach/landing capability <br/>Mode = Value <br/>NONE = 0 <br/>CAT1 = 1 <br/>CAT2 = 2 <br/>CAT3 SINGLE = 3 <br/>CAT3 DUAL = 4                                                                                                                                                                                                                                      |
|                                         |                          |                                                                                                                                                                                                                                                                                                                                                                                            |
| A32NX_FCU_ALT_MANAGED                   | Boolean                  | Indicates if managed altitude mode is active (dot): SELECTED = 0, MANAGED = 1                                                                                                                                                                                                                                                                                                              |
| A32NX_FCU_APPR_MODE_ACTIVE              | Boolean                  | Indicates if APPR button on the FCU is illuminated: OFF = 0, ON = 1                                                                                                                                                                                                                                                                                                                        |
| A32NX_FCU_HDG_MANAGED_DASHES            | Boolean                  | Indicates if managed heading mode is active and a numerical value is not displayed: SELECTED = 0, MANAGED = 1                                                                                                                                                                                                                                                                              |
| A32NX_FCU_HDG_MANAGED_DOT               | Boolean                  | Indicates if managed heading mode is active or armed: SELECTED = 0, MANAGED/ARMED = 1                                                                                                                                                                                                                                                                                                      |
| A32NX_FCU_LOC_MODE_ACTIVE               | Boolean                  | Indicates if LOC button on the FCU is illuminated: OFF = 0, ON = 1                                                                                                                                                                                                                                                                                                                         |
| A32NX_FCU_MODE_REVERSION_ACTIVE         | Boolean                  | Triggers the FCU to synchronize to current V/S: Inactive = 0, Revert = 1                                                                                                                                                                                                                                                                                                                   |
| A32NX_FCU_MODE_REVERSION_TRK_FPA_ACTIVE | Boolean                  | Triggers the FCU to revert to HDG/VS mode: Inactive = 0, Revert = 1                                                                                                                                                                                                                                                                                                                        |
| A32NX_FCU_SPD_MANAGED                   | Boolean                  | Indicates if managed speed/mach mode is active (dashes and dot): SELECTED = 0, MANAGED = 1                                                                                                                                                                                                                                                                                                 |
| A32NX_FCU_SPD_MANAGED_DASHES            | Boolean                  | Indicates if managed speed/mach mode is active and a numerical value is not displayed: SELECTED = 0, MANAGED = 1                                                                                                                                                                                                                                                                           |
| A32NX_FCU_SPD_MANAGED_DOT               | Boolean                  | Indicates if managed speed/mach mode is active: SELECTED = 0, MANAGED = 1                                                                                                                                                                                                                                                                                                                  |
| A32NX_FCU_VS_MANAGED                    | Boolean                  | Indicates if managed VS/FPA mode is active: SELECTED = 0, MANAGED = 1                                                                                                                                                                                                                                                                                                                      |
|                                         |                          |                                                                                                                                                                                                                                                                                                                                                                                            |
| A32NX_FLIGHT_DIRECTOR_BANK              | Number (Degrees)         | Indicates bank angle to be displayed by Flight Director <br/>Sign = Direction <br/>+ = left <br/> - = right                                                                                                                                                                                                                                                                                |
| A32NX_FLIGHT_DIRECTOR_PITCH             | Number (Degrees)         | Indicates pitch angle to be displayed by Flight Director<br/> Sign = Direction <br/>+ = down <br/> - = up                                                                                                                                                                                                                                                                                  |
| A32NX_FLIGHT_DIRECTOR_YAW               | Number (Degrees)         | Indicates yaw to be displayed by Flight Director <br/>Sign = Direction <br/>+ = left <br/>- = right                                                                                                                                                                                                                                                                                        |
|                                         |                          |                                                                                                                                                                                                                                                                                                                                                                                            |
| A32NX_FMA_CRUISE_ALT_MODE               | Boolean                  | Indicates if CRUISE ALT mode is engaged (ALT on cruise altitude = ALT CRZ): OFF = 0, ON = 1                                                                                                                                                                                                                                                                                                |
| A32NX_FMA_EXPEDITE_MODE                 | Boolean                  | Indicates if expedite mode is engaged: OFF = 0, ON = 1                                                                                                                                                                                                                                                                                                                                     |
| A32NX_FMA_LATERAL_ARMED                 | Bitmask                  | Indicates **armed** lateral mode of the Flight Director / Autopilot <br/>   Mode = Bit <br/>NAV = 0 <br/>LOC = 1                                                                                                                                                                                                                                                                           |
| A32NX_FMA_LATERAL_MODE                  | Enum                     | Indicates **engaged** lateral mode of the Flight Director / Autopilot <br/>Mode = Value <br/>NONE = 0 <br/>HDG = 10 <br/>TRACK = 11 <br/>NAV = 20 <br/>LOC_CPT = 30 <br/>LOC_TRACK = 31 <br/>LAND = 32 <br/>FLARE = 33 <br/>ROLL_OUT = 34<br/>RWY = 40 <br/>RWY_TRACK = 41 <br/>GA_TRACK = 50                                                                                              |
| A32NX_FMA_SOFT_ALT_MODE                 | Boolean                  | Indicates if SOFT ALT mode is engaged (allows deviation of +/- 50 ft to reduce thrust variations in cruise) <br/>State = Value<br/>OFF = 0 <br/>ON = 1                                                                                                                                                                                                                                     |
| A32NX_FMA_SPEED_PROTECTION_MODE         | Boolean                  | Indicates if V/S speed protection mode is engaged: OFF = 0,  ON = 1                                                                                                                                                                                                                                                                                                                        |
| A32NX_FMA_VERTICAL_ARMED                | Bitmask                  | Indicates **armed** vertical mode of the Flight Director / Autopilot <br/> Mode = Bit <br/>ALT = 0 <br/>ALT_CST = 1 <br/>CLB = 2 <br/>DES = 3 <br/>GS = 4                                                                                                                                                                                                                                  |
| A32NX_FMA_VERTICAL_MODE                 | Enum                     | Indicates **engaged** vertical mode of the Flight Director Autopilot <br/>Mode = Value <br/>NONE = 0 <br/>ALT = 10 <br/>ALT_CPT = 11 <br/>OP_CLB = 12 <br/>OP_DES = 13 <br/>VS = 14<br/> FPA = 15 <br/>ALT_CST = 20 <br/>ALT_CST_CPT = 21<br/>CLB = 22 <br/>DES = 23 <br/>GS_CPT = 30 <br/>GS_TRACK = 31 <br/>LAND = 32 <br/>FLARE = 33 <br/> ROLL_OUT = 34 <br/>SRS = 40 <br/>SRS_GA = 41 |
|                                         |                          |                                                                                                                                                                                                                                                                                                                                                                                            |
| A32NX_TRK_FPA_MODE_ACTIVE               | Boolean                  | True if TRK/FPA mode is active                                                                                                                                                                                                                                                                                                                                                             |

### ATA22-30 AUTO FLIGHT: Autothrust

| Name                                       | Type          | Description                                                                                                                                                                                                                                                                                                                              |
|:-------------------------------------------|:--------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_AUTOTHRUST_DISCONNECT                | Boolean       | Indicates if the red disconnect button is pressed on the thrust lever: NOT PRESSED = 0, PRESSED = 1                                                                                                                                                                                                                                      |
| A32NX_AUTOTHRUST_MODE                      | Enum          | Indicates the current thrust mode of the ATHR system <br/>Mode = Value <br/>NONE = 0 <br/>MAN_TOGA = 1 <br/>MAN_GA_SOFT = 2<br/>MAN_FLEX = 3 <br/>MAN_DTO = 4<br/> MAN_MCT = 5<br/> MAN_THR = 6<br/> SPEED = 7<br/> MACH = 8<br/> THR_MCT = 9<br/> THR_CLB = 10<br/> THR_LVR = 11<br/> THR_IDLE = 12<br/> A_FLOOR = 13<br/> TOGA_LK = 14 |
| A32NX_AUTOTHRUST_MODE_MESSAGE              | Enum          | Indicates ATHR related message to be displayed on the PFD <br/>Mode = Value<br/>NONE = 0 <br/>THR_LK = 1 <br/>LVR_TOGA = 2 <br/>LVR_CLB = 3 <br/>LVR_MCT = 4 <br/>LVR_ASYM = 5                                                                                                                                                           |
| A32NX_AUTOTHRUST_N1_COMMANDED:{index}      | Number (% N1) | Indicates the commanded N1 (either based on TLA or autothrust law) for engine {index}, first engine has index 1                                                                                                                                                                                                                          |
| A32NX_AUTOTHRUST_REVERSE:{index}           | Boolean       | Indicates if reverse for engine {index} is requested: NO REVERSE = 0,REVERSE = 1                                                                                                                                                                                                                                                         |
| A32NX_AUTOTHRUST_STATUS                    | Enum          | Indicates the current status of the ATHR system <br/>Mode = Value <br/>DISENGAGED = 0 <br/>ENGAGED_ARMED = 1 <br/>ENGAGED_ACTIVE = 2                                                                                                                                                                                                     |
| A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_FLEX | Boolean       | Indicates if the thrust lever warning for FLEX take-off is active: NOT ACTIVE = 0, ACTIVE = 1                                                                                                                                                                                                                                            |
| A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA | Boolean       | Indicates if the thrust lever warning for TOGA take-off is active: NOT ACTIVE = 0, ACTIVE = 1                                                                                                                                                                                                                                            |
| A32NX_AUTOTHRUST_THRUST_LIMIT              | Number (% N1) | Indicates the thrust limit N1                                                                                                                                                                                                                                                                                                            |
| A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE         | Enum          | Indicates the type of current thrust limit <br/>Mode = Value <br/>  NONE = 0 <br/>CLB = 1 <br/>MCT = 2 <br/>FLEX = 3 <br/>TOGA = 4 <br/>REVERSE = 5                                                                                                                                                                                      |
| A32NX_AUTOTHRUST_TLA_N1:{index}            | Number (% N1) | Indicates the N1 corresponding to the TLA for engine {index}, first    engine has index 1                                                                                                                                                                                                                                                |

## ATA23 COMMUNICATION

| Name                               | Type    | Description                                                          |
|:-----------------------------------|:--------|:---------------------------------------------------------------------|
| A32NX_CALLS_EMER_ON                | Boolean | True if emergency cabin call is on                                   |
| A32NX_CREW_HEAD_SET                | Boolean | True if CVR crew head set is being pressed.                          |
| A32NX_DFDR_EVENT_ON                | Boolean | True if DFDR event is on.                                            |
| A32NX_OVHD_COCKPITDOORVIDEO_TOGGLE | Boolean | True if cockpit door video system is on                              |
| A32NX_RCDR_GROUND_CONTROL_ON       | Boolean | True if ground control is on.                                        |
| A32NX_RCDR_TEST                    | Boolean | True if RCDR being tested.                                           |
| A32NX_RMP_L_SELECTED_MODE          | Number  | Number: The current mode of the left radio management panel.         |
| A32NX_RMP_L_TOGGLE_SWITCH          | Boolean | Whether the left radio management panel toggle switch is on or off.  |
| A32NX_RMP_L_VHF2_STANDBY           | Hertz   | The VHF 2 standby frequency for the left RMP.                        |
| A32NX_RMP_L_VHF3_STANDBY           | Hertz   | The VHF 3 standby frequency for the left RMP.                        |
| A32NX_RMP_R_SELECTED_MODE          | Number  | Number: The current mode of the right radio management panel.        |
| A32NX_RMP_R_TOGGLE_SWITCH          | Boolean | Whether the right radio management panel toggle switch is on or off. |
| A32NX_RMP_R_VHF1_STANDBY           | Hertz   | The VHF 1 standby frequency for the right RMP.                       |
| A32NX_RMP_R_VHF3_STANDBY           | Hertz   | The VHF 3 standby frequency for the right RMP.                       |
| A32NX_SVGEINT_OVRD_ON              | Boolean | True if SVGE INT OVRD is on.                                         |
| PUSH_DOORPANEL_VIDEO               | Boolean | True if pedestal door video button is being held                     |

## ATA24 ELECTRICAL POWER

| Name                                             | Type    | Description                                                                                                |
|:-------------------------------------------------|:--------|:-----------------------------------------------------------------------------------------------------------|
| A32NX_ELEC_{name}_BUS_IS_POWERED                 | Boolean | True when the given bus is powered.                                                                        |
|                                                  |         | AC_1                                                                                                       |
|                                                  |         | AC_2                                                                                                       |
|                                                  |         | AC_ESS                                                                                                     |
|                                                  |         | AC_ESS_SHED                                                                                                |
|                                                  |         | AC_GND_FLT_SVC                                                                                             |
|                                                  |         | AC_STAT_INV                                                                                                |
|                                                  |         | DC_1                                                                                                       |
|                                                  |         | DC_2                                                                                                       |
|                                                  |         | DC_BAT                                                                                                     |
|                                                  |         | DC_ESS                                                                                                     |
|                                                  |         | DC_ESS_SHED                                                                                                |
|                                                  |         | DC_GND_FLT_SVC                                                                                             |
|                                                  |         | DC_HOT_1                                                                                                   |
|                                                  |         | DC_HOT_2                                                                                                   |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_APU_GEN_1_FREQUENCY                   | Hertz   | The frequency of the alternating current of the given element.                                             |
| A32NX_ELEC_APU_GEN_1_FREQUENCY_NORMAL            | Boolean | Indicates if the frequency is within the normal range.                                                     |
| A32NX_ELEC_APU_GEN_1_LOAD                        | Percent | The load the generator is providing compared to its maximum.                                               |
| A32NX_ELEC_APU_GEN_1_LOAD_NORMAL                 | Boolean | Indicates if the load is within the normal range.                                                          |
| A32NX_ELEC_APU_GEN_1_POTENTIAL                   | Volts   | The electric potential of the given element.                                                               |
| A32NX_ELEC_APU_GEN_1_POTENTIAL_NORMAL            | Boolean | Indicates if the potential is within the normal range.                                                     |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_BAT_1_CURRENT                         | Ampere  | The electric current flowing through the given element. Negative when discharging, positive when charging. |
| A32NX_ELEC_BAT_1_CURRENT_NORMAL                  | Ampere  | Indicates if the current is within the normal range.                                                       |
| A32NX_ELEC_BAT_1_POTENTIAL                       | Volts   | The electric potential of the given element.                                                               |
| A32NX_ELEC_BAT_1_POTENTIAL_NORMAL                | Boolean | Indicates if the potential is within the normal range.                                                     |
| A32NX_ELEC_BAT_2_CURRENT                         | Ampere  | The electric current flowing through the given element. Negative when discharging, positive when charging. |
| A32NX_ELEC_BAT_2_CURRENT_NORMAL                  | Ampere  | Indicates if the current is within the normal range.                                                       |
| A32NX_ELEC_BAT_2_POTENTIAL                       | Volts   | The electric potential of the given element.                                                               |
| A32NX_ELEC_BAT_2_POTENTIAL_NORMAL                | Boolean | Indicates if the potential is within the normal range.                                                     |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_CONTACTOR_{name}__IS_CLOSED           | Boolean | True when the contactor is CLOSED                                                                          |
|                                                  |         | 10KA_AND_5KA: The two contactors leading to the APU start motor                                            |
|                                                  |         | 11XU1: AC BUS tie 1 contactor                                                                              |
|                                                  |         | 11XU2: AC BUS tie 2 contactor                                                                              |
|                                                  |         | 12XN: Contactor from EXT PWR to TR2 and AC GND/FLT SVC BUS.                                                |
|                                                  |         | 14PU: Contactor from AC BUS 2 to TR2 and AC GND/FLT SVC BUS.                                               |
|                                                  |         | 15XE1: Contactor between AC ESS BUS and TR ESS + EMER GEN                                                  |
|                                                  |         | 15XE2: Contactor between the static inverter and AC ESS BUS                                                |
|                                                  |         | 1PC1: DC BAT BUS feed contactor between DC BUS 1 and DC BAT BUS                                            |
|                                                  |         | 1PC2: DC BAT BUS feed contactor between DC BUS 2 and DC BAT BUS                                            |
|                                                  |         | 2XB1: Contactor between battery 1 and the static inverter                                                  |
|                                                  |         | 2XB2: Contactor between battery 2 and the DC ESS BUS                                                       |
|                                                  |         | 2XE: Emergency generator contactor                                                                         |
|                                                  |         | 3PE: Transformer rectifier ESS contactor between TR ESS and DC ESS BUS                                     |
|                                                  |         | 3PX: Contactor from TR2 to DC GND/FLT SVC BUS.                                                             |
|                                                  |         | 3XC1: AC ESS feed contactor between AC BUS 1 and AC ESS BUS                                                |
|                                                  |         | 3XC2: AC ESS feed contactor between AC BUS 2 and AC ESS BUS                                                |
|                                                  |         | 3XG: External power contactor                                                                              |
|                                                  |         | 3XS: APU generator contactor                                                                               |
|                                                  |         | 4PC: Contactor between DC BAT BUS and DC ESS BUS                                                           |
|                                                  |         | 5PU1: Transformer rectifier 1 contactor between TR1 and DC BUS 1                                           |
|                                                  |         | 5PU2: Transformer rectifier 2 contactor between TR2 and DC BUS 2                                           |
|                                                  |         | 6PB1: Battery 1 contactor                                                                                  |
|                                                  |         | 6PB2: Battery 2 contactor                                                                                  |
|                                                  |         | 8PH: DC ESS SHED contactor                                                                                 |
|                                                  |         | 8PN: Contactor from DC BUS 2 to DC GND/FLT SVC BUS.                                                        |
|                                                  |         | 8XH: AC ESS SHED contactor                                                                                 |
|                                                  |         | 9XU1: Engine generator line contactor 1                                                                    |
|                                                  |         | 9XU2: Engine generator line contactor 2                                                                    |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_CONTACTOR_6PB1_SHOW_ARROW_WHEN_CLOSED | Boolean | True when the contactor is CLOSED: 6PB1: show arrow when Battery 1 contactor closed                        |
| A32NX_ELEC_CONTACTOR_6PB2_SHOW_ARROW_WHEN_CLOSED | Boolean | True when the contactor is CLOSED: 6PB2: show arrow when Battery 2 contactor closed                        |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_EMER_GEN_FREQUENCY                    | Hertz   | The frequency of the alternating current of the given element.                                             |
| A32NX_ELEC_EMER_GEN_FREQUENCY_NORMAL             | Boolean | Indicates if the frequency is within the normal range.                                                     |
| A32NX_ELEC_EMER_GEN_POTENTIAL                    | Volts   | The electric potential of the given element.                                                               |
| A32NX_ELEC_EMER_GEN_POTENTIAL_NORMAL             | Boolean | Indicates if the potential is within the normal range.                                                     |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_ENG_GEN_1_FREQUENCY                   | Hertz   | The frequency of the alternating current of the given element.                                             |
| A32NX_ELEC_ENG_GEN_1_FREQUENCY_NORMAL            | Boolean | Indicates if the frequency is within the normal range.                                                     |
| A32NX_ELEC_ENG_GEN_1_IDG_IS_CONNECTED            | Boolean | Indicates if the given integrated drive generator is connected.                                            |
| A32NX_ELEC_ENG_GEN_1_IDG_OIL_OUTLET_TEMPERATURE  | Celsius | The integrated drive generator's oil outlet temperature.                                                   |
| A32NX_ELEC_ENG_GEN_1_LOAD                        | Percent | The load the generator is providing compared to its maximum.                                               |
| A32NX_ELEC_ENG_GEN_1_LOAD_NORMAL                 | Boolean | Indicates if the load is within the normal range.                                                          |
| A32NX_ELEC_ENG_GEN_1_POTENTIAL                   | Volts   | The electric potential of the given element.                                                               |
| A32NX_ELEC_ENG_GEN_1_POTENTIAL_NORMAL            | Boolean | Indicates if the potential is within the normal range.                                                     |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_ENG_GEN_2_FREQUENCY                   | Hertz   | The frequency of the alternating current of the given element.                                             |
| A32NX_ELEC_ENG_GEN_2_FREQUENCY_NORMAL            | Boolean | Indicates if the frequency is within the normal range.                                                     |
| A32NX_ELEC_ENG_GEN_2_IDG_IS_CONNECTED            | Boolean | Indicates if the given integrated drive generator is connected.                                            |
| A32NX_ELEC_ENG_GEN_2_IDG_OIL_OUTLET_TEMPERATURE  | Celsius | The integrated drive generator's oil outlet temperature.                                                   |
| A32NX_ELEC_ENG_GEN_2_LOAD                        | Percent | The load the generator is providing compared to its maximum.                                               |
| A32NX_ELEC_ENG_GEN_2_LOAD_NORMAL                 | Boolean | Indicates if the load is within the normal range.                                                          |
| A32NX_ELEC_ENG_GEN_2_POTENTIAL                   | Volts   | The electric potential of the given element.                                                               |
| A32NX_ELEC_ENG_GEN_2_POTENTIAL_NORMAL            | Boolean | Indicates if the potential is within the normal range.                                                     |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_EXT_PWR _FREQUENCY                    | Hertz   | The frequency of the alternating current of the given element.                                             |
| A32NX_ELEC_EXT_PWR _FREQUENCY_NORMAL             | Boolean | Indicates if the frequency is within the normal range.                                                     |
| A32NX_ELEC_EXT_PWR_POTENTIAL                     | Volts   | The electric potential of the given element.                                                               |
| A32NX_ELEC_EXT_PWR_POTENTIAL_NORMAL              | Boolean | Indicates if the potential is within the normal range.                                                     |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_STAT_INV _FREQUENCY                   | Hertz   | The frequency of the alternating current of the given element.                                             |
| A32NX_ELEC_STAT_INV _FREQUENCY_NORMAL            | Boolean | Indicates if the frequency is within the normal range.                                                     |
| A32NX_ELEC_STAT_INV_POTENTIAL                    | Volts   | The electric potential of the given element.                                                               |
| A32NX_ELEC_STAT_INV_POTENTIAL_NORMAL             | Boolean | Indicates if the potential is within the normal range.                                                     |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_TR_1_CURRENT                          | Ampere  | The electric current flowing through the given element.                                                    |
| A32NX_ELEC_TR_1_CURRENT_NORMAL                   | Ampere  | Indicates if the current is within the normal range.                                                       |
| A32NX_ELEC_TR_1_POTENTIAL                        | Volts   | The electric potential of the given element.                                                               |
| A32NX_ELEC_TR_1_POTENTIAL_NORMAL                 | Boolean | Indicates if the potential is within the normal range.                                                     |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_TR_2_CURRENT                          | Ampere  | The electric current flowing through the given element.                                                    |
| A32NX_ELEC_TR_2_CURRENT_NORMAL                   | Ampere  | Indicates if the current is within the normal range.                                                       |
| A32NX_ELEC_TR_2_POTENTIAL                        | Volts   | The electric potential of the given element.                                                               |
| A32NX_ELEC_TR_2_POTENTIAL_NORMAL                 | Boolean | Indicates if the potential is within the normal range.                                                     |
|                                                  |         |                                                                                                            |
| A32NX_ELEC_TR_3_CURRENT                          | Ampere  | The electric current flowing through the given element. TR ESS                                             |
| A32NX_ELEC_TR_3_CURRENT_NORMAL                   | Ampere  | Indicates if the current is within the normal range. TR ESS                                                |
| A32NX_ELEC_TR_3_POTENTIAL                        | Volts   | The electric potential of the given element.                                                               |
| A32NX_ELEC_TR_3_POTENTIAL_NORMAL                 | Boolean | Indicates if the potential is within the normal range.                                                     |
|                                                  |         |                                                                                                            |
| A32NX_EMERELECPWR_GEN_TEST                       | Boolean | True if emergency generator is being tested.                                                               |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_AC_ESS_FEED_PB_HAS_FAULT         | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_ELEC_AC_ESS_FEED_PB_IS_NORMAL         | Boolean | True when the AC ESS FEED push button is NORMAL                                                            |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_APU_GEN_PB_HAS_FAULT             | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_ELEC_APU_GEN_PB_IS_ON                 | Boolean | True when the push button is ON.                                                                           |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_BAT_1_PB_HAS_FAULT               | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO                 | Boolean | True when the push button is AUTO.                                                                         |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_BAT_2_PB_HAS_FAULT               | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO                 | Boolean | True when the push button is AUTO.                                                                         |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_BUS_TIE_PB_HAS_FAULT             | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_ELEC_BUS_TIE_PB_IS_AUTO               | Boolean | True when the push button is AUTO.                                                                         |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_COMMERCIAL_PB_HAS_FAULT          | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_ELEC_COMMERCIAL_PB_IS_ON              | Boolean | True when the push button is ON.                                                                           |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_ENG_GEN_1_PB_HAS_FAULT           | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_ELEC_ENG_GEN_1_PB_IS_ON               | Boolean | True when the push button is ON.                                                                           |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_ENG_GEN_2_PB_HAS_FAULT           | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_ELEC_ENG_GEN_2_PB_IS_ON               | Boolean | True when the push button is ON.                                                                           |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_EXT_PWR_PB_IS_ON                 | Boolean | True when the push button is ON.                                                                           |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_GALY_AND_CAB_PB_HAS_FAULT        | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_ELEC_GALY_AND_CAB_PB_IS_AUTO          | Boolean | True when the push button is AUTO.                                                                         |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_IDG_1_PB_HAS_FAULT               | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_ELEC_IDG_1_PB_IS_RELEASED             | Boolean | True when the push button is RELEASED.                                                                     |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_ELEC_IDG_2_PB_HAS_FAULT               | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_ELEC_IDG_2_PB_IS_RELEASED             | Boolean | True when the push button is RELEASED.                                                                     |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_EMER_ELEC_GEN_1_LINE_PB_HAS_FAULT     | Boolean | Indicates if the push button's FAULT light should illuminate.                                              |
| A32NX_OVHD_EMER_ELEC_GEN_1_LINE_PB_IS_ON         | Boolean | True when the push button is ON.                                                                           |
|                                                  |         |                                                                                                            |
| A32NX_OVHD_EMER_ELEC_RAT_AND_EMER_GEN_HAS_FAULT  | Boolean | Indicates if the RAT & EMER GEN FAULT light should illuminate                                              |
| A32NX_OVHD_EMER_ELEC_RAT_AND_EMER_GEN_IS_PRESSED | Boolean | True if Ram Air Turbine has been manually deployed.                                                        |


### ATA25-60 EQUIPMENT/FURNISHINGS: EMERGENCY

| Name                      | Type    | Description                                        |
|:--------------------------|:--------|:---------------------------------------------------|
| A32NX_DITCHING            | Boolean | True if DITCHING mode is enabled                   |
| A32NX_EVAC_CAPT_TOGGLE    | Boolean | True if evac switch set to CAPT                    |
| A32NX_EVAC_COMMAND_FAULT  | Boolean | True if evac command fault                         |
| A32NX_EVAC_COMMAND_TOGGLE | Boolean | True if evac command button is on                  |
| A32NX_SLIDES_ARMED        | Boolean | Indicates whether the door slides are armed or not |
| PUSH_OVHD_EVAC_HORN       | Boolean | True if evac horn cutout button is being pressed   |

## ATA26 FIRE PROTECTION

| Name                            | Type    | Description                                  |
|:--------------------------------|:--------|:---------------------------------------------|
| A32NX_CARGOSMOKE_AFT_DISCHARGED | Boolean | True if cargosmoke two bottle is discharged  |
| A32NX_CARGOSMOKE_FWD_DISCHARGED | Boolean | True if cargosmoke one bottle is discharged  |
| A32NX_FIRE_BUTTON_APU           | Boolean | Indicates if the APU fire button is RELEASED |

## ATA27 FLIGHT CONTROLS

| Name                                  | Type    | Description                                                                                                                           |
|:--------------------------------------|:--------|:--------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_FLAPS_HANDLE_INDEX              | Number  | Indicates the physical flaps handle position<br/> Value - Meaning <br/>0 - 0 <br/>  1 - 1 / 1+F <br/>  2 - 2 <br/> 3 - 3 <br/>  4 - 4 |
| A32NX_FLAPS_HANDLE_PERCENT            | Number  | Indicates the position of the flaps handler in percent <br/>Value = Position <br/>0 = Retracted<br/>1 = Full extension                |
| A32NX_SPOILERS_ARMED                  | Boolean | Indicates if the ground spoilers are armed <br/>0 = disarmed<br/>1 = armed                                                            |
| A32NX_SPOILERS_GROUND_SPOILERS_ACTIVE | Boolean | Indicates if the ground spoilers are active (fully deployed) <br/>Value Position<br/>0 = Inactive<br/> 1 = Active                     |
| A32NX_SPOILERS_HANDLE_POSITION        | Number  | Indicates the physical handler position without arm/disarm <br/>Value  Position<br/>0 = Retracted<br/> 1 = Full extension             |

### Fly-By-Wire System

| Name                              | Type   | Description                                                                                                                              |
|:----------------------------------|:-------|:-----------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_3D_AILERON_LEFT_DEFLECTION  | Number | Provides the left aileron position <br/>Value = Meaning <br/>-1.0 = full up<br/> 0.0 = neutral<br/> 1.0 = full down                      |
| A32NX_3D_AILERON_RIGHT_DEFLECTION | Number | Provides the right aileron position <br/>Value = Meaning <br/>-1.0 = full down<br/> 0.0 = neutral<br/> 1.0 = full up                     |
| A32NX_ALPHA_MAX_PERCENTAGE        | Number | Percentage (0.0-> 1.0) of current (filtered) alpha to alpha max<br/>alpha max can be overshot so values beyond 1.0 should be expected    |
| A32NX_RUDDER_PEDAL_POSITION       | Number | Provides the rudder pedal position Value = Meaning <br/> -100 = full left<br/> 0 = neutral<br/> 100 = full right                         |
| A32NX_SIDESTICK_POSITION_X        | Number | Provides the direct sidestick position (lateral) <br/>Value = Meaning <br/>-1 = full left<br/> 0 = neutral<br/>1 = full right            |
| A32NX_SIDESTICK_POSITION_Y        | Number | Provides the direct sidestick position (longitudinal) <br/>Value = Meaning <br/>-1 = full forward<br/>0 = neutral<br/> 1 = full backward |

## ATA28 FUEL

Uses MSFS and SIMCONNECT variables and events

## ATA29 HYDRAULIC POWER

| Name                                   | Type           | Description                                                                                    |
|:---------------------------------------|:---------------|:-----------------------------------------------------------------------------------------------|
| A32NX_HYD_BLUE_EPUMP_ACTIVE            | Boolean        | Electric pump of BLUE hydraulic circuit is active.                                             |
| A32NX_HYD_BLUE_EPUMP_LOW_PRESS         | Boolean        | Electric pump of BLUE hydraulic circuit is active but pressure is too low.                     |
| A32NX_HYD_BLUE_PRESSURE                | Psi            | Current pressure in the BLUE hydraulic circuit.                                                |
| A32NX_HYD_BLUE_RESERVOIR               | Gallon         | Current fluid level in the BLUE hydraulic circuit reservoir.                                   |
|                                        |                |                                                                                                |
| A32NX_HYD_BRAKE_ALTN_ACC_PRESS         | Psi            | Current pressure in brake accumulator on yellow alternate brake circuit                        |
| A32NX_HYD_BRAKE_ALTN_LEFT_PRESS        | Psi            | Current pressure in brake slave circuit on yellow alternate brake circuit.                     |
| A32NX_HYD_BRAKE_ALTN_RIGHT_PRESS       | Psi            | Current pressure in brake slave circuit on yellow alternate brake circuit.                     |
| A32NX_HYD_BRAKE_NORM_LEFT_PRESS        | Psi            | Current pressure in brake slave circuit on green brake circuit.                                |
| A32NX_HYD_BRAKE_NORM_RIGHT_PRESS       | Psi            | Current pressure in brake slave circuit on green brake circuit.                                |
|                                        |                |                                                                                                |
| A32NX_HYD_GREEN_EDPUMP_ACTIVE          | Boolean        | Engine driven pump of GREEN hydraulic circuit is active.                                       |
| A32NX_HYD_GREEN_EDPUMP_LOW_PRESS       | Boolean        | Engine driven pump of GREEN hydraulic circuit is active but pressure is too low.               |
| A32NX_HYD_GREEN_FIRE_VALVE_OPENED      | Boolean        | Engine driven pump of GREEN hydraulic circuit can receive hydraulic fluid.                     |
| A32NX_HYD_GREEN_PRESSURE               | Psi            | Current pressure in the GREEN hydraulic circuit.                                               |
| A32NX_HYD_GREEN_RESERVOIR              | Gallon         | Current fluid level in the GREEN hydraulic circuit reservoir.                                  |
|                                        |                |                                                                                                |
| A32NX_HYD_PTU_ACTIVE_L2R               | Boolean        | Power Transfer Unit is trying to transfer hydraulic power from green to yellow (L2R) circuits. |
| A32NX_HYD_PTU_ACTIVE_R2L               | Boolean        | Power Transfer Unit is trying to transfer hydraulic power from yellow to green (R2L) circuits. |
| A32NX_HYD_PTU_MOTOR_FLOW               | Gallon/seconds | Power Transfer Unit instantaneous flow in motor side                                           |
| A32NX_HYD_PTU_VALVE_OPENED             | Boolean        | Power Transfer Unit can receive fluid from yellow and green circuits                           |
|                                        |                |                                                                                                |
| A32NX_HYD_RAT_RPM                      | Rpm            | RAT propeller current RPM                                                                      |
| A32NX_HYD_RAT_STOW_POSITION            | Percent        | RAT position, from fully stowed (0) to fully deployed (1)                                      |
|                                        |                |                                                                                                |
| A32NX_HYD_YELLOW_EDPUMP_ACTIVE         | Boolean        | Engine driven pump of YELLOW hydraulic circuit is active.                                      |
| A32NX_HYD_YELLOW_EDPUMP_LOW_PRESS      | Boolean        | Engine driven pump of YELLOW hydraulic circuit is active but pressure is too low.              |
| A32NX_HYD_YELLOW_EPUMP_ACTIVE          | Boolean        | Electric pump of YELLOW hydraulic circuit is active.                                           |
| A32NX_HYD_YELLOW_EPUMP_LOW_PRESS       | Boolean        | Electric pump of YELLOW hydraulic circuit is active but pressure is too low.                   |
| A32NX_HYD_YELLOW_FIRE_VALVE_OPENED     | Boolean        | Engine driven pump of YELLOW hydraulic circuit can receive hydraulic fluid.                    |
| A32NX_HYD_YELLOW_PRESSURE              | Psi            | Current pressure in the YELLOW hydraulic circuit.                                              |
| A32NX_HYD_YELLOW_RESERVOIR             | Gallon         | Current fluid level in the YELLOW hydraulic circuit reservoir.                                 |
|                                        |                |                                                                                                |
| A32NX_OVHD_HYD_ENG_1_PUMP_PB_HAS_FAULT | Boolean        | True if engine ENG_1 hyd pump fault                                                            |
| A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO   | Boolean        | True if ENG_1 hyd pump is on                                                                   |
|                                        |                |                                                                                                |
| A32NX_OVHD_HYD_ENG_2_PUMP_PB_HAS_FAULT | Boolean        | True if engine ENG_2 hyd pump fault                                                            |
| A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO   | Boolean        | True if ENG_2 hyd pump is on                                                                   |
|                                        |                |                                                                                                |
| A32NX_OVHD_HYD_EPUMPB_PB_HAS_FAULT     | Boolean        | True if elec EPUMPB hyd pump fault                                                             |
| A32NX_OVHD_HYD_EPUMPB_PB_IS_AUTO       | Boolean        | True if elec EPUMPB hyd pump is on/auto                                                        |
|                                        |                |                                                                                                |
| A32NX_OVHD_HYD_EPUMPY_OVRD_PB_IS_ON    | Boolean        | True if "BLUE PUMP OVRD" switch is off                                                         |
| A32NX_OVHD_HYD_EPUMPY_PB_HAS_FAULT     | Boolean        | True if elec EPUMPY hyd pump fault                                                             |
| A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO       | Boolean        | True if elec EPUMPY hyd pump is on/auto                                                        |
|                                        |                |                                                                                                |
| A32NX_OVHD_HYD_LEAK_MEASUREMENT_B      | Boolean        | True if "HYD LEAK MEASUREMENT B" switch is on                                                  |
| A32NX_OVHD_HYD_LEAK_MEASUREMENT_B_LOCK | Boolean        | True if "HYD LEAK MEASUREMENT B" switch lock is down                                           |
|                                        |                |                                                                                                |
| A32NX_OVHD_HYD_LEAK_MEASUREMENT_G      | Boolean        | True if "HYD LEAK MEASUREMENT G" switch is on                                                  |
| A32NX_OVHD_HYD_LEAK_MEASUREMENT_G_LOCK | Boolean        | True if "HYD LEAK MEASUREMENT G" switch lock is down                                           |
|                                        |                |                                                                                                |
| A32NX_OVHD_HYD_LEAK_MEASUREMENT_Y      | Boolean        | True if "HYD LEAK MEASUREMENT Y" switch is on                                                  |
| A32NX_OVHD_HYD_LEAK_MEASUREMENT_Y_LOCK | Boolean        | True if "HYD LEAK MEASUREMENT Y" switch lock is down                                           |
|                                        |                |                                                                                                |
| A32NX_OVHD_HYD_PTU_PB_HAS_FAULT        | Boolean        | True if PTU fault                                                                              |
| A32NX_OVHD_HYD_PTU_PB_IS_AUTO          | Boolean        | True if PTU system on/auto                                                                     |
|                                        |                |                                                                                                |
| A32NX_OVHD_HYD_RAT_MAN_ON_IS_PRESSED   | Boolean        | Deploys the RAT manually                                                                       |

## ATA30 ICE AND RAIN PROTECTION

| Name                                                | Type    | Description                                                                                      |
|:----------------------------------------------------|:--------|:-------------------------------------------------------------------------------------------------|
| A32NX_PITOT_HEAT_AUTO                               | Boolean | True if pitot heating auto                                                                       |
| A32NX_RAIN_REPELLENT_LEFT_ON                        | Boolean | True if rain repellent is activated on the left windshield.                                      |
| A32NX_RAIN_REPELLENT_RIGHT_ON                       | Boolean | True if rain repellent is activated on the right windshield.                                     |
| SIMCONNECT:ENG ANTI ICE:{1,2}                       | Boolean | State of A/ICE ENG {1,2} (read only)<br/>Use event SIMCONNECT:ANTI_ICE_TOGGLE_ENG{1,2} to change |
| SIMCONNECT:STRUCTURAL DEICE SWITCH                  | Boolean | State of A/ICE Wings (read only)<br/>Use event SIMCONNECT:TOGGLE_STRUCTURAL_DEICE to change      |
| XMLVAR_MOMENTARY_PUSH_OVHD_ANTIICE_ENG{1,2}_PRESSED | Boolean | A/ICE END{1,2} switch ON or OFF (switch position only)                                           |
| XMLVAR_MOMENTARY_PUSH_OVHD_ANTIICE_WING_PRESSED     | Boolean | A/ICE WING switch ON or OFF (switch position only)                                               |

## ATA32 LANDING GEAR

### ATA32-40 LANDING GEAR: Brakes

| Name                                       | Type    | Description                                                                                                                                                                                                                                                                                                                                                        |
|:-------------------------------------------|:--------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_AUTOBRAKES_ARMED_MODE                | Number  | Current autobrake mode <br/> 0: Autobrake not armed <br/> 1: Autobrake in LOW <br/> 2: Autobrake in MED <br/> 3: Autobrake in MAX                                                                                                                                                                                                                                  |
| A32NX_AUTOBRAKES_BRAKING                   | Boolean | Autobrakes are braking and reached the deceleration target                                                                                                                                                                                                                                                                                                         |
| A32NX_OVHD_AUTOBRK_LOW_ON_IS_PRESSED       | Boolean | Auto brake panel push button for LOW mode is pressed                                                                                                                                                                                                                                                                                                               |
| A32NX_OVHD_AUTOBRK_MAX_ON_IS_PRESSED       | Boolean | Auto brake panel push button for MAX mode is pressed                                                                                                                                                                                                                                                                                                               |
| A32NX_OVHD_AUTOBRK_MED_ON_IS_PRESSED       | Boolean | Auto brake panel push button for MEDIUM mode is pressed                                                                                                                                                                                                                                                                                                            |
|                                            |         |                                                                                                                                                                                                                                                                                                                                                                    |
| A32NX_BRAKES_HOT                           | Boolean | Whether one of the brakes are hot (>300°C)                                                                                                                                                                                                                                                                                                                         |
| A32NX_BRAKE_FAN                            | Boolean | Whether or not the brake fan is running (brake fan button pressed AND left main landing gear down and locked)                                                                                                                                                                                                                                                      |
| A32NX_BRAKE_FAN_BTN_PRESSED                | Boolean | Whether or not the brake fan button is pressed                                                                                                                                                                                                                                                                                                                     |
| A32NX_BRAKE_TEMPERATURE_{1,2,3,4}          | Celsius | Represents the brake temperature of the rear wheels                                                                                                                                                                                                                                                                                                                |
| A32NX_LEFT_BRAKE_PEDAL_INPUT               | Percent | Current position of the toe brake pedal animation.                                                                                                                                                                                                                                                                                                                 |
| A32NX_RIGHT_BRAKE_PEDAL_INPUT              | Percent | Current position of the toe brake pedal animation.                                                                                                                                                                                                                                                                                                                 |
| A32NX_REPORTED_BRAKE_TEMPERATURE_{1,2,3,4} | Celsius | Represents the reported brake temperature of the rear wheels by the sensor.<br/>It can be different from the brake temperature when the brake fan has been used, because the brake fan will cool the sensor more than the brakes (which have much more energy to dissipate) therefore giving potentially erroneous readings that the pilots must take into account |
|                                            |         |                                                                                                                                                                                                                                                                                                                                                                    |
| A32NX_PARK_BRAKE_LEVER_POS                 | Boolean | Current position of the parking brake lever                                                                                                                                                                                                                                                                                                                        |

## ATA33 LIGHTS

| Name                     | Type             | Description                                                                                                                                     |
|:-------------------------|:-----------------|:------------------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_AVIONICS_COMPLT_ON | Boolean          | True if avionics comp light is on.                                                                                                              |
| A32NX_BARO_BRIGHTNESS    | Number (Percent) | Brightness setting for the standby Baro (SAI)                                                                                                   |
| A32NX_ELT_ON             | Boolean          | True if ELT is on.                                                                                                                              |
| A32NX_ELT_TEST_RESET     | Boolean          | True if ELT is being tested/reset.                                                                                                              |
| A32NX_MCDU_L_BRIGHTNESS  | Number (Percent) | Brightness setting for left MCDU                                                                                                                |
| A32NX_MCDU_R_BRIGHTNESS  | Number (Percent) | Brightness setting for right MCDU                                                                                                               |
| A32NX_NO_SMOKING_MEMO    | Boolean          | Determines whether the NO SMOKING memo should be visible on the upper ECAM<br/>Also is used for knowing when to play the no smoking chime sound |

The FlyByWire A32NX uses standard SIMCONNECT or MSFS variables and
events for most lighting and signs. This includes for example
SIMCONNECT:LIGHT_NAV or MSFS:LIGHT_POTENTIOMETER:{1...}

## ATA34 NAVIGATION

### ATA34-10 NAVIGATION: FLIGHT ENVIRONMENT DATA

| Name                    | Type    | Description                         |
|:------------------------|:--------|:------------------------------------|
| A32NX_METRIC_ALT_TOGGLE | Boolean | True if PFD metric altitude enabled |

### ATA34-40 NAVIGATION: INDEPENDENT POSITION DETERMINING

| Name                       | Type           | Description                                                                                                                                                         |
|:---------------------------|:---------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_ADIRS_KNOB_{1,2,3}   | Position (0-2) | 0 = OFF, 1 = NAV, 2 = ATT                                                                                                                                           |
| A32NX_ADIRS_ON_BAT         | Boolean        | True when ADIRS ON BAT light is on                                                                                                                                  |
| A32NX_ADIRS_PFD_ALIGNED    | Boolean        | 0 when ADIRS is not aligned<br/>1 when ADIRS is aligned or 3 minutes after it has started aligning                                                                  |
| A32NX_ADIRS_{1,2,3}_FAULT  | Boolean        | Whether the "FAULT" indication is shown on the OVHD ADIRS panel for ADIRS {1,2,3}                                                                                   |
| A32NX_Neo_ADIRS_START_TIME | Seconds        | Holds the start time in seconds that the ADIRS TIMER will count down from<br/>Used to have certain things turn on based on a percentage of the total alignment time |
| A32NX_RADAR_GCS_AUTO       | Boolean        | True if GCS switch is set to AUTO.                                                                                                                                  |
| A32NX_RADAR_MULTISCAN_AUTO | Boolean        | True if multiscan switch is set to AUTO.                                                                                                                            |

### ATA34-50 NAVIGATION: DEPENDENT POSITION DETERMINING

| Name                      | Type    | Description                                                                                                                                                                                             |
|:--------------------------|:--------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_AIDS_PRINT_ON       | Boolean | True if AIDS print is on.                                                                                                                                                                               |
| XMLVAR_ALT_MODE_REQUESTED | Number  | Used in the `.flt` files to set a default value for the ALT RPTG 2 way switch on the TCAS panel <br/> Maps to the `I:XMLVAR_ALT_MODE_REQUESTED` variable which is the actual backing var for the switch |
| XMLVAR_Auto               | Number  | Used in the `.flt` files to set a default value for the ATC 3 way switch on the TCAS panel <br/> Maps to the `I:XMLVAR_Auto` variable which is the actual backing var for the switch                    |

### ATA34-60 NAVIGATION: FLIGHT MANAGEMENT COMPUTING

| Name                          | Type    | Description                                                                                                                                                                                                                                                                                         |
|:------------------------------|:--------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_ENG_OUT_ACC_ALT         | Feet    | The engine out acceleration altitude, set in the PERF TAKE OFF page.                                                                                                                                                                                                                                |
|                               |         |                                                                                                                                                                                                                                                                                                     |
| A32NX_FMGC_FLIGHT_PHASE       | Enum    | Holds the FMGCs current flight phase<br/>Use FMGC_FLIGHT_PHASES to check for phases (import NXFMGCFlightPhases from A32NX_Utils)<br/> Value - Meaning <br/> PREFLIGHT - 0 <br/> TAKEOFF - 1 <br/> CLIMB - 2 <br/> CRUISE - 3 <br/> DESCENT - 4 <br/> APPROACH - 5 <br/> GOAROUND - 6 <br/> DONE - 7 |
|                               |         |                                                                                                                                                                                                                                                                                                     |
| A32NX_FWC_FLIGHT_PHASE        | Enum    | Contains the numeric flight phase as determined by the FWC<br/>Input for: systems.wasm                                                                                                                                                                                                              |
| A32NX_FWC_INHIBOVRD           | Boolean | True when the FWC decides that flight phase inhibits should be overridden (and ignored)                                                                                                                                                                                                             |
| A32NX_FWC_LDGMEMO             | Boolean | True when the FWC decides that the landing memo should be shown                                                                                                                                                                                                                                     |
| A32NX_FWC_SKIP_STARTUP        | Boolean | Set to true in a non-cold and dark flight phase to skip the initial memorization step                                                                                                                                                                                                               |
| A32NX_FWC_TOMEMO              | Boolean | True when the FWC decides that the takeoff memo should be shown                                                                                                                                                                                                                                     |
|                               |         |                                                                                                                                                                                                                                                                                                     |
| A32NX_LANDING_ELEVATION       | Feet    | Minimum -2000, maximum 15000                                                                                                                                                                                                                                                                        |
|                               |         |                                                                                                                                                                                                                                                                                                     |
| A32NX_SPEEDS_ALPHA_MAX        | Knots   | speed where alpha max is reached with 1g                                                                                                                                                                                                                                                            |
| A32NX_SPEEDS_ALPHA_PROTECTION | Knots   | speed where alpha protection is reached with 1g                                                                                                                                                                                                                                                     |
|                               |         |                                                                                                                                                                                                                                                                                                     |
| A32NX_TO_CONFIG_FLAPS         | Enum    | The pilot-entered FLAPS value in the PERF TAKE OFF page. 0 is a valid entry.                                                                                                                                                                                                                        |
| A32NX_TO_CONFIG_FLAPS_ENTERED | Boolean | True if the pilot has entered a FLAPS value in the PERF TAKE OFF takeoff                                                                                                                                                                                                                            |
| A32NX_TO_CONFIG_THS           | Degrees | The pilot-entered THS value in the PERF TAKE OFF page. 0 is a valid entry.                                                                                                                                                                                                                          |
| A32NX_TO_CONFIG_THS_ENTERED   | Boolean | True if the pilot has entered a THS value in the PERF TAKE OFF takeoff                                                                                                                                                                                                                              |
|                               |         |                                                                                                                                                                                                                                                                                                     |
| A32NX_VSPEEDS_F               | Knots   | F-Speed (approach)                                                                                                                                                                                                                                                                                  |
| A32NX_VSPEEDS_GD              | Knots   | Green Dot speed (clean config or O) (is mach corrected)                                                                                                                                                                                                                                             |
| A32NX_VSPEEDS_LANDING_CONF3   | Boolean | True if FLAPS 3 is selected in perf page                                                                                                                                                                                                                                                            |
| A32NX_VSPEEDS_S               | Knots   | S-Speed (approach)                                                                                                                                                                                                                                                                                  |
| A32NX_VSPEEDS_TO_CONF         | Number  | Flaps config for TakeOff, 1, 2 or 3                                                                                                                                                                                                                                                                 |
| A32NX_VSPEEDS_V2              | Knots   | TakeOff V2 Speed calculated based on A32NX_VSPEEDS_TO_CONF config                                                                                                                                                                                                                                   |
| A32NX_VSPEEDS_VAPP            | Knots   | vapp calculated for config full whether A32NX_VSPEEDS_LANDING_CONF3 or not (is mach corrected)                                                                                                                                                                                                      |
| A32NX_VSPEEDS_VLS             | Knots   | Current config minimum selectable speed (is mach corrected)                                                                                                                                                                                                                                         |
| A32NX_VSPEEDS_VLS_APP         | Knots   | VLS calculated for config full whether A32NX_VSPEEDS_LANDING_CONF3 or not (is mach corrected)                                                                                                                                                                                                       |
| A32NX_VSPEEDS_VS              | Knots   | Current config stall speed (is mach corrected)                                                                                                                                                                                                                                                      |

## ATA35 OXYGEN

| Name                            | Type    | Description                                    |
|:--------------------------------|:--------|:-----------------------------------------------|
| A32NX_OXYGEN_MASKS_DEPLOYED     | Boolean | True if cabin oxygen masks have been deployed. |
| A32NX_OXYGEN_PASSENGER_LIGHT_ON | Boolean | True if cabin oxygen mask doors open.          |
| A32NX_OXYGEN_TMR_RESET          | Boolean | True if oxygen timer is being reset.           |
| A32NX_OXYGEN_TMR_RESET_FAULT    | Boolean | True if fault with oxygen timer.               |

## ATA39 ELECTRICAL - ELECTRONIC PANELS AND MULTIPURPOSE COMPONENTS

| Name                            | Type           | Description                                 |
|:--------------------------------|:---------------|:--------------------------------------------|
| A32NX_KNOB_SWITCHING_1_Position | Position (0-2) | ATT HDG: 0 is CAPT, 1 is NORM, 2 is F/O     |
| A32NX_KNOB_SWITCHING_2_Position | Position (0-2) | AIR DATA: 0 is CAPT, 1 is NORM, 2 is F/O    |
| A32NX_KNOB_SWITCHING_3_Position | Position (0-2) | EIS DMC: 0 is CAPT, 1 is NORM, 2 is F/O     |
| A32NX_KNOB_SWITCHING_4_Position | Position (0-2) | ECAM/ND XFR: 0 is CAPT, 1 is NORM, 2 is F/O |

## ATA45 ONBOARD MAINTENANCE SYSTEMS (OMS)

| Name                | Type    | Description                          |
|:--------------------|:--------|:-------------------------------------|
| A32NX_DLS_ON (INOP) | Boolean | True if data loading selector is on. |

## ATA49 AUXILIARY POWER UNIT

| Name                                   | Type    | Description                                                                                                                                                                                                 |
|:---------------------------------------|:--------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_APU_AUTOEXITING_RESET            | Boolean | True if APU autoexiting is being reset.                                                                                                                                                                     |
| A32NX_APU_AUTOEXITING_TEST_OK          | Boolean | True if APU AUTOEXITING TEST returns OK.                                                                                                                                                                    |
| A32NX_APU_AUTOEXITING_TEST_ON          | Boolean | True if APU AUTOEXITING is being tested.                                                                                                                                                                    |
| A32NX_APU_BLEED_AIR_VALVE_OPEN         | Boolean | Indicates if the APU bleed air valve is open                                                                                                                                                                |
| A32NX_APU_EGT                          | Celsius | The APU's exhaust gas temperature, when < -273.15 the ECB isn't supplying information, for example due to being unpowered.                                                                                  |
| A32NX_APU_EGT_CAUTION                  | Celsius | The APU's exhaust gas temperature caution level, to be indicated in amber in the cockpit, when < -273.15 the ECB isn't supplying information, for example due to being unpowered.                           |
| A32NX_APU_EGT_WARNING                  | Celsius | The APU's exhaust gas temperature warning level, to be indicated in red in the cockpit, when < -273.15 the ECB isn't supplying information, for example due to being unpowered.                             |
| A32NX_APU_FLAP_FULLY_OPEN              | Number  | -1: The ECB isn't supplying information, for example due to being unpowered.<br/>0: The APU air intake flap isn't fully open.<br/>1: The APU air intake flap is fully open.                                 |
| A32NX_APU_FLAP_OPEN_PERCENTAGE         | Percent | Indicates the percentage the APU air intake flap is open                                                                                                                                                    |
| A32NX_APU_IS_AUTO_SHUTDOWN             | Boolean | Indicates if the APU automatically shut down (for a reason other than fire)                                                                                                                                 |
| A32NX_APU_IS_EMERGENCY_SHUTDOWN        | Boolean | Indicates if the APU automatically shut down due to fire                                                                                                                                                    |
| A32NX_APU_LOW_FUEL_PRESSURE_FAULT      | Number  | -1: The ECB isn't supplying information, for example due to being unpowered.<br/>0: The APU doesn't have an active LOW FUEL PRESSURE fault.<br/>1: Indicates the APU has an active LOW FUEL PRESSURE fault. |
| A32NX_APU_N                            | Percent | The APU's rotations per minute in percentage of the maximum RPM, when < 0 the ECB isn't supplying information, for example due to being unpowered.                                                          |
| A32NX_ECAM_INOP_SYS_APU                | Boolean | Indicates if the APU is inoperable                                                                                                                                                                          |
| A32NX_OVHD_APU_MASTER_SW_PB_HAS_FAULT  | Boolean | Indicates if the push button's FAULT light should illuminate                                                                                                                                                |
| A32NX_OVHD_APU_MASTER_SW_PB_IS_ON      | Boolean | True when the push button is ON                                                                                                                                                                             |
| A32NX_OVHD_APU_START_PB_IS_AVAILABLE   | Boolean | True when the push button's AVAIL light should illuminate                                                                                                                                                   |
| A32NX_OVHD_APU_START_PB_IS_ON          | Boolean | True when the push button is ON                                                                                                                                                                             |
| A32NX_OVHD_PNEU_APU_BLEED_PB_HAS_FAULT | Boolean | Indicates if the push button's FAULT light should illuminate: a FAULT indicates SMOKE should illuminate.                                                                                                    |
| A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON     | Boolean | True when the push button is ON                                                                                                                                                                             |

## ATA72 ENGINE

## ATA73 ENGINE - FUEL AND CONTROL

| Name                        | Type          | Description                                                                              |
|:----------------------------|:--------------|:-----------------------------------------------------------------------------------------|
| A32NX_ENGINE_PRE_FF:{index} | Number (Kg/h) | Previous engine {index} deltaTime fuel flow to calculate spot fuel burn                  |
| A32NX_ENGINE_FF:{index}     | Number (Kg/h) | Custom engine {index} fuel flow to model realistic behavior throughout all flight phases |
| A32NX_ENGINE_IDLE_FF        | Number (Kg/h) | Expected idle fuel flow as a function of temperature and pressure                        |
|                             |               |                                                                                          |
| A32NX_FUEL_AUX_LEFT_PRE     | Number (lbs)  | Previous deltaTime fuel for the aux left tank                                            |
| A32NX_FUEL_AUX_RIGHT_PRE    | Number (lbs)  | Previous deltaTime fuel for the aux right tank                                           |
| A32NX_FUEL_CENTER_PRE       | Number (lbs)  | Previous deltaTime fuel for the center tank                                              |
| A32NX_FUEL_LEFT_PRE         | Number (lbs)  | Previous deltaTime fuel for the main left tank                                           |
| A32NX_FUEL_RIGHT_PRE        | Number (lbs)  | Previous deltaTime fuel for the main right tank                                          |
|                             |               |                                                                                          |
| A32NX_FUEL_USED:{index}     | Number (Kg)   | Fuel burnt by engine {index} on deltaTime                                                |

## ATA75 BLEED AIR

## ATA77 ENGINE INDICATING

| Name                     | Type                         | Description                                                                                                                                                                                                                                                                                                                                                                          |
|:-------------------------|:-----------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_ENGINE_N1:{index}  | Number (% N1)                | Custom engine {index} N1 to model realistic start-up & shutdown, although equal to Sim's N2 for other flight phases.                                                                                                                                                                                                                                                                 |
| A32NX_ENGINE_N2:{index}  | Number (% N2)                | Custom engine N2 {index} to model realistic start-up & shutdown, although equal to Sim's N2 for other flight phases.                                                                                                                                                                                                                                                                 |
|                          |                              |                                                                                                                                                                                                                                                                                                                                                                                      |
| A32NX_ENGINE_EGT:{index} | Number (degrees Celsius)     | Custom engine {index} EGT to model realistic behavior throughout all flight phases                                                                                                                                                                                                                                                                                                   |
| A32NX_ENGINE_IDLE_EGT    | Number (degrees Celsius)>    | Expected idle EGT as a function of temperature and pressure                                                                                                                                                                                                                                                                                                                          |
|                          |                              |                                                                                                                                                                                                                                                                                                                                                                                      |
| A32NX_ENGINE_IDLE_N1     | Number (% N1)                | Expected idle N1 as a function of temperature and pressure                                                                                                                                                                                                                                                                                                                           |
| A32NX_ENGINE_IDLE_N2     | Number (% N2)                | Expected idle N2 as a function of temperature and pressure                                                                                                                                                                                                                                                                                                                           |
| A32NX_ENGINE_IMBALANCE   | Number (2-bit coded decimal) | Defines random engine imbalance of parameters<br/> Bits (from Left) = Parameter <br/>0-1 = Engine affected (01 or 02)<br/> 2-3 = EGT (max 20º imbalance) <br/>4-5 = FF (max 36 Kg/h imbalance) <br/>6-7 = N2 (max 0.3%    imbalance) <br/>8-9 = Oil Qty (max 2 Qt imbalance) <br/>10-11 = Oil Pressure    (max 3 psi imbalance) <br/>12-13 = Idle Oil Pressure (+/- 6 psi imbalance) |

## ATA79 OIL

| Name                           | Type            | Description                                                          |
|:-------------------------------|:----------------|:---------------------------------------------------------------------|
| A32NX_ENGINE_TANK_OIL:{index}  | Number (quarts) | Total engine {index} oil quantity in the oil tank                    |
| A32NX_ENGINE_TOTAL_OIL:{index} | Number (quarts) | Total engine {index} oil quantity in the oil system (tank + circuit) |

## ATA80 STARTING

| Name                       | Type             | Description                                                                                                |
|:---------------------------|:-----------------|:-----------------------------------------------------------------------------------------------------------|
| A32NX_ENGINE_CYCLE_TIME    | Number (seconds) | Sum of Engine 1 & 2 cycle times to detect when engines are alive (pause/ slew management)                  |
| A32NX_ENGINE_STATE:{index} | Number           | Defines actual engine state <br/>State = Value <br/>OFF = 0 <br/>ON = 1 <br/>STARTING = 2<br/>SHUTTING = 3 |
| A32NX_ENGINE_TIMER:{index} | Number (seconds) | Sets a timer to control engine {index} start-up/shutdown events                                            |
| A32NX_ENGMANSTART1_TOGGLE  | Boolean          | True if manual engine 1 start on                                                                           |
| A32NX_ENGMANSTART2_TOGGLE  | Boolean          | True if manual engine 2 start on                                                                           |

## ATA115 FLIGHT SIMULATOR SYSTEMS

| Name                                     | Type   | Description                                                                                                                                               |
|:-----------------------------------------|:-------|:----------------------------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_3D_THROTTLE_LEVER_POSITION_{index} | Number | Animation position of the throttles in 3D model <br/>Position = Value<br/>FULL REVERSE = 0<br/> IDLE = 25<br/> CLB = 50<br/> FLX/MCT = 75<br/> TOGA = 100 |

### Throttle Mapping System

| Name                                                                    | Type             | Description                                                                                                                                                                                                |
|:------------------------------------------------------------------------|:-----------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A32NX_AUTOTHRUST_TLA:{index}                                            | Number (degrees) | Indicates the TLA of the throttle lever {index}, first throttle lever has index 1 <br/>Position = Value <br/>REVERSE = -20 <br/>REV_IDLE = -6 <br/>IDLE = 0 <br/>CLB = 25 <br/>FLX/MCT = 35 <br/>TOGA = 45 |
| A32NX_PERFORMANCE_WARNING_ACTIVE                                        | Boolean          | Indicates if performance for minimum 17fps warning is active: 0 = inactive, 1 = active                                                                                                                     |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_CLIMB_HIGH:{index}        | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_CLIMB_LOW:{index}         | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_FLEXMCT_HIGH:{index}      | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_FLEXMCT_LOW:{index}       | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_IDLE_HIGH:{index}         | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_IDLE_LOW:{index}          | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_REVERSE_HIGH:{index}      | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_REVERSE_IDLE_HIGH:{index} | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_REVERSE_IDLE_LOW:{index}  | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_REVERSE_LOW:{index}       | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_TOGA_HIGH:{index}         | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_A32NX_THROTTLE_MAPPING_TOGA_LOW:{index}          | Number           | Indicates the low or high value to latch into the given detent. Range is from -1 to 1                                                                                                                      |
| A32NX_THROTTLE_MAPPING_INPUT:{index}                                    | Number           | Indicates the raw input values for throttle axis {index}, first axis has index 1. Range is from -1 to 1                                                                                                    |
| A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:{index}                      | Bool             | Indicates if reverse area should be mapped on axis                                                                                                                                                         |


