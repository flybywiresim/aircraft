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
    displayNumber: boolean;
    numberOfAxis: number;
    mappingsAxisOne: ThrottleSimvar[];
    mappingsAxisTwo?: ThrottleSimvar[];
    mappingsAxisThree?: ThrottleSimvar[];
    mappingsAxisFour?: ThrottleSimvar[];
    activeIndex: number;
    reverseDisabled?: boolean;
}

export const BaseThrottleConfig: FC<BaseThrottleConfigProps> = ({
    className,
    throttleNumber,
    displayNumber,
    numberOfAxis,
    mappingsAxisOne,
    mappingsAxisTwo,
    mappingsAxisThree,
    mappingsAxisFour,
    activeIndex,
    reverseDisabled,
}) => {
    const [throttlePosition] = useSimVar(`L:A32NX_THROTTLE_MAPPING_INPUT:${throttleNumber}`, 'number', 30);
    const [expertMode, setExpertMode] = useState(false);

    let upperBoundDetentSetter: any[];
    let lowerBoundDetentSetter: any[];

    // case when only one throttle axis is mapped
    if (numberOfAxis === 1) {
        upperBoundDetentSetter = [
            mappingsAxisOne[activeIndex].getHiSetter(),
            mappingsAxisTwo[activeIndex].getHiSetter(),
            mappingsAxisThree[activeIndex].getHiSetter(),
            mappingsAxisFour[activeIndex].getHiSetter(),
        ];
        lowerBoundDetentSetter = [
            mappingsAxisOne[activeIndex].getLowSetter(),
            mappingsAxisTwo[activeIndex].getLowSetter(),
            mappingsAxisThree[activeIndex].getLowSetter(),
            mappingsAxisFour[activeIndex].getLowSetter(),
        ];
        // eslint-disable-next-line brace-style
    }
    // case when two throttle axis are mapped (axis 1)
    else if (numberOfAxis === 2 && !mappingsAxisThree && !mappingsAxisFour) {
        upperBoundDetentSetter = [
            mappingsAxisOne[activeIndex].getHiSetter(),
            mappingsAxisTwo[activeIndex].getHiSetter(),
        ];
        lowerBoundDetentSetter = [
            mappingsAxisOne[activeIndex].getLowSetter(),
            mappingsAxisTwo[activeIndex].getLowSetter(),
        ];
        // eslint-disable-next-line brace-style
    }
    // case when two throttle axis are mapped (axis 2)
    else if (numberOfAxis === 2 && mappingsAxisThree && mappingsAxisFour) {
        upperBoundDetentSetter = [
            mappingsAxisThree[activeIndex].getHiSetter(),
            mappingsAxisFour[activeIndex].getHiSetter(),
        ];
        lowerBoundDetentSetter = [
            mappingsAxisThree[activeIndex].getLowSetter(),
            mappingsAxisFour[activeIndex].getLowSetter(),
        ];
        // eslint-disable-next-line brace-style
    }
    // case when four throttle axes are mapped
    else if (numberOfAxis === 4) {
        upperBoundDetentSetter = [
            mappingsAxisOne[activeIndex].getHiSetter(),
        ];
        lowerBoundDetentSetter = [
            mappingsAxisOne[activeIndex].getLowSetter(),
        ];
    }

    const currentDetent = (
        <DetentConfig
            key={activeIndex}
            index={activeIndex}
            throttlePosition={throttlePosition}
            upperBoundDetentSetter={upperBoundDetentSetter}
            lowerBoundDetentSetter={lowerBoundDetentSetter}
            lowerBoundDetentGetter={mappingsAxisOne[activeIndex].getLowGetter()}
            upperBoundDetentGetter={mappingsAxisOne[activeIndex].getHiGetter()}
            detentValue={mappingsAxisOne[activeIndex].getLowGetter()}
            throttleNumber={throttleNumber}
            expertMode={expertMode}
        />
    );

    const dummyDetent = (
        <DummyDetentConfig
            key={activeIndex}
            index={activeIndex}
            throttlePosition={throttlePosition}
            upperBoundDetentSetter={upperBoundDetentSetter}
            lowerBoundDetentSetter={lowerBoundDetentSetter}
            lowerBoundDetentGetter={mappingsAxisOne[activeIndex].getLowGetter()}
            upperBoundDetentGetter={mappingsAxisOne[activeIndex].getHiGetter()}
            detentValue={mappingsAxisOne[activeIndex].getLowGetter()}
            throttleNumber={throttleNumber}
            expertMode={expertMode}
        />
    );

    return (
        <div className={className}>
            <h1 className="mb-2 text-center">
                {t('Settings.ThrottleConfig.Axis')}
                {' '}
                {displayNumber ? throttleNumber : ''}
            </h1>
            <div className="mt-4 flex flex-col items-center justify-center px-2 pt-5">
                <div className="flex w-60 flex-row items-center justify-center space-x-2">
                    <p>
                        {t('Settings.ThrottleConfig.CurrentValue')}
                        :
                        {' '}
                        {throttlePosition.toFixed(2)}
                    </p>
                    {!reverseDisabled || activeIndex >= 2 ? (
                        <PencilSquare className="text-theme-highlight" onMouseDown={() => setExpertMode(!expertMode)} stroke="1.5" />
                    ) : null}
                </div>
                <div className="flex flex-row">
                    <div className="flex flex-col items-center justify-between">
                        {(!reverseDisabled) || (activeIndex >= 2) ? currentDetent : dummyDetent}
                    </div>
                </div>
            </div>
        </div>
    );
};
