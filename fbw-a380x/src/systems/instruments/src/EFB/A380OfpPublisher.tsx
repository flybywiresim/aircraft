// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import { useEffect } from 'react';
import { Units } from '@flybywiresim/fbw-sdk-react';
import { useAppSelector } from '@flybywiresim/flypad';

/** Keeps the A380 OFP bridge available independently of the open EFB page. */
export function A380OfpPublisher(): null {
  const { weights, fuels, units } = useAppSelector((state) => state.simbrief.data);

  useEffect(() => {
    let cancelled = false;
    const asKilograms = (value: number): number => (units === 'lbs' ? Units.poundToKilogram(value) : value);
    const zfw = asKilograms(Number.parseFloat(weights.estZeroFuelWeight));
    const tow = asKilograms(Number.parseFloat(weights.estTakeOffWeight));
    if (!Number.isFinite(tow) || tow <= 0) return;

    const values = {
      ZFW: Number.isFinite(zfw) ? zfw : 0,
      TOW: tow,
      PAYLOAD: asKilograms(Number.parseFloat(weights.payload)) || 0,
      PAX: Number.parseInt(weights.passengerCount, 10) || 0,
      BLOCK_FUEL: asKilograms(fuels.planRamp),
      TAKEOFF_FUEL: asKilograms(fuels.planTakeOff),
      TAXI_FUEL: asKilograms(fuels.taxi),
    };
    const publish = async () => {
      await SimVar.SetSimVarValue('L:A380X_EFB_OFP_VALID', 'number', 0);
      for (const [name, value] of Object.entries(values)) {
        if (cancelled) return;
        await SimVar.SetSimVarValue(`L:A380X_EFB_OFP_${name}`, 'number', Number.isFinite(value) ? value : 0);
      }
      if (cancelled) return;
      await SimVar.SetSimVarValue('L:A380X_EFB_OFP_VALID', 'number', Date.now());
    };
    publish().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [weights, fuels, units]);

  return null;
}
