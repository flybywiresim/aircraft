# MFD pages

This directory contains the different pages for the A380's MFD. List for pages is still incomplete.

## Status and description of components
Status legend:
✅ MVP complete
2️⃣ Phase 2 in progress: Data
1️⃣ Phase 1 in progress: Layout
🟥 Not yet started

### FMS
| Status      | URI | Sprint/Prio | Missing functionality |
| ------------- | ------------- | ------------- | ------------- |
| ✅ | fms/\*/init | 1 | CPNY WIND REQUEST, RTE SEL, ALTN RTE SEL, CPNY T.O REQUEST |
| ✅ | fms/\*/fuel-load | 1 | RTE RSV, correct fuel calculation, FUEL PLANNING |
| ✅ | fms/\*/perf | 1 | OPT FL, REC MAX, EO behavior, display of type of speed restriction (when MANAGED), PRED TO |
|  |  |
| ✅ | fms/\*/f-pln | 1 | F-PLN INFO button, exit of hold not possible via button |
| ✅ | fms/\*/f-pln-departure | 1 | - |
| ✅ | fms/\*/f-pln-arrival | 1 | - |
| ✅ | fms/\*/f-pln-airways | 1 | not scrollable |
| ✅ | fms/active/f-pln-direct-to | 1 | direct with abeam, crs in/out |
| ✅ | fms/\*/f-pln-duplicate-names | 1 | not scrollable |
| ✅ | fms/\*/f-pln-cpny-f-pln-req | 1 | Just SimBrief download right now |
| ✅ | fms/\*/f-pln-hold | 2 | last exit predictions, database holds |
| ✅ | fms/\*/f-pln-vert-rev | 2 | RTA (except ETT), CMS, STEP ALTs, setting whether CLB/DES cstr |
| 🟥 | fms/\*/f-pln-rte-sel | 3 | tbd |
| 🟥 | fms/\*/f-pln-offset | 3 | tbd |
| 🟥 | fms/\*/f-pln-fix-info | 3 | tbd |
| 🟥 | fms/\*/f-pln-alternate | 3 | tbd |
| 🟥 | fms/\*/f-pln-closest-airports | 3 | tbd |
| 🟥 | fms/\*/f-pln-cpny-wind-data-req | 4 | tbd |
| 🟥 | fms/\*/wind | 4 | tbd |
| 🟥 | fms/\*/f-pln-cpny-to-data-req | 9 | tbd |
| 🟥 | fms/\*/f-pln-cpny-to-data-recv | 9 | tbd |
| 🟥 | fms/\*/f-pln-equi-time-point | 9 | tbd |
| 🟥 | fms/\*/f-pln-ll-xing-time-mkr | 9 | tbd |
|  |  |  |
| ✅ | fms/position/irs | 1 | data sources inconsistent |
| ✅ | fms/position/navaids | 2 | deselect glide, ADF input fields, radio nav mode/position, selected navaids table |
| 🟥 | fms/position/monitor | 3 | tbd |
| 🟥 | fms/position/gps | 3 | tbd |
| 🟥 | fms/position/report | 4 | tbd |
|  |  |
| 🟥 | fms/sec/index | 4 | tbd |
|  |  |
| ✅ | fms/data/status | 2 | FMS P/N page, swap DB, idle/perf factors  |
| 🟥 | fms/data/airport | 2 | tbd |
| 🟥 | fms/data/navaid | 2 | tbd |
| 🟥 | fms/data/waypoint | 2 | tbd |
| 🟥 | fms/data/printer | 4 | tbd |
| 🟥 | fms/data/route | 3 | tbd |
|  |  |
| ✅ | fms/data/msg-list | 1 | messages are not deleted automatically when conditions don't apply anymore |

\* (active | sec1 | sec2 | sec3)

### ATCCOM
Use React-based implementation for now, hence no dev. effort needed here.

| Status      | URI | Sprint/Prio |
| ------------- | ------------- | ------------- |
| 🟥 | atccom/connect/notification | 6 |
| 🟥 | atccom/connect/connection-status | 6 |
| 🟥 | atccom/connect/max-uplink-delay | 6 |
| 🟥 | atccom/request | 6 |
| 🟥 | atccom/report-modify/position | 6 |
| 🟥 | atccom/report-modify/modify | 6 |
| 🟥 | atccom/report-modify/other-reports | 6 |
| 🟥 | atccom/msg-record | 6 |
| 🟥 | atccom/atis | 6 |
| 🟥 | atccom/atis/list | 6 |
| 🟥 | atccom/emer | 6 |

### SURV

| Status      | URI | Sprint/Prio | Missing functionality |
| ------------- | ------------- | ------------- |
| ✅ | surv/controls | 2 | TCAS+WXR not functional |
| 🟥 | surv/status-switching | 4 | tbd |

### FCU BKUP

| Status      | URI | Sprint/Prio |
| ------------- | ------------- | ------------- |
| 🟥 | fcubkup/afs | 5 |
| 🟥 | fcubkup/efis | 5 |

## Known issues / improvements
| Page / component | Known issue |
| ------------- | ------------- |
| PERF | PRED TO not functional |
| PERF | DES: MANAGED speed or mach can't be set |
| AIRWAYS | Can't delete pending airways (RL behavior to be checked) |
| FMS-v2 | Can't start airway with DCT via if first entry (set VIA to DCT, enter desired WPT as TO, submit --> nothing happens) |

## (Open) questions
| Page / component | Question | Answer |
| ------------- | ------------- | ------------- |
| Input field | Is it possible to input illegal characters into the input fields before validation? I.e. when selecting an altitude field, and pressing „K“ on the KCCU, does it actually display „K“ in the field? | you can input anything on the keyboard.. the keys are limited and not as many as a QWERTY keyboard. |
| Confirmation dialog | When triggering a confirmation dialog (e.g. by selecting a derated thrust, or trying to ACTIVATE APPR), are the other fields and buttons outside the dialog still clickable? Are there images available for the ACTIVATE APPR confirmation dialog? Specifically its location within the PERF page. | yes, everything else remains clickable when there is a “starred” prompt waiting to be clicked. (The star means that it will action something and should be cross checked before selecting/activating) |
| Dropdown menu | When opening a dropdown menu, what are means of selecting and navigating, apart from scroll wheel, keyboard arrows and KCCU cursor? Can you also enter a character or number on the keyboard, and the list jumps to the respective element? | when there is a long list, like waypoints, when you start typing in the drop down, it clears the rest of the drop-down, and searches on the text that you have typed. These results populate a new drop-down (same place as previous one) and the text entry field stays with what you typed. To select one of the ‘found’ entries you need to move the cursor to it and hit enter. |
| System message area | When you're not in the FMS, and there's no message from any of the systems, how does the system message area look like? | with no messages, the message list is greyed out and not selectable.  |
| Messages list | When you're on the "MESSAGES LIST" page of the FMS, which of the items in the menu bar is marked as selected (with the rectangle outline, ACTIVE, POSITION, ...)? | when on messages list, whatever page tab you had selected remains boxed.  |
| F-PLN | How does an empty F-PLN page look like? Before INIT, no entries at all. | - |
| F-PLN | When clicking on the altitude field of an enroute field, does it navigate to the VERT REV page or stay on the F-PLN page? | - |
