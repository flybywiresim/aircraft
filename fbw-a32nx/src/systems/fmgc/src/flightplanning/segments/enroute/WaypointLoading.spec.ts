// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { beforeAll, describe, it, expect } from 'vitest';
import { loadFixes, loadSingleWaypoint } from './WaypointLoading';
import { setupTestDatabase } from '../../test/Database';
import { VhfNavaid } from '@flybywiresim/fbw-sdk';

describe('waypoint loading', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  it('can load waypoint NOSUS', async ({ skip }) => {
    skip();
    const element = await loadSingleWaypoint('NOSUS', 'WCYCYULNOSUS');

    expect(element).not.toBeNull();
    expect(element.ident).toBe('NOSUS');
    expect(element.icaoCode).toBe('CY');
  });

  it('can load ALB (ALBANY) VOR', async ({ skip }) => {
    skip();
    const elements = await loadFixes('ALB');

    expect(elements).toHaveLength(4);

    const albanyVor = elements.find((it) => it.icaoCode === 'K6');

    expect(albanyVor).not.toBeNull();
    expect((albanyVor as VhfNavaid).name).toBe('ALBANY');
  });
});
