/*
    Copyright (c) 2019 Serverless, Inc. http://www.serverless.com

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
 */

'use strict';

// Workaround 'pkg' bug: https://github.com/zeit/pkg/issues/420
// Copying files from snapshot via `fs.copyFileSync` crashes with ENOENT
// Overriding copyFileSync with primitive alternative

const fs = require('fs');

if (!fs.copyFile) return;

const path = require('path');

const originalCopyFile = fs.copyFile;
const originalCopyFileSync = fs.copyFileSync;

const isBundled = RegExp.prototype.test.bind(/^(?:\/snapshot\/|[A-Z]+:\\snapshot\\)/);

fs.copyFile = function copyFile(src, dest, flags, callback) {
    if (!isBundled(path.resolve(src))) {
        originalCopyFile(src, dest, flags, callback);
        return;
    }
    if (typeof flags === 'function') {
        callback = flags;
        flags = 0;
    } else if (typeof callback !== 'function') {
        throw new TypeError('Callback must be a function');
    }

    fs.readFile(src, (readError, content) => {
        if (readError) {
            callback(readError);
            return;
        }
        if (flags & fs.constants.COPYFILE_EXCL) {
            fs.stat(dest, (statError) => {
                if (!statError) {
                    callback(Object.assign(new Error('File already exists'), { code: 'EEXIST' }));
                    return;
                }
                if (statError.code !== 'ENOENT') {
                    callback(statError);
                    return;
                }
                fs.writeFile(dest, content, callback);
            });
        } else {
            fs.writeFile(dest, content, callback);
        }
    });
};

fs.copyFileSync = function copyFileSync(src, dest, flags) {
    if (!isBundled(path.resolve(src))) {
        originalCopyFileSync(src, dest, flags);
        return;
    }
    const content = fs.readFileSync(src);
    if (flags & fs.constants.COPYFILE_EXCL) {
        try {
            fs.statSync(dest);
        } catch (statError) {
            if (statError.code !== 'ENOENT') throw statError;
            fs.writeFileSync(dest, content);
            return;
        }
        throw Object.assign(new Error('File already exists'), { code: 'EEXIST' });
    }
    fs.writeFileSync(dest, content);
};

if (!fs.promises) return;

const { promisify } = require('util');

fs.promises.copyFile = promisify(fs.copyFile);
