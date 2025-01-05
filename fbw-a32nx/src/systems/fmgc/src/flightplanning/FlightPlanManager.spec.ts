// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { setupNavigraphDatabase } from '@fmgc/flightplanning/test/Database';
import { FlightPlanManager } from './FlightPlanManager';

describe('FlightPlanManager', () => {
    beforeEach(() => {
        setupNavigraphDatabase();
    });

    it('can create a flight plan', () => {
        const fpm = new FlightPlanManager();

        fpm.create(1);

        expect(fpm.get(1)).not.toBeNull();
    });

    it('can delete a flight plan', () => {
        const fpm = new FlightPlanManager();

        fpm.create(1);
        fpm.delete(1);

        expect(() => fpm.get(1)).toThrow();
    });

    it('can copy a flight plan', async () => {
        const fpm = new FlightPlanManager();

        fpm.create(1);

        const flightPlan = fpm.get(1);

        await flightPlan.setOriginAirport('CYYZ');
        await flightPlan.setOriginRunway('CYYZ06R');

        fpm.copy(1, 2);

        const copied = fpm.get(2);

        expect(copied.originAirport).toEqual(expect.objectContaining({ ident: 'CYYZ' }));
        expect(copied.originRunway).toEqual(expect.objectContaining({ ident: 'CYYZ06R' }));
    });

    it('can swap two flight plans', async () => {
        const fpm = new FlightPlanManager();

        fpm.create(1);

        const flightPlanA = fpm.get(1);

        await flightPlanA.setOriginAirport('CYYZ');
        await flightPlanA.setOriginRunway('CYYZ06R');

        fpm.create(2);

        const flightPlanB = fpm.get(2);

        await flightPlanB.setOriginAirport('LOWI');
        await flightPlanB.setOriginRunway('CYYZ26');

        fpm.swap(1, 2);

        const newA = fpm.get(2);

        expect(newA.originAirport).toEqual(expect.objectContaining({ ident: 'CYYZ' }));
        expect(newA.originRunway).toEqual(expect.objectContaining({ ident: 'CYYZ06R' }));

        const newB = fpm.get(1);

        expect(newB.originAirport).toEqual(expect.objectContaining({ ident: 'LOWI' }));
        expect(newB.originRunway).toEqual(expect.objectContaining({ ident: 'CYYZ26' }));
    });
});
