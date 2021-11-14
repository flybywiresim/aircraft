import React from 'react';
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
        <div className="w-full ">
            <h1 className="font-bold">Failures</h1>
            <h2>Full simulation of the failures below isn't yet guaranteed.</h2>
            <div className="grid overflow-hidden grid-cols-4 grid-rows-4 grid-flow-row gap-4 p-4 mr-3 rounded-2xl bg-navy-lighter h-efb-nav">
                {buttons}
            </div>
        </div>
    );
};
