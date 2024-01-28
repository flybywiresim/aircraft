require('dotenv').config();
const fs = require('fs-extra');

const source = process.env.BUILD_DIR_NAME ? `external/a380x/${process.env.BUILD_DIR_NAME}` : 'external/a380x';
console.log(`installManifest source is: ${source}`);

const installManifest = fs.readJSONSync('./fbw-a380x/out/flybywire-aircraft-a380-842/install.json');
installManifest.source = source;
fs.writeJSONSync('./fbw-a380x/out/flybywire-aircraft-a380-842/install.json', installManifest);
