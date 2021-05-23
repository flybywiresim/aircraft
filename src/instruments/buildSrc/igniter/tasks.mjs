import fs from 'fs';
import { Directories } from '../directories.mjs';
import { RollupTask } from './RollupTask.mjs';

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
];

function getInputs() {
    const baseInstruments = fs.readdirSync(`${Directories.instruments}/src`, { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(`${Directories.instruments}/src/${d.name}/config.json`));

    return [
        ...baseInstruments.map(({ name }) => new RollupTask(
            name,
            name,
            [`src/instruments/src/${name}`, `flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/${name}`],
        )),
        ...ecamPages.map(({ name, path }) => new RollupTask(
            name,
            name,
            [`src/instruments/src/${path}`, `flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/EcamPages/${name}`],
        )),
    ];
}

export default getInputs();
