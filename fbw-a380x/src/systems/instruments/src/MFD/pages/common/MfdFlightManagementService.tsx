import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { EfisInterface, FlightPhaseManager, FlightPlanIndex, Navigation } from '@fmgc/index';
import { ClockEvents, Subject, Subscription } from '@microsoft/msfs-sdk';
import { A380AltitudeUtils } from '@shared/OperatingAltitudes';
import { maxCertifiedAlt } from '@shared/PerformanceConstants';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FmsAircraftInterface } from 'instruments/src/MFD/FmsAircraftInterface';
import { MfdComponent } from 'instruments/src/MFD/MFD';
import { FmgcDataInterface } from 'instruments/src/MFD/fmgc';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { Fix, Waypoint } from 'msfs-navdata';

/*
 * Handles navigation (and potentially other aspects) for MFD pages
 */
export class MfdFlightManagementService {
    protected subs = [] as Subscription[];

    public acInterface: FmsAircraftInterface;

    public revisedWaypointIndex = Subject.create<number>(undefined);

    public revisedWaypointPlanIndex = Subject.create<FlightPlanIndex>(undefined);

    public revisedWaypointIsAltn = Subject.create<boolean>(undefined);

    public enginesWereStarted = Subject.create<boolean>(false);

    public revisedWaypoint(): Fix | undefined {
        if (this.revisedWaypointIndex.get() !== undefined
            && this.flightPlanService.has(this.revisedWaypointPlanIndex.get())
        ) {
            const flightPlan = this.revisedWaypointIsAltn.get()
                ? this.flightPlanService.get(this.revisedWaypointPlanIndex.get()).alternateFlightPlan
                : this.flightPlanService.get(this.revisedWaypointPlanIndex.get());
            if (flightPlan.elementAt(this.revisedWaypointIndex.get())?.isDiscontinuity === false) {
                return flightPlan.legElementAt(this.revisedWaypointIndex.get())?.definition?.waypoint;
            }
        }
        return undefined;
    }

    public setRevisedWaypoint(index: number, planIndex: number, isAltn: boolean) {
        this.revisedWaypointPlanIndex.set(planIndex);
        this.revisedWaypointIsAltn.set(isAltn);
        this.revisedWaypointIndex.set(index);
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
        public navigation: Navigation,
        public flightPhaseManager: FlightPhaseManager,
        public efisInterface: EfisInterface,
    ) {
        this.acInterface = new FmsAircraftInterface(this.mfd, this.fmgc, this, this.flightPlanService, this.flightPhaseManager);
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
            if (val === true && flightPlanService.hasActive) {
                flightPlanService.active.setPerformanceData('costIndex', 0);
            }
        }));
    }

    public getLandingWeight(): number {
        if (this.enginesWereStarted.get() === false) {
            // On ground, engines off
            // LW = TOW - TRIP
            return this.getTakeoffWeight() ? (this.getTakeoffWeight() - this.getTripFuel()) : null;
        }
        if (this.fmgc.getFlightPhase() >= FmgcFlightPhase.Takeoff) {
            // In flight
            // LW = GW - TRIP
            return this.getGrossWeight() - this.getTripFuel();
        }
        // Preflight, engines on
        // LW = GW - TRIP - TAXI
        return this.getGrossWeight() - this.getTripFuel() - (this.fmgc.data.taxiFuel.get() ?? 0);
    }

    public getGrossWeight(): number {
        // Value received from FQMS, or falls back to ZFW + FOB

        // If we use A320 values for the predictions, return real weight here
        if (this.fmgc.data.zeroFuelWeight.get() < 150_000) {
            return SimVar.GetSimVarValue('TOTAL WEIGHT', 'pounds') * 0.453592;
        }

        let fmGW = 0;
        if (this.fmgc.isAnEngineOn() && Number.isFinite(this.fmgc.data.zeroFuelWeight.get())) {
            fmGW = (this.fmgc.getFOB() + this.fmgc.data.zeroFuelWeight.get());
        } else if (Number.isFinite(this.fmgc.data.blockFuel.get()) && Number.isFinite(this.fmgc.data.zeroFuelWeight.get())) {
            fmGW = (this.fmgc.data.blockFuel.get() + this.fmgc.data.zeroFuelWeight.get());
        } else {
            fmGW = SimVar.GetSimVarValue('TOTAL WEIGHT', 'pounds') * 0.453592;
        }
        SimVar.SetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number', fmGW);
        return fmGW;
    }

    public getTakeoffWeight(): number {
        if (this.enginesWereStarted.get() === false) {
            // On ground, engines off
            // TOW before engine start: TOW = ZFW + BLOCK - TAXI
            if (this.fmgc.getZeroFuelWeight() && this.fmgc.data.blockFuel.get() && this.fmgc.data.taxiFuel.get()) {
                return (this.fmgc.getZeroFuelWeight()
                    + this.fmgc.data.blockFuel.get()
                    - this.fmgc.data.taxiFuel.get());
            }
            return null;
        }
        if (this.fmgc.getFlightPhase() >= FmgcFlightPhase.Takeoff) {
            // In flight
            // TOW: TOW = GW
            return SimVar.GetSimVarValue('TOTAL WEIGHT', 'pounds') * 0.453592;
        }
        // Preflight, engines on
        // LW = GW - TRIP - TAXI
        // TOW after engine start: TOW = GW - TAXI
        return (SimVar.GetSimVarValue('TOTAL WEIGHT', 'pounds') * 0.453592 - (this.fmgc.data.taxiFuel.get() ?? 0));
    }

    public getTripFuel(): number {
        return 25_000; // Dummy value
    }

    public getRecMaxFlightLevel() {
        const isaTempDeviation = A380AltitudeUtils.getIsaTempDeviation();
        return Math.min(A380AltitudeUtils.calculateRecommendedMaxAltitude(this.getGrossWeight(), isaTempDeviation), maxCertifiedAlt) / 100;
    }

    public getOptFlightLevel() {
        return Math.floor(0.96 * this.getRecMaxFlightLevel() / 5) * 5; // TODO remove magic
    }
}
