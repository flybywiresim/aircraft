import React, { useContext, useEffect, useState } from 'react';
import { FlightPlanManager, ManagedFlightPlan } from '@shared/flightplan';
import { useSimVar } from './simVars';
import { getRootElement } from './defaults';

const FlightPlanContext = React.createContext<{ flightPlanManager: FlightPlanManager }>(undefined as any);

export const FlightPlanProvider: React.FC = ({ children }) => {
    const [flightPlanManager] = useState(() => new FlightPlanManager(getRootElement()));

    return (
        <FlightPlanContext.Provider value={{ flightPlanManager }}>
            {children}
        </FlightPlanContext.Provider>
    );
};

export const useFlightPlanManager = (): FlightPlanManager => useContext(FlightPlanContext).flightPlanManager;

export const useFlightPlanVersion = (): number => {
    const [version] = useSimVar(FlightPlanManager.FlightPlanVersionKey, 'number');

    return version;
};

export const useCurrentFlightPlan = (): ManagedFlightPlan => {
    const flightPlanManager = useFlightPlanManager();

    const flightPlanVersion = useFlightPlanVersion();
    const [currentFlightPlan, setCurrentFlightPlan] = useState<ManagedFlightPlan>(() => flightPlanManager.getCurrentFlightPlan());

    useEffect(() => {
        flightPlanManager.updateFlightPlan(() => {
            setCurrentFlightPlan(flightPlanManager.getCurrentFlightPlan());
        });
    }, [flightPlanVersion]);

    return currentFlightPlan;
};
