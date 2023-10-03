// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

'use strict';

const esbuild = require('esbuild');
const path = require('path');
const { esbuildModuleBuild } = require('#build-utils');

const rootDir = path.join(__dirname, '..', '..', '..', '..');
const outFile = 'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/fbw-a32nx/atsu/common.js';

esbuild.build(esbuildModuleBuild('fbw-a32nx', 'AtsuCommon', path.join(rootDir, '../fbw-common/src/systems/datalink/common/src/index.ts'), outFile));
