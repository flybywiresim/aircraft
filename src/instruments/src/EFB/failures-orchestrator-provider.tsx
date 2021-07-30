import React from 'react';
import { A320Failure, FailuresOrchestrator } from '@flybywiresim/failures';
import { useUpdate } from '@instruments/common/hooks';

const context = new FailuresOrchestrator('A32NX');
context.add(A320Failure.LeftPfdDisplay, 'Captain PFD display');
context.add(A320Failure.RightPfdDisplay, 'F/O PFD display');
context.add(A320Failure.TransformerRectifier1, 'TR 1');
context.add(A320Failure.TransformerRectifier2, 'TR 2');
context.add(A320Failure.TransformerRectifierEssential, 'TR ESS');

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
