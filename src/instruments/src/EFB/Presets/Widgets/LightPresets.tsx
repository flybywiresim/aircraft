// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

export const LightPresets = () => {
    const [, setLoadPreset] = useSimVar('L:A32NX_LOAD_LIGHTING_PRESET', 'number', 200);
    const [, setSavePreset] = useSimVar('L:A32NX_SAVE_LIGHTING_PRESET', 'number', 200);

    return (
        <div className="w-full">
            <div className="flex flex-row items-end space-x-4">
                <h1 className="font-bold">Light Presets</h1>
            </div>
            <div className="p-4 mt-4 rounded-lg border-2 border-theme-accent">
                <ScrollableContainer height={52}>
                    <div className="grid grid-cols-2 grid-rows-2 grid-flow-row gap-4">
                        <div
                            className="flex justify-center items-center my-1 mx-1 w-full h-24 text-theme-text hover:text-theme-body bg-theme-accent hover:bg-theme-highlight rounded-md border-2 border-theme-accent transition duration-100"
                            onClick={() => setLoadPreset(1)}
                        >
                            Load Preset 1
                        </div>
                        <div
                            className="flex justify-center items-center my-1 mx-2 w-full h-24 text-white bg-red-500 hover:bg-red-600 rounded-md border-2 border-red-500 hover:border-red-600 transition duration-100"
                            onClick={() => setSavePreset(1)}
                        >
                            Save Preset 1
                        </div>
                        <div
                            className="flex justify-center items-center my-2 mx-1 w-full h-24 text-theme-text hover:text-theme-body bg-theme-accent hover:bg-theme-highlight rounded-md border-2 border-theme-accent transition duration-100"
                            onClick={() => setLoadPreset(2)}
                        >
                            Load Preset 2
                        </div>
                        <div
                            className="flex justify-center items-center my-1 mx-2 w-full h-24 text-white bg-red-500 hover:bg-red-600 rounded-md border-2 border-red-500 hover:border-red-600 transition duration-100"
                            onClick={() => setSavePreset(2)}
                        >
                            Save Preset 2
                        </div>
                        <div
                            className="flex justify-center items-center my-2 mx-1 w-full h-24 text-theme-text hover:text-theme-body bg-theme-accent hover:bg-theme-highlight rounded-md border-2 border-theme-accent transition duration-100"
                            onClick={() => setLoadPreset(3)}
                        >
                            Load Preset 3
                        </div>
                        <div
                            className="flex justify-center items-center my-1 mx-2 w-full h-24 text-white bg-red-500 hover:bg-red-600 rounded-md border-2 border-red-500 hover:border-red-600 transition duration-100"
                            onClick={() => setSavePreset(3)}
                        >
                            Save Preset 3
                        </div>
                    </div>
                </ScrollableContainer>
            </div>
        </div>
    );
};
