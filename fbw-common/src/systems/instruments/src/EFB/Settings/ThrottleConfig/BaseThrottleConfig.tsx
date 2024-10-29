// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useState } from 'react';
import { PencilSquare } from 'react-bootstrap-icons';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { t } from '@flybywiresim/flypad';
import { DetentConfig, DummyDetentConfig } from './DetentConfig';
import { ThrottleSimvar } from './ThrottleSimVar';

/**
 * BaseThrottleConfigProps are the props for the BaseThrottleConfig component.
 * @param className             css class pass through
 * @param userAxis              number of the current axis
 * @param inputThrottle         throttle input to be used for this axis (MSFS mapped)
 * @param numberOfAxes          number of axes available per user selection
 * @param numberOfThrottles     number of throttles that are mapped
 * @param throttleSimvarsSet1   array of throttle simvars to map the axis values to
 * @param throttleSimvarsSet2   array of throttle simvars to map the axis values to
 * @param throttleSimvarsSet3   array of throttle simvars to map the axis values to
 * @param throttleSimvarsSet4   array of throttle simvars to map the axis values to
 * @param activeDetent          currently active detent
 * @param reverseDisabled       boolean to disable reverse detent for the axis
 */
interface BaseThrottleConfigProps {
  className?: string;
  userAxis: number;
  inputThrottle: number;
  numberOfUserAxes: number;
  numberOfThrottles: number;
  throttleSimvarsSet1?: ThrottleSimvar[];
  throttleSimvarsSet2?: ThrottleSimvar[];
  throttleSimvarsSet3?: ThrottleSimvar[];
  throttleSimvarsSet4?: ThrottleSimvar[];
  activeDetent: number;
  reverseDisabled?: boolean;
}

/**
 * BaseThrottleConfig is the base component for the throttle configuration of one axis.
 * The term axis is used for available hardware axis on the throttle controller.
 * The term throttle is used for the number of throttles that are used in the aircraft.
 * @see BaseThrottleConfigProps
 * @constructor
 */
