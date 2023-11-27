// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { t } from 'instruments/src/EFB/translation';
import {
    FailureGenContext, FailureGenData, ModalContext,
    ModalGenType, updateSettings,
} from 'instruments/src/EFB/Failures/FailureGenerators/EFBRandomFailureGen';
import { ExclamationDiamond, Sliders2Vertical, Trash } from 'react-bootstrap-icons';
import { TooltipWrapper } from 'instruments/src/EFB/UtilComponents/TooltipWrapper';
import { ArmingModeIndex, FailureShortList } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureGeneratorsUI';
import { ArmedState } from './EFBFailureGeneratorSettingsUI';
import { useEventBus } from '../../event-bus-provider';

export interface FailureGeneratorCardTemplateUIProps {
    genNumber: number,
    failureGenData: FailureGenData,
    failureGenContext: FailureGenContext,
}

export const FailureGeneratorCardTemplateUI: React.FC<FailureGeneratorCardTemplateUIProps> = ({ genNumber, failureGenData, failureGenContext }) => {
    const bus = useEventBus();

    const genUniqueID = `${failureGenData.uniqueGenPrefix}${(genNumber).toString()}`;
    const genUniqueIDDisplayed = `${(genNumber + 1).toString()}`;
    const isArmed = (genNumber < failureGenData.armedState?.length ? failureGenData.armedState[genNumber] : false);

    const eraseGenerator: (genID: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) =>
        void = (genID: number, generatorSettings: FailureGenData, _failureGenContext: FailureGenContext) => {
            const generatorNumber = generatorSettings.settings.length / generatorSettings.numberOfSettingsPerGenerator;
            if (genID === generatorNumber - 1) {
                generatorSettings.settings.splice(genID * generatorSettings.numberOfSettingsPerGenerator, generatorSettings.numberOfSettingsPerGenerator);
                updateSettings(generatorSettings.settings, generatorSettings.setSetting, bus, generatorSettings.uniqueGenPrefix);
            } else {
                generatorSettings.settings[genID * generatorSettings.numberOfSettingsPerGenerator + ArmingModeIndex] = -1;
                updateSettings(generatorSettings.settings, generatorSettings.setSetting, bus, generatorSettings.uniqueGenPrefix);
            }
        };

    return (
        <div className="border-theme-accent m-1 flex flex-row justify-between rounded-md border-2 border-solid px-2 pt-2 text-center">
            <div className="align-left mr-4 flex max-w-[86%] grow flex-col text-left">
                <h2 className="max-w-[100%] truncate break-words pb-2">
                    {`${failureGenData.alias()} ${genUniqueIDDisplayed}`}
                </h2>
                <FailureShortList failureGenContext={failureGenContext} uniqueID={genUniqueID} reducedAtaChapterNumbers={failureGenContext.reducedAtaChapterNumbers} />
            </div>
            <div className="flex flex-col items-center justify-between">
                <div
                    onClick={() => eraseGenerator(genNumber, failureGenData, failureGenContext)}
                    className="text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body border-utility-red flex-none
                    rounded-md border-2 p-2 transition duration-100"
                >
                    <Trash size={20} />
                </div>
                <div className="flex flex-col items-center justify-end">
                    <div className={`mt-2 flex-none p-2 ${isArmed ? 'text-theme-highlight' : 'text-theme-text'} bg-theme-body`}>
                        {ArmedState(failureGenData, genNumber)}
                    </div>
                    <TooltipWrapper text={t('Failures.Generators.ToolTipGeneratorSettings')}>
                        <div
                            className="border-theme-accent hover:text-theme-body hover:bg-theme-highlight text-theme-text bg-theme-accent mt-2 flex-none rounded-md
                            border-2 p-2 transition duration-100"
                            onClick={() => {
                                failureGenContext.setFailureGenModalType(ModalGenType.Settings);
                                const genLetter = failureGenData.uniqueGenPrefix;
                                const context: ModalContext = { failureGenData, genNumber, genUniqueID, genLetter, chainToFailurePool: false };
                                failureGenContext.setModalContext(context);
                            }}
                        >
                            <Sliders2Vertical size={20} />
                        </div>
                    </TooltipWrapper>
                    <TooltipWrapper text={t('Failures.Generators.ToolTipFailureList')}>
                        <div
                            className="border-theme-accent hover:text-theme-body hover:bg-theme-highlight text-theme-text bg-theme-accent my-2 flex-none rounded-md
                            border-2 p-2 transition duration-100"
                            onClick={() => {
                                failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                                const genLetter = failureGenData.uniqueGenPrefix;
                                const context: ModalContext = { failureGenData, genNumber, genUniqueID, genLetter, chainToFailurePool: false };
                                failureGenContext.setModalContext(context);
                            }}
                        >
                            <ExclamationDiamond size={20} />
                        </div>
                    </TooltipWrapper>
                </div>
            </div>
        </div>
    );
};
