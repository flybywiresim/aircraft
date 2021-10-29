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
            <h1 className="pt-6 text-3xl text-white">Failures</h1>
            <h2 className="pt-6 text-2xl text-white">Full simulation of the failures below isn't yet guaranteed.</h2>
            <div className="grid grid-flow-row grid-cols-4 grid-rows-4 gap-4 p-4 mr-3 overflow-hidden text-white shadow-lg bg-navy-lighter rounded-2xl h-efb-nav">
                {buttons}
            </div>
        </div>
    );
};
