// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useEffect } from 'react';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

export const LightPresets = () => {
    const efbBrightness = SimVar.GetSimVarValue('L:A32NX_EFB_BRIGHTNESS', 'number');
    const ovhdIntLt = SimVar.GetSimVarValue('LIGHT POTENTIOMETER:86', 'number');
    const mytest = SimVar.GetSimVarValue('L:A32NX_MYTEST', 'number');
    const coffeeCup = SimVar.GetSimVarValue('L:XMLVAR_COCKPIT_COFFEE_L_HIDDEN', 'bool');
    const seatbelt = SimVar.GetSimVarValue('CABIN SEATBELTS ALERT SWITCH', 'bool');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function handleClick(number: number) {
        console.log(`A32NX_EFB_BRIGHTNESS = ${efbBrightness}`);
        SimVar.SetSimVarValue('L:A32NX_EFB_BRIGHTNESS', 'number', 99).then();
        console.log(`A32NX_EFB_BRIGHTNESS = ${efbBrightness}`);

        console.log(`LIGHT POTENTIOMETER:86 = ${ovhdIntLt}`);
        SimVar.SetSimVarValue('LIGHT POTENTIOMETER:86', 'number', 33).then();
        console.log(`LIGHT POTENTIOMETER:86 = ${ovhdIntLt}`);

        console.log(`A32NX_MYTEST = ${mytest}`);
        // @ts-ignore
        SimVar.SetSimVarValue('L:A32NX_MYTEST', 'number', mytest + 1).then();
        console.log(`A32NX_MYTEST = ${mytest}`);

        console.log(`XMLVAR_COCKPIT_COFFEE_L_HIDDEN = ${coffeeCup}`);
        SimVar.SetSimVarValue('L:XMLVAR_COCKPIT_COFFEE_L_HIDDEN', 'bool', !coffeeCup);
        console.log(`XMLVAR_COCKPIT_COFFEE_L_HIDDEN = ${coffeeCup}`);

        console.log(`CABIN SEATBELTS ALERT SWITCH = ${seatbelt}`);
        SimVar.SetSimVarValue('CABIN SEATBELTS ALERT SWITCH', 'bool', !seatbelt).then();
        console.log(`CABIN SEATBELTS ALERT SWITCH = ${seatbelt}`);

        console.log('H:A320_Neo_CDU_1_BTN_CLR');
        SimVar.SetSimVarValue('H:A320_Neo_CDU_1_BTN_CLR', 'number', 0).then();
        console.log('H:A320_Neo_CDU_1_BTN_CLR');

        // SimVar.SetSimVarValue('H:A32NX_EFB_POWER', 'number', 1);
    }

    useEffect(() => {
        console.log(`Effect: A32NX_EFB_BRIGHTNESS = ${efbBrightness}`);
    }, [efbBrightness]);
    useEffect(() => {
        console.log(`Effect: LIGHT POTENTIOMETER:86 = ${ovhdIntLt}`);
    }, [ovhdIntLt]);
    useEffect(() => {
        console.log(`Effect: A32NX_MYTEST = ${mytest}`);
    }, [coffeeCup]);
    useEffect(() => {
        console.log(`Effect: XMLVAR_COCKPIT_COFFEE_L_HIDDEN = ${coffeeCup}`);
    }, [mytest]);
    useEffect(() => {
        console.log(`Effect: CABIN SEATBELTS ALERT SWITCH = ${seatbelt}`);
    }, [seatbelt]);

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
                            efnBrightness =
                            {' '}
                            {efbBrightness}
                            <br />
                            ovhdIntLt=
                            {' '}
                            {ovhdIntLt}
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
                        </ScrollableContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
