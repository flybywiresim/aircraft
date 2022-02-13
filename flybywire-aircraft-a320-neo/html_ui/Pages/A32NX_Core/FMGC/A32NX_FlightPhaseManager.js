/**
 * The following functions are used to determine whether a flight phase can be changed or not
 */
function canInitiateTO(_fmc) {
    return SimVar.GetSimVarValue("CAMERA STATE", "number") < 10 && Simplane.getAltitudeAboveGround() > 1.5 ||
    (
        Math.max(SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:1", "number"), SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:2", "number")) >= 35 &&
        !isNaN(_fmc.v2Speed) &&
        (
            (
                SimVar.GetSimVarValue("ENG N1 RPM:1", "percent") > .85 &&
                SimVar.GetSimVarValue("ENG N1 RPM:2", "percent") > .85
            ) ||
            Math.abs(Simplane.getGroundSpeed()) > 80
        )
    );
}

function canInitiateDes(_fmc) {
    const fl = Math.round(Simplane.getAltitude() / 100);
    const fcuSelFl = Simplane.getAutoPilotDisplayedAltitudeLockValue("feet") / 100;
    const dest = _fmc.flightPlanManager.getDestination();
    // Can initiate descent? OR Can initiate early descent?
    return (((!!dest && dest.liveDistanceTo < 200) || !dest || fl < 200) && fcuSelFl < _fmc.cruiseFlightLevel && fcuSelFl < fl)
        || (!!dest && dest.liveDistanceTo >= 200 && fl > 200 && fcuSelFl <= 200);
}

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

        this.activeFlightPhase = this.flightPhases[this.fmc.currentFlightPhase];

        SimVar.SetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "number", this.fmc.currentFlightPhase);
    }

    init() {
        console.log("FMGC Flight Phase: " + this.fmc.currentFlightPhase);
        this.activeFlightPhase.init(this.fmc);
    }

    checkFlightPhase(_deltaTime) {
        if (this.activeFlightPhase.check(_deltaTime, this.fmc)) {
            this.changeFlightPhase(this.activeFlightPhase.nextFmgcFlightPhase);
        }
    }

    handleFcuAltKnobPushPull() {
        // Try Initiate climb
        if (this.fmc.currentFlightPhase === FmgcFlightPhases.TAKEOFF) {
            this.changeFlightPhase(FmgcFlightPhases.CLIMB);
            return;
        }

        if ((this.fmc.currentFlightPhase === FmgcFlightPhases.CLIMB || this.fmc.currentFlightPhase === FmgcFlightPhases.CRUISE) && canInitiateDes(this.fmc)) {
            this.changeFlightPhase(FmgcFlightPhases.DESCENT);
        }
    }

    handleFcuAltKnobTurn() {
        if (this.fmc.currentFlightPhase === FmgcFlightPhases.CRUISE) {
            const activeVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'enum');
            const VS = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_VS_SELECTED', 'feet per minute');
            const FPA = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_FPA_SELECTED', 'Degrees');
            if ((activeVerticalMode === 13 || (activeVerticalMode === 14 && VS < 0) || (activeVerticalMode === 15 && FPA < 0) || activeVerticalMode === 23) && canInitiateDes(this.fmc)) {
                this.fmc.flightPhaseManager.changeFlightPhase(FmgcFlightPhases.DESCENT);
            }
        }
    }

    handleFcuVSKnob() {
        if (this.fmc.currentFlightPhase === FmgcFlightPhases.CLIMB || this.fmc.currentFlightPhase === FmgcFlightPhases.CRUISE) {
            /** a timeout of 100ms is required in order to receive the updated autopilot vertical mode */
            setTimeout(() => {
                const activeVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'enum');
                const VS = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_VS_SELECTED', 'feet per minute');
                const FPA = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_FPA_SELECTED', 'Degrees');
                if ((activeVerticalMode === 14 && VS < 0) || (activeVerticalMode === 15 && FPA < 0)) {
                    if (canInitiateDes(this.fmc)) {
                        this.changeFlightPhase(FmgcFlightPhases.DESCENT);
                    } else {
                        this.fmc._onStepClimbDescent();
                    }
                }
            }, 100);
        }
    }

    changeFlightPhase(_fmgcNewFlightPhase) {
        const _fmgcCurFlightPhase = this.fmc.currentFlightPhase;
        console.log("FMGC Flight Phase: " + _fmgcCurFlightPhase + " => " + _fmgcNewFlightPhase);
        this.fmc.currentFlightPhase = _fmgcNewFlightPhase;
        SimVar.SetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "number", _fmgcNewFlightPhase);
        // Updating old SimVar to ensure downwards compatibility
        SimVar.SetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number", (_fmgcNewFlightPhase < FmgcFlightPhases.TAKEOFF ? FmgcFlightPhases.PREFLIGHT : _fmgcNewFlightPhase + 1));

        this.activeFlightPhase = this.flightPhases[_fmgcNewFlightPhase];

        this.activeFlightPhase.init(this.fmc);

        this.fmc.onFlightPhaseChanged(_fmgcCurFlightPhase, _fmgcNewFlightPhase);

        this.checkFlightPhase();
    }
}

