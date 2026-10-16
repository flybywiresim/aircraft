// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import { useEffect } from 'react';
import { store } from '@flybywiresim/flypad';
import { TakeoffPerformanceResult } from '@flybywiresim/fbw-sdk-react';

const prefix = 'L:A380X_EFB_TO_';
let publishQueue: Promise<void> = Promise.resolve();

const encode = (value: string): number =>
  value
    .toUpperCase()
    .split('')
    .reduce((code, character) => code * 36 + parseInt(character, 36), 0);

/** Publishes the same result that the EFB calculator displays. */
export function publishA380Takeoff(result: TakeoffPerformanceResult, airport?: string, runway?: string): Promise<void> {
  const status = !runway ? 1 : !airport ? 2 : !result.v1 || !result.vR || !result.v2 ? 3 : 4;
  const values =
    status === 4
      ? {
          AIRPORT: encode(airport!),
          RUNWAY: encode(runway!.replace(/^RW/i, '').replace(/^0+(?=\d)/, '')),
          WEIGHT: result.inputs.tow,
          V1: result.v1!,
          VR: result.vR!,
          V2: result.v2!,
          FLAPS: result.inputs.conf,
          FLEX: result.flex ?? -1,
          TRIM: result.stabTrim ?? 0,
          TRIM_VALID: result.stabTrim !== undefined ? 1 : 0,
          PACKS: result.inputs.packs ? 1 : 0,
          ANTI_ICE: result.inputs.antiIce,
        }
      : undefined;

  publishQueue = publishQueue
    .then(async () => {
      await SimVar.SetSimVarValue(`${prefix}VALID`, 'number', 0);
      await SimVar.SetSimVarValue(`${prefix}STATUS`, 'number', status);
      if (!values) return;
      for (const [name, value] of Object.entries(values)) {
        await SimVar.SetSimVarValue(`${prefix}${name}`, 'number', value);
      }
      await SimVar.SetSimVarValue(`${prefix}VALID`, 'number', Date.now());
    })
    .catch((error) => {
      console.error('A380X EFB takeoff publish failed', error);
    });
  return publishQueue;
}

/** Replays the current EFB calculation when the FMS requests it. */
export function A380TakeoffRequestResponder(): null {
  useEffect(() => {
    let lastRequest = SimVar.GetSimVarValue(`${prefix}REQUEST`, 'number');
    const timer = window.setInterval(() => {
      const request = SimVar.GetSimVarValue(`${prefix}REQUEST`, 'number');
      if (!Number.isFinite(request) || request <= lastRequest) return;
      lastRequest = request;
      SimVar.SetSimVarValue(`${prefix}RESPONSE`, 'number', request).catch(console.error);
      const { result, icao, availableRunways, selectedRunwayIndex } = store.getState().performance.takeoff;
      if (result) {
        publishA380Takeoff(result, icao, availableRunways[selectedRunwayIndex]?.ident);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}
