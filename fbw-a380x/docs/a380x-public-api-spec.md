# A380X Public API Specification

## General Specification Aspects

### To clarify

- Prefix for Aircraft (A32NX/A380X) or not
- 2nd prefix for section (OVHD/FCU/...) or not?
- 3rd prefix for panel (ELEC/...) or not?
- 4th prefix for side (CAPT/FO) or not?
- EVENT/VAR NAME
- postfix for number (e.g. ENG 1/ENG 2/ENG 3/ENG 4) or left/right (e.g. L/R)

{A32NX|A380X}_OVHD_ELEC_BAT_PB_IS_AUTO_{1|2} = (0|1)

Example:
* A380X_PEDESTAL_ENG_MASTER_1 = (0|1)
* A380X_OVHD_ELEC_BAT_PB_IS_AUTO_2 = (0|1)
* A380X_CONSOLE_CAPT_TILLER = (-1.0..1.0)
* A380X_OVHD_FUEL_XFR_{OUTR|MID|INR}_AUTO_{L|R} = (0|1)

## Cockpit Controls API

| Section                    | Panel                      | Name                     | Var or Event                                         | Values | Remark                         |
|----------------------------|----------------------------|--------------------------|------------------------------------------------------|--------|--------------------------------|
| Overhead Panel Maintenance | OXYGEN                     |                          |                                                      |        |                                |
|                            | GND HYD                    |                          |                                                      |        |                                |
|                            | FUEL                       |                          |                                                      |        |                                |
|                            | GND HF DATALINK            |                          |                                                      |        |                                |
|                            | CKPT DOOR LOCK SYS         |                          |                                                      |        |                                |
|                            | BAT Check                  |                          |                                                      |        |                                |
|                            | ENG                        |                          |                                                      |        |                                |
|                            | MAINT                      |                          |                                                      |        |                                |
|                            | ELEC                       |                          |                                                      |        |                                |
|                            | NSS                        |                          |                                                      |        |                                |
|                            | AIR                        |                          |                                                      |        |                                |
|                            | VENT                       |                          |                                                      |        |                                |
|                            |                            |                          |                                                      |        |                                |
| Overhead Panel Left        | RESET                      |                          |                                                      |        |                                |
|                            | ELT                        |                          |                                                      |        |                                |
|                            | APU Fire                   |                          |                                                      |        |                                |
|                            | ADIRS                      |                          |                                                      |        |                                |
|                            | F/CTL                      |                          |                                                      |        |                                |
|                            | FUEL                       |                          |                                                      |        |                                |
|                            | EVAC                       |                          |                                                      |        |                                |
|                            | EMER ELEC PWR              |                          |                                                      |        |                                |
|                            | OXYGEN                     |                          |                                                      |        |                                |
|                            | CALLS                      |                          |                                                      |        |                                |
|                            | WIPER                      |                          |                                                      |        |                                |
|                            |                            |                          |                                                      |        |                                |
| Overhead Panel Center      | ENG FIRE                   |                          |                                                      |        |                                |
|                            | HYD                        |                          |                                                      |        |                                |
|                            | FUEL                       | CROSSFEED OPEN INDICATOR | B:A380X_OVHD_FUEL_CROSSFEED_OPEN_IND_{1\|2\|3\|4}    | 0\|1   |                                |
|                            |                            | CROSSFEED PUSHBUTTON     | B:A380X_OVHD_FUEL_CROSSFEED_PB_ON_{1\|2\|3\|4}       | 0\|1   |                                |
|                            |                            | FEED TK MAIN             | B:A380X_OVHD_FUEL_FEED_MAIN_PB_ON_{1\|2\|3\|4}       | 0\|1   |                                |
|                            |                            |                          | B:A380X_OVHD_FUEL_FEED_MAIN_FAULT_{1\|2\|3\|4}       | 0\|1   |                                |
|                            |                            | FEED TK STBY             | B:A380X_OVHD_FUEL_FEED_STBY_PB_ON_{1\|2\|3\|4}       | 0\|1   |                                |
|                            |                            |                          | B:A380X_OVHD_FUEL_FEED_STBY_FAULT_{1\|2\|3\|4}       | 0\|1   |                                |
|                            |                            | Transfer Pumps L+R       | B:A380X_OVHD_FUEL_{OUTR\|MID\|INR}\_AUTO_{L\|R}      | 0\|1   |                                |
|                            |                            |                          | B:A380X_OVHD_FUEL_{OUTR\|MID\|INR}\_AUTO_{L\|R}      | 0\|1   |                                |
|                            |                            | Auto Transfer L+R        | B:A380X_OVHD_FUEL_XFR_{OUTR\|MID\|INR}\_AUTO_{L\|R}  | 0\|1   | Shows MAN if not AUTO (==0)    |
|                            | ELEC                       |                          | B:A380X_OVHD_FUEL_XFR_{OUTR\|MID\|INR}\_FAULT_{L\|R} | 0\|1   |                                |
|                            | AIR                        |                          |                                                      |        |                                |
|                            | ANTI ICE                   |                          |                                                      |        |                                |
|                            | ENG START                  |                          |                                                      |        |                                |
|                            | CABIN PRESS                |                          |                                                      |        |                                |
|                            | EXT LT                     |                          |                                                      |        |                                |
|                            | APU                        |                          |                                                      |        |                                |
|                            | INT LT                     |                          |                                                      |        |                                |
|                            | SIGNS                      |                          |                                                      |        |                                |
|                            |                            |                          |                                                      |        |                                |
| Overhead Panel Right       | RESET                      |                          |                                                      |        |                                |
|                            | CVR                        |                          |                                                      |        |                                |
|                            | RAMP                       |                          |                                                      |        |                                |
|                            | F/CTL                      |                          |                                                      |        |                                |
|                            | CARGO AIR COND             |                          |                                                      |        |                                |
|                            | CARGO SMOKE                |                          |                                                      |
|                            | VENT                       |                          |                                                      |        |                                |
|                            | ENG                        |                          |                                                      |        |                                |
|                            | WIPER                      |                          |                                                      |        |                                |
|                            |                            |                          |                                                      |        |                                |
| Glareshield                | FCU EFIS                   |                          |                                                      |        |                                |
|                            | FCU AFS                    |                          |                                                      |        |                                |
|                            | ECAM                       | Master Warning Ind       | B:A380X_GLARE_ECAM_{CAPT\|FO}_MASTER_WARN            | 0\|1   |                                |
|                            |                            | Master Warning Pb        | B:A380X_GLARE_ECAM_{CAPT\|FO}_MASTER_WARN_PB         | 0\|1   | resets to 0 zero automatically |
|                            |                            | Master Caution Ind       | B:A380X_GLARE_ECAM_{CAPT\|FO}_MASTER_CAUT            | 0\|1   |                                |
|                            |                            | Master Caution Pb        | B:A380X_GLARE_ECAM_{CAPT\|FO}_MASTER_CAUT_PB         | 0\|1   | resets to 0 zero automatically |
|                            | CHRONO                     | Chrono Pb                | B:A380X_GLARE_CAPT_CHRONO_PB                         | 0\|1   | resets to 0 zero automatically |
|                            | INDICATION                 | Sidestick Priority Ind   |                                                      |        |                                |
|                            |                            | Autoland Ind             |                                                      |        |                                |
|                            |                            | ATC Message Ind          |                                                      |        |                                |
|                            | Loudspeaker Vol Control    |                          |                                                      |        |                                |
|                            | Lighting                   |                          |                                                      |        |                                |
|                            |                            |                          |                                                      |        |                                |
| Instrument Panel Capt/F.O  | E/WD                       |                          |                                                      |        |                                |
|                            | ISIS                       | SFD                      |                                                      |        |                                |
|                            |                            | SND                      |                                                      |        |                                |
|                            | Triple Pressure Indicator  |                          |                                                      |        |                                |
|                            | L/G Gravitiy               |                          |                                                      |        |                                |
|                            | ATT HDG/Air Data Switching |                          |                                                      |        |                                |
|                            | ND                         |                          |                                                      |        |                                |
|                            | PFD                        |                          |                                                      |        |                                |
|                            | OIT                        |                          |                                                      |        |                                |
|                            | SD                         |                          |                                                      |        |                                |
|                            | MFD                        |                          |                                                      |        |                                |
|                            | EFIS RECONF                |                          |                                                      |        |                                |
|                            |                            |                          |                                                      |        |                                |
| Center Instrument Panel    | L/G Indication             |                          |                                                      |        |                                |
|                            | Auto Brake                 |                          |                                                      |        |                                |
|                            | Anti Skid                  |                          |                                                      |        |                                |
|                            | L/G Lever                  |                          |                                                      |        |                                |
|                            | Clock                      |                          |                                                      |        |                                |
|                            |                            |                          |                                                      |        |                                |
| Pedestal                   | KCCU                       |                          |                                                      |        |                                |
|                            | RAMP                       |                          |                                                      |        |                                |
|                            | SURV                       | WXR ELEVN                |                                                      |        |                                |
|                            |                            | WXR GAIN                 |                                                      |        |                                |
|                            |                            | WXR VD AZIM              |                                                      |        |                                |
|                            |                            | WXR TAWS SYS             |                                                      |        |                                |
|                            |                            | XDPR TCAS SYS            |                                                      |        |                                |
|                            |                            | TCAS ABV                 |                                                      |        |                                |
|                            |                            | TCAS BLW                 |                                                      |        |                                |
|                            |                            | G/S MODE                 |                                                      |        |                                |
|                            |                            |                          |                                                      |        |                                |
|                            | ECAM Control               |                          |                                                      |        |                                |
|                            | Thrust Control             |                          |                                                      |        |                                |
|                            | Engines Master             |                          |                                                      |        |                                |
|                            | Speed Brake                |                          |                                                      |        |                                |
|                            | Park Brake                 |                          |                                                      |        |                                |
|                            | Pitch Trim                 |                          |                                                      |        |                                |
|                            | Rudder Trim                |                          |                                                      |        |                                |
|                            | Flaps                      |                          |                                                      |        |                                |
|                            | Cockpit Lighting           |                          |                                                      |        |                                |
|                            | Printer                    |                          |                                                      |        |                                |
|                            |                            |                          |                                                      |        |                                |
| Lateral Consoles           | Sidestick                  |                          |                                                      |        |                                |
|                            | Tiller                     |                          |                                                      |        |                                |
|                            |                            |                          |                                                      |        |                                |
| Pedals                     | Brake                      |                          |                                                      |        |                                |
|                            | Rudder                     |                          |                                                      |        |                                |
|                            |                            |                          |                                                      |        |                                |
| Seats                      |                            |                          |                                                      |        |                                |
| Tables                     |                            |                          |                                                      |        |                                |
| Cockpit Windows            |                            |                          |                                                      |        |                                |

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

