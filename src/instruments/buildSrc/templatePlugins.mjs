import { join } from 'path';
import instrumentTemplate from '@flybywiresim/rollup-plugin-msfs';
import ecamPageTemplate from '../ecam-page-template/rollup.js';
import { Directories } from './directories.mjs';

export function getTemplatePlugin({ name, config, imports = [], isInstrument }) {
    if (isInstrument) {
        return instrumentTemplate({
            name,
            elementName: `a32nx-${name.toLowerCase()}`,
            config,
            imports,
            outputDir: join(Directories.root, 'flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX'),
        });
    }
    return ecamPageTemplate({
        name,
        outputDir: join(Directories.root, 'flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/EcamPages'),
    });
}
