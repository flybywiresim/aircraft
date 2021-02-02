# <img src="https://raw.githubusercontent.com/flybywiresim/fbw-branding/master/svg/FBW-Logo.svg" placeholder="FlyByWire" width="400"/>


[![Discord](https://img.shields.io/discord/738864299392630914.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/UjzuHMU)

[![GitHub latest release version](https://img.shields.io/github/v/release/flybywiresim/a32nx.svg?style=flat)](https://github.com/flybywiresim/a32nx/releases/latest)
[![Github All Releases download count](https://img.shields.io/github/downloads/flybywiresim/a32nx/total.svg?style=flat)](https://github.com/flybywiresim/a32nx/releases/latest)
[![GitHub contributors](https://img.shields.io/github/contributors/flybywiresim/a32nx.svg?style=flat)](https://github.com/flybywiresim/a32nx/graphs/contributors)

## About

The A32NX Project is a community-driven open source project to create a free Airbus A320neo in Microsoft Flight Simulator that is as close to reality as possible. It aims to enhance the default A320neo by improving the systems depth and functionality to bring it up to payware-level, all for free.

The following aircraft configuration is currently simulated:

 ```
 Model      A320-251N
 Engine     LEAP 1A-26
 FMGS       Honeywell Pegasus II
 FWC Std.   H2F9E
 ```

Please note that this configuration may change in the future as the A32NX project evolves and changes.

### SimBrief Airframe with the correct weights
✈[SimBrief Airframe with the correct weights](https://www.simbrief.com/system/dispatch.php?sharefleet=eyJ0cyI6IjE2MDU4MjAwNzg5NDYiLCJiYXNldHlwZSI6IkEzMjAiLCJjb21tZW50cyI6IkZMWSBCWSBXSVJFIiwiaWNhbyI6IkEyME4iLCJuYW1lIjoiQTMyME5FTyBGQlciLCJlbmdpbmVzIjoiTEVBUC0xQTI2IiwicmVnIjoiQTIwTiIsImZpbiI6IiIsInNlbGNhbCI6IiIsImhleGNvZGUiOiIiLCJjYXQiOiJNIiwicGVyIjoiQyIsImVxdWlwIjoiU0RFM0ZHSElSV1kiLCJ0cmFuc3BvbmRlciI6IkxCMSIsInBibiI6IkExQjFDMUQxTzFTMSIsImV4dHJhcm1rIjoiIiwibWF4cGF4IjoiMTgwIiwid2d0dW5pdHMiOiJLR1MiLCJvZXciOiI0MTAwMCIsIm16ZnciOiI2MjUwMCIsIm10b3ciOiI3OTAwMCIsIm1sdyI6IjY2MDAwIiwibWF4ZnVlbCI6IjIxMjczIiwicGF4d2d0IjoiMTA0IiwiZGVmYXVsdGNpIjoiIiwiZnVlbGZhY3RvciI6IlAwMCIsImNydWlzZW9mZnNldCI6IlAwMDAwIn0-) Credits: [@viniciusfont](https://github.com/viniciusfont)

## Downloads

### A32NX Installer

Download the new A32NX installer where you can select either the Stable or Developer build, and download and install the mod directly into your community folder, [download here](https://api.flybywiresim.com/installer) ([source](https://github.com/flybywiresim/installer/)).

### Traditional Download Methods

#### Latest Stable Release

This is the recommended stable release, as it has been thoroughly tested.

[Download the stable release here.](https://github.com/flybywiresim/a32nx/releases/latest/download/flybywiresim-a32nx.zip)

You can see the changelog on the releases page: [View Here.](https://github.com/flybywiresim/a32nx/releases)

#### Unstable Master Branch Build

This has the latest features, but is much more unstable, use at your own risk.

[Download developer build here.](https://github.com/flybywiresim/a32nx/releases/download/vmaster/A32NX-master.zip)

[View info about the latest build here.](https://github.com/flybywiresim/a32nx/releases/tag/vmaster)

#### Unstable Master Branch Build (with custom FBW)

This version is the same as the regular master/development version, but with the WIP custom fly-by-wire system. Expect issues with flight directors/autopilot if you intend to use this version. No support will be provided via Discord.

[Download custom FBW development build here.](https://flybywiresim-packages.nyc3.cdn.digitaloceanspaces.com/vmaster-cfbw/A32NX-master-cfbw.zip)

[**IMPORTANT:** view warnings and info for the custom FBW build here.](https://github.com/flybywiresim/a32nx/tree/fbw/docs)

## Installation

### Please follow ALL steps in this README if you encounter any issues with installation before seeking support.

Open the zip that you downloaded from one of the links above, and drag the A32NX folder inside the zip into your Community folder.

See below for the location of your Community folder:

For the Microsoft Store edition AND/OR Gamepass edition:
- Copy the "A32NX" folder into your community package folder. It is located in:
`C:\Users\[YOUR USERNAME]\AppData\Local\Packages\Microsoft.FlightSimulator_<RANDOMLETTERS>\LocalCache\Packages\Community`.

For the Steam edition:
- Copy the "A32NX" folder into your community package folder. It is located in:
`C:\Users\[YOUR USERNAME]\AppData\Roaming\Microsoft Flight Simulator\Packages\Community`.

For the Boxed edition:
- Copy the "A32NX" folder into your community package folder. It is located in:
`C:\Users\[YOUR USERNAME]\AppData\Local\MSFSPackages\Community`.

If the above methods do not work:
- You can find your community folder by going into FS2020 general options and enabling developer mode. You will see a menu appear on top. Go to tools and virtual file system. Click on watch bases and your community folder will be listed in one of the folders.
- Please make sure you're copying the "A32NX" folder into your community package folder, NOT the "flybywiresim-a32nx" folder.

## Contributing

See [Contributing.md](.github/Contributing.md)

## Known Issues (Please note that most issues are being worked on and some of them may even be fixed in the master branch)

- Captain's PFD may occasionally turn off during flight
- No Smoking switch doesn't use a full range of motion.
- F/CTL page does not have working speedbrake integration
- BLEED page is not fully functional
- Automatic ECAM page switching has minor bugs
- APU/Engine fire covers cannot be retracted once opened

## License

The contents of this repository are DUAL LICENSED.

Textual-form source code in this repository is licensed under the GNU General Public License version 3. Artistic assets (including but not limited to images, sound banks, 3D models, and textures) are licensed under [Creative Commons CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

Any other works found to be not explicitly covered by the above definitions are all rights reserved to avoid ambiguities at the moment, but we are very permissive about their use if you contact us.

## FAQ

**Q: Can I download the aircraft in the current state?**

A: Yes, see [Downloads](#Downloads).

**Q: Where is the plane in-sim?**

A: The mod is added on top of the default A320neo from Asobo. If you want to uninstall it and revert to the original aircraft, just delete the A32NX folder in your community folder.

**Q: What are the liveries available?**

A: All liveries for the default A320 are compatible with the A32NX Mod. You can download some of your favourite liveries at [Flightsim.to](https://flightsim.to).

**Q: When will it be released?**

A: The project is an ongoing rolling release. See [Downloads](#Downloads).

**Q: When is the next update?**

A: We don't know, since it depends on many factors. We will announce each Stable build update via [discord](https://discord.gg/flybywire) and our social media: [Facebook](https://www.facebook.com/FlyByWireSimulations), [Twitter](https://twitter.com/FlybywireSim).

**Q: How do I join the team?**

A: Head over to [Contributing.md](.github/Contributing.md) and join our Discord to get started.

**Q: Is it payware?**

A: No, it is a completely free aircraft, open-source.

**Q: How do we report bugs?**

A: Report bugs to us in the [Discord server](https://discord.gg/flybywire), under the #help channel, or by creating a GitHub issue. Just make sure to search for existing issues first before creating a new one.

**Q: Why is my version not the same as what I see others using?**

A: We have two versions, the Stable and Developer (Master). The Stable version is a 'snapshot' of the development which we regard as stable with the current version of the simulator. The Developer build is updated daily and is a constant work in progress and although we test thoroughly each update, minor issues may occur from time to time. If you find this to be the case, you can report these issues in #help in discord or via GitHub Issues (Check there is not an existing issue of the same nature as yours).
