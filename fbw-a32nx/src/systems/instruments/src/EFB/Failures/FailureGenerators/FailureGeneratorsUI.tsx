import React, { useState } from 'react';
import { SelectInput } from 'instruments/src/EFB/UtilComponents/Form/SelectInput/SelectInput';
import { t } from 'instruments/src/EFB/translation';
import {
    eraseGenerator, FailureGenContext, FailureGenData,
    failureGeneratorAdd, failureGeneratorsSettings, ModalContext, ModalGenType, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { ExtractFirstNumber, findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { Trash } from 'react-bootstrap-icons';
import { SelectGroup, SelectItem } from 'instruments/src/EFB/UtilComponents/Form/Select';
import { ButtonType } from 'instruments/src/EFB/Settings/Settings';
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
        settings.modals.showModal(FailureGeneratorDetailsUI(settings));
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
                        <h2>{t('Failures.Generators.Add')}</h2>
                    </div>
                </div>
                <div className="flex items-center">
                    <div className="mr-2">
                        {t('Failures.Generators.MaxSimultaneous')}
                        :
                    </div>
                    <SimpleInput
                        className="my-2 w-10 font-mono text-2xl px-3 py-1.5 rounded-md border-2 transition duration-100
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
                    {generatorsCardList(settings)}
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

export function FailureGeneratorDetailsUI(
    failureGenContext : FailureGenContext,
) {
    const genNumber = ExtractFirstNumber(failureGenContext.modalContext.genUniqueID);
    failureGenContext.setFailureGenModalType(ModalGenType.None);
    return (
        <div className="flex flex-col flex-1 px-2 pt-2 my-2 w-full text-center rounded-md border-2 border-solid bg-theme-body border-theme-accent mx-x">
            <div
                className="flex justify-center items-center py-2 px-8 w-full text-center rounded-md border-2
                    transition duration-100 text-theme-text hover:text-theme-highlight bg-theme-accent hover:bg-theme-body
                    border-theme-accent hover:border-theme-highlight"
                onClick={() => failureGenContext.modals.popModal()}
            >
                {t('Failures.Generators.Close')}
            </div>
            <div className="flex flex-row justify-between">
                <div className="pb-2 mr-4 w-1/3 text-left align-left">
                    <h2>
                        {`${failureGenContext.modalContext.genUniqueID} : ${failureGenContext.modalContext.failureGenData.alias()}`}
                    </h2>
                </div>
                {RearmSettingsUI(failureGenContext.modalContext.failureGenData, genNumber, setNewSetting, failureGenContext)}
            </div>
            <div className="flex flex-row justify-start items-stretch mt-1">
                { failureGenContext.modalContext.failureGenData.generatorSettingComponents(genNumber, failureGenContext.modalContext.failureGenData, failureGenContext) }
            </div>
        </div>
    );
}

function ArmedState(generatorSettings : FailureGenData, genNumber : number) {
    switch (generatorSettings.settings[generatorSettings.numberOfSettingsPerGenerator * genNumber]) {
    case 0: return (<div className="bg-theme-body">Disarmed</div>);
    case 1: return (<div className="text-black bg-colors-yellow">Armed (once)</div>);
    case 2: return (<div className="text-black bg-colors-yellow">Armed at Take-Off</div>);
    case 3: return (<div className="text-black bg-colors-yellow">Armed</div>);
    default: return (<></>);
    }
}

function FailureShortList(failureGenContext: FailureGenContext, uniqueID : string) {
    const maxNumberOfFailureToDisplay = 4;
    const listOfSelectedFailures = findGeneratorFailures(failureGenContext.allFailures, failureGenContext.generatorFailuresGetters, uniqueID);
    if (listOfSelectedFailures.length === failureGenContext.allFailures.length) {
        return <div>All failures assigned</div>;
    }
    if (listOfSelectedFailures.length === 0) return <div>No failure assigned</div>;
    const subSetOfSelectedFailures = listOfSelectedFailures.slice(0, Math.min(maxNumberOfFailureToDisplay - 1, listOfSelectedFailures.length));
    const listToDisplay = subSetOfSelectedFailures.map((failure) => <div>{failure.name}</div>);
    return (
        <>
            {listToDisplay}
            {listOfSelectedFailures.length >= maxNumberOfFailureToDisplay ? (<div>...</div>) : <></>}
        </>
    );
}

export function FailureGeneratorCardTemplateUI(
    genNumber : number,
    failureGenData : FailureGenData,
    failureGenContext: FailureGenContext,
) {
    const genUniqueID = `${failureGenData.uniqueGenPrefix}${genNumber.toString()}`;
    return (
        <div className="flex flex-row flex-1 justify-between px-2 pt-2 my-2 text-center rounded-md border-2 border-solid border-theme-accent mx-x">
            <div className="mr-4 w-1/3 text-left align-left">
                <div className="pb-2">
                    <h2>
                        {`${genUniqueID} : ${failureGenData.alias()}`}
                    </h2>
                </div>
                {FailureShortList(failureGenContext, genUniqueID)}
            </div>
            {ArmedState(failureGenData, genNumber)}
            <div className="flex flex-col justify-between">
                <div
                    onClick={() => eraseGenerator(genNumber, failureGenData, failureGenContext)}
                    className="flex-none p-2 rounded-md text-utility-red bg-theme-accent hover:text-theme-body hover:bg-utility-red"
                >
                    <Trash size={26} />
                </div>
                <div />
                <div
                    className="flex-1 px-8 py-1 ml-2 align-baseline rounded-md transition duration-100 border-2 text-theme-text bg-theme-accent
                        border-theme-accent hover:text-theme-body hover:bg-theme-highlight"
                    onClick={() => {
                        failureGenContext.setFailureGenModalType(ModalGenType.Settings);
                        const test : ModalContext = { failureGenData, genNumber, genUniqueID };
                        failureGenContext.setModalContext(test);
                    }}
                >
                    Change settings
                </div>
                <div
                    className="flex-1 px-8 py-1 ml-2 align-baseline rounded-md transition duration-100 border-2 text-theme-text bg-theme-accent
                        border-theme-accent hover:text-theme-body hover:bg-theme-highlight"
                    onClick={() => {
                        failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                        const test : ModalContext = { failureGenData, genNumber, genUniqueID };
                        failureGenContext.setModalContext(test);
                    }}
                >
                    Assign failures
                </div>
            </div>
        </div>

    );
}

type SettingVar = {
    settingVar: number,
}

const rearmButtons: (ButtonType & SettingVar)[] = [
    { name: t('Failures.Generators.Off'), setting: 'OFF', settingVar: 0 },
    { name: t('Failures.Generators.Once'), setting: 'Once', settingVar: 1 },
    { name: t('Failures.Generators.TakeOff'), setting: 'Take-Off', settingVar: 2 },
    { name: t('Failures.Generators.Repeat'), setting: 'Repeat', settingVar: 3 },
];

export function RearmSettingsUI(generatorSettings: FailureGenData, genID: number,
    setNewSetting : (newSetting: number, generatorSettings : FailureGenData, genID : number, settingIndex : number) => void,
    failureGenContext : FailureGenContext) {
    return (
        <div className="flex flex-col text-center">
            <div className="pb-2"><h2>{t('Failures.Generators.Rearming')}</h2></div>
            <div className="flex flex-row">
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

export function FailureGeneratorSingleSetting(title:string, width : number,
    unit : string, min:number, max:number,
    value: number, mult : number,
    last : boolean, setNewSetting : (newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    generatorSettings : FailureGenData, genIndex : number, settingIndex : number, failureGenContext : FailureGenContext) {
    const multCheck = mult === 0 ? 1 : mult;
    return (
        <div
            className={`flex flex-col justify-between p-2 text-left ${last ? '' : 'border-r-2 border-r-theme-accent'}`}
        >
            <div className="flex-1 align-top break-keep">{title}</div>
            <div className="flex flex-row items-center ">
                <SimpleInput
                    className={`my-2 w-${width} font-mono`}
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
        </div>
    );
}

export function FailureGeneratorText(title:string, text: string, last : boolean) {
    return (
        <div
            className={`flex flex-col justify-between p-2 text-left ${last ? '' : 'border-r-2 border-r-theme-accent'}`}
        >
            <div className="flex-1 align-top break-keep ">{title}</div>
            <div className="pt-1.5 pb-3.5 align-top break-keep">
                {text}
            </div>
        </div>
    );
}
