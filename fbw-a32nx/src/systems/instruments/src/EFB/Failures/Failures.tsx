// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { AtaChapterNumber, AtaChaptersTitle } from '@flybywiresim/fbw-sdk';
import { Route } from 'react-router-dom';
import { InfoCircleFill } from 'react-bootstrap-icons';
import { t } from 'instruments/src/EFB/translation';
import { Failure } from 'failures/src/failures-orchestrator';
import { CompactUI } from './Pages/Compact';
import { ComfortUI } from './Pages/Comfort';
import { Navbar } from '../UtilComponents/Navbar';
import { useAppDispatch, useAppSelector } from '../Store/store';
import { SimpleInput } from '../UtilComponents/Form/SimpleInput/SimpleInput';
import { PageLink, PageRedirect } from '../Utils/routing';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';
import { setSearchQuery } from '../Store/features/failuresPage';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { FailureGeneratorsUI } from './FailureGenerators/FailureGeneratorsUI';

export const FailuresHome = () => {
    const tabs: PageLink[] = [
        { name: 'Failure-list', alias: t('Failures.Title'), component: <Failures /> },
        { name: 'FailureGenerators', alias: t('Failures.Generators.Title'), component: <FailureGeneratorsUI /> },
    ];

    return (
        <>
            <div className="flex flex-row justify-between space-x-4">
                <h1 className="font-bold">{t('Failures.Title')}</h1>
                <div className="flex flex-row items-center py-1 px-4 space-x-2 bg-yellow-400 rounded-md">
                    <InfoCircleFill className="text-black" />
                    <div className="text-black">{t('Failures.FullSimulationOfTheFailuresBelowIsntYetGuaranteed')}</div>
                </div>
                <Navbar basePath="/failures" tabs={tabs} className="flex flex-row items-center" />
            </div>
            <Route path="/failures/failure-list">
                <Failures />
            </Route>

            <Route path="/failures/failuregenerators">
                <FailureGeneratorsUI />
            </Route>
            <PageRedirect basePath="/failures" tabs={tabs} />
        </>
    );
};

export const Failures = () => {
    const { allFailures } = useFailuresOrchestrator();
    const chapters = Array.from(new Set<AtaChapterNumber>(allFailures.map((it : Failure) => it.ata))).sort((a: AtaChapterNumber, b: AtaChapterNumber) => a - b);

    const dispatch = useAppDispatch();
    const { searchQuery } = useAppSelector((state : any) => state.failuresPage);

    const filteredFailures = allFailures.filter((failure : Failure) => {
        if (searchQuery === '') {
            return true;
        }

        const failureNameUpper = failure.name.toUpperCase();

        return failureNameUpper.includes(searchQuery)
        || failure.identifier.toString().includes(searchQuery)
        || AtaChaptersTitle[failure.ata].toUpperCase().includes(searchQuery);
    });

    const filteredChapters = chapters.filter((chapter) => filteredFailures.map((failure : Failure) => failure.ata).includes(chapter));

    const tabs: PageLink[] = [
        { name: 'Comfort', alias: t('Failures.Comfort.Title'), component: <ComfortUI filteredChapters={filteredChapters} allChapters={chapters} failures={filteredFailures} /> },
        { name: 'Compact', alias: t('Failures.Compact.Title'), component: <CompactUI chapters={filteredChapters} failures={filteredFailures} /> },
    ];

    return (
        <>
            <div className="p-4 mt-4 space-y-4 rounded-lg border-2 h-content-section-reduced border-theme-accent">
                <div className="flex flex-row space-x-4">
                    <SimpleInput
                        placeholder={t('Failures.Search')}
                        className="flex-grow uppercase"
                        value={searchQuery}
                        onChange={(value) => dispatch(setSearchQuery(value.toUpperCase()))}
                    />
                    <Navbar basePath="/failures/failure-list" tabs={tabs} />
                </div>

                <Route path="/failures/failure-list/comfort">
                    <ComfortUI filteredChapters={filteredChapters} allChapters={chapters} failures={filteredFailures} />
                </Route>

                <ScrollableContainer height={48}>
                    <Route path="/failures/failure-list/compact">
                        <CompactUI chapters={filteredChapters} failures={filteredFailures} />
                    </Route>
                </ScrollableContainer>
            </div>

            <PageRedirect basePath="/failures/failure-list" tabs={tabs} />
        </>
    );
};