class A32NX_FlightPhase_PreFlight {
    constructor() {
        this.nextFmgcFlightPhase = FmgcFlightPhases.TAKEOFF;
        this.takeoffConfirmation = new NXLogic_ConfirmNode(.2);
    }

    init(_fmc) {
    }

    check(_deltaTime, _fmc) {
        return this.takeoffConfirmation.write(canInitiateTO(_fmc), _deltaTime);
    }
}

class A32NX_FlightPhase_TakeOff {
    constructor() {
    }

    init(_fmc) {
        SimVar.SetSimVarValue("L:A32NX_COLD_AND_DARK_SPAWN", "Bool", false);
        this.nextFmgcFlightPhase = FmgcFlightPhases.CLIMB;
        this.accelerationAltitudeMsl = (_fmc.accelerationAltitude || _fmc.thrustReductionAltitude);
        this.accelerationAltitudeMslEo = _fmc.engineOutAccelerationAltitude;

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

        if (!this.accelerationAltitudeMslEo) {
            this.accelerationAltitudeMslEo = _fmc.climbTransitionGroundAltitude + parseInt(NXDataStore.get("CONFIG_ENG_OUT_ACCEL_ALT", "1500"));
        }

        _fmc.updateManagedSpeed();
    }

    check(_deltaTime, _fmc) {
        const isAcOnGround = Simplane.getAltitudeAboveGround() <= 1.5;

        if (isAcOnGround && Math.max(SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:1", "number"), SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:2", "number")) < 35) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.PREFLIGHT;
            return true;
        }
        if (isAcOnGround && !_fmc.isAnEngineOn()) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.DONE;
            return true;
        }
        return Simplane.getAltitude() > (_fmc.isAllEngineOn() ? this.accelerationAltitudeMsl : this.accelerationAltitudeMslEo);
    }
}

class A32NX_FlightPhase_Climb {
    constructor() {
    }

    init(_fmc) {
        this.nextFmgcFlightPhase = FmgcFlightPhases.CRUISE;
        if (!_fmc.cruiseFlightLevel) {
            _fmc.cruiseFlightLevel = Simplane.getAutoPilotDisplayedAltitudeLockValue("feet") / 100;
            _fmc._activeCruiseFlightLevelDefaulToFcu = true;
        }
        _fmc.updateManagedSpeed();
    }

    check(_deltaTime, _fmc) {
        if (!_fmc.isAnEngineOn() && Simplane.getAltitudeAboveGround() < 1.5) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.DONE;
            return true;
        }
        return Math.round(Simplane.getAltitude() / 100) >= _fmc.cruiseFlightLevel;
    }
}

class A32NX_FlightPhase_Cruise {
    constructor() {
        this.nextFmgcFlightPhase = FmgcFlightPhases.DONE;
    }

