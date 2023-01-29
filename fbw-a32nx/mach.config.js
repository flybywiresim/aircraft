// const { sassPlugin } = require('esbuild-sass-plugin');
const imagePlugin = require('esbuild-plugin-inline-image');
const postCssPlugin = require('esbuild-style-plugin');
const tailwind = require('tailwindcss');
const postcssColorHsl = require('postcss-color-hsl');

require('dotenv').config();

/** @type { import('@synaptic-simulations/mach').MachConfig } */
module.exports = {
    packageName: 'A32NX',
    packageDir: 'out/flybywire-aircraft-a320-neo',
    plugins: [
        // sassPlugin(),
        imagePlugin({ limit: -1 }),
        postCssPlugin({
            extract: true,
            postcss: {
                plugins: [
                    tailwind('src/systems/instruments/src/EFB/tailwind.config.js'),
                    postcssColorHsl(),
                ],
            }
        }),
    ],
    instruments: [
        msfsAvionicsInstrument('PFD'),

        reactInstrument('ND', ['/JS/A32NX_Util.js']),
        reactInstrument('EWD'),
        reactInstrument('SD'),
        reactInstrument('DCDU'),
        reactInstrument('RTPI'),
        reactInstrument('RMP'),
        reactInstrument('ISIS'),
        reactInstrument('BAT'),
        reactInstrument('ATC'),
        reactInstrument('Clock'),
        reactInstrument('EFB'),
    ],
};

function msfsAvionicsInstrument(name) {
    return {
        name,
        index: `src/systems/instruments/src/${name}/instrument.tsx`,
        simulatorPackage: {
            type: 'baseInstrument',
            templateId: `A32NX_${name}`,
            mountElementId: `${name}_CONTENT`,
            fileName: name.toLowerCase(),
            imports: ['/JS/dataStorage.js'],
        },
    };
}

function reactInstrument(name, additionalImports) {
    return {
        name,
        index: `src/systems/instruments/src/${name}/index.tsx`,
        simulatorPackage: {
            type: 'react',
            isInteractive: false,
            fileName: name.toLowerCase(),
            imports: ['/JS/dataStorage.js', ...(additionalImports ?? [])],
        },
    };
}
