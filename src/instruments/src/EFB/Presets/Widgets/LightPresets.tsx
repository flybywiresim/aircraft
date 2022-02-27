// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

function handleClick(number: number) {
    console.log(`Set Preset ${number}`);
}

export const LightPresets = () => (
    <div className="w-full">
        <div className="flex flex-row items-end space-x-4">
            <h1 className="font-bold">Light Presets</h1>
        </div>
        <div className="p-4 mt-4 rounded-lg border-2 border-theme-accent">
            <div className="flex flex-row space-x-6 h-content-section-reduced">
                <div className="flex flex-col flex-shrink-0 justify-between w-1/2">
                    <ScrollableContainer height={52}>
                        <div className="space-y-4">
                            <div
                                className="flex justify-center items-center w-full h-12 text-theme-text hover:text-theme-body bg-theme-accent hover:bg-theme-highlight rounded-md border-2 border-theme-accent transition duration-100"
                                onClick={() => handleClick(1)}
                            >
                                Preset 1
                            </div>
                        </div>
                    </ScrollableContainer>
                </div>
            </div>
        </div>
    </div>
);
