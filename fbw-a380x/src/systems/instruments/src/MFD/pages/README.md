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
|  |  |  |  |
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
|  |  |  |  |
| ✅ | fms/position/irs | 1 | data sources inconsistent |
| ✅ | fms/position/navaids | 2 | deselect glide, ADF input fields, radio nav mode/position, selected navaids table |
| 🟥 | fms/position/monitor | 3 | tbd |
| 🟥 | fms/position/gps | 3 | tbd |
| 🟥 | fms/position/report | 4 | tbd |
|  |  |  |  |
| 🟥 | fms/sec/index | 4 | tbd |
|  |  |  |  |
| ✅ | fms/data/status | 2 | FMS P/N page, swap DB, idle/perf factors  |
| 🟥 | fms/data/airport | 2 | tbd |
| 🟥 | fms/data/navaid | 2 | tbd |
| 🟥 | fms/data/waypoint | 2 | tbd |
| 🟥 | fms/data/printer | 4 | tbd |
| 🟥 | fms/data/route | 3 | tbd |
|  |  |  |  |
| ✅ | fms/data/msg-list | 1 | messages are not deleted automatically when conditions don't apply anymore |

\* (active | sec1 | sec2 | sec3)

### ATCCOM

Use React-based implementation for now, hence no dev. effort needed here.

| Status      | URI | Sprint/Prio |
| ------------- | ------------- | ------------- |
| 2️⃣ | atccom/connect | 6 |
| 🟥 | atccom/connect/max-uplink-delay | 6 |
| 🟥 | atccom/request | 6 |
| 🟥 | atccom/report-modify/position | 6 |
| 🟥 | atccom/report-modify/modify | 6 |
| 🟥 | atccom/report-modify/other-reports | 6 |
| 🟥 | atccom/msg-record | 6 |
| 2️⃣ | atccom/d-atis/list | 6 |
| 2️⃣ | atccom/d-atis/received | 6 |
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
