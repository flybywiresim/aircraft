// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import fetch from 'node-fetch';

import { setupNavigraphDatabase } from '@fmgc/flightplanning/new/test/Database';

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

describe('airway loading', () => {
    beforeAll(() => {
        setupNavigraphDatabase();
    });
});
