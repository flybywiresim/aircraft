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

        return {
            watch: true,
            name,
            input: join(Directories.instruments, 'src', path, config.index),
            output: {
                file: join(Directories.temp, 'bundle.js'),
                format: 'iife',
            },
            plugins: [
                ...baseCompile(name, path),
                getTemplatePlugin({ name, path, imports: ['/JS/dataStorage.js'], config, isInstrument }),
            ],
        };
    });
