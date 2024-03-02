import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import {
    A320FlightPlanPerformanceData, A380AircraftConfig, DataManager, EfisInterface, EfisSymbols, FlightPlanIndex,
    Navigation, NavigationDatabaseService, getFlightPhaseManager,
} from '@fmgc/index';
import { ArraySubject, ClockEvents, EventBus, Subject, Subscription } from '@microsoft/msfs-sdk';
import { A380AltitudeUtils } from '@shared/OperatingAltitudes';
import { maxBlockFuel, maxCertifiedAlt, maxZfw } from '@shared/PerformanceConstants';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FmcAircraftInterface } from 'instruments/src/MFD/FMC/FmcAircraftInterface';
import { FmgcDataService } from 'instruments/src/MFD/FMC/fmgc';
import { FmcInterface, FmcOperatingModes } from 'instruments/src/MFD/FMC/FmcInterface';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { DatabaseItem, Fix, NXDataStore, UpdateThrottler, Waypoint, a380EfisRangeSettings } from '@flybywiresim/fbw-sdk';
import { NavaidSelectionManager } from '@fmgc/navigation/NavaidSelectionManager';
import { LandingSystemSelectionManager } from '@fmgc/navigation/LandingSystemSelectionManager';
import { McduMessage, NXFictionalMessages, NXSystemMessages, TypeIIMessage, TypeIMessage } from 'instruments/src/MFD/shared/NXSystemMessages';
import { PilotWaypoint } from '@fmgc/flightplanning/new/DataManager';
import { distanceTo, Coordinates } from 'msfs-geo';
import { DisplayInterface } from '@fmgc/flightplanning/new/interface/DisplayInterface';
import { MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { FmcIndex } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { FmsErrorType } from '@fmgc/FmsError';

export interface FmsErrorMessage {
    message: McduMessage;
    messageText: string;
    backgroundColor: 'white' | 'amber' | 'cyan'; // Whether the message should be colored.
    cleared: boolean; // If message has been cleared from footer
    isResolvedOverride: () => boolean;
    onClearOverride: () => void;
}

/*
 * Handles navigation (and potentially other aspects) for MFD pages
 */
export class FlightManagementComputer implements FmcInterface {
    protected subs = [] as Subscription[];

    #mfdReference: (DisplayInterface & MfdDisplayInterface) | null;

    get mfdReference() {
        return this.#mfdReference;
    }

    set mfdReference(value: (DisplayInterface & MfdDisplayInterface) | null) {
        this.#mfdReference = value;

        if (value) {
            this.dataManager = new DataManager(value);
        }
    }

    #operatingMode: FmcOperatingModes;

    get operatingMode(): FmcOperatingModes {
        // TODO amend once
        return this.#operatingMode;
    }

    set operatingMode(value: FmcOperatingModes) {
        this.#operatingMode = value;
    }

    #flightPlanService = new FlightPlanService(this.bus, new A320FlightPlanPerformanceData());

    get flightPlanService() {
        return this.#flightPlanService;
    }

    private lastFlightPlanVersion: number | null = null;

    #fmgc = new FmgcDataService(this.flightPlanService);

    get fmgc() {
        return this.#fmgc;
    }

    private fmsUpdateThrottler = new UpdateThrottler(250);

    private efisInterface = new EfisInterface(this.instance === FmcIndex.FmcB ? 'R' : 'L'); // Ignore FMC-C for now

    #guidanceController: GuidanceController;

    get guidanceController() {
        return this.#guidanceController;
    }

    #navigation = new Navigation(this.flightPlanService, undefined);

    get navigation() {
        return this.#navigation;
    }

    get navaidTuner() {
        return this.#navigation.getNavaidTuner();
    }

    private navaidSelectionManager = new NavaidSelectionManager(this.flightPlanService, this.navigation);

    private landingSystemSelectionManager = new LandingSystemSelectionManager(this.flightPlanService, this.navigation);

    private efisSymbols: EfisSymbols<number>;

    private flightPhaseManager = getFlightPhaseManager();

    // TODO remove this cyclic dependency, isWaypointInUse should be moved to DataInterface
    private dataManager: DataManager | null = null;

    public getDataManager() {
        return this.dataManager;
    }

    #fmsErrors = ArraySubject.create<FmsErrorMessage>();

    get fmsErrors() {
        return this.#fmsErrors;
    }

    // TODO make private, and access methods through FmcInterface
    public acInterface: FmcAircraftInterface;

    public revisedWaypointIndex = Subject.create<number | null>(null);

    public revisedWaypointPlanIndex = Subject.create<FlightPlanIndex | null>(null);

    public revisedWaypointIsAltn = Subject.create<boolean | null>(null);

    public enginesWereStarted = Subject.create<boolean>(false);

    constructor(private instance: FmcIndex, operatingMode: FmcOperatingModes, private bus: EventBus, mfdReference: (DisplayInterface & MfdDisplayInterface) | null) {
        this.#operatingMode = operatingMode;
        this.#mfdReference = mfdReference;

        this.acInterface = new FmcAircraftInterface(this.bus, this, this.fmgc, this.flightPlanService);

        this.flightPlanService.createFlightPlans();
        this.#guidanceController = new GuidanceController(this.fmgc, this.flightPlanService, this.efisInterface, a380EfisRangeSettings, A380AircraftConfig);
        this.efisSymbols = new EfisSymbols(this.#guidanceController, this.flightPlanService, this.navaidTuner, this.efisInterface, a380EfisRangeSettings);

        this.navaidTuner.init();
        this.efisSymbols.init();
        this.flightPhaseManager.init();
        this.#guidanceController.init();
        this.fmgc.guidanceController = this.#guidanceController;

        /* try {
            this.initializeTestingFlightPlans();
        } catch {
            console.warn('Testing init didn\'t work.');
        } */

        let lastUpdateTime = Date.now();

        this.initSimVars();

        this.flightPhaseManager.addOnPhaseChanged((prev, next) => this.onFlightPhaseChanged(prev, next));

        setInterval(() => {
            const now = Date.now();
            const dt = now - lastUpdateTime;

            this.onUpdate(dt);

            lastUpdateTime = now;
        }, 100);

        const sub = bus.getSubscriber<ClockEvents & MfdSimvars>();

        this.subs.push(sub.on('realTime').atFrequency(1).handle((_t) => {
            if (this.enginesWereStarted.get() === false) {
                const flightPhase = this.fmgc.getFlightPhase();
                const oneEngineWasStarted = (SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:1', 'number') > 20)
                    || (SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:2', 'number') > 20)
                    || (SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:3', 'number') > 20)
                    || (SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:4', 'number') > 20);
                this.enginesWereStarted.set(flightPhase >= FmgcFlightPhase.Takeoff || (flightPhase === FmgcFlightPhase.Preflight && oneEngineWasStarted));
            }
        }));

        this.subs.push(this.enginesWereStarted.sub((val) => {
            if (val === true && this.flightPlanService.hasActive && !Number.isFinite(this.flightPlanService.active.performanceData.costIndex)) {
                this.flightPlanService.active.setPerformanceData('costIndex', 0);
            }
        }));
    }

    public revisedWaypoint(): Fix | undefined {
        const revWptIdx = this.revisedWaypointIndex.get();
        const revPlanIdx = this.revisedWaypointPlanIndex.get();
        if (revWptIdx !== null && revPlanIdx !== null && this.flightPlanService.has(revPlanIdx)) {
            const flightPlan = this.revisedWaypointIsAltn.get()
                ? this.flightPlanService.get(revPlanIdx).alternateFlightPlan
                : this.flightPlanService.get(revPlanIdx);
            if (flightPlan.hasElement(revWptIdx) && flightPlan.elementAt(revWptIdx)?.isDiscontinuity === false) {
                return flightPlan.legElementAt(revWptIdx)?.definition?.waypoint;
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
        this.revisedWaypointIndex.set(null);
        this.revisedWaypointIsAltn.set(null);
        this.revisedWaypointPlanIndex.set(null);
    }

    public latLongStoredWaypoints: Waypoint[] = [];

    public pbdStoredWaypoints: Waypoint[] = [];

    public pbxStoredWaypoints: Waypoint[] = [];

    public deleteAllStoredWaypoints() {
        this.latLongStoredWaypoints = [];
        this.pbdStoredWaypoints = [];
        this.pbxStoredWaypoints = [];
    }

    /**
     * Checks whether a waypoint is currently in use
     * @param waypoint the waypoint to look for
     */
    async isWaypointInUse(waypoint: Waypoint): Promise<boolean> {
        // Check in all flight plans
        if (this.flightPlanService.hasActive) {
            this.flightPlanService.active.allLegs.forEach((it) => {
                if (it.isDiscontinuity === false && it.definition.waypoint?.databaseId === waypoint.databaseId) {
                    return true;
                }
                return false;
            });
        }

        if (this.flightPlanService.hasTemporary) {
            this.flightPlanService.temporary.allLegs.forEach((it) => {
                if (it.isDiscontinuity === false && it.definition.waypoint?.databaseId === waypoint.databaseId) {
                    return true;
                }
                return false;
            });
        }

        for (let i = 1; i <= 3; i++) {
            if (this.flightPlanService.hasSecondary(i)) {
                this.flightPlanService.secondary(i).allLegs.forEach((it) => {
                    if (it.isDiscontinuity === false && it.definition.waypoint?.databaseId === waypoint.databaseId) {
                        return true;
                    }
                    return false;
                });
            }
        }

        if (this.flightPlanService.hasUplink) {
            this.flightPlanService.uplink.allLegs.forEach((it) => {
                if (it.isDiscontinuity === false && it.definition.waypoint?.databaseId === waypoint.databaseId) {
                    return true;
                }
                return false;
            });
        }

        return false;
    }

    /** in kg */
    public getLandingWeight(): number | null {
        const tow = this.getTakeoffWeight();
        const tf = this.getTripFuel();

        if (this.enginesWereStarted.get() === false) {
            // On ground, engines off
            // LW = TOW - TRIP
            return (tow && tf) ? (tow - tf) : null;
        }
        if (tf && this.fmgc.getFlightPhase() >= FmgcFlightPhase.Takeoff) {
            // In flight
            // LW = GW - TRIP
            return this.getGrossWeight() - tf;
        }
        // Preflight, engines on
        // LW = GW - TRIP - TAXI
        return this.getGrossWeight() - (tf ?? 0) - (this.fmgc.data.taxiFuel.get() ?? 0);
    }

    /** in kg */
    public getGrossWeight(): Kilograms {
        // Value received from FQMS, or falls back to ZFW + FOB
        const zfw = this.fmgc.data.zeroFuelWeight.get() ?? maxZfw;

        let fmGW = 0;
        if (this.fmgc.isAnEngineOn() && Number.isFinite(this.fmgc.data.zeroFuelWeight.get())) {
            fmGW = (this.fmgc.getFOB() * 1_000 + zfw);
        } else if (Number.isFinite(this.fmgc.data.blockFuel.get()) && Number.isFinite(this.fmgc.data.zeroFuelWeight.get())) {
            fmGW = (this.fmgc.data.blockFuel.get() ?? 0 + zfw);
        } else {
            fmGW = SimVar.GetSimVarValue('TOTAL WEIGHT', 'pounds') * 0.453592;
        }
        return fmGW;
    }

    public getTakeoffWeight(): number | null {
        if (this.enginesWereStarted.get() === false) {
            // On ground, engines off
            // TOW before engine start: TOW = ZFW + BLOCK - TAXI
            const zfw = this.fmgc.data.zeroFuelWeight.get() ?? maxZfw;
            if (this.fmgc.data.zeroFuelWeight.get() && this.fmgc.data.blockFuel.get() && this.fmgc.data.taxiFuel.get()) {
                return (zfw
                    + (this.fmgc.data.blockFuel.get() ?? maxBlockFuel)
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

    public getTripFuel(): number | null {
        return 25_000; // Dummy value
    }

    public getRecMaxFlightLevel(): number | null {
        const isaTempDeviation = A380AltitudeUtils.getIsaTempDeviation();
        return Math.min(A380AltitudeUtils.calculateRecommendedMaxAltitude(this.getGrossWeight(), isaTempDeviation), maxCertifiedAlt) / 100;
    }

    public getOptFlightLevel(): number | null {
        return Math.floor(0.96 * (this.getRecMaxFlightLevel() ?? (maxCertifiedAlt / 100)) / 5) * 5; // TODO remove magic
    }

    private async initializeTestingFlightPlans() {
        await new Promise((r) => setTimeout(r, 3000));

        // Intialize from MSFS flight data
        // this.flightPlanService.active.performanceData.cruiseFlightLevel.set(SimVar.GetGameVarValue('AIRCRAFT CRUISE ALTITUDE', 'feet'));

        // Build EDDM08R GIVMI6E GIVMI DCT DKB DCT ILS25L EDDF25L
        await this.flightPlanService.newCityPair('EDDM', 'EDDF', 'EBBR');
        await this.flightPlanService.setOriginRunway('RW08R');
        await this.flightPlanService.setDepartureProcedure('GIVM6E');
        await this.flightPlanService.nextWaypoint(4, (await NavigationDatabaseService.activeDatabase.searchAllFix('DKB'))[0]);
        await this.flightPlanService.setDestinationRunway('RW25L');
        await this.flightPlanService.setApproach('I25L');
        await this.flightPlanService.temporaryInsert();

        // Build EGLL/27R N0411F250 MAXI1F MAXIT DCT HARDY UM605 BIBAX BIBA9X LFPG/09L
        /* await this.flightPlanService.newCityPair('EGLL', 'LFPG', 'EBBR');
        await this.flightPlanService.setOriginRunway('RW27R');
        await this.flightPlanService.setDepartureProcedure('MAXI1F');
        await this.flightPlanService.nextWaypoint(8, (await db.searchAllFix('HARDY'))[0]);
        await this.flightPlanService.temporaryInsert();
        await this.flightPlanService.deleteElementAt(8);

        this.flightPlanService.active.startAirwayEntry(8);
        const awy = (await db.searchAirway('UM605', (await db.searchAllFix('HARDY'))[0]))[0];
        this.flightPlanService.active.pendingAirways.thenAirway(awy);
        this.flightPlanService.active.pendingAirways.thenTo((await db.searchAllFix('BIBAX'))[0]);
        this.flightPlanService.active.pendingAirways.finalize();

        await this.flightPlanService.setDestinationRunway('RW09R');
        // await this.flightPlanService.setApproach('I09R'); // throws errors
        // await this.flightPlanService.setApproachVia('MOP6E');
        // await this.flightPlanService.setArrival('BIBA9X');

        await this.flightPlanService.temporaryInsert();
        await this.flightPlanService.deleteElementAt(12); */

        // Default performance values
        this.flightPlanService.active.setPerformanceData('pilotAccelerationAltitude', 2_900);
        this.flightPlanService.active.setPerformanceData('pilotThrustReductionAltitude', 1_900);
        this.flightPlanService.active.setPerformanceData('pilotTransitionAltitude', 5_000);
        this.acInterface.updateTransitionAltitudeLevel();
        this.flightPlanService.active.setPerformanceData('pilotEngineOutAccelerationAltitude', 1_500);
        this.flightPlanService.active.setPerformanceData('v1', 120);
        this.flightPlanService.active.setPerformanceData('vr', 140);
        this.flightPlanService.active.setPerformanceData('v2', 145);
        this.flightPlanService.active.setPerformanceData('costIndex', 69);
        this.fmgc.data.approachSpeed.set(145);
        this.fmgc.data.zeroFuelWeight.set(300_000);
        this.fmgc.data.zeroFuelWeightCenterOfGravity.set(26);
        this.fmgc.data.blockFuel.set(25_000);
        this.acInterface.setCruiseFl(230);
    }

    private initSimVars() {
        // Reset SimVars
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots', 0);
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots', 0);

        SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', -1);
        SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', -1);

        SimVar.SetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet', -1);
        SimVar.SetSimVarValue('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet', 0);

        SimVar.SetSimVarValue(
            'L:A32NX_FG_ALTITUDE_CONSTRAINT',
            'feet',
            0,
        );
        SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'Bool', 0);
        SimVar.SetSimVarValue('L:A32NX_CABIN_READY', 'Bool', 0);
        SimVar.SetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number', 0);

        if (
            SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_DISABLED', 'number') === 1
        ) {
            SimVar.SetSimVarValue('K:A32NX.ATHR_RESET_DISABLE', 'number', 1);
        }

        SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', false);

        // Reset SimVars
        SimVar.SetSimVarValue('L:AIRLINER_V1_SPEED', 'Knots', NaN);
        SimVar.SetSimVarValue('L:AIRLINER_V2_SPEED', 'Knots', NaN);
        SimVar.SetSimVarValue('L:AIRLINER_VR_SPEED', 'Knots', NaN);

        const gpsDriven = SimVar.GetSimVarValue('GPS DRIVES NAV1', 'Bool');
        if (!gpsDriven) {
            SimVar.SetSimVarValue('K:TOGGLE_GPS_DRIVES_NAV1', 'Bool', 0);
        }
        SimVar.SetSimVarValue('K:VS_SLOT_INDEX_SET', 'number', 1);

        // Start the check routine for system health and status
        setInterval(() => {
            if (this.flightPhaseManager.phase === FmgcFlightPhase.Cruise && !this.destDataChecked) {
                const dest = this.flightPlanService.active.destinationAirport;
                const distanceFromPpos = distanceTo(this.navigation.getPpos() ?? { lat: 0, long: 0 }, dest?.location ?? 0);
                if (dest && distanceFromPpos < 180) {
                    this.destDataChecked = true;
                    this.checkDestData();
                }
            }
        }, 15000);
    }

    public clearLatestFmsErrorMessage() {
        const arr = this.fmsErrors.getArray().concat([]);
        const index = arr.findIndex((val) => val.cleared === false);

        if (index > -1) {
            if (arr[index].message.isTypeTwo === true) {
                const old = arr[index];
                old.cleared = true;

                this.fmsErrors.set(arr);
            } else {
                this.fmsErrors.removeAt(index);
            }
        }
    }

    /**
     * Called when a flight plan uplink is in progress
     */
    onUplinkInProgress() {
        this.fmgc.data.cpnyFplnUplinkInProgress.set(true);
        this.addMessageToQueue(NXSystemMessages.uplinkInsertInProg, () => this.fmgc.data.cpnyFplnUplinkInProgress.get() === false, undefined);
    }

    /**
     * Called when a flight plan uplink is done
     */
    onUplinkDone() {
        this.fmgc.data.cpnyFplnUplinkInProgress.set(false);
        this.fmgc.data.cpnyFplnAvailable.set(true);
        this.removeMessageFromQueue(NXSystemMessages.uplinkInsertInProg.text);
    }

    /**
     * Calling this function with a message should display the message in the FMS' message area,
     * such as the scratchpad or a dedicated error line. The FMS error type given should be translated
     * into the appropriate message for the UI
     *
     * @param errorType the message to show
     */
    showFmsErrorMessage(errorType: FmsErrorType) {
        switch (errorType) {
        case FmsErrorType.EntryOutOfRange:
            this.addMessageToQueue(NXSystemMessages.entryOutOfRange, undefined, undefined);
            break;
        case FmsErrorType.FormatError:
            this.addMessageToQueue(NXSystemMessages.formatError, undefined, undefined);
            break;
        case FmsErrorType.NotInDatabase:
            this.addMessageToQueue(NXSystemMessages.notInDatabase, undefined, undefined);
            break;
        case FmsErrorType.NotYetImplemented:
            this.addMessageToQueue(NXFictionalMessages.notYetImplemented, undefined, undefined);
            break;
        default:
            break;
        }
    }

    /**
     * Duplicate implementation, because WaypointEntryUtils needs one parameter with both DataInterface and DisplayInterface
     */
    async deduplicateFacilities<T extends DatabaseItem<any>>(items: T[]): Promise<T | undefined> {
        return this.mfdReference?.deduplicateFacilities(items);
    }

    /**
     * Duplicate implementation, because WaypointEntryUtils needs one parameter with both DataInterface and DisplayInterface
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async createNewWaypoint(ident: string): Promise<Waypoint | undefined> {
        // TODO navigate to DATA/NAVAID --> PILOT STORED NAVAIDS --> NEW NAVAID
        return undefined;
    }

    /**
     * Add message to fmgc message queue
     * @param _message MessageObject
     * @param _isResolvedOverride Function that determines if the error is resolved at this moment (type II only).
     * @param _onClearOverride Function that executes when the error is actively cleared by the pilot (type II only).
     */
    public addMessageToQueue(_message: TypeIMessage | TypeIIMessage, _isResolvedOverride: (() => boolean) | undefined = undefined, _onClearOverride: (() => void) | undefined = undefined) {
        const message = _isResolvedOverride === undefined && _onClearOverride === undefined ? _message : _message.getModifiedMessage('', _isResolvedOverride, _onClearOverride);

        const msg: FmsErrorMessage = {
            message: _message,
            messageText: message.text,
            backgroundColor: message.isAmber ? 'amber' : 'white',
            cleared: false,
            onClearOverride: _message instanceof TypeIIMessage ? _message.onClear : () => { },
            isResolvedOverride: _message instanceof TypeIIMessage ? _message.isResolved : () => false,
        };

        const exists = this.fmsErrors.getArray().findIndex((el) => el.messageText === msg.messageText && el.cleared === true);
        if (exists !== -1) {
            this.fmsErrors.removeAt(exists);
        }
        this.fmsErrors.insert(msg, 0);
    }

    /**
     * Removes a message from the queue
     * @param value {String}
     */
    removeMessageFromQueue(value: string) {
        const exists = this.fmsErrors.getArray().findIndex((el) => el.messageText === value);
        if (exists !== -1) {
            this.fmsErrors.removeAt(exists);
        }
    }

    private updateMessageQueue() {
        this.fmsErrors.getArray().forEach((it, idx) => {
            if (it.message.isTypeTwo === true && it.isResolvedOverride() === true) {
                console.warn(`message "${it.messageText}" is resolved.`);
                this.fmsErrors.removeAt(idx);
            }
        });
    }

    openMessageList() {
        this.mfdReference?.openMessageList();
    }

    createLatLonWaypoint(coordinates: Coordinates, stored: boolean, ident?: string): PilotWaypoint {
        return this.dataManager?.createLatLonWaypoint(coordinates, stored, ident) ?? null;
    }

    createPlaceBearingPlaceBearingWaypoint(place1: Fix, bearing1: DegreesTrue, place2: Fix, bearing2: DegreesTrue, stored?: boolean, ident?: string): PilotWaypoint {
        return this.dataManager?.createPlaceBearingPlaceBearingWaypoint(place1 as Waypoint, bearing1, place2 as Waypoint, bearing2, stored, ident) ?? null;
    }

    createPlaceBearingDistWaypoint(place: Fix, bearing: DegreesTrue, distance: NauticalMiles, stored?: boolean, ident?: string): PilotWaypoint {
        return this.dataManager?.createPlaceBearingDistWaypoint(place as Waypoint, bearing, distance, stored, ident) ?? null;
    }

    getStoredWaypointsByIdent(ident: string): PilotWaypoint[] {
        return this.dataManager?.getStoredWaypointsByIdent(ident) ?? [];
    }

    private destDataChecked = false;

    /**
     * This method is called by the FlightPhaseManager after a flight phase change
     * This method initializes AP States, initiates CDUPerformancePage changes and other set other required states
     * @param prevPhase {FmgcFlightPhases} Previous FmgcFlightPhase
     * @param nextPhase {FmgcFlightPhases} New FmgcFlightPhase
     */
    onFlightPhaseChanged(prevPhase: FmgcFlightPhase, nextPhase: FmgcFlightPhase) {
        this.acInterface.updateConstraints();
        this.acInterface.updateManagedSpeed();

        SimVar.SetSimVarValue('L:A32NX_CABIN_READY', 'Bool', 0);

        switch (nextPhase) {
        case FmgcFlightPhase.Takeoff: {
            this.destDataChecked = false;

            const plan = this.flightPlanService.active;
            const pd = this.fmgc.data;

            if (plan.performanceData.accelerationAltitude === undefined) {
                // it's important to set this immediately as we don't want to immediately sequence to the climb phase
                plan.setPerformanceData('pilotAccelerationAltitude', SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')));
                this.acInterface.updateThrustReductionAcceleration();
            }
            if (plan.performanceData.engineOutAccelerationAltitude === undefined) {
                // it's important to set this immediately as we don't want to immediately sequence to the climb phase
                plan.setPerformanceData('pilotEngineOutAccelerationAltitude', SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')));
                this.acInterface.updateThrustReductionAcceleration();
            }

            pd.taxiFuelPilotEntry.set(null);
            pd.routeReserveFuelPercentagePilotEntry.set(0.00001);
            pd.routeReserveFuelWeightPilotEntry.set(0.00001);

            this.fmgc.data.climbPredictionsReferenceAutomatic.set(this.guidanceController.verticalProfileComputationParametersObserver.get().fcuAltitude);

            /** Arm preselected speed/mach for next flight phase */
            const climbPreSel = this.fmgc.data.climbPreSelSpeed.get();
            if (climbPreSel) {
                this.acInterface.updatePreSelSpeedMach(climbPreSel);
            }

            break;
        }

        case FmgcFlightPhase.Climb: {
            this.destDataChecked = false;

            /** Activate pre selected speed/mach */
            if (prevPhase === FmgcFlightPhase.Takeoff) {
                const climbPreSel = this.fmgc.data.climbPreSelSpeed.get();
                if (climbPreSel) {
                    this.acInterface.activatePreSelSpeedMach(climbPreSel);
                }
            }

            /** Arm preselected speed/mach for next flight phase */
            const cruisePreSel = this.fmgc.data.cruisePreSelMach.get() ?? 280;
            const cruisePreSelMach = this.fmgc.data.cruisePreSelMach.get();
            this.acInterface.updatePreSelSpeedMach(cruisePreSelMach ?? cruisePreSel);

            if (!this.flightPlanService.active.performanceData.cruiseFlightLevel) {
                this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', (Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') ?? 0) / 100);
                SimVar.SetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number', (Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') ?? 0));
            }

            break;
        }

        case FmgcFlightPhase.Cruise: {
            SimVar.SetSimVarValue('L:A32NX_GOAROUND_PASSED', 'bool', 0);
            Coherent.call('GENERAL_ENG_THROTTLE_MANAGED_MODE_SET', ThrottleMode.AUTO).catch(console.error).catch(console.error);

            const cruisePreSel = this.fmgc.data.cruisePreSelSpeed.get() ?? 320;
            const cruisePreSelMach = this.fmgc.data.cruisePreSelMach.get();

            /** Activate pre selected speed/mach */
            if (prevPhase === FmgcFlightPhase.Climb) {
                this.acInterface.activatePreSelSpeedMach(cruisePreSelMach ?? cruisePreSel);
            }

            /** Arm preselected speed/mach for next flight phase */
            const desPreSel = this.fmgc.data.descentPreSelSpeed.get();
            if (desPreSel) {
                this.acInterface.updatePreSelSpeedMach(desPreSel);
            }

            break;
        }

        case FmgcFlightPhase.Descent: {
            this.checkDestData();

            Coherent.call('GENERAL_ENG_THROTTLE_MANAGED_MODE_SET', ThrottleMode.AUTO).catch(console.error).catch(console.error);

            /** Activate pre selected speed/mach */
            const desPreSel = this.fmgc.data.descentPreSelSpeed.get();
            if (prevPhase === FmgcFlightPhase.Cruise && desPreSel) {
                this.acInterface.activatePreSelSpeedMach(desPreSel);
            }

            /** Clear pre selected speed/mach */
            this.acInterface.updatePreSelSpeedMach(null);
            this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', null);

            break;
        }

        case FmgcFlightPhase.Approach: {
            Coherent.call('GENERAL_ENG_THROTTLE_MANAGED_MODE_SET', ThrottleMode.AUTO).catch(console.error);
            SimVar.SetSimVarValue('L:A32NX_GOAROUND_PASSED', 'bool', 0);

            this.checkDestData();

            break;
        }

        case FmgcFlightPhase.GoAround: {
            SimVar.SetSimVarValue('L:A32NX_GOAROUND_GATRK_MODE', 'bool', 0);
            SimVar.SetSimVarValue('L:A32NX_GOAROUND_HDG_MODE', 'bool', 0);
            SimVar.SetSimVarValue('L:A32NX_GOAROUND_NAV_MODE', 'bool', 0);
            SimVar.SetSimVarValue('L:A32NX_GOAROUND_INIT_SPEED', 'number', Simplane.getIndicatedSpeed());
            SimVar.SetSimVarValue('L:A32NX_GOAROUND_INIT_APP_SPEED', 'number', this.fmgc.getApproachSpeed());
            // delete override logic when we have valid nav data -aka goaround path- after goaround!
            SimVar.SetSimVarValue('L:A32NX_GOAROUND_NAV_OVERRIDE', 'bool', 0);

            if (SimVar.GetSimVarValue('AUTOPILOT MASTER', 'Bool') === 1) {
                SimVar.SetSimVarValue('K:AP_LOC_HOLD_ON', 'number', 1); // Turns AP localizer hold !!ON/ARMED!! and glide-slope hold mode !!OFF!!
                SimVar.SetSimVarValue('K:AP_LOC_HOLD_OFF', 'number', 1); // Turns !!OFF!! localizer hold mode
                SimVar.SetSimVarValue('K:AUTOPILOT_OFF', 'number', 1);
                SimVar.SetSimVarValue('K:AUTOPILOT_ON', 'number', 1);
                SimVar.SetSimVarValue('L:A32NX_AUTOPILOT_APPR_MODE', 'bool', 0);
                SimVar.SetSimVarValue('L:A32NX_AUTOPILOT_LOC_MODE', 'bool', 0);
            } else if (SimVar.GetSimVarValue('AUTOPILOT MASTER', 'Bool') === 0 && SimVar.GetSimVarValue('AUTOPILOT APPROACH HOLD', 'boolean') === 1) {
                SimVar.SetSimVarValue('AP_APR_HOLD_OFF', 'number', 1);
                SimVar.SetSimVarValue('L:A32NX_AUTOPILOT_APPR_MODE', 'bool', 0);
                SimVar.SetSimVarValue('L:A32NX_AUTOPILOT_LOC_MODE', 'bool', 0);
            }

            const currentHeading = Simplane.getHeadingMagnetic();
            Coherent.call('HEADING_BUG_SET', 1, currentHeading).catch(console.error);

            const activePlan = this.flightPlanService.active;

            if (activePlan.performanceData.missedAccelerationAltitude === undefined) {
                // it's important to set this immediately as we don't want to immediately sequence to the climb phase
                activePlan.setPerformanceData('pilotMissedAccelerationAltitude',
                    SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')));
                if (this.flightPlanService.hasActive) {
                    this.acInterface.updateThrustReductionAcceleration();
                }
            }
            if (activePlan.performanceData.missedEngineOutAccelerationAltitude === undefined) {
                // it's important to set this immediately as we don't want to immediately sequence to the climb phase
                activePlan.setPerformanceData('pilotMissedEngineOutAccelerationAltitude',
                    SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')));
                if (this.flightPlanService.hasActive) {
                    this.acInterface.updateThrustReductionAcceleration();
                }
            }

            break;
        }

        case FmgcFlightPhase.Done:
            this.mfdReference?.uiService.navigateTo('fms/data/status');

            this.flightPlanService.reset().then(() => {
                this.initSimVars();
                this.deleteAllStoredWaypoints();
                this.clearLatestFmsErrorMessage();
                SimVar.SetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', true).then(() => {
                    this.mfdReference?.uiService.navigateTo('fms/data/status');
                });
            }).catch(console.error);
            break;

        default:
            break;
        }
    }

    private checkDestData(): void {
        const destPred = this.guidanceController.vnavDriver.getDestinationPrediction();
        if (this.flightPhaseManager.phase >= FmgcFlightPhase.Descent || (this.flightPhaseManager.phase === FmgcFlightPhase.Cruise && destPred && destPred.distanceFromAircraft < 180)) {
            this.addMessageToQueue(
                NXSystemMessages.enterDestData,
                () => (Number.isFinite(this.fmgc.getApproachQnh())
                    && Number.isFinite(this.fmgc.getApproachTemperature())
                    && Number.isFinite(this.fmgc.getApproachWind().direction)
                    && Number.isFinite(this.fmgc.getApproachWind().speed)),
                () => { },
            );
        }
    }

    private gwInitDisplayed = 0;

    private initMessageSettable = false;

    private checkGWParams(): void {
        const fmGW = SimVar.GetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number');
        const eng2state = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:2', 'Number');
        const eng3state = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:3', 'Number');

        if (eng2state === 2 || eng3state === 2) {
            if (this.gwInitDisplayed < 1 && this.flightPhaseManager.phase < FmgcFlightPhase.Takeoff) {
                this.initMessageSettable = true;
            }
        }
        // INITIALIZE WEIGHT/CG
        if (this.fmgc.isAnEngineOn() && fmGW === 0 && this.initMessageSettable) {
            this.addMessageToQueue(NXSystemMessages.initializeWeightOrCg, () => SimVar.GetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number') !== 0);
            this.gwInitDisplayed++;
            this.initMessageSettable = false;
        }
    }

    private onUpdate(dt: number) {
        this.flightPhaseManager.shouldActivateNextPhase(dt);
        this.navaidSelectionManager.update(dt);
        this.landingSystemSelectionManager.update(dt);
        this.navaidTuner.update(dt);

        const throttledDt = this.fmsUpdateThrottler.canUpdate(dt);

        if (throttledDt !== -1) {
            this.navigation.update(throttledDt);
            if (this.flightPlanService.hasActive) {
                this.acInterface.updateThrustReductionAcceleration();
                this.acInterface.updateTransitionAltitudeLevel();
                this.acInterface.updatePerformanceData();
                this.acInterface.updatePerfSpeeds();
                this.acInterface.updateWeights();
                this.acInterface.updateBtvData();
                this.acInterface.toSpeedsChecks();

                const toFlaps = this.fmgc.getTakeoffFlapsSetting();
                if (toFlaps) {
                    this.acInterface.setTakeoffFlaps(toFlaps);
                }

                const thsFor = this.fmgc.data.takeoffThsFor.get();
                if (thsFor) {
                    this.acInterface.setTakeoffTrim(thsFor);
                }

                const destPred = this.guidanceController.vnavDriver.getDestinationPrediction();
                if (destPred) {
                    this.acInterface.updateMinimums(destPred.distanceFromAircraft);
                }
                this.acInterface.updateIlsCourse(this.navigation.getNavaidTuner().getMmrRadioTuningStatus(1));
            }
            this.getGrossWeight();
            this.checkGWParams();
            this.updateMessageQueue();

            this.acInterface.checkSpeedLimit();
            this.acInterface.thrustReductionAccelerationChecks();
            // TODO port over from legacy code
            // this.updatePerfPageAltPredictions();
        }

        const flightPlanChanged = this.flightPlanService.activeOrTemporary.version !== this.lastFlightPlanVersion;

        if (flightPlanChanged) {
            this.acInterface.updateManagedProfile();
            this.acInterface.updateDestinationData();
            this.lastFlightPlanVersion = this.flightPlanService.activeOrTemporary.version;
        }

        this.acInterface.updateAutopilot(dt);

        this.guidanceController.update(dt);

        this.efisSymbols.update(dt);

        this.acInterface.arincBusOutputs.forEach((word) => word.writeToSimVarIfDirty());
    }

    updateEfisPlanCentre(planDisplayForPlan: number, planDisplayLegIndex: number, planDisplayInAltn: boolean) {
        const numLinesPerPage = this.flightPlanService.hasTemporary ? 7 : 8;
        // How many pseudo waypoints?
        // eslint-disable-next-line max-len
        const numPseudoDisplayed = this.guidanceController?.pseudoWaypoints?.pseudoWaypoints?.filter((wpt) => wpt.displayedOnMcdu && wpt.alongLegIndex > planDisplayLegIndex && wpt.alongLegIndex < (planDisplayLegIndex + numLinesPerPage)).length;
        const flightPlan = this.flightPlanService.get(planDisplayForPlan);

        // Update ND map center
        this.efisInterface.setPlanCentre(planDisplayForPlan, planDisplayLegIndex, planDisplayInAltn);
        this.efisInterface.setMissedLegVisible(
            (planDisplayLegIndex + numLinesPerPage - numPseudoDisplayed)
            >= flightPlan.firstMissedApproachLegIndex,
            planDisplayForPlan,
        );
        this.efisInterface.setAlternateLegVisible(planDisplayInAltn
            || (flightPlan.alternateFlightPlan && (planDisplayLegIndex + numLinesPerPage - numPseudoDisplayed)
            >= (flightPlan.legCount + 1)), // Account for "END OF F-PLN line"
        planDisplayForPlan);
        this.efisInterface.setAlternateMissedLegVisible((planDisplayInAltn && (planDisplayLegIndex + numLinesPerPage) >= flightPlan.alternateFlightPlan.firstMissedApproachLegIndex)
            || (flightPlan.alternateFlightPlan && (planDisplayLegIndex + numLinesPerPage - numPseudoDisplayed)
            >= (flightPlan.alternateFlightPlan.firstMissedApproachLegIndex + flightPlan.legCount + 1)), // Account for "END OF F-PLN line"
        planDisplayForPlan);
        this.efisInterface.setSecRelatedPageOpen(planDisplayForPlan >= FlightPlanIndex.FirstSecondary);
    }

    handleFcuAltKnobPushPull(distanceToDestination: number): void {
        this.flightPhaseManager.handleFcuAltKnobPushPull(distanceToDestination);
    }

    handleFcuAltKnobTurn(distanceToDestination: number): void {
        this.flightPhaseManager.handleFcuAltKnobTurn(distanceToDestination);
    }

    handleFcuVSKnob(distanceToDestination: number, onStepClimbDescent: () => void): void {
        this.flightPhaseManager.handleFcuVSKnob(distanceToDestination, onStepClimbDescent);
    }

    handleNewCruiseAltitudeEntered(newCruiseFlightLevel: number): void {
        this.flightPhaseManager.handleNewCruiseAltitudeEntered(newCruiseFlightLevel);
    }

    tryGoInApproachPhase(): void {
        this.flightPhaseManager.tryGoInApproachPhase();
    }
}
