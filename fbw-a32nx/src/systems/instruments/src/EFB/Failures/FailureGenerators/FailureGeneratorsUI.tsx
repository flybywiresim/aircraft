import React, { useState } from 'react';
import { SelectInput } from 'instruments/src/EFB/UtilComponents/Form/SelectInput/SelectInput';
import { t } from 'instruments/src/EFB/translation';
import {
    eraseGenerator, FailureGenContext, FailureGenData,
    failureGeneratorAdd, failureGeneratorsSettings, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { findGeneratorFailures, setSelectedFailure } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { ArrowLeft, Trash } from 'react-bootstrap-icons';
import { SelectGroup, SelectItem } from 'instruments/src/EFB/UtilComponents/Form/Select';
import { ButtonType } from 'instruments/src/EFB/Settings/Settings';
import { ModalContextInterface } from 'instruments/src/EFB/UtilComponents/Modals/Modals';
import { Failure } from 'failures/src/failures-orchestrator';
import { Link, Route } from 'react-router-dom';
import { AtaChapterNumber, AtaChaptersTitle } from '@shared/ata';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

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
                                displayValue: `${genSetting.alias}`,
                            }))}
                            maxHeight={32}
                        />
                        <button
                            onClick={() => failureGeneratorAdd(settings.allGenSettings.get(chosenGen))}
                            type="button"
                            className="flex-none py-2 px-2 mr-4 text-center rounded-md bg-theme-accent hover:bg-theme-highlight"
                        >
                            <h2>{t('Failures.Generators.Add')}</h2>
                        </button>
                    </div>
                    <div className="flex items-center">
                        <div className="mr-2">Max number of simultaneous failures:</div>
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

function GeneratorFailureSelection(genID: string, failureGenContext: FailureGenContext): JSX.Element {
    const generatorFailureTable :Failure[] = findGeneratorFailures(failureGenContext.allFailures, failureGenContext.generatorFailuresGetters, genID);

    return (
        <div className="flex flex-col justify-center items-start py-2 px-8 w-full border-2 bg-theme-body border-theme-accent">
            <Link to="/failures/failuregenerators/" className="inline-block w-full">
                <div className="flex flex-row items-start space-x-3 text-left transition duration-100 hover:text-theme-highlight">
                    <ArrowLeft size={30} />
                    <h1 className="font-bold text-current">
                        Failure pool selection
                    </h1>
                </div>
            </Link>
            <div className="w-full text-left">
                <p>Select the failures that may be triggered by this failure generator</p>
            </div>
            <ScrollableContainer height={48}>
                {
                    failureGenContext.chapters.map<JSX.Element>((chapter) => (
                        <div>
                            <div className="ml-10"><u>{AtaChaptersTitle[chapter]}</u></div>
                            {FailureATAList(failureGenContext, generatorFailureTable, genID, chapter)}
                        </div>
                    ))
                }
            </ScrollableContainer>
        </div>
    );
}

function FailureATAList(failureGenContext:FailureGenContext, generatorFailureTable :Failure[], genID: string, chapter : AtaChapterNumber) {
    const bibi : JSX.Element[] = failureGenContext.allFailures.map<JSX.Element>((failure) => {
        if (failure.ata === chapter) {
            const active = generatorFailureTable.find((genFailure) => failure.identifier === genFailure.identifier) !== undefined;
            return (
                <div
                    className="flex flex-row justify"
                >
                    <Toggle
                        value={active}
                        onToggle={() => {
                            setSelectedFailure(failure, genID, failureGenContext, !active);
                        }}
                    />
                    <div className="pl-8"><h2>{failure.name}</h2></div>
                </div>
            );
        }
        return (<></>);
    });

    return (
        <>
            {bibi}
        </>
    );
}

export function FailureGeneratorCardTemplateUI(
    genID : number,
    generatorSettings : FailureGenData,
    settingTable : JSX.Element[],
    failureGenContext: FailureGenContext,
) {
    const generatorUniqueID = `${generatorSettings.uniqueGenPrefix}${genID.toString()}`;

    return (
        <div className="flex flex-col flex-1 py-2 px-2 my-2 text-center rounded-md border-2 border-solid border-theme-accent mx-x">
            <div className="flex flex-row justify-between">
                <div className="mr-4 w-1/3 text-left align-left">
                    <h2>
                        {`${generatorUniqueID} : ${generatorSettings.alias}`}
                    </h2>

                    <Link to="/failures/failuregenerators/generatorFailureSelect" className="inline-block">
                        <div
                            className="flex-1 px-8 py-2 mr-4 h-10 rounded-md transition duration-100 border-2 text-theme-text hover:text-theme-highlight bg-theme-accent hover:bg-theme-body
                        border-theme-accent hover:border-theme-highlight"
                            onClick={() => {
                                failureGenContext.setGeneratorNameArgument(generatorUniqueID);
                            }}
                        >
                            {`Failures assigned: ${findGeneratorFailures(failureGenContext.allFailures, failureGenContext.generatorFailuresGetters, generatorUniqueID).length}
                        / ${failureGenContext.allFailures.length}`}
                        </div>
                    </Link>
                </div>
                {RearmSettingsUI(generatorSettings, genID, setNewSetting)}
                <button
                    type="button"
                    onClick={() => eraseGenerator(genID, generatorSettings)}
                    className="flex-none mr-4 w-10 h-10 rounded-md bg-theme-accent hover:bg-utility-red"
                >
                    <Trash size={26} />
                </button>
            </div>
            <div className="flex flex-row justify-between">
                { settingTable }
            </div>
        </div>
    );
}

type SettingVar = {
    settingVar: number,
}

const rearmButtons: (ButtonType & SettingVar)[] = [
    { name: 'OFF', setting: 'OFF', settingVar: 0 },
    { name: 'Once', setting: 'Once', settingVar: 1 },
    { name: 'Take-Off', setting: 'Take-Off', settingVar: 2 },
    { name: 'Always', setting: 'Always', settingVar: 3 },
];

export function RearmSettingsUI(generatorSettings: FailureGenData, genID: number,
    setNewSetting : (newSetting: number, generatorSettings : FailureGenData, genID : number, settingIndex : number) => void) {
    return (
        <div className="flex flex-col text-center">
            <h2>Rearming</h2>
            <div className="flex flex-row">
                <SelectGroup>
                    {rearmButtons.map((button) => (
                        <SelectItem
                            key={button.name}
                            onSelect={() => {
                                setNewSetting(button.settingVar, generatorSettings, genID, 0);
                            }}
                            selected={generatorSettings.settings[genID * generatorSettings.numberOfSettingsPerGenerator + 0] === button.settingVar}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </div>
        </div>
    );
}

export function FailureGeneratorFailureSetting(title:string, width : number,
    unit : string, min:number, max:number,
    value: number, mult : number,
    last : boolean, setNewSetting : (newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) => void,
    generatorSettings : FailureGenData, genIndex : number, settingIndex : number, modal : ModalContextInterface) {
    const multCheck = mult === 0 ? 1 : mult;
    return (
        <div
            className={`flex flex-col justify-between p-2 text-left ${last ? '' : 'border-r-2 border-r-theme-accent'}`}
        >
            <div className="break-keep">{title}</div>
            <div className="flex flex-row items-center">
                <div
                    className={`my-2 w-${width} font-mono text-2xl px-3 py-1.5 rounded-md border-2 transition duration-100
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
            <h1 className="font-bold">New Setting</h1>
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
                    Close
                </div>
            </div>
        </div>

    );
}
