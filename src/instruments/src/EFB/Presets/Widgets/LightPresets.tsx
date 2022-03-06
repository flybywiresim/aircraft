// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { toast } from 'react-toastify';
import { usePersistentProperty } from '@instruments/common/persistence';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';

export const LightPresets = () => {
    // Light presets are handled in a wasm module as setting the indexed "LIGHT POTENTIOMETER"
    // variable didn't work in Javascript.
    // To tell the presets.wasm module to load a preset the LVAR "L:A32NX_LOAD_LIGHTING_PRESET"
    // needs to be set with a number > 0 where the number is the corresponding preset ID to be loaded.
    // If a preset is not defined for this number a default preset (all lights at 50%) will be loaded.
    // To tell the presets.wasm module to save a preset the LVAR "L:A32NX_SAVE_LIGHTING_PRESET"
    // needs to be set with a number > 0 where the number is the corresponding preset ID to be saved..
    // After loading or saving the wasm module will reset the LVARs to 0
    const [, setLoadPresetVar] = useSimVar('L:A32NX_LOAD_LIGHTING_PRESET', 'number', 200);
    const [, setSavePresetVar] = useSimVar('L:A32NX_SAVE_LIGHTING_PRESET', 'number', 200);

    // Sets the LVAR to tell the wasm to load the preset into the aircraft
    function loadPreset(presetID: number) {
        setLoadPresetVar(presetID);
        toast.success(`Loading Preset: ${presetID}: ${presetNames.get(presetID)}`,
            { autoClose: 250, hideProgressBar: true, closeButton: false });
    }

    // Sets the LVAR to tell the wasm to save the current lighting setting into the preset
    function savePreset(presetID: number) {
        setSavePresetVar(presetID);
        toast.success(`Saving Preset: ${presetID}: ${presetNames.get(presetID)}`,
            { autoClose: 250, hideProgressBar: true, closeButton: false });
    }

    // Manage name for presets in EFB only and always map them to the preset IDs used in the
    // WASM implementation.
    const [storedNames, setStoredNames] = usePersistentProperty('LIGHT_PRESET_NAMES');
    const [presetNames, setPresetNames] = useState(new Map());

    function updatePresetNames(k: number, v: string) {
        setPresetNames(new Map(presetNames.set(k, v)));
    }

    // Read the persisted preset names once
    // The data is stored as one string in a persistant property.
    // Key Value pairs are separated by :
    // Each pair has the form of key=pair
    useEffect(() => {
        if (storedNames) {
            console.log(`Load preset names: "${storedNames}"`);
            const presetKeyValue = storedNames.split(':');
            presetKeyValue.forEach((pair) => {
                const [keyS, value] = pair.trim().split('=');
                const key = Number.parseInt(keyS, 10);
                if (key && value) {
                    updatePresetNames(key, value);
                }
            });
        }
    }, []);

    // Saves the current map of stored preset names to a persistent property string.
    useEffect(() => {
        let storedNamesTemp = '';
        presetNames.forEach((v, k) => {
            if (v.length > 0) {
                storedNamesTemp += `${k}=${v}:`;
            }
        });
        setStoredNames(storedNamesTemp);
        console.log(`Saved preset names: "${storedNames}"`);
    }, [presetNames]);

    function SinglePreset(presetID: number) {
        return (
            <div className="flex flex-row justify-between my-1">
                <div className="flex justify-center items-center w-24">
                    {presetID}
                </div>
                <div className="flex justify-center items-center mx-4 w-full h-28 rounded-md border-2 text-theme-text bg-theme-accent border-theme-accent">
                    <SimpleInput
                        className="w-80 text-2xl font-medium text-center"
                        placeholder="No Name"
                        value={presetNames.get(presetID) || 'No Name'}
                        onChange={(value) => updatePresetNames(presetID, value)}
                        maxLength={16}
                    />
                </div>
                <div
                    className="flex justify-center items-center mx-4 w-full h-28 rounded-md border-2 transition duration-100 items-centerh-24 text-theme-text hover:text-theme-body bg-theme-accent hover:bg-theme-highlight border-theme-accent"
                    onClick={() => loadPreset(presetID)}
                >
                    Load Preset
                </div>
                <div
                    className="flex justify-center items-center mx-4 w-full h-28 text-white bg-green-500 hover:bg-green-600 rounded-md border-2 border-green-500 hover:border-green-600 transition duration-100"
                    onClick={() => savePreset(presetID)}
                >
                    Save Preset
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex flex-row items-end space-x-4">
                <h1 className="font-bold">Light Presets</h1>
            </div>
            <div className="p-4 mt-4 rounded-lg border-2 border-theme-accent">
                <ScrollableContainer height={52}>
                    <div className="grid grid-cols-1 grid-rows-5 grid-flow-row gap-4">
                        {SinglePreset(1)}
                        {SinglePreset(2)}
                        {SinglePreset(3)}
                        {SinglePreset(4)}
                        {SinglePreset(5)}
                        {SinglePreset(6)}
                    </div>
                </ScrollableContainer>
            </div>
        </div>
    );
};
