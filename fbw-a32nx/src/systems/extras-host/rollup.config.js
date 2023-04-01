// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

'use strict';

import ts from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

const { join } = require('path');

const root = join(__dirname, '..', '..', '..', '..');
console.log('Root: ', root);

export default {
    input: join(__dirname, 'index.tsx'),
    output: {
        dir: join(root, 'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/ExtrasHost'),
        format: 'es',
    },
    plugins: [
        resolve({ browser: true }),
        commonjs({ include: /node_modules/ }),
        json(),
        ts(),
    ],
};
