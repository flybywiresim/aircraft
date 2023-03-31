import React, { useState } from 'react';
import { SelectInput } from 'instruments/src/EFB/UtilComponents/Form/SelectInput/SelectInput';
import { t } from 'instruments/src/EFB/translation';
import {
    eraseGenerator, FailureGenContext, FailureGenData,
    failureGeneratorAdd, failureGeneratorsSettings, ModalContext, ModalGenType, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { ExtractFirstNumber, findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { Airplane, ArrowBarUp, ExclamationDiamond, PlusLg, Repeat, Repeat1, Sliders2Vertical, ToggleOff, Trash } from 'react-bootstrap-icons';
import { SelectGroup, SelectItem } from 'instruments/src/EFB/UtilComponents/Form/Select';
import { ButtonType } from 'instruments/src/EFB/Settings/Settings';
import { AtaChapterNumber, AtaChaptersTitle } from '@shared/ata';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { GeneratorFailureSelection } from './GeneratorFailureSelectionUI';

export const FailureGeneratorsUI = () => {
    const [chosenGen, setChosenGen] = useState<string>();
    const settings = failureGeneratorsSettings();

    if (settings.failureGenModalType === ModalGenType.Failures) {
        settings.modals.showModal(GeneratorFailureSelection(settings));
    }
    if (settings.failureGenModalType === ModalGenType.Settings) {
        settings.modals.showModal(FailureGeneratorDetailsModalUI(settings));
    }
    return (
        <>
            <div className="flex flex-col">
                <div className="flex flex-row flex-1 justify-start py-2 space-x-4">
                    <h2 className="flex-none">
                        {t('Failures.Generators.Select')}
                    </h2>
                    <SelectInput
                        className="flex-none w-96 h-10"
                        value={chosenGen}
                        onChange={(value) => setChosenGen(value as string)}
                        options={Array.from(settings.allGenSettings.values()).map((genSetting : FailureGenData) => ({
                            value: genSetting.genName,
                            displayValue: `${genSetting.alias()}`,
                        }))}
                        maxHeight={32}
                    />
                    <div
                        onClick={() => failureGeneratorAdd(settings.allGenSettings.get(chosenGen), settings)}
                        className="flex-none py-2 px-2 mr-4 text-center rounded-md bg-theme-accent hover:text-theme-body hover:bg-theme-highlight"
                    >
                        <PlusLg />
                    </div>
                </div>
                <div className="flex items-center">
                    <div className="mr-2">
                        {t('Failures.Generators.MaxSimultaneous')}
                        :
                    </div>
                    <SimpleInput
                        className="my-2 w-20 font-mono text-2xl px-3 py-1.5 rounded-md border-2 transition duration-100
                    focus-within:outline-none focus-within:border-theme-highlight
                    placeholder-theme-unselected bg-theme-accent border-theme-accent text-theme-text hover:bg-theme-body
                     hover:border-theme-highlight"
                        fontSizeClassName="text-2xl"
                        number
                        min={0}
                        value={settings.maxFailuresAtOnce}
                        onBlur={(x: string) => {
                            if (!Number.isNaN(parseInt(x) || parseInt(x) >= 0)) {
                                settings.setMaxFailuresAtOnce(parseInt(x));
                            }
                        }}
                    />
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

export const generatorsCardList : (settings : FailureGenContext)
=> JSX.Element[] = (settings : FailureGenContext) => {
    const temp : JSX.Element[] = [];
    settings.allGenSettings.forEach((generatorSetting) => {
        const nbGenerator = Math.floor(generatorSetting.settings.length / generatorSetting.numberOfSettingsPerGenerator);
        for (let i = 0; i < nbGenerator; i++) {
            temp.push(FailureGeneratorCardTemplateUI(i, generatorSetting, settings));
        }
    });
    return temp;
};

export function FailureGeneratorDetailsModalUI(
    failureGenContext : FailureGenContext,
) {
    const genNumber = ExtractFirstNumber(failureGenContext.modalContext.genUniqueID);
    failureGenContext.setFailureGenModalType(ModalGenType.None);
    const numberOfSelectedFailures = findGeneratorFailures(failureGenContext.allFailures, failureGenContext.generatorFailuresGetters,
        failureGenContext.modalContext.genUniqueID).length;
    return (
        <div className="flex flex-col items-stretch px-2 pt-2 my-2 w-1/2 text-center rounded-md border-2 border-solid bg-theme-body border-theme-accent">
            <div className="flex flex-row flex-1 justify-between items-stretch pb-2">
                <div className="mr-4 text-left grow align-left">
                    <h2>
                        {`${failureGenContext.modalContext.genUniqueID} : ${failureGenContext.modalContext.failureGenData.alias()}`}
                    </h2>
                </div>
                <div />
                <div
                    className="flex-none justify-center items-center py-2 px-4 text-center rounded-md border-2
                    text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body border-utility-red transition duration-100
                    "
                    onClick={() => failureGenContext.modals.popModal()}
                >
                    X
                </div>
            </div>
            {RearmSettingsUI(failureGenContext.modalContext.failureGenData, genNumber, setNewSetting, failureGenContext)}
            <div className="flex flex-col justify-start items-stretch mt-1">
                {FailureGeneratorSingleSettingShortcut(`${t('Failures.Generators.NumberOfFailures')}:`, 14, '', t('Failures.Generators.All'),
                    numberOfSelectedFailures, 0, numberOfSelectedFailures,
                    failureGenContext.modalContext.failureGenData.settings[genNumber * failureGenContext.modalContext.failureGenData.numberOfSettingsPerGenerator + 1], 1,
                    setNewSetting, failureGenContext.modalContext.failureGenData, genNumber, 1, failureGenContext)}
                { failureGenContext.modalContext.failureGenData.generatorSettingComponents(genNumber, failureGenContext.modalContext.failureGenData, failureGenContext) }
            </div>
        </div>
    );
}

function ArmedState(generatorSettings : FailureGenData, genNumber : number) {
    switch (generatorSettings.settings[generatorSettings.numberOfSettingsPerGenerator * genNumber]) {
    case 0: return (<ToggleOff size={20} />);
    case 1: return (<Repeat1 size={20} />);
    case 2: return (
        <>
            <Airplane size={20} />
            <ArrowBarUp size={20} />
        </>
    );
    case 3: return (<Repeat size={20} />);
    default: return (<></>);
    }
}

function FailureShortList(failureGenContext: FailureGenContext, uniqueID : string) {
    const maxNumberOfFailureToDisplay = 4;
    let listOfSelectedFailures = findGeneratorFailures(failureGenContext.allFailures, failureGenContext.generatorFailuresGetters, uniqueID);

    if (listOfSelectedFailures.length === failureGenContext.allFailures.length) {
        return <div className="p-1 mb-1 rounded-md bg-theme-accent">All failures</div>;
    }
    if (listOfSelectedFailures.length === 0) return <div className="p-1 mb-1 rounded-md bg-theme-accent">No failure</div>;

    const chaptersFullySelected : AtaChapterNumber[] = [];
    failureGenContext.chapters.forEach((chapter) => {
        const failuresActiveInChapter = listOfSelectedFailures.filter((failure) => failure.ata === chapter);
        if (failuresActiveInChapter.length === failureGenContext.allFailures.filter((failure) => failure.ata === chapter).length) {
            chaptersFullySelected.push(chapter);
            listOfSelectedFailures = listOfSelectedFailures.filter((failure) => failure.ata !== chapter);
        }
    });

    const subSetOfChapters = chaptersFullySelected.slice(0, Math.min(maxNumberOfFailureToDisplay, chaptersFullySelected.length));
    const subSetOfSelectedFailures = listOfSelectedFailures.slice(0, Math.min(maxNumberOfFailureToDisplay - subSetOfChapters.length, listOfSelectedFailures.length));
    const chaptersToDisplay = subSetOfChapters.map((chapter) => (
        <div className="p-1 mb-1 rounded-md grow bg-theme-accent">
            {AtaChaptersTitle[chapter]}
        </div>
    ));
    const singleFailuresToDisplay = subSetOfSelectedFailures.map((failure) => (
        <div className="p-1 mb-1 rounded-md grow bg-theme-accent">
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
}

export function FailureGeneratorCardTemplateUI(
    genNumber : number,
    failureGenData : FailureGenData,
    failureGenContext: FailureGenContext,
) {
    const genUniqueID = `${failureGenData.uniqueGenPrefix}${genNumber.toString()}`;
    return (
        <div className="flex flex-row justify-between px-2 pt-2 m-1 text-center rounded-md border-2 border-solid border-theme-accent">
            <div className="flex flex-col mr-4 text-left grow max-w-[86%] align-left">
                <h2 className="pb-2 truncate break-words max-w-[100%]">
                    {`${genUniqueID} : ${failureGenData.alias()}`}
                </h2>
                {FailureShortList(failureGenContext, genUniqueID)}
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
                    <div className="flex-none p-2 mt-2 text-theme-text bg-theme-body">
                        {ArmedState(failureGenData, genNumber)}
                    </div>
                    <div
                        className="flex-none p-2 mt-2 rounded-md transition duration-100 border-2 text-theme-text bg-theme-accent
                        border-theme-accent hover:text-theme-body hover:bg-theme-highlight"
                        onClick={() => {
                            failureGenContext.setFailureGenModalType(ModalGenType.Settings);
                            const test : ModalContext = { failureGenData, genNumber, genUniqueID };
                            failureGenContext.setModalContext(test);
                        }}
                    >
                        <Sliders2Vertical size={20} />
                    </div>
                    <div
                        className="flex-none p-2 my-2 rounded-md transition duration-100 border-2 text-theme-text bg-theme-accent
                        border-theme-accent hover:text-theme-body hover:bg-theme-highlight"
                        onClick={() => {
                            failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                            const test : ModalContext = { failureGenData, genNumber, genUniqueID };
                            failureGenContext.setModalContext(test);
                        }}
                    >
                        <ExclamationDiamond size={20} />
                    </div>
                </div>
            </div>
        </div>

    );
}

export type SettingVar = {
    settingVar: number,
}

const rearmButtons: (ButtonType & SettingVar)[] = [
    { name: t('Failures.Generators.Off'), setting: 'OFF', settingVar: 0 },
    { name: t('Failures.Generators.Once'), setting: 'Once', settingVar: 1 },
    { name: t('Failures.Generators.TakeOff'), setting: 'Take-Off', settingVar: 2 },
    { name: t('Failures.Generators.Repeat'), setting: 'Repeat', settingVar: 3 },
];

export const failureActivationMode: (ButtonType & SettingVar)[] = [
    { name: 'One', setting: 'One', settingVar: 0 },
    { name: 'All', setting: 'All', settingVar: 1 },
];

export function RearmSettingsUI(generatorSettings: FailureGenData, genID: number,
    setNewSetting : (newSetting: number, generatorSettings : FailureGenData, genID : number, settingIndex : number) => void,
    failureGenContext : FailureGenContext) {
    return (
        <div className="flex flex-col items-center text-center">
            <div className="pb-2"><h2>{t('Failures.Generators.Rearming')}</h2></div>
            <div className="flex flex-row justify-center">
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
                                    {button.name}
                                </SelectItem>
                            );
                        }
                        return (<></>);
                    })}
                </SelectGroup>
            </div>
        </div>
    );
}

export type ButtonIcon = {
    settingVar : number,
    icon : JSX.Element,
    setting : string,
}

export function FailureGeneratorChoiceSetting(title:string, value: number, multiChoice : (ButtonIcon)[],
    setNewSetting : (newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    generatorSettings : FailureGenData, genIndex : number, settingIndex : number, failureGenContext : FailureGenContext) {
    return (
        <div
            className="flex flex-row justify-start items-center px-2 pb-2 text-left align-baseline"
        >
            <div className="flex-none mx-2 w-2/3 text-left break-keep">{title}</div>
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
        </div>
    );
}

export function FailureGeneratorSingleSettingShortcut(title:string, width : number,
    unit : string, shortCutText : string, shortCutValue : number, min:number, max:number,
    value: number, mult : number,
    setNewSetting : (newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    generatorSettings : FailureGenData, genIndex : number, settingIndex : number, failureGenContext : FailureGenContext) {
    const multCheck = mult === 0 ? 1 : mult;
    return (
        <div
            className="flex flex-row justify-start items-center px-2 pb-2 text-left align-baseline"
        >
            <div className="flex-none mx-2 w-2/3 text-left truncate break-keep max-w-[66%]">{title}</div>
            <SimpleInput
                className={`w-${width} font-mono`}
                fontSizeClassName="text-2xl"
                number
                min={min}
                max={max}
                value={value * multCheck}
                onBlur={(x: string) => {
                    if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                        setNewSetting(parseFloat(x) / multCheck, generatorSettings, genIndex, settingIndex);
                        failureGenContext.setFailureGenModalType(ModalGenType.Settings);
                    }
                }}
            />
            <div className="ml-2">
                {unit}
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
            </div>

        </div>
    );
}

export function FailureGeneratorSingleSetting(title:string, width : number,
    unit : string, min:number, max:number,
    value: number, mult : number,
    setNewSetting : (newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    generatorSettings : FailureGenData, genIndex : number, settingIndex : number, failureGenContext : FailureGenContext) {
    const multCheck = mult === 0 ? 1 : mult;
    return (
        <div
            className="flex flex-row justify-start items-center px-2 pb-2 text-left align-baseline"
        >
            <div className="flex-none mx-2 w-2/3 text-left truncate max-w-[66%] break-keep">{title}</div>
            <SimpleInput
                className={`w-${width} font-mono`}
                fontSizeClassName="text-2xl"
                number
                min={min}
                max={max}
                value={value * multCheck}
                onBlur={(x: string) => {
                    if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                        setNewSetting(parseFloat(x) / multCheck, generatorSettings, genIndex, settingIndex);
                        failureGenContext.setFailureGenModalType(ModalGenType.Settings);
                    }
                }}
            />
            <div className="ml-2">{unit}</div>
        </div>
    );
}

export function FailureGeneratorText(title:string, text: string) {
    return (
        <div
            className="flex flex-row justify-start items-center px-2 pb-2 text-left align-baseline"
        >
            <div className="flex-none mx-2 w-2/3 text-left truncate max-w-[66%] break-keep">{title}</div>
            <div className="flex-1 mx-2 text-left break-keep">
                {text}
            </div>
        </div>
    );
}
