import { ExecTask, TaskOfTasks } from "@flybywiresim/igniter";
import { getInstrumentsIgniterTasks } from "./fbw-a32nx/src/systems/instruments/buildSrc/igniter/tasks.mjs";

export default new TaskOfTasks("all", [
    // A32NX Task
    new TaskOfTasks("a32nx", [
        // Prepare the out folder and any other pre tasks.
        // Currently, these can be run in parallel but in the future, we may need to run them in sequence if there are any dependencies.
        new TaskOfTasks("preparation", [
            new ExecTask("copy-base-files", "npm run build-a32nx:copy-base-files"),
            new ExecTask("efb-translation", "npm run build-a32nx:efb-translation")
        ], true),

        // Group all typescript and react build tasks together.
        new TaskOfTasks("build", [
            new ExecTask("model",
                "npm run build-a32nx:model",
                [
                    "fbw-a32nx/src/model",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/model"
                ]),
            new ExecTask("behavior",
                "npm run build-a32nx:behavior",
                [
                    "fbw-a32nx/src/behavior",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/ModelBehaviorDefs/A32NX/generated"
                ]),

            new ExecTask("atsu",
                "npm run build-a32nx:atsu",
                [
                    "fbw-a32nx/src/systems/atsu",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/atsu"
                ]),
            new ExecTask("failures",
                "npm run build-a32nx:failures",
                [
                    "fbw-a32nx/src/systems/failures",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/failures/failures.js"
                ]),
            new ExecTask("fmgc",
                "npm run build-a32nx:fmgc",
                [
                    "fbw-a32nx/src/systems/fmgc",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/fmgc"
                ]),
            new ExecTask("sentry-client",
                "npm run build-a32nx:sentry-client",
                [
                    "fbw-a32nx/src/systems/sentry-client",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/sentry-client"
                ]),
            new ExecTask("simbridge-client",
                "npm run build-a32nx:simbridge-client",
                [
                    "fbw-a32nx/src/systems/simbridge-client",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/simbridge-client"
                ]),
            new ExecTask("tcas",
                "npm run build-a32nx:tcas",
                [
                    "fbw-a32nx/src/systems/tcas",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/tcas"
                ]),

            new TaskOfTasks("instruments", getInstrumentsIgniterTasks(), true),
        ], true),

        // Group all WASM build tasks together but separate from the rest of the tasks as build run more stable like this.
        new TaskOfTasks("wasm", [
            new ExecTask("systems",
                "npm run build-a32nx:systems",
                [
                    "fbw-a32nx/src/wasm/systems",
                    "fbw-common/src/wasm/systems",
                    "Cargo.lock",
                    "Cargo.toml",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/systems.wasm"
                ]),
            new ExecTask("systems-fadec",
                "npm run build-a32nx:fadec",
                [
                    "fbw-a32nx/src/wasm/fadec_a320",
                    "fbw-common/src/wasm/fbw_common",
                    "fbw-common/src/wasm/fadec_common",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fadec.wasm"
                ]),
            new ExecTask("systems-fbw",
                "npm run build-a32nx:fbw",
                [
                    "fbw-a32nx/src/wasm/fbw_a320",
                    "fbw-common/src/wasm/fbw_common",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fbw.wasm"
                ]),
            new ExecTask("flypad-backend",
                "npm run build-a32nx:flypad-backend",
                [
                    "fbw-a32nx/src/wasm/flypad-backend",
                    "fbw-common/src/wasm/fbw_common",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/flypad-backend.wasm"
                ])
        ], true),

        // Create final package meta files.
        new TaskOfTasks("dist", [
            new ExecTask("metadata", "npm run build-a32nx:metadata"),
            new ExecTask("manifests", "npm run build-a32nx:manifest")
        ])
    ]),

<<<<<<< HEAD
    // A380X Tasks
    new TaskOfTasks("a380x", [

        new TaskOfTasks("preparation", [
            new ExecTask("copy-base-files", [
                "npm run build-a380x:copy-base-files"
            ])
        ], true),

        new TaskOfTasks("wasm", [
            new ExecTask("systems",
                "npm run build-a380x:systems",
                [
                    "fbw-a380x/src/wasm/systems",
                    "fbw-common/src/wasm/systems",
                    "Cargo.lock",
                    "Cargo.toml",
                    "fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/systems.wasm"
                ]),
            new ExecTask("systems-fadec",
                "npm run build-a380x:fadec",
                [
                    "fbw-a380x/src/wasm/fadec_a380",
                    "fbw-common/src/wasm/fbw_common",
                    "fbw-common/src/wasm/fadec_common",
                    "fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/fadec.wasm"
                ]),
            new ExecTask("systems-fbw",
                "npm run build-a380x:fbw",
                [
                    "fbw-a380x/src/wasm/fbw_a380",
                    "fbw-common/src/wasm/fbw_common",
                    "fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/fbw.wasm"
                ]),
            new ExecTask("flypad-backend",
                "npm run build-a380x:flypad-backend",
                [
                    "fbw-a380x/src/wasm/flypad-backend",
                    "fbw-common/src/wasm/fbw_common",
                    "fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/flypad-backend.wasm"
                ])
        ], true)
=======
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
        new ExecTask('systems-terronnd', [
            'src/terronnd/build.sh',
            'wasm-opt -O1 -o flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/terronnd.wasm flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/terronnd.wasm'
        ], ['src/terronnd', 'flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/terronnd.wasm']),
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
                )
            ],
            true),
        new ExecTask('atsu','npm run build:atsu', ['src/atsu', 'flybywire-aircraft-a320-neo/html_ui/JS/atsu']),
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
>>>>>>> af04281c1... build the wasm module
    ]),

    // InGamePanels Checklist Fix Tasks
    new TaskOfTasks("ingamepanels-checklist-fix", [
        // Prepare the out folder and any other pre tasks.
        // Currently, these can be run in parallel but in the future, we may need to run them in sequence if there are any dependencies.
        new TaskOfTasks("preparation", [
            new ExecTask("copy-base-files", "npm run build-ingamepanels-checklist-fix:copy-base-files")
        ], true),
        new TaskOfTasks("dist", [
            new ExecTask("manifests", "npm run build-ingamepanels-checklist-fix:manifest")
        ])
    ])
]);
