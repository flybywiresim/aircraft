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

    public readonly takeoffAndInitClimbPhase: TakeoffAndInitialClimbPhase;

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
        this.boardingPhase = new BoardingPhase(this.cids, this);
        this.pushbackPhase = new PushbackPhase(this.cids, this);
        this.taxiBeforeTakeoffPhase = new TaxiBeforeTakeoffPhase(this.cids, this);
        this.takeoffAndInitClimbPhase = new TakeoffAndInitialClimbPhase(this.cids, this);
        this.finalClimbPhase = new FinalClimbPhase(this.cids, this);
        this.cruisePhase = new CruisePhase(this.cids, this);
        this.todPhase = new TopOfDescentPhase(this.cids, this);
        this.apprPhase = new ApproachPhase(this.cids, this);
        this.finalApprAndLandingPhase = new FinalApproachAndLandingPhase(this.cids, this);
        this.disembarkationPhase = new DisembarkationPhase(this.cids, this);
        this.afterDisembarkationPhase = new AfterDisembarkationPhase(this.cids, this);
    }

    public init() {
        console.log('[CIDS/FPM] Initialization started...');

        console.log('[CIDS/FPM] Initializing flight phase...');
        this.initFlightPhase();
        console.log(`[CIDS/FPM] Flight phase initialization complete. Active flight phase: ${this.getActiveFlightPhase().getValue()}`);

        console.log('[CIDS/FPM] Initialization complete.');
    }

    public update(_deltaTime: number): void {
        console.log('[CIDS/FPM] Update started...');

        console.log('[CIDS/FPM Trying to transition flight phase...');
        const prevPhase = this.getActiveFlightPhase();
        this.getActiveFlightPhase().tryTransition();
        const newPhase = this.getActiveFlightPhase();
        if (prevPhase.getValue() === newPhase.getValue()) {
            console.log(`[CIDS/FPM] Transition failed -> keeping flight phase ${newPhase.getValue()}`);
        } else {
            console.log(`[CIDS/FPM Transition succeeded -> ${prevPhase.getValue()} => ${newPhase.getValue()}]`);
        }
    }

    public getActiveFlightPhase(): FlightPhase {
        const flightPhaseValue = SimVar.GetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum');
        switch (flightPhaseValue) {
        case 1:
            return this.boardingPhase;
        case 2:
            return this.pushbackPhase;
        case 3:
            return this.taxiBeforeTakeoffPhase;
        case 4:
            return this.takeoffAndInitClimbPhase;
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
        default:
            throw new Error(`Invalid CIDS flight phase (${flightPhaseValue}) detected.`);
        }
    }

    public async setActiveFlightPhase(flightPhase: FlightPhase): Promise<void> {
        await SimVar.SetSimVarValue('L:A32NX_CIDS_FLIGHT_PHASE', 'Enum', flightPhase.getValue());
    }

    private initFlightPhase(): void {
        console.log('[CIDS/FPM] Detecting flight phase...');
        if ( // BOARDING
            this.cids.onGround()
          && SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
          && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') > 20
          && this.cids.boardingInProgress()
        ) {
            console.log('[CIDS/FPM] Detected flight phase 1');
            this.setActiveFlightPhase(this.boardingPhase);
        } else if ( // PUSHBACK
            SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') < 20
          && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:3', 'percent') < 20
          && SimVar.GetSimVarValue('L:A32NX_FWD_DOOR_CARGO_LOCKED', 'bool')
          && this.cids.onGround()
          && SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
          && SimVar.GetSimVarValue('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'bool')
        ) {
            console.log('[CIDS/FPM] Detected flight phase 2');
            this.setActiveFlightPhase(this.pushbackPhase);
        } else if ( // TAXI BEFORE TAKEOFF
            this.cids.onGround()
          && SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_1', 'Number') < 75
          && SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_2', 'Number') < 75
          && !SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
        ) {
            console.log('[CIDS/FPM] Detected flight phase 3');
            this.setActiveFlightPhase(this.taxiBeforeTakeoffPhase);
        } else if ( // TAKEOFF AND INITIAL CLIMB
            SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_1', 'Number') > 74
          && SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_2', 'Number') > 74
          && (
              this.cids.onGround()
              || SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < 10000
          )
        ) {
            console.log('[CIDS/FPM] Detected flight phase 4');
            this.setActiveFlightPhase(this.takeoffAndInitClimbPhase);
        } else if ( // FINAL CLIMB
            !this.cids.onGround()
          && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') > 10000
        ) {
            console.log('[CIDS/FPM] Detected flight phase 5');
            this.setActiveFlightPhase(this.finalClimbPhase);
        } else if ( // CRUISE
            SimVar.GetSimVarValue('L:A32NX_FMA_CRUISE_ALT_MODE', 'bool')
          && !this.cids.onGround()
          && !SimVar.GetSimVarValue('CABIN SEATBELTS ALERT SWITCH', 'bool')
        ) {
            console.log('[CIDS/FPM] Detected flight phase 6');
            this.setActiveFlightPhase(this.cruisePhase);
        } else if ( // TOP OF DESCENT
            !this.cids.onGround()
          && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < (SimVar.GetSimVarValue('AIRLINER_CRUISE_ALTITUDE', 'feet') - 500)
          && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') > 10000
        ) {
            console.log('[CIDS/FPM] Detected flight phase 7');
            this.setActiveFlightPhase(this.todPhase);
        } else if ( // APPROACH
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < 10000
          && !this.cids.onGround()
        ) {
            console.log('[CIDS/FPM] Detected flight phase 8');
            this.setActiveFlightPhase(this.apprPhase);
        } else if ( // FINAL APPROACH AND LANDING
            this.cids.gearDown()
          && SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots') > 80
        ) {
            console.log('[CIDS/FPM] Detected flight phase 9');
            this.setActiveFlightPhase(this.finalApprAndLandingPhase);
        } else if ( // TAXI AFTER LANDING
            this.cids.onGround()
          && SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots') < 80
          && !SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
          && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') < 20
        ) {
            console.log('[CIDS/FPM] Detected flight phase 10');
            this.setActiveFlightPhase(this.taxiAfterLandingPhase);
        } else if ( // DISEMBARKATION
            this.cids.onGround()
          && SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
          && !SimVar.GetSimVarValue('CABIN SEATBELTS ALERT SWITCH', 'bool')
          && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') > 20
          && this.cids.deboardingInProgess()
        ) {
            console.log('[CIDS/FPM] Detected flight phase 11');
            this.setActiveFlightPhase(this.disembarkationPhase);
        } else if ( // AFTER PASSENGER DISEMBARKATION
            this.cids.onGround()
          && this.cids.getTotalPax() === 0
        ) {
            console.log('[CIDS/FPM] Detected flight phase 12');
            this.setActiveFlightPhase(this.afterDisembarkationPhase);
        } else {
            throw new Error('Failed to detect flight phase!');
        }
    }
}
