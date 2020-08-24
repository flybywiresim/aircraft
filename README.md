# MSFS A320neo Improvement Mod

Preview of APU and DOOR ECAM pages: https://www.youtube.com/watch?v=rLaVK3nNCXc

## About
The FS2020 A32X Project is a community driven open source project to create a free Airbus A320 in the latest Microsoft Flight Simulator that is as close to reality as possible. It is an open source project and aims to enhance FS2020's default A320 by improving the systems depth and functionality to bring it up to payware-level, and releasing it to the community for free, even perhaps making variants of the family (e.g. a319, a321).

Central Repository: https://github.com/wpine215/msfs-a320neo

## Installation
Installation is really simple. You only have to download the "A32NX" folder.

For the Microsoft Store edition AND/OR Gamepass edition:
* Copy the "A32NX" folder into your community package folder. It is located in:
`C:\Users\[YOUR USERNAME]\AppData\Local\Packages\Microsoft.FlightSimulator_RANDOMLETTERS\LocalCache\Packages\Community`.

For the Steam edition:
* Copy the "A32NX" folder into your community package folder. It is located in:
`C:\Users\[YOUR USERNAME]\AppData\Roaming\Microsoft Flight Simulator\Packages\Community`.

If the aforementioned methods do not work:
* You can find your community folder by going into FS2020 general options and enabling developer mode. You will see a menu appear on top. Go to tools and virtual file system. Click on watch bases and your community folder will be listed in one of the folders. 

## Developing

The A32NX package only contains files which have been modified from the original package. If you want to work on a file that isn't present in the development branch, simply copy it over from the latest Asobo branch. Please DO NOT add, modify, or delete files from the Asobo branch.

Join our Discord server to find out about the latest updates and discuss the development of the project.    [![Discord](https://img.shields.io/discord/738864299392630914.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/UjzuHMU)


**ALWAYS REMEMBER TO RUN BUILD.PY BEFORE COMMITTING NEW FILES**

## Changelog

### 0.1.1

- Removed INOP property from all ECAM page buttons
- Added APU ECAM page
- Added Door ECAM page
- Added Bleed ECAM page placeholder
- Fixed fuel consumption
- Fixed APU startup time
- Added MODE change indication to Navigation Display

## Known Issues
- APU ECAM page doesn't display correct load percent
- Bleed ECAM page isn't modeled
- No automatic ECAM page switching for APU and DOOR pages
