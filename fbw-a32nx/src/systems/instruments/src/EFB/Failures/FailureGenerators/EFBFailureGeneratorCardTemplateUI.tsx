// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { t } from 'instruments/src/EFB/translation';
import {
    FailureGenContext, FailureGenData, ModalContext,
    ModalGenType, findGeneratorFailures, updateSettings,
} from 'instruments/src/EFB/Failures/FailureGenerators/EFBRandomFailureGen';
import { ExclamationDiamond, Sliders2Vertical, Trash } from 'react-bootstrap-icons';
import { TooltipWrapper } from 'instruments/src/EFB/UtilComponents/TooltipWrapper';
import { ArmingModeIndex } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureGeneratorsUI';
import { AtaChapterNumber, AtaChaptersTitle } from '@flybywiresim/fbw-sdk';
import { useFailuresOrchestrator } from 'instruments/src/EFB/failures-orchestrator-provider';
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

interface FailureShortListProps {
    failureGenContext: FailureGenContext,
    uniqueID: string,
    reducedAtaChapterNumbers: AtaChapterNumber[]
}

const FailureShortList: React.FC<FailureShortListProps> = ({ failureGenContext, uniqueID, reducedAtaChapterNumbers }) => {
    const { allFailures } = useFailuresOrchestrator();

    const maxNumberOfFailureToDisplay = 4;

    let listOfSelectedFailures = findGeneratorFailures(allFailures, failureGenContext.generatorFailuresGetters, uniqueID);

    if (listOfSelectedFailures.length === allFailures.length) {
        return <div className="bg-theme-accent mb-1 rounded-md p-1">{t('Failures.Generators.AllSystems')}</div>;
    }
    if (listOfSelectedFailures.length === 0) return <div className="bg-theme-accent mb-1 rounded-md p-1">{t('Failures.Generators.NoFailure')}</div>;

    const chaptersFullySelected: AtaChapterNumber[] = [];

    for (const chapter of reducedAtaChapterNumbers) {
        const failuresActiveInChapter = listOfSelectedFailures.filter((failure) => failure.ata === chapter);
        if (failuresActiveInChapter.length === allFailures.filter((failure) => failure.ata === chapter).length) {
            chaptersFullySelected.push(chapter);
            listOfSelectedFailures = listOfSelectedFailures.filter((failure) => failure.ata !== chapter);
        }
    }

    const subSetOfChapters = chaptersFullySelected.slice(0, Math.min(maxNumberOfFailureToDisplay, chaptersFullySelected.length));
    const subSetOfSelectedFailures = listOfSelectedFailures.slice(0, Math.min(maxNumberOfFailureToDisplay - subSetOfChapters.length, listOfSelectedFailures.length));
    const chaptersToDisplay = subSetOfChapters.map((chapter) => (
        <div className="bg-theme-accent mb-1 grow rounded-md p-1">
            {AtaChaptersTitle[chapter]}
        </div>
    ));

    const singleFailuresToDisplay = subSetOfSelectedFailures.map((failure) => (
        <div className="bg-theme-accent mb-1 grow rounded-md p-1">
            {failure.name}
        </div>
    ));

    return (
        <div className="flex flex-col">
            {chaptersToDisplay}
            {singleFailuresToDisplay}
            {listOfSelectedFailures.length + chaptersFullySelected.length > maxNumberOfFailureToDisplay ? (
                <div className="mb-1 grow p-1">
                    ...+
                    {Math.max(0, listOfSelectedFailures.length + chaptersFullySelected.length - maxNumberOfFailureToDisplay)}
                </div>
            ) : <></>}
        </div>
    );
};
