const fragmenter = require('@flybywiresim/fragmenter');
const fs = require('fs');

const execute = async () => {
  try {
    const result = await fragmenter.pack({
      version: require('./fragmenter_version').version,
      packOptions: { splitFileSize: 102_760_448, keepCompleteModulesAfterSplit: false },
      baseDir: './fbw-ingamepanels-checklist-fix/out/flybywire-ingamepanels-checklist-fix',
      outDir: './fbw-ingamepanels-checklist-fix/out/build-modules',
      modules: [
        {
          name: 'html_ui',
          sourceDir: './html_ui',
        },
      ],
    });
    console.log(result);
    console.log(fs.readFileSync('./fbw-ingamepanels-checklist-fix/out/build-modules/modules.json').toString());
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

execute();
