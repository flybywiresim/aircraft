'use strict';

const os = require('os');
const fs = require('fs');
const image = require('@rollup/plugin-image');
const { babel } = require('@rollup/plugin-babel');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const scss = require('rollup-plugin-scss');
const scssCompiler = require('sass');
const { resolve } = require('path');
const template = require('./template/rollup.js');

const TMPDIR = `${os.tmpdir()}/a32nx-instruments-gen`;

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

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
                image(),
                nodeResolve({ extensions }),
                commonjs({ include: /node_modules/ }),
                babel({
                    presets: [
                        ['@babel/preset-env', {
                            targets: {
                                safari: '11',
                            },
                        }],
                        ['@babel/preset-react', {
                            runtime: 'automatic',
                        }],
                        ['@babel/preset-typescript'],
                    ],
                    plugins: [
                        '@babel/plugin-proposal-class-properties',
                        ['@babel/plugin-transform-runtime', {
                            regenerator: true,
                        }],
                    ],
                    babelHelpers: 'runtime',
                    extensions,
                }),
                replace({ 'process.env.NODE_ENV': '"production"' }),
                scss({
                    compiler: scssCompiler,
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
