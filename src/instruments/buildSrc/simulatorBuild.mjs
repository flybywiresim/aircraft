import fs from 'fs';
import { join } from 'path';
import { baseCompile } from './plugins.mjs';
import { getTemplatePlugin } from './templatePlugins.mjs';
import { Directories } from './directories.mjs';
import { getInputs } from './igniter/tasks.mjs';

process.chdir(Directories.src);

export default getInputs()
    .map(({ path, name, isInstrument }) => {
        const config = JSON.parse(fs.readFileSync(join(Directories.instruments, 'src', path, 'config.json')));

        const additionalImports = config.additionalImports ? config.additionalImports : [];
        return {
            watch: true,
            name,
            input: join(Directories.instruments, 'src', path, config.index),
            output: {
                file: join(Directories.temp, 'bundle.js'),
                format: 'iife',
                globals: [
                    'console',
                ],
            },
            plugins: [
                ...baseCompile(name, path),
                getTemplatePlugin({
                    name,
                    path,
                    imports: [
                        '/JS/dataStorage.js',
                        '/Pages/VCockpit/Instruments/FlightElements/A32NX_Waypoint.js',
                        '/Pages/A32NX_Core/math.js',
                        '/JS/A32NX_Util.js',
                        ...additionalImports,
                    ],
                    config,
                    isInstrument,
                }),
            ],
        };
    });
