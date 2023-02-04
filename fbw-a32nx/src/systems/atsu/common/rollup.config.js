// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

'use strict';

const { join } = require('path');
const babel = require('@rollup/plugin-babel').default;
const { typescriptPaths } = require('rollup-plugin-typescript-paths');
const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve').default;
const json = require('@rollup/plugin-json');

const replace = require('@rollup/plugin-replace');

const extensions = ['.js', '.ts'];

<<<<<<< HEAD:fbw-a32nx/src/systems/atsu/common/rollup.config.js
const src = join(__dirname, '..', '..');
const root = join(__dirname, '..', '..', '..');
=======
const src = join(__dirname, '..');
console.log('Src: ', src);
const root = join(process.cwd());
console.log('Root: ', root);
>>>>>>> master:fbw-a32nx/src/systems/atsu/rollup.config.js

process.chdir(src);

module.exports = {
    input: join(__dirname, 'src/index.ts'),
    plugins: [
        nodeResolve({ extensions, browser: true }),
        commonjs(),
        json(),
        babel({
            babelHelpers: 'bundled',
            presets: ['@babel/preset-typescript', ['@babel/preset-env', { targets: { browsers: ['safari 11'] } }]],
            plugins: [
                '@babel/plugin-proposal-class-properties',
            ],
            extensions,
        }),
        typescriptPaths({
            tsConfigPath: join(src, 'tsconfig.json'),
            preserveExtensions: true,
        }),
        replace({
            'DEBUG': 'false',
            'process.env.NODE_ENV': '"production"',
            'preventAssignment': true,
        }),
    ],
    output: {
<<<<<<< HEAD:fbw-a32nx/src/systems/atsu/common/rollup.config.js
        file: join(root, 'flybywire-aircraft-a320-neo/html_ui/JS/atsu/common.js'),
=======
        file: join(root, 'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/atsu/atsu.js'),
>>>>>>> master:fbw-a32nx/src/systems/atsu/rollup.config.js
        format: 'umd',
        name: 'AtsuCommon',
    },
};
