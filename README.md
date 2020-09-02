# MSFS A320neo Improvement Mod - Stable Version

Preview of APU and DOOR ECAM pages: https://www.youtube.com/watch?v=rLaVK3nNCXc

# Important

### Please note, this version does not include the full capability you may see in the progress updates on our discord server.
### To download the BETA features, which may include bugs, please visit https://github.com/wpine215/msfs-a320neo/tree/dev-0.1.1

### Please follow ALL steps in this README if you encounter any issues with installation before seeking support.

## About
The A32NX Project is a community driven open source project to create a free Airbus A320neo in Microsoft Flight Simulator that is as close to reality as possible. It  aims to enhance the default A320neo by improving the systems depth and functionality to bring it up to payware-level, all for free.

Central Repository: https://github.com/wpine215/msfs-a320neo

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
* Please make sure you're copying the "A32NX" folder into your community package folder, NOT the "msfs-a320neo-master" folder.

## Developing

The A32NX package only contains files which have been modified from the original package. If you wish to work on a file that isn't present in the development branch, simply copy it over from the latest Asobo branch. Please DO NOT add, modify, or delete files from the Asobo branch.

Join our Discord server to find out about the latest updates and discuss ongoing development.

[![Discord](https://img.shields.io/discord/738864299392630914.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/UjzuHMU)

### Committing changes

After making any changes to files inside the `A32NX` directory, ensure you run the `build.py` script to regenerate the `layout.json` as necessary. There's also a CI check to ensure this has been done.

## Changelog

### 0.1.1

- Removed INOP property from all ECAM page buttons
- Added APU ECAM page
- Added Door ECAM page
- Added Bleed ECAM page placeholder
- Fixed fuel consumption
- Fixed APU startup time
- Added MODE change indication to Navigation Display

## Known Issues (Please note that most issues are being worked on and some of them may even be fixed in the dev branch)
- APU ECAM page doesn't display correct load percent.
- Bleed ECAM page isn't modeled.
- No automatic ECAM page switching for DOOR page
- No chime coming from No smoking & Seatbelts.
- No smoking sign doesn't use full range of motion.
- T.O Config is not fully functional yet.
 

## FAQ

**Q: Can I download the aircraft in the current state?**

A: Yes, the master branch contains the latest stable release. You can always download it off the dev branch, but keep in mind it is a WIP and will be unstable.

**Q: Where is the plane in-sim?**

A: The mod is added on top on the default A320neo from Asobo. If you want to uninstall it and revert to the original aircraft, just delete the A32NX folder in your community folder.

**Q: What are the liveries available?**

A: All the default A320neo liveries are working on our aircraft!

**Q: When will it be released?**

A: The project is an ongoing rolling release. You can download the latest (stable) version from the master branch of this repository!

**Q: When is the next update?**

A: We don't know, since it depends on many factors. We'll however announce it each time there's an update! We are currently working on a visual roadmap to let you know what latest features we are working on!

**Q: How do I join the team?**

A: Join our Discord server and either select your role from the bot at #roles , or you DM @Kieran [Z+1].

**Q: Is it payware?**

A: No, it is a completely free aircraft, open-source.

**Q: What is the roadmap/progress?**

A: You can follow our current progress on the trello: https://trello.com/b/z3jimJLq/study-level-a320neo

**Q: How do we report bugs?**

A: If the bug is related to features introduced by our mod, please open a GitHub issue with a thorough description of it, and screenshots if necessary. Otherwise, you have two options: Report it on the discord server at #bugs-and-suggestions, or fill this form (that will be directly linked to the dev attention) :https://docs.google.com/forms/d/e/1FAIpQLSe6Bdx8x8mFmOmBoAipYoazfeomrJ8cri55NBn32MBRqIW4nA/viewform?usp=sf_link

**Q: What is the name of this team?**

A: Still no name! If you have a good idea, please feel free to suggest it on discord's #bugs-and-suggestions channel!
