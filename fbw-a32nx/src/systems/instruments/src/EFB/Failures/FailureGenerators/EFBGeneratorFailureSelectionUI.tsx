// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { FailureGenContext, ModalGenType, findGeneratorFailures, sendFailurePool } from 'instruments/src/EFB/Failures/FailureGenerators/EFBRandomFailureGen';
import { getGeneratorFailurePool, setSelectedFailure } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureSelectionFunctions';
import { Failure } from 'failures/src/failures-orchestrator';
import { AtaChapterNumber, AtaChaptersTitle } from '@flybywiresim/fbw-sdk';
import { t } from 'instruments/src/EFB/translation';
import { useEventBus } from 'instruments/src/EFB/event-bus-provider';
import { CheckSquareFill, DashSquare, Square } from 'react-bootstrap-icons';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { useModals } from '../../UtilComponents/Modals/Modals';

interface FailureAtaListProps {
    failureGenContext: FailureGenContext,
    chapter: AtaChapterNumber,
    generatorFailureTable: Failure[],
}

const FailureAtaList: React.FC<FailureAtaListProps> = ({ failureGenContext, chapter, generatorFailureTable }) => {
    const { allFailures } = useFailuresOrchestrator();
    const bus = useEventBus();

    const selectOneFailure = (failure: Failure, failureGenContext: FailureGenContext, active: boolean): void => {
        setSelectedFailure(failure, failureGenContext.modalContext.genUniqueID, failureGenContext, active);
        sendFailurePool(failureGenContext.modalContext.genLetter,
            failureGenContext.modalContext.genNumber,
            getGeneratorFailurePool(failureGenContext.modalContext.genUniqueID, Array.from(allFailures)),
            bus);
    };

    const ATAList: JSX.Element[] = allFailures.map<JSX.Element>((failure) => {
        if (failure.ata === chapter) {
            const active = generatorFailureTable.find((genFailure) => failure.identifier === genFailure.identifier) !== undefined;

            return (
                <div
                    className="justify flex flex-row pt-2"
                >
                    <Toggle
                        value={active}
                        onToggle={() => {
                            selectOneFailure(failure, failureGenContext, !active);
                            failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                        }}
                    />
                    <div className="pl-8">{failure.name}</div>
                </div>
            );
        }
        return (<></>);
    });

    return (
        <>
            {...ATAList}
        </>
    );
};

export interface GeneratorFailureSelectionProps {
    failureGenContext: FailureGenContext,
}

export const GeneratorFailureSelection: React.FC<GeneratorFailureSelectionProps> = ({ failureGenContext }): JSX.Element => {
    const { allFailures } = useFailuresOrchestrator();
    const { popModal } = useModals();
    const bus = useEventBus();

    const generatorFailureTable: Failure[] = findGeneratorFailures(allFailures, failureGenContext.generatorFailuresGetters, failureGenContext.modalContext.genUniqueID);

    failureGenContext.setFailureGenModalType(ModalGenType.None);
    failureGenContext.setFailureGenModalCurrentlyDisplayed(ModalGenType.Failures);

    const selectAllFailures = (failureGenContext: FailureGenContext, value: boolean): void => {
        for (const failure of allFailures) {
            setSelectedFailure(failure, failureGenContext.modalContext.genUniqueID, failureGenContext, value);
        }
        sendFailurePool(failureGenContext.modalContext.genLetter,
            failureGenContext.modalContext.genNumber,
            getGeneratorFailurePool(failureGenContext.modalContext.genUniqueID, Array.from(allFailures)),
            bus);
    };

    const selectAllFailureChapter = (chapter: number, failureGenContext: FailureGenContext, value: boolean): void => {
        for (const failure of allFailures) {
            if (failure.ata === chapter) {
                setSelectedFailure(failure, failureGenContext.modalContext.genUniqueID, failureGenContext, value);
            }
        }
        sendFailurePool(failureGenContext.modalContext.genLetter,
            failureGenContext.modalContext.genNumber,
            getGeneratorFailurePool(failureGenContext.modalContext.genUniqueID, Array.from(allFailures)),
            bus);
    };

    let selectIcon;
    if (generatorFailureTable.length === allFailures.length) {
        selectIcon = <CheckSquareFill />;
    } else if (generatorFailureTable.length === 0) {
        selectIcon = <Square />;
    } else selectIcon = <DashSquare />;

    return (
        <div className="bg-theme-body border-theme-accent flex w-3/4 flex-col items-stretch justify-between border-2 px-8 py-2">
            <div className="bg-theme-body flex flex-row items-start justify-between ">
                <div className="space-x-3 text-left">
                    <h1 className="font-bold text-current">
                        {t('Failures.Generators.FailureSelection')}
                    </h1>
                </div>
                <div />
                <div
                    className="text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body border-utility-red flex-none items-center justify-center
                    rounded-md border-2 px-4 py-2 text-center transition duration-100
                    "
                    onClick={() => {
                        failureGenContext.setFailureGenModalCurrentlyDisplayed(ModalGenType.None);
                        popModal();
                    }}
                >
                    X
                </div>
            </div>
            <div className="mx-10 mb-2 flex w-full flex-row justify-between">
                <div className="text-left">{t('Failures.Generators.FailureSelectionText')}</div>
            </div>
            <ScrollableContainer height={48}>
                <div>
                    <div
                        className="ml-10 flex flex-row place-items-center justify-start pt-4"
                    >
                        <div
                            className="text-theme-text hover:text-theme-secondary hover:bg-theme-highlight my-2 mr-6"
                            onClick={() => {
                                if (generatorFailureTable.length === allFailures.length) selectAllFailures(failureGenContext, false);
                                else selectAllFailures(failureGenContext, true);
                                failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                            }}
                        >
                            {selectIcon}
                        </div>
                        <div><h1>{t('Failures.Generators.AllSystems')}</h1></div>
                    </div>
                </div>
                <div className="ml-10 grid grid-flow-dense grid-cols-2">
                    { failureGenContext.reducedAtaChapterNumbers.map<JSX.Element>((chapter) => {
                        let chaptersSelectionIcon;
                        const failuresActiveInChapter = generatorFailureTable.filter((failure) => failure.ata === chapter);
                        if (failuresActiveInChapter.length === allFailures.filter((failure) => failure.ata === chapter).length) chaptersSelectionIcon = <CheckSquareFill />;
                        else if (failuresActiveInChapter.length === 0) chaptersSelectionIcon = <Square />;
                        else chaptersSelectionIcon = <DashSquare />;
                        return (
                            <div>
                                <div
                                    className="flex flex-row place-items-center justify-start pt-4"
                                >
                                    <div
                                        className="hover:bg-theme-highlight hover:text-theme-secondary text-theme-text hover:text-theme-secondary my-2 mr-6"
                                        onClick={() => {
                                            if (failuresActiveInChapter.length === allFailures.filter((failure) => failure.ata === chapter).length) {
                                                selectAllFailureChapter(chapter, failureGenContext, false);
                                            } else selectAllFailureChapter(chapter, failureGenContext, true);
                                            failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                                        }}
                                    >
                                        {chaptersSelectionIcon}
                                    </div>
                                    <div><h1>{AtaChaptersTitle[chapter]}</h1></div>
                                </div>
                                <FailureAtaList failureGenContext={failureGenContext} generatorFailureTable={generatorFailureTable} chapter={chapter} />
                            </div>
                        );
                    })}
                </div>
            </ScrollableContainer>
        </div>
    );
};
