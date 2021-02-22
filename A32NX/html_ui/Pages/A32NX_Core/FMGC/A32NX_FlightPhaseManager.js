class A32NX_FlightPhaseManager {
    constructor(_fmc) {
        console.log('A32NX_FlightPhaseManager constructed');
        this.fmc = _fmc;

        this.flightPhases = {
            [FmgcFlightPhases.PREFLIGHT]: new A32NX_FlightPhase_PreFlight(_fmc),
            [FmgcFlightPhases.TAKEOFF]: new A32NX_FlightPhase_TakeOff(_fmc),
            [FmgcFlightPhases.CLIMB]: new A32NX_FlightPhase_Climb(_fmc),
            [FmgcFlightPhases.CRUISE]: new A32NX_FlightPhase_Cruise(_fmc),
            [FmgcFlightPhases.DESCENT]: new A32NX_FlightPhase_Descent(_fmc),
            [FmgcFlightPhases.APPROACH]: new A32NX_FlightPhase_Approach(_fmc),
            [FmgcFlightPhases.GOAROUND]: new A32NX_FlightPhase_GoAround(_fmc),
            [FmgcFlightPhases.DONE]: new A32NX_FlightPhase_Done(_fmc)
        };

        this.activeFlightPhase = this.flightPhases[FmgcFlightPhases.PREFLIGHT];

        SimVar.SetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "number", FmgcFlightPhases.PREFLIGHT);

        this.activeFlightPhase.init(_fmc);
    }

    checkFlightPhase() {
        if (this.activeFlightPhase.check(this.fmc)) {
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
        if (
            this.fmc.currentFlightPhase !== FmgcFlightPhases.DESCENT &&
            (this.fmc.flightPlanManager.getDestination()).liveDistanceTo < 200 &&
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
    constructor(_fmc) {
        this.nextFmgcFlightPhase = FmgcFlightPhases.TAKEOFF;
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
        this.nextFmgcFlightPhase = FmgcFlightPhases.CLIMB;
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
                    _fmc.climbTransitionGroundAltitude = (parseInt(SimVar.GetSimVarValue("GROUND ALTITUDE", "feet")) || 0);
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
        this.nextFmgcFlightPhase = FmgcFlightPhases.CRUISE;
    }

    init(_fmc) {
    }

    check(_fmc) {
        return Math.round(Simplane.getAltitude() / 100) >= _fmc.cruiseFlightLevel;
    }
}

class A32NX_FlightPhase_Cruise {
    constructor(_fmc) {
    }

    init(_fmc) {
    }

    check(_fmc) {
        return false;
    }
}

class A32NX_FlightPhase_Descent {
    constructor(_fmc) {
    }

    init(_fmc) {
        this.nextFmgcFlightPhase = FmgcFlightPhases.APPROACH;
    }

    check(_fmc) {
        const fl = Math.round(Simplane.getAltitude() / 100);
        const fcuSelFl = Simplane.getAutoPilotDisplayedAltitudeLockValue("feet") / 100;
        if (fl === _fmc.cruiseFlightLevel && fcuSelFl === fl) {
            this.nextFmgcFlightPhase = FmgcFlightPhases.CRUISE;
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
                    this.nextFmgcFlightPhase = FmgcFlightPhases.APPROACH;
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
        this.nextFmgcFlightPhase = FmgcFlightPhases.DONE;
        this.landingResetTimer = null;
        this.lastPhaseUpdateTime = null;
    }

    check(_fmc) {
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
            if (this.landingResetTimer <= 0 || !_fmc.isAnEngineOn()) {
                return true;
            }
        }

        return false;
    }
}

class A32NX_FlightPhase_GoAround {
    constructor(_fmc) {
    }

    init(_fmc) {
    }

    check(_fmc) {
        return false;
    }
}

class A32NX_FlightPhase_Done {
    constructor(_fmc) {
        this.nextFmgcFlightPhase = FmgcFlightPhases.PREFLIGHT;
    }

    init(_fmc) {
        SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_NORMAL", "Bool", 0);
        CDUIdentPage.ShowPage(_fmc);
    }

    check(_fmc) {
        return true;
    }
}
