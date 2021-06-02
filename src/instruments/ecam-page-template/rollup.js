'use strict';

const fs = require('fs');

// The bundle code contains `$`, which is a special character
// in JS replace and replaceAll, so we can't use those.
function replaceButSad(s, search, replace) {
    return s.split(search).join(replace);
}

const TEMPLATE_HTML = fs.readFileSync(`${__dirname}/template.html`, 'utf8');
const TEMPLATE_JS = fs.readFileSync(`${__dirname}/template.js`, 'utf8');

module.exports = ({ name, outputDir }) => ({
    name: 'template',
    writeBundle(_config, bundle) {
        const { code: jsCode } = bundle['bundle.js'];
        const { source: cssCode } = bundle['bundle.css'];

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
