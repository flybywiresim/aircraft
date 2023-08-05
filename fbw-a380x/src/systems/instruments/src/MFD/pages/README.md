# Common UI elements for the MFD

This directory contains the different pages for the A380's MFD. List for pages is still incomplete.

## Status and description of components
Status legend:
✅ MVP complete
3️⃣ Phase 3 in progress: Connect to final interfaces/classes
2️⃣ Phase 2 in progress: Data
1️⃣ Phase 1 in progress: Layout
🟥 Not yet started

### FMS
| Status      | URI | Sprint/Prio |
| ------------- | ------------- | ------------- |
| 2️⃣ | fms/\*/init | 1 |
| 2️⃣ | fms/\*/fuel-load | 1 |
| 2️⃣ | fms/\*/perf | 1 |
|  |  |
| 2️⃣ | fms/\*/f-pln | 1 |
| 🟥 | fms/\*/f-pln-rte-sel | 1 |
| 2️⃣ | fms/\*/f-pln-departure | 1 |
| 2️⃣ | fms/\*/f-pln-arrival | 1 |
| 🟥 | fms/\*/f-pln-airways | 1 |
| 🟥 | fms/\*/f-pln-direct-to | 1 |
| 🟥 | fms/\*/f-pln-hold | 1 |
| 🟥 | fms/\*/f-pln-duplicate-names | 1 |
| 🟥 | fms/\*/f-pln-vert-rev | 2 |
| 🟥 | fms/\*/f-pln-offset | 3 |
| 🟥 | fms/\*/f-pln-fix-info | 3 |
| 🟥 | fms/\*/f-pln-alternate | 3 |
| 🟥 | fms/\*/f-pln-closest-airports | 3 |
| 🟥 | fms/\*/f-pln-cpny-wind-data-req | 3 |
| 🟥 | fms/\*/wind | 3 |
| 🟥 | fms/\*/f-pln-cpny-f-pln-req | 9 |
| 🟥 | fms/\*/f-pln-cpny-to-data-req | 9 |
| 🟥 | fms/\*/f-pln-cpny-to-data-recv | 9 |
| 🟥 | fms/\*/f-pln-equi-time-point | 9 |
| 🟥 | fms/\*/f-pln-ll-xing-time-mkr | 9 |
|  |  |
| 🟥 | fms/position/irs | 1 |
| 🟥 | fms/position/monitor | 2 |
| 🟥 | fms/position/gps | 2 |
| 🟥 | fms/position/navaids | 2 |
| 🟥 | fms/position/report | 3 |
|  |  |
| 🟥 | fms/sec/index | 3 |
|  |  |
| 🟥 | fms/data/airport | 2 |
| 🟥 | fms/data/navaid | 2 |
| 🟥 | fms/data/status | 2 |
| 🟥 | fms/data/waypoint | 2 |
| 🟥 | fms/data/printer | 3 |
| 🟥 | fms/data/route | 3 |
|  |  |
| 2️⃣ | fms/data/msg-list | 1 |

\* (active | sec1 | sec2 | sec3)

### ATCCOM

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

| Status      | URI | Sprint/Prio |
| ------------- | ------------- | ------------- |
| 🟥 | surv/controls | 4 |
| 🟥 | surv/status-switching | 4 |

### FCU BKUP

| Status      | URI | Sprint/Prio |
| ------------- | ------------- | ------------- |
| 🟥 | fcubkup/afs | 5 |
| 🟥 | fcubkup/efis | 5 |

## Known issues / improvements


## (Open) questions
| Page / component | Question | Answer |
| ------------- | ------------- | ------------- |
| Input field | Is it possible to input illegal characters into the input fields before validation? I.e. when selecting an altitude field, and pressing „K“ on the KCCU, does it actually display „K“ in the field? | - |
| Confirmation dialog | When triggering a confirmation dialog (e.g. by selecting a derated thrust, or trying to ACTIVATE APPR), are the other fields and buttons outside the dialog still clickable? Are there images available for the ACTIVATE APPR confirmation dialog? Specifically its location within the PERF page. | yes, everything else remains clickable when there is a “starred” prompt waiting to be clicked. (The star means that it will action something and should be cross checked before selecting/activating) |
| Dropdown menu | When opening a dropdown menu, what are means of selecting and navigating, apart from scroll wheel, keyboard arrows and KCCU cursor? Can you also enter a character or number on the keyboard, and the list jumps to the respective element? | when there is a long list, like waypoints, when you start typing in the drop down, it clears the rest of the drop-down, and searches on the text that you have typed. These results populate a new drop-down (same place as previous one) and the text entry field stays with what you typed. To select one of the ‘found’ entries you need to move the cursor to it and hit enter. |
| System message area | When you're not in the FMS, and there's no message from any of the systems, how does the system message area look like? | - |
| Messages list | When you're on the "MESSAGES LIST" page of the FMS, which of the items in the menu bar is marked as selected (with the rectangle outline, ACTIVE, POSITION, ...)? | - |
