// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { t } from 'instruments/src/EFB/translation';
import {
    FailureGenContext, FailureGenData, ModalGenType, findGeneratorFailures,
    setNewNumberOfFailureSetting, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';
import { extractFirstNumber } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelectionUI';
import { Airplane, ArrowBarUp, Repeat, Repeat1, ToggleOff } from 'react-bootstrap-icons';
import { SelectGroup, SelectItem } from 'instruments/src/EFB/UtilComponents/Form/Select';
import { SimpleInput } from 'instruments/src/EFB/UtilComponents/Form/SimpleInput/SimpleInput';
import { ButtonType, SettingItem } from 'instruments/src/EFB/Settings/Settings';
import { FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { ScrollableContainer } from 'instruments/src/EFB/UtilComponents/ScrollableContainer';
import { TooltipWrapper } from 'instruments/src/EFB/UtilComponents/TooltipWrapper';
import { ArmingModeIndex } from 'failures/src/RandomFailureGen';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { useModals } from '../../UtilComponents/Modals/Modals';

export type SettingVar = {
    settingVar: number,
}

export const failureActivationMode: (ButtonType & SettingVar)[] = [
    { name: 'One', setting: 'One', settingVar: 0 },
    { name: 'All', setting: 'All', settingVar: 1 },
];

export const FailureGeneratorDetailsModalUI: React.FC<{ failureGenContext: FailureGenContext }> = ({ failureGenContext }) => {
    const { allFailures } = useFailuresOrchestrator();
    const { popModal } = useModals();

    const genNumber = extractFirstNumber(failureGenContext.modalContext.genUniqueID);
    failureGenContext.setFailureGenModalType(ModalGenType.None);
    const numberOfSelectedFailures = findGeneratorFailures(allFailures, failureGenContext.generatorFailuresGetters,
        failureGenContext.modalContext.genUniqueID).length;

    return (
        <div className="flex flex-col items-stretch px-4 pt-4 w-1/2 text-center bg-theme-body rounded-md border-2 border-theme-accent border-solid">
            <div className="flex flex-row flex-1 justify-between items-stretch">
                <h2 className="mr-4 font-bold text-left text-current grow align-left">
                    {t('Failures.Generators.SettingsTitle')}
                </h2>
                <div />
                <div
                    className="flex-none justify-center items-center px-4 text-center rounded-md border-2
                    text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body border-utility-red transition duration-100
                    "
                    onClick={() => popModal()}
                >
                    X
                </div>
            </div>
            <ScrollableContainer height={48}>
                <div className="pt-4 w-full divide-y-2 divide-theme-accent">

                    {RearmSettingsUI(failureGenContext.modalContext.failureGenData, genNumber, setNewSetting, failureGenContext)}
                    {FailureGeneratorSingleSettingShortcut(t('Failures.Generators.NumberOfFailures'), '', t('Failures.Generators.All'),
                        numberOfSelectedFailures, 0, numberOfSelectedFailures,
                        failureGenContext.modalContext.failureGenData.settings[genNumber * failureGenContext.modalContext.failureGenData.numberOfSettingsPerGenerator + FailuresAtOnceIndex], 1,
                        setNewNumberOfFailureSetting, failureGenContext.modalContext.failureGenData, genNumber, FailuresAtOnceIndex, failureGenContext)}
                    {FailureGeneratorSingleSetting(t('Failures.Generators.MaxSimultaneous'), '',
                        failureGenContext.modalContext.failureGenData.settings[genNumber * failureGenContext.modalContext.failureGenData.numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                        Infinity,
                        failureGenContext.modalContext.failureGenData.settings[genNumber * failureGenContext.modalContext.failureGenData.numberOfSettingsPerGenerator + MaxFailuresIndex], 1,
                        setNewSetting, failureGenContext.modalContext.failureGenData, genNumber, MaxFailuresIndex, failureGenContext)}
                    {failureGenContext.modalContext.failureGenData.generatorSettingComponents(genNumber, failureGenContext.modalContext.failureGenData, failureGenContext)}
                </div>
            </ScrollableContainer>
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
        <TooltipWrapper text={`${t('Failures.Generators.ToolTipRepeat1')} - ${readyDisplay ? t('Failures.Generators.ToolTipReady') : t('Failures.Generators.ToolTipStandby')}`}>
            <Repeat1 size={20} />
        </TooltipWrapper>
    );
    case 2: return (
        <TooltipWrapper text={t('Failures.Generators.ToolTipTakeOff')}>
            <Airplane size={20} />
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

export function RearmSettingsUI(generatorSettings: FailureGenData, genID: number,
    setNewSetting: (newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    failureGenContext: FailureGenContext) {
    return (
        <SettingItem name={t('Failures.Generators.Arming')}>
            <SelectGroup>
                {rearmButtons.map((button) => {
                    if (button.setting !== 'Take-Off' || generatorSettings.disableTakeOffRearm === false) {
                        return (
                            <SelectItem
                                key={button.setting}
                                onSelect={() => {
                                    setNewSetting(button.settingVar, generatorSettings, genID, 0);
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
}

export type ButtonIcon = {
    settingVar: number,
    icon: JSX.Element,
    setting: string,
}

export function FailureGeneratorChoiceSetting(title: string, value: number, multiChoice: (ButtonIcon)[],
    setNewSetting: (newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    generatorSettings: FailureGenData, genIndex: number, settingIndex: number, failureGenContext: FailureGenContext) {
    return (
        <SettingItem name={title}>
            <SelectGroup>
                {multiChoice.map((button) => (
                    <SelectItem
                        key={button.setting}
                        onSelect={() => {
                            setNewSetting(button.settingVar, generatorSettings, genIndex, settingIndex);
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
}

export function FailureGeneratorSingleSettingShortcut(title: string,
    unit: string, shortCutText: string, shortCutValue: number, min:number, max:number,
    value: number, mult: number,
    setNewSetting: (newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    generatorSettings: FailureGenData, genIndex: number, settingIndex: number, failureGenContext: FailureGenContext) {
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
                className="w-32 font-mono text-center"
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
}

export function FailureGeneratorSingleSetting(title: string,
    unit: string, min: number, max: number,
    value: number, mult: number,
    setNewSetting: (newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    generatorSettings: FailureGenData, genIndex: number, settingIndex: number, failureGenContext: FailureGenContext) {
    const multCheck = mult === 0 ? 1 : mult;
    return (
        <SettingItem name={`${title}${unit === '' ? '' : ` (${unit})`}`}>
            <SimpleInput
                className="w-32 font-mono text-center"
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
}

export function FailureGeneratorText(title:string, unit: string, text: string) {
    return (
        <>
            <SettingItem name={`${title}${unit === '' ? '' : ` (${unit})`}`}>
                <div className="flex-1 w-32 font-mono text-2xl text-center break-keep">
                    {text}
                </div>
            </SettingItem>
        </>
    );
}

const rearmButtons: (ButtonType & SettingVar)[] = [
    { name: 'Failures.Generators.Off', setting: 'OFF', settingVar: 0 },
    { name: 'Failures.Generators.Once', setting: 'Once', settingVar: 1 },
    { name: 'Failures.Generators.TakeOff', setting: 'Take-Off', settingVar: 2 },
    { name: 'Failures.Generators.Repeat', setting: 'Repeat', settingVar: 3 },
];
