// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */

'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const langFilesPath = path.resolve('downloaded/');
const convertedFilesPath = path.resolve('./');

let UPDATE_LOCAL = false;

// Quick exit if run locally to not change the local files automatically.
// Will then only run within a GitHub action or when started manually.
// If run with option "local" then it will also update languages files locally.
process.argv.forEach((val) => {
    if (val === 'local') {
        UPDATE_LOCAL = true;
    }
});
if (!process.env.GITHUB_ACTIONS && !UPDATE_LOCAL) {
    console.warn('Error: Only runs on github actions');
    // exit with '0' to show build as successful to not confuse devs
    process.exit(0);
}

console.log('Updating translations files.');

// .env does not work for PRs - hard coding the read only key has no risk as language files are public anyway.
const LocalazyReadKey = 'a8263619487010799481-d63ff7f0aed9bf9e6c24d9878ca821c5a97fa77df75b0ce222aea98709900277';

function processFile(dirent) {
    const name = dirent.name.replace('.json', '');

    console.log(`Processing file: ${name}.ts ...`);

    // Read Localazy json file
    let content;
    try {
        content = fs.readFileSync(path.join(langFilesPath, dirent.name));
    } catch (e) {
        console.error(`Error while reading language file "${dirent.name}": ${e}`);
        return false;
    }

    // Parse JSON to check if file syntax is correct
    let json;
    try {
        json = JSON.parse(content);
    } catch (e) {
        console.error(`Error while checking json language file "${dirent.name}": ${e}`);
        return false;
    }

    // Write ts file to filesystem
    try {
        fs.writeFileSync(path.join(convertedFilesPath, `${name}.json`), JSON.stringify(json, null, 2));
    } catch (e) {
        console.error(`Error while writing file "${dirent.name}": ${e}`);
        return false;
    }

    console.log(`Successfully completed file: ${name}.json`);
    return true;
}

// Remove old files as otherwise disabled language files will remain in the folder and
// copied to the main folder every time.
console.log('Removing previous language files...');
try {
    for (const dirent of fs.readdirSync(langFilesPath, { withFileTypes: true })) {
        if (dirent.isFile() && dirent.name.endsWith('.json')) {
            fs.rmSync(path.join(langFilesPath, dirent.name));
        }
    }
} catch (e) {
    console.error(`Error while removing previous language files from folder "${langFilesPath}": ${e}`);
    process.exit(1);
}

console.log('Downloading language files from Localazy');
exec(`localazy download -r ${LocalazyReadKey}`, (error, stdout, stderr) => {
    if (error) {
        console.warn(`error: ${error.message}`);
        process.exit(1);
    }
    if (stderr) {
        console.warn(`stderr: ${stderr}`);
        process.exit(1);
    }

    stdout.split('\n').forEach((item) => {
        if (item.startsWith('Writing')) {
            console.log(item);
        }
    });

    console.log('Files successfully downloaded. Processing...');
    let result = true;
    let readdirSync;
    try {
        readdirSync = fs.readdirSync(langFilesPath, { withFileTypes: true });
    } catch (e) {
        console.error(`Error while reading folder "${langFilesPath}": ${e}`);
        process.exit(1);
    }
    for (const dirent of readdirSync) {
        if (dirent.isFile() && dirent.name.endsWith('.json')) {
            if (!processFile(dirent)) {
                result = false;
            }
        }
    }
    process.exit(result ? 0 : 1);
});
