import A32NX_Core from '../A32NX_Core/A32NX_Core.mjs';

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

class FMGC {
    constructor() {
        this._activeSystem = activeSystems.FMGC;
        this._costIndex = 0;
        this._lastUserInput = '';
        this._isDisplayingErrorMessage = false;
        this._isDisplayingTypeTwoMessage = false;
        this._maxCruiseFL = 390;
        this._routeIndex = 0;
        this._coRoute = '';
        this._routeIsSelected = false;
        this._routePageCurrent = 1;
        this._routePageCount = 2;
        this._tmpOrigin = '';
        this._tmpDestination = '';
        this._transitionAltitude = 10000;
        this._perfTOTemp = 20;
        this._overridenFlapApproachSpeed = NaN;
        this._overridenSlatApproachSpeed = NaN;
        this._routeFinalFuelWeight = 0;
        this._routeFinalFuelTime = 30;
        this._routeFinalFuelTimeDefault = 30;
        this._routeReservedWeight = 0;
        this._routeReservedPercent = 5;
        this._takeOffFlap = -1;
        this._takeOffWeight = NaN;
        this._landingWeight = NaN;
        this._averageWind = 0;
        this._perfCrzWindHeading = NaN;
        this._perfCrzWindSpeed = NaN;
        this._perfApprQNH = NaN;
        this._perfApprTemp = NaN;
        this._perfApprWindHeading = NaN;
        this._perfApprWindSpeed = NaN;
        this._perfApprTransAlt = NaN;
        this._vApp = NaN;
        this._perfApprMDA = NaN;
        this._perfApprDH = NaN;
        this._currentFlightPhase = FlightPhase.FLIGHT_PHASE_TAKEOFF;
        this._lockConnectIls = false;
        this._apNavIndex = 1;
        this._apLocalizerOn = false;
        this._canSwitchToNav = false;

        this._radios = {
            vhf1Frequency: 0,
        };

        this._vhf2Frequency = 0;
        this._vor1Frequency = 0;
        this._vor1Course = 0;
        this._vor2Frequency = 0;
        this._vor2Course = 0;
        this._ilsFrequency = 0;
        this._ilsFrequencyPilotEntered = false;
        this._ilsCourse = 0;
        this._adf1Frequency = 0;
        this._adf2Frequency = 0;
        this._rcl1Frequency = 0;
        this._pre2Frequency = 0;
        this._atc1Frequency = 0;
        this._radioNavOn = false;
        this._debug = 0;
        this._checkFlightPlan = 0;
        this._smoothedTargetHeading = NaN;
        this._smootherTargetPitch = NaN;
        this._zeroFuelWeightZFWCGEntered = false;
        this._taxiEntered = false;
        this._windDir = windDirections.HEADWIND;
        this._DistanceToAlt = 0;
        this._routeAltFuelWeight = 0;
        this._routeAltFuelTime = 0;
        this._routeTripFuelWeight = 0;
        this._routeTripTime = 0;
        this._defaultTaxiFuelWeight = 0.2;
        this._rteRsvPercentOOR = false;
        this._rteReservedEntered = false;
        this._rteFinalCoeffecient = 0;
        this._rteFinalEntered = false;
        this._routeAltFuelEntered = false;
        this._minDestFob = 0;
        this._minDestFobEntered = false;
        this._defaultRouteFinalTime = 45;
        this._fuelPredDone = false;
        this._fuelPlanningPhase = fuelPlanningPhases.PLANNING;
        this._blockFuelEntered = false;
        /* CPDLC Fields */
        this._cpdlcAtcCenter = '';
        this._tropo = '';
    }

    getVh1Frequency() {
        return this._radios.vhf1Frequency;
    }

    setVh1Frequency(value) {
        this._radios.vhf1Frequency = value;
    }

    getActiveSystem() {
        return this._activeSystem;
    }

    setActiveSystem(value) {
        this._activeSystem = value;
    }

    getMinDestFob() {
        return this._minDestFob;
    }

    setMinDestFOB(value) {
        this._minDestFob = value;
    }

    init(_deltaTime) {
        this._A32NXCore = new A32NX_Core();
        this._A32NXCore.init(_deltaTime);
    }
}

export { FMGC, activeSystems };
