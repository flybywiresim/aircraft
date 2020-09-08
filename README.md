# FlyByWire A32NX - Stable 0.2.0

# Important

### Please follow ALL steps in this README if you encounter any issues with installation before seeking support.

## About
The A32NX Project is a community driven open source project to create a free Airbus A320neo in Microsoft Flight Simulator that is as close to reality as possible. It aims to enhance the default A320neo by improving the systems depth and functionality to bring it up to payware-level, all for free.

Central Repository: https://github.com/flybywiresim/a32nx

## Installation
Installation is really simple. You only have to download the "A32NX" folder.

For the Microsoft Store edition AND/OR Gamepass edition:
* Copy the "A32NX" folder into your community package folder. It is located in:
`C:\Users\[YOUR USERNAME]\AppData\Local\Packages\Microsoft.FlightSimulator_<RANDOMLETTERS>\LocalCache\Packages\Community`.

For the Steam edition:
* Copy the "A32NX" folder into your community package folder. It is located in:
`C:\Users\[YOUR USERNAME]\AppData\Roaming\Microsoft Flight Simulator\Packages\Community`.

For the Boxed edition:
* Copy the "A32NX" folder into your community package folder. It is located in:
`C:\Users\[YOUR USERNAME]\AppData\Local\MSFSPackages\Community`.

If the aforementioned methods do not work:
* You can find your community folder by going into FS2020 general options and enabling developer mode. You will see a menu appear on top. Go to tools and virtual file system. Click on watch bases and your community folder will be listed in one of the folders.
* Please make sure you're copying the "A32NX" folder into your community package folder, NOT the "flybywiresim-a32nx" folder.

## Developing

The A32NX package only contains files which have been modified from the original package. If you wish to work on a file that isn't present in the development branch, simply copy it over from the latest Asobo branch. Please DO NOT add, modify, or delete files from the Asobo branch.

Join our Discord server to find out about the latest updates and discuss ongoing development.

