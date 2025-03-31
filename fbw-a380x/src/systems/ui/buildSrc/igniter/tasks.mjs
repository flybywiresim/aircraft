// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import fs from 'fs';
import path, { join } from 'path';
import { ExecTask } from '@flybywiresim/igniter';
import { Directories } from '../directories.mjs';

export function getUiIgniterTasks() {
    const baseInstruments = fs
        .readdirSync(join(Directories.ui, 'src'), { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(join(Directories.ui, 'src', d.name, 'config.json')));

    return baseInstruments.map(({ name }) => {
        const uiPath = join(Directories.ui, 'src', name);
        const config = JSON.parse(fs.readFileSync(join(uiPath, 'config.json')));
        return new ExecTask(name, `cd fbw-a380x && mach build -f ${name}`, [
            join('fbw-a380x/src/systems/ui/src', name),
            'fbw-a380x/src/systems/instruments/src/Common',
            join('fbw-a380x/out/flybywire-aircraft-a380-842/html_ui/Pages/VCockpit/UI/A380X', name),
            ...(config.extraDeps || []).map((p) =>
                path.isAbsolute(p)
                    ? path.relative('/', p)
                    : path.relative(Directories.root, path.resolve(join(uiPath, p))),
            ),
        ]);
    });
}
