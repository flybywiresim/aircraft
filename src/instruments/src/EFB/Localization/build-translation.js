/* eslint-disable no-console */
// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const langFilesPath = path.resolve('downloaded/');
const convertedFilesPath = path.resolve('./');

const dotenv = require('dotenv');

dotenv.config({ path: '../../../../../.env' });

const LocalazyReadKey = process.env.LOCALAZY_READ_KEY;

// Quick exit with warning if .env is not set
if (LocalazyReadKey === undefined || LocalazyReadKey.length < 10) {
    console.warn('Warning: FlyPad translations couldn\'t be updated. Missing .env file with LOCALAZY_READ_KEY.');
    console.warn('         Build can continue without updating.');
    console.warn(`> ${LocalazyReadKey}`.slice(0, 20));
    process.exit(1);
}

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
