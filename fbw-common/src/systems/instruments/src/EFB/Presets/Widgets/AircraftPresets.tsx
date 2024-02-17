// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { t } from '../../Localization/translation';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { PromptModal, useModals } from '../../UtilComponents/Modals/Modals';
import { StepDescription } from './Procedures';

export const AircraftPresets = () => {
    // Aircraft presets are handled by a backend WASM module. This frontend will
    // use the LVAR A32NX_AIRCRAFT_PRESET_LOAD to signal the backend that the user
    // requests a preset to be loaded.
    // The backend will reset the LVAR to 0 when done.
    // As long as the LVAR is 1 the backend is still applying the preset.
    // If the LVAR is set to 0 before the backend is finished, applying, the preset
    // will be stopped by the backend.
    // The progress while loading an aircraft preset can be read from
    // the LVAR A32NX_AIRCRAFT_PRESET_LOAD_PROGRESS.
    // The current step ID can be read via A32NX_AIRCRAFT_PRESET_LOAD_CURRENT_ID
    // and then use the StepDescription from './Procedures' to get the string.

    const [simOnGround] = useSimVar('SIM ON GROUND', 'number', 200);
    const [loadPresetVar, setLoadPresetVar] = useSimVar('L:A32NX_AIRCRAFT_PRESET_LOAD', 'number', 200);
    const [loadPresetProgress] = useSimVar('L:A32NX_AIRCRAFT_PRESET_LOAD_PROGRESS', 'number', 100);
    const [loadPresetCurrentId] = useSimVar('L:A32NX_AIRCRAFT_PRESET_LOAD_CURRENT_ID', 'number', 100);
    const { showModal } = useModals();

    // These need to align with the IDs in the Presets C++ WASM.
    // WASM: src/presets/src/Aircraft/AircraftProcedures.h
    const AircraftPresetsList: { index: number, name: string }[] = [
        { index: 1, name: `${t('Presets.AircraftStates.ColdDark')}` }, // 'Cold & Dark' },
        { index: 2, name: `${t('Presets.AircraftStates.Powered')}` },
        { index: 3, name: `${t('Presets.AircraftStates.ReadyPushback')}` },
        { index: 4, name: `${t('Presets.AircraftStates.ReadyTaxi')}` },
        { index: 5, name: `${t('Presets.AircraftStates.ReadyTakeoff')}` },
    ];

    // Sets the LVAR to tell the wasm to load the preset into the aircraft
    const handleLoadPreset = (presetID: number) => {
        showModal(
            <PromptModal
                title={`${AircraftPresetsList[presetID - 1].name}`}
                bodyText={t('Presets.AircraftStates.ConfirmationDialogMsg')}
                onConfirm={() => setLoadPresetVar(presetID)}
            />,
        );
    };

    // Called by the cancel button to stop and cancel loading of a preset
    const handleCancel = () => {
        setLoadPresetVar(0);
    };

    return (
        <div className="mt-4 h-content-section-reduced space-y-4 rounded-lg border-2 border-theme-accent p-4">
            <div className="flex h-20 flex-row items-center justify-center space-x-2 rounded-md border-2 border-theme-accent p-2">
                {loadPresetVar ? (
                    <>
                        <div className="h-full w-full content-center justify-center overflow-hidden rounded-md bg-theme-accent">
                            <span className="h-1/2 pl-3 pt-1 text-xl">
                                {t('Presets.AircraftStates.CurrentProcedureStep')}
                                :
                                {' '}
                                {StepDescription.get(loadPresetCurrentId)}
                            </span>
                            <div
                                className="h-1/2 bg-theme-highlight"
                                style={{ width: `${loadPresetProgress * 100}%`, transition: 'width 0.1s ease' }}
                            />
                        </div>

                        <div
                            className="flex h-full items-center rounded-md border-2 border-theme-highlight bg-theme-highlight px-4 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
                            onClick={() => handleCancel()}
                        >
                            {t('Presets.AircraftStates.Cancel')}
                        </div>
                    </>
                ) : (
                    <>
                        {simOnGround
                            ? t('Presets.AircraftStates.SelectAPresetToLoad')
                            : t('Presets.AircraftStates.TheAircraftMustBeOnTheGroundToLoadAPreset')}
                    </>
                )}
            </div>

            <ScrollableContainer innerClassName="space-y-4" height={52}>
                {AircraftPresetsList.map(({ index, name }) => (
                    <div
                        key={index}
                        className={`flex h-24 items-center justify-center rounded-md border-2 border-theme-accent bg-theme-accent text-theme-text transition duration-100 hover:bg-theme-highlight hover:text-theme-body ${(!simOnGround || (loadPresetVar && loadPresetVar !== index)) && 'pointer-events-none opacity-50'}`}
                        onClick={() => handleLoadPreset(index)}
                    >
                        {name}
                    </div>
                ))}
            </ScrollableContainer>
        </div>
    );
};
