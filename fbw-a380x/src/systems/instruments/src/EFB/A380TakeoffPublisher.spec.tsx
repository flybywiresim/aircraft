// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { A380TakeoffRequestResponder, publishA380Takeoff } from './A380TakeoffPublisher';

const mockStore = vi.hoisted(() => ({ takeoff: {} as Record<string, unknown> }));
vi.mock('@flybywiresim/flypad', () => ({
  store: { getState: () => ({ performance: { takeoff: mockStore.takeoff } }) },
}));

const result = {
  v1: 145,
  vR: 155,
  v2: 165,
  flex: 52,
  stabTrim: -1,
  inputs: { tow: 500_000, conf: 2, packs: true, antiIce: 0 },
} as Parameters<typeof publishA380Takeoff>[0];

describe('A380 EFB takeoff bridge', () => {
  const host = document.createElement('div');

  afterEach(() => {
    act(() => {
      ReactDOM.unmountComponentAtNode(host);
    });
    mockStore.takeoff = {};
  });

  it('publishes all FMS request fields and marks the result valid last', async () => {
    await publishA380Takeoff(result, 'KJFK', '04L');

    const read = (name: string) => SimVar.GetSimVarValue(`L:A380X_EFB_TO_${name}`, 'number');
    expect(read('STATUS')).toBe(4);
    expect(read('VALID')).toBeGreaterThan(0);
    expect(read('AIRPORT').toString(36).toUpperCase()).toBe('KJFK');
    expect(read('RUNWAY').toString(36).toUpperCase()).toBe('4L');
    expect(read('V1')).toBe(145);
    expect(read('VR')).toBe(155);
    expect(read('V2')).toBe(165);
    expect(read('FLAPS')).toBe(2);
    expect(read('WEIGHT')).toBe(500_000);
    expect(read('FLEX')).toBe(52);
    expect(read('TRIM')).toBe(-1);
    expect(read('TRIM_VALID')).toBe(1);
    expect(read('PACKS')).toBe(1);
    expect(read('ANTI_ICE')).toBe(0);
    expect(vi.mocked(SimVar.SetSimVarValue).mock.lastCall?.[0]).toBe('L:A380X_EFB_TO_VALID');
  });

  it('reports a missing runway instead of publishing an unusable request', async () => {
    await publishA380Takeoff(result, 'KJFK');
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_STATUS', 'number')).toBe(1);
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_VALID', 'number')).toBe(0);
  });

  it('replays the saved calculation after an FMS request', async () => {
    mockStore.takeoff = {
      result,
      icao: 'KJFK',
      availableRunways: [{ ident: '04L' }],
      selectedRunwayIndex: 0,
    };
    act(() => {
      ReactDOM.render(<A380TakeoffRequestResponder />, host);
    });
    await SimVar.SetSimVarValue('L:A380X_EFB_TO_VALID', 'number', 0);
    const request = SimVar.GetSimVarValue('L:A380X_EFB_TO_REQUEST', 'number');
    await SimVar.SetSimVarValue('L:A380X_EFB_TO_REQUEST', 'number', request + 1);

    await vi.waitFor(() => expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_VALID', 'number')).toBeGreaterThan(0));
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_V1', 'number')).toBe(145);
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_RESPONSE', 'number')).toBe(request + 1);
  });
});
