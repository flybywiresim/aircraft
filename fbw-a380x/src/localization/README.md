# Localization HowTo

TOC:

- [Development Process](#development-process)
- [Build Process](#build-process)
- [Updating the Source File](#update-source-file)

<span style="color: red">
OBS:
The localization files for the flyPad are now in the fbw-common EFB section. The process is the same as described here. 
The only difference is the path to the localization files. The path is `fbw-a32nx/src/localization/flypad` instead of 
`fbw-a32nx/src/localization/a32nx`.
</span>

## Development Process

- To add something to the localization files simply add the key to the source language files:
    - For MSFS locPak: `fbw-a32nx/src/localization/msfs/en-US.locPak`
- Only change the source language file. The other language files are generated automatically from
  Localazy and any changes will be overwritten.
- Ping in the Discord channel `#localisation` to have someone with write permission to Localazy to
  add the key (several ways to do that - but the permission required is powerful). Adding it is a 2min thing.
- Do this in good time before it is merged to master
- Translators can now start to translate this (worst case is the term is not translated and shown in English)
- Same for removing or changing keys - do the change locally in the English source file and ping in
  `#localisation` for someone with write permission to Localazy to remove the key or change the default text.

**Remark:**

The update could be automated via GitHub actions (as the download is - it's basically one command) but this would
require the write key to be available in the GitHub action. As forks have no access to GitHub secrets automating
this would not work for forks without making the write key public which is of course a no-go.
Alternate solutions are still investigated.

## Build Process

### Github

Downloading of the latest approved translations happens at every build on GitHub. It is part of the build pipeline but
only runs in the GitHub Action context to not update local files for Developers.

**build.sh**

```
  ✓ a32nx
    ✓ preparation
      ✓ copy-base-files
      ✓ localisation
        ✓ locPak-translation
    ...
```

### Local

To update the language files locally, you need to run:

`npm run build-:locPak-translation local`

This downloads the latest translations directly from Localazy to the 'downloaded'
folder of the flyPad or locPak folder.

It checks the JSON syntax and writes new JSON files for each language to their respective target folder:

msfs locPak:
`fbw-a380x/src/localization/msfs` and `out/flybywire-aircraft-a380-842/`

## Update Source File

**This can only be done by Owners/Managers of the Localazy project. Ask in the Discord #localisation channel for support**

Although an automatic update could be done, we have chosen to manually make changes to the keys (new keys, removal of
keys).

ATTENTION:<br/>
ANY CHANGES TO THE SOURCE FILES ON LOCALAZY WILL IMMEDIATELY BE VISIBLE IN EVER NEW BUILD OF
THE A32NX - INDEPENDENT OF EDITION.

### Using Localazy CLI

Install the Localazy CLI via `npm install -g @localazy/cli` and then use the following commands to upload the source.

[Localazy CLI Documentation](https://localazy.com/docs/cli/command-line-options)

Use the option `-s` for a test run. Remove this option to actually upload the file.

The `deprecate` version of the configuration files will deprecate keys which are not present in the source file. Use this
with caution.

flyPad:

`cd fbw-a32nx/src/localization`

`localazy upload -w <writeKey> -c localazy-flypad-upload-config.json -d flypad`

MSFS locPak:

`cd fbw-a32nx/src/localization`

`localazy upload -w <writeKey> -c localazy-locPak-upload-config.json -d msfs`

The writeKey can be found in the Localazy project settings which are accessible by the Owners/Managers of the project.

### Using the English source file and Localazy Website

#### MSFS locPak:

- Make the necessary changes to the en.json (adding keys, removing key, changing default English strings)
- Go to File Management and click on `flybywire-a380x.locPak`
    - https://localazy.com/p/flybywire-a380x-locpak/files
- Click the three-dots menu on the right of the `flybywire-a380x.locPak` file and select "Update file content"
- Drag and Drop the en.json to the dialog which came up
- It should recognize it as English
- Click "Next Step"
- Check "Mark strings excluded from this batch as deprecated" to remove keys
- Uncheck all the other checkboxes
- Review the changes in the source file. Removed keys should show a red and deprecated, new keys should be available
- These changes now apply to all languages
    - removed keys are deprecated and not visible to translators anymore and should also not be included in any
      downloads
    - new keys are ready to be translated in all other languages

### Manually via Localazy Website

- Go to the respective project
- Use the UI to add/remove/change keys
- https://localazy.com/docs/general/importing-localization-files#add-new-keys-in-ui 
