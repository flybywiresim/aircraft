// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

'use strict';

const fs = require('fs');
const path = require('path');

// This copies one of two prepared DDS files from the src folder
// (src/Textures/decals 4k/) to the aircraft folder
// (flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/TEXTURE/)
// based on the current branch the build is executed from.
// Stable and Master will get the DDS with the yellow INOP label.
// All other branches get the DDS with the red INOP label.
// Stable will not show the label (encoded in the src/model build.js)
// Development will show a yellow label
// All other branches show a red label

const { execSync } = require('child_process');

function executeGitCommand(command) {
    return execSync(command)
        .toString('utf8')
        .replace(/[\n\r]+$/, '');
}

const A32NX = path.resolve(__dirname, '../../', 'flybywire-aircraft-a320-neo');

function copyDDSFiles(srcDds) {
    const TARGET_PATH = '/SimObjects/AirPlanes/FlyByWire_A320_NEO/TEXTURE/A320NEO_COCKPIT_DECALSTEXT_ALBD.TIF.dds';
    // destination will be created or overwritten by default.
    fs.copyFile(path.resolve(__dirname, srcDds), path.join(A32NX, TARGET_PATH),
        (err) => {
            if (err) {
                throw err;
            }
            console.log(`copying ${srcDds} to ${TARGET_PATH}failed: ${err}`);
        });
}

const edition = require('../../package.json').edition;

const isPullRequest = process.env.GITHUB_REF && process.env.GITHUB_REF.startsWith('refs/pull/');

let GIT_BRANCH;
if (isPullRequest) {
    GIT_BRANCH = process.env.GITHUB_REF.match('^refs/pull/([0-9]+)/.*$')[1];
} else {
    GIT_BRANCH = process.env.GITHUB_REF_NAME
        ? process.env.GITHUB_REF_NAME
        : executeGitCommand('git rev-parse --abbrev-ref HEAD');
}

if (edition === 'stable') {
    copyDDSFiles('decals 4k/A320NEO_COCKPIT_DECALSTEXT_ALBD.TIF-stable.dds');
} else if (GIT_BRANCH === 'master') {
    copyDDSFiles('decals 4k/A320NEO_COCKPIT_DECALSTEXT_ALBD.TIF-master.dds');
} else {
    copyDDSFiles('decals 4k/A320NEO_COCKPIT_DECALSTEXT_ALBD.TIF-exp.dds');
}
