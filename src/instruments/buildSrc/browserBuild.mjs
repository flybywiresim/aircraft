'use strict';

import fs from 'fs';
import serve from 'rollup-plugin-serve';
import liveReload from 'rollup-plugin-livereload';
import { baseCompile } from './plugins.mjs';
import { Directories } from './directories.mjs';

process.chdir(Directories.src);

function getInputs() {
    const baseInstruments = fs.readdirSync(`${Directories.instruments}/src`, { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(`${Directories.instruments}/src/${d.name}/config.json`));

    return [
        ...baseInstruments.map(({ name }) => ({
            path: name,
            name,
        })),
    ];
}

const builds = getInputs()
    .map(({ path }) => {
        const config = JSON.parse(fs.readFileSync(`${Directories.instruments}/src/${path}/config.json`));

        return {
            watch: true,
            input: `${Directories.instruments}/src/${path}/${config.index}`,
            output: {
                file: `${Directories.instruments}/devServer/bundles/${path}/bundle.js`,
                format: 'iife',
            },
            plugins: [
                ...baseCompile(path, path),
                serve(`${Directories.instruments}/devServer`),
                liveReload(),
            ],
        };
    });

const instruments = getInputs().map(({ path }) => path);

console.log(JSON.stringify(instruments));
fs.writeFileSync(`${Directories.instruments}/devServer/instruments.json`, JSON.stringify(instruments));

export default builds;
