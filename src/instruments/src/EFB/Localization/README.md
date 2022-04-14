# flyPadOS 3 EFB Localization HowTo

## Build

`node .\build-translation.js`

This downloads the latest translations directly from Localazy to the 'downloaded' folder, checks the JSON and writes
JSON files for each language to this folder from there they can be imported.

To be able to read from Localazy the environment variable LOCALAZY_READ_KEY must bet set with the Localazy project read
code key. 
