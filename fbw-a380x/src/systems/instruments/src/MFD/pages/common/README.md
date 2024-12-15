# Common UI elements for the MFD

This directory contains common user interface elements for building the A380's MFD.

## Status and description of components

Status legend:
✅ MVP complete
🟨 In progress
🟥 Not yet started

| Status      | Component class name | Description |
| ------------- | ------------- | ------------- |
| ✅ | ActivePageTitleBar | Display title of currently active page at the top of the screen |
| ✅ | Button | Generic button, with optional dropdown menu |
| 🟥 | Checkbox | E.g. found on time marker page, for enabling aural alerts |
| ✅ | ContextMenu | Context menu, e.g. for F-PLN page or OANS in ND |
| ✅ | ConfirmationDialog | Confirmation dialog, e.g. for confirming ACTIVATE APPR or selected derated thrust |
| ✅ | DropdownMenu | Generic dropdown menu |
| ✅ | Footer | Footer with "MSG LIST" button |
| 🟥 | FcuButton | Button for FCU BKUP page, mimicking the look of the MCP buttons (LOC, ALT, ...) |
| ✅ | FmsHeader | Header (system selector + page navigator) for FMS system |
| ✅ | AtccomHeader | Header (system selector + page navigator) for ATCCOM system |
| ✅ | SurvHeader | Header (system selector + page navigator) for SURV system |
| ✅ | FcuBkupHeader | Header (system selector + page navigator) for FCU BKUP system |
| 🟨 | IconButton | Button consisting of just an icon (e.g. F-PLN up/down) |
| ✅ | MouseCursor | Custom mouse cursor for MFD |
| ✅ | InputField | Text/number input field |
| ✅ | PageSelectorDropdownMenu | Page selector buttons incl. dropdown menu |
| ✅ | RadioButtonGroup | Generic radio buttons |
| 🟥 | SurvButton | Button for SURV page, activating/deactivating systems |
| ✅ | TopTabNavigator | Cycle through sub-pages using top tabs (found on e.g. ACTIVE/PERF) |

## Known issues / improvements

### IconButton

Not all icons added yet (will evolve over time, until all pages are complete)
