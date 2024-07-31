// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

'use strict';

const esbuild = require('esbuild');
const path = require('path');
const { createModuleBuild } = require('#build-utils');

const rootDir = path.join(__dirname, '..', '..', '..', '..', '..');
const outFile = 'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/fbw-a32nx/atsu/common.js';

const srcDir = path.join('fbw-common', 'src', 'systems', 'datalink', 'common');

esbuild.build(createModuleBuild('fbw-a32nx', 'AtsuCommon', path.join(rootDir, srcDir, 'src', 'index.ts'), outFile, path.join(rootDir, srcDir)));
