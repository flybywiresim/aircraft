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
    // Manage names for presets in EFB only and always map them to the preset IDs used in the
    // WASM implementation.
    const [storedNames, setStoredNames] = usePersistentProperty('LIGHT_PRESET_NAMES', '');
    const [namesMap, setNamesMap] = useState(new Map());

    // called by the SinglePreset Component to get its assigned name
    const getPresetName = (presetID: number) :string => {
        // DEBUG: Remove this
        console.log(`getStoredNames("${presetID}") = ${namesMap.get(presetID)}`);
        return namesMap.get(presetID);
    };

    // Called by the SinglePreset Component to store its preset name after a name change
    const storePresetName = (presetID: number, name: string) => {
        namesMap.set(presetID, name);
        const tmpJson = JSON.stringify(namesMap, replacer);
        // DEBUG: Remove this
        console.log(`setStoredNames("${presetID} = ${name}") ==> ${tmpJson}`);
        setStoredNames(tmpJson);
    };

    // Used by JSON.stringify for converting a Map to a Json string
    function replacer(key, value) {
        if (value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()), // or with spread: value: [...value]
            };
        }
        return value;
    }

    // Used by JSON.parse for converting a Json string to a Map
    function reviver(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (value.dataType === 'Map') {
                return new Map(value.value);
            }
        }
        return value;
    }

    // Called once to initially load the preset names map from the persistent store
    useEffect(() => {
        // DEBUG: Remove this
        console.log(`Current STORE: ${storedNames}`);
        try {
            const newValue = JSON.parse(storedNames, reviver);
            setNamesMap(newValue);
        } catch {
            setNamesMap(new Map());
        }
    }, []);

    return (
        <div className="w-full">
            <div className="flex flex-row items-end space-x-4">
                <h1 className="font-bold">Light Presets</h1>
            </div>
            <div className=" p-4 mt-4 mb-4 rounded-lg border-2 border-theme-accent">
                <ScrollableContainer height={52}>
                    <div className="grid grid-cols-1 grid-rows-5 grid-flow-row gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <SinglePreset presetID={i} getPresetName={getPresetName} storePresetName={storePresetName} namesMap={namesMap} />
                        ))}
                    </div>
                </ScrollableContainer>
            </div>
        </div>
    );
};

// One line of preset with ID, name, load and save
const SinglePreset = (props: { presetID: number, getPresetName: (arg0: number) => string, storePresetName: (arg0: number, arg1: string) => void, namesMap: any }) => {
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

    // Only allow loading and saving when aircraft is powered
    const [isPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'number', 200);

    // Sets the LVAR to tell the wasm to load the preset into the aircraft
    const loadPreset = (presetID: number) => {
        // loading of presets only allowed when aircraft is powered (also the case in the wasm)
        if (isPowered) {
            setLoadPresetVar(presetID);
            toast.success(`Loading Preset: ${presetID}: ${presetName}`, { autoClose: 250, hideProgressBar: true, closeButton: false });
        } else {
            toast.warning('Aircraft needs to be powered to load presets.', { autoClose: 1000, hideProgressBar: true, closeButton: false });
        }
    };

    // Sets the LVAR to tell the wasm to save the current lighting setting into the preset
    const savePreset = (presetID: number) => {
        // Saving of presets only allowed when aircraft is powered (also the case in the wasm)
        if (isPowered) {
            setSavePresetVar(presetID);
            toast.success(`Saving Preset: ${presetID}: ${presetName}`, { autoClose: 250, hideProgressBar: true, closeButton: false });
        } else {
            toast.warning('Aircraft needs to be powered to save presets.', { autoClose: 1000, hideProgressBar: true, closeButton: false });
        }
    };

    // User specified name for the current preset
    const [presetName, setPresetName] = useState('');

    // Sets the preset name locally and stores it into the parent persistent storage
    const changePresetName = (newName: string): void => {
        setPresetName(newName);
        props.storePresetName(props.presetID, newName);
    };

    // Get preset name from persistent store once
    useEffect(() => {
        const tmp: string = props.getPresetName(props.presetID);
        setPresetName(tmp);
    }, [props.namesMap]);

    return (
        <div className="flex flex-row justify-between my-1">
            <div className="flex justify-center items-center w-24">
                {props.presetID}
            </div>
            <div className="flex justify-center items-center mx-4 w-full h-28 rounded-md border-2 text-theme-text bg-theme-accent border-theme-accent">
                <SimpleInput
                    className="w-80 text-2xl font-medium text-center"
                    placeholder="No Name"
                    value={presetName}
                    onBlur={(value) => changePresetName(value)}
                    maxLength={16}
                />
            </div>
            <div
                className="flex justify-center items-center mx-4 w-full h-28 rounded-md border-2 transition duration-100 items-centerh-24 text-theme-text hover:text-theme-body bg-theme-accent hover:bg-theme-highlight border-theme-accent"
                onClick={() => loadPreset(props.presetID)}
            >
                Load Preset
            </div>
            <div
                className="flex justify-center items-center mx-4 w-full h-28 text-white bg-green-700 hover:bg-green-800 rounded-md border-2 border-green-700 hover:border-green-800 transition duration-100"
                onClick={() => savePreset(props.presetID)}
            >
                Save Preset
            </div>
        </div>
    );
};
