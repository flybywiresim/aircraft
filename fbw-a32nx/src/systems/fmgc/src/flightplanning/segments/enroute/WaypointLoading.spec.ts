// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { loadFixes, loadSingleWaypoint } from '@fmgc/flightplanning/segments/enroute/WaypointLoading';
import { VhfNavaid } from '@flybywiresim/fbw-sdk';
import { setupNavigraphDatabase } from '@fmgc/flightplanning/test/Database';

describe('waypoint loading', () => {
    beforeAll(() => {
        setupNavigraphDatabase();
    });

    it('can load waypoint NOSUS', async () => {
        const element = await loadSingleWaypoint('NOSUS', 'WCYCYULNOSUS');

        expect(element).not.toBeNull();
        expect(element.ident).toBe('NOSUS');
        expect(element.icaoCode).toBe('CY');
    });

    it('can load ALB (ALBANY) VOR', async () => {
        const elements = await loadFixes('ALB');

        expect(elements).toHaveLength(4);

        const albanyVor = elements.find((it) => it.icaoCode === 'K6');

        expect(albanyVor).not.toBeNull();
        expect((albanyVor as VhfNavaid).name).toBe('ALBANY');
    });
});
