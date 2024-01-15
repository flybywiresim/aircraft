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
    throttleNumber: number;
    numberOfThrottles: number;
    numberOfAxis: number;
    mappingsAxisOne?: ThrottleSimvar[];
    mappingsAxisTwo?: ThrottleSimvar[];
    mappingsAxisThree?: ThrottleSimvar[];
    mappingsAxisFour?: ThrottleSimvar[];
    activeDetent: number;
    reverseDisabled?: boolean;
}

export const BaseThrottleConfig: FC<BaseThrottleConfigProps> = ({
    className,
    numberOfAxis,
    numberOfThrottles,
    throttleNumber,
    mappingsAxisOne,
    mappingsAxisTwo,
    mappingsAxisThree,
    mappingsAxisFour,
    activeDetent,
    reverseDisabled,
}) => {
    const [throttlePosition] = useSimVar(`L:A32NX_THROTTLE_MAPPING_INPUT:${throttleNumber}`, 'number', 30);
    const [expertMode, setExpertMode] = useState(false);

    let throttleNumberString = '';
    let upperBoundDetentSetter: any[];
    let lowerBoundDetentSetter: any[];
    let lowerBoundDetentGetter: any;
    let upperBoundDetentGetter: any;

    // case when only one throttle axis is mapped
    if (numberOfAxis === 1 && numberOfThrottles === 4) {
        throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [{ axis: '1' }, { throttles: '1 + 2 + 3 + 4' }]);
        upperBoundDetentSetter = [
            mappingsAxisOne[activeDetent].getHiSetter(),
            mappingsAxisTwo[activeDetent].getHiSetter(),
            mappingsAxisThree[activeDetent].getHiSetter(),
            mappingsAxisFour[activeDetent].getHiSetter(),
        ];
        lowerBoundDetentSetter = [
            mappingsAxisOne[activeDetent].getLowSetter(),
            mappingsAxisTwo[activeDetent].getLowSetter(),
            mappingsAxisThree[activeDetent].getLowSetter(),
            mappingsAxisFour[activeDetent].getLowSetter(),
        ];
        lowerBoundDetentGetter = mappingsAxisOne[activeDetent].getLowGetter();
        upperBoundDetentGetter = mappingsAxisOne[activeDetent].getHiGetter();
        // eslint-disable-next-line brace-style
    }
    // case when two throttle axis are mapped (axis 1)
    else if (numberOfAxis === 2 && numberOfThrottles === 4 && !mappingsAxisThree && !mappingsAxisFour) {
        throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [{ axis: '1' }, { throttles: '1 + 2' }]);
        upperBoundDetentSetter = [
            mappingsAxisOne[activeDetent].getHiSetter(),
            mappingsAxisTwo[activeDetent].getHiSetter(),
        ];
        lowerBoundDetentSetter = [
            mappingsAxisOne[activeDetent].getLowSetter(),
            mappingsAxisTwo[activeDetent].getLowSetter(),
        ];
        lowerBoundDetentGetter = mappingsAxisOne[activeDetent].getLowGetter();
        upperBoundDetentGetter = mappingsAxisOne[activeDetent].getHiGetter();
        // eslint-disable-next-line brace-style
    }
    // case when two throttle axis are mapped (axis 2)
    else if (numberOfAxis === 2 && numberOfThrottles === 4 && mappingsAxisThree && mappingsAxisFour) {
        throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [{ axis: '2' }, { throttles: '3 + 4' }]);
        upperBoundDetentSetter = [
            mappingsAxisThree[activeDetent].getHiSetter(),
            mappingsAxisFour[activeDetent].getHiSetter(),
        ];
        lowerBoundDetentSetter = [
            mappingsAxisThree[activeDetent].getLowSetter(),
            mappingsAxisFour[activeDetent].getLowSetter(),
        ];
        lowerBoundDetentGetter = mappingsAxisThree[activeDetent].getLowGetter();
        upperBoundDetentGetter = mappingsAxisThree[activeDetent].getHiGetter();
        // eslint-disable-next-line brace-style
    }
    // case when four throttle axes are mapped
    else if (numberOfAxis === 4 && numberOfThrottles === 4) {
        throttleNumberString = t('Settings.ThrottleConfig.AxisDescription', [{ axis: throttleNumber.toString() }, { throttles: throttleNumber.toString() }]);
        upperBoundDetentSetter = [
            mappingsAxisOne[activeDetent].getHiSetter(),
        ];
        lowerBoundDetentSetter = [
            mappingsAxisOne[activeDetent].getLowSetter(),
        ];
        lowerBoundDetentGetter = mappingsAxisOne[activeDetent].getLowGetter();
        upperBoundDetentGetter = mappingsAxisOne[activeDetent].getHiGetter();
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
            throttleNumber={throttleNumber}
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
            throttleNumber={throttleNumber}
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
