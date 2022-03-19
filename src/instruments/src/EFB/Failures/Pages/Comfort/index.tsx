import { AtaChapterNumber, AtaChaptersTitle, AtaChaptersDescription } from '@shared/ata';
import React from 'react';
import { Route } from 'react-router';
import { Link } from 'react-router-dom';
import { Failure } from '@flybywiresim/failures';
import { pathify } from '../../../Utils/routing';
import { AtaChapterPage } from './AtaChapterPage';
import { useFailuresOrchestrator } from '../../../failures-orchestrator-provider';
import { FailureGroup } from '../FailureGroup';
import { ScrollableContainer } from '../../../UtilComponents/ScrollableContainer';
import { useAppSelector } from '../../../Store/store';

interface ATAChapterCardProps {
    ataNumber: AtaChapterNumber,
    title: string,
    description: string,
}

const ATAChapterCard = ({ ataNumber, description, title }: ATAChapterCardProps) => (
    <Link
        to={`/failures/comfort/${pathify(ataNumber.toString())}`}
        className="flex flex-row p-2 space-x-4 rounded-md border-2 border-transparent hover:border-theme-highlight transition duration-100"
    >
        <div
            className="flex justify-center items-center w-1/5 font-title text-5xl font-bold bg-theme-accent rounded-md"
        >
            {`ATA ${ataNumber}`}
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

interface ComfortUIProps {
    filteredChapters: AtaChapterNumber[];
    allChapters: AtaChapterNumber[];
    failures: Failure[];
}

export const ComfortUI = ({ filteredChapters, allChapters, failures }: ComfortUIProps) => {
    const { allFailures, activeFailures } = useFailuresOrchestrator();
    const { searchQuery } = useAppSelector((state) => state.failuresPage);

    return (
        <>
            <Route exact path="/failures/comfort">
                <div className="space-y-8">
                    {searchQuery.length === 0 && activeFailures.size !== 0 && (
                        <FailureGroup className="ml-2.5" title="Active Failures" failures={allFailures.filter((failure) => activeFailures.has(failure.identifier))} />
                    )}
                </div>
                <ScrollableContainer height={30}>
                    {filteredChapters.map((chapter) => (
                        <ATAChapterCard
                            ataNumber={chapter}
                            title={AtaChaptersTitle[chapter]}
                            description={AtaChaptersDescription[chapter]}
                        />
                    ))}
                </ScrollableContainer>
            </Route>
            {allChapters.map((chapter) => (
                <Route path={`/failures/comfort/${chapter.toString()}`}>
                    <AtaChapterPage chapter={chapter} failures={failures} />
                </Route>
            ))}
        </>
    );
};
