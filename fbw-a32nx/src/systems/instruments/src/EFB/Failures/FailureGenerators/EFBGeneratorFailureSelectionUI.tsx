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
                    onClick={() => popModal()}
                >
                    X
                </div>
            </div>
            <div className="mb-2 ml-10 flex w-full flex-row justify-between">
                <div className="text-left">{t('Failures.Generators.FailureSelectionText')}</div>
                <div
                    className="mr-10 flex flex-row"
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
                <div className="grid grid-flow-dense grid-cols-2">
                    {failureGenContext.reducedAtaChapterNumbers.map<JSX.Element>((chapter) => (
                        <div>
                            <div
                                className="ml-10 flex flex-row justify-start pt-4"
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
