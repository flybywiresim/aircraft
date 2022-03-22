// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { PromptModal, useModals } from '../../UtilComponents/Modals/Modals';

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
    const [loadPresetCurrentId] = useSimVar('L:A32NX_LOAD_AIRCRAFT_PRESET_CURRENT_ID', 'number', 100);
    const { showModal } = useModals();

    const AIRCRAFT_PRESETS: { index: number, name: string }[] = [
        { index: 1, name: 'Cold & Dark' },
        { index: 2, name: 'Turnaround' },
        { index: 3, name: 'Ready for Pushback' },
        { index: 4, name: 'Ready for Taxi' },
        { index: 5, name: 'Ready for Takeoff' },
    ];

    // Sets the LVAR to tell the wasm to load the preset into the aircraft
    function handleLoadPreset(presetID: number) {
        showModal(
            <PromptModal
                title={`${AIRCRAFT_PRESETS[presetID - 1].name}`}
                bodyText="Please confirm loading of preset."
                onConfirm={() => setLoadPresetVar(presetID)}
            />,
        );
    }

    // Called by the cancel button to stop and cancel loading of a preset
    function handleCancel() {
        setLoadPresetVar(0);
    }

    // These are defined in the presets' wasm C++ code and can be
    // printed to the console by compiling the c++ with --debug
    // The console output can then be easily pasted here and transformed to
    // the correct syntax.
    // WASM: src/presets/src/Aircraft/AircraftProcedures.h
    const stepDescription = new Map([
        [0, ''],
        [1, 'BAT1 On'],
        [2, 'BAT2 On'],
        [3, 'EXT PWR On'],
        [4, 'APU Master On'],
        [5, 'APU Start On'],
        [6, 'AC BUS Avail Check'],
        [7, 'Nav & Logo Lt On'],
        [8, 'ADIRS 1 Nav'],
        [9, 'ADIRS 2 Nav'],
        [10, 'ADIRS 3 Nav'],
        [11, 'GND CTL On'],
        [12, 'Crew Oxy On'],
        [13, 'APU Avail Check'],
        [14, 'APU Bleed On'],
        [15, 'EXT PWR Off'],
        [16, 'FUEL PUMP 2 On'],
        [17, 'FUEL PUMP 5 On'],
        [18, 'FUEL PUMP 1 On'],
        [19, 'FUEL PUMP 4 On'],
        [20, 'FUEL PUMP 3 On'],
        [21, 'FUEL PUMP 6 On'],
        [22, 'Radar PWS On'],
        [23, 'Transponder On'],
        [24, 'ATC ALT RPTG On'],
        [25, 'TCAS TRAFFIC ABV'],
        [26, 'COCKPIT DOOR LCK'],
        [27, 'Strobe Auto'],
        [28, 'Beacon On'],
        [29, 'NO SMOKING On'],
        [30, 'EMER EXT Lt On'],
        [31, 'SEAT BELTS On'],
        [32, 'ADIRS 1 Await Alignment'],
        [33, 'ADIRS 2 Await Alignment'],
        [34, 'ADIRS 3 Await Alignment'],
        [35, 'ENG MODE SEL START'],
        [36, 'ENG 2 ON'],
        [37, 'ENG 2 Avail Check'],
        [38, 'ENG 1 ON'],
        [39, 'ENG 1 Avail Check'],
        [40, 'ENG MODE SEL NORM'],
        [41, 'APU Bleed Off'],
        [42, 'APU Master Off'],
        [43, 'Autobrake Max'],
        [44, 'Spoiler Arm'],
        [45, 'Rudder Trim Reset'],
        [46, 'Flaps 1'],
        [47, 'NOSE Lt Taxi'],
        [48, 'RWY TURN OFF Lt L On'],
        [49, 'RWY TURN OFF Lt R On'],
        [50, 'WX Radar On'],
        [51, 'WX Radar Mode'],
        [52, 'TCAS Switch TA/RA'],
        [53, 'NOSE Lt Takeoff'],
        [54, 'LL Lt L On'],
        [55, 'LL Lt R On'],
        [56, 'LL Lt L Off'],
        [57, 'LL Lt R Off'],
        [58, 'NOSE Lt Takeoff'],
        [59, 'TCAS Switch TA/RA'],
        [60, 'WX Radar Off'],
        [61, 'WX Radar Mode'],
        [62, 'NOSE Lt Taxi'],
        [63, 'RWY TURN OFF Lt L Off'],
        [64, 'RWY TURN OFF Lt R Off'],
        [65, 'Autobrake Off'],
        [66, 'Spoiler Disarm'],
        [67, 'Rudder Trim Reset'],
        [68, 'Flaps 0'],
        [69, 'ENG 1 Off'],
        [70, 'ENG 2 Off'],
        [71, 'ENG 1 N2 <3'],
        [72, 'ENG 2 N1 <3'],
        [73, 'Strobe Off'],
        [74, 'Beacon Off'],
        [75, 'SEAT BELTS Off'],
        [76, 'NO SMOKING Off'],
        [77, 'EMER EXT Lt Off'],
        [78, 'Radar PWS Off'],
        [79, 'Transponder Off'],
        [80, 'ATC ALT RPTG Off'],
        [81, 'TCAS TRAFFIC ABV'],
        [82, 'COCKPIT DOOR OP'],
        [83, 'FUEL PUMP 2 Off'],
        [84, 'FUEL PUMP 5 Off'],
        [85, 'FUEL PUMP 1 Off'],
        [86, 'FUEL PUMP 4 Off'],
        [87, 'FUEL PUMP 3 Off'],
        [88, 'FUEL PUMP 6 Off'],
        [89, 'Crew Oxy Off'],
        [90, 'GND CTL Off'],
        [91, 'ADIRS 3 Off'],
        [92, 'ADIRS 2 Off'],
        [93, 'ADIRS 1 Off'],
        [94, 'Nav & Logo Lt Off'],
        [95, 'APU Bleed Off'],
        [96, 'APU Master Off'],
        [97, 'EXT PWR Off'],
        [98, 'BAT2 Off'],
        [99, 'BAT1 Off'],
        [100, 'AC BUS Off Check'],
    ]);

    return (
        <div className="p-4 mt-4 space-y-4 h-content-section-reduced rounded-lg border-2 border-theme-accent">
            <div className="flex flex-row justify-center items-center p-2 space-x-2 h-20 rounded-md border-2 border-theme-accent">
                {loadPresetVar ? (
                    <>
                        <div className="overflow-hidden justify-center content-center w-full h-full bg-theme-accent rounded-md">
                            <span className="pt-1 pl-3 h-1/2 text-xl">
                                Current Procedure Step:
                                {' '}
                                {stepDescription.get(loadPresetCurrentId)}
                            </span>
                            <div
                                className="h-1/2 bg-theme-highlight"
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
