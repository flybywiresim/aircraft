// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import { SelectInput } from 'instruments/src/EFB/UtilComponents/Form/SelectInput/SelectInput';
import { t } from 'instruments/src/EFB/translation';
import {
    FailureGenContext, FailureGenData, useFailureGeneratorsSettings, findGeneratorFailures, ModalContext,
    ModalGenType, updateSettings, sendRefresh, FailureGenFeedbackEvent, sendFailurePool,
} from 'instruments/src/EFB/Failures/FailureGenerators/EFBRandomFailureGen';
import { InfoCircle, PlusLg } from 'react-bootstrap-icons';
import { AtaChapterNumber, AtaChaptersTitle } from '@flybywiresim/fbw-sdk';
import { FailureGeneratorInfoModalUI } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureGeneratorInfo';
import { FailureGeneratorCardTemplateUI } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureGeneratorCardTemplateUI';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { GeneratorFailureSelection } from './EFBGeneratorFailureSelectionUI';
import { FailureGeneratorDetailsModalUI } from './EFBFailureGeneratorSettingsUI';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { getGeneratorFailurePool, setSelectedFailure } from './EFBFailureSelectionFunctions';
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

    const [genNumberNewGen, setGenNumberNewGen] = useState<number>(undefined);

    const [settingsUpdated, setSettingsUpdated] = useState<boolean>(false);

    // console.log(settings.allGenSettings);
    useEffect(() => {
        const genUniqueID = `${settings.allGenSettings.get(chosenGen)?.uniqueGenPrefix}${genNumberNewGen}`;
        const genLetter = settings.allGenSettings.get(chosenGen)?.uniqueGenPrefix;
        const context: ModalContext = { failureGenData: settings.allGenSettings.get(chosenGen), genNumber: genNumberNewGen, genUniqueID, genLetter, chainToFailurePool: true };
        console.log('NEW CONTEXT', context);
        settings.setModalContext(context);
    }, [settingsUpdated]);

    const sample = settings.modalContext?.failureGenData?.settings[settings.modalContext?.genNumber
            * settings.modalContext?.failureGenData?.numberOfSettingsPerGenerator + ArmingModeIndex];
    if (sample && !Number.isNaN(sample)) {
        if (settings.failureGenModalType === ModalGenType.Failures) showModal(<GeneratorFailureSelection failureGenContext={settings} />);
        if (settings.failureGenModalType === ModalGenType.Settings) showModal(<FailureGeneratorDetailsModalUI failureGenContext={settings} />);
    }

    const generatorList = Array.from(settings.allGenSettings.values()).map((genSetting: FailureGenData) => ({
        value: genSetting.genName,
        displayValue: `${genSetting.alias()}`,
    }));
    generatorList.push({
        value: 'default',
        displayValue: `<${t('Failures.Generators.SelectInList')}>`,
    });

    const failureGeneratorAdd = (generatorSettings: FailureGenData) => {
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
                // console.info(`Number of parameters inconsistent, reseting instances of gen ${generatorSettings.uniqueGenPrefix}`);
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
        const genUniqueID = `${generatorSettings.uniqueGenPrefix}${genNumber}`;

        for (const failure of allFailures) {
            setSelectedFailure(failure, genUniqueID, settings, true);
        }
        sendFailurePool(generatorSettings.uniqueGenPrefix, genNumber, getGeneratorFailurePool(generatorSettings.uniqueGenPrefix + genNumber.toString(), Array.from(allFailures)), bus);

        settings.setFailureGenModalType(ModalGenType.Settings);
        setGenNumberNewGen(genNumber);
        console.log('ADDING', generatorSettings);

        // hack to force update of modal context
        setSettingsUpdated(!settingsUpdated);
    };

    const treatArmingDisplayStatusEvent = (generatorType: string, status: boolean[]) => {
        for (const generator of settings.allGenSettings.values()) {
            if (generatorType === generator.uniqueGenPrefix) {
                // console.info(`gen ${generator.uniqueGenPrefix} ArmedDisplay received: ${`${generatorType} - ${status.toString()}`}`);
                generator.setArmedState(status);
                // console.info('received arming states');
            }
        }
    };

    const treatExpectedModeEvent = (generatorType: string, mode: number[]) => {
        for (const generator of settings.allGenSettings.values()) {
            if (generatorType === generator.uniqueGenPrefix) {
                // console.info(`gen ${generator.uniqueGenPrefix} expectedMode received: ${generatorType} - ${mode.toString()}`);
                const nbGenerator = Math.floor(generator.settings.length / generator.numberOfSettingsPerGenerator);
                let changeNeeded = false;
                for (let i = 0; i < nbGenerator && i < mode?.length; i++) {
                    if (generator.settings[i * generator.numberOfSettingsPerGenerator + ArmingModeIndex] !== -1) {
                        if (i < mode?.length && mode[i] === 0 && generator.settings[i * generator.numberOfSettingsPerGenerator + ArmingModeIndex] !== 0) {
                            // console.info(`gen ${generator.uniqueGenPrefix} ${i.toString()} switched off`);
                            // console.info(`reminder of previous memory state: ${generator.settings[i * generator.numberOfSettingsPerGenerator + ArmingModeIndex]}`);
                            generator.settings[i * generator.numberOfSettingsPerGenerator + ArmingModeIndex] = 0;
                            changeNeeded = true;
                        }
                    }
                }
                if (changeNeeded) {
                    updateSettings(generator.settings, generator.setSetting, bus, generator.uniqueGenPrefix);
                }
            }
        }
        // console.info('received expectedMode');
    };

    useEffect(() => {
        // console.info('subscribing to events');
        const sub1 = bus.getSubscriber<FailureGenFeedbackEvent>().on('expectedMode').handle(({ generatorType, mode }) => {
            treatExpectedModeEvent(generatorType, mode);
        });
        const sub2 = bus.getSubscriber<FailureGenFeedbackEvent>().on('armingDisplayStatus').handle(({ generatorType, status }) => {
            treatArmingDisplayStatusEvent(generatorType, status);
        });
        return () => {
            sub1.destroy();
            sub2.destroy();
        };
    }, []);

    return (
        <>
            <div className="flex flex-col">
                <div className="flex flex-1 flex-row justify-between">
                    <div className="flex flex-1 flex-row justify-start space-x-4 py-2">
                        <h2 className="flex-none">
                            {`${t('Failures.Generators.GeneratorToAdd')}:`}
                        </h2>
                        <SelectInput
                            className="h-10 w-96 flex-none"
                            value={chosenGen}
                            defaultValue="default"
                            onChange={(value) => setChosenGen(value as string)}
                            options={generatorList}
                            maxHeight={32}
                        />
                        <div
                            onClick={() => {
                                console.log(chosenGen);
                                if (chosenGen !== 'default') {
                                    failureGeneratorAdd(settings.allGenSettings.get(chosenGen));
                                    console.log(settings.modalContext);
                                }
                            }}
                            className="hover:text-theme-body bg-theme-accent hover:bg-theme-highlight flex-none rounded-md p-2 text-center"
                        >
                            <PlusLg />
                        </div>
                    </div>
                    <div className="flex flex-1 flex-row justify-end py-2">
                        <div
                            onClick={() => showModal(<FailureGeneratorInfoModalUI />)}
                            className="hover:text-theme-body bg-theme-accent hover:bg-theme-highlight flex-none rounded-md p-2 text-center"
                        >
                            <InfoCircle />
                        </div>
                    </div>
                </div>
                <ScrollableContainer height={48}>
                    <div className="grid grid-flow-row grid-cols-3">
                        {generatorsCardList(settings)}
                    </div>
                </ScrollableContainer>
            </div>
        </>
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

export const FailureShortList: React.FC<FailureShortListProps> = ({ failureGenContext, uniqueID, reducedAtaChapterNumbers }) => {
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
