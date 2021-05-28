import fs from 'fs';
import { ExecTask } from '@flybywiresim/igniter';
import { Directories } from '../directories.mjs';

const ecamPages = [
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
];

function getInputs() {
    const baseInstruments = fs.readdirSync(`${Directories.instruments}/src`, { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(`${Directories.instruments}/src/${d.name}/config.json`));

    return [
        ...baseInstruments.map(({ name }) => new ExecTask(
            name,
            `node src/instruments/buildSrc/igniter/worker.mjs ${name}`,
            [`src/instruments/src/${name}`, `flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/${name}`],
        )),
        ...ecamPages.map(({ name, path }) => new ExecTask(
            name,
            `node src/instruments/buildSrc/igniter/worker.mjs ${name}`,
            [`src/instruments/src/${path}`, `flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/EcamPages/${name}`],
        )),
    ];
}

export default getInputs();
