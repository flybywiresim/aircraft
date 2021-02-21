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
            this.changeFlightPhase(this.activeFlightPhase.nextFmgcFlightPhase);
        }
    }

    changeFlightPhase(_fmgcFlightPhase) {
        console.log("FMGC Flight Phase: " + this.fmc.currentFlightPhase + " => " + _fmgcFlightPhase);
        this.fmc.currentFlightPhase = _fmgcFlightPhase;
        SimVar.SetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "number", _fmgcFlightPhase);
        // Updating old SimVar to ensure downwards compatibility
        SimVar.SetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number", (_fmgcFlightPhase < FMGC_FLIGHT_PHASES.TAKEOFF ? FMGC_FLIGHT_PHASES.PREFLIGHT : _fmgcFlightPhase + 1));

        this.activeFlightPhase = this.flightPhases[_fmgcFlightPhase];

        this.activeFlightPhase.init(this.fmc);

        this.fmc.onFlightPhaseChanged();

        this.checkFlightPhase();
    }
}

class A32NX_FlightPhase_PreFlight {
    constructor(_fmc) {
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.TAKEOFF;
    }

    init(_fmc) {
        _fmc.climbTransitionGroundAltitude = null;
    }

    check(_fmc) {
        // Simplane.getAltitudeAboveGround() > 1500; is used to skip flight phase in case ac reloaded midair
        return Simplane.getEngineThrottleMode(0) >= ThrottleMode.FLEX_MCT || Simplane.getEngineThrottleMode(1) >= ThrottleMode.FLEX_MCT || Simplane.getAltitudeAboveGround() > 1500;
    }
}

class A32NX_FlightPhase_TakeOff {
    constructor(_fmc) {
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.CLIMB;
    }

    init(_fmc) {
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
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.CRUISE;
    }

    init(_fmc) {
    }

    check(_fmc) {
        return Math.round(Simplane.getAltitude() / 100) >= _fmc.cruiseFlightLevel;
    }
}

class A32NX_FlightPhase_Cruise {
    constructor(_fmc) {
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.DESCENT;
    }

    init(_fmc) {
    }

    check(_fmc) {
        return Math.round(Simplane.getAltitude() / 100) < _fmc.cruiseFlightLevel && _fmc.fcuSelAlt / 100 < _fmc.cruiseFlightLevel &&
            (_fmc.flightPlanManager.getDestination()).liveDistanceTo < 200;
    }
}

class A32NX_FlightPhase_Descent {
    constructor(_fmc) {
    }

    init(_fmc) {
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.APPROACH;
    }

    check(_fmc) {
        const fl = Math.round(Simplane.getAltitude() / 100);
        if (fl === _fmc.cruiseFlightLevel) {
            this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.CRUISE;
            return true;
        }

        if (fl < _fmc.cruiseFlightLevel && _fmc.fcuSelAlt / 100 > fl) {
            this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.CLIMB;
            return true;
        }

        if (_fmc.flightPlanManager.decelWaypoint) {
            const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            const planeLla = new LatLongAlt(lat, long);
            const dist = Avionics.Utils.computeGreatCircleDistance(_fmc.flightPlanManager.decelWaypoint.infos.coordinates, planeLla);
            if (dist < 3) {
                _fmc.flightPlanManager._decelReached = true;
                _fmc._waypointReachedAt = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
                if (Simplane.getAltitudeAboveGround() < 9500) {
                    this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.APPROACH;
                    return true;
                }
            }
        }

        return false;
    }
}

class A32NX_FlightPhase_Approach {
    constructor(_fmc) {
    }

    init(_fmc) {
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.DONE;
        this.landingResetTimer = null;
        this.lastPhaseUpdateTime = null;
    }

    check(_fmc) {
        if (Simplane.getEngineThrottleMode(0) === ThrottleMode.TOGA || Simplane.getEngineThrottleMode(1) === ThrottleMode.TOGA) {
            this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.GOAROUND;
            return true;
        }

        const fl = Math.round(Simplane.getAltitude() / 100);

        if (fl === _fmc.cruiseFlightLevel) {
            this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.CRUISE;
            return true;
        }

        if (fl < _fmc.cruiseFlightLevel && _fmc.fcuSelAlt / 100 > fl) {
            this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.CLIMB;
            return true;
        }

        if (Simplane.getAltitudeAboveGround() < 1.5) {
            if (this.landingResetTimer == null) {
                this.landingResetTimer = 30;
            }
            if (this.lastPhaseUpdateTime == null) {
                this.lastPhaseUpdateTime = Date.now();
            }
            const deltaTime = Date.now() - this.lastPhaseUpdateTime;
            const deltaQuotient = deltaTime / 1000;
            this.lastPhaseUpdateTime = Date.now();
            this.landingResetTimer -= deltaQuotient;
            if (this.landingResetTimer <= 0 && !_fmc.isAllEngineOn()) {
                return true;
            }
        }

        return false;
    }
}

class A32NX_FlightPhase_GoAround {
    constructor(_fmc) {
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.DONE;
    }

    init(_fmc) {
    }

    check(_fmc) {
        return Simplane.getAltitude() > _fmc.accelerationAltitudeGoaround;
    }
}

class A32NX_FlightPhase_Done {
    constructor(_fmc) {
        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.PREFLIGHT;
    }

    init(_fmc) {
        SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_NORMAL", "Bool", 0);
        CDUIdentPage.ShowPage(_fmc);
    }

    check(_fmc) {
        return true;
    }
}
