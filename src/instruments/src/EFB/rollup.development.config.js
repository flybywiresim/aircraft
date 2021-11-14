'use strict';

import dotenv from 'dotenv';

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
        dotenv.config({ path: '../../../../.env' }),
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
        replace({
            'preventAssignment': true,
            'process.env.NODE_ENV': JSON.stringify('development'),
            'process.env.CLIENT_ID': JSON.stringify(process.env.CLIENT_ID),
            'process.env.CLIENT_SECRET': JSON.stringify(process.env.CLIENT_SECRET),
            'process.env.CHARTFOX_SECRET': JSON.stringify(process.env.CHARTFOX_SECRET),
        }),
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
        sourcemap: true,
    },
};
