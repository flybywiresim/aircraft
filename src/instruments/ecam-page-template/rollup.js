/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const fs = require('fs');

// The bundle code contains `$`, which is a special character
// in JS replace and replaceAll, so we can't use those.
function replaceButSad(s, search, replace) {
    return s.split(search).join(replace);
}

const TEMPLATE_HTML = fs.readFileSync(`${__dirname}/template.html`, 'utf8');
const TEMPLATE_JS = fs.readFileSync(`${__dirname}/template.js`, 'utf8');

module.exports = ({
    name, outputDir, getCssBundle,
}) => ({
    name: 'template',
    writeBundle(_config, bundle) {
        const { code: jsCode } = bundle[`${name}-gen.js`];
        const cssCode = getCssBundle();

        const snakeCaseName = name.replace('-', '_');

        const process = (s) => {
            let tmp = s;
            tmp = replaceButSad(tmp, 'PAGE_NAME_LOWER_SKEWER', name);
            tmp = replaceButSad(tmp, 'PAGE_NAME_SKEWER', name);
            tmp = replaceButSad(tmp, 'PAGE_NAME_LOWER', snakeCaseName.toLowerCase());
            tmp = replaceButSad(tmp, 'PAGE_NAME', snakeCaseName);
            tmp = replaceButSad(tmp, 'PAGE_BUNDLE', jsCode);
            tmp = replaceButSad(tmp, 'PAGE_STYLE', cssCode);
            return tmp;
        };

        const templateHtml = process(TEMPLATE_HTML);
        const templateJs = process(TEMPLATE_JS);

        fs.mkdirSync(`${outputDir}/${name}`, { recursive: true });
        fs.writeFileSync(`${outputDir}/${name}/template.html`, templateHtml);
        fs.writeFileSync(`${outputDir}/${name}/template.js`, templateJs);
    },
});
