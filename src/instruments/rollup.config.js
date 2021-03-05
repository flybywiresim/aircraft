/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const os = require('os');
const fs = require('fs');
const image = require('@rollup/plugin-image');
const { babel } = require('@rollup/plugin-babel');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const postcss = require('rollup-plugin-postcss');
const tailwindcss = require('tailwindcss');

const instrumentTemplate = require('@flybywiresim/rollup-plugin-msfs');
const ecamPageTemplate = require('./ecam-page-template/rollup.js');

const TMPDIR = `${os.tmpdir()}/a32nx-instruments-gen`;

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

const extraInstruments = [
    {
        name: 'door-page',
        path: 'SD/Pages/Door',
    },
];

function makePostcssPluginList(instrumentPath) {
    const usesTailwind = fs.existsSync(`${__dirname}/src/${instrumentPath}/tailwind.config.js`);

    return [tailwindcss(usesTailwind ? `${__dirname}/src/${instrumentPath}/tailwind.config.js` : undefined)];
}

function getInstrumentsToCompile() {
    const baseInstruments = fs.readdirSync(`${__dirname}/src`, { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(`${__dirname}/src/${d.name}/config.json`));

    return [
        ...baseInstruments.map(({ name }) => ({ path: name, name, isInstrument: true })),
        ...extraInstruments.map((def) => ({ ...def, isInstrument: false })),
    ];
}

function getTemplatePlugin({ name, config, imports = [], isInstrument }) {
    if (isInstrument) {
        return instrumentTemplate({
            name,
            config,
            imports,
            getCssBundle() {
                return fs.readFileSync(`${TMPDIR}/${name}-gen.css`).toString();
            },
            outputDir: `${__dirname}/../../A32NX/html_ui/Pages/VCockpit/Instruments/generated`,
        });
        // eslint-disable-next-line no-else-return
    } else {
        return ecamPageTemplate({
            name,
            getCssBundle() {
                return fs.readFileSync(`${TMPDIR}/${name}-gen.css`).toString();
            },
            outputDir: `${__dirname}/../../A32NX/html_ui/Pages/VCockpit/Instruments/generated/EcamPages`,
        });
    }
}

module.exports = getInstrumentsToCompile()
    .map(({ path, name, isInstrument }) => {
        const config = JSON.parse(fs.readFileSync(`${__dirname}/src/${path}/config.json`));

        return {
            input: `${__dirname}/src/${path}/${config.index}`,
            output: {
                file: `${TMPDIR}/${name}-gen.js`,
                format: 'iife',
            },
            plugins: [
                image(),
                nodeResolve({ extensions }),
                commonjs({ include: /node_modules/ }),
                babel({
                    presets: [
                        ['@babel/preset-env', { targets: { safari: '11' } }],
                        ['@babel/preset-react', { runtime: 'automatic' }],
                        ['@babel/preset-typescript'],
                    ],
                    plugins: [
                        '@babel/plugin-proposal-class-properties',
                        ['@babel/plugin-transform-runtime', { regenerator: true }],
                    ],
                    babelHelpers: 'runtime',
                    compact: false,
                    extensions,
                }),
                replace({ 'process.env.NODE_ENV': '"production"' }),
                postcss({
                    use: { sass: {} },
                    plugins: makePostcssPluginList(path),
                    extract: `${TMPDIR}/${name}-gen.css`,
                }),
                getTemplatePlugin({ name, path, imports: ['/JS/dataStorage.js'], config, isInstrument }),
            ],
        };
    });
