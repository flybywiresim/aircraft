import A32NX_Core from '../A32NX_Core/A32NX_Core.mjs';
import NXDataStore from '../A32NX_Utils/NXDataStore.mjs';

const fuelPlanningPhases = {
    PLANNING: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
};

const windDirections = {
    TAILWIND: 'TL',
    HEADWIND: 'HD',
};

const flightPhases = ['PREFLIGHT', 'TAXI', 'TAKEOFF', 'CLIMB', 'CRUISE', 'DESCENT', 'APPROACH', 'GOAROUND'];

const activeSystems = {
    AIDS: 'AIDS',
    ATSU: 'ATSU',
    CFDS: 'CFDS',
    FMGC: 'FMGC',
    MAINT: 'MAINT',
};

// TODO find a way to include FMCMainDisplay

class FMGC {
    constructor() {
        this._A32NXCore = new A32NX_Core();
        this._registered = false;
        this._forceNextAltitudeUpdate = false;
        this._lastUpdateAPTime = NaN;
        this.refreshFlightPlanCooldown = 0;
        this.updateAutopilotCooldown = 0;
        this._lastHasReachFlex = false;
        this._apMasterStatus = false;
        this._hasReachedTopOfDescent = false;
        this._apCooldown = 500;
        this._lastRequestedFLCModeWaypointIndex = -1;
        this.messages = [];
        this.sentMessages = [];
        this.activeSystem = 'FMGC';
        this._cruiseEntered = false;
        this._blockFuelEntered = false;
        this._gpsprimaryack = 0;
        this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_PREFLIGHT;
        this.activeWaypointIdx = -1;
        this.constraintAlt = 0;
        this.constraintAltCached = 0;
        this.fcuSelAlt = 0;
        this.updateTypeIIMessage = false;
        this.altLock = 0;
        this.messageQueue = [];
        this._destDataChecked = false;
        this._towerHeadwind = 0;
        this._conversionWeight = parseFloat(NXDataStore.get('CONFIG_USING_METRIC_UNIT', '1'));
        this._EfobBelowMinClr = false;
        this.simbrief = {
            route: '',
            cruiseAltitude: '',
            originIcao: '',
            destinationIcao: '',
            blockFuel: '',
            payload: undefined,
            estZfw: '',
            sendStatus: 'READY',
            costIndex: '',
            navlog: [],
            icao_airline: '',
            flight_number: '',
            alternateIcao: '',
            avgTropopause: '',
            ete: '',
            blockTime: '',
            outTime: '',
            onTime: '',
            inTime: '',
            offTime: '',
            taxiFuel: '',
            tripFuel: '',
        };
        this.aocWeight = {
            blockFuel: undefined,
            estZfw: undefined,
            taxiFuel: undefined,
            tripFuel: undefined,
            payload: undefined,
        };
        this.aocTimes = {
            doors: 0,
            off: 0,
            out: 0,
            on: 0,
            in: 0,
        };
        this.winds = {
            climb: [],
            cruise: [],
            des: [],
            alternate: null,
        };
    }

    getActiveSystem() {
        return this._activeSystem;
    }

    setActiveSystem(value) {
        this._activeSystem = value;
    }

    Init(_deltaTime) {
        this._A32NXCore.init(_deltaTime);
    }

    update() {
        this._A32NXCore.update();
    }
}

export { FMGC, activeSystems };
