'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { translate } = require('..');

function* readdir(d) {
    for (const dirent of fs.readdirSync(d, { withFileTypes: true })) {
        const resolved = path.join(d, dirent.name);
        if (dirent.isDirectory()) {
            yield* readdir(resolved);
        } else {
            yield resolved;
        }
    }
}

for (const test of readdir(path.join(__dirname, 'cases'))) {
    const source = fs.readFileSync(test, 'utf8');
    const [input, output] = source.split('---');
    // for the moment rnp emits a single line of code, so don't worry about newlines and such
    assert.strictEqual(translate(input.trim(), test), output.trim().replace(/\s*\n\s*/g, ' '));
}
