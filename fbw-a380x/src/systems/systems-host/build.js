// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

'use strict';

const esbuild = require('esbuild');
const path = require('path');
const { createModuleBuild } = require('#build-utils');

function buildSystem(system) {
  const outFile = `fbw-a380x/out/flybywire-aircraft-a380-842/html_ui/Pages/VCockpit/Instruments/A380X/SystemsHost/${system}/index.js`;

  esbuild.build(
    createModuleBuild('fbw-a380x', undefined, path.join(__dirname, `./${system}index.ts`), outFile, __dirname),
  );
}

buildSystem('Misc');
