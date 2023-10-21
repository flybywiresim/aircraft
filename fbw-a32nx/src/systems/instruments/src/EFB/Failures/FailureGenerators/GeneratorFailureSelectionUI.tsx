// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { FailureGenContext, ModalGenType, findGeneratorFailures, sendFailurePool } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';
import { getGeneratorFailurePool, setSelectedFailure } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelectionUI';
import { Failure } from 'failures/src/failures-orchestrator';
import { AtaChapterNumber, AtaChaptersTitle } from '@flybywiresim/fbw-sdk';
import { t } from 'instruments/src/EFB/translation';
import { useEventBus } from 'instruments/src/EFB/event-bus-provider';
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
                    className="flex flex-row pt-2 justify"
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

    return (
        <div className="flex flex-col justify-between items-stretch py-2 px-8 w-3/4 border-2 bg-theme-body border-theme-accent">
            <div className="flex flex-row justify-between items-start bg-theme-body ">
                <div className="space-x-3 text-left">
                    <h1 className="font-bold text-current">
                        {t('Failures.Generators.FailureSelection')}
                    </h1>
                </div>
                <div />
                <div
                    className="flex-none justify-center items-center py-2 px-4 text-center rounded-md border-2
                    text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body border-utility-red transition duration-100
                    "
                    onClick={() => popModal()}
                >
                    X
                </div>
            </div>
            <div className="flex flex-row justify-between mb-2 ml-10 w-full">
                <div className="text-left">{t('Failures.Generators.FailureSelectionText')}</div>
                <div
                    className="flex flex-row mr-10"
                >
                    <div className="ml-2"><h2>(</h2></div>
                    <div
                        className="mx-2"
                        onClick={() => {
                            selectAllFailures(failureGenContext, true);
                            failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                        }}
                    >
                        <h2 className="hover:text-theme-highlight"><u>{t('Failures.Generators.All')}</u></h2>
                    </div>
                    <div><h2>/</h2></div>
                    <div
                        className="mx-2"
                        onClick={() => {
                            selectAllFailures(failureGenContext, false);
                            failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                        }}
                    >
                        <h2 className="hover:text-theme-highlight"><u>{t('Failures.Generators.None')}</u></h2>
                    </div>
                    <div className="mr-2"><h2>)</h2></div>
                </div>
            </div>
            <ScrollableContainer height={48}>
                <div className="grid grid-cols-2 grid-flow-dense">
                    {failureGenContext.reducedAtaChapterNumbers.map<JSX.Element>((chapter) => (
                        <div>
                            <div
                                className="flex flex-row justify-start pt-4 ml-10"
                            >
                                <div><h1>{AtaChaptersTitle[chapter]}</h1></div>
                                <div className="ml-2"><h2>(</h2></div>
                                <div
                                    className="mx-2"
                                    onClick={() => {
                                        selectAllFailureChapter(chapter, failureGenContext, true);
                                        failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                                    }}
                                >
                                    <h2 className="hover:text-theme-highlight"><u>{t('Failures.Generators.All')}</u></h2>
                                </div>
                                <div><h2>/</h2></div>
                                <div
                                    className="mx-2"
                                    onClick={() => {
                                        selectAllFailureChapter(chapter, failureGenContext, false);
                                        failureGenContext.setFailureGenModalType(ModalGenType.Failures);
                                    }}
                                >
                                    <h2 className="hover:text-theme-highlight"><u>{t('Failures.Generators.None')}</u></h2>
                                </div>
                                <div className="mr-2"><h2>)</h2></div>
                            </div>
                            <FailureAtaList failureGenContext={failureGenContext} generatorFailureTable={generatorFailureTable} chapter={chapter} />
                        </div>
                    ))}
                </div>
            </ScrollableContainer>
        </div>
    );
};
