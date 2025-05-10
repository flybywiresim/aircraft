import { ExecTask, TaskOfTasks } from '@flybywiresim/igniter';
import {getInstrumentsIgniterTasks as getA320InstrumentsIgniterTasks} from './fbw-a32nx/src/systems/instruments/buildSrc/igniter/tasks.mjs';
import {getInstrumentsIgniterTasks as getA380InstrumentsIgniterTasks} from './fbw-a380x/src/systems/instruments/buildSrc/igniter/tasks.mjs';

export default new TaskOfTasks('all', [
    // A32NX Task
    new TaskOfTasks('a32nx', [
        // Prepare the out folder and any other pre tasks.
        // Currently, these can be run in parallel, but in the future, we may need to run them in sequence if there are any dependencies.
        new TaskOfTasks(
            'preparation',
            [
                new ExecTask('copy-base-files', 'npm run build-a32nx:copy-base-files'),
                new TaskOfTasks(
                    'localization',
                    [
                        new ExecTask('efb-translation', 'npm run build-a32nx:efb-translation'),
                        new ExecTask('locPak-translation', 'npm run build-a32nx:locPak-translation'),
                    ],
                    true,
                ),
            ],
            false,
        ),

        // Group all typescript and react build tasks together.
        new TaskOfTasks(
            'build',
            [
                new ExecTask('model', 'npm run build-a32nx:model', [
                    'fbw-a32nx/src/model',
                    'fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/model',
                ]),
                new ExecTask('behavior', 'npm run build-a32nx:behavior', [
                    'fbw-a32nx/src/behavior',
                    'fbw-a32nx/out/flybywire-aircraft-a320-neo/ModelBehaviorDefs/A32NX/generated',
                ]),
                new ExecTask('extras-host', 'npm run build-a32nx:extras-host', [
                    'fbw-a32nx/src/systems/extras-host',
                    'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/ExtrasHost',
                    'fbw-common/src/systems/shared/src/extras',
                ]),
                new ExecTask('systems-host', 'npm run build-a32nx:systems-host', [
                    'fbw-a32nx/src/systems/systems-host',
                    'fbw-common/src/systems/datalink',
                    'fbw-a32nx/out/flybywire-aircraft-a320-neo/html_ui/Pages/VCockpit/Instruments/A32NX/SystemsHost',
                ]),
                new TaskOfTasks('instruments', getA320InstrumentsIgniterTasks(), true),
            ],
            true,
        ),

        // Group all WASM build tasks together but separate from the rest of the tasks as build run more stable like this.
        new TaskOfTasks(
            'wasm',
            [
                new ExecTask('systems', 'npm run build-a32nx:systems', [
                    'fbw-a32nx/src/wasm/systems',
                    'fbw-common/src/wasm/systems',
                    'Cargo.lock',
                    'Cargo.toml',
                    'fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/systems.wasm',
                ]),
                new ExecTask('systems-fbw', 'npm run build-a32nx:fbw', [
                    'fbw-a32nx/src/wasm/fbw_a320',
                    'fbw-common/src/wasm/fbw_common',
                    'fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fbw.wasm',
                ]),
                new ExecTask(
                    'systems-terronnd',
                    ['npm run build-a32nx:terronnd'],
                    [
                        'fbw-common/src/wasm/terronnd',
                        'fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/terronnd.wasm',
                        'fbw-common/src/wasm/terronnd/out/terronnd.wasm',
                    ],
                ),
                new ExecTask('cpp-wasm-cmake', 'npm run build:cpp-wasm-cmake', [
                    'fbw-common/src/wasm/cpp-msfs-framework',
                    'fbw-common/src/wasm/extra-backend',
                    'fbw-common/src/wasm/fadec_common',
                    'fbw-a32nx/src/wasm/extra-backend-a32nx',
                    'fbw-a32nx/src/wasm/fadec_a32nx',
                    'fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/extra-backend-a32nx.wasm',
                    'fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fadec-a32nx.wasm',
                ]),
            ],
            true,
        ),

        // Create final package meta files.
        new TaskOfTasks('dist', [
            new ExecTask('metadata', 'npm run build-a32nx:metadata'),
            new ExecTask('manifests', 'npm run build-a32nx:manifest'),
        ]),
    ]),

    // A380X Tasks
    new TaskOfTasks('a380x', [
        new TaskOfTasks(
            'preparation',
            [
                new TaskOfTasks(
                    'ci-build',
                    [
                        new ExecTask('copy-base-files (8K)', [
                            'npm run build-a380x:link-base-files',
                            'npm run unchunkLargeFiles',
                            'npm run build-a380x:link-large-files',
                            'npm run build-a380x:link-large-files-texture-8k',
                            // temporary until folder exists
                            'mkdir -p fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/',
                        ]),
                        new ExecTask('copy-base-files (4K)', [
                            'npm run build-a380x:link-base-files',
                            'npm run unchunkLargeFiles',
                            'npm run build-a380x:link-large-files',
                            'npm run build-a380x:link-large-files-texture-4k',
                            // temporary until folder exists
                            'mkdir -p fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/',
                        ]),
                    ],
                    false,
                ),
                new TaskOfTasks(
                    'local-build',
                    [
                        new ExecTask('copy-base-files (8K)', [
                            'npm run build-a380x:copy-base-files',
                            'npm run unchunkLargeFiles',
                            'npm run build-a380x:copy-large-files',
                            'npm run build-a380x:copy-large-files-texture-8k',
                            'npm run chunkLargeFiles',
                            // temporary until folder exists
                            'mkdir -p fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/',
                        ]),
                        new ExecTask('copy-base-files (4K)', [
                            'npm run build-a380x:copy-base-files',
                            'npm run unchunkLargeFiles',
                            'npm run build-a380x:copy-large-files',
                            'npm run build-a380x:copy-large-files-texture-4k',
                            'npm run chunkLargeFiles',
                            // temporary until folder exists
                            'mkdir -p fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/',
                        ]),
                    ],
                    false,
                ),
                new TaskOfTasks(
                    'localization',
                    [new ExecTask('locPak-translation', 'npm run build-a380x:locPak-translation')],
                    true,
                ),
            ],
            false,
        ),

        // Group all typescript and react build tasks together.
        new TaskOfTasks(
            'build',
            [
                new ExecTask('extras-host', 'npm run build-a380x:extras-host', [
                    'fbw-a380x/src/systems/extras-host',
                    'fbw-a380x/out/flybywire-aircraft-a380-842/html_ui/Pages/VCockpit/Instruments/A380X/ExtrasHost',
                    'fbw-common/src/systems/shared/src/extras',
                ]),
                new ExecTask('systems-host', 'npm run build-a380x:systems-host', [
                    'fbw-a380x/src/systems/systems-host',
                    'fbw-a380x/src/systems/shared/src',
                    'fbw-common/src/systems/shared/src',
                    'fbw-a380x/out/flybywire-aircraft-a380-842/html_ui/Pages/VCockpit/Instruments/A380X/SystemsHost',
                ]),
                new TaskOfTasks('instruments', getA380InstrumentsIgniterTasks(), true),
            ],
            true,
        ),

        new TaskOfTasks(
            'wasm',
            [
                new ExecTask('systems', 'npm run build-a380x:systems', [
                    'fbw-common/src/wasm/systems',
                    'Cargo.lock',
                    'Cargo.toml',
                    'fbw-a380x/src/wasm/systems',
                    'fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/systems.wasm',
                ]),
                new ExecTask('systems-fbw', 'npm run build-a380x:fbw', [
                    'fbw-common/src/wasm/fbw_common',
                    'fbw-a380x/src/wasm/fbw_a380',
                    'fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/fbw.wasm',
                ]),
                new ExecTask(
                    'systems-terronnd',
                    ['npm run build-a380x:terronnd'],
                    [
                        'fbw-common/src/wasm/terronnd',
                        'fbw-common/src/wasm/terronnd/out/terronnd.wasm',
                        'fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/terronnd.wasm',
                    ],
                ),
                new ExecTask('cpp-wasm-cmake', 'npm run build:cpp-wasm-cmake', [
                    'fbw-common/src/wasm/cpp-msfs-framework',
                    'fbw-common/src/wasm/extra-backend',
                    'fbw-common/src/wasm/fadec_common',
                    'fbw-a380x/src/wasm/extra-backend-a380x',
                    'fbw-a380x/src/wasm/fadec_a380x',
                    'fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/extra-backend-a380x.wasm',
                    'fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/fadec-a380x.wasm',
                ]),
            ],
            true,
        ),

        // Create final package meta files.
        new TaskOfTasks('dist', [
            new ExecTask('metadata', 'npm run build-a380x:metadata'),
            new ExecTask('manifests', 'npm run build-a380x:manifest'),
        ]),
    ]),

    // Arinc429 LVar Bridge Tasks
    new TaskOfTasks("arinc429-lvar-bridge", [
        // Prepare the out folder and any other pre tasks.
        // Currently, these can be run in parallel, but in the future, we may need to run them in sequence if there are any dependencies.
        new TaskOfTasks("preparation", [
            new ExecTask("copy-base-files", "npm run build-arinc429-lvar-bridge:copy-base-files")
        ]),

        new ExecTask('cpp-wasm-cmake',
            "npm run build:cpp-wasm-cmake",
            [
                'fbw-common/src/wasm/cpp-msfs-framework',
                'fbw-arinc429-lvar-bridge/src/wasm/arinc429-lvar-bridge',
                'fbw-arinc429-lvar-bridge/out/flybywire-arinc429-lvar-bridge/panel/arinc429-lvar-bridge.wasm'
            ]),

        new TaskOfTasks("dist", [
            new ExecTask("manifests", "npm run build-arinc429-lvar-bridge:manifest")
        ])
    ]),

    // InGamePanels Checklist Fix Tasks
    new TaskOfTasks('ingamepanels-checklist-fix', [
        // Prepare the out folder and any other pre tasks.
        // Currently, these can be run in parallel, but in the future, we may need to run them in sequence if there are any dependencies.
        new TaskOfTasks(
            'preparation',
            [new ExecTask('copy-base-files', 'npm run build-ingamepanels-checklist-fix:copy-base-files')],
            true,
        ),
        new TaskOfTasks('dist', [new ExecTask('manifests', 'npm run build-ingamepanels-checklist-fix:manifest')]),
    ]),
]);
