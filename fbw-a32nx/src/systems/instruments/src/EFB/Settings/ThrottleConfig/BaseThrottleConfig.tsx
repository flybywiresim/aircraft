// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useState } from 'react';
import { PencilSquare } from 'react-bootstrap-icons';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { t } from '../../translation';
import DetentConfig from './DetentConfig';
import { ThrottleSimvar } from './ThrottleSimVar';

interface BaseThrottleConfigProps {
    throttleNumber: number;
    displayNumber: boolean;
    mappingsAxisOne: ThrottleSimvar[];
    mappingsAxisTwo?: ThrottleSimvar[];
    activeIndex: number;
}

export const BaseThrottleConfig: FC<BaseThrottleConfigProps> = ({
    throttleNumber,
    displayNumber,
    mappingsAxisOne,
    mappingsAxisTwo,
    activeIndex,
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

    return (
        <div>
            <h1 className="mb-2 text-center">
                {t('Settings.ThrottleConfig.Axis')}
                {' '}
                {displayNumber ? throttleNumber : ''}
            </h1>
            <div className="px-2 pt-5 mt-4">
                <div className="flex flex-row justify-center items-center space-x-2 w-60">
                    <p>
                        {t('Settings.ThrottleConfig.CurrentValue')}
                        :
                        {' '}
                        {throttlePosition.toFixed(2)}
                    </p>
                    <PencilSquare className="text-theme-highlight" onMouseDown={() => setExpertMode(!expertMode)} stroke="1.5" />
                </div>

                <div className="flex flex-row">
                    <div className="flex flex-col justify-between items-center">
                        {currentDetent}
                    </div>
                </div>
            </div>
        </div>
    );
};
