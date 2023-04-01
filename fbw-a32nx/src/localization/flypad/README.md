# flyPad Localization

Only change the `en.json` file. 

The other files are generated automatically from Localazy and any changes will be overwritten.
                                
## Uploading new keys and changed default texts

Add new keys to the `en.json` file. 
Make changes to default texts in the `en.json` file.

Use one of the following commands to upload the file to Localazy:

localazy upload -w <writeKey> -c localazy-flypad-upload-config.json -d flypad
localazy upload -w <writeKey> -c localazy-flypad-upload-deprecate-config.json -d flypad

Use the option `-s` for a test run. Remove this option to actually upload the file.


