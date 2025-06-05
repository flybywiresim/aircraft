const fragmenter = require('@flybywiresim/fragmenter');
const fs = require('fs');

const execute = async () => {
  try {
    const result = await fragmenter.pack({
      version: require('./fragmenter_version').version,
      packOptions: { splitFileSize: 102_760_448, keepCompleteModulesAfterSplit: false },
      baseDir: './fbw-a32nx/out/flybywire-aircraft-a320-neo',
      outDir: './fbw-a32nx/out/build-modules',
      modules: [
        {
          name: 'effects',
          sourceDir: './effects',
        },
        {
          name: 'html_ui',
          sourceDir: './html_ui',
        },
        {
          name: 'CUSTOMIZE',
          sourceDir: './CUSTOMIZE',
        },
        {
          name: 'ModelBehaviorDefs',
          sourceDir: './ModelBehaviorDefs',
        },
        {
          name: 'Textures',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A320_NEO/TEXTURE',
        },
        {
          name: 'Livery',
          sourceDir: './SimObjects/AirPlanes/_FlyByWire_A320_NEO-LIVERY',
        },
        {
          name: 'Sound',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A320_NEO/sound',
        },
        {
          name: 'Model',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A320_NEO/model',
        },
        {
          name: 'Panels',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A320_NEO/panel',
        },
      ],
    });
    console.log(result);
    console.log(fs.readFileSync('./fbw-a32nx/out/build-modules/modules.json').toString());
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

execute();
