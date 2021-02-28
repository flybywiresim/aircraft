/**
 * The A32NX_FlightPhaseManager handles the FMGCs flight phases.
 * It does so by creating a unique flight phase object for every FMGC flight phase.
 *
 * A32NX_FlightPhaseManager Class:
 *
 * Variables:
 *  fmc:                holds the fmc object to modify the current flight phase variable as well as accessing
 *                      the FlightPlanManager and other sources needed evaluate the current situations.
 *
 *  flightPhases:       Contains all 8 FMGC flight phases and constructs for each a unique flight phase object.
 *
 *  activeFlightPhase:  Contains the active FMGC flight phase object which is used to initialize the flight phase,
 *                      check the flight phases status (for transitioning to another flight phase) and reading the
 *                      next flight phase to be come active.
 *
 * Methods:
 *  checkFlightPhase:   this method is called to initiate the check on the current FMGC flight phase which will evaluate
 *                      which is the correct FMGC flight phase to be in.
 *                      If the current FMGC flight phase is evaluated no longer correct, the new FMGC flight phase gets
 *                      passed to changeFlightPhase Method which will perform the flight phase transition.
 *
 *  handleFcuInput:     This method is called when the alt knob is pulled or pushed.
 *                      This method handles special FMGC flight phase transitions which are initiated pushing/pulling
 *                      the fcu alt knob.
 *                      Inputs are being ignored when not in these flight phases: CLIMB, CRUISE or DESCENT.
 *
 *  changeFlightPhase:  Performs the FMGCs flight phase change to the passed flight phase and initiates transitions actions.
 *                      After the flight phase change and the transition actions are performed the checkFlightPhase Method
 *                      gets called to directly verify the current flight phase is still valid.
 *
 *
 * A32NX_FlightPhase Object:
 *
 * Variables:
 *  nextFmgcFlightPhase: This variable defines the next flight phase the FMGC can automatically transition into.
 *                       If not defined, the FMGC won't be able to transition onto another flight phase automatically
 *                       without pilot input, if that's the case the check method will always return false.
 *                       This variable can be found in the constructor or init of the flight phase object.
 *                       Whether it's defined in the constructor or init depends on whether the variable can be changed
 *                       and hence the default transition flight phase be manipulated, if that's the case the variable
 *                       will be defined in init method to ensure the variable is always in it's intended state.
 *
 * Methods:
 *  init:               This method is called once every time the FMGC transitions into this flight phase to initialize
 *                      the current flight phase variables if needed.
 *                      (This method gets passed the fmc object to have access to the fmc variables and methods)
 *
 *  check:              This method returns as boolean.
 *                      True: Transition into next flight phase will be initiated
 *                      (The next flight phase is defined as nextFmgcFlightPhase)
 *                      False: The current FMGC flight phase maintains is maintained.
 *                      (This method gets passed the fmc object to have access to the fmc variables and methods)
 */
class A32NX_FlightPhaseManager {
    constructor(_fmc) {
        console.log('A32NX_FlightPhaseManager constructed');
        this.fmc = _fmc;

        this.flightPhases = {
            [FmgcFlightPhases.PREFLIGHT]: new A32NX_FlightPhase_PreFlight(),
            [FmgcFlightPhases.TAKEOFF]: new A32NX_FlightPhase_TakeOff(),
            [FmgcFlightPhases.CLIMB]: new A32NX_FlightPhase_Climb(),
            [FmgcFlightPhases.CRUISE]: new A32NX_FlightPhase_Cruise(),
            [FmgcFlightPhases.DESCENT]: new A32NX_FlightPhase_Descent(),
            [FmgcFlightPhases.APPROACH]: new A32NX_FlightPhase_Approach(),
            [FmgcFlightPhases.GOAROUND]: new A32NX_FlightPhase_GoAround(),
            [FmgcFlightPhases.DONE]: new A32NX_FlightPhase_Done()
        };

        this.activeFlightPhase = this.flightPhases[FmgcFlightPhases.PREFLIGHT];

        SimVar.SetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "number", FmgcFlightPhases.PREFLIGHT);

