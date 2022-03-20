// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

export const AircraftPresets = () => {
    // Aircraft presets are handled by a backend WASM module. This frontend will
    // use the LVAR A32NX_LOAD_AIRCRAFT_PRESET to signal the backend that the user
    // requests a preset to be loaded.
    // The backend will reset the LVAR to 0 when done.
    // As long as the LVAR is 1 the backend is still applying the preset.
    // The progress while loading an aircraft preset can be read from
    // the LVAR A32NX_LOAD_AIRCRAFT_PRESET_PROGRESS.
    // If the LVAR is set to 0 before the backend is finished applying the preset
    // will be stopped by the backend.

    const [simOnGround] = useSimVar('SIM ON GROUND', 'number', 200);
    const [loadPresetVar, setLoadPresetVar] = useSimVar('L:A32NX_LOAD_AIRCRAFT_PRESET', 'number', 200);
    const [loadPresetProgress] = useSimVar('L:A32NX_LOAD_AIRCRAFT_PRESET_PROGRESS', 'number', 100);

    // Sets the LVAR to tell the wasm to load the preset into the aircraft
    function handleLoadPreset(presetID: number) {
        setLoadPresetVar(presetID);
    }

    // Called by the cancel button to stop and cancel loading of a preset
    function handleCancel() {
        setLoadPresetVar(0);
    }

    const AIRCRAFT_PRESETS: { index: number, name: string }[] = [
        { index: 1, name: 'Cold & Dark' },
        { index: 2, name: 'Turnaround' },
        { index: 3, name: 'Ready for Pushback' },
        { index: 4, name: 'Ready for Taxi' },
        { index: 5, name: 'Ready for Takeoff' },
    ];

    return (
        <div className="p-4 mt-4 space-y-4 h-content-section-reduced rounded-lg border-2 border-theme-accent">
            <div className="flex flex-row justify-center items-center p-2 space-x-2 h-14 rounded-md border-2 border-theme-accent">
                {loadPresetVar ? (
                    <>
                        <div className="overflow-hidden w-full h-full bg-theme-accent rounded-md">
                            <div
                                className="h-full bg-theme-highlight"
                                style={{ width: `${loadPresetProgress * 100}%`, transition: 'width 0.1s ease' }}
                            />
                        </div>

                        <div
                            className="flex items-center px-4 h-full text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                            onClick={() => handleCancel()}
                        >
                            Cancel
                        </div>
                    </>
                ) : (
                    <>
                        {simOnGround ? 'Select a Preset to Load'
                            : 'The aircraft must be on the ground to load a preset.'}
                    </>
                )}
            </div>

            <ScrollableContainer innerClassName="space-y-4" height={52}>
                {AIRCRAFT_PRESETS.map(({ index, name }) => (
                    <div
                        className={`flex justify-center items-center h-24 rounded-md border-2 transition duration-100 text-theme-text hover:text-theme-body bg-theme-accent hover:bg-theme-highlight border-theme-accent ${(!simOnGround || (loadPresetVar && loadPresetVar !== index)) && 'opacity-50 pointer-events-none'}`}
                        onClick={() => handleLoadPreset(index)}
                    >
                        {name}
                    </div>
                ))}
            </ScrollableContainer>
        </div>
    );
};
