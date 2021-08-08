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
        <div className="w-full">
            <h1 className="text-3xl pt-6 text-white">Failures</h1>
            <h2 className="text-2xl pt-6 text-white">Full simulation of the failures below isn't yet guaranteed.</h2>
            <div className="text-white overflow-hidden bg-navy-lighter rounded-2xl shadow-lg p-6 h-efb-nav mr-3 w-full">
                {buttons}
            </div>
        </div>
    );
};
