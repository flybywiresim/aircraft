import { AtaChapterNumber, AtaChaptersTitle } from '@shared/ata';
import React from 'react';
import { Failure } from '@flybywiresim/failures';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { useAppSelector } from '../../Store/store';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { FailureGroup } from './FailureGroup';

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
            </div>
        </ScrollableContainer>
    );
};
