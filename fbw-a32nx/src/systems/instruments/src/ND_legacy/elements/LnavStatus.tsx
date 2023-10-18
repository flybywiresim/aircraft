// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useState } from 'react';
import { useCoherentEvent, Layer } from '@flybywiresim/fbw-sdk';

export const LnavStatus: FC = () => {
    const [strings, setStrings] = useState<string[]>([]);

    useCoherentEvent('A32NX_FM_DEBUG_LNAV_STATUS', (message: string) => {
        setStrings(message.split('\n'));
    });

    return (
        <Layer x={50} y={280}>
            {strings.map((line, i) => (
                <text x={0} y={(i * 25)} fill="magenta" fontSize={20}>{line}</text>
            ))}
        </Layer>
    );
};