export const BaseThrottleConfig: FC<BaseThrottleConfigProps> = ({
  className,
  userAxis,
  inputThrottle,
  numberOfUserAxes,
  numberOfThrottles,
  throttleSimvarsSet1,
  throttleSimvarsSet2,
  throttleSimvarsSet3,
  throttleSimvarsSet4,
  activeDetent,
  reverseDisabled,
}) => {
  const [throttlePosition] = useSimVar(`L:A32NX_THROTTLE_MAPPING_INPUT:${inputThrottle}`, 'number', 30);

  const [expertMode, setExpertMode] = useState(false);

  let throttleNumberString = '';
  let upperBoundDetentSetter: any[];
  let lowerBoundDetentSetter: any[];
  let lowerBoundDetentGetter: any;
  let upperBoundDetentGetter: any;

  // Here we configure from which axis the detent data is coming from and to which throttle(s) it should be mapped.
  // There are 5 cases:
  // 1. A320 with 1 axis and 2 throttles
  // 2. A320 with 2 axes and 2 throttles
  // 3. A380 with 1 axis and 4 throttles
  // 4. A380 with 2 axes and 4 throttles
  // 5. A380 with 4 axes and 4 throttles

  // A320 Case
  if (numberOfThrottles === 2) {
    // case when only one hardware axis is mapped
    if (numberOfUserAxes === 1) {
      throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [
        { axis: userAxis.toString() },
        { throttles: '1 + 2' },
      ]);
      // all two throttles are mapped from one axis
      upperBoundDetentSetter = [
        throttleSimvarsSet1[activeDetent].getHiSetter(),
        throttleSimvarsSet2[activeDetent].getHiSetter(),
      ];
      lowerBoundDetentSetter = [
        throttleSimvarsSet1[activeDetent].getLowSetter(),
        throttleSimvarsSet2[activeDetent].getLowSetter(),
      ];
      lowerBoundDetentGetter = throttleSimvarsSet1[activeDetent].getLowGetter();
      upperBoundDetentGetter = throttleSimvarsSet1[activeDetent].getHiGetter();
      // eslint-disable-next-line brace-style
    }
    // case when two axes are mapped to throttle 1 and 2
    else if (numberOfUserAxes === 2) {
      throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [
        { axis: userAxis.toString() },
        { throttles: userAxis.toString() },
      ]);
      // throttle 1-2 is mapped from axis 1-2
      upperBoundDetentSetter = [throttleSimvarsSet1[activeDetent].getHiSetter()];
      lowerBoundDetentSetter = [throttleSimvarsSet1[activeDetent].getLowSetter()];
      lowerBoundDetentGetter = throttleSimvarsSet1[activeDetent].getLowGetter();
      upperBoundDetentGetter = throttleSimvarsSet1[activeDetent].getHiGetter();
    } else {
      throw new Error(`Invalid number of axis: ${numberOfUserAxes}`);
    }
    // eslint-disable-next-line brace-style
  }
  // A380 Case
  else if (numberOfThrottles === 4) {
    // case when only one hardware axis is mapped
    if (numberOfUserAxes === 1) {
      throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [
        { axis: userAxis.toString() },
        { throttles: '1 + 2 + 3 + 4' },
      ]);
      // all four throttles are mapped from one axis
      upperBoundDetentSetter = [
        throttleSimvarsSet1[activeDetent].getHiSetter(),
        throttleSimvarsSet2[activeDetent].getHiSetter(),
        throttleSimvarsSet3[activeDetent].getHiSetter(),
        throttleSimvarsSet4[activeDetent].getHiSetter(),
      ];
      lowerBoundDetentSetter = [
        throttleSimvarsSet1[activeDetent].getLowSetter(),
        throttleSimvarsSet2[activeDetent].getLowSetter(),
        throttleSimvarsSet3[activeDetent].getLowSetter(),
        throttleSimvarsSet4[activeDetent].getLowSetter(),
      ];
      lowerBoundDetentGetter = throttleSimvarsSet1[activeDetent].getLowGetter();
      upperBoundDetentGetter = throttleSimvarsSet1[activeDetent].getHiGetter();
      // eslint-disable-next-line brace-style
    }
    // case when two axes are mapped and this setting is for axis 1 for throttle 1 and 2
    else if (numberOfUserAxes === 2) {
      const throttlesString = userAxis === 1 ? '1 + 2' : '3 + 4';
      throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [
        { axis: userAxis.toString() },
        { throttles: throttlesString },
      ]);
      // throttle 1 and 2 are mapped from axis 1, 3 and 4 are mapped from axis 2
      upperBoundDetentSetter = [
        throttleSimvarsSet1[activeDetent].getHiSetter(),
        throttleSimvarsSet2[activeDetent].getHiSetter(),
      ];
      lowerBoundDetentSetter = [
        throttleSimvarsSet1[activeDetent].getLowSetter(),
        throttleSimvarsSet2[activeDetent].getLowSetter(),
      ];
      lowerBoundDetentGetter = throttleSimvarsSet1[activeDetent].getLowGetter();
      upperBoundDetentGetter = throttleSimvarsSet1[activeDetent].getHiGetter();
      // eslint-disable-next-line brace-style
    }
    // case when four axes are mapped to four throttles
    else if (numberOfUserAxes === 4) {
      throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [
        { axis: userAxis.toString() },
        { throttles: userAxis.toString() },
      ]);
      // throttle 1-4 is mapped from axis 1-4
      upperBoundDetentSetter = [throttleSimvarsSet1[activeDetent].getHiSetter()];
      lowerBoundDetentSetter = [throttleSimvarsSet1[activeDetent].getLowSetter()];
      lowerBoundDetentGetter = throttleSimvarsSet1[activeDetent].getLowGetter();
      upperBoundDetentGetter = throttleSimvarsSet1[activeDetent].getHiGetter();
    } else {
      throw new Error(`Invalid number of axis: ${numberOfUserAxes}`);
    }
  } else {
    throw new Error(`Invalid number of throttles: ${numberOfThrottles}`);
  }

  const currentDetent = (
    <DetentConfig
      key={activeDetent}
      index={activeDetent}
      throttlePosition={throttlePosition}
      upperBoundDetentSetter={upperBoundDetentSetter}
      lowerBoundDetentSetter={lowerBoundDetentSetter}
      lowerBoundDetentGetter={lowerBoundDetentGetter}
      upperBoundDetentGetter={upperBoundDetentGetter}
      detentValue={lowerBoundDetentGetter}
      expertMode={expertMode}
    />
  );

  // dummy detent is used to only display the current throttle position with no setting options
  const dummyDetent = (
    <DummyDetentConfig
      key={activeDetent}
      index={activeDetent}
      throttlePosition={throttlePosition}
      upperBoundDetentSetter={upperBoundDetentSetter}
      lowerBoundDetentSetter={lowerBoundDetentSetter}
      lowerBoundDetentGetter={lowerBoundDetentGetter}
      upperBoundDetentGetter={upperBoundDetentGetter}
      detentValue={lowerBoundDetentGetter}
      expertMode={expertMode}
    />
  );

  return (
    <div className={className}>
      {numberOfUserAxes === 4 ? (
        <h2 className="mb-2 text-center">{throttleNumberString}</h2>
      ) : (
        <h1 className="mb-2 text-center">{throttleNumberString}</h1>
      )}
      <div className="mt-4 flex flex-col items-center justify-center px-2 pt-5">
        <div className="flex w-60 flex-row items-center justify-center space-x-2">
          <p>
            {t('Settings.ThrottleConfig.CurrentValue')}: {throttlePosition.toFixed(2)}
          </p>
          {!reverseDisabled || activeDetent >= 2 ? (
            <PencilSquare
              className="text-theme-highlight"
              onMouseDown={() => setExpertMode(!expertMode)}
              stroke="1.5"
            />
          ) : null}
        </div>
        <div className="flex flex-row">
          <div className="flex flex-col items-center justify-between">
            {!reverseDisabled || activeDetent >= 2 ? currentDetent : dummyDetent}
          </div>
        </div>
      </div>
    </div>
  );
};
