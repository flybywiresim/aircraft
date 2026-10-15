// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import { useEffect } from 'react';
import { store } from '@flybywiresim/flypad';

let publishQueue: Promise<void> = Promise.resolve();

/** Publishes the last calculation even after the performance page is closed. */
export function A380TakeoffPublisher(): null {
  useEffect(() => {
    let lastResult = store.getState().performance.takeoff.result;
    const publishResult = () => {
      const { result, availableRunways, selectedRunwayIndex, icao, weight } = store.getState().performance.takeoff;
      if (!result || result === lastResult) return;
      lastResult = result;
      const runway = availableRunways[selectedRunwayIndex];
      // Snapshot the calculation before another Redux dispatch can clear it.
      const publish = async () => {
        const prefix = 'L:A380X_EFB_TO_';
        await SimVar.SetSimVarValue(`${prefix}VALID`, 'number', 0);
        const status = !runway ? 1 : !icao ? 2 : !weight || !result.v1 || !result.vR || !result.v2 ? 3 : 4;
        await SimVar.SetSimVarValue(`${prefix}STATUS`, 'number', status);
        if (status !== 4 || !result || !runway || !icao || !weight || !result.v1 || !result.vR || !result.v2) return;

        const encode = (value: string): number =>
          value
            .toUpperCase()
            .split('')
            .reduce((code, character) => code * 36 + parseInt(character, 36), 0);
        const values = {
          AIRPORT: encode(icao),
          RUNWAY: encode(runway.ident.replace(/^RW/i, '').replace(/^0+(?=\d)/, '')),
          WEIGHT: weight,
          V1: result.v1,
          VR: result.vR,
          V2: result.v2,
          FLAPS: result.inputs.conf,
          FLEX: result.flex ?? -1,
          TRIM: result.stabTrim ?? 0,
          TRIM_VALID: result.stabTrim !== undefined ? 1 : 0,
          PACKS: result.inputs.packs ? 1 : 0,
          ANTI_ICE: result.inputs.antiIce,
        };
        for (const [name, value] of Object.entries(values)) {
          await SimVar.SetSimVarValue(`${prefix}${name}`, 'number', value);
        }
        await SimVar.SetSimVarValue(`${prefix}VALID`, 'number', Date.now());
      };
      publishQueue = publishQueue.then(publish).catch(console.error);
    };
    lastResult = undefined;
    publishResult();
    return store.subscribe(publishResult);
  }, []);

  return null;
}
