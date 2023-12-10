const imagePlugin = require('esbuild-plugin-inline-image');
const postCssPlugin = require('esbuild-style-plugin');
const tailwind = require('tailwindcss');
const postCssColorFunctionalNotation = require('postcss-color-functional-notation');
const postCssInset = require('postcss-inset');
const { typecheckingPlugin, generateInstrumentsMetadata } = require("#build-utils");
const path = require("path");

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
        msfsAvionicsInstrument('PFD', [768, 768]),
        msfsAvionicsInstrument('ND', [768, 768]),
        msfsAvionicsInstrument('EWD', [768, 768]),
        msfsAvionicsInstrument('Clock', [256, 256]),

        reactInstrument('SD', [], [768, 768]),
        reactInstrument('DCDU', [], [4096, 3072]),
        reactInstrument('RTPI', [], [338, 128]),
        reactInstrument('RMP', [], [432, 512]),
        reactInstrument('ISIS', [], [512, 512]),
        reactInstrument('BAT', [], [256, 128]),
        reactInstrument('ATC', [], [316, 128]),
        reactInstrument('EFB', ['/Pages/VCockpit/Instruments/Shared/Map/MapInstrument.html'], [1430, 1000]),
    ],
};

generateInstrumentsMetadata(module.exports.instruments, 'A32NX', path.join(__dirname, 'out/flybywire-aircraft-a320-neo/'));

function msfsAvionicsInstrument(name, dimensions) {
    return {
        name,
        index: `src/systems/instruments/src/${name}/instrument.tsx`,
        simulatorPackage: {
            type: 'baseInstrument',
            templateId: `A32NX_${name}`,
            mountElementId: `INSTRUMENT_CONTENT`,
            fileName: name.toLowerCase(),
            imports: ['/JS/dataStorage.js'],
        },
        dimensions: {
            width: dimensions[0],
            height: dimensions[1],
        },
    };
}

function reactInstrument(name, additionalImports, dimensions) {
    return {
        name,
        index: `src/systems/instruments/src/${name}/index.tsx`,
        simulatorPackage: {
            type: 'react',
            isInteractive: false,
            fileName: name.toLowerCase(),
            imports: ['/JS/dataStorage.js','/JS/fbw-a32nx/A32NX_Simvars.js', ...(additionalImports ?? [])],
        },
        dimensions: {
            width: dimensions[0],
            height: dimensions[1],
        },
    };
}
