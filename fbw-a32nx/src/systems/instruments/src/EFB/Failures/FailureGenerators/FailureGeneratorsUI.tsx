// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useState } from 'react';
import { SelectInput } from 'instruments/src/EFB/UtilComponents/Form/SelectInput/SelectInput';
import { t } from 'instruments/src/EFB/translation';
import {
    FailureGenContext, FailureGenData, useFailureGeneratorsSettings, findGeneratorFailures, ModalContext,
    ModalGenType, updateSettings, sendRefresh,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';
import { ExclamationDiamond, InfoCircle, PlusLg, Sliders2Vertical, Trash } from 'react-bootstrap-icons';
import { AtaChapterNumber, AtaChaptersTitle } from '@flybywiresim/fbw-sdk';
import { FailureGeneratorInfoModalUI } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorInfo';
import { TooltipWrapper } from 'instruments/src/EFB/UtilComponents/TooltipWrapper';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { GeneratorFailureSelection } from './GeneratorFailureSelectionUI';
import { FailureGeneratorDetailsModalUI, ArmedState } from './FailureGeneratorSettingsUI';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { setSelectedFailure } from './FailureSelectionUI';
import { useModals } from '../../UtilComponents/Modals/Modals';
import { useEventBus } from '../../event-bus-provider';

export const ArmingModeIndex = 0;
export const FailuresAtOnceIndex = 1;
export const MaxFailuresIndex = 2;

export const NumberOfFeedbacks = 2;
export const ReadyDisplayIndex = 1;

export const FailureGeneratorsUI = () => {
    const bus = useEventBus();
    const { allFailures } = useFailuresOrchestrator();
    const { showModal } = useModals();

    const [chosenGen, setChosenGen] = useState<string>();
    const settings = useFailureGeneratorsSettings();

    if (settings.failureGenModalType === ModalGenType.Failures) {
        showModal(<GeneratorFailureSelection failureGenContext={settings} />);
    }
    if (settings.failureGenModalType === ModalGenType.Settings) {
        showModal(<FailureGeneratorDetailsModalUI failureGenContext={settings} />);
    }
    const generatorList = Array.from(settings.allGenSettings.values()).map((genSetting: FailureGenData) => ({
        value: genSetting.genName,
        displayValue: `${genSetting.alias()}`,
    }));
    generatorList.push({
        value: 'default',
        displayValue: `<${t('Failures.Generators.SelectInList')}>`,
    });

    const failureGeneratorAdd = (generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => {
        let genNumber: number;
        let didFindADisabledGen = false;
        for (let i = 0; i < generatorSettings.settings.length / generatorSettings.numberOfSettingsPerGenerator; i++) {
            if (generatorSettings.settings[i * generatorSettings.numberOfSettingsPerGenerator + ArmingModeIndex] === -1 && !didFindADisabledGen) {
                for (let j = 0; j < generatorSettings.numberOfSettingsPerGenerator; j++) {
                    generatorSettings.settings[i * generatorSettings.numberOfSettingsPerGenerator + j] = generatorSettings.additionalSetting[j];
                }
                didFindADisabledGen = true;
                genNumber = i;
            }
        }
        if (didFindADisabledGen === false) {
            if (generatorSettings.settings.length % generatorSettings.numberOfSettingsPerGenerator !== 0 || generatorSettings.settings.length === 0) {
                updateSettings(generatorSettings.additionalSetting, generatorSettings.setSetting, bus, generatorSettings.uniqueGenPrefix);
                genNumber = 0;
            } else {
                updateSettings(generatorSettings.settings.concat(generatorSettings.additionalSetting), generatorSettings.setSetting, bus, generatorSettings.uniqueGenPrefix);
                genNumber = Math.floor(generatorSettings.settings.length / generatorSettings.numberOfSettingsPerGenerator);
            }
        } else {
            updateSettings(generatorSettings.settings, generatorSettings.setSetting, bus, generatorSettings.uniqueGenPrefix);
        }
        sendRefresh(bus);
        const genID = `${generatorSettings.uniqueGenPrefix}${genNumber}`;

        for (const failure of allFailures) {
            setSelectedFailure(failure, genID, failureGenContext, true);
        }
    };

    return (
        <>
            <div className="flex flex-col">
                <div className="flex flex-row flex-1 justify-between">
                    <div className="flex flex-row flex-1 justify-start py-2 space-x-4">
                        <h2 className="flex-none">
                            {`${t('Failures.Generators.GeneratorToAdd')}:`}
                        </h2>
                        <SelectInput
                            className="flex-none w-96 h-10"
                            value={chosenGen}
                            defaultValue="default"
                            onChange={(value) => setChosenGen(value as string)}
                            options={generatorList}
                            maxHeight={32}
                        />
                        <div
                            onClick={() => {
                                if (chosenGen !== 'default') {
                                    failureGeneratorAdd(settings.allGenSettings.get(chosenGen), settings);
                                }
                            }}
                            className="flex-none py-2 px-2 text-center rounded-md hover:text-theme-body bg-theme-accent hover:bg-theme-highlight"
                        >
                            <PlusLg />
                        </div>
                    </div>
                    <div className="flex flex-row flex-1 justify-end py-2">
                        <div
                            onClick={() => showModal(<FailureGeneratorInfoModalUI />)}
                            className="flex-none py-2 px-2 text-center rounded-md hover:text-theme-body bg-theme-accent hover:bg-theme-highlight"
                        >
                            <InfoCircle />
                        </div>
                    </div>
                </div>
                <ScrollableContainer height={48}>
                    <div className="grid grid-cols-3 grid-flow-row">
                        {generatorsCardList(settings)}
                    </div>
                </ScrollableContainer>
            </div>
        </>
    );
};

export interface FailureGeneratorCardTemplateUIProps {
    genNumber: number,
    failureGenData: FailureGenData,
    failureGenContext: FailureGenContext,
}

export const FailureGeneratorCardTemplateUI: React.FC<FailureGeneratorCardTemplateUIProps> = ({ genNumber, failureGenData, failureGenContext }) => {
    const bus = useEventBus();

    const genUniqueID = `${failureGenData.uniqueGenPrefix}${(genNumber).toString()}`;
    const genUniqueIDDisplayed = `${failureGenData.uniqueGenPrefix}${(genNumber + 1).toString()}`;
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
        <div className="flex flex-row justify-between px-2 pt-2 m-1 text-center rounded-md border-2 border-solid border-theme-accent">
            <div className="flex flex-col mr-4 text-left max-w-[86%] grow align-left">
                <h2 className="pb-2 truncate break-words max-w-[100%]">
                    {`${genUniqueIDDisplayed}: ${failureGenData.alias()}`}
                </h2>
                <FailureShortList failureGenContext={failureGenContext} uniqueID={genUniqueID} reducedAtaChapterNumbers={failureGenContext.reducedAtaChapterNumbers} />
            </div>
            <div className="flex flex-col justify-between items-center">
                <div
                    onClick={() => eraseGenerator(genNumber, failureGenData, failureGenContext)}
                    className="flex-none p-2 rounded-md transition duration-100 border-2
                    text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body border-utility-red"
                >
                    <Trash size={20} />
                </div>
                <div className="flex flex-col justify-end items-center">
                    <div className={`flex-none p-2 mt-2 ${isArmed ? 'text-theme-highlight' : 'text-theme-text'} bg-theme-body`}>
                        {ArmedState(failureGenData, genNumber)}
                    </div>
                    <TooltipWrapper text={t('Failures.Generators.ToolTipGeneratorSettings')}>
                        <div
                            className="flex-none p-2 mt-2 rounded-md border-2 transition duration-100 border-theme-accent
                            hover:text-theme-body hover:bg-theme-highlight text-theme-text bg-theme-accent"
                            onClick={() => {
                                failureGenContext.setFailureGenModalType(ModalGenType.Settings);
                                const genLetter = failureGenData.uniqueGenPrefix;
                                const context: ModalContext = { failureGenData, genNumber, genUniqueID, genLetter };
                                failureGenContext.setModalContext(context);
                            }}
                        >
                            <Sliders2Vertical size={20} />
                        </div>
                    </TooltipWrapper>
                    <TooltipWrapper text={t('Failures.Generators.ToolTipFailureList')}>
                        <div
                            className="flex-none p-2 my-2 rounded-md border-2 transition duration-100 border-theme-accent
                            hover:text-theme-body hover:bg-theme-highlight text-theme-text bg-theme-accent"
                            onClick={() => {
                                failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                                const genLetter = failureGenData.uniqueGenPrefix;
                                const context: ModalContext = { failureGenData, genNumber, genUniqueID, genLetter };
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

export const generatorsCardList = (settings: FailureGenContext) => {
    const temp: JSX.Element[] = [];

    for (const [, generatorSetting] of settings.allGenSettings) {
        const nbGenerator = Math.floor(generatorSetting.settings.length / generatorSetting.numberOfSettingsPerGenerator);

        for (let i = 0; i < nbGenerator; i++) {
            if (generatorSetting.settings[i * generatorSetting.numberOfSettingsPerGenerator + ArmingModeIndex] !== -1) {
                temp.push(<FailureGeneratorCardTemplateUI genNumber={i} failureGenData={generatorSetting} failureGenContext={settings} />);
            }
        }
    }

    return temp;
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
        return <div className="p-1 mb-1 rounded-md bg-theme-accent">{t('Failures.Generators.AllSystems')}</div>;
    }
    if (listOfSelectedFailures.length === 0) return <div className="p-1 mb-1 rounded-md bg-theme-accent">{t('Failures.Generators.NoFailure')}</div>;

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
        <div className="p-1 mb-1 rounded-md bg-theme-accent grow">
            {AtaChaptersTitle[chapter]}
        </div>
    ));

    const singleFailuresToDisplay = subSetOfSelectedFailures.map((failure) => (
        <div className="p-1 mb-1 rounded-md bg-theme-accent grow">
            {failure.name}
        </div>
    ));

    return (
        <div className="flex flex-col">
            {chaptersToDisplay}
            {singleFailuresToDisplay}
            {listOfSelectedFailures.length + chaptersFullySelected.length > maxNumberOfFailureToDisplay ? (
                <div className="p-1 mb-1 grow">
                    ...+
                    {Math.max(0, listOfSelectedFailures.length + chaptersFullySelected.length - maxNumberOfFailureToDisplay)}
                </div>
            ) : <></>}
        </div>
    );
};
