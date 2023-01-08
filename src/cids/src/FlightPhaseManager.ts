import { Cids } from './CIDS';
import { AfterDisembarkationPhase } from './flightphases/AfterDisembarkationPhase';
import { ApproachPhase } from './flightphases/ApproachPhase';
import { BoardingPhase } from './flightphases/BoardingPhase';
import { CruisePhase } from './flightphases/CruisePhase';
import { DisembarkationPhase } from './flightphases/DisembarkationPhase';
import { FinalApproachAndLandingPhase } from './flightphases/FinalApproachAndLandingPhase';
import { FinalClimbPhase } from './flightphases/FinalClimbPhase';
import { FlightPhase } from './flightphases/FlightPhase';
import { PushbackPhase } from './flightphases/PushbackPhase';
import { TakeoffAndInitialClimbPhase } from './flightphases/TakeoffAndInitialClimbPhase';
import { TaxiAfterLandingPhase } from './flightphases/TaxiAfterLandingPhase';
import { TaxiBeforeTakeoffPhase } from './flightphases/TaxiBeforeTakeoffPhase';
import { TopOfDescentPhase } from './flightphases/TopOfDescentPhase';

export class FlightPhaseManager {
    public readonly cids: Cids;

    private readonly boardingPhase: BoardingPhase;

    private readonly pushbackPhase: PushbackPhase;

    private readonly taxiBeforeTakeoffPhase: TaxiBeforeTakeoffPhase;

    private readonly takeoffAndInitialClimbPhase: TakeoffAndInitialClimbPhase;

    private readonly finalClimbPhase: FinalClimbPhase;

    private readonly cruisePhase: CruisePhase;

    private readonly todPhase: TopOfDescentPhase;

    private readonly apprPhase: ApproachPhase;

    private readonly finalApprAndLandingPhase: FinalApproachAndLandingPhase;

    private readonly taxiAfterLandingPhase: TaxiAfterLandingPhase;

    private readonly disembarkationPhase: DisembarkationPhase;

    private readonly afterDisembarkationPhase: AfterDisembarkationPhase;

    constructor(cids: Cids) {
        this.cids = cids;
        this.boardingPhase = new BoardingPhase(this);
        this.pushbackPhase = new PushbackPhase(this);
        this.taxiBeforeTakeoffPhase = new TaxiBeforeTakeoffPhase(this);
        this.takeoffAndInitialClimbPhase = new TakeoffAndInitialClimbPhase(this);
        this.finalClimbPhase = new FinalClimbPhase(this);
        this.cruisePhase = new CruisePhase(this);
        this.todPhase = new TopOfDescentPhase(this);
        this.apprPhase = new ApproachPhase(this);
        this.finalApprAndLandingPhase = new FinalApproachAndLandingPhase(this);
        this.taxiAfterLandingPhase = new TaxiAfterLandingPhase(this);
        this.disembarkationPhase = new DisembarkationPhase(this);
        this.afterDisembarkationPhase = new AfterDisembarkationPhase(this);
    }

    public init() {
        console.log('[CIDS/FPM] Initialization started...');

        this.initFlightPhases();

        this.initActiveFlightPhase();

        console.log('[CIDS/FPM] Initialization complete.');
    }

    public update(): void {
        this.getActiveFlightPhase().tryTransition();
    }

    // eslint-disable-next-line consistent-return
    public getActiveFlightPhase(): FlightPhase {
        const flightPhaseValue = SimVar.GetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum');
        // eslint-disable-next-line default-case
        switch (flightPhaseValue) {
        case 1:
            return this.boardingPhase;
        case 2:
            return this.pushbackPhase;
        case 3:
            return this.taxiBeforeTakeoffPhase;
        case 4:
            return this.takeoffAndInitialClimbPhase;
        case 5:
            return this.finalClimbPhase;
        case 6:
            return this.cruisePhase;
        case 7:
            return this.todPhase;
        case 8:
            return this.apprPhase;
        case 9:
            return this.finalApprAndLandingPhase;
        case 10:
            return this.taxiAfterLandingPhase;
        case 11:
            return this.disembarkationPhase;
        case 12:
            return this.afterDisembarkationPhase;
        }
    }

