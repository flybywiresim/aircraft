// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useState } from 'react';
import { AirframeType, Units, useSimVar } from '@flybywiresim/fbw-sdk';
import { isSimbriefDataLoaded } from '@flybywiresim/flypad';
import { A320Fuel } from './A320_251N/A320Fuel';
import { A380Fuel } from './A380_842/A380Fuel';
import { useAppSelector } from '../../../Store/store';

export const Fuel = () => {
  const airframeInfo = useAppSelector((state) => state.config.airframeInfo);
  const [isOnGround] = useSimVar('SIM ON GROUND', 'Bool', 8_059);
  const simbriefUnits = useAppSelector((state) => state.simbrief.data.units);
  const simbriefPlanRamp = useAppSelector((state) => state.simbrief.data.fuels.planRamp);
  const simbriefDataLoaded = isSimbriefDataLoaded();

  const [massUnitForDisplay] = useState(Units.usingMetric ? 'KGS' : 'LBS');
  const [convertUnit] = useState(Units.usingMetric ? 1 : 1 / 0.4535934);

  switch (airframeInfo.variant) {
    case AirframeType.A380_842:
      return (
        <A380Fuel
          simbriefDataLoaded={simbriefDataLoaded}
          simbriefUnits={simbriefUnits}
          simbriefPlanRamp={simbriefPlanRamp}
          massUnitForDisplay={massUnitForDisplay}
          convertUnit={convertUnit}
          isOnGround={isOnGround}
        />
      );
    case AirframeType.A320_251N:
    default:
      return (
        <A320Fuel
          simbriefDataLoaded={simbriefDataLoaded}
          simbriefUnits={simbriefUnits}
          simbriefPlanRamp={simbriefPlanRamp}
          massUnitForDisplay={massUnitForDisplay}
          convertUnit={convertUnit}
          isOnGround={isOnGround}
        />
      );
  }
};
