# Development Resources

## Tools:
- [WebUI-DevKit](https://github.com/dga711/msfs-webui-devkit) - In-game development overlay for html-ui content. Provides fast reload, console output, and more!
- [devtools-backend-refurb](https://github.com/dga711/devtools-backend-refurb) - Chrome devtools server targeting Coherent GT. Gives you devtools for html-ui content. WARNING: This is still a work in progress, and tends to be very finnicky.


## Avionics/Displays:

- [P3D XML Gauge Reference](http://www.prepar3d.com/SDK/SimObject%20Creation%20Kit/Panels%20and%20Gauges%20SDK/creating%20xml%20gauges.html) - still applies to FS2020.


## Tips

### Avoid committing changes to `layout.json` and `manifest.json`

Our CI handles updating these two files automatically. PRs containing manual updates can often lead to unwanted merge conflicts. Similarly, avoid activating Github actions on your fork so CI doesn't make this problem worse for you.

### Symlink project files to your Community directory
You can create a symlink (or "directory junction" in Windows terms) between your local repo and the game's community folder. This lets you develop from your local repository without having to copy files over when you're ready to test. Developers working on hot-reloadable files can get changes reflected in real-time, while still retaining a proper development environment

First, be sure to remove any existing install of the mod from the game.

Then in `cmd`, run the command below. Be sure to replace each path with the proper respective file path.

```cmd
mklink /J "C:\users\<user>\AppData\Microsoft Flight Simulator\Packages\Community\A32NX" "C:\path\to\cloned\repo\A32NX"
```

And you're done! Be sure to run `npm run build` (or the build task in VSCode) when ever new files are added, **but don't commit the result!**