        this.activeFlightPhase.init(_fmc);
    }

    checkFlightPhase(_deltaTime) {
        if (this.activeFlightPhase.check(_deltaTime, this.fmc)) {
            this.changeFlightPhase(this.activeFlightPhase.nextFmgcFlightPhase);
        }
    }

    handleFcuInput() {
        if (this.fmc.currentFlightPhase < FmgcFlightPhases.CLIMB ||
            this.fmc.currentFlightPhase > FmgcFlightPhases.APPROACH) {
            return;
        }

        const fcuSelFl = Simplane.getAutoPilotDisplayedAltitudeLockValue("feet") / 100;
        const fl = Math.round(Simplane.getAltitude() / 100);

        // Try initiate des
        const dest = this.fmc.flightPlanManager.getDestination();
        if (
            this.fmc.currentFlightPhase !== FmgcFlightPhases.DESCENT &&
            !!dest && dest.liveDistanceTo < 200 &&
            fcuSelFl < fl
        ) {
            this.changeFlightPhase(FmgcFlightPhases.DESCENT);
            return;
        }

        // Try Initiate Climb
        if (
            this.fmc.currentFlightPhase !== FmgcFlightPhases.CLIMB &&
            fcuSelFl > fl
        ) {
            this.changeFlightPhase(FmgcFlightPhases.CLIMB);
            return true;
        }
    }

    changeFlightPhase(_fmgcFlightPhase) {
        console.log("FMGC Flight Phase: " + this.fmc.currentFlightPhase + " => " + _fmgcFlightPhase);
        this.fmc.currentFlightPhase = _fmgcFlightPhase;
        SimVar.SetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "number", _fmgcFlightPhase);
        // Updating old SimVar to ensure downwards compatibility
        SimVar.SetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number", (_fmgcFlightPhase < FmgcFlightPhases.TAKEOFF ? FmgcFlightPhases.PREFLIGHT : _fmgcFlightPhase + 1));

        this.activeFlightPhase = this.flightPhases[_fmgcFlightPhase];

        this.activeFlightPhase.init(this.fmc);

        this.fmc.onFlightPhaseChanged();

        this.checkFlightPhase();
    }
}

class A32NX_FlightPhase_PreFlight {
    constructor() {
        this.nextFmgcFlightPhase = FmgcFlightPhases.TAKEOFF;
        this.takeoffConfirmation = new NXLogic_ConfirmNode(.2);
    }

    init(_fmc) {
        _fmc.climbTransitionGroundAltitude = null;
    }

    check(_deltaTime, _fmc) {
        // Simplane.getAltitudeAboveGround() > 1500; is used to skip flight phase in case ac reloaded midair
        return this.takeoffConfirmation.write(
            (
                (
                    Simplane.getEngineThrottleMode(0) >= ThrottleMode.FLEX_MCT ||
                    Simplane.getEngineThrottleMode(1) >= ThrottleMode.FLEX_MCT
                ) && (
                    SimVar.GetSimVarValue("ENG N1 RPM:1", "percent") > .75 ||
                    SimVar.GetSimVarValue("ENG N1 RPM:2", "percent") > .75
                )
            ) || Simplane.getAltitudeAboveGround() > 1500,
            _deltaTime
        );
    }
}

class A32NX_FlightPhase_TakeOff {
    constructor() {
    }

    init(_fmc) {
        this.nextFmgcFlightPhase = FmgcFlightPhases.CLIMB;
        this.accelerationAltitudeMsl = (_fmc.accelerationAltitude || _fmc.thrustReductionAltitude);

        if (!this.accelerationAltitudeMsl) {
            if (!_fmc.climbTransitionGroundAltitude) {
                const origin = _fmc.flightPlanManager.getOrigin();
                if (origin) {
                    _fmc.climbTransitionGroundAltitude = origin.altitudeinFP;
                }

                if (!_fmc.climbTransitionGroundAltitude) {
                    _fmc.climbTransitionGroundAltitude = (parseInt(SimVar.GetSimVarValue("GROUND ALTITUDE", "feet")) || 0);
                }
            }

            this.accelerationAltitudeMsl = _fmc.climbTransitionGroundAltitude + parseInt(NXDataStore.get("CONFIG_ACCEL_ALT", "1500"));
        }
    }

