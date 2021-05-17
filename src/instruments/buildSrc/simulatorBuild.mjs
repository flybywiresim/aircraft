'use strict';

import os from 'os';
import fs from 'fs';
import { baseCompile } from './plugins.mjs';
import { getTemplatePlugin } from "./templatePlugins.mjs";
import { Directories } from "./directories.mjs";

process.chdir(Directories.src);

const TMPDIR = `${os.tmpdir()}/a32nx-instruments-gen`;

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
];

function getInputs() {
    const baseInstruments = fs.readdirSync(Directories.instruments, { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(`${Directories.instruments}/src/${d.name}/config.json`));

    return [
        ...baseInstruments.map(({ name }) => ({ path: name, name, isInstrument: true })),
        ...ecamPages.map((def) => ({ ...def, isInstrument: false })),
    ];
}

module.exports = getInputs()
    .map(({ path, name, isInstrument }) => {
        const config = JSON.parse(fs.readFileSync(`${Directories.instruments}/src/${path}/config.json`));

        return {
            watch: true,
            input: `${Directories.instruments}/src/${path}/${config.index}`,
            output: {
                file: `${TMPDIR}/${name}-gen.js`,
                format: 'iife',
            },
            plugins: [
                ...baseCompile(path, name),
                getTemplatePlugin({name, path, imports: ['/JS/dataStorage.js'], config, isInstrument}),
            ],
        };
    });
