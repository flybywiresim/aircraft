import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { FlightPlanIndex } from '@fmgc/index';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { FSComponent, Subject } from '@microsoft/msfs-sdk';
import { MfdComponent } from 'instruments/src/MFD/MFD';
import { FmgcDataInterface } from 'instruments/src/MFD/fmgc';
import { Fix, Waypoint } from 'msfs-navdata';

/*
 * Handles navigation (and potentially other aspects) for MFD pages
 */
export class MfdFlightManagementService {
    public revisedWaypointIndex = Subject.create<number>(0);

    public revisedWaypointPlanIndex = Subject.create<FlightPlanIndex>(FlightPlanIndex.Active);

    public revisedWaypointIsAltn = Subject.create<boolean>(false);

    public revisedWaypoint(): Fix | undefined {
        if (this.revisedWaypointIndex.get() && this.flightPlanService.has(this.revisedWaypointPlanIndex.get())) {
            return this.flightPlanService.get(this.revisedWaypointPlanIndex.get()).legElementAt(this.revisedWaypointIndex.get())?.definition?.waypoint;
        }
        return undefined;
    }

    public resetRevisedWaypoint(): void {
        this.revisedWaypointIndex.set(undefined);
        this.revisedWaypointIsAltn.set(undefined);
        this.revisedWaypointPlanIndex.set(undefined);
    }

    public latLongStoredWaypoints: Waypoint[] = [];

    public pbdStoredWaypoints: Waypoint[] = [];

    public pbxStoredWaypoints: Waypoint[] = [];

    public deleteAllStoredWaypoints() {
        this.latLongStoredWaypoints = [];
        this.pbdStoredWaypoints = [];
        this.pbxStoredWaypoints = [];
    }

    constructor(
        public mfd: MfdComponent,
        public flightPlanService: FlightPlanService,
        public guidanceController: GuidanceController,
        public fmgc: FmgcDataInterface,
        public navigationProvider: NavigationProvider,
    ) {
    }
}
