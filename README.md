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

Join our Discord server to find out about the latest updates and discuss the development of the project.

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
- APU ECAM page doesn't display correct load percent.
- Bleed ECAM page isn't modeled.
- No automatic ECAM page switching for APU and DOOR pages.
- No chime coming from No smoking & Seatbelts.
- MCP Panel Font offset (VS indicator).
- No smoking sign doesn't use full range of motion.
- T.O Config is not fully functional yet.
 

##FAQ
Q: Can I download the aircraft in the current state?
A: Yes, the master branch contains the latest stable release. You can always download it off the dev branch, but keep in mind it is a WIP and will be unstable.

Q: When will it be released?
A: We don't know, but you can download the aircraft with the latest improvements we've made! 

Q: When is the next update?
A: We don't know, since it depends on many factors. We'll however announce it each time there's an update! We are currently working on a visual roadmap to let you know what latest features we are working on!

Q: How do I join the team?
A: Join our Discord server and either select your role from the bot at #roles , or you DM @Kieran [Z+1].

Q: Is it payware?
A: No, it is a completely free aircraft, open-source.

Q: What is the roadmap/progress?
R: You can follow our current progress on the trello: https://trello.com/b/z3jimJLq/study-level-a320neo

Q: How do we report bugs?
R: You have two options: Report it on the discord server at #bugs-and-suggestions, or fill this form (that will be directly linked to the dev attention) :https://docs.google.com/forms/d/e/1FAIpQLSe6Bdx8x8mFmOmBoAipYoazfeomrJ8cri55NBn32MBRqIW4nA/viewform?usp=sf_link

Q: What is the name of this team?
R: Still no name! If you have a good idea, please feel free to suggest it on discord's #bugs-and-suggestions channel!
