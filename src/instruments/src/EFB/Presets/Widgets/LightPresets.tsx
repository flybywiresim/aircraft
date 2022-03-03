// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useEffect } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

export const LightPresets = () => {
    const [testMode, setTestMode] = useSimVar('L:A32NX_TEST_MODE', 'bool', 10);
    const [testWASMVar] = useSimVar('L:A32NX_TEST_VAR', 'number', 10);

    const efbBrightness = SimVar.GetSimVarValue('L:A32NX_EFB_BRIGHTNESS', 'number');

    const potentiometer = SimVar.GetSimVarValue('LIGHT POTENTIOMETER:86', 'number');
    // const [potentiometer, setPotentiometer] = useSimVar('LIGHT POTENTIOMETER:86', 'percent over 100', 200);

    const mytest = SimVar.GetSimVarValue('L:A32NX_MYTEST', 'number');
    const coffeeCup = SimVar.GetSimVarValue('L:XMLVAR_COCKPIT_COFFEE_L_HIDDEN', 'bool');
    const seatbelt = SimVar.GetSimVarValue('CABIN SEATBELTS ALERT SWITCH', 'bool');
    const fd = SimVar.GetSimVarValue('AUTOPILOT FLIGHT DIRECTOR ACTIVE:1', 'bool');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function handleClick(number: number) {
        console.log(`A32NX_EFB_BRIGHTNESS ==> ${efbBrightness}`);
        SimVar.SetSimVarValue('L:A32NX_EFB_BRIGHTNESS', 'number', 99).then();
        console.log(`A32NX_EFB_BRIGHTNESS <== ${efbBrightness} (want 99)`);

        // FSUIPC: 19 86 (>K:2:LIGHT_POTENTIOMETER_SET)
        console.log(`LIGHT POTENTIOMETER:86 ==> ${potentiometer}`);
        // SimVar.SetSimVarValue('LIGHT POTENTIOMETER:86', 'number', 0.33);
        // SimVar.SetSimVarValue('K:LIGHT_POTENTIOMETER_SET', 'percent', 0.33, '86').then();
        // setPotentiometer(33);
        console.log(`LIGHT POTENTIOMETER:86 <== ${potentiometer} (want 0.33)`);

        console.log(`A32NX_MYTEST ==> ${mytest}`);
        SimVar.SetSimVarValue('L:A32NX_MYTEST', 'number', mytest === null ? 0 : mytest + 1).then();
        console.log(`A32NX_MYTEST <== ${mytest} + 1`);

        console.log(`XMLVAR_COCKPIT_COFFEE_L_HIDDEN ==> !${coffeeCup}`);
        SimVar.SetSimVarValue('L:XMLVAR_COCKPIT_COFFEE_L_HIDDEN', 'bool', !coffeeCup).then();
        console.log(`XMLVAR_COCKPIT_COFFEE_L_HIDDEN <== ${coffeeCup}`);

        console.log(`CABIN SEATBELTS ALERT SWITCH ==> ${seatbelt}`);
        SimVar.SetSimVarValue('K:CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE', 'number', 1).then();
        console.log(`CABIN SEATBELTS ALERT SWITCH <== ${seatbelt}`);

        console.log('K:TOGGLE_FLIGHT_DIRECTOR trigger');
        SimVar.SetSimVarValue('H:A320_Neo_CDU_1_BTN_A', 'number', 0).then();
        console.log('K:TOGGLE_FLIGHT_DIRECTOR triggered');

        console.log('H:A320_Neo_CDU_1_BTN_CLR trigger');
        SimVar.SetSimVarValue('K:TOGGLE_FLIGHT_DIRECTOR', 'number', 1);
        console.log('H:A320_Neo_CDU_1_BTN_CLR triggered');

        // SimVar.SetSimVarValue('H:A32NX_EFB_POWER', 'number', 1);
        console.log('Test Mode Toggle');
        setTestMode(!testMode);
    }

    useEffect(() => {
        console.log(`Effect: A32NX_EFB_BRIGHTNESS = ${efbBrightness}`);
    }, [efbBrightness]);
    useEffect(() => {
        console.log(`Effect: LIGHT POTENTIOMETER:86 = ${potentiometer}`);
    }, [potentiometer]);
    useEffect(() => {
        console.log(`Effect: A32NX_MYTEST = ${mytest}`);
    }, [coffeeCup]);
    useEffect(() => {
        console.log(`Effect: XMLVAR_COCKPIT_COFFEE_L_HIDDEN = ${coffeeCup}`);
    }, [mytest]);
    useEffect(() => {
        console.log(`Effect: CABIN SEATBELTS ALERT SWITCH = ${seatbelt}`);
    }, [seatbelt]);
    useEffect(() => {
        console.log(`Effect: AUTOPILOT FLIGHT DIRECTOR ACTIVE:1 = ${fd}`);
    }, [fd]);

    return (
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
                            <br />
                            efbBrightness =
                            {' '}
                            {efbBrightness}
                            <br />
                            potentiometer (86)=
                            {' '}
                            {potentiometer}
                            <br />
                            myTest =
                            {' '}
                            {mytest}
                            <br />
                            coffeeCup =
                            {' '}
                            {coffeeCup}
                            <br />
                            seatbelt =
                            {' '}
                            {seatbelt}
                            <br />
                            fd =
                            {' '}
                            {fd}
                            <br />
                            testMode =
                            {' '}
                            {testMode}
                            <br />
                            testWASMVar =
                            {' '}
                            {testWASMVar}
                        </ScrollableContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
