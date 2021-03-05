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

const image = require('@rollup/plugin-image');
const babel = require('@rollup/plugin-babel').default;
const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve').default;
const replace = require('@rollup/plugin-replace');
const postcss = require('rollup-plugin-postcss');
const tailwindcss = require('tailwindcss');
const copy = require('rollup-plugin-copy');
const serve = require('rollup-plugin-serve');
const livereload = require('rollup-plugin-livereload');

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

module.exports = {
    input: `${__dirname}/index-web.tsx`,
    plugins: [
        image(),
        nodeResolve({ extensions }),
        commonjs({ include: /node_modules/ }),
        babel({
            presets: [
                ['@babel/preset-env'],
                ['@babel/preset-react', { runtime: 'automatic' }],
                ['@babel/preset-typescript'],
            ],
            plugins: [
                '@babel/plugin-proposal-class-properties',
                ['@babel/plugin-transform-runtime', { regenerator: true }],
            ],
            babelHelpers: 'runtime',
            extensions,
        }),
        replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
        postcss({
            use: { sass: {} },
            plugins: [tailwindcss(`${__dirname}/tailwind.config.js`)],
            extract: `${__dirname}/web/bundle.css`,
        }),
        copy({
            targets: [
                { src: 'src/Assets/**', dest: 'web/Assets' },
            ],
        }),
        serve(),
        livereload('web'),
    ],
    output: {
        file: `${__dirname}/web/bundle.js`,
        format: 'iife',
    },
};
