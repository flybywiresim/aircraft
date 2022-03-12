import React from 'react';
import { AtaChaptersDescription, AtaChaptersTitle, AtaChapterNumber } from '@shared/ata';
import { Route } from 'react-router';
import { Link } from 'react-router-dom';
import { pathify } from '../Utils/routing';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';
import { AtaChapterPage } from './Pages/AtaChapterPage';

interface ATAFailureCardProps {
    ataNumber: AtaChapterNumber,
    title: string,
    description: string,
}

const ATAChapterCard = ({ ataNumber, description, title }: ATAFailureCardProps) => (
    <Link to={`/failures/${pathify(ataNumber.toString())}`} className="flex flex-row p-2 space-x-4 rounded-md border-2 border-transparent transition duration-100 hover:border-theme-highlight">
        <div className="flex justify-center items-center w-1/5 text-5xl font-bold rounded-md font-title bg-theme-accent">
            ATA
            {' '}
            {ataNumber}
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

export const Failures = () => {
    const { allFailures } = useFailuresOrchestrator();
    const chapters = Array.from(new Set(allFailures.map((it) => it.ata))).sort((a, b) => a - b);

    return (
        <div className="w-full">
            <Route exact path="/failures">
                <div className="flex flex-row items-end space-x-4">
                    <h1 className="font-bold">Failures</h1>
                    <h2>Full simulation of the failures below isn't yet guaranteed.</h2>
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
            </Route>
            <Route path="/failures/:ataNumber" component={AtaChapterPage} />
        </div>
    );
};
