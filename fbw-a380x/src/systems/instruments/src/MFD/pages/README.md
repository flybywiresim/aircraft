# Common UI elements for the MFD

This directory contains the different pages for the A380's MFD. List for pages is still incomplete.

## Status and description of components
Status legend:
✅ Feature complete
2️⃣ Phase 2 in progress: Data
1️⃣ Phase 1 in progress: Layout
🟥 Not yet started

### FMS
| Status      | URI | Sprint/Prio |
| ------------- | ------------- | ------------- |
| 🟥 | fms/\*/init | 1 |
| 🟥 | fms/\*/fuel-load | 1 |
| 1️⃣ | fms/\*/perf | 1 |
|  |  |
| 🟥 | fms/\*/f-pln | 1 |
| 🟥 | fms/\*/f-pln/rte-sel | 1 |
| 🟥 | fms/\*/f-pln/departure | 1 |
| 🟥 | fms/\*/f-pln/arrival | 1 |
| 🟥 | fms/\*/f-pln/airways | 1 |
| 🟥 | fms/\*/f-pln/direct-to | 1 |
| 🟥 | fms/\*/f-pln/hold | 1 |
| 🟥 | fms/\*/f-pln/duplicate-names | 1 |
| 🟥 | fms/\*/f-pln/vert-rev | 2 |
| 🟥 | fms/\*/f-pln/offset | 3 |
| 🟥 | fms/\*/f-pln/fix-info | 3 |
| 🟥 | fms/\*/f-pln/alternate | 3 |
| 🟥 | fms/\*/f-pln/closest-airports | 3 |
| 🟥 | fms/\*/f-pln/cpny-wind-data-req | 3 |
| 🟥 | fms/\*/wind | 3 |
| 🟥 | fms/\*/f-pln/cpny-f-pln-req | 9 |
| 🟥 | fms/\*/f-pln/cpny-to-data-req | 9 |
| 🟥 | fms/\*/f-pln/cpny-to-data-recv | 9 |
| 🟥 | fms/\*/f-pln/equi-time-point | 9 |
| 🟥 | fms/\*/f-pln/ll-xing-time-mkr | 9 |
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
| 🟥 | fms/data/msg-list | 1 |

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
