class FMCMainDisplay extends BaseAirliners {
    constructor() {
        super(...arguments);
        this.flightPhaseUpdateThrottler = new UpdateThrottler(800);
        this.fmsUpdateThrottler = new UpdateThrottler(250);
        this._progBrgDistUpdateThrottler = new UpdateThrottler(2000);
        this.ilsUpdateThrottler = new UpdateThrottler(5000);
        this.currentFlightPhase = SimVar.GetSimVarValue("L:A32NX_INITIAL_FLIGHT_PHASE", "number") || FmgcFlightPhases.PREFLIGHT;
        this.flightPhaseManager = new A32NX_FlightPhaseManager(this);
        this._messageQueue = new A32NX_MessageQueue(this);
        this.aocAirportList = new CDUAocAirportList;
        this._apCooldown = 500;
        this._radioNavOn = false;
        this._vhf1Frequency = 0;
        this._vhf2Frequency = 0;
        this._rcl1Frequency = 0;
        this._pre2Frequency = 0;
        this._atc1Frequency = 0;

        /** Declaration of every variable used (NOT initialization) */
        this.currentFlightPlanWaypointIndex = undefined;
        this.costIndex = undefined;
        this.costIndexSet = undefined;
        this.maxCruiseFL = undefined;
        this.routeIndex = undefined;
        this.coRoute = undefined;
        this.tmpOrigin = undefined;
        this.perfTOTemp = undefined;
        this._overridenFlapApproachSpeed = undefined;
        this._overridenSlatApproachSpeed = undefined;
        this._routeFinalFuelWeight = undefined;
        this._routeFinalFuelTime = undefined;
        this._routeFinalFuelTimeDefault = undefined;
        this._routeReservedWeight = undefined;
        this._routeReservedPercent = undefined;
        this.takeOffWeight = undefined;
        this.landingWeight = undefined;
        this.averageWind = undefined;
        this.perfApprQNH = undefined;
        this.perfApprTemp = undefined;
        this.perfApprWindHeading = undefined;
        this.perfApprWindSpeed = undefined;
        this.perfApprTransAlt = undefined;
        this.perfApprTransAltPilotEntered = undefined;
        this.v1Speed = undefined;
        this.vRSpeed = undefined;
        this.v2Speed = undefined;
        this._v1Checked = undefined;
        this._vRChecked = undefined;
        this._v2Checked = undefined;
        this._toFlexChecked = undefined;
        this.toRunway = undefined;
        this.vApp = undefined;
        this.perfApprMDA = undefined;
        this.perfApprDH = undefined;
        this.perfApprFlaps3 = undefined;
        this._lockConnectIls = undefined;
        this._apNavIndex = undefined;
        this._apLocalizerOn = undefined;
        this._canSwitchToNav = undefined;
        this._vhf1Frequency = undefined;
        this._vhf2Frequency = undefined;
        this._vor1Frequency = undefined;
        this._vor1Course = undefined;
        this._vor2Frequency = undefined;
        this._vor2Course = undefined;
        this._ilsFrequency = undefined;
        this._ilsFrequencyPilotEntered = undefined;
        this._ilsCourse = undefined;
        this._adf1Frequency = undefined;
        this._adf2Frequency = undefined;
        this._rcl1Frequency = undefined;
        this._pre2Frequency = undefined;
        this._atc1Frequency = undefined;
        this._radioNavOn = undefined;
        this._debug = undefined;
        this._checkFlightPlan = undefined;
        this.thrustReductionAltitude = undefined;
        this.thrustReductionAltitudeGoaround = undefined;
        this.thrustReductionAltitudeIsPilotEntered = undefined;
        this.accelerationAltitude = undefined;
        this.accelerationAltitudeGoaround = undefined;
        this.accelerationAltitudeIsPilotEntered = undefined;
        this.engineOutAccelerationAltitude = undefined;
        this.engineOutAccelerationAltitudeGoaround = undefined;
        this.engineOutAccelerationAltitudeIsPilotEntered = undefined;
        this.transitionAltitude = undefined;
        this.transitionAltitudeIsPilotEntered = undefined;
        this._windDirections = undefined;
        this._fuelPlanningPhases = undefined;
        this._zeroFuelWeightZFWCGEntered = undefined;
        this._taxiEntered = undefined;
        this._windDir = undefined;
        this._DistanceToAlt = undefined;
        this._routeAltFuelWeight = undefined;
        this._routeAltFuelTime = undefined;
        this._routeTripFuelWeight = undefined;
        this._routeTripTime = undefined;
        this._defaultTaxiFuelWeight = undefined;
        this._rteRsvPercentOOR = undefined;
        this._rteReservedWeightEntered = undefined;
        this._rteReservedPctEntered = undefined;
        this._rteFinalCoeffecient = undefined;
        this._rteFinalWeightEntered = undefined;
        this._rteFinalTimeEntered = undefined;
        this._routeAltFuelEntered = undefined;
        this._minDestFob = undefined;
        this._minDestFobEntered = undefined;
        this._defaultRouteFinalTime = undefined;
        this._fuelPredDone = undefined;
        this._fuelPlanningPhase = undefined;
        this._blockFuelEntered = undefined;
        /* CPDLC Fields */
        this.tropo = undefined;
        this._destDataChecked = undefined;
        this._towerHeadwind = undefined;
        this._EfobBelowMinClr = undefined;
        this.simbrief = undefined;
        this.aocWeight = undefined;
        this.aocTimes = undefined;
        this.winds = undefined;
        this.computedVgd = undefined;
        this.computedVfs = undefined;
        this.computedVss = undefined;
        this.computedVls = undefined;
        this.approachSpeeds = undefined; // based on selected config, not current config
        this._cruiseEntered = undefined;
        this._blockFuelEntered = undefined;
        this.constraintAlt = undefined;
        this.constraintAltCached = undefined;
        this.fcuSelAlt = undefined;
        this._forceNextAltitudeUpdate = undefined;
        this._lastUpdateAPTime = undefined;
        this.updateAutopilotCooldown = undefined;
        this._cruiseFlightLevel = undefined;
        this._activeCruiseFlightLevel = undefined;
        this._activeCruiseFlightLevelDefaulToFcu = undefined;
        this._progBrgDist = undefined;
        this.preSelectedClbSpeed = undefined;
        this.preSelectedCrzSpeed = undefined;
        this.preSelectedDesSpeed = undefined;
        this.managedSpeedTarget = undefined;
        this.managedSpeedTargetIsMach = undefined;
        this.managedSpeedLimit = undefined;
        this.managedSpeedLimitAlt = undefined;
        this.managedSpeedClimb = undefined;
        this.managedSpeedClimbIsPilotEntered = undefined;
        this.managedSpeedClimbMach = undefined;
        // this.managedSpeedClimbMachIsPilotEntered = undefined;
        this.managedSpeedCruise = undefined;
        this.managedSpeedCruiseIsPilotEntered = undefined;
        this.managedSpeedCruiseMach = undefined;
        // this.managedSpeedCruiseMachIsPilotEntered = undefined;
        this.managedSpeedDescend = undefined;
        this.managedSpeedDescendIsPilotEntered = undefined;
        this.managedSpeedDescendMach = undefined;
        // this.managedSpeedDescendMachIsPilotEntered = undefined;
        this.cruiseFlightLevelTimeOut = undefined;
        this.flaps = undefined;
        this.ths = undefined;
        this.ilsAutoIdent = undefined;
        this.ilsAutoCourse = undefined;
        this.ilsAutoTuned = undefined;
        this.ilsTakeoffAutoTuned = undefined;
        this.ilsApproachAutoTuned = undefined;
        this.climbTransitionGroundAltitude = undefined;
        this.altDestination = undefined;
        this.flightNumber = undefined;
        this.cruiseTemperature = undefined;
        this.taxiFuelWeight = undefined;
        this.blockFuel = undefined;
        this.zeroFuelWeight = undefined;
        this.zeroFuelWeightMassCenter = undefined;
        this.activeWpIdx = undefined;
        this.previousAdirsStatus = undefined;
    }

    Init() {
        super.Init();
        this.initVariables();

        this.A32NXCore = new A32NX_Core();
        this.A32NXCore.init(this._lastTime);

        this.dataManager = new FMCDataManager(this);

        this.tempCurve = new Avionics.Curve();
        this.tempCurve.interpolationFunction = Avionics.CurveTool.NumberInterpolation;
        this.tempCurve.add(-10 * 3.28084, 21.50);
        this.tempCurve.add(0, 15.00);
        this.tempCurve.add(10 * 3.28084, 8.50);
        this.tempCurve.add(20 * 3.28084, 2.00);
        this.tempCurve.add(30 * 3.28084, -4.49);
        this.tempCurve.add(40 * 3.28084, -10.98);
        this.tempCurve.add(50 * 3.28084, -17.47);
        this.tempCurve.add(60 * 3.28084, -23.96);
        this.tempCurve.add(70 * 3.28084, -30.45);
        this.tempCurve.add(80 * 3.28084, -36.94);
        this.tempCurve.add(90 * 3.28084, -43.42);
        this.tempCurve.add(100 * 3.28084, -49.90);
        this.tempCurve.add(150 * 3.28084, -56.50);
        this.tempCurve.add(200 * 3.28084, -56.50);
        this.tempCurve.add(250 * 3.28084, -51.60);
        this.tempCurve.add(300 * 3.28084, -46.64);
        this.tempCurve.add(400 * 3.28084, -22.80);
        this.tempCurve.add(500 * 3.28084, -2.5);
        this.tempCurve.add(600 * 3.28084, -26.13);
        this.tempCurve.add(700 * 3.28084, -53.57);
        this.tempCurve.add(800 * 3.28084, -74.51);

        this.cruiseFlightLevel = SimVar.GetGameVarValue("AIRCRAFT CRUISE ALTITUDE", "feet");
        this.cruiseFlightLevel /= 100;
        this._cruiseFlightLevel = this.cruiseFlightLevel;

        this.flightPlanManager.onCurrentGameFlightLoaded(() => {
            this.flightPlanManager.updateFlightPlan(() => {
                this.flightPlanManager.updateCurrentApproach();
                const callback = () => {
                    this.flightPlanManager.createNewFlightPlan();
                    SimVar.SetSimVarValue("L:FLIGHTPLAN_USE_DECEL_WAYPOINT", "number", 1);
                    SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", NaN);
                    SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", NaN);
                    SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", NaN);
                    const cruiseAlt = Math.floor(this.flightPlanManager.cruisingAltitude / 100);
                    console.log("FlightPlan Cruise Override. Cruising at FL" + cruiseAlt + " instead of default FL" + this.cruiseFlightLevel);
                    if (cruiseAlt > 0) {
                        this.cruiseFlightLevel = cruiseAlt;
                        this._cruiseFlightLevel = cruiseAlt;
                    }
                };
                const arrivalIndex = this.flightPlanManager.getArrivalProcIndex();
                if (arrivalIndex >= 0) {
                    this.flightPlanManager.setArrivalProcIndex(arrivalIndex, callback);
                } else {
                    callback();
                }
            });
        });

        this.updateFuelVars();
        this.updatePerfSpeeds();

        CDUPerformancePage.UpdateThrRedAccFromOrigin(this, true, true);
        CDUPerformancePage.UpdateEngOutAccFromOrigin(this);
        SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT", "Number", this.thrustReductionAltitude);

        this.flightPhaseManager.init();

        /** It takes some time until origin and destination are known, placing this inside callback of the flight plan loader doesn't work */
        setTimeout(() => {
            const origin = this.flightPlanManager.getOrigin();
            const dest = this.flightPlanManager.getDestination();
            if (origin && origin.ident && dest && dest.ident) {
                this.aocAirportList.init(origin.ident, dest.ident);
            }
        }, 1000);

        // Start the check routine for system health and status
        setInterval(() => {
            if (this.currentFlightPhase === FmgcFlightPhases.CRUISE && !this._destDataChecked) {
                const dest = this.flightPlanManager.getDestination();
                if (dest && dest.liveDistanceTo < 180) {
                    this._destDataChecked = true;
                    this.checkDestData();
                }
            }
        }, 15000);
    }

