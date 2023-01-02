'use strict';

import ts from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

const { join } = require('path');

export default {
    input: join(__dirname, 'index.tsx'),
    output: {
        dir: '../../../../flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/SystemsHost',
        format: 'es',
    },
    plugins: [
        resolve({ browser: true }),
        commonjs({ include: /node_modules/ }),
        json(),
        ts(),
    ],
};
