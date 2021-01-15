/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
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
const { babel } = require('@rollup/plugin-babel');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const scss = require('rollup-plugin-scss');
const scssCompiler = require('sass');
const template = require('./template/rollup.js');

const TMPDIR = `${os.tmpdir()}/a32nx-instruments-gen`;

module.exports = fs.readdirSync(`${__dirname}/src`, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(`${__dirname}/src/${d.name}/config.json`))
    .map(({ name }) => {
        const config = JSON.parse(fs.readFileSync(`${__dirname}/src/${name}/config.json`));
        let cssBundle;
        return {
            input: `${__dirname}/src/${name}/${config.index}`,
            output: {
                file: `${TMPDIR}/${name}-gen.js`,
                format: 'iife',
            },
            plugins: [
                babel({
                    presets: [
                        ['@babel/preset-react', {
                            runtime: 'automatic',
                        }],
                    ],
                    plugins: ['@babel/plugin-proposal-object-rest-spread'],
                    babelHelpers: 'bundled',
                    exclude: /node_modules/,
                }),
                replace({
                    'process.env.NODE_ENV': '"production"',
                }),
                nodeResolve(),
                commonjs({
                    include: /node_modules/,
                }),
                scss({
                    sass: scssCompiler,
                    output: (generatedBundle) => {
                        cssBundle = generatedBundle;
                    },
                }),
                template({
                    name,
                    config,
                    getCssBundle() {
                        return cssBundle;
                    },
                    outputDir: `${__dirname}/../../A32NX/html_ui/Pages/VCockpit/Instruments/generated`,
                }),
            ],
        };
    });