    initVariables() {
        this.currentFlightPlanWaypointIndex = -1;
        this.costIndex = 0;
        this.costIndexSet = false;
        this.maxCruiseFL = 390;
        this.routeIndex = 0;
        this.coRoute = "";
        this.tmpOrigin = "";
        this.transitionAltitude = 10000;
        this.perfTOTemp = NaN;
        this._overridenFlapApproachSpeed = NaN;
        this._overridenSlatApproachSpeed = NaN;
        this._routeFinalFuelWeight = 0;
        this._routeFinalFuelTime = 30;
        this._routeFinalFuelTimeDefault = 30;
        this._routeReservedWeight = 0;
        this._routeReservedPercent = 5;
        this.takeOffWeight = NaN;
        this.landingWeight = NaN;
        this.averageWind = 0;
        this.perfApprQNH = NaN;
        this.perfApprTemp = NaN;
        this.perfApprWindHeading = NaN;
        this.perfApprWindSpeed = NaN;
        this.perfApprTransAlt = 10000;
        this.perfApprTransAltPilotEntered = false;
        this.v1Speed = undefined;
        this.vRSpeed = undefined;
        this.v2Speed = undefined;
        this._v1Checked = true;
        this._vRChecked = true;
        this._v2Checked = true;
        this._toFlexChecked = true;
        this.toRunway = "";
        this.vApp = NaN;
        this.perfApprMDA = NaN;
        this.perfApprDH = NaN;
        this.perfApprFlaps3 = false;
        this._lockConnectIls = false;
        this._apNavIndex = 1;
        this._apLocalizerOn = false;
        this._canSwitchToNav = false;
        this._vor1Frequency = 0;
        this._vor1Course = 0;
        this._vor2Frequency = 0;
        this._vor2Course = 0;
        this._ilsFrequency = 0;
        this._ilsFrequencyPilotEntered = false;
        this._ilsCourse = 0;
        this._adf1Frequency = 0;
        this._adf2Frequency = 0;
        this._debug = 0;
        this._checkFlightPlan = 0;
        this.thrustReductionAltitude = NaN;
        this.thrustReductionAltitudeGoaround = NaN;
        this.thrustReductionAltitudeIsPilotEntered = false;
        this.accelerationAltitude = NaN;
        this.accelerationAltitudeGoaround = NaN;
        this.accelerationAltitudeIsPilotEntered = false;
        this.engineOutAccelerationAltitude = NaN;
        this.engineOutAccelerationAltitudeGoaround = NaN;
        this.engineOutAccelerationAltitudeIsPilotEntered = false;
        this.transitionAltitudeIsPilotEntered = false;

        this._windDirections = {
            TAILWIND : "TL",
            HEADWIND : "HD"
        };
        this._fuelPlanningPhases = {
            PLANNING : 1,
            IN_PROGRESS : 2,
            COMPLETED : 3
        };
        this._zeroFuelWeightZFWCGEntered = false;
        this._taxiEntered = false;
        this._windDir = this._windDirections.HEADWIND;
        this._DistanceToAlt = 0;
        this._routeAltFuelWeight = 0;
        this._routeAltFuelTime = 0;
        this._routeTripFuelWeight = 0;
        this._routeTripTime = 0;
        this._defaultTaxiFuelWeight = 0.2;
        this._rteRsvPercentOOR = false;
        this._rteReservedWeightEntered = false;
        this._rteReservedPctEntered = false;
        this._rteFinalCoeffecient = 0;
        this._rteFinalWeightEntered = false;
        this._rteFinalTimeEntered = false;
        this._routeAltFuelEntered = false;
        this._minDestFob = 0;
        this._minDestFobEntered = false;
        this._defaultRouteFinalTime = 45;
        this._fuelPredDone = false;
        this._fuelPlanningPhase = this._fuelPlanningPhases.PLANNING;
        this._blockFuelEntered = false;
        /* CPDLC Fields */
        this.tropo = "";
        this._destDataChecked = false;
        this._towerHeadwind = 0;
        this._EfobBelowMinClr = false;
        this.simbrief = {
            route: "",
            cruiseAltitude: "",
            originIcao: "",
            destinationIcao: "",
            blockFuel: "",
            payload: undefined,
            estZfw: "",
            sendStatus: "READY",
            costIndex: "",
            navlog: [],
            icao_airline: "",
            flight_number: "",
            alternateIcao: "",
            avgTropopause: "",
            ete: "",
            blockTime: "",
            outTime: "",
            onTime: "",
            inTime: "",
            offTime: "",
            taxiFuel: "",
            tripFuel: ""
        };
        this.aocWeight = {
            blockFuel: undefined,
            estZfw: undefined,
            taxiFuel: undefined,
            tripFuel: undefined,
            payload: undefined
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
            alternate: null
        };
        this.computedVgd = undefined;
        this.computedVfs = undefined;
        this.computedVss = undefined;
        this.computedVls = undefined;
        this.approachSpeeds = undefined; // based on selected config, not current config
        this._cruiseEntered = false;
        this._blockFuelEntered = false;
        this.constraintAlt = 0;
        this.constraintAltCached = 0;
        this.fcuSelAlt = 0;
        this._forceNextAltitudeUpdate = false;
        this._lastUpdateAPTime = NaN;
        this.updateAutopilotCooldown = 0;
        this._cruiseFlightLevel = undefined;
        this._activeCruiseFlightLevel = 0;
        this._activeCruiseFlightLevelDefaulToFcu = false;
        const payloadConstruct = new A32NX_PayloadConstructor();
        this.paxStations = payloadConstruct.paxStations;
        this.payloadStations = payloadConstruct.payloadStations;
        this.fmsUpdateThrottler = new UpdateThrottler(250);
        this._progBrgDist = undefined;
        this.preSelectedClbSpeed = undefined;
        this.preSelectedCrzSpeed = undefined;
        this.preSelectedDesSpeed = undefined;
        this.managedSpeedTarget = NaN;
        this.managedSpeedTargetIsMach = false;
        this.managedSpeedLimit = 250;
        this.managedSpeedLimitAlt = 10000;
        this.managedSpeedClimb = 290;
        this.managedSpeedClimbIsPilotEntered = false;
        this.managedSpeedClimbMach = .78;
        // this.managedSpeedClimbMachIsPilotEntered = false;
        this.managedSpeedCruise = 290;
        this.managedSpeedCruiseIsPilotEntered = false;
        this.managedSpeedCruiseMach = .78;
        // this.managedSpeedCruiseMachIsPilotEntered = false;
        this.managedSpeedDescend = 290;
        this.managedSpeedDescendIsPilotEntered = false;
        this.managedSpeedDescendMach = .78;
        // this.managedSpeedDescendMachIsPilotEntered = false;
        this.cruiseFlightLevelTimeOut = undefined;
        this.flaps = NaN;
        this.ths = NaN;
        this.ilsAutoIdent = '';
        this.ilsAutoCourse = 0;
        this.ilsAutoTuned = false;
        this.ilsTakeoffAutoTuned = false;
        this.ilsApproachAutoTuned = false;
        this.climbTransitionGroundAltitude = null;
        this.altDestination = undefined;
        this.flightNumber = undefined;
        this.cruiseTemperature = undefined;
        this.taxiFuelWeight = 0.2;
        this.blockFuel = undefined;
        this.zeroFuelWeight = undefined;
        this.zeroFuelWeightMassCenter = undefined;
        this.previousAdirsStatus = undefined;

        this._messageQueue.resetQueue();
        this.aocAirportList.init();

        // Reset SimVars
        SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", NaN);
        SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", NaN);
        SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", NaN);
        SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", this.transitionAltitude);
        SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", this.perfApprTransAlt);

        CDUPerformancePage.UpdateThrRedAccFromOrigin(this, true, true);
        CDUPerformancePage.UpdateEngOutAccFromOrigin(this);
        SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT", "Number", this.thrustReductionAltitude);

        SimVar.SetSimVarValue("L:A32NX_SPEEDS_MANAGED_PFD", "knots", 0);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_MANAGED_ATHR", "knots", 0);

        SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', -1);
        SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', -1);

        SimVar.SetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "feet", -1);
        SimVar.SetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "feet", 0);

        SimVar.SetSimVarValue("L:A32NX_AP_CSTN_ALT", "feet", this.constraintAlt);
        SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_NORMAL", "Bool", 0);
        SimVar.SetSimVarValue("L:A32NX_CABIN_READY", "Bool", 0);

        if (SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_DISABLED", "number") === 1) {
            SimVar.SetSimVarValue("K:A32NX.ATHR_RESET_DISABLE", "number", 1);
        }
    }

    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);

        if (this._debug++ > 180) {
            this._debug = 0;
        }
        const flightPhaseManagerDelta = this.flightPhaseUpdateThrottler.canUpdate(_deltaTime);
        if (flightPhaseManagerDelta !== -1) {
            this.flightPhaseManager.checkFlightPhase(flightPhaseManagerDelta);
        }
        this._checkFlightPlan--;
        if (this._checkFlightPlan <= 0) {
            this._checkFlightPlan = 120;
            this.flightPlanManager.updateFlightPlan();
            this.flightPlanManager.updateCurrentApproach();
        }

        if (this.fmsUpdateThrottler.canUpdate(_deltaTime) !== -1) {
            this.updateRadioNavState();
            this.updateGPSMessage();
            this.updateDisplayedConstraints();
        }

        this.A32NXCore.update();

        this.updateAutopilot();

        if (this._progBrgDistUpdateThrottler.canUpdate(_deltaTime) !== -1) {
            this.updateProgDistance();
        }

        if (this._flightGuidance) {
            this._flightGuidance.update(_deltaTime);
        }

        if (this.ilsUpdateThrottler.canUpdate(_deltaTime) !== -1) {
            this.updateIls();
        }
    }

    /**
     * This method is called by the FlightPhaseManager after a flight phase change
     * This method initializes AP States, initiates CDUPerformancePage changes and other set other required states
     * @param _lastFlightPhase {FmgcFlightPhases} Previous FmgcFlightPhase
     * @param _curFlightPhase {FmgcFlightPhases} New FmgcFlightPhase
     */
    onFlightPhaseChanged(_lastFlightPhase, _curFlightPhase) {
        this.updateConstraints();
        this.updateManagedSpeed();

        SimVar.SetSimVarValue("L:A32NX_CABIN_READY", "Bool", 0);

        switch (_curFlightPhase) {
            case FmgcFlightPhases.TAKEOFF: {
                this._destDataChecked = false;

                if (this.page.Current === this.page.PerformancePageTakeoff) {
                    CDUPerformancePage.ShowTAKEOFFPage(this);
                } else if (this.page.Current === this.page.ProgressPage) {
                    CDUProgressPage.ShowPage(this);
                }

                /** Arm preselected speed/mach for next flight phase */
                this.updatePreSelSpeedMach(this.preSelectedClbSpeed);

                break;
            }

            case FmgcFlightPhases.CLIMB: {

                this._destDataChecked = false;

                if (this.page.Current === this.page.ProgressPage) {
                    CDUProgressPage.ShowPage(this);
                } else {
                    this.tryUpdatePerfPage(_lastFlightPhase, _curFlightPhase);
                }

                /** Activate pre selected speed/mach */
                if (_lastFlightPhase === FmgcFlightPhases.TAKEOFF) {
                    this.activatePreSelSpeedMach(this.preSelectedClbSpeed);
                }

                /** Arm preselected speed/mach for next flight phase */
                this.updatePreSelSpeedMach(this.preSelectedCrzSpeed);

                break;
            }

            case FmgcFlightPhases.CRUISE: {
                if (this.page.Current === this.page.ProgressPage) {
                    CDUProgressPage.ShowPage(this);
                } else {
                    this.tryUpdatePerfPage(_lastFlightPhase, _curFlightPhase);
                }

                SimVar.SetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool", 0);
                Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);

                /** Activate pre selected speed/mach */
                if (_lastFlightPhase === FmgcFlightPhases.CLIMB) {
                    this.activatePreSelSpeedMach(this.preSelectedCrzSpeed);
                }

                /** Arm preselected speed/mach for next flight phase */
                this.updatePreSelSpeedMach(this.preSelectedDesSpeed);

                break;
            }

            case FmgcFlightPhases.DESCENT: {
                if (this.page.Current === this.page.ProgressPage) {
                    CDUProgressPage.ShowPage(this);
                } else {
                    this.tryUpdatePerfPage(_lastFlightPhase, _curFlightPhase);
                }

                this.checkDestData();

                Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);

                /** Activate pre selected speed/mach */
                if (_lastFlightPhase === FmgcFlightPhases.CRUISE) {
                    this.activatePreSelSpeedMach(this.preSelectedDesSpeed);
                }

                /** Clear pre selected speed/mach */
                this.updatePreSelSpeedMach(undefined);

                break;
            }

            case FmgcFlightPhases.APPROACH: {
                if (this.page.Current === this.page.ProgressPage) {
                    CDUProgressPage.ShowPage(this);
                } else {
                    this.tryUpdatePerfPage(_lastFlightPhase, _curFlightPhase);
                }

                this.connectIls();
                this.flightPlanManager.activateApproach();

                Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
                SimVar.SetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool", 0);

                this.checkDestData();

                break;
            }

            case FmgcFlightPhases.GOAROUND: {
                SimVar.SetSimVarValue("L:A32NX_GOAROUND_GATRK_MODE", "bool", 0);
                SimVar.SetSimVarValue("L:A32NX_GOAROUND_HDG_MODE", "bool", 0);
                SimVar.SetSimVarValue("L:A32NX_GOAROUND_NAV_MODE", "bool", 0);
                SimVar.SetSimVarValue("L:A32NX_GOAROUND_INIT_SPEED", "number", Simplane.getIndicatedSpeed());
                SimVar.SetSimVarValue("L:A32NX_GOAROUND_INIT_APP_SPEED", "number", this.getVApp());
                //delete override logic when we have valid nav data -aka goaround path- after goaround!
                SimVar.SetSimVarValue("L:A32NX_GOAROUND_NAV_OVERRIDE", "bool", 0);

                if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool") === 1) {
                    SimVar.SetSimVarValue("K:AP_LOC_HOLD_ON", "number", 1); // Turns AP localizer hold !!ON/ARMED!! and glide-slope hold mode !!OFF!!
                    SimVar.SetSimVarValue("K:AP_LOC_HOLD_OFF", "number", 1); // Turns !!OFF!! localizer hold mode
                    SimVar.SetSimVarValue("K:AUTOPILOT_OFF", "number", 1);
                    SimVar.SetSimVarValue("K:AUTOPILOT_ON", "number", 1);
                    SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_APPR_MODE", "bool", 0);
                    SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_LOC_MODE", "bool", 0);
                } else if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool") === 0 && SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean") === 1) {
                    SimVar.SetSimVarValue("AP_APR_HOLD_OFF", "number", 1);
                    SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_APPR_MODE", "bool", 0);
                    SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_LOC_MODE", "bool", 0);
                }

                const currentHeading = Simplane.getHeadingMagnetic();
                Coherent.call("HEADING_BUG_SET", 1, currentHeading);

                if (this.page.Current === this.page.ProgressPage) {
                    CDUProgressPage.ShowPage(this);
                } else {
                    this.tryUpdatePerfPage(_lastFlightPhase, _curFlightPhase);
                }

                break;
            }
        }
    }

    getManagedTargets(v, m) {
        //const vM = _convertMachToKCas(m, _convertCtoK(Simplane.getAmbientTemperature()), SimVar.GetSimVarValue("AMBIENT PRESSURE", "millibar"));
        const vM = SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", m);
        return v > vM ? [vM, true] : [v, false];
    }

    updateManagedSpeeds() {
        if (!this.managedSpeedClimbIsPilotEntered) {
            this.managedSpeedClimb = this.getClbManagedSpeedFromCostIndex();
        }
        if (!this.managedSpeedCruiseIsPilotEntered) {
            this.managedSpeedCruise = this.getCrzManagedSpeedFromCostIndex();
        }
        if (!this.managedSpeedDescendIsPilotEntered) {
            this.managedSpeedDescend = this.getDesManagedSpeedFromCostIndex();
        }
    }

    updateManagedSpeed() {
        let vPfd = 0;
        let isMach = false;

        if (SimVar.GetSimVarValue("L:A32NX_FMA_EXPEDITE_MODE", "number") === 1) {
            const verticalMode = SimVar.GetSimVarValue("L:A32NX_FMA_VERTICAL_MODE", "number");
            if (verticalMode === 12) {
                switch (SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Number")) {
                    case 0: {
                        this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_SPEEDS_GD", "number");
                        break;
                    }
                    case 1: {
                        this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_SPEEDS_S", "number");
                        break;
                    }
                    default: {
                        this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_SPEEDS_F", "number");
                    }
                }
            } else if (verticalMode === 13) {
                const T = _convertCtoK(Simplane.getAmbientTemperature());
                const p = SimVar.GetSimVarValue("AMBIENT PRESSURE", "millibar");
                //this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Number") === 0 ? Math.min(340, _convertMachToKCas(.8, T, p)) : SimVar.GetSimVarValue("L:A32NX_SPEEDS_VMAX", "number") - 10;
                this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Number") === 0 ? Math.min(340, SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", 0.8)) : SimVar.GetSimVarValue("L:A32NX_SPEEDS_VMAX", "number") - 10;
            }
            vPfd = this.managedSpeedTarget;
        } else {
            switch (this.currentFlightPhase) {
                case FmgcFlightPhases.PREFLIGHT: {
                    if (this.v2Speed) {
                        vPfd = this.v2Speed;
                        this.managedSpeedTarget = this.v2Speed + 10;
                    }
                    break;
                }
                case FmgcFlightPhases.TAKEOFF: {
                    if (this.v2Speed) {
                        vPfd = this.v2Speed;
                        this.managedSpeedTarget = this.isAllEngineOn() ? this.v2Speed + 10 : this.v2Speed + 20;
                    }
                    break;
                }
                case FmgcFlightPhases.CLIMB: {
                    let speed = this.managedSpeedClimb;

                    if (SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet") < this.managedSpeedLimitAlt) {
                        speed = Math.min(speed, this.managedSpeedLimit);
                    }

                    speed = Math.min(speed, this.getSpeedConstraint());

                    [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.managedSpeedClimbMach);
                    vPfd = this.managedSpeedTarget;
                    break;
                }
                case FmgcFlightPhases.CRUISE: {
                    let speed = this.managedSpeedCruise;

                    if (SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet") < this.managedSpeedLimitAlt) {
                        speed = Math.min(speed, this.managedSpeedLimit);
                    }

                    [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.managedSpeedCruiseMach);
                    vPfd = this.managedSpeedTarget;
                    break;
                }
                case FmgcFlightPhases.DESCENT: {
                    let speed = this.managedSpeedDescend;

                    if (Math.round(SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet") / 10) * 10 < 20 * (speed - this.managedSpeedLimit) + 300 + this.managedSpeedLimitAlt) {
                        speed = Math.min(speed, this.managedSpeedLimit);
                    }

                    [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.managedSpeedDescendMach);
                    vPfd = this.managedSpeedTarget;
                    break;
                }
                case FmgcFlightPhases.APPROACH: {
                    const ctn = this.getSpeedConstraint(false);
                    let speed = this.getAppManagedSpeed();
                    let vls = this.getVApp();
                    if (isFinite(this.perfApprWindSpeed) && isFinite(this.perfApprWindHeading)) {
                        vls = NXSpeedsUtils.getVtargetGSMini(vls, NXSpeedsUtils.getHeadWindDiff(this._towerHeadwind));
                    }
                    if (ctn !== Infinity) {
                        vls = Math.max(vls, ctn);
                        speed = Math.max(speed, ctn);
                    }

                    vPfd = vls;
                    this.managedSpeedTarget = Math.max(speed, vls);
                    break;
                }
                case FmgcFlightPhases.GOAROUND: {
                    if (Simplane.getAltitude() < this.accelerationAltitudeGoaround) {
                        const speed = Math.min(
                            this.computedVls + (this.isAllEngineOn() ? 25 : 15),
                            Math.max(
                                SimVar.GetSimVarValue("L:A32NX_GOAROUND_INIT_SPEED", "number"),
                                SimVar.GetSimVarValue("L:A32NX_GOAROUND_INIT_APP_SPEED", "number")
                            )
                        );

                        SimVar.SetSimVarValue("L:A32NX_TOGA_SPEED", "number", speed); //TODO: figure that this does

                        vPfd = speed;
                        this.managedSpeedTarget = speed;
                    } else {
                        vPfd = this.computedVgd;
                        this.managedSpeedTarget = this.computedVgd;
                    }
                    break;
                }
            }
        }

        // Automatically change fcu mach/speed mode
        if (this.managedSpeedTargetIsMach !== isMach) {
            if (isMach) {
                SimVar.SetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_ON", "number", 1);
            } else {
                SimVar.SetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_OFF", "number", 1);
            }
            this.managedSpeedTargetIsMach = isMach;
        }

        // Overspeed protection
        const Vtap = Math.min(this.managedSpeedTarget, SimVar.GetSimVarValue("L:A32NX_SPEEDS_VMAX", "number"));
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_MANAGED_PFD", "knots", vPfd);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_MANAGED_ATHR", "knots", Vtap);

        if (this.isAirspeedManaged()) {
            Coherent.call("AP_SPD_VAR_SET", 0, Vtap);
        }
    }

    activatePreSelSpeedMach(preSel) {
        if (preSel) {
            if (preSel < 1) {
                SimVar.SetSimVarValue("H:A320_Neo_FCU_USE_PRE_SEL_MACH", "number", 1);
            } else {
                SimVar.SetSimVarValue("H:A320_Neo_FCU_USE_PRE_SEL_SPEED", "number", 1);
            }
        }
    }

    updatePreSelSpeedMach(preSel) {
        // The timeout is required to create a delay for the current value to be read and the new one to be set
        setTimeout(() => {
            if (preSel) {
                if (preSel > 1) {
                    SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", preSel);
                    SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", -1);
                } else {
                    SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", -1);
                    SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", preSel);
                }
            } else {
                SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", -1);
                SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", -1);
            }
        }, 200);
    }

    updateRadioNavState() {
        if (this.isPrimary) {
            const radioNavOn = this.isRadioNavActive();
            if (radioNavOn !== this._radioNavOn) {
                this._radioNavOn = radioNavOn;
                if (!radioNavOn) {
                    this.initRadioNav(false);
                }
                if (this.refreshPageCallback) {
                    this.refreshPageCallback();
                }
            }
            let apNavIndex = 1;
            let gpsDriven = true;
            const apprHold = SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Bool");
            if (apprHold) {
                if (this.canSwitchToNav()) {
                    let navid = 0;
                    const ils = this.radioNav.getBestILSBeacon();
                    if (ils.id > 0) {
                        navid = ils.id;
                    } else {
                        const vor = this.radioNav.getBestVORBeacon();
                        if (vor.id > 0) {
                            navid = vor.id;
                        }
                    }
                    if (navid > 0) {
                        apNavIndex = navid;
                        const hasFlightplan = Simplane.getAutopilotGPSActive();
                        const apprCaptured = Simplane.getAutoPilotAPPRCaptured();
                        if (apprCaptured || !hasFlightplan) {
                            gpsDriven = false;
                        }
                    }
                }
            }
            if (apNavIndex !== this._apNavIndex) {
                SimVar.SetSimVarValue("K:AP_NAV_SELECT_SET", "number", apNavIndex);
                this._apNavIndex = apNavIndex;
            }
            const curState = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
            if (!!curState !== gpsDriven) {
                SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "Bool", 0);
            }
        }
    }

    updateAutopilot() {
        const now = performance.now();
        const dt = now - this._lastUpdateAPTime;
        this._lastUpdateAPTime = now;
        if (isFinite(dt)) {
            this.updateAutopilotCooldown -= dt;
        }
        if (this.updateAutopilotCooldown < 0) {
            this.updatePerfSpeeds();
            this.updateManagedSpeed();

            const activeWpIdx = this.flightPlanManager.getActiveWaypointIndex();
            if (activeWpIdx !== this.activeWpIdx) {
                this.activeWpIdx = activeWpIdx;
                this.updateConstraints();
            }

            // TODO: Figure out usage (maybe for atc?)
            SimVar.SetSimVarValue("SIMVAR_AUTOPILOT_AIRSPEED_MIN_CALCULATED", "knots", Simplane.getStallProtectionMinSpeed());
            SimVar.SetSimVarValue("SIMVAR_AUTOPILOT_AIRSPEED_MAX_CALCULATED", "knots", Simplane.getMaxSpeed(Aircraft.A320_NEO));

            if (!this.flightPlanManager.isActiveApproach()) {
                const activeWaypoint = this.flightPlanManager.getActiveWaypoint();
                const nextActiveWaypoint = this.flightPlanManager.getNextActiveWaypoint();
                if (activeWaypoint && nextActiveWaypoint) {
                    let pathAngle = nextActiveWaypoint.bearingInFP - activeWaypoint.bearingInFP;
                    while (pathAngle < 180) {
                        pathAngle += 360;
                    }
                    while (pathAngle > 180) {
                        pathAngle -= 360;
                    }
                    const absPathAngle = 180 - Math.abs(pathAngle);
                    const airspeed = Simplane.getIndicatedSpeed();
                    if (airspeed < 400) {
                        const turnRadius = airspeed * 360 / (1091 * 0.36 / airspeed) / 3600 / 2 / Math.PI;
                        const activateDistance = Math.pow(90 / absPathAngle, 1.6) * turnRadius * 1.2;
                        const planeCoordinates = new LatLong(SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
                        const distanceToActive = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, activeWaypoint.infos.coordinates);
                        if (distanceToActive < activateDistance) {
                            this.flightPlanManager.setActiveWaypointIndex(this.flightPlanManager.getActiveWaypointIndex() + 1);
                        }
                    }
                }
            }
            if (this.flightPlanManager.isLoadedApproach() && !this.flightPlanManager.isActiveApproach() && (this.flightPlanManager.getActiveWaypointIndex() === -1 || (this.flightPlanManager.getActiveWaypointIndex() > this.flightPlanManager.getLastIndexBeforeApproach()))) {
                if (SimVar.GetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number") !== 1) {
                    this.flightPlanManager.tryAutoActivateApproach();
                }
            }
            this.updateAutopilotCooldown = this._apCooldown;
        }
    }

    /**
     * Updates performance speeds such as GD, F, S, Vls and approach speeds
     */
    updatePerfSpeeds() {
        this.computedVgd = SimVar.GetSimVarValue("L:A32NX_SPEEDS_GD", "number");
        this.computedVfs = SimVar.GetSimVarValue("L:A32NX_SPEEDS_F", "number");
        this.computedVss = SimVar.GetSimVarValue("L:A32NX_SPEEDS_S", "number");
        this.computedVls = SimVar.GetSimVarValue("L:A32NX_SPEEDS_VLS", "number");

        let weight = this.tryEstimateLandingWeight();
        // Actual weight is used during approach phase (FCOM bulletin 46/2), and we also assume during go-around
        // We also fall back to current weight when landing weight is unavailable
        if (this.currentFlightPhase >= FmgcFlightPhases.APPROACH || !isFinite(weight)) {
            weight = SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") / 1000;
        }
        // if pilot has set approach wind in MCDU we use it, otherwise fall back to current measured wind
        if (isFinite(this.perfApprWindSpeed) && isFinite(this.perfApprWindHeading)) {
            this.approachSpeeds = new NXSpeedsApp(weight, this.perfApprFlaps3, this._towerHeadwind);
        } else {
            this.approachSpeeds = new NXSpeedsApp(weight, this.perfApprFlaps3);
        }
        this.approachSpeeds.valid = this.currentFlightPhase >= FmgcFlightPhases.APPROACH || isFinite(weight);
    }

    // updateGPSMessage is called every 250ms, only call addNewMessage when the status changed, anything else confuses the message system
    updateGPSMessage() {
        const currentAdirsStatus = SimVar.GetSimVarValue("L:A32NX_ADIRS_USES_GPS_AS_PRIMARY", "Bool");

        if (currentAdirsStatus !== this.previousAdirsStatus) {
            this.previousAdirsStatus = currentAdirsStatus;
            SimVar.SetSimVarValue("L:GPSPrimaryAcknowledged", "Bool", 0);

            this.addMessageToQueue(
                NXSystemMessages.gpsPrimary,
                () => !SimVar.GetSimVarValue("L:A32NX_ADIRS_USES_GPS_AS_PRIMARY", "Bool"),
                () => SimVar.SetSimVarValue("L:GPSPrimaryAcknowledged", "Bool", 1)
            );

            this.addMessageToQueue(
                NXSystemMessages.gpsPrimaryLost,
                () => SimVar.GetSimVarValue("L:A32NX_ADIRS_USES_GPS_AS_PRIMARY", "Bool")
            );
        }
    }

    updateDisplayedConstraints(force = false) {
        const fcuSelAlt = Simplane.getAutoPilotDisplayedAltitudeLockValue("feet");
        if (!force && fcuSelAlt === this.fcuSelAlt) {
            return;
        }
        this.fcuSelAlt = fcuSelAlt;
        this.constraintAlt = A32NX_ConstraintManager.getDisplayedConstraintAltitude(
            this.currentFlightPhase,
            this.fcuSelAlt,
            this.constraintAltCached
        );
        SimVar.SetSimVarValue("L:A32NX_AP_CSTN_ALT", "feet", this.constraintAlt);
    }

    updateConstraints() {
        this.constraintAltCached = A32NX_ConstraintManager.getConstraintAltitude(
            this.currentFlightPhase,
            this.flightPlanManager,
            this.constraintAltCached,
            this._cruiseFlightLevel * 100
        );
        this.updateDisplayedConstraints(true);
    }

    getSpeedConstraint() {
        if (this.flightPlanManager.getIsDirectTo()) {
            return Infinity;
        }
        const wpt = this.flightPlanManager.getActiveWaypoint();
        if (typeof wpt === 'undefined' || !isFinite(wpt.speedConstraint) || wpt.speedConstraint < 100) {
            return Infinity;
        }
        return wpt.speedConstraint;
    }

    getClbManagedSpeedFromCostIndex() {
        const dCI = (this.costIndex / 999) ** 2;
        return 290 * (1 - dCI) + 330 * dCI;
    }

    getCrzManagedSpeedFromCostIndex() {
        const dCI = (this.costIndex / 999) ** 2;
        return 290 * (1 - dCI) + 310 * dCI;
    }

    getDesManagedSpeedFromCostIndex() {
        const dCI = this.costIndex / 999;
        return 288 * (1 - dCI) + 300 * dCI;
    }

    getAppManagedSpeed() {
        switch (SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Number")) {
            case 0: return this.computedVgd;
            case 1: return this.computedVss;
            case 3: return this.perfApprFlaps3 ? this.getVApp() : this.computedVfs;
            case 4: return this.getVApp();
            default: return this.computedVfs;
        }
    }

    /* FMS EVENTS */

    onPowerOn() {
        super.onPowerOn();
        const gpsDriven = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
        if (!gpsDriven) {
            SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "Bool", 0);
        }
        this.initRadioNav(true);

        CDUPerformancePage.UpdateThrRedAccFromOrigin(this);
        CDUPerformancePage.UpdateThrRedAccFromDestination(this);

        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);

        this.taxiFuelWeight = 0.2;
        CDUInitPage.updateTowIfNeeded(this);
    }

    onEvent(_event) {
        if (_event === "MODE_SELECTED_ALTITUDE") {
            this.flightPhaseManager.handleFcuAltKnobPushPull();
            this._onStepClimbDescent();
        }
        if (_event === "MODE_MANAGED_ALTITUDE") {
            this.flightPhaseManager.handleFcuAltKnobPushPull();
            this._onStepClimbDescent();
        }
        if (_event === "AP_DEC_ALT" || _event === "AP_INC_ALT") {
            this.flightPhaseManager.handleFcuAltKnobTurn();
            this._onTrySetCruiseFlightLevel();
        }
        if (_event === "VS") {
            this.flightPhaseManager.handleFcuVSKnob();
        }
    }

    _onStepClimbDescent() {
        if (!(this.currentFlightPhase === FmgcFlightPhases.CLIMB || this.currentFlightPhase === FmgcFlightPhases.CRUISE)) {
            return;
        }

        const _targetFl = Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100;

        if (
            (this.currentFlightPhase === FmgcFlightPhases.CLIMB && _targetFl > this.cruiseFlightLevel) ||
            (this.currentFlightPhase === FmgcFlightPhases.CRUISE && _targetFl !== this.cruiseFlightLevel)
        ) {
            this.addMessageToQueue(NXSystemMessages.newCrzAlt.modifyMessage(_targetFl * 100));
            this.cruiseFlightLevel = _targetFl;
            this._cruiseFlightLevel = _targetFl;
        }
    }

    /***
     * Executed on every alt knob turn, checks whether or not the crz fl can be changed to the newly selected fcu altitude
     * It creates a timeout to simulate real life delay which resets every time the fcu knob alt increases or decreases.
     * @private
     */
    _onTrySetCruiseFlightLevel() {
        if (!(this.currentFlightPhase === FmgcFlightPhases.CLIMB || this.currentFlightPhase === FmgcFlightPhases.CRUISE)) {
            return;
        }

        const activeVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'enum');

        if ((activeVerticalMode >= 11 && activeVerticalMode <= 15) || (activeVerticalMode >= 21 && activeVerticalMode <= 23)) {
            const fcuFl = Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100;

            if (this.currentFlightPhase === FmgcFlightPhases.CLIMB && fcuFl > this.cruiseFlightLevel ||
                this.currentFlightPhase === FmgcFlightPhases.CRUISE && fcuFl !== this.cruiseFlightLevel
            ) {
                if (this.cruiseFlightLevelTimeOut) {
                    clearTimeout(this.cruiseFlightLevelTimeOut);
                    this.cruiseFlightLevelTimeOut = undefined;
                }

                this.cruiseFlightLevelTimeOut = setTimeout(() => {
                    if (fcuFl === Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100 &&
                        (
                            this.currentFlightPhase === FmgcFlightPhases.CLIMB && fcuFl > this.cruiseFlightLevel ||
                            this.currentFlightPhase === FmgcFlightPhases.CRUISE && fcuFl !== this.cruiseFlightLevel
                        )
                    ) {
                        this.addMessageToQueue(NXSystemMessages.newCrzAlt.modifyMessage(fcuFl * 100));
                        this.cruiseFlightLevel = fcuFl;
                        this._cruiseFlightLevel = fcuFl;
                        if (this.page.Current === this.page.ProgressPage) {
                            CDUProgressPage.ShowPage(this);
                        }
                    }
                }, 3000);
            }
        }
    }

    /* END OF FMS EVENTS */
    /* FMS CHECK ROUTINE */

    checkDestData() {
        this.addMessageToQueue(NXSystemMessages.enterDestData, () => {
            return isFinite(this.perfApprQNH) && isFinite(this.perfApprTemp) && isFinite(this.perfApprWindHeading) && isFinite(this.perfApprWindSpeed);
        });
    }

    /* END OF FMS CHECK ROUTINE */
    /* MCDU GET/SET METHODS */

    get cruiseFlightLevel() {
        return this._activeCruiseFlightLevel;
    }

    set cruiseFlightLevel(fl) {
        this._activeCruiseFlightLevel = Math.round(fl);
        SimVar.SetSimVarValue("L:AIRLINER_CRUISE_ALTITUDE", "number", this._activeCruiseFlightLevel * 100);
    }

    setCruiseFlightLevelAndTemperature(input, badInputCallback = () => {}, successCallback = () => {}) {
        if (input === FMCMainDisplay.clrValue) {
            this.cruiseFlightLevel = undefined;
            this._cruiseFlightLevel = undefined;
            this.cruiseTemperature = undefined;
            return successCallback();
        }
        const flString = input.split("/")[0].replace("FL", "");
        const tempString = input.split("/")[1];
        const onlyTemp = flString.length === 0;

        if (!!flString && !onlyTemp && this.trySetCruiseFl(parseFloat(flString), badInputCallback, () => true)) {
            if (SimVar.GetSimVarValue("L:A32NX_CRZ_ALT_SET_INITIAL", "bool") === 1 && SimVar.GetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool") === 1) {
                SimVar.SetSimVarValue("L:A32NX_NEW_CRZ_ALT", "number", this.cruiseFlightLevel);
            } else {
                SimVar.SetSimVarValue("L:A32NX_CRZ_ALT_SET_INITIAL", "bool", 1);
            }
            if (!tempString) {
                return successCallback();
            }
        }
        if (!!tempString) {
            const temp = parseInt(tempString.replace("M", "-"));
            console.log("tS: " + tempString);
            console.log("ti: " + temp);
            if (isFinite(temp) && this._cruiseEntered) {
                if (temp > -270 && temp < 100) {
                    this.cruiseTemperature = temp;
                    return successCallback();
                } else {
                    return badInputCallback(NXSystemMessages.entryOutOfRange);
                }
            } else {
                return badInputCallback(NXSystemMessages.notAllowed);
            }
        }
        return badInputCallback(NXSystemMessages.formatError);
    }

    tryUpdateCostIndex(costIndex, badInputCallback = () => {}, successCallback = () => {}) {
        const value = parseInt(costIndex);
        if (isFinite(value)) {
            if (value >= 0) {
                if (value < 1000) {
                    this.costIndexSet = true;
                    this.costIndex = value;
                    this.updateManagedSpeeds();
                    return successCallback();
                } else {
                    return badInputCallback(NXSystemMessages.entryOutOfRange);
                }
            }
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    /**
     * Any tropopause altitude up to 60,000 ft is able to be entered
     * @param {string} tropo Format: NNNN or NNNNN Leading 0’s must be included. Entry is rounded to the nearest 10 ft
     * @param {function} badInputCallback
     * @param {function} successCallback
     * @return {boolean} Whether tropopause could be set or not
     */
    tryUpdateTropo(tropo, badInputCallback = () => {}, successCallback = () => {}) {
        if (tropo === FMCMainDisplay.clrValue) {
            if (this.tropo) {
                this.tropo = "";
                return successCallback();
            }
            return badInputCallback(NXSystemMessages.notAllowed);
        }

        if (!tropo.match(/^(?=(\D*\d){4,5}\D*$)/g)) {
            return badInputCallback(NXSystemMessages.formatError);
        }

        const value = parseInt(tropo);
        if (isFinite(value) && value >= 0 && value <= 60000) {
            this.tropo = ("" + Math.round(value / 10) * 10).padStart(5, "0");
            return successCallback();
        }

        return badInputCallback(NXSystemMessages.entryOutOfRange);
    }

    ensureCurrentFlightPlanIsTemporary(callback = EmptyCallback.Boolean) {
        if (this.flightPlanManager.getCurrentFlightPlanIndex() === 0) {
            this.flightPlanManager.copyCurrentFlightPlanInto(1, () => {
                this.flightPlanManager.setCurrentFlightPlanIndex(1, (result) => {
                    SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 1);
                    SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 1);
                    callback(result);
                });
            });
        } else {
            callback(true);
        }
    }

    tryUpdateFromTo(fromTo, errorCallback, successCallback) {
        if (fromTo === FMCMainDisplay.clrValue) {
            return errorCallback(NXSystemMessages.notAllowed);
        }
        const from = fromTo.split("/")[0];
        const to = fromTo.split("/")[1];
        this.dataManager.GetAirportByIdent(from).then((airportFrom) => {
            if (airportFrom) {
                this.dataManager.GetAirportByIdent(to).then((airportTo) => {
                    if (airportTo) {
                        this.eraseTemporaryFlightPlan(() => {
                            this.flightPlanManager.clearFlightPlan(() => {
                                this.flightPlanManager.setOrigin(airportFrom.icao, () => {
                                    this.tmpOrigin = airportFrom.ident;
                                    this.flightPlanManager.setDestination(airportTo.icao, () => {
                                        this.aocAirportList.init(this.tmpOrigin, airportTo.ident);
                                        this.tmpOrigin = airportTo.ident;
                                        SimVar.SetSimVarValue("L:FLIGHTPLAN_USE_DECEL_WAYPOINT", "number", 1);
                                        successCallback();
                                    });
                                });
                            });
                        });
                    } else {
                        errorCallback(NXSystemMessages.notInDatabase);
                    }
                });
            } else {
                errorCallback(NXSystemMessages.notInDatabase);
            }
        });
    }

    /**
     * Computes distance between destination and alternate destination
     */
    tryUpdateDistanceToAlt() {
        this._DistanceToAlt = Avionics.Utils.computeGreatCircleDistance(
            this.flightPlanManager.getDestination().infos.coordinates,
            this.altDestination.infos.coordinates);
    }

    // only used by trySetRouteAlternateFuel
    isAltFuelInRange(fuel) {
        return 0 < fuel && fuel < (this.blockFuel - this._routeTripFuelWeight);
    }

    trySetRouteAlternateFuel(altFuel, badInputCallback, successCallback) {
        if (altFuel === FMCMainDisplay.clrValue) {
            this._routeAltFuelEntered = false;
            return successCallback();
        }
        if (!this.altDestination) {
            return badInputCallback(NXSystemMessages.notAllowed);
        }

        const value = NXUnits.userToKg(parseFloat(altFuel));
        if (isFinite(value)) {
            if (this.isAltFuelInRange(value)) {
                this._routeAltFuelEntered = true;
                this._routeAltFuelWeight = value;
                this._routeAltFuelTime = FMCMainDisplay.minutesTohhmm(A32NX_FuelPred.computeUserAltTime(this._routeAltFuelWeight * 1000, 290));
                return successCallback();
            } else {
                return badInputCallback(NXSystemMessages.entryOutOfRange);
            }
        }
        return badInputCallback(NXSystemMessages.formatError);
    }

    trySetMinDestFob(fuel, badInputCallback, successCallback) {
        if (fuel === FMCMainDisplay.clrValue) {
            this._minDestFobEntered = false;
            return successCallback();
        }
        if (!this.representsDecimalNumber(fuel)) {
            return badInputCallback(NXSystemMessages.formatError);
        }

        const value = NXUnits.userToKg(parseFloat(fuel));
        if (isFinite(value)) {
            if (this.isMinDestFobInRange(value)) {
                this._minDestFobEntered = true;
                if (value < this._minDestFob) {
                    this.addMessageToQueue(NXSystemMessages.checkMinDestFob);
                }
                this._minDestFob = value;
                return successCallback();
            } else {
                return badInputCallback(NXSystemMessages.entryOutOfRange);
            }
        }
        return badInputCallback(NXSystemMessages.formatError);
    }

    async tryUpdateAltDestination(altDestIdent, badInputCallback = () => {}, successCallback = () => {}) {
        if (altDestIdent === "NONE" || altDestIdent === FMCMainDisplay.clrValue) {
            this.altDestination = undefined;
            this._DistanceToAlt = 0;
            return successCallback();
        }
        const airportAltDest = await this.dataManager.GetAirportByIdent(altDestIdent);
        if (airportAltDest) {
            this.altDestination = airportAltDest;
            this.aocAirportList.alternate = altDestIdent;
            this.tryUpdateDistanceToAlt();
            return successCallback();
        }
        return badInputCallback(NXSystemMessages.notInDatabase);
    }

    /**
     * Updates the Fuel weight cell to tons. Uses a place holder FL120 for 30 min
     */
    tryUpdateRouteFinalFuel() {
        if (this._routeFinalFuelTime <= 0) {
            this._routeFinalFuelTime = this._defaultRouteFinalTime;
        }
        this._routeFinalFuelWeight = A32NX_FuelPred.computeHoldingTrackFF(this.zeroFuelWeight, 120) / 1000;
        this._rteFinalCoeffecient = A32NX_FuelPred.computeHoldingTrackFF(this.zeroFuelWeight, 120) / 30;
    }

    /**
     * Updates the alternate fuel and time values using a place holder FL of 330 until that can be set
     */
    tryUpdateRouteAlternate() {
        if (this._DistanceToAlt < 20) {
            this._routeAltFuelWeight = 0;
            this._routeAltFuelTime = 0;
        } else {
            const placeholderFl = 120;
            let airDistance = 0;
            if (this._windDir === this._windDirections.TAILWIND) {
                airDistance = A32NX_FuelPred.computeAirDistance(Math.round(this._DistanceToAlt), this.averageWind);
            } else if (this._windDir === this._windDirections.HEADWIND) {
                airDistance = A32NX_FuelPred.computeAirDistance(Math.round(this._DistanceToAlt), -this.averageWind);
            }

            const deviation = (this.zeroFuelWeight + this._routeFinalFuelWeight - A32NX_FuelPred.refWeight) * A32NX_FuelPred.computeNumbers(airDistance, placeholderFl, A32NX_FuelPred.computations.CORRECTIONS, true);
            if ((20 < airDistance && airDistance < 200) && (100 < placeholderFl && placeholderFl < 290)) { //This will always be true until we can setup alternate routes
                this._routeAltFuelWeight = (A32NX_FuelPred.computeNumbers(airDistance, placeholderFl, A32NX_FuelPred.computations.FUEL, true) + deviation) / 1000;
                this._routeAltFuelTime = A32NX_FuelPred.computeNumbers(airDistance, placeholderFl, A32NX_FuelPred.computations.TIME, true);
            }
        }
    }

    /**
     * Attempts to calculate trip information. Is dynamic in that it will use liveDistanceTo the destination rather than a
     * static distance. Works down to 20NM airDistance and FL100 Up to 3100NM airDistance and FL390, anything out of those ranges and values
     * won't be updated.
     */
    tryUpdateRouteTrip(dynamic = false) {
        let airDistance = 0;
        const groundDistance = dynamic ? this.flightPlanManager.getDestination().liveDistanceTo : this.flightPlanManager.getDestination().cumulativeDistanceInFP;
        if (this._windDir === this._windDirections.TAILWIND) {
            airDistance = A32NX_FuelPred.computeAirDistance(groundDistance, this.averageWind);
        } else if (this._windDir === this._windDirections.HEADWIND) {
            airDistance = A32NX_FuelPred.computeAirDistance(groundDistance, -this.averageWind);
        }

        let altToUse = this.cruiseFlightLevel;
        // Use the cruise level for calculations otherwise after cruise use descent altitude down to 10,000 feet.
        if (this.currentFlightPhase >= FmgcFlightPhases.DESCENT) {
            altToUse = SimVar.GetSimVarValue("PLANE ALTITUDE", 'Feet') / 100;
        }

        if ((20 <= airDistance && airDistance <= 3100) && (100 <= altToUse && altToUse <= 390)) {
            const deviation = (this.zeroFuelWeight + this._routeFinalFuelWeight + this._routeAltFuelWeight - A32NX_FuelPred.refWeight) * A32NX_FuelPred.computeNumbers(airDistance, altToUse, A32NX_FuelPred.computations.CORRECTIONS, false);

            this._routeTripFuelWeight = (A32NX_FuelPred.computeNumbers(airDistance, altToUse, A32NX_FuelPred.computations.FUEL, false) + deviation) / 1000;
            this._routeTripTime = A32NX_FuelPred.computeNumbers(airDistance, altToUse, A32NX_FuelPred.computations.TIME, false);
        }
    }

    tryUpdateMinDestFob() {
        this._minDestFob = this._routeAltFuelWeight + this.getRouteFinalFuelWeight();
    }

    tryUpdateTOW() {
        this.takeOffWeight = this.zeroFuelWeight + this.blockFuel - this.taxiFuelWeight;
    }

    tryUpdateLW() {
        this.landingWeight = this.takeOffWeight - this._routeTripFuelWeight;
    }

    /**
     * Computes extra fuel
     * @param {boolean}useFOB - States whether to use the FOB rather than block fuel when computing extra fuel
     * @returns {number}
     */
    tryGetExtraFuel(useFOB = false) {
        const isFlying = parseInt(SimVar.GetSimVarValue("GROUND VELOCITY", "knots")) > 30;

        if (useFOB) {
            return this.getFOB() - this.getTotalTripFuelCons() - this._minDestFob - this.taxiFuelWeight - (isFlying ? 0 : this.getRouteReservedWeight());
        } else {
            return this.blockFuel - this.getTotalTripFuelCons() - this._minDestFob - this.taxiFuelWeight - (isFlying ? 0 : this.getRouteReservedWeight());
        }
    }

    /**
     * EXPERIMENTAL
     * Attempts to calculate the extra time
     */
    tryGetExtraTime(useFOB = false) {
        if (this.tryGetExtraFuel(useFOB) <= 0) {
            return 0;
        }
        const tempWeight = this.getGW() - this._minDestFob;
        const tempFFCoefficient = A32NX_FuelPred.computeHoldingTrackFF(tempWeight, 180) / 30;
        return (this.tryGetExtraFuel(useFOB) * 1000) / tempFFCoefficient;
    }

    getRouteAltFuelWeight() {
        return this._routeAltFuelWeight;
    }

    getRouteAltFuelTime() {
        return this._routeAltFuelTime;
    }

    setOriginRunwayIndex(runwayIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.clearAutotunedIls();
            this.flightPlanManager.setDepartureProcIndex(-1, () => {
                this.flightPlanManager.setOriginRunwayIndex(runwayIndex, () => {
                    return callback(true);
                });
            });
        });
    }

    setRunwayIndex(runwayIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            const routeOriginInfo = this.flightPlanManager.getOrigin().infos;
            this.clearAutotunedIls();
            if (!this.flightPlanManager.getOrigin()) {
                // TODO: figure out if message output is needed
                this.setScratchpadMessage(NXFictionalMessages.noOriginSet);
                return callback(false);
            } else if (runwayIndex === -1) {
                this.flightPlanManager.setDepartureRunwayIndex(-1, () => {
                    this.flightPlanManager.setOriginRunwayIndex(-1, () => {
                        return callback(true);
                    });
                });
            } else if (routeOriginInfo instanceof AirportInfo) {
                if (routeOriginInfo.oneWayRunways[runwayIndex]) {
                    this.flightPlanManager.setDepartureRunwayIndex(runwayIndex, () => {
                        return callback(true);
                    });
                }
            } else {
                // TODO: figure out if message output is needed
                this.setScratchpadMessage(NXSystemMessages.notInDatabase);
                callback(false);
            }
        });
    }

    setDepartureIndex(departureIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            const currentRunway = this.flightPlanManager.getDepartureRunway();
            this.flightPlanManager.setDepartureProcIndex(departureIndex, () => {
                if (currentRunway) {
                    SimVar.SetSimVarValue("L:A32NX_DEPARTURE_ELEVATION", "feet", A32NX_Util.meterToFeet(currentRunway.elevation));
                    const departure = this.flightPlanManager.getDeparture();
                    const departureRunwayIndex = departure.runwayTransitions.findIndex(t => {
                        return t.name.indexOf(currentRunway.designation) !== -1;
                    });
                    if (departureRunwayIndex >= -1) {
                        return this.flightPlanManager.setDepartureRunwayIndex(departureRunwayIndex, () => {
                            return callback(true);
                        });
                    }
                }
                return callback(true);
            });
        });
    }

    setApproachTransitionIndex(transitionIndex, callback = EmptyCallback.Boolean) {
        const arrivalIndex = this.flightPlanManager.getArrivalProcIndex();
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setApproachTransitionIndex(transitionIndex, () => {
                this.flightPlanManager.setArrivalProcIndex(arrivalIndex, () => {
                    callback(true);
                });
            });
        });
    }

    setArrivalProcIndex(arrivalIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setArrivalProcIndex(arrivalIndex, () => {
                callback(true);
            });
        });
    }

    setArrivalIndex(arrivalIndex, transitionIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setArrivalEnRouteTransitionIndex(transitionIndex, () => {
                this.flightPlanManager.setArrivalProcIndex(arrivalIndex, () => {
                    callback(true);
                });
            });
        });
    }

    setApproachIndex(approachIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setApproachIndex(approachIndex, () => {
                const approach = this.flightPlanManager.getApproach();
                if (approach) {
                    const runway = this.flightPlanManager.getApproachRunway();
                    if (runway) {
                        SimVar.SetSimVarValue("L:A32NX_PRESS_AUTO_LANDING_ELEVATION", "feet", A32NX_Util.meterToFeet(runway.elevation));
                    }
                }
                this.clearAutotunedIls();
                callback(true);
            });
        });
    }

    async tuneIlsFromApproach(appr) {
        const finalLeg = appr.wayPoints[appr.wayPoints.length - 1];
        const ilsIcao = finalLeg.originIcao.trim();
        if (ilsIcao.length > 0) {
            try {
                const ils = await this.facilityLoader.getFacility(ilsIcao);
                if (ils.infos.frequencyMHz > 1) {
                    console.log('Auto-tuning ILS', ils);
                    this.connectIlsFrequency(ils.infos.frequencyMHz);
                    this.ilsAutoIdent = ils.infos.ident;
                    this.ilsAutoCourse = finalLeg.bearingInFP;
                    this.ilsAutoTuned = true;
                    if (this.currentFlightPhase > FmgcFlightPhases.TAKEOFF) {
                        this.ilsApproachAutoTuned = true;
                    } else {
                        this.ilsTakeoffAutoTuned = true;
                    }
                    return true;
                }
            } catch (error) {
                console.log('tuneIlsFromApproach', error);
                return false;
            }
        }
        return false;
    }

    clearAutotunedIls() {
        this.ilsAutoTuned = false;
        this.ilsApproachAutoTuned = false;
        this.ilsTakeoffAutoTuned = false;
        this.ilsAutoIdent = "";
        this.ilsAutoCourse = 0;
    }

    async updateIls() {
        if (this._ilsFrequencyPilotEntered) {
            return;
        }

        let airport;
        let runway;

        if (this.currentFlightPhase > FmgcFlightPhases.TAKEOFF) {
            if (this.ilsApproachAutoTuned) {
                return;
            }
            this.ilsAutoTuned = false;
            // for unknown reasons, the approach returned here doesn't have the approach waypoints which we need
            const appr = this.flightPlanManager.getApproach();
            if (appr.name.indexOf('ILS') === -1 && appr.name.indexOf('LOC') === -1) {
                return;
            }
            airport = this.flightPlanManager.getDestination();
            runway = this.flightPlanManager.getApproachRunway();

            const planeLla = new LatLongAlt(
                SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"),
                SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude")
            );
            const runwayDistance = Avionics.Utils.computeGreatCircleDistance(planeLla, runway.beginningCoordinates);
            if (runwayDistance > 300) {
                return;
            }
        } else {
            if (this.ilsTakeoffAutoTuned) {
                return;
            }
            this.ilsAutoTuned = false;
            airport = this.flightPlanManager.getOrigin();
            runway = this.flightPlanManager.getDepartureRunway();
        }

        // If the airport has correct navdata, the ILS will be listed as the reference navaid (originIcao in MSFS land) on at least the last leg of the
        // ILS approach procedure(s). Tuning this way gives us the ident, and the course
        if (airport && airport.infos && runway) {
            for (let i = 0; i < airport.infos.approaches.length && !this.ilsAutoTuned; i++) {
                const appr = airport.infos.approaches[i];
                // L(eft), C(entre), R(ight), T(true North) are the possible runway designators (ARINC424)
                // If there are multiple procedures for the same type of approach, an alphanumeric suffix is added to their names (last subpattern)
                // We are a little more lenient than ARINC424 in an effort to match non-perfect navdata, so we allow dashes, spaces, or nothing before the suffix
                const match = appr.name.trim().match(/^(ILS|LOC) (RW)?([0-9]{1,2}[LCRT]?)([\s\-]*[A-Z0-9])?$/);
                if (
                    match !== null
                    && Avionics.Utils.formatRunway(match[3]) === Avionics.Utils.formatRunway(runway.designation)
                    && appr.wayPoints.length > 0
                ) {
                    await this.tuneIlsFromApproach(appr);
                }
            }
        }
    }

    updateFlightNo(flightNo, badInputCallback, successCallback) {
        if (flightNo.length > 7) {
            return badInputCallback(NXSystemMessages.notAllowed);
        }

        this.flightNumber = flightNo;

        SimVar.SetSimVarValue("ATC FLIGHT NUMBER", "string", flightNo, "FMC").then(() => {
            NXApi.connectTelex(flightNo)
                .then(() => {
                    return successCallback();
                })
                .catch((err) => {
                    if (err !== NXApi.disabledError) {
                        return badInputCallback(NXFictionalMessages.fltNbrInUse);
                    }

                    return successCallback();
                });
        });
    }

    updateCoRoute(coRoute, badInputCallback, successCallback) {
        if (coRoute.length > 2) {
            if (coRoute.length < 10) {
                if (coRoute === "NONE") {
                    this.coRoute = undefined;
                } else {
                    this.coRoute = coRoute;
                }
                return successCallback();
            }
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    getTotalTripTime() {
        return this._routeTripTime;
    }

    getTotalTripFuelCons() {
        return this._routeTripFuelWeight;
    }

    _getOrSelectWaypoints(getter, ident, callback) {
        getter(ident).then((waypoints) => {
            if (waypoints.length === 0) {
                return callback(undefined);
            }
            if (waypoints.length === 1) {
                return callback(waypoints[0]);
            }
            A320_Neo_CDU_SelectWptPage.ShowPage(this, waypoints, callback);
        });
    }

    getOrSelectVORsByIdent(ident, callback) {
        this._getOrSelectWaypoints(this.dataManager.GetVORsByIdent.bind(this.dataManager), ident, callback);
    }
    getOrSelectNDBsByIdent(ident, callback) {
        this._getOrSelectWaypoints(this.dataManager.GetNDBsByIdent.bind(this.dataManager), ident, callback);
    }

    getOrSelectWaypointByIdent(ident, callback) {
        this._getOrSelectWaypoints(this.dataManager.GetWaypointsByIdent.bind(this.dataManager), ident, callback);
    }

    insertWaypoint(newWaypointTo, index, badInputCallback, successCallback) {
        this.ensureCurrentFlightPlanIsTemporary(async () => {
            this.getOrSelectWaypointByIdent(newWaypointTo, (waypoint) => {
                if (!waypoint) {
                    return badInputCallback(NXSystemMessages.notInDatabase);
                }
                this.flightPlanManager.addWaypoint(waypoint.icao, index, () => {
                    return successCallback();
                });
            });
        });
    }

    activateDirectToWaypoint(waypoint, callback = EmptyCallback.Void) {
        const waypoints = this.flightPlanManager.getWaypoints();
        const indexInFlightPlan = waypoints.findIndex(w => {
            return w.icao === waypoint.icao;
        });
        let i = 1;
        const removeWaypointMethod = (callback = EmptyCallback.Void) => {
            if (i < indexInFlightPlan) {
                this.flightPlanManager.removeWaypoint(1, i === indexInFlightPlan - 1, () => {
                    i++;
                    removeWaypointMethod(callback);
                });
            } else {
                callback();
            }
        };
        removeWaypointMethod(() => {
            this.flightPlanManager.activateDirectTo(waypoint.infos.icao, callback);
        });
    }

    async insertWaypointsAlongAirway(lastWaypointIdent, index, airwayName, badInputCallback, successCallback) {
        const referenceWaypoint = this.flightPlanManager.getWaypoint(index - 1);
        const lastWaypointIdentPadEnd = lastWaypointIdent.padEnd(5, " ");
        if (referenceWaypoint) {
            const infos = referenceWaypoint.infos;
            if (infos instanceof WayPointInfo) {
                await referenceWaypoint.infos.UpdateAirway(airwayName); // Sometimes the waypoint is initialized without waiting to the airways array to be filled
                const airway = infos.airways.find(a => {
                    return a.name === airwayName;
                });
                if (airway) {
                    const firstIndex = airway.icaos.indexOf(referenceWaypoint.icao);
                    const lastWaypointIcao = airway.icaos.find(icao => icao.substring(7, 12) === lastWaypointIdentPadEnd);
                    const lastIndex = airway.icaos.indexOf(lastWaypointIcao);
                    if (firstIndex >= 0) {
                        if (lastIndex >= 0) {
                            let inc = 1;
                            if (lastIndex < firstIndex) {
                                inc = -1;
                            }
                            index -= 1;
                            const count = Math.abs(lastIndex - firstIndex);
                            for (let i = 1; i < count + 1; i++) { // 9 -> 6
                                const syncInsertWaypointByIcao = async (icao, idx) => {
                                    return new Promise(resolve => {
                                        console.log("add icao:" + icao + " @ " + idx);
                                        this.flightPlanManager.addWaypoint(icao, idx, () => {
                                            const waypoint = this.flightPlanManager.getWaypoint(idx);
                                            waypoint.infos.airwayIn = airwayName;
                                            if (i < count) {
                                                waypoint.infos.airwayOut = airwayName;
                                            }
                                            console.log("icao:" + icao + " added");
                                            resolve();
                                        });
                                    });
                                };

                                await syncInsertWaypointByIcao(airway.icaos[firstIndex + i * inc], index + i);
                            }
                            return successCallback();
                        }
                        return badInputCallback();
                    }
                    return badInputCallback();
                }
                return badInputCallback();
            }
            return badInputCallback();
        }
        return badInputCallback();
    }

    // Copy airway selections from temporary to active flightplan
    async copyAirwaySelections() {
        const temporaryFPWaypoints = this.flightPlanManager.getWaypoints(1);
        const activeFPWaypoints = this.flightPlanManager.getWaypoints(0);
        for (let i = 0; i < activeFPWaypoints.length; i++) {
            if (activeFPWaypoints[i].infos && temporaryFPWaypoints[i] && activeFPWaypoints[i].icao === temporaryFPWaypoints[i].icao && temporaryFPWaypoints[i].infos) {
                activeFPWaypoints[i].infos.airwayIn = temporaryFPWaypoints[i].infos.airwayIn;
                activeFPWaypoints[i].infos.airwayOut = temporaryFPWaypoints[i].infos.airwayOut;
            }
        }
    }

    removeWaypoint(index, callback = EmptyCallback.Void) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.removeWaypoint(index, true, callback);
        });
    }

    eraseTemporaryFlightPlan(callback = EmptyCallback.Void) {
        this.flightPlanManager.setCurrentFlightPlanIndex(0, () => {
            SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 0);
            SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 0);
            callback();
        });
    }

    insertTemporaryFlightPlan(callback = EmptyCallback.Void) {
        if (this.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            this.flightPlanManager.copyCurrentFlightPlanInto(0, () => {
                this.flightPlanManager.setCurrentFlightPlanIndex(0, () => {
                    SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 0);
                    SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 0);
                    callback();
                });
            });
        }
    }

    vSpeedDisagreeCheck() {
        this.addMessageToQueue(NXSystemMessages.vToDisagree);
    }

    //Needs PR Merge #3082
    trySetV1Speed(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            return badInputCallback(NXSystemMessages.notAllowed);
        }
        const v = parseInt(s);
        if (!isFinite(v) || !/^\d{2,3}$/.test(s)) {
            return badInputCallback(NXSystemMessages.formatError);
        }
        if (v < 90 || v > 350) {
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }
        this.removeMessageFromQueue(NXSystemMessages.checkToData.text);
        this._v1Checked = true;
        this.v1Speed = v;
        SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", this.v1Speed).then(() => {
            this.vSpeedDisagreeCheck();
        });
        return successCallback();
    }

    //Needs PR Merge #3082
    trySetVRSpeed(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            return badInputCallback(NXSystemMessages.notAllowed);
        }
        const v = parseInt(s);
        if (!isFinite(v) || !/^\d{2,3}$/.test(s)) {
            return badInputCallback(NXSystemMessages.formatError);
        }
        if (v < 90 || v > 350) {
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }
        this.removeMessageFromQueue(NXSystemMessages.checkToData.text);
        this._vRChecked = true;
        this.vRSpeed = v;
        SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", this.vRSpeed).then(() => {
            this.vSpeedDisagreeCheck();
        });
        return successCallback();
    }

    //Needs PR Merge #3082
    trySetV2Speed(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            return badInputCallback(NXSystemMessages.notAllowed);
        }
        const v = parseInt(s);
        if (!isFinite(v) || !/^\d{2,3}$/.test(s)) {
            return badInputCallback(NXSystemMessages.formatError);
        }
        if (v < 90 || v > 350) {
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }
        this.removeMessageFromQueue(NXSystemMessages.checkToData.text);
        this._v2Checked = true;
        this.v2Speed = v;
        SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", this.v2Speed).then(() => {
            this.vSpeedDisagreeCheck();
        });
        return successCallback();
    }

    trySetTakeOffTransAltitude(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            // TODO when possible fetch default from database
            this.transitionAltitude = this.transitionAltitudeIsPilotEntered ? 10000 : NaN;
            this.transitionAltitudeIsPilotEntered = false;
            SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", 0);
            return successCallback();
        }

        let value = parseInt(s);
        if (!isFinite(value) || !/^\d{4,5}$/.test(s)) {
            return badInputCallback(NXSystemMessages.formatError);
        }

        value = Math.round(value / 10) * 10;
        if (value < 1000 || value > 45000) {
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }

        this.transitionAltitude = value;
        this.transitionAltitudeIsPilotEntered = true;
        SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", value);
        return successCallback();
    }

    //Needs PR Merge #3082
    trySetThrustReductionAccelerationAltitude(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this.thrustReductionAltitudeIsPilotEntered = false;
            this.accelerationAltitudeIsPilotEntered = false;
            CDUPerformancePage.UpdateThrRedAccFromOrigin(this, true, true);
            return successCallback();
        }

        const origin = this.flightPlanManager.getOrigin();
        const elevation = origin ? origin.altitudeinFP : 0;
        const minimumAltitude = elevation + 400;

        let newThrRedAlt = null;
        let newAccAlt = null;

        let [thrRedAlt, accAlt] = s.split("/");

        if (thrRedAlt && thrRedAlt.length > 0) {
            if (!/^\d{3,5}$/.test(thrRedAlt)) {
                return badInputCallback(NXSystemMessages.formatError);
            }

            thrRedAlt = parseInt(thrRedAlt);
            thrRedAlt = Math.round(thrRedAlt / 10) * 10;
            if (thrRedAlt < minimumAltitude || thrRedAlt > 45000) {
                return badInputCallback(NXSystemMessages.entryOutOfRange);
            }

            newThrRedAlt = thrRedAlt;
        }

        if (accAlt && accAlt.length > 0) {
            if (!/^\d{3,5}$/.test(accAlt)) {
                return badInputCallback(NXSystemMessages.formatError);
            }

            accAlt = parseInt(accAlt);
            accAlt = Math.round(accAlt / 10) * 10;
            if (accAlt < minimumAltitude || accAlt > 45000) {
                return badInputCallback(NXSystemMessages.entryOutOfRange);
            }

            newAccAlt = accAlt;
        }

        if (newThrRedAlt !== null) {
            this.thrustReductionAltitude = newThrRedAlt;
            this.thrustReductionAltitudeIsPilotEntered = true;
            SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT", "Number", newThrRedAlt);
        }
        if (newAccAlt !== null) {
            this.accelerationAltitude = newAccAlt;
            this.accelerationAltitudeIsPilotEntered = true;
            SimVar.SetSimVarValue("L:AIRLINER_ACC_ALT", "Number", newAccAlt);
        }
        return successCallback();
    }

    trySetEngineOutAcceleration(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this.engineOutAccelerationAltitudeIsPilotEntered = false;
            CDUPerformancePage.UpdateEngOutAccFromOrigin(this);
            return successCallback();
        }

        if (!/^\d{3,5}$/.test(s)) {
            return badInputCallback(NXSystemMessages.formatError);
        }

        const origin = this.flightPlanManager.getOrigin();
        const elevation = origin ? origin.altitudeinFP : 0;
        const minimumAltitude = elevation + 400;

        let engineOutAccAlt = parseInt(s);
        engineOutAccAlt = Math.round(engineOutAccAlt / 10) * 10;
        if (engineOutAccAlt < minimumAltitude || engineOutAccAlt > 45000) {
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }

        this.engineOutAccelerationAltitude = engineOutAccAlt;
        this.engineOutAccelerationAltitudeIsPilotEntered = true;
        SimVar.SetSimVarValue("L:A32NX_ENG_OUT_ACC_ALT", "feet", engineOutAccAlt);
        return successCallback();
    }

    //Needs PR Merge #3082
    trySetThrustReductionAccelerationAltitudeGoaround(s, badInputCallback, successCallback) {
        let thrRed = NaN;
        let accAlt = NaN;
        if (s) {
            const sSplit = s.split("/");
            thrRed = parseInt(sSplit[0]);
            accAlt = parseInt(sSplit[1]);
        }
        if ((isFinite(thrRed) || isFinite(accAlt)) && thrRed <= accAlt) {
            if (isFinite(thrRed)) {
                this.thrustReductionAltitudeGoaround = thrRed;
                SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT_GOAROUND", "Number", this.thrustReductionAltitudeGoaround);
            }
            if (isFinite(accAlt)) {
                this.accelerationAltitudeGoaround = accAlt;
                SimVar.SetSimVarValue("L:AIRLINER_ACC_ALT_GOAROUND", "Number", this.accelerationAltitudeGoaround);
            }
            return successCallback();
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    trySetengineOutAccelerationAltitudeGoaround(s, badInputCallback, successCallback) {
        const engOutAcc = parseInt(s);
        if (isFinite(engOutAcc)) {
            this.engineOutAccelerationAltitudeGoaround = engOutAcc;
            SimVar.SetSimVarValue("L:AIRLINER_ENG_OUT_ACC_ALT_GOAROUND", "Number", this.engineOutAccelerationAltitudeGoaround);
            return successCallback();
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    //Needs PR Merge #3082
    //TODO: with FADEC no longer needed
    setPerfTOFlexTemp(s, badInputCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfTOTemp = NaN;
            // In future we probably want a better way of checking this, as 0 is
            // in the valid flex temperature range (-99 to 99).
            SimVar.SetSimVarValue("L:AIRLINER_TO_FLEX_TEMP", "Number", 0);
            return true;
        }
        let value = parseInt(s);
        if (!isFinite(value) || !/^[+\-]?\d{1,2}$/.test(s)) {
            badInputCallback(NXSystemMessages.formatError);
            return false;
        }
        if (value < -99 || value > 99) {
            badInputCallback(NXSystemMessages.entryOutOfRange);
            return false;
        }
        // As the sim uses 0 as a sentinel value to detect that no flex
        // temperature is set, we'll just use 0.1 as the actual value for flex 0
        // and make sure we never display it with decimals.
        if (value === 0) {
            value = 0.1;
        }
        this.perfTOTemp = value;
        SimVar.SetSimVarValue("L:AIRLINER_TO_FLEX_TEMP", "Number", value);
        return true;
    }

    /**
     * Attempts to predict required block fuel for trip
     * @returns {boolean}
     */
    //TODO: maybe make this part of an update routine?
    tryFuelPlanning() {
        if (this._fuelPlanningPhase === this._fuelPlanningPhases.IN_PROGRESS) {
            this._blockFuelEntered = true;
            this._fuelPlanningPhase = this._fuelPlanningPhases.COMPLETED;
            return true;
        }
        const tempRouteFinalFuelTime = this._routeFinalFuelTime;
        this.tryUpdateRouteFinalFuel();
        this.tryUpdateRouteAlternate();
        this.tryUpdateRouteTrip();

        this._routeFinalFuelTime = tempRouteFinalFuelTime;
        this._routeFinalFuelWeight = (this._routeFinalFuelTime * this._rteFinalCoeffecient) / 1000;

        this.tryUpdateMinDestFob();

        this.blockFuel = this.getTotalTripFuelCons() + this._minDestFob + this.taxiFuelWeight + this.getRouteReservedWeight();
        this._fuelPlanningPhase = this._fuelPlanningPhases.IN_PROGRESS;
        return true;
    }

    trySetTaxiFuelWeight(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this.taxiFuelWeight = this._defaultTaxiFuelWeight;
            this._taxiEntered = false;
            return successCallback();
        }
        if (!this.representsDecimalNumber(s)) {
            badInputCallback(NXSystemMessages.formatError);
            return false;
        }
        const value = NXUnits.userToKg(parseFloat(s));
        if (isFinite(value)) {
            if (this.isTaxiFuelInRange(value)) {
                this._taxiEntered = true;
                this.taxiFuelWeight = value;
                return successCallback();
            } else {
                return badInputCallback(NXSystemMessages.entryOutOfRange);
            }
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    getRouteFinalFuelWeight() {
        if (isFinite(this._routeFinalFuelWeight)) {
            this._routeFinalFuelWeight = (this._routeFinalFuelTime * this._rteFinalCoeffecient) / 1000;
            return this._routeFinalFuelWeight;
        }
    }

    getRouteFinalFuelTime() {
        return this._routeFinalFuelTime;
    }

    /**
     * This method is used to set initial Final Time for when INIT B is making predictions
     * @param {String} s - containing time value
     * @param {function} badInputCallback
     * @param {function} successCallback
     * @returns {boolean}
     */
    trySetRouteFinalTime(s, badInputCallback, successCallback) {
        if (s) {
            if (s === FMCMainDisplay.clrValue) {
                this._routeFinalFuelTime = this._routeFinalFuelTimeDefault;
                this._rteFinalWeightEntered = false;
                this._rteFinalTimeEntered = false;
                return successCallback();
            }
            // Time entry must start with '/'
            if (s.startsWith("/")) {
                const rteFinalTime = s.slice(1);

                if (!/^\d{1,4}$/.test(rteFinalTime)) {
                    return badInputCallback(NXSystemMessages.formatError);
                }

                if (this.isFinalTimeInRange(rteFinalTime)) {
                    this._rteFinalWeightEntered = false;
                    this._rteFinalTimeEntered = true;
                    this._routeFinalFuelTime = FMCMainDisplay.hhmmToMinutes(rteFinalTime.padStart(4,"0"));
                    return successCallback();
                } else {
                    return badInputCallback(NXSystemMessages.entryOutOfRange);
                }
            }
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    /**
     *
     * @param {string} s
     * @param {function} badInputCallback
     * @param {function} successCallback
     * @returns {boolean}
     */
    trySetRouteFinalFuel(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this._routeFinalFuelTime = this._routeFinalFuelTimeDefault;
            this._rteFinalWeightEntered = false;
            this._rteFinalTimeEntered = false;
            return successCallback();
        }
        if (s) {
            // Time entry must start with '/'
            if (s.startsWith("/")) {
                return this.trySetRouteFinalTime(s, badInputCallback, successCallback);
            } else {
                // If not time, try to parse as weight
                // Weight can be entered with optional trailing slash, if so remove it before parsing the value
                const enteredValue = s.endsWith("/") ? s.slice(0, -1) : s;

                if (!this.representsDecimalNumber(enteredValue)) {
                    return badInputCallback(NXSystemMessages.formatError);
                }

                const rteFinalWeight = NXUnits.userToKg(parseFloat(enteredValue));

                if (this.isFinalFuelInRange(rteFinalWeight)) {
                    this._rteFinalWeightEntered = true;
                    this._rteFinalTimeEntered = false;
                    this._routeFinalFuelWeight = rteFinalWeight;
                    this._routeFinalFuelTime = (rteFinalWeight * 1000) / this._rteFinalCoeffecient;
                    return successCallback();
                } else {
                    return badInputCallback(NXSystemMessages.entryOutOfRange);
                }
            }
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    getRouteReservedWeight() {
        if (!this.routeReservedEntered() && (this._rteFinalCoeffecient !== 0)) {
            const fivePercentWeight = this._routeReservedPercent * this._routeTripFuelWeight / 100;
            const fiveMinuteHoldingWeight = (5 * this._rteFinalCoeffecient) / 1000;

            return fivePercentWeight > fiveMinuteHoldingWeight ? fivePercentWeight : fiveMinuteHoldingWeight;
        }
        if (isFinite(this._routeReservedWeight) && this._routeReservedWeight !== 0) {
            return this._routeReservedWeight;
        } else {
            return this._routeReservedPercent * this._routeTripFuelWeight / 100;
        }
    }

    getRouteReservedPercent() {
        if (isFinite(this._routeReservedWeight) && isFinite(this.blockFuel) && this._routeReservedWeight !== 0) {
            return this._routeReservedWeight / this._routeTripFuelWeight * 100;
        }
        return this._routeReservedPercent;
    }

    trySetRouteReservedPercent(s, badInputCallback, successCallback) {
        if (s) {
            if (s === FMCMainDisplay.clrValue) {
                this._rteReservedWeightEntered = false;
                this._rteReservedPctEntered = false;
                this._routeReservedWeight = 0;
                this._routeReservedPercent = 5;
                this._rteRsvPercentOOR = false;
                return successCallback();
            }
            // Percentage entry must start with '/'
            if (s.startsWith("/")) {
                const enteredValue = s.slice(1);

                if (!this.representsDecimalNumber(enteredValue)) {
                    return badInputCallback(NXSystemMessages.formatError);
                }

                const rteRsvPercent = parseFloat(enteredValue);

                if (!this.isRteRsvPercentInRange(rteRsvPercent)) {
                    return badInputCallback(NXSystemMessages.entryOutOfRange);
                }

                this._rteRsvPercentOOR = false;
                this._rteReservedPctEntered = true;
                this._rteReservedWeightEntered = false;

                if (isFinite(rteRsvPercent)) {
                    this._routeReservedWeight = NaN;
                    this._routeReservedPercent = rteRsvPercent;
                    return successCallback();
                }
            }
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    /**
     * Checks input and passes to trySetCruiseFl()
     * @param input
     * @param badInputCallback
     * @param successCallback
     * @returns {boolean} input passed checks
     */
    trySetCruiseFlCheckInput(input, badInputCallback, successCallback) {
        if (input === FMCMainDisplay.clrValue) {
            return badInputCallback(NXSystemMessages.notAllowed);
        }
        const flString = input.replace("FL", "");
        if (!flString) {
            return badInputCallback(NXSystemMessages.notAllowed);
        }
        this.trySetCruiseFl(parseFloat(flString), badInputCallback, successCallback);
    }

    /**
     * Sets new Cruise FL if all conditions good
     * @param fl {number} Altitude or FL
     * @param badInputCallback {function}
     * @param successCallback
     * @returns {boolean} input passed checks
     */
    trySetCruiseFl(fl, badInputCallback, successCallback) {
        if (!isFinite(fl)) {
            return badInputCallback(NXSystemMessages.notAllowed);
        }
        if (fl >= 1000) {
            fl = Math.floor(fl / 100);
        }
        if (fl > this.maxCruiseFL) {
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }
        const phase = this.currentFlightPhase;
        const selFl = Math.floor(Math.max(0, Simplane.getAutoPilotDisplayedAltitudeLockValue("feet")) / 100);
        if (fl < selFl && (phase === FmgcFlightPhases.CLIMB || phase === FmgcFlightPhases.APPROACH || phase === FmgcFlightPhases.GOAROUND)) {
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }

        if (fl <= 0 || fl > this.maxCruiseFL) {
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }

        this.cruiseFlightLevel = fl;
        this._cruiseFlightLevel = fl;
        this._cruiseEntered = true;
        this._activeCruiseFlightLevelDefaulToFcu = false;
        this.cruiseTemperature = undefined;
        this.updateConstraints();

        const acFl = Math.floor(Simplane.getAltitude() / 100);

        if (acFl > fl && (phase === FmgcFlightPhases.CLIMB || phase === FmgcFlightPhases.DESCENT || phase === FmgcFlightPhases.APPROACH)) {
            this.flightPhaseManager.changeFlightPhase(FmgcFlightPhases.CRUISE);
        } else if (acFl < fl && (phase === FmgcFlightPhases.DESCENT || phase === FmgcFlightPhases.APPROACH)) {
            this.flightPhaseManager.changeFlightPhase(FmgcFlightPhases.CLIMB);
        }

        return successCallback();
    }

    trySetRouteReservedFuel(s, badInputCallback, successCallback) {
        if (s) {
            if (s === FMCMainDisplay.clrValue) {
                this._rteReservedWeightEntered = false;
                this._rteReservedPctEntered = false;
                this._routeReservedWeight = 0;
                this._routeReservedPercent = 5;
                this._rteRsvPercentOOR = false;
                return successCallback();
            }
            // Percentage entry must start with '/'
            if (s.startsWith("/")) {
                return this.trySetRouteReservedPercent(s, badInputCallback, successCallback);
            } else {
                // If not percentage, try to parse as weight
                // Weight can be entered with optional trailing slash, if so remove it before parsing the value
                const enteredValue = s.endsWith("/") ? s.slice(0, -1) : s;

                if (!this.representsDecimalNumber(enteredValue)) {
                    return badInputCallback(NXSystemMessages.formatError);
                }

                const rteRsvWeight = NXUnits.userToKg(parseFloat(enteredValue));

                if (!this.isRteRsvFuelInRange(rteRsvWeight)) {
                    return badInputCallback(NXSystemMessages.entryOutOfRange);
                }

                this._rteReservedWeightEntered = true;
                this._rteReservedPctEntered = false;

                if (isFinite(rteRsvWeight)) {
                    this._routeReservedWeight = rteRsvWeight;
                    this._routeReservedPercent = 0;

                    if (!this.isRteRsvPercentInRange(this.getRouteReservedPercent())) { // Bit of a hacky method due previous tight coupling of weight and percentage calculations
                        this._rteRsvPercentOOR = true;
                    }

                    return successCallback();
                }
            }
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    trySetZeroFuelWeightZFWCG(s, badInputCallback, successCallback) {
        if (s) {
            if (s.includes("/")) {
                const sSplit = s.split("/");
                const zfw = NXUnits.userToKg(parseFloat(sSplit[0]));
                const zfwcg = parseFloat(sSplit[1]);
                if (isFinite(zfw) && isFinite(zfwcg)) {
                    if (this.isZFWInRange(zfw) && this.isZFWCGInRange(zfwcg)) {
                        this._zeroFuelWeightZFWCGEntered = true;
                        this.zeroFuelWeight = zfw;
                        this.zeroFuelWeightMassCenter = zfwcg;
                        return successCallback();
                    }
                    return badInputCallback(NXSystemMessages.entryOutOfRange);
                }
                if (!this._zeroFuelWeightZFWCGEntered) {
                    return badInputCallback(NXSystemMessages.notAllowed);
                }
                if (this.isZFWInRange(zfw)) {
                    this.zeroFuelWeight = zfw;
                    return successCallback();
                }
                if (this.isZFWCGInRange(zfwcg)) {
                    this.zeroFuelWeightMassCenter = zfwcg;
                    return successCallback();
                }
                return badInputCallback(NXSystemMessages.entryOutOfRange);
            }
            if (!this._zeroFuelWeightZFWCGEntered) {
                return badInputCallback(NXSystemMessages.notAllowed);
            }
            const zfw = NXUnits.userToKg(parseFloat(s));
            if (this.isZFWInRange(zfw)) {
                this.zeroFuelWeight = zfw;
                return successCallback();
            }
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }
        return badInputCallback(NXSystemMessages.formatError);
    }

    /**
     *
     * @returns {number} Returns estimated fuel on board when arriving at the destination
     */
    getDestEFOB(useFOB = false) {
        return (useFOB ? this.getFOB() : this.blockFuel) - this._routeTripFuelWeight - this.taxiFuelWeight;
    }

    /**
     * @returns {number} Returns EFOB when arriving at the alternate dest
     */
    getAltEFOB(useFOB = false) {
        return this.getDestEFOB(useFOB) - this._routeAltFuelWeight;
    }

    trySetBlockFuel(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this.blockFuel = 0.0;
            this._blockFuelEntered = false;
            this._fuelPredDone = false;
            this._fuelPlanningPhase = this._fuelPlanningPhases.PLANNING;
            return successCallback();
        }
        const value = NXUnits.userToKg(parseFloat(s));
        if (isFinite(value) && this.isBlockFuelInRange(value)) {
            if (this.isBlockFuelInRange(value)) {
                this.blockFuel = value;
                this._blockFuelEntered = true;
                return successCallback();
            } else {
                return badInputCallback(NXSystemMessages.entryOutOfRange);
            }
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    trySetAverageWind(s, badInputCallback, successCallback) {
        const validDelims = ["TL", "T", "+", "HD", "H", "-"];
        const matchedIndex = validDelims.findIndex(element => s.startsWith(element));
        const digits = matchedIndex >= 0 ? s.replace(validDelims[matchedIndex], "") : s;
        const isNum = /^\d+$/.test(digits);
        if (!isNum) {
            return badInputCallback(NXSystemMessages.formatError);
        }
        const wind = parseInt(digits);
        this._windDir = matchedIndex <= 2 ? this._windDirections.TAILWIND : this._windDirections.HEADWIND;
        if (wind > 250) {
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }
        this.averageWind = wind;
        return successCallback();
    }

    trySetPreSelectedClimbSpeed(s, badInputCallback, successCallback) {
        const isNextPhase = this.currentFlightPhase === FmgcFlightPhases.TAKEOFF;
        if (s === FMCMainDisplay.clrValue) {
            this.preSelectedClbSpeed = undefined;
            if (isNextPhase) {
                SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", -1);
                SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", -1);
            }
            return successCallback();
        }
        const v = parseFloat(s);
        if (isFinite(v)) {
            if (v < 1) {
                this.preSelectedClbSpeed = v;
                if (isNextPhase) {
                    SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", v);
                    SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", -1);
                }
            } else {
                this.preSelectedClbSpeed = Math.round(v);
                if (isNextPhase) {
                    SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", this.preSelectedClbSpeed);
                    SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", -1);
                }
            }
            return successCallback();
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    trySetPreSelectedCruiseSpeed(s, badInputCallback, successCallback) {
        const isNextPhase = this.currentFlightPhase === FmgcFlightPhases.CLIMB;
        if (s === FMCMainDisplay.clrValue) {
            this.preSelectedCrzSpeed = undefined;
            if (isNextPhase) {
                SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", -1);
                SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", -1);
            }
            return successCallback();
        }
        const v = parseFloat(s);
        if (isFinite(v)) {
            if (v < 1) {
                this.preSelectedCrzSpeed = v;
                if (isNextPhase) {
                    SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", v);
                    SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", -1);
                }
            } else {
                this.preSelectedCrzSpeed = Math.round(v);
                if (isNextPhase) {
                    SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", this.preSelectedCrzSpeed);
                    SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", -1);
                }
            }
            return successCallback();
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    trySetPreSelectedDescentSpeed(s, badInputCallback, successCallback) {
        const isNextPhase = this.currentFlightPhase === FmgcFlightPhases.CRUISE;
        if (s === FMCMainDisplay.clrValue) {
            this.preSelectedDesSpeed = undefined;
            if (isNextPhase) {
                SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", -1);
                SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", -1);
            }
            return successCallback();
        }
        const v = parseFloat(s);
        if (isFinite(v)) {
            if (v < 1) {
                this.preSelectedDesSpeed = v;
                if (isNextPhase) {
                    SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", v);
                    SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", -1);
                }
            } else {
                this.preSelectedDesSpeed = Math.round(v);
                if (isNextPhase) {
                    SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", this.preSelectedDesSpeed);
                    SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", -1);
                }
            }
            return successCallback();
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    setPerfApprQNH(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            const dest = this.flightPlanManager.getDestination();
            if (dest && dest.liveDistanceTo < 180) {
                return badInputCallback(NXSystemMessages.notAllowed);
            } else {
                this.perfApprQNH = NaN;
                return successCallback();
            }
        }

        const value = parseFloat(s);
        const HPA_REGEX = /^[01]?[0-9]{3}$/;
        const INHG_REGEX = /^([23][0-9]|[0-9]{2}\.)[0-9]{2}$/;

        if (HPA_REGEX.test(s)) {
            if (value >= 745 && value <= 1050) {
                this.perfApprQNH = value;
                SimVar.SetSimVarValue("L:A32NX_DESTINATION_QNH", "Millibar", this.perfApprQNH);
                return successCallback();
            } else {
                return badInputCallback(NXSystemMessages.entryOutOfRange);
            }
        } else if (INHG_REGEX.test(s)) {
            if (value >= 2200 && value <= 3100) {
                this.perfApprQNH = value / 100;
                SimVar.SetSimVarValue("L:A32NX_DESTINATION_QNH", "Millibar", this.perfApprQNH * 33.8639);
                return successCallback();
            } else if (value >= 22.0 && value <= 31.00) {
                this.perfApprQNH = value;
                SimVar.SetSimVarValue("L:A32NX_DESTINATION_QNH", "Millibar", this.perfApprQNH * 33.8639);
                return successCallback();
            } else {
                return badInputCallback(NXSystemMessages.entryOutOfRange);
            }
        }
        return badInputCallback(NXSystemMessages.formatError);
    }

    setPerfApprTemp(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            const dest = this.flightPlanManager.getDestination();
            if (dest && dest.liveDistanceTo < 180) {
                return badInputCallback(NXSystemMessages.notAllowed);
            } else {
                this.perfApprTemp = NaN;
                return successCallback();
            }
        }

        if (!/^[\+\-]?\d{1,2}$/.test(s)) {
            return badInputCallback(NXSystemMessages.formatError);
        }
        this.perfApprTemp = parseInt(s);
        return successCallback();
    }

    setPerfApprWind(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfApprWindHeading = NaN;
            this.perfApprWindSpeed = NaN;
            return successCallback();
        }

        // both must be entered
        if (!/^\d{1,3}\/\d{1,3}$/.test(s)) {
            return badInputCallback(NXSystemMessages.formatError);
        }
        const [dir, mag] = s.split("/").map((v) => parseInt(v));
        if (dir > 360 || mag > 500) {
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }
        this.perfApprWindHeading = dir % 360; // 360 is displayed as 0
        this.perfApprWindSpeed = mag;
        return successCallback();
    }

    setPerfApprTransAlt(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            // TODO when possible fetch default from database
            this.perfApprTransAlt = this.perfApprTransAltPilotEntered ? 10000 : NaN;
            this.perfApprTransAltPilotEntered = false;
            SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", this.perfApprTransAlt);
            return successCallback();
        }

        if (!/^\d{4,5}$/.test(s)) {
            return badInputCallback(NXSystemMessages.formatError);
        }
        const value = Math.round(parseInt(s) / 10) * 10;
        if (value < 1000 || value > 45000) {
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }

        this.perfApprTransAlt = value;
        this.perfApprTransAltPilotEntered = true;
        SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", value);
        return successCallback();
    }

    /**
     * VApp for _selected_ landing config
     */
    getVApp() {
        if (isFinite(this.vApp)) {
            return this.vApp;
        }
        return this.approachSpeeds.vapp;
    }

    //Needs PR Merge #3154
    setPerfApprVApp(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            if (isFinite(this.vApp)) {
                this.vApp = NaN;
                return successCallback();
            }
        } else {
            if (s.includes(".")) {
                return badInputCallback(NXSystemMessages.formatError);
            }
            const value = parseInt(s);
            if (isFinite(value) && value >= 90 && value <= 350) {
                this.vApp = value;
                return successCallback();
            }
            return badInputCallback(NXSystemMessages.entryOutOfRange);
        }
        return badInputCallback(NXSystemMessages.notAllowed);
    }

    /**
     * Tries to estimate the landing weight at destination
     * NaN on failure
     */
    tryEstimateLandingWeight() {
        const altActive = false;
        const landingWeight = this.zeroFuelWeight + (altActive ? this.getAltEFOB(true) : this.getDestEFOB(true));
        return isFinite(landingWeight) ? landingWeight : NaN;
    }

    setPerfApprMDA(s, badInputCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfApprMDA = NaN;
            SimVar.SetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "feet", 0);
            return true;
        } else if (s.match(/^[0-9]{1,5}$/) !== null) {
            const value = parseInt(s);
            let ldgRwy = this.flightPlanManager.getApproachRunway();
            if (!ldgRwy) {
                const dest = this.flightPlanManager.getDestination();
                if (dest && dest.infos && dest.infos.runways.length > 0) {
                    ldgRwy = dest.infos.runways[0];
                }
            }
            const limitLo = ldgRwy ? ldgRwy.elevation * 3.28084 : 0;
            const limitHi = ldgRwy ? ldgRwy.elevation * 3.28084 + 5000 : 39000;
            if (value >= limitLo && value <= limitHi) {
                this.perfApprMDA = value;
                SimVar.SetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "feet", this.perfApprMDA);
                return true;
            }
            badInputCallback(NXSystemMessages.entryOutOfRange);
            return false;
        } else {
            badInputCallback(NXSystemMessages.formatError);
            return false;
        }
    }

    setPerfApprDH(s, badInputCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfApprDH = NaN;
            SimVar.SetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "feet", -1);
            return true;
        }

        if (s === "NO" || s === "NO DH" || s === "NODH") {
            this.perfApprDH = "NO DH";
            SimVar.SetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "feet", -2);
            return true;
        } else if (s.match(/^[0-9]{1,5}$/) !== null) {
            const value = parseInt(s);
            if (value >= 0 && value <= 5000) {
                this.perfApprDH = value;
                SimVar.SetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "feet", this.perfApprDH);
                return true;
            } else {
                badInputCallback(NXSystemMessages.entryOutOfRange);
                return false;
            }
        } else {
            badInputCallback(NXSystemMessages.formatError);
            return false;
        }
    }

    setPerfApprFlaps3(s) {
        this.perfApprFlaps3 = s;
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_LANDING_CONF3", "boolean", s);
    }

    getIsFlying() {
        return this.currentFlightPhase >= FmgcFlightPhases.TAKEOFF;
    }

    tryGoInApproachPhase() {
        if (
            this.currentFlightPhase === FmgcFlightPhases.PREFLIGHT ||
            this.currentFlightPhase === FmgcFlightPhases.TAKEOFF ||
            this.currentFlightPhase === FmgcFlightPhases.DONE
        ) {
            return false;
        }

        if (this.currentFlightPhase !== FmgcFlightPhases.APPROACH) {
            this.flightPhaseManager.changeFlightPhase(FmgcFlightPhases.APPROACH);
        }

        return true;
    }

    connectIlsFrequency(_freq) {
        if (_freq >= 108 && _freq <= 111.95 && RadioNav.isHz50Compliant(_freq)) {
            switch (this.radioNav.mode) {
                case NavMode.FOUR_SLOTS: {
                    this.ilsFrequency = _freq;
                    break;
                }
                case NavMode.TWO_SLOTS: {
                    this.vor1Frequency = _freq;
                    break;
                }
            }
            this.connectIls();
            return true;
        }
        return false;
    }

    connectIls() {
        if (this.isRadioNavActive()) {
            return;
        }
        if (this._lockConnectIls) {
            return;
        }
        this._lockConnectIls = true;
        setTimeout(() => {
            this._lockConnectIls = false;
        }, 1000);
        switch (this.radioNav.mode) {
            case NavMode.FOUR_SLOTS: {
                if (Math.abs(this.radioNav.getILSActiveFrequency(1) - this.ilsFrequency) > 0.005) {
                    this.radioNav.setILSActiveFrequency(1, this.ilsFrequency);
                }
                break;
            }
            case NavMode.TWO_SLOTS: {
                if (Math.abs(this.radioNav.getVORActiveFrequency(1) - this.vor1Frequency) > 0.005) {
                    this.radioNav.setVORActiveFrequency(1, this.vor1Frequency);
                }
                break;
            }
            default:
                console.error("Unknown RadioNav operating mode");
                break;
        }
    }

    setIlsFrequency(s, badInputCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this.ilsFrequency = 0;
            this.radioNav.setILSActiveFrequency(1, 0);
            this._ilsFrequencyPilotEntered = false;
            return true;
        }
        const v = parseFloat(s);
        if (isFinite(v)) {
            const freq = Math.round(v * 100) / 100;
            if (this.connectIlsFrequency(freq)) {
                this._ilsFrequencyPilotEntered = true;
                this.clearAutotunedIls();
                return true;
            }
            badInputCallback(NXSystemMessages.entryOutOfRange);
            return false;
        }
        badInputCallback(NXSystemMessages.notAllowed);
        return false;
    }

    initRadioNav(_boot) {
        if (this.isPrimary) {
            console.log("Init RadioNav");
            {
                if (_boot) {
                    this.vhf1Frequency = this.radioNav.getVHFActiveFrequency(this.instrumentIndex, 1);
                    this.vhf2Frequency = this.radioNav.getVHFActiveFrequency(this.instrumentIndex, 2);
                } else {
                    if (Math.abs(this.radioNav.getVHFActiveFrequency(this.instrumentIndex, 1) - this.vhf1Frequency) > 0.005) {
                        this.radioNav.setVHFActiveFrequency(this.instrumentIndex, 1, this.vhf1Frequency);
                    }
                    if (Math.abs(this.radioNav.getVHFActiveFrequency(this.instrumentIndex, 2) - this.vhf2Frequency) > 0.005) {
                        this.radioNav.setVHFActiveFrequency(this.instrumentIndex, 2, this.vhf2Frequency);
                    }
                }
            }
            {
                if (Math.abs(this.radioNav.getVORActiveFrequency(1) - this.vor1Frequency) > 0.005) {
                    this.radioNav.setVORActiveFrequency(1, this.vor1Frequency);
                }
                if (this.vor1Course >= 0) {
                    SimVar.SetSimVarValue("K:VOR1_SET", "number", this.vor1Course);
                }
                this.connectIls();
            }
            {
                if (Math.abs(this.radioNav.getVORActiveFrequency(2) - this.vor2Frequency) > 0.005) {
                    this.radioNav.setVORActiveFrequency(2, this.vor2Frequency);
                }
                if (this.vor2Course >= 0) {
                    SimVar.SetSimVarValue("K:VOR2_SET", "number", this.vor2Course);
                }
                if (Math.abs(this.radioNav.getILSActiveFrequency(2) - 0) > 0.005) {
                    this.radioNav.setILSActiveFrequency(2, 0);
                }
            }
            {
                if (_boot) {
                    this.adf1Frequency = this.radioNav.getADFActiveFrequency(1);
                    this.adf2Frequency = this.radioNav.getADFActiveFrequency(2);
                } else {
                    if (Math.abs(this.radioNav.getADFActiveFrequency(1) - this.adf1Frequency) > 0.005) {
                        SimVar.SetSimVarValue("K:ADF_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(this.adf1Frequency * 1000)).then(() => {
                        });
                    }
                    if (Math.abs(this.radioNav.getADFActiveFrequency(2) - this.adf2Frequency) > 0.005) {
                        SimVar.SetSimVarValue("K:ADF2_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(this.adf2Frequency * 1000)).then(() => {
                        });
                    }
                }
            }
            {
                if (this.atc1Frequency > 0) {
                    SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", Avionics.Utils.make_xpndr_bcd16(this.atc1Frequency));
                } else {
                    this.atc1Frequency = SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number");
                }
            }
        }
    }

    canSwitchToNav() {
        if (!this._canSwitchToNav) {
            const altitude = Simplane.getAltitudeAboveGround();
            if (altitude >= 500) {
                this._canSwitchToNav = true;
            }
        }
        return this._canSwitchToNav;
    }

    isRadioNavActive() {
        return this.radioNav.getRADIONAVActive((this.isPrimary) ? 1 : 2);
    }

    get vhf1Frequency() {
        return this._vhf1Frequency;
    }

    get vhf2Frequency() {
        return this._vhf2Frequency;
    }

    get vor1Frequency() {
        return this._vor1Frequency;
    }

    get vor1Course() {
        return this._vor1Course;
    }

    get vor2Frequency() {
        return this._vor2Frequency;
    }

    get vor2Course() {
        return this._vor2Course;
    }

    get ilsFrequency() {
        return this._ilsFrequency;
    }

    get ilsCourse() {
        return this._ilsCourse;
    }

    get adf1Frequency() {
        return this._adf1Frequency;
    }

    get adf2Frequency() {
        return this._adf2Frequency;
    }

    get rcl1Frequency() {
        return this._rcl1Frequency;
    }

    get pre2Frequency() {
        return this._pre2Frequency;
    }

    get atc1Frequency() {
        return this._atc1Frequency;
    }

    set vhf1Frequency(_frq) {
        this._vhf1Frequency = _frq;
    }

    set vhf2Frequency(_frq) {
        this._vhf2Frequency = _frq;
    }

    set vor1Frequency(_frq) {
        this._vor1Frequency = _frq;
        SimVar.SetSimVarValue("L:FMC_VOR_FREQUENCY:1", "Hz", _frq * 1000000);
    }

    set vor1Course(_crs) {
        this._vor1Course = _crs;
    }

    set vor2Frequency(_frq) {
        this._vor2Frequency = _frq;
        SimVar.SetSimVarValue("L:FMC_VOR_FREQUENCY:2", "Hz", _frq * 1000000);
    }

    set vor2Course(_crs) {
        this._vor2Course = _crs;
    }

    set ilsFrequency(_frq) {
        this._ilsFrequency = _frq;
    }

    set ilsCourse(_crs) {
        this._ilsCourse = _crs;
    }

    set adf1Frequency(_frq) {
        this._adf1Frequency = _frq;
    }

    set adf2Frequency(_frq) {
        this._adf2Frequency = _frq;
    }

    set rcl1Frequency(_frq) {
        this._rcl1Frequency = _frq;
    }

    set pre2Frequency(_frq) {
        this._pre2Frequency = _frq;
    }

    set atc1Frequency(_frq) {
        this._atc1Frequency = _frq;
    }

    updateZfwVars() {
        const totalWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "kilograms") / 1000;
        const blockFuel = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons") * SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilograms") / 1000;
        this.zeroFuelWeight = totalWeight - blockFuel;
        this.zeroFuelWeightMassCenter = SimVar.GetSimVarValue("CG PERCENT", "percent");
    }

    updateFuelVars() {
        this.blockFuel = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons") * SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilograms") / 1000;
        this.updateZfwVars();
    }

    trySetFlapsTHS(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this.flaps = NaN;
            this.ths = NaN;
            SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_FLAPS", "number", 0);
            SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_FLAPS_ENTERED", "bool", false);
            SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_THS", "degree", 0);
            SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_THS_ENTERED", "bool", false);
            this.tryCheckToData();
            return successCallback();
        }

        let newFlaps = null;
        let newThs = null;

        let [flaps, ths] = s.split("/");

        if (flaps && flaps.length > 0) {
            if (!/^\d$/.test(flaps)) {
                return badInputCallback(NXSystemMessages.formatError);
            }

            flaps = parseInt(flaps);
            if (flaps < 0 || flaps > 3) {
                return badInputCallback(NXSystemMessages.entryOutOfRange);
            }

            newFlaps = flaps;
        }

        if (ths && ths.length > 0) {
            // allow AAN.N and N.NAA, where AA is UP or DN
            if (!/^(UP|DN)(\d|\d?\.\d|\d\.\d?)|(\d|\d?\.\d|\d\.\d?)(UP|DN)$/.test(ths)) {
                return badInputCallback(NXSystemMessages.formatError);
            }

            let direction = null;
            ths = ths.replace(/(UP|DN)/g, (substr) => {
                direction = substr;
                return "";
            });

            if (direction) {
                ths = parseFloat(ths);
                if (direction === "DN") {
                    // Note that 0 *= -1 will result in -0, which is strictly
                    // the same as 0 (that is +0 === -0) and doesn't make a
                    // difference for the calculation itself. However, in order
                    // to differentiate between DN0.0 and UP0.0 we'll do check
                    // later when displaying this value using Object.is to
                    // determine whether the pilot entered DN0.0 or UP0.0.
                    ths *= -1;
                }
                if (!isFinite(ths) || ths < -5 || ths > 7) {
                    return badInputCallback(NXSystemMessages.entryOutOfRange);
                }
                newThs = ths;
            }
        }

        if (newFlaps !== null) {
            if (!isNaN(this.flaps)) {
                this.tryCheckToData();
            }
            this.flaps = newFlaps;
            SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_FLAPS", "number", newFlaps);
            SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_FLAPS_ENTERED", "bool", true);
        }
        if (newThs !== null) {
            if (!isNaN(this.ths)) {
                this.tryCheckToData();
            }
            this.ths = newThs;
            SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_THS", "degree", newThs);
            SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_THS_ENTERED", "bool", true);
        }
        return successCallback();
    }

    checkEFOBBelowMin() {
        if (!this._minDestFobEntered) {
            this.tryUpdateMinDestFob();
        }
        const EFOBBelMin = this.isAnEngineOn() ? this.getDestEFOB(true) : this.getDestEFOB(false);

        if (EFOBBelMin < this._minDestFob) {
            if (this.isAnEngineOn()) {
                setTimeout(() => this.addMessageToQueue(NXSystemMessages.destEfobBelowMin), 180000);
            } else {
                this.addMessageToQueue(NXSystemMessages.destEfobBelowMin);
            }
        }
    }

    updateTowerHeadwind() {
        if (isFinite(this.perfApprWindSpeed) && isFinite(this.perfApprWindHeading)) {
            const rwy = this.flightPlanManager.getApproachRunway();
            if (rwy) {
                this._towerHeadwind = NXSpeedsUtils.getHeadwind(this.perfApprWindSpeed, this.perfApprWindHeading, rwy.direction);
            }
        }
    }

    _getV1Speed() {
        return (new NXSpeedsTo(SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") / 1000, this.flaps, Simplane.getAltitude())).v1;
    }

    _getVRSpeed() {
        return (new NXSpeedsTo(SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") / 1000, this.flaps, Simplane.getAltitude())).vr;
    }

    _getV2Speed() {
        return (new NXSpeedsTo(SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") / 1000, this.flaps, Simplane.getAltitude())).v2;
    }

    /**
     * Called after Flaps or THS change
     */
    tryCheckToData() {
        if (isFinite(this.v1Speed) || isFinite(this.vRSpeed) || isFinite(this.v2Speed)) {
            this.addMessageToQueue(NXSystemMessages.checkToData);
        }
    }

    /**
     * Called after runway change
     * - Sets confirmation prompt state for every entry whether it is defined or not
     * - Adds message when at least one entry needs to be confirmed
     * Additional:
     *   Only prompt the confirmation of FLEX TEMP when the TO runway was changed, not on initial insertion of the runway
     */
    onToRwyChanged() {
        const selectedRunway = this.flightPlanManager.getDepartureRunway();
        if (!!selectedRunway) {
            const toRunway = Avionics.Utils.formatRunway(selectedRunway.designation);
            if (toRunway === this.toRunway) {
                return;
            }
            if (!!this.toRunway) {
                this.toRunway = toRunway;
                this._toFlexChecked = !isFinite(this.perfTOTemp);
                this._v1Checked = !isFinite(this.v1Speed);
                this._vRChecked = !isFinite(this.vRSpeed);
                this._v2Checked = !isFinite(this.v2Speed);

                if (this._v1Checked && this._vRChecked && this._v2Checked && this._toFlexChecked) {
                    return;
                }
                this.addMessageToQueue(NXSystemMessages.checkToData, (mcdu) => mcdu._v1Checked && mcdu._vRChecked && mcdu._v2Checked && mcdu._toFlexChecked);
            }
            this.toRunway = toRunway;
        }
    }

    /**
     * Switches to the next/new perf page (if new flight phase is in order) or reloads the current page
     * @param _old {FmgcFlightPhases}
     * @param _new {FmgcFlightPhases}
     */
    tryUpdatePerfPage(_old, _new) {
        // Ensure we have a performance page selected...
        if (this.page.Current < this.page.PerformancePageTakeoff || this.page.Current > this.page.PerformancePageGoAround) {
            return;
        }

        const curPerfPagePhase = (() => {
            switch (this.page.Current) {
                case this.page.PerformancePageTakeoff : return FmgcFlightPhases.TAKEOFF;
                case this.page.PerformancePageClb : return FmgcFlightPhases.CLIMB;
                case this.page.PerformancePageCrz : return FmgcFlightPhases.CRUISE;
                case this.page.PerformancePageDes : return FmgcFlightPhases.DESCENT;
                case this.page.PerformancePageAppr : return FmgcFlightPhases.APPROACH;
                case this.page.PerformancePageGoAround : return FmgcFlightPhases.GOAROUND;
            }
        })();

        if (_new > _old) {
            if (_new >= curPerfPagePhase) {
                CDUPerformancePage.ShowPage(this, _new);
            }
        } else if (_old === curPerfPagePhase) {
            CDUPerformancePage.ShowPage(this, _old);
        }
    }

    routeReservedEntered() {
        return this._rteReservedWeightEntered || this._rteReservedPctEntered;
    }

    routeFinalEntered() {
        return this._rteFinalWeightEntered || this._rteFinalTimeEntered;
    }

    /**
     * LatLongAltCallback
     *
     * @callback LatLongAltCallback
     * @param {LatLongAlt} result
     * @param {number=} magVar magnetic variation if available
     */
    /**
     * McduMessageCallback
     *
     * @callback McduMessageCallback
     * @param {McduMessage} message
     */

    /**
     * Check if a place is the correct format for a runway
     * @param {string} s
     * @returns true if valid runway format
     */
    isRunwayFormat(s) {
        return s.match(/^([A-Z]{4})([0-9]{2}[RCL]?)$/) !== null;
    }

    /**
     * Parse a runway string and return the location of the threshold
     * Returns undefined if invalid format or not in database
     * @param {string} place
     * @param {LatLongAltCallback} onSuccess location of runway threshold
     * @param {McduMessageCallback} onError suggested error message
     */
    parseRunway(place, onSuccess, onError) {
        const rwy = place.match(/^([A-Z]{4})([0-9]{2}[RCL]?)$/);
        if (rwy !== null) {
            this.dataManager.GetAirportByIdent(rwy[1]).then((airport) => {
                if (airport) {
                    for (let i = 0; i < airport.infos.oneWayRunways.length; i++) {
                        if (Avionics.Utils.formatRunway(airport.infos.oneWayRunways[i].designation) === rwy[2]) {
                            const runway = airport.infos.oneWayRunways[i];
                            // this should be to the treshold but we don't have that, so we just use half the length
                            const adjustedCoordinates = Avionics.Utils.bearingDistanceToCoordinates(
                                (runway.direction + 180) % 360,
                                runway.length / 2 / 1852, // TODO unit conversion lib
                                runway.latitude, runway.longitude
                            );
                            return onSuccess(adjustedCoordinates, Facilities.getMagVar(adjustedCoordinates.lat, adjustedCoordinates.long));
                        }
                    }
                    return onError(NXSystemMessages.notInDatabase);
                }
            });
        } else {
            return onError(NXSystemMessages.notInDatabase);
        }
    }

    /**
     * Check if a place is the correct format for a latitude/longitude
     * @param {string} s
     * @returns true if valid lat/lon format
     */
    isLatLonFormat(s) {
        return s.match(/^(N|S)?([0-9]{2,4}\.[0-9])(N|S)?\/(E|W)?([0-9]{2,5}\.[0-9])(E|W)?$/) !== null;
    }

    /**
     * Parse a lat/lon string into a position
     * @param {string} place
     * @param {LatLongAltCallback} onSuccess location
     * @param {McduMessageCallback} onError suggested error message
     */
    parseLatLon(place, onSuccess, onError) {
        const latlon = place.match(/^(N|S)?([0-9]{2,4}\.[0-9])(N|S)?\/(E|W)?([0-9]{2,5}\.[0-9])(E|W)?$/);
        if (latlon !== null) {
            const latB = (latlon[1] || "") + (latlon[3] || "");
            const lonB = (latlon[4] || "") + (latlon[6] || "");
            const latDdigits = latlon[2].length === 4 ? 3 : 4;
            const latD = parseInt(latlon[2].substring(0, latlon[2].length - latDdigits));
            const latM = parseFloat(latlon[2].substring(latlon[2].length - latDdigits));
            const lonDdigits = latlon[5].length === 4 ? 3 : 4;
            const lonD = parseInt(latlon[5].substring(0, latlon[5].length - lonDdigits));
            const lonM = parseFloat(latlon[5].substring(latlon[5].length - lonDdigits));
            if (latB.length !== 1 || lonB.length !== 1 || !isFinite(latM) || !isFinite(lonM)) {
                return onError(NXSystemMessages.formatError);
            }
            if (latD > 90 || latM > 59.9 || lonD > 180 || lonM > 59.9) {
                return onError(NXSystemMessages.entryOutOfRange);
            }
            const lat = (latD + latM / 60) * (latB === "S" ? -1 : 1);
            const lon = (lonD + lonM / 60) * (lonB === "W" ? -1 : 1);
            const ll = new LatLongAlt(lat, lon);
            return onSuccess(ll, Facilities.getMagVar(ll.lat, ll.long));
        }
        return onError(NXSystemMessages.formatError);
    }

    /**
     * Check if a place is the correct format
     * @param {string} s
     * @returns true if valid place format
     */
    isPlaceFormat(s) {
        return s.match(/^[A-Z0-9]{2,6}$/) !== null || this.isRunwayFormat(s);
    }

    /**
     * Parse a place string into a position
     * @param {string} place
     * @param {LatLongAltCallback} onSuccess location
     * @param {McduMessageCallback} onError suggested error message
     */
    parsePlace(place, onSuccess, onError) {
        if (this.isRunwayFormat(place)) {
            this.parseRunway(place, onSuccess, onError);
        } else {
            this.getOrSelectWaypointByIdent(place, (waypoint) => {
                if (waypoint) {
                    return onSuccess(waypoint.infos.coordinates, waypoint.infos.magneticVariation || Facilities.getMagVar(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long));
                } else {
                    return onError(NXSystemMessages.notInDatabase);
                }
            });
        }
    }

    /**
     * Check if a string is a valid place-bearing/place-bearing format
     * @param {string} s
     * @returns true if valid place format
     */
    isPbPbFormat(s) {
        const pbpb = s.match(/^([^\-\/]+)\-([0-9]{1,3})\/([^\-\/]+)\-([0-9]{1,3})$/);
        return pbpb !== null && this.isPlaceFormat(pbpb[1]) && this.isPlaceFormat(pbpb[3]);
    }

    /**
     * Parse a p-b/p-b string into a position
     * @param {string} s place-bearing/place-bearing
     * @param {LatLongAltCallback} onSuccess location
     * @param {McduMessageCallback} onError suggested error message
     */
    parsePbPb(s, onSuccess, onError) {
        const pbpb = s.match(/^([^\-\/]+)\-([0-9]{1,3})\/([^\-\/]+)\-([0-9]{1,3})$/);
        if (pbpb === null) {
            return onError(NXSystemMessages.formatError);
        }
        const brg1 = parseInt(pbpb[2]);
        const brg2 = parseInt(pbpb[4]);
        if (brg1 > 360 || brg2 > 360) {
            return onError(NXSystemMessages.entryOutOfRange);
        }
        this.parsePlace(pbpb[1], (loc1, magVar1) => {
            this.parsePlace(pbpb[3], (loc2, magVar2) => {
                onSuccess(A32NX_Util.greatCircleIntersection(loc1, A32NX_Util.magneticToTrue(brg1, magVar1), loc2, A32NX_Util.magneticToTrue(brg2, magVar2)));
            }, (err2) => {
                onError(err2);
            });
        }, (err1) => {
            onError(err1);
        });
    }

    /**
     * Check if string is in place/bearing/distance format
     * @param {String} s
     * @returns true if pbd
     */
    isPbdFormat(s) {
        const pbd = s.match(/^([^\/]+)\/([0-9]{1,3})\/([0-9]{1,3}(\.[0-9])?)$/);
        return pbd !== null && this.isPlaceFormat(pbd[1]);
    }

    /**
     * Split PBD format into components
     * @param {String} s PBD format string
     * @returns [{string} place, {number} bearing, {number} distance]
     */
    splitPbd(s) {
        let [place, brg, dist] = s.split("/");
        brg = parseInt(brg);
        dist = parseInt(dist);
        return [place, brg, dist];
    }

    /**
     * Set the progress page bearing/dist location
     * @param {string} ident ident of the waypoint or runway, will be replaced by "ENTRY" if brg/dist offset are specified
     * @param {LatLongAlt} coordinates co-ordinates of the waypoint/navaid/runway, without brg/dist offset
     * @param {(number|undefined)} brg undefined or (true) bearing for offset
     * @param {(number|undefined)} dist undefined or dist for offset
     */
    _setProgLocation(ident, coordinates, brg, dist) {
        console.log(`progLocation: ${ident} ${coordinates} ${brg} ${dist}`);
        const displayIdent = (brg !== undefined && dist !== undefined) ? "ENTRY" : ident;
        let adjustedCoordinates = coordinates;
        if (brg !== undefined && dist !== undefined) {
            adjustedCoordinates = Avionics.Utils.bearingDistanceToCoordinates(brg % 360, dist, coordinates.lat, coordinates.long);
        }
        this._progBrgDist = {
            ident: displayIdent,
            coordinates: adjustedCoordinates,
            bearing: -1,
            distance: -1
        };

        this.updateProgDistance();
    }

    /**
     * Try to set the progress page bearing/dist waypoint/location
     * @param {String} s scratchpad entry
     * @param {Function} badInputCallback
     * @param {Function} successCallback
     */
    trySetProgWaypoint(s, badInputCallback, successCallback) {
        if (s === FMCMainDisplay.clrValue) {
            this._progBrgDist = undefined;
            return successCallback();
        }

        if (this.isLatLonFormat(s)) {
            this.parseLatLon(s, (loc) => {
                this._setProgLocation("ENTRY", loc);
                return successCallback();
            }, (err) => {
                return badInputCallback(err);
            });
        } else if (this.isPbPbFormat(s)) {
            this.parsePbPb(s, (loc) => {
                this._setProgLocation("ENTRY", loc);
                return successCallback();
            }, (err) => {
                return badInputCallback(err);
            });
        } else { // place or PBD
            let place, brg, dist;
            if (this.isPbdFormat(s)) {
                [place, brg, dist] = this.splitPbd(s);
                if (brg > 360 || dist > 999.9) {
                    return badInputCallback(NXSystemMessages.entryOutOfRange);
                }
            } else {
                place = s;
            }
            if (this.isPlaceFormat(place)) {
                this.parsePlace(place, (loc, magVar) => {
                    this._setProgLocation(place, loc, brg ? A32NX_Util.magneticToTrue(brg, magVar) : undefined, dist);
                    return successCallback();
                }, (err) => {
                    return badInputCallback(err);
                });
            } else {
                return badInputCallback(NXSystemMessages.formatError);
            }
        }
    }

    /**
     * Recalculate the bearing and distance for progress page
     */
    updateProgDistance() {
        if (!this._progBrgDist) {
            return;
        }

        const latitude = ADIRS.getLatitude();
        const longitude = ADIRS.getLongitude();

        if (!latitude.isNormalOperation() || !longitude.isNormalOperation()) {
            this._progBrgDist.distance = -1;
            this._progBrgDist.bearing = -1;
            return;
        }

        const planeLl = new LatLong(latitude.value, longitude.value);
        this._progBrgDist.distance = Avionics.Utils.computeGreatCircleDistance(planeLl, this._progBrgDist.coordinates);
        this._progBrgDist.bearing = A32NX_Util.trueToMagnetic(Avionics.Utils.computeGreatCircleHeading(planeLl, this._progBrgDist.coordinates));
    }

    get progBearing() {
        return this._progBrgDist ? this._progBrgDist.bearing : -1;
    }

    get progDistance() {
        return this._progBrgDist ? this._progBrgDist.distance : -1;
    }

    get progWaypointIdent() {
        return this._progBrgDist ? this._progBrgDist.ident : undefined;
    }

    /**
     * Add type 2 message to fmgc message queue
     * @param _message {McduMessage} MessageObject
     * @param _isResolvedOverride {function(*)} Function that determines if the error is resolved at this moment (type II only).
     * @param _onClearOverride {function(*)} Function that executes when the error is actively cleared by the pilot (type II only).
     */
    addMessageToQueue(_message, _isResolvedOverride = undefined, _onClearOverride = undefined) {
        if (!_message.isTypeTwo) {
            return;
        }
        const message = _isResolvedOverride === undefined && _onClearOverride === undefined ? _message : _message.modifyMessage("", _isResolvedOverride, _onClearOverride);
        this._messageQueue.addMessage(message);
    }

    /**
     * Removes a message from the queue
     * @param value {String|Integer}
     */
    removeMessageFromQueue(value) {
        this._messageQueue.removeMessage(value);
    }

    updateMessageQueue() {
        this._messageQueue.updateDisplayedMessage();
    }

    /* END OF MCDU GET/SET METHODS */
    /* UNSORTED CODE BELOW */

    //TODO: can this be util?
    static secondsToUTC(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds - h * 3600) / 60);
        return (h % 24).toFixed(0).padStart(2, "0") + m.toFixed(0).padStart(2, "0");
    }
    //TODO: can this be util?
    static secondsTohhmm(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds - h * 3600) / 60);
        return h.toFixed(0).padStart(2, "0") + m.toFixed(0).padStart(2, "0");
    }

    //TODO: can this be util?
    static minuteToSeconds(minutes) {
        return minutes * 60;
    }

    //TODO: can this be util?
    static hhmmToSeconds(hhmm) {
        if (!hhmm) {
            return NaN;
        }
        const h = parseInt(hhmm.substring(0, 2));
        const m = parseInt(hhmm.substring(2, 4));
        return h * 3600 + m * 60;
    }

    /**
     * Computes hour and minutes when given minutes
     * @param {number} minutes - minutes used to make the conversion
     * @returns {string} A string in the format "HHMM" e.g "0235"
     */
    //TODO: can this be util?
    static minutesTohhmm(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes - h * 60;
        return h.toFixed(0).padStart(2,"0") + m.toFixed(0).padStart(2, "0");
    }

    /**
     * computes minutes when given hour and minutes
     * @param {string} hhmm - string used to make the conversion
     * @returns {number} numbers in minutes form
     */
    //TODO: can this be util?
    static hhmmToMinutes(hhmm) {
        if (!hhmm) {
            return NaN;
        }
        const h = parseInt(hhmm.substring(0, 2));
        const m = parseInt(hhmm.substring(2, 4));
        return h * 60 + m;
    }

    //TODO: can this be util?
    getNavDataDateRange() {
        return SimVar.GetGameVarValue("FLIGHT NAVDATA DATE RANGE", "string");
    }

    /**
     * Returns true if an engine is running (FF > 0)
     * @returns {boolean}
     */
    //TODO: can this be an util?
    isAnEngineOn() {
        return Simplane.getEngineActive(0) || Simplane.getEngineActive(1);
    }

    /**
     * Returns true if all engines are running (FF > 0)
     * @returns {boolean}
     */
    //TODO: can this be an util?
    isAllEngineOn() {
        return Simplane.getEngineActive(0) && Simplane.getEngineActive(1);
    }

    /**
     * Returns the maximum cruise FL for ISA temp and GW
     * @param temp {number} ISA in C°
     * @param gw {number} GW in t
     * @returns {number} MAX FL
     */
    //TODO: can this be an util?
    getMaxFL(temp = A32NX_Util.getIsaTempDeviation(), gw = SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") / 1000) {
        return Math.round(temp <= 10 ? -2.778 * gw + 578.667 : (temp * (-0.039) - 2.389) * gw + temp * (-0.667) + 585.334);
    }

    /**
     * Returns the maximum allowed cruise FL considering max service FL
     * @param fl {number} FL to check
     * @returns {number} maximum allowed cruise FL
     */
    //TODO: can this be an util?
    getMaxFlCorrected(fl = this.getMaxFL()) {
        return fl >= this.maxCruiseFL ? this.maxCruiseFL : fl;
    }

    // only used by trySetMinDestFob
    //TODO: Can this be util?
    isMinDestFobInRange(fuel) {
        return 0 <= fuel && fuel <= 80.0;
    }

    //TODO: Can this be util?
    isTaxiFuelInRange(taxi) {
        return 0 <= taxi && taxi <= 9.9;
    }

    //TODO: Can this be util?
    isFinalFuelInRange(fuel) {
        return 0 <= fuel && fuel <= 100;
    }

    //TODO: Can this be util?
    isFinalTimeInRange(time) {
        const convertedTime = FMCMainDisplay.hhmmToMinutes(time.padStart(4,"0"));
        return 0 <= convertedTime && convertedTime <= 90;
    }

    //TODO: Can this be util?
    isRteRsvFuelInRange(fuel) {
        return 0 <= fuel && fuel <= 10.0;
    }

    //TODO: Can this be util?
    isRteRsvPercentInRange(value) {
        return value >= 0 && value <= 15.0;
    }

    //TODO: Can this be util?
    isZFWInRange(zfw) {
        return 35.0 <= zfw && zfw <= 80.0;
    }

    //TODO: Can this be util?
    isZFWCGInRange(zfwcg) {
        return (8.0 <= zfwcg && zfwcg <= 50.0);
    }

    //TODO: Can this be util?
    isBlockFuelInRange(fuel) {
        return 0 <= fuel && fuel <= 80;
    }

    /**
     *
     * @returns {*}
     */
    //TODO: Can this be util?
    getFOB() {
        return (SimVar.GetSimVarValue("FUEL TOTAL QUANTITY WEIGHT", "pound") * 0.453592) / 1000;
    }

    /**
     * retrieves GW in Tons
     * @returns {number}
     */
    //TODO: Can this be util?
    getGW() {
        return (SimVar.GetSimVarValue("TOTAL WEIGHT", "Pounds") * 0.45359237) / 1000;
    }

    //TODO: Can this be util?
    getCG() {
        return SimVar.GetSimVarValue("CG PERCENT", "Percent over 100") * 100;
    }

    //TODO: make this util or local var?
    isAirspeedManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT SPEED SLOT INDEX", "number") === 2;
    }

    //TODO: make this util or local var?
    isHeadingManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT HEADING SLOT INDEX", "number") === 2;
    }

    //TODO: make this util or local var?
    isAltitudeManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number") === 2;
    }

    /**
     * Check if the given string represents a decimal number.
     * This may be a whole number or a number with one or more decimals.
     * If the leading digit is 0 and one or more decimals are given, the leading digit may be omitted.
     * @param str {string} String to check
     * @returns {bool} True if str represents a decimal value, otherwise false
     */
    //TODO: Can this be util?
    representsDecimalNumber(str) {
        return /^[+-]?\d*(?:\.\d+)?$/.test(str);
    }
}

FMCMainDisplay.clrValue = "\xa0\xa0\xa0\xa0\xa0CLR";
FMCMainDisplay._AvailableKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
