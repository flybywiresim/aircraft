import React from 'react';
import { AtaChaptersDescription, AtaChaptersTitle, AtaChapterNumber } from '@shared/ata';
import { Link, Route } from 'react-router-dom';
import { InfoCircleFill } from 'react-bootstrap-icons';
import { Failure } from '@flybywiresim/failures';
import { Navbar } from '../UtilComponents/Navbar';
import { useAppDispatch, useAppSelector } from '../Store/store';
import { SimpleInput } from '../UtilComponents/Form/SimpleInput/SimpleInput';
import { FailureButton } from './Pages/Failure';
import { PageLink, PageRedirect, pathify } from '../Utils/routing';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';
import { AtaChapterPage } from './Pages/AtaChapterPage';
import { setSearchQuery } from '../Store/features/failuresPage';

interface ATAFailureCardProps {
    ataNumber: AtaChapterNumber,
    title: string,
    description: string,
}

const ATAChapterCard = ({ ataNumber, description, title }: ATAFailureCardProps) => {
    const { activeFailures, allFailures } = useFailuresOrchestrator();

    const hasActiveFailure = allFailures
        .filter((it) => it.ata === ataNumber)
        .some((it) => activeFailures.has(it.identifier));

    return (
        <Link
            to={`/failures/comfort/${pathify(ataNumber.toString())}`}
            className="flex flex-row p-2 space-x-4 rounded-md border-2 border-transparent transition duration-100 hover:border-theme-highlight"
        >
            <div
                className="flex justify-center items-center w-1/5 text-5xl font-bold rounded-md font-title bg-theme-accent"
            >
                ATA
                {' '}
                {ataNumber}

                <div className="inline-block relative -right-7 bottom-16 w-0 h-0 text-red-500 fill-current">
                    {hasActiveFailure && (
                        <svg style={{ width: '30px', height: '30px' }} viewBox="0 0 20 20">
                            <circle cx={10} cy={10} r={5} />
                        </svg>
                    )}
                </div>
            </div>

            <div className="space-y-2 w-3/4">
                <h1 className="font-bold">
                    {title}
                </h1>
                <p>
                    {description}
                </p>
            </div>
        </Link>
    );
};

interface FailureLayoutUIProps {
    chapters: AtaChapterNumber[];
    failures: Failure[];
}

interface FailureGroupProps {
    title: string;
    failures: Failure[];
}

const FailureGroup = ({ title, failures }: FailureGroupProps) => {
    const { activeFailures, changingFailures, activate, deactivate } = useFailuresOrchestrator();
    const { searchQuery } = useAppSelector((state) => state.failuresPage);

    return (
        <div className="space-y-2">
            <h2>{title}</h2>
            <div className="grid grid-cols-4 auto-rows-auto">
                {failures.map((failure, index) => (
                    <FailureButton
                        name={failure.name}
                        isActive={activeFailures.has(failure.identifier)}
                        isChanging={changingFailures.has(failure.identifier)}
                        highlightedTerm={(() => {
                            const searchQueryIdx = failure.name.toUpperCase().indexOf(searchQuery);

                            if (searchQuery === '' || searchQueryIdx === -1) return undefined;

                            return failure.name.substring(searchQueryIdx, searchQueryIdx + searchQuery.length);
                        })()}
                        onClick={() => {
                            if (!activeFailures.has(failure.identifier)) {
                                activate(failure.identifier);
                            } else {
                                deactivate(failure.identifier);
                            }
                        }}
                        className={`${index && index % 4 !== 0 && 'ml-4'} ${index >= 4 && 'mt-4'} h-36`}
                    />
                ))}
            </div>
        </div>
    );
};

interface CompactUIProps {
    chapters: AtaChapterNumber[];
    failures: Failure[];
}

const CompactUI = ({ chapters, failures }: CompactUIProps) => {
    const { allFailures, activeFailures } = useFailuresOrchestrator();
    const { searchQuery } = useAppSelector((state) => state.failuresPage);

    return (
        <ScrollableContainer height={48}>
            <div className="space-y-8">
                { searchQuery.length === 0 && activeFailures.size !== 0 && (
                    <FailureGroup title="Active Failures" failures={allFailures.filter((failure) => activeFailures.has(failure.identifier))} />
                ) }
                {chapters.map((chapter) => (
                    <FailureGroup title={AtaChaptersTitle[chapter]} failures={failures.filter((failure) => failure.ata === chapter)} />
                ))}
            </div>
        </ScrollableContainer>
    );
};

const ComfortUI = ({ chapters, failures }: FailureLayoutUIProps) => (
    <>
        <Route exact path="/failures/comfort">
            {chapters.map((chapter) => (
                <ATAChapterCard
                    ataNumber={chapter}
                    title={AtaChaptersTitle[chapter]}
                    description={AtaChaptersDescription[chapter]}
                />
            ))}
        </Route>
        {chapters.map((chapter) => (
            <Route path={`/failures/comfort/${chapter.toString()}`}>
                <AtaChapterPage chapter={chapter} failures={failures} />
            </Route>
        ))}
    </>
);

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
        { name: 'Comfort', component: <ComfortUI chapters={filteredChapters} failures={filteredFailures} /> },
        { name: 'Compact', component: <CompactUI chapters={filteredChapters} failures={filteredFailures} /> },
    ];

    return (
        <>
            <div className="flex flex-row justify-between space-x-4">
                <h1 className="font-bold">Failures</h1>

                <div className="flex flex-row items-center py-1 px-4 space-x-2 rounded-md bg-colors-yellow-400">
                    <InfoCircleFill className="text-theme-body" />
                    <p className="text-theme-body">Full simulation of the failures below isn't yet guaranteed.</p>
                </div>
            </div>

            <div className="p-4 mt-4 space-y-4 rounded-lg border-2 border-theme-accent h-content-section-reduced">
                <div className="flex flex-row space-x-4">
                    <SimpleInput
                        placeholder="SEARCH"
                        className="flex-grow uppercase"
                        value={searchQuery}
                        onChange={(value) => dispatch(setSearchQuery(value.toUpperCase()))}
                    />
                    <Navbar basePath="/failures" tabs={tabs} />
                </div>

                <Route path="/failures/comfort">
                    <ComfortUI chapters={filteredChapters} failures={filteredFailures} />
                </Route>
                <Route path="/failures/compact">
                    <CompactUI chapters={filteredChapters} failures={filteredFailures} />
                </Route>
            </div>

            <PageRedirect basePath="/failures" tabs={tabs} />
        </>
    );
};
