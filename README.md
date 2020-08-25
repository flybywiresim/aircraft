# MSFS A320neo Improvement Mod

Preview of APU and DOOR ECAM pages: https://www.youtube.com/watch?v=rLaVK3nNCXc

## About
The FS2020 A32NX Project is a community driven open source project to create a free Airbus A320neo in the latest Microsoft Flight Simulator that is as close to reality as possible. It is an open source project and aims to enhance FS2020's default A320neo by improving the systems depth and functionality to bring it up to payware-level, and releasing it to the community for free, even perhaps making variants of the family (e.g. a319, a321).

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

## Known Issues (Please note that most issues are being worked on and some of them may even be fixed in the dev branch)
- APU ECAM page doesn't display correct load percent. (ECAM)
- Bleed ECAM page isn't modeled. (ECAM)
- No automatic ECAM page switching for APU and DOOR pages. (ECAM)
- No chime coming from No smoking & Seatbelts. (Lights & Sounds)
- No smoking sign doesn't use full range of motion. (Switches)
- T.O Config is not fully functional yet. (ECAM)
- ILS info display button works but doesn't light up. (Switches)
- FBW Bank Angle Protection Error. (Logic)
- PFD Speed Tape Trend Vector Lag. (Logic)
- APU EGT temperature settles on 10C after shutdown regardless of outside ambient air temp. (ECAM/Logic)
- APU start button should work even if flap is not open yet. (APU)
- APU N1 % on ECAM does not decrease from 100 when APU is powered down. (APU)
- Automatic ECAM page switching shouldn't illuminate associated ECAM button. (APU)
- APU Gen info on APU ECAM page displays connected arrow even when aircraft is still connected to external power. (APU)

## Bug reporting

If you encounter a bug during your testing or your usage of the aircraft we encourage you to report them so we are aware of issues that we may have missed during our testing.
In order to repot a bug, you can either head to our discord's #bugs-and-suggestions channel or report them in Github. Please make sure to read through current open issues to avoid duplicate issues. Once your bug has been reported, you can rest assured that we will try everything we can in order to fix it. Keep in mind that some minor bugs may not be as high of a priority than others and we thank you for your patience. 

When reporting an issue, please enter as much information as you can with steps to reproduce and the version of the aircraft you're running (stable or dev branch). This will help us pinpoint the cause of the problem and will help us fix it faster!

A third option is also available to you in order to report an issue with your A320 build. You can fill out the following form: https://docs.google.com/forms/d/e/1FAIpQLSe6Bdx8x8mFmOmBoAipYoazfeomrJ8cri55NBn32MBRqIW4nA/viewform?usp=sf_link

By filling out this form, your issue will be taken care of in the same order of priority as any other form of reporting and will also be linked directly to our developers' attention.

## FAQ

Q: Can I download the aircraft in the current state?

A: Yes, the master branch contains the latest stable release. You can always download it off the dev branch, but keep in mind it is a WIP and will be unstable.

Q: Where is the plane in-sim?

A: The mod is added on top on the default A320N from Asobo. If you want to uninstall it and revert to the original aircraft, just delete the A32NX folder in your community folder.

Q: What are the liveries available?

A: All the default aircraft liveries are working on our aircraft!

Q: When will it be released?

A: We don't know, but you can download the aircraft with the latest improvements we've made! 

Q: When is the next update?

A: We don't know, since it depends on many factors. We'll however announce it each time there's an update! We are currently working on a visual roadmap to let you know what latest features we are working on!

Q: How do I join the team?

A: Join our Discord server and either select your role from the bot at #roles , or you DM @Kieran [Z+1].

Q: Is it payware?

A: No, it is a completely free aircraft, open-source.

Q: What is the roadmap/progress?

A: You can follow our current progress on the trello: https://trello.com/b/z3jimJLq/study-level-a320neo

Q: What is the name of this team?

A: Still no name! If you have a good idea, please feel free to suggest it on discord's #bugs-and-suggestions channel!

Q: What are the current limitations (Like what can we not modify)?

A: We cannot modify the aircraft's 3D model. However, we are working hard to find a workaround and a way to do it without needing them.
