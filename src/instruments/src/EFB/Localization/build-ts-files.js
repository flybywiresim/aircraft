/* eslint-disable no-console */
// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

'use strict';

const fs = require('fs');
const path = require('path');
const eslint = require('eslint');
const { exec } = require('child_process');

const linter = new eslint.ESLint({ fix: true });

const langFilesPath = path.resolve('downloaded/');
const convertedFilesPath = path.resolve('./');

const prefix = '// Created automatically\n\nexport const';

async function processFile(dirent) {
    const name = dirent.name.replace('.json', '');

    console.log(`Starting reading to JSON and writing linted ts file: ${name}.ts ...`);

    // Read Localazy json file
    let content;
    let json;
    try {
        content = fs.readFileSync(path.join(langFilesPath, dirent.name));
        // console.log(`Successfully read file: "${dirent.name}"`);
    } catch (e) {
        console.log(`Error while reading language file "${dirent.name}": ${e}`);
        return;
    }

    // Parse JSON to check if file format is correct
    try {
        json = JSON.parse(content);
        // console.log(`Successfully converted to JSON: "${dirent.name}"`);
    } catch (e) {
        console.log(`Error while converting language file "${dirent.name}": ${e}`);
        return;
    }

    // Make TypeScript file from JSON
    const output = `${prefix} ${name.replaceAll('-', '')} = ${JSON.stringify(json, null, 2)}`;

    // Write ts file to filesystem
    try {
        fs.writeFileSync(path.join(convertedFilesPath, `${name}.ts`), output);
        // console.log(`Successfully written to ts file: ${name}.ts`);
    } catch (e) {
        console.log(`Error while writing ts file "${dirent.name}": ${e}`);
    }

    // Use ESLint to "fix" files
    const results = await linter.lintFiles(path.join(convertedFilesPath, `${name}.ts`));
    await eslint.ESLint.outputFixes(results);

    console.log(`Successfully completed ts file: ${name}.ts`);
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
    console.log('Files successfully downloaded. Processing...');
    for (const dirent of fs.readdirSync(langFilesPath, { withFileTypes: true })) {
        if (dirent.isFile() && dirent.name.endsWith('.json')) {
            processFile(dirent).then();
        }
    }
});
