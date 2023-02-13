# InGamePanels Checklist Fix

Fixes two rendering issues in the InGamePanels checklist UI when rendering nested [`<Block>`](https://docs.flightsimulator.com/html/Content_Configuration/Checklists/#h7) elements by overriding some broken game files via the Virtual File System.

## Sim-Wide Impact

This is distributed as a seperate package as the overriden files cannot be disabled at runtime and are in effect for the entire sim. This means that they impact other aircraft, not just the FlyByWire aircraft. As such, this fix is built as a seperate standalone package so that, in the unlikely event that it conflicts (or is thought to be conflicting) with something else it can be very easily disabled without disabling the FlyByWire A32NX entirely.

The only predicted scenario where this package *should* introduce a conflict is when another package is ALSO overriding the InGamePanels checklist code **OR** if Asobo release an update to the `fs-base-ingamepanels-checklist` package that is incompatible with this one.

## Package Purpose

In the base game using nested checklists causes phantom items to appear and the indentation is bugged leading to checklists that look like this:
![broken nested blocks example](https://user-images.githubusercontent.com/10442662/211322530-9b1946a9-c360-4218-ad5a-225c130d45a0.png)

This folder contains a package that overrides (in the Virtual File System) the base files from: `{PackagesLocation}/Official/{Edition}/fs-base-ingamepanels-checklist/html_ui/InGamePanels/Checklist` with fixed copies of them so that nested blocks are, instead, rendered like so:

![working nested blocks example](https://user-images.githubusercontent.com/10442662/211322762-6ea92b0a-41ec-4106-b6ad-d6788bdd4336.png)