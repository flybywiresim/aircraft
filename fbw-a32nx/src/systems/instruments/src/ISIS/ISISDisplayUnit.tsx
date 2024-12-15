// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import { useSimVar, useUpdate } from '@flybywiresim/fbw-sdk';
import { PressureIndicator } from 'instruments/src/ISIS/PressureIndicator';

enum DisplayUnitState {
  On,
  Off,
  Selftest,
  Standby,
}

type ISISDisplayUnitProps = {
  indicatedAirspeed: number;
};

export const ISISDisplayUnit: React.FC<ISISDisplayUnitProps> = ({ indicatedAirspeed, children }) => {
  const powerUpTime = 90;
  const [isColdAndDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', 200);

  const [state, setState] = useState(isColdAndDark ? DisplayUnitState.Off : DisplayUnitState.Standby);
  const [timer, setTimer] = useState<number | null>(null);

  const [dcEssLive] = useSimVar('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'bool');
  const [dcHotLive] = useSimVar('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', 'bool');

  // This is set by the Aircraft Presets to facilitate quick startup or shutdown of the aircraft.
  // In the context of ISIS, this means quick startup (skipping self-test)
  const [aircraftPresetQuickMode] = useSimVar('L:A32NX_AIRCRAFT_PRESET_QUICK_MODE', 'Bool', 200);

  const hasElectricity = (indicatedAirspeed > 50 && dcHotLive) || dcEssLive;

  useUpdate((deltaTime) => {
    if (timer !== null) {
      if (timer > 0) {
        // aircraft preset quick mode skips self-test
        if (aircraftPresetQuickMode) {
          setTimer(0);
          return;
        }
        setTimer(timer - deltaTime / 1000);
      } else if (state === DisplayUnitState.Standby) {
        setState(DisplayUnitState.Off);
        setTimer(null);
      } else if (state === DisplayUnitState.Selftest) {
        setState(DisplayUnitState.On);
        setTimer(null);
      }
    }

    // override MSFS menu animations setting for this instrument
    if (!document.documentElement.classList.contains('animationsEnabled')) {
      document.documentElement.classList.add('animationsEnabled');
    }
  });

  useEffect(() => {
    if (state === DisplayUnitState.On && !hasElectricity) {
      setState(DisplayUnitState.Standby);
      setTimer(10);
    } else if (state === DisplayUnitState.Standby && hasElectricity) {
      setState(DisplayUnitState.On);
      setTimer(null);
    } else if (state === DisplayUnitState.Off && hasElectricity) {
      setState(DisplayUnitState.Selftest);
      setTimer(powerUpTime);
    } else if (state === DisplayUnitState.Selftest && !hasElectricity) {
      setState(DisplayUnitState.Off);
      setTimer(null);
    }
  });

  if (state === DisplayUnitState.Selftest) {
    return (
      <>
        <svg
          id="SelfTest"
          style={{ backgroundColor: 'black' }}
          className="SelfTest"
          version="1.1"
          viewBox="0 0 512 512"
        >
          <g id="AttFlag">
            <rect id="AttTest" className="FillYellow" width="110" height="40" x="190" y="174" />
            <text id="AltTestTxt" className="TextBackground" textAnchor="middle" x="245" y="206">
              ATT
            </text>
          </g>
          <g id="SpeedFlag">
            <rect id="SpeedTest" className="FillYellow" width="84" height="40" x="40" y="244" />
            <text id="SpeedTestTxt" className="TextBackground" textAnchor="middle" x="82" y="277">
              SPD
            </text>
          </g>
          <g id="AltFlag">
            <rect id="AltTest" className="FillYellow" width="110" height="40" x="358" y="244" />
            <text id="AltTestTxt" className="TextBackground" textAnchor="middle" x="415" y="277">
              ALT
            </text>
          </g>
          <g id="TimerFlag">
            <rect id="TmrTest" className="FillYellow" width="180" height="40" x="150" y="332" />
            <text id="TmrTestTxt" className="TextBackground FontMedium" x="160" y="365">
              INIT
            </text>
            <text id="TmrTestCountdown" className="TextBackground FontMedium" textAnchor="end" x="325" y="365">
              {Math.max(0, Math.ceil(timer!))}s
            </text>
          </g>
          <PressureIndicator />
        </svg>
      </>
    );
  }

  if (state === DisplayUnitState.Off) {
    return (
      <svg id="Off" style={{ backgroundColor: 'black' }} className="SelfTest" version="1.1" viewBox="0 0 512 512" />
    );
  }

  return <>{children}</>;
};
