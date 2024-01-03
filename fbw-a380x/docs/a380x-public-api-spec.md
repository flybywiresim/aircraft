# A380X Public API Specification

## General Specification Aspects

### To clarify

- Prefix for Aircraft (A32NX/A380X) or not
- 2nd prefix for section (OVHD/FCU/...) or not?
- 3rd prefix for panel (ELEC/...) or not?
- 4th prefix for side (CAPT/FO) or not?
- 5th prefix for number (e.g. ENG 1/ENG 2/ENG 3/ENG 4) or not?

{A32NX|A380X}_

Example:
* A380X_PEDESTAL_ENG_MASTER_1 = (0|1)
* A380X_OVHD_FUEL_ENG_3_PUMP_PB_IS_AUTO = (0|1)
* A380X_CONSOLE_CAPT_TILLER = (-1.0..1.0)

## Cockpit Controls API

| Section                    | Panel                      | Name                   | Side    | Var or Event                                 | Values | Remark                         |
|----------------------------|----------------------------|------------------------|---------|----------------------------------------------|--------|--------------------------------|
| Overhead Panel Maintenance | OXYGEN                     |                        |         |                                              |        |                                |
|                            | GND HYD                    |                        |         |                                              |        |                                |
|                            | FUEL                       |                        |         |                                              |        |                                |
|                            | GND HF DATALINK            |                        |         |                                              |        |                                |
|                            | CKPT DOOR LOCK SYS         |                        |         |                                              |        |                                |
|                            | BAT Check                  |                        |         |                                              |        |                                |
|                            | ENG                        |                        |         |                                              |        |                                |
|                            | MAINT                      |                        |         |                                              |        |                                |
|                            | ELEC                       |                        |         |                                              |        |                                |
|                            | NSS                        |                        |         |                                              |        |                                |
|                            | AIR                        |                        |         |                                              |        |                                |
|                            | VENT                       |                        |         |                                              |        |                                |
|                            |                            |                        |         |                                              |        |                                |
| Overhead Panel Left        | RESET                      |                        |         |                                              |        |                                |
|                            | ELT                        |                        |         |                                              |        |                                |
|                            | APU Fire                   |                        |         |                                              |        |                                |
|                            | ADIRS                      |                        |         |                                              |        |                                |
|                            | F/CTL                      |                        |         |                                              |        |                                |
|                            | FUEL                       |                        |         |                                              |        |                                |
|                            | EVAC                       |                        |         |                                              |        |                                |
|                            | EMER ELEC PWR              |                        |         |                                              |        |                                |
|                            | OXYGEN                     |                        |         |                                              |        |                                |
|                            | CALLS                      |                        |         |                                              |        |                                |
|                            | WIPER                      |                        |         |                                              |        |                                |
|                            |                            |                        |         |                                              |        |                                |
| Overhead Panel Center      | ENG FIRE                   |                        |         |                                              |        |                                |
|                            | HYD                        |                        |         |                                              |        |                                |
|                            | FUEL                       |                        |         |                                              |        |                                |
|                            | ELEC                       |                        |         |                                              |        |                                |
|                            | AIR                        |                        |         |                                              |        |                                |
|                            | ANTI ICE                   |                        |         |                                              |        |                                |
|                            | ENG START                  |                        |         |                                              |        |                                |
|                            | CABIN PRESS                |                        |         |                                              |        |                                |
|                            | EXT LT                     |                        |         |                                              |        |                                |
|                            | APU                        |                        |         |                                              |        |                                |
|                            | INT LT                     |                        |         |                                              |        |                                |
|                            | SIGNS                      |                        |         |                                              |        |                                |
|                            |                            |                        |         |                                              |        |                                |
| Overhead Panel Right       | RESET                      |                        |         |                                              |        |                                |
|                            | CVR                        |                        |         |                                              |        |                                |
|                            | RAMP                       |                        |         |                                              |        |                                |
|                            | F/CTL                      |                        |         |                                              |        |                                |
|                            | CARGO AIR COND             |                        |         |                                              |        |                                |
|                            | CARGO SMOKE                |                        |         |                                              |
|                            | VENT                       |                        |         |                                              |        |                                |
|                            | ENG                        |                        |         |                                              |        |                                |
|                            | WIPER                      |                        |         |                                              |        |                                |
|                            |                            |                        |         |                                              |        |                                |
| Glareshield                | FCU EFIS                   |                        |         |                                              |        |                                |
|                            | FCU AFS                    |                        |         |                                              |        |                                |
|                            | ECAM                       | Master Warning Ind     |         | B:A380X_GLARE_ECAM_{CAPT\|FO}_MASTER_WARN    | 0\|1   |                                |
|                            |                            | Master Warning Pb      |         | B:A380X_GLARE_ECAM_{CAPT\|FO}_MASTER_WARN_PB | 0\|1   | resets to 0 zero automatically |
|                            |                            | Master Caution Ind     |         | B:A380X_GLARE_ECAM_{CAPT\|FO}_MASTER_CAUT    | 0\|1   |                                |
|                            |                            | Master Caution Pb      |         | B:A380X_GLARE_ECAM_{CAPT\|FO}_MASTER_CAUT_PB | 0\|1   | resets to 0 zero automatically |
|                            | CHRONO                     | Chrono Pb              | CAPT/FO | B:A380X_GLARE_CAPT_CHRONO_PB                 | 0\|1   | resets to 0 zero automatically |
|                            | INDICATION                 | Sidestick Priority Ind |         |                                              |        |                                |
|                            |                            | Autoland Ind           |         |                                              |        |                                |
|                            |                            | ATC Message Ind        |         |                                              |        |                                |
|                            | Loudspeaker Vol Control    |                        |         |                                              |        |                                |
|                            | Lighting                   |                        |         |                                              |        |                                |
|                            |                            |                        |         |                                              |        |                                |
| Instrument Panel Capt/F.O  | E/WD                       |                        |         |                                              |        |                                |
|                            | ISIS                       | SFD                    |         |                                              |        |                                |
|                            |                            | SND                    |         |                                              |        |                                |
|                            | Triple Pressure Indicator  |                        |         |                                              |        |                                |
|                            | L/G Gravitiy               |                        |         |                                              |        |                                |
|                            | ATT HDG/Air Data Switching |                        |         |                                              |        |                                |
|                            | ND                         |                        |         |                                              |        |                                |
|                            | PFD                        |                        |         |                                              |        |                                |
|                            | OIT                        |                        |         |                                              |        |                                |
|                            | SD                         |                        |         |                                              |        |                                |
|                            | MFD                        |                        |         |                                              |        |                                |
|                            | EFIS RECONF                |                        |         |                                              |        |                                |
|                            |                            |                        |         |                                              |        |                                |
| Center Instrument Panel    | L/G Indication             |                        |         |                                              |        |                                |
|                            | Auto Brake                 |                        |         |                                              |        |                                |
|                            | Anti Skid                  |                        |         |                                              |        |                                |
|                            | L/G Lever                  |                        |         |                                              |        |                                |
|                            | Clock                      |                        |         |                                              |        |                                |
|                            |                            |                        |         |                                              |        |                                |
| Pedestal                   | KCCU                       |                        |         |                                              |        |                                |
|                            | RAMP                       |                        |         |                                              |        |                                |
|                            | SURV                       | WXR ELEVN              |         |                                              |        |                                |
|                            |                            | WXR GAIN               |         |                                              |        |                                |
|                            |                            | WXR VD AZIM            |         |                                              |        |                                |
|                            |                            | WXR TAWS SYS           |         |                                              |        |                                |
|                            |                            | XDPR TCAS SYS          |         |                                              |        |                                |
|                            |                            | TCAS ABV               |         |                                              |        |                                |
|                            |                            | TCAS BLW               |         |                                              |        |                                |
|                            |                            | G/S MODE               |         |                                              |        |                                |
|                            |                            |                        |         |                                              |        |                                |
|                            | ECAM Control               |                        |         |                                              |        |                                |
|                            | Thrust Control             |                        |         |                                              |        |                                |
|                            | Engines Master             |                        |         |                                              |        |                                |
|                            | Speed Brake                |                        |         |                                              |        |                                |
|                            | Park Brake                 |                        |         |                                              |        |                                |
|                            | Pitch Trim                 |                        |         |                                              |        |                                |
|                            | Rudder Trim                |                        |         |                                              |        |                                |
|                            | Flaps                      |                        |         |                                              |        |                                |
|                            | Cockpit Lighting           |                        |         |                                              |        |                                |
|                            | Printer                    |                        |         |                                              |        |                                |
|                            |                            |                        |         |                                              |        |                                |
| Lateral Consoles           | Sidestick                  |                        |         |                                              |        |                                |
|                            | Tiller                     |                        |         |                                              |        |                                |
|                            |                            |                        |         |                                              |        |                                |
| Pedals                     | Brake                      |                        |         |                                              |        |                                |
|                            | Rudder                     |                        |         |                                              |        |                                |
|                            |                            |                        |         |                                              |        |                                |
| Seats                      |                            |                        |         |                                              |        |                                |
| Tables                     |                            |                        |         |                                              |        |                                |
| Cockpit Windows            |                            |                        |         |                                              |        |                                |

## flyPad API

| Section                  | Function  | Var or Event            | Values    | Remark                                                                                  |
|--------------------------|-----------|-------------------------|-----------|-----------------------------------------------------------------------------------------|
| Pushback System          | On/Off    | PUSHBACK_SYSTEM_ENABLED | 0&#124;1  | To turn off the Pushback System completely to not interfere with other pushback add-ons |
| Pushback Movement Factor | Speed     | PUSHBACK_SPD_FACTOR     | -1.0..1.0 | Set the speed of the pushback tug in percent. Negative values are backwards movements.  |
| Pushback Heading Factor  | Direction | PUSHBACK_HDG_FACTOR     | -1.0..1.0 | Set the turning factor from max left (-1.0) to max right (1.0)                          |
| Call Tug                 |           |                         |           |                                                                                         |
| Tug Attached             |           |                         |           |                                                                                         |
|                          |           |                         |           |                                                                                         |
| Payload                  |           |                         |           |                                                                                         |
|                          |           |                         |           |                                                                                         |
| Fuel                     |           |                         |           |                                                                                         |
|                          |           |                         |           |                                                                                         |
| Doors                    |           |                         |           |                                                                                         |
|                          |           |                         |           |                                                                                         |
| Ground Services          |           |                         |           |                                                                                         |
|                          |           |                         |           |                                                                                         |
| Lighting Presets         |           |                         |           |                                                                                         |
|                          |           |                         |           |                                                                                         |
| Aircraft Presets         |           |                         |           |                                                                                         |
|                          |           |                         |           |                                                                                         |

## Flight Data API
For using in external displays.





## OLD FROM A32NX API for copy & paste

## Overhead Forward

### ELEC Panel

