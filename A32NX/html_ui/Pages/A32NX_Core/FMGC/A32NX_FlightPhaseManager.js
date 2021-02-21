class A32NX_FlightPhaseManager {
    constructor(_fmc) {
        console.log('A32NX_FlightPhaseManager constructed');
        this.fmc = _fmc;

        this.flightPhases = {
            [FMGC_FLIGHT_PHASES.PREFLIGHT]: new A32NX_FlightPhase(
                FMGC_FLIGHT_PHASES.PREFLIGHT,
                (_fmc) => {
                    this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.TAKEOFF;
                    console.log("FMGC Flight Phase " + (this.nextFmgcFlightPhase - 1) + "init");
                    _fmc.climbTransitionGroundAltitude = null;
                },
                (_fmc) => {
                    return Simplane.getEngineThrottleMode(0) >= ThrottleMode.FLEX_MCT || Simplane.getEngineThrottleMode(1) >= ThrottleMode.FLEX_MCT;
                }
            ),
            [FMGC_FLIGHT_PHASES.TAKEOFF]: new A32NX_FlightPhase(
                FMGC_FLIGHT_PHASES.TAKEOFF,
                (_fmc) => {
                    this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.CLIMB;
                    console.log("FMGC Flight Phase " + (this.nextFmgcFlightPhase - 1) + "init");
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
                },
                (_fmc) => {
                    return Simplane.getAltitude() > this.accelerationAltitudeMsl;
                }
            ),
            [FMGC_FLIGHT_PHASES.CLIMB]: new A32NX_FlightPhase(
                FMGC_FLIGHT_PHASES.CLIMB,
                (_fmc) => {
                    this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.CRUISE;
                    console.log("FMGC Flight Phase " + (this.nextFmgcFlightPhase - 1) + "init");
                },
                (_fmc) => {
                    return Math.round(Simplane.getAltitude() / 100) >= _fmc.cruiseFlightLevel;
                }
            ),
            [FMGC_FLIGHT_PHASES.CRUISE]: new A32NX_FlightPhase(
                FMGC_FLIGHT_PHASES.CRUISE,
                (_fmc) => {
                    this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.DESCENT;
                    console.log("FMGC Flight Phase " + (this.nextFmgcFlightPhase - 1) + "init");
                },
                (_fmc) => {
                    return Math.round(Simplane.getAltitude() / 100) < _fmc.cruiseFlightLevel &&
                        _fmc.fcuSelAlt / 100 < _fmc.cruiseFlightLevel &&
                        (_fmc.flightPlanManager.getDestination()).liveDistanceTo < 200;
                }
            ),
            [FMGC_FLIGHT_PHASES.DESCENT]: new A32NX_FlightPhase(
                FMGC_FLIGHT_PHASES.DESCENT,
                (_fmc) => {
                    this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.APPROACH;
                    console.log("FMGC Flight Phase " + (this.nextFmgcFlightPhase - 1) + "init");
                },
                (_fmc) => {
                    if (Math.round(Simplane.getAltitude() / 100) === _fmc.cruiseFlightLevel) {
                        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.CRUISE;
                        return true;
                    }

                    if (decelCheck(_fmc)) {
                        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.APPROACH;
                        return true;
                    }

                    return false;
                }
            ),
            [FMGC_FLIGHT_PHASES.APPROACH]: new A32NX_FlightPhase(
                FMGC_FLIGHT_PHASES.APPROACH,
                (_fmc) => {
                    this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.DONE;
                    console.log("FMGC Flight Phase " + (this.nextFmgcFlightPhase - 1) + "init");
                    this.landingResetTimer = null;
                    this.lastPhaseUpdateTime = null;
                },
                (_fmc) => {
                    if (Simplane.getEngineThrottleMode(0) === ThrottleMode.TOGA || Simplane.getEngineThrottleMode(1) === ThrottleMode.TOGA) {
                        this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.GOAROUND;
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
            ),
            [FMGC_FLIGHT_PHASES.GOAROUND]: new A32NX_FlightPhase(
                FMGC_FLIGHT_PHASES.GOAROUND,
                (_fmc) => {
                    this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.DONE;
                    console.log("FMGC Flight Phase " + (this.nextFmgcFlightPhase - 1) + "init");
                },
                (_fmc) => {
                    return Simplane.getAltitude() > _fmc.accelerationAltitudeGoaround;
                }
            ),
            [FMGC_FLIGHT_PHASES.DONE]: new A32NX_FlightPhase(
                FMGC_FLIGHT_PHASES.DONE,
                (_fmc) => {
                    this.nextFmgcFlightPhase = FMGC_FLIGHT_PHASES.PREFLIGHT;
                    console.log("FMGC Flight Phase " + (this.nextFmgcFlightPhase - 1) + "init");
                    SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_NORMAL", "Bool", 0);
                    CDUIdentPage.ShowPage(this);
                },
                (_fmc) => {
                    return true;
                }
            ),
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

            this.fmc.onFlightPhaseChanged();

            this.checkFlightPhase();
        }
    }
}

class A32NX_FlightPhase {
    constructor(_flightPhase, _init, _check) {
        console.log("A32NX_FlightPhase " + _flightPhase + "constructed");
        this.init = _init;
        this.check = _check;
    }
}

function decelCheck(_fmc) {
    if (_fmc.flightPlanManager.decelWaypoint) {
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        const planeLla = new LatLongAlt(lat, long);
        const dist = Avionics.Utils.computeGreatCircleDistance(_fmc.flightPlanManager.decelWaypoint.infos.coordinates, planeLla);
        if (dist < 3) {
            _fmc.flightPlanManager._decelReached = true;
            _fmc._waypointReachedAt = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
            if (Simplane.getAltitudeAboveGround() < 9500) {
                return true;
            }
        }
    }
    return false;
}
