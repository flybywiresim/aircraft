require('dotenv').config();
const fs = require('fs-extra');

const source = process.env.BUILD_DIR_NAME ? `external/a32nx/${process.env.BUILD_DIR_NAME}` : 'external/a32nx';
console.log(`installManifest source is: ${source}`);

const installManifest = fs.readJSONSync('./fbw-a32nx/out/flybywire-aircraft-a320-neo/install.json');
installManifest.source = source;
fs.writeJSONSync('./fbw-a32nx/out/flybywire-aircraft-a320-neo/install.json', installManifest);
