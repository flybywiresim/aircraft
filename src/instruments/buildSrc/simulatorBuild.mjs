import fs from 'fs';
import { baseCompile } from './plugins.mjs';
import { getTemplatePlugin } from './templatePlugins.mjs';
import { Directories } from './directories.mjs';

process.chdir(Directories.src);

const ecamPages = [
    {
        name: 'door-page',
        path: 'SD/Pages/Door',
    },
    {
        name: 'cond-page',
        path: 'SD/Pages/Cond',
    },
    {
        name: 'fctl-page',
        path: 'SD/Pages/Fctl',
    },
    {
        name: 'elec-page',
        path: 'SD/Pages/Elec',
    },
    {
        name: 'hyd-page',
        path: 'SD/Pages/Hyd',
    },
    {
        name: 'wheel-page',
        path: 'SD/Pages/Wheel',
    },
];

function getInputs() {
    const baseInstruments = fs.readdirSync(`${Directories.instruments}/src`, { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(`${Directories.instruments}/src/${d.name}/config.json`));

    return [
        ...baseInstruments.map(({ name }) => ({ path: name, name, isInstrument: true })),
        ...ecamPages.map((def) => ({ ...def, isInstrument: false })),
    ];
}

export default getInputs()
    .map(({ path, name, isInstrument }) => {
        const config = JSON.parse(fs.readFileSync(`${Directories.instruments}/src/${path}/config.json`));

        return {
            watch: true,
            name,
            input: `${Directories.instruments}/src/${path}/${config.index}`,
            output: {
                file: `${Directories.temp}/bundle.js`,
                format: 'iife',
            },
            plugins: [
                ...baseCompile(name, path),
                getTemplatePlugin({
                    name,
                    path,
                    imports: [
                        '/JS/dataStorage.js',
                        '/Pages/VCockpit/Instruments/FlightElements/Waypoint.js'
                    ],
                    config,
                    isInstrument
                }),
            ],
        };
    });
