import React, { useState } from 'react';
import { AtaChaptersTitle } from '@shared/ata';
import { Route } from 'react-router-dom';
import { InfoCircleFill } from 'react-bootstrap-icons';
import { SelectInput } from 'instruments/src/EFB/UtilComponents/Form/SelectInput/SelectInput';
import { t } from 'instruments/src/EFB/translation';
import { addGenerator, failureGeneratorNames, failureGeneratorsSettings, generatorsButtonList } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { CompactUI } from './Pages/Compact';
import { ComfortUI } from './Pages/Comfort';
import { Navbar } from '../UtilComponents/Navbar';
import { useAppDispatch, useAppSelector } from '../Store/store';
import { SimpleInput } from '../UtilComponents/Form/SimpleInput/SimpleInput';
import { PageLink, PageRedirect } from '../Utils/routing';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';
import { setSearchQuery } from '../Store/features/failuresPage';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';

export const FailuresHome = () => {
    const tabs: PageLink[] = [
        { name: 'FailuresList', alias: t('Failures.Title'), component: <Failures /> },
        { name: 'FailureGenerators', alias: t('Failures.Generators.Title'), component: <FailureGeneratorsUI /> },
    ];

    return (
        <>
            <div className="flex flex-row justify-between space-x-4">
                <h1 className="font-bold">{t('Failures.Title')}</h1>
                <div className="flex flex-row items-center py-1 px-4 space-x-2 rounded-md bg-colors-yellow-400">
                    <InfoCircleFill className="text-black" />
                    <div className="text-black">{t('Failures.FullSimulationOfTheFailuresBelowIsntYetGuaranteed')}</div>
                </div>
                <Navbar basePath="/failures" tabs={tabs} className="flex flex-row items-center" />
            </div>

            <Route path="/failures/failureslist">
                <Failures />
            </Route>

            <Route path="/failures/failuregenerators">
                <FailureGeneratorsUI />
            </Route>
            <PageRedirect basePath="/failures" tabs={tabs} />
        </>
    );
};

export const FailureGeneratorsUI = () => {
    const [chosenGen, setChosenGen] = useState<string>();
    const settings = failureGeneratorsSettings();
    return (
        <>
            <div className="flex justify-between py-2 space-x-4">
                <h2>
                    {t('Failures.Generators.Select')}
                </h2>
                <SelectInput
                    className="w-72 h-24"
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
                    className="flex py-2 px-2 mr-4 h-24 text-center rounded-md bg-theme-accent blue"
                >
                    <h2>{t('Failures.Generators.Add')}</h2>
                </button>
            </div>
            <ScrollableContainer height={48}>
                {generatorsButtonList(settings)}
            </ScrollableContainer>
        </>
    );
};

export const Failures = () => {
    const { allFailures } = useFailuresOrchestrator();
    const chapters = Array.from(new Set(allFailures.map((it) => it.ata))).sort((a, b) => a - b);

    const dispatch = useAppDispatch();
    const { searchQuery } = useAppSelector((state) => state.failuresPage);

    const filteredFailures = allFailures.filter((failure) => {
        if (searchQuery === '') {
            return true;
        }

        const failureNameUpper = failure.name.toUpperCase();

        return failureNameUpper.includes(searchQuery)
        || failure.identifier.toString().includes(searchQuery)
        || AtaChaptersTitle[failure.ata].toUpperCase().includes(searchQuery);
    });

    const filteredChapters = chapters.filter((chapter) => filteredFailures.map((failure) => failure.ata).includes(chapter));

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
                    <Navbar basePath="/failures/failureslist" tabs={tabs} />
                </div>

                <Route path="/failures/failureslist/comfort">
                    <ComfortUI filteredChapters={filteredChapters} allChapters={chapters} failures={filteredFailures} />
                </Route>

                <ScrollableContainer height={48}>
                    <Route path="/failures/failureslist/compact">
                        <CompactUI chapters={filteredChapters} failures={filteredFailures} />
                    </Route>
                </ScrollableContainer>
            </div>

            <PageRedirect basePath="/failures/failureslist" tabs={tabs} />
        </>
    );
};
