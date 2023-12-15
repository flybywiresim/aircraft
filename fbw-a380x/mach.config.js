const imagePlugin = require('esbuild-plugin-inline-image');
const postCssPlugin = require('esbuild-style-plugin');
// const tailwind = require('tailwindcss');
const postCssColorFunctionalNotation = require('postcss-color-functional-notation');
const postCssInset = require('postcss-inset');
const { typecheckingPlugin, generateInstrumentsMetadata, getMachInstrumentBuilders} = require("#build-utils");
const path = require("path");

const {
    msfsAvionicsInstrument,
    reactInstrument,
} = getMachInstrumentBuilders({
    templateIDPrefix: 'A380X',
    reactImports: ['/JS/dataStorage.js','/JS/fbw-a380x/A380X_Simvars.js'],
});

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
        msfsAvionicsInstrument('PFD', [768, 1024], true),
        msfsAvionicsInstrument('ND', [768, 1024], true),

        reactInstrument('EWD', [], [768, 1024], true),
        reactInstrument('MFD', [], [768, 1024], false),
        reactInstrument('OIT', [], [1024, 768], false),
        reactInstrument('RMP', [], [600, 400], false),
        reactInstrument('SD', [], [768, 1024], true),
    ],
};

generateInstrumentsMetadata(module.exports.instruments, 'A380X', path.join(__dirname, 'out/flybywire-aircraft-a380-842/'));
