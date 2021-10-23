import React from 'react';
import { ScrollableContainer } from '../Components/ScrollableContainer';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';
import { FailureButton } from './FailureButton';

export const Failures = () => {
    const orchestrator = useFailuresOrchestrator();

    const buttons: JSX.Element[] = [];
    orchestrator.allFailures.forEach((failure) => {
        buttons.push(<FailureButton
            name={failure.name}
            isActive={orchestrator.activeFailures.has(failure.identifier)}
            isChanging={orchestrator.changingFailures.has(failure.identifier)}
            onClick={() => {
                if (!orchestrator.activeFailures.has(failure.identifier)) {
                    orchestrator.activate(failure.identifier);
                } else {
                    orchestrator.deactivate(failure.identifier);
                }
            }}
        />);
    });

    return (
        <div className="w-full">
            <div className="flex flex-row items-end space-x-4">
                <h1 className="font-bold">Failures</h1>
                <h2>Full simulation of the failures below isn't yet guaranteed.</h2>
            </div>
            <div className="p-4 mt-4 rounded-lg border-2 border-theme-accent">
                <ScrollableContainer height={52}>
                    <div className="grid grid-cols-4 grid-rows-4 grid-flow-row gap-4">
                        {buttons}
                    </div>
                </ScrollableContainer>
            </div>
        </div>
    );
};
