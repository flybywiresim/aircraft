const imagePlugin = require('esbuild-plugin-inline-image');
const postCssPlugin = require('esbuild-style-plugin');
// const tailwind = require('tailwindcss');
const postCssColorFunctionalNotation = require('postcss-color-functional-notation');
const postCssInset = require('postcss-inset');
const { typecheckingPlugin, generateInstrumentsMetadata } = require("#build-utils");
const path = require("path");

/** @type { import('@synaptic-simulations/mach').MachConfig } */
module.exports = {
    packageName: 'A380X',
    packageDir: 'out/flybywire-aircraft-a380-842',
    plugins: [
        imagePlugin({ limit: -1 }),
        postCssPlugin({
            extract: true,
            postcss: {
                plugins: [
                    // tailwind('src/systems/instruments/src/EFB/tailwind.config.js'),

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
        msfsAvionicsInstrument('PFD', [768, 1024]),
        msfsAvionicsInstrument('ND', [768, 1024]),

        reactInstrument('EWD', [], [768, 1024]),
        reactInstrument('MFD', [], [768, 1024]),
        reactInstrument('OIT', [], [1024, 768]),
        reactInstrument('RMP', [], [600, 400]),
        reactInstrument('SD', [], [768, 1024]),
    ],
};

generateInstrumentsMetadata(module.exports.instruments, 'A380X', path.join(__dirname, 'out/flybywire-aircraft-a380-842/'));

function msfsAvionicsInstrument(name, dimensions) {
    return {
        name,
        index: `src/systems/instruments/src/${name}/instrument.tsx`,
        simulatorPackage: {
            type: 'baseInstrument',
            templateId: `A380X_${name}`,
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
            imports: ['/JS/dataStorage.js','/JS/fbw-a380x/A380X_Simvars.js', ...(additionalImports ?? [])],
        },
        dimensions: {
            width: dimensions[0],
            height: dimensions[1],
        },
    };
}

