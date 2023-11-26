import fs from 'fs';
import { join } from 'path';
import { ExecTask } from '@flybywiresim/igniter';
import { Directories } from '../directories.mjs';

export function getInstrumentsIgniterTasks() {
    const baseInstruments = fs.readdirSync(join(Directories.instruments, 'src'), { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(join(Directories.instruments, 'src', d.name, 'config.json')));

    return baseInstruments.map(({ name }) => new ExecTask(
        name,
        `cd fbw-a380x && mach build -f ${name}`,
        [
            join('fbw-a380x/src/systems/instruments/src', name),
            'fbw-a380x/src/systems/instruments/src/Common',
            join('fbw-a380x/out/flybywire-aircraft-a380-842/html_ui/Pages/VCockpit/Instruments/A380X', name),
        ],
    ));
}
