import { afterLandingChecklist } from './AfterLanding';
import { afterStartChecklist } from './AfterStart';
import { approachChecklist } from './Approach';
import { beforeStartChecklist } from './BeforeStart';
import { landingChecklist } from './Landing';
import { parkingChecklist } from './Parking';
import { securingAircraftChecklist } from './SecuringAircraft';
import { ChecklistDefinition } from '../Checklists';
import { cockpitPreparationChecklist } from './CockpitPreparation';
import { taxiChecklist } from './Taxi';
import { lineUpChecklist } from './LineUp';

export const CHECKLISTS: ChecklistDefinition[] = [
    cockpitPreparationChecklist,
    beforeStartChecklist,
    afterStartChecklist,
    taxiChecklist,
    lineUpChecklist,
    approachChecklist,
    landingChecklist,
    afterLandingChecklist,
    parkingChecklist,
    securingAircraftChecklist,
];

export const mapFlightPhaseToChecklist = (phase: number): number => {
    let newCheckList = -1;
    switch (phase) {
    case 0: // Preflight
        newCheckList = 0; // Before Start
        break;
    case 1: // Takeoff
    case 2: // Climb
        newCheckList = 3; // After Takeff / Climb
        break;
    case 3: // Cruise
    case 4: // Decent
        newCheckList = 4; // Approach
        break;
    case 5: // Approach
        newCheckList = 5; // Landing
        break;
    default:
        break;
    }
    return newCheckList;
};
