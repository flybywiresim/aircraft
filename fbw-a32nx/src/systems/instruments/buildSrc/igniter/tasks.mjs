import fs from 'fs';
import { join } from 'path';
import { ExecTask } from '@flybywiresim/igniter';
import { Directories } from '../directories.mjs';

export function getInstrumentsIgniterTasks() {
    const baseInstruments = fs.readdirSync(join(Directories.instruments, 'src'), { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(join(Directories.instruments, 'src', d.name, 'config.json')));

    return baseInstruments.map(({ name }) => new ExecTask(
        name,
        `cd fbw-a32nx && mach build -f ${name}`,
        [
            join('fbw-a32nx/src/systems/instruments/src', name),
            'fbw-a32nx/src/systems/instruments/src/Common',
            join('fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX', name),
        ],
    ));
}
