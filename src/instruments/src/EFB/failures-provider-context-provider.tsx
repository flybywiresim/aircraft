import React, { useState } from 'react';
import { A320Failure, Failure, FailuresOrchestrator, RemoteFailuresProvider } from '@flybywiresim/failures';
import { useUpdate } from '@instruments/common/hooks';

interface FailuresOrchestratorContext {
    allFailures: Readonly<Readonly<Failure>[]>,
    activeFailures: Set<number>,
    changingFailures: Set<number>,
    activate(identifier: number): Promise<void>;
    deactivate(identifier: number): Promise<void>;
}

const failures: ([number, string])[] = [
    [A320Failure.LeftPfdDisplay, 'Captain PFD display'],
    [A320Failure.RightPfdDisplay, 'F/O PFD display'],
    [A320Failure.TransformerRectifier1, 'TR 1'],
    [A320Failure.TransformerRectifier2, 'TR 2'],
    [A320Failure.TransformerRectifierEssential, 'ESS TR'],
    [A320Failure.GreenReservoirLeak, 'Green reservoir leak'],
    [A320Failure.BlueReservoirLeak, 'Blue reservoir leak'],
    [A320Failure.YellowReservoirLeak, 'Yellow reservoir leak'],
    [A320Failure.GreenReservoirAirLeak, 'Green reservoir air leak'],
    [A320Failure.BlueReservoirAirLeak, 'Blue reservoir air leak'],
    [A320Failure.YellowReservoirAirLeak, 'Yellow reservoir air leak'],
    [A320Failure.GreenReservoirReturnLeak, 'Green reservoir return leak'],
    [A320Failure.BlueReservoirReturnLeak, 'Blue reservoir return leak'],
    [A320Failure.YellowReservoirReturnLeak, 'Yellow reservoir return leak'],
    [A320Failure.RadioAltimeter1, 'RA 1'],
    [A320Failure.RadioAltimeter2, 'RA 2'],
];

const createOrchestrator = () => new FailuresOrchestrator('A32NX', failures);

const createRemoteProvider = () => new RemoteFailuresProvider('A32NX', failures);

const Context = React.createContext<FailuresOrchestratorContext>({
    allFailures: [],
    activeFailures: new Set<number>(),
    changingFailures: new Set<number>(),
    activate: () => Promise.resolve(),
    deactivate: () => Promise.resolve(),
});

export const FailuresProviderContextProvider = ({ remote, children }) => {
    const [store] = useState<FailuresOrchestrator | RemoteFailuresProvider>(remote ? createRemoteProvider : createOrchestrator);

    const [allFailures] = useState(() => store.getAllFailures());
    const [activeFailures, setActiveFailures] = useState<Set<number>>(() => new Set<number>());
    const [changingFailures, setChangingFailures] = useState<Set<number>>(() => new Set<number>());

    useUpdate(() => {
        if ('update' in store) {
            store.update();
        }

        const af = store.getActiveFailures();
        if (!areEqual(activeFailures, af)) {
            setActiveFailures(af);
        }

        const cf = store.getChangingFailures();
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
                activate: (identifier) => store.activate(identifier),
                deactivate: (identifier) => store.deactivate(identifier),
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