    init(_fmc) {
        _fmc._activeCruiseFlightLevelDefaulToFcu = false;
        // This checks against the pilot defined cruise altitude and the automatically populated cruise altitude
        if (_fmc.cruiseFlightLevel !== _fmc._cruiseFlightLevel) {
            _fmc._cruiseFlightLevel = _fmc.cruiseFlightLevel;
            _fmc.addNewMessage(NXSystemMessages.newCrzAlt.modifyMessage(_fmc._cruiseFlightLevel * 100));
        }
        _fmc.updateManagedSpeed();
    }

    check(_deltaTime, _fmc) {
        return !_fmc.isAnEngineOn() && Simplane.getAltitudeAboveGround() < 1.5;
    }
}

class A32NX_FlightPhase_Descent {
    constructor() {
    }

    init(_fmc) {
        this.nextFmgcFlightPhase = FmgcFlightPhases.APPROACH;
        _fmc.cruiseFlightLevel = undefined;
        _fmc._activeCruiseFlightLevelDefaulToFcu = false;
        _fmc.updateManagedSpeed();
    }

    check(_deltaTime, _fmc) {
        const fl = Math.round(Simplane.getAltitude() / 100);
        const fcuSelFl = Simplane.getAutoPilotDisplayedAltitudeLockValue("feet") / 100;

        if (fl === _fmc.cruiseFlightLevel && fcuSelFl === fl) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.CRUISE;
            return true;
        }

        if (!_fmc.isAnEngineOn() && Simplane.getAltitudeAboveGround() < 1.5) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.DONE;
            return true;
        }

        // APPROACH phase from DECEL pseudo waypoint case. This is decided by the new TS FMS.
        return SimVar.GetSimVarValue('L:A32NX_FM_ENABLE_APPROACH_PHASE', 'Bool');
    }
}

class A32NX_FlightPhase_Approach {
    constructor() {
        this.landingConfirmation = new NXLogic_ConfirmNode(30);
    }

    init(_fmc) {
        this.nextFmgcFlightPhase = FmgcFlightPhases.DONE;
        _fmc.updateManagedSpeed();
        SimVar.SetSimVarValue("L:AIRLINER_TO_FLEX_TEMP", "Number", 0);
    }

    check(_deltaTime, _fmc) {
        if (SimVar.GetSimVarValue("L:A32NX_FMA_VERTICAL_MODE", "number") === 41) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.GOAROUND;
            return true;
        }

        return this.landingConfirmation.write(Simplane.getAltitudeAboveGround() < 1.5, _deltaTime) || !_fmc.isAnEngineOn();
    }
}

class A32NX_FlightPhase_GoAround {
    constructor() {
        this.nextFmgcFlightPhase = FmgcFlightPhases.DONE;
    }

    init(_fmc) {
        _fmc.updateManagedSpeed();
        SimVar.SetSimVarValue("L:AIRLINER_TO_FLEX_TEMP", "Number", 0);
    }

    check(_deltaTime, _fmc) {
        return !_fmc.isAnEngineOn() && Simplane.getAltitudeAboveGround() < 1.5;
    }
}

class A32NX_FlightPhase_Done {
    constructor() {
        this.takeoffConfirmation = new NXLogic_ConfirmNode(.2);
        this.nextFmgcFlightPhase = FmgcFlightPhases.TAKEOFF;
        SimVar.SetSimVarValue("L:AIRLINER_TO_FLEX_TEMP", "Number", 0);
    }

    init(_fmc) {
        CDUIdentPage.ShowPage(_fmc);
        _fmc.flightPlanManager.clearFlightPlan().then(() => {
            _fmc.initVariables();
            _fmc.initMcduVariables();
            _fmc.dataManager.deleteAllStoredWaypoints();
            _fmc.scratchpad.setText("");
            SimVar.SetSimVarValue("L:A32NX_COLD_AND_DARK_SPAWN", "Bool", true).then(() => {
                CDUIdentPage.ShowPage(_fmc);
            });
        }).catch(console.error);
    }

    check(_deltaTime, _fmc) {
        return this.takeoffConfirmation.write(canInitiateTO(_fmc), _deltaTime);
    }
}