| Function      | API Usage                                 | Values    | Read/Write | Type             | Remark                                     |
|:--------------|:------------------------------------------|:----------|:-----------|:-----------------|:-------------------------------------------|
| BAT 1         | A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO          | 0&#124;1  | R/W        | Custom LVAR      |                                            |
|               | A32NX_OVHD_ELEC_BAT_1_PB_HAS_FAULT        | 0&#124;1  | R/W        | Custom LVAR      |                                            |
| BAT 2         | A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO          | 0&#124;1  | R/W        | Custom LVAR      |                                            |
|               | A32NX_OVHD_ELEC_BAT_2_PB_HAS_FAULT        | 0&#124;1  | R/W        | Custom LVAR      |                                            |
|               |                                           |           |            |                  |                                            |
| BAT 1 Display | A32NX_ELEC_BAT_1_POTENTIAL                | 0.0..99.9 | R          | Custom LVAR      |                                            |
| BAT 2 Display | A32NX_ELEC_BAT_2_POTENTIAL                | 0.0..99.9 | R          | Custom LVAR      |                                            |
|               |                                           |           |            |                  |                                            |
| EXT PWR       | TOGGLE_EXTERNAL_POWER                     | -         | -          | MSFS EVENT       |                                            |
|               | EXTERNAL POWER AVAILABLE                  | 0&#124;1  | R          | MSFS VAR         |                                            |
|               | EXTERNAL POWER ON                         | 0&#124;1  | R          | MSFS VAR         |                                            |
|               |                                           |           |            |                  |                                            |
| GEN 1         | TOGGLE_ALTERNATOR:1                       | -         | -          | SIMCONNECT EVENT |                                            |
|               | GENERAL ENG MASTER ALTERNATOR:1           | 0&#124;1  | R/W        | SIMCONNECT VAR   |                                            |
|               | A32NX_OVHD_ELEC_ENG_GEN_1_PB_HAS_FAULT    | 0&#124;1  | R          | Custom LVAR      |                                            |
| GEN 2         | TOGGLE_ALTERNATOR:2                       | -         | -          | SIMCONNECT EVENT |                                            |
|               | GENERAL ENG MASTER ALTERNATOR:2           | 0&#124;1  | R/W        | SIMCONNECT VAR   |                                            |
|               | A32NX_OVHD_ELEC_ENG_GEN_2_PB_HAS_FAULT    | 0&#124;1  | R          | Custom LVAR      |                                            |
|               |                                           |           |            |                  |                                            |
| APU GEN       | APU_GENERATOR_SWITCH_TOGGLE               | -         | -          | SIMCONNECT EVENT |                                            |
|               | APU_GENERATOR_SWITCH_SET                  | 0&#124;1  | -          | SIMCONNECT EVENT |                                            |
|               | APU GENERATOR SWITCH                      | 0&#124;1  | R/W        | SIMCONNECT LVAR  |                                            |
|               | A32NX_OVHD_ELEC_APU_GEN_1_PB_HAS_FAULT    | 0&#124;1  | R          | Custom LVAR      |                                            |
|               |                                           |           |            |                  |                                            |
| BUS TIE       | A32NX_OVHD_ELEC_BUS_TIE_PB_IS_AUTO        | 0&#124;1  | R/W        | Custom LVAR      |                                            |
|               | A32NX_OVHD_ELEC_BUS_TIE_PB_HAS_FAULT      | 0&#124;1  | R          | Custom LVAR      |                                            |
|               |                                           |           |            |                  |                                            |
| AC ESS FEED   | A32NX_OVHD_ELEC_AC_ESS_FEED_PB_IS_NORMAL  | 0&#124;1  | R/W        | Custom LVAR      |                                            |
|               | A32NX_OVHD_ELEC_AC_ESS_FEED_PB_HAS_FAULT  | 0&#124;1  | R          | Custom LVAR      |                                            |
|               |                                           |           |            |                  |                                            |
| IDG 1         | A32NX_OVHD_ELEC_IDG_1_PB_IS_RELEASED      | 0 -> 1    | R/W        | Custom LVAR      | Cannot be undone - flight restart required |
| IDG 1         | A32NX_OVHD_ELEC_IDG_1_PB_HAS_FAULT        | 0&#124;1  | R          | Custom LVAR      |                                            |
|               |                                           |           |            |                  |                                            |
| IDG 2         | A32NX_OVHD_ELEC_IDG_2_PB_IS_RELEASED      | 0 -> 1    | R/W        | Custom LVAR      | Cannot be undone - flight restart required |
| IDG 2         | A32NX_OVHD_ELEC_IDG_2_PB_HAS_FAULT        | 0&#124;1  | R          | Custom LVAR      |                                            |
|               |                                           |           |            |                  |                                            |
| GALY & CAB    | A32NX_OVHD_ELEC_GALY_AND_CAB_PB_IS_AUTO   | 0&#124;1  | R/W        | Custom LVAR      |                                            |
|               | A32NX_OVHD_ELEC_GALY_AND_CAB_PB_HAS_FAULT | 0&#124;1  | R          | Custom LVAR      |                                            |
|               |                                           |           |            |                  |                                            |
| COMMERCIAL    | A32NX_OVHD_ELEC_COMMERCIAL_PB_IS_AUTO     | 0&#124;1  | R/W        | Custom LVAR      |                                            |
|               | A32NX_OVHD_ELEC_COMMERCIAL_PB_HAS_FAULT   | 0&#124;1  | R          | Custom LVAR      |                                            |
|               |                                           |           |            |                  |                                            |

### External Lights Panel

| Function     | API Usage             | Values   | Read/Write | Type             | Remark                                                             |
|:-------------|:----------------------|:---------|:-----------|:-----------------|:-------------------------------------------------------------------|
| STROBE       | STROBES_SET           | 0&#124;1 | -          | SIMCONNECT EVENT | OFF and ON (no AUTO)                                               |
|              | STROBES_TOGGLE        | -        | -          | SIMCONNECT EVENT | OFF and ON (no AUTO)                                               |
|              | STROBES_ON            | -        | -          | SIMCONNECT EVENT | OFF and ON (no AUTO)                                               |
|              | STROBES_OFF           | -        | -          | SIMCONNECT EVENT | OFF and ON (no AUTO)                                               |
|              | LIGHT STROBE          | 0&#124;1 | R/W        | SIMCONNECT VAR   | OFF and ON (no AUTO)                                               |
|              | STROBE_0_AUTO         | 0&#124;1 | R/W        | Custom LVAR      | AUTO only when STROBES are ON                                      |
|              | LIGHTING_STROBE_0     | 0..2     | R/W        |                  | 2=OFF, 1=AUTO, 0=ON                                                |
|              |                       |          |            |                  |                                                                    |
| BEACON       | BEACON_SET            | 0&#124;1 | -          | SIMCONNECT EVENT |                                                                    |
|              | BEACON_TOGGLE         | -        | -          | SIMCONNECT EVENT |                                                                    |
|              | BEACON_ON             | -        | -          | SIMCONNECT EVENT |                                                                    |
|              | BEACON_OFF            | -        | -          | SIMCONNECT EVENT |                                                                    |
|              | LIGHT BEACON          | 0&#124;1 | R/W        | SIMCONNECT VAR   |                                                                    |
|              |                       |          |            |                  |                                                                    |
| WING         | WING_SET              | 0&#124;1 | -          | SIMCONNECT EVENT |                                                                    |
|              | BEACON_TOGGLE         | -        | -          | SIMCONNECT EVENT |                                                                    |
|              | BEACON_ON             | -        | -          | SIMCONNECT EVENT |                                                                    |
|              | BEACON_OFF            | -        | -          | SIMCONNECT EVENT |                                                                    |
|              | LIGHT WING            | 0&#124;1 | R/W        | SIMCONNECT VAR   |                                                                    |
|              |                       |          |            |                  |                                                                    |
| NAV & LOGO   | NAV_LIGHTS_SET        | 0&#124;1 | -          | SIMCONNECT EVENT | LOGO needs to be set separately                                    |
|              | LIGHT NAV             | 0&#124;1 | R/W        | SIMCONNECT VAR   | LOGO needs to be set separately                                    |
|              | LOGO_LIGHTS_SET       | 0&#124;1 | -          | SIMCONNECT EVENT | LOGO does not move switch                                          |
|              | LIGHT LOGO            | 0&#124;1 | R/W        | SIMCONNECT VAR   | LOGO does not move switch                                          |
|              |                       |          |            |                  |                                                                    |
| RWY TURN OFF | CIRCUIT SWITCH ON:21  | 0&#124;1 | R/W        | MSFS VAR         | Left Rwy Turn Off Light + Switch                                   |
|              | CIRCUIT SWITCH ON:22  | 0&#124;1 | R/W        | MSFS VAR         | Right Rwy Turn Off Light                                           |
|              | LIGHT TAXI:2          | 0&#124;1 | R/W        | SIMCONNECT VAR   | Rwy Turn Off Light + Switch                                        |
|              |                       |          |            |                  |                                                                    |
| LAND L + R   | LANDING_LIGHTS_ON     | 0..3     | -          | SIMCONNECT EVENT | 0=all, 1=NOSE, 2=L, 3=R                                            |
|              | LANDING_LIGHTS_OFF    | 0..3     | -          | SIMCONNECT EVENT | 0=all, 1=NOSE, 2=L, 3=R                                            |
|              | LANDING_LIGHTS_TOGGLE | 0..3     | -          | SIMCONNECT EVENT | 0=all, 1=NOSE, 2=L, 3=R                                            |
|              | CIRCUIT SWITCH ON:18  | 0&#124;1 | R/W        | MSFS VAR         | Left landing light                                                 |
|              | CIRCUIT SWITCH ON:19  | 0&#124;1 | R/W        | MSFS VAR         | Right landing light                                                |
|              | LIGHTING_LANDING_1    | 0&#124;1 | R/W        | Custom LVAR      | Switch position of the NOSE switch: 2=OFF, 1=TAXI, 0=T.O.          |
|              | LIGHTING_LANDING_2    | 0&#124;1 | R/W        | Custom LVAR      | Switch position of the left landing light: 2=RETRACT, 1=OFF, 0=ON  |
|              | LIGHTING_LANDING_3    | 0&#124;1 | R/W        | Custom LVAR      | Switch position of the right landing light: 2=RETRACT, 1=OFF, 0=ON |
|              | LANDING_1_RETRACTED   | 0&#124;1 | R/W        | Custom LVAR      | No function - NOSE light can't be retracted                        |
|              | LANDING_2_RETRACTED   | 0&#124;1 | R/W        | Custom LVAR      | Retraction of left landing light: 0=extended, 1=retracted          |
|              | LANDING_3_RETRACTED   | 0&#124;1 | R/W        | Custom LVAR      | Retraction of right landing light 0=extended, 1=retracted          |
|              |                       |          |            |                  |                                                                    |
| NOSE         | TOGGLE_TAXI_LIGHTS    | -        | -          | SIMCONNECT EVENT | Also toggles RWY TURN OFF LIGHT                                    |
|              | LIGHT TAXI            | 0&#124;1 | R/W        | SIMCONNECT VAR   | Only switches TAXI light                                           |
|              | LANDING_LIGHTS_TOGGLE | 1        | -          | SIMCONNECT EVENT | Toggles switch between T.O. and OFF                                |
|              | CIRCUIT SWITCH ON:20  | 0&#124;1 | R/W        | MSFS VAR         | NOSE TAXI                                                          |
|              | CIRCUIT SWITCH ON:17  | 0&#124;1 | R/W        | MSFS VAR         | NOSE T.O.                                                          |

