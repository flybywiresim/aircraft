import fs from 'fs';
import { join } from 'path';
import { baseCompile } from './plugins.mjs';
import { Directories } from './directories.mjs';

process.chdir(Directories.src);

function getInputs() {
    const baseInstruments = fs.readdirSync(join(Directories.instruments, 'src'), { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(join(Directories.instruments, 'src', d.name, 'config.json')));

    return [
        ...baseInstruments.map(({ name }) => ({
            path: name,
            name,
        })),
    ];
}

export default getInputs()
    .map(({ path }) => {
        const config = JSON.parse(fs.readFileSync(join(Directories.instruments, 'src', path, 'config.json')));

        return {
            watch: true,
            input: join(Directories.instruments, 'src', path, config.index),
            output: {
                file: join(Directories.instrumentsAceOutput, path, 'bundle.js'),
                format: 'iife',
            },
            plugins: [
                ...baseCompile(path, path),
            ],
        };
    });
