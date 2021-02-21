class A32NX_FlightPhaseManager {
    constructor(_fmc) {
        console.log('A32NX_FlightPhaseManager constructed');
        this.fmc = _fmc;

        this.flightPhases = {
            [FMGC_FLIGHT_PHASES.PREFLIGHT]: new A32NX_FlightPhase_PreFlight(_fmc),
            [FMGC_FLIGHT_PHASES.TAKEOFF]: new A32NX_FlightPhase_TakeOff(_fmc),
            [FMGC_FLIGHT_PHASES.CLIMB]: new A32NX_FlightPhase_Climb(_fmc),
            [FMGC_FLIGHT_PHASES.CRUISE]: new A32NX_FlightPhase_Cruise(_fmc),
            [FMGC_FLIGHT_PHASES.DESCENT]: new A32NX_FlightPhase_Descent(_fmc),
            [FMGC_FLIGHT_PHASES.APPROACH]: new A32NX_FlightPhase_Approach(_fmc),
            [FMGC_FLIGHT_PHASES.GOAROUND]: new A32NX_FlightPhase_GoAround(_fmc),
            [FMGC_FLIGHT_PHASES.DONE]: new A32NX_FlightPhase_Done(_fmc)
        };

        this.activeFlightPhase = this.flightPhases[FMGC_FLIGHT_PHASES.PREFLIGHT];

        this.activeFlightPhase.init(_fmc);

        SimVar.SetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "number", FMGC_FLIGHT_PHASES.PREFLIGHT);
    }

    checkFlightPhase() {
        if (this.activeFlightPhase.check(this.fmc)) {
            console.log("new flight phase: " + this.activeFlightPhase.nextFmgcFlightPhase);
            this.fmc.flightPhase = this.activeFlightPhase.nextFmgcFlightPhase;
            SimVar.SetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "number", this.activeFlightPhase.nextFmgcFlightPhase);

            this.activeFlightPhase = this.flightPhases[this.activeFlightPhase.nextFmgcFlightPhase];

            this.activeFlightPhase.init(this.fmc);

            /*
            switch (this.activeFlightPhase.nextFmgcFlightPhase) {
                case FMGC_FLIGHT_PHASES.PREFLIGHT: {
                    this.flightPhase = new A32NX_FlightPhase_PreFlight(this.fmc);
                    break;
                }
                case FMGC_FLIGHT_PHASES.TAKEOFF: {
                    this.flightPhase = new A32NX_FlightPhase_TakeOff(this.fmc);
                    break;
                }
                case FMGC_FLIGHT_PHASES.CLIMB: {
                    this.flightPhase = new A32NX_FlightPhase_Climb(this.fmc);
                    break;
                }
                case FMGC_FLIGHT_PHASES.CRUISE: {
                    this.flightPhase = new A32NX_FlightPhase_Cruise(this.fmc);
                    break;
                }
                case FMGC_FLIGHT_PHASES.DESCENT: {
                    this.flightPhase = new A32NX_FlightPhase_Descent(this.fmc);
                    break;
                }
                case FMGC_FLIGHT_PHASES.APPROACH: {
                    this.flightPhase = new A32NX_FlightPhase_Approach(this.fmc);
                    break;
                }
                case FMGC_FLIGHT_PHASES.GOAROUND: {
                    this.flightPhase = new A32NX_FlightPhase_GoAround(this.fmc);
                    break;
                }
                case FMGC_FLIGHT_PHASES.DONE: {
                    this.flightPhase = new A32NX_FlightPhase_Done(this.fmc);
                    break;
                }
            }*/

            this.checkFlightPhase();
        }
    }
}

class A32NX_FlightPhase_PreFlight {
    constructor(_fmc) {
        console.log("A32NX_FlightPhase_PreFlight constructed");
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.TAKEOFF;
    }

    init(_fmc) {
        console.log("A32NX_FlightPhase_PreFlight init");
    }

    check(_fmc) {
        return Simplane.getEngineThrottleMode(0) >= ThrottleMode.FLEX_MCT || Simplane.getEngineThrottleMode(1) >= ThrottleMode.FLEX_MCT;
    }
}

class A32NX_FlightPhase_TakeOff {
    constructor(_fmc) {
        console.log("A32NX_FlightPhase_TakeOff constructed");
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.CLIMB;
    }

    init(_fmc) {
        console.log("A32NX_FlightPhase_TakeOff init");
        this.accelerationAltitudeMsl = (_fmc.accelerationAltitude || _fmc.thrustReductionAltitude);

        if (!this.accelerationAltitudeMsl) {
            if (!_fmc.climbTransitionGroundAltitude) {
                const origin = _fmc.flightPlanManager.getOrigin();
                if (origin) {
                    _fmc.climbTransitionGroundAltitude = origin.altitudeinFP;
                }

                if (!_fmc.climbTransitionGroundAltitude) {
                    _fmc.climbTransitionGroundAltitude = (parseInt(SimVar.GetSimVarValue("GROUND ALTITUDE", "feet")) || 0); //TODO: figure out what this does
                }
            }

            this.accelerationAltitudeMsl = _fmc.climbTransitionGroundAltitude + parseInt(NXDataStore.get("CONFIG_ACCEL_ALT", "1500"));
        }
    }

    check(_fmc) {
        return Simplane.getAltitude() > this.accelerationAltitudeMsl;
    }
}

class A32NX_FlightPhase_Climb {
    constructor(_fmc) {
        console.log("A32NX_FlightPhase_Climb constructed");
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.CRUISE;
    }

    init(_fmc) {
        console.log("A32NX_FlightPhase_Climb init");
    }

    check(_fmc) {
        return Math.round(Simplane.getAltitude() / 1000) >= _fmc.cruiseFlightLevel;
    }
}

class A32NX_FlightPhase_Cruise {
    constructor(_fmc) {
        console.log("A32NX_FlightPhase_Cruise constructed");
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.DESCENT;
    }

    init(_fmc) {
        console.log("A32NX_FlightPhase_Cruise init");
    }

    check(_fmc) {
        return Math.round(Simplane.getAltitude() / 1000) < _fmc.cruiseFlightLevel && _fmc.fcuSelAlt / 1000 < _fmc.cruiseFlightLevel &&
            (_fmc.flightPlanManager.getDestination()).liveDistanceTo < 200;
    }
}

class A32NX_FlightPhase_Descent {
    constructor(_fmc) {
        console.log("A32NX_FlightPhase_Descent constructed");
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.APPROACH;
    }

    init(_fmc) {
        console.log("A32NX_FlightPhase_Descent init");
    }

    check(_fmc) {
    }
}

class A32NX_FlightPhase_Approach {
    constructor(_fmc) {
        console.log("A32NX_FlightPhase_Approach constructed");
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.DONE;
    }

    init(_fmc) {
        console.log("A32NX_FlightPhase_Approach init");
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.DONE;
    }

    check(_fmc) {
    }
}

class A32NX_FlightPhase_GoAround {
    constructor(_fmc) {
        console.log("A32NX_FlightPhase_GoAround constructed");
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.DONE;
    }

    init(_fmc) {
        console.log("A32NX_FlightPhase_GoAround init");
    }

    check(_fmc) {
    }
}

class A32NX_FlightPhase_Done {
    constructor(_fmc) {
        console.log("A32NX_FlightPhase_Done constructed");
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.PREFLIGHT;
    }

    init(_fmc) {
        console.log("A32NX_FlightPhase_Done init");
    }

    check(_fmc) {
    }
}
