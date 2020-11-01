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
    name, config, outputDir, getCssBundle,
}) => ({
    name: 'template',
    writeBundle(_config, bundle) {
        const { code: jsCode } = bundle[`${name}-gen.js`];
        const cssCode = getCssBundle();

        const process = (s) => {
            let tmp = s;
            tmp = replaceButSad(tmp, 'INSTRUMENT_NAME_LOWER', name.toLowerCase());
            tmp = replaceButSad(tmp, 'INSTRUMENT_NAME', name);
            tmp = replaceButSad(tmp, 'INSTRUMENT_BUNDLE', jsCode);
            tmp = replaceButSad(tmp, 'INSTRUMENT_STYLE', cssCode);
            tmp = replaceButSad(tmp, 'INSTRUMENT_IS_INTERACTIVE', config.isInteractive || false);
            return tmp;
        };

        const templateHtml = process(TEMPLATE_HTML);
        const templateJs = process(TEMPLATE_JS);

        fs.mkdirSync(`${outputDir}/${name}`, { recursive: true });
        fs.writeFileSync(`${outputDir}/${name}/template.html`, templateHtml);
        fs.writeFileSync(`${outputDir}/${name}/template.js`, templateJs);
    },
});
