// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BaseFlightPlan } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';

export function dumpFlightPlan(plan: BaseFlightPlan): string {
    const string = plan.allLegs.map((it) => {
        if (it.isDiscontinuity === true) {
            return '---F-PLN-DISCONTINUITY--';
        }

        return ` ${it.annotation}\n${it.ident}`;
    }).join('\n');

    return string;
}
