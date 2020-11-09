'use strict';

const os = require('os');
const fs = require('fs');
const { babel } = require('@rollup/plugin-babel');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const scss = require('rollup-plugin-scss');
const scssCompiler = require('node-sass');
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
