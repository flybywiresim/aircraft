import { cockpitPreparationChecklist } from './CockpitPreparation';
import { beforeStartChecklist } from './BeforeStart';
import { afterStartChecklist } from './AfterStart';
import { taxiChecklist } from './Taxi';
import { lineUpChecklist } from './LineUp';
import { approachChecklist } from './Approach';
import { landingChecklist } from './Landing';
import { afterLandingChecklist } from './AfterLanding';
import { parkingChecklist } from './Parking';
import { securingAircraftChecklist } from './SecuringAircraft';
import { ChecklistDefinition } from '../Checklists';

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
