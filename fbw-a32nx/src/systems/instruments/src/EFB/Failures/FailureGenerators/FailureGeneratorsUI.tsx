import React, { useState } from 'react';
import { SelectInput } from 'instruments/src/EFB/UtilComponents/Form/SelectInput/SelectInput';
import { t } from 'instruments/src/EFB/translation';
import { addGenerator, failureGeneratorNames, failureGeneratorsSettings, generatorsCardList } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { Trash } from 'react-bootstrap-icons';
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
                        className="flex-none w-72 h-10"
                        value={chosenGen}
                        onChange={(value) => setChosenGen(value as string)}
                        options={failureGeneratorNames.map((option) => ({
                            value: option.name,
                            displayValue: `${option.alias}`,
                        }))}
                        maxHeight={32}
                    />
                    <button
                        onClick={addGenerator(chosenGen, settings)}
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
                    {generatorsCardList(settings)}
                </ScrollableContainer>
            </div>
        </>
    );
};

export function FailureGeneratorCardTemplateUI(
    genID : number,
    generatorSettings : any,
    genName : string,
    uniqueGenPrefix : string,
    numberOfSettingsPerGenerator : number,
    setNewSetting : (newSetting: number, generatorSettings : any, genID : number, settingIndex : number)=>void,
    eraseGenerator : (genID : number, generatorSettings : any)=>void,
    settingTable : JSX.Element[],
    settings : number[],
) {
    return (
        <div className="flex flex-col flex-1 py-2 px-2 my-2 text-center rounded-md border-2 border-solid border-theme-accent mx-x">
            <div className="flex flex-row justify-between item-center">
                <div className="mr-4 align-left">
                    <h2>
                        {`${uniqueGenPrefix}${genID.toString()} : ${genName.toString()}`}
                    </h2>
                </div>
                {RearmSettingsUI(generatorSettings, genID, settings, numberOfSettingsPerGenerator, setNewSetting)}
                <button
                    type="button"
                    onClick={() => eraseGenerator(genID, generatorSettings)}
                    className="flex-none mr-4 w-10 h-10 text-center rounded-md bg-theme-accent item-center hover:bg-utility-red"
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

export enum ButtonPosition {Left =0, Middle=1, Right=2}

export function RearmSettingsUI(generatorSettings: any, genID: number, settings : number[],
    numberOfSettingsPerGenerator : number,
    setNewSetting : (newSetting: number, generatorSettings : any, genID : number, settingIndex : number) => void) {
    return (
        <div className="flex flex-col text-center">
            <h2>Rearming</h2>
            <div className="flex flex-row">
                {[RearmButtonUI(setNewSetting, 'OFF', 0, generatorSettings, genID, settings, numberOfSettingsPerGenerator, ButtonPosition.Left),
                    RearmButtonUI(setNewSetting, 'Once', 1, generatorSettings, genID, settings, numberOfSettingsPerGenerator, ButtonPosition.Middle),
                    RearmButtonUI(setNewSetting, 'Take-Off', 2, generatorSettings, genID, settings, numberOfSettingsPerGenerator, ButtonPosition.Middle),
                    RearmButtonUI(setNewSetting, 'Always', 3, generatorSettings, genID, settings, numberOfSettingsPerGenerator, ButtonPosition.Right),
                ]}
            </div>
        </div>
    );
}

function RearmButtonUI(setNewSetting: (newSetting: number, generatorSettings: any, genID: number, settingIndex: number) => void,
    text:string, buttonID: number, generatorSettings: any, genID: number, settings: number[],
    numberOfSettingsPerGenerator: number, position : ButtonPosition) {
    let format : string;
    switch (position) {
    case ButtonPosition.Left: format = 'border-r-2 border-solid rounded-l-md';
        break;
    case ButtonPosition.Middle: format = 'border-r-2 border-solid';
        break;
    case ButtonPosition.Right: format = 'rounded-r-md';
        break;
    default: format = '';
    }
    return (
        <button
            type="button"
            onClick={() => setNewSetting(buttonID, generatorSettings, genID, 0)}
            className={`py-2 px-2 mx-0 text-center border-theme-highlight hover:bg-theme-highlight ${format}
            ${
        settings[genID * numberOfSettingsPerGenerator + 0] === buttonID ? 'bg-theme-highlight' : 'bg-theme-accent'
        }`}
        >
            <h2>{text}</h2>
        </button>
    );
}
