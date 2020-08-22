# MSFS A320neo Improvement Mod

## Installation

Simply copy the "A32NX" folder into your community package folder, located in `AppData\Roaming\Microsoft Flight Simulator\Packages\Community`, and start up the A320neo! If you wish to revert to the default Asobo version (no modifications), simply delete the "A32NX" folder and you're done.

## Developing

The A32NX package only contains files which have been modified from the original package. If you want to work on a file that isn't present in the development branch, simply copy it over from the latest Asobo branch. Please DO NOT add, modify, or delete files from the Asobo branch.

**ALWAYS REMEMBER TO RUN BUILD.PY BEFORE COMMITTING NEW FILES**

# Changelog

### 0.1.1

- Removed INOP property from all ECAM page buttons
- Added APU ECAM page
- Added Door ECAM page
- Added Bleed ECAM page placeholder
- Fixed fuel consumption
- Fixed APU startup time
- Added MODE change indication to Navigation Display

# Known Issues
- APU ECAM page doesn't display correct load percent
- Bleed ECAM page isn't modeled
- No automatic ECAM page switching for APU and DOOR pages