    public setActiveFlightPhase(flightPhase: FlightPhase): void {
        const prevPhase = this.getActiveFlightPhase();
        SimVar.SetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum', flightPhase.getValue())
            .then(() => console.log(`[CIDS] Flight phase: ${prevPhase.getValue()} => ${flightPhase.getValue()}`))
            .catch((error) => console.error(`[CIDS] An error occurred while trying to transition flight phases from ${prevPhase.getValue()} to ${flightPhase.getValue()}\n${error}`));
    }

    private initFlightPhases(): void {
        console.log('[CIDS/FPM] Initializing flight phases...');

        this.boardingPhase.init(this.pushbackPhase, this.taxiBeforeTakeoffPhase, this.disembarkationPhase);
        this.pushbackPhase.init(this.taxiBeforeTakeoffPhase, this.disembarkationPhase);
        this.taxiBeforeTakeoffPhase.init(this.takeoffAndInitialClimbPhase, this.disembarkationPhase);
        this.takeoffAndInitialClimbPhase.init(this.finalClimbPhase, this.cruisePhase, this.finalApprAndLandingPhase, this.disembarkationPhase);
        this.finalClimbPhase.init(this.cruisePhase, this.finalApprAndLandingPhase);
        this.cruisePhase.init(this.todPhase, this.apprPhase);
        this.todPhase.init(this.apprPhase);
        this.apprPhase.init(this.finalApprAndLandingPhase);
        this.finalApprAndLandingPhase.init(this.taxiAfterLandingPhase);
        this.taxiAfterLandingPhase.init(this.disembarkationPhase, this.afterDisembarkationPhase);
        this.disembarkationPhase.init(this.afterDisembarkationPhase);
        this.afterDisembarkationPhase.init(this.boardingPhase, this.pushbackPhase, this.taxiBeforeTakeoffPhase);
        console.log('[CIDS/FPM] Flight phases initialized.');
    }

    private initActiveFlightPhase(): void {
        console.log('[CIDS/FPM] Initializing active flight phase...');
        const startState = SimVar.GetSimVarValue('L:A32NX_START_STATE', 'Enum');
        switch (startState) {
        case 1:
        case 2:
            SimVar.SetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum', this.afterDisembarkationPhase.getValue())
                .then(() => console.log(`[CIDS/FPM] Flight phase: ${this.afterDisembarkationPhase.getValue()}`));
            break;
        case 3:
        case 4:
            SimVar.SetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum', this.taxiBeforeTakeoffPhase.getValue())
                .then(() => console.log(`[CIDS/FPM] Flight phase: ${this.taxiBeforeTakeoffPhase.getValue()}`));
            break;
        case 5:
            if (this.cids.altitude() < 10000) {
                SimVar.SetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum', this.takeoffAndInitialClimbPhase.getValue())
                    .then(() => console.log(`[CIDS/FPM] Flight phase: ${this.takeoffAndInitialClimbPhase.getValue()}`));
            } else {
                SimVar.SetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum', this.finalClimbPhase.getValue())
                    .then(() => console.log(`[CIDS/FPM] Flight phase: ${this.finalClimbPhase.getValue()}`));
            }
            break;
        case 6:
            SimVar.SetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum', this.cruisePhase.getValue())
                .then(() => console.log(`[CIDS/FPM] Flight phase: ${this.cruisePhase.getValue()}`));
            break;
        case 7:
            if (this.cids.altitude() > 10000) {
                SimVar.SetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum', this.todPhase.getValue())
                    .then(() => console.log(`[CIDS/FPM] Flight phase: ${this.todPhase.getValue()}`));
            } else {
                SimVar.SetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum', this.apprPhase.getValue())
                    .then(() => console.log(`[CIDS/FPM] Flight phase: ${this.apprPhase.getValue()}`));
            }
            break;
        case 8:
            SimVar.SetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum', this.finalApprAndLandingPhase.getValue())
                .then(() => console.log(`[CIDS/FPM] Flight phase: ${this.finalApprAndLandingPhase.getValue()}`));
            break;
        default:
            console.error(`[CIDS/FPM] Found unknown value '${startState}' for A32NX_START_STATE.\nSee src/cids/src/FlightPhaseManager.ts#initActiveFlightPhase().`);
            break;
        }
        console.log('[CIDS/FPM] Flight phase initialization complete.');
    }
}
