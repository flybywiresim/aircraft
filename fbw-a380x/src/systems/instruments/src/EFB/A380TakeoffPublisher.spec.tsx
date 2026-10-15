// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { A380TakeoffPublisher } from './A380TakeoffPublisher';

const mockState = vi.hoisted(() => ({ takeoff: {} as Record<string, unknown> }));
vi.mock('@flybywiresim/flypad', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({ performance: { takeoff: mockState.takeoff } }),
}));

describe('A380TakeoffPublisher', () => {
  const host = document.createElement('div');

  afterEach(() => {
    act(() => {
      ReactDOM.unmountComponentAtNode(host);
    });
    mockState.takeoff = {};
    vi.clearAllMocks();
  });

  it('keeps a completed calculation available after a temporary result reset', async () => {
    mockState.takeoff = {
      icao: 'KJFK',
      availableRunways: [{ ident: '04L' }],
      selectedRunwayIndex: 0,
      weight: 500_000,
      result: {
        v1: 145,
        vR: 155,
        v2: 165,
        stabTrim: -1,
        inputs: { conf: 2, packs: true, antiIce: 0 },
      },
    };
    act(() => {
      ReactDOM.render(<A380TakeoffPublisher />, host);
    });

    await vi.waitFor(() => expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_VALID', 'number')).toBeGreaterThan(0));
    const valid = SimVar.GetSimVarValue('L:A380X_EFB_TO_VALID', 'number');
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_TRIM', 'number')).toBe(-1);
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_TRIM_VALID', 'number')).toBe(1);

    mockState.takeoff = { ...mockState.takeoff, result: undefined };
    act(() => {
      ReactDOM.render(<A380TakeoffPublisher />, host);
    });
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_VALID', 'number')).toBe(valid);
  });
});
