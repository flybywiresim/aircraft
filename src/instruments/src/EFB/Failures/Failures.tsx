import React from 'react';
import { AtaChaptersDescription, AtaChaptersTitle, AtaChapterNumber } from '@shared/ata';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';
import { FailureButton } from './FailureButton';

interface ATAFailureCardProps {
    ataNumber: AtaChapterNumber,
    title: string,
    description: string,
}

const ATAFailureCard = ({ ataNumber, description, title }: ATAFailureCardProps) => (
    <div className="flex flex-row space-x-4">
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
    </div>
);

export const Failures = () => {
    const { allFailures } = useFailuresOrchestrator();
    const chapters = Array.from(new Set(allFailures.map((it) => it.ata))).sort((a, b) => a - b);

    return (
        <div className="w-full">
            <div className="flex flex-row items-end space-x-4">
                <h1 className="font-bold">Failures</h1>
                <h2>Full simulation of the failures below isn't yet guaranteed.</h2>
            </div>
            <div className="p-4 mt-4 rounded-lg border-2 border-theme-accent">
                <ScrollableContainer height={52}>
                    <div className="space-y-4">
                        {chapters.map((chapter) => (
                            <ATAFailureCard
                                ataNumber={chapter}
                                title={AtaChaptersTitle[chapter]}
                                description={AtaChaptersDescription[chapter]}
                            />
                        ))}
                    </div>
                </ScrollableContainer>
            </div>
        </div>
    );
};
