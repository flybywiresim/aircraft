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
    mappingsAxisOne: ThrottleSimvar[];
    mappingsAxisTwo?: ThrottleSimvar[];
    activeIndex: number;
    reverseDisabled?: boolean;
}

export const BaseThrottleConfig: FC<BaseThrottleConfigProps> = ({
    className,
    throttleNumber,
    displayNumber,
    mappingsAxisOne,
    mappingsAxisTwo,
    activeIndex,
    reverseDisabled,
}) => {
    const [throttlePosition] = useSimVar(`L:A32NX_THROTTLE_MAPPING_INPUT:${throttleNumber}`, 'number', 30);
    const [expertMode, setExpertMode] = useState(false);

    const currentDetent = (
        <DetentConfig
            key={activeIndex}
            index={activeIndex}
            throttlePosition={throttlePosition}
            upperBoundDetentSetter={mappingsAxisTwo
                ? [mappingsAxisOne[activeIndex].getHiSetter(), mappingsAxisTwo[activeIndex].getHiSetter()]
                : [mappingsAxisOne[activeIndex].getHiSetter()]}
            lowerBoundDetentSetter={mappingsAxisTwo
                ? [mappingsAxisOne[activeIndex].getLowSetter(), mappingsAxisTwo[activeIndex].getLowSetter()]
                : [mappingsAxisOne[activeIndex].getLowSetter()]}
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
            upperBoundDetentSetter={mappingsAxisTwo
                ? [mappingsAxisOne[activeIndex].getHiSetter(), mappingsAxisTwo[activeIndex].getHiSetter()]
                : [mappingsAxisOne[activeIndex].getHiSetter()]}
            lowerBoundDetentSetter={mappingsAxisTwo
                ? [mappingsAxisOne[activeIndex].getLowSetter(), mappingsAxisTwo[activeIndex].getLowSetter()]
                : [mappingsAxisOne[activeIndex].getLowSetter()]}
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
