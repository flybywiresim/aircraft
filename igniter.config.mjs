import { ExecTask, TaskOfTasks } from "@flybywiresim/igniter";
import { getInstrumentsIgniterTasks } from "./fbw-a32nx/src/systems/instruments/buildSrc/igniter/tasks.mjs";

export default new TaskOfTasks("all", [
    // A32NX Task
    new TaskOfTasks("a32nx", [
        // Prepare the out folder and any other pre tasks.
        // Currently, these can be run in parallel but in the future, we may need to run them in sequence if there are any dependencies.
        new TaskOfTasks("preparation", [
            new ExecTask("copy-base-files", "npm run build-a32nx:copy-base-files"),
            new TaskOfTasks("localization", [
                new ExecTask("efb-translation", "npm run build-a32nx:efb-translation"),
                new ExecTask("locPak-translation", "npm run build-a32nx:locPak-translation")
            ], true),
        ], false),

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

            new TaskOfTasks('atsu', [
                new ExecTask(
                    'common',
                    'npm run build-a32nx:atsu-common',
                    [
                        'fbw-a32nx/src/systems/atsu/common',
                        'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/fbw-a32nx/atsu/common.js'
                    ]
                ),
                new ExecTask(
                    'fmsclient',
                    'npm run build-a32nx:atsu-fms-client',
                    [
                        'fbw-a32nx/src/systems/atsu/common',
                        'fbw-a32nx/src/systems/atsu/fmsclient',
                        'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/fbw-a32nx/atsu/fmsclient.js'
                    ]
                ),
            ]),
            new ExecTask(
                'extras-host',
                'npm run build-a32nx:extras-host',
                [
                    'fbw-a32nx/src/systems/extras-host',
                    'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/ExtrasHost'
                ]
            ),
            new ExecTask("fmgc",
                "npm run build-a32nx:fmgc",
                [
                    "fbw-a32nx/src/systems/fmgc",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/fbw-a32nx/fmgc"
                ]),
            new ExecTask("sentry-client",
                "npm run build-a32nx:sentry-client",
                [
                    "fbw-a32nx/src/systems/sentry-client",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/fbw-a32nx/sentry-client"
                ]),
            new ExecTask("simbridge-client",
                "npm run build-a32nx:simbridge-client",
                [
                    "fbw-a32nx/src/systems/simbridge-client",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/fbw-a32nx/simbridge-client"
                ]),
            new ExecTask(
                'systems-host',
                'npm run build-a32nx:systems-host',
                [
                    'fbw-a32nx/src/systems/systems-host',
                    'fbw-common/src/systems/datalink',
                    'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/SystemsHost'
                ]
            ),
            new ExecTask("tcas",
                "npm run build-a32nx:tcas",
                [
                    "fbw-a32nx/src/systems/tcas",
                    "fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/JS/fbw-a32nx/tcas"
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
            new ExecTask("systems-terronnd", [
                "fbw-common/src/wasm/terronnd/build.sh",
                "wasm-opt -O1 --signext-lowering -o fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/terronnd.wasm fbw-common/src/wasm/terronnd/out/terronnd.wasm"
            ], [
                "fbw-common/src/wasm/terronnd",
                "fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/terronnd.wasm",
                "fbw-common/src/wasm/terronnd/out/terronnd.wasm",
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
            new ExecTask("systems-terronnd", [
                "fbw-common/src/wasm/terronnd/build.sh",
                "wasm-opt -O1 --signext-lowering -o fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/terronnd.wasm fbw-common/src/wasm/terronnd/out/terronnd.wasm"
            ], [
                "fbw-common/src/wasm/terronnd",
                "fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/terronnd.wasm",
                "fbw-common/src/wasm/terronnd/out/terronnd.wasm",
            ]),
            new ExecTask("flypad-backend",
                "npm run build-a380x:flypad-backend",
                [
                    "fbw-a380x/src/wasm/flypad-backend",
                    "fbw-common/src/wasm/fbw_common",
                    "fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/flypad-backend.wasm"
                ])
        ], true)
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
