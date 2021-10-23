import { AtaChapterNumber, AtaChaptersTitle } from '@shared/ata';
import React from 'react';
import { Failure } from '@flybywiresim/failures';
import { FailureButton } from '../FailureButton';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { useAppSelector } from '../../Store/store';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

interface FailureGroupProps {
    title: string;
    failures: Failure[];
}

const FailureGroup = ({ title, failures }: FailureGroupProps) => {
    const { activeFailures, changingFailures, activate, deactivate } = useFailuresOrchestrator();
    const { searchQuery } = useAppSelector((state) => state.failuresPage);

    const getHighlightedTerm = (failureName: string) => {
        const searchQueryIdx = failureName.toUpperCase().indexOf(searchQuery);

        if (searchQuery === '' || searchQueryIdx === -1) return undefined;

        return failureName.substring(searchQueryIdx, searchQueryIdx + searchQuery.length);
    };

    const handleFailureButtonClick = (failureIdentifier: number) => {
        if (!activeFailures.has(failureIdentifier)) {
            activate(failureIdentifier);
        } else {
            deactivate(failureIdentifier);
        }
    };

    return (
        <div className="space-y-2">
            <h2>{title}</h2>

            <div className="grid grid-cols-4 auto-rows-auto">
                {failures.map((failure, index) => (
                    <FailureButton
                        name={failure.name}
                        isActive={activeFailures.has(failure.identifier)}
                        isChanging={changingFailures.has(failure.identifier)}
                        highlightedTerm={getHighlightedTerm(failure.name)}
                        onClick={() => handleFailureButtonClick(failure.identifier)}
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

export const CompactUI = ({ chapters, failures }: CompactUIProps) => {
    const { allFailures, activeFailures } = useFailuresOrchestrator();
    const { searchQuery } = useAppSelector((state) => state.failuresPage);

    return (
        <ScrollableContainer height={48}>
            <div className="space-y-8">
                {searchQuery.length === 0 && activeFailures.size !== 0 && (
                    <FailureGroup title="Active Failures" failures={allFailures.filter((failure) => activeFailures.has(failure.identifier))} />
                )}
                {chapters.map((chapter) => (
                    <FailureGroup title={AtaChaptersTitle[chapter]} failures={failures.filter((failure) => failure.ata === chapter)} />
                ))}
                {failures.length === 0 && (
                    <div className="flex justify-center items-center rounded-md border-2 border-theme-accent" style={{ height: '48rem' }}>
                        <p>No Items Found</p>
                    </div>
                )}
            </div>
        </ScrollableContainer>
    );
};
