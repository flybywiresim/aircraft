// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { A380TakeoffPublisher } from './A380TakeoffPublisher';

const mockStore = vi.hoisted(() => {
  let takeoff: Record<string, unknown> = {};
  const listeners = new Set<() => void>();
  return {
    getState: () => ({ performance: { takeoff } }),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatchTakeoff: (update: Record<string, unknown>) => {
      takeoff = { ...takeoff, ...update };
      listeners.forEach((listener) => listener());
    },
    reset: () => {
      takeoff = {};
      listeners.clear();
    },
  };
});
vi.mock('@flybywiresim/flypad', () => ({ store: mockStore }));

describe('A380TakeoffPublisher', () => {
  const host = document.createElement('div');

  afterEach(() => {
    act(() => {
      ReactDOM.unmountComponentAtNode(host);
    });
    mockStore.reset();
    vi.clearAllMocks();
  });

  it('keeps a completed calculation available after a temporary result reset', async () => {
    mockStore.dispatchTakeoff({
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
    });
    act(() => {
      ReactDOM.render(<A380TakeoffPublisher />, host);
    });

    await vi.waitFor(() => expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_VALID', 'number')).toBeGreaterThan(0));
    const valid = SimVar.GetSimVarValue('L:A380X_EFB_TO_VALID', 'number');
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_TRIM', 'number')).toBe(-1);
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_TRIM_VALID', 'number')).toBe(1);

    act(() => mockStore.dispatchTakeoff({ result: undefined }));
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_VALID', 'number')).toBe(valid);
  });

  it('publishes a completed calculation cleared before React renders again', async () => {
    act(() => {
      ReactDOM.render(<A380TakeoffPublisher />, host);
    });
    act(() => {
      mockStore.dispatchTakeoff({
        icao: 'KJFK',
        availableRunways: [{ ident: '04L' }],
        selectedRunwayIndex: 0,
        weight: 500_000,
        result: {
          v1: 145,
          vR: 155,
          v2: 165,
          inputs: { conf: 2, packs: true, antiIce: 0 },
        },
      });
      mockStore.dispatchTakeoff({ result: undefined });
    });

    await vi.waitFor(() => expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_VALID', 'number')).toBeGreaterThan(0));
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_V1', 'number')).toBe(145);
    expect(SimVar.GetSimVarValue('L:A380X_EFB_TO_STATUS', 'number')).toBe(4);
  });
});
