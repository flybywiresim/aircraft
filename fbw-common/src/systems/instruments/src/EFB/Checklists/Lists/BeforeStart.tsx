// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// https://docs.flybywiresim.com/pilots-corner/a32nx-briefing/a32nx_api/

import { ChecklistDefinition } from '../Checklists';

export const beforeStartChecklist: ChecklistDefinition = {
    name: 'BEFORE START',
    items: [
        {
            item: 'PARKING BRAKE',
            result: '____',
        },
        {
            item: 'T.O SPEEDS & THRUST',
            result: '_____ (BOTH)',
        },
        {
            item: 'WINDOWS',
            result: 'CLOSED (BOTH)',
        },
        {
            item: 'BEACON',
            result: 'ON',
            condition: () => SimVar.GetSimVarValue('LIGHT BEACON', 'Number') === 1,
        },
    ],
};
