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
        }, false, true);
    }, [flightPlanManager, flightPlanVersion]);

    return currentFlightPlan;
};

export const useTemporaryFlightPlan = (): ManagedFlightPlan => {
    const flightPlanManager = useFlightPlanManager();

    const flightPlanVersion = useFlightPlanVersion();
    const [tmpFlightPlan, setTmpFlightPlan] = useState<ManagedFlightPlan>(() => flightPlanManager.getFlightPlan(1));

    useEffect(() => {
        flightPlanManager.updateFlightPlan(() => {
            setTmpFlightPlan(flightPlanManager.getFlightPlan(1));
        });
    }, [flightPlanVersion]);

    return tmpFlightPlan;
};

export type ApproachNameComponents = {
    // the approach type, e.g. ILS or RNAV
    type: string,

    // the runway
    runway: string,

    // alphanumeric designator when multiple approaches of the same type exist for the same runway
    designator: string | undefined,
};

export const parseApproachName = (name: string): ApproachNameComponents | undefined => {
    // L(eft), C(entre), R(ight), T(true North) are the possible runway designators (ARINC424)
    // If there are multiple procedures for the same type of approach, an alphanumeric suffix is added to their names (last subpattern)
    // We are a little more lenient than ARINC424 in an effort to match non-perfect navdata, so we allow dashes, spaces, or nothing before the suffix
    const match = name.trim().match(/^(ILS|LOC|RNAV|NDB|VOR|GPS) (RW)?([0-9]{1,2}[LCRT]?)([\s-]*([A-Z0-9]))?$/);
    if (!match) {
        return undefined;
    }
    return {
        type: match[1],
        runway: match[3],
        designator: match[5],
    };
};

/**
 *
 * @param name approach name from the nav database
 * @returns max 9 digit name in the format <approach type><runway with leading zero><option -designator><spaces if needed>
 */
export const normaliseApproachName = (name: string): string => {
    const appr = parseApproachName(name);
    if (!appr) {
        return '';
    }
    const suffix = appr.designator ? `-${appr.designator}` : '';
    return `${appr.type}${Avionics.Utils.formatRunway(appr.runway)}${suffix}`;
};
