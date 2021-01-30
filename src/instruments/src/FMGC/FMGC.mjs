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
        this._refreshFlightPlanCooldown = 0;
        this._updateAutopilotCooldown = 0;
        this._lastHasReachFlex = false;
        this._apMasterStatus = false;
        this._hasReachedTopOfDescent = false;
        this._apCooldown = 500;
        this._lastRequestedFLCModeWaypointIndex = -1;
        this._messages = [];
        this._sentMessages = [];
        this._activeSystem = 'FMGC';
        this._cruiseEntered = false;
        this._blockFuelEntered = false;
        this._gpsprimaryack = 0;
        this._currentFlightPhase = FlightPhase.FLIGHT_PHASE_PREFLIGHT;
        this._activeWaypointIdx = -1;
        this._constraintAlt = 0;
        this._constraintAltCached = 0;
        this._fcuSelAlt = 0;
        this._updateTypeIIMessage = false;
        this._altLock = 0;
        this._messageQueue = [];
        this._destDataChecked = false;
        this._towerHeadwind = 0;
        this._conversionWeight = parseFloat(NXDataStore.get('CONFIG_USING_METRIC_UNIT', '1'));
        this._EfobBelowMinClr = false;
        this._simbrief = {
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
        this._aocWeight = {
            blockFuel: undefined,
            estZfw: undefined,
            taxiFuel: undefined,
            tripFuel: undefined,
            payload: undefined,
        };
        this._aocTimes = {
            doors: 0,
            off: 0,
            out: 0,
            on: 0,
            in: 0,
        };
        this._winds = {
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
