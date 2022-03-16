import React from 'react';
import { AtaChaptersDescription, AtaChaptersTitle, AtaChapterNumber } from '@shared/ata';
import { Link } from 'react-router-dom';
import { InfoCircleFill } from 'react-bootstrap-icons';
import { Failure } from '@flybywiresim/failures';
import { useAppDispatch, useAppSelector } from '../Store/store';
import { SimpleInput } from '../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectGroup, SelectItem } from '../UtilComponents/Form/Select';
import { FailureButton } from './Pages/Failure';
import { PageLink, PageRedirect, pathify, TabRoutes } from '../Utils/routing';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';
import { AtaChapterPage } from './Pages/AtaChapterPage';
import { setSearchQuery, setLayoutMode, FailurePageLayoutMode } from '../Store/features/failuresPage';

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
            to={`/failures/${pathify(ataNumber.toString())}`}
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

interface CompactUIProps {
    chapters: AtaChapterNumber[];
    failures: Failure[];
}

const CompactUI = ({ chapters, failures }: CompactUIProps) => {
    const { activeFailures, changingFailures, activate, deactivate } = useFailuresOrchestrator();

    return (
        <div className="space-y-8">
            {chapters.map((chapter) => (
                <div className="space-y-2">
                    <h2>{AtaChaptersTitle[chapter]}</h2>
                    <div className="grid grid-cols-4 auto-rows-auto">
                        {failures.filter((failure) => failure.ata === chapter).map((failure, index) => (
                            <FailureButton
                                name={failure.name}
                                isActive={activeFailures.has(failure.identifier)}
                                isChanging={changingFailures.has(failure.identifier)}
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
            ))}
        </div>
    );
};

interface ComfortableUIProps {
    chapters: AtaChapterNumber[];
}

const ComfortableUI = ({ chapters }: ComfortableUIProps) => (
    <div>
        {chapters.map((chapter) => (
            <ATAChapterCard
                ataNumber={chapter}
                title={AtaChaptersTitle[chapter]}
                description={AtaChaptersDescription[chapter]}
            />
        ))}
    </div>
);

const FailuresHome = () => {
    const { allFailures } = useFailuresOrchestrator();
    const chapters = Array.from(new Set(allFailures.map((it) => it.ata))).sort((a, b) => a - b);

    const dispatch = useAppDispatch();
    const { searchQuery, layoutMode } = useAppSelector((state) => state.failuresPage);

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
                    <SelectGroup>
                        <SelectItem
                            selected={layoutMode === 0}
                            onSelect={() => dispatch(setLayoutMode(FailurePageLayoutMode.COMFORT))}
                        >
                            Comfort
                        </SelectItem>
                        <SelectItem
                            selected={layoutMode === 1}
                            onSelect={() => dispatch(setLayoutMode(FailurePageLayoutMode.COMPACT))}
                        >
                            Compact
                        </SelectItem>
                    </SelectGroup>
                </div>

                <ScrollableContainer height={48}>
                    {layoutMode === 0 ? (
                        <ComfortableUI chapters={filteredChapters} />
                    ) : (
                        <CompactUI chapters={filteredChapters} failures={filteredFailures} />
                    )}
                </ScrollableContainer>
            </div>
        </>
    );
};

export const Failures = () => {
    const { allFailures } = useFailuresOrchestrator();
    const chapters = Array.from(new Set(allFailures.map((it) => it.ata))).sort((a, b) => a - b);

    const tabs: PageLink[] = [
        { name: 'Home', component: <FailuresHome /> },
        ...chapters.map((chapter) => ({ name: chapter.toString(), component: <AtaChapterPage chapter={chapter} /> })),
    ];

    return (
        <>
            <TabRoutes basePath="/failures" tabs={tabs} />
            <PageRedirect basePath="/failures" tabs={tabs} />
        </>
    );
};
