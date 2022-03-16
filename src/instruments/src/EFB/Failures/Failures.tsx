import React from 'react';
import { AtaChaptersDescription, AtaChaptersTitle, AtaChapterNumber } from '@shared/ata';
import { Link } from 'react-router-dom';
import { InfoCircleFill } from 'react-bootstrap-icons';
import { PageLink, PageRedirect, pathify, TabRoutes } from '../Utils/routing';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';
import { AtaChapterPage } from './Pages/AtaChapterPage';

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

const FailuresHome = () => {
    const { allFailures } = useFailuresOrchestrator();
    const chapters = Array.from(new Set(allFailures.map((it) => it.ata))).sort((a, b) => a - b);

    return (
        <>
            <div className="flex flex-row justify-between space-x-4">
                <h1 className="font-bold">Failures</h1>

                <div className="flex flex-row items-center py-1 px-4 space-x-2 rounded-md bg-colors-yellow-400">
                    <InfoCircleFill className="text-theme-body" />
                    <p className="text-theme-body">Full simulation of the failures below isn't yet guaranteed.</p>
                </div>
            </div>

            <div className="p-4 mt-4 rounded-lg border-2 border-theme-accent h-content-section-reduced">
                <ScrollableContainer height={52}>
                    <div className="flex flex-col space-y-1">
                        {chapters.map((chapter) => (
                            <ATAChapterCard
                                ataNumber={chapter}
                                title={AtaChaptersTitle[chapter]}
                                description={AtaChaptersDescription[chapter]}
                            />
                        ))}
                    </div>
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
