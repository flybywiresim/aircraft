const imagePlugin = require('esbuild-plugin-inline-image');
const postCssPlugin = require('esbuild-style-plugin');
const tailwind = require('tailwindcss');
const postCssColorFunctionalNotation = require('postcss-color-functional-notation');
const postCssInset = require('postcss-inset');

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
    ],
    instruments: [
        msfsAvionicsInstrument('PFD'),
        msfsAvionicsInstrument('ND', 'NDv2'),
        msfsAvionicsInstrument('EWD'),
        msfsAvionicsInstrument('Clock'),

        reactInstrument('SD'),
        reactInstrument('DCDU'),
        reactInstrument('RTPI'),
        reactInstrument('RMP'),
        reactInstrument('ISIS'),
        reactInstrument('BAT'),
        reactInstrument('ATC'),
        reactInstrument('EFB', ['/Pages/VCockpit/Instruments/Shared/Map/MapInstrument.html']),
    ],
};

function msfsAvionicsInstrument(name, folder = name) {
    return {
        name,
        index: `src/systems/instruments/src/${folder}/instrument.tsx`,
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
            imports: ['/JS/dataStorage.js','/JS/fbw-a32nx/A32NX_Simvars.js', ...(additionalImports ?? [])],
        },
    };
}
