import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { Fmgc, GuidanceController } from '@fmgc/guidance/GuidanceController';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { FSComponent } from '@microsoft/msfs-sdk';
import { MfdComponent } from 'instruments/src/MFD/MFD';

/*
 * Handles navigation (and potentially other aspects) for MFD pages
 */
export class MfdFlightManagementService {
    constructor(
        public mfd: MfdComponent,
        public flightPlanService: FlightPlanService,
        public guidanceController: GuidanceController,
        public fmgc: Fmgc,
        public navigationProvider: NavigationProvider,
    ) {
    }
}
