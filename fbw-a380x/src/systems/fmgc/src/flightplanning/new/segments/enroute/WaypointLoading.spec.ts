// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import fetch from 'node-fetch';

import { loadFixes, loadSingleWaypoint } from '@fmgc/flightplanning/new/segments/enroute/WaypointLoading';
import { VhfNavaid } from 'msfs-navdata';
import { setupNavigraphDatabase } from '@fmgc/flightplanning/new/test/Database';

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

describe('waypoint loading', () => {
    beforeAll(() => {
        setupNavigraphDatabase();
    });

    it('can load waypoint NOSUS', async () => {
        const element = await loadSingleWaypoint('NOSUS', 'WCYCYULNOSUS');

        expect(element).not.toBeNull();
        expect(element.ident).toEqual('NOSUS');
        expect(element.icaoCode).toEqual('CY');
    });

    it('can load ALB (ALBANY) VOR', async () => {
        const elements = await loadFixes('ALB');

        expect(elements).toHaveLength(4);

        const albanyVor = elements.find((it) => it.icaoCode === 'K6');

        expect(albanyVor).not.toBeNull();
        expect((albanyVor as VhfNavaid).name).toEqual('ALBANY');
    });
});
