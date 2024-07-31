// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

'use strict';

const fs = require('fs');
const path = require('path');

function* readdir(d) {
    for (const dirent of fs.readdirSync(d, { withFileTypes: true })) {
        if (['layout.json', 'manifest.json'].includes(dirent.name)) {
            continue;
        }
        const resolved = path.join(d, dirent.name);
        if (dirent.isDirectory()) {
            yield* readdir(resolved);
        } else {
            yield resolved;
        }
    }
}

const buildInfo = require('./git_build_info').getGitBuildInfo();
const packageInfo = require('../package.json');

let titlePostfix;
if (packageInfo.edition === 'stable') {
    titlePostfix = 'Stable';
} else if (buildInfo?.branch === 'master') {
    titlePostfix = 'Development';
} else if (buildInfo?.branch === 'experimental') {
    titlePostfix = 'Experimental';
} else if (buildInfo?.isPullRequest) {
    titlePostfix = `PR #${buildInfo?.ref}`;
} else {
    titlePostfix = `branch ${buildInfo?.branch}`;
}
const titleSuffix = ` (${titlePostfix})`;

// This copies one of two prepared DDS files from the src folder
// (src/Textures/decals 4k/) to the aircraft folder
// (flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/TEXTURE/)
// based on the current branch the build is executed from.
// Stable and Master will get the DDS with the yellow INOP label.
// All other branches get the DDS with the red INOP label.
// Stable will not show the label (encoded in the src/model build.js)
// Development will show a yellow label
// All other branches show a red label

const MS_FILETIME_EPOCH = 116444736000000000n;

const A32NX_SRC = path.resolve(__dirname, '..', 'fbw-a32nx', 'src');
const A32NX_OUT = path.resolve(__dirname, '..', 'fbw-a32nx', 'out', 'flybywire-aircraft-a320-neo');

function createPackageFiles(baseDir, manifestBaseFilename) {
    const contentEntries = [];
    let totalPackageSize = 0;

    for (const filename of readdir(baseDir)) {
        const stat = fs.statSync(filename, { bigint: true });
        contentEntries.push({
            path: path.relative(baseDir, filename.replace(path.sep, '/')),
            size: Number(stat.size),
            date: Number((stat.mtimeNs / 100n) + MS_FILETIME_EPOCH),
        });
        totalPackageSize += Number(stat.size);
    }

    fs.writeFileSync(path.join(baseDir, 'layout.json'), JSON.stringify({
        content: contentEntries,
    }, null, 2));

    const manifestBase = require(path.join(A32NX_SRC, 'base', manifestBaseFilename));

    fs.writeFileSync(path.join(baseDir, 'manifest.json'), JSON.stringify({
        ...manifestBase,
        title: manifestBase.title + titleSuffix,
        package_version: packageInfo.version + `-${buildInfo?.commitHash}`,
        total_package_size: totalPackageSize.toString().padStart(20, '0'),
    }, null, 2));
}

createPackageFiles(A32NX_OUT, 'manifest-base.json');
createPackageFiles(A32NX_OUT + '-lock-highlight', 'manifest-base-lock-highlight.json');
