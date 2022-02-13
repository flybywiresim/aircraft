import fs from 'fs';
import { join } from 'path';
import { baseCompile } from './plugins.mjs';
import { Directories } from './directories.mjs';
import { getInputs } from './igniter/tasks.mjs';
import instrumentTemplatePlugin from '../template-plugin.mjs';
import ecamPageTemplatePlugin from '../ecam-page-template/rollup.js';

process.chdir(Directories.src);

export default getInputs()
    .map(({ path, name, isInstrument }) => {
        const config = JSON.parse(fs.readFileSync(join(Directories.instruments, 'src', path, 'config.json')));

        const instrumentsOutput = join(Directories.root, 'flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX');
        const additionalImports = config.additionalImports || [];

        return {
            watch: true,
            name,
            input: join(Directories.instruments, 'src', path, config.index),
            output: {
                file: isInstrument ? join(instrumentsOutput, name, 'bundle.js') : join(Directories.temp, 'bundle.js'),
                format: 'iife',
                sourcemap: true
            },
            plugins: [
                ...baseCompile(name, path),
                isInstrument ? instrumentTemplatePlugin({
                    name,
                    isInteractive: config.isInteractive || false,
                    outputDir: instrumentsOutput,
                    instrumentDir: name,
                    imports: [
                        '/JS/dataStorage.js',
                        '/Pages/VCockpit/Instruments/FlightElements/A32NX_Waypoint.js',
                        ...additionalImports
                    ]
                }) : ecamPageTemplatePlugin({
                    name,
                    outputDir: join(Directories.root, 'flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/EcamPages'),
                }),
            ],
        };
    });
