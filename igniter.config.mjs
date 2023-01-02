import { ExecTask, TaskOfTasks } from '@flybywiresim/igniter';
import { getInstrumentsIgniterTasks } from './src/instruments/buildSrc/igniter/tasks.mjs';

export default new TaskOfTasks('a32nx', [
    new TaskOfTasks('preparation', [
        new ExecTask('efb-translation', 'npm run build:efb-translation'),
    ]),

    new TaskOfTasks('wasm', [
        new ExecTask('systems', [
            'cargo build -p a320_systems_wasm --target wasm32-wasi --release',
            'wasm-opt -O1 -o flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/systems.wasm target/wasm32-wasi/release/a320_systems_wasm.wasm',
        ], ['src/systems', 'Cargo.lock', 'Cargo.toml', 'flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/systems.wasm']),
        new ExecTask('systems-autopilot', [
            'src/fbw_a320/build.sh',
            'wasm-opt -O1 -o flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fbw.wasm flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fbw.wasm'
        ], ['src/fbw_a320', 'src/fbw_common', 'flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fbw.wasm']),
        new ExecTask('systems-fadec', [
            'src/fadec/build.sh',
            'wasm-opt -O1 -o flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fadec.wasm flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fadec.wasm'
        ], ['src/fadec', 'src/fbw_common', 'flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fadec.wasm']),
        new ExecTask('flypad-backend', [
            'src/flypad-backend/build.sh',
            'wasm-opt -O1 -o flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/flypad-backend.wasm flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/flypad-backend.wasm'
        ], ['src/flypad-backend', 'flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/flypad-backend.wasm']),
    ], true),

    new TaskOfTasks('build', [
        new TaskOfTasks('instruments',
            [...getInstrumentsIgniterTasks(),
                new ExecTask('pfd',
                    'npm run build:pfd',
                    ['src/instruments/src/PFD','flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/PFD']
                ),
                new ExecTask('SystemsHost',
                    'npm run build:systemshost',
                    ['src/instruments/src/SystemsHost','flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/SystemsHost']
                )
            ],
            true),
        new TaskOfTasks('atsu', [
            new ExecTask('common','npm run build:atsu-common', ['src/atsu/common', 'flybywire-aircraft-a320-neo/html_ui/JS/atsu/common.js']),
            new ExecTask('system','npm run build:atsu-system', ['src/atsu/system', 'flybywire-aircraft-a320-neo/html_ui/JS/atsu/system.js']),
            new ExecTask('fmsclient','npm run build:atsu-fms-client', ['src/atsu/fmsclient', 'flybywire-aircraft-a320-neo/html_ui/JS/atsu/fmsclient.js']),
        ]),
        new ExecTask('sentry-client','npm run build:sentry-client', ['src/sentry-client', 'flybywire-aircraft-a320-neo/html_ui/JS/sentry-client']),
        new ExecTask('failures','npm run build:failures', ['src/failures', 'flybywire-aircraft-a320-neo/html_ui/JS/generated/failures.js']),
        new ExecTask('behavior','node src/behavior/build.js', ['src/behavior', 'flybywire-aircraft-a320-neo/ModelBehaviorDefs/A32NX/generated']),
        new ExecTask('model','node src/model/build.js', ['src/model', 'flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/model']),
        new ExecTask('fmgc','npm run build:fmgc', ['src/fmgc', 'flybywire-aircraft-a320-neo/html_ui/JS/fmgc']),
        new TaskOfTasks('simbridge', [
            new ExecTask('client', ['npm run build:simbridge-client'], ['src/simbridge-client', 'flybywire-aircraft-a320-neo/html_ui/JS/simbridge-client']),
        ]),
    ], true),

    new TaskOfTasks('dist', [
        new ExecTask('metadata', 'node scripts/metadata.js flybywire-aircraft-a320-neo a32nx'),
        new ExecTask('manifests', 'node scripts/build.js'),
    ]),
]);
