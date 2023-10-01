import fs from 'fs';
import { join } from 'path';
import { ExecTask, TaskOfTasks } from '@flybywiresim/igniter';
import { Directories } from '../directories.mjs';

export function getInstrumentsIgniterTasks() {
    const baseInstruments = fs.readdirSync(join(Directories.instruments, 'src'), { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(join(Directories.instruments, 'src', d.name, 'config.json')));

    return baseInstruments.map((instrument) => new ExecTask(
        instrument.name,
        `cd fbw-a32nx && mach build -f ${instrument.name}`,
        [
            join('fbw-a32nx/src/systems/instruments/src', instrument.name),
            'fbw-a32nx/src/systems/instruments/src/Common',
            join('fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX', instrument.name),
        ],
    ));
    // new ExecTask(`${instrument.name}_tsc`, `tsc -noemit -p ${join(Directories.instruments, 'src', instrument.name, 'tsconfig.json')} 1>&2`)]));
}
