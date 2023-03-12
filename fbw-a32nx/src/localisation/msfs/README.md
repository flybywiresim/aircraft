# locPak Localization

Only change the `en-US.locPak` file. 

The other files are generated automatically from Localazy and any changes will be overwritten.

## Uploading new keys and changed default texts

Add new keys to the `en.json` file.
Make changes to default texts in the `en.json` file.

Use one of the following commands to upload the file to Localazy:

localazy upload -w <writeKey> -c localazy-locPak-upload-config.json -d msfs
localazy upload -w <writeKey> -c localazy-locPak-upload-deprecate-config.json -d msfs

Use the option `-s` for a test run. Remove this option to actually upload the file.

