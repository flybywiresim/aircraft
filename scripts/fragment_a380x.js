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
          name: 'html_ui-Fonts',
          sourceDir: './html_ui/Fonts',
        },
        {
          name: 'html_ui-Images',
          sourceDir: './html_ui/Images',
        },
        {
          name: 'html_ui-Pages',
          sourceDir: './html_ui/Pages',
        },
        {
          name: 'Part_Exterior_Fuselage',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Exterior_Fuselage',
        },
        {
          name: 'Part_Exterior_Gear_Body_LH',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Exterior_Gear_Body_LH',
        },
        {
          name: 'Part_Exterior_Gear_Body_RH',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Exterior_Gear_Body_RH',
        },
        {
          name: 'Part_Exterior_Gear_Nose',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Exterior_Gear_Nose',
        },
        {
          name: 'Part_Exterior_Gear_Wing_LH',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Exterior_Gear_Wing_LH',
        },
        {
          name: 'Part_Exterior_Gear_Wing_RH',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Exterior_Gear_Wing_RH',
        },
        {
          name: 'Part_Exterior_Wings',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Exterior_Wings',
        },
        {
          name: 'Part_Interior_A380',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Interior_A380',
        },
        {
          name: 'Part_Interior_Cabin',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Interior_Cabin',
        },
        {
          name: 'Part_Interior_Cabin_Seats',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Interior_Cabin_Seats',
        },
        {
          name: 'Part_Interior_Cockpit-Model',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Interior_Cockpit/model',
        },
        {
          name: 'Part_Interior_Cockpit-Texture',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Interior_Cockpit/texture',
        },
        {
          name: 'Panels',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Interior_Cockpit/panel',
        },
        {
          name: 'Effects',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/common/effects',
        },
        {
          name: 'Sound',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/common/sound',
        },
        {
          name: 'Textures',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/common/texture',
        },
        {
          name: 'Liveries',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/liveries',
        },
        {
          name: 'Presets',
          sourceDir: './SimObjects/AirPlanes/FlyByWire_A380X/presets',
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
