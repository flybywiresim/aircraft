import React, { useState } from 'react';
import { A320Failure, Failure, FailuresOrchestrator } from '@flybywiresim/failures';
import { useUpdate } from '@instruments/common/hooks';

interface FailuresOrchestratorContext {
    allFailures: Readonly<Readonly<Failure>[]>,
    activeFailures: Set<number>,
    changingFailures: Set<number>,
    activate(identifier: number): Promise<void>;
    deactivate(identifier: number): Promise<void>;
}

const createOrchestrator = () => new FailuresOrchestrator('A32NX', [
    [31, A320Failure.LeftPfdDisplay, 'Captain PFD display'],
    [31, A320Failure.RightPfdDisplay, 'F/O PFD display'],
    [24, A320Failure.TransformerRectifier1, 'TR 1'],
    [24, A320Failure.TransformerRectifier2, 'TR 2'],
    [24, A320Failure.TransformerRectifierEssential, 'ESS TR'],
    [29, A320Failure.GreenReservoirLeak, 'Green reservoir leak'],
    [29, A320Failure.BlueReservoirLeak, 'Blue reservoir leak'],
    [29, A320Failure.YellowReservoirLeak, 'Yellow reservoir leak'],
    [29, A320Failure.GreenReservoirAirLeak, 'Green reservoir air leak'],
    [29, A320Failure.BlueReservoirAirLeak, 'Blue reservoir air leak'],
    [29, A320Failure.YellowReservoirAirLeak, 'Yellow reservoir air leak'],
    [29, A320Failure.GreenReservoirReturnLeak, 'Green reservoir return leak'],
    [29, A320Failure.BlueReservoirReturnLeak, 'Blue reservoir return leak'],
    [29, A320Failure.YellowReservoirReturnLeak, 'Yellow reservoir return leak'],
    [34, A320Failure.RadioAltimeter1, 'RA 1'],
    [34, A320Failure.RadioAltimeter2, 'RA 2'],
]);

const Context = React.createContext<FailuresOrchestratorContext>({
    allFailures: [],
    activeFailures: new Set<number>(),
    changingFailures: new Set<number>(),
    activate: () => Promise.resolve(),
    deactivate: () => Promise.resolve(),
});

export const FailuresOrchestratorProvider = ({ children }) => {
    const [orchestrator] = useState(createOrchestrator);

    const [allFailures] = useState(() => orchestrator.getAllFailures());
    const [activeFailures, setActiveFailures] = useState<Set<number>>(() => new Set<number>());
    const [changingFailures, setChangingFailures] = useState<Set<number>>(() => new Set<number>());

    useUpdate(() => {
        orchestrator.update();

        const af = orchestrator.getActiveFailures();
        if (!areEqual(activeFailures, af)) {
            setActiveFailures(af);
        }

        const cf = orchestrator.getChangingFailures();
        if (!areEqual(changingFailures, cf)) {
            setChangingFailures(cf);
        }
    });

    return (
        <Context.Provider
            value={{
                allFailures,
                activeFailures,
                changingFailures,
                activate: (identifier) => orchestrator.activate(identifier),
                deactivate: (identifier) => orchestrator.deactivate(identifier),
            }}
        >
            {children}
        </Context.Provider>
    );
};

export function useFailuresOrchestrator() {
    const context = React.useContext(Context);
    if (context === undefined) {
        throw new Error('useFailuresOrchestrator must be used within a FailuresOrchestratorProvider');
    }

    return context;
}

function areEqual<T>(as: Set<T>, bs: Set<T>) {
    if (as.size !== bs.size) return false;
    for (const a of as) {
        if (!bs.has(a)) {
            return false;
        }
    }

    return true;
}
