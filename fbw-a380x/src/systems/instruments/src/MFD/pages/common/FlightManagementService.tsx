import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { FlightPlanIndex } from '@fmgc/index';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { ClockEvents, FSComponent, Subject, Subscription } from '@microsoft/msfs-sdk';
import { FmgcFlightPhase } from '@shared/flightphase';
import { MfdComponent } from 'instruments/src/MFD/MFD';
import { FmgcDataInterface } from 'instruments/src/MFD/fmgc';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { Fix, Waypoint } from 'msfs-navdata';

/*
 * Handles navigation (and potentially other aspects) for MFD pages
 */
export class MfdFlightManagementService {
    protected subs = [] as Subscription[];

    public revisedWaypointIndex = Subject.create<number>(0);

    public revisedWaypointPlanIndex = Subject.create<FlightPlanIndex>(FlightPlanIndex.Active);

    public revisedWaypointIsAltn = Subject.create<boolean>(false);

    public enginesWereStarted = Subject.create<boolean>(false);

    public revisedWaypoint(): Fix | undefined {
        if (this.revisedWaypointIndex.get()
        && this.flightPlanService.has(this.revisedWaypointPlanIndex.get())
    && this.flightPlanService.get(this.revisedWaypointPlanIndex.get()).elementAt(this.revisedWaypointIndex.get()).isDiscontinuity === false) {
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
        const sub = mfd.props.bus.getSubscriber<ClockEvents & MfdSimvars>();

        this.subs.push(sub.on('realTime').atFrequency(1).handle((_t) => {
            if (this.enginesWereStarted.get() === false) {
                const flightPhase = fmgc.getFlightPhase();
                const oneEngineWasStarted = (SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:1', 'number') > 20)
                || (SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:2', 'number') > 20)
                || (SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:3', 'number') > 20)
                || (SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:4', 'number') > 20);
                this.enginesWereStarted.set(flightPhase >= FmgcFlightPhase.Takeoff || (flightPhase === FmgcFlightPhase.Preflight && oneEngineWasStarted));
            }
        }));

        this.subs.push(this.enginesWereStarted.sub((val) => {
            if (val === true) {
                fmgc.data.costIndex.set(0);
            }
        }));
    }
}
