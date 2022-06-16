# flyPadOS 3 EFB Localization HowTo

TOC:

- [Development Process](#development-process)
- [Build Process](#build-process)
- [Updating the Source File](#update-source-file)

## Development Process

- To add something to the EFB simply add the key and English phrase to the en.json file.
    - `src/instruments/src/EFB/Localization/en.json`
- Ping in the Discord channel `#efb` to have someone with write permission to Localazy to add the key (several ways to
  do that - but the permission required is powerful). Adding it is a 2min thing.
- Do this in good time before it is merged to master
- Translators can now start to translate this (worst case is the term is not translated and shown in English)
- Same for removing or changing keys - do the change locally in the English source file and ping in #efb

**Remark:**

The update could be automated via GitHub actions (as the download is - it's basically one command) but this would
require the write key to be part of env and is very risky. If a dev removes required keys or even removes everything
from the en.json then this change will immediately be sent to Localazy by everybody who can trigger the GitHub
action.<br/>                   
Of course, we can include measures to only do this for merges to master etc. but at some point the upload will have to
happen and then potentially overwrite stuff at Localazy which might impact others.

As Localazy does not do versioning and also does not allow to undo these uploads this process is risky. Any issues will
need to be fixed by uploading a previous version of the source file (or a specific language file) which is why I like
them to be versioned and persisted in GitHub. We can at any time even role back changes to translation this way.

## Build Process

### Github

Downloading of the latest approved translations happens at every build on GitHub. It is part of the build pipeline but
only runs in the GitHub Action context to not update local files for Developers.

**build.sh**

```
✓ a32nx
  ✓ preparation
    ✓ efb-translation
  ✓ build
    ✓ instruments
    ...
```

### Local

To update the language files locallyhe languaes you need to run:

`npm run build:efb-translation local`

This downloads the latest translations directly from Localazy to the 'downloaded'
folder (`src/instruments/src/EFB/Localization/downloaded`).

It checks the JSON syntax and writes new JSON files for each language to the `src/instruments/src/EFB/Localization`
folder from there they can be imported in the `src/instruments/src/EFB/translation.ts`.

## Update Source File

**This can only be done by Owners/Managers of the Localazy project - ask in the Discord #efb channel for support**

Although an automatic update could be done we have chosen to manually make changes to the keys (new keys, removal of
keys).

This can either be done by the UI of Localazy - adding and removing single keys - or by changing the en.json file and
then upload this to Localazy.

### Using Localazy Website

- Go to File Management and click on `flybywireos3.json`
    - https://localazy.com/p/flypados/files
- Add, change and remove keys manually in the UI

### Using en.json and Localazy Website

- Make the necessary changes to the en.json (adding keys, removing key, changing default English strings)
- Go to File Management and click on `flybywireos3.json`
    - https://localazy.com/p/flypados/files
- Click the three-dots menu on the right of the `flybywireos3.json` file and select "Update file content"
- Drag and Drop the en.json to the dialog which came up
- It should recognize it as English
- Click "Next Step"
- Check "Mark strings excluded from this batch as deprecated" to remove keys
- Uncheck all the other checkboxes
- Review the changes in the source file - removed keys should shows a red and deprecated, new keys should be available
- These changes now apply to all languages
    - removed keys are deprecated and not visible to translators any more and should also not be included in any
      downloads
    - new keys are ready to be translated in all other languages

### Using the en.json

!!! RISK - PROCEED WITH CARE !!!

- Make a copy of the en.json named `flybywireos3.json`
- Use the command: `localazy upload -s -k keys.json`
    - You need to have the Localazy read and write keys in the `keys.json` file.
- The option `-s` is a test mode not changing anything. Remove this option to actually upload the file.
- The configuration from the file `localazy.json` upload section will be used.
