import { GenericAdirsEvents } from './types/GenericAdirsEvents';
import { GenericSwitchingPanelEvents } from './types/GenericSwitchingPanelEvents';

export type NDSimvars = GenericAdirsEvents & GenericSwitchingPanelEvents & {
    elec: boolean;
    elecFo: boolean;
    potentiometerCaptain: number;
    potentiometerFo: number;
    ilsCourse: number;
    selectedWaypointLat: Degrees;
    selectedWaypointLong: Degrees;
    selectedHeading: Degrees;
    showSelectedHeading: boolean;
    pposLat: Degrees;
    pposLong: Degrees;
    absoluteTime: Seconds;
    fmgcFlightPhase: number;
  }
