/* eslint-disable no-console */
// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const langFilesPath = path.resolve('downloaded/');
const convertedFilesPath = path.resolve('./');

async function processFile(dirent) {
    const name = dirent.name.replace('.json', '');

    console.log(`Processing file: ${name}.ts ...`);

    // Read Localazy json file
    let content;
    try {
        content = fs.readFileSync(path.join(langFilesPath, dirent.name));
    } catch (e) {
        console.log(`Error while reading language file "${dirent.name}": ${e}`);
        return;
    }

    // Parse JSON to check if file syntax is correct
    let json;
    try {
        json = JSON.parse(content);
    } catch (e) {
        console.log(`Error while checking json language file "${dirent.name}": ${e}`);
        return;
    }

    // Write ts file to filesystem
    try {
        fs.writeFileSync(path.join(convertedFilesPath, `${name}.json`), JSON.stringify(json, null, 2));
    } catch (e) {
        console.log(`Error while writing file "${dirent.name}": ${e}`);
        return;
    }

    console.log(`Successfully completed file: ${name}.json`);
}

console.log('Downloading language files from Localazy');
exec(`Localazy download -r ${process.env.LOCALAZY_READ_KEY}`, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    stdout.split('\n').forEach((item) => {
        if (item.startsWith('Writing')) {
            console.log(item);
        }
    });
    console.log('Files successfully downloaded. Processing...');
    for (const dirent of fs.readdirSync(langFilesPath, { withFileTypes: true })) {
        if (dirent.isFile() && dirent.name.endsWith('.json')) {
            processFile(dirent).then();
        }
    }
});
