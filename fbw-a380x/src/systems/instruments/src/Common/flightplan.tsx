import React, { useContext, useEffect, useState } from 'react';
import { ExternalBackend, Database } from 'msfs-navdata';
import { useUpdate } from '@instruments/common/hooks';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { NavigationDatabase } from '@fmgc/NavigationDatabase';

const FlightPlanContext = React.createContext<{ database: Database }>(undefined as any);

export const FlightPlanProvider: React.FC = ({ children }) => {
  const [database] = useState(() => new Database(new ExternalBackend('http://localhost:5000')));

  return <FlightPlanContext.Provider value={{ database }}>{children}</FlightPlanContext.Provider>;
};

export const useNavDatabase = (): Database => useContext(FlightPlanContext).database;

/**
 * Returns the current flight plan, whether it is temporary, and the current flight plans version
 */
export const useActiveOrTemporaryFlightPlan = (): [FlightPlan, boolean, number] => {
  const [version, setVersion] = useState(() => FlightPlanService.version);

  useUpdate(() => {
    setVersion(FlightPlanService.activeOrTemporary.version);
  });

  return [FlightPlanService.activeOrTemporary, FlightPlanService.hasTemporary, version];
};

export const useActiveNavDatabase = (): [NavigationDatabase, number] => {
  const [version, setVersion] = useState(() => NavigationDatabaseService.version);
  const [database, setDatabase] = useState(() => NavigationDatabaseService.activeDatabase);

  useUpdate(() => {
    setVersion(NavigationDatabaseService.version);
  });

  useEffect(() => {
    setDatabase(NavigationDatabaseService.activeDatabase);
  }, [version]);

  return [database, version];
};
