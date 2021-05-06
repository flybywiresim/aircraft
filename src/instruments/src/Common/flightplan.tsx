import React, { useContext, useEffect, useState } from 'react';
import { FlightPlanManager, ManagedFlightPlan } from '../../../fmgc/src';
import { useSimVar } from './simVars';
import { getRootElement } from './defaults';

export const useFlightPlanManager = (): FlightPlanManager => {
    const [flightPlanManager] = useState(() => new FlightPlanManager(getRootElement()));

    return flightPlanManager;
};

const FlightPlanContext = React.createContext<{ flightPlanManager: FlightPlanManager }>(undefined as any);

export const FlightPlanProvider: React.FC = ({ children }) => {
    const flightPlanManager = useFlightPlanManager();

    return (
        <FlightPlanContext.Provider value={{ flightPlanManager }}>
            {children}
        </FlightPlanContext.Provider>
    );
};

export const useFlightPlanVersion = (): number => {
    const [version] = useSimVar(FlightPlanManager.FlightPlanVersionKey, 'number');

    return version;
};

export const useCurrentFlightPlan = (): ManagedFlightPlan => {
    const flightPlanManager = useContext(FlightPlanContext).flightPlanManager;

    const flightPlanVersion = useFlightPlanVersion();
    const [currentFlightPlan, setCurrentFlightPlan] = useState<ManagedFlightPlan>(() => flightPlanManager.getCurrentFlightPlan());

    useEffect(() => {
        flightPlanManager.updateFlightPlan(() => {
            setCurrentFlightPlan(flightPlanManager.getCurrentFlightPlan());
        });
    }, [flightPlanVersion]);

    return currentFlightPlan;
};
