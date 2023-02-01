// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

'use strict';

const { JSDOM } = require('jsdom');
const rnp = require('@flybywiresim/rnp');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const SRC = path.resolve(__dirname, 'src');
const OUT = path.resolve(__dirname, '..', '..', '..', 'fbw-a32nx/out/flybywire-aircraft-a320-neo/ModelBehaviorDefs/A32NX/generated');

fs.mkdirSync(OUT, { recursive: true });

function translate(filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const dom = new JSDOM(source, {
        contentType: 'text/xml',
        url: pathToFileURL(filename),
    });

    Array.from(dom.window.document.querySelectorAll('[type="rnp"]'))
        .forEach((e) => {
            const { messages, output } = rnp.translate(e.textContent.replace(/&lt;/g, '<'), {
                specifier: '(inline)',
                returnType: rnp.Type[(e.getAttribute('return') || 'void').toUpperCase()] || rnp.Type.VOID,
            });
            messages.forEach((m) => {
                if (m.level === 'error') {
                    process.exitCode = 1;
                }
                process.stderr.write(`${m.level}: ${m.message}\n${m.detail}\n`);
            });

            const leading = /(^\s*)/.exec(e.innerHTML)[1];
            const trailing = /(\s*$)/.exec(e.innerHTML)[1];

            e.removeAttribute('type');
            e.removeAttribute('return');
            e.innerHTML = `${leading}${output.replace(/\n/g, leading)}${trailing}`.replace(/</g, '&lt;');
        });

    return dom.serialize();
}

fs.readdirSync(SRC)
    .forEach((f) => {
        const filename = path.join(SRC, f);
        const translated = translate(filename);
        fs.writeFileSync(path.join(OUT, f), translated);
    });
