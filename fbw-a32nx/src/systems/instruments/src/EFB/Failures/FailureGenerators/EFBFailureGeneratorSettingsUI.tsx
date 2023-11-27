// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { t } from 'instruments/src/EFB/translation';
import {
    FailureGenContext, FailureGenData, ModalContext, ModalGenType, findGeneratorFailures, setNewSetting,
    updateSettings,
} from 'instruments/src/EFB/Failures/FailureGenerators/EFBRandomFailureGen';
import { extractFirstNumber } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureSelectionFunctions';
import { ArrowBarUp, Repeat, Icon1Circle, ToggleOff } from 'react-bootstrap-icons';
import { SelectGroup, SelectItem } from 'instruments/src/EFB/UtilComponents/Form/Select';
import { SimpleInput } from 'instruments/src/EFB/UtilComponents/Form/SimpleInput/SimpleInput';
import { ButtonType, SettingItem } from 'instruments/src/EFB/Settings/Settings';
import { FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureGeneratorsUI';
import { ScrollableContainer } from 'instruments/src/EFB/UtilComponents/ScrollableContainer';
import { TooltipWrapper } from 'instruments/src/EFB/UtilComponents/TooltipWrapper';
import { ArmingModeIndex } from 'failures/src/RandomFailureGen';
import { EventBus } from '@microsoft/msfs-sdk';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { useModals } from '../../UtilComponents/Modals/Modals';
import { useEventBus } from '../../event-bus-provider';

export type SettingVar = {
    settingVar: number,
}

export const failureActivationMode: (ButtonType & SettingVar)[] = [
    { name: 'One', setting: 'One', settingVar: 0 },
    { name: 'All', setting: 'All', settingVar: 1 },
];

export interface RearmSettingsUIProps {
    generatorSettings: FailureGenData,
    genID: number,
    setNewSetting: (bus: EventBus, newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    failureGenContext: FailureGenContext
}

export const RearmSettingsUI: React.FC<RearmSettingsUIProps> = ({ generatorSettings, genID, setNewSetting, failureGenContext }) => {
    const bus = useEventBus();

    return (
        <SettingItem name={t('Failures.Generators.Arming')}>
            <SelectGroup>
                {rearmButtons.map((button) => {
                    if (button.setting !== 'Take-Off' || generatorSettings.disableTakeOffRearm === false) {
                        return (
                            <SelectItem
                                key={button.setting}
                                onSelect={() => {
                                    setNewSetting(bus, button.settingVar, generatorSettings, genID, 0);
                                    failureGenContext.setFailureGenModalType(ModalGenType.Settings);
                                }}
                                selected={generatorSettings.settings[genID * generatorSettings.numberOfSettingsPerGenerator + 0] === button.settingVar}
                            >
                                {t(button.name)}
                            </SelectItem>
                        );
                    }
                    return (<></>);
                })}
            </SelectGroup>
        </SettingItem>
    );
};

export interface FailureGeneratorSingleSettingProps {
    title: string,
    unit: string,
    min: number,
    max: number,
    value: number,
    mult: number,
    setNewSetting: (bus: EventBus, newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    generatorSettings: FailureGenData,
    genIndex: number,
    settingIndex: number,
    failureGenContext: FailureGenContext,
}

export const FailureGeneratorSingleSetting: React.FC<FailureGeneratorSingleSettingProps> = ({
    title, unit, min, max, value, mult, setNewSetting, generatorSettings, genIndex, settingIndex,
    failureGenContext,
}) => {
    const bus = useEventBus();

    const multCheck = mult === 0 ? 1 : mult;

    return (
        <SettingItem name={`${title}${unit === '' ? '' : ` (${unit})`}`}>
            <SimpleInput
                className="w-32 text-center font-mono"
                fontSizeClassName="text-2xl"
                number
                min={min}
                max={max}
                value={value * multCheck}
                onBlur={(x: string) => {
                    if (!Number.isNaN(parseFloat(x))) {
                        setNewSetting(bus, parseFloat(x) / multCheck, generatorSettings, genIndex, settingIndex);
                    } else {
                        setNewSetting(bus, min, generatorSettings, genIndex, settingIndex);
                    }
                    failureGenContext.setFailureGenModalType(ModalGenType.Settings);
                }}
            />
        </SettingItem>
    );
};

interface FailureGeneratorSingleSettingShortcutProps {
    title: string,
    unit: string,
    shortCutText: string,
    shortCutValue: number,
    min: number,
    max: number,
    value: number,
    mult: number,
    setNewSetting: (newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    generatorSettings: FailureGenData,
    genIndex: number,
    settingIndex: number,
    failureGenContext: FailureGenContext,
}

interface NextButtonProps {
    failureGenContext: FailureGenContext,
}

export const NextButton: React.FC<NextButtonProps> = ({ failureGenContext }) => {
    if (failureGenContext.modalContext.chainToFailurePool === true) {
        return (
            <div
                className="border-theme-accent hover:text-theme-body hover:bg-theme-highlight text-theme-text bg-theme-accent mt-2 rounded-md
                            border-2 p-2 transition duration-100"
                onClick={() => {
                    failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                }}
            >
                {t('Failures.Generators.Next')}
            </div>
        );
    }
    return (<></>);
};

export const FailureGeneratorSingleSettingShortcut: React.FC<FailureGeneratorSingleSettingShortcutProps> = ({
    title, unit, shortCutText, shortCutValue, min, max, value, mult, setNewSetting,
    generatorSettings, genIndex, settingIndex, failureGenContext,
}) => {
    const multCheck = mult === 0 ? 1 : mult;

    return (
        <SettingItem name={`${title}${unit === '' ? '' : ` (${unit})`}`}>
            <span className="mr-2">
                {' ( '}
                <span
                    className="hover:text-theme-highlight"
                    onClick={() => {
                        setNewSetting(shortCutValue, generatorSettings, genIndex, settingIndex);
                        failureGenContext.setFailureGenModalType(ModalGenType.Settings);
                    }}
                >
                    {shortCutText}
                </span>
                {' )'}
            </span>
            <SimpleInput
                className="w-32 text-center font-mono"
                fontSizeClassName="text-2xl"
                number
                min={min}
                max={max}
                value={value * multCheck}
                onBlur={(x: string) => {
                    if (!Number.isNaN(parseFloat(x))) {
                        setNewSetting(parseFloat(x) / multCheck, generatorSettings, genIndex, settingIndex);
                    } else {
                        setNewSetting(min, generatorSettings, genIndex, settingIndex);
                    }
                    failureGenContext.setFailureGenModalType(ModalGenType.Settings);
                }}
            />
        </SettingItem>
    );
};

export const FailureGeneratorDetailsModalUI: React.FC<{ failureGenContext: FailureGenContext, modalContext: ModalContext }> = ({ failureGenContext, modalContext }) => {
    const bus = useEventBus();
    const { allFailures } = useFailuresOrchestrator();
    const { popModal } = useModals();

    console.log('MODAL', modalContext);
    let displayContent = <></>;
    const genNumber = extractFirstNumber(modalContext.genUniqueID);
    failureGenContext.setFailureGenModalType(ModalGenType.None);
    failureGenContext.setFailureGenModalCurrentlyDisplayed(ModalGenType.Settings);
    if (genNumber !== undefined && !Number.isNaN(genNumber)) {
        const numberOfSelectedFailures = findGeneratorFailures(allFailures, failureGenContext.generatorFailuresGetters,
            modalContext.genUniqueID).length;
        const sample = modalContext.failureGenData.settings[genNumber * modalContext.failureGenData.numberOfSettingsPerGenerator + ArmingModeIndex];
        if (sample !== undefined && !Number.isNaN(sample)) {
            const setNewNumberOfFailureSetting = (newSetting: number, generatorSettings: FailureGenData, genID: number) => {
                const settings = generatorSettings.settings;
                settings[genID * generatorSettings.numberOfSettingsPerGenerator + FailuresAtOnceIndex] = newSetting;
                settings[genID * generatorSettings.numberOfSettingsPerGenerator
                    + MaxFailuresIndex] = Math.max(settings[genID * generatorSettings.numberOfSettingsPerGenerator + MaxFailuresIndex],
                    newSetting);
                updateSettings(generatorSettings.settings, generatorSettings.setSetting, bus, generatorSettings.uniqueGenPrefix);
            };
            displayContent = (
                <ScrollableContainer height={48}>
                    <div className="divide-theme-accent w-full divide-y-2 pt-4">
                        <RearmSettingsUI
                            generatorSettings={modalContext.failureGenData}
                            genID={genNumber}
                            setNewSetting={setNewSetting}
                            failureGenContext={failureGenContext}
                        />

                        <FailureGeneratorSingleSettingShortcut
                            title={t('Failures.Generators.NumberOfFailures')}
                            unit=""
                            shortCutText={t('Failures.Generators.All')}
                            shortCutValue={numberOfSelectedFailures}
                            min={0}
                            max={numberOfSelectedFailures}
                            value={modalContext.failureGenData.settings[
                                genNumber * modalContext.failureGenData.numberOfSettingsPerGenerator + FailuresAtOnceIndex
                            ]}
                            mult={1}
                            setNewSetting={setNewNumberOfFailureSetting}
                            generatorSettings={modalContext.failureGenData}
                            genIndex={genNumber}
                            settingIndex={FailuresAtOnceIndex}
                            failureGenContext={failureGenContext}
                        />

                        <FailureGeneratorSingleSetting
                            title={t('Failures.Generators.MaxSimultaneous')}
                            unit=""
                            min={modalContext.failureGenData.settings[
                                genNumber * modalContext.failureGenData.numberOfSettingsPerGenerator + FailuresAtOnceIndex
                            ]}
                            max={Infinity}
                            value={modalContext.failureGenData.settings[
                                genNumber * modalContext.failureGenData.numberOfSettingsPerGenerator + MaxFailuresIndex
                            ]}
                            mult={1}
                            setNewSetting={setNewSetting}
                            generatorSettings={modalContext.failureGenData}
                            genIndex={genNumber}
                            settingIndex={MaxFailuresIndex}
                            failureGenContext={failureGenContext}
                        />
                        {modalContext.failureGenData.generatorSettingComponents(genNumber, modalContext, failureGenContext)}
                        <NextButton
                            failureGenContext={failureGenContext}
                        />
                    </div>
                </ScrollableContainer>
            );
        } else {
            failureGenContext.setFailureGenModalCurrentlyDisplayed(ModalGenType.None);
            popModal();
        }
    } else {
        failureGenContext.setFailureGenModalCurrentlyDisplayed(ModalGenType.None);
        popModal();
    }
    return (
        <div className="bg-theme-body border-theme-accent flex w-1/2 flex-col items-stretch rounded-md border-2 border-solid px-4 pt-4 text-center">
            <div className="flex flex-1 flex-row items-stretch justify-between">
                <h2 className="align-left mr-4 grow text-left font-bold text-current">
                    {t('Failures.Generators.SettingsTitle')}
                </h2>
                <div />
                <div
                    className="text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body border-utility-red flex-none items-center
                    justify-center rounded-md border-2 px-4 text-center transition duration-100
                    "
                    onClick={() => {
                        failureGenContext.setFailureGenModalCurrentlyDisplayed(ModalGenType.None);
                        popModal();
                    }}
                >
                    X
                </div>
            </div>
            { displayContent}
        </div>
    );
};

export function ArmedState(generatorSettings: FailureGenData, genNumber: number) {
    const readyDisplay:boolean = (genNumber < generatorSettings.armedState?.length) ? generatorSettings.armedState[genNumber] : false;
    switch (generatorSettings.settings[generatorSettings.numberOfSettingsPerGenerator * genNumber + ArmingModeIndex]) {
    case 0: return (
        <TooltipWrapper text={`${t('Failures.Generators.ToolTipOff')} - ${readyDisplay ? t('Failures.Generators.ToolTipReady') : t('Failures.Generators.ToolTipStandby')}`}>
            <ToggleOff size={20} />
        </TooltipWrapper>
    );
    case 1: return (
        <TooltipWrapper text={`${t('Failures.Generators.ToolTipOnce')} - ${readyDisplay ? t('Failures.Generators.ToolTipReady') : t('Failures.Generators.ToolTipStandby')}`}>
            <Icon1Circle size={20} />
        </TooltipWrapper>
    );
    case 2: return (
        <TooltipWrapper text={t('Failures.Generators.ToolTipTakeOff')}>
            <ArrowBarUp size={20} />
        </TooltipWrapper>
    );
    case 3: return (
        <TooltipWrapper text={`${t('Failures.Generators.ToolTipRepeat')} - ${readyDisplay ? t('Failures.Generators.ToolTipReady') : t('Failures.Generators.ToolTipStandby')}`}>
            <Repeat size={20} />
        </TooltipWrapper>
    );
    default: return (<></>);
    }
}

export type ButtonIcon = {
    settingVar: number,
    icon: JSX.Element,
    setting: string,
}

export interface FailureGeneratorChoiceSettingProps {
    title: string,
    failureGenContext: FailureGenContext,
    generatorSettings: FailureGenData,
    multiChoice: (ButtonIcon)[],
    setNewSetting: (bus: EventBus, newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    genIndex: number,
    settingIndex: number,
    value: number,
}

export const FailureGeneratorChoiceSetting: React.FC<FailureGeneratorChoiceSettingProps> = ({ title, multiChoice, generatorSettings, genIndex, settingIndex, failureGenContext, value }) => {
    const bus = useEventBus();

    return (
        <SettingItem name={title}>
            <SelectGroup>
                {multiChoice.map((button) => (
                    <SelectItem
                        key={button.setting}
                        onSelect={() => {
                            setNewSetting(bus, button.settingVar, generatorSettings, genIndex, settingIndex);
                            failureGenContext.setFailureGenModalType(ModalGenType.Settings);
                        }}
                        selected={value === button.settingVar}
                    >
                        {button.icon}
                    </SelectItem>
                ))}
            </SelectGroup>
        </SettingItem>
    );
};

export interface FailureGeneratorTextProps {
    title: string,
    unit: string,
    text: string,
}

export const FailureGeneratorText: React.FC<FailureGeneratorTextProps> = ({ title, unit, text }) => (
    <SettingItem name={`${title}${unit === '' ? '' : ` (${unit})`}`}>
        <div className="w-32 flex-1 break-keep text-center font-mono text-2xl">
            {text}
        </div>
    </SettingItem>
);

const rearmButtons: (ButtonType & SettingVar)[] = [
    { name: 'Failures.Generators.Off', setting: 'OFF', settingVar: 0 },
    { name: 'Failures.Generators.Once', setting: 'Once', settingVar: 1 },
    { name: 'Failures.Generators.TakeOff', setting: 'Take-Off', settingVar: 2 },
    { name: 'Failures.Generators.Repeat', setting: 'Repeat', settingVar: 3 },
];
