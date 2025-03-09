import { ReadonlyPendingAirways } from '@fmgc/flightplanning/plans/ReadonlyPendingAirways';
import { Airway, Fix } from '@flybywiresim/fbw-sdk';

export interface PendingAirways extends ReadonlyPendingAirways {
  thenAirway(airway: Airway): Promise<boolean>;

  thenTo(waypoint: Fix): Promise<boolean>;

  finalize(): Promise<void>;
}
