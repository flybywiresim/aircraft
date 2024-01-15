// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useState } from 'react';
import { PencilSquare } from 'react-bootstrap-icons';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { t } from '../../translation';
import { DetentConfig, DummyDetentConfig } from './DetentConfig';
import { ThrottleSimvar } from './ThrottleSimVar';

interface BaseThrottleConfigProps {
    className?: string;
    axisNumber: number;
    numberOfThrottles: number;
    numberOfAxis: number;
    throttleSimvarsSet1?: ThrottleSimvar[];
    throttleSimvarsSet2?: ThrottleSimvar[];
    throttleSimvarsSet3?: ThrottleSimvar[];
    throttleSimvarsSet4?: ThrottleSimvar[];
    activeDetent: number;
    reverseDisabled?: boolean;
}

/**
 * BaseThrottleConfig is the base component for the throttle configuration of one axis.
 * Axis is used for available hardware axis on the throttle controller.
 * Throttles are used for the number of throttles that are used in the aircraft.
 * @param className
 * @param axisNumber            number of the current axis
 * @param numberOfAxis          number of axis that are mapped
 * @param numberOfThrottles     number of throttles that are mapped
 * @param throttleSimvarsSet1   array of throttle simvars to map the axis values to
 * @param throttleSimvarsSet2   array of throttle simvars to map the axis values to
 * @param throttleSimvarsSet3   array of throttle simvars to map the axis values to
 * @param throttleSimvarsSet4   array of throttle simvars to map the axis values to
 * @param activeDetent          currently active detent
 * @param reverseDisabled       boolean to disable reverse detent for the axis
 * @constructor
 */
export const BaseThrottleConfig: FC<BaseThrottleConfigProps> = ({
    className,
    axisNumber,
    numberOfAxis,
    numberOfThrottles,
    throttleSimvarsSet1,
    throttleSimvarsSet2,
    throttleSimvarsSet3,
    throttleSimvarsSet4,
    activeDetent,
    reverseDisabled,
}) => {
    const [throttlePosition] = useSimVar(`L:A32NX_THROTTLE_MAPPING_INPUT:${axisNumber}`, 'number', 30);
    const [expertMode, setExpertMode] = useState(false);

    let throttleNumberString = '';
    let upperBoundDetentSetter: any[];
    let lowerBoundDetentSetter: any[];
    let lowerBoundDetentGetter: any;
    let upperBoundDetentGetter: any;

    // Here we configure from which axis the detent data is coming from and to which throttle(s) it should be mapped.
    // There are 5 cases:
    // 1. A320 with 1 axis and 2 throttles
    // 2. A320 with 2 axis and 2 throttles
    // 3. A380 with 1 axis and 4 throttles
    // 4. A380 with 2 axis and 4 throttles
    // 5. A380 with 4 axis and 4 throttles

    // A320 Case
    if (numberOfThrottles === 2) {
        // case when only one hardware axis is mapped
        if (numberOfAxis === 1) {
            throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [{ axis: '1' }, { throttles: '1 + 2' }]);
            // all four throttles are mapped from one axis
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
        // case when two axis are mapped to throttle 1 and 2
        else if (numberOfAxis === 2) {
            throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [{ axis: axisNumber.toString() }, { throttles: axisNumber.toString() }]);
            // throttle 1-2 is mapped from axis 1-2
            upperBoundDetentSetter = [
                throttleSimvarsSet1[activeDetent].getHiSetter(),
            ];
            lowerBoundDetentSetter = [
                throttleSimvarsSet1[activeDetent].getLowSetter(),
            ];
            lowerBoundDetentGetter = throttleSimvarsSet1[activeDetent].getLowGetter();
            upperBoundDetentGetter = throttleSimvarsSet1[activeDetent].getHiGetter();
        } else {
            throw new Error(`Invalid number of axis: ${numberOfAxis}`);
        }
        // eslint-disable-next-line brace-style
    }
    // A380 Case
    else if (numberOfThrottles === 4) {
        // case when only one hardware axis is mapped
        if (numberOfAxis === 1) {
            throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [{ axis: '1' }, { throttles: '1 + 2 + 3 + 4' }]);
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
        // case when two axis are mapped to throttle 1 and 2
        else if (numberOfAxis === 2 && !throttleSimvarsSet3 && !throttleSimvarsSet4) {
            throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [{ axis: '1' }, { throttles: '1 + 2' }]);
            // throttle 1 and 2 are mapped from axis 1
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
        // case when two axis are mapped to throttle 3 and 4
        else if (numberOfAxis === 2 && throttleSimvarsSet3 && throttleSimvarsSet4) {
            throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [{ axis: '2' }, { throttles: '3 + 4' }]);
            // throttle 3 and 4 are mapped from axis 2
            upperBoundDetentSetter = [
                throttleSimvarsSet3[activeDetent].getHiSetter(),
                throttleSimvarsSet4[activeDetent].getHiSetter(),
            ];
            lowerBoundDetentSetter = [
                throttleSimvarsSet3[activeDetent].getLowSetter(),
                throttleSimvarsSet4[activeDetent].getLowSetter(),
            ];
            // take the getter from throttle 3 to display the current detent values
            lowerBoundDetentGetter = throttleSimvarsSet3[activeDetent].getLowGetter();
            upperBoundDetentGetter = throttleSimvarsSet3[activeDetent].getHiGetter();
            // eslint-disable-next-line brace-style
        }
        // case when four axis are mapped to four throttles
        else if (numberOfAxis === 4) {
            throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [{ axis: axisNumber.toString() }, { throttles: axisNumber.toString() }]);
            // throttle 1-4 is mapped from axis 1-4
            upperBoundDetentSetter = [
                throttleSimvarsSet1[activeDetent].getHiSetter(),
            ];
            lowerBoundDetentSetter = [
                throttleSimvarsSet1[activeDetent].getLowSetter(),
            ];
            lowerBoundDetentGetter = throttleSimvarsSet1[activeDetent].getLowGetter();
            upperBoundDetentGetter = throttleSimvarsSet1[activeDetent].getHiGetter();
        } else {
            throw new Error(`Invalid number of axis: ${numberOfAxis}`);
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
            {numberOfAxis === 4 ? (
                <h2 className="mb-2 text-center">
                    {throttleNumberString}
                </h2>
            ) : (
                <h1 className="mb-2 text-center">
                    {throttleNumberString}
                </h1>
            )}
            <div className="mt-4 flex flex-col items-center justify-center px-2 pt-5">
                <div className="flex w-60 flex-row items-center justify-center space-x-2">
                    <p>
                        {t('Settings.ThrottleConfig.CurrentValue')}
                        :
                        {' '}
                        {throttlePosition.toFixed(2)}
                    </p>
                    {!reverseDisabled || activeDetent >= 2 ? (
                        <PencilSquare className="text-theme-highlight" onMouseDown={() => setExpertMode(!expertMode)} stroke="1.5" />
                    ) : null}
                </div>
                <div className="flex flex-row">
                    <div className="flex flex-col items-center justify-between">
                        {(!reverseDisabled) || (activeDetent >= 2) ? currentDetent : dummyDetent}
                    </div>
                </div>
            </div>
        </div>
    );
};
