import React, { useState } from 'react';
import { SelectInput } from 'instruments/src/EFB/UtilComponents/Form/SelectInput/SelectInput';
import { t } from 'instruments/src/EFB/translation';
import {
    eraseGenerator, FailureGenContext, FailureGenData,
    failureGeneratorAdd, failureGeneratorsSettings, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { Trash } from 'react-bootstrap-icons';
import { SelectGroup, SelectItem } from 'instruments/src/EFB/UtilComponents/Form/Select';
import { ButtonType } from 'instruments/src/EFB/Settings/Settings';
import { ModalContextInterface } from 'instruments/src/EFB/UtilComponents/Modals/Modals';
import { Link, Route } from 'react-router-dom';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { GeneratorFailureSelection } from './GeneratorFailureSelectionUI';

export const FailureGeneratorsUI = () => {
    const [chosenGen, setChosenGen] = useState<string>();
    const settings = failureGeneratorsSettings();
    return (
        <>
            <Route exact path="/failures/failuregenerators/">
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
            </Route>
            <Route exact path="/failures/failuregenerators/generatorFailureSelect">
                {GeneratorFailureSelection(settings.generatorNameArgument, settings)}
            </Route>
        </>
    );
};

export const generatorsCardList : (settings : FailureGenContext)
=> JSX.Element[] = (settings : FailureGenContext) => {
    const temp : JSX.Element[] = [];
    settings.allGenSettings.forEach((generatorSetting) => {
        const nbGenerator = Math.floor(generatorSetting.settings.length / generatorSetting.numberOfSettingsPerGenerator);
        for (let i = 0; i < nbGenerator; i++) {
            temp.push(generatorSetting.FailureGeneratorCard(i, generatorSetting, settings));
        }
    });
    return temp;
};

export function FailureGeneratorCardTemplateUI(
    genID : number,
    generatorSettings : FailureGenData,
    settingTable : JSX.Element[],
    failureGenContext: FailureGenContext,
) {
    const generatorUniqueID = `${generatorSettings.uniqueGenPrefix}${genID.toString()}`;

    return (
        <div className="flex flex-col flex-1 px-2 pt-2 my-2 text-center rounded-md border-2 border-solid border-theme-accent mx-x">
            <div className="flex flex-row justify-between">
                <div className="mr-4 w-1/3 text-left align-left">
                    <h2>
                        {`${generatorUniqueID} : ${generatorSettings.alias()}`}
                    </h2>

                    <Link to="/failures/failuregenerators/generatorFailureSelect" className="inline-block">
                        <div
                            className="flex-1 px-8 py-1 ml-2 align-baseline rounded-md transition duration-100 border-2 text-theme-text bg-theme-accent
                        border-theme-accent hover:text-theme-body hover:bg-theme-highlight"
                            onClick={() => {
                                failureGenContext.setGeneratorNameArgument(generatorUniqueID);
                            }}
                        >
                            {`${
                                t('Failures.Generators.FailuresAssigned')
                            }: ${
                                findGeneratorFailures(failureGenContext.allFailures, failureGenContext.generatorFailuresGetters, generatorUniqueID).length
                            }
                        / ${failureGenContext.allFailures.length}`}
                        </div>
                    </Link>
                </div>
                {RearmSettingsUI(generatorSettings, genID, setNewSetting)}
                <div className="flex flex-col justify-between">
                    <div
                        onClick={() => eraseGenerator(genID, generatorSettings, failureGenContext)}
                        className="flex-none p-2 rounded-md text-utility-red bg-theme-accent hover:text-theme-body hover:bg-utility-red"
                    >
                        <Trash size={26} />
                    </div>
                    <div />
                </div>
            </div>
            <div className="flex flex-row justify-start items-stretch mt-1">
                { settingTable }
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
    setNewSetting : (newSetting: number, generatorSettings : FailureGenData, genID : number, settingIndex : number) => void) {
    return (
        <div className="flex flex-col text-center">
            <h2>{t('Failures.Generators.Rearming')}</h2>
            <div className="flex flex-row">
                <SelectGroup>
                    {rearmButtons.map((button) => {
                        if (button.setting !== 'Take-Off' || generatorSettings.disableTakeOffRearm === false) {
                            return (
                                <SelectItem
                                    key={button.setting}
                                    onSelect={() => {
                                        setNewSetting(button.settingVar, generatorSettings, genID, 0);
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
    generatorSettings : FailureGenData, genIndex : number, settingIndex : number, modal : ModalContextInterface) {
    const multCheck = mult === 0 ? 1 : mult;
    return (
        <div
            className={`flex flex-col justify-between p-2 text-left ${last ? '' : 'border-r-2 border-r-theme-accent'}`}
        >
            <div className="flex-none break-keep">{title}</div>
            <div className="flex flex-row items-center">
                <div
                    className={`my-2 w-${width} font-mono text-2xl px-3 pt-1.5 rounded-md border-2 transition duration-100
                    focus-within:outline-none focus-within:border-theme-highlight
                    placeholder-theme-unselected bg-theme-accent border-theme-accent text-theme-text hover:bg-theme-body
                     hover:border-theme-highlight`}
                    onClick={() => {
                        modal.showModal(ModalSimpleInput(value, multCheck, title, width, unit, min, max, setNewSetting, generatorSettings, genIndex, settingIndex, modal));
                    }}
                >
                    {value * multCheck}
                </div>
                <div className="ml-2">{unit}</div>
            </div>
        </div>
    );
}

export function FailureGeneratorText(title:string, text: string, last : boolean) {
    return (
        <div
            className={`flex flex-col justify-between p-2 text-left my-2 ${last ? '' : 'border-r-2 border-r-theme-accent'}`}
        >
            <div className="flex-none break-keep">{title}</div>
            <div className="flex-none pt-6 pb-1.5 break-keep">
                {text}
            </div>
        </div>
    );
}

function ModalSimpleInput(
    value : number,
    multCheck : number,
    title:string,
    width : number,
    unit : string,
    min:number,
    max:number,
    setNewSetting : (newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    generatorSettings : FailureGenData,
    genIndex : number,
    settingIndex : number,
    modal : ModalContextInterface,
) {
    return (
        <div className="p-8 w-5/12 rounded-xl border-2 bg-theme-body border-theme-accent">
            <h1 className="font-bold">{t('Failures.Generators.NewSetting')}</h1>
            <div className="flex flex-col justify-between p-2 text-left">
                <div className="break-keep">{title}</div>
                <div className="flex flex-row items-center">
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
                            }
                        }}
                    />
                    <div className="ml-2">{unit}</div>
                </div>
            </div>
            <div className="flex flex-row mt-8 space-x-4">
                <div
                    className="flex justify-center items-center py-2 px-8 w-full text-center rounded-md border-2
                    transition duration-100 text-theme-text hover:text-theme-highlight bg-theme-accent hover:bg-theme-body
                    border-theme-accent hover:border-theme-highlight"
                    onClick={() => modal.popModal()}
                >
                    {t('Failures.Generators.Close')}
                </div>
            </div>
        </div>

    );
}
