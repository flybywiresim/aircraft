import React, { useState } from 'react';
import { SelectInput } from 'instruments/src/EFB/UtilComponents/Form/SelectInput/SelectInput';
import { t } from 'instruments/src/EFB/translation';
import {
    eraseGenerator, FailureGenContext, FailureGenData,
    failureGeneratorAdd, failureGeneratorsSettings, ModalContext, ModalGenType,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { ExclamationDiamond, PlusLg, Sliders2Vertical, Trash } from 'react-bootstrap-icons';
import { AtaChapterNumber, AtaChaptersTitle } from '@flybywiresim/fbw-sdk';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { GeneratorFailureSelection } from './GeneratorFailureSelectionUI';
import { FailureGeneratorDetailsModalUI, ArmedState } from './FailureGeneratorSettingsUI';

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

function FailureShortList(failureGenContext: FailureGenContext, uniqueID : string) {
    const maxNumberOfFailureToDisplay = 4;
    let listOfSelectedFailures = findGeneratorFailures(failureGenContext.allFailures, failureGenContext.generatorFailuresGetters, uniqueID);

    if (listOfSelectedFailures.length === failureGenContext.allFailures.length) {
        return <div className="p-1 mb-1 rounded-md bg-theme-accent">{t('Failures.Generators.AllFailures')}</div>;
    }
    if (listOfSelectedFailures.length === 0) return <div className="p-1 mb-1 rounded-md bg-theme-accent">{t('Failures.Generators.NoFailure')}</div>;

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
