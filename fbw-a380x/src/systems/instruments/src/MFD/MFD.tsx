/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/MFD/pages/common/style.scss';

import {
    ArraySubject,
    ClockEvents,
    ComponentProps,
    DisplayComponent,
    EventBus,
    FSComponent,
    HEvent,
    Subject,
    VNode,
} from '@microsoft/msfs-sdk';

import { MouseCursor } from 'instruments/src/MFD/pages/common/MouseCursor';

import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';

import { MfdMsgList } from 'instruments/src/MFD/pages/FMS/MSG_LIST';
import { ActiveUriInformation, MfdUIService } from 'instruments/src/MFD/pages/common/UIService';
import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { Coordinates, DegreesTrue, NauticalMiles, distanceTo } from 'msfs-geo';
import { EfisSymbols } from '@fmgc/efis/EfisSymbols';
import { NavaidTuner } from '@fmgc/navigation/NavaidTuner';
import { NavaidSelectionManager } from '@fmgc/navigation/NavaidSelectionManager';
import { LandingSystemSelectionManager } from '@fmgc/navigation/LandingSystemSelectionManager';
import { NavigationDatabaseService } from '@fmgc/flightplanning/new/NavigationDatabaseService';
import { MfdFlightManagementService } from 'instruments/src/MFD/pages/common/FlightManagementService';
import { MfdFmsFplnDuplicateNames } from 'instruments/src/MFD/pages/FMS/F-PLN/DUPLICATE_NAMES';
import { DatabaseItem, Waypoint } from 'msfs-navdata';
import { DisplayInterface } from '@fmgc/flightplanning/new/interface/DisplayInterface';
import { FmsErrorType } from '@fmgc/FmsError';
import { FmgcDataInterface } from 'instruments/src/MFD/fmgc';
import { getFlightPhaseManager } from '@fmgc/flightphase';
import { FmgcFlightPhase } from '@shared/flightphase';
import { Fix, NXDataStore, UpdateThrottler } from '@flybywiresim/fbw-sdk';
import { MfdSimvars } from './shared/MFDSimvarPublisher';
import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { DataManager, PilotWaypoint } from '@fmgc/flightplanning/new/DataManager';
import { DataInterface } from '@fmgc/flightplanning/new/interface/DataInterface';
import { A320FlightPlanPerformanceData, EfisInterface, Navigation } from '@fmgc/index';
import { NXFictionalMessages, NXSystemMessages, TypeIIMessage, TypeIMessage } from 'instruments/src/MFD/pages/FMS/legacy/NXSystemMessages';
import { headerForSystem, pageForUrl } from 'instruments/src/MFD/MfdPageDirectory';

// Import for pages

export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a380x-mfd')[0].getAttribute('url');
    return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

export interface AbstractMfdPageProps extends ComponentProps {
    pageTitle?: string;
    bus: EventBus;
    uiService: MfdUIService;
    fmService: MfdFlightManagementService;
}

interface MfdComponentProps extends ComponentProps {
    bus: EventBus;
    instrument: BaseInstrument;
}

export interface FmsErrorMessage {
    message: string;
    backgroundColor: 'none' | 'amber' | 'cyan'; // Whether the message should be colored. White text on black background if 'none'
    cleared: boolean; // If message has been cleared from footer
    isResolvedOverride: () => boolean;
    onClearOverride: () => void;
}
export class MfdComponent extends DisplayComponent<MfdComponentProps> implements DisplayInterface, DataInterface {
    private uiService = new MfdUIService();

    private flightPlanService = new FlightPlanService(this.props.bus, new A320FlightPlanPerformanceData());

    private fmgc = new FmgcDataInterface(this.flightPlanService);

    private fmsUpdateThrottler = new UpdateThrottler(250);

    private efisInterface = new EfisInterface('L');

    private guidanceController: GuidanceController;

    private navigation = new Navigation(this.flightPlanService, undefined);

    private navaidSelectionManager = new NavaidSelectionManager(this.flightPlanService, this.navigation);

    private landingSystemSelectionManager = new LandingSystemSelectionManager(this.flightPlanService, this.navigation)

    private navaidTuner = new NavaidTuner(this.navigation, this.navaidSelectionManager, this.landingSystemSelectionManager);

    private efisSymbols: EfisSymbols;

