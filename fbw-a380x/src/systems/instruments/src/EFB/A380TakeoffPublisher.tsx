// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import { useEffect } from 'react';
import { useAppSelector } from '@flybywiresim/flypad';

/** Publishes the last calculation even after the performance page is closed. */
export function A380TakeoffPublisher(): null {
  const { result, availableRunways, selectedRunwayIndex, icao, weight } = useAppSelector(
    (state) => state.performance.takeoff,
  );
  const runway = availableRunways[selectedRunwayIndex];

  useEffect(() => {
    let cancelled = false;
    const publish = async () => {
      const prefix = 'L:A380X_EFB_TO_';
      await SimVar.SetSimVarValue(`${prefix}VALID`, 'number', 0);
      if (cancelled || !result || !runway || !icao || !weight || !result.v1 || !result.vR || !result.v2) return;

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
        TRIM: result.stabTrim ?? -1,
        PACKS: result.inputs.packs ? 1 : 0,
        ANTI_ICE: result.inputs.antiIce,
      };
      for (const [name, value] of Object.entries(values)) {
        if (cancelled) return;
        await SimVar.SetSimVarValue(`${prefix}${name}`, 'number', value);
      }
      if (!cancelled) await SimVar.SetSimVarValue(`${prefix}VALID`, 'number', Date.now());
    };
    publish().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [result, runway, icao, weight]);

  return null;
}
