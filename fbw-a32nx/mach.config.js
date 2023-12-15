const imagePlugin = require('esbuild-plugin-inline-image');
const postCssPlugin = require('esbuild-style-plugin');
const tailwind = require('tailwindcss');
const postCssColorFunctionalNotation = require('postcss-color-functional-notation');
const postCssInset = require('postcss-inset');
const { typecheckingPlugin, generateInstrumentsMetadata, getMachInstrumentBuilders } = require("#build-utils");
const path = require("path");

const {
    msfsAvionicsInstrument,
    reactInstrument,
} = getMachInstrumentBuilders({
    templateIDPrefix: 'A32NX',
    reactImports: ['/JS/dataStorage.js','/JS/fbw-a32nx/A32NX_Simvars.js'],
});

// process.env.FBW_TYPECHECK = "1";

/** @type { import('@synaptic-simulations/mach').MachConfig } */
module.exports = {
    packageName: 'A32NX',
    packageDir: 'out/flybywire-aircraft-a320-neo',
    plugins: [
        imagePlugin({ limit: -1 }),
        postCssPlugin({
            extract: true,
            postcss: {
                plugins: [
                    tailwind('src/systems/instruments/src/EFB/tailwind.config.js'),

                    // transform: hsl(x y z / alpha) -> hsl(x, y, z, alpha)
                    postCssColorFunctionalNotation(),

                    // transform: inset: 0; -> top/right/left/bottom: 0;
                    postCssInset(),
                ],
            }
        }),
        typecheckingPlugin(),
    ],
    instruments: [
        msfsAvionicsInstrument('PFD', [768, 768], true),
        msfsAvionicsInstrument('ND', [768, 768], true),
        msfsAvionicsInstrument('EWD', [768, 768], true),
        msfsAvionicsInstrument('Clock', [256, 256], false),

        reactInstrument('SD', [], [768, 768], true),
        reactInstrument('DCDU', [], [4096, 3072], false),
        reactInstrument('RTPI', [], [338, 128], false),
        reactInstrument('RMP', [], [432, 512], false),
        reactInstrument('ISIS', [], [512, 512], false),
        reactInstrument('BAT', [], [256, 128], false),
        reactInstrument('ATC', [], [316, 128], false),
        reactInstrument('EFB', ['/Pages/VCockpit/Instruments/Shared/Map/MapInstrument.html'], [1430, 1000], true),
    ],
};

generateInstrumentsMetadata(module.exports.instruments, 'A32NX', path.join(__dirname, 'out/flybywire-aircraft-a320-neo/'));