[![Discord](https://img.shields.io/discord/738864299392630914.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/UjzuHMU)

### Committing changes

After making any changes to files inside the `A32NX` directory, ensure you run the `build.py` script to regenerate the `layout.json` as necessary. There's also a CI check to ensure this has been done.

## Changelog

## [0.2.0] - 2020-09-04
### Added
- **[ADIRS]** Added ADIRS knob functionality
- **[ADIRS]** Added ADIRS ALIGN light functionality
- **[ADIRS]** IRS alignment affects PFD and MFD displays and indicators
- **[ADIRS]** IRS alignment affects TAT and SAT indicators on lower ECAM
- **[ADIRS]** IRS alignment time dependent on latitude
- **[ADIRS]** IRS alignment time remaining displays on upper ECAM
- **[BRAKES]** Brake gauge now properly reflects status of toe brakes and parking brakes
- **[CHRONO]** Added basic chronometer functionality
- **[ECAM]** Added full APU Bleed functionality to APU ECAM page
- **[ECAM]** Added F/CTL ECAM page with support for elevator, aileron, and pitch trim movements
- **[ECAM]** F/CTL ECAM reflects current ELAC and SEC status
- **[ECAM]** Lower ECAM automatically switches to DOOR page when a door is opened
- **[ECAM]** Lower ECAM automatically switches to APU page when APU master is switched on
- **[ECAM]** Added ECAM memos 'OVERSPEED', 'GND SPLRS ARMED', 'SEAT BELTS', and 'NO SMOKING'
- **[MFD]** Added range change indicator to navigation display
- **[MFD]** Added GPS status to navigation display
- **[MISC]** PFD, MFD, and ECAM displays now present a self-test upon powering up
- **[MISC]** PFD, MFD, ECAM, and MCDU displays no longer work only on battery - require external power or APU/engine generators
- **[MISC]** Added seatbelt sign switch functionality
- **[MISC]** Added no smoking sign switch functionality (full range of motion currently restricted)
- **[MISC]** Added moveable dummy knobs for cockpit, fwd, and aft cabin air conditioning controls
- **[MISC]** Added full (non-interactive) checklist
- **[SOUND]** Added chimes for seatbelt and no smoking switches

### Changed
- **[APU]** APU start and flap logic adjusted
- **[APU]** APU EGT is now adjusted for ambient temperature
- **[APU]** Smoothened APU EGT curve
- **[APU]** APU bleed now momentarily drops when bleed valve is opened
- **[BRAKES]** Fixed accumulator pressure changing when on battery
- **[BRAKES]** Autobrake is now off when starting cold-and-dark
- **[ECAM]** APU gen arrow now only shows when APU connected to bus
- **[ECAM]** APU 'FLAP OPEN' no longer displays instantly but reflects actual flap opening time
- **[ECAM]** Bleed ECAM page implemented
- **[ECAM]** Initializes on DOOR page instead of FUEL
- **[ELEC]** Battery display is now always on and displays battery voltage instead of main bus voltage
- **[FCU]** Altitude selection knob no longer requires explicit push/pull interaction to update new altitude target
- **[FCU]** Increased size of managed mode indicators
- **[FCU]** Adjusted alignment of altitude and vertical speed displays
- **[FMA]** Corrected '1FD2' to '1 FD 2' on FMA
- **[FMA]** Fixed 'SPEED' appearing whilst on the ground and A/THR requiring AP
- **[FMA]** Fixed various issues with thrust modes appearing incorrectly
- **[FMA]** Fixed thrust modes appearing when in GS or VS modes
- **[FMA]** Fixed 'SRS' appearing as armed, fixed 'SRS' disengagement conditions
- **[FMA]** 'SPEED' no longer appears with autopilot/auto-throttle disengaged
- **[FMA]** 'NAV', 'CLB', and 'DES' no longer appear with flight directors disabled
- **[FMA]** Fixed 'SPEED' and 'MACH' flickering at cruise
- **[FMA]** Improved 'OP DES' and 'OP CLB' trigger logic
- **[FMA]** Fixed 'CLB' and 'DES' appearing at incorrect times as well as on ground
- **[FMA]** Fixed 'NAV' not appearing with AP disengaged
- **[FMA]** Fixed 'ALT' in blue not appearing when changing altitudes
- **[FMA]** Fixed 'ROLLOUT' appearing after leaving the runway
- **[FMA]** Fixed 'GS' appearing with no FD's active
- **[FMA]** Fixed 'A/THR' appearing enabled on the ground
- **[FMA]** Fixed 'MACH' appearing on the ground
- **[FMA]** Fixed 'SPEED' and 'MACH' not appearing in some situations
- **[FMA]** Fixed 'THR LVR' and 'THR IDLE' not appearing in some situations
- **[FMA]** Decreased sensitivity for 'THR CLB' appearing on the FMA.
- **[FMA]** Fixed 'THR IDLE' not appearing when descending
- **[FMA]** Fixed 'THR LVR' appearing when in cruise phase
- **[FMA]** Fixed 'SPEED' not appearing with AP off but A/THR on
- **[FMA]** Fixed AP and FD FMA modes appearing green instead of white.
- **[FMA]** Fixed 'FINAL APP', 'LAND', 'FLARE', 'ROLLOUT' appearing with FD off
- **[FMA]** Fixed a situation where 'SPEED' wouldn't appear
- **[FMA]** Fixed 'HDG' appearing when on the ground
- **[FMA]** Fixed 'SINGLE' and 'DUAL' not appearing on ILS approaches
- **[FMA]** Fixed 'CAT' not appearing on FMA, improved logic to match ICAO criteria
- **[FMA]** Corrected logic for engaging ILS categories
- **[FMA]** Improved A/THR FMA modes logic.
- **[FMA]** Improved logic for 'CAT' modes on ILS approaches
- **[FMA]** Added support for 'ALT G/S' armed FMA mode
- **[FMA]** Improved CAT logic on FMA
- **[LIGHTS]** Brightness knobs for PFD, MFD, ECAM, FCU, and overhead panel are turned down when spawning cold-and-dark
- **[LIGHTS]** Reduced ambient cockpit lighting
- **[LIGHTS]** Change minimum brightness to 0 on all displays
- **[MISC]** Improve phase change logic
- **[MISC]** Change initial FLT states
- **[MISC]** Fixed engine selector on crank when starting in-flight or on approach
- **[MFD]** Adjusted look of wind arrow on navigation display
- **[PERF]** Overpowered engine thrust reduced
- **[PERF]** Fuel consumption improved
- **[TEXTURES]** Adjusted textures for panels, pedestal, and cockpit decals
- **[TEXTURES]** Adjusted colors on overhead panel

### Removed
- **[LIGHTS]** Taxi light no longer bleeds into cockpit
- **[SOUND]** Removed 70ft and 60ft radio altimeter callouts
- **[SOUND]** Removed overspeed voice warning (master warning chime will still play)

## [0.1.1] - 2020-08-24
### Changed
- **[MISC]** Re-organized into standalone community package

## [0.1.0] - 2020-08-23
### Added
- **[ECAM]** AddedAPU ECAM page
- **[ECAM]** Added Door ECAM page
- **[ECAM]** Added Bleed ECAM page placeholder
- **[MFD]** Added MODE change indication in navigation display

### Changed
- **[PERF]** Decreased fuel consumption
- **[PERF]** Increased APU startup time

### Removed
- **[ECAM]** Removed INOP property from all ECAM page buttons

## Known Issues (Please note that most issues are being worked on and some of them may even be fixed in the dev branch)
- No Smoking switch doesn't use full range of motion.
- T.O Config is not fully functional yet.
- F/CTL page does not have working rudder and speedbrake integration
- BLEED page is not fully functional
- Automatic ECAM page switching should not light up ECAM buttons
 

## FAQ

**Q: Can I download the aircraft in the current state?**

A: Yes, the master branch contains the latest stable release. You can always download it off the dev branch, but keep in mind it is a WIP and will be unstable.

**Q: Where is the plane in-sim?**

A: The mod is added on top on the default A320neo from Asobo. If you want to uninstall it and revert to the original aircraft, just delete the A32NX folder in your community folder.

**Q: What are the liveries available?**

A: This project modifies the default A320 Neo from Asobo, therefore all liveries is compatible.

**Q: When will it be released?**

A: The project is an ongoing rolling release. You can download the latest (stable) version from the master branch of this repository!

**Q: When is the next update?**

A: We don't know, since it depends on many factors. We'll however announce it each time there's an update! We are currently working on a visual roadmap to let you know what latest features we are working on!

**Q: How do I join the team?**

A: Join our Discord server and either select your role from the bot at #roles , or you DM inaxair#1819.

**Q: Is it payware?**

A: No, it is a completely free aircraft, open-source.

**Q: What is the roadmap/progress?**

A: You can follow our current progress on the trello: https://trello.com/b/z3jimJLq/study-level-a320neo

**Q: How do we report bugs?**

A: If the bug is related to features introduced by our mod, please open a GitHub issue with a thorough description of it, and screenshots if necessary. Otherwise, you have two options: Report it on the discord server at #bugs-and-suggestions, or fill this form (that will be directly linked to the dev attention) :https://docs.google.com/forms/d/e/1FAIpQLSe6Bdx8x8mFmOmBoAipYoazfeomrJ8cri55NBn32MBRqIW4nA/viewform?usp=sf_link
