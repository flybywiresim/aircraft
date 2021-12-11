import fs from 'fs';
import { join } from 'path';
import { ExecTask } from '@flybywiresim/igniter';
import { Directories } from '../directories.mjs';

const ecamPages = [
    {
        name: 'eng-page',
        path: 'SD/Pages/Eng',
    },
    {
        name: 'door-page',
        path: 'SD/Pages/Door',
    },
    {
        name: 'cond-page',
        path: 'SD/Pages/Cond',
    },
    {
        name: 'fctl-page',
        path: 'SD/Pages/Fctl',
    },
    {
        name: 'elec-page',
        path: 'SD/Pages/Elec',
    },
    {
        name: 'hyd-page',
        path: 'SD/Pages/Hyd',
    },
    {
        name: 'wheel-page',
        path: 'SD/Pages/Wheel',
    },
    {
        name: 'crz-page',
        path: 'SD/Pages/Crz',
    },
    {
        name: 'fuel-page',
        path: 'SD/Pages/Fuel',
    },
    {
        name: 'apu-page',
        path: 'SD/Pages/Apu',
    },
    {
        name: 'press-page',
        path: 'SD/Pages/Press',
    },
];

export function getInputs() {
    const baseInstruments = fs.readdirSync(join(Directories.instruments, 'src'), { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(join(Directories.instruments, 'src', d.name, 'config.json')));

    return [
        ...baseInstruments.map(({ name }) => ({ path: name, name, isInstrument: true })),
        ...ecamPages.map((def) => ({ ...def, isInstrument: false })),
    ];
}

export function getInstrumentsIgniterTasks() {
    const baseInstruments = fs.readdirSync(join(Directories.instruments, 'src'), { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(join(Directories.instruments, 'src', d.name, 'config.json')));

    return [
        ...baseInstruments.map(({ name }) => new ExecTask(
            name,
            `node src/instruments/buildSrc/igniter/worker.mjs ${name}`,
            [join('src/instruments/src', name), join('flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX', name)],
        )),
        ...ecamPages.map(({ name, path }) => new ExecTask(
            name,
            `node src/instruments/buildSrc/igniter/worker.mjs ${name}`,
            [join('src/instruments/src', path), join('flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/EcamPages', name)],
        )),
    ];
}