    private flightPhaseManager = getFlightPhaseManager();

    private dataManager = new DataManager(this);

    public getDataManager() {
        return this.dataManager;
    }

    private fmService: MfdFlightManagementService;

    public fmsErrors = ArraySubject.create<FmsErrorMessage>();

    private displayBrightness = Subject.create(0);

    private displayPowered = Subject.create(false);

    private activeFmsSource = Subject.create<'FMS 1' | 'FMS 2' | 'FMS 1-C' | 'FMS 2-C'>('FMS 1');

    private mouseCursorRef = FSComponent.createRef<MouseCursor>();

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private activePageRef = FSComponent.createRef<HTMLDivElement>();

    private activePage: VNode = null;

    private activeHeaderRef = FSComponent.createRef<HTMLDivElement>();

    private activeHeader: VNode = null;

    private messageListOpened = Subject.create<boolean>(false);

    private duplicateNamesOpened = Subject.create<boolean>(false);

    private duplicateNamesRef = FSComponent.createRef<MfdFmsFplnDuplicateNames>();

    private destDataChecked = false;

    // Necessary to enable mouse interaction
    get isInteractive(): boolean {
        return true;
    }

    private async initializeFlightPlans() {
        const db = new NavigationDatabase(NavigationDatabaseBackend.Msfs);
        NavigationDatabaseService.activeDatabase = db;
        await new Promise((r) => setTimeout(r, 2000));
        this.flightPlanService.createFlightPlans();

        // Intialize from MSFS flight data
        // this.flightPlanService.active.performanceData.cruiseFlightLevel.set(SimVar.GetGameVarValue('AIRCRAFT CRUISE ALTITUDE', 'feet'));

        // Build EDDM08R GIVMI6E GIVMI DCT DKB DCT ILS25L EDDF25L
        /* await this.flightPlanService.newCityPair('EDDM', 'EDDF', 'EBBR');
        await this.flightPlanService.setOriginRunway('RW08R');
        await this.flightPlanService.setDepartureProcedure('GIVM6E');
        await this.flightPlanService.nextWaypoint(4, (await db.searchAllFix('DKB'))[0]);
        await this.flightPlanService.setDestinationRunway('RW25L');
        await this.flightPlanService.setApproach('I25L');
        await this.flightPlanService.temporaryInsert(); */

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
        /* this.flightPlanService.active.setPerformanceData('pilotAccelerationAltitude', 2_900);
        this.flightPlanService.active.setPerformanceData('pilotThrustReductionAltitude', 1_900);
        this.flightPlanService.active.setPerformanceData('pilotTransitionAltitude', 5_000);
        this.flightPlanService.active.setPerformanceData('pilotEngineOutAccelerationAltitude', 1_500);
        this.flightPlanService.active.setPerformanceData('v1', 120);
        this.flightPlanService.active.setPerformanceData('vr', 140);
        this.flightPlanService.active.setPerformanceData('v2', 145);
        this.fmService.fmgc.data.approachSpeed.set(145);
        this.fmService.fmgc.data.zeroFuelWeight.set(50_000);
        this.fmService.fmgc.data.zeroFuelWeightCenterOfGravity.set(26);
        this.fmService.fmgc.data.blockFuel.set(10_000);
        this.fmService.fmgc.data.costIndex.set(69);
        this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', 230); */
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
                const distanceFromPpos = distanceTo(this.navigation.getPpos(), dest.location);
                if (dest && distanceFromPpos < 180) {
                    this.destDataChecked = true;
                    this.checkDestData();
                }
            }
        }, 15000);
    }

    /**
     * Called when a flight plan uplink is in progress
     */
    onUplinkInProgress() {
        this.fmService.fmgc.data.cpnyFplnUplinkInProgress.set(true);
    }

    /**
         * Called when a flight plan uplink is done
         */
    onUplinkDone() {
        this.fmService.fmgc.data.cpnyFplnUplinkInProgress.set(false);
        this.fmService.fmgc.data.cpnyFplnAvailable.set(true);
        this.addMessageToQueue(NXSystemMessages.uplinkInsertInProg);
    }

    /**
         * Calling this function with a message should display 1the message in the FMS' message area,
         * such as the scratchpad or a dedicated error line. The FMS error type given should be translated
         * into the appropriate message for the UI
         *
         * @param errorType the message to show
         */
    showFmsErrorMessage(errorType: FmsErrorType) {
        switch (errorType) {
        case FmsErrorType.EntryOutOfRange:
            this.addMessageToQueue(NXSystemMessages.entryOutOfRange);
            return;
        case FmsErrorType.FormatError:
            this.addMessageToQueue(NXSystemMessages.formatError);
            return;
        case FmsErrorType.NotInDatabase:
            this.addMessageToQueue(NXSystemMessages.notInDatabase);
            return;
        case FmsErrorType.NotYetImplemented:
            this.addMessageToQueue(NXFictionalMessages.notYetImplemented);
            return;

        default:
            break;
        }
    }

    public clearLatestFmsErrorMessage() {
        const arr = this.fmsErrors.getArray().concat([]);
        const index = arr.findIndex((val) => val.cleared === false);

        if (index > -1) {
            const old = arr[index];
            old.cleared = true;

            this.fmsErrors.set(arr);
        }
    }

    public openMessageList() {
        this.messageListOpened.set(true);
    }

    /**
     * Add type 2 message to fmgc message queue
     * @param _message MessageObject
     * @param _isResolvedOverride Function that determines if the error is resolved at this moment (type II only).
     * @param _onClearOverride Function that executes when the error is actively cleared by the pilot (type II only).
     */
    public addMessageToQueue(_message: TypeIMessage | TypeIIMessage, _isResolvedOverride: () => boolean = undefined, _onClearOverride: () => void = undefined) {
        if (!_message.isTypeTwo) {
            return;
        }
        const message = _isResolvedOverride === undefined && _onClearOverride === undefined ? _message : _message.getModifiedMessage("", _isResolvedOverride, _onClearOverride);

        const msg: FmsErrorMessage = {
            message: message.text,
            backgroundColor: message.isAmber ? 'amber' : 'none',
            cleared: false,
            onClearOverride: _message instanceof TypeIIMessage ? _message.onClear : () => {},
            isResolvedOverride: _message instanceof TypeIIMessage ? _message.isResolved : () => false,
        }

        const exists = this.fmsErrors.getArray().findIndex((el) => el.message === msg.message && el.cleared === true);
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
        const exists = this.fmsErrors.getArray().findIndex((el) => el.message === value);
        if (exists !== -1) {
            this.fmsErrors.removeAt(exists);
        }
    }

    private updateMessageQueue() {
        this.fmsErrors.getArray().forEach((it, idx) => {
            if (it.isResolvedOverride() === true) {
                this.fmsErrors.removeAt(idx);
            }});
    }

    /**
         * Calling this function with an array of items should display a UI allowing the user to
         * select the right item from a list of duplicates, and return the one chosen by the user or
         * `undefined` if the operation is cancelled.
         *
         * @param items the items to de-duplicate
         *
         * @returns the chosen item
         */
    async deduplicateFacilities<T extends DatabaseItem<any>>(items: T[]): Promise<T | undefined> {
        if (items.length > 1) {
            this.duplicateNamesOpened.set(true);
            const result = await this.duplicateNamesRef.instance.deduplicateFacilities(items);
            this.duplicateNamesOpened.set(false);

            return result;
        }
        return items[0];
    }

    /**
         * Calling this function should show a UI allowing the pilot to create a new waypoint with the ident
         * provided
         *
         * @param ident the identifier the waypoint should have
         *
         * @returns the created waypoint, or `undefined` if the operation is cancelled
         */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async createNewWaypoint(ident: string): Promise<Waypoint | undefined> {
        // TODO navigate to DATA/NAVAID --> PILOT STORED NAVAIDS --> NEW NAVAID
        return undefined;
    }

    createLatLonWaypoint(coordinates: Coordinates, stored: boolean, ident?: string): PilotWaypoint {
        return this.dataManager.createLatLonWaypoint(coordinates, stored, ident);
    }

    createPlaceBearingPlaceBearingWaypoint(place1: Fix, bearing1: DegreesTrue, place2: Fix, bearing2: DegreesTrue, stored?: boolean, ident?: string): PilotWaypoint {
        return this.dataManager.createPlaceBearingPlaceBearingWaypoint(place1 as Waypoint, bearing1, place2 as Waypoint, bearing2, stored, ident);
    }

    createPlaceBearingDistWaypoint(place: Fix, bearing: DegreesTrue, distance: NauticalMiles, stored?: boolean, ident?: string): PilotWaypoint {
        return this.dataManager.createPlaceBearingDistWaypoint(place as Waypoint, bearing, distance, stored, ident);
    }

    getStoredWaypointsByIdent(ident: string): PilotWaypoint[] {
        return this.dataManager.getStoredWaypointsByIdent(ident);
    }

    /**
     * Checks whether a waypoint is currently in use
     * @param waypoint the waypoint to look for
     */
    async isWaypointInUse(waypoint: Waypoint): Promise<boolean> {
        // Check in all flight plans
        if (this.flightPlanService.hasActive) {
            this.flightPlanService.active.allLegs.forEach((it) => {
                if (it.isDiscontinuity === false && it.definition.waypoint.databaseId === waypoint.databaseId) {
                    return true;
                }
            });
        }

        if (this.flightPlanService.hasTemporary) {
            this.flightPlanService.temporary.allLegs.forEach((it) => {
                if (it.isDiscontinuity === false && it.definition.waypoint.databaseId === waypoint.databaseId) {
                    return true;
                }
            });
        }

        for (let i = 1; i <= 3; i++) {
            if (this.flightPlanService.hasSecondary(i)) {
                this.flightPlanService.secondary(i).allLegs.forEach((it) => {
                    if (it.isDiscontinuity === false && it.definition.waypoint.databaseId === waypoint.databaseId) {
                        return true;
                    }
                });
            }
        }

        if (this.flightPlanService.hasUplink) {
            this.flightPlanService.uplink.allLegs.forEach((it) => {
                if (it.isDiscontinuity === false && it.definition.waypoint.databaseId === waypoint.databaseId) {
                    return true;
                }
            });
        }


        return false;
    }

    /**
     * This method is called by the FlightPhaseManager after a flight phase change
     * This method initializes AP States, initiates CDUPerformancePage changes and other set other required states
     * @param prevPhase {FmgcFlightPhases} Previous FmgcFlightPhase
     * @param nextPhase {FmgcFlightPhases} New FmgcFlightPhase
     */
    onFlightPhaseChanged(prevPhase: FmgcFlightPhase, nextPhase: FmgcFlightPhase) {
        this.fmService.acInterface.updateConstraints();
        this.fmService.acInterface.updateManagedSpeed();

        SimVar.SetSimVarValue('L:A32NX_CABIN_READY', 'Bool', 0);

        switch (nextPhase) {
        case FmgcFlightPhase.Takeoff: {
            this.destDataChecked = false;

            const plan = this.flightPlanService.active;
            const pd = this.fmService.fmgc.data;

            if (plan.performanceData.accelerationAltitude === undefined) {
                // it's important to set this immediately as we don't want to immediately sequence to the climb phase
                plan.setPerformanceData('pilotAccelerationAltitude', SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')));
                this.fmService.acInterface.updateThrustReductionAcceleration();
            }
            if (plan.performanceData.engineOutAccelerationAltitude === undefined) {
                // it's important to set this immediately as we don't want to immediately sequence to the climb phase
                plan.setPerformanceData('pilotEngineOutAccelerationAltitude', SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')));
                this.fmService.acInterface.updateThrustReductionAcceleration();
            }

            pd.taxiFuel.set(null);
            pd.routeReserveFuelPercentagePilotEntry.set(0.00001);
            pd.routeReserveFuelWeightPilotEntry.set(0.00001);

            this.fmgc.data.climbPredictionsReferenceAutomatic.set(this.fmService.guidanceController.verticalProfileComputationParametersObserver.get().fcuAltitude);

            /** Arm preselected speed/mach for next flight phase */
            this.fmService.acInterface.updatePreSelSpeedMach(this.fmgc.data.climbPreSelSpeed.get());

            break;
        }

        case FmgcFlightPhase.Climb: {
            this.destDataChecked = false;

            /** Activate pre selected speed/mach */
            if (prevPhase === FmgcFlightPhase.Takeoff) {
                this.fmService.acInterface.activatePreSelSpeedMach(this.fmgc.data.climbPreSelSpeed.get());
            }

            /** Arm preselected speed/mach for next flight phase */
            this.fmService.acInterface.updatePreSelSpeedMach(this.fmgc.data.cruisePreSelMach.get() ?? this.fmgc.data.cruisePreSelSpeed.get());

            if (!this.flightPlanService.active.performanceData.cruiseFlightLevel) {
                this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') / 100);
            }

            break;
        }

        case FmgcFlightPhase.Cruise: {
            SimVar.SetSimVarValue('L:A32NX_GOAROUND_PASSED', 'bool', 0);
            Coherent.call('GENERAL_ENG_THROTTLE_MANAGED_MODE_SET', ThrottleMode.AUTO).catch(console.error).catch(console.error);

            /** Activate pre selected speed/mach */
            if (prevPhase === FmgcFlightPhase.Climb) {
                this.fmService.acInterface.activatePreSelSpeedMach(this.fmgc.data.cruisePreSelMach.get() ?? this.fmgc.data.cruisePreSelSpeed.get());
            }

            /** Arm preselected speed/mach for next flight phase */
            this.fmService.acInterface.updatePreSelSpeedMach(this.fmgc.data.descentPreSelSpeed.get());

            // This checks against the pilot defined cruise altitude and the automatically populated cruise altitude
            if (this.flightPlanService.active.performanceData.cruiseFlightLevel !== Math.floor(SimVar.GetGameVarValue('AIRCRAFT CRUISE ALTITUDE', 'feet') / 100)) {
                SimVar.SetGameVarValue('AIRCRAFT CRUISE ALTITUDE', 'feet', this.flightPlanService.active.performanceData.cruiseFlightLevel * 100);
                this.addMessageToQueue(NXSystemMessages.newCrzAlt.getModifiedMessage(this.flightPlanService.active.performanceData.cruiseFlightLevel.toFixed(0)));
            }

            break;
        }

        case FmgcFlightPhase.Descent: {
            this.checkDestData();

            Coherent.call('GENERAL_ENG_THROTTLE_MANAGED_MODE_SET', ThrottleMode.AUTO).catch(console.error).catch(console.error);

            /** Activate pre selected speed/mach */
            if (prevPhase === FmgcFlightPhase.Cruise) {
                this.fmService.acInterface.activatePreSelSpeedMach(this.fmgc.data.descentPreSelSpeed.get());
            }

            /** Clear pre selected speed/mach */
            this.fmService.acInterface.updatePreSelSpeedMach(undefined);

            this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', undefined);

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
                    SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')),
                );
                if (this.flightPlanService.hasActive) {
                    this.fmService.acInterface.updateThrustReductionAcceleration();
                }
            }
            if (activePlan.performanceData.missedEngineOutAccelerationAltitude === undefined) {
                // it's important to set this immediately as we don't want to immediately sequence to the climb phase
                activePlan.setPerformanceData('pilotMissedEngineOutAccelerationAltitude',
                    SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')),
                );
                if (this.flightPlanService.hasActive) {
                    this.fmService.acInterface.updateThrustReductionAcceleration();
                }
            }

            break;
        }

        case FmgcFlightPhase.Done:
            this.uiService.navigateTo('fms/data/status');

            this.flightPlanService.reset().then(() => {
                this.initSimVars();
                this.fmService.deleteAllStoredWaypoints();
                this.clearLatestFmsErrorMessage();
                SimVar.SetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', true).then(() => {
                    this.uiService.navigateTo('fms/data/status');
                });
            }).catch(console.error);
            break;

        default:
            break;
        }
    }

    private checkDestData(): void {
        const destPred = this.fmService.guidanceController.vnavDriver.getDestinationPrediction();
        if (this.flightPhaseManager.phase >= FmgcFlightPhase.Descent || (this.flightPhaseManager.phase === FmgcFlightPhase.Cruise && destPred && destPred.distanceFromAircraft < 180)) {
            this.addMessageToQueue(
                NXSystemMessages.enterDestData,
                () => (Number.isFinite(this.fmgc.getApproachQnh())
            && Number.isFinite(this.fmgc.getApproachTemperature())
            && Number.isFinite(this.fmgc.getApproachWind().direction)
            && Number.isFinite(this.fmgc.getApproachWind().speed)),
            () => {});
        }
    }

    private _gwInitDisplayed = 0;

    private _initMessageSettable = false;

    private _checkWeightSettable = true;

    private checkGWParams(): void {
        const fmGW = SimVar.GetSimVarValue("L:A32NX_FM_GROSS_WEIGHT", "Number");
        const eng1state = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:1", "Number");
        const eng2state = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:2", "Number");
        const gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
        const actualGrossWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "Kilograms") / 1000; //TO-DO Source to be replaced with FAC-GW
        const gwMismatch = (Math.abs(fmGW - actualGrossWeight) > 7) ? true : false;

        if (eng1state == 2 || eng2state == 2) {
            if (this._gwInitDisplayed < 1 && this.flightPhaseManager.phase < FmgcFlightPhase.Takeoff) {
                this._initMessageSettable = true;
            }
        }
        //INITIALIZE WEIGHT/CG
        if (this.fmgc.isAnEngineOn() && fmGW === 0 && this._initMessageSettable) {
            this.addMessageToQueue(NXSystemMessages.initializeWeightOrCg);
            this._gwInitDisplayed++;
            this._initMessageSettable = false;
        }

        //CHECK WEIGHT
        //TO-DO Ground Speed used for redundancy and to simulate delay (~10s) for FAC parameters to be calculated, remove once FAC is available.
        if (!this.fmgc.isOnGround() && gwMismatch && this._checkWeightSettable && gs > 180) {
            this.addMessageToQueue(NXSystemMessages.checkWeight);
            this._checkWeightSettable = false;
        } else if (!gwMismatch) {
            this.removeMessageFromQueue(NXSystemMessages.checkWeight.text);
            this._checkWeightSettable = true;
        }
    }

    private onUpdate (dt: number) {
        this.navaidSelectionManager.update(dt);
            this.landingSystemSelectionManager.update(dt);
            this.navaidTuner.update(dt);
            this.efisSymbols.update(dt);
            this.flightPhaseManager.shouldActivateNextPhase(dt);
            this.guidanceController.update(dt);

            if (this.fmsUpdateThrottler.canUpdate(dt) !== -1) {
                this.navigation.update(dt);
                if (this.flightPlanService.hasActive) {
                    this.fmService.acInterface.updateThrustReductionAcceleration();
                    this.fmService.acInterface.updateTransitionAltitudeLevel(this.fmgc.getOriginTransitionAltitude(), this.fmgc.getDestinationTransitionLevel());
                    this.fmService.acInterface.updatePerformanceData();
                    this.fmService.acInterface.updatePerfSpeeds();
                    this.fmService.acInterface.toSpeedsChecks();
                    this.fmService.acInterface.setTakeoffFlaps(this.fmService.fmgc.getTakeoffFlapsSetting());
                    this.fmService.acInterface.setTakeoffTrim(this.fmService.fmgc.data.takeoffThsFor.get());

                    const destPred = this.fmService.guidanceController.vnavDriver.getDestinationPrediction();
                    if (destPred) {
                        this.fmService.acInterface.updateMinimums(destPred.distanceFromAircraft);
                    }
                    this.fmService.acInterface.updateIlsCourse(this.navigation.getNavaidTuner().getMmrRadioTuningStatus(1));
                }
                this.fmService.getGrossWeight();
                this.checkGWParams();
                this.updateMessageQueue();

                this.fmService.acInterface.checkSpeedLimit();
                this.fmService.acInterface.thrustReductionAccelerationChecks();
                // TODO port over from legacy code
                // this.updatePerfPageAltPredictions();
            }

            this.fmService.acInterface.arincBusOutputs.forEach((word) => word.writeToSimVarIfDirty());
            this.fmService.acInterface.updateAutopilot(dt);
    }

    public async onAfterRender(node: VNode): Promise<void> {
        super.onAfterRender(node);

        await this.initializeFlightPlans();

        this.guidanceController = new GuidanceController(this.fmgc, this.flightPlanService, this.efisInterface);
        this.efisSymbols = new EfisSymbols(this.guidanceController, this.flightPlanService, this.navaidTuner, this.efisInterface);
        this.fmService = new MfdFlightManagementService(this, this.flightPlanService, this.guidanceController, this.fmgc, this.navigation, this.flightPhaseManager, this.efisInterface);

        this.navaidTuner.init();
        this.efisSymbols.init();
        this.flightPhaseManager.init();
        this.guidanceController.init();
        this.fmgc.guidanceController = this.guidanceController;

        let lastUpdateTime = Date.now();

        this.initSimVars();

        this.flightPhaseManager.addOnPhaseChanged((prev, next) => this.onFlightPhaseChanged(prev, next));

        const hEventSub = this.props.bus.getSubscriber<HEvent>();
        hEventSub.on('hEvent').handle(eventName => {
            console.log(`H event: ${eventName}`);
            this.fmService.acInterface.onEvent(eventName);
        });

        setInterval(() => {
            const now = Date.now();
            const dt = now - lastUpdateTime;

            this.onUpdate(dt);

            lastUpdateTime = now;
        }, 100);

        const isCaptainSide = getDisplayIndex() === 2;

        this.activeFmsSource.set(isCaptainSide ? 'FMS 1' : 'FMS 2');

        const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();

        sub.on(isCaptainSide ? 'potentiometerCaptain' : 'potentiometerFo').whenChanged().handle((value) => {
            this.displayBrightness.set(value);
        });

        sub.on(isCaptainSide ? 'elec' : 'elecFo').whenChanged().handle((value) => {
            this.displayPowered.set(value);
        });

        // Note: This should be done with H events instead, and in a more intelligent way (sides L/R as well). Can't get H events running rn though.
        sub.on('kccuDir').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/active/f-pln-direct-to');
            }
        });

        sub.on('kccuPerf').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/active/perf');
            }
        });

        sub.on('kccuInit').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/active/init');
            }
        });

        sub.on('kccuNavaid').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/position/navaids');
            }
        });

        sub.on('kccuFpln').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/active/f-pln');
            }
        });

        sub.on('kccuDest').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/active/f-pln/dest');
            }
        });

        this.uiService.activeUri.sub((uri) => this.activeUriChanged(uri));

        this.topRef.instance.addEventListener('mousemove', (ev) => {
            this.mouseCursorRef.instance.updatePosition(ev.clientX, ev.clientY);
        });

        // Navigate to initial page
        this.uiService.navigateTo('fms/data/status');
    }

    private activeUriChanged(uri: ActiveUriInformation) {
        // Remove and destroy old header
        while (this.activeHeaderRef.getOrDefault().firstChild) {
            this.activeHeaderRef.getOrDefault().removeChild(this.activeHeaderRef.getOrDefault().firstChild);
        }
        if (this.activeHeader && this.activeHeader.instance instanceof DisplayComponent) {
            this.activeHeader.instance.destroy();
        }

        // Remove and destroy old MFD page
        while (this.activePageRef.getOrDefault().firstChild) {
            this.activePageRef.getOrDefault().removeChild(this.activePageRef.getOrDefault().firstChild);
        }
        if (this.activePage && this.activePage.instance instanceof DisplayComponent) {
            this.activePage.instance.destroy();
        }

        // Different systems use different navigation bars
        this.activeHeader = headerForSystem(uri.sys, this.props.bus, this.fmgc.data.atcCallsign, this.activeFmsSource, this.uiService, this.fmService);

        // Mapping from URL to page component
        this.activePage = pageForUrl(`${uri.sys}/${uri.category}/${uri.page}`, this.props.bus, this.uiService, this.fmService);

        FSComponent.render(this.activeHeader, this.activeHeaderRef.getOrDefault());
        FSComponent.render(this.activePage, this.activePageRef?.getOrDefault());
    }

    render(): VNode {
        return (
            <CdsDisplayUnit bus={this.props.bus} displayUnitId={DisplayUnitID.CaptMfd}>
                <div class="mfd-main" ref={this.topRef}>
                    <div ref={this.activeHeaderRef} />
                    <MfdMsgList
                        visible={this.messageListOpened}
                        messages={this.fmsErrors}
                        bus={this.props.bus}
                        uiService={this.uiService}
                        fmService={this.fmService}
                    />
                    <MfdFmsFplnDuplicateNames
                        ref={this.duplicateNamesRef}
                        visible={this.duplicateNamesOpened}
                        bus={this.props.bus}
                        uiService={this.uiService}
                        fmService={this.fmService}
                    />
                    <div ref={this.activePageRef} class="mfd-navigator-container" />
                    <MouseCursor side={Subject.create('CPT')} ref={this.mouseCursorRef} />
                </div>
            </CdsDisplayUnit>
        );
    }
}
