// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useRef, useState } from 'react';
import { NXDataStore, useSimVar, useUpdate, getSupplier } from '@flybywiresim/fbw-sdk';

import './common.scss';

type DisplayUnitProps = {
  electricitySimvar: string;
  potentiometerIndex: number;
  normDmc: number;
  failed?: boolean;
};

enum DisplayUnitState {
  On,
  Off,
  Selftest,
  Standby,
  MaintenanceMode,
  EngineeringTest,
}

export const DisplayUnit: React.FC<DisplayUnitProps> = (props) => {
  const [coldDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', 200);
  const [state, setState] = useState(coldDark ? DisplayUnitState.Off : DisplayUnitState.Standby);
  const timer = useRef<number | null>(null);

  const [dmcSwitching] = useSimVar('L:A32NX_EIS_DMC_SWITCHING_KNOB', 'enum', 200);
  const supplyingDmc = getSupplier(props.normDmc, dmcSwitching);
  // TODO: Fix and reenable
  /*
    const [dmcDisplayTestMode] = useSimVar(`L:A32NX_DMC_DISPLAYTEST:${supplyingDmc}`, 'enum');
    useEffect(() => {
        switch (dmcDisplayTestMode) {
        case 1:
            setState(DisplayUnitState.MaintenanceMode);
            break;
        case 2:
            setState(DisplayUnitState.EngineeringTest);
            break;
        default:
            setState(DisplayUnitState.On);
        }
    }, [dmcDisplayTestMode]);
    */

  const [potentiometer] = useSimVar(`LIGHT POTENTIOMETER:${props.potentiometerIndex}`, 'percent over 100', 200);
  const [electricityState] = useSimVar(props.electricitySimvar, 'bool', 200);

  useUpdate((deltaTime) => {
    if (timer.current !== null) {
      if (timer.current > 0) {
        timer.current -= deltaTime / 1000;
      } else if (state === DisplayUnitState.Standby) {
        setState(DisplayUnitState.Off);
        timer.current = null;
      } else if (state === DisplayUnitState.Selftest) {
        setState(DisplayUnitState.On);
        timer.current = null;
      }
    }

    // override MSFS menu animations setting for this instrument
    if (!document.documentElement.classList.contains('animationsEnabled')) {
      document.documentElement.classList.add('animationsEnabled');
    }
  });

  useEffect(() => {
    if (state !== DisplayUnitState.Off && props.failed) {
      setState(DisplayUnitState.Off);
    } else if (state === DisplayUnitState.On && (potentiometer === 0 || electricityState === 0)) {
      setState(DisplayUnitState.Standby);
      timer.current = 10;
    } else if (state === DisplayUnitState.Standby && potentiometer !== 0 && electricityState !== 0) {
      setState(DisplayUnitState.On);
      timer.current = null;
    } else if (state === DisplayUnitState.Off && potentiometer !== 0 && electricityState !== 0 && !props.failed) {
      setState(DisplayUnitState.Selftest);
      timer.current = parseInt(NXDataStore.get('CONFIG_SELF_TEST_TIME', '15'));
    } else if (state === DisplayUnitState.Selftest && (potentiometer === 0 || electricityState === 0)) {
      setState(DisplayUnitState.Off);
      timer.current = null;
    }
  }, [timer.current, state, potentiometer, electricityState]);

  if (state === DisplayUnitState.Selftest) {
    return (
      <>
        <svg className="SelfTest" viewBox="0 0 600 600">
          <rect className="SelfTestBackground" x="0" y="0" width="100%" height="100%" />

          <text className="SelfTestText" x="50%" y="50%">
            SELF TEST IN PROGRESS
          </text>
          <text className="SelfTestText" x="50%" y="56%">
            (MAX 40 SECONDS)
          </text>
        </svg>
      </>
    );
  }
  if (state === DisplayUnitState.MaintenanceMode) {
    return (
      <svg className="MaintenanceMode" viewBox="0 0 600 600">
        <text className="SelfTestText" x="50%" y="50%">
          MAINTENANCE MODE
        </text>
      </svg>
    );
  }
  if (state === DisplayUnitState.EngineeringTest) {
    return (
      <svg className="EngineeringTestMode" viewBox="0 0 600 600">
        <text x={9} y={250}>
          P/N : C19755BA01
        </text>
        <text x={10} y={270}>{`S/N : C197551733${supplyingDmc}`}</text>
        <text x={10} y={344}>
          EIS SW
        </text>
        <text x={10} y={366}>
          P/N : C1975517332
        </text>
        <text textAnchor="end" x="90%" y={250}>
          THALES AVIONICS
        </text>
        <text textAnchor="end" x="98%" y={366}>
          LCDU 725
        </text>
      </svg>
    );
  }
  if (state === DisplayUnitState.Off) {
    return <></>;
  }

  return (
    <>
      <div style={{ display: state === DisplayUnitState.On ? 'block' : 'none' }}>{props.children}</div>
    </>
  );
};