### Interior Lights Panel

| Function               | API Usage              | Values | Read/Write | Type             | Remark               |
|:-----------------------|:-----------------------|:-------|:-----------|:-----------------|:---------------------|
| OVHD INTEG Lt          | LIGHT POTENTIOMETER:86 | 0..100 | R          | MSFS VAR         |                      |
|                        |                        |        |            |                  |                      |
| ICE IND & STBY COMPASS | N/A                    |        |            |                  |                      |
|                        |                        |        |            |                  |                      |
| DOME                   | TOGGLE_CABIN_LIGHTS    | -      | -          | SIMCONNECT EVENT | Toggle OFF-DIM-BRT   |
|                        | LIGHT POTENTIOMETER:7  | 0..100 | R          | MSFS VAR         |                      |
|                        |                        |        |            |                  |                      |
| ANN LT                 | A32NX_OVHD_INTLT_ANN   | 0..2   | R/W        | Custom LVAR      | 2=DIM, 1=BRT, 0=TEST |

### Signs Panel

| Function     | API Usage                                   | Values   | Read/Write | Type             | Remark              |
|:-------------|:--------------------------------------------|:---------|:-----------|:-----------------|:--------------------|
| SEAT BELTS   | CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE         | -        | -          | SIMCONNECT EVENT |                     |
|              | CABIN SEATBELTS ALERT SWITCH                | 0&#124;1 | R          | SIMCONNECT VAR   |                     |
|              |                                             |          |            |                  |                     |
| NO SMOKING   | XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION | 0..2     | R/W        | Custom LVAR      | 0=ON, 1=AUTO, 2=OFF |
|              |                                             |          |            |                  |                     |
| EMER EXIT LT | XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION  | 0..2     | R/W        | Custom LVAR      | 0=ON, 1=AUTO, 2=OFF |

### ADIRS Panel

!!! note "The below table shows the API for ADIR 1. Replace `1` with `2` or `3` for the other ADIRS."

| Function                 | API Usage                                | Values   | Read/Write | Type        | Remark              |
|:-------------------------|:-----------------------------------------|:---------|:-----------|:------------|:--------------------|
| ADIR 1 knob              | A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB | 0..2     | R/W        | Custom LVAR | 0=OFF, 1=NAV, 2=ATT |
|                          |                                          |          |            |             |                     |
| IR 1                     | A32NX_OVHD_ADIRS_IR_1_PB_IS_ON           | 0&#124;1 | R/W        | Custom LVAR |                     |
|                          | A32NX_OVHD_ADIRS_IR_1_PB_HAS_FAULT       | 0&#124;1 | R          | Custom LVAR |                     |
|                          |                                          |          |            |             |                     |
| ADR 1                    | A32NX_OVHD_ADIRS_ADR_1_PB_IS_ON          | 0&#124;1 | R/W        | Custom LVAR |                     |
|                          | A32NX_OVHD_ADIRS_ADR_1_PB_HAS_FAULT      | 0&#124;1 | R          | Custom LVAR |                     |
|                          |                                          |          |            |             |                     |
| Remaining Alignment Time | A32NX_ADIRS_REMAINING_IR_ALIGNMENT_TIME  | seconds  | R          | Custom LVAR |                     |
|                          |                                          |          |            |             |                     |
| ON BAT light             | A32NX_OVHD_ADIRS_ON_BAT_IS_ILLUMINATED   | 0&#124;1 | R          | Custom LVAR |                     |

### APU Panel

| Function  | API Usage                             | Values   | Read/Write | Type        | Remark |
|:----------|:--------------------------------------|:---------|:-----------|:------------|:-------|
| MASTER SW | A32NX_OVHD_APU_MASTER_SW_PB_IS_ON     | 0&#124;1 | R/W        | Custom LVAR |        |
|           | A32NX_OVHD_APU_MASTER_SW_PB_HAS_FAULT | 0&#124;1 | R          | Custom LVAR |        |
|           |                                       |          |            |             |        |
| START     | A32NX_OVHD_APU_START_PB_IS_ON         | 0&#124;1 | R/W        | Custom LVAR |        |
|           | A32NX_OVHD_APU_START_PB_IS_AVAILABLE  | 0&#124;1 | R          | Custom LVAR |        |

### RCDR Panel

| Function  | API Usage                    | Values   | Read/Write | Type        | Remark |
|:----------|:-----------------------------|:---------|:-----------|:------------|:-------|
| GND CTL   | A32NX_RCDR_GROUND_CONTROL_ON | 0&#124;1 | R/W        | Custom LVAR |        |
|           |                              |          |            |             |        |
| CVR ERASE | N/A                          |          |            |             |        |
|           |                              |          |            |             |        |
| CVR TEST  | A32NX_RCDR_TEST              | 0&#124;1 | R/W        | Custom LVAR |        |

### Oxygen Panel

| Function    | API Usage                       | Values   | Read/Write | Type        | Remark |
|:------------|:--------------------------------|:---------|:-----------|:------------|:-------|
| MASK MAN ON | A32NX_OXYGEN_MASKS_DEPLOYED     | 0&#124;1 | R/W        | Custom LVAR |        |
|             |                                 |          |            |             |        |
| PASSENGER   | A32NX_OXYGEN_PASSENGER_LIGHT_ON | 0&#124;1 | R/W        | Custom LVAR |        |
|             |                                 |          |            |             |        |
| CREW SUPPLY | PUSH_OVHD_OXYGEN_CREW           | 0&#124;1 | R/W        | Custom LVAR |        |

### Fire Panel

