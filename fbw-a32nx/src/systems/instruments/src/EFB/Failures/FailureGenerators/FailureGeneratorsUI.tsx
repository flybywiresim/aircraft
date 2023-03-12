import React, { useState } from 'react';
import { SelectInput } from 'instruments/src/EFB/UtilComponents/Form/SelectInput/SelectInput';
import { t } from 'instruments/src/EFB/translation';
import {
    eraseGenerator, FailureGenData,
    failureGeneratorAdd, failureGeneratorsSettings, setNewSetting,
} from 'instruments/src/EFB/Failures/RandomFailureGen';
import { Trash } from 'react-bootstrap-icons';
import { SelectGroup, SelectItem } from 'instruments/src/EFB/UtilComponents/Form/Select';
import { ButtonType } from 'instruments/src/EFB/Settings/Settings';
import { ModalContextInterface } from 'instruments/src/EFB/UtilComponents/Modals/Modals';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

export const FailureGeneratorsUI = () => {
    const [chosenGen, setChosenGen] = useState<string>();
    const settings = failureGeneratorsSettings();
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
                        className="my-2 w-10 font-mono"
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
                    {generatorsCardList(settings.allGenSettings, settings.modals)}
                </ScrollableContainer>
            </div>
        </>
    );
};

export const generatorsCardList : (generatorSettings : Map<string, FailureGenData>, modal : ModalContextInterface)
=> JSX.Element[] = (generatorSettings : Map<string, FailureGenData>, modal : ModalContextInterface) => {
    const temp : JSX.Element[] = [];
    generatorSettings.forEach((generatorSetting) => {
        const nbGenerator = Math.floor(generatorSetting.settings.length / generatorSetting.numberOfSettingsPerGenerator);
        for (let i = 0; i < nbGenerator; i++) {
            temp.push(generatorSetting.FailureGeneratorCard(i, generatorSetting, modal));
        }
    });
    return temp;
};

export function FailureGeneratorCardTemplateUI(
    genID : number,
    generatorSettings : FailureGenData,
    settingTable : JSX.Element[],
) {
    return (
        <div className="flex flex-col flex-1 py-2 px-2 my-2 text-center rounded-md border-2 border-solid border-theme-accent mx-x">
            <div className="flex flex-row justify-between">
                <div className="mr-4 w-1/3 text-left align-left">
                    <h2>
                        {`${generatorSettings.uniqueGenPrefix}${genID.toString()} : ${generatorSettings.alias}`}
                    </h2>
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
                    placeholder-theme-unselected bg-theme-accent border-theme-accent text-theme-text`}
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
