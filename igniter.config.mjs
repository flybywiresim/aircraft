import { ExecTask, TaskOfTasks } from '@flybywiresim/igniter';
import { getInstrumentsIgniterTasks } from './src/instruments/buildSrc/igniter/tasks.mjs';

export default new TaskOfTasks('a32nx', [
    new TaskOfTasks('build', [
        new TaskOfTasks('instruments', [...getInstrumentsIgniterTasks(), new ExecTask('pfd','npm run build:pfd', ['src/instruments/src/PFD','flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/PFD'])], true),
        new ExecTask('atsu','npm run build:atsu', ['src/atsu', 'flybywire-aircraft-a320-neo/html_ui/JS/atsu']),
        new ExecTask('sentry-client','npm run build:sentry-client', ['src/sentry-client', 'flybywire-aircraft-a320-neo/html_ui/JS/sentry-client']),
        new ExecTask('failures','npm run build:failures', ['src/failures', 'flybywire-aircraft-a320-neo/html_ui/JS/generated/failures.js']),
        new ExecTask('behavior','node src/behavior/build.js', ['src/behavior', 'flybywire-aircraft-a320-neo/ModelBehaviorDefs/A32NX/generated']),
        new ExecTask('model','node src/model/build.js', ['src/model', 'flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/model']),
        new ExecTask('fmgc','npm run build:fmgc', ['src/fmgc', 'flybywire-aircraft-a320-neo/html_ui/JS/fmgc']),
        new ExecTask('systems', [
            'cargo build --target wasm32-wasi --release',
            'wasm-opt -O3 -o flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/systems.wasm target/wasm32-wasi/release/a320_systems_wasm.wasm',
        ], ['src/systems', 'Cargo.lock', 'Cargo.toml', 'flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/systems.wasm']),
        new ExecTask('systems-autopilot', [
            'src/fbw/build.sh',
            'wasm-opt -O1 -o flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fbw.wasm flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fbw.wasm'
        ], ['src/fbw', 'flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fbw.wasm']),
        new ExecTask('systems-fadec', [
            'src/fadec/build.sh',
            'wasm-opt -O1 -o flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fadec.wasm flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fadec.wasm'
        ], ['src/fadec', 'flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fadec.wasm']),
        new TaskOfTasks('mcdu-server', [
            new ExecTask('client', ['npm run build:mcdu-client'], ['src/mcdu-server/client', 'src/mcdu-server/client/build']),
            new ExecTask('server', ['npm run build:mcdu-server'], ['src/mcdu-server', 'flybywire-aircraft-a320-neo/MCDU SERVER/server.exe']),
        ]),
    ], true),

    new TaskOfTasks('dist', [
        new ExecTask('metadata', 'bash scripts/metadata.sh'),
        new ExecTask('manifests', 'node scripts/build.js'),
    ]),
]);
