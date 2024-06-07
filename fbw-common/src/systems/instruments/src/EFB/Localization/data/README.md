# flyPad Localization

Only change the `en.json` file. 

The other files are generated automatically from Localazy and any changes will be overwritten.
                                
## Uploading new keys and changed default texts

Add new keys to the `en.json` file. 
Make changes to default texts in the `en.json` file.

Change to the localization folder:

`cd fbw-a32nx/src/localization`

Use one of the following commands to upload the file to Localazy (Localazy CLI npm package is required):

`localazy upload -w <writeKey> -c localazy-flypad-upload-config.json -d flypad`

CAUTION: Use this command if you want to deprecate keys which are not present in the source file.

`localazy upload -w <writeKey> -c localazy-flypad-upload-deprecate-config.json -d flypad`

Use the option `-s` for a test run. Remove this option to actually upload the file.


