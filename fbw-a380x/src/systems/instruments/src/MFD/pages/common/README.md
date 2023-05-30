# Common UI elements for the MFD

This directory contains common user interface elements for building the A380's MFD.

## Status and description of components
Status legend:
✅ Feature complete
🟨 In progress
🟥 Not yet started


| Status      | Component class name | Description |
| ------------- | ------------- | ------------- |
| ✅ | ActivePageTitleBar | Display title of currently active page at the top of the screen |
| ✅ | Button | Generic button |
| ✅ | ContextMenu | Context menu, e.g. for F-PLN page or OANS in ND |
| ✅ | DropdownMenu | Generic dropdown menu |
| ✅ | Footer | Footer with "MSG LIST" button |
| 🟥 | FcuButton | Button for FCU BKUP page, mimicing the look of the MCP buttons (LOC, ALT, ...) |
| ✅ | FmsHeader | Header (system selector + page navigator) for FMS system |
| ✅ | AtccomHeader | Header (system selector + page navigator) for ATCCOM system |
| ✅ | SurvHeader | Header (system selector + page navigator) for SURV system |
| ✅ | FcuBkupHeader | Header (system selector + page navigator) for FCU BKUP system |
| 🟨 | IconButton | Button consisting of just an icon (e.g. F-PLN up/down) |
| 🟨 | MouseCursor | Custom mouse cursor for MFD |
| 🟨 | NumberInput | Number input field |
| ✅ | PageSelectorDropdownMenu | Page selector buttons incl. dropdown menu |
| ✅ | RadioButtonGroup | Generic radio buttons |
| 🟥 | SurvButton | Button for SURV page, activating/deactivating systems |
| ✅ | TopTabNavigator | Cycle through sub-pages using top tabs (found on ACTIVE/PERF) |

## Known issues / improvements

### MouseCursor
Currently, only active captain's cursor is implemented. F/O cursor and inactive cursor differ in color and orientation.

### NumberInput
Needs rather extensive work. Missing features: Blinking caret and amber boxes for mandatory fields. Might need complete, custom implementation of a text input (not using the standard HTML element with styling).
