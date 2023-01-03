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

    public readonly boardingPhase: BoardingPhase;

    public readonly pushbackPhase: PushbackPhase;

    public readonly taxiBeforeTakeoffPhase: TaxiBeforeTakeoffPhase;

    public readonly takeoffAndInitialClimbPhase: TakeoffAndInitialClimbPhase;

    public readonly finalClimbPhase: FinalClimbPhase;

    public readonly cruisePhase: CruisePhase;

    public readonly todPhase: TopOfDescentPhase;

    public readonly apprPhase: ApproachPhase;

    public readonly finalApprAndLandingPhase: FinalApproachAndLandingPhase;

    public readonly taxiAfterLandingPhase: TaxiAfterLandingPhase;

    public readonly disembarkationPhase: DisembarkationPhase;

    public readonly afterDisembarkationPhase: AfterDisembarkationPhase;

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
        this.disembarkationPhase = new DisembarkationPhase(this);
        this.afterDisembarkationPhase = new AfterDisembarkationPhase(this);
    }

    public init() {
        console.log('[CIDS/FPM] Initialization started...');

        this.initFlightPhase();
        console.log('[CIDS/FPM] Flight phase initialization complete.');

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

    public async setActiveFlightPhase(flightPhase: FlightPhase): Promise<void> {
        const prevPhase = this.getActiveFlightPhase();
        await SimVar.SetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum', flightPhase.getValue());
        console.log(`[CIDS] Flight phase: ${prevPhase.getValue()} => ${flightPhase}`);
    }

    private initFlightPhase(): void {
        console.log('[CIDS/FPM] Initializing flight phase...');

        const startState = SimVar.GetSimVarValue('L:A32NX_START_STATE', 'Enum');
        switch (startState) {
        case 1:
        case 2:
            this.setActiveFlightPhase(this.afterDisembarkationPhase);
            return;
        case 3:
        case 4:
            this.setActiveFlightPhase(this.taxiBeforeTakeoffPhase);
            return;
        case 5:
            if (this.cids.altitude() < 10000) {
                this.setActiveFlightPhase(this.takeoffAndInitialClimbPhase);
            } else {
                this.setActiveFlightPhase(this.finalClimbPhase);
            }
            return;
        case 6:
            this.setActiveFlightPhase(this.cruisePhase);
            return;
        case 7:
            if (this.cids.altitude() > 10000) {
                this.setActiveFlightPhase(this.todPhase);
            } else {
                this.setActiveFlightPhase(this.apprPhase);
            }
            return;
        case 8:
            this.setActiveFlightPhase(this.finalApprAndLandingPhase);
            break;
        default:
            console.error(`[CIDS/FPM] Found unknown value '${startState}' for A32NX_START_STATE.\nSee src/cids/src/FlightPhaseManager.ts#initFlightPhase().`);
            break;
        }
    }
}
