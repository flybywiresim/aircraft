import instrumentTemplate from '@flybywiresim/rollup-plugin-msfs';
import ecamPageTemplate from '../ecam-page-template/rollup.js';

export function getTemplatePlugin({ name, config, imports = [], isInstrument }) {
    if (isInstrument) {
        return instrumentTemplate({
            name,
            config,
            imports,
            getCssBundle() {
                return fs.readFileSync(`${TMPDIR}/${name}-gen.css`).toString();
            },
            outputDir: `${__dirname}/../../flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/generated`,
        });
    } else {
        return ecamPageTemplate({
            name,
            getCssBundle() {
                return fs.readFileSync(`${TMPDIR}/${name}-gen.css`).toString();
            },
            outputDir: `${__dirname}/../../flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/generated/EcamPages`,
        });
    }
}