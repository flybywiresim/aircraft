// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

'use strict';

const esbuild = require('esbuild');
const path = require('path');
const { createModuleBuild } = require('#build-utils');

const outFile = 'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/SystemsHost/index.js';

// process.env.FBW_TYPECHECK = "1";

esbuild.build(createModuleBuild('fbw-a32nx', undefined, path.join(__dirname, 'index.ts'), outFile, __dirname));
