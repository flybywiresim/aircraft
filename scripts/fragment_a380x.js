const fragmenter = require('@flybywiresim/fragmenter');
const fs = require('fs');

const execute = async () => {
  try {
    const result = await fragmenter.pack({
      version: require('./fragmenter_version').version,
      packOptions: { splitFileSize: 102_760_448, keepCompleteModulesAfterSplit: false },
      baseDir: './fbw-a380x/out/flybywire-aircraft-a380-842',
      outDir: './fbw-a380x/out/build-modules',
      modules: [
        {
          name: 'html_ui',
          sourceDir: './html_ui',
        },
        {
          name: 'Model',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380_842/model',
        },
        {
          name: 'Panels',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380_842/panel',
        },
        {
          name: 'Sound',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380_842/sound',
        },
      ],
    });
    console.log(result);
    console.log(fs.readFileSync('./fbw-a380x/out/build-modules/modules.json').toString());
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

execute();
