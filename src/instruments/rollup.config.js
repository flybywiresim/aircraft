'use strict';

const os = require('os');
const fs = require('fs');
const { babel } = require('@rollup/plugin-babel');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const template = require('./template/rollup.js');

const TMPDIR = `${os.tmpdir()}/a32nx-instruments-gen`;

module.exports = fs.readdirSync(`${__dirname}/src`, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map(({ name }) => ({
    input: `${__dirname}/src/${name}/index.jsx`,
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
        'process.env': '({})',
      }),
      nodeResolve(),
      commonjs({
        include: /node_modules/,
      }),
      template({
        name,
        outputDir: `${__dirname}/../../A32NX/html_ui/Pages/VCockpit/Instruments/generated`,
      }),
    ],
  }));
