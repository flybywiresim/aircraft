// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

'use strict';

const { join } = require('path');
const babel = require('@rollup/plugin-babel').default;
const { typescriptPaths } = require('rollup-plugin-typescript-paths');
const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve').default;
const replace = require('@rollup/plugin-replace');

const extensions = ['.js', '.ts'];

const src = join(__dirname, '..');
console.log('Src: ', src);
const root = join(process.cwd());
console.log('Root: ', root);

process.chdir(src);

module.exports = {
  input: join(__dirname, 'index.ts'),
  plugins: [
    nodeResolve({ extensions }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-typescript', ['@babel/preset-env', { targets: { browsers: ['safari 11'] } }]],
      plugins: ['@babel/plugin-proposal-class-properties'],
      extensions,
    }),
    typescriptPaths({
      tsConfigPath: join(src, 'tsconfig.json'),
      preserveExtensions: true,
    }),
    replace({
      'process.env.NODE_ENV': '"production"',
      preventAssignment: true,
    }),
  ],
  output: {
    file: join(root, 'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/fbw-a32nx/failures/failures.js'),
    format: 'umd',
    name: 'Failures',
  },
};
