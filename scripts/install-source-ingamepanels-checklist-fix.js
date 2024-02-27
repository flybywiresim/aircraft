require('dotenv').config();
const fs = require('fs-extra');

const source = process.env.BUILD_DIR_NAME
  ? `external/ingamepanels-checklist-fix-master/${process.env.BUILD_DIR_NAME}`
  : 'external/ingamepanels-checklist-fix-master';
console.log(`installManifest source is: ${source}`);

const installManifest = fs.readJSONSync(
  './fbw-ingamepanels-checklist-fix/out/flybywire-ingamepanels-checklist-fix/install.json',
);
installManifest.source = source;
fs.writeJSONSync(
  './fbw-ingamepanels-checklist-fix/out/flybywire-ingamepanels-checklist-fix/install.json',
  installManifest,
);
