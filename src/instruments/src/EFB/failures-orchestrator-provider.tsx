import React from 'react';
import { FailuresOrchestrator } from '@flybywiresim/failures';
import { useUpdate } from '@instruments/common/hooks';

const context = new FailuresOrchestrator('A32NX');
context.add(1, 'Captain PFD display');
context.add(2, 'F/O PFD display');
context.add(3, 'TR 1');
context.add(4, 'TR 2');
context.add(5, 'TR ESS');

const Context = React.createContext<FailuresOrchestrator>(context);

export const FailuresOrchestratorProvider = ({ children }) => {
    useUpdate(() => {
        context.update();
    });

    return <Context.Provider value={context}>{children}</Context.Provider>;
};

export function useFailuresOrchestrator() {
    const context = React.useContext(Context);
    if (context === undefined) {
        throw new Error('useFailuresOrchestrator must be used within a FailuresOrchestratorProvider');
    }

    return context;
}