    check(_deltaTime, _fmc) {
        if (Simplane.getEngineThrottleMode(0) < ThrottleMode.FLEX_MCT && Simplane.getEngineThrottleMode(1) < ThrottleMode.FLEX_MCT && Simplane.getAltitudeAboveGround() < 1.5) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.PREFLIGHT;
            return true;
        }
        return Simplane.getAltitude() > this.accelerationAltitudeMsl;
    }
}

class A32NX_FlightPhase_Climb {
    constructor() {
        this.nextFmgcFlightPhase = FmgcFlightPhases.CRUISE;
    }

    init(_fmc) {
    }

    check(_deltaTime, _fmc) {
        return Math.round(Simplane.getAltitude() / 100) >= _fmc.cruiseFlightLevel;
    }
}

class A32NX_FlightPhase_Cruise {
    constructor() {
    }

    init(_fmc) {
    }

    check(_deltaTime, _fmc) {
        return false;
    }
}

class A32NX_FlightPhase_Descent {
    constructor() {
    }

    init(_fmc) {
        this.nextFmgcFlightPhase = FmgcFlightPhases.APPROACH;
    }

    check(_deltaTime, _fmc) {
        const fl = Math.round(Simplane.getAltitude() / 100);
        const fcuSelFl = Simplane.getAutoPilotDisplayedAltitudeLockValue("feet") / 100;
        if (fl === _fmc.cruiseFlightLevel && fcuSelFl === fl) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.CRUISE;
            return true;
        }

        // TODO: move this somewhere else (inside fmgc) and call flightPhaseManager.changeFlightPhase(FmgcFlightPhases.APPROACH)
        if (_fmc.flightPlanManager.decelWaypoint) {
            const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            const planeLla = new LatLongAlt(lat, long);
            const dist = Avionics.Utils.computeGreatCircleDistance(_fmc.flightPlanManager.decelWaypoint.infos.coordinates, planeLla);
            if (dist < 3) {
                _fmc.flightPlanManager._decelReached = true;
                _fmc._waypointReachedAt = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
                if (Simplane.getAltitudeAboveGround() < 9500) {
                    this.nextFmgcFlightPhase = FmgcFlightPhases.APPROACH;
                    return true;
                }
            }
        }

        return false;
    }
}

class A32NX_FlightPhase_Approach {
    constructor() {
        this.landingConfirmation = new NXLogic_ConfirmNode(30);
    }

    init(_fmc) {
        this.nextFmgcFlightPhase = FmgcFlightPhases.DONE;
    }

    check(_deltaTime, _fmc) {
        if (Simplane.getEngineThrottleMode(0) === ThrottleMode.TOGA || Simplane.getEngineThrottleMode(1) === ThrottleMode.TOGA) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.GOAROUND;
            return true;
        }

        const fl = Math.round(Simplane.getAltitude() / 100);

        if (fl === _fmc.cruiseFlightLevel) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.CRUISE;
            return true;
        }

        if (fl < _fmc.cruiseFlightLevel && Simplane.getAutoPilotDisplayedAltitudeLockValue("feet") / 100 > fl) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.CLIMB;
            return true;
        }

        return this.landingConfirmation.write(Simplane.getAltitudeAboveGround() < 1.5 || !_fmc.isAnEngineOn(), _deltaTime);
    }
}

class A32NX_FlightPhase_GoAround {
    constructor() {
    }

    init(_fmc) {
    }

    check(_deltaTime, _fmc) {
        return false;
    }
}

class A32NX_FlightPhase_Done {
    constructor() {
        this.nextFmgcFlightPhase = FmgcFlightPhases.PREFLIGHT;
        this.cleanupConfirmation = new NXLogic_ConfirmNode(10);
    }

    init(_fmc) {
        SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_NORMAL", "Bool", 0);
        CDUIdentPage.ShowPage(_fmc);
    }

    check(_deltaTime, _fmc) {
        return this.cleanupConfirmation.write(true, _deltaTime);
    }
}
