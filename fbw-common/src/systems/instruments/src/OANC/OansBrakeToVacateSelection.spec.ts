// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import { EventBus, Subject } from '@microsoft/msfs-sdk';
import { AmdbFeature, BtvData, FmsOansData } from '@flybywiresim/fbw-sdk';
import { OansBrakeToVacateSelection } from './OansBrakeToVacateSelection';

/** Runway along the Y axis, threshold at the origin, 3000m long. Airport local coordinates. */
const centerline = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [0, 3000],
    ],
  },
  properties: {},
} as unknown as AmdbFeature;

const threshold = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [0, 0] },
  properties: { brngmag: 0 },
} as unknown as AmdbFeature;

/** Exit leaving the runway centerline to the right, at the given distance from the threshold. */
function exitAt(distanceFromThreshold: number): AmdbFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [0, distanceFromThreshold],
        [50, distanceFromThreshold + 50],
        [100, distanceFromThreshold + 100],
      ],
    },
    properties: {},
  } as unknown as AmdbFeature;
}

async function setup(dryStoppingDistance: number) {
  const bus = new EventBus();
  const btv = new OansBrakeToVacateSelection<number>(
    bus,
    undefined,
    undefined,
    undefined,
    Subject.create({ lat: 0, long: 0 }),
  );

  const selectedExits: (string | null)[] = [];
  const tooShortExits: (string | null)[] = [];
  const sub = bus.getSubscriber<FmsOansData>();
  sub.on('oansSelectedExit').handle((v) => selectedExits.push(v));
  sub.on('ndBtvExitTooShort').handle((v) => tooShortExits.push(v));

  bus.getPublisher<BtvData>().pub('a380x_btv_dry_stopping_distance', dryStoppingDistance);
  await btv.selectRunwayFromOans('YSSY34L', centerline, threshold);

  return { btv, selectedExits, tooShortExits };
}

describe('OansBrakeToVacateSelection', () => {
  it('rejects an exit located before the DRY stop line', async () => {
    // DRY line at 400m (touchdown zone) + 1300m = 1700m from threshold
    const { btv, selectedExits, tooShortExits } = await setup(1300);

    await btv.selectExitFromOans('A5', exitAt(1000));

    expect(btv.btvExit.get()).toBeNull();
    expect(btv.btvExitDistance.get()).toBeNull();
    expect(selectedExits).not.toContain('A5');
    expect(tooShortExits.at(-1)).toBe('A5');
  });

  it('accepts an exit located after the DRY stop line, and clears the TOO SHORT message', async () => {
    const { btv, selectedExits, tooShortExits } = await setup(1300);

    await btv.selectExitFromOans('A5', exitAt(1000));
    await btv.selectExitFromOans('A7', exitAt(2000));

    expect(btv.btvExit.get()).toBe('A7');
    expect(btv.btvExitDistance.get()).toBeCloseTo(1600);
    expect(selectedExits.at(-1)).toBe('A7');
    expect(tooShortExits.at(-1)).toBeNull();
  });

  it('keeps the previous exit when a new exit is rejected', async () => {
    const { btv } = await setup(1300);

    await btv.selectExitFromOans('A7', exitAt(2000));
    await btv.selectExitFromOans('A5', exitAt(1000));

    expect(btv.btvExit.get()).toBe('A7');
  });

  it('does not check the DRY stop line when no DRY stopping distance is available', async () => {
    const { btv, tooShortExits } = await setup(0);

    await btv.selectExitFromOans('A5', exitAt(1000));

    expect(btv.btvExit.get()).toBe('A5');
    expect(tooShortExits.at(-1)).toBeNull();
  });

  it('clears the TOO SHORT message when the selection is cleared', async () => {
    const { btv, tooShortExits } = await setup(1300);

    await btv.selectExitFromOans('A5', exitAt(1000));
    btv.clearSelection();

    expect(tooShortExits.at(-1)).toBeNull();
  });
});
