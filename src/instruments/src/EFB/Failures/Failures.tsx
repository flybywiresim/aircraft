import React from 'react';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';
import { FailureButton } from './FailureButton';

export const Failures = () => {
    const orchestrator = useFailuresOrchestrator();

    return (
        <div className="w-full">
            <h1 className="text-3xl pt-6 text-white">Failures</h1>
            <div className="text-white overflow-hidden bg-navy-lighter rounded-2xl shadow-lg p-6 h-efb-nav mr-3 w-full">
                {orchestrator.getFailures().map((failure) => (
                    <FailureButton
                        failure={failure}
                        onClick={() => {
                            if (!failure.isActive) {
                                orchestrator.activate(failure.identifier);
                            } else {
                                orchestrator.deactivate(failure.identifier);
                            }
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
