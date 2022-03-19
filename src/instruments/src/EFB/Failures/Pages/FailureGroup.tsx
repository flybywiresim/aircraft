import { Failure } from '@flybywiresim/failures';
import React from 'react';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { useAppSelector } from '../../Store/store';
import { FailureButton } from '../FailureButton';

interface FailureGroupProps {
    title: string;
    failures: Failure[];
    className?: string;
}

export const FailureGroup = ({ title, failures, className }: FailureGroupProps) => {
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
        <div className={`space-y-2 ${className}`}>
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