| Function                  | API Usage                                 | Values   | Read/Write | Type        | Remark                                   |
|:--------------------------|:------------------------------------------|:---------|:-----------|:------------|:-----------------------------------------|
| APU FIRE Test             | A32NX_FIRE_TEST_APU                       | 0&#124;1 | R/W        | Custom LVAR |                                          |
|                           |                                           |          |            |             |                                          |
| APU FIRE GUARD            | A32NX_FIRE_GUARD_APU                      | 0&#124;1 | R/W        | Custom LVAR |                                          |
|                           |                                           |          |            |             |                                          |
| APU FIRE                  | A32NX_FIRE_BUTTON_APU                     | 0&#124;1 | R/W        | Custom LVAR | Open Guard first. Can't be reset.        |
|                           |                                           |          |            |             |                                          |
| APU DISCH                 | A32NX_FIRE_APU_AGENT1_DISCHARGE           | 0&#124;1 | R/W        | Custom LVAR | Press Fire button first. Can't be reset. |
|                           |                                           |          |            |             |                                          |
| ENG {1&#124;2} FIRE TEST  | A32NX_FIRE_TEST_ENG{1&#124;2}             | 0&#124;1 | R/W        | Custom LVAR |                                          |
|                           |                                           |          |            |             |                                          |
| ENG {1&#124;2} FIRE GUARD | A32NX_FIRE_GUARD_ENG{1&#124;2}            | 0&#124;1 | R/W        | Custom LVAR |                                          |
|                           |                                           |          |            |             |                                          |
| ENG {1&#124;2} FIRE       | A32NX_FIRE_BUTTON_ENG{1&#124;2}           | 0&#124;1 | R/W        | Custom LVAR | Open Guard first. Can't be reset.        |
|                           |                                           |          |            |             |                                          |
| ENG {1&#124;2} AGENT1     | A32NX_FIRE_ENG{1&#124;2}_AGENT1_DISCHARGE | 0&#124;1 | R/W        | Custom LVAR | Press Fire button first. Can't be reset. |
|                           |                                           |          |            |             |                                          |
| ENG {1&#124;2} AGENT2     | A32NX_FIRE_ENG{1&#124;2}_AGENT2_DISCHARGE | 0&#124;1 | R/W        | Custom LVAR | Press Fire button first. Can't be reset. |

### Fuel Panel

!!! note "The below table shows ':' if a pump index has to be added. Replace with appropriate value for the corresponding pump. E.g. FUELSYSTEM_PUMP_TOGGLE:2"
L1=2, L2=5, C1=9, C2=10, R1=3, R2=6

    !!! warning ""
        Please note that FUELSYSTEM_PUMP_TOGGLE 1 and 4 for the center tank pump switches got replaced with FUELSYSTEM_VALVE_TOGGLE 9 and 10, due to the NEO having jet pumps instead of conventional pumps, which was corrected in a recent update.

| Function         | API Usage                | Values   | Read/Write | Type       | Remark                                |
|:-----------------|:-------------------------|:---------|:-----------|:-----------|:--------------------------------------|
| Fuel L&R Tank    | FUELSYSTEM_PUMP_TOGGLE   | 2,3,5,6  | -          | MSFS EVENT | Fuel pumps for wing tanks             |
|                  | FUELSYSTEM PUMP ACTIVE:  | 0&#124;1 | R          | MSFS VAR   | Current state of the pump             |
|                  | FUELSYSTEM PUMP SWITCH:  | 0&#124;1 | R          | MSFS VAR   | Current state of the switch           |
|                  |                          |          |            |            |                                       |
| Fuel Center Tank | FUELSYSTEM_VALVE_TOGGLE  | 9,10     | -          | MSFS EVENT | Fuel jet pump valves for center tanks |
|                  | FUELSYSTEM VALVE OPEN:   | 0&#124;1 | R          | MSFS VAR   | Current state of the valve            |
|                  | FUELSYSTEM VALVE SWITCH: | 0&#124;1 | R          | MSFS VAR   | Current state of the switch           |
|                  |                          |          |            |            |                                       |
| X FEED           | FUELSYSTEM_VALVE_TOGGLE  | 3        | -          | MSFS EVENT | X-Feed pump                           |
|                  | FUELSYSTEM VALVE OPEN:   | 0&#124;1 | R          | MSFS VAR   | Current state of the valve            |
|                  | FUELSYSTEM VALVE SWITCH: | 0&#124;1 | R          | MSFS VAR   | Current state of the switch           |
|                  |                          |          |            |            |                                       |
| MODE SEL         | N/A                      |          |            |            |                                       |

### Air Condition Panel

| Function       | API Usage                                     | Values   | Read/Write | Type        | Remark       |
|:---------------|:----------------------------------------------|:---------|:-----------|:------------|:-------------|
| APU BLEED      | A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON            | 0&#124;1 | R/W        | Custom LVAR |              |
|                | LVAR:A32NX_OVHD_PNEU_APU_BLEED_PB_HAS_FAULT   | 1        | R          | Custom LVAR |              |
|                |                                               |          |            |             |              |
| ENG 1 BLEED    | ENGINE_BLEED_AIR_SOURCE_TOGGLE                | 1        | -          | MSFS EVENT  |              |
|                | BLEED AIR ENGINE:1                            | 0&#124;1 | R          |             |              |
|                | LVAR:A32NX_OVHD_PNEU_ENG_1_BLEED_PB_HAS_FAULT | 0&#124;1 | R/W        |             |              |
|                |                                               |          |            |             |              |
| ENG 2 BLEED    | ENGINE_BLEED_AIR_SOURCE_TOGGLE                | 2        | -          | MSFS EVENT  |              |
|                | BLEED AIR ENGINE:1                            | 0&#124;1 | R          |             |              |
|                | LVAR:A32NX_OVHD_PNEU_ENG_2_BLEED_PB_HAS_FAULT | 0&#124;1 | R/W        |             |              |
|                |                                               |          |            |             |              |
| X BLEED knob   | A32NX_KNOB_OVHD_AIRCOND_XBLEED_POSITION       | 0..2     | R/W        | Custom LVAR |              |
|                | A32NX_PNEU_XBLEED_VALVE_OPEN                  | 0&#124;1 | R          | Custom LVAR |              |
|                | APU_BLEED_PRESSURE                            | ..       | R          | Custom LVAR |              |
|                |                                               |          |            |             |              |
| PACK 1         | A32NX_OVHD_COND_PACK_1_PB_IS_ON               | 0&#124;1 | R/W        | Custom LVAR |              |
|                | A32NX_OVHD_COND_PACK_1_PB_HAS_FAULT           | 0&#124;1 | R/W        | Custom LVAR |              |
|                | A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN          | 0&#124;1 | R          | Custom LVAR |              |
|                |                                               |          |            |             |              |
| PACK 2         | A32NX_OVHD_COND_PACK_2_PB_IS_ON               | 0&#124;1 | R/W        | Custom LVAR |              |
|                | A32NX_OVHD_COND_PACK_2_PB_HAS_FAULT           | 0&#124;1 | R/W        | Custom LVAR |              |
|                | A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN          | 0&#124;1 | R          | Custom LVAR |              |
|                |                                               |          |            |             |              |
| PACK FLOW knob | A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_POSITION     | 0..2     | R/W        | Custom LVAR |              |
|                | A32NX_COND_PACK_FLOW                          | 0..120   | R          | Custom LVAR |              |
|                |                                               |          |            |             |              |
| COCKPIT knob   | A32NX_OVHD_COND_CKPT_SELECTOR_KNOB            | 0..300   | R/W        | Custom LVAR |              |
|                | A32NX_COND_CKPT_TEMP                          | °        | R          | Custom LVAR |              |
|                | A32NX_COND_CKPT_DUCT_TEMP                     | °        | R          | Custom LVAR |              |
|                |                                               |          |            |             |              |
| FWD CABIN knob | A32NX_OVHD_COND_FWD_SELECTOR_KNOB             | 0..300   | R/W        | Custom LVAR |              |
|                | A32NX_COND_FWD_TEMP                           | °        | R          | Custom LVAR |              |
|                | A32NX_COND_FWD_DUCT_TEMP                      | °        | R          | Custom LVAR |              |
|                |                                               |          |            |             |              |
| AFT CABIN knob | A32NX_OVHD_COND_AFT_SELECTOR_KNOB             | 0..300   | R/W        | Custom LVAR |              |
|                | A32NX_COND_AFT_TEMP                           | °        | R          | Custom LVAR |              |
|                | A32NX_COND_AFT_DUCT_TEMP                      | °        | R          | Custom LVAR |              |
|                |                                               |          |            |             |              |
| HOT AIR        | A32NX_OVHD_COND_HOT_AIR_PB_IS_ON              | 0&#124;1 | R/W        | Custom LVAR |              |
|                | A32NX_OVHD_COND_HOT_AIR_PB_HAS_FAULT          | 0&#124;1 | R/W        | Custom LVAR |              |
|                |                                               |          |            |             |              |
| RAM AIR        | A32NX_AIRCOND_RAMAIR_TOGGLE_LOCK              | 0&#124;1 | R          | Custom LVAR | Switch Guard |
|                | A32NX_AIRCOND_RAMAIR_TOGGLE                   | 0&#124;1 | R/W        | Custom LVAR |              |

### Anti Ice Panel

| Function          | API Usage                                            | Values   | Read/Write | Type             | Remark                  |
|:------------------|:-----------------------------------------------------|:---------|:-----------|:-----------------|:------------------------|
| WING              | TOGGLE_STRUCTURAL_DEICE                              | -        | -          | SIMCONNECT EVENT | Function & Button light |
|                   | STRUCTURAL DEICE SWITCH                              | 0&#124;1 | R/W        | SIMCONNECT VAR   | Function & Button light |
|                   | XMLVAR_MOMENTARY_PUSH_OVHD_<br/>ANTIICE_WING_PRESSED | 0&#124;1 | R/W        | Custom LVAR      | Button state            |
| WING fault light  | N/A                                                  |          |            |                  |                         |
|                   |                                                      |          |            |                  |                         |
| ENG 1             | ANTI_ICE_TOGGLE_ENG1                                 | -        | -          | SIMCONNECT EVENT | Function & Button light |
|                   | ENG ANTI ICE:1                                       | 0&#124;1 | R/W        | SIMCONNECT VAR   | Function & Button light |
|                   | XMLVAR_MOMENTARY_PUSH_OVHD_<br/>ANTIICE_ENG1_PRESSED | 0&#124;1 | R/W        | Custom LVAR      | Button state            |
| ENG 1 fault light | N/A                                                  |          |            |                  |                         |
|                   |                                                      |          |            |                  |                         |
| ENG 2             | ANTI_ICE_TOGGLE_ENG2                                 | -        | -          | SIMCONNECT EVENT | Function & Button light |
|                   | ENG ANTI ICE:2                                       | 0&#124;1 | R/W        | SIMCONNECT VAR   | Function & Button light |
|                   | XMLVAR_MOMENTARY_PUSH_OVHD_<br/>ANTIICE_ENG2_PRESSED | 0&#124;1 | R/W        | Custom LVAR      | Button state            |
| ENG 2 fault light | N/A                                                  |          |            |                  |                         |
|                   |                                                      |          |            |                  |                         |
| PROBE/WINDOW HEAT | A32NX_MAN_PITOT_HEAT                                 | 0&#124;1 | R/W        | Custom LVAR      | Function & Button light |
|                   | XMLVAR_MOMENTARY_PUSH_OVHD_<br/>PROBESWINDOW_PRESSED | 0&#124;1 | R/W        | Custom LVAR      | Button state            |

### Calls Panel

| Function | API Usage                | Values   | Read/Write | Type        | Remark |
|:---------|:-------------------------|:---------|:-----------|:------------|:-------|
| MECH     | PUSH_OVHD_CALLS_MECH     | 0&#124;1 | R/W        | Custom LVAR |        |
|          |                          |          |            |             |        |
| ALL      | PUSH_OVHD_CALLS_ALL      | 0&#124;1 | R/W        | Custom LVAR |        |
|          |                          |          |            |             |        |
| FWD      | PUSH_OVHD_CALLS_FWD      | 0&#124;1 | R/W        | Custom LVAR |        |
|          |                          |          |            |             |        |
| AFT      | PUSH_OVHD_CALLS_AFT      | 0&#124;1 | R/W        | Custom LVAR |        |
|          |                          |          |            |             |        |
| EMER     | A32NX_CALLS_EMER_ON_LOCK | 0&#124;1 | R          | Custom LVAR |        |
|          | A32NX_CALLS_EMER_ON      | 0&#124;1 | R/W        | Custom LVAR |        |

### Wiper Panel

| Function     | API Usage                               | Values             | Read/Write | Type        | Remark                                               |
|:-------------|:----------------------------------------|:-------------------|:-----------|:------------|:-----------------------------------------------------|
| WIPER L knob | CIRCUIT SWITCH ON:77                    | 0&#124;1           | R/W        | MSFS VAR    | Turns the wiper on/off - slow/fast via power setting |
|              | ELECTRICAL_CIRCUIT_TOGGLE:77            |                    |            | MSFS Event  |                                                      |
|              | ELECTRICAL_CIRCUIT_POWER_SETTING_SET:77 | 0&#124;75&#124;100 |            | MSFS Event  | 0=off, 75=slow, 100=fast                             |           |
|              |                                         |                    |            |             |                                                      |
| WIPER R knob | CIRCUIT SWITCH ON:80                    | 0&#124;1           | R/W        | MSFS        |                                                      |
|              | ELECTRICAL_CIRCUIT_TOGGLE:80            |                    |            | MSFS VAR    |                                                      |
|              | ELECTRICAL_CIRCUIT_POWER_SETTING_SET:80 | 0&#124;75&#124;100 |            | MSFS Event  | 0=off, 75=slow, 100=fast                             |
|              |                                         |                    |            |             |                                                      |
| RAIN RPLNT   | A32NX_RAIN_REPELLENT_LEFT_ON            | 0&#124;1           | R          | Custom LVAR |                                                      |
|              | A32NX_RAIN_REPELLENT_RIGHT_ON           | 0&#124;1           | R          | Custom LVAR |                                                      |

### Flight Control Panel

| Function                 | API Usage                                      | Values   | Read/Write | Type        | Remark |
|:-------------------------|:-----------------------------------------------|:---------|:-----------|:------------|:-------|
| ELAC overhead pushbutton | A32NX_ELAC_{1&#124;2}_PUSHBUTTON_PRESSED       | 0&#124;1 | R/W        | Custom LVAR |        |
| ELAC fault light         | N/A                                            |          |            |             |        |
| FAC overhead pushbutton  | A32NX_FAC_{1&#124;2}_PUSHBUTTON_PRESSED        | 0&#124;1 | R/W        | Custom LVAR |        |
| FAC fault light          | N/A                                            |          |            |             |        |
| SEC overhead pushbutton  | A32NX_SEC_{1&#124;2&#124;3}_PUSHBUTTON_PRESSED | 0&#124;1 | R/W        | Custom LVAR |        |
| SEC fault light          | A32NX_SEC_{1&#124;2&#124;3}_FAULT_LIGHT_ON     | 0&#124;1 | R          | Custom LVAR |        |

## Glareshield

### Lighting Knobs

| Function                    | API Usage              | Values | Read/Write | Type     | Remark |
|:----------------------------|:-----------------------|:-------|:-----------|:---------|:-------|
| Glareshield Integral Lights | LIGHT POTENTIOMETER:84 | 0..100 | R          | MSFS VAR |        |
|                             |                        |        |            |          |        |
| Glareshield LCD Lights      | LIGHT POTENTIOMETER:87 | 0..100 | R          | MSFS VAR |        |
|                             |                        |        |            |          |        |
| Table Light Capt.           | LIGHT POTENTIOMETER:10 | 0..100 | R          | MSFS VAR |        |
|                             |                        |        |            |          |        |
| Table Light F.O.            | LIGHT POTENTIOMETER:11 | 0..100 | R          | MSFS VAR |        |

### EFIS Control Panel

| Function     | API Usage                        | Values           | Read/Write | Type             | Remark                                            |
|:-------------|:---------------------------------|:-----------------|:-----------|:-----------------|:--------------------------------------------------|
| Baro Display | KOHLSMAN SETTING MB:1            | 948-1084 (hPa)   | R          | MSFS VAR         |                                                   |
|              | KOHLSMAN SETTING HG:1            | 27.99-32.01 (Hg) | R          | MSFS VAR         |                                                   |
|              |                                  |                  |            |                  |                                                   |
| Baro knob    | KOHLSMAN_INC                     | -                | -          | SIMCONNECT EVENT |                                                   |
|              | KOHLSMAN_INC                     | -                | -          | SIMCONNECT EVENT |                                                   |
|              | XMLVAR_Baro1_Mode                | 0..2             | R/W        | Custom LVAR      | 0=QFE, 1=QNH, 2=STD                               |
|              |                                  |                  |            |                  |                                                   |
| inHG / hPa   | XMLVAR_BARO_SELECTOR_HPA_1       | 0&#124;1         | R/W        | Custom LVAR      | 0=Hg, 1=hPa                                       |
|              |                                  |                  |            |                  |                                                   |
| FD           | AUTOPILOT FLIGHT DIRECTOR ACTIVE | 0&#124;1         | R          | SIMCONNECT VAR   |                                                   |
|              | TOGGLE_FLIGHT_DIRECTOR           | -                | -          | SIMCONNECT EVENT |                                                   |
|              |                                  |                  |            |                  |                                                   |
| LS Capt.     | BTN_LS_1_FILTER_ACTIVE           | 0&#124;1         | R/W        | Custom LVAR      |                                                   |
| LS F.O.      | BTN_LS_2_FILTER_ACTIVE           | 0&#124;1         | R/W        | Custom LVAR      |                                                   |
|              |                                  |                  |            |                  |                                                   |
| ND Filter    | A32NX_EFIS_L_OPTION              | 0..5             | R/W        | Custom LVAR      | 0=none, 1=CSTR, 2=VOR, 3=WPT, 4=NDB, 5=ARPT       |
|              | A32NX_EFIS_R_OPTION              | 0..5             | R/W        | Custom LVAR      | 0=none, 1=CSTR, 2=VOR, 3=WPT, 4=NDB, 5=ARPT       |
|              |                                  |                  |            |                  |                                                   |
| ND MODE      | A32NX_EFIS_L_ND_MODE             | 0..4             | R/W        | Custom LVAR      | 0=ROSE ILS, 1=ROSE VOR, 2=ROSE NAV. 3=ARC, 4=PLAN |
|              | A32NX_EFIS_R_ND_MODE             | 0..4             | R/W        | Custom LVAR      | 0=ROSE ILS, 1=ROSE VOR, 2=ROSE NAV. 3=ARC, 4=PLAN |
|              |                                  |                  |            |                  |                                                   |
| ND RANGE     | A32NX_EFIS_L_ND_RANGE            | 0..5             | R/W        | Custom LVAR      | 0=10, ..., 5=320                                  |
|              | A32NX_EFIS_R_ND_RANGE            | 0..5             | R/W        | Custom LVAR      | 0=10, ..., 5=320                                  |
|              |                                  |                  |            |                  |                                                   |
| ADF-VOR      | A32NX_EFIS_L_NAVAID_1_MODE       | 0..2             | R/W        | Custom LVAR      | 0=OFF, 1=ADF, 2=VOR                               |
|              | A32NX_EFIS_L_NAVAID_2_MODE       | 0..2             | R/W        | Custom LVAR      | 0=OFF, 1=ADF, 2=VOR                               |
|              | A32NX_EFIS_R_NAVAID_1_MODE       | 0..2             | R/W        | Custom LVAR      | 0=OFF, 1=ADF, 2=VOR                               |
|              | A32NX_EFIS_R_NAVAID_2_MODE       | 0..2             | R/W        | Custom LVAR      | 0=OFF, 1=ADF, 2=VOR                               |

### FCU Panel

| Function          | API Usage                           | Values               | Read/Write | Type             | Remark                                                                   |
|:------------------|:------------------------------------|:---------------------|:-----------|:-----------------|:-------------------------------------------------------------------------|
| SPD knob          | A32NX_AUTOPILOT_SPEED_SELECTED      | 0..399               | R          | Custom LVAR      |                                                                          |
|                   | A32NX.FCU_SPD_INC                   | -                    | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_SPD_DEC                   | -                    | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_SPD_SET                   | 0..399               | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_SPD_PUSH                  | -                    | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_SPD_PULL                  | -                    | -          | Custom EVENT     |                                                                          |
|                   | AP_AIRSPEED_ON                      | -                    | -          | SIMCONNECT EVENT | Push                                                                     |
|                   | AP_AIRSPEED_OFF                     | -                    | -          | SIMCONNECT EVENT | Pull                                                                     |
|                   | AP_SPD_VAR_INC                      | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   | AP_SPD_VAR_DEC                      | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   | AP_MACH_VAR_INC                     | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   | AP_MACH_VAR_DEC                     | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   |                                     |                      |            |                  |                                                                          |
| HDG knob          | A32NX_AUTOPILOT_HEADING_SELECTED    | 0..359               | R          | Custom LVAR      |                                                                          |
|                   | A32NX.FCU_HDG_INC                   | -                    | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_HDG_DEC                   | -                    | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_HDG_SET                   | 0..359               | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_HDG_PUSH                  | -                    | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_HDG_PULL                  | -                    | -          | Custom EVENT     |                                                                          |
|                   | AP_HDG_HOLD_ON                      | -                    | -          | SIMCONNECT EVENT | Push                                                                     |
|                   | AP_HDG_HOLD_OFF                     | -                    | -          | SIMCONNECT EVENT | Pull                                                                     |
|                   | HEADING_BUG_INC                     | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   | HEADING_BUG_DEC                     | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   |                                     |                      |            |                  |                                                                          |
| LOC               | A32NX_FCU_LOC_MODE_ACTIVE           | 0&#124;1             | R          | Custom LVAR      |                                                                          |
|                   | A32NX.FCU_LOC_PUSH                  | -                    | -          | Custom EVENT     |                                                                          |
|                   | AP_LOC_HOLD                         | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   |                                     |                      |            |                  |                                                                          |
| ALT knob          | AUTOPILOT ALTITUDE LOCK VAR:3       | 100..49000           |            | MSFS VAR         |                                                                          |
|                   | A32NX.FCU_ALT_INC                   | 0&#124;100&#124;1000 | R          | Custom EVENT     | 0=Use FCU Setting, 100=100, 1000=1000                                    |
|                   | A32NX.FCU_ALT_DEC                   | 0&#124;100&#124;1000 | R          | Custom EVENT     | 0=Use FCU Setting, 100=100, 1000=1000                                    |
|                   | A32NX.FCU_ALT_SET                   | 100..49000           | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_ALT_PUSH                  | -                    | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_ALT_PULL                  | -                    | -          | Custom EVENT     |                                                                          |
|                   | AP_ALT_HOLD_ON                      | -                    | -          | SIMCONNECT EVENT | Push                                                                     |
|                   | AP_ALT_HOLD_OFF                     | -                    | -          | SIMCONNECT EVENT | Pull                                                                     |
|                   | AP_ALT_VAR_INC                      | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   | AP_ALT_VAR_DEC                      | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   |                                     |                      |            |                  |                                                                          |
| ALT INC 100-1000  | A32NX.FCU_ALT_INCREMENT_TOGGLE      | -                    | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_ALT_INCREMENT_SET         | 100&#124;1000        | -          | Custom EVENT     |                                                                          |
|                   | XMLVAR_AUTOPILOT_ALTITUDE_INCREMENT | 100&#124;1000        | R          | Custom LVAR      |                                                                          |
|                   | AP_ALT_HOLD                         | -                    | -          | SIMCONNECT EVENT | Repurposed event as Simconnect has no standard event for this otherwise. |
|                   |                                     |                      |            |                  |                                                                          |
| EXPED             | A32NX_FMA_EXPEDITE_MODE             | 0&#124;1             | R          | Custom LVAR      |                                                                          |
|                   | A32NX.FCU_EXPED_PUSH                | -                    | -          | Custom EVENT     |                                                                          |
|                   | AP_ATT_HOLD                         | -                    | -          | SIMCONNECT EVENT | Repurposed event as Simconnect has no standard event for this otherwise. |
|                   |                                     |                      |            |                  |                                                                          |
| V/S FPA knob      | A32NX_AUTOPILOT_VS_SELECTED         | -6000..6000          | R          | Custom LVAR      |                                                                          |
|                   | A32NX.FCU_VS_INC                    | -                    | -          | Custom LVAR      | FPA: -9.9..9.9                                                           |
|                   | A32NX.FCU_VS_DEC                    | -                    | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_VS_SET                    | -6000..6000          | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_VS_PUSH                   | -                    | -          | Custom EVENT     | FPA: -9.9..9.9                                                           |
|                   | A32NX.FCU_VS_PULL                   | -                    | -          | Custom EVENT     |                                                                          |
|                   | AP_VS_HOLD_ON                       | -                    | -          | SIMCONNECT EVENT | Push                                                                     |
|                   | AP_VS_HOLD_OFF                      | -                    | -          | SIMCONNECT EVENT | Pull                                                                     |
|                   | AP_VS_VAR_INC                       | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   | AP_VS_VAR_DEC                       | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   |                                     |                      |            |                  |                                                                          |
| APPR              | A32NX_FCU_APPR_MODE_ACTIVE          | 0&#124;1             | R          | Custom LVAR      |                                                                          |
|                   | A32NX.FCU_APPR_PUSH                 | -                    | -          | Custom EVENT     |                                                                          |
|                   | AP_APR_HOLD                         | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   |                                     |                      |            |                  |                                                                          |
| AP 1 + 2          | A32NX_AUTOPILOT_1_ACTIVE            | 0&#124;1             | R          | Custom LVAR      |                                                                          |
|                   | A32NX_AUTOPILOT_2_ACTIVE            | 0&#124;1             | R          | Custom LVAR      |                                                                          |
|                   | A32NX.FCU_AP_1_PUSH                 | -                    | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_AP_2_PUSH                 | -                    | -          | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_AP_DISCONNECT_PUSH        | -                    |            | Custom EVENT     |                                                                          |
|                   | AP_MASTER                           | 1                    | -          | SIMCONNECT EVENT | Toggles                                                                  |
|                   | AUTOPILOT_ON                        | -                    | -          | SIMCONNECT EVENT | 1st call AP1, 2nd call AP2                                               |
|                   | AUTOPILOT_OFF                       | -                    | -          | SIMCONNECT EVENT | Turns off any AP                                                         |
|                   | AUTOPILOT_DISENGAGE_SET             | -                    | -          | SIMCONNECT EVENT | 1 for OFF                                                                |
|                   | AUTOPILOT_DISENGAGE_TOGGLE          | -                    | -          | SIMCONNECT EVENT | Toggles                                                                  |
|                   |                                     |                      | -          |                  |                                                                          |
| A/THR             | A32NX_AUTOTHRUST_STATUS             | 0..2                 | R          | Custom LVAR      | 0=Disengaged, 1=Armed, 2=Active                                          |
|                   | A32NX.FCU_ATHR_PUSH                 | -                    |            | Custom EVENT     |                                                                          |
|                   | A32NX.FCU_ATHR_DISCONNECT_PUSH      | -                    | -          | Custom EVENT     |                                                                          |
|                   | AUTO_THROTTLE_ARM                   | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   | AUTO_THROTTLE_DISCONNECT            | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   | AUTO_THROTTLE_TO_GA                 | -                    | -          | SIMCONNECT EVENT |                                                                          |
|                   |                                     |                      |            |                  |                                                                          |
| SPD/MACH          | AUTOPILOT MANAGED SPEED IN MACH     | 0&#124;1             | R          | MSFS VAR         |                                                                          |
|                   | A32NX.FCU_SPD_MACH_TOGGLE_PUSH      | -                    | -          | Custom EVENT     |                                                                          |
|                   | AP_MACH_HOLD                        | -                    | -          | SIMCONNECT EVENT | Repurposed event as Simconnect has no standard event for this otherwise. |
|                   |                                     |                      |            |                  |                                                                          |
| HDG-TRK / V/S-FPA | A32NX_TRK_FPA_MODE_ACTIVE           | 0&#124;1             | R          | Custom LVAR      |                                                                          |
|                   | A32NX.FCU_TRK_FPA_TOGGLE_PUSH       | -                    | -          | Custom EVENT     |                                                                          |
|                   | AP_VS_HOLD                          | -                    | -          | SIMCONNECT EVENT | Repurposed event as Simconnect has no standard event for this otherwise. |

### Warning Panel

| Function            | API Usage                        | Values   | Read/Write | Type                     | Remark |
|:--------------------|:---------------------------------|:---------|:-----------|:-------------------------|:-------|
| MASTER CAUTION      | A32NX_MASTER_CAUTION             | 0&#124;1 | R/W        | Custom LVAR              |        |
|                     |                                  |          |            |                          |        |
| MASTER WARNING      | A32NX_MASTER_WARNING             | 0&#124;1 | R/W        | Custom LVAR              |        |
|                     |                                  |          |            |                          |        |
| CHRONO              | H:A32NX_EFIS_L_CHRONO_PUSHED     | -        | -          | HTML Event (aka H Event) |        |
|                     | H:A32NX_EFIS_R_CHRONO_PUSHED     | -        | -          | HTML Event (aka H Event) |        |
|                     |                                  |          |            |                          |        |
| SIDE STICK PRIORITY | N/A                              |          |            |                          |        |
|                     |                                  |          |            |                          |        |
| AUTOLAND WARNING    | A32NX_AUTOPILOT_AUTOLAND_WARNING | 0&#124;1 | R/W        | Custom LVAR              |        |
|                     |                                  |          |            |                          |        |
| ATC MSG             | N/A                              |          |            |                          |        |


## Instrument Panel

### Instrument Lighting Control Panel

| Function            | API Usage              | Values      | Read/Write | Type     | Remark |
|:--------------------|:-----------------------|:------------|:-----------|:---------|:-------|
| PFD Brt Cpt.        | LIGHT POTENTIOMETER:88 | 0..100      | R          | MSFS VAR |        |
|                     |                        |             |            |          |        |
| PFD/ND XFR Cpt.     | N/A                    |             |            |          |        |
|                     |                        |             |            |          |        |
| ND Brt Cpt.         | LIGHT POTENTIOMETER:89 | 0..100      | R          | MSFS VAR |        |
|                     |                        |             |            |          |        |
| WX/Terrain Brt Cpt. | LIGHT POTENTIOMETER:94 | 0..100      | R          | MSFS VAR |        |
|                     |                        |             |            |          |        |
| Loud Spkr Cpt.      | N/A                    |             |            |          |        |
|                     |                        |             |            |          |        |
| CONSOLE/FLOOR Cpt.  | LIGHT POTENTIOMETER:8  | 50&#124;100 | R          | MSFS VAR |        |
|                     |                        |             |            |          |        |
| PFD Brt F.O.        | LIGHT POTENTIOMETER:90 | 0..100      | R          | MSFS VAR |        |
|                     |                        |             |            |          |        |
| PFD/ND XFR F.O.     | N/A                    |             |            |          |        |
|                     |                        |             |            |          |        |
| ND Brt F.O.         | LIGHT POTENTIOMETER:91 | 0..100      | R          | MSFS VAR |        |
|                     |                        |             |            |          |        |
| WX/Terrain Brt F.O. | LIGHT POTENTIOMETER:95 | 0..100      | R          | MSFS VAR |        |
|                     |                        |             |            |          |        |
| Loud Spkr F.O.      | N/A                    |             |            |          |        |
|                     |                        |             |            |          |        |
| CONSOLE/FLOOR F.O.  | LIGHT POTENTIOMETER:9  | 50&#124;100 | R          | MSFS VAR |        |

### Autobrake, Gear Lever and Gear Annunciation

| Function              | API Usage                       | Values   | Read/Write | Type             | Remark                             |
|:----------------------|:--------------------------------|:---------|:-----------|:-----------------|:-----------------------------------|
| Gear lever            | GEAR_UP                         | -        | -          | SIMCONNECT EVENT |                                    |
|                       | GEAR_DOWN                       | -        | -          | SIMCONNECT EVENT |                                    |
|                       | GEAR HANDLE POSITION            | 0&#124;1 | R/W        | SIMCONNECT VAR   |                                    |
|                       |                                 |          |            |                  |                                    |
| LDG GEAR Annunciators | GEAR LEFT POSITION              | 0..100   | R          | SIMCONNECT VAR   |                                    |
|                       | GEAR CENTER POSITION            | 0..100   | R          | SIMCONNECT VAR   |                                    |
|                       | GEAR RIGHT POSITION             | 0..100   | R          | SIMCONNECT VAR   |                                    |
|                       |                                 |          |            |                  |                                    |
| AUTO BRK LO/MED/MAX   | A32NX_AUTOBRAKES_ARMED_MODE     | 0..3     | R          | Custom LVAR      | 0=DIS, 1=LO, 2=MED, 3=MAX          |
|                       | A32NX_AUTOBRAKES_ARMED_MODE_SET | -1..3    | W          | Custom LVAR      | -1=techn. 0=DIS, 1=LO,2=MED, 3=MAX |
|                       | A32NX_AUTOBRAKES_ACTIVE         | 0&#124;1 | R          | Custom LVAR      | 0=not braking, 1=braking           |
|                       | A32NX_AUTOBRAKES_DECEL_LIGHT    | 0&#124;1 | R          | Custom LVAR      | 0=off, 1=on                        |
|                       | A32NX.AUTOBRAKE_SET             | 1..4     |            | Custom EVENT     | 1=DIS, 2=LO, 3=MED, 4=MAX          |
|                       | A32NX.AUTOBRAKE_SET_DISARM      | -        | -          | Custom EVENT     |                                    |
|                       | A32NX.AUTOBRAKE_SET_LO          | -        | -          | Custom EVENT     |                                    |
|                       | A32NX.AUTOBRAKE_SET_MED         | -        | -          | Custom EVENT     |                                    |
|                       | A32NX.AUTOBRAKE_SET_MAX         | -        | -          | Custom EVENT     |                                    |
|                       | A32NX.AUTOBRAKE_BUTTON_LO       | -        | -          | Custom EVENT     |                                    |
|                       | A32NX.AUTOBRAKE_BUTTON_MED      | -        | -          | Custom EVENT     |                                    |
|                       | A32NX.AUTOBRAKE_BUTTON_MAX      | -        | -          | Custom EVENT     |                                    |
|                       |                                 |          |            |                  |                                    |
| BRK FAN               | A32NX_BRAKE_FAN_BTN_PRESSED     | 0&#124;1 | R/W        | Custom LVAR      |                                    |
|                       |                                 |          |            |                  |                                    |
| A/SKID & N/W STRG     | ANTISKID_BRAKES_TOGGLE          | -        | -          | SIMCONNECT EVENT |                                    |
|                       | ANTISKID BRAKES ACTIVE          | 0&#124;1 | R/W        | SIMCONNECT VAR   |                                    |

### ISIS

| Function   | API Usage             | Values | Read/Write | Type        | Remark                                      |
|:-----------|:----------------------|:-------|:-----------|:------------|:--------------------------------------------|
| BRIGHTNESS | A32NX_BARO_BRIGHTNESS | 0..100 | R/W        | Custom LVAR | Auto-brightness - will automatically change |

### Clock

| Function            | API Usage                    | Values                | Read/Write | Type        | Remark                       |
|:--------------------|:-----------------------------|:----------------------|:-----------|:------------|:-----------------------------|
| ELAPSED TIME SWITCH | A32NX_CHRONO_ET_SWITCH_POS   | 0..2                  | R/W        | Custom LVAR | 0 = RUN, 1 = STOP, 2 = RESET |
| ELAPSED TIME        | A32NX_CHRONO_ET_ELAPSED_TIME | seconds with decimals | R          | Custom LVAR |                              |
| CHRONO TIME         | A32NX_CHRONO_ELAPSED_TIME    | seconds with decimals | R          | Custom LVAR |                              |

### TERR ON ND

| Function     | API Usage                | Values   | Read/Write | Type        | Remark |
|:-------------|:-------------------------|:---------|:-----------|:------------|:-------|
| TERR ON ND L | A32NX_EFIS_TERR_L_ACTIVE | 0&#124;1 | R/W        | Custom LVAR |        |
| TERR ON ND R | A32NX_EFIS_TERR_R_ACTIVE | 0&#124;1 | R/W        | Custom LVAR |        |

### DCDU

note "The below table shows the API for left DCDU. Replace `L` with `R` for the right DCDU."

| Function    | API Usage                     | Values | Read/Write | Type     | Remark |
|:------------|:------------------------------|:-------|:-----------|:---------|:-------|
| BRT / DIM L | A32NX_PANEL_DCDU_L_BRIGHTNESS | 0..100 | R/W        | MSFS VAR |        |

## Pedestal

### MCDU Panel

!!! note "The below table shows the API for left MCDU. Replace `L` with `R` for the right MCDU."

| Function    | API Usage               | Values | Read/Write | Type     | Remark |
|:------------|:------------------------|:-------|:-----------|:---------|:-------|
| BRT / DIM L | A32NX_MCDU_L_BRIGHTNESS | 0..100 | R/W        | MSFS VAR |        |

### Switching Panel

| Function    | API Usage                        | Values | Read/Write | Type        | Remark                |
|:------------|:---------------------------------|:-------|:-----------|:------------|:----------------------|
| ATT HDG     | A32NX_ATT_HDG_SWITCHING_KNOB     | 0..2   | R/W        | Custom LVAR | 0=CAPT, 1=NORM, 2=F/O |
|             |                                  |        |            |             |                       |
| AIR DATA    | A32NX_AIR_DATA_SWITCHING_KNOB    | 0..2   | R/W        | Custom LVAR | 0=CAPT, 1=NORM, 2=F/O |
|             |                                  |        |            |             |                       |
| EIS DMC     | A32NX_EIS_DMC_SWITCHING_KNOB     | 0..2   | R/W        | Custom LVAR | 0=CAPT, 1=NORM, 2=F/O |
|             |                                  |        |            |             |                       |
| ECAM/NA XFR | A32NX_ECAM_ND_XFR_SWITCHING_KNOB | 0..2   | R/W        | Custom LVAR | 0=CAPT, 1=NORM, 2=F/O |

### ECAM Control Panel

| Function              | API Usage                        | Values   | Read/Write | Type        | Remark                                                                     |
|:----------------------|:---------------------------------|:---------|:-----------|:------------|:---------------------------------------------------------------------------|
| Upper Display         | LIGHT POTENTIOMETER:92           | 0..100   | R          | MSFS VAR    |                                                                            |
|                       |                                  |          |            |             |                                                                            |
| Lower Display         | LIGHT POTENTIOMETER:93           | 0..100   | R          | MSFS VAR    |                                                                            |
|                       |                                  |          |            |             |                                                                            |
| ECAM SD Page button   | A32NX_ECAM_SD_CURRENT_PAGE_INDEX | -1..12   | R/W        | Custom LVAR | See below.                                                                 |
|                       |                                  |          |            |             |                                                                            |
| Left CLR  button      | A32NX_BTN_CLR                    | 0&#124;1 | R/W        | Custom LVAR | This is a momentary button - it needs to be reset to 0 by the API user     |
|                       |                                  |          |            |             |                                                                            |
| Right CLR button      | A32NX_BTN_CLR2                   | 0&#124;1 | R/W        | Custom LVAR | This is a momentary button - it needs to be reset to 0 by the API user     |
|                       |                                  |          |            |             |                                                                            |
| RCL button            | A32NX_BTN_RCL                    | 0&#124;1 | R/W        | Custom LVAR | This is a momentary button - it needs to be reset to 0 by the API user     |
|                       |                                  |          |            |             |                                                                            |
| T.O. CONFIG button    | A32NX_BTN_TOCONFIG               | 0&#124;1 | R/W        | Custom LVAR | This is a momentary button - it needs to be reset to 0 by the API user     |
|                       |                                  |          |            |             |                                                                            |
| EMER CANC button      | A32NX_BTN_EMERCANC               | 0&#124;1 | R/W        | Custom LVAR | This is a momentary button - it needs to be reset to 0 by the API user     |
|                       |                                  |          |            |             |                                                                            |
| Page to show on error | A32NX_ECAM_SFAIL                 | -1..12   | R          | Custom LVAR | See below. <br/>Has the page index of the page called by the error message |

A32NX_ECAM_SD_CURRENT_PAGE_INDEX:

<style>
.md-typeset li {
    line-height: 1.0
}
</style>

- -1  = none
- 0  = ENG
- 1  = BLEED
- 2  = PRESS
- 3  = ELEC
- 4  = HYD
- 5  = FUEL
- 6  = APU
- 7  = COND
- 8  = DOOR
- 9  = WHEEL
- 10 = F-CTL
- 11 = STS
- 12 = CRUISE

### Thrust Lever and Trim Wheel

| Function              | API Usage                   | Values        | Read/Write | Type             | Remark  |
|:----------------------|:----------------------------|:--------------|:-----------|:-----------------|:--------|
| Throttle 1 Axis       | THROTTLE1_AXIS_SET_EX1      | -16383..16384 | -          | MSFS EVENT       |         |
|                       |                             |               |            |                  |         |
| Throttle 2 Axis       | THROTTLE2_AXIS_SET_EX1      | -16383..16384 | -          | MSFS EVENT       |         |
|                       |                             |               |            |                  |         |
| AUTO THRUST DISENGAGE | AUTO_THROTTLE_ARM           | -             | -          | SIMCONNECT EVENT | Toggles |
|                       | A32NX_AUTOTHRUST_DISCONNECT | 0&#124;1      | R          | Custom LVAR      |         |

### RMP

!!! note "The below table shows the API for RMP 1. Replace `1` with `2` or `3` for the other RMPs."

| Function         | API Usage                 | Values           | Read/Write | Type             | Remark                        |
|:-----------------|:--------------------------|:-----------------|:-----------|:-----------------|:------------------------------|
| Active Frequency | COM ACTIVE FREQUENCY:1    | 118.000..136.975 | R/W        | SIMCONNECT VAR   |                               |
|                  |                           |                  |            |                  |                               |
| Stdby Frequency  | COM STANDBY FREQUENCY:1   | 118.000..136.975 | R/W        | SIMCONNECT VAR   |                               |
|                  |                           |                  |            |                  |                               |
| XFER Frequency   | COM1_RADIO_SWAP           | -                | -          | SIMCONNECT EVENT |                               |
|                  |                           |                  |            |                  |                               |
| RMP MODE         | A32NX_RMP_L_SELECTED_MODE | 0..3             | R/W        | Custom LVAR      | 0=SEL, 1=VHF1, 2=VHF2, 3=VHF3 |
|                  |                           |                  |            |                  |                               |
| RMP ON/OFF       | A32NX_RMP_L_TOGGLE_SWITCH | 0&#124;1         | R/W        | Custom LVAR      |                               |
|                  |                           |                  |            |                  |                               |
| Transmit VHF1    | COM TRANSMIT:1            | 0&#124;1         | R          | SIMCONNECT VAR   |                               |
|                  |                           |                  |            |                  |                               |
| Transmit VHF2    | COM TRANSMIT:2            | 0&#124;1         | R          | SIMCONNECT VAR   |                               |
|                  |                           |                  |            |                  |                               |
| Transmit VHF3    | COM TRANSMIT:3            | 0&#124;1         | R          | SIMCONNECT VAR   |                               |

### Lighting Pedestal Captain Side Panel

| Function      | API Usage              | Values | Read/Write | Type     | Remark       |
|:--------------|:-----------------------|:-------|:-----------|:---------|:-------------|
| FLOOD LT Cpt  | LIGHT POTENTIOMETER:83 | 0..100 | R          | MSFS VAR |              |
|               |                        |        |            |          |              |
| INTEG LT      | LIGHT POTENTIOMETER:85 | 0..100 | R          | MSFS VAR |              |
|               |                        |        |            |          |              |
| FLOOD LT F.O. | LIGHT POTENTIOMETER:76 | 0..100 | R          | MSFS VAR | On F.O. side |

### WX Radar

| Function   | API Usage                       | Values   | Read/Write | Type        | Remark                      |
|:-----------|:--------------------------------|:---------|:-----------|:------------|:----------------------------|
| SYS        | XMLVAR_A320_WEATHERRADAR_SYS    | 0..2     | R/W        | Custom LVAR | 0=1, 1=OFF, 2=2             |
|            |                                 |          |            |             |                             |
| PWS        | A32NX_SWITCH_RADAR_PWS_POSITION | 0&#124;1 | R/W        | Custom LVAR | 0=OFF, 1=AUTO               |
|            |                                 |          |            |             |                             |
| MODE       | XMLVAR_A320_WEATHERRADAR_MODE   | 0..3     | R/W        | Custom LVAR | 0=WX, 1=WX+T, 2=TURB, 3=MAP |
|            |                                 |          |            |             |                             |
| GAIN       | N/A                             |          |            |             |                             |
|            |                                 |          |            |             |                             |
| MULTISCANS | N/A                             |          |            |             |                             |
|            |                                 |          |            |             |                             |
| GCS        | N/A                             |          |            |             |                             |
|            |                                 |          |            |             |                             |
| TILT       | N/A                             |          |            |             |                             |


### ATC-TCAS

| Function     | API Usage                          | Values      | Read/Write | Type             | Remark                      |
|:-------------|:-----------------------------------|:------------|:-----------|:-----------------|:----------------------------|
| ATC MODE     | A32NX_TRANSPONDER_MODE             | 0..2        | R/W        | Custom LVAR      | 0=STBY, 1=AUTO, 2=ON        |
|              |                                    |             |            |                  |                             |
| ATC SYSTEM   | A32NX_TRANSPONDER_SYSTEM           | 0&#124;1    | R/W        | Custom LVAR      | 0 = System 1, 1 = System 2  |
|              |                                    |             |            |                  |                             |
| ALT RPTG     | A32NX_SWITCH_ATC_ALT               | 0&#124;1    | R/W        | Custom LVAR      | 0=OFF, 1=ON                 |
|              |                                    |             |            |                  |                             |
| SQUAWK       | TRANSPONDER CODE:1                 | 0000...7777 | R/W        | SIMCONNECT VAR   |                             |
|              |                                    |             |            |                  |                             |
| IDENT        | XPNDR_IDENT_ON                     | -           | -          | SIMCONNECT EVENT |                             |
|              |                                    |             |            |                  |                             |
| TCAS MODE    | A32NX_SWITCH_TCAS_TRAFFIC_POSITION | 0..3        | R/W        | Custom LVAR      | 0=THRT, 1=ALL, 2=ABV, 3=BLW |
|              |                                    |             |            |                  |                             |
| TCAS TRAFFIC | A32NX_SWITCH_TCAS_POSITION         | 0..2        | R/W        | Custom LVAR      | 0=STBY, 1=TA, 2=TA/RA       |

### ENG Panel

| Function       | API Usage                      | Values     | Read/Write | Type       | Remark                 |
|:---------------|:-------------------------------|:-----------|:-----------|:-----------|:-----------------------|
| ENG 1+2 MASTER | FUELSYSTEM_VALVE_OPEN          | 1 &#124; 2 | -          | MSFS EVENT | Activates the switch   |
|                | FUELSYSTEM_VALVE_CLOSE         | 1 &#124; 2 | -          | MSFS EVENT | Deactivates the switch |
|                | FUELSYSTEM VALVE SWITCH:1      | 0&#124;1   | R          | MSFS VAR   |                        |
|                | FUELSYSTEM VALVE SWITCH:2      | 0&#124;1   | R          | MSFS VAR   |                        |
|                |                                |            |            |            |                        |
| MODE           | TURBINE_IGNITION_SWITCH_SET1   | 0..2       | -          | MSFS EVENT | 0=CRANK, 1=NORM, 2=IGN |
|                | TURBINE_IGNITION_SWITCH_SET2   | 0..2       | -          | MSFS EVENT | 0=CRANK, 1=NORM, 2=IGN |
|                | TURB ENG IGNITION SWITCH EX1:1 | 0..2       | R/W        | MSFS VAR   | 0=CRANK, 1=NORM, 2=IGN |
|                | TURB ENG IGNITION SWITCH EX1:2 | 0..2       | R/W        | MSFS VAR   | 0=CRANK, 1=NORM, 2=IGN |
|                |                                |            |            |            |                        |
| FIRE 1 + 2     | N/A                            |            |            |            |                        |

### Speed Brake

| Function         | API Usage                      | Values   | Read/Write | Type             | Remark                           |
|:-----------------|:-------------------------------|:---------|:-----------|:-----------------|:---------------------------------|
| SPEED BRAKE AXIS | SPOILER SET                    | 0..16384 | -          | SIMCONNECT EVENT |                                  |
|                  | A32NX_SPOILERS_HANDLE_POSITION | 0.0..1.0 | R          | Custom LVAR      | (add. SIMCONNECT VARS available) |
|                  |                                |          |            |                  |                                  |
| GND SPOILER ARM  | SPOILERS_ARM_TOGGLE            | -        | -          | SIMCONNECT EVENT |                                  |
|                  | SPOILERS ARMED                 | 0&#124;1 | R/W        | SIMCONNECT VAR   |                                  |
|                  | A32NX_SPOILERS_ARMED           | 0&#124;1 | R          | Custom LVAR      |                                  |

### Flaps

| Function   | API Usage                  | Values   | Read/Write | Type             | Remark                        |
|:-----------|:---------------------------|:---------|:-----------|:-----------------|:------------------------------|
| Flaps Axis | FLAPS_SET                  | 0..16384 | -          | SIMCONNECT EVENT | 0=FLAPS UP, 16384=FLAPS FULL  |
|            | FLAPS_UP                   | -        | -          | SIMCONNECT EVENT |                               |
|            | FLAPS_1                    | -        | -          | SIMCONNECT EVENT |                               |
|            | FLAPS_2                    | -        | -          | SIMCONNECT EVENT |                               |
|            | FLAPS_3                    | -        | -          | SIMCONNECT EVENT |                               |
|            | FLAPS_DOWN                 | -        | -          | SIMCONNECT EVENT |                               |
|            | FLAPS_INCR                 | -        | -          | SIMCONNECT EVENT |                               |
|            | FLAPS_DECR                 | -        | -          | SIMCONNECT EVENT |                               |
|            |                            |          |            |                  |                               |
|            | A32NX_FLAPS_HANDLE_INDEX   | 0..4     | R          | Custom LVAR      | 0=UP, 4=FULL                  |
|            | A32NX_FLAPS_HANDLE_PERCENT | 0.0..1.0 | R          | Custom LVAR      | 0.0=UP, 1.0=FULL (0.25 steps) |
|            |                            |          |            |                  |                               |
|            | FLAPS HANDLE INDEX         | 0..5     | R          | SIMCONNECT VAR   | 0=UP, 5=FULL, 1 is not used.  |
|            | FLAPS HANDLE PERCENT       | 0.0..1.0 | R          | SIMCONNECT VAR   | 0.0=UP, 1.0=FULL (0.2 steps)  |

### Parking Brake

| Function      | API Usage                  | Values   | Read/Write | Type        | Remark |
|:--------------|:---------------------------|:---------|:-----------|:------------|:-------|
| PARKING BRAKE | A32NX_PARK_BRAKE_LEVER_POS | 0&#124;1 | R/W        | Custom LVAR |        |

### Rudder Trim

| Function | API Usage         | Values      | Read/Write | Type             | Remark                                                                            |
|:---------|:------------------|:------------|:-----------|:-----------------|:----------------------------------------------------------------------------------|
| Display  | RUDDER TRIM PCT   | -1.0..1.0   | R          | SIMCONNECT VAR   | -1.0=20° left, 1.0=20° right                                                      |
|          | RUDDER TRIM       | -0.35..0.35 | R          | SIMCONNECT VAR   | Radians: 0.3490×180°/π = 19.99°                                                   |
|          |                   |             |            |                  |                                                                                   |
| RESET    | RUDDER_TRIM_RESET | -           | .          | SIMCONNECT EVENT |                                                                                   |
|          |                   |             |            |                  |                                                                                   |
| RUD TRIM | XMLVAR_RUDDERTRIM | 0 &#124; 2  | R/W        | Custom LVAR      | ~~Knob jumps back. Needs to be set repeatably until the target value is reached~~ |

### Cockpit Door

| Function     | API Usage                 | Values   | Read/Write | Type        | Remark |
|:-------------|:--------------------------|:---------|:-----------|:------------|:-------|
| COCKPIT DOOR | A32NX_COCKPIT_DOOR_LOCKED | 0&#124;1 | R/W        | Custom LVAR |        |
|              |                           |          |            |             |        |
| VIDEO        | PUSH_DOORPANEL_VIDEO      | 0&#124;1 | R/W        | Custom LVAR |        |

## Side Stick

| Function             | API Usage                 | Values        | Read/Write | Type             | Remark                  |
|:---------------------|:--------------------------|:--------------|:-----------|:-----------------|:------------------------|
| Aileron              | AILERON_SET               | -16383..16384 | -          | SIMCONNECT EVENT |                         |
|                      | AILERON POSITION          | -1.0..1.0     | R          | SIMCONNECT VAR   |                         |
|                      |                           |               |            |                  |                         |
| Elevator             | ELEVATOR_SET              | -16383..16384 | -          | SIMCONNECT EVENT |                         |
|                      | ELEVATOR POSITION         | -1.0..1.0     | R          | SIMCONNECT VAR   |                         |
|                      |                           |               |            |                  |                         |
| TAKE OVER pushbutton | A32NX_PRIORITY_TAKEOVER:1 | 0&#124;1      | R          | Custom LVAR      | Causes AP disconnection |
|                      | A32NX_PRIORITY_TAKEOVER:2 | 0&#124;1      | R          | Custom LVAR      | Causes AP disconnection |

## Tiller

## Rudder Pedals

| Function | API Usage                      | Values        | Read/Write | Type             | Remark |
|:---------|:-------------------------------|:--------------|:-----------|:-----------------|:-------|
| Rudder   | RUDDER_SET                     | -16383..16384 | -          | SIMCONNECT EVENT |        |
|          | RUDDER POSITION                | -1.0..1.0     | R          | SIMCONNECT VAR   |        |
|          |                                |               |            |                  |        |
| Brakes   | A32NX_LEFT_BRAKE_PEDAL_INPUT   | 0..100        | R          | Custom LVAR      |        |
|          | A32NX_RIGHT_BRAKE_PEDAL_INPUT  | 1..100        | R          | Custom LVAR      |        |
|          | SIMCONNECT:AXIS_LEFT_BRAKE_SET | -16383..16384 | -          | SIMCONNECT EVENT |        |
|          | SIMCONNECT:AXIS_LEFT_BRAKE_SET | -16383..16384 | -          | SIMCONNECT EVENT |        |

## flyPad EFB

| Function                                     | API Usage                             | Values    | Read/Write | Type                     | Remark                                                                                 |
|:---------------------------------------------|:--------------------------------------|:----------|:-----------|:-------------------------|:---------------------------------------------------------------------------------------|
| Hardware Power Button                        | A32NX_EFB_POWER                       | -         | -          | HTML Event (aka H Event) | Toggles EFB Power                                                                      |
| EFB Brightness                               | A32NX_EFB_BRIGHTNESS                  | 0..100    | R/W        | Custom LVAR              | Overwrites automatic setting                                                           |
| Load Lighting Preset                         | A32NX_LOAD_LIGHTING_PRESET            | 1..8      | R/W        | Custom LVAR              | Aircraft must be powered. Will be reset to 0 after the preset has been loaded.         |
| Save Lighting Preset                         | A32NX_SAVE_LIGHTING_PRESET            | 1..8      | R/W        | Custom LVAR              | Aircraft must be powered. Will be reset to 0 after the preset has been saved.          |
| Load Aircraft Preset                         | A32NX_LOAD_AIRCRAFT_PRESET            | 1..5      | R/W        | Custom LVAR              | Will be reset to 0 after the preset has been loaded.                                   |
| Current Progress for Aircraft Preset Loading | A32NX_LOAD_AIRCRAFT_PRESET_PROGRESS   | 0.0..1.0  | R          | Custom LVAR              | Percent done of the Aircraft State to be loaded.                                       |
| Current Aircraft Preset Loading Step         | A32NX_LOAD_AIRCRAFT_PRESET_CURRENT_ID | 0..999    | R          | Custom LVAR              | ID of the current step.                                                                |

### Pushback API

| Function                 | API Usage                     | Values    | Read/Write | Type        | Remark                                                                                  |
|:-------------------------|:------------------------------|:----------|:-----------|:------------|:----------------------------------------------------------------------------------------|
| Pushback System          | A32NX_PUSHBACK_SYSTEM_ENABLED | 0&#124;1  | R/W        | Custom LVAR | To turn off the Pushback System completely to not interfere with other pushback add-ons |
| Pushback Movement Factor | A32NX_PUSHBACK_SPD_FACTOR     | -1.0..1.0 | R/W        | Custom LVAR | Set the speed of the pushback tug in percent. Negative values are backwards movements.  |
| Pushback Heading Factor  | A32NX_PUSHBACK_HDG_FACTOR     | -1.0..1.0 | R/W        | Custom LVAR | Set the turning factor from max left (-1.0) to max right (1.0)                          |

??? tip "Pushback API HowTo"
#### Pushback API HowTo
Using the Pushback API is relatively easy, but you also might need some additional sim events/vars to make it work.
The following step-by-step description helps you to use buttons on a controller or a Stream Deck to control the
pushback.

    * Set the Pushback System to enabled ==> set L:A32NX_PUSHBACK_SYSTEM_ENABLED to 1
    * Use the sim var `PUSHBACK STATE` to check if the pushback tug is connected to the aircraft
        - PUSHBACK STATE == 3 ==> Pushback tug is **not** connected
        - PUSHBACK STATE < 3 ==> Pushback tug is connected
        - Alternatively there is also the sim var `Pushback Attached` which can also be used.
    * Call the Pushback Tug via the SimConnect Event `K:TOGGLE_PUSHBACK`
    * Wait until the Pushback Tug is connected to the aircraft
        - Should be immediately and is independent of the actual visual pushback tug being attached to the aircraft 
        - This is a sim issue, as MSFS will not wait for the pushback tug model to be attached before setting the 
        corresponding sim vars
    * Set the Pushback Movement Factor via the LVAR `L:A32NX_PUSHBACK_SPD_FACTOR` to the desired value
    * Set the Pushback Heading Factor via the LVAR `L:A32NX_PUSHBACK_HDG_FACTOR` to the desired value
    * Set the Pushback Movement Factor via the LVAR `L:A32NX_PUSHBACK_SPD_FACTOR` to `0` to stop the pushback tug
    * To disconnect the pushback tug, call the SimConnect Event `K:TOGGLE_PUSHBACK` again

    #### Pushback API Example

    ![img.png](../assets/api-guide/pushback-api-example.png){loading=lazy}
    
    | Button                      | Pseudo Code                                                                 | Remark                    |
    |-----------------------------|-----------------------------------------------------------------------------|---------------------------|
    | PUSHBACK<br/>SYSTEM         | toggle `L:A32NX_PUSHBACK_SYSTEM_ENABLED`                                    | 0 or 1                    |
    | Forward                     | `L:A32NX_PUSHBACK_SPD_FACTOR` = oldvalue + 0.1                              | -1.0..1.0, 0 = not moving |
    | TUG                         | call `K:TOGGLE_PUSHBACK`                                                    |                           |
    | Left                        | `L:A32NX_PUSHBACK_HDG_FACTOR` = oldvalue - 0.1                              | -1.0..1.0, 0 = straight   |
    | PUSHBACK<br/>STOPPED/MOVING | `L:A32NX_PUSHBACK_SPD_FACTOR` = 0.0<br/>`L:A32NX_PUSHBACK_HDG_FACTOR` = 0.0 |                           |
    | Right                       | `L:A32NX_PUSHBACK_HDG_FACTOR` = oldvalue + 0.1                              |                           |
    | STRAIGHT                    | `L:A32NX_PUSHBACK_HDG_FACTOR` = 0.0                                         |                           |
    | Backward                    | `L:A32NX_PUSHBACK_SPD_FACTOR` = oldvalue - 0.1                              |                           |
    | 30% back                    | `L:A32NX_PUSHBACK_SPD_FACTOR` = -0.3                                        |                           |
        
