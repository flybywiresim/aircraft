// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */

'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const fileExtension = '.locPak';
const localazyConfigFile = 'localazy-locPak-download-config.json';
const workingDir = path.resolve('msfs');
const langFilesPath = 'downloaded';
const convertedFilesPath = '.';
const outFolder = '../../../out/flybywire-aircraft-a380-842';

let UPDATE_LOCAL = false;

// Process command line arguments
process.argv.forEach((val) => {
    if (val === 'local') {
        UPDATE_LOCAL = true;
    }
});

// Only download translations on GitHub actions to avoid changing local files
// automatically when running locally.
// If run with option "local" then it will also update language files locally.
if (!process.env.GITHUB_ACTIONS && !UPDATE_LOCAL) {
    console.warn('Error: Downloading translations only happens on github actions. Add "local" as parameter to download locally.');
    copyFilesToOutFolder();
    process.exit(0);
}

console.log('Updating translations files.');

/**
 * This function is a safety net to check the JSON of the language files.
 * It is probably not required as Localazy should always provide valid JSON files.
 * @param fileName {string} file to process
 * @returns {boolean} true if file was processed successfully, false otherwise
 */
function processFile(fileName) {
    console.log(`Processing file: ${fileName} ...`);

    // Read Localazy json file
    let content;
    try {
        content = fs.readFileSync(path.join(workingDir, langFilesPath, fileName));
    } catch (e) {
        console.error(`Error while reading language file "${fileName}": ${e}`);
        return false;
    }

    // Parse JSON to check if file syntax is correct
    let json;
    try {
        json = JSON.parse(content);
    } catch (e) {
        console.error(`Error while checking json language file "${fileName}": ${e}`);
        return false;
    }

    // Change fileName of file to match the language code
    if (fileName === 'zh-Hans-CN.locPak') {
        console.log(`Renaming file ${fileName} to zh-CN`);
        fileName = 'zh-CN.locPak';
    }

    // Write json file to filesystem
    try {
        // write to the localization/msfs folder
        fs.writeFileSync(path.join(workingDir, convertedFilesPath, `${fileName}`), JSON.stringify(json, null, 2));
    } catch (e) {
        console.error(`Error while writing file "${fileName}": ${e}`);
        return false;
    }

    console.log(`Successfully completed file: ${fileName}`);
    return true;
}

// Create a folder if it does not exist
function createFolderIfNotExist(folderPath) {
    if (!fs.existsSync(folderPath)) {
        console.log(`Creating folder ${folderPath}...`);
        fs.mkdirSync(folderPath, { recursive: true });
        return;
    }
    console.log(`Folder ${folderPath} exists.`);
}

// Copy files to out folder
function copyFilesToOutFolder() {
    console.log('Copying files to out folder...');
    let dirEntries;
    try {
        dirEntries = fs.readdirSync(path.join(workingDir, convertedFilesPath), { withFileTypes: true });
    } catch (e) {
        console.error(`Error while reading folder "${path.join(workingDir, convertedFilesPath)}": ${e}`);
        process.exit(1);
    }
    // make sure the out folder exists before copying files - this is important for the nightly Localazy GitHub action
    createFolderIfNotExist(path.join(workingDir, outFolder));
    for (const dirent of dirEntries) {
        if (dirent.isFile() && dirent.name.endsWith(fileExtension)) {
            const src = path.join(workingDir, convertedFilesPath, dirent.name);
            const dest = path.join(workingDir, outFolder, dirent.name);
            console.log(`Copying file ${src} to ${dest}`);
            fs.copyFileSync(src, dest);
        }
    }
}

// Remove old files as otherwise disabled language files will remain in the folder and
// copied to the main folder every time.
console.log('Removing previous language files...');
try {
    for (const dirent of fs.readdirSync(path.join(workingDir, langFilesPath), { withFileTypes: true })) {
        if (dirent.isFile() && dirent.name.endsWith(fileExtension)) {
            fs.rmSync(path.join(workingDir, langFilesPath, dirent.name));
        }
    }
} catch (e) {
    console.error(`Error while removing previous language files from folder "${path.join(workingDir, langFilesPath).toString()}": ${e}`);
    process.exit(1);
}

console.log('Downloading language files from Localazy');
const localazyCommand = `localazy download -c ${localazyConfigFile} -d ${workingDir}`;
console.log(`Executing command: "${localazyCommand}"`);
exec(localazyCommand,
    (error, stdout, stderr) => {
        if (error) {
            console.warn(`error: ${error.message}`);
            process.exit(1);
        }
        if (stderr) {
            console.warn(`stderr: ${stderr}`);
            process.exit(1);
        }

        // Localazy outputs the file names to stdout, so we can parse them from there.
        stdout.split('\n').forEach((item) => {
            if (item.startsWith('Writing')) {
                console.log(item);
            }
        });

        console.log('Files successfully downloaded. Processing...');
        let readdirSync;
        try {
            readdirSync = fs.readdirSync(path.join(workingDir, langFilesPath), { withFileTypes: true });
        } catch (e) {
            console.error(`Error while reading folder "${path.join(workingDir, langFilesPath)}": ${e}`);
            process.exit(1);
        }
        for (const dirent of readdirSync) {
            if (dirent.isFile() && dirent.name.endsWith(fileExtension)) {
                const fileName = dirent.name;
                if (!processFile(fileName)) {
                    console.error(`Error while processing file "${dirent.name}"`);
                }
            }
        }

        copyFilesToOutFolder();
    });
