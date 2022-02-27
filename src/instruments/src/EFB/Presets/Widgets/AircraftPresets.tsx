// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

export const AircraftPresets = () => (
    <div className="w-full">
        <div className="flex flex-row items-end space-x-4">
            <h1 className="font-bold">Aircraft Presets</h1>
        </div>
        <div className="p-4 mt-4 rounded-lg border-2 border-theme-accent">
            <ScrollableContainer height={52}>
                <div className="grid grid-cols-4 grid-rows-4 grid-flow-row gap-4">
                    Not yet implemented
                </div>
            </ScrollableContainer>
        </div>
    </div>
);
